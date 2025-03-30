// graph size issue
"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, StepForward, StepBack, Plus, Minus, BookOpen } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Node = {
  id: string
  label: string
  x: number
  y: number
  color: number | null
}

type Edge = {
  source: string
  target: string
}

type Graph = {
  nodes: Node[]
  edges: Edge[]
}

type AlgorithmStep = {
  phase: "init" | "try" | "conflict" | "assign" | "backtrack" | "complete"
  description: string
  currentNodeId: string | null
  conflictNodeId: string | null
  nodeColors: { [key: string]: number | null }
  previousNodeId?: string | null
}

const COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
]

const COLOR_NAMES = ["Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Indigo", "Orange", "Teal", "Cyan"]

export default function GraphColoring() {
  const [graph, setGraph] = useState<Graph>({
    nodes: [],
    edges: [],
  })

  const [numNodes, setNumNodes] = useState<number>(5)
  const [numColors, setNumColors] = useState<number>(3)
  const [newEdgeSource, setNewEdgeSource] = useState<string | null>(null)
  const [newEdgeTarget, setNewEdgeTarget] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string>("")

  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [algorithmStarted, setAlgorithmStarted] = useState<boolean>(false)
  const [solutions, setSolutions] = useState<{ [key: string]: number }[]>([])
  const [currentSolution, setCurrentSolution] = useState<number>(0)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const [graphWidth, setGraphWidth] = useState<number>(600)
  const [graphHeight, setGraphHeight] = useState<number>(400)
  const graphContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const width = graphContainerRef.current.clientWidth
        const height = Math.max(400, width * 0.6) 
        setGraphWidth(width)
        setGraphHeight(height)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const generateGraph = () => {
    if (numNodes < 2) {
      setInputError("Please specify at least 2 nodes")
      return
    }

    if (numNodes > 10) {
      setInputError("Please specify 10 or fewer nodes for better visualization")
      return
    }

    if (numColors < 1) {
      setInputError("Please specify at least 1 color")
      return
    }

    if (numColors > 10) {
      setInputError("Please specify 10 or fewer colors")
      return
    }

    setInputError("")

    const nodes: Node[] = []
    const nodeRadius = 30
    const padding = nodeRadius + 20

    const centerX = graphWidth / 2
    const centerY = graphHeight / 2
    const radius = Math.min(graphWidth, graphHeight) / 2 - padding

    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      const label = String.fromCharCode(65 + i) 

      nodes.push({
        id: `node-${label}`,
        label,
        x,
        y,
        color: null,
      })
    }

    setGraph({
      nodes,
      edges: [],
    })

    resetAlgorithm()
  }

  const generateRandomGraph = () => {
    const randomNodes = Math.floor(Math.random() * 6) + 3
    setNumNodes(randomNodes)

    const randomColors = Math.floor(Math.random() * 3) + 2
    setNumColors(randomColors)

    const nodes: Node[] = []
    const nodeRadius = 30
    const padding = nodeRadius + 20

    const centerX = graphWidth / 2
    const centerY = graphHeight / 2
    const radius = Math.min(graphWidth, graphHeight) / 2 - padding

    for (let i = 0; i < randomNodes; i++) {
      const angle = (i / randomNodes) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      const label = String.fromCharCode(65 + i) 

      nodes.push({
        id: `node-${label}`,
        label,
        x,
        y,
        color: null,
      })
    }

    const edges: Edge[] = []
    const maxEdges = (randomNodes * (randomNodes - 1)) / 2
    const edgeCount = Math.floor(Math.random() * (maxEdges * 0.4) + maxEdges * 0.3)

    for (let i = 0; i < edgeCount; i++) {
      let source: number, target: number
      do {
        source = Math.floor(Math.random() * randomNodes)
        target = Math.floor(Math.random() * randomNodes)
      } while (
        source === target ||
        edges.some(
          (e) =>
            (e.source === nodes[source].id && e.target === nodes[target].id) ||
            (e.source === nodes[target].id && e.target === nodes[source].id),
        )
      )

      edges.push({
        source: nodes[source].id,
        target: nodes[target].id,
      })
    }

    setGraph({
      nodes,
      edges,
    })

    resetAlgorithm()
  }

  const addEdge = () => {
    if (!newEdgeSource || !newEdgeTarget) {
      setInputError("Please select both source and target nodes")
      return
    }

    if (newEdgeSource === newEdgeTarget) {
      setInputError("Source and target nodes must be different")
      return
    }

    if (
      graph.edges.some(
        (edge) =>
          (edge.source === newEdgeSource && edge.target === newEdgeTarget) ||
          (edge.source === newEdgeTarget && edge.target === newEdgeSource),
      )
    ) {
      setInputError("An edge between these nodes already exists")
      return
    }

    setInputError("")

    const newEdge: Edge = {
      source: newEdgeSource,
      target: newEdgeTarget,
    }

    setGraph((prev) => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }))

    setNewEdgeSource(null)
    setNewEdgeTarget(null)
  }

  const removeEdge = (source: string, target: string) => {
    const updatedEdges = graph.edges.filter(
      (edge) =>
        !(edge.source === source && edge.target === target) && !(edge.source === target && edge.target === source),
    )

    setGraph((prev) => ({
      ...prev,
      edges: updatedEdges,
    }))
  }

  const startAlgorithm = () => {
    if (graph.nodes.length === 0) {
      setInputError("Please generate a graph first")
      return
    }

    if (graph.edges.length === 0) {
      setInputError("Please add at least one edge to the graph")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []
    const allSolutions: { [key: string]: number }[] = []

    const initialNodeColors: { [key: string]: number | null } = {}
    graph.nodes.forEach((node) => {
      initialNodeColors[node.id] = null
    })

    algorithmSteps.push({
      phase: "init",
      description: "Initialize graph with no colors assigned",
      currentNodeId: null,
      conflictNodeId: null,
      nodeColors: { ...initialNodeColors },
    })

    const isColorValid = (
      nodeId: string,
      color: number,
      nodeColors: { [key: string]: number | null },
    ): [boolean, string | null] => {
      const adjacentNodes = graph.edges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .map((edge) => (edge.source === nodeId ? edge.target : edge.source))

      for (const adjNodeId of adjacentNodes) {
        if (nodeColors[adjNodeId] === color) {
          return [false, adjNodeId]
        }
      }

      return [true, null]
    }

    const solveGraphColoring = (
      nodeIndex: number,
      nodeColors: { [key: string]: number | null },
      steps: AlgorithmStep[],
    ): boolean => {
      if (nodeIndex >= graph.nodes.length) {
        allSolutions.push({ ...nodeColors })

        steps.push({
          phase: "complete",
          description: `Solution found! All nodes colored successfully using ${numColors} colors.`,
          currentNodeId: null,
          conflictNodeId: null,
          nodeColors: { ...nodeColors },
        })

        return true
      }
      const currentNode = graph.nodes[nodeIndex]
      steps.push({
        phase: "try",
        description: `Considering node ${currentNode.label}...`,
        currentNodeId: currentNode.id,
        conflictNodeId: null,
        nodeColors: { ...nodeColors },
      })
      for (let color = 0; color < numColors; color++) {
        steps.push({
          phase: "try",
          description: `Trying ${COLOR_NAMES[color]} for node ${currentNode.label}...`,
          currentNodeId: currentNode.id,
          conflictNodeId: null,
          nodeColors: { ...nodeColors },
        })

        const [valid, conflictNodeId] = isColorValid(currentNode.id, color, nodeColors)

        if (!valid) {
          steps.push({
            phase: "conflict",
            description: `Conflict detected: Node ${
              graph.nodes.find((n) => n.id === conflictNodeId)?.label
            } already has ${COLOR_NAMES[color]}`,
            currentNodeId: currentNode.id,
            conflictNodeId,
            nodeColors: { ...nodeColors },
          })
          continue
        }
        nodeColors[currentNode.id] = color

        steps.push({
          phase: "assign",
          description: `Assigned ${COLOR_NAMES[color]} to node ${currentNode.label}`,
          currentNodeId: currentNode.id,
          conflictNodeId: null,
          nodeColors: { ...nodeColors },
        })

        if (solveGraphColoring(nodeIndex + 1, nodeColors, steps)) {
          return true
        }

        nodeColors[currentNode.id] = null
        steps.push({
          phase: "backtrack",
          description: `Backtracking from node ${currentNode.label}...`,
          currentNodeId: currentNode.id,
          conflictNodeId: null,
          nodeColors: { ...nodeColors },
          previousNodeId: currentNode.id,
        })
      }

      return false
    }

    const nodeColors = { ...initialNodeColors }
    solveGraphColoring(0, nodeColors, algorithmSteps)

    if (allSolutions.length === 0) {
      algorithmSteps.push({
        phase: "complete",
        description: `No solution found with ${numColors} colors. Try increasing the number of colors.`,
        currentNodeId: null,
        conflictNodeId: null,
        nodeColors: { ...initialNodeColors },
      })
    }

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
        lastStep.nodeColors = solutions[nextSolution]
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

  const getNodeColor = (nodeId: string): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return "bg-gray-300"
    }

    const nodeColors = steps[currentStep].nodeColors
    const colorIndex = nodeColors[nodeId]

    if (colorIndex === null) {
      return "bg-gray-300"
    }

    return COLORS[colorIndex]
  }
  const getNodeBorder = (nodeId: string): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return ""
    }

    if (steps[currentStep].currentNodeId === nodeId) {
      return "ring-2 ring-yellow-400"
    }

    if (steps[currentStep].conflictNodeId === nodeId) {
      return "ring-2 ring-red-500"
    }

    if (steps[currentStep].previousNodeId === nodeId) {
      return "ring-2 ring-gray-500"
    }

    return ""
  }

  const getEdgeColor = (source: string, target: string): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return "stroke-gray-400"
    }

    const currentNodeId = steps[currentStep].currentNodeId
    const conflictNodeId = steps[currentStep].conflictNodeId

    if (
      (currentNodeId === source && conflictNodeId === target) ||
      (currentNodeId === target && conflictNodeId === source)
    ) {
      return "stroke-red-500"
    }

    if (currentNodeId === source || currentNodeId === target) {
      return "stroke-yellow-400"
    }

    return "stroke-gray-400"
  }

  const getEdgeWidth = (source: string, target: string): number => {
    if (!algorithmStarted || !steps[currentStep]) {
      return 1
    }

    const currentNodeId = steps[currentStep].currentNodeId
    const conflictNodeId = steps[currentStep].conflictNodeId

    if (
      (currentNodeId === source && conflictNodeId === target) ||
      (currentNodeId === target && conflictNodeId === source)
    ) {
      return 3
    }

    if (currentNodeId === source || currentNodeId === target) {
      return 2
    }

    return 1
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Graph Coloring - Backtracking Visualization</h1>

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
                <h2 className="text-lg font-semibold">Graph Configuration</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numNodes">Number of Nodes</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="numNodes"
                        type="number"
                        min={2}
                        max={10}
                        value={numNodes}
                        onChange={(e) => setNumNodes(Number(e.target.value))}
                        disabled={algorithmStarted}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setNumNodes(Math.max(2, numNodes - 1))}
                        disabled={algorithmStarted}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setNumNodes(Math.min(10, numNodes + 1))}
                        disabled={algorithmStarted}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numColors">Number of Colors</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="numColors"
                        type="number"
                        min={1}
                        max={10}
                        value={numColors}
                        onChange={(e) => setNumColors(Number(e.target.value))}
                        disabled={algorithmStarted}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setNumColors(Math.max(1, numColors - 1))}
                        disabled={algorithmStarted}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setNumColors(Math.min(10, numColors + 1))}
                        disabled={algorithmStarted}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button onClick={generateGraph} disabled={algorithmStarted}>
                    Generate Graph
                  </Button>
                  <Button variant="outline" onClick={generateRandomGraph} disabled={algorithmStarted}>
                    Random Graph
                  </Button>
                </div>

                <h2 className="text-lg font-semibold">Add Edge</h2>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex gap-2">
                    <Select value={newEdgeSource || ""} onValueChange={setNewEdgeSource} disabled={algorithmStarted}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Source Node" />
                      </SelectTrigger>
                      <SelectContent>
                        {graph.nodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {node.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={newEdgeTarget || ""} onValueChange={setNewEdgeTarget} disabled={algorithmStarted}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Target Node" />
                      </SelectTrigger>
                      <SelectContent>
                        {graph.nodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {node.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={addEdge} disabled={algorithmStarted}>
                    Add Edge
                  </Button>
                </div>

                {inputError && (
                  <Alert variant="destructive">
                    <AlertDescription>{inputError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  {!algorithmStarted ? (
                    <Button onClick={startAlgorithm} disabled={graph.nodes.length === 0}>
                      Start Algorithm
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={resetAlgorithm}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Edges</h2>
                <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
                  {graph.edges.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No edges added yet</p>
                  ) : (
                    <ul className="divide-y">
                      {graph.edges.map((edge) => {
                        const sourceNode = graph.nodes.find((n) => n.id === edge.source)
                        const targetNode = graph.nodes.find((n) => n.id === edge.target)
                        return (
                          <li
                            key={`${edge.source}-${edge.target}`}
                            className="flex justify-between items-center p-2 hover:bg-muted"
                          >
                            <span>
                              {sourceNode?.label} — {targetNode?.label}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEdge(edge.source, edge.target)}
                              disabled={algorithmStarted}
                            >
                              Remove
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Graph Preview */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Graph Preview</h2>
            <div
              ref={graphContainerRef}
              className="w-full h-[400px] bg-gray-100 dark:bg-gray-900 rounded-md relative overflow-hidden"
            >
              {/* Edges */}
              <svg className="absolute inset-0 w-full h-full">
                {graph.edges.map((edge) => {
                  const sourceNode = graph.nodes.find((n) => n.id === edge.source)
                  const targetNode = graph.nodes.find((n) => n.id === edge.target)

                  if (!sourceNode || !targetNode) return null

                  return (
                    <line
                      key={`${edge.source}-${edge.target}`}
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      className="stroke-gray-400"
                      strokeWidth={1}
                    />
                  )
                })}
              </svg>

              {/* Nodes */}
              {graph.nodes.map((node) => (
                <motion.div
                  key={node.id}
                  className={`absolute w-12 h-12 rounded-full flex items-center justify-center bg-gray-300 text-white font-bold`}
                  style={{
                    left: node.x - 24,
                    top: node.y - 24,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {node.label}
                </motion.div>
              ))}
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

              {solutions.length > 0 && currentStep === steps.length - 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Badge variant="outline">
                    Solution {currentSolution + 1} of {solutions.length}
                  </Badge>
                  <Button size="sm" onClick={showNextSolution}>
                    Next Solution
                  </Button>
                </div>
              )}

              {/* Algorithm step description */}
              <Alert variant="default" className="bg-primary/10">
                <AlertDescription>{steps[currentStep]?.description || "Preparing algorithm..."}</AlertDescription>
              </Alert>

              {/* Graph visualization */}
              <div
                ref={graphContainerRef}
                className="w-full h-[400px] bg-gray-100 dark:bg-gray-900 rounded-md relative overflow-hidden"
              >
                {/* Edges */}
                <svg className="absolute inset-0 w-full h-full">
                  {graph.edges.map((edge) => {
                    const sourceNode = graph.nodes.find((n) => n.id === edge.source)
                    const targetNode = graph.nodes.find((n) => n.id === edge.target)

                    if (!sourceNode || !targetNode) return null

                    const edgeColor = getEdgeColor(edge.source, edge.target)
                    const edgeWidth = getEdgeWidth(edge.source, edge.target)

                    return (
                      <line
                        key={`${edge.source}-${edge.target}`}
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        className={`${edgeColor} transition-all duration-300`}
                        strokeWidth={edgeWidth}
                      />
                    )
                  })}
                </svg>

                {/* Nodes */}
                {graph.nodes.map((node) => {
                  const nodeColor = getNodeColor(node.id)
                  const nodeBorder = getNodeBorder(node.id)

                  return (
                    <motion.div
                      key={node.id}
                      className={`absolute w-12 h-12 rounded-full flex items-center justify-center ${nodeColor} ${nodeBorder} text-white font-bold transition-all duration-300`}
                      style={{
                        left: node.x - 24,
                        top: node.y - 24,
                      }}
                      initial={{ scale: 0.8 }}
                      animate={{
                        scale: steps[currentStep]?.currentNodeId === node.id ? 1.1 : 1,
                        y: steps[currentStep]?.currentNodeId === node.id ? -5 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="relative">
                        <BookOpen className="w-4 h-4 absolute -top-2 -left-2 opacity-50" />
                        {node.label}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

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

      {/* Legend */}
      <Card className="w-full p-4">
        <h2 className="text-lg font-semibold mb-2">Legend</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-300"></div>
            <span className="text-sm">Uncolored Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
            <span className="text-sm">Current Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm">Conflict Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-500"></div>
            <span className="text-sm">Backtracked Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {COLORS.slice(0, 5).map((color, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${color}`}></div>
              ))}
            </div>
            <span className="text-sm">Available Colors</span>
          </div>
        </div>
      </Card>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          Graph Coloring is a problem of assigning colors to vertices of a graph such that no two adjacent vertices have
          the same color. The goal is to use the minimum number of colors possible.
        </p>
        <p className="mt-2">
          This visualization demonstrates the backtracking algorithm for solving the Graph Coloring problem. The
          algorithm works by assigning colors to nodes one by one. When it finds that a color cannot be assigned to a
          node due to conflicts with its neighbors, it backtracks and tries a different color for the previous node.
        </p>
        <p className="mt-2">
          The minimum number of colors needed to color a graph is called its chromatic number. Finding the chromatic
          number is an NP-hard problem, but the backtracking approach can find a valid coloring using a given number of
          colors.
        </p>
      </div>
    </div>
  )
}

