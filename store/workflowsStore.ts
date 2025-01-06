// store/workflowsStore.ts
import { create } from "zustand";

interface Workflow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowsState {
  workflows: Workflow[];
  addWorkflow: (workflow: Workflow) => void;
  setWorkflows: (workflows: Workflow[]) => void;
}

export const useWorkflowsStore = create<WorkflowsState>((set) => ({
  workflows: [],
  addWorkflow: (workflow: Workflow) =>
    set((state) => ({
      workflows: [...state.workflows, workflow],
    })),
  setWorkflows: (workflows: Workflow[]) => set({ workflows }),
}));
