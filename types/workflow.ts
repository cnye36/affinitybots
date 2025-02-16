import { Node } from "reactflow";
import { IntegrationType } from "./tools";

export interface TaskNodeData {
  name: string;
  type: TaskType;
  description?: string;
  task_id: string;
  assistant_id: string;
  workflowId: string;
  status?: "idle" | "running" | "completed" | "error";
  onConfigureTask?: (task_id: string) => void;
}

export interface AgentNodeData {
  assistant_id: string;
  label: string;
  workflowId: string;
  status?: "idle" | "running" | "completed" | "error";
  hasTask?: boolean;
  onAddTask?: (agentId: string) => void;
  onAddAgent?: (sourceAgentId: string) => void;
  onConfigureTask?: (taskId: string) => void;
}

export type WorkflowNode =
  | (Node<AgentNodeData> & { type: "agent" })
  | (Node<TaskNodeData> & { type: "task" });

export interface NodeHandlers {
  onAddTask: (agentId: string) => void;
  onAddAgent: (sourceAgentId: string) => void;
  onConfigureTask: (taskId: string) => void;
}

export type WorkflowStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "failed";
export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface WorkflowTask {
  task_id: string;
  workflow_id: string;
  assistant_id: string;
  name: string;
  description?: string;
  task_type: string;
  config: Record<string, unknown>;
  position: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
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
  last_run_at?: string;
  is_active: boolean;
}

export interface WorkflowRun {
  run_id: string;
  workflow_id: string;
  thread_id?: string;
  status: TaskStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  result?: unknown;
  metadata: Record<string, unknown>;
}

export interface WorkflowTaskRun {
  task_run_id: string;
  workflow_run_id: string;
  task_id: string;
  run_id?: string;
  status: TaskStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  result?: unknown;
  metadata: Record<string, unknown>;
}

export type TaskType =
  // AI task (single type as the agent defines the behavior)
  | "ai_task"
  // Integration tasks
  | "notion_create_page"
  | "notion_update_page"
  | "notion_add_to_database"
  | "notion_search"
  | "twitter_post_tweet"
  | "twitter_thread"
  | "twitter_dm"
  | "twitter_like"
  | "twitter_retweet"
  | "google_calendar_create"
  | "google_calendar_update"
  | "google_docs_create"
  | "google_sheets_update"
  | "google_drive_upload";

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

export interface Task {
  task_id?: string;
  name: string;
  description: string;
  type: TaskType;
  assistant_id: string;
  workflow_id: string;
  integration?: IntegrationConfig;
  config: {
    input: {
      source: string;
      parameters: Record<string, unknown>;
      prompt?: string;
    };
    output: {
      destination: string;
      format?: string;
    };
  };
}
