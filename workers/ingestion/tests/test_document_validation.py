"""Exercise the existing offline Python harness before worker code exists."""

from __future__ import annotations

import importlib.util
from pathlib import Path
from types import ModuleType

import pytest


@pytest.fixture(scope="module")
def validator() -> ModuleType:
    repository_root = Path(__file__).resolve().parents[3]
    script = repository_root / "scripts" / "validate_docs.py"
    spec = importlib.util.spec_from_file_location("askbd_document_validation", script)
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load the repository documentation validator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def planning_package(tmp_path: Path, validator: ModuleType) -> Path:
    """Create synthetic planning data without depending on live project wording."""
    package = tmp_path / "planning"
    for relative_path in validator.REQUIRED:
        destination = package / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text("# Synthetic planning fixture\n", encoding="utf-8")
    (package / "README.md").write_text(
        "# Synthetic fixture\n[Requirements](docs/PRD.md)\n", encoding="utf-8"
    )
    (package / "docs" / "PRD.md").write_text(
        "# Synthetic requirements\n"
        + "\n".join(f"CAP-{number:02}" for number in range(1, 31))
        + "\n",
        encoding="utf-8",
    )
    (package / "docs" / "ROADMAP.md").write_text(
        "# Synthetic roadmap\n"
        + "\n".join(f"Phase {number}" for number in range(13))
        + "\nFuture work is intentionally unimplemented.\n",
        encoding="utf-8",
    )
    return package


def test_valid_planning_package_has_one_local_link(
    planning_package: Path, validator: ModuleType
) -> None:
    errors, link_count = validator.validate(planning_package)

    assert errors == []
    assert link_count == 1


def test_missing_required_document_is_rejected(
    planning_package: Path, validator: ModuleType
) -> None:
    (planning_package / "docs" / "SECURITY.md").unlink()

    errors, _ = validator.validate(planning_package)

    assert "Missing required file: docs/SECURITY.md" in errors


def test_invalid_utf8_is_reported_instead_of_crashing(
    planning_package: Path, validator: ModuleType
) -> None:
    (planning_package / "README.md").write_bytes(b"# Synthetic fixture\n\xff\xfe")

    errors, _ = validator.validate(planning_package)

    assert any(error.startswith("Invalid UTF-8: README.md:") for error in errors)


@pytest.mark.parametrize(
    ("target", "expected_error"),
    [
        ("missing.md", "Broken local file link:"),
        ("../outside.md", "Local link escapes workspace:"),
        ("%2e%2e/outside.md", "Local link escapes workspace:"),
    ],
)
def test_missing_or_escaping_links_are_rejected(
    planning_package: Path,
    validator: ModuleType,
    target: str,
    expected_error: str,
) -> None:
    # An existing file outside the package must not make an escaping link valid.
    (planning_package.parent / "outside.md").write_text(
        "# Outside the planning package\n", encoding="utf-8"
    )
    (planning_package / "README.md").write_text(
        f"# Synthetic fixture\n[Reference]({target})\n", encoding="utf-8"
    )

    errors, _ = validator.validate(planning_package)

    assert any(error.startswith(expected_error) for error in errors)


def test_fenced_examples_are_not_treated_as_live_links(
    planning_package: Path, validator: ModuleType
) -> None:
    with (planning_package / "README.md").open("a", encoding="utf-8") as readme:
        readme.write("\n```markdown\n[Illustration](not-a-real-file.md)\n```\n")

    errors, link_count = validator.validate(planning_package)

    assert errors == []
    assert link_count == 1


def test_missing_capability_is_rejected(
    planning_package: Path, validator: ModuleType
) -> None:
    prd = planning_package / "docs" / "PRD.md"
    prd.write_text(prd.read_text(encoding="utf-8").replace("CAP-30", ""), encoding="utf-8")

    errors, _ = validator.validate(planning_package)

    assert any("missing=['CAP-30']" in error for error in errors)


def test_phase_number_prefix_does_not_satisfy_missing_phase(
    planning_package: Path, validator: ModuleType
) -> None:
    roadmap = planning_package / "docs" / "ROADMAP.md"
    roadmap.write_text(
        roadmap.read_text(encoding="utf-8").replace("Phase 1\n", "Phase 100\n"),
        encoding="utf-8",
    )

    errors, _ = validator.validate(planning_package)

    assert "Roadmap missing Phase 1" in errors
