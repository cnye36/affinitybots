import { Client } from "@langchain/langgraph-sdk";

let client: Client | null = null;

export function getLangGraphClient() {
  if (!client) {
    client = new Client({
      apiUrl: process.env.LANGGRAPH_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });
  }
  return client;
}

export async function cleanupLangGraphClient() {
  if (client) {
    client = null;
  }
}
