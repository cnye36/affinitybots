import express from "express"
import { spawn } from "child_process"

const app = express()
const PORT = process.env.PORT || 3099
const MCP_COMMAND = process.env.MCP_COMMAND || "npx"
const MCP_ARGS = (process.env.MCP_ARGS || "").split(" ").filter(Boolean)
const SERVER_NAME = process.env.SERVER_NAME || "generic-mcp"

app.use(express.json())

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		status: "healthy",
		server: SERVER_NAME,
		command: MCP_COMMAND,
		args: MCP_ARGS,
	})
})

// Main MCP endpoint - translates HTTP to stdio
app.all("/mcp", async (req, res) => {
	try {
		console.log(`[${SERVER_NAME}] Received request:`, req.method, req.body)

		// Spawn the MCP server process
		const mcpProcess = spawn(MCP_COMMAND, MCP_ARGS, {
			stdio: ["pipe", "pipe", "pipe"],
		})

		let stdoutBuffer = ""
		let stderrBuffer = ""
		let processExited = false

		// Set up response as SSE stream
		res.setHeader("Content-Type", "text/event-stream")
		res.setHeader("Cache-Control", "no-cache")
		res.setHeader("Connection", "keep-alive")
		res.setHeader("Access-Control-Allow-Origin", "*")

		// Handle process output
		mcpProcess.stdout.on("data", (data) => {
			const output = data.toString()
			stdoutBuffer += output

			// Try to parse complete JSON-RPC messages
			const lines = stdoutBuffer.split("\n")
			stdoutBuffer = lines.pop() || "" // Keep incomplete line in buffer

			lines.forEach((line) => {
				if (line.trim()) {
					try {
						// Validate it's proper JSON
						JSON.parse(line)
						// Send as SSE event
						res.write(`data: ${line}\n\n`)
					} catch (e) {
						// Not valid JSON, might be partial
						stdoutBuffer = line + stdoutBuffer
					}
				}
			})
		})

		mcpProcess.stderr.on("data", (data) => {
			const error = data.toString()
			stderrBuffer += error
			console.error(`[${SERVER_NAME}] stderr:`, error)
		})

		mcpProcess.on("error", (error) => {
			console.error(`[${SERVER_NAME}] Process error:`, error)
			if (!processExited && !res.headersSent) {
				res.status(500).json({ error: error.message })
			}
		})

		mcpProcess.on("close", (code) => {
			processExited = true
			console.log(`[${SERVER_NAME}] Process exited with code ${code}`)

			// Send any remaining buffer
			if (stdoutBuffer.trim()) {
				try {
					JSON.parse(stdoutBuffer)
					res.write(`data: ${stdoutBuffer}\n\n`)
				} catch (e) {
					// Invalid JSON, skip it
				}
			}

			if (stderrBuffer && !res.headersSent) {
				res.write(
					`data: ${JSON.stringify({ error: stderrBuffer })}\n\n`,
				)
			}

			res.end()
		})

		// Handle client disconnect
		req.on("close", () => {
			console.log(`[${SERVER_NAME}] Client disconnected`)
			if (!processExited) {
				mcpProcess.kill()
			}
		})

		// Forward request to stdin
		if (req.body) {
			const jsonrpcRequest = {
				jsonrpc: "2.0",
				id: req.body.id || Date.now(),
				method: req.body.method || "initialize",
				params: req.body.params || {},
			}

			console.log(
				`[${SERVER_NAME}] Sending to stdin:`,
				jsonrpcRequest,
			)
			mcpProcess.stdin.write(JSON.stringify(jsonrpcRequest) + "\n")
		}
	} catch (error) {
		console.error(`[${SERVER_NAME}] Error:`, error)
		if (!res.headersSent) {
			res.status(500).json({ error: error.message })
		}
	}
})

// CORS preflight
app.options("*", (req, res) => {
	res.setHeader("Access-Control-Allow-Origin", "*")
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	res.setHeader("Access-Control-Allow-Headers", "Content-Type")
	res.sendStatus(200)
})

app.listen(PORT, () => {
	console.log(`
╔═══════════════════════════════════════════════════════╗
║  Generic MCP Stdio-to-HTTP Wrapper                   ║
║  Server: ${SERVER_NAME.padEnd(42)}║
║  Port: ${String(PORT).padEnd(44)}║
║  Command: ${MCP_COMMAND.padEnd(42)}║
║  Args: ${MCP_ARGS.join(" ").padEnd(45)}║
╚═══════════════════════════════════════════════════════╝

Health check: http://localhost:${PORT}/health
MCP endpoint:  http://localhost:${PORT}/mcp
	`)
})
