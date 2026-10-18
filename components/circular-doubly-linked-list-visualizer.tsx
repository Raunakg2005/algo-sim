"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Minus, RotateCcw, Play, Pause, Search, ArrowRight, ArrowLeft, RotateCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import * as ll from "@/lib/engines/circular-doubly-linked-list"
import { circularDoublyLinkedListCode, type CircularDoublyListNode, type CircularDoublyLinkedListStep, type CircularDoublyListState } from "@/lib/engines/circular-doubly-linked-list"
import { playbackAfterOperation } from "@/lib/engines/stack"

export default function CircularDoublyLinkedListVisualizer() {
  const [list, setList] = useState<CircularDoublyListState>(ll.EMPTY_CIRCULAR_DOUBLY_LIST)
  const { nodes, head, tail } = list
  const [inputValue, setInputValue] = useState<string>("")
  const [positionInput, setPositionInput] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [steps, setSteps] = useState<CircularDoublyLinkedListStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [activeView, setActiveView] = useState<string>("split")
  const [operation, setOperation] = useState<string>("insertEnd")

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Every operation is computed by the pure engine (lib/engines); the component only stores the result.
  const run = (result: ll.OpResult<CircularDoublyListState, CircularDoublyLinkedListStep>): boolean => {
    // show the new operation's frames instead of leaving the view on an older state
    const playback = playbackAfterOperation(steps.length, result.steps.length)
    setList(result.state)
    setSteps((prev) => [...prev, ...result.steps])
    setCurrentStepIndex(playback.index)
    setIsPlaying(playback.play)
    return result.ok
  }

  const readValue = (): number | null => {
    const parsed = ll.parseValueInput(inputValue)
    setInputError(parsed.ok ? "" : parsed.error)
    return parsed.ok ? parsed.value : null
  }

  const readPosition = (): number | null => {
    const parsed = ll.parsePositionInput(positionInput)
    setInputError(parsed.ok ? "" : parsed.error)
    return parsed.ok ? parsed.value : null
  }

  const insertAtBeginning = () => {
    const value = readValue()
    if (value === null) return
    run(ll.insertAtBeginning(list, value))
    setInputValue("")
  }

  const insertAtEnd = () => {
    const value = readValue()
    if (value === null) return
    run(ll.insertAtEnd(list, value))
    setInputValue("")
  }

  const insertAtPosition = () => {
    // the value is validated first, so a valid position no longer hides the value's error message
    const value = readValue()
    if (value === null) return
    const position = readPosition()
    if (position === null) return
    if (run(ll.insertAtPosition(list, value, position))) {
      setInputValue("")
      setPositionInput("")
    }
  }

  const deleteFromBeginning = () => {
    run(ll.deleteFromBeginning(list))
  }

  const deleteFromEnd = () => {
    run(ll.deleteFromEnd(list))
  }

  const deleteAtPosition = () => {
    const parsed = ll.parseDeletePositionInput(positionInput)
    if (!parsed.ok) {
      setInputError(parsed.error)
      return
    }
    const result = ll.deleteAtPosition(list, parsed.value)
    setInputError(result.inputError ?? "")
    if (run(result)) setPositionInput("")
  }

  const searchElement = () => {
    const value = readValue()
    if (value === null) return
    run(ll.search(list, value))
    setInputValue("")
  }

  const traverseForward = () => {
    run(ll.traverseForward(list))
  }

  const traverseBackward = () => {
    run(ll.traverseBackward(list))
  }

  const clearList = () => {
    setList(ll.EMPTY_CIRCULAR_DOUBLY_LIST)
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
    nodes: [],
    head: null,
    tail: null,
    operation: "",
    element: undefined,
    position: undefined,
    description: "Perform operations to see the circular doubly linked list in action",
    isError: false,
    activeCodeLine: 0,
    highlightedNodes: [],
  }

  const renderCircularDoublyLinkedListCode = () => {
    return (
      <div className="font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 h-full overflow-auto">
        {circularDoublyLinkedListCode.map((line, index) => (
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

  const renderCircularDoublyLinkedListVisualization = () => {
    const displayNodes = steps.length > 0 ? currentStep.nodes : nodes
    const displayHead = steps.length > 0 ? currentStep.head : head
    const displayTail = steps.length > 0 ? currentStep.tail : tail
    const highlightedNodes = currentStep.highlightedNodes || []

    // Build the linked list order (cycle-safe walk along next pointers)
    const orderedNodes: CircularDoublyListNode[] = ll.orderFrom(displayNodes, displayHead)

    return (
      <div className="flex flex-col items-center min-h-[400px] mb-4">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Circular Doubly Linked List Visualization</h3>
          <p className="text-sm text-gray-600">
            Size: {orderedNodes.length} | Head: {displayHead !== null ? `Node ${displayHead}` : "null"} | Tail:{" "}
            {displayTail !== null ? `Node ${displayTail}` : "null"}
          </p>
        </div>

        {/* Scrollable container for the circular doubly linked list */}
        <div className="w-full">
          <ScrollArea className="w-full whitespace-nowrap rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 p-8 min-w-max">
              {orderedNodes.length > 0 ? (
                <>
                  {/* Head pointer */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="text-sm font-semibold text-blue-600 mb-2">HEAD</div>
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-blue-500"></div>
                  </div>

                  {/* Circular doubly linked list nodes */}
                  {orderedNodes.map((node, index) => {
                    const isHighlighted = highlightedNodes.includes(node.id)
                    const isHead = node.id === displayHead
                    const isTail = node.id === displayTail

                    return (
                      <div key={node.id} className="flex items-center flex-shrink-0">
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={`
                            flex items-center border-2 rounded-lg shadow-sm
                            ${
                              isHighlighted
                                ? "bg-yellow-100 border-yellow-400"
                                : isHead && isTail
                                  ? "bg-purple-100 border-purple-400"
                                  : isHead
                                    ? "bg-blue-100 border-blue-400"
                                    : isTail
                                      ? "bg-green-100 border-green-400"
                                      : "bg-white border-gray-300"
                            }
                            ${isHighlighted ? "ring-2 ring-yellow-300" : ""}
                          `}
                        >
                          {/* Prev pointer part */}
                          <div className="px-3 py-3 border-r border-gray-300">
                            <div className="text-xs text-gray-500">Prev</div>
                            <div className="text-xs font-mono">
                              {node.prev !== null ? `${node.prev}←` : "null"}
                              {isHead && node.prev === displayTail && (
                                <span className="text-xs text-blue-600 ml-1">(tail)</span>
                              )}
                            </div>
                          </div>

                          {/* Data part */}
                          <div className="px-4 py-3 border-r border-gray-300">
                            <div className="text-sm text-gray-500">Data</div>
                            <div className="text-lg font-bold">{node.value}</div>
                          </div>

                          {/* Next pointer part */}
                          <div className="px-3 py-3">
                            <div className="text-xs text-gray-500">Next</div>
                            <div className="text-xs font-mono">
                              {node.next !== null ? `→${node.next}` : "null"}
                              {isTail && node.next === displayHead && (
                                <span className="text-xs text-green-600 ml-1">(head)</span>
                              )}
                            </div>
                          </div>
                        </motion.div>

                        {/* Bidirectional arrows */}
                        {index < orderedNodes.length - 1 && (
                          <div className="mx-2 flex flex-col items-center flex-shrink-0">
                            <ArrowRight className="h-4 w-4 text-gray-400 mb-1" />
                            <ArrowLeft className="h-4 w-4 text-gray-400" />
                          </div>
                        )}

                        {/* Circular arrows at the end */}
                        {index === orderedNodes.length - 1 && orderedNodes.length > 1 && (
                          <div className="ml-4 flex flex-col items-center flex-shrink-0">
                            <div className="text-sm font-semibold text-green-600 mb-2">CIRCULAR</div>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center mb-1">
                                <RotateCw className="h-6 w-6 text-green-500" />
                                <div className="ml-1 text-xs text-green-600">→HEAD</div>
                              </div>
                              <div className="flex items-center">
                                <RotateCw className="h-6 w-6 text-blue-500 transform rotate-180" />
                                <div className="ml-1 text-xs text-blue-600">←TAIL</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Self-pointing for single node */}
                        {index === orderedNodes.length - 1 && orderedNodes.length === 1 && (
                          <div className="ml-4 flex flex-col items-center flex-shrink-0">
                            <div className="text-sm font-semibold text-purple-600 mb-2">SELF</div>
                            <div className="w-12 h-12 border-2 border-purple-400 rounded-full bg-purple-100 flex flex-col items-center justify-center">
                              <RotateCw className="h-3 w-3 text-purple-500 mb-1" />
                              <RotateCw className="h-3 w-3 text-purple-500 transform rotate-180" />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Tail pointer */}
                  {orderedNodes.length > 1 && (
                    <div className="flex flex-col items-center flex-shrink-0 ml-4">
                      <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-green-500"></div>
                      <div className="text-sm font-semibold text-green-600 mt-2">TAIL</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full min-h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <div className="flex justify-center items-center">
                        <RotateCw className="w-8 h-8 mr-2" />
                        <ArrowLeft className="w-4 h-4" />
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-gray-500 font-medium">Circular Doubly Linked List is Empty</p>
                    <p className="text-gray-400 text-sm">Add elements to see the bidirectional circular structure</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
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
      <ScrollArea className="h-[500px]">
        <div className="flex flex-col items-center">
          {renderCircularDoublyLinkedListVisualization()}
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
      </ScrollArea>
    </div>
  )

  const CodeContent = () => (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
      <h3 className="font-semibold text-gray-800 mb-2">Circular Doubly Linked List Implementation</h3>
      {renderCircularDoublyLinkedListCode()}
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-white p-4 flex justify-center">
      <Card className="w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[80%] shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Circular Doubly Linked List Visualizer</h2>
            </div>
          </div>

          {/* Input and Operation Controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insertBeginning">Insert at Beginning</SelectItem>
                  <SelectItem value="insertEnd">Insert at End</SelectItem>
                  <SelectItem value="insertPosition">Insert at Position</SelectItem>
                  <SelectItem value="deleteBeginning">Delete from Beginning</SelectItem>
                  <SelectItem value="deleteEnd">Delete from End</SelectItem>
                  <SelectItem value="deletePosition">Delete at Position</SelectItem>
                  <SelectItem value="search">Search Element</SelectItem>
                  <SelectItem value="traverseForward">Traverse Forward</SelectItem>
                  <SelectItem value="traverseBackward">Traverse Backward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              {(operation === "insertBeginning" ||
                operation === "insertEnd" ||
                operation === "insertPosition" ||
                operation === "search") && (
                <Input
                  placeholder="Enter value"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow"
                />
              )}

              {(operation === "insertPosition" || operation === "deletePosition") && (
                <Input
                  placeholder="Position"
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  className="w-32"
                />
              )}

              <div className="flex gap-2 flex-wrap">
                {operation === "insertBeginning" && (
                  <Button onClick={insertAtBeginning} className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-1 h-4 w-4" />
                    Insert at Beginning
                  </Button>
                )}
                {operation === "insertEnd" && (
                  <Button onClick={insertAtEnd} className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-1 h-4 w-4" />
                    Insert at End
                  </Button>
                )}
                {operation === "insertPosition" && (
                  <Button onClick={insertAtPosition} className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-1 h-4 w-4" />
                    Insert at Position
                  </Button>
                )}
                {operation === "deleteBeginning" && (
                  <Button onClick={deleteFromBeginning} className="bg-red-600 hover:bg-red-700">
                    <Minus className="mr-1 h-4 w-4" />
                    Delete from Beginning
                  </Button>
                )}
                {operation === "deleteEnd" && (
                  <Button onClick={deleteFromEnd} className="bg-red-600 hover:bg-red-700">
                    <Minus className="mr-1 h-4 w-4" />
                    Delete from End
                  </Button>
                )}
                {operation === "deletePosition" && (
                  <Button onClick={deleteAtPosition} className="bg-red-600 hover:bg-red-700">
                    <Minus className="mr-1 h-4 w-4" />
                    Delete at Position
                  </Button>
                )}
                {operation === "search" && (
                  <Button onClick={searchElement} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="mr-1 h-4 w-4" />
                    Search
                  </Button>
                )}
                {operation === "traverseForward" && (
                  <Button onClick={traverseForward} className="bg-purple-600 hover:bg-purple-700">
                    <ArrowRight className="mr-1 h-4 w-4" />
                    Traverse Forward
                  </Button>
                )}
                {operation === "traverseBackward" && (
                  <Button onClick={traverseBackward} className="bg-purple-600 hover:bg-purple-700">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Traverse Backward
                  </Button>
                )}

                <Button
                  onClick={clearList}
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

          {/* Circular Doubly Linked List Information */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Circular Doubly Linked List Operations</h3>
            <p className="text-sm text-gray-600 mb-2">
              A Circular Doubly Linked List combines the features of both circular and doubly linked lists. Each node
              has references to both next and previous nodes, and the last node points back to the first node while the
              first node points back to the last node.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="inline-block w-3 h-3 bg-green-100 border border-green-400 rounded-sm mr-1"></span>
                <strong>Insert:</strong> Add nodes at beginning, end, or specific position
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-red-100 border border-red-400 rounded-sm mr-1"></span>
                <strong>Delete:</strong> Remove nodes from beginning or end
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-500 rounded-sm mr-1"></span>
                <strong>Search:</strong> Find elements by circular traversal
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-purple-100 border border-purple-500 rounded-sm mr-1"></span>
                <strong>Bidirectional Circular Traversal:</strong> Move forward or backward continuously
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Advantages:</strong> Bidirectional traversal, no null pointers, efficient insertion/deletion at
              both ends. <strong>Use Cases:</strong> Advanced navigation systems, media players with shuffle, complex
              data structures!
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
