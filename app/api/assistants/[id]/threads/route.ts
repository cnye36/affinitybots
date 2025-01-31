import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getLangGraphClient } from "@/lib/langchain/client";

// POST - Create a new thread
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const client = getLangGraphClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a new thread for the assistant
    const thread = await client.threads.create({
      metadata: {
        owner_id: user.id,
        assistant_id: params.id,
      },
    });

    return NextResponse.json(thread);
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

// GET - List all threads for an assistant
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const client = getLangGraphClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all threads for this assistant
    const threads = await client.threads.search({
      metadata: {
        owner_id: user.id,
        assistant_id: params.id,
      },
    });

    return NextResponse.json(threads || []);
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
} 