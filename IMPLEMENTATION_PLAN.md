# Implementation Plan: Output/End Node for Workflows

## Overview
Add a new "Output" node type to workflows that serves as a visual terminal node displaying the final workflow result. This node will be optional, limited to one per workflow, and show execution results when clicked.

## Requirements Summary
- **Scope**: Both Sequential and Orchestrator workflows
- **Quantity**: Only ONE Output node allowed per workflow
- **Design-time behavior**: Show placeholder/instructions when clicked
- **Runtime behavior**: Display final workflow result from `workflow_runs.result`
- **Optional**: Not required, users can add if desired

---

## Implementation Plan

### Phase 1: Type System & Database Schema

#### 1.1 Add Output Node Type Definition
**File**: `/types/workflow.ts`

**Changes**:
```typescript
// Add to WorkflowNode union
export type WorkflowNode = {
  id: string;
  position: { x: number; y: number };
} & (
  | { type: "task"; data: TaskNodeData }
  | { type: "trigger"; data: TriggerNodeData }
  | { type: "orchestrator"; data: OrchestratorNodeData }
  | { type: "output"; data: OutputNodeData }  // NEW
);

// Add new data interface
export interface OutputNodeData {
  label: string;  // Display name, default: "Output"
  description?: string;  // Optional description
  status?: NodeStatus;  // Runtime status (idle, running, completed, error)
  // No assistant_id, no config - purely display node
}
```

**Reasoning**: Follow existing pattern of node types. OutputNodeData is minimal since it's a display-only node.

#### 1.2 Database Schema
**Decision**: NO database changes needed

**Reasoning**:
- Output node is purely a UI/display node
- Does NOT need entries in `workflow_task_runs` (not an executable task)
- Stores in workflow JSON (`workflows.nodes`) like other nodes
- Reads from existing `workflow_runs.result` for display
- No new tables or columns required

---

### Phase 2: Output Node Component

#### 2.1 Create OutputNode Component
**File**: `/components/workflows/outputs/OutputNode.tsx` (new file)

**Visual Design**:
- **Color Theme**: Cyan/Teal gradient (distinguishes from blue trigger, violet task, emerald orchestrator)
- **Icon**: CheckCircle or Flag icon
- **Size**: `min-w-[200px] max-w-[240px]` (consistent with other nodes)
- **Style**: Glass morphism with gradient border
- **Badge**: "Final Output" or "End" badge at top
- **Status Indicator**: Dot in top-right (blue=running, green=completed, red=error, gray=idle)

**Component Structure**:
```tsx
import React, { memo } from "react"
import { Handle, Position, NodeProps } from "reactflow"
import { CheckCircle } from "lucide-react"
import { OutputNodeData } from "@/types/workflow"

const OutputNode = memo(({ data, selected }: NodeProps<OutputNodeData>) => {
  const handleClick = () => {
    data.onConfigureOutput?.(data.id)  // Open detail panel/modal
  }

  return (
    <div
      className="output-node group relative min-w-[200px] max-w-[240px]"
      onDoubleClick={handleClick}
    >
      {/* Target handle - can connect FROM tasks */}
      <Handle
        type="target"
        position={Position.Left}  // Sequential: from left
        className="handle-target"
      />

      {/* Main card */}
      <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 backdrop-blur-sm border-2 border-cyan-500/50 rounded-lg p-3">

        {/* Status indicator */}
        {data.status && (
          <div className="absolute top-2 right-2">
            <StatusDot status={data.status} />
          </div>
        )}

        {/* Icon and label */}
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-cyan-600" />
          <span className="font-semibold text-sm">{data.label}</span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-500/20 text-[10px] text-cyan-700">
          Final Output
        </div>

        {/* View button (appears on hover) */}
        <button
          onClick={handleClick}
          className="mt-2 w-full opacity-0 group-hover:opacity-100 transition-opacity text-xs text-cyan-600 hover:text-cyan-700"
        >
          View Output →
        </button>
      </div>
    </div>
  )
})

OutputNode.displayName = "OutputNode"
export default OutputNode
```

**Reasoning**: Follows existing node component patterns (TaskNode, TriggerNode, OrchestratorNode) with memoization, hover effects, and status indicators.

#### 2.2 Register Output Node in ReactFlow
**File**: `/components/workflows/v2/WorkflowCanvas.tsx`

**Changes**:
```typescript
import OutputNode from "@/components/workflows/outputs/OutputNode"

const nodeTypes = useMemo(
  () => ({
    task: TaskNode,
    trigger: TriggerNode,
    orchestrator: OrchestratorNode,
    output: OutputNode,  // NEW
  }),
  []
)
```

---

### Phase 3: Validation & Enforcement

#### 3.1 Enforce Single Output Node Rule
**File**: `/components/workflows/v2/hooks/useWorkflowState.ts`

**Add Helper Functions**:
```typescript
export const useWorkflowState = create<WorkflowState>((set, get) => ({
  // ... existing state ...

  // NEW: Check if output node exists
  hasOutputNode: () => {
    const nodes = get().nodes
    return nodes.some(node => node.type === "output")
  },

  // NEW: Get output node
  getOutputNode: () => {
    const nodes = get().nodes
    return nodes.find(node => node.type === "output")
  },

  // Existing addNode - ADD VALIDATION
  addNode: (node) => {
    const state = get()

    // Prevent adding second output node
    if (node.type === "output" && state.hasOutputNode()) {
      toast.error("Only one Output node is allowed per workflow")
      return
    }

    set({ nodes: [...state.nodes, node] })
    // ... rest of existing logic
  },
}))
```

**Reasoning**: Enforce the "one output node" rule at state level before node creation.

#### 3.2 Add Output Node Button to Toolbar
**File**: `/components/workflows/v2/WorkflowBuilder.tsx` or toolbar component

**Add Button**:
```tsx
<button
  onClick={handleAddOutputNode}
  disabled={hasOutputNode()}
  className="flex items-center gap-2 px-3 py-2 rounded-lg border disabled:opacity-50"
  title={hasOutputNode() ? "Output node already added" : "Add output node"}
>
  <CheckCircle className="h-4 w-4" />
  Add Output
</button>

const handleAddOutputNode = () => {
  const newNode: WorkflowNode = {
    id: `output-${Date.now()}`,
    type: "output",
    position: { x: 400, y: 200 },  // Default position
    data: {
      label: "Output",
      status: "idle",
      onConfigureOutput: openOutputPanel,
    }
  }
  addNode(newNode)
}
```

**Reasoning**: Provide UI affordance for adding output node. Button disables after one is added.

#### 3.3 Edge Validation Updates
**File**: `/components/workflows/v2/WorkflowCanvas.tsx`

**Update `isValidConnection`**:
```typescript
const isValidConnection = (connection: Connection) => {
  const { source, target } = connection
  const sourceNode = nodes.find(n => n.id === source)
  const targetNode = nodes.find(n => n.id === target)

  if (!sourceNode || !targetNode) return false

  // Output node can only be TARGET, never SOURCE
  if (sourceNode.type === "output") {
    toast.error("Output node cannot connect to other nodes (it's a terminal node)")
    return false
  }

  // Output node can accept connections from tasks
  if (targetNode.type === "output") {
    // In sequential: tasks can connect to output
    if (workflowType === "sequential" && sourceNode.type === "task") {
      return true
    }
    // In orchestrator: tasks can connect to output
    if (workflowType === "orchestrator" && sourceNode.type === "task") {
      return true
    }
    toast.error("Only task nodes can connect to the Output node")
    return false
  }

  // ... existing validation logic for other nodes ...
}
```

**Reasoning**: Output node is terminal - accepts incoming connections but cannot connect outward.

---

### Phase 4: Display Logic & Modals

#### 4.1 Add Modal Type for Output Panel
**File**: `/components/workflows/v2/hooks/useWorkflowState.ts`

**Update ModalType**:
```typescript
export type ModalType =
  | "idle"
  | "workflow-type-select"
  | "trigger-select"
  | "trigger-config"
  | "agent-select"
  | "task-config"
  | "orchestrator-config"
  | "task-sheet"
  | "output-panel"  // NEW
```

**Add State**:
```typescript
export interface WorkflowState {
  // ... existing state ...
  activeOutputId: string | null  // NEW: Track which output node is open

  // NEW: Open output panel
  openOutputPanel: (outputId: string) => void
}
```

#### 4.2 Create Output Detail Panel Component
**File**: `/components/workflows/outputs/OutputDetailPanel.tsx` (new file)

**Component**:
```tsx
import React, { useEffect, useState } from "react"
import { useWorkflowState } from "@/components/workflows/v2/hooks/useWorkflowState"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface OutputDetailPanelProps {
  workflowId: string
  outputNodeId: string
  onClose: () => void
}

export function OutputDetailPanel({
  workflowId,
  outputNodeId,
  onClose
}: OutputDetailPanelProps) {
  const [latestRun, setLatestRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch latest workflow run
    async function fetchLatestRun() {
      const response = await fetch(`/api/workflows/${workflowId}/executions?limit=1`)
      const data = await response.json()
      setLatestRun(data.runs?.[0] || null)
      setLoading(false)
    }
    fetchLatestRun()
  }, [workflowId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!latestRun) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Workflow Output</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No workflow executions yet.</p>
            <p className="text-xs mt-2">Run the workflow to see output here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { result, status, error } = latestRun

  return (
    <Card className="max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workflow Output</h3>
          <p className="text-sm text-muted-foreground">
            Latest execution: {new Date(latestRun.started_at).toLocaleString()}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </CardHeader>

      <CardContent>
        {/* Status Banner */}
        <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
          status === "completed" ? "bg-green-500/10 text-green-700" :
          status === "failed" ? "bg-red-500/10 text-red-700" :
          "bg-blue-500/10 text-blue-700"
        }`}>
          {status === "completed" && <CheckCircle2 className="h-5 w-5" />}
          {status === "failed" && <AlertCircle className="h-5 w-5" />}
          {status === "running" && <Loader2 className="h-5 w-5 animate-spin" />}
          <span className="font-medium capitalize">{status}</span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 font-medium">Error:</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <Tabs defaultValue="formatted">
            <TabsList>
              <TabsTrigger value="formatted">Formatted</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="formatted" className="mt-4">
              <div className="prose prose-sm max-w-none">
                {typeof result === "string" ? (
                  <ReactMarkdown>{result}</ReactMarkdown>
                ) : (
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </TabsContent>

            <TabsContent value="raw" className="mt-4">
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
                {typeof result === "string" ? result : JSON.stringify(result)}
              </div>
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
```

**Reasoning**: Provides rich output display with:
- Empty state if no executions
- Status indicators
- Error display
- Multiple view formats (formatted markdown, raw, JSON)
- Fetches latest `workflow_runs.result` automatically

#### 4.3 Integrate Output Panel into Modal System
**File**: `/components/workflows/WorkflowModals.tsx`

**Add to Render Logic**:
```tsx
{modalState.type === "output-panel" && modalState.activeOutputId && (
  <Dialog open onOpenChange={() => closeModal()}>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <OutputDetailPanel
        workflowId={workflowId}
        outputNodeId={modalState.activeOutputId}
        onClose={closeModal}
      />
    </DialogContent>
  </Dialog>
)}
```

---

### Phase 5: Execution Integration

#### 5.1 Update Node Status During Execution
**File**: Component that handles workflow execution display (e.g., `WorkflowExecutions.tsx`)

**Logic**:
- When workflow_run status changes to "running", update output node status to "running"
- When workflow_run completes, update output node status to "completed"
- When workflow_run fails, update output node status to "error"

**Implementation**:
```typescript
// In WorkflowExecutions or similar component
useEffect(() => {
  if (selectedRun) {
    // Update output node status based on run
    const outputNode = nodes.find(n => n.type === "output")
    if (outputNode) {
      updateNode(outputNode.id, {
        ...outputNode,
        data: {
          ...outputNode.data,
          status: selectedRun.status === "running" ? "running" :
                  selectedRun.status === "completed" ? "completed" :
                  selectedRun.status === "failed" ? "error" : "idle"
        }
      })
    }
  }
}, [selectedRun])
```

**Reasoning**: Provides real-time visual feedback on output node status during execution.

---

### Phase 6: Edge Cases & Polish

#### 6.1 Handle Edge Cases

**Case 1: Workflow Never Executed**
- ✅ Handled by OutputDetailPanel showing placeholder "No executions yet"

**Case 2: Execution Failed**
- ✅ Handled by showing error banner with error message

**Case 3: User Deletes Output Node**
- ✅ Allowed - node is optional, deletion is standard node operation

**Case 4: Auto-update on New Execution**
- Implement polling or real-time updates
- Option 1: Poll every 5s when output panel is open
- Option 2: Use SSE to push updates when run completes
- **Recommendation**: Start with manual refresh button, add auto-update later

#### 6.2 Connection Handle Positions

**For Orchestrator Workflows**:
- Output node should also have Top handle (Position.Top) for vertical flow
- Update OutputNode component:

```tsx
{/* Handle positioning based on workflow type */}
<Handle
  type="target"
  position={workflowType === "orchestrator" ? Position.Top : Position.Left}
  className="handle-target"
/>
```

#### 6.3 Auto-layout Integration

**File**: Dagre layout function in WorkflowCanvas

**Ensure Output Node Positioned Last**:
- Output node should appear at end of graph (rightmost in sequential, bottom in orchestrator)
- Dagre will handle this automatically if edges are correct

---

## Implementation Order

1. **Types** (`/types/workflow.ts`) - Add OutputNodeData and update WorkflowNode union
2. **Component** (`/components/workflows/outputs/OutputNode.tsx`) - Create node component
3. **Registration** (`WorkflowCanvas.tsx`) - Register in ReactFlow nodeTypes
4. **Validation** (`useWorkflowState.ts`) - Add single-node enforcement
5. **Toolbar** (`WorkflowBuilder.tsx`) - Add "Add Output" button
6. **Edge Validation** (`WorkflowCanvas.tsx`) - Update connection rules
7. **Modal Type** (`useWorkflowState.ts`) - Add output-panel modal type
8. **Detail Panel** (`/components/workflows/outputs/OutputDetailPanel.tsx`) - Create display component
9. **Modal Integration** (`WorkflowModals.tsx`) - Wire up output panel
10. **Status Updates** (Execution components) - Update node status on run changes
11. **Testing** - Test all scenarios (add, delete, connect, execute, view output)

---

## Files to Create

1. `/components/workflows/outputs/OutputNode.tsx` - Main node component
2. `/components/workflows/outputs/OutputDetailPanel.tsx` - Output display panel

## Files to Modify

1. `/types/workflow.ts` - Add output node type
2. `/components/workflows/v2/WorkflowCanvas.tsx` - Register node, update validation
3. `/components/workflows/v2/hooks/useWorkflowState.ts` - Add state and enforcement
4. `/components/workflows/v2/WorkflowBuilder.tsx` - Add toolbar button
5. `/components/workflows/WorkflowModals.tsx` - Integrate output panel
6. `/components/workflows/WorkflowExecutions.tsx` - Update node status on execution

---

## Testing Checklist

- [ ] Add output node via toolbar button
- [ ] Cannot add second output node (button disabled)
- [ ] Can delete output node
- [ ] Can connect task → output in sequential workflow
- [ ] Can connect task → output in orchestrator workflow
- [ ] Cannot connect output → other nodes
- [ ] Cannot connect trigger → output directly
- [ ] Click output node before execution shows placeholder
- [ ] Run workflow and output node status updates to "running"
- [ ] After completion, output node shows "completed" status
- [ ] Click output node after execution shows result panel
- [ ] Result panel displays formatted, raw, and JSON views
- [ ] Failed execution shows error in output panel
- [ ] Refresh/re-run workflow updates output panel

---

## Future Enhancements (Optional)

1. **Auto-refresh**: Real-time updates when new execution completes
2. **Output Filtering**: Configure what fields from result to display
3. **Export**: Download output as JSON, CSV, or TXT
4. **History**: View output from previous executions (not just latest)
5. **Notifications**: Alert when workflow completes with output ready
6. **Formatting Options**: Custom display templates for structured output
