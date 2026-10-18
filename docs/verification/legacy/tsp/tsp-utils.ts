export interface City {
    id: number
    name: string
    x: number
    y: number
  }
  
  export function generateRandomCities(count: number): City[] {
    const cities: City[] = []
  
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 400) + 50
      const y = Math.floor(Math.random() * 400) + 50
  
      cities.push({
        id: i,
        name: String.fromCharCode(65 + i), 
        x,
        y,
      })
    }
  
    return cities
  }
  
  export function calculateDistances(cities: City[]): number[][] {
    const n = cities.length
    const distances: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0))
  
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          distances[i][j] = 0
        } else {
          const dx = cities[i].x - cities[j].x
          const dy = cities[i].y - cities[j].y
          distances[i][j] = Math.round(Math.sqrt(dx * dx + dy * dy))
        }
      }
    }
  
    return distances
  }
