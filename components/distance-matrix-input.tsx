"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Minus } from 'lucide-react'

interface DistanceMatrixInputProps {
  distances: number[][]
  onChange: (distances: number[][]) => void
  disabled?: boolean
}

export default function DistanceMatrixInput({ 
  distances, 
  onChange,
  disabled = false
}: DistanceMatrixInputProps) {
  const [size, setSize] = useState(distances.length || 0)
  const [matrix, setMatrix] = useState<number[][]>(distances)
  
  useEffect(() => {
    if (size !== matrix.length) {
      const newMatrix: number[][] = []
      
      for (let i = 0; i < size; i++) {
        newMatrix[i] = []
        for (let j = 0; j < size; j++) {
          if (i === j) {
            newMatrix[i][j] = 0 
          } else if (i < matrix.length && j < matrix[i].length) {
            newMatrix[i][j] = matrix[i][j] 
          } else {
            newMatrix[i][j] = 0 
          }
        }
      }
      
      setMatrix(newMatrix)
      onChange(newMatrix)
    }
  }, [size])
  
  const updateCell = (row: number, col: number, value: string) => {
    const numValue = parseInt(value)
    
    if (isNaN(numValue) || numValue < 0) return
    
    const newMatrix = [...matrix]
    newMatrix[row][col] = numValue
    
    if (row !== col) {
      newMatrix[col][row] = numValue
    }
    
    setMatrix(newMatrix)
    onChange(newMatrix)
  }
  
  const increaseSize = () => {
    setSize(prev => Math.min(prev + 1, 8)) 
  }
  
  const decreaseSize = () => {
    setSize(prev => Math.max(prev - 1, 0))
  }
  
  const getCityLabel = (index: number) => {
    return String.fromCharCode(65 + index)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Label>Matrix Size:</Label>
        <Button
          variant="outline"
          size="icon"
          onClick={decreaseSize}
          disabled={disabled || size <= 2}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="font-medium">{size} × {size}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={increaseSize}
          disabled={disabled || size >= 8}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {size > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="border px-2 py-1 bg-gray-100"></th>
                {Array.from({ length: size }).map((_, i) => (
                  <th key={i} className="border px-2 py-1 bg-gray-100 w-16">
                    {getCityLabel(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: size }).map((_, row) => (
                <tr key={row}>
                  <th className="border px-2 py-1 bg-gray-100">
                    {getCityLabel(row)}
                  </th>
                  {Array.from({ length: size }).map((_, col) => (
                    <td key={col} className="border p-1">
                      <Input
                        type="number"
                        min="0"
                        value={matrix[row]?.[col] || 0}
                        onChange={(e) => updateCell(row, col, e.target.value)}
                        className={`w-16 h-8 text-center ${row === col ? 'bg-gray-100' : ''}`}
                        disabled={disabled || row === col} 
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        Note: The matrix is symmetric (distance from A to B equals distance from B to A).
      </p>
    </div>
  )
}
