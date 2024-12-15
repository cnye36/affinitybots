import React, { useEffect, useState } from 'react'
import { slide as Menu } from 'react-burger-menu'
import axios from 'axios'
import './Sidebar.css'

const Sidebar: React.FC = () => {
  const [agents, setAgents] = useState<string[]>([])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/agents')
        setAgents(response.data.agents)
      } catch (error) {
        console.error('Error fetching agents:', error)
      }
    }

    fetchAgents()
  }, [])

  const onDragStart = (event: React.DragEvent, agent: string) => {
    event.dataTransfer.setData('application/reactflow', agent)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <Menu>
      <h3 className="text-lg font-semibold mb-4">Available Agents</h3>
      <div className="flex flex-col space-y-2">
        {agents.map((agent) => (
          <div
            key={agent}
            className="p-2 bg-white border rounded cursor-pointer"
            onDragStart={(event) => onDragStart(event, agent)}
            draggable
          >
            {agent}
          </div>
        ))}
      </div>
      {/* Add other slide-out content as needed */}
    </Menu>
  )
}

export default Sidebar 