---
id: liv-ter0
status: open
deps: []
links: [liv-53z4]
created: 2026-09-26T23:00:28Z
type: feature
priority: 1
assignee: xiaoyvr
---
# Configure the livingdocs folder and the backend folder

**As a** livingdoc user, **I want** one project config that names my
livingdocs folder and my backend folder, **so that** livingdoc finds my
documents and my backend no matter where the markdown and the tests live.

## Acceptance criteria

- **Given** `livingdoc.toml` with `livingdocs = "docs/explain"` and
  `backend = "tests/explain"`
  **When** I run `livingdoc check docs/explain/foo.md`
  **Then** the check is written to `tests/explain/foo.test.ts` and imports the
  backend by its default name

- **Given** `tests/explain/livingdoc.backend.ts`
  **When** the check runs
  **Then** the document's binding drives it

- **Given** `livingdoc check` with no path
  **When** I run it
  **Then** every opted-in `*.md` under `livingdocs` is checked

- **Given** no config, or a `backend` folder with no `livingdoc.backend.*`
  **When** I run `livingdoc check`
  **Then** it fails with an actionable message, not a stack trace

## Scope

- `livingdoc.toml` at the project root; `livingdocs` and `backend` are
  directories, resolved relative to the config.
- The backend filename defaults to `livingdoc.backend.<ext>`, resolved by
  scanning `backend`; `<ext>` is `ts` for now.
- Generated checks always land in `backend`, named after the document.
- `framework` is intentionally absent until the adapter story; a TOML parser
  dependency is added.
- Carved from liv-53z4, whose `generate` command and error matrix stay there.

## Implementation tasks

- [ ] 1. Load `livingdoc.toml` from the project root (paths relative to it).
- [ ] 2. Resolve the backend file by scanning `backend` for
      `livingdoc.backend.<ext>`.
- [ ] 3. Write the generated check into `backend`, named after the document,
      importing the backend by relative name.
- [ ] 4. `livingdoc check` with no path checks every opted-in document under
      `livingdocs`.
- [ ] 5. Fail with an actionable message for a missing config or backend.

