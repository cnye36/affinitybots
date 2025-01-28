import { NextResponse } from "next/server";
import { z } from "zod";

// Define the message schema
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  additional_kwargs: z.record(z.any()).optional(),
});

// Define the metadata schema
const MetadataSchema = z.object({
  assistantId: z.string(),
  threadId: z.string().optional(),
  userId: z.string().optional(),
});

// Define the input schema for the assistant
const InputSchema = z.object({
  messages: z.array(MessageSchema),
  metadata: MetadataSchema.optional(),
});

// Define the output schema for the assistant
const OutputSchema = z.object({
  messages: z.array(MessageSchema),
  metadata: MetadataSchema.optional(),
});

// GET handler to return the schemas
export async function GET() {
  return NextResponse.json({
    input: InputSchema,
    output: OutputSchema,
  });
}
