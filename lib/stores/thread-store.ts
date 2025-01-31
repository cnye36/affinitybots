import { create } from "zustand";
import { Thread, Message } from "@langchain/langgraph-sdk";

interface ThreadStore {
  threads: Thread[];
  activeThreadId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
  setThreads: (threads: Thread[]) => void;
  setActiveThread: (threadId: string | null) => void;
  setMessages: (threadId: string, messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useThreadStore = create<ThreadStore>((set) => ({
  threads: [],
  activeThreadId: null,
  messages: {},
  isLoading: false,
  error: null,
  setThreads: (threads) => set({ threads }),
  setActiveThread: (threadId) => set({ activeThreadId: threadId }),
  setMessages: (threadId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [threadId]: messages,
      },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
