import type { Graph, Edge, Node } from "./graph-utils"

export interface AlgorithmStep {
  type: "initial" | "sort" | "start" | "check" | "add" | "skip" | "complete"
  message: string
  mstEdges: Edge[]
  highlightedEdges: Edge[]
  highlightedNodes: Node[]
  totalWeight?: number
}

class UnionFind {
  private parent: { [key: string]: string }
  private rank: { [key: string]: number }

  constructor(nodes: Node[]) {
    this.parent = {}
    this.rank = {}

    nodes.forEach((node) => {
      this.parent[node.id] = node.id
      this.rank[node.id] = 0
    })
  }

  find(x: string): string {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]) 
    }
    return this.parent[x]
  }

  union(x: string, y: string): void {
    const rootX = this.find(x)
    const rootY = this.find(y)

    if (rootX === rootY) return

    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX
    } else {
      this.parent[rootY] = rootX
      this.rank[rootX]++
    }
  }

  connected(x: string, y: string): boolean {
    return this.find(x) === this.find(y)
  }
}

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
    const sourceId = edge.source.id
    const targetId = edge.target.id

    steps.push({
      type: "check",
      message: `Checking edge ${edge.source.label}-${edge.target.label} with weight ${edge.weight}.`,
      mstEdges: [...mstEdges],
      highlightedEdges: [edge],
      highlightedNodes: [edge.source, edge.target],
    })

    if (!unionFind.connected(sourceId, targetId)) {
      mstEdges.push(edge)
      totalWeight += edge.weight
      unionFind.union(sourceId, targetId)

      steps.push({
        type: "add",
        message: `Adding edge ${edge.source.label}-${edge.target.label} with weight ${edge.weight} to the MST.`,
        mstEdges: [...mstEdges],
        highlightedEdges: [edge],
        highlightedNodes: [edge.source, edge.target],
        totalWeight,
      })
    } else {
      steps.push({
        type: "skip",
        message: `Skipping edge ${edge.source.label}-${edge.target.label} with weight ${edge.weight} because it would create a cycle.`,
        mstEdges: [...mstEdges],
        highlightedEdges: [edge],
        highlightedNodes: [edge.source, edge.target],
        totalWeight,
      })
    }

    if (mstEdges.length === graph.nodes.length - 1) {
      break
    }
  }

  steps.push({
    type: "complete",
    message: "Minimum Spanning Tree is complete.",
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
      const sourceInMST = mstNodes.has(edge.source.id)
      const targetInMST = mstNodes.has(edge.target.id)

      if ((sourceInMST && !targetInMST) || (!sourceInMST && targetInMST)) {
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
    }

    if (minEdge) {
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
    } else {
      break
    }
  }

  steps.push({
    type: "complete",
    message: "Minimum Spanning Tree is complete.",
    mstEdges: [...mstEdges],
    highlightedEdges: [],
    highlightedNodes: [],
    totalWeight,
  })

  return steps
}
