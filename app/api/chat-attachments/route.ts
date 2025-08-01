import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { fileProcessor, MultimodalFileProcessor } from "@/lib/multimodal/fileProcessor";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const threadId = formData.get("threadId") as string | null;
    const agentId = formData.get("agentId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // threadId is optional now (nullable in database)
    // if (!threadId) {
    //   return NextResponse.json({ error: "Thread ID required" }, { status: 400 });
    // }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 50MB" 
      }, { status: 400 });
    }

    // Validate file type
    const attachmentType = MultimodalFileProcessor.getAttachmentType(file.type);
    const allowedTypes = ['image', 'document', 'video', 'audio', 'archive'];
    
    if (!allowedTypes.includes(attachmentType)) {
      return NextResponse.json({ 
        error: "Unsupported file type" 
      }, { status: 400 });
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload file to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading chat file:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("chat-attachments").getPublicUrl(filePath);

    // Store attachment metadata in database
    const { data: attachmentData, error: dbError } = await supabase
      .from('chat_attachments')
      .insert({
        thread_id: threadId || null,
        user_id: user.id,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        attachment_type: attachmentType,
        processing_status: 'pending',
        metadata: {
          uploaded_at: new Date().toISOString(),
          file_extension: fileExtension,
        }
      })
      .select('id')
      .single();

    if (dbError) {
      console.error("Error storing attachment metadata:", dbError);
      // Don't fail the upload, but log the error
    }

    // Start async processing if we have attachment data
    if (attachmentData && agentId) {
      // Don't await this - let it run in background
      processFileAsync(attachmentData.id, agentId, filePath, file, fileBuffer)
        .catch(error => console.error("Background processing error:", error));
    }

    return NextResponse.json({ 
      url: publicUrl,
      attachmentId: attachmentData?.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: attachmentType,
      processingStatus: 'pending'
    });

  } catch (err) {
    console.error("Unexpected error uploading file:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Process file asynchronously in the background
 */
async function processFileAsync(
  attachmentId: string,
  agentId: string,
  filePath: string,
  file: File,
  fileBuffer: Buffer
) {
  try {
    const supabase = await createClient();
    
    // Update status to processing
    await supabase
      .from('chat_attachments')
      .update({ 
        processing_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', attachmentId);

    // Create file metadata for processor
    const fileMetadata = {
      id: attachmentId,
      originalFilename: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      attachmentType: MultimodalFileProcessor.getAttachmentType(file.type)
    };

    // Process the file
    const result = await fileProcessor.processFile(fileMetadata, fileBuffer);

    // Update attachment with processing results
    const updateData: any = {
      processing_status: result.success ? 'completed' : 'failed',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (result.success) {
      if (result.thumbnailPath) {
        updateData.thumbnail_path = result.thumbnailPath;
      }
      if (result.extractedText) {
        updateData.extracted_text = result.extractedText;
      }
      if (result.metadata) {
        updateData.metadata = {
          ...fileMetadata,
          processing_result: result.metadata
        };
      }
    } else {
      updateData.processing_error = result.error;
    }

    await supabase
      .from('chat_attachments')
      .update(updateData)
      .eq('id', attachmentId);

    // Store embeddings if available
    if (result.success && result.chunks && result.embeddings && agentId) {
      await fileProcessor.storeProcessingResults(attachmentId, agentId, result);
    }

  } catch (error) {
    console.error("File processing failed:", error);
    
    // Update status to failed
    const supabase = await createClient();
    await supabase
      .from('chat_attachments')
      .update({ 
        processing_status: 'failed',
        processing_error: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', attachmentId);
  }
}

/**
 * Get attachment processing status
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const attachmentId = url.searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: attachment, error } = await supabase
      .from('chat_attachments')
      .select('processing_status, processing_error, thumbnail_path, extracted_text, metadata')
      .eq('id', attachmentId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.json(attachment);

  } catch (err) {
    console.error("Error getting attachment status:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
