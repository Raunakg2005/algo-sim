"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Plus, ArrowDownUp } from "lucide-react"
import ItemCard from "./item-card"
import KnapsackContainer from "./knapsack-container"

interface Item {
  id: string
  name: string
  weight: number
  value: number
  ratio: number
  selected: boolean
  fraction?: number
}

export default function KnapsackSimulation() {
  const [items, setItems] = useState<Item[]>([
    { id: "1", name: "Item 1", weight: 10, value: 60, ratio: 6, selected: false },
    { id: "2", name: "Item 2", weight: 20, value: 100, ratio: 5, selected: false },
    { id: "3", name: "Item 3", weight: 30, value: 120, ratio: 4, selected: false },
    { id: "4", name: "Item 4", weight: 15, value: 45, ratio: 3, selected: false },
    { id: "5", name: "Item 5", weight: 25, value: 50, ratio: 2, selected: false },
  ])

  const [knapsackCapacity, setKnapsackCapacity] = useState(50)
  const [remainingCapacity, setRemainingCapacity] = useState(50)
  const [totalValue, setTotalValue] = useState(0)

  const [newItemName, setNewItemName] = useState("")
  const [newItemWeight, setNewItemWeight] = useState("")
  const [newItemValue, setNewItemValue] = useState("")

  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [allowFractions, setAllowFractions] = useState(true)
  const [sortedItems, setSortedItems] = useState<Item[]>([])
  const [explanation, setExplanation] = useState(
    "Welcome to the Greedy Knapsack Algorithm simulation. Add items or use the default ones, then start the simulation.",
  )

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const updatedItems = items.map((item) => ({
      ...item,
      ratio: Number.parseFloat((item.value / item.weight).toFixed(2)),
    }))
    setItems(updatedItems)
  }, [])

  const steps = [
    {
      name: "Initial State",
      description: "These are our items with their weights, values, and value-to-weight ratios.",
    },
    { name: "Sort Items", description: "Sort items by value-to-weight ratio in descending order." },
    {
      name: "Select Items",
      description: "Select items in order of their value-to-weight ratio until the knapsack is full.",
    },
    { name: "Final Result", description: "The knapsack is now optimally filled according to the greedy approach." },
  ]

  const resetSimulation = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsPlaying(false)
    setCurrentStep(0)
    setSortedItems([])
    setRemainingCapacity(knapsackCapacity)
    setTotalValue(0)
    setExplanation(
      "Welcome to the Greedy Knapsack Algorithm simulation. Add items or use the default ones, then start the simulation.",
    )

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: false,
        fraction: undefined,
      })),
    )
  }

  const addNewItem = () => {
    if (!newItemName || !newItemWeight || !newItemValue) return

    const weight = Number.parseFloat(newItemWeight)
    const value = Number.parseFloat(newItemValue)

    if (isNaN(weight) || isNaN(value) || weight <= 0 || value <= 0) {
      setExplanation("Please enter valid positive numbers for weight and value.")
      return
    }

    const newItem: Item = {
      id: Date.now().toString(),
      name: newItemName,
      weight,
      value,
      ratio: Number.parseFloat((value / weight).toFixed(2)),
      selected: false,
    }

    setItems((prev) => [...prev, newItem])
    setNewItemName("")
    setNewItemWeight("")
    setNewItemValue("")
    setExplanation(`Added new item: ${newItemName} with weight ${weight} and value ${value}.`)
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const runStep = () => {
    if (currentStep === 0) {
      setExplanation("These are our items with their weights, values, and value-to-weight ratios.")
      setCurrentStep(1)
    } else if (currentStep === 1) {
      const sorted = [...items].sort((a, b) => b.ratio - a.ratio)
      setSortedItems(sorted)
      setExplanation("Items are now sorted by value-to-weight ratio in descending order.")
      setCurrentStep(2)
    } else if (currentStep === 2) {
      let remaining = knapsackCapacity
      let value = 0
      const selected = [...sortedItems]

      for (let i = 0; i < selected.length; i++) {
        if (remaining >= selected[i].weight) {
          selected[i].selected = true
          selected[i].fraction = 1
          remaining -= selected[i].weight
          value += selected[i].value
          setExplanation(`Added ${selected[i].name} completely. Remaining capacity: ${remaining}.`)
        } else if (allowFractions && remaining > 0) {
          const fraction = remaining / selected[i].weight
          selected[i].selected = true
          selected[i].fraction = fraction
          value += selected[i].value * fraction
          remaining = 0
          setExplanation(`Added ${(fraction * 100).toFixed(1)}% of ${selected[i].name}. Knapsack is now full.`)
        } else {
          setExplanation(`Cannot add ${selected[i].name}. Not enough capacity left.`)
        }

        if (remaining === 0) break
      }

      setSortedItems(selected)
      setRemainingCapacity(remaining)
      setTotalValue(Number.parseFloat(value.toFixed(2)))
      setCurrentStep(3)
    } else if (currentStep === 3) {
      setExplanation(`Final result: Total value: ${totalValue}. Remaining capacity: ${remainingCapacity}.`)
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    if (isPlaying && currentStep < steps.length) {
      timerRef.current = setTimeout(() => {
        runStep()
      }, 2000)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isPlaying, currentStep])

  const togglePlay = () => {
    if (currentStep >= steps.length - 1) {
      resetSimulation()
    }
    setIsPlaying(!isPlaying)
  }

  const updateCapacity = (value: number[]) => {
    setKnapsackCapacity(value[0])
    setRemainingCapacity(value[0])
    resetSimulation()
  }

  return (
    <div className="space-y-8">
      {/* Explanation panel */}
      <Card className="bg-primary/5">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">
            {currentStep < steps.length ? steps[currentStep].name : "Complete"}
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
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0 || isPlaying}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button variant={isPlaying ? "destructive" : "default"} onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={runStep}
            disabled={currentStep >= steps.length - 1 || isPlaying}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={resetSimulation} disabled={isPlaying}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="allow-fractions" className="cursor-pointer">
            <input
              id="allow-fractions"
              type="checkbox"
              className="mr-2"
              checked={allowFractions}
              onChange={() => setAllowFractions(!allowFractions)}
            />
            Allow Fractional Items
          </Label>
        </div>
      </div>

      {/* Knapsack capacity slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="capacity">Knapsack Capacity: {knapsackCapacity}</Label>
        </div>
        <Slider
          id="capacity"
          min={10}
          max={100}
          step={5}
          value={[knapsackCapacity]}
          onValueChange={updateCapacity}
          disabled={isPlaying || currentStep > 0}
        />
      </div>

      {/* Add new item form */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Add New Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Item name"
                disabled={isPlaying || currentStep > 0}
              />
            </div>
            <div>
              <Label htmlFor="item-weight">Weight</Label>
              <Input
                id="item-weight"
                value={newItemWeight}
                onChange={(e) => setNewItemWeight(e.target.value)}
                placeholder="Weight"
                type="number"
                min="1"
                disabled={isPlaying || currentStep > 0}
              />
            </div>
            <div>
              <Label htmlFor="item-value">Value</Label>
              <Input
                id="item-value"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                placeholder="Value"
                type="number"
                min="1"
                disabled={isPlaying || currentStep > 0}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addNewItem} className="w-full" disabled={isPlaying || currentStep > 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items and Knapsack visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Items list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Items</h3>
            {currentStep === 1 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <ArrowDownUp className="h-4 w-4 mr-1" />
                Sorting by value/weight ratio
              </div>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {(currentStep === 0 ? items : sortedItems).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={currentStep === 1 ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    duration: 0.5,
                    delay: currentStep === 1 ? index * 0.2 : 0,
                  }}
                >
                  <ItemCard item={item} onRemove={removeItem} disabled={isPlaying || currentStep > 0} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Knapsack visualization */}
        <KnapsackContainer
          capacity={knapsackCapacity}
          remainingCapacity={remainingCapacity}
          totalValue={totalValue}
          items={sortedItems.filter((item) => item.selected)}
          currentStep={currentStep}
        />
      </div>
    </div>
  )
}

