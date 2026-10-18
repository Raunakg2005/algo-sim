// Engine for the Multistage Graph visualizer: backward dynamic programming from the terminal stage.
// cost(v) = min over edges v -> w of (c(v, w) + cost(w)), stage by stage from the last stage to stage 0.
// Pure functions: the graph structure is built from the stage sizes (complete bipartite links between
// consecutive stages) and the step list is computed from a graph with explicit edge costs.
//
// If the first stage has several nodes (the UI allows it and labels all of them "S"), the optimum is the
// cheapest of them and backtracking starts there (the original code always used the first one).

export type MultistageNode = { id: string; label: string; stage: number }
export type MultistageEdge = { source: string; target: string; cost: number }
export type MultistageGraph = { nodes: MultistageNode[]; edges: MultistageEdge[]; stages: number }

export type MultistageStep = {
  phase: "init" | "compute" | "backtrack" | "complete"
  description: string
  currentStage: number
  currentNode?: string
  updatedNodes?: string[]
  optimalPath?: string[]
  costs: { [key: string]: number }
  prevNodes: { [key: string]: string | null }
}

export const MIN_STAGES = 2
export const MAX_STAGES = 10
export const MAX_NODES_PER_STAGE = 5

export const multistageNodeId = (stage: number, index: number) => `node-${stage}-${index}`
export const multistageEdgeId = (source: string, target: string) => `${source}-${target}`

/** The built-in example: 4 stages with 1, 3, 2, 1 nodes and fixed costs (optimum 13). */
export const MULTISTAGE_EXAMPLE: { nodesPerStage: number[]; costs: { [edgeId: string]: number } } = {
  nodesPerStage: [1, 3, 2, 1],
  costs: {
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
  },
}

/** Returns an error message when the stage configuration is not one the visualizer supports. */
export function validateStageConfig(numStages: number, nodesPerStage: number[]): string | null {
  if (!Number.isInteger(numStages) || numStages < MIN_STAGES) return "Please specify at least 2 stages"
  if (numStages > MAX_STAGES) return `Please specify at most ${MAX_STAGES} stages`
  for (let s = 0; s < numStages; s++) {
    const k = nodesPerStage[s] ?? 1
    if (!Number.isInteger(k) || k < 1 || k > MAX_NODES_PER_STAGE)
      return `Stage ${s + 1} must have between 1 and ${MAX_NODES_PER_STAGE} nodes`
  }
  return null
}

/**
 * Nodes and edges of the multistage graph for the given stage sizes (a missing size counts as 1; the last
 * stage always has a single terminal node). `costOf(edgeId)` supplies each edge cost.
 */
export function buildMultistageGraph(
  numStages: number,
  nodesPerStage: number[],
  costOf: (edgeId: string) => number,
): MultistageGraph {
  const error = validateStageConfig(numStages, nodesPerStage)
  if (error) throw new Error(error)
  const size = (s: number) => (s === numStages - 1 ? 1 : nodesPerStage[s] ?? 1)
  const nodes: MultistageNode[] = []
  const edges: MultistageEdge[] = []
  for (let stage = 0; stage < numStages; stage++) {
    for (let i = 0; i < size(stage); i++) {
      const id = multistageNodeId(stage, i)
      nodes.push({ id, label: stage === 0 ? "S" : stage === numStages - 1 ? "T" : `${stage},${i}`, stage })
      if (stage < numStages - 1)
        for (let j = 0; j < size(stage + 1); j++) {
          const target = multistageNodeId(stage + 1, j)
          edges.push({ source: id, target, cost: costOf(multistageEdgeId(id, target)) })
        }
    }
  }
  return { nodes, edges, stages: numStages }
}

export function generateMultistageSteps(graph: MultistageGraph): MultistageStep[] {
  const { nodes, edges, stages } = graph
  for (const e of edges) if (!Number.isFinite(e.cost)) throw new Error("Edge costs must be finite numbers")
  const steps: MultistageStep[] = []
  const costs: { [key: string]: number } = {}
  const next: { [key: string]: string | null } = {} // "prevNodes" in the UI: best successor of each node
  for (const node of nodes) {
    costs[node.id] = node.stage === stages - 1 ? 0 : Number.POSITIVE_INFINITY
    next[node.id] = null
  }
  steps.push({
    phase: "init",
    description: "Initialize costs: terminal node = 0, all others = ∞",
    currentStage: stages - 1,
    costs: { ...costs },
    prevNodes: { ...next },
  })

  for (let stage = stages - 2; stage >= 0; stage--) {
    steps.push({
      phase: "compute",
      description: `Computing optimal costs for Stage ${stage + 1}`,
      currentStage: stage,
      costs: { ...costs },
      prevNodes: { ...next },
    })
    for (const node of nodes.filter((n) => n.stage === stage)) {
      let minCost = Number.POSITIVE_INFINITY
      let best: string | null = null
      for (const edge of edges) {
        if (edge.source !== node.id || !(edge.target in costs)) continue
        const pathCost = edge.cost + costs[edge.target]
        if (pathCost < minCost) {
          minCost = pathCost
          best = edge.target
        }
      }
      costs[node.id] = minCost
      next[node.id] = best
      steps.push({
        phase: "compute",
        description: `Update node ${node.label}: min cost = ${minCost === Number.POSITIVE_INFINITY ? "∞" : minCost}`,
        currentStage: stage,
        currentNode: node.id,
        updatedNodes: [node.id],
        costs: { ...costs },
        prevNodes: { ...next },
      })
    }
  }

  // the cheapest first-stage node (ties: the first one)
  let start: MultistageNode | undefined
  for (const n of nodes) if (n.stage === 0 && (!start || costs[n.id] < costs[start.id])) start = n
  const sources = nodes.filter((n) => n.stage === 0).length

  const optimalPath: string[] = []
  for (let cur: string | null = start && costs[start.id] < Number.POSITIVE_INFINITY ? start.id : null; cur !== null; cur = next[cur])
    optimalPath.push(cur)

  const stageOf = (id: string) => nodes.find((n) => n.id === id)?.stage ?? 0
  const labelOf = (id: string) => nodes.find((n) => n.id === id)?.label ?? id
  optimalPath.forEach((id, i) => {
    steps.push({
      phase: "backtrack",
      description:
        i === 0
          ? sources > 1
            ? `Backtracking to find optimal path: Start at the cheapest of the ${sources} source nodes (cost ${costs[id]})`
            : "Backtracking to find optimal path: Start at source node"
          : `Backtracking: Follow best edge to node ${labelOf(id)}`,
      currentStage: stageOf(id),
      currentNode: id,
      optimalPath: optimalPath.slice(0, i + 1),
      costs: { ...costs },
      prevNodes: { ...next },
    })
  })

  const optimalCost = start ? costs[start.id] : Number.POSITIVE_INFINITY
  steps.push({
    phase: "complete",
    description: `Algorithm complete: Optimal cost from source to terminal = ${optimalCost === Number.POSITIVE_INFINITY ? "∞" : optimalCost}`,
    currentStage: -1,
    optimalPath,
    costs: { ...costs },
    prevNodes: { ...next },
  })
  return steps
}
