"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, StepForward, StepBack, Crown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

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

export default function EightQueensProblem() {
  const [boardSize, setBoardSize] = useState<number>(8)
  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [algorithmStarted, setAlgorithmStarted] = useState<boolean>(false)
  const [solutions, setSolutions] = useState<Position[][]>([])
  const [currentSolution, setCurrentSolution] = useState<number>(0)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const [boardWidth, setBoardWidth] = useState<number>(400)
  const boardContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (boardContainerRef.current) {
        const containerWidth = boardContainerRef.current.clientWidth
        const newWidth = Math.min(containerWidth, 500)
        setBoardWidth(newWidth)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

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


  const resetAlgorithm = () => {
    setAlgorithmStarted(false)
    setSteps([])
    setCurrentStep(0)
    setIsPlaying(false)
    setSolutions([])
    setCurrentSolution(0)
    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const stepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsPlaying(false)
    }
  }

  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const showNextSolution = () => {
    if (solutions.length > 0) {
      const nextSolution = (currentSolution + 1) % solutions.length
      setCurrentSolution(nextSolution)

      if (steps.length > 0) {
        const newSteps = [...steps]
        const lastStep = { ...newSteps[newSteps.length - 1] }
        lastStep.queensPositions = solutions[nextSolution]
        newSteps[newSteps.length - 1] = lastStep
        setSteps(newSteps)
        setCurrentStep(newSteps.length - 1)
      }
    }
  }

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      animationRef.current = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 2000 / speed)
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false)
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [isPlaying, currentStep, steps, speed])

  const cellSize = boardWidth / boardSize

  const hasQueen = (row: number, col: number): boolean => {
    if (!steps[currentStep]) return false

    return steps[currentStep].queensPositions.some((pos) => pos.row === row && pos.col === col)
  }

  const isCurrentPosition = (row: number, col: number): boolean => {
    if (!steps[currentStep] || !steps[currentStep].currentPosition) return false

    const { row: currentRow, col: currentCol } = steps[currentStep].currentPosition
    return currentRow === row && currentCol === col
  }

  const isConflictPosition = (row: number, col: number): boolean => {
    if (!steps[currentStep]) return false

    return steps[currentStep].conflictPositions.some((pos) => pos.row === row && pos.col === col)
  }

  const isPreviousPosition = (row: number, col: number): boolean => {
    if (!steps[currentStep] || !steps[currentStep].previousPosition) return false

    const { row: prevRow, col: prevCol } = steps[currentStep].previousPosition
    return prevRow === row && prevCol === col
  }

  const getCellBackground = (row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0
    const baseColor = isLight ? "bg-amber-100" : "bg-amber-800"

    if (isCurrentPosition(row, col)) {
      return isLight ? "bg-yellow-200" : "bg-yellow-700"
    }

    if (isConflictPosition(row, col)) {
      return isLight ? "bg-red-200" : "bg-red-700"
    }

    if (isPreviousPosition(row, col)) {
      return isLight ? "bg-gray-200" : "bg-gray-700"
    }

    return baseColor
  }

  const getCellBorder = (row: number, col: number): string => {
    if (isCurrentPosition(row, col)) {
      return "ring-2 ring-yellow-400"
    }

    if (isConflictPosition(row, col)) {
      return "ring-2 ring-red-500"
    }

    if (isPreviousPosition(row, col)) {
      return "ring-2 ring-gray-400"
    }

    return ""
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">8-Queens Problem - Backtracking Visualization</h1>

      <Card className="w-full p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Controls</h2>

            {!algorithmStarted ? (
              <div className="flex gap-2">
                <Button onClick={startAlgorithm}>Start Algorithm</Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={resetAlgorithm} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={togglePlay} variant="outline">
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={stepBackward} variant="outline" disabled={currentStep <= 0}>
                  <StepBack className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={stepForward} variant="outline" disabled={currentStep >= steps.length - 1}>
                  <StepForward className="w-4 h-4 mr-2" />
                  Next
                </Button>

                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-sm">Speed:</span>
                  <Slider
                    value={[speed]}
                    min={0.5}
                    max={3}
                    step={0.5}
                    onValueChange={(value) => setSpeed(value[0])}
                    className="w-24"
                  />
                  <span className="text-sm">{speed}x</span>
                </div>
              </div>
            )}
          </div>

          {algorithmStarted && solutions.length > 0 && currentStep === steps.length - 1 && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Solutions</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Solution {currentSolution + 1} of {solutions.length}
                </Badge>
                <Button size="sm" onClick={showNextSolution}>
                  Next Solution
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Algorithm step description */}
        {algorithmStarted && steps.length > 0 && (
          <Alert variant="default" className="bg-primary/10">
            <AlertDescription>{steps[currentStep]?.description || "Preparing algorithm..."}</AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Chessboard Visualization */}
      <Card className="w-full p-4 flex flex-col items-center">
        <div ref={boardContainerRef} className="w-full max-w-[500px] flex justify-center">
          <div
            className="relative border-2 border-gray-800"
            style={{
              width: `${boardWidth}px`,
              height: `${boardWidth}px`,
            }}
          >
            {/* Chessboard grid */}
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
                gridTemplateRows: `repeat(${boardSize}, 1fr)`,
              }}
            >
              {Array.from({ length: boardSize }).map((_, row) =>
                Array.from({ length: boardSize }).map((_, col) => (
                  <div
                    key={`${row}-${col}`}
                    className={`relative ${getCellBackground(row, col)} ${getCellBorder(row, col)} transition-colors duration-300`}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                    }}
                  >
                    {/* Row and column labels */}
                    {col === 0 && (
                      <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 text-xs font-medium">
                        {row + 1}
                      </div>
                    )}
                    {row === boardSize - 1 && (
                      <div className="absolute bottom-[-1.5rem] left-1/2 transform -translate-x-1/2 text-xs font-medium">
                        {String.fromCharCode(97 + col)}
                      </div>
                    )}

                    {/* Queen */}
                    <AnimatePresence>
                      {hasQueen(row, col) && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Crown
                            className={`w-3/4 h-3/4 ${(row + col) % 2 === 0 ? "text-amber-950" : "text-amber-100"}`}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )),
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {algorithmStarted && steps.length > 0 && (
          <div className="w-full max-w-[500px] mt-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round((currentStep / (steps.length - 1)) * 100)}% Complete</span>
            </div>
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className="w-full p-4">
        <h2 className="text-lg font-semibold mb-2">Legend</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-300 rounded"></div>
            <span className="text-sm">Current Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Conflict Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-sm">Backtracked Position</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span className="text-sm">Placed Queen</span>
          </div>
        </div>
      </Card>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          The 8-Queens Problem is a classic chess puzzle where you need to place eight queens on an 8×8 chessboard so
          that no two queens threaten each other.
        </p>
        <p className="mt-2">
          This visualization demonstrates the backtracking algorithm for solving the problem. The algorithm works by
          placing queens one by one, starting from the leftmost column. When it finds that a queen cannot be placed in
          the current column, it backtracks and changes the position of the previous queen.
        </p>
        <p className="mt-2">
          The algorithm checks for conflicts in three directions: horizontally, and along both diagonals. If a conflict
          is detected, it tries the next row in the same column. If all rows are exhausted, it backtracks to the
          previous column.
        </p>
        <p className="mt-2">
          There are 92 distinct solutions to the 8-Queens Problem. Due to symmetries, these can be organized into 12
          fundamental solutions.
        </p>
      </div>
    </div>
  )
}

