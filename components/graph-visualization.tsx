"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Edge, Node, Graph } from "@/lib/graph-utils"

interface GraphVisualizationProps {
  graph: Graph
  mstEdges: Edge[]
  highlightedEdges: Edge[]
  highlightedNodes: Node[]
  showWeights: boolean
}

export default function GraphVisualization({ 
  graph, 
  mstEdges, 
  highlightedEdges,
  highlightedNodes,
  showWeights 
}: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect()
        setDimensions({ 
          width, 
          height: Math.max(500, width * 0.6) 
        })
      }
    }
    
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])
  
  const isEdgeInMST = (edge: Edge) => {
    return mstEdges.some(e => 
      (e.source.id === edge.source.id && e.target.id === edge.target.id) ||
      (e.source.id === edge.target.id && e.target.id === edge.source.id)
    )
  }
  
  const isEdgeHighlighted = (edge: Edge) => {
    return highlightedEdges.some(e => 
      (e.source.id === edge.source.id && e.target.id === edge.target.id) ||
      (e.source.id === edge.target.id && e.target.id === edge.source.id)
    )
  }
  
  const isNodeHighlighted = (node: Node) => {
    return highlightedNodes.some(n => n.id === node.id)
  }
  
  const isNodeInMST = (node: Node) => {
    return mstEdges.some(e => e.source.id === node.id || e.target.id === node.id)
  }
  
  const getEdgeMidpoint = (edge: Edge) => {
    const sourceX = edge.source.x * dimensions.width
    const sourceY = edge.source.y * dimensions.height
    const targetX = edge.target.x * dimensions.width
    const targetY = edge.target.y * dimensions.height
    
    return {
      x: (sourceX + targetX) / 2,
      y: (sourceY + targetY) / 2
    }
  }
  
  const getLabelOffset = (edge: Edge) => {
    const dx = edge.target.x - edge.source.x
    const dy = edge.target.y - edge.source.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length === 0) return { dx: 0, dy: 0 }
    
    const offsetX = -dy / length * 15
    const offsetY = dx / length * 15
    
    return { dx: offsetX, dy: offsetY }
  }
  
  return (
    <div className="w-full overflow-hidden">
      <svg 
        ref={svgRef}
        width="100%" 
        height={dimensions.height} 
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="border rounded-lg bg-gray-50"
      >
        {/* Edges */}
        {graph.edges.map((edge) => {
          const sourceX = edge.source.x * dimensions.width
          const sourceY = edge.source.y * dimensions.height
          const targetX = edge.target.x * dimensions.width
          const targetY = edge.target.y * dimensions.height
          
          const inMST = isEdgeInMST(edge)
          const isHighlighted = isEdgeHighlighted(edge)
          
          return (
            <g key={`edge-${edge.source.id}-${edge.target.id}`}>
              <motion.line
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  stroke: inMST 
                    ? "#10b981" 
                    : isHighlighted 
                      ? "#3b82f6" 
                      : "#94a3b8",
                  strokeWidth: inMST 
                    ? 4 
                    : isHighlighted 
                      ? 3 
                      : 2
                }}
                transition={{ duration: 0.5 }}
              />
              
              {showWeights && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Weight background */}
                  <rect
                    x={getEdgeMidpoint(edge).x + getLabelOffset(edge).dx - 12}
                    y={getEdgeMidpoint(edge).y + getLabelOffset(edge).dy - 12}
                    width={24}
                    height={24}
                    rx={12}
                    fill={inMST ? "#d1fae5" : isHighlighted ? "#dbeafe" : "white"}
                    stroke={inMST ? "#10b981" : isHighlighted ? "#3b82f6" : "#94a3b8"}
                  />
                  
                  {/* Weight text */}
                  <text
                    x={getEdgeMidpoint(edge).x + getLabelOffset(edge).dx}
                    y={getEdgeMidpoint(edge).y + getLabelOffset(edge).dy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12}
                    fontWeight={inMST || isHighlighted ? "bold" : "normal"}
                    fill={inMST ? "#047857" : isHighlighted ? "#1d4ed8" : "#64748b"}
                  >
                    {edge.weight}
                  </text>
                </motion.g>
              )}
            </g>
          )
        })}
        
        {/* Nodes */}
        {graph.nodes.map((node) => {
          const nodeX = node.x * dimensions.width
          const nodeY = node.y * dimensions.height
          const inMST = isNodeInMST(node)
          const isHighlighted = isNodeHighlighted(node)
          
          return (
            <motion.g 
              key={`node-${node.id}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: isHighlighted ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                duration: 0.5, 
                delay: 0.1 * parseInt(node.id),
                x: { repeat: isHighlighted ? 1 : 0, duration: 0.3 }
              }}
            >
              {/* Node circle */}
              <circle
                cx={nodeX}
                cy={nodeY}
                r={20}
                fill={isHighlighted ? "#3b82f6" : inMST ? "#10b981" : "white"}
                stroke={isHighlighted ? "#1d4ed8" : inMST ? "#047857" : "#64748b"}
                strokeWidth={2}
              />
              
              {/* Node label */}
              <text
                x={nodeX}
                y={nodeY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={14}
                fontWeight="bold"
                fill={isHighlighted || inMST ? "white" : "#1e293b"}
              >
                {node.label}
              </text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
