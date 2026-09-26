---
id: liv-ter0
status: closed
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
- Config discovery: walk up from the document's directory when a path is
  given, from cwd otherwise.
- The backend filename defaults to `livingdoc.backend.<ext>`, resolved by
  scanning `backend`; `<ext>` is `ts` for now. Exactly one match is required;
  none or several is an error.
- Generated checks always land in `backend` as `<doc-basename>.test.ts`.
- `framework` is intentionally absent until the adapter story; `smol-toml` is
  added as the TOML parser.
- Carved from liv-53z4, whose `generate` command and error matrix stay there.

## Implementation tasks

- [x] 1. Config-driven generation (AC1, AC2): find `livingdoc.toml`, read
      `livingdocs` and `backend`, resolve the backend file, and write the check
      to `backend/<doc-basename>.test.ts` importing the backend by relative
      name. Migrate the existing unit and e2e fixtures to the configured
      layout.
- [x] 2. Check the whole folder (AC3): `check()` with no path checks every
      opted-in `*.md` under `livingdocs`; `bin.ts` accepts no argument.
- [x] 3. Actionable errors (AC4): a missing config or a backend folder with no
      (or several) `livingdoc.backend.*` gives a clear message and non-zero,
      not a stack trace.
- [x] 4. Docs: update DESIGN §13 and README to the `livingdocs`/`backend`
      config.
- [x] 5. Rebalance the e2e suite: delete the explicit-file tests already covered
      in process, keeping the folder scan and the error output at the command
      boundary.
- [x] 6. Fix: a missing `livingdocs` or `backend` folder gives an actionable
      message, not a raw ENOENT.
- [x] 7. Fix: `check` loads the config before the opt-in decision, so a missing
      config always fails.
- [x] 8. Fix: `livingdocs` and `backend` are relative to the config file;
      reject an absolute path with an actionable message.

