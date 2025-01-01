import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AgentConfig } from '@/types/agent'

interface PromptsConfigProps {
  config: AgentConfig
  onChange: (field: keyof AgentConfig, value: any) => void
}

export const PromptsConfig: React.FC<PromptsConfigProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Instructions</Label>
        <Textarea
          value={config.prompt_template}
          onChange={(e) => onChange('prompt_template', e.target.value)}
          placeholder="Enter agent instructions"
          className="min-h-[200px]"
        />
        <p className="text-sm text-muted-foreground mt-1">
          These instructions define your agent's behavior and capabilities
        </p>
      </div>
    </div>
  )
}