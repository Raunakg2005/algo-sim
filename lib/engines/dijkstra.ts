// Step generator for the Dijkstra visualizer (undirected weighted graph).
// Pure function: given the graph, a source and an optional target, returns every frame the
// visualizer plays. Distances use Number.POSITIVE_INFINITY for "not reached yet"; frames are
// deep-copied with a structured copy (not JSON), so Infinity survives in every frame.

export type DijkstraNode = { id: string; label: string }
export type DijkstraEdge = { source: string; target: string; weight: number }
export type DijkstraGraph = { nodes: DijkstraNode[]; edges: DijkstraEdge[] }

export type NodeState = {
  id: string
  distance: number
  previous: string | null
  visited: boolean
  current: boolean
  relaxed: boolean
}

export type RelaxedEdge = { source: string; target: string; newDistance: number; improved: boolean }

export type DijkstraStep = {
  phase: "init" | "select" | "relax" | "finalize" | "complete"
  description: string
  nodeStates: { [key: string]: NodeState }
  currentNode?: string
  relaxedEdges?: RelaxedEdge[]
  finalPath?: string[]
}

/** Returns an error message if the input cannot be run through Dijkstra's algorithm, otherwise null. */
export function validateDijkstraInput(graph: DijkstraGraph, source: string | null): string | null {
  if (!source) return "Please select a source node"
  const ids = new Set(graph.nodes.map((n) => n.id))
  if (!ids.has(source)) return "The selected source node is not in the graph"
  const label = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id
  for (const e of graph.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) return "An edge refers to a node that is not in the graph"
    if (Number.isNaN(e.weight)) return `Edge ${label(e.source)}-${label(e.target)} has an invalid weight`
    if (e.weight < 0)
      return `Dijkstra's algorithm requires non-negative edge weights (edge ${label(e.source)}-${label(e.target)} has weight ${e.weight}). Use Bellman-Ford for negative weights.`
  }
  return null
}

const copyStates = (s: { [key: string]: NodeState }): { [key: string]: NodeState } => {
  const out: { [key: string]: NodeState } = {}
  for (const k of Object.keys(s)) out[k] = { ...s[k] }
  return out
}

const fmt = (d: number): string => (d === Number.POSITIVE_INFINITY ? "∞" : String(d))

export function generateDijkstraSteps(graph: DijkstraGraph, source: string, target: string | null = null): DijkstraStep[] {
  const error = validateDijkstraInput(graph, source)
  if (error) throw new Error(error)

  const label = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id
  const steps: DijkstraStep[] = []
  const states: { [key: string]: NodeState } = {}
  for (const node of graph.nodes) {
    states[node.id] = {
      id: node.id,
      distance: node.id === source ? 0 : Number.POSITIVE_INFINITY,
      previous: null,
      visited: false,
      current: node.id === source,
      relaxed: false,
    }
  }
  steps.push({ phase: "init", description: "Initialize distances: source = 0, all others = ∞", nodeStates: copyStates(states) })

  const unvisited = new Set(graph.nodes.map((n) => n.id))
  while (unvisited.size > 0) {
    let minDistance = Number.POSITIVE_INFINITY
    let minNode: string | null = null
    for (const id of unvisited) {
      if (states[id].distance < minDistance) {
        minDistance = states[id].distance
        minNode = id
      }
    }
    if (minNode === null) break // every remaining node is unreachable
    const u: string = minNode

    for (const id of Object.keys(states)) states[id] = { ...states[id], current: id === u }
    steps.push({
      phase: "select",
      description: `Select node with minimum distance: ${label(u)} (distance = ${fmt(minDistance)})`,
      nodeStates: copyStates(states),
      currentNode: u,
    })

    const relaxedEdges: RelaxedEdge[] = []
    for (const edge of graph.edges) {
      if (edge.source === edge.target) continue // a self-loop can never shorten a path
      const v = edge.source === u ? edge.target : edge.target === u ? edge.source : null
      if (v === null || !unvisited.has(v)) continue
      const newDistance = states[u].distance + edge.weight
      if (newDistance < states[v].distance) {
        states[v] = { ...states[v], distance: newDistance, previous: u, relaxed: true }
        relaxedEdges.push({ source: u, target: v, newDistance, improved: true })
      } else {
        relaxedEdges.push({ source: u, target: v, newDistance: states[v].distance, improved: false })
      }
    }
    if (relaxedEdges.length > 0) {
      steps.push({
        phase: "relax",
        description: "Relax neighbors: update distances if a shorter path is found",
        nodeStates: copyStates(states),
        currentNode: u,
        relaxedEdges,
      })
    }

    unvisited.delete(u)
    states[u] = { ...states[u], visited: true, current: false }
    for (const id of Object.keys(states)) if (states[id].relaxed) states[id] = { ...states[id], relaxed: false }
    steps.push({
      phase: "finalize",
      description: `Finalize node ${label(u)}: shortest distance = ${fmt(minDistance)}`,
      nodeStates: copyStates(states),
      currentNode: u,
    })
  }

  steps.push({
    phase: "complete",
    description: "Algorithm complete: all reachable nodes have been processed",
    nodeStates: copyStates(states),
  })

  if (target && states[target]) {
    if (states[target].distance === Number.POSITIVE_INFINITY) {
      steps.push({
        phase: "complete",
        description: `No path exists from ${label(source)} to ${label(target)}`,
        nodeStates: copyStates(states),
      })
    } else {
      const finalPath: string[] = []
      for (let cur: string | null = target; cur !== null; cur = states[cur].previous) finalPath.unshift(cur)
      steps.push({
        phase: "complete",
        description: `Shortest path from ${label(source)} to ${label(target)}: ${finalPath.map(label).join(" → ")} (distance = ${states[target].distance})`,
        nodeStates: copyStates(states),
        finalPath,
      })
    }
  }
  return steps
}
