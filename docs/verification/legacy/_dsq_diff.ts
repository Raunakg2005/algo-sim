// Differential check: the new engines (lib/engines/*.ts) against the verbatim legacy handlers, frame by frame.
// Fields compared: everything except activeCodeLine (deliberately fixed) and, for the priority queue in Min Heap
// mode, the word highest -> lowest in captions (deliberately fixed). Anything else that differs is reported.
import { rng, int } from "./_dsq_util.ts"
import { makeLegacy as legacyStack } from "./stack/legacy.ts"
import { makeLegacy as legacyLinear } from "./linear-queue/legacy.ts"
import { makeLegacy as legacyCircular } from "./circular-queue/legacy.ts"
import { makeLegacy as legacyDeque } from "./deque/legacy.ts"
import { makeLegacy as legacyPQ } from "./priority-queue/legacy.ts"
import * as St from "file:///lib/engines/stack.ts"
import * as Lq from "file:///lib/engines/linear-queue.ts"
import * as Cq from "file:///lib/engines/circular-queue.ts"
import * as Dq from "file:///lib/engines/deque.ts"
import * as Pq from "file:///lib/engines/priority-queue.ts"

const strip = (fs: { activeCodeLine: number }[], fixCaption = false) =>
  JSON.stringify(fs.map((f) => {
    const { activeCodeLine: _ignored, ...rest } = f as { activeCodeLine: number; description?: string }
    if (fixCaption && typeof rest.description === "string") rest.description = rest.description.replace(/highest/g, "lowest").replace(/Highest/g, "Lowest")
    return rest
  }))

const r = rng(31337)
const N = 5000
const diffs: Record<string, number> = { stack: 0, "linear-queue": 0, "circular-queue": 0, deque: 0, "priority-queue": 0 }
const first: Record<string, string> = {}
const note = (m: string, msg: string) => { diffs[m]++; first[m] ??= msg }

for (let t = 0; t < N; t++) {
  // stack
  {
    const ui = legacyStack(); let s = St.createStack()
    for (let i = int(r, 1, 30); i > 0; i--) {
      const x = r(); const before = ui.steps.length; let res: St.StackResult
      if (x < 0.55) { const v = int(r, -20, 20); ui.type(String(v)); ui.pushElement(); res = St.push(s, v) }
      else if (x < 0.8) { ui.popElement(); res = St.pop(s) } else { ui.peekElement(); res = St.peek(s) }
      s = res.state
      if (strip(ui.steps.slice(before)) !== strip(res.steps)) { note("stack", strip(ui.steps.slice(before)) + " vs " + strip(res.steps)); break }
    }
  }
  // linear queue
  {
    const cap = int(r, 1, 20); const ui = legacyLinear(cap); let s = Lq.createLinearQueue(cap)
    for (let i = int(r, 1, 30); i > 0; i--) {
      const x = r(); const before = ui.steps.length; let res: Lq.LinearQueueResult
      if (x < 0.5) { const v = int(r, -20, 20); ui.type(String(v)); ui.enqueueElement(); res = Lq.enqueue(s, v) }
      else if (x < 0.8) { ui.dequeueElement(); res = Lq.dequeue(s) } else { ui.peekElement(); res = Lq.peek(s) }
      s = res.state
      if (strip(ui.steps.slice(before)) !== strip(res.steps)) { note("linear-queue", strip(ui.steps.slice(before)) + " vs " + strip(res.steps)); break }
    }
  }
  // circular queue
  {
    const cap = int(r, 2, 12); const ui = legacyCircular(cap); let s = Cq.createCircularQueue(cap)
    for (let i = int(r, 1, 40); i > 0; i--) {
      const x = r(); const before = ui.steps.length; let res: Cq.CircularQueueResult
      if (x < 0.5) { const v = int(r, -20, 20); ui.type(String(v)); ui.enqueueElement(); res = Cq.enqueue(s, v) }
      else if (x < 0.85) { ui.dequeueElement(); res = Cq.dequeue(s) } else { ui.peekElement(); res = Cq.peek(s) }
      s = res.state
      if (strip(ui.steps.slice(before)) !== strip(res.steps)) { note("circular-queue", strip(ui.steps.slice(before)) + " vs " + strip(res.steps)); break }
    }
  }
  // deque
  {
    const cap = int(r, 2, 12); const ui = legacyDeque(cap); let s = Dq.createDeque(cap)
    for (let i = int(r, 1, 40); i > 0; i--) {
      const x = r(); const before = ui.steps.length; let res: Dq.DequeResult
      if (x < 0.5) {
        const v = int(r, -20, 20); ui.type(String(v))
        if (x < 0.25) { ui.addFront(); res = Dq.addFront(s, v) } else { ui.addRear(); res = Dq.addRear(s, v) }
      } else if (x < 0.68) { ui.removeFront(); res = Dq.removeFront(s) }
      else if (x < 0.86) { ui.removeRear(); res = Dq.removeRear(s) }
      else if (x < 0.93) { ui.peekFront(); res = Dq.peekFront(s) } else { ui.peekRear(); res = Dq.peekRear(s) }
      s = res.state
      if (strip(ui.steps.slice(before)) !== strip(res.steps)) { note("deque", strip(ui.steps.slice(before)) + " vs " + strip(res.steps)); break }
    }
  }
  // priority queue
  {
    const isMax = r() < 0.5; const ui = legacyPQ(isMax); let s = Pq.createPriorityQueue(isMax)
    for (let i = int(r, 1, 30); i > 0; i--) {
      const x = r(); const before = ui.steps.length; let res: Pq.PriorityQueueResult
      if (x < 0.6) { const v = int(r, -20, 20), p = int(r, -3, 6); ui.type(String(v), String(p)); ui.enqueueElement(); res = Pq.enqueue(s, v, p) }
      else if (x < 0.88) { ui.dequeueElement(); res = Pq.dequeue(s) } else { ui.peekElement(); res = Pq.peek(s) }
      s = res.state
      if (strip(ui.steps.slice(before), !isMax) !== strip(res.steps)) { note("priority-queue", strip(ui.steps.slice(before), !isMax) + " vs " + strip(res.steps)); break }
    }
  }
}
console.log(`differential legacy vs engine, ${N} random sequences per module (frames compared except activeCodeLine / min-heap wording):`)
for (const [m, c] of Object.entries(diffs)) console.log(`  ${m}: ${c} sequences differ${c ? " e.g. " + first[m].slice(0, 400) : ""}`)
