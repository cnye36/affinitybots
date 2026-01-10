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
    case "output":
      return { width: 240, height: 180 } // Same dimensions as trigger/task nodes
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

      // Separate output nodes - they get special positioning
      const outputNodes = nodes.filter((n) => n.type === "output")
      const workflowNodes = nodes.filter((n) => n.type !== "output")

      // Standard dagre layout for sequential workflows (excluding output nodes)
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

      // Add workflow nodes to the graph (excluding output nodes)
      workflowNodes.forEach((node) => {
        const { width, height } = getNodeDimensions(node)
        dagreGraph.setNode(node.id, { width, height })
      })

      // Add edges to the graph (only edges between workflow nodes, exclude output nodes)
      const workflowNodeIds = new Set(workflowNodes.map((n) => n.id))
      const workflowEdges = edges.filter((e) => {
        // Only include edges where both source and target are workflow nodes (not output nodes)
        return workflowNodeIds.has(e.source) && workflowNodeIds.has(e.target)
      })
      workflowEdges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
      })

      // Calculate the layout
      dagre.layout(dagreGraph)

      // Apply the calculated positions to workflow nodes
      const layoutedNodes: WorkflowNode[] = workflowNodes.map((node) => {
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

      // Position output nodes to the right of the rightmost node with double spacing
      if (outputNodes.length > 0 && layoutedNodes.length > 0) {
        // Find the rightmost node
        let rightmostNode = layoutedNodes[0]
        let rightmostX = rightmostNode.position.x + getNodeDimensions(rightmostNode).width
        
        layoutedNodes.forEach((node) => {
          const nodeRightEdge = node.position.x + getNodeDimensions(node).width
          if (nodeRightEdge > rightmostX) {
            rightmostX = nodeRightEdge
            rightmostNode = node
          }
        })

        // Position output nodes to the right with double spacing (2 * rankSpacing)
        const doubleSpacing = rankSpacing * 2 // Double the normal spacing
        const rightmostY = rightmostNode.position.y

        outputNodes.forEach((outputNode) => {
          const outputDims = getNodeDimensions(outputNode)
          // Center vertically with the rightmost node
          const outputY = rightmostY + (getNodeDimensions(rightmostNode).height / 2) - (outputDims.height / 2)
          
          layoutedNodes.push({
            ...outputNode,
            position: { x: rightmostX + doubleSpacing, y: outputY },
          })
        })
      } else if (outputNodes.length > 0) {
        // If no workflow nodes, just position output nodes at default location
        outputNodes.forEach((outputNode) => {
          layoutedNodes.push({
            ...outputNode,
            position: { x: 250, y: 100 },
          })
        })
      }

      return layoutedNodes
    },
    []
  )

  return { calculateLayout }
}

// Custom layout for orchestrator workflows
// Trigger → Orchestrator (horizontal), then agents stack vertically below orchestrator
// Output node positioned to the right of orchestrator with double spacing
function calculateOrchestratorLayout(
  nodes: WorkflowNode[],
  edges: Edge[],
  options: { nodeSpacing: number; rankSpacing: number }
): WorkflowNode[] {
  const triggerNode = nodes.find((n) => n.type === "trigger")
  const orchestratorNode = nodes.find((n) => n.type === "orchestrator")
  const agentNodes = nodes.filter((n) => n.type === "task")
  const outputNodes = nodes.filter((n) => n.type === "output")

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

  // Position output nodes to the right of orchestrator with double spacing
  if (outputNodes.length > 0) {
    const doubleSpacing = options.rankSpacing * 2 // Double the normal spacing
    const outputX = orchestratorX + orchestratorDims.width + doubleSpacing
    
    outputNodes.forEach((outputNode) => {
      const outputDims = getNodeDimensions(outputNode)
      // Center vertically with orchestrator
      const outputY = orchestratorY + (orchestratorDims.height / 2) - (outputDims.height / 2)
      
      layoutedNodes.push({
        ...outputNode,
        position: { x: outputX, y: outputY },
      })
    })
  }

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
