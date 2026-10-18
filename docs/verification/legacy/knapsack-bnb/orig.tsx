"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, RotateCcw, StepForward, StepBack, Package, X, Briefcase } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type Item = {
  id: number
  weight: number
  value: number
  ratio: number
}

type Node = {
  id: number
  level: number
  weight: number
  value: number
  bound: number
  items: number[]
  include: boolean | null
  parent: number | null
  pruned: boolean
}

type AlgorithmStep = {
  phase: "init" | "branch" | "bound" | "prune" | "update" | "complete"
  description: string
  currentNode: number
  bestNode: number | null
  bestValue: number
  nodes: Node[]
  activeNodes: number[]
}

export default function KnapsackBranchAndBound() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, weight: 2, value: 10, ratio: 5 },
    { id: 2, weight: 3, value: 15, ratio: 5 },
    { id: 3, weight: 5, value: 30, ratio: 6 },
    { id: 4, weight: 7, value: 35, ratio: 5 },
    { id: 5, weight: 1, value: 3, ratio: 3 },
  ])
  const [capacity, setCapacity] = useState(10)
  const [newItemWeight, setNewItemWeight] = useState("")
  const [newItemValue, setNewItemValue] = useState("")
  const [inputError, setInputError] = useState("")
  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [algorithmStarted, setAlgorithmStarted] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const [treeWidth, setTreeWidth] = useState(800)
  const [treeHeight, setTreeHeight] = useState(500)
  const treeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (treeContainerRef.current) {
        const width = treeContainerRef.current.clientWidth
        setTreeWidth(width)
        setTreeHeight(Math.max(500, items.length * 100))
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [items.length])

  const addItem = () => {
    if (!newItemWeight.trim() || !newItemValue.trim()) {
      setInputError("Please enter both weight and value")
      return
    }

    const weight = Number.parseInt(newItemWeight)
    const value = Number.parseInt(newItemValue)

    if (isNaN(weight) || weight <= 0) {
      setInputError("Weight must be a positive number")
      return
    }

    if (isNaN(value) || value <= 0) {
      setInputError("Value must be a positive number")
      return
    }

    setInputError("")
    const ratio = Number.parseFloat((value / weight).toFixed(2))
    setItems([...items, { id: items.length + 1, weight, value, ratio }])
    setNewItemWeight("")
    setNewItemValue("")
  }

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateCapacity = (value: string) => {
    const newCapacity = Number.parseInt(value)
    if (!isNaN(newCapacity) && newCapacity > 0) {
      setCapacity(newCapacity)
    }
  }

  const generateRandomItems = () => {
    const count = Math.floor(Math.random() * 3) + 3
    const newItems: Item[] = []

    for (let i = 0; i < count; i++) {
      const weight = Math.floor(Math.random() * 5) + 1 
      const value = Math.floor(Math.random() * 10) + 5
      const ratio = Number.parseFloat((value / weight).toFixed(2))

      newItems.push({
        id: i + 1,
        weight,
        value,
        ratio,
      })
    }

    setItems(newItems)
    setCapacity(Math.floor(Math.random() * 10) + 5) 
  }

  const calculateBound = (node: Node, remainingItems: Item[], remainingCapacity: number): number => {
    let bound = node.value
    let totalWeight = node.weight

    const sortedItems = [...remainingItems].sort((a, b) => b.ratio - a.ratio)

    for (const item of sortedItems) {
      if (totalWeight + item.weight <= capacity) {
        bound += item.value
        totalWeight += item.weight
      } else if (totalWeight < capacity) {
        const fraction = (capacity - totalWeight) / item.weight
        bound += item.value * fraction
        totalWeight = capacity
        break
      } else {
        break
      }
    }

    return Math.floor(bound)
  }

  const startAlgorithm = () => {
    if (items.length === 0) {
      setInputError("Please add at least one item")
      return
    }

    if (capacity <= 0) {
      setInputError("Capacity must be a positive number")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []

    const sortedItems = [...items].sort((a, b) => b.ratio - a.ratio)

    const rootNode: Node = {
      id: 1,
      level: 0,
      weight: 0,
      value: 0,
      bound: 0,
      items: [],
      include: null,
      parent: null,
      pruned: false,
    }

    rootNode.bound = calculateBound(rootNode, sortedItems, capacity)

    const nodes: Node[] = [rootNode]
    algorithmSteps.push({
      phase: "init",
      description: "Initialize with root node. Calculate initial bound using fractional knapsack.",
      currentNode: 1,
      bestNode: null,
      bestValue: 0,
      nodes: [...nodes],
      activeNodes: [1],
    })

    const queue: number[] = [1]
    let bestValue = 0
    let bestNode: number | null = null
    let nodeCounter = 1

    while (queue.length > 0) {
      queue.sort((a, b) => {
        const nodeA = nodes.find((n) => n.id === a)!
        const nodeB = nodes.find((n) => n.id === b)!
        return nodeB.bound - nodeA.bound
      })

      const currentNodeId = queue.shift()!
      const currentNode = nodes.find((n) => n.id === currentNodeId)!

      algorithmSteps.push({
        phase: "branch",
        description: `Select node ${currentNodeId} with highest bound (${currentNode.bound})`,
        currentNode: currentNodeId,
        bestNode,
        bestValue,
        nodes: [...nodes],
        activeNodes: [...queue, currentNodeId],
      })

      if (currentNode.bound <= bestValue) {
        currentNode.pruned = true

        algorithmSteps.push({
          phase: "prune",
          description: `Prune node ${currentNodeId} as its bound (${currentNode.bound}) is not better than current best value (${bestValue})`,
          currentNode: currentNodeId,
          bestNode,
          bestValue,
          nodes: [...nodes],
          activeNodes: [...queue],
        })

        continue
      }

      if (currentNode.level === sortedItems.length) {
        if (currentNode.value > bestValue) {
          bestValue = currentNode.value
          bestNode = currentNodeId

          algorithmSteps.push({
            phase: "update",
            description: `Update best solution: Value = ${bestValue}, Items = [${currentNode.items.join(", ")}]`,
            currentNode: currentNodeId,
            bestNode,
            bestValue,
            nodes: [...nodes],
            activeNodes: [...queue],
          })
        }

        continue
      }

      const nextItem = sortedItems[currentNode.level]

      const leftChildWeight = currentNode.weight + nextItem.weight
      if (leftChildWeight <= capacity) {
        nodeCounter++
        const leftChildId = nodeCounter

        const leftChild: Node = {
          id: leftChildId,
          level: currentNode.level + 1,
          weight: leftChildWeight,
          value: currentNode.value + nextItem.value,
          bound: 0,
          items: [...currentNode.items, nextItem.id],
          include: true,
          parent: currentNodeId,
          pruned: false,
        }

        const remainingItems = sortedItems.slice(currentNode.level + 1)
        leftChild.bound = calculateBound(leftChild, remainingItems, capacity - leftChild.weight)

        nodes.push(leftChild)

        algorithmSteps.push({
          phase: "branch",
          description: `Create left child (node ${leftChildId}): Include item ${nextItem.id}, Weight = ${leftChild.weight}, Value = ${leftChild.value}, Bound = ${leftChild.bound}`,
          currentNode: leftChildId,
          bestNode,
          bestValue,
          nodes: [...nodes],
          activeNodes: [...queue],
        })

        if (leftChild.bound > bestValue) {
          queue.push(leftChildId)

          algorithmSteps.push({
            phase: "bound",
            description: `Add node ${leftChildId} to queue as its bound (${leftChild.bound}) is better than current best value (${bestValue})`,
            currentNode: leftChildId,
            bestNode,
            bestValue,
            nodes: [...nodes],
            activeNodes: [...queue],
          })
        } else {
          leftChild.pruned = true

          algorithmSteps.push({
            phase: "prune",
            description: `Prune node ${leftChildId} as its bound (${leftChild.bound}) is not better than current best value (${bestValue})`,
            currentNode: leftChildId,
            bestNode,
            bestValue,
            nodes: [...nodes],
            activeNodes: [...queue],
          })
        }

        if (leftChild.level === sortedItems.length && leftChild.value > bestValue) {
          bestValue = leftChild.value
          bestNode = leftChildId

          algorithmSteps.push({
            phase: "update",
            description: `Update best solution: Value = ${bestValue}, Items = [${leftChild.items.join(", ")}]`,
            currentNode: leftChildId,
            bestNode,
            bestValue,
            nodes: [...nodes],
            activeNodes: [...queue],
          })
        }
      }

      nodeCounter++
      const rightChildId = nodeCounter

      const rightChild: Node = {
        id: rightChildId,
        level: currentNode.level + 1,
        weight: currentNode.weight,
        value: currentNode.value,
        bound: 0,
        items: [...currentNode.items],
        include: false,
        parent: currentNodeId,
        pruned: false,
      }

      const remainingItems = sortedItems.slice(currentNode.level + 1)
      rightChild.bound = calculateBound(rightChild, remainingItems, capacity - rightChild.weight)

      nodes.push(rightChild)

      algorithmSteps.push({
        phase: "branch",
        description: `Create right child (node ${rightChildId}): Exclude item ${nextItem.id}, Weight = ${rightChild.weight}, Value = ${rightChild.value}, Bound = ${rightChild.bound}`,
        currentNode: rightChildId,
        bestNode,
        bestValue,
        nodes: [...nodes],
        activeNodes: [...queue],
      })

      if (rightChild.bound > bestValue) {
        queue.push(rightChildId)
        algorithmSteps.push({
          phase: "bound",
          description: `Add node ${rightChildId} to queue as its bound (${rightChild.bound}) is better than current best value (${bestValue})`,
          currentNode: rightChildId,
          bestNode,
          bestValue,
          nodes: [...nodes],
          activeNodes: [...queue],
        })
      } else {
        rightChild.pruned = true

        algorithmSteps.push({
          phase: "prune",
          description: `Prune node ${rightChildId} as its bound (${rightChild.bound}) is not better than current best value (${bestValue})`,
          currentNode: rightChildId,
          bestNode,
          bestValue,
          nodes: [...nodes],
          activeNodes: [...queue],
        })
      }
    }

    if (bestNode !== null) {
      const bestNodeObj = nodes.find((n) => n.id === bestNode)!
      algorithmSteps.push({
        phase: "complete",
        description: `Algorithm complete. Best solution: Value = ${bestValue}, Weight = ${bestNodeObj.weight}, Items = [${bestNodeObj.items.join(", ")}]`,
        currentNode: bestNode,
        bestNode,
        bestValue,
        nodes: [...nodes],
        activeNodes: [],
      })
    } else {
      algorithmSteps.push({
        phase: "complete",
        description: "Algorithm complete. No solution found.",
        currentNode: 1,
        bestNode: null,
        bestValue: 0,
        nodes: [...nodes],
        activeNodes: [],
      })
    }

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

  const getNodePosition = (node: Node, totalNodes: Node[]) => {
    const maxLevel = Math.max(...totalNodes.map((n) => n.level))
    const levelWidth = treeWidth / (maxLevel + 1)

    const x = (node.level + 0.5) * levelWidth

    const nodesAtSameLevel = totalNodes.filter((n) => n.level === node.level)
    const levelHeight = treeHeight / (nodesAtSameLevel.length + 1)
    const indexAtLevel = nodesAtSameLevel.findIndex((n) => n.id === node.id)
    const y = (indexAtLevel + 1) * levelHeight

    return { x, y }
  }

  const getNodeColor = (node: Node, currentNodeId: number, bestNodeId: number | null) => {
    if (node.pruned) return "bg-red-100 dark:bg-red-900/30 border-red-500"
    if (node.id === bestNodeId) return "bg-green-100 dark:bg-green-900/30 border-green-500"
    if (node.id === currentNodeId) return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500"
    return "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
  }

  const getEdgeColor = (node: Node) => {
    if (node.pruned) return "stroke-red-300 dark:stroke-red-700"
    if (node.include === true) return "stroke-green-500 dark:stroke-green-400"
    if (node.include === false) return "stroke-gray-400 dark:stroke-gray-600"
    return "stroke-gray-300 dark:stroke-gray-700"
  }

  const renderTree = () => {
    if (!steps[currentStep]) return null

    const { nodes, currentNode, bestNode } = steps[currentStep]

    const nodePositions = new Map<number, { x: number; y: number }>()
    nodes.forEach((node) => {
      nodePositions.set(node.id, getNodePosition(node, nodes))
    })

    return (
      <div className="w-full h-[500px] bg-gray-50 dark:bg-gray-900 rounded-md relative overflow-auto">
        {/* Edges */}
        <svg className="absolute inset-0 w-full h-full">
          {nodes
            .filter((node) => node.parent !== null)
            .map((node) => {
              const parentNode = nodes.find((n) => n.id === node.parent)!
              const parentPos = nodePositions.get(parentNode.id)!
              const nodePos = nodePositions.get(node.id)!

              return (
                <line
                  key={`${parentNode.id}-${node.id}`}
                  x1={parentPos.x}
                  y1={parentPos.y}
                  x2={nodePos.x}
                  y2={nodePos.y}
                  className={`${getEdgeColor(node)} transition-all duration-300`}
                  strokeWidth={node.id === currentNode || node.id === bestNode ? 2 : 1}
                  strokeDasharray={node.include === false ? "5,5" : ""}
                />
              )
            })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = nodePositions.get(node.id)!

          return (
            <motion.div
              key={node.id}
              className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 ${getNodeColor(
                node,
                currentNode,
                bestNode,
              )} transition-all duration-300`}
              style={{
                left: pos.x - 48,
                top: pos.y - 48,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: node.id === currentNode ? 1.1 : 1,
                opacity: node.pruned ? 0.7 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xs font-semibold">Node {node.id}</div>
              <div className="text-xs">W: {node.weight}</div>
              <div className="text-xs">V: {node.value}</div>
              <div className="text-xs">B: {node.bound}</div>
              {node.include !== null && (
                <Badge variant={node.include ? "default" : "outline"} className="mt-1 text-[10px] h-4">
                  {node.include ? "Include" : "Exclude"}
                </Badge>
              )}
            </motion.div>
          )
        })}
      </div>
    )
  }

  // Render current state table
  const renderStateTable = () => {
    if (!steps[currentStep]) return null

    const { nodes, currentNode, bestNode, bestValue, activeNodes } = steps[currentStep]
    const currentNodeObj = nodes.find((n) => n.id === currentNode)!

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Current State</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Current Node</h4>
            <div className="border rounded-md p-3 bg-yellow-50 dark:bg-yellow-900/10">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Node ID:</div>
                <div className="font-medium">{currentNodeObj.id}</div>
                <div>Level:</div>
                <div className="font-medium">{currentNodeObj.level}</div>
                <div>Weight:</div>
                <div className="font-medium">
                  {currentNodeObj.weight} / {capacity}
                </div>
                <div>Value:</div>
                <div className="font-medium">{currentNodeObj.value}</div>
                <div>Bound:</div>
                <div className="font-medium">{currentNodeObj.bound}</div>
                <div>Items:</div>
                <div className="font-medium">
                  {currentNodeObj.items.length > 0 ? currentNodeObj.items.join(", ") : "None"}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Best Solution</h4>
            <div className="border rounded-md p-3 bg-green-50 dark:bg-green-900/10">
              {bestNode !== null ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Node ID:</div>
                  <div className="font-medium">{bestNode}</div>
                  <div>Value:</div>
                  <div className="font-medium">{bestValue}</div>
                  <div>Items:</div>
                  <div className="font-medium">{nodes.find((n) => n.id === bestNode)?.items.join(", ") || "None"}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No solution found yet</div>
              )}
            </div>
          </div>
        </div>

        <h4 className="text-sm font-medium mb-2">Active Nodes Queue</h4>
        <div className="border rounded-md p-3">
          {activeNodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeNodes.map((nodeId) => {
                const node = nodes.find((n) => n.id === nodeId)!
                return (
                  <Badge key={nodeId} variant="outline" className="px-2 py-1">
                    Node {nodeId} (B: {node.bound})
                  </Badge>
                )
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Queue is empty</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">0/1 Knapsack Problem - Branch and Bound</h1>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="visualization" disabled={!algorithmStarted}>
            Visualization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-4">
                <h2 className="text-lg font-semibold">Items</h2>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="1"
                      placeholder="Weight"
                      value={newItemWeight}
                      onChange={(e) => setNewItemWeight(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      min="1"
                      placeholder="Value"
                      value={newItemValue}
                      onChange={(e) => setNewItemValue(e.target.value)}
                    />
                  </div>
                  <Button className="self-end" onClick={addItem}>
                    Add Item
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="capacity">Knapsack Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={capacity}
                      onChange={(e) => updateCapacity(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="self-end" onClick={generateRandomItems}>
                    Random Items
                  </Button>
                </div>

                {inputError && (
                  <Alert variant="destructive">
                    <AlertDescription>{inputError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button onClick={startAlgorithm} disabled={items.length === 0 || capacity <= 0}>
                    Start Algorithm
                  </Button>
                  {algorithmStarted && (
                    <Button variant="outline" onClick={resetAlgorithm}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Item List</h2>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Value/Weight</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No items added yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.weight}</TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell>{item.ratio}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                disabled={algorithmStarted}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
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

              <div className="bg-primary/10 rounded-md p-2 text-center text-sm font-medium mb-4">
                {steps[currentStep]?.description || "Preparing algorithm..."}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Decision Tree</h3>
                  <div ref={treeContainerRef} className="w-full overflow-hidden">
                    {renderTree()}
                  </div>
                </div>

                <div className="space-y-4">
                  <ScrollArea className="h-[500px]">{renderStateTable()}</ScrollArea>
                </div>
              </div>

              {/* Knapsack visualization */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Knapsack Contents</h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Briefcase className="w-32 h-32 text-gray-300 dark:text-gray-700" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-sm font-medium">
                        {steps[currentStep]?.currentNode ? (
                          <>
                            <div>
                              {steps[currentStep].nodes.find((n) => n.id === steps[currentStep].currentNode)?.weight ||
                                0}
                              /{capacity}
                            </div>
                            <div className="text-xs text-muted-foreground">Weight</div>
                          </>
                        ) : (
                          <div>Empty</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {steps[currentStep]?.currentNode && (
                        <>
                          {steps[currentStep].nodes
                            .find((n) => n.id === steps[currentStep].currentNode)
                            ?.items.map((itemId) => {
                              const item = items.find((i) => i.id === itemId)!
                              return (
                                <motion.div
                                  key={item.id}
                                  className="p-3 border rounded-md bg-green-100 dark:bg-green-900/30 border-green-500"
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 opacity-70" />
                                    <span className="font-medium">Item {item.id}</span>
                                  </div>
                                  <div className="text-sm mt-1">
                                    <div>Weight: {item.weight}</div>
                                    <div>Value: {item.value}</div>
                                  </div>
                                </motion.div>
                              )
                            })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(currentStep / (steps.length - 1)) * 100}%`,
                    }}
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
          The 0/1 Knapsack Problem is a classic optimization problem where we need to select items to maximize value
          while keeping the total weight under a capacity limit. Each item can either be included (1) or excluded (0).
        </p>
        <p className="mt-2">
          Branch and Bound is an algorithm design paradigm for solving combinatorial optimization problems. It
          systematically enumerates candidate solutions by means of state space search: the set of candidate solutions
          is thought of as forming a rooted tree with the full set at the root.
        </p>
        <p className="mt-2">
          The algorithm explores branches of this tree, which represent subsets of the solution set. Before enumerating
          the candidate solutions of a branch, the branch is checked against upper and lower estimated bounds on the
          optimal solution, and is discarded if it cannot produce a better solution than the best one found so far.
        </p>
      </div>
    </div>
  )
}
