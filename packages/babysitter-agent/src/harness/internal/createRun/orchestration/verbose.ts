import {
  CYAN,
  DIM,
  AgentCoreSessionHandle,
  RESET,
  type OutputMode,
  type AgentCoreSessionEvent,
} from "../utils";

export function subscribeVerbosePiEvents(
  session: AgentCoreSessionHandle,
  label: string,
  opts: { verbose: boolean; json: boolean; outputMode?: OutputMode },
): (() => void) | null {
  if (opts.json || opts.outputMode === "tui") return null;

  let textBuffer = "";
  let lastTextFlush = 0;
  const textFlushIntervalMs = 2000;
  const textSnippetLength = 120;
  let lastStructuredMessage = "";

  try {
    return session.subscribe((event: AgentCoreSessionEvent) => {
      const eventType = event.type;

      if (eventType === "tool_execution_start") {
        if (textBuffer.trim()) {
          const snippet = textBuffer.trim().slice(0, textSnippetLength);
          process.stderr.write(`    ${DIM}${snippet}${snippet.length < textBuffer.trim().length ? "..." : ""}${RESET}\n`);
          textBuffer = "";
        }
        const name = extractVerboseToolName(event);
        process.stderr.write(`    ${DIM}tool ${CYAN}${name}${RESET}${DIM}...${RESET}\n`);
        if (opts.verbose) {
          const argsSnippet = formatVerbosePayload(
            extractVerboseToolArgs(event),
            textSnippetLength,
          );
          if (argsSnippet) {
            process.stderr.write(`    ${DIM}  args ${argsSnippet}${RESET}\n`);
          }
        }
        return;
      }

      if (eventType === "tool_execution_end") {
        const resultSnippet = formatVerbosePayload(
          extractVerboseToolResult(event),
          textSnippetLength,
        );
        if (resultSnippet) {
          process.stderr.write(`    ${DIM}  → ${resultSnippet}${RESET}\n`);
        }
        return;
      }

      if (eventType === "agent_start") {
        const agentName = (event as { name?: string }).name
          ?? (event as { agentName?: string }).agentName;
        const suffix = agentName ? ` ${CYAN}${agentName}${RESET}` : "";
        process.stderr.write(`    ${DIM}subagent${RESET}${suffix}${DIM}...${RESET}\n`);
        return;
      }

      if (eventType === "agent_end") {
        return;
      }

      if (eventType === "text_delta") {
        const text = (event as { text?: string }).text;
        if (!text) {
          return;
        }
        textBuffer += text;
        const now = Date.now();
        if (opts.verbose) {
          process.stderr.write(text);
          return;
        }
        if (now - lastTextFlush >= textFlushIntervalMs && textBuffer.trim().length > 20) {
          const lines = textBuffer.trim().split("\n");
          const lastLine = lines[lines.length - 1]?.trim() ?? "";
          if (lastLine.length > 10) {
            const snippet = lastLine.slice(0, textSnippetLength);
            process.stderr.write(`    ${DIM}... ${snippet}${snippet.length < lastLine.length ? "..." : ""}${RESET}\n`);
          }
          textBuffer = "";
          lastTextFlush = now;
        }
        return;
      }

      if (eventType === "message_end" || eventType === "turn_end") {
        const role = extractVerboseMessageRole(event);
        const structuredMessage = formatVerbosePayload(
          extractVerboseMessagePayload(event),
          textSnippetLength * 2,
        );
        if (
          structuredMessage &&
          structuredMessage !== lastStructuredMessage &&
          (!textBuffer.trim() ||
            normalizeVerboseText(textBuffer) !== normalizeVerboseText(structuredMessage))
        ) {
          const prefix = role === "toolResult" ? "    " : "";
          process.stderr.write(`${prefix}${structuredMessage}\n`);
          lastStructuredMessage = structuredMessage;
        }
        if (textBuffer.trim().length > 20 && !opts.verbose) {
          const snippet = textBuffer.trim().slice(-textSnippetLength);
          process.stderr.write(`    ${DIM}... ${snippet}${RESET}\n`);
        }
        textBuffer = "";
        if (opts.verbose) {
          process.stderr.write(`${DIM}[${label} ${eventType}]${RESET}\n`);
        }
        return;
      }

      if (!opts.verbose) {
        return;
      }
      if (eventType === "turn_start") {
        process.stderr.write(`${DIM}[${label} turn:start]${RESET}\n`);
      } else if (eventType === "message_start") {
        const role = (event as { role?: string; message?: { role?: string } }).role
          ?? (event as { message?: { role?: string } }).message?.role
          ?? "";
        if (role) {
          process.stderr.write(`${DIM}[${label} message:start] role=${role}${RESET}\n`);
        }
      }
    });
  } catch {
    return null;
  }
}

function normalizeVerboseText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatVerbosePayload(value: unknown, maxLength: number): string | undefined {
  const text = extractVerboseText(value);
  if (!text) {
    return undefined;
  }
  const normalized = normalizeVerboseText(text);
  if (!normalized) {
    return undefined;
  }
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}

function extractVerboseToolName(event: AgentCoreSessionEvent): string {
  const record = event as Record<string, unknown>;
  const directName = [
    record.name,
    record.toolName,
    record.tool,
    record.call,
    record.invocation,
  ].find((value) => typeof value === "string");
  if (typeof directName === "string" && directName.trim()) {
    return directName.trim();
  }

  for (const candidate of [record.tool, record.call, record.invocation, record.message]) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    const nested = candidate as Record<string, unknown>;
    const name = [nested.name, nested.toolName, nested.id].find(
      (value) => typeof value === "string",
    );
    if (typeof name === "string" && name.trim()) {
      return name.trim();
    }
  }

  return "unknown";
}

function extractVerboseToolArgs(event: AgentCoreSessionEvent): unknown {
  const record = event as Record<string, unknown>;
  return record.input
    ?? record.args
    ?? record.arguments
    ?? record.parameters
    ?? (record.tool && typeof record.tool === "object"
      ? (record.tool as Record<string, unknown>).input
      : undefined)
    ?? (record.call && typeof record.call === "object"
      ? (record.call as Record<string, unknown>).input
      : undefined);
}

function extractVerboseToolResult(event: AgentCoreSessionEvent): unknown {
  const record = event as Record<string, unknown>;
  return record.result
    ?? record.output
    ?? record.details
    ?? record.message
    ?? record.content;
}

function extractVerboseMessageRole(event: AgentCoreSessionEvent): string | undefined {
  const record = event as Record<string, unknown>;
  if (typeof record.role === "string") {
    return record.role;
  }
  const message = record.message;
  if (!message || typeof message !== "object") {
    return undefined;
  }
  const role = (message as Record<string, unknown>).role;
  return typeof role === "string" ? role : undefined;
}

function extractVerboseMessagePayload(event: AgentCoreSessionEvent): unknown {
  const record = event as Record<string, unknown>;
  return record.message ?? record.content ?? record.output;
}

function extractVerboseText(value: unknown, depth = 0): string | undefined {
  if (depth > 4 || value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => extractVerboseText(entry, depth + 1))
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    return parts.length > 0 ? parts.join("\n") : undefined;
  }
  if (typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of [
    "text",
    "content",
    "message",
    "output",
    "result",
    "details",
    "delta",
    "summary",
    "error",
    "value",
  ]) {
    if (!(key in record)) {
      continue;
    }
    const extracted = extractVerboseText(record[key], depth + 1);
    if (typeof extracted === "string" && extracted.trim()) {
      parts.push(extracted);
    }
  }
  if (parts.length > 0) {
    return Array.from(new Set(parts)).join("\n");
  }

  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}
