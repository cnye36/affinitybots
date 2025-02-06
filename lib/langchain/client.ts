import { Client } from "@langchain/langgraph-sdk";

let langGraphClient: Client | null = null;

export const getLangGraphClient = () => {
  if (langGraphClient) {
    return langGraphClient;
  }

  const langGraphUrl = process.env.LANGGRAPH_URL;

  if (!langGraphUrl) {
    throw new Error("LANGGRAPH_URL environment variable is not set");
  }

  langGraphClient = new Client({
    apiUrl: process.env.LANGRAPH_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  return langGraphClient;
};
