"""Small contracts shared by authorization, transport and later extractors."""

from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from threading import Event
from time import monotonic
from typing import Protocol


class Code(StrEnum):
    DISABLED = "DISABLED"
    NOT_APPROVED = "NOT_APPROVED"
    INVALID_URL = "INVALID_URL"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    UNSAFE_ADDRESS = "UNSAFE_ADDRESS"
    PEER_MISMATCH = "PEER_MISMATCH"
    DNS_FAILURE = "DNS_FAILURE"
    TIMEOUT = "TIMEOUT"
    CANCELLED = "CANCELLED"
    BUSY = "BUSY"
    BUDGET = "BUDGET"
    ROBOTS_DENIED = "ROBOTS_DENIED"
    ACCESS_RESTRICTED = "ACCESS_RESTRICTED"
    REDIRECT_LIMIT = "REDIRECT_LIMIT"
    UNSUPPORTED_TYPE = "UNSUPPORTED_TYPE"
    TOO_LARGE = "TOO_LARGE"
    INVALID_RESPONSE = "INVALID_RESPONSE"
    HTTP_ERROR = "HTTP_ERROR"
    TLS_FAILURE = "TLS_FAILURE"
    CONNECTION_FAILURE = "CONNECTION_FAILURE"
    REGISTRY_UNAVAILABLE = "REGISTRY_UNAVAILABLE"


class Blocked(Exception):
    def __init__(self, code: Code):
        self.code = code
        super().__init__(code.value)  # Never include exception text, URLs or bodies.


@dataclass(frozen=True)
class Policy:
    source_id: str
    policy_id: str
    hostname: str
    urls: tuple[str, ...]
    expires_at: datetime
    user_agent: str
    max_bytes: int = 5_242_880
    max_redirects: int = 3


@dataclass(frozen=True)
class Response:
    status: int
    headers: dict[str, str]
    body: bytes


@dataclass(frozen=True)
class Manifest:
    source_id: str
    requested_url: str
    final_url: str | None
    retrieved_at: datetime | None
    http_status: int | None
    content_type: str | None
    response_size: int
    content_hash: str | None
    etag: str | None
    last_modified: str | None
    error: Code | None
    retry_after_seconds: int | None = None


@dataclass(frozen=True)
class Retrieval:
    manifest: Manifest
    body: bytes = b""  # Untrusted quarantine input, never an approved document.


@dataclass
class Deadline:
    cancel: Event
    ends_at: float

    @classmethod
    def start(cls, cancel: Event, seconds: float = 30) -> "Deadline":
        return cls(cancel, monotonic() + seconds)

    def remaining(self) -> float:
        if self.cancel.is_set():
            raise Blocked(Code.CANCELLED)
        remaining = self.ends_at - monotonic()
        if remaining <= 0:
            raise Blocked(Code.TIMEOUT)
        return min(remaining, 0.5)  # Short I/O slices also bound cancellation delay.


class Registry(Protocol):
    def policy(self, source_id: str) -> Policy: ...
    def reserve(self, policy: Policy, url: str) -> str: ...
    def finish(self, ticket: str, manifest: Manifest) -> None: ...


class Transport(Protocol):
    def get(self, url: str, policy: Policy, deadline: Deadline,
            max_bytes: int) -> Response: ...
