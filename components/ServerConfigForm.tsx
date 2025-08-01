"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, TestTube, Save, Trash2 } from "lucide-react";

interface ConfigField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: any;
  enum?: string[];
}

interface ServerConfigFormProps {
  qualifiedName: string;
  configSchema?: any;
  onSave?: (config: any) => void;
  onDelete?: () => void;
  className?: string;
  serverDetails?: any; // Add server details to check if it's Smithery
}

export function ServerConfigForm({ 
  qualifiedName, 
  configSchema, 
  onSave, 
  onDelete,
  className = "",
  serverDetails
}: ServerConfigFormProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string; details?: any } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);

  // Check if this is a Smithery server
  const isSmitheryServer = serverDetails?.deploymentUrl?.includes('server.smithery.ai') || 
                          serverDetails?.connections?.some((conn: any) => 
                            conn.deploymentUrl?.includes('server.smithery.ai')
                          );

  // Parse the config schema to extract fields
  const configFields: ConfigField[] = [];
  if (configSchema?.properties) {
    Object.entries(configSchema.properties).forEach(([key, schema]: [string, any]) => {
      configFields.push({
        name: key,
        type: schema.type || 'string',
        required: configSchema.required?.includes(key) || false,
        description: schema.description,
        default: schema.default,
        enum: schema.enum
      });
    });
  }

  // Load existing configuration on mount
  useEffect(() => {
    async function loadExistingConfig() {
      try {
        const response = await fetch(`/api/user-mcp-servers/${encodeURIComponent(qualifiedName)}`);
        if (response.ok) {
          const data = await response.json();
          setConfig(data.config || {});
          setIsEnabled(data.server.is_enabled);
          setHasExistingConfig(true);
        }
      } catch (error) {
        // No existing config, start fresh
        setHasExistingConfig(false);
      }
    }
    loadExistingConfig();
  }, [qualifiedName]);

  // Set default values for fields
  useEffect(() => {
    const defaultConfig: Record<string, any> = {};
    configFields.forEach(field => {
      if (field.default !== undefined && config[field.name] === undefined) {
        defaultConfig[field.name] = field.default;
      }
    });
    if (Object.keys(defaultConfig).length > 0) {
      setConfig(prev => ({ ...defaultConfig, ...prev }));
    }
  }, [configFields.length]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // Clear test result when config changes
    setTestResult(null);
    setSaveResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`/api/user-mcp-servers/${encodeURIComponent(qualifiedName)}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const result = await response.json();
      console.log('Frontend received response:', { status: response.status, result });
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
        details: error
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    
    try {
      const response = await fetch(`/api/user-mcp-servers/${encodeURIComponent(qualifiedName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config, isEnabled }),
      });

      if (response.ok) {
        setSaveResult({ success: true, message: 'Configuration saved successfully' });
        setHasExistingConfig(true);
        onSave?.(config);
      } else {
        const error = await response.json();
        setSaveResult({ success: false, message: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setSaveResult({ success: false, message: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!hasExistingConfig) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/user-mcp-servers/${encodeURIComponent(qualifiedName)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConfig({});
        setIsEnabled(true);
        setHasExistingConfig(false);
        setTestResult(null);
        setSaveResult({ success: true, message: 'Configuration deleted successfully' });
        onDelete?.();
      } else {
        const error = await response.json();
        setSaveResult({ success: false, message: error.error || 'Failed to delete configuration' });
      }
    } catch (error) {
      setSaveResult({ success: false, message: 'Failed to delete configuration' });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: ConfigField) => {
    const value = config[field.name] ?? '';

    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.name}
              checked={value}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={field.name}>{field.name}</Label>
          </div>
        );

      case 'number':
      case 'integer':
        return (
          <Input
            id={field.name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, Number(e.target.value))}
            placeholder={field.description}
          />
        );

      case 'string':
        if (field.enum) {
          return (
            <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.name}`} />
              </SelectTrigger>
              <SelectContent>
                {field.enum.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        // Check if it's likely a large text field
        if (field.description?.toLowerCase().includes('json') || 
            field.description?.toLowerCase().includes('large') ||
            field.name.toLowerCase().includes('key') ||
            field.name.toLowerCase().includes('token')) {
          return (
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.description}
              className="min-h-[100px]"
            />
          );
        }

        return (
          <Input
            id={field.name}
            type={field.name.toLowerCase().includes('password') ? 'password' : 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.description}
          />
        );

      default:
        return (
          <Input
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.description}
          />
        );
    }
  };

  const hasRequiredFields = configFields.some(field => field.required);
  const requiredFieldsFilled = configFields
    .filter(field => field.required)
    .every(field => config[field.name] !== undefined && config[field.name] !== '');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Server Configuration</span>
          <div className="flex items-center gap-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label>Enabled</Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isSmitheryServer ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                This server is hosted on Smithery. You need to set up a profile on Smithery to store your API keys securely.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="smitheryProfileId" className="flex items-center gap-2">
                Smithery Profile ID
                <Badge variant="destructive" className="text-xs">Required</Badge>
              </Label>
              <Input
                id="smitheryProfileId"
                value={config.smitheryProfileId || ''}
                onChange={(e) => handleFieldChange('smitheryProfileId', e.target.value)}
                placeholder="e.g., eligible-bug-FblvFg"
              />
              <p className="text-sm text-muted-foreground">
                Your Smithery profile ID. If you don't have one, 
                <a 
                  href="https://smithery.ai/profiles" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline ml-1"
                >
                  create a profile on Smithery
                </a> first.
              </p>
            </div>
          </div>
        ) : (
          <>
            {configFields.length === 0 ? (
              <Alert>
                <AlertDescription>
                  This server doesn't require any configuration. You can test the connection directly.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {configFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2">
                      {field.name}
                      {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    </Label>
                    {renderField(field)}
                    {field.description && (
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Test Connection */}
        <div className="space-y-2">
          <Button
            onClick={handleTestConnection}
            disabled={testing || (isSmitheryServer ? !config.smitheryProfileId : (hasRequiredFields && !requiredFieldsFilled))}
            className="w-full"
            variant="outline"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <AlertDescription>
                  {testResult.success ? testResult.message : (testResult.error || testResult.message || 'Test failed')}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        {/* Save/Delete Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || (isSmitheryServer ? !config.smitheryProfileId : (hasRequiredFields && !requiredFieldsFilled))}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>

          {hasExistingConfig && (
            <Button
              onClick={handleDelete}
              disabled={loading}
              variant="destructive"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {saveResult && (
          <Alert variant={saveResult.success ? "default" : "destructive"}>
            <AlertDescription>{saveResult.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 