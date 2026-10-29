"""Offline adversarial tests. No government endpoints, DNS or real sockets."""

from dataclasses import replace
from datetime import datetime, timedelta, timezone
import io
from threading import Event
from time import monotonic
from unittest.mock import MagicMock, Mock

import pytest

from askbd_ingestion.crawler import Crawler
from askbd_ingestion.database import DatabaseSettings, worker_registry
from askbd_ingestion.models import Blocked, Code, Deadline, Policy, Response
from askbd_ingestion.network import Resolver, public_ipv4, validated_url
from askbd_ingestion.registry import SQLRegistry
from askbd_ingestion.robots import permitted
from askbd_ingestion.transport import PinnedHTTPS
from askbd_ingestion.transport import _Headers

HOST = "fixture.example.invalid"
URL = f"https://{HOST}/service/"
OTHER = f"https://{HOST}/service/notice.pdf"
ROBOTS = f"https://{HOST}/robots.txt"
HTML = b"<!doctype html><html><p>Synthetic fixture only</p></html>"


@pytest.fixture(autouse=True)
def no_external_io(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("Test attempted real network I/O")
    monkeypatch.setattr("socket.socket", forbidden)
    monkeypatch.setattr("socket.getaddrinfo", forbidden)


@pytest.fixture
def policy():
    return Policy("22000000-0000-4000-8000-000000000001", "22000000-0000-4000-8000-000000000002",
                  HOST, (URL, OTHER), datetime.now(timezone.utc) + timedelta(hours=1),
                  "AskBangladeshTest/1.0")


class Registry:
    def __init__(self, policy):
        self.value = policy
        self.records = []
        self.reservations = []

    def policy(self, source_id):
        if not self.value:
            raise Blocked(Code.NOT_APPROVED)
        return self.value

    def reserve(self, policy, url):
        self.reservations.append(url)
        return str(len(self.reservations))

    def finish(self, ticket, manifest):
        self.records.append(manifest)


class Transport:
    def __init__(self, responses=None):
        self.responses = {ROBOTS: Response(200, {"content-type": "text/plain"}, b"User-agent: *\nDisallow:\n"),
                          URL: Response(200, {"content-type": "text/html", "etag": '"fixture"'}, HTML),
                          OTHER: Response(200, {"content-type": "application/pdf"}, b"%PDF-1.7 fixture")}
        self.responses.update(responses or {})
        self.calls = []

    def get(self, url, policy, deadline, max_bytes):
        deadline.remaining()
        self.calls.append(url)
        result = self.responses[url]
        if isinstance(result, Exception):
            raise result
        return result


def execute(policy, responses=None):
    registry = Registry(policy)
    transport = Transport(responses)
    crawler = Crawler(registry, transport, network_ready=True)
    return crawler, registry, transport


def test_explicitly_disabled_by_default(policy):
    registry = Registry(policy)
    transport = Transport()
    assert Crawler(registry, transport).fetch(policy.source_id, URL).manifest.error == Code.DISABLED
    assert not transport.calls and not registry.reservations


@pytest.mark.parametrize("target", [URL, OTHER])
def test_approved_retrieval_metadata_and_quarantine(policy, target):
    crawler, registry, transport = execute(policy)
    result = crawler.fetch(policy.source_id, target)
    assert result.body and result.manifest.error is None
    assert result.manifest.final_url == target
    assert result.manifest.http_status == 200
    assert result.manifest.response_size == len(result.body)
    assert len(result.manifest.content_hash) == 64
    assert result.manifest.retrieved_at.tzinfo is not None
    assert transport.calls == [ROBOTS, target]
    assert registry.reservations == transport.calls
    assert registry.records[-1].content_hash == result.manifest.content_hash


def test_unapproved_before_network(policy):
    crawler, registry, transport = execute(policy)
    registry.value = None
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.NOT_APPROVED
    assert not transport.calls and not registry.reservations


def test_malformed_registry_policy_is_a_safe_unavailable_state(policy):
    crawler, registry, transport = execute(policy)
    registry.value = replace(policy, expires_at=datetime.now())  # Invalid naive timestamp.
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.REGISTRY_UNAVAILABLE
    assert not transport.calls and not registry.reservations


@pytest.mark.parametrize("url", [
    "http://fixture.example.invalid/service/", "file:///etc/passwd", "ftp://fixture.example.invalid/",
    "https://user:secret@fixture.example.invalid/service/", "https://fixture.example.invalid:443/service/",
    "https://fixture.example.invalid./service/", "https://FIXTURE.example.invalid/service/",
    "https://fixture.example.invalid/service/?nid=123", "https://fixture.example.invalid/service/#x",
    "https://fixture.example.invalid/service/%2e%2e/", "https://fixture.example.invalid/service/../",
    "https://fixture.example.invalid//service/", "https://fixture.example.invalid/service/\\x",
    "https://127.0.0.1/", "https://2130706433/", "https://[::1]/", "https://0x7f000001/",
    "https://fixture.example.invalid/service/\r\nX: y", "https://fıxture.example.invalid/",
    "https://fixture.example.invalid/service/?", "https://fixture.example.invalid/service/#",
    "https://evil.example.invalid/service/", "https://sub.fixture.example.invalid/service/",
    "https://fixture.example.invalid.evil.org/service/", "https://fixture.example.invalid/private/",
])
def test_url_bypasses_fail_before_dns(policy, url):
    crawler, registry, transport = execute(policy)
    assert crawler.fetch(policy.source_id, url).manifest.error in (Code.INVALID_URL, Code.OUT_OF_SCOPE)
    assert not transport.calls and not registry.reservations


@pytest.mark.parametrize("address", ["127.0.0.1", "0.0.0.0", "10.0.0.1", "172.16.0.1", "192.168.1.1",
    "169.254.169.254", "168.63.129.16", "100.100.100.200", "100.64.0.1", "192.0.0.9", "192.0.2.1", "198.18.0.1",
    "224.0.0.1", "255.255.255.255", "::1", "::ffff:8.8.8.8", "2606:4700:4700::1111", "0177.0.0.1"])
def test_unsafe_addresses(address):
    with pytest.raises(Blocked, match="UNSAFE_ADDRESS"):
        public_ipv4(address)


def test_public_ipv4():
    assert public_ipv4("1.1.1.1") == "1.1.1.1"


@pytest.mark.parametrize("addresses", [["1.1.1.1", "127.0.0.1"], ["::ffff:1.1.1.1"], []])
def test_dns_answers_all_validated(monkeypatch, addresses):
    monkeypatch.setattr("socket.getaddrinfo", lambda *a, **k: [(2, 1, 6, "", (a, 443)) for a in addresses])
    with pytest.raises(Blocked):
        Resolver().resolve(HOST, Deadline.start(Event()))


def test_dns_timeout_and_bounded_lookup(monkeypatch):
    gate = Event()
    def stuck(*args, **kwargs):
        gate.wait(2)
        return []
    monkeypatch.setattr("socket.getaddrinfo", stuck)
    resolver = Resolver()
    try:
        with pytest.raises(Blocked, match="TIMEOUT"):
            resolver.resolve(HOST, Deadline.start(Event(), 0.01))
        with pytest.raises(Blocked, match="BUSY"):
            resolver.resolve(HOST, Deadline.start(Event()))
    finally:
        gate.set()


def test_dns_failure_sanitized(monkeypatch):
    def fail(*args, **kwargs):
        raise OSError("PRIVATE host connection secret")
    monkeypatch.setattr("socket.getaddrinfo", fail)
    with pytest.raises(Blocked, match="^DNS_FAILURE$"):
        Resolver().resolve(HOST, Deadline.start(Event()))


@pytest.mark.parametrize("location", ["https://127.0.0.1/", "https://evil.example.invalid/",
    "http://fixture.example.invalid/service/", "/private/", "/service/../private/", "/service/%2fprivate", "//evil.example.invalid/"])
def test_redirect_revalidation(policy, location):
    crawler, registry, transport = execute(policy, {URL: Response(302, {"location": location}, b"")})
    assert crawler.fetch(policy.source_id, URL).manifest.error is not None
    assert transport.calls == [ROBOTS, URL]


def test_approved_redirect_and_robots_checked_at_target(policy):
    crawler, _, transport = execute(policy, {URL: Response(302, {"location": OTHER}, b"")})
    result = crawler.fetch(policy.source_id, URL)
    assert result.manifest.final_url == OTHER and result.body.startswith(b"%PDF")
    assert transport.calls == [ROBOTS, URL, OTHER]


def test_robots_blocks_redirect_target(policy):
    crawler, _, transport = execute(policy, {URL: Response(302, {"location": OTHER}, b""),
        ROBOTS: Response(200, {"content-type": "text/plain"}, b"User-agent: *\nDisallow: /service/notice")})
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.ROBOTS_DENIED
    assert transport.calls == [ROBOTS, URL]


@pytest.mark.parametrize("status", [401, 403, 407, 429, 500, 302])
def test_robots_restrictions_fail_closed(policy, status):
    crawler, _, transport = execute(policy, {ROBOTS: Response(status, {"location": URL}, b"")})
    assert crawler.fetch(policy.source_id, URL).manifest.error is not None
    assert transport.calls == [ROBOTS]


@pytest.mark.parametrize("status", [404, 410])
def test_absent_robots_still_requires_approval(policy, status):
    crawler, _, _ = execute(policy, {ROBOTS: Response(status, {}, b"")})
    assert crawler.fetch(policy.source_id, URL).manifest.error is None


@pytest.mark.parametrize("rules", [b"User-agent: *\nDisallow: /service/", b"<html>login</html>",
    b"User-agent: *\nDisallow: /*.pdf$", b"User-agent: *\nCrawl-delay: 10", b"invalid",
    b"Disallow: /", b"User-agent: *\nRequest-rate: 1/60", b"\xff", b"User-agent:\n"])
def test_ambiguous_robots_denied(rules):
    with pytest.raises(Blocked, match="ROBOTS_DENIED"):
        permitted(rules, "/service/")


@pytest.mark.parametrize("response,code", [
    (Response(200, {"content-type": "application/zip"}, b"PK"), Code.UNSUPPORTED_TYPE),
    (Response(200, {"content-type": "application/pdf"}, HTML), Code.UNSUPPORTED_TYPE),
    (Response(200, {"content-type": "text/html", "content-encoding": "gzip"}, HTML), Code.UNSUPPORTED_TYPE),
    (Response(200, {"content-type": "text/html"}, b"<html>CAPTCHA challenge</html>"), Code.ACCESS_RESTRICTED),
    (Response(200, {"content-type": "text/html"}, b'<html><input type="password"></html>'), Code.ACCESS_RESTRICTED),
    (Response(403, {}, b""), Code.ACCESS_RESTRICTED), (Response(404, {}, b""), Code.HTTP_ERROR),
    (Response(500, {}, b""), Code.HTTP_ERROR), (Blocked(Code.TIMEOUT), Code.TIMEOUT),
    (OSError("SECRET password in upstream message"), Code.CONNECTION_FAILURE),
    (Response(200, {"content-type": "text/html", "etag": "x\r\nsecret"}, HTML), Code.INVALID_RESPONSE),
])
def test_response_failures_private_manifest(policy, response, code):
    crawler, registry, _ = execute(policy, {URL: response})
    result = crawler.fetch(policy.source_id, URL)
    assert result.manifest.error == code and not result.body
    assert registry.records[-1].error == code
    assert registry.records[-1].content_hash is None
    assert registry.records[-1].retrieved_at is None


def test_oversize(policy):
    policy = replace(policy, max_bytes=100)
    crawler, registry, _ = execute(policy, {URL: Response(200, {"content-type": "text/html"}, HTML * 10)})
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.TOO_LARGE
    assert registry.records[-1].error == Code.TOO_LARGE


def test_redirect_limit(policy):
    crawler, _, _ = execute(replace(policy, max_redirects=0), {URL: Response(302, {"location": OTHER}, b"")})
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.REDIRECT_LIMIT


def test_revocation_at_delivery_discards_bytes(policy):
    crawler, registry, transport = execute(policy)
    original = transport.get
    def revoked(url, *args):
        response = original(url, *args)
        if url == URL:
            registry.value = None
        return response
    transport.get = revoked
    result = crawler.fetch(policy.source_id, URL)
    assert result.manifest.error == Code.NOT_APPROVED and not result.body


def test_cancel_and_global_inflight_limit(policy):
    crawler, _, transport = execute(policy)
    cancel = Event()
    cancel.set()
    assert crawler.fetch(policy.source_id, URL, cancel).manifest.error == Code.CANCELLED
    assert not transport.calls
    crawler._inflight.acquire()
    try:
        assert crawler.fetch(policy.source_id, URL).manifest.error == Code.BUSY
    finally:
        crawler._inflight.release()


def test_durable_budget_denial(policy):
    crawler, registry, transport = execute(policy)
    def denied(*args):
        raise Blocked(Code.BUDGET)
    registry.reserve = denied
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.BUDGET
    assert not transport.calls


def test_persistence_outage_discards_bytes(policy):
    crawler, registry, _ = execute(policy)
    registry.finish = Mock(side_effect=RuntimeError("secret password"))
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.REGISTRY_UNAVAILABLE


class FakeSocket:
    def __init__(self, raw, peer="1.1.1.1"):
        self.raw = raw
        self.peer = peer
        self.connected = None
        self.sent = b""
        self.closed = False
    def settimeout(self, timeout):
        assert 0 < timeout <= 5
    def connect(self, address):
        self.connected = address
    def getpeername(self):
        return self.peer, 443
    def makefile(self, *args):
        return io.BytesIO(self.raw)
    def sendall(self, data):
        self.sent += data
    def close(self):
        self.closed = True


def pinned_fixture(monkeypatch, raw, peer="1.1.1.1"):
    sock = FakeSocket(raw, peer)
    monkeypatch.setattr("socket.socket", lambda *args: sock)
    context = Mock()
    context.wrap_socket.return_value = sock
    monkeypatch.setattr("ssl.create_default_context", lambda: context)
    resolver = Mock()
    resolver.resolve.return_value = ("1.1.1.1",)
    return PinnedHTTPS(resolver), sock, context, resolver


def test_actual_transport_pins_ip_and_tls_hostname_no_second_dns(policy, monkeypatch):
    raw = b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: 5\r\n\r\nhello"
    transport, sock, context, resolver = pinned_fixture(monkeypatch, raw)
    result = transport.get(URL, policy, Deadline.start(Event()), 100)
    assert result.body == b"hello"
    assert sock.connected == ("1.1.1.1", 443) and sock.closed
    context.wrap_socket.assert_called_once_with(sock, server_hostname=HOST)
    assert f"Host: {HOST}".encode() in sock.sent
    assert b"Cookie:" not in sock.sent and b"Authorization:" not in sock.sent
    assert resolver.resolve.call_count == 1


def test_connected_peer_rebinding_rejected_before_http(policy, monkeypatch):
    transport, sock, _, _ = pinned_fixture(monkeypatch, b"", peer="8.8.8.8")
    with pytest.raises(Blocked, match="PEER_MISMATCH"):
        transport.get(URL, policy, Deadline.start(Event()), 100)
    assert not sock.sent and sock.closed


@pytest.mark.parametrize("raw,code", [
    (b"HTTP/1.1 200 OK\r\nContent-Length: 101\r\n\r\n", Code.TOO_LARGE),
    (b"HTTP/1.1 200 OK\r\nX: " + b"a" * 9000 + b"\r\n\r\n", Code.TOO_LARGE),
    (b"HTTP/1.1 200 OK\r\nContent-Length: 1\r\nContent-Length: 1\r\n\r\na", Code.INVALID_RESPONSE),
    (b"HTTP/1.1 200 OK\r\nContent-Length: 10\r\n\r\nabc", Code.INVALID_RESPONSE),
    (b"HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\n\r\n", Code.INVALID_RESPONSE),
    (b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nContent-Length: 5\r\n\r\n", Code.INVALID_RESPONSE),
    (b"HTTP/1.1 200 OK\r\n\r\n" + b"a" * 101, Code.TOO_LARGE),
    (b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n65\r\n" + b"a" * 101 + b"\r\n0\r\n\r\n", Code.TOO_LARGE),
])
def test_transport_bounded_framing(policy, monkeypatch, raw, code):
    transport, sock, _, _ = pinned_fixture(monkeypatch, raw)
    with pytest.raises(Blocked, match=code.value):
        transport.get(URL, policy, Deadline.start(Event()), 100)
    assert sock.closed


def test_transport_timeout_and_tls_failure(policy, monkeypatch):
    import ssl
    transport, sock, context, _ = pinned_fixture(monkeypatch, b"")
    context.wrap_socket.side_effect = ssl.SSLError("PRIVATE certificate text")
    with pytest.raises(Blocked, match="^TLS_FAILURE$"):
        transport.get(URL, policy, Deadline.start(Event()), 100)
    sock.connect = Mock(side_effect=TimeoutError("PRIVATE"))
    with pytest.raises(Blocked, match="^TIMEOUT$"):
        transport.get(URL, policy, Deadline.start(Event()), 100)


def test_db_adapter_parameterizes_and_sanitizes(policy):
    connection = MagicMock()
    cursor = connection.cursor.return_value
    cursor.fetchone.return_value = ({"error": "NOT_APPROVED"},)
    registry = SQLRegistry(connection)
    with pytest.raises(Blocked, match="NOT_APPROVED"):
        registry.policy(policy.source_id)
    cursor.execute.assert_called_once_with("SELECT app_worker.crawl_policy(%s)", (policy.source_id,))
    cursor.execute.side_effect = RuntimeError("postgresql://SECRET")
    with pytest.raises(Blocked, match="^REGISTRY_UNAVAILABLE$"):
        registry.policy(policy.source_id)
    connection.rollback.assert_called_once()


@pytest.mark.parametrize("changes", [
    {"user": "postgres"}, {"password": ""}, {"host": "remote.example.invalid"},
    {"database": "postgres"}, {"port": 5432},
])
def test_database_settings_reject_unsafe_local_targets(changes):
    settings = DatabaseSettings("127.0.0.1", "askbd_p14_test_" + "a" * 32,
                                "isolated_worker", "synthetic_password", 54322, True)
    with pytest.raises(Blocked, match="REGISTRY_UNAVAILABLE"):
        replace(settings, **changes).validate()


def test_database_secrets_redacted_and_remote_tls_required(monkeypatch):
    settings = DatabaseSettings("db.example.invalid", "worker_db", "isolated_worker", "PRIVATE_SYNTHETIC_PASSWORD")
    assert "PRIVATE_SYNTHETIC_PASSWORD" not in repr(settings)
    connection = MagicMock()
    cursor = connection.cursor.return_value
    cursor.fetchone.return_value = [False]
    connect = Mock(return_value=connection)
    monkeypatch.setattr("pg8000.dbapi.connect", connect)
    with worker_registry(settings):
        pass
    import ssl
    context = connect.call_args.kwargs["ssl_context"]
    assert context.check_hostname and context.verify_mode == ssl.CERT_REQUIRED
    assert connect.call_args.kwargs["timeout"] == 3
    assert any(call.args == ("SET ROLE askbd_worker",) for call in cursor.execute.call_args_list)
    connection.close.assert_called_once()


def test_privileged_database_login_is_rejected(monkeypatch):
    settings = DatabaseSettings("db.example.invalid", "worker_db", "isolated_worker", "synthetic")
    connection = MagicMock()
    connection.cursor.return_value.fetchone.return_value = [True]
    monkeypatch.setattr("pg8000.dbapi.connect", Mock(return_value=connection))
    with pytest.raises(Blocked, match="REGISTRY_UNAVAILABLE"):
        with worker_registry(settings):
            pytest.fail("Privileged connection was exposed")


def test_slow_drip_headers_obey_absolute_deadline(monkeypatch):
    clock = [0.0]
    class Drip:
        def read(self, count):
            clock[0] += 0.2
            return b"a"
    monkeypatch.setattr("askbd_ingestion.models.monotonic", lambda: clock[0])
    reader = _Headers(Drip(), Deadline.start(Event(), seconds=1))
    with pytest.raises(Blocked, match="TIMEOUT"):
        reader.readline()
    assert clock[0] <= 1.2


def test_redirect_new_connection_rechecks_dns(policy, monkeypatch):
    transport, _, _, resolver = pinned_fixture(monkeypatch, b"HTTP/1.1 302 Found\r\nLocation: /service/notice.pdf\r\n\r\n")
    resolver.resolve.side_effect = [("1.1.1.1",), ("127.0.0.1",)]
    assert transport.get(URL, policy, Deadline.start(Event()), 100).status == 302
    with pytest.raises(Blocked, match="UNSAFE_ADDRESS"):
        transport.get(OTHER, policy, Deadline.start(Event()), 100)
    assert resolver.resolve.call_count == 2


def test_retry_after_is_private_and_does_not_trigger_http_retry(policy):
    crawler, registry, transport = execute(policy, {URL: Response(503, {'retry-after':'7200'}, b'')})
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.HTTP_ERROR
    assert registry.records[-1].retry_after_seconds == 7200
    assert transport.calls == [ROBOTS,URL]


@pytest.mark.parametrize('value', ['-1','not-a-date','9999999999999'])
def test_ambiguous_retry_after_requires_review(policy, value):
    crawler, _, _ = execute(policy, {URL:Response(503,{'retry-after':value},b'')})
    assert crawler.fetch(policy.source_id, URL).manifest.error == Code.ACCESS_RESTRICTED
