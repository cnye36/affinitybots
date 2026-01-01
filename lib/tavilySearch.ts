import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

/**
 * Built-in web search tool using Tavily API
 * Provides real-time web search results to agents
 */
export function createWebSearchTool(): DynamicStructuredTool<any, any, any, string> {
	const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

	return new DynamicStructuredTool({
		name: "web_search",
		description: `Search the web for current information, news, or real-time data.

IMPORTANT: Today's date is ${currentDate}. When searching for current events, news, or time-sensitive information, include the year ${new Date().getFullYear()} in your query to get the most recent results.

This tool performs web searches and returns relevant, up-to-date results from the internet.
Use this tool when you need:
- Current information (news, weather, stock prices, events)
- Real-time data not in your knowledge base
- Recent developments or updates on a topic
- Facts that may have changed since your training data

The tool returns search results formatted as markdown with sources.`,

		schema: z.object({
			query: z.string().describe("The search query. Be specific and use relevant keywords. For current events, include the year to get recent results."),
			maxResults: z.number().optional().default(5).describe("Maximum number of results to return (1-10). Default is 5."),
			daysBack: z.number().optional().default(30).describe("Limit results to content published within the last N days. Default is 30 days. Use 7 for very recent news, 365 for broader search."),
		}),

		func: async ({ query, maxResults = 5, daysBack = 30 }) => {
			const startTime = Date.now();
			console.log("\n" + "=".repeat(80));
			console.log("🔍 WEB SEARCH TOOL INVOKED");
			console.log("=".repeat(80));
			console.log("Timestamp:", new Date().toISOString());
			console.log("Query:", query);
			console.log("Max Results:", maxResults);
			console.log("Days Back:", daysBack);
			console.log("Current Date:", currentDate);

			try {
				if (!process.env.TAVILY_API_KEY) {
					console.error("❌ TAVILY_API_KEY not configured!");
					throw new Error("TAVILY_API_KEY is not configured. Web search is not available.")
				}

				const requestPayload = {
					api_key: process.env.TAVILY_API_KEY,
					query,
					max_results: Math.min(Math.max(maxResults, 1), 10),
					search_depth: "advanced", // Use advanced for better quality
					include_answer: true,
					include_images: false,
					days: daysBack, // Limit to recent results
				};

				console.log("📤 Tavily API Request:", {
					url: "https://api.tavily.com/search",
					payload: { ...requestPayload, api_key: "***REDACTED***" },
				});

				// Call Tavily API
				const response = await fetch("https://api.tavily.com/search", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestPayload),
				})

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}))
					console.error("❌ Tavily API Error:");
					console.error("Status:", response.status, response.statusText);
					console.error("Error Data:", errorData);
					throw new Error(
						`Tavily API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
					)
				}

				const data = await response.json()
				const elapsedTime = Date.now() - startTime;

				console.log("📥 Tavily API Response:");
				console.log("Results Count:", data.results?.length || 0);
				console.log("Has Answer:", !!data.answer);
				console.log("Raw Response:", JSON.stringify(data, null, 2));

				// Format results as markdown
				let formattedResults = ""

				if (data.answer) {
					formattedResults += `**Summary:** ${data.answer}\n\n`
				}

				if (data.results && data.results.length > 0) {
					formattedResults += `**Sources** (as of ${currentDate}):\n\n`
					data.results.forEach((result: any, index: number) => {
						console.log(`\n📄 Result ${index + 1}:`, {
							title: result.title,
							url: result.url,
							published_date: result.published_date || "N/A",
							score: result.score || "N/A",
						});

						formattedResults += `${index + 1}. **[${result.title}](${result.url})**`
						if (result.published_date) {
							formattedResults += ` _(Published: ${result.published_date})_`
						}
						formattedResults += `\n`
						if (result.content) {
							formattedResults += `   ${result.content}\n`
						}
						formattedResults += `\n`
					})
				} else {
					formattedResults = "No results found for your query."
				}

				console.log("✅ WEB SEARCH COMPLETED");
				console.log("Results:", data.results?.length || 0);
				console.log("Elapsed Time:", elapsedTime, "ms");
				console.log("=".repeat(80) + "\n");

				return formattedResults
			} catch (error) {
				const elapsedTime = Date.now() - startTime;
				const errorMessage = error instanceof Error ? error.message : String(error)
				console.error("❌ WEB SEARCH FAILED");
				console.error("Error Message:", errorMessage);
				console.error("Error Object:", error);
				console.error("Elapsed Time:", elapsedTime, "ms");
				console.error("=".repeat(80) + "\n");
				return `Failed to perform web search: ${errorMessage}. Please try again with a different query or check if the web search service is available.`
			}
		},
	})
}
