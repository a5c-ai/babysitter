import { spawn } from 'child_process';
import * as path from 'path';
import { listRunIds, waitForNewRunId } from './runPolling';

export type DispatchNewRunOptions = {
  sdkBinaryPath?: string;
  workspaceRoot: string;
  runsRootPath: string;
  prompt: string;
  env?: NodeJS.ProcessEnv;
};

export type DispatchNewRunResult = {
  runId: string;
  runRootPath: string;
  stdout: string;
  stderr: string;
};

export type ResumeExistingRunOptions = {
  sdkBinaryPath?: string;
  workspaceRoot: string;
  runsRootPath: string;
  runId: string;
  prompt: string;
  env?: NodeJS.ProcessEnv;
};

export type ResumeExistingRunResult = {
  runId: string;
  runRootPath: string;
  stdout: string;
  stderr: string;
};

type SpawnResult = { exitCode: number; stdout: string; stderr: string };

function spawnCollect(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv },
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

    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });
  });
}

function extractRunIdFromOutput(text: string): string | undefined {
  try {
    const json = JSON.parse(text) as { runId?: string };
    return json.runId || undefined;
  } catch {
    // Try to extract from text output
    const match = text.match(/\brun-\d{8}-\d{6}(?:-[A-Za-z0-9_-]+)?\b/);
    return match?.[0];
  }
}

export async function dispatchNewRunViaSdk(
  options: DispatchNewRunOptions,
): Promise<DispatchNewRunResult> {
  const sdkCommand = options.sdkBinaryPath || 'npx';
  const sdkArgs = options.sdkBinaryPath ? [] : ['-y', '@a5c-ai/babysitter-sdk'];

  // Create a temporary inputs file for the prompt
  const inputsContent = JSON.stringify({ prompt: options.prompt });
  const tempInputsPath = path.join(options.workspaceRoot, '.a5c', 'temp', 'dispatch-inputs.json');

  // Ensure temp directory exists
  const fs = await import('fs');
  await fs.promises.mkdir(path.dirname(tempInputsPath), { recursive: true });
  await fs.promises.writeFile(tempInputsPath, inputsContent, 'utf8');

  const baselineIds = new Set(listRunIds(options.runsRootPath));
  const dispatchStartMs = Date.now();

  try {
    const spawnOptions: { cwd: string; env?: NodeJS.ProcessEnv } = {
      cwd: options.workspaceRoot,
    };
    if (options.env) {
      spawnOptions.env = options.env;
    }

    const result = await spawnCollect(
      sdkCommand,
      [
        ...sdkArgs,
        'run:create',
        '--process-id',
        'dev/task',
        '--entry',
        '.a5c/processes/core/task.js#task',
        '--inputs',
        tempInputsPath,
        '--runs-dir',
        options.runsRootPath,
        '--json',
      ],
      spawnOptions,
    );

    if (result.exitCode !== 0) {
      throw new Error(
        `SDK run:create failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`,
      );
    }

    const runId = extractRunIdFromOutput(result.stdout);
    if (!runId) {
      // Fallback: wait for a new run directory to appear
      const foundRunId = await waitForNewRunId({
        runsRootPath: options.runsRootPath,
        baselineIds,
        timeoutMs: 30_000,
        afterTimeMs: dispatchStartMs,
      });
      if (!foundRunId) {
        throw new Error(
          'Failed to extract run ID from SDK output and no new run directory appeared',
        );
      }
      const runRootPath = path.join(options.runsRootPath, foundRunId);
      return {
        runId: foundRunId,
        runRootPath,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    }

    const runRootPath = path.join(options.runsRootPath, runId);
    return {
      runId,
      runRootPath,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } finally {
    // Clean up temp file
    try {
      const fs = await import('fs');
      await fs.promises.unlink(tempInputsPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

export async function resumeExistingRunViaSdk(
  options: ResumeExistingRunOptions,
): Promise<ResumeExistingRunResult> {
  const sdkCommand = options.sdkBinaryPath || 'npx';
  const sdkArgs = options.sdkBinaryPath ? [] : ['-y', '@a5c-ai/babysitter-sdk'];

  const runRootPath = path.join(options.runsRootPath, options.runId);

  const spawnOptions: { cwd: string; env?: NodeJS.ProcessEnv } = {
    cwd: options.workspaceRoot,
  };
  if (options.env) {
    spawnOptions.env = options.env;
  }

  const result = await spawnCollect(
    sdkCommand,
    [...sdkArgs, 'run:continue', options.runId, '--runs-dir', options.runsRootPath, '--json'],
    spawnOptions,
  );

  if (result.exitCode !== 0) {
    throw new Error(
      `SDK run:continue failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`,
    );
  }

  return {
    runId: options.runId,
    runRootPath,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
