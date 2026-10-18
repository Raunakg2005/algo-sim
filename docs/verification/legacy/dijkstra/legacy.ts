// Faithful copy of startAlgorithm() from HEAD:components/dijkstra-simulation.tsx (lines 306-476);
// React setters replaced by plain variables.
type Node = { id: string; label: string; x: number; y: number }
type Edge = { source: string; target: string; weight: number }
type Graph = { nodes: Node[]; edges: Edge[] }
type NodeState = { id: string; distance: number; previous: string | null; visited: boolean; current: boolean; relaxed: boolean }
export type AlgorithmStep = {
  phase: "init" | "select" | "relax" | "finalize" | "complete"
  description: string
  nodeStates: { [key: string]: NodeState }
  currentNode?: string
  relaxedEdges?: { source: string; target: string; newDistance: number; improved: boolean }[]
  finalPath?: string[]
}
export function legacy(graph: Graph, sourceNode: string | null, targetNode: string | null): { steps: AlgorithmStep[]; error: string } {
  let inputError = ""
  let out: AlgorithmStep[] = []
  const setInputError = (s: string) => { inputError = s }
  const setAlgorithmStarted = (_: boolean) => {}
  const setSteps = (s: AlgorithmStep[]) => { out = s }
  const setCurrentStep = (_: number) => {}
  const startAlgorithm = () => {
    if (!sourceNode) {
      setInputError("Please select a source node")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []

    const initialNodeStates: { [key: string]: NodeState } = {}

    graph.nodes.forEach((node) => {
      initialNodeStates[node.id] = {
        id: node.id,
        distance: node.id === sourceNode ? 0 : Number.POSITIVE_INFINITY,
        previous: null,
        visited: false,
        current: node.id === sourceNode,
        relaxed: false,
      }
    })

    algorithmSteps.push({
      phase: "init",
      description: "Initialize distances: source = 0, all others = ∞",
      nodeStates: initialNodeStates,
    })

    const nodeStates = { ...initialNodeStates }
    const unvisited = new Set(graph.nodes.map((node) => node.id))

    while (unvisited.size > 0) {
      let minDistance = Number.POSITIVE_INFINITY
      let minNode: string | null = null

      unvisited.forEach((nodeId) => {
        if (nodeStates[nodeId].distance < minDistance) {
          minDistance = nodeStates[nodeId].distance
          minNode = nodeId
        }
      })

      if (minNode === null || minDistance === Number.POSITIVE_INFINITY) {
        break
      }

      Object.keys(nodeStates).forEach((nodeId) => {
        nodeStates[nodeId] = {
          ...nodeStates[nodeId],
          current: nodeId === minNode,
        }
      })

      algorithmSteps.push({
        phase: "select",
        description: `Select node with minimum distance: ${graph.nodes.find((n) => n.id === minNode)?.label} (distance = ${minDistance === Number.POSITIVE_INFINITY ? "∞" : minDistance})`,
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        currentNode: minNode,
      })

      const neighbors: { nodeId: string; weight: number }[] = []

      graph.edges.forEach((edge) => {
        if (edge.source === minNode && unvisited.has(edge.target)) {
          neighbors.push({ nodeId: edge.target, weight: edge.weight })
        } else if (edge.target === minNode && unvisited.has(edge.source)) {
          neighbors.push({ nodeId: edge.source, weight: edge.weight })
        }
      })

      const relaxedEdges: { source: string; target: string; newDistance: number; improved: boolean }[] = []

      neighbors.forEach(({ nodeId, weight }) => {
        const newDistance = nodeStates[minNode!].distance + weight

        if (newDistance < nodeStates[nodeId].distance) {
          nodeStates[nodeId] = {
            ...nodeStates[nodeId],
            distance: newDistance,
            previous: minNode,
            relaxed: true,
          }
          relaxedEdges.push({
            source: minNode!,
            target: nodeId,
            newDistance,
            improved: true,
          })
        } else {
          relaxedEdges.push({
            source: minNode!,
            target: nodeId,
            newDistance: nodeStates[nodeId].distance,
            improved: false,
          })
        }
      })

      if (relaxedEdges.length > 0) {
        algorithmSteps.push({
          phase: "relax",
          description: "Relax neighbors: update distances if a shorter path is found",
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          currentNode: minNode,
          relaxedEdges,
        })
      }

      unvisited.delete(minNode)
      nodeStates[minNode] = {
        ...nodeStates[minNode],
        visited: true,
        current: false,
      }

      Object.keys(nodeStates).forEach((nodeId) => {
        if (nodeStates[nodeId].relaxed) {
          nodeStates[nodeId] = {
            ...nodeStates[nodeId],
            relaxed: false,
          }
        }
      })

      algorithmSteps.push({
        phase: "finalize",
        description: `Finalize node ${graph.nodes.find((n) => n.id === minNode)?.label}: shortest distance = ${minDistance === Number.POSITIVE_INFINITY ? "∞" : minDistance}`,
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        currentNode: minNode,
      })
    }

    algorithmSteps.push({
      phase: "complete",
      description: "Algorithm complete: all reachable nodes have been processed",
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    })

    if (targetNode) {
      const finalPath: string[] = []
      let current = targetNode

      let __guard = 0 // instrumentation only: detects the infinite loop
      while (current) {
        if (++__guard > 10000) throw new Error("HANG")
        finalPath.unshift(current)
        current = nodeStates[current].previous || ""
        if (!current) break
      }

      if (finalPath.length > 1 && finalPath[0] === sourceNode) {
        const pathDescription = finalPath.map((nodeId) => graph.nodes.find((n) => n.id === nodeId)?.label).join(" → ")

        algorithmSteps.push({
          phase: "complete",
          description: `Shortest path from ${graph.nodes.find((n) => n.id === sourceNode)?.label} to ${graph.nodes.find((n) => n.id === targetNode)?.label}: ${pathDescription} (distance = ${nodeStates[targetNode].distance})`,
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          finalPath,
        })
      } else if (nodeStates[targetNode].distance === Number.POSITIVE_INFINITY) {
        algorithmSteps.push({
          phase: "complete",
          description: `No path exists from ${graph.nodes.find((n) => n.id === sourceNode)?.label} to ${graph.nodes.find((n) => n.id === targetNode)?.label}`,
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        })
      }
    }

    setSteps(algorithmSteps)
    setCurrentStep(0)
  }
  startAlgorithm()
  return { steps: out, error: inputError }
}
