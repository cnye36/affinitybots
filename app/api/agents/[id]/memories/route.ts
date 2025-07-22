import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/agent/reactAgent";
import { createClient } from "@/supabase/client";
import logger from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create a Supabase client
    const supabase = await createClient();

    // Verify user session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentId = params.id;

    // Fetch memories from the store
    const namespace = ["user_profile", agentId];
    const memories = await store.search(namespace, { filter: {} });

    // Format memories for the frontend
    const formattedMemories = memories.map((memory) => {
      const { attribute, value, extracted_at, source_message } =
        memory.value as {
          attribute: string;
          value: unknown;
          extracted_at: string;
          source_message?: string;
        };

      return {
        id: memory.key, // Use the memory key as the ID
        attribute,
        value,
        extracted_at,
        source_message,
      };
    });

    return NextResponse.json(formattedMemories);
  } catch (error) {
    logger.error("Error fetching memories:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}
