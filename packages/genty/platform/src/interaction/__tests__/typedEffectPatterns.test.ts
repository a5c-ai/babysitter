import { describe, it, expect } from 'vitest';
import {
  BUILT_IN_PATTERNS,
  getPatternForEffect,
  validateEffectInput,
  formatEffectSummary,
} from '../typedEffectPatterns';

// ---------------------------------------------------------------------------
// BUILT_IN_PATTERNS
// ---------------------------------------------------------------------------

describe('BUILT_IN_PATTERNS', () => {
  it('defines 5 built-in patterns', () => {
    expect(BUILT_IN_PATTERNS).toHaveLength(5);
  });

  it('includes agent, shell, breakpoint, sleep, mcp', () => {
    const kinds = BUILT_IN_PATTERNS.map((p) => p.kind);
    expect(kinds).toContain('agent');
    expect(kinds).toContain('shell');
    expect(kinds).toContain('breakpoint');
    expect(kinds).toContain('sleep');
    expect(kinds).toContain('mcp');
  });

  it('each pattern has inputSchema, outputSchema, renderHints', () => {
    for (const p of BUILT_IN_PATTERNS) {
      expect(Array.isArray(p.inputSchema)).toBe(true);
      expect(Array.isArray(p.outputSchema)).toBe(true);
      expect(p.renderHints).toBeDefined();
      expect(p.renderHints.widget).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// getPatternForEffect
// ---------------------------------------------------------------------------

describe('getPatternForEffect', () => {
  it('returns the pattern for a known effect kind', () => {
    const p = getPatternForEffect({ kind: 'shell' });
    expect(p).toBeDefined();
    expect(p!.kind).toBe('shell');
  });

  it('returns undefined for unknown kind', () => {
    expect(getPatternForEffect({ kind: 'unknown' })).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// validateEffectInput
// ---------------------------------------------------------------------------

describe('validateEffectInput', () => {
  const shellPattern = BUILT_IN_PATTERNS.find((p) => p.kind === 'shell')!;

  it('passes valid input', () => {
    const result = validateEffectInput(shellPattern, { command: 'ls -la' });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when required field is missing', () => {
    const result = validateEffectInput(shellPattern, {});
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'command')).toBe(true);
  });

  it('fails on type mismatch', () => {
    const result = validateEffectInput(shellPattern, { command: 42 });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain('string');
  });

  it('allows optional fields to be absent', () => {
    const result = validateEffectInput(shellPattern, { command: 'echo hi' });
    expect(result.valid).toBe(true);
  });

  it('validates optional fields when present', () => {
    const result = validateEffectInput(shellPattern, {
      command: 'echo hi',
      timeout: 'not-a-number',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe('timeout');
  });

  it('validates breakpoint input', () => {
    const bp = BUILT_IN_PATTERNS.find((p) => p.kind === 'breakpoint')!;
    const result = validateEffectInput(bp, { message: 'Continue?' });
    expect(result.valid).toBe(true);
  });

  it('validates mcp input with required fields', () => {
    const mcp = BUILT_IN_PATTERNS.find((p) => p.kind === 'mcp')!;
    const result = validateEffectInput(mcp, { server: 'db' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'tool')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatEffectSummary
// ---------------------------------------------------------------------------

describe('formatEffectSummary', () => {
  it('formats shell summary with exit code', () => {
    const shell = BUILT_IN_PATTERNS.find((p) => p.kind === 'shell')!;
    const summary = formatEffectSummary(shell, {
      exitCode: 0,
      command: 'npm test',
      stdout: 'ok',
    });
    expect(summary).toContain('[shell]');
    expect(summary).toContain('exit=0');
    expect(summary).toContain('npm test');
  });

  it('formats agent summary with response preview', () => {
    const agent = BUILT_IN_PATTERNS.find((p) => p.kind === 'agent')!;
    const summary = formatEffectSummary(agent, {
      response: 'Here is the answer to your question about TypeScript generics.',
    });
    expect(summary).toContain('[agent]');
    expect(summary).toContain('answer');
  });

  it('truncates long agent responses', () => {
    const agent = BUILT_IN_PATTERNS.find((p) => p.kind === 'agent')!;
    const summary = formatEffectSummary(agent, {
      response: 'x'.repeat(200),
    });
    expect(summary).toContain('...');
    expect(summary.length).toBeLessThan(100);
  });

  it('formats breakpoint summary', () => {
    const bp = BUILT_IN_PATTERNS.find((p) => p.kind === 'breakpoint')!;
    const summary = formatEffectSummary(bp, { selection: 'continue' });
    expect(summary).toContain('[breakpoint]');
    expect(summary).toContain('selected: continue');
  });

  it('formats sleep summary with elapsed time', () => {
    const sleep = BUILT_IN_PATTERNS.find((p) => p.kind === 'sleep')!;
    const summary = formatEffectSummary(sleep, { elapsed: 5000 });
    expect(summary).toContain('[sleep]');
    expect(summary).toContain('waited 5000ms');
  });

  it('formats mcp summary', () => {
    const mcp = BUILT_IN_PATTERNS.find((p) => p.kind === 'mcp')!;
    const summary = formatEffectSummary(mcp, { tool: 'search', result: {} });
    expect(summary).toContain('[mcp]');
    expect(summary).toContain('search');
  });

  it('formats mcp error summary', () => {
    const mcp = BUILT_IN_PATTERNS.find((p) => p.kind === 'mcp')!;
    const summary = formatEffectSummary(mcp, { error: 'connection refused' });
    expect(summary).toContain('ERROR');
    expect(summary).toContain('connection refused');
  });
});
