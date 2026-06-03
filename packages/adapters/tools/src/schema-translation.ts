/**
 * Schema-translation layer.
 *
 * Re-exports the format-level conversion helpers from `@a5c-ai/transport-adapter`
 * and adds thin adapters between `NormalizedToolDefinition` (transport-mux
 * canonical form) and `ToolDescriptor` (tool-mux lifecycle form).
 */

import type { CodecCapabilities, NormalizedToolDefinition } from '@a5c-ai/transport-adapter';
import { convertTools } from '@a5c-ai/transport-adapter';

import type { ToolDescriptor, ToolSource } from './types.js';

/* ------------------------------------------------------------------ */
/*  Re-exports from transport-mux                                      */
/* ------------------------------------------------------------------ */

export { convertTools };
export type { NormalizedToolDefinition, CodecCapabilities };

type ToolSchemaFormat = CodecCapabilities['toolSchemaFormat'];

/* ------------------------------------------------------------------ */
/*  Descriptor ↔ NormalizedToolDefinition                              */
/* ------------------------------------------------------------------ */

/**
 * Lift a `NormalizedToolDefinition` (format-agnostic shape produced by
 * transport-mux codecs) into a full `ToolDescriptor` by attaching a
 * source tag and optional metadata.
 */
export function toToolDescriptor(
  normalized: NormalizedToolDefinition,
  source: ToolSource,
  extra?: { server?: string; permissions?: string[]; metadata?: Record<string, unknown> },
): ToolDescriptor {
  return {
    name: normalized.name,
    description: normalized.description,
    parameters: normalized.parameters,
    source,
    ...(extra?.server != null && { server: extra.server }),
    ...(extra?.permissions != null && { permissions: extra.permissions }),
    ...(extra?.metadata != null && { metadata: extra.metadata }),
  };
}

/**
 * Strip lifecycle metadata from a `ToolDescriptor`, returning the
 * minimal `NormalizedToolDefinition` understood by transport-mux.
 */
export function fromToolDescriptor(descriptor: ToolDescriptor): NormalizedToolDefinition {
  return {
    name: descriptor.name,
    ...(descriptor.description != null && { description: descriptor.description }),
    ...(descriptor.parameters != null && { parameters: descriptor.parameters }),
  };
}

/**
 * Translate an array of `ToolDescriptor`s into the wire format
 * expected by a specific provider (Anthropic, OpenAI, Google, Bedrock).
 *
 * This is a convenience wrapper that:
 *   1. Strips descriptors down to `NormalizedToolDefinition`.
 *   2. Denormalizes them into the target format via `convertTools`.
 */
export function translateTools(
  descriptors: ToolDescriptor[],
  targetFormat: ToolSchemaFormat,
): unknown[] {
  if (targetFormat === 'none') {
    return [];
  }

  // NormalizedToolDefinition is already "openai-shaped" in practice
  // (name + description + parameters JSON Schema), so we convert from
  // the 'openai' canonical form.
  const normalized = descriptors.map(fromToolDescriptor);
  return convertTools(normalized as unknown[], 'openai', targetFormat);
}
