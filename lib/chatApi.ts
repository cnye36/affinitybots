import { Client, ThreadState } from "@langchain/langgraph-sdk";
import { LangChainMessage } from "@assistant-ui/react-langgraph";

const createClient = () => {
  const apiUrl = process.env["NEXT_PUBLIC_LANGGRAPH_API_URL"] || "/api/chat";
  return new Client({
    apiUrl,
  });
};

export const createAssistant = async (graphId: string) => {
  const client = createClient();
  return client.assistants.create({
    graphId,
  });
};

/**
 * Creates a thread. When an `assistantId` is provided, this will route through
 * our Next.js API to ensure the thread has the correct metadata (user_id, assistant_id).
 * Otherwise, it will create a raw LangGraph thread via the proxy client.
 */
export const createThread = async (assistantId?: string): Promise<{ thread_id: string }> => {
  if (assistantId) {
    const res = await fetch(`/api/assistants/${assistantId}/threads`, {
      method: "POST",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create thread: ${res.status} ${text}`);
    }
    const json = await res.json();
    return { thread_id: json.thread_id };
  }

  const client = createClient();
  const thread = await client.threads.create();
  return { thread_id: thread.thread_id };
};

export const getThreadState = async (
  threadId: string,
): Promise<ThreadState<{ messages: LangChainMessage[] }>> => {
  const client = createClient();
  return client.threads.getState(threadId);
};

export const updateState = async ( 
  threadId: string, 
  fields: { 
    newState: Record<string, unknown>;
    asNode?: string;
  },
) => {
  const client = createClient();
  return client.threads.updateState(threadId, {
    values: fields.newState,
    asNode: fields.asNode,
  });
};

export const sendMessage = async (params: {
  threadId: string;
  messages: LangChainMessage[];
  assistantId?: string;
}) => {
  const client = createClient();
  const assistantId = params.assistantId || process.env["NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID"]!;
  
  return client.runs.stream(
    params.threadId,
    assistantId,
    {
      input: {
        messages: params.messages,
      },
      config: {
        configurable: {
          assistant_id: assistantId,
          thread_id: params.threadId,
        },
      },
      streamMode: "messages",
    },
  );
};