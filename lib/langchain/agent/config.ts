import { z } from "zod";
import { type LangGraphRunnableConfig } from "@langchain/langgraph";

// Define the configurable options for our agent
export const AgentConfigSchema = z.object({
  model: z
    .enum(["gpt-4o", "gpt-4o-mini", "gpt-o1", "gpt-o1-mini"])
    .default("gpt-4o"),
  temperature: z.number().min(0).max(1).default(0.7),
  prompt_template: z.string(),
  tools: z.array(z.string()).default([]),
  memory: z
    .object({
      enabled: z.boolean().default(true),
      max_entries: z.number().default(10),
      relevance_threshold: z.number().min(0).max(1).default(0.7),
    })
    .default({
      enabled: true,
      max_entries: 10,
      relevance_threshold: 0.7,
    }),
});

export type AgentConfigurableOptions = z.infer<typeof AgentConfigSchema>;

// Define the metadata structure
export const AgentMetadataSchema = z.object({
  description: z.string().optional(),
  owner_id: z.string(),
  agent_type: z.string(),
  userId: z.string().optional(),
  threadId: z.string().optional(),
});

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

// Define the complete configuration type
export interface AgentConfig {
  configurable: AgentConfigurableOptions;
  metadata?: AgentMetadata;
  config?: LangGraphRunnableConfig;
}
