---
id: liv-53z4
status: open
deps: [liv-hu8o]
links: [liv-ter0]
created: 2026-09-26T03:21:48Z
type: feature
priority: 4
assignee: xiaoyvr
---
# Configuration and commands

**As a** developer adopting livingdoc, **I want** a clear command surface and
actionable errors, **so that** I can wire livingdoc into my project and my CI.

## Acceptance criteria

- **Given** a configured project
  **When** I run `livingdoc generate`
  **Then** the tests are written and nothing else runs

- **Given** a misconfigured project (no config, an unknown framework, an
  unknown backend)
  **When** I run `livingdoc generate`
  **Then** it fails with an actionable message, not a stack trace

## Notes

- The `livingdoc.toml` shape (`livingdocs`, `code_path`,
  `[[backend.<framework>]]`) and per-backend generation are delivered by
  liv-ter0 and liv-uxrl; this story covers the remaining command surface and
  error reporting.
- `livingdoc check` no longer exists: `generate` writes the tests, and the
  project's own runner executes them (liv-mpoe).
