# Multimodal Implementation Guide

## Overview

This implementation provides comprehensive multimodal capabilities for your chat application, allowing users to upload and interact with images, documents, videos, and other file types. The system follows industry best practices for multimodal AI applications.

## Architecture

### Three-Tier Storage Approach

Following multimodal best practices, the system uses:

1. **Hot Storage** - Supabase Storage for immediate file access
2. **Warm Storage** - Database metadata and processed content 
3. **Cold Storage** - Long-term archival and backup (future enhancement)

### Key Components

1. **Database Schema** (`chat_attachments` table)
2. **File Processing Pipeline** (`lib/multimodal/fileProcessor.ts`)
3. **Retrieval System** (`lib/multimodal/retrieval.ts`)
4. **Enhanced Upload API** (`app/api/chat-attachments/route.ts`)
5. **Integration Layer** (enhanced `lib/retrieval.ts`)

## Database Schema

The `chat_attachments` table stores:

- File metadata (name, size, type, path)
- Processing status and results
- Generated thumbnails and extracted text
- Links to embeddings in `document_vectors`
- Thread and user associations

## Supported File Types

### Images
- **Types**: JPEG, PNG, GIF, WebP, SVG
- **Processing**: Thumbnail generation, OCR (future)
- **Use Cases**: Visual content analysis, image-based Q&A

### Documents  
- **Types**: PDF, Word, Excel, PowerPoint, Text, Markdown, CSV
- **Processing**: Text extraction, chunking, embedding generation
- **Use Cases**: Document search, content analysis

### Videos
- **Types**: MP4, WebM, QuickTime
- **Processing**: Metadata extraction, thumbnail generation (future)
- **Use Cases**: Video content understanding

### Audio
- **Types**: MP3, WAV, OGG
- **Processing**: Transcription (future integration)
- **Use Cases**: Audio content analysis

## Setup Instructions

### 1. Run the Database Migration

```bash
# Apply the new schema
supabase db push
```

### 2. Update Environment Variables

Ensure these are set in your `.env.local`:

```env
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Frontend Integration

Update your file upload component to include the required metadata:

```typescript
// In your upload component
const formData = new FormData();
formData.append('file', file);
formData.append('threadId', currentThreadId);
formData.append('agentId', agent.id);

const response = await fetch('/api/chat-attachments', {
  method: 'POST',
  body: formData
});
```

### 4. Agent Integration

Update your agent to use multimodal retrieval:

```typescript
// In your agent code
import { retrieveRelevantDocuments, formatMultimodalContext } from '@/lib/retrieval';

// During message processing
const relevantDocs = await retrieveRelevantDocuments(
  userMessage,
  supabase,
  5, // topK
  agentId,
  threadId,
  true // includeMultimodal
);

const multimodalContext = formatMultimodalContext(relevantDocs);
// Include multimodalContext in your prompt
```

## API Endpoints

### POST `/api/chat-attachments`

Upload and process files:

```typescript
// Request
FormData {
  file: File,
  threadId: string,
  agentId: string
}

// Response
{
  url: string,
  attachmentId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
}
```

### GET `/api/chat-attachments?id={attachmentId}`

Check processing status:

```typescript
// Response
{
  processing_status: string,
  processing_error?: string,
  thumbnail_path?: string,
  extracted_text?: string,
  metadata: object
}
```

## Processing Pipeline

Files go through this automated pipeline:

1. **Upload** - Store in Supabase Storage
2. **Metadata Storage** - Record in `chat_attachments` table
3. **Type Detection** - Determine processing strategy
4. **Processing** - Extract text, generate thumbnails, create embeddings
5. **Storage** - Save results and embeddings
6. **Retrieval** - Make searchable via similarity search

## Performance Considerations

### File Size Limits
- Maximum: 50MB per file
- Recommended: Keep under 10MB for optimal processing

### Processing Times
- **Images**: 1-3 seconds (thumbnail generation)
- **Documents**: 5-30 seconds (text extraction + embeddings)
- **Videos**: 10-60 seconds (metadata extraction)

### Scaling
- Processing runs asynchronously to avoid blocking uploads
- Background workers handle intensive operations
- Embeddings are chunked for large documents

## Security Features

- Row Level Security (RLS) on all tables
- User-scoped file access
- MIME type validation
- File size limits
- Secure storage policies

## Monitoring & Troubleshooting

### Check Processing Status

```sql
-- View processing status
SELECT 
  original_filename,
  processing_status,
  processing_error,
  created_at
FROM chat_attachments 
WHERE user_id = 'user_id'
ORDER BY created_at DESC;
```

### Common Issues

1. **Processing Stuck**: Check background job logs
2. **Large Files**: Increase timeout limits
3. **OCR Errors**: Verify image quality
4. **Embedding Failures**: Check OpenAI API key

## Future Enhancements

### Planned Features
- [ ] OCR for images (Google Vision API)
- [ ] Video frame analysis
- [ ] Audio transcription (Whisper)
- [ ] Advanced image understanding
- [ ] Batch processing
- [ ] CDN integration
- [ ] Advanced compression

### Performance Optimizations
- [ ] Cached thumbnails
- [ ] Progressive loading
- [ ] Lazy embedding generation
- [ ] Smart chunking strategies

## Best Practices

### File Organization
- Use descriptive filenames
- Organize by project/topic
- Regular cleanup of unused files

### Performance
- Process smaller files when possible
- Use appropriate file formats
- Monitor storage usage

### User Experience
- Provide upload progress feedback
- Show processing status
- Display thumbnails quickly
- Handle errors gracefully

## Integration Examples

### Chat Message with Attachments

```typescript
// Display attachments in chat
const attachments = await getThreadAttachments(threadId, userId);

// In your message component
{attachments.map(attachment => (
  <AttachmentPreview 
    key={attachment.id}
    fileName={attachment.fileName}
    thumbnailPath={attachment.thumbnailPath}
    type={attachment.attachmentType}
    processingStatus={attachment.metadata.processing_status}
  />
))}
```

### Semantic Search

```typescript
// Search across all content types
const results = await multimodalRetrieval.retrieveRelevantContent({
  query: "financial reports Q4",
  agentId: agent.id,
  threadId: currentThread.id,
  limit: 10,
  similarityThreshold: 0.7,
  includeAttachments: true,
  includeDocuments: true
});
```

## Conclusion

This multimodal implementation provides a robust foundation for handling diverse file types in your AI application. The system is designed to scale and can be extended with additional processing capabilities as needed.

The architecture follows industry best practices for multimodal AI systems, ensuring optimal performance, security, and user experience.