# livingdoc — design

> Documentation that cannot be published while it is false.

Domain terms that have caused confusion are listed in [DOMAIN.md](./DOMAIN.md);
this document narrates the design using those names.

## 1. Vision

livingdoc turns the important behaviors of a system into living documentation:
you describe them in ordinary prose, mark the inputs and expectations, and
livingdoc generates the tests that run those behaviors against your real code.
A claim whose expectation no longer holds turns red, and the generated test
fails — so the document and the implementation cannot drift.

It documents a *subset* — the behaviors that matter for a human to understand
the system — and it is not a replacement for unit, integration, or e2e tests.

## 2. What livingdoc is, and is not

livingdoc is a **prose → code generator**. It parses the document's fluent text
into inputs and assertions, and generates test code — in the consumer's
language, wrapped in the consumer's test framework — that executes the
document against their real code. The consumer's own runner executes that code;
livingdoc never spawns the **test** runner. The one process it may spawn is a
backend's configured `collect` command (§13, §14), which is the consumer's own
declaration of how to read their bindings back — same trust model as `npm run`
or `pre-commit`.

- **is**: a parser, a text carrier, a code generator, an exit code.
- **is not**: a test runner, a test framework, a specification language, an
  assertion library, a mocking tool, or a report generator.

It has **no semantics of its own — not a type system, not an expression
grammar, not an assertion vocabulary.** It carries text and names; the target
language and framework give that text meaning.

## 3. Core idea

A document is a **parameterized test expressed as prose**:

- the **binding body** (how to run the behavior) lives once in the consumer's
  project — or, for a simple, self-contained example, in the document itself
  (a `>>` block);
- the **document** supplies the parameters — inputs and expected results — as
  free prose with marked values, using the language and test framework the
  system is actually built with;
- livingdoc generates test code that calls those bindings and evaluates those
  expectations; the consumer's own test framework runs it.

The document is *authored*, never generated. Its markup is a *locator*: it finds
the right binding and the right assertion to call.

## 4. A document, end to end

```markdown
# Checkout

## Applying a discount

Example:

- applying a code :="SAVE10" to a total :=`100` cart, the total
  !!`toBe total * 0.9`,
  !!`calls "pricing service" "Once"`,
  and the order !!`"order saved" toBe true`.
```

`toBe` is the framework's own assertion, written directly. Rendered (all markup
stripped, values colored):

> - applying a SAVE10 code to a $100 cart, the total **$90** ✓,
>   **calls "pricing service" "Once"** ✓,
>   and the order **"order saved" is true** ✓

When the implementation changes so `SAVE10` gives 15%:

> - applying a SAVE10 code to a $100 cart, the total ~~$90~~ **$85** ✗

…and the generated test fails.

## 5. The grammar

livingdoc owns a tiny inline token language, processed *before* the markup
renderer sees the document. The base format is Markdown; the token layer is
format-independent.

| construct | meaning |
|---|---|
| heading | the binding, by slug (see §6) |
| `Example:` | starts a group of test cases |
| `- …` (bullet under `Example:`) | one test case (one `it`) |
| ``name :=`expr` `` | an input; `name` is the word before `:=`; `expr` is a native expression, verbatim |
| fenced block, info ending `name :=` | a multi-line input; the block's content is the value, as a string |
| ``<lang> >>`` fenced block | target code appended inside the `describe` (per heading: liv-du6y) |
| ``!!`expr` `` | an assertion; `expr` is a framework assertion or consumer directive |
| any other code span | prose, never executed |

Assertion forms — the verb comes first:

- ``!!`toBe total * 0.9` `` — verb first (the primary result)
- ``!!`calls "pricing service" "Once"` `` — verb first, its own arguments

A middle form — ``!!`"order saved" toBe true` ``, subject then verb — is not yet
supported (§16.7).

Prose around the tokens is completely free — that is the key principle. A
bullet without tokens is prose and is never executed.

**Tokenizer:**

- *inputs* — ``name :=`expr` ``. The parameter name is the word immediately
  before `:=`; the expression is the code span, verbatim, never lexed.
  ``code :="SAVE 10"`` → name `code`, value `"SAVE 10"`.
- *assertions* — ``!!`expr` ``. `!!` marks an assertion, so an input and an
  assertion are never confused. The first word of the span is the declared
  verb; the rest is the arguments, raw, verbatim, never lexed.
  ``!!`toBe total * 0.9` `` → verb `toBe`, args `total * 0.9` (one expression).
  ``!!`calls "pricing service" "Once"` `` → verb `calls`, args
  `"pricing service" "Once"` (the verb splits its own arguments). The subject
  is the primary result; a middle form is not yet supported (§16.7).
- *fenced inputs* — a fenced code block whose info string ends with `name :=`
  binds the block's content as the string `name`. The language is optional:
  `data :=` and `ts data :=` both bind `data`; anything before the name is the
  language, for highlighting. So a whole multi-line value (a file, a payload)
  can be written in the document. The trailing newline follows CommonMark: a
  blank line before the closing fence keeps one.

Disambiguation: the sigil is glued to the opening backtick — `:=` for an
input, `!!` for an assertion. A space breaks the glue and leaves the code span
as prose; there is no escape. Because nothing inside the span is lexed,
expressions with spaces (`total * 0.9`), colons (`url("http://x")`), `+`, `]`,
quotes, and braces all pass through untouched — interpretation is the generated
code's job.

## 6. Scoping: heading = describe, bullet = it

The document's structure maps directly onto a test tree:

| test | document |
|---|---|
| `describe("Applying a discount")` | the heading `## Applying a discount` |
| `it(...)` — one case | one bullet under `Example:` |
| parameter names in the signature | the ``name :=`expr` `` / ``!!`expr` `` tokens |

- The **heading** locates the `describe` (the behavior being tested). Planned
  (liv-ejez): its default binding is `‹file›#‹heading-anchor›` — e.g.
  `checkout.md#applying-a-discount` (anchor = Markdown heading id). Today the
  binding name is still the heading's slug alone.
- `Example:` alone uses the first configured backend. A document may hold
  groups for several backends, and its cases are generated per backend.
  Planned (liv-ejez): `Example (backend: web, binding: applying-a-discount):`
  names the group's backend and binding; either key may be omitted. A missing
  `binding:` falls back to `‹file›#‹heading-anchor›`.
- The **parameter names** locate the `it` (the parameterized test): the names in
  a bullet must match the binding's declared parameters. *Planned — liv-d7uk,
  reading the manifest liv-ejez produces; nothing checks them today.*
- The `it` **title** is the bullet's prose with input values substituted. Until
  rendering lands (§16.5) it still carries the raw assertion text, e.g. `toBe 90`.
- A nested heading overrides the binding. A heading with no `Example:` bullets
  is just structure. Renaming a heading changes the default lookup; naming the
  binding on the group (above, planned) removes that coupling.

## 7. The consumer's backend

The consumer writes one backend index, in their language, importing their real
code and the modules that declare bindings. It provides three things a
framework cannot:

1. **`bind(name, params, run)`** — declares a parameterized test body with
   declared parameter names. Bindings live in modules reached through one
   index:

```js
// backend/checkout.js
import { bind } from "@livingdoc/runtime"

bind("applying-a-discount", ["code", "total"], ({ code, total }) =>
  applyDiscount(code, total),
)
```

```js
// backend.js — the only entry generate and generated tests import
import "./backend/checkout.js"
```

2. **`directives`** — custom assertion verbs (e.g. mock verification). Like the
   framework's own assertions, they fail by throwing on mismatch:

```js
export const directives = {
  calls: (outputs, subject, n) => {
    if (mock.calls(subject) !== n) throw new Error(`${subject} called ${mock.calls(subject)} times, expected ${n}`)
  },
}
```

3. **`collectBindings()`** — the runtime's read side: one entry per binding the
   index reached, as `{ name, params }`. livingdoc reaches it through the
   `collect.<ext>` entrypoint `livingdoc init` writes beside the backend index
   (§13, §14), and never imports the backend from the CLI itself. *Neither the
   export nor the emitted collector exists yet — liv-ejez, which extends
   `livingdoc init` (liv-3si5) with the entrypoint.*

The framework's own assertions (`toBe`, `toEqual`, `toContain`, …) are **not**
consumer code — the document writes them directly and the generator transcribes
them (see §8).

## 8. Code generation: language core + framework generator

livingdoc generates test code in two layers:

1. **Language core** (framework-agnostic) — bind inputs as variables, call the
   binding, emit the expectation expression as native code.
2. **Framework generator** — transcribe the document's verbs into the
   framework's assertion form, directly, with no translation.

```ts
// vitest generator (TypeScript) — the doc's !!`toBe total * 0.9`
import { describe, expect, it } from 'vitest'
import '../backend.js'
import { run } from '@livingdoc/runtime'

describe("Applying a discount", () => {
  it("applying a SAVE10 code to a $100 cart", () => {
    const code = "SAVE10";
    const total = 100;
    const result = run("applying-a-discount", { code, total });
    expect(result).toBe(total * 0.9);
  });
});
```

(Directives and named outputs — `calls(...)`, `outputs["order saved"]` — are
planned; §16.1, liv-m0mf, liv-du6y.)

The generated test is a plain test file plus a small target-language runtime
(`bind` / `run` — `@livingdoc/runtime` and its Python sibling) that the cases
call. Importing the backend index registers its bindings; the generated file
calls `run`. The index is imported by an explicit `.js` specifier, so Vite,
Node ESM, and `tsc` all resolve it.

The verb `toBe` is used **as-is** — the generator only knows *where* a verb goes
(`expect(SUBJECT).VERB(ARGS)`) and *which* verbs belong to its framework. It
does not map a universal `is` to `toBe`; the document said `toBe`, and `toBe`
is what runs.

## 9. The framework generator

Each generator knows one thing: its framework's assertion *shape* — where the
subject, the verb and the arguments go. It does **not** keep a list of legal
verbs, and checks none.

| framework | shape | verbs (examples) | status |
|---|---|---|---|
| vitest | `expect(SUBJECT).VERB(ARGS)` | `toBe`, `toEqual`, `toContain`, `toMatch` | implemented |
| pytest | `assert SUBJECT VERB ARGS` | `==`, `!=`, `in`, `<` | implemented (liv-f6ao) |
| jest | `expect(SUBJECT).VERB(ARGS)` | `toBe`, `toEqual`, `toContain`, `toMatch` | planned |

A document is bound to one framework, so it writes that framework's verbs
directly. The generator transcribes:

```
!!`toBe total * 0.9`          →  expect(result).toBe(total * 0.9)     (vitest)
!!`== total * 0.9`            →  assert result == (total * 0.9)       (pytest)
```

Consumer directives (`calls`) are transcribed as direct calls —
`calls(outputs, "pricing service", "Once")` — no wrapping, and they throw on
mismatch exactly like a framework assertion.

A verb is a name the document supplies and the generator transcribes — a
framework's own verb, or a consumer directive imported from the backend.
**livingdoc never checks whether the name exists.** Decided 2026-10-19: the
generation rule stays simple and the target judges the name.

What that costs, and it is accepted:

- **vitest** — `!!`tobe 90`` emits `expect(result).tobe(90)`; the case fails with
  `expect(...).tobe is not a function`, a message that does not point back at the
  document.
- **pytest** — a bad verb emits `assert result tobe 90`, which is a **syntax
  error**: the generated module cannot be imported, so every case in that file
  fails, not just the one with the typo.

A name is still *declared* somewhere — a framework's shape, a backend's
`directives` — but livingdoc discovers that by generating, not by validating.
The one check that does happen at generate time is parameter names against the
collected manifest (§14, liv-d7uk), because those names cannot fail any other
way: nothing in the target would ever notice an unused input.

## 10. How one bullet is generated

```
- applying a code :="SAVE10" to a total :=`100` cart, the total !!`toBe total * 0.9`.

1. heading "Applying a discount"           → binding "applying-a-discount"
2. code :="SAVE10" total :=`100`           → inputs (names matching binding.params: planned, liv-d7uk)
3. !!`toBe total * 0.9`                     → assertion: verb "toBe", args "total * 0.9"
4. generate (vitest):
     const code = "SAVE10"; const total = 100;
     const result = run("applying-a-discount", { code, total });
     expect(result).toBe(total * 0.9);
5. write the file; the consumer's runner executes it (§14)
```

## 11. Values are native expressions

A token value is **native target-language code** — a literal is just the
trivial expression. It is emitted verbatim into the generated test; livingdoc
never parses, types, or validates it.

| written | meaning |
|---|---|
| `100` | the target's number literal |
| `"SAVE10"` | the target's string literal |
| `true` | the target's boolean literal |
| `total * 0.9` | a native expression |
| `moment(total).add(1, 'day')` | a native expression using the target's libraries |

The target's own compiler/interpreter evaluates it — so the result's type is
the target's type, and the expression may use any of the target's libraries and
idioms. That is the readability guarantee: the document reads in the language
the team already speaks, with their own tools.

Consequences:

- **Currency and formatting are prose, not data** — ``total :=`100` ``,
  ``!!`toBe total * 0.9` ``. `$100` is not an expression.
- **Booleans, string quotes, and validity follow the target** — `true` (JS) vs
  `True` (Python); `'bla bla'` is a JS string but a C++ error. The target's
  compiler/interpreter is the judge, and its verdict surfaces as red.
- **Input names are valid identifiers** — they become variables in the
  generated code (`const total = 100`), so expressions can reference them
  directly.

## 12. Setup and side effects are the consumer's business

livingdoc mandates no testing style:

- **setup** — the binding body does its own setup, mock or real, in its own
  framework. A named premise in the prose (``given :=`standard-cart` ``) is just
  another input the binding understands.
- **side effects** — the binding observes them and returns them as named
  outputs (`"pricing service": 1`, `"order saved": true`); the document asserts
  on those names. Whether a count came from a spy, a live HTTP recorder, or a
  database query is invisible to livingdoc.

Swap a mock for a real database and the document does not change — only the
binding body does.

## 13. Config

One file at the project root, `livingdoc.toml`.

```toml
# livingdoc.toml
livingdocs = "docs/explain"
code_path  = "tests/explain"

[[backend.vitest]]
name = "web"
collect = ["npx", "tsx", "tests/explain/web/collect.ts", "{manifest}"]

[[backend.pytest]]
name = "pricing"
collect = ["uv", "run", "python", "-m", "pricing.collect_bindings", "{manifest}"]
# or, where the toolchain cannot run:
# manifest = "tests/explain/pricing/bindings.json"
```

- **`livingdocs`** — the folder whose `*.md` files are livingdoc documents.
  `livingdoc generate` with no path generates for every opted-in document under
  it.
- **`code_path`** — the root folder for the generated tests. A backend's folder
  is `<code_path>/<name>`, holding the backend index (for vitest
  `backend.ts`; for pytest `backend.py` or a package `backend/__init__.py`),
  the consumer's `collect.<ext>` entrypoint (§14), and a
  `generated/` subfolder. A document's test is written to
  `<code_path>/<name>/generated/<path>.test.ts`, where `<path>` is the
  document's path relative to `livingdocs` without its extension, so
  `docs/explain/a/something.md` becomes `generated/a/something.test.ts` and two
  documents cannot collide.
- **`[[backend.<framework>]]`** — one entry per backend, naming it. The table
  key is the framework (language and test runner); every backend under it uses
  that framework, so several backends can share one. A backend may be named
  after its framework (this repository uses `[[backend.vitest]] name =
  "vitest"`).
- **`collect`** — the command livingdoc spawns to read that backend's bindings
  (§14), as an **argv array**, never a shell string: no shell parsing, no
  quoting, no Windows differences. livingdoc substitutes `{manifest}` with the
  absolute `<code_path>/<name>/generated/manifest.json` and spawns the array
  otherwise exactly as written; the command writes the JSON there. The token is
  required, so every command is told its destination; a missing or unknown
  `{…}` token is `invalid-config`. stdout/stderr are logs and are never parsed.
  It runs with the `livingdoc.toml` root as cwd, so a Python backend finds its
  `pyproject.toml` and relative paths are stable. livingdoc has no default for
  it and never guesses a toolchain. *Planned — liv-ejez.*
- **`manifest`** — a path to a bindings manifest already on disk, for
  environments that cannot run the toolchain; when `collect` is unset,
  livingdoc only reads it and never writes it (§14). `collect` wins when both
  are set. *Planned — liv-ejez.*

The `{manifest}` token inside `collect` is the collect **output** path; the
`manifest` key is the **input** fallback — different things despite the name.

There is no `livingdoc collect` command: collection is a stage of `generate`.

Paths are resolved relative to `livingdoc.toml`.

## 14. Generating the checks

```
livingdoc init             # create missing backend folders and indexes
livingdoc generate [file]  # collect (planned, liv-ejez), then write the tests for every document and backend
livingdoc render           # planned (§16.5, liv-53z4): produce the static site with green/red baked in
```

A document that touches several backends produces one file per backend, in that
backend's folder under `code_path`. `generate` only writes the checks. They are
part of the consumer's suite, so the consumer's own runner executes them and
reports the result. A red assertion fails their build exactly like any other
failing test; livingdoc never spawns the **test** runner.

### Collecting the bindings

To check a document's names against real bindings, livingdoc needs the
backend's binding names — and it cannot know the consumer's toolchain, so it
spawns what the consumer declares (§13):

```
collect (spawn, per backend) → read the backend manifest
                             → resolve keys → check → emit    §14 · liv-ejez
```

Collection is a stage of `generate`, not a command of its own. The manifest is
read from a **file the command writes**, not from stdout: a toolchain command's
stdout is noisy and livingdoc does not control it. The path is fixed and
livingdoc-owned:

```
<code_path>/<name>/generated/manifest.json
```

The path reaches the command by substitution, not by convention: every
`{manifest}` in the declared argv is replaced with that absolute path before
spawning, and `{manifest}` is required — a missing or unknown `{…}` token is
`invalid-config`. A placeholder rather than a hidden trailing argument because
appending is not universally valid: `npx`, `uv` and `npm run` forward a
trailing positional, but `make collect /abs/path` reads it as another target and
fails. The token lets the consumer choose the position and form
(`make collect MANIFEST={manifest}`). livingdoc `mkdir`s `generated/` and
**unlinks the manifest before spawning**, so a command that exits zero without
writing fails as `manifest-missing` instead of passing on an earlier run's
file. That unlink, not `cleanGenerated()`, is what guarantees freshness:
`generate <file>` cleans only that document's output, while a full `generate`
also removes the whole folder. The manifest is therefore disposable and never
committed — refreshed every run, with no fingerprint or lockfile. cwd stays the
config root, so the backend index imported by both the collector and the
generated tests runs under the same cwd in both. A backend with no `collect`
command is skipped; a backend with `manifest` and no `collect` is read from
disk, with no process spawned.

Ownership of the two folders under a backend is what keeps the spawn target
alive: `code_path/<name>/` is the consumer's, created by `livingdoc init`,
committed and never clobbered; `code_path/<name>/generated/` is livingdoc's,
deleted and rewritten on every `generate`. The collector entrypoint lives in
the first, so the entrypoint a `collect` command runs survives a clean; the manifest
it writes lives in the second, because it is disposable. `init` writes only in
the first.

The contract with the spawned command:

> **Write one JSON document to the path substituted for `{manifest}`.
> stdout/stderr are logs. Exit 0 = success.**

```json
{
  "bindings": [
    { "name": "checkout.md#applying-a-discount", "params": ["code", "total"] },
    { "name": "applying-a-discount", "params": ["code", "total"] }
  ]
}
```

livingdoc validates that shape and nothing about its contents: a `collect` with
no `{manifest}` (or an unknown token) is `invalid-config` before any spawn; a
non-zero exit is `collect-failed` (backend, command, exit code, stderr tail); a
missing manifest — a command that exited zero without writing, or a configured
`manifest` path that does not exist — is `manifest-missing` (backend, path); a
file that is not the schema is `manifest-invalid` (backend, path, schema
issue). The `collect.<ext>` entrypoint `livingdoc init` emits (liv-3si5) is the
reference implementation of the contract — it writes the JSON to its manifest
argument — so a hand-written collector only has to match it.

Domain failures — a bad config, an unknown backend, a missing file — are
returned as `Result` values whose error is a `DomainError`: a `kind` per domain
error, carrying data (`file` and `issues`, `name`, `path`) rather than a display
string. `bin` renders the message from the kind. Only unexpected environment
failures (disk full, out of memory) throw, and those crash the process.

## 15. Guarantees

1. **A document cannot be false** — a red assertion fails the generated test,
   and therefore the consumer's test run.
2. **A closed vocabulary** — parameter names are declared by the backend and
   checked at generate time (planned: liv-ejez + liv-d7uk), so a name that exists
   in neither document nor code cannot slip through. Assertion verbs are not
   checked: they are transcribed, and an unknown one fails when the generated
   code runs (§9). Doc and code share one vocabulary; parameters are enforced by
   livingdoc, verbs by the target.
3. **Framework-native** — the document writes the framework's own assertions;
   the generated tests run under the consumer's real runner, in their CI.
4. **Native expressions** — values are target-language code, evaluated by the
   target's own runtime; livingdoc never types or parses.
5. **Prose is free** — livingdoc only reads the `:=` and `!!` marks; everything else
   is the author's own words.

## 16. Open questions

1. **Result mapping** — the framework's pass/fail is the CI gate, but livingdoc
   needs per-case results (including the actual on failure) to color each
   bullet. Parse the framework's reporter (TAP/junit/spec), or have each
   generated test also call a `record(id, ok, actual)` helper? Leaning: helper,
   which would live in the runtime (liv-ty09) alongside `bind` / `run`.
2. **Which frameworks next** — vitest is implemented; pytest (liv-f6ao) and
   jest are the next candidates, then node:test, Catch2, cargo-test, go-test,
   gtest.
3. **Generated-file lifecycle** — generating into `generated/` and gitignoring
   is the current answer; whether to ever commit them is still open.
4. **Fenced assertions** — a fenced *input* is supported; a multi-line
   expression can be a `>>` block, so a dedicated fenced *assertion* (`!!`
   before a block) is deferred.
5. **Rendering** — deliberately deferred. How `Example:` markers and green/red
   results are presented in HTML is not being designed yet.
6. **Base formats beyond Markdown** — the `:=` / `!!` sigils port, but the
   verbatim carrier does not: AsciiDoc's inline literal cannot hold `+` or `]`,
   so a second format would need a livingdoc-owned body delimiter rather than
   the host's literal syntax.
7. **The middle assertion form** — ``!!`"order saved" toBe true` `` (subject
   then verb) and named outputs are not yet supported (liv-du6y, liv-m0mf).
8. **Directive dispatch** — settled in part on 2026-10-19: there is **no
   generate-time check of directive verbs** (§9), so the manifest needs no
   `directives` field. What remains open is only how a generated test reaches a
   directive — imported from the backend index, or through the runtime's
   registry — and whether a directive is per backend or per document. liv-m0mf.
