# Linear Queue Visualizer (`linear-queue`)

Component: `components/linear-queue-visualizer.tsx`
Engine: `lib/engines/linear-queue.ts` | Oracle: `tests/reference/linear-queue.ts` | Tests: `tests/engines/linear-queue.test.ts`
Legacy harness: `docs/verification/legacy/linear-queue\` (`original.tsx`, `legacy.ts`, `results.txt`);
differential check: `legacy\_dsq_diff.ts`.

## What it visualizes
An array-backed linear queue with `front`/`rear` indices (-1 when empty). Enqueue writes at `++rear`; dequeue clears
`items[front]` and advances `front`; when the last element leaves, both reset to -1. Because slots are not reused
until the queue empties, it reports "full" when `rear == size-1` even if slots at the start are free - the
"false full" condition the page explains. Frames: `{queue, front, rear, operation, element, description, isError, activeCodeLine}`.

## UI input limits
- Queue size: "Set Size" box, 1-20 (default 8). Originally `parseInt`, so "2.5" became 2; now whole numbers only.
- Value box: originally `parseInt`; now whole numbers (safe integers). No value range limit.

## Engine API (pure)
`createLinearQueue(size)`, `enqueue(state, x)`, `dequeue(state)`, `peek(state)` return `{ state, steps, value? }`;
`parseIntegerInput`, `parseQueueSize`, `playbackAfterOperation`, `LINEAR_QUEUE_CODE`.
State: `{ items, front, rear, size }`.

## Legacy check
20,000 random sequences, size 1-20, length 1-30, values -20..20, plus Clear.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| Contents, front/rear, false-full behaviour, full/empty messages vs array model | 0 failures | correct |
| Stale display (cursor never moves to the new operation; enqueue into an empty queue even shows its intermediate "Setting front to 0" frame with no element) | 19,305/20,000 sequences (96.5%) | size 8: `enqueue(2)` |
| Dequeue on empty highlights the `dequeue() {` header, not the guard | 12,513/20,000 (62.6%) | `dequeue` on a new queue |
| Peek on empty highlights a blank line | 9,243/20,000 (46.2%) | `peek` on a new queue |
| Peek success highlights the `isEmpty` guard, not `return this.items[this.front]` | 14,210/20,000 (71.0%) | `enqueue(7), peek` |
| Overall: frames with a wrong highlighted line | 80,315/347,245 frames (23.1%) | |
| `parseInt` input changes | deterministic | value "3.7" enqueues 3; size "2.5" sets size 2 |

## Fixes
1. Highlighted line for dequeue-on-empty, peek-on-empty and peek fixed (looked up by text, not hard-coded indices).
2. After each operation the player jumps to its first frame and plays if it has several (enqueue into empty has 2).
3. Value and size boxes accept whole numbers only.
4. Logic moved to the engine; the component calls it.

Differential check: on 5,000 random sequences the engine frames equal the legacy frames in every field except `activeCodeLine`.

## Properties tested (fast-check)
| Property | numRuns |
|---|---|
| Model-based vs plain JS array + "slots consumed" counter: contents, front index, rear index, every frame caption (incl. "Queue is full!", "Cannot dequeue from empty queue", "Cannot peek empty queue"), error flags, returned value | 3000 |
| Every frame: array of the chosen size, pointers in [-1, size-1], last frame = new state, occupied cells are exactly front..rear, errors leave the state unchanged | 2000 |
| Highlighted line inside the right method and is the statement doing the step (guard for errors) | 1000 |
| Playback starts at the operation's first frame and ends on the current state | 500 |
| Size box accepts exactly integers 1..20 (integers, doubles, random strings) | 3000 |
| Example: false-full (size 3, enqueue 3, dequeue 1, enqueue fails) | 1 |

All 6 tests pass (about 3-5 s).

## Not verifiable here
Animation timing/visual layout; the fix is verified at the level of the pure frame/cursor functions.
