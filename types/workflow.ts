import { IntegrationType } from "./tools";

export type TaskType = "openai" | "custom" | "http" | "email" | "slack";
export type TriggerType = "manual" | "webhook" | "form" | "integration";

export interface TaskNodeData {
  workflow_task_id: string;
  name: string;
  description?: string;
  task_type: TaskType;
  workflow_id: string;
  assistant_id: string;
  config: {
    input: {
      source: string;
      parameters: Record<string, unknown>;
      prompt?: string;
    };
    output: {
      destination: string;
    };
  };
  status?: "idle" | "running" | "completed" | "error";
  onAssignAgent?: (taskId: string) => void;
  onConfigureTask?: (taskId: string) => void;
  isConfigOpen?: boolean;
  onConfigClose?: () => void;
}

export interface TriggerNodeData {
  name: string;
  description?: string;
  trigger_type: TriggerType;
  trigger_id: string;
  workflow_id: string;
  config: Record<string, unknown>;
  status?: "idle" | "running" | "completed" | "error";
  onConfigureTrigger?: (triggerId: string) => void;
  onOpenTaskSidebar?: () => void;
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
  onAssignAgent?: (taskId: string) => void;
  onConfigureTask?: (taskId: string) => void;
  onConfigureTrigger?: (triggerId: string) => void;
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
}

export interface Task {
  workflow_task_id: string;
  workflow_id: string;
  name: string;
  description?: string;
  type: TaskType;
  task_type?: TaskType;
  assistant_id: string;
  integration?: IntegrationConfig;
  config: TaskConfig;
  position?: number;
  status?: TaskStatus;
  created_at?: string;
  updated_at?: string;
  last_run_at?: string;
  metadata?: Record<string, unknown>;
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
  last_run_at?: string;
  is_active: boolean;
}

export interface TaskRun {
  run_id: string;
  workflow_task_id: string;
  task_id?: string;
  status: TaskStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  result?: unknown;
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
