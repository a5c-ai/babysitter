import { describe, it, expect } from 'vitest';
import {
  parseStructuredOutput,
  formatAsTable,
  formatAsMarkdown,
  type OutputSchema,
} from '../structuredOutput';

describe('structuredOutput', () => {
  // -------------------------------------------------------------------------
  // parseStructuredOutput
  // -------------------------------------------------------------------------

  describe('parseStructuredOutput', () => {
    it('parses valid JSON', () => {
      const schema: OutputSchema = { type: 'json' };
      const result = parseStructuredOutput('{"name":"alice","age":30}', schema);
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ name: 'alice', age: 30 });
      expect(result.errors).toHaveLength(0);
    });

    it('reports invalid JSON', () => {
      const schema: OutputSchema = { type: 'json' };
      const result = parseStructuredOutput('{invalid', schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('JSON parse error');
    });

    it('validates JSON against schema', () => {
      const schema: OutputSchema = {
        type: 'json',
        schema: {
          type: 'object',
          properties: { name: { type: 'string' }, age: { type: 'number' } },
          required: ['name'],
        },
      };
      const result = parseStructuredOutput('{"age":30}', schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: "name"');
    });

    it('validates property types', () => {
      const schema: OutputSchema = {
        type: 'json',
        schema: {
          properties: { count: { type: 'number' } },
        },
      };
      const result = parseStructuredOutput('{"count":"not-a-number"}', schema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('expected type "number"');
    });

    it('parses simple YAML', () => {
      const schema: OutputSchema = { type: 'yaml' };
      const result = parseStructuredOutput('name: alice\nage: 30', schema);
      expect(result.valid).toBe(true);
      expect(result.parsed).toEqual({ name: 'alice', age: '30' });
    });

    it('passes markdown through as-is', () => {
      const schema: OutputSchema = { type: 'markdown' };
      const md = '# Title\n\nParagraph.';
      const result = parseStructuredOutput(md, schema);
      expect(result.valid).toBe(true);
      expect(result.parsed).toBe(md);
    });
  });

  // -------------------------------------------------------------------------
  // formatAsTable
  // -------------------------------------------------------------------------

  describe('formatAsTable', () => {
    it('formats data as ASCII table', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      const table = formatAsTable(data);
      expect(table).toContain('name');
      expect(table).toContain('age');
      expect(table).toContain('Alice');
      expect(table).toContain('Bob');
      expect(table).toContain('---');
    });

    it('uses specified columns', () => {
      const data = [{ name: 'Alice', age: 30, email: 'a@b.c' }];
      const table = formatAsTable(data, ['name', 'email']);
      expect(table).toContain('name');
      expect(table).toContain('email');
      expect(table).not.toContain('age');
    });

    it('returns (empty) for empty data', () => {
      expect(formatAsTable([])).toBe('(empty)');
    });
  });

  // -------------------------------------------------------------------------
  // formatAsMarkdown
  // -------------------------------------------------------------------------

  describe('formatAsMarkdown', () => {
    it('formats object as markdown list', () => {
      const md = formatAsMarkdown({ name: 'Alice', age: 30 });
      expect(md).toContain('**name**');
      expect(md).toContain('Alice');
      expect(md).toContain('**age**');
    });

    it('formats array as numbered list', () => {
      const md = formatAsMarkdown(['first', 'second', 'third']);
      expect(md).toContain('1. first');
      expect(md).toContain('2. second');
      expect(md).toContain('3. third');
    });

    it('handles null', () => {
      expect(formatAsMarkdown(null)).toBe('_null_');
    });

    it('handles primitive values', () => {
      expect(formatAsMarkdown('hello')).toBe('hello');
      expect(formatAsMarkdown(42)).toBe('42');
    });
  });
});
