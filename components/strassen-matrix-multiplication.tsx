"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, StepForward, Plus, Minus, ArrowRight } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { generateStrassenSteps, parseMatrixInput, type Matrix, type StrassenOperation, type StrassenStep, type SubMatrix } from "@/lib/engines/strassen"

type Operation = StrassenOperation
type AlgorithmStep = StrassenStep

export default function StrassenMatrixMultiplication() {
  const [matrixA, setMatrixA] = useState<Matrix>([
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ])

  const [matrixB, setMatrixB] = useState<Matrix>([
    [17, 18, 19, 20],
    [21, 22, 23, 24],
    [25, 26, 27, 28],
    [29, 30, 31, 32],
  ])

  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [matrixSize, setMatrixSize] = useState(4)
  const [customMatrixA, setCustomMatrixA] = useState("")
  const [customMatrixB, setCustomMatrixB] = useState("")
  const [inputError, setInputError] = useState("")
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const generateRandomMatrices = () => {
    const size = matrixSize
    const newMatrixA: Matrix = []
    const newMatrixB: Matrix = []

    for (let i = 0; i < size; i++) {
      const rowA: number[] = []
      const rowB: number[] = []
      for (let j = 0; j < size; j++) {
        rowA.push(Math.floor(Math.random() * 9) + 1) 
        rowB.push(Math.floor(Math.random() * 9) + 1)
      }
      newMatrixA.push(rowA)
      newMatrixB.push(rowB)
    }

    setMatrixA(newMatrixA)
    setMatrixB(newMatrixB)
    resetVisualization()
  }

  const resetVisualization = () => {
    setCurrentStep(0)
    setIsPlaying(false)
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

  const handleSizeChange = (newSize: number) => {
    if (newSize !== matrixSize) {
      setMatrixSize(newSize)
      const newMatrixA: Matrix = []
      const newMatrixB: Matrix = []

      for (let i = 0; i < newSize; i++) {
        const rowA: number[] = []
        const rowB: number[] = []
        for (let j = 0; j < newSize; j++) {
          rowA.push(Math.floor(Math.random() * 9) + 1)
          rowB.push(Math.floor(Math.random() * 9) + 1)
        }
        newMatrixA.push(rowA)
        newMatrixB.push(rowB)
      }

      setMatrixA(newMatrixA)
      setMatrixB(newMatrixB)
      resetVisualization()
    }
  }

  const handleCustomMatrices = () => {
    setInputError("")

    const parsedA = parseMatrixInput(customMatrixA, matrixSize)
    const parsedB = parseMatrixInput(customMatrixB, matrixSize)

    if (!parsedA) {
      setInputError(`Invalid input for Matrix A. Please enter a ${matrixSize}x${matrixSize} matrix.`)
      return
    }

    if (!parsedB) {
      setInputError(`Invalid input for Matrix B. Please enter a ${matrixSize}x${matrixSize} matrix.`)
      return
    }

    setMatrixA(parsedA)
    setMatrixB(parsedB)
    resetVisualization()
  }

  // the whole step list comes from the pure engine (lib/engines/strassen.ts)
  useEffect(() => {
    if (matrixA.length === 0 || matrixB.length === 0 || matrixA.length !== matrixB.length) {
      return
    }
    setSteps(generateStrassenSteps(matrixA, matrixB))
  }, [matrixA, matrixB])

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      animationRef.current = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 3000 / speed)
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false)
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [isPlaying, currentStep, steps, speed])

  const renderMatrix = (matrix: Matrix, name: string, isHighlighted = false) => {
    return (
      <div className={`flex flex-col items-center ${isHighlighted ? "ring-2 ring-primary rounded-md p-1" : ""}`}>
        <div className="text-sm font-medium mb-1">{name}</div>
        <div className="border border-gray-300 rounded-md overflow-hidden">
          {matrix.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((value, colIndex) => (
                <div
                  key={colIndex}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-r border-b border-gray-300 last:border-r-0 last-row:border-b-0 text-xs sm:text-sm"
                >
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSubMatrix = (subMatrix: SubMatrix, isHighlighted = false) => {
    return (
      <div className={`flex flex-col items-center ${isHighlighted ? "ring-2 ring-primary rounded-md p-1" : ""}`}>
        <div className="text-xs sm:text-sm font-medium mb-1">{subMatrix.name}</div>
        <div className="border border-gray-300 rounded-md overflow-hidden">
          {subMatrix.matrix.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((value, colIndex) => (
                <div
                  key={colIndex}
                  className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border-r border-b border-gray-300 last:border-r-0 last-row:border-b-0 text-xs"
                >
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderOperation = (operation: Operation) => {
    return (
      <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
        {operation.operands.map((operand, index) => (
          <React.Fragment key={index}>
            <span className="font-medium">{operand}</span>
            {index < operation.operands.length - 1 && (
              <span>
                {operation.type === "add" && <Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
                {operation.type === "subtract" && <Minus className="w-3 h-3 sm:w-4 sm:h-4" />}
                {operation.type === "multiply" && <span>×</span>}
              </span>
            )}
          </React.Fragment>
        ))}
        <span className="mx-1">=</span>
        <span className="font-medium">{operation.result}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Strassen's Matrix Multiplication</h1>

      <div className="flex flex-wrap justify-center gap-4 w-full">
        <Button onClick={generateRandomMatrices} variant="outline">
          New Matrices
        </Button>
        <Button onClick={resetVisualization} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button onClick={togglePlay} variant="outline">
          {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button onClick={stepForward} variant="outline" disabled={currentStep >= steps.length - 1}>
          <StepForward className="w-4 h-4 mr-2" />
          Step
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

      {/* Matrix size selection */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <span className="text-sm">Matrix Size:</span>
        <div className="flex gap-2">
          <Button variant={matrixSize === 2 ? "default" : "outline"} size="sm" onClick={() => handleSizeChange(2)}>
            2×2
          </Button>
          <Button variant={matrixSize === 4 ? "default" : "outline"} size="sm" onClick={() => handleSizeChange(4)}>
            4×4
          </Button>
          <Button variant={matrixSize === 8 ? "default" : "outline"} size="sm" onClick={() => handleSizeChange(8)}>
            8×8
          </Button>
        </div>
      </div>

      {/* Custom matrix input */}
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="custom">Custom Input</TabsTrigger>
        </TabsList>
        <TabsContent value="visual">{/* Visual representation - no additional content needed here */}</TabsContent>
        <TabsContent value="custom" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="matrixA">
                Matrix A ({matrixSize}×{matrixSize})
              </Label>
              <Textarea
                id="matrixA"
                value={customMatrixA}
                onChange={(e) => setCustomMatrixA(e.target.value)}
                className="font-mono"
                placeholder={`1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16`}
                rows={matrixSize}
              />
            </div>
            <div>
              <Label htmlFor="matrixB">
                Matrix B ({matrixSize}×{matrixSize})
              </Label>
              <Textarea
                id="matrixB"
                value={customMatrixB}
                onChange={(e) => setCustomMatrixB(e.target.value)}
                className="font-mono"
                placeholder={`17 18 19 20\n21 22 23 24\n25 26 27 28\n29 30 31 32`}
                rows={matrixSize}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={handleCustomMatrices}>Use Custom Matrices</Button>
          </div>
          {inputError && <p className="text-sm text-red-500 text-center">{inputError}</p>}
        </TabsContent>
      </Tabs>

      {/* Main visualization card */}
      <Card className="w-full p-4 bg-muted/30 relative overflow-hidden">
        {/* Step description */}
        <div className="absolute top-4 left-4 right-4 bg-primary/10 rounded-md p-2 text-center text-sm font-medium">
          {steps[currentStep]?.description || "Preparing visualization..."}
        </div>

        {/* Phase indicator */}
        {steps[currentStep]?.phase && (
          <div
            className={`absolute top-16 left-4 right-4 rounded-md p-1 text-center text-xs font-medium
            ${
              steps[currentStep]?.phase === "initial"
                ? "bg-blue-100 text-blue-800"
                : steps[currentStep]?.phase === "divide"
                  ? "bg-purple-100 text-purple-800"
                  : steps[currentStep]?.phase === "compute"
                    ? "bg-yellow-100 text-yellow-800"
                    : steps[currentStep]?.phase === "combine"
                      ? "bg-green-100 text-green-800"
                      : "bg-teal-100 text-teal-800"
            }`}
          >
            {steps[currentStep]?.phase === "initial"
              ? "Initial Matrices"
              : steps[currentStep]?.phase === "divide"
                ? "Divide Phase"
                : steps[currentStep]?.phase === "compute"
                  ? "Compute Phase"
                  : steps[currentStep]?.phase === "combine"
                    ? "Combine Phase"
                    : "Final Result"}
          </div>
        )}

        {/* Visualization area */}
        <div className="mt-24 mb-4">
          <AnimatePresence mode="wait">
            {steps[currentStep] && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {/* Initial phase: Show the two input matrices */}
                {steps[currentStep].phase === "initial" && steps[currentStep].matrices && (
                  <div className="flex flex-col items-center space-y-8">
                    <div className="flex flex-wrap justify-center gap-8">
                      {renderMatrix(steps[currentStep].matrices!.A, "Matrix A")}
                      <div className="flex items-center">
                        <span className="text-xl">×</span>
                      </div>
                      {renderMatrix(steps[currentStep].matrices!.B, "Matrix B")}
                    </div>
                  </div>
                )}

                {/* Divide phase: Show the matrices with quadrants */}
                {steps[currentStep].phase === "divide" &&
                  steps[currentStep].matrices &&
                  steps[currentStep].subMatrices && (
                    <div className="flex flex-col items-center space-y-8">
                      <div className="flex flex-wrap justify-center gap-12">
                        <div className="flex flex-col items-center">
                          <div className="text-sm font-medium mb-2">Matrix A</div>
                          <div className="relative border border-gray-300 rounded-md overflow-hidden">
                            {steps[currentStep].matrices!.A.map((row, rowIndex) => (
                              <div key={rowIndex} className="flex">
                                {row.map((value, colIndex) => {
                                  const isMiddleRow = rowIndex === steps[currentStep].matrices!.A.length / 2 - 1
                                  const isMiddleCol = colIndex === steps[currentStep].matrices!.A[0].length / 2 - 1

                                  return (
                                    <div
                                      key={colIndex}
                                      className={`
                                      w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center 
                                      border-r border-b border-gray-300 
                                      ${isMiddleRow ? "border-b-2 border-b-primary" : ""}
                                      ${isMiddleCol ? "border-r-2 border-r-primary" : ""}
                                      last:border-r-0 last-row:border-b-0 text-xs sm:text-sm
                                    `}
                                    >
                                      {value}
                                    </div>
                                  )
                                })}
                              </div>
                            ))}

                            {/* Quadrant labels */}
                            <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                              A11
                            </div>
                            <div className="absolute top-1/4 left-3/4 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                              A12
                            </div>
                            <div className="absolute top-3/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                              A21
                            </div>
                            <div className="absolute top-3/4 left-3/4 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                              A22
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <span className="text-xl">×</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="text-sm font-medium mb-2">Matrix B</div>
                          <div className="relative border border-gray-300 rounded-md overflow-hidden">
                            {steps[currentStep].matrices!.B.map((row, rowIndex) => (
                              <div key={rowIndex} className="flex">
                                {row.map((value, colIndex) => {
                                  const isMiddleRow = rowIndex === steps[currentStep].matrices!.B.length / 2 - 1
                                  const isMiddleCol = colIndex === steps[currentStep].matrices!.B[0].length / 2 - 1

                                  return (
                                    <div
                                      key={colIndex}
                                      className={`
                                      w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center 
                                      border-r border-b border-gray-300 
                                      ${isMiddleRow ? "border-b-2 border-b-primary" : ""}
                                      ${isMiddleCol ? "border-r-2 border-r-primary" : ""}
                                      last:border-r-0 last-row:border-b-0 text-xs sm:text-sm
                                    `}
                                    >
                                      {value}
                                    </div>
                                  )
                                })}
                              </div>
                            ))}

                            {/* Quadrant labels */}
                            <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                              B11
                            </div>
                            <div className="absolute top-1/4 left-3/4 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                              B12
                            </div>
                            <div className="absolute top-3/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                              B21
                            </div>
                            <div className="absolute top-3/4 left-3/4 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                              B22
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                        {Object.values(steps[currentStep].subMatrices!)
                          .filter((subMatrix) => subMatrix.name.startsWith("A"))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((subMatrix, index) => (
                            <div key={index}>{renderSubMatrix(subMatrix)}</div>
                          ))}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        {Object.values(steps[currentStep].subMatrices!)
                          .filter((subMatrix) => subMatrix.name.startsWith("B"))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((subMatrix, index) => (
                            <div key={index}>{renderSubMatrix(subMatrix)}</div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Compute phase: Show the computation of intermediate products */}
                {steps[currentStep].phase === "compute" && steps[currentStep].subMatrices && (
                  <div className="flex flex-col items-center space-y-6">
                    {steps[currentStep].operations && (
                      <div className="flex flex-col items-center gap-2 mb-4">
                        {steps[currentStep].operations.map((operation, index) => (
                          <div key={index} className="bg-muted/50 px-3 py-1 rounded-md">
                            {renderOperation(operation)}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {Object.entries(steps[currentStep].subMatrices!).map(([key, subMatrix], index) => (
                        <div key={index}>
                          {renderSubMatrix(subMatrix, steps[currentStep].highlightedMatrices?.includes(key))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Combine phase: Show how to combine the intermediate products */}
                {steps[currentStep].phase === "combine" && steps[currentStep].subMatrices && (
                  <div className="flex flex-col items-center space-y-6">
                    {steps[currentStep].operations && (
                      <div className="flex flex-col items-center gap-2 mb-4">
                        {steps[currentStep].operations.map((operation, index) => (
                          <div key={index} className="bg-muted/50 px-3 py-1 rounded-md">
                            {renderOperation(operation)}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      {Object.entries(steps[currentStep].subMatrices!).map(([key, subMatrix], index) => (
                        <div key={index}>
                          {renderSubMatrix(subMatrix, steps[currentStep].highlightedMatrices?.includes(key))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result phase: Show the final result */}
                {steps[currentStep].phase === "result" && (
                  <div className="flex flex-col items-center space-y-8">
                    {steps[currentStep].subMatrices && (
                      <div className="grid grid-cols-2 gap-4">
                        {Object.values(steps[currentStep].subMatrices!).map((subMatrix, index) => (
                          <div key={index}>{renderSubMatrix(subMatrix)}</div>
                        ))}
                      </div>
                    )}

                    {steps[currentStep].resultMatrix && (
                      <div className="flex flex-col items-center mt-8">
                        <div className="flex items-center gap-4">
                          <ArrowRight className="w-6 h-6 text-primary" />
                        </div>
                        {renderMatrix(steps[currentStep].resultMatrix, "Result Matrix C = A × B")}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-full mt-4">
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
      </Card>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          This visualization demonstrates Strassen's Matrix Multiplication algorithm, which reduces the number of
          multiplications needed for matrix multiplication from O(n³) to O(n^2.81).
        </p>
        <p className="mt-2">
          The algorithm divides each matrix into four quadrants, computes seven intermediate products (P1-P7), and then
          combines them to form the final product matrix.
        </p>
      </div>
    </div>
  )
}
