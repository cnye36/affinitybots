export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  config: TaskConfig;
  agentId: string;
  workflowId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskType =
  | "process_input" // Process input from previous agent or initial input
  | "generate_content" // Generate new content based on context
  | "analyze_data" // Analyze data or content
  | "make_decision" // Make a decision based on criteria
  | "transform_data" // Transform data from one format to another
  | "api_call" // Make an external API call
  | "custom"; // Custom task type with user-defined behavior

export interface TaskConfig {
  input?: {
    source: "previous_agent" | "user_input" | "static" | "api";
    value?: string;
    format?: string;
  };
  output?: {
    destination: "next_agent" | "final_output" | "api";
    format?: string;
  };
  parameters?: Record<string, unknown>;
  retry?: {
    maxAttempts: number;
    delay: number;
  };
  timeout?: number;
  validation?: {
    schema?: object;
    rules?: string[];
  };
}
