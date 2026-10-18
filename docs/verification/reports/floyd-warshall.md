# Floyd-Warshall Visualizer (`floyd-warshall`)

## What it visualizes
`components/floyd-warshall.tsx` computes all-pairs shortest paths on a **directed** graph that is entered as a weight matrix. The frames are:
- init;
- for every (k, i, j) a compare frame, with "New: ∞ (not possible)" when i→k or k→j is ∞;
- an update frame after each improvement;
- complete.

After the run, "Show Path" reconstructs the path between two chosen nodes.

## UI input limits
- 2..10 nodes.
- Matrix cells accept `""`, `"∞"` or `/^[0-9]+$/`, so only **non-negative** integers. The diagonal is fixed at 0.
- Random Graph: 3..6 nodes, 30 % ∞, weights 1..10.

## Engine API (pure) - `lib/engines/floyd-warshall.ts`
- `INFINITY` (= `Number.POSITIVE_INFINITY`).
- `isMatrixEntryInput`.
- `parseDistanceMatrix(text, n) => { matrix } | { error }`.
- `generateFloydWarshallSteps(matrix) => FloydWarshallStep[]` (same frame shape).
- `reconstructFloydWarshallPath(weights, dist, s, t) => number[]`. This is a BFS over tight edges w(u,v) + d(v,t) = d(u,t). Every
  returned path is therefore a real path of shortest weight; it returns `[s]` when s = t and `[]` when t is unreachable.

The component calls these, and its inline algorithm and path code were removed.

## Legacy check (original HEAD code)
The harness is `legacy\floyd-warshall\legacy.ts` plus `check.ts`. It contains the handler bodies verbatim with the React-style state
simulation. `legacy\ui_check.ts` runs the real component code (original and fixed), and `chain.ts` is the minimal counterexample.

**The distance matrix itself is correct.** 20,000 runs were compared with all-pairs search: half were random-button matrices, and the
other half had 2..10 nodes, weights 0..7 and 45 % ∞. There were 0 wrong final matrices.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| **Path reconstruction is wrong whenever a path has ≥ 2 intermediate nodes.** The recursive helper is called with a visited set that already contains its own endpoints, so it returns `[]` and only one intermediate node is ever shown. The shown "path" can use edges that do not exist | 135,298 / 519,786 reachable ordered pairs (26.0 %); 12,369 / 20,000 runs (61.8 %) contain at least one wrong path | chain A→B→C→D (weights 1): "Shortest path: A → B → D", but there is no edge B→D |
| Path from a node to itself shown as "A → A" | 105,072 / 105,072 such pairs (100 %) | any node |
| Compare frames with candidate 0 show "New path distance: ∞" (`newDistance \|\| INFINITY`), while the caption says "New: 0" | 187,423 frames; 20,000 / 20,000 runs (the i = j = k frames) | the frame "Comparing paths from A to A via A" |
| `previousMatrix` of update frames is an object of objects instead of a matrix. It was built by spreading an array into an object; the values happened to be right | 450,208 / 450,208 update frames | any update |
| **Random Graph builds the wrong graph.** It uses the stale `numNodes` and matrix, and the effect then wipes the generated matrix | 7,451 / 7,451 clicks (100 %); the shown matrix is wiped in 5,575 (74.8 %); the first click always gives an edgeless graph | fresh page, click Random Graph |
| The path highlight also colours the reverse edge v→u of a directed graph | by inspection | A⇄B both present, path A→B |
| Crash (`RangeError`) when the node-count box holds a negative or fractional number | by inspection | type `-1` |

`ui_check.ts` on the real component code: the original mismatched 2,451 / 2,451 clicks (1,863 wiped); the fixed version mismatched 0 and wiped 0.

## Fixes
1. Path reconstruction now uses the engine's tight-edge BFS. The chain example now gives A → B → C → D, A→A gives "A", and only the
   directed path edges are highlighted.
2. `|| INFINITY` and `|| value` were replaced by `??`, so 0 candidates are shown as 0.
3. `previousMatrix` is a real `number[][]` that differs from `distanceMatrix` only at (i, j). Compare frames share one snapshot for both fields.
4. `INFINITY` is `Number.POSITIVE_INFINITY` (it was `MAX_SAFE_INTEGER`, which a user could type).
5. `generateGraph(n, matrix)` takes explicit arguments for Random Graph. The effect only resizes when needed. The node-count box is clamped.

## Properties tested - `tests/engines/floyd-warshall.test.ts`, oracle `tests/reference/floyd-warshall.ts`
The oracle is all-pairs Dijkstra. A restricted search that only passes through vertices < k gives the DP state D_k.
| Property | numRuns |
|---|---|
| Final matrix equals all-pairs Dijkstra (n ≤ 10, weights 0..12 including 0, about 33 % ∞) | 3,000 |
| Frame structure and DP invariant (n ≤ 7):<ul><li>exactly n³ compare frames, in (k, i, j) order;</li><li>`newDistance` is d(i,k) + d(k,j), or undefined when either is ∞;</li><li>entries never increase and never go below the truth;</li><li>when round k starts, the matrix equals D_k (shortest paths through intermediates < k), and at the end it equals D_n;</li><li>an update follows its compare frame and changes only (i, j);</li><li>`previousMatrix` is always a matrix.</li></ul> | 1,500 |
| For every ordered pair: the path is simple, starts and ends correctly, and its weight equals the distance; s = t gives [s]; an unreachable target gives [] | 3,000 |
| The chain counterexample, and the input/parse rules | unit |

All 5 tests pass in about 5 s.

## Not verifiable here
SVG layout and animation. Negative weights cannot be entered, so negative cycles cannot occur in the UI and are not part of the tested domain.
