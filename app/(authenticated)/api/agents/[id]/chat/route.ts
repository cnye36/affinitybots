import { streamText } from "ai";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateChatName } from "@/lib/chat-utils";
import { initializeTools } from "@/lib/tools";
import { openai } from "@ai-sdk/openai";
import { retrieveRelevantDocuments } from "@/lib/retrieval";

export const maxDuration = 30;

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const supabase = await createClient();

  try {
    // Authentication check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request data
    const { messages, threadId } = await request.json();
    let currentThreadId = threadId;

    // Get agent details
    const { data: agent } = await supabase
      .from("agents")
      .select("*")
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .single();

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Create new thread if needed
    if (!currentThreadId) {
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

    // Save user message
    const userMessage = messages[messages.length - 1].content;
    await supabase.from("agent_chats").insert([
      {
        thread_id: currentThreadId,
        agent_id: params.id,
        user_id: user.id,
        role: "user",
        content: userMessage,
      },
    ]);

    // Get thread messages
    const { data: threadMessages } = await supabase
      .from("agent_chats")
      .select("*")
      .eq("thread_id", currentThreadId)
      .order("created_at", { ascending: true });

    // Get relevant documents
    const relevantDocuments = await retrieveRelevantDocuments(userMessage, 5);
    const documentContents = relevantDocuments
      .map((doc) => doc.pageContent)
      .join("\n");

    // Initialize tools
    const tools = await initializeTools(agent.tools || [], {
      toolConfig: agent.config?.toolsConfig || {},
      userId: user.id,
    });

    // Convert tools to the format expected by streamText
    const toolsFormatted = tools.reduce((acc, tool) => {
      acc[tool.name] = {
        description: tool.description,
        parameters: tool.schema,
        function: async (args: Record<string, unknown>) => {
          try {
            return await tool.invoke(args);
          } catch (error) {
            console.error(`Error executing tool ${tool.name}:`, error);
            return `Error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;
          }
        },
      };
      return acc;
    }, {} as Record<string, { description: string; parameters: unknown; function: (args: Record<string, unknown>) => Promise<string> }>);

    // Stream response
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
      tools:
        Object.keys(toolsFormatted).length > 0 ? toolsFormatted : undefined,
    });

    // Save response
    let fullResponse = "";
    result.textStream.pipeTo(
      new WritableStream({
        write(chunk) {
          fullResponse += chunk;
        },
        async close() {
          await supabase.from("agent_chats").insert([
            {
              thread_id: currentThreadId,
              agent_id: params.id,
              user_id: user.id,
              role: "assistant",
              content: fullResponse,
            },
          ]);
        },
      })
    );

    // Return streaming response with thread ID
    const response = result.toDataStreamResponse();
    response.headers.set("X-Thread-Id", currentThreadId);
    return response;
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
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
