# Adapters

Each language/framework combination lives in its own folder here and is its own
workspace package:

| folder   | package                     | target                   |
| -------- | --------------------------- | ------------------------ |
| `vitest` | `@livingdoc/adapter-vitest` | TypeScript + Vitest      |

An adapter owns two things (design §9): its framework's assertion *shape* and
its assertion *verbs*. Later slices add `jest`, `pytest`, `catch2`, and so on
as sibling folders — no changes to `@livingdoc/core` are required to add one.
