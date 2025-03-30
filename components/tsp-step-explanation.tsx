"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import type { TSPStep } from "@/lib/tsp-solver"

interface StepExplanationProps {
  step: TSPStep | null
  stepIndex: number
  totalSteps: number
}

export default function StepExplanation({ step, stepIndex, totalSteps }: StepExplanationProps) {
  if (!step) return null

  const getStepTitle = () => {
    if (step.type === "initial") return "Initial Setup"
    if (step.type === "dp_update") return "DP Table Update"
    if (step.type === "backtrack") return "Backtracking"
    if (step.type === "final") return "Final Solution"
    return "Step"
  }

  const getStepIcon = () => {
    if (step.type === "initial") return "🔍"
    if (step.type === "dp_update") return "📊"
    if (step.type === "backtrack") return "🔄"
    if (step.type === "final") return "🎉"
    return "📝"
  }

  return (
    <Card className="bg-primary/5">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold flex items-center">
            <span className="mr-2">{getStepIcon()}</span>
            {getStepTitle()}
          </h2>
          <span className="text-sm text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-muted-foreground">{step.message}</p>

            {step.type === "dp_update" && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                Updating DP[{(step.mask ?? 0).toString(2).padStart(step.cityCount ?? 0, "0")}, {step.currentCity}]
                {step.nextCity !== undefined && <> by considering city {step.nextCity}</>}
              </div>
            )}

            {step.type === "backtrack" && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
                Backtracking from city {step.currentCity} to find the optimal tour
              </div>
            )}

            {step.type === "final" && step.tourCost !== undefined && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                Optimal tour found with total cost: {step.tourCost}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

