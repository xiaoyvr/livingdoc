---
livingdoc: true
---

# Generating the checks

`livingdoc generate` writes the checks for a document's examples next to the
backend. Your own test runner then executes them and fails when an expectation
does not hold.

Example:

- a document whose expectations hold, fixture :=`"holds"` and the run !!`toBe 0`
- a document whose expectations are stale, fixture :=`"stale"` and the run !!`toBe 1`
- a project with no `livingdoc.toml`, fixture :=`"misconfigured"` and the run !!`toBe 1`
