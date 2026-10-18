# heap-sort — components/heap-sort-visualizer.tsx (+ heap-tree.tsx)

## What it visualizes
Heap sort on an array drawn as a binary tree: bottom-up max-heap construction (sift-down from `floor(n/2)−1` to 0), then
`n−1` extract-max steps (swap root with the last heap element, shrink the heap, sift-down). Highlights: current node,
compared pair, swapped pair, sorted suffix.

`heap-tree.tsx` is purely presentational (node positions, edges, colours); it holds no algorithm logic and was not changed.

## UI input limits
Text field: at least 2 integers, each 1–9; **no upper length limit**. Random button: 10 integers in 1–9.
Default: `[8, 3, 5, 4, 7, 6, 1, 2]`.

## Engine API
`lib/engines/heap-sort.ts`
- `generateHeapSortSteps(input: number[]): HeapSortStep[]` — pure; frame shape is the original `SortingStep`
  (`type, array, heapSize, comparing?, swapping?, currentNodeIndex?, extractedIndex?, sortedIndices?, description`).
- The component calls it in its `useEffect` (`type SortingStep = HeapSortStep`).

## Legacy check (original code from `git show HEAD`, harness `...\algoaudit\legacy\heap-sort\legacy.ts`)
Inputs: default example; 20,000 Random-button draws; all 66,420 arrays of length 2–5 over 1–9; 20,000 random arrays of length
6–30 over 1–9.

**The sort itself is correct:** 0 wrong final frames, 0 frames losing elements, heap property holds after the build phase and
before every extraction, no highlighted index outside the heap.

| Defect | Random button (20,001) | Exhaustive len 2–5 (66,420) | Random len 6–30 (20,000) | Minimal counterexample |
|---|---|---|---|---|
| Caption "Compare node X with its **right child** Y" when X is the *left child* (it won the first comparison), i.e. X and Y are siblings | 100% | 98.0% | 100% | `[1, 2, 1]` (frame: "Compare node 2 with its right child 1") |

The default example shows this wrong caption 8 times.

## Fixes made
1. When the left child is the larger so far, the right-child comparison caption now reads
   "Left child X is larger than node P; compare it with the right child Y". Otherwise unchanged.
2. `sortedIndices` on the final frame no longer contains index 0 for an empty array (unreachable from the UI, which requires ≥ 2
   values; found only because the engine test also runs length 0).
No frames were added, removed or reordered.

## Properties tested (`tests/engines/heap-sort.test.ts`, oracle `tests/reference/heap-sort.ts`)
| Property | Inputs | numRuns |
|---|---|---|
| First frame = input; last frame `sorted`, equals sorted input, every index marked sorted | ints −5..5, length 0–20 | 4000 |
| Every frame: permutation of input; `0 ≤ heapSize ≤ n`; compared/swapped/current nodes inside the heap; compared nodes are parent/child or siblings; heapify swaps parent/child; `sortedIndices` = exactly the indices outside the heap, and those hold their final sorted values | UI values 1–9, length 2–31 | 1500 |
| Max-heap after "Max heap built" (and identical to the oracle's BUILD-MAX-HEAP result); max-heap before each of the `n−1` extractions, which swap root with `heapSize−1`; caption values | UI values, length 2–31 | 2000 |
| Number of comparison frames and swap frames equal the independent (iterative) CLRS heapsort's comparisons and exchanges | UI values, length 2–31 | 2000 |
| Comparison captions name the correct relationship (left child / right child / sibling) and values; swap captions, "larger child" claim and next-frame effect | UI values, length 2–31 | 2000 |
| Default example sorts correctly | fixed | 1 |

Sanity check: with the original code swapped in, 2 of 6 tests fail (shrunk counterexamples `[1, 2, 1]` and `[]`).
Run time ≈ 3.5 s. All 6 tests pass.

## Not verifiable here
Tree layout (fixed 600 px width, so very long inputs overlap — the UI has no length limit), animations and colours.
