# sum-of-subsets — components/sum-of-subsets.tsx

## What it visualizes
Backtracking for Sum of Subsets: the numbers are sorted ascending and a binary state-space tree is built (include x_i,
then exclude x_i). Branches that cannot reach the target are cut and announced in the caption ("Cannot include ..." /
"Cannot exclude ..."). Leaves are green (solution) or red (dead end); finished subtrees turn grey (backtracked). All
solutions are enumerated (the search does not stop at the first one).

Note for the paper: pruned branches are **not drawn as nodes**; a pruned branch appears only as a caption frame while the
parent node is highlighted. "Pruned subtrees shown" is therefore only true in the sense of the caption.

## UI input limits
Numbers text box: 1–10 comma-separated integers (`parseInt`, so any sign, zeros and duplicates accepted). Target: any
integer. Random Input: 4–7 numbers in 1–20, target = sum of a random non-empty subset (always solvable).
Default: `2, 4, 6, 8, 10`, target 16 (solutions {2,4,10}, {2,6,8}, {6,10}).

## Engine API
`lib/engines/sum-of-subsets.ts`
- `generateSumOfSubsetsSteps(numbers: number[], targetSum: number): { sorted: number[]; steps: SubsetStep[] }` — pure;
  frame shape is the original `AlgorithmStep` (`phase, description, currentIndex, currentSum, remainingTarget,
  currentSubset, treeState, currentNodeId, previousNodeId?, solutions`), node shape the original `TreeNode`.
- Tree snapshots: nodes are immutable and every change is appended to a log; each frame's `treeState` is materialised from
  the log on first access (cached). Same object shape and key order as before; building all frames is O(frames + nodes)
  instead of a `JSON.parse(JSON.stringify(tree))` per frame (n = 10 zeros: 4,094 frames, ~0.4 s).
- The component's `startAlgorithm` now calls the engine with the values returned by `parseInput()`.

## Legacy check (harness `docs/verification/legacy/sum-of-subsets\`; `legacy.ts` splices
lines 15–49, 83–123, 152–392 of `git show HEAD:components/sum-of-subsets.tsx` verbatim; results in `results*.txt`)
Oracle: brute force over all 2^n index subsets; a "Cannot include/exclude" frame is wrong if some completion of that
branch reaches the target. (Tree cloning was turned off for the bulk runs; decision logic untouched.)

| Inputs | Runs | Runs with missed solutions | Runs that pruned a feasible branch | Extra (wrong) solutions |
|---|---|---|---|---|
| Default example | 1 | **1 — finds no solution at all** ("No solutions found"; oracle has 3) | 1 | 0 |
| Random Input button | 20,000 | 16,324 (81.6%) | 16,324 | 0 |
| Typed, positive 1–20, n 1–10, target 0–80 | 20,000 | 9,189 (45.9%; 98.1% of the solvable ones) | 9,189 | 0 |
| Typed, with zeros 0–6 | 10,000 | 5,921 (59.2%) | 5,921 | 0 |
| Typed, with negatives −10–10 | 10,000 | 4,403 (44.0%) | 4,403 | 0 |

Defects:
1. **Exclude test subtracts x_i twice.** `remainingSum` already excludes x_i (`slice(index + 1)`), and the test is
   `currentSum + remainingSum − x_i >= target`. Feasible "exclude" branches are cut. Minimal counterexamples:
   `[1]`, target 0 (empty subset missed); with a non-empty solution `[1, 2]`, target 1 (or `[1, 1]`, target 1) → "No
   solutions found".
2. **Pruning assumes non-negative numbers**, although the UI accepts negatives: "Cannot include −2 as it would exceed
   the target" for `[−2, −1]`, target −3 (solution {−2, −1} missed).
3. **Stale React state on Start.** `startAlgorithm` calls `parseInput()` (which only *schedules* `setNumbers`/`setTargetSum`)
   and then reads the old `numbers`/`targetSum`. Typing new input and pressing Start runs the algorithm on the previous
   numbers and target, and overwrites the input box with them, while the "Current Sum / Target" panel shows the new
   target. Typed `1, 2` / `3` on a fresh page → search runs on `2, 4, 6, 8, 10` / 16; 10,000/10,000 typed inputs affected.
   (Random Input sets the state directly, so it is not affected.)
4. **Frame 0 shows the finished tree.** The init frame stored the live `treeState` object instead of a copy, so the first
   frame displays every node created later (1,937/2,000 random runs; default: 17 nodes instead of 1).

## Fixes made
1. Exclude is cut only when `currentSum + (sum of positive numbers after i) < target`; include is cut only when
   `currentSum + x_i + (sum of negative numbers after i) > target`. For non-negative input these are exactly the
   textbook tests (`s + x_i > m`, `s + r_{i+1} < m`); for negative numbers they remain valid bounds. The include caption
   mentions the remaining negative numbers when there are any.
2. The component passes the freshly parsed numbers/target to the engine (and stores the sorted numbers).
3. Every frame gets its own snapshot (frame 0 contains only the root).
4. Caption for the empty-subset solution reads "The empty subset sums to 0" instead of "Subset  sums to 0".

## Properties tested (`tests/engines/sum-of-subsets.test.ts`, oracle `tests/reference/sum-of-subsets.ts`)
| Property | Inputs | numRuns |
|---|---|---|
| Final solution list = brute-force list of all subsets (as multisets of value lists) | n 1–10, values −10–20 / 1–20 / −3–6 | 3000 |
| Random Input button inputs: ≥ 1 solution, and exactly the oracle's | button distribution | 2000 |
| No pruned branch could reach the target (subset-sum oracle); success leaves sum to the target and are green; failure leaves are red and do not | n 1–10, any sign | 2000 |
| Every frame: tree only grows, frame 0 = root only, current/previous node exist, parent/child links, level/index, subset = parent subset (+ x_i), sum = Σ subset, solutions only accumulate, decision frames show the expanded node's sum, one success frame per solution | n 1–7 | 1000 |
| Default example → {2,4,10}, {2,6,8}, {6,10}; `[1, 2]`, target 1 → {1} | fixed | 1 each |

Run time ≈ 8.7 s. All 6 tests pass. Type-checked with a scoped `tsc` (strict).

## Not verifiable here
Tree layout (nodes per level spread evenly; large trees overlap), animation and colours.
