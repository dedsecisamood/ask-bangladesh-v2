"""Bounded stdlib HTML tree, with no scripts, external resources or network."""

from dataclasses import dataclass, field
from html.parser import HTMLParser
import re
from urllib.parse import urljoin, urlsplit

from .extraction import Block, Extraction, ExtractionError, Limits, check_bytes, digest, quality

VOID = frozenset("area base br col embed hr img input link meta param source track wbr".split())
OMIT = frozenset("script style nav header footer aside form button iframe object embed svg math noscript template head".split())
BLOCKS = frozenset("p li tr caption blockquote pre dt dd h1 h2 h3 h4 h5 h6".split())


@dataclass
class Node:
    tag: str
    attrs: dict
    path: str
    offset: int
    children: list = field(default_factory=list)
    counts: dict = field(default_factory=dict)


class Tree(HTMLParser):
    def __init__(self, source: str, limits: Limits):
        super().__init__(convert_charrefs=True)
        self.root = Node("root", {}, "", 0)
        self.stack = [self.root]
        self.limits = limits
        self.count = 0
        self.text_count = 0
        self.malformed = False
        self.lines = [0]
        for match in re.finditer("\n", source):
            self.lines.append(match.end())

    def handle_starttag(self, tag, attrs):
        self.count += 1
        if self.count > self.limits.nodes or len(self.stack) > self.limits.depth:
            raise ExtractionError("HTML_STRUCTURE_LIMIT")
        if len(attrs) > 64 or any(len(k) + len(v or "") > 4096 for k, v in attrs):
            raise ExtractionError("HTML_ATTRIBUTE_LIMIT")
        parent = self.stack[-1]
        ordinal = parent.counts.get(tag, 0) + 1
        parent.counts[tag] = ordinal
        line, col = self.getpos()
        node = Node(tag, dict(attrs), f"{parent.path}/{tag}[{ordinal}]", self.lines[line - 1] + col)
        parent.children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                self.malformed |= index != len(self.stack) - 1
                del self.stack[index:]
                return
        if tag not in VOID:
            self.malformed = True

    def handle_data(self, data):
        self.text_count += len(data)
        if self.text_count > self.limits.text_chars:
            raise ExtractionError("TEXT_LIMIT")
        self.stack[-1].children.append(data)


def hidden(n: Node) -> bool:
    style = (n.attrs.get("style") or "").replace(" ", "").lower()
    return n.tag in OMIT or "hidden" in n.attrs or n.attrs.get("aria-hidden") == "true" or "display:none" in style or "visibility:hidden" in style


def text(n: Node) -> str:
    if hidden(n):
        return ""
    if n.tag == "br":
        return "\n"
    separator = " | " if n.tag == "tr" else " " if n.tag in ("table", "ul", "ol") else ""
    return separator.join(c if isinstance(c, str) else text(c) for c in n.children)


def walk(n: Node):
    yield n
    for child in n.children:
        if isinstance(child, Node):
            yield from walk(child)


def extract_html(data: bytes, source_url: str, limits: Limits = Limits()) -> Extraction:
    check_bytes(data, limits)
    try:
        source = data.decode("utf-8-sig", errors="strict")
    except UnicodeError:
        raise ExtractionError("HTML_ENCODING") from None
    if "<!entity" in source.lower() or "\x00" in source:
        raise ExtractionError("HTML_UNSAFE")
    tree = Tree(source, limits)
    tree.feed(source)
    tree.close()
    nodes = list(walk(tree.root))
    titles = [n for n in nodes if n.tag == "title"]
    title = ("".join(c for c in titles[0].children if isinstance(c, str)).strip()[:500] if titles else "Untitled captured document")
    # Do not select main/article hidden inside a script/template/form subtree.
    visible = []
    def collect(n):
        if hidden(n):
            return
        visible.append(n)
        for c in n.children:
            if isinstance(c, Node):
                collect(c)
    collect(tree.root)
    candidates = [n for n in visible if n.tag == "main"] or [n for n in visible if n.tag == "article"]
    flags = [] if candidates else ["main_content_fallback"]
    root = candidates[0] if candidates else next((n for n in visible if n.tag == "body"), tree.root)
    if tree.malformed or len(tree.stack) != 1:
        flags.append("malformed_html")
    headings = []
    blocks = []
    links = []
    def record_links(n):
        if hidden(n):
            return
        if n.tag == "a" and n.attrs.get("href") and len(links) < 200:
            href = n.attrs["href"]
            if len(href) <= 2048 and not any(ord(c) < 32 for c in href):
                url = urljoin(source_url, href)
                try:
                    parsed = urlsplit(url)
                    if parsed.scheme == "https" and parsed.hostname and not parsed.username and not parsed.password:
                        links.append({"url": url, "text": text(n).strip()[:200], "dom_path": n.path, "trusted": False})
                except ValueError:
                    pass
        for child in n.children:
            if isinstance(child, Node):
                record_links(child)
    record_links(root)
    def emit(n):
        if hidden(n):
            return
        if n.tag in BLOCKS:
            value = re.sub(r"[\t\r\n ]+", " ", text(n)).strip()
            if value:
                if n.tag.startswith("h") and n.tag[1:].isdigit():
                    level = int(n.tag[1])
                    del headings[level - 1:]
                    headings.append(value[:120])
                blocks.append(Block(value, tuple(headings[-8:]), locator={"kind": "html", "dom_path": n.path, "html_character_offset": n.offset}, flags=("table_review",) if n.tag in ("tr", "caption") else ()))
            return
        pending = []
        def flush():
            value = re.sub(r"[\t\r\n ]+", " ", ''.join(pending)).strip()
            if value:
                blocks.append(Block(value, tuple(headings[-8:]), locator={"kind": "html", "dom_path": n.path, "html_character_offset": n.offset}))
            pending.clear()
        for c in n.children:
            if isinstance(c, str):
                pending.append(c)
            elif not hidden(c):
                if c.tag in BLOCKS or c.tag in ('div', 'section', 'article', 'main', 'table', 'thead', 'tbody', 'ul', 'ol', 'dl'):
                    flush()
                    emit(c)
                else:
                    pending.append(text(c))
        flush()
    emit(root)
    combined = "\n\n".join(b.text for b in blocks)
    if not combined.strip():
        raise ExtractionError("EMPTY_EXTRACTION")
    return Extraction(digest(data), title, "text/html", tuple(blocks), tuple(links), tuple(sorted(set(flags + list(quality(combined))))), {"html": "stdlib-htmlparser-v1"})
