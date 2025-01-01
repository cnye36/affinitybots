import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useAgent(agentId: string) {
  const { data, error, mutate } = useSWR(`/api/agents/${agentId}`, fetcher)

  return {
    agent: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  }
}