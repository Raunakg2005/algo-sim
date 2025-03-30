"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { City } from "@/lib/tsp-utils"
import type { TSPStep } from "@/lib/tsp-solver"

interface DPTableVisualizationProps {
  cities: City[]
  currentStep: TSPStep | null
}

export default function DPTableVisualization({ cities, currentStep }: DPTableVisualizationProps) {
  const [dpTable, setDpTable] = useState<Record<string, number>>({})
  const [dpParent, setDpParent] = useState<Record<string, number>>({})
  const [maxBitmask, setMaxBitmask] = useState(0)

  useEffect(() => {
    if (currentStep) {
      setDpTable(currentStep.dpTable || {})
      setDpParent(currentStep.dpParent || {})
      setMaxBitmask((1 << cities.length) - 1)
    }
  }, [currentStep, cities.length])

  const bitmaskToBinary = (mask: number, length: number) => {
    return mask.toString(2).padStart(length, "0")
  }

  const bitmaskToCities = (mask: number) => {
    const cityNames: string[] = []
    for (let i = 0; i < cities.length; i++) {
      if ((mask & (1 << i)) !== 0) {
        cityNames.push(cities[i].name)
      }
    }
    return cityNames.join(", ")
  }

  const isStateHighlighted = (mask: number, city: number) => {
    if (!currentStep) return false

    if (currentStep.type === "dp_update" && currentStep.mask === mask && currentStep.currentCity === city) {
      return true
    }

    return false
  }

  const isOptimalSolution = (mask: number, city: number) => {
    if (!currentStep || currentStep.type !== "final") return false

    return mask === maxBitmask && city === currentStep.startCity
  }

  const getRelevantStates = () => {
    const states: { mask: number; city: number }[] = []

    Object.keys(dpTable).forEach((key) => {
      const [maskStr, cityStr] = key.split(",")
      const mask = Number.parseInt(maskStr)
      const city = Number.parseInt(cityStr)
      states.push({ mask, city })
    })

    return states.sort((a, b) => {
      const bitsA = countBits(a.mask)
      const bitsB = countBits(b.mask)
      if (bitsA !== bitsB) return bitsA - bitsB
      return a.city - b.city
    })
  }

  const countBits = (mask: number) => {
    let count = 0
    let m = mask
    while (m > 0) {
      count += m & 1
      m >>= 1
    }
    return count
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2 bg-gray-100">State (Mask, City)</th>
            <th className="border px-4 py-2 bg-gray-100">Visited Cities</th>
            <th className="border px-4 py-2 bg-gray-100">Min Cost</th>
            <th className="border px-4 py-2 bg-gray-100">Next City</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {getRelevantStates().map(({ mask, city }) => {
              const key = `${mask},${city}`
              const cost = dpTable[key]
              const nextCity = dpParent[key]
              const highlighted = isStateHighlighted(mask, city)
              const isOptimal = isOptimalSolution(mask, city)

              return (
                <motion.tr
                  key={key}
                  initial={{ opacity: 0, backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                  animate={{
                    opacity: 1,
                    backgroundColor: highlighted
                      ? "rgba(59, 130, 246, 0.2)"
                      : isOptimal
                        ? "rgba(16, 185, 129, 0.2)"
                        : "transparent",
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`${highlighted ? "font-medium" : ""} ${isOptimal ? "text-green-700 font-medium" : ""}`}
                >
                  <td className="border px-4 py-2">
                    ({bitmaskToBinary(mask, cities.length)},{" "}
                    {city >= 0 && city < cities.length ? cities[city].name : city})
                  </td>
                  <td className="border px-4 py-2">{bitmaskToCities(mask)}</td>
                  <td className="border px-4 py-2">{cost === Number.POSITIVE_INFINITY ? "∞" : cost}</td>
                  <td className="border px-4 py-2">
                    {nextCity !== undefined && nextCity !== -1
                      ? nextCity >= 0 && nextCity < cities.length
                        ? cities[nextCity].name
                        : nextCity
                      : "—"}
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </tbody>
      </table>

      {/* Explanation of DP state */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
        <p className="font-medium mb-1">DP State Explanation:</p>
        <p>
          <code>dp[mask][city]</code> = minimum cost to visit all cities in the mask and end at city
        </p>
        <p className="mt-2 font-medium mb-1">Recurrence Relation:</p>
        <p>
          <code>
            dp[mask][city] = min(dp[mask - {"{"} city {"}"} ][prev] + distance[prev][city])
          </code>
        </p>
        <p className="text-muted-foreground mt-1">where prev is any city in mask excluding the current city</p>
      </div>
    </div>
  )
}

