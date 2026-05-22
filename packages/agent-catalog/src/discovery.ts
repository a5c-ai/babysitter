import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

export interface CatalogDiscoveryProcessIo {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

export interface CatalogDiscoveryProcessTask {
  id: string;
  type: string;
  description?: string;
}

export interface CatalogDiscoveryProcess {
  id: number;
  processId: string;
  description: string;
  category: string | null;
  filePath: string;
  createdAt: string;
  updatedAt: string;
  inputs: CatalogDiscoveryProcessIo[];
  outputs: CatalogDiscoveryProcessIo[];
  tasks: CatalogDiscoveryProcessTask[];
  frontmatter: Record<string, unknown>;
}

export interface CatalogDiscoverySkill {
  id: number;
  slug: string;
  name: string;
  description: string;
  filePath: string;
  directory: string;
  specializationName: string | null;
  domainName: string | null;
  allowedTools: string[];
  createdAt: string;
  updatedAt: string;
  content: string;
  frontmatter: Record<string, unknown>;
}

export interface CatalogDiscoveryAgent {
  id: number;
  name: string;
  description: string;
  filePath: string;
  directory: string;
  role: string | null;
  expertise: string[];
  specializationName: string | null;
  domainName: string | null;
  createdAt: string;
  updatedAt: string;
  content: string;
  frontmatter: Record<string, unknown>;
}

export interface CatalogDiscoverySkillSummary {
  id: number;
  slug: string;
  name: string;
  description: string;
}

export interface CatalogDiscoveryAgentSummary {
  id: number;
  name: string;
  description: string;
  role: string | null;
}

export interface CatalogDiscoverySpecializationSummary {
  id: number;
  name: string;
  path: string;
  agentCount: number;
  skillCount: number;
}

export interface CatalogDiscoverySpecialization {
  id: number;
  name: string;
  path: string;
  domainName: string | null;
  agentCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
  readmePath: string | null;
  referencesPath: string | null;
  agents: CatalogDiscoveryAgentSummary[];
  skills: CatalogDiscoverySkillSummary[];
}

export interface CatalogDiscoveryDomain {
  id: number;
  name: string;
  path: string;
  category: string | null;
  specializationCount: number;
  agentCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
  readmePath: string | null;
  referencesPath: string | null;
  specializations: CatalogDiscoverySpecializationSummary[];
}

export interface CatalogDiscoveryCounts {
  domains: number;
  specializations: number;
  agents: number;
  skills: number;
  processes: number;
}

export interface CatalogDiscoverySnapshot {
  generatedAt: string;
  databaseSize: number;
  counts: CatalogDiscoveryCounts;
  processes: CatalogDiscoveryProcess[];
  skills: CatalogDiscoverySkill[];
  agents: CatalogDiscoveryAgent[];
  domains: CatalogDiscoveryDomain[];
  specializations: CatalogDiscoverySpecialization[];
}

export type CatalogDiscoverySearchType =
  | "agent"
  | "skill"
  | "process"
  | "domain"
  | "specialization";

export interface CatalogDiscoverySearchResult {
  type: CatalogDiscoverySearchType;
  id: number;
  name: string;
  description: string;
  path: string;
  slug?: string;
  score: number;
  updatedAt: string;
}

const PROCESS_EXTENSIONS = new Set([".js", ".mjs", ".ts"]);

let cachedSnapshot: CatalogDiscoverySnapshot | undefined;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function packageRoot(): string {
  return path.resolve(__dirname, "..");
}

function repoRoot(): string {
  return path.resolve(packageRoot(), "..", "..");
}

function libraryRoot(): string {
  return path.join(repoRoot(), "library");
}

function packagedSnapshotPath(): string {
  return path.join(packageRoot(), "dist", "discovery-snapshot.json");
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function toRepoRelative(filePath: string): string {
  return normalizePath(path.relative(repoRoot(), filePath));
}

function toLibraryRelative(filePath: string): string {
  return normalizePath(path.relative(libraryRoot(), filePath));
}

function readDirNames(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function safeStat(filePath: string): fs.Stats | undefined {
  try {
    return fs.statSync(filePath);
  } catch {
    return undefined;
  }
}

function isoTimestamp(value: Date | undefined): string {
  if (!value || Number.isNaN(value.getTime())) {
    return new Date(0).toISOString();
  }
  return value.toISOString();
}

function createdAtFor(stats: fs.Stats | undefined): string {
  const birthtime = stats?.birthtime;
  if (birthtime && !Number.isNaN(birthtime.getTime()) && birthtime.getTime() > 0) {
    return birthtime.toISOString();
  }
  return isoTimestamp(stats?.mtime);
}

function updatedAtFor(stats: fs.Stats | undefined): string {
  return isoTimestamp(stats?.mtime);
}

function fileSize(filePath: string): number {
  return safeStat(filePath)?.size ?? 0;
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function isDirectory(filePath: string): boolean {
  return safeStat(filePath)?.isDirectory() ?? false;
}

function listFilesRecursively(dirPath: string, predicate: (filePath: string) => boolean): string[] {
  const results: string[] = [];
  const walk = (currentPath: string) => {
    for (const entry of readDirNames(currentPath)) {
      if (entry.startsWith(".")) {
        continue;
      }
      const entryPath = path.join(currentPath, entry);
      if (isDirectory(entryPath)) {
        walk(entryPath);
        continue;
      }
      if (predicate(entryPath)) {
        results.push(entryPath);
      }
    }
  };
  walk(dirPath);
  return results.sort((left, right) => normalizePath(left).localeCompare(normalizePath(right)));
}

function fileExists(filePath: string): boolean {
  return safeStat(filePath)?.isFile() ?? false;
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; content: string } {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) {
    return { frontmatter: {}, content };
  }

  try {
    const frontmatter = parseYaml(match[1] ?? "") as Record<string, unknown> | null;
    return {
      frontmatter: frontmatter && typeof frontmatter === "object" ? frontmatter : {},
      content: content.slice(match[0].length),
    };
  } catch {
    return { frontmatter: {}, content: content.slice(match[0].length) };
  }
}

function firstMarkdownParagraph(content: string): string {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("```"));
  return lines[0] ?? "";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function extractDomainFromPath(filePath: string): string | null {
  const normalized = normalizePath(filePath);
  const match = normalized.match(/\/specializations\/domains\/([^/]+)/);
  return match?.[1] ?? null;
}

function extractSpecializationFromPath(filePath: string): string | null {
  const normalized = normalizePath(filePath);
  const domainMatch = normalized.match(/\/specializations\/domains\/[^/]+\/([^/]+)/);
  if (domainMatch?.[1] && domainMatch[1] !== "agents" && domainMatch[1] !== "skills") {
    return domainMatch[1];
  }
  const specMatch = normalized.match(/\/specializations\/([^/]+)/);
  if (specMatch?.[1] && specMatch[1] !== "domains") {
    return specMatch[1];
  }
  return null;
}

function parseMarkdownEntity(filePath: string): {
  name: string;
  description: string;
  content: string;
  frontmatter: Record<string, unknown>;
  metadata: Record<string, unknown>;
} {
  const raw = readFile(filePath);
  const parsed = parseFrontmatter(raw);
  const metadata = asRecord(parsed.frontmatter.metadata);
  const name = stringValue(parsed.frontmatter.name) ?? path.basename(path.dirname(filePath));
  const description =
    stringValue(parsed.frontmatter.description) ??
    firstMarkdownParagraph(parsed.content) ??
    "";

  return {
    name,
    description,
    content: parsed.content,
    frontmatter: parsed.frontmatter,
    metadata,
  };
}

function findPrimaryDocPaths(baseDir: string): { readmePath: string | null; referencesPath: string | null } {
  const readmePath = path.join(baseDir, "README.md");
  const referencesPath = path.join(baseDir, "references.md");
  return {
    readmePath: fs.existsSync(readmePath) ? toRepoRelative(readmePath) : null,
    referencesPath: fs.existsSync(referencesPath) ? toRepoRelative(referencesPath) : null,
  };
}

function parseProcessIo(definition: string | undefined, includeRequired: boolean): CatalogDiscoveryProcessIo[] {
  if (!definition) {
    return [];
  }

  const cleaned = definition.trim();
  if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
    return [];
  }

  const body = cleaned.slice(1, -1).trim();
  if (!body) {
    return [];
  }

  const result: CatalogDiscoveryProcessIo[] = [];
  let current = "";
  let depth = 0;
  for (const char of body) {
    if (char === "{" || char === "[" || char === "(") {
      depth += 1;
      current += char;
      continue;
    }
    if (char === "}" || char === "]" || char === ")") {
      depth -= 1;
      current += char;
      continue;
    }
    if (char === "," && depth === 0) {
      const entry = current.trim();
      if (entry) {
        const colonIndex = entry.indexOf(":");
        if (colonIndex > 0) {
          let name = entry.slice(0, colonIndex).trim();
          const type = entry.slice(colonIndex + 1).trim();
          const required = !name.endsWith("?");
          if (!required) {
            name = name.slice(0, -1);
          }
          result.push(includeRequired ? { name, type, required } : { name, type });
        }
      }
      current = "";
      continue;
    }
    current += char;
  }

  const trailing = current.trim();
  if (trailing) {
    const colonIndex = trailing.indexOf(":");
    if (colonIndex > 0) {
      let name = trailing.slice(0, colonIndex).trim();
      const type = trailing.slice(colonIndex + 1).trim();
      const required = !name.endsWith("?");
      if (!required) {
        name = name.slice(0, -1);
      }
      result.push(includeRequired ? { name, type, required } : { name, type });
    }
  }

  return result;
}

function parseProcessFile(filePath: string): Omit<CatalogDiscoveryProcess, "id" | "createdAt" | "updatedAt"> | null {
  const content = readFile(filePath);
  const jsdocMatch = content.match(/\/\*\*[\s\S]*?\*\//);
  if (!jsdocMatch) {
    return null;
  }

  const jsdoc = jsdocMatch[0]
    .replace(/\/\*\*/, "")
    .replace(/\*\//, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\*\s?/, ""))
    .join("\n");

  const processId = jsdoc.match(/@process\s+([^\n]+)/)?.[1]?.trim();
  if (!processId) {
    return null;
  }

  const description = jsdoc.match(/@description\s+([\s\S]*?)(?=@\w|$)/)?.[1]?.trim() ?? "";
  const rawInputs = jsdoc.match(/@inputs\s+(\{[\s\S]*?\})/)?.[1];
  const rawOutputs = jsdoc.match(/@outputs\s+(\{[\s\S]*?\})/)?.[1];
  const taskMatches = Array.from(content.matchAll(/defineTask\(\s*["'`]([^"'`]+)["'`]/g));
  const tasks: CatalogDiscoveryProcessTask[] = taskMatches.map((match) => {
    const taskId = match[1] ?? "task";
    const window = content.slice(match.index ?? 0, (match.index ?? 0) + 400);
    const taskType = window.match(/kind:\s*["'`]([^"'`]+)["'`]/)?.[1] ?? "task";
    return { id: taskId, type: taskType };
  });

  const frontmatter: Record<string, unknown> = {};
  const version = jsdoc.match(/@version\s+([^\n]+)/)?.[1]?.trim();
  const since = jsdoc.match(/@since\s+([^\n]+)/)?.[1]?.trim();
  const author = jsdoc.match(/@author\s+([^\n]+)/)?.[1]?.trim();
  if (author) frontmatter.author = author;
  if (version) frontmatter.version = version;
  if (since) frontmatter.since = since;

  const category = processId.includes("/")
    ? processId.split("/")[0] ?? null
    : extractSpecializationFromPath(filePath) ?? extractDomainFromPath(filePath);

  return {
    processId,
    description,
    category,
    filePath: toRepoRelative(filePath),
    inputs: parseProcessIo(rawInputs, true),
    outputs: parseProcessIo(rawOutputs, false),
    tasks,
    frontmatter,
  };
}

type MutableSkill = Omit<CatalogDiscoverySkill, "id">;
type MutableAgent = Omit<CatalogDiscoveryAgent, "id">;

function catalogSkillSlugFor(filePath: string): string {
  return toLibraryRelative(path.dirname(filePath)).replace(/\//g, "--");
}

function parseSkillFile(filePath: string): MutableSkill {
  const parsed = parseMarkdownEntity(filePath);
  const stats = safeStat(filePath);
  const domainName = stringValue(parsed.metadata.domain) ?? extractDomainFromPath(filePath);
  const specializationName =
    stringValue(parsed.metadata.specialization) ?? extractSpecializationFromPath(filePath);

  return {
    slug: catalogSkillSlugFor(filePath),
    name: parsed.name,
    description: parsed.description,
    filePath: toRepoRelative(filePath),
    directory: toRepoRelative(path.dirname(filePath)),
    specializationName,
    domainName,
    allowedTools: stringArray(parsed.frontmatter["allowed-tools"]),
    createdAt: createdAtFor(stats),
    updatedAt: updatedAtFor(stats),
    content: parsed.content,
    frontmatter: parsed.frontmatter,
  };
}

function parseAgentFile(filePath: string): MutableAgent {
  const parsed = parseMarkdownEntity(filePath);
  const stats = safeStat(filePath);
  const domainName = stringValue(parsed.metadata.domain) ?? extractDomainFromPath(filePath);
  const specializationName =
    stringValue(parsed.metadata.specialization) ?? extractSpecializationFromPath(filePath);

  return {
    name: parsed.name,
    description: parsed.description,
    filePath: toRepoRelative(filePath),
    directory: toRepoRelative(path.dirname(filePath)),
    role: stringValue(parsed.frontmatter.role) ?? null,
    expertise: stringArray(parsed.frontmatter.expertise),
    specializationName,
    domainName,
    createdAt: createdAtFor(stats),
    updatedAt: updatedAtFor(stats),
    content: parsed.content,
    frontmatter: parsed.frontmatter,
  };
}

function assignStableIds<T extends object>(
  items: T[],
  keyFor: (item: T) => string,
): Array<T & { id: number }> {
  return items
    .slice()
    .sort((left, right) => keyFor(left).localeCompare(keyFor(right)))
    .map((item, index) => ({ ...item, id: index + 1 }));
}

function buildSnapshotFromLibrary(libraryDir: string): CatalogDiscoverySnapshot {
  const methodologiesDir = path.join(libraryDir, "methodologies");
  const specializationsDir = path.join(libraryDir, "specializations");
  const domainsDir = path.join(specializationsDir, "domains");

  const processFiles = [
    ...listFilesRecursively(methodologiesDir, (filePath) => PROCESS_EXTENSIONS.has(path.extname(filePath))),
    ...listFilesRecursively(
      specializationsDir,
      (filePath) =>
        PROCESS_EXTENSIONS.has(path.extname(filePath)) &&
        !normalizePath(filePath).includes("/skills/") &&
        !normalizePath(filePath).includes("/agents/"),
    ),
  ];
  const skillFiles = listFilesRecursively(libraryDir, (filePath) => normalizePath(filePath).endsWith("/SKILL.md"));
  const agentFiles = listFilesRecursively(libraryDir, (filePath) => normalizePath(filePath).endsWith("/AGENT.md"));

  const processes = assignStableIds(
    processFiles
      .map((filePath) => {
        const parsed = parseProcessFile(filePath);
        if (!parsed) {
          return null;
        }
        const stats = safeStat(filePath);
        return {
          ...parsed,
          createdAt: createdAtFor(stats),
          updatedAt: updatedAtFor(stats),
        };
      })
      .filter((process): process is Omit<CatalogDiscoveryProcess, "id"> => Boolean(process)),
    (item) => item.processId,
  ) as CatalogDiscoveryProcess[];

  const skills = assignStableIds(
    skillFiles.map((filePath) => parseSkillFile(filePath)),
    (item) => `${item.name}:${item.filePath}`,
  ) as CatalogDiscoverySkill[];

  const agents = assignStableIds(
    agentFiles.map((filePath) => parseAgentFile(filePath)),
    (item) => `${item.name}:${item.filePath}`,
  ) as CatalogDiscoveryAgent[];

  const skillNamesBySpecialization = new Map<string, CatalogDiscoverySkill[]>();
  const agentNamesBySpecialization = new Map<string, CatalogDiscoveryAgent[]>();

  for (const skill of skills) {
    if (skill.specializationName) {
      const bucket = skillNamesBySpecialization.get(skill.specializationName) ?? [];
      bucket.push(skill);
      skillNamesBySpecialization.set(skill.specializationName, bucket);
    }
  }

  for (const agent of agents) {
    if (agent.specializationName) {
      const bucket = agentNamesBySpecialization.get(agent.specializationName) ?? [];
      bucket.push(agent);
      agentNamesBySpecialization.set(agent.specializationName, bucket);
    }
  }

  const specializations: CatalogDiscoverySpecialization[] = [];
  for (const filePath of readDirNames(specializationsDir)) {
    if (filePath === "domains" || filePath.startsWith(".")) {
      continue;
    }
    const absolutePath = path.join(specializationsDir, filePath);
    if (!isDirectory(absolutePath)) {
      continue;
    }
    const stats = safeStat(absolutePath);
    const docs = findPrimaryDocPaths(absolutePath);
    const specializationSkills = (skillNamesBySpecialization.get(filePath) ?? [])
      .filter((skill) => skill.domainName === null)
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name));
    const specializationAgents = (agentNamesBySpecialization.get(filePath) ?? [])
      .filter((agent) => agent.domainName === null)
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name));
    specializations.push({
      id: 0,
      name: filePath,
      path: toRepoRelative(absolutePath),
      domainName: null,
      agentCount: specializationAgents.length,
      skillCount: specializationSkills.length,
      createdAt: createdAtFor(stats),
      updatedAt: updatedAtFor(stats),
      readmePath: docs.readmePath,
      referencesPath: docs.referencesPath,
      agents: specializationAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        role: agent.role,
      })),
      skills: specializationSkills.map((skill) => ({
        id: skill.id,
        slug: skill.slug,
        name: skill.name,
        description: skill.description,
      })),
    });
  }

  for (const domainName of readDirNames(domainsDir)) {
    if (domainName.startsWith(".")) {
      continue;
    }
    const domainPath = path.join(domainsDir, domainName);
    if (!isDirectory(domainPath)) {
      continue;
    }
    for (const specializationName of readDirNames(domainPath)) {
      if (["agents", "skills", "README.md", "references.md"].includes(specializationName) || specializationName.startsWith(".")) {
        continue;
      }
      const specializationPath = path.join(domainPath, specializationName);
      if (!isDirectory(specializationPath)) {
        continue;
      }
      const stats = safeStat(specializationPath);
      const docs = findPrimaryDocPaths(specializationPath);
      const specializationSkills = (skillNamesBySpecialization.get(specializationName) ?? [])
        .filter((skill) => skill.domainName === domainName)
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name));
      const specializationAgents = (agentNamesBySpecialization.get(specializationName) ?? [])
        .filter((agent) => agent.domainName === domainName)
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name));
      specializations.push({
        id: 0,
        name: specializationName,
        path: toRepoRelative(specializationPath),
        domainName,
        agentCount: specializationAgents.length,
        skillCount: specializationSkills.length,
        createdAt: createdAtFor(stats),
        updatedAt: updatedAtFor(stats),
        readmePath: docs.readmePath,
        referencesPath: docs.referencesPath,
        agents: specializationAgents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          role: agent.role,
        })),
        skills: specializationSkills.map((skill) => ({
          id: skill.id,
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
        })),
      });
    }
  }

  const finalizedSpecializations = assignStableIds(
    specializations,
    (item) => `${item.domainName ?? ""}:${item.name}:${item.path}`,
  ) as CatalogDiscoverySpecialization[];

  const domains: CatalogDiscoveryDomain[] = [];
  for (const domainName of readDirNames(domainsDir)) {
    if (domainName.startsWith(".")) {
      continue;
    }
    const domainPath = path.join(domainsDir, domainName);
    if (!isDirectory(domainPath)) {
      continue;
    }
    const stats = safeStat(domainPath);
    const docs = findPrimaryDocPaths(domainPath);
    const childSpecializations = finalizedSpecializations
      .filter((specialization) => specialization.domainName === domainName)
      .sort((left, right) => left.name.localeCompare(right.name));
    const domainSkills = skills.filter((skill) => skill.domainName === domainName);
    const domainAgents = agents.filter((agent) => agent.domainName === domainName);

    domains.push({
      id: 0,
      name: domainName,
      path: toRepoRelative(domainPath),
      category: domainName,
      specializationCount: childSpecializations.length,
      agentCount: domainAgents.length,
      skillCount: domainSkills.length,
      createdAt: createdAtFor(stats),
      updatedAt: updatedAtFor(stats),
      readmePath: docs.readmePath,
      referencesPath: docs.referencesPath,
      specializations: childSpecializations.map((specialization) => ({
        id: specialization.id,
        name: specialization.name,
        path: specialization.path,
        agentCount: specialization.agentCount,
        skillCount: specialization.skillCount,
      })),
    });
  }

  const finalizedDomains = assignStableIds(domains, (item) => item.name) as CatalogDiscoveryDomain[];

  const databaseSize =
    processFiles.reduce((sum, filePath) => sum + fileSize(filePath), 0) +
    skillFiles.reduce((sum, filePath) => sum + fileSize(filePath), 0) +
    agentFiles.reduce((sum, filePath) => sum + fileSize(filePath), 0);

  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    databaseSize,
    counts: {
      domains: finalizedDomains.length,
      specializations: finalizedSpecializations.length,
      agents: agents.length,
      skills: skills.length,
      processes: processes.length,
    },
    processes,
    skills,
    agents,
    domains: finalizedDomains,
    specializations: finalizedSpecializations,
  };
}

function loadPackagedSnapshot(snapshotPath: string): CatalogDiscoverySnapshot {
  try {
    return JSON.parse(readFile(snapshotPath)) as CatalogDiscoverySnapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load packaged discovery snapshot at ${snapshotPath}: ${message}`,
    );
  }
}

function buildSnapshot(): CatalogDiscoverySnapshot {
  const libraryDir = libraryRoot();
  if (isDirectory(libraryDir)) {
    return buildSnapshotFromLibrary(libraryDir);
  }

  const snapshotPath = packagedSnapshotPath();
  if (fileExists(snapshotPath)) {
    return loadPackagedSnapshot(snapshotPath);
  }

  throw new Error(
    `Discovery assets unavailable for @a5c-ai/agent-catalog. Expected either repo library at ${libraryDir} or packaged snapshot at ${snapshotPath}.`,
  );
}

export function clearCatalogDiscoveryCache(): void {
  cachedSnapshot = undefined;
}

export function getCatalogDiscoverySnapshot(): CatalogDiscoverySnapshot {
  if (!cachedSnapshot) {
    cachedSnapshot = buildSnapshot();
  }
  return clone(cachedSnapshot);
}

export function refreshCatalogDiscoverySnapshot(): CatalogDiscoverySnapshot {
  clearCatalogDiscoveryCache();
  return getCatalogDiscoverySnapshot();
}

export function listCatalogProcesses(): CatalogDiscoveryProcess[] {
  return getCatalogDiscoverySnapshot().processes;
}

export function getCatalogProcessById(id: number): CatalogDiscoveryProcess | undefined {
  return getCatalogDiscoverySnapshot().processes.find((process) => process.id === id);
}

export function listCatalogSkills(): CatalogDiscoverySkill[] {
  return getCatalogDiscoverySnapshot().skills;
}

export function getCatalogSkillBySlug(slug: string): CatalogDiscoverySkill | undefined {
  return getCatalogDiscoverySnapshot().skills.find((skill) => skill.slug === slug);
}

export function listCatalogAgents(): CatalogDiscoveryAgent[] {
  return getCatalogDiscoverySnapshot().agents;
}

export function listCatalogDomains(): CatalogDiscoveryDomain[] {
  return getCatalogDiscoverySnapshot().domains;
}

export function getCatalogDomainByName(name: string): CatalogDiscoveryDomain | undefined {
  return getCatalogDiscoverySnapshot().domains.find((domain) => domain.name === name);
}

export function listCatalogSpecializations(): CatalogDiscoverySpecialization[] {
  return getCatalogDiscoverySnapshot().specializations;
}

export function getCatalogSpecializationByName(name: string): CatalogDiscoverySpecialization | undefined {
  return getCatalogDiscoverySnapshot().specializations.find((specialization) => specialization.name === name);
}

function scoreMatch(query: string, ...values: Array<string | null | undefined>): number {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  let bestScore = 0;
  for (const value of values) {
    const normalizedValue = value?.toLowerCase() ?? "";
    if (!normalizedValue) {
      continue;
    }
    if (normalizedValue === normalizedQuery) {
      bestScore = Math.max(bestScore, 100);
      continue;
    }
    if (normalizedValue.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 80);
      continue;
    }
    if (normalizedValue.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 60);
    }
  }

  return bestScore;
}

export function searchCatalogDiscovery(query: string, types?: CatalogDiscoverySearchType[]): CatalogDiscoverySearchResult[] {
  const snapshot = getCatalogDiscoverySnapshot();
  const allowedTypes = new Set<CatalogDiscoverySearchType>(types ?? [
    "agent",
    "skill",
    "process",
    "domain",
    "specialization",
  ]);

  const results: CatalogDiscoverySearchResult[] = [];

  if (allowedTypes.has("agent")) {
    for (const agent of snapshot.agents) {
      const score = scoreMatch(query, agent.name, agent.description, agent.role, agent.expertise.join(" "));
      if (score > 0) {
        results.push({
          type: "agent",
          id: agent.id,
          name: agent.name,
          description: agent.description,
          path: agent.filePath,
          score,
          updatedAt: agent.updatedAt,
        });
      }
    }
  }

  if (allowedTypes.has("skill")) {
    for (const skill of snapshot.skills) {
      const score = scoreMatch(query, skill.name, skill.description, skill.domainName, skill.specializationName);
      if (score > 0) {
        results.push({
          type: "skill",
          id: skill.id,
          name: skill.name,
          description: skill.description,
          path: skill.filePath,
          slug: skill.slug,
          score,
          updatedAt: skill.updatedAt,
        });
      }
    }
  }

  if (allowedTypes.has("process")) {
    for (const process of snapshot.processes) {
      const score = scoreMatch(query, process.processId, process.description, process.category);
      if (score > 0) {
        results.push({
          type: "process",
          id: process.id,
          name: process.processId,
          description: process.description,
          path: process.filePath,
          score,
          updatedAt: process.updatedAt,
        });
      }
    }
  }

  if (allowedTypes.has("domain")) {
    for (const domain of snapshot.domains) {
      const score = scoreMatch(query, domain.name, domain.category);
      if (score > 0) {
        results.push({
          type: "domain",
          id: domain.id,
          name: domain.name,
          description: domain.category ?? domain.name,
          path: domain.path,
          score,
          updatedAt: domain.updatedAt,
        });
      }
    }
  }

  if (allowedTypes.has("specialization")) {
    for (const specialization of snapshot.specializations) {
      const score = scoreMatch(query, specialization.name, specialization.domainName);
      if (score > 0) {
        results.push({
          type: "specialization",
          id: specialization.id,
          name: specialization.name,
          description: specialization.domainName
            ? `${specialization.name} specialization in ${specialization.domainName}`
            : `${specialization.name} specialization`,
          path: specialization.path,
          score,
          updatedAt: specialization.updatedAt,
        });
      }
    }
  }

  return results.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}
