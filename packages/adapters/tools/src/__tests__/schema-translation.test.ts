import { describe, expect, it } from 'vitest';

import {
  toToolDescriptor,
  fromToolDescriptor,
  translateTools,
} from '../schema-translation.js';
import type { NormalizedToolDefinition } from '../schema-translation.js';
import type { ToolDescriptor } from '../types.js';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function makeNormalized(
  overrides: Partial<NormalizedToolDefinition> = {},
): NormalizedToolDefinition {
  return {
    name: 'test_tool',
    description: 'A test tool',
    parameters: { type: 'object', properties: { x: { type: 'string' } } },
    ...overrides,
  };
}

function makeDescriptor(overrides: Partial<ToolDescriptor> = {}): ToolDescriptor {
  return {
    name: 'test_tool',
    description: 'A test tool',
    parameters: { type: 'object', properties: { x: { type: 'string' } } },
    source: 'builtin',
    ...overrides,
  };
}

/* ========================================================================== */
/*  Schema Translation                                                        */
/* ========================================================================== */

describe('schema-translation', () => {
  /* ---------------------------------------------------------------------- */
  /*  toToolDescriptor                                                       */
  /* ---------------------------------------------------------------------- */

  describe('toToolDescriptor', () => {
    it('creates a ToolDescriptor from a NormalizedToolDefinition', () => {
      const normalized = makeNormalized({ name: 'my_fn', description: 'Does stuff' });

      const descriptor = toToolDescriptor(normalized, 'mcp');

      expect(descriptor.name).toBe('my_fn');
      expect(descriptor.description).toBe('Does stuff');
      expect(descriptor.source).toBe('mcp');
      expect(descriptor.parameters).toEqual(normalized.parameters);
    });

    it('attaches optional server, permissions, and metadata', () => {
      const normalized = makeNormalized();

      const descriptor = toToolDescriptor(normalized, 'plugin', {
        server: 'srv-1',
        permissions: ['read', 'write'],
        metadata: { version: 2 },
      });

      expect(descriptor.server).toBe('srv-1');
      expect(descriptor.permissions).toEqual(['read', 'write']);
      expect(descriptor.metadata).toEqual({ version: 2 });
    });

    it('omits optional fields when extras are not provided', () => {
      const descriptor = toToolDescriptor(makeNormalized(), 'builtin');

      expect(descriptor.server).toBeUndefined();
      expect(descriptor.permissions).toBeUndefined();
      expect(descriptor.metadata).toBeUndefined();
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  fromToolDescriptor                                                     */
  /* ---------------------------------------------------------------------- */

  describe('fromToolDescriptor', () => {
    it('strips lifecycle metadata and returns NormalizedToolDefinition', () => {
      const descriptor = makeDescriptor({
        name: 'stripped',
        description: 'keep me',
        server: 'srv-x',
        permissions: ['admin'],
        metadata: { extra: true },
      });

      const normalized = fromToolDescriptor(descriptor);

      expect(normalized.name).toBe('stripped');
      expect(normalized.description).toBe('keep me');
      expect(normalized.parameters).toEqual(descriptor.parameters);
      // Lifecycle fields should not be present
      expect((normalized as any).source).toBeUndefined();
      expect((normalized as any).server).toBeUndefined();
      expect((normalized as any).permissions).toBeUndefined();
    });

    it('omits description when not present on descriptor', () => {
      const descriptor = makeDescriptor({ description: undefined });
      const normalized = fromToolDescriptor(descriptor);

      expect(normalized).not.toHaveProperty('description');
    });

    it('omits parameters when not present on descriptor', () => {
      const descriptor = makeDescriptor({ parameters: undefined });
      const normalized = fromToolDescriptor(descriptor);

      expect(normalized).not.toHaveProperty('parameters');
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  Round-trip                                                             */
  /* ---------------------------------------------------------------------- */

  describe('round-trip', () => {
    it('toToolDescriptor -> fromToolDescriptor preserves core data', () => {
      const original = makeNormalized({
        name: 'round_trip',
        description: 'survives the trip',
        parameters: { type: 'object', properties: { q: { type: 'number' } } },
      });

      const descriptor = toToolDescriptor(original, 'custom', { server: 'srv' });
      const backToNormalized = fromToolDescriptor(descriptor);

      expect(backToNormalized.name).toBe(original.name);
      expect(backToNormalized.description).toBe(original.description);
      expect(backToNormalized.parameters).toEqual(original.parameters);
    });
  });

  /* ---------------------------------------------------------------------- */
  /*  translateTools                                                         */
  /* ---------------------------------------------------------------------- */

  describe('translateTools', () => {
    it('produces an array for a valid target format', () => {
      const descriptors = [
        makeDescriptor({ name: 'tool_a' }),
        makeDescriptor({ name: 'tool_b' }),
      ];

      const result = translateTools(descriptors, 'anthropic');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns empty array for target format "none"', () => {
      const descriptors = [makeDescriptor({ name: 'tool_a' })];

      const result = translateTools(descriptors, 'none');
      expect(result).toEqual([]);
    });
  });
});
