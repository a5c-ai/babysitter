/**
 * Tests for session:last-message helpers:
 *   - parseTranscriptLastAssistantMessage
 *   - extractPromiseTag
 */

import { describe, it, expect } from 'vitest';
import {
  parseTranscriptLastAssistantMessage,
  extractPromiseTag,
} from '../session';

// ── parseTranscriptLastAssistantMessage ──────────────────────────────

describe('parseTranscriptLastAssistantMessage', () => {
  it('returns text from a normal assistant message with text content blocks (message.content format)', () => {
    const line = JSON.stringify({
      role: 'assistant',
      message: {
        content: [{ type: 'text', text: 'Hello from the assistant.' }],
      },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Hello from the assistant.');
  });

  it('picks the last assistant message when there are multiple messages', () => {
    const lines = [
      JSON.stringify({
        role: 'user',
        message: { content: [{ type: 'text', text: 'User message' }] },
      }),
      JSON.stringify({
        role: 'assistant',
        message: { content: [{ type: 'text', text: 'First assistant reply' }] },
      }),
      JSON.stringify({
        role: 'user',
        message: { content: [{ type: 'text', text: 'Another user message' }] },
      }),
      JSON.stringify({
        role: 'assistant',
        message: {
          content: [{ type: 'text', text: 'Second assistant reply' }],
        },
      }),
    ].join('\n');

    const result = parseTranscriptLastAssistantMessage(lines);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Second assistant reply');
  });

  it('returns found: false when there are no assistant messages', () => {
    const lines = [
      JSON.stringify({
        role: 'user',
        message: { content: [{ type: 'text', text: 'User message' }] },
      }),
      JSON.stringify({
        role: 'system',
        message: { content: [{ type: 'text', text: 'System message' }] },
      }),
    ].join('\n');

    const result = parseTranscriptLastAssistantMessage(lines);

    expect(result.found).toBe(false);
    expect(result.text).toBeNull();
  });

  it('returns found: false when assistant message has only tool_use blocks (no text)', () => {
    const line = JSON.stringify({
      role: 'assistant',
      message: {
        content: [
          { type: 'tool_use', id: 'tool-1', name: 'bash', input: {} },
        ],
      },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(false);
    expect(result.text).toBeNull();
  });

  it('returns found: false when content array is empty', () => {
    const line = JSON.stringify({
      role: 'assistant',
      message: { content: [] },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(false);
    expect(result.text).toBeNull();
  });

  it('skips malformed JSONL lines gracefully', () => {
    const lines = [
      'this is not json',
      '{ broken json',
      JSON.stringify({
        role: 'assistant',
        message: {
          content: [{ type: 'text', text: 'Valid after garbage' }],
        },
      }),
    ].join('\n');

    const result = parseTranscriptLastAssistantMessage(lines);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Valid after garbage');
  });

  it('handles direct content array (not wrapped in message object)', () => {
    const line = JSON.stringify({
      role: 'assistant',
      content: [{ type: 'text', text: 'Direct content' }],
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Direct content');
  });

  it('joins multiple text blocks with newlines', () => {
    const line = JSON.stringify({
      role: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'Part one.' },
          { type: 'text', text: 'Part two.' },
        ],
      },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Part one.\nPart two.');
  });

  it('returns found: false for completely empty input', () => {
    const result = parseTranscriptLastAssistantMessage('');

    expect(result.found).toBe(false);
    expect(result.text).toBeNull();
  });

  it('ignores text blocks mixed with tool_use blocks, returning only text', () => {
    const line = JSON.stringify({
      role: 'assistant',
      message: {
        content: [
          { type: 'text', text: 'Some explanation.' },
          { type: 'tool_use', id: 'tool-1', name: 'bash', input: {} },
          { type: 'text', text: 'More text after tool.' },
        ],
      },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Some explanation.\nMore text after tool.');
  });

  it('returns found: false when content is not an array', () => {
    const line = JSON.stringify({
      role: 'assistant',
      message: { content: 'just a string' },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(false);
    expect(result.text).toBeNull();
  });

  // ── Real Claude Code transcript format tests ─────────────────────

  it('matches entries with top-level type: "assistant" and message.role: "assistant" (real Claude Code format)', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        id: 'msg_01ABC123',
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'text', text: 'Real Claude Code response.' },
        ],
      },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Real Claude Code response.');
  });

  it('matches entries with only message.role: "assistant" (no top-level role or type)', () => {
    const line = JSON.stringify({
      message: {
        id: 'msg_01DEF456',
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'text', text: 'Fallback assistant detection.' },
        ],
      },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Fallback assistant detection.');
  });

  it('picks the last assistant from a mixed real Claude Code transcript', () => {
    const lines = [
      JSON.stringify({
        type: 'human',
        message: {
          id: 'msg_user1',
          type: 'message',
          role: 'user',
          content: [{ type: 'text', text: 'User prompt' }],
        },
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          id: 'msg_asst1',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'First real assistant reply' }],
        },
      }),
      JSON.stringify({
        type: 'human',
        message: {
          id: 'msg_user2',
          type: 'message',
          role: 'user',
          content: [{ type: 'text', text: 'Follow-up' }],
        },
      }),
      JSON.stringify({
        type: 'assistant',
        message: {
          id: 'msg_asst2',
          type: 'message',
          role: 'assistant',
          content: [
            { type: 'text', text: 'Second real assistant reply with <promise>PROOF123</promise>' },
          ],
        },
      }),
    ].join('\n');

    const result = parseTranscriptLastAssistantMessage(lines);

    expect(result.found).toBe(true);
    expect(result.text).toContain('Second real assistant reply');
    expect(result.text).toContain('<promise>PROOF123</promise>');
  });

  it('handles real Claude Code format with tool_use and text blocks', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        id: 'msg_01GHI789',
        type: 'message',
        role: 'assistant',
        content: [
          { type: 'text', text: 'Let me run a command.' },
          { type: 'tool_use', id: 'tool-1', name: 'Bash', input: { command: 'ls' } },
          { type: 'text', text: 'Done running the command.' },
        ],
      },
    });

    const result = parseTranscriptLastAssistantMessage(line);

    expect(result.found).toBe(true);
    expect(result.text).toBe('Let me run a command.\nDone running the command.');
  });
});

// ── extractPromiseTag ────────────────────────────────────────────────

describe('extractPromiseTag', () => {
  it('extracts content from <promise>abc123</promise>', () => {
    const text = 'Some text <promise>abc123</promise> more text';

    const result = extractPromiseTag(text);

    expect(result).toBe('abc123');
  });

  it('trims and collapses whitespace in multiline promise content', () => {
    const text = `Here is a promise:
<promise>
  this is
  a multiline
  promise value
</promise>
done.`;

    const result = extractPromiseTag(text);

    expect(result).toBe('this is a multiline promise value');
  });

  it('returns null when there are no promise tags', () => {
    const text = 'Just some regular text without any promise tags.';

    const result = extractPromiseTag(text);

    expect(result).toBeNull();
  });

  it('normalizes extra whitespace inside promise tag', () => {
    const text = '<promise>  lots   of   spaces  </promise>';

    const result = extractPromiseTag(text);

    expect(result).toBe('lots of spaces');
  });

  it('returns only the first promise tag when multiple are present', () => {
    const text =
      '<promise>first-value</promise> text <promise>second-value</promise>';

    const result = extractPromiseTag(text);

    expect(result).toBe('first-value');
  });

  it('handles promise tag with only whitespace as content', () => {
    const text = '<promise>   </promise>';

    const result = extractPromiseTag(text);

    expect(result).toBe('');
  });

  it('handles promise tag immediately adjacent to other text', () => {
    const text = 'prefix<promise>value</promise>suffix';

    const result = extractPromiseTag(text);

    expect(result).toBe('value');
  });

  it('returns null for partial or malformed promise tags', () => {
    expect(extractPromiseTag('<promise>unclosed')).toBeNull();
    expect(extractPromiseTag('</promise>only closing')).toBeNull();
    expect(extractPromiseTag('<Promise>wrong case</Promise>')).toBeNull();
  });
});
