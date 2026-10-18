// Legacy harness: verbatim copy of the original Strassen step builder (useEffect body) and parser.
type Matrix = number[][]
type SubMatrix = { name: string; matrix: Matrix; row: number; col: number }
type Operation = { type: "add" | "subtract" | "multiply"; operands: string[]; result: string }
type AlgorithmStep = { phase: "initial" | "divide" | "compute" | "combine" | "result"; description: string; matrices?: { [key: string]: Matrix }; subMatrices?: { [key: string]: SubMatrix }; operations?: Operation[]; highlightedMatrices?: string[]; resultMatrix?: Matrix }
const parseMatrixInput = (input: string, size: number): Matrix | null => {
    try {
      const rows = input.trim().split("\n")

      if (rows.length !== size) {
        throw new Error(`Matrix must have ${size} rows`)
      }

      const matrix: Matrix = []

      for (const row of rows) {
        const values = row.trim().split(/[ ,]+/)

        if (values.length !== size) {
          throw new Error(`Each row must have ${size} columns`)
        }

        const numericRow: number[] = []

        for (const value of values) {
          const num = Number(value)
          if (isNaN(num)) {
            throw new Error(`"${value}" is not a valid number`)
          }
          numericRow.push(num)
        }

        matrix.push(numericRow)
      }

      return matrix
    } catch (error) {
      return null
    }
  }
  const addMatrices = (A: Matrix, B: Matrix): Matrix => {
    const n = A.length
    const result: Matrix = []

    for (let i = 0; i < n; i++) {
      result[i] = []
      for (let j = 0; j < n; j++) {
        result[i][j] = A[i][j] + B[i][j]
      }
    }

    return result
  }

  const subtractMatrices = (A: Matrix, B: Matrix): Matrix => {
    const n = A.length
    const result: Matrix = []

    for (let i = 0; i < n; i++) {
      result[i] = []
      for (let j = 0; j < n; j++) {
        result[i][j] = A[i][j] - B[i][j]
      }
    }

    return result
  }

  const getSubMatrix = (matrix: Matrix, rowStart: number, colStart: number, size: number): Matrix => {
    const subMatrix: Matrix = []

    for (let i = 0; i < size; i++) {
      subMatrix[i] = []
      for (let j = 0; j < size; j++) {
        subMatrix[i][j] = matrix[rowStart + i][colStart + j]
      }
    }

    return subMatrix
  }

  const combineSubMatrices = (C11: Matrix, C12: Matrix, C21: Matrix, C22: Matrix): Matrix => {
    const n = C11.length
    const result: Matrix = []

    for (let i = 0; i < n * 2; i++) {
      result[i] = []
      for (let j = 0; j < n * 2; j++) {
        if (i < n && j < n) {
          result[i][j] = C11[i][j]
        } else if (i < n && j >= n) {
          result[i][j] = C12[i][j - n]
        } else if (i >= n && j < n) {
          result[i][j] = C21[i - n][j]
        } else {
          result[i][j] = C22[i - n][j - n]
        }
      }
    }

    return result
  }

  const standardMultiply = (A: Matrix, B: Matrix): Matrix => {
    const n = A.length
    const result: Matrix = []

    for (let i = 0; i < n; i++) {
      result[i] = []
      for (let j = 0; j < n; j++) {
        result[i][j] = 0
        for (let k = 0; k < n; k++) {
          result[i][j] += A[i][k] * B[k][j]
        }
      }
    }

    return result
  }
export function legacySteps(matrixA: Matrix, matrixB: Matrix): AlgorithmStep[] {
  const setSteps = (s: AlgorithmStep[]) => { out = s }; let out: AlgorithmStep[] = []
    if (matrixA.length === 0 || matrixB.length === 0 || matrixA.length !== matrixB.length) {
      return out
    }

    const n = matrixA.length
    if ((n & (n - 1)) !== 0) {
      console.warn("Matrix size is not a power of 2, visualization may not be accurate")
    }

    const algorithmSteps: AlgorithmStep[] = []

    algorithmSteps.push({
      phase: "initial",
      description: "We start with two matrices A and B that we want to multiply.",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
    })

    const halfSize = n / 2

    const A11 = getSubMatrix(matrixA, 0, 0, halfSize)
    const A12 = getSubMatrix(matrixA, 0, halfSize, halfSize)
    const A21 = getSubMatrix(matrixA, halfSize, 0, halfSize)
    const A22 = getSubMatrix(matrixA, halfSize, halfSize, halfSize)

    const B11 = getSubMatrix(matrixB, 0, 0, halfSize)
    const B12 = getSubMatrix(matrixB, 0, halfSize, halfSize)
    const B21 = getSubMatrix(matrixB, halfSize, 0, halfSize)
    const B22 = getSubMatrix(matrixB, halfSize, halfSize, halfSize)

    algorithmSteps.push({
      phase: "divide",
      description: "Divide each matrix into four equal submatrices (quadrants).",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A11: { name: "A11", matrix: A11, row: 0, col: 0 },
        A12: { name: "A12", matrix: A12, row: 0, col: 1 },
        A21: { name: "A21", matrix: A21, row: 1, col: 0 },
        A22: { name: "A22", matrix: A22, row: 1, col: 1 },
        B11: { name: "B11", matrix: B11, row: 0, col: 0 },
        B12: { name: "B12", matrix: B12, row: 0, col: 1 },
        B21: { name: "B21", matrix: B21, row: 1, col: 0 },
        B22: { name: "B22", matrix: B22, row: 1, col: 1 },
      },
    })


    const S1 = addMatrices(A11, A22)
    const S2 = addMatrices(B11, B22)

    algorithmSteps.push({
      phase: "compute",
      description: "Compute P1 = (A11 + A22) * (B11 + B22)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A11: { name: "A11", matrix: A11, row: 0, col: 0 },
        A22: { name: "A22", matrix: A22, row: 1, col: 1 },
        B11: { name: "B11", matrix: B11, row: 0, col: 0 },
        B22: { name: "B22", matrix: B22, row: 1, col: 1 },
        S1: { name: "S1 = A11 + A22", matrix: S1, row: 0, col: 2 },
        S2: { name: "S2 = B11 + B22", matrix: S2, row: 1, col: 2 },
      },
      operations: [
        { type: "add", operands: ["A11", "A22"], result: "S1" },
        { type: "add", operands: ["B11", "B22"], result: "S2" },
      ],
      highlightedMatrices: ["A11", "A22", "B11", "B22", "S1", "S2"],
    })

    const P1 = standardMultiply(S1, S2)

    algorithmSteps.push({
      phase: "compute",
      description: "P1 = S1 * S2 = (A11 + A22) * (B11 + B22)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        S1: { name: "S1 = A11 + A22", matrix: S1, row: 0, col: 0 },
        S2: { name: "S2 = B11 + B22", matrix: S2, row: 0, col: 1 },
        P1: { name: "P1", matrix: P1, row: 0, col: 2 },
      },
      operations: [{ type: "multiply", operands: ["S1", "S2"], result: "P1" }],
      highlightedMatrices: ["S1", "S2", "P1"],
    })

    const S3 = addMatrices(A21, A22)

    algorithmSteps.push({
      phase: "compute",
      description: "Compute P2 = (A21 + A22) * B11",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A21: { name: "A21", matrix: A21, row: 0, col: 0 },
        A22: { name: "A22", matrix: A22, row: 1, col: 0 },
        B11: { name: "B11", matrix: B11, row: 0, col: 1 },
        S3: { name: "S3 = A21 + A22", matrix: S3, row: 0, col: 2 },
      },
      operations: [{ type: "add", operands: ["A21", "A22"], result: "S3" }],
      highlightedMatrices: ["A21", "A22", "B11", "S3"],
    })

    const P2 = standardMultiply(S3, B11)

    algorithmSteps.push({
      phase: "compute",
      description: "P2 = S3 * B11 = (A21 + A22) * B11",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        S3: { name: "S3 = A21 + A22", matrix: S3, row: 0, col: 0 },
        B11: { name: "B11", matrix: B11, row: 0, col: 1 },
        P2: { name: "P2", matrix: P2, row: 0, col: 2 },
      },
      operations: [{ type: "multiply", operands: ["S3", "B11"], result: "P2" }],
      highlightedMatrices: ["S3", "B11", "P2"],
    })

    const S4 = subtractMatrices(B12, B22)

    algorithmSteps.push({
      phase: "compute",
      description: "Compute P3 = A11 * (B12 - B22)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A11: { name: "A11", matrix: A11, row: 0, col: 0 },
        B12: { name: "B12", matrix: B12, row: 0, col: 1 },
        B22: { name: "B22", matrix: B22, row: 1, col: 1 },
        S4: { name: "S4 = B12 - B22", matrix: S4, row: 0, col: 2 },
      },
      operations: [{ type: "subtract", operands: ["B12", "B22"], result: "S4" }],
      highlightedMatrices: ["A11", "B12", "B22", "S4"],
    })

    const P3 = standardMultiply(A11, S4)

    algorithmSteps.push({
      phase: "compute",
      description: "P3 = A11 * S4 = A11 * (B12 - B22)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A11: { name: "A11", matrix: A11, row: 0, col: 0 },
        S4: { name: "S4 = B12 - B22", matrix: S4, row: 0, col: 1 },
        P3: { name: "P3", matrix: P3, row: 0, col: 2 },
      },
      operations: [{ type: "multiply", operands: ["A11", "S4"], result: "P3" }],
      highlightedMatrices: ["A11", "S4", "P3"],
    })

    const S5 = subtractMatrices(B21, B11)

    algorithmSteps.push({
      phase: "compute",
      description: "Compute P4 = A22 * (B21 - B11)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A22: { name: "A22", matrix: A22, row: 0, col: 0 },
        B21: { name: "B21", matrix: B21, row: 0, col: 1 },
        B11: { name: "B11", matrix: B11, row: 1, col: 1 },
        S5: { name: "S5 = B21 - B11", matrix: S5, row: 0, col: 2 },
      },
      operations: [{ type: "subtract", operands: ["B21", "B11"], result: "S5" }],
      highlightedMatrices: ["A22", "B21", "B11", "S5"],
    })

    const P4 = standardMultiply(A22, S5)

    algorithmSteps.push({
      phase: "compute",
      description: "P4 = A22 * S5 = A22 * (B21 - B11)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A22: { name: "A22", matrix: A22, row: 0, col: 0 },
        S5: { name: "S5 = B21 - B11", matrix: S5, row: 0, col: 1 },
        P4: { name: "P4", matrix: P4, row: 0, col: 2 },
      },
      operations: [{ type: "multiply", operands: ["A22", "S5"], result: "P4" }],
      highlightedMatrices: ["A22", "S5", "P4"],
    })

    const S6 = addMatrices(A11, A12)

    algorithmSteps.push({
      phase: "compute",
      description: "Compute P5 = (A11 + A12) * B22",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A11: { name: "A11", matrix: A11, row: 0, col: 0 },
        A12: { name: "A12", matrix: A12, row: 1, col: 0 },
        B22: { name: "B22", matrix: B22, row: 0, col: 1 },
        S6: { name: "S6 = A11 + A12", matrix: S6, row: 0, col: 2 },
      },
      operations: [{ type: "add", operands: ["A11", "A12"], result: "S6" }],
      highlightedMatrices: ["A11", "A12", "B22", "S6"],
    })

    const P5 = standardMultiply(S6, B22)

    algorithmSteps.push({
      phase: "compute",
      description: "P5 = S6 * B22 = (A11 + A12) * B22",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        S6: { name: "S6 = A11 + A12", matrix: S6, row: 0, col: 0 },
        B22: { name: "B22", matrix: B22, row: 0, col: 1 },
        P5: { name: "P5", matrix: P5, row: 0, col: 2 },
      },
      operations: [{ type: "multiply", operands: ["S6", "B22"], result: "P5" }],
      highlightedMatrices: ["S6", "B22", "P5"],
    })

    const S7 = subtractMatrices(A21, A11)
    const S8 = addMatrices(B11, B12)

    algorithmSteps.push({
      phase: "compute",
      description: "Compute P6 = (A21 - A11) * (B11 + B12)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A21: { name: "A21", matrix: A21, row: 0, col: 0 },
        A11: { name: "A11", matrix: A11, row: 1, col: 0 },
        B11: { name: "B11", matrix: B11, row: 0, col: 1 },
        B12: { name: "B12", matrix: B12, row: 1, col: 1 },
        S7: { name: "S7 = A21 - A11", matrix: S7, row: 0, col: 2 },
        S8: { name: "S8 = B11 + B12", matrix: S8, row: 1, col: 2 },
      },
      operations: [
        { type: "subtract", operands: ["A21", "A11"], result: "S7" },
        { type: "add", operands: ["B11", "B12"], result: "S8" },
      ],
      highlightedMatrices: ["A21", "A11", "B11", "B12", "S7", "S8"],
    })

    const P6 = standardMultiply(S7, S8)

    algorithmSteps.push({
      phase: "compute",
      description: "P6 = S7 * S8 = (A21 - A11) * (B11 + B12)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        S7: { name: "S7 = A21 - A11", matrix: S7, row: 0, col: 0 },
        S8: { name: "S8 = B11 + B12", matrix: S8, row: 0, col: 1 },
        P6: { name: "P6", matrix: P6, row: 0, col: 2 },
      },
      operations: [{ type: "multiply", operands: ["S7", "S8"], result: "P6" }],
      highlightedMatrices: ["S7", "S8", "P6"],
    })

    const S9 = subtractMatrices(A12, A22)
    const S10 = addMatrices(B21, B22)

    algorithmSteps.push({
      phase: "compute",
      description: "Compute P7 = (A12 - A22) * (B21 + B22)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        A12: { name: "A12", matrix: A12, row: 0, col: 0 },
        A22: { name: "A22", matrix: A22, row: 1, col: 0 },
        B21: { name: "B21", matrix: B21, row: 0, col: 1 },
        B22: { name: "B22", matrix: B22, row: 1, col: 1 },
        S9: { name: "S9 = A12 - A22", matrix: S9, row: 0, col: 2 },
        S10: { name: "S10 = B21 + B22", matrix: S10, row: 1, col: 2 },
      },
      operations: [
        { type: "subtract", operands: ["A12", "A22"], result: "S9" },
        { type: "add", operands: ["B21", "B22"], result: "S10" },
      ],
      highlightedMatrices: ["A12", "A22", "B21", "B22", "S9", "S10"],
    })

    const P7 = standardMultiply(S9, S10)

    algorithmSteps.push({
      phase: "compute",
      description: "P7 = S9 * S10 = (A12 - A22) * (B21 + B22)",
      matrices: {
        A: matrixA,
        B: matrixB,
      },
      subMatrices: {
        S9: { name: "S9 = A12 - A22", matrix: S9, row: 0, col: 0 },
        S10: { name: "S10 = B21 + B22", matrix: S10, row: 0, col: 1 },
        P7: { name: "P7", matrix: P7, row: 0, col: 2 },
      },
      operations: [{ type: "multiply", operands: ["S9", "S10"], result: "P7" }],
      highlightedMatrices: ["S9", "S10", "P7"],
    })


    algorithmSteps.push({
      phase: "combine",
      description: "Compute C11 = P1 + P4 - P5 + P7",
      subMatrices: {
        P1: { name: "P1", matrix: P1, row: 0, col: 0 },
        P4: { name: "P4", matrix: P4, row: 0, col: 1 },
        P5: { name: "P5", matrix: P5, row: 1, col: 0 },
        P7: { name: "P7", matrix: P7, row: 1, col: 1 },
      },
      operations: [
        { type: "add", operands: ["P1", "P4"], result: "temp1" },
        { type: "subtract", operands: ["temp1", "P5"], result: "temp2" },
        { type: "add", operands: ["temp2", "P7"], result: "C11" },
      ],
      highlightedMatrices: ["P1", "P4", "P5", "P7"],
    })

    const temp1 = addMatrices(P1, P4)
    const temp2 = subtractMatrices(temp1, P5)
    const C11 = addMatrices(temp2, P7)

    algorithmSteps.push({
      phase: "combine",
      description: "Compute C12 = P3 + P5",
      subMatrices: {
        P3: { name: "P3", matrix: P3, row: 0, col: 0 },
        P5: { name: "P5", matrix: P5, row: 0, col: 1 },
        C12: { name: "C12", matrix: addMatrices(P3, P5), row: 0, col: 2 },
      },
      operations: [{ type: "add", operands: ["P3", "P5"], result: "C12" }],
      highlightedMatrices: ["P3", "P5"],
    })

    const C12 = addMatrices(P3, P5)

    algorithmSteps.push({
      phase: "combine",
      description: "Compute C21 = P2 + P4",
      subMatrices: {
        P2: { name: "P2", matrix: P2, row: 0, col: 0 },
        P4: { name: "P4", matrix: P4, row: 0, col: 1 },
        C21: { name: "C21", matrix: addMatrices(P2, P4), row: 0, col: 2 },
      },
      operations: [{ type: "add", operands: ["P2", "P4"], result: "C21" }],
      highlightedMatrices: ["P2", "P4"],
    })

    const C21 = addMatrices(P2, P4)

    algorithmSteps.push({
      phase: "combine",
      description: "Compute C22 = P1 + P3 - P2 + P6",
      subMatrices: {
        P1: { name: "P1", matrix: P1, row: 0, col: 0 },
        P3: { name: "P3", matrix: P3, row: 0, col: 1 },
        P2: { name: "P2", matrix: P2, row: 1, col: 0 },
        P6: { name: "P6", matrix: P6, row: 1, col: 1 },
      },
      operations: [
        { type: "add", operands: ["P1", "P3"], result: "temp3" },
        { type: "subtract", operands: ["temp3", "P2"], result: "temp4" },
        { type: "add", operands: ["temp4", "P6"], result: "C22" },
      ],
      highlightedMatrices: ["P1", "P3", "P2", "P6"],
    })

    const temp3 = addMatrices(P1, P3)
    const temp4 = subtractMatrices(temp3, P2)
    const C22 = addMatrices(temp4, P6)

    const resultMatrix = combineSubMatrices(C11, C12, C21, C22)

    algorithmSteps.push({
      phase: "result",
      description: "Combine the four quadrants to form the final result matrix C = A × B",
      subMatrices: {
        C11: { name: "C11", matrix: C11, row: 0, col: 0 },
        C12: { name: "C12", matrix: C12, row: 0, col: 1 },
        C21: { name: "C21", matrix: C21, row: 1, col: 0 },
        C22: { name: "C22", matrix: C22, row: 1, col: 1 },
      },
      resultMatrix: resultMatrix,
    })

    setSteps(algorithmSteps)
  return out
}
export { parseMatrixInput }
