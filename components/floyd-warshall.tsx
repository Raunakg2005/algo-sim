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
import {
  INFINITY,
  generateFloydWarshallSteps,
  isMatrixEntryInput,
  parseDistanceMatrix,
  reconstructFloydWarshallPath,
  type FloydWarshallStep,
} from "@/lib/engines/floyd-warshall"

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

export default function FloydWarshall() {
  const [graph, setGraph] = useState<Graph>({
    nodes: [],
    edges: [],
  })

  const [numNodes, setNumNodes] = useState<number>(4)
  const [distanceMatrix, setDistanceMatrix] = useState<number[][]>([])
  const [inputMatrix, setInputMatrix] = useState<string[][]>([])
  const [inputError, setInputError] = useState<string>("")

  const [steps, setSteps] = useState<FloydWarshallStep[]>([])
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [algorithmStarted, setAlgorithmStarted] = useState<boolean>(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const [graphWidth, setGraphWidth] = useState<number>(700)
  const [graphHeight, setGraphHeight] = useState<number>(500)
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const [selectedPath, setSelectedPath] = useState<{ source: string; target: string } | null>(null)
  const [pathNodes, setPathNodes] = useState<string[]>([])

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

  useEffect(() => {
    // keep a matrix that already has the right size (the Random Graph button sets both at once),
    // and never call Array() with a negative / fractional length
    const size = Number.isInteger(numNodes) && numNodes > 0 ? numNodes : 0
    if (inputMatrix.length !== size) {
      setInputMatrix(Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => (i === j ? "0" : "∞"))))
    }
  }, [numNodes])

  const handleMatrixInputChange = (i: number, j: number, value: string) => {
    if (i === j) return 

    const newMatrix = JSON.parse(JSON.stringify(inputMatrix))

    if (isMatrixEntryInput(value)) {
      newMatrix[i][j] = value
      setInputMatrix(newMatrix)
    }
  }

  // n and matrix are passed explicitly so that "Random Graph" can build the graph from the matrix it just
  // generated (state set in the same click is not visible until the next render)
  const generateGraph = (n: number = numNodes, matrixInput: string[][] = inputMatrix) => {
    if (!Number.isInteger(n) || n < 2) {
      setInputError("Please specify at least 2 nodes")
      return
    }

    if (n > 10) {
      setInputError("Please specify 10 or fewer nodes for better visualization")
      return
    }

    const parsed = parseDistanceMatrix(matrixInput, n)
    if ("error" in parsed) {
      setInputError(parsed.error)
      return
    }
    const validMatrix = parsed.matrix

    setInputError("")
    setDistanceMatrix(validMatrix)

    const nodes: Node[] = []
    const edges: Edge[] = []

    const nodeRadius = 20
    const padding = nodeRadius + 40
    const centerX = graphWidth / 2
    const centerY = graphHeight / 2
    const radius = Math.min(graphWidth, graphHeight) / 3 - padding

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI
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

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j && validMatrix[i][j] !== INFINITY) {
          edges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            weight: validMatrix[i][j],
          })
        }
      }
    }

    setGraph({
      nodes,
      edges,
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
            matrix[i][j] = String(Math.floor(Math.random() * 10) + 1)
          }
        }
      }
    }

    setInputMatrix(matrix)
    generateGraph(randomNodes, matrix)
  }

  const startAlgorithm = () => {
    if (graph.nodes.length === 0) {
      setInputError("Please generate a graph first")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)
    setSelectedPath(null)
    setPathNodes([])

    setSteps(generateFloydWarshallSteps(distanceMatrix))
    setCurrentStep(0)
  }

  const resetAlgorithm = () => {
    setAlgorithmStarted(false)
    setSteps([])
    setCurrentStep(0)
    setIsPlaying(false)
    setSelectedPath(null)
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

  const getCellClass = (i: number, j: number): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return "bg-gray-100 dark:bg-gray-800"
    }

    const step = steps[currentStep]

    if (step.i === i && step.j === j) {
      if (step.phase === "update") {
        return "bg-green-200 dark:bg-green-900"
      }
      return "bg-yellow-200 dark:bg-yellow-900"
    }

    if (step.k >= 0 && step.k < distanceMatrix.length) {
      if (i === step.k || j === step.k) {
        return "bg-blue-100 dark:bg-blue-900/30"
      }
    }

    return "bg-gray-100 dark:bg-gray-800"
  }

  const formatDistance = (distance: number): string => {
    return distance === INFINITY ? "∞" : distance.toString()
  }

  const getEdgeColor = (source: string, target: string): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return "stroke-gray-400"
    }

    const step = steps[currentStep]
    const sourceNode = graph.nodes.find((n) => n.id === source)
    const targetNode = graph.nodes.find((n) => n.id === target)

    if (!sourceNode || !targetNode) return "stroke-gray-400"

    const sourceIndex = sourceNode.label.charCodeAt(0) - 65
    const targetIndex = targetNode.label.charCodeAt(0) - 65

    if (step.i === sourceIndex && step.j === targetIndex) {
      return "stroke-yellow-500"
    }

    if (pathNodes.length > 0) {
      for (let i = 0; i < pathNodes.length - 1; i++) {
        if (pathNodes[i] === sourceNode.label && pathNodes[i + 1] === targetNode.label) {
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

    const step = steps[currentStep]
    const sourceNode = graph.nodes.find((n) => n.id === source)
    const targetNode = graph.nodes.find((n) => n.id === target)

    if (!sourceNode || !targetNode) return 1

    const sourceIndex = sourceNode.label.charCodeAt(0) - 65
    const targetIndex = targetNode.label.charCodeAt(0) - 65

    if (step.i === sourceIndex && step.j === targetIndex) {
      return 3
    }

    if (pathNodes.length > 0) {
      for (let i = 0; i < pathNodes.length - 1; i++) {
        if (pathNodes[i] === sourceNode.label && pathNodes[i + 1] === targetNode.label) {
          return 3
        }
      }
    }

    return 1
  }

  const getNodeBorder = (nodeId: string): string => {
    if (!algorithmStarted || !steps[currentStep]) {
      return ""
    }

    const step = steps[currentStep]
    const node = graph.nodes.find((n) => n.id === nodeId)

    if (!node) return ""

    const nodeIndex = node.label.charCodeAt(0) - 65

    if (step.k === nodeIndex) {
      return "ring-2 ring-purple-500"
    }

    if (step.i === nodeIndex || step.j === nodeIndex) {
      return "ring-2 ring-yellow-400"
    }

    if (pathNodes.includes(node.label)) {
      return "ring-2 ring-green-500"
    }

    return ""
  }

  const reconstructPath = (source: string, target: string) => {
    if (!algorithmStarted || currentStep < steps.length - 1) {
      return
    }

    const finalMatrix = steps[steps.length - 1].distanceMatrix
    const path = reconstructFloydWarshallPath(distanceMatrix, finalMatrix, source.charCodeAt(0) - 65, target.charCodeAt(0) - 65)
    setPathNodes(path.map((i) => String.fromCharCode(65 + i)))
  }

  const handlePathSelection = (source: string, target: string) => {
    setSelectedPath({ source, target })
    reconstructPath(source, target)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Floyd-Warshall Algorithm - All Pairs Shortest Path</h1>

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
                      onChange={(e) => setNumNodes(Math.min(10, Math.max(0, Math.trunc(Number(e.target.value)) || 0)))}
                      disabled={algorithmStarted}
                    />
                    <Button aria-label="Fewer nodes"
                      variant="outline"
                      size="icon"
                      onClick={() => setNumNodes(Math.max(2, numNodes - 1))}
                      disabled={algorithmStarted}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button aria-label="More nodes"
                      variant="outline"
                      size="icon"
                      onClick={() => setNumNodes(Math.min(10, numNodes + 1))}
                      disabled={algorithmStarted}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button onClick={() => generateGraph()} disabled={algorithmStarted}>
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
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Graph Preview</h2>
            <div
              ref={graphContainerRef}
              className="w-full h-[600px] bg-gray-100 dark:bg-gray-900 rounded-md relative overflow-hidden"
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
                  const endX = targetNode.x - nx * (nodeRadius + 5)
                  const endY = targetNode.y - ny * (nodeRadius + 5)

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
                        x2={endX}
                        y2={endY}
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
                  className={`absolute w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground font-bold`}
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

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-md font-semibold mb-2">Distance Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 border"></th>
                          {Array.from({ length: distanceMatrix.length }).map((_, i) => (
                            <th key={i} className="p-2 border text-center">
                              {String.fromCharCode(65 + i)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {steps[currentStep]?.distanceMatrix.map((row, i) => (
                          <tr key={i}>
                            <th className="p-2 border text-center">{String.fromCharCode(65 + i)}</th>
                            {row.map((value, j) => {
                              const isUpdated =
                                steps[currentStep]?.phase === "update" &&
                                steps[currentStep]?.i === i &&
                                steps[currentStep]?.j === j

                              return (
                                <td
                                  key={j}
                                  className={`p-2 border text-center transition-colors duration-300 ${getCellClass(i, j)}`}
                                >
                                  {isUpdated ? (
                                    <div className="flex flex-col items-center">
                                      <span className="line-through text-gray-500">
                                        {formatDistance(steps[currentStep]?.previousMatrix?.[i][j] ?? value)}
                                      </span>
                                      <span className="font-bold">{formatDistance(value)}</span>
                                    </div>
                                  ) : (
                                    formatDistance(value)
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {currentStep === steps.length - 1 && (
                    <div className="mt-4">
                      <h3 className="text-md font-semibold mb-2">Path Reconstruction</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Select
                          value={selectedPath?.source || ""}
                          onValueChange={(value) =>
                            setSelectedPath({ ...(selectedPath || { target: "" }), source: value })
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="From" />
                          </SelectTrigger>
                          <SelectContent>
                            {graph.nodes.map((node) => (
                              <SelectItem key={node.id} value={node.label}>
                                {node.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={selectedPath?.target || ""}
                          onValueChange={(value) =>
                            setSelectedPath({ ...(selectedPath || { source: "" }), target: value })
                          }
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="To" />
                          </SelectTrigger>
                          <SelectContent>
                            {graph.nodes.map((node) => (
                              <SelectItem key={node.id} value={node.label}>
                                {node.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          onClick={() => {
                            if (selectedPath?.source && selectedPath?.target) {
                              handlePathSelection(selectedPath.source, selectedPath.target)
                            }
                          }}
                          disabled={!selectedPath?.source || !selectedPath?.target}
                        >
                          Show Path
                        </Button>
                      </div>

                      {pathNodes.length > 0 ? (
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                          <p className="font-medium">Shortest path: {pathNodes.join(" → ")}</p>
                          <p className="text-sm">
                            Distance:{" "}
                            {selectedPath &&
                            steps[currentStep]?.distanceMatrix[selectedPath.source.charCodeAt(0) - 65][
                              selectedPath.target.charCodeAt(0) - 65
                            ] !== INFINITY
                              ? steps[currentStep]?.distanceMatrix[selectedPath.source.charCodeAt(0) - 65][
                                  selectedPath.target.charCodeAt(0) - 65
                                ]
                              : "No path exists"}
                          </p>
                        </div>
                      ) : selectedPath?.source && selectedPath?.target ? (
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                          <p>
                            No path exists between {selectedPath.source} and {selectedPath.target}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-md font-semibold mb-2">Graph Visualization</h3>
                  <div
                    ref={graphContainerRef}
                    className="w-full h-[600px] bg-gray-100 dark:bg-gray-900 rounded-md relative overflow-hidden"
                  >
                    <svg className="absolute inset-0 w-full h-full">
                      {graph.edges.map((edge) => {
                        const sourceNode = graph.nodes.find((n) => n.id === edge.source)
                        const targetNode = graph.nodes.find((n) => n.id === edge.target)

                        if (!sourceNode || !targetNode) return null

                        // Calculate the direction vector
                        const dx = targetNode.x - sourceNode.x
                        const dy = targetNode.y - sourceNode.y
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        // Normalize the direction vector
                        const nx = dx / distance
                        const ny = dy / distance

                        // Calculate the start and end points (offset from node centers)
                        const nodeRadius = 24
                        const startX = sourceNode.x + nx * nodeRadius
                        const startY = sourceNode.y + ny * nodeRadius
                        // Adjust end point to prevent arrow from overlapping with edge
                        const endX = targetNode.x - nx * (nodeRadius + 5)
                        const endY = targetNode.y - ny * (nodeRadius + 5)

                        // Calculate the midpoint for the weight label
                        const midX = (startX + endX) / 2
                        const midY = (startY + endY) / 2

                        // Offset the label perpendicular to the edge
                        const perpX = -ny * 15
                        const perpY = nx * 15
                        const labelX = midX + perpX
                        const labelY = midY + perpY

                        // Determine if this edge is currently being processed
                        const sourceIndex = sourceNode.label.charCodeAt(0) - 65
                        const targetIndex = targetNode.label.charCodeAt(0) - 65
                        const isActiveEdge =
                          steps[currentStep]?.i === sourceIndex && steps[currentStep]?.j === targetIndex

                        const edgeColor = getEdgeColor(edge.source, edge.target)
                        const edgeWidth = getEdgeWidth(edge.source, edge.target)

                        return (
                          <g key={`${edge.source}-${edge.target}`}>
                            <line
                              x1={startX}
                              y1={startY}
                              x2={endX}
                              y2={endY}
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
                      const nodeBorder = getNodeBorder(node.id)
                      const isIntermediateNode = steps[currentStep]?.k === node.label.charCodeAt(0) - 65
                      const sourceIndex = node.label.charCodeAt(0) - 65
                      const isSourceNode = steps[currentStep]?.i === sourceIndex
                      const isTargetNode = steps[currentStep]?.j === sourceIndex

                      return (
                        <motion.div
                          key={node.id}
                          className={`absolute w-12 h-12 rounded-full flex items-center justify-center ${isIntermediateNode ? "bg-purple-500" : isSourceNode || isTargetNode ? "bg-yellow-500" : "bg-primary"} text-primary-foreground font-bold ${nodeBorder} transition-all duration-300`}
                          style={{
                            left: node.x - 24,
                            top: node.y - 24,
                          }}
                          animate={{
                            scale: isIntermediateNode || isSourceNode || isTargetNode ? 1.1 : 1,
                            y: isIntermediateNode || isSourceNode || isTargetNode ? -5 : 0,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {node.label}
                        </motion.div>
                      )
                    })}

                    {steps[currentStep]?.k >= 0 && steps[currentStep]?.k < distanceMatrix.length && (
                      <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 p-2 rounded shadow">
                        <p className="text-sm font-medium">
                          Intermediate node: {String.fromCharCode(65 + steps[currentStep].k)}
                        </p>
                        {steps[currentStep]?.i !== null && steps[currentStep]?.j !== null && (
                          <p className="text-sm">
                            Checking: {String.fromCharCode(65 + steps[currentStep].i!)} →{" "}
                            {String.fromCharCode(65 + steps[currentStep].j!)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">Current Operation</h3>
                    {steps[currentStep]?.phase === "compare" &&
                      steps[currentStep]?.i !== null &&
                      steps[currentStep]?.j !== null && (
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                          <p className="font-medium">Checking if path can be improved:</p>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-primary/10">
                              {String.fromCharCode(65 + steps[currentStep].i!)} →{" "}
                              {String.fromCharCode(65 + steps[currentStep].j!)}
                            </Badge>
                            <span>vs</span>
                            <Badge variant="outline" className="bg-purple-500/10">
                              {String.fromCharCode(65 + steps[currentStep].i!)} →{" "}
                              {String.fromCharCode(65 + steps[currentStep].k)} →{" "}
                              {String.fromCharCode(65 + steps[currentStep].j!)}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p>
                              Current distance:{" "}
                              {formatDistance(
                                steps[currentStep].distanceMatrix[steps[currentStep].i!][steps[currentStep].j!],
                              )}
                            </p>
                            <p>New path distance: {formatDistance(steps[currentStep].newDistance ?? INFINITY)}</p>
                          </div>
                        </div>
                      )}

                    {steps[currentStep]?.phase === "update" &&
                      steps[currentStep]?.i !== null &&
                      steps[currentStep]?.j !== null && (
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded">
                          <p className="font-medium">Path improved!</p>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                            <Badge variant="outline" className="line-through bg-primary/10">
                              {String.fromCharCode(65 + steps[currentStep].i!)} →{" "}
                              {String.fromCharCode(65 + steps[currentStep].j!)}
                            </Badge>
                            <span>replaced with</span>
                            <Badge variant="outline" className="bg-green-500/10">
                              {String.fromCharCode(65 + steps[currentStep].i!)} →{" "}
                              {String.fromCharCode(65 + steps[currentStep].k)} →{" "}
                              {String.fromCharCode(65 + steps[currentStep].j!)}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <p>
                              Old distance:{" "}
                              {formatDistance(
                                steps[currentStep].previousMatrix?.[steps[currentStep].i!][steps[currentStep].j!] ??
                                  INFINITY,
                              )}
                            </p>
                            <p>
                              New distance:{" "}
                              {formatDistance(
                                steps[currentStep].distanceMatrix[steps[currentStep].i!][steps[currentStep].j!],
                              )}
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
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span className="text-sm">Intermediate Node (k)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900"></div>
            <span className="text-sm">Current Cell (i,j)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 dark:bg-green-900"></div>
            <span className="text-sm">Updated Cell</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30"></div>
            <span className="text-sm">Row/Column of k</span>
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
          The Floyd-Warshall algorithm is a dynamic programming approach for finding shortest paths between all pairs of
          vertices in a weighted graph.
        </p>
        <p className="mt-2">
          The algorithm works by considering each vertex as a potential intermediate point on the path between every
          pair of vertices. For each triplet (i,j,k), it checks if the path from i to j can be improved by going through
          k.
        </p>
        <p className="mt-2">
          Time Complexity: O(V³) where V is the number of vertices.
          <br />
          Space Complexity: O(V²) for storing the distance matrix.
        </p>
        <p className="mt-2">
          The algorithm can handle negative edge weights, but not negative cycles (where the sum of edges in a cycle is
          negative).
        </p>
      </div>
    </div>
  )
}
