import { NextRequest, NextResponse } from "next/server";
import { generateChatName } from "@/lib/chat-utils";

export async function POST(request: NextRequest) {
  try {
    const { conversation } = await request.json();

    // Generate the chat name using the server-side function
    const title = await generateChatName(conversation);

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error("Error generating thread title:", error);
    return NextResponse.json(
      { error: "Failed to generate thread title" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error("Error updating thread title:", error);
    return NextResponse.json(
      { error: "Failed to update thread title" },
      { status: 500 }
    );
  }
}
