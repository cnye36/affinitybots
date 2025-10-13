import { FC } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThinkingDialogProps {
  className?: string;
  thinking?: string;
}

export const ThinkingDialog: FC<ThinkingDialogProps> = ({ className, thinking }) => {
  return (
    <motion.div
      className={cn(
        "relative mx-auto grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] px-[var(--thread-padding-x)] py-4",
        className
      )}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role="assistant-thinking"
    >
      {/* Avatar with pulsing effect */}
      <motion.div 
        className="ring-border bg-background col-start-1 row-start-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1"
        animate={{ 
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 0 0 rgba(59, 130, 246, 0.4)",
            "0 0 0 4px rgba(59, 130, 246, 0.1)",
            "0 0 0 0 rgba(59, 130, 246, 0.4)"
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="flex size-4 items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M8 0L9.79611 6.20389L16 8L9.79611 9.79611L8 16L6.20389 9.79611L0 8L6.20389 6.20389L8 0Z"
              fill="currentColor"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Thinking Content */}
      <div className="text-foreground col-span-2 col-start-2 row-start-1 ml-4 leading-7 break-words">
        {thinking ? (
          <div className="text-sm text-muted-foreground">
            <motion.div
              className="mb-2 font-medium"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Thinking...
            </motion.div>
            <div className="max-h-64 overflow-y-auto rounded-lg bg-muted/50 p-3 font-mono text-xs">
              {thinking}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <motion.span
              className="text-sm font-medium text-muted-foreground"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Thinking
            </motion.span>

            {/* Animated dots */}
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
