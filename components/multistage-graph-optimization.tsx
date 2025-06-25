"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, StepForward, Plus, Minus, BookOpen } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Node = {
  id: string
  label: string
  stage: number
  x: number
  y: number
  cost?: number
  bestPrev?: string
}

type Edge = {
  source: string
  target: string
  cost: number
}

type Graph = {
  nodes: Node[]
  edges: Edge[]
  stages: number
}

type AlgorithmStep = {
  phase: "init" | "compute" | "backtrack" | "complete"
  description: string
  currentStage: number
  currentNode?: string
  updatedNodes?: string[]
  optimalPath?: string[]
  costs: { [key: string]: number }
  prevNodes: { [key: string]: string | null }
}

export default function MultistageGraphOptimization() {
  const [graph, setGraph] = useState<Graph>({
    nodes: [],
    edges: [],
    stages: 0,
  })

  const [numStages, setNumStages] = useState(4)
  const [nodesPerStage, setNodesPerStage] = useState([2, 3, 2, 1])
  const [edgeCosts, setEdgeCosts] = useState<{ [key: string]: number }>({})
  const [inputError, setInputError] = useState("")
  const [showNodeLabels, setShowNodeLabels] = useState(true)

  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [algorithmStarted, setAlgorithmStarted] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const [canvasWidth, setCanvasWidth] = useState(800)
  const [canvasHeight, setCanvasHeight] = useState(500)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.clientWidth
        const height = Math.max(400, width * 0.5) 
        setCanvasWidth(width)
        setCanvasHeight(height)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    if (numStages > 0) {
      const newNodesPerStage = [...nodesPerStage]

      if (numStages > nodesPerStage.length) {
        for (let i = nodesPerStage.length; i < numStages; i++) {
          newNodesPerStage.push(i === numStages - 1 ? 1 : 2) 
        }
      } else if (numStages < nodesPerStage.length) {
        newNodesPerStage.splice(numStages)
      }

      if (numStages > 0) {
        newNodesPerStage[numStages - 1] = 1
      }

      setNodesPerStage(newNodesPerStage)
    }
  }, [numStages])

  const generateGraph = () => {
    if (numStages < 2) {
      setInputError("Please specify at least 2 stages")
      return
    }

    setInputError("")

    const nodes: Node[] = []
    const edges: Edge[] = []
    const newEdgeCosts: { [key: string]: number } = {}

    const nodeIndex = 0
    for (let stage = 0; stage < numStages; stage++) {
      const nodesInStage = nodesPerStage[stage] || 1
      const stageWidth = canvasWidth - 100
      const stageX = 50 + (stage * stageWidth) / (numStages - 1)

      for (let i = 0; i < nodesInStage; i++) {
        const stageHeight = canvasHeight - 100
        const nodeSpacing = stageHeight / (nodesInStage + 1)
        const nodeY = 50 + nodeSpacing * (i + 1)

        const nodeId = `node-${stage}-${i}`
        const nodeLabel = stage === 0 ? "S" : stage === numStages - 1 ? "T" : `${stage},${i}`

        nodes.push({
          id: nodeId,
          label: nodeLabel,
          stage,
          x: stageX,
          y: nodeY,
        })

        if (stage < numStages - 1) {
          const nextStageNodes = nodesPerStage[stage + 1] || 1

          for (let j = 0; j < nextStageNodes; j++) {
            const targetId = `node-${stage + 1}-${j}`
            const edgeId = `${nodeId}-${targetId}`

            const cost = edgeCosts[edgeId] || Math.floor(Math.random() * 20) + 1
            newEdgeCosts[edgeId] = cost

            edges.push({
              source: nodeId,
              target: targetId,
              cost,
            })
          }
        }
      }
    }

    setGraph({
      nodes,
      edges,
      stages: numStages,
    })

    setEdgeCosts(newEdgeCosts)
    resetAlgorithm()
  }

  const updateEdgeCost = (source: string, target: string, cost: number) => {
    const edgeId = `${source}-${target}`

    setEdgeCosts((prev) => ({
      ...prev,
      [edgeId]: cost,
    }))

    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.map((edge) => {
        if (edge.source === source && edge.target === target) {
          return { ...edge, cost }
        }
        return edge
      }),
    }))
  }

  const startAlgorithm = () => {
    if (graph.nodes.length === 0 || graph.edges.length === 0) {
      setInputError("Please generate a graph first")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []

    const costs: { [key: string]: number } = {}
    const prevNodes: { [key: string]: string | null } = {}

    graph.nodes.forEach((node) => {
      if (node.stage === graph.stages - 1) {
        costs[node.id] = 0 
      } else {
        costs[node.id] = Number.POSITIVE_INFINITY
      }
      prevNodes[node.id] = null
    })

    algorithmSteps.push({
      phase: "init",
      description: "Initialize costs: terminal node = 0, all others = ∞",
      currentStage: graph.stages - 1,
      costs: { ...costs },
      prevNodes: { ...prevNodes },
    })

    for (let stage = graph.stages - 2; stage >= 0; stage--) {
      const nodesInStage = graph.nodes.filter((node) => node.stage === stage)

      algorithmSteps.push({
        phase: "compute",
        description: `Computing optimal costs for Stage ${stage + 1}`,
        currentStage: stage,
        costs: { ...costs },
        prevNodes: { ...prevNodes },
      })

      for (const node of nodesInStage) {
        const outgoingEdges = graph.edges.filter((edge) => edge.source === node.id)

        let minCost = Number.POSITIVE_INFINITY
        let bestNextNode = null

        for (const edge of outgoingEdges) {
          const targetNode = graph.nodes.find((n) => n.id === edge.target)
          if (!targetNode) continue

          const pathCost = edge.cost + costs[edge.target]

          if (pathCost < minCost) {
            minCost = pathCost
            bestNextNode = edge.target
          }
        }

        costs[node.id] = minCost
        prevNodes[node.id] = bestNextNode

        algorithmSteps.push({
          phase: "compute",
          description: `Update node ${node.label}: min cost = ${minCost}`,
          currentStage: stage,
          currentNode: node.id,
          updatedNodes: [node.id],
          costs: { ...costs },
          prevNodes: { ...prevNodes },
        })
      }
    }

    const optimalPath: string[] = []
    let currentNode = graph.nodes.find((node) => node.stage === 0)?.id

    while (currentNode) {
      optimalPath.push(currentNode)
      currentNode = prevNodes[currentNode] ?? undefined
    }

    for (let i = 0; i < optimalPath.length; i++) {
      const pathSoFar = optimalPath.slice(0, i + 1)

      algorithmSteps.push({
        phase: "backtrack",
        description:
          i === 0
            ? "Backtracking to find optimal path: Start at source node"
            : `Backtracking: Follow best edge to node ${graph.nodes.find((n) => n.id === optimalPath[i])?.label}`,
        currentStage: graph.nodes.find((n) => n.id === optimalPath[i])?.stage || 0,
        currentNode: optimalPath[i],
        optimalPath: pathSoFar,
        costs: { ...costs },
        prevNodes: { ...prevNodes },
      })
    }

    const sourceNode = graph.nodes.find((node) => node.stage === 0)
    const optimalCost = sourceNode ? costs[sourceNode.id] : Number.POSITIVE_INFINITY

    algorithmSteps.push({
      phase: "complete",
      description: `Algorithm complete: Optimal cost from source to terminal = ${optimalCost}`,
      currentStage: -1,
      optimalPath,
      costs: { ...costs },
      prevNodes: { ...prevNodes },
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
      const node = graph.nodes.find((n) => n.id === nodeId)
      if (node?.stage === 0) return "bg-green-500"
      if (node?.stage === graph.stages - 1) return "bg-purple-500"
      return "bg-blue-500"
    }

    const step = steps[currentStep]
    if (!step) return "bg-blue-500"

    if (step.currentNode === nodeId) return "bg-yellow-500"
    if (step.updatedNodes?.includes(nodeId)) return "bg-orange-400"
    if (step.optimalPath?.includes(nodeId)) return "bg-teal-500"

    const node = graph.nodes.find((n) => n.id === nodeId)
    if (node?.stage === 0) return "bg-green-500"
    if (node?.stage === graph.stages - 1) return "bg-purple-500"
    if (node?.stage === step.currentStage) return "bg-blue-400"

    return "bg-blue-500"
  }

  const getNodeBorder = (nodeId: string) => {
    if (!algorithmStarted) return ""

    const step = steps[currentStep]
    if (!step) return ""

    if (step.currentNode === nodeId) return "ring-2 ring-yellow-300"
    if (step.optimalPath?.includes(nodeId)) return "ring-2 ring-white"

    return ""
  }

  const getEdgeColor = (source: string, target: string) => {
    if (!algorithmStarted) return "stroke-gray-400"

    const step = steps[currentStep]
    if (!step) return "stroke-gray-400"

    if (step.optimalPath && step.phase !== "init") {
      for (let i = 0; i < step.optimalPath.length - 1; i++) {
        if (step.optimalPath[i] === source && step.optimalPath[i + 1] === target) {
          return "stroke-teal-400"
        }
      }
    }

    if (step.phase === "compute" && step.currentNode === source) {
      const targetNode = graph.nodes.find((n) => n.id === target)
      if (targetNode && targetNode.stage === step.currentStage + 1) {
        return "stroke-yellow-400"
      }
    }

    const sourceNode = graph.nodes.find((n) => n.id === source)
    if (sourceNode && sourceNode.stage === step.currentStage) {
      return "stroke-blue-300"
    }

    return "stroke-gray-400"
  }

  const getEdgeWidth = (source: string, target: string) => {
    if (!algorithmStarted) return 1

    const step = steps[currentStep]
    if (!step) return 1

    if (step.optimalPath && step.phase !== "init") {
      for (let i = 0; i < step.optimalPath.length - 1; i++) {
        if (step.optimalPath[i] === source && step.optimalPath[i + 1] === target) {
          return 3
        }
      }
    }

    if (step.phase === "compute" && step.currentNode === source) {
      const targetNode = graph.nodes.find((n) => n.id === target)
      if (targetNode && targetNode.stage === step.currentStage + 1) {
        return 2
      }
    }

    return 1
  }

  const generateRandomExample = () => {
    const stages = Math.floor(Math.random() * 3) + 3

    const nodes: number[] = []
    for (let i = 0; i < stages; i++) {
      if (i === 0) {
        nodes.push(1) 
      } else if (i === stages - 1) {
        nodes.push(1) 
      } else {
        nodes.push(Math.floor(Math.random() * 3) + 1) 
      }
    }

    setNumStages(stages)
    setNodesPerStage(nodes)

    setTimeout(() => {
      generateGraph()
    }, 0)
  }

  const loadExample = () => {
    setNumStages(4)
    setNodesPerStage([1, 3, 2, 1])

    setTimeout(() => {
      generateGraph()

      const edgeCosts: { [key: string]: number } = {
        "node-0-0-node-1-0": 2,
        "node-0-0-node-1-1": 3,
        "node-0-0-node-1-2": 7,
        "node-1-0-node-2-0": 5,
        "node-1-0-node-2-1": 8,
        "node-1-1-node-2-0": 4,
        "node-1-1-node-2-1": 6,
        "node-1-2-node-2-0": 3,
        "node-1-2-node-2-1": 2,
        "node-2-0-node-3-0": 6,
        "node-2-1-node-3-0": 4,
      }

      Object.entries(edgeCosts).forEach(([edgeId, cost]) => {
        const [source, target] = edgeId.split("-")
        updateEdgeCost(source, target, cost)
      })
    }, 0)
  }

  const updateNodesPerStage = (index: number, value: number) => {
    if (value < 1) value = 1
    if (value > 5) value = 5

    const newNodesPerStage = [...nodesPerStage]
    newNodesPerStage[index] = value

    if (index === numStages - 1) {
      newNodesPerStage[index] = 1
    }

    setNodesPerStage(newNodesPerStage)
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Multistage Graph Optimization</h1>

      <Card className="w-full p-4 space-y-4">
        <h2 className="text-lg font-semibold">Graph Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="stages">Number of Stages</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stages"
                  type="number"
                  min={2}
                  max={10}
                  value={numStages}
                  onChange={(e) => setNumStages(Number(e.target.value))}
                />
                <Button variant="outline" size="icon" onClick={() => setNumStages(Math.max(2, numStages - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setNumStages(Math.min(10, numStages + 1))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Nodes per Stage</Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {nodesPerStage.map((count, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <span className="text-xs text-muted-foreground">Stage {index + 1}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={count}
                        onChange={(e) => updateNodesPerStage(index, Number(e.target.value))}
                        disabled={index === numStages - 1} // Last stage always has 1 node
                        className="w-12 h-8 text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={loadExample}>
                Load Example
              </Button>
              <Button variant="outline" onClick={generateRandomExample}>
                Random Example
              </Button>
              <Button onClick={generateGraph}>Generate Graph</Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Edge Costs</h3>
              <div className="flex items-center space-x-2">
                <Switch id="show-labels" checked={showNodeLabels} onCheckedChange={setShowNodeLabels} />
                <Label htmlFor="show-labels">Show Labels</Label>
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
              {graph.edges.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Generate a graph to edit edge costs</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {graph.edges.map((edge) => {
                      const sourceNode = graph.nodes.find((n) => n.id === edge.source)
                      const targetNode = graph.nodes.find((n) => n.id === edge.target)
                      return (
                        <TableRow key={`${edge.source}-${edge.target}`}>
                          <TableCell>{sourceNode?.label}</TableCell>
                          <TableCell>{targetNode?.label}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={edge.cost}
                              onChange={(e) => updateEdgeCost(edge.source, edge.target, Number(e.target.value))}
                              className="w-16 h-8"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>

        {inputError && <p className="text-sm text-red-500 text-center">{inputError}</p>}
      </Card>

      {/* Graph Visualization */}
      <Card className="w-full p-4 bg-muted/30 relative overflow-hidden">
        {/* Algorithm controls */}
        {graph.nodes.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 w-full mb-4 mt-12">
            {!algorithmStarted ? (
              <Button onClick={startAlgorithm}>Start Algorithm</Button>
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

        {/* Algorithm step description - move this down from the top */}
        {algorithmStarted && steps.length > 0 && (
          <div className="bg-primary/10 rounded-md p-2 text-center text-sm font-medium z-10 mb-4">
            {steps[currentStep]?.description || "Preparing algorithm..."}
          </div>
        )}

        {/* Graph canvas */}
        <div
          ref={canvasRef}
          className="w-full h-[400px] md:h-[500px] bg-gray-900 rounded-md relative mt-8 overflow-hidden"
        >
          {/* Stage labels */}
          {graph.stages > 0 && (
            <div className="absolute top-2 left-0 right-0 flex justify-between px-12">
              {Array.from({ length: graph.stages }).map((_, index) => (
                <div
                  key={index}
                  className={`text-sm font-medium ${
                    algorithmStarted && steps[currentStep]?.currentStage === index ? "text-yellow-300" : "text-white"
                  }`}
                >
                  Stage {index + 1}
                </div>
              ))}
            </div>
          )}

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
                    {edge.cost}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const nodeColor = getNodeColor(node.id)
            const nodeBorder = getNodeBorder(node.id)

            let cost = null
            if (algorithmStarted && steps.length > 0 && currentStep < steps.length) {
              cost = steps[currentStep].costs[node.id]
            }

            return (
              <motion.div
                key={node.id}
                className={`absolute w-12 h-16 rounded-sm flex flex-col items-center justify-center ${nodeColor} ${nodeBorder} transition-colors duration-300`}
                style={{
                  left: node.x - 24,
                  top: node.y - 32,
                  transform: `perspective(600px) rotateX(5deg)`,
                  transformOrigin: "bottom",
                }}
              >
                <BookOpen className="w-3 h-3 absolute top-1 left-1 opacity-30" />

                {showNodeLabels && <span className="font-bold text-white">{node.label}</span>}

                {/* Cost label */}
                {algorithmStarted && cost !== null && (
                  <div className="text-xs text-white mt-1">{cost === Number.POSITIVE_INFINITY ? "∞" : cost}</div>
                )}

                {/* Node indicators */}
                {node.stage === 0 && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400">
                    Source
                  </div>
                )}

                {node.stage === graph.stages - 1 && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-purple-400">
                    Terminal
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Progress bar */}
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

      {/* Legend */}
      <Card className="w-full p-4">
        <h2 className="text-lg font-semibold mb-2">Legend</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm">Source Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span className="text-sm">Terminal Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm">Regular Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Current Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-400"></div>
            <span className="text-sm">Updated Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-teal-500"></div>
            <span className="text-sm">Optimal Path</span>
          </div>
        </div>
      </Card>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          Multistage graph optimization is a classic dynamic programming problem where we need to find the shortest path
          from a source node to a terminal node through a graph with multiple stages.
        </p>
        <p className="mt-2">
          The algorithm works backward from the terminal node, computing the optimal cost for each node by considering
          all possible paths to the next stage. For each node, we choose the edge that leads to the minimum total cost.
        </p>
        <p className="mt-2">
          This approach guarantees finding the globally optimal solution by breaking down the problem into smaller
          subproblems and solving them in a bottom-up manner.
        </p>
      </div>
    </div>
  )
}
