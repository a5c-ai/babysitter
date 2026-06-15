// MessageTypeRenderer.ts — Message type detection and rendering (GAP-UX-001d)
// Pure TypeScript: detects message types and renders with appropriate formatting.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageType = 'text' | 'code' | 'tool_call' | 'tool_result' | 'thinking' | 'error' | 'system';

// ---------------------------------------------------------------------------
// Message type detection
// ---------------------------------------------------------------------------

const CODE_BLOCK_PATTERN = /^```[\s\S]*```$/m;
const TOOL_CALL_PATTERN = /^\s*\{[\s\S]*"tool_name"\s*:/;
const TOOL_RESULT_PATTERN = /^\s*\{[\s\S]*"tool_result"\s*:/;
const THINKING_PATTERN = /^<thinking>[\s\S]*<\/thinking>$/;
const ERROR_PATTERN = /^(Error|ERROR|Exception|FATAL|Traceback)[\s:]/;
const SYSTEM_PATTERN = /^\[system\]|^\[SYSTEM\]/;

export function detectMessageType(content: string): MessageType {
  const trimmed = content.trim();

  if (SYSTEM_PATTERN.test(trimmed)) return 'system';
  if (ERROR_PATTERN.test(trimmed)) return 'error';
  if (THINKING_PATTERN.test(trimmed)) return 'thinking';
  if (TOOL_CALL_PATTERN.test(trimmed)) return 'tool_call';
  if (TOOL_RESULT_PATTERN.test(trimmed)) return 'tool_result';
  if (CODE_BLOCK_PATTERN.test(trimmed)) return 'code';

  return 'text';
}

// ---------------------------------------------------------------------------
// Text formatting
// ---------------------------------------------------------------------------

const TYPE_PREFIX: Record<MessageType, string> = {
  text: '',
  code: '┌─ code ──────────────────\n',
  tool_call: '⇒ Tool Call:\n',
  tool_result: '⇐ Tool Result:\n',
  thinking: '\u{1F4AD} Thinking:\n',
  error: '⚠ Error:\n',
  system: 'ℹ System:\n',
};

const TYPE_SUFFIX: Record<MessageType, string> = {
  text: '',
  code: '\n└─────────────────────────┘',
  tool_call: '',
  tool_result: '',
  thinking: '',
  error: '',
  system: '',
};

function stripCodeFences(content: string): string {
  return content.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
}

function stripThinkingTags(content: string): string {
  return content.replace(/^<thinking>\n?/, '').replace(/\n?<\/thinking>$/, '');
}

export function formatMessageText(content: string, type: MessageType): string {
  let body = content;

  switch (type) {
    case 'code':
      body = stripCodeFences(body.trim());
      break;
    case 'thinking':
      body = stripThinkingTags(body.trim());
      break;
  }

  return `${TYPE_PREFIX[type]}${body}${TYPE_SUFFIX[type]}`;
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TYPE_HTML_CLASS: Record<MessageType, string> = {
  text: 'msg-text',
  code: 'msg-code',
  tool_call: 'msg-tool-call',
  tool_result: 'msg-tool-result',
  thinking: 'msg-thinking',
  error: 'msg-error',
  system: 'msg-system',
};

export function formatMessageHtml(content: string, type: MessageType): string {
  const cls = TYPE_HTML_CLASS[type];
  let body = content;

  switch (type) {
    case 'code':
      body = stripCodeFences(body.trim());
      return `<div class="${cls}"><pre><code>${escapeHtml(body)}</code></pre></div>`;
    case 'thinking':
      body = stripThinkingTags(body.trim());
      return `<div class="${cls}"><em>${escapeHtml(body)}</em></div>`;
    case 'error':
      return `<div class="${cls}"><strong>${escapeHtml(body)}</strong></div>`;
    case 'tool_call':
      return `<div class="${cls}"><pre class="tool-call">${escapeHtml(body)}</pre></div>`;
    case 'tool_result':
      return `<div class="${cls}"><pre class="tool-result">${escapeHtml(body)}</pre></div>`;
    case 'system':
      return `<div class="${cls}"><span class="system-msg">${escapeHtml(body)}</span></div>`;
    default:
      return `<div class="${cls}"><p>${escapeHtml(body)}</p></div>`;
  }
}
