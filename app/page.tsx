"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Code, Lightbulb, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "./footer";

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.style.transitionDelay = target.dataset.delay || "0s";
            entry.target.classList.add("opacity-100", "translate-y-0");
          } else {
            entry.target.classList.remove("opacity-100", "translate-y-0");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".slide-up");
    elements.forEach((el, index) => {
      (el as HTMLElement).style.transitionDelay = `${index * 0.1}s`; // Add staggered delay
      el.classList.add(
        "opacity-0",
        "translate-y-10",
        "transition-all",
        "duration-700",
        "ease-out"
      );
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header
        className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white h-screen flex items-center"
        style={{
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="container mx-auto px-6 slide-up" data-delay="0s">
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
                    className="bg-white text-purple-800 hover:bg-purple-100 hover:scale-110 hover:translate-x-2 transition-transform duration-300 ease-in-out"
                  >
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    size="lg"
                    className="bg-purple-700 text-white hover:bg-purple-800 hover:scale-110 hover:translate-x-2 transition-transform duration-300 ease-in-out"
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
      <section id="features" className="py-16 bg-gray-50 slide-up" data-delay="0.2s">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Learn With Visualizations?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6 text-purple-600" />,
                title: "Interactive Learning",
                description: "Interact with algorithms in real-time. Adjust parameters and see how they affect performance.",
                bgColor: "bg-purple-100",
              },
              {
                icon: <Code className="h-6 w-6 text-blue-600" />,
                title: "Step-by-Step Breakdown",
                description: "Follow each step of the algorithm with clear explanations and visual cues.",
                bgColor: "bg-blue-100",
              },
              {
                icon: <Lightbulb className="h-6 w-6 text-green-600" />,
                title: "Intuitive Understanding",
                description: "Gain deeper insights into how algorithms work through visual representations.",
                bgColor: "bg-green-100",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`bg-white p-6 rounded-lg shadow-md transform transition-transform duration-500 hover:scale-105`}
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-full flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-16 bg-white slide-up" data-delay="0.4s">
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
              <div
                key={index}
                className={`rounded-lg p-6 text-white bg-gradient-to-r ${category.color} shadow-md transform transition-transform duration-500 hover:scale-105`}
              >
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="mb-4 opacity-90">Explore various algorithms in this category</p>
                <Link href="/dashboard">
                  <Button className="bg-white text-purple-800 hover:bg-purple-100 hover:scale-110 transition-transform duration-300 ease-in-out">
                    Explore
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-full slide-up"
        data-delay="0.6s"
        style={{
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start learning?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Dive into our interactive visualizations and master algorithms through visual learning.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-white text-purple-700 hover:bg-purple-100 hover:scale-110 hover:translate-x-2 transition-transform duration-300 ease-in-out"
            >
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

