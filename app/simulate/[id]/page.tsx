"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MergeSortVisualizer from "@/components/merge-sort-visualizer"

interface Option {
  key: string
  name: string
  description: string
}

// Mapping of category to its sub-algorithm choices
const algorithmOptions: Record<string, Option[]> = {
  divide: [
    {
      key: "minmax",
      name: "Minimum and Maximum",
      description: "Find the minimum and maximum elements in an array using divide and conquer.",
    },
    {
      key: "mergeSort",
      name: "Merge Sort",
      description: "A stable, comparison-based sorting algorithm with O(n log n) time complexity.",
    },
    {
      key: "quickSort",
      name: "Quick Sort",
      description: "An efficient, in-place sorting algorithm that uses divide and conquer strategy.",
    },
    {
      key: "heapSort",
      name: "Heap Sort",
      description: "A comparison-based sorting algorithm that uses a binary heap data structure.",
    },
    {
      key: "strassen",
      name: "Strassen's Matrix Multiplication",
      description: "An algorithm for matrix multiplication that is faster than the standard algorithm.",
    },
  ],
  greedy: [
    {
      key: "knapsack",
      name: "Knapsack Problem",
      description: "Maximize the value of items in a knapsack without exceeding its capacity.",
    },
    {
      key: "jobScheduling",
      name: "Job Scheduling with Deadlines",
      description: "Schedule jobs to maximize profit while meeting deadlines.",
    },
    {
      key: "mst",
      name: "Minimum Spanning Trees",
      description: "Find a subset of edges that forms a tree including every vertex with minimum weight.",
    },
    {
      key: "singleSource",
      name: "Single Source Shortest Path",
      description: "Find the shortest path from a source vertex to all other vertices.",
    },
  ],
  dp: [
    {
      key: "multistage",
      name: "Multistage Graphs",
      description: "Find the shortest path in a weighted, directed graph with multiple stages.",
    },
    {
      key: "01knapsack",
      name: "0/1 Knapsack",
      description: "Maximize the value of items in a knapsack without exceeding its capacity.",
    },
    {
      key: "tsp",
      name: "Travelling Salesman Problem",
      description: "Find the shortest possible route that visits each city exactly once.",
    },
    {
      key: "singleSource",
      name: "Single Source Shortest Path",
      description: "Find the shortest path from a source vertex to all other vertices.",
    },
    {
      key: "allPairs",
      name: "All Pairs Shortest Path",
      description: "Find shortest paths between every pair of vertices in a weighted graph.",
    },
    {
      key: "matrixChain",
      name: "Matrix Chain Multiplication",
      description: "Find the most efficient way to multiply a given sequence of matrices.",
    },
  ],
  backtracking: [
    {
      key: "subsetSum",
      name: "Sum of Subsets",
      description: "Find all subsets of a given set whose sum equals a given value.",
    },
    {
      key: "8queens",
      name: "8-Queens Problem",
      description: "Place 8 queens on an 8×8 chessboard such that no two queens attack each other.",
    },
    {
      key: "graphColoring",
      name: "Graph Coloring",
      description: "Assign colors to vertices of a graph such that no two adjacent vertices have the same color.",
    },
  ],
  branch: [
    {
      key: "01knapsack",
      name: "0/1 Knapsack",
      description: "Maximize the value of items in a knapsack without exceeding its capacity.",
    },
    {
      key: "15puzzle",
      name: "15 Puzzle Problem",
      description: "Solve the 15-puzzle game by sliding tiles into the correct order.",
    },
  ],
}

// Map category IDs to their display names
const categoryNames: Record<string, string> = {
  divide: "Divide and Conquer",
  greedy: "Greedy Technique",
  dp: "Dynamic Programming",
  backtracking: "Backtracking",
  branch: "Branch and Bound",
}

export default function SimulationPage() {
  const params = useParams()
  const id = params?.id as string
  const [selectedSubAlgorithm, setSelectedSubAlgorithm] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("visualization")

  // Check if the current category has sub-options
  const subOptions = algorithmOptions[id] || []
  const categoryName = categoryNames[id] || id

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-purple-700">
              Algorithm Visualizer
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="text-gray-600 hover:text-purple-700">
                Home
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-purple-700">
                Dashboard
              </Link>
              <Link href="#" className="text-gray-600 hover:text-purple-700">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-purple-600 hover:text-purple-800">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
          <p className="text-gray-600">Select an algorithm to visualize</p>
        </div>

        {/* Algorithm Selection */}
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
                    variant={selectedSubAlgorithm === option.key ? "default" : "outline"}
                    className={`w-full h-auto py-3 px-4 justify-start text-left ${
                      selectedSubAlgorithm === option.key
                        ? "bg-purple-600 text-white"
                        : "bg-white hover:bg-purple-50 hover:text-purple-700"
                    }`}
                    onClick={() => setSelectedSubAlgorithm(option.key)}
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
        {selectedSubAlgorithm ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle>{subOptions.find((o) => o.key === selectedSubAlgorithm)?.name}</CardTitle>
                <CardDescription className="text-purple-100">
                  {subOptions.find((o) => o.key === selectedSubAlgorithm)?.description}
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
                      {selectedSubAlgorithm === "mergeSort" ? (
                        <MergeSortVisualizer />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <Info className="h-8 w-8 text-purple-600" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                          <p className="text-gray-600 max-w-md">
                            The visualization for {subOptions.find((o) => o.key === selectedSubAlgorithm)?.name} is
                            under development.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="explanation" className="p-6 m-0">
                    {selectedSubAlgorithm === "mergeSort" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Merge Sort Works</h3>
                        <p>Merge Sort is a divide and conquer algorithm that works as follows:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Divide:</strong> The unsorted array is divided into two halves.
                          </li>
                          <li>
                            <strong>Conquer:</strong> Each half is recursively sorted.
                          </li>
                          <li>
                            <strong>Combine:</strong> The sorted halves are merged to produce a single sorted array.
                          </li>
                        </ol>
                        <p>
                          The base case of the recursion is arrays of size 0 or 1, which are already sorted by
                          definition.
                        </p>

                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>Merge Sort has a time complexity of O(n log n) in all cases (best, average, and worst).</p>

                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>
                          Merge Sort has a space complexity of O(n) as it requires additional space for the temporary
                          arrays during merging.
                        </p>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Stable sorting algorithm (preserves the relative order of equal elements)</li>
                          <li>Guaranteed O(n log n) time complexity regardless of input data</li>
                          <li>Well-suited for linked lists and external sorting</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Requires additional O(n) space</li>
                          <li>Slower for small arrays compared to insertion sort</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-600">
                          Explanation for {subOptions.find((o) => o.key === selectedSubAlgorithm)?.name} will be
                          available soon.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="code" className="p-6 m-0">
                    {selectedSubAlgorithm === "mergeSort" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`function mergeSort(arr) {
  // Base case
  if (arr.length <= 1) {
    return arr;
  }
  
  // Divide the array into two halves
  const middle = Math.floor(arr.length / 2);
  const left = arr.slice(0, middle);
  const right = arr.slice(middle);
  
  // Recursively sort both halves
  return merge(
    mergeSort(left),
    mergeSort(right)
  );
}

function merge(left, right) {
  let result = [];
  let leftIndex = 0;
  let rightIndex = 0;
  
  // Compare elements from both arrays and add the smaller one to the result
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] < right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }
  
  // Add remaining elements
  return result
    .concat(left.slice(leftIndex))
    .concat(right.slice(rightIndex));
}`}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-600">
                          Code implementation for {subOptions.find((o) => o.key === selectedSubAlgorithm)?.name} will be
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
              <h3 className="text-xl font-semibold mb-2">Select an Algorithm</h3>
              <p className="text-gray-600 max-w-md">
                Choose an algorithm from the options above to view its visualization and explanation.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Algorithm Visualizer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

