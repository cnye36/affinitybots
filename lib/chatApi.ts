import { Client, ThreadState } from "@langchain/langgraph-sdk";
import { LangChainMessage } from "@assistant-ui/react-langgraph";

const createClient = () => {
  const apiUrl = process.env["NEXT_PUBLIC_LANGGRAPH_API_URL"] || "/api/chat";
  return new Client({
    apiUrl,
  });
};

export const createThread = async () => {
  const client = createClient();
  return client.threads.create();
};

export const getThreadState = async (
  threadId: string,
): Promise<ThreadState<{ messages: LangChainMessage[] }>> => {
  const client = createClient();
  return client.threads.getState(threadId);
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