import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { compile } from '../compiler.js';
import {
  executeBoundedShell,
  OmpDeterministicDriver,
} from '../../../../../plugins/babysitter-unified/per-harness/omp/extensions-driver.js';

const UNIFIED_PLUGIN_DIR = path.resolve(__dirname, '../../../../../plugins/babysitter-unified');
const tempDirs: string[] = [];

interface Action {
  effectId: string;
  invocationKey: string;
  kind: string;
  taskDef: Record<string, unknown>;
}

async function tempRun(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
}

function waiting(action: Action): string {
  return JSON.stringify({ status: 'waiting', nextActions: [action] });
}

function action(kind: string, taskDef: Record<string, unknown> = {}): Action {
  return { effectId: `effect-${kind}`, invocationKey: `invocation-${kind}`, kind, taskDef };
}

async function recordCommittedResult(runDir: string, effect: Action, value: unknown): Promise<void> {
  await writeJson(path.join(runDir, 'tasks', effect.effectId, 'result.json'), {
    effectId: effect.effectId,
    invocationKey: effect.invocationKey,
    status: 'ok',
    result: value,
    value,
  });
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('OMP deterministic driver regressions (#1578, #1579)', () => {
  it('ships the driver and blocking bridge agent in the generated OMP package', async () => {
    const output = await tempRun('omp-driver-package-');
    const result = compile({ source: UNIFIED_PLUGIN_DIR, target: 'oh-my-pi', output });

    expect(result.status, result.diagnostics.map((diagnostic) => diagnostic.message).join('\n')).not.toBe('error');
    await expect(fs.readFile(path.join(result.outputDir, 'extensions', 'driver.ts'), 'utf8')).resolves.toContain(
      'class OmpDeterministicDriver',
    );
    await expect(fs.readFile(path.join(result.outputDir, 'agents', 'babysitter-task.md'), 'utf8')).resolves.toContain(
      'blocking: true',
    );
    const manifest = JSON.parse(await fs.readFile(path.join(result.outputDir, 'package.json'), 'utf8'));
    expect(manifest.files).toContain('agents/');
  });

  it('reuses a durable completed shell output without rerunning it and continues automatically', async () => {
    const runDir = await tempRun('omp-shell-recovery-');
    const effect = action('shell', { shell: { command: 'must-not-run' } });
    const taskDir = path.join(runDir, 'tasks', effect.effectId);
    await writeJson(path.join(taskDir, 'execution.json'), {
      schemaVersion: '2026.07.omp-driver-v1',
      effectId: effect.effectId,
      invocationKey: effect.invocationKey,
      kind: 'shell',
      state: 'completed',
      startedAt: '2026-07-23T00:00:00.000Z',
      finishedAt: '2026-07-23T00:00:01.000Z',
      outputRef: `tasks/${effect.effectId}/output.json`,
    });
    await writeJson(path.join(taskDir, 'output.json'), 'durable output');
    await recordCommittedResult(runDir, effect, 'durable output');

    let iterations = 0;
    let posts = 0;
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      executeShell: async () => { throw new Error('shell was rerun'); },
      runCli: async (args) => {
        if (args[0] === 'run:iterate') {
          iterations += 1;
          return { code: 0, stdout: iterations === 1 ? waiting(effect) : JSON.stringify({ status: 'completed' }), stderr: '' };
        }
        if (args[0] === 'task:show') {
          return { code: 0, stdout: JSON.stringify({ effect: { status: 'resolved_ok' } }), stderr: '' };
        }
        posts += 1;
        return { code: 0, stdout: '{}', stderr: '' };
      },
    });

    await expect(driver.drive(runDir)).resolves.toEqual({ state: 'completed', completionProof: undefined });
    expect(iterations).toBe(2);
    expect(posts).toBe(0);
  });

  it('posts a matching orphaned result artifact when the journal still owns a requested effect', async () => {
    const runDir = await tempRun('omp-shell-orphaned-result-');
    const effect = action('shell');
    const taskDir = path.join(runDir, 'tasks', effect.effectId);
    await writeJson(path.join(taskDir, 'execution.json'), {
      schemaVersion: '2026.07.omp-driver-v1',
      effectId: effect.effectId,
      invocationKey: effect.invocationKey,
      kind: 'shell',
      state: 'completed',
      startedAt: '2026-07-23T00:00:00.000Z',
      finishedAt: '2026-07-23T00:00:01.000Z',
      outputRef: `tasks/${effect.effectId}/output.json`,
    });
    await writeJson(path.join(taskDir, 'output.json'), { exitCode: 0 });
    await recordCommittedResult(runDir, effect, { exitCode: 0 });

    let iterations = 0;
    let posts = 0;
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      executeShell: async () => { throw new Error('shell was rerun'); },
      runCli: async (args) => {
        if (args[0] === 'run:iterate') {
          iterations += 1;
          return { code: 0, stdout: iterations === 1 ? waiting(effect) : JSON.stringify({ status: 'completed' }), stderr: '' };
        }
        if (args[0] === 'task:show') {
          return { code: 0, stdout: JSON.stringify({ effect: { status: 'requested' } }), stderr: '' };
        }
        posts += 1;
        return { code: 0, stdout: '{}', stderr: '' };
      },
    });

    await expect(driver.drive(runDir)).resolves.toMatchObject({ state: 'completed' });
    expect(posts).toBe(1);
  });

  it('fails closed for an ambiguous started shell checkpoint', async () => {
    const runDir = await tempRun('omp-shell-ambiguous-');
    const effect = action('shell');
    await writeJson(path.join(runDir, 'tasks', effect.effectId, 'execution.json'), {
      schemaVersion: '2026.07.omp-driver-v1',
      effectId: effect.effectId,
      invocationKey: effect.invocationKey,
      kind: 'shell',
      state: 'in_progress',
      startedAt: '2026-07-23T00:00:00.000Z',
    });
    await writeJson(path.join(runDir, 'tasks', effect.effectId, 'output.json'), 'unverified partial output');
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      executeShell: async () => { throw new Error('shell was rerun'); },
      runCli: async () => ({ code: 0, stdout: waiting(effect), stderr: '' }),
    });

    await expect(driver.drive(runDir)).rejects.toThrow('refusing to rerun');
  });

  it('routes the exact per-effect model selector, including its reasoning suffix', async () => {
    const runDir = await tempRun('omp-agent-model-');
    const effect = action('agent', {
      execution: { model: 'openai-codex/gpt-5.6-sol:high' },
      agent: { prompt: 'Review the change' },
    });
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      randomId: () => 'dispatch-token',
      runCli: async () => ({ code: 0, stdout: waiting(effect), stderr: '' }),
    });

    const dispatch = await driver.drive(runDir);
    expect(dispatch.state).toBe('agent');
    if (dispatch.state !== 'agent') throw new Error('expected agent dispatch');
    expect(dispatch.task.tasks).toHaveLength(1);
    expect(dispatch.task.tasks[0]).toMatchObject({
      agent: 'babysitter-task',
      model: 'openai-codex/gpt-5.6-sol:high',
    });

    await expect(driver.drive(runDir)).resolves.toEqual(dispatch);
  });

  it('renders the complete SDK structured AgentPrompt deterministically', async () => {
    const runDir = await tempRun('omp-agent-structured-prompt-');
    const effect = action('agent', {
      title: 'fallback title must not replace prompt',
      agent: {
        prompt: {
          role: 'senior reviewer',
          task: 'inspect runtime',
          instructions: ['trace ownership', 'report blockers'],
          context: { paths: ['src/runtime.ts'], attempt: 2 },
        },
      },
    });
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      randomId: () => 'dispatch-token',
      runCli: async () => ({ code: 0, stdout: waiting(effect), stderr: '' }),
    });

    const dispatch = await driver.drive(runDir);
    expect(dispatch.state).toBe('agent');
    if (dispatch.state !== 'agent') throw new Error('expected agent dispatch');
    const prompt = dispatch.task.tasks[0].task;
    expect(prompt).toContain('"role": "senior reviewer"');
    expect(prompt).toContain('"task": "inspect runtime"');
    expect(prompt).toContain('"instructions": [');
    expect(prompt).toContain('"trace ownership"');
    expect(prompt).toContain('"context": {');
    expect(prompt).toContain('"paths": [');
    expect(prompt).not.toContain('fallback title must not replace prompt');
    expect(prompt.indexOf('"context"')).toBeLessThan(prompt.indexOf('"instructions"'));
    expect(prompt.indexOf('"instructions"')).toBeLessThan(prompt.indexOf('"role"'));
    expect(prompt.indexOf('"role"')).toBeLessThan(prompt.indexOf('"task"'));
  });

  it('enforces a hard timeout for a TERM-ignoring process', async () => {
    // Platform integration: fake timers cannot prove that a real OS process group is force-killed.
    const effect = action('shell', {
      shell: {
        command: process.execPath,
        args: [
          '-e',
          'process.on("SIGTERM", () => process.stderr.write("ignored-term\\n")); setInterval(() => {}, 1000)',
        ],
        timeoutMs: 100,
      },
    });
    const startedAt = Date.now();

    const result = await executeBoundedShell(effect, process.cwd());

    expect(result).toMatchObject({ timedOut: true, exitCode: 124 });
    expect(Date.now() - startedAt).toBeLessThan(1_500);
  });

  it('retains the interrupted blocking agent owner and refuses a duplicate dispatch or writer', async () => {
    const runDir = await tempRun('omp-agent-owner-');
    const effect = action('agent', { agent: { prompt: 'Slow review' } });
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      randomId: () => 'dispatch-token',
      runCli: async () => ({ code: 0, stdout: waiting(effect), stderr: '' }),
    });

    const dispatch = await driver.drive(runDir);
    expect(dispatch.state).toBe('agent');
    if (dispatch.state !== 'agent') throw new Error('expected agent dispatch');
    const input = dispatch.task as unknown as Record<string, unknown>;
    await expect(driver.claimAgentToolCall(input, 'owner-call')).resolves.toEqual({ handled: true });
    await expect(driver.claimAgentToolCall(input, 'duplicate-call')).resolves.toMatchObject({
      handled: true,
      block: true,
      reason: expect.stringContaining('owner-call'),
    });

    await expect(driver.drive(runDir)).resolves.toMatchObject({
      state: 'waiting',
      reason: expect.stringContaining('owner-call'),
    });
    await expect(driver.completeAgentToolCall({
      toolCallId: 'duplicate-call',
      input,
      details: { results: [{ exitCode: 0, output: '{"approved":false}' }] },
      isError: false,
    })).resolves.toMatchObject({ handled: true, reason: expect.stringContaining('non-owner') });
  });

  it('accepts a durable late result only from the retained owner after its parent wait is interrupted', async () => {
    const runDir = await tempRun('omp-agent-late-owner-result-');
    const effect = action('agent', {
      agent: { prompt: 'Slow review' },
      outputSchema: {
        type: 'object',
        required: ['approved'],
        properties: { approved: { type: 'boolean' } },
      },
    });
    let iterations = 0;
    let posts = 0;
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      randomId: () => 'dispatch-token',
      runCli: async (args) => {
        if (args[0] === 'run:iterate') {
          iterations += 1;
          return {
            code: 0,
            stdout: iterations === 1 ? waiting(effect) : JSON.stringify({ status: 'completed' }),
            stderr: '',
          };
        }
        if (args[0] === 'task:show') {
          return { code: 0, stdout: JSON.stringify({ effect: { status: 'requested' } }), stderr: '' };
        }
        posts += 1;
        await recordCommittedResult(runDir, effect, { approved: true });
        return { code: 0, stdout: '{}', stderr: '' };
      },
    });

    const dispatch = await driver.drive(runDir);
    expect(dispatch.state).toBe('agent');
    if (dispatch.state !== 'agent') throw new Error('expected agent dispatch');
    const input = dispatch.task as unknown as Record<string, unknown>;
    await expect(driver.claimAgentToolCall(input, 'owner-call')).resolves.toEqual({ handled: true });
    await expect(driver.claimAgentToolCall(input, 'duplicate-call')).resolves.toMatchObject({ block: true });
    await expect(driver.completeAgentToolCall({
      toolCallId: 'owner-call',
      input,
      details: { results: [{ aborted: true, error: 'parent wait interrupted' }] },
      isError: true,
    })).resolves.toMatchObject({ handled: true, reason: expect.stringContaining('remains unresolved') });

    const taskPrompt = dispatch.task.tasks[0].task;
    const descriptor = JSON.parse(taskPrompt.split('\n', 1)[0].slice('BABYSITTER_OMP_BRIDGE '.length));
    await expect(driver.completeAgentOwnerValue({
      ...descriptor,
      value: { approved: 'not-boolean' },
    })).rejects.toThrow('output schema validation');
    const completion = await driver.completeAgentOwnerValue({
      ...descriptor,
      value: { approved: true },
    });

    expect(completion).toMatchObject({ handled: true, posted: true, continuation: { state: 'completed' } });
    expect(posts).toBe(1);
    expect(iterations).toBe(2);
    await expect(driver.drive(runDir)).resolves.toMatchObject({ state: 'completed' });
    await expect(fs.readFile(path.join(runDir, 'tasks', effect.effectId, 'output.json'), 'utf8')).resolves.toContain(
      '"approved": true',
    );
  });

  it('posts one immutable owner result and automatically continues the run', async () => {
    const runDir = await tempRun('omp-agent-result-');
    const effect = action('agent', {
      agent: { prompt: 'Review the change' },
      outputSchema: { type: 'object', required: ['approved'], properties: { approved: { type: 'boolean' } } },
    });
    let iterations = 0;
    let posts = 0;
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      randomId: () => 'dispatch-token',
      runCli: async (args) => {
        if (args[0] === 'run:iterate') {
          iterations += 1;
          return {
            code: 0,
            stdout: iterations === 1 ? waiting(effect) : JSON.stringify({ status: 'completed' }),
            stderr: '',
          };
        }
        posts += 1;
        await recordCommittedResult(runDir, effect, { approved: true });
        return { code: 0, stdout: '{}', stderr: '' };
      },
    });

    const dispatch = await driver.drive(runDir);
    expect(dispatch.state).toBe('agent');
    if (dispatch.state !== 'agent') throw new Error('expected agent dispatch');
    const input = dispatch.task as unknown as Record<string, unknown>;
    await driver.claimAgentToolCall(input, 'owner-call');

    const completion = await driver.completeAgentToolCall({
      toolCallId: 'owner-call',
      input,
      details: { results: [{ exitCode: 0, output: '{"approved":true}' }] },
      isError: false,
    });
    expect(completion).toMatchObject({ handled: true, posted: true, continuation: { state: 'completed' } });
    expect(posts).toBe(1);
    expect(iterations).toBe(2);
    const outputPath = path.join(runDir, 'tasks', effect.effectId, 'output.json');
    await expect(fs.readFile(outputPath, 'utf8')).resolves.toContain('"approved": true');

    await expect(driver.completeAgentToolCall({
      toolCallId: 'owner-call',
      input,
      details: { results: [{ exitCode: 0, output: '{"approved":false}' }] },
      isError: false,
    })).rejects.toThrow('Refusing to overwrite immutable result artifact');
    expect(posts).toBe(1);
    await expect(fs.readFile(outputPath, 'utf8')).resolves.toContain('"approved": true');
  });

  it('fails closed when an existing committed result disagrees with durable output', async () => {
    const runDir = await tempRun('omp-result-conflict-');
    const effect = action('shell');
    const taskDir = path.join(runDir, 'tasks', effect.effectId);
    await writeJson(path.join(taskDir, 'execution.json'), {
      schemaVersion: '2026.07.omp-driver-v1',
      effectId: effect.effectId,
      invocationKey: effect.invocationKey,
      kind: 'shell',
      state: 'completed',
      startedAt: '2026-07-23T00:00:00.000Z',
      finishedAt: '2026-07-23T00:00:01.000Z',
      outputRef: `tasks/${effect.effectId}/output.json`,
    });
    await writeJson(path.join(taskDir, 'output.json'), { approved: true });
    await recordCommittedResult(runDir, effect, { approved: false });
    const driver = new OmpDeterministicDriver({
      cwd: runDir,
      executeShell: async () => { throw new Error('shell was rerun'); },
      runCli: async () => ({ code: 0, stdout: waiting(effect), stderr: '' }),
    });

    await expect(driver.drive(runDir)).rejects.toThrow('conflicts with immutable durable output');
  });
});
