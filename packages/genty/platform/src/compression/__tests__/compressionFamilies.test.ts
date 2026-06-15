import { describe, it, expect } from 'vitest';
import {
  BUILT_IN_FAMILIES,
  selectFamily,
  applyFamilyCompression,
  type CompressibleMessage,
} from '../compressionFamilies';

// ---------------------------------------------------------------------------
// BUILT_IN_FAMILIES
// ---------------------------------------------------------------------------

describe('BUILT_IN_FAMILIES', () => {
  it('has four built-in families', () => {
    expect(BUILT_IN_FAMILIES).toHaveLength(4);
  });

  it('includes tool-results, thinking, conversation, system', () => {
    const ids = BUILT_IN_FAMILIES.map((f) => f.id);
    expect(ids).toContain('tool-results');
    expect(ids).toContain('thinking');
    expect(ids).toContain('conversation');
    expect(ids).toContain('system');
  });

  it('assigns correct strategies', () => {
    const byId = Object.fromEntries(BUILT_IN_FAMILIES.map((f) => [f.id, f]));
    expect(byId['tool-results'].strategy).toBe('aggressive');
    expect(byId['thinking'].strategy).toBe('moderate');
    expect(byId['conversation'].strategy).toBe('conservative');
    expect(byId['system'].strategy).toBe('minimal');
  });
});

// ---------------------------------------------------------------------------
// selectFamily
// ---------------------------------------------------------------------------

describe('selectFamily', () => {
  it('selects tool-results for tool role', () => {
    const msg: CompressibleMessage = { role: 'tool', content: 'result' };
    expect(selectFamily(msg).id).toBe('tool-results');
  });

  it('selects thinking for assistant thinking messages', () => {
    const msg: CompressibleMessage = { role: 'assistant', content: '...', type: 'thinking' };
    expect(selectFamily(msg).id).toBe('thinking');
  });

  it('selects system for system messages', () => {
    const msg: CompressibleMessage = { role: 'system', content: 'You are...' };
    expect(selectFamily(msg).id).toBe('system');
  });

  it('selects conversation for user messages', () => {
    const msg: CompressibleMessage = { role: 'user', content: 'hello' };
    expect(selectFamily(msg).id).toBe('conversation');
  });

  it('selects conversation for plain assistant messages', () => {
    const msg: CompressibleMessage = { role: 'assistant', content: 'Sure, I can help.' };
    expect(selectFamily(msg).id).toBe('conversation');
  });
});

// ---------------------------------------------------------------------------
// applyFamilyCompression
// ---------------------------------------------------------------------------

describe('applyFamilyCompression', () => {
  const family = (id: string) => BUILT_IN_FAMILIES.find((f) => f.id === id)!;

  // -----------------------------------------------------------------------
  // Aggressive (tool-results)
  // -----------------------------------------------------------------------

  it('aggressive: preserves short content', () => {
    const content = 'line 1\nline 2\nline 3';
    const result = applyFamilyCompression(family('tool-results'), content);
    expect(result).toContain('line 1');
    expect(result).toContain('line 3');
  });

  it('aggressive: truncates long output with omission marker', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line-${i}`).join('\n');
    const result = applyFamilyCompression(family('tool-results'), lines);
    expect(result).toContain('lines omitted');
    expect(result).toContain('line-0');
    expect(result).toContain('line-49');
  });

  it('aggressive: removes blank lines', () => {
    const content = 'a\n\n\n\nb\n\nc';
    const result = applyFamilyCompression(family('tool-results'), content);
    expect(result).toBe('a\nb\nc');
  });

  // -----------------------------------------------------------------------
  // Moderate (thinking)
  // -----------------------------------------------------------------------

  it('moderate: truncates very long lines', () => {
    const long = 'x'.repeat(600);
    const result = applyFamilyCompression(family('thinking'), long);
    expect(result.length).toBeLessThan(510);
    expect(result).toContain('...');
  });

  it('moderate: collapses triple+ blank lines to double', () => {
    const content = 'a\n\n\n\n\nb';
    const result = applyFamilyCompression(family('thinking'), content);
    expect(result).toBe('a\n\nb');
  });

  // -----------------------------------------------------------------------
  // Conservative (conversation)
  // -----------------------------------------------------------------------

  it('conservative: collapses 4+ blank lines to 3', () => {
    const content = 'a\n\n\n\n\n\nb';
    const result = applyFamilyCompression(family('conversation'), content);
    expect(result).toBe('a\n\n\nb');
  });

  it('conservative: preserves normal content', () => {
    const content = 'hello\nworld';
    const result = applyFamilyCompression(family('conversation'), content);
    expect(result).toBe('hello\nworld');
  });

  // -----------------------------------------------------------------------
  // Minimal (system)
  // -----------------------------------------------------------------------

  it('minimal: passes content through unchanged', () => {
    const content = 'You are a helpful assistant.\n\n\n\n\nDo things.';
    const result = applyFamilyCompression(family('system'), content);
    expect(result).toBe(content);
  });
});
