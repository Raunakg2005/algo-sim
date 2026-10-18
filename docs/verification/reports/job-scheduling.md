# Job Sequencing with Deadlines (`job-scheduling`)

## What it visualizes
`components/job-scheduling-simulation.tsx` (with the helpers `job-card.tsx` and `timeline-visualization.tsx`) shows the greedy algorithm for
unit-time jobs on one machine:
- sort the jobs by profit, descending;
- put each job into the latest free slot t ≤ its deadline, or skip it.

This greedy is optimal (a matroid). There are max-deadline slots.

## UI input limits
- **Jobs:** name, profit and deadline, parsed with `parseInt` and required to be > 0. The deadline box has `max="10"`, but this was not
  enforced. Jobs can be removed at the Initial State, including all of them.
- **Default:** five jobs (100,2) (50,1) (15,2) (80,1) (60,3). The optimum is 240: Job 4, Job 1, Job 5.
- **Controls:** Back, Next, Play/Pause and Reset.

## Engine API (pure) - `lib/engines/job-scheduling.ts`
- `generateJobSchedulingFrames(jobs) => JobSchedulingFrame[]`. Each frame is `{ phase, explanation, list, schedule, totalProfit,
  currentJobIndex, currentJob, outcome }`. The frames are:
  - Initial State and Sort Jobs;
  - for each job in profit order, a "trying" frame (with the free slots ≤ its deadline marked available) and a result frame
    ("scheduled at slot t" or "cannot schedule");
  - Final Result.

  The engine throws on a deadline outside 1..10 or a non-positive profit.
- `parseJobInteger(text)`, `MAX_DEADLINE = 10`, `JOB_STEP_NAMES`, `JOB_WELCOME`.

The component now keeps only `frameIndex`, the job list and the Initial-State notice. Frames come from
`useMemo(generateJobSchedulingFrames(jobs))`. Removed from the component: the state machine in `runStep`, the `sortedJobs` / `schedule` /
`totalProfit` / `currentJobIndex` state, and the `maxDeadline` effect. `timeline-visualization.tsx` contained algorithm logic (it derived the
current job and the "available" slots from `currentJobIndex`/`sortedJobs`), so it now takes `currentJob` and `outcome` from the frame.

## Legacy check (original HEAD code)
The harness is `legacy\job-scheduling\legacy.ts`: the component as a state machine with `runStep`, the Back handler, the auto-play effect
condition and the timeline's current-job rule verbatim. The check is `check.ts` and its output is `results.txt`.

Forward runs (Next until the end):
- the default;
- 5,000 random runs: 1..10 jobs, profit 1..100, deadline 1..10;
- 3,000 tie-heavy runs: profit 1..5, deadline 1..4.

Interaction runs: 4,000 random Next/Back sequences.

| Defect | Rate | Minimal counterexample |
|---|---|---|
| **Back does not undo a placement.** Back during scheduling only decrements the job index, and Next then places the same job again: one job in two slots, profit counted twice. Back from Schedule to Sort keeps the filled slots, and the re-run schedules on top of them | 1,559 / 4,000 sequences end with a job in two slots; 1,552 / 4,000 with a wrong final profit (39 %) | default jobs: Next, Next, Next, Back, Next, … → slots [Job 1, Job 1, Job 5], profit 260 (optimum 240) |
| **Auto-play never reaches Final Result.** After the last job the effect condition `currentStep === 2 && currentJobIndex < sortedJobs.length` is false and `currentStep !== 3`, so nothing happens. The button stays on "Pause", and Next/Back stay disabled until the user presses Pause | 8,001 / 8,001 forward runs (100 %) | default jobs, Play |
| **Header and timeline name the next job.** After job k is processed, the header says "Job k+2 of n" and the timeline's "Current Job" panel describes job k+1 ("Looking for the latest available slot..."), while the caption and the highlighted card describe job k | every run with ≥ 2 jobs: 7,201 / 8,001 runs, 36,205 frames | default: after Job 1 is placed, the caption says "Scheduled Job 1 at time slot 2", the header says "Job 2 of 5" and the timeline shows Job 4 |
| **The "Sort Jobs" frame shows an empty job list.** It shows `sortedJobs = []`; sorting happens when you leave the frame | 8,001 / 8,001 | default, Next |
| **Unbounded deadline crashes the page.** The timeline allocates `Array(maxDeadline)` | by construction | deadline 5000000000 → `RangeError: Invalid array length`; deadline 10^7 → a 10-million-slot timeline |
| `parseInt` silently truncates | by construction | deadline `2.5` → 2 |

**The greedy itself is correct.** In all 8,001 forward runs the final profit equalled the brute-force optimum over feasible subsets, every
job sat in a slot ≤ its deadline, and no job was placed twice.

## Fixes
1. Precomputed frames. Back, Next and Play only move `frameIndex`, so Back can never re-apply a placement, and auto-play stops at the last
   frame.
2. Each job has a "trying" frame and a result frame. The header ("Job k of n"), the highlighted card, the caption and the timeline panel
   ("Looking for…" / "Successfully scheduled at slot t" / "Could not schedule…") all describe the same job. "Available" slots are shown only
   in the trying frame.
3. The Sort Jobs frame shows the sorted list (equal profits keep input order).
4. Deadlines must be whole numbers 1..10 (matching the input's `max`), and profits positive whole numbers.
5. One Final Result frame: "Final result: Total profit: P. k jobs scheduled out of n.".

## Properties tested - `tests/engines/job-scheduling.test.ts`, oracle `tests/reference/job-scheduling.ts`
The oracle is brute force over all subsets, with feasibility decided by "at most t jobs have deadline ≤ t" (no greedy involved).
| Property | numRuns |
|---|---|
| Final profit = brute-force optimum; every scheduled job's slot ≤ its deadline; timeSlot is correct; no job twice; profit = sum of the slots; the scheduled set is feasible; the final caption is exact (0..10 jobs, profit 1..100, deadline 1..10, plus a tie-heavy family) | 1,500 |
| Frames:<ul><li>3 + 2n frames with phases [0, 1, 2×2n, 3];</li><li>frame 0 in input order and frame 1 in stable profit order;</li><li>every frame has max(deadline) slots, the schedule and profit only grow, profit = sum of the slots, no duplicates, no deadline violations, and the list flags agree with the schedule;</li><li>in scheduling frame 2k/2k+1 the current index is k, only job k is highlighted and named in the caption;</li><li>the trying frame comes before the placement;</li><li>the result frame uses the latest free slot ≤ deadline from the previous frame, or skips exactly when none exists;</li><li>no stray current job outside phase 2</li></ul> | 1,000 |
| Default example: 240, slots [Job 4, Job 1, Job 5] | unit |
| Validation: strict integers; deadline 11, 5e9 and 1.5 rejected; an empty job list gives 3 frames | 200 + unit |

All 4 tests pass in about 1.5 s. `tsc` (strict) is clean.

## Not verifiable
- framer-motion animations and colours are not tested.
- `job-card.tsx` was not changed; it only displays the flags the frames set.
