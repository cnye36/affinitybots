"use client"

import { useState } from "react"
import { EdgeProps, getBezierPath } from "reactflow"

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    if (data?.onDelete) {
      data.onDelete(id)
    }
  }

  return (
    <>
      {/* Invisible wide path for hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Visible edge path */}
      <path
        d={edgePath}
        fill="none"
        style={{
          ...style,
          strokeWidth: isHovered ? 3 : 2,
          stroke: isHovered ? "rgb(59, 130, 246)" : (style.stroke as string) || "#b1b1b7",
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
        markerEnd={markerEnd}
        className="pointer-events-none"
      />

      {/* Delete button - using SVG instead of foreignObject for better click handling */}
      {isHovered && (
        <g
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="cursor-pointer"
          style={{ pointerEvents: "all" }}
        >
          {/* White border circle */}
          <circle
            cx={labelX}
            cy={labelY}
            r={14}
            fill="white"
            className="dark:fill-gray-800"
          />
          {/* Red background circle */}
          <circle
            cx={labelX}
            cy={labelY}
            r={12}
            fill="#ef4444"
            className="hover:fill-red-600 transition-colors"
          />
          {/* X icon */}
          <g stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1={labelX - 5} y1={labelY - 5} x2={labelX + 5} y2={labelY + 5} />
            <line x1={labelX + 5} y1={labelY - 5} x2={labelX - 5} y2={labelY + 5} />
          </g>
        </g>
      )}
    </>
  )
}
