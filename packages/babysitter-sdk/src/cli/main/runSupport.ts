import { promises as fs, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { collapseDoubledA5cRuns, resolveRunDir } from "./args";
import type { ParsedArgs } from "./types";
import { resolveInputPath } from "../resolveInputPath";
import type { StateCacheSnapshot } from "../../runtime/replay/stateCache";
import type { EffectAction, IterationMetadata } from "../../runtime/types";
import type { JsonRecord } from "../../storage/types";

type ActionSummary = {
  effectId: string;
  kind: string;
  label?: string;
};

type ModuleExports = Record<string, unknown>;
type ArtifactCandidate = { absolute: string; relative: string; outsideRun: boolean };
type LocalSdkDependencyOptions = {
  createRequireFn?: typeof createRequire;
  resolveSdkPackageDir?: () => string;
  fsImpl?: Pick<typeof fs, "access" | "mkdir" | "symlink">;
};

const SDK_PACKAGE_SPECIFIER = "@a5c-ai/babysitter-sdk/package.json";

const dynamicImportModule: (specifier: string) => Promise<ModuleExports> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<ModuleExports>;
})();

export function summarizeActions(actions: EffectAction[]): ActionSummary[] {
  return actions.map((action) => ({
    effectId: action.effectId,
    kind: action.kind,
    label: action.label,
  }));
}

export function logPendingActions(
  actions: EffectAction[],
  options: { command?: string; includeHeader?: boolean; metadataParts?: string[] } = {}
): ActionSummary[] {
  const summaries = summarizeActions(actions);
  if (options.command && options.includeHeader !== false) {
    const headerParts = [
      `[${options.command}] status=waiting`,
      `pending=${summaries.length}`,
      ...(options.metadataParts ?? []),
    ];
    console.error(headerParts.join(" "));
  }
  for (const summary of summaries) {
    const label = summary.label ? ` ${summary.label}` : "";
    console.error(`- ${summary.effectId} [${summary.kind}]${label}`);
  }
  return summaries;
}

export function countActionsByKind(actions: EffectAction[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const action of actions) {
    counts.set(action.kind, (counts.get(action.kind) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

export function enrichIterationMetadata(
  metadata: IterationMetadata | undefined,
  pendingActions?: EffectAction[]
): IterationMetadata | undefined {
  if (!pendingActions?.length) {
    return metadata;
  }
  if (metadata?.pendingEffectsByKind) {
    return metadata;
  }
  return {
    ...(metadata ?? {}),
    pendingEffectsByKind: countActionsByKind(pendingActions),
  };
}

export function logSleepHints(command: string, actions: EffectAction[]) {
  for (const action of actions) {
    const sleepMs = action.schedulerHints?.sleepUntilEpochMs;
    if (typeof sleepMs !== "number") continue;
    const iso = new Date(sleepMs).toISOString();
    const label = action.label ? ` ${action.label}` : "";
    const pendingInfo =
      typeof action.schedulerHints?.pendingCount === "number"
        ? ` pendingCount=${action.schedulerHints.pendingCount}`
        : "";
    console.error(`[${command}] sleep-until=${iso} effect=${action.effectId}${label}${pendingInfo}`);
  }
}

export function formatResolvedEntrypoint(importPath: string, exportName?: string) {
  return `${importPath}${exportName ? `#${exportName}` : ""}`;
}

export function formatVerboseValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function allowSecretLogs(parsed: ParsedArgs): boolean {
  if (!parsed.json || !parsed.verbose) {
    return false;
  }
  const raw = process.env.BABYSITTER_ALLOW_SECRET_LOGS;
  if (!raw) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

export function logVerbose(command: string, parsed: ParsedArgs, details: Record<string, unknown>) {
  if (!parsed.verbose) return;
  const formatted = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatVerboseValue(value)}`)
    .join(" ");
  console.error(`[${command}] verbose ${formatted}`);
}

export function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function toRunRelativePosix(runDir: string, absolutePath?: string): string | undefined {
  if (!absolutePath) return undefined;
  return path.relative(runDir, absolutePath).replace(/\\/g, "/");
}

export function normalizeArtifactRef(runDir: string, ref?: string | null): string | null {
  const absolute = resolveArtifactAbsolutePath(runDir, ref);
  if (!absolute) return null;
  const relative = toRunRelativePosix(runDir, absolute);
  return relative ?? null;
}

export function resolveArtifactAbsolutePath(runDir: string, ref?: string | null): string | null {
  if (!ref) return null;
  const normalized = ref.trim();
  if (!normalized) return null;
  const absoluteRunDir = path.resolve(runDir);
  if (path.isAbsolute(normalized) || /^[A-Za-z]:[\\/]/.test(normalized)) {
    return path.normalize(normalized);
  }

  const candidates = collectArtifactCandidates(absoluteRunDir, normalized);
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (a.outsideRun !== b.outsideRun) return a.outsideRun ? 1 : -1;
      return a.relative.length - b.relative.length;
    });
    return candidates[0].absolute;
  }

  return collapseDoubledA5cRuns(path.join(absoluteRunDir, normalized));
}

function collectArtifactCandidates(runDir: string, ref: string): ArtifactCandidate[] {
  const seen = new Map<string, ArtifactCandidate>();
  const pushCandidate = (absolute: string) => {
    const normalizedAbs = path.normalize(absolute);
    const relative = path.relative(runDir, normalizedAbs).replace(/\\/g, "/");
    seen.set(normalizedAbs, {
      absolute: normalizedAbs,
      relative,
      outsideRun: relative.startsWith(".."),
    });
  };

  pushCandidate(collapseDoubledA5cRuns(path.join(runDir, ref)));
  pushCandidate(path.resolve(ref));
  return Array.from(seen.values());
}

export function defaultResultRef(effectId: string): string {
  return `tasks/${effectId}/result.json`;
}

export function formatEntrypointSpecifier(entrypoint: { importPath: string; exportName?: string }): string {
  return entrypoint.exportName ? `${entrypoint.importPath}#${entrypoint.exportName}` : entrypoint.importPath;
}

export function parseEntrypointSpecifier(specifier: string): { importPath: string; exportName?: string } {
  if (!specifier) {
    throw new Error("Entrypoint must be provided as <path>#<export>");
  }
  const hashIndex = specifier.lastIndexOf("#");
  if (hashIndex === 0) {
    throw new Error("Entrypoint must include a module path before '#'");
  }
  if (hashIndex === -1) {
    return { importPath: specifier };
  }
  const importPath = specifier.slice(0, hashIndex);
  if (!importPath) {
    throw new Error("Entrypoint must include a module path before '#'");
  }
  const exportName = specifier.slice(hashIndex + 1) || undefined;
  return { importPath, exportName };
}

function listModuleExports(mod: ModuleExports): string {
  const keys = Object.keys(mod);
  return keys.length > 0 ? keys.join(", ") : "(none)";
}

function resolveSelfSdkPackageDir(): string {
  let currentDir = __dirname;
  let reachedRoot = false;
  while (!reachedRoot) {
    const packageJsonPath = path.join(currentDir, "package.json");
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: string };
      if (pkg.name === "@a5c-ai/babysitter-sdk") {
        return currentDir;
      }
    } catch {
      // Keep walking upward.
    }
    const parentDir = path.dirname(currentDir);
    reachedRoot = parentDir === currentDir;
    if (!reachedRoot) {
      currentDir = parentDir;
    }
  }
  throw new Error("Unable to resolve the current @a5c-ai/babysitter-sdk package root");
}

function defaultResolveSdkPackageDir(): string {
  try {
    return path.dirname(require.resolve(SDK_PACKAGE_SPECIFIER));
  } catch {
    return resolveSelfSdkPackageDir();
  }
}

export async function ensureProcessLocalSdkDependency(
  importPath: string,
  options: LocalSdkDependencyOptions = {},
): Promise<void> {
  const resolvedPath = path.isAbsolute(importPath) ? importPath : resolveInputPath(importPath);
  const processDir = path.dirname(resolvedPath);
  const processRequire = (options.createRequireFn ?? createRequire)(path.join(processDir, "__babysitter_process__.cjs"));
  try {
    processRequire.resolve(SDK_PACKAGE_SPECIFIER);
    return;
  } catch {
    // Fall through to a local fallback dependency.
  }

  const fsImpl = options.fsImpl ?? fs;
  const targetSdkDir = path.join(processDir, "node_modules", "@a5c-ai", "babysitter-sdk");
  try {
    await fsImpl.access(targetSdkDir);
    return;
  } catch {
    // Create below.
  }

  await fsImpl.mkdir(path.dirname(targetSdkDir), { recursive: true });
  try {
    await fsImpl.symlink(
      (options.resolveSdkPackageDir ?? defaultResolveSdkPackageDir)(),
      targetSdkDir,
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code !== "EEXIST") {
      throw error;
    }
  }
}

export async function validateProcessEntrypoint(
  importPath: string,
  exportName?: string,
  options: LocalSdkDependencyOptions = {},
): Promise<void> {
  const resolvedPath = path.isAbsolute(importPath) ? importPath : resolveInputPath(importPath);
  try {
    await fs.access(resolvedPath);
  } catch (error) {
    throw new Error(
      `Process entry file not found: ${resolvedPath}. ` +
      `Ensure the path is correct and points to a valid JS/TS module.`
    );
  }

  try {
    await ensureProcessLocalSdkDependency(resolvedPath, options);
  } catch (error) {
    throw new Error(
      `Failed to prepare project-local SDK dependency for ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const moduleUrl = pathToFileURL(resolvedPath).href;
  let mod: ModuleExports;
  try {
    mod = await dynamicImportModule(moduleUrl);
  } catch {
    // ESM import may fail on some Node/CJS configurations.
    // Retry with require() after clearing the cache.
    try {
      delete require.cache[require.resolve(resolvedPath)];
    } catch { /* not cached */ }
    try {
      mod = require(resolvedPath) as ModuleExports;
    } catch (error) {
      throw new Error(
        `Failed to load process module at ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const resolvedExportName = exportName ?? "process";
  const candidate = (resolvedExportName && mod[resolvedExportName]) ?? mod.process ?? mod.default;
  if (typeof candidate === "function") {
    return;
  }

  const available = listModuleExports(mod);
  if (resolvedExportName && !(resolvedExportName in mod) && mod.default) {
    throw new Error(
      `Process module ${resolvedPath} does not export '${resolvedExportName}'. ` +
        `Available exports: ${available}. ` +
        `If you intended a default export, pass --entry ${importPath}#default.`
    );
  }
  throw new Error(
    `Process module ${resolvedPath} does not export a valid process function. ` +
      `Expected '${resolvedExportName}' (function) or default export. ` +
      `Available exports: ${available}.`
  );
}

export async function readInputsFile(filePath: string): Promise<unknown> {
  const absolute = resolveInputPath(filePath);
  let contents: string;
  try {
    contents = await fs.readFile(absolute, "utf8");
  } catch (error) {
    throw new Error(`Failed to read inputs file ${absolute}: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    return JSON.parse(contents) as unknown;
  } catch (error) {
    throw new Error(
      `Failed to parse inputs file ${absolute} as JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function readStdinUtf8(): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

export function resolveCommandRunDir(parsed: ParsedArgs): string {
  return resolveRunDir(parsed.runsDir, parsed.runDirArg);
}

export type { StateCacheSnapshot };
