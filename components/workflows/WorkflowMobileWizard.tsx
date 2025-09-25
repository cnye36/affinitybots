"use client"

import { Edge } from "reactflow"
import { WorkflowNode } from "@/types/workflow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface WorkflowMobileWizardProps {
  nodes: WorkflowNode[]
  edges: Edge[]
  onAddTrigger: () => void
  onAddTask: (sourceNodeId: string) => void
  onAssignAgent: (taskId: string) => void
  onConfigureTask: (taskId: string) => void
  onConfigureTrigger: (triggerId: string) => void
}

const getInitials = (name?: string) => {
  if (!name) return "?"
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function WorkflowMobileWizard({
  nodes,
  edges,
  onAddTrigger,
  onAddTask,
  onAssignAgent,
  onConfigureTask,
  onConfigureTrigger,
}: WorkflowMobileWizardProps) {
  const triggerNodes = nodes.filter((node) => node.type === "trigger")
  const taskNodes = nodes.filter((node) => node.type === "task")
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  const buildSequence = (startId: string) => {
    const sequence: WorkflowNode[] = []
    let currentId: string | null = startId
    const visited = new Set<string>()

    while (currentId && !visited.has(currentId)) {
      const current = nodeMap.get(currentId)
      if (!current) break
      sequence.push(current)
      visited.add(currentId)

      const outgoing = edges.find((edge) => edge.source === currentId)
      if (!outgoing) break
      currentId = outgoing.target
    }

    return sequence
  }

  const sequences = triggerNodes.map((trigger) => buildSequence(trigger.id))
  const visitedTaskIds = new Set(
    sequences.flat().filter((node) => node.type === "task").map((node) => node.id)
  )
  const looseTasks = taskNodes.filter((task) => !visitedTaskIds.has(task.id))

  const renderTriggerCard = (triggerNode: WorkflowNode) => {
    const data = triggerNode.data as any
    return (
      <Card key={triggerNode.id} className="border border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="uppercase">Trigger</Badge>
              <CardTitle className="mt-2 text-lg">{data?.name || "Workflow trigger"}</CardTitle>
            </div>
            <Badge variant={data?.hasConnectedTask ? "default" : "outline"}>
              {data?.trigger_type || "Custom"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {data?.description || "Configure when this workflow should start."}
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="default" onClick={() => onConfigureTrigger(data?.trigger_id)}>
              Configure trigger
            </Button>
            <Button
              variant="outline"
              onClick={() => onAddTask(triggerNode.id)}
            >
              {data?.hasConnectedTask ? "Add another starting task" : "Add first task"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderTaskCard = (taskNode: WorkflowNode, index: number) => {
    const data = taskNode.data as any
    const assignedAssistant = data?.assignedAssistant

    return (
      <Card key={taskNode.id} className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="uppercase">Task {index}</Badge>
              <CardTitle className="text-lg">{data?.name || "Unnamed task"}</CardTitle>
            </div>
            <Badge variant="outline">{data?.task_type || "Step"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {data?.description || "Define how this step should run."}
          </p>
          <div className="rounded-md border p-3 flex items-center gap-3">
            {assignedAssistant ? (
              <>
                <Avatar className="h-9 w-9">
                  {assignedAssistant.avatar ? (
                    <AvatarImage src={assignedAssistant.avatar} alt={assignedAssistant.name} />
                  ) : (
                    <AvatarFallback>{getInitials(assignedAssistant.name)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{assignedAssistant.name}</p>
                  <p className="text-xs text-muted-foreground">Assigned agent</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onAssignAgent(data?.workflow_task_id)}>
                  Change
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <p className="text-sm text-muted-foreground">
                  Assign an agent to run this task.
                </p>
                <Button size="sm" onClick={() => onAssignAgent(data?.workflow_task_id)}>
                  Choose agent
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => onConfigureTask(data?.workflow_task_id)}>
              Configure task
            </Button>
            <Button variant="ghost" onClick={() => onAddTask(taskNode.id)}>
              Add next task
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (triggerNodes.length === 0) {
    return (
      <div className="flex h-full flex-col justify-center gap-6 p-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Create your first workflow</h2>
          <p className="text-sm text-muted-foreground">
            Start by choosing when the automation should run. We will guide you through adding each step.
          </p>
        </div>
        <Button size="lg" onClick={onAddTrigger}>
          Configure trigger
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Step 1</p>
          <h2 className="text-xl font-semibold">Configure your trigger</h2>
          <p className="text-sm text-muted-foreground">
            Decide how this workflow should begin. You can always come back to tweak the trigger.
          </p>
        </div>
        {triggerNodes.map((trigger) => renderTriggerCard(trigger))}

        <Separator className="my-6" />

        <div className="space-y-2">
          <p className="text-xs uppercase text-muted-foreground">Step 2</p>
          <h2 className="text-xl font-semibold">Build your task sequence</h2>
          <p className="text-sm text-muted-foreground">
            Add steps one at a time. We will keep them in the order you create them.
          </p>
        </div>

        {sequences.map((sequence, idx) => (
          <div key={`sequence-${sequence[0]?.id || idx}`} className="space-y-4">
            {sequence
              .filter((node) => node.type === "task")
              .map((node, taskIndex) => renderTaskCard(node, taskIndex + 1))}
            {sequence.every((node) => node.type !== "task") && (
              <Button variant="outline" onClick={() => onAddTask(sequence[0]?.id || "")}
                className={cn("w-full", !sequence[0] && "hidden")}
              >
                Add first task
              </Button>
            )}
          </div>
        ))}

        {looseTasks.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Unlinked tasks</p>
            {looseTasks.map((task, taskIndex) => renderTaskCard(task, taskIndex + 1))}
          </div>
        )}

        {taskNodes.length === 0 && (
          <Button variant="outline" onClick={() => onAddTask(triggerNodes[0]?.id || "")}>
            Add first task
          </Button>
        )}
      </div>
    </div>
  )
}
