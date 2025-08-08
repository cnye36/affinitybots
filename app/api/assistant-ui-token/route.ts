import { NextResponse } from "next/server";
import { AssistantCloud } from "@assistant-ui/react";
import { createClient } from "@/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Workspace strategy: per-user workspace. Adjust if you have orgs.
    const userId = user.id;
    const workspaceId = user.id;

    const cloud = new AssistantCloud({
      apiKey: process.env["ASSISTANT_API_KEY"]!,
      userId,
      workspaceId,
    });

    const { token } = await cloud.auth.tokens.create();
    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Token error" }, { status: 500 });
  }
}

