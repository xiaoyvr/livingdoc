---
id: liv-f6ao
status: open
deps: [liv-frgb, liv-uxrl]
links: []
created: 2026-09-26T03:21:48Z
type: feature
priority: 0
assignee: xiaoyvr
---
# The pytest adapter

**As a** documentation author whose system is written in Python, **I want**
livingdoc to generate pytest tests, **so that** my documented behaviors are
checked in the language my project is written in, not only TypeScript.

## Acceptance criteria

- **Given** a backend configured with `adapter = "pytest"` and a Python backend
  file, and a document written in Python's terms
  **When** I run `livingdoc generate`
  **Then** a `test_<doc>.py` is written next to the backend
  **And** running pytest on it passes

- **Given** an expectation that no longer holds
  **When** pytest runs
  **Then** the generated test fails

- **Given** an assertion whose verb pytest does not know
  **When** I run `livingdoc generate`
  **Then** the unknown verb is reported as an error

## Scope

- New `@livingdoc/adapter-pytest`, registered as `adapter = "pytest"`.
- It owns its backend filename, generated filename (`test_<doc>.py`), import,
  binding call, assertion shape (`assert outputs["result"] <verb> <args>`), and
  verbs (`==`, `!=`, `in`).
- Add `python3` + `pytest` to the flake devShell.
- Verify by generating a fixture Python project and running pytest, for a pass
  and a fail.

## Out of scope

- Multiple backends and the `Example (name):` marker (liv-uxrl).
- Per-case results, directives, rendering.

## Notes

- Depends on liv-uxrl: the adapter registry, the explicit `adapter` setting, and
  the core/adapter split do not exist yet.
- A Python backend needs a module name Python can import; `livingdoc.backend`
  is not one (module names cannot contain a dot), so the adapter picks the
  backend filename.
