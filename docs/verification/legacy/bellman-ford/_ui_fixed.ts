// GENERATED from components/bellman-ford-simulation.tsx
import {
  INFINITY,
  generateBellmanFordSteps,
  isMatrixEntryInput,
  parseWeightMatrix,
  reconstructBellmanFordPath,
  type BellmanFordStep,
} from "file:///lib/engines/bellman-ford.ts"


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

  const [numNodes, setNumNodes] = useState<number>(5)
  const [sourceNode, setSourceNode] = useState<string>("A")
  const [inputMatrix, setInputMatrix] = useState<string[][]>([])
  const [inputError, setInputError] = useState<string>("")

  const [steps, setSteps] = useState<BellmanFordStep[]>([])
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
    const size = Number.isInteger(numNodes) && numNodes > 0 ? numNodes : 0
    if (inputMatrix.length !== size) {
      const newInputMatrix: string[][] = Array.from({ length: size }, (_, i) =>
        Array.from({ length: size }, (_, j) => (i === j ? "0" : "∞")),
      )
      setInputMatrix(newInputMatrix)
    }

    const validLabels = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i))
    if (validLabels.length > 0 && !validLabels.includes(sourceNode)) {
      setSourceNode(validLabels[0])
    }
  }, [numNodes])

  const handleMatrixInputChange = (i: number, j: number, value: string) => {
    if (i === j) return

    const newMatrix = JSON.parse(JSON.stringify(inputMatrix))

    // "-" must be accepted while typing a negative number; incomplete entries are rejected on Generate Graph
    if (isMatrixEntryInput(value)) {
      newMatrix[i][j] = value
      setInputMatrix(newMatrix)
    }
  }

  // n and matrix are passed explicitly so that "Random Graph" can build the graph from the matrix it just
  // generated (state set in the same click is not visible until the next render)
  const generateGraph = (n: number = numNodes, matrix: string[][] = inputMatrix) => {
    if (!Number.isInteger(n) || n < 2) {
      setInputError("Please specify at least 2 nodes")
      return
    }

    if (n > 10) {
      setInputError("Please specify 10 or fewer nodes for better visualization")
      return
    }

    const parsed = parseWeightMatrix(matrix, n)
    if ("error" in parsed) {
      setInputError(parsed.error)
      return
    }

    setInputError("")

    const nodes: Node[] = []

    const nodeRadius = 20
    const padding = nodeRadius + 40
    const centerX = graphWidth / 2
    const centerY = graphHeight / 2
    const radius = Math.min(graphWidth, graphHeight) / 2.5 - padding

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

    setGraph({
      nodes,
      edges: parsed.edges.map((e) => ({ source: `node-${e.source}`, target: `node-${e.target}`, weight: e.weight })),
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

    generateGraph(randomNodes, matrix)
  }

  const startAlgorithm = () => {
    if (graph.nodes.length === 0) {
      setInputError("Please generate a graph first")
      return
    }

    if (!graph.nodes.some((n) => n.label === sourceNode)) {
      setInputError(`Source node ${sourceNode} is not in the generated graph. Click Generate Graph first.`)
      return
    }

    setInputError("")
    setAlgorithmStarted(true)
    setSelectedTarget(null)
    setPathNodes([])

    const labelOf = (id: string) => graph.nodes.find((n) => n.id === id)!.label
    const edges = graph.edges.map((edge) => ({ source: labelOf(edge.source), target: labelOf(edge.target), weight: edge.weight }))
    setSteps(generateBellmanFordSteps(graph.nodes.map((n) => n.label), edges, sourceNode))
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
    setPathNodes(reconstructBellmanFordPath(steps[steps.length - 1], target))
  }

  return { generateRandomGraph, generateGraph, startAlgorithm, numNodes, inputMatrix, graph, steps, inputError, sourceNode }
}
