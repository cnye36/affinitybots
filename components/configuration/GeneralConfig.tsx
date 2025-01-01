import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from '@/components/ui/label'
import { AgentConfig } from '@/types/agent'

interface GeneralConfigProps {
  config: AgentConfig
  onChange: (field: keyof AgentConfig, value: any) => void
}

export const GeneralConfig: React.FC<GeneralConfigProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={config.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter agent name"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={config.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Enter agent description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Model</Label>
          <Select 
            value={config.model_type}
            onValueChange={(value) => onChange('model_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini (Free)</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o (Pro)</SelectItem>
              {/* Add more models as needed */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tone</Label>
          <Select 
            value={config.config?.tone || 'default'}
            onValueChange={(value) => onChange('tone', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Language</Label>
          <Select 
            value={config.config?.language || 'en'}
            onValueChange={(value) => onChange('language', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              {/* Add more languages as needed */}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}