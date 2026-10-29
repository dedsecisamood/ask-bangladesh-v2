"""Bounded stdlib HTTPS transport, with explicit destination pinning and TLS SNI."""

import http.client
import socket
import ssl
from time import monotonic

from .models import Blocked, Code, Deadline, Policy, Response
from .network import Resolver, public_ipv4, validated_url


class _Headers:
    def __init__(self, stream, deadline: Deadline):
        self.stream = stream
        self.deadline = deadline
        self.total = 0

    def readline(self, limit=-1):
        # A socket inactivity timeout alone permits indefinite slow-drip lines.
        # Inspect the absolute deadline between bytes, including chunk framing.
        value = bytearray()
        ceiling = min(8193, limit) if limit >= 0 else 8193
        while len(value) < ceiling:
            self.deadline.remaining()
            part = self.stream.read(1)
            if not part:
                break
            value.extend(part)
            self.total += len(part)
            if len(value) > 8192 or self.total > 32768:
                raise Blocked(Code.TOO_LARGE)
            if part == b"\n":
                break
        return bytes(value)

    def __getattr__(self, name):
        return getattr(self.stream, name)


class PinnedHTTPS:
    def __init__(self, resolver=None):
        self.resolver = resolver or Resolver()

    def get(self, url: str, policy: Policy, deadline: Deadline, max_bytes: int) -> Response:
        host, path = validated_url(url, policy, robots=True)
        addresses = self.resolver.resolve(host, deadline)
        if not addresses:
            raise Blocked(Code.DNS_FAILURE)
        for address in addresses:
            public_ipv4(address)
        # A numeric AF_INET socket cannot independently re-resolve the hostname.
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        secured = None
        response = None
        try:
            # A complete connect/TLS/read operation has a five second ceiling,
            # with an overall deadline checked between all streaming operations.
            sock.settimeout(min(5, max(0.001, deadline.ends_at - monotonic())))
            deadline.remaining()
            sock.connect((addresses[0], 443))
            if public_ipv4(sock.getpeername()[0]) != addresses[0]:
                raise Blocked(Code.PEER_MISMATCH)
            context = ssl.create_default_context()
            context.minimum_version = ssl.TLSVersion.TLSv1_2
            sock.settimeout(min(5, max(0.001, deadline.ends_at - monotonic())))
            secured = context.wrap_socket(sock, server_hostname=host)
            if public_ipv4(secured.getpeername()[0]) != addresses[0]:
                raise Blocked(Code.PEER_MISMATCH)
            deadline.remaining()
            secured.settimeout(min(0.5, max(0.001, deadline.ends_at - monotonic())))
            secured.sendall((f"GET {path} HTTP/1.1\r\nHost: {host}\r\n"
                             f"User-Agent: {policy.user_agent}\r\n"
                             "Accept: text/html, application/pdf, text/plain\r\n"
                             "Accept-Encoding: identity\r\nConnection: close\r\n\r\n").encode("ascii"))
            response = http.client.HTTPResponse(secured)
            response.fp = _Headers(response.fp, deadline)
            response.begin()
            headers = {}
            for key, value in response.getheaders():
                key = key.lower()
                if key in headers or "\r" in value or "\n" in value or len(value) > 2048:
                    raise Blocked(Code.INVALID_RESPONSE)
                headers[key] = value
            if (headers.get("content-encoding", "identity").lower() != "identity"
                    or headers.get("transfer-encoding", "").lower() not in ("", "chunked")
                    or ("transfer-encoding" in headers and "content-length" in headers)):
                raise Blocked(Code.INVALID_RESPONSE)
            length = headers.get("content-length")
            if length is not None:
                if not length.isascii() or not length.isdecimal():
                    raise Blocked(Code.INVALID_RESPONSE)
                if len(length) > 9 or int(length) > max_bytes:
                    raise Blocked(Code.TOO_LARGE)
            # Error/redirect bodies need not be read, and never become documents.
            if response.status != 200:
                return Response(response.status, headers, b"")
            body = bytearray()
            while True:
                deadline.remaining()
                secured.settimeout(min(0.5, max(0.001, deadline.ends_at - monotonic())))
                # A slow/stalled stream is a timeout, never retried on this socket.
                part = response.read1(min(65536, max_bytes + 1 - len(body)))
                if not part:
                    break
                body.extend(part)
                if len(body) > max_bytes:
                    raise Blocked(Code.TOO_LARGE)
            if length is not None and len(body) != int(length):
                raise Blocked(Code.INVALID_RESPONSE)
            return Response(response.status, headers, bytes(body))
        except Blocked:
            raise
        except (TimeoutError, socket.timeout):
            raise Blocked(Code.TIMEOUT) from None
        except ssl.SSLError:
            raise Blocked(Code.TLS_FAILURE) from None
        except (http.client.HTTPException, ValueError):
            raise Blocked(Code.INVALID_RESPONSE) from None
        except OSError:
            raise Blocked(Code.CONNECTION_FAILURE) from None
        finally:
            if response is not None:
                response.close()
            if secured is not None:
                secured.close()
            sock.close()
