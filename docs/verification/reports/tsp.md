# TSP Visualizer (`tsp`, Held-Karp bitmask DP)

## What it visualizes
`components/tsp-simulation.tsx` with `lib/tsp-solver.ts` and `lib/tsp-utils.ts` uses Held-Karp dynamic programming, where
dp[mask, end] is the cheapest path from the start city that visits exactly the cities in mask and ends at end. The frames are:
- initial;
- base cases;
- for each subset and end city, one "Considering path" frame per predecessor, followed by an "Updated DP table" frame;
- one "Considering return" frame per last city;
- one backtracking frame per city;
- final, with the tour and its cost.

The DP-table, graph and explanation components render these frames.

## UI input limits
- **Coordinates tab:** any number of cities with any (float) coordinates. Distances are rounded Euclidean values.
- **Distance Matrix tab:** 2..8 cities, symmetric non-negative integers. New cells default to 0.
- **"Generate 5 Random Cities":** integer coordinates 50..449.
- Solve needs ≥ 3 cities. The start city is chosen with one button per city.

## Engine API (pure) - `lib/engines/tsp.ts`
`solveTSP(distances, startCity = 0, cityNames?) => TSPStep[]`. The `TSPStep` shape is unchanged.

I moved the solver here. `lib/tsp-solver.ts` now only re-exports it, because the graph, DP-table and explanation components import
`TSPStep` from there. `tsp-simulation.tsx` imports `@/lib/engines/tsp`. `lib/tsp-utils.ts` was already pure and is unchanged.

## Legacy check (original HEAD `lib/tsp-solver.ts`, unchanged)
Harnesses: `legacy\tsp\check.ts`, `scale.ts` and `hang.ts`, plus `legacy\ui_check2.ts`, which runs the real component code.

**The optimum is always correct.** The check covered 6,000 instances:
- 2,000 from "5 random cities";
- 2,000 from typed coordinates (3..8 cities);
- 2,000 from matrix-tab instances (3..8 cities, values 0..29 with many zeros).

On these, the cost differed from brute-force permutations 0 times, the tour was invalid 0 times, and the tour's cost differed from the
reported cost 0 times. The number of "Considering path" frames always equalled the Held-Karp count.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| Backtracking frames draw an edge that is **not in the optimal tour**: start → (city just recovered). They show `[start, …suffix]`, which is not a sub-path of the tour | 14,050 / 26,050 backtrack frames (53.9 %); 5,334 / 6,000 runs (88.9 %) | any 4-city instance, second backtrack frame |
| **Crash plus stale display** after deleting cities when the chosen start city no longer exists. `solveTSP` throws `TypeError: Cannot read properties of undefined (reading '0')`, and the previous instance's frames (the 5-city tour) stay on screen | deterministic | 5 random cities, pick start E, delete a city, Solve TSP |
| **No city limit in the coordinates tab** (frames copy the whole DP table each time) | 8 cities: 621 ms; 9: 4.8 s; **10: out of memory at a 1 GB heap** | add 10 cities and press Solve |
| Captions name cities by 0-based index ("city 0", "subset {A, B}") while the graph shows letters or user names, and the final caption always uses letters | 6,000 / 6,000 runs | any run |
| (Pre-existing, already fixed in the working tree before this work) HEAD used `<DistanceMatrixInput>` without importing it, so opening the Distance Matrix tab threw a ReferenceError | n/a | n/a |

## Fixes
1. Backtracking frames show `[recovered suffix…, start]`. These are the last edges of the optimal tour, ending with the return edge, so
   every drawn edge belongs to the tour.
2. The engine rejects a start city that is not one of the cities with a RangeError. It also rejects non-square or negative input and more
   than 16 cities. The component resets the start city when cities are removed, limits every solve to 8 cities (the matrix tab's limit),
   and shows solver errors instead of throwing. `ui_check2.ts` on the fixed component: no exception, start reset to A, and a fresh 4-city
   tour. 12 typed cities give the "limit to 8 cities" message.
3. Captions use the names shown in the UI (letters by default, or the names typed in the coordinates tab).
4. Consecutive frames share one read-only snapshot of the DP tables. Before, every frame copied them. An 8-city solve now takes about 60 ms
   instead of 620 ms, with identical frame contents.

## Properties tested - `tests/engines/tsp.test.ts`, oracle `tests/reference/tsp.ts`
The oracle is brute force: every tour by DFS, and every path through each subset by permutation. Instances are drawn from three
generators: symmetric matrices with zeros, asymmetric matrices, and rounded distances between fractional, negative or coincident coordinates.
| Property | numRuns |
|---|---|
| The tour cost equals the brute-force optimum, and the tour is a permutation starting at the start city whose cost equals `tourCost` (n 2..7, random start) | 1,000 |
| The same for 8 cities, the UI maximum | 60 |
| Every DP entry equals the brute-force cheapest path through its subset, there are (n−1)·2^(n−2) states, and every parent pointer satisfies the recurrence (n ≤ 6) | 800 |
| Trace:<ul><li>the base, considering, update, return and backtrack frame counts equal the Held-Karp formulas;</li><li>a DP entry is never changed or removed once written;</li><li>update and considering frames point at existing states;</li><li>every city index in every frame is valid.</li></ul> | 800 |
| Backtracking frames grow by one city, end at the start city, and draw only edges of the optimal tour | 800 |
| Captions use the given names (no "city 0"); the default names are letters; an invalid start city throws a RangeError | unit |
| `generateRandomCities` and `calculateDistances` produce cities in range, a zero diagonal, symmetric integers and the triangle inequality up to rounding | 1,000 |

All 8 tests pass in about 17 s. Most of that time is the 8-city brute force.

## Not verifiable here
Graph and DP-table rendering and animation. `components/tsp-step-explanation.tsx` (not assigned to me) still prints city indices in its
small "Updating DP[…]" line.
