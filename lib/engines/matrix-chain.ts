// Step generator for the Matrix Chain Multiplication visualizer (bottom-up DP, CLRS MATRIX-CHAIN-ORDER).
// Pure function: given the dimension vector p[0..n] (matrix Mi is p[i-1] x p[i]), returns every frame.
// Indices in frames are 0-based (matrix M(i+1) is index i); m and s are n x n tables.

export type MatrixChainStep = {
  phase: "init" | "compute" | "backtrack" | "complete"
  description: string
  i?: number
  j?: number
  k?: number
  currentCost?: number
  minCost?: number
  bestK?: number
  costMatrix?: number[][]
  splitMatrix?: number[][]
  highlightCells?: { i: number; j: number }[]
  parenthesization?: string
}

export const MAX_MATRICES = 10

const copy = (t: number[][]) => t.map((row) => [...row])

/** Optimal parenthesisation string for M(i+1)..M(j+1) read from the split table. */
export function printOptimalParens(s: number[][], i: number, j: number): string {
  if (i === j) return `M${i + 1}`
  return `(${printOptimalParens(s, i, s[i][j])} × ${printOptimalParens(s, s[i][j] + 1, j)})`
}

export function generateMatrixChainSteps(dimensions: number[]): MatrixChainStep[] {
  const n = dimensions.length - 1
  if (n < 1 || !dimensions.every((d) => Number.isInteger(d) && d > 0)) {
    throw new Error("dimensions must be at least two positive integers")
  }
  const p = dimensions
  const steps: MatrixChainStep[] = []
  const m: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0))
  const s: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0))

  steps.push({
    phase: "init",
    description: "Initialize the cost matrix with zeros on the diagonal (cost of multiplying a single matrix is 0)",
    costMatrix: copy(m),
    splitMatrix: copy(s),
  })

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1
      m[i][j] = Number.POSITIVE_INFINITY

      steps.push({
        phase: "compute",
        description: `Computing optimal cost for multiplying matrices ${i + 1} to ${j + 1}`,
        i,
        j,
        costMatrix: copy(m),
        splitMatrix: copy(s),
        highlightCells: [{ i, j }],
      })

      for (let k = i; k < j; k++) {
        const cost = m[i][k] + m[k + 1][j] + p[i] * p[k + 1] * p[j + 1]

        steps.push({
          phase: "compute",
          description: `Trying split at matrix ${k + 1}: Cost = m[${i + 1},${k + 1}] + m[${k + 2},${j + 1}] + ${p[i]} × ${p[k + 1]} × ${p[j + 1]}`,
          i,
          j,
          k,
          currentCost: cost,
          minCost: m[i][j],
          costMatrix: copy(m),
          splitMatrix: copy(s),
          highlightCells: [
            { i, j },
            { i, j: k },
            { i: k + 1, j },
          ],
        })

        if (cost < m[i][j]) {
          m[i][j] = cost
          s[i][j] = k

          steps.push({
            phase: "compute",
            description: `New minimum cost found: ${cost} with split at matrix ${k + 1}`,
            i,
            j,
            k,
            currentCost: cost,
            minCost: cost,
            bestK: k,
            costMatrix: copy(m),
            splitMatrix: copy(s),
            highlightCells: [{ i, j }],
          })
        }
      }
    }
  }

  steps.push({
    phase: "compute",
    description: `Dynamic programming table completed. The minimum cost of multiplying the entire chain is ${m[0][n - 1]}`,
    costMatrix: copy(m),
    splitMatrix: copy(s),
  })

  const parenthesization = printOptimalParens(s, 0, n - 1)

  steps.push({
    phase: "backtrack",
    description: "Backtracking to find the optimal parenthesization",
    costMatrix: copy(m),
    splitMatrix: copy(s),
  })

  steps.push({
    phase: "complete",
    description: `The optimal parenthesization is: ${parenthesization}`,
    costMatrix: copy(m),
    splitMatrix: copy(s),
    parenthesization,
  })

  return steps
}

/**
 * Parses the comma-separated dimension list. Every entry must be a positive whole number written in
 * plain digits; "35.7", "1e3" or "15abc" are rejected instead of being silently read as 35, 1 or 15.
 */
export function parseDimensions(text: string): number[] {
  const parts = text
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d !== "")
  return parts.map((d) => {
    if (!/^\d+$/.test(d) || Number(d) <= 0 || !Number.isSafeInteger(Number(d))) {
      throw new Error("All dimensions must be positive integers")
    }
    return Number(d)
  })
}

/** The "Number of Matrices" field must be a whole number in 2..MAX_MATRICES. */
export function validateMatrixCount(n: number): string | null {
  if (!Number.isInteger(n)) return "The number of matrices must be a whole number"
  if (n < 2) return "Please specify at least 2 matrices"
  if (n > MAX_MATRICES) return `Please specify ${MAX_MATRICES} or fewer matrices for better visualization`
  return null
}
