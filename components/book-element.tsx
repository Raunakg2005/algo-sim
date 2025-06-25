"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BookElementProps {
  value: number
  index: number
  isPivot?: boolean
  isLeftPointer?: boolean
  isRightPointer?: boolean
  isSwapping?: boolean
  isActive?: boolean
}

export default function BookElement({
  value,
  index,
  isPivot = false,
  isLeftPointer = false,
  isRightPointer = false,
  isSwapping = false,
  isActive = true,
}: BookElementProps) {
  
  const height = 100 + value * 15 
  
  const hue = (value * 36) % 360 
  const bookColor = `hsl(${hue}, 70%, 85%)`
  const bookSpineColor = `hsl(${hue}, 70%, 75%)`
  const bookTopColor = `hsl(${hue}, 70%, 90%)`

  return (
    <motion.div
      className={cn("relative mx-1 transition-all duration-500", isActive ? "opacity-100" : "opacity-40")}
      initial={{ y: 0 }}
      animate={{
        y: isSwapping ? [-20, 0] : 0,
        scale: isPivot ? 1.05 : 1,
        zIndex: isPivot ? 10 : isSwapping ? 5 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      <div
        className="relative"
        style={{
          width: "40px",
          height: `${height}px`,
        }}
      >
        <div
          className={cn(
            "absolute bottom-0 w-full rounded-sm shadow-md transition-all duration-300",
            isPivot ? "ring-2 ring-amber-500" : "",
          )}
          style={{
            height: `${height}px`,
            width: "40px",
            backgroundColor: bookColor,
            transform: "perspective(500px) rotateY(5deg)",
            transformOrigin: "left",
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[5px] rounded-l-sm"
            style={{
              backgroundColor: bookSpineColor,
            }}
          ></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-stone-700">{value}</span>
          </div>
        </div>

        <div
          className="absolute top-0 w-full h-[5px] rounded-t-sm"
          style={{
            width: "40px",
            backgroundColor: bookTopColor,
            transform: "perspective(500px) rotateX(-45deg)",
            transformOrigin: "bottom",
          }}
        ></div>
      </div>

      <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-stone-500">{index}</div>

      {isLeftPointer && (
        <motion.div
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          i
        </motion.div>
      )}

      {isRightPointer && (
        <motion.div
          className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          j
        </motion.div>
      )}

      {isPivot && (
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-amber-100 px-2 py-1 rounded text-xs font-bold text-amber-800 whitespace-nowrap shadow-sm"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Pivot
        </motion.div>
      )}

      {isSwapping && (
        <motion.div
          className="absolute inset-0 rounded-sm"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.3, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
          style={{
            backgroundColor: "rgba(249, 115, 22, 0.3)",
            zIndex: -1,
          }}
        />
      )}
    </motion.div>
  )
}
