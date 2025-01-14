import { ChatOpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ChatMessageHistory } from "langchain/memory";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { AgentConfig } from "@/types/agent";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function createChatChain(
  agent: AgentConfig,
  messages: Message[] = []
) {
  // Initialize the chat model
  const model = new ChatOpenAI({
    modelName: agent.model_type || "gpt-4o",
    temperature: agent.config?.temperature || 0.7,
    maxTokens: agent.config?.max_tokens,
    streaming: true,
  });

  // Convert messages to Langchain format
  const history = messages.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );

  // Create memory with existing messages
  const memory = new BufferMemory({
    chatHistory: new ChatMessageHistory(history),
    returnMessages: true,
    memoryKey: "chat_history",
  });

  // Create the prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", agent.prompt_template || "You are a helpful AI assistant."],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);

  // Create the chain
  const chain = RunnableSequence.from([
    {
      input: (input: { input: string }) => input.input,
      chat_history: async () => {
        const memoryResult = await memory.loadMemoryVariables({});
        return memoryResult.chat_history ?? [];
      },
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);

  return {
    chain,
    memory,
  };
}

export async function streamChat(
  chain: RunnableSequence,
  memory: BufferMemory,
  input: string
) {
  try {
    // Stream the response
    const stream = await chain.stream({
      input,
    });

    // Create a new stream for collecting chunks
    const chunks: string[] = [];
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        chunks.push(chunk);
        controller.enqueue(chunk);
      },
      async flush() {
        // Save the complete response to memory
        const response = chunks.join("");
        await memory.saveContext({ input }, { output: response });
      },
    });

    // Pipe the stream through our transform
    const readableStream = stream.pipeThrough(transformStream);

    return {
      stream: readableStream,
      getResponse: () => chunks.join(""),
    };
  } catch (error) {
    console.error("Error in streamChat:", error);
    throw error;
  }
}
