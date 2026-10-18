// Legacy harness: verbatim copy of the original startAlgorithm / updateDimensions / handleCustomDimensions logic.
type MatrixDimension = { rows: number; cols: number }
type AlgorithmStep = { phase: "init" | "compute" | "backtrack" | "complete"; description: string; i?: number; j?: number; k?: number; currentCost?: number; minCost?: number; bestK?: number; costMatrix?: number[][]; splitMatrix?: number[][]; highlightCells?: { i: number; j: number }[]; parenthesization?: string }
export function legacySteps(dimensions: number[], numMatrices: number): AlgorithmStep[] | string {
  let out: AlgorithmStep[] = []; let err = ""
  const setInputError = (e: string) => { err = e }; const setAlgorithmStarted = (_: boolean) => {}
  const setSteps = (s: AlgorithmStep[]) => { out = s }; const setCurrentStep = (_: number) => {}
    if (dimensions.length < numMatrices + 1) {
      setInputError(`Please provide ${numMatrices + 1} dimensions for ${numMatrices} matrices`)
      return err
    }

    setInputError("")
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []

    const matrices: MatrixDimension[] = []
    for (let i = 0; i < numMatrices; i++) {
      matrices.push({
        rows: dimensions[i],
        cols: dimensions[i + 1],
      })
    }

    const n = numMatrices
    const costMatrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0))
    const splitMatrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0))

    algorithmSteps.push({
      phase: "init",
      description: "Initialize the cost matrix with zeros on the diagonal (cost of multiplying a single matrix is 0)",
      costMatrix: [...costMatrix.map((row) => [...row])],
      splitMatrix: [...splitMatrix.map((row) => [...row])],
    })

    for (let len = 2; len <= n; len++) {
      for (let i = 0; i < n - len + 1; i++) {
        const j = i + len - 1

        costMatrix[i][j] = Number.POSITIVE_INFINITY

        algorithmSteps.push({
          phase: "compute",
          description: `Computing optimal cost for multiplying matrices ${i + 1} to ${j + 1}`,
          i,
          j,
          costMatrix: [...costMatrix.map((row) => [...row])],
          splitMatrix: [...splitMatrix.map((row) => [...row])],
          highlightCells: [{ i, j }],
        })

        for (let k = i; k < j; k++) {
          const cost = costMatrix[i][k] + costMatrix[k + 1][j] + dimensions[i] * dimensions[k + 1] * dimensions[j + 1]

          algorithmSteps.push({
            phase: "compute",
            description: `Trying split at matrix ${k + 1}: Cost = m[${i + 1},${k + 1}] + m[${k + 2},${j + 1}] + ${dimensions[i]} × ${dimensions[k + 1]} × ${dimensions[j + 1]}`,
            i,
            j,
            k,
            currentCost: cost,
            minCost: costMatrix[i][j],
            costMatrix: [...costMatrix.map((row) => [...row])],
            splitMatrix: [...splitMatrix.map((row) => [...row])],
            highlightCells: [
              { i, j },
              { i, j: k },
              { i: k + 1, j },
            ],
          })

          if (cost < costMatrix[i][j]) {
            costMatrix[i][j] = cost
            splitMatrix[i][j] = k

            algorithmSteps.push({
              phase: "compute",
              description: `New minimum cost found: ${cost} with split at matrix ${k + 1}`,
              i,
              j,
              k,
              currentCost: cost,
              minCost: cost,
              bestK: k,
              costMatrix: [...costMatrix.map((row) => [...row])],
              splitMatrix: [...splitMatrix.map((row) => [...row])],
              highlightCells: [{ i, j }],
            })
          }
        }
      }
    }

    algorithmSteps.push({
      phase: "compute",
      description: `Dynamic programming table completed. The minimum cost of multiplying the entire chain is ${costMatrix[0][n - 1]}`,
      costMatrix: [...costMatrix.map((row) => [...row])],
      splitMatrix: [...splitMatrix.map((row) => [...row])],
    })

    const printOptimalParens = (s: number[][], i: number, j: number): string => {
      if (i === j) {
        return `M${i + 1}`
      } else {
        return `(${printOptimalParens(s, i, s[i][j])} × ${printOptimalParens(s, s[i][j] + 1, j)})`
      }
    }

    const optimalParenthesization = printOptimalParens(splitMatrix, 0, n - 1)

    algorithmSteps.push({
      phase: "backtrack",
      description: "Backtracking to find the optimal parenthesization",
      costMatrix: [...costMatrix.map((row) => [...row])],
      splitMatrix: [...splitMatrix.map((row) => [...row])],
    })

    algorithmSteps.push({
      phase: "complete",
      description: `The optimal parenthesization is: ${optimalParenthesization}`,
      costMatrix: [...costMatrix.map((row) => [...row])],
      splitMatrix: [...splitMatrix.map((row) => [...row])],
      parenthesization: optimalParenthesization,
    })

    setSteps(algorithmSteps)
    setCurrentStep(0)
  return out
}
export function legacyParse(customDimensions: string, numMatrices: number): number[] | string {
  let err = ""; let res: number[] = []; const setInputError = (e: string) => { err = e }; const setDimensions = (d: number[]) => { res = d }; const resetAlgorithm = () => {}
    try {
      const dims = customDimensions
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d !== "")
        .map((d) => {
          const num = Number.parseInt(d)
          if (isNaN(num) || num <= 0) {
            throw new Error("All dimensions must be positive integers")
          }
          return num
        })

      if (dims.length < numMatrices + 1) {
        setInputError(`Please provide ${numMatrices + 1} dimensions for ${numMatrices} matrices`)
        return err
      }

      if (dims.length > numMatrices + 1) {
        dims.splice(numMatrices + 1)
      }

      setDimensions(dims)
      setInputError("")
      resetAlgorithm()
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message)
      } else {
        setInputError("Invalid dimensions format")
      }
    }
  return err || res
}
export function legacyUpdateDimensions(newNumMatrices: number, dimensions: number[]): { n: number; dims: number[] } | string {
  let err = ""; let n = -1; let dims: number[] = []; const setInputError = (e: string) => { err = e }; const setNumMatrices = (x: number) => { n = x }; const setDimensions = (d: number[]) => { dims = d }; const setCustomDimensions = (_: string) => {}; const resetAlgorithm = () => {}
    if (newNumMatrices < 2) {
      setInputError("Please specify at least 2 matrices")
      return err
    }

    if (newNumMatrices > 10) {
      setInputError("Please specify 10 or fewer matrices for better visualization")
      return err
    }

    setInputError("")
    setNumMatrices(newNumMatrices)

    const newDimensions = [...dimensions]
    if (newDimensions.length < newNumMatrices + 1) {
      for (let i = newDimensions.length; i <= newNumMatrices; i++) {
        newDimensions.push(Math.floor(Math.random() * 40) + 5) 
      }
    } else if (newDimensions.length > newNumMatrices + 1) {
      newDimensions.splice(newNumMatrices + 1)
    }

    setDimensions(newDimensions)
    setCustomDimensions(newDimensions.join(", "))
    resetAlgorithm()
  return { n, dims }
}
