// Step generator for the TSP visualizer: Held-Karp dynamic programming over bitmasks.
// dp[mask, end] = cheapest path that starts at startCity, visits exactly the cities in mask and ends at end.
// Pure function: given the distance matrix (and optionally the city names shown in the UI), returns every
// frame the visualizer plays. Moved from lib/tsp-solver.ts (which re-exports it) with three fixes:
//  - an out-of-range start city (left over after deleting cities) threw a TypeError; it is now rejected
//    with a clear RangeError (and the component clamps it);
//  - backtracking frames drew the edge startCity -> (last city found), which is usually not a tour edge;
//    they now draw only the part of the optimal tour recovered so far (..., last city, startCity);
//  - captions named cities by 0-based index ("city 0") while the graph shows letters / user names.

export interface TSPStep {
  type: "initial" | "dp_update" | "backtrack" | "final"
  message: string
  dpTable?: Record<string, number>
  dpParent?: Record<string, number>
  mask?: number
  currentCity?: number
  nextCity?: number
  cityCount?: number
  startCity?: number
  tour?: number[]
  partialTour?: number[]
  tourCost?: number
}

export const TSP_MAX_CITIES = 16 // the bitmask DP is exponential; the UI allows at most 8

const defaultName = (i: number) => String.fromCharCode(65 + i)

export function solveTSP(distances: number[][], startCity = 0, cityNames?: string[]): TSPStep[] {
  const n = distances.length
  if (n <= 1) return []
  if (n > TSP_MAX_CITIES) throw new RangeError(`At most ${TSP_MAX_CITIES} cities are supported`)
  if (!Number.isInteger(startCity) || startCity < 0 || startCity >= n) throw new RangeError(`Start city ${startCity} is not one of the ${n} cities`)
  for (const row of distances) {
    if (row.length !== n) throw new Error("The distance matrix must be square")
    for (const d of row) if (!Number.isFinite(d) || d < 0) throw new Error("Distances must be finite and non-negative")
  }
  const name = (i: number) => cityNames?.[i] ?? defaultName(i)

  const steps: TSPStep[] = []
  const dpTable: Record<string, number> = {}
  const dpParent: Record<string, number> = {}
  // Frames get a snapshot of the tables. The tables only change on writes, so consecutive frames share one
  // (read-only) snapshot instead of copying ~450 entries per frame for 8 cities.
  let snap: { dpTable: Record<string, number>; dpParent: Record<string, number> } | null = null
  const snapshot = () => (snap ??= { dpTable: { ...dpTable }, dpParent: { ...dpParent } })
  const write = (key: string, cost: number, parent: number) => {
    dpTable[key] = cost
    dpParent[key] = parent
    snap = null
  }

  steps.push({
    type: "initial",
    message: `Starting TSP solution with ${n} cities. We'll use dynamic programming with bitmasking to find the optimal tour.`,
    dpTable: {},
    dpParent: {},
    startCity,
  })

  for (let i = 0; i < n; i++) {
    if (i === startCity) continue
    const mask = (1 << startCity) | (1 << i)
    const key = `${mask},${i}`
    write(key, distances[startCity][i], startCity)
    steps.push({
      type: "dp_update",
      message: `Base case: Setting cost to go from city ${name(startCity)} to city ${name(i)} as ${distances[startCity][i]}.`,
      ...snapshot(),
      mask,
      currentCity: i,
      nextCity: undefined,
      cityCount: n,
      startCity,
    })
  }

  for (let size = 3; size <= n; size++) {
    for (const mask of generateSubsets(n, size, startCity)) {
      for (let end = 0; end < n; end++) {
        if (end === startCity || !(mask & (1 << end))) continue
        const prevMask = mask & ~(1 << end)
        let minCost = Number.POSITIVE_INFINITY
        let minPrev = -1
        for (let prev = 0; prev < n; prev++) {
          if (prev === end || !(prevMask & (1 << prev))) continue
          const prevKey = `${prevMask},${prev}`
          if (dpTable[prevKey] === undefined) continue // prev = startCity: only the base case may end there
          const cost = dpTable[prevKey] + distances[prev][end]
          steps.push({
            type: "dp_update",
            message: `Considering path from city ${name(prev)} to city ${name(end)} with cost ${distances[prev][end]}. Total cost: ${cost}.`,
            ...snapshot(),
            mask: prevMask,
            currentCity: prev,
            nextCity: end,
            cityCount: n,
            startCity,
          })
          if (cost < minCost) {
            minCost = cost
            minPrev = prev
          }
        }
        if (minPrev !== -1) {
          const key = `${mask},${end}`
          write(key, minCost, minPrev)
          steps.push({
            type: "dp_update",
            message: `Updated DP table: Minimum cost to visit subset ${maskToString(mask, n, name)} and end at city ${name(end)} is ${minCost}.`,
            ...snapshot(),
            mask,
            currentCity: end,
            nextCity: undefined,
            cityCount: n,
            startCity,
          })
        }
      }
    }
  }

  const fullMask = (1 << n) - 1
  let minTourCost = Number.POSITIVE_INFINITY
  let lastCity = -1
  for (let end = 0; end < n; end++) {
    if (end === startCity) continue
    const key = `${fullMask},${end}`
    if (dpTable[key] === undefined) continue
    const cost = dpTable[key] + distances[end][startCity]
    steps.push({
      type: "dp_update",
      message: `Considering return from city ${name(end)} to starting city ${name(startCity)} with cost ${distances[end][startCity]}. Total tour cost: ${cost}.`,
      ...snapshot(),
      mask: fullMask,
      currentCity: end,
      nextCity: startCity,
      cityCount: n,
      startCity,
    })
    if (cost < minTourCost) {
      minTourCost = cost
      lastCity = end
    }
  }

  // Backtracking recovers the tour from its end; each frame shows the recovered suffix followed by the
  // closing edge back to the start city, i.e. only edges that belong to the optimal tour.
  const suffix: number[] = []
  let currentMask = fullMask
  let currentCity = lastCity
  while (currentCity !== startCity) {
    suffix.unshift(currentCity)
    const shown = [...suffix, startCity]
    steps.push({
      type: "backtrack",
      message: `Backtracking: Adding city ${name(currentCity)} to the tour.`,
      dpTable,
      dpParent,
      mask: currentMask,
      currentCity,
      cityCount: n,
      startCity,
      tour: shown,
      partialTour: shown,
    })
    const prevCity = dpParent[`${currentMask},${currentCity}`]
    currentMask = currentMask & ~(1 << currentCity)
    currentCity = prevCity
  }

  const tour = [startCity, ...suffix]
  steps.push({
    type: "final",
    message: `Optimal tour found: ${tour.map(name).join(" → ")} → ${name(startCity)} with total cost ${minTourCost}.`,
    dpTable,
    dpParent,
    mask: fullMask,
    currentCity: startCity,
    cityCount: n,
    startCity,
    tour,
    tourCost: minTourCost,
  })
  return steps
}

function generateSubsets(n: number, size: number, startCity: number): number[] {
  const subsets: number[] = []
  const generate = (current: number, pos: number, count: number) => {
    if (count === size) {
      if (current & (1 << startCity)) subsets.push(current)
      return
    }
    if (pos === n) return
    generate(current | (1 << pos), pos + 1, count + 1)
    generate(current, pos + 1, count)
  }
  generate(0, 0, 0)
  return subsets
}

function maskToString(mask: number, n: number, name: (i: number) => string): string {
  const cities: string[] = []
  for (let i = 0; i < n; i++) if (mask & (1 << i)) cities.push(name(i))
  return `{${cities.join(", ")}}`
}
