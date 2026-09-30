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
livingdoc never runs it.

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
  a bullet must match the binding's declared parameters.
- The `it` **title** is the bullet's prose with input values substituted. Until
  rendering lands (§16.5) it still carries the raw assertion text, e.g. `toBe 90`.
- A nested heading overrides the binding. A heading with no `Example:` bullets
  is just structure. Renaming a heading changes the default lookup; naming the
  binding on the group (above, planned) removes that coupling.

## 7. The consumer's backend

The consumer writes one backend file, in their language, importing their real
code. It provides the two things a framework cannot:

1. **`register(bindings)`** — binds parameterized test bodies onto the file's
   `bindings`, with declared parameter names:

```js
export function register(bindings) {
  bindings.bind("applying-a-discount", {
    params: ["code", "total"],
    run({ code, total }) { return { result: applyDiscount(code, total) } },
  })
}
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
import { setup } from '@livingdoc/runtime'
import * as backend from '../backend'

const { bind, run } = setup(backend)

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
(`setup` → `bind` / `run` — `@livingdoc/runtime` and its Python sibling) that
the cases call.

The verb `toBe` is used **as-is** — the generator only knows *where* a verb goes
(`expect(SUBJECT).VERB(ARGS)`) and *which* verbs belong to its framework. It
does not map a universal `is` to `toBe`; the document said `toBe`, and `toBe`
is what runs.

## 9. The framework generator

Each generator knows two things: its framework's assertion *shape*, and its
assertion *verbs*.

| framework | shape | verbs (examples) | status |
|---|---|---|---|
| vitest | `expect(SUBJECT).VERB(ARGS)` | `toBe`, `toEqual`, `toContain`, `toMatch` | implemented |
| pytest | `assert SUBJECT VERB ARGS` | `==`, `!=`, `in`, `<` | implemented (liv-f6ao; verbs in scope: `==`, `!=`, `in`) |
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

The declared vocabulary is therefore: **the framework's verbs** (known to the
generator) plus **the consumer's directives** (from the backend). Any other
verb is red: "no assertion `foo`".

## 10. How one bullet is generated

```
- applying a code :="SAVE10" to a total :=`100` cart, the total !!`toBe total * 0.9`.

1. heading "Applying a discount"           → binding "applying-a-discount"
2. code :="SAVE10" total :=`100`           → inputs; names must match binding.params
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

[[backend.pytest]]
name = "pricing"
```

- **`livingdocs`** — the folder whose `*.md` files are livingdoc documents.
  `livingdoc generate` with no path generates for every opted-in document under
  it.
- **`code_path`** — the root folder for the generated tests. A backend's folder
  is `<code_path>/<name>`, holding `backend.<ext>` and a `generated/`
  subfolder. A document's test is written to
  `<code_path>/<name>/generated/<path>.test.ts`, where `<path>` is the
  document's path relative to `livingdocs` without its extension, so
  `docs/explain/a/something.md` becomes `generated/a/something.test.ts` and two
  documents cannot collide.
- **`[[backend.<framework>]]`** — one entry per backend, naming it. The table
  key is the framework (language and test runner); every backend under it uses
  that framework, so several backends can share one. A backend may be named
  after its framework (this repository uses `[[backend.vitest]] name =
  "vitest"`).

Paths are resolved relative to `livingdoc.toml`.

## 14. Generating the checks

```
livingdoc generate  # write the tests for every document and backend
livingdoc render    # produce the static site with green/red baked in
```

A document that touches several backends produces one file per backend, in that
backend's folder under `code_path`. `generate` only writes the checks. They are
part of the consumer's suite, so the consumer's own runner executes them and
reports the result. A red assertion fails their build exactly like any other
failing test; livingdoc never spawns the runner.

Domain failures — a bad config, an unknown backend, a missing file — are
returned as `Result` values whose error is a `DomainError`: a `kind` per domain
error, carrying data (`file` and `issues`, `name`, `path`) rather than a display
string. `bin` renders the message from the kind. Only unexpected environment
failures (disk full, out of memory) throw, and those crash the process.

## 15. Guarantees

1. **A document cannot be false** — a red assertion fails the generated test,
   and therefore the consumer's test run.
2. **A closed vocabulary** — parameter names and directive names are declared by
   the backend, and assertion verbs come from the framework the generator knows;
   any undeclared name is red. Doc and code share one vocabulary, and drift is
   caught both ways.
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
   which would live in the runtime (liv-ty09) alongside file-scoped `bindings`.
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
