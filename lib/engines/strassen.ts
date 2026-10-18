// Step generator for the Strassen Matrix Multiplication visualizer.
// Pure functions: given A and B (n x n), returns every frame the visualizer plays.
// One level of Strassen's recursion is shown: the seven products P1..P7 of the half-size blocks are
// formed with the ordinary row-by-column product, and the four C blocks are combined from them.
// That is 7 block multiplications and 18 block additions/subtractions (10 for S1..S10, 8 to form C).
// Odd n is padded with one zero row/column (the UI only offers 2, 4 and 8, so this never shows there).

export type Matrix = number[][]

export type SubMatrix = {
  name: string
  matrix: Matrix
  row: number
  col: number
}

export type StrassenOperation = {
  type: "add" | "subtract" | "multiply"
  operands: string[]
  result: string
}

// highlightedMatrices holds keys of subMatrices (e.g. "S1"), not display names ("S1 = A11 + A22")
export type StrassenStep = {
  phase: "initial" | "divide" | "compute" | "combine" | "result"
  description: string
  matrices?: { [key: string]: Matrix }
  subMatrices?: { [key: string]: SubMatrix }
  operations?: StrassenOperation[]
  highlightedMatrices?: string[]
  resultMatrix?: Matrix
}

const add = (A: Matrix, B: Matrix): Matrix => A.map((row, i) => row.map((v, j) => v + B[i][j]))
const subtract = (A: Matrix, B: Matrix): Matrix => A.map((row, i) => row.map((v, j) => v - B[i][j]))

const multiply = (A: Matrix, B: Matrix): Matrix => {
  const n = A.length
  const result: Matrix = []
  for (let i = 0; i < n; i++) {
    result[i] = []
    for (let j = 0; j < n; j++) {
      let s = 0
      for (let k = 0; k < n; k++) s += A[i][k] * B[k][j]
      result[i][j] = s
    }
  }
  return result
}

const block = (M: Matrix, r0: number, c0: number, size: number): Matrix =>
  M.slice(r0, r0 + size).map((row) => row.slice(c0, c0 + size))

const combine = (C11: Matrix, C12: Matrix, C21: Matrix, C22: Matrix): Matrix => [
  ...C11.map((row, i) => [...row, ...C12[i]]),
  ...C21.map((row, i) => [...row, ...C22[i]]),
]

const pad = (M: Matrix, size: number): Matrix =>
  Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => (i < M.length && j < M.length ? M[i][j] : 0)))

const isSquare = (M: Matrix, n: number) => M.length === n && M.every((row) => row.length === n)

export function generateStrassenSteps(matrixA: Matrix, matrixB: Matrix): StrassenStep[] {
  const n = matrixA.length
  if (n === 0 || !isSquare(matrixA, n) || !isSquare(matrixB, n)) {
    throw new Error("A and B must be non-empty square matrices of the same size")
  }
  if (![...matrixA, ...matrixB].every((row) => row.every((v) => Number.isFinite(v)))) {
    throw new Error("Matrix entries must be finite numbers")
  }

  const size = n % 2 === 0 ? n : n + 1
  const A = size === n ? matrixA : pad(matrixA, size)
  const B = size === n ? matrixB : pad(matrixB, size)
  const h = size / 2
  const steps: StrassenStep[] = []
  const sub = (name: string, matrix: Matrix, row: number, col: number): SubMatrix => ({ name, matrix, row, col })

  steps.push({
    phase: "initial",
    description: "We start with two matrices A and B that we want to multiply.",
    matrices: { A: matrixA, B: matrixB },
  })

  const A11 = block(A, 0, 0, h), A12 = block(A, 0, h, h), A21 = block(A, h, 0, h), A22 = block(A, h, h, h)
  const B11 = block(B, 0, 0, h), B12 = block(B, 0, h, h), B21 = block(B, h, 0, h), B22 = block(B, h, h, h)

  steps.push({
    phase: "divide",
    description:
      size === n
        ? "Divide each matrix into four equal submatrices (quadrants)."
        : `Pad A and B with a zero row and column to ${size}×${size}, then divide each into four equal submatrices (quadrants).`,
    matrices: { A, B },
    subMatrices: {
      A11: sub("A11", A11, 0, 0), A12: sub("A12", A12, 0, 1), A21: sub("A21", A21, 1, 0), A22: sub("A22", A22, 1, 1),
      B11: sub("B11", B11, 0, 0), B12: sub("B12", B12, 0, 1), B21: sub("B21", B21, 1, 0), B22: sub("B22", B22, 1, 1),
    },
  })

  // P1 = (A11 + A22)(B11 + B22)
  const S1 = add(A11, A22)
  const S2 = add(B11, B22)
  steps.push({
    phase: "compute",
    description: "Compute P1 = (A11 + A22) * (B11 + B22)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: {
      A11: sub("A11", A11, 0, 0), A22: sub("A22", A22, 1, 1), B11: sub("B11", B11, 0, 0), B22: sub("B22", B22, 1, 1),
      S1: sub("S1 = A11 + A22", S1, 0, 2), S2: sub("S2 = B11 + B22", S2, 1, 2),
    },
    operations: [
      { type: "add", operands: ["A11", "A22"], result: "S1" },
      { type: "add", operands: ["B11", "B22"], result: "S2" },
    ],
    highlightedMatrices: ["A11", "A22", "B11", "B22", "S1", "S2"],
  })
  const P1 = multiply(S1, S2)
  steps.push({
    phase: "compute",
    description: "P1 = S1 * S2 = (A11 + A22) * (B11 + B22)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: { S1: sub("S1 = A11 + A22", S1, 0, 0), S2: sub("S2 = B11 + B22", S2, 0, 1), P1: sub("P1", P1, 0, 2) },
    operations: [{ type: "multiply", operands: ["S1", "S2"], result: "P1" }],
    highlightedMatrices: ["S1", "S2", "P1"],
  })

  // P2 = (A21 + A22) B11
  const S3 = add(A21, A22)
  steps.push({
    phase: "compute",
    description: "Compute P2 = (A21 + A22) * B11",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: {
      A21: sub("A21", A21, 0, 0), A22: sub("A22", A22, 1, 0), B11: sub("B11", B11, 0, 1), S3: sub("S3 = A21 + A22", S3, 0, 2),
    },
    operations: [{ type: "add", operands: ["A21", "A22"], result: "S3" }],
    highlightedMatrices: ["A21", "A22", "B11", "S3"],
  })
  const P2 = multiply(S3, B11)
  steps.push({
    phase: "compute",
    description: "P2 = S3 * B11 = (A21 + A22) * B11",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: { S3: sub("S3 = A21 + A22", S3, 0, 0), B11: sub("B11", B11, 0, 1), P2: sub("P2", P2, 0, 2) },
    operations: [{ type: "multiply", operands: ["S3", "B11"], result: "P2" }],
    highlightedMatrices: ["S3", "B11", "P2"],
  })

  // P3 = A11 (B12 - B22)
  const S4 = subtract(B12, B22)
  steps.push({
    phase: "compute",
    description: "Compute P3 = A11 * (B12 - B22)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: {
      A11: sub("A11", A11, 0, 0), B12: sub("B12", B12, 0, 1), B22: sub("B22", B22, 1, 1), S4: sub("S4 = B12 - B22", S4, 0, 2),
    },
    operations: [{ type: "subtract", operands: ["B12", "B22"], result: "S4" }],
    highlightedMatrices: ["A11", "B12", "B22", "S4"],
  })
  const P3 = multiply(A11, S4)
  steps.push({
    phase: "compute",
    description: "P3 = A11 * S4 = A11 * (B12 - B22)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: { A11: sub("A11", A11, 0, 0), S4: sub("S4 = B12 - B22", S4, 0, 1), P3: sub("P3", P3, 0, 2) },
    operations: [{ type: "multiply", operands: ["A11", "S4"], result: "P3" }],
    highlightedMatrices: ["A11", "S4", "P3"],
  })

  // P4 = A22 (B21 - B11)
  const S5 = subtract(B21, B11)
  steps.push({
    phase: "compute",
    description: "Compute P4 = A22 * (B21 - B11)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: {
      A22: sub("A22", A22, 0, 0), B21: sub("B21", B21, 0, 1), B11: sub("B11", B11, 1, 1), S5: sub("S5 = B21 - B11", S5, 0, 2),
    },
    operations: [{ type: "subtract", operands: ["B21", "B11"], result: "S5" }],
    highlightedMatrices: ["A22", "B21", "B11", "S5"],
  })
  const P4 = multiply(A22, S5)
  steps.push({
    phase: "compute",
    description: "P4 = A22 * S5 = A22 * (B21 - B11)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: { A22: sub("A22", A22, 0, 0), S5: sub("S5 = B21 - B11", S5, 0, 1), P4: sub("P4", P4, 0, 2) },
    operations: [{ type: "multiply", operands: ["A22", "S5"], result: "P4" }],
    highlightedMatrices: ["A22", "S5", "P4"],
  })

  // P5 = (A11 + A12) B22
  const S6 = add(A11, A12)
  steps.push({
    phase: "compute",
    description: "Compute P5 = (A11 + A12) * B22",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: {
      A11: sub("A11", A11, 0, 0), A12: sub("A12", A12, 1, 0), B22: sub("B22", B22, 0, 1), S6: sub("S6 = A11 + A12", S6, 0, 2),
    },
    operations: [{ type: "add", operands: ["A11", "A12"], result: "S6" }],
    highlightedMatrices: ["A11", "A12", "B22", "S6"],
  })
  const P5 = multiply(S6, B22)
  steps.push({
    phase: "compute",
    description: "P5 = S6 * B22 = (A11 + A12) * B22",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: { S6: sub("S6 = A11 + A12", S6, 0, 0), B22: sub("B22", B22, 0, 1), P5: sub("P5", P5, 0, 2) },
    operations: [{ type: "multiply", operands: ["S6", "B22"], result: "P5" }],
    highlightedMatrices: ["S6", "B22", "P5"],
  })

  // P6 = (A21 - A11)(B11 + B12)
  const S7 = subtract(A21, A11)
  const S8 = add(B11, B12)
  steps.push({
    phase: "compute",
    description: "Compute P6 = (A21 - A11) * (B11 + B12)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: {
      A21: sub("A21", A21, 0, 0), A11: sub("A11", A11, 1, 0), B11: sub("B11", B11, 0, 1), B12: sub("B12", B12, 1, 1),
      S7: sub("S7 = A21 - A11", S7, 0, 2), S8: sub("S8 = B11 + B12", S8, 1, 2),
    },
    operations: [
      { type: "subtract", operands: ["A21", "A11"], result: "S7" },
      { type: "add", operands: ["B11", "B12"], result: "S8" },
    ],
    highlightedMatrices: ["A21", "A11", "B11", "B12", "S7", "S8"],
  })
  const P6 = multiply(S7, S8)
  steps.push({
    phase: "compute",
    description: "P6 = S7 * S8 = (A21 - A11) * (B11 + B12)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: { S7: sub("S7 = A21 - A11", S7, 0, 0), S8: sub("S8 = B11 + B12", S8, 0, 1), P6: sub("P6", P6, 0, 2) },
    operations: [{ type: "multiply", operands: ["S7", "S8"], result: "P6" }],
    highlightedMatrices: ["S7", "S8", "P6"],
  })

  // P7 = (A12 - A22)(B21 + B22)
  const S9 = subtract(A12, A22)
  const S10 = add(B21, B22)
  steps.push({
    phase: "compute",
    description: "Compute P7 = (A12 - A22) * (B21 + B22)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: {
      A12: sub("A12", A12, 0, 0), A22: sub("A22", A22, 1, 0), B21: sub("B21", B21, 0, 1), B22: sub("B22", B22, 1, 1),
      S9: sub("S9 = A12 - A22", S9, 0, 2), S10: sub("S10 = B21 + B22", S10, 1, 2),
    },
    operations: [
      { type: "subtract", operands: ["A12", "A22"], result: "S9" },
      { type: "add", operands: ["B21", "B22"], result: "S10" },
    ],
    highlightedMatrices: ["A12", "A22", "B21", "B22", "S9", "S10"],
  })
  const P7 = multiply(S9, S10)
  steps.push({
    phase: "compute",
    description: "P7 = S9 * S10 = (A12 - A22) * (B21 + B22)",
    matrices: { A: matrixA, B: matrixB },
    subMatrices: { S9: sub("S9 = A12 - A22", S9, 0, 0), S10: sub("S10 = B21 + B22", S10, 0, 1), P7: sub("P7", P7, 0, 2) },
    operations: [{ type: "multiply", operands: ["S9", "S10"], result: "P7" }],
    highlightedMatrices: ["S9", "S10", "P7"],
  })

  // combine
  const C11 = add(subtract(add(P1, P4), P5), P7)
  steps.push({
    phase: "combine",
    description: "Compute C11 = P1 + P4 - P5 + P7",
    subMatrices: {
      P1: sub("P1", P1, 0, 0), P4: sub("P4", P4, 0, 1), P5: sub("P5", P5, 1, 0), P7: sub("P7", P7, 1, 1), C11: sub("C11", C11, 0, 2),
    },
    operations: [
      { type: "add", operands: ["P1", "P4"], result: "temp1" },
      { type: "subtract", operands: ["temp1", "P5"], result: "temp2" },
      { type: "add", operands: ["temp2", "P7"], result: "C11" },
    ],
    highlightedMatrices: ["P1", "P4", "P5", "P7", "C11"],
  })

  const C12 = add(P3, P5)
  steps.push({
    phase: "combine",
    description: "Compute C12 = P3 + P5",
    subMatrices: { P3: sub("P3", P3, 0, 0), P5: sub("P5", P5, 0, 1), C12: sub("C12", C12, 0, 2) },
    operations: [{ type: "add", operands: ["P3", "P5"], result: "C12" }],
    highlightedMatrices: ["P3", "P5", "C12"],
  })

  const C21 = add(P2, P4)
  steps.push({
    phase: "combine",
    description: "Compute C21 = P2 + P4",
    subMatrices: { P2: sub("P2", P2, 0, 0), P4: sub("P4", P4, 0, 1), C21: sub("C21", C21, 0, 2) },
    operations: [{ type: "add", operands: ["P2", "P4"], result: "C21" }],
    highlightedMatrices: ["P2", "P4", "C21"],
  })

  const C22 = add(subtract(add(P1, P3), P2), P6)
  steps.push({
    phase: "combine",
    description: "Compute C22 = P1 + P3 - P2 + P6",
    subMatrices: {
      P1: sub("P1", P1, 0, 0), P3: sub("P3", P3, 0, 1), P2: sub("P2", P2, 1, 0), P6: sub("P6", P6, 1, 1), C22: sub("C22", C22, 0, 2),
    },
    operations: [
      { type: "add", operands: ["P1", "P3"], result: "temp3" },
      { type: "subtract", operands: ["temp3", "P2"], result: "temp4" },
      { type: "add", operands: ["temp4", "P6"], result: "C22" },
    ],
    highlightedMatrices: ["P1", "P3", "P2", "P6", "C22"],
  })

  const full = combine(C11, C12, C21, C22)
  steps.push({
    phase: "result",
    description:
      size === n
        ? "Combine the four quadrants to form the final result matrix C = A × B"
        : "Combine the four quadrants and drop the padding row and column to obtain C = A × B",
    subMatrices: { C11: sub("C11", C11, 0, 0), C12: sub("C12", C12, 0, 1), C21: sub("C21", C21, 1, 0), C22: sub("C22", C22, 1, 1) },
    resultMatrix: block(full, 0, 0, n),
  })

  return steps
}

// Parses the "Custom Input" text: `size` lines of `size` numbers separated by spaces, tabs or commas.
// Returns null if the text is not exactly a size x size matrix of finite numbers.
export function parseMatrixInput(input: string, size: number): Matrix | null {
  const rows = input.trim().split(/\r?\n/)
  if (rows.length !== size) return null
  const matrix: Matrix = []
  for (const row of rows) {
    const tokens = row.trim().split(/[\s,]+/)
    if (tokens.length !== size) return null
    const values: number[] = []
    for (const t of tokens) {
      const v = Number(t)
      if (t === "" || !Number.isFinite(v)) return null
      values.push(v)
    }
    matrix.push(values)
  }
  return matrix
}
