// lib/langchain/session.ts
import { v4 as uuidv4 } from "uuid";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { ChatConfig } from "./types";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

export class ChatSession {
  private app: RunnableWithMessageHistory<BaseMessage[], BaseMessage>;
  private config: ChatConfig;

  constructor(
    app: RunnableWithMessageHistory<BaseMessage[], BaseMessage>,
    threadId?: string
  ) {
    this.app = app;
    this.config = {
      configurable: {
        thread_id: threadId || uuidv4(),
      },
    };
  }

  async sendMessage(message: string) {
    const messages = [new HumanMessage(message)];

    // Get the response stream from the model
    const stream = await this.app.stream(messages, this.config);

    // Create a TransformStream to handle the chunks
    const encoder = new TextEncoder();
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          // Get the assistant's message from the state
          const text = chunk?.content || "";

          if (text.trim()) {
            // Format as SSE and forward
            const data = `data: ${JSON.stringify({ content: text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        } catch (error) {
          console.error("Error in transform stream:", error);
        }
      },
    });

    // Pipe the model stream through our transform
    const responseStream = stream.pipeThrough(transformStream);

    return {
      responseStream,
      threadId: this.config.configurable.thread_id,
    };
  }

  getThreadId() {
    return this.config.configurable.thread_id;
  }
}
