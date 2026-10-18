// Faithful re-creation of HEAD:components/floyd-warshall.tsx state logic.
// Handler bodies pasted verbatim (lines 98-331 and 348-518); React state simulated as in ../bellman-ford/legacy.ts:
// handlers see the snapshot of their render, setState calls are applied after the handler returns,
// and the [numNodes] effect (lines 86-96, verbatim) re-runs when numNodes changes.
type Node = { id: string; label: string; x: number; y: number }
type Edge = { source: string; target: string; weight: number }
type Graph = { nodes: Node[]; edges: Edge[] }
export type AlgorithmStep = {
  phase: 'init' | 'compare' | 'update' | 'complete'
  description: string
  k: number
  i: number | null
  j: number | null
  distanceMatrix: number[][]
  previousMatrix?: number[][]
  newDistance?: number
}
export const INFINITY = Number.MAX_SAFE_INTEGER
export type State = { numNodes: number; inputMatrix: string[][]; inputError: string; graph: Graph; distanceMatrix: number[][]; steps: AlgorithmStep[]
  algorithmStarted: boolean; currentStep: number; pathNodes: string[]; selectedPath: { source: string; target: string } | null }
type Upd<T> = T | ((p: T) => T)
export function createComponent() {
  const state: State = { numNodes: 4, inputMatrix: [], inputError: '', graph: { nodes: [], edges: [] }, distanceMatrix: [], steps: [], algorithmStarted: false, currentStep: 0, pathNodes: [], selectedPath: null }
  const render = (S: State) => {
    const pending: ((s: State) => void)[] = []
    const mk = <K extends keyof State>(k: K) => (v: Upd<State[K]>) => pending.push((s) => { s[k] = typeof v === 'function' ? (v as (p: State[K]) => State[K])(s[k]) : v })
    const { numNodes, inputMatrix, graph, distanceMatrix, steps, algorithmStarted, currentStep, pathNodes } = S
    const setNumNodes = mk('numNodes'), setInputMatrix = mk('inputMatrix'), setInputError = mk('inputError'), setGraph = mk('graph'), setSteps = mk('steps')
    const setDistanceMatrix = mk('distanceMatrix'), setAlgorithmStarted = mk('algorithmStarted'), setCurrentStep = mk('currentStep'), setPathNodes = mk('pathNodes'), setSelectedPath = mk('selectedPath')
    const setIsPlaying = (_: unknown) => {}
    const animationRef = { current: null as null | number }
    const graphWidth = 700, graphHeight = 500
    void pathNodes
    const effect = () => {
    const newInputMatrix: string[][] = Array(numNodes)
      .fill(0)
      .map(() => Array(numNodes).fill("∞"))

    for (let i = 0; i < numNodes; i++) {
      newInputMatrix[i][i] = "0"
    }

    setInputMatrix(newInputMatrix)
    }
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

  // (animation useEffect, lines 332-346, omitted)

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
    return { pending, effect, handleMatrixInputChange, generateGraph, generateRandomGraph, startAlgorithm, handlePathSelection }
  }
  const flush = (pending: ((s: State) => void)[]) => {
    const before = state.numNodes
    for (const p of pending) p(state)
    if (state.numNodes !== before) { const r = render({ ...state }); r.effect(); flush(r.pending) }
  }
  { const r = render({ ...state }); r.effect(); flush(r.pending) }
  type H = 'handleMatrixInputChange' | 'generateGraph' | 'generateRandomGraph' | 'startAlgorithm' | 'handlePathSelection'
  const act = (name: H, ...args: unknown[]) => { const r = render({ ...state }); (r[name] as (...a: unknown[]) => void)(...args); flush(r.pending) }
  return { state, act }
}
