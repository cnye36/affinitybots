import { NextRequest, NextResponse } from "next/server"
import { clearMcpCache } from "@/lib/mcp/mcpClientManager"

export async function POST(request: NextRequest) {
  try {
    clearMcpCache()
    return NextResponse.json({ success: true, message: "MCP cache cleared" })
  } catch (error: any) {
    console.error("Error clearing MCP cache:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

