// lib/langchain/workflow.ts
import { ChatSession } from "./session";

export async function importChatToWorkflow(
  threadId: string,
  workflowId: string,
  taskId: string
) {
  // Get chat session
  const session = await ChatSession.load(threadId);

  // Export chat state
  const chatState = session.exportToWorkflow();

  // Add to workflow state
  return {
    ...chatState,
    metadata: {
      ...chatState.metadata,
      workflowId,
      taskId,
    },
  };
}
