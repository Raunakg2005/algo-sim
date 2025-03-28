import Link from "next/link"
import { ArrowRight, Code, Lightbulb, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Algo-Sim
              </h1>
              <p className="text-xl mb-8 text-purple-100">
                Learn algorithms through interactive visualizations. See how algorithms work step by step with beautiful animations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button
                  size="lg"
                  className="bg-white text-purple-800 hover:bg-purple-100 hover:scale-105 hover:translate-x-1 transition-transform duration-200 ease-in-out"
                  >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                  size="lg"
                  className="bg-purple-700 text-white hover:bg-purple-800 hover:scale-105 hover:translate-x-1 transition-transform duration-200 ease-in-out"
                  >
                  Learn More
                  </Button>
                </Link>
                
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="w-full max-w-md bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/20">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-2 font-mono text-sm text-white">
                  <div className="pl-4 border-l-2 border-green-400">function mergeSort(arr) &#123;</div>
                  <div className="pl-8 border-l-2 border-green-400">if (arr.length &lt;= 1) {'{'} return arr; {'}'}</div>
                  <div className="pl-8 border-l-2 border-green-400">const mid = Math.floor(arr.length / 2);</div>
                  <div className="pl-8 border-l-2 border-green-400">const left = mergeSort(arr.slice(0, mid));</div>
                  <div className="pl-8 border-l-2 border-green-400">const right = mergeSort(arr.slice(mid));</div>
                  <div className="pl-8 border-l-2 border-green-400">return merge(left, right);</div>
                  <div className="pl-4 border-l-2 border-green-400">{'}'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Learn With Visualizations?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Learning</h3>
              <p className="text-gray-600">
                Interact with algorithms in real-time. Adjust parameters and see how they affect performance.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Step-by-Step Breakdown</h3>
              <p className="text-gray-600">
                Follow each step of the algorithm with clear explanations and visual cues.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Intuitive Understanding</h3>
              <p className="text-gray-600">
                Gain deeper insights into how algorithms work through visual representations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Algorithm Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Divide and Conquer", color: "from-purple-500 to-purple-700" },
              { name: "Greedy Technique", color: "from-blue-500 to-blue-700" },
              { name: "Dynamic Programming", color: "from-green-500 to-green-700" },
              { name: "Backtracking", color: "from-yellow-500 to-yellow-700" },
              { name: "Branch and Bound", color: "from-red-500 to-red-700" },
              { name: "Graph Algorithms", color: "from-indigo-500 to-indigo-700" },
            ].map((category, index) => (
              <div key={index} className={`rounded-lg p-6 text-white bg-gradient-to-r ${category.color} shadow-md`}>
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="mb-4 opacity-90">Explore various algorithms in this category</p>
                <Link href="/dashboard">
                    <Button className="bg-white text-purple-800 hover:bg-purple-100 hover:scale-105 transition-transform duration-200 ease-in-out">
                      Explore
                    </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start learning?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Dive into our interactive visualizations and master algorithms through visual learning.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-100">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Algo-Sim</h3>
              <p className="text-gray-400">Learn algorithms through interactive visualizations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="hover:text-purple-400">Dashboard</Link>
              <Link href="#" className="hover:text-purple-400">About</Link>
              <Link href="#" className="hover:text-purple-400">Contact</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Algo-Sim. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

