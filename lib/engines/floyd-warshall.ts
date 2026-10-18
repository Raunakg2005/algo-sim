// Step generator for the Floyd-Warshall visualizer (directed graph, all-pairs shortest paths).
// Pure function: given the weight matrix (diagonal 0, INFINITY for "no edge"), returns every frame the
// visualizer plays: one "compare" frame per (k, i, j) and an "update" frame after each improvement.
// Path reconstruction walks "tight" edges (w(u,v) + d(v,t) = d(u,t)), so every shown path is a real
// path in the graph whose weight is the reported distance.

export const INFINITY = Number.POSITIVE_INFINITY

export type FloydWarshallStep = {
  phase: "init" | "compare" | "update" | "complete"
  description: string
  k: number
  i: number | null
  j: number | null
  distanceMatrix: number[][]
  previousMatrix?: number[][]
  newDistance?: number
}

const label = (i: number) => String.fromCharCode(65 + i)
const fmt = (d: number) => (d === INFINITY ? "∞" : String(d))
const copy = (m: number[][]) => m.map((row) => row.slice())

/** True for every string a matrix cell may hold: "", "∞" or a non-negative integer. */
export const isMatrixEntryInput = (value: string): boolean => value === "" || value === "∞" || /^[0-9]+$/.test(value)

/** Converts the input form ("" or "∞" = no edge) into a numeric matrix with a zero diagonal. */
export function parseDistanceMatrix(input: string[][], n: number): { matrix: number[][] } | { error: string } {
  const matrix: number[][] = []
  for (let i = 0; i < n; i++) {
    matrix[i] = []
    for (let j = 0; j < n; j++) {
      const cell = input[i]?.[j] ?? ""
      if (i === j) matrix[i][j] = 0
      else if (cell === "" || cell === "∞") matrix[i][j] = INFINITY
      else if (/^[0-9]+$/.test(cell)) matrix[i][j] = Number.parseInt(cell, 10)
      else return { error: `Invalid value at position (${i + 1}, ${j + 1}). Please enter a number or ∞.` }
    }
  }
  return { matrix }
}

export function generateFloydWarshallSteps(matrix: number[][]): FloydWarshallStep[] {
  const n = matrix.length
  for (const row of matrix) if (row.length !== n) throw new Error("The distance matrix must be square")
  const dist = copy(matrix)
  const steps: FloydWarshallStep[] = [
    { phase: "init", description: "Initialize distance matrix with direct edge weights", k: -1, i: null, j: null, distanceMatrix: copy(dist) },
  ]

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const via = `Comparing paths from ${label(i)} to ${label(j)} via ${label(k)}. Current: ${fmt(dist[i][j])}`
        if (dist[i][k] === INFINITY || dist[k][j] === INFINITY) {
          const snap = copy(dist)
          steps.push({ phase: "compare", description: `${via}, New: ∞ (not possible)`, k, i, j, distanceMatrix: snap, previousMatrix: snap })
          continue
        }
        const newDist = dist[i][k] + dist[k][j]
        const snap = copy(dist)
        steps.push({ phase: "compare", description: `${via}, New: ${newDist}`, k, i, j, distanceMatrix: snap, previousMatrix: snap, newDistance: newDist })
        if (newDist < dist[i][j]) {
          const previousMatrix = copy(dist)
          const oldDist = dist[i][j]
          dist[i][j] = newDist
          steps.push({
            phase: "update",
            description: `Update: Path from ${label(i)} to ${label(j)} via ${label(k)} is shorter (${fmt(oldDist)} → ${newDist})`,
            k,
            i,
            j,
            distanceMatrix: copy(dist),
            previousMatrix,
            newDistance: newDist,
          })
        }
      }
    }
  }

  steps.push({
    phase: "complete",
    description: "Algorithm complete. Final distance matrix shows shortest path between all pairs of nodes.",
    k: n,
    i: null,
    j: null,
    distanceMatrix: copy(dist),
  })
  return steps
}

/**
 * Shortest path s → t (node indices) in the graph with edge weights `weights`, given the final distance
 * matrix `dist`. Returns [] when t is unreachable and [s] when s = t. Breadth-first search over tight
 * edges, so the result is a simple path with the fewest edges among the shortest paths.
 */
export function reconstructFloydWarshallPath(weights: number[][], dist: number[][], s: number, t: number): number[] {
  const n = dist.length
  if (s < 0 || t < 0 || s >= n || t >= n || dist[s][t] === INFINITY) return []
  if (s === t) return [s]
  const parent = new Array<number>(n).fill(-1)
  const seen = new Array<boolean>(n).fill(false)
  seen[s] = true
  const queue = [s]
  while (queue.length) {
    const u = queue.shift()!
    for (let v = 0; v < n; v++) {
      if (seen[v] || v === u || weights[u][v] === INFINITY || dist[v][t] === INFINITY) continue
      if (weights[u][v] + dist[v][t] !== dist[u][t]) continue
      seen[v] = true
      parent[v] = u
      if (v === t) {
        const path = [t]
        while (path[0] !== s) path.unshift(parent[path[0]])
        return path
      }
      queue.push(v)
    }
  }
  return [] // only reachable with a negative cycle (not enterable in the UI)
}
