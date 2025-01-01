"use client"

import { useState } from 'react'
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SourceUploaderProps {
  agentId: string
  onSourceAdded: () => void
}

export function SourceUploader({ agentId, onSourceAdded }: SourceUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', files[0])
    formData.append('url', '') // Ensure no URL is sent
    formData.append('agentId', agentId)

    try {
      const response = await fetch(`/api/agents/${agentId}/knowledge/upload`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Failed to upload file')
      onSourceAdded()
    } catch (err) {
      setError('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUrlAdd = async () => {
    if (!url.trim()) return
    
    setIsUploading(true)
    setError(null)

    try {
      const response = await fetch(`/api/agents/${agentId}/knowledge/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, agentId }),
      })
      
      if (!response.ok) throw new Error('Failed to process URL')
      onSourceAdded()
      setUrl('')
      setShowUrlInput(false)
    } catch (err) {
      setError('Failed to process URL')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <input
          type="file"
          className="hidden"
          id="file-upload"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
        />
        <Button
          variant="outline"
          className="w-full"
          disabled={isUploading}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload Files
        </Button>

        {showUrlInput ? (
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button 
              onClick={handleUrlAdd}
              disabled={isUploading || !url.trim()}
            >
              Add
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowUrlInput(true)}
            disabled={isUploading}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Add URL
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
} 