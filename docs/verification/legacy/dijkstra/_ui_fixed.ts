// GENERATED from components/dijkstra-simulation.tsx
import { generateDijkstraSteps, validateDijkstraInput, type DijkstraStep } from "file:///lib/engines/dijkstra.ts"


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


export function Comp({ useState, useEffect, useRef }: any) {
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

  return { loadExampleGraph, startAlgorithm, parseBulkInput, setBulkInput, setSourceNode, setTargetNode, steps, inputError, graph }
}
