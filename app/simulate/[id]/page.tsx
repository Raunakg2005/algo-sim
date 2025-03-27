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

interface Option {
  key: string
  name: string
  description: string
}

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
                      ) : selectedSubAlgorithm === "quickSort" ? (
                        <QuickSortVisualization />
                      ) : selectedSubAlgorithm === "heapSort" ? (
                        <HeapSortVisualization />
                      ) : (
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
                            <strong>Divide:</strong> Split matrices into 4 submatrices each
                          </li>
                          <li>
                            <strong>Compute 7 Products:</strong>
                            <ul className="list-disc pl-5 mt-2">
                              <li>P1 = A11(S22 - S21)</li>
                              <li>P2 = (S11 + S22)B11</li>
                              <li>... (other Strassen formulas)</li>
                            </ul>
                          </li>
                          <li>
                            <strong>Combine:</strong> Calculate final matrix using these products
                          </li>
                        </ol>

                        <h4 className="text-lg font-semibold mt-6">Time Complexity</h4>
                        <p>
                          O(n<sup>log<sub>2</sub>7</sup>) ≈ O(n<sup>2.807</sup>)
                        </p>

                        <h4 className="text-lg font-semibold mt-4">Advantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Better asymptotic complexity than standard O(n³)</li>
                          <li>Foundation for improved matrix algorithms</li>
                        </ul>

                        <h4 className="text-lg font-semibold mt-4">Disadvantages</h4>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Larger constant factors in time complexity</li>
                          <li>Not practical for small matrices</li>
                          <li>Requires square matrices of power-of-two size</li>
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
