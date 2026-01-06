import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const O_INSTALLER_URL = 'https://raw.githubusercontent.com/a5c-ai/o/main/install.sh';

export type OInstallOptions = {
  force: boolean;
  noGitignore: boolean;
};

export type WindowsInstallerRuntime = { kind: 'wsl' } | { kind: 'git-bash'; bashPath: string };

export type RunOInstallerParams = {
  workspaceRoot: string;
  options: OInstallOptions;
  platform: NodeJS.Platform;
  windowsRuntime?: WindowsInstallerRuntime;
  onOutput?: (line: string) => void;
};

type SpawnResult = { exitCode: number; stdout: string; stderr: string };

function shSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function spawnCollect(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; onChunk?: (chunk: string) => void },
): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    const onStdout = (chunk: string): void => {
      stdout += chunk;
      options.onChunk?.(chunk);
    };
    const onStderr = (chunk: string): void => {
      stderr += chunk;
      options.onChunk?.(chunk);
    };

    child.stdout.on('data', onStdout);
    child.stderr.on('data', onStderr);

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });
  });
}

export async function isWslAvailable(): Promise<boolean> {
  try {
    const res = await spawnCollect('wsl.exe', ['--help'], {});
    return res.exitCode === 0;
  } catch {
    return false;
  }
}

export function findGitBashCandidates(): string[] {
  const programFiles = process.env['ProgramFiles'] ?? 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
  return [
    path.join(programFiles, 'Git', 'bin', 'bash.exe'),
    path.join(programFiles, 'Git', 'usr', 'bin', 'bash.exe'),
    path.join(programFilesX86, 'Git', 'bin', 'bash.exe'),
    path.join(programFilesX86, 'Git', 'usr', 'bin', 'bash.exe'),
  ].filter((candidate, idx, list) => list.indexOf(candidate) === idx);
}

export function firstExistingPath(candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return undefined;
}

export async function windowsPathToWslPath(windowsPath: string): Promise<string> {
  const res = await spawnCollect('wsl.exe', ['-e', 'wslpath', '-a', '-u', windowsPath], {});
  if (res.exitCode !== 0) {
    const detail = (res.stderr || res.stdout).trim();
    throw new Error(detail ? `wslpath failed: ${detail}` : 'wslpath failed');
  }
  const mapped = res.stdout.trim();
  if (!mapped) throw new Error('wslpath returned an empty path.');
  return mapped;
}

function buildInstallerScript(params: {
  targetPathExpression: string;
  options: OInstallOptions;
}): string {
  const flags: string[] = [];
  if (params.options.force) flags.push('--force');
  if (params.options.noGitignore) flags.push('--no-gitignore');

  const flagsPart = flags.length ? ` ${flags.map((f) => shSingleQuote(f)).join(' ')}` : '';

  return [
    'set -euo pipefail',
    `curl -fsSL ${shSingleQuote(O_INSTALLER_URL)} | bash -s -- --to ${params.targetPathExpression}${flagsPart}`,
  ].join('; ');
}

export async function runOInstaller(params: RunOInstallerParams): Promise<void> {
  const onOutput = params.onOutput ?? (() => undefined);
  onOutput(`Downloading and running installer: ${O_INSTALLER_URL}`);

  if (params.platform === 'win32') {
    if (!params.windowsRuntime) {
      throw new Error('Windows requires a configured installer runtime (WSL or Git Bash).');
    }

    if (params.windowsRuntime.kind === 'wsl') {
      const wslPath = await windowsPathToWslPath(params.workspaceRoot);
      const script = buildInstallerScript({
        targetPathExpression: shSingleQuote(wslPath),
        options: params.options,
      });
      const res = await spawnCollect('wsl.exe', ['-e', 'bash', '-lc', script], {
        onChunk: (chunk) => {
          for (const line of chunk.split(/\r?\n/)) if (line.trim()) onOutput(line);
        },
      });
      if (res.exitCode !== 0) {
        const detail = (res.stderr || res.stdout).trim();
        throw new Error(detail ? `Installer failed (WSL): ${detail}` : 'Installer failed (WSL).');
      }
      return;
    }

    const bashPath = params.windowsRuntime.bashPath;
    if (!fs.existsSync(bashPath)) {
      throw new Error(`Git Bash not found at: ${bashPath}`);
    }

    const winRootQuoted = shSingleQuote(params.workspaceRoot);
    const script = [
      'set -euo pipefail',
      `TARGET_DIR="$(cygpath -u ${winRootQuoted})"`,
      buildInstallerScript({ targetPathExpression: '"$TARGET_DIR"', options: params.options }),
    ].join('; ');

    const res = await spawnCollect(bashPath, ['-lc', script], {
      cwd: params.workspaceRoot,
      onChunk: (chunk) => {
        for (const line of chunk.split(/\r?\n/)) if (line.trim()) onOutput(line);
      },
    });
    if (res.exitCode !== 0) {
      const detail = (res.stderr || res.stdout).trim();
      throw new Error(
        detail ? `Installer failed (Git Bash): ${detail}` : 'Installer failed (Git Bash).',
      );
    }
    return;
  }

  const script = buildInstallerScript({
    targetPathExpression: shSingleQuote(params.workspaceRoot),
    options: params.options,
  });
  const res = await spawnCollect('bash', ['-lc', script], {
    cwd: params.workspaceRoot,
    onChunk: (chunk) => {
      for (const line of chunk.split(/\r?\n/)) if (line.trim()) onOutput(line);
    },
  });

  if (res.exitCode !== 0) {
    const detail = (res.stderr || res.stdout).trim();
    throw new Error(detail ? `Installer failed: ${detail}` : 'Installer failed.');
  }

  const installedOBinary = path.join(params.workspaceRoot, 'o');
  try {
    await fs.promises.chmod(installedOBinary, 0o755);
  } catch {
    // Best-effort; installer typically sets executable bit.
  }
}
