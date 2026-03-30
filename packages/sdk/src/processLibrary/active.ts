import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);
const ACTIVE_PROCESS_LIBRARY_FILENAME = "process-library.json";
const DEFAULT_PROCESS_LIBRARY_REPO = "https://github.com/a5c-ai/babysitter.git";
const DEFAULT_PROCESS_LIBRARY_SUBPATH = "library";
const DEFAULT_PROCESS_LIBRARY_REFERENCE_SUBPATH = "library/reference";

export interface ProcessLibraryBinding {
  dir: string;
  repoUrl?: string;
  ref?: string;
  revision?: string;
  boundAt: string;
}

export interface ProcessLibraryState {
  version: 1;
  updatedAt: string;
  defaultBinding?: ProcessLibraryBinding;
  runBindings?: Record<string, ProcessLibraryBinding>;
  sessionBindings?: Record<string, ProcessLibraryBinding>;
}

export interface CloneProcessLibraryOptions {
  repo: string;
  dir: string;
  ref?: string;
}

export interface CloneProcessLibraryResult {
  dir: string;
  repo: string;
  ref?: string;
  revision: string;
}

export interface UpdateProcessLibraryOptions {
  dir: string;
  ref?: string;
}

export interface UpdateProcessLibraryResult {
  dir: string;
  repo?: string;
  ref?: string;
  revision: string;
}

export interface BindProcessLibraryOptions {
  stateDir?: string;
  dir: string;
  runId?: string;
  sessionId?: string;
  ref?: string;
}

export interface BindProcessLibraryResult {
  stateFile: string;
  bindingScope: "default" | "run" | "session" | "run+session";
  bindingKey?: string;
  binding: ProcessLibraryBinding;
}

export interface ResolveActiveProcessLibraryOptions {
  stateDir?: string;
  runId?: string;
  sessionId?: string;
}

export interface ResolveActiveProcessLibraryResult {
  stateFile: string;
  bindingScope: "default" | "run" | "session" | null;
  bindingKey?: string;
  binding: ProcessLibraryBinding | null;
}

export interface DefaultProcessLibrarySpec {
  stateDir: string;
  repo: string;
  ref?: string;
  cloneDir: string;
  processRoot: string;
  referenceRoot: string;
}

export interface EnsureActiveProcessLibraryOptions
  extends ResolveActiveProcessLibraryOptions {
  repo?: string;
  cloneDir?: string;
  processDir?: string;
  ref?: string;
}

export interface EnsureActiveProcessLibraryResult
  extends ResolveActiveProcessLibraryResult {
  bootstrapped: boolean;
  defaultSpec: DefaultProcessLibrarySpec;
}

function resolveStateDir(stateDir?: string): string {
  if (stateDir && stateDir.trim()) {
    return path.resolve(stateDir);
  }
  if (process.env.BABYSITTER_GLOBAL_STATE_DIR?.trim()) {
    return path.resolve(process.env.BABYSITTER_GLOBAL_STATE_DIR);
  }
  return path.join(os.homedir(), ".a5c");
}

function splitProcessLibrarySubpath(value: string): string[] {
  return value
    .split(/[\\/]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export function getDefaultProcessLibrarySpec(options: {
  stateDir?: string;
  repo?: string;
  cloneDir?: string;
  processDir?: string;
  ref?: string;
} = {}): DefaultProcessLibrarySpec {
  const stateDir = resolveStateDir(options.stateDir);
  const repo =
    options.repo?.trim() ||
    process.env.BABYSITTER_PROCESS_LIBRARY_REPO?.trim() ||
    DEFAULT_PROCESS_LIBRARY_REPO;
  const ref =
    options.ref?.trim() || process.env.BABYSITTER_PROCESS_LIBRARY_REF?.trim() || undefined;
  const cloneDir = path.resolve(
    options.cloneDir?.trim() || path.join(stateDir, "process-library", "babysitter-repo")
  );
  const processSubpath =
    process.env.BABYSITTER_PROCESS_LIBRARY_SUBPATH?.trim() ||
    DEFAULT_PROCESS_LIBRARY_SUBPATH;
  const referenceSubpath =
    process.env.BABYSITTER_PROCESS_LIBRARY_REFERENCE_SUBPATH?.trim() ||
    DEFAULT_PROCESS_LIBRARY_REFERENCE_SUBPATH;
  const processRoot = path.resolve(
    options.processDir?.trim() ||
      path.join(cloneDir, ...splitProcessLibrarySubpath(processSubpath))
  );
  const referenceRoot = options.processDir?.trim()
    ? path.resolve(options.processDir, "reference")
    : path.resolve(cloneDir, ...splitProcessLibrarySubpath(referenceSubpath));

  return {
    stateDir,
    repo,
    ...(ref ? { ref } : {}),
    cloneDir,
    processRoot,
    referenceRoot,
  };
}

export function getActiveProcessLibraryStatePath(stateDir?: string): string {
  return path.join(
    resolveStateDir(stateDir),
    "active",
    ACTIVE_PROCESS_LIBRARY_FILENAME
  );
}

async function readState(stateDir?: string): Promise<ProcessLibraryState> {
  const stateFile = getActiveProcessLibraryStatePath(stateDir);
  try {
    const raw = await fs.readFile(stateFile, "utf8");
    return JSON.parse(raw) as ProcessLibraryState;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return {
        version: 1,
        updatedAt: new Date().toISOString(),
        runBindings: {},
        sessionBindings: {},
      };
    }
    throw error;
  }
}

async function writeState(
  stateDir: string | undefined,
  state: ProcessLibraryState
): Promise<string> {
  const stateFile = getActiveProcessLibraryStatePath(stateDir);
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2), "utf8");
  return stateFile;
}

function normalizeBinding(
  dir: string,
  repoUrl?: string,
  ref?: string,
  revision?: string
): ProcessLibraryBinding {
  return {
    dir: path.resolve(dir),
    ...(repoUrl ? { repoUrl } : {}),
    ...(ref ? { ref } : {}),
    ...(revision ? { revision } : {}),
    boundAt: new Date().toISOString(),
  };
}

async function ensureDirectoryExists(dir: string): Promise<string> {
  const resolved = path.resolve(dir);
  try {
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) {
      throw new Error(`Process-library path is not a directory: ${resolved}`);
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      throw new Error(`Process-library directory not found: ${resolved}`);
    }
    throw error;
  }
  return resolved;
}

async function runGit(
  args: string[],
  cwd?: string
): Promise<{ stdout: string; stderr: string }> {
  const gitArgs =
    process.platform === "win32"
      ? ["-c", "core.longpaths=true", ...args]
      : args;
  return execFile("git", gitArgs, {
    ...(cwd ? { cwd } : {}),
    encoding: "utf8",
  });
}

async function getGitOutput(
  args: string[],
  cwd: string
): Promise<string | undefined> {
  try {
    const { stdout } = await runGit(args, cwd);
    const value = stdout.trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

async function readGitMetadata(dir: string): Promise<{
  repoUrl?: string;
  revision?: string;
}> {
  const repoUrl = await getGitOutput(["config", "--get", "remote.origin.url"], dir);
  const revision = await getGitOutput(["rev-parse", "HEAD"], dir);
  return { repoUrl, revision };
}

export async function cloneProcessLibrary(
  options: CloneProcessLibraryOptions
): Promise<CloneProcessLibraryResult> {
  const dir = path.resolve(options.dir);
  await fs.mkdir(path.dirname(dir), { recursive: true });

  if (await pathExists(dir)) {
    throw new Error(
      `Process-library directory already exists at ${dir}. Choose a new --dir or update it instead.`
    );
  }

  const cloneArgs = ["clone", "--depth", "1"];
  if (options.ref) {
    cloneArgs.push("--branch", options.ref);
  }
  cloneArgs.push(options.repo, dir);
  try {
    await runGit(cloneArgs);
  } catch (error) {
    await fs.rm(dir, { recursive: true, force: true });
    throw error;
  }
  const { revision } = await readGitMetadata(dir);
  if (!revision) {
    throw new Error(`Unable to determine cloned revision for ${dir}`);
  }
  return {
    dir,
    repo: options.repo,
    ...(options.ref ? { ref: options.ref } : {}),
    revision,
  };
}

export async function updateProcessLibrary(
  options: UpdateProcessLibraryOptions
): Promise<UpdateProcessLibraryResult> {
  const dir = await ensureDirectoryExists(options.dir);
  if (options.ref) {
    await runGit(["fetch", "--depth", "1", "origin", options.ref], dir);
    await runGit(["checkout", "--force", "FETCH_HEAD"], dir);
  } else {
    await runGit(["pull", "--ff-only"], dir);
  }
  const { repoUrl, revision } = await readGitMetadata(dir);
  if (!revision) {
    throw new Error(`Unable to determine updated revision for ${dir}`);
  }
  return {
    dir,
    ...(repoUrl ? { repo: repoUrl } : {}),
    ...(options.ref ? { ref: options.ref } : {}),
    revision,
  };
}

export async function bindActiveProcessLibrary(
  options: BindProcessLibraryOptions
): Promise<BindProcessLibraryResult> {
  const dir = await ensureDirectoryExists(options.dir);
  const state = await readState(options.stateDir);
  const { repoUrl, revision } = await readGitMetadata(dir);
  const binding = normalizeBinding(dir, repoUrl, options.ref, revision);

  let bindingScope: "default" | "run" | "session" | "run+session" = "default";
  let bindingKey: string | undefined;

  if (options.runId) {
    state.runBindings = state.runBindings ?? {};
    state.runBindings[options.runId] = binding;
    bindingScope = "run";
    bindingKey = options.runId;
  }
  if (options.sessionId) {
    state.sessionBindings = state.sessionBindings ?? {};
    state.sessionBindings[options.sessionId] = binding;
    bindingScope = options.runId ? "run+session" : "session";
    bindingKey = options.runId
      ? `${options.runId}:${options.sessionId}`
      : options.sessionId;
  }
  if (!options.runId && !options.sessionId) {
    state.defaultBinding = binding;
  }

  state.updatedAt = new Date().toISOString();
  const stateFile = await writeState(options.stateDir, state);

  return { stateFile, bindingScope, ...(bindingKey ? { bindingKey } : {}), binding };
}

export async function resolveActiveProcessLibrary(
  options: ResolveActiveProcessLibraryOptions = {}
): Promise<ResolveActiveProcessLibraryResult> {
  const stateFile = getActiveProcessLibraryStatePath(options.stateDir);
  const state = await readState(options.stateDir);

  if (options.runId && state.runBindings?.[options.runId]) {
    return {
      stateFile,
      bindingScope: "run",
      bindingKey: options.runId,
      binding: state.runBindings[options.runId],
    };
  }

  if (options.sessionId && state.sessionBindings?.[options.sessionId]) {
    return {
      stateFile,
      bindingScope: "session",
      bindingKey: options.sessionId,
      binding: state.sessionBindings[options.sessionId],
    };
  }

  return {
    stateFile,
    bindingScope: state.defaultBinding ? "default" : null,
    binding: state.defaultBinding ?? null,
  };
}

export async function ensureActiveProcessLibrary(
  options: EnsureActiveProcessLibraryOptions = {}
): Promise<EnsureActiveProcessLibraryResult> {
  const defaultSpec = getDefaultProcessLibrarySpec(options);
  const resolved = await resolveActiveProcessLibrary(options);

  if (resolved.binding && (await pathExists(resolved.binding.dir))) {
    return {
      ...resolved,
      bootstrapped: false,
      defaultSpec,
    };
  }

  const cloneExists = await pathExists(path.join(defaultSpec.cloneDir, ".git"));
  if (cloneExists) {
    await updateProcessLibrary({
      dir: defaultSpec.cloneDir,
      ...(defaultSpec.ref ? { ref: defaultSpec.ref } : {}),
    });
  } else {
    await cloneProcessLibrary({
      repo: defaultSpec.repo,
      dir: defaultSpec.cloneDir,
      ...(defaultSpec.ref ? { ref: defaultSpec.ref } : {}),
    });
  }

  const bound = await bindActiveProcessLibrary({
    stateDir: defaultSpec.stateDir,
    dir: defaultSpec.processRoot,
    runId: options.runId,
    sessionId: options.sessionId,
    ref: defaultSpec.ref,
  });

  return {
    stateFile: bound.stateFile,
    bindingScope:
      bound.bindingScope === "run+session" ? "run" : bound.bindingScope,
    ...(bound.bindingKey ? { bindingKey: bound.bindingKey } : {}),
    binding: bound.binding,
    bootstrapped: true,
    defaultSpec,
  };
}
