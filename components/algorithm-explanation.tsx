import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { AlgorithmStep } from "@/lib/mst-algorithms"

interface AlgorithmExplanationProps {
  algorithm: "kruskal" | "prim"
  step: AlgorithmStep
  stepIndex: number
  totalSteps: number
}

export default function AlgorithmExplanation({ 
  algorithm, 
  step, 
  stepIndex, 
  totalSteps 
}: AlgorithmExplanationProps) {
  const getStepTitle = () => {
    if (step.type === "initial") return "Initial Graph"
    if (step.type === "sort" && algorithm === "kruskal") return "Sort Edges by Weight"
    if (step.type === "start" && algorithm === "prim") return "Start from Initial Node"
    if (step.type === "check") return "Check Edge"
    if (step.type === "add") return "Add Edge to MST"
    if (step.type === "skip") return "Skip Edge"
    if (step.type === "complete") return "MST Complete"
    return "Step"
  }
  
  const getStepIcon = () => {
    if (step.type === "initial") return "🔍"
    if (step.type === "sort") return "📊"
    if (step.type === "start") return "🏁"
    if (step.type === "check") return "⚖️"
    if (step.type === "add") return "✅"
    if (step.type === "skip") return "❌"
    if (step.type === "complete") return "🎉"
    return "🔄"
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
            
            {step.type === "add" && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                Edge added to MST. Total weight so far: {step.totalWeight}
              </div>
            )}
            
            {step.type === "skip" && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {algorithm === "kruskal" 
                  ? "Edge skipped because it would create a cycle." 
                  : "Edge skipped because the node is already in the MST."}
              </div>
            )}
            
            {step.type === "complete" && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                MST complete with total weight: {step.totalWeight}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
