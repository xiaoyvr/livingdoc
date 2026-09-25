# Story 1 — tasking list

Walking skeleton. One small step at a time; update status as we go.

- [x] 1. An **opted-in** document: `check` writes `describe(<heading>)` next
      to the input.
- [x] 2. A **non-opted** document: `check` writes nothing.
- [x] 3. One `Example:` bullet: the `describe` gets an `it(<bullet text>)` that
      binds the input — `const code = "SAVE10"`.
- [ ] 4. `check` runs the generated test under vitest, prints `1 passed`,
      mirrors the exit code.
- [ ] 5. `bin.ts` wired to `check` (thin entry; not the thing under test).

## Notes

- Task 2 exists so the frontmatter opt-in introduced in task 1 is verified.
- Task 5 is wiring only. Per the process, the entry point is not the thing
  under test, so it has no test of its own.
