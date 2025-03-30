"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import type { City } from "@/lib/tsp-utils"
import type { TSPStep } from "@/lib/tsp-solver"

interface GraphVisualizationProps {
  cities: City[]
  distances: number[][]
  currentStep: TSPStep | null
  showLabels: boolean
}

export default function GraphVisualization({ cities, distances, currentStep, showLabels }: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewBox, setViewBox] = useState("0 0 100 100")

  useEffect(() => {
    const updateViewBox = () => {
      if (svgRef.current && cities.length > 0) {
        const padding = 20
        const minX = Math.min(...cities.map(city => city.x))
        const maxX = Math.max(...cities.map(city => city.x))
        const minY = Math.min(...cities.map(city => city.y))
        const maxY = Math.max(...cities.map(city => city.y))
        
        const width = maxX - minX + padding * 2
        const height = maxY - minY + padding * 2
        const newViewBox = `${minX - padding} ${minY - padding} ${width} ${height}`
        setViewBox(newViewBox)
      }
    }

    updateViewBox()
    window.addEventListener("resize", updateViewBox)
    return () => window.removeEventListener("resize", updateViewBox)
  }, [cities])

  const getTourPath = () => {
    if (!currentStep || !currentStep.tour || currentStep.tour.length <= 1 || cities.length === 0) return null

    const tour = [...currentStep.tour]
    if (currentStep.type === "final") {
      tour.push(tour[0])
    }

    const validPoints = tour
      .filter(cityIndex => cityIndex >= 0 && cityIndex < cities.length)
      .map(cityIndex => `${cities[cityIndex].x},${cities[cityIndex].y}`)

    return validPoints.length >= 2 ? validPoints.join(" ") : null
  }

  const getPartialPath = () => {
    if (!currentStep || !currentStep.partialTour || currentStep.partialTour.length <= 1 || cities.length === 0) return null

    const validPoints = currentStep.partialTour
      .filter(cityIndex => cityIndex >= 0 && cityIndex < cities.length)
      .map(cityIndex => `${cities[cityIndex].x},${cities[cityIndex].y}`)

    return validPoints.length >= 2 ? validPoints.join(" ") : null
  }

  const isEdgeInTour = (fromIndex: number, toIndex: number) => {
    if (!currentStep?.tour || currentStep.tour.length <= 1) return false

    const tour = currentStep.type === "final" ? [...currentStep.tour, currentStep.tour[0]] : currentStep.tour
    for (let i = 0; i < tour.length - 1; i++) {
      if ((tour[i] === fromIndex && tour[i + 1] === toIndex) || 
          (tour[i] === toIndex && tour[i + 1] === fromIndex)) return true
    }
    return false
  }

  const isCityHighlighted = (cityIndex: number) => {
    return currentStep?.type === "dp_update" 
      ? (currentStep.currentCity === cityIndex || currentStep.nextCity === cityIndex)
      : currentStep?.currentCity === cityIndex
  }

  const getEdgeMidpoint = (city1: City, city2: City) => ({
    x: (city1.x + city2.x) / 2,
    y: (city1.y + city2.y) / 2
  })

  const getLabelOffset = (city1: City, city2: City) => {
    const dx = city2.x - city1.x
    const dy = city2.y - city1.y
    const length = Math.sqrt(dx * dx + dy * dy)
    return length === 0 ? { dx: 0, dy: 0 } : {
      dx: (-dy / length) * 15,
      dy: (dx / length) * 15
    }
  }

  if (cities.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center border rounded-lg bg-gray-50">
        <p className="text-muted-foreground">Add cities or generate a random problem to start</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBox}
        className="border rounded-lg bg-gray-50"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Edges */}
        {cities.map((city1, i) =>
          cities.slice(i + 1).map((city2, j) => {
            const edgeKey = `${i}-${i + j + 1}`
            const inTour = isEdgeInTour(i, i + j + 1)
            const isHighlighted = currentStep?.type === "dp_update" &&
              [currentStep.currentCity, currentStep.nextCity].includes(i) &&
              [currentStep.currentCity, currentStep.nextCity].includes(i + j + 1)

            return (
              <g key={`edge-${edgeKey}`}>
                <motion.line
                  x1={city1.x}
                  y1={city1.y}
                  x2={city2.x}
                  y2={city2.y}
                  stroke={inTour ? "#10b981" : isHighlighted ? "#3b82f6" : "#94a3b8"}
                  strokeWidth={inTour ? 3 : isHighlighted ? 2 : 1}
                  strokeOpacity={inTour || isHighlighted ? 1 : 0.5}
                  strokeDasharray={isHighlighted && !inTour ? "5,5" : "none"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inTour || isHighlighted ? 1 : 0.5 }}
                />

                {showLabels && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inTour || isHighlighted ? 1 : 0.7 }}
                  >
                    <rect
                      x={getEdgeMidpoint(city1, city2).x + getLabelOffset(city1, city2).dx - 12}
                      y={getEdgeMidpoint(city1, city2).y + getLabelOffset(city1, city2).dy - 12}
                      width={24}
                      height={24}
                      rx={12}
                      fill={inTour ? "#d1fae5" : isHighlighted ? "#dbeafe" : "white"}
                      stroke={inTour ? "#10b981" : isHighlighted ? "#3b82f6" : "#94a3b8"}
                    />
                    <text
                      x={getEdgeMidpoint(city1, city2).x + getLabelOffset(city1, city2).dx}
                      y={getEdgeMidpoint(city1, city2).y + getLabelOffset(city1, city2).dy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={12}
                      fontWeight={inTour || isHighlighted ? "bold" : "normal"}
                      fill={inTour ? "#047857" : isHighlighted ? "#1d4ed8" : "#64748b"}
                    >
                      {distances[i][i + j + 1]}
                    </text>
                  </motion.g>
                )}
              </g>
            )
          })
        )}

        {/* Tour paths */}
        {getTourPath() && (
          <motion.polyline
            points={getTourPath() || ""}
            fill="none"
            stroke="#10b981"
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
        )}

        {getPartialPath() && (
          <motion.polyline
            points={getPartialPath() || ""}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5,5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Cities */}
        {cities.map((city, index) => {
          const isHighlighted = isCityHighlighted(index)
          const isStart = currentStep?.startCity === index

          return (
            <motion.g
              key={`city-${city.id}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: isHighlighted ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                duration: 0.5,
                x: { repeat: isHighlighted ? Infinity : 0, duration: 0.3 }
              }}
            >
              <circle
                cx={city.x}
                cy={city.y}
                r={isStart ? 8 : 6}
                fill={isStart ? "#f59e0b" : isHighlighted ? "#3b82f6" : "#10b981"}
                stroke={isStart ? "#d97706" : isHighlighted ? "#1d4ed8" : "#047857"}
                strokeWidth={2}
              />
              <text
                x={city.x}
                y={city.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fill="white"
              >
                {city.name}
              </text>
            </motion.g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-600 mr-2"></div>
          <span>Tour City</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-600 mr-2"></div>
          <span>Current City</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-amber-600 mr-2"></div>
          <span>Starting City</span>
        </div>
      </div>
    </div>
  )
}