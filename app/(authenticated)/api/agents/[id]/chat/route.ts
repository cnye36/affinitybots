import { streamText } from "ai";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateChatName } from "@/lib/chat-utils";
import { initializeTools } from "@/lib/tools";
import { openai } from "@ai-sdk/openai";
import { retrieveRelevantDocuments } from "@/lib/retrieval";

// Define type for tools
interface ChatTool {
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

type ToolParams = {
  web_search: { query: string; maxResults?: number };
  web_scraper: { url: string; selector?: string };
  knowledge_base: { query: string; collection?: string; limit?: number };
  document_reader: { documentId: string; fileType?: string };
  spreadsheet: {
    operation: "read" | "write" | "append";
    data?: Record<string, unknown>;
    range?: string;
    sheetName?: string;
  };
  task_scheduler: {
    task: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high";
    timezone?: string;
  };
  database_query: { query: string; maxRows?: number };
};

export const maxDuration = 30;

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const supabase = await createClient();

  try {
    // 1. Authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get request data
    const { messages, threadId } = await request.json();
    let currentThreadId = threadId;

    // 3. Get agent details
    const { data: agent } = await supabase
      .from("agents")
      .select("*")
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .single();

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // 4. Create new thread if needed
    if (!currentThreadId) {
      // Generate title from user's first message if available, otherwise use default
      const title =
        messages?.length > 0
          ? await generateChatName(messages[messages.length - 1].content)
          : "New Chat";

      const { data: thread, error: threadError } = await supabase
        .from("chat_threads")
        .insert([
          {
            agent_id: params.id,
            user_id: user.id,
            title,
          },
        ])
        .select()
        .single();

      if (threadError) throw threadError;
      currentThreadId = thread.id;
    }

    // 5. Save user message
    const userMessage = messages[messages.length - 1].content;
    const { error: chatError } = await supabase.from("agent_chats").insert([
      {
        thread_id: currentThreadId,
        agent_id: params.id,
        user_id: user.id,
        role: "user",
        content: userMessage,
      },
    ]);

    if (chatError) {
      console.error("Error saving user message:", chatError);
      throw chatError;
    }

    // 6. Get all messages for this thread to maintain context
    const { data: threadMessages } = await supabase
      .from("agent_chats")
      .select("*")
      .eq("thread_id", currentThreadId)
      .order("created_at", { ascending: true });

    // 7. Retrieve relevant documents based on the latest user message
    const relevantDocuments = await retrieveRelevantDocuments(userMessage, 5);
    const documentContents = relevantDocuments
      .map((doc) => doc.pageContent)
      .join("\n");

    // 8. Initialize tools and get response
    const initializedTools = await initializeTools(agent.tools || [], {
      toolConfig: agent.config?.toolsConfig || {},
    });

    const chatTools = Object.entries(initializedTools).reduce(
      (acc, [name, tool]) => {
        if (!tool) return acc;

        acc[name] = {
          description: tool.description,
          parameters: tool.parameters,
          execute: async (args: Record<string, unknown>) => {
            try {
              // Type assertion based on tool name
              return await tool.invoke(
                args as ToolParams[typeof name extends keyof ToolParams
                  ? typeof name
                  : never]
              );
            } catch (error) {
              console.error(`Error executing tool ${name}:`, error);
              return `Error executing ${name}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`;
            }
          },
        };
        return acc;
      },
      {} as Record<string, ChatTool>
    );

    const result = await streamText({
      model: openai(agent.model_type || "gpt-4o"),
      messages: [
        { role: "system", content: agent.prompt_template },
        {
          role: "system",
          content: `Here is some relevant context:\n${documentContents}`,
        },
        ...(threadMessages || []).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      temperature: agent.config?.temperature || 0.7,
      maxTokens: agent.config?.max_tokens,
      tools: Object.keys(chatTools).length > 0 ? chatTools : undefined,
    });

    // Set up a callback to save the complete response
    let fullResponse = "";
    result.textStream.pipeTo(
      new WritableStream({
        write(chunk) {
          fullResponse += chunk;
        },
        async close() {
          // Save assistant response
          const { error: assistantError } = await supabase
            .from("agent_chats")
            .insert([
              {
                thread_id: currentThreadId,
                agent_id: params.id,
                user_id: user.id,
                role: "assistant",
                content: fullResponse,
              },
            ]);

          if (assistantError) {
            console.error("Error saving assistant response:", assistantError);
          }
        },
      })
    );

    // Return the streaming response with thread ID
    const response = result.toDataStreamResponse();
    response.headers.set("X-Thread-Id", currentThreadId);
    return response;
  } catch (error) {
    console.error("Error in chat route:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json({ messages: [] });
    }

    const supabase = await createClient();
    const { data: messages, error } = await supabase
      .from("agent_chats")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Transform messages to match useChat's expected format
    const formattedMessages =
      messages?.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })) || [];

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Error in chat GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}
