// Step generators for the Minimum Spanning Tree visualizer (Kruskal and Prim).
// Pure functions: given a graph (and a start node for Prim), return every frame the visualizer plays.
// Moved here unchanged from lib/mst-algorithms.ts (which now re-exports this module); the only
// change is that the final frame no longer claims a spanning tree when the input is disconnected.

import type { Graph, Edge, Node } from "../graph-utils"

export interface AlgorithmStep {
  type: "initial" | "sort" | "start" | "check" | "add" | "skip" | "complete"
  message: string
  mstEdges: Edge[]
  highlightedEdges: Edge[]
  highlightedNodes: Node[]
  totalWeight?: number
}

class UnionFind {
  private parent: { [key: string]: string } = {}
  private rank: { [key: string]: number } = {}

  constructor(nodes: Node[]) {
    for (const node of nodes) {
      this.parent[node.id] = node.id
      this.rank[node.id] = 0
    }
  }

  find(x: string): string {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x])
    return this.parent[x]
  }

  union(x: string, y: string): void {
    const rootX = this.find(x)
    const rootY = this.find(y)
    if (rootX === rootY) return
    if (this.rank[rootX] < this.rank[rootY]) this.parent[rootX] = rootY
    else if (this.rank[rootX] > this.rank[rootY]) this.parent[rootY] = rootX
    else {
      this.parent[rootY] = rootX
      this.rank[rootX]++
    }
  }

  connected(x: string, y: string): boolean {
    return this.find(x) === this.find(y)
  }
}

const completeMessage = (graph: Graph, mstEdges: Edge[]): string =>
  mstEdges.length === Math.max(0, graph.nodes.length - 1)
    ? "Minimum Spanning Tree is complete."
    : "The graph is disconnected, so no spanning tree exists; the selected edges form a minimum spanning forest."

export function runKruskalsAlgorithm(graph: Graph): AlgorithmStep[] {
  const steps: AlgorithmStep[] = []
  const mstEdges: Edge[] = []
  let totalWeight = 0

  steps.push({
    type: "initial",
    message:
      "Initial graph with weighted edges. Kruskal's algorithm will sort all edges by weight and add them to the MST if they don't create a cycle.",
    mstEdges: [],
    highlightedEdges: [],
    highlightedNodes: [],
  })

  // Array.prototype.sort is stable, so equal weights keep their input order
  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight)
  steps.push({
    type: "sort",
    message: "Edges sorted by weight in ascending order.",
    mstEdges: [],
    highlightedEdges: sortedEdges,
    highlightedNodes: [],
  })

  const unionFind = new UnionFind(graph.nodes)
  for (const edge of sortedEdges) {
    if (mstEdges.length === graph.nodes.length - 1) break
    const label = `${edge.source.label}-${edge.target.label}`
    steps.push({
      type: "check",
      message: `Checking edge ${label} with weight ${edge.weight}.`,
      mstEdges: [...mstEdges],
      highlightedEdges: [edge],
      highlightedNodes: [edge.source, edge.target],
    })

    if (!unionFind.connected(edge.source.id, edge.target.id)) {
      mstEdges.push(edge)
      totalWeight += edge.weight
      unionFind.union(edge.source.id, edge.target.id)
      steps.push({
        type: "add",
        message: `Adding edge ${label} with weight ${edge.weight} to the MST.`,
        mstEdges: [...mstEdges],
        highlightedEdges: [edge],
        highlightedNodes: [edge.source, edge.target],
        totalWeight,
      })
    } else {
      steps.push({
        type: "skip",
        message: `Skipping edge ${label} with weight ${edge.weight} because it would create a cycle.`,
        mstEdges: [...mstEdges],
        highlightedEdges: [edge],
        highlightedNodes: [edge.source, edge.target],
        totalWeight,
      })
    }
  }

  steps.push({
    type: "complete",
    message: completeMessage(graph, mstEdges),
    mstEdges: [...mstEdges],
    highlightedEdges: [],
    highlightedNodes: [],
    totalWeight,
  })
  return steps
}

export function runPrimsAlgorithm(graph: Graph, startNode: Node): AlgorithmStep[] {
  const steps: AlgorithmStep[] = []
  const mstEdges: Edge[] = []
  let totalWeight = 0

  steps.push({
    type: "initial",
    message:
      "Initial graph with weighted edges. Prim's algorithm will start from a node and grow the MST by adding the minimum weight edge that connects to a new node.",
    mstEdges: [],
    highlightedEdges: [],
    highlightedNodes: [],
  })
  steps.push({
    type: "start",
    message: `Starting from node ${startNode.label}.`,
    mstEdges: [],
    highlightedEdges: [],
    highlightedNodes: [startNode],
  })

  const mstNodes = new Set<string>([startNode.id])
  while (mstNodes.size < graph.nodes.length) {
    let minEdge: Edge | null = null
    let minWeight = Number.POSITIVE_INFINITY

    for (const edge of graph.edges) {
      const sourceIn = mstNodes.has(edge.source.id)
      const targetIn = mstNodes.has(edge.target.id)
      if (sourceIn === targetIn) continue // not a crossing edge
      steps.push({
        type: "check",
        message: `Checking edge ${edge.source.label}-${edge.target.label} with weight ${edge.weight}.`,
        mstEdges: [...mstEdges],
        highlightedEdges: [edge],
        highlightedNodes: [edge.source, edge.target],
      })
      if (edge.weight < minWeight) {
        minWeight = edge.weight
        minEdge = edge
      }
    }

    if (!minEdge) break // remaining nodes are unreachable from the start node
    mstEdges.push(minEdge)
    totalWeight += minEdge.weight
    const newNode = mstNodes.has(minEdge.source.id) ? minEdge.target : minEdge.source
    mstNodes.add(newNode.id)
    steps.push({
      type: "add",
      message: `Adding edge ${minEdge.source.label}-${minEdge.target.label} with weight ${minEdge.weight} to the MST.`,
      mstEdges: [...mstEdges],
      highlightedEdges: [minEdge],
      highlightedNodes: [newNode],
      totalWeight,
    })
  }

  steps.push({
    type: "complete",
    message:
      mstNodes.size === graph.nodes.length
        ? "Minimum Spanning Tree is complete."
        : `The graph is disconnected: only the component containing ${startNode.label} can be spanned.`,
    mstEdges: [...mstEdges],
    highlightedEdges: [],
    highlightedNodes: [],
    totalWeight,
  })
  return steps
}
