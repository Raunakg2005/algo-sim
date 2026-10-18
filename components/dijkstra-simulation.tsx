"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, RotateCcw, StepForward, X, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { generateDijkstraSteps, validateDijkstraInput, type DijkstraStep } from "@/lib/engines/dijkstra"

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

export default function DijkstraShortestPath() {
  const [graph, setGraph] = useState<Graph>({
    nodes: [],
    edges: [],
  })

  const [newNodeLabel, setNewNodeLabel] = useState("")
  const [sourceNode, setSourceNode] = useState<string | null>(null)
  const [targetNode, setTargetNode] = useState<string | null>(null)
  const [edgeSource, setEdgeSource] = useState<string | null>(null)
  const [edgeTarget, setEdgeTarget] = useState<string | null>(null)
  const [edgeWeight, setEdgeWeight] = useState<number>(1)
  const [inputError, setInputError] = useState("")
  const [bulkInput, setBulkInput] = useState("")
  const [showNodeLabels, setShowNodeLabels] = useState(true)

  const [steps, setSteps] = useState<DijkstraStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [algorithmStarted, setAlgorithmStarted] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const [canvasWidth, setCanvasWidth] = useState(600)
  const [canvasHeight, setCanvasHeight] = useState(400)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.clientWidth
        const height = Math.max(400, width * 0.6) 
        setCanvasWidth(width)
        setCanvasHeight(height)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const addNode = () => {
    if (!newNodeLabel.trim()) {
      setInputError("Node label cannot be empty")
      return
    }

    if (graph.nodes.some((node) => node.label === newNodeLabel.trim())) {
      setInputError("A node with this label already exists")
      return
    }

    setInputError("")

    const padding = 50
    const x = Math.random() * (canvasWidth - 2 * padding) + padding
    const y = Math.random() * (canvasHeight - 2 * padding) + padding

    const newNode: Node = {
      id: `node-${Date.now()}`,
      label: newNodeLabel.trim(),
      x,
      y,
    }

    setGraph((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }))

    setNewNodeLabel("")
  }

  const addEdge = () => {
    if (!edgeSource || !edgeTarget) {
      setInputError("Please select both source and target nodes")
      return
    }

    if (edgeSource === edgeTarget) {
      setInputError("Source and target nodes must be different")
      return
    }

    if (
      graph.edges.some(
        (edge) =>
          (edge.source === edgeSource && edge.target === edgeTarget) ||
          (edge.source === edgeTarget && edge.target === edgeSource),
      )
    ) {
      setInputError("An edge between these nodes already exists")
      return
    }

    setInputError("")

    const newEdge: Edge = {
      source: edgeSource,
      target: edgeTarget,
      weight: edgeWeight,
    }

    setGraph((prev) => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }))

    setEdgeSource(null)
    setEdgeTarget(null)
    setEdgeWeight(1)
  }

  const removeNode = (nodeId: string) => {
    const updatedNodes = graph.nodes.filter((node) => node.id !== nodeId)

    const updatedEdges = graph.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)

    setGraph({
      nodes: updatedNodes,
      edges: updatedEdges,
    })

    if (sourceNode === nodeId) setSourceNode(null)
    if (targetNode === nodeId) setTargetNode(null)
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

  const parseBulkInput = () => {
    try {
      setInputError("")

      const lines = bulkInput.trim().split("\n")

      const newNodes: Node[] = []
      const newEdges: Edge[] = []

      const nodeLabels = lines[0].split(",").map((label) => label.trim())

      if (nodeLabels.length === 0 || (nodeLabels.length === 1 && nodeLabels[0] === "")) {
        throw new Error("Please provide at least one node")
      }

      const uniqueLabels = new Set(nodeLabels)
      if (uniqueLabels.size !== nodeLabels.length) {
        throw new Error("Node labels must be unique")
      }

      const padding = 100 
      nodeLabels.forEach((label) => {
        const x = Math.random() * (canvasWidth - 2 * padding) + padding
        const y = Math.random() * (canvasHeight - 2 * padding) + padding

        newNodes.push({
          id: `node-${label}`,
          label,
          x,
          y,
        })
      })

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(",").map((part) => part.trim())
        if (parts.length !== 3) {
          throw new Error(`Invalid edge format on line ${i + 1}. Expected: source,target,weight`)
        }

        const [source, target, weightStr] = parts
        const weight = Number(weightStr)

        if (isNaN(weight)) {
          throw new Error(`Invalid weight on line ${i + 1}. Expected a number.`)
        }

        const sourceNodeId = newNodes.find((node) => node.label === source)?.id
        const targetNodeId = newNodes.find((node) => node.label === target)?.id

        if (!sourceNodeId) {
          throw new Error(`Source node "${source}" on line ${i + 1} not found in node list`)
        }

        if (!targetNodeId) {
          throw new Error(`Target node "${target}" on line ${i + 1} not found in node list`)
        }

        newEdges.push({
          source: sourceNodeId,
          target: targetNodeId,
          weight,
        })
      }

      setGraph({
        nodes: newNodes,
        edges: newEdges,
      })

      setSourceNode(null)
      setTargetNode(null)

      setBulkInput("")
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message)
      } else {
        setInputError("An unknown error occurred")
      }
    }
  }

  const loadExampleGraph = () => {
    const exampleNodes: Node[] = [
      { id: "node-A", label: "A", x: canvasWidth * 0.2, y: canvasHeight * 0.2 },
      { id: "node-B", label: "B", x: canvasWidth * 0.5, y: canvasHeight * 0.1 },
      { id: "node-C", label: "C", x: canvasWidth * 0.8, y: canvasHeight * 0.2 },
      { id: "node-D", label: "D", x: canvasWidth * 0.1, y: canvasHeight * 0.6 },
      { id: "node-E", label: "E", x: canvasWidth * 0.5, y: canvasHeight * 0.5 },
      { id: "node-F", label: "F", x: canvasWidth * 0.9, y: canvasHeight * 0.6 },
    ]

    const exampleEdges: Edge[] = [
      { source: "node-A", target: "node-B", weight: 4 },
      { source: "node-A", target: "node-D", weight: 2 },
      { source: "node-B", target: "node-C", weight: 3 },
      { source: "node-B", target: "node-E", weight: 3 },
      { source: "node-C", target: "node-F", weight: 2 },
      { source: "node-D", target: "node-E", weight: 5 },
      { source: "node-E", target: "node-F", weight: 1 },
    ]

    setGraph({
      nodes: exampleNodes,
      edges: exampleEdges,
    })

    setSourceNode("node-A")
    setTargetNode("node-F")
  }

  const startAlgorithm = () => {
    // rejects a missing source and negative weights (Dijkstra's greedy choice is only valid for weights >= 0)
    const error = validateDijkstraInput(graph, sourceNode)
    if (error || !sourceNode) {
      setInputError(error ?? "Please select a source node")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)
    setSteps(generateDijkstraSteps(graph, sourceNode, targetNode))
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

  const getNodeColor = (nodeId: string) => {
    if (!algorithmStarted) {
      if (nodeId === sourceNode) return "bg-green-500"
      if (nodeId === targetNode) return "bg-purple-500"
      return "bg-blue-500"
    }

    const step = steps[currentStep]
    if (!step) return "bg-blue-500"

    const nodeState = step.nodeStates[nodeId]
    if (!nodeState) return "bg-blue-500" // node added after the run started

    if (nodeState.current) return "bg-yellow-500"
    if (nodeId === sourceNode) return "bg-green-500"
    if (nodeId === targetNode) return "bg-purple-500"
    if (nodeState.visited) return "bg-teal-500"
    if (nodeState.relaxed) return "bg-orange-400"
    return "bg-blue-500"
  }

  const getNodeBorder = (nodeId: string) => {
    if (!algorithmStarted) {
      if (nodeId === sourceNode || nodeId === targetNode) return "ring-2 ring-white"
      return ""
    }

    const step = steps[currentStep]
    if (!step) return ""

    const nodeState = step.nodeStates[nodeId]
    if (!nodeState) return ""

    if (nodeState.current) return "ring-2 ring-yellow-300"
    if (step.finalPath?.includes(nodeId)) return "ring-2 ring-white"
    return ""
  }

  const getEdgeColor = (source: string, target: string) => {
    if (!algorithmStarted) return "stroke-gray-400"

    const step = steps[currentStep]
    if (!step) return "stroke-gray-400"

    if (step.phase === "relax" && step.relaxedEdges) {
      const relaxedEdge = step.relaxedEdges.find(
        (edge) =>
          (edge.source === source && edge.target === target) || (edge.source === target && edge.target === source),
      )

      if (relaxedEdge) {
        return relaxedEdge.improved ? "stroke-orange-400" : "stroke-gray-400"
      }
    }

    if (step.finalPath) {
      for (let i = 0; i < step.finalPath.length - 1; i++) {
        if (
          (step.finalPath[i] === source && step.finalPath[i + 1] === target) ||
          (step.finalPath[i] === target && step.finalPath[i + 1] === source)
        ) {
          return "stroke-white"
        }
      }
    }

    return "stroke-gray-400"
  }

  const getEdgeWidth = (source: string, target: string) => {
    if (!algorithmStarted) return 1

    const step = steps[currentStep]
    if (!step) return 1

    if (step.phase === "relax" && step.relaxedEdges) {
      const relaxedEdge = step.relaxedEdges.find(
        (edge) =>
          (edge.source === source && edge.target === target) || (edge.source === target && edge.target === source),
      )

      if (relaxedEdge) {
        return relaxedEdge.improved ? 2 : 1
      }
    }

    if (step.finalPath) {
      for (let i = 0; i < step.finalPath.length - 1; i++) {
        if (
          (step.finalPath[i] === source && step.finalPath[i + 1] === target) ||
          (step.finalPath[i] === target && step.finalPath[i + 1] === source)
        ) {
          return 3
        }
      }
    }

    return 1
  }

  const formatDistance = (distance: number) => {
    return distance === Number.POSITIVE_INFINITY ? "∞" : distance
  }

  const randomGraph = () => {
    const nodeCount = Math.floor(Math.random() * 4) + 5
    const nodes: Node[] = []

    const padding = 100 

    const cols = Math.ceil(Math.sqrt(nodeCount))
    const rows = Math.ceil(nodeCount / cols)

    const cellWidth = (canvasWidth - 2 * padding) / cols
    const cellHeight = (canvasHeight - 2 * padding) / rows

    for (let i = 0; i < nodeCount; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols

      const jitter = 0.3 
      const x = padding + col * cellWidth + cellWidth * (0.5 + (Math.random() - 0.5) * jitter)
      const y = padding + row * cellHeight + cellHeight * (0.5 + (Math.random() - 0.5) * jitter)

      const label = String.fromCharCode(65 + i) 
      nodes.push({
        id: `node-${label}`,
        label,
        x,
        y,
      })
    }

    const edges: Edge[] = []
    const maxEdges = (nodeCount * (nodeCount - 1)) / 2
    const edgeCount = Math.floor(Math.random() * (maxEdges * 0.3) + maxEdges * 0.3)

    for (let i = 0; i < edgeCount; i++) {
      let source: number, target: number
      do {
        source = Math.floor(Math.random() * nodeCount)
        target = Math.floor(Math.random() * nodeCount)
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
        weight: Math.floor(Math.random() * 10) + 1,
      })
    }

    setGraph({ nodes, edges })

    setSourceNode(nodes[0].id)
    setTargetNode(nodes[nodes.length - 1].id)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Dijkstra's Shortest Path Algorithm</h1>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Input</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-4">
              <h2 className="text-lg font-semibold">Add Node</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Node Label"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addNode}>Add</Button>
              </div>

              <h2 className="text-lg font-semibold">Add Edge</h2>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex gap-2">
                  <Select value={edgeSource || ""} onValueChange={setEdgeSource}>
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

                  <Select value={edgeTarget || ""} onValueChange={setEdgeTarget}>
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

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      type="number"
                      min={1}
                      value={edgeWeight}
                      onChange={(e) => setEdgeWeight(Number(e.target.value))}
                    />
                  </div>
                  <Button className="self-end" onClick={addEdge}>
                    Add Edge
                  </Button>
                </div>
              </div>

              <h2 className="text-lg font-semibold">Source & Target</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="source">Source Node</Label>
                  <Select value={sourceNode || ""} onValueChange={setSourceNode}>
                    <SelectTrigger id="source">
                      <SelectValue placeholder="Select Source" />
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

                <div>
                  <Label htmlFor="target">Target Node (Optional)</Label>
                  <Select value={targetNode || ""} onValueChange={setTargetNode}>
                    <SelectTrigger id="target">
                      <SelectValue placeholder="Select Target" />
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
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={loadExampleGraph}>
                  Load Example
                </Button>

                <div className="flex items-center space-x-2">
                  <Switch id="show-labels" checked={showNodeLabels} onCheckedChange={setShowNodeLabels} />
                  <Label htmlFor="show-labels">Show Labels</Label>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h2 className="text-lg font-semibold">Nodes</h2>
              <div className="max-h-[150px] overflow-y-auto">
                {graph.nodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No nodes added yet</p>
                ) : (
                  <ul className="space-y-1">
                    {graph.nodes.map((node) => (
                      <li
                        key={node.id}
                        className="flex justify-between items-center text-sm p-1 rounded hover:bg-muted"
                      >
                        <span>{node.label}</span>
                        <Button aria-label="Remove node" variant="ghost" size="icon" onClick={() => removeNode(node.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <h2 className="text-lg font-semibold">Edges</h2>
              <div className="max-h-[150px] overflow-y-auto">
                {graph.edges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No edges added yet</p>
                ) : (
                  <ul className="space-y-1">
                    {graph.edges.map((edge) => {
                      const sourceNode = graph.nodes.find((n) => n.id === edge.source)
                      const targetNode = graph.nodes.find((n) => n.id === edge.target)
                      return (
                        <li
                          key={`${edge.source}-${edge.target}`}
                          className="flex justify-between items-center text-sm p-1 rounded hover:bg-muted"
                        >
                          <span>
                            {sourceNode?.label} → {targetNode?.label} (weight: {edge.weight})
                          </span>
                          <Button aria-label="Remove edge" variant="ghost" size="icon" onClick={() => removeEdge(edge.source, edge.target)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {inputError && <p className="text-sm text-red-500 text-center">{inputError}</p>}
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Bulk Input</h2>
            <p className="text-sm text-muted-foreground">
              Enter your graph in the following format:
              <br />
              First line: comma-separated node labels (e.g., "A,B,C,D")
              <br />
              Subsequent lines: edges in format "source,target,weight" (e.g., "A,B,5")
            </p>
            <Textarea
              placeholder="A,B,C,D,E,F
A,B,4
A,D,2
B,C,3
B,E,3
C,F,2
D,E,5
E,F,1"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={10}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={loadExampleGraph}>
                Load Example
              </Button>
              <Button onClick={parseBulkInput}>Parse Input</Button>
            </div>

            {inputError && <p className="text-sm text-red-500">{inputError}</p>}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Graph Visualization */}
      <Card className="w-full p-4 bg-muted/30 relative overflow-hidden">
        {/* Algorithm controls */}
        {graph.nodes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 w-full mb-4 mt-12">
            {!algorithmStarted ? (
              <div className="flex gap-2">
                <Button onClick={startAlgorithm} disabled={!sourceNode}>
                  Start Algorithm
                </Button>
                <Button variant="outline" onClick={randomGraph}>
                  Random Graph
                </Button>
              </div>
            ) : (
              <>
                <Button onClick={resetAlgorithm} variant="outline">
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
              </>
            )}
          </div>
        )}

        {/* Algorithm step description */}
        {algorithmStarted && steps.length > 0 && (
          <div className="absolute top-4 left-4 right-4 bg-primary/10 rounded-md p-2 text-center text-sm font-medium z-10">
            {steps[currentStep]?.description || "Preparing algorithm..."}
          </div>
        )}

        {/* Graph canvas */}
        <div
          ref={canvasRef}
          className="w-full h-[500px] md:h-[600px] bg-gray-900 rounded-md relative mt-8 overflow-hidden"
        >
          {/* Edges */}
          <svg className="absolute inset-0 w-full h-full">
            {graph.edges.map((edge) => {
              const sourceNode = graph.nodes.find((n) => n.id === edge.source)
              const targetNode = graph.nodes.find((n) => n.id === edge.target)

              if (!sourceNode || !targetNode) return null

              const edgeColor = getEdgeColor(edge.source, edge.target)
              const edgeWidth = getEdgeWidth(edge.source, edge.target)

              const midX = (sourceNode.x + targetNode.x) / 2
              const midY = (sourceNode.y + targetNode.y) / 2

              const dx = targetNode.x - sourceNode.x
              const dy = targetNode.y - sourceNode.y
              const angle = Math.atan2(dy, dx)
              const offset = 15
              const labelX = midX + offset * Math.sin(angle)
              const labelY = midY - offset * Math.cos(angle)

              return (
                <g key={`${edge.source}-${edge.target}`}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    className={`${edgeColor} transition-all duration-300`}
                    strokeWidth={edgeWidth}
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    className="fill-white text-xs"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {edge.weight}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const nodeColor = getNodeColor(node.id)
            const nodeBorder = getNodeBorder(node.id)

            let distance = null
            if (algorithmStarted && steps.length > 0 && currentStep < steps.length) {
              const nodeState = steps[currentStep].nodeStates[node.id]
              if (nodeState) {
                distance = nodeState.distance
              }
            }

            return (
              <motion.div
                key={node.id}
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center ${nodeColor} ${nodeBorder} transition-colors duration-300 cursor-move`}
                style={{
                  left: node.x - 20,
                  top: node.y - 20,
                }}
                drag
                dragConstraints={canvasRef}
                onDrag={(_, info) => {
                  const newNodes = graph.nodes.map((n) => {
                    if (n.id === node.id) {
                      return {
                        ...n,
                        x: node.x + info.delta.x,
                        y: node.y + info.delta.y,
                      }
                    }
                    return n
                  })

                  setGraph((prev) => ({
                    ...prev,
                    nodes: newNodes,
                  }))
                }}
              >
                {showNodeLabels && <span className="font-bold text-white">{node.label}</span>}

                {algorithmStarted && distance !== null && (
                  <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-0.5 rounded text-xs text-white">
                    {formatDistance(distance)}
                  </div>
                )}

                {node.id === sourceNode && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400">
                    Source
                  </div>
                )}

                {node.id === targetNode && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-purple-400">
                    Target
                  </div>
                )}

                {algorithmStarted && steps.length > 0 && steps[currentStep].nodeStates[node.id]?.visited && (
                  <div className="absolute -top-3 -right-3 bg-teal-500 rounded-full w-4 h-4 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {algorithmStarted && steps.length > 0 && (
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
        )}
      </Card>

      <Card className="w-full p-4">
        <h2 className="text-lg font-semibold mb-2">Legend</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm">Source Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span className="text-sm">Target Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm">Unvisited Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Current Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-teal-500"></div>
            <span className="text-sm">Visited Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-400"></div>
            <span className="text-sm">Relaxed Node</span>
          </div>
        </div>
      </Card>

      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          Dijkstra's algorithm finds the shortest path from a source node to all other nodes in a weighted graph. It
          works by greedily selecting the node with the minimum tentative distance and relaxing its neighbors.
        </p>
        <p className="mt-2">
          The algorithm maintains a set of unvisited nodes and a tentative distance for each node. Initially, the source
          node has distance 0 and all other nodes have distance infinity. At each step, it selects the unvisited node
          with the minimum distance, marks it as visited, and updates the distances of its neighbors if a shorter path
          is found.
        </p>
      </div>
    </div>
  )
}
