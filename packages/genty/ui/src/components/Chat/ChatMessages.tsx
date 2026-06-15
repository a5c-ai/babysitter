import React, { useState, useCallback } from 'react';
import { styles } from './chatStyles.js';

/* ───────────── relative timestamp ───────────── */
export function timeAgo(ts: string | undefined | null): string {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/* ───────────── copy button ───────────── */
export interface CopyButtonProps {
  text: string;
  style?: React.CSSProperties;
}

export function CopyButton({ text, style: extraStyle }: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch((err: Error) => console.warn('[genty]', err.message || err));
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      style={{ ...styles.codeCopyBtn, ...extraStyle }}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ───────────── code block ───────────── */
export interface CodeBlockProps {
  language?: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps): JSX.Element {
  const lines = code.split('\n');
  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      <div style={styles.codeBlockHeader}>
        <span>{language || 'code'}</span>
        <CopyButton text={code} />
      </div>
      <pre style={{ ...styles.codeBlock, borderRadius: '0 0 6px 6px', marginTop: 0 }}>
        {lines.map((line, i) => (
          <span key={i}>
            <span style={styles.lineNumber}>{i + 1}</span>{line}{'\n'}
          </span>
        ))}
      </pre>
    </div>
  );
}

/* ───────────── inline markdown ───────────── */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;
  const segments = text.split(/(`[^`]+`)/g);
  return segments.map((seg, j) => {
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code key={j} style={{
          background: 'var(--surface-overlay)', padding: '1px 5px', borderRadius: 3,
          fontFamily: 'var(--mono, monospace)', fontSize: '0.88em',
        }}>
          {seg.slice(1, -1)}
        </code>
      );
    }
    // Bold + italic (***text***)
    let result = seg.replace(/\*\*\*([^*]+)\*\*\*/g, '<<<BI:$1>>>');
    // Bold (**text**)
    result = result.replace(/\*\*([^*]+)\*\*/g, '<<<B:$1>>>');
    // Italic (*text*)
    result = result.replace(/\*([^*]+)\*/g, '<<<I:$1>>>');

    const tokens = result.split(/(<<<(?:BI|B|I):[^>]+>>>)/g);
    return tokens.map((tok, k) => {
      const biMatch = tok.match(/<<<BI:(.+)>>>/);
      if (biMatch) return <strong key={`${j}-${k}`}><em>{biMatch[1]}</em></strong>;
      const bMatch = tok.match(/<<<B:(.+)>>>/);
      if (bMatch) return <strong key={`${j}-${k}`}>{bMatch[1]}</strong>;
      const iMatch = tok.match(/<<<I:(.+)>>>/);
      if (iMatch) return <em key={`${j}-${k}`}>{iMatch[1]}</em>;
      return tok;
    });
  });
}

/* ───────────── markdown renderer ───────────── */
export function renderMarkdown(text: string | undefined | null): React.ReactNode {
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const newlineIdx = inner.indexOf('\n');
      const lang = newlineIdx >= 0 ? inner.slice(0, newlineIdx).trim() : '';
      const code = newlineIdx >= 0 ? inner.slice(newlineIdx + 1) : inner;
      return <CodeBlock key={i} language={lang} code={code} />;
    }

    const lines = part.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    function flushList() {
      if (listItems.length > 0) {
        const Tag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <Tag key={`list-${elements.length}`} style={{ margin: '6px 0', paddingLeft: 20 }}>
            {listItems.map((li, j) => <li key={j}>{renderInline(li)}</li>)}
          </Tag>
        );
        listItems = [];
        listType = null;
      }
    }

    for (const line of lines) {
      const ulMatch = line.match(/^(\s*)[-*]\s+(.*)/);
      if (ulMatch) {
        if (listType === 'ol') flushList();
        listType = 'ul';
        listItems.push(ulMatch[2]);
        continue;
      }
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
      if (olMatch) {
        if (listType === 'ul') flushList();
        listType = 'ol';
        listItems.push(olMatch[2]);
        continue;
      }

      flushList();

      const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizes: Record<number, number> = { 1: 18, 2: 16, 3: 14, 4: 13 };
        elements.push(
          <div key={`h-${elements.length}`} style={{ fontWeight: 700, fontSize: sizes[level] || 14, marginTop: 10, marginBottom: 4 }}>
            {renderInline(headingMatch[2])}
          </div>
        );
        continue;
      }

      if (/^---+$/.test(line.trim())) {
        elements.push(<hr key={`hr-${elements.length}`} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />);
        continue;
      }

      if (line.trim()) {
        elements.push(<div key={`p-${elements.length}`} style={{ marginBottom: 4 }}>{renderInline(line)}</div>);
      }
    }
    flushList();

    return <span key={i}>{elements}</span>;
  });
}

/* ───────────── API key missing helpers ───────────── */
export function isApiKeyError(content: string | undefined | null): boolean {
  if (!content) return false;
  const lower = content.toLowerCase();
  return lower.includes('api key not configured') || lower.includes('anthropic_api_key') || lower.includes('kradle_assistant_api_key');
}

export function ApiKeyMessage(): JSX.Element {
  return (
    <div style={{ ...styles.bubbleError, maxWidth: '90%' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>API Key Not Configured</div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        The assistant needs an Anthropic API key to generate responses. Set one of:
      </div>
      <pre style={{ ...styles.codeBlock, marginTop: 8, padding: '10px 14px', fontSize: 12 }}>
        {`# Option 1: Environment variable\nexport ANTHROPIC_API_KEY=sk-ant-...\n\n# Option 2: Kradle-specific key\nexport KRADLE_ASSISTANT_API_KEY=sk-ant-...`}
      </pre>
      <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-muted)' }}>
        Then restart the Kradle web server.
      </div>
    </div>
  );
}

/* ───────────── thinking indicator ───────────── */
export function ThinkingIndicator(): JSX.Element {
  return (
    <div style={styles.thinkingRow}>
      <div style={styles.thinkingBubble}>
        <div style={styles.thinkingDot(0)} />
        <div style={styles.thinkingDot(0.2)} />
        <div style={styles.thinkingDot(0.4)} />
      </div>
    </div>
  );
}

/* ───────────── message bubble ───────────── */
export interface ChatMessage {
  id: string;
  role: string;
  content?: string;
  timestamp?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface MessageBubbleProps {
  msg: ChatMessage;
}

export function MessageBubble({ msg }: MessageBubbleProps): JSX.Element {
  const isUser = msg.role === 'user';
  const isError = !isUser && !!msg.content && (msg.content.startsWith('Error:') || msg.content.startsWith('Error processing'));
  const showApiKeyHelp = !isUser && isApiKeyError(msg.content);

  return (
    <div key={msg.id} style={styles.messageRow(isUser)} aria-label={isUser ? 'Your message' : 'Assistant message'}>
      {showApiKeyHelp ? (
        <ApiKeyMessage />
      ) : (
        <div style={isError ? styles.bubbleError : styles.bubble(isUser)}>
          {isUser ? msg.content : renderMarkdown(msg.content)}
        </div>
      )}
      <div style={styles.bubbleMeta}>
        <span>{timeAgo(msg.timestamp)}</span>
        {msg.usage && (
          <span style={styles.usage}>
            {msg.usage.input_tokens != null && `In: ${msg.usage.input_tokens}`}
            {msg.usage.output_tokens != null && ` Out: ${msg.usage.output_tokens}`}
            {msg.usage.inputTokens != null && `In: ${msg.usage.inputTokens}`}
            {msg.usage.outputTokens != null && ` Out: ${msg.usage.outputTokens}`}
          </span>
        )}
        {!isUser && msg.content && !showApiKeyHelp && (
          <CopyButton text={msg.content} style={styles.copyBtn} />
        )}
      </div>
    </div>
  );
}
