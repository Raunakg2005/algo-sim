// Oracle for the circular-doubly-linked-list module: the shared array model / pointer checker (singly-linked-list.ts)
// instantiated with this list's invariants.
export * from "./singly-linked-list"
import type { Kind } from "./singly-linked-list"

export const KIND: Kind = { doubly: true, circular: true, hasTail: true }
