export interface Node {
    id: string
    label: string
    x: number 
    y: number 
  }
  
  export interface Edge {
    source: Node
    target: Node
    weight: number
  }
  
  export interface Graph {
    nodes: Node[]
    edges: Edge[]
  }
  
  export function generateRandomGraph(nodeCount: number, density: number): Graph {
    const nodes: Node[] = []
    const edges: Edge[] = []

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI
      const radius = 0.35
      
      const jitter = 0.05
      const jitterX = (Math.random() - 0.5) * jitter
      const jitterY = (Math.random() - 0.5) * jitter
      
      const x = 0.5 + Math.cos(angle) * radius + jitterX
      const y = 0.5 + Math.sin(angle) * radius + jitterY
      
      nodes.push({
        id: i.toString(),
        label: String.fromCharCode(65 + i), 
        x,
        y
      })
    }
    
    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2
    const targetEdgeCount = Math.floor(maxPossibleEdges * density)
    
    const possibleEdges: { source: number, target: number }[] = []
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        possibleEdges.push({ source: i, target: j })
      }
    }
    
    for (let i = possibleEdges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[possibleEdges[i], possibleEdges[j]] = [possibleEdges[j], possibleEdges[i]]
    }
    
    for (let i = 0; i < Math.min(targetEdgeCount, possibleEdges.length); i++) {
      const { source, target } = possibleEdges[i]
      edges.push({
        source: nodes[source],
        target: nodes[target],
        weight: Math.floor(Math.random() * 20) + 1 
      })
    }
    
    const visited = new Set<string>()
    const dfs = (nodeId: string) => {
      visited.add(nodeId)
      edges.forEach(edge => {
        if (edge.source.id === nodeId && !visited.has(edge.target.id)) {
          dfs(edge.target.id)
        } else if (edge.target.id === nodeId && !visited.has(edge.source.id)) {
          dfs(edge.source.id)
        }
      })
    }
    
    dfs("0") 
    
    if (visited.size < nodeCount) {
      for (let i = 0; i < nodeCount; i++) {
        if (!visited.has(i.toString())) {
          const visitedNodeId = Array.from(visited)[Math.floor(Math.random() * visited.size)]
          edges.push({
            source: nodes[parseInt(visitedNodeId)],
            target: nodes[i],
            weight: Math.floor(Math.random() * 20) + 1
          })
          dfs(i.toString())
        }
      }
    }
    
    return { nodes, edges }
  }
  