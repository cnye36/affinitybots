import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

const enhancerSystemPrompt = `
You are an expert AI prompt engineer. Given a short, informal description of an agent a user wants to build, rewrite it as a robust, production-grade SYSTEM PROMPT that will drive an AI agent.

Follow these best practices:
- Define a clear role and domain
- Specify core tasks and objectives
- Include relevant context placeholders the runtime can fill (but don't invent data)
- Set explicit constraints and guardrails (privacy, accuracy, safety)
- Use clear, sectioned formatting
- Provide response style guidance with tone and structure
- Encourage explicit tool use when available, but remain tool-agnostic
- Add escalation/deferral rules when outside scope

Return ONLY the enhanced system prompt text. Do not include commentary or markdown fences.`;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const model = new ChatOpenAI({
      model: "gpt-5-mini-2025-08-07",
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



