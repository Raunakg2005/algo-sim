"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Minus, Eye, RotateCcw, Play, Pause } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

import {
  CIRCULAR_QUEUE_CODE as circularQueueCode,
  dequeue,
  enqueue,
  isValidCircularQueueSize,
  parseIntegerInput,
  peek,
  playbackAfterOperation,
  type CircularQueueResult,
  type CircularQueueState,
  type CircularQueueStep,
} from "@/lib/engines/circular-queue"

export default function CircularQueueVisualizer() {
  const [queueSize, setQueueSize] = useState<number>(8)
  const [queue, setQueue] = useState<(number | undefined)[]>(new Array(8).fill(undefined))
  const [front, setFront] = useState<number>(-1)
  const [rear, setRear] = useState<number>(-1)
  const [count, setCount] = useState<number>(0)
  const [inputValue, setInputValue] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [steps, setSteps] = useState<CircularQueueStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [activeView, setActiveView] = useState<string>("split")
  const [maxSize] = useState<number>(8)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setQueue(new Array(queueSize).fill(undefined))
    setFront(-1)
    setRear(-1)
    setCount(0)
    setSteps([])
    setCurrentStepIndex(0)
  }, [queueSize])

  const updateQueueSize = (newSize: number) => {
    // non-integers such as 2.5 used to reach new Array(2.5) and crash the page
    if (isValidCircularQueueSize(newSize)) {
      setQueueSize(newSize)
    }
  }

  const current = (): CircularQueueState => ({ items: queue, front, rear, count, size: queueSize })

  // append an operation's frames to the history and show them
  const applyResult = (result: CircularQueueResult) => {
    const playback = playbackAfterOperation(steps.length, result.steps.length)
    setQueue(result.state.items)
    setFront(result.state.front)
    setRear(result.state.rear)
    setCount(result.state.count)
    setSteps([...steps, ...result.steps])
    setCurrentStepIndex(playback.index)
    setIsPlaying(playback.play)
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
    setCount(0)
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
    description: "Perform operations to see the circular queue in action",
    isError: false,
    activeCodeLine: 0,
  }

  const renderCircularQueueCode = () => {
    return (
      <div className="font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 h-full overflow-auto">
        {circularQueueCode.map((line, index) => (
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

  const renderCircularQueueVisualization = () => {
    const displayQueue = steps.length > 0 ? currentStep.queue : queue
    const displayFront = steps.length > 0 ? currentStep.front : front
    const displayRear = steps.length > 0 ? currentStep.rear : rear
    const displayCount =
      steps.length > 0 ? (displayFront === -1 ? 0 : displayQueue.filter((x) => x !== undefined).length) : count

    // Calculate positions for circular layout
    const centerX = 150
    const centerY = 150
    const radius = Math.min(70, 1200 / queueSize)
    const angleStep = (2 * Math.PI) / queueSize

    return (
      <div className="flex flex-col items-center min-h-[400px] mb-4">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Circular Queue Visualization</h3>
          <p className="text-sm text-gray-600">
            Size: {displayCount}/{queueSize} | Front: {displayFront === -1 ? "Empty" : displayFront} | Rear:{" "}
            {displayRear === -1 ? "Empty" : displayRear}
          </p>
        </div>

        <div className="relative overflow-x-auto">
          {/* Circular Queue SVG */}
          <svg width="300" height="300" className="border rounded-lg bg-gray-50">
            {/* Draw circle outline */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#d1d5db"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Draw queue elements */}
            {displayQueue.map((value, index) => {
              const angle = index * angleStep - Math.PI / 2 // Start from top
              const x = centerX + radius * Math.cos(angle)
              const y = centerY + radius * Math.sin(angle)

              let fillColor = "#f9fafb"
              let strokeColor = "#d1d5db"
              let textColor = "#9ca3af"

              if (value !== undefined) {
                fillColor = "#f3f4f6"
                strokeColor = "#6b7280"
                textColor = "#374151"
              }

              if (index === displayFront && value !== undefined) {
                fillColor = "#dcfce7"
                strokeColor = "#16a34a"
                textColor = "#166534"
              }

              if (index === displayRear && value !== undefined) {
                fillColor = "#fecaca"
                strokeColor = "#dc2626"
                textColor = "#991b1b"
              }

              if (index === displayFront && index === displayRear && value !== undefined) {
                fillColor = "#e9d5ff"
                strokeColor = "#9333ea"
                textColor = "#6b21a8"
              }

              return (
                <g key={index}>
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="20"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  />
                  <text x={x} y={y + 5} textAnchor="middle" className="text-sm font-bold" fill={textColor}>
                    {value !== undefined ? value : ""}
                  </text>
                  <text x={x} y={y - 35} textAnchor="middle" className="text-xs" fill="#6b7280">
                    {index}
                  </text>
                </g>
              )
            })}

            {/* Draw arrows for front and rear */}
            {displayFront !== -1 && (
              <g>
                {(() => {
                  const angle = displayFront * angleStep - Math.PI / 2
                  const x = centerX + (radius - 40) * Math.cos(angle)
                  const y = centerY + (radius - 40) * Math.sin(angle)
                  return (
                    <>
                      <line
                        x1={x}
                        y1={y}
                        x2={centerX + (radius - 25) * Math.cos(angle)}
                        y2={centerY + (radius - 25) * Math.sin(angle)}
                        stroke="#16a34a"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead-green)"
                      />
                      <text x={x - 10} y={y - 5} className="text-xs font-bold" fill="#16a34a">
                        F
                      </text>
                    </>
                  )
                })()}
              </g>
            )}

            {displayRear !== -1 && displayRear !== displayFront && (
              <g>
                {(() => {
                  const angle = displayRear * angleStep - Math.PI / 2
                  const x = centerX + (radius + 40) * Math.cos(angle)
                  const y = centerY + (radius + 40) * Math.sin(angle)
                  return (
                    <>
                      <line
                        x1={x}
                        y1={y}
                        x2={centerX + (radius + 25) * Math.cos(angle)}
                        y2={centerY + (radius + 25) * Math.sin(angle)}
                        stroke="#dc2626"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead-red)"
                      />
                      <text x={x - 5} y={y + 15} className="text-xs font-bold" fill="#dc2626">
                        R
                      </text>
                    </>
                  )
                })()}
              </g>
            )}

            {/* Arrow markers */}
            <defs>
              <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#16a34a" />
              </marker>
              <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#dc2626" />
              </marker>
            </defs>
          </svg>

          {/* Legend */}
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            {displayFront !== -1 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="font-medium text-green-600">FRONT</span>
              </div>
            )}
            {displayRear !== -1 && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="font-medium text-red-600">REAR</span>
              </div>
            )}
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
              <span className="text-gray-600">Empty</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderAnimationControls = () =>
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
            <span className="text-sm text-gray-500">Speed: {speed}x</span>
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
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
      </div>
    )

  const renderStepDescription = () => (
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
  )

  return (
    <div className="w-full min-h-screen bg-white p-4 flex justify-center">
      <Card className="w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[80%] shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Circular Queue Visualizer</h2>
            </div>
          </div>

          {/* Input and Operation Controls */}
          <div className="mb-6">
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

            <div className="flex items-center space-x-2 mb-4">
              <label htmlFor="queueSize" className="text-sm font-medium text-gray-700">
                Queue Size:
              </label>
              <Input
                type="number"
                id="queueSize"
                value={queueSize}
                onChange={(e) => updateQueueSize(Number(e.target.value))}
                className="w-20 text-sm"
                min="2"
                max="12"
              />
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
              {renderAnimationControls()}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                  <h3 className="font-semibold text-gray-800 mb-2">Circular Queue Implementation</h3>
                  {renderCircularQueueCode()}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[550px]">
                  <h3 className="font-semibold text-gray-800 mb-2">Visualization</h3>
                  <ScrollArea className="h-[500px]">
                    <div className="flex flex-col items-center">
                      {renderCircularQueueVisualization()}
                      {renderStepDescription()}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="visualization" className="mt-4">
              {renderAnimationControls()}
              <div className="bg-gray-50 rounded-lg p-4 min-h-[550px]">
                <h3 className="font-semibold text-gray-800 mb-2">Visualization</h3>
                <ScrollArea className="h-[500px]">
                  <div className="flex flex-col items-center">
                    {renderCircularQueueVisualization()}
                    {renderStepDescription()}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              {renderAnimationControls()}
              <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                <h3 className="font-semibold text-gray-800 mb-2">Circular Queue Implementation</h3>
                {renderCircularQueueCode()}
              </div>
            </TabsContent>
          </Tabs>

          {/* Circular Queue Information */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Circular Queue Operations</h3>
            <p className="text-sm text-gray-600 mb-2">
              A Circular Queue solves the memory wastage problem of linear queues by connecting the end back to the
              beginning.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded-sm mr-1"></span>
                <strong>Enqueue:</strong> Add element using modulo arithmetic
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded-sm mr-1"></span>
                <strong>Dequeue:</strong> Remove element and move front circularly
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm mr-1"></span>
                <strong>Peek:</strong> View front element
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Key Advantage:</strong> Efficient space utilization - no memory wastage like linear queues!
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
