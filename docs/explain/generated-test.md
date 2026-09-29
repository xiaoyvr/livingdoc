---
livingdoc: true
---

# What livingdoc generates

For each case, livingdoc binds its inputs as variables, calls the binding the
heading names, and transcribes every assertion. The file is named after the
document and written under the backend's `generated/` folder.

Example:

- a case with two inputs and an assertion,
  ```markdown doc :=
  ---
  livingdoc: true
  ---

  # Applying a discount

  Example:

  - a code :=`"SAVE10"` on a total :=`100` costs !!`toBe total * 0.9`
  ```
  the generated test !!`toBe expected`

  ```js expected :=
  import { describe, expect, it } from 'vitest'
  import { setup } from '@livingdoc/runtime'
  import * as backend from '../backend'

  const { bind, run } = setup(backend)

  describe("Applying a discount", () => {
    it("a code SAVE10 on a total 100 costs toBe total * 0.9", () => {
      const code = "SAVE10"
      const total = 100
      const result = run("applying-a-discount", { code, total })
      expect(result).toBe(total * 0.9)
    })
  })

  ```

Example (pytest):

- a case with two inputs and an assertion,
  ```markdown doc :=
  ---
  livingdoc: true
  ---

  # Applying a discount

  Example:

  - a code :=`"SAVE10"` on a total :=`100` costs !!`== total * 0.9`
  ```
  the generated test !!`== expected`

  ```python expected :=
  from livingdoc_runtime import setup
  import backend

  bind, run = setup(backend)

  class TestApplyingADiscount:
      def test_a_code_save10_on_a_total_100_costs_total_09(self):
          code = "SAVE10"
          total = 100
          result = run("applying-a-discount", {"code": code, "total": total})
          assert result == total * 0.9

  ```
