"""Text PDF/OCR extraction. Call only inside the networkless resource sandbox."""

import base64
from dataclasses import replace
import csv
from functools import lru_cache
import io
import math
from pathlib import Path
import subprocess
import tempfile
from time import monotonic

from .extraction import Block, Extraction, ExtractionError, Limits, check_bytes, digest, quality

FORBIDDEN = frozenset(('/JavaScript', '/JS', '/OpenAction', '/AA', '/Launch', '/EmbeddedFiles', '/EF', '/XFA', '/AcroForm', '/RichMedia', '/SubmitForm', '/GoToR'))


def inspect_tree(value, limits: Limits):
    from pypdf.generic import DictionaryObject, IndirectObject, ArrayObject
    seen = set()
    count = 0
    def visit(v, depth):
        nonlocal count
        count += 1
        if count > limits.nodes or depth > limits.depth:
            raise ExtractionError("PDF_STRUCTURE_LIMIT")
        if isinstance(v, IndirectObject):
            key = (v.idnum, v.generation)
            if key in seen:
                return
            seen.add(key)
            v = v.get_object()
        if isinstance(v, DictionaryObject):
            if any(k in FORBIDDEN for k in v) or str(v.get('/S')) in FORBIDDEN:
                raise ExtractionError("PDF_ACTIVE_CONTENT")
            if v.get('/Subtype') == '/Image':
                if int(v.get('/Width', 0)) * int(v.get('/Height', 0)) > limits.page_pixels:
                    raise ExtractionError("PDF_IMAGE_LIMIT")
            for item in v.values():
                visit(item, depth + 1)
        elif isinstance(v, ArrayObject):
            for item in v:
                visit(item, depth + 1)
    visit(value, 0)


@lru_cache(maxsize=1)
def ocr_tools() -> dict:
    version = subprocess.run(["tesseract", "--version"], capture_output=True, timeout=5, check=True).stdout.decode('utf-8').splitlines()[0]
    renderer = subprocess.run(["pdftoppm", "-v"], capture_output=True, timeout=5, check=True).stderr.decode('utf-8').splitlines()[0]
    models = {}
    for lang in ('ben', 'eng'):
        paths = list(Path('/usr/share/tesseract-ocr').glob(f'*/tessdata/{lang}.traineddata'))
        if len(paths) != 1:
            raise ExtractionError("OCR_MODEL_UNAVAILABLE")
        models[lang] = digest(paths[0].read_bytes())
    return {'ocr': version, 'renderer': renderer, 'traineddata': models, 'ocr_config': 'ben+eng/oem1/psm6/150dpi/max3000-v1'}


def recognize(pdf: Path, page: int, directory: Path, limits: Limits):
    from PIL import Image
    target = directory / f'page-{page}'
    try:
        subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-singlefile', '-r', '150',
                        '-scale-to', '3000', '-png', str(pdf), str(target)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30, check=True)
        image = target.with_suffix('.png')
        if image.stat().st_size > 4_000_000:
            raise ExtractionError('OCR_IMAGE_LIMIT')
        with Image.open(image) as parsed:
            width, height = parsed.size
            if width * height > limits.page_pixels:
                raise ExtractionError('OCR_IMAGE_LIMIT')
        subprocess.run(['tesseract', str(image), str(target), '-l', 'ben+eng', '--oem', '1', '--psm', '6', 'tsv'],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=limits.ocr_seconds, check=True)
        output = target.with_suffix('.tsv')
        if output.stat().st_size > 4_000_000:
            raise ExtractionError('OCR_TEXT_LIMIT')
        lines = {}
        confidence = []
        for row in csv.DictReader(io.StringIO(output.read_text(encoding='utf-8')), delimiter='\t'):
            word = (row.get('text') or '').strip()
            if row.get('level') != '5' or not word:
                continue
            key = tuple(row[k] for k in ('page_num', 'block_num', 'par_num', 'line_num'))
            lines.setdefault(key, []).append(word)
            score = float(row['conf'])
            if math.isfinite(score) and score >= 0:
                confidence.append(score)
        value = '\n'.join(' '.join(words) for words in lines.values())
        if len(value) > limits.text_chars:
            raise ExtractionError('TEXT_LIMIT')
        image_bytes = image.read_bytes()
        return value, sum(confidence) / len(confidence) if confidence else 0.0, image_bytes, width, height
    except subprocess.TimeoutExpired:
        raise ExtractionError('OCR_TIMEOUT') from None
    except (OSError, subprocess.CalledProcessError, ValueError, KeyError):
        raise ExtractionError('OCR_FAILED') from None


def extract_pdf(data: bytes, limits: Limits = Limits()) -> tuple[Extraction, dict[str, str]]:
    import pypdf
    from pypdf import PdfReader, filters
    check_bytes(data, limits)
    if not data.startswith(b'%PDF-'):
        raise ExtractionError('PDF_SIGNATURE')
    filters.MAX_OUTPUT_LENGTH = 10_000_000
    try:
        reader = PdfReader(io.BytesIO(data), strict=True)
        if reader.is_encrypted:
            raise ExtractionError('PDF_ENCRYPTED')
        inspect_tree(reader.trailer, limits)
        count = len(reader.pages)
        if not 1 <= count <= limits.pages:
            raise ExtractionError('PDF_PAGE_LIMIT')
        labels = reader.page_labels if '/PageLabels' in reader.trailer['/Root'] else [None] * count
        title = str((reader.metadata or {}).get('/Title', '')).strip()[:500] or 'Untitled captured document'
        blocks = []
        images = {}
        tools = {'pdf': 'pypdf-' + pypdf.__version__, 'pdf_policy': 'strict-native-or-ocr-v1'}
        text_total = 0
        decoded_total = 0
        ocr_count = 0
        began = monotonic()
        with tempfile.TemporaryDirectory(prefix='askbd-pdf-') as folder:
            directory = Path(folder)
            original = directory / 'capture.pdf'
            original.write_bytes(data)
            for number, page in enumerate(reader.pages, 1):
                if monotonic() - began > 240:
                    raise ExtractionError('DOCUMENT_TIMEOUT')
                if not all(math.isfinite(float(v)) and abs(float(v)) < 100000 for v in page.mediabox):
                    raise ExtractionError('PDF_DIMENSIONS')
                content = page.get_contents()
                if content:
                    decoded_total += len(content.get_data())
                    if decoded_total > 20_000_000:
                        raise ExtractionError('PDF_STREAM_LIMIT')
                value = page.extract_text() or ''
                method = 'pdf_text'
                flags = list(quality(value))
                locator = {'kind': 'pdf', 'physical_page': number, 'displayed_label': labels[number - 1]}
                if 'sparse_text' in flags or 'corrupt_text' in flags:
                    ocr_count += 1
                    if ocr_count > limits.ocr_pages:
                        raise ExtractionError('OCR_PAGE_LIMIT')
                    value, confidence, image_bytes, width, height = recognize(original, number, directory, limits)
                    image_hash = digest(image_bytes)
                    images[image_hash] = base64.b64encode(image_bytes).decode('ascii')
                    if sum(len(v) for v in images.values()) > 8_000_000:
                        raise ExtractionError('OCR_IMAGE_LIMIT')
                    locator.update({'image_hash': image_hash, 'width': width, 'height': height, 'ocr_confidence': round(confidence, 3)})
                    tools.update(ocr_tools())
                    method = 'ocr_bn'
                    flags = list(quality(value)) + ['ocr_review', 'critical_values_review', 'layout_review']
                    if confidence < 85:
                        flags.append('low_ocr_confidence')
                text_total += len(value)
                if text_total > limits.text_chars:
                    raise ExtractionError('TEXT_LIMIT')
                if not value.strip():
                    raise ExtractionError('EMPTY_PAGE')
                # Native PDF reading order/tables/coordinates need human review too.
                flags.append('pdf_layout_review')
                blocks.append(Block(value, page=number, page_label=labels[number - 1], locator=locator, flags=tuple(sorted(set(flags))), method=method))
        return Extraction(digest(data), title, 'application/pdf', tuple(blocks), (), (), tools), images
    except ExtractionError:
        raise
    except Exception:
        raise ExtractionError('PDF_INVALID') from None
