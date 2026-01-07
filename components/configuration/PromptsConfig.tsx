"use client";

import { Label } from "@/components/ui/label";
import { AssistantConfiguration } from "@/types/assistant";
import { useEffect, useRef, useState } from "react";
import { Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PromptsConfigProps {
  config: AssistantConfiguration;
  onChange: (field: keyof AssistantConfiguration, value: unknown) => void;
}

export function PromptsConfig({ config, onChange }: PromptsConfigProps) {
  const [draftPrompt, setDraftPrompt] = useState(config.prompt_template || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogDraft, setDialogDraft] = useState("");
  const isFocusedRef = useRef(false);

  // Keep draft in sync with external updates, but never clobber while user is typing.
  useEffect(() => {
    if (isFocusedRef.current) return;
    setDraftPrompt(config.prompt_template || "");
  }, [config.prompt_template]);

  const commit = () => {
    isFocusedRef.current = false;
    const current = config.prompt_template || "";
    if (draftPrompt === current) return;
    onChange("prompt_template", draftPrompt);
  };

  // Commit when unmounting (e.g. closing panel) if the user was editing.
  useEffect(() => {
    return () => {
      if (!isFocusedRef.current) return;
      const current = config.prompt_template || "";
      if (draftPrompt === current) return;
      onChange("prompt_template", draftPrompt);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDialog = () => {
    setDialogDraft(draftPrompt);
    setIsDialogOpen(true);
  };

  const saveFromDialog = () => {
    setDraftPrompt(dialogDraft);
    onChange("prompt_template", dialogDraft);
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="space-y-3 w-full overflow-hidden">
        <div className="space-y-2 w-full overflow-hidden">
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt_template" className="text-sm font-medium">
              Instructions
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openDialog}
              className="h-7 text-xs gap-1"
            >
              <Maximize className="h-3 w-3" />
              Expand
            </Button>
          </div>
          <textarea
            id="prompt_template"
            value={draftPrompt}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={commit}
            onChange={(e) => setDraftPrompt(e.target.value)}
            placeholder="You are a helpful AI assistant..."
            className="flex w-full rounded-lg border border-violet-200/50 dark:border-violet-800/50 bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all"
            style={{ minHeight: "120px" }}
          />
        </div>
      </div>

      {/* Expand Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
              System Prompt Editor
            </DialogTitle>
            <DialogDescription>
              Edit your agent's system prompt with a larger view
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 mt-4">
            <textarea
              value={dialogDraft}
              onChange={(e) => setDialogDraft(e.target.value)}
              placeholder="You are a helpful AI assistant..."
              className="flex-1 w-full rounded-lg border border-violet-200/50 dark:border-violet-800/50 bg-background px-4 py-3 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveFromDialog}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
