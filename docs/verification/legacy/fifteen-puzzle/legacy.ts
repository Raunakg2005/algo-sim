// Legacy harness: fifteen-puzzle-branch-and-bound. Lines 28-54 (types), 74-86 (goal, directions), 88-119 (parseCustomGrid),
// 121-154 (generateRandomPuzzle), 164-207 (helpers) and 209-410 (startAlgorithm) spliced verbatim from
// `git show HEAD:components/fifteen-puzzle-branch-and-bound.tsx`; React setters replaced by captures.
type Position = {
  row: number
  col: number
}

type PuzzleState = {
  grid: number[][]
  blankPos: Position
  cost: number
  heuristic: number
  totalCost: number
  parent: number | null
  move: string | null
  movedTile: number | null
}

type AlgorithmStep = {
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
export type { AlgorithmStep, PuzzleState }
export function legacy(initialGrid: number[][], inputError = ""): AlgorithmStep[] {
  let captured: AlgorithmStep[] = []
  const setAlgorithmStarted = (_b: boolean) => {}
  const setActiveTab = (_s: string) => {}
  const setSteps = (s: AlgorithmStep[]) => { captured = s }
  const setCurrentStep = (_n: number) => {}
  const goalGrid = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 0],
  ]

  const directions = [
    { row: -1, col: 0, name: "up" },
    { row: 1, col: 0, name: "down" },
    { row: 0, col: -1, name: "left" },
    { row: 0, col: 1, name: "right" },
  ]
  const calculateManhattanDistance = (grid: number[][]): number => {
    let distance = 0

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const value = grid[row][col]

        if (value !== 0) {
          const goalRow = Math.floor((value - 1) / 4)
          const goalCol = (value - 1) % 4

          distance += Math.abs(row - goalRow) + Math.abs(col - goalCol)
        }
      }
    }

    return distance
  }

  const isPuzzleSolved = (grid: number[][]): boolean => {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (grid[row][col] !== goalGrid[row][col]) {
          return false
        }
      }
    }
    return true
  }

  const findBlankPosition = (grid: number[][]): Position => {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (grid[row][col] === 0) {
          return { row, col }
        }
      }
    }
    return { row: -1, col: -1 } 
  }

  const copyGrid = (grid: number[][]): number[][] => {
    return grid.map((row) => [...row])
  }
  const startAlgorithm = () => {
    if (inputError) {
      return
    }

    setAlgorithmStarted(true)
    setActiveTab("visualization")

    const algorithmSteps: AlgorithmStep[] = []

    const blankPos = findBlankPosition(initialGrid)
    const initialHeuristic = calculateManhattanDistance(initialGrid)

    const initialState: PuzzleState = {
      grid: copyGrid(initialGrid),
      blankPos,
      cost: 0,
      heuristic: initialHeuristic,
      totalCost: initialHeuristic,
      parent: null,
      move: null,
      movedTile: null,
    }

    const states = new Map<number, PuzzleState>()
    states.set(1, initialState)

    algorithmSteps.push({
      phase: "init",
      description: `Initialize with initial state. Manhattan distance heuristic: ${initialHeuristic}`,
      currentStateId: 1,
      bestStateId: null,
      states,
      activeStates: [1],
      exploredStates: [],
      prunedStates: [],
      path: [],
    })

    const priorityQueue: number[] = [1]
    let bestStateId: number | null = null
    let stateCounter = 1

    const visited = new Set<string>()
    visited.add(JSON.stringify(initialGrid))

    while (priorityQueue.length > 0 && stateCounter < 1000) {
      priorityQueue.sort((a, b) => {
        const stateA = states.get(a)!
        const stateB = states.get(b)!
        return stateA.totalCost - stateB.totalCost
      })

      const currentStateId = priorityQueue.shift()!
      const currentState = states.get(currentStateId)!

      const exploredStates = [...algorithmSteps[algorithmSteps.length - 1].exploredStates, currentStateId]

      algorithmSteps.push({
        phase: "branch",
        description: `Select state ${currentStateId} with lowest total cost (${currentState.totalCost})`,
        currentStateId,
        bestStateId,
        states: new Map(states),
        activeStates: [...priorityQueue],
        exploredStates,
        prunedStates: [...algorithmSteps[algorithmSteps.length - 1].prunedStates],
        path: [],
      })

      if (isPuzzleSolved(currentState.grid)) {
        bestStateId = currentStateId

        const path: number[] = []
        let stateId = currentStateId

        while (stateId !== null) {
          path.unshift(stateId)
          const parentStateId = states.get(stateId)!.parent;
          if (parentStateId !== null) {
            stateId = parentStateId;
          } else {
            break;
          }
          if (stateId === null) break
        }

        algorithmSteps.push({
          phase: "complete",
          description: `Solution found! Total moves: ${currentState.cost}`,
          currentStateId,
          bestStateId,
          states: new Map(states),
          activeStates: [],
          exploredStates,
          prunedStates: [...algorithmSteps[algorithmSteps.length - 1].prunedStates],
          path,
        })

        break
      }

      for (const dir of directions) {
        const newRow = currentState.blankPos.row + dir.row
        const newCol = currentState.blankPos.col + dir.col

        if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
          const newGrid = copyGrid(currentState.grid)
          const movedTile = newGrid[newRow][newCol]

          newGrid[currentState.blankPos.row][currentState.blankPos.col] = movedTile
          newGrid[newRow][newCol] = 0

          const stateString = JSON.stringify(newGrid)
          if (visited.has(stateString)) {
            continue
          }

          visited.add(stateString)

          stateCounter++
          const newStateId = stateCounter

          const newHeuristic = calculateManhattanDistance(newGrid)
          const newCost = currentState.cost + 1
          const newTotalCost = newCost + newHeuristic

          const newState: PuzzleState = {
            grid: newGrid,
            blankPos: { row: newRow, col: newCol },
            cost: newCost,
            heuristic: newHeuristic,
            totalCost: newTotalCost,
            parent: currentStateId,
            move: dir.name,
            movedTile,
          }

          states.set(newStateId, newState)

          algorithmSteps.push({
            phase: "branch",
            description: `Move tile ${movedTile} ${dir.name}. New state ${newStateId} with cost ${newCost} + heuristic ${newHeuristic} = ${newTotalCost}`,
            currentStateId: newStateId,
            bestStateId,
            states: new Map(states),
            activeStates: [...priorityQueue],
            exploredStates,
            prunedStates: [...algorithmSteps[algorithmSteps.length - 1].prunedStates],
            path: [],
          })

          if (bestStateId !== null && newTotalCost >= states.get(bestStateId)!.cost) {
            algorithmSteps.push({
              phase: "prune",
              description: `Prune state ${newStateId} as its total cost (${newTotalCost}) is not better than current best (${states.get(bestStateId)!.cost})`,
              currentStateId: newStateId,
              bestStateId,
              states: new Map(states),
              activeStates: [...priorityQueue],
              exploredStates,
              prunedStates: [...algorithmSteps[algorithmSteps.length - 1].prunedStates, newStateId],
              path: [],
            })

            continue
          }

          priorityQueue.push(newStateId)

          algorithmSteps.push({
            phase: "bound",
            description: `Add state ${newStateId} to queue with total cost ${newTotalCost}`,
            currentStateId: newStateId,
            bestStateId,
            states: new Map(states),
            activeStates: [...priorityQueue],
            exploredStates,
            prunedStates: [...algorithmSteps[algorithmSteps.length - 1].prunedStates],
            path: [],
          })
        }
      }
    }

    if (bestStateId === null) {
      algorithmSteps.push({
        phase: "complete",
        description: "No solution found within the search limit.",
        currentStateId: algorithmSteps[algorithmSteps.length - 1].currentStateId,
        bestStateId: null,
        states: new Map(states),
        activeStates: [],
        exploredStates: algorithmSteps[algorithmSteps.length - 1].exploredStates,
        prunedStates: algorithmSteps[algorithmSteps.length - 1].prunedStates,
        path: [],
      })
    }

    setSteps(algorithmSteps)
    setCurrentStep(0)
  }
  startAlgorithm()
  return captured
}
export function uiRandomPuzzle(): number[][] {
  let out: number[][] = []
  const setInitialGrid = (g: number[][]) => { out = g }
  const setCustomGrid = (_s: string) => {}
  const setInputError = (_s: string) => {}
  const directions = [
    { row: -1, col: 0, name: "up" },
    { row: 1, col: 0, name: "down" },
    { row: 0, col: -1, name: "left" },
    { row: 0, col: 1, name: "right" },
  ]
  const generateRandomPuzzle = () => {
    const puzzle = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 0],
    ]

    let blankPos = { row: 3, col: 3 }
    const numMoves = 100 

    for (let i = 0; i < numMoves; i++) {
      const validMoves = []

      for (const dir of directions) {
        const newRow = blankPos.row + dir.row
        const newCol = blankPos.col + dir.col

        if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
          validMoves.push({ row: newRow, col: newCol, dir })
        }
      }

      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]

      puzzle[blankPos.row][blankPos.col] = puzzle[randomMove.row][randomMove.col]
      puzzle[randomMove.row][randomMove.col] = 0
      blankPos = { row: randomMove.row, col: randomMove.col }
    }

    setInitialGrid(puzzle)
    setCustomGrid("")
    setInputError("")
  }
  generateRandomPuzzle()
  return out
}
export function uiParse(input: string): { grid: number[][] | null; error: string } {
  let error = ""
  const setInputError = (s: string) => { error = s }
  const parseCustomGrid = (input: string): number[][] | null => {
    try {
      const values = input.replace(/\s/g, "").split(",").map(Number)

      if (values.length !== 16) {
        setInputError("Input must contain exactly 16 numbers")
        return null
      }

      const validNumbers = values.every((num) => num >= 0 && num <= 15)
      if (!validNumbers) {
        setInputError("Numbers must be between 0 and 15 (0 represents the blank space)")
        return null
      }

      const uniqueNumbers = new Set(values).size === 16
      if (!uniqueNumbers) {
        setInputError("All numbers must be unique")
        return null
      }

      const grid: number[][] = []
      for (let i = 0; i < 4; i++) {
        grid.push(values.slice(i * 4, (i + 1) * 4))
      }

      return grid
    } catch (error) {
      setInputError("Invalid input format")
      return null
    }
  }
  return { grid: parseCustomGrid(input), error }
}
