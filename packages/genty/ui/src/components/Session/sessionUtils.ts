// Pure helpers for session components — no React dependency.

export interface ToolRenderer {
  label: string;
  prefix: string;
  renderInput: (input: unknown) => string;
  renderOutput: (output: unknown) => string;
}

export const TOOL_RENDERERS: Record<string, ToolRenderer> = {
  bash: { label: 'Shell', prefix: '>', renderInput: (input: unknown) => (input as Record<string, string>)?.command || 'command', renderOutput: (output: unknown) => typeof output === 'string' ? truncateText(output, 300) : (output as Record<string, string>)?.stdout || String(output) },
  read: { label: 'Read', prefix: '[R]', renderInput: (input: unknown) => (input as Record<string, string>)?.file_path || (input as Record<string, string>)?.path || 'file', renderOutput: (output: unknown) => truncateText(String(output), 300) },
  write: { label: 'Write', prefix: '[W]', renderInput: (input: unknown) => (input as Record<string, string>)?.file_path || 'file', renderOutput: () => 'File written' },
  edit: { label: 'Edit', prefix: '[E]', renderInput: (input: unknown) => (input as Record<string, string>)?.file_path || 'file', renderOutput: () => 'File edited' },
  glob: { label: 'Search', prefix: '[G]', renderInput: (input: unknown) => (input as Record<string, string>)?.pattern || 'pattern', renderOutput: (output: unknown) => Array.isArray(output) ? output.length + ' matches' : String(output) },
  grep: { label: 'Grep', prefix: '[?]', renderInput: (input: unknown) => (input as Record<string, string>)?.pattern || 'pattern', renderOutput: (output: unknown) => Array.isArray(output) ? output.length + ' matches' : String(output) },
  web_fetch: { label: 'Fetch', prefix: '[F]', renderInput: (input: unknown) => (input as Record<string, string>)?.url || 'url', renderOutput: (output: unknown) => truncateText(String(output), 200) },
  web_search: { label: 'Search', prefix: '[S]', renderInput: (input: unknown) => (input as Record<string, string>)?.query || 'query', renderOutput: (output: unknown) => truncateText(String(output), 200) },
};

export function truncateText(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '...';
}

export function resolveToolRenderer(toolName: string | undefined): ToolRenderer {
  const normalized = (toolName || '').toLowerCase().replace(/[^a-z_]/g, '');
  return TOOL_RENDERERS[normalized] || { label: toolName || 'Tool', prefix: '[T]', renderInput: (i) => truncateText(JSON.stringify(i), 200), renderOutput: (o) => truncateText(JSON.stringify(o), 200) };
}

export function tryParseJson(text: unknown): unknown {
  if (typeof text !== 'string') return text;
  try { return JSON.parse(text); } catch { return text; }
}

export interface SegmentKind {
  label: string;
  color: string;
}

export const SEGMENT_KINDS: Record<string, SegmentKind> = {
  user: { label: 'User', color: '#3b82f6' },
  assistant: { label: 'Assistant', color: '#6b7280' },
  thinking: { label: 'Thinking', color: '#a855f7' },
  tool: { label: 'Tool', color: '#f59e0b' },
  error: { label: 'Error', color: '#ef4444' },
  lifecycle: { label: 'Lifecycle', color: '#94a3b8' },
};

export interface TranscriptMessage {
  role?: string;
  content?: unknown;
  toolName?: string;
  name?: string;
  input?: unknown;
  output?: unknown;
  status?: string;
}

export function classifyMessageKind(message: TranscriptMessage): string {
  const role = message.role || 'unknown';
  if (role === 'user') return 'user';
  if (role === 'assistant') return 'assistant';
  if (role === 'thinking') return 'thinking';
  if (role === 'tool' || role === 'tool_use' || role === 'tool_result') return 'tool';
  if (role === 'error') return 'error';
  if (role === 'system' || role === 'lifecycle') return 'lifecycle';
  return 'lifecycle';
}

export interface Segment {
  kind: string;
  count: number;
}

export function deriveSegments(messages: TranscriptMessage[]): Segment[] {
  if (!messages || !messages.length) return [];
  const segments: Segment[] = [];
  let currentKind: string | null = null;
  let currentCount = 0;
  for (const msg of messages) {
    const kind = classifyMessageKind(msg);
    if (kind === currentKind) {
      currentCount++;
    } else {
      if (currentKind) segments.push({ kind: currentKind, count: currentCount });
      currentKind = kind;
      currentCount = 1;
    }
  }
  if (currentKind) segments.push({ kind: currentKind, count: currentCount });
  return segments;
}

export function phaseTone(phase: string | undefined | null): string {
  if (!phase || phase === 'Queued' || phase === 'Pending') return 'neutral';
  if (phase === 'Active' || phase === 'Running') return 'warn';
  if (phase === 'Completed' || phase === 'Succeeded') return 'good';
  if (phase === 'Failed' || phase === 'Errored') return 'danger';
  if (phase === 'Archived') return 'neutral';
  return 'neutral';
}
