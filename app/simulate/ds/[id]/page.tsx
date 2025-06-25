"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StackOperationsVisualizer from "@/components/stack-operations-visualizer"
import LinearQueueVisualizer from "@/components/linear-queue-visualizer"
import CircularQueueVisualizer from "@/components/circular-queue-visualizer"
import DoubleEndedQueueVisualizer from "@/components/double-ended-queue-visualizer"
import PriorityQueueVisualizer from "@/components/priority-queue-visualizer"
import SingleLinkListVisualizer from "@/components/singly-linked-list-visualizer"

interface Option {
  key: string
  name: string
  description: string
}

const dataStructureOptions: Record<string, Option[]> = {
  stack: [
    {
      key: "stackOperations",
      name: "Stack Operations",
      description: "Interactive Push, Pop, and Peek operations with LIFO principle visualization.",
    },
  ],
  queue: [
    {
      key: "linearQueue",
      name: "Linear Queue",
      description: "Basic queue operations with FIFO principle.",
    },
    {
      key: "circularQueue",
      name: "Circular Queue",
      description: "Circular queue implementation with efficient space utilization.",
    },
    {
      key: "dequeue",
      name: "Double-ended Queue",
      description: "Queue that allows insertion and deletion at both ends.",
    },
    {
      key: "priorityQueue",
      name: "Priority Queue",
      description: "Queue where elements are served based on priority.",
    },
  ],
  linkedlist: [
    {
      key: "singlyLinkedList",
      name: "Singly Linked List",
      description: "Basic linked list with forward traversal only.",
    },
    {
      key: "doublyLinkedList",
      name: "Doubly Linked List",
      description: "Linked list with bidirectional traversal capability.",
    },
    {
      key: "circularLinkedList",
      name: "Circular Linked List",
      description: "Linked list where the last node points to the first node.",
    },
    {
      key: "circularDoublyLinkedList",
      name: "Circular Doubly Linked List",
      description: "Doubly linked list with circular connections.",
    },
  ],
  bst: [
    {
      key: "insertion",
      name: "BST Insertion",
      description: "Insert elements into a Binary Search Tree.",
    },
    {
      key: "search",
      name: "BST Search",
      description: "Search for elements in a Binary Search Tree.",
    },
    {
      key: "inorder",
      name: "Inorder Traversal",
      description: "Left-Root-Right traversal of BST.",
    },
    {
      key: "preorder",
      name: "Preorder Traversal",
      description: "Root-Left-Right traversal of BST.",
    },
    {
      key: "postorder",
      name: "Postorder Traversal",
      description: "Left-Right-Root traversal of BST.",
    },
  ],
  graph: [
    {
      key: "dfs",
      name: "Depth-First Search",
      description: "Explore graph by going as deep as possible before backtracking.",
    },
    {
      key: "bfs",
      name: "Breadth-First Search",
      description: "Explore graph level by level using a queue.",
    },
  ],
  hashing: [
    {
      key: "linearProbing",
      name: "Linear Probing",
      description: "Collision resolution using linear search for next available slot.",
    },
    {
      key: "quadraticProbing",
      name: "Quadratic Probing",
      description: "Collision resolution using quadratic function for next slot.",
    },
  ],
  "sorting-ds": [
    {
      key: "bubbleSort",
      name: "Bubble Sort",
      description: "Simple sorting algorithm that repeatedly steps through the list.",
    },
    {
      key: "mergeSortDS",
      name: "Merge Sort",
      description: "Divide and conquer sorting algorithm.",
    },
    {
      key: "quickSortDS",
      name: "Quick Sort",
      description: "Efficient sorting algorithm using partitioning.",
    },
  ],
  sets: [
    {
      key: "union",
      name: "Set Union",
      description: "Combine elements from two sets.",
    },
    {
      key: "intersection",
      name: "Set Intersection",
      description: "Find common elements between two sets.",
    },
    {
      key: "difference",
      name: "Set Difference",
      description: "Find elements in one set but not in another.",
    },
  ],
}

const categoryNames: Record<string, string> = {
  stack: "Stack Operations",
  queue: "Queue Operations",
  linkedlist: "Linked List Operations",
  bst: "Binary Search Tree",
  graph: "Graph Traversals",
  hashing: "Hashing Techniques",
  "sorting-ds": "Sorting Algorithms",
  sets: "Set Operations",
}

export default function DataStructureSimulationPage() {
  const params = useParams()
  const id = params?.id as string
  const [selectedSubOperation, setSelectedSubOperation] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("visualization")

  const subOptions = dataStructureOptions[id] || []
  const categoryName = categoryNames[id] || id

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-purple-700">
              Algo-Sim
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-purple-700">
                Home
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-purple-700">
                Dashboard
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-purple-700">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/dashboard/ds" className="inline-flex items-center text-purple-600 hover:text-purple-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Data Structures
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
          <p className="text-gray-600">Select an operation to visualize</p>
        </div>

        {/* Operation Selection */}
        {subOptions.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {subOptions.map((option, index) => (
                <motion.div
                  key={option.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Button
                    variant={selectedSubOperation === option.key ? "default" : "outline"}
                    className={`w-full h-auto py-3 px-4 justify-start text-left ${
                      selectedSubOperation === option.key
                        ? "bg-purple-600 text-white"
                        : "bg-white hover:bg-purple-50 hover:text-purple-700"
                    }`}
                    onClick={() => setSelectedSubOperation(option.key)}
                  >
                    <div>
                      <div className="font-medium">{option.name}</div>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Simulation Content */}
        {selectedSubOperation ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle>{subOptions.find((o) => o.key === selectedSubOperation)?.name}</CardTitle>
                <CardDescription className="text-purple-100">
                  {subOptions.find((o) => o.key === selectedSubOperation)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="visualization" className="w-full" onValueChange={setActiveTab}>
                  <div className="border-b">
                    <TabsList className="w-full justify-start rounded-none h-12 bg-gray-50 px-6">
                      <TabsTrigger value="visualization" className="data-[state=active]:bg-white">
                        Visualization
                      </TabsTrigger>
                      <TabsTrigger value="explanation" className="data-[state=active]:bg-white">
                        Explanation
                      </TabsTrigger>
                      <TabsTrigger value="code" className="data-[state=active]:bg-white">
                        Code
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="visualization" className="p-0 m-0">
                    <div className="p-6">
                      {selectedSubOperation === "stackOperations" ? (
                        <StackOperationsVisualizer />
                      ) : selectedSubOperation === "linearQueue" ? (
                        <LinearQueueVisualizer />
                      ) : selectedSubOperation === "circularQueue" ? (
                        <CircularQueueVisualizer />
                      ) : selectedSubOperation === "dequeue" ? (
                        <DoubleEndedQueueVisualizer />
                      ) : selectedSubOperation === "priorityQueue" ? (
                        <PriorityQueueVisualizer />
                      ) : selectedSubOperation === "singlyLinkedList" ? (
                        <SingleLinkListVisualizer />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <Info className="h-8 w-8 text-purple-600" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                          <p className="text-gray-600 max-w-md">
                            The visualization for {subOptions.find((o) => o.key === selectedSubOperation)?.name} is
                            under development.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Explanation Tab */}
                  <TabsContent value="explanation" className="p-6 m-0">
                    {selectedSubOperation === "stackOperations" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Stack Operations Work</h3>
                        <p>A Stack is a linear data structure that follows the Last In First Out (LIFO) principle:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Push:</strong> Add an element to the top of the stack.
                          </li>
                          <li>
                            <strong>Pop:</strong> Remove and return the top element from the stack.
                          </li>
                          <li>
                            <strong>Peek/Top:</strong> View the top element without removing it.
                          </li>
                          <li>
                            <strong>isEmpty:</strong> Check if the stack is empty.
                          </li>
                        </ol>

                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Push: O(1)</li>
                          <li>Pop: O(1)</li>
                          <li>Peek: O(1)</li>
                          <li>isEmpty: O(1)</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>O(n) where n is the number of elements in the stack.</p>

                        <h4 className="text-lg font-semibold mt-4">Applications</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Function call management (call stack)</li>
                          <li>Expression evaluation and syntax parsing</li>
                          <li>Undo operations in applications</li>
                          <li>Browser history management</li>
                          <li>Backtracking algorithms</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Simple and easy to implement</li>
                          <li>Efficient memory usage</li>
                          <li>Fast operations (all O(1))</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Limited access (only top element)</li>
                          <li>No random access to elements</li>
                          <li>Fixed size in array implementation</li>
                        </ul>
                      </div>
                    ) : selectedSubOperation === "linearQueue" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Linear Queue Works</h3>
                        <p>
                          A Linear Queue is a linear data structure that follows the First In First Out (FIFO)
                          principle:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Enqueue:</strong> Add an element to the rear of the queue.
                          </li>
                          <li>
                            <strong>Dequeue:</strong> Remove and return the front element from the queue.
                          </li>
                          <li>
                            <strong>Peek/Front:</strong> View the front element without removing it.
                          </li>
                          <li>
                            <strong>isEmpty:</strong> Check if the queue is empty.
                          </li>
                          <li>
                            <strong>isFull:</strong> Check if the queue is full.
                          </li>
                        </ol>

                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Enqueue: O(1)</li>
                          <li>Dequeue: O(1)</li>
                          <li>Peek: O(1)</li>
                          <li>isEmpty: O(1)</li>
                          <li>isFull: O(1)</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>O(n) where n is the maximum size of the queue.</p>

                        <h4 className="text-lg font-semibold mt-4">Applications</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Process scheduling in operating systems</li>
                          <li>Handling requests in web servers</li>
                          <li>Breadth-first search in graphs</li>
                          <li>Print queue management</li>
                          <li>Buffer for data streams</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Simple implementation</li>
                          <li>Fast operations (all O(1))</li>
                          <li>Maintains order of elements</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Memory wastage (dequeued positions cannot be reused)</li>
                          <li>Fixed size limitation</li>
                          <li>False full condition (queue appears full even with empty spaces)</li>
                        </ul>
                      </div>
                    ) : selectedSubOperation === "circularQueue" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Circular Queue Works</h3>
                        <p>
                          A Circular Queue is an improvement over linear queue that connects the rear end back to the
                          front end, forming a circle:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Enqueue:</strong> Add element at rear position using modulo arithmetic: rear = (rear
                            + 1) % size
                          </li>
                          <li>
                            <strong>Dequeue:</strong> Remove element from front and move front circularly: front =
                            (front + 1) % size
                          </li>
                          <li>
                            <strong>Peek:</strong> View the front element without removing it.
                          </li>
                          <li>
                            <strong>isFull:</strong> Check if count equals maximum size.
                          </li>
                          <li>
                            <strong>isEmpty:</strong> Check if count equals zero.
                          </li>
                        </ol>

                        <h4 className="text-lg font-semibold mt-6">Key Improvements over Linear Queue</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>No memory wastage - reuses dequeued positions</li>
                          <li>No false full condition</li>
                          <li>Efficient space utilization</li>
                          <li>Uses modulo arithmetic for circular movement</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Time Complexity</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Enqueue: O(1)</li>
                          <li>Dequeue: O(1)</li>
                          <li>Peek: O(1)</li>
                          <li>isEmpty/isFull: O(1)</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Applications</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>CPU scheduling in round-robin algorithms</li>
                          <li>Memory management in operating systems</li>
                          <li>Traffic light systems</li>
                          <li>Circular buffer for streaming data</li>
                          <li>Producer-consumer problems</li>
                        </ul>
                      </div>
                    ) : selectedSubOperation === "dequeue" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Double-Ended Queue (Deque) Works</h3>
                        <p>
                          A Double-Ended Queue (Deque) is a linear data structure that allows insertion and deletion at
                          both ends, combining the features of both stack and queue:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Add Front:</strong> Insert element at the front using circular arithmetic: front =
                            (front - 1 + size) % size
                          </li>
                          <li>
                            <strong>Add Rear:</strong> Insert element at the rear using circular arithmetic: rear =
                            (rear + 1) % size
                          </li>
                          <li>
                            <strong>Remove Front:</strong> Delete element from front and move front circularly
                          </li>
                          <li>
                            <strong>Remove Rear:</strong> Delete element from rear and move rear circularly
                          </li>
                          <li>
                            <strong>Peek Front/Rear:</strong> View elements at either end without removing
                          </li>
                        </ol>

                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Add Front/Rear: O(1)</li>
                          <li>Remove Front/Rear: O(1)</li>
                          <li>Peek Front/Rear: O(1)</li>
                          <li>isEmpty/isFull: O(1)</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>O(n) where n is the maximum size of the deque.</p>

                        <h4 className="text-lg font-semibold mt-4">Applications</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Palindrome checking algorithms</li>
                          <li>Sliding window maximum/minimum problems</li>
                          <li>Undo-redo operations in applications</li>
                          <li>Browser history navigation (forward/backward)</li>
                          <li>Implementing both stack and queue with single data structure</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Flexible insertion and deletion at both ends</li>
                          <li>Efficient space utilization with circular implementation</li>
                          <li>Can function as both stack and queue</li>
                          <li>All operations are O(1)</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>More complex implementation than simple queue</li>
                          <li>No random access to middle elements</li>
                          <li>Fixed size limitation in array implementation</li>
                        </ul>
                      </div>
                    ) : selectedSubOperation === "priorityQueue" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Priority Queue Works</h3>
                        <p>
                          A Priority Queue is an abstract data type where each element has a priority. Elements are
                          served based on their priority rather than their insertion order:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Enqueue:</strong> Insert element with priority, maintaining heap property through
                            heapify-up
                          </li>
                          <li>
                            <strong>Dequeue:</strong> Remove element with highest (Max Heap) or lowest (Min Heap)
                            priority
                          </li>
                          <li>
                            <strong>Peek:</strong> View the element with highest/lowest priority without removing it
                          </li>
                          <li>
                            <strong>Heapify Up:</strong> Restore heap property after insertion by comparing with parent
                          </li>
                          <li>
                            <strong>Heapify Down:</strong> Restore heap property after deletion by comparing with
                            children
                          </li>
                        </ol>

                        <h4 className="text-lg font-semibold mt-6">Heap Types</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            <strong>Max Heap:</strong> Parent ≥ Children (highest priority served first)
                          </li>
                          <li>
                            <strong>Min Heap:</strong> Parent ≤ Children (lowest priority served first)
                          </li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Time Complexity</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Enqueue: O(log n) - due to heapify up</li>
                          <li>Dequeue: O(log n) - due to heapify down</li>
                          <li>Peek: O(1) - root element access</li>
                          <li>Build Heap: O(n)</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>O(n) where n is the number of elements in the priority queue.</p>

                        <h4 className="text-lg font-semibold mt-4">Applications</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>CPU task scheduling in operating systems</li>
                          <li>Dijkstra's shortest path algorithm</li>
                          <li>A* pathfinding algorithm</li>
                          <li>Huffman coding for data compression</li>
                          <li>Emergency room patient triage systems</li>
                          <li>Event simulation systems</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Efficient priority-based access</li>
                          <li>Logarithmic time complexity for main operations</li>
                          <li>Dynamic size (can grow/shrink)</li>
                          <li>Optimal for priority-based scheduling</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>No random access to arbitrary elements</li>
                          <li>More complex than simple queue</li>
                          <li>Requires additional memory for heap structure</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-600">
                          Explanation for {subOptions.find((o) => o.key === selectedSubOperation)?.name} will be
                          available soon.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Code Tab */}
                  <TabsContent value="code" className="p-6 m-0">
                    {selectedSubOperation === "stackOperations" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`class Stack {
  constructor() {
    this.items = [];
    this.top = -1;
  }

  // Push operation - Add element to top
  push(element) {
    this.top++;
    this.items[this.top] = element;
    console.log(\`Pushed \${element} to stack\`);
  }

  // Pop operation - Remove and return top element
  pop() {
    if (this.isEmpty()) {
      console.log("Stack is empty");
      return null;
    }
    const poppedElement = this.items[this.top];
    this.top--;
    console.log(\`Popped \${poppedElement} from stack\`);
    return poppedElement;
  }

  // Peek operation - View top element without removing
  peek() {
    if (this.isEmpty()) {
      console.log("Stack is empty");
      return null;
    }
    return this.items[this.top];
  }

  // Check if stack is empty
  isEmpty() {
    return this.top === -1;
  }

  // Get stack size
  size() {
    return this.top + 1;
  }

  // Display stack contents
  display() {
    if (this.isEmpty()) {
      console.log("Stack is empty");
      return;
    }
    console.log("Stack contents:", this.items.slice(0, this.top + 1));
  }
}

// Example usage:
const stack = new Stack();
stack.push(10);
stack.push(20);
stack.push(30);
console.log("Top element:", stack.peek()); // 30
stack.pop(); // Removes 30
console.log("Top element:", stack.peek()); // 20`}</code>
                        </pre>
                      </div>
                    ) : selectedSubOperation === "linearQueue" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`class LinearQueue {
  constructor(size = 10) {
    this.items = new Array(size);
    this.front = -1;
    this.rear = -1;
    this.maxSize = size;
  }

  // Enqueue operation - Add element to rear
  enqueue(element) {
    if (this.isFull()) {
      console.log("Queue is full");
      return false;
    }
    
    if (this.isEmpty()) {
      this.front = 0;
    }
    
    this.rear++;
    this.items[this.rear] = element;
    console.log(\`Enqueued \${element} to queue\`);
    return true;
  }

  // Dequeue operation - Remove and return front element
  dequeue() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return null;
    }
    
    const dequeuedElement = this.items[this.front];
    this.items[this.front] = undefined;
    
    if (this.front === this.rear) {
      // Queue becomes empty
      this.front = this.rear = -1;
    } else {
      this.front++;
    }
    
    console.log(\`Dequeued \${dequeuedElement} from queue\`);
    return dequeuedElement;
  }

  // Peek operation - View front element without removing
  peek() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return null;
    }
    return this.items[this.front];
  }

  // Check if queue is empty
  isEmpty() {
    return this.front === -1;
  }

  // Check if queue is full
  isFull() {
    return this.rear === this.maxSize - 1;
  }

  // Get queue size
  size() {
    if (this.isEmpty()) return 0;
    return this.rear - this.front + 1;
  }

  // Display queue contents
  display() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return;
    }
    const elements = [];
    for (let i = this.front; i <= this.rear; i++) {
      elements.push(this.items[i]);
    }
    console.log("Queue contents:", elements);
  }
}

// Example usage:
const queue = new LinearQueue(5);
queue.enqueue(10);
queue.enqueue(20);
queue.enqueue(30);
console.log("Front element:", queue.peek()); // 10
queue.dequeue(); // Removes 10
console.log("Front element:", queue.peek()); // 20`}</code>
                        </pre>
                      </div>
                    ) : selectedSubOperation === "circularQueue" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`class CircularQueue {
  constructor(size = 10) {
    this.items = new Array(size);
    this.front = -1;
    this.rear = -1;
    this.maxSize = size;
    this.count = 0;
  }

  // Enqueue operation - Add element to rear
  enqueue(element) {
    if (this.isFull()) {
      console.log("Queue is full");
      return false;
    }
    
    if (this.isEmpty()) {
      this.front = 0;
      this.rear = 0;
    } else {
      this.rear = (this.rear + 1) % this.maxSize;
    }
    
    this.items[this.rear] = element;
    this.count++;
    console.log(\`Enqueued \${element} to circular queue\`);
    return true;
  }

  // Dequeue operation - Remove and return front element
  dequeue() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return null;
    }
    
    const dequeuedElement = this.items[this.front];
    this.items[this.front] = undefined;
    this.count--;
    
    if (this.isEmpty()) {
      this.front = this.rear = -1;
    } else {
      this.front = (this.front + 1) % this.maxSize;
    }
    
    console.log(\`Dequeued \${dequeuedElement} from circular queue\`);
    return dequeuedElement;
  }

  // Peek operation - View front element without removing
  peek() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return null;
    }
    return this.items[this.front];
  }

  // Check if queue is empty
  isEmpty() {
    return this.count === 0;
  }

  // Check if queue is full
  isFull() {
    return this.count === this.maxSize;
  }

  // Get queue size
  size() {
    return this.count;
  }

  // Display queue contents
  display() {
    if (this.isEmpty()) {
      console.log("Queue is empty");
      return;
    }
    
    const elements = [];
    let i = this.front;
    let itemCount = 0;
    
    while (itemCount < this.count) {
      elements.push(this.items[i]);
      i = (i + 1) % this.maxSize;
      itemCount++;
    }
    
    console.log("Circular Queue contents:", elements);
  }
}

// Example usage:
const circularQueue = new CircularQueue(5);
circularQueue.enqueue(10);
circularQueue.enqueue(20);
circularQueue.enqueue(30);
console.log("Front element:", circularQueue.peek()); // 10
circularQueue.dequeue(); // Removes 10
console.log("Front element:", circularQueue.peek()); // 20

// Fill the queue completely
circularQueue.enqueue(40);
circularQueue.enqueue(50);
circularQueue.enqueue(60); // Queue is now full

// Dequeue some elements and enqueue new ones
circularQueue.dequeue(); // Remove 20
circularQueue.dequeue(); // Remove 30
circularQueue.enqueue(70); // Reuses position 0
circularQueue.enqueue(80); // Reuses position 1`}</code>
                        </pre>
                      </div>
                    ) : selectedSubOperation === "dequeue" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`class DoubleEndedQueue {
constructor(size = 10) {
  this.items = new Array(size);
  this.front = -1;
  this.rear = -1;
  this.maxSize = size;
  this.count = 0;
}

// Add element to front
addFront(element) {
  if (this.isFull()) {
    console.log("Deque is full");
    return false;
  }
  
  if (this.isEmpty()) {
    this.front = this.rear = 0;
  } else {
    this.front = (this.front - 1 + this.maxSize) % this.maxSize;
  }
  
  this.items[this.front] = element;
  this.count++;
  console.log(\`Added \${element} to front\`);
  return true;
}

// Add element to rear
addRear(element) {
  if (this.isFull()) {
    console.log("Deque is full");
    return false;
  }
  
  if (this.isEmpty()) {
    this.front = this.rear = 0;
  } else {
    this.rear = (this.rear + 1) % this.maxSize;
  }
  
  this.items[this.rear] = element;
  this.count++;
  console.log(\`Added \${element} to rear\`);
  return true;
}

// Remove element from front
removeFront() {
  if (this.isEmpty()) {
    console.log("Deque is empty");
    return null;
  }
  
  const element = this.items[this.front];
  this.items[this.front] = undefined;
  this.count--;
  
  if (this.isEmpty()) {
    this.front = this.rear = -1;
  } else {
    this.front = (this.front + 1) % this.maxSize;
  }
  
  console.log(\`Removed \${element} from front\`);
  return element;
}

// Remove element from rear
removeRear() {
  if (this.isEmpty()) {
    console.log("Deque is empty");
    return null;
  }
  
  const element = this.items[this.rear];
  this.items[this.rear] = undefined;
  this.count--;
  
  if (this.isEmpty()) {
    this.front = this.rear = -1;
  } else {
    this.rear = (this.rear - 1 + this.maxSize) % this.maxSize;
  }
  
  console.log(\`Removed \${element} from rear\`);
  return element;
}

// Peek front element
peekFront() {
  if (this.isEmpty()) {
    console.log("Deque is empty");
    return null;
  }
  return this.items[this.front];
}

// Peek rear element
peekRear() {
  if (this.isEmpty()) {
    console.log("Deque is empty");
    return null;
  }
  return this.items[this.rear];
}

// Check if deque is empty
isEmpty() {
  return this.count === 0;
}

// Check if deque is full
isFull() {
  return this.count === this.maxSize;
}

// Get deque size
size() {
  return this.count;
}
}

// Example usage:
const deque = new DoubleEndedQueue(5);
deque.addRear(10);
deque.addFront(5);
deque.addRear(20);
console.log("Front:", deque.peekFront()); // 5
console.log("Rear:", deque.peekRear());   // 20
deque.removeFront(); // Removes 5
deque.removeRear();  // Removes 20`}</code>
                        </pre>
                      </div>
                    ) : selectedSubOperation === "priorityQueue" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`class PriorityQueue {
constructor(isMaxHeap = true) {
  this.heap = [];
  this.isMaxHeap = isMaxHeap;
}

// Add element with priority
enqueue(value, priority) {
  const element = { value, priority };
  this.heap.push(element);
  this.heapifyUp(this.heap.length - 1);
  console.log(\`Enqueued \${value} with priority \${priority}\`);
}

// Remove highest/lowest priority element
dequeue() {
  if (this.isEmpty()) {
    console.log("Priority queue is empty");
    return null;
  }
  
  if (this.heap.length === 1) {
    return this.heap.pop();
  }
  
  const root = this.heap[0];
  this.heap[0] = this.heap.pop();
  this.heapifyDown(0);
  
  console.log(\`Dequeued \${root.value} with priority \${root.priority}\`);
  return root;
}

// View highest/lowest priority element
peek() {
  if (this.isEmpty()) {
    console.log("Priority queue is empty");
    return null;
  }
  return this.heap[0];
}

// Restore heap property upward
heapifyUp(index) {
  if (index === 0) return;
  
  const parentIndex = Math.floor((index - 1) / 2);
  if (this.compare(index, parentIndex)) {
    this.swap(index, parentIndex);
    this.heapifyUp(parentIndex);
  }
}

// Restore heap property downward
heapifyDown(index) {
  const leftChild = 2 * index + 1;
  const rightChild = 2 * index + 2;
  let targetIndex = index;
  
  if (leftChild < this.heap.length && 
      this.compare(leftChild, targetIndex)) {
    targetIndex = leftChild;
  }
  
  if (rightChild < this.heap.length && 
      this.compare(rightChild, targetIndex)) {
    targetIndex = rightChild;
  }
  
  if (targetIndex !== index) {
    this.swap(index, targetIndex);
    this.heapifyDown(targetIndex);
  }
}

// Compare elements based on heap type
compare(i, j) {
  return this.isMaxHeap ? 
    this.heap[i].priority > this.heap[j].priority :
    this.heap[i].priority < this.heap[j].priority;
}

// Swap two elements
swap(i, j) {
  [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
}

// Check if queue is empty
isEmpty() {
  return this.heap.length === 0;
}

// Get queue size
size() {
  return this.heap.length;
}
}

// Example usage:
const maxPQ = new PriorityQueue(true);  // Max heap
maxPQ.enqueue("Task A", 3);
maxPQ.enqueue("Task B", 1);
maxPQ.enqueue("Task C", 5);
console.log("Next task:", maxPQ.peek()); // Task C (priority 5)
maxPQ.dequeue(); // Removes Task C

const minPQ = new PriorityQueue(false); // Min heap
minPQ.enqueue("Emergency", 1);
minPQ.enqueue("Routine", 5);
minPQ.enqueue("Urgent", 2);
console.log("Next patient:", minPQ.peek()); // Emergency (priority 1)`}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-600">
                          Code implementation for {subOptions.find((o) => o.key === selectedSubOperation)?.name} will be
                          available soon.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="border border-dashed border-gray-300 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select an Operation</h3>
              <p className="text-gray-600 max-w-md">
                Choose an operation from the options above to view its visualization and explanation.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Algo-Sim. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
