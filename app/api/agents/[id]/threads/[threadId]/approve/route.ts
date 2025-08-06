import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const params = await props.params;
  const { id, threadId } = params;
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate assistant ownership
    const { data: userAssistant, error: userAssistantError } = await supabase
      .from("user_assistants")
      .select("assistant_id")
      .eq("user_id", user.id)
      .eq("assistant_id", id)
      .single();

    if (userAssistantError || !userAssistant) {
      return NextResponse.json(
        { error: "Assistant not found or access denied" },
        { status: 404 }
      );
    }

    const { approved, toolCallIds, alwaysAllow } = await request.json();

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid approval status" },
        { status: 400 }
      );
    }

    // Store always allow preferences if applicable
    if (approved && alwaysAllow && toolCallIds?.length) {
      // You might want to store always-allow preferences in your database
      console.log(`User opted to always allow tools: ${toolCallIds.join(', ')}`);
    }

    if (approved) {
      // Resume execution - LangGraph will continue from the interrupt
      const resumeResult = await client.runs.create(threadId, 'reactAgent', {
        input: null, // No new input needed, just resume
        metadata: {
          user_id: user.id,
        },
        config: {
          
          configurable: {
            user_id: user.id,
            assistant_id: id,
            thread_id: threadId,
          }
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        approved: true,
        runId: resumeResult.run_id 
      });
    } else {
      // If denied, we need to update the state to remove tool calls and continue
      const currentState = await client.threads.getState(threadId);
      
      if (!currentState?.values) {
        return NextResponse.json(
          { error: "Thread state not found" },
          { status: 404 }
        );
      }

      // Remove tool calls from the last message and add a denial message
      const messages = [...currentState.values.messages];
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage && lastMessage.tool_calls) {
        // Replace the last message with one without tool calls
        messages[messages.length - 1] = {
          ...lastMessage,
          tool_calls: undefined
        };
        
        // Add a system message about the denial
        messages.push({
          type: "ai",
          content: "I understand you've decided not to use those tools. Let me provide an alternative response without using external tools."
        });
      }

      // Update state and resume
      await client.threads.updateState(threadId, { messages });
      
      const resumeResult = await client.runs.create(threadId, 'reactAgent', {
        input: null,
        metadata: {
          user_id: user.id,
        },
        config: {
          
          configurable: {
            user_id: user.id,
            assistant_id: id,
            thread_id: threadId,
          }
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        approved: false,
        runId: resumeResult.run_id 
      });
    }


  } catch (error) {
    console.error("Error handling tool approval:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}