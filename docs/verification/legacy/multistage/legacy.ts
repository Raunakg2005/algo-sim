// Faithful re-creation of HEAD:components/multistage-graph-optimization.tsx state logic.
// Handler bodies pasted verbatim (lines 106-313 and 431-493); the [numStages] effect body (lines 87-103) verbatim.
// React state is simulated: handlers see the snapshot of their render; setState calls are applied after the
// handler returns; setTimeout callbacks run afterwards but keep the closure of the render that scheduled them.
type Node = { id: string; label: string; stage: number; x: number; y: number; cost?: number; bestPrev?: string }
type Edge = { source: string; target: string; cost: number }
type Graph = { nodes: Node[]; edges: Edge[]; stages: number }
export type AlgorithmStep = {
  phase: 'init' | 'compute' | 'backtrack' | 'complete'
  description: string
  currentStage: number
  currentNode?: string
  updatedNodes?: string[]
  optimalPath?: string[]
  costs: { [key: string]: number }
  prevNodes: { [key: string]: string | null }
}
export type State = { graph: Graph; numStages: number; nodesPerStage: number[]; edgeCosts: { [key: string]: number }; inputError: string; steps: AlgorithmStep[] }
type Upd<T> = T | ((p: T) => T)
export function createComponent() {
  const state: State = { graph: { nodes: [], edges: [], stages: 0 }, numStages: 4, nodesPerStage: [2, 3, 2, 1], edgeCosts: {}, inputError: '', steps: [] }
  const timers: (() => void)[] = []
  const render = (S: State) => {
    const pending: ((s: State) => void)[] = []
    const mk = <K extends keyof State>(k: K) => (v: Upd<State[K]>) => pending.push((s) => { s[k] = typeof v === 'function' ? (v as (p: State[K]) => State[K])(s[k]) : v })
    const { graph, numStages, nodesPerStage, edgeCosts } = S
    const setGraph = mk('graph'), setNumStages = mk('numStages'), setNodesPerStage = mk('nodesPerStage'), setEdgeCosts = mk('edgeCosts'), setInputError = mk('inputError'), setSteps = mk('steps')
    const noop = (_: unknown) => {}
    const setAlgorithmStarted = noop, setCurrentStep = noop, setIsPlaying = noop
    const animationRef = { current: null as null | number }
    const canvasWidth = 800, canvasHeight = 500
    const setTimeout = (fn: () => void, _ms: number) => { timers.push(() => { fn(); flush(pending) }) }
    const effect = () => {
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
    }
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
    return { pending, effect, generateGraph, updateEdgeCost, startAlgorithm, generateRandomExample, loadExample, updateNodesPerStage }
  }
  const flush = (pending: ((s: State) => void)[]) => {
    const before = state.numStages
    const todo = pending.splice(0)
    for (const p of todo) p(state)
    if (state.numStages !== before) { const r = render({ ...state }); r.effect(); flush(r.pending) }
  }
  { const r = render({ ...state }); r.effect(); flush(r.pending) }
  type H = 'generateGraph' | 'updateEdgeCost' | 'startAlgorithm' | 'generateRandomExample' | 'loadExample' | 'updateNodesPerStage'
  const act = (name: H, ...args: unknown[]) => {
    const r = render({ ...state }); (r[name] as (...a: unknown[]) => void)(...args); flush(r.pending)
    while (timers.length) timers.shift()!()
  }
  return { state, act }
}
