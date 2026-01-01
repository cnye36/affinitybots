"use client";

import { useState, type FC } from "react";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface WebSearchResultsProps {
  content: string;
}

/**
 * Parses web search results from message content
 * Looks for patterns like "**Summary:**" and "**Sources**"
 */
function parseWebSearchResults(content: string): { summary: string; sources: string; fullSearchContent: string; hasResults: boolean } {
  // Check if content contains web search markers
  const hasSummary = content.includes("**Summary:**");
  const hasSources = content.includes("**Sources**");
  
  if (!hasSummary && !hasSources) {
    return { summary: "", sources: "", fullSearchContent: "", hasResults: false };
  }
  
  // Find the start of the web search block
  let searchStartIndex = -1;
  if (hasSummary) {
    searchStartIndex = content.indexOf("**Summary:**");
  }
  if (hasSources) {
    const sourcesIndex = content.indexOf("**Sources**");
    if (searchStartIndex === -1 || sourcesIndex < searchStartIndex) {
      searchStartIndex = sourcesIndex;
    }
  }
  
  if (searchStartIndex === -1) {
    return { summary: "", sources: "", fullSearchContent: "", hasResults: false };
  }
  
  // Get everything from the search start
  const searchBlock = content.substring(searchStartIndex);
  
  // Find where the search block ends
  // Look for the end of the numbered sources list
  // Sources are numbered like "1. **[title](url)**" followed by content
  // The list typically ends with a double newline followed by text that doesn't start with a number
  
  // Try to find the last numbered item in the sources
  const numberedItemPattern = /^\d+\.\s+\*\*\[/m;
  let lastNumberedIndex = -1;
  let match: RegExpExecArray | null;
  const regex = new RegExp(numberedItemPattern.source, 'gm');
  
  while ((match = regex.exec(searchBlock)) !== null) {
    lastNumberedIndex = match.index;
  }
  
  let searchEndIndex = searchBlock.length;
  
  if (lastNumberedIndex !== -1) {
    // Find the end of the last numbered item
    // Look for double newline after the last item's content
    const afterLastItem = searchBlock.substring(lastNumberedIndex);
    // Match the numbered item and its content until double newline
    const itemWithContent = afterLastItem.match(/^\d+\.\s+[\s\S]*?(\n\n(?!\d+\.)|$)/);
    if (itemWithContent) {
      const itemEnd = lastNumberedIndex + itemWithContent[0].length;
      // Look for double newline after this item
      const afterItem = searchBlock.substring(itemEnd);
      const doubleNewline = afterItem.indexOf("\n\n");
      if (doubleNewline !== -1) {
        searchEndIndex = itemEnd + doubleNewline + 2;
      } else {
        searchEndIndex = itemEnd;
      }
    }
  } else {
    // No numbered items found, try to find end by looking for patterns
    // Look for triple newline or double newline followed by text that doesn't look like a source
    const tripleNewline = searchBlock.indexOf("\n\n\n");
    if (tripleNewline !== -1 && tripleNewline > 100) {
      searchEndIndex = tripleNewline + 3;
    } else {
      // Look for double newline followed by text that doesn't start with number or **
      const doubleNewlineMatch = searchBlock.match(/\n\n(?!\d+\.\s+\*\*|#|\*\*)/);
      if (doubleNewlineMatch && doubleNewlineMatch.index !== undefined && doubleNewlineMatch.index > 100) {
        searchEndIndex = doubleNewlineMatch.index + 2;
      }
    }
  }
  
  // Extract the full search content
  const fullSearchContent = searchBlock.substring(0, searchEndIndex).trim();
  
  // Parse summary and sources from the full content
  let summary = "";
  let sources = "";
  
  if (hasSummary) {
    const summaryMatch = fullSearchContent.match(/\*\*Summary:\*\*\s*([\s\S]+?)(?=\n\n\*\*Sources|$)/);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }
  }
  
  if (hasSources) {
    const sourcesMatch = fullSearchContent.match(/\*\*Sources\*\*[^\n]*\n\n([\s\S]*?)$/);
    if (sourcesMatch) {
      sources = sourcesMatch[1].trim();
    }
  }
  
  return {
    summary,
    sources,
    fullSearchContent,
    hasResults: true,
  };
}

/**
 * Removes web search results from content, returning only the AI's response
 */
function removeWebSearchResults(content: string): string {
  const { fullSearchContent, hasResults } = parseWebSearchResults(content);
  
  if (!hasResults || !fullSearchContent) {
    return content;
  }
  
  // Find where the search content starts in the original content
  const searchStartIndex = content.indexOf(fullSearchContent.substring(0, 50)); // Match first 50 chars to find position
  
  if (searchStartIndex === -1) {
    // Try to find by Summary or Sources markers
    const summaryIndex = content.indexOf("**Summary:**");
    const sourcesIndex = content.indexOf("**Sources**");
    const markerIndex = summaryIndex !== -1 ? summaryIndex : sourcesIndex;
    
    if (markerIndex === -1) {
      return content; // Can't find search content
    }
    
    // Remove from marker to end of search content
    const beforeSearch = content.substring(0, markerIndex);
    const afterMarker = content.substring(markerIndex);
    
    // Find where search content ends using the same logic as parseWebSearchResults
    const searchBlock = afterMarker;
    const numberedItemPattern = /^\d+\.\s+\*\*\[/m;
    let lastNumberedIndex = -1;
    let match: RegExpExecArray | null;
    const regex = new RegExp(numberedItemPattern.source, 'gm');
    
    while ((match = regex.exec(searchBlock)) !== null) {
      lastNumberedIndex = match.index;
    }
    
    let searchEndIndex = searchBlock.length;
    
    if (lastNumberedIndex !== -1) {
      const afterLastItem = searchBlock.substring(lastNumberedIndex);
      const itemWithContent = afterLastItem.match(/^\d+\.\s+[\s\S]*?(\n\n(?!\d+\.)|$)/);
      if (itemWithContent) {
        const itemEnd = lastNumberedIndex + itemWithContent[0].length;
        const afterItem = searchBlock.substring(itemEnd);
        const doubleNewline = afterItem.indexOf("\n\n");
        if (doubleNewline !== -1) {
          searchEndIndex = itemEnd + doubleNewline + 2;
        } else {
          searchEndIndex = itemEnd;
        }
      }
    } else {
      const tripleNewline = searchBlock.indexOf("\n\n\n");
      if (tripleNewline !== -1 && tripleNewline > 100) {
        searchEndIndex = tripleNewline + 3;
      }
    }
    
    const afterSearch = searchBlock.substring(searchEndIndex);
    let cleaned = (beforeSearch + afterSearch).trim();
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    return cleaned;
  }
  
  // Remove the search content
  const beforeSearch = content.substring(0, searchStartIndex);
  const afterSearch = content.substring(searchStartIndex + fullSearchContent.length);
  
  let cleaned = (beforeSearch + afterSearch).trim();
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  
  return cleaned;
}

export const WebSearchResults: FC<WebSearchResultsProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { summary, sources, fullSearchContent, hasResults } = parseWebSearchResults(content);

  if (!hasResults) {
    return null;
  }

  return (
    <div className="mt-4 border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">See Search Results</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border">
          <div className="space-y-4 text-sm">
            {fullSearchContent ? (
              <div className="text-muted-foreground leading-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ className, children, ...props }) => (
                      <p className={cn("mb-2 text-sm leading-6 last:mb-0", className)} {...props}>
                        {children}
                      </p>
                    ),
                    strong: ({ className, children, ...props }) => (
                      <strong className={cn("font-semibold text-foreground", className)} {...props}>
                        {children}
                      </strong>
                    ),
                    a: ({ className, children, ...props }) => (
                      <a
                        className={cn("text-primary underline underline-offset-2 hover:text-primary/80", className)}
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    ol: ({ className, children, ...props }) => (
                      <ol className={cn("list-decimal ml-6 space-y-1 my-2", className)} {...props}>
                        {children}
                      </ol>
                    ),
                    ul: ({ className, children, ...props }) => (
                      <ul className={cn("list-disc ml-6 space-y-1 my-2", className)} {...props}>
                        {children}
                      </ul>
                    ),
                    li: ({ className, children, ...props }) => (
                      <li className={cn("text-sm leading-6", className)} {...props}>
                        {children}
                      </li>
                    ),
                  }}
                >
                  {fullSearchContent}
                </ReactMarkdown>
              </div>
            ) : (
              <>
                {summary && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Summary</h4>
                    <div className="text-muted-foreground leading-6">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ className, children, ...props }) => (
                            <p className={cn("mb-2 text-sm leading-6 last:mb-0", className)} {...props}>
                              {children}
                            </p>
                          ),
                          strong: ({ className, children, ...props }) => (
                            <strong className={cn("font-semibold text-foreground", className)} {...props}>
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {summary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {sources && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Sources</h4>
                    <div className="text-muted-foreground leading-6">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ className, children, ...props }) => (
                            <p className={cn("mb-2 text-sm leading-6 last:mb-0", className)} {...props}>
                              {children}
                            </p>
                          ),
                          a: ({ className, children, ...props }) => (
                            <a
                              className={cn("text-primary underline underline-offset-2 hover:text-primary/80", className)}
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            >
                              {children}
                            </a>
                          ),
                          ol: ({ className, children, ...props }) => (
                            <ol className={cn("list-decimal ml-6 space-y-1", className)} {...props}>
                              {children}
                            </ol>
                          ),
                          ul: ({ className, children, ...props }) => (
                            <ul className={cn("list-disc ml-6 space-y-1", className)} {...props}>
                              {children}
                            </ul>
                          ),
                          li: ({ className, children, ...props }) => (
                            <li className={cn("text-sm leading-6", className)} {...props}>
                              {children}
                            </li>
                          ),
                        }}
                      >
                        {sources}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Utility function to extract web search results and clean content
 */
export function extractWebSearchResults(content: string): {
  cleanedContent: string;
  hasWebSearch: boolean;
} {
  const { hasResults } = parseWebSearchResults(content);
  const cleanedContent = hasResults ? removeWebSearchResults(content) : content;
  
  return {
    cleanedContent,
    hasWebSearch: hasResults,
  };
}

