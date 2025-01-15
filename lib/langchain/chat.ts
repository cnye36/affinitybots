// lib/langchain/chat.ts
import { ChatOpenAI } from "@langchain/openai";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import { AgentConfig } from "@/types/agent";
import { ChatState } from "./types";
import {
  HumanMessage,
  BaseMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { initializeTools } from "../tools";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AVAILABLE_TOOLS } from "../tools/config";

// Tools that require user approval before execution
const TOOLS_REQUIRING_APPROVAL = ["code_interpreter", "web_search"];

export async function createChatGraph(agent: AgentConfig, threadId: string) {
  console.log("[createChatGraph] Creating chat graph for thread:", threadId);

  // Create the chat model with streaming
  const model = new ChatOpenAI({
    modelName: agent.model_type,
    temperature: agent.config?.temperature || 0.7,
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          console.log("[LLM Token]", token);
          return Promise.resolve();
        },
        handleLLMEnd(output) {
          console.log("[LLM End]", output);
          return Promise.resolve();
        },
        handleLLMError(error) {
          console.error("[LLM Error]", error);
          return Promise.resolve();
        },
      },
    ],
  });

  // Initialize tools
  const tools = await initializeTools(agent.tools || []);

  // Create the agent prompt with explicit tool usage instructions
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", agent.prompt_template || "You are a helpful AI assistant."],
    [
      "system",
      `You have access to the following tools:
${tools
  .map(
    (tool) =>
      `- ${tool.name}: ${
        AVAILABLE_TOOLS.find((t) => t.id === tool.name.toLowerCase())
          ?.description || tool.description
      }`
  )
  .join("\n")}

When using tools:
1. Always try to use tools when relevant instead of using your own knowledge
2. Some tools require user approval before execution
3. You can only use one tool at a time
4. Wait for tool execution to complete before proceeding`,
    ],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // Create the agent
  const agentInstance = await createOpenAIFunctionsAgent({
    llm: model,
    tools,
    prompt,
  });

  // Create the agent executor
  const agentExecutor = new AgentExecutor({
    agent: agentInstance,
    tools,
  });

  // Define the function that calls the model
  const callModel = async (state: ChatState) => {
    console.log("[callModel] Input state:", state);
    const messages = state.messages || [];
    console.log("[callModel] Processing messages:", messages);

    try {
      // Get the last message
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) {
        throw new Error("No messages in state");
      }

      // Check if we have any pending tool usage that needs approval
      const pendingTool = state.toolUsage?.find(
        (tool) => tool.status === "pending"
      );
      if (pendingTool) {
        console.log("[callModel] Found pending tool:", pendingTool);
        // Add a system message asking for approval
        const approvalMessage = new SystemMessage(
          `The agent wants to use the ${pendingTool.toolId} tool with input: ${pendingTool.input}\n\nDo you approve? Reply with 'approve' or 'reject'.`
        );
        return {
          messages: [...messages, approvalMessage],
          metadata: { ...state.metadata },
          toolUsage: state.toolUsage,
        };
      }

      // Execute the agent
      const result = await agentExecutor.invoke({
        input: lastMessage.content,
        chat_history: messages.slice(0, -1),
      });

      console.log("[callModel] Agent result:", result);

      // Check if a tool was used
      if (result.intermediateSteps?.length > 0) {
        const toolStep = result.intermediateSteps[0];
        const toolId = toolStep.action.tool.toLowerCase();
        const toolInput = toolStep.action.toolInput;
        const toolOutput = toolStep.observation;

        // Create tool usage record
        const toolUsage = {
          toolId,
          input: toolInput,
          output: toolOutput,
          status: TOOLS_REQUIRING_APPROVAL.includes(toolId)
            ? "pending"
            : "completed",
          requiresApproval: TOOLS_REQUIRING_APPROVAL.includes(toolId),
        };

        // If tool requires approval, add it to state
        if (toolUsage.requiresApproval) {
          return {
            messages: [
              ...messages,
              new SystemMessage(
                `The agent wants to use the ${toolId} tool with input: ${toolInput}\n\nDo you approve? Reply with 'approve' or 'reject'.`
              ),
            ],
            metadata: { ...state.metadata },
            toolUsage: [...(state.toolUsage || []), toolUsage],
          };
        }
      }

      // Create AI message from result
      const response = new AIMessage(result.output);
      console.log("[callModel] Model response:", response);

      const newState = {
        messages: [...messages, response],
        metadata: { ...state.metadata },
        toolUsage: state.toolUsage,
      };
      console.log("[callModel] New state:", newState);
      return newState;
    } catch (error) {
      console.error("[callModel] Error:", error);
      throw error;
    }
  };

  // Define a new graph
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

  console.log("[createChatGraph] Created workflow");

  // Add memory with thread ID
  const memory = new MemorySaver();
  const app = workflow.compile({
    checkpointer: memory,
  });

  console.log("[createChatGraph] Compiled workflow with memory");

  return {
    app,
    config: {
      configurable: {
        thread_id: threadId,
      },
    },
  };
}

export async function createInitialState(
  message: string,
  agentId: string,
  threadId: string,
  existingMessages: BaseMessage[] = []
): Promise<ChatState> {
  console.log("[createInitialState] Creating state with:", {
    message,
    agentId,
    threadId,
    existingMessagesCount: existingMessages.length,
  });

  // If there are existing messages, add them to the state
  const messages = [...existingMessages, new HumanMessage(message)];
  console.log("[createInitialState] Final messages:", messages);

  return {
    messages,
    metadata: {
      agentId,
      threadId,
    },
  };
}
