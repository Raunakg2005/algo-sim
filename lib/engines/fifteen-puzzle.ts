// Step generator for the 15-Puzzle Branch-and-Bound visualizer.
// Pure function: given a 4x4 board (0 = blank), returns every frame the visualizer plays.
//
// Least-cost branch and bound (A*): each state has cost g = moves so far, heuristic h = Manhattan distance of the
// tiles to their goal squares, and total f = g + h. The live state with the smallest f is expanded next (ties: smaller
// h, then older state). Manhattan distance never overestimates and changes by exactly 1 per move, so the first goal
// state selected has the minimum number of moves. A board already expanded is never generated again; if a board that
// is still waiting in the queue is reached by a shorter path, the old queue entry is pruned and replaced.
// Boards with the wrong inversion parity cannot be solved and are rejected before searching.

export type PuzzlePosition = { row: number; col: number }

export type PuzzleState = {
  grid: number[][]
  blankPos: PuzzlePosition
  cost: number
  heuristic: number
  totalCost: number
  parent: number | null
  move: string | null // direction the moved tile slides: "up" | "down" | "left" | "right"
  movedTile: number | null
}

export type PuzzleStep = {
  phase: "init" | "branch" | "bound" | "prune" | "update" | "complete"
  description: string
  currentStateId: number
  bestStateId: number | null
  states: Map<number, PuzzleState>
  activeStates: number[]
  exploredStates: number[]
  prunedStates: number[]
  path: number[]
}

export const GOAL_GRID: number[][] = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 0],
]

export const DEFAULT_MAX_PUZZLE_STATES = 1000

export function manhattanDistance(grid: number[][]): number {
  let distance = 0
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const value = grid[row][col]
      if (value !== 0) distance += Math.abs(row - Math.floor((value - 1) / 4)) + Math.abs(col - ((value - 1) % 4))
    }
  }
  return distance
}

// A 4x4 board is solvable iff (inversions among the tiles) + (row of the blank counted from the bottom, 1-based) is odd.
export function isSolvable(grid: number[][]): boolean {
  const tiles = grid.flat().filter((v) => v !== 0)
  let inversions = 0
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inversions++
  const blankRow = grid.findIndex((row) => row.includes(0))
  return (inversions + (4 - blankRow)) % 2 === 1
}

// a valid board: 4x4, each of 0..15 exactly once
export function isValidBoard(grid: number[][]): boolean {
  if (grid.length !== 4 || grid.some((row) => row.length !== 4)) return false
  const values = grid.flat()
  return values.every((v) => Number.isInteger(v) && v >= 0 && v <= 15) && new Set(values).size === 16
}

// blank moves; the tile that fills the blank slides the opposite way
const DIRECTIONS = [
  { row: -1, col: 0, tileMove: "down" },
  { row: 1, col: 0, tileMove: "up" },
  { row: 0, col: -1, tileMove: "right" },
  { row: 0, col: 1, tileMove: "left" },
]

const keyOf = (grid: number[][]) => grid.map((row) => row.join(",")).join(";")
const GOAL_KEY = keyOf(GOAL_GRID)

export function generateFifteenPuzzleSteps(initialGrid: number[][], maxStates: number = DEFAULT_MAX_PUZZLE_STATES): PuzzleStep[] {
  if (!isValidBoard(initialGrid)) throw new RangeError("The board must be 4x4 and contain each of 0..15 exactly once")

  const steps: PuzzleStep[] = []
  const states = new Map<number, PuzzleState>()
  const h0 = manhattanDistance(initialGrid)
  const blankRow = initialGrid.findIndex((row) => row.includes(0))
  states.set(1, {
    grid: initialGrid.map((row) => [...row]),
    blankPos: { row: blankRow, col: initialGrid[blankRow].indexOf(0) },
    cost: 0,
    heuristic: h0,
    totalCost: h0,
    parent: null,
    move: null,
    movedTile: null,
  })

  let explored: number[] = []
  let pruned: number[] = []
  let bestStateId: number | null = null
  const queue: number[] = [1]
  const push = (phase: PuzzleStep["phase"], description: string, currentStateId: number, path: number[] = []) => {
    steps.push({
      phase,
      description,
      currentStateId,
      bestStateId,
      states: new Map(states),
      activeStates: [...queue],
      exploredStates: explored,
      prunedStates: pruned,
      path,
    })
  }

  push("init", `Initialize with initial state. Manhattan distance heuristic: ${h0}`, 1)

  if (!isSolvable(initialGrid)) {
    queue.length = 0
    push(
      "complete",
      "This board cannot be solved: its tile inversions and blank row have the wrong parity, so no sequence of moves reaches the goal.",
      1,
    )
    return steps
  }

  const closed = new Set<string>()
  const waiting = new Map<string, number>() // board -> id of its entry in the queue
  waiting.set(keyOf(initialGrid), 1)
  let stateCounter = 1

  while (queue.length > 0 && stateCounter < maxStates) {
    queue.sort((a, b) => {
      const sa = states.get(a)!
      const sb = states.get(b)!
      return sa.totalCost - sb.totalCost || sa.heuristic - sb.heuristic || a - b
    })
    const currentStateId = queue.shift()!
    const current = states.get(currentStateId)!
    const currentKey = keyOf(current.grid)
    waiting.delete(currentKey)
    closed.add(currentKey)
    explored = [...explored, currentStateId]

    steps.push({
      phase: "branch",
      description: `Select state ${currentStateId} with lowest total cost (${current.totalCost})`,
      currentStateId,
      bestStateId,
      states: new Map(states),
      activeStates: [...queue],
      exploredStates: explored,
      prunedStates: pruned,
      path: [],
    })

    if (currentKey === GOAL_KEY) {
      bestStateId = currentStateId
      const path: number[] = []
      for (let id: number | null = currentStateId; id !== null; id = states.get(id)!.parent) path.unshift(id)
      queue.length = 0
      push("complete", `Solution found! Total moves: ${current.cost}`, currentStateId, path)
      break
    }

    for (const dir of DIRECTIONS) {
      const newRow = current.blankPos.row + dir.row
      const newCol = current.blankPos.col + dir.col
      if (newRow < 0 || newRow > 3 || newCol < 0 || newCol > 3) continue

      const grid = current.grid.map((row) => [...row])
      const movedTile = grid[newRow][newCol]
      grid[current.blankPos.row][current.blankPos.col] = movedTile
      grid[newRow][newCol] = 0
      const key = keyOf(grid)
      if (closed.has(key)) continue

      const cost = current.cost + 1
      const previousId = waiting.get(key)
      if (previousId !== undefined && states.get(previousId)!.cost <= cost) continue

      stateCounter++
      const id = stateCounter
      const heuristic = manhattanDistance(grid)
      states.set(id, {
        grid,
        blankPos: { row: newRow, col: newCol },
        cost,
        heuristic,
        totalCost: cost + heuristic,
        parent: currentStateId,
        move: dir.tileMove,
        movedTile,
      })
      push(
        "branch",
        `Move tile ${movedTile} ${dir.tileMove}. New state ${id} with cost ${cost} + heuristic ${heuristic} = ${cost + heuristic}`,
        id,
      )

      if (previousId !== undefined) {
        // same board reached in fewer moves: the older queue entry can never be better
        queue.splice(queue.indexOf(previousId), 1)
        pruned = [...pruned, previousId]
        push(
          "prune",
          `Prune state ${previousId}: state ${id} reaches the same board in ${cost} moves instead of ${states.get(previousId)!.cost}`,
          id,
        )
      }

      queue.push(id)
      waiting.set(key, id)
      push("bound", `Add state ${id} to queue with total cost ${cost + heuristic}`, id)
    }
  }

  if (bestStateId === null) {
    const lastId = steps[steps.length - 1].currentStateId
    queue.length = 0
    push("complete", `No solution found within the search limit (${maxStates} states).`, lastId)
  }

  return steps
}
