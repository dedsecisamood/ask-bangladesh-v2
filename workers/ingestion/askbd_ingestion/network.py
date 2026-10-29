"""Strict URL and connection destinations. No resolver-to-client second lookup."""

import ipaddress
import queue
import re
import socket
from threading import Lock, Thread
from urllib.parse import urlsplit

from .models import Blocked, Code, Deadline, Policy

HOST = re.compile(r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+\Z")
PATH = re.compile(r"/[A-Za-z0-9/_~.\-]*\Z")


def validated_url(url: str, policy: Policy, *, robots: bool = False) -> tuple[str, str]:
    # Conservative ASCII canonical form. Percent encodings, Unicode host aliases,
    # all queries and dot segments require separate reviewed support later.
    if not isinstance(url, str) or len(url) > 2048 or not url.isascii():
        raise Blocked(Code.INVALID_URL)
    try:
        p = urlsplit(url)
        if (p.scheme != "https" or not p.hostname or not HOST.fullmatch(p.hostname)
                or p.netloc != p.hostname or p.port is not None or p.username
                or p.password or p.query or p.fragment or "?" in url or "#" in url
                or not PATH.fullmatch(p.path) or any(s in (".", "..") for s in p.path.split("/"))
                or "//" in p.path):
            raise Blocked(Code.INVALID_URL)
        if (p.hostname.split(".")[-1].isdigit() or p.hostname.endswith(
                (".localhost", ".local", ".internal", ".home.arpa"))):
            raise Blocked(Code.INVALID_URL)
        if url != f"https://{p.hostname}{p.path}":
            raise Blocked(Code.INVALID_URL)
        if p.hostname != policy.hostname or (url not in policy.urls and not (
                robots and url == f"https://{policy.hostname}/robots.txt")):
            raise Blocked(Code.OUT_OF_SCOPE)
        return p.hostname, p.path
    except ValueError:
        raise Blocked(Code.INVALID_URL) from None


def public_ipv4(value: str) -> str:
    try:
        ip = ipaddress.ip_address(value)
        if (ip.version != 4 or not ip.is_global or ip.is_multicast or ip.is_reserved
                or str(ip) != value or ip in ipaddress.ip_network("192.0.0.0/24")
                or value == "168.63.129.16"):  # Azure platform/control-plane VIP.
            raise ValueError()
        return str(ip)
    except ValueError:
        raise Blocked(Code.UNSAFE_ADDRESS) from None


class Resolver:
    """One bounded daemon lookup; a timed-out OS lookup cannot spawn a retry storm."""
    def __init__(self):
        self._slot = Lock()

    def resolve(self, hostname: str, deadline: Deadline) -> tuple[str, ...]:
        if not self._slot.acquire(blocking=False):
            raise Blocked(Code.BUSY)
        answers: queue.Queue = queue.Queue(maxsize=1)

        def lookup():
            try:
                answers.put(socket.getaddrinfo(hostname, 443, type=socket.SOCK_STREAM))
            except OSError:
                answers.put(None)
            finally:
                self._slot.release()

        Thread(target=lookup, daemon=True).start()
        while True:
            try:
                records = answers.get(timeout=deadline.remaining())
                break
            except queue.Empty:
                continue
        if not records or len(records) > 32:
            raise Blocked(Code.DNS_FAILURE)
        # Reject mixed safe/unsafe answers and ALL IPv6 conservatively. No fallback
        # to another client resolver, proxy environment or unvalidated candidate.
        return tuple(dict.fromkeys(public_ipv4(r[4][0]) for r in records))
