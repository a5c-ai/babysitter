'use client';
import { useState, useCallback } from 'react';
import { styles } from './assistant-chat-styles.jsx';

/* ───────────── relative timestamp ───────────── */
export function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/* ───────────── copy button ───────────── */
export function CopyButton({ text, style: extraStyle }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch((err) => console.warn('[krate]', err.message || err));
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
export function CodeBlock({ language, code }) {
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
function renderInline(text) {
  if (!text) return null;
  // Process: inline code, bold, italic
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
export function renderMarkdown(text) {
  if (!text) return null;

  // Split by fenced code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    // Fenced code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const newlineIdx = inner.indexOf('\n');
      const lang = newlineIdx >= 0 ? inner.slice(0, newlineIdx).trim() : '';
      const code = newlineIdx >= 0 ? inner.slice(newlineIdx + 1) : inner;
      return <CodeBlock key={i} language={lang} code={code} />;
    }

    // Process blocks: paragraphs, lists, headers
    const lines = part.split('\n');
    const elements = [];
    let listItems = [];
    let listType = null; // 'ul' or 'ol'

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
      // Unordered list item
      const ulMatch = line.match(/^(\s*)[-*]\s+(.*)/);
      if (ulMatch) {
        if (listType === 'ol') flushList();
        listType = 'ul';
        listItems.push(ulMatch[2]);
        continue;
      }
      // Ordered list item
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
      if (olMatch) {
        if (listType === 'ul') flushList();
        listType = 'ol';
        listItems.push(olMatch[2]);
        continue;
      }

      flushList();

      // Headers
      const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizes = { 1: 18, 2: 16, 3: 14, 4: 13 };
        elements.push(
          <div key={`h-${elements.length}`} style={{ fontWeight: 700, fontSize: sizes[level] || 14, marginTop: 10, marginBottom: 4 }}>
            {renderInline(headingMatch[2])}
          </div>
        );
        continue;
      }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) {
        elements.push(<hr key={`hr-${elements.length}`} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />);
        continue;
      }

      // Normal text (skip empty lines between content)
      if (line.trim()) {
        elements.push(<div key={`p-${elements.length}`} style={{ marginBottom: 4 }}>{renderInline(line)}</div>);
      }
    }
    flushList();

    return <span key={i}>{elements}</span>;
  });
}

/* ───────────── API key missing helpers ───────────── */
export function isApiKeyError(content) {
  if (!content) return false;
  const lower = content.toLowerCase();
  return lower.includes('api key not configured') || lower.includes('anthropic_api_key') || lower.includes('krate_assistant_api_key');
}

export function ApiKeyMessage() {
  return (
    <div style={{ ...styles.bubbleError, maxWidth: '90%' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>API Key Not Configured</div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        The assistant needs an Anthropic API key to generate responses. Set one of:
      </div>
      <pre style={{ ...styles.codeBlock, marginTop: 8, padding: '10px 14px', fontSize: 12 }}>
        {`# Option 1: Environment variable\nexport ANTHROPIC_API_KEY=sk-ant-...\n\n# Option 2: Krate-specific key\nexport KRATE_ASSISTANT_API_KEY=sk-ant-...`}
      </pre>
      <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text-muted)' }}>
        Then restart the Krate web server.
      </div>
    </div>
  );
}

/* ───────────── thinking indicator ───────────── */
export function ThinkingIndicator() {
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
export function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isError = !isUser && msg.content && (msg.content.startsWith('Error:') || msg.content.startsWith('Error processing'));
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
