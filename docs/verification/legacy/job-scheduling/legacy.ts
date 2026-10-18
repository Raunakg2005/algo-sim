// Legacy harness: the original component as a state machine. runStep, the Back button handler and the
// auto-play effect condition are verbatim; React state is modelled with plain variables.
export interface Job { id: string; name: string; profit: number; deadline: number; scheduled: boolean; timeSlot?: number; highlighted?: boolean }
export class Legacy {
  jobs: Job[]; maxDeadline = 3; totalProfit = 0; schedule: (Job | null)[] = []
  currentStep = 0; currentJobIndex = -1; isPlaying = false; sortedJobs: Job[] = []; explanation = ""
  steps = [{ name: "Initial State" }, { name: "Sort Jobs" }, { name: "Schedule Jobs" }, { name: "Final Result" }]
  constructor(jobs: Job[]) { this.jobs = jobs; this.jobsEffect() }
  jobsEffect() { const maxD = Math.max(...this.jobs.map((job) => job.deadline), 1); this.maxDeadline = maxD; this.schedule = Array(maxD).fill(null) }
  set(k: string, v: any) { (this as any)[k] = typeof v === "function" ? v((this as any)[k]) : v }
  header() { const { currentStep, currentJobIndex, sortedJobs, steps } = this; return (currentStep < steps.length ? steps[currentStep].name : "Complete") + (currentStep === 2 && currentJobIndex < sortedJobs.length ? ` - Job ${currentJobIndex + 1} of ${sortedJobs.length}` : "") }
  // timeline panel's notion of the current job (timeline-visualization.tsx)
  timelineJob() { return this.currentStep === 2 && this.currentJobIndex < this.sortedJobs.length ? this.sortedJobs[this.currentJobIndex] : null }
  back() {
    const self = this, currentStep = this.currentStep, currentJobIndex = this.currentJobIndex
    const setCurrentJobIndex = (v: any) => self.set("currentJobIndex", v), setCurrentStep = (v: any) => self.set("currentStep", v)
              if (currentStep === 2 && currentJobIndex > 0) {
                setCurrentJobIndex(prev => prev - 1)
              } else {
                setCurrentStep(prev => Math.max(0, prev - 1))
                if (currentStep === 2) setCurrentJobIndex(0)
              }
  }
  // returns true if the auto-play effect would schedule another runStep
  playWouldAdvance() { const { currentStep, currentJobIndex, sortedJobs } = this; return currentStep < 2 || (currentStep === 2 && currentJobIndex < sortedJobs.length) }
  runStep() {
    const self = this
    const setExplanation = (v: string) => self.set("explanation", v), setCurrentStep = (v: any) => self.set("currentStep", v)
    const setSortedJobs = (v: any) => self.set("sortedJobs", v), setCurrentJobIndex = (v: any) => self.set("currentJobIndex", v)
    const setSchedule = (v: any) => self.set("schedule", v), setTotalProfit = (v: any) => self.set("totalProfit", v), setIsPlaying = (v: any) => self.set("isPlaying", v)
    const { currentStep, jobs, sortedJobs, currentJobIndex, maxDeadline, schedule, totalProfit } = this
    if (currentStep === 0) {
      setExplanation("These are our jobs with their profits and deadlines.")
      setCurrentStep(1)
    } 
    else if (currentStep === 1) {
      const sorted = [...jobs].sort((a, b) => b.profit - a.profit)
      setSortedJobs(sorted)
      setExplanation("Jobs are now sorted by profit in descending order.")
      setCurrentStep(2)
      setCurrentJobIndex(0)
    } 
    else if (currentStep === 2) {
      if (currentJobIndex < sortedJobs.length) {
        const currentJob = sortedJobs[currentJobIndex]
        
        setSortedJobs(prev => prev.map(job => ({
          ...job,
          highlighted: job.id === currentJob.id
        })))
        
        setExplanation(`Trying to schedule ${currentJob.name} with profit ${currentJob.profit} and deadline ${currentJob.deadline}.`)
        
        let slot = -1
        for (let i = Math.min(currentJob.deadline, maxDeadline) - 1; i >= 0; i--) {
          if (!schedule[i]) {
            slot = i
            break
          }
        }
        
        if (slot !== -1) {
          const newSchedule = [...schedule]
          newSchedule[slot] = currentJob
          setSchedule(newSchedule)
          
          setSortedJobs(prev => prev.map(job => 
            job.id === currentJob.id 
              ? { ...job, scheduled: true, timeSlot: slot + 1 } 
              : job
          ))
          
          setTotalProfit(prev => prev + currentJob.profit)
          setExplanation(`Scheduled ${currentJob.name} at time slot ${slot + 1}. Total profit: ${totalProfit + currentJob.profit}.`)
        } else {
          setExplanation(`Cannot schedule ${currentJob.name}. No available slot before its deadline.`)
        }
        
        setCurrentJobIndex(prev => prev + 1)
      } else {
        setCurrentStep(3)
        setExplanation(`Final schedule complete. Total profit: ${totalProfit}.`)
      }
    } 
    else if (currentStep === 3) {
      setExplanation(`Final result: Total profit: ${totalProfit}. ${schedule.filter(Boolean).length} jobs scheduled out of ${jobs.length}.`)
      setIsPlaying(false)
    }
  }
}
