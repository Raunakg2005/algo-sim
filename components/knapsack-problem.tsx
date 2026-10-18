"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, RotateCcw, StepForward, X, Check, BookOpen } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  MAX_KNAPSACK_CAPACITY,
  MAX_KNAPSACK_ITEMS,
  generateKnapsackSteps,
  nextItemId,
  parsePositiveInteger,
  type KnapsackCell,
  type KnapsackItem,
  type KnapsackStep,
} from "@/lib/engines/knapsack-01"

type Item = KnapsackItem & { selected?: boolean }
type Cell = KnapsackCell
type AlgorithmStep = KnapsackStep

export default function KnapsackProblem() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, weight: 2, value: 3 },
    { id: 2, weight: 3, value: 4 },
    { id: 3, weight: 4, value: 5 },
    { id: 4, weight: 5, value: 6 },
  ])
  const [capacity, setCapacity] = useState(8)
  const [newItemWeight, setNewItemWeight] = useState("")
  const [newItemValue, setNewItemValue] = useState("")
  const [inputError, setInputError] = useState("")

  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [algorithmStarted, setAlgorithmStarted] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const addItem = () => {
    if (!newItemWeight.trim() || !newItemValue.trim()) {
      setInputError("Please enter both weight and value")
      return
    }

    const weight = parsePositiveInteger(newItemWeight)
    const value = parsePositiveInteger(newItemValue)

    if (weight === null) {
      setInputError("Weight must be a positive whole number")
      return
    }

    if (value === null) {
      setInputError("Value must be a positive whole number")
      return
    }

    if (items.length >= MAX_KNAPSACK_ITEMS) {
      setInputError(`At most ${MAX_KNAPSACK_ITEMS} items can be visualized`)
      return
    }

    setInputError("")
    // ids stay unique after removals (items.length + 1 could repeat an existing id)
    setItems([...items, { id: nextItemId(items), weight, value }])
    setNewItemWeight("")
    setNewItemValue("")
  }

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateCapacity = (value: string) => {
    const newCapacity = parsePositiveInteger(value)
    if (newCapacity !== null && newCapacity <= MAX_KNAPSACK_CAPACITY) {
      setInputError("")
      setCapacity(newCapacity)
    } else if (value.trim() !== "") {
      setInputError(`Capacity must be a whole number between 1 and ${MAX_KNAPSACK_CAPACITY}`)
    }
  }

  const generateRandomItems = () => {
    const count = Math.floor(Math.random() * 3) + 3 
    const newItems: Item[] = []

    for (let i = 0; i < count; i++) {
      newItems.push({
        id: i + 1,
        weight: Math.floor(Math.random() * 5) + 1, 
        value: Math.floor(Math.random() * 10) + 1, 
      })
    }

    setItems(newItems)
    setCapacity(Math.floor(Math.random() * 10) + 5) 
  }

  const startAlgorithm = () => {
    if (items.length === 0) {
      setInputError("Please add at least one item")
      return
    }

    if (capacity <= 0) {
      setInputError("Capacity must be a positive number")
      return
    }

    setInputError("")
    setAlgorithmStarted(true)

    // the whole step list comes from the pure engine (lib/engines/knapsack-01.ts)
    setSteps(generateKnapsackSteps(items, capacity))
    setCurrentStep(0)
  }

  const resetAlgorithm = () => {
    setAlgorithmStarted(false)
    setSteps([])
    setCurrentStep(0)
    setIsPlaying(false)
    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const stepForward = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsPlaying(false)
    }
  }

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      animationRef.current = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 2000 / speed)
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false)
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [isPlaying, currentStep, steps, speed])

  const getCellBackground = (cell: Cell) => {
    if (cell.highlighted) return "bg-yellow-200 dark:bg-yellow-900"
    if (cell.comparing) return "bg-blue-100 dark:bg-blue-900/30"
    return "bg-white dark:bg-gray-800"
  }

  const getCellBorder = (cell: Cell) => {
    if (cell.highlighted) return "border-2 border-yellow-500"
    if (cell.comparing) return "border-2 border-blue-500"
    return "border border-gray-300 dark:border-gray-700"
  }

  const getItemBackground = (item: Item) => {
    if (!algorithmStarted) return "bg-white dark:bg-gray-800"

    const step = steps[currentStep]
    if (!step) return "bg-white dark:bg-gray-800"

    if (step.selectedItems.includes(item.id)) return "bg-green-100 dark:bg-green-900/30"
    return "bg-white dark:bg-gray-800"
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">0/1 Knapsack Problem</h1>

      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="visualization" disabled={!algorithmStarted}>
            Visualization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-4">
                <h2 className="text-lg font-semibold">Items</h2>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      type="number"
                      min="1"
                      placeholder="Weight"
                      value={newItemWeight}
                      onChange={(e) => setNewItemWeight(e.target.value)}
                      disabled={algorithmStarted}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      min="1"
                      placeholder="Value"
                      value={newItemValue}
                      onChange={(e) => setNewItemValue(e.target.value)}
                      disabled={algorithmStarted}
                    />
                  </div>
                  <Button className="self-end" onClick={addItem} disabled={algorithmStarted}>
                    Add Item
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="capacity">Knapsack Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      max={MAX_KNAPSACK_CAPACITY}
                      value={capacity}
                      onChange={(e) => updateCapacity(e.target.value)}
                      disabled={algorithmStarted}
                    />
                  </div>
                  <Button variant="outline" className="self-end" onClick={generateRandomItems} disabled={algorithmStarted}>
                    Random Items
                  </Button>
                </div>

                {inputError && (
                  <Alert variant="destructive">
                    <AlertDescription>{inputError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button onClick={startAlgorithm} disabled={items.length === 0 || capacity <= 0}>
                    Start Algorithm
                  </Button>
                  {algorithmStarted && (
                    <Button variant="outline" onClick={resetAlgorithm}>
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Item List</h2>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No items added yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
                          <TableRow key={item.id} className={getItemBackground(item)}>
                            <TableCell>{item.id}</TableCell>
                            <TableCell>{item.weight}</TableCell>
                            <TableCell>{item.value}</TableCell>
                            <TableCell>
                              <Button aria-label="Remove item"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                disabled={algorithmStarted}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          {algorithmStarted && (
            <Card className="p-4 space-y-4">
              <div className="flex flex-wrap justify-center gap-4 w-full mb-4">
                <Button onClick={resetAlgorithm} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={togglePlay} variant="outline">
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={stepForward} variant="outline" disabled={currentStep >= steps.length - 1}>
                  <StepForward className="w-4 h-4 mr-2" />
                  Step
                </Button>

                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-sm">Speed:</span>
                  <Slider
                    value={[speed]}
                    min={0.5}
                    max={3}
                    step={0.5}
                    onValueChange={(value) => setSpeed(value[0])}
                    className="w-24"
                  />
                  <span className="text-sm">{speed}x</span>
                </div>
              </div>

              <div className="bg-primary/10 rounded-md p-2 text-center text-sm font-medium mb-4">
                {steps[currentStep]?.description || "Preparing algorithm..."}
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                          Items / Capacity
                        </th>
                        {Array.from({ length: capacity + 1 }).map((_, j) => (
                          <th
                            key={j}
                            className="p-2 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 min-w-[50px]"
                          >
                            {j}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {steps[currentStep]?.table.map((row, i) => (
                        <tr key={i}>
                          <th className="p-2 border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                            {i === 0 ? "0 (no items)" : `${i} (w:${items[i - 1].weight}, v:${items[i - 1].value})`}
                          </th>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className={`p-2 text-center relative ${getCellBackground(cell)} ${getCellBorder(cell)}`}
                            >
                              <motion.div
                                initial={{ scale: cell.highlighted ? 0.8 : 1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                {cell.value}
                              </motion.div>
                              {cell.fromAbove && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-blue-500"></div>
                                </div>
                              )}
                              {cell.fromDiagonal && (
                                <div className="absolute -top-3 -left-3">
                                  <div className="w-0 h-0 border-t-[5px] border-t-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-green-500 rotate-45"></div>
                                </div>
                              )}
                              {cell.includeItem && steps[currentStep].phase === "complete" && (
                                <div className="absolute -bottom-1 -right-1">
                                  <Check className="w-3 h-3 text-green-500" />
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="text-md font-semibold mb-2">Items</h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-md ${
                          steps[currentStep]?.selectedItems.includes(item.id)
                            ? "bg-green-100 dark:bg-green-900/30 border-green-500"
                            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                        } transition-colors duration-300`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 opacity-70" />
                          <span className="font-medium">Item {item.id}</span>
                        </div>
                        <div className="text-sm mt-1">
                          <div>Weight: {item.weight}</div>
                          <div>Value: {item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-2">Solution</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-md bg-muted/30">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Selected Items:</span>
                          <div className="font-medium">
                            {steps[currentStep]?.selectedItems.length === 0
                              ? "None"
                              : steps[currentStep]?.selectedItems.map((id) => `Item ${id}`).join(", ")}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Items Count:</span>
                          <div className="font-medium">{steps[currentStep]?.selectedItems.length}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Total Value:</span>
                          <div className="font-medium">{steps[currentStep]?.totalValue}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Total Weight:</span>
                          <div className="font-medium">
                            {steps[currentStep]?.totalWeight} / {capacity}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(currentStep / (steps.length - 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <span>{Math.round((currentStep / (steps.length - 1)) * 100)}% Complete</span>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          The 0/1 Knapsack Problem is a classic optimization problem in computer science and mathematics. Given a set of
          items, each with a weight and a value, the goal is to determine which items to include in a collection (the
          "knapsack") so that the total weight is less than or equal to a given limit (the capacity) and the total value
          is as large as possible.
        </p>
        <p className="mt-2">
          The "0/1" refers to the constraint that each item can either be included (1) or not included (0) - you cannot
          take a fractional amount of an item. This problem is solved efficiently using dynamic programming, where we
          build a table to store the maximum value that can be obtained for each capacity from 0 to the maximum
          capacity.
        </p>
        <p className="mt-2">
          For each item and each capacity, we decide whether to include the item (if it fits) or exclude it, choosing
          the option that gives the maximum value.
        </p>
      </div>
    </div>
  )
}
