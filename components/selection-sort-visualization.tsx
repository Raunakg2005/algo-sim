"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Play, Pause, RotateCcw, StepForward, StepBack } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define the types for our sorting steps
interface SortingStep {
  array: number[]
  currentIndex: number
  minIndex: number
  comparingIndex: number | null
  sortedUpTo: number
  description: string
  isSwapping: boolean
}

export default function SelectionSortVisualization() {
  const [array, setArray] = useState<number[]>([])
  const [userInput, setUserInput] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [sortingSteps, setSortingSteps] = useState<SortingStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Generate a random array
  const generateRandomArray = () => {
    const size = Math.floor(Math.random() * 6) + 5 // 5 to 10 elements
    const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 50) + 1)
    setUserInput(newArray.join(", "))
    validateAndSetArray(newArray.join(", "))
  }

  // Validate user input and set the array
  const validateAndSetArray = (input: string) => {
    const trimmedInput = input.trim()
    if (!trimmedInput) {
      setInputError("Please enter numbers separated by commas.")
      return
    }

    const numbers = trimmedInput.split(",").map((num) => Number.parseFloat(num.trim()))

    if (numbers.some(isNaN)) {
      setInputError("Please enter valid numbers separated by commas.")
      return
    }

    setInputError("")
    setArray(numbers)
    setIsInitialized(true)
    generateSortingSteps(numbers)
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }

  // Generate all steps for the selection sort algorithm
  const generateSortingSteps = (inputArray: number[]) => {
    const steps: SortingStep[] = []
    const arr = [...inputArray]

    // Initial state
    steps.push({
      array: [...arr],
      currentIndex: 0,
      minIndex: 0,
      comparingIndex: null,
      sortedUpTo: -1,
      description: "Starting Selection Sort. We'll find the minimum element and place it at the beginning.",
      isSwapping: false,
    })

    // Selection sort algorithm
    for (let i = 0; i < arr.length - 1; i++) {
      let minIndex = i

      // Start looking for minimum
      steps.push({
        array: [...arr],
        currentIndex: i,
        minIndex: minIndex,
        comparingIndex: null,
        sortedUpTo: i - 1,
        description: `Looking for the minimum element in the unsorted portion starting at index ${i}.`,
        isSwapping: false,
      })

      // Find the minimum element
      for (let j = i + 1; j < arr.length; j++) {
        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex: minIndex,
          comparingIndex: j,
          sortedUpTo: i - 1,
          description: `Comparing ${arr[j]} with current minimum ${arr[minIndex]}.`,
          isSwapping: false,
        })

        if (arr[j] < arr[minIndex]) {
          minIndex = j

          steps.push({
            array: [...arr],
            currentIndex: i,
            minIndex: minIndex,
            comparingIndex: null,
            sortedUpTo: i - 1,
            description: `Found a new minimum: ${arr[minIndex]} at index ${minIndex}.`,
            isSwapping: false,
          })
        }
      }

      // Swap if needed
      if (minIndex !== i) {
        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex: minIndex,
          comparingIndex: null,
          sortedUpTo: i - 1,
          description: `Swapping ${arr[i]} with the minimum value ${arr[minIndex]}.`,
          isSwapping: true,
        })

        // Perform the swap
        ;[arr[i], arr[minIndex]] = [arr[minIndex], arr[i]]

        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex: i,
          comparingIndex: null,
          sortedUpTo: i,
          description: `Placed ${arr[i]} at position ${i}. This element is now in its correct sorted position.`,
          isSwapping: false,
        })
      } else {
        steps.push({
          array: [...arr],
          currentIndex: i,
          minIndex: i,
          comparingIndex: null,
          sortedUpTo: i,
          description: `${arr[i]} is already the minimum, so it stays at position ${i}.`,
          isSwapping: false,
        })
      }
    }

    // Final state
    steps.push({
      array: [...arr],
      currentIndex: arr.length - 1,
      minIndex: arr.length - 1,
      comparingIndex: null,
      sortedUpTo: arr.length - 1,
      description: "Array is now sorted using Selection Sort!",
      isSwapping: false,
    })

    setSortingSteps(steps)
  }

  // Handle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  // Step forward in the animation
  const stepForward = () => {
    if (currentStepIndex < sortingSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  // Step backward in the animation
  const stepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  // Reset the animation
  const resetAnimation = () => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        if (currentStepIndex < sortingSteps.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1)
        } else {
          setIsPlaying(false)
        }
      }, 2000 / speed)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isPlaying, currentStepIndex, sortingSteps, speed])

  // Get the current step
  const currentStep = sortingSteps[currentStepIndex] || {
    array: [],
    currentIndex: 0,
    minIndex: 0,
    comparingIndex: null,
    sortedUpTo: -1,
    description: "",
    isSwapping: false,
  }

  return (
    <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BookOpen className="mr-2 h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Selection Sort Visualization</h2>
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <Input
            placeholder="Enter numbers separated by commas (e.g., 5, 3, 8, 1, 2)"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={() => validateAndSetArray(userInput)} className="bg-purple-600 hover:bg-purple-700">
            Set Array
          </Button>
          <Button
            onClick={generateRandomArray}
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            Random Array
          </Button>
        </div>

        {inputError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{inputError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Visualization Area */}
      {isInitialized && (
        <div className="mb-6">
          <div className="relative h-64 bg-gray-50 rounded-lg p-4 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col items-center">
                {/* Array Visualization */}
                <div className="flex justify-center items-end h-32 mb-4 relative">
                  {currentStep.array.map((value, index) => {
                    // Determine the color based on the current state
                    let bgColor = "bg-gray-200"
                    let textColor = "text-gray-800"
                    let borderColor = "border-gray-300"
                    let zIndex = 10

                    // Element is in the sorted portion
                    if (index <= currentStep.sortedUpTo) {
                      bgColor = "bg-green-100"
                      borderColor = "border-green-400"
                    }

                    // Current position being filled
                    if (index === currentStep.currentIndex) {
                      bgColor = "bg-purple-100"
                      borderColor = "border-purple-500"
                      textColor = "text-purple-800"
                      zIndex = 20
                    }

                    // Current minimum element
                    if (index === currentStep.minIndex && index !== currentStep.currentIndex) {
                      bgColor = "bg-blue-100"
                      borderColor = "border-blue-500"
                      textColor = "text-blue-800"
                      zIndex = 30
                    }

                    // Element being compared with
                    if (index === currentStep.comparingIndex) {
                      bgColor = "bg-yellow-100"
                      borderColor = "border-yellow-500"
                      textColor = "text-yellow-800"
                      zIndex = 25
                    }

                    // Element is being swapped
                    if (
                      currentStep.isSwapping &&
                      (index === currentStep.currentIndex || index === currentStep.minIndex)
                    ) {
                      bgColor = "bg-red-100"
                      borderColor = "border-red-500"
                      textColor = "text-red-800"
                    }

                    const height = `${Math.max(30, (value / 50) * 100)}px`

                    return (
                      <motion.div
                        key={`${index}-${value}`}
                        className={`flex justify-center items-center m-1 border-2 ${borderColor} ${bgColor} ${textColor} rounded-md shadow-sm`}
                        style={{
                          width: "40px",
                          height,
                          zIndex,
                        }}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {value}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Step Description */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center p-3 bg-white border border-gray-200 rounded-md shadow-sm w-full"
                  >
                    <p className="text-gray-700">{currentStep.description}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Controls */}
      {isInitialized && (
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                onClick={stepBackward}
                disabled={currentStepIndex === 0}
                variant="outline"
                size="icon"
                className="h-10 w-10"
              >
                <StepBack className="h-5 w-5" />
              </Button>

              <Button onClick={togglePlay} variant="outline" size="icon" className="h-10 w-10">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button
                onClick={stepForward}
                disabled={currentStepIndex === sortingSteps.length - 1}
                variant="outline"
                size="icon"
                className="h-10 w-10"
              >
                <StepForward className="h-5 w-5" />
              </Button>

              <Button onClick={resetAnimation} variant="outline" size="icon" className="h-10 w-10">
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Speed:</span>
              <Slider
                value={[speed]}
                min={0.5}
                max={3}
                step={0.5}
                onValueChange={(value) => setSpeed(value[0])}
                className="w-24"
              />
            </div>

            <div className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {sortingSteps.length}
            </div>
          </div>

          {/* Algorithm Explanation */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Selection Sort Algorithm</h3>
            <p className="text-sm text-gray-600">
              Selection sort works by dividing the input list into two parts: a sorted sublist of items which is built
              up from left to right, and a sublist of the remaining unsorted items. Initially, the sorted sublist is
              empty and the unsorted sublist is the entire input list. The algorithm proceeds by finding the smallest
              element in the unsorted sublist, swapping it with the leftmost unsorted element, and moving the sublist
              boundaries one element to the right.
            </p>
            <div className="mt-2 text-sm text-gray-600">
              <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded-sm mr-1"></span> Sorted
              portion
              <span className="inline-block w-3 h-3 bg-purple-100 border border-purple-500 rounded-sm ml-3 mr-1"></span>{" "}
              Current position
              <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm ml-3 mr-1"></span>{" "}
              Current minimum
              <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-500 rounded-sm ml-3 mr-1"></span>{" "}
              Comparing element
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

