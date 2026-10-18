"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Plus, Trash2, ArrowDownUp, Clock, DollarSign } from 'lucide-react'
import JobCard from "./job-card"
import TimelineVisualization from "./timeline-visualization"
import {
  JOB_STEP_NAMES,
  JOB_WELCOME,
  MAX_DEADLINE,
  generateJobSchedulingFrames,
  parseJobInteger,
  type Job,
} from "@/lib/engines/job-scheduling"

export default function JobSchedulingSimulation() {
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

  return (
    <div className="space-y-8">
      {/* Explanation panel */}
      <Card className="bg-primary/5">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">
            {currentStep < steps.length ? steps[currentStep].name : "Complete"}
            {currentStep === 2 && ` - Job ${frame.currentJobIndex + 1} of ${frame.list.length}`}
          </h2>
          <p className="text-muted-foreground">{frameIndex === 0 ? explanation : frame.explanation}</p>
        </CardContent>
      </Card>
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button aria-label="Previous step" 
            variant="outline" 
            size="icon" 
            onClick={() => setFrameIndex(prev => Math.max(0, prev - 1))}
            disabled={frameIndex === 0 || isPlaying}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button 
            variant={isPlaying ? "destructive" : "default"}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          
          <Button aria-label="Next step" 
            variant="outline" 
            size="icon" 
            onClick={runStep}
            disabled={frameIndex >= lastFrame || isPlaying}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetSimulation}
            disabled={isPlaying}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Total Profit: <span className="text-primary">{frame.totalProfit}</span>
          </span>
        </div>
      </div>
      
      {/* Add new job form */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Add New Job</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="job-name">Name</Label>
              <Input
                id="job-name"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
                placeholder="Job name"
                disabled={isPlaying || frameIndex > 0}
              />
            </div>
            <div>
              <Label htmlFor="job-profit">Profit</Label>
              <Input
                id="job-profit"
                value={newJobProfit}
                onChange={(e) => setNewJobProfit(e.target.value)}
                placeholder="Profit"
                type="number"
                min="1"
                disabled={isPlaying || frameIndex > 0}
              />
            </div>
            <div>
              <Label htmlFor="job-deadline">Deadline</Label>
              <Input
                id="job-deadline"
                value={newJobDeadline}
                onChange={(e) => setNewJobDeadline(e.target.value)}
                placeholder="Deadline"
                type="number"
                min="1"
                max="10"
                disabled={isPlaying || frameIndex > 0}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addNewJob} 
                className="w-full"
                disabled={isPlaying || frameIndex > 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Jobs and Timeline visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Jobs list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Jobs</h3>
            {currentStep === 1 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <ArrowDownUp className="h-4 w-4 mr-1" />
                Sorting by profit
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {frame.list.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={currentStep === 1 ? { opacity: 0, y: 20 } : false}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: job.highlighted ? 1.02 : 1,
                    boxShadow: job.highlighted ? "0 0 0 2px rgba(var(--primary), 0.5)" : "none"
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ 
                    duration: 0.5,
                    delay: currentStep === 1 ? index * 0.2 : 0
                  }}
                >
                  <JobCard 
                    job={job} 
                    onRemove={removeJob}
                    disabled={isPlaying || frameIndex > 0}
                    highlighted={job.highlighted}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Timeline visualization */}
        <TimelineVisualization
          maxDeadline={frame.schedule.length}
          schedule={frame.schedule}
          currentStep={currentStep}
          currentJob={frame.currentJob}
          outcome={frame.outcome}
        />
      </div>
    </div>
  )
}
