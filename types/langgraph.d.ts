declare module "@langchain/langgraph-sdk" {
  export interface Message {
    role: "user" | "assistant";
    content: string;
  }

  export interface Thread {
    id: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }

  export interface RunCheckpoint {
    thread_id: string;
    checkpoint_ns?: string;
    checkpoint_id?: string;
    checkpoint_map?: Record<string, unknown>;
  }

  export interface RunCommand {
    update?: boolean | null;
    resume?: boolean | null;
    goto?: {
      node: string;
      result: Record<string, unknown>;
    } | null;
  }

  export interface RunInput {
    [key: string]: unknown;
  }

  export type RunStatus =
    | "pending"
    | "error"
    | "success"
    | "timeout"
    | "interrupted";

  export interface Run {
    id: string;
    thread_id: string;
    assistant_id: string;
    status: RunStatus;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, unknown>;
    kwargs?: Record<string, unknown>;
    multitask_strategy?: "reject" | "accept";
  }

  export interface ThreadsClient {
    create(options?: { metadata?: Record<string, unknown> }): Promise<Thread>;
    get(threadId: string): Promise<Thread>;
    delete(threadId: string): Promise<void>;
    addMessage(threadId: string, message: Message): Promise<void>;
    createRun(
      threadId: string,
      options: {
        assistant_id: string;
        checkpoint?: RunCheckpoint;
        input?: RunInput;
        command?: RunCommand;
      }
    ): Promise<Run>;
    createRunStream(
      threadId: string,
      options: {
        assistant_id: string;
        checkpoint?: RunCheckpoint;
        input?: RunInput;
        command?: RunCommand;
      }
    ): Promise<ReadableStream>;
    getRun(threadId: string, runId: string): Promise<Run>;
    listRuns(
      threadId: string,
      options?: {
        limit?: number;
        offset?: number;
        status?: RunStatus;
      }
    ): Promise<Run[]>;
    cancelRun(threadId: string, runId: string): Promise<void>;
    waitForRun(threadId: string, runId: string): Promise<Run>;
    listMessages(threadId: string): Promise<Message[]>;
    search(options: { metadata: Record<string, unknown> }): Promise<Thread[]>;
  }

  export interface AssistantsClient {
    create(options: {
      graphId: string;
      name: string;
      metadata: Assistant["metadata"];
      config: Assistant["config"];
    }): Promise<Assistant>;
    get(assistantId: string): Promise<Assistant>;
    delete(assistantId: string): Promise<void>;
    update(
      assistantId: string,
      options: Partial<{
        name: string;
        metadata: Assistant["metadata"];
        config: Assistant["config"];
      }>
    ): Promise<Assistant>;
    search(options: {
      metadata: Record<string, unknown>;
    }): Promise<Assistant[]>;
  }

  export interface ToolConfiguration {
    enabled?: boolean;
    config?: Record<string, unknown>;
  }

  export interface Assistant {
    assistant_id: string;
    name: string;
    graph_id: string;
    metadata: {
      owner_id: string;
      description: string;
      agent_type: string;
    };
    config: {
      configurable: {
        model?: "gpt-4o-mini" | "gpt-4o" | "gpt-o1" | "gpt-o1-mini";
        temperature?: number;
        instructions?: string;
        prompt_template?: string;
        tools?: Partial<
          Record<
            "web_search" | "wikipedia" | "wolfram_alpha",
            ToolConfiguration
          >
        >;
        memory?: {
          enabled: boolean;
          max_entries: number;
          relevance_threshold: number;
        };
      };
    };
    created_at: string;
    updated_at: string;
  }

  export class Client {
    constructor(options: { apiUrl: string; apiKey: string });
    threads: ThreadsClient;
    assistants: AssistantsClient;
  }
} 
