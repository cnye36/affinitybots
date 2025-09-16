export type TaskType =
  | "ai_task"

export type TriggerType = "manual" | "webhook" | "form" | "integration" | "schedule";

export interface TaskNodeData {
  workflow_task_id: string;
  name: string;
  description?: string;
  task_type: TaskType;
  workflow_id: string;
  assignedAssistant?: {
    id: string;
    name: string;
    avatar?: string;
  };
  config: TaskConfig;
  owner_id: string;
  position?: number;
  status: TaskStatus;
  onAssignAssistant: (taskId: string) => void;
  onConfigureTask: (taskId: string) => void;
  isConfigOpen: boolean;
  onConfigClose?: () => void;
  // The last known output from the immediately preceding node, if any
  previousNodeOutput?: TaskOutput;
  // Thread id used by the previous node's test execution (for reusing during tests)
  previousNodeThreadId?: string;
}

export interface TriggerNodeData {
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_id: string;
  workflow_id: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  status: "idle" | "running" | "completed" | "error";
  onConfigureTrigger?: (triggerId: string) => void;
  onOpenTaskSidebar?: () => void;
  onAddTask?: () => void;
  hasConnectedTask?: boolean;
}

export type WorkflowNode = {
  id: string;
  position: { x: number; y: number };
} & (
  | { type: "task"; data: TaskNodeData }
  | { type: "trigger"; data: TriggerNodeData }
);

export interface NodeHandlers {
  onAssignAssistant: (taskId: string) => void;
  onConfigureTask: (taskId: string) => void;
  onConfigureTrigger: (triggerId: string) => void;
}

export type WorkflowStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "failed";
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "error";

export interface TaskConfig {
  input: {
    source: string;
    parameters: Record<string, unknown>;
    prompt: string;
  };
  output: {
    destination: string;
    format?: string;
  };
  // Optional output configuration for model-structured responses
  outputOptions?: {
    structuredJson?: boolean;
  };
  // Controls how a node uses or isolates conversational context
  context?: {
    // Thread selection strategy for this node
    thread?:
      | { mode: "workflow" }
      | { mode: "new" }
      | { mode: "from_node"; nodeId: string };
    // What to send as input to the assistant
    // - prompt: use this node's prompt only
    // - previous_output: use previous node's output only
    // - prompt_and_previous_output: send both
    inputSource?: "prompt" | "previous_output" | "prompt_and_previous_output";
  };
  // When persisted, some tasks store assistant metadata in config
  assigned_assistant?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface TaskOutput {
  result: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Task {
  owner_id: string;
  workflow_task_id: string;
  workflow_id: string;
  name: string;
  description?: string;
  task_type?: TaskType;
  position?: number;
  assistant_id?: string;
  assignedAssistant?: {
    id: string;
    name: string;
    avatar?: string;
  };
  integration?: IntegrationConfig;
  config: TaskConfig;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  last_run_at: string;
  metadata: Record<string, unknown>;
}

export interface Workflow {
  workflow_id: string;
  name: string;
  description?: string;
  owner_id: string;
  nodes: Array<{
    data: {
      assistant_id: string;
      label: string;
    };
  }>;
  edges: unknown[];
  config: Record<string, unknown>;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
  last_run_at: string;
  is_active: boolean;
}

export interface TaskRun {
  run_id: string;
  workflow_task_id: string;
  task_id: string;
  status: TaskStatus;
  started_at: string;
  completed_at: string;
  error: string;
  result: unknown;
  metadata: Record<string, unknown>;
}

export interface IntegrationConfig {
  type: IntegrationType;
  credentials: {
    api_key?: string;
    oauth_token?: string;
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
  };
  settings: Record<string, unknown>;
}

export type IntegrationType =
  | "notion"
  | "twitter"
  | "google_calendar"
  | "google_docs"
  | "google_sheets"
  | "google_drive";
