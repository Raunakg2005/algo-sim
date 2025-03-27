"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

type HeapTreeProps = {
  array: number[];
  heapSize: number;
  comparing?: [number, number];
  swapping?: [number, number];
  currentNodeIndex?: number;
  sortedIndices?: number[];
};

type TreeNodePosition = {
  x: number;
  y: number;
  level: number;
};

export default function HeapTree({
  array,
  heapSize,
  comparing,
  swapping,
  currentNodeIndex,
  sortedIndices = [],
}: HeapTreeProps) {
  const [positions, setPositions] = useState<TreeNodePosition[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container width using a ref.
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate positions for tree view (only if heapSize is not 0)
  useEffect(() => {
    if (containerWidth === 0) return;
    if (heapSize === 0) return; // Skip tree layout if sorting is complete

    const isMobile = containerWidth < 768;
    const baseWidth = isMobile ? containerWidth - 20 : 600;
    const leftOffset = (containerWidth - baseWidth) / 2;
    const topOffset = -140;
    const levelHeight = isMobile ? 60 : 80;

    const newPositions: TreeNodePosition[] = [];
    for (let i = 0; i < array.length; i++) {
      const level = Math.floor(Math.log2(i + 1));
      const positionInLevel = i - (Math.pow(2, level) - 1);
      const nodesInLevel = Math.pow(2, level);
      const spacing = baseWidth / nodesInLevel;
      const x = leftOffset + spacing * (positionInLevel + 0.5);
      const y = topOffset + level * levelHeight;
      newPositions.push({ x, y, level });
    }
    setPositions(newPositions);
  }, [array, containerWidth, heapSize]);

  const getParentIndex = (i: number) => Math.floor((i - 1) / 2);

  // Render tree edges only if in tree view.
  const edges = array.map((_, index) => {
    if (index === 0) return null;
    const parentIndex = getParentIndex(index);
    if (index >= heapSize) return null;

    const startX = positions[parentIndex]?.x || 0;
    const startY = positions[parentIndex]?.y || 0;
    const endX = positions[index]?.x || 0;
    const endY = positions[index]?.y || 0;

    const isComparing =
      comparing && comparing.includes(parentIndex) && comparing.includes(index);
    const isSwapping =
      swapping && swapping.includes(parentIndex) && swapping.includes(index);

    return (
      <motion.line
        key={`edge-${parentIndex}-${index}`}
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={isSwapping ? "#f59e0b" : isComparing ? "#3b82f6" : "#94a3b8"}
        strokeWidth={isSwapping || isComparing ? 3 : 2}
        strokeDasharray={isSwapping ? "5,5" : "none"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
    );
  });

  // Render nodes for tree view.
  const treeNodes = array.map((value, index) => {
    const isComparing = comparing?.includes(index);
    const isSwapping = swapping?.includes(index);
    const isCurrentNode = index === currentNodeIndex;
    const isSorted = sortedIndices.includes(index);
    const isInHeap = index < heapSize;

    if (!isInHeap && !isSorted) return null;
    const position = positions[index];
    if (!position) return null;

    let nodeColor = `hsl(${(value * 36) % 360}, 70%, 85%)`;
    let ringColor = "";
    const labelColor = "text-stone-700";

    if (isSorted) {
      nodeColor = "hsl(270, 70%, 85%)";
      ringColor = "ring-2 ring-purple-500";
    } else if (isCurrentNode) {
      ringColor = "ring-2 ring-green-500";
    } else if (isComparing) {
      ringColor = "ring-2 ring-blue-500";
    } else if (isSwapping) {
      ringColor = "ring-2 ring-amber-500";
    }

    return (
      <motion.div
        key={`node-${index}`}
        className={cn(
          "absolute flex items-center justify-center rounded-full shadow-md transition-all duration-300",
          ringColor
        )}
        style={{
          left: position.x,
          top: position.y,
          width: 50,
          height: 50,
          backgroundColor: nodeColor,
          transform: "translate(-50%, -50%)",
          zIndex: isCurrentNode || isSwapping ? 10 : 1,
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: 1,
          scale: isCurrentNode || isSwapping ? 1.1 : 1,
          x: isSwapping ? [0, 10, -10, 0] : 0,
        }}
        transition={{
          duration: 0.5,
          x: { duration: 0.3, repeat: isSwapping ? 1 : 0 },
        }}
      >
        <span className={`text-xl font-bold ${labelColor}`}>{value}</span>
        <div className="absolute -bottom-6 text-xs text-stone-500">{index}</div>
        {(isComparing || isSwapping || isCurrentNode || isSorted) && (
          <motion.div
            className={cn(
              "absolute -top-6 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shadow-sm",
              isCurrentNode
                ? "bg-green-100 text-green-800"
                : isComparing
                ? "bg-blue-100 text-blue-800"
                : isSwapping
                ? "bg-amber-100 text-amber-800"
                : isSorted
                ? "bg-purple-100 text-purple-800"
                : ""
            )}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isCurrentNode && "Current"}
            {isComparing && "Compare"}
            {isSwapping && "Swap"}
            {isSorted && "Sorted"}
          </motion.div>
        )}
      </motion.div>
    );
  });

  // If the heap is empty (sorting is complete), render the sorted array in a linear animated view.
  if (heapSize === 0) {
    return (
      <div ref={containerRef} className="w-full flex justify-center items-center p-4">
        {array.map((value, index) => (
          <motion.div
            key={`linear-${index}`}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded shadow"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <span className="font-bold text-stone-700">{value}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  // Otherwise, render the tree view.
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full">{edges}</svg>
      <div className="absolute inset-0">{treeNodes}</div>
    </div>
  );
}
