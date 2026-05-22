/**
 * Shared filesystem helpers for adapter session and config I/O.
 *
 * Kept intentionally dependency-free — only uses `node:fs/promises`
 * and `node:path` with forward-slash-safe joins.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { writeFileAtomic, writeJsonAtomic } from '@a5c-ai/agent-mux-core';
import type { CostRecord, SessionMessage, SessionToolCall } from '@a5c-ai/agent-mux-core';

/**
 * Recursively list all files matching `predicate` under `dir`.
 * Returns absolute paths with forward slashes.
 * If `dir` does not exist, returns an empty array.
 */

import * as syncFs from 'node:fs';

export function findProjectRootSync(startDir = process.cwd()): string {
  let current = path.resolve(startDir);
  while (true) {
    if (
      syncFs.existsSync(path.join(current, '.git')) ||
      syncFs.existsSync(path.join(current, '.a5c')) ||
      syncFs.existsSync(path.join(current, '.claude.json')) ||
      syncFs.existsSync(path.join(current, '.claude'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

export async function listFilesRecursive(
  dir: string,
  predicate: (entryName: string, fullPath: string) => boolean,
): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string): Promise<void> {
    let entries: import('node:fs').Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && predicate(entry.name, full)) {
        out.push(full.split(path.sep).join('/'));
      }
    }
  }
  await walk(dir);
  return out;
}

/** List *.jsonl files recursively under `dir`. */
export async function listJsonlFiles(dir: string): Promise<string[]> {
  return listFilesRecursive(dir, (name) => name.toLowerCase().endsWith('.jsonl'));
}

/** List *.json files recursively under `dir`. */
export async function listJsonFiles(dir: string): Promise<string[]> {
  return listFilesRecursive(dir, (name) => name.toLowerCase().endsWith('.json'));
}

/**
 * Parse a JSONL file into an array of record objects (ignores blank lines
 * and lines that fail to parse). Returns empty array if file missing.
 */
export async function parseJsonlFile(filePath: string): Promise<Record<string, unknown>[]> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return [];
  }
  const rows: Record<string, unknown>[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        rows.push(parsed as Record<string, unknown>);
      }
    } catch {
      // skip malformed line
    }
  }
  return rows;
}

/** Read + parse a JSON file. Returns null if missing or invalid. */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Atomically write JSON via the unified core helper (tmp + fsync + rename
 * with advisory lockfile). Creates parent directories as needed.
 */
export async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  await writeJsonAtomic(filePath, data);
}

/**
 * Minimal flat-YAML parser for simple `key: value` files.
 * Supports:
 *  - comments (# ...)
 *  - scalar values (strings, numbers, booleans, null)
 *  - quoted strings ("..." or '...')
 *  - simple nested blocks via two-space indentation (one level deep)
 * Does NOT support lists, anchors, multi-line strings.
 */
export function parseFlatYaml(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let currentParent: Record<string, unknown> | null = null;
  let currentParentIndent = -1;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+#.*$/, '').replace(/^#.*$/, '');
    if (!line.trim()) continue;
    const indentMatch = /^(\s*)/.exec(line);
    const indent = indentMatch ? indentMatch[1]!.length : 0;
    const content = line.slice(indent);
    const colonIdx = content.indexOf(':');
    if (colonIdx === -1) continue;
    const key = content.slice(0, colonIdx).trim();
    const valueRaw = content.slice(colonIdx + 1).trim();
    const target = indent > currentParentIndent && currentParent ? currentParent : out;
    if (valueRaw === '') {
      // Start of a nested block
      const child: Record<string, unknown> = {};
      out[key] = child;
      currentParent = child;
      currentParentIndent = indent;
    } else {
      target[key] = coerceYamlScalar(valueRaw);
      if (target === out) {
        currentParent = null;
        currentParentIndent = -1;
      }
    }
  }
  return out;
}

function coerceYamlScalar(s: string): unknown {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^-?\d+\.\d+$/.test(s)) return Number(s);
  return s;
}

/** Serialize a flat object to simple YAML (top-level + one level of nesting). */
export function stringifyFlatYaml(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        lines.push(`  ${k}: ${formatYamlScalar(v)}`);
      }
    } else {
      lines.push(`${key}: ${formatYamlScalar(value)}`);
    }
  }
  return lines.join('\n') + '\n';
}

function formatYamlScalar(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') {
    if (/[:#\n]/.test(v) || v === '' || /^\s|\s$/.test(v)) {
      return JSON.stringify(v);
    }
    return v;
  }
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  return JSON.stringify(v);
}

/** Atomically write arbitrary text via the unified core helper. */
export async function writeTextFileAtomic(filePath: string, text: string): Promise<void> {
  await writeFileAtomic(filePath, text);
}

/** fs.stat safely: returns null on ENOENT. */
export async function statSafe(
  filePath: string,
): Promise<{ mtimeMs: number; birthtimeMs: number; size: number } | null> {
  try {
    const st = await fs.stat(filePath);
    return { mtimeMs: st.mtimeMs, birthtimeMs: st.birthtimeMs, size: st.size };
  } catch {
    return null;
  }
}

/**
 * Normalize a path to forward slashes (Windows-safe, cross-platform).
 */
export function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/**
 * Home-directory-relative join with forward slashes.
 */
export function homeJoin(...segments: string[]): string {
  return toPosix(path.join(os.homedir(), ...segments));
}

/**
 * Shared `parseSessionFile` logic: read JSONL, derive createdAt from
 * file stat birthtime, updatedAt from mtime, and build SessionMessage[]
 * from rows via `rowToMessage` heuristics.
 * The caller supplies the agent name.
 */
export async function parseJsonlSessionFile(
  filePath: string,
  agent: string,
): Promise<{
  sessionId: string;
  agent: string;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
  messages: SessionMessage[];
  raw: unknown;
}> {
  const sessionId = path.basename(filePath, path.extname(filePath));
  const rows = await parseJsonlFile(filePath);
  const messages: SessionMessage[] = [];
  const toolCallsById = new Map<string, SessionToolCall>();
  for (const row of rows) {
    const parsedMessages = rowToMessages(row, toolCallsById);
    if (parsedMessages.length > 0) {
      messages.push(...parsedMessages);
    }
  }
  const stat = await statSafe(filePath);
  const now = new Date().toISOString();
  const createdAt = stat ? new Date(stat.birthtimeMs || stat.mtimeMs).toISOString() : now;
  const updatedAt = stat ? new Date(stat.mtimeMs).toISOString() : now;
  // A "turn" = user message; fallback to assistant count when no users.
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const assistantTurns = messages.filter((m) => m.role === 'assistant').length;
  const turnCount = userTurns || assistantTurns;
  return { sessionId, agent, turnCount, createdAt, updatedAt, messages, raw: rows };
}

export async function parseCodexSessionFile(
  filePath: string,
  agent: string,
): Promise<{
  sessionId: string;
  agent: string;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
  title?: string;
  model?: string;
  cost?: CostRecord;
  cwd?: string;
  messages: SessionMessage[];
  raw: unknown;
}> {
  const rows = await parseJsonlFile(filePath);
  const stat = await statSafe(filePath);
  const now = new Date().toISOString();
  const createdAt = stat ? new Date(stat.birthtimeMs || stat.mtimeMs).toISOString() : now;
  const updatedAt = stat ? new Date(stat.mtimeMs).toISOString() : now;

  let sessionId = path.basename(filePath, path.extname(filePath));
  let cwd: string | undefined;
  let model: string | undefined;
  let title: string | undefined;
  let sessionCost: CostRecord | undefined;
  const messages: SessionMessage[] = [];
  const toolCalls = new Map<string, SessionToolCall>();

  for (const row of rows) {
    const rowType = typeof row['type'] === 'string' ? row['type'] : '';

    if (rowType === 'session_meta') {
      const payload = row['payload'];
      if (payload && typeof payload === 'object') {
        const meta = payload as Record<string, unknown>;
        if (typeof meta['cwd'] === 'string' && meta['cwd'].length > 0) {
          cwd = String(meta['cwd']);
        }
      }
      continue;
    }

    if (rowType === 'turn_context') {
      const payload = row['payload'];
      if (payload && typeof payload === 'object') {
        const turnContext = payload as Record<string, unknown>;
        if (typeof turnContext['model'] === 'string' && turnContext['model'].length > 0) {
          model = String(turnContext['model']);
        }
      }
      continue;
    }

    if (rowType === 'event_msg') {
      const payload = row['payload'];
      if (!payload || typeof payload !== 'object') {
        continue;
      }
      const event = payload as Record<string, unknown>;
      if (event['type'] !== 'token_count') {
        continue;
      }
      const estimatedCost = estimateCodexSessionCost(event, model);
      if (estimatedCost) {
        sessionCost = estimatedCost;
      }
      continue;
    }

    if (rowType !== 'response_item') {
      continue;
    }

    const payload = row['payload'];
    if (!payload || typeof payload !== 'object') {
      continue;
    }
    const item = payload as Record<string, unknown>;
    const itemType = typeof item['type'] === 'string' ? item['type'] : '';

    if (itemType === 'message') {
      const roleRaw = typeof item['role'] === 'string' ? item['role'] : '';
      if (roleRaw !== 'user' && roleRaw !== 'assistant') {
        continue;
      }
      const text = flattenCodexMessageText(item['content']);
      if (shouldSkipCodexBootstrapMessage(roleRaw, text)) {
        continue;
      }
      if (roleRaw === 'user' && !title && text.length > 0) {
        title = text.length > 80 ? `${text.slice(0, 77)}...` : text;
      }
      messages.push({
        role: roleRaw,
        content: text,
      });
      continue;
    }

    if (itemType === 'function_call') {
      const toolCallId = String(item['call_id'] ?? item['id'] ?? '');
      const toolName = String(item['name'] ?? 'tool');
      const input = parseMaybeJson(item['arguments']);
      const toolCall: SessionToolCall = {
        toolCallId,
        toolName,
        input,
      };
      toolCalls.set(toolCallId, toolCall);
      messages.push({
        role: 'assistant',
        content: '',
        toolCalls: [toolCall],
      });
      continue;
    }

    if (itemType === 'function_call_output') {
      const toolCallId = String(item['call_id'] ?? item['id'] ?? '');
      const knownToolCall = toolCalls.get(toolCallId);
      const toolName = knownToolCall?.toolName ?? String(item['name'] ?? 'tool');
      const output = item['output'] ?? '';
      messages.push({
        role: 'tool',
        content: typeof output === 'string' ? output : renderStructuredValue(output),
        toolResult: {
          toolCallId,
          toolName,
          output,
        },
      });
    }
  }

  const userTurns = messages.filter((message) => message.role === 'user').length;
  const assistantTurns = messages.filter((message) => message.role === 'assistant').length;
  const turnCount = userTurns || assistantTurns;

  return {
    sessionId,
    agent,
    turnCount,
    createdAt,
    updatedAt,
    title,
    model,
    cost: sessionCost,
    cwd,
    messages,
    raw: rows,
  };
}

type CodexSessionPricing = {
  inputPricePerMillion: number;
  cachedInputPricePerMillion: number;
  outputPricePerMillion: number;
};

const CODEX_SESSION_PRICING: Record<string, CodexSessionPricing> = {
  'gpt-5.4': {
    inputPricePerMillion: 2.5,
    cachedInputPricePerMillion: 0.25,
    outputPricePerMillion: 15,
  },
  'gpt-5.3-codex': {
    inputPricePerMillion: 1.75,
    cachedInputPricePerMillion: 0.175,
    outputPricePerMillion: 14,
  },
  'gpt-5-codex': {
    inputPricePerMillion: 1.25,
    cachedInputPricePerMillion: 0.125,
    outputPricePerMillion: 10,
  },
  'gpt-5.1-codex-mini': {
    inputPricePerMillion: 0.25,
    cachedInputPricePerMillion: 0.025,
    outputPricePerMillion: 2,
  },
};

function estimateCodexSessionCost(
  event: Record<string, unknown>,
  model: string | undefined,
): CostRecord | undefined {
  if (!model) {
    return undefined;
  }
  const pricing = CODEX_SESSION_PRICING[model];
  if (!pricing) {
    return undefined;
  }

  const info = event['info'];
  if (!info || typeof info !== 'object') {
    return undefined;
  }
  const totalTokenUsage = (info as Record<string, unknown>)['total_token_usage'];
  if (!totalTokenUsage || typeof totalTokenUsage !== 'object') {
    return undefined;
  }

  const usage = totalTokenUsage as Record<string, unknown>;
  const inputTokens = numberField(usage['input_tokens']);
  const cachedTokens = numberField(usage['cached_input_tokens']) ?? 0;
  const outputTokens = numberField(usage['output_tokens']);
  const thinkingTokens = numberField(usage['reasoning_output_tokens']) ?? 0;

  if (inputTokens == null || outputTokens == null) {
    return undefined;
  }

  const uncachedInputTokens = Math.max(inputTokens - cachedTokens, 0);
  const totalUsd =
    ((uncachedInputTokens / 1_000_000) * pricing.inputPricePerMillion) +
    ((cachedTokens / 1_000_000) * pricing.cachedInputPricePerMillion) +
    (((outputTokens + thinkingTokens) / 1_000_000) * pricing.outputPricePerMillion);

  return {
    totalUsd,
    inputTokens,
    outputTokens,
    thinkingTokens,
    cachedTokens,
  };
}

function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Derive a SessionMessage-like representation from an arbitrary JSONL row.
 * Used by adapters that don't have a more precise schema.
 */
export function rowToMessage(row: Record<string, unknown>): {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
} | null {
  return rowToMessages(row)[0] ?? null;
}

function rowToMessages(
  row: Record<string, unknown>,
  toolCallsById = new Map<string, SessionToolCall>(),
): SessionMessage[] {
  const nestedMessage = row['message'];
  const envelope = nestedMessage && typeof nestedMessage === 'object'
    ? (nestedMessage as Record<string, unknown>)
    : row;
  const role = normalizeSessionRole(envelope['role'] ?? row['role'] ?? row['sender'] ?? row['type']);
  if (!role) {
    return [];
  }

  const timestamp = parseSessionTimestamp(row['timestamp'] ?? envelope['timestamp']);
  const thinkingText = flattenStructuredText(envelope['thinking']);
  const contentInfo = parseStructuredContent(envelope['content'], toolCallsById);
  const messages: SessionMessage[] = [];

  if (role === 'assistant') {
    if (contentInfo.toolCalls) {
      for (const toolCall of contentInfo.toolCalls) {
        toolCallsById.set(toolCall.toolCallId, toolCall);
      }
    }
    const assistantText = contentInfo.text.length > 0
      ? contentInfo.text
      : flattenStructuredText(
          envelope['text'] ??
          (nestedMessage && typeof nestedMessage !== 'object' ? nestedMessage : row['text'] ?? row['message']),
        );
    if (assistantText.length > 0 || contentInfo.toolCalls?.length || contentInfo.thinking.length > 0) {
      messages.push({
        role,
        content: assistantText,
        ...(timestamp ? { timestamp } : {}),
        ...(contentInfo.toolCalls?.length ? { toolCalls: contentInfo.toolCalls } : {}),
        ...(contentInfo.thinking.length > 0
          ? { thinking: joinTextParts([contentInfo.thinking, thinkingText].filter((value) => value.length > 0)) }
          : thinkingText.length > 0
            ? { thinking: thinkingText }
            : {}),
      });
    }
    return messages;
  }

  if (role === 'user') {
    if (contentInfo.text.length > 0) {
      messages.push({
        role,
        content: contentInfo.text,
        ...(timestamp ? { timestamp } : {}),
      });
    }
    for (const toolResult of contentInfo.toolResults) {
      messages.push({
        role: 'tool',
        content: toolResult.text,
        ...(timestamp ? { timestamp } : {}),
        toolResult: {
          toolCallId: toolResult.toolCallId,
          toolName: toolResult.toolName,
          output: toolResult.output,
        },
      });
    }
    return messages;
  }

  const directContent = contentInfo.text.length > 0
    ? contentInfo.text
    : flattenStructuredText(
        envelope['content'] ??
        envelope['text'] ??
        (nestedMessage && typeof nestedMessage !== 'object' ? nestedMessage : row['text'] ?? row['message']),
      );
  if (directContent.length === 0 && role !== 'tool') {
    return [];
  }
  messages.push({
    role,
    content: directContent,
    ...(timestamp ? { timestamp } : {}),
  });
  return messages;
}

function normalizeSessionRole(value: unknown): SessionMessage['role'] | null {
  if (value === 'user' || value === 'human') {
    return 'user';
  }
  if (value === 'assistant' || value === 'ai' || value === 'model') {
    return 'assistant';
  }
  if (value === 'system') {
    return 'system';
  }
  if (value === 'tool' || value === 'tool_result' || value === 'tool_use') {
    return 'tool';
  }
  return null;
}

function parseSessionTimestamp(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : undefined;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) {
      return parsed;
    }
  }
  return undefined;
}

function flattenStructuredText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    const parts = value.flatMap((entry) => {
      if (typeof entry === 'string') {
        return [entry];
      }
      if (!entry || typeof entry !== 'object') {
        return [];
      }
      const block = entry as Record<string, unknown>;
      const blockType = typeof block['type'] === 'string' ? block['type'] : '';
      if (blockType === 'tool_use') {
        return [];
      }
      if (blockType === 'text' && typeof block['text'] === 'string') {
        return [block['text']];
      }
      if (blockType === 'thinking' && typeof block['thinking'] === 'string') {
        return [block['thinking']];
      }
      if (blockType === 'tool_result') {
        return [flattenStructuredText(block['content'] ?? block['tool_use_result'] ?? block['output'])];
      }
      if (typeof block['text'] === 'string') {
        return [block['text']];
      }
      if (typeof block['content'] === 'string' || Array.isArray(block['content'])) {
        return [flattenStructuredText(block['content'])];
      }
      if (typeof block['thinking'] === 'string') {
        return [block['thinking']];
      }
      return [];
    }).filter((part) => part.length > 0);
    return joinTextParts(parts);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record['text'] === 'string') {
      return record['text'];
    }
    if (typeof record['thinking'] === 'string') {
      return record['thinking'];
    }
    if ('content' in record) {
      return flattenStructuredText(record['content']);
    }
  }
  if (value == null) {
    return '';
  }
  return renderStructuredValue(value);
}

function parseStructuredContent(
  value: unknown,
  toolCallsById: Map<string, SessionToolCall>,
): {
  text: string;
  thinking: string;
  toolCalls?: SessionToolCall[];
  toolResults: Array<{ toolCallId: string; toolName: string; output: unknown; text: string }>;
} {
  if (!Array.isArray(value)) {
    return {
      text: flattenStructuredText(value),
      thinking: '',
      toolResults: [],
    };
  }

  const textParts: string[] = [];
  const thinkingParts: string[] = [];
  const toolCalls: SessionToolCall[] = [];
  const toolResults: Array<{ toolCallId: string; toolName: string; output: unknown; text: string }> = [];

  for (const entry of value) {
    if (typeof entry === 'string') {
      if (entry.length > 0) {
        textParts.push(entry);
      }
      continue;
    }
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const block = entry as Record<string, unknown>;
    const blockType = typeof block['type'] === 'string' ? block['type'] : '';
    if (blockType === 'text' && typeof block['text'] === 'string') {
      textParts.push(block['text']);
      continue;
    }
    if (blockType === 'thinking' && typeof block['thinking'] === 'string') {
      thinkingParts.push(block['thinking']);
      continue;
    }
    if (blockType === 'tool_use') {
      const toolCallId = String(block['id'] ?? block['tool_use_id'] ?? '');
      const toolName = String(block['name'] ?? 'tool');
      if (toolCallId.length > 0) {
        toolCalls.push({
          toolCallId,
          toolName,
          input: block['input'],
        });
      }
      continue;
    }
    if (blockType === 'tool_result') {
      const toolCallId = String(block['tool_use_id'] ?? block['toolCallId'] ?? block['id'] ?? '');
      const output = block['content'] ?? block['tool_use_result'] ?? block['output'] ?? '';
      const resolvedToolName = toolCallsById.get(toolCallId)?.toolName;
      toolResults.push({
        toolCallId,
        toolName: resolvedToolName ?? String(block['tool_name'] ?? 'tool'),
        output,
        text: flattenStructuredText(output),
      });
      continue;
    }

    const fallbackText = flattenStructuredText(block);
    if (fallbackText.length > 0) {
      textParts.push(fallbackText);
    }
  }

  return {
    text: joinTextParts(textParts),
    thinking: joinTextParts(thinkingParts),
    ...(toolCalls.length > 0 ? { toolCalls } : {}),
    toolResults,
  };
}

function joinTextParts(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join('\n\n');
}

function flattenCodexMessageText(content: unknown): string {
  if (!Array.isArray(content)) {
    return '';
  }
  const parts = content.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }
    const block = entry as Record<string, unknown>;
    const blockType = typeof block['type'] === 'string' ? block['type'] : '';
    if ((blockType === 'input_text' || blockType === 'output_text') && typeof block['text'] === 'string') {
      return [block['text']];
    }
    return [];
  });
  return parts.join('\n').trim();
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function renderStructuredValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function shouldSkipCodexBootstrapMessage(role: string, text: string): boolean {
  if (role !== 'user') {
    return false;
  }
  return text.startsWith('# AGENTS.md instructions for ') && text.includes('<environment_context>');
}
