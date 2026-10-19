# livingdoc — domain terms

Add a term here only when wording has caused confusion. Prefer these names;
do not invent synonyms for the same idea.

**`bindings`** — Named behaviors the generated test can run. A binding is
declared params and a `run(...)` that exercises the real code and returns
outputs. The backend's module-level `bind(name, params, run)` declares one; the
backend index is the single entry the generated tests import.

**`collectBindings()`** — the runtime's read side: `{ name, params }` for every
binding the backend index reached. `collect` is the stage that obtains it; the
entrypoint that prints it is consumer code beside the index, not a generated
file.

**`manifest`** — the `{ bindings: [{ name, params }] }` document a backend's
`collect` command prints to stdout. It is a **wire value passed in memory**, not
an artifact on disk: livingdoc writes no manifest file. `manifest` as a config
key names a file someone else produced.
