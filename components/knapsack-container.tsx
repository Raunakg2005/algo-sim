"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Item {
  id: string
  name: string
  weight: number
  value: number
  ratio: number
  selected: boolean
  fraction?: number
}

interface KnapsackContainerProps {
  capacity: number
  remainingCapacity: number
  totalValue: number
  items: Item[]
  currentStep: number
}

export default function KnapsackContainer({
  capacity,
  remainingCapacity,
  totalValue,
  items,
  currentStep,
}: KnapsackContainerProps) {
  const usedCapacity = capacity - remainingCapacity
  const percentUsed = (usedCapacity / capacity) * 100

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Knapsack</h3>

      <Card className="border-2 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between">
            <span>Capacity: {capacity}</span>
            <span>Value: {totalValue}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Capacity visualization */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Used: {usedCapacity} ({percentUsed.toFixed(1)}%)
              </span>
              <span>Remaining: {remainingCapacity}</span>
            </div>
            <Progress value={percentUsed} className="h-3" />
          </div>

          {/* Selected items */}
          <div className="space-y-2 min-h-[200px]">
            <h4 className="text-sm font-medium text-muted-foreground">
              {items.length > 0 ? "Selected Items:" : "No items selected yet"}
            </h4>

            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-2 bg-primary/5 rounded-md flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <div className="text-sm text-muted-foreground">
                      Weight:{" "}
                      {item.fraction && item.fraction < 1 ? (item.weight * item.fraction).toFixed(1) : item.weight} |
                      Value: {item.fraction && item.fraction < 1 ? (item.value * item.fraction).toFixed(1) : item.value}
                    </div>
                  </div>

                  {item.fraction !== undefined && item.fraction < 1 && (
                    <div className="text-sm font-medium bg-primary/20 px-2 py-1 rounded">
                      {(item.fraction * 100).toFixed(0)}%
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

