# Priority Queue Visualizer (`priority-queue`)

Component: `components/priority-queue-visualizer.tsx`
Engine: `lib/engines/priority-queue.ts` | Oracle: `tests/reference/priority-queue.ts` | Tests: `tests/engines/priority-queue.test.ts`
Legacy harness: `docs/verification/legacy/priority-queue\` (`original.tsx`, `legacy.ts`, `results.txt`);
differential check: `legacy\_dsq_diff.ts`.

## What it visualizes
A binary-heap priority queue of `{value, priority, id}` in Max Heap or Min Heap mode (a select; switching clears the
queue). Enqueue appends and sifts up (one frame per swap), dequeue moves the last element to the root and sifts down
(one frame per swap), peek reads the root. The page draws the elements as a queue from "HIGHEST/LOWEST PRIORITY"
(front) to the other end, plus "Next to dequeue", "Next Priority" and "Priority Range" statistics.

## Which priority is served first, and ties
- Max Heap: the largest priority number is served first; Min Heap: the smallest. This matches the page text
  ("Elements with higher priority (Max Heap) or lower priority (Min Heap) are dequeued first", "Next to Dequeue
  (Highest/Lowest Priority)"). Verified: 0 failures in the legacy check, and as a property of the engine.
- Ties: `compare` is strict, as in the displayed pseudocode, so the heap is not stable: equal priorities are NOT served in
  arrival order (11.4% of random sequences show this; e.g. Min Heap `enqueue(12,p=1), enqueue(-4,p=-2), enqueue(17,p=1)`
  then two dequeues give -4, then 17 before 12). The page never claims FIFO tie-breaking, so this is reported as
  behaviour, not a defect, and the algorithm was left as the pseudocode shows.

## UI input limits
Value and priority boxes: originally `parseInt` each (so "2.5" became 2); now both must be whole numbers
(safe integers). No capacity limit, no value range limit.

## Engine API (pure)
`createPriorityQueue(isMaxHeap)`, `enqueue(state, value, priority)`, `dequeue(state)`, `peek(state)` return
`{ state, steps, value? }` with state `{ heap, isMaxHeap, nextId }`; `serviceOrder(heap, isMaxHeap)` (the order
elements will really leave; used for the drawn queue); `nextPriorityLabel(heap)`; `parsePriorityQueueInput`;
`playbackAfterOperation`; `PRIORITY_QUEUE_CODE`.

## Legacy check
20,000 random sequences (Max or Min mode, length 1-30, values -20..20, priorities -3..6 so ties and 0 are frequent).

| Check / defect | Rate | Minimal counterexample |
|---|---|---|
| Dequeue serves the max (Max Heap) / min (Min Heap) priority; heap property after every op; contents vs model; "Next to dequeue" = element dequeue removes | 0 failures | correct |
| Drawn queue order differs from the real dequeue order among equal priorities (page sorted the heap array with a stable sort by priority, which is not the order the non-stable heap serves ties) | 11,202/20,000 sequences (56.0%) | Min: `enqueue(3,p=1), enqueue(2,p=2), enqueue(-9,p=2)`: drawn 3, 2, -9 but served 3, -9, 2 |
| "Next Priority" statistic shows "N/A" when the next priority is 0 (`priority \|\| "N/A"`) | 8,179/20,000 (40.9%) | `enqueue(7,p=0)` |
| Min Heap captions say "Highest priority element is x" (peek) and "removed the highest priority element" (dequeue) for the lowest-priority element, contradicting the page | 8,160/20,000 (40.8%) | Min: `enqueue(7,p=1), peek` |
| Wrong highlighted line: enqueue final frame on `}`, heapifyUp swaps on `const parentIndex = ...`, heapifyDown swaps on `if (rightChild < ...`, dequeue frames on `dequeue() {` / `const root = ...`, peek on `peek() {` or a blank line | 446,935/701,903 frames (63.7%) | `enqueue(8,p=3)` |
| Stale display (cursor never moves to the new operation) | 19,104/20,000 sequences (95.5%) | `peek, enqueue(8,p=4)` |

## Fixes
1. The drawn queue (and "Next to dequeue") now uses `serviceOrder`, the exact order repeated dequeues remove the
   elements, so ties are drawn the way they will be served. The heap algorithm is unchanged.
2. "Next Priority" shows 0 correctly (`nextPriorityLabel`).
3. Captions say "lowest" in Min Heap mode.
4. Highlighted lines corrected: `this.heap.push(element)`, `this.heapifyUp(...)`, `this.swap(index, parentIndex)`,
   `this.swap(index, targetIndex)`, dequeue guard, `if (this.heap.length === 1)`, `this.heap[0] = this.heap.pop()`,
   `this.heapifyDown(0)`, peek's return.
5. Player jumps to the new operation's first frame and plays through the sift frames.
6. Value/priority must be whole numbers. Logic moved to the engine.

Differential check on 5,000 sequences: engine frames identical to legacy frames in every field except
`activeCodeLine` and the highest->lowest wording in Min Heap mode.

## Properties tested (fast-check)
| Property | numRuns |
|---|---|
| Model-based vs plain array: dequeue/peek return an element of the max (Max Heap) or min (Min Heap) priority; element set equals the model; heap property after every op; empty messages exact | 3000 |
| Heap array (by id) and number of swap frames equal an independent textbook binary heap after every operation | 2000 |
| Every frame keeps the element set; each swap frame swaps exactly the two named positions, which are parent/child; final frame is a heap | 2000 |
| Captions never say "highest" in Min Heap mode / "lowest" in Max Heap mode; peek caption starts with the right word | 1000 |
| Drawn order = order the engine's own dequeue drains the queue = textbook heap extract order; priorities monotone; first = heap root; Next Priority label correct incl. 0 | 1000 |
| Highlighted line per frame kind inside the right method | 1000 |
| Playback starts at the operation's first frame, ends on current state | 500 |
| Input validation accepts integer pairs; rejects missing, "2.5", "1e3" | 1000 |
| Example documenting non-FIFO ties, their new drawing, and "0" label | 1 |

All 9 tests pass (about 4-5 s).

## Not verifiable here
Animation, colours and layout are visual only.
