import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AgentConfig } from '@/types/agent'

interface SettingsConfigProps {
  config: AgentConfig
  onChange: (field: keyof AgentConfig['config'], value: any) => void
}

export const SettingsConfig: React.FC<SettingsConfigProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Temperature</Label>
          <p className="text-sm text-muted-foreground">
            Adjust the creativity level of responses
          </p>
        </div>
        <Input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={config.config.temperature || 0.7}
          onChange={(e) => onChange('temperature', parseFloat(e.target.value))}
          className="w-20"
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These actions are destructive and cannot be undone.
        </p>
        <Button variant="destructive">Delete Agent</Button>
      </div>
    </div>
  )
}