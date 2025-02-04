import { create } from "zustand";
import { Thread } from "@langchain/langgraph-sdk";
import { Message } from "@/types";

interface ThreadStore {
  threads: Thread[];
  activeThreadId: string | null;
  messages: Record<string, Message[]>;
  titles: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  setThreads: (threads: Thread[]) => void;
  setActiveThread: (threadId: string | null) => void;
  setMessages: (threadId: string, messages: Message[]) => void;
  setTitle: (threadId: string, title: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useThreadStore = create<ThreadStore>((set) => ({
  threads: [],
  activeThreadId: null,
  messages: {},
  titles: {},
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
  setTitle: (threadId, title) =>
    set((state) => ({
      titles: {
        ...state.titles,
        [threadId]: title,
      },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
