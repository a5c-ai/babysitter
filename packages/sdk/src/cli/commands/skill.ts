/**
 * Skill discovery CLI commands.
 * Replaces bash logic from skill-context-resolver.sh and skill-discovery.sh
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Parsed arguments for skill commands.
 */
export interface SkillCommandArgs {
  pluginRoot?: string;
  runId?: string;
  cacheTtl?: number;
  sourceType?: 'github' | 'well-known';
  url?: string;
  json: boolean;
  runsDir?: string;
}

/**
 * Discovered skill metadata.
 */
export interface SkillMetadata {
  name: string;
  description: string;
  category: string;
  source: 'local' | 'local-plugin' | 'remote';
  file?: string;
  url?: string;
}

/**
 * Cache entry for skill discovery.
 */
interface SkillCacheEntry {
  skills: SkillMetadata[];
  summary: string;
  timestamp: number;
}

const DEFAULT_CACHE_TTL = 300; // 5 minutes
const CACHE_DIR = path.join(os.tmpdir(), 'babysitter-skill-cache');

/**
 * Parse YAML frontmatter from a SKILL.md file content.
 */
function parseSkillFrontmatter(content: string): { name: string; description: string; category: string } | null {
  const lines = content.split('\n');
  let inFrontmatter = false;
  const frontmatter: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        break;
      }
    }

    if (inFrontmatter && trimmed) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        let value = trimmed.slice(colonIndex + 1).trim();
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        frontmatter[key] = value;
      }
    }
  }

  const name = frontmatter.name;
  if (!name) return null;

  return {
    name,
    description: frontmatter.description || '',
    category: frontmatter.category || frontmatter.domain || '',
  };
}

/**
 * Recursively find all SKILL.md files in a directory.
 */
async function findSkillFiles(dir: string, maxDepth: number = 5): Promise<string[]> {
  const results: string[] = [];

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
      if (entry.isFile() && entry.name === 'SKILL.md') {
        results.push(fullPath);
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await scan(fullPath, depth + 1);
      }
    }
  }

  await scan(dir, 0);
  return results;
}

/**
 * Read and parse skills from a directory.
 */
async function scanSkillsDirectory(
  dir: string,
  source: 'local' | 'local-plugin',
  maxFiles: number = 50
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
          description: parsed.description.slice(0, 80), // Truncate for compactness
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

/**
 * Get cache file path for a run ID.
 */
function getCachePath(runId: string, suffix: 'json' | 'summary'): string {
  const safeId = runId || 'default';
  return path.join(CACHE_DIR, `${safeId}.${suffix}`);
}

/**
 * Read cached skills if valid.
 */
async function readCache(runId: string, ttl: number): Promise<SkillCacheEntry | null> {
  const cachePath = getCachePath(runId, 'json');
  try {
    const content = await fs.readFile(cachePath, 'utf8');
    const entry: SkillCacheEntry = JSON.parse(content);
    const age = (Date.now() - entry.timestamp) / 1000;
    if (age < ttl) {
      return entry;
    }
  } catch {
    // Cache miss
  }
  return null;
}

/**
 * Write cache entry.
 */
async function writeCache(runId: string, entry: SkillCacheEntry): Promise<void> {
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

/**
 * Detect domain/category from run process definition.
 */
async function detectRunDomain(runId: string, runsDir: string): Promise<string> {
  if (!runId) return '';

  const runDir = path.join(runsDir, runId);
  try {
    const files = await fs.readdir(runDir);
    const jsFile = files.find(f => f.endsWith('.js'));
    if (jsFile) {
      const content = await fs.readFile(path.join(runDir, jsFile), 'utf8');
      // Look for domain hints in comments or metadata
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

/**
 * Generate compact summary string from skills.
 */
function generateSummary(skills: SkillMetadata[]): string {
  return skills
    .map(s => `${s.name} (${s.description.slice(0, 60) || 'no description'})`)
    .join(', ');
}

/**
 * Deduplicate skills by name, keeping first occurrence.
 */
function deduplicateSkills(skills: SkillMetadata[]): SkillMetadata[] {
  const seen = new Set<string>();
  return skills.filter(s => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}

/**
 * Sort skills by domain relevance if domain is provided.
 */
function sortSkillsByDomain(skills: SkillMetadata[], domain: string): SkillMetadata[] {
  if (!domain) return skills;

  const lowerDomain = domain.toLowerCase();
  return [...skills].sort((a, b) => {
    const aMatch = a.category.toLowerCase().includes(lowerDomain) ? 0 : 1;
    const bMatch = b.category.toLowerCase().includes(lowerDomain) ? 0 : 1;
    return aMatch - bMatch;
  });
}

/**
 * Handle skill:discover command.
 * Scans for available skills in plugin and repo directories.
 */
export async function handleSkillDiscover(args: SkillCommandArgs): Promise<number> {
  const {
    pluginRoot,
    runId = '',
    cacheTtl = DEFAULT_CACHE_TTL,
    runsDir = '.a5c/runs',
    json,
  } = args;

  if (!pluginRoot) {
    const error = { error: 'MISSING_PLUGIN_ROOT', message: '--plugin-root is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --plugin-root is required');
    }
    return 1;
  }

  // Check cache first
  const cached = await readCache(runId, cacheTtl);
  if (cached) {
    if (json) {
      console.log(JSON.stringify({ skills: cached.skills, summary: cached.summary, cached: true }));
    } else {
      console.log(cached.summary);
    }
    return 0;
  }

  // Detect domain from run
  const domain = await detectRunDomain(runId, runsDir);

  // Scan skill directories
  const allSkills: SkillMetadata[] = [];

  // 1. Scan specializations directory
  const specializationsDir = path.join(pluginRoot, 'skills', 'babysit', 'process', 'specializations');
  const specializationSkills = await scanSkillsDirectory(specializationsDir, 'local');
  allSkills.push(...specializationSkills);

  // 2. Scan plugin-level skills
  const pluginSkillsDir = path.join(pluginRoot, 'skills');
  const pluginSkills = await scanSkillsDirectory(pluginSkillsDir, 'local-plugin');
  // Filter out specializations (already scanned)
  const filteredPluginSkills = pluginSkills.filter(s => !s.file?.includes('/specializations/'));
  allSkills.push(...filteredPluginSkills);

  // 3. Scan repo-level skills (.a5c/skills)
  const repoSkillsDir = '.a5c/skills';
  try {
    await fs.access(repoSkillsDir);
    const repoSkills = await scanSkillsDirectory(repoSkillsDir, 'local');
    allSkills.push(...repoSkills);
  } catch {
    // Repo skills dir doesn't exist, skip
  }

  // Deduplicate and sort
  let skills = deduplicateSkills(allSkills);
  skills = sortSkillsByDomain(skills, domain);

  // Limit to 30 for context window efficiency
  skills = skills.slice(0, 30);

  // Generate summary
  const summary = generateSummary(skills);

  // Cache results
  const cacheEntry: SkillCacheEntry = {
    skills,
    summary,
    timestamp: Date.now(),
  };
  await writeCache(runId, cacheEntry);

  if (json) {
    console.log(JSON.stringify({ skills, summary, cached: false }));
  } else {
    console.log(summary || '(no skills found)');
  }

  return 0;
}

/**
 * Convert GitHub web URL to API URL.
 */
function githubWebToApi(url: string): { apiUrl: string; rawBase: string } | null {
  // https://github.com/OWNER/REPO/tree/BRANCH/PATH
  const treeMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
  if (treeMatch) {
    const [, owner, repo, branch, path] = treeMatch;
    return {
      apiUrl: `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      rawBase: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
    };
  }

  // https://github.com/OWNER/REPO
  const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (repoMatch) {
    const [, owner, repo] = repoMatch;
    return {
      apiUrl: `https://api.github.com/repos/${owner}/${repo}/contents/skills?ref=main`,
      rawBase: `https://raw.githubusercontent.com/${owner}/${repo}/main/skills`,
    };
  }

  return null;
}

/**
 * Fetch URL with timeout.
 */
async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'babysitter-sdk',
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Discover skills from GitHub repository.
 */
async function discoverGitHub(url: string): Promise<SkillMetadata[]> {
  const parsed = githubWebToApi(url);
  if (!parsed) return [];

  const { apiUrl, rawBase } = parsed;
  const skills: SkillMetadata[] = [];

  // Fetch directory listing
  const listingText = await fetchWithTimeout(apiUrl);
  if (!listingText) return [];

  let listing;
  try {
    listing = JSON.parse(listingText) as Array<{ name: string; type: string; download_url?: string }>;
  } catch {
    return [];
  }

  // Find directories or SKILL.md files
  const dirs = listing.filter(e => e.type === 'dir').map(e => e.name);

  // Check for flat SKILL.md
  const skillFile = listing.find(e => e.name === 'SKILL.md');
  if (skillFile?.download_url) {
    const content = await fetchWithTimeout(skillFile.download_url);
    if (content) {
      const parsed = parseSkillFrontmatter(content);
      if (parsed) {
        skills.push({
          ...parsed,
          source: 'remote',
          url,
        });
      }
    }
    return skills;
  }

  // Fetch SKILL.md from each subdirectory (limit to 20)
  let count = 0;
  for (const dir of dirs) {
    if (count >= 20) break;
    count++;

    const skillUrl = `${rawBase}/${dir}/SKILL.md`;
    const content = await fetchWithTimeout(skillUrl);
    if (content) {
      const parsed = parseSkillFrontmatter(content);
      if (parsed) {
        skills.push({
          ...parsed,
          source: 'remote',
          url: skillUrl,
        });
      }
    }
  }

  return skills;
}

/**
 * Discover skills from well-known endpoint.
 */
async function discoverWellKnown(url: string): Promise<SkillMetadata[]> {
  const baseUrl = url.replace(/\/$/, '');
  const skills: SkillMetadata[] = [];

  // Try path-relative well-known
  let indexUrl = `${baseUrl}/.well-known/skills/index.json`;
  let content = await fetchWithTimeout(indexUrl);

  // Try root well-known
  if (!content) {
    const hostMatch = baseUrl.match(/^https?:\/\/([^/]+)/);
    if (hostMatch) {
      indexUrl = `https://${hostMatch[1]}/.well-known/skills/index.json`;
      content = await fetchWithTimeout(indexUrl);
    }
  }

  if (!content) return [];

  try {
    const index = JSON.parse(content) as { skills?: Array<{ name: string; description?: string }> };
    if (index.skills) {
      for (const s of index.skills) {
        skills.push({
          name: s.name,
          description: s.description || '',
          category: '',
          source: 'remote',
          url: baseUrl,
        });
      }
    }
  } catch {
    // Invalid JSON
  }

  return skills;
}

/**
 * Handle skill:fetch-remote command.
 * Fetches skills from external sources (GitHub or well-known).
 */
export async function handleSkillFetchRemote(args: SkillCommandArgs): Promise<number> {
  const { sourceType, url, json } = args;

  if (!sourceType) {
    const error = { error: 'MISSING_SOURCE_TYPE', message: '--source-type is required (github or well-known)' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --source-type is required (github or well-known)');
    }
    return 1;
  }

  if (!url) {
    const error = { error: 'MISSING_URL', message: '--url is required' };
    if (json) {
      console.error(JSON.stringify(error));
    } else {
      console.error('❌ Error: --url is required');
    }
    return 1;
  }

  let skills: SkillMetadata[] = [];

  switch (sourceType) {
    case 'github':
      skills = await discoverGitHub(url);
      break;
    case 'well-known':
      skills = await discoverWellKnown(url);
      break;
    default: {
      const error = { error: 'INVALID_SOURCE_TYPE', message: `Unknown source type: ${sourceType}` };
      if (json) {
        console.error(JSON.stringify(error));
      } else {
        console.error(`❌ Error: Unknown source type: ${sourceType}`);
      }
      return 1;
    }
  }

  if (json) {
    console.log(JSON.stringify({ skills }));
  } else {
    if (skills.length === 0) {
      console.log('[]');
    } else {
      for (const skill of skills) {
        console.log(`- ${skill.name}: ${skill.description || '(no description)'}`);
      }
    }
  }

  return 0;
}
