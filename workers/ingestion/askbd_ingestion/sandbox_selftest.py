"""Synthetic fixture verification inside the *actual* constrained runtime."""

import io
import base64
import os
from pathlib import Path
import subprocess
import tempfile

from .extraction import ExtractionError, Limits, digest
from .html_extract import extract_html
from .passages import segment
from .pdf_extract import extract_pdf


def text_pdf(value='Synthetic PDF document for offline parser verification only.'):
    from pypdf import PdfWriter
    from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject
    writer = PdfWriter()
    page = writer.add_blank_page(width=600, height=800)
    font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/Helvetica')})
    page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/F1'): font})})
    content = DecodedStreamObject()
    content.set_data(f'BT /F1 18 Tf 40 700 Td ({value}) Tj ET'.encode('ascii'))
    page[NameObject('/Contents')] = writer._add_object(content)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def fixture_inputs():
    from PIL import Image
    with tempfile.TemporaryDirectory(prefix='scan-fixture-') as temp:
        folder = Path(temp)
        image = folder / 'scan.png'
        subprocess.run(['pango-view', '--no-display', '--font=Noto Sans Bengali 36', '--text=বাংলাদেশ তথ্য সেবা পরীক্ষা\nSynthetic document only', '--margin=40', '--output=' + str(image)], check=True, timeout=10, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        pdf = folder / 'scan.pdf'
        with Image.open(image) as bitmap:
            bitmap.convert('RGB').save(pdf, 'PDF', resolution=150)
        return {'native': base64.b64encode(text_pdf()).decode('ascii'), 'scan': base64.b64encode(pdf.read_bytes()).decode('ascii')}


def selftest():
    cases = []
    def ok(name, condition):
        if not condition:
            raise ExtractionError('SELFTEST_' + name.upper())
        cases.append(name)
    ok('unprivileged', os.geteuid() == 65532)
    ok('no_network_route', len(Path('/proc/net/route').read_text().splitlines()) == 1)
    status = Path('/proc/self/status').read_text()
    ok('no_capabilities', 'CapEff:\t0000000000000000' in status)
    ok('memory_bound', Path('/sys/fs/cgroup/memory.max').read_text().strip() == '805306368')
    try:
        Path('/app/forbidden-write').write_text('test')
    except OSError:
        cases.append('readonly_root')
    else:
        raise ExtractionError('SELFTEST_READONLY_ROOT')
    parsed = extract_html('<html><main><h1>পরীক্ষামূলক তথ্য</h1><p>বাংলা ও English synthetic information only.</p></main></html>'.encode(), 'https://fixture.example.invalid/')
    ok('bangla_html', 'বাংলা' in parsed.text)
    data = text_pdf()
    pdf, _ = extract_pdf(data)
    ok('native_pdf', 'Synthetic PDF' in pdf.text and pdf.blocks[0].page == 1 and pdf.blocks[0].page_label is None)
    artifact = segment(pdf)
    ok('exact_offsets', all(pdf.text[p['character_start']:p['character_end']] == p['text'] for p in artifact['passages']))
    try:
        extract_pdf(b'%PDF-1.7 malformed synthetic fixture')
    except ExtractionError as error:
        ok('malformed_pdf_denied', error.code == 'PDF_INVALID')
    else:
        raise ExtractionError('SELFTEST_MALFORMED_PDF')
    from pypdf import PdfReader, PdfWriter
    writer = PdfWriter()
    for _ in range(2):
        writer.add_page(PdfReader(io.BytesIO(data)).pages[0])
    two_pages = io.BytesIO()
    writer.write(two_pages)
    try:
        extract_pdf(two_pages.getvalue(), Limits(pages=1))
    except ExtractionError as error:
        ok('page_limit', error.code == 'PDF_PAGE_LIMIT')
    else:
        raise ExtractionError('SELFTEST_PAGE_LIMIT')
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.encrypt('synthetic-password')
    encrypted = io.BytesIO()
    writer.write(encrypted)
    try:
        extract_pdf(encrypted.getvalue())
    except ExtractionError as error:
        ok('encrypted_denied', error.code == 'PDF_ENCRYPTED')
    else:
        raise ExtractionError('SELFTEST_ENCRYPTED_DENIED')
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.add_js('app.alert("synthetic")')
    active = io.BytesIO()
    writer.write(active)
    try:
        extract_pdf(active.getvalue())
    except ExtractionError as error:
        ok('active_pdf_denied', error.code == 'PDF_ACTIVE_CONTENT')
    else:
        raise ExtractionError('SELFTEST_ACTIVE_PDF_DENIED')
    with tempfile.TemporaryDirectory(prefix='ocr-fixture-') as temp:
        from PIL import Image
        folder = Path(temp)
        image = folder / 'synthetic.png'
        sample = 'বাংলাদেশ তথ্য সেবা পরীক্ষা'
        subprocess.run(['pango-view', '--no-display', '--font=Noto Sans Bengali 36', '--text=' + sample + '\nSynthetic document only', '--margin=40', '--output=' + str(image)], check=True, timeout=10, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        scan = folder / 'scan.pdf'
        with Image.open(image) as bitmap:
            bitmap.convert('RGB').save(scan, 'PDF', resolution=150)
        recognized, images = extract_pdf(scan.read_bytes())
        ok('real_bangla_ocr', any('\u0980' <= c <= '\u09ff' for c in recognized.text))
        ok('ocr_provenance', recognized.blocks[0].method == 'ocr_bn' and bool(images) and 'traineddata' in recognized.tools)
        ok('ocr_review_required', 'ocr_review' in recognized.blocks[0].flags)
        a = segment(recognized)
        ok('ocr_page_locator', a['passages'][0]['locator']['physical_page'] == 1 and 'image_hash' in a['passages'][0]['locator'])
        # Character error rate is measured on this single synthetic line only.
        actual = recognized.text.splitlines()[0]
        row = list(range(len(actual) + 1))
        for index, char in enumerate(sample, 1):
            next_row = [index]
            for column, other in enumerate(actual, 1):
                next_row.append(min(row[column] + 1, next_row[-1] + 1, row[column - 1] + (char != other)))
            row = next_row
        metrics = {'sample': sample, 'recognized': actual, 'character_error_rate': round(row[-1] / len(sample), 4), 'confidence': recognized.blocks[0].locator['ocr_confidence']}
    return {'cases': cases, 'passed': len(cases), 'ocr': metrics, 'tools': recognized.tools}
