export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    agentId?: string;
    workflowId?: string;
    [key: string]: string | undefined;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at?: string;
  updated_at?: string;
  status?: "Active" | "Inactive" | "Running";
  runs?: number;
}

export type TaskType =
  | "process_input"
  | "generate_content"
  | "analyze_data"
  | "make_decision"
  | "transform_data"
  | "api_call"
  | "custom";

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

export interface Task {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  config: TaskConfig;
  agent_id: string;
  workflow_id: string;
  order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type WorkflowRunStatus = "pending" | "running" | "completed" | "failed";

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: WorkflowRunStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  workflow?: Workflow;
  task_runs?: TaskRun[];
}

export type TaskRunStatus = "pending" | "running" | "completed" | "failed";

export interface TaskRun {
  id: string;
  workflow_run_id: string;
  task_id: string;
  status: TaskRunStatus;
  started_at: string;
  completed_at?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  task?: Task;
}