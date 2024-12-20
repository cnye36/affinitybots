'use client'

import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { AgentChatDialog } from './AgentChatDialog'

export function AgentChatDialogWrapper({ agentId, agentName }: { agentId: string, agentName: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      {isOpen && (
        <AgentChatDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          agentId={agentId}
          agentName={agentName}
        />
      )}
    </>
  )
} 