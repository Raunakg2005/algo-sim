// Independent oracle for job sequencing with deadlines (unit-time jobs, one machine).

export type RJob = { id: string; profit: number; deadline: number }

/** A set of unit jobs can all meet their deadlines iff, for every t, at most t of them have deadline <= t. */
export function feasibleSet(jobs: RJob[]): boolean {
  const d = jobs.map((j) => j.deadline).sort((a, b) => a - b)
  return d.every((dl, i) => i + 1 <= dl)
}

/** Maximum total profit over all feasible subsets (2^n subsets). */
export function bruteForceMaxProfit(jobs: RJob[]): number {
  let best = 0
  for (let mask = 0; mask < 1 << jobs.length; mask++) {
    const s = jobs.filter((_, i) => mask & (1 << i))
    if (feasibleSet(s)) best = Math.max(best, s.reduce((a, j) => a + j.profit, 0))
  }
  return best
}
