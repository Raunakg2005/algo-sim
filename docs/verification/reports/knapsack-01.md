# 0/1 Knapsack (`knapsack-01`)

## What it visualizes
`components/knapsack-problem.tsx` fills the classic DP table dp[i][c] = max(dp[i−1][c], dp[i−1][c−w_i] + v_i), row by row. Each cell gets
1 frame (column 0), 2 frames (the item does not fit: compare, then take from above) or 3 frames (compare, values, choose). Ties exclude the
item. The visualizer then backtracks from dp[n][W] to recover the chosen items, and the frames end with the optimal set, its value and its
weight.

## UI input limits
- **Items:** add (weight, value) with `parseInt`, both > 0; remove with ✕. The default is (2,3) (3,4) (4,5) (5,6) with W = 8, optimum 10.
- **Capacity:** `parseInt`, > 0, with no upper bound.
- **Random Items:** 3..5 items, weight 1..5, value 1..10, capacity 5..14.
- Originally Random Items, Add Item and Capacity stayed enabled after Start. Only ✕ was disabled.

## Engine API (pure) - `lib/engines/knapsack-01.ts`
- `generateKnapsackSteps(items, capacity) => KnapsackStep[]`: same frame shape. Captions name items by id. Throws outside the limits.
- `parsePositiveInteger(text)`: a strict whole number ≥ 1.
- `nextItemId(items)`: the largest id + 1.
- `MAX_KNAPSACK_ITEMS = 10` and `MAX_KNAPSACK_CAPACITY = 50`.

`startAlgorithm` now calls `setSteps(generateKnapsackSteps(items, capacity))`. The DP, the backtracking and the frame building were removed
from the component.

## Legacy check (original HEAD code)
The harness is `legacy\knapsack-01\legacy.ts`: `startAlgorithm`, `addItem` and `removeItem`, verbatim. The checks are `check.ts` and
`extra.ts`, with output in `results.txt`.

**The DP itself is correct.** Over 8,001 runs (5,000 UI-random, the default example, and 3,000 custom runs with 1..10 items, weights 1..25,
values 1..30, W 1..40), every table cell equalled the brute-force optimum over subsets of the first i items. The backtracked set was always
feasible, optimal and consistent with the reported weight. The defects are in the item bookkeeping around the DP:

| Defect | Rate | Minimal counterexample |
|---|---|---|
| **Duplicate item ids.** A new item gets `id = items.length + 1`, which repeats an existing id after any removal. Then: the selection highlights every card with that id; ✕ removes both items; "Selected Items: Item 4" is ambiguous | 762 / 2,981 random add/remove sequences (25.6 %); in 518 of them an unselected item is highlighted as selected | default list, remove Item 1, add (w 1, v 10) → ids [2,3,4,4]; W 8 selects {4,3,2}, and both "Item 4" cards turn green, including the unselected (w 5, v 6) one |
| Captions say "item i" using the row index, while the cards and the Solution panel use the id | 1,697 / 2,981 edited lists (57 %) | remove Item 2: the row-2 captions say "item 2" while the card is "Item 3" |
| **Crash: Random Items stays enabled after Start.** The table keeps the started rows, and the row headers read `items[i−1].weight` from the new, shorter list → TypeError on render | 1,014 / 3,000 trials of "Start on the default list, then Random Items" (33.8 %) | Start (4 items), Random Items gives 3 items → row 4 header crashes |
| Capacity and Add Item stay enabled after Start. The header columns and rows no longer match the table | by construction | change the capacity after Start |
| **No size limit.** Every frame copies the whole (n+1)(W+1) table, and there are about 3nW frames. A large W exhausts memory | n=10: W=50 → 1,542 frames / 0.87 M cells; W=200 → 6,042 / 13.4 M; W=1000 → 30,042 / 331 M cells (tab dies) | capacity 1000 with 10 items |
| `parseInt` silently truncates | by construction | weight `2.5` → 2; `1e3` → 1 |
| Garbled JSX in the item cards: the className string literally contains ``p-3   => ( <div key={item.id} className={\`p-3 …``. It renders only because the real class names are also in the string | 100 % (cosmetic) | - |

## Fixes
1. Ids are `nextItemId(items)` (largest + 1), so they stay unique after edits. Captions name items by id; cells keep their [row][col] indices.
2. Add Item, the weight/value fields, Capacity and Random Items are disabled while a visualization is running, as ✕ already was.
3. Limits: at most 10 items and capacity 1..50 (`addItem` / `updateCapacity` show an error). The worst case is 1,542 frames.
4. Strict whole-number parsing for weight, value and capacity.
5. The item-card className was repaired.
6. Each frame owns its own table copy. The two "compare" frames used to share one object; that was harmless, but is cleaner now.

## Properties tested - `tests/engines/knapsack-01.test.ts`, oracle `tests/reference/knapsack-01.ts`
The oracle is exhaustive search over all subsets, for every prefix i and capacity c.
| Property | numRuns |
|---|---|
| Final DP table equals the brute-force table, and totalValue = optimum (UI random, and ≤ 8 items with small weights and values for ties) | 2 × 400 |
| Reported value is optimal for anything the inputs accept (1..10 items, weights 1..60, values 1..100, W 1..50, non-consecutive ids) | 300 |
| Backtracked set: ids unique and each matches exactly one item; weight ≤ W and equal to totalWeight; value = optimum; the final caption is correct | 400 |
| Frames:<ul><li>table shape;</li><li>every cell is 0 or its final value (never overwritten);</li><li>≤ 1 highlighted cell;</li><li>comparing cells are in range and flagged;</li><li>row-major visiting order;</li><li>every "item N" in a caption is a real id, and the compute captions name the current row's item;</li><li>weight ≤ W</li></ul> | 400 |
| DP frame count = 1 + Σ_items (1 + Σ_c {1, 2, 3}); exactly 2 complete frames | 300 |
| Helpers: strict integer parsing; random add/remove sequences never produce duplicate ids; limits enforced | 200 + 300 + unit |
| Default example: value 10, items {2, 4}, weight 8 | unit |

All 6 tests pass in about 5.6 s. `tsc` (strict) is clean.

## Not verifiable
- Arrow glyphs, cell animation and layout are not tested.
- The limits (10 items, W ≤ 50) are a design choice made to bound memory, not a property of the algorithm.
