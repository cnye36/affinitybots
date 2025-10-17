"use client";

import { type FC, useRef } from "react";
import { PaperclipIcon } from "lucide-react";
import { TooltipIconButton } from "../TooltipIconButton";
import { AttachmentUI } from "./AttachmentUI";
import { Attachment } from "./types";

interface AttachmentComposerProps {
  attachments: Attachment[];
  onAddAttachment: (file: File) => Promise<void>;
  onRemoveAttachment: (id: string) => void;
}

export const AttachmentComposer: FC<AttachmentComposerProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        await onAddAttachment(files[i]);
      } catch (error) {
        console.error("Failed to add attachment:", error);
        // Could show a toast notification here
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,text/*,.txt,.md,.json"
        multiple
      />
      
      {attachments.length > 0 && (
        <div className="flex flex-row gap-2 overflow-x-auto">
          {attachments.map((attachment) => (
            <AttachmentUI
              key={attachment.id}
              attachment={attachment}
              canRemove
              onRemove={onRemoveAttachment}
            />
          ))}
        </div>
      )}
      
      <TooltipIconButton
        className="size-8 p-2 transition-opacity ease-in flex-shrink-0"
        tooltip="Add Attachment"
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
      >
        <PaperclipIcon />
      </TooltipIconButton>
    </div>
  );
};

