# One-off refactor of the four list components onto their engines (run once from algo-sim root).
import re, sys
CFG = {
  "singly-linked-list": dict(Node="ListNode", Step="LinkedListStep", State="SinglyListState", EMPTY="EMPTY_SINGLY_LIST", code="singlyLinkedListCode", tail=False,
                             ops=["deletePosition"]),
  "doubly-linked-list": dict(Node="DoublyListNode", Step="DoublyLinkedListStep", State="DoublyListState", EMPTY="EMPTY_DOUBLY_LIST", code="doublyLinkedListCode", tail=True,
                             ops=["traverseForward", "traverseBackward"]),
  "circular-linked-list": dict(Node="CircularListNode", Step="CircularLinkedListStep", State="CircularListState", EMPTY="EMPTY_CIRCULAR_LIST", code="circularLinkedListCode", tail=True,
                             ops=["deletePosition", "traverseList"]),
  "circular-doubly-linked-list": dict(Node="CircularDoublyListNode", Step="CircularDoublyLinkedListStep", State="CircularDoublyListState", EMPTY="EMPTY_CIRCULAR_DOUBLY_LIST", code="circularDoublyLinkedListCode", tail=True,
                             ops=["deletePosition", "traverseForward", "traverseBackward"]),
}
def handlers(c):
  S = c["State"]; St = c["Step"]
  out = f'''  // Every operation is computed by the pure engine (lib/engines); the component only stores the result.
  const run = (result: ll.OpResult<{S}, {St}>): boolean => {{
    setList(result.state)
    setSteps((prev) => [...prev, ...result.steps])
    return result.ok
  }}

  const readValue = (): number | null => {{
    const parsed = ll.parseValueInput(inputValue)
    setInputError(parsed.ok ? "" : parsed.error)
    return parsed.ok ? parsed.value : null
  }}

  const readPosition = (): number | null => {{
    const parsed = ll.parsePositionInput(positionInput)
    setInputError(parsed.ok ? "" : parsed.error)
    return parsed.ok ? parsed.value : null
  }}

  const insertAtBeginning = () => {{
    const value = readValue()
    if (value === null) return
    run(ll.insertAtBeginning(list, value))
    setInputValue("")
  }}

  const insertAtEnd = () => {{
    const value = readValue()
    if (value === null) return
    run(ll.insertAtEnd(list, value))
    setInputValue("")
  }}

  const insertAtPosition = () => {{
    // the value is validated first, so a valid position no longer hides the value's error message
    const value = readValue()
    if (value === null) return
    const position = readPosition()
    if (position === null) return
    if (run(ll.insertAtPosition(list, value, position))) {{
      setInputValue("")
      setPositionInput("")
    }}
  }}

  const deleteFromBeginning = () => {{
    run(ll.deleteFromBeginning(list))
  }}

  const deleteFromEnd = () => {{
    run(ll.deleteFromEnd(list))
  }}
'''
  if "deletePosition" in c["ops"]:
    out += '''
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
'''
  out += '''
  const searchElement = () => {
    const value = readValue()
    if (value === null) return
    run(ll.search(list, value))
    setInputValue("")
  }
'''
  if "traverseList" in c["ops"]:
    out += '''
  const traverseList = () => {
    run(ll.traverse(list))
  }
'''
  if "traverseForward" in c["ops"]:
    out += '''
  const traverseForward = () => {
    run(ll.traverseForward(list))
  }

  const traverseBackward = () => {
    run(ll.traverseBackward(list))
  }
'''
  out += f'''
  const clearList = () => {{
    setList(ll.{c["EMPTY"]})
    setSteps([])
    setCurrentStepIndex(0)
    setIsPlaying(false)
    setInputError("")
  }}

'''
  return out

for mod, c in CFG.items():
  p = f"components/{mod}-visualizer.tsx"
  s = open(p, encoding="utf8").read()
  # 1. types + code listing come from the engine
  a = s.index("interface "); b = s.index("export default function")
  s = s[:a] + (f'import * as ll from "@/lib/engines/{mod}"\n'
               f'import {{ {c["code"]}, type {c["Node"]}, type {c["Step"]}, type {c["State"]} }} from "@/lib/engines/{mod}"\n\n') + s[b:]
  # 2. one state object instead of nodes/head/tail/nextId
  pat = r"  const \[nodes, setNodes\] = useState<\w+\[\]>\(\[\]\)\n  const \[head, setHead\] = useState<number \| null>\(null\)\n" + (r"  const \[tail, setTail\] = useState<number \| null>\(null\)\n" if c["tail"] else "")
  s, n = re.subn(pat, f"  const [list, setList] = useState<{c['State']}>(ll.{c['EMPTY']})\n  const {{ nodes, head{', tail' if c['tail'] else ''} }} = list\n", s); assert n == 1, (mod, "state")
  s, n = re.subn(r"  const \[nextId, setNextId\] = useState<number>\(1\)\n", "", s); assert n == 1
  # 3. handlers
  a = s.index("  const addStep = ("); b = s.index("  const togglePlay = () => {")
  s = s[:a] + handlers(c) + s[b:]
  # 4. render: cycle-safe walk from the engine
  a = s.index("    // Build the linked list order"); b = s.index("\n    return (", a)
  s = s[:a] + f"    // Build the linked list order (cycle-safe walk along next pointers)\n    const orderedNodes: {c['Node']}[] = ll.orderFrom(displayNodes, displayHead)\n" + s[b:]
  # 5. id checks against null instead of truthiness
  s = s.replace("displayHead ? `Node ${displayHead}`", "displayHead !== null ? `Node ${displayHead}`")
  s = s.replace("displayTail ? `Node ${displayTail}`", "displayTail !== null ? `Node ${displayTail}`")
  s = s.replace("node.next ? `→${node.next}`", "node.next !== null ? `→${node.next}`")
  s = s.replace("node.prev ? `${node.prev}←`", "node.prev !== null ? `${node.prev}←`")
  s = s.replace(f"{c['code']}.map((line, index)", f"{c['code']}.map((line, index)")
  open(p, "w", encoding="utf8").write(s)
  print(mod, "ok")
