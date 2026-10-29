"""Conservative robots subset: ambiguous/unsupported rules pause for review."""

from .models import Blocked, Code


def permitted(body: bytes, path: str) -> None:
    try:
        text = body.decode("utf-8-sig", errors="strict")
    except UnicodeError:
        raise Blocked(Code.ROBOTS_DENIED) from None
    if len(body) > 512_000 or "<" in text or "\x00" in text:
        raise Blocked(Code.ROBOTS_DENIED)
    # All groups' disallows are honored. This deliberately over-restricts sites
    # instead of treating unsupported precedence/wildcards as permission.
    agent_seen = False
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        if ":" not in line:
            raise Blocked(Code.ROBOTS_DENIED)
        key, value = (s.strip() for s in line.split(":", 1))
        key = key.lower()
        if key == "user-agent":
            if not value:
                raise Blocked(Code.ROBOTS_DENIED)
            agent_seen = True
        elif key in ("disallow", "allow"):
            if not agent_seen or (value and (not value.startswith("/") or any(
                    c in value for c in "*%$?\\"))):
                raise Blocked(Code.ROBOTS_DENIED)
            if key == "disallow" and value and path.startswith(value):
                raise Blocked(Code.ROBOTS_DENIED)
        elif key == "crawl-delay":
            if not value.isdecimal() or int(value) > 5:
                raise Blocked(Code.ROBOTS_DENIED)
        elif key != "sitemap":
            raise Blocked(Code.ROBOTS_DENIED)
