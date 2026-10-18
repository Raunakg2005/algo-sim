"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, StepForward, StepBack, Plus, Minus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

import { generateMatrixChainSteps, parseDimensions, validateMatrixCount, type MatrixChainStep } from "@/lib/engines/matrix-chain"

type AlgorithmStep = MatrixChainStep

export default function MatrixChainMultiplication() {
  const [numMatrices, setNumMatrices] = useState<number>(4)
  const [dimensions, setDimensions] = useState<number[]>([30, 35, 15, 5, 10])
  const [inputError, setInputError] = useState<string>("")
  const [customDimensions, setCustomDimensions] = useState<string>("")

  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [algorithmStarted, setAlgorithmStarted] = useState<boolean>(false)
  const animationRef = useRef<number | null>(null)

  const [containerWidth, setContainerWidth] = useState<number>(800)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }

    updateContainerWidth()
    window.addEventListener("resize", updateContainerWidth)
    return () => window.removeEventListener("resize", updateContainerWidth)
  }, [])

  const generateRandomDimensions = () => {
    const n = Math.floor(Math.random() * 4) + 3 
    setNumMatrices(n)

    const dims: number[] = []
    for (let i = 0; i <= n; i++) {
      dims.push(Math.floor(Math.random() * 40) + 5) 
    }

    setDimensions(dims)
    setCustomDimensions(dims.join(", "))
    resetAlgorithm()
  }

  const updateDimensions = (newNumMatrices: number) => {
    const countError = validateMatrixCount(newNumMatrices)
    if (countError) {
      setInputError(countError)
      return
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
  }

  const handleCustomDimensions = () => {
    try {
      const dims = parseDimensions(customDimensions)

      if (dims.length < numMatrices + 1) {
        setInputError(`Please provide ${numMatrices + 1} dimensions for ${numMatrices} matrices`)
        return
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
  }
  const startAlgorithm = () => {
    if (dimensions.length < numMatrices + 1) {
      setInputError(`Please provide ${numMatrices + 1} dimensions for ${numMatrices} matrices`)
      return
    }

    setInputError("")
    setAlgorithmStarted(true)

    // the whole step list comes from the pure engine (lib/engines/matrix-chain.ts)
    setSteps(generateMatrixChainSteps(dimensions.slice(0, numMatrices + 1)))
    setCurrentStep(0)
  }

  const resetAlgorithm = () => {
    setAlgorithmStarted(false)
    setSteps([])
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

  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      animationRef.current = window.setTimeout(() => {
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

  const isCellHighlighted = (i: number, j: number): boolean => {
    if (!steps[currentStep]?.highlightCells) return false
    return steps[currentStep].highlightCells.some((cell) => cell.i === i && cell.j === j)
  }

  const getCellBackground = (i: number, j: number): string => {
    if (isCellHighlighted(i, j)) {
      if (steps[currentStep]?.i === i && steps[currentStep]?.j === j) {
        return "bg-yellow-100 dark:bg-yellow-900"
      }
      return "bg-blue-100 dark:bg-blue-900/30"
    }
    return ""
  }

  const renderMatrixChain = () => {
    return (
      <div className="flex flex-wrap justify-center gap-4 my-4">
        {Array.from({ length: numMatrices }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="w-16 h-20 border-2 border-gray-400 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <span className="font-bold">M{idx + 1}</span>
            </div>
            <div className="text-center text-xs mt-2">
              {dimensions[idx]} × {dimensions[idx + 1]}
            </div>
            {idx < numMatrices - 1 && <div className="mt-2 text-xl">×</div>}
          </div>
        ))}
      </div>
    )
  }

  const renderCostMatrix = () => {
    if (!steps[currentStep]?.costMatrix) return null

    const costMatrix = steps[currentStep].costMatrix

    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Cost Matrix</h3>
        <ScrollArea className="h-[300px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                {Array.from({ length: numMatrices }).map((_, idx) => (
                  <TableHead key={idx} className="text-center w-16">
                    M{idx + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costMatrix.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">M{i + 1}</TableCell>
                  {row.map((cost, j) => (
                    <TableCell key={j} className={`text-center ${getCellBackground(i, j)}`}>
                      {j < i ? "-" : cost === Number.POSITIVE_INFINITY ? "∞" : cost}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    )
  }

  const renderSplitMatrix = () => {
    if (!steps[currentStep]?.splitMatrix) return null

    const splitMatrix = steps[currentStep].splitMatrix

    return (
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Split Matrix</h3>
        <ScrollArea className="h-[300px] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                {Array.from({ length: numMatrices }).map((_, idx) => (
                  <TableHead key={idx} className="text-center w-16">
                    M{idx + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {splitMatrix.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">M{i + 1}</TableCell>
                  {row.map((split, j) => (
                    <TableCell key={j} className={`text-center ${getCellBackground(i, j)}`}>
                      {j < i ? "-" : j === i ? "-" : split + 1}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    )
  }

  const renderParenthesization = () => {
    if (!steps[currentStep]?.parenthesization) return null

    return (
      <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-md text-center">
        <h3 className="text-lg font-semibold mb-2">Optimal Parenthesization</h3>
        <div className="text-xl font-mono overflow-x-auto p-2">{steps[currentStep].parenthesization}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Matrix Chain Multiplication - Dynamic Programming</h1>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="visualization" disabled={!algorithmStarted}>
            Visualization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Matrix Chain Configuration</h2>

              <div className="space-y-2">
                <Label htmlFor="numMatrices">Number of Matrices</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="numMatrices"
                    type="number"
                    min={2}
                    max={10}
                    value={numMatrices}
                    onChange={(e) => updateDimensions(Number(e.target.value))}
                    disabled={algorithmStarted}
                  />
                  <Button aria-label="Fewer matrices"
                    variant="outline"
                    size="icon"
                    onClick={() => updateDimensions(Math.max(2, numMatrices - 1))}
                    disabled={algorithmStarted}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button aria-label="More matrices"
                    variant="outline"
                    size="icon"
                    onClick={() => updateDimensions(Math.min(10, numMatrices + 1))}
                    disabled={algorithmStarted}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Matrix Dimensions (comma-separated, {numMatrices + 1} values needed)</Label>
                <div className="flex gap-2">
                  <Input
                    id="dimensions"
                    value={customDimensions}
                    onChange={(e) => setCustomDimensions(e.target.value)}
                    placeholder="e.g., 30, 35, 15, 5, 10"
                    disabled={algorithmStarted}
                  />
                  <Button onClick={handleCustomDimensions} disabled={algorithmStarted}>
                    Apply
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  For {numMatrices} matrices, provide {numMatrices + 1} dimensions where matrix i has dimensions p[i-1]
                  × p[i]
                </p>
              </div>

              <div className="flex justify-between">
                <Button onClick={generateRandomDimensions} variant="outline" disabled={algorithmStarted}>
                  Random Dimensions
                </Button>
                {!algorithmStarted ? (
                  <Button onClick={startAlgorithm}>Start Algorithm</Button>
                ) : (
                  <Button variant="outline" onClick={resetAlgorithm}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                )}
              </div>

              {inputError && (
                <Alert variant="destructive">
                  <AlertDescription>{inputError}</AlertDescription>
                </Alert>
              )}
            </div>
          </Card>

          {/* Matrix Chain Preview */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Matrix Chain Preview</h2>
            <div ref={containerRef} className="w-full overflow-x-auto" style={{ minWidth: "900px" }}>
              {renderMatrixChain()}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          {algorithmStarted && (
            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap justify-center gap-4 w-full mb-4">
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

              {/* Algorithm step description */}
              <Alert variant="default" className="bg-primary/10">
                <AlertDescription>{steps[currentStep]?.description || "Preparing algorithm..."}</AlertDescription>
              </Alert>

              {/* Matrix chain visualization */}
              <div className="w-full overflow-x-auto">{renderMatrixChain()}</div>

              {/* Current computation details */}
              {steps[currentStep]?.phase === "compute" &&
                steps[currentStep]?.i !== undefined &&
                steps[currentStep]?.j !== undefined && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                    <h3 className="font-semibold mb-2">Current Computation</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Computing cost for multiplying matrices {steps[currentStep].i! + 1} to{" "}
                        {steps[currentStep].j! + 1}
                      </p>
                      {steps[currentStep]?.k !== undefined && (
                        <p>
                          Trying split at matrix {steps[currentStep].k! + 1}: (M{steps[currentStep].i! + 1}...M
                          {steps[currentStep].k! + 1}) × (M{steps[currentStep].k! + 2}...M{steps[currentStep].j! + 1})
                        </p>
                      )}
                      {steps[currentStep]?.currentCost !== undefined && (
                        <p>Current cost: {steps[currentStep].currentCost}</p>
                      )}
                      {steps[currentStep]?.minCost !== undefined &&
                        steps[currentStep]?.minCost !== Number.POSITIVE_INFINITY && (
                          <p>Minimum cost so far: {steps[currentStep].minCost}</p>
                        )}
                      {steps[currentStep]?.bestK !== undefined && (
                        <p>Best split point so far: Matrix {steps[currentStep].bestK! + 1}</p>
                      )}
                    </div>
                  </div>
                )}

              {/* DP Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderCostMatrix()}
                {renderSplitMatrix()}
              </div>

              {/* Parenthesization */}
              {renderParenthesization()}

              {/* Progress bar */}
              <div className="w-full mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
          )}
        </TabsContent>
      </Tabs>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          Matrix Chain Multiplication is a classic dynamic programming problem that determines the most efficient way to
          multiply a chain of matrices.
        </p>
        <p className="mt-2">
          The goal is to minimize the total number of scalar multiplications needed to compute the product of matrices.
          Since matrix multiplication is associative, we can parenthesize the product in different ways, and each way
          may require a different number of operations.
        </p>
        <p className="mt-2">
          This visualization demonstrates the dynamic programming approach to solving the Matrix Chain Multiplication
          problem. The algorithm works by filling a table where each cell m[i,j] represents the minimum cost of
          multiplying matrices i through j. The split matrix keeps track of the optimal split point k for each
          subproblem.
        </p>
      </div>
    </div>
  )
}
