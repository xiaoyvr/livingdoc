---
livingdoc: true
---

# What livingdoc generates

For each case, livingdoc binds its inputs as variables, calls the binding the
heading names, and transcribes every assertion. The file is named after the
document and written under the backend's `generated/` folder.

Example:

- a case with two inputs and an assertion, doc :=
  ```markdown doc :=
  ---
  livingdoc: true
  ---

  # Applying a discount

  Example:

  - a code :=`"SAVE10"` on a total :=`100` costs !!`toBe total * 0.9`
  ```
  the generated test !!`toContain 'describe("Applying a discount"'`
  the generated test !!`toContain 'const code = "SAVE10"'`
  the generated test !!`toContain 'bindings["applying-a-discount"].run({ code, total })'`
  the generated test !!`toContain 'expect(outputs.result).toBe(total * 0.9)'`
