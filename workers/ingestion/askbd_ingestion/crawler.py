"""One explicit document, never recursive. No CLI, scheduler or automatic crawl."""

from dataclasses import replace
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from hashlib import sha256
from threading import Event, Lock
from time import monotonic
from urllib.parse import urljoin

from .models import (Blocked, Code, Deadline, Manifest, Policy, Registry,
                     Response, Retrieval, Transport)
from .network import validated_url
from .robots import permitted


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _validator(value: str | None) -> str | None:
    # Cache values are untrusted private metadata, not dates or verification.
    if value is None:
        return None
    if len(value) > 256 or not value.isascii() or any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise Blocked(Code.INVALID_RESPONSE)
    return value


def _retry_after(value: str) -> int:
    try:
        if len(value) > 100:
            raise ValueError()
        if value.isascii() and value.isdecimal():
            delay = int(value)
        else:
            date = parsedate_to_datetime(value)
            if date.tzinfo is None:
                raise ValueError()
            delay = max(0, int((date - _now()).total_seconds()) + 1)
        if not 0 <= delay <= 86400:
            raise ValueError()
        return delay
    except (ValueError, TypeError, OverflowError):
        # Unknown/very long waiting instructions require review, not early retry.
        raise Blocked(Code.ACCESS_RESTRICTED) from None


class Crawler:
    def __init__(self, registry: Registry, transport: Transport, *, network_ready: bool = False):
        self.registry = registry
        self.transport = transport
        # No environment enable switch. The future isolated composition must
        # attest its independent egress boundary; this task never enables it.
        self.network_ready = network_ready
        self._inflight = Lock()

    def _policy(self, source_id: str) -> Policy:
        try:
            policy = self.registry.policy(source_id)
        except Blocked:
            raise
        except Exception:
            raise Blocked(Code.REGISTRY_UNAVAILABLE) from None
        if (policy.source_id != source_id or policy.expires_at <= _now()
                or not 1 <= policy.max_bytes <= 5_242_880
                or not 0 <= policy.max_redirects <= 5
                or not policy.user_agent.isascii() or not 1 <= len(policy.user_agent) <= 200
                or any(ord(c) < 32 or ord(c) > 126 for c in policy.user_agent)):
            raise Blocked(Code.NOT_APPROVED)
        return policy

    def _hop(self, policy: Policy, url: str, deadline: Deadline, robots: bool) -> Response:
        validated_url(url, policy, robots=robots)
        if self._policy(policy.source_id) != policy:
            raise Blocked(Code.NOT_APPROVED)
        deadline.remaining()
        while True:
            deadline.remaining()
            try:
                ticket = self.registry.reserve(policy, url)
                break
            except Blocked as error:
                if error.code != Code.BUSY:
                    raise
                # Admission waiting only; never retry an HTTP request. Source
                # policy and durable budget are checked on every reservation.
                deadline.cancel.wait(min(1, max(0, deadline.ends_at - monotonic())))
            except Exception:
                raise Blocked(Code.REGISTRY_UNAVAILABLE) from None
        manifest = Manifest(policy.source_id, url, None, None, None, None, 0, None, None, None, None)
        try:
            response = self.transport.get(url, policy, deadline, min(policy.max_bytes, 512_000) if robots else policy.max_bytes)
            deadline.remaining()
            mime = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
            manifest = replace(manifest, final_url=url, http_status=response.status,
                               content_type=mime or None, response_size=len(response.body))
            if response.status in (429, 503) and 'retry-after' in response.headers:
                manifest = replace(manifest, retry_after_seconds=_retry_after(response.headers['retry-after']))
            if len(response.body) > (min(policy.max_bytes, 512_000) if robots else policy.max_bytes):
                raise Blocked(Code.TOO_LARGE)
            if response.status in (401, 403, 407, 429) or "www-authenticate" in response.headers:
                raise Blocked(Code.ACCESS_RESTRICTED)
            if response.status == 200:
                if (response.headers.get("content-encoding", "identity").lower() != "identity"
                        or mime not in (("text/plain",) if robots else ("text/html", "application/pdf"))):
                    raise Blocked(Code.UNSUPPORTED_TYPE)
                prefix = response.body[:65536].lower()
                if any(marker in prefix for marker in (b"captcha", b"type=\"password\"", b"type='password'", b"access denied", b"sign in to continue", b"login required")):
                    raise Blocked(Code.ACCESS_RESTRICTED)
                if not robots and not ((mime == "application/pdf" and response.body.startswith(b"%PDF-")) or (
                        mime == "text/html" and response.body.lstrip().lower().startswith((b"<!doctype html", b"<html")))):
                    raise Blocked(Code.UNSUPPORTED_TYPE)
                manifest = replace(manifest, retrieved_at=_now(), content_hash=sha256(response.body).hexdigest(),
                                   etag=_validator(response.headers.get("etag")),
                                   last_modified=_validator(response.headers.get("last-modified")))
            elif response.status not in (301, 302, 303, 307, 308) and not (robots and response.status in (404, 410)):
                raise Blocked(Code.HTTP_ERROR)
            if response.status in (301, 302, 303, 307, 308):
                if robots:
                    raise Blocked(Code.ROBOTS_DENIED)
                location = response.headers.get("location")
                if not location or len(location) > 2048:
                    raise Blocked(Code.INVALID_RESPONSE)
                if any(c in location for c in "\\%?#") or any(s in (".", "..") for s in location.split("/")):
                    raise Blocked(Code.INVALID_URL)
                validated_url(urljoin(url, location), policy)
        except Blocked as error:
            manifest = replace(manifest, retrieved_at=None, content_hash=None, error=error.code)
            self._finish(ticket, manifest)
            raise
        except Exception:
            self._finish(ticket, replace(manifest, error=Code.CONNECTION_FAILURE))
            raise Blocked(Code.CONNECTION_FAILURE) from None
        self._finish(ticket, manifest)
        return response

    def _finish(self, ticket: str, manifest: Manifest) -> None:
        try:
            self.registry.finish(ticket, manifest)
        except Exception:
            raise Blocked(Code.REGISTRY_UNAVAILABLE) from None

    def fetch(self, source_id: str, url: str, cancel: Event | None = None) -> Retrieval:
        empty = Manifest(source_id, "", None, None, None, None, 0, None, None, None, None)
        if not self.network_ready:
            return Retrieval(replace(empty, error=Code.DISABLED))
        if not self._inflight.acquire(blocking=False):
            return Retrieval(replace(empty, error=Code.BUSY))
        try:
            deadline = Deadline.start(cancel or Event())
            deadline.remaining()
            policy = self._policy(source_id)
            _, path = validated_url(url, policy)
            empty = replace(empty, requested_url=url)
            robots_url = f"https://{policy.hostname}/robots.txt"
            robot_response = self._hop(policy, robots_url, deadline, True)
            # Off-path robots redirects/ambiguous responses require review.
            if robot_response.status not in (200, 404, 410):
                raise Blocked(Code.ROBOTS_DENIED)
            rules = robot_response.body if robot_response.status == 200 else b""
            current = url
            visited = set()
            for hop in range(policy.max_redirects + 1):
                _, path = validated_url(current, policy)
                permitted(rules, path)
                if current in visited:
                    raise Blocked(Code.REDIRECT_LIMIT)
                visited.add(current)
                response = self._hop(policy, current, deadline, False)
                if response.status == 200:
                    # Withdrawal during transport suppresses the bytes at delivery.
                    if self._policy(source_id) != policy:
                        raise Blocked(Code.NOT_APPROVED)
                    deadline.remaining()
                    return Retrieval(Manifest(source_id, url, current, _now(), 200,
                        response.headers["content-type"].split(";", 1)[0].strip().lower(),
                        len(response.body), sha256(response.body).hexdigest(),
                        _validator(response.headers.get("etag")),
                        _validator(response.headers.get("last-modified")), None), response.body)
                if hop >= policy.max_redirects:
                    raise Blocked(Code.REDIRECT_LIMIT)
                location = response.headers.get("location")
                if not location or len(location) > 2048:
                    raise Blocked(Code.INVALID_RESPONSE)
                # Validate raw relative syntax before urljoin normalizes dot paths.
                if any(c in location for c in "\\%?#") or any(s in (".", "..") for s in location.split("/")):
                    raise Blocked(Code.INVALID_URL)
                current = urljoin(current, location)
            raise Blocked(Code.REDIRECT_LIMIT)
        except Blocked as error:
            return Retrieval(replace(empty, error=error.code))
        except Exception:
            return Retrieval(replace(empty, error=Code.REGISTRY_UNAVAILABLE))
        finally:
            self._inflight.release()
