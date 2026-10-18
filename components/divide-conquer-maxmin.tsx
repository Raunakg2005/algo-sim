"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { BookOpen, Play, Pause, RotateCcw, StepForward, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"

import { generateMaxMinSteps, type MaxMinSegment, type MaxMinStep } from "@/lib/engines/max-min"

type ArraySegment = MaxMinSegment
type AlgorithmStep = MaxMinStep

export default function DivideConquerMaxMin() {
  const [array, setArray] = useState<number[]>([42, 15, 87, 33, 61, 9, 75, 24])
  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [userInput, setUserInput] = useState("")
  const [inputError, setInputError] = useState("")
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const generateRandomArray = () => {
    const length = Math.floor(Math.random() * 5) + 6 
    const newArray = Array.from({ length }, () => Math.floor(Math.random() * 90) + 10) 
    setArray(newArray)
    resetVisualization()
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
    if (currentStep < steps.length - 1) {
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
      resetVisualization()
    } catch (error) {
      if (error instanceof Error) {
        setInputError(error.message)
      } else {
        setInputError("An unknown error occurred")
      }
    }
  }

  useEffect(() => {
    setSteps(generateMaxMinSteps(array))
  }, [array])

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

  const getSegmentColor = (segment: ArraySegment) => {
    if (segment.isComparing) return "border-yellow-400 bg-yellow-50"
    if (segment.isProcessing) return "border-blue-400 bg-blue-50"
    if (segment.isResult) return "border-green-400 bg-green-50"
    return "border-primary/30 bg-background"
  }

  const maxLevel = steps[currentStep]?.segments.reduce((max, segment) => Math.max(max, segment.level), 0) || 0

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Divide & Conquer: Find Max & Min</h1>

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

      {/* Custom input section */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Enter numbers separated by commas (e.g., 42, 15, 87, 33)"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Button onClick={handleUserInput}>Use Custom Array</Button>
        </div>
        {inputError && <p className="text-sm text-red-500">{inputError}</p>}
      </div>

      {/* Main visualization card */}
      <Card className="w-full p-4 bg-muted/30 relative overflow-hidden">
        {/* Step description */}
        <div className="absolute top-4 left-4 right-4 bg-primary/10 rounded-md p-2 text-center text-sm font-medium">
          {steps[currentStep]?.description || "Preparing visualization..."}
        </div>

        {/* Phase indicator */}
        {steps[currentStep]?.phase && (
          <div
            className={`absolute top-16 left-4 right-4 rounded-md p-1 text-center text-xs font-medium
            ${
              steps[currentStep]?.phase === "divide"
                ? "bg-blue-100 text-blue-800"
                : steps[currentStep]?.phase === "compare"
                  ? "bg-yellow-100 text-yellow-800"
                  : steps[currentStep]?.phase === "conquer"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-green-100 text-green-800"
            }`}
          >
            {steps[currentStep]?.phase === "divide"
              ? "Divide Phase"
              : steps[currentStep]?.phase === "compare"
                ? "Compare Phase"
                : steps[currentStep]?.phase === "conquer"
                  ? "Conquer Phase"
                  : "Result Phase"}
          </div>
        )}

        {/* Visualization area */}
        <div className="mt-24 mb-4 flex flex-col items-center justify-center space-y-12">
          {steps[currentStep] && (
            <div className="w-full flex flex-col items-center space-y-12">
              {/* Render each level of the recursion tree */}
              {Array.from({ length: maxLevel + 1 }).map((_, levelIndex) => (
                <div key={levelIndex} className="flex flex-col items-center w-full">
                  {/* Level label */}
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    {levelIndex === 0 ? "Original Array" : `Level ${levelIndex}`}
                  </div>

                  {/* Segments at this level */}
                  <div className="flex flex-wrap justify-center gap-4 w-full">
                    {steps[currentStep].segments
                      .filter((segment) => segment.level === levelIndex)
                      .sort((a, b) => a.start - b.start)
                      .map((segment, segmentIndex) => (
                        <motion.div
                          key={`${levelIndex}-${segmentIndex}-${segment.start}-${segment.end}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`relative flex flex-col items-center p-2 rounded-md ${
                            segment.isProcessing || segment.isComparing || segment.isResult
                              ? "ring-2 ring-opacity-50 " +
                                (
                                  segment.isProcessing
                                    ? "ring-blue-400"
                                    : segment.isComparing
                                      ? "ring-yellow-400"
                                      : "ring-green-400"
                                )
                              : ""
                          }`}
                        >
                          {/* Segment values */}
                          <div className="flex flex-wrap justify-center gap-1 mb-2">
                            {Array.from({ length: segment.end - segment.start + 1 }).map((_, i) => {
                              const arrayIndex = segment.start + i
                              const isComparing = segment.comparingIndices?.includes(arrayIndex)

                              return (
                                <motion.div
                                  key={`${levelIndex}-${segmentIndex}-${arrayIndex}`}
                                  className="relative"
                                  initial={{ scale: 0.8 }}
                                  animate={{
                                    scale: isComparing ? 1.1 : 1,
                                    y: isComparing ? -5 : 0,
                                  }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div
                                    className={`w-10 h-14 sm:w-12 sm:h-16 flex items-center justify-center rounded-sm border-2 
                                      ${isComparing ? "border-yellow-400 bg-yellow-100" : getSegmentColor(segment)}
                                      shadow-md transform transition-all duration-300`}
                                    style={{
                                      transform: `perspective(600px) rotateX(5deg)`,
                                      transformOrigin: "bottom",
                                    }}
                                  >
                                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 absolute top-1 left-1 opacity-30" />
                                    <span className="text-sm sm:text-lg font-semibold">{array[arrayIndex]}</span>
                                  </div>
                                  <div className="absolute -bottom-4 w-full text-center">
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">{arrayIndex}</span>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>

                          {/* Result display */}
                          {segment.isResult && (
                            <div className="mt-2 text-xs sm:text-sm flex flex-col items-center">
                              <div className="flex items-center gap-1 text-green-600">
                                <span>
                                  Max: <strong>{segment.max}</strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-blue-600">
                                <span>
                                  Min: <strong>{segment.min}</strong>
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Division arrow */}
                          {segment.level < maxLevel && !segment.isResult && (
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
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

      {/* Explanation */}
      <div className="text-sm text-muted-foreground max-w-2xl text-center">
        <p>
          This visualization demonstrates the Divide and Conquer approach to finding the maximum and minimum values in
          an array.
        </p>
        <p className="mt-2">
          The algorithm recursively divides the array into smaller subarrays until it reaches arrays of size 1 or 2,
          finds the max and min in these base cases, and then combines the results to find the global maximum and
          minimum.
        </p>
      </div>
    </div>
  )
}
