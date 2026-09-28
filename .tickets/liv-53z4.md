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
# Render the living documentation

**As a** reader, **I want** the document's prose with each example's green/red
result, **so that** I can read the living documentation without running the
tests myself.

## Acceptance criteria

- **Given** a document and the result of a test run
  **When** I run `livingdoc render`
  **Then** the prose is rendered with each bullet marked green or red
  **And** the marked values are shown

## Notes

- Configuration, generation, and actionable errors are already delivered
  (liv-ter0, liv-uxrl, liv-mpoe); this story is the remaining command.
- Rendering needs per-case results, hence the liv-hu8o dependency.
- DESIGN §16.5 is the deferred rendering design.
