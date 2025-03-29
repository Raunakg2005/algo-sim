"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Plus, Trash2, ArrowDownUp, Clock, DollarSign } from 'lucide-react'
import JobCard from "./job-card"
import TimelineVisualization from "./timeline-visualization"

interface Job {
  id: string
  name: string
  profit: number
  deadline: number
  scheduled: boolean
  timeSlot?: number
  highlighted?: boolean
}

export default function JobSchedulingSimulation() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: "1", name: "Job 1", profit: 100, deadline: 2, scheduled: false },
    { id: "2", name: "Job 2", profit: 50, deadline: 1, scheduled: false },
    { id: "3", name: "Job 3", profit: 15, deadline: 2, scheduled: false },
    { id: "4", name: "Job 4", profit: 80, deadline: 1, scheduled: false },
    { id: "5", name: "Job 5", profit: 60, deadline: 3, scheduled: false },
  ])
  
  const [maxDeadline, setMaxDeadline] = useState(3)
  const [totalProfit, setTotalProfit] = useState(0)
  const [schedule, setSchedule] = useState<(Job | null)[]>([])
  
  const [newJobName, setNewJobName] = useState("")
  const [newJobProfit, setNewJobProfit] = useState("")
  const [newJobDeadline, setNewJobDeadline] = useState("")
  
  const [currentStep, setCurrentStep] = useState(0)
  const [currentJobIndex, setCurrentJobIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sortedJobs, setSortedJobs] = useState<Job[]>([])
  const [explanation, setExplanation] = useState("Welcome to the Job Scheduling with Deadlines algorithm simulation. Add jobs or use the default ones, then start the simulation.")
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    const maxD = Math.max(...jobs.map(job => job.deadline), 1)
    setMaxDeadline(maxD)
    
    setSchedule(Array(maxD).fill(null))
  }, [jobs])
  
  const steps = [
    { name: "Initial State", description: "These are our jobs with their profits and deadlines." },
    { name: "Sort Jobs", description: "Sort jobs by profit in descending order." },
    { name: "Schedule Jobs", description: "Schedule each job in the latest available slot before its deadline." },
    { name: "Final Result", description: "The jobs are now optimally scheduled to maximize profit." }
  ]
  
  const resetSimulation = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsPlaying(false)
    setCurrentStep(0)
    setCurrentJobIndex(-1)
    setSortedJobs([])
    setSchedule(Array(maxDeadline).fill(null))
    setTotalProfit(0)
    setExplanation("Welcome to the Job Scheduling with Deadlines algorithm simulation. Add jobs or use the default ones, then start the simulation.")
    
    setJobs(prev => prev.map(job => ({
      ...job,
      scheduled: false,
      timeSlot: undefined,
      highlighted: false
    })))
  }
  
  const addNewJob = () => {
    if (!newJobName || !newJobProfit || !newJobDeadline) return
    
    const profit = parseInt(newJobProfit)
    const deadline = parseInt(newJobDeadline)
    
    if (isNaN(profit) || isNaN(deadline) || profit <= 0 || deadline <= 0) {
      setExplanation("Please enter valid positive numbers for profit and deadline.")
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
  
  useEffect(() => {
    if (isPlaying) {
      if (currentStep < 2 || (currentStep === 2 && currentJobIndex < sortedJobs.length)) {
        timerRef.current = setTimeout(() => {
          runStep()
        }, currentStep === 2 ? 1500 : 2000)
      } else if (currentStep === 3) {
        setIsPlaying(false)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isPlaying, currentStep, currentJobIndex, sortedJobs.length])
  
  const togglePlay = () => {
    if (currentStep === 3) {
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
            {currentStep === 2 && currentJobIndex < sortedJobs.length && ` - Job ${currentJobIndex + 1} of ${sortedJobs.length}`}
          </h2>
          <p className="text-muted-foreground">{explanation}</p>
        </CardContent>
      </Card>
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              if (currentStep === 2 && currentJobIndex > 0) {
                setCurrentJobIndex(prev => prev - 1)
              } else {
                setCurrentStep(prev => Math.max(0, prev - 1))
                if (currentStep === 2) setCurrentJobIndex(0)
              }
            }}
            disabled={currentStep === 0 || isPlaying}
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
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={runStep}
            disabled={currentStep === 3 || isPlaying}
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
            Total Profit: <span className="text-primary">{totalProfit}</span>
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
                disabled={isPlaying || currentStep > 0}
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
                disabled={isPlaying || currentStep > 0}
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
                disabled={isPlaying || currentStep > 0}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={addNewJob} 
                className="w-full"
                disabled={isPlaying || currentStep > 0}
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
              {(currentStep === 0 ? jobs : sortedJobs).map((job, index) => (
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
                    disabled={isPlaying || currentStep > 0}
                    highlighted={job.highlighted}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Timeline visualization */}
        <TimelineVisualization
          maxDeadline={maxDeadline}
          schedule={schedule}
          currentStep={currentStep}
          currentJobIndex={currentJobIndex}
          sortedJobs={sortedJobs}
        />
      </div>
    </div>
  )
}
