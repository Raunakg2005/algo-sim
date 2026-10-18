// GENERATED from docs/verification/legacy/floyd-warshall/original.tsx



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
  phase: "init" | "compare" | "update" | "complete"
  description: string
  k: number
  i: number | null
  j: number | null
  distanceMatrix: number[][]
  previousMatrix?: number[][]
  newDistance?: number
}

const INFINITY = Number.MAX_SAFE_INTEGER


export function Comp({ useState, useEffect, useRef }: any) {
  const [graph, setGraph] = useState<Graph>({
    nodes: [],
    edges: [],
  })

  const [numNodes, setNumNodes] = useState<number>(4)
  const [distanceMatrix, setDistanceMatrix] = useState<number[][]>([])
  const [inputMatrix, setInputMatrix] = useState<string[][]>([])
  const [inputError, setInputError] = useState<string>("")

  const [steps, setSteps] = useState<AlgorithmStep[]>([])
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
    const newInputMatrix: string[][] = Array(numNodes)
      .fill(0)
      .map(() => Array(numNodes).fill("∞"))

    for (let i = 0; i < numNodes; i++) {
      newInputMatrix[i][i] = "0"
    }

    setInputMatrix(newInputMatrix)
  }, [numNodes])

  const handleMatrixInputChange = (i: number, j: number, value: string) => {
    if (i === j) return 

    const newMatrix = JSON.parse(JSON.stringify(inputMatrix))

    if (value === "" || value === "∞" || /^[0-9]+$/.test(value)) {
      newMatrix[i][j] = value
      setInputMatrix(newMatrix)
    }
  }

  const validateAndConvertMatrix = (): number[][] | null => {
    const matrix: number[][] = []

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
        }
      }
    }

    return matrix
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

    const validMatrix = validateAndConvertMatrix()
    if (!validMatrix) return

    setInputError("")
    setDistanceMatrix(validMatrix)

    const nodes: Node[] = []
    const edges: Edge[] = []

    const nodeRadius = 20
    const padding = nodeRadius + 40
    const centerX = graphWidth / 2
    const centerY = graphHeight / 2
    const radius = Math.min(graphWidth, graphHeight) / 3 - padding

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

    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
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
    generateGraph()
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

    const n = distanceMatrix.length
    const steps: AlgorithmStep[] = []

    const dist: number[][] = JSON.parse(JSON.stringify(distanceMatrix))

    steps.push({
      phase: "init",
      description: "Initialize distance matrix with direct edge weights",
      k: -1,
      i: null,
      j: null,
      distanceMatrix: JSON.parse(JSON.stringify(dist)),
    })

    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (dist[i][k] === INFINITY || dist[k][j] === INFINITY) {
            steps.push({
              phase: "compare",
              description: `Comparing paths from ${String.fromCharCode(65 + i)} to ${String.fromCharCode(65 + j)} via ${String.fromCharCode(65 + k)}. Current: ${dist[i][j] === INFINITY ? "∞" : dist[i][j]}, New: ∞ (not possible)`,
              k,
              i,
              j,
              distanceMatrix: JSON.parse(JSON.stringify(dist)),
              previousMatrix: JSON.parse(JSON.stringify(dist)),
            })
            continue
          }

          const newDist = dist[i][k] + dist[k][j]

          steps.push({
            phase: "compare",
            description: `Comparing paths from ${String.fromCharCode(65 + i)} to ${String.fromCharCode(65 + j)} via ${String.fromCharCode(65 + k)}. Current: ${dist[i][j] === INFINITY ? "∞" : dist[i][j]}, New: ${newDist}`,
            k,
            i,
            j,
            distanceMatrix: JSON.parse(JSON.stringify(dist)),
            previousMatrix: JSON.parse(JSON.stringify(dist)),
            newDistance: newDist,
          })

          if (newDist < dist[i][j]) {
            const oldDist = dist[i][j]
            dist[i][j] = newDist

            steps.push({
              phase: "update",
              description: `Update: Path from ${String.fromCharCode(65 + i)} to ${String.fromCharCode(65 + j)} via ${String.fromCharCode(65 + k)} is shorter (${oldDist === INFINITY ? "∞" : oldDist} → ${newDist})`,
              k,
              i,
              j,
              distanceMatrix: JSON.parse(JSON.stringify(dist)),
              previousMatrix: JSON.parse(JSON.stringify({ ...dist, [i]: { ...dist[i], [j]: oldDist } })),
              newDistance: newDist,
            })
          }
        }
      }
    }

    steps.push({
      phase: "complete",
      description: "Algorithm complete. Final distance matrix shows shortest path between all pairs of nodes.",
      k: n,
      i: null,
      j: null,
      distanceMatrix: JSON.parse(JSON.stringify(dist)),
    })

    setSteps(steps)
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
        if (
          (pathNodes[i] === sourceNode.label && pathNodes[i + 1] === targetNode.label) ||
          (pathNodes[i] === targetNode.label && pathNodes[i + 1] === sourceNode.label)
        ) {
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
        if (
          (pathNodes[i] === sourceNode.label && pathNodes[i + 1] === targetNode.label) ||
          (pathNodes[i] === targetNode.label && pathNodes[i + 1] === sourceNode.label)
        ) {
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
    const sourceIndex = source.charCodeAt(0) - 65
    const targetIndex = target.charCodeAt(0) - 65

    if (finalMatrix[sourceIndex][targetIndex] === INFINITY) {
      setPathNodes([])
      return
    }

    const path: string[] = [source]

    const findIntermediateNodes = (start: number, end: number, visited: Set<number>): string[] => {
      if (visited.has(start) || visited.has(end)) return []

      visited.add(start)
      visited.add(end)

      for (let k = 0; k < finalMatrix.length; k++) {
        if (
          k !== start &&
          k !== end &&
          finalMatrix[start][k] !== INFINITY &&
          finalMatrix[k][end] !== INFINITY &&
          finalMatrix[start][k] + finalMatrix[k][end] === finalMatrix[start][end]
        ) {
          const intermediateNode = String.fromCharCode(65 + k)

          const firstHalf = findIntermediateNodes(start, k, new Set(visited))
          const secondHalf = findIntermediateNodes(k, end, new Set(visited))

          return [...firstHalf, intermediateNode, ...secondHalf]
        }
      }

      return []
    }

    const intermediateNodes = findIntermediateNodes(sourceIndex, targetIndex, new Set())
    path.push(...intermediateNodes)
    path.push(target)

    setPathNodes(path)
  }

  const handlePathSelection = (source: string, target: string) => {
    setSelectedPath({ source, target })
    reconstructPath(source, target)
  }

  return { generateRandomGraph, generateGraph, startAlgorithm, numNodes, inputMatrix, graph, steps, inputError }
}
