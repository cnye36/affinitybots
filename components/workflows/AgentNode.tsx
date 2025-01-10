import { Handle, Position } from "reactflow";
import Image from "next/image";
interface AgentNodeData {
  label: string;
  agentId: string;
  avatar?: string;
}

export function AgentNode({ data }: { data: AgentNodeData }) {
  return (
    <div className="bg-card border rounded-lg shadow-sm px-4 py-2 min-w-[180px]">
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {data.avatar ? (
            <Image
              src={data.avatar}
              alt={data.label}
              className="h-10 w-10 rounded-full ring-2 ring-background"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-full ring-2 ring-background flex items-center justify-center text-xs font-medium text-white"
              style={{
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
              }}
            >
              {data.label.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">
            {data.label}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  );
}

AgentNode.displayName = "AgentNode";
