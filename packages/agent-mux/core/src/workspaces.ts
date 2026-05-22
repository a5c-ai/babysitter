import * as os from 'node:os';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

export type WorkspaceMaterializationMode = 'worktree' | 'symlink';
export type WorkspaceSessionStatus = 'running' | 'stopped';
export type WorkspaceStatus = 'active' | 'idle' | 'archived' | 'cleaned' | 'missing';

export interface WorkspaceSessionRepoContext {
  readonly alias: string;
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly mode: WorkspaceMaterializationMode;
  readonly gitRoot: string | null;
  readonly branch: string | null;
  readonly head: string | null;
}

export interface WorkspaceSessionContext {
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly workspaceRootPath: string;
  readonly workspaceDefaultCwd: string;
  readonly workspaceMode: WorkspaceMaterializationMode;
  readonly currentPath?: string;
  readonly repo?: WorkspaceSessionRepoContext;
}

export interface WorkspaceRepoInput {
  readonly path: string;
  readonly alias?: string;
  readonly mode?: WorkspaceMaterializationMode;
}

export interface WorkspaceCreateInput {
  readonly name: string;
  readonly repos: readonly WorkspaceRepoInput[];
  readonly mode?: WorkspaceMaterializationMode;
  readonly branchName?: string;
  readonly rootDir?: string;
}

export interface WorkspaceSessionBinding {
  readonly agent: string;
  readonly sessionId: string;
  readonly status: WorkspaceSessionStatus;
  readonly cwd?: string;
  readonly title?: string;
  readonly updatedAt: string;
  readonly activeRunId?: string | null;
  readonly latestRunId?: string | null;
}

export interface WorkspaceRepoRecord {
  readonly alias: string;
  readonly sourcePath: string;
  readonly targetPath: string;
  readonly mode: WorkspaceMaterializationMode;
  readonly gitRoot: string | null;
  readonly branch: string | null;
  readonly head: string | null;
}

export interface WorkspaceRecord {
  readonly id: string;
  readonly name: string;
  readonly rootPath: string;
  readonly mode: WorkspaceMaterializationMode;
  readonly createdAt: string;
  readonly archivedAt: string | null;
  readonly cleanedAt: string | null;
  readonly repos: readonly WorkspaceRepoRecord[];
  readonly sessions: readonly WorkspaceSessionBinding[];
}

export interface WorkspaceRepoSummary extends WorkspaceRepoRecord {
  readonly exists: boolean;
}

export interface WorkspaceActionAvailability {
  readonly canArchive: boolean;
  readonly canCleanup: boolean;
  readonly canDelete: boolean;
  readonly canRecover: boolean;
}

export interface WorkspaceSummary {
  readonly id: string;
  readonly name: string;
  readonly rootPath: string;
  readonly defaultCwd: string;
  readonly mode: WorkspaceMaterializationMode;
  readonly status: WorkspaceStatus;
  readonly createdAt: string;
  readonly archivedAt: string | null;
  readonly cleanedAt: string | null;
  readonly repos: readonly WorkspaceRepoSummary[];
  readonly sessions: readonly WorkspaceSessionBinding[];
  readonly actions: WorkspaceActionAvailability;
}

export interface WorkspaceListResult {
  readonly workspaces: readonly WorkspaceSummary[];
  readonly summary: {
    readonly total: number;
    readonly active: number;
    readonly idle: number;
    readonly archived: number;
    readonly cleaned: number;
    readonly missing: number;
  };
}

interface WorkspaceRegistryFile {
  readonly version: 1;
  readonly workspaces: Record<string, WorkspaceRecord>;
}

export interface WorkspaceServiceDeps {
  readonly readFile: typeof fs.readFile;
  readonly writeFile: typeof fs.writeFile;
  readonly mkdir: typeof fs.mkdir;
  readonly rm: typeof fs.rm;
  readonly symlink: typeof fs.symlink;
  readonly unlink: typeof fs.unlink;
  readonly stat: typeof fs.stat;
  readonly lstat: typeof fs.lstat;
  readonly readdir: typeof fs.readdir;
  readonly execGit: (args: string[], cwd: string) => Promise<{ stdout: string; stderr: string }>;
  readonly now: () => string;
  readonly homedir: () => string;
}

const defaultDeps: WorkspaceServiceDeps = {
  readFile: fs.readFile,
  writeFile: fs.writeFile,
  mkdir: fs.mkdir,
  rm: fs.rm,
  symlink: fs.symlink,
  unlink: fs.unlink,
  stat: fs.stat,
  lstat: fs.lstat,
  readdir: fs.readdir,
  execGit: async (args, cwd) => {
    const result = await execFile('git', args, { cwd });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
    };
  },
  now: () => new Date().toISOString(),
  homedir: () => os.homedir(),
};

function defaultWorkspaceRoot(deps: WorkspaceServiceDeps): string {
  return path.join(deps.homedir(), '.a5c', 'workspaces');
}

function defaultRegistryPath(deps: WorkspaceServiceDeps): string {
  return path.join(defaultWorkspaceRoot(deps), 'registry.json');
}

function slugify(value: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned.length > 0 ? cleaned : 'workspace';
}

function uniqueByAlias<T extends { alias: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    if (seen.has(item.alias)) {
      continue;
    }
    seen.add(item.alias);
    output.push(item);
  }
  return output;
}

function normalizeIdentifier(value: string): string {
  return value.trim();
}

function isMissingError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT';
}

async function pathExists(deps: WorkspaceServiceDeps, targetPath: string): Promise<boolean> {
  try {
    await deps.lstat(targetPath);
    return true;
  } catch (error) {
    if (isMissingError(error)) {
      return false;
    }
    throw error;
  }
}

async function ensureDirectory(deps: WorkspaceServiceDeps, targetPath: string): Promise<void> {
  await deps.mkdir(targetPath, { recursive: true });
}

async function readRegistry(deps: WorkspaceServiceDeps): Promise<WorkspaceRegistryFile> {
  try {
    const raw = await deps.readFile(defaultRegistryPath(deps), 'utf8');
    const parsed = JSON.parse(raw) as Partial<WorkspaceRegistryFile>;
    if (parsed.version !== 1 || !parsed.workspaces || typeof parsed.workspaces !== 'object') {
      return { version: 1, workspaces: {} };
    }
    return {
      version: 1,
      workspaces: parsed.workspaces,
    };
  } catch (error) {
    if (isMissingError(error)) {
      return { version: 1, workspaces: {} };
    }
    throw error;
  }
}

async function writeRegistry(deps: WorkspaceServiceDeps, registry: WorkspaceRegistryFile): Promise<void> {
  await ensureDirectory(deps, defaultWorkspaceRoot(deps));
  await deps.writeFile(defaultRegistryPath(deps), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function sessionBindingKey(session: Pick<WorkspaceSessionBinding, 'agent' | 'sessionId'>): string {
  return `${session.agent}:${session.sessionId}`;
}

function matchesWorkspacePath(workspace: WorkspaceRecord, cwd?: string): boolean {
  if (!cwd) {
    return false;
  }
  const normalized = path.resolve(cwd);
  if (normalized === workspace.rootPath) {
    return true;
  }
  return workspace.repos.some((repo) => normalized === repo.targetPath || normalized.startsWith(`${repo.targetPath}${path.sep}`));
}

export function resolveWorkspaceDefaultCwd(
  workspace: Pick<WorkspaceRecord, 'rootPath' | 'repos'> | Pick<WorkspaceSummary, 'rootPath' | 'repos'>,
): string {
  if (workspace.repos.length === 1) {
    return workspace.repos[0]!.targetPath;
  }
  return workspace.rootPath;
}

function matchWorkspaceRepoForPath(
  workspace: Pick<WorkspaceRecord, 'repos'> | Pick<WorkspaceSummary, 'repos'>,
  cwd?: string,
): WorkspaceRepoRecord | WorkspaceRepoSummary | undefined {
  if (!cwd) {
    return workspace.repos.length === 1 ? workspace.repos[0] : undefined;
  }
  const normalized = path.resolve(cwd);
  return workspace.repos.find((repo) => normalized === repo.targetPath || normalized.startsWith(`${repo.targetPath}${path.sep}`));
}

function buildWorkspaceSessionContext(
  workspace: Pick<WorkspaceRecord, 'id' | 'name' | 'rootPath' | 'mode' | 'repos'>,
  cwd?: string,
): WorkspaceSessionContext {
  const repo = matchWorkspaceRepoForPath(workspace, cwd);
  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceRootPath: workspace.rootPath,
    workspaceDefaultCwd: resolveWorkspaceDefaultCwd(workspace),
    workspaceMode: workspace.mode,
    currentPath: cwd ? path.resolve(cwd) : undefined,
    repo: repo
      ? {
          alias: repo.alias,
          sourcePath: repo.sourcePath,
          targetPath: repo.targetPath,
          mode: repo.mode,
          gitRoot: repo.gitRoot,
          branch: repo.branch,
          head: repo.head,
        }
      : undefined,
  };
}

function deriveStatus(record: WorkspaceRecord, repos: readonly WorkspaceRepoSummary[]): WorkspaceStatus {
  const hasRunningSession = record.sessions.some((session) => session.status === 'running');
  const anyRepoExists = repos.some((repo) => repo.exists);

  if (hasRunningSession) {
    return 'active';
  }
  if (record.archivedAt) {
    return 'archived';
  }
  if (record.cleanedAt) {
    return anyRepoExists ? 'idle' : 'cleaned';
  }
  if (!anyRepoExists && record.repos.length > 0) {
    return 'missing';
  }
  return 'idle';
}

async function summarizeWorkspace(
  deps: WorkspaceServiceDeps,
  record: WorkspaceRecord,
): Promise<WorkspaceSummary> {
  const repos: WorkspaceRepoSummary[] = await Promise.all(
    record.repos.map(async (repo) => ({
      ...repo,
      exists: await pathExists(deps, repo.targetPath),
    })),
  );
  const status = deriveStatus(record, repos);
  return {
    id: record.id,
    name: record.name,
    rootPath: record.rootPath,
    defaultCwd: resolveWorkspaceDefaultCwd(record),
    mode: record.mode,
    status,
    createdAt: record.createdAt,
    archivedAt: record.archivedAt,
    cleanedAt: record.cleanedAt,
    repos,
    sessions: [...record.sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    actions: {
      canArchive: status === 'idle' || status === 'active',
      canCleanup: (status === 'archived' || status === 'missing') && !record.sessions.some((session) => session.status === 'running'),
      canDelete: status !== 'active',
      canRecover: status === 'cleaned' || status === 'missing',
    },
  };
}

function resolveWorkspaceRecord(
  registry: WorkspaceRegistryFile,
  identifier: string,
): WorkspaceRecord | null {
  const needle = normalizeIdentifier(identifier);
  const direct = registry.workspaces[needle];
  if (direct) {
    return direct;
  }
  for (const record of Object.values(registry.workspaces)) {
    if (
      record.id === needle ||
      record.name === needle ||
      record.rootPath === needle ||
      resolveWorkspaceDefaultCwd(record) === needle ||
      record.repos.some((repo) => repo.targetPath === needle)
    ) {
      return record;
    }
  }
  return null;
}

async function resolveGitTopLevel(deps: WorkspaceServiceDeps, repoPath: string): Promise<string | null> {
  try {
    const result = await deps.execGit(['rev-parse', '--show-toplevel'], repoPath);
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

async function resolveGitBranch(deps: WorkspaceServiceDeps, repoPath: string): Promise<string | null> {
  try {
    const result = await deps.execGit(['branch', '--show-current'], repoPath);
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

async function resolveGitHead(deps: WorkspaceServiceDeps, repoPath: string): Promise<string | null> {
  try {
    const result = await deps.execGit(['rev-parse', 'HEAD'], repoPath);
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}

async function createWorktree(
  deps: WorkspaceServiceDeps,
  input: {
    gitRoot: string;
    targetPath: string;
    branchName?: string;
    alias: string;
    head: string | null;
    appendAliasToBranchName: boolean;
  },
): Promise<string | null> {
  if (input.branchName) {
    const branch = input.appendAliasToBranchName ? `${input.branchName}-${input.alias}` : input.branchName;
    await deps.execGit(['worktree', 'add', '-b', branch, input.targetPath], input.gitRoot);
    return branch;
  }
  const commitish = input.head ?? 'HEAD';
  await deps.execGit(['worktree', 'add', '--detach', input.targetPath, commitish], input.gitRoot);
  return null;
}

function resolveWorkspaceRootPath(
  rootDir: string,
  slugBase: string,
  existingRoots: Set<string>,
): { id: string; rootPath: string } {
  let suffix = 0;
  while (true) {
    const id = suffix === 0 ? slugBase : `${slugBase}-${suffix + 1}`;
    const rootPath = path.join(rootDir, id);
    if (!existingRoots.has(rootPath)) {
      return { id, rootPath };
    }
    suffix += 1;
  }
}

export class WorkspaceService {
  private readonly deps: WorkspaceServiceDeps;

  constructor(deps: Partial<WorkspaceServiceDeps> = {}) {
    this.deps = { ...defaultDeps, ...deps };
  }

  rootDir(): string {
    return defaultWorkspaceRoot(this.deps);
  }

  async listWorkspaces(options: {
    readonly liveSessions?: readonly WorkspaceSessionBinding[];
  } = {}): Promise<WorkspaceListResult> {
    if (options.liveSessions && options.liveSessions.length > 0) {
      await this.reconcileSessions(options.liveSessions);
    }

    const registry = await readRegistry(this.deps);
    const workspaces = await Promise.all(
      Object.values(registry.workspaces).map((record) => summarizeWorkspace(this.deps, record)),
    );
    workspaces.sort((left, right) => left.rootPath.localeCompare(right.rootPath));
    return {
      workspaces,
      summary: {
        total: workspaces.length,
        active: workspaces.filter((workspace) => workspace.status === 'active').length,
        idle: workspaces.filter((workspace) => workspace.status === 'idle').length,
        archived: workspaces.filter((workspace) => workspace.status === 'archived').length,
        cleaned: workspaces.filter((workspace) => workspace.status === 'cleaned').length,
        missing: workspaces.filter((workspace) => workspace.status === 'missing').length,
      },
    };
  }

  async createWorkspace(input: WorkspaceCreateInput): Promise<WorkspaceRecord> {
    if (!input.name.trim()) {
      throw new Error('Workspace name is required.');
    }
    if (input.repos.length === 0) {
      throw new Error('At least one repository path is required to create a workspace.');
    }

    const registry = await readRegistry(this.deps);
    const rootDir = path.resolve(input.rootDir ?? this.rootDir());
    const mode = input.mode ?? 'worktree';
    const slugBase = slugify(input.name);
    const existingRoots = new Set(Object.values(registry.workspaces).map((record) => record.rootPath));
    const resolved = resolveWorkspaceRootPath(rootDir, slugBase, existingRoots);

    await ensureDirectory(this.deps, rootDir);
    await ensureDirectory(this.deps, resolved.rootPath);

    const repos = uniqueByAlias(
      await Promise.all(
        input.repos.map(async (repoInput, index) => {
          const sourcePath = path.resolve(repoInput.path);
          const alias = slugify(repoInput.alias ?? (path.basename(sourcePath) || `repo-${index + 1}`));
          const targetPath = path.join(resolved.rootPath, alias);
          const repoMode = repoInput.mode ?? mode;
          const gitRoot = await resolveGitTopLevel(this.deps, sourcePath);
          const sourceBranch = gitRoot ? await resolveGitBranch(this.deps, sourcePath) : null;
          const head = gitRoot ? await resolveGitHead(this.deps, sourcePath) : null;
          let branch = sourceBranch;

          if (repoMode === 'worktree') {
            if (!gitRoot) {
              throw new Error(`Cannot create a git worktree for non-git directory: ${sourcePath}`);
            }
            branch = await createWorktree(this.deps, {
              gitRoot,
              targetPath,
              branchName: input.branchName,
              alias,
              head,
              appendAliasToBranchName: input.repos.length > 1,
            });
          } else {
            await this.deps.symlink(sourcePath, targetPath, 'dir');
          }

          return {
            alias,
            sourcePath,
            targetPath,
            mode: repoMode,
            gitRoot,
            branch,
            head,
          } satisfies WorkspaceRepoRecord;
        }),
      ),
    );

    const record: WorkspaceRecord = {
      id: resolved.id,
      name: input.name,
      rootPath: resolved.rootPath,
      mode,
      createdAt: this.deps.now(),
      archivedAt: null,
      cleanedAt: null,
      repos,
      sessions: [],
    };
    registry.workspaces[record.id] = record;
    await writeRegistry(this.deps, registry);
    return record;
  }

  async archiveWorkspace(identifier: string): Promise<WorkspaceRecord> {
    const registry = await readRegistry(this.deps);
    const record = resolveWorkspaceRecord(registry, identifier);
    if (!record) {
      throw new Error(`Workspace not found: ${identifier}`);
    }
    const next: WorkspaceRecord = {
      ...record,
      archivedAt: this.deps.now(),
    };
    registry.workspaces[next.id] = next;
    await writeRegistry(this.deps, registry);
    return next;
  }

  async cleanupWorkspace(identifier: string): Promise<WorkspaceRecord> {
    const registry = await readRegistry(this.deps);
    const record = resolveWorkspaceRecord(registry, identifier);
    if (!record) {
      throw new Error(`Workspace not found: ${identifier}`);
    }
    if (record.sessions.some((session) => session.status === 'running')) {
      throw new Error(`Cannot clean up workspace with running sessions: ${record.name}`);
    }

    for (const repo of record.repos) {
      const exists = await pathExists(this.deps, repo.targetPath);
      if (!exists) {
        continue;
      }
      if (repo.mode === 'worktree' && repo.gitRoot) {
        await this.deps.execGit(['worktree', 'remove', '--force', repo.targetPath], repo.gitRoot);
        await this.deps.execGit(['worktree', 'prune'], repo.gitRoot);
      } else {
        await this.deps.unlink(repo.targetPath).catch((error: unknown) => {
          if (!isMissingError(error)) {
            throw error;
          }
        });
      }
    }

    await this.deps.rm(record.rootPath, { recursive: true, force: true });

    const next: WorkspaceRecord = {
      ...record,
      cleanedAt: this.deps.now(),
    };
    registry.workspaces[next.id] = next;
    await writeRegistry(this.deps, registry);
    return next;
  }

  async recoverWorkspace(identifier: string): Promise<WorkspaceRecord> {
    const registry = await readRegistry(this.deps);
    const record = resolveWorkspaceRecord(registry, identifier);
    if (!record) {
      throw new Error(`Workspace not found: ${identifier}`);
    }

    await ensureDirectory(this.deps, record.rootPath);
    for (const repo of record.repos) {
      const exists = await pathExists(this.deps, repo.targetPath);
      if (exists) {
        continue;
      }
      if (repo.mode === 'worktree') {
        if (!repo.gitRoot) {
          throw new Error(`Cannot recover worktree repo without git root metadata: ${repo.alias}`);
        }
        if (repo.branch) {
          await this.deps.execGit(['worktree', 'add', repo.targetPath, repo.branch], repo.gitRoot);
        } else {
          await this.deps.execGit(['worktree', 'add', '--detach', repo.targetPath, repo.head ?? 'HEAD'], repo.gitRoot);
        }
      } else {
        await this.deps.symlink(repo.sourcePath, repo.targetPath, 'dir');
      }
    }

    const next: WorkspaceRecord = {
      ...record,
      cleanedAt: null,
    };
    registry.workspaces[next.id] = next;
    await writeRegistry(this.deps, registry);
    return next;
  }

  async deleteWorkspace(identifier: string, options: { readonly forceCleanup?: boolean } = {}): Promise<void> {
    const registry = await readRegistry(this.deps);
    const record = resolveWorkspaceRecord(registry, identifier);
    if (!record) {
      throw new Error(`Workspace not found: ${identifier}`);
    }
    if (record.sessions.some((session) => session.status === 'running')) {
      throw new Error(`Cannot delete workspace with running sessions: ${record.name}`);
    }
    if (options.forceCleanup !== true && await pathExists(this.deps, record.rootPath)) {
      throw new Error(`Workspace still exists on disk: ${record.rootPath}. Clean it up first or use forceCleanup.`);
    }
    if (options.forceCleanup === true) {
      await this.cleanupWorkspace(record.id);
    }
    delete registry.workspaces[record.id];
    await writeRegistry(this.deps, registry);
  }

  async bindSession(input: {
    readonly workspaceId: string;
    readonly session: WorkspaceSessionBinding;
  }): Promise<WorkspaceRecord> {
    const registry = await readRegistry(this.deps);
    const record = resolveWorkspaceRecord(registry, input.workspaceId);
    if (!record) {
      throw new Error(`Workspace not found: ${input.workspaceId}`);
    }
    const byKey = new Map(record.sessions.map((session) => [sessionBindingKey(session), session] as const));
    byKey.set(sessionBindingKey(input.session), input.session);
    const next: WorkspaceRecord = {
      ...record,
      sessions: Array.from(byKey.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    };
    registry.workspaces[next.id] = next;
    await writeRegistry(this.deps, registry);
    return next;
  }

  async reconcileSessions(liveSessions: readonly WorkspaceSessionBinding[]): Promise<void> {
    const registry = await readRegistry(this.deps);
    let changed = false;

    for (const record of Object.values(registry.workspaces)) {
      const nextSessions = new Map(record.sessions.map((session) => [sessionBindingKey(session), session] as const));
      for (const live of liveSessions) {
        const sessionKey = sessionBindingKey(live);
        if (nextSessions.has(sessionKey) || matchesWorkspacePath(record, live.cwd)) {
          nextSessions.set(sessionKey, live);
        }
      }
      const nextValues = Array.from(nextSessions.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      if (JSON.stringify(nextValues) !== JSON.stringify(record.sessions)) {
        registry.workspaces[record.id] = {
          ...record,
          sessions: nextValues,
        };
        changed = true;
      }
    }

    if (changed) {
      await writeRegistry(this.deps, registry);
    }
  }

  async resolveWorkspace(identifier: string): Promise<WorkspaceRecord | null> {
    const registry = await readRegistry(this.deps);
    return resolveWorkspaceRecord(registry, identifier);
  }

  async resolveSessionContext(input: {
    readonly workspaceId?: string;
    readonly cwd?: string;
  }): Promise<WorkspaceSessionContext | null> {
    const registry = await readRegistry(this.deps);
    let record: WorkspaceRecord | null = null;

    if (input.workspaceId) {
      record = resolveWorkspaceRecord(registry, input.workspaceId);
    }

    if (!record && input.cwd) {
      const normalized = path.resolve(input.cwd);
      for (const candidate of Object.values(registry.workspaces)) {
        if (matchesWorkspacePath(candidate, normalized)) {
          record = candidate;
          break;
        }
      }
    }

    if (!record) {
      return null;
    }

    return buildWorkspaceSessionContext(record, input.cwd);
  }

  resolveWorkspaceCwd(workspace: Pick<WorkspaceRecord, 'rootPath' | 'repos'> | Pick<WorkspaceSummary, 'rootPath' | 'repos'>): string {
    return resolveWorkspaceDefaultCwd(workspace);
  }
}
