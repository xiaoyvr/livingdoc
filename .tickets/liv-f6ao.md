---
id: liv-f6ao
status: closed
deps: [liv-frgb, liv-ty09]
links: [liv-m0mf]
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

## Scope

- A new pytest generator in `packages/cli/src/frameworks/pytest.ts`, registered
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
- Rejecting unknown assertion verbs at generate time — liv-m0mf owns the closed
  vocabulary for every framework (including pytest).

## Notes

- Depends on liv-ty09: the generated pytest test imports the Python runtime from
  it, so `bindings` and the backend import go through the runtime, the same
  shape as vitest.
- A Python backend needs a module name Python can import; whatever the file is
  called, the generated test imports it, so the framework owns the naming.
- Dogfood under pytest is a follow-on (liv-99hz), not part of this story.

## Implementation tasks

Vertical slices (each delivers a usable path, not a layer):

- [x] 1. **One case goes green under pytest**

      End-to-end: `[[backend.pytest]]` + generate `test_<doc>.py` (file-scoped
      bindings, `register`, `assert outputs["result"] <verb> <args>`) + minimal
      `backend.py` + `python3`/`pytest` in the flake + pytest run passes.
      Import shape for `livingdoc_runtime` and `backend` is decided here.
      Vitest generation stays unchanged.

- [x] 2. **A stale expectation goes red under pytest**

      Same path; wrong assertion → pytest fails. Proves generate does not
      "check" — the runner does.

### Notes

- Verb vocabulary for codegen follows the ticket scope (`==`, `!=`, `in`), not
  the wider DESIGN examples (`<`, …). Widen later if needed.
- Multiple backends already work in config; this story only adds the pytest
  generator. Repo dogfood stays vitest-only until liv-99hz.
