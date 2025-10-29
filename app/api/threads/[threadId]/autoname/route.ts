import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { Client } from "@langchain/langgraph-sdk"
import { generateChatName } from "@/lib/generateTitle"

export const runtime = "nodejs"

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await props.params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let conversation = ""
    try {
      const body = await request.json()
      if (typeof body?.conversation === "string") {
        conversation = body.conversation.trim()
      }
    } catch {}

    if (!conversation) {
      return NextResponse.json(
        { error: "Missing conversation text" },
        { status: 400 }
      )
    }

    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    })

    const title = await generateChatName(conversation.slice(0, 160))

    // Preserve existing metadata while updating title
    const existing = await client.threads.get(threadId)
    await client.threads.update(threadId, {
      metadata: {
        ...(existing?.metadata || {}),
        title,
        user_id: user.id,
      },
    })

    return NextResponse.json({ success: true, title })
  } catch (error) {
    console.error("[autoname] Failed to set title:", error)
    return NextResponse.json({ error: "Failed to set title" }, { status: 500 })
  }
}


