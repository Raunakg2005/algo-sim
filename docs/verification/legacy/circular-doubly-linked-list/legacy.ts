// AUTO-GENERATED from git HEAD:components/circular-doubly-linked-list-visualizer.tsx by gen.mjs - do not edit
interface CircularDoublyListNode {
  value: number
  next: number | null
  prev: number | null
  id: number
}

interface CircularDoublyLinkedListStep {
  nodes: CircularDoublyListNode[]
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


export const circularDoublyLinkedListCode = [
  "class CircularDoublyNode {",
  "  constructor(data) {",
  "    this.data = data;",
  "    this.next = null;",
  "    this.prev = null;",
  "  }",
  "}",
  "",
  "class CircularDoublyLinkedList {",
  "  constructor() {",
  "    this.head = null;",
  "    this.tail = null;",
  "    this.size = 0;",
  "  }",
  "",
  "  // Insert at beginning",
  "  insertAtBeginning(data) {",
  "    const newNode = new CircularDoublyNode(data);",
  "    if (!this.head) {",
  "      this.head = this.tail = newNode;",
  "      newNode.next = newNode.prev = newNode;",
  "    } else {",
  "      newNode.next = this.head;",
  "      newNode.prev = this.tail;",
  "      this.head.prev = newNode;",
  "      this.tail.next = newNode;",
  "      this.head = newNode;",
  "    }",
  "    this.size++;",
  "  }",
  "",
  "  // Insert at end",
  "  insertAtEnd(data) {",
  "    const newNode = new CircularDoublyNode(data);",
  "    if (!this.head) {",
  "      this.head = this.tail = newNode;",
  "      newNode.next = newNode.prev = newNode;",
  "    } else {",
  "      newNode.next = this.head;",
  "      newNode.prev = this.tail;",
  "      this.tail.next = newNode;",
  "      this.head.prev = newNode;",
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
  "    const newNode = new CircularDoublyNode(data);",
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
  "      this.tail.next = this.head.next;",
  "      this.head.next.prev = this.tail;",
  "      this.head = this.head.next;",
  "    }",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Delete from end",
  "  deleteFromEnd() {",
  "    if (!this.head) return null;",
  "    const deletedData = this.tail.data;",
  "    if (this.head === this.tail) {",
  "      this.head = this.tail = null;",
  "    } else {",
  "      this.head.prev = this.tail.prev;",
  "      this.tail.prev.next = this.head;",
  "      this.tail = this.tail.prev;",
  "    }",
  "    this.size--;",
  "    return deletedData;",
  "  }",
  "",
  "  // Search for element",
  "  search(data) {",
  "    if (!this.head) return -1;",
  "    let current = this.head;",
  "    let position = 0;",
  "    do {",
  "      if (current.data === data) {",
  "        return position;",
  "      }",
  "      current = current.next;",
  "      position++;",
  "    } while (current !== this.head);",
  "    return -1;",
  "  }",
  "",
  "  // Traverse forward",
  "  traverseForward() {",
  "    if (!this.head) return [];",
  "    const elements = [];",
  "    let current = this.head;",
  "    do {",
  "      elements.push(current.data);",
  "      current = current.next;",
  "    } while (current !== this.head);",
  "    return elements;",
  "  }",
  "",
  "  // Traverse backward",
  "  traverseBackward() {",
  "    if (!this.head) return [];",
  "    const elements = [];",
  "    let current = this.tail;",
  "    do {",
  "      elements.push(current.data);",
  "      current = current.prev;",
  "    } while (current !== this.tail);",
  "    return elements;",
  "  }",
  "}",
]

export const CODE: string[] = circularDoublyLinkedListCode
export const OPS: string[] = ["insertBeginning","insertEnd","insertPosition","deleteBeginning","deleteEnd","search","traverseForward","traverseBackward","deletePosition"]

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
    newNodes: CircularDoublyListNode[],
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
    const newStep: CircularDoublyLinkedListStep = {
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

    const newNode: CircularDoublyListNode = {
      value,
      next: head,
      prev: tail,
      id: nextId,
    }

    let newNodes = [...nodes, newNode]
    const newHead = nextId
    let newTail = tail

    if (head === null) {
      // First node - points to itself
      newNode.next = nextId
      newNode.prev = nextId
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
        newNodes.map((n) => (n.id === nextId ? { ...n, next: nextId, prev: nextId } : n)),
        newHead,
        newTail,
        "insertBeginning",
        value,
        undefined,
        `Inserted ${value} as first node. Node points to itself in both directions`,
        false,
        19,
        [nextId],
      )
    } else {
      // Update circular links
      newNodes = newNodes.map((node) => {
        if (node.id === head) {
          return { ...node, prev: nextId }
        }
        if (node.id === tail) {
          return { ...node, next: nextId }
        }
        return node
      })
      addStep(
        newNodes,
        head,
        tail,
        "insertBeginning",
        value,
        undefined,
        "Creating new node and updating circular links",
        false,
        21,
        [],
      )
      addStep(
        newNodes,
        newHead,
        newTail,
        "insertBeginning",
        value,
        undefined,
        `Inserted ${value} at beginning. Updated all circular links`,
        false,
        26,
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

    const newNode: CircularDoublyListNode = {
      value,
      next: head,
      prev: tail,
      id: nextId,
    }

    let newNodes = [...nodes, newNode]
    let newHead = head
    const newTail = nextId

    if (head === null) {
      // First node - points to itself
      newNode.next = nextId
      newNode.prev = nextId
      newHead = nextId
      addStep(newNodes, null, null, "insertEnd", value, undefined, "List is empty, creating first node", false, 31, [])
      addStep(
        newNodes.map((n) => (n.id === nextId ? { ...n, next: nextId, prev: nextId } : n)),
        newHead,
        newTail,
        "insertEnd",
        value,
        undefined,
        `Inserted ${value} as first node. Node points to itself in both directions`,
        false,
        34,
        [nextId],
      )
    } else {
      // Update circular links
      newNodes = newNodes.map((node) => {
        if (node.id === tail) {
          return { ...node, next: nextId }
        }
        if (node.id === head) {
          return { ...node, prev: nextId }
        }
        return node
      })
      addStep(
        newNodes,
        head,
        tail,
        "insertEnd",
        value,
        undefined,
        "Creating new node and updating circular links",
        false,
        36,
        [],
      )
      addStep(
        newNodes,
        newHead,
        newTail,
        "insertEnd",
        value,
        undefined,
        `Inserted ${value} at end. Updated all circular links`,
        false,
        41,
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
      if (head === null) return false
      let current = head
      let count = 0
      do {
        if (current === n.id) return true
        const node = nodes.find((node) => node.id === current)
        current = node?.next || null
        count++
        if (count > nodes.length) break // Safety check
      } while (current !== head && current !== null)
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
        46,
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

    const newNode: CircularDoublyListNode = {
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
      addStep(nodes, head, tail, "insertPosition", value, position, `Invalid position ${position}`, true, 46, [])
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
      57,
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
      63,
      [nextId],
    )

    setNodes(newNodes)
    setNextId(nextId + 1)
    setInputValue("")
    setPositionInput("")
  }

  const deleteFromBeginning = () => {
    if (head === null) {
      addStep(nodes, head, tail, "deleteBeginning", undefined, undefined, "Cannot delete from empty list", true, 67, [])
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
      68,
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
        70,
        [],
      )
      setNodes([])
      setHead(null)
      setTail(null)
    } else {
      // Update circular links
      const updatedNodes = nodes
        .filter((n) => n.id !== head)
        .map((node) => {
          if (node.id === tail) {
            return { ...node, next: newHead }
          }
          if (node.id === newHead) {
            return { ...node, prev: tail }
          }
          return node
        })

      addStep(
        updatedNodes,
        newHead,
        tail,
        "deleteBeginning",
        deletedValue,
        undefined,
        `Deleted ${deletedValue} from beginning. Updated circular links`,
        false,
        74,
        [],
      )

      setNodes(updatedNodes)
      setHead(newHead)
    }
  }

  const deleteFromEnd = () => {
    if (tail === null) {
      addStep(nodes, head, tail, "deleteEnd", undefined, undefined, "Cannot delete from empty list", true, 79, [])
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
      80,
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
        82,
        [],
      )
      setNodes([])
      setHead(null)
      setTail(null)
    } else {
      // Update circular links
      const updatedNodes = nodes
        .filter((n) => n.id !== tail)
        .map((node) => {
          if (node.id === head) {
            return { ...node, prev: newTail }
          }
          if (node.id === newTail) {
            return { ...node, next: head }
          }
          return node
        })

      addStep(
        updatedNodes,
        head,
        newTail,
        "deleteEnd",
        deletedValue,
        undefined,
        `Deleted ${deletedValue} from end. Updated circular links`,
        false,
        86,
        [],
      )

      setNodes(updatedNodes)
      setTail(newTail)
    }
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
        tail,
        "deletePosition",
        undefined,
        position,
        `Invalid position ${position}. List size is ${size}`,
        true,
        90,
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

    if (position === size - 1) {
      deleteFromEnd()
      setPositionInput("")
      return
    }

    // Find the node at position
    let current = head
    const traversalPath: number[] = []

    for (let i = 0; i < position; i++) {
      const currentNode = nodes.find((n) => n.id === current)
      traversalPath.push(current!)
      current = currentNode?.next || null
    }

    const nodeToDelete = nodes.find((n) => n.id === current)
    const deletedValue = nodeToDelete?.value
    const prevNode = nodeToDelete?.prev
    const nextNode = nodeToDelete?.next

    addStep(
      nodes,
      head,
      tail,
      "deletePosition",
      deletedValue,
      position,
      `Traversing to position ${position}: ${traversalPath.join(" → ")} → ${current}`,
      false,
      91,
      [...traversalPath, ...(current !== null ? [current] : [])],
    )

    // Update bidirectional links
    const updatedNodes = nodes.filter((n) => n.id !== current).map((node) => {
      if (node.id === prevNode) {
        return { ...node, next: nextNode }
      }
      if (node.id === nextNode) {
        return { ...node, prev: prevNode }
      }
      return node
    })

    addStep(
      updatedNodes,
      head,
      tail,
      "deletePosition",
      deletedValue,
      position,
      `Deleted ${deletedValue} from position ${position}. Updated bidirectional circular links`,
      false,
      94,
      [],
    )

    setNodes(updatedNodes)
    setPositionInput("")
  }

  const searchElement = () => {
    const value = validateInput()
    if (value === null) return

    if (head === null) {
      addStep(nodes, head, tail, "search", value, undefined, `Cannot search in empty list`, true, 92, [])
      setInputValue("")
      return
    }

    let current = head
    let position = 0
    const searchPath: number[] = []

    do {
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
        96,
        [...searchPath],
      )

      if (currentNode?.value === value) {
        addStep(nodes, head, tail, "search", value, position, `Found ${value} at position ${position}`, false, 97, [
          current,
        ])
        setInputValue("")
        return
      }

      current = currentNode?.next || null
      position++
    } while (current !== head && current !== null)

    addStep(
      nodes,
      head,
      tail,
      "search",
      value,
      undefined,
      `Element ${value} not found in the list`,
      false,
      101,
      searchPath,
    )
    setInputValue("")
  }

  const traverseForward = () => {
    if (head === null) {
      addStep(nodes, head, tail, "traverseForward", undefined, undefined, "Cannot traverse empty list", true, 105, [])
      return
    }

    let current = head
    const traversalPath: number[] = []
    const values: number[] = []

    do {
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
          `Forward traversal: ${values.join(" → ")} → (back to head)`,
          false,
          108,
          [...traversalPath],
        )

        current = currentNode.next
      } else {
        break
      }
    } while (current !== head && current !== null)

    addStep(
      nodes,
      head,
      tail,
      "traverseForward",
      undefined,
      undefined,
      `Complete forward traversal: ${values.join(" → ")} → ${values[0]} (circular)`,
      false,
      112,
      traversalPath,
    )
  }

  const traverseBackward = () => {
    if (tail === null) {
      addStep(nodes, head, tail, "traverseBackward", undefined, undefined, "Cannot traverse empty list", true, 116, [])
      return
    }

    let current = tail
    const traversalPath: number[] = []
    const values: number[] = []

    do {
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
          `Backward traversal: ${values.join(" ← ")} ← (back to tail)`,
          false,
          119,
          [...traversalPath],
        )

        current = currentNode.prev
      } else {
        break
      }
    } while (current !== tail && current !== null)

    addStep(
      nodes,
      head,
      tail,
      "traverseBackward",
      undefined,
      undefined,
      `Complete backward traversal: ${values.join(" ← ")} ← ${values[0]} (circular)`,
      false,
      123,
      traversalPath,
    )
  }


  const table: Record<string, () => void> = { insertBeginning: insertAtBeginning, insertEnd: insertAtEnd, insertPosition: insertAtPosition, deleteBeginning: deleteFromBeginning, deleteEnd: deleteFromEnd, search: searchElement, traverseForward: traverseForward, traverseBackward: traverseBackward, deletePosition: deleteAtPosition }
  table[op]()
  Object.assign(S, pending)
}
