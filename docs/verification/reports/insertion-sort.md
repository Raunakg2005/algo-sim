# insertion-sort — components/insertion-sort-visualization.tsx

## What it visualizes
Insertion sort with shifting (`current = arr[i]`; while `j ≥ 0 and arr[j] > current`: shift `arr[j]` right, `j--`; then
`arr[j+1] = current`), next to the pseudocode with the active line highlighted.

## UI input limits
Text field: comma-separated values parsed with `parseFloat`; any count ≥ 1, any finite value (no length or range limit).
Random button: 5–10 integers in 1–50. No default array.

## Engine API
`lib/engines/insertion-sort.ts`
- `generateInsertionSortSteps(input: number[]): InsertionSortStep[]` — pure; frame shape is the original `SortingStep`
  (`array, currentIndex, comparingIndex, sortedUpTo, description, isSwapping, activeCodeLine`).
- `INSERTION_SORT_CODE: string[]` — the displayed pseudocode (moved from the component; `activeCodeLine` indexes it).
- The component's `generateSortingSteps` now calls `setSortingSteps(generateInsertionSortSteps(inputArray))`.

## Legacy check (original code from `git show HEAD`, harness `...\algoaudit\legacy\insertion-sort\legacy.ts`)
Inputs: 20,000 Random-button draws; all 97,655 arrays of length 1–7 over {−2..2}; 20,000 random arrays of length 1–20 mixing
integers and decimals.

**The final result is correct** (0 wrong final frames, no index out of range). The step trace is not:

| Defect | Random button (20,000) | Exhaustive len 1–7 (97,655) | Random len 1–20 (20,000) | Minimal counterexample |
|---|---|---|---|---|
| The comparison that **ends** the while-loop (`arr[j] ≤ current` after at least one shift) never gets a frame: the highlight jumps from line 10 (`j = j − 1`) straight to line 12, so the number of comparison frames ≠ the number of key comparisons | 96.6% | 96.3% | 84.1% | `[0, 1, 0]` |
| When `j` reaches −1 the `j = j − 1` frame is skipped: the highlighted line jumps 9 → 12, which is not a path through the shown pseudocode | 84.7% | 73.2% | 81.6% | `[0, −1]` |

99.8% of Random-button inputs show at least one of the two.

## Fixes made
1. After `j--`, if `j ≥ 0` and `arr[j] ≤ current`, a line-8 frame "Comparing current with arr[j]. arr[j] is not greater, so the
   shifting stops." is added.
2. When `j` becomes −1 a line-10 frame "Decremented j to −1: reached the start of the array, so the shifting stops." is added
   (`comparingIndex: null`).
All other frames are unchanged. The highlighted lines now always follow the pseudocode's control flow and there is exactly one
line-8 frame per evaluation of `arr[j] > current`.

Documented, not changed (would need a UI redesign): while shifting, the array frame holds a duplicate of the shifted value and
`current` lives only in the variable (as in the pseudocode), and the blue "Current element" box stays on index `i` even after
`arr[i]` has been overwritten by a shift. Frame-level data preservation is therefore tested "up to the hole" (see below).
The shortcut for an element that is already in place (line 8 → next iteration, without showing the no-op `arr[j+1] = current`)
was kept and is allowed explicitly in the control-flow test.

## Properties tested (`tests/engines/insertion-sort.test.ts`, oracle `tests/reference/insertion-sort.ts`)
Inputs: length 1–20; values drawn from integers −5..5 (duplicates), integers 1..50 or doubles in [−100, 100].

| Property | numRuns |
|---|---|
| First frame = input; last frame = sorted input, `sortedUpTo = n−1`, line 13 | 5000 |
| Highlighted lines form a path in the pseudocode's control-flow graph; leaving the loop at line 10 only with `j = −1`; never a comparison with `j = −1` | 3000 |
| Line-8 frames = oracle count of `arr[j] > current` evaluations; line-9 (shift) frames = `isSwapping` frames = number of inversions (brute force) | 3000 |
| Per frame: `current` is the next input element; elements right of `i` untouched; the array equals the input except for exactly one hole that `current` fills (only on loop frames); shift frames show a copy of an element > current; comparison captions match the values ("is greater" iff `arr[j] > current`); after each insertion `current` sits at the oracle position (# of earlier elements ≤ it) and the prefix `0..i` is sorted; insert caption exact; indices in range | 2000 |

Sanity check: with the original code swapped in, 3 of 4 tests fail (shrunk counterexamples `[0, −1, 0]`, `[2, 0, 1]`).
Run time ≈ 5.7 s. All 4 tests pass.

Note: generated doubles are normalised so −0 becomes 0 (identical on screen).

## Not verifiable here
Bar heights/animations, tab layout, code-panel styling.
