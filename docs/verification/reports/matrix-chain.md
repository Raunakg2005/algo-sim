# Matrix Chain Multiplication (`matrix-chain`)

## What it visualizes
`components/matrix-chain-multiplication.tsx` runs the bottom-up dynamic programme (CLRS MATRIX-CHAIN-ORDER) for M1·M2·…·Mn, where Mi is
p[i−1]×p[i]. Frames:
- init;
- for each subchain (i, j) in order of increasing length: a "computing" frame, one "trying split k" frame per k (cost
  m[i,k] + m[k+1,j] + p[i−1]p[k]p[j]), and a "new minimum" frame each time the best value improves (strict `<`, so ties keep the smallest k);
- "table completed";
- backtrack;
- complete, with the optimal parenthesisation read from the split table s.

## UI input limits
- **Number of matrices:** 2..10, set with the number box and the ± buttons. The box passes `Number(value)` on every keystroke.
- **Random dimensions:** 3..6 matrices with dimensions 5..44. The default is p = [30, 35, 15, 5, 10] (4 matrices, optimum 9375,
  ((M1 × (M2 × M3)) × M4)).
- **Custom dimensions:** a comma-separated list. The original parsed each entry with `parseInt` and required it to be > 0. Extra values are
  truncated to n+1 and too few give an error. There is no upper bound on a dimension.

## Engine API (pure) - `lib/engines/matrix-chain.ts`
- `generateMatrixChainSteps(p) => MatrixChainStep[]`: same frame shape; n = p.length − 1.
- `printOptimalParens(s, i, j)`.
- `parseDimensions(text)`: strict; throws an `Error` with the UI message.
- `validateMatrixCount(n) => string | null`, and `MAX_MATRICES = 10`.

`startAlgorithm` now calls `setSteps(generateMatrixChainSteps(dimensions.slice(0, numMatrices + 1)))`. The DP loop and the backtracking
were removed from the component.

## Legacy check (original HEAD code)
The harness is `legacy\matrix-chain\legacy.ts`: `startAlgorithm`, `handleCustomDimensions` and `updateDimensions`, verbatim, with setState
replaced by variables. The checks are `check.ts` and `bigdims.ts`, with output in `results.txt`. The oracle enumerates every parenthesisation
tree explicitly.

| Input set | Runs | m[i][j] wrong | s out of range | printed parenthesisation invalid / not optimal |
|---|---|---|---|---|
| UI random (3..6 matrices, dims 5..44) | 3,000 | 0 | 0 | 0 / 0 |
| Default example | 1 | 0 | 0 | 0 / 0 |
| Custom, 2..8 matrices, dims 1..6 (many ties) | 3,000 | 0 | 0 | 0 / 0 |
| Custom, 9..10 matrices, dims 1..100 | 200 | n/a (too many trees) | 0 | 0 / 0 |
| Large dims 1..10^4, 10^5, 10^6, 10^7 (3..8 matrices; exact BigInt DP oracle) | 4 × 20,000 | - | - | 0 non-optimal |

**The DP and the backtracking were correct on every input tried.** Defects were found only in input handling:

| Defect | Rate | Minimal counterexample |
|---|---|---|
| Dimension entries are silently misread by `parseInt` | by construction | `"30, 35.7, 15abc, 5, 10"` is accepted as [30, 35, 15, 5, 10]; `"1e3, 2, 3"` is accepted as [1, 2, 3] |
| A non-integer matrix count is accepted (the number box allows typing `2.5`). numMatrices becomes 2.5, the preview draws 2 matrices, and Start reports "Please provide 3.5 dimensions for 2.5 matrices". Not a crash, but the state is impossible | by construction | type `2.5` in "Number of Matrices" |

## Fixes
1. `parseDimensions` accepts only plain positive whole numbers (`/^\d+$/`, safe integers). `"35.7"`, `"1e3"` and `"15abc"` are rejected with
   "All dimensions must be positive integers".
2. `validateMatrixCount` rejects non-integers ("The number of matrices must be a whole number") in addition to the old < 2 / > 10 checks.
3. The algorithm is unchanged, apart from moving into the engine.

## Properties tested - `tests/engines/matrix-chain.test.ts`, oracle `tests/reference/matrix-chain.ts`
The oracle enumerates every full binary tree over M(i+1)..M(j+1), computes each tree's cost exactly with BigInt, and parses the printed
parenthesisation back into a tree.
| Property | numRuns |
|---|---|
| Every m[i][j] (all i ≤ j) equals the brute-force minimum; every s[i][j] ∈ [i, j−1] and attains m[i][j] (UI random; 2..8 matrices with dims 1..4 for ties; 2..8 matrices with dims 1..500) | 3 × 1,000 |
| The printed parenthesisation uses M1..Mn in order, and its exact cost equals the brute-force optimum (for n ≤ 8; for 9..10 matrices it equals m[0][n−1]). The final captions match | 1,000 |
| Frames:<ul><li>exactly n(n²−1)/6 "try" frames;</li><li>subchains are visited by increasing length;</li><li>the cells a try uses are already final;</li><li>currentCost = m[i,k] + m[k+1,j] + p·p·p, and the caption has the same numbers;</li><li>minCost equals the current cell;</li><li>"new minimum" frames strictly improve and set s;</li><li>highlights are in range</li></ul> | 1,000 |
| Default example: m = 9375, ((M1 × (M2 × M3)) × M4) | unit |
| Parsing: lists of positive integers round-trip with any spacing and a trailing comma; `35.7`, `1e3`, `15abc`, `0`, `-3` and text are rejected; `validateMatrixCount` accepts exactly the integers 2..10 | 300 + 300 + unit |

All 5 tests pass in about 3.5 s. `tsc` (strict) is clean.

## Not verifiable / limitations
- Costs above 2^53 (dimensions above about 2×10^5) are shown inexactly because they are plain JS numbers. In 80,000 large-dimension runs this
  never changed the chosen parenthesisation, but the displayed m values can be rounded. No upper bound on dimensions was added.
- Animation and layout are not tested.
