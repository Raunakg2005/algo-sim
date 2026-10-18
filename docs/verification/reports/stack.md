# Stack Operations Visualizer (`stack`)

Component: `components/stack-operations-visualizer.tsx`
Engine: `lib/engines/stack.ts` | Oracle: `tests/reference/stack.ts` | Tests: `tests/engines/stack.test.ts`
Legacy harness: `docs/verification/legacy/stack\` (`original.tsx` = `git show HEAD:...`, `legacy.ts`, `results.txt`);
differential check of all five DS modules: `legacy\_dsq_diff.ts` / `_dsq_diff_results.txt`.

## What it visualizes
A bounded LIFO stack. Push (text box + button or Enter), Pop, Peek, Clear. Each operation appends one frame
(`{stack, operation, element, description, isError, activeCodeLine}`) to a replayable history with
step/play/speed controls, and highlights a line of the displayed `class Stack` pseudocode.

## UI input limits
- Capacity fixed at 10 (`maxSize`); the 11th push shows "Cannot push x. Stack is full (max size: 10)".
- Value box: originally `Number.parseInt` (any string starting with digits was accepted); now whole numbers only
  (safe integers, optional sign). No value range limit.
- Pop/Peek on an empty stack show "Cannot pop from empty stack" / "Cannot peek empty stack".

## Engine API (pure)
- `createStack(maxSize = 10): StackState` (`{ items, maxSize }`, items bottom to top)
- `push(state, x)`, `pop(state)`, `peek(state)` return `{ state, steps: StackStep[], value? }`
- `parseIntegerInput(raw)` returns `{ value } | { error }`
- `playbackAfterOperation(prevFrames, addedFrames)` returns `{ index, play }`
- `STACK_CODE`, `STACK_MAX_SIZE`. Highlighted line numbers are looked up from the code text, so they cannot drift.

## Legacy check (original HEAD code, setState replaced by plain variables)
20,000 random operation sequences (length 1-30, values -20..20 so duplicates/zero/negatives are common, push-biased
so the 10-element limit is hit). Results:

| Defect | Rate | Minimal counterexample |
|---|---|---|
| Stack contents / returned values / overflow + underflow messages vs array model | 0 failures | correct |
| Visualization shows a stale frame: the cursor never moves to a new operation, so after the 2nd operation the page shows the first operation's frame (size, top, caption) | 18,959/20,000 sequences (94.8%) | `push(5), pop`: page still shows `[5]` |
| Pop success highlights the `if (this.isEmpty()) return null;` guard | 16,610/20,000 (83.0%) | `push(5), pop` |
| Peek success highlights the guard instead of `return this.items[this.top]` | 14,759/20,000 (73.8%) | `push(0), peek` |
| "Stack is full" frame highlights `this.top++`; the displayed code had no capacity check at all | 1,813/20,000 (9.1%) | 10 pushes, then `push(x)` |
| Overall: frames with a wrong highlighted line | 105,572/300,246 frames (35.2%) | |
| Input parsing via `parseInt` silently changes input | deterministic | "3.7" pushes 3, "1e3" pushes 1, "12abc" pushes 12, "0x1A" pushes 0, "99999999999999999999" pushes 1e20 |

## Fixes
1. Pseudocode now contains the capacity the UI enforces (`constructor(maxSize = 10)`, `if (this.isFull()) return false;`,
   `isFull()`); every frame highlights the statement that performs it (guard line for errors, the store / `this.top--` /
   `return this.items[this.top]` lines for successes).
2. After each operation the player jumps to that operation's first frame (and plays if it has several), so the
   picture always shows the result of what the user just did; history replay is unchanged.
3. Value box accepts whole numbers only ("Please enter a valid integer" otherwise).
4. Logic moved to the engine; the component only calls it (`applyResult`).

Differential check: on 5,000 random sequences the engine's frames are identical to the legacy frames in every field
except `activeCodeLine` (deliberately fixed).

## Properties tested (fast-check)
| Property | numRuns |
|---|---|
| Model-based: after every op of a random sequence (push/pop/peek/clear) the stack equals a plain JS array model with capacity 10; error flag, exact caption/overflow/underflow message, returned value match | 3000 |
| Any capacity 1-12: never more than maxSize elements in any frame; full push is an error; errors leave the state unchanged (same object) | 2000 |
| Every frame shows the state after the operation (a copy) and carries the right element | 2000 |
| Highlighted line is inside the right method and is the guard (errors) or the working statement | 1000 |
| Playback index = first frame of the new operation; last frame = current state | 500 |
| `parseIntegerInput` agrees with an independent reference parser on integers, doubles, random strings and edge strings | 5000 |
| Example: 11th push rejected with the exact UI message | 1 |

All 7 tests pass (about 3-5 s).

## Not verifiable here
framer-motion enter/exit animation, the speed slider timing and the layout are visual only. The fix to the playback
cursor is tested through the pure `playbackAfterOperation` helper, not by rendering React.
