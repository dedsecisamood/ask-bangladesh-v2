"""Conservative Unicode cleaning and immutable raw-text locators (no NFKC)."""

import unicodedata
from .extraction import Extraction, ExtractionError, canonical_json, digest, language, quality

PROFILE = "nfc-whitespace-v1/page-section-chunks-v1"


def normalize(raw: str) -> tuple[str, list[list[int]]]:
    result = []
    offsets = []
    index = 0
    while index < len(raw):
        end = index + 1
        while end < len(raw) and unicodedata.category(raw[end]).startswith("M"):
            end += 1
        atom = unicodedata.normalize("NFC", raw[index:end])
        for c in atom:
            if c.isspace():
                if result and result[-1] != " ":
                    result.append(" ")
                    offsets.append([index, end])
                elif offsets:
                    offsets[-1][1] = end
            else:
                result.append(c)
                offsets.append([index, end])
        index = end
    if result and result[-1] == " ":
        result.pop()
        offsets.pop()
    return "".join(result), offsets


def segment(extraction: Extraction, *, max_chars: int = 1200) -> dict:
    if not 100 <= max_chars <= 4000:
        raise ExtractionError("CHUNK_LIMIT")
    passages = []
    artifact_blocks = []
    raw_offset = 0
    for block_number, block in enumerate(extraction.blocks):
        normalized, mapping = normalize(block.text)
        artifact_blocks.append({"raw": block.text, "normalized": normalized, "offset_map": mapping, "raw_offset": raw_offset, "page": block.page, "locator": block.locator})
        start = 0
        while start < len(block.text):
            end = min(start + max_chars, len(block.text))
            if end < len(block.text):
                boundary = block.text.rfind(" ", start + max_chars // 2, end)
                if boundary > start:
                    end = boundary
            raw = block.text[start:end]
            cleaned, _ = normalize(raw)
            if cleaned:
                flags = sorted(set(block.flags + extraction.flags + quality(raw)))
                locator = {**block.locator, "block": block_number, "raw_start": raw_offset + start, "raw_end": raw_offset + end}
                passages.append({"ordinal": len(passages), "text": raw, "normalized_text": cleaned,
                    "section_path": list(block.section), "heading": block.section[-1] if block.section else None,
                    "page_number": block.page, "page_label": block.page_label,
                    "character_start": raw_offset + start, "character_end": raw_offset + end,
                    "language": language(raw), "locator": locator, "flags": flags,
                    "quality_status": "pending"})
            start = end
        raw_offset += len(block.text) + 2
    if not passages or len(passages) > 1000:
        raise ExtractionError("PASSAGE_LIMIT")
    tools = {**extraction.tools, "normalization_chunking": PROFILE, "max_chars": max_chars}
    return {"schema": "askbd-extraction-v1", "content_hash": extraction.content_hash,
        "profile": "p5-" + digest(canonical_json(tools)), "tools": tools,
        "title": extraction.title, "media_type": extraction.media_type,
        "published_at": None, "flags": sorted(set(extraction.flags + tuple(f for p in passages for f in p["flags"]))),
        "raw_text_hash": digest(extraction.text.encode("utf-8")), "blocks": artifact_blocks,
        "links": list(extraction.links), "passages": passages}
