"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, StepForward, StepBack, Plus, Minus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Node = {
  id: string
  label: string
  x: number
  y: number
}

type Edge = {
  source: string
  target: string
  weight: number
}

type Graph = {
  nodes: Node[]
  edges: Edge[]
}

type AlgorithmStep = {
  phase: "init" | "relax" | "update" | "negative-cycle" | "complete"
  description: string
  iteration: number
  edge?: { source: string; target: string; weight: number }
  distances: Record<string, number>
  previousDistances?: Record<string, number>
  predecessors: Record<string, string | null>
  relaxed?: boolean
}

const INFINITY = Number.MAX_SAFE_INTEGER

export default function BellmanFord() {
  const [graph, setGraph] = useState<Graph>({
    nodes: [],
    edges: [],
  })

  const [numNodes, setNumNodes] = useState<number>(5)
  const [sourceNode, setSourceNode] = useState<string>("A")
  const [inputMatrix, setInputMatrix] = useState<string[][]>([])
  const [inputError, setInputError] = useState<string>("")

  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [algorithmStarted, setAlgorithmStarted] = useState<boolean>(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const [graphWidth, setGraphWidth] = useState<number>(700)
  const [graphHeight, setGraphHeight] = useState<number>(400)
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [pathNodes, setPathNodes] = useState<string[]>([])

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const width = graphContainerRef.current.clientWidth
        const height = Math.min(500, Math.max(400, width * 0.6))
        setGraphWidth(width)
        setGraphHeight(height)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    const newInputMatrix: string[][] = Array(numNodes)
      .fill(0)
      .map(() => Array(numNodes).fill("∞"))

    for (let i = 0; i < numNodes; i++) {
      newInputMatrix[i][i] = "0"
    }

    setInputMatrix(newInputMatrix)

    const validLabels = Array.from({ length: numNodes }, (_, i) => String.fromCharCode(65 + i))
    if (!validLabels.includes(sourceNode)) {
      setSourceNode(validLabels[0])
    }
  }, [numNodes])

  const handleMatrixInputChange = (i: number, j: number, value: string) => {
    if (i === j) return

    const newMatrix = JSON.parse(JSON.stringify(inputMatrix))

    if (value === "" || value === "∞" || /^-?[0-9]+$/.test(value)) {
      newMatrix[i][j] = value
      setInputMatrix(newMatrix)
    }
  }

  const validateAndConvertMatrix = (): { matrix: number[][]; edges: Edge[] } | null => {
    const matrix: number[][] = []
    const edges: Edge[] = []

    for (let i = 0; i < numNodes; i++) {
      matrix[i] = []
      for (let j = 0; j < numNodes; j++) {
        if (inputMatrix[i][j] === "∞" || inputMatrix[i][j] === "") {
          matrix[i][j] = INFINITY
        } else {
          const val = Number.parseInt(inputMatrix[i][j])
          if (isNaN(val)) {
            setInputError(`Invalid value at position (${i + 1}, ${j + 1}). Please enter a number or ∞.`)
            return null
          }
          matrix[i][j] = val

          if (val !== INFINITY && i !== j) {
            const sourceLabel = String.fromCharCode(65 + i)
            const targetLabel = String.fromCharCode(65 + j)
            edges.push({
              source: `node-${sourceLabel}`,
              target: `node-${targetLabel}`,
              weight: val,
            })
          }
        }
      }
    }

    return { matrix, edges }
  }

  const generateGraph = () => {
    if (numNodes < 2) {
      setInputError("Please specify at least 2 nodes")
      return
    }

    if (numNodes > 10) {
      setInputError("Please specify 10 or fewer nodes for better visualization")
      return
    }

    const validData = validateAndConvertMatrix()
    if (!validData) return

    setInputError("")

    const nodes: Node[] = []

    const nodeRadius = 20
    const padding = nodeRadius + 40
    const centerX = graphWidth / 2
    const centerY = graphHeight / 2
    const radius = Math.min(graphWidth, graphHeight) / 2.5 - padding

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
      })
    }

    setGraph({
      nodes,
      edges: validData.edges,
    })

    resetAlgorithm()
  }

  const generateRandomGraph = () => {
    const randomNodes = Math.floor(Math.random() * 4) + 3
    setNumNodes(randomNodes)

    const matrix: string[][] = []
    for (let i = 0; i < randomNodes; i++) {
      matrix[i] = []
      for (let j = 0; j < randomNodes; j++) {
        if (i === j) {
          matrix[i][j] = "0"
        } else {
          const rand = Math.random()
          if (rand < 0.3) {
            matrix[i][j] = "∞"
          } else {
            const weight = Math.floor(Math.random() * 13) - 2
            matrix[i][j] = String(weight)
          }
        }
      }
    }

    setInputMatrix(matrix)

    const randomSource = String.fromCharCode(65 + Math.floor(Math.random() * randomNodes))
    setSourceNode(randomSource)

    generateGraph()
  }

  const startAlgorithm = () => {
    if (graph.nodes.length === 0) {
      setInputError("Please generate a graph first")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)
    setSelectedTarget(null)
    setPathNodes([])

    const steps: AlgorithmStep[] = []
    const sourceIndex = sourceNode.charCodeAt(0) - 65

    const distances: Record<string, number> = {}
    const predecessors: Record<string, string | null> = {}

    graph.nodes.forEach((node) => {
      const nodeLabel = node.label
      distances[nodeLabel] = nodeLabel === sourceNode ? 0 : INFINITY
      predecessors[nodeLabel] = null
    })

    steps.push({
      phase: "init",
      description: `Initialize distances: Set distance to source node ${sourceNode} as 0, all others as ∞`,
      iteration: 0,
      distances: { ...distances },
      predecessors: { ...predecessors },
    })

    const edges: { source: string; target: string; weight: number }[] = graph.edges.map((edge) => {
      const sourceNode = graph.nodes.find((n) => n.id === edge.source)!
      const targetNode = graph.nodes.find((n) => n.id === edge.target)!
      return {
        source: sourceNode.label,
        target: targetNode.label,
        weight: edge.weight,
      }
    })

    let hasNegativeCycle = false

    for (let i = 1; i <= graph.nodes.length; i++) {
      for (let j = 0; j < edges.length; j++) {
        const edge = edges[j]
        const { source, target, weight } = edge

        if (distances[source] === INFINITY) {
          steps.push({
            phase: "relax",
            description: `Edge ${source} → ${target} (weight: ${weight}): Source node ${source} is unreachable, skipping`,
            iteration: i,
            edge: { ...edge },
            distances: { ...distances },
            predecessors: { ...predecessors },
            relaxed: false,
          })
          continue
        }

        const newDistance = distances[source] + weight

        steps.push({
          phase: "relax",
          description: `Edge ${source} → ${target} (weight: ${weight}): Current distance to ${target} is ${distances[target] === INFINITY ? "∞" : distances[target]}, new potential distance is ${newDistance}`,
          iteration: i,
          edge: { ...edge },
          distances: { ...distances },
          previousDistances: { ...distances },
          predecessors: { ...predecessors },
          relaxed: false,
        })

        if (newDistance < distances[target]) {
          if (i === graph.nodes.length) {
            hasNegativeCycle = true
            steps.push({
              phase: "negative-cycle",
              description: `Negative cycle detected! Edge ${source} → ${target} can still be relaxed in iteration ${i}`,
              iteration: i,
              edge: { ...edge },
              distances: { ...distances },
              previousDistances: { ...distances },
              predecessors: { ...predecessors },
            })
            break
          }

          const oldDistance = distances[target]
          distances[target] = newDistance
          predecessors[target] = source

          steps.push({
            phase: "update",
            description: `Update: Distance to ${target} improved from ${oldDistance === INFINITY ? "∞" : oldDistance} to ${newDistance} via ${source}`,
            iteration: i,
            edge: { ...edge },
            distances: { ...distances },
            previousDistances: { ...{ ...distances, [target]: oldDistance } },
            predecessors: { ...predecessors },
            relaxed: true,
          })
        }
      }

      if (hasNegativeCycle) break
    }

    if (!hasNegativeCycle) {
      steps.push({
        phase: "complete",
        description: `Algorithm complete. Final distances from source node ${sourceNode} to all other nodes calculated.`,
        iteration: graph.nodes.length,
        distances: { ...distances },
        predecessors: { ...predecessors },
      })
    }

    setSteps(steps)
    setCurrentStep(0)
  }

  const resetAlgorithm = () => {
    setAlgorithmStarted(false)
    setSteps([])
    setCurrentStep(0)
    setIsPlaying(false)
    setSelectedTarget(null)
    setPathNodes([])
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

  const getNodeColor = (nodeId: string): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return "bg-primary"
    }

    const node = graph.nodes.find((n) => n.id === nodeId)
    if (!node) return "bg-primary"

    const nodeLabel = node.label

    if (nodeLabel === sourceNode) {
      return "bg-green-500"
    }

    if (pathNodes.includes(nodeLabel)) {
      return "bg-green-500"
    }

    const step = steps[currentStep]

    if (step.edge && (step.edge.source === nodeLabel || step.edge.target === nodeLabel)) {
      return step.phase === "update" || step.phase === "negative-cycle" ? "bg-yellow-500" : "bg-blue-500"
    }

    return "bg-primary"
  }

  const getNodeBorder = (nodeId: string): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return ""
    }

    const node = graph.nodes.find((n) => n.id === nodeId)
    if (!node) return ""

    const nodeLabel = node.label

    if (nodeLabel === sourceNode) {
      return "ring-2 ring-green-500"
    }

    if (pathNodes.includes(nodeLabel)) {
      return "ring-2 ring-green-500"
    }

    const step = steps[currentStep]

    if (step.edge && step.edge.target === nodeLabel && step.phase === "update") {
      return "ring-2 ring-yellow-500"
    }

    return ""
  }

  const getEdgeColor = (source: string, target: string): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return "stroke-gray-400"
    }

    const sourceNode = graph.nodes.find((n) => n.id === source)
    const targetNode = graph.nodes.find((n) => n.id === target)

    if (!sourceNode || !targetNode) return "stroke-gray-400"

    const sourceLabel = sourceNode.label
    const targetLabel = targetNode.label

    const step = steps[currentStep]

    if (step.edge && step.edge.source === sourceLabel && step.edge.target === targetLabel) {
      if (step.phase === "update" || step.phase === "negative-cycle") {
        return "stroke-yellow-500"
      }
      return "stroke-blue-500"
    }

    if (pathNodes.length > 0) {
      for (let i = 0; i < pathNodes.length - 1; i++) {
        if (pathNodes[i] === sourceLabel && pathNodes[i + 1] === targetLabel) {
          return "stroke-green-500"
        }
      }
    }

    return "stroke-gray-400"
  }

  const getEdgeWidth = (source: string, target: string): number => {
    if (!algorithmStarted || !steps[currentStep]) {
      return 1
    }

    const sourceNode = graph.nodes.find((n) => n.id === source)
    const targetNode = graph.nodes.find((n) => n.id === target)

    if (!sourceNode || !targetNode) return 1

    const sourceLabel = sourceNode.label
    const targetLabel = targetNode.label

    const step = steps[currentStep]

    if (step.edge && step.edge.source === sourceLabel && step.edge.target === targetLabel) {
      return 3
    }

    if (pathNodes.length > 0) {
      for (let i = 0; i < pathNodes.length - 1; i++) {
        if (pathNodes[i] === sourceLabel && pathNodes[i + 1] === targetLabel) {
          return 3
        }
      }
    }

    return 1
  }

  const formatDistance = (distance: number): string => {
    return distance === INFINITY ? "∞" : distance.toString()
  }

  const reconstructPath = (target: string) => {
    if (!algorithmStarted || currentStep < steps.length - 1 || steps[currentStep].phase !== "complete") {
      return
    }

    const finalStep = steps[steps.length - 1]

    if (finalStep.distances[target] === INFINITY) {
      setPathNodes([])
      return
    }

    const path: string[] = [target]
    let current = target

    while (finalStep.predecessors[current] !== null) {
      current = finalStep.predecessors[current]!
      path.unshift(current)
    }

    setPathNodes(path)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Bellman-Ford Algorithm - Single Source Shortest Path</h1>

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
                  <Label htmlFor="sourceNode">Source Node</Label>
                  <Select value={sourceNode} onValueChange={setSourceNode} disabled={algorithmStarted}>
                    <SelectTrigger id="sourceNode" className="w-full">
                      <SelectValue placeholder="Select source node" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: numNodes }).map((_, i) => (
                        <SelectItem key={i} value={String.fromCharCode(65 + i)}>
                          {String.fromCharCode(65 + i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between">
                  <Button onClick={generateGraph} disabled={algorithmStarted}>
                    Generate Graph
                  </Button>
                  <Button variant="outline" onClick={generateRandomGraph} disabled={algorithmStarted}>
                    Random Graph
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
                <h2 className="text-lg font-semibold mb-2">Distance Matrix</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border"></th>
                        {Array.from({ length: numNodes }).map((_, i) => (
                          <th key={i} className="p-2 border text-center">
                            {String.fromCharCode(65 + i)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: numNodes }).map((_, i) => (
                        <tr key={i}>
                          <th className="p-2 border text-center">{String.fromCharCode(65 + i)}</th>
                          {Array.from({ length: numNodes }).map((_, j) => (
                            <td key={j} className="p-1 border">
                              <Input
                                type="text"
                                value={inputMatrix[i]?.[j] || ""}
                                onChange={(e) => handleMatrixInputChange(i, j, e.target.value)}
                                className={`text-center ${i === j ? "bg-gray-100" : ""}`}
                                disabled={i === j || algorithmStarted}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Enter edge weights in the matrix. Use "∞" for no direct connection.</p>
                  <p>Diagonal values (self-loops) are fixed at 0.</p>
                  <p>Negative weights are allowed, but be careful with negative cycles.</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Graph Preview</h2>
            <div
              ref={graphContainerRef}
              className="w-full h-[450px] bg-gray-100 dark:bg-gray-900 rounded-md relative overflow-hidden"
            >
              <svg className="absolute inset-0 w-full h-full">
                {graph.edges.map((edge) => {
                  const sourceNode = graph.nodes.find((n) => n.id === edge.source)
                  const targetNode = graph.nodes.find((n) => n.id === edge.target)

                  if (!sourceNode || !targetNode) return null

                  const dx = targetNode.x - sourceNode.x
                  const dy = targetNode.y - sourceNode.y
                  const distance = Math.sqrt(dx * dx + dy * dy)

                  const nx = dx / distance
                  const ny = dy / distance

                  const nodeRadius = 24
                  const startX = sourceNode.x + nx * nodeRadius
                  const startY = sourceNode.y + ny * nodeRadius
                  const endX = targetNode.x - nx * nodeRadius
                  const endY = targetNode.y - ny * nodeRadius

                  const midX = (startX + endX) / 2
                  const midY = (startY + endY) / 2

                  const perpX = -ny * 15
                  const perpY = nx * 15
                  const labelX = midX + perpX
                  const labelY = midY + perpY

                  return (
                    <g key={`${edge.source}-${edge.target}`}>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX - 5}
                        y2={endY - 5}
                        className="stroke-gray-400"
                        strokeWidth={2}
                        markerEnd="url(#preview-arrowhead)"
                      />
                      <circle
                        cx={labelX}
                        cy={labelY}
                        r={12}
                        className="fill-white dark:fill-gray-800 stroke-gray-400"
                      />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium"
                      >
                        {edge.weight}
                      </text>
                    </g>
                  )
                })}

                <defs>
                  <marker id="preview-arrowhead" markerWidth="12" markerHeight="9" refX="0" refY="4.5" orient="auto">
                    <polygon points="0 0, 12 4.5, 0 9" className="fill-gray-400" />
                  </marker>
                </defs>
              </svg>

              {graph.nodes.map((node) => (
                <motion.div
                  key={node.id}
                  className={`absolute w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground font-bold ${
                    node.label === sourceNode ? "ring-2 ring-green-500" : ""
                  }`}
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

              {sourceNode && (
                <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 p-2 rounded shadow">
                  <p className="text-sm font-medium">Source node: {sourceNode}</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          {algorithmStarted && (
            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap justify-center gap-4 w-full mb-2">
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

              <Alert variant="default" className="bg-primary/10">
                <AlertDescription>{steps[currentStep]?.description || "Preparing algorithm..."}</AlertDescription>
              </Alert>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-md font-semibold mb-2">Distance Table</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 border">Node</th>
                          <th className="p-2 border">Distance from {sourceNode}</th>
                          <th className="p-2 border">Predecessor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {graph.nodes.map((node) => {
                          const nodeLabel = node.label
                          const isUpdated =
                            steps[currentStep]?.phase === "update" && steps[currentStep]?.edge?.target === nodeLabel

                          return (
                            <tr
                              key={node.id}
                              className={
                                isUpdated
                                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                                  : nodeLabel === sourceNode
                                    ? "bg-green-100 dark:bg-green-900/30"
                                    : steps[currentStep]?.edge?.source === nodeLabel
                                      ? "bg-blue-100 dark:bg-blue-900/30"
                                      : steps[currentStep]?.edge?.target === nodeLabel
                                        ? "bg-blue-100 dark:bg-blue-900/30"
                                        : "bg-gray-100 dark:bg-gray-800"
                              }
                            >
                              <td className="p-2 border text-center">{nodeLabel}</td>
                              <td className="p-2 border text-center">
                                {isUpdated ? (
                                  <div className="flex flex-col items-center">
                                    <span className="line-through text-gray-500">
                                      {formatDistance(steps[currentStep]?.previousDistances?.[nodeLabel] || INFINITY)}
                                    </span>
                                    <span className="font-bold">
                                      {formatDistance(steps[currentStep]?.distances[nodeLabel] || INFINITY)}
                                    </span>
                                  </div>
                                ) : (
                                  formatDistance(steps[currentStep]?.distances[nodeLabel] || INFINITY)
                                )}
                              </td>
                              <td className="p-2 border text-center">
                                {steps[currentStep]?.predecessors[nodeLabel] || "-"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {currentStep === steps.length - 1 && steps[currentStep]?.phase === "complete" && (
                    <div className="mt-4">
                      <h3 className="text-md font-semibold mb-2">Path Reconstruction</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Select value={selectedTarget || ""} onValueChange={(value) => setSelectedTarget(value)}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="To" />
                          </SelectTrigger>
                          <SelectContent>
                            {graph.nodes
                              .filter((node) => node.label !== sourceNode)
                              .map((node) => (
                                <SelectItem key={node.id} value={node.label}>
                                  {node.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        <Button
                          onClick={() => {
                            if (selectedTarget) {
                              reconstructPath(selectedTarget)
                            }
                          }}
                          disabled={!selectedTarget}
                        >
                          Show Path
                        </Button>
                      </div>

                      {pathNodes.length > 0 ? (
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                          <p className="font-medium">Shortest path: {pathNodes.join(" → ")}</p>
                          <p className="text-sm">
                            Distance: {formatDistance(steps[currentStep]?.distances[selectedTarget!] || INFINITY)}
                          </p>
                        </div>
                      ) : selectedTarget ? (
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                          <p>
                            No path exists between {sourceNode} and {selectedTarget}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {steps[currentStep]?.phase === "negative-cycle" && (
                    <div className="mt-4">
                      <Alert variant="destructive">
                        <AlertDescription>
                          Negative cycle detected! The graph contains a cycle with negative total weight, which means
                          there is no shortest path solution as distances can be reduced indefinitely.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-2">Graph Visualization</h3>
                  <div
                    ref={graphContainerRef}
                    className="w-full h-[500px] bg-gray-100 dark:bg-gray-900 rounded-md relative overflow-hidden"
                  >
                    <svg className="absolute inset-0 w-full h-full">
                      {graph.edges.map((edge) => {
                        const sourceNode = graph.nodes.find((n) => n.id === edge.source)
                        const targetNode = graph.nodes.find((n) => n.id === edge.target)

                        if (!sourceNode || !targetNode) return null

                        const dx = targetNode.x - sourceNode.x
                        const dy = targetNode.y - sourceNode.y
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        const nx = dx / distance
                        const ny = dy / distance

                        const nodeRadius = 24
                        const startX = sourceNode.x + nx * nodeRadius
                        const startY = sourceNode.y + ny * nodeRadius
                        const endX = targetNode.x - nx * nodeRadius
                        const endY = targetNode.y - ny * nodeRadius

                        const midX = (startX + endX) / 2
                        const midY = (startY + endY) / 2

                        const perpX = -ny * 15
                        const perpY = nx * 15
                        const labelX = midX + perpX
                        const labelY = midY + perpY

                        const isActiveEdge =
                          steps[currentStep]?.edge &&
                          steps[currentStep].edge.source === sourceNode.label &&
                          steps[currentStep].edge.target === targetNode.label

                        const edgeColor = getEdgeColor(edge.source, edge.target)
                        const edgeWidth = getEdgeWidth(edge.source, edge.target)

                        return (
                          <g key={`${edge.source}-${edge.target}`}>
                            <line
                              x1={startX}
                              y1={startY}
                              x2={endX - 5}
                              y2={endY - 5}
                              className={`${edgeColor} transition-colors duration-300`}
                              strokeWidth={edgeWidth}
                              markerEnd={`url(#arrowhead-${edgeColor.replace("stroke-", "")})`}
                            />
                            <circle
                              cx={labelX}
                              cy={labelY}
                              r={12}
                              className={`${isActiveEdge ? edgeColor.replace("stroke", "fill") : "fill-white dark:fill-gray-800"} transition-colors duration-300 ${isActiveEdge ? "stroke-white" : "stroke-gray-300"}`}
                            />
                            <text
                              x={labelX}
                              y={labelY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className={`text-xs font-medium ${isActiveEdge ? "fill-white font-bold" : ""}`}
                            >
                              {edge.weight}
                            </text>
                          </g>
                        )
                      })}

                      <defs>
                        <marker
                          id="arrowhead-gray-400"
                          markerWidth="12"
                          markerHeight="9"
                          refX="0"
                          refY="4.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 12 4.5, 0 9" className="fill-gray-400" />
                        </marker>
                        <marker
                          id="arrowhead-blue-500"
                          markerWidth="12"
                          markerHeight="9"
                          refX="0"
                          refY="4.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 12 4.5, 0 9" className="fill-blue-500" />
                        </marker>
                        <marker
                          id="arrowhead-yellow-500"
                          markerWidth="12"
                          markerHeight="9"
                          refX="0"
                          refY="4.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 12 4.5, 0 9" className="fill-yellow-500" />
                        </marker>
                        <marker
                          id="arrowhead-green-500"
                          markerWidth="12"
                          markerHeight="9"
                          refX="0"
                          refY="4.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 12 4.5, 0 9" className="fill-green-500" />
                        </marker>
                      </defs>
                    </svg>

                    {graph.nodes.map((node) => {
                      const nodeColor = getNodeColor(node.id)
                      const nodeBorder = getNodeBorder(node.id)
                      const isSourceNode = node.label === sourceNode
                      const isCurrentNode = steps[currentStep]?.edge?.source === node.label
                      const isTargetNode =
                        steps[currentStep]?.edge?.target === node.label && steps[currentStep]?.phase === "update"

                      return (
                        <motion.div
                          key={node.id}
                          className={`absolute w-12 h-12 rounded-full flex items-center justify-center ${nodeColor} text-primary-foreground font-bold ${nodeBorder} transition-all duration-300`}
                          style={{
                            left: node.x - 24,
                            top: node.y - 24,
                          }}
                          animate={{
                            scale: isSourceNode || isCurrentNode || isTargetNode ? 1.1 : 1,
                            y: isSourceNode || isCurrentNode || isTargetNode ? -5 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {node.label}
                        </motion.div>
                      )
                    })}

                    <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 p-2 rounded shadow">
                      <p className="text-sm font-medium">Source node: {sourceNode}</p>
                      {steps[currentStep]?.iteration > 0 && (
                        <p className="text-sm">
                          Iteration: {steps[currentStep]?.iteration} of {graph.nodes.length}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">Current Operation</h3>
                    {steps[currentStep]?.phase === "relax" && steps[currentStep]?.edge && (
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <p className="font-medium">Examining edge:</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-primary/10">
                            {steps[currentStep].edge.source} → {steps[currentStep].edge.target} (weight:{" "}
                            {steps[currentStep].edge.weight})
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p>
                            Current distance to {steps[currentStep].edge.target}:{" "}
                            {formatDistance(steps[currentStep].distances[steps[currentStep].edge.target])}
                          </p>
                          <p>
                            Potential new distance:{" "}
                            {formatDistance(
                              steps[currentStep].distances[steps[currentStep].edge.source] +
                                steps[currentStep].edge.weight,
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {steps[currentStep]?.phase === "update" && steps[currentStep]?.edge && (
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                        <p className="font-medium">Edge relaxed!</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-yellow-500/10">
                            {steps[currentStep].edge.source} → {steps[currentStep].edge.target} (weight:{" "}
                            {steps[currentStep].edge.weight})
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p>
                            Old distance to {steps[currentStep].edge.target}:{" "}
                            {formatDistance(
                              steps[currentStep].previousDistances?.[steps[currentStep].edge.target] || INFINITY,
                            )}
                          </p>
                          <p>
                            New distance: {formatDistance(steps[currentStep].distances[steps[currentStep].edge.target])}
                          </p>
                        </div>
                      </div>
                    )}

                    {steps[currentStep]?.phase === "negative-cycle" && steps[currentStep]?.edge && (
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded">
                        <p className="font-medium">Negative cycle detected!</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-red-500/10">
                            {steps[currentStep].edge.source} → {steps[currentStep].edge.target} (weight:{" "}
                            {steps[currentStep].edge.weight})
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <p>
                            This edge can still be relaxed in iteration {steps[currentStep].iteration}, which means
                            there is a negative cycle in the graph.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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

      <Card className="w-full p-4">
        <h2 className="text-lg font-semibold mb-2">Legend</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            <span className="text-sm">Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm">Source Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm">Current Edge Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Updated Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30"></div>
            <span className="text-sm">Updated Distance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full ring-2 ring-green-500"></div>
            <span className="text-sm">Path Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-green-500"></div>
            <span className="text-sm">Path Edge</span>
          </div>
        </div>
      </Card>

      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          The Bellman-Ford algorithm is a dynamic programming approach for finding the shortest paths from a single
          source vertex to all other vertices in a weighted graph.
        </p>
        <p className="mt-2">
          Unlike Dijkstra's algorithm, Bellman-Ford can handle graphs with negative weight edges. It works by relaxing
          all edges |V|-1 times, where |V| is the number of vertices in the graph.
        </p>
        <p className="mt-2">
          Time Complexity: O(V·E) where V is the number of vertices and E is the number of edges.
          <br />
          Space Complexity: O(V) for storing the distance and predecessor arrays.
        </p>
        <p className="mt-2">
          The algorithm can also detect negative cycles (cycles with negative total weight) by performing one additional
          iteration of edge relaxations. If any distance can still be reduced after |V|-1 iterations, there must be a
          negative cycle in the graph.
        </p>
      </div>
    </div>
  )
}
