import useSWR from "swr"
import type { Assistant } from "@/types/assistant"

const fetcher = async (url: string): Promise<Assistant> => {
	const res = await fetch(url)
	if (!res.ok) {
		throw new Error(`Failed to fetch agent: ${res.status}`)
	}
	return (await res.json()) as Assistant
}

export function useAgent(
  assistantId?: string,
  options?: { enabled?: boolean; fallbackData?: Assistant }
) {
  const shouldFetch = (options?.enabled ?? true) && Boolean(assistantId);
  const { data, error, mutate } = useSWR(
    shouldFetch ? `/api/agents/${assistantId}` : null,
    fetcher,
		{
			fallbackData: options?.fallbackData,
			revalidateOnFocus: false,
		}
  );

  return {
    assistant: data,
    isLoading: shouldFetch ? (!error && !data) : false,
    isError: shouldFetch ? error : undefined,
    mutate,
  };
}
