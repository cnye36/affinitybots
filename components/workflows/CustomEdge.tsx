import { memo } from 'react'
import { EdgeProps, getBezierPath } from 'reactflow'

export const CustomEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <path
      id={id}
      style={style}
      className="react-flow__edge-path stroke-2 stroke-gray-400"
      d={edgePath}
      markerEnd={markerEnd}
    />
  )
})

CustomEdge.displayName = 'CustomEdge'

