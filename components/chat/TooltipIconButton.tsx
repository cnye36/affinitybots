"use client";

import { type FC, type ComponentPropsWithoutRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface TooltipIconButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
}

export const TooltipIconButton: FC<TooltipIconButtonProps> = ({
  children,
  tooltip,
  side = "bottom",
  ...props
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

