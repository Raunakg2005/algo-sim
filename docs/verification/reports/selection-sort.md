# selection-sort — components/selection-sort-visualization.tsx

## What it visualizes
Selection sort: for each position `i`, scan the unsorted part for the minimum (strict `<`, so the leftmost minimum), then swap it
into position `i`. Highlights: current position, current minimum, compared element, swap, green sorted prefix.

## UI input limits
Text field: comma-separated values parsed with `parseFloat`; any count ≥ 1, any finite value (no length or range limit; note
that `parseFloat` silently accepts strings like `"3abc"` as 3). Random button: 5–10 integers in 1–50. No default array (the
visualizer is empty until the user sets or randomizes one).

## Engine API
`lib/engines/selection-sort.ts`
- `generateSelectionSortSteps(input: number[]): SelectionSortStep[]` — pure; frame shape is the original `SortingStep`
  (`array, currentIndex, minIndex, comparingIndex, sortedUpTo, description, isSwapping`).
- The component's `generateSortingSteps` now just calls `setSortingSteps(generateSelectionSortSteps(inputArray))`.

## Legacy check (original code from `git show HEAD`, harness `...\algoaudit\legacy\selection-sort\legacy.ts`)
Inputs: 20,000 Random-button draws; all 97,655 arrays of length 1–7 over {−2..2}; 20,000 random arrays of length 1–20 mixing
integers and decimals.

Checked: final frame sorted; every frame a permutation; indices in range; compared index inside the unsorted part; `minIndex`
equals the running minimum on every comparison frame; green prefix holds final values; no self-swap frames; exactly n(n−1)/2
comparison frames.

**Result: 0 defects on all 137,655 inputs. The original logic was correct.** It was moved into the engine unchanged.

## Fixes made
None (logic moved verbatim).

## Properties tested (`tests/engines/selection-sort.test.ts`, oracle `tests/reference/selection-sort.ts`)
Inputs: length 1–20; values drawn from integers −5..5 (duplicates), integers 1..50 (Random-button range) or doubles in [−100, 100].

| Property | numRuns |
|---|---|
| First frame = input; last frame = sorted input, `sortedUpTo = n−1` | 5000 |
| Every frame: permutation of input; indices in range; green prefix holds final sorted values; minimum not in the sorted part; on comparison frames the compared index is in the unsorted part, `minIndex` is the leftmost minimum of the scanned part, caption values exact; no self-swap | 2000 |
| Oracle agreement: comparison frames = n(n−1)/2 = oracle comparisons; swap frames = oracle swaps; "new minimum" frames = oracle new-minimum events | 3000 |
| Each swap frame is followed by the swapped array with the placed element at its final position and `sortedUpTo = i` | 2000 |

Sanity check: with the original code swapped in, all 4 tests also pass (consistent with the legacy result).
Run time ≈ 2.3 s. All 4 tests pass.

Note: generated doubles are normalised so −0 becomes 0 (both display as "0"; selection sort is not stable, so the order of
−0 and 0 would otherwise differ from the oracle's stable sort without any visible difference).

## Not verifiable here
Bar heights (`value/50·100` px, clamped at 30 px; negative values all look the same), animations, colours.
