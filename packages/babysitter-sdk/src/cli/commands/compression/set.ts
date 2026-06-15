/**
 * compression:set — update a specific compression config value in the project config.
 *
 * Usage:
 *   babysitter compression:set <layer.key> <value> [--json]
 *
 * Examples:
 *   babysitter compression:set userPromptHook.threshold 300
 *   babysitter compression:set userPromptHook.keepRatio 0.85
 *   babysitter compression:set sdkContextHook.targetReduction 0.2
 *   babysitter compression:set sdkContextHook.minCompressionTokens 100
 *   babysitter compression:set commandOutputHook.excludeCommands node,python,ruby
 *   babysitter compression:set processLibraryCache.targetReduction 0.3
 *   babysitter compression:set processLibraryCache.ttlHours 48
 *   babysitter compression:set enabled false
 *
 * Writes the change to .a5c/compression.config.json in the current project.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompressionSetOptions {
  key: string;
  value: string;
  json?: boolean;
  cwd?: string;
}

type FieldType = 'number' | 'boolean' | 'string[]';

interface KnownField {
  layer: string | null; // null = top-level (e.g. "enabled")
  field: string;
  type: FieldType;
  description: string;
}

// ---------------------------------------------------------------------------
// Known settable fields
// ---------------------------------------------------------------------------

const KNOWN_FIELDS: KnownField[] = [
  { layer: null,                  field: 'enabled',              type: 'boolean', description: 'Master compression switch' },
  { layer: 'userPromptHook',      field: 'threshold',            type: 'number',  description: 'Min tokens before compression triggers' },
  { layer: 'userPromptHook',      field: 'keepRatio',            type: 'number',  description: 'Fraction of tokens to keep (0–1)' },
  { layer: 'commandOutputHook',   field: 'excludeCommands',      type: 'string[]', description: 'Comma-separated command names to skip compression' },
  { layer: 'sdkContextHook',      field: 'targetReduction',      type: 'number',  description: 'Fraction of SDK context to remove (0–1)' },
  { layer: 'sdkContextHook',      field: 'minCompressionTokens', type: 'number',  description: 'Min tokens before SDK context compression triggers' },
  { layer: 'processLibraryCache', field: 'targetReduction',      type: 'number',  description: 'Fraction of library cache to remove (0–1)' },
  { layer: 'processLibraryCache', field: 'ttlHours',             type: 'number',  description: 'How many hours a compressed cache entry is valid' },
];

function findField(dotKey: string): KnownField | undefined {
  const parts = dotKey.split('.');
  if (parts.length === 1) {
    return KNOWN_FIELDS.find(f => f.layer === null && f.field === parts[0]);
  }
  if (parts.length === 2) {
    return KNOWN_FIELDS.find(f => f.layer === parts[0] && f.field === parts[1]);
  }
  return undefined;
}

function validKeysText(): string {
  return KNOWN_FIELDS.map(f => (f.layer ? `${f.layer}.${f.field}` : f.field)).join(', ');
}

// ---------------------------------------------------------------------------
// Value parsing
// ---------------------------------------------------------------------------

function parseValue(raw: string, type: FieldType, key: string): unknown {
  switch (type) {
    case 'number': {
      const n = Number(raw);
      if (isNaN(n)) throw new Error(`"${key}" expects a number, got: ${raw}`);
      return n;
    }
    case 'boolean': {
      const v = raw.trim().toLowerCase();
      if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
      if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
      throw new Error(`"${key}" expects true/false, got: ${raw}`);
    }
    case 'string[]':
      return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
}

// ---------------------------------------------------------------------------
// Config file helpers
// ---------------------------------------------------------------------------

function configFilePath(projectDir: string): string {
  return path.join(projectDir, '.a5c', 'compression.config.json');
}

async function readExistingConfig(filePath: string): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // File doesn't exist or is malformed — start fresh
  }
  return {};
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleCompressionSet(opts: CompressionSetOptions): Promise<number> {
  const projectDir = opts.cwd ?? process.cwd();
  const { key, value } = opts;

  const field = findField(key);
  if (!field) {
    const msg = `Unknown key: "${key}". Valid keys: ${validKeysText()}`;
    if (opts.json) {
      process.stderr.write(JSON.stringify({ error: msg }) + "\n");
    } else {
      process.stderr.write(`Error: ${msg}\n`);
    }
    return 1;
  }

  let parsed: unknown;
  try {
    parsed = parseValue(value, field.type, key);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (opts.json) {
      process.stderr.write(JSON.stringify({ error: msg }) + "\n");
    } else {
      process.stderr.write(`Error: ${msg}\n`);
    }
    return 1;
  }

  const filePath = configFilePath(projectDir);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const existing = await readExistingConfig(filePath);

  // Apply the value at the right depth
  if (field.layer === null) {
    existing[field.field] = parsed;
  } else {
    const layers = (existing.layers ?? {}) as Record<string, unknown>;
    const layerObj = (layers[field.layer] ?? {}) as Record<string, unknown>;
    layerObj[field.field] = parsed;
    layers[field.layer] = layerObj;
    existing.layers = layers;
  }

  await fs.writeFile(filePath, JSON.stringify(existing, null, 2) + '\n', 'utf8');

  if (opts.json) {
    process.stdout.write(JSON.stringify({ key, value: parsed, configFile: filePath }) + "\n");
  } else {
    process.stdout.write(`Set ${key} = ${JSON.stringify(parsed)}\n`);
    process.stdout.write(`Config written to: ${filePath}\n`);
  }

  return 0;
}
