import axios from 'axios'

export const fetchWorkflows = async () => {
  const response = await axios.get('/api/workflows')
  return response.data
}

export const createWorkflow = async (workflowData: any) => {
  const response = await axios.post('/api/workflows', workflowData)
  return response.data
}

// Similarly, update and delete functions 