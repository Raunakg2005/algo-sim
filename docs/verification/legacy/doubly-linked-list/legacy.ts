// AUTO-GENERATED from git HEAD:components/doubly-linked-list-visualizer.tsx by gen.mjs - do not edit
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


export const doublyLinkedListCode = [
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

export const CODE: string[] = doublyLinkedListCode
export const OPS: string[] = ["insertBeginning","insertEnd","insertPosition","deleteBeginning","deleteEnd","search","traverseForward","traverseBackward"]

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


  const table: Record<string, () => void> = { insertBeginning: insertAtBeginning, insertEnd: insertAtEnd, insertPosition: insertAtPosition, deleteBeginning: deleteFromBeginning, deleteEnd: deleteFromEnd, search: searchElement, traverseForward: traverseForward, traverseBackward: traverseBackward }
  table[op]()
  Object.assign(S, pending)
}
