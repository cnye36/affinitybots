declare module "@langchain/langgraph-sdk" {
  export interface AssistantConfig {
    model?: string;
    temperature?: number;
    instructions?: string;
    tools?: string[];
    memory?: {
      enabled: boolean;
      max_entries?: number;
      relevance_threshold?: number;
    };
  }

  export interface AssistantMetadata {
    description?: string;
    owner_id?: string;
    agent_type?: string;
    [key: string]: string | number | boolean | undefined;
  }

  export interface Assistant {
    assistant_id: string;
    name: string;
    configurable?: AssistantConfig;
    metadata?: AssistantMetadata;
  }

  export interface AssistantCreateOptions {
    graphId: string;
    name: string;
    configurable?: AssistantConfig;
    metadata?: AssistantMetadata;
  }

  export class Client {
    constructor(config: { apiUrl: string; apiKey: string });

    assistants: {
      create(options: AssistantCreateOptions): Promise<Assistant>;
      get(assistantId: string): Promise<Assistant>;
      search(query: {
        metadata?: Record<string, string | number | boolean>;
      }): Promise<Assistant[]>;
      update(
        assistantId: string,
        options: Partial<AssistantCreateOptions>
      ): Promise<Assistant>;
    };
  }
}
