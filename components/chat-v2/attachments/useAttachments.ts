"use client";

import { useState, useCallback } from "react";
import { Attachment } from "./types";

async function compressImageFile(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    maxWidth / imageBitmap.width,
    maxHeight / imageBitmap.height
  );
  const targetWidth = Math.round(imageBitmap.width * scale);
  const targetHeight = Math.round(imageBitmap.height * scale);

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context missing");
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}

async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function useAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const addAttachment = useCallback(async (file: File) => {
    const id = `attachment-${Date.now()}-${Math.random()}`;
    const isImage = file.type.startsWith("image/");
    const isText = file.type.startsWith("text/") || 
                   file.name.endsWith(".txt") || 
                   file.name.endsWith(".md") ||
                   file.name.endsWith(".json");

    try {
      if (isImage) {
        // Compress and convert image to base64
        const compressedDataUrl = await compressImageFile(file, 1600, 1600, 0.8);
        
        const attachment: Attachment = {
          id,
          type: "image",
          name: file.name,
          file,
          content: [
            {
              type: "image",
              image: compressedDataUrl,
            },
          ],
        };
        
        setAttachments((prev) => [...prev, attachment]);
      } else if (isText) {
        // Read text file content
        const textContent = await readTextFile(file);
        
        const attachment: Attachment = {
          id,
          type: "document",
          name: file.name,
          file,
          content: [
            {
              type: "text",
              text: `<attachment name="${file.name}">\n${textContent}\n</attachment>`,
            },
          ],
        };
        
        setAttachments((prev) => [...prev, attachment]);
      } else {
        // Unsupported file type
        throw new Error(`Unsupported file type: ${file.type}`);
      }
    } catch (error) {
      console.error("Failed to process attachment:", error);
      throw error;
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  return {
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
  };
}

