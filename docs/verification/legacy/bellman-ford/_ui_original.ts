// GENERATED from docs/verification/legacy/bellman-ford/original.tsx



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


export function Comp({ useState, useEffect, useRef }: any) {
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

  return { generateRandomGraph, generateGraph, startAlgorithm, numNodes, inputMatrix, graph, steps, inputError, sourceNode }
}
