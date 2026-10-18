# Bellman-Ford Visualizer (`bellman-ford`)

## What it visualizes
`components/bellman-ford-simulation.tsx` runs single-source shortest paths on a **directed** graph that is entered as a weight matrix.
Negative weights are allowed. The frames are:
- init;
- for iterations 1..|V|, one relax frame per edge in matrix order, followed by an update frame when the edge improves its target;
- iteration |V| is the detection pass. If an edge can still be relaxed there, a negative-cycle frame ends the run;
- otherwise a complete frame.

After the run, "Show Path" reconstructs a path from the predecessors.

## UI input limits
- 2..10 nodes, labelled A.. (the number input and ± buttons).
- Matrix cells accept `""`, `"∞"` or `/^-?[0-9]+$/` (integers, negative allowed). The diagonal is fixed at 0.
- Random Graph: 3..6 nodes, 30 % ∞, weights −2..10, random source.

## Engine API (pure) - `lib/engines/bellman-ford.ts`
- `INFINITY` (= `Number.POSITIVE_INFINITY`).
- `isMatrixEntryInput(value)`: what a cell may hold while typing.
- `parseWeightMatrix(text, n) => { edges } | { error }`.
- `generateBellmanFordSteps(labels, edges, source) => BellmanFordStep[]`: same frame shape and semantics as before.
- `reconstructBellmanFordPath(completeStep, target) => string[]`.

The component now calls these. Its inline algorithm, matrix conversion and path code were removed.

## Legacy check (original HEAD code)
The harness re-creates the component's state handling. `legacy\bellman-ford\legacy.ts` contains the handler bodies verbatim, with
React-style batching and the `[numNodes]` effect; `check.ts` drives it. Separately, `legacy\ui_check.ts` executes the real component
code, original and fixed, through a mini hooks runtime (`_minireact.ts`).

**The algorithm itself is correct.** 20,000 runs were checked against textbook Bellman-Ford (n − 1 rounds plus a detection pass). Half were
random-button matrices; the other half had 2..10 nodes, weights −6..14 and 40 % ∞. 9,499 of the runs contain a reachable negative cycle.
Result: 0 wrong distances and 0 wrong negative-cycle verdicts.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| Distance **0 displayed as ∞**: the table uses `distances[x] \|\| INFINITY`, and the same applies to the old distance and to the path distance | 20,000 / 20,000 runs (the source row in every frame); 1,159,405 / 2,770,681 frames (41.8 %) | any graph: the source shows "∞" |
| "Potential new distance" for an edge leaving an unreachable node is computed from the `MAX_SAFE_INTEGER` sentinel | 16,826 / 20,000 runs (84 %) | edge A→B with weight 5 while A is unreachable shows `9007199254740996` |
| **Random Graph builds the wrong graph.** `generateGraph()` runs in the same click with the stale `numNodes` and matrix, and then the `[numNodes]` effect wipes the newly generated matrix to all-∞ | 7,561 / 7,561 clicks build a graph different from the matrix shown (100 %); the shown matrix is wiped in 5,672 (75 %); the source label is not in the graph in 645 (8.5 %); the first click always gives an edgeless 5-node graph (3,000 / 3,000) | fresh page, click Random Graph |
| Negative numbers cannot be typed left to right: the intermediate value `"-"` fails the regex and is discarded | by inspection; covered by a unit test | type `-` then `3` in a cell |
| Crash (`RangeError: Invalid array length`) when the node-count box holds a negative or fractional number (`Array(numNodes)`) | by inspection | type `-1` |
| Start with a source label outside the generated graph (node count changed after Generate Graph) silently gives all ∞ | by inspection | generate 5 nodes, set the count to 7, choose source G, Start |

`ui_check.ts` on the real component code, 1,000 sessions:
- Original: 2,458 / 2,458 clicks showed the mismatch, 1,854 had a wiped matrix and 204 had a source outside the graph.
- Fixed: 0 mismatches, 0 sources outside the graph, and 1 all-∞ matrix (a genuinely all-∞ random draw, which matches its graph).

## Fixes
1. `INFINITY` is now `Number.POSITIVE_INFINITY`. It cannot collide with real sums, and the "potential distance" from an unreachable node shows ∞.
2. `|| INFINITY` was replaced by `?? INFINITY` in the five display expressions, so 0 is shown as 0.
3. `generateGraph(n, matrix)` takes explicit arguments. Random Graph passes the matrix it just generated. The `[numNodes]` effect only
   rebuilds the matrix when its size differs, and uses `Array.from` with a sanitized size. The node-count box is clamped to an integer 0..10.
4. `"-"` is accepted while typing. Incomplete entries are rejected on Generate Graph with the existing "Invalid value at position" message.
5. Start refuses a source that is not in the generated graph and shows an error.
6. Path reconstruction moved to the engine and is bounded by |V|.

## Properties tested - `tests/engines/bellman-ford.test.ts`, oracles `tests/reference/bellman-ford.ts`
The oracles are brute force (every simple path, plus every simple cycle through a reachable vertex) and textbook Bellman-Ford.
| Property | numRuns |
|---|---|
| Final verdict (complete vs negative-cycle) and all distances equal brute force (n ≤ 6, weights −6..14) | 4,000 |
| Equal to textbook Bellman-Ford for n ≤ 10. Without a cycle there are exactly n·|E| relax frames | 2,000 |
| Every frame:<ul><li>iterations are monotone in 1..n;</li><li>every distance is ∞ or a small integer (no sentinel leaks);</li><li>distances never increase and are never below the true distance;</li><li>predecessors are tight edges;</li><li>each update directly follows the relax frame for the same edge and sets d(u) + w, with a correct previous value;</li><li>no update happens in the detection pass;</li><li>a negative-cycle frame can only be the last frame;</li><li>no caption contains a 12+ digit number.</li></ul> | 3,000 |
| A reconstructed path starts at the source and its weight equals the final distance; unreachable nodes give [] | 2,000 |
| Typing rules (`-`, `-12`, `∞`, …) and parse errors; source 0 stays 0; a 2-cycle of weight −1 is detected | unit |

All 6 tests pass in about 5 s.

## Not verifiable here
SVG arrows, colours and animation timing.
