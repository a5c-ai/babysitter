/**
 * Context compression families (GAP-PROMPT-007).
 *
 * Groups messages by role/type and applies family-specific compression
 * strategies ranging from aggressive (tool results) to minimal (system).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CompressionStrategy = 'aggressive' | 'moderate' | 'conservative' | 'minimal';

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface CompressionFamily {
  id: string;
  name: string;
  strategy: CompressionStrategy;
  /** Which message roles/types this family applies to. */
  applicableTo: MessageRole[];
  /** Custom compression function. Receives content, returns compressed content. */
  compressionFn: (content: string) => string;
}

export interface CompressibleMessage {
  role: MessageRole;
  content: string;
  /** Optional sub-type like 'thinking', 'tool-result', 'conversation'. */
  type?: string;
}

// ---------------------------------------------------------------------------
// Built-in compression functions
// ---------------------------------------------------------------------------

/**
 * Aggressive: collapse repeated whitespace, remove blank lines, truncate
 * long outputs to first/last N lines with a summary marker.
 */
function compressAggressive(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length <= 20) {
    return lines.join('\n');
  }
  const head = lines.slice(0, 8);
  const tail = lines.slice(-8);
  const omitted = lines.length - 16;
  return [...head, `[... ${omitted} lines omitted ...]`, ...tail].join('\n');
}

/**
 * Moderate: collapse repeated whitespace and trim very long lines.
 */
function compressModerate(content: string): string {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trimEnd();
      if (trimmed.length > 500) {
        return trimmed.slice(0, 497) + '...';
      }
      return trimmed;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Conservative: only collapse excessive blank lines.
 */
function compressConservative(content: string): string {
  return content.replace(/\n{4,}/g, '\n\n\n');
}

/**
 * Minimal: pass through unchanged.
 */
function compressMinimal(content: string): string {
  return content;
}

// ---------------------------------------------------------------------------
// Built-in families
// ---------------------------------------------------------------------------

export const BUILT_IN_FAMILIES: readonly CompressionFamily[] = [
  {
    id: 'tool-results',
    name: 'Tool Results',
    strategy: 'aggressive',
    applicableTo: ['tool'],
    compressionFn: compressAggressive,
  },
  {
    id: 'thinking',
    name: 'Thinking',
    strategy: 'moderate',
    applicableTo: ['assistant'],
    compressionFn: compressModerate,
  },
  {
    id: 'conversation',
    name: 'Conversation',
    strategy: 'conservative',
    applicableTo: ['user', 'assistant'],
    compressionFn: compressConservative,
  },
  {
    id: 'system',
    name: 'System',
    strategy: 'minimal',
    applicableTo: ['system'],
    compressionFn: compressMinimal,
  },
];

// ---------------------------------------------------------------------------
// selectFamily
// ---------------------------------------------------------------------------

/**
 * Select the best compression family for a given message.
 *
 * Priority:
 *  1. 'tool' role messages → tool-results (aggressive)
 *  2. Assistant messages with type 'thinking' → thinking (moderate)
 *  3. User/assistant conversation → conversation (conservative)
 *  4. System → system (minimal)
 */
export function selectFamily(message: CompressibleMessage): CompressionFamily {
  if (message.role === 'tool') {
    return BUILT_IN_FAMILIES[0]; // tool-results
  }
  if (message.role === 'assistant' && message.type === 'thinking') {
    return BUILT_IN_FAMILIES[1]; // thinking
  }
  if (message.role === 'system') {
    return BUILT_IN_FAMILIES[3]; // system
  }
  // Default: conversation
  return BUILT_IN_FAMILIES[2]; // conversation
}

// ---------------------------------------------------------------------------
// applyFamilyCompression
// ---------------------------------------------------------------------------

/**
 * Apply a compression family's strategy to content.
 */
export function applyFamilyCompression(family: CompressionFamily, content: string): string {
  return family.compressionFn(content);
}
