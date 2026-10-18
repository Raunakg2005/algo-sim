import sys
root = sys.argv[1]
p = root + '/components/job-scheduling-simulation.tsx'
s = open(p, encoding='utf-8').read()
a = s.index('interface Job {')
b = s.index('  return (\n    <div className="space-y-8">')
logic = '''export default function JobSchedulingSimulation() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: "1", name: "Job 1", profit: 100, deadline: 2, scheduled: false },
    { id: "2", name: "Job 2", profit: 50, deadline: 1, scheduled: false },
    { id: "3", name: "Job 3", profit: 15, deadline: 2, scheduled: false },
    { id: "4", name: "Job 4", profit: 80, deadline: 1, scheduled: false },
    { id: "5", name: "Job 5", profit: 60, deadline: 3, scheduled: false },
  ])

  const [newJobName, setNewJobName] = useState("")
  const [newJobProfit, setNewJobProfit] = useState("")
  const [newJobDeadline, setNewJobDeadline] = useState("")

  // position in the frame list produced by the engine
  const [frameIndex, setFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  // messages for the Initial State frame (welcome text, job added, input errors)
  const [explanation, setExplanation] = useState(JOB_WELCOME)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // every frame comes from the pure engine (lib/engines/job-scheduling.ts)
  const frames = useMemo(() => generateJobSchedulingFrames(jobs), [jobs])
  const frame = frames[Math.min(frameIndex, frames.length - 1)]
  const lastFrame = frames.length - 1
  const currentStep = frame.phase
  const steps = JOB_STEP_NAMES.map((name) => ({ name }))

  const resetSimulation = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsPlaying(false)
    setFrameIndex(0)
    setExplanation(JOB_WELCOME)
  }

  const addNewJob = () => {
    if (!newJobName || !newJobProfit || !newJobDeadline) return

    const profit = parseJobInteger(newJobProfit)
    const deadline = parseJobInteger(newJobDeadline)

    if (profit === null || deadline === null || deadline > MAX_DEADLINE) {
      setExplanation(`Please enter a positive whole number for profit and a whole-number deadline from 1 to ${MAX_DEADLINE}.`)
      return
    }

    const newJob: Job = {
      id: Date.now().toString(),
      name: newJobName,
      profit,
      deadline,
      scheduled: false
    }

    setJobs(prev => [...prev, newJob])
    setNewJobName("")
    setNewJobProfit("")
    setNewJobDeadline("")
    setExplanation(`Added new job: ${newJobName} with profit ${profit} and deadline ${deadline}.`)
  }

  const removeJob = (id: string) => {
    setJobs(prev => prev.filter(job => job.id !== id))
  }

  const runStep = () => {
    if (frameIndex < lastFrame) {
      setFrameIndex(frameIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    if (isPlaying) {
      if (frameIndex < lastFrame) {
        timerRef.current = setTimeout(() => {
          setFrameIndex(prev => prev + 1)
        }, currentStep === 2 ? 1500 : 2000)
      } else {
        setIsPlaying(false)
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isPlaying, frameIndex, lastFrame, currentStep])

  const togglePlay = () => {
    if (frameIndex >= lastFrame) {
      resetSimulation()
      setIsPlaying(true)
    } else {
      setIsPlaying(!isPlaying)
    }
  }

'''
s = s[:a] + logic + s[b:]
s = s.replace('import { useState, useRef, useEffect } from "react"', 'import { useState, useRef, useEffect, useMemo } from "react"')
s = s.replace('import TimelineVisualization from "./timeline-visualization"\n', '''import TimelineVisualization from "./timeline-visualization"
import {
  JOB_STEP_NAMES,
  JOB_WELCOME,
  MAX_DEADLINE,
  generateJobSchedulingFrames,
  parseJobInteger,
  type Job,
} from "@/lib/engines/job-scheduling"
''')


def rep(old, new):
    global s
    assert s.count(old) == 1, old
    s = s.replace(old, new)


rep('''            {currentStep === 2 && currentJobIndex < sortedJobs.length && ` - Job ${currentJobIndex + 1} of ${sortedJobs.length}`}''',
    '''            {currentStep === 2 && ` - Job ${frame.currentJobIndex + 1} of ${frame.list.length}`}''')
rep('<p className="text-muted-foreground">{explanation}</p>',
    '<p className="text-muted-foreground">{frameIndex === 0 ? explanation : frame.explanation}</p>')
rep('''            onClick={() => {
              if (currentStep === 2 && currentJobIndex > 0) {
                setCurrentJobIndex(prev => prev - 1)
              } else {
                setCurrentStep(prev => Math.max(0, prev - 1))
                if (currentStep === 2) setCurrentJobIndex(0)
              }
            }}
            disabled={currentStep === 0 || isPlaying}''', '''            onClick={() => setFrameIndex(prev => Math.max(0, prev - 1))}
            disabled={frameIndex === 0 || isPlaying}''')
rep('''            disabled={currentStep === 3 || isPlaying}''', '''            disabled={frameIndex >= lastFrame || isPlaying}''')
rep('''Total Profit: <span className="text-primary">{totalProfit}</span>''', '''Total Profit: <span className="text-primary">{frame.totalProfit}</span>''')
s = s.replace('disabled={isPlaying || currentStep > 0}', 'disabled={isPlaying || frameIndex > 0}')
rep('''{(currentStep === 0 ? jobs : sortedJobs).map((job, index) => (''', '''{frame.list.map((job, index) => (''')
rep('''          maxDeadline={maxDeadline}
          schedule={schedule}
          currentStep={currentStep}
          currentJobIndex={currentJobIndex}
          sortedJobs={sortedJobs}''', '''          maxDeadline={frame.schedule.length}
          schedule={frame.schedule}
          currentStep={currentStep}
          currentJob={frame.currentJob}
          outcome={frame.outcome}''')
open(p, 'w', encoding='utf-8').write(s)

p = root + '/components/timeline-visualization.tsx'
s = open(p, encoding='utf-8').read()
rep('''interface Job {
  id: string
  name: string
  profit: number
  deadline: number
  scheduled: boolean
  timeSlot?: number
  highlighted?: boolean
}

interface TimelineVisualizationProps {
  maxDeadline: number
  schedule: (Job | null)[]
  currentStep: number
  currentJobIndex: number
  sortedJobs: Job[]
}''', '''import type { Job, JobOutcome } from "@/lib/engines/job-scheduling"

interface TimelineVisualizationProps {
  maxDeadline: number
  schedule: (Job | null)[]
  currentStep: number
  /** job considered in the current frame and what happened to it (from the engine frame) */
  currentJob: Job | null
  outcome: JobOutcome | null
}''')
rep('''  currentJobIndex,
  sortedJobs,
}: TimelineVisualizationProps) {''', '''  currentJob,
  outcome,
}: TimelineVisualizationProps) {''')
rep('''  const currentJob = currentStep === 2 && currentJobIndex < sortedJobs.length ? sortedJobs[currentJobIndex] : null

''', '')
rep('''    if (
      currentJob &&
      slotIndex < currentJob.deadline &&
      currentJobIndex === sortedJobs.findIndex((j) => j.id === currentJob.id)
    ) {''', '''    // free slots the current job could still use (shown while it is being placed)
    if (currentJob && outcome === "trying" && slotIndex < currentJob.deadline) {''')
rep('''                  {currentJob.scheduled
                    ? `Successfully scheduled at slot ${currentJob.timeSlot}.`
                    : currentJobIndex > sortedJobs.findIndex((j) => j.id === currentJob.id)
                      ? "Could not schedule this job. All slots before deadline are filled."
                      : "Looking for the latest available slot before deadline..."}''', '''                  {outcome === "scheduled"
                    ? `Successfully scheduled at slot ${currentJob.timeSlot}.`
                    : outcome === "skipped"
                      ? "Could not schedule this job. All slots before deadline are filled."
                      : "Looking for the latest available slot before deadline..."}''')
open(p, 'w', encoding='utf-8').write(s)
print("ok")
