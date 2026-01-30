/**
 * Directory structure parser for domains/specializations hierarchy
 * Scans directory structure and identifies agents, skills, and processes
 */

import type {
  ParseResult,
  DirectoryScanResult,
  DomainInfo,
  SpecializationInfo,
  ParserOptions,
} from './types';

// =============================================================================
// DIRECTORY PARSER
// =============================================================================

/**
 * File system interface for dependency injection
 */
export interface FileSystem {
  readdir(path: string): Promise<string[]>;
  stat(path: string): Promise<{ isDirectory(): boolean }>;
  exists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
}

/**
 * Directory parser options
 */
export interface DirectoryParserOptions extends ParserOptions {
  /** Maximum depth for directory scanning */
  maxDepth?: number;
  /** File patterns to look for */
  patterns?: {
    agent?: string;
    skill?: string;
    process?: string;
    readme?: string;
    references?: string;
  };
}

const DEFAULT_PATTERNS = {
  agent: 'AGENT.md',
  skill: 'SKILL.md',
  process: '.js',
  readme: 'README.md',
  references: 'references.md',
};

/**
 * Parse directory structure for process library catalog
 *
 * @param baseDir - Base directory to scan
 * @param fs - File system interface
 * @param options - Parser options
 * @returns Directory scan result
 */
export async function parseDirectoryStructure(
  baseDir: string,
  fs: FileSystem,
  options: DirectoryParserOptions = {}
): Promise<ParseResult<DirectoryScanResult>> {
  try {
    const patterns = { ...DEFAULT_PATTERNS, ...options.patterns };
    const maxDepth = options.maxDepth ?? 10;

    const result: DirectoryScanResult = {
      domains: [],
      specializations: [],
      methodologies: [],
      totalAgents: 0,
      totalSkills: 0,
      totalProcesses: 0,
    };

    // Scan domains directory
    const domainsPath = normalizePath(`${baseDir}/specializations/domains`);
    if (await fs.exists(domainsPath)) {
      result.domains = await scanDomains(domainsPath, fs, patterns, maxDepth);
    }

    // Scan top-level specializations
    const specializationsPath = normalizePath(`${baseDir}/specializations`);
    if (await fs.exists(specializationsPath)) {
      result.specializations = await scanTopLevelSpecializations(
        specializationsPath,
        fs,
        patterns,
        maxDepth
      );
    }

    // Scan methodologies
    const methodologiesPath = normalizePath(`${baseDir}/methodologies`);
    if (await fs.exists(methodologiesPath)) {
      result.methodologies = await scanMethodologies(methodologiesPath, fs, patterns);
    }

    // Calculate totals
    result.totalAgents = countAgents(result);
    result.totalSkills = countSkills(result);
    result.totalProcesses = result.methodologies.length;

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error scanning directory';
    return {
      success: false,
      error: {
        code: 'DIRECTORY_SCAN_ERROR',
        message: errorMessage,
        file: baseDir,
      },
    };
  }
}

/**
 * Scan domains directory structure
 *
 * Creates ONE DomainInfo per category (first level under domains/).
 * Specializations are subdirectories under the domain category.
 */
async function scanDomains(
  domainsPath: string,
  fs: FileSystem,
  patterns: typeof DEFAULT_PATTERNS,
  maxDepth: number
): Promise<DomainInfo[]> {
  const domains: DomainInfo[] = [];

  const topLevelDirs = await fs.readdir(domainsPath);

  for (const topDir of topLevelDirs) {
    const topDirPath = normalizePath(`${domainsPath}/${topDir}`);
    const stat = await fs.stat(topDirPath);

    if (!stat.isDirectory()) continue;

    // Each top-level directory under domains/ is a DOMAIN (e.g., "business", "science")
    // Its subdirectories (except agents/skills) are SPECIALIZATIONS
    const domain = await scanDomain(
      topDirPath,
      topDir,
      topDir, // category is the same as the domain name for top-level domains
      fs,
      patterns,
      maxDepth - 1
    );
    if (domain) {
      domains.push(domain);
    }
  }

  return domains;
}

/**
 * Scan a single domain
 */
async function scanDomain(
  domainPath: string,
  name: string,
  category: string | undefined,
  fs: FileSystem,
  patterns: typeof DEFAULT_PATTERNS,
  depth: number
): Promise<DomainInfo | null> {
  if (depth <= 0) return null;

  const domain: DomainInfo = {
    name,
    path: domainPath,
    category,
    specializations: [],
    agents: [],
    skills: [],
  };

  const entries = await fs.readdir(domainPath);

  // Scan for README and references
  if (entries.includes(patterns.readme)) {
    domain.readme = normalizePath(`${domainPath}/${patterns.readme}`);
  }
  if (entries.includes(patterns.references)) {
    domain.references = normalizePath(`${domainPath}/${patterns.references}`);
  }

  // Scan agents directory
  if (entries.includes('agents')) {
    domain.agents = await scanAgentsDirectory(
      normalizePath(`${domainPath}/agents`),
      fs,
      patterns
    );
  }

  // Scan skills directory
  if (entries.includes('skills')) {
    domain.skills = await scanSkillsDirectory(
      normalizePath(`${domainPath}/skills`),
      fs,
      patterns
    );
  }

  // Scan for nested specializations (subdirectories that aren't agents/skills)
  for (const entry of entries) {
    if (['agents', 'skills', patterns.readme, patterns.references].includes(entry)) {
      continue;
    }
    if (entry.startsWith('.')) continue;

    const entryPath = normalizePath(`${domainPath}/${entry}`);
    try {
      const stat = await fs.stat(entryPath);
      if (stat.isDirectory()) {
        const spec = await scanSpecialization(entryPath, entry, name, fs, patterns, depth - 1);
        if (spec) {
          domain.specializations.push(spec);
        }
      }
    } catch {
      continue;
    }
  }

  return domain;
}

/**
 * Scan top-level specializations (not under domains)
 */
async function scanTopLevelSpecializations(
  specializationsPath: string,
  fs: FileSystem,
  patterns: typeof DEFAULT_PATTERNS,
  maxDepth: number
): Promise<SpecializationInfo[]> {
  const specializations: SpecializationInfo[] = [];
  const entries = await fs.readdir(specializationsPath);

  for (const entry of entries) {
    // Skip domains directory
    if (entry === 'domains') continue;
    if (entry.startsWith('.')) continue;

    const entryPath = normalizePath(`${specializationsPath}/${entry}`);
    try {
      const stat = await fs.stat(entryPath);
      if (!stat.isDirectory()) continue;

      const spec = await scanSpecialization(
        entryPath,
        entry,
        undefined,
        fs,
        patterns,
        maxDepth
      );
      if (spec) {
        specializations.push(spec);
      }
    } catch {
      continue;
    }
  }

  return specializations;
}

/**
 * Scan a specialization directory
 */
async function scanSpecialization(
  specPath: string,
  name: string,
  domain: string | undefined,
  fs: FileSystem,
  patterns: typeof DEFAULT_PATTERNS,
  depth: number
): Promise<SpecializationInfo | null> {
  if (depth <= 0) return null;

  const spec: SpecializationInfo = {
    name,
    path: specPath,
    domain,
    agents: [],
    skills: [],
  };

  const entries = await fs.readdir(specPath);

  // Scan for README and references
  if (entries.includes(patterns.readme)) {
    spec.readme = normalizePath(`${specPath}/${patterns.readme}`);
  }
  if (entries.includes(patterns.references)) {
    spec.references = normalizePath(`${specPath}/${patterns.references}`);
  }

  // Scan agents directory
  if (entries.includes('agents')) {
    spec.agents = await scanAgentsDirectory(
      normalizePath(`${specPath}/agents`),
      fs,
      patterns
    );
  }

  // Scan skills directory
  if (entries.includes('skills')) {
    spec.skills = await scanSkillsDirectory(
      normalizePath(`${specPath}/skills`),
      fs,
      patterns
    );
  }

  // Scan for process files
  for (const entry of entries) {
    if (entry.endsWith(patterns.process) && !entry.startsWith('.')) {
      if (!spec.processes) spec.processes = [];
      spec.processes.push(normalizePath(`${specPath}/${entry}`));
    }
  }

  return spec;
}

/**
 * Scan agents directory for AGENT.md files
 */
async function scanAgentsDirectory(
  agentsPath: string,
  fs: FileSystem,
  patterns: typeof DEFAULT_PATTERNS
): Promise<string[]> {
  const agents: string[] = [];

  try {
    const entries = await fs.readdir(agentsPath);

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const entryPath = normalizePath(`${agentsPath}/${entry}`);
      const stat = await fs.stat(entryPath);

      if (stat.isDirectory()) {
        // Look for AGENT.md inside the directory
        const agentFile = normalizePath(`${entryPath}/${patterns.agent}`);
        if (await fs.exists(agentFile)) {
          agents.push(agentFile);
        }
      }
    }
  } catch {
    // Directory might not exist or not be readable
  }

  return agents;
}

/**
 * Scan skills directory for SKILL.md files
 */
async function scanSkillsDirectory(
  skillsPath: string,
  fs: FileSystem,
  patterns: typeof DEFAULT_PATTERNS
): Promise<string[]> {
  const skills: string[] = [];

  try {
    const entries = await fs.readdir(skillsPath);

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const entryPath = normalizePath(`${skillsPath}/${entry}`);
      const stat = await fs.stat(entryPath);

      if (stat.isDirectory()) {
        // Look for SKILL.md inside the directory
        const skillFile = normalizePath(`${entryPath}/${patterns.skill}`);
        if (await fs.exists(skillFile)) {
          skills.push(skillFile);
        }
      }
    }
  } catch {
    // Directory might not exist or not be readable
  }

  return skills;
}

/**
 * Scan methodologies directory for process files
 */
async function scanMethodologies(
  methodologiesPath: string,
  fs: FileSystem,
  patterns: typeof DEFAULT_PATTERNS
): Promise<string[]> {
  const processes: string[] = [];

  async function scanDir(dirPath: string, depth: number): Promise<void> {
    if (depth <= 0) return;

    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const entryPath = normalizePath(`${dirPath}/${entry}`);
      const stat = await fs.stat(entryPath);

      if (stat.isDirectory()) {
        await scanDir(entryPath, depth - 1);
      } else if (entry.endsWith(patterns.process)) {
        processes.push(entryPath);
      }
    }
  }

  try {
    await scanDir(methodologiesPath, 5);
  } catch {
    // Directory might not exist
  }

  return processes;
}

/**
 * Count total agents from scan result
 */
function countAgents(result: DirectoryScanResult): number {
  let count = 0;

  for (const domain of result.domains) {
    count += domain.agents.length;
    for (const spec of domain.specializations) {
      count += spec.agents.length;
    }
  }

  for (const spec of result.specializations) {
    count += spec.agents.length;
  }

  return count;
}

/**
 * Count total skills from scan result
 */
function countSkills(result: DirectoryScanResult): number {
  let count = 0;

  for (const domain of result.domains) {
    count += domain.skills.length;
    for (const spec of domain.specializations) {
      count += spec.skills.length;
    }
  }

  for (const spec of result.specializations) {
    count += spec.skills.length;
  }

  return count;
}

/**
 * Normalize path separators
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Get relative path from base directory
 */
export function getRelativePath(filePath: string, baseDir: string): string {
  const normalizedFile = normalizePath(filePath);
  const normalizedBase = normalizePath(baseDir);

  if (normalizedFile.startsWith(normalizedBase)) {
    return normalizedFile.slice(normalizedBase.length).replace(/^\//, '');
  }

  return normalizedFile;
}

/**
 * Extract domain name from file path
 * Returns the first level under domains/ (the category like "business", "science")
 */
export function extractDomainFromPath(filePath: string): string | undefined {
  const normalized = normalizePath(filePath);
  const domainsMatch = normalized.match(/\/domains\/([^/]+)/);

  if (domainsMatch) {
    // Return the domain category (first level under domains/)
    return domainsMatch[1];
  }

  return undefined;
}

/**
 * Extract specialization name from file path
 * Returns the second level under domains/{category}/ (the specialty like "venture-capital")
 */
export function extractSpecializationFromPath(filePath: string): string | undefined {
  const normalized = normalizePath(filePath);

  // Check for domain-based specializations (third level: domains/{category}/{specialty})
  const domainsMatch = normalized.match(/\/domains\/[^/]+\/([^/]+)/);
  if (domainsMatch) {
    // Only return if the match is not 'agents' or 'skills' (which are direct domain contents)
    const potentialSpec = domainsMatch[1];
    if (potentialSpec !== 'agents' && potentialSpec !== 'skills') {
      return potentialSpec;
    }
  }

  // Check for top-level specializations
  const specMatch = normalized.match(/\/specializations\/([^/]+)/);
  if (specMatch && specMatch[1] !== 'domains') {
    return specMatch[1];
  }

  return undefined;
}

/**
 * Extract agent/skill name from file path
 */
export function extractNameFromPath(filePath: string): string {
  const normalized = normalizePath(filePath);
  const parts = normalized.split('/');

  // Find the parent directory of AGENT.md or SKILL.md
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] === 'AGENT.md' || parts[i] === 'SKILL.md') {
      return parts[i - 1] || '';
    }
  }

  // For process files, return the filename without extension
  const fileName = parts[parts.length - 1] ?? '';
  return fileName.replace(/\.js$/, '');
}
