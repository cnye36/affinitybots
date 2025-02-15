import { memo } from 'react'
import { EdgeProps, getBezierPath } from 'reactflow'
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CustomEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
  }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    return (
      <>
        <path
          id={id}
          style={style}
          className={`react-flow__edge-path stroke-2 ${
            selected ? "stroke-primary" : "stroke-gray-400"
          } transition-colors`}
          d={edgePath}
          markerEnd={markerEnd}
        />
        {selected && (
          <foreignObject
            width={20}
            height={20}
            x={labelX - 10}
            y={labelY - 10}
            className="overflow-visible"
          >
            <div className="flex items-center justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-5 w-5 rounded-full p-0 hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Break Connection</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </foreignObject>
        )}
      </>
    );
  }
);

CustomEdge.displayName = 'CustomEdge'

