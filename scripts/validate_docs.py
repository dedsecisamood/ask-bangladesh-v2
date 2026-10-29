"""Offline structural checks for the Phase 0 planning package; no app tests."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "AGENTS.md", "README.md", "PLANS.md", "docs/PRD.md",
    "docs/ARCHITECTURE.md", "docs/DATABASE.md", "docs/DESIGN_SYSTEM.md",
    "docs/SOURCE_POLICY.md", "docs/SECURITY.md", "docs/AI_SYSTEM.md",
    "docs/EVALUATION.md", "docs/DEPLOYMENT.md", "docs/ROADMAP.md",
)
LINK = re.compile(r"(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)")
FENCE = re.compile(r"^\s*(`{3,}|~{3,})")


def prose_only(text: str) -> str:
    """Ignore fenced examples; this is deliberately not a full Markdown parser."""
    result: list[str] = []
    fence_char: str | None = None
    fence_length = 0
    for line in text.splitlines():
        marker = FENCE.match(line)
        if marker:
            token = marker.group(1)
            if fence_char is None:
                fence_char, fence_length = token[0], len(token)
                continue
            if token[0] == fence_char and len(token) >= fence_length:
                fence_char = None
                continue
        if fence_char is None:
            result.append(line)
    return "\n".join(result)


def validate(root: Path = ROOT) -> tuple[list[str], int]:
    errors: list[str] = []
    docs: dict[str, str] = {}
    local_links = 0
    for name in REQUIRED:
        path = root / name
        if not path.is_file():
            errors.append(f"Missing required file: {name}")
            continue
        try:
            text = path.read_text(encoding="utf-8-sig")
        except UnicodeError as exc:
            errors.append(f"Invalid UTF-8: {name}: {exc}")
            continue
        docs[name] = text
        if not re.search(r"^# \S", text, re.MULTILINE):
            errors.append(f"Missing document title: {name}")
        if "\ufffd" in text:
            errors.append(f"Unicode replacement character: {name}")
        for raw in LINK.findall(prose_only(text)):
            target = raw.strip()
            if target.startswith("<") and ">" in target:
                target = target[1:target.index(">")]
            else:
                target = target.split(' "', 1)[0].split(" '", 1)[0]
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            # Anchor contents are intentionally outside this small checker's scope.
            local_links += 1
            destination = (path.parent / unquote(parsed.path)).resolve()
            if not destination.is_relative_to(root.resolve()):
                errors.append(f"Local link escapes workspace: {name}: {target}")
            elif not destination.is_file():
                errors.append(f"Broken local file link: {name}: {target}")

    prd = docs.get("docs/PRD.md", "")
    ids = set(re.findall(r"\bCAP-\d{2}\b", prd))
    expected = {f"CAP-{number:02}" for number in range(1, 31)}
    if ids != expected:
        errors.append(
            "PRD capability IDs differ: missing=" + str(sorted(expected - ids))
            + ", unexpected=" + str(sorted(ids - expected))
        )
    roadmap = docs.get("docs/ROADMAP.md", "")
    for number in range(13):
        if not re.search(rf"\bPhase\s+{number}(?!\d)\b", roadmap, re.IGNORECASE):
            errors.append(f"Roadmap missing Phase {number}")
    if not re.search(r"\bfuture\b", roadmap, re.IGNORECASE):
        errors.append("Roadmap missing future scope")
    return errors, local_links


def main() -> int:
    errors, count = validate()
    if errors:
        print("FAIL: Phase 0 documentation structure")
        for error in errors:
            print(f"- {error}")
        return 1
    print(
        f"PASS: {len(REQUIRED)} required documents, {count} local file links, "
        "CAP-01..CAP-30, Phase 0..12 and future scope."
    )
    print("Structural checks only; external URLs and product behavior are not tested.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
