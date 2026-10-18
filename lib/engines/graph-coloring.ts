// Step generator for the Graph Colouring (m-colouring backtracking) visualizer.
// Pure function: given the vertices (in the order they are coloured), the edges and the number of colours m,
// returns every frame the visualizer plays. Vertices are coloured one by one; colours are tried in order
// 0..m-1; the search stops at the first proper colouring, or reports that none exists.
// The backtracking tree can be enormous for dense graphs (K10 with 9 colours needs about 11 million frames), so the
// search is cut off once it has produced `maxSteps` frames (checked before each colour attempt, so it may overshoot
// by a few frames). The last frame then says that the search was stopped; it never claims that no colouring exists
// unless the search actually finished.

export const DEFAULT_MAX_COLORING_STEPS = 50000

export const COLOR_NAMES = ["Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Indigo", "Orange", "Teal", "Cyan"]

export type ColoringNode = { id: string; label: string }
export type ColoringEdge = { source: string; target: string }
export type NodeColors = { [key: string]: number | null }

export type ColoringStep = {
  phase: "init" | "try" | "conflict" | "assign" | "backtrack" | "complete"
  description: string
  currentNodeId: string | null
  conflictNodeId: string | null
  nodeColors: NodeColors
  previousNodeId?: string | null
}

export type GraphColoringResult = { steps: ColoringStep[]; solutions: NodeColors[]; limitReached: boolean }

export function generateGraphColoringSteps(
  nodes: ColoringNode[],
  edges: ColoringEdge[],
  numColors: number,
  maxSteps: number = DEFAULT_MAX_COLORING_STEPS,
): GraphColoringResult {
  if (!Number.isInteger(numColors) || numColors < 0 || numColors > COLOR_NAMES.length) {
    throw new RangeError(`numColors must be an integer between 0 and ${COLOR_NAMES.length}`)
  }

  const steps: ColoringStep[] = []
  const solutions: NodeColors[] = []
  let limitReached = false
  const label = (id: string | null) => nodes.find((n) => n.id === id)?.label ?? String(id)

  const neighbours = new Map<string, string[]>(nodes.map((n) => [n.id, []]))
  for (const e of edges) {
    neighbours.get(e.source)?.push(e.target)
    neighbours.get(e.target)?.push(e.source)
  }

  const colors: NodeColors = {}
  for (const n of nodes) colors[n.id] = null

  steps.push({
    phase: "init",
    description: "Initialize graph with no colors assigned",
    currentNodeId: null,
    conflictNodeId: null,
    nodeColors: { ...colors },
  })

  // first already-coloured neighbour of `id` that has colour `color`, or null if the colour is allowed
  const clash = (id: string, color: number): string | null => {
    for (const nb of neighbours.get(id) ?? []) if (colors[nb] === color) return nb
    return null
  }

  const solve = (index: number): boolean => {
    if (index >= nodes.length) {
      solutions.push({ ...colors })
      const used = new Set(Object.values(colors)).size
      steps.push({
        phase: "complete",
        description: `Solution found! All nodes colored successfully using ${used} of the ${numColors} available color${numColors === 1 ? "" : "s"}.`,
        currentNodeId: null,
        conflictNodeId: null,
        nodeColors: { ...colors },
      })
      return true
    }

    if (steps.length >= maxSteps) {
      limitReached = true
      return false
    }

    const node = nodes[index]
    steps.push({
      phase: "try",
      description: `Considering node ${node.label}...`,
      currentNodeId: node.id,
      conflictNodeId: null,
      nodeColors: { ...colors },
    })

    for (let color = 0; color < numColors; color++) {
      if (steps.length >= maxSteps) {
        limitReached = true
        return false
      }
      steps.push({
        phase: "try",
        description: `Trying ${COLOR_NAMES[color]} for node ${node.label}...`,
        currentNodeId: node.id,
        conflictNodeId: null,
        nodeColors: { ...colors },
      })

      const conflictNodeId = clash(node.id, color)
      if (conflictNodeId !== null) {
        steps.push({
          phase: "conflict",
          description: `Conflict detected: Node ${label(conflictNodeId)} already has ${COLOR_NAMES[color]}`,
          currentNodeId: node.id,
          conflictNodeId,
          nodeColors: { ...colors },
        })
        continue
      }

      colors[node.id] = color
      steps.push({
        phase: "assign",
        description: `Assigned ${COLOR_NAMES[color]} to node ${node.label}`,
        currentNodeId: node.id,
        conflictNodeId: null,
        nodeColors: { ...colors },
      })

      if (solve(index + 1)) return true
      if (limitReached) return false

      colors[node.id] = null
      steps.push({
        phase: "backtrack",
        description: `Backtracking from node ${node.label}...`,
        currentNodeId: node.id,
        conflictNodeId: null,
        nodeColors: { ...colors },
        previousNodeId: node.id,
      })
    }
    return false
  }

  solve(0)

  if (limitReached) {
    steps.push({
      phase: "complete",
      description: `Search stopped after ${steps.length} steps without finding a coloring: the backtracking tree is too large to animate. Try fewer edges or more colors.`,
      currentNodeId: null,
      conflictNodeId: null,
      nodeColors: { ...colors },
    })
  } else if (solutions.length === 0) {
    const initial: NodeColors = {}
    for (const n of nodes) initial[n.id] = null
    steps.push({
      phase: "complete",
      description: `No solution found with ${numColors} colors. Try increasing the number of colors.`,
      currentNodeId: null,
      conflictNodeId: null,
      nodeColors: initial,
    })
  }

  return { steps, solutions, limitReached }
}
