export type TaskType =
  | "ai_task"
  | "integration"
  | "notion_create_page"
  | "notion_update_page"
  | "notion_add_to_database"
  | "notion_search"
  | "twitter_post_tweet"
  | "twitter_create_thread"
  | "twitter_dm"
  | "twitter_like_tweet"
  | "twitter_retweet"
  | "google_calendar_create_event"
  | "google_calendar_update_event"
  | "google_docs_create"
  | "google_sheets_update"
  | "google_drive_upload";
export type TriggerType = "manual" | "webhook" | "form" | "integration";

export interface TaskNodeData {
  workflow_task_id: string;
  name: string;
  description?: string;
  task_type: TaskType;
  workflow_id: string;
  assignedAgent?: {
    id: string;
    name: string;
    avatar?: string;
  };
  config: {
    input: {
      source: string;
      parameters: Record<string, unknown>;
      prompt: string;
    };
    output: {
      destination: string;
    };
  };
  owner_id: string;
  position?: number;
  status: TaskStatus;
  onAssignAgent: (taskId: string) => void;
  onConfigureTask: (taskId: string) => void;
  isConfigOpen: boolean;
  onConfigClose?: () => void;
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
  onAssignAgent: (taskId: string) => void;
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
}

export interface Task {
  owner_id: string;
  workflow_task_id: string;
  workflow_id: string;
  name: string;
  description?: string;
  task_type?: TaskType;
  position?: number;
  assignedAgent?: {
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
