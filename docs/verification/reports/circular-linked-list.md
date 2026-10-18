# Circular Linked List Visualizer (`circular-linked-list`)

## What it visualizes
`components/circular-linked-list-visualizer.tsx`. This component is not imported anywhere yet. It shows a circular singly linked list made of nodes `{id, value, next}` with `head` and
`tail` pointers, where `tail.next === head` and a one-node list points to itself. The operations are Insert at Beginning, End and Position; Delete
from Beginning, End and at Position; Search; and Traverse. Traverse corresponds to `display()` in the code listing. Each operation produces frames like the other list visualizers.

## UI input limits
These are the same as the singly list: there is no capacity limit or value range, values are parsed with parseInt, and the position messages and the
"Position must be less than list size (n)" alert are the same. On an empty list, Search and Traverse each produce an error frame ("Cannot search
in empty list" / "Cannot traverse empty list"). Node ids start at 1, so an id is never 0. There is no default example or random generator.

## Engine API (pure) - `lib/engines/circular-linked-list.ts`
The state is `{ nodes, head, tail, nextId }` and the empty state is `EMPTY_CIRCULAR_LIST`. The operations are `insertAtBeginning`, `insertAtEnd`, `insertAtPosition`,
`deleteFromBeginning`, `deleteFromEnd`, `deleteAtPosition`, `search` and `traverse`, and each returns `{ state, steps, ok, inputError? }`.
The module also exports `circularLinkedListCode` and re-exports the parsing helpers and `orderFrom`. The component holds one `list` state and calls the engine for every operation.

## Legacy check (original HEAD code, setState replaced by plain variables)
I used the same harness as for the singly list (`driver.ts circular-linked-list`). It also checks that `tail.next === head` and that the next chain returns to
the head after visiting every node once.
- Random sequences: 20,000 sequences of length 1-20. **97.7% of them hit at least one defect.**
  - Code-line highlight outside the method that implements the frame: 97.7% of sequences. Share of failing clicks per operation:
    - deleteBeginning: 100%
    - deleteEnd: 100%
    - traverse: 100%
    - deletePosition: 95% (26,696/28,057). The listing had **no `deleteAtPosition()`**, and the remaining clicks had malformed input and produced no frames.
    - search: 94%
    - insertPosition: 0% (its indices happened to land inside the method)
  - Validation: 2.9% of sequences. As in the singly list, an invalid value is silently ignored in Insert at Position.
  - The circular structure, contents, search results and traversals were **correct** in every sequence. The pointer logic had no defect.
- Exhaustive: all 7,239 sequences of length 1-3 over 19 clicks.
  - Code line: 5,776 failing sequences. Minimal counterexample: `deleteBeginning()` on the empty list highlights `this.size++;` of
    `insertAtPosition()`.
  - Validation: 1,065 failing sequences. Minimal counterexample: `insertPosition("", pos 0)`.
- Caption glitches found by reading the code (not counted above):
  - Insert at Position 1 showed "Traversing to position 0: " with an empty path.
  - Delete from End on 2 nodes showed "Finding new tail:  → 1" with an empty segment.
- The `|| null` id checks and the `let current = head` typing were TypeScript errors only. Ids start at 1, so behaviour was unaffected.

## Fixes
1. Highlighted lines are now looked up by their text inside the right method.
2. Added `deleteAtPosition()` to the listing. It delegates to `deleteFromBeginning`/`deleteFromEnd` at the two ends, as the UI does.
3. Insert at Position now validates the value first, so the value error is reported.
4. Captions:
   - The insert-at-position path now runs from the head to the predecessor node.
   - The Delete from End caption now lists the path to the new tail ("Finding new tail: 1 → 2").
5. Search, traversal and rendering use the cycle-safe `orderFrom`, and id checks use `!== null`. Delete-position parsing uses radix 10.
6. After a successful Insert at Position, both input boxes are cleared.

## Properties tested (fast-check) - `tests/engines/circular-linked-list.test.ts`, oracle `tests/reference/circular-linked-list.ts`
- **Model-based, numRuns 10,000** (up to 40 random operations each, all 8 UI operations). After every operation:
  - The `next` chain from the head equals the model and returns to the head after exactly n nodes.
  - `tail.next === head`, and the tail is the last node.
  - There are no dangling or unreachable nodes.
  - `ok`, the error frames, the empty-list errors for search and traverse, and the delete-position alert text all match the model.
  - Failed operations leave the state unchanged.
  - Every frame is consistent.
  - Every highlighted line is inside the right method.
  - The last frame equals the new state.
  - Inserted and deleted values are correct.
  - Search reports the first occurrence with the right number of frames.
  - Traverse shows n visit frames plus a final frame with the values in order.
  - The input state is not modified.
- **Input parsing:** numRuns 3,000.
- **Regression examples:** the minimal counterexamples above, plus the two-node delete-from-end case.
- Result: 3/3 tests pass (about 2 s). `tsc --noEmit` reports no errors in this module.

## Not verifiable here
I could not check animation or visual layout. The playback design (frames accumulate across operations) is unchanged.
