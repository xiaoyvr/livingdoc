# livingdoc — design

> Documentation that cannot be published while it is false.

## 1. Vision

livingdoc turns the important behaviors of a system into living documentation:
you describe them in ordinary prose, mark the inputs and expectations, and
livingdoc executes the behavior against your real code at build time. A claim
whose expectation no longer holds turns red, and the generated test fails — so
the document and the implementation cannot drift.

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
  project;
- the **document** supplies the parameters — inputs and expected results — as
  free prose with marked values, using the language and test framework the
  system is actually built with;
- livingdoc generates test code that calls those bindings and evaluates those
  expectations, runs it through the consumer's own test framework, and colors
  the result.

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
| ``!!`expr` `` | an assertion; `expr` is a framework assertion or consumer directive |
| any other code span | prose, never executed |

Assertion forms — the verb may appear first or in the middle:

- ``!!`toBe total * 0.9` `` — verb first (the primary result)
- ``!!`"order saved" toBe true` `` — verb in the middle (subject + expected)
- ``!!`calls "pricing service" "Once"` `` — verb first, its own arguments

Prose around the tokens is completely free — that is the key principle. A
bullet without tokens is prose and is never executed.

**Tokenizer:**

- *inputs* — ``name :=`expr` ``. The parameter name is the word immediately
  before `:=`; the expression is the code span, verbatim, never lexed.
  ``code :="SAVE 10"`` → name `code`, value `"SAVE 10"`.
- *assertions* — ``!!`expr` ``. `!!` marks an assertion, so an input and an
  assertion are never confused. The first word of the span is the declared
  verb; the text before it is the subject, the rest is the arguments — each
  raw, verbatim, never lexed. ``!!`toBe total * 0.9` `` → verb `toBe`, args
  `total * 0.9` (one expression). ``!!`calls "pricing service" "Once"` `` →
  verb `calls`, args `"pricing service" "Once"` (the verb splits its own
  arguments).
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

- The **heading** locates the `describe` (the action being tested): its slug is
  the binding name — `## Applying a discount` → `applying-a-discount`
  (lowercase, whitespace → hyphen, digits kept, other punctuation dropped).
- The **parameter names** locate the `it` (the parameterized test): the names in
  a bullet must match the binding's declared parameters.
- The `it` **title** is the bullet's prose with input values substituted. Until
  rendering lands (§16.5) it still carries the raw assertion text, e.g. `toBe 90`.
- A nested heading overrides the binding. A heading with no `Example:` bullets
  is just structure. No explicit binding override exists — renaming a heading
  changes the slug and breaks the lookup, which is drift caught red.

## 7. The consumer's backend

The consumer writes one backend file, in their language, importing their real
code. It provides the two things a framework cannot:

1. **`bindings`** — parameterized test bodies, with declared parameter names:

```js
export const bindings = {
  "applying-a-discount": {
    params: ["code", "total"],
    run({ code, total }) { return { result: applyDiscount(code, total) } },
  },
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
consumer code — the document writes them directly and the adapter transcribes
them (see §8).

## 8. Code generation: language core + framework adapter

livingdoc generates test code in two layers:

1. **Language core** (framework-agnostic) — bind inputs as variables, call the
   binding, emit the expectation expression as native code.
2. **Framework adapter** — transcribe the document's verbs into the framework's
   assertion form, directly, with no translation.

```js
// jest adapter (JavaScript) — the doc's !!`toBe total * 0.9`
describe("Applying a discount", () => {
  it("applying a SAVE10 code to a $100 cart", () => {
    const code = "SAVE10";
    const total = 100;
    const outputs = bindings["applying-a-discount"].run({ code, total });
    expect(outputs.result).toBe(total * 0.9);
    calls(outputs, "pricing service", "Once");
    expect(outputs["order saved"]).toBe(true);
  });
});
```

The verb `toBe` is used **as-is** — the adapter only knows *where* a verb goes
(`expect(SUBJECT).VERB(ARGS)`) and *which* verbs belong to its framework. It
does not map a universal `is` to `toBe`; the document said `toBe`, and `toBe`
is what runs.

## 9. The framework adapter

Each adapter knows two things: its framework's assertion *shape*, and its
assertion *verbs*.

| framework | shape | verbs (examples) |
|---|---|---|
| jest | `expect(SUBJECT).VERB(ARGS)` | `toBe`, `toEqual`, `toContain`, `toMatch` |
| pytest | `assert SUBJECT VERB ARGS` | `==`, `!=`, `in`, `<` |
| Catch2 | `REQUIRE(SUBJECT VERB ARGS)` | `==`, `!=`, `<=` |

A document is bound to one framework, so it writes that framework's verbs
directly. The adapter transcribes:

```
!!`toBe total * 0.9`          →  expect(result).toBe(total * 0.9)     (jest)
!!`== total * 0.9`            →  assert result == (total * 0.9)       (pytest)
```

Consumer directives (`calls`) are transcribed as direct calls —
`calls(outputs, "pricing service", "Once")` — no wrapping, and they throw on
mismatch exactly like a framework assertion.

The declared vocabulary is therefore: **the framework's verbs** (known to the
adapter) plus **the consumer's directives** (from the backend). Any other verb
is red: "no assertion `foo`".

## 10. How one bullet is generated

```
- applying a code :="SAVE10" to a total :=`100` cart, the total !!`toBe total * 0.9`.

1. heading "Applying a discount"           → binding "applying-a-discount"
2. code :="SAVE10" total :=`100`           → inputs; names must match binding.params
3. !!`toBe total * 0.9`                     → assertion: verb "toBe", args "total * 0.9"
4. generate (jest):
     const code = "SAVE10"; const total = 100;
     const outputs = bindings["applying-a-discount"].run({ code, total });
     expect(outputs.result).toBe(total * 0.9);
5. run `jest`; map each test's result back to its bullet; color green/red
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

One file at the project root, `livingdoc.toml`; the livingdocs folder and the
backend folder are the key settings.

```toml
# livingdoc.toml
livingdocs = "docs"
backend    = "tests"
```

- **`livingdocs`** — the folder whose `*.md` files are livingdoc documents.
  `livingdoc generate` with no path generates a check for every opted-in
  document under it.
- **`backend`** — the folder holding the backend. livingdoc finds the backend
  by its default name, `livingdoc.backend.<ext>`.
- Paths are resolved relative to `livingdoc.toml`; generated checks are written
  into `backend` as `<document>.test.ts`.

The framework adapter is not yet a setting; TypeScript + Vitest is the only
target.

## 14. Generating the checks

```
livingdoc generate  # generate test code next to the backend
livingdoc render    # produce the static site with green/red baked in
```

`generate` only writes the checks. They are part of the consumer's suite, so
the consumer's own runner executes them and reports the result. A red assertion
fails their build exactly like any other failing test; livingdoc never spawns
the runner.

## 15. Guarantees

1. **A document cannot be false** — a red assertion fails the generated test,
   and therefore the consumer's test run.
2. **A closed vocabulary** — parameter names and directive names are declared by
   the backend, and assertion verbs come from the framework the adapter knows;
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
   generated test also call a `record(id, ok, actual)` helper? Leaning: helper.
2. **Which frameworks first** — jest + pytest + Catch2 as the seed? Then
   node:test, vitest, cargo-test, go-test, gtest?
3. **Generated-file lifecycle** — commit for review, or regenerate each `check`
   and gitignore?
4. **Compound and multi-line values** — a code span covers `[1, 2]` and
   `{ "a": 1 }` on one line; a multi-line expression needs a fenced variant
   (`!!` before a fenced block). Deferred.
5. **Rendering** — deliberately deferred. How `Example:` markers and green/red
   results are presented in HTML is not being designed yet.
6. **Base formats beyond Markdown** — the `:=` / `!!` sigils port, but the
   verbatim carrier does not: AsciiDoc's inline literal cannot hold `+` or `]`,
   so a second format would need a livingdoc-owned body delimiter rather than
   the host's literal syntax.
