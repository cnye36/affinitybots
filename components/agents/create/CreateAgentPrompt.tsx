"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToolSelector } from "@/components/configuration/ToolSelector";

interface Tool {
  name: string;
  description: string;
  type: string;
  config: Record<string, string | number | boolean>;
}

interface CreateAgentPromptProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateAgentPrompt({
  onSubmit,
  isSubmitting,
}: CreateAgentPromptProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState(0.7);
  const [instructions, setInstructions] = useState("");
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("model", model);
    formData.append("temperature", temperature.toString());
    formData.append("instructions", instructions);
    formData.append(
      "tools",
      JSON.stringify(
        selectedTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          type: tool.type,
          config: tool.config,
        }))
      )
    );

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Give your agent a name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what your agent does"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4 Optimized</SelectItem>
            <SelectItem value="gpt-4o-mini">GPT-4 Mini</SelectItem>
            <SelectItem value="gpt-o1">GPT-O1</SelectItem>
            <SelectItem value="gpt-o1-mini">GPT-O1 Mini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Temperature: {temperature}</Label>
        <Slider
          value={[temperature]}
          onValueChange={(values: number[]) => setTemperature(values[0])}
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Give your agent specific instructions"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Tools</Label>
        <ToolSelector
          selectedTools={selectedTools}
          onToolsChange={setSelectedTools}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Agent"}
      </Button>
    </form>
  );
}
