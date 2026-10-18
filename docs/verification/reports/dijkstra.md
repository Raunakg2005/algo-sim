# Dijkstra Visualizer (`dijkstra`)

## What it visualizes
`components/dijkstra-simulation.tsx` runs Dijkstra on an **undirected** weighted graph from a source, with an optional target. Frames
come in this order:
- init;
- for each extracted node: select, then relax (when it has unvisited neighbours), then finalize;
- complete;
- a last frame with either the shortest source-to-target path or "No path exists".

Each frame carries the distance, previous, visited, current and relaxed values for every node.

## UI input limits
- **Visual editor:** node labels must be unique. An edge needs two different nodes and no existing edge between them. Weight is
  `Number(input)`; `min=1` is only a hint, so 0 and negative numbers can be typed.
- **Bulk input:** node labels go on the first line. Edge lines take any `Number()` that is not NaN, so negative, 0 and fractional weights
  are allowed. Duplicate (parallel) edges and self-loops are also allowed.
- **Load Example:** A..F, source A, target F.
- **Random Graph:** 5..8 nodes, 30-60 % of all pairs, weights 1..10. The graph may be disconnected.

## Engine API (pure) - `lib/engines/dijkstra.ts`
- `validateDijkstraInput(graph, source) => string | null` returns an error for a missing source, a source not in the graph, a dangling
  edge, a NaN weight or a **negative weight**.
- `generateDijkstraSteps(graph, source, target) => DijkstraStep[]` uses the unchanged frame shape and throws on invalid input.

The component's `startAlgorithm` now shows the validation error or calls the engine; the 170 lines of inline logic were removed.

## Legacy check (original `startAlgorithm` from HEAD, setters replaced by variables)
Harness: `legacy\dijkstra\legacy.ts` and `check.ts`. One instrumentation line was added: a counter in the path-reconstruction loop
that turns an infinite loop into a "HANG" exception. `ui_check2.ts` drives the real component code through a mini hooks runtime.

The legacy check ran 30,000 runs:
- 7,500 from Load Example and Random Graph;
- 15,000 bulk graphs with weights 0..10, duplicates and self-loops;
- 7,500 bulk graphs with weights −5..10.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| Unreached nodes have distance `null` instead of ∞. Frames were deep-copied with `JSON.parse(JSON.stringify())`, which turns `Infinity` into `null`, so the node's distance badge disappears | 26,179 / 30,000 runs (87 %), 192,078 / 348,925 frames (55 %). On the built-in example: 10 of 20 frames | any graph with ≥ 2 nodes: every frame after "init" |
| Negative weights accepted. Dijkstra then labels wrong "shortest" distances, and in an undirected graph any negative edge makes shortest walks unbounded | all 4,574 negative-weight runs accepted; 1,149 claimed a finalized distance different from the best simple path | `A,B,C / A,B,1 / A,C,2 / C,B,-5`, source A: claims B = 1, but A→C→B = −3 |
| **Infinite loop (tab freezes)** in path reconstruction: a negative self-loop makes a node its own predecessor | 752 / 4,574 negative-weight runs | bulk `A / A,A,-2`, source A, target A |
| Source = target produces no result frame | 5,324 / 5,324 such runs (100 %) | 2 nodes, source = target = A |
| Crash on render (TypeError reading `.current` of undefined) when a node is added while a run is shown, because the frames have no state for the new node | found by code inspection (the render is not executed by the harness) | add a node after Start |

With non-negative weights the legacy distances were **correct in 25,426 / 25,426 runs**, and every shown path was a real shortest path.

## Fixes
1. Frames are copied with object spread, so `Infinity` is preserved. No frame contains `null` (tested).
2. Negative or NaN weights are rejected with "Dijkstra's algorithm requires non-negative edge weights … Use Bellman-Ford". This removes
   both the wrong answers and the hang. The `ui_check2.ts` run of the fixed component shows that error for the counterexample above.
3. Source = target gives the frame "Shortest path from A to A: A (distance = 0)".
4. Self-loops are no longer listed as relaxed neighbours.
5. `getNodeColor` and `getNodeBorder` fall back when a node has no state in the current frame.

## Properties tested - `tests/engines/dijkstra.test.ts`, oracle `tests/reference/dijkstra.ts`
The oracle uses |V| rounds of undirected relaxation. Generated graphs have 1..8 nodes with parallel edges, self-loops and weight 0 allowed.

| Property | numRuns |
|---|---|
| Final distance of every node equals the oracle; each reachable node is selected exactly once | 4,000 |
| Every frame:<ul><li>has all nodes, and every distance is a number (never null or NaN);</li><li>distances are never below the true distance and never increase;</li><li>visited nodes hold exact distances;</li><li>predecessors are real tight edges;</li><li>nodes are finalized in non-decreasing distance order;</li><li>relaxed edges are incident to the current node and lead only to unvisited nodes.</li></ul> | 4,000 |
| The final frame shows a simple path from source to target whose weight equals the oracle distance, or "No path exists" | 3,000 |
| Negative weights are rejected exactly when present (validator and engine), including the legacy hang case | 2,000 |
| Source = target, and the built-in example (A→D→E→F, distance 8, all six distances) | unit |

All 6 tests pass in about 3 s.

## Not verifiable here
Colours, the drag-to-move layout and animation timing.
