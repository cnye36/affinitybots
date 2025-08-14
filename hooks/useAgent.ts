import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useAgent(
  assistantId?: string,
  options?: { enabled?: boolean }
) {
  const shouldFetch = (options?.enabled ?? true) && Boolean(assistantId);
  const { data, error, mutate } = useSWR(
    shouldFetch ? `/api/assistants/${assistantId}` : null,
    fetcher
  );

  return {
    assistant: data,
    isLoading: shouldFetch ? (!error && !data) : false,
    isError: shouldFetch ? error : undefined,
    mutate,
  };
}
