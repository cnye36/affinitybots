import { streamText } from "ai";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { generateChatName } from "@/lib/chat-utils";
import { initializeTools } from "@/lib/tools";
import { openai } from "@ai-sdk/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

// Define type for tools
interface Tool {
  description: string;
  parameters: Record<string, unknown>;
  invoke?: (args: Record<string, unknown>) => Promise<string>;
}

interface DocumentMatch {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

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
    const { error: chatError } = await supabase.from("agent_chats").insert([
      {
        thread_id: currentThreadId,
        agent_id: params.id,
        user_id: user.id,
        role: "user",
        content: messages[messages.length - 1].content,
      },
    ]);

    if (chatError) {
      console.error("Error saving user message:", chatError);
      throw chatError;
    }

    // 6. Initialize tools
    const { tools } = await initializeTools(
      agent.tools || [],
      agent.config?.toolsConfig
    );

    // 7. Get relevant documents if knowledge is enabled
    let contextText = "";
    if (agent.config?.enableKnowledge) {
      const embedding = await new OpenAIEmbeddings().embedQuery(
        messages[messages.length - 1].content
      );

      const { data: documents } = (await supabase.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.8,
        match_count: 5,
        agent_id: params.id,
      })) as { data: DocumentMatch[] };

      if (documents?.length > 0) {
        contextText = `\nRelevant context from documents:\n${documents
          .map((doc: DocumentMatch) => doc.content)
          .join("\n")}`;
      }
    }

    // 8. Generate response using AI SDK's streamText
    const result = await streamText({
      model: openai(agent.model_type || "gpt-4"),
      messages: [
        { role: "system", content: agent.prompt_template + contextText },
        ...messages,
      ],
      temperature: agent.config?.temperature || 0.7,
      maxTokens: agent.config?.max_tokens,
      tools: tools
        ? Object.entries(tools).reduce(
            (acc, [name, tool]) => {
              const typedTool = tool as Tool;
              acc[name] = {
                description: typedTool.description,
                parameters: typedTool.parameters,
                execute: async (args: Record<string, unknown>) => {
                  if (typedTool.invoke) {
                    return await typedTool.invoke(args);
                  }
                  return "Tool execution not implemented";
                },
              };
              return acc;
            },
            {} as Record<
              string,
              {
                description: string;
                parameters: Record<string, unknown>;
                execute: (args: Record<string, unknown>) => Promise<string>;
              }
            >
          )
        : undefined,
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
