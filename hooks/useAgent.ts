import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useAgent(assistantId: string) {
  const { data, error, mutate } = useSWR(
    `/api/assistants/${assistantId}`,
    fetcher
  );

  return {
    assistant: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
