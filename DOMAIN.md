# livingdoc — domain terms

Add a term here only when wording has caused confusion. Prefer these names;
do not invent synonyms for the same idea.

**`bindings`** — Named behaviors the generated test can run. Each entry is a
binding: declared `params` and a `run(...)` that exercises the real code and
returns outputs. The runtime gives each generated file its own `bindings`; the
backend's `register(bindings)` (and later inline `bind`) adds names into it.
