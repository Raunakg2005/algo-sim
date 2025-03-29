export interface Node {
    id: string
    label: string
    x: number // normalized position (0-1)
    y: number // normalized position (0-1)
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
  
  // Generate a random graph with n nodes and approximately density*n*(n-1)/2 edges
  export function generateRandomGraph(nodeCount: number, density: number): Graph {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    // Create nodes in a circular layout
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * 2 * Math.PI
      const radius = 0.35 // Normalized radius
      
      // Add some randomness to the positions
      const jitter = 0.05
      const jitterX = (Math.random() - 0.5) * jitter
      const jitterY = (Math.random() - 0.5) * jitter
      
      // Calculate position on a circle
      const x = 0.5 + Math.cos(angle) * radius + jitterX
      const y = 0.5 + Math.sin(angle) * radius + jitterY
      
      nodes.push({
        id: i.toString(),
        label: String.fromCharCode(65 + i), // A, B, C, ...
        x,
        y
      })
    }
    
    // Create edges with random weights
    const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2
    const targetEdgeCount = Math.floor(maxPossibleEdges * density)
    
    // Create a list of all possible edges
    const possibleEdges: { source: number, target: number }[] = []
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        possibleEdges.push({ source: i, target: j })
      }
    }
    
    // Shuffle the possible edges
    for (let i = possibleEdges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[possibleEdges[i], possibleEdges[j]] = [possibleEdges[j], possibleEdges[i]]
    }
    
    // Take the first targetEdgeCount edges
    for (let i = 0; i < Math.min(targetEdgeCount, possibleEdges.length); i++) {
      const { source, target } = possibleEdges[i]
      edges.push({
        source: nodes[source],
        target: nodes[target],
        weight: Math.floor(Math.random() * 20) + 1 // Random weight between 1 and 20
      })
    }
    
    // Ensure the graph is connected
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
    
    dfs("0") // Start DFS from the first node
    
    // If not all nodes are visited, add edges to connect them
    if (visited.size < nodeCount) {
      for (let i = 0; i < nodeCount; i++) {
        if (!visited.has(i.toString())) {
          // Connect to a random visited node
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
  