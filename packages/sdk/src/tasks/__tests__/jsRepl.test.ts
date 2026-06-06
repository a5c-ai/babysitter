import { describe, it, expect } from 'vitest';
import {
  evaluateExpression,
  formatReplResult,
  createReplSandbox,
} from '../jsRepl';

// ---------------------------------------------------------------------------
// evaluateExpression
// ---------------------------------------------------------------------------

describe('evaluateExpression', () => {
  it('evaluates simple arithmetic', () => {
    const result = evaluateExpression('2 + 3');
    expect(result.output).toBe('5');
    expect(result.error).toBeUndefined();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('evaluates string expressions', () => {
    const result = evaluateExpression('"hello" + " " + "world"');
    expect(result.output).toBe('hello world');
  });

  it('evaluates object expressions', () => {
    const result = evaluateExpression('({ a: 1, b: 2 })');
    const parsed = JSON.parse(result.output);
    expect(parsed).toEqual({ a: 1, b: 2 });
  });

  it('evaluates array expressions', () => {
    const result = evaluateExpression('[1, 2, 3].map(x => x * 2)');
    const parsed = JSON.parse(result.output);
    expect(parsed).toEqual([2, 4, 6]);
  });

  it('captures syntax errors', () => {
    const result = evaluateExpression('function {');
    expect(result.error).toBeDefined();
    expect(result.output).toBe('');
  });

  it('captures runtime errors', () => {
    const result = evaluateExpression('undefined.foo');
    expect(result.error).toBeDefined();
  });

  it('does not have access to Node.js globals', () => {
    const result = evaluateExpression('typeof require');
    expect(result.output).toBe('"undefined"');
  });

  it('uses provided sandbox context', () => {
    const sandbox = createReplSandbox({ myVar: 42 });
    const result = evaluateExpression('myVar * 2', 5000, sandbox);
    expect(result.output).toBe('84');
  });

  it('handles undefined result', () => {
    const result = evaluateExpression('undefined');
    expect(result.output).toBe('undefined');
  });

  it('handles null result', () => {
    const result = evaluateExpression('null');
    expect(result.output).toBe('null');
  });
});

// ---------------------------------------------------------------------------
// formatReplResult
// ---------------------------------------------------------------------------

describe('formatReplResult', () => {
  it('formats successful result', () => {
    const text = formatReplResult({ output: '42', durationMs: 5 });
    expect(text).toBe('42 (5ms)');
  });

  it('formats error result', () => {
    const text = formatReplResult({ output: '', error: 'ReferenceError: x is not defined', durationMs: 3 });
    expect(text).toBe('Error (3ms): ReferenceError: x is not defined');
  });
});

// ---------------------------------------------------------------------------
// createReplSandbox
// ---------------------------------------------------------------------------

describe('createReplSandbox', () => {
  it('provides Math', () => {
    const sandbox = createReplSandbox();
    const result = evaluateExpression('Math.max(1, 5, 3)', 5000, sandbox);
    expect(result.output).toBe('5');
  });

  it('provides JSON', () => {
    const sandbox = createReplSandbox();
    const result = evaluateExpression('JSON.stringify({ a: 1 })', 5000, sandbox);
    expect(result.output).toBe('{"a":1}');
  });

  it('includes custom globals', () => {
    const sandbox = createReplSandbox({
      greeting: 'hello',
      multiply: (a: number, b: number) => a * b,
    });
    const result1 = evaluateExpression('greeting', 5000, sandbox);
    expect(result1.output).toBe('hello');

    const result2 = evaluateExpression('multiply(3, 4)', 5000, sandbox);
    expect(result2.output).toBe('12');
  });
});
