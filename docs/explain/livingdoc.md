---
livingdoc: true
---

# Generating a check

`livingdoc generate` writes a test file for each document. The file's
`describe` is the document's heading.

Example:

- a document with heading :=`"Applying a discount"`, the generated describe !!`toBe "Applying a discount"`
