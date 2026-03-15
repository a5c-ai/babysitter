/**
 * compression:toggle — enable or disable a compression layer in the project config.
 *
 * Usage:
 *   babysitter compression:toggle <layer> <on|off> [--json]
 *
 * Writes the change to .a5c/compression.config.json in the current project.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KnownLayer = 'userPromptHook' | 'commandOutputHook' | 'sdkContextHook' | 'processLibraryCache';

export interface CompressionToggleOptions {
  layer: string;
  value: boolean;
  json?: boolean;
  cwd?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KNOWN_LAYERS: KnownLayer[] = [
  'userPromptHook',
  'commandOutputHook',
  'sdkContextHook',
  'processLibraryCache',
];

function isKnownLayer(layer: string): layer is KnownLayer {
  return KNOWN_LAYERS.includes(layer as KnownLayer);
}

// ---------------------------------------------------------------------------
// Helpers
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

export async function handleCompressionToggle(opts: CompressionToggleOptions): Promise<number> {
  const projectDir = opts.cwd ?? process.cwd();

  if (!isKnownLayer(opts.layer)) {
    const msg = `Unknown layer: "${opts.layer}". Valid layers: ${KNOWN_LAYERS.join(', ')}`;
    if (opts.json) {
      console.error(JSON.stringify({ error: msg }));
    } else {
      console.error(`Error: ${msg}`);
    }
    return 1;
  }

  const filePath = configFilePath(projectDir);

  // Ensure .a5c directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Read current on-disk config (if any)
  const existing = await readExistingConfig(filePath);

  // Patch only the targeted layer's `enabled` key
  const layers = (existing.layers ?? {}) as Record<string, unknown>;
  const layerObj = (layers[opts.layer] ?? {}) as Record<string, unknown>;
  layerObj['enabled'] = opts.value;
  layers[opts.layer] = layerObj;
  existing.layers = layers;

  const json = JSON.stringify(existing, null, 2) + '\n';
  await fs.writeFile(filePath, json, 'utf8');

  const action = opts.value ? 'enabled' : 'disabled';
  if (opts.json) {
    console.log(JSON.stringify({ layer: opts.layer, enabled: opts.value, configFile: filePath }));
  } else {
    console.log(`Compression layer "${opts.layer}" ${action}.`);
    console.log(`Config written to: ${filePath}`);
  }

  return 0;
}
