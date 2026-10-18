# Greedy / Fractional Knapsack (`fractional-knapsack`)

## What it visualizes
`components/knapsack-simulation.tsx` (with the display-only helpers `item-card.tsx` and `knapsack-container.tsx`) shows the greedy knapsack
in four frames:
1. **Initial State.**
2. **Sort Items:** by value/weight, descending.
3. **Select Items:** take each whole item that fits. With "Allow Fractional Items" on, take the fitting fraction of the first item that does
   not fit and stop.
4. **Final Result.**

With fractions on, this is the optimal fractional-knapsack algorithm. With fractions off, it is the greedy 0/1 heuristic (not optimal, and not
claimed to be).

## UI input limits
- **Capacity:** slider 10..100, step 5.
- **Items:** name, weight and value from `parseFloat`, both > 0; any decimals. Items can be removed at the Initial State, including all of them.
- The default is five items: (10,60) (20,100) (30,120) (15,45) (25,50). At W = 50 with fractions on, the value is 240 (Item 3 at 2/3).
- The "Allow Fractional Items" checkbox can be toggled at any time.

## Engine API (pure) - `lib/engines/fractional-knapsack.ts`
- `generateFractionalKnapsackFrames(items, capacity, allowFractions) => FractionalKnapsackFrame[]`: always 4 frames. Each frame has
  `{ phase, explanation, list, knapsack, remainingCapacity, totalValue, exact }`. `exact` holds the total, the remaining capacity and each
  fraction as exact "p/q" strings.
- `decimalToRational(x)`: the exact value of the decimal the user typed (0.1 → 1/10).
- `displayRatio`, `parsePositiveNumber`, `FRACTIONAL_STEP_NAMES`, `WELCOME_EXPLANATION`.

All decisions are made in exact BigInt rational arithmetic: the ordering by v/w, "fits", "knapsack full" and the fractions. The total is
rounded half-up to cents exactly. The component keeps only the frame index, the input state and the Initial-State notice text. Frames come
from `useMemo(generateFractionalKnapsackFrames(...))`, and `runStep`'s algorithm code, `sortedItems`, `remainingCapacity` and `totalValue`
state were removed.

## Legacy check (original HEAD code)
The harness is `legacy\fractional-knapsack\legacy.ts`: the component as a state machine with `runStep`, the Back handler and
`resetSimulation` verbatim. setState becomes assignment, so the original's in-place mutation of item objects is reproduced. The checks are
`check.ts` and `minimal.ts`, with output in `results.txt`. The oracle is an exact rational greedy.

Forward runs (Next ×3):
- 38 default runs: every capacity 10..100, fractions on and off;
- 4,000 random integer runs: 1..8 items, w 1..40, v 1..200;
- 4,000 runs with 1-decimal values;
- 4,000 "close ratio" runs: ratios equal to two decimals.

Interaction runs: 4,000 random Next/Back/toggle sequences on the default items, 22,351 frames inspected.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| **The "Sort Items" frame shows an empty item list.** Sorting happens when you leave step 1, and the list shows `sortedItems = []`. Each phase's content appears one frame late: the "Select Items" frame shows the sorted list with nothing selected | 12,038 / 12,038 forward runs (100 %) | default items, Next |
| **The Final Result caption is not the result.** All per-item messages are written in one loop, so only the last one survives, e.g. "Cannot add Item 5. Not enough capacity left.". The "Final result: Total value…" text appears only during auto-play | 12,038 / 12,038 | default items, W 50 → "Added 66.7% of Item 3. Knapsack is now full." |
| **Ordering by the two-decimal display ratio.** Items whose ratios agree to two decimals keep input order, so the greedy is no longer by value/weight and, with fractions on, is no longer optimal | close-ratio inputs: 981 / 4,000 wrong selection, 912 / 4,000 wrong total (≈ 24 %); 0 in the integer and 1-decimal sets | W 10, fractions on, items (w 8, v 1) and (w 15, v 2). Both display 0.13. Original: 1.27; exact optimum 4/3 = 1.33 |
| **Floating-point remainder.** `10 − 3.3 − 3.3 − 3.4` = 4.4e-16, not 0, so the loop continues and adds a phantom fraction | by construction | W 10: (3.3,33) (3.3,33) (3.4,34) (5,1) → "Added 0.0% of Item 4", Item 4 in the knapsack at fraction 8.9e-17 |
| **Stale selections from in-place mutation** (`selected[i].selected = true` on objects shared with `items`): | | |
| - going back to Initial State shows items as already selected | 71 frames | W 30: Next, Next, Next, Back, Back, Back |
| - the Final Result knapsack contents disagree with the displayed total | 150 frames | W 40: Next ×3, Back, toggle fractions, Next |
| - after toggling the checkbox, the result shown is still for the old setting | 312 frames | W 70: Next ×3, toggle |
| The total is rounded from the double (`toFixed(2)`), so an exact x.xx5 can round down | by construction (found by the new property test) | one item (50, 50.415), W 50 → 50.41 instead of 50.42 |
| `parseFloat` accepts trailing junk | by construction | weight `12abc` → 12 |

## Fixes
1. Four precomputed frames, one per phase: Sort shows the sorted list, Select shows the selection, and Final shows the result. Back, Next
   and Play only move the frame index. Toggling fractions, changing the capacity or editing items recomputes all frames, so nothing is stale.
2. The Select Items caption lists every decision in order ("Added Item 1 completely. Remaining capacity: 40. …"). The Final Result caption
   is "Final result: Total value: X. Remaining capacity: Y.".
3. Ordering by exact v/w (ties keep input order). The rounded ratio is used only for display.
4. Exact rational capacity bookkeeping (no phantom 0.0 % items) and exact half-up rounding of the displayed total.
5. Strict number parsing for weight and value.
6. Frames contain fresh objects; nothing in React state is mutated.

## Properties tested - `tests/engines/fractional-knapsack.test.ts`, oracle `tests/reference/fractional-knapsack.ts`
The oracle is a textbook greedy on BigInt rationals built from integer mantissa + scale. No floats are involved, and it does not use the
engine's decimal conversion.

Input families:
- integers;
- 0..2-decimal weights and values;
- close ratios (4-decimal values, ratios within 4 %);
- exact ties in different decimal spellings;
- 0..8 items, W = 10..100 step 5, fractions on and off.

| Property | numRuns |
|---|---|
| Exact total, exact remaining capacity, the selected ids in order, and every fraction equal the oracle. Displayed total = exact total rounded half-up to cents; displayed remaining equals the exact value | 1,500 |
| Optimality certificate with fractions on: no item with a strictly higher ratio is left (partly) out while a lower-ratio item is in, and the knapsack is full unless every item fits | 800 |
| Frames:<ul><li>phases 0..3;</li><li>frame 0 in input order with the welcome text;</li><li>frame 1 in exact descending ratio order (stable);</li><li>no selection in frames 0–1;</li><li>frames 2–3: knapsack = selected list items; each fraction in (0, 1] and the numeric fraction equals the exact one; ≤ 1 partial item (0 without fractions); used capacity ≤ W exactly; the knapsack contents sum to the displayed total;</li><li>ratio display is correct;</li><li>the Select caption names every chosen item, and the Final caption is exact</li></ul> | 800 |
| Regressions: (8,1)+(15,2) at W 10 → 4/3, item 2 only; the 3.3/3.3/3.4 case leaves the 4th item out and remaining = 0; default → 240 with Item 3 at 2/3 | unit |
| Helpers: `decimalToRational` equals mantissa/10^scale; `1e-7` and `1e21` are handled; the parser rejects "", "0", "-2", "12abc", "Infinity" | 500 + unit |

All 5 tests pass in about 1.6 s. `tsc` (strict) is clean.

## Not verifiable / left alone
- `knapsack-container.tsx` (display only, so not edited) computes "Used" as `capacity − remaining` in floating point. With decimal weights
  it can show a value such as 20.200000000000003. The algorithmic numbers it receives are exact.
- The 0/1 mode is the greedy heuristic, as labelled. Its result is checked against the greedy oracle, not against the 0/1 optimum.
- Animations are not tested.
