# The pytest backend for livingdoc's own explain documents. Each binding builds
# a tiny livingdoc project, generates with the built CLI, and returns the
# generated file's path (or later its text) for the document to assert on.
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path
from types import SimpleNamespace

_ROOT = Path(__file__).resolve().parents[3]
_BIN = _ROOT / "packages" / "cli" / "dist" / "bin.js"

_CONFIG = """\
livingdocs = "docs"
code_path  = "tests"

[[backend.pytest]]
name = "pytest"
"""


def _generated_name(name: str) -> str:
    parts = name.removesuffix(".md").split("/")
    parts[-1] = f"test_{parts[-1]}.py"
    return "/".join(parts)


def build(doc: str, name: str = "fixture.md") -> dict[str, str]:
    dir = Path(tempfile.mkdtemp(prefix="livingdoc-explain-"))
    try:
        (dir / "docs").mkdir()
        (dir / "tests" / "pytest").mkdir(parents=True)
        (dir / "livingdoc.toml").write_text(_CONFIG)
        target = dir / "docs" / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(doc)
        (dir / "tests" / "pytest" / "backend.py").write_text(
            "def register(_bindings):\n    pass\n"
        )
        subprocess.run(
            ["node", str(_BIN), "generate", str(Path("docs") / name)],
            cwd=dir,
            check=False,
            capture_output=True,
            text=True,
        )
        generated = dir / "tests" / "pytest" / "generated" / _generated_name(name)
        return {
            "path": generated.relative_to(dir).as_posix(),
            "content": generated.read_text(),
        }
    finally:
        shutil.rmtree(dir, ignore_errors=True)


def register(bindings):
    bindings.bind(
        "what-a-project-provides",
        SimpleNamespace(
            params=["name", "doc"],
            run=lambda args: {"result": build(args["doc"], args["name"])["path"]},
        ),
    )
    bindings.bind(
        "what-livingdoc-generates",
        SimpleNamespace(
            params=["doc"],
            run=lambda args: {"result": build(args["doc"])["content"]},
        ),
    )
