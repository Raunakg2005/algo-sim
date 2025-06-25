"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, StepForward, StepBack } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type SubsetState = {
  include: boolean
  index: number
  currentSum: number
  remainingSum: number
  currentSubset: number[]
}

type TreeNode = {
  id: string
  parentId: string | null
  level: number
  index: number
  include: boolean
  sum: number
  subset: number[]
  isLeaf: boolean
  isSuccess: boolean
  isFailure: boolean
  isBacktracked: boolean
  children: string[]
}

type AlgorithmStep = {
  phase: "init" | "decision" | "backtrack" | "success" | "complete"
  description: string
  currentIndex: number
  currentSum: number
  remainingTarget: number
  currentSubset: number[]
  treeState: { [key: string]: TreeNode }
  currentNodeId: string
  previousNodeId?: string
  solutions: number[][]
}

export default function SumOfSubsets() {
  const [numbers, setNumbers] = useState<number[]>([2, 4, 6, 8, 10])
  const [targetSum, setTargetSum] = useState<number>(16)
  const [numbersInput, setNumbersInput] = useState<string>("2, 4, 6, 8, 10")
  const [targetSumInput, setTargetSumInput] = useState<string>("16")
  const [inputError, setInputError] = useState<string>("")

  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [algorithmStarted, setAlgorithmStarted] = useState<boolean>(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const [treeWidth, setTreeWidth] = useState<number>(800)
  const [treeHeight, setTreeHeight] = useState<number>(500)
  const treeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (treeContainerRef.current) {
        const width = treeContainerRef.current.clientWidth
        setTreeWidth(width)
        setTreeHeight(Math.max(500, width * 0.6))
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const parseInput = () => {
    try {
      setInputError("")

      const parsedNumbers = numbersInput
        .split(",")
        .map((n) => n.trim())
        .filter((n) => n !== "")
        .map((n) => {
          const num = Number.parseInt(n)
          if (isNaN(num)) {
            throw new Error(`"${n}" is not a valid number`)
          }
          return num
        })

      if (parsedNumbers.length === 0) {
        throw new Error("Please enter at least one number")
      }

      if (parsedNumbers.length > 10) {
        throw new Error("Please enter 10 or fewer numbers for better visualization")
      }

      const parsedTargetSum = Number.parseInt(targetSumInput)
      if (isNaN(parsedTargetSum)) {
        throw new Error("Target sum must be a valid number")
      }

      setNumbers(parsedNumbers)
      setTargetSum(parsedTargetSum)
      return true
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message)
      } else {
        setInputError("An unknown error occurred")
      }
      return false
    }
  }

  const generateRandomInput = () => {
    const count = Math.floor(Math.random() * 4) + 4
    const randomNumbers: number[] = []

    for (let i = 0; i < count; i++) {
      randomNumbers.push(Math.floor(Math.random() * 20) + 1)
    }

    randomNumbers.sort((a, b) => a - b)

    const subsetSize = Math.floor(Math.random() * count) + 1
    const indices = new Array(count).fill(0).map((_, i) => i)

    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }

    const selectedIndices = indices.slice(0, subsetSize)
    const randomTargetSum = selectedIndices.reduce((sum, i) => sum + randomNumbers[i], 0)

    setNumbers(randomNumbers)
    setTargetSum(randomTargetSum)
    setNumbersInput(randomNumbers.join(", "))
    setTargetSumInput(randomTargetSum.toString())
  }

  const startAlgorithm = () => {
    if (!parseInput()) {
      return
    }

    setAlgorithmStarted(true)

    const sortedNumbers = [...numbers].sort((a, b) => a - b)
    setNumbers(sortedNumbers)
    setNumbersInput(sortedNumbers.join(", "))

    const algorithmSteps: AlgorithmStep[] = []
    const solutions: number[][] = []

    const rootNode: TreeNode = {
      id: "root",
      parentId: null,
      level: 0,
      index: -1,
      include: false,
      sum: 0,
      subset: [],
      isLeaf: false,
      isSuccess: false,
      isFailure: false,
      isBacktracked: false,
      children: [],
    }

    const treeState: { [key: string]: TreeNode } = {
      root: rootNode,
    }

    algorithmSteps.push({
      phase: "init",
      description: "Initialize with empty subset. Target sum: " + targetSum,
      currentIndex: -1,
      currentSum: 0,
      remainingTarget: targetSum,
      currentSubset: [],
      treeState,
      currentNodeId: "root",
      solutions: [],
    })

    const generateSteps = (
      index: number,
      currentSum: number,
      currentSubset: number[],
      nodeId: string,
      parentNodeId: string | null,
    ) => {
      if (index === sortedNumbers.length) {
        if (currentSum === targetSum) {
          solutions.push([...currentSubset])

          treeState[nodeId] = {
            ...treeState[nodeId],
            isLeaf: true,
            isSuccess: true,
          }

          algorithmSteps.push({
            phase: "success",
            description: `Found a solution! Subset ${currentSubset.join(", ")} sums to ${targetSum}`,
            currentIndex: index,
            currentSum,
            remainingTarget: targetSum - currentSum,
            currentSubset: [...currentSubset],
            treeState: JSON.parse(JSON.stringify(treeState)),
            currentNodeId: nodeId,
            previousNodeId: parentNodeId || undefined,
            solutions: [...solutions],
          })
        } else {
          treeState[nodeId] = {
            ...treeState[nodeId],
            isLeaf: true,
            isFailure: true,
          }

          algorithmSteps.push({
            phase: "backtrack",
            description: `Not a solution. Sum ${currentSum} ≠ ${targetSum}. Backtracking...`,
            currentIndex: index,
            currentSum,
            remainingTarget: targetSum - currentSum,
            currentSubset: [...currentSubset],
            treeState: JSON.parse(JSON.stringify(treeState)),
            currentNodeId: nodeId,
            previousNodeId: parentNodeId || undefined,
            solutions: [...solutions],
          })
        }
        return
      }

      const remainingSum = sortedNumbers.slice(index + 1).reduce((sum, num) => sum + num, 0)

      if (currentSum + sortedNumbers[index] <= targetSum) {
        const includeNodeId = `${nodeId}-include-${index}`

        treeState[includeNodeId] = {
          id: includeNodeId,
          parentId: nodeId,
          level: treeState[nodeId].level + 1,
          index,
          include: true,
          sum: currentSum + sortedNumbers[index],
          subset: [...currentSubset, sortedNumbers[index]],
          isLeaf: false,
          isSuccess: false,
          isFailure: false,
          isBacktracked: false,
          children: [],
        }

        treeState[nodeId].children.push(includeNodeId)

        algorithmSteps.push({
          phase: "decision",
          description: `Include number ${sortedNumbers[index]} at index ${index}`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: includeNodeId,
          previousNodeId: nodeId,
          solutions: [...solutions],
        })

        generateSteps(
          index + 1,
          currentSum + sortedNumbers[index],
          [...currentSubset, sortedNumbers[index]],
          includeNodeId,
          nodeId,
        )

        treeState[includeNodeId].isBacktracked = true
      } else {
        algorithmSteps.push({
          phase: "decision",
          description: `Cannot include ${sortedNumbers[index]} as it would exceed the target sum`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: nodeId,
          solutions: [...solutions],
        })
      }

      if (currentSum + remainingSum - sortedNumbers[index] >= targetSum) {
        const excludeNodeId = `${nodeId}-exclude-${index}`

        treeState[excludeNodeId] = {
          id: excludeNodeId,
          parentId: nodeId,
          level: treeState[nodeId].level + 1,
          index,
          include: false,
          sum: currentSum,
          subset: [...currentSubset],
          isLeaf: false,
          isSuccess: false,
          isFailure: false,
          isBacktracked: false,
          children: [],
        }

        treeState[nodeId].children.push(excludeNodeId)

        algorithmSteps.push({
          phase: "decision",
          description: `Exclude number ${sortedNumbers[index]} at index ${index}`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: excludeNodeId,
          previousNodeId: nodeId,
          solutions: [...solutions],
        })

        generateSteps(index + 1, currentSum, [...currentSubset], excludeNodeId, nodeId)

        treeState[excludeNodeId].isBacktracked = true
      } else {
        algorithmSteps.push({
          phase: "decision",
          description: `Cannot exclude ${sortedNumbers[index]} as the remaining sum would be insufficient`,
          currentIndex: index,
          currentSum,
          remainingTarget: targetSum - currentSum,
          currentSubset: [...currentSubset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: nodeId,
          solutions: [...solutions],
        })
      }

      if (parentNodeId) {
        algorithmSteps.push({
          phase: "backtrack",
          description: `Backtracking from index ${index}...`,
          currentIndex: index - 1,
          currentSum: treeState[parentNodeId].sum,
          remainingTarget: targetSum - treeState[parentNodeId].sum,
          currentSubset: [...treeState[parentNodeId].subset],
          treeState: JSON.parse(JSON.stringify(treeState)),
          currentNodeId: parentNodeId,
          previousNodeId: nodeId,
          solutions: [...solutions],
        })
      }
    }

    generateSteps(0, 0, [], "root", null)

    algorithmSteps.push({
      phase: "complete",
      description:
        solutions.length > 0
          ? `Algorithm complete. Found ${solutions.length} solution(s).`
          : "Algorithm complete. No solutions found.",
      currentIndex: sortedNumbers.length,
      currentSum: 0,
      remainingTarget: targetSum,
      currentSubset: [],
      treeState: JSON.parse(JSON.stringify(treeState)),
      currentNodeId: "root",
      solutions,
    })

    setSteps(algorithmSteps)
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

  const getNodeColor = (node: TreeNode, isCurrentNode: boolean) => {
    if (isCurrentNode) return "bg-yellow-500"
    if (node.isSuccess) return "bg-green-500"
    if (node.isFailure) return "bg-red-500"
    if (node.isBacktracked) return "bg-gray-400"
    return "bg-blue-500"
  }

  const getNodeBorder = (node: TreeNode, isCurrentNode: boolean) => {
    if (isCurrentNode) return "ring-2 ring-yellow-300"
    if (node.isSuccess) return "ring-2 ring-green-300"
    if (node.isFailure) return "ring-2 ring-red-300"
    return ""
  }

  const getEdgeColor = (parentNode: TreeNode, childNode: TreeNode, isCurrentPath: boolean) => {
    if (isCurrentPath) return "stroke-yellow-400"
    if (childNode.isSuccess) return "stroke-green-400"
    if (childNode.isFailure) return "stroke-red-400"
    if (childNode.isBacktracked) return "stroke-gray-400"
    return "stroke-blue-400"
  }

  const calculateNodePositions = () => {
    if (!steps[currentStep]) return {}

    const treeState = steps[currentStep].treeState
    const positions: { [key: string]: { x: number; y: number } } = {}

    const levelNodes: { [level: number]: string[] } = {}

    Object.values(treeState).forEach((node) => {
      if (!levelNodes[node.level]) {
        levelNodes[node.level] = []
      }
      levelNodes[node.level].push(node.id)
    })

    const maxLevel = Math.max(...Object.keys(levelNodes).map(Number))
    const levelHeight = treeHeight / (maxLevel + 2)

    Object.entries(levelNodes).forEach(([level, nodeIds]) => {
      const levelWidth = treeWidth / (nodeIds.length + 1)

      nodeIds.forEach((nodeId, index) => {
        positions[nodeId] = {
          x: levelWidth * (index + 1),
          y: levelHeight * (Number(level) + 1),
        }
      })
    })

    return positions
  }

  const getPathToNode = (nodeId: string) => {
    if (!steps[currentStep]) return []

    const treeState = steps[currentStep].treeState
    const path: string[] = []

    let currentId = nodeId
    while (currentId) {
      path.unshift(currentId)
      const parentId = treeState[currentId]?.parentId
      if (!parentId) break
      currentId = parentId
    }

    return path
  }

const renderTree = () => {
    if (!steps[currentStep]) return null

    const treeState = steps[currentStep].treeState
    const currentNodeId = steps[currentStep].currentNodeId
    const previousNodeId = steps[currentStep].previousNodeId
    const nodePositions = calculateNodePositions()
    const currentPath = getPathToNode(currentNodeId)

    return (
        <div className="relative w-full h-full" style={{ transform: "translateX(150px)" }}>
            {/* Edges */}
            <svg className="absolute inset-0 w-full h-full">
                {Object.values(treeState).map((node) => {
                    if (!node.parentId) return null

                    const parent = treeState[node.parentId]
                    const parentPos = nodePositions[node.parentId]
                    const nodePos = nodePositions[node.id]

                    if (!parentPos || !nodePos) return null

                    const isCurrentPath = currentPath.includes(node.id) && currentPath.includes(node.parentId)
                    const isTransition =
                        (node.id === currentNodeId && parent.id === previousNodeId) ||
                        (node.id === previousNodeId && parent.id === currentNodeId)

                    return (
                        <line
                            key={`${node.parentId}-${node.id}`}
                            x1={parentPos.x}
                            y1={parentPos.y}
                            x2={nodePos.x}
                            y2={nodePos.y}
                            className={`${getEdgeColor(parent, node, isCurrentPath)} transition-all duration-300`}
                            strokeWidth={isCurrentPath ? 2 : 1}
                            strokeDasharray={node.isBacktracked ? "5,5" : "none"}
                        />
                    )
                })}
            </svg>

        {/* Nodes */}
        {Object.values(treeState).map((node) => {
          const pos = nodePositions[node.id]
          if (!pos) return null

          const isCurrentNode = node.id === currentNodeId
          const nodeColor = getNodeColor(node, isCurrentNode)
          const nodeBorder = getNodeBorder(node, isCurrentNode)

          return (
            <motion.div
              key={node.id}
              className={`absolute w-12 h-12 rounded-full flex items-center justify-center ${nodeColor} ${nodeBorder} transition-colors duration-300 text-white text-xs`}
              style={{
                left: pos.x - 24,
                top: pos.y - 24,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {node.id === "root" ? (
                "Start"
              ) : (
                <div className="flex flex-col items-center">
                  <div>{node.include ? "Include" : "Exclude"}</div>
                  <div>{numbers[node.index]}</div>
                </div>
              )}

              {/* Sum label */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white bg-gray-800 px-1 rounded">
                Sum: {node.sum}
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Sum of Subsets - Backtracking Visualization</h1>

      <Card className="w-full p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-4">
            <h2 className="text-lg font-semibold">Input</h2>
            <div className="space-y-2">
              <Label htmlFor="numbers">Numbers (comma-separated)</Label>
              <Input
                id="numbers"
                placeholder="e.g., 2, 4, 6, 8, 10"
                value={numbersInput}
                onChange={(e) => setNumbersInput(e.target.value)}
                disabled={algorithmStarted}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetSum">Target Sum</Label>
              <Input
                id="targetSum"
                placeholder="e.g., 16"
                value={targetSumInput}
                onChange={(e) => setTargetSumInput(e.target.value)}
                disabled={algorithmStarted}
              />
            </div>

            {inputError && (
              <Alert variant="destructive">
                <AlertDescription>{inputError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={generateRandomInput} disabled={algorithmStarted}>
                Random Input
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
          </div>

          <div className="flex-1 space-y-4">
            <h2 className="text-lg font-semibold">Current State</h2>

            {algorithmStarted && steps.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Current Subset</Label>
                    <div className="p-2 border rounded-md min-h-[40px] flex flex-wrap gap-1">
                      {steps[currentStep].currentSubset.length === 0 ? (
                        <span className="text-muted-foreground">Empty</span>
                      ) : (
                        steps[currentStep].currentSubset.map((num, i) => (
                          <Badge key={i} variant="secondary">
                            {num}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Current Sum / Target</Label>
                    <div className="p-2 border rounded-md min-h-[40px]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">{steps[currentStep].currentSum}</span>
                        <span>/</span>
                        <span className="font-medium">{targetSum}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Solutions Found ({steps[currentStep].solutions.length})</Label>
                  <ScrollArea className="h-[80px] border rounded-md p-2">
                    {steps[currentStep].solutions.length === 0 ? (
                      <div className="text-muted-foreground">No solutions found yet</div>
                    ) : (
                      <div className="space-y-2">
                        {steps[currentStep].solutions.map((solution, i) => (
                          <div key={i} className="flex flex-wrap gap-1">
                            {solution.map((num, j) => (
                              <Badge key={j} variant="outline" className="bg-green-100">
                                {num}
                              </Badge>
                            ))}
                            <span className="text-muted-foreground ml-2">
                              (Sum: {solution.reduce((a, b) => a + b, 0)})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Visualization */}
      {algorithmStarted && steps.length > 0 && (
        <Card className="w-full p-4 bg-muted/30 relative overflow-hidden">
          {/* Algorithm controls */}
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
          <div className="bg-primary/10 rounded-md p-2 text-center text-sm font-medium mb-4">
            {steps[currentStep]?.description || "Preparing algorithm..."}
          </div>

          {/* Tree visualization */}
          <div ref={treeContainerRef} className="w-full h-[500px] bg-gray-900 rounded-md relative overflow-hidden">
            {renderTree()}
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
      )}

      {/* Legend */}
      <Card className="w-full p-4">
        <h2 className="text-lg font-semibold mb-2">Legend</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm">Unexplored Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Current Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm">Solution Found</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm">Dead End</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400"></div>
            <span className="text-sm">Backtracked</span>
          </div>
        </div>
      </Card>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          The Sum of Subsets problem is a classic backtracking problem where we need to find all subsets of a given set
          that sum up to a target value.
        </p>
        <p className="mt-2">
          The backtracking algorithm works by making a series of decisions - for each number, we either include it in
          our subset or exclude it. If at any point we find that our current path cannot lead to a solution (either the
          sum exceeds the target or the remaining numbers are insufficient), we backtrack and try a different path.
        </p>
        <p className="mt-2">
          This visualization shows the decision tree of the backtracking process, with each node representing a decision
          to include or exclude a number. Green nodes indicate successful solutions, red nodes indicate dead ends, and
          gray nodes indicate paths that have been backtracked.
        </p>
      </div>
    </div>
  )
}
