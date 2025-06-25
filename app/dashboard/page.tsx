"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Database } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const courses = [
  {
    id: "aoa",
    name: "Analysis of Algorithms",
    shortName: "AOA",
    description:
      "Explore algorithm design techniques including sorting, divide & conquer, greedy, dynamic programming, backtracking, and branch & bound",
    icon: <BookOpen className="h-12 w-12 text-purple-500" />,
    color: "border-purple-200 hover:border-purple-400 bg-purple-50",
    topics: "Sorting, Divide & Conquer, Greedy, Dynamic Programming, Backtracking, Branch & Bound",
  },
  {
    id: "ds",
    name: "Data Structures",
    shortName: "DS",
    description:
      "Master fundamental data structures including stacks, queues, linked lists, trees, graphs, and hashing techniques",
    icon: <Database className="h-12 w-12 text-blue-500" />,
    color: "border-blue-200 hover:border-blue-400 bg-blue-50",
    topics: "Stacks, Queues, Linked Lists, Trees, Graphs, Hashing, Sorting",
  },
]

export default function Dashboard() {
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
              <Link href="/dashboard" className="text-purple-700 font-medium">
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
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Choose Your Course
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Select a course to explore interactive simulations and visualizations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card className={`border-2 transition-all duration-300 hover:shadow-lg ${course.color} h-full`}>
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">{course.icon}</div>
                  <CardTitle className="text-2xl font-bold">{course.name}</CardTitle>
                  <CardDescription className="text-lg font-medium text-gray-700">({course.shortName})</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  <div className="bg-white/50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Topics Covered:</p>
                    <p className="text-sm text-gray-600">{course.topics}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/dashboard/${course.id}`} className="w-full">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg py-6">
                      Start Learning {course.shortName}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <h2 className="text-xl font-semibold mb-2 text-center">Getting Started</h2>
          <p className="text-gray-600 text-center mb-4">
            Each course contains interactive simulations to help you understand concepts better
          </p>
          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                1
              </div>
              <p className="text-sm text-gray-600">Choose Course</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                2
              </div>
              <p className="text-sm text-gray-600">Select Topic</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
                3
              </div>
              <p className="text-sm text-gray-600">Interactive Learning</p>
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
