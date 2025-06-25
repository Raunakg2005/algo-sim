"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Code, GitBranch, Layers, Lightbulb, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const algorithms = [
  {
    id: "sorting",
    name: "Sorting Algorithms",
    description: "Insertion Sort, Selection Sort",
    icon: <Lightbulb className="h-8 w-8 text-orange-500" />,
    color: "border-orange-200 hover:border-orange-400 bg-orange-50",
  },
  {
    id: "divide",
    name: "Divide and Conquer",
    description: "Minimum/Maximum, Merge Sort, Quick Sort, Heap Sort, Strassen's Matrix Multiplication",
    icon: <Layers className="h-8 w-8 text-purple-500" />,
    color: "border-purple-200 hover:border-purple-400 bg-purple-50",
  },
  {
    id: "greedy",
    name: "Greedy Technique",
    description: "Knapsack, Job Scheduling, MST, Shortest Path",
    icon: <Zap className="h-8 w-8 text-blue-500" />,
    color: "border-blue-200 hover:border-blue-400 bg-blue-50",
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    description: "0/1 Knapsack, TSP, Shortest Paths, Matrix Chain Multiplication",
    icon: <Code className="h-8 w-8 text-green-500" />,
    color: "border-green-200 hover:border-green-400 bg-green-50",
  },
  {
    id: "backtracking",
    name: "Backtracking",
    description: "Subset Sum, 8-Queens, Graph Coloring",
    icon: <ArrowRight className="h-8 w-8 text-yellow-500" />,
    color: "border-yellow-200 hover:border-yellow-400 bg-yellow-50",
  },
  {
    id: "branch",
    name: "Branch and Bound",
    description: "0/1 Knapsack, 15 Puzzle",
    icon: <GitBranch className="h-8 w-8 text-red-500" />,
    color: "border-red-200 hover:border-red-400 bg-red-50",
  },
]

export default function AOADashboard() {
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
          <h1 className="text-3xl font-bold mb-2">Analysis of Algorithms (AOA)</h1>
          <p className="text-gray-600">Select an algorithm category to explore and visualize</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {algorithms.map((algorithm, index) => (
            <motion.div
              key={algorithm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`border-2 transition-all duration-300 ${algorithm.color}`}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {algorithm.icon}
                    <div>
                      <CardTitle>{algorithm.name}</CardTitle>
                      <CardDescription className="mt-1">Explore algorithms in this category</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{algorithm.description}</p>
                </CardContent>
                <CardFooter>
                  <Link href={`/simulate/${algorithm.id}`} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                      Explore Algorithms
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-purple-50 rounded-lg border border-purple-200">
          <h2 className="text-xl font-semibold mb-2">Recently Viewed</h2>
          <p className="text-gray-600 mb-4">Your recently viewed algorithms will appear here</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="bg-white">
              Merge Sort
            </Button>
            <Button variant="outline" className="bg-white">
              Quick Sort
            </Button>
            <Button variant="outline" className="bg-white">
              Dijkstra's Algorithm
            </Button>
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
