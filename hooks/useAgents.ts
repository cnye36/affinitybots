import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

type AssistantsResponse = {
  assistants: unknown[]
}

export function useAgents(options?: { enabled?: boolean }) {
  const shouldFetch = options?.enabled ?? true;
  const { data, error, mutate } = useSWR<AssistantsResponse>(
    shouldFetch ? '/api/assistants' : null,
    fetcher
  );

  return {
    assistants: data?.assistants ?? [],
    isLoading: shouldFetch ? (!error && !data) : false,
    isError: shouldFetch ? error : undefined,
    mutate,
  };
}


