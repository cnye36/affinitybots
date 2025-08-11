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

      return sendMessage({
        threadId: threadIdRef.current!,
        messages,
        assistantId,
      });
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread(assistantId);
      threadIdRef.current = thread_id;
      return { externalId: thread_id } as any;
    },
    onSwitchToThread: async (externalId: string) => {
      threadIdRef.current = externalId;
      const state = await getThreadState(externalId);
      return {
        messages: state.values?.messages || [],
        interrupts: state.tasks?.[0]?.interrupts || [],
      };
    },
  });

  return runtime;
};