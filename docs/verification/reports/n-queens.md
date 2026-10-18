# n-queens — components/eight-queens.tsx

## What it visualizes
Backtracking for N-Queens: queens are placed column by column (left to right), rows tried top to bottom; each square
examined gets a "Considering" frame followed by either a "Conflict" frame (pointing at the attacking queen) or a "Placed"
frame; after the recursive call a "Backtracking" frame removes the queen. The search does not stop at the first solution:
all solutions are enumerated and can be cycled with "Next Solution" at the end.

## UI input limits
None: the board size is fixed at 8 (`setBoardSize` is never called). The engine takes the size as a parameter and was
tested exhaustively for sizes 1–8.

## Engine API
`lib/engines/n-queens.ts`
- `generateNQueensSteps(boardSize: number): { steps: QueensStep[]; solutions: QueensPosition[][] }` — pure; frame shape
  is the original `AlgorithmStep` (`phase, description, board, currentPosition, conflictPositions, queensPositions,
  previousPosition?`).
- `summarizeNQueens(result)` → `{ frames, squaresConsidered, conflicts, queensPlaced, backtracks, solutions, treeNodes }`
  (statistics computed from the real frame list, for the paper).
- The component's `startAlgorithm` calls the engine.

## Legacy check (harness `...\algoaudit\legacy\n-queens\`; `legacy.ts` splices lines 12–23 and 53–200 of
`git show HEAD:components/eight-queens.tsx` verbatim; results in `results.txt`)
Run for every size 1–8 against a brute-force oracle (all n! permutations).

**The original was correct.** Solution counts 1, 0, 0, 2, 10, 4, 40, 92 (all distinct, all valid); 0 frames with
attacking queens; 0 conflict frames whose highlighted square is not an attacking queen; 0 violations of the
column-by-column / top-to-bottom order; board array always agrees with the queen list. No defects found.

The extracted engine produces **byte-identical frames and solutions** to the original for sizes 1–8 (`equiv.ts`).
The only change is a simpler (equivalent) safety test: the original's fourth loop over the queen list was redundant.

## Search statistics (from the engine; 8×8 is what the UI shows)
| n | frames | squares examined | conflicts | queens placed (= backtracks) | tree nodes incl. root | solutions | first solution reached after |
|---|---|---|---|---|---|---|---|
| 4 | 140 | 60 | 44 | 16 | 17 | 2 | frame 58 (26 squares, 8 placements) |
| 5 | 505 | 220 | 167 | 53 | 54 | 10 | frame 32 |
| 6 | 1,946 | 894 | 742 | 152 | 153 | 4 | frame 369 |
| 7 | 7,761 | 3,584 | 3,033 | 551 | 552 | 40 | frame 88 |
| **8** | **33,590** | **15,720** | **13,664** | **2,056** | **2,057** | **92** | frame 1,859 (876 squares, 113 placements, 105 backtracks) |

First 8×8 solution (row of the queen in columns a–h): 1, 5, 8, 6, 3, 7, 2, 4.
Usability note: at the default speed (2 s per frame) the full 8×8 run takes about 18.7 hours to play.

## Fixes made
None needed (logic moved verbatim into the engine).

## Properties tested (`tests/engines/n-queens.test.ts`, oracle `tests/reference/n-queens.ts`)
The input domain is tiny, so tests are exhaustive over n = 1–8 rather than random.
| Property | Inputs |
|---|---|
| Solution set = brute-force permutation oracle; counts = OEIS A000170 (92 for 8×8); no duplicates; success frames list the solutions in order; final caption | n = 1–8 |
| Every frame: queens non-attacking and on the board; board agrees with queen list; queens occupy columns 0..k−1; conflict squares hold a queen that attacks the current square; "Considering" is in the next column; placed/backtracked queen added/removed | n = 1–8 (all 44,481 frames) |
| Sequence of examined squares and their verdicts = an independent queen-list backtracking trace | n = 1–8 |
| 8×8 statistics as in the table above | n = 8 |

Run time ≈ 1.5 s. All 4 tests pass. Type-checked with a scoped `tsc` (strict).

## Not verifiable here
Board rendering, animation, colours. Captions use (row, column) numbers while the board labels columns a–h — not wrong,
but the paper should not mix the two notations.
