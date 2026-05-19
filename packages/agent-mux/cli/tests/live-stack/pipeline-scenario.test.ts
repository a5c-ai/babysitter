import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { executeChildProcessCommand, executePtyCommand, runPrimaryLiveStackScenario } from './primary-live-runner';
import { liveStackScenarioFromEnv } from './scenario-contract';

describe('pipeline-owned live stack scenario execution', () => {
  it('executes the scenario selected by the Publish workflow when live execution is required', async () => {
    const scenario = liveStackScenarioFromEnv(process.env);
    const requireLiveEvidence = process.env['LIVE_STACK_REQUIRE_EVIDENCE'] === '1';
    const artifactsDir = process.env['LIVE_STACK_ARTIFACTS_DIR'] ?? path.join('artifacts', 'live-stack');

    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir,
      env: process.env,
      executeLiveProvider: process.env['LIVE_STACK_RUN_MODEL_TESTS'] === '1',
      requireRunnable: requireLiveEvidence,
      executeCommand: process.env['LIVE_STACK_INTERACTIVE'] === 'true' && !process.stdin.isTTY
        ? executePtyCommand
        : executeChildProcessCommand,
      timeoutMs: Number(process.env['LIVE_STACK_COMMAND_TIMEOUT_MS'] ?? 10 * 60 * 1000),
    });

    if (!requireLiveEvidence) {
      expect(scenario.scenarioId).toBeTruthy();
      expect(scenario.layers.length).toBeGreaterThan(0);
      expect(scenario.expectedArtifacts.length).toBeGreaterThan(0);
      expect(result.commands.length).toBe(scenario.agent.setupCommands.length || (scenario.agent.integrationType === 'runtime-cli' ? 1 : 2));
      return;
    }

    // Print verification report for vitest output
    if (result.verifications?.length) {
      console.log('\n┌─────────────────────────────────────────────────');
      console.log(`│ Verification Report: ${scenario.scenarioId}`);
      console.log('├─────────────────────────────────────────────────');
      for (const v of result.verifications) {
        const icon = v.status === 'passed' ? '✓' : v.status === 'failed' ? '✗' : '⊘';
        console.log(`│ ${icon} ${v.name}: ${v.detail ?? ''}`);
      }
      console.log('└─────────────────────────────────────────────────\n');
    }

    expect(result.status, result.failure ?? result.skipReason).toBe('passed');
    expect(result.missingTraceIds).toEqual([]);
    expect(result.missingArtifacts ?? []).toEqual([]);
    expect(result.artifactPath).toBeDefined();

    // Verify the artifact file exists and contains real output
    const fs = await import('node:fs/promises');
    const artifactContent = await fs.readFile(result.artifactPath!, 'utf8');
    const artifact = JSON.parse(artifactContent);
    expect(artifact.status).toBe('passed');
  }, Number(process.env['LIVE_STACK_TEST_TIMEOUT_MS'] ?? 11 * 60 * 1000));

  it('keeps local non-live runs cheap and explicit', async () => {
    if (process.env['LIVE_STACK_REQUIRE_EVIDENCE'] === '1') return;

    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir: path.join(os.tmpdir(), 'live-stack-pipeline-contract'),
      env: {},
      executeCommand: async () => {
        throw new Error('local contract mode must not execute external commands');
      },
    });

    expect(result.status).toBe('skipped');
    expect(result.commands.length).toBe(7);
  });
});
