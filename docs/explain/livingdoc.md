---
livingdoc: true
---

# Checking a document

`livingdoc check` runs a document's examples against the consumer's code and
exits non-zero when any expectation fails.

Example:

- a document whose expectations hold, fixture :=`"holds"` and the check !!`toBe 0`
- a document whose expectations are stale, fixture :=`"stale"` and the check !!`toBe 1`
- a project with no `livingdoc.toml`, fixture :=`"misconfigured"` and the check !!`toBe 1`
