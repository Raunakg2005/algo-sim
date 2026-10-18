"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Minus, Eye, RotateCcw, Play, Pause } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

import {
  LINEAR_QUEUE_CODE as queueCode,
  dequeue,
  enqueue,
  parseIntegerInput,
  parseQueueSize,
  peek,
  playbackAfterOperation,
  type LinearQueueResult,
  type LinearQueueState,
  type QueueStep,
} from "@/lib/engines/linear-queue"

export default function LinearQueueVisualizer() {
  const [queueSize, setQueueSize] = useState<number>(8)
  const [sizeInput, setSizeInput] = useState<string>("8")
  const [sizeError, setSizeError] = useState<string>("")
  const [queue, setQueue] = useState<(number | undefined)[]>(new Array(8).fill(undefined))
  const [front, setFront] = useState<number>(-1)
  const [rear, setRear] = useState<number>(-1)
  const [inputValue, setInputValue] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [steps, setSteps] = useState<QueueStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [activeView, setActiveView] = useState<string>("split")

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const current = (): LinearQueueState => ({ items: queue, front, rear, size: queueSize })

  // append an operation's frames to the history and show them
  const applyResult = (result: LinearQueueResult) => {
    const playback = playbackAfterOperation(steps.length, result.steps.length)
    setQueue(result.state.items)
    setFront(result.state.front)
    setRear(result.state.rear)
    setSteps([...steps, ...result.steps])
    setCurrentStepIndex(playback.index)
    setIsPlaying(playback.play)
  }

  const updateQueueSize = () => {
    const parsed = parseQueueSize(sizeInput)
    if ("error" in parsed) {
      setSizeError(parsed.error)
      return
    }
    const size = parsed.value
    setSizeError("")
    setQueueSize(size)
    setQueue(new Array(size).fill(undefined))
    setFront(-1)
    setRear(-1)
    setSteps([])
    setCurrentStepIndex(0)
    setIsPlaying(false)
  }

  const enqueueElement = () => {
    const parsed = parseIntegerInput(inputValue)
    if ("error" in parsed) {
      setInputError(parsed.error)
      return
    }
    setInputError("")
    applyResult(enqueue(current(), parsed.value))
    setInputValue("")
  }

  const dequeueElement = () => {
    applyResult(dequeue(current()))
  }

  const peekElement = () => {
    applyResult(peek(current()))
  }

  const clearQueue = () => {
    setQueue(new Array(queueSize).fill(undefined))
    setFront(-1)
    setRear(-1)
    setSteps([])
    setCurrentStepIndex(0)
    setIsPlaying(false)
    setInputError("")
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const stepForward = () => {
    if (currentStepIndex < steps.length - 1) {
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
    if (isPlaying && steps.length > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
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
  }, [isPlaying, currentStepIndex, steps, speed])

  const currentStep = steps[currentStepIndex] || {
    queue: [],
    front: -1,
    rear: -1,
    operation: "",
    element: undefined,
    description: "Perform operations to see the queue in action",
    isError: false,
    activeCodeLine: 0,
  }

  const renderQueueCode = () => {
    return (
      <div className="font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 h-full overflow-auto">
        {queueCode.map((line, index) => (
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

  const renderQueueVisualization = () => {
    const displayQueue = steps.length > 0 ? currentStep.queue : queue
    const displayFront = steps.length > 0 ? currentStep.front : front
    const displayRear = steps.length > 0 ? currentStep.rear : rear

    const queueSizeDisplay = displayFront === -1 ? 0 : displayRear - displayFront + 1

    return (
      <div className="flex flex-col items-center min-h-[300px] mb-4">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Linear Queue Visualization</h3>
          <p className="text-sm text-gray-600">
            Size: {queueSizeDisplay}/{queueSize} | Front: {displayFront === -1 ? "Empty" : displayFront} | Rear:{" "}
            {displayRear === -1 ? "Empty" : displayRear}
          </p>
        </div>

        <div className="relative w-full">
          {/* Queue container with vertical layout for split view */}
          <div className="w-full">
            <div className="flex flex-col items-center border-2 border-gray-400 bg-gray-50 p-2 rounded-lg">
              {displayQueue.map((value, index) => {
                let bgColor = "bg-white"
                let textColor = "text-gray-400"
                let borderColor = "border-gray-300"

                if (value !== undefined) {
                  bgColor = "bg-gray-100"
                  textColor = "text-gray-800"
                  borderColor = "border-gray-400"
                }

                if (index === displayFront && value !== undefined) {
                  bgColor = "bg-green-100"
                  borderColor = "border-green-500"
                  textColor = "text-green-800"
                }

                if (index === displayRear && value !== undefined) {
                  bgColor = "bg-red-100"
                  borderColor = "border-red-500"
                  textColor = "text-red-800"
                }

                if (index === displayFront && index === displayRear && value !== undefined) {
                  bgColor = "bg-purple-100"
                  borderColor = "border-purple-500"
                  textColor = "text-purple-800"
                }

                // Use consistent sizing for vertical layout
                const elementSize = "w-16 h-12 text-base"

                return (
                  <motion.div
                    key={index}
                    className={`${elementSize} m-1 border-2 ${borderColor} ${bgColor} ${textColor} rounded-md shadow-sm flex items-center justify-center font-bold relative`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <span>{value !== undefined ? value : ""}</span>
                    <div className="absolute -left-8 text-xs text-gray-500">{index}</div>
                    {/* Add arrow indicators for front and rear */}
                    {index === displayFront && value !== undefined && (
                      <div className="absolute -right-12 flex items-center">
                        <div className="w-6 h-0.5 bg-green-500"></div>
                        <span className="ml-1 text-xs font-bold text-green-600">F</span>
                      </div>
                    )}
                    {index === displayRear && value !== undefined && index !== displayFront && (
                      <div className="absolute -right-12 flex items-center">
                        <div className="w-6 h-0.5 bg-red-500"></div>
                        <span className="ml-1 text-xs font-bold text-red-600">R</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex justify-center space-x-4 text-sm">
            {displayFront !== -1 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs font-medium text-green-600">FRONT</span>
              </div>
            )}
            {displayRear !== -1 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span className="text-xs font-medium text-red-600">REAR</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const AnimationControls = () =>
    steps.length > 0 && (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
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
              <Minus className="h-5 w-5" />
            </Button>

            <Button onClick={togglePlay} variant="outline" size="icon" className="h-10 w-10" aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button
              onClick={stepForward}
              disabled={currentStepIndex === steps.length - 1}
              variant="outline"
              size="icon"
              className="h-10 w-10"
              aria-label="Next step"
            >
              <Plus className="h-5 w-5" />
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
            <span className="text-sm text-gray-500">{speed}x</span>
          </div>

          <div className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
      </div>
    )

  const VisualizationContent = () => (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
      <h3 className="font-semibold text-gray-800 mb-2">Visualization</h3>
      
        <div className="flex flex-col items-center">
          {renderQueueVisualization()}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`text-center p-3 border rounded-md shadow-sm w-full ${
                currentStep.isError ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <p>{currentStep.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      
    </div>
  )

  const CodeContent = () => (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
      <h3 className="font-semibold text-gray-800 mb-2">Queue Implementation</h3>
      {renderQueueCode()}
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-white p-4 flex justify-center">
      <Card className="w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[80%] shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Linear Queue Visualizer</h2>
            </div>
          </div>

          {/* Input and Operation Controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <Input
                placeholder="Queue size (1-20)"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                className="w-32"
              />
              <Button
                onClick={updateQueueSize}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Set Size
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="Enter a number to enqueue"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && enqueueElement()}
                className="flex-grow"
              />
              <div className="flex gap-2">
                <Button onClick={enqueueElement} className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-1 h-4 w-4" />
                  Enqueue
                </Button>
                <Button onClick={dequeueElement} className="bg-red-600 hover:bg-red-700">
                  <Minus className="mr-1 h-4 w-4" />
                  Dequeue
                </Button>
                <Button onClick={peekElement} className="bg-blue-600 hover:bg-blue-700">
                  <Eye className="mr-1 h-4 w-4" />
                  Peek
                </Button>
                <Button
                  onClick={clearQueue}
                  variant="outline"
                  className="border-gray-600 text-gray-600 hover:bg-gray-50"
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            {inputError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{inputError}</AlertDescription>
              </Alert>
            )}
            {sizeError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{sizeError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* View Selection and Visualization Area */}
          <Tabs value={activeView} onValueChange={setActiveView} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="split">Split View</TabsTrigger>
              <TabsTrigger value="visualization">Visualization Only</TabsTrigger>
              <TabsTrigger value="code">Code Only</TabsTrigger>
            </TabsList>

            <TabsContent value="split" className="mt-4">
              <AnimationControls />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CodeContent />
                <VisualizationContent />
              </div>
            </TabsContent>

            <TabsContent value="visualization" className="mt-4">
              <AnimationControls />
              <VisualizationContent />
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <AnimationControls />
              <CodeContent />
            </TabsContent>
          </Tabs>

          {/* Queue Information */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Linear Queue Operations</h3>
            <p className="text-sm text-gray-600 mb-2">
              A Linear Queue follows the First In First Out (FIFO) principle. Elements are added at the rear and removed
              from the front.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded-sm mr-1"></span>
                <strong>Enqueue:</strong> Add element to rear
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded-sm mr-1"></span>
                <strong>Dequeue:</strong> Remove element from front
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm mr-1"></span>
                <strong>Peek:</strong> View front element
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Note:</strong> In a linear queue, once elements are dequeued, that space cannot be reused, leading
              to the "false full" condition.
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
