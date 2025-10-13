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
}) => {
  const assistantId = params.assistantId;
  if (!assistantId) {
    throw new Error("assistantId is required for sending messages");
  }

  // Call our authenticated server endpoint which streams Server-Sent Events.
  // Convert the SSE stream into an AsyncGenerator that Assistant UI expects.
  const response = await fetch(`/api/agents/${assistantId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId: params.threadId, messages: params.messages }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Failed to send message: ${response.status} ${errorText}`);
  }

  const textDecoder = new TextDecoder();
  const reader = response.body.getReader();

  async function* sseToEvents() {
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += textDecoder.decode(value, { stream: true });

        // Split on SSE message boundary (blank line) and keep the tail in buffer
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          // Parse lines like: "event: messages/token" and "data: {...}"
          const lines = part.split("\n");
          let eventName = "";
          const dataLines: string[] = [];
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
            }
          }

          const dataRaw = dataLines.join("\n");
          let data: unknown = dataRaw;
          try {
            data = dataRaw ? JSON.parse(dataRaw) : null;
          } catch {
            // non-JSON payloads are unlikely but pass through raw string
          }

          // Yield the exact shape produced by the LangGraph SDK stream
          // { event: string, data: any }
          yield { event: eventName, data } as any;

          // When server emits a rate-limit event, trigger a client-side refresh notification
          if (eventName === "rate-limit") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("rate-limit:updated"));
            }
          }
        }
      }
      // Flush any remaining buffered message (best effort)
      if (buffer.trim().length > 0) {
        const lines = buffer.split("\n");
        let eventName = "";
        const dataLines: string[] = [];
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }
        const dataRaw = dataLines.join("\n");
        let data: unknown = dataRaw;
        try {
          data = dataRaw ? JSON.parse(dataRaw) : null;
        } catch {}
        yield { event: eventName, data } as any;
      }
    } finally {
      try {
        await reader.cancel();
      } catch {}
    }
  }

  return sseToEvents();
};