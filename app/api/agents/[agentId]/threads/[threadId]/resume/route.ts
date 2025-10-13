import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { rateLimiter } from "@/lib/rateLimiting";

export const runtime = "nodejs";

export async function POST(
	request: NextRequest,
	props: { params: Promise<{ agentId: string; threadId: string }> }
) {
	try {
		const { agentId, threadId } = await props.params;
		const supabase = await createClient();

		// Get the current user
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verify user has access to this agent
		const { data: userAssistant, error: userAssistantError } = await supabase
			.from("user_assistants")
			.select("assistant_id")
			.eq("user_id", user.id)
			.eq("assistant_id", agentId)
			.single();

		if (userAssistantError || !userAssistant) {
			return NextResponse.json(
				{ error: "Agent not found or access denied" },
				{ status: 404 }
			);
		}

		const { resume } = await request.json();

		if (!resume) {
			return NextResponse.json(
				{ error: "resume parameter is required" },
				{ status: 400 }
			);
		}

		// Create LangGraph client
		const client = new Client({
			apiUrl: process.env.LANGGRAPH_API_URL!,
			apiKey: process.env.LANGSMITH_API_KEY!,
		});

		// Resume the interrupted run by streaming
		// Use "messages" mode for token-by-token streaming with messages/partial events
		const runStream = await client.runs.stream(
			threadId,
			agentId,
			{
				command: { resume },
				metadata: {
					user_id: user.id,
					assistant_id: agentId,
					thread_id: threadId,
				},
				config: {
					configurable: {
						user_id: user.id,
						assistant_id: agentId,
						thread_id: threadId,
					},
				},
				interruptBefore: ["tools"],
				streamMode: ["messages"],
			}
		);

		// Track usage
		let inputTokensFromStream = 0;
		let outputTokensFromStream = 0;
		let sawUsageMetadata = false;
		let outputCharsEstimate = 0;

		// Convert AsyncIterable to SSE
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of runStream as any) {
						const eventName = typeof chunk?.event === "string" ? chunk.event : "";
						const data = chunk?.data ?? chunk;

						if (eventName) controller.enqueue(encoder.encode(`event: ${eventName}\n`));
						controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

						// Track usage
						if (eventName === "messages/complete") {
							if (Array.isArray(data) && data.length > 0) {
								const message = data[0];
								const usage = message?.response_metadata?.usage || message?.usage_metadata || null;

								if (usage) {
									const inTok = usage.prompt_tokens ?? usage.input_tokens ?? 0;
									const outTok = usage.completion_tokens ?? usage.output_tokens ?? 0;

									if (Number.isFinite(inTok) && Number.isFinite(outTok)) {
										inputTokensFromStream = Math.max(inputTokensFromStream, Number(inTok));
										outputTokensFromStream = Math.max(outputTokensFromStream, Number(outTok));
										sawUsageMetadata = true;
									}
								}
							}
						}

						if (/messages\/(delta|partial|token)/i.test(eventName)) {
							const deltaText =
								typeof (data?.delta as unknown) === "string"
									? (data.delta as string)
									: typeof (data?.token as unknown) === "string"
										? (data.token as string)
										: typeof (data?.text as unknown) === "string"
											? (data.text as string)
											: "";
							outputCharsEstimate += deltaText.length;
						}
					}

					// Record usage
					try {
						const outputTokens = sawUsageMetadata ? outputTokensFromStream : Math.ceil(outputCharsEstimate / 4);
						if (user?.id && outputTokens > 0) {
							await rateLimiter.recordUsage({
								userId: user.id,
								inputTokens: 0, // No new input on resume
								outputTokens,
								timestamp: Date.now(),
								model: "gpt-5",
								sessionId: threadId,
							});
						}
					} catch (e) {
						console.error("Failed to record usage after resume:", e);
					}

					// Emit rate limit event
					try {
						controller.enqueue(encoder.encode(`event: rate-limit\ndata: ${JSON.stringify({ type: "updated" })}\n\n`));
					} catch { }

					controller.close();
				} catch (error) {
					console.error("Error in resume stream:", error);
					controller.error(error);
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream; charset=utf-8",
				"Cache-Control": "no-cache, no-transform",
				"Connection": "keep-alive",
				"X-Accel-Buffering": "no",
			},
		});
	} catch (error) {
		console.error("Error resuming chat:", error);
		return NextResponse.json(
			{ error: "Failed to resume chat" },
			{ status: 500 }
		);
	}
}
