import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';

/**
 * Tests for the format-converter entrypoint script.
 *
 * Spawns the compiled entrypoint as a subprocess, feeding JSON via stdin
 * and validating JSON from stdout — exactly how the MicroagentRunner uses it.
 */

const entrypoint = path.resolve(
  __dirname,
  '..', '..', '..', '..', 'dist',
  'microagents', 'scripts', 'format-converter.entrypoint.js',
);

function run(input: { source: string; sourceFormat: string; targetFormat: string }): {
  result: string;
  targetFormat: string;
} {
  const stdout = execFileSync('node', [entrypoint], {
    input: JSON.stringify(input),
    encoding: 'utf-8',
    timeout: 10_000,
  });
  return JSON.parse(stdout);
}

// ---------------------------------------------------------------------------
// JSON conversions
// ---------------------------------------------------------------------------

describe('format-converter entrypoint', () => {
  describe('JSON -> YAML', () => {
    it('converts a flat object', () => {
      const out = run({
        source: JSON.stringify({ name: 'Alice', age: 30, active: true }),
        sourceFormat: 'json',
        targetFormat: 'yaml',
      });

      expect(out.targetFormat).toBe('yaml');
      expect(out.result).toContain('name: Alice');
      expect(out.result).toContain('age: 30');
      expect(out.result).toContain('active: true');
    });
  });

  describe('JSON -> TOML', () => {
    it('converts a flat object', () => {
      const out = run({
        source: JSON.stringify({ title: 'Hello', count: 5 }),
        sourceFormat: 'json',
        targetFormat: 'toml',
      });

      expect(out.targetFormat).toBe('toml');
      expect(out.result).toContain('title = "Hello"');
      expect(out.result).toContain('count = 5');
    });
  });

  describe('JSON -> CSV', () => {
    it('converts an array of objects', () => {
      const data = [
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
      ];
      const out = run({
        source: JSON.stringify(data),
        sourceFormat: 'json',
        targetFormat: 'csv',
      });

      expect(out.targetFormat).toBe('csv');
      const lines = out.result.split('\n');
      expect(lines[0]).toBe('name,age');
      expect(lines[1]).toBe('Alice,30');
      expect(lines[2]).toBe('Bob,25');
    });
  });

  describe('JSON -> XML', () => {
    it('converts a flat object', () => {
      const out = run({
        source: JSON.stringify({ name: 'Alice', age: 30 }),
        sourceFormat: 'json',
        targetFormat: 'xml',
      });

      expect(out.targetFormat).toBe('xml');
      expect(out.result).toContain('<name>Alice</name>');
      expect(out.result).toContain('<age>30</age>');
    });
  });

  describe('YAML -> JSON', () => {
    it('converts flat YAML', () => {
      const yaml = 'name: Alice\nage: 30\nactive: true\n';
      const out = run({
        source: yaml,
        sourceFormat: 'yaml',
        targetFormat: 'json',
      });

      expect(out.targetFormat).toBe('json');
      const parsed = JSON.parse(out.result);
      expect(parsed.name).toBe('Alice');
      expect(parsed.age).toBe(30);
      expect(parsed.active).toBe(true);
    });
  });

  describe('CSV -> JSON', () => {
    it('converts CSV with headers', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const out = run({
        source: csv,
        sourceFormat: 'csv',
        targetFormat: 'json',
      });

      expect(out.targetFormat).toBe('json');
      const parsed = JSON.parse(out.result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({ name: 'Alice', age: '30' });
      expect(parsed[1]).toEqual({ name: 'Bob', age: '25' });
    });
  });

  describe('TOML -> JSON', () => {
    it('converts flat TOML', () => {
      const toml = 'title = "Hello"\ncount = 5\nenabled = true\n';
      const out = run({
        source: toml,
        sourceFormat: 'toml',
        targetFormat: 'json',
      });

      expect(out.targetFormat).toBe('json');
      const parsed = JSON.parse(out.result);
      expect(parsed.title).toBe('Hello');
      expect(parsed.count).toBe(5);
      expect(parsed.enabled).toBe(true);
    });
  });

  describe('XML -> JSON', () => {
    it('converts flat XML', () => {
      const xml = '<root><name>Alice</name><age>30</age></root>';
      const out = run({
        source: xml,
        sourceFormat: 'xml',
        targetFormat: 'json',
      });

      expect(out.targetFormat).toBe('json');
      const parsed = JSON.parse(out.result);
      expect(parsed.root.name).toBe('Alice');
      expect(parsed.root.age).toBe('30');
    });
  });

  describe('JSON -> JSON (identity)', () => {
    it('round-trips through JSON parse/stringify', () => {
      const data = { x: 1, y: 'hello', z: [1, 2, 3] };
      const out = run({
        source: JSON.stringify(data),
        sourceFormat: 'json',
        targetFormat: 'json',
      });

      expect(out.targetFormat).toBe('json');
      expect(JSON.parse(out.result)).toEqual(data);
    });
  });

  describe('edge cases', () => {
    it('handles CSV with quoted commas', () => {
      const csv = 'name,desc\nAlice,"Hello, World"\nBob,"A ""quoted"" value"';
      const out = run({
        source: csv,
        sourceFormat: 'csv',
        targetFormat: 'json',
      });

      const parsed = JSON.parse(out.result);
      expect(parsed[0].desc).toBe('Hello, World');
      expect(parsed[1].desc).toBe('A "quoted" value');
    });

    it('handles empty JSON object', () => {
      const out = run({
        source: '{}',
        sourceFormat: 'json',
        targetFormat: 'yaml',
      });
      expect(out.targetFormat).toBe('yaml');
    });

    it('handles YAML with null values', () => {
      const yaml = 'key1: null\nkey2: ~\nkey3: value';
      const out = run({
        source: yaml,
        sourceFormat: 'yaml',
        targetFormat: 'json',
      });

      const parsed = JSON.parse(out.result);
      expect(parsed.key1).toBeNull();
      expect(parsed.key2).toBeNull();
      expect(parsed.key3).toBe('value');
    });
  });
});
