/**
 * Skill, agent, and process discovery CLI commands.
 * Replaces bash logic from skill-context-resolver.sh and skill-discovery.sh
 */

import { promises as fs, readFileSync, existsSync } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { resolveActiveProcessLibrary } from '../../processLibrary/active';

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
  includeRemote?: boolean;
  summaryOnly?: boolean;
  processPath?: string;
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
 * Discovered agent metadata.
 */
export interface AgentMetadata {
  name: string;
  description: string;
  role?: string;
  category: string;
  source: 'local' | 'local-plugin' | 'remote';
  file?: string;
}

/**
 * Discovered process metadata.
 */
export interface ProcessMetadata {
  name: string;
  category: string;
  source: 'library' | 'repo';
  file: string;
}

/**
 * Cache entry for discovery results.
 */
interface DiscoveryCacheEntry {
  skills: SkillMetadata[];
  agents: AgentMetadata[];
  summary: string;
  timestamp: number;
}

const DEFAULT_CACHE_TTL = 300; // 5 minutes
const CACHE_DIR = path.join(os.tmpdir(), 'babysitter-skill-cache');

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

/**
 * Parse scalar key:value pairs from YAML frontmatter.
 * Ignores array items (lines starting with "- ").
 */
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
      } else {
        break;
      }
    }

    if (inFrontmatter && trimmed && !trimmed.startsWith('- ')) {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        let value = trimmed.slice(colonIndex + 1).trim();
        // Remove surrounding quotes
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

/**
 * Parse YAML frontmatter from a SKILL.md file content.
 */
function parseSkillFrontmatter(content: string): { name: string; description: string; category: string } | null {
  const fields = parseFrontmatter(content);
  const name = fields.name;
  if (!name) return null;

  return {
    name,
    description: fields.description || '',
    category: fields.category || fields.domain || '',
  };
}

/**
 * Parse YAML frontmatter from an AGENT.md file content.
 */
function parseAgentFrontmatter(content: string): { name: string; description: string; role?: string; category: string } | null {
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

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

/**
 * Recursively find files matching a target name in a directory.
 */
async function findMarkdownFiles(dir: string, targetName: string, maxDepth: number = 5): Promise<string[]> {
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

/**
 * Recursively find all SKILL.md files in a directory.
 */
async function findSkillFiles(dir: string, maxDepth: number = 5): Promise<string[]> {
  return findMarkdownFiles(dir, 'SKILL.md', maxDepth);
}

/**
 * Recursively find all AGENT.md files in a directory.
 */
async function findAgentFiles(dir: string, maxDepth: number = 5): Promise<string[]> {
  return findMarkdownFiles(dir, 'AGENT.md', maxDepth);
}

/**
 * Find *.js process files in a directory (non-recursive, depth 1 only).
 */
async function findProcessFiles(dir: string): Promise<string[]> {
  try {
    const resolvedDir = path.resolve(dir);
    const entries = await fs.readdir(resolvedDir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && e.name.endsWith('.js'))
      .map(e => path.join(resolvedDir, e.name));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Directory scanning
// ---------------------------------------------------------------------------

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

/**
 * Read and parse agents from a directory.
 */
async function scanAgentsDirectory(
  dir: string,
  source: 'local' | 'local-plugin',
  maxFiles: number = 50
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

/**
 * Read process file names from a directory and return ProcessMetadata.
 */
async function scanProcessesDirectory(
  dir: string,
  category: string,
  source: 'library' | 'repo',
): Promise<ProcessMetadata[]> {
  const jsFiles = await findProcessFiles(dir);
  return jsFiles.map(file => ({
    name: path.basename(file, '.js'),
    category,
    source,
    file,
  }));
}

// ---------------------------------------------------------------------------
// Specialization scoping
// ---------------------------------------------------------------------------

/**
 * Given a process path like "specializations/web-development/api-integration-testing.js"
 * or a full path containing "specializations/<name>/", extract the specialization name.
 */
function extractSpecializationFromProcessPath(processPath: string): string | null {
  const normalized = processPath.replace(/\\/g, '/');
  const match = normalized.match(/specializations\/([^/]+)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/**
 * Get cache file path for a run ID.
 */
function getCachePath(runId: string, suffix: 'json' | 'summary'): string {
  const safeId = runId || 'default';
  return path.join(CACHE_DIR, `${safeId}.${suffix}`);
}

/**
 * Read cached discovery results if valid.
 * Returns null on cache miss or if the entry is missing the agents field (legacy format).
 */
async function readCache(runId: string, ttl: number): Promise<DiscoveryCacheEntry | null> {
  const cachePath = getCachePath(runId, 'json');
  try {
    const content = await fs.readFile(cachePath, 'utf8');
    const entry = JSON.parse(content) as DiscoveryCacheEntry;
    // Require agents field to be present (invalidates old skills-only cache)
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

/**
 * Write cache entry.
 */
async function writeCache(runId: string, entry: DiscoveryCacheEntry): Promise<void> {
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

// ---------------------------------------------------------------------------
// Domain detection and sorting
// ---------------------------------------------------------------------------

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
 * Generate compact summary string from skills and agents.
 */
function generateSummary(skills: SkillMetadata[], agents: AgentMetadata[]): string {
  const parts: string[] = [];
  if (skills.length > 0) {
    const skillPart = skills
      .map(s => `${s.name} (${s.description.slice(0, 60) || 'no description'})`)
      .join(', ');
    parts.push(skillPart);
  }
  if (agents.length > 0) {
    const agentPart = agents
      .map(a => `${a.name} (${a.description.slice(0, 60) || 'no description'})`)
      .join(', ');
    parts.push(agentPart);
  }
  return parts.join(', ');
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
 * Deduplicate agents by name, keeping first occurrence.
 */
function deduplicateAgents(agents: AgentMetadata[]): AgentMetadata[] {
  const seen = new Set<string>();
  return agents.filter(a => {
    if (seen.has(a.name)) return false;
    seen.add(a.name);
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
 * Sort agents by domain relevance if domain is provided.
 */
function sortAgentsByDomain(agents: AgentMetadata[], domain: string): AgentMetadata[] {
  if (!domain) return agents;

  const lowerDomain = domain.toLowerCase();
  return [...agents].sort((a, b) => {
    const aMatch = a.category.toLowerCase().includes(lowerDomain) ? 0 : 1;
    const bMatch = b.category.toLowerCase().includes(lowerDomain) ? 0 : 1;
    return aMatch - bMatch;
  });
}

/**
 * Cap the number of items per specialization to ensure diversity in unscoped results.
 * Extracts the specialization name from each item's file path (the directory name
 * under specializations/) and keeps at most `cap` items per specialization.
 * Items not under a specializations/ directory are always kept.
 */
function capPerSpecialization<T extends { file?: string }>(items: T[], cap: number): T[] {
  const counts = new Map<string, number>();
  return items.filter(item => {
    if (!item.file) return true;
    const normalized = item.file.replace(/\\/g, '/');
    const match = normalized.match(/\/specializations\/([^/]+)\//);
    if (!match) return true;
    const spec = match[1].toLowerCase();
    const count = counts.get(spec) ?? 0;
    if (count >= cap) return false;
    counts.set(spec, count + 1);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Process-file marker parsing (@skill / @agent JSDoc markers)
// ---------------------------------------------------------------------------

/**
 * A single @skill or @agent marker parsed from a process file JSDoc header.
 */
export interface ProcessMarker {
  type: 'skill' | 'agent';
  name: string;
  relativePath?: string;
}

/**
 * Result of parsing all @skill/@agent markers from a process file.
 */
export interface ProcessMarkersResult {
  skills: ProcessMarker[];
  agents: ProcessMarker[];
  hasMarkers: boolean;
}

/**
 * Result of resolving process markers to full metadata.
 */
export interface ProcessDiscoveryResult {
  skills: Array<{ name: string; file?: string }>;
  agents: Array<{ name: string; file?: string }>;
}

/**
 * Parse @skill and @agent markers from a process file's JSDoc header.
 *
 * Expected format in the JSDoc block:
 *   @skill <name> <relative-path-to-SKILL.md>
 *   @agent <name> <relative-path-to-AGENT.md>
 *
 * Paths are relative to the active process-library root.
 */
export function parseProcessFileMarkers(filePath: string): ProcessMarkersResult {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return { skills: [], agents: [], hasMarkers: false };
  }

  // Extract first JSDoc block
  const jsdocMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (!jsdocMatch) {
    return { skills: [], agents: [], hasMarkers: false };
  }

  const jsdocBody = jsdocMatch[1];
  const markerRegex = /^\s*\*\s*@(skill|agent)\s+(\S+)(?:[ \t]+(\S+))?/gm;

  const skills: ProcessMarker[] = [];
  const agents: ProcessMarker[] = [];
  const seenSkills = new Set<string>();
  const seenAgents = new Set<string>();

  let match;
  while ((match = markerRegex.exec(jsdocBody)) !== null) {
    const type = match[1] as 'skill' | 'agent';
    const name = match[2];
    const relativePath = match[3] || undefined;

    if (type === 'skill') {
      if (!seenSkills.has(name)) {
        seenSkills.add(name);
        skills.push({ type, name, relativePath });
      }
    } else {
      if (!seenAgents.has(name)) {
        seenAgents.add(name);
        agents.push({ type, name, relativePath });
      }
    }
  }

  return {
    skills,
    agents,
    hasMarkers: skills.length > 0 || agents.length > 0,
  };
}

/**
 * Resolve parsed markers to full file paths using the active process-library
 * root when known, or the legacy plugin-local process root as a compatibility
 * fallback.
 */
function resolveMarkersToMetadata(
  markers: ProcessMarkersResult,
  options: {
    pluginRoot?: string;
    processRoot?: string;
  },
): ProcessDiscoveryResult {
  const processRoot = resolveStaticProcessRoot(options);

  const resolveMarker = (marker: ProcessMarker): { name: string; file?: string } => {
    if (!marker.relativePath) {
      return { name: marker.name };
    }
    const resolved = path.resolve(processRoot, marker.relativePath);
    return { name: marker.name, file: resolved };
  };

  return {
    skills: markers.skills.map(resolveMarker),
    agents: markers.agents.map(resolveMarker),
  };
}

/**
 * Discover skills and agents from @skill/@agent markers in a process file.
 *
 * Returns null if no markers are found (caller should fall back to generic scan).
 */
export function discoverFromProcessFile(options: {
  processFilePath: string;
  pluginRoot?: string;
  processRoot?: string;
}): ProcessDiscoveryResult | null {
  const markers = parseProcessFileMarkers(options.processFilePath);
  if (!markers.hasMarkers) {
    return null;
  }
  return resolveMarkersToMetadata(markers, {
    pluginRoot: options.pluginRoot,
    processRoot: options.processRoot,
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

function resolveStaticProcessRoot(options: {
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

async function resolveDiscoveryProcessRoot(options: {
  pluginRoot: string;
  runId?: string;
}): Promise<string> {
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

// ---------------------------------------------------------------------------
// Main discovery
// ---------------------------------------------------------------------------

/**
 * Result from internal discovery.
 */
export interface DiscoverSkillsResult {
  skills: SkillMetadata[];
  agents: AgentMetadata[];
  processes?: ProcessMetadata[];
  summary: string;
  cached: boolean;
}

/**
 * Internal discovery logic, extracted for reuse by other CLI commands
 * (e.g. session:iteration-message, hookRun stop handler).
 *
 * Returns a structured result instead of writing to stdout.
 */
export async function discoverSkillsInternal(options: {
  pluginRoot: string;
  runId?: string;
  cacheTtl?: number;
  runsDir?: string;
  includeRemote?: boolean;
  processPath?: string;
  includeProcesses?: boolean;
}): Promise<DiscoverSkillsResult> {
  const {
    pluginRoot,
    runId = '',
    cacheTtl = DEFAULT_CACHE_TTL,
    runsDir = '.a5c/runs',
    includeRemote = false,
    processPath,
    includeProcesses = false,
  } = options;

  // Bypass cache when processPath is set (specialization-scoped queries)
  if (!processPath) {
    const cached = await readCache(runId, cacheTtl);
    if (cached) {
      return { skills: cached.skills, agents: cached.agents, summary: cached.summary, cached: true };
    }
  }

  // Determine domain for sorting — from processPath or run metadata
  let domain = '';
  if (processPath) {
    domain = extractSpecializationFromProcessPath(processPath) ?? '';
  }
  if (!domain) {
    domain = await detectRunDomain(runId, runsDir);
  }

  const processRoot = await resolveDiscoveryProcessRoot({
    pluginRoot,
    runId,
  });
  const specializationsDir = path.join(processRoot, 'specializations');

  // ------------------------------------------------------------------
  // Skills
  // ------------------------------------------------------------------
  const allSkills: SkillMetadata[] = [];

  // 1. Scan specializations directory
  const specializationSkills = await scanSkillsDirectory(specializationsDir, 'local');
  allSkills.push(...specializationSkills);

  // 2. Scan plugin-level skills
  const pluginSkillsDir = path.join(pluginRoot, 'skills');
  const pluginSkills = await scanSkillsDirectory(pluginSkillsDir, 'local-plugin');
  const filteredPluginSkills = pluginSkills.filter(s =>
    !(s.file?.replace(/\\/g, '/').includes('/specializations/'))
  );
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

  // 4. Optionally fetch remote skills
  if (includeRemote) {
    const remoteSkills = await fetchRemoteSkillSources(pluginRoot);
    allSkills.push(...remoteSkills);
  }

  // ------------------------------------------------------------------
  // Agents
  // ------------------------------------------------------------------
  const allAgents: AgentMetadata[] = [];

  // 1. Scan specializations directory for agents
  const specializationAgents = await scanAgentsDirectory(specializationsDir, 'local');
  allAgents.push(...specializationAgents);

  // 2. Scan repo-level agents (.a5c/agents)
  const repoAgentsDir = '.a5c/agents';
  try {
    await fs.access(repoAgentsDir);
    const repoAgents = await scanAgentsDirectory(repoAgentsDir, 'local');
    allAgents.push(...repoAgents);
  } catch {
    // Repo agents dir doesn't exist, skip
  }

  // ------------------------------------------------------------------
  // Processes (only when explicitly requested — not for hooks/session)
  // ------------------------------------------------------------------
  let processes: ProcessMetadata[] | undefined;
  if (includeProcesses) {
    const allProcesses: ProcessMetadata[] = [];

    // 1. Specialization processes
    try {
      const specDirs = await fs.readdir(specializationsDir, { withFileTypes: true });
      for (const entry of specDirs) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const specDir = path.join(specializationsDir, entry.name);
          const procs = await scanProcessesDirectory(specDir, entry.name, 'library');
          allProcesses.push(...procs);
        }
      }
    } catch {
      // Specializations dir may not exist
    }

    // 2. Methodology processes
    const methodologiesDir = path.join(processRoot, 'methodologies');
    try {
      // Top-level methodology files
      const topProcs = await scanProcessesDirectory(methodologiesDir, 'methodologies', 'library');
      allProcesses.push(...topProcs);

      // Methodology subdirectories
      const methodDirs = await fs.readdir(methodologiesDir, { withFileTypes: true });
      for (const entry of methodDirs) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const methodDir = path.join(methodologiesDir, entry.name);
          const procs = await scanProcessesDirectory(methodDir, entry.name, 'library');
          allProcesses.push(...procs);
        }
      }
    } catch {
      // Methodologies dir may not exist
    }

    // 3. Repo-level processes (.a5c/processes)
    const repoProcessesDir = '.a5c/processes';
    try {
      await fs.access(repoProcessesDir);
      const repoProcs = await scanProcessesDirectory(repoProcessesDir, 'project', 'repo');
      allProcesses.push(...repoProcs);
    } catch {
      // Repo processes dir doesn't exist
    }

    processes = allProcesses;
  }

  // ------------------------------------------------------------------
  // Specialization scoping
  // ------------------------------------------------------------------
  let skills = deduplicateSkills(allSkills);
  let agents = deduplicateAgents(allAgents);

  const isSpecFile = (filePath?: string) => {
    if (!filePath) return false;
    return filePath.replace(/\\/g, '/').includes('/specializations/');
  };

  if (processPath && domain) {
    // Filter to matching specialization only
    const lowerDomain = domain.toLowerCase();
    const matchesSpec = (filePath?: string) => {
      if (!filePath) return false;
      const normalized = filePath.replace(/\\/g, '/').toLowerCase();
      return normalized.includes(`/specializations/${lowerDomain}/`);
    };

    skills = skills.filter(s => matchesSpec(s.file));
    agents = agents.filter(a => matchesSpec(a.file));

    if (processes) {
      processes = processes.filter(p =>
        p.category.toLowerCase() === lowerDomain
      );
    }
  } else if (processPath && !domain) {
    // Process path provided but not in a specialization directory —
    // exclude specialization skills entirely (they're irrelevant).
    // Only keep plugin-level and repo-level skills/agents.
    skills = skills.filter(s => !isSpecFile(s.file));
    agents = agents.filter(a => !isSpecFile(a.file));
  } else {
    // No processPath at all (fully unscoped) — sort by domain relevance
    // and cap per-specialization to ensure diversity
    skills = sortSkillsByDomain(skills, domain);
    agents = sortAgentsByDomain(agents, domain);

    const PER_SPEC_CAP = 5;
    skills = capPerSpecialization(skills, PER_SPEC_CAP);
    agents = capPerSpecialization(agents, PER_SPEC_CAP);
  }

  // Limit for context window efficiency
  skills = skills.slice(0, 30);
  agents = agents.slice(0, 30);

  // Generate summary
  const summary = generateSummary(skills, agents);

  // Cache results (only for non-scoped queries)
  if (!processPath) {
    const cacheEntry: DiscoveryCacheEntry = {
      skills,
      agents,
      summary,
      timestamp: Date.now(),
    };
    await writeCache(runId, cacheEntry);
  }

  return { skills, agents, processes, summary, cached: false };
}

// ---------------------------------------------------------------------------
// Remote sources
// ---------------------------------------------------------------------------

/**
 * Fetch skills from remote sources defined in .a5c/skill-sources.json
 * and a default GitHub source.
 */
async function fetchRemoteSkillSources(_pluginRoot: string): Promise<SkillMetadata[]> {
  const remoteSkills: SkillMetadata[] = [];

  interface SkillSource {
    type: 'github' | 'well-known';
    url: string;
  }
  const sources: SkillSource[] = [
    { type: 'github', url: 'https://github.com/MaTriXy/babysitter/tree/main/plugins/babysitter/skills' },
  ];

  // Check for additional sources in .a5c/skill-sources.json
  try {
    const content = await fs.readFile('.a5c/skill-sources.json', 'utf8');
    const parsed = JSON.parse(content) as { sources?: Array<{ type: string; url: string }> };
    if (parsed.sources && Array.isArray(parsed.sources)) {
      for (const s of parsed.sources) {
        if ((s.type === 'github' || s.type === 'well-known') && typeof s.url === 'string') {
          sources.push({ type: s.type, url: s.url });
        }
      }
    }
  } catch {
    // No external sources file, that's fine
  }

  for (const source of sources) {
    try {
      let skills: SkillMetadata[] = [];
      if (source.type === 'github') {
        skills = await discoverGitHub(source.url);
      } else if (source.type === 'well-known') {
        skills = await discoverWellKnown(source.url);
      }
      remoteSkills.push(...skills);
    } catch {
      // Skip failed remote sources
    }
  }

  return remoteSkills;
}

// ---------------------------------------------------------------------------
// CLI command handlers
// ---------------------------------------------------------------------------

/**
 * Handle skill:discover command.
 * Scans for available skills, agents, and processes in plugin and repo directories.
 * Thin wrapper around discoverSkillsInternal that handles CLI I/O.
 */
export async function handleSkillDiscover(args: SkillCommandArgs): Promise<number> {
  const {
    pluginRoot,
    runId,
    cacheTtl,
    runsDir,
    json,
    includeRemote,
    summaryOnly,
    processPath,
  } = args;

  if (!pluginRoot) {
    const error = { error: 'MISSING_PLUGIN_ROOT', message: '--plugin-root is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('Error: --plugin-root is required');
    }
    return 1;
  }

  const result = await discoverSkillsInternal({
    pluginRoot,
    runId,
    cacheTtl,
    runsDir,
    includeRemote,
    processPath,
    includeProcesses: true,
  });

  if (summaryOnly) {
    console.log(result.summary || '');
    return 0;
  }

  if (json) {
    console.log(JSON.stringify({
      skills: result.skills,
      agents: result.agents,
      processes: result.processes,
      summary: result.summary,
      cached: result.cached,
    }, null, 2));
  } else {
    if (result.skills.length === 0 && result.agents.length === 0) {
      console.log('(no skills or agents found)');
    } else {
      if (result.skills.length > 0) {
        console.log(`Skills (${result.skills.length}):`);
        for (const skill of result.skills) {
          console.log(`  - ${skill.name}: ${skill.description || '(no description)'}${skill.file ? ` [${skill.file}]` : ''}`);
        }
      }
      if (result.agents.length > 0) {
        console.log(`Agents (${result.agents.length}):`);
        for (const agent of result.agents) {
          console.log(`  - ${agent.name}: ${agent.description || '(no description)'}${agent.file ? ` [${agent.file}]` : ''}`);
        }
      }
      if (result.processes && result.processes.length > 0) {
        console.log(`Processes (${result.processes.length}):`);
        for (const proc of result.processes) {
          console.log(`  - ${proc.name} [${proc.category}]: ${proc.file}`);
        }
      }
    }
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Remote discovery helpers
// ---------------------------------------------------------------------------

/**
 * Convert GitHub web URL to API URL.
 */
function githubWebToApi(url: string): { apiUrl: string; rawBase: string } | null {
  // https://github.com/OWNER/REPO/tree/BRANCH/PATH
  const treeMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
  if (treeMatch) {
    const [, owner, repo, branch, treePath] = treeMatch;
    return {
      apiUrl: `https://api.github.com/repos/${owner}/${repo}/contents/${treePath}?ref=${branch}`,
      rawBase: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${treePath}`,
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

  const listingText = await fetchWithTimeout(apiUrl);
  if (!listingText) return [];

  let listing;
  try {
    listing = JSON.parse(listingText) as Array<{ name: string; type: string; download_url?: string }>;
  } catch {
    return [];
  }

  const dirs = listing.filter(e => e.type === 'dir').map(e => e.name);

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

  let indexUrl = `${baseUrl}/.well-known/skills/index.json`;
  let content = await fetchWithTimeout(indexUrl);

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
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('Error: --source-type is required (github or well-known)');
    }
    return 1;
  }

  if (!url) {
    const error = { error: 'MISSING_URL', message: '--url is required' };
    if (json) {
      console.error(JSON.stringify(error, null, 2));
    } else {
      console.error('Error: --url is required');
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
      const _exhaustive: never = sourceType;
      const unknownType = _exhaustive as string;
      const error = { error: 'INVALID_SOURCE_TYPE', message: `Unknown source type: ${unknownType}` };
      if (json) {
        console.error(JSON.stringify(error, null, 2));
      } else {
        console.error(`Error: Unknown source type: ${unknownType}`);
      }
      return 1;
    }
  }

  if (json) {
    console.log(JSON.stringify({ skills }, null, 2));
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
