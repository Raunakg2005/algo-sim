"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import BookElement from "./book-element"

import { generateQuickSortSteps, type QuickSortStep } from "@/lib/engines/quick-sort"

type SortingStep = QuickSortStep

export default function QuickSortVisualization() {
  const [array, setArray] = useState<number[]>([8, 3, 5, 4, 7, 6, 1, 2])
  const [userInput, setUserInput] = useState("")
  const [inputError, setInputError] = useState("")
  const [steps, setSteps] = useState<SortingStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1500) 
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateRandomArray = () => {
    const size = 8
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

      if (inputArray.length > 10) {
        setInputError("Please enter at most 10 numbers for better visibility")
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

  useEffect(() => {
    const newSteps = generateQuickSortSteps(array)
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

      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleUserInputSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="array-input" className="text-sm font-medium">
              Enter numbers to sort (1-9, separated by commas):
            </Label>
            <div className="flex gap-2">
              <Input
                id="array-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., 8, 3, 5, 4, 7, 6, 1, 2"
                className="flex-1"
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

      <div className="w-full bg-white rounded-lg shadow-md p-8 relative overflow-hidden">
        {/* Table surface with wood texture */}
        <div className="absolute inset-0 bg-amber-50 opacity-50"></div>

        {/* Visualization area */}
        <div className="relative z-10">
          {/* Description overlay */}
          <div className="bg-white/90 p-3 rounded-md shadow-sm mb-8 border border-amber-200">
            <p className="text-lg font-medium text-stone-700">{currentStep?.description}</p>
          </div>

          {/* Books visualization */}
          <div className="flex justify-center items-end h-64 mb-12 relative">
            {currentStep?.array.map((value, index) => {
              const isPivot = index === currentStep.pivotIndex
              const isLeftPointer = index === currentStep.leftPointer
              const isRightPointer = index === currentStep.rightPointer
              const isSwapping = currentStep.swapping?.includes(index)
              const isInActiveSubArray =
                currentStep.activeSubArray &&
                index >= currentStep.activeSubArray.start &&
                index <= currentStep.activeSubArray.end

              return (
                <BookElement
                  key={`${index}-${value}-${currentStepIndex}`}
                  value={value}
                  index={index}
                  isPivot={isPivot}
                  isLeftPointer={isLeftPointer}
                  isRightPointer={isRightPointer}
                  isSwapping={isSwapping}
                  isActive={isInActiveSubArray}
                />
              )
            })}
          </div>

          {/* Subarray indicators */}
          <div className="relative h-12 mb-4">
            {currentStep?.subArrays?.map((subArray, idx) => {
              const isActive =
                currentStep.activeSubArray &&
                subArray.start === currentStep.activeSubArray.start &&
                subArray.end === currentStep.activeSubArray.end

              const elementWidth = 60 
              const width = (subArray.end - subArray.start + 1) * elementWidth
              const left = subArray.start * elementWidth + elementWidth / 2 - 10 

              return (
                <div key={idx} className="absolute flex flex-col items-center">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      isActive ? "bg-amber-500" : "bg-stone-300",
                    )}
                    style={{
                      width: `${width}px`,
                      left: `${left}px`,
                      bottom: isActive ? "24px" : `${24 + idx * 6}px`,
                    }}
                  ></div>
                  {isActive && (
                    <div
                      className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded"
                      style={{
                        left: `${left + width / 2 - 30}px`,
                        bottom: "0px",
                        position: "absolute",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Subarray [{subArray.start}...{subArray.end}]
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-amber-500 rounded-full mr-2"></div>
              <span>Pivot Element</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
              <span>Left Pointer (i)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
              <span>Right Pointer (j)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={resetVisualization}
          className="bg-white"
          title="Reset to first step"
          aria-label="Reset"
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
          aria-label="Previous step"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          className="bg-white"
          title={isPlaying ? "Pause" : "Play"}
          aria-label={isPlaying ? "Pause" : "Play"}
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
          aria-label="Next step"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600">Speed:</span>
          <input
            type="range"
            min="500"
            max="3000"
            step="100"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="w-24"
            title={`${playbackSpeed}ms between steps`}
          />
        </div>

        <div className="text-sm text-stone-600 bg-white px-3 py-1 rounded-full shadow-sm">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
      </div>
    </div>
  )
}
