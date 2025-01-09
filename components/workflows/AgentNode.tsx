import React, { memo, useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, Settings } from "lucide-react";
import { AgentConfigModal } from "../configuration/AgentConfigModal";
import { AgentConfig } from "@/types/agent";

interface AgentNodeProps {
  data: {
    label: string;
    agentId: string;
  };
}

export const AgentNode = memo(({ data }: AgentNodeProps) => {
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await axios.get(`/api/agents/${data.agentId}`);
        setAgent(response.data);
      } catch (err) {
        console.error("Error fetching agent:", err);
        setError("Failed to load agent");
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [data.agentId]);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection in ReactFlow
    setIsConfigModalOpen(true);
  };

  const handleConfigSave = async (updatedConfig: AgentConfig) => {
    try {
      const response = await axios.put(
        `/api/agents/${data.agentId}`,
        updatedConfig
      );
      setAgent(response.data);
      setIsConfigModalOpen(false);
    } catch (err) {
      console.error("Error updating agent:", err);
    }
  };

  if (loading) {
    return (
      <Card className="w-40 bg-gray-100">
        <CardHeader>
          <CardTitle className="text-sm">Loading...</CardTitle>
        </CardHeader>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </Card>
    );
  }

  if (error || !agent) {
    return (
      <Card className="w-40 bg-red-100">
        <CardHeader>
          <CardTitle className="text-sm">Error</CardTitle>
        </CardHeader>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </Card>
    );
  }

  const getStatusIcon = () => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Activity className="text-gray-500" size={16} />
          </TooltipTrigger>
          <TooltipContent>
            <p>Agent Status</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      <Card className="w-40">
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm truncate flex-1">
              {agent.name}
            </CardTitle>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Settings
                      className="text-gray-500 cursor-pointer hover:text-gray-700"
                      size={16}
                      onClick={handleSettingsClick}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open Agent Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </Card>
      {agent && (
        <AgentConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          agentId={agent.id}
          initialConfig={agent}
          onSave={handleConfigSave}
        />
      )}
    </>
  );
});

AgentNode.displayName = "AgentNode";
