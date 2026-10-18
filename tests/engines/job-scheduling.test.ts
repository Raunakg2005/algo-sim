import { describe, expect, it } from "vitest"
import fc from "fast-check"
import { MAX_DEADLINE, generateJobSchedulingFrames, parseJobInteger, type Job } from "@/lib/engines/job-scheduling"
import { bruteForceMaxProfit, feasibleSet } from "../reference/job-scheduling"

const ok = (cond: boolean, msg: string): void => {
  if (!cond) throw new Error(msg)
}

const jobsArb = (maxN: number, maxProfit: number, maxDeadline: number): fc.Arbitrary<Job[]> =>
  fc
    .array(fc.record({ profit: fc.integer({ min: 1, max: maxProfit }), deadline: fc.integer({ min: 1, max: maxDeadline }) }), {
      minLength: 0,
      maxLength: maxN,
    })
    .map((r) => r.map((x, i) => ({ id: `j${i}`, name: `Job ${i + 1}`, scheduled: false, ...x })))

// the inputs accept any positive integer profit and a deadline 1..10; small ranges force ties
const custom = jobsArb(10, 100, MAX_DEADLINE)
const ties = jobsArb(10, 5, 4)
const anyJobs = fc.oneof(custom, ties)

describe("job scheduling engine", () => {
  it("final total profit equals the brute-force optimum and every scheduled job meets its deadline", () => {
    fc.assert(
      fc.property(anyJobs, (jobs) => {
        const frames = generateJobSchedulingFrames(jobs)
        const last = frames[frames.length - 1]
        expect(last.phase).toBe(3)
        expect(last.totalProfit).toBe(bruteForceMaxProfit(jobs))
        const placed = last.schedule.flatMap((j, t) => (j ? [{ j, slot: t + 1 }] : []))
        for (const { j, slot } of placed) {
          const orig = jobs.find((x) => x.id === j.id)!
          expect(slot).toBeLessThanOrEqual(orig.deadline)
          expect(j.timeSlot).toBe(slot)
        }
        expect(new Set(placed.map((p) => p.j.id)).size).toBe(placed.length)
        expect(placed.reduce((s, p) => s + p.j.profit, 0)).toBe(last.totalProfit)
        expect(feasibleSet(placed.map((p) => p.j))).toBe(true)
        expect(last.explanation).toBe(`Final result: Total profit: ${last.totalProfit}. ${placed.length} jobs scheduled out of ${jobs.length}.`)
      }),
      { numRuns: 1500 },
    )
  })

  it("frames follow the greedy: sorted by profit, two frames per job, schedule only grows", () => {
    fc.assert(
      fc.property(anyJobs, (jobs) => {
        const frames = generateJobSchedulingFrames(jobs)
        const n = jobs.length
        const slots = Math.max(1, ...jobs.map((j) => j.deadline))
        expect(frames.length).toBe(3 + 2 * n)
        expect(frames.map((f) => f.phase)).toEqual([0, 1, ...Array<number>(2 * n).fill(2), 3])
        expect(frames[0].list.map((j) => j.id)).toEqual(jobs.map((j) => j.id))
        // stable sort by profit, descending
        const want = jobs.map((j, i) => ({ j, i })).sort((a, b) => b.j.profit - a.j.profit || a.i - b.i).map((x) => x.j.id)
        expect(frames[1].list.map((j) => j.id)).toEqual(want)
        let prevFilled = 0
        let prevProfit = 0
        for (let f = 0; f < frames.length; f++) {
          const fr = frames[f]
          ok(fr.schedule.length === slots, `frame ${f}: ${fr.schedule.length} slots`)
          if (f >= 1) ok(fr.list.map((j) => j.id).join() === want.join(), `frame ${f}: list order`)
          const filled = fr.schedule.filter(Boolean).length
          ok(filled >= prevFilled && fr.totalProfit >= prevProfit, `frame ${f}: schedule or profit shrank`)
          ok(fr.totalProfit === fr.schedule.reduce((s, j) => s + (j ? j.profit : 0), 0), `frame ${f}: profit != sum of slots`)
          ok(new Set(fr.schedule.filter(Boolean).map((j) => j!.id)).size === filled, `frame ${f}: job in two slots`)
          fr.schedule.forEach((j, t) => ok(!j || t + 1 <= j.deadline, `frame ${f}: ${j?.name} after its deadline`))
          // list flags agree with the schedule
          for (const j of fr.list) {
            const at = fr.schedule.findIndex((s) => s?.id === j.id)
            ok(j.scheduled === (at >= 0) && (at < 0 || j.timeSlot === at + 1), `frame ${f}: ${j.name} flags disagree with schedule`)
          }
          if (fr.phase === 2) {
            const k = (f - 2) >> 1
            const trying = (f - 2) % 2 === 0
            ok(fr.currentJobIndex === k, `frame ${f}: current index ${fr.currentJobIndex} != ${k}`)
            const cur = fr.list[k]
            ok(fr.currentJob !== null && fr.currentJob.id === cur.id, `frame ${f}: current job mismatch`)
            ok(fr.list.every((j, idx) => !!j.highlighted === (idx === k)), `frame ${f}: highlight`)
            ok(fr.explanation.includes(cur.name), `frame ${f}: caption "${fr.explanation}" is not about ${cur.name}`)
            if (trying) {
              ok(fr.outcome === "trying" && fr.explanation.startsWith("Trying to schedule"), `frame ${f}: trying frame`)
              ok(!cur.scheduled, `frame ${f}: job already scheduled before its turn`)
            } else {
              const before = frames[f - 1]
              const free = before.schedule.slice(0, Math.min(cur.deadline, slots)).map((s) => s === null)
              const latest = free.lastIndexOf(true)
              if (latest >= 0) {
                ok(fr.outcome === "scheduled" && cur.timeSlot === latest + 1, `frame ${f}: should use latest free slot ${latest + 1}`)
                ok(fr.explanation === `Scheduled ${cur.name} at time slot ${latest + 1}. Total profit: ${fr.totalProfit}.`, `frame ${f}: caption`)
                ok(filled === prevFilled + 1, `frame ${f}: one job added`)
              } else {
                ok(fr.outcome === "skipped" && !cur.scheduled && filled === prevFilled, `frame ${f}: should be skipped`)
              }
            }
          } else ok(fr.currentJob === null && fr.outcome === null && fr.currentJobIndex === -1, `frame ${f}: stray current job`)
          prevFilled = filled
          prevProfit = fr.totalProfit
        }
        // nothing scheduled before the scheduling phase
        ok(frames[0].totalProfit === 0 && frames[1].totalProfit === 0, "profit before scheduling")
      }),
      { numRuns: 1000 },
    )
  })

  it("default example: profit 240 with Job 4, Job 1, Job 5 in slots 1..3", () => {
    const jobs: Job[] = [
      { id: "1", name: "Job 1", profit: 100, deadline: 2, scheduled: false },
      { id: "2", name: "Job 2", profit: 50, deadline: 1, scheduled: false },
      { id: "3", name: "Job 3", profit: 15, deadline: 2, scheduled: false },
      { id: "4", name: "Job 4", profit: 80, deadline: 1, scheduled: false },
      { id: "5", name: "Job 5", profit: 60, deadline: 3, scheduled: false },
    ]
    const last = generateJobSchedulingFrames(jobs).at(-1)!
    expect(last.totalProfit).toBe(240)
    expect(last.schedule.map((j) => j?.name)).toEqual(["Job 4", "Job 1", "Job 5"])
  })

  it("input validation", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (x) => {
        expect(parseJobInteger(String(x))).toBe(x)
        expect(parseJobInteger(`${x}.5`)).toBeNull()
      }),
      { numRuns: 200 },
    )
    for (const bad of ["", "0", "-1", "1.5", "2abc", "1e3"]) expect(parseJobInteger(bad)).toBeNull()
    const j = (deadline: number): Job[] => [{ id: "a", name: "A", profit: 1, deadline, scheduled: false }]
    expect(() => generateJobSchedulingFrames(j(MAX_DEADLINE + 1))).toThrow()
    expect(() => generateJobSchedulingFrames(j(5e9))).toThrow()
    expect(() => generateJobSchedulingFrames(j(1.5))).toThrow()
    expect(generateJobSchedulingFrames([]).length).toBe(3)
  })
})
