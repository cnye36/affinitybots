"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { mutate } from "swr";

interface AgentCardProps {
  assistant: {
    assistant_id: string;
    name: string;
    description: string;
    model_type: string;
    tools: { name: string }[];
    config: {
      configurable: {
        avatar: string;
      };
    };
  };
  onDelete: (assistantId: string) => void;
}

export function AgentCard({ assistant, onDelete }: AgentCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking delete button
    if ((e.target as HTMLElement).closest(".delete-button")) {
      e.stopPropagation();
      return;
    }

    if (!assistant.assistant_id || assistant.assistant_id === "undefined") {
      console.error("Invalid assistant ID");
      return;
    }

    // Ensure the ID is properly formatted before navigation
    const assistantId = encodeURIComponent(assistant.assistant_id.trim());
    router.push(`/assistants/${assistantId}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `/api/assistants/${assistant.assistant_id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete agent");
      }

      await mutate("/api/assistants");
      onDelete(assistant.assistant_id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Agent deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Failed to delete agent",
        variant: "destructive",
      });
    }
  };

  // Get the avatar URL from the config
  const avatarUrl = assistant.config.configurable.avatar;

  return (
    <>
      <div
        className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer relative group"
        onClick={handleClick}
      >
        <Button
          variant="ghost"
          size="icon"
          className="delete-button absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
        <div className="flex items-start space-x-4">
          <div
            className="h-12 w-12 rounded-full ring-2 ring-background flex items-center justify-center text-sm font-medium text-white"
            style={{
              backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: !avatarUrl
                ? `hsl(${(assistant.name.length * 30) % 360}, 70%, 50%)`
                : undefined,
            }}
          >
            {!avatarUrl && assistant.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{assistant.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {assistant.description || "No description provided"}
            </p>
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-4">
          <span className="flex items-center">
            Model: {assistant.model_type || "Not specified"}
          </span>
          <span className="mx-2">•</span>
          <span>{assistant.tools?.length || 0} tools</span>
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              agent and any workflows using this agent will fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
