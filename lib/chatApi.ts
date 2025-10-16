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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("timeout"), 15000);
    const res = await fetch(`/api/agents/${assistantId}/threads`, {
      method: "POST",
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create thread: ${res.status} ${text}`);
    }
    const json = await res.json();
    clearTimeout(timeout);
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
  command?: { resume: any };
}) => {
  const assistantId = params.assistantId;
  if (!assistantId) {
    throw new Error("assistantId is required for sending messages");
  }

  // Call our authenticated server endpoint which streams newline-delimited JSON
  const response = await fetch(`/api/agents/${assistantId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      threadId: params.threadId, 
      messages: params.messages,
      command: params.command,
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Failed to send message: ${response.status} ${errorText}`);
  }

  const textDecoder = new TextDecoder();
  const reader = response.body.getReader();

  async function* streamEvents() {
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += textDecoder.decode(value, { stream: true });

        // Split on newline and process complete JSON objects
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const parsed = JSON.parse(line);
            yield parsed;
          } catch (error) {
            console.warn("Failed to parse event line:", line, error);
          }
        }
      }
      
      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          yield parsed;
        } catch {}
      }
    } finally {
      try {
        await reader.cancel();
      } catch {}
    }
  }

  return streamEvents();
};