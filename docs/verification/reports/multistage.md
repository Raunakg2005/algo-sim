# Multistage Graph Visualizer (`multistage`)

## What it visualizes
`components/multistage-graph-optimization.tsx` solves the shortest path through a multistage graph. Consecutive stages are fully connected,
the first stage is labelled S and the last stage has a single terminal T. It uses backward dynamic programming:
cost(v) = min over edges (c(v,w) + cost(w)), computed stage by stage from the terminal back to stage 1. The frames are:
- init;
- for each stage, a "Computing Stage s" frame and one update frame per node;
- one backtrack frame per node of the optimal path;
- complete, with the optimal cost.

## UI input limits
- **Stages:** 2..10. This comes from the number box and the ± buttons; the box itself accepts any number.
- **Nodes per stage:** 1..5. The last stage is fixed at 1. **The first stage may have up to 5 nodes**, all labelled "S", and the default
  configuration is [2, 3, 2, 1].
- **Edge costs:** random 1..20, editable with `Number(input)` (0 and negative numbers allowed).
- **Load Example:** [1, 3, 2, 1] with fixed costs, optimum 13.
- **Random Example:** 3..5 stages with a single source and a single terminal.

## Engine API (pure) - `lib/engines/multistage.ts`
- `validateStageConfig(numStages, nodesPerStage)`.
- `buildMultistageGraph(numStages, nodesPerStage, costOf)`: the graph structure, ids and labels.
- `generateMultistageSteps(graph) => MultistageStep[]`: same frame shape.
- `MULTISTAGE_EXAMPLE`, `multistageNodeId`, `multistageEdgeId`, and the limits.

The component builds the structure with the engine and adds only the x/y layout. The DP and backtracking were removed from the component.

## Legacy check (original HEAD code)
The harness is `legacy\multistage\legacy.ts` plus `check.ts`. It contains the handler bodies verbatim with the React-style state simulation;
setTimeout callbacks keep their stale closure, as in the browser. `legacy\ui_check.ts` runs the real component code, original and fixed.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| **Wrong optimum when stage 1 has several "S" nodes**, which includes the default configuration. Only the first S is backtracked and reported | 5,234 / 8,021 multi-source runs (65 %); 0 / 11,979 single-source runs were wrong | stages [2, 1]: S₀→T = 15, S₁→T = 9, reported "= 15" |
| **Load Example never shows the example.** `"node-0-0-node-1-0".split("-")` gives `["node","0",…]`, so every `updateEdgeCost("node","0",…)` matches nothing. In addition, `generateGraph` runs from a `setTimeout` closure that still holds the previous stage configuration | wrong costs 1,500 / 1,500 (100 %); wrong structure 1,470 / 1,500 (98 %). Real component: 500 / 500 wrong graphs, 480 / 500 optimum ≠ 13 | fresh page, Load Example: builds the default 2-3-2-1 graph with random costs |
| **Random Example builds the previous configuration** (the same stale `setTimeout` closure) | 1,499 / 1,500 clicks; real component 500 / 500 | any click |
| A cost of 0 typed by the user is replaced by a random cost on regenerate (`edgeCosts[id] \|\| random`) | by inspection | set a cost to 0, click Generate Graph |
| A stage count such as 2.5 or 1000 typed in the box creates a non-integer stage loop with no terminal, or 1000 stages | by inspection | type `2.5`, Generate Graph |

The DP itself is correct for a single source. Over 20,000 runs (2..10 stages, 1..5 nodes, a third of the costs overwritten with −4..20),
the reported cost always matched brute-force enumeration of all stage paths, and the shown path always had the reported cost.

## Fixes
1. The engine takes the cheapest stage-1 node as the start of the optimal path. The backtrack caption says so when there are several sources.
2. `generateGraph(stages, perStage, costs)` takes explicit arguments. Load Example passes `MULTISTAGE_EXAMPLE` directly, so the broken
   id-splitting and the `setTimeout` calls are gone. Random Example passes its own configuration.
   `ui_check.ts` on the fixed component: 0 / 500 wrong example graphs, 0 / 500 example optima ≠ 13, 0 / 500 wrong random structures.
3. `??` keeps typed zero costs. Stage settings are validated (integer 2..10 stages, 1..5 nodes), the stage-count effect ignores impossible
   values, and nodes-per-stage are truncated to integers.

## Properties tested - `tests/engines/multistage.test.ts`, oracle `tests/reference/multistage.ts`
The oracles are brute-force path enumeration (≤ 14 nodes) and Bellman-Ford-style relaxation toward the terminal (larger graphs).
| Property | numRuns |
|---|---|
| Cost of every node equals the oracle. The caption reports the minimum over the stage-1 nodes. The final path has one node per stage, uses real edges, and its cost equals the optimum (2..10 stages, 1..5 nodes, costs −5..25) | 3,000 |
| Frames:<ul><li>stages are processed backwards;</li><li>every non-terminal node is updated exactly once, in its own stage;</li><li>each update equals the min over its successors using that frame's costs, and its "next" pointer is an argmin;</li><li>nodes that have not been computed yet stay ∞;</li><li>the backtrack frames are the prefixes of the final path.</li></ul> | 2,000 |
| Structure: stage sizes, complete links between consecutive stages, exactly one T | 500 |
| Load Example gives 11 edges with the example costs, optimum 13 and path S→(1,0)→(2,0)→T; the two-source counterexample gives 9; invalid stage settings are rejected | unit |

All 6 tests pass in about 7 s.

## Not verifiable here
Layout, colours and animation. With several first-stage nodes the UI still labels all of them "S". I left that label unchanged to avoid a UI
redesign; the engine now treats them as alternative sources.
