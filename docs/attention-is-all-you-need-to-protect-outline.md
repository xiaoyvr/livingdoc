# Attention Is All You Need — outline

**Title:** Attention Is All You Need  
**Subtitle (key message):** to protect...

**Deck:** [attention-is-all-you-need-to-protect.html](./attention-is-all-you-need-to-protect.html)

## 1. Title

- Title: Attention Is All You Need
- Subtitle = key message: to protect...
  - Reads as one phrase: Attention Is All You Need to protect...

## 2. New bottleneck — human understanding

- Point: Human understanding has bandwidth — attention span.

- Pictures: work must fit that bandwidth
  - Left — **Right level of cognitive load**: small end-to-end vertical slices pass easily through human understanding; we understand piece by piece
  - Right — **Cognitive surrender**: horizontal slices / premature whole-design abstraction choke the bandwidth; not how humans understand a problem

- Consequence: lose control, low confidence releasing code to production, shifting-right a heavy QA process

- Conclusion: we need to better use our attention to maxium the outcome! (Not only drinking lots of coffee...)

## 3. Failure modes

Attention is NOT well spent when:

- **Oversized unit of work**
- **Handoffs**
- **Context switching**
- **Waiting for others**
- **Early optimization/over implementation**

## 4. Promote

- Small vertical slice as the unit of the work. (what we can understand and kick off within 5 mins)
  - Not tickets as coordination between roles.
  - The slice *is* part of the work, not on a board people visit between meetings.
- Shared working space, everything lives in the codebase; push everyone there.
- Pairing / mobbing time, across roles, fewer handoffs
  - Everyone becomes a builder; roles blur.
  - Work is not linear, specialty still matters; the process does not.
- Good engineering practice matters more

## 5. Demo

On-slide: blank (title only).

Purpose: A live demo on the PDLC process, focus on from intent to story, a feedback loop during grooming,
 from story to implementation, then tasking and TDD loop. Everything in the same codebase.

Pre-empt: not proving complex domain, not proving solo = team,
not proving "has an agent". Proving where attention lives.

1. Contrast — common agentic loop vs attention-shaped loop
2. Same workspace — story in repo; trim one 5-min slice (room as product)
3. Pair on red — smallest failing check; room explains the failure
4. Minimal green — cut over-implementation if the agent floods
5. Map up — complexity multiplies these taxes; slices are how you scale understanding

## 6. Closing

We manage attention, so that we can manage our understanding,
only understanding can give us the confidence needed for production,
without confidence, we might build a bunch, still not able to ship.

Do not optimize for agent emmit, optimize for human understanding. Take
the step to ease the human understanding, not for how big the agent can
accept.

Invest in building the system and tooling. So we can go faster with
confident.

New ways of working, across-role pairing, non-linear process.

