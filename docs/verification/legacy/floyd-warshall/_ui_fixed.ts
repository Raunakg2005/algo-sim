// GENERATED from components/floyd-warshall.tsx
import {
  INFINITY,
  generateFloydWarshallSteps,
  isMatrixEntryInput,
  parseDistanceMatrix,
  reconstructFloydWarshallPath,
  type FloydWarshallStep,
} from "file:///lib/engines/floyd-warshall.ts"


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

  return { generateRandomGraph, generateGraph, startAlgorithm, numNodes, inputMatrix, graph, steps, inputError }
}
