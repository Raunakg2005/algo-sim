// Step generator for the Bellman-Ford visualizer (directed graph, negative weights allowed).
// Pure function: given node labels, directed edges and a source label, returns every frame the visualizer
// plays. Iterations 1..|V|-1 relax every edge; iteration |V| is the detection pass: if any edge can still
// be relaxed there, a negative cycle is reachable from the source and the run stops with that frame.
//
// "Unreachable" is Number.POSITIVE_INFINITY (the old Number.MAX_SAFE_INTEGER sentinel collided with real
// sums and produced captions such as "9007199254740996" for edges leaving an unreachable node).

export const INFINITY = Number.POSITIVE_INFINITY

export type BellmanFordEdge = { source: string; target: string; weight: number }

export type BellmanFordStep = {
  phase: "init" | "relax" | "update" | "negative-cycle" | "complete"
  description: string
  iteration: number
  edge?: BellmanFordEdge
  distances: Record<string, number>
  previousDistances?: Record<string, number>
  predecessors: Record<string, string | null>
  relaxed?: boolean
}

const fmt = (d: number) => (d === INFINITY ? "∞" : String(d))

/** True for every string the matrix cell may hold while typing: "", "∞", "-" and (negative) integers. */
export const isMatrixEntryInput = (value: string): boolean => value === "∞" || /^-?[0-9]*$/.test(value)

/**
 * Converts the string matrix of the input form into directed edges between labels A, B, C, ...
 * "" and "∞" mean no edge; the diagonal is ignored. Returns an error message for anything else.
 */
export function parseWeightMatrix(input: string[][], n: number): { edges: BellmanFordEdge[] } | { error: string } {
  const edges: BellmanFordEdge[] = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cell = input[i]?.[j] ?? ""
      if (cell === "∞" || cell === "") continue
      if (!/^-?[0-9]+$/.test(cell)) return { error: `Invalid value at position (${i + 1}, ${j + 1}). Please enter a number or ∞.` }
      if (i !== j) edges.push({ source: String.fromCharCode(65 + i), target: String.fromCharCode(65 + j), weight: Number.parseInt(cell, 10) })
    }
  }
  return { edges }
}

export function generateBellmanFordSteps(labels: string[], edges: BellmanFordEdge[], source: string): BellmanFordStep[] {
  if (!labels.includes(source)) throw new Error(`Source node ${source} is not in the graph`)
  for (const e of edges) {
    if (!labels.includes(e.source) || !labels.includes(e.target)) throw new Error("An edge refers to a node that is not in the graph")
    if (!Number.isFinite(e.weight)) throw new Error("Edge weights must be finite numbers")
  }

  const steps: BellmanFordStep[] = []
  const n = labels.length
  const distances: Record<string, number> = {}
  const predecessors: Record<string, string | null> = {}
  for (const l of labels) {
    distances[l] = l === source ? 0 : INFINITY
    predecessors[l] = null
  }
  steps.push({
    phase: "init",
    description: `Initialize distances: Set distance to source node ${source} as 0, all others as ∞`,
    iteration: 0,
    distances: { ...distances },
    predecessors: { ...predecessors },
  })

  for (let i = 1; i <= n; i++) {
    for (const edge of edges) {
      const { source: u, target: v, weight } = edge
      if (distances[u] === INFINITY) {
        steps.push({
          phase: "relax",
          description: `Edge ${u} → ${v} (weight: ${weight}): Source node ${u} is unreachable, skipping`,
          iteration: i,
          edge: { ...edge },
          distances: { ...distances },
          predecessors: { ...predecessors },
          relaxed: false,
        })
        continue
      }

      const newDistance = distances[u] + weight
      steps.push({
        phase: "relax",
        description: `Edge ${u} → ${v} (weight: ${weight}): Current distance to ${v} is ${fmt(distances[v])}, new potential distance is ${newDistance}`,
        iteration: i,
        edge: { ...edge },
        distances: { ...distances },
        previousDistances: { ...distances },
        predecessors: { ...predecessors },
        relaxed: false,
      })

      if (newDistance < distances[v]) {
        if (i === n) {
          steps.push({
            phase: "negative-cycle",
            description: `Negative cycle detected! Edge ${u} → ${v} can still be relaxed in iteration ${i}`,
            iteration: i,
            edge: { ...edge },
            distances: { ...distances },
            previousDistances: { ...distances },
            predecessors: { ...predecessors },
          })
          return steps
        }
        const oldDistance = distances[v]
        distances[v] = newDistance
        predecessors[v] = u
        steps.push({
          phase: "update",
          description: `Update: Distance to ${v} improved from ${fmt(oldDistance)} to ${newDistance} via ${u}`,
          iteration: i,
          edge: { ...edge },
          distances: { ...distances },
          previousDistances: { ...distances, [v]: oldDistance },
          predecessors: { ...predecessors },
          relaxed: true,
        })
      }
    }
  }

  steps.push({
    phase: "complete",
    description: `Algorithm complete. Final distances from source node ${source} to all other nodes calculated.`,
    iteration: n,
    distances: { ...distances },
    predecessors: { ...predecessors },
  })
  return steps
}

/**
 * Shortest path source → target read from the predecessors of a "complete" frame
 * ([] when the target is unreachable). Without a reachable negative cycle the predecessor
 * graph is a tree, so the walk terminates; it is still bounded by the node count.
 */
export function reconstructBellmanFordPath(step: BellmanFordStep, target: string): string[] {
  if (step.phase !== "complete" || !(target in step.distances) || step.distances[target] === INFINITY) return []
  const path = [target]
  let cur = target
  const limit = Object.keys(step.distances).length
  while (step.predecessors[cur] !== null && path.length <= limit) {
    cur = step.predecessors[cur]!
    path.unshift(cur)
  }
  return path
}
