import { z } from "zod";
import { type LangGraphRunnableConfig } from "@langchain/langgraph";
import { ToolsConfig } from "@/types/tools";

// Memory options schema
export const AgentMemoryOptionsSchema = z.object({
  enabled: z.boolean(),
  max_entries: z.number(),
  relevance_threshold: z.number(),
});

// Knowledge base options schema
export const KnowledgeBaseOptionsSchema = z.object({
  isEnabled: z.boolean(),
  config: z.object({
    sources: z.array(z.string()),
  }),
});

// Metadata schema
export const AgentMetadataSchema = z.object({
  description: z.string(),
  agent_type: z.string(),
  owner_id: z.string(),
});

// Configurable options schema
export const AgentConfigurableOptionsSchema = z.object({
  model: z.enum(["gpt-4o", "gpt-4o-mini", "gpt-o1", "gpt-o1-mini"]),
  temperature: z.number(),
  tools: z.custom<ToolsConfig>(),
  memory: AgentMemoryOptionsSchema,
  knowledge_base: KnowledgeBaseOptionsSchema.optional(),
  prompt_template: z.string(),
  avatar: z.string(),
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
