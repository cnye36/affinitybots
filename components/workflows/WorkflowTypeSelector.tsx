"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Brain } from "lucide-react";
import { motion } from "framer-motion";

interface WorkflowTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: "sequential" | "orchestrator") => void;
}

export function WorkflowTypeSelector({
  open,
  onOpenChange,
  onSelectType,
}: WorkflowTypeSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Workflow Type</DialogTitle>
          <DialogDescription>
            Select how you want your workflow to execute
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Sequential Workflow Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              onClick={() => onSelectType("sequential")}
              className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 group h-full"
            >
              <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <ArrowRight className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Sequential Workflow
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tasks execute in a predefined order, one after another. Perfect
                  for linear processes with clear steps.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Orchestrator Workflow Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              onClick={() => onSelectType("orchestrator")}
              className="cursor-pointer hover:border-purple-500 hover:shadow-lg transition-all duration-200 group h-full"
            >
              <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Orchestrator Workflow
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A manager agent coordinates and delegates to sub-agents
                  dynamically. Ideal for complex, adaptive workflows.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
