"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Hash,
  LinkIcon,
  List,
  Search,
  SquareStackIcon as Stack,
  TreePine,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const dataStructures = [
  {
    id: "stack",
    name: "Stack Operations",
    description: "Push, Pop, Peek operations with LIFO principle",
    icon: <Stack className="h-8 w-8 text-blue-500" />,
    color: "border-blue-200 hover:border-blue-400 bg-blue-50",
    operations: ["Push", "Pop", "Peek"],
  },
  {
    id: "queue",
    name: "Queue Operations",
    description: "Linear Queue, Circular Queue, Dequeue, Priority Queue",
    icon: <List className="h-8 w-8 text-green-500" />,
    color: "border-green-200 hover:border-green-400 bg-green-50",
    operations: ["Linear Queue", "Circular Queue", "Dequeue", "Priority Queue"],
  },
  {
    id: "linkedlist",
    name: "Linked List Operations",
    description: "Singly, Doubly, Circular, and Circular Doubly Linked Lists",
    icon: <LinkIcon className="h-8 w-8 text-purple-500" />,
    color: "border-purple-200 hover:border-purple-400 bg-purple-50",
    operations: ["Singly Linked List", "Doubly Linked List", "Circular Linked List", "Circular Doubly Linked List"],
  },
  {
    id: "bst",
    name: "Binary Search Tree",
    description: "Insertion, Search, and Tree Traversals",
    icon: <TreePine className="h-8 w-8 text-orange-500" />,
    color: "border-orange-200 hover:border-orange-400 bg-orange-50",
    operations: ["Insertion", "Search", "Inorder", "Preorder", "Postorder"],
  },
  {
    id: "graph",
    name: "Graph Traversals",
    description: "Depth-First Search (DFS) and Breadth-First Search (BFS)",
    icon: <Search className="h-8 w-8 text-red-500" />,
    color: "border-red-200 hover:border-red-400 bg-red-50",
    operations: ["Depth-First Search", "Breadth-First Search"],
  },
  {
    id: "hashing",
    name: "Hashing Techniques",
    description: "Linear Probing and Quadratic Probing",
    icon: <Hash className="h-8 w-8 text-indigo-500" />,
    color: "border-indigo-200 hover:border-indigo-400 bg-indigo-50",
    operations: ["Linear Probing", "Quadratic Probing"],
  },
  {
    id: "sorting-ds",
    name: "Sorting Algorithms",
    description: "Bubble Sort, Merge Sort, Quick Sort",
    icon: <Database className="h-8 w-8 text-teal-500" />,
    color: "border-teal-200 hover:border-teal-400 bg-teal-50",
    operations: ["Bubble Sort", "Merge Sort", "Quick Sort"],
  },
  {
    id: "sets",
    name: "Set Operations",
    description: "Union, Intersection, and Difference operations",
    icon: <Database className="h-8 w-8 text-pink-500" />,
    color: "border-pink-200 hover:border-pink-400 bg-pink-50",
    operations: ["Union", "Intersection", "Difference"],
  },
]

export default function DataStructuresDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
            <div className="md:hidden">
              <button className="text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Data Structures (DS)</h1>
          <p className="text-gray-600">Select a data structure to explore and visualize its operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dataStructures.map((ds, index) => (
            <motion.div
              key={ds.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`border-2 transition-all duration-300 ${ds.color} h-full`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {ds.icon}
                    <div>
                      <CardTitle className="text-lg">{ds.name}</CardTitle>
                      <CardDescription className="mt-1 text-sm">Interactive visualization</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">{ds.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-700">Operations:</p>
                    <div className="flex flex-wrap gap-1">
                      {ds.operations.slice(0, 3).map((op, idx) => (
                        <span key={idx} className="text-xs bg-white/70 px-2 py-1 rounded">
                          {op}
                        </span>
                      ))}
                      {ds.operations.length > 3 && (
                        <span className="text-xs bg-white/70 px-2 py-1 rounded">+{ds.operations.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/simulate/ds/${ds.id}`} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm">
                      Explore
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-2">Learning Path</h2>
          <p className="text-gray-600 mb-4">Recommended order for learning data structures</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                1
              </div>
              <p className="text-sm font-medium">Stack & Queue</p>
              <p className="text-xs text-gray-600">Basic operations</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                2
              </div>
              <p className="text-sm font-medium">Linked Lists</p>
              <p className="text-xs text-gray-600">Dynamic structures</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                3
              </div>
              <p className="text-sm font-medium">Trees & BST</p>
              <p className="text-xs text-gray-600">Hierarchical data</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                4
              </div>
              <p className="text-sm font-medium">Graphs & Hashing</p>
              <p className="text-xs text-gray-600">Advanced concepts</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Algo-Sim. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
