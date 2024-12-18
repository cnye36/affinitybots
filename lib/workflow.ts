import { StateGraph } from '@langchain/langgraph'
import { supabase } from '@/lib/supabaseClient'
import { Workflow, WorkflowNode, WorkflowEdge } from '@/types/workflow'

export async function convertToLangGraph(workflow: Workflow) {
  const graph = new StateGraph({
    channels: {
      state: {
        config: {
          default: {}
        }
      }
    }
  })

  // Update workflow status to 'Running'
  await supabase
    .from('workflows')
    .update({ status: 'Running', runs: workflow.runs || 0 })
    .eq('id', workflow.id)

  // Add nodes
  workflow.nodes.forEach((node) => {
    graph.addNode(node.id, async (state: Record<string, unknown>) => {
      console.log(`Executing node: ${node.data.label}`)
      return state
    })
  })

  // Add edges
  workflow.edges.forEach((edge) => {
    graph.addEdge(edge.source as "__start__", edge.target as "__start__")
  })

  const compiledGraph = graph.compile()

  try {
    await compiledGraph.invoke({ /* initial state */ })
    await supabase
      .from('workflows')
      .update({ status: 'Active' })
      .eq('id', workflow.id)
  } catch (err) {
    console.error('Workflow execution error:', err)
    await supabase
      .from('workflows')
      .update({ status: 'Inactive' })
      .eq('id', workflow.id)
  }
} 