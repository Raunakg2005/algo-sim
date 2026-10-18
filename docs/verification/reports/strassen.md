# Strassen Matrix Multiplication (`strassen`)

## What it visualizes
`components/strassen-matrix-multiplication.tsx` shows one level of Strassen's algorithm for C = A·B:
- split A and B into quadrants;
- form S1..S10 (10 block additions/subtractions);
- form the seven products P1..P7 (Strassen's M1..M7: P1 = (A11+A22)(B11+B22), P2 = (A21+A22)B11, P3 = A11(B12−B22),
  P4 = A22(B21−B11), P5 = (A11+A12)B22, P6 = (A21−A11)(B11+B12), P7 = (A12−A22)(B21+B22));
- combine C11 = P1+P4−P5+P7, C12 = P3+P5, C21 = P2+P4, C22 = P1+P3−P2+P6 (8 more additions/subtractions).

That is 7 block multiplications and 18 block additions/subtractions, as in the paper. **The seven half-size products are computed with the
ordinary row-by-column product, not by recursing.** The visualizer shows a single level of the recursion. 21 frames:
initial, divide, 14 compute (one "form S" and one "form P" frame per product), 4 combine, result.

## UI input limits
- **Size:** 2×2, 4×4 or 8×8 (buttons only). Odd and non-power-of-two sizes cannot be chosen, so padding never happens in the UI.
- **Random/new matrices:** entries are integers 1..9. The default example is A = 1..16, B = 17..32 (4×4).
- **Custom input:** `size` lines of `size` numbers. Any value `Number()` accepts was allowed (negatives, decimals, `1e3`, `0x10`, and in the
  original also `Infinity` and empty cells, see below).

## Engine API (pure) - `lib/engines/strassen.ts`
- `generateStrassenSteps(A, B) => StrassenStep[]`: same frame shape as before. `highlightedMatrices` now holds `subMatrices` keys. For any
  n, an odd n is padded with one zero row/column and the result is trimmed back to n×n. Throws on non-square, mismatched or non-finite input.
- `parseMatrixInput(text, size) => Matrix | null`: the custom-input parser.

The component now only calls `setSteps(generateStrassenSteps(matrixA, matrixB))` and `parseMatrixInput`. All matrix helpers and the
500-line step builder were removed from it. The highlight test in the two renderers now compares the `subMatrices` key.

## Legacy check (original HEAD code)
The harness is `legacy\strassen\legacy.ts`: the `useEffect` body, the helpers and `parseMatrixInput`, copied verbatim. The check is
`check.ts` and its output is `results.txt`. Runs: 2,000 per size (2/4/8) for the UI generator (1..9), plus 2,000 per size for custom integers
in −50..50, plus the default example, for a total of 12,001. There were also 6,000 decimal runs.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| **S1..S10 are never highlighted.** `highlightedMatrices` lists `"S1"`, but the renderer compares it with the display name `"S1 = A11 + A22"` | 12,001 / 12,001 runs; 14 of the 21 frames in every run (all compute frames) | any input, frame 3 "Compute P1": highlights `["S1","S2"]`, while the names shown are `"S1 = A11 + A22"` and `"S2 = B11 + B22"` |
| The "Compute C11" and "Compute C22" frames do not show the block they compute. C12 and C21 do | 12,001 / 12,001 | any input |
| Custom-input parser reads an empty cell as 0 | by construction | size 2, `",1\n2 3"` → `[[0,1],[2,3]]`; `"1,\n2 3"` → `[[1,0],[2,3]]` |
| Custom-input parser accepts `Infinity` / `1e400`, and the result frame then shows NaN cells | by construction | `"Infinity 1\n1 1"` × all-ones → C = [[NaN, NaN], [2, NaN]] (the naive product gives [[∞,∞],[2,2]]) |
| Tab-separated rows are rejected | by construction | `"1\t2\n3 4"` → error |

**Correctness of the product:** 0 / 12,001 integer runs gave a result different from the naive product. P1..P7 matched independently
computed M1..M7 in every run, and the operation count was 7 multiplications and 18 additions/subtractions in every run.

**Decimal custom input (not a defect):** in 5,945 / 6,000 decimal runs the result differs bitwise from the naive product, by at most
1.9e-13. Strassen evaluates the sums in a different order, so floating-point rounding differs. The result can show values such as
`-60.970000000000006`. This display was left unchanged.

## Fixes
1. Highlights are keyed by `subMatrices` key. The renderers use `Object.entries` and test the key, so every S-matrix is now highlighted.
2. The C11 and C22 combine frames show the computed block, and every combine frame highlights its result.
3. Parser: rows are split on `\r?\n`, cells on spaces, tabs or commas. An empty cell or a non-finite value is rejected.
4. Padding for odd n was added to the engine (its own contract; not reachable from the UI). The removed `console.warn` covered only
   non-power-of-two sizes, which one level of the algorithm handles correctly whenever n is even.

## Properties tested - `tests/engines/strassen.test.ts`, oracle `tests/reference/strassen.ts`
The oracles are the naive row-by-column product, quadrant extraction with zero padding, and Strassen's M1..M7 written from the definition.
| Property | numRuns |
|---|---|
| Result frame equals the naive product exactly: UI generator (2/4/8, 1..9), custom integers −1000..1000, and any n = 1..9 (padding) | 3 × 700 |
| Decimal input (2 dp) agrees with the naive product within 1e-9 relative error | 500 |
| P1..P7 frames equal M1..M7; the C11..C22 blocks, in the combine frames and in the result frame, equal the quadrants of AB (any n, padded) | 600 |
| Frames: phase order (1 + 1 + 14 + 4 + 1); divide-phase quadrants are correct; every A/B block shown anywhere equals its quadrant; every "Sx = Y ± Z" caption matches the matrix shown; every highlight key is a displayed matrix; every operand is on screen or produced earlier in the frame | 500 |
| Exactly 7 multiplications and 18 additions/subtractions | 200 |
| Parser: exact round trip with mixed separators and CRLF line endings; wrong size rejected; empty cell, `Infinity`, `1e400` and text rejected | 300 + unit |
| Default example: C = [[250,260,270,280], …, [1354,1412,1470,1528]] | unit |

All 7 tests pass in about 4 s. `tsc` (strict) is clean on all touched files.

## Not verifiable / out of scope
- Animation timing and layout (framer-motion) are not tested.
- `app/simulate/[id]/page.tsx` (not editable in this task) shows a "Strassen's Implementation" code panel that uses CLRS-style numbering
  (P1 = A11(B12−B22), …). It elides five products and has a combine step commented "this is an example and may need adjustment". It does
  not match the visualizer's numbering, and its combine formulas cannot be checked against it. **This should be fixed in the page.**
