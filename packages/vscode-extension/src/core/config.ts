import * as fs from 'fs';
import * as path from 'path';

export type BabysitterResolvedSdkBinary = {
  path: string;
  source: 'setting' | 'default';
};

export type BabysitterRawSettings = {
  /**
   * Optional full path to the babysitter SDK CLI executable.
   */
  sdkBinaryPath?: string;
  /**
   * Runs root path. If relative, it is resolved from the workspace root.
   */
  runsRoot?: string;
  /**
   * Breakpoints API URL.
   */
  breakpointsApiUrl?: string;
  /**
   * Enable breakpoints integration.
   */
  breakpointsEnabled?: boolean;
};

export type ConfigIssue = {
  code:
    | 'NO_WORKSPACE'
    | 'SDK_BINARY_NOT_FOUND'
    | 'RUNS_ROOT_NOT_A_DIRECTORY'
    | 'BREAKPOINTS_API_UNAVAILABLE';
  message: string;
  detail?: string;
};

export type BabysitterResolvedConfig = {
  sdkBinary?: BabysitterResolvedSdkBinary;
  runsRoot?: { path: string; source: 'setting' | 'default' };
  breakpointsApiUrl?: string;
  breakpointsEnabled?: boolean;
};

export type ResolveConfigOptions = {
  settings: BabysitterRawSettings;
  workspaceRoot?: string;
  envPath?: string;
  platform?: NodeJS.Platform;
};

export type ResolveConfigResult = {
  config: BabysitterResolvedConfig;
  issues: ConfigIssue[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function resolveRunsRootPath(
  runsRoot: string,
  workspaceRoot: string | undefined,
): string | undefined {
  const trimmed = runsRoot.trim();
  if (!trimmed) return undefined;
  if (path.isAbsolute(trimmed)) return trimmed;
  if (!workspaceRoot) return undefined;
  return path.join(workspaceRoot, trimmed);
}

function validateRunsRootDirectory(runsRootPath: string): ConfigIssue | undefined {
  try {
    const stat = fs.statSync(runsRootPath);
    if (!stat.isDirectory()) {
      return {
        code: 'RUNS_ROOT_NOT_A_DIRECTORY',
        message: 'Runs root exists but is not a directory.',
        detail: runsRootPath,
      };
    }
  } catch {
    // Non-existent is allowed: it will be created by `o` when dispatching runs.
  }
  return undefined;
}

function resolveSdkBinaryPath(
  settings: BabysitterRawSettings,
): BabysitterResolvedSdkBinary | undefined {
  if (isNonEmptyString(settings.sdkBinaryPath)) {
    return { path: settings.sdkBinaryPath.trim(), source: 'setting' };
  }
  // Default: use npx to run @a5c-ai/babysitter-sdk
  return { path: 'npx', source: 'default' };
}

export function resolveBabysitterConfig(options: ResolveConfigOptions): ResolveConfigResult {
  const issues: ConfigIssue[] = [];
  const settings = options.settings;

  // Resolve SDK binary path
  const sdkBinary = resolveSdkBinaryPath(settings);

  const resolvedConfig: BabysitterResolvedConfig = {};

  if (sdkBinary) {
    resolvedConfig.sdkBinary = sdkBinary;
  }
  resolvedConfig.breakpointsApiUrl = settings.breakpointsApiUrl || 'http://localhost:3185';
  resolvedConfig.breakpointsEnabled = settings.breakpointsEnabled !== false;

  // Resolve runs root
  const rawRunsRoot = isNonEmptyString(settings.runsRoot) ? settings.runsRoot.trim() : '.a5c/runs';
  const resolvedRunsRoot = resolveRunsRootPath(rawRunsRoot, options.workspaceRoot);

  if (!resolvedRunsRoot) {
    issues.push({
      code: 'NO_WORKSPACE',
      message: 'A workspace folder is required to resolve relative paths such as the runs root.',
      detail: `runsRoot=${rawRunsRoot}`,
    });
  } else {
    const runsRootIssue = validateRunsRootDirectory(resolvedRunsRoot);
    if (runsRootIssue) issues.push(runsRootIssue);

    const runsRootSource: NonNullable<BabysitterResolvedConfig['runsRoot']>['source'] =
      isNonEmptyString(settings.runsRoot) ? 'setting' : 'default';
    resolvedConfig.runsRoot = { path: resolvedRunsRoot, source: runsRootSource };
  }

  return {
    config: resolvedConfig,
    issues,
  };
}
