//make an improve version of this
"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, Shuffle } from "lucide-react"
import GraphVisualization from "./tsp-graph-visualization"
import DPTableVisualization from "./dp-table-visualization"
import { generateRandomCities, type City, calculateDistances } from "@/lib/tsp-utils"
import { solveTSP, type TSPStep } from "@/lib/tsp-solver"
import CoordinateInput from "./coordinate-input"
import DistanceMatrixInput from "./distance-matrix-input"
import StepExplanation from "./tsp-step-explanation"

export default function TSPSimulation() {
  const [inputMode, setInputMode] = useState<"coordinates" | "matrix">("coordinates")

  const [cities, setCities] = useState<City[]>([])
  const [distances, setDistances] = useState<number[][]>([])
  const [startCity, setStartCity] = useState<number>(0)

  const [steps, setSteps] = useState<TSPStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1000) 
  const [showLabels, setShowLabels] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentStep = steps[currentStepIndex] || null

  const generateRandomProblem = (cityCount = 5) => {
    if (cityCount < 3) {
      setError("Please generate at least 3 cities")
      return
    }

    if (cityCount > 8) {
      setError("For clarity, please limit to 8 cities or fewer")
      return
    }

    setError(null)
    const newCities = generateRandomCities(cityCount)
    setCities(newCities)

    const newDistances = calculateDistances(newCities)
    setDistances(newDistances)

    setStartCity(0)
    resetSimulation(newCities, newDistances, 0)
  }

  const solveProblem = () => {
    if (cities.length < 3 && inputMode === "coordinates") {
      setError("Please add at least 3 cities")
      return
    }

    if (distances.length < 3 && inputMode === "matrix") {
      setError("Please create a distance matrix with at least 3 cities")
      return
    }

    setError(null)
    resetSimulation(cities, distances, startCity)
  }

  const resetSimulation = (newCities: City[], newDistances: number[][], newStartCity: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setIsPlaying(false)
    setCurrentStepIndex(0)

    const newSteps = solveTSP(newDistances, newStartCity)
    setSteps(newSteps)
  }

  useEffect(() => {
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1)
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
      setCurrentStepIndex(0)
      setIsPlaying(true)
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  const stepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    }
  }

  const stepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1)
    }
  }

  const handleCoordinatesChange = (newCities: City[]) => {
    setCities(newCities)
    const newDistances = calculateDistances(newCities)
    setDistances(newDistances)
  }

  const handleMatrixChange = (newDistances: number[][]) => {
    setDistances(newDistances)

    const cityCount = newDistances.length
    const newCities: City[] = []

    for (let i = 0; i < cityCount; i++) {
      const angle = (i / cityCount) * 2 * Math.PI
      const x = 250 + Math.cos(angle) * 200
      const y = 250 + Math.sin(angle) * 200
      newCities.push({ id: i, name: String.fromCharCode(65 + i), x, y })
    }

    setCities(newCities)
  }

  return (
    <div className="space-y-8">
      <div className="text-center text-4xl font-extrabold text-gray-800 py-8">
        A Much Improved Version is on Its Way!
      </div>
      {/* Input Tabs */}
      <Tabs defaultValue="coordinates" onValueChange={(value) => setInputMode(value as "coordinates" | "matrix")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coordinates">City Coordinates</TabsTrigger>
          <TabsTrigger value="matrix">Distance Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="coordinates" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Define Cities by Coordinates</CardTitle>
            </CardHeader>
            <CardContent>
              <CoordinateInput cities={cities} onChange={handleCoordinatesChange} disabled={isPlaying} />

              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={() => generateRandomProblem(5)} disabled={isPlaying}>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Generate 5 Random Cities
                </Button>

                <Button variant="outline" onClick={solveProblem} disabled={isPlaying || cities.length < 3}>
                  Solve TSP
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Define Distance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <DistanceMatrixInput distances={distances} onChange={handleMatrixChange} disabled={isPlaying} />

              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={() => generateRandomProblem(5)} disabled={isPlaying}>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Generate 5 Random Cities
                </Button>

                <Button variant="outline" onClick={solveProblem} disabled={isPlaying || distances.length < 3}>
                  Solve TSP
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error message */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}
      {/* Controls */}
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

                <Button variant={isPlaying ? "destructive" : "default"} onClick={togglePlay}>
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
                  onClick={() => resetSimulation(cities, distances, startCity)}
                  disabled={isPlaying}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                <div className="ml-auto flex items-center space-x-2">
                  <Switch id="show-labels" checked={showLabels} onCheckedChange={setShowLabels} />
                  <Label htmlFor="show-labels">Show Distance Labels</Label>
                </div>
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

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="start-city">Starting City</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cities.map((city, index) => (
                    <Button
                      key={city.id}
                      variant={startCity === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setStartCity(index)
                        resetSimulation(cities, distances, index)
                      }}
                      disabled={isPlaying}
                    >
                      {city.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
      {/* Simulation area - only show if we have steps */}
      {steps.length > 0 && (
        <>
          {/* Step explanation */}
          <StepExplanation step={currentStep} stepIndex={currentStepIndex} totalSteps={steps.length} />

          {/* Visualization area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graph visualization */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Graph Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <GraphVisualization
                  cities={cities}
                  distances={distances}
                  currentStep={currentStep}
                  showLabels={showLabels}
                />
              </CardContent>
            </Card>

            {/* DP Table visualization */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">DP Table Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <DPTableVisualization cities={cities} currentStep={currentStep} />
              </CardContent>
            </Card>
          </div>


        </>
      )}
    </div>
  )
}

