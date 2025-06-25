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
import QuickSortVisualization from "@/components/quick-sort-visualization"
import HeapSortVisualization from "@/components/heap-sort-visualizer"
import MinMaxVisualization from "@/components/divide-conquer-maxmin"
import StrassenMatrixMultiplication from "@/components/strassen-matrix-multiplication"
import KnapsackSimulation from "@/components/knapsack-simulation"
import JobSchedulingSimulation from "@/components/job-scheduling-simulation"
import MSTSimulation from "@/components/mst-simulation"
import DijkstraSimulation from "@/components/dijkstra-simulation"
import MultistageGraphOptimization from "@/components/multistage-graph-optimization"
import Knapsack from "@/components/knapsack-problem"
import SumOfSubsets from "@/components/sum-of-subsets"
import EightQueen from "@/components/eight-queens"
import GraphColoring from "@/components/graph-coloring"
import TSPSimulation from "@/components/tsp-simulation"
import BellmanFordSimulation from "@/components/bellman-ford-simulation"
import B01Knapsack from "@/components/knapsack-branch-and-bound"
import MatrixChainMultiplication from "@/components/matrix-chain-multiplication"
import FifteenPuzzleBranchAndBound from "@/components/fifteen-puzzle-branch-and-bound"
import FloydWarshall from "@/components/floyd-warshall"
import SelectionSortVisualizer from "@/components/selection-sort-visualization"
import InsertionSortVisualization from "@/components/insertion-sort-visualization"

interface Option {
  key: string
  name: string
  description: string
}

const algorithmOptions: Record<string, Option[]> = {
  sorting: [
    {
      key: "insertionSort",
      name: "Insertion Sort",
      description: "A simple sorting algorithm that builds a sorted array one element at a time.",
    },
    {
      key: "selectionSort",
      name: "Selection Sort",
      description: "A simple comparison-based sorting algorithm that divides the input into sorted and unsorted parts.",
    },
  ],
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
      key: "singleSourceDijkstra",
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
      key: "B01knapsack",
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

const categoryNames: Record<string, string> = {
  sorting: "Sorting Algorithms",
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

  const subOptions = algorithmOptions[id] || []
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
                      {selectedSubAlgorithm === "insertionSort" ? (
                        <InsertionSortVisualization />
                      ) : selectedSubAlgorithm === "selectionSort" ? (
                        <SelectionSortVisualizer />
                      ) :
                      selectedSubAlgorithm === "mergeSort" ? (
                        <MergeSortVisualizer />
                      ) : selectedSubAlgorithm === "quickSort" ? (
                        <QuickSortVisualization />
                      ) : selectedSubAlgorithm === "heapSort" ? (
                        <HeapSortVisualization />
                      ) : selectedSubAlgorithm === "minmax" ? (
                        <MinMaxVisualization />
                      ) : selectedSubAlgorithm === "strassen" ? (
                        <StrassenMatrixMultiplication />
                      ):selectedSubAlgorithm === "knapsack" ? (
                        <KnapsackSimulation />
                      ) : selectedSubAlgorithm === "jobScheduling" ? (
                        <JobSchedulingSimulation/>
                      ) : selectedSubAlgorithm === "mst" ? (
                        <MSTSimulation/>
                      ): selectedSubAlgorithm === "singleSourceDijkstra" ? (
                        <DijkstraSimulation/>
                      ) : selectedSubAlgorithm === "multistage" ? (
                        <MultistageGraphOptimization/>
                      ) : selectedSubAlgorithm === "01knapsack" ? (
                        <Knapsack />
                       ) :selectedSubAlgorithm === "tsp" ? (
                        <TSPSimulation/>
                       ): selectedSubAlgorithm === "singleSource" ? (
                        <BellmanFordSimulation/>
                      ): selectedSubAlgorithm === "allPairs" ? (
                        <FloydWarshall/>
                       ): selectedSubAlgorithm === "matrixChain" ? (
                        <MatrixChainMultiplication/> 
                      ): selectedSubAlgorithm === "subsetSum" ? (
                        <SumOfSubsets/>
                       ) : selectedSubAlgorithm === "8queens" ? (
                        <EightQueen/>
                       ): selectedSubAlgorithm === "graphColoring" ? (
                        <GraphColoring/>
                       ): selectedSubAlgorithm === "B01knapsack" ? (
                        <B01Knapsack/>
                       ): selectedSubAlgorithm === "15puzzle" ? (
                        <FifteenPuzzleBranchAndBound/>
                       ):(
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <Info className="h-8 w-8 text-purple-600" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                          <p className="text-gray-600 max-w-md">
                            The visualization for {subOptions.find((o) => o.key === selectedSubAlgorithm)?.name} is under development.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Explanation Tab */}
                  <TabsContent value="explanation" className="p-6 m-0">
                    {selectedSubAlgorithm === "insertionSort" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Insertion Sort Works</h3>
                        <p>Insertion Sort is a simple sorting algorithm that works as follows:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                          <strong>Start with the second element:</strong> Assume the first element is already sorted.
                          </li>
                          <li>
                          <strong>Compare and insert:</strong> Pick the next element and compare it with the previous elements.
                          </li>
                          <li>
                          <strong>Shift elements:</strong> Move larger elements to the right to create space for insertion.
                          </li>
                          <li>
                          <strong>Repeat:</strong> Continue this process for all elements in the array.
                          </li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>Insertion Sort has a time complexity of:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Best case: O(n) (when the array is already sorted)</li>
                          <li>Average and worst case: O(n²) (when elements are in reverse order)</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>Insertion Sort has an O(1) space complexity since it sorts in place without requiring extra storage.</p>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Efficient for small datasets or nearly sorted arrays</li>
                          <li>Stable sorting algorithm (preserves order of equal elements)</li>
                          <li>Simple to implement</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Not efficient for large datasets due to O(n²) complexity</li>
                          <li>Slower than Merge Sort and Quick Sort for large arrays</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "selectionSort" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Selection Sort Works</h3>
                        <p>Selection Sort is a simple, comparison-based sorting algorithm that works as follows:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Find the minimum element:</strong> Scan the entire array and find the smallest element.
                          </li>
                          <li>
                            <strong>Swap with the first element:</strong> Place the smallest element in its correct position.
                          </li>
                          <li>
                            <strong>Repeat for remaining elements:</strong> Find the next smallest element and place it in order.
                          </li>
                          <li>
                            <strong>Continue until sorted:</strong> Repeat until all elements are in ascending order.
                          </li>
                        </ol>
                    
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>Selection Sort has a time complexity of O(n²) in all cases (best, average, and worst).</p>
                    
                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>Selection Sort has an O(1) space complexity as it sorts in place.</p>
                    
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Simple to implement and easy to understand</li>
                          <li>Does not require additional memory (in-place sorting)</li>
                        </ul>
                    
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Not a stable sorting algorithm (order of equal elements may change)</li>
                          <li>Inefficient for large datasets compared to Quick Sort and Merge Sort</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "mergeSort" ? (
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
                          The base case of the recursion is arrays of size 0 or 1, which are already sorted by definition.
                        </p>

                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>Merge Sort has a time complexity of O(n log n) in all cases (best, average, and worst).</p>

                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>
                          Merge Sort has a space complexity of O(n) as it requires additional space for the temporary arrays during merging.
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
                    ) : selectedSubAlgorithm === "quickSort" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Quick Sort Works</h3>
                        <p>Quick Sort is a divide and conquer algorithm that works as follows:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Choose Pivot:</strong> Select a pivot element from the array.
                          </li>
                          <li>
                            <strong>Partition:</strong> Rearrange elements so elements less than the pivot come before, and elements greater come after.
                          </li>
                          <li>
                            <strong>Recurse:</strong> Apply Quick Sort recursively to the sub-arrays.
                          </li>
                        </ol>

                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Best/Average Case: O(n log n)</li>
                          <li>Worst Case: O(n²) (with poor pivot selection)</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>O(log n) due to recursion stack</p>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>In-place sorting (requires minimal extra memory)</li>
                          <li>Typically faster than other O(n log n) algorithms in practice</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Worst-case performance can be O(n²)</li>
                          <li>Not a stable sort</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "heapSort" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">How Heap Sort Works</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Build Heap:</strong> Convert array into a max-heap structure
                          </li>
                          <li>
                            <strong>Sort Phase:</strong>
                            <ul className="list-disc pl-5 mt-2">
                              <li>Swap root (max element) with last element</li>
                              <li>Reduce heap size by 1</li>
                              <li>Heapify the root element</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Repeat:</strong> Until heap size reduces to 1
                          </li>
                        </ol>
                        
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(n log n) in all cases</p>
                        
                        <h4 className="text-lg font-semibold mt-4">Space Complexity</h4>
                        <p>O(1) - in-place sorting</p>
                        
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Guaranteed O(n log n) performance</li>
                          <li>Memory efficient</li>
                        </ul>
                        
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Not stable</li>
                          <li>Slower than Quick Sort in practice</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "strassen" ? (
                      <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Strassen's Matrix Multiplication</h3>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>
                          <strong>Divide:</strong> Split each matrix into 4 equal submatrices. For example, for matrices A and B:
                          <br />
                          A = [ [A11, A12], [A21, A22] ] and B = [ [B11, B12], [B21, B22] ]
                        </li>
                        <li>
                          <strong>Compute 7 Products:</strong>
                          <ul className="list-disc pl-5 mt-2">
                            <li>M1 = (A11 + A22) × (B11 + B22)</li>
                            <li>M2 = (A21 + A22) × B11</li>
                            <li>M3 = A11 × (B12 − B22)</li>
                            <li>M4 = A22 × (B21 − B11)</li>
                            <li>M5 = (A11 + A12) × B22</li>
                            <li>M6 = (A21 − A11) × (B11 + B12)</li>
                            <li>M7 = (A12 − A22) × (B21 + B22)</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Combine:</strong> Reconstruct the final matrix C using the seven products:
                          <ul className="list-disc pl-5 mt-2">
                            <li>C11 = M1 + M4 − M5 + M7</li>
                            <li>C12 = M3 + M5</li>
                            <li>C21 = M2 + M4</li>
                            <li>C22 = M1 − M2 + M3 + M6</li>
                          </ul>
                        </li>
                      </ol>
                      <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                      <p>
                        O(n<sup>log<sub>2</sub>7</sup>) ≈ O(n<sup>2.807</sup>)
                      </p>
                      <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Better asymptotic complexity than the standard O(n³) algorithm</li>
                        <li>Foundation for improved matrix multiplication algorithms</li>
                      </ul>
                      <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Larger constant factors in time complexity</li>
                        <li>Not practical for small matrices</li>
                        <li>Requires square matrices with dimensions of power-of-two (or padded accordingly)</li>
                      </ul>
                    </div>
                    ) : selectedSubAlgorithm === "minmax" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Min/Max Finding</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Divide:</strong> Split array into two halves
                          </li>
                          <li>
                            <strong>Conquer:</strong>
                            <ul className="list-disc pl-5 mt-2">
                              <li>Find min/max in left half</li>
                              <li>Find min/max in right half</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Combine:</strong> Compare left and right min/max
                          </li>
                        </ol>

                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>
                          O(n) with 3n/2 - 2 comparisons (better than 2n-2 in linear scan)
                        </p>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Reduces number of comparisons</li>
                          <li>Efficient for parallel processing</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Recursion overhead for small arrays</li>
                          <li>More complex implementation</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "knapsack" ? (
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Greedy Knapsack Problem</h3>
                          <ol className="list-decimal pl-5 space-y-2">
                            <li>Sort items by value-to-weight ratio in descending order</li>
                            <li>Take items in this order until the knapsack is full</li>
                            <li>Take fractions of items if needed for the last item</li>
                          </ol>
                    
                          <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                          <p>O(n log n) due to sorting</p>
                    
                          <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Simple and efficient for fractional knapsack</li>
                            <li>Guaranteed optimal solution for fractional version</li>
                          </ul>
                    
                          <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Doesn't work for 0/1 knapsack problem</li>
                            <li>Requires sorting all items</li>
                          </ul>
                        </div>
                      ) : selectedSubAlgorithm === "jobScheduling" ? (
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Job Scheduling with Deadlines</h3>
                          <ol className="list-decimal pl-5 space-y-2">
                            <li>Sort jobs by profit in descending order</li>
                            <li>Initialize a result array with time slots</li>
                            <li>Iterate through jobs and place them in latest possible slot</li>
                          </ol>
                    
                          <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                          <p>O(n²) worst case, O(n log n) with efficient data structures</p>
                    
                          <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Maximizes total profit</li>
                            <li>Efficient for many jobs with deadlines</li>
                          </ul>
                    
                          <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Requires sorting entire job list</li>
                            <li>Not optimal for all variations of the problem</li>
                          </ul>
                        </div>
                      ) : selectedSubAlgorithm === "mst" ? (
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Kruskal's Algorithm (MST)</h3>
                          <ol className="list-decimal pl-5 space-y-2">
                            <li>Sort all edges in non-decreasing order of weight</li>
                            <li>Initialize a forest of trees (each vertex is its own tree)</li>
                            <li>Add edges in order if they connect different trees</li>
                          </ol>
                    
                          <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                          <p>O(E log E) due to sorting and union-find operations</p>
                    
                          <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Efficient for sparse graphs</li>
                            <li>Guaranteed to find minimum spanning tree</li>
                          </ul>
                    
                          <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Requires union-find data structure</li>
                            <li>Not as efficient for dense graphs</li>
                          </ul>
                        </div>
                      ) : selectedSubAlgorithm === "singleSource" ? (
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold">Dijkstra's Algorithm</h3>
                          <ol className="list-decimal pl-5 space-y-2">
                            <li>Initialize distance to source as 0 and others as infinity</li>
                            <li>Use priority queue to track vertices with current shortest paths</li>
                            <li>Update neighbor distances and repeat until queue is empty</li>
                          </ol>
                    
                          <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                          <p>O((V + E) log V) with binary heap implementation</p>
                    
                          <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Efficient for graphs with non-negative weights</li>
                            <li>Guaranteed shortest path in weighted graphs</li>
                          </ul>
                    
                          <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Doesn't work with negative edge weights</li>
                            <li>Requires priority queue implementation</li>
                          </ul>
                        </div>
                    ): selectedSubAlgorithm === "multistage" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Multistage Graphs</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            Divide the graph into stages, where each stage contains a subset of nodes.
                          </li>
                          <li>
                            Define a cost function that represents the cost from a node in one stage to any node in the next stage.
                          </li>
                          <li>
                            Use DP (often via backward recursion) to compute the minimal cost from the source to the destination.
                          </li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(n²) to O(n³), depending on the number of stages and connections</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Breaks a complex problem into manageable stages</li>
                          <li>Exploits optimal substructure</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Requires the problem to naturally decompose into stages</li>
                          <li>May require heavy preprocessing of the graph</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "01knapsack" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">0/1 Knapsack</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            Define <code>dp[i][w]</code> as the maximum value obtainable with the first i items and capacity w.
                          </li>
                          <li>
                            For each item, decide whether to include it or not based on its weight and value.
                          </li>
                          <li>
                            Build up the DP table and return <code>dp[n][W]</code> as the optimal solution.
                          </li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(n · W) (pseudo-polynomial time)</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Provides an exact solution for the 0/1 knapsack problem</li>
                          <li>Simple table-based DP formulation</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Not efficient for large capacities</li>
                          <li>Pseudo-polynomial complexity can be prohibitive</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "tsp" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Travelling Salesman Problem</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            Represent the set of visited cities using bitmasking.
                          </li>
                          <li>
                            Define <code>dp[mask][i]</code> as the minimum cost to reach city <code>i</code> having visited the cities in <code>mask</code>.
                          </li>
                          <li>
                            Recursively build the solution and choose the minimum cost tour that returns to the starting city.
                          </li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(n² · 2ⁿ)</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Yields the optimal solution for small n</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Exponential time complexity, not scalable</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "singleSource" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Single Source Shortest Path (DAG)</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            Perform a topological sort of the DAG.
                          </li>
                          <li>
                            Initialize distances: set the source to 0 and all others to ∞.
                          </li>
                          <li>
                            Relax the edges in topological order to compute the shortest path.
                          </li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(V + E)</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Efficient and simple for DAGs</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Only applicable if the graph is a DAG</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "allPairs" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">All Pairs Shortest Path (Floyd–Warshall)</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            Initialize a matrix <code>dist</code> with edge weights; set <code>dist[i][j] = Infinity</code> if no edge exists.
                          </li>
                          <li>
                            For each vertex <code>k</code>, update every <code>dist[i][j]</code> with <code>min(dist[i][j], dist[i][k] + dist[k][j])</code>.
                          </li>
                          <li>
                            The final <code>dist</code> matrix contains the shortest distances between every pair of vertices.
                          </li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(V³)</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Simple and works with negative edge weights (if no negative cycles)</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>High computational cost for large graphs</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "matrixChain" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Matrix Chain Multiplication</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            Define <code>dp[i][j]</code> as the minimum cost of multiplying matrices i through j.
                          </li>
                          <li>
                            For each possible split between i and j, compute <code>dp[i][j] = min(dp[i][k] + dp[k+1][j] + cost(i,j))</code>.
                          </li>
                          <li>
                            Fill the table in order of increasing chain length to obtain the optimal solution.
                          </li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(n³)</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Optimizes multiplication cost</li>
                          <li>Effective for moderate number of matrices</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Not efficient for very large chains</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "subsetSum" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Sum of Subsets</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>Given a set of numbers and a target sum, explore all subsets recursively.</li>
                          <li>At each step, decide whether to include or exclude the current element.</li>
                          <li>If the current subset sums to the target, record it as a valid solution.</li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(2ⁿ) in the worst case (exponential), where n is the number of elements.</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Simple recursive formulation</li>
                          <li>Can be optimized with backtracking techniques</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Exponential time complexity for large input sizes</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "8queens" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">8-Queens Problem</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>Place 8 queens on a chessboard so that no two queens threaten each other.</li>
                          <li>Place a queen row by row, and backtrack when a conflict is found.</li>
                          <li>Record each valid configuration of queens.</li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>Exponential in the worst-case, though practical optimizations reduce average runtime.</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Classic backtracking problem with well-known solutions</li>
                          <li>Helps illustrate constraint propagation</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Exponential worst-case complexity</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "graphColoring" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Graph Coloring</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>Assign colors to vertices of a graph such that no two adjacent vertices share the same color.</li>
                          <li>Use recursive backtracking to try different color assignments.</li>
                          <li>Backtrack if a vertex cannot be assigned any valid color.</li>
                        </ol>
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>O(mⁿ) in the worst-case, where n is the number of vertices and m is the number of colors.</p>
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Flexible: works for many variations of the graph coloring problem</li>
                        </ul>
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Exponential complexity for large graphs</li>
                          <li>May require heuristic optimizations for practical use</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "B01knapsack" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">0/1 Knapsack (Branch and Bound)</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>Sort Items:</strong> First, sort items by their value-to-weight ratio (or a similar metric) to guide the search.
                          </li>
                          <li>
                            <strong>Recursive Search:</strong> Recursively explore decisions to include or exclude each item.
                          </li>
                          <li>
                            <strong>Bounding Function:</strong> For each node in the decision tree, compute an upper bound on the maximum possible profit.
                          </li>
                          <li>
                            <strong>Pruning:</strong> Discard branches whose bound is lower than the current best solution.
                          </li>
                        </ol>
                  
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>Worst-case is exponential, but effective pruning can significantly reduce average-case runtime.</p>
                  
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Prunes many suboptimal branches, potentially speeding up the search</li>
                          <li>Yields an exact solution</li>
                        </ul>
                  
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Worst-case exponential time complexity remains</li>
                          <li>More complex to implement than greedy or DP approaches</li>
                        </ul>
                      </div>
                    ) : selectedSubAlgorithm === "15puzzle" ? (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">15 Puzzle Problem (Branch and Bound)</h3>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong>State Representation:</strong> Represent each puzzle configuration as a node (with 0 indicating the empty space).
                          </li>
                          <li>
                            <strong>Heuristic Bound:</strong> Use a heuristic (e.g., Manhattan distance) to estimate the minimum number of moves required.
                          </li>
                          <li>
                            <strong>Search:</strong> Explore moves using branch and bound (or best-first search), pruning branches whose bound exceeds the current best solution.
                          </li>
                        </ol>
                  
                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>Exponential in the worst-case; however, an effective heuristic can prune many nodes in practice.</p>
                  
                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Can dramatically reduce the search space with a good heuristic</li>
                          <li>Finds the optimal solution</li>
                        </ul>
                  
                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Highly dependent on the quality of the heuristic</li>
                          <li>May still be slow for complex or unsolvable configurations</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-600">
                          Explanation for {subOptions.find((o) => o.key === selectedSubAlgorithm)?.name} will be available soon.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Code Tab */}
                  <TabsContent value="code" className="p-6 m-0">
                    {selectedSubAlgorithm === "insertionSort" ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <code>{`function insertionSort(arr) {
                    for (let i = 1; i < arr.length; i++) {
                      let key = arr[i];
                      let j = i - 1;
                      // Move elements of arr[0..i-1] that are greater than key one position ahead
                      while (j >= 0 && arr[j] > key) {
                        arr[j + 1] = arr[j];
                        j--;
                      }
                      arr[j + 1] = key;
                    }
                    return arr;
                  }`}</code>
                      </pre>
                    </div>
                  ) : selectedSubAlgorithm === "selectionSort" ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <code>{`function selectionSort(arr) {
                    let n = arr.length;
                    for (let i = 0; i < n - 1; i++) {
                      // Find the minimum element in the unsorted part
                      let minIndex = i;
                      for (let j = i + 1; j < n; j++) {
                        if (arr[j] < arr[minIndex]) {
                          minIndex = j;
                        }
                      }
                      // Swap the found minimum element with the element at index i
                      if (minIndex !== i) {
                        let temp = arr[i];
                        arr[i] = arr[minIndex];
                        arr[minIndex] = temp;
                      }
                    }
                    return arr;
                  }`}</code>
                      </pre>
                    </div>
                  ) :selectedSubAlgorithm === "mergeSort" ? (
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
                    ) : selectedSubAlgorithm === "quickSort" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">JavaScript Implementation</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`}</code>
                        </pre>
                      </div>
                    ) : selectedSubAlgorithm === "heapSort" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Heap Sort Code</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`// Heap Sort implementation
function heapSort(arr) {
  let n = arr.length;

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }

  // One by one extract elements
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }
  return arr;
}

function heapify(arr, heapSize, i) {
  let largest = i;
  let left = 2 * i + 1;
  let right = 2 * i + 2;

  if (left < heapSize && arr[left] > arr[largest]) {
    largest = left;
  }
  if (right < heapSize && arr[right] > arr[largest]) {
    largest = right;
  }
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, heapSize, largest);
  }
}`}</code>
                        </pre>
                      </div>
                    ) : selectedSubAlgorithm === "strassen" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Strassen's Implementation</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`function strassenMultiply(A, B) {
  // Base case for 2x2 matrix
  if (A.length === 2) {
    return [
      [
        A[0][0] * B[0][0] + A[0][1] * B[1][0],
        A[0][0] * B[0][1] + A[0][1] * B[1][1]
      ],
      [
        A[1][0] * B[0][0] + A[1][1] * B[1][0],
        A[1][0] * B[0][1] + A[1][1] * B[1][1]
      ]
    ];
  }

  // Split matrices into quadrants
  const [A11, A12, A21, A22] = splitMatrix(A);
  const [B11, B12, B21, B22] = splitMatrix(B);

  // Compute 7 products recursively
  const P1 = strassenMultiply(A11, matrixSubtract(B12, B22));
  const P2 = strassenMultiply(matrixAdd(A11, A12), B22);
  // ... other products

  // Combine results (this is an example and may need adjustment)
  return combineMatrix(
    matrixAdd(matrixSubtract(matrixAdd(P5, P4), P2), P6),
    matrixAdd(P1, P2),
    matrixAdd(P3, P4),
    matrixSubtract(matrixSubtract(matrixAdd(P5, P1), P3), P7)
  );
}`}</code>
                        </pre>
                      </div>
                    ) : selectedSubAlgorithm === "minmax" ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Min/Max Code</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                          <code>{`function findMinMax(arr, low = 0, high = arr.length - 1) {
  // Base cases
  if (low === high) return { min: arr[low], max: arr[low] };
  if (high === low + 1) {
    return arr[low] < arr[high] 
      ? { min: arr[low], max: arr[high] }
      : { min: arr[high], max: arr[low] };
  }

  // Divide
  const mid = Math.floor((low + high) / 2);
  const left = findMinMax(arr, low, mid);
  const right = findMinMax(arr, mid + 1, high);

  // Combine
  return {
    min: Math.min(left.min, right.min),
    max: Math.max(left.max, right.max)
  };
}`}</code>
                        </pre>
                      </div>
                    ) : selectedSubAlgorithm === "knapsack" ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Fractional Knapsack Code</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <code>{`function fractionalKnapsack(capacity, items) {
                  // Sort items by value/weight ratio descending
                  items.sort((a, b) => (b.value / b.weight) - (a.value / a.weight));
                  
                  let totalValue = 0;
                  
                  for (const item of items) {
                    if (capacity <= 0) break;
                    const take = Math.min(item.weight, capacity);
                    totalValue += take * (item.value / item.weight);
                    capacity -= take;
                  }
                  return totalValue;
                }`}</code>
                      </pre>
                    </div>
                  ) : selectedSubAlgorithm === "jobScheduling" ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Job Scheduling Code</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <code>{`function jobScheduling(jobs) {
                  // Sort jobs by profit descending
                  jobs.sort((a, b) => b.profit - a.profit);
                  
                  const result = [];
                  const slots = Array(jobs.length).fill(false);
                  
                  for (const job of jobs) {
                    for (let i = Math.min(job.deadline - 1, jobs.length - 1); i >= 0; i--) {
                      if (!slots[i]) {
                        slots[i] = true;
                        result.push(job);
                        break;
                      }
                    }
                  }
                  return result.sort((a, b) => a.deadline - b.deadline);
                }`}</code>
                      </pre>
                    </div>
                  ) : selectedSubAlgorithm === "mst" ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Kruskal's Algorithm Code</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <code>{`class UnionFind {
                  constructor(size) {
                    this.parent = Array(size).fill().map((_, i) => i);
                  }
                  
                  find(x) {
                    while (this.parent[x] !== x) x = this.parent[x];
                    return x;
                  }
                  
                  union(x, y) {
                    const rootX = this.find(x);
                    const rootY = this.find(y);
                    if (rootX !== rootY) this.parent[rootY] = rootX;
                  }
                }
                
                function kruskalMST(edges, numVertices) {
                  edges.sort((a, b) => a.weight - b.weight);
                  const uf = new UnionFind(numVertices);
                  const result = [];
                  
                  for (const edge of edges) {
                    if (uf.find(edge.src) !== uf.find(edge.dest)) {
                      result.push(edge);
                      uf.union(edge.src, edge.dest);
                    }
                  }
                  return result;
                }`}</code>
                      </pre>
                    </div>
                  ) : selectedSubAlgorithm === "singleSource" ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Dijkstra's Algorithm Code</h3>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                        <code>{`function dijkstra(graph, start) {
                  const distances = Array(graph.length).fill(Infinity);
                  const heap = new PriorityQueue();
                  
                  distances[start] = 0;
                  heap.enqueue(start, 0);
                  
                  while (!heap.isEmpty()) {
                    const current = heap.dequeue().element;
                    
                    for (const [neighbor, weight] of graph[current]) {
                      const alt = distances[current] + weight;
                      if (alt < distances[neighbor]) {
                        distances[neighbor] = alt;
                        heap.enqueue(neighbor, alt);
                      }
                    }
                  }
                  return distances;
                }`}</code>
                      </pre>
                    </div>
                    ) : selectedSubAlgorithm === "multistage" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Multistage Graphs Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function multistageGraphShortestPath(stages) {
                      // stages: an array where each element is an array of nodes in that stage.
                      const n = stages.length;
                      // dp[i][j] represents the minimum cost to reach node j at stage i.
                      const dp = Array.from({ length: n }, () => []);
                      
                      // Base case: cost to reach nodes in the first stage is just the node's cost.
                      dp[0] = stages[0];
                      
                      // Compute costs for subsequent stages.
                      for (let i = 1; i < n; i++) {
                        for (let j = 0; j < stages[i].length; j++) {
                          dp[i][j] = Infinity;
                          for (let k = 0; k < stages[i - 1].length; k++) {
                            dp[i][j] = Math.min(dp[i][j], dp[i - 1][k] + costBetween(stages[i - 1][k], stages[i][j]));
                          }
                        }
                      }
                      
                      // Return the minimum cost at the final stage.
                      return Math.min(...dp[n - 1]);
                    }

                    function costBetween(u, v) {
                      // Example cost function: absolute difference.
                      return Math.abs(u - v);
                    }`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "01knapsack" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">0/1 Knapsack Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function knapsack01(W, weights, values) {
                      const n = weights.length;
                      const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
                      
                      for (let i = 1; i <= n; i++) {
                        for (let w = 0; w <= W; w++) {
                          if (weights[i - 1] > w) {
                            dp[i][w] = dp[i - 1][w];
                          } else {
                            dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
                          }
                        }
                      }
                      
                      return dp[n][W];
                    }`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "tsp" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Travelling Salesman Problem Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function tsp(dist) {
                      const n = dist.length;
                      const dp = Array.from({ length: 1 << n }, () => Array(n).fill(Infinity));
                      dp[1][0] = 0;
                      
                      for (let mask = 1; mask < (1 << n); mask += 2) {
                        for (let u = 0; u < n; u++) {
                          if (mask & (1 << u)) {
                            for (let v = 0; v < n; v++) {
                              if (!(mask & (1 << v))) {
                                dp[mask | (1 << v)][v] = Math.min(dp[mask | (1 << v)][v], dp[mask][u] + dist[u][v]);
                              }
                            }
                          }
                        }
                      }
                      
                      let ans = Infinity;
                      for (let i = 0; i < n; i++) {
                        ans = Math.min(ans, dp[(1 << n) - 1][i] + dist[i][0]);
                      }
                      
                      return ans;
                    }`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "singleSource" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Single Source Shortest Path (DAG) Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function dagShortestPath(graph, start) {
                      const n = graph.length;
                      const dist = Array(n).fill(Infinity);
                      dist[start] = 0;
                      const topoOrder = topologicalSort(graph);
                      
                      for (const u of topoOrder) {
                        for (const [v, w] of graph[u]) {
                          dist[v] = Math.min(dist[v], dist[u] + w);
                        }
                      }
                      
                      return dist;
                    }

                    function topologicalSort(graph) {
                      const n = graph.length;
                      const inDegree = Array(n).fill(0);
                      for (let u = 0; u < n; u++) {
                        for (const [v] of graph[u]) {
                          inDegree[v]++;
                        }
                      }
                      
                      const queue = [];
                      for (let i = 0; i < n; i++) {
                        if (inDegree[i] === 0) queue.push(i);
                      }
                      
                      const order = [];
                      while (queue.length) {
                        const u = queue.shift();
                        order.push(u);
                        for (const [v] of graph[u]) {
                          inDegree[v]--;
                          if (inDegree[v] === 0) queue.push(v);
                        }
                      }
                      
                      return order;
                    }`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "allPairs" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">All Pairs Shortest Path (Floyd–Warshall) Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function floydWarshall(dist) {
                      const n = dist.length;
                      for (let k = 0; k < n; k++) {
                        for (let i = 0; i < n; i++) {
                          for (let j = 0; j < n; j++) {
                            dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);
                          }
                        }
                      }
                      return dist;
                    }`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "matrixChain" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Matrix Chain Multiplication Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function matrixChainOrder(p) {
                      const n = p.length - 1;
                      const m = Array.from({ length: n }, () => Array(n).fill(0));
                      
                      for (let L = 2; L <= n; L++) {
                        for (let i = 0; i <= n - L; i++) {
                          const j = i + L - 1;
                          m[i][j] = Infinity;
                          for (let k = i; k < j; k++) {
                            const q = m[i][k] + m[k + 1][j] + p[i] * p[k + 1] * p[j + 1];
                            if (q < m[i][j]) {
                              m[i][j] = q;
                            }
                          }
                        }
                      }
                      return m[0][n - 1];
                    }`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "subsetSum" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Sum of Subsets Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function findSubsets(nums, target) {
                      const result = [];
                      
                      function backtrack(start, subset, sum) {
                        if (sum === target) {
                          result.push([...subset]);
                          // Continue searching for other subsets
                        }
                        if (sum >= target) return;
                        
                        for (let i = start; i < nums.length; i++) {
                          subset.push(nums[i]);
                          backtrack(i + 1, subset, sum + nums[i]);
                          subset.pop();
                        }
                      }
                      
                      backtrack(0, [], 0);
                      return result;
                    }
                    
                    // Example usage:
                    const nums = [3, 34, 4, 12, 5, 2];
                    const target = 9;
                    console.log(findSubsets(nums, target));`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "8queens" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">8-Queens Problem Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function solveNQueens(n = 8) {
                      const results = [];
                      const board = Array.from({ length: n }, () => Array(n).fill('.'));
                    
                      function isSafe(row, col) {
                        for (let i = 0; i < row; i++) {
                          if (board[i][col] === 'Q') return false;
                        }
                        for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
                          if (board[i][j] === 'Q') return false;
                        }
                        for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
                          if (board[i][j] === 'Q') return false;
                        }
                        return true;
                      }
                    
                      function backtrack(row) {
                        if (row === n) {
                          results.push(board.map(r => r.join('')));
                          return;
                        }
                        for (let col = 0; col < n; col++) {
                          if (!isSafe(row, col)) continue;
                          board[row][col] = 'Q';
                          backtrack(row + 1);
                          board[row][col] = '.';
                        }
                      }
                    
                      backtrack(0);
                      return results;
                    }
                    
                    // Example usage:
                    console.log(solveNQueens());`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "graphColoring" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Graph Coloring Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function graphColoring(graph, m) {
                      const n = graph.length;
                      const colors = Array(n).fill(0);
                    
                      function isSafe(node, c) {
                        for (let i = 0; i < n; i++) {
                          if (graph[node][i] === 1 && colors[i] === c) {
                            return false;
                          }
                        }
                        return true;
                      }
                    
                      function backtrack(node) {
                        if (node === n) return true;
                        for (let c = 1; c <= m; c++) {
                          if (isSafe(node, c)) {
                            colors[node] = c;
                            if (backtrack(node + 1)) return true;
                            colors[node] = 0;
                          }
                        }
                        return false;
                      }
                    
                      if (backtrack(0)) {
                        return colors;
                      } else {
                        return "No solution exists";
                      }
                    }
                    
                    // Example usage:
                    // Graph represented as an adjacency matrix
                    const graph = [
                      [0, 1, 1, 0],
                      [1, 0, 1, 1],
                      [1, 1, 0, 1],
                      [0, 1, 1, 0],
                    ];
                    const m = 3; // number of colors
                    console.log(graphColoring(graph, m));`}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "B01knapsack" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">0/1 Knapsack (Branch and Bound) Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function knapsackBranchAndBound(capacity, items) {
                      // items: array of objects { value, weight }
                      // Sort items by value/weight ratio descending
                      items.sort((a, b) => (b.value / b.weight) - (a.value / a.weight));
                      
                      let best = 0;
                      
                      function bound(level, currentWeight, currentValue) {
                        if (currentWeight >= capacity) return 0;
                        let profitBound = currentValue;
                        let totalWeight = currentWeight;
                        let i = level;
                        // Greedily add items until capacity is reached
                        while (i < items.length && totalWeight + items[i].weight <= capacity) {
                          totalWeight += items[i].weight;
                          profitBound += items[i].value;
                          i++;
                        }
                        // Add fractional part if possible
                        if (i < items.length) {
                          profitBound += (capacity - totalWeight) * (items[i].value / items[i].weight);
                        }
                        return profitBound;
                      }
                      
                      function branchAndBound(level, currentWeight, currentValue) {
                        if (currentWeight <= capacity && currentValue > best) {
                          best = currentValue;
                        }
                        if (level >= items.length || bound(level, currentWeight, currentValue) <= best) {
                          return;
                        }
                        // Include item at current level
                        branchAndBound(level + 1, currentWeight + items[level].weight, currentValue + items[level].value);
                        // Exclude item at current level
                        branchAndBound(level + 1, currentWeight, currentValue);
                      }
                      
                      branchAndBound(0, 0, 0);
                      return best;
                    }
                    
                    // Example usage:
                    const items = [
                      { value: 60, weight: 10 },
                      { value: 100, weight: 20 },
                      { value: 120, weight: 30 },
                    ];
                    const capacity = 50;
                    console.log(knapsackBranchAndBound(capacity, items));
                    `}</code>
                          </pre>
                        </div>
                      ) : selectedSubAlgorithm === "15puzzle" ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">15 Puzzle Problem (Branch and Bound) Code</h3>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code>{`function solve15Puzzle(initialState) {
                      // initialState: an array of length 16 representing the puzzle (0 is the empty space)
                      const goalState = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0];
                    
                      function heuristic(state) {
                        // Manhattan distance heuristic
                        let distance = 0;
                        for (let i = 0; i < state.length; i++) {
                          if (state[i] !== 0) {
                            const targetIndex = state[i] - 1;
                            const currentRow = Math.floor(i / 4);
                            const currentCol = i % 4;
                            const targetRow = Math.floor(targetIndex / 4);
                            const targetCol = targetIndex % 4;
                            distance += Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
                          }
                        }
                        return distance;
                      }
                    
                      let bestSolution = null;
                      let bestCost = Infinity;
                    
                      function branchAndBound(state, cost, depth, visited) {
                        const h = heuristic(state);
                        const f = cost + h;
                        if (f >= bestCost) return;
                        if (arraysEqual(state, goalState)) {
                          bestCost = cost;
                          bestSolution = depth;
                          return;
                        }
                        const neighbors = getNeighbors(state);
                        for (const neighbor of neighbors) {
                          const key = neighbor.join(",");
                          if (!visited.has(key)) {
                            visited.add(key);
                            branchAndBound(neighbor, cost + 1, depth + 1, visited);
                            visited.delete(key);
                          }
                        }
                      }
                    
                      function arraysEqual(a, b) {
                        return a.length === b.length && a.every((val, index) => val === b[index]);
                      }
                    
                      function getNeighbors(state) {
                        const neighbors = [];
                        const zeroIndex = state.indexOf(0);
                        const row = Math.floor(zeroIndex / 4);
                        const col = zeroIndex % 4;
                        const moves = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]];
                        for (const [r, c] of moves) {
                          if (r >= 0 && r < 4 && c >= 0 && c < 4) {
                            const newIndex = r * 4 + c;
                            const newState = [...state];
                            [newState[zeroIndex], newState[newIndex]] = [newState[newIndex], newState[zeroIndex]];
                            neighbors.push(newState);
                          }
                        }
                        return neighbors;
                      }
                    
                      branchAndBound(initialState, 0, 0, new Set());
                      return bestSolution;
                    }
                    
                    // Example usage:
                    const initialState = [1,2,3,4,5,6,7,8,9,10,11,12,13,15,14,0];
                    console.log(solve15Puzzle(initialState));
                    `}</code>
                          </pre>
                        </div>
                      ) : (

                      <div className="py-8 text-center">
                        <p className="text-gray-600">
                          Code implementation for {subOptions.find((o) => o.key === selectedSubAlgorithm)?.name} will be available soon.
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
          <p>© {new Date().getFullYear()} Algo-Sim. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
