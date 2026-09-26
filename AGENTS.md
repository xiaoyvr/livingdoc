# livingdoc


## Discipline

- Strict TDD — start with a tasking step, list the tasks and guide by it,
  failing test first, minimum impl to pass, no speculation.
- Atomic conventional commits — test and implementation together.

## Process

TDD is the discipline. This section describes the **step-by-step** mode, the
current default. Other mode is not encouraged yet.

### Step-by-step TDD

#### Loop per change:

1. **Plan first.** State the task and the intended step; wait for confirmation
   before writing anything.
2. **Red.** Write the smallest test that fails for the right reason, then show
   the whole test file and wait for review.
3. **Confirm the red.** If useful, stub the function so the failure is
   behavioral (missing output) rather than a missing import.
4. **Green.** Implement the minimum that passes — list amout of code to make it
   work first (all test passes), no speculative abstraction.
5. **Refactor.** Only when green, and only driven by bad smells; also wait for
   confirmation before writing anything.

#### Working rules

- One reviewed step at a time. Approval for one action is not approval for the
  next; do not run ahead.
- Make each task end to end — a vertical slice, not a layer. Split a step that
  is too big.

## Tickets

Work is tracked with `tk` (tickets live in `.tickets/`). Run `tk help` when you
need to use it. `tk ready` lists unblocked work, `tk show <id>` reads a ticket,
and `tk dep tree <id>` shows what it depends on.

## Layout

