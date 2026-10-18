# Circular Queue Visualizer (`circular-queue`)

Component: `components/circular-queue-visualizer.tsx`
Engine: `lib/engines/circular-queue.ts` | Oracle: `tests/reference/circular-queue.ts` | Tests: `tests/engines/circular-queue.test.ts`
Legacy harness: `docs/verification/legacy/circular-queue\` (`original.tsx`, `legacy.ts`, `results.txt`);
differential check: `legacy\_dsq_diff.ts`.

## What it visualizes
A ring buffer with `front`, `rear` and an element `count`: enqueue sets front=rear=0 on an empty queue, otherwise
`rear = (rear+1) % size`; dequeue clears `items[front]`, decrements count, resets both pointers to -1 when the queue
becomes empty, otherwise `front = (front+1) % size`. Full/empty are distinguished by `count` (`count == size` /
`count == 0`), not by pointer comparison. Frames are drawn on a circle; enqueue produces two frames (pointer move,
then store).

## UI input limits
- Queue size: `<Input type="number" min=2 max=12>` whose onChange calls `updateQueueSize(Number(value))`; accepted when 2 <= n <= 12 (default 8).
- Value box: originally `parseInt`; now whole numbers only.

## Engine API (pure)
`createCircularQueue(size)`, `enqueue(state, x)`, `dequeue(state)`, `peek(state)` return `{ state, steps, value? }`;
`isValidCircularQueueSize(n)`, `parseIntegerInput`, `playbackAfterOperation`, `CIRCULAR_QUEUE_CODE`.
State: `{ items, front, rear, count, size }`. The step shape is unchanged (no count field; the page derives the size from the frame).

## Legacy check
20,000 random sequences, size 2-12, length 1-40, values -20..20, dequeue-heavy so pointers wrap; 8,565 sequences
actually wrap `rear` from size-1 back to 0.

| Check / defect | Rate | Minimal counterexample |
|---|---|---|
| Wrap-around of front and rear, full vs empty distinction, count, FIFO contents, `rear == (front+count-1) mod size`, pointer reset when empty, captions' size numbers | 0 failures | correct |
| Non-integer queue size crashes the page: `new Array(2.5)` throws `RangeError: Invalid array length` (the check is only `2 <= n <= 12`) | every non-integer in (2,12) | type `2.5` (also 7.5, 11.9) into the size box |
| Highlighted code line wrong on every frame: the indices are 1-3 lines off (they point at `if (this.isEmpty()) {`, `} else {`, `}`, blank lines, `return element;` of dequeue for peek-empty, the method header for enqueue-full) | 580,031/580,031 frames (100%) | `enqueue(7)` on a new queue |
| Stale display (cursor never moves to the new operation) | 19,489/20,000 sequences (97.4%) | `enqueue(7)`: page shows the "Setting front and rear to 0" frame without the element |

## Fixes
1. Size control only accepts whole numbers 2..12 (`isValidCircularQueueSize`), so the crash is gone.
2. All highlighted lines corrected (looked up from the code text): full guard, `this.front = 0`, `this.rear = (this.rear + 1) % this.maxSize`,
   `this.items[this.rear] = element`, dequeue guard, `this.front = this.rear = -1`, `this.front = (this.front + 1) % this.maxSize`, peek guard / return.
3. Player jumps to the new operation's first frame and plays its 2-frame enqueue animation.
4. Value box accepts whole numbers only. Logic moved to the engine.

The queue algorithm itself was correct and is unchanged: differential check on 5,000 sequences shows identical frames except `activeCodeLine`.

## Properties tested (fast-check)
| Property | numRuns |
|---|---|
| Model-based vs plain JS array of capacity n: contents read front-to-rear with wrap-around, count, returned value, exact "Queue is full!" / "Cannot dequeue from empty queue" / "Cannot peek empty queue" | 3000 |
| front/rear equal an independent textbook ring-position tracker; each element sits in slot (head+i) mod n and every other slot is empty; every caption (incl. "(r + 1) % n = r'") equals the reference text | 2000 |
| Every frame drawable: n slots, pointers in [-1, n-1], front=-1 iff rear=-1, rendered size <= n and equal to the old or new count (nothing lost), last frame = state, errors unchanged | 2000 |
| Explicit wrap: for all n in 2..12, k in 1..n: fill, overflow message, dequeue k, enqueue k gives full queue, front = k mod n, rear = k-1, drains in FIFO order, then underflow message | 500 |
| Highlighted line per frame kind (9 kinds) inside the right method | 1000 |
| Playback starts at the operation's first frame, ends on current state | 500 |
| Size control accepts exactly integers 2..12 (integers and doubles) and every accepted size builds a queue | 3000 |

All 7 tests pass (about 4-8 s).

## Not verifiable here
SVG geometry, arrow markers and animation are visual only.
