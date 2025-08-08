import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

async function handleRequest(req: NextRequest, method: string) {
  try {
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
      },
    };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      options.body = await req.text();
    }

    const target = `${process.env["LANGGRAPH_API_URL"]?.replace(/\/$/, "")}/${path}${queryString}`;
    const started = Date.now();
    const res = await fetch(target, options);
    const elapsed = Date.now() - started;
    console.log("[Proxy]", method, target, res.status, `${elapsed}ms`);

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: {
        ...res.headers,
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