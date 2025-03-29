"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Plus, Minus, Shuffle } from 'lucide-react'
import GraphVisualization from "./graph-visualization"
import AlgorithmExplanation from "./algorithm-explanation"
import { generateRandomGraph, Edge, Node, Graph } from "@/lib/graph-utils"
import { runKruskalsAlgorithm, runPrimsAlgorithm, AlgorithmStep } from "@/lib/mst-algorithms"

export default function MSTSimulation() {
  const [algorithm, setAlgorithm] = useState<"kruskal" | "prim">("kruskal")
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] })
  const [steps, setSteps] = useState<AlgorithmStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1000) 
  const [showWeights, setShowWeights] = useState(true)
  const [nodeCount, setNodeCount] = useState(6)
  const [edgeDensity, setEdgeDensity] = useState(0.6)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const generateNewGraph = () => {
    const newGraph = generateRandomGraph(nodeCount, edgeDensity)
    setGraph(newGraph)
    resetSimulation(newGraph)
  }
  
  useEffect(() => {
    generateNewGraph()
  }, [])
  
  const runAlgorithm = (graph: Graph, algorithm: "kruskal" | "prim") => {
    let algorithmSteps: AlgorithmStep[] = []
    
    if (algorithm === "kruskal") {
      algorithmSteps = runKruskalsAlgorithm(graph)
    } else {
      algorithmSteps = runPrimsAlgorithm(graph, graph.nodes[0])
    }
    
    setSteps(algorithmSteps)
    setCurrentStepIndex(0)
  }
  
  const resetSimulation = (newGraph?: Graph) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setIsPlaying(false)
    setCurrentStepIndex(0)
    
    const graphToUse = newGraph || graph
    runAlgorithm(graphToUse, algorithm)
  }
  
  useEffect(() => {
    resetSimulation()
  }, [algorithm])
  
  useEffect(() => {
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1)
      }, playbackSpeed)
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false)
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed])
  
  const togglePlay = () => {
    if (currentStepIndex >= steps.length - 1) {
      resetSimulation()
      setIsPlaying(true)
    } else {
      setIsPlaying(!isPlaying)
    }
  }
  
  const stepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }
  
  const stepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }
  
  const currentStep = steps[currentStepIndex] || { 
    type: "initial", 
    message: "Initial graph with weighted edges.", 
    mstEdges: [], 
    highlightedEdges: [],
    highlightedNodes: []
  }
  
  return (
    <div className="space-y-8">
      <Tabs defaultValue="kruskal" onValueChange={(value) => setAlgorithm(value as "kruskal" | "prim")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="kruskal">Kruskal's Algorithm</TabsTrigger>
          <TabsTrigger value="prim">Prim's Algorithm</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kruskal" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Kruskal's Algorithm</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Kruskal's algorithm finds a minimum spanning tree by sorting all edges by weight and adding them to the tree if they don't create a cycle.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="prim" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Prim's Algorithm</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Prim's algorithm builds a minimum spanning tree by starting from a node and repeatedly adding the minimum weight edge that connects a new node to the growing tree.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Explanation panel */}
      <AlgorithmExplanation 
        algorithm={algorithm} 
        step={currentStep} 
        stepIndex={currentStepIndex} 
        totalSteps={steps.length}
      />
      
      {/* Graph visualization */}
      <div className="bg-white rounded-lg shadow-md p-4 overflow-hidden">
        <GraphVisualization 
          graph={graph} 
          mstEdges={currentStep.mstEdges} 
          highlightedEdges={currentStep.highlightedEdges}
          highlightedNodes={currentStep.highlightedNodes}
          showWeights={showWeights}
        />
      </div>
      
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Simulation Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={stepBackward}
                disabled={currentStepIndex === 0 || isPlaying}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button 
                variant={isPlaying ? "destructive" : "default"}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={stepForward}
                disabled={currentStepIndex >= steps.length - 1 || isPlaying}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => resetSimulation()}
                disabled={isPlaying}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button 
                variant="outline" 
                onClick={generateNewGraph}
                disabled={isPlaying}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                New Graph
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="playback-speed">Animation Speed</Label>
                <span className="text-sm text-muted-foreground">
                  {playbackSpeed === 2000 ? "Slow" : playbackSpeed === 1000 ? "Normal" : "Fast"}
                </span>
              </div>
              <Slider
                id="playback-speed"
                min={250}
                max={2000}
                step={250}
                value={[playbackSpeed]}
                onValueChange={(value) => setPlaybackSpeed(value[0])}
                disabled={isPlaying}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-weights"
                checked={showWeights}
                onCheckedChange={setShowWeights}
              />
              <Label htmlFor="show-weights">Show Edge Weights</Label>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Graph Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="node-count">Number of Nodes: {nodeCount}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setNodeCount(prev => Math.max(4, prev - 1))}
                  disabled={nodeCount <= 4 || isPlaying}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Slider
                  id="node-count"
                  min={4}
                  max={12}
                  step={1}
                  value={[nodeCount]}
                  onValueChange={(value) => setNodeCount(value[0])}
                  disabled={isPlaying}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setNodeCount(prev => Math.min(12, prev + 1))}
                  disabled={nodeCount >= 12 || isPlaying}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="edge-density">Edge Density: {Math.round(edgeDensity * 100)}%</Label>
              </div>
              <Slider
                id="edge-density"
                min={0.3}
                max={1}
                step={0.1}
                value={[edgeDensity]}
                onValueChange={(value) => setEdgeDensity(value[0])}
                disabled={isPlaying}
                className="w-full"
              />
            </div>
            
            <Button 
              onClick={generateNewGraph}
              disabled={isPlaying}
              className="w-full"
            >
              Generate New Graph
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
