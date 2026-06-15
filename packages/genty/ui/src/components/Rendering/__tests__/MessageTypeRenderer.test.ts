import { describe, expect, it } from 'vitest';
import {
  detectMessageType,
  formatMessageText,
  formatMessageHtml,
} from '../MessageTypeRenderer.js';

describe('MessageTypeRenderer', () => {
  describe('detectMessageType', () => {
    it('detects plain text', () => {
      expect(detectMessageType('Hello world')).toBe('text');
    });

    it('detects code blocks', () => {
      expect(detectMessageType('```ts\nconst x = 1;\n```')).toBe('code');
    });

    it('detects tool calls', () => {
      expect(detectMessageType('{ "tool_name": "bash", "args": {} }')).toBe('tool_call');
    });

    it('detects tool results', () => {
      expect(detectMessageType('{ "tool_result": "success" }')).toBe('tool_result');
    });

    it('detects thinking blocks', () => {
      expect(detectMessageType('<thinking>\nLet me analyze this...\n</thinking>')).toBe('thinking');
    });

    it('detects errors', () => {
      expect(detectMessageType('Error: file not found')).toBe('error');
      expect(detectMessageType('ERROR: something broke')).toBe('error');
      expect(detectMessageType('Exception: null pointer')).toBe('error');
      expect(detectMessageType('Traceback (most recent call last):')).toBe('error');
    });

    it('detects system messages', () => {
      expect(detectMessageType('[system] Session started')).toBe('system');
      expect(detectMessageType('[SYSTEM] Restarting')).toBe('system');
    });
  });

  describe('formatMessageText', () => {
    it('returns plain text unchanged', () => {
      expect(formatMessageText('Hello', 'text')).toBe('Hello');
    });

    it('strips code fences and adds code prefix', () => {
      const input = '```ts\nconst x = 1;\n```';
      const output = formatMessageText(input, 'code');
      expect(output).toContain('code');
      expect(output).toContain('const x = 1;');
      expect(output).not.toContain('```');
    });

    it('strips thinking tags and adds thinking prefix', () => {
      const input = '<thinking>\nAnalyzing...\n</thinking>';
      const output = formatMessageText(input, 'thinking');
      expect(output).toContain('Thinking');
      expect(output).toContain('Analyzing...');
      expect(output).not.toContain('<thinking>');
    });

    it('adds error prefix', () => {
      const output = formatMessageText('Error: bad', 'error');
      expect(output).toContain('Error');
    });

    it('adds tool call prefix', () => {
      const output = formatMessageText('{"tool_name":"bash"}', 'tool_call');
      expect(output).toContain('Tool Call');
    });
  });

  describe('formatMessageHtml', () => {
    it('wraps text in a paragraph with correct class', () => {
      const html = formatMessageHtml('Hello', 'text');
      expect(html).toContain('class="msg-text"');
      expect(html).toContain('<p>Hello</p>');
    });

    it('wraps code in pre/code tags', () => {
      const html = formatMessageHtml('```ts\nconst x = 1;\n```', 'code');
      expect(html).toContain('class="msg-code"');
      expect(html).toContain('<pre><code>');
      expect(html).toContain('const x = 1;');
    });

    it('wraps thinking in italics', () => {
      const html = formatMessageHtml('<thinking>Hmm</thinking>', 'thinking');
      expect(html).toContain('class="msg-thinking"');
      expect(html).toContain('<em>');
    });

    it('wraps errors in bold', () => {
      const html = formatMessageHtml('Error: bad thing', 'error');
      expect(html).toContain('class="msg-error"');
      expect(html).toContain('<strong>');
    });

    it('escapes HTML in content', () => {
      const html = formatMessageHtml('<script>alert("xss")</script>', 'text');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});
