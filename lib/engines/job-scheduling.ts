// Frame generator for the Job Sequencing with Deadlines visualizer (greedy by profit, latest free slot).
// Pure function: given the jobs, returns every frame the visualizer plays:
//   Initial State, Sort Jobs, then for each job (in profit order) a "trying" frame and a result frame,
//   then Final Result. Unit-time jobs; slot t (1-based) is the time interval [t-1, t].

export interface Job {
  id: string
  name: string
  profit: number
  deadline: number
  scheduled: boolean
  timeSlot?: number
  highlighted?: boolean
}

export type JobOutcome = "trying" | "scheduled" | "skipped"

export type JobSchedulingFrame = {
  phase: 0 | 1 | 2 | 3
  explanation: string
  /** jobs in the list (input order in frame 0, sorted by profit afterwards) */
  list: Job[]
  /** schedule[t-1] = job in slot t, length = largest deadline */
  schedule: (Job | null)[]
  totalProfit: number
  /** index (in the sorted list) of the job being considered; -1 outside the scheduling phase */
  currentJobIndex: number
  currentJob: Job | null
  outcome: JobOutcome | null
}

export const JOB_STEP_NAMES = ["Initial State", "Sort Jobs", "Schedule Jobs", "Final Result"] as const
export const MAX_DEADLINE = 10
export const JOB_WELCOME =
  "Welcome to the Job Scheduling with Deadlines algorithm simulation. Add jobs or use the default ones, then start the simulation."

/** Strict parser for the profit / deadline fields: a whole number >= 1 written in digits. */
export function parseJobInteger(text: string): number | null {
  const t = text.trim()
  if (!/^\d+$/.test(t)) return null
  const v = Number(t)
  return Number.isSafeInteger(v) && v > 0 ? v : null
}

export function generateJobSchedulingFrames(jobs: Job[]): JobSchedulingFrame[] {
  for (const j of jobs) {
    if (!(Number.isFinite(j.profit) && j.profit > 0)) throw new Error(`${j.name}: profit must be a positive number`)
    if (!(Number.isInteger(j.deadline) && j.deadline >= 1 && j.deadline <= MAX_DEADLINE))
      throw new Error(`${j.name}: deadline must be an integer in 1..${MAX_DEADLINE}`)
  }
  const slots = Math.max(1, ...jobs.map((j) => j.deadline))
  const clean = (j: Job): Job => ({ ...j, scheduled: false, timeSlot: undefined, highlighted: false })
  const frames: JobSchedulingFrame[] = []

  frames.push({
    phase: 0,
    explanation: JOB_WELCOME,
    list: jobs.map(clean),
    schedule: Array<Job | null>(slots).fill(null),
    totalProfit: 0,
    currentJobIndex: -1,
    currentJob: null,
    outcome: null,
  })

  // descending profit; equal profits keep the input order
  const sorted = jobs
    .map((j, i) => ({ j: clean(j), i }))
    .sort((a, b) => b.j.profit - a.j.profit || a.i - b.i)
    .map((x) => x.j)

  frames.push({
    phase: 1,
    explanation: "Jobs are now sorted by profit in descending order.",
    list: sorted.map((j) => ({ ...j })),
    schedule: Array<Job | null>(slots).fill(null),
    totalProfit: 0,
    currentJobIndex: -1,
    currentJob: null,
    outcome: null,
  })

  const list = sorted.map((j) => ({ ...j }))
  const schedule: (Job | null)[] = Array<Job | null>(slots).fill(null)
  let total = 0
  const snapshot = (k: number, outcome: JobOutcome, explanation: string): JobSchedulingFrame => {
    const shown = list.map((j, idx) => ({ ...j, highlighted: idx === k }))
    return {
      phase: 2,
      explanation,
      list: shown,
      schedule: schedule.map((s) => (s ? { ...s } : null)),
      totalProfit: total,
      currentJobIndex: k,
      currentJob: { ...shown[k] },
      outcome,
    }
  }

  for (let k = 0; k < list.length; k++) {
    const job = list[k]
    frames.push(snapshot(k, "trying", `Trying to schedule ${job.name} with profit ${job.profit} and deadline ${job.deadline}.`))

    let slot = -1
    for (let t = Math.min(job.deadline, slots) - 1; t >= 0; t--) {
      if (!schedule[t]) {
        slot = t
        break
      }
    }

    if (slot !== -1) {
      job.scheduled = true
      job.timeSlot = slot + 1
      schedule[slot] = { ...job }
      total += job.profit
      frames.push(snapshot(k, "scheduled", `Scheduled ${job.name} at time slot ${slot + 1}. Total profit: ${total}.`))
    } else {
      frames.push(snapshot(k, "skipped", `Cannot schedule ${job.name}. No available slot before its deadline.`))
    }
  }

  const count = schedule.filter(Boolean).length
  frames.push({
    phase: 3,
    explanation: `Final result: Total profit: ${total}. ${count} jobs scheduled out of ${jobs.length}.`,
    list: list.map((j) => ({ ...j })),
    schedule: schedule.map((s) => (s ? { ...s } : null)),
    totalProfit: total,
    currentJobIndex: -1,
    currentJob: null,
    outcome: null,
  })
  return frames
}
