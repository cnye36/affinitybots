"use client";

import { FC } from "react";
import ShikiHighlighter, { type ShikiHighlighterProps } from "react-shiki";
import type { SyntaxHighlighterProps as AUIProps } from "@assistant-ui/react-markdown";
import { cn } from "@/lib/utils";
import "./shiki.css";

/**
 * Props for the SyntaxHighlighter component
 */
export type HighlighterProps = Omit<
  ShikiHighlighterProps,
  "children" | "theme"
> & {
  theme?: ShikiHighlighterProps["theme"];
} & Pick<AUIProps, "node" | "components" | "language" | "code">;

/**
 * SyntaxHighlighter component, using react-shiki
 * Use it by passing to `defaultComponents` in `markdown-text.tsx`
 *
 * @example
 * const defaultComponents = memoizeMarkdownComponents({
 *   SyntaxHighlighter,
 *   h1: //...
 *   //...other elements...
 * });
 */
export const SyntaxHighlighter: FC<HighlighterProps> = ({
  code,
  language,
  theme = "github-dark",
  className,
  addDefaultStyles = false, // assistant-ui requires custom base styles
  showLanguage = false, // assistant-ui/react-markdown handles language labels
  node: _node,
  components: _components,
  ...props
}) => {
  const BASE_STYLES = "[&_pre]:overflow-x-auto [&_pre]:rounded-b-lg [&_pre]:bg-black [&_pre]:p-4 [&_pre]:text-white";

  // Normalize and guard against the assistant-ui fallback value "unknown",
  // which can appear during streaming before the language info string arrives.
  const normalizeLanguage = (
    lang: unknown,
  ): ShikiHighlighterProps["language"] | undefined => {
    if (!lang) return undefined;
    const l = String(lang).trim().toLowerCase();
    if (l === "unknown" || l === "text" || l === "plaintext" || l === "plain") return undefined;
    if (l === "js" || l === "javascript" || l === "node") return "javascript";
    if (l === "ts" || l === "typescript") return "typescript";
    if (l === "jsx") return "jsx";
    if (l === "tsx" || l === "react") return "tsx";
    return l as any;
  };

  const normalized = normalizeLanguage(language);

  if (!normalized) {
    return (
      <pre className={cn("overflow-x-auto rounded-b-lg bg-black p-4 text-white", className)}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <ShikiHighlighter
      {...props}
      language={normalized}
      theme={{ light: "github-light", dark: "github-dark" }}
      addDefaultStyles={addDefaultStyles}
      showLanguage={showLanguage}
      className={cn(BASE_STYLES, className)}
    >
      {code}
    </ShikiHighlighter>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
