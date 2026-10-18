"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Plus, Minus, RotateCcw, Play, Pause, Search, ArrowRight, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DoublyListNode {
  value: number
  next: number | null
  prev: number | null
  id: number
}

interface DoublyLinkedListStep {
  nodes: DoublyListNode[]
  head: number | null
  tail: number | null
  operation: string
  element?: number
  position?: number
  description: string
  isError: boolean
  activeCodeLine: number
  highlightedNodes?: number[]
}

const doublyLinkedListCode = [
  "class DoublyNode {",
  "  constructor(data) {",
  "    this.data = data;",
  "    this.next = null;",
  "    this.prev = null;",
  "  }",
  "}",
  "",
  "class DoublyLinkedList {",
  "  constructor() {",
  "    this.head = null;",
  "    this.tail = null;",
  "    this.size = 0;",
  "  }",
  "",
  "  // Insert at beginning",
  "  insertAtBeginning(data) {",
  "    const newNode = new DoublyNode(data);",
  "    if (!this.head) {",
  "      this.head = this.tail = newNode;",
  "    } else {",
  "      newNode.next = this.head;",
  "      this.head.prev = newNode;",
  "      this.head = newNode;",
  "    }",
  "    this.size++;",
  "  }",
  "",
  "  // Insert at end",
  "  insertAtEnd(data) {",
  "    const newNode = new DoublyNode(data);",
  "    if (!this.tail) {",
  "      this.head = this.tail = newNode;",
  "    } else {",
  "      this.tail.next = newNode;",
  "      newNode.prev = this.tail;",
  "      this.tail = newNode;",
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
  "    if (position === this.size) {",
  "      this.insertAtEnd(data);",
  "      return;",
  "    }",
  "    const newNode = new DoublyNode(data);",
  "    let current = this.head;",
  "    for (let i = 0; i < position; i++) {",
  "      current = current.next;",
  "    }",
  "    newNode.next = current;",
  "    newNode.prev = current.prev;",
  "    current.prev.next = newNode;",
  "    current.prev = newNode;",
  "    this.size++;",
  "  }",
  "",
  "  // Delete from beginning",
  "  deleteFromBeginning() {",
  "    if (!this.head) return null;",
  "    const deletedData = this.head.data;",
  "    if (this.head === this.tail) {",
  "      this.head = this.tail = null;",
  "    } else {",
  "      this.head = this.head.next;",
  "      this.head.prev = null;",
  "    }",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Delete from end",
  "  deleteFromEnd() {",
  "    if (!this.tail) return null;",
  "    const deletedData = this.tail.data;",
  "    if (this.head === this.tail) {",
  "      this.head = this.tail = null;",
  "    } else {",
  "      this.tail = this.tail.prev;",
  "      this.tail.next = null;",
  "    }",
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
  "  // Traverse forward",
  "  traverseForward() {",
  "    const elements = [];",
  "    let current = this.head;",
  "    while (current) {",
  "      elements.push(current.data);",
  "      current = current.next;",
  "    }",
  "    return elements;",
  "  }",
  "",
  "  // Traverse backward",
  "  traverseBackward() {",
  "    const elements = [];",
  "    let current = this.tail;",
  "    while (current) {",
  "      elements.push(current.data);",
  "      current = current.prev;",
  "    }",
  "    return elements;",
  "  }",
  "}",
]

export default function DoublyLinkedListVisualizer() {
  const [nodes, setNodes] = useState<DoublyListNode[]>([])
  const [head, setHead] = useState<number | null>(null)
  const [tail, setTail] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState<string>("")
  const [positionInput, setPositionInput] = useState<string>("")
  const [inputError, setInputError] = useState<string>("")
  const [steps, setSteps] = useState<DoublyLinkedListStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [speed, setSpeed] = useState<number>(1)
  const [activeView, setActiveView] = useState<string>("split")
  const [nextId, setNextId] = useState<number>(1)
  const [operation, setOperation] = useState<string>("insertEnd")

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const addStep = (
    newNodes: DoublyListNode[],
    newHead: number | null,
    newTail: number | null,
    operation: string,
    element: number | undefined,
    position: number | undefined,
    description: string,
    isError = false,
    activeCodeLine = 0,
    highlightedNodes: number[] = [],
  ) => {
    const newStep: DoublyLinkedListStep = {
      nodes: [...newNodes],
      head: newHead,
      tail: newTail,
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

    const newNode: DoublyListNode = {
      value,
      next: head,
      prev: null,
      id: nextId,
    }

    let newNodes = [...nodes, newNode]
    const newHead = nextId
    let newTail = tail

    if (head === null) {
      // First node
      newTail = nextId
      addStep(
        newNodes,
        null,
        null,
        "insertBeginning",
        value,
        undefined,
        "List is empty, creating first node",
        false,
        16,
        [],
      )
      addStep(
        newNodes,
        newHead,
        newTail,
        "insertBeginning",
        value,
        undefined,
        `Inserted ${value} as first node. Both head and tail point to node ${nextId}`,
        false,
        18,
        [nextId],
      )
    } else {
      // Update existing head's prev pointer
      newNodes = newNodes.map((node) => (node.id === head ? { ...node, prev: nextId } : node))
      addStep(
        newNodes,
        head,
        tail,
        "insertBeginning",
        value,
        undefined,
        "Creating new node and linking to current head",
        false,
        20,
        [],
      )
      addStep(
        newNodes,
        newHead,
        newTail,
        "insertBeginning",
        value,
        undefined,
        `Inserted ${value} at beginning. New head points to node ${nextId}`,
        false,
        23,
        [nextId],
      )
    }

    setNodes(newNodes)
    setHead(newHead)
    setTail(newTail)
    setNextId(nextId + 1)
    setInputValue("")
  }

  const insertAtEnd = () => {
    const value = validateInput()
    if (value === null) return

    const newNode: DoublyListNode = {
      value,
      next: null,
      prev: tail,
      id: nextId,
    }

    let newNodes = [...nodes, newNode]
    let newHead = head
    const newTail = nextId

    if (tail === null) {
      // First node
      newHead = nextId
      addStep(newNodes, null, null, "insertEnd", value, undefined, "List is empty, creating first node", false, 29, [])
      addStep(
        newNodes,
        newHead,
        newTail,
        "insertEnd",
        value,
        undefined,
        `Inserted ${value} as first node. Both head and tail point to node ${nextId}`,
        false,
        31,
        [nextId],
      )
    } else {
      // Update existing tail's next pointer
      newNodes = newNodes.map((node) => (node.id === tail ? { ...node, next: nextId } : node))
      addStep(
        newNodes,
        head,
        tail,
        "insertEnd",
        value,
        undefined,
        "Creating new node and linking to current tail",
        false,
        33,
        [],
      )
      addStep(
        newNodes,
        newHead,
        newTail,
        "insertEnd",
        value,
        undefined,
        `Inserted ${value} at end. New tail points to node ${nextId}`,
        false,
        36,
        [nextId],
      )
    }

    setNodes(newNodes)
    setHead(newHead)
    setTail(newTail)
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
        tail,
        "insertPosition",
        value,
        position,
        `Invalid position ${position}. List size is ${listSize}`,
        true,
        41,
        [],
      )
      return
    }

    if (position === 0) {
      insertAtBeginning()
      return
    }

    if (position === listSize) {
      insertAtEnd()
      return
    }

    const newNode: DoublyListNode = {
      value,
      next: null,
      prev: null,
      id: nextId,
    }

    // Traverse to position
    let current = head
    const traversalPath: number[] = []

    for (let i = 0; i < position && current !== null; i++) {
      traversalPath.push(current)
      const node = nodes.find((n) => n.id === current)
      current = node?.next || null
    }

    if (current === null) {
      addStep(nodes, head, tail, "insertPosition", value, position, `Invalid position ${position}`, true, 41, [])
      return
    }

    addStep(
      nodes,
      head,
      tail,
      "insertPosition",
      value,
      position,
      `Traversing to position ${position}: ${traversalPath.join(" → ")}`,
      false,
      52,
      traversalPath,
    )

    const currentNode = nodes.find((n) => n.id === current)
    const prevNode = nodes.find((n) => n.id === currentNode?.prev)

    newNode.next = current
    newNode.prev = currentNode?.prev || null

    let newNodes = [...nodes, newNode]
    newNodes = newNodes.map((node) => {
      if (node.id === current) {
        return { ...node, prev: nextId }
      }
      if (node.id === currentNode?.prev) {
        return { ...node, next: nextId }
      }
      return node
    })

    addStep(
      newNodes,
      head,
      tail,
      "insertPosition",
      value,
      position,
      `Inserted ${value} at position ${position}`,
      false,
      58,
      [nextId],
    )

    setNodes(newNodes)
    setNextId(nextId + 1)
    setInputValue("")
    setPositionInput("")
  }

  const deleteFromBeginning = () => {
    if (head === null) {
      addStep(nodes, head, tail, "deleteBeginning", undefined, undefined, "Cannot delete from empty list", true, 62, [])
      return
    }

    const headNode = nodes.find((n) => n.id === head)
    const deletedValue = headNode?.value
    const newHead = headNode?.next || null

    addStep(
      nodes,
      head,
      tail,
      "deleteBeginning",
      deletedValue,
      undefined,
      `Deleting head node with value ${deletedValue}`,
      false,
      63,
      [head],
    )

    if (head === tail) {
      // Only one node
      addStep(
        [],
        null,
        null,
        "deleteBeginning",
        deletedValue,
        undefined,
        `Deleted ${deletedValue} from beginning. List is now empty`,
        false,
        65,
        [],
      )
      setNodes([])
      setHead(null)
      setTail(null)
    } else {
      // Update new head's prev pointer
      const updatedNodes = nodes
        .filter((n) => n.id !== head)
        .map((node) => (node.id === newHead ? { ...node, prev: null } : node))

      addStep(
        updatedNodes,
        newHead,
        tail,
        "deleteBeginning",
        deletedValue,
        undefined,
        `Deleted ${deletedValue} from beginning. New head: node ${newHead}`,
        false,
        68,
        [],
      )

      setNodes(updatedNodes)
      setHead(newHead)
    }
  }

  const deleteFromEnd = () => {
    if (tail === null) {
      addStep(nodes, head, tail, "deleteEnd", undefined, undefined, "Cannot delete from empty list", true, 74, [])
      return
    }

    const tailNode = nodes.find((n) => n.id === tail)
    const deletedValue = tailNode?.value
    const newTail = tailNode?.prev || null

    addStep(
      nodes,
      head,
      tail,
      "deleteEnd",
      deletedValue,
      undefined,
      `Deleting tail node with value ${deletedValue}`,
      false,
      75,
      [tail],
    )

    if (head === tail) {
      // Only one node
      addStep(
        [],
        null,
        null,
        "deleteEnd",
        deletedValue,
        undefined,
        `Deleted ${deletedValue} from end. List is now empty`,
        false,
        77,
        [],
      )
      setNodes([])
      setHead(null)
      setTail(null)
    } else {
      // Update new tail's next pointer
      const updatedNodes = nodes
        .filter((n) => n.id !== tail)
        .map((node) => (node.id === newTail ? { ...node, next: null } : node))

      addStep(
        updatedNodes,
        head,
        newTail,
        "deleteEnd",
        deletedValue,
        undefined,
        `Deleted ${deletedValue} from end. New tail: node ${newTail}`,
        false,
        80,
        [],
      )

      setNodes(updatedNodes)
      setTail(newTail)
    }
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
        tail,
        "search",
        value,
        position,
        `Searching for ${value}. Checking node ${current} with value ${currentNode?.value}`,
        false,
        87,
        searchPath,
      )

      if (currentNode?.value === value) {
        addStep(nodes, head, tail, "search", value, position, `Found ${value} at position ${position}`, false, 88, [
          current,
        ])
        setInputValue("")
        return
      }

      current = currentNode?.next || null
      position++
    }

    addStep(
      nodes,
      head,
      tail,
      "search",
      value,
      undefined,
      `Element ${value} not found in the list`,
      false,
      93,
      searchPath,
    )
    setInputValue("")
  }

  const traverseForward = () => {
    if (head === null) {
      addStep(nodes, head, tail, "traverseForward", undefined, undefined, "Cannot traverse empty list", true, 96, [])
      return
    }

    let current = head
    const traversalPath: number[] = []
    const values: number[] = []

    while (current !== null) {
      const currentNode = nodes.find((n) => n.id === current)
      if (currentNode) {
        traversalPath.push(current)
        values.push(currentNode.value)

        addStep(
          nodes,
          head,
          tail,
          "traverseForward",
          undefined,
          undefined,
          `Forward traversal: ${values.join(" → ")}`,
          false,
          99,
          [...traversalPath],
        )

        current = currentNode.next
      } else {
        break
      }
    }

    addStep(
      nodes,
      head,
      tail,
      "traverseForward",
      undefined,
      undefined,
      `Forward traversal complete: ${values.join(" → ")}`,
      false,
      103,
      traversalPath,
    )
  }

  const traverseBackward = () => {
    if (tail === null) {
      addStep(nodes, head, tail, "traverseBackward", undefined, undefined, "Cannot traverse empty list", true, 106, [])
      return
    }

    let current = tail
    const traversalPath: number[] = []
    const values: number[] = []

    while (current !== null) {
      const currentNode = nodes.find((n) => n.id === current)
      if (currentNode) {
        traversalPath.push(current)
        values.push(currentNode.value)

        addStep(
          nodes,
          head,
          tail,
          "traverseBackward",
          undefined,
          undefined,
          `Backward traversal: ${values.join(" ← ")}`,
          false,
          109,
          [...traversalPath],
        )

        current = currentNode.prev
      } else {
        break
      }
    }

    addStep(
      nodes,
      head,
      tail,
      "traverseBackward",
      undefined,
      undefined,
      `Backward traversal complete: ${values.join(" ← ")}`,
      false,
      113,
      traversalPath,
    )
  }

  const clearList = () => {
    setNodes([])
    setHead(null)
    setTail(null)
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
    tail: null,
    operation: "",
    element: undefined,
    position: undefined,
    description: "Perform operations to see the doubly linked list in action",
    isError: false,
    activeCodeLine: 0,
    highlightedNodes: [],
  }

  const renderDoublyLinkedListCode = () => {
    return (
      <div className="font-mono text-sm bg-gray-50 p-4 rounded-md border border-gray-200 h-full overflow-auto">
        {doublyLinkedListCode.map((line, index) => (
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

  const renderDoublyLinkedListVisualization = () => {
    const displayNodes = steps.length > 0 ? currentStep.nodes : nodes
    const displayHead = steps.length > 0 ? currentStep.head : head
    const displayTail = steps.length > 0 ? currentStep.tail : tail
    const highlightedNodes = currentStep.highlightedNodes || []

    // Build the linked list order
    const orderedNodes: DoublyListNode[] = []
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
          <h3 className="text-lg font-semibold mb-2">Doubly Linked List Visualization</h3>
          <p className="text-sm text-gray-600">
            Size: {orderedNodes.length} | Head: {displayHead ? `Node ${displayHead}` : "null"} | Tail:{" "}
            {displayTail ? `Node ${displayTail}` : "null"}
          </p>
        </div>

        {/* Scrollable container for the doubly linked list */}
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

                  {/* Doubly linked list nodes */}
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
                            <div className="text-xs font-mono">{node.prev ? `${node.prev}←` : "null"}</div>
                          </div>

                          {/* Data part */}
                          <div className="px-4 py-3 border-r border-gray-300">
                            <div className="text-sm text-gray-500">Data</div>
                            <div className="text-lg font-bold">{node.value}</div>
                          </div>

                          {/* Next pointer part */}
                          <div className="px-3 py-3">
                            <div className="text-xs text-gray-500">Next</div>
                            <div className="text-xs font-mono">{node.next ? `→${node.next}` : "null"}</div>
                          </div>
                        </motion.div>

                        {/* Bidirectional arrows */}
                        {index < orderedNodes.length - 1 && (
                          <div className="mx-2 flex flex-col items-center flex-shrink-0">
                            <ArrowRight className="h-4 w-4 text-gray-400 mb-1" />
                            <ArrowLeft className="h-4 w-4 text-gray-400" />
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

                  {/* Tail pointer */}
                  <div className="flex flex-col items-center flex-shrink-0 ml-4">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-green-500"></div>
                    <div className="text-sm font-semibold text-green-600 mt-2">TAIL</div>
                  </div>
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
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Doubly Linked List is Empty</p>
                    <p className="text-gray-400 text-sm">Add elements to see the bidirectional structure</p>
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
    <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
      <h3 className="font-semibold text-gray-800 mb-2">Visualization</h3>
      <ScrollArea className="h-[500px]">
        <div className="flex flex-col items-center">
          {renderDoublyLinkedListVisualization()}
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
      <h3 className="font-semibold text-gray-800 mb-2">Doubly Linked List Implementation</h3>
      {renderDoublyLinkedListCode()}
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-white p-4 flex justify-center">
      <Card className="w-full max-w-[95%] xl:max-w-[90%] 2xl:max-w-[80%] shadow-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Doubly Linked List Visualizer</h2>
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

              {operation === "insertPosition" && (
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

          {/* Doubly Linked List Information */}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Doubly Linked List Operations</h3>
            <p className="text-sm text-gray-600 mb-2">
              A Doubly Linked List is a linear data structure where each node contains data and references to both the
              next and previous nodes, allowing bidirectional traversal.
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
                <strong>Search:</strong> Find elements by traversing forward
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-purple-100 border border-purple-500 rounded-sm mr-1"></span>
                <strong>Bidirectional Traversal:</strong> Move forward or backward through the list
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Advantages:</strong> Bidirectional traversal, easier deletion, better for navigation.{" "}
              <strong>Use Cases:</strong> Browser history, music players, undo/redo functionality!
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
    