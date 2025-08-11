"use client";

import { useRef } from "react";
import {
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import type { LangChainMessage } from "@assistant-ui/react-langgraph";

import { createThread, getThreadState, sendMessage } from "@/lib/chatApi";

export const useAppLangGraphRuntime = (assistantId: string) => {
  const threadIdRef = useRef<string | undefined>(undefined);

  // Custom lightweight image adapter to downscale/compress before sending to reduce payload size
  class CompressedImageAttachmentAdapter extends SimpleImageAttachmentAdapter {
    async send(attachment: any) {
      const file: File = attachment.file;
      const compressedDataUrl = await compressImageFile(file, 1600, 1600, 0.8);
      return {
        ...attachment,
        status: { type: "complete" as const },
        content: [
          {
            type: "image" as const,
            image: compressedDataUrl,
          },
        ],
      };
    }
  }

  async function compressImageFile(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number,
  ): Promise<string> {
    const imageBitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      maxWidth / imageBitmap.width,
      maxHeight / imageBitmap.height,
    );
    const targetWidth = Math.round(imageBitmap.width * scale);
    const targetHeight = Math.round(imageBitmap.height * scale);

    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context missing");
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    return dataUrl;
  }

  const hasAutoTitledRef = useRef<boolean>(false);

  function extractPlainTextFromMessages(messages: LangChainMessage[]): string {
    try {
      const firstUser = messages.find((m: any) => m?.role === "user" || m?.type === "human");
      if (!firstUser) return "";

      const content: any = (firstUser as any).content;
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        const textParts = content
          .filter((p: any) =>
            p && (
              (p.type === "text" && typeof p.text === "string") ||
              typeof p === "string"
            ),
          )
          .map((p: any) => (typeof p === "string" ? p : p.text))
          .filter(Boolean)
          .join("\n");
        return textParts || "";
      }
      if (content && typeof content === "object" && typeof content.text === "string") {
        return content.text;
      }
      return "";
    } catch {
      return "";
    }
  }

  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new CompressedImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
    stream: async (messages: LangChainMessage[]) => {
      // Ensure we have a thread; if not, create one with assistant metadata
      if (!threadIdRef.current) {
        const { thread_id } = await createThread(assistantId);
        threadIdRef.current = thread_id;
      }

      // Fire-and-forget: if this is the first outbound user message for this thread,
      // send ONLY the user's first message text to title generation.
      if (!hasAutoTitledRef.current) {
        hasAutoTitledRef.current = true;
        const firstUserText = extractPlainTextFromMessages(messages).slice(0, 160);
        if (!firstUserText) {
          // If we somehow didn't capture text, skip title generation to avoid garbage titles
          return sendMessage({
            threadId: threadIdRef.current!,
            messages,
            assistantId,
          });
        }
        // Best effort; do not block streaming.
        fetch(
          `/api/assistants/${assistantId}/threads/${threadIdRef.current}/rename`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversation: firstUserText }),
          },
        )
          .then(() => {
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("threads:refresh"));
              }, 400);
            }
          })
          .catch((err) => {
            console.error("Auto-title generation failed:", err);
          });
      }

      return sendMessage({
        threadId: threadIdRef.current!,
        messages,
        assistantId,
      });
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread(assistantId);
      threadIdRef.current = thread_id;
      hasAutoTitledRef.current = false;
      return { externalId: thread_id } as any;
    },
    onSwitchToThread: async (externalId: string) => {
      threadIdRef.current = externalId;
      hasAutoTitledRef.current = false;
      const state = await getThreadState(externalId);
      return {
        messages: state.values?.messages || [],
        interrupts: state.tasks?.[0]?.interrupts || [],
      };
    },
  });

  return runtime;
};