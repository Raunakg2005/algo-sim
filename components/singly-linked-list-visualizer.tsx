"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Minus, RotateCcw, Play, Pause, Search, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ListNode {
  value: number
  next: number | null
  id: number
}

interface LinkedListStep {
  nodes: ListNode[]
  head: number | null
  operation: string
  element?: number
  position?: number
  description: string
  isError: boolean
  activeCodeLine: number
  highlightedNodes?: number[]
}

const singlyLinkedListCode = [
  "class Node {",
  "  constructor(data) {",
  "    this.data = data;",
  "    this.next = null;",
  "  }",
  "}",
  "",
  "class SinglyLinkedList {",
  "  constructor() {",
  "    this.head = null;",
  "    this.size = 0;",
  "  }",
  "",
  "  // Insert at beginning",
  "  insertAtBeginning(data) {",
  "    const newNode = new Node(data);",
  "    newNode.next = this.head;",
  "    this.head = newNode;",
  "    this.size++;",
  "  }",
  "",
  "  // Insert at end",
  "  insertAtEnd(data) {",
  "    const newNode = new Node(data);",
  "    if (!this.head) {",
  "      this.head = newNode;",
  "    } else {",
  "      let current = this.head;",
  "      while (current.next) {",
  "        current = current.next;",
  "      }",
  "      current.next = newNode;",
  "    }",
  "    this.size++;",
  "  }",
  "",
  "  // Insert at position",
  "  insertAtPosition(data, position) {",
  "    if (position < 0 || position > this.size) {",
  "      throw new Error('Invalid position');",
  "    }",
  "    if (position === 0) {",
  "      this.insertAtBeginning(data);",
  "      return;",
  "    }",
  "    const newNode = new Node(data);",
  "    let current = this.head;",
  "    for (let i = 0; i < position - 1; i++) {",
  "      current = current.next;",
  "    }",
  "    newNode.next = current.next;",
  "    current.next = newNode;",
  "    this.size++;",
  "  }",
  "",
  "  // Delete from beginning",
  "  deleteFromBeginning() {",
  "    if (!this.head) return null;",
  "    const deletedData = this.head.data;",
  "    this.head = this.head.next;",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Delete from end",
  "  deleteFromEnd() {",
  "    if (!this.head) return null;",
  "    if (!this.head.next) {",
  "      const deletedData = this.head.data;",
  "      this.head = null;",
  "      this.size--;",
  "      return deletedData;",
  "    }",
  "    let current = this.head;",
  "    while (current.next.next) {",
  "      current = current.next;",
  "    }",
  "    const deletedData = current.next.data;",
  "    current.next = null;",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Search for element",
  "  search(data) {",
  "    let current = this.head;",
  "    let position = 0;",
  "    while (current) {",
  "      if (current.data === data) {",
  "        return position;",
  "      }",
  "      current = current.next;",
  "      position++;",
  "    }",
  "    return -1;",
  "  }",
  "",
  "  // Display list",
  "  display() {",
  "    const elements = [];",
  "    let current = this.head;",
  "    while (current) {",
  "      elements.push(current.data);",
  "      current = current.next;",
  "    }",
  "    return elements;",
  "  }",
  "}",
]

export default function SinglyLinkedListVisualizer() {
  const [nodes, setNodes] = useState<ListNode[]>([])
  const [head, setHead] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState<string>("")
  const [positionInput, setPositionInput] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [steps, setSteps] = useState<LinkedListStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [activeView, setActiveView] = useState<string>("split")
  const [nextId, setNextId] = useState<number>(1)
  const [operation, setOperation] = useState<string>("insertEnd")

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const addStep = (
    newNodes: ListNode[],
    newHead: number | null,
    operation: string,
    element: number | undefined,
    position: number | undefined,
    description: string,
    isError = false,
    activeCodeLine = 0,
    highlightedNodes: number[] = [],
  ) => {
    const newStep: LinkedListStep = {
      nodes: [...newNodes],
      head: newHead,
      operation,
      element,
      position,
      description,
      isError,
      activeCodeLine,
      highlightedNodes,
    }
    setSteps((prev) => [...prev, newStep])
  }

  const validateInput = (): number | null => {
    const value = inputValue.trim()
    if (!value) {
      setInputError("Please enter a number")
      return null
    }
    const num = Number.parseInt(value, 10)
    if (isNaN(num)) {
      setInputError("Please enter a valid number")
      return null
    }
    setInputError("")
    return num
  }

  const validatePosition = (): number | null => {
    const pos = positionInput.trim()
    if (!pos) {
      setInputError("Please enter a position")
      return null
    }
    const num = Number.parseInt(pos, 10)
    if (isNaN(num) || num < 0) {
      setInputError("Please enter a valid position (≥ 0)")
      return null
    }
    setInputError("")
    return num
  }

  const insertAtBeginning = () => {
    const value = validateInput()
    if (value === null) return

    const newNode: ListNode = {
      value,
      next: head,
      id: nextId,
    }

    const newNodes = [...nodes, newNode]
    const newHead = nextId

    addStep(newNodes, head, "insertBeginning", value, undefined, "Creating new node", false, 14, [])
    addStep(
      newNodes,
      newHead,
      "insertBeginning",
      value,
      undefined,
      `Inserted ${value} at beginning. New head points to node ${nextId}`,
      false,
      17,
      [nextId],
    )

    setNodes(newNodes)
    setHead(newHead)
    setNextId(nextId + 1)
    setInputValue("")
  }

  const insertAtEnd = () => {
    const value = validateInput()
    if (value === null) return

    const newNode: ListNode = {
      value,
      next: null,
      id: nextId,
    }

    if (head === null) {
      const newNodes = [...nodes, newNode]
      addStep(newNodes, null, "insertEnd", value, undefined, "List is empty, inserting as first node", false, 23, [])
      addStep(
        newNodes,
        nextId,
        "insertEnd",
        value,
        undefined,
        `Inserted ${value} as first node. Head points to node ${nextId}`,
        false,
        24,
        [nextId],
      )

      setNodes(newNodes)
      setHead(nextId)
    } else {
      // Find the last node
      let current = head
      const traversalPath: number[] = [current]

      while (nodes.find((n) => n.id === current)?.next !== null) {
        const currentNode = nodes.find((n) => n.id === current)
        if (currentNode?.next) {
          current = currentNode.next
          traversalPath.push(current)
        }
      }

      addStep(
        nodes,
        head,
        "insertEnd",
        value,
        undefined,
        `Traversing to find last node: ${traversalPath.join(" → ")}`,
        false,
        26,
        traversalPath,
      )

      const newNodes = [...nodes, newNode]
      const updatedNodes = newNodes.map((node) => (node.id === current ? { ...node, next: nextId } : node))

      addStep(
        updatedNodes,
        head,
        "insertEnd",
        value,
        undefined,
        `Inserted ${value} at end. Last node now points to node ${nextId}`,
        false,
        30,
        [nextId],
      )

      setNodes(updatedNodes)
    }

    setNextId(nextId + 1)
    setInputValue("")
  }

  const insertAtPosition = () => {
    const value = validateInput()
    const position = validatePosition()
    if (value === null || position === null) return

    const listSize = nodes.filter((n) => {
      let current = head
      while (current !== null) {
        if (current === n.id) return true
        const node = nodes.find((node) => node.id === current)
        current = node?.next || null
      }
      return false
    }).length

    if (position > listSize) {
      addStep(
        nodes,
        head,
        "insertPosition",
        value,
        position,
        `Invalid position ${position}. List size is ${listSize}`,
        true,
        35,
        [],
      )
      return
    }

    if (position === 0) {
      insertAtBeginning()
      return
    }

    const newNode: ListNode = {
      value,
      next: null,
      id: nextId,
    }

    // Traverse to position - 1
    let current = head
    const traversalPath: number[] = []

    for (let i = 0; i < position - 1 && current !== null; i++) {
      traversalPath.push(current)
      const node = nodes.find((n) => n.id === current)
      current = node?.next || null
    }

    if (current === null) {
      addStep(nodes, head, "insertPosition", value, position, `Invalid position ${position}`, true, 35, [])
      return
    }

    addStep(
      nodes,
      head,
      "insertPosition",
      value,
      position,
      `Traversing to position ${position - 1}: ${traversalPath.join(" → ")}`,
      false,
      43,
      traversalPath,
    )

    const currentNode = nodes.find((n) => n.id === current)
    newNode.next = currentNode?.next || null

    const newNodes = [...nodes, newNode]
    const updatedNodes = newNodes.map((node) => (node.id === current ? { ...node, next: nextId } : node))

    addStep(
      updatedNodes,
      head,
      "insertPosition",
      value,
      position,
      `Inserted ${value} at position ${position}`,
      false,
      47,
      [nextId],
    )

    setNodes(updatedNodes)
    setNextId(nextId + 1)
    setInputValue("")
    setPositionInput("")
  }

  const deleteFromBeginning = () => {
    if (head === null) {
      addStep(nodes, head, "deleteBeginning", undefined, undefined, "Cannot delete from empty list", true, 52, [])
      return
    }

    const headNode = nodes.find((n) => n.id === head)
    const deletedValue = headNode?.value
    const newHead = headNode?.next || null

    addStep(
      nodes,
      head,
      "deleteBeginning",
      deletedValue,
      undefined,
      `Deleting head node with value ${deletedValue}`,
      false,
      53,
      [head],
    )

    const updatedNodes = nodes.filter((n) => n.id !== head)

    addStep(
      updatedNodes,
      newHead,
      "deleteBeginning",
      deletedValue,
      undefined,
      `Deleted ${deletedValue} from beginning. New head: ${newHead ? `node ${newHead}` : "null"}`,
      false,
      55,
      [],
    )

    setNodes(updatedNodes)
    setHead(newHead)
  }

  const deleteFromEnd = () => {
    if (head === null) {
      addStep(nodes, head, "deleteEnd", undefined, undefined, "Cannot delete from empty list", true, 60, [])
      return
    }

    const headNode = nodes.find((n) => n.id === head)
    if (headNode?.next === null) {
      // Only one node
      addStep(
        nodes,
        head,
        "deleteEnd",
        headNode.value,
        undefined,
        `Deleting only node with value ${headNode.value}`,
        false,
        62,
        [head],
      )
      addStep(
        [],
        null,
        "deleteEnd",
        headNode.value,
        undefined,
        `Deleted ${headNode.value} from end. List is now empty`,
        false,
        65,
        [],
      )

      setNodes([])
      setHead(null)
      return
    }

    // Find second to last node
    let current: number | null = head
    let previous: number | null = null
    const traversalPath: number[] = []

    while (current !== null) {
      const currentNode = nodes.find((n) => n.id === current)
      if (currentNode?.next === null) break

      traversalPath.push(current)
      previous = current
      current = currentNode && currentNode.next !== null ? currentNode.next : null
    }

    const lastNode = nodes.find((n) => n.id === current)

    addStep(
      nodes,
      head,
      "deleteEnd",
      lastNode?.value,
      undefined,
      `Traversing to find last node: ${traversalPath.join(" → ")} → ${current}`,
      false,
      68,
      [...traversalPath, ...(current !== null ? [current] : [])],
    )

    const updatedNodes = nodes
      .filter((n) => n.id !== current)
      .map((node) => (node.id === previous ? { ...node, next: null } : node))

    addStep(
      updatedNodes,
      head,
      "deleteEnd",
      lastNode?.value,
      undefined,
      `Deleted ${lastNode?.value} from end`,
      false,
      73,
      [],
    )

    setNodes(updatedNodes)
  }

  const searchElement = () => {
    const value = validateInput()
    if (value === null) return

    let current = head
    let position = 0
    const searchPath: number[] = []

    while (current !== null) {
      const currentNode = nodes.find((n) => n.id === current)
      searchPath.push(current)

      addStep(
        nodes,
        head,
        "search",
        value,
        position,
        `Searching for ${value}. Checking node ${current} with value ${currentNode?.value}`,
        false,
        80,
        searchPath,
      )

      if (currentNode?.value === value) {
        addStep(nodes, head, "search", value, position, `Found ${value} at position ${position}`, false, 81, [current])
        setInputValue("")
        return
      }

      current = currentNode?.next || null
      position++
    }

    addStep(nodes, head, "search", value, undefined, `Element ${value} not found in the list`, false, 86, searchPath)
    setInputValue("")
  }

  const clearList = () => {
    setNodes([])
    setHead(null)
    setSteps([])
    setCurrentStepIndex(0)
    setIsPlaying(false)
    setInputError("")
    setNextId(1)
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
    operation: "",
    element: undefined,
    position: undefined,
    description: "Perform operations to see the linked list in action",
    isError: false,
    activeCodeLine: 0,
    highlightedNodes: [],
  }

  const renderLinkedListCode = () => {
    return (
      <div className="font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 h-full overflow-auto">
        {singlyLinkedListCode.map((line, index) => (
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

  // Replace the existing renderLinkedListVisualization function with this updated version
  const renderLinkedListVisualization = () => {
    const displayNodes = steps.length > 0 ? currentStep.nodes : nodes
    const displayHead = steps.length > 0 ? currentStep.head : head
    const highlightedNodes = currentStep.highlightedNodes || []

    // Build the linked list order
    const orderedNodes: ListNode[] = []
    let current = displayHead

    while (current !== null) {
      const node = displayNodes.find((n) => n.id === current)
      if (node) {
        orderedNodes.push(node)
        current = node.next
      } else {
        break
      }
    }

    return (
      <div className="flex flex-col items-center min-h-[400px] mb-4">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Singly Linked List Visualization</h3>
          <p className="text-sm text-gray-600">
            Size: {orderedNodes.length} | Head: {displayHead ? `Node ${displayHead}` : "null"}
          </p>
        </div>

        {/* Improved scrollable container for the linked list */}
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

                  {/* Linked list nodes */}
                  {orderedNodes.map((node, index) => {
                    const isHighlighted = highlightedNodes.includes(node.id)
                    const isHead = node.id === displayHead

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
                              : isHead
                                ? "bg-blue-100 border-blue-400"
                                : "bg-white border-gray-300"
                          }
                          ${isHighlighted ? "ring-2 ring-yellow-300" : ""}
                        `}
                        >
                          {/* Data part */}
                          <div className="px-4 py-3 border-r border-gray-300">
                            <div className="text-sm text-gray-500">Data</div>
                            <div className="text-lg font-bold">{node.value}</div>
                          </div>

                          {/* Next pointer part */}
                          <div className="px-4 py-3">
                            <div className="text-sm text-gray-500">Next</div>
                            <div className="text-sm font-mono">{node.next ? `→${node.next}` : "null"}</div>
                          </div>
                        </motion.div>

                        {/* Arrow to next node */}
                        {index < orderedNodes.length - 1 && (
                          <div className="mx-2 flex-shrink-0">
                            <ArrowRight className="h-6 w-6 text-gray-400" />
                          </div>
                        )}

                        {/* Null pointer at the end */}
                        {index === orderedNodes.length - 1 && (
                          <div className="ml-4 flex flex-col items-center flex-shrink-0">
                            <div className="text-sm font-semibold text-gray-500 mb-2">NULL</div>
                            <div className="w-8 h-8 border-2 border-gray-400 rounded bg-gray-100 flex items-center justify-center">
                              <span className="text-xs text-gray-500">⊗</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="w-full min-h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Linked List is Empty</p>
                    <p className="text-gray-400 text-sm">Add elements to see the list structure</p>
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
            <span className="text-sm text-gray-500">{speed}x</span>
          </div>

          <div className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>
      </div>
    )

  const VisualizationContent = () => (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] flex flex-col h-full">
      <h3 className="font-semibold text-gray-800 mb-2">Visualization</h3>
      <div className="flex flex-col items-center w-full h-full">
        <div className="flex flex-col items-center w-full">
          {/* Center the visualization horizontally and use only one real horizontal scrollbar */}
          <div className="w-full flex flex-col items-center">
            <div className="relative w-full max-w-full flex flex-col items-center">
              <div className="flex justify-center w-full overflow-x-auto">
                <div className="inline-block min-w-[600px]">
                  {renderLinkedListVisualization()}
                </div>
              </div>
            </div>
          </div>
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
    </div>
  )

  const CodeContent = () => (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] overflow-x-auto">
      <h3 className="font-semibold text-gray-800 mb-2">Singly Linked List Implementation</h3>
      <div className="min-w-[600px] w-fit">
        {renderLinkedListCode()}
      </div>
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-white p-4 flex justify-center">
      <Card className="w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[80%] shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Singly Linked List Visualizer</h2>
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
                  <SelectItem value="deletePosition">Delete from Position</SelectItem>
                  <SelectItem value="search">Search Element</SelectItem>
                  <SelectItem value="displayList">Display List</SelectItem>
                  <SelectItem value="display">Display List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="Enter value"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-grow"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (operation === "insertBeginning") insertAtBeginning();
                    else if (operation === "insertEnd") insertAtEnd();
                    else if (operation === "insertPosition") insertAtPosition();
                    else if (operation === "search") searchElement();
                  }
                }}
              />

              {operation === "insertPosition" && (
                <Input
                  placeholder="Position"
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  className="w-32"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      insertAtPosition();
                    }
                  }}
                />
              )}

              <div className="flex gap-2">
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
                {operation === "search" && (
                  <Button onClick={searchElement} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="mr-1 h-4 w-4" />
                    Search
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

          {/* Linked List Information */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Singly Linked List Operations</h3>
            <p className="text-sm text-gray-600 mb-2">
              A Singly Linked List is a linear data structure where each node contains data and a reference (link) to
              the next node in the sequence.
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
                <strong>Search:</strong> Find elements by traversing the list
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-500 rounded-sm mr-1"></span>
                <strong>Traversal:</strong> Visit each node following the next pointers
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Use Cases:</strong> Dynamic memory allocation, implementation of stacks/queues, music playlists,
              browser history!
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
