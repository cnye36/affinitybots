/**
 * Orchestrator Agent Graph
 *
 * This graph implements a supervisor pattern where a manager agent coordinates
 * multiple sub-agents dynamically. The manager decides which agent to invoke
 * based on the task at hand, enabling adaptive multi-agent workflows.
 *
 * Graph Flow:
 * __start__ → manager → [execute_agent or __end__]
 *                          ↓
 *                       manager (loop back)
 */

import { initChatModel } from "langchain/chat_models/universal";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";
import {
  StateGraph,
  Annotation,
  LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { Client } from "@langchain/langgraph-sdk";
import { llmIdToModelId } from "@/lib/llm/catalog";

// Define orchestrator state
const OrchestratorState = Annotation.Root({
  // Conversation history between manager and sub-agents
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => current.concat(update),
    default: () => [],
  }),

  // Which agent to invoke next (decided by manager)
  next_agent: Annotation<string | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // Whether the manager has signaled completion
  is_complete: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),

  // Iteration counter to prevent infinite loops
  iteration: Annotation<number>({
    reducer: (current, update) => current + update,
    default: () => 0,
  }),

  // Max iterations allowed (from orchestrator_config.execution.max_iterations)
  max_iterations: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 10,
  }),

  // Available sub-agents (from orchestrator_config)
  available_agents: Annotation<Record<string, any>>({
    reducer: (_, update) => update,
    default: () => ({}),
  }),
});

/**
 * Manager Node: Analyzes state and decides which sub-agent to invoke
 */
async function callManager(
  state: typeof OrchestratorState.State,
  config: LangGraphRunnableConfig
) {
  const configurable = config.configurable as any;
  const managerConfig = configurable?.orchestrator_config?.manager;

  if (!managerConfig) {
    console.error("No orchestrator_config.manager found in config");
    return {
      messages: [new AIMessage("Error: Orchestrator configuration missing")],
      is_complete: true,
      next_agent: null,
    };
  }

  // Build list of available agents for the manager
  const agentsList = Object.entries(state.available_agents)
    .map(([id, agent]: [string, any]) =>
      `- ${agent.name}: ${agent.description || "No description"}`
    )
    .join("\n");

  const systemPrompt = `${managerConfig.system_prompt}

Available Agents:
${agentsList}

CRITICAL: You must respond with ONLY valid JSON. No markdown, no explanations, no additional text.

To delegate work to ONE agent, respond with JSON only:
{
  "agent": "agent_name",
  "instruction": "what you want them to do"
}

IMPORTANT: 
- Delegate to ONE agent at a time (not a list/plan of multiple agents)
- Use the exact agent name from the list above
- After the agent completes, you will see their output and can then delegate to the next agent

To signal completion (when all work is done), respond with JSON only:
{
  "complete": true,
  "final_result": "summary of work completed"
}

Remember: Respond with ONLY the JSON object, nothing else.`;

  try {
    // Normalize model format - handle both legacy (model name only) and new (provider:model) formats
    const modelId = managerConfig.model || "";
    
    // Extract model name (without provider prefix) for GPT-5 detection
    const modelName = llmIdToModelId(modelId);
    
    // Determine if model is GPT-5 (reasoning model that uses reasoningEffort instead of temperature)
    const isGpt5 = /^gpt-5(?![a-zA-Z0-9-])/.test(modelName);
    
    // Build params conditionally: GPT-5 rejects temperature and expects reasoningEffort
    const modelParams: Record<string, any> = {
      streaming: false,
    };
    
    if (isGpt5) {
      modelParams.reasoningEffort = managerConfig.reasoningEffort ?? "medium";
    } else {
      modelParams.temperature = (typeof managerConfig.temperature === 'number' ? managerConfig.temperature : 0.3);
      // Some models support both, so include reasoningEffort if provided
      if (managerConfig.reasoningEffort) {
        modelParams.reasoningEffort = managerConfig.reasoningEffort;
      }
    }
    
    // Initialize model - initChatModel handles both "gpt-5" and "openai:gpt-5" formats
    const model = await initChatModel(modelId, modelParams);

    // Build conversation history
    const conversationMessages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(managerConfig.user_prompt),
      ...state.messages,
    ];

    // Invoke manager
    console.log(`Manager (${managerConfig.model}): Analyzing task and deciding next action...`);
    const response = await model.invoke(conversationMessages);

    // Parse manager's decision
    let decision;
    const content = typeof response.content === "string" ? response.content : String(response.content);
    
    console.log(`[Manager] Raw response content (first 500 chars):`, content.substring(0, 500));

    try {
      // Try to extract JSON from the response (in case there's extra text like markdown code blocks)
      // First try to find JSON in code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        decision = JSON.parse(codeBlockMatch[1]);
      } else {
        // Try to find JSON object directly
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          decision = JSON.parse(jsonMatch[0]);
        } else {
          decision = JSON.parse(content);
        }
      }
      
      console.log(`[Manager] Parsed decision:`, JSON.stringify(decision, null, 2));
    } catch (parseError) {
      console.error("[Manager] Failed to parse JSON response:", parseError);
      console.warn("[Manager] Raw content:", content);
      return {
        messages: [new AIMessage(`Error: Manager did not return valid JSON. Response: ${content.substring(0, 200)}`)],
        is_complete: true,
        next_agent: null,
      };
    }

    // Handle completion signal
    if (decision.complete === true) {
      console.log("[Manager] Signaled completion");
      return {
        messages: [new AIMessage(decision.final_result || "Task completed")],
        is_complete: true,
        next_agent: null,
      };
    }

    // Handle agent delegation - check for agent field (required for delegation)
    if (decision.agent && typeof decision.agent === "string") {
      console.log(`[Manager] Delegating to agent: ${decision.agent}`);
      console.log(`[Manager] Instruction: ${decision.instruction || "No instruction provided"}`);
      
      // Validate that the agent exists in available agents
      if (!state.available_agents[decision.agent]) {
        const availableAgentNames = Object.keys(state.available_agents);
        console.error(`[Manager] Agent "${decision.agent}" not found. Available agents:`, availableAgentNames);
        return {
          messages: [new AIMessage(`Error: Agent "${decision.agent}" not found. Available agents: ${availableAgentNames.join(", ")}`)],
          is_complete: true,
          next_agent: null,
        };
      }
      
      return {
        messages: [response],
        next_agent: decision.agent,
        iteration: 1,
      };
    }

    // Fallback: no clear decision - log what we received for debugging
    console.error("[Manager] Decision unclear - missing required fields");
    console.error("[Manager] Decision keys:", Object.keys(decision));
    console.error("[Manager] Full decision:", JSON.stringify(decision, null, 2));
    console.error("[Manager] Available agents:", Object.keys(state.available_agents));
    
    return {
      messages: [new AIMessage(`Error: Manager decision unclear. Expected {"agent": "agent_name", "instruction": "..."} or {"complete": true, "final_result": "..."}. Got: ${JSON.stringify(decision)}`)],
      is_complete: true,
      next_agent: null,
    };
  } catch (error) {
    console.error("Error in callManager:", error);
    return {
      messages: [new AIMessage(`Manager error: ${error instanceof Error ? error.message : String(error)}`)],
      is_complete: true,
      next_agent: null,
    };
  }
}

/**
 * Execute Sub-Agent Node: Invokes the selected sub-agent
 */
async function executeSubAgent(
  state: typeof OrchestratorState.State,
  config: LangGraphRunnableConfig
) {
  const agentToInvoke = state.next_agent;

  if (!agentToInvoke || !state.available_agents[agentToInvoke]) {
    console.error(`Unknown agent requested: ${agentToInvoke}`);
    return {
      messages: [new AIMessage(`Error: Agent "${agentToInvoke}" not found`)],
      next_agent: null,
    };
  }

  const agent = state.available_agents[agentToInvoke];
  const lastMessage = state.messages[state.messages.length - 1];

  // Extract instruction from manager's decision
  let instruction = "Complete your assigned task";
  try {
    const content = typeof lastMessage.content === "string" ? lastMessage.content : String(lastMessage.content);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const decision = JSON.parse(jsonMatch[0]);
      instruction = decision.instruction || instruction;
    }
  } catch {
    // If we can't parse instruction, use the default
  }

  console.log(`Executing sub-agent: ${agent.name}`);
  console.log(`Instruction: ${instruction}`);

  try {
    // Initialize LangGraph SDK client
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL || "http://localhost:8123",
      apiKey: process.env.LANGSMITH_API_KEY,
    });

    // Create or reuse thread for this sub-agent to maintain context
    let threadId = agent.thread_id;
    if (!threadId) {
      const newThread = await client.threads.create();
      threadId = newThread.thread_id;
      console.log(`Created new thread ${threadId} for sub-agent: ${agent.name}`);
    } else {
      console.log(`Reusing thread ${threadId} for sub-agent: ${agent.name}`);
    }

    // Invoke the sub-agent using the existing reactAgent graph
    const runStream = await client.runs.stream(threadId, agent.assistant_id, {
      input: { messages: [{ role: "user", content: instruction }] },
      streamMode: "updates" as any,
      config: {
        configurable: {
          ...agent.config,
          user_id: config.configurable?.user_id,
        },
      },
    });

    // Collect output from stream with timeout protection
    let finalEvent: any = null;
    let eventCount = 0;
    const startTime = Date.now();
    const timeout = 300000; // 5 minutes timeout

    for await (const evt of runStream) {
      eventCount++;

      // Check timeout
      if (Date.now() - startTime > timeout) {
        console.warn(`Sub-agent ${agent.name} execution timed out after ${timeout}ms`);
        throw new Error(`Sub-agent execution timed out`);
      }

      if (evt.event === "updates" && evt.data) {
        finalEvent = evt;
      }
    }

    console.log(`Sub-agent ${agent.name} processed ${eventCount} events`);

    // Extract result with better error handling
    if (!finalEvent?.data) {
      console.warn(`Sub-agent ${agent.name} returned no data`);
      return {
        messages: [
          new AIMessage({
            content: `[${agent.name}]: Execution completed but no result was returned`,
            name: agent.name,
          }),
        ],
        available_agents: {
          ...state.available_agents,
          [agentToInvoke]: { ...agent, thread_id: threadId },
        },
        next_agent: null,
      };
    }

    const resultData = finalEvent.data;
    const resultContent = typeof resultData === "string"
      ? resultData
      : JSON.stringify(resultData);

    const resultMessage = new AIMessage({
      content: `[${agent.name}]: ${resultContent}`,
      name: agent.name,
    });

    console.log(`Sub-agent ${agent.name} completed successfully`);

    // Update agent state with thread ID for context continuity
    const updatedAgent = { ...agent, thread_id: threadId };

    return {
      messages: [resultMessage],
      available_agents: {
        ...state.available_agents,
        [agentToInvoke]: updatedAgent,
      },
      next_agent: null, // Clear next_agent after execution
    };
  } catch (error) {
    console.error(`Error executing sub-agent ${agent.name}:`, error);
    return {
      messages: [
        new AIMessage(
          `[${agent.name}] Error: ${error instanceof Error ? error.message : String(error)}`
        ),
      ],
      next_agent: null,
    };
  }
}

/**
 * Routing Logic: Determine whether to continue orchestration or end
 */
function shouldContinueOrchestration(state: typeof OrchestratorState.State) {
  // Check if manager signaled completion
  if (state.is_complete) {
    console.log("Orchestration complete (manager signaled)");
    return "__end__";
  }

  // Check if max iterations reached
  if (state.iteration >= state.max_iterations) {
    console.warn(`Orchestration reached max iterations (${state.max_iterations})`);
    return "__end__";
  }

  // Check if there's an agent to execute
  if (state.next_agent) {
    console.log(`Routing to execute_agent (${state.next_agent})`);
    return "execute_agent";
  }

  // No clear path forward, end
  console.log("Orchestration complete (no next action)");
  return "__end__";
}

/**
 * Build and compile the orchestrator graph
 */
const workflow = new StateGraph(OrchestratorState)
  .addNode("manager", callManager)
  .addNode("execute_agent", executeSubAgent)
  .addConditionalEdges(
    "manager",
    shouldContinueOrchestration,
    {
      execute_agent: "execute_agent",
      __end__: "__end__",
    }
  )
  .addEdge("execute_agent", "manager")
  .addEdge("__start__", "manager");

export const orchestratorGraph = workflow.compile();
