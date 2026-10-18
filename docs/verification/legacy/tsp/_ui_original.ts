// GENERATED from docs/verification/legacy/tsp/original.tsx
import { generateRandomCities, type City, calculateDistances } from "file:///lib/tsp-utils.ts"
import { solveTSP, type TSPStep } from "file:///docs/verification/legacy/tsp/tsp-solver.ts"



export function Comp({ useState, useEffect, useRef }: any) {
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

  return { generateRandomProblem, solveProblem, resetSimulation, setStartCity, handleCoordinatesChange, cities, distances, startCity, steps, error }
}
