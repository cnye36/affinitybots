import { useCallback } from "react"
import dagre from "dagre"
import { Edge } from "reactflow"
import { WorkflowNode } from "@/types/workflow"

interface LayoutOptions {
  direction?: "TB" | "LR" | "BT" | "RL"
  nodeSpacing?: number
  rankSpacing?: number
  workflowType?: "sequential" | "orchestrator"
}

const DEFAULT_OPTIONS: Required<Omit<LayoutOptions, "workflowType">> = {
  direction: "LR", // Left to Right (changed from TB)
  nodeSpacing: 80, // Spacing between nodes in same rank
  rankSpacing: 200, // Spacing between ranks/levels
}

// Node dimensions based on type - updated for compact nodes
const getNodeDimensions = (node: WorkflowNode) => {
  switch (node.type) {
    case "orchestrator":
      return { width: 128, height: 128 }
    case "trigger":
      return { width: 240, height: 200 } // Compact size matching agents
    case "task":
      return { width: 200, height: 180 } // Compact size for task nodes
    default:
      return { width: 200, height: 180 }
  }
}

export function useAutoLayout() {
  const calculateLayout = useCallback(
    (nodes: WorkflowNode[], edges: Edge[], options: LayoutOptions = {}) => {
      const { direction, nodeSpacing, rankSpacing, workflowType } = { ...DEFAULT_OPTIONS, ...options }

      // Special layout for orchestrator workflows
      if (workflowType === "orchestrator") {
        return calculateOrchestratorLayout(nodes, edges, { nodeSpacing, rankSpacing })
      }

      // Standard dagre layout for sequential workflows
      const dagreGraph = new dagre.graphlib.Graph()
      dagreGraph.setDefaultEdgeLabel(() => ({}))

      // Set graph layout options
      dagreGraph.setGraph({
        rankdir: direction,
        nodesep: nodeSpacing,
        ranksep: rankSpacing,
        marginx: 50,
        marginy: 50,
      })

      // Add nodes to the graph
      nodes.forEach((node) => {
        const { width, height } = getNodeDimensions(node)
        dagreGraph.setNode(node.id, { width, height })
      })

      // Add edges to the graph
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
      })

      // Calculate the layout
      dagre.layout(dagreGraph)

      // Apply the calculated positions to nodes
      const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        const { width, height } = getNodeDimensions(node)

        // Dagre returns center position, we need top-left for ReactFlow
        const x = nodeWithPosition.x - width / 2
        const y = nodeWithPosition.y - height / 2

        return {
          ...node,
          position: { x, y },
        }
      })

      return layoutedNodes
    },
    []
  )

  return { calculateLayout }
}

// Custom layout for orchestrator workflows
// Trigger → Orchestrator (horizontal), then agents stack vertically below orchestrator
function calculateOrchestratorLayout(
  nodes: WorkflowNode[],
  edges: Edge[],
  options: { nodeSpacing: number; rankSpacing: number }
): WorkflowNode[] {
  const triggerNode = nodes.find((n) => n.type === "trigger")
  const orchestratorNode = nodes.find((n) => n.type === "orchestrator")
  const agentNodes = nodes.filter((n) => n.type === "task")

  if (!triggerNode || !orchestratorNode) {
    // Fallback to standard layout if structure is invalid
    return nodes
  }

  const startX = 100
  const startY = 100
  const horizontalSpacing = options.rankSpacing
  const verticalSpacing = options.nodeSpacing + 40

  const layoutedNodes: WorkflowNode[] = []

  // Position trigger
  const triggerDims = getNodeDimensions(triggerNode)
  layoutedNodes.push({
    ...triggerNode,
    position: { x: startX, y: startY },
  })

  // Position orchestrator to the right of trigger
  const orchestratorDims = getNodeDimensions(orchestratorNode)
  const orchestratorX = startX + triggerDims.width + horizontalSpacing
  const orchestratorY = startY + triggerDims.height / 2 - orchestratorDims.height / 2 // Center vertically with trigger
  layoutedNodes.push({
    ...orchestratorNode,
    position: { x: orchestratorX, y: orchestratorY },
  })

  // Position agents horizontally below orchestrator (branching/tree structure)
  const agentY = orchestratorY + orchestratorDims.height + 100 // All agents at same Y level below orchestrator
  const orchestratorCenterX = orchestratorX + orchestratorDims.width / 2
  
  // Calculate total width needed for all agents
  let totalAgentsWidth = 0
  agentNodes.forEach((agentNode) => {
    const agentDims = getNodeDimensions(agentNode)
    totalAgentsWidth += agentDims.width
  })
  // Add spacing between agents
  if (agentNodes.length > 1) {
    totalAgentsWidth += (agentNodes.length - 1) * options.nodeSpacing
  }
  
  // Start X position to center all agents under orchestrator
  let currentAgentX = orchestratorCenterX - totalAgentsWidth / 2
  
  agentNodes.forEach((agentNode) => {
    const agentDims = getNodeDimensions(agentNode)
    layoutedNodes.push({
      ...agentNode,
      position: { x: currentAgentX, y: agentY },
    })
    currentAgentX += agentDims.width + options.nodeSpacing
  })

  return layoutedNodes
}

// Utility to check if a node has been manually positioned
export function hasManualPosition(node: WorkflowNode): boolean {
  // Nodes with manual positions will have non-zero, non-calculated positions
  // This is a simple heuristic - you might want to track this with a flag
  return node.position?.x !== 0 || node.position?.y !== 0
}

// Utility to apply layout only to new nodes
export function useHybridLayout() {
  const { calculateLayout } = useAutoLayout()

  const applyHybridLayout = useCallback(
    (nodes: WorkflowNode[], edges: Edge[], newNodeIds: Set<string>) => {
      // Separate nodes into manual and new
      const manualNodes = nodes.filter((n) => !newNodeIds.has(n.id))
      const newNodes = nodes.filter((n) => newNodeIds.has(n.id))

      // Calculate layout for all nodes
      const layoutedNodes = calculateLayout(nodes, edges)

      // Apply layout only to new nodes, preserve manual positions
      return layoutedNodes.map((node) => {
        if (newNodeIds.has(node.id)) {
          return node // Use calculated position
        }
        // Restore original position for manually positioned nodes
        const originalNode = manualNodes.find((n) => n.id === node.id)
        return originalNode || node
      })
    },
    [calculateLayout]
  )

  return { applyHybridLayout }
}
