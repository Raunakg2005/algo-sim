# quick-sort — components/quick-sort-visualization.tsx

## What it visualizes
Recursive quicksort on a row of "books": pivot selection, the partition scan with pointers `i` (left) and `j` (right),
swaps, placement of the pivot, and the stack of recursive sub-array calls.

**Partition scheme: Lomuto** (the paper's claim is correct). Evidence in the code: the pivot is the last element
(`pivotIndex = end`), `i` starts at `start - 1`, every `arr[j] <= pivot` increments `i` and swaps `arr[i]`/`arr[j]`,
and the pivot is finally swapped into position `i + 1`. The tests additionally check, on 3000 random inputs, that the
sequence of `(p, r, q)` partition calls and the number of comparisons and exchanges are identical to an independent
CLRS Lomuto implementation.

## UI input limits
Text field: 2–10 integers, each 1–9 (`parseInt`). Random button: 8 integers in 1–9. Default: `[8, 3, 5, 4, 7, 6, 1, 2]`.

## Engine API
`lib/engines/quick-sort.ts`
- `generateQuickSortSteps(input: number[]): QuickSortStep[]` — pure; frame shape is the component's original `SortingStep`
  (`type, array, pivotIndex?, leftPointer?, rightPointer?, swapping?, subArrays?, activeSubArray?, description`).
- The component now calls it in its `useEffect` and keeps only UI code (`type SortingStep = QuickSortStep`).

## Legacy check (original code from `git show HEAD`, harness `docs/verification/legacy/quick-sort\legacy.ts`)
Inputs: default example; 20,000 draws from the Random button; **all** 66,420 arrays of length 2–5 over 1–9; 30,000 random arrays
of length 6–10 over 1–9.

**The sort itself is correct:** 0 wrong final frames, 0 frames losing elements, 0 violations of the partition invariant.
The defects are wrong captions and one fake swap frame:

| Defect | Random button (20,001) | Exhaustive len 2–5 (66,420) | Random len 6–10 (30,000) | Minimal counterexample |
|---|---|---|---|---|
| "Partition complete: elements to the left of p are **smaller**" is false (the left part holds a copy of the pivot) | 99.2% | 71.8% | 96.7% | `[1, 1]` |
| "Element x is already in the **correct position**" while x is not at its final sorted position (it is only on the ≤-pivot side) | 71.0% | 44.4% | 69.7% | `[2, 1, 2]` |
| Pivot "moved … by swapping" with itself (`swapping: [end, end]`) when every element is ≤ pivot | 94.4% | 77.1% | 93.1% | `[1, 1]` |

The default example `[8, 3, 5, 4, 7, 6, 1, 2]` (no duplicates) shows none of these.
Overall 98.9% of all accepted short inputs and ~100% of Random-button inputs show at least one wrong caption/fake swap.

## Fixes made
1. Partition-complete caption now says "elements to the left of p are ≤ p, elements to the right are > p" (true for duplicates).
2. The `i == j` caption now says the element "≤ pivot is already on the left side, so no swap is needed".
3. When `i + 1 == end` the frame no longer highlights a self-swap; it says the pivot stays where it is (no swap needed).
   The number and order of frames are unchanged; only these captions and that one `swapping` highlight differ.

Not changed (by design, documented): on the first comparison of a partition `leftPointer = start - 1`, which is Lomuto's empty
"≤ pivot" region. For `start > 0` the blue "Left Pointer (i)" marker therefore sits on the book just left of the active sub-array
(96.7% of Random inputs). This is the textbook value of `i` (CLRS Fig. 7.1), so it was left as is; the test asserts
`start - 1 ≤ i ≤ end`.

## Properties tested (`tests/engines/quick-sort.test.ts`, oracle `tests/reference/quick-sort.ts`)
| Property | Inputs | numRuns |
|---|---|---|
| First frame = input, last frame is `sorted` and equals the sorted input | ints −5..5, length 0–12 | 5000 |
| Every frame is a permutation of the input; pivot/j/swap indices inside the array and inside the active sub-array; `start−1 ≤ i ≤ end`; ranges valid; no self-swap | UI inputs (1–9, length 2–10) | 3000 |
| Same partition calls `(p, r, q)`, same number of comparisons and of data-moving exchanges as the independent Lomuto oracle | UI inputs | 3000 |
| Lomuto loop invariant on every comparison frame: `A[start..i] ≤ x`, `A[i+1..j−1] > x`, pivot = last; caption values match | UI inputs | 3000 |
| Partition-complete frames: left ≤ pivot < right, pivot at its final sorted index, caption exact | UI inputs | 3000 |
| Captions agree with frames (swap values, "smaller moves left" true, next frame shows the swap, pivot move, recursive call is top of stack and is followed by its pivot selection) | UI inputs | 2000 |
| Default example sorts correctly | fixed | 1 |

Sanity check: with the original code swapped in for the engine, 3 of 7 tests fail (fast-check shrinks to `[1, 1]`).
Run time ≈ 2.5 s. All 7 tests pass.

## Not verifiable here
Book animation, sub-array bar layout (`elementWidth = 60` px positioning) and colours are visual only.
