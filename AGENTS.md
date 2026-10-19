# livingdoc


## Discipline

- Strict TDD — start with a tasking step, list the tasks and guide by it,
  failing test first, minimum impl to pass, no speculation.
- Atomic conventional commits — test and implementation together.

## Process

TDD is the discipline. This section describes the **step-by-step** mode, the
current default. Other mode is not encouraged yet.

### Step-by-step TDD

**Tasking first.** Always start with tasking. Maintain a realtime task list which
state the tasks and the intended steps; wait for confirmation before went into the
TDD loop.

#### Loop per change:

1. **Red.** Write the smallest test that fails for the right reason, then show
   the whole test file and wait for review.
2. **Confirm the red.** If useful, stub the function so the failure is
   behavioral (missing output) rather than a missing import.
3. **Green.** Implement the minimum that passes — list amount of code to make it
   work first (all test passes), no speculative abstraction.
4. **Refactor.** Only when green, and only driven by bad smells; also wait for
   confirmation before writing anything.

After every loop, update the task list, and revise it as needed.

#### Working rules

- One reviewed step at a time. Approval for one action is not approval for the
  next; do not run ahead.
- Make each task end to end — a vertical slice, not a layer. Split a step that
  is too big.
- Always use `write` or `edit` tool instead of bash command to write a file. If
  have problems, use `touch` to create the file then `edit`.

## Tickets

Work is tracked with `tk` (tickets live in `.tickets/`). Run `tk help` when you
need to use it. `tk ready` lists unblocked work, `tk show <id>` reads a ticket,
and `tk dep tree <id>` shows what it depends on.

Write and update the tasks inside the ticket.

**Closed tickets are immutable records.** Never edit one — not its body, its
acceptance criteria, or its frontmatter. This includes commands that rewrite a
closed ticket's frontmatter as a side effect (`tk link`, `tk unlink`, `tk dep`,
`tk status`, `tk add-note`). A closed ticket records what happened; a correction
goes forward, not backward.

When a decision or a fix touches something a closed ticket owns, put it where
work still happens: the open ticket's notes or design section, or `DESIGN.md` /
`DOMAIN.md` if it is a rule about the system. If an open ticket needs a
relationship to a closed one, describe it in prose — do not write into the
closed file.

## Conventions

### Typescript
- Prefer `type` over `interface` and `class`. Model data and error shapes as
  `type` aliases, including discriminated unions.

## Layout

Domain vocabulary lives in [DOMAIN.md](./DOMAIN.md). Add a term there only
when wording has caused confusion; prefer those names over synonyms.

