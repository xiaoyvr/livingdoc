---
livingdoc: true
---

# What a project provides

`livingdoc.toml` names the folder of documents, the folder that holds the
backends, and gives each backend a name:

```toml
livingdocs = "docs"
code_path  = "tests"

[[backend.vitest]]
name = "vitest"
```

A backend is a folder, `<code_path>/<name>`, holding a `backend.<ext>` file. A
document's test is written into that backend's `generated/` folder, at the
document's own path relative to `livingdocs`.

Example:

- a document keeps its name, name :=`"fixture.md"` doc :=
  ```markdown doc :=
  ---
  livingdoc: true
  ---

  # A document

  Example:

  - a case
  ```
  the generated path !!`toBe "tests/vitest/generated/fixture.test.ts"`
- a nested document keeps its path, name :=`"a/something.md"` doc :=
  ```markdown doc :=
  ---
  livingdoc: true
  ---

  # A document

  Example:

  - a case
  ```
  the generated path !!`toBe "tests/vitest/generated/a/something.test.ts"`
