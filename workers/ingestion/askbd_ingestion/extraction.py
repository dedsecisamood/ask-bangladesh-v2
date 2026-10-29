"""Offline extraction contracts. Content and tool metadata remain untrusted."""

from dataclasses import asdict, dataclass, field
from hashlib import sha256
import json
import re
import unicodedata


class ExtractionError(Exception):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class Limits:
    input_bytes: int = 5_242_880
    text_chars: int = 250_000
    nodes: int = 20_000
    depth: int = 64
    pages: int = 50
    page_pixels: int = 10_000_000
    ocr_pages: int = 10
    ocr_seconds: int = 60


@dataclass(frozen=True)
class Block:
    text: str
    section: tuple[str, ...] = ()
    page: int | None = None
    page_label: str | None = None
    locator: dict = field(default_factory=dict)
    flags: tuple[str, ...] = ()
    method: str = "html"


@dataclass(frozen=True)
class Extraction:
    content_hash: str
    title: str
    media_type: str
    blocks: tuple[Block, ...]
    links: tuple[dict, ...]
    flags: tuple[str, ...]
    tools: dict
    published_at: None = None  # Never derive official publication from PDF/crawl dates.

    @property
    def text(self) -> str:
        return "\n\n".join(b.text for b in self.blocks)

    def serializable(self) -> dict:
        return asdict(self)


def language(text: str) -> str:
    bn = sum("\u0980" <= c <= "\u09ff" for c in text)
    latin = sum(c.isascii() and c.isalpha() for c in text)
    if bn and latin:
        return "mixed"
    return "bn" if bn else "en" if latin else "unknown"


def quality(text: str) -> tuple[str, ...]:
    flags = []
    visible = [c for c in text if not c.isspace()]
    if len(visible) < 30:
        flags.append("sparse_text")
    if "\ufffd" in text or any(unicodedata.category(c) == "Cc" and c not in "\n\r\t" for c in text):
        flags.append("corrupt_text")
    if re.search(r"(?:NID|passport|জাতীয় পরিচয়|পাসপোর্ট)\s*[:#]?\s*[0-9০-৯]{8,}", text, re.I):
        flags.append("possible_personal_data")
    if re.search(r"(?:ignore (?:all |previous )?instructions|system prompt|execute command)", text, re.I):
        flags.append("instruction_like_content")
    return tuple(flags)


def check_bytes(data: bytes, limits: Limits):
    if not data or len(data) > limits.input_bytes:
        raise ExtractionError("INPUT_LIMIT")


def canonical_json(value) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(data: bytes) -> str:
    return sha256(data).hexdigest()
