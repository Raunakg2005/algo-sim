// Step generator for the N-Queens (backtracking) visualizer.
// Pure function: given the board size, returns every frame the visualizer plays and all solutions found.
// Queens are placed column by column (left to right); within a column the rows are tried top to bottom.
// After a solution is recorded the search continues, so every solution is enumerated.

export type QueensBoard = boolean[][]
export type QueensPosition = { row: number; col: number }

export type QueensStep = {
  phase: "init" | "place" | "conflict" | "backtrack" | "success" | "complete"
  description: string
  board: QueensBoard
  currentPosition: QueensPosition | null
  conflictPositions: QueensPosition[]
  queensPositions: QueensPosition[]
  previousPosition?: QueensPosition | null
}

export type NQueensResult = { steps: QueensStep[]; solutions: QueensPosition[][] }

export function generateNQueensSteps(boardSize: number): NQueensResult {
  const steps: QueensStep[] = []
  const solutions: QueensPosition[][] = []
  const board: QueensBoard = Array.from({ length: boardSize }, () => new Array<boolean>(boardSize).fill(false))
  const copyBoard = (): QueensBoard => board.map((row) => [...row])
  const queens: QueensPosition[] = []

  steps.push({
    phase: "init",
    description: "Initialize empty chessboard",
    board: copyBoard(),
    currentPosition: null,
    conflictPositions: [],
    queensPositions: [],
  })

  // Columns left of `col` are the only ones holding queens, so it suffices to look left along the row and the two
  // diagonals. Returns the first queen that attacks (row, col), or null if the square is safe.
  const attacker = (row: number, col: number): QueensPosition | null => {
    for (let j = 0; j < col; j++) if (board[row][j]) return { row, col: j }
    for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) if (board[i][j]) return { row: i, col: j }
    for (let i = row + 1, j = col - 1; i < boardSize && j >= 0; i++, j--) if (board[i][j]) return { row: i, col: j }
    return null
  }

  const solve = (col: number) => {
    if (col >= boardSize) {
      solutions.push(queens.map((q) => ({ ...q })))
      steps.push({
        phase: "success",
        description: `Solution found! All ${boardSize} queens placed successfully.`,
        board: copyBoard(),
        currentPosition: null,
        conflictPositions: [],
        queensPositions: queens.map((q) => ({ ...q })),
      })
      return
    }

    for (let row = 0; row < boardSize; row++) {
      steps.push({
        phase: "place",
        description: `Considering position (${row + 1}, ${col + 1})...`,
        board: copyBoard(),
        currentPosition: { row, col },
        conflictPositions: [],
        queensPositions: queens.map((q) => ({ ...q })),
      })

      const conflict = attacker(row, col)
      if (conflict) {
        steps.push({
          phase: "conflict",
          description: `Conflict detected at (${row + 1}, ${col + 1}). Cannot place queen here.`,
          board: copyBoard(),
          currentPosition: { row, col },
          conflictPositions: [conflict],
          queensPositions: queens.map((q) => ({ ...q })),
        })
        continue
      }

      board[row][col] = true
      queens.push({ row, col })
      steps.push({
        phase: "place",
        description: `Placed queen at (${row + 1}, ${col + 1})`,
        board: copyBoard(),
        currentPosition: { row, col },
        conflictPositions: [],
        queensPositions: queens.map((q) => ({ ...q })),
      })

      solve(col + 1)

      board[row][col] = false
      queens.pop()
      steps.push({
        phase: "backtrack",
        description: `Backtracking from (${row + 1}, ${col + 1})...`,
        board: copyBoard(),
        currentPosition: { row, col },
        conflictPositions: [],
        queensPositions: queens.map((q) => ({ ...q })),
        previousPosition: { row, col },
      })
    }
  }

  solve(0)

  steps.push({
    phase: "complete",
    description: `Algorithm complete. Found ${solutions.length} solution(s).`,
    board: Array.from({ length: boardSize }, () => new Array<boolean>(boardSize).fill(false)),
    currentPosition: null,
    conflictPositions: [],
    queensPositions: solutions.length > 0 ? solutions[0] : [],
  })

  return { steps, solutions }
}

export type NQueensStats = {
  frames: number
  squaresConsidered: number
  conflicts: number
  queensPlaced: number
  backtracks: number
  solutions: number
  // nodes of the backtracking tree: the root (empty board) plus one node per queen placement
  treeNodes: number
}

export function summarizeNQueens(result: NQueensResult): NQueensStats {
  let squaresConsidered = 0
  let conflicts = 0
  let queensPlaced = 0
  let backtracks = 0
  for (const s of result.steps) {
    if (s.phase === "place" && s.description.startsWith("Considering")) squaresConsidered++
    else if (s.phase === "place") queensPlaced++
    else if (s.phase === "conflict") conflicts++
    else if (s.phase === "backtrack") backtracks++
  }
  return {
    frames: result.steps.length,
    squaresConsidered,
    conflicts,
    queensPlaced,
    backtracks,
    solutions: result.solutions.length,
    treeNodes: queensPlaced + 1,
  }
}
