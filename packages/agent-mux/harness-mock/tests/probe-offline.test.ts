import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { probeHarness, probeAllHarnesses, compareProfiles, PROBE_CONFIGS } from '../src/probe.js';
import type { ProbeConfig } from '../src/probe.js';
import type { HarnessBehaviorProfile } from '../src/types.js';

const FIXTURE_PATH = fileURLToPath(new URL('./fixtures/probes/baseline-profiles.json', import.meta.url));

function loadFixtures(): Record<string, HarnessBehaviorProfile> {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8')) as Record<string, HarnessBehaviorProfile>;
}

function createNodeProbeConfig(): ProbeConfig {
  return {
    harness: 'codex',
    executionType: 'subprocess',
    command: process.execPath,
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'ci-or-local',
    timeoutMs: 5000,
    stdinSignals: ['Proceed? (y/N)'],
    fileOperationPatterns: ['modify'],
    environmentVariables: ['OPENAI_API_KEY'],
    outputFormatTraits: ['session-envelopes', 'error-events'],
    probeNotes: ['node-based offline probe used only for CI-safe unit tests'],
    scenarios: [
      {
        name: 'success',
        args: ['-e', "console.log(JSON.stringify({type:'session_start',sessionId:'s1'})); console.log(JSON.stringify({type:'message_stop'}));"],
      },
      {
        name: 'stdin-prompt',
        args: ['-e', "process.stdout.write('Proceed? (y/N)\\n'); process.stdin.setEncoding('utf8'); process.stdin.once('data', (data) => { process.stdout.write(JSON.stringify({type:'stdin', value:data.trim()}) + '\\n'); process.exit(0); });"],
        stdin: 'y\n',
      },
      {
        name: 'error',
        args: ['-e', "process.stderr.write(JSON.stringify({type:'error', message:'boom'}) + '\\n'); process.exit(7);"],
      },
    ],
  };
}

describe('HarnessProbe (offline)', () => {
  it('returns a failure result when the probed command does not exist', async () => {
    const config: ProbeConfig = {
      harness: 'claude-code',
      command: 'this-command-does-not-exist-12345',
      versionArgs: ['--version'],
      timeoutMs: 5000,
    };
    const result = await probeHarness(config);
    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.exitCode).toBeDefined();
  });

  it('returns a rich profile when probing a real cross-platform command', async () => {
    const result = await probeHarness(createNodeProbeConfig());
    expect(result.success).toBe(true);
    expect(result.profile).toBeTruthy();
    expect(result.profile?.version).toMatch(/\d+\.\d+\.\d+/);
    expect(result.profile?.executionType).toBe('subprocess');
    expect(result.profile?.exitCodes).toMatchObject({
      version: 0,
      help: 0,
      success: 0,
      'stdin-prompt': 0,
      error: 7,
    });
    expect(result.profile?.supportsStdin).toBe(true);
    expect(result.profile?.stdinSignals).toContain('Proceed? (y/N)');
    expect(result.profile?.outputFormat).toBe('jsonl');
    expect(result.profile?.outputFormatTraits).toEqual(expect.arrayContaining(['jsonl', 'session-envelopes', 'error-events']));
  });

  it('materializes offline-only contract probes without executing a harness binary', async () => {
    const result = await probeHarness({
      harness: 'codex-sdk',
      executionType: 'sdk',
      command: 'this-command-should-never-run',
      availability: 'offline-only',
      outputFormat: 'sdk-events',
      outputFormatTraits: ['sdk', 'json-events'],
      stdinSignals: ['OPENAI_API_KEY'],
      environmentVariables: ['OPENAI_API_KEY'],
      fileOperationPatterns: ['write_file'],
      cliPatterns: {
        command: 'node',
        module: 'openai',
      },
      probeNotes: ['fixture-backed SDK contract'],
      contractVersion: 'manual-capture',
      contractStartupTimeMs: 321,
      contractExitCodes: {
        load: 0,
        'auth-missing': 1,
      },
    });

    expect(result.success).toBe(true);
    expect(result.profile?.executionType).toBe('sdk');
    expect(result.profile?.version).toBe('manual-capture');
    expect(result.profile?.startupTimeMs).toBe(321);
    expect(result.profile?.exitCodes).toEqual({ load: 0, 'auth-missing': 1 });
    expect(result.scenarioResults).toEqual({});
  });

  it('probeAllHarnesses writes result files and profile files', async () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amux-probe-'));
    const configs: Record<string, ProbeConfig> = {
      'node-probe': createNodeProbeConfig(),
      'missing-one': {
        harness: 'claude-code',
        command: 'absolutely-not-a-real-binary-xyz',
        versionArgs: ['--version'],
        timeoutMs: 2000,
      },
    };
    const results = await probeAllHarnesses(outDir, configs);
    expect(results.size).toBe(2);
    expect(results.get('node-probe')?.success).toBe(true);
    expect(results.get('missing-one')?.success).toBe(false);
    expect(fs.existsSync(path.join(outDir, 'node-probe.profile.json'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'missing-one.result.json'))).toBe(true);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('fixture baselines cover every built-in probe target', () => {
    const fixtures = loadFixtures();
    expect(Object.keys(fixtures).sort()).toEqual(Object.keys(PROBE_CONFIGS).sort());
    for (const [key, profile] of Object.entries(fixtures)) {
      const config = PROBE_CONFIGS[key];
      expect(config).toBeDefined();
      expect(profile.harness).toBe(config?.harness);
      expect(profile.executionType).toBe(config?.executionType ?? 'subprocess');
      expect(profile.availability).toBe(config?.availability ?? 'local-manual');
      expect(profile.cliPatterns.command).toBeTruthy();
      expect(profile.outputFormatTraits.length).toBeGreaterThan(0);
      expect(profile.probeNotes.length).toBeGreaterThan(0);
    }
    expect(fixtures['claude-agent-sdk']?.availability).toBe('offline-only');
    expect(fixtures['codex-sdk']?.executionType).toBe('sdk');
    expect(fixtures['pi-sdk']?.executionType).toBe('sdk');
  });

  it('compareProfiles detects breaking outputFormat changes', () => {
    const baseline: HarnessBehaviorProfile = {
      harness: 'claude-code',
      executionType: 'subprocess',
      version: '1.0.0',
      capturedAt: new Date().toISOString(),
      startupTimeMs: 100,
      outputFormat: 'jsonl',
      outputFormatTraits: ['jsonl'],
      supportsStdin: true,
      stdinSignals: ['(y/N)'],
      fileOperationPatterns: [],
      exitCodes: {},
      environmentVariables: [],
      cliPatterns: {},
      availability: 'local-manual',
      probeNotes: [],
    };
    const current: HarnessBehaviorProfile = { ...baseline, outputFormat: 'text' };
    const diffs = compareProfiles(baseline, current);
    expect(diffs.some((d) => d.field === 'outputFormat' && d.severity === 'breaking')).toBe(true);
  });
});
