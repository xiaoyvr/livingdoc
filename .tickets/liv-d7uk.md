---
id: liv-d7uk
status: open
deps: [liv-ybyq, liv-0ou1]
links: []
created: 2026-09-26T03:21:48Z
type: feature
priority: 2
assignee: xiaoyvr
---
# Inputs and native expressions

**As a** documentation author, **I want** to give a binding several named
inputs and write expectations as computations, **so that** the document reads
in the language my team already writes.

## Acceptance criteria

- **Given** a document with several ``name :=`expr` `` inputs and an assertion
  whose arguments are a computation
  **When** I run `livingdoc generate`
  **Then** the generated test binds each input and passes it to the binding
  **And** the computation is emitted verbatim in the consumer's language

- **Given** an assertion whose computation does not hold
  **When** the project's tests run
  **Then** the generated test fails

- **Given** a document whose input name the binding does not declare
  **When** I run `livingdoc generate`
  **Then** the undeclared name is reported as an error

## Notes

- An input name is always a word before `:=`, so the old "not a valid
  identifier" case cannot arise; the remaining check is that the name matches
  the binding's declared parameters (DESIGN 6).
