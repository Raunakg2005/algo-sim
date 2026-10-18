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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { generateInsertionSortSteps, INSERTION_SORT_CODE, type InsertionSortStep } from "@/lib/engines/insertion-sort"

type SortingStep = InsertionSortStep

const algorithmCode = INSERTION_SORT_CODE

export default function InsertionSortVisualization() {
  const [array, setArray] = useState<number[]>([])
  const [userInput, setUserInput] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [sortingSteps, setSortingSteps] = useState<SortingStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [activeView, setActiveView] = useState<string>("split")

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const generateRandomArray = () => {
    const size = Math.floor(Math.random() * 6) + 5 // 5 to 10 elements
    const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 50) + 1)
    setUserInput(newArray.join(", "))
    validateAndSetArray(newArray.join(", "))
  }

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

  const generateSortingSteps = (inputArray: number[]) => {
    setSortingSteps(generateInsertionSortSteps(inputArray))
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const stepForward = () => {
    if (currentStepIndex < sortingSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const stepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const resetAnimation = () => {
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }

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

  const currentStep = sortingSteps[currentStepIndex] || {
    array: [],
    currentIndex: 0,
    comparingIndex: null,
    sortedUpTo: -1,
    description: "",
    isSwapping: false,
    activeCodeLine: 0,
  }

  const renderAlgorithmCode = () => {
    return (
      <div className="font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 h-full overflow-auto">
        {algorithmCode.map((line, index) => (
          <div
            key={index}
            className={`py-1 px-2 rounded ${
              currentStep.activeCodeLine === index ? "bg-blue-100 border-l-4 border-blue-500" : ""
            }`}
          >
            {line}
          </div>
        ))}
      </div>
    )
  }

  const renderArrayVisualization = () => {
    return (
      <div className="flex justify-center items-end min-h-[150px] mb-4 relative">
        {currentStep.array.map((value, index) => {
         
          let bgColor = "bg-gray-200"
          let textColor = "text-gray-800"
          let borderColor = "border-gray-300"
          let zIndex = 10

          if (index <= currentStep.sortedUpTo) {
            bgColor = "bg-green-100"
            borderColor = "border-green-400"
          }

          if (index === currentStep.currentIndex) {
            bgColor = "bg-blue-100"
            borderColor = "border-blue-500"
            textColor = "text-blue-800"
            zIndex = 30
          }

          if (index === currentStep.comparingIndex) {
            bgColor = "bg-yellow-100"
            borderColor = "border-yellow-500"
            textColor = "text-yellow-800"
            zIndex = 20
          }

          if (currentStep.isSwapping && currentStep.comparingIndex !== null && index === currentStep.comparingIndex + 1) {
            bgColor = "bg-purple-100"
            borderColor = "border-purple-500"
            textColor = "text-purple-800"
          }

          const height = `${Math.max(40, (value / 50) * 120)}px`

          return (
            <motion.div
              key={`${index}-${value}`}
              className={`flex justify-center items-center m-1 border-2 ${borderColor} ${bgColor} ${textColor} rounded-md shadow-sm`}
              style={{
                width: "clamp(40px, 5vw, 60px)", 
                height,
                zIndex,
              }}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-lg font-medium">{value}</span>
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white p-4 flex justify-center">
      <Card className="w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[80%] shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Insertion Sort Visualization</h2>
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
              <Button onClick={() => validateAndSetArray(userInput)} className="bg-blue-600 hover:bg-blue-700">
                Set Array
              </Button>
              <Button
                onClick={generateRandomArray}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
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

          {/* View Selection and Visualization Area */}
          {isInitialized && (
            <Tabs value={activeView} onValueChange={setActiveView} className="mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="split">Split View</TabsTrigger>
                <TabsTrigger value="visualization">Visualization Only</TabsTrigger>
                <TabsTrigger value="code">Code Only</TabsTrigger>
              </TabsList>

              <TabsContent value="split" className="mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                    <h3 className="font-semibold text-gray-800 mb-2">Algorithm</h3>
                    {renderAlgorithmCode()}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                    <h3 className="font-semibold text-gray-800 mb-2">Visualization</h3>
                    <ScrollArea className="h-[350px]">
                      <div className="flex flex-col items-center">
                        {renderArrayVisualization()}
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
              </TabsContent>

              <TabsContent value="visualization" className="mt-4">
                <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                  <ScrollArea className="h-[350px]">
                    <div className="flex flex-col items-center">
                      {renderArrayVisualization()}
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
              </TabsContent>

              <TabsContent value="code" className="mt-4">
                <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">{renderAlgorithmCode()}</div>
              </TabsContent>
            </Tabs>
          )}

          {/* Controls */}
          {isInitialized && (
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex space-x-2">
                  <Button
                    onClick={stepBackward}
                    disabled={currentStepIndex === 0}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    aria-label="Previous step"
                  >
                    <StepBack className="h-5 w-5" />
                  </Button>

                  <Button onClick={togglePlay} variant="outline" size="icon" className="h-10 w-10" aria-label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={stepForward}
                    disabled={currentStepIndex === sortingSteps.length - 1}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    aria-label="Next step"
                  >
                    <StepForward className="h-5 w-5" />
                  </Button>

                  <Button onClick={resetAnimation} variant="outline" size="icon" className="h-10 w-10" aria-label="Reset">
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
                <h3 className="font-semibold text-gray-800 mb-2">Insertion Sort Algorithm</h3>
                <p className="text-sm text-gray-600">
                  Insertion sort builds the final sorted array one item at a time. It iterates through an array,
                  consuming one input element at each repetition, and growing a sorted output list. At each iteration,
                  insertion sort removes one element from the input data, finds the location it belongs within the
                  sorted list, and inserts it there. It repeats until no input elements remain.
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded-sm mr-1"></span>{" "}
                  Sorted portion
                  <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm ml-3 mr-1"></span>{" "}
                  Current element
                  <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-500 rounded-sm ml-3 mr-1"></span>{" "}
                  Comparing element
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
