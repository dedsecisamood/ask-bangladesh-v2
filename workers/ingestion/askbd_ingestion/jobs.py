"""Fixed worker SQL contracts; lease tokens never leave the private runtime."""

import json
from .registry import SQLRegistry


class JobRepository(SQLRegistry):
    def claim(self):
        return self._call('SELECT app_worker.claim_ingestion()', ())['job']

    def heartbeat(self, job):
        return self._call('SELECT app_worker.heartbeat_ingestion(%s,%s)', (job['id'], job['lease_token']))

    def observe(self, job, capture):
        return self._call('SELECT app_worker.observe_ingestion(%s,%s,%s)', (job['id'], job['lease_token'], capture))

    def complete(self, job, capture, payload):
        return self._call('SELECT app_worker.complete_ingestion(%s,%s,%s,%s::jsonb)', (job['id'], job['lease_token'], capture, json.dumps(payload, ensure_ascii=False)))

    def fail(self, job, code):
        return self._call('SELECT app_worker.fail_ingestion(%s,%s,%s)', (job['id'], job['lease_token'], code))

    def capture(self, job):
        return self._call('SELECT app_worker.latest_ingestion_capture(%s,%s)', (job['id'], job['lease_token']))


class JobRegistry(SQLRegistry):
    def __init__(self, jobs: JobRepository, job: dict):
        super().__init__(jobs.connection)
        self._lock = jobs._lock
        self.job = job

    def reserve(self, policy, url):
        return self._call('SELECT app_worker.reserve_ingestion(%s,%s,%s)', (self.job['id'], self.job['lease_token'], url))['ticket']
