// Legacy harness: graph-coloring. Lines 16-56 (types, colour tables) and 264-411 (startAlgorithm) spliced verbatim from
// `git show HEAD:components/graph-coloring.tsx`; React setters replaced by captures.
type Node = {
  id: string
  label: string
  x: number
  y: number
  color: number | null
}

type Edge = {
  source: string
  target: string
}

type Graph = {
  nodes: Node[]
  edges: Edge[]
}

type AlgorithmStep = {
  phase: "init" | "try" | "conflict" | "assign" | "backtrack" | "complete"
  description: string
  currentNodeId: string | null
  conflictNodeId: string | null
  nodeColors: { [key: string]: number | null }
  previousNodeId?: string | null
}

const COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
]

const COLOR_NAMES = ["Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Indigo", "Orange", "Teal", "Cyan"]
export function legacy(graph: Graph, numColors: number): { steps: AlgorithmStep[]; solutions: { [key: string]: number | null }[]; error: string } {
  let captured: AlgorithmStep[] = []
  let sols: { [key: string]: number | null }[] = []
  let error = ""
  const setInputError = (s: string) => { error = s }
  const setAlgorithmStarted = (_b: boolean) => {}
  const setSteps = (s: AlgorithmStep[]) => { captured = s }
  const setSolutions = (s: { [key: string]: number | null }[]) => { sols = s }
  const setCurrentSolution = (_n: number) => {}
  const setCurrentStep = (_n: number) => {}
  const startAlgorithm = () => {
    if (graph.nodes.length === 0) {
      setInputError("Please generate a graph first")
      return
    }

    if (graph.edges.length === 0) {
      setInputError("Please add at least one edge to the graph")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)

    const algorithmSteps: AlgorithmStep[] = []
    const allSolutions: { [key: string]: number | null }[] = []

    const initialNodeColors: { [key: string]: number | null } = {}
    graph.nodes.forEach((node) => {
      initialNodeColors[node.id] = null
    })

    algorithmSteps.push({
      phase: "init",
      description: "Initialize graph with no colors assigned",
      currentNodeId: null,
      conflictNodeId: null,
      nodeColors: { ...initialNodeColors },
    })

    const isColorValid = (
      nodeId: string,
      color: number,
      nodeColors: { [key: string]: number | null },
    ): [boolean, string | null] => {
      const adjacentNodes = graph.edges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .map((edge) => (edge.source === nodeId ? edge.target : edge.source))

      for (const adjNodeId of adjacentNodes) {
        if (nodeColors[adjNodeId] === color) {
          return [false, adjNodeId]
        }
      }

      return [true, null]
    }

    const solveGraphColoring = (
      nodeIndex: number,
      nodeColors: { [key: string]: number | null },
      steps: AlgorithmStep[],
    ): boolean => {
      if (nodeIndex >= graph.nodes.length) {
        allSolutions.push({ ...nodeColors })

        steps.push({
          phase: "complete",
          description: `Solution found! All nodes colored successfully using ${numColors} colors.`,
          currentNodeId: null,
          conflictNodeId: null,
          nodeColors: { ...nodeColors },
        })

        return true
      }

      const currentNode = graph.nodes[nodeIndex]

      steps.push({
        phase: "try",
        description: `Considering node ${currentNode.label}...`,
        currentNodeId: currentNode.id,
        conflictNodeId: null,
        nodeColors: { ...nodeColors },
      })

      for (let color = 0; color < numColors; color++) {
        steps.push({
          phase: "try",
          description: `Trying ${COLOR_NAMES[color]} for node ${currentNode.label}...`,
          currentNodeId: currentNode.id,
          conflictNodeId: null,
          nodeColors: { ...nodeColors },
        })

        const [valid, conflictNodeId] = isColorValid(currentNode.id, color, nodeColors)

        if (!valid) {
          steps.push({
            phase: "conflict",
            description: `Conflict detected: Node ${
              graph.nodes.find((n) => n.id === conflictNodeId)?.label
            } already has ${COLOR_NAMES[color]}`,
            currentNodeId: currentNode.id,
            conflictNodeId,
            nodeColors: { ...nodeColors },
          })
          continue
        }

        nodeColors[currentNode.id] = color

        steps.push({
          phase: "assign",
          description: `Assigned ${COLOR_NAMES[color]} to node ${currentNode.label}`,
          currentNodeId: currentNode.id,
          conflictNodeId: null,
          nodeColors: { ...nodeColors },
        })

        if (solveGraphColoring(nodeIndex + 1, nodeColors, steps)) {
          return true
        }

        nodeColors[currentNode.id] = null

        steps.push({
          phase: "backtrack",
          description: `Backtracking from node ${currentNode.label}...`,
          currentNodeId: currentNode.id,
          conflictNodeId: null,
          nodeColors: { ...nodeColors },
          previousNodeId: currentNode.id,
        })
      }

      return false
    }

    const nodeColors = { ...initialNodeColors }
    solveGraphColoring(0, nodeColors, algorithmSteps)

    if (allSolutions.length === 0) {
      algorithmSteps.push({
        phase: "complete",
        description: `No solution found with ${numColors} colors. Try increasing the number of colors.`,
        currentNodeId: null,
        conflictNodeId: null,
        nodeColors: { ...initialNodeColors },
      })
    }

    setSteps(algorithmSteps)
    setSolutions(allSolutions)
    setCurrentSolution(0)
    setCurrentStep(0)
  }
  startAlgorithm()
  return { steps: captured, solutions: sols, error }
}
export { COLORS, COLOR_NAMES }
export type { Graph, Node, Edge }
