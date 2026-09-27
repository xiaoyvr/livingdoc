---
id: liv-mpoe
status: closed
deps: []
links: []
created: 2026-09-27T05:05:04Z
type: feature
priority: 0
assignee: xiaoyvr
---
# Generate the checks; the target runs them

**As a** livingdoc user, **I want** livingdoc to generate the checks and my own
test runner to execute them, **so that** I see normal test output and my CI runs
them like any other test.

## Acceptance criteria

- **Given** a document and a config
  **When** I run `livingdoc generate`
  **Then** the generated check is written to the backend folder and the command
  exits 0 without running any tests

- **Given** the generated checks
  **When** I run the project's test runner
  **Then** it executes them and reports pass/fail with its normal output

- **Given** a document whose expectation is stale
  **When** the project's tests run
  **Then** the generated test fails; `livingdoc generate` itself does not

## Implementation tasks

- [x] 1. `check` generates only: remove `runCheck` and the runner spawn from
      `packages/cli/src/index.ts`.
- [x] 2. Widen the vitest include to `tests/**/*.test.ts` so the generated
      checks are part of the suite.
- [x] 3. Dogfood: `tests/explain/livingdoc.backend.ts` generates the fixture
      check and then runs vitest itself.
- [x] 4. Scripts: `checks` is `typecheck + generate + test`; the `dogfood`
      script becomes `generate`.
- [x] 5. DESIGN §2/§14/§15 and README describe generate-only.
- [x] 6. Rename the command and API from `check` to `generate`: the export,
      `bin.ts`, the tests, the scripts, the dogfood backend, and the docs.

