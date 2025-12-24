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

Instructions:
To delegate work to an agent, respond with JSON only:
{
  "agent": "agent_name",
  "instruction": "what you want them to do"
}

To signal completion, respond with JSON only:
{
  "complete": true,
  "final_result": "summary of work completed"
}

IMPORTANT: Respond with ONLY valid JSON. No additional text before or after.`;

  try {
    // Initialize model
    const model = await initChatModel(managerConfig.model, {
      temperature: managerConfig.temperature ?? 0.3,
      streaming: false,
    });

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

    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        decision = JSON.parse(content);
      }
    } catch (parseError) {
      console.warn("Manager did not return valid JSON, treating as completion:", content);
      return {
        messages: [new AIMessage(content)],
        is_complete: true,
        next_agent: null,
      };
    }

    // Handle completion signal
    if (decision.complete) {
      console.log("Manager signaled completion");
      return {
        messages: [new AIMessage(decision.final_result || "Task completed")],
        is_complete: true,
        next_agent: null,
      };
    }

    // Handle agent delegation
    if (decision.agent) {
      console.log(`Manager delegating to: ${decision.agent}`);
      return {
        messages: [response],
        next_agent: decision.agent,
        iteration: 1,
      };
    }

    // Fallback: no clear decision
    console.warn("Manager decision unclear, ending workflow");
    return {
      messages: [response],
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

    // Create or reuse thread for this sub-agent
    const threadId = agent.thread_id || (await client.threads.create()).thread_id;

    // Invoke the sub-agent using the existing reactAgent graph
    const runStream = await client.runs.stream(threadId, agent.assistant_id, {
      input: { messages: [{ role: "user", content: instruction }] },
      streamMode: "updates" as any,
      config: {
        configurable: agent.config || {},
      },
    });

    // Collect output from stream
    let finalEvent: any = null;
    for await (const evt of runStream) {
      if (evt.event === "updates" && evt.data) {
        finalEvent = evt;
      }
    }

    // Extract result
    const resultData = finalEvent?.data ?? "No response";
    const resultContent = typeof resultData === "string"
      ? resultData
      : JSON.stringify(resultData);

    const resultMessage = new AIMessage({
      content: `[${agent.name}]: ${resultContent}`,
      name: agent.name,
    });

    console.log(`Sub-agent ${agent.name} completed`);

    // Update agent state with thread ID for reuse
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
  const maxIterations = 10; // TODO: Make this configurable via orchestrator_config.execution.max_iterations

  // Check if manager signaled completion
  if (state.is_complete) {
    console.log("Orchestration complete (manager signaled)");
    return "__end__";
  }

  // Check if max iterations reached
  if (state.iteration >= maxIterations) {
    console.warn(`Orchestration reached max iterations (${maxIterations})`);
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
