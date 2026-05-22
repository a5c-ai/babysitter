// Utility functions for UPF compilation

import * as fs from 'fs';
import * as path from 'path';
import type { A5cPluginManifest, FrontmatterData, ParsedFrontmatter } from './types.js';

function toOutputPath(value: string): string {
  return value.replace(/\\/g, '/');
}

export function getCommandPaths(
  sourceDir: string,
  manifest: A5cPluginManifest
): string[] {
  if (!manifest.commands) return [];

  const commandPaths: string[] = [];
  if (typeof manifest.commands === 'string') {
    const commandDir = path.join(sourceDir, manifest.commands);
    if (fs.existsSync(commandDir)) {
      const entries = fs.readdirSync(commandDir);
      for (const entry of entries) {
        if (entry.endsWith('.md')) {
          commandPaths.push(toOutputPath(path.join(manifest.commands, entry)));
        }
      }
    }
  } else {
    commandPaths.push(...manifest.commands.map(toOutputPath));
  }

  return commandPaths;
}

/**
 * Parse YAML frontmatter from a markdown file.
 * Supports both --- and +++ delimiters.
 */
export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const lines = markdown.split('\n');

  if (lines.length === 0) {
    return { data: {}, body: markdown };
  }

  const firstLine = lines[0].trim();
  if (firstLine !== '---' && firstLine !== '+++') {
    return { data: {}, body: markdown };
  }

  const delimiter = firstLine;
  let endIndex = -1;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === delimiter) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { data: {}, body: markdown };
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const bodyLines = lines.slice(endIndex + 1);

  // Simple YAML parser for frontmatter (key: value format)
  const data: FrontmatterData = {};

  for (const line of frontmatterLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    let value: string | boolean | number = trimmed.substring(colonIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse booleans and numbers
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (/^-?\d+(\.\d+)?$/.test(value)) value = parseFloat(value);

    data[key] = value;
  }

  const body = bodyLines.join('\n').trim();
  return { data, body };
}

/**
 * Build a skill SKILL.md from a command markdown file.
 * This mirrors the logic from scripts/plugin-command-sync-lib.cjs.
 */
export function buildSkillFromCommand(name: string, commandMarkdown: string): string {
  const parsed = parseFrontmatter(commandMarkdown);
  const description = (parsed.data.description as string) || `${name} mode.`;

  return renderSkillMarkdown(name, description, parsed.body);
}

/**
 * Render a skill SKILL.md file with frontmatter and body.
 */
export function renderSkillMarkdown(
  name: string,
  description: string,
  body: string
): string {
  const lines = [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    '---',
    '',
    `# ${name}`,
    '',
    body.trim(),
    '',
  ];

  return lines.join('\n');
}

/**
 * Convert Markdown command to TOML format (for Gemini).
 * Extracts description from frontmatter and body as prompt.
 */
export function markdownToToml(commandMarkdown: string): string {
  const parsed = parseFrontmatter(commandMarkdown);
  const description = parsed.data.description as string || '';
  const prompt = parsed.body.trim();

  return generateToml({ description, prompt });
}

/**
 * Generate TOML from a simple object (flat key-value pairs).
 */
export function generateToml(obj: Record<string, string>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === '') continue;

    const escaped = value.replace(/\r/g, '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    lines.push(`${key} = "${escaped}"`);
  }

  return lines.join('\n\n') + '\n';
}

/**
 * Deep merge two objects, with null deletion semantics.
 * - Scalars: target replaces base
 * - Objects: deep merge recursively
 * - Arrays: target replaces base entirely
 * - null values: delete the key
 */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base };

  for (const key of Object.keys(override) as Array<keyof T>) {
    const overrideValue = override[key];

    // null deletes the key
    if (overrideValue === null) {
      delete result[key];
      continue;
    }

    // If override value is undefined, skip
    if (overrideValue === undefined) {
      continue;
    }

    const baseValue = result[key];

    // If base doesn't have this key, just set it
    if (!(key in result)) {
      result[key] = overrideValue as T[keyof T];
      continue;
    }

    // If both are objects (not arrays), recurse
    if (
      typeof baseValue === 'object' &&
      baseValue !== null &&
      !Array.isArray(baseValue) &&
      typeof overrideValue === 'object' &&
      overrideValue !== null &&
      !Array.isArray(overrideValue)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        overrideValue as Record<string, unknown>
      ) as T[keyof T];
    } else {
      // Scalars and arrays: override replaces
      result[key] = overrideValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Slugify a string to kebab-case for breakpoint IDs.
 */
export function slugify(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a value is a plain object.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
