"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface Job {
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
}

export default function TimelineVisualization({
  maxDeadline,
  schedule,
  currentStep,
  currentJobIndex,
  sortedJobs,
}: TimelineVisualizationProps) {
  const timeSlots = Array.from({ length: maxDeadline }, (_, i) => i + 1)

  const currentJob = currentStep === 2 && currentJobIndex < sortedJobs.length ? sortedJobs[currentJobIndex] : null

  const getSlotStatus = (slotIndex: number) => {
    if (currentStep < 2) return "empty"

    if (schedule[slotIndex]) return "filled"

    if (
      currentJob &&
      slotIndex < currentJob.deadline &&
      currentJobIndex === sortedJobs.findIndex((j) => j.id === currentJob.id)
    ) {
      return "valid"
    }

    return "empty"
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Timeline</h3>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            <span>Schedule (Time Slots)</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Timeline visualization */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((slot, index) => (
                <div key={slot} className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-1">Slot {slot}</div>
                  <motion.div
                    className={`w-16 h-16 rounded-md flex items-center justify-center border-2 ${
                      getSlotStatus(index) === "filled"
                        ? "border-green-500 bg-green-50"
                        : getSlotStatus(index) === "valid"
                          ? "border-blue-500 border-dashed bg-blue-50"
                          : "border-gray-200"
                    }`}
                    animate={{
                      scale: getSlotStatus(index) === "valid" ? [1, 1.05, 1] : 1,
                      borderWidth: getSlotStatus(index) === "valid" ? 3 : 2,
                    }}
                    transition={{
                      scale: { repeat: Number.POSITIVE_INFINITY, duration: 2 },
                      borderWidth: { duration: 0.3 },
                    }}
                  >
                    {schedule[index] ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                      >
                        <div className="font-medium text-sm">{schedule[index]?.name}</div>
                        <div className="text-xs text-green-600">${schedule[index]?.profit}</div>
                      </motion.div>
                    ) : (
                      <span className="text-gray-400">Empty</span>
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded border-2 border-gray-200 mr-2"></div>
              <span>Empty Slot</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded border-2 border-blue-500 border-dashed bg-blue-50 mr-2"></div>
              <span>Available for Current Job</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-50 mr-2"></div>
              <span>Filled Slot</span>
            </div>
          </div>

          {/* Current job info */}
          {currentStep === 2 && currentJob && (
            <div className="bg-primary/5 p-3 rounded-md">
              <h4 className="font-medium mb-1">Current Job</h4>
              <div className="text-sm">
                <p>
                  Trying to schedule <strong>{currentJob.name}</strong> with profit{" "}
                  <strong>${currentJob.profit}</strong> and deadline <strong>{currentJob.deadline}</strong>.
                </p>
                <p className="mt-1">
                  {currentJob.scheduled
                    ? `Successfully scheduled at slot ${currentJob.timeSlot}.`
                    : currentJobIndex > sortedJobs.findIndex((j) => j.id === currentJob.id)
                      ? "Could not schedule this job. All slots before deadline are filled."
                      : "Looking for the latest available slot before deadline..."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
