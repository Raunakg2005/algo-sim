# Singly Linked List Visualizer (`singly-linked-list`)

## What it visualizes
`components/singly-linked-list-visualizer.tsx` (the only list visualizer currently wired into the app). The user builds a
singly linked list (nodes `{id, value, next}`, a `head` pointer) with Insert at Beginning / End / Position,
Delete from Beginning / End / at Position and Search. Each click appends frames (node array, head, caption, highlighted
nodes, highlighted line of a JS `SinglyLinkedList` code listing) to a playback list.

## UI input limits
- No capacity limit and no value range: any text that `parseInt(text.trim(), 10)` accepts is a value (negatives, 0,
  duplicates allowed). Empty: "Please enter a number"; non-numeric: "Please enter a valid number".
- Insert position: empty → "Please enter a position"; non-numeric or negative → "Please enter a valid position (≥ 0)";
  position > size → error frame "Invalid position p. List size is n".
- Delete position: non-numeric or negative → "Please enter a valid position (0 or greater)"; position ≥ size → error
  frame plus alert "Position must be less than list size (n)".
- The list starts empty; there is no default example and no random generator.
- Node ids come from a counter starting at 1 (reset to 1 by Clear), so an id is never 0.

## Engine API (pure) - `lib/engines/singly-linked-list.ts`
State `{ nodes, head, nextId }`, `EMPTY_SINGLY_LIST`. Every operation returns
`{ state, steps, ok, inputError? }`, and the input state is not modified:
`insertAtBeginning(s, v)`, `insertAtEnd(s, v)`, `insertAtPosition(s, v, p)`, `deleteFromBeginning(s)`,
`deleteFromEnd(s)`, `deleteAtPosition(s, p)`, `search(s, v)`; input parsing `parseValueInput`, `parsePositionInput`,
`parseDeletePositionInput`; `singlyLinkedListCode` (the listing); `orderFrom` / `orderBackFrom` (cycle-safe walks used by
the renderer); `codeLineFinder` (line lookup by text inside a method). The other three list engines reuse these
helpers. The component now holds one `list` state object, calls the engine, and renders `ll.orderFrom(frame.nodes, frame.head)`.

## Legacy check (original HEAD code, setState replaced by plain variables)
Harness: `docs/verification/legacy/_lists\` (`gen.mjs` copies the interfaces, code listing and
every handler from `git show HEAD:...` verbatim into `legacy/singly-linked-list/legacy.ts`. A click reads a
render-time snapshot, and writes are applied after the handler returns, as React batching does. `driver.ts` drives the
handlers and compares them with an array model after every click.) Results are in `results.txt`.

- **Random:** 20,000 click sequences of length 1-20, using every operation, values -20..20, positions 0..size+1 and 5% malformed input.
  **97.7% of sequences hit at least one defect.**
  - Code-line highlight outside the method that implements the frame: 97.7% of sequences. By operation, the
    failing share of clicks was deleteBeginning 100% (34,973/34,973), deletePosition 95% (29,546/31,138),
    deleteEnd 64% (18,758/29,092), search 61% (21,654/35,298) and insertPosition 33% (11,470/35,285).
    insertBeginning and insertEnd had no such failures.
  - Validation: 3.4% of sequences (685 clicks). In Insert at Position, an invalid value with a valid position is ignored
    silently. `validateInput()` sets "Please enter a number", then `validatePosition()` succeeds and clears the message
    with `setInputError("")`, and the handler returns without doing anything.
  - The list contents, pointer structure, search results and frame consistency were **correct** in every sequence.
- **Exhaustive:** all 6,174 sequences of length 1-3 over 18 clicks (values 1 and 2, positions 0-2, one empty value).
  - Code line: 5,211 failing. Minimal case: `insertPosition(1, pos 1)` on the empty list. The error frame highlights line 35, which is a
    blank line before `insertAtPosition()`.
  - Validation: 955 failing. Minimal case: `insertPosition("", pos 0)`. No message appears and nothing happens.
- The highlights were wrong because every `activeCodeLine` was a hard-coded index and these indices no longer matched the listing. Some examples:
  search highlights `return deletedData;` of `deleteFromEnd()`, deleteBeginning highlights lines of `insertAtPosition()`, and
  Delete at Position highlights `deleteFromEnd()`, because the listing had no `deleteAtPosition()` at all.
- `node?.next || null` (the TypeScript issue) cannot change behaviour here, because ids start at 1. It was a latent bug only.

## Fixes
1. Every highlighted line is now found from its text inside the right method (`codeLineFinder`), which throws at module load
   if the listing changes. The lines were chosen per frame. For example, the comparison frame highlights `if (current.data === data) {`,
   "Found" highlights `return position;` and the invalid-position frame highlights `throw new Error('Invalid position');`.
2. A `deleteAtPosition(position)` method was added to the code listing, because the UI offers the operation.
3. Insert at Position validates the value first and stops on its error, so the message is no longer overwritten.
4. Caption: Insert at Position used to show "Traversing to position 0: " with an empty path and no highlight
   for position 1. The highlighted path now runs from the head to the predecessor node (position-1).
5. Delete-position parsing uses radix 10 like the other boxes. Before, `"0x1"` parsed as 1 in delete but as 0 in insert.
6. The engine and renderer use explicit `!== null` id checks and a cycle-safe walk instead of truthiness and `|| null`.
7. After a successful Insert at Position, both input boxes are cleared, including when it delegates to Insert at Beginning.
   Before, the position box was left filled in that case.

## Properties tested (fast-check) - `tests/engines/singly-linked-list.test.ts`, oracle `tests/reference/singly-linked-list.ts`
- **Model-based, numRuns 10,000.** Each run is a random sequence of up to 40 operations, weighted toward inserts, with values -20..20
  (many duplicates) and positions 0..12. After **every** operation:
  - The list equals the array model.
  - The structure is valid: head reaches every node, there are no dangling or unreachable nodes, the last `next` is null, ids are unique and positive, and `nextId` is kept correctly.
  - `ok` matches the model.
  - A failed operation leaves the state unchanged and shows exactly one error frame with the right alert message.
  - Every frame has no dangling pointers or highlights.
  - Every frame highlights a line inside the method that implements it.
  - The last frame of a mutation equals the new state.
  - Frame `element` equals the inserted or deleted value, and the new node is highlighted.
  - Search shows "Found v at position i" for the first occurrence i, with exactly i+1 comparison frames, or n comparison frames when the value is absent.
  - The input state is not modified.
- **Input parsing (numRuns 3,000):** all three boxes accept exactly what `parseInt` accepts and give the UI's messages.
- **`orderFrom`/`orderBackFrom` (numRuns 2,000):** they terminate and never repeat a node on random corrupt pointer data.
- **Regression examples:** the minimal legacy counterexamples above.
- Mutation sanity check: the same checker caught the reintroduced circular-doubly pointer bug (see that report).
- Result: **4/4 tests pass** (about 2 s). `npx tsc --noEmit` reports no errors in any of the four list modules.

## Not verifiable here
Animation timing and appearance (framer-motion, scroll area) were not checked. Playback design was left unchanged: frames
accumulate across operations, and the view stays on the current frame index until the user presses play or step.
