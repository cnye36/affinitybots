export interface Attachment {
  id: string;
  type: "image" | "document";
  name: string;
  file?: File;
  content?: Array<{ type: string; image?: string; text?: string }>;
}

export interface AttachmentStatus {
  type: "idle" | "uploading" | "complete" | "error";
  progress?: number;
  error?: string;
}

