"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Minus, Eye, RotateCcw, Play, Pause, TrendingUp, TrendingDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  PRIORITY_QUEUE_CODE as priorityQueueCode,
  dequeue,
  enqueue,
  nextPriorityLabel,
  parsePriorityQueueInput,
  peek,
  playbackAfterOperation,
  serviceOrder,
  type PriorityQueueElement,
  type PriorityQueueResult,
  type PriorityQueueState,
  type PriorityQueueStep,
} from "@/lib/engines/priority-queue"

export default function PriorityQueueVisualizer() {
  const [queue, setQueue] = useState<PriorityQueueElement[]>([])
  const [valueInput, setValueInput] = useState<string>("")
  const [priorityInput, setPriorityInput] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [steps, setSteps] = useState<PriorityQueueStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [activeView, setActiveView] = useState<string>("split")
  const [isMaxHeap, setIsMaxHeap] = useState<boolean>(true)
  const [nextId, setNextId] = useState<number>(1)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const current = (): PriorityQueueState => ({ heap: queue, isMaxHeap, nextId })

  // append an operation's frames to the history and show them
  const applyResult = (result: PriorityQueueResult) => {
    const playback = playbackAfterOperation(steps.length, result.steps.length)
    setQueue(result.state.heap)
    setNextId(result.state.nextId)
    setSteps([...steps, ...result.steps])
    setCurrentStepIndex(playback.index)
    setIsPlaying(playback.play)
  }

  const enqueueElement = () => {
    const input = parsePriorityQueueInput(valueInput, priorityInput)
    if ("error" in input) {
      setInputError(input.error)
      return
    }
    setInputError("")
    applyResult(enqueue(current(), input.value, input.priority))
    setValueInput("")
    setPriorityInput("")
  }

  const dequeueElement = () => {
    applyResult(dequeue(current()))
  }

  const peekElement = () => {
    applyResult(peek(current()))
  }

  const clearQueue = () => {
    setQueue([])
    setSteps([])
    setCurrentStepIndex(0)
    setIsPlaying(false)
    setInputError("")
    setNextId(1)
  }

  const toggleHeapType = (type: string) => {
    const newIsMaxHeap = type === "max"
    setIsMaxHeap(newIsMaxHeap)
    clearQueue()
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
    operation: "",
    element: undefined,
    description: "Perform operations to see the priority queue in action",
    isError: false,
    activeCodeLine: 0,
  }

  const renderPriorityQueueCode = () => {
    return (
      <div className="font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 h-full overflow-auto">
        {priorityQueueCode.map((line, index) => (
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

  const renderPriorityQueueVisualization = () => {
    const displayQueue = steps.length > 0 ? currentStep.queue : queue
    const isVertical = activeView === "split"

    // Elements in the order dequeue will actually remove them (equal priorities included); the heap is unchanged
    const sortedForDisplay = serviceOrder(displayQueue, isMaxHeap)

    // Calculate element size based on queue size
    const getElementSize = (queueSize: number) => {
      if (queueSize <= 5) return { width: 80, height: 60, fontSize: "text-lg" }
      if (queueSize <= 8) return { width: 70, height: 50, fontSize: "text-base" }
      if (queueSize <= 12) return { width: 60, height: 45, fontSize: "text-sm" }
      if (queueSize <= 16) return { width: 50, height: 40, fontSize: "text-sm" }
      return { width: 45, height: 35, fontSize: "text-xs" }
    }

    const elementSize = getElementSize(sortedForDisplay.length)

    return (
      <div className="flex flex-col items-center min-h-[400px] mb-4">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Priority Queue Visualization ({isMaxHeap ? "Max" : "Min"} Priority)
          </h3>
          <p className="text-sm text-gray-600">
            Size: {displayQueue.length} | Next to dequeue:{" "}
            {sortedForDisplay[0] ? `${sortedForDisplay[0].value} (P:${sortedForDisplay[0].priority})` : "None"}
          </p>
        </div>

        <div className="relative overflow-auto max-w-full">
          {sortedForDisplay.length > 0 ? (
            <div className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center justify-center gap-2 p-4`}>
              {/* Priority Queue Label */}
              <div className={`${isVertical ? "mb-4" : "mr-4"} text-center`}>
                <div className="text-sm font-semibold text-gray-700 mb-1">{isMaxHeap ? "HIGHEST" : "LOWEST"}</div>
                <div className="text-xs text-gray-500">PRIORITY</div>
                {!isVertical && (
                  <div className="mt-2">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-blue-500"></div>
                  </div>
                )}
                {isVertical && (
                  <div className="mt-2">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-blue-500"></div>
                  </div>
                )}
              </div>

              {/* Queue Elements */}
              <div className={`flex ${isVertical ? "flex-col" : "flex-row"} gap-1`}>
                {sortedForDisplay.map((element, index) => {
                  let bgColor = "bg-gray-100"
                  let borderColor = "border-gray-300"
                  let textColor = "text-gray-700"

                  // Highlight the front element (highest/lowest priority)
                  if (index === 0) {
                    bgColor = isMaxHeap ? "bg-red-100" : "bg-green-100"
                    borderColor = isMaxHeap ? "border-red-400" : "border-green-400"
                    textColor = isMaxHeap ? "text-red-700" : "text-green-700"
                  }

                  return (
                    <motion.div
                      key={element.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`
                        ${bgColor} ${borderColor} ${textColor}
                        border-2 rounded-lg flex flex-col items-center justify-center
                        shadow-sm hover:shadow-md transition-all duration-200
                        ${elementSize.fontSize}
                      `}
                      style={{
                        width: `${elementSize.width}px`,
                        height: `${elementSize.height}px`,
                        minWidth: `${elementSize.width}px`,
                        minHeight: `${elementSize.height}px`,
                      }}
                    >
                      <div className="font-bold leading-tight">{element.value}</div>
                      <div className="text-xs leading-tight opacity-75">P:{element.priority}</div>
                    </motion.div>
                  )
                })}
              </div>

              {/* End Label */}
              <div className={`${isVertical ? "mt-4" : "ml-4"} text-center`}>
                <div className="text-sm font-semibold text-gray-700 mb-1">{isMaxHeap ? "LOWEST" : "HIGHEST"}</div>
                <div className="text-xs text-gray-500">PRIORITY</div>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Priority Queue is Empty</p>
                <p className="text-gray-400 text-sm">Add elements with priorities to see the queue</p>
              </div>
            </div>
          )}

          {/* Priority Indicators */}
          {sortedForDisplay.length > 0 && (
            <div className="mt-4 flex justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${isMaxHeap ? "bg-red-400" : "bg-green-400"} rounded-full mr-2`}></div>
                <span className={`font-medium ${isMaxHeap ? "text-red-600" : "text-green-600"}`}>
                  Next to Dequeue ({isMaxHeap ? "Highest" : "Lowest"} Priority)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                <span className="text-gray-600">Other Elements</span>
              </div>
            </div>
          )}

          {/* Queue Statistics */}
          {sortedForDisplay.length > 0 && (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-700">Queue Size</div>
                  <div className="text-lg font-bold text-blue-600">{sortedForDisplay.length}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">Next Priority</div>
                  <div className="text-lg font-bold text-purple-600">{nextPriorityLabel(displayQueue)}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">Priority Range</div>
                  <div className="text-lg font-bold text-orange-600">
                    {sortedForDisplay.length > 0
                      ? `${Math.min(...sortedForDisplay.map((e) => e.priority))} - ${Math.max(...sortedForDisplay.map((e) => e.priority))}`
                      : "N/A"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-700">Queue Type</div>
                  <div className="text-lg font-bold text-green-600">{isMaxHeap ? "Max" : "Min"}</div>
                </div>
              </div>
            </div>
          )}
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
          {renderPriorityQueueVisualization()}
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
      <h3 className="font-semibold text-gray-800 mb-2">Priority Queue Implementation</h3>
      {renderPriorityQueueCode()}
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-white p-4 flex justify-center">
      <Card className="w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[80%] shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Priority Queue Visualizer</h2>
            </div>
          </div>

          {/* Input and Operation Controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <Select value={isMaxHeap ? "max" : "min"} onValueChange={toggleHeapType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="max">
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Max Heap
                    </div>
                  </SelectItem>
                  <SelectItem value="min">
                    <div className="flex items-center">
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Min Heap
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="Enter value"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                className="flex-grow"
              />
              <Input
                placeholder="Enter priority"
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
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

          {/* Priority Queue Information */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Priority Queue Operations</h3>
            <p className="text-sm text-gray-600 mb-2">
              A Priority Queue is a queue where elements are served based on their priority rather than their insertion
              order. Elements with higher priority (Max Heap) or lower priority (Min Heap) are dequeued first.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded-sm mr-1"></span>
                <strong>Enqueue:</strong> Add element with priority, maintains internal heap order
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded-sm mr-1"></span>
                <strong>Dequeue:</strong> Remove element with highest/lowest priority
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm mr-1"></span>
                <strong>Peek:</strong> View next element to be dequeued
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-purple-100 border border-purple-500 rounded-sm mr-1"></span>
                <strong>Queue Order:</strong> Elements displayed by priority, not insertion order
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Use Cases:</strong> Task scheduling, Emergency room triage, CPU process scheduling, Dijkstra's
              algorithm, A* pathfinding!
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
