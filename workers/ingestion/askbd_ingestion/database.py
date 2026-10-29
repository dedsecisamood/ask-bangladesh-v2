"""Explicit worker-only PostgreSQL connection; never falls back to web/admin keys."""

from contextlib import contextmanager
from dataclasses import dataclass, field
import re
import ssl

from .models import Blocked, Code
from .registry import SQLRegistry


@dataclass(frozen=True)
class DatabaseSettings:
    host: str
    database: str
    user: str
    password: str = field(repr=False)
    port: int = 5432
    disposable_local: bool = False

    def validate(self):
        if (not self.host or not self.database or not self.password or not self.user
                or self.user in ("postgres", "supabase_admin", "service_role")
                or not 1 <= self.port <= 65535):
            raise Blocked(Code.REGISTRY_UNAVAILABLE)
        if self.disposable_local:
            if (self.host != "127.0.0.1" or self.port != 54322
                    or not re.fullmatch(r"askbd_p14_test_[a-f0-9]{32}", self.database)):
                raise Blocked(Code.REGISTRY_UNAVAILABLE)
        elif self.host in ("localhost", "127.0.0.1", "::1"):
            raise Blocked(Code.REGISTRY_UNAVAILABLE)


@contextmanager
def worker_registry(settings: DatabaseSettings):
    settings.validate()
    connection = None
    try:
        import pg8000.dbapi
        connection = pg8000.dbapi.connect(user=settings.user, password=settings.password,
            host=settings.host, port=settings.port, database=settings.database, timeout=3,
            ssl_context=False if settings.disposable_local else ssl.create_default_context())
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication FROM pg_roles WHERE rolname=current_user")
            if cursor.fetchone() != [False]:
                raise Blocked(Code.REGISTRY_UNAVAILABLE)
            cursor.execute("SET ROLE askbd_worker")
            cursor.execute("SET statement_timeout='3s'")
            cursor.execute("SET lock_timeout='1s'")
            connection.commit()
        finally:
            cursor.close()
        yield SQLRegistry(connection)
    except Blocked:
        raise
    except Exception:
        raise Blocked(Code.REGISTRY_UNAVAILABLE) from None
    finally:
        if connection is not None:
            try:
                connection.close()
            except Exception:
                pass  # Never replace a sanitized result with driver diagnostics.
