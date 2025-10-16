"use client";

import { useEffect, useState, type FC } from "react";
import { CircleXIcon, FileIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { DialogContent as DialogPrimitiveContent } from "@radix-ui/react-dialog";
import { Attachment } from "./types";

const useFileSrc = (file: File | undefined) => {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!file) {
      setSrc(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  return src;
};

interface AttachmentPreviewProps {
  src: string;
}

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      style={{
        width: "auto",
        height: "auto",
        maxWidth: "75dvh",
        maxHeight: "75dvh",
        display: isLoaded ? "block" : "none",
        overflow: "clip",
      }}
      onLoad={() => setIsLoaded(true)}
      alt="Preview"
    />
  );
};

const AttachmentDialogContent: FC<{ children: React.ReactNode }> = ({ children }) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitiveContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] shadow-lg duration-200">
      {children}
    </DialogPrimitiveContent>
  </DialogPortal>
);

interface AttachmentUIProps {
  attachment: Attachment;
  canRemove?: boolean;
  onRemove?: (id: string) => void;
}

export const AttachmentUI: FC<AttachmentUIProps> = ({
  attachment,
  canRemove = false,
  onRemove,
}) => {
  const src = useFileSrc(attachment.file);
  const imageSrc = attachment.type === "image" ? src : undefined;
  
  const typeLabel = attachment.type === "image" ? "Image" : "Document";

  const content = (
    <Tooltip>
      <div className="relative mt-3">
        <TooltipTrigger asChild>
          <div className="flex h-12 w-40 items-center justify-center gap-2 rounded-lg border p-1">
            <Avatar className="bg-muted flex size-10 items-center justify-center rounded border text-sm">
              <AvatarFallback delayMs={imageSrc ? 200 : 0}>
                <FileIcon />
              </AvatarFallback>
              {imageSrc && <AvatarImage src={imageSrc} />}
            </Avatar>
            <div className="flex-grow basis-0">
              <p className="text-muted-foreground line-clamp-1 text-ellipsis break-all text-xs font-bold">
                {attachment.name}
              </p>
              <p className="text-muted-foreground text-xs">{typeLabel}</p>
            </div>
          </div>
        </TooltipTrigger>
        {canRemove && onRemove && (
          <TooltipIconButton
            tooltip="Remove file"
            className="text-muted-foreground [&>svg]:bg-background absolute -right-3 -top-3 size-6 [&>svg]:size-4 [&>svg]:rounded-full"
            side="top"
            onClick={() => onRemove(attachment.id)}
          >
            <CircleXIcon />
          </TooltipIconButton>
        )}
      </div>
      <TooltipContent side="top">{attachment.name}</TooltipContent>
    </Tooltip>
  );

  if (imageSrc) {
    return (
      <Dialog>
        <DialogTrigger className="hover:bg-accent/50 cursor-pointer transition-colors" asChild>
          {content}
        </DialogTrigger>
        <AttachmentDialogContent>
          <DialogTitle className="sr-only">Image Attachment Preview</DialogTitle>
          <AttachmentPreview src={imageSrc} />
        </AttachmentDialogContent>
      </Dialog>
    );
  }

  return content;
};

