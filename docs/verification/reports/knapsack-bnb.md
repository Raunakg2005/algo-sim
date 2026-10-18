# knapsack-bnb — components/knapsack-branch-and-bound.tsx

## What it visualizes
0/1 knapsack by least-cost (best-first) branch and bound. Items are branched on in decreasing value/weight order; each
node shows weight, value and its bound (fractional-knapsack relaxation, rounded down). The live node with the highest
bound is expanded; children whose bound is not better than the best complete solution are pruned (red). The tree,
the live-node queue, the current node and the best solution are shown per frame.

## UI input limits
Items: positive integer weight and value (`parseInt`, so "2.5" → 2), **no limit on the number of items**; the UI stores
`ratio = value/weight` rounded to 2 decimals. Capacity: positive integer. Random Items: 3–5 items, weight 1–5, value
5–14, capacity 5–14. Default: (2,10), (3,15), (5,30), (7,35), (1,3), capacity 10 (optimum 55).

## Engine API
`lib/engines/knapsack-bnb.ts`
- `generateKnapsackSteps(items: KnapsackItem[], capacity: number): KnapsackStep[]` — pure; frame shape is the original
  `AlgorithmStep` (`phase, description, currentNode, bestNode, bestValue, nodes, activeNodes`), node shape the original
  `Node`.
- `branchingOrder(items)`, `fractionalBound(order, capacity, level, weight, value)` (exported for tests).
- The component's `startAlgorithm` calls the engine; `calculateBound` was removed from the component.

## Legacy check (harness `...\algoaudit\legacy\knapsack-bnb\`; `legacy.ts` splices lines 17–44, 82–110, 140–161 and
163–423 of `git show HEAD:components/knapsack-branch-and-bound.tsx` verbatim; results in `results*.txt`)
Oracles: brute force over all 2^n subsets (optimum) and a suffix dynamic programme (optimum of every node's subtree).

**The optimum value was right in all 80,000 standard runs**, and no prune ever discarded a subtree that could beat the
incumbent at that moment. Defects:

| Defect | Random Items (20,000) | Typed 1–20/1–30 (20,000) | Typed up to 1000 (20,000) | Near-tie ratios (20,000) | Minimal counterexample |
|---|---|---|---|---|---|
| Earlier frames show nodes as pruned before they are pruned (node objects shared between frames and mutated later) | 100% | 100% | 100% | 100% | one item (1,1), capacity 1 (also the default example) |
| The best solution is drawn red/"pruned" at the end (a leaf that improves the best is also queued, then popped and pruned against its own value) | 9,932 (49.7%) | 5,209 (26.0%) | 5,457 (27.3%) | 7,226 (36.1%) | one item (1,1), capacity 1 |
| "Algorithm complete. No solution found." when no item fits (the empty knapsack, value 0, is the solution) | 0 | 2,042 (10.2%) | 2,194 (11.0%) | 2,436 (12.2%) | one item (2,1), capacity 1 |
| Bound below the true subtree optimum (items sorted by the **2-decimal rounded** ratio; ties keep input order) | 0 | — | — | 457 (2.3%) | items (8,3), (13,5), capacity 13: both show ratio 0.38, root bound 4 < optimum 5 |
| Wrong optimum caused by such a bound | 0 | 0 | 0 | 0 | found 1 in a 40,000-run near-tie stress test: (401,87), (610,132), (507,111), (491,107), (418,90), (986,214), capacity 909 → 197 instead of 198 (not minimised) |

Invalid bounds also occur with small integers: running the engine's frame checker on 5,000 legacy runs (n ≤ 8, w ≤ 30,
v ≤ 40) found 6 bounds below the subtree optimum, besides 13,834 out-of-step pruned flags, 8,388 queued nodes drawn
as pruned and 436 best nodes drawn as pruned (`sanity.ts`).

Input-editing defect: new item ids were `items.length + 1`, so after removing an item the next added item reuses an
existing id (remove item 2 from the default list, add (4,8) → ids 1, 3, 4, 5, **5**). Captions such as "Include item 5"
become ambiguous, "Remove" deletes both rows, and the "Knapsack Contents" panel looks items up by id and shows the first.

## Fixes made
1. Node objects are never mutated after being stored (a prune replaces the object), so each frame shows the tree as it
   was at that moment.
2. Complete solutions (leaf children) are evaluated when created — "Update best solution" if better, otherwise pruned —
   and are not queued; the best node is never drawn as pruned.
3. Branching order and bounds use the exact ratio `value/weight` (stable for ties), not the rounded display ratio;
   the bound is `floor(LP + 1e-9)` so floating-point error cannot round a valid bound down.
4. When nothing fits: "Algorithm complete. No item fits in the knapsack, so the best value is 0 (empty knapsack)."
5. Component: new item id = largest existing id + 1.

## Properties tested (`tests/engines/knapsack-bnb.test.ts`, oracle `tests/reference/knapsack-bnb.ts`)
| Property | Inputs | numRuns |
|---|---|---|
| Final best value = brute-force optimum; best node's items are feasible and worth the optimum; final caption (incl. "no item fits" exactly when every item is heavier than the capacity) | mix of: Random Items distribution; n 1–10, w ≤ 30, v ≤ 40, cap ≤ 60; n 1–8, w, v ≤ 1000, cap ≤ 2000; near-tie ratios | 4000 |
| Every node: weight ≤ capacity, bound ≥ optimum of its subtree (DP), weight/value = its items, child of its parent with the right decision; every prune: subtree optimum ≤ best value at that frame; pruned flag set exactly from the pruning frame on; best node is a complete solution worth `bestValue` and never pruned; best value never decreases; queued nodes exist and are live; the selected node has the highest bound in the queue | same mix | 2000 |
| Default example → 55 (and passes all frame checks) | fixed | 1 |
| Rounded-ratio counterexample (8,3), (13,5), capacity 13 → root bound ≥ 5, optimum 5 | fixed | 1 |

Run time ≈ 2.5 s. All 4 tests pass. Type-checked with a scoped `tsc` (strict).

## Not verifiable here
Tree layout (the UI has no item limit; wide trees overlap), animation and colours. Changing the ratio rounding would
change only the *displayed* ratio column; the display still shows 2 decimals.
