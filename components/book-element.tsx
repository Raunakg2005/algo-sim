"use client"

import { motion } from "framer-motion"

interface BookElementProps {
  value: number
}

export function BookElement({ value }: BookElementProps) {
  // Generate a color based on the value
  const hue = (value * 3.6) % 360 // Map 0-100 to 0-360 degrees hue
  const color = `hsl(${hue}, 70%, 85%)`
  const spineColor = `hsl(${hue}, 70%, 75%)`

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-12 h-16 rounded-sm shadow-md flex items-center justify-center"
        style={{
          background: color,
          borderLeft: `4px solid ${spineColor}`,
        }}
        whileHover={{
          y: -5,
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Book cover */}
        <div className="absolute inset-0 border-r border-b border-t border-gray-300 rounded-sm bg-opacity-20" />

        {/* Book pages edge */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-r-sm" />

        {/* Book value */}
        <span className="text-sm font-bold z-10 text-gray-700">{value}</span>
      </motion.div>

      {/* Book shadow on table */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mt-1" />
    </div>
  )
}

