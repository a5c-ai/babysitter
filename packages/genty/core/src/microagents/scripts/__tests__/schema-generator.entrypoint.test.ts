import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as path from 'node:path';

/**
 * Tests for the schema-generator entrypoint script.
 *
 * Spawns the compiled entrypoint as a subprocess, feeding JSON via stdin
 * and validating JSON from stdout.
 */

const entrypoint = path.resolve(
  __dirname,
  '..', '..', '..', '..', 'dist',
  'microagents', 'scripts', 'schema-generator.entrypoint.js',
);

function run(input: {
  examples: unknown[];
  description: string;
  format: string;
}): { schema: unknown; format: string } {
  const stdout = execFileSync('node', [entrypoint], {
    input: JSON.stringify(input),
    encoding: 'utf-8',
    timeout: 10_000,
  });
  return JSON.parse(stdout);
}

// ---------------------------------------------------------------------------
// JSON Schema output
// ---------------------------------------------------------------------------

describe('schema-generator entrypoint', () => {
  describe('json-schema format', () => {
    it('infers an object schema from flat examples', () => {
      const out = run({
        examples: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
        description: 'A person record',
        format: 'json-schema',
      });

      expect(out.format).toBe('json-schema');
      const schema = out.schema as Record<string, unknown>;
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.type).toBe('object');
      expect(schema.description).toBe('A person record');

      const props = schema.properties as Record<string, { type: string }>;
      expect(props.name.type).toBe('string');
      expect(props.age.type).toBe('number');

      // Both fields appear in all examples, so they should be required
      expect(schema.required).toEqual(expect.arrayContaining(['age', 'name']));
    });

    it('marks optional fields that do not appear in every example', () => {
      const out = run({
        examples: [
          { name: 'Alice', age: 30, email: 'alice@test.com' },
          { name: 'Bob', age: 25 },
        ],
        description: 'Person with optional email',
        format: 'json-schema',
      });

      const schema = out.schema as Record<string, unknown>;
      const required = schema.required as string[];
      expect(required).toContain('name');
      expect(required).toContain('age');
      expect(required).not.toContain('email');
    });

    it('infers array item schema', () => {
      const out = run({
        examples: [
          { tags: ['a', 'b'] },
          { tags: ['c'] },
        ],
        description: 'Object with string array',
        format: 'json-schema',
      });

      const schema = out.schema as Record<string, unknown>;
      const props = schema.properties as Record<string, Record<string, unknown>>;
      expect(props.tags.type).toBe('array');
      expect((props.tags.items as Record<string, unknown>).type).toBe('string');
    });

    it('detects enums for small finite value sets', () => {
      const out = run({
        examples: [
          { status: 'active' },
          { status: 'inactive' },
          { status: 'active' },
          { status: 'inactive' },
        ],
        description: 'Status field',
        format: 'json-schema',
      });

      const schema = out.schema as Record<string, unknown>;
      const props = schema.properties as Record<string, Record<string, unknown>>;
      expect(props.status.enum).toEqual(expect.arrayContaining(['active', 'inactive']));
    });

    it('handles boolean fields', () => {
      const out = run({
        examples: [{ enabled: true }, { enabled: false }],
        description: 'Toggle',
        format: 'json-schema',
      });

      const schema = out.schema as Record<string, unknown>;
      const props = schema.properties as Record<string, Record<string, unknown>>;
      expect(props.enabled.type).toBe('boolean');
    });

    it('handles empty examples', () => {
      const out = run({
        examples: [],
        description: 'Empty',
        format: 'json-schema',
      });

      const schema = out.schema as Record<string, unknown>;
      expect(schema.type).toBe('object');
    });
  });

  // ---------------------------------------------------------------------------
  // TypeBox output
  // ---------------------------------------------------------------------------

  describe('typebox format', () => {
    it('generates TypeBox code for a flat object', () => {
      const out = run({
        examples: [{ name: 'Alice', count: 5 }],
        description: 'Test',
        format: 'typebox',
      });

      expect(out.format).toBe('typebox');
      const code = out.schema as string;
      expect(code).toContain("import { Type } from '@sinclair/typebox'");
      expect(code).toContain('Type.Object');
      expect(code).toContain('Type.String()');
      expect(code).toContain('Type.Number()');
    });
  });

  // ---------------------------------------------------------------------------
  // Zod output
  // ---------------------------------------------------------------------------

  describe('zod format', () => {
    it('generates Zod code with required and optional fields', () => {
      const out = run({
        examples: [
          { name: 'Alice', bio: 'hello' },
          { name: 'Bob' },
        ],
        description: 'Test',
        format: 'zod',
      });

      expect(out.format).toBe('zod');
      const code = out.schema as string;
      expect(code).toContain("import { z } from 'zod'");
      expect(code).toContain('z.object');
      expect(code).toContain('z.string()');
      // bio should be optional since it only appears once
      expect(code).toContain('.optional()');
    });
  });

  // ---------------------------------------------------------------------------
  // Yup output
  // ---------------------------------------------------------------------------

  describe('yup format', () => {
    it('generates Yup code for a flat object', () => {
      const out = run({
        examples: [{ active: true, count: 10 }],
        description: 'Test',
        format: 'yup',
      });

      expect(out.format).toBe('yup');
      const code = out.schema as string;
      expect(code).toContain("import * as yup from 'yup'");
      expect(code).toContain('yup.object');
      expect(code).toContain('yup.boolean()');
      expect(code).toContain('yup.number()');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles nested objects', () => {
      const out = run({
        examples: [
          { user: { name: 'Alice', age: 30 } },
          { user: { name: 'Bob', age: 25 } },
        ],
        description: 'Nested user',
        format: 'json-schema',
      });

      const schema = out.schema as Record<string, unknown>;
      const props = schema.properties as Record<string, Record<string, unknown>>;
      expect(props.user.type).toBe('object');
      expect(props.user.properties).toBeDefined();
    });

    it('handles null values', () => {
      const out = run({
        examples: [null, null],
        description: 'Null values',
        format: 'json-schema',
      });

      const schema = out.schema as Record<string, unknown>;
      expect(schema.type).toBe('null');
    });

    it('handles scalar examples', () => {
      const out = run({
        examples: [42, 100, 7],
        description: 'Number values',
        format: 'json-schema',
      });

      const schema = out.schema as Record<string, unknown>;
      expect(schema.type).toBe('number');
    });
  });
});
