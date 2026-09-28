---
livingdoc: true
---

# What a document means

A document is Markdown. Two marked forms carry meaning, and every other code
span is prose:

- an input, `name :=`expr``, binds the name to the expression;
- an assertion, `!!`verb args``, asserts the verb on the case's result.

The heading names the behavior, `Example:` opens a group, and each bullet is one
case.

Example:

- an input becomes a variable, doc :=
  ```markdown doc :=
  ---
  livingdoc: true
  ---

  # Showing an input

  Example:

  - a code :=`"SAVE10"` is applied
  ```
  the generated test !!`toContain 'const code = "SAVE10"'`
- an assertion becomes an expect, doc :=
  ```markdown doc :=
  ---
  livingdoc: true
  ---

  # Showing an assertion

  Example:

  - a code :=`"SAVE10"` so the total !!`toBe total * 0.9`
  ```
  the generated test !!`toContain 'expect(outputs.result).toBe(total * 0.9)'`
- a plain code span is prose, doc :=
  ```markdown doc :=
  ---
  livingdoc: true
  ---

  # Showing prose

  Example:

  - run `git commit` now
  ```
  the generated test !!`not.toContain 'const run'`
