"""Invoked only by the guarded disposable DB harness, not standalone pytest.

Real PostgreSQL, simulated HTML. No external DNS/HTTP is permitted.
"""
import os
from pathlib import Path
import socket
import sys
import base64
import tempfile
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from askbd_ingestion.crawler import Crawler
from askbd_ingestion.database import DatabaseSettings, worker_registry
from askbd_ingestion.models import Blocked, Code, Response
from askbd_ingestion.jobs import JobRepository
from askbd_ingestion.pipeline import IngestionWorker
from askbd_ingestion.sandbox import ParserSandbox
from askbd_ingestion.storage import PrivateStore


class OfflineTransport:
    def get(self, url, policy, deadline, max_bytes):
        deadline.remaining()
        if url == "https://crawler.example.com/robots.txt":
            return Response(200, {"content-type": "text/plain"}, b"User-agent: *\nDisallow:\n")
        if url == os.environ["ASKBD_PROBE_URL"]:
            return Response(200, {"content-type": "text/html"}, b"<html>Synthetic offline fixture only</html>")
        raise AssertionError("Unapproved simulation URL")


def main():
    original = socket.getaddrinfo
    def only_database(host, port, *args, **kwargs):
        if host != "127.0.0.1" or port != 54322:
            raise AssertionError("External DNS forbidden")
        return original(host, port, *args, **kwargs)
    socket.getaddrinfo = only_database
    settings = DatabaseSettings(host="127.0.0.1", port=54322, disposable_local=True,
        database=os.environ["ASKBD_PROBE_DB"], user=os.environ["ASKBD_PROBE_USER"],
        password=os.environ["ASKBD_PROBE_PASSWORD"])
    with worker_registry(settings) as registry:
        policy = registry.policy(os.environ["ASKBD_PROBE_SOURCE"])
        assert policy.hostname == "crawler.example.com"
        result = Crawler(registry, OfflineTransport(), network_ready=True).fetch(policy.source_id, os.environ["ASKBD_PROBE_URL"])
        assert result.manifest.error is None and result.body.startswith(b"<html>")
        cursor = registry.connection.cursor()
        try:
            cursor.execute("SELECT * FROM app_private.admin_memberships")
        except Exception as error:
            assert isinstance(error.args[0], dict) and error.args[0].get("C") == "42501"
            registry.connection.rollback()
        else:
            raise AssertionError("Private table access granted unexpectedly")
        finally:
            cursor.close()
        parser = ParserSandbox()
        fixtures = parser.run({'operation':'fixtures'})
        class PipelineTransport:
            def get(self, url, policy, deadline, max_bytes):
                deadline.remaining()
                if url.endswith('/robots.txt'):
                    return Response(200, {'content-type':'text/plain'}, b'User-agent: *\nDisallow:\n')
                if url == os.environ['ASKBD_PROBE_URL']:
                    return Response(200, {'content-type':'text/html'}, '<html><main><h1>পরীক্ষামূলক তথ্য</h1><p>বাংলা ও English synthetic document content for offline testing only.</p></main></html>'.encode())
                if url == os.environ['ASKBD_PROBE_URL'] + 'native.pdf':
                    return Response(200, {'content-type':'application/pdf'}, base64.b64decode(fixtures['native']))
                if url == os.environ['ASKBD_PROBE_URL'] + 'scan.pdf':
                    return Response(200, {'content-type':'application/pdf'}, base64.b64decode(fixtures['scan']))
                raise AssertionError('No network fallback allowed')
        jobs = JobRepository(registry.connection)
        with tempfile.TemporaryDirectory(prefix='phase5-private-', dir=Path(__file__).resolve().parents[3]/'.cache') as folder:
            worker = IngestionWorker(jobs, PipelineTransport(), parser, PrivateStore(Path(folder)), network_ready=True)
            for suffix in ('', 'native.pdf', 'scan.pdf'):
                jobs._call("SELECT app_worker.enqueue_ingestion(%s,%s,'ingest',%s)", (policy.source_id, os.environ['ASKBD_PROBE_URL'] + suffix, str(uuid4())))
                completed = worker.run_once()
                assert completed.state in ('completed','quarantined') and completed.version_id is not None
            metrics = jobs._call('SELECT app_worker.ingestion_metrics()', ())
            assert metrics['pending_index_review'] == 3
            assert metrics['jobs'].get('completed',0) + metrics['jobs'].get('quarantined',0) == 3
    print("P22_REAL_ADAPTER_PASS")


if __name__ == "__main__":
    try:
        main()
    except Blocked as error:
        print(error.code.value)
        sys.exit(1)
    except Exception:
        print(Code.REGISTRY_UNAVAILABLE.value)
        sys.exit(1)
