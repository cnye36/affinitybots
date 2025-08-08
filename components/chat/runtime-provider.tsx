"use client";

import { useMemo } from "react";
import {
  AssistantRuntimeProvider,
  useCloudThreadListRuntime,
  useThreadListItemRuntime,
} from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import type { LangChainMessage } from "@assistant-ui/react-langgraph";

import { createThread, getThreadState, sendMessage } from "@/lib/chatApi";

export const useAppLangGraphRuntime = (assistantId: string) => {
  const threadListItemRuntime = useThreadListItemRuntime({ optional: true });

  const runtime = useLangGraphRuntime({
    stream: async (messages: LangChainMessage[]) => {
      let externalId: string | undefined = undefined;
      if (threadListItemRuntime) {
        const result = await threadListItemRuntime.initialize();
        externalId = result?.externalId as string | undefined;
      }

      // Fallback: if cloud item not initialized yet, create a new thread
      if (!externalId) {
        const { thread_id } = await createThread();
        externalId = thread_id;
      }

      return sendMessage({
        threadId: externalId,
        messages,
        assistantId,
      });
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread();
      return { externalId: thread_id } as any;
    },
    onSwitchToThread: async (externalId: string) => {
      const state = await getThreadState(externalId);
      return {
        messages: state.values?.messages || [],
        interrupts: state.tasks?.[0]?.interrupts || [],
      };
    },
  });

  return runtime;
};