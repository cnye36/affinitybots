import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

/**
 * Message types that should be hidden from the user interface
 */
const HIDDEN_MESSAGE_TYPES = [
  'system',
  'tool',
  'function'
];

/**
 * Content patterns that indicate internal/system messages
 */
const INTERNAL_MESSAGE_PATTERNS = [
  /^Updating memory\.\.\./i,
  /^Knowledge Source \d+/i,
  /^You have access to the following information/i,
  /^🔥 UPLOADED FILES IN THIS CONVERSATION/i,
  /^📎 UPLOADED FILE \d+:/i,
  /Context Priority Rules:/i,
  /IMPORTANT HIERARCHY:/i,
  /^I would like to use the following tools/i,
  /Do you approve these tool calls\?/i,
  /^Tool call:/i
];

/**
 * Checks if a message should be hidden from the user interface
 */
export function shouldHideMessage(message: any): boolean {
  // Hide messages based on type
  if (message.type && HIDDEN_MESSAGE_TYPES.includes(message.type.toLowerCase())) {
    return true;
  }

  // Hide messages based on content patterns
  const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
  
  for (const pattern of INTERNAL_MESSAGE_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }

  // Hide empty messages
  if (!content || content.trim() === '') {
    return true;
  }

  return false;
}

/**
 * Filters thread state messages to only show user-facing content
 */
export function filterMessagesForDisplay(messages: any[]): { type: string; content: string }[] {
  const filtered = messages.filter(msg => !shouldHideMessage(msg));
  
  return filtered.map(msg => ({
    type: msg.type || (msg instanceof HumanMessage ? 'human' : 'ai'),
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
  }));
}

/**
 * Checks if a streaming message should be displayed
 */
export function shouldDisplayStreamingMessage(messageData: any): boolean {
  if (!messageData?.content) return false;
  
  // Skip error events
  if (messageData.event === "error") return false;
  
  // Check against internal patterns
  const content = typeof messageData.content === 'string' ? messageData.content : JSON.stringify(messageData.content);
  
  for (const pattern of INTERNAL_MESSAGE_PATTERNS) {
    if (pattern.test(content)) {
      return false;
    }
  }
  
  // Only display if content is substantial
  return content.trim().length > 0;
}