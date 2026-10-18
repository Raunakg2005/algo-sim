# graph-coloring — components/graph-coloring.tsx

## What it visualizes
m-colouring by backtracking: vertices are coloured in order A, B, C, ...; for each vertex the colours are tried in order
(Red, Blue, Green, ...); a colour that clashes with an already-coloured neighbour gives a "Conflict" frame (that
neighbour and the edge are highlighted red); otherwise the colour is assigned and the next vertex is tried; failure
backtracks. The search stops at the **first** proper colouring (so "Solution 1 of 1"), or reports that none exists.

## UI input limits
Number of nodes 2–10 and colours 1–10 (checked only when "Generate Graph" is pressed); edges added one by one (no
self-loops, no duplicates); Start requires at least one edge. Random Graph: 3–8 nodes, 2–4 colours, 30–70% of the
possible edges. The number boxes use `Number(value)`, so 2.5, 0, 11 or an empty box (0) could be typed after generating
the graph and were used by Start unchecked.

## Engine API
`lib/engines/graph-coloring.ts`
- `generateGraphColoringSteps(nodes: {id,label}[], edges: {source,target}[], numColors: number, maxSteps = 50000):
  { steps: ColoringStep[]; solutions: NodeColors[]; limitReached: boolean }` — pure; frame shape is the original
  `AlgorithmStep`. Throws `RangeError` unless `numColors` is an integer in 0–10.
- `COLOR_NAMES` moved here (used in captions); `COLORS` (CSS classes) stays in the component.
- The component's `startAlgorithm` validates the colour count and calls the engine.

## Legacy check (harness `...\algoaudit\legacy\graph-coloring\`; `legacy.ts` splices lines 16–56 and 264–411 of
`git show HEAD:components/graph-coloring.tsx` verbatim; results in `results*.txt`)
Oracle: chromatic number by subset dynamic programming over independent sets (m-colourable ⇔ χ ≤ m).

**The backtracking itself was correct:** over 20,000 Random-Graph inputs and 20,000 typed graphs (n 2–10, m 1–10,
density 0.1–0.9): 0 wrong verdicts, 0 improper colourings, 0 colours ≥ m, 0 improper intermediate frames, 0 conflict
frames pointing at a non-neighbour.

| Defect | Random Graph (20,000) | Typed graphs (20,000) | Minimal counterexample |
|---|---|---|---|
| Final caption "colored successfully using **m** colors" although fewer are used | 7,598 (38.0%) | 12,533 (62.7%) | edge A–B + isolated C, m = 3: "using 3 colors", 2 used |
| Colour count not validated at Start: non-integer m silently allows ⌈m⌉ colours | (needs typing) | — | triangle, m = 2.5 → coloured with 3 colours, caption "using 2.5 colors" |
| Exponential frame list for dense graphs: browser tab runs out of memory | — | — | K9 with 8 colours: 1,972,819 frames, 689 MB heap in Node; K10 with 9 colours ≈ 8.9 M colour attempts (≈ 20 M frames, extrapolated, not run) |

(m = 0 or negative only produced a correct "No solution" message; m > 10 never showed an undefined colour because at
most 10 colours can be needed for ≤ 10 vertices.)

## Fixes made
1. Final caption: "Solution found! All nodes colored successfully using k of the m available colors."
2. Start rejects a colour count that is not a whole number in 1–10; "Generate Graph" also requires whole numbers.
3. Frame budget: the search stops once 50,000 frames have been produced (checked before each colour attempt, overshoot
   ≤ n + 2 frames) with the caption "Search stopped after N steps without finding a coloring: the backtracking tree is
   too large to animate. Try fewer edges or more colors." It never claims "no solution" unless the search finished.
   None of 40,000 random/typed legacy inputs needed more than ~4,000 frames, so ordinary graphs are unaffected.
Apart from the final caption (and the budget), the engine's frames are identical to the original's: 5,000 random
graphs compared frame by frame — 965 identical, 3,564 differ only in the final caption, 0 other differences.

## Properties tested (`tests/engines/graph-coloring.test.ts`, oracle `tests/reference/graph-coloring.ts`)
| Property | Inputs | numRuns |
|---|---|---|
| Colouring reported ⇔ χ ≤ m (DP oracle); the colouring is complete, proper, uses colours < m and ≥ χ of them; final caption names the real count; "no solution" caption otherwise; budget stop only when the unbounded search is provably larger than the budget | n 2–10, m 1–10, any edge set (≥ 1 edge, either orientation) | 3000 |
| First colouring = lexicographically first proper colouring (brute force over all m^n vectors) | n 2–7, m 1–4 | 2000 |
| Every frame: proper partial colouring, colours in range, coloured vertices form a prefix; try/assign/backtrack frames consistent; conflict vertex is a coloured neighbour with the tried colour | n 2–10, m 1–10 | 1500 |
| Number of "Trying" frames and assignments = textbook adjacency-matrix backtracking | n 2–10, m 1–10 | 2000 |
| Small budgets (20–400): frames consistent, length ≤ budget + n + 3, honest stop caption, otherwise correct verdict | n 2–10, m 1–10 | 1500 |
| K10 with 9 colours is cut off at the default budget; K10 with 10 colours is solved | fixed | 1 |
| Non-integer / out-of-range colour counts throw | fixed | 4 values |

Run time ≈ 5.3 s. All 7 tests pass. Type-checked with a scoped `tsc` (strict).

## Not verifiable here
Circular layout, animation, colours. Only the first solution is ever found, so "Next Solution" has nothing to cycle
through (unchanged behaviour). The explanation text's "the goal is to use the minimum number of colors" describes the
optimisation problem; the visualizer solves the m-colouring decision problem.
