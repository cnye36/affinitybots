/**
 * Multimodal File Processing Library
 * Handles processing of images, documents, videos, and other file types
 * for AI consumption and storage optimization
 */

import { createClient } from '@/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';

export interface ProcessingResult {
  success: boolean;
  thumbnailPath?: string;
  extractedText?: string;
  chunks?: string[];
  embeddings?: number[][];
  error?: string;
  metadata?: Record<string, any>;
}

export interface FileMetadata {
  id: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  attachmentType: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';
}

export class MultimodalFileProcessor {
  private supabase!: SupabaseClient;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });
    
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async initializeSupabase() {
    this.supabase = await createClient();
  }

  /**
   * Main processing function that routes to appropriate handlers
   */
  async processFile(fileMetadata: FileMetadata, fileBuffer: Buffer): Promise<ProcessingResult> {
    try {
      await this.initializeSupabase();

      switch (fileMetadata.attachmentType) {
        case 'image':
          return await this.processImage(fileMetadata, fileBuffer);
        case 'document':
          return await this.processDocument(fileMetadata, fileBuffer);
        case 'video':
          return await this.processVideo(fileMetadata, fileBuffer);
        case 'audio':
          return await this.processAudio(fileMetadata, fileBuffer);
        default:
          return { success: true, metadata: { processed: false } };
      }
    } catch (error) {
      console.error('File processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    }
  }

  /**
   * Process images: create thumbnails, extract text (OCR), generate embeddings
   */
  private async processImage(fileMetadata: FileMetadata, fileBuffer: Buffer): Promise<ProcessingResult> {
    try {
      // Create thumbnail
      const thumbnailBuffer = await sharp(fileBuffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload thumbnail
      const thumbnailPath = `${fileMetadata.filePath.replace(/\.[^/.]+$/, '')}_thumb.jpg`;
      const { error: uploadError } = await this.supabase.storage
        .from('chat-attachments')
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Thumbnail upload error:', uploadError);
      }

      // Get image metadata
      const imageMetadata = await sharp(fileBuffer).metadata();
      
      // Generate basic image description for AI analysis
      const imageDescription = this.generateImageDescription(fileMetadata, imageMetadata);
      
      // TODO: Add OCR processing for text extraction from images
      // This would integrate with services like Google Vision API or Tesseract
      
      return {
        success: true,
        thumbnailPath: uploadError ? undefined : thumbnailPath,
        extractedText: imageDescription, // Provide description as "text" for the agent
        metadata: {
          width: imageMetadata.width,
          height: imageMetadata.height,
          format: imageMetadata.format,
          hasAlpha: imageMetadata.hasAlpha,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image processing failed'
      };
    }
  }

  /**
   * Process documents: extract text, create chunks, generate embeddings
   */
  private async processDocument(fileMetadata: FileMetadata, fileBuffer: Buffer): Promise<ProcessingResult> {
    try {
      let extractedText = '';
      
      // Extract text using LangChain loaders (same as knowledgebase)
      extractedText = await this.extractTextWithLangChain(fileMetadata, fileBuffer);

      if (!extractedText.trim()) {
        return {
          success: true,
          metadata: { textLength: 0, message: 'No text content extracted' }
        };
      }

      // Create text chunks
      const chunks = await this.textSplitter.splitText(extractedText);
      
      // Generate embeddings for chunks
      const embeddings = await this.embeddings.embedDocuments(chunks);

      return {
        success: true,
        extractedText,
        chunks,
        embeddings,
        metadata: {
          textLength: extractedText.length,
          chunkCount: chunks.length,
          avgChunkLength: chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document processing failed'
      };
    }
  }

  /**
   * Process videos: extract thumbnail, metadata
   */
  private async processVideo(fileMetadata: FileMetadata, fileBuffer: Buffer): Promise<ProcessingResult> {
    try {
      // For now, just return basic metadata
      // In production, you'd use ffmpeg to extract thumbnails and metadata
      return {
        success: true,
        metadata: {
          fileSize: fileMetadata.fileSize,
          mimeType: fileMetadata.mimeType,
          // TODO: Add video duration, resolution, codec info
          processingNote: 'Video processing not fully implemented'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video processing failed'
      };
    }
  }

  /**
   * Process audio files: extract metadata, transcript
   */
  private async processAudio(fileMetadata: FileMetadata, fileBuffer: Buffer): Promise<ProcessingResult> {
    try {
      // For now, just return basic metadata
      // In production, you'd integrate with speech-to-text services
      return {
        success: true,
        metadata: {
          fileSize: fileMetadata.fileSize,
          mimeType: fileMetadata.mimeType,
          // TODO: Add audio duration, transcription
          processingNote: 'Audio processing not fully implemented'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audio processing failed'
      };
    }
  }

  /**
   * Extract text using LangChain loaders (consistent with knowledgebase)
   */
  private async extractTextWithLangChain(fileMetadata: FileMetadata, fileBuffer: Buffer): Promise<string> {
    try {
      // Create a temporary File object for LangChain loaders
      const file = new File([fileBuffer], fileMetadata.originalFilename, {
        type: fileMetadata.mimeType
      });

      let docs;
      
      switch (fileMetadata.mimeType) {
        case 'application/pdf':
          const pdfLoader = new PDFLoader(file);
          docs = await pdfLoader.load();
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          const docxLoader = new DocxLoader(file);
          docs = await docxLoader.load();
          break;
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          return fileBuffer.toString('utf-8');
        default:
          // For other document types, try to extract as text
          return fileBuffer.toString('utf-8');
      }

      // Combine all document content
      return docs.map(doc => doc.pageContent).join('\n\n');
    } catch (error) {
      console.error('Document parsing error:', error);
      throw new Error(`Failed to extract text from ${fileMetadata.mimeType}`);
    }
  }

  /**
   * Generate a basic description for image files
   */
  private generateImageDescription(fileMetadata: FileMetadata, imageMetadata: any): string {
    const { originalFilename, mimeType, fileSize } = fileMetadata;
    const { width, height, format } = imageMetadata;
    
    const sizeInKB = Math.round(fileSize / 1024);
    const megapixels = width && height ? (width * height / 1000000).toFixed(1) : 'unknown';
    
    return `Image Analysis:
- Filename: ${originalFilename}
- Format: ${format?.toUpperCase() || 'Unknown'}
- Dimensions: ${width}x${height} pixels
- Resolution: ${megapixels} megapixels
- File Size: ${sizeInKB} KB
- Type: ${mimeType}

This is an uploaded image file. The user has shared this image and may ask questions about its content, appearance, or want analysis of what's shown in the image. Let the user know you can see the image metadata above, and ask them to describe what they'd like to know about the image or what specific analysis they need.`;
  }

  /**
   * Store extracted content and embeddings in the database
   */
  async storeProcessingResults(
    attachmentId: string,
    agentId: string,
    result: ProcessingResult
  ): Promise<void> {
    if (!result.success || !result.chunks || !result.embeddings) {
      return;
    }

    try {
      await this.initializeSupabase();

      // Store each chunk as a separate document vector
      for (let i = 0; i < result.chunks.length; i++) {
        const chunk = result.chunks[i];
        const embedding = result.embeddings[i];

        const { data: vectorData, error: vectorError } = await this.supabase
          .from('document_vectors')
          .insert({
            content: chunk,
            metadata: {
              agent_id: agentId,
              attachment_id: attachmentId,
              chunk_index: i,
              total_chunks: result.chunks.length,
            },
            embedding: `[${embedding.join(',')}]`, // PostgreSQL array format
          })
          .select('id')
          .single();

        if (vectorError) {
          console.error('Error storing document vector:', vectorError);
        } else if (i === 0 && vectorData) {
          // Update the attachment with the first vector ID as the primary reference
          await this.supabase
            .from('chat_attachments')
            .update({ document_vector_id: vectorData.id })
            .eq('id', attachmentId);
        }
      }
    } catch (error) {
      console.error('Error storing processing results:', error);
    }
  }

  /**
   * Determine file type from MIME type
   */
  static getAttachmentType(mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'text/markdown',
    ];
    
    if (documentTypes.includes(mimeType)) return 'document';
    
    const archiveTypes = ['application/zip', 'application/x-rar-compressed'];
    if (archiveTypes.includes(mimeType)) return 'archive';
    
    return 'other';
  }
}

export const fileProcessor = new MultimodalFileProcessor();