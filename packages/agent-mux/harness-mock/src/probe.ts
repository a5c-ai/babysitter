/**
 * HarnessProbe — probes real harness installations to capture behavior profiles.
 *
 * Used by the CI pipeline to periodically compare mock fidelity against
 * real harness behavior. Runs the actual CLI tools with controlled inputs
 * and records output format, timing, exit codes, etc.
 */

import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type {
  AdapterExecutionType,
  HarnessType,
  HarnessBehaviorProfile,
} from './types.js';

// ---------------------------------------------------------------------------
// Probe configuration
// ---------------------------------------------------------------------------

export interface ProbeConfig {
  /** The harness to probe. */
  harness: HarnessType;

  /** Execution transport for this probe target. */
  executionType?: AdapterExecutionType;

  /** Command to invoke (e.g., 'claude', 'codex'). */
  command: string;

  /** Legacy arguments for a simple success probe run. */
  args?: string[];

  /** Arguments for version detection. */
  versionArgs?: string[];

  /** Arguments for help detection. */
  helpArgs?: string[];

  /** Environment overrides for the probe. */
  env?: Record<string, string>;

  /** Timeout for each probe run (ms). */
  timeoutMs?: number;

  /** Working directory for the probe. */
  cwd?: string;

  /** Where this probe should be expected to run. */
  availability?: 'ci' | 'ci-or-local' | 'local-manual' | 'offline-only';

  /** Known stdin prompt markers for this harness. */
  stdinSignals?: string[];

  /** Relevant file operation patterns exposed by the harness. */
  fileOperationPatterns?: string[];

  /** Relevant environment variables for auth/session/config. */
  environmentVariables?: string[];

  /** Additional CLI/transport metadata to carry into the profile. */
  cliPatterns?: Record<string, string>;

  /** Declared output format when the probe is contract-only or transport-specific. */
  outputFormat?: string;

  /** Additional traits expected for the output stream. */
  outputFormatTraits?: string[];

  /** Review notes for the probe target. */
  probeNotes?: string[];

  /** Named scenario probes beyond version/help. */
  scenarios?: ProbeScenario[];

  /** Contract version to use when the probe target is fixture-only. */
  contractVersion?: string;

  /** Contract startup time to use when the probe target is fixture-only. */
  contractStartupTimeMs?: number;

  /** Contract exit codes to use when the probe target is fixture-only. */
  contractExitCodes?: Record<string, number>;
}

export interface ProbeScenario {
  /** Stable scenario name used in exitCodes. */
  name: string;

  /** Arguments to execute. */
  args: string[];

  /** Optional stdin payload. */
  stdin?: string;

  /** Optional environment overrides. */
  env?: Record<string, string>;

  /** Optional working directory override. */
  cwd?: string;

  /** Optional timeout override. */
  timeoutMs?: number;
}

function createSubprocessProbe(
  harness: HarnessType,
  command: string,
  metadata: Omit<ProbeConfig, 'harness' | 'command' | 'executionType'>,
): ProbeConfig {
  return {
    harness,
    executionType: 'subprocess',
    command,
    ...metadata,
  };
}

function createOfflineContractProbe(
  harness: HarnessType,
  executionType: AdapterExecutionType,
  metadata: Omit<ProbeConfig, 'harness' | 'command' | 'executionType' | 'availability'>,
): ProbeConfig {
  return {
    harness,
    executionType,
    command: process.execPath,
    availability: 'offline-only',
    ...metadata,
  };
}

/** Pre-configured probe configurations for built-in harness and transport targets. */
export const PROBE_CONFIGS: Record<string, ProbeConfig> = {
  'claude-code': createSubprocessProbe('claude-code', 'claude', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    args: ['-p', 'Say hello in one word', '--output-format', 'json'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['(y/N)', '(y/n)', 'permission', 'approval'],
    fileOperationPatterns: ['Read', 'Write', 'Edit', 'MultiEdit'],
    environmentVariables: ['ANTHROPIC_API_KEY'],
    cliPatterns: {
      command: 'claude',
      args: '-p "Say hello in one word" --output-format json',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'newline-delimited', 'session-envelopes', 'tool-events', 'cost-events'],
    probeNotes: ['Interactive/authenticated prompt probes are local-manual because Claude may require login or tool approval.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'codex': createSubprocessProbe('codex', 'codex', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    args: ['exec', '--json', 'Say hello in one word'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['approval', 'sandbox', 'Enter'],
    fileOperationPatterns: ['apply_patch', 'write_file', 'function_call'],
    environmentVariables: ['OPENAI_API_KEY'],
    cliPatterns: {
      command: 'codex',
      args: 'exec --json "Say hello in one word"',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'newline-delimited', 'session-envelopes', 'tool-events', 'function-call-events'],
    probeNotes: ['The success scenario is local-manual because exec mode can require auth and version-dependent flags.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'gemini': createSubprocessProbe('gemini', 'gemini', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    args: ['--prompt', 'Say hello in one word'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['login', 'OAuth', 'interactive'],
    fileOperationPatterns: ['tool_call', 'tool_result'],
    environmentVariables: ['GOOGLE_API_KEY', 'GEMINI_API_KEY', 'GEMINI_CLI', 'GEMINI_SESSION_ID'],
    cliPatterns: {
      command: 'gemini',
      args: '--prompt "Say hello in one word"',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'thinking-events', 'tool-events'],
    probeNotes: ['Gemini live prompt probes are expected to run locally with configured auth.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'copilot': createSubprocessProbe('copilot', 'gh', {
    versionArgs: ['copilot', '--version'],
    helpArgs: ['copilot', '--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['Install GitHub Copilot CLI?', 'Authenticate with GitHub'],
    fileOperationPatterns: ['plain-text suggestions'],
    environmentVariables: ['GITHUB_TOKEN', 'COPILOT_CLI_SESSION', 'GH_COPILOT_SESSION'],
    cliPatterns: {
      command: 'gh',
      transportCommand: 'gh copilot',
      versionArgs: 'copilot --version',
      helpArgs: 'copilot --help',
    },
    outputFormat: 'text',
    outputFormatTraits: ['plain-text', 'stderr-install-prompts'],
    probeNotes: ['Copilot probes are local-manual because the CLI may prompt to install the extension first.'],
    scenarios: [
      { name: 'error', args: ['copilot', '--definitely-invalid-flag'] },
    ],
  }),
  'cursor': createSubprocessProbe('cursor', 'cursor', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['login', 'approval', 'interactive'],
    fileOperationPatterns: ['edit_file', 'tool_call'],
    environmentVariables: ['CURSOR_API_KEY', 'CURSOR_SESSION', 'CURSOR_AGENT_SESSION'],
    cliPatterns: {
      command: 'cursor',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'session-envelopes', 'tool-events'],
    probeNotes: ['Cursor probes are local-manual because install and auth are user-specific.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'opencode': createSubprocessProbe('opencode', 'opencode', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['opencode auth', 'approval', 'interactive'],
    fileOperationPatterns: ['write_file', 'tool_result', 'session_end'],
    environmentVariables: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY', 'OPENCODE_SESSION_ID', 'OPENCODE_CONFIG'],
    cliPatterns: {
      command: 'opencode',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'session-envelopes', 'tool-events', 'cost-events'],
    probeNotes: ['OpenCode CLI prompt probes are local-manual because auth and provider configuration vary by machine.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'pi': createSubprocessProbe('pi', 'pi', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    args: ['--help'],
    availability: 'ci-or-local',
    timeoutMs: 30000,
    stdinSignals: ['--print', 'interactive', 'resume'],
    fileOperationPatterns: ['read', 'bash', 'edit', 'write'],
    environmentVariables: ['PI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'PI_RUN_ID', 'PI_SESSION_ID'],
    cliPatterns: {
      command: 'pi',
      args: '--help',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'text',
    outputFormatTraits: ['plain-text', 'environment-docs', 'tool-listing'],
    probeNotes: ['pi exposes stable help/version output suitable for CI-safe smoke checks in addition to local/manual prompt probes.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'omp': createSubprocessProbe('omp', 'omp', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['interactive', 'approval'],
    fileOperationPatterns: ['search_repo', 'tool_call'],
    environmentVariables: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
    cliPatterns: {
      command: 'omp',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'session-envelopes', 'tool-events'],
    probeNotes: ['OMP probes are contract-complete but typically local-manual because the binary is not expected in CI.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'openclaw': createSubprocessProbe('openclaw', 'openclaw', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['interactive', 'approval'],
    fileOperationPatterns: ['open_plugin_channel', 'tool_call'],
    environmentVariables: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'OPENCLAW_SESSION', 'OPENCLAW_RUN_ID'],
    cliPatterns: {
      command: 'openclaw',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'session-envelopes', 'plugin-events', 'tool-events'],
    probeNotes: ['OpenClaw probes are contract-complete but typically local-manual because the binary is not expected in CI.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'hermes': createSubprocessProbe('hermes', 'hermes', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['interactive', 'approval'],
    fileOperationPatterns: ['apply_patch', 'tool_call'],
    environmentVariables: ['OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'NOUS_API_KEY', 'GOOGLE_API_KEY', 'GITHUB_TOKEN'],
    cliPatterns: {
      command: 'hermes',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'session-envelopes', 'tool-events'],
    probeNotes: ['Hermes probes are contract-complete but typically local-manual because the binary is not expected in CI.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'amp': createSubprocessProbe('amp', 'amp', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['amp auth', 'approval'],
    fileOperationPatterns: ['grep_codebase', 'tool_result'],
    environmentVariables: ['SOURCEGRAPH_ACCESS_TOKEN'],
    cliPatterns: {
      command: 'amp',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'session-envelopes', 'cost-events', 'tool-events'],
    probeNotes: ['Amp probes are contract-complete but typically local-manual because the binary is not expected in CI.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'droid': createSubprocessProbe('droid', 'droid', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['droid auth login', 'approval'],
    fileOperationPatterns: ['bash', 'tool_call_ready', 'message_stop'],
    environmentVariables: ['DROID_API_KEY', 'DROID_CONFIG_PATH'],
    cliPatterns: {
      command: 'droid',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'session-envelopes', 'tool-events', 'cost-events'],
    probeNotes: ['Droid probes are contract-complete but typically local-manual because the binary is not expected in CI.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'qwen': createSubprocessProbe('qwen', 'qwen', {
    versionArgs: ['--version'],
    helpArgs: ['--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['OAuth', 'interactive', 'approval'],
    fileOperationPatterns: ['read_file', 'tool_call'],
    environmentVariables: ['OPENAI_API_KEY', 'OPENAI_BASE_URL', 'OPENAI_MODEL', 'QWEN_CODE', 'QWEN_SESSION_ID'],
    cliPatterns: {
      command: 'qwen',
      versionArgs: '--version',
      helpArgs: '--help',
    },
    outputFormat: 'jsonl',
    outputFormatTraits: ['jsonl', 'tool-events', 'error-events'],
    probeNotes: ['Qwen probes are contract-complete but typically local-manual because the binary is not expected in CI.'],
    scenarios: [
      { name: 'error', args: ['--definitely-invalid-flag'] },
    ],
  }),
  'claude-agent-sdk': createOfflineContractProbe('claude-agent-sdk', 'sdk', {
    timeoutMs: 30000,
    stdinSignals: ['ANTHROPIC_API_KEY', 'CLAUDE_AGENT_API_KEY', 'claude'],
    fileOperationPatterns: ['tool-use', 'tool-result', 'session files'],
    environmentVariables: ['ANTHROPIC_API_KEY', 'CLAUDE_AGENT_API_KEY'],
    cliPatterns: {
      command: 'node',
      module: '@anthropic-ai/claude-agent-sdk',
      installCommand: 'npm install -g @anthropic-ai/claude-agent-sdk',
      verifyCommand: 'node -e "import(\'@anthropic-ai/claude-agent-sdk\').then(() => console.log(\'OK\'))"',
      loginCommand: 'claude',
    },
    outputFormat: 'sdk-events',
    outputFormatTraits: ['sdk', 'json-events', 'session-envelopes', 'tool-events'],
    probeNotes: ['SDK targets are fixture-backed contract probes in CI because there is no standalone harness binary to execute.', 'Review the checked-in baseline fixture to detect drift in installation, auth, and event-shape expectations.'],
    contractVersion: 'manual-capture',
    contractStartupTimeMs: 500,
    contractExitCodes: { load: 0, 'auth-missing': 1 },
  }),
  'codex-sdk': createOfflineContractProbe('codex-sdk', 'sdk', {
    timeoutMs: 30000,
    stdinSignals: ['OPENAI_API_KEY'],
    fileOperationPatterns: ['execute_code', 'read_file', 'write_file'],
    environmentVariables: ['OPENAI_API_KEY'],
    cliPatterns: {
      command: 'node',
      module: 'openai',
      installCommand: 'npm install -g openai',
      verifyCommand: 'node -e "console.log(process.env.OPENAI_API_KEY ? \'OK\' : \'Missing\')"',
      configPath: '~/.codex/config.json',
    },
    outputFormat: 'sdk-events',
    outputFormatTraits: ['sdk', 'json-events', 'session-envelopes', 'function-call-events'],
    probeNotes: ['SDK targets are fixture-backed contract probes in CI because there is no standalone harness binary to execute.', 'Codex SDK drift review focuses on auth expectations, tool/event shape, and installation contract changes.'],
    contractVersion: 'manual-capture',
    contractStartupTimeMs: 500,
    contractExitCodes: { load: 0, 'auth-missing': 1 },
  }),
  'pi-sdk': createOfflineContractProbe('pi-sdk', 'sdk', {
    timeoutMs: 30000,
    stdinSignals: ['PI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'OAuth'],
    fileOperationPatterns: ['tool-call', 'parallel tool calls', 'session files'],
    environmentVariables: ['PI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'],
    cliPatterns: {
      command: 'node',
      module: '@pi-ai/sdk',
      installCommand: 'npm install -g @pi-ai/sdk',
      verifyCommand: 'pi --version',
      configPath: '~/.pi/agent/settings.json',
    },
    outputFormat: 'sdk-events',
    outputFormatTraits: ['sdk', 'json-events', 'session-envelopes', 'tool-events'],
    probeNotes: ['SDK targets are fixture-backed contract probes in CI because there is no standalone harness binary to execute.', 'Pi SDK drift review focuses on provider auth expectations and structured event streaming.'],
    contractVersion: 'manual-capture',
    contractStartupTimeMs: 500,
    contractExitCodes: { load: 0, 'auth-missing': 1 },
  }),
  'codex-websocket': {
    harness: 'codex-websocket',
    executionType: 'websocket',
    command: 'codex',
    versionArgs: ['--version'],
    helpArgs: ['app-server', '--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['OPENAI_API_KEY', 'CODEX_APP_SERVER'],
    fileOperationPatterns: ['persistent session files', 'websocket event stream'],
    environmentVariables: ['CODEX_APP_SERVER', 'OPENAI_API_KEY', 'CODEX_CLI'],
    cliPatterns: {
      command: 'codex',
      versionArgs: '--version',
      helpArgs: 'app-server --help',
      transportArgs: 'app-server --listen ws://127.0.0.1:<port>',
    },
    outputFormat: 'websocket-json',
    outputFormatTraits: ['websocket', 'json-frames', 'session-envelopes', 'tool-events'],
    probeNotes: ['Live transport startup is local-manual; CI should review the checked-in contract fixture instead.'],
    scenarios: [
      { name: 'error', args: ['app-server', '--definitely-invalid-flag'] },
    ],
  },
  'opencode-http': {
    harness: 'opencode-http',
    executionType: 'http',
    command: 'opencode',
    versionArgs: ['--version'],
    helpArgs: ['serve', '--help'],
    availability: 'local-manual',
    timeoutMs: 30000,
    stdinSignals: ['OPENCODE_CONFIG', 'auth'],
    fileOperationPatterns: ['HTTP / SSE event stream', 'session persistence'],
    environmentVariables: ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY', 'OPENCODE_SESSION_ID', 'OPENCODE_CONFIG'],
    cliPatterns: {
      command: 'opencode',
      versionArgs: '--version',
      helpArgs: 'serve --help',
      transportArgs: 'serve --port <port> --host <host>',
    },
    outputFormat: 'http-sse',
    outputFormatTraits: ['http', 'sse', 'json-events', 'tool-events'],
    probeNotes: ['Live server startup is local-manual; CI should review the checked-in contract fixture instead.'],
    scenarios: [
      { name: 'error', args: ['serve', '--definitely-invalid-flag'] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Probe result
// ---------------------------------------------------------------------------

export interface ProbeResult {
  /** Whether the probe succeeded. */
  success: boolean;

  /** Error message if the probe failed. */
  error?: string;

  /** The captured behavior profile. */
  profile?: HarnessBehaviorProfile;

  /** Raw stdout from the probe. */
  stdout?: string;

  /** Raw stderr from the probe. */
  stderr?: string;

  /** Exit code from the probe. */
  exitCode?: number;

  /** Wall-clock duration of the probe (ms). */
  durationMs?: number;

  /** Per-scenario observations collected during the probe. */
  scenarioResults?: Record<string, ProbeObservation>;
}

export interface ProbeObservation {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Probing logic
// ---------------------------------------------------------------------------

/**
 * Probe a real harness installation and capture its behavior profile.
 */
export async function probeHarness(config: ProbeConfig): Promise<ProbeResult> {
  if (config.availability === 'offline-only') {
    return {
      success: true,
      profile: buildProfile(config, {}, undefined),
      stdout: '',
      stderr: '',
      exitCode: 0,
      durationMs: config.contractStartupTimeMs ?? 0,
      scenarioResults: {},
    };
  }

  const observations: Record<string, ProbeObservation> = {};

  const versionObservation = config.versionArgs == null
    ? undefined
    : await runObservation(config, {
      name: 'version',
      args: config.versionArgs,
    });

  if (versionObservation) {
    observations.version = versionObservation;
    if (!versionObservation.success && !versionObservation.stdout && !versionObservation.stderr) {
      return {
        success: false,
        error: versionObservation.error ?? 'Probe command failed before producing output.',
        durationMs: versionObservation.durationMs,
        exitCode: versionObservation.exitCode,
        scenarioResults: observations,
      };
    }
  }

  if (config.helpArgs != null) {
    observations.help = await runObservation(config, {
      name: 'help',
      args: config.helpArgs,
    });
  }

  const scenarios = config.scenarios ?? (config.args == null ? [] : [{ name: 'success', args: config.args }]);
  for (const scenario of scenarios) {
    observations[scenario.name] = await runObservation(config, scenario);
  }

  const primary = selectPrimaryObservation(observations);
  const profile = buildProfile(config, observations, primary);

  return {
    success: true,
    profile,
    stdout: primary?.stdout ?? '',
    stderr: primary?.stderr ?? '',
    exitCode: primary?.exitCode ?? versionObservation?.exitCode ?? 0,
    durationMs: primary?.durationMs ?? versionObservation?.durationMs ?? 0,
    scenarioResults: observations,
  };
}

/**
 * Probe all configured harnesses and save profiles to a directory.
 */
export async function probeAllHarnesses(
  outputDir: string,
  configs?: Record<string, ProbeConfig>,
): Promise<Map<string, ProbeResult>> {
  const results = new Map<string, ProbeResult>();
  const allConfigs = configs ?? PROBE_CONFIGS;

  fs.mkdirSync(outputDir, { recursive: true });

  for (const [name, config] of Object.entries(allConfigs)) {
    const result = await probeHarness(config);
    results.set(name, result);

    if (result.profile) {
      const profilePath = path.join(outputDir, `${name}.profile.json`);
      fs.writeFileSync(profilePath, JSON.stringify(result.profile, null, 2), 'utf-8');
    }

    const resultPath = path.join(outputDir, `${name}.result.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      success: result.success,
      error: result.error,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      stdoutLength: result.stdout?.length ?? 0,
      stderrLength: result.stderr?.length ?? 0,
      scenarioResults: result.scenarioResults ?? {},
    }, null, 2), 'utf-8');
  }

  return results;
}

/**
 * Compare a behavior profile against a previous baseline.
 * Returns a list of differences.
 */
export function compareProfiles(
  baseline: HarnessBehaviorProfile,
  current: HarnessBehaviorProfile,
): ProfileDiff[] {
  const diffs: ProfileDiff[] = [];

  if (baseline.version !== current.version) {
    diffs.push({ field: 'version', baseline: baseline.version, current: current.version, severity: 'info' });
  }
  if (baseline.outputFormat !== current.outputFormat) {
    diffs.push({ field: 'outputFormat', baseline: baseline.outputFormat, current: current.outputFormat, severity: 'breaking' });
  }
  if (!sameStringArray(baseline.outputFormatTraits, current.outputFormatTraits)) {
    diffs.push({ field: 'outputFormatTraits', baseline: baseline.outputFormatTraits, current: current.outputFormatTraits, severity: 'warning' });
  }
  if (baseline.supportsStdin !== current.supportsStdin) {
    diffs.push({ field: 'supportsStdin', baseline: baseline.supportsStdin, current: current.supportsStdin, severity: 'breaking' });
  }
  if (!sameStringArray(baseline.stdinSignals, current.stdinSignals)) {
    diffs.push({ field: 'stdinSignals', baseline: baseline.stdinSignals, current: current.stdinSignals, severity: 'warning' });
  }
  if (!sameStringArray(baseline.fileOperationPatterns, current.fileOperationPatterns)) {
    diffs.push({ field: 'fileOperationPatterns', baseline: baseline.fileOperationPatterns, current: current.fileOperationPatterns, severity: 'warning' });
  }
  if (!sameStringArray(baseline.environmentVariables, current.environmentVariables)) {
    diffs.push({ field: 'environmentVariables', baseline: baseline.environmentVariables, current: current.environmentVariables, severity: 'warning' });
  }
  if (baseline.executionType !== current.executionType) {
    diffs.push({ field: 'executionType', baseline: baseline.executionType, current: current.executionType, severity: 'breaking' });
  }
  if (baseline.availability !== current.availability) {
    diffs.push({ field: 'availability', baseline: baseline.availability, current: current.availability, severity: 'info' });
  }

  // Check exit code changes
  for (const [scenario, code] of Object.entries(baseline.exitCodes)) {
    if (current.exitCodes[scenario] !== undefined && current.exitCodes[scenario] !== code) {
      diffs.push({ field: `exitCodes.${scenario}`, baseline: code, current: current.exitCodes[scenario], severity: 'warning' });
    }
  }

  // Check CLI pattern changes
  for (const [key, pattern] of Object.entries(baseline.cliPatterns)) {
    if (current.cliPatterns[key] !== undefined && current.cliPatterns[key] !== pattern) {
      diffs.push({ field: `cliPatterns.${key}`, baseline: pattern, current: current.cliPatterns[key], severity: 'breaking' });
    }
  }

  // Check startup time drift (>2x is a warning)
  if (current.startupTimeMs > baseline.startupTimeMs * 2) {
    diffs.push({ field: 'startupTimeMs', baseline: baseline.startupTimeMs, current: current.startupTimeMs, severity: 'warning' });
  }

  return diffs;
}

export interface ProfileDiff {
  field: string;
  baseline: unknown;
  current: unknown;
  severity: 'info' | 'warning' | 'breaking';
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildProfile(
  config: ProbeConfig,
  observations: Record<string, ProbeObservation>,
  primary: ProbeObservation | undefined,
): HarnessBehaviorProfile {
  const outputFormat = config.outputFormat ?? inferOutputFormat(primary);
  const inferredSignals = inferStdinSignals(primary);
  const stdinSignals = uniqueStrings([...(config.stdinSignals ?? []), ...inferredSignals]);
  const supportsStdin = stdinSignals.length > 0 || Object.values(observations).some((entry) => entry.stdout.includes('stdin') || entry.stderr.includes('stdin'));
  const outputFormatTraits = uniqueStrings([
    ...(config.outputFormatTraits ?? []),
    ...inferOutputTraits(primary, outputFormat),
  ]);

  return {
    harness: config.harness,
    executionType: config.executionType ?? 'subprocess',
    version: extractVersion(observations.version) ?? config.contractVersion ?? 'unknown',
    capturedAt: new Date().toISOString(),
    startupTimeMs: Math.min(primary?.durationMs ?? observations.version?.durationMs ?? config.contractStartupTimeMs ?? 0, 5000),
    outputFormat,
    outputFormatTraits,
    supportsStdin,
    stdinSignals,
    fileOperationPatterns: [...(config.fileOperationPatterns ?? [])],
    exitCodes: {
      ...(config.contractExitCodes ?? {}),
      ...Object.fromEntries(
        Object.entries(observations).map(([name, entry]) => [name, entry.exitCode]),
      ),
    },
    environmentVariables: [...(config.environmentVariables ?? [])],
    cliPatterns: {
      command: config.command,
      args: (config.args ?? []).join(' '),
      versionArgs: (config.versionArgs ?? []).join(' '),
      helpArgs: (config.helpArgs ?? []).join(' '),
      ...config.cliPatterns,
    },
    availability: config.availability ?? 'local-manual',
    probeNotes: [...(config.probeNotes ?? [])],
  };
}

async function runObservation(
  config: ProbeConfig,
  scenario: ProbeScenario,
): Promise<ProbeObservation> {
  const startTime = Date.now();
  const cwd = scenario.cwd ?? config.cwd ?? os.tmpdir();
  const timeout = scenario.timeoutMs ?? config.timeoutMs ?? 30000;

  return new Promise((resolve) => {
    const child = execFile(
      config.command,
      scenario.args,
      {
        cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, ...config.env, ...scenario.env },
      },
      (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        const exitCode = error?.code !== undefined
          ? (typeof error.code === 'number' ? error.code : 1)
          : 0;

        if (error && !stdout && !stderr) {
          resolve({
            success: false,
            error: error.message,
            stdout,
            stderr,
            exitCode: typeof exitCode === 'number' ? exitCode : 1,
            durationMs,
          });
          return;
        }

        resolve({
          success: true,
          stdout,
          stderr,
          exitCode: typeof exitCode === 'number' ? exitCode : 0,
          durationMs,
          error: error?.message,
        });
      },
    );

    if (scenario.stdin != null) {
      child.stdin?.end(scenario.stdin);
    }

    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, timeout + 5000);
  });
}

function selectPrimaryObservation(
  observations: Record<string, ProbeObservation>,
): ProbeObservation | undefined {
  const orderedNames = ['success', 'stdin-prompt', 'help', 'version'];
  for (const name of orderedNames) {
    if (observations[name] != null) {
      return observations[name];
    }
  }
  return Object.values(observations)[0];
}

function inferOutputFormat(observation: ProbeObservation | undefined): string {
  if (observation == null) {
    return 'text';
  }
  const stdout = observation.stdout.trim();
  if (!stdout) {
    return 'text';
  }
  const lines = stdout.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length > 0 && lines.every((line) => isJson(line))) {
    return 'jsonl';
  }
  if (isJson(stdout)) {
    return 'json';
  }
  return 'text';
}

function inferOutputTraits(
  observation: ProbeObservation | undefined,
  outputFormat: string,
): string[] {
  if (observation == null) {
    return [];
  }

  const traits: string[] = [];
  const combined = `${observation.stdout}\n${observation.stderr}`;
  const lines = observation.stdout.split('\n').map((line) => line.trim()).filter(Boolean);

  if (outputFormat === 'jsonl') {
    traits.push('jsonl', 'newline-delimited');
  } else if (outputFormat === 'json') {
    traits.push('json');
  } else if (observation.stdout.trim()) {
    traits.push('plain-text');
  }
  if (lines.some((line) => /session[_-](start|end)|thread|turn/i.test(line))) {
    traits.push('session-envelopes');
  }
  if (lines.some((line) => /tool|function_call|apply_patch/i.test(line))) {
    traits.push('tool-events');
  }
  if (combined && /error|failed|denied|invalid/i.test(combined)) {
    traits.push('error-events');
  }
  if (observation.stderr.trim()) {
    traits.push('stderr-output');
  }
  return uniqueStrings(traits);
}

function inferStdinSignals(observation: ProbeObservation | undefined): string[] {
  if (observation == null) {
    return [];
  }

  const signals: string[] = [];
  const lines = `${observation.stdout}\n${observation.stderr}`.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/[?][ \t]*$/.test(line) || /\(y\/n\)|\(y\/N\)|stdin|interactive|approval|prompt/i.test(line)) {
      signals.push(line);
    }
  }
  return uniqueStrings(signals);
}

function extractVersion(observation: ProbeObservation | undefined): string | null {
  if (observation == null) {
    return null;
  }
  const combined = `${observation.stdout}\n${observation.stderr}`;
  const match = combined.match(/\bv?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?\b/);
  return match?.[0] ?? null;
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function sameStringArray(left: string[], right: string[]): boolean {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
