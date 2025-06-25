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
  
  export function solveTSP(distances: number[][], startCity = 0): TSPStep[] {
    const n = distances.length
    if (n <= 1) return []
  
    const steps: TSPStep[] = []
    const dpTable: Record<string, number> = {}
    const dpParent: Record<string, number> = {}
  
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
      dpTable[key] = distances[startCity][i]
      dpParent[key] = startCity
  
      steps.push({
        type: "dp_update",
        message: `Base case: Setting cost to go from city ${startCity} to city ${i} as ${distances[startCity][i]}.`,
        dpTable: { ...dpTable },
        dpParent: { ...dpParent },
        mask,
        currentCity: i,
        nextCity: undefined,
        cityCount: n,
        startCity,
      })
    }
  
    for (let size = 3; size <= n; size++) {
      const subsets = generateSubsets(n, size, startCity)
  
      for (const mask of subsets) {
        for (let end = 0; end < n; end++) {
          if (end === startCity || !(mask & (1 << end))) continue
  
          const prevMask = mask & ~(1 << end)
          let minCost = Number.POSITIVE_INFINITY
          let minPrev = -1
  
          for (let prev = 0; prev < n; prev++) {
            if (prev === end || !(prevMask & (1 << prev))) continue
  
            const prevKey = `${prevMask},${prev}`
            if (dpTable[prevKey] === undefined) continue
  
            const cost = dpTable[prevKey] + distances[prev][end]
  
            steps.push({
              type: "dp_update",
              message: `Considering path from city ${prev} to city ${end} with cost ${distances[prev][end]}. Total cost: ${cost}.`,
              dpTable: { ...dpTable },
              dpParent: { ...dpParent },
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
            dpTable[key] = minCost
            dpParent[key] = minPrev
  
            steps.push({
              type: "dp_update",
              message: `Updated DP table: Minimum cost to visit subset ${maskToString(mask, n)} and end at city ${end} is ${minCost}.`,
              dpTable: { ...dpTable },
              dpParent: { ...dpParent },
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
        message: `Considering return from city ${end} to starting city ${startCity} with cost ${distances[end][startCity]}. Total tour cost: ${cost}.`,
        dpTable: { ...dpTable },
        dpParent: { ...dpParent },
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
  
    const tour: number[] = []
    let currentMask = fullMask
    let currentCity = lastCity
  
    while (currentCity !== startCity) {
      tour.unshift(currentCity)
  
      steps.push({
        type: "backtrack",
        message: `Backtracking: Adding city ${currentCity} to the tour.`,
        dpTable,
        dpParent,
        mask: currentMask,
        currentCity,
        cityCount: n,
        startCity,
        tour: [startCity, ...tour],
        partialTour: [startCity, ...tour],
      })
  
      const key = `${currentMask},${currentCity}`
      const prevCity = dpParent[key]
      currentMask = currentMask & ~(1 << currentCity)
      currentCity = prevCity
    }
  
    tour.unshift(startCity)
  
    steps.push({
      type: "final",
      message: `Optimal tour found: ${tour.map((i) => String.fromCharCode(65 + i)).join(" → ")} → ${String.fromCharCode(65 + startCity)} with total cost ${minTourCost}.`,
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
    const mask = (1 << n) - 1
  
    const generate = (current: number, pos: number, count: number) => {
      if (count === size) {
        if (current & (1 << startCity)) {
          subsets.push(current)
        }
        return
      }
  
      if (pos === n) return
  
      generate(current | (1 << pos), pos + 1, count + 1)
  
      generate(current, pos + 1, count)
    }
  
    generate(0, 0, 0)
    return subsets
  }
  
  function maskToString(mask: number, n: number): string {
    const cities: string[] = []
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        cities.push(String.fromCharCode(65 + i))
      }
    }
    return `{${cities.join(", ")}}`
  }
