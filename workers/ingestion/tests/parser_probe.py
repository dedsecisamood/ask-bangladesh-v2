"""Local CLI harness; requires parser:build, never fetches source documents."""
from pathlib import Path
import json
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from askbd_ingestion.sandbox import ParserSandbox
from askbd_ingestion.extraction import ExtractionError
try:
    result = ParserSandbox().run({'operation': 'selftest'})
    print(json.dumps(result, ensure_ascii=True))
except ExtractionError as error:
    print(error.code)
    sys.exit(1)
