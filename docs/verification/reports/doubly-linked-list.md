# Doubly Linked List Visualizer (`doubly-linked-list`)

## What it visualizes
`components/doubly-linked-list-visualizer.tsx` (it exists but is not yet imported by any page). The visualizer shows nodes `{id, value, prev, next}` with `head` and
`tail` pointers. It offers Insert at Beginning / End / Position, Delete from Beginning / End, Search, Traverse Forward and Traverse
Backward. There is no Delete at Position. The frames carry the node array, head, tail, a caption, highlighted nodes and a highlighted line
of a JS `DoublyLinkedList` listing.

## UI input limits
These are the same as for the singly list. There is no capacity or value limit, and the value is `parseInt(trim, 10)` with the messages "Please enter a number" or
"Please enter a valid number". The insert position must be at least 0, and positions greater than the size give the error frame "Invalid position p. List size is n". Search on an empty list
is not an error and shows "not found". Traverse on an empty list is an error frame: "Cannot traverse empty list". Ids start at 1 and
are never 0. There is no default example or random generator, and the list starts empty.

## Engine API (pure) - `lib/engines/doubly-linked-list.ts`
The state is `{ nodes, head, tail, nextId }`, with `EMPTY_DOUBLY_LIST`. Each of `insertAtBeginning`, `insertAtEnd`, `insertAtPosition`,
`deleteFromBeginning`, `deleteFromEnd`, `search`, `traverseForward` and `traverseBackward` returns `{ state, steps, ok }`.
The module also exports `doublyLinkedListCode` and re-exports `parseValueInput`, `parsePositionInput`, `orderFrom` and `orderBackFrom`
from the shared helpers in `singly-linked-list.ts`. The component keeps one `list` state and only calls the engine.

## Legacy check (original HEAD code, setState replaced by plain variables)
The harness is the same as for the singly list: `...\algoaudit\legacy\_lists\driver.ts doubly-linked-list`. It checks the backward
chain from the tail and prev/next consistency as well.
- **Random sequences:** 20,000 sequences of length 1-20 (values -20..20, positions 0..size+1, 5% malformed input). **98.3% of the sequences hit
  at least one defect.**
  - Code-line highlight outside the method that implements the frame: 98.3% of sequences. Failing clicks by operation:
    - deleteBeginning: 100%
    - deleteEnd: 100%
    - traverseForward: 100%
    - traverseBackward: 100%
    - search: 94% (25,670/27,371)
    - insertPosition: 33% (10,564/32,016)
  - Validation: 2.9% of sequences. As in the singly list, an invalid value is silently ignored when the position is valid.
  - The list contents, both pointer directions, head and tail, search results and traversal frames were **correct** in all
    sequences. The original pointer logic of this list had no defect.
- **Exhaustive:** all 5,219 sequences of length 1-3 over 17 clicks.
  - Code line: 4,508 failing. The minimal case is `insertPosition(1, pos 1)` on an empty list. Its error frame highlights line 41,
    `// Insert at position`, which is the comment above the method.
  - Validation: 851 failing. The minimal case is `insertPosition("", pos 0)`.
  - Other examples of wrong highlights: deleteBeginning highlights `current.prev = newNode;` in `insertAtPosition()`, search highlights
    lines of `deleteFromEnd()`, and Traverse Backward highlights lines of `traverseForward()`.
- `|| null` id checks are latent only, because ids start at 1.

## Fixes
1. All highlighted lines are now found by text inside the correct method. For example, a traversal visit highlights
   `elements.push(current.data);` in `traverseForward()` or `traverseBackward()`, and completion highlights `return elements;`.
2. Insert at Position validates the value first, so the value's error message is no longer overwritten.
3. The traversal loops are bounded by a visited set. Id checks use `!== null`. The renderer uses the cycle-safe `orderFrom`.
4. After a successful Insert at Position, both input boxes are cleared. This now also happens when the insert delegates to the beginning or end.

## Properties tested (fast-check) - `tests/engines/doubly-linked-list.test.ts`, oracle `tests/reference/doubly-linked-list.ts`
- **Model-based, numRuns 10,000** (up to 40 random operations each, all 8 UI operations). After every operation:
  - The values in forward order equal the model.
  - The values in backward order from the tail equal the reversed model.
  - For every node, `x.next.prev === x`.
  - `head.prev` and `tail.next` are null.
  - The tail is the last node.
  - There are no unreachable or dangling nodes.
  - `ok` and the error frames follow the model, and failed operations leave the state unchanged.
  - Every frame is consistent.
  - Every highlighted line lies inside the right method.
  - The last frame equals the new state.
  - Inserted and deleted values match.
  - Search shows the first occurrence and the right number of comparison frames.
  - Each traversal shows exactly n visit frames plus a final frame, with the values in the right order and all nodes highlighted.
  - Input states are never modified.
- **Input parsing:** numRuns 3,000.
- **Regression examples:** the minimal counterexamples above, plus backward traversal of [1, 2].
- **Result:** 3/3 tests pass (about 2 s). `tsc --noEmit` reports no errors in this module.

## Not verifiable here
Animation timing and appearance were not checked. The playback design (frames accumulate and the view is not moved to the new frames) is unchanged.
