import { promises as fs, existsSync } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { resolveActiveProcessLibrary } from '../../../processLibrary/active';
import type {
  AgentMetadata,
  DiscoveryCacheEntry,
  ProcessMetadata,
  SkillMetadata,
} from './types';

export const DEFAULT_CACHE_TTL = 300;
const CACHE_DIR = path.join(os.tmpdir(), 'babysitter-skill-cache');

function parseFrontmatter(content: string): Record<string, string> {
  const lines = content.split('\n');
  let inFrontmatter = false;
  const fields: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      }
      break;
    }

    if (inFrontmatter && trimmed && !trimmed.startsWith('- ')) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        let value = trimmed.slice(colonIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (value) {
          fields[key] = value;
        }
      }
    }
  }

  return fields;
}

export function parseSkillFrontmatter(content: string): {
  name: string;
  description: string;
  category: string;
} | null {
  const fields = parseFrontmatter(content);
  const name = fields.name;
  if (!name) return null;

  return {
    name,
    description: fields.description || '',
    category: fields.category || fields.domain || '',
  };
}

function parseAgentFrontmatter(content: string): {
  name: string;
  description: string;
  role?: string;
  category: string;
} | null {
  const fields = parseFrontmatter(content);
  const name = fields.name;
  if (!name) return null;

  return {
    name,
    description: fields.description || '',
    role: fields.role || undefined,
    category: fields.category || fields.domain || '',
  };
}

async function findMarkdownFiles(
  dir: string,
  targetName: string,
  maxDepth: number = 5,
): Promise<string[]> {
  const results: string[] = [];
  const resolvedDir = path.resolve(dir);

  async function scan(currentDir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isFile() && entry.name === targetName) {
        results.push(fullPath);
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await scan(fullPath, depth + 1);
      }
    }
  }

  await scan(resolvedDir, 0);
  return results;
}

async function findSkillFiles(dir: string, maxDepth: number = 5): Promise<string[]> {
  return findMarkdownFiles(dir, 'SKILL.md', maxDepth);
}

async function findAgentFiles(dir: string, maxDepth: number = 5): Promise<string[]> {
  return findMarkdownFiles(dir, 'AGENT.md', maxDepth);
}

async function findProcessFiles(dir: string): Promise<string[]> {
  try {
    const resolvedDir = path.resolve(dir);
    const entries = await fs.readdir(resolvedDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
      .map((entry) => path.join(resolvedDir, entry.name));
  } catch {
    return [];
  }
}

export async function scanSkillsDirectory(
  dir: string,
  source: 'local' | 'local-plugin',
  maxFiles: number = 50,
): Promise<SkillMetadata[]> {
  const skills: SkillMetadata[] = [];
  const skillFiles = await findSkillFiles(dir);

  for (const file of skillFiles.slice(0, maxFiles)) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const parsed = parseSkillFrontmatter(content);
      if (parsed) {
        skills.push({
          ...parsed,
          description: parsed.description.slice(0, 80),
          source,
          file,
        });
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return skills;
}

export async function scanAgentsDirectory(
  dir: string,
  source: 'local' | 'local-plugin',
  maxFiles: number = 50,
): Promise<AgentMetadata[]> {
  const agents: AgentMetadata[] = [];
  const agentFiles = await findAgentFiles(dir);

  for (const file of agentFiles.slice(0, maxFiles)) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const parsed = parseAgentFrontmatter(content);
      if (parsed) {
        agents.push({
          ...parsed,
          description: parsed.description.slice(0, 80),
          source,
          file,
        });
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return agents;
}

export async function scanProcessesDirectory(
  dir: string,
  category: string,
  source: 'library' | 'repo',
): Promise<ProcessMetadata[]> {
  const jsFiles = await findProcessFiles(dir);
  return jsFiles.map((file) => ({
    name: path.basename(file, '.js'),
    category,
    source,
    file,
  }));
}

export function extractSpecializationFromProcessPath(processPath: string): string | null {
  const normalized = processPath.replace(/\\/g, '/');
  const match = normalized.match(/specializations\/([^/]+)/);
  return match ? match[1] : null;
}

function getCachePath(runId: string, suffix: 'json' | 'summary'): string {
  const safeId = runId || 'default';
  return path.join(CACHE_DIR, `${safeId}.${suffix}`);
}

export async function readCache(
  runId: string,
  ttl: number,
): Promise<DiscoveryCacheEntry | null> {
  const cachePath = getCachePath(runId, 'json');
  try {
    const content = await fs.readFile(cachePath, 'utf8');
    const entry = JSON.parse(content) as DiscoveryCacheEntry;
    if (!Array.isArray(entry.agents)) return null;
    const age = (Date.now() - entry.timestamp) / 1000;
    if (age < ttl) {
      return entry;
    }
  } catch {
    // Cache miss
  }
  return null;
}

export async function writeCache(runId: string, entry: DiscoveryCacheEntry): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const cachePath = getCachePath(runId, 'json');
    await fs.writeFile(cachePath, JSON.stringify(entry), 'utf8');
    const summaryPath = getCachePath(runId, 'summary');
    await fs.writeFile(summaryPath, entry.summary, 'utf8');
  } catch {
    // Cache write failure is non-fatal
  }
}

export async function detectRunDomain(runId: string, runsDir: string): Promise<string> {
  if (!runId) return '';

  const runDir = path.join(runsDir, runId);
  try {
    const files = await fs.readdir(runDir);
    const jsFile = files.find((file) => file.endsWith('.js'));
    if (jsFile) {
      const content = await fs.readFile(path.join(runDir, jsFile), 'utf8');
      const match = content.match(/(?:domain|category|specialization)[:\s]*["']?([a-z-]+)/i);
      if (match) {
        return match[1].toLowerCase();
      }
    }
  } catch {
    // Ignore errors
  }
  return '';
}

export function generateSummary(skills: SkillMetadata[], agents: AgentMetadata[]): string {
  const parts: string[] = [];
  if (skills.length > 0) {
    parts.push(
      skills
        .map((skill) => `${skill.name} (${skill.description.slice(0, 60) || 'no description'})`)
        .join(', '),
    );
  }
  if (agents.length > 0) {
    parts.push(
      agents
        .map((agent) => `${agent.name} (${agent.description.slice(0, 60) || 'no description'})`)
        .join(', '),
    );
  }
  return parts.join(', ');
}

export function deduplicateSkills(skills: SkillMetadata[]): SkillMetadata[] {
  const seen = new Set<string>();
  return skills.filter((skill) => {
    if (seen.has(skill.name)) return false;
    seen.add(skill.name);
    return true;
  });
}

export function deduplicateAgents(agents: AgentMetadata[]): AgentMetadata[] {
  const seen = new Set<string>();
  return agents.filter((agent) => {
    if (seen.has(agent.name)) return false;
    seen.add(agent.name);
    return true;
  });
}

export function sortSkillsByDomain(skills: SkillMetadata[], domain: string): SkillMetadata[] {
  if (!domain) return skills;
  const lowerDomain = domain.toLowerCase();
  return [...skills].sort((left, right) => {
    const leftMatch = left.category.toLowerCase().includes(lowerDomain) ? 0 : 1;
    const rightMatch = right.category.toLowerCase().includes(lowerDomain) ? 0 : 1;
    return leftMatch - rightMatch;
  });
}

export function sortAgentsByDomain(agents: AgentMetadata[], domain: string): AgentMetadata[] {
  if (!domain) return agents;
  const lowerDomain = domain.toLowerCase();
  return [...agents].sort((left, right) => {
    const leftMatch = left.category.toLowerCase().includes(lowerDomain) ? 0 : 1;
    const rightMatch = right.category.toLowerCase().includes(lowerDomain) ? 0 : 1;
    return leftMatch - rightMatch;
  });
}

export function capPerSpecialization<T extends { file?: string }>(items: T[], cap: number): T[] {
  const counts = new Map<string, number>();
  return items.filter((item) => {
    if (!item.file) return true;
    const normalized = item.file.replace(/\\/g, '/');
    const match = normalized.match(/\/specializations\/([^/]+)\//);
    if (!match) return true;
    const specialization = match[1].toLowerCase();
    const count = counts.get(specialization) ?? 0;
    if (count >= cap) return false;
    counts.set(specialization, count + 1);
    return true;
  });
}

function resolveLegacyPluginProcessRoot(pluginRoot: string): string {
  return path.join(pluginRoot, 'skills', 'babysit', 'process');
}

function findRepoLibraryRoot(start: string): string | null {
  for (let current = path.resolve(start); current; ) {
    const candidate = path.join(current, 'library');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return null;
}

export function resolveStaticProcessRoot(options: {
  pluginRoot?: string;
  processRoot?: string;
}): string {
  if (options.processRoot) {
    return path.resolve(options.processRoot);
  }
  if (options.pluginRoot) {
    const repoLibraryRoot = findRepoLibraryRoot(options.pluginRoot);
    if (repoLibraryRoot) {
      return repoLibraryRoot;
    }
    return resolveLegacyPluginProcessRoot(options.pluginRoot);
  }
  return path.resolve(process.cwd(), 'library');
}

export async function resolveDiscoveryProcessRoot(options: {
  pluginRoot?: string;
  libraryPath?: string;
  runId?: string;
}): Promise<string> {
  if (options.libraryPath) {
    return path.resolve(options.libraryPath);
  }

  try {
    const active = await resolveActiveProcessLibrary({
      stateDir: path.resolve(process.cwd(), '.a5c'),
      runId: options.runId,
    });
    if (active.binding?.dir) {
      return path.resolve(active.binding.dir);
    }
  } catch {
    // Fall back to repo-local/library or legacy plugin-local roots.
  }

  return resolveStaticProcessRoot({ pluginRoot: options.pluginRoot });
}
