"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"
import type { City } from "@/lib/tsp-utils"

interface CoordinateInputProps {
  cities: City[]
  onChange: (cities: City[]) => void
  disabled?: boolean
}

export default function CoordinateInput({ cities, onChange, disabled = false }: CoordinateInputProps) {
  const [newCityName, setNewCityName] = useState("")
  const [newCityX, setNewCityX] = useState("")
  const [newCityY, setNewCityY] = useState("")

  const addCity = () => {
    if (!newCityName || !newCityX || !newCityY) return

    const x = Number.parseFloat(newCityX)
    const y = Number.parseFloat(newCityY)

    if (isNaN(x) || isNaN(y)) return

    const newCity: City = {
      id: Date.now(),
      name: newCityName,
      x,
      y,
    }

    onChange([...cities, newCity])

    setNewCityName("")
    setNewCityX("")
    setNewCityY("")
  }

  const removeCity = (id: number) => {
    onChange(cities.filter((city) => city.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="city-name">City Name</Label>
          <Input
            id="city-name"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            placeholder="e.g., A, B, C"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor="city-x">X Coordinate</Label>
          <Input
            id="city-x"
            value={newCityX}
            onChange={(e) => setNewCityX(e.target.value)}
            placeholder="e.g., 100"
            type="number"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor="city-y">Y Coordinate</Label>
          <Input
            id="city-y"
            value={newCityY}
            onChange={(e) => setNewCityY(e.target.value)}
            placeholder="e.g., 200"
            type="number"
            disabled={disabled}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={addCity} className="w-full" disabled={disabled || !newCityName || !newCityX || !newCityY}>
            <Plus className="h-4 w-4 mr-2" />
            Add City
          </Button>
        </div>
      </div>

      {cities.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">X</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Y</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cities.map((city) => (
                <tr key={city.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{city.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{city.x}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{city.y}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => removeCity(city.id)} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
