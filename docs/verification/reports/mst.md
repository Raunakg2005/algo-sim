# Minimum Spanning Tree Visualizer (`mst`, Kruskal + Prim)

## What it visualizes
`components/mst-simulation.tsx` with `lib/mst-algorithms.ts` and `lib/graph-utils.ts`. Tabs for Kruskal and Prim on a random
undirected weighted graph. Kruskal frames are initial, sort (all edges highlighted in sorted order), then check followed by
add or skip for each edge, then complete. Prim frames are initial, start (node A), then in each round one check frame per crossing edge
followed by add, then complete. The explanation panel shows the running total weight on add, skip and complete frames.

## UI input limits
There is no manual graph input. The graph always comes from `generateRandomGraph(nodeCount, density)` with 4..12 nodes (slider/buttons)
and density 0.3..1.0 in steps of 0.1. The generator builds a simple graph with integer weights 1..20 and adds edges until it is connected.
Prim always starts at node A.

## Engine API (pure) - `lib/engines/mst.ts`
`runKruskalsAlgorithm(graph) => AlgorithmStep[]` and `runPrimsAlgorithm(graph, startNode) => AlgorithmStep[]`, with the unchanged
`AlgorithmStep` shape. The step generators were already pure, so I moved them into the engine. `lib/mst-algorithms.ts` now only
re-exports them because `components/algorithm-explanation.tsx` imports the type from there. `mst-simulation.tsx` imports
`@/lib/engines/mst`. `lib/graph-utils.ts` (types and the random generator) is unchanged.

## Legacy check (original HEAD lib files, unchanged)
Harness: `docs/verification/legacy/mst\check.ts`.
- 20,000 graphs: 10,000 from the UI generator (all node counts and densities) and 10,000 arbitrary connected simple graphs with 2..12 nodes
  and weights 1..4 (many ties). The oracle is reverse-delete.
- **0 wrong MST weights (Kruskal 0, Prim 0), 0 results that are not spanning trees.** The generator produced 0 disconnected graphs,
  0 duplicate edges and 0 weights outside 1..20.
- **The original MST code is correct on every input the UI can produce.**

## Fixes
- None to the algorithm. The only behavioural change is the final caption for a disconnected input, which cannot occur through the UI. Kruskal
  then says the result is a minimum spanning forest and Prim says only the start component was spanned. Before, both claimed
  "Minimum Spanning Tree is complete."
- Cosmetic: Kruskal's early-exit test was moved to the top of the loop. It produces the same frames for every graph with at least 2 nodes.

## Properties tested - `tests/engines/mst.test.ts`, oracle `tests/reference/mst.ts`
The oracles are reverse-delete MSF weight, brute-force enumeration of all (n-1)-edge subsets, and DFS component counting.
| Property | numRuns |
|---|---|
| Kruskal and Prim totals equal the oracle on connected graphs with weights 1..3 (heavy ties, n 2..12). The final edges form a spanning tree whose sum is `totalWeight` | 3,000 |
| Equal to brute-force spanning-tree enumeration (n ≤ 7, ≤ 12 edges, weights 1..20). Prim is run from every start node | 1,500 |
| Disconnected graphs: Kruskal returns a minimum spanning forest with n − c edges; Prim returns a forest; captions say "disconnected" exactly when c > 1 | 1,500 |
| Kruskal frames: the sort frame is sorted; edges are checked in non-decreasing weight; a check is followed by add exactly when it joins two trees, otherwise skip; mstEdges is always a forest and grows by exactly the added edge; `totalWeight` equals the sum | 1,500 |
| Prim frames: each round checks every crossing edge exactly once; the added edge has minimum crossing weight; the tree stays connected; any start node is tested | 1,500 |
| UI generator: always connected and simple, with integer weights 1..20, for every node-count/density setting | 2,000 |

All 6 tests pass in about 8 s.

## Not verifiable here
SVG layout and highlight colours, which `components/graph-visualization.tsx` derives directly from the frame's edge and node lists.
