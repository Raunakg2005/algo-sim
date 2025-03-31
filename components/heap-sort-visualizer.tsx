"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import HeapTree from "./heap-tree"
import { motion } from "framer-motion"

type SortingStep = {
  type: "initial" | "build-heap" | "heapify" | "extract-max" | "sorted"
  array: number[]
  heapSize: number
  comparing?: [number, number]
  swapping?: [number, number]
  currentNodeIndex?: number
  extractedIndex?: number
  sortedIndices?: number[]
  description: string
}

export default function HeapSortVisualization() {
  const [array, setArray] = useState<number[]>([8, 3, 5, 4, 7, 6, 1, 2])
  const [userInput, setUserInput] = useState("")
  const [inputError, setInputError] = useState("")
  const [steps, setSteps] = useState<SortingStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1500)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateRandomArray = () => {
    const size = 10
    const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 9) + 1)
    setArray(newArray)
    setUserInput(newArray.join(", "))
  }

  const handleUserInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const inputArray = userInput
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => {
          const num = Number.parseInt(item, 10)
          if (isNaN(num)) throw new Error(`"${item}" is not a valid number`)
          if (num < 1 || num > 9) throw new Error(`Numbers must be between 1 and 9`)
          return num
        })

      if (inputArray.length < 2) {
        setInputError("Please enter at least 2 numbers")
        return
      }

      setInputError("")
      setArray(inputArray)
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message)
      } else {
        setInputError("Invalid input")
      }
    }
  }

  const resetVisualization = () => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const generateHeapSortSteps = (arr: number[]) => {
    const steps: SortingStep[] = []
    const arrCopy = [...arr]
    const n = arrCopy.length

    steps.push({
      type: "initial",
      array: [...arrCopy],
      heapSize: n,
      description: "Initial unsorted array",
    })

    const getParentIndex = (i: number) => Math.floor((i - 1) / 2)
    const getLeftChildIndex = (i: number) => 2 * i + 1
    const getRightChildIndex = (i: number) => 2 * i + 2

    const heapify = (arr: number[], n: number, i: number, sortedIndices: number[] = []) => {
      let largest = i
      const left = getLeftChildIndex(i)
      const right = getRightChildIndex(i)

      if (left < n) {
        steps.push({
          type: "heapify",
          array: [...arr],
          heapSize: n,
          comparing: [largest, left],
          currentNodeIndex: i,
          sortedIndices: [...sortedIndices],
          description: `Compare node ${arr[largest]} with its left child ${arr[left]}`,
        })

        if (arr[left] > arr[largest]) {
          largest = left
        }
      }

      if (right < n) {
        steps.push({
          type: "heapify",
          array: [...arr],
          heapSize: n,
          comparing: [largest, right],
          currentNodeIndex: i,
          sortedIndices: [...sortedIndices],
          description: `Compare node ${arr[largest]} with its right child ${arr[right]}`,
        })

        if (arr[right] > arr[largest]) {
          largest = right
        }
      }

      if (largest !== i) {
        steps.push({
          type: "heapify",
          array: [...arr],
          heapSize: n,
          swapping: [i, largest],
          currentNodeIndex: i,
          sortedIndices: [...sortedIndices],
          description: `Swap ${arr[i]} with ${arr[largest]} to maintain max-heap property`,
        })

        ;[arr[i], arr[largest]] = [arr[largest], arr[i]]

        steps.push({
          type: "heapify",
          array: [...arr],
          heapSize: n,
          currentNodeIndex: largest,
          sortedIndices: [...sortedIndices],
          description: `Continue heapify at node ${arr[largest]}`,
        })

        heapify(arr, n, largest, sortedIndices)
      }
    }

    steps.push({
      type: "build-heap",
      array: [...arrCopy],
      heapSize: n,
      description: "Start building max heap",
    })

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      steps.push({
        type: "build-heap",
        array: [...arrCopy],
        heapSize: n,
        currentNodeIndex: i,
        description: `Heapify starting from node at index ${i}`,
      })

      heapify(arrCopy, n, i)
    }

    steps.push({
      type: "build-heap",
      array: [...arrCopy],
      heapSize: n,
      description: "Max heap built successfully",
    })

    const sortedIndices: number[] = []
    for (let i = n - 1; i > 0; i--) {
      steps.push({
        type: "extract-max",
        array: [...arrCopy],
        heapSize: i + 1,
        swapping: [0, i],
        sortedIndices: [...sortedIndices],
        description: `Extract max element ${arrCopy[0]} and place it at the end`,
      })
      ;[arrCopy[0], arrCopy[i]] = [arrCopy[i], arrCopy[0]]
      sortedIndices.push(i)

      steps.push({
        type: "extract-max",
        array: [...arrCopy],
        heapSize: i,
        extractedIndex: i,
        sortedIndices: [...sortedIndices],
        description: `Element ${arrCopy[i]} is now in its sorted position`,
      })

      steps.push({
        type: "extract-max",
        array: [...arrCopy],
        heapSize: i,
        currentNodeIndex: 0,
        sortedIndices: [...sortedIndices],
        description: "Re-heapify the reduced heap",
      })

      heapify(arrCopy, i, 0, sortedIndices)
    }

    sortedIndices.push(0)

    steps.push({
      type: "sorted",
      array: [...arrCopy],
      heapSize: 0,
      sortedIndices: sortedIndices,
      description: "Array is now fully sorted",
    })

    return steps
  }

  useEffect(() => {
    const newSteps = generateHeapSortSteps(array)
    setSteps(newSteps)
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }, [array])

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prevIndex) => {
          if (prevIndex < steps.length - 1) {
            return prevIndex + 1
          } else {
            setIsPlaying(false)
            return prevIndex
          }
        })
      }, playbackSpeed)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isPlaying, steps.length, playbackSpeed])

  useEffect(() => {
    setUserInput(array.join(", "))
  }, [])

  const currentStep = steps[currentStepIndex] || steps[0]

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* User input form */}
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleUserInputSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="array-input" className="text-sm font-medium">
              Enter numbers to sort (1-9, separated by commas):
            </Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="array-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 8, 3, 5, 4, 7, 6, 1, 2, 9, 4"
                className="flex-1 min-w-[200px]"
              />
              <Button type="submit">Set Array</Button>
              <Button type="button" variant="outline" onClick={generateRandomArray}>
                Random
              </Button>
            </div>
          </div>
          {inputError && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription>{inputError}</AlertDescription>
            </Alert>
          )}
        </form>
      </div>

      <div className="w-full bg-white rounded-lg shadow-md p-4 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-amber-50 opacity-50"></div>

        <div className="relative z-10">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 p-3 rounded-md shadow-sm mb-4 md:mb-8 border border-amber-200"
          >
            <p className="text-sm md:text-lg font-medium text-stone-700">{currentStep?.description}</p>
          </motion.div>

          <div className="flex justify-center items-center min-h-[300px] md:min-h-[400px] mb-4 md:mb-8 relative">
            <HeapTree
              array={currentStep?.array || []}
              heapSize={currentStep?.heapSize || 0}
              comparing={currentStep?.comparing}
              swapping={currentStep?.swapping}
              currentNodeIndex={currentStep?.currentNodeIndex}
              sortedIndices={currentStep?.sortedIndices || []}
            />
          </div>

          {currentStep?.type === "sorted" && (
            <div className="w-full bg-gray-100 rounded-lg p-4">
              <h3 className="text-lg font-bold mb-2 text-stone-700">Sorted Array:</h3>
              <div className="flex justify-center items-center gap-2">
                {currentStep.array.map((value, index) => (
                  <motion.div
                    key={`linear-${index}`}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded shadow"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <span className="font-bold text-stone-700">{value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-4 text-xs md:text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full mr-1 md:mr-2"></div>
              <span>Current Node</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full mr-1 md:mr-2"></div>
              <span>Comparing</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-amber-500 rounded-full mr-1 md:mr-2"></div>
              <span>Swapping</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 md:w-4 md:h-4 bg-purple-500 rounded-full mr-1 md:mr-2"></div>
              <span>Sorted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={resetVisualization}
          className="bg-white"
          title="Reset to first step"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={prevStep}
          disabled={currentStepIndex === 0}
          className="bg-white"
          title="Previous step"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          className="bg-white"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={nextStep}
          disabled={currentStepIndex === steps.length - 1}
          className="bg-white"
          title="Next step"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-stone-600">Speed:</span>
          <input
            type="range"
            min="500"
            max="3000"
            step="100"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="w-16 md:w-24"
            title={`${playbackSpeed}ms between steps`}
          />
        </div>

        <div className="text-xs md:text-sm text-stone-600 bg-white px-2 md:px-3 py-1 rounded-full shadow-sm">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
      </div>
    </div>
  )
}
