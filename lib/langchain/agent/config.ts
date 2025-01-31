import { z } from "zod";
import { type LangGraphRunnableConfig } from "@langchain/langgraph";
import { ToolsConfig } from "../tools";

// Memory options schema
export const AgentMemoryOptionsSchema = z.object({
  enabled: z.boolean(),
  max_entries: z.number(),
  relevance_threshold: z.number(),
});

// Metadata schema
export const AgentMetadataSchema = z.object({
  description: z.string(),
  owner_id: z.string(),
  agent_type: z.string(),
});

// Configurable options schema
export const AgentConfigurableOptionsSchema = z.object({
  model: z.enum(["gpt-4o", "gpt-4o-mini", "gpt-o1", "gpt-o1-mini"]),
  temperature: z.number(),
  tools: z.custom<ToolsConfig>(),
  memory: AgentMemoryOptionsSchema,
  prompt_template: z.string(),
});

// Complete config schema
export const AgentConfigSchema = z.object({
  name: z.string(),
  configurable: AgentConfigurableOptionsSchema,
  config: z.custom<LangGraphRunnableConfig>().optional(),
});

// Export types derived from schemas
export type AgentMemoryOptions = z.infer<typeof AgentMemoryOptionsSchema>;
export type AgentConfigurableOptions = z.infer<
  typeof AgentConfigurableOptionsSchema
>;
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
