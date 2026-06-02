import { describe, it, expect } from 'vitest';
import { escapeShellValue } from '../../propagation/env-file';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('shell-injection security: escapeShellValue', () => {
  it('escapes command substitution with $()', () => {
    const escaped = escapeShellValue('$(rm -rf /)');
    // The dollar sign should be escaped with backslash
    expect(escaped).toContain('\\$');
    // Should not contain a bare (unescaped) dollar sign
    expect(escaped).not.toMatch(/(?<!\\)\$/);
    // Should be wrapped in double quotes
    expect(escaped.startsWith('"')).toBe(true);
    expect(escaped.endsWith('"')).toBe(true);
  });

  it('escapes backtick command substitution', () => {
    const escaped = escapeShellValue('`whoami`');
    // Backticks should be escaped with backslash
    expect(escaped).toContain('\\`');
    // Should not contain a bare (unescaped) backtick
    expect(escaped).not.toMatch(/(?<!\\)`/);
  });

  it('escapes semicolon-based injection', () => {
    const escaped = escapeShellValue('"; echo pwned');
    // The double quote inside should be escaped
    expect(escaped).toContain('\\"');
    // The value should be safely wrapped
    expect(escaped.startsWith('"')).toBe(true);
    expect(escaped.endsWith('"')).toBe(true);
  });

  it('escapes dollar sign variable expansion ($HOME)', () => {
    const escaped = escapeShellValue('$HOME');
    expect(escaped).toContain('\\$');
    expect(escaped).not.toMatch(/(?<!\\)\$/);
  });

  it('escapes values with newlines', () => {
    const escaped = escapeShellValue('line1\nline2');
    expect(escaped).toContain('\\n');
    // Should not contain a literal newline inside the quotes
    const inner = escaped.slice(1, -1);
    expect(inner).not.toContain('\n');
  });

  it('escapes backslashes', () => {
    const escaped = escapeShellValue('path\\to\\file');
    expect(escaped).toContain('\\\\');
  });

  it('escapes double quotes', () => {
    const escaped = escapeShellValue('say "hello"');
    expect(escaped).toContain('\\"hello\\"');
  });

  it('handles empty string', () => {
    const escaped = escapeShellValue('');
    expect(escaped).toBe('""');
  });

  it('handles plain alphanumeric string (no escaping needed)', () => {
    const escaped = escapeShellValue('simple_value123');
    expect(escaped).toBe('"simple_value123"');
  });

  it('escapes complex payload combining multiple dangerous characters', () => {
    const dangerous = '$(rm -rf /)`whoami`; echo "$HOME"\n$PATH';
    const escaped = escapeShellValue(dangerous);

    // Should not contain any unescaped dangerous characters
    // Check that all $ are escaped
    const inner = escaped.slice(1, -1);
    // Every $ should be preceded by \
    const dollars = [...inner.matchAll(/\$/g)];
    for (const match of dollars) {
      const idx = match.index!;
      expect(inner[idx - 1]).toBe('\\');
    }
    // Every backtick should be preceded by \
    const backticks = [...inner.matchAll(/`/g)];
    for (const match of backticks) {
      const idx = match.index!;
      expect(inner[idx - 1]).toBe('\\');
    }
  });

  it('escapes nested dollar-brace syntax ${VAR}', () => {
    const escaped = escapeShellValue('${USER}');
    expect(escaped).toContain('\\$');
  });

  it('escapes single quotes within double-quoted context', () => {
    // Single quotes don't need escaping inside double quotes, but verify no breakout
    const escaped = escapeShellValue("it's fine");
    expect(escaped).toBe("\"it's fine\"");
  });
});
