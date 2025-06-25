"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Job {
  id: string
  name: string
  profit: number
  deadline: number
  scheduled: boolean
  timeSlot?: number
  highlighted?: boolean
}

interface JobCardProps {
  job: Job
  onRemove: (id: string) => void
  disabled?: boolean
  highlighted?: boolean
}

export default function JobCard({ job, onRemove, disabled = false, highlighted = false }: JobCardProps) {
  return (
    <Card
      className={`relative overflow-hidden ${
        highlighted
          ? "border-primary shadow-md"
          : job.scheduled
            ? "border-green-500"
            : job.timeSlot === undefined && job.highlighted
              ? "border-red-500"
              : ""
      }`}
    >
      {job.scheduled && (
        <motion.div
          className="absolute top-0 left-0 h-full bg-green-500/10"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.5 }}
        />
      )}

      {job.timeSlot === undefined && job.highlighted && (
        <motion.div
          className="absolute top-0 left-0 h-full bg-red-500/10"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.5 }}
        />
      )}

      <CardContent className="p-4 flex items-center justify-between relative z-10">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">{job.name}</h4>
            {!disabled && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(job.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-green-500" />
              <div>
                <div className="text-muted-foreground">Profit</div>
                <div>{job.profit}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-blue-500" />
              <div>
                <div className="text-muted-foreground">Deadline</div>
                <div>{job.deadline}</div>
              </div>
            </div>
          </div>
        </div>

        {job.scheduled && (
          <div className="ml-2 flex items-center text-green-500">
            <CheckCircle className="h-5 w-5 mr-1" />
            <span className="text-sm font-medium">Slot {job.timeSlot}</span>
          </div>
        )}

        {job.timeSlot === undefined && job.highlighted && (
          <div className="ml-2 flex items-center text-red-500">
            <XCircle className="h-5 w-5 mr-1" />
            <span className="text-sm font-medium">Skipped</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
