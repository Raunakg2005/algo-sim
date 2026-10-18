"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { BookOpen, Play, Pause, RotateCcw, StepForward } from "lucide-react"
import { Input } from "@/components/ui/input"
import { generateMergeSortSteps, type MergeSortStep } from "@/lib/engines/merge-sort"

type SortStep = MergeSortStep

export default function MergeSortVisualization() {
  const [array, setArray] = useState<number[]>([38, 27, 43, 3, 9, 82, 10])
  const [sortingSteps, setSortingSteps] = useState<SortStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const [userInput, setUserInput] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")

  const generateRandomArray = () => {
    const newArray = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100))
    setArray(newArray)
    setCurrentStep(0)
    setSortingSteps([])
    setIsPlaying(false)
    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }
  }

  const resetVisualization = () => {
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
    if (currentStep < sortingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsPlaying(false)
    }
  }

  const handleUserInput = () => {
    setInputError("")

    try {
      const inputArray = userInput
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => {
          const num = Number(item)
          if (isNaN(num)) {
            throw new Error(`"${item}" is not a valid number`)
          }
          return num
        })

      if (inputArray.length === 0) {
        setInputError("Please enter at least one number")
        return
      }

      if (inputArray.length > 12) {
        setInputError("Please enter 12 or fewer numbers for better visualization")
        return
      }
      setArray(inputArray)
      setCurrentStep(0)
      setSortingSteps([])
      setIsPlaying(false)
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message)
      } else {
        setInputError("An unknown error occurred")
      }
    }
  }

  useEffect(() => {
    setSortingSteps(generateMergeSortSteps(array))
  }, [array])

  useEffect(() => {
    if (isPlaying && currentStep < sortingSteps.length - 1) {
      animationRef.current = setTimeout(() => {
        setCurrentStep(currentStep + 1)
      }, 2000 / speed)
    } else if (currentStep >= sortingSteps.length - 1) {
      setIsPlaying(false)
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [isPlaying, currentStep, sortingSteps, speed])

  const getStepExplanation = () => {
    if (!sortingSteps[currentStep]) return ""

    const step = sortingSteps[currentStep]

    if (step.arrays.length === 1 && currentStep === 0) {
      return "Initial array: We start with an unsorted array of numbers."
    }

    if (step.comparisons && step.comparisons.length > 0) {
      return "Compare: We compare elements from each subarray and take the smaller one."
    }

    if (step.merging.some((m) => m)) {
      return "Merge: We combine and sort the subarrays to create a larger sorted array."
    }

    if (step.arrays.length > 1 && step.arrays.some((a) => a.length === 1)) {
      return "Base case: A subarray with a single element is already sorted."
    }

    if (step.arrays.length > 1) {
      return "Divide: We split the array into two halves to conquer them separately."
    }

    if (step.arrays.length === 1 && step.merged[0]) {
      return "Final result: The array is now fully sorted!"
    }

    return "Merge Sort in progress..."
  }

  const maxLevel = sortingSteps[currentStep]?.level.reduce((max, level) => Math.max(max, level), 0) || 0

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Merge Sort Visualization</h1>

      <div className="flex flex-wrap justify-center gap-4 w-full">
        <Button onClick={generateRandomArray} variant="outline">
          New Array
        </Button>
        <Button onClick={resetVisualization} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button onClick={togglePlay} variant="outline">
          {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button onClick={stepForward} variant="outline" disabled={currentStep >= sortingSteps.length - 1}>
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

      {/* Add the custom input section */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Enter numbers separated by commas (e.g., 38, 27, 43, 3, 9)"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Button onClick={handleUserInput}>Sort Custom Array</Button>
        </div>
        {inputError && <p className="text-sm text-red-500">{inputError}</p>}
      </div>

      <Card className="w-full p-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-4 left-4 right-4 bg-primary/10 rounded-md p-2 text-center text-sm font-medium">
          {getStepExplanation()}
        </div>

        <div className="mt-12 mb-4 flex flex-col items-center justify-center space-y-12">
          {sortingSteps[currentStep] && (
            <div className="w-full flex flex-col items-center space-y-12">
              {Array.from({ length: maxLevel + 1 }).map((_, levelIndex) => (
                <div key={levelIndex} className="flex flex-wrap justify-center gap-8 w-full">
                  {sortingSteps[currentStep].arrays.map((subArray, arrayIndex) => {
                    if (sortingSteps[currentStep].level[arrayIndex] !== levelIndex) return null

                    const isMerging = sortingSteps[currentStep].merging[arrayIndex]
                    const isMerged = sortingSteps[currentStep].merged[arrayIndex]

                    return (
                      <motion.div
                        key={`${levelIndex}-${arrayIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-1 ${isMerging ? "ring-2 ring-yellow-400 rounded-md p-1" : ""} ${isMerged ? "ring-2 ring-green-400 rounded-md p-1" : ""}`}
                      >
                        {subArray.map((num, numIndex) => {
                          const isCompared = sortingSteps[currentStep].comparisons?.some(
                            ([compArrayIdx, compNumIdx]) => compArrayIdx === arrayIndex && compNumIdx === numIndex,
                          )

                          return (
                            <motion.div
                              key={`${levelIndex}-${arrayIndex}-${numIndex}`}
                              className={`relative flex flex-col items-center`}
                              initial={{ scale: 0.8 }}
                              animate={{
                                scale: isCompared ? 1.1 : 1,
                                y: isCompared ? -5 : 0,
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <div
                                className={`w-12 h-16 flex items-center justify-center rounded-sm border-2 
                                  ${isCompared ? "border-yellow-400 bg-yellow-100" : isMerged ? "border-green-400 bg-green-50" : "border-primary/30 bg-background"}
                                  shadow-md transform transition-all duration-300`}
                                style={{
                                  transform: `perspective(600px) rotateX(5deg)`,
                                  transformOrigin: "bottom",
                                }}
                              >
                                <BookOpen className="w-4 h-4 absolute top-1 left-1 opacity-30" />
                                <span className="text-lg font-semibold">{num}</span>
                              </div>
                              {isCompared && (
                                <div className="absolute -bottom-6 w-full text-center">
                                  <span className="text-xs font-medium text-yellow-600">Compare</span>
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (sortingSteps.length - 1)) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>
              Step {currentStep + 1} of {sortingSteps.length}
            </span>
            <span>{Math.round((currentStep / (sortingSteps.length - 1)) * 100)}% Complete</span>
          </div>
        </div>
      </Card>

      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          This visualization shows the Merge Sort algorithm in action. Merge Sort is a divide-and-conquer algorithm that
          splits the array into smaller subarrays, sorts them, and then merges them back together.
        </p>
        <p className="mt-2">
          The books represent numbers, and their height corresponds to their value. Watch as the algorithm divides the
          array and then merges the sorted pieces back together.
        </p>
      </div>
    </div>
  )
}
