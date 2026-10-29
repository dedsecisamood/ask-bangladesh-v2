"""DB-API adapter. The caller owns a dedicated, short-lived worker connection.

No driver, connection string, superuser fallback or network startup is hidden here.
Only fixed SQL function calls are permitted, never arbitrary SQL from a job.
"""

import json
from datetime import datetime
from uuid import UUID
from threading import RLock

from .models import Blocked, Code, Manifest, Policy


class SQLRegistry:
    def __init__(self, connection):
        self.connection = connection
        self._lock = RLock()

    def _call(self, sql: str, values: tuple):
        with self._lock:
            return self._execute(sql, values)

    def _execute(self, sql: str, values: tuple):
        try:
            cursor = self.connection.cursor()
            try:
                cursor.execute(sql, values)
                row = cursor.fetchone()
            finally:
                cursor.close()
            self.connection.commit()
        except Exception:
            try:
                self.connection.rollback()
            except Exception:
                pass
            raise Blocked(Code.REGISTRY_UNAVAILABLE) from None
        result = row[0] if row else None
        if isinstance(result, str):
            result = json.loads(result)
        if not isinstance(result, dict):
            raise Blocked(Code.NOT_APPROVED)
        if result.get("error"):
            try:
                code = Code(result["error"])
            except ValueError:
                code = Code.NOT_APPROVED
            raise Blocked(code)
        return result

    def policy(self, source_id: str) -> Policy:
        try:
            UUID(source_id)
        except (ValueError, TypeError, AttributeError):
            raise Blocked(Code.NOT_APPROVED) from None
        data = self._call("SELECT app_worker.crawl_policy(%s)", (source_id,))
        return Policy(source_id, data["policy_id"], data["hostname"], tuple(data["urls"]),
                      datetime.fromisoformat(data["expires_at"]), data["user_agent"],
                      data["max_bytes"], data["max_redirects"])

    def reserve(self, policy: Policy, url: str) -> str:
        return self._call("SELECT app_worker.reserve_retrieval(%s,%s)", (policy.policy_id, url))["ticket"]

    def finish(self, ticket: str, manifest: Manifest) -> None:
        payload = {"final_url": manifest.final_url, "http_status": manifest.http_status,
                   "content_type": manifest.content_type, "response_size": manifest.response_size,
                   "content_hash": manifest.content_hash, "etag": manifest.etag,
                   "last_modified": manifest.last_modified,
                   "retry_after_seconds": manifest.retry_after_seconds,
                   "error": manifest.error.value if manifest.error else None}
        self._call("SELECT app_worker.finish_retrieval(%s,%s::jsonb)", (ticket, json.dumps(payload)))
