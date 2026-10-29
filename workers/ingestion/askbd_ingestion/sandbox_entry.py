"""Container entry point. No credentials, network, dynamic commands or paths."""

import base64
import json
import resource
import sys

from .extraction import ExtractionError, canonical_json
from .html_extract import extract_html
from .passages import segment
from .pdf_extract import extract_pdf


def extract(request):
    if set(request) - {'operation', 'body', 'media_type', 'source_url'}:
        raise ExtractionError('INVALID_REQUEST')
    if request.get('operation') != 'extract':
        raise ExtractionError('INVALID_REQUEST')
    try:
        data = base64.b64decode(request['body'], validate=True)
    except Exception:
        raise ExtractionError('INVALID_REQUEST') from None
    images = {}
    if request['media_type'] == 'text/html':
        result = extract_html(data, request['source_url'])
    elif request['media_type'] == 'application/pdf':
        result, images = extract_pdf(data)
    else:
        raise ExtractionError('UNSUPPORTED_TYPE')
    artifact = segment(result)
    artifact['images'] = images
    return artifact


def main():
    resource.setrlimit(resource.RLIMIT_CPU, (120, 120))
    resource.setrlimit(resource.RLIMIT_FSIZE, (16_777_216, 16_777_216))
    resource.setrlimit(resource.RLIMIT_NOFILE, (128, 128))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    try:
        raw = sys.stdin.buffer.read(7_100_001)
        if len(raw) > 7_100_000:
            raise ExtractionError('INPUT_LIMIT')
        request = json.loads(raw)
        if request.get('operation') == 'selftest':
            from .sandbox_selftest import selftest
            result = selftest()
        elif request.get('operation') == 'fixtures':
            from .sandbox_selftest import fixture_inputs
            result = fixture_inputs()
        else:
            result = extract(request)
        encoded = canonical_json({'data': result})
        if len(encoded) > 12_000_000:
            raise ExtractionError('OUTPUT_LIMIT')
        sys.stdout.buffer.write(encoded)
    except ExtractionError as error:
        sys.stdout.buffer.write(canonical_json({'error': error.code}))
        sys.exit(1)
    except Exception:
        sys.stdout.buffer.write(b'{"error":"PARSER_FAILED"}')
        sys.exit(1)


if __name__ == '__main__':
    main()
