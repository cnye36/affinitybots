import { ThreadState } from "@langchain/langgraph-sdk";

type StreamMode = "values" | "messages" | "updates";

interface ThreadStateValues {
  messages: Array<{
    role: string;
    content: string;
    id?: string;
  }>;
  [key: string]: unknown;
}

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};


export const createThread = async (assistantId: string) => {
  const response = await fetch(
    `${getBaseUrl()}/api/assistants/${assistantId}/threads`,
    {
      method: "POST",
    }
  );
  if (!response.ok) {
    throw new Error("Failed to create thread");
  }
  return response.json();
};

export const getThreadState = async (
  threadId: string,
  assistantId: string
): Promise<ThreadState<ThreadStateValues>> => {
  const response = await fetch(
    `${getBaseUrl()}/api/assistants/${assistantId}/threads/${threadId}`
  );
  if (!response.ok) {
    throw new Error("Failed to get thread state");
  }
  return response.json();
};

export const updateState = async (
  threadId: string,
  assistantId: string,
  fields: {
    newState: ThreadStateValues;
    asNode?: string;
  }
) => {
  const response = await fetch(
    `${getBaseUrl()}/api/assistants/${assistantId}/threads/${threadId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    }
  );
  if (!response.ok) {
    throw new Error("Failed to update state");
  }
  return response.json();
};

export const sendMessage = async (params: {
  threadId: string;
  assistantId: string;
  messageId: string;
  message: string | null;
  model: string;
  userId: string;
  systemInstructions: string;
  streamMode: StreamMode;
}) => {
  const response = await fetch(
    `${getBaseUrl()}/api/assistants/${params.assistantId}/threads/${
      params.threadId
    }/runs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: params.message,
        config: {
          configurable: {
            model_name: params.model,
            system_instructions: params.systemInstructions,
          },
        },
        input: {
          messages: [
            {
              id: params.messageId,
              role: "human",
              content: params.message,
            },
          ],
          userId: params.userId,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return response.body;
};
