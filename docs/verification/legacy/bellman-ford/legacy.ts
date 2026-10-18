// Faithful re-creation of HEAD:components/bellman-ford-simulation.tsx state logic.
// Handler bodies are pasted verbatim (lines 103-356); React state is simulated: every handler sees the
// state snapshot of the render it was created in, setState calls are queued and applied after the handler
// returns (React batching), and the [numNodes] effect (lines 86-101, verbatim) re-runs when numNodes changes.
type Node = { id: string; label: string; x: number; y: number }
type Edge = { source: string; target: string; weight: number }
type Graph = { nodes: Node[]; edges: Edge[] }
export type AlgorithmStep = {
  phase: 'init' | 'relax' | 'update' | 'negative-cycle' | 'complete'
  description: string
  iteration: number
  edge?: { source: string; target: string; weight: number }
  distances: Record<string, number>
  previousDistances?: Record<string, number>
  predecessors: Record<string, string | null>
  relaxed?: boolean
}
export const INFINITY = Number.MAX_SAFE_INTEGER
export type State = { numNodes: number; sourceNode: string; inputMatrix: string[][]; inputError: string; graph: Graph; steps: AlgorithmStep[] }
type Upd<T> = T | ((p: T) => T)
export function createComponent() {
  const state: State = { numNodes: 5, sourceNode: 'A', inputMatrix: [], inputError: '', graph: { nodes: [], edges: [] }, steps: [] }
  const render = (S: State) => {
    const pending: ((s: State) => void)[] = []
    const mk = <K extends keyof State>(k: K) => (v: Upd<State[K]>) => pending.push((s) => { s[k] = typeof v === 'function' ? (v as (p: State[K]) => State[K])(s[k]) : v })
    const { numNodes, sourceNode, inputMatrix, graph } = S
    const setNumNodes = mk('numNodes'), setSourceNode = mk('sourceNode'), setInputMatrix = mk('inputMatrix'), setInputError = mk('inputError'), setGraph = mk('graph'), setSteps = mk('steps')
    const noop = (_: unknown) => {}
    const setAlgorithmStarted = noop, setCurrentStep = noop, setIsPlaying = noop, setSelectedTarget = noop, setPathNodes = noop
    const animationRef = { current: null as null | number }
    const graphWidth = 700, graphHeight = 400
    const effect = () => {
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
    }
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
    return { pending, effect, handleMatrixInputChange, generateGraph, generateRandomGraph, startAlgorithm }
  }
  const flush = (pending: ((s: State) => void)[]) => {
    const before = state.numNodes
    for (const p of pending) p(state)
    if (state.numNodes !== before) { const r = render({ ...state }); r.effect(); flush(r.pending) }
  }
  { const r = render({ ...state }); r.effect(); flush(r.pending) } // mount
  type H = 'handleMatrixInputChange' | 'generateGraph' | 'generateRandomGraph' | 'startAlgorithm'
  const act = (name: H, ...args: unknown[]) => { const r = render({ ...state }); (r[name] as (...a: unknown[]) => void)(...args); flush(r.pending) }
  return { state, act }
}
