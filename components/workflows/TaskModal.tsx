import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Task, TaskType, IntegrationType } from "@/types";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  agentId: string;
  workflowId: string;
  initialTask?: Task;
}

const INTEGRATION_TYPES: { value: IntegrationType; label: string }[] = [
  { value: "notion", label: "Notion" },
  { value: "twitter", label: "Twitter" },
  { value: "google", label: "Google" },
];

const TASK_TYPES: Record<
  IntegrationType | "ai",
  { value: TaskType; label: string }[]
> = {
  notion: [
    { value: "notion_create_page", label: "Create Page" },
    { value: "notion_update_page", label: "Update Page" },
    { value: "notion_add_to_database", label: "Add to Database" },
    { value: "notion_search", label: "Search" },
  ],
  twitter: [
    { value: "twitter_post_tweet", label: "Post Tweet" },
    { value: "twitter_thread", label: "Create Thread" },
    { value: "twitter_dm", label: "Send DM" },
    { value: "twitter_like", label: "Like Tweet" },
    { value: "twitter_retweet", label: "Retweet" },
  ],
  google: [
    { value: "google_calendar_create", label: "Create Calendar Event" },
    { value: "google_calendar_update", label: "Update Calendar Event" },
    { value: "google_docs_create", label: "Create Doc" },
    { value: "google_sheets_update", label: "Update Sheet" },
    { value: "google_drive_upload", label: "Upload to Drive" },
  ],
  ai: [
    { value: "ai_write_content", label: "Write Content" },
    { value: "ai_analyze_content", label: "Analyze Content" },
    { value: "ai_summarize", label: "Summarize" },
    { value: "ai_translate", label: "Translate" },
  ],
};

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  agentId,
  workflowId,
  initialTask,
}: TaskModalProps) {
  const [name, setName] = useState(initialTask?.name || "");
  const [description, setDescription] = useState(
    initialTask?.description || ""
  );
  const [selectedTab, setSelectedTab] = useState<"integrations" | "ai">(
    "integrations"
  );
  const [integration, setIntegration] = useState<IntegrationType | null>(
    initialTask?.integration?.type || null
  );
  const [type, setType] = useState<TaskType>(
    initialTask?.type || "ai_write_content"
  );
  const [saving, setSaving] = useState(false);

  const handleIntegrationChange = (value: IntegrationType) => {
    setIntegration(value);
    // Set the first task type of the selected integration as default
    const firstTaskType = TASK_TYPES[value][0].value;
    setType(firstTaskType);
  };

  const handleTaskTypeChange = (value: TaskType) => {
    setType(value);
    // Update name with a default if it's empty
    if (!name) {
      setName(
        TASK_TYPES[
          selectedTab === "integrations" && integration ? integration : "ai"
        ].find((task) => task.value === value)?.label || ""
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSave({
        name,
        description,
        type,
        agentId,
        workflowId,
        integration: integration
          ? {
              type: integration,
              credentials: {},
              settings: {},
            }
          : undefined,
        config: {
          input: {
            source: "previous_agent",
            parameters: {},
          },
          output: {
            destination: "next_agent",
          },
        },
      });
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteTask = async () => {
    if (!initialTask?.task_id) {
      toast.error("Task ID is missing");
      return;
    }

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/tasks/${initialTask.task_id}/execute`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Task executed successfully");
        console.log("Execution Result:", data.executionResult);
        // Optionally, display the result in the UI
      } else {
        throw new Error(data.error || "Failed to execute task");
      }
    } catch (error) {
      console.error("Error executing task:", error);
      toast.error("Failed to execute task");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialTask ? "Edit Task" : "Add New Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs
            value={selectedTab}
            onValueChange={(value) =>
              setSelectedTab(value as "integrations" | "ai")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="ai">AI Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="integrations" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="integration">Integration</Label>
                <Select
                  value={integration || ""}
                  onValueChange={(value) =>
                    handleIntegrationChange(value as IntegrationType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEGRATION_TYPES.map((intType) => (
                      <SelectItem key={intType.value} value={intType.value}>
                        {intType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {integration && (
                <div className="space-y-2">
                  <Label htmlFor="type">Task Type</Label>
                  <Select
                    value={type}
                    onValueChange={(value) =>
                      handleTaskTypeChange(value as TaskType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES[integration].map((taskType) => (
                        <SelectItem key={taskType.value} value={taskType.value}>
                          {taskType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">AI Task Type</Label>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    handleTaskTypeChange(value as TaskType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.ai.map((taskType) => (
                      <SelectItem key={taskType.value} value={taskType.value}>
                        {taskType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Task"}
            </Button>
            {initialTask && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleExecuteTask}
              >
                Execute Task
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
