// Legacy harness: eight-queens. Lines 12-23 (types) and 53-200 (startAlgorithm) spliced verbatim from
// `git show HEAD:components/eight-queens.tsx`; boardSize is a parameter (the UI fixes it at 8).
type BoardState = boolean[][]
type Position = { row: number; col: number }

type AlgorithmStep = {
  phase: "init" | "place" | "conflict" | "backtrack" | "success" | "complete"
  description: string
  board: BoardState
  currentPosition: Position | null
  conflictPositions: Position[]
  queensPositions: Position[]
  previousPosition?: Position | null
}
export function legacy(boardSize: number): { steps: AlgorithmStep[]; solutions: Position[][] } {
  let captured: AlgorithmStep[] = []
  let sols: Position[][] = []
  const setAlgorithmStarted = (_b: boolean) => {}
  const setSteps = (s: AlgorithmStep[]) => { captured = s }
  const setSolutions = (s: Position[][]) => { sols = s }
  const setCurrentSolution = (_n: number) => {}
  const setCurrentStep = (_n: number) => {}
  const startAlgorithm = () => {
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []
    const allSolutions: Position[][] = []

    const initialBoard: BoardState = Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(false))

    algorithmSteps.push({
      phase: "init",
      description: "Initialize empty chessboard",
      board: initialBoard,
      currentPosition: null,
      conflictPositions: [],
      queensPositions: [],
    })

    const isSafe = (board: BoardState, row: number, col: number, queens: Position[]): [boolean, Position[]] => {
      const conflicts: Position[] = []

      for (let i = 0; i < col; i++) {
        if (board[row][i]) {
          conflicts.push({ row, col: i })
          return [false, conflicts]
        }
      }

      for (let i = row, j = col; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j]) {
          conflicts.push({ row: i, col: j })
          return [false, conflicts]
        }
      }

      for (let i = row, j = col; i < boardSize && j >= 0; i++, j--) {
        if (board[i][j]) {
          conflicts.push({ row: i, col: j })
          return [false, conflicts]
        }
      }

      for (const queen of queens) {
        if (queen.row === row) {
          conflicts.push(queen)
          return [false, conflicts]
        }

        if (Math.abs(queen.row - row) === Math.abs(queen.col - col)) {
          conflicts.push(queen)
          return [false, conflicts]
        }
      }

      return [true, []]
    }

    const solveNQueens = (board: BoardState, col: number, queens: Position[], steps: AlgorithmStep[]): boolean => {

      if (col >= boardSize) {
        allSolutions.push([...queens])

        steps.push({
          phase: "success",
          description: `Solution found! All ${boardSize} queens placed successfully.`,
          board: JSON.parse(JSON.stringify(board)),
          currentPosition: null,
          conflictPositions: [],
          queensPositions: [...queens],
        })

        return true
      }

      for (let row = 0; row < boardSize; row++) {
        steps.push({
          phase: "place",
          description: `Considering position (${row + 1}, ${col + 1})...`,
          board: JSON.parse(JSON.stringify(board)),
          currentPosition: { row, col },
          conflictPositions: [],
          queensPositions: [...queens],
        })

        const [safe, conflicts] = isSafe(board, row, col, queens)

        if (!safe) {
          steps.push({
            phase: "conflict",
            description: `Conflict detected at (${row + 1}, ${col + 1}). Cannot place queen here.`,
            board: JSON.parse(JSON.stringify(board)),
            currentPosition: { row, col },
            conflictPositions: conflicts,
            queensPositions: [...queens],
          })
          continue
        }

        board[row][col] = true
        queens.push({ row, col })

        steps.push({
          phase: "place",
          description: `Placed queen at (${row + 1}, ${col + 1})`,
          board: JSON.parse(JSON.stringify(board)),
          currentPosition: { row, col },
          conflictPositions: [],
          queensPositions: [...queens],
        })

        if (solveNQueens(board, col + 1, queens, steps)) {
        }

        board[row][col] = false
        queens.pop()

        steps.push({
          phase: "backtrack",
          description: `Backtracking from (${row + 1}, ${col + 1})...`,
          board: JSON.parse(JSON.stringify(board)),
          currentPosition: { row, col },
          conflictPositions: [],
          queensPositions: [...queens],
          previousPosition: { row, col },
        })
      }

      return false
    }

    const board = JSON.parse(JSON.stringify(initialBoard))
    solveNQueens(board, 0, [], algorithmSteps)

    algorithmSteps.push({
      phase: "complete",
      description: `Algorithm complete. Found ${allSolutions.length} solution(s).`,
      board: JSON.parse(JSON.stringify(initialBoard)),
      currentPosition: null,
      conflictPositions: [],
      queensPositions: allSolutions.length > 0 ? allSolutions[0] : [],
    })

    setSteps(algorithmSteps)
    setSolutions(allSolutions)
    setCurrentSolution(0)
    setCurrentStep(0)
  }
  startAlgorithm()
  return { steps: captured, solutions: sols }
}
