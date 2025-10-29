import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export const runtime = "nodejs";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

async function handleRequest(req: NextRequest, method: string) {
  try {
    // Require an authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders() });
    }

    // Strip the local prefix `/api/chat/` so we forward bare paths like `threads`, `runs`, etc.
    const path = req.nextUrl.pathname.replace(/^\/?api\/chat\//, "");
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete("_path");
    searchParams.delete("nxtP_path");
    const queryString = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";

    const options: RequestInit = {
      method,
      headers: {
        "x-api-key": process.env["LANGSMITH_API_KEY"] || "",
        // Preserve content-type for JSON bodies when present
        ...(req.headers.get("content-type")
          ? { "content-type": req.headers.get("content-type") as string }
          : {}),
      },
    };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      let body = await req.text();
      
      // For thread creation, inject user metadata
      if (path === "threads" && method === "POST") {
        try {
          const bodyObj = JSON.parse(body);
          // Get assistant_id from query params, body, or referer header
          let assistantId = searchParams.get("assistant_id") || bodyObj.assistant_id;
          
          // Try to extract from referer URL if not found
          if (!assistantId) {
            const referer = req.headers.get("referer");
            if (referer) {
              const match = referer.match(/\/agents\/([^\/]+)/);
              if (match) {
                assistantId = match[1];
              }
            }
          }
          
          if (assistantId) {
            bodyObj.metadata = {
              ...bodyObj.metadata,
              user_id: user.id,
              assistant_id: assistantId,
            };
            body = JSON.stringify(bodyObj);
          }
        } catch (e) {
          // If body is not JSON, continue as-is
        }
      }
      
      options.body = body;
    }

    const target = `${process.env["LANGGRAPH_API_URL"]?.replace(/\/$/, "")}/${path}${queryString}`;
    const started = Date.now();
    const res = await fetch(target, options);
    const elapsed = Date.now() - started;
    console.log("[Proxy]", method, target, res.status, `${elapsed}ms`);

    // Copy through selected upstream headers for streaming correctness
    const upstreamContentType = res.headers.get("content-type") || "application/x-ndjson; charset=utf-8";
    const upstreamCacheControl = res.headers.get("cache-control") || "no-cache, no-transform";

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: {
        "content-type": upstreamContentType,
        "cache-control": upstreamCacheControl,
        "x-accel-buffering": "no",
        ...getCorsHeaders(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export const GET = (req: NextRequest) => handleRequest(req, "GET");
export const POST = (req: NextRequest) => handleRequest(req, "POST");
export const PUT = (req: NextRequest) => handleRequest(req, "PUT");
export const PATCH = (req: NextRequest) => handleRequest(req, "PATCH");
export const DELETE = (req: NextRequest) => handleRequest(req, "DELETE");

// Add a new OPTIONS handler
export const OPTIONS = () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(),
    },
  });
};