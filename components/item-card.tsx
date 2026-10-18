"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Item {
  id: string
  name: string
  weight: number
  value: number
  ratio: number
  selected: boolean
  fraction?: number
}

interface ItemCardProps {
  item: Item
  onRemove: (id: string) => void
  disabled?: boolean
}

export default function ItemCard({ item, onRemove, disabled = false }: ItemCardProps) {
  const getProgressColor = (ratio: number) => {
    if (ratio >= 5) return "bg-green-500"
    if (ratio >= 3) return "bg-blue-500"
    if (ratio >= 2) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card className={`relative overflow-hidden ${item.selected ? "border-primary" : ""}`}>
      {item.selected && (
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary/10"
          initial={{ width: 0 }}
          animate={{ width: `${(item.fraction || 1) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      )}

      <CardContent className="p-4 flex items-center justify-between relative z-10">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">{item.name}</h4>
            {!disabled && (
              <Button aria-label="Remove item" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Weight</div>
              <div>{item.weight}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Value</div>
              <div>{item.value}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ratio</div>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${getProgressColor(item.ratio)}`}></span>
                {item.ratio}
              </div>
            </div>
          </div>
        </div>

        {item.selected && item.fraction !== undefined && item.fraction < 1 && (
          <div className="ml-2 text-sm font-medium text-primary">{(item.fraction * 100).toFixed(0)}%</div>
        )}
      </CardContent>
    </Card>
  )
}
