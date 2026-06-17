/**
 * Documented published plugin-install verification (issue #960, part A).
 *
 * The BP live-stack lanes install babysitter from LOCAL source
 * (`npm install --global ./packages/babysitter-sdk` + `adapters install babysitter`),
 * so they stay green even when the PUBLISHED marketplace a real user installs from
 * is broken. This runner exercises the EXACT commands the user-facing READMEs
 * document, against the PUBLISHED external marketplaces, and asserts that the
 * plugin that ends up installed is the channel's CURRENT published version — not
 * a stale/mismatched one — so a broken published marketplace fails the suite
 * instead of giving false confidence.
 *
 * Documented contracts (see README.md / per-harness READMEs):
 *   claude: `claude plugin marketplace add a5c-ai/babysitter-claude`
 *           `claude plugin install --scope user babysitter@a5c.ai`
 *   codex:  `codex plugin marketplace add a5c-ai/babysitter --ref <channel> --sparse .agents/plugins`
 *           `codex plugin add babysitter --marketplace babysitter`
 */

import type { CommandExecution, CommandResult } from './primary-live-runner';

export type DocumentedInstallHarness = 'claude-code' | 'codex';

/** The single identifier the docs use for the published Babysitter plugin. */
export const DOCUMENTED_PLUGIN_ID = 'babysitter@a5c.ai';

interface DocumentedInstallSpec {
  /** The GitHub `owner/repo` the docs tell users to add as a marketplace. */
  readonly marketplaceRepo: string;
  /**
   * The branch of {@link marketplaceRepo} whose committed marketplace.json
   * declares the version the channel is SUPPOSED to publish. The documented
   * `claude plugin marketplace add` clones the repo's default branch, so when
   * the channel branch is ahead of default the installed version will lag —
   * which is exactly the bug this verification catches.
   */
  readonly expectedVersionRef: (channel: string) => string;
  /** Path to the marketplace manifest inside {@link marketplaceRepo}. */
  readonly marketplaceManifestPath: string;
}

const DOCUMENTED_INSTALL_SPECS: Readonly<Record<DocumentedInstallHarness, DocumentedInstallSpec>> = {
  'claude-code': {
    marketplaceRepo: 'a5c-ai/babysitter-claude',
    expectedVersionRef: (channel) => channel,
    marketplaceManifestPath: '.claude-plugin/marketplace.json',
  },
  codex: {
    // Codex adds the MAIN repo's `.agents/plugins` subdir at the channel ref;
    // the resolved plugin content lives in babysitter-codex, whose version
    // manifest is `.codex-plugin/plugin.json` (NOT `.claude-plugin/marketplace.json`,
    // which does not exist in that repo and 404s). parseManifestPluginVersion
    // falls back to the top-level `version` for this plugin.json shape.
    marketplaceRepo: 'a5c-ai/babysitter-codex',
    expectedVersionRef: (channel) => channel,
    marketplaceManifestPath: '.codex-plugin/plugin.json',
  },
};

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Map a published-channel npm dist-tag / branch to the external-repo branch
 * that holds the channel's current published content.
 */
export function resolveChannelRef(env: Record<string, string | undefined>): string {
  const explicit = env['LIVE_STACK_PUBLISHED_CHANNEL'] ?? env['NPM_TAG'] ?? env['LIVE_STACK_NPM_TAG'];
  if (explicit) {
    if (explicit === 'latest') return 'main';
    return explicit;
  }
  const branch = env['LIVE_STACK_BRANCH'] ?? env['GITHUB_REF_NAME'];
  switch (branch) {
    case 'main':
      return 'main';
    case 'develop':
      return 'develop';
    case 'staging':
      return 'staging';
    default:
      return 'staging';
  }
}

/**
 * Build the ordered commands the docs tell a user to run to install the
 * published Babysitter plugin for {@link harness} on {@link channel}, followed
 * by the machine-readable `plugin list` used to assert the installed version.
 *
 * Pure — does not execute anything.
 */
export function buildDocumentedInstallCommands(
  harness: DocumentedInstallHarness,
  channel: string,
  options: { readonly cwd: string; readonly env?: Record<string, string>; readonly timeoutMs?: number },
): readonly CommandExecution[] {
  const env = options.env ?? {};
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const spec = DOCUMENTED_INSTALL_SPECS[harness];
  const base = { env, cwd: options.cwd, timeoutMs };

  if (harness === 'claude-code') {
    return [
      { command: 'claude', args: ['plugin', 'marketplace', 'add', spec.marketplaceRepo], ...base },
      { command: 'claude', args: ['plugin', 'install', '--scope', 'user', DOCUMENTED_PLUGIN_ID], ...base },
      { command: 'claude', args: ['plugin', 'list', '--json'], ...base },
    ];
  }

  // codex — current codex CLI (>=0.140.0) uses `plugin add <PLUGIN> --marketplace <NAME>`
  // (the older `plugin install … --source …` subcommand/flag does not exist:
  // `codex plugin --help` lists add/list/marketplace/remove, and `plugin add`
  // takes `PLUGIN@MARKETPLACE` or `PLUGIN --marketplace MARKETPLACE`).
  return [
    { command: 'codex', args: ['plugin', 'marketplace', 'add', 'a5c-ai/babysitter', '--ref', channel, '--sparse', '.agents/plugins'], ...base },
    { command: 'codex', args: ['plugin', 'add', 'babysitter', '--marketplace', 'babysitter'], ...base },
    { command: 'codex', args: ['plugin', 'list', '--json'], ...base },
  ];
}

/**
 * The raw.githubusercontent.com URL for the channel-branch marketplace manifest
 * that declares the version the channel is supposed to publish.
 */
export function expectedVersionManifestUrl(harness: DocumentedInstallHarness, channel: string): string {
  const spec = DOCUMENTED_INSTALL_SPECS[harness];
  const ref = spec.expectedVersionRef(channel);
  return `https://raw.githubusercontent.com/${spec.marketplaceRepo}/${ref}/${spec.marketplaceManifestPath}`;
}

/** Extract the babysitter plugin version from a marketplace manifest payload. */
export function parseManifestPluginVersion(manifestJson: string): string {
  const manifest = JSON.parse(manifestJson) as {
    plugins?: Array<{ name?: string; version?: string }>;
    version?: string;
  };
  const plugin = (manifest.plugins ?? []).find((entry) => entry.name === 'babysitter') ?? manifest.plugins?.[0];
  const version = plugin?.version ?? manifest.version;
  if (!version) {
    throw new Error('channel marketplace manifest declares no babysitter plugin version');
  }
  return version;
}

/**
 * Resolve the channel's CURRENT published version from the channel branch of the
 * external marketplace repo. This is the source of truth the documented install
 * is asserted against.
 */
export async function resolveExpectedPublishedVersion(
  harness: DocumentedInstallHarness,
  channel: string,
  fetchManifest: (url: string) => Promise<string>,
): Promise<string> {
  const url = expectedVersionManifestUrl(harness, channel);
  const manifestJson = await fetchManifest(url);
  return parseManifestPluginVersion(manifestJson);
}

interface InstalledPluginEntry {
  /** claude uses `id` ("babysitter@a5c.ai"); codex uses `pluginId` ("babysitter@babysitter"). */
  readonly id?: string;
  readonly pluginId?: string;
  readonly name?: string;
  readonly version?: string;
  readonly enabled?: boolean;
  readonly errors?: readonly string[];
}

/**
 * Find the babysitter plugin entry in `claude/codex plugin list --json` output.
 *
 * Tolerant of the three list shapes in the wild:
 *   - claude: a top-level array, or `{ plugins: [...] }`, entries keyed by `id`.
 *   - codex 0.140.0: `{ installed: [...], available: [...] }`, entries keyed by
 *     `pluginId` (e.g. "babysitter@babysitter"). Only `installed` counts as a
 *     successful documented install.
 */
export function findInstalledBabysitterPlugin(listJson: string): InstalledPluginEntry | undefined {
  const parsed = JSON.parse(listJson) as
    | InstalledPluginEntry[]
    | { plugins?: InstalledPluginEntry[]; installed?: InstalledPluginEntry[]; available?: InstalledPluginEntry[] };
  const entries = Array.isArray(parsed)
    ? parsed
    : parsed.installed ?? parsed.plugins ?? [];
  return entries.find((entry) => {
    const id = entry.id ?? entry.pluginId;
    return (
      id === DOCUMENTED_PLUGIN_ID ||
      id?.startsWith('babysitter@') === true ||
      entry.name === 'babysitter'
    );
  });
}

export interface VersionAssertionResult {
  readonly ok: boolean;
  readonly installedVersion?: string;
  readonly expectedVersion: string;
  readonly detail: string;
}

/**
 * Assert that the plugin reported by `plugin list --json` is present, free of
 * marketplace errors, and matches the channel's current published version.
 *
 * A stale-marketplace install (the #960 bug) presents as `ok: false` here even
 * though the install command exited 0.
 */
export function assertInstalledVersion(listJson: string, expectedVersion: string): VersionAssertionResult {
  const plugin = findInstalledBabysitterPlugin(listJson);
  if (!plugin) {
    return {
      ok: false,
      expectedVersion,
      detail: `documented install left no ${DOCUMENTED_PLUGIN_ID} plugin in 'plugin list --json'`,
    };
  }
  if (plugin.errors && plugin.errors.length > 0) {
    return {
      ok: false,
      installedVersion: plugin.version,
      expectedVersion,
      detail: `installed plugin reports marketplace errors: ${plugin.errors.join('; ')}`,
    };
  }
  if (plugin.version !== expectedVersion) {
    return {
      ok: false,
      installedVersion: plugin.version,
      expectedVersion,
      detail: `documented install resolved STALE plugin: installed ${plugin.version ?? '<none>'} but channel publishes ${expectedVersion} (broken published marketplace)`,
    };
  }
  return {
    ok: true,
    installedVersion: plugin.version,
    expectedVersion,
    detail: `documented install resolved current published version ${expectedVersion}`,
  };
}

export interface DocumentedInstallRunOptions {
  readonly harness: DocumentedInstallHarness;
  readonly env: Record<string, string | undefined>;
  readonly cwd: string;
  readonly executeCommand: (execution: CommandExecution) => Promise<CommandResult>;
  readonly fetchManifest: (url: string) => Promise<string>;
  /** Mirrors primary-live-runner: only execute when live evidence is requested. */
  readonly executeLiveProvider?: boolean;
  readonly timeoutMs?: number;
}

export interface DocumentedInstallRunResult {
  readonly status: 'passed' | 'failed';
  readonly harness: DocumentedInstallHarness;
  readonly channel: string;
  readonly commands: readonly CommandExecution[];
  readonly expectedVersion?: string;
  readonly installedVersion?: string;
  readonly failure?: string;
}

/**
 * Execute the documented published-install flow and verify the installed plugin
 * matches the channel's current published version. Stays a cheap no-op contract
 * check unless {@link DocumentedInstallRunOptions.executeLiveProvider} is set,
 * mirroring `runPrimaryLiveStackScenario`'s gating.
 */
export async function runDocumentedInstallVerification(
  options: DocumentedInstallRunOptions,
): Promise<DocumentedInstallRunResult> {
  const channel = resolveChannelRef(options.env);
  const commandEnv = Object.fromEntries(
    Object.entries(options.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
  const commands = buildDocumentedInstallCommands(options.harness, channel, {
    cwd: options.cwd,
    env: commandEnv,
    timeoutMs: options.timeoutMs,
  });

  if (options.executeLiveProvider !== true) {
    return {
      status: 'failed',
      harness: options.harness,
      channel,
      commands,
      failure: 'LIVE_STACK_RUN_MODEL_TESTS=1 is required to execute the documented published-install verification',
    };
  }

  let expectedVersion: string;
  try {
    expectedVersion = await resolveExpectedPublishedVersion(options.harness, channel, options.fetchManifest);
  } catch (err) {
    return {
      status: 'failed',
      harness: options.harness,
      channel,
      commands,
      failure: `could not resolve channel published version: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Commands: [marketplace add, install, list --json]. All install steps must
  // exit 0; the final `plugin list --json` provides the version assertion.
  const results: CommandResult[] = [];
  for (let idx = 0; idx < commands.length; idx++) {
    const command = commands[idx]!;
    const result = await options.executeCommand(command);
    results.push(result);
    const isListCommand = idx === commands.length - 1;
    if (!isListCommand && result.status !== 0) {
      return {
        status: 'failed',
        harness: options.harness,
        channel,
        commands,
        expectedVersion,
        failure: `documented install command failed (exit ${result.status}): ${command.command} ${command.args.join(' ')} — ${result.stderr.slice(-400)}`,
      };
    }
  }

  const listResult = results.at(-1)!;
  let assertion: VersionAssertionResult;
  try {
    assertion = assertInstalledVersion(listResult.stdout, expectedVersion);
  } catch (err) {
    return {
      status: 'failed',
      harness: options.harness,
      channel,
      commands,
      expectedVersion,
      failure: `could not parse 'plugin list --json' output: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  return {
    status: assertion.ok ? 'passed' : 'failed',
    harness: options.harness,
    channel,
    commands,
    expectedVersion,
    installedVersion: assertion.installedVersion,
    failure: assertion.ok ? undefined : assertion.detail,
  };
}
