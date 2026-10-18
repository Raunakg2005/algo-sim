# max-min — components/divide-conquer-maxmin.tsx

## What it visualizes
Divide-and-conquer search for the maximum and minimum: a range of size 1 is a base case (max = min = the element), a range of
size 2 is solved with one comparison, larger ranges split at `mid = floor((start+end)/2)`, are solved recursively and combined
(max of maxes, min of mins). The UI draws the recursion tree as one row per level ("Original Array", "Level 1", ...), each
segment showing its books and, once solved, its Max/Min.

## UI input limits
Text field: 1–12 comma-separated values parsed with `Number()` (any finite number: negatives, zero, decimals; also
`Infinity`, hex etc. are accepted by the parser). New Array button: 6–10 integers in 10–99.
Default: `[42, 15, 87, 33, 61, 9, 75, 24]`.

## Engine API
`lib/engines/max-min.ts`
- `generateMaxMinSteps(array: number[]): MaxMinStep[]` — pure; frame shape is the original `AlgorithmStep`
  (`segments: ArraySegment[], description, phase`), segment shape unchanged.
- The component's 200-line `useEffect` is now `setSteps(generateMaxMinSteps(array))`.

## Legacy check (original code from `git show HEAD`, harness `...\algoaudit\legacy\max-min\legacy.ts`; the original `useEffect` body is spliced in verbatim)
Inputs: default; 20,000 New-Array draws; all 97,655 arrays of length 1–7 over {−2..2}; 20,000 random arrays of length 1–12 mixing
integers and decimals in [−1000, 1000].

**The computed values are correct:** 0 wrong final max/min, 0 wrong partial results, 0 segments out of range.
The recursion-tree frames are wrong:

| Defect | New Array (20,001) | Exhaustive len 1–7 (97,655) | Random len 1–12 (20,000) | Minimal counterexample |
|---|---|---|---|---|
| A parent segment **vanishes when it is split** (it is replaced by its halves), so e.g. the "Original Array" row is empty from the first split until the very last combine; only reappears when its result is known | 100% | 100% of n ≥ 3 (97,625) | 83.2% (= all n ≥ 3) | any 3 elements, e.g. `[0, 0, 0]` |
| Books of every 2-element base case **stay highlighted as "comparing"** (yellow, raised) in all later frames, because `comparingIndices` is never cleared | 100% | 100% of n ≥ 2 (97,650) | 91.9% (= all n ≥ 2) | `[0, 0]` |

(The original code even contains a lookup for the parent "in place" after recursion; it never succeeded because the parent had
been spliced out, so the parent was always re-appended at the end.)

## Fixes made
1. On a split the parent stays in the frame (no longer processing) and its two halves are added below it; after the combine the
   parent is updated in place with its Max/Min. The tree now always shows every ancestor of the active segment.
2. A 2-element base case clears `comparingIndices` when its result frame is shown.
Frame count, order, phases and captions are unchanged.

## Properties tested (`tests/engines/max-min.test.ts`, oracle `tests/reference/max-min.ts`)
Inputs: mix of (a) UI-like arrays: 1–12 values, integers −20..20 or doubles in [−1000, 1000]; (b) duplicate-heavy integer arrays over −2..2.

| Property | numRuns |
|---|---|
| Final frame: root segment is a result whose Max/Min equal brute force; final caption exact | 5000 |
| Every frame: no duplicate segments; segments in range; every result segment's Max/Min equal brute force for its range; `comparingIndices` only on a segment being compared and inside it; level 0 is the whole array and is always present; every lower segment has its parent on the level above; no overlapping segments on a level | 3000 |
| Recursion matches the oracle tree (sizes 1/2 are leaves, split at floor((lo+hi)/2)): number of base-case, pair, divide and conquer frames; total frames = 2 + 1·(singles) + 2·(pairs) + 4·(internal); comparisons represented = pairs + 2·combines = oracle count (3n/2−2 for n = 2^k); final frame shows exactly the oracle tree, all resolved | 3000 |
| Captions report the values of their frame (subarray Max/Min, the two compared elements; conquer shows two halves, divide shows one processing segment) | 2000 |
| Default example final caption (max 87, min 9) | 1 |

Sanity check: with the original code swapped in, the frame-consistency test fails (shrunk counterexample `[0, 0]`).
Run time ≈ 3.5 s. All 5 tests pass.

Note: −0 and 0 are compared numerically (`===`), since both display as "0".

## Not verifiable here
Layout/animation of the level rows, colours, progress bar.
