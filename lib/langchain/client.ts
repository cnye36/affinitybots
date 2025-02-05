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
    apiUrl: langGraphUrl,
  });

  return langGraphClient;
};
