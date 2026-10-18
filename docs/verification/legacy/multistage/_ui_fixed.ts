// GENERATED from components/multistage-graph-optimization.tsx
import {
  MAX_NODES_PER_STAGE,
  MAX_STAGES,
  MULTISTAGE_EXAMPLE,
  buildMultistageGraph,
  generateMultistageSteps,
  validateStageConfig,
  type MultistageStep,
} from "file:///lib/engines/multistage.ts"


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


export function Comp({ useState, useEffect, useRef }: any) {
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

  const [steps, setSteps] = useState<MultistageStep[]>([])
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
    // ignore values typed into the stage-count box that cannot be a stage count (0, 2.5, 1000, ...)
    if (Number.isInteger(numStages) && numStages > 0 && numStages <= MAX_STAGES) {
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

  // The configuration is passed explicitly so that "Load Example" / "Random Example" build the graph they
  // just configured (state set in the same click is only visible in the next render).
  const generateGraph = (
    stages: number = numStages,
    perStage: number[] = nodesPerStage,
    costs: { [key: string]: number } = edgeCosts,
  ) => {
    const error = validateStageConfig(stages, perStage)
    if (error) {
      setInputError(error)
      return
    }

    setInputError("")

    // "??" keeps a cost of 0 that the user typed ("||" replaced it by a random cost)
    const structure = buildMultistageGraph(stages, perStage, (edgeId) => costs[edgeId] ?? Math.floor(Math.random() * 20) + 1)
    const stageWidth = canvasWidth - 100
    const stageHeight = canvasHeight - 100
    const indexInStage: number[] = []
    const nodes: Node[] = structure.nodes.map((node) => {
      const i = (indexInStage[node.stage] = (indexInStage[node.stage] ?? -1) + 1)
      const nodesInStage = structure.nodes.filter((n) => n.stage === node.stage).length
      return {
        ...node,
        x: 50 + (node.stage * stageWidth) / (stages - 1),
        y: 50 + (stageHeight / (nodesInStage + 1)) * (i + 1),
      }
    })

    const newEdgeCosts: { [key: string]: number } = {}
    for (const edge of structure.edges) newEdgeCosts[`${edge.source}-${edge.target}`] = edge.cost

    setGraph({
      nodes,
      edges: structure.edges,
      stages,
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

    setSteps(generateMultistageSteps(graph))
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
    generateGraph(stages, nodes)
  }

  const loadExample = () => {
    setNumStages(MULTISTAGE_EXAMPLE.nodesPerStage.length)
    setNodesPerStage(MULTISTAGE_EXAMPLE.nodesPerStage)
    generateGraph(MULTISTAGE_EXAMPLE.nodesPerStage.length, MULTISTAGE_EXAMPLE.nodesPerStage, MULTISTAGE_EXAMPLE.costs)
  }

  const updateNodesPerStage = (index: number, value: number) => {
    value = Math.trunc(value) || 1
    if (value < 1) value = 1
    if (value > MAX_NODES_PER_STAGE) value = MAX_NODES_PER_STAGE

    const newNodesPerStage = [...nodesPerStage]
    newNodesPerStage[index] = value

    if (index === numStages - 1) {
      newNodesPerStage[index] = 1
    }

    setNodesPerStage(newNodesPerStage)
  }

  return { loadExample, generateRandomExample, generateGraph, startAlgorithm, graph, numStages, nodesPerStage, steps, setNumStages }
}
