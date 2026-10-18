# fifteen-puzzle — components/fifteen-puzzle-branch-and-bound.tsx

## What it visualizes
Least-cost branch and bound (A*) for the 15-puzzle: cost g = moves so far, heuristic h = Manhattan distance, f = g + h.
The live state with the smallest f is selected, its children are generated ("Move tile X dir"), and queued. Per frame
the UI shows the current board, the live priority queue (state id and f), a table of generated states (parent, move,
g, h, f, status) and, at the end, the solution path. The search is limited to 1,000 generated states.

## UI input limits
Custom grid: 16 comma-separated numbers, each 0–15, all distinct (row-major, 0 = blank). The original check accepted
non-integers (e.g. 1.5). Random Puzzle: originally 100 random blank moves from the goal. Default board: the goal itself.

## Engine API
`lib/engines/fifteen-puzzle.ts`
- `generateFifteenPuzzleSteps(initialGrid: number[][], maxStates = 1000): PuzzleStep[]` — pure; frame shape is the
  original `AlgorithmStep` (`phase, description, currentStateId, bestStateId, states: Map, activeStates,
  exploredStates, prunedStates, path`), state shape the original `PuzzleState`. Throws `RangeError` for a malformed board.
- Also exported: `GOAL_GRID`, `manhattanDistance`, `isSolvable` (inversion parity), `isValidBoard`.
- The component's `startAlgorithm` calls the engine; the generator and custom-grid parser stay in the component.

## Legacy check (harness `...\algoaudit\legacy\fifteen-puzzle\`; `legacy.ts` splices lines 28–54, 74–86, 88–119,
121–154, 164–207 and 209–410 of `git show HEAD:components/fifteen-puzzle-branch-and-bound.tsx` verbatim; results in
`results*.txt`)
Oracle: breadth-first search backwards from the goal, giving the exact optimal move count of all 61,865 boards within
14 moves; solvability by permutation parity.

Moves were always legal and a reported solution always ended at the goal (0 violations). Defects:

| Defect | Rate | Minimal counterexample |
|---|---|---|
| Random Puzzle boards usually not solved: 100 random moves are far too deep for a 1,000-state search → "No solution found within the search limit." | 393/500 (78.6%) | any 100-move board |
| Every "Move tile X dir" caption (and the move column / solution-path labels) gives the **blank's** direction; the tile moves the opposite way | 100% of runs (500 Random, 1,608 scrambles) | one move from goal (`…, 14, 0, 15`): "Move tile 15 right" while tile 15 slides left |
| Not optimal: boards were marked visited when *generated*, so a board first reached by a longer path is never improved | 5/1,608 random short scrambles (0.3%); 5/2,686 boards sampled uniformly at optimal depth 6–14 (0.19%), all at depth ≥ 12 | `1 2 3 4 / 5 6 12 0 / 9 10 15 7 / 13 14 8 11`: optimal 12 moves, original 14 |
| No solvability check: unsolvable custom boards are searched until the limit (≈ 2,500 frames) and end with "No solution found within the search limit" | 88/88 unsolvable random permutations | 14 and 15 swapped |
| Custom grid accepts non-integers | — | `1.5,2,3,…,15,0` accepted, heuristic 0.5, searched to the limit |
| Init frame holds the live `states` map (later states leak into frame 0; hidden by the table filter, so not visible) | 100% | — |

## Fixes made
1. A* with proper duplicate handling: a board is closed when expanded; if a board still waiting in the queue is reached by
   a shorter path, the old entry is removed and shown as pruned ("Prune state X: state Y reaches the same board in g
   moves instead of g′"); boards reached again by a path that is not shorter are skipped (as before). Ties in f are broken
   by smaller h, then older state. With Manhattan distance (consistent) the first goal selected is optimal. The re-open
   case really occurs: 26 of 559 sampled boards at depth 12–14 used it.
2. Captions and the `move` field give the direction the tile slides.
3. Unsolvable boards are rejected immediately: "This board cannot be solved: its tile inversions and blank row have the
   wrong parity, so no sequence of moves reaches the goal." (2 frames).
4. The limit message names the limit ("No solution found within the search limit (1000 states).").
5. Component: custom grid values must be integers; **Random Puzzle now makes 15 random blank moves that never undo the
   previous move**. With the fixed engine, 100-move boards are still solved only 99/300 times; 15-move scrambles are
   solved 200/200 (mean 168 frames), 20-move 196/200, 30-move 92/200.
6. Every frame gets its own copy of the state map (including frame 0).

## Properties tested (`tests/engines/fifteen-puzzle.test.ts`, oracle `tests/reference/fifteen-puzzle.ts`)
| Property | Inputs | numRuns |
|---|---|---|
| Solved in exactly the BFS-optimal number of moves; caption; full frame check (below) | random walks of ≤ 40 moves landing within depth 14, and boards drawn uniformly from BFS depths 11–14 | 1500 |
| Random Puzzle boards (15 non-reversing moves) are solved; optimal where the BFS table knows the depth; frame check | button distribution | 300 |
| `isSolvable` (inversion parity) = permutation-cycle parity oracle | random permutations and scrambles | 5000 |
| Arbitrary custom boards: unsolvable → rejected in 2 frames with the unsolvable caption; solvable → solved (cost ≥ Manhattan, same parity, frame check) or stopped only after ≥ 1,000 states with the limit caption | random permutations of 0–15 | 40 |
| Frame check: every state is one legal move from its parent, g = parent g + 1, h = Manhattan (independent implementation), f = g + h, moved tile and its stated direction match the boards; queued/current states exist; each selected state has the least f in the queue, f never decreases, no board is expanded twice, a selected state is not queued or pruned; solution path is a parent chain from state 1 to the goal of length g + 1 | as above | — |
| Default board: 3 frames, 0 moves; one-move board captions "Move tile 15 left"; the original's suboptimal board solved in 12; malformed boards throw | fixed | 1 each |

Run time ≈ 9.2 s. All 7 tests pass. Type-checked with a scoped `tsc` (strict).

## Not verifiable here
Tile animation and colours; the table's status column logic (unchanged). Optimality is verified exactly only up to depth
14 (BFS table); deeper solutions are checked for legality, Manhattan lower bound and parity, and rely on the A*
optimality argument above.
