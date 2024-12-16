'use client'

import React from 'react'
import { WorkflowsBuilder } from '@/components/workflows/WorkflowsBuilder'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewWorkflowPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/dashboard/workflows" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create New Workflow</h1>
      </div>
      <WorkflowsBuilder />
    </div>
  )
}