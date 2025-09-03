import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

const enhancerSystemPrompt = `
You are an expert writing assistant. Expand a short, informal sentence about the AI agent the user wants into a single, richer paragraph that adds helpful detail without changing the original intent.

Requirements:
- Output exactly one cohesive paragraph (3–6 sentences, ~80–150 words).
- Keep the user's scope and intent intact; enrich with reasonable specifics.
- Use first-person voice from the user's perspective (e.g., "I need an AI agent that…").
- Include: capabilities, expected inputs/outputs, tone/style adaptability, quality criteria, and any sensible guardrails.
- Stay generic: do not invent private data, names, brands, credentials, or metrics unless provided.
- Avoid placeholders like [COMPANY] or <TOOL>; prefer neutral phrases (e.g., "across relevant platforms").
- No lists, section headers, bullets, markdown, quotes, or extraneous commentary.

Return ONLY the expanded paragraph.`;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const model = new ChatOpenAI({
      model: "gpt-5-nano",
      maxRetries: 2,
      timeout: 30000,
    });

    const userMessage = `User Description: ${prompt}`;

    const response = await Promise.race([
      model.invoke([
        { role: "system", content: enhancerSystemPrompt },
        { role: "user", content: userMessage },
      ]),
      createTimeoutPromise(30000),
    ]);

    const enhanced = (response.content as string).trim();
    return NextResponse.json({ enhancedPrompt: enhanced });
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("timed out") ? 408 : 500;
    return NextResponse.json({ error: "Failed to enhance prompt" }, { status });
  }
}



