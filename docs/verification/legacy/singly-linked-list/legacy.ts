// AUTO-GENERATED from git HEAD:components/singly-linked-list-visualizer.tsx by gen.mjs - do not edit
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


export const singlyLinkedListCode = [
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

export const CODE: string[] = singlyLinkedListCode
export const OPS: string[] = ["insertBeginning","insertEnd","insertPosition","deleteBeginning","deleteEnd","search","deletePosition"]

export class Hang extends Error {}
export type LegacyState = { nodes: any[]; head: number | null; tail: number | null; nextId: number; steps: any[]; inputValue: string; positionInput: string; inputError: string }
export const STEP_LIMIT = 500 // frames per click; a legitimate click on <= 21 nodes adds < 50

export function newLegacyState(): LegacyState {
  return { nodes: [], head: null, tail: null, nextId: 1, steps: [], inputValue: "", positionInput: "", inputError: "" }
}

// one button click: reads see the render-time snapshot, writes are applied after the handler returns
export function click(S: LegacyState, op: string): void {
  const nodes = S.nodes, head = S.head, tail = S.tail, nextId = S.nextId
  const inputValue = S.inputValue, positionInput = S.positionInput
  const pending: Record<string, any> = {}
  const start = S.steps.length
  const setNodes = (v: any) => { pending.nodes = v }
  const setHead = (v: any) => { pending.head = v }
  const setTail = (v: any) => { pending.tail = v }
  const setNextId = (v: any) => { pending.nextId = v }
  const setInputValue = (v: any) => { pending.inputValue = v }
  const setPositionInput = (v: any) => { pending.positionInput = v }
  const setInputError = (v: any) => { pending.inputError = v }
  const setSteps = (f: any) => { S.steps = f(S.steps); if (S.steps.length - start > STEP_LIMIT) throw new Hang("one click produced more than " + STEP_LIMIT + " frames (infinite loop)") }
  void tail; void setTail
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

  const deleteAtPosition = () => {
    const position = Number.parseInt(positionInput)

    if (Number.isNaN(position) || position < 0) {
      setInputError("Please enter a valid position (0 or greater)")
      return
    }

    const size = nodes.length

    if (position >= size) {
      addStep(
        nodes,
        head,
        "deletePosition",
        undefined,
        position,
        `Invalid position ${position}. List size is ${size}`,
        true,
        77,
        [],
      )
      setInputError(`Position must be less than list size (${size})`)
      return
    }

    setInputError("")

    if (position === 0) {
      deleteFromBeginning()
      setPositionInput("")
      return
    }

    // Find the node at position-1 and the node at position
    let current = head
    let previous: number | null = null
    const traversalPath: number[] = []

    for (let i = 0; i < position; i++) {
      const currentNode = nodes.find((n) => n.id === current)
      traversalPath.push(current!)
      previous = current
      current = currentNode?.next || null
    }

    const nodeToDelete = nodes.find((n) => n.id === current)
    const deletedValue = nodeToDelete?.value

    addStep(
      nodes,
      head,
      "deletePosition",
      deletedValue,
      position,
      `Traversing to position ${position}: ${traversalPath.join(" → ")} → ${current}`,
      false,
      78,
      [...traversalPath, ...(current !== null ? [current] : [])],
    )

    const updatedNodes = nodes
      .filter((n) => n.id !== current)
      .map((node) => (node.id === previous ? { ...node, next: nodeToDelete?.next || null } : node))

    addStep(
      updatedNodes,
      head,
      "deletePosition",
      deletedValue,
      position,
      `Deleted ${deletedValue} from position ${position}`,
      false,
      81,
      [],
    )

    setNodes(updatedNodes)
    setPositionInput("")
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


  const table: Record<string, () => void> = { insertBeginning: insertAtBeginning, insertEnd: insertAtEnd, insertPosition: insertAtPosition, deleteBeginning: deleteFromBeginning, deleteEnd: deleteFromEnd, search: searchElement, deletePosition: deleteAtPosition }
  table[op]()
  Object.assign(S, pending)
}
