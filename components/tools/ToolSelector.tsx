"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AVAILABLE_TOOLS, ToolConfig } from '@/lib/tools/config'
import { Badge } from '@/components/ui/badge'

interface ToolSelectorProps {
  selectedTools: string[]
  onToolToggle: (toolId: string, enabled: boolean, config?: any) => void
}

export function ToolSelector({ selectedTools, onToolToggle }: ToolSelectorProps) {
  const [toolConfigs, setToolConfigs] = useState<Record<string, any>>({})

  const handleToolToggle = (tool: ToolConfig, enabled: boolean) => {
    if (enabled && tool.configOptions) {
      // If tool has config options, ensure defaults are set
      const config = tool.configOptions.reduce((acc, option) => ({
        ...acc,
        [option.name]: option.default || ''
      }), {})
      setToolConfigs(prev => ({ ...prev, [tool.id]: config }))
    }
    onToolToggle(tool.id, enabled, toolConfigs[tool.id])
  }

  const handleConfigChange = (toolId: string, optionName: string, value: any) => {
    setToolConfigs(prev => ({
      ...prev,
      [toolId]: { ...(prev[toolId] || {}), [optionName]: value }
    }))
    if (selectedTools.includes(toolId)) {
      onToolToggle(toolId, true, { ...(toolConfigs[toolId] || {}), [optionName]: value })
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupByCategory(AVAILABLE_TOOLS)).map(([category, tools]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold capitalize">{category}</h3>
          <div className="space-y-4">
            {tools.map((tool) => (
              <div key={tool.id} className="flex items-start justify-between p-4 rounded-lg border">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    <tool.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={tool.id}>{tool.name}</Label>
                      {tool.requiresAuth && (
                        <Badge variant="outline" className="text-xs">
                          Requires Auth
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                    {selectedTools.includes(tool.id) && tool.configOptions && (
                      <div className="mt-2 space-y-2">
                        {tool.configOptions.map((option) => (
                          <div key={option.name} className="flex items-center space-x-2">
                            <Input
                              id={`${tool.id}-${option.name}`}
                              placeholder={option.name}
                              value={toolConfigs[tool.id]?.[option.name] || ''}
                              onChange={(e) => handleConfigChange(tool.id, option.name, e.target.value)}
                              className="h-8"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  id={tool.id}
                  checked={selectedTools.includes(tool.id)}
                  onCheckedChange={(checked) => handleToolToggle(tool, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupByCategory(tools: ToolConfig[]) {
  return tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, ToolConfig[]>)
} 