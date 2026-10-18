# Double-Ended Queue Visualizer (`deque`)

Component: `components/double-ended-queue-visualizer.tsx`
Engine: `lib/engines/deque.ts` | Oracle: `tests/reference/deque.ts` | Tests: `tests/engines/deque.test.ts`
Legacy harness: `docs/verification/legacy/deque\` (`original.tsx`, `legacy.ts`, `results.txt`);
differential check: `legacy\_dsq_diff.ts`.

## What it visualizes
A circular-array deque with `front`, `rear`, `count`: Add Front (`front = (front-1+size) % size`), Add Rear
(`rear = (rear+1) % size`), Remove Front, Remove Rear (`rear = (rear-1+size) % size`), Peek Front, Peek Rear, Clear.
Adds produce two frames (pointer move, store); empty state resets pointers to -1.

## UI input limits
- Deque size: "Set Size" box, 2-12 (default 8). Originally `parseInt` ("2.5" became 2); now whole numbers only.
- Value box: originally `parseInt`; now whole numbers only.

## Engine API (pure)
`createDeque(size)`, `addFront`, `addRear`, `removeFront`, `removeRear`, `peekFront`, `peekRear` return `{ state, steps, value? }`;
`parseIntegerInput`, `parseDequeSize`, `playbackAfterOperation`, `DEQUE_CODE`. State: `{ items, front, rear, count, size }`.

## Legacy check
20,000 random sequences, size 2-12, length 1-40, values -20..20, all six operations plus Clear.

| Check / defect | Rate | Minimal counterexample |
|---|---|---|
| Contents front-to-rear, count, wrap in both directions, returned elements, full/empty messages, caption sizes | 0 failures | correct |
| Stale display (cursor never moves to the new operation) | 19,499/20,000 sequences (97.5%) | size 4: `addRear(3)` |
| Wrong highlighted line (14 of the 20 frame kinds): e.g. removeFront/removeRear on empty highlight the header or a blank line, set-front-rear frames highlight `if (this.isEmpty()) {`, removeFront move highlights `} else {`, removeRear move highlights `this.front = this.rear = -1;`, peekFront/peekRear highlight the method header, full errors highlight the method header | 278,322/586,124 frames (47.5%); per kind 23-74% of sequences | `addRear(3)`; `removeFront` on empty; `addRear(7), addFront(6), removeRear` |

## Fixes
1. Every frame highlights the statement it performs (looked up from the code text).
2. Player jumps to the new operation's first frame and plays multi-frame adds.
3. Value and size boxes accept whole numbers only. Logic moved to the engine.

Differential check on 5,000 sequences: frames identical to legacy except `activeCodeLine`.

## Properties tested (fast-check)
| Property | numRuns |
|---|---|
| Model-based vs plain JS array (unshift/push/shift/pop) with capacity n: contents, count, returned/peeked element, exact full/empty messages | 3000 |
| front/rear equal an independent ring-position tracker for a circular deque; slot layout exact (no strays); every caption equals the reference text | 2000 |
| Every frame drawable: n slots, pointers in range, front=-1 iff rear=-1, no element lost, last frame = state, errors leave state unchanged | 2000 |
| Highlighted line per frame inside the right method | 1000 |
| Playback starts at the operation's first frame, ends on current state | 500 |
| Size box accepts exactly integers 2..12 | 3000 |

All 6 tests pass (about 2-6 s).

## Not verifiable here
SVG layout and animation are visual only.
