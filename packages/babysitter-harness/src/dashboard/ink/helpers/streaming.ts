import type { TokenUsage } from "../types.js";

export type StreamingEvent =
  | { readonly kind: "tool_start"; readonly toolName: string; readonly toolId: string }
  | { readonly kind: "tool_end"; readonly toolName: string; readonly toolId: string }
  | { readonly kind: "token_update"; readonly inputTokens: number; readonly outputTokens: number; readonly cacheReadTokens?: number; readonly cacheWriteTokens?: number }
  | { readonly kind: "cost_update"; readonly cost: number }
  | { readonly kind: "text"; readonly text: string };

export type HarnessStreamingFormat = "anthropic-sse" | "plain-text" | "codex-json" | "generic-json";

export const HARNESS_STREAMING_FORMATS: Record<string, HarnessStreamingFormat> = {
  "claude-code": "anthropic-sse",
  internal: "anthropic-sse",
  codex: "codex-json",
  "gemini-cli": "plain-text",
  cursor: "plain-text",
  "github-copilot": "plain-text",
  opencode: "plain-text",
  "oh-my-pi": "plain-text",
  pi: "plain-text",
  openclaw: "plain-text",
};

export function getHarnessStreamingFormat(harness: string): HarnessStreamingFormat {
  return HARNESS_STREAMING_FORMATS[harness] ?? "plain-text";
}

export const HARNESS_RPC_SUPPORT: Record<string, boolean> = {
  "claude-code": true,
  internal: true,
  codex: true,
};

export function getHarnessRpcSupport(harness: string): boolean {
  return HARNESS_RPC_SUPPORT[harness] === true;
}

export function parseStreamingLine(line: string, format?: HarnessStreamingFormat): StreamingEvent | null {
  const fmt = format ?? "anthropic-sse";

  if (fmt === "plain-text") {
    if (!line) return null;
    return { kind: "text", text: line };
  }

  if (fmt === "codex-json") {
    if (!line || !line.startsWith("{")) return null;
    let codexParsed: Record<string, unknown>;
    try {
      codexParsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return null;
    }

    if (typeof codexParsed !== "object" || codexParsed === null || Array.isArray(codexParsed)) return null;
    const codexType = codexParsed.type as string | undefined;
    if (codexType === "message" && typeof codexParsed.content === "string") {
      return { kind: "text", text: codexParsed.content };
    }
    if (codexType === "tool_result") {
      return {
        kind: "tool_end",
        toolName: (codexParsed.name as string) ?? "unknown",
        toolId: (codexParsed.id as string) ?? "",
      };
    }
  }

  if (fmt === "generic-json") {
    if (!line || !line.startsWith("{")) return null;
    let genericParsed: Record<string, unknown>;
    try {
      genericParsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return null;
    }

    if (typeof genericParsed !== "object" || genericParsed === null || Array.isArray(genericParsed)) return null;
    if (typeof genericParsed.text === "string" && genericParsed.text) {
      const gType = genericParsed.type as string | undefined;
      if (gType && !["content_block_start", "content_block_stop", "content_block_delta", "message_start", "message_delta", "usage", "tool_use"].includes(gType)) {
        return { kind: "text", text: genericParsed.text };
      }
    }
    if (typeof genericParsed.content === "string" && genericParsed.content) {
      const gType = genericParsed.type as string | undefined;
      if (gType && !["content_block_start", "content_block_stop", "content_block_delta", "message_start", "message_delta", "usage", "tool_use"].includes(gType)) {
        return { kind: "text", text: genericParsed.content };
      }
    }
  }

  if (!line || !line.startsWith("{")) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  if (typeof parsed.cost === "number") {
    return { kind: "cost_update", cost: parsed.cost };
  }

  const type = parsed.type as string | undefined;
  if (!type) return null;

  if (type === "tool_use") {
    return {
      kind: "tool_start",
      toolName: (parsed.name as string) ?? "unknown",
      toolId: (parsed.id as string) ?? "",
    };
  }

  if (type === "content_block_start") {
    const block = parsed.content_block as Record<string, unknown> | undefined;
    if (block?.type === "tool_use") {
      return {
        kind: "tool_start",
        toolName: (block.name as string) ?? "unknown",
        toolId: (block.id as string) ?? "",
      };
    }
  }

  if (type === "content_block_stop") {
    const block = parsed.content_block as Record<string, unknown> | undefined;
    if (block?.type === "tool_use") {
      return {
        kind: "tool_end",
        toolName: (block.name as string) ?? "unknown",
        toolId: (block.id as string) ?? "",
      };
    }
  }

  if (type === "content_block_delta") {
    const delta = parsed.delta as Record<string, unknown> | undefined;
    if (delta?.type === "text_delta" && typeof delta.text === "string") {
      return { kind: "text", text: delta.text };
    }
  }

  if (type === "message_delta" || type === "message_start") {
    const usage = type === "message_start"
      ? (parsed.message as Record<string, unknown> | undefined)?.usage as Record<string, unknown> | undefined
      : parsed.usage as Record<string, unknown> | undefined;
    if (usage) {
      return {
        kind: "token_update",
        inputTokens: (usage.input_tokens as number) ?? 0,
        outputTokens: (usage.output_tokens as number) ?? 0,
        cacheReadTokens: usage.cache_read_input_tokens as number | undefined,
        cacheWriteTokens: usage.cache_creation_input_tokens as number | undefined,
      };
    }
  }

  if (type === "usage") {
    return {
      kind: "token_update",
      inputTokens: (parsed.input_tokens as number) ?? 0,
      outputTokens: (parsed.output_tokens as number) ?? 0,
      cacheReadTokens: parsed.cache_read_input_tokens as number | undefined,
      cacheWriteTokens: parsed.cache_creation_input_tokens as number | undefined,
    };
  }

  return null;
}

interface TrackedBlock {
  readonly type: string;
  readonly name?: string;
  readonly id?: string;
}

export interface StreamingParser {
  parse(line: string): StreamingEvent | null;
  reset(): void;
}

export function createStreamingParser(format?: HarnessStreamingFormat): StreamingParser {
  const activeBlocks = new Map<number, TrackedBlock>();
  const fmt = format ?? "anthropic-sse";

  return {
    parse(line: string): StreamingEvent | null {
      if (fmt !== "anthropic-sse") {
        return parseStreamingLine(line, fmt);
      }
      if (!line || !line.startsWith("{")) return null;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(line) as Record<string, unknown>;
      } catch {
        return null;
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

      const type = parsed.type as string | undefined;
      const index = typeof parsed.index === "number" ? parsed.index : -1;

      if (type === "content_block_start" && index >= 0) {
        const block = parsed.content_block as Record<string, unknown> | undefined;
        if (block) {
          activeBlocks.set(index, {
            type: (block.type as string) ?? "unknown",
            name: block.name as string | undefined,
            id: block.id as string | undefined,
          });
        }
      }

      if (type === "content_block_stop" && index >= 0) {
        const tracked = activeBlocks.get(index);
        if (tracked) {
          activeBlocks.delete(index);
          if (tracked.type === "tool_use") {
            return {
              kind: "tool_end",
              toolName: tracked.name ?? "unknown",
              toolId: tracked.id ?? "",
            };
          }
          return null;
        }
      }

      return parseStreamingLine(line, fmt);
    },

    reset(): void {
      activeBlocks.clear();
    },
  };
}

export function formatTurnElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m${seconds}s`;
}

function formatCompactCount(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 1_000_000) {
    const k = count / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  const m = count / 1_000_000;
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
}

export function formatTokenSummary(usage: TokenUsage): string {
  const inStr = formatCompactCount(usage.input);
  const outStr = formatCompactCount(usage.output);
  let result = `${inStr}in/${outStr}out`;

  const cacheRead = usage.cacheRead ?? 0;
  const cacheWrite = usage.cacheWrite ?? 0;
  if (cacheRead > 0 || cacheWrite > 0) {
    const parts: string[] = [];
    if (cacheRead > 0) parts.push(`${formatCompactCount(cacheRead)}r`);
    if (cacheWrite > 0) parts.push(`${formatCompactCount(cacheWrite)}w`);
    result += `(${parts.join("/")}cache)`;
  }

  return result;
}
