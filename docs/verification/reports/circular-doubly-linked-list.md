# Circular Doubly Linked List Visualizer (`circular-doubly-linked-list`)

## What it visualizes
`components/circular-doubly-linked-list-visualizer.tsx` (exists, not yet imported by any page). Nodes `{id, value, prev, next}` with
`head`/`tail`; invariants `tail.next === head`, `head.prev === tail`, `prev` inverse of `next`. Operations: Insert at
Beginning / End / Position, Delete from Beginning / End / at Position, Search, Traverse Forward, Traverse Backward.

## UI input limits
Same as the circular singly list: no capacity limit, no value range (parseInt), the same position messages and alert text. On an empty list,
search and both traversals show an error frame. Ids start at 1. There is no default example or random generator.

## Engine API (pure) - `lib/engines/circular-doubly-linked-list.ts`
State `{ nodes, head, tail, nextId }`, `EMPTY_CIRCULAR_DOUBLY_LIST`. The operations `insertAtBeginning`, `insertAtEnd`, `insertAtPosition`,
`deleteFromBeginning`, `deleteFromEnd`, `deleteAtPosition`, `search`, `traverseForward` and `traverseBackward` return
`{ state, steps, ok, inputError? }`. The module also exports `circularDoublyLinkedListCode`. Pointer updates go through `patch`, which applies
them one after another, so two updates to the same node both take effect.

## Legacy check (original HEAD code, setState replaced by plain variables)
The harness is `driver.ts circular-doubly-linked-list` and its output is `results-cdll.txt`. A click that emits more than 500 frames is
classified as a hang. A legitimate click on 21 nodes emits fewer than 50.
- **Random:** 20,000 sequences of length 1-20. **99.0% of sequences hit at least one defect.**
  - **Broken structure:** 60.6% of sequences. The list no longer equals the model, or the ring or prev/next consistency is broken.
  - **Infinite loop (page freeze):** 11.7% of sequences. The loops happened in search (967 clicks), traverseForward (589) and
    traverseBackward (782).
  - **Frame with a pointer to a deleted node:** 27.1% of sequences.
  - **Code-line highlight outside the method:** 97.6% of sequences. Every operation is affected, including Delete at Position, whose method was missing from the listing.
  - **Validation:** 2.5% of sequences. An invalid value in Insert at Position is silently ignored, the same defect as in the other lists.
- **Exhaustive:** all 8,420 sequences of length 1-3 over 20 clicks. Each category below gives the number of failing sequences and the minimal counterexample:
  - **Structure (2,112):** `insertBeginning(1); insertBeginning(1)`. The old single node keeps `next -> itself`, so the forward chain
    loops at node 1 and never returns to the head.
  - **Hang (60):** `insertBeginning(1); insertBeginning(1); search(2)`. The do-while loop `current !== head` never ends and
    `setSteps` runs without end, which freezes the tab.
  - **Dangling frame (192):** `insertBeginning(1); insertBeginning(1); deleteBeginning()`. Node 1's `prev` points to the deleted
    node 2.
  - **Code line (7,905):** `insertEnd(1)` on an empty list. It highlights `// Insert at end`, which is the comment line above the method.
  - **Validation (1,181):** `insertPosition("", pos 0)`.
- **Root cause, read from the code and confirmed by the counterexamples:** links were updated by
  `nodes.map(n => n.id === A ? {...} : n.id === B ? {...} : n)`. When A === B, only the first update is applied. This causes four faults:
  - insertBeginning on a 1-node list loses `tail.next = new`. The forward ring is broken, so forward traversal and searching for a missing value hang.
  - insertEnd on a 1-node list loses `head.prev = new`. The backward ring is broken, so backward traversal hangs.
  - deleteBeginning on a 2-node list loses `newHead.prev = tail`. The survivor's prev points to the deleted node.
  - deleteEnd on a 2-node list loses `newTail.next = head`. The survivor's next points to the deleted node.

  The page itself did not crash while drawing, because the renderer has a visited-set guard. The operations themselves loop forever.
- The `|| null` id checks only caused TypeScript errors. Ids start at 1, so the checks never turned a valid id into null.

## Fixes
1. **Pointer updates are applied in order with `patch`.** All four faults are fixed for 1-node and 2-node lists.
2. Every traversal is bounded by a visited set, so even a corrupt state cannot loop forever.
3. Highlighted lines are looked up by text in the right method. I added `deleteAtPosition()` to the listing:
   `current.prev.next = current.next; current.next.prev = current.prev;`, delegating at both ends.
4. Insert at Position validates the value first. Delete-position parsing uses radix 10. Id checks use `!== null`. The renderer uses `orderFrom`.

## Properties tested (fast-check) - `tests/engines/circular-doubly-linked-list.test.ts`, oracle `tests/reference/circular-doubly-linked-list.ts`
- **Model-based, numRuns 10,000.** Each run applies up to 40 random operations drawn from all 9 UI operations. After every operation the test checks:
  - The forward ring from head equals the model and returns to head after n nodes.
  - The backward ring from tail equals the reversed model.
  - `x.next.prev === x` for every node.
  - `tail.next === head` and `head.prev === tail`.
  - There are no dangling or unreachable nodes.
  - `ok` and the error frames match, and a failed operation leaves the state unchanged.
  - Each frame is consistent, with no pointer to a missing node.
  - Highlighted lines fall inside the right method.
  - The last frame equals the new state.
  - Inserted and deleted values match.
  - Search shows the first occurrence with the right number of frames.
  - Each traversal has exactly n+1 frames in the right order.
  - The input state is not modified.
- **Input parsing:** numRuns 3,000.
- **Regression tests** for all four 1-node and 2-node faults:
  - A search on the fixed ring ends after 3 frames.
  - Backward traversal captions are exact.
  - The survivors of the 2-node deletes are self-looped.
- **Mutation check:** I put back the original exclusive-update semantics in `patch`. The model-based test then failed with the same minimal
  counterexample, `[insertBeginning 0, insertBeginning 0]`, "next chain loops at node 1", and the regression test failed too. I then restored the fix.
- **Result:** 3/3 tests pass (about 2 s), and `tsc --noEmit` reports no errors in this module.

## Not verifiable here
Animation and layout are not covered. The playback design is unchanged: frames accumulate.
