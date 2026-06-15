/**
 * GAP-TOOLS-012: LSP Integration for Code-Aware Routing.
 *
 * Provides types and utilities for resolving language-server symbols
 * and injecting them as context into prompts for model routing.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LspServerConfig {
  /** Language identifier (e.g. "typescript", "python"). */
  languageId: string;
  /** Command to spawn the LSP server. */
  command: string;
  /** Arguments passed to the command. */
  args: string[];
  /** Root URI of the workspace (file:// scheme). */
  rootUri: string;
}

export type LspSymbolKind = 'function' | 'class' | 'variable' | 'type';

export interface LspSymbolInfo {
  /** Symbol name. */
  name: string;
  /** Symbol kind. */
  kind: LspSymbolKind;
  /** Source location. */
  location: {
    file: string;
    line: number;
    col: number;
  };
}

export interface LspRouteHint {
  /** The symbol this hint relates to. */
  symbol: LspSymbolInfo;
  /** Files that are relevant to this symbol. */
  relevantFiles: string[];
  /** Optional model suggestion for routing. */
  suggestedModel?: string;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Match prompt keywords against known symbols.
 * Returns symbols whose name appears as a word boundary match in the prompt.
 */
export function resolveSymbolsForPrompt(
  symbols: LspSymbolInfo[],
  prompt: string,
): LspSymbolInfo[] {
  if (!prompt.trim()) return [];
  const lowerPrompt = prompt.toLowerCase();
  return symbols.filter((sym) => {
    const pattern = new RegExp(`\\b${escapeRegExp(sym.name)}\\b`, 'i');
    return pattern.test(lowerPrompt);
  });
}

/**
 * Render symbol information as a human-readable context block
 * suitable for injection into a system or user prompt.
 */
export function formatSymbolContext(symbols: LspSymbolInfo[]): string {
  if (symbols.length === 0) return '';

  const lines = symbols.map((sym) => {
    const loc = `${sym.location.file}:${sym.location.line}:${sym.location.col}`;
    return `- ${sym.kind} \`${sym.name}\` at ${loc}`;
  });

  return `## Relevant Symbols\n\n${lines.join('\n')}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
