/**
 * SkillDiscoveryService — scans directories for SKILL.md files, parses
 * frontmatter, and converts them to SkillDescriptor instances for the router.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { SkillDescriptor } from './types';

/** Raw parsed representation from a SKILL.md file before normalization. */
export interface RawSkillEntry {
  name: string;
  description: string;
  capabilities: string[];
  triggers: string[];
  domain: string | undefined;
  filePath: string;
  frontmatter: Record<string, unknown>;
}

// ---- frontmatter parsing ----

function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  // Lightweight YAML-like parser for simple key: value pairs and arrays.
  // Avoids pulling in a full YAML parser dependency.
  const lines = (match[1] ?? '').split(/\r?\n/);
  const fm: Record<string, unknown> = {};
  let currentKey = '';
  let currentArray: string[] | null = null;

  for (const line of lines) {
    const arrayItem = line.match(/^\s+-\s+(.*)/);
    if (arrayItem && currentKey) {
      if (!currentArray) {
        currentArray = [];
      }
      currentArray.push(arrayItem[1]!.trim());
      continue;
    }

    // Flush pending array
    if (currentArray && currentKey) {
      fm[currentKey] = currentArray;
      currentArray = null;
    }

    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1]!;
      const value = kvMatch[2]!.trim();
      if (value.length > 0) {
        // Inline array: [a, b, c]
        if (value.startsWith('[') && value.endsWith(']')) {
          fm[currentKey] = value
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''))
            .filter((s) => s.length > 0);
        } else {
          fm[currentKey] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
  }

  // Flush trailing array
  if (currentArray && currentKey) {
    fm[currentKey] = currentArray;
  }

  return { frontmatter: fm, body: content.slice(match[0].length) };
}

function firstParagraph(body: string): string {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('```'));
  return lines[0] ?? '';
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }
  return [];
}

// ---- filesystem helpers ----

function isDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function readFileUtf8(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function walkForSkillFiles(dir: string): string[] {
  const results: string[] = [];

  const walk = (current: string): void => {
    let entries: string[];
    try {
      entries = fs.readdirSync(current);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const full = path.join(current, entry);
      if (isDir(full)) {
        walk(full);
      } else if (entry === 'SKILL.md') {
        results.push(full);
      }
    }
  };

  walk(dir);
  return results.sort();
}

// ---- public API ----

export class SkillDiscoveryService {
  /**
   * Parse a single SKILL.md file into a RawSkillEntry.
   */
  parseSkillFile(filePath: string): RawSkillEntry {
    const content = readFileUtf8(filePath);
    const { frontmatter, body } = parseFrontmatter(content);

    const name =
      typeof frontmatter.name === 'string' && frontmatter.name.length > 0
        ? frontmatter.name
        : path.basename(path.dirname(filePath));

    const description =
      typeof frontmatter.description === 'string' && frontmatter.description.length > 0
        ? frontmatter.description
        : firstParagraph(body);

    const capabilities = toStringArray(frontmatter.capabilities);
    const triggers = toStringArray(frontmatter.triggers);
    const domain =
      typeof frontmatter.domain === 'string' && frontmatter.domain.length > 0
        ? frontmatter.domain
        : undefined;

    return {
      name,
      description,
      capabilities,
      triggers,
      domain,
      filePath,
      frontmatter,
    };
  }

  /**
   * Convert a RawSkillEntry (or any raw-shaped object) to a SkillDescriptor.
   */
  toDescriptor(
    raw: RawSkillEntry,
    source: SkillDescriptor['source'] = 'local',
  ): SkillDescriptor {
    return {
      name: raw.name,
      description: raw.description,
      capabilities: raw.capabilities.length > 0 ? raw.capabilities : undefined,
      source,
      triggers: raw.triggers.length > 0 ? raw.triggers : undefined,
      domain: raw.domain,
      filePath: raw.filePath,
    };
  }

  /**
   * Scan a single directory tree for SKILL.md files and return descriptors.
   */
  discoverLocal(dir: string): SkillDescriptor[] {
    if (!isDir(dir)) return [];
    const files = walkForSkillFiles(dir);
    return files.map((f) => this.toDescriptor(this.parseSkillFile(f), 'local'));
  }

  /**
   * Scan multiple plugin directories and return descriptors with source='plugin'.
   */
  discoverPlugins(dirs: string[]): SkillDescriptor[] {
    const results: SkillDescriptor[] = [];
    for (const dir of dirs) {
      if (!isDir(dir)) continue;
      const files = walkForSkillFiles(dir);
      for (const f of files) {
        results.push(this.toDescriptor(this.parseSkillFile(f), 'plugin'));
      }
    }
    return results;
  }
}
