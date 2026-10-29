"""Run untrusted parsers in a verified local image with no network or secrets."""

import base64
from hashlib import sha256
import json
import os
from pathlib import Path
import queue
import re
import subprocess
import tempfile
from threading import Event, Thread
from time import monotonic
from uuid import uuid4

from .extraction import ExtractionError, canonical_json


class ParserSandbox:
    def __init__(self, repository: Path | None = None):
        self.root = (repository or Path(__file__).resolve().parents[3]).resolve()
        candidates = [Path(os.environ.get('LOCALAPPDATA', '')) / 'Programs/DockerDesktop/resources/bin/docker.exe',
                      Path(os.environ.get('ProgramFiles', 'C:/Program Files')) / 'Docker/Docker/resources/bin/docker.exe']
        self.docker = str(next((p for p in candidates if p.is_file()), 'docker'))

    def _control(self, args):
        try:
            result = subprocess.run([self.docker, *args], capture_output=True, timeout=10, check=True)
            if len(result.stdout) > 32768:
                raise ExtractionError('SANDBOX_CONTROL')
            return result.stdout.decode('utf-8')
        except (OSError, subprocess.SubprocessError, UnicodeError):
            raise ExtractionError('SANDBOX_UNAVAILABLE') from None

    def image(self) -> str:
        endpoint = os.environ.get('DOCKER_HOST', '')
        if endpoint and not endpoint.startswith(('npipe://', 'unix://')):
            raise ExtractionError('REMOTE_DOCKER_DENIED')
        try:
            context = json.loads(self._control(['context', 'inspect']))[0]['Endpoints']['docker']['Host']
            if not context.startswith(('npipe://', 'unix://')):
                raise ExtractionError('REMOTE_DOCKER_DENIED')
            record = json.loads((self.root / '.cache/parser-image.json').read_text(encoding='utf-8'))
            directory = self.root / 'workers/ingestion'
            files = ['Dockerfile', 'requirements-sandbox.txt'] + ['askbd_ingestion/' + p.name for p in sorted((directory / 'askbd_ingestion').glob('*.py'))]
            value = sha256()
            for file in files:
                value.update((file + '\0').encode())
                value.update((directory / file).read_bytes())
            if record['source_hash'] != value.hexdigest() or not re.fullmatch(r'sha256:[a-f0-9]{64}', record['image_id']):
                raise ExtractionError('SANDBOX_REBUILD_REQUIRED')
            labels = json.loads(self._control(['image', 'inspect', record['image_id'], '--format', '{{json .Config.Labels}}']))
            if labels.get('askbd.owner') != 'phase5-parser' or labels.get('askbd.source') != record['source_hash']:
                raise ExtractionError('SANDBOX_IMAGE_DENIED')
            return record['image_id']
        except ExtractionError:
            raise
        except Exception:
            raise ExtractionError('SANDBOX_UNAVAILABLE') from None

    def run(self, request: dict, cancel: Event | None = None, timeout: float = 300) -> dict:
        image = self.image()
        data = canonical_json(request)
        if len(data) > 7_100_000:
            raise ExtractionError('INPUT_LIMIT')
        name = 'askbd-parser-' + uuid4().hex
        args = [self.docker, 'run', '--rm', '--name', name, '--label', 'askbd.owner=phase5-parser',
                '--network', 'none', '--read-only', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
                '--user', '65532:65532', '--memory', '768m', '--memory-swap', '768m', '--cpus', '1',
                '--pids-limit', '32', '--tmpfs', '/tmp:rw,noexec,nosuid,nodev,size=128m,mode=1777', '-i', image]
        event = cancel or Event()
        if event.is_set():
            raise ExtractionError('CANCELLED')
        child = None
        finished = Event()
        reader = None
        try:
            with tempfile.TemporaryFile() as incoming:
                incoming.write(data)
                incoming.seek(0)
                child = subprocess.Popen(args, stdin=incoming, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
                chunks = queue.Queue(maxsize=2)
                def send(part):
                    while not finished.is_set():
                        try:
                            chunks.put(part, timeout=0.2)
                            return
                        except queue.Full:
                            continue
                def read():
                    try:
                        while True:
                            part = child.stdout.read1(65536)
                            send(part)
                            if not part:
                                break
                    except (OSError, ValueError):
                        send(b'')
                reader = Thread(target=read, daemon=True)
                reader.start()
                result = bytearray()
                deadline = monotonic() + min(timeout, 300)
                while True:
                    if event.is_set() or monotonic() > deadline:
                        raise ExtractionError('CANCELLED' if event.is_set() else 'PARSER_TIMEOUT')
                    try:
                        part = chunks.get(timeout=0.2)
                    except queue.Empty:
                        continue
                    if not part:
                        break
                    result.extend(part)
                    if len(result) > 12_000_000:
                        raise ExtractionError('OUTPUT_LIMIT')
                code = child.wait(timeout=5)
                try:
                    payload = json.loads(result)
                except (UnicodeError, ValueError):
                    raise ExtractionError('PARSER_RESOURCE_LIMIT') from None
                if code != 0 or payload.get('error'):
                    error = payload.get('error', 'PARSER_FAILED')
                    raise ExtractionError(error if re.fullmatch('[A-Z_]{1,80}', error) else 'PARSER_FAILED')
                return payload['data']
        except (OSError, subprocess.SubprocessError):
            raise ExtractionError('SANDBOX_UNAVAILABLE') from None
        finally:
            finished.set()
            if child is not None:
                if child.poll() is None:
                    child.kill()
                    child.wait(timeout=5)
                child.stdout.close()
            if reader is not None:
                reader.join(timeout=2)
            # Only this generated name is removed; no volumes or unrelated runtime.
            try:
                self._control(['rm', '-f', name])
            except ExtractionError:
                pass

    def extract(self, body: bytes, media_type: str, source_url: str, cancel: Event | None = None) -> dict:
        if not body or len(body) > 5_242_880:
            raise ExtractionError('INPUT_LIMIT')
        return self.run({'operation': 'extract', 'body': base64.b64encode(body).decode('ascii'),
                         'media_type': media_type, 'source_url': source_url}, cancel)
