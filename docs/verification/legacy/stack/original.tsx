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

interface StackStep {
  stack: number[]
  operation: string
  element?: number
  description: string
  isError: boolean
  activeCodeLine: number
}

const stackCode = [
  "class Stack {",
  "  constructor() {",
  "    this.items = [];",
  "    this.top = -1;",
  "  }",
  "",
  "  push(element) {",
  "    this.top++;",
  "    this.items[this.top] = element;",
  "  }",
  "",
  "  pop() {",
  "    if (this.isEmpty()) return null;",
  "    const element = this.items[this.top];",
  "    this.top--;",
  "    return element;",
  "  }",
  "",
  "  peek() {",
  "    if (this.isEmpty()) return null;",
  "    return this.items[this.top];",
  "  }",
  "",
  "  isEmpty() {",
  "    return this.top === -1;",
  "  }",
  "}",
]

export default function StackOperationsVisualizer() {
  const [stack, setStack] = useState<number[]>([])
  const [inputValue, setInputValue] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [steps, setSteps] = useState<StackStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [activeView, setActiveView] = useState<string>("split")
  const [maxSize] = useState<number>(10)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const addStep = (
    newStack: number[],
    operation: string,
    element: number | undefined,
    description: string,
    isError = false,
    activeCodeLine = 0,
  ) => {
    const newStep: StackStep = {
      stack: [...newStack],
      operation,
      element,
      description,
      isError,
      activeCodeLine,
    }
    setSteps((prev) => [...prev, newStep])
  }

  const validateInput = (value: string): number | null => {
    const trimmed = value.trim()
    if (!trimmed) {
      setInputError("Please enter a number")
      return null
    }
    const num = Number.parseInt(trimmed, 10)
    if (isNaN(num)) {
      setInputError("Please enter a valid number")
      return null
    }
    setInputError("")
    return num
  }

  const pushElement = () => {
    const element = validateInput(inputValue)
    if (element === null) return

    if (stack.length >= maxSize) {
      addStep(stack, "push", element, `Cannot push ${element}. Stack is full (max size: ${maxSize})`, true, 7)
      setInputValue("")
      return
    }

    const newStack = [...stack, element]
    setStack(newStack)
    addStep(newStack, "push", element, `Pushed ${element} onto the stack. Stack size: ${newStack.length}`, false, 7)
    setInputValue("")
  }

  const popElement = () => {
    if (stack.length === 0) {
      addStep(stack, "pop", undefined, "Cannot pop from empty stack", true, 12)
      return
    }

    const poppedElement = stack[stack.length - 1]
    const newStack = stack.slice(0, -1)
    setStack(newStack)
    addStep(
      newStack,
      "pop",
      poppedElement,
      `Popped ${poppedElement} from the stack. Stack size: ${newStack.length}`,
      false,
      12,
    )
    // Don't set the input value - just leave it empty or as is
  }

  const peekElement = () => {
    if (stack.length === 0) {
      addStep(stack, "peek", undefined, "Cannot peek empty stack", true, 19)
      return
    }

    const topElement = stack[stack.length - 1]
    addStep(stack, "peek", topElement, `Top element is ${topElement}. Stack size: ${stack.length}`, false, 19)
    // Don't modify input field for peek operation
  }

  const clearStack = () => {
    setStack([])
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
    stack: [],
    operation: "",
    element: undefined,
    description: "Perform operations to see the stack in action",
    isError: false,
    activeCodeLine: 0,
  }

  const renderStackCode = () => {
    return (
      <div className="font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 h-full overflow-auto">
        {stackCode.map((line, index) => (
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

  const renderStackVisualization = () => {
    const displayStack = steps.length > 0 ? currentStep.stack : stack

    return (
      <div className="flex flex-col items-center min-h-[300px] mb-4">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Stack Visualization</h3>
          <p className="text-sm text-gray-600">
            Size: {displayStack.length}/{maxSize} | Top:{" "}
            {displayStack.length > 0 ? displayStack[displayStack.length - 1] : "Empty"}
          </p>
        </div>

        <div className="relative">
          {/* Stack container */}
          <div className="flex flex-col-reverse items-center min-h-[200px] border-l-4 border-r-4 border-b-4 border-gray-400 bg-gray-50 px-4 pb-2 rounded-b-lg">
            <AnimatePresence>
              {displayStack.map((value, index) => (
                <motion.div
                  key={`${index}-${value}`}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className={`w-20 h-12 m-1 border-2 rounded-md shadow-sm flex items-center justify-center font-bold text-lg ${
                    index === displayStack.length - 1
                      ? "bg-blue-100 border-blue-500 text-blue-800"
                      : "bg-white border-gray-300 text-gray-800"
                  }`}
                  style={{ zIndex: displayStack.length - index }}
                >
                  {value}
                </motion.div>
              ))}
            </AnimatePresence>

            {displayStack.length === 0 && (
              <div className="text-gray-400 text-center py-8">
                <p>Stack is empty</p>
                <p className="text-sm">Push elements to see them here</p>
              </div>
            )}
          </div>

          {/* Top indicator */}
          {displayStack.length > 0 && (
            <div className="absolute -right-16 top-2 flex items-center">
              <div className="w-8 h-0.5 bg-red-500"></div>
              <span className="ml-2 text-sm font-medium text-red-600">TOP</span>
            </div>
          )}
        </div>
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
              <h2 className="text-2xl font-bold text-gray-800">Stack Operations Visualizer</h2>
            </div>
          </div>

          {/* Input and Operation Controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="Enter a number to push"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && pushElement()}
                className="flex-grow"
              />
              <div className="flex gap-2">
                <Button onClick={pushElement} className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-1 h-4 w-4" />
                  Push
                </Button>
                <Button onClick={popElement} className="bg-red-600 hover:bg-red-700">
                  <Minus className="mr-1 h-4 w-4" />
                  Pop
                </Button>
                <Button onClick={peekElement} className="bg-blue-600 hover:bg-blue-700">
                  <Eye className="mr-1 h-4 w-4" />
                  Peek
                </Button>
                <Button
                  onClick={clearStack}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                  <h3 className="font-semibold text-gray-800 mb-2">Stack Implementation</h3>
                  {renderStackCode()}
                </div>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                  <h3 className="font-semibold text-gray-800 mb-2">Visualization</h3>
                  <ScrollArea className="h-[350px]">
                    <div className="flex flex-col items-center">
                      {renderStackVisualization()}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentStepIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className={`text-center p-3 border rounded-md shadow-sm w-full ${
                            currentStep.isError
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "bg-white border-gray-200 text-gray-700"
                          }`}
                        >
                          <p>{currentStep.description}</p>
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
                    {renderStackVisualization()}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStepIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className={`text-center p-3 border rounded-md shadow-sm w-full ${
                          currentStep.isError
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-white border-gray-200 text-gray-700"
                        }`}
                      >
                        <p>{currentStep.description}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">{renderStackCode()}</div>
            </TabsContent>
          </Tabs>

          {/* Animation Controls */}
          {steps.length > 0 && (
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex space-x-2">
                  <Button
                    onClick={stepBackward}
                    disabled={currentStepIndex === 0}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>

                  <Button onClick={togglePlay} variant="outline" size="icon" className="h-10 w-10">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={stepForward}
                    disabled={currentStepIndex === steps.length - 1}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Plus className="h-5 w-5" />
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
                  Step {currentStepIndex + 1} of {steps.length}
                </div>
              </div>
            </div>
          )}

          {/* Stack Information */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Stack Operations</h3>
            <p className="text-sm text-gray-600 mb-2">
              A stack follows the Last In First Out (LIFO) principle. Elements are added and removed from the top only.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded-sm mr-1"></span>
                <strong>Push:</strong> Add element to top
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded-sm mr-1"></span>
                <strong>Pop:</strong> Remove top element
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm mr-1"></span>
                <strong>Peek:</strong> View top element
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
