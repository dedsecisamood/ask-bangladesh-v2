"""One leased ingestion job. Every stage stays private and publication-free."""

import base64
from dataclasses import dataclass
from threading import Event, Thread

from .crawler import Crawler
from .extraction import ExtractionError, canonical_json, digest
from .jobs import JobRegistry, JobRepository
from .models import Blocked
from .storage import PrivateStore


@dataclass(frozen=True)
class JobResult:
    state: str
    code: str | None = None
    version_id: str | None = None


def prepare_capture(retrieval, parser, store: PrivateStore, cancel: Event | None = None):
    manifest = retrieval.manifest
    if manifest.error is not None or not retrieval.body or digest(retrieval.body) != manifest.content_hash:
        raise ExtractionError('CAPTURE_INTEGRITY')
    original_key = store.put(retrieval.body, 'original')
    artifact = parser.extract(retrieval.body, manifest.content_type, manifest.final_url, cancel)
    if artifact.get('content_hash') != manifest.content_hash:
        raise ExtractionError('CAPTURE_INTEGRITY')
    images = artifact.pop('images', {})
    image_refs = {}
    for hash_value, encoded in images.items():
        image = base64.b64decode(encoded, validate=True)
        if digest(image) != hash_value:
            raise ExtractionError('CAPTURE_INTEGRITY')
        image_refs[hash_value] = store.put(image, 'page_image')
    artifact['image_refs'] = image_refs
    # Include the exact sandbox image in derivative identity, not just parser names.
    image = parser.image()
    artifact['tools']['sandbox_image'] = image
    artifact['profile'] = 'p5-' + digest(canonical_json(artifact['tools']))
    derivative_key = store.put(canonical_json(artifact), 'derivative')
    raw_text = '\n\n'.join(block['raw'] for block in artifact['blocks'])
    if digest(raw_text.encode()) != artifact['raw_text_hash']:
        raise ExtractionError('CAPTURE_INTEGRITY')
    payload = {'title': artifact['title'], 'media_type': manifest.content_type,
        'content_hash': manifest.content_hash, 'extraction_profile': artifact['profile'],
        'snapshot_key': original_key, 'extracted_key': derivative_key,
        'raw_text': raw_text, 'passages': artifact['passages'], 'flags': artifact['flags'],
        'extraction_method': 'html' if manifest.content_type == 'text/html' else
          'ocr_bn' if any('ocr_review' in p['flags'] for p in artifact['passages']) else 'pdf_text'}
    return payload


class IngestionWorker:
    def __init__(self, jobs: JobRepository, transport, parser, store: PrivateStore, *, network_ready=False):
        self.jobs = jobs
        self.transport = transport
        self.parser = parser
        self.store = store
        self.network_ready = network_ready

    def run_once(self) -> JobResult:
        # There is no live scheduler/daemon entry point. Even a configured queue
        # cannot trigger source HTTP unless isolated egress is separately attested.
        if not self.network_ready:
            return JobResult('disabled', 'DISABLED')
        job = self.jobs.claim()
        if job is None:
            return JobResult('idle')
        cancelled = Event()
        stopped = Event()
        def heartbeat():
            while not stopped.wait(30):
                try:
                    self.jobs.heartbeat(job)
                except Exception:
                    cancelled.set()
                    return
        thread = Thread(target=heartbeat, daemon=True)
        thread.start()
        try:
            registry = JobRegistry(self.jobs, job)
            result = Crawler(registry, self.transport, network_ready=True).fetch(job['source_id'], job['url'], cancelled)
            if result.manifest.error is not None:
                raise ExtractionError(result.manifest.error.value)
            capture = self.jobs.capture(job)['capture_id']
            # Quarantine changed/moved existing evidence before parsing can fail.
            self.jobs.observe(job, capture)
            payload = prepare_capture(result, self.parser, self.store, cancelled)
            if cancelled.is_set():
                raise ExtractionError('LEASE_LOST')
            completed = self.jobs.complete(job, capture, payload)
            return JobResult(completed['state'], version_id=completed['version_id'])
        except (ExtractionError, Blocked) as error:
            code = error.code.value if isinstance(error, Blocked) else error.code
            try:
                failure = self.jobs.fail(job, code)
            except Exception:
                return JobResult('unavailable', 'LEASE_OR_DATABASE_UNAVAILABLE')
            return JobResult(failure['state'], code)
        except Exception:
            try:
                self.jobs.fail(job, 'INTERNAL_FAILURE')
            except Exception:
                pass
            return JobResult('failed', 'INTERNAL_FAILURE')
        finally:
            stopped.set()
            thread.join(timeout=3)
