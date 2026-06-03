// ---------------------------------------------------------------------------
// Pure helpers shared by both server components (agent-helpers.jsx) and
// client components (session-shell.jsx).  These have zero React dependency,
// so they can be imported from either side of the SSR/client boundary.
// ---------------------------------------------------------------------------

export const TOOL_RENDERERS = {
  bash: { label: 'Shell', prefix: '>', renderInput: (input) => input?.command || 'command', renderOutput: (output) => typeof output === 'string' ? truncateText(output, 300) : output?.stdout || String(output) },
  read: { label: 'Read', prefix: '[R]', renderInput: (input) => input?.file_path || input?.path || 'file', renderOutput: (output) => truncateText(String(output), 300) },
  write: { label: 'Write', prefix: '[W]', renderInput: (input) => input?.file_path || 'file', renderOutput: () => 'File written' },
  edit: { label: 'Edit', prefix: '[E]', renderInput: (input) => input?.file_path || 'file', renderOutput: () => 'File edited' },
  glob: { label: 'Search', prefix: '[G]', renderInput: (input) => input?.pattern || 'pattern', renderOutput: (output) => Array.isArray(output) ? output.length + ' matches' : String(output) },
  grep: { label: 'Grep', prefix: '[?]', renderInput: (input) => input?.pattern || 'pattern', renderOutput: (output) => Array.isArray(output) ? output.length + ' matches' : String(output) },
  web_fetch: { label: 'Fetch', prefix: '[F]', renderInput: (input) => input?.url || 'url', renderOutput: (output) => truncateText(String(output), 200) },
  web_search: { label: 'Search', prefix: '[S]', renderInput: (input) => input?.query || 'query', renderOutput: (output) => truncateText(String(output), 200) },
};

export function truncateText(text, maxLen) {
  if (!text || text.length <= maxLen) return text || '';
  return text.slice(0, maxLen) + '...';
}

export function resolveToolRenderer(toolName) {
  const normalized = (toolName || '').toLowerCase().replace(/[^a-z_]/g, '');
  return TOOL_RENDERERS[normalized] || { label: toolName || 'Tool', prefix: '[T]', renderInput: (i) => truncateText(JSON.stringify(i), 200), renderOutput: (o) => truncateText(JSON.stringify(o), 200) };
}

export function tryParseJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

export const SEGMENT_KINDS = {
  user: { label: 'User', color: '#3b82f6' },
  assistant: { label: 'Assistant', color: '#6b7280' },
  thinking: { label: 'Thinking', color: '#a855f7' },
  tool: { label: 'Tool', color: '#f59e0b' },
  error: { label: 'Error', color: '#ef4444' },
  lifecycle: { label: 'Lifecycle', color: '#94a3b8' },
};

export function classifyMessageKind(message) {
  const role = message.role || 'unknown';
  if (role === 'user') return 'user';
  if (role === 'assistant') return 'assistant';
  if (role === 'thinking') return 'thinking';
  if (role === 'tool' || role === 'tool_use' || role === 'tool_result') return 'tool';
  if (role === 'error') return 'error';
  if (role === 'system' || role === 'lifecycle') return 'lifecycle';
  return 'lifecycle';
}

export function deriveSegments(messages) {
  if (!messages || !messages.length) return [];
  const segments = [];
  let currentKind = null;
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

export function phaseTone(phase) {
  if (!phase || phase === 'Queued' || phase === 'Pending') return 'neutral';
  if (phase === 'Active' || phase === 'Running') return 'warn';
  if (phase === 'Completed' || phase === 'Succeeded') return 'good';
  if (phase === 'Failed' || phase === 'Errored') return 'danger';
  if (phase === 'Archived') return 'neutral';
  return 'neutral';
}

export function relativeTime(timestamp) {
  if (!timestamp) return '';
  try {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    if (diffMs < 0) return 'just now';
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } catch { return String(timestamp); }
}
