---
id: liv-f6ao
status: open
deps: [liv-frgb]
links: []
created: 2026-09-26T03:21:48Z
type: feature
priority: 0
assignee: xiaoyvr
---
# The pytest framework

**As a** documentation author whose system is written in Python, **I want**
livingdoc to generate pytest tests, **so that** my documented behaviors are
checked in the language my project is written in, not only TypeScript.

## Acceptance criteria

- **Given** a backend declared as `[[backend.pytest]]` with a Python backend
  file, and a document written in Python's terms
  **When** I run `livingdoc generate`
  **Then** a `test_<doc>.py` is written into the backend's `generated/` folder
  **And** running pytest on it passes

- **Given** an expectation that no longer holds
  **When** pytest runs
  **Then** the generated test fails

- **Given** an assertion whose verb pytest does not know
  **When** I run `livingdoc generate`
  **Then** the unknown verb is reported as an error

## Scope

- A new pytests generator in `packages/cli/src/frameworks/pytest.ts`, registered
  under the framework name `pytest`.
- It owns the backend file extension (`backend.py`), the generated filename
  (`test_<doc>.py`), the import, the binding call, the assertion shape
  (`assert outputs["result"] <verb> <args>`), and the verbs (`==`, `!=`, `in`).
- Add `python3` + `pytest` to the flake devShell.
- Verify by generating a fixture Python backend and running pytest, for a pass
  and a fail.

## Out of scope

- A runtime SDK; multiple backends (liv-uxrl); per-case results; directives;
  rendering.

## Notes

- Depends on liv-uxrl: the `frameworks/` registry and the backend config do not
  exist yet.
- A Python backend needs a module name Python can import; whatever the file is
  called, the generated test imports it, so the framework owns the naming.
