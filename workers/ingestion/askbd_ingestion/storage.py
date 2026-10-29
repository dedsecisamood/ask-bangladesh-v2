"""Private local adapter behind a provider-neutral content-addressed interface."""

import os
from pathlib import Path
import re
import tempfile
from time import time
from .extraction import ExtractionError, digest

KEY = re.compile(r'(original|derivative|page_image)/sha256/[a-f0-9]{2}/[a-f0-9]{64}\Z')


def no_links(path: Path):
    for candidate in (path, *path.parents):
        if candidate.is_symlink() or (hasattr(candidate, 'is_junction') and candidate.is_junction()):
            raise ExtractionError('STORE_UNSAFE_PATH')


class PrivateStore:
    backend = 'local_private'
    def __init__(self, root: Path):
        self.root = Path(root).absolute()
        no_links(self.root)
        if self.root == self.root.parent or any(part.casefold() in ('public', '.next', 'node_modules', 'apps', 'packages') for part in self.root.parts):
            raise ExtractionError('STORE_UNSAFE_PATH')
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)

    def path(self, key: str) -> Path:
        if not KEY.fullmatch(key) or key.split('/')[-1][:2] != key.split('/')[-2]:
            raise ExtractionError('STORE_UNSAFE_PATH')
        result = self.root / key
        no_links(result)
        return result

    def put(self, data: bytes, kind: str) -> str:
        if kind not in ('original', 'derivative', 'page_image') or not data or len(data) > 12_000_000:
            raise ExtractionError('STORE_LIMIT')
        hash_value = digest(data)
        key = f'{kind}/sha256/{hash_value[:2]}/{hash_value}'
        target = self.path(key)
        target.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        no_links(target)
        try:
            if target.exists():
                if self.get(key) != data:
                    raise ExtractionError('STORE_INTEGRITY')
                return key
            with tempfile.NamedTemporaryFile(prefix='.askbd-', dir=target.parent, delete=False) as temporary:
                name = Path(temporary.name)
                try:
                    os.chmod(name, 0o600)
                    temporary.write(data)
                    temporary.flush()
                    os.fsync(temporary.fileno())
                except Exception:
                    name.unlink(missing_ok=True)
                    raise
            try:
                # Atomic publish-if-absent; never overwrite immutable originals.
                os.link(name, target)
            except FileExistsError:
                if self.get(key) != data:
                    raise ExtractionError('STORE_INTEGRITY')
            finally:
                name.unlink(missing_ok=True)
            return key
        except ExtractionError:
            raise
        except OSError:
            raise ExtractionError('STORE_UNAVAILABLE') from None

    def get(self, key: str) -> bytes:
        target = self.path(key)
        try:
            if target.stat().st_size > 12_000_000:
                raise ExtractionError('STORE_LIMIT')
            descriptor = os.open(target, os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0))
            with os.fdopen(descriptor, 'rb') as stream:
                data = stream.read(12_000_001)
            if digest(data) != key.rsplit('/', 1)[-1]:
                raise ExtractionError('STORE_INTEGRITY')
            return data
        except ExtractionError:
            raise
        except OSError:
            raise ExtractionError('STORE_UNAVAILABLE') from None

    def sweep_temporary(self, minimum_age_seconds: int = 86400) -> int:
        if minimum_age_seconds < 86400:
            raise ExtractionError('STORE_UNSAFE_PATH')
        removed = 0
        for candidate in self.root.rglob('.askbd-*'):
            no_links(candidate)
            if candidate.is_file() and time() - candidate.stat().st_mtime > minimum_age_seconds:
                candidate.unlink()
                removed += 1
        return removed
