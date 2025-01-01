import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { List, ListItem } from '@/components/ui/list'
import axios from 'axios'
import { FileText, Link } from 'lucide-react'
import { DocumentEntry, UrlEntry } from '@/types/agent'
import { SourceUploader } from '@/components/knowledge/SourceUploader'

interface KnowledgeConfigProps {
  agentId: string
  knowledgeBase: {
    documents: DocumentEntry[]
    urls: UrlEntry[]
  }
  onKnowledgeUpdate: () => void
}

export const KnowledgeConfig: React.FC<KnowledgeConfigProps> = ({
  agentId,
  knowledgeBase,
  onKnowledgeUpdate,
}) => {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleDelete = async (entryId: string, type: 'document' | 'url') => {
    const confirmed = confirm('Are you sure you want to delete this entry?')
    if (!confirmed) return

    try {
      setLoading(true)
      const response = await axios.delete(`/api/agents/${agentId}/knowledge/delete?entryId=${entryId}&type=${type}`)
      if (response.data.success) {
        onKnowledgeUpdate()
      } else {
        throw new Error(response.data.error || 'Failed to delete entry.')
      }
    } catch (err) {
      console.error('Error deleting knowledge entry:', err)
      setError('Failed to delete knowledge entry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SourceUploader agentId={agentId} onSourceAdded={onKnowledgeUpdate} />
      <div>
        <h3 className="text-lg font-semibold mb-2">Uploaded Documents</h3>
        {knowledgeBase.documents.length === 0 ? (
          <p className="text-muted-foreground">No documents uploaded.</p>
        ) : (
          <List>
            {knowledgeBase.documents.map((doc) => (
              <ListItem key={doc.id} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{doc.name}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(doc.id, 'document')}
                  disabled={loading}
                >
                  Delete
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Indexed URLs</h3>
        {knowledgeBase.urls.length === 0 ? (
          <p className="text-muted-foreground">No URLs indexed.</p>
        ) : (
          <List>
            {knowledgeBase.urls.map((urlEntry) => (
              <ListItem key={urlEntry.id} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <a href={urlEntry.url} target="_blank" rel="noopener noreferrer">
                    {urlEntry.url}
                  </a>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(urlEntry.id, 'url')}
                  disabled={loading}
                >
                  Delete
                </Button>
              </ListItem>
            ))}
          </List>
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