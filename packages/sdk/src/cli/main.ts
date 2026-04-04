#!/usr/bin/env node
import { promises as fs, existsSync } from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import * as crypto from "node:crypto";
import { collapseDoubledA5cRuns as _sharedCollapseDoubledA5cRuns, resolveInputPath } from "./resolveInputPath";
import { commitEffectResult } from "../runtime/commitEffectResult";
import { createRun } from "../runtime/createRun";
import { buildEffectIndex } from "../runtime/replay/effectIndex";
import { readStateCache, rebuildStateCache } from "../runtime/replay/stateCache";
import type { StateCacheSnapshot } from "../runtime/replay/stateCache";
import { EffectAction, EffectRecord, IterationMetadata } from "../runtime/types";
import type { JsonRecord } from "../storage/types";
import { nextUlid } from "../storage/ulids";
import { readTaskDefinition, readTaskResult } from "../storage/tasks";
import { loadJournal } from "../storage/journal";
import { readRunMetadata } from "../storage/runFiles";
import type { JournalEvent, RunMetadata, StoredTaskResult } from "../storage/types";
import { runIterate } from "./commands/runIterate";
import { handleHealthCommand } from "./commands/health";
import { handleConfigureCommand } from "./commands/configure";
import {
  handleSessionInit,
  handleSessionAssociate,
  handleSessionResume,
  handleSessionState,
  handleSessionUpdate,
  handleSessionCheckIteration,
  handleSessionLastMessage,
  handleSessionIterationMessage,
} from "./commands/session";
import { handleSkillDiscover, handleSkillFetchRemote, discoverSkillsInternal, discoverFromProcessFile } from "./commands/skill";
import { handleMcpServe } from "./commands/mcpServe";
import { handleHookLog } from "./commands/hookLog";
import { handleHookRun } from "./commands/hookRun";
import { handleLog } from "./commands/log";
import { handleProfileCommand } from "./commands/profile";
import type { ProfileCommandArgs } from "./commands/profile";
import {
  handleProcessLibraryCommand,
} from "./commands/processLibrary";
import type { ProcessLibraryCommandArgs } from "./commands/processLibrary";
import {
  handlePluginAddMarketplace,
  handlePluginUpdateMarketplace,
  handlePluginListPlugins,
  handlePluginInstall,
  handlePluginUninstall,
  handlePluginUpdate,
  handlePluginConfigure,
  handlePluginListInstalled,
  handlePluginUpdateRegistry,
  handlePluginRemoveFromRegistry,
} from "./commands/plugin";
import type { PluginCommandArgs } from "./commands/plugin";
import { handleTokensStats } from "./commands/tokensStats";
import { handleCompressionStatus } from "./commands/compressionStatus";
import { handleCompressionToggle } from "./commands/compressionToggle";
import { handleCompressionReset } from "./commands/compressionReset";
import { handleCompressionSet } from "./commands/compressionSet";
import { handleCompressOutput } from "./commands/compressOutput";
import {
  handleHarnessInstall,
  handleHarnessInstallPlugin,
  formatHarnessInstallError,
} from "./commands/harnessInstall";
import { handleInstructionsCommand } from "./commands/instructions";
import type { InstructionsCommandArgs } from "./commands/instructions";
import { resolveCompletionProof } from "./completionProof";
import { getAdapter, getAdapterByName } from "../harness";
import { renderCommandTemplate } from "../prompts";
import type { SessionBindResult } from "../harness";
import {
  BabysitterRuntimeError,
  ErrorCategory,
  formatErrorWithContext,
  toStructuredError,
  suggestCommand,
  isBabysitterError,
} from "../runtime/exceptions";
import { CONFIG_ENV_VARS, DEFAULTS } from "../config/defaults";

const USAGE = `Usage:
Agent commands:
  babysitter run:create --process-id <id> --entry <path#export> [--runs-dir <dir>] [--inputs <file>] [--run-id <id>] [--process-revision <rev>] [--request <id>] [--prompt <text>] [--harness <name>] [--session-id <id>] [--plugin-root <dir>] [--non-interactive] [--json] [--dry-run]
  babysitter run:status <runDir> [--runs-dir <dir>] [--json]
  babysitter run:events <runDir> [--runs-dir <dir>] [--json] [--limit <n>] [--reverse] [--filter-type <type>]
  babysitter run:rebuild-state <runDir> [--runs-dir <dir>] [--json] [--dry-run]
  babysitter run:repair-journal <runDir> [--runs-dir <dir>] [--json] [--dry-run]
  babysitter run:iterate <runDir> [--runs-dir <dir>] [--json] [--verbose] [--iteration <n>]
  babysitter task:post <runDir> <effectId> --status <ok|error> [--runs-dir <dir>] [--json] [--dry-run] [--value <file>] [--value-inline <json>] [--error <file>] [--stdout-ref <ref>] [--stderr-ref <ref>] [--stdout-file <file>] [--stderr-file <file>] [--started-at <iso8601>] [--finished-at <iso8601>] [--metadata <file>] [--invocation-key <key>]
  babysitter task:list <runDir> [--runs-dir <dir>] [--pending] [--kind <kind>] [--json]
  babysitter task:show <runDir> <effectId> [--runs-dir <dir>] [--json]
  babysitter session:resume --session-id <id> --state-dir <dir> --run-id <id> [--max-iterations <n>] [--runs-dir <dir>] [--json]
  babysitter session:iteration-message --iteration <n> [--run-id <id>] [--runs-dir <dir>] [--plugin-root <dir>] [--json]
  babysitter skill:discover --plugin-root <dir> [--run-id <id>] [--cache-ttl <seconds>] [--runs-dir <dir>] [--include-remote] [--summary-only] [--process-path <path>] [--json]
  babysitter process-library:active [--run-id <id>] [--session-id <id>] [--state-dir <dir>] [--json]
  babysitter profile:read --user|--project [--dir <dir>] [--json]
  babysitter profile:write --user|--project --input <file> [--dir <dir>] [--json]
  babysitter profile:merge --user|--project --input <file> [--dir <dir>] [--json]
  babysitter profile:render --user|--project [--dir <dir>] [--json]
  babysitter instructions:babysit-skill --harness <name> [--interactive|--no-interactive] [--json]
Other commands (agents should never call these directly unless explicitly instructed):
  babysitter session:init --session-id <id> --state-dir <dir> [--max-iterations <n>] [--run-id <id>] [--prompt <text>] [--json]
  babysitter session:associate --session-id <id> --state-dir <dir> --run-id <id> [--force] [--runs-dir <dir>] [--json]
  babysitter session:state --session-id <id> --state-dir <dir> [--json]
  babysitter session:update --session-id <id> --state-dir <dir> [--iteration <n>] [--last-iteration-at <iso8601>] [--iteration-times <csv>] [--delete] [--json]
  babysitter session:check-iteration --session-id <id> --state-dir <dir> [--json]
  babysitter session:last-message --transcript-path <file> [--json]
  babysitter log --type <process|hook|cli> --message <msg> [--run-id <id>] [--label <label>] [--level <level>] [--source <src>] [--json]
  babysitter hook:log --hook-type <type> --log-file <path> [--json]
  babysitter hook:run --hook-type <stop|session-start|user-prompt-submit|pre-tool-use> [--harness <claude-code|gemini-cli>] [--plugin-root <dir>] [--state-dir <dir>] [--runs-dir <dir>] [--json] [--verbose]
  babysitter compress-output <command and args...>
  babysitter skill:fetch-remote --source-type <github|well-known> --url <url> [--json]
  babysitter process-library:clone [--repo <url>] [--dir <path>] [--ref <ref>] [--state-dir <dir>] [--json]
  babysitter process-library:update [--dir <path>] [--ref <ref>] [--state-dir <dir>] [--json]
  babysitter process-library:use [--dir <path>] [--run-id <id>] [--session-id <id>] [--state-dir <dir>] [--ref <ref>] [--json]
  babysitter plugin:install [<pluginName>] [--plugin-name <name>] [--plugin-version <ver>] [--global|--project] [--json] [--verbose]
  babysitter plugin:uninstall [<pluginName>] [--plugin-name <name>] [--global|--project] [--json] [--verbose]
  babysitter plugin:update [<pluginName>] [--plugin-name <name>] [--plugin-version <ver>] [--global|--project] [--json] [--verbose]
  babysitter plugin:configure [<pluginName>] [--plugin-name <name>] [--global|--project] [--json] [--verbose]
  babysitter plugin:list-installed [--global|--project] [--json] [--verbose]
  babysitter plugin:list-plugins --marketplace-name <name> [--global|--project] [--json] [--verbose]
  babysitter plugin:add-marketplace --marketplace-url <url> [--marketplace-path <path>] [--marketplace-branch <ref>] [--force] [--global|--project] [--json] [--verbose]
  babysitter plugin:update-marketplace --marketplace-name <name> [--marketplace-branch <ref>] [--global|--project] [--json] [--verbose]
  babysitter plugin:update-registry [<pluginName>] [--plugin-name <name>] [--plugin-version <ver>] [--global|--project] [--json] [--verbose]
  babysitter plugin:remove-from-registry [<pluginName>] [--plugin-name <name>] [--global|--project] [--json] [--verbose]
  babysitter tokens:stats [runId] [--all] [--runs-dir <dir>] [--json]
  babysitter compression:status [--json]
  babysitter compression:toggle <layer> <on|off> [--json]
  babysitter compression:set <layer.key> <value> [--json]
  babysitter compression:reset [--json]
  babysitter harness:create-run [--prompt <text>] [--harness <name>] [--process <path>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--interactive|--no-interactive|--non-interactive] [--json] [--verbose]
  babysitter harness:call [...]                  (alias for harness:create-run)
  babysitter harness:yolo [...]                  (alias for harness:create-run --non-interactive)
  babysitter harness:plan [...]                  (alias for harness:create-run, stops after Phase 1)
  babysitter harness:forever [...]               (alias for harness:create-run, infinite loop process)
  babysitter harness:resume-run [--run-id <id>] [--runs-dir <dir>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--interactive|--no-interactive] [--json] [--verbose]
  babysitter harness:resume [...]                (alias for harness:resume-run)
  babysitter harness:retrospect [--run-id <id>...] [--all] [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--json] [--verbose]
  babysitter harness:cleanup [--dry-run] [--keep-days <n>] [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--runs-dir <dir>] [--json] [--verbose]
  babysitter harness:assimilate [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--json] [--verbose]
  babysitter harness:doctor [--run-id <id>] [--runs-dir <dir>] [--json] [--verbose]
  babysitter harness:contrib [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--runs-dir <dir>] [--json] [--verbose]
  babysitter harness:anycli --service <name> [--scope <scopes>] [--mcp] [--auth-file <path>] [--transport <type>] [--prompt <text>] [--workspace <dir>] [--json] [--verbose]
  babysitter harness:help [<topic>]
  babysitter harness:observe [--workspace <dir>]
  babysitter harness:user-install [--harness <name>] [--workspace <dir>] [--model <model>] [--runs-dir <dir>] [--json] [--verbose]
  babysitter harness:project-install [--harness <name>] [--workspace <dir>] [--model <model>] [--runs-dir <dir>] [--json] [--verbose]
  babysitter harness:discover [--json]
  babysitter harness:list [--json]
  babysitter harness:install <name> [--workspace <dir>] [--json] [--dry-run] [--verbose]
  babysitter harness:install-plugin <name> [--workspace <dir>] [--json] [--dry-run] [--verbose]
  babysitter harness:invoke <name> --prompt <text> [--workspace <dir>] [--model <model>] [--timeout <ms>] [--json]
  babysitter instructions:process-create --harness <name> [--interactive|--no-interactive] [--json]
  babysitter instructions:orchestrate --harness <name> [--interactive|--no-interactive] [--json]
  babysitter instructions:breakpoint-handling --harness <name> [--interactive|--no-interactive] [--json]
  babysitter mcp:serve [--json]
  babysitter health [--json] [--verbose]
  babysitter configure [show|validate|paths] [--json] [--defaults-only]
  babysitter version

Global flags:
  --runs-dir <dir>   Override the runs directory (defaults to .a5c/runs).
  --json             Emit JSON output when supported by the command.
  --dry-run          Describe planned mutations without changing on-disk state.
  --verbose          Log resolved paths and options to stderr for debugging.
  --show-config      Show current configuration before executing command.
  --help, -h         Show this help text.
  --version, -v      Show CLI version.`;

interface ParsedArgs {
  command?: string;
  runsDir: string;
  json: boolean;
  dryRun: boolean;
  verbose: boolean;
  helpRequested: boolean;
  pendingOnly: boolean;
  // compress-output command args
  compressOutputArgs?: string[];
  // compression command args
  compressionLayer?: string;
  compressionToggleValue?: boolean;
  compressionSetKey?: string;
  compressionSetValue?: string;
  kindFilter?: string;
  limit?: number;
  reverseOrder: boolean;
  filterType?: string;
  runDirArg?: string;
  effectId?: string;
  taskStatus?: "ok" | "error";
  valuePath?: string;
  valueInline?: string;
  errorPath?: string;
  stdoutRef?: string;
  stderrRef?: string;
  stdoutFile?: string;
  stderrFile?: string;
  startedAt?: string;
  finishedAt?: string;
  metadataPath?: string;
  invocationKey?: string;
  processId?: string;
  entrySpecifier?: string;
  inputsPath?: string;
  runIdOverride?: string;
  processRevision?: string;
  requestId?: string;
  iteration?: number;
  showConfig: boolean;
  defaultsOnly: boolean;
  configureSubcommand?: string;
  // Session command args
  sessionId?: string;
  stateDir?: string;
  maxIterations?: number;
  prompt?: string;
  lastIterationAt?: string;
  iterationTimes?: string;
  deleteSession?: boolean;
  timeout?: number;
  // session:last-message args
  transcriptPath?: string;
  // Hook command args
  hookType?: string;
  harness?: string;
  logFile?: string;
  // Skill command args
  pluginRoot?: string;
  cacheTtl?: number;
  sourceType?: "github" | "well-known";
  url?: string;
  includeRemote?: boolean;
  summaryOnly?: boolean;
  processPath?: string;
  // Process-library command args
  processLibraryRepo?: string;
  processLibraryDir?: string;
  processLibraryRef?: string;
  // Profile command flags
  profileUser?: boolean;
  profileProject?: boolean;
  profileInputPath?: string;
  profileDir?: string;
  // Plugin command flags
  pluginName?: string;
  pluginVersion?: string;
  marketplaceName?: string;
  marketplaceUrl?: string;
  marketplacePath?: string;
  marketplaceBranch?: string;
  pluginScope?: "global" | "project";
  pluginForce?: boolean;
  sessionForce?: boolean;
  // log command flags
  logType?: string;
  logMessage?: string;
  logLabel?: string;
  logLevel?: string;
  logSource?: string;
  // tokens:stats flags
  tokensAll?: boolean;
  tokensRunId?: string;
  // harness command flags
  positional?: string[];
  workspace?: string;
  model?: string;
  interactive?: boolean;
  // harness:retrospect flags
  retrospectAll?: boolean;
  runIds?: string[];
  // harness:cleanup flags
  keepDays?: number;
  // harness:anycli flags
  anycliService?: string;
  anycliScope?: string;
  anycliMcp?: boolean;
  anycliAuthFile?: string;
  anycliTransport?: string;
}

interface ActionSummary {
  effectId: string;
  kind: string;
  label?: string;
}

interface TaskListEntry {
  effectId: string;
  taskId: string;
  stepId: string;
  status: string;
  kind?: string;
  label?: string;
  labels?: string[];
  taskDefRef: string | null;
  inputsRef: string | null;
  resultRef: string | null;
  stdoutRef: string | null;
  stderrRef: string | null;
  requestedAt?: string;
  resolvedAt?: string;
}

/**
 * Maximum size for inline result preview.
 * @see DEFAULTS.largeResultPreviewLimit for the centralized default
 */
const LARGE_RESULT_PREVIEW_LIMIT = DEFAULTS.largeResultPreviewLimit;

function parseArgs(argv: string[]): ParsedArgs {
  const [initialCommand, ...rest] = argv;
  const parsed: ParsedArgs = {
    command: initialCommand,
    runsDir: process.env[CONFIG_ENV_VARS.RUNS_DIR] ?? DEFAULTS.runsDir,
    json: false,
    dryRun: false,
    verbose: false,
    helpRequested: false,
    pendingOnly: false,
    reverseOrder: false,
    showConfig: false,
    defaultsOnly: false,
  };
  if (parsed.command === "--help" || parsed.command === "-h") {
    parsed.command = undefined;
    parsed.helpRequested = true;
  }
  if (parsed.command === "--version" || parsed.command === "-v") {
    parsed.command = "version";
  }
  let positionals: string[] = [];
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--help" || arg === "-h") {
      parsed.helpRequested = true;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      parsed.command = "version";
      continue;
    }
    if (arg === "--runs-dir") {
      parsed.runsDir = expectFlagValue(rest, ++i, "--runs-dir");
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (arg === "--verbose") {
      parsed.verbose = true;
      continue;
    }
    if (arg === "--pending") {
      parsed.pendingOnly = true;
      continue;
    }
    if (arg === "--kind") {
      parsed.kindFilter = expectFlagValue(rest, ++i, "--kind");
      continue;
    }
    if (arg === "--limit") {
      const raw = expectFlagValue(rest, ++i, "--limit");
      parsed.limit = parsePositiveInteger(raw, "--limit");
      continue;
    }
    if (arg === "--iteration") {
      const raw = expectFlagValue(rest, ++i, "--iteration");
      parsed.iteration = parsePositiveInteger(raw, "--iteration");
      continue;
    }
    if (arg === "--reverse") {
      parsed.reverseOrder = true;
      continue;
    }
    if (arg === "--filter-type") {
      parsed.filterType = expectFlagValue(rest, ++i, "--filter-type");
      continue;
    }
    if (arg === "--status") {
      const raw = expectFlagValue(rest, ++i, "--status");
      const normalized = raw.toLowerCase();
      if (normalized !== "ok" && normalized !== "error") {
        throw new Error(`--status must be "ok" or "error" (received: ${raw})`);
      }
      parsed.taskStatus = normalized === "ok" ? "ok" : "error";
      continue;
    }
    if (arg === "--value") {
      parsed.valuePath = expectFlagValue(rest, ++i, "--value");
      continue;
    }
    if (arg === "--value-inline") {
      parsed.valueInline = expectFlagValue(rest, ++i, "--value-inline");
      continue;
    }
    if (arg === "--error") {
      parsed.errorPath = expectFlagValue(rest, ++i, "--error");
      continue;
    }
    if (arg === "--stdout-ref") {
      parsed.stdoutRef = expectFlagValue(rest, ++i, "--stdout-ref");
      continue;
    }
    if (arg === "--stderr-ref") {
      parsed.stderrRef = expectFlagValue(rest, ++i, "--stderr-ref");
      continue;
    }
    if (arg === "--stdout-file") {
      parsed.stdoutFile = expectFlagValue(rest, ++i, "--stdout-file");
      continue;
    }
    if (arg === "--stderr-file") {
      parsed.stderrFile = expectFlagValue(rest, ++i, "--stderr-file");
      continue;
    }
    if (arg === "--started-at") {
      parsed.startedAt = expectFlagValue(rest, ++i, "--started-at");
      continue;
    }
    if (arg === "--finished-at") {
      parsed.finishedAt = expectFlagValue(rest, ++i, "--finished-at");
      continue;
    }
    if (arg === "--metadata") {
      parsed.metadataPath = expectFlagValue(rest, ++i, "--metadata");
      continue;
    }
    if (arg === "--invocation-key") {
      parsed.invocationKey = expectFlagValue(rest, ++i, "--invocation-key");
      continue;
    }
    if (arg === "--process-id") {
      parsed.processId = expectFlagValue(rest, ++i, "--process-id");
      continue;
    }
    if (arg === "--entry") {
      parsed.entrySpecifier = expectFlagValue(rest, ++i, "--entry");
      continue;
    }
    if (arg === "--inputs") {
      parsed.inputsPath = expectFlagValue(rest, ++i, "--inputs");
      continue;
    }
    if (arg === "--run-id") {
      const rid = expectFlagValue(rest, ++i, "--run-id");
      parsed.runIdOverride = rid;
      if (!parsed.runIds) parsed.runIds = [];
      parsed.runIds.push(rid);
      continue;
    }
    if (arg === "--process-revision") {
      parsed.processRevision = expectFlagValue(rest, ++i, "--process-revision");
      continue;
    }
    if (arg === "--request") {
      parsed.requestId = expectFlagValue(rest, ++i, "--request");
      continue;
    }
    if (arg === "--show-config") {
      parsed.showConfig = true;
      continue;
    }
    if (arg === "--defaults-only") {
      parsed.defaultsOnly = true;
      continue;
    }
    // Session command flags
    if (arg === "--session-id") {
      // Tolerate empty/missing value — the harness adapter can auto-detect
      // session ID from BABYSITTER_SESSION_ID env var or CLAUDE_ENV_FILE.
      const next = rest[i + 1];
      if (next && !next.startsWith("-")) {
        parsed.sessionId = next;
        i++;
      }
      continue;
    }
    if (arg === "--state-dir") {
      parsed.stateDir = expectFlagValue(rest, ++i, "--state-dir");
      continue;
    }
    if (arg === "--max-iterations") {
      const raw = expectFlagValue(rest, ++i, "--max-iterations");
      parsed.maxIterations = parsePositiveInteger(raw, "--max-iterations");
      continue;
    }
    if (arg === "--prompt") {
      parsed.prompt = expectFlagValue(rest, ++i, "--prompt");
      continue;
    }
    if (arg === "--workspace") {
      parsed.workspace = expectFlagValue(rest, ++i, "--workspace");
      continue;
    }
    if (arg === "--model") {
      parsed.model = expectFlagValue(rest, ++i, "--model");
      continue;
    }
    if (arg === "--interactive") {
      parsed.interactive = true;
      continue;
    }
    if (arg === "--no-interactive" || arg === "--non-interactive") {
      parsed.interactive = false;
      continue;
    }
    if (arg === "--last-iteration-at") {
      parsed.lastIterationAt = expectFlagValue(rest, ++i, "--last-iteration-at");
      continue;
    }
    if (arg === "--iteration-times") {
      parsed.iterationTimes = expectFlagValue(rest, ++i, "--iteration-times");
      continue;
    }
    if (arg === "--timeout") {
      const raw = expectFlagValue(rest, ++i, "--timeout");
      parsed.timeout = parsePositiveInteger(raw, "--timeout");
      continue;
    }
    if (arg === "--delete") {
      parsed.deleteSession = true;
      continue;
    }
    if (arg === "--transcript-path") {
      parsed.transcriptPath = expectFlagValue(rest, ++i, "--transcript-path");
      continue;
    }
    // Hook command flags
    if (arg === "--hook-type") {
      parsed.hookType = expectFlagValue(rest, ++i, "--hook-type");
      continue;
    }
    if (arg === "--harness") {
      parsed.harness = expectFlagValue(rest, ++i, "--harness");
      continue;
    }
    if (arg === "--log-file") {
      parsed.logFile = expectFlagValue(rest, ++i, "--log-file");
      continue;
    }
    // Skill command flags
    if (arg === "--plugin-root") {
      parsed.pluginRoot = expectFlagValue(rest, ++i, "--plugin-root");
      continue;
    }
    if (arg === "--cache-ttl") {
      const raw = expectFlagValue(rest, ++i, "--cache-ttl");
      parsed.cacheTtl = parsePositiveInteger(raw, "--cache-ttl");
      continue;
    }
    if (arg === "--source-type") {
      const raw = expectFlagValue(rest, ++i, "--source-type");
      if (raw !== "github" && raw !== "well-known") {
        throw new Error(`--source-type must be "github" or "well-known" (received: ${raw})`);
      }
      parsed.sourceType = raw;
      continue;
    }
    if (arg === "--url") {
      parsed.url = expectFlagValue(rest, ++i, "--url");
      continue;
    }
    if (arg === "--repo") {
      parsed.processLibraryRepo = expectFlagValue(rest, ++i, "--repo");
      continue;
    }
    if (arg === "--ref") {
      parsed.processLibraryRef = expectFlagValue(rest, ++i, "--ref");
      continue;
    }
    if (arg === "--include-remote") {
      parsed.includeRemote = true;
      continue;
    }
    if (arg === "--summary-only") {
      parsed.summaryOnly = true;
      continue;
    }
    if (arg === "--process-path" || arg === "--process") {
      parsed.processPath = expectFlagValue(rest, ++i, arg);
      continue;
    }
    // Profile command flags
    if (arg === "--user") {
      parsed.profileUser = true;
      continue;
    }
    if (arg === "--project") {
      parsed.profileProject = true;
      parsed.pluginScope = "project";
      continue;
    }
    if (arg === "--input") {
      parsed.profileInputPath = expectFlagValue(rest, ++i, "--input");
      continue;
    }
    if (arg === "--dir") {
      const dir = expectFlagValue(rest, ++i, "--dir");
      parsed.profileDir = dir;
      parsed.processLibraryDir = dir;
      continue;
    }
    // Plugin command flags
    if (arg === "--plugin-name") {
      parsed.pluginName = expectFlagValue(rest, ++i, "--plugin-name");
      continue;
    }
    if (arg === "--plugin-version") {
      parsed.pluginVersion = expectFlagValue(rest, ++i, "--plugin-version");
      continue;
    }
    if (arg === "--marketplace-name") {
      parsed.marketplaceName = expectFlagValue(rest, ++i, "--marketplace-name");
      continue;
    }
    if (arg === "--marketplace-url") {
      parsed.marketplaceUrl = expectFlagValue(rest, ++i, "--marketplace-url");
      continue;
    }
    if (arg === "--marketplace-path") {
      parsed.marketplacePath = expectFlagValue(rest, ++i, "--marketplace-path");
      continue;
    }
    if (arg === "--marketplace-branch") {
      parsed.marketplaceBranch = expectFlagValue(rest, ++i, "--marketplace-branch");
      continue;
    }
    if (arg === "--force") {
      parsed.pluginForce = true;
      parsed.sessionForce = true;
      continue;
    }
    if (arg === "--global") {
      parsed.pluginScope = "global";
      continue;
    }
    // log command flags
    if (arg === "--type") {
      parsed.logType = expectFlagValue(rest, ++i, "--type");
      continue;
    }
    if (arg === "--message") {
      parsed.logMessage = expectFlagValue(rest, ++i, "--message");
      continue;
    }
    if (arg === "--label") {
      parsed.logLabel = expectFlagValue(rest, ++i, "--label");
      continue;
    }
    if (arg === "--level") {
      parsed.logLevel = expectFlagValue(rest, ++i, "--level");
      continue;
    }
    if (arg === "--source") {
      parsed.logSource = expectFlagValue(rest, ++i, "--source");
      continue;
    }
    // harness:anycli flags
    if (arg === "--service") {
      parsed.anycliService = expectFlagValue(rest, ++i, "--service");
      continue;
    }
    if (arg === "--scope") {
      parsed.anycliScope = expectFlagValue(rest, ++i, "--scope");
      continue;
    }
    if (arg === "--mcp") {
      parsed.anycliMcp = true;
      continue;
    }
    if (arg === "--auth-file") {
      parsed.anycliAuthFile = expectFlagValue(rest, ++i, "--auth-file");
      continue;
    }
    if (arg === "--transport") {
      parsed.anycliTransport = expectFlagValue(rest, ++i, "--transport");
      continue;
    }
    // harness:cleanup flags
    if (arg === "--keep-days") {
      const raw = expectFlagValue(rest, ++i, "--keep-days");
      parsed.keepDays = parsePositiveInteger(raw, "--keep-days");
      continue;
    }
    // tokens:stats flags
    if (arg === "--all") {
      parsed.tokensAll = true;
      parsed.retrospectAll = true;
      continue;
    }
    positionals.push(arg);
  }
  if (parsed.command === "task:post") {
    [parsed.runDirArg, parsed.effectId] = positionals;
  } else if (parsed.command === "task:list") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "task:show") {
    [parsed.runDirArg, parsed.effectId] = positionals;
  } else if (parsed.command === "run:status") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:iterate") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:events") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:rebuild-state") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "run:repair-journal") {
    [parsed.runDirArg] = positionals;
  } else if (parsed.command === "configure") {
    [parsed.configureSubcommand] = positionals;
  } else if (parsed.command?.startsWith("plugin:")) {
    // First positional is plugin name for plugin commands
    if (positionals.length > 0 && !parsed.pluginName) {
      parsed.pluginName = positionals[0];
    }
  } else if (parsed.command === "tokens:stats") {
    [parsed.tokensRunId] = positionals;
  } else if (parsed.command === "compression:toggle") {
    const [layer, onOff] = positionals;
    parsed.compressionLayer = layer;
    if (onOff !== undefined) {
      const normalized = onOff.toLowerCase();
      if (normalized !== "on" && normalized !== "off") {
        throw new Error(`compression:toggle value must be "on" or "off" (received: ${onOff})`);
      }
      parsed.compressionToggleValue = normalized === "on";
    }
  } else if (parsed.command === "compression:set") {
    const [key, value] = positionals;
    parsed.compressionSetKey = key;
    parsed.compressionSetValue = value;
  } else if (parsed.command === "compress-output") {
    parsed.compressOutputArgs = positionals;
  } else if (
    parsed.command === "harness:invoke" ||
    parsed.command === "harness:install" ||
    parsed.command === "harness:install-plugin" ||
    parsed.command === "harness:help"
  ) {
    parsed.positional = positionals;
  } else if (
    parsed.command === "harness:retrospect" ||
    parsed.command === "harness:doctor"
  ) {
    // First positional is optional run-id override
    if (positionals.length > 0 && !parsed.runIdOverride) {
      parsed.runIdOverride = positionals[0];
    }
  } else if (
    parsed.command === "harness:cleanup" ||
    parsed.command === "harness:assimilate" ||
    parsed.command === "harness:contrib" ||
    parsed.command === "harness:anycli" ||
    parsed.command === "harness:user-install" ||
    parsed.command === "harness:project-install"
  ) {
    // For harness:anycli, first positional matching a service name pattern becomes the service
    if (
      parsed.command === "harness:anycli" &&
      !parsed.anycliService &&
      positionals.length > 0 &&
      /^[a-zA-Z0-9-]+$/.test(positionals[0])
    ) {
      parsed.anycliService = positionals[0];
      positionals = positionals.slice(1);
    }
    // Positionals join as prompt text if no --prompt given
    if (positionals.length > 0 && !parsed.prompt) {
      parsed.prompt = positionals.join(" ");
    }
  }
  return parsed;
}

/**
 * Resolve a run directory from a base directory and a user-provided argument.
 *
 * Handles several common edge cases:
 *  - Absolute paths are used directly (no base dir prepended).
 *  - If the arg already contains the base dir prefix (e.g. ".a5c/runs/01RUN"
 *    when base is ".a5c/runs"), it is resolved from CWD to avoid doubling.
 *  - Doubled ".a5c/runs" segments in the final path are collapsed.
 *  - If the resolved path doesn't exist, falls back to resolving from CWD.
 */
function resolveRunDir(baseDir: string, runDirArg?: string): string {
  if (!runDirArg) throw new Error("Run directory argument is required.");

  // Absolute path → use directly
  if (path.isAbsolute(runDirArg)) {
    return collapseDoubledA5cRuns(path.normalize(runDirArg));
  }

  // Detect if arg already starts with the base dir prefix to avoid
  // ".a5c/runs" + ".a5c/runs/01RUN" → ".a5c/runs/.a5c/runs/01RUN"
  const normalBase = normalizePosix(baseDir);
  const normalArg = normalizePosix(runDirArg);
  if (normalBase && (normalArg === normalBase || normalArg.startsWith(normalBase + "/"))) {
    return collapseDoubledA5cRuns(path.resolve(runDirArg));
  }

  // Standard resolution: baseDir + arg
  const standard = collapseDoubledA5cRuns(path.resolve(baseDir, runDirArg));

  // Fallback: if the standard path doesn't exist, try from CWD
  try {
    if (!existsSync(standard)) {
      const fromCwd = path.resolve(runDirArg);
      if (existsSync(fromCwd)) return collapseDoubledA5cRuns(fromCwd);
    }
  } catch {
    // Ignore filesystem errors during resolution
  }

  return standard;
}

/** Normalize a path to forward slashes with no trailing slash (for prefix comparison). */
function normalizePosix(p: string): string {
  return path.normalize(p).replace(/\\/g, "/").replace(/\/+$/, "");
}

/** Collapse doubled ".a5c/runs" segments — delegates to shared utility. */
const collapseDoubledA5cRuns = _sharedCollapseDoubledA5cRuns;

function expectFlagValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function parsePositiveInteger(raw: string, flag: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return Math.floor(parsed);
}

function summarizeActions(actions: EffectAction[]): ActionSummary[] {
  return actions.map((action) => ({
    effectId: action.effectId,
    kind: action.kind,
    label: action.label,
  }));
}


function _logPendingActions(
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

function countActionsByKind(actions: EffectAction[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const action of actions) {
    counts.set(action.kind, (counts.get(action.kind) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function _enrichIterationMetadata(
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

function _logSleepHints(command: string, actions: EffectAction[]) {
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



function formatResolvedEntrypoint(importPath: string, exportName?: string) {
  return `${importPath}${exportName ? `#${exportName}` : ""}`;
}

function formatVerboseValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function allowSecretLogs(parsed: ParsedArgs): boolean {
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

function logVerbose(command: string, parsed: ParsedArgs, details: Record<string, unknown>) {
  if (!parsed.verbose) return;
  const formatted = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatVerboseValue(value)}`)
    .join(" ");
  console.error(`[${command}] verbose ${formatted}`);
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toRunRelativePosix(runDir: string, absolutePath?: string): string | undefined {
  if (!absolutePath) return undefined;
  return path.relative(runDir, absolutePath).replace(/\\/g, "/");
}

function normalizeArtifactRef(runDir: string, ref?: string | null): string | null {
  const absolute = resolveArtifactAbsolutePath(runDir, ref);
  if (!absolute) return null;
  const relative = toRunRelativePosix(runDir, absolute);
  return relative ?? null;
}

function resolveArtifactAbsolutePath(runDir: string, ref?: string | null): string | null {
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

type ArtifactCandidate = { absolute: string; relative: string; outsideRun: boolean };

function collectArtifactCandidates(runDir: string, ref: string): ArtifactCandidate[] {
  const seen = new Map<string, ArtifactCandidate>();
  const pushCandidate = (absolute: string) => {
    const normalizedAbs = path.normalize(absolute);
    const relative = path.relative(runDir, normalizedAbs).replace(/\\/g, "/");
    const outsideRun = relative.startsWith("..");
    seen.set(normalizedAbs, { absolute: normalizedAbs, relative, outsideRun });
  };

  pushCandidate(collapseDoubledA5cRuns(path.join(runDir, ref)));
  pushCandidate(path.resolve(ref));

  return Array.from(seen.values());
}

function defaultResultRef(effectId: string): string {
  return `tasks/${effectId}/result.json`;
}

function formatEntrypointSpecifier(entrypoint: { importPath: string; exportName: string }): string {
  return `${entrypoint.importPath}#${entrypoint.exportName}`;
}

function parseEntrypointSpecifier(specifier: string): { importPath: string; exportName?: string } {
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

type ModuleExports = Record<string, unknown>;

// Use an indirect dynamic import so TypeScript does not downlevel to require() in CommonJS builds.
// Vitest executes modules inside a VM context that requires direct import() support.
const dynamicImportModule: (specifier: string) => Promise<ModuleExports> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<ModuleExports>;
})();

function listModuleExports(mod: ModuleExports): string {
  const keys = Object.keys(mod);
  return keys.length > 0 ? keys.join(", ") : "(none)";
}

async function validateProcessEntrypoint(importPath: string, exportName?: string): Promise<void> {
  const resolvedPath = path.isAbsolute(importPath) ? importPath : resolveInputPath(importPath);
  try {
    await fs.access(resolvedPath);
  } catch (error) {
    throw new Error(
      `Process entry file not found: ${resolvedPath}. ` +
        `Ensure the path is correct and points to a valid JS/TS module.`
    );
  }

  const moduleUrl = pathToFileURL(resolvedPath).href;
  let mod: ModuleExports;
  try {
    mod = await dynamicImportModule(moduleUrl);
  } catch (error) {
    throw new Error(
      `Failed to load process module at ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const resolvedExportName = exportName ?? "process";
  const candidate =
    (resolvedExportName && mod[resolvedExportName]) ??
    mod.process ??
    mod.default;

  if (typeof candidate !== "function") {
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
}

async function readInputsFile(filePath: string): Promise<unknown> {
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


async function handleRunCreate(parsed: ParsedArgs): Promise<number> {
  if (!parsed.processId) {
    console.error("--process-id is required for run:create");
    console.error(USAGE);
    return 1;
  }
  if (!parsed.entrySpecifier) {
    console.error("--entry is required for run:create");
    console.error(USAGE);
    return 1;
  }
  let entrypoint;
  try {
    entrypoint = parseEntrypointSpecifier(parsed.entrySpecifier);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const runsDir = collapseDoubledA5cRuns(path.resolve(parsed.runsDir));
  const absoluteImportPath = path.resolve(entrypoint.importPath);
  const resolvedEntry = formatResolvedEntrypoint(absoluteImportPath, entrypoint.exportName);
  logVerbose("run:create", parsed, {
    runsDir,
    processId: parsed.processId,
    entry: resolvedEntry,
    dryRun: parsed.dryRun,
    json: parsed.json,
    request: parsed.requestId,
    prompt: parsed.prompt,
    processRevision: parsed.processRevision,
    runId: parsed.runIdOverride,
    inputsPath: parsed.inputsPath ? path.resolve(parsed.inputsPath) : undefined,
  });
  let inputs: unknown = undefined;
  if (parsed.inputsPath) {
    try {
      inputs = await readInputsFile(parsed.inputsPath);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }
  if (parsed.dryRun) {
    const summary = {
      dryRun: true,
      runsDir,
      processId: parsed.processId,
      entry: resolvedEntry,
      runId: parsed.runIdOverride ?? null,
      request: parsed.requestId ?? null,
      processRevision: parsed.processRevision ?? null,
      inputsPath: parsed.inputsPath ? path.resolve(parsed.inputsPath) : null,
    };
    if (parsed.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      const parts = [
        "[run:create] dry-run",
        `runsDir=${runsDir}`,
        `processId=${parsed.processId}`,
        `entry=${resolvedEntry}`,
        `runId=${summary.runId ?? "auto"}`,
      ];
      if (parsed.requestId) parts.push(`request=${parsed.requestId}`);
      if (parsed.processRevision) parts.push(`processRevision=${parsed.processRevision}`);
      if (summary.inputsPath) parts.push(`inputs=${summary.inputsPath}`);
      console.log(parts.join(" "));
    }
    return 0;
  }
  try {
    await validateProcessEntrypoint(absoluteImportPath, entrypoint.exportName);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const requestedHarness = parsed.harness ?? (parsed.sessionId ? getAdapter().name : undefined);
  const result = await createRun({
    runsDir,
    runId: parsed.runIdOverride,
    request: parsed.requestId,
    prompt: parsed.prompt,
    harness: requestedHarness,
    processRevision: parsed.processRevision,
    process: {
      processId: parsed.processId,
      importPath: absoluteImportPath,
      exportName: entrypoint.exportName,
    },
    inputs,
    ...(parsed.interactive === false ? { metadata: { nonInteractive: true } } : {}),
  });
  const entrySpec = formatEntrypointSpecifier(result.metadata.entrypoint);

  // --- Harness-specific session binding ---
  // Attempt session binding when --session-id is provided or --harness is
  // explicitly passed (the adapter resolves session IDs from env vars).
  const shouldBindSession = parsed.sessionId !== undefined || parsed.harness !== undefined;
  const adapter = shouldBindSession
    ? (parsed.harness ? getAdapterByName(parsed.harness) : getAdapter())
    : undefined;

  // Reject explicit --session-id when the adapter auto-resolves it.
  if (parsed.sessionId && adapter?.autoResolvesSessionId?.()) {
    const msg = `The "${adapter.name}" harness auto-detects session IDs. ` +
      `Do not pass --session-id explicitly when running inside ${adapter.name}.`;
    if (parsed.json) {
      console.log(JSON.stringify({ error: "SESSION_ID_CONFLICT", message: msg }));
    } else {
      process.stderr.write(`Error: ${msg}\n`);
    }
    return 1;
  }

  let sessionBound: SessionBindResult | undefined;

  if (adapter) {
    const sessionId = adapter.resolveSessionId(parsed);

    if (sessionId) {
      sessionBound = await adapter.bindSession({
        sessionId,
        runId: result.runId,
        runDir: result.runDir,
        pluginRoot: adapter.resolvePluginRoot(parsed),
        stateDir: parsed.stateDir,
        runsDir: parsed.runsDir,
        maxIterations: parsed.maxIterations,
        prompt: parsed.prompt ?? "",
        verbose: parsed.verbose,
        json: parsed.json,
      });
      } else {
        // --session-id or --harness was passed but the adapter could not resolve a session ID.
        sessionBound = {
          harness: parsed.harness ?? adapter.name,
          sessionId: "",
          error: (
            adapter.getMissingSessionIdHint?.() ??
            "No session ID provided. Use --session-id or set BABYSITTER_SESSION_ID."
          ),
        };
      }
  } else if (parsed.sessionId !== undefined && parsed.harness) {
    // --session-id requested an unknown explicit harness.
    sessionBound = {
      harness: parsed.harness,
      sessionId: "",
      error: `Unsupported harness: ${parsed.harness}`,
    };
  }

  // Discover available skills and agents for the new run
  // Try process-driven discovery first (reads @skill/@agent markers from process file)
  let discoveredSkills: Array<{ name: string; file?: string }> | undefined;
  let discoveredAgents: Array<{ name: string; file?: string }> | undefined;
  const discoverPluginRoot =
    parsed.pluginRoot ??
    adapter?.resolvePluginRoot(parsed);
  if (discoverPluginRoot) {
    try {
      const processDiscovery = discoverFromProcessFile({
        processFilePath: absoluteImportPath,
        pluginRoot: discoverPluginRoot,
      });

      if (processDiscovery) {
        discoveredSkills = processDiscovery.skills;
        discoveredAgents = processDiscovery.agents;
      } else {
        // Fallback to generic scan
        const discoverResult = await discoverSkillsInternal({
          pluginRoot: discoverPluginRoot,
          runId: result.runId,
          runsDir: parsed.runsDir,
          processPath: absoluteImportPath,
        });
        discoveredSkills = discoverResult.skills.map(s => ({ name: s.name, file: s.file }));
        discoveredAgents = discoverResult.agents.map(a => ({ name: a.name, file: a.file }));
      }
    } catch {
      // Non-fatal
    }
  }

  if (parsed.json) {
    const compactSkills = discoveredSkills
      ? { count: discoveredSkills.length, names: discoveredSkills.map(s => s.name) }
      : undefined;
    const compactAgents = discoveredAgents
      ? { count: discoveredAgents.length, names: discoveredAgents.map(a => a.name) }
      : undefined;
    console.log(JSON.stringify({
      runId: result.runId,
      runDir: result.runDir,
      entry: entrySpec,
      session: sessionBound ?? undefined,
      discoveredSkills: parsed.verbose ? discoveredSkills : compactSkills,
      discoveredAgents: parsed.verbose ? discoveredAgents : compactAgents,
    }, null, 2));
  } else {
    console.log(`[run:create] runId=${result.runId} runDir=${result.runDir} entry=${entrySpec}`);
    if (sessionBound?.error) {
      console.error(`[run:create] Session binding error: ${sessionBound.error}`);
    } else if (sessionBound) {
      console.log(`[run:create] session=${sessionBound.sessionId} bound via ${sessionBound.harness} stateFile=${sessionBound.stateFile}`);
    }
  }
  return sessionBound?.fatal ? 1 : 0;
}

type RunLifecycleState = "created" | "waiting" | "completed" | "failed";

async function handleRunStatus(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:status", parsed, {
    runDir,
    json: parsed.json,
  });
  const metadata = await readRunMetadataSafe(runDir, "run:status");
  if (!metadata) return 1;
  const journal = await loadJournalSafe(runDir, "run:status");
  if (!journal) return 1;
  const index = await buildEffectIndexSafe(runDir, "run:status", journal);
  if (!index) return 1;

  const pendingRecords = index.listPendingEffects();
  const pendingByKind = countPendingByKind(pendingRecords);
  const pendingTotal = pendingRecords.length;
  const stateSnapshot = await readStateCacheSafe(runDir, "run:status");
  const mergedMetadata = mergeMetadataSources(
    {
      pendingEffectsByKind: pendingByKind,
    },
    { snapshot: stateSnapshot, pendingByKind }
  );
  const formattedMetadata = formatIterationMetadata(mergedMetadata);
  const lastEvent = journal.at(-1);
  const lastLifecycleEvent = findLastLifecycleEvent(journal);
  const state = deriveRunState(lastLifecycleEvent?.type, pendingTotal);
  const lastSummary = formatLastEventSummary(lastEvent);

  const autoRunnableCount = pendingRecords.filter(r => r.kind === "node").length;
  const pendingEffectsSummary = {
    totalPending: pendingTotal,
    countsByKind: pendingByKind,
    autoRunnableCount,
  };
  const needsMoreIterations = state === "waiting" && autoRunnableCount > 0;

  if (parsed.json) {
    const completionProof = state === "completed" ? resolveCompletionProof(metadata) : null;
    console.log(
      JSON.stringify({
        state,
        lastEvent: lastEvent ? serializeJournalEvent(lastEvent, runDir) : null,
        pendingByKind,
        pendingEffectsSummary,
        needsMoreIterations,
        metadata: formattedMetadata.jsonMetadata ?? null,
        completionProof,
      })
    );
    return 0;
  }
  const suffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
  const completionProof = state === "completed" ? resolveCompletionProof(metadata) : undefined;
  const secretSuffix = completionProof ? ` completionProof=${completionProof}` : "";
  console.log(`[run:status] state=${state} last=${lastSummary}${suffix}${secretSuffix}`);
  return 0;
}

async function handleRunIterate(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:iterate", parsed, {
    runDir,
    iteration: parsed.iteration,
    json: parsed.json,
    verbose: parsed.verbose,
  });

  try {
    const result = await runIterate({
      runDir,
      iteration: parsed.iteration,
      verbose: parsed.verbose,
      json: parsed.json,
    });

    if (parsed.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const countInfo = result.count ? ` count=${result.count}` : "";
      const actionInfo = result.action ? ` action=${result.action}` : "";
      const progressInfo = result.iterationCount > 0 ? ` (${result.iterationCount} completed)` : "";
      console.log(`[run:iterate] iteration=${result.iteration}${progressInfo} status=${result.status}${actionInfo}${countInfo} reason=${result.reason}`);
      if (result.status === "completed" && result.completionProof) {
        console.log(`[run:iterate] completionProof=${result.completionProof}`);
      }

      if (result.status === "waiting" && result.until) {
        console.log(`[run:iterate] Waiting until: ${new Date(result.until).toISOString()}`);
      }
    }

    return 0;
  } catch (error) {
    console.error(`[run:iterate] Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

async function handleRunEvents(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:events", parsed, {
    runDir,
    json: parsed.json,
    limit: parsed.limit,
    reverse: parsed.reverseOrder,
    filterType: parsed.filterType,
  });
  if (!(await readRunMetadataSafe(runDir, "run:events"))) return 1;
  const stateSnapshot = await readStateCacheSafe(runDir, "run:events");
  const journal = await loadJournalSafe(runDir, "run:events");
  if (!journal) return 1;

  const filterType = parsed.filterType ? parsed.filterType.toUpperCase() : undefined;
  const filtered = filterType ? journal.filter((event) => event.type.toUpperCase() === filterType) : journal;
  const orderedBase = filtered.slice();
  const ordered = parsed.reverseOrder ? orderedBase.reverse() : orderedBase;
  const limited = parsed.limit !== undefined ? ordered.slice(0, parsed.limit) : ordered;

  const metadata = mergeMetadataSources(undefined, { snapshot: stateSnapshot });
  const formattedMetadata = formatIterationMetadata(metadata);
  if (parsed.json) {
    console.log(
      JSON.stringify({
        events: limited.map((event) => serializeJournalEvent(event, runDir)),
        metadata: formattedMetadata.jsonMetadata ?? null,
      })
    );
    return 0;
  }

  const headerParts = [
    `total=${journal.length}`,
    `matching=${filtered.length}`,
    `showing=${limited.length}`,
  ];
  if (filterType) headerParts.push(`filter=${filterType}`);
  if (parsed.limit) headerParts.push(`limit=${parsed.limit}`);
  if (parsed.reverseOrder) headerParts.push("order=desc");
  const metadataSuffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
  console.log(`[run:events] ${headerParts.join(" ")}${metadataSuffix}`);
  for (const event of limited) {
    console.log(`- ${formatEventLine(event)}`);
  }
  return 0;
}

async function handleRunRebuildState(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:rebuild-state", parsed, {
    runDir,
    dryRun: parsed.dryRun,
    json: parsed.json,
  });
  if (!(await readRunMetadataSafe(runDir, "run:rebuild-state"))) return 1;
  if (parsed.dryRun) {
    const plan = { dryRun: true, runDir, plan: "rebuild_state_cache", reason: "cli_manual" };
    if (parsed.json) {
      console.log(JSON.stringify(plan, null, 2));
    } else {
      console.log(`[run:rebuild-state] dry-run runDir=${runDir} plan=${plan.plan} reason=${plan.reason}`);
    }
    return 0;
  }
  const snapshot = await rebuildStateCache(runDir, { reason: "cli_manual" });
  const metadata: IterationMetadata = {
    pendingEffectsByKind: snapshot.pendingEffectsByKind,
    stateVersion: snapshot.stateVersion,
    journalHead: snapshot.journalHead ?? null,
    stateRebuilt: true,
    stateRebuildReason: snapshot.rebuildReason ?? undefined,
  };
  const formatted = formatIterationMetadata(metadata);
  if (parsed.json) {
    console.log(JSON.stringify({ runDir, metadata: formatted.jsonMetadata ?? null }, null, 2));
    return 0;
  }
  const suffix = formatted.textParts.length ? ` ${formatted.textParts.join(" ")}` : "";
  console.log(`[run:rebuild-state] runDir=${runDir}${suffix}`);
  return 0;
}

async function handleRunRepairJournal(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:repair-journal", parsed, {
    runDir,
    dryRun: parsed.dryRun,
    json: parsed.json,
  });
  if (!(await readRunMetadataSafe(runDir, "run:repair-journal"))) return 1;

  const journalDir = path.join(runDir, "journal");
  const files = (await fs.readdir(journalDir)).filter((name) => name.endsWith(".json")).sort();
  const rawEvents: Array<{ filename: string; payload: { type?: unknown; recordedAt?: unknown; data?: unknown } }> = [];
  let droppedCorrupt = 0;
  for (const filename of files) {
    const fullPath = path.join(journalDir, filename);
    let payload;
    try {
      payload = JSON.parse(await fs.readFile(fullPath, "utf8")) as { type?: unknown; recordedAt?: unknown; data?: unknown };
    } catch {
      droppedCorrupt++;
      continue;
    }
    rawEvents.push({ filename, payload });
  }

  const seenInvocation = new Set<string>();
  const keptEffectIds = new Set<string>();
  const droppedEffectIds = new Set<string>();
  const kept: Array<{ type: string; recordedAt?: string; data: JsonRecord }> = [];
  let droppedRequested = 0;
  let droppedResolved = 0;

  for (const entry of rawEvents) {
    const type = typeof entry.payload.type === "string" ? entry.payload.type : "UNKNOWN";
    const recordedAt = typeof entry.payload.recordedAt === "string" ? entry.payload.recordedAt : undefined;
    const data = isJsonRecord(entry.payload.data) ? entry.payload.data : {};

    if (type === "EFFECT_REQUESTED") {
      const invocationKey = typeof data.invocationKey === "string" ? data.invocationKey : "";
      const effectId = typeof data.effectId === "string" ? data.effectId : "";
      if (invocationKey && seenInvocation.has(invocationKey)) {
        droppedRequested += 1;
        if (effectId) droppedEffectIds.add(effectId);
        continue;
      }
      if (invocationKey) seenInvocation.add(invocationKey);
      if (effectId) keptEffectIds.add(effectId);
      kept.push({ type, recordedAt, data });
      continue;
    }

    if (type === "EFFECT_RESOLVED") {
      const effectId = typeof data.effectId === "string" ? data.effectId : "";
      if (effectId && droppedEffectIds.has(effectId) && !keptEffectIds.has(effectId)) {
        droppedResolved += 1;
        continue;
      }
      kept.push({ type, recordedAt, data });
      continue;
    }

    // Keep all other events.
    kept.push({ type, recordedAt, data });
  }

  const summary = {
    runDir,
    journal: {
      originalFiles: files.length,
      keptEvents: kept.length,
      droppedCorrupt,
      droppedRequested,
      droppedResolved,
    },
  };

  if (parsed.dryRun) {
    if (parsed.json) {
      console.log(JSON.stringify({ dryRun: true, ...summary }, null, 2));
    } else {
      console.log(
        `[run:repair-journal] dry-run originalFiles=${files.length} keptEvents=${kept.length} droppedCorrupt=${droppedCorrupt} droppedRequested=${droppedRequested} droppedResolved=${droppedResolved}`
      );
    }
    return 0;
  }

  const stamp = Date.now();
  const repairedDir = path.join(runDir, `journal.repaired.${stamp}`);
  await fs.mkdir(repairedDir, { recursive: true });

  for (let i = 0; i < kept.length; i += 1) {
    const seq = String(i + 1).padStart(6, "0");
    const ulid = nextUlid();
    const filename = `${seq}.${ulid}.json`;
    const eventPayload: JsonRecord = {
      type: kept[i].type,
      recordedAt: kept[i].recordedAt ?? new Date().toISOString(),
      data: kept[i].data,
    };
    const contents = JSON.stringify(eventPayload, null, 2) + "\n";
    const checksum = crypto.createHash("sha256").update(contents).digest("hex");
    const withChecksum = JSON.stringify({ ...eventPayload, checksum }, null, 2) + "\n";
    await fs.writeFile(path.join(repairedDir, filename), withChecksum, "utf8");
  }

  const backupDir = path.join(runDir, `journal.bak.${stamp}`);
  await fs.rename(journalDir, backupDir);
  await fs.rename(repairedDir, journalDir);

  if (parsed.json) {
    console.log(JSON.stringify({ ...summary, backupDir, repaired: true }, null, 2));
  } else {
    console.log(
      `[run:repair-journal] repaired originalFiles=${files.length} keptEvents=${kept.length} droppedCorrupt=${droppedCorrupt} droppedRequested=${droppedRequested} droppedResolved=${droppedResolved} backupDir=${backupDir}`
    );
  }
  return 0;
}

async function handleTaskPost(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  if (!parsed.taskStatus) {
    console.error(`[task:post] missing required --status <ok|error>`);
    return 1;
  }
  if (parsed.stdoutRef && parsed.stdoutFile) {
    console.error(`[task:post] cannot combine --stdout-ref with --stdout-file`);
    return 1;
  }
  if (parsed.stderrRef && parsed.stderrFile) {
    console.error(`[task:post] cannot combine --stderr-ref with --stderr-file`);
    return 1;
  }
  if (parsed.valuePath && parsed.valueInline) {
    console.error(`[task:post] cannot combine --value with --value-inline`);
    return 1;
  }
  if (parsed.taskStatus === "error" && parsed.valueInline) {
    console.error(`[task:post] --value-inline is only supported with --status ok`);
    return 1;
  }
  if (parsed.taskStatus === "ok" && !parsed.valuePath && !parsed.valueInline) {
    console.error(`[task:post] ok results require --value or --value-inline`);
    return 1;
  }

  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  const secretLogsAllowed = allowSecretLogs(parsed);
  logVerbose("task:post", parsed, {
    runDir,
    effectId: parsed.effectId,
    status: parsed.taskStatus,
    dryRun: parsed.dryRun,
    json: parsed.json,
    secretLogsAllowed,
  });

  const index = await buildEffectIndexSafe(runDir, "task:post");
  if (!index) return 1;
  const record = index.getByEffectId(parsed.effectId);
  if (!record) {
    console.error(`[task:post] effect ${parsed.effectId} not found at ${runDir}`);
    return 1;
  }
  if (record.status !== "requested") {
    console.error(`[task:post] effect ${parsed.effectId} is not requested (status=${record.status ?? "unknown"})`);
    return 1;
  }

  const nowIso = new Date().toISOString();
  const startedAt = parsed.startedAt ?? nowIso;
  const finishedAt = parsed.finishedAt ?? nowIso;

  const resolveMaybeRunRelative = (candidate?: string) => {
    if (!candidate) return undefined;
    if (candidate === "-") return candidate;
    if (path.isAbsolute(candidate) || /^[A-Za-z]:[\\/]/.test(candidate)) {
      return candidate;
    }
    // If candidate already starts with .a5c/, it's project-relative, not run-relative.
    // Joining with runDir would double the .a5c/runs/RUNID prefix.
    if (/^\.a5c[/\\]/.test(candidate)) {
      return candidate;
    }
    return _sharedCollapseDoubledA5cRuns(path.join(runDir, candidate));
  };

  const readJsonFile = async (_label: string, filename?: string): Promise<unknown> => {
    if (!filename) return undefined;
    if (filename === "-") {
      const raw = await readStdinUtf8();
      const trimmed = raw.trim();
      return trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
    }
    const absolute = resolveMaybeRunRelative(filename)!;
    const raw = await fs.readFile(absolute, "utf8");
    const trimmed = raw.trim();
    return trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
  };

  const readInlineJson = (raw?: string): unknown => {
    if (!raw) return undefined;
    const trimmed = raw.trim();
    return trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
  };

  const readTextFile = async (_label: string, filename?: string): Promise<string | undefined> => {
    if (!filename) return undefined;
    if (filename === "-") {
      return await readStdinUtf8();
    }
    const absolute = resolveMaybeRunRelative(filename)!;
    return await fs.readFile(absolute, "utf8");
  };

  const metadataRaw = await readJsonFile("metadata", parsed.metadataPath);
  const metadata: JsonRecord | undefined = isJsonRecord(metadataRaw) ? metadataRaw : undefined;
  const stdout = parsed.stdoutFile ? await readTextFile("stdout", parsed.stdoutFile) : undefined;
  const stderr = parsed.stderrFile ? await readTextFile("stderr", parsed.stderrFile) : undefined;

  let value: unknown = undefined;
  let errorPayload: unknown = undefined;
  if (parsed.taskStatus === "ok") {
    value = parsed.valueInline ? readInlineJson(parsed.valueInline) : await readJsonFile("value", parsed.valuePath);
  } else {
    errorPayload =
      (await readJsonFile("error", parsed.errorPath)) ??
      ({
        name: "Error",
        message: "Task reported failure",
      } as const);
  }

  const invocationKey = parsed.invocationKey ?? record.invocationKey;

  const plan = {
    runDir: toRunRelativePosix(runDir, runDir) ?? runDir,
    effectId: parsed.effectId,
    status: parsed.taskStatus,
    valueProvided: parsed.valuePath || parsed.valueInline ? true : false,
    errorProvided: parsed.errorPath ? true : false,
    stdoutRef: parsed.stdoutRef ?? null,
    stderrRef: parsed.stderrRef ?? null,
    stdoutFile: parsed.stdoutFile ?? null,
    stderrFile: parsed.stderrFile ?? null,
  };

  if (parsed.dryRun) {
    if (parsed.json) {
      console.log(JSON.stringify({ status: "skipped", dryRun: true, plan }, null, 2));
    } else {
      console.log(`[task:post] status=skipped`);
      console.error(`[task:post] dry-run plan ${JSON.stringify(plan)}`);
    }
    return 0;
  }

  const committed = await commitEffectResult({
    runDir,
    effectId: parsed.effectId,
    invocationKey,
    result:
      parsed.taskStatus === "ok"
        ? {
            status: "ok",
            value,
            stdout,
            stderr,
            stdoutRef: parsed.stdoutRef,
            stderrRef: parsed.stderrRef,
            startedAt,
            finishedAt,
            metadata,
          }
        : {
            status: "error",
            error: errorPayload,
            stdout,
            stderr,
            stdoutRef: parsed.stdoutRef,
            stderrRef: parsed.stderrRef,
            startedAt,
            finishedAt,
            metadata,
          },
  });

  const stdoutRef = normalizeArtifactRef(runDir, committed.stdoutRef) ?? null;
  const stderrRef = normalizeArtifactRef(runDir, committed.stderrRef) ?? null;
  const resultRef = normalizeArtifactRef(runDir, committed.resultRef) ?? null;

  if (parsed.json) {
    console.log(
      JSON.stringify({
        status: parsed.taskStatus,
        committed,
        stdoutRef,
        stderrRef,
        resultRef,
      })
    );
  } else {
    const parts = [`[task:post] status=${parsed.taskStatus}`];
    if (stdoutRef) parts.push(`stdoutRef=${stdoutRef}`);
    if (stderrRef) parts.push(`stderrRef=${stderrRef}`);
    if (resultRef) parts.push(`resultRef=${resultRef}`);
    console.log(parts.join(" "));
  }
  return parsed.taskStatus === "ok" ? 0 : 1;
}

async function handleTaskList(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("task:list", parsed, {
    runDir,
    json: parsed.json,
    pending: parsed.pendingOnly,
    kind: parsed.kindFilter,
  });
  const index = await buildEffectIndexSafe(runDir, "task:list");
  if (!index) return 1;

  const rawRecords = parsed.pendingOnly ? index.listPendingEffects() : index.listEffects();
  const records = rawRecords
    .filter((record) =>
      parsed.kindFilter ? record.kind?.toLowerCase() === parsed.kindFilter.toLowerCase() : true
    )
    .sort((a, b) => a.effectId.localeCompare(b.effectId));
  const entries = records.map((record) => toTaskListEntry(record, runDir));

  if (parsed.json) {
    console.log(JSON.stringify({ tasks: entries }, null, 2));
    return 0;
  }

  const scope = parsed.pendingOnly ? "pending" : "total";
  console.log(`[task:list] ${scope}=${entries.length}`);
  for (const entry of entries) {
    const label = entry.label ? ` ${entry.label}` : "";
    console.log(`- ${entry.effectId} [${entry.kind ?? "unknown"} ${entry.status}]${label} (taskId=${entry.taskId ?? "n/a"})`);
  }
  return 0;
}

async function handleTaskShow(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  const secretLogsAllowed = allowSecretLogs(parsed);
  logVerbose("task:show", parsed, {
    runDir,
    effectId: parsed.effectId,
    json: parsed.json,
    secretLogsAllowed,
  });
  const index = await buildEffectIndexSafe(runDir, "task:show");
  if (!index) return 1;

  const record = index.getByEffectId(parsed.effectId);
  if (!record) {
    console.error(`[task:show] effect ${parsed.effectId} not found in ${runDir}`);
    return 1;
  }

  const taskDef = await readTaskDefinition(runDir, parsed.effectId);
  if (!taskDef) {
    console.error(`[task:show] task definition missing for effect ${parsed.effectId}`);
    return 1;
  }
  const preview = await loadTaskResultPreview(runDir, parsed.effectId, record);
  const entry = toTaskListEntry(record, runDir);
  const inlineResult = preview.large ? null : preview.result ?? null;
  const largeResultRef = preview.large ? entry.resultRef ?? defaultResultRef(record.effectId) : null;

  if (parsed.json) {
    console.log(
      JSON.stringify({
        effect: entry,
        task: secretLogsAllowed ? taskDef : null,
        result: secretLogsAllowed ? inlineResult : null,
        largeResult: largeResultRef,
      })
    );
    return 0;
  }

  console.log(
    `[task:show] ${entry.effectId} [${entry.kind ?? "unknown"} ${entry.status}] ${entry.label ?? "(no label)"} (taskId=${
      entry.taskId
    })`
  );
  console.log(`  stepId=${entry.stepId} requestedAt=${entry.requestedAt ?? "n/a"} resolvedAt=${entry.resolvedAt ?? "n/a"}`);
  console.log(`  taskDefRef=${entry.taskDefRef ?? "n/a"}`);
  console.log(`  inputsRef=${entry.inputsRef ?? "n/a"}`);
  console.log(`  resultRef=${entry.resultRef ?? "n/a"}`);
  console.log(`  stdoutRef=${entry.stdoutRef ?? "n/a"}`);
  console.log(`  stderrRef=${entry.stderrRef ?? "n/a"}`);
  if (!secretLogsAllowed) {
    console.log(
      "  payloads: redacted (set BABYSITTER_ALLOW_SECRET_LOGS=true and rerun with --json --verbose to view task/result blobs)"
    );
    if (!inlineResult && !preview.large) {
      console.log("  result: (not yet written)");
    }
    return 0;
  }
  console.log("  taskDef:", JSON.stringify(taskDef, null, 2));
  if (preview.large) {
    console.log(`  result: see ${largeResultRef ?? entry.resultRef ?? defaultResultRef(record.effectId)}`);
  } else if (inlineResult) {
    console.log("  result:", JSON.stringify(inlineResult, null, 2));
  } else {
    console.log("  result: (not yet written)");
  }
  return 0;
}

function toTaskListEntry(record: EffectRecord, runDir: string): TaskListEntry {
  return {
    effectId: record.effectId,
    taskId: record.taskId ?? "unknown",
    stepId: record.stepId ?? "unknown",
    status: record.status ?? "unknown",
    kind: record.kind,
    label: record.label,
    labels: record.labels,
    taskDefRef: normalizeArtifactRef(runDir, record.taskDefRef ?? `tasks/${record.effectId}/task.json`),
    inputsRef: normalizeArtifactRef(runDir, record.inputsRef),
    resultRef: normalizeArtifactRef(runDir, record.resultRef),
    stdoutRef: normalizeArtifactRef(runDir, record.stdoutRef),
    stderrRef: normalizeArtifactRef(runDir, record.stderrRef),
    requestedAt: record.requestedAt,
    resolvedAt: record.resolvedAt,
  };
}

async function buildEffectIndexSafe(runDir: string, command: string, events?: JournalEvent[]) {
  try {
    return await buildEffectIndex({ runDir, events });
  } catch (error) {
    console.error(
      `[${command}] unable to read run at ${runDir}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

async function readRunMetadataSafe(runDir: string, command: string): Promise<RunMetadata | null> {
  try {
    return await readRunMetadata(runDir);
  } catch (error) {
    console.error(
      `[${command}] unable to read run metadata at ${runDir}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

async function loadJournalSafe(runDir: string, command: string): Promise<JournalEvent[] | null> {
  try {
    return await loadJournal(runDir);
  } catch (error) {
    console.error(
      `[${command}] unable to read journal at ${runDir}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

async function readStateCacheSafe(runDir: string, command: string): Promise<StateCacheSnapshot | null> {
  try {
    const snapshot = await readStateCache(runDir);
    if (!snapshot) {
      console.warn(`[${command}] state cache snapshot missing at ${runDir} (continuing without metadata)`);
      return null;
    }
    return snapshot;
  } catch (error) {
    console.warn(
      `[${command}] unable to read state cache at ${runDir}: ${
        error instanceof Error ? error.message : String(error)
      } (continuing without metadata)`
    );
    return null;
  }
}

const RUN_LIFECYCLE_TYPES: ReadonlySet<JournalEvent["type"]> = new Set([
  "RUN_CREATED",
  "RUN_COMPLETED",
  "RUN_FAILED",
]);

function findLastLifecycleEvent(events: JournalEvent[]): JournalEvent | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (RUN_LIFECYCLE_TYPES.has(event.type)) {
      return event;
    }
  }
  return undefined;
}

function countPendingByKind(records: EffectRecord[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const key = record.kind ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

async function loadTaskResultPreview(
  runDir: string,
  effectId: string,
  record: EffectRecord
): Promise<{ result?: StoredTaskResult; large: boolean }> {
  const absolutePath = resolveArtifactAbsolutePath(runDir, record.resultRef ?? defaultResultRef(effectId));
  if (!absolutePath) return { result: undefined, large: false };
  try {
    const stats = await fs.stat(absolutePath);
    if (stats.size > LARGE_RESULT_PREVIEW_LIMIT) {
      return { result: undefined, large: true };
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return { result: undefined, large: false };
    }
    throw error;
  }
  const data = await readTaskResult(runDir, effectId, record.resultRef);
  return { result: data ?? undefined, large: false };
}

async function readStdinUtf8(): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });
}

function deriveRunState(
  lastLifecycleEventType: JournalEvent["type"] | undefined,
  pendingTotal: number
): RunLifecycleState {
  if (lastLifecycleEventType === "RUN_COMPLETED") return "completed";
  if (lastLifecycleEventType === "RUN_FAILED") return "failed";
  if (pendingTotal > 0) return "waiting";
  return "created";
}

function formatLastEventSummary(event?: JournalEvent): string {
  if (!event) return "none";
  return `${event.type}#${formatSeq(event.seq)} ${event.recordedAt}`;
}

function mergeMetadataSources(
  metadata: IterationMetadata | undefined,
  options: { snapshot?: StateCacheSnapshot | null; pendingByKind?: Record<string, number> }
): IterationMetadata | undefined {
  const snapshot = options.snapshot ?? null;
  const hasPendingOverride = options.pendingByKind !== undefined;
  const snapshotHasInfo = Boolean(snapshot);
  if (!metadata && !hasPendingOverride && !snapshotHasInfo) {
    return undefined;
  }
  const next: IterationMetadata = { ...(metadata ?? {}) };
  if (hasPendingOverride) {
    next.pendingEffectsByKind = { ...(options.pendingByKind ?? {}) };
  } else if (!next.pendingEffectsByKind && snapshot) {
    next.pendingEffectsByKind = { ...snapshot.pendingEffectsByKind };
  }
  if (snapshot) {
    if (next.stateVersion === undefined) {
      next.stateVersion = snapshot.stateVersion;
    }
    if (next.journalHead === undefined) {
      next.journalHead = snapshot.journalHead ?? null;
    }
    if (snapshot.rebuildReason) {
      next.stateRebuilt = true;
      if (!next.stateRebuildReason) {
        next.stateRebuildReason = snapshot.rebuildReason;
      }
    }
  }
  if (
    next.stateVersion === undefined &&
    next.stateRebuilt === undefined &&
    next.pendingEffectsByKind === undefined &&
    next.journalHead === undefined
  ) {
    return undefined;
  }
  return next;
}

function formatIterationMetadata(
  metadata?: IterationMetadata
): { textParts: string[]; jsonMetadata?: IterationMetadata } {
  const textParts: string[] = [];
  if (!metadata) {
    return { textParts, jsonMetadata: undefined };
  }
  if (metadata.stateVersion !== undefined) {
    textParts.push(`stateVersion=${metadata.stateVersion}`);
  }
  if (metadata.journalHead && typeof metadata.journalHead.seq === "number") {
    const seq = formatSeq(metadata.journalHead.seq);
    textParts.push(`journalHead=#${seq}`);
    if (metadata.journalHead.ulid) {
      textParts.push(`journalHead.ulid=${metadata.journalHead.ulid}`);
    }
    if (metadata.journalHead.checksum) {
      textParts.push(`journalHead.checksum=${metadata.journalHead.checksum}`);
    }
  }
  if (metadata.stateRebuilt) {
    const reasonSuffix = metadata.stateRebuildReason ? `(${metadata.stateRebuildReason})` : "";
    textParts.push(`stateRebuilt=true${reasonSuffix}`);
  }
  if (metadata.pendingEffectsByKind) {
    const pendingEntries = Object.entries(metadata.pendingEffectsByKind).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const pendingTotal = pendingEntries.reduce((sum, [, count]) => sum + count, 0);
    textParts.push(`pending[total]=${pendingTotal}`);
    for (const [kind, count] of pendingEntries) {
      textParts.push(`pending[${kind}]=${count}`);
    }
  }
  return { textParts, jsonMetadata: metadata };
}

function serializeJournalEvent(event: JournalEvent, runDir: string) {
  const data = ensureIterationMetadata(event.data);
  return {
    seq: event.seq,
    ulid: event.ulid,
    type: event.type,
    recordedAt: event.recordedAt,
    filename: event.filename,
    path: toRunRelativePosix(runDir, event.path),
    data,
  };
}

function ensureIterationMetadata(data: Record<string, unknown>): Record<string, unknown> {
  const iteration = data.iteration;
  if (!iteration || typeof iteration !== "object" || Array.isArray(iteration)) {
    return data;
  }
  const iterationRecord = iteration as Record<string, unknown>;
  const metadata = iterationRecord.metadata;
  return {
    ...data,
    iteration: {
      ...iterationRecord,
      metadata: metadata === undefined ? null : metadata,
    },
  };
}

function formatEventLine(event: JournalEvent): string {
  return `#${formatSeq(event.seq)} ${event.type} ${event.recordedAt}`;
}

function formatSeq(seq: number): string {
  return seq.toString().padStart(6, "0");
}

async function readCliVersion(): Promise<string> {
  const packagePath = path.join(__dirname, "..", "..", "package.json");
  const raw = await fs.readFile(packagePath, "utf8");
  const parsed = JSON.parse(raw) as { version?: string };
  return parsed.version ?? "unknown";
}

/**
 * Checks if stdout/stderr supports colors
 */
function supportsColors(): boolean {
  // Check NO_COLOR environment variable (https://no-color.org/)
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }
  // Check FORCE_COLOR environment variable
  if (process.env.FORCE_COLOR !== undefined) {
    return true;
  }
  // Check if running in a TTY
  if (process.stderr && typeof process.stderr.isTTY === "boolean") {
    return process.stderr.isTTY;
  }
  return false;
}

/**
 * Valid CLI commands
 */
const VALID_COMMANDS = [
  "run:create",
  "run:status",
  "run:iterate",
  "run:events",
  "run:rebuild-state",
  "run:repair-journal",
  "task:post",
  "task:list",
  "task:show",
  "session:init",
  "session:associate",
  "session:resume",
  "session:state",
  "session:update",
  "session:check-iteration",
  "session:last-message",
  "session:iteration-message",
  "harness:create-run",
  "harness:call",
  "harness:yolo",
  "harness:plan",
  "harness:forever",
  "harness:resume-run",
  "harness:resume",
  "harness:retrospect",
  "harness:cleanup",
  "harness:assimilate",
  "harness:doctor",
  "harness:contrib",
  "harness:anycli",
  "harness:help",
  "harness:observe",
  "harness:user-install",
  "harness:project-install",
  "log",
  "hook:log",
  "hook:run",
  "skill:discover",
  "skill:fetch-remote",
  "process-library:clone",
  "process-library:update",
  "process-library:use",
  "process-library:active",
  "profile:read",
  "profile:write",
  "profile:merge",
  "profile:render",
  "plugin:install",
  "plugin:uninstall",
  "plugin:update",
  "plugin:configure",
  "plugin:list-installed",
  "plugin:list-plugins",
  "plugin:add-marketplace",
  "plugin:update-marketplace",
  "plugin:update-registry",
  "plugin:remove-from-registry",
  "harness:discover",
  "harness:list",
  "harness:install",
  "harness:install-plugin",
  "harness:invoke",
  "instructions:babysit-skill",
  "instructions:process-create",
  "instructions:orchestrate",
  "instructions:breakpoint-handling",
  "mcp:serve",
  "health",
  "configure",
  "tokens:stats",
  "compression:status",
  "compression:toggle",
  "compression:set",
  "compression:reset",
  "compress-output",
  "version",
];

/**
 * Handles unknown commands with suggestions
 */
// ---------------------------------------------------------------------------
// Harness commands
// ---------------------------------------------------------------------------

function handleHarnessHelp(parsed: ParsedArgs): number {
  const topic = parsed.positional?.join(" ")?.trim();
  const colors = supportsColors();
  const bold = colors ? "\x1b[1m" : "";
  const dim = colors ? "\x1b[2m" : "";
  const reset = colors ? "\x1b[0m" : "";
  const cyan = colors ? "\x1b[36m" : "";

  if (topic) {
    // Topic-specific help would require reading files — for now, direct to docs
    console.log(`\n${bold}Babysitter Help: ${topic}${reset}\n`);
    console.log(`For detailed documentation on "${topic}", see:`);
    console.log(`  https://github.com/a5c-ai/babysitter\n`);
    console.log(`Or run: ${cyan}babysitter skill:discover --plugin-root <plugin-root> --json${reset}`);
    console.log(`to find available skills, agents, and processes.\n`);
    return 0;
  }

  console.log(`
${bold}Welcome to the Babysitter Help Center!${reset}

${bold}PRIMARY COMMANDS${reset}

  ${cyan}harness:call${reset} [--prompt <text>]         Start a babysitter-orchestrated run
  ${cyan}harness:resume${reset} [--run-id <id>]         Resume a paused/interrupted run
  ${cyan}harness:yolo${reset} [--prompt <text>]          Autonomous mode (all breakpoints auto-approved)
  ${cyan}harness:plan${reset} [--prompt <text>]          Generate plan without executing
  ${cyan}harness:forever${reset} [--prompt <text>]       Infinite loop process with sleep intervals

${bold}SECONDARY COMMANDS${reset}

  ${cyan}harness:doctor${reset} [--run-id <id>]          10-point health check on a run
  ${cyan}harness:retrospect${reset} [--run-id <id>...] [--all]  Analyze runs, suggest improvements
  ${cyan}harness:cleanup${reset} [--keep-days <n>]       Clean up old runs and orphaned processes
  ${cyan}harness:assimilate${reset} [--prompt <text>]     Convert external methodology to babysitter processes
  ${cyan}harness:contrib${reset} [--prompt <text>]        Submit feedback or contribute to babysitter
  ${cyan}harness:anycli${reset} --service <name>         Generate CLI/MCP tools for any service
  ${cyan}harness:user-install${reset}                     First-time user onboarding
  ${cyan}harness:project-install${reset}                  Onboard a project for babysitter
  ${cyan}harness:observe${reset}                          Launch real-time observer dashboard
  ${cyan}harness:help${reset} [<topic>]                   Show this help text

${bold}LOW-LEVEL COMMANDS${reset}

  ${cyan}harness:discover${reset}                         Detect installed harness CLIs
  ${cyan}harness:invoke${reset} <name> --prompt <text>    Invoke a harness CLI directly
  ${cyan}harness:install${reset} <name>                   Install a harness
  ${cyan}harness:install-plugin${reset} <name>            Install harness plugin

${dim}Documentation: https://github.com/a5c-ai/babysitter${reset}
`);
  return 0;
}

async function handleHarnessObserve(parsed: ParsedArgs): Promise<number> {
  const { spawn } = await import("node:child_process");
  const watchDir = parsed.workspace ?? path.resolve(process.cwd(), "..");

  const colors = supportsColors();
  const bold = colors ? "\x1b[1m" : "";
  const dim = colors ? "\x1b[2m" : "";
  const reset = colors ? "\x1b[0m" : "";

  process.stderr.write(`${bold}Launching babysitter observer dashboard...${reset}\n`);
  process.stderr.write(`${dim}Watching: ${watchDir}${reset}\n\n`);

  const child = spawn(
    "npx",
    ["-y", "@a5c-ai/babysitter-observer-dashboard@latest", "--watch-dir", watchDir],
    { stdio: "inherit", shell: true },
  );

  return new Promise<number>((resolve) => {
    child.on("close", (code) => resolve(code ?? 0));
    child.on("error", (err) => {
      process.stderr.write(`Failed to launch observer: ${err.message}\n`);
      resolve(1);
    });
  });
}

async function handleHarnessDiscover(parsed: ParsedArgs): Promise<number> {
  const { discoverHarnesses, detectCallerHarness } = await import("../harness/discovery");
  const results = await discoverHarnesses();
  const caller = detectCallerHarness();

  if (parsed.json) {
    console.log(JSON.stringify({ installed: results, caller }, null, 2));
  } else {
    const colors = supportsColors();
    const green = colors ? "\x1b[32m" : "";
    const reset = colors ? "\x1b[0m" : "";
    const bold = colors ? "\x1b[1m" : "";

    console.log(`\n${bold}Installed Harnesses${reset}\n`);
    console.log(
      "  Name            Installed  Version          Config   Capabilities",
    );
    console.log(
      "  ──────────────  ─────────  ───────────────  ───────  ────────────────────────",
    );
    for (const r of results) {
      const version = (r.version ?? "-").padEnd(15);
      const caps = r.capabilities.join(", ") || "-";
      console.log(
        `  ${r.name.padEnd(14)}  ${(r.installed ? "yes" : "no").padEnd(9)}  ${version}  ${(r.configFound ? "yes" : "no").padEnd(7)}  ${caps}`,
      );
    }

    if (caller) {
      console.log(`\n${bold}Caller Harness${reset}  ${green}${caller.name}${reset}  (env: ${caller.matchedEnvVars.join(", ")})`);
    } else {
      console.log(`\n${bold}Caller Harness${reset}  none detected`);
    }
    console.log("");
  }
  return 0;
}

async function handleHarnessInvoke(parsed: ParsedArgs): Promise<number> {
  const { invokeHarness } = await import("../harness/invoker");

  const harnessName = parsed.positional?.[0];
  if (!harnessName) {
    const error = new BabysitterRuntimeError(
      "MissingArgument",
      "harness:invoke requires a harness name as the first argument",
      {
        category: ErrorCategory.Validation,
        suggestions: ["babysitter harness:invoke claude-code --prompt \"hello\""],
      },
    );
    if (parsed.json) {
      console.error(JSON.stringify(toStructuredError(error), null, 2));
    } else {
      console.error(formatErrorWithContext(error, { colors: supportsColors() }));
    }
    return 1;
  }

  const prompt = parsed.prompt;
  if (!prompt) {
    const error = new BabysitterRuntimeError(
      "MissingArgument",
      "harness:invoke requires --prompt <text>",
      {
        category: ErrorCategory.Validation,
        suggestions: [`babysitter harness:invoke ${harnessName} --prompt "your prompt"`],
      },
    );
    if (parsed.json) {
      console.error(JSON.stringify(toStructuredError(error), null, 2));
    } else {
      console.error(formatErrorWithContext(error, { colors: supportsColors() }));
    }
    return 1;
  }

  try {
    const result = await invokeHarness(harnessName, {
      prompt,
      workspace: parsed.workspace,
      model: parsed.model,
      timeout: parsed.timeout ? Number(parsed.timeout) : undefined,
    });

    if (parsed.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      if (result.success) {
        console.log(result.output);
      } else {
        console.error(result.output);
      }
    }
    return result.success ? 0 : 1;
  } catch (err: unknown) {
    if (parsed.json) {
      const structured = err instanceof BabysitterRuntimeError
        ? toStructuredError(err)
        : { error: err instanceof Error ? err.message : String(err) };
      console.error(JSON.stringify(structured, null, 2));
    } else {
      if (err instanceof BabysitterRuntimeError) {
        console.error(formatErrorWithContext(err, { colors: supportsColors() }));
      } else {
        console.error(err instanceof Error ? err.message : String(err));
      }
    }
    return 1;
  }
}

function handleUnknownCommand(command: string, json: boolean): number {
  const suggestion = suggestCommand(command);
  const suggestions = suggestion ? [`Did you mean: ${suggestion}?`] : [];
  const nextSteps = ["Run with --help to see all available commands"];

  const error = new BabysitterRuntimeError("UnknownCommandError", `Unknown command: ${command}`, {
    category: ErrorCategory.Validation,
    suggestions,
    nextSteps,
    details: { command, validCommands: VALID_COMMANDS },
  });

  if (json) {
    console.error(JSON.stringify(toStructuredError(error), null, 2));
  } else {
    const colors = supportsColors();
    console.error(formatErrorWithContext(error, { colors }));
  }

  return 1;
}

/**
 * Shows configuration before executing a command when --show-config is provided
 */
async function showConfigBeforeCommand(parsed: ParsedArgs): Promise<void> {
  const { configureShow } = await import("./commands/configure");
  const result = configureShow({ json: parsed.json, defaultsOnly: false });

  if (parsed.json) {
    console.error(JSON.stringify({ showConfig: result }, null, 2));
  } else {
    console.error("[show-config] Current effective configuration:");
    for (const item of result.values) {
      const sourceTag = item.source === "env" ? " (env)" : "";
      console.error(`  ${item.key}=${formatVerboseValue(item.value)}${sourceTag}`);
    }
    console.error("");
  }
}

/**
 * Formats and outputs an error in the appropriate format
 */
function outputError(error: Error, options: { json: boolean; verbose?: boolean }): void {
  const { json, verbose = false } = options;

  if (json) {
    console.error(JSON.stringify(toStructuredError(error, verbose)));
  } else {
    const colors = supportsColors();

    if (isBabysitterError(error)) {
      console.error(formatErrorWithContext(error, { colors, includeStack: verbose }));
    } else {
      // For non-babysitter errors, wrap them with basic formatting
      const wrappedError = new BabysitterRuntimeError(error.name || "Error", error.message, {
        category: ErrorCategory.Internal,
        nextSteps: ["If this error persists, please report it as a bug"],
      });
      console.error(formatErrorWithContext(wrappedError, { colors, includeStack: verbose }));
    }
  }
}

// Exported for unit testing
export { resolveRunDir as _resolveRunDir, collapseDoubledA5cRuns as _collapseDoubledA5cRuns };

export function createBabysitterCli() {
  return {
    async run(argv: string[] = process.argv.slice(2)): Promise<number> {
      let parsedJson = false;
      let parsedVerbose = false;

      try {
        const parsed = parseArgs(argv);
        parsedJson = parsed.json;
        parsedVerbose = parsed.verbose;

        if (parsed.command === "version") {
          console.log(await readCliVersion());
          return 0;
        }
        if (!parsed.command || parsed.helpRequested) {
          console.log(USAGE);
          return 0;
        }

        // Show config if --show-config flag is provided
        if (parsed.showConfig) {
          await showConfigBeforeCommand(parsed);
        }

        // Check for valid commands and provide suggestions for unknown ones
        if (!VALID_COMMANDS.includes(parsed.command)) {
          return handleUnknownCommand(parsed.command, parsed.json);
        }

        if (parsed.command === "run:create") {
          return await handleRunCreate(parsed);
        }
        if (parsed.command === "run:rebuild-state") {
          return await handleRunRebuildState(parsed);
        }
        if (parsed.command === "run:repair-journal") {
          return await handleRunRepairJournal(parsed);
        }
        if (parsed.command === "run:status") {
          return await handleRunStatus(parsed);
        }
        if (parsed.command === "run:iterate") {
          return await handleRunIterate(parsed);
        }
        if (parsed.command === "run:events") {
          return await handleRunEvents(parsed);
        }
        if (parsed.command === "task:post") {
          return await handleTaskPost(parsed);
        }
        if (parsed.command === "task:list") {
          return await handleTaskList(parsed);
        }
        if (parsed.command === "task:show") {
          return await handleTaskShow(parsed);
        }
        // Session commands — resolve sessionId via harness adapter.
        if (parsed.command?.startsWith("session:")) {
          const sessionAdapter = parsed.harness
            ? getAdapterByName(parsed.harness)
            : getAdapter();

          // Reject explicit --session-id when the adapter auto-resolves it
          // from environment variables (e.g. claude-code, codex, pi).
          if (parsed.sessionId && sessionAdapter?.autoResolvesSessionId?.()) {
            const msg = `The "${sessionAdapter.name}" harness auto-detects session IDs from environment variables. ` +
              `Do not pass --session-id explicitly when running inside ${sessionAdapter.name}.`;
            if (parsed.json) {
              console.log(JSON.stringify({ error: "SESSION_ID_CONFLICT", message: msg }));
            } else {
              process.stderr.write(`Error: ${msg}\n`);
            }
            return 1;
          }

          // Auto-resolve when not explicitly provided.
          if (!parsed.sessionId && sessionAdapter) {
            const resolved = sessionAdapter.resolveSessionId(parsed);
            if (resolved) {
              parsed.sessionId = resolved;
            }
          }
        }
        if (parsed.command === "session:init") {
          return await handleSessionInit({
            sessionId: parsed.sessionId,
            stateDir: parsed.stateDir,
            maxIterations: parsed.maxIterations,
            runId: parsed.runIdOverride,
            prompt: parsed.prompt,
            json: parsed.json,
          });
        }
        if (parsed.command === "session:associate") {
          return await handleSessionAssociate({
            sessionId: parsed.sessionId,
            stateDir: parsed.stateDir,
            runId: parsed.runIdOverride,
            force: parsed.sessionForce,
            runsDir: parsed.runsDir,
            json: parsed.json,
          });
        }
        if (parsed.command === "session:resume") {
          return await handleSessionResume({
            sessionId: parsed.sessionId,
            stateDir: parsed.stateDir,
            runId: parsed.runIdOverride,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
          });
        }
        if (parsed.command === "session:state") {
          return await handleSessionState({
            sessionId: parsed.sessionId,
            stateDir: parsed.stateDir,
            json: parsed.json,
          });
        }
        if (parsed.command === "session:update") {
          return await handleSessionUpdate({
            sessionId: parsed.sessionId,
            stateDir: parsed.stateDir,
            iteration: parsed.iteration,
            lastIterationAt: parsed.lastIterationAt,
            iterationTimes: parsed.iterationTimes,
            delete: parsed.deleteSession,
            json: parsed.json,
          });
        }
        if (parsed.command === "session:check-iteration") {
          return await handleSessionCheckIteration({
            sessionId: parsed.sessionId,
            stateDir: parsed.stateDir,
            json: parsed.json,
          });
        }
        if (parsed.command === "session:last-message") {
          if (!parsed.transcriptPath) {
            console.error("--transcript-path is required for session:last-message");
            console.error(USAGE);
            return 1;
          }
          return handleSessionLastMessage({
            transcriptPath: parsed.transcriptPath,
            json: parsed.json,
          });
        }
        if (parsed.command === "session:iteration-message") {
          return await handleSessionIterationMessage({
            iteration: parsed.iteration,
            runId: parsed.runIdOverride,
            runsDir: parsed.runsDir,
            pluginRoot: parsed.pluginRoot,
            json: parsed.json,
          });
        }
        // Log command
        if (parsed.command === "log") {
          return await handleLog({
            logType: parsed.logType ?? "",
            message: parsed.logMessage ?? "",
            runId: parsed.runIdOverride,
            processId: parsed.processId,
            label: parsed.logLabel,
            level: parsed.logLevel,
            source: parsed.logSource,
            json: parsed.json,
          });
        }
        // Hook commands
        if (parsed.command === "hook:log") {
          return await handleHookLog({
            hookType: parsed.hookType ?? "",
            logFile: parsed.logFile ?? "",
            json: parsed.json,
          });
        }
        if (parsed.command === "hook:run") {
          // Auto-detect caller harness from env vars, fall back to claude-code
          // for backward compat with existing hook scripts.
          const { detectCallerHarness } = await import("../harness/discovery");
          const callerHarness = detectCallerHarness();
          return await handleHookRun({
            hookType: parsed.hookType ?? "",
            harness: parsed.harness ?? callerHarness?.name ?? "claude-code",
            pluginRoot: parsed.pluginRoot,
            stateDir: parsed.stateDir,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
          });
        }
        // Skill commands
        if (parsed.command === "skill:discover") {
          return await handleSkillDiscover({
            pluginRoot: parsed.pluginRoot,
            runId: parsed.runIdOverride,
            cacheTtl: parsed.cacheTtl,
            runsDir: parsed.runsDir,
            json: parsed.json,
            includeRemote: parsed.includeRemote,
            summaryOnly: parsed.summaryOnly,
            processPath: parsed.processPath,
          });
        }
        if (parsed.command === "skill:fetch-remote") {
          return await handleSkillFetchRemote({
            sourceType: parsed.sourceType,
            url: parsed.url,
            json: parsed.json,
          });
        }
        // Process-library commands
        if (parsed.command?.startsWith("process-library:")) {
          const subcommand = parsed.command.split(":")[1];
          const processLibraryArgs: ProcessLibraryCommandArgs = {
            subcommand: subcommand as ProcessLibraryCommandArgs["subcommand"],
            repo: parsed.processLibraryRepo,
            dir: parsed.processLibraryDir,
            ref: parsed.processLibraryRef,
            runId: parsed.runIdOverride,
            sessionId: parsed.sessionId,
            stateDir: parsed.stateDir,
            json: parsed.json,
          };
          return await handleProcessLibraryCommand(processLibraryArgs);
        }
        // Instructions commands
        if (parsed.command?.startsWith("instructions:")) {
          const subcommand = parsed.command.split(":")[1];
          if (!parsed.harness) {
            const msg = "instructions commands require --harness <name>";
            if (parsed.json) {
              console.log(JSON.stringify({ error: "missing_flag", message: msg }));
            } else {
              console.error(`[instructions] ${msg}`);
            }
            return 1;
          }
          const instructionsArgs: InstructionsCommandArgs = {
            subcommand: subcommand as InstructionsCommandArgs["subcommand"],
            harness: parsed.harness,
            interactive: parsed.interactive,
            json: parsed.json,
          };
          return await handleInstructionsCommand(instructionsArgs);
        }
        // Profile commands
        if (
          parsed.command === "profile:read" ||
          parsed.command === "profile:write" ||
          parsed.command === "profile:merge" ||
          parsed.command === "profile:render"
        ) {
          const subcommand = parsed.command.split(":")[1];
          const profileArgs: ProfileCommandArgs = {
            subcommand: subcommand as ProfileCommandArgs["subcommand"],
            user: parsed.profileUser ?? false,
            project: parsed.profileProject ?? false,
            inputPath: parsed.profileInputPath,
            dir: parsed.profileDir,
            json: parsed.json,
          };
          return await handleProfileCommand(subcommand, profileArgs);
        }
        // Plugin commands
        if (parsed.command?.startsWith("plugin:")) {
          const pluginArgs: PluginCommandArgs = {
            pluginName: parsed.pluginName,
            marketplaceName: parsed.marketplaceName,
            marketplaceUrl: parsed.marketplaceUrl,
            marketplacePath: parsed.marketplacePath,
            marketplaceBranch: parsed.marketplaceBranch,
            pluginVersion: parsed.pluginVersion,
            scope: parsed.pluginScope,
            force: parsed.pluginForce,
            json: parsed.json,
            verbose: parsed.verbose,
            runsDir: parsed.runsDir,
          };
          if (parsed.command === "plugin:add-marketplace") {
            return await handlePluginAddMarketplace(pluginArgs);
          }
          if (parsed.command === "plugin:update-marketplace") {
            return await handlePluginUpdateMarketplace(pluginArgs);
          }
          if (parsed.command === "plugin:list-plugins") {
            return await handlePluginListPlugins(pluginArgs);
          }
          if (parsed.command === "plugin:install") {
            return await handlePluginInstall(pluginArgs);
          }
          if (parsed.command === "plugin:uninstall") {
            return await handlePluginUninstall(pluginArgs);
          }
          if (parsed.command === "plugin:update") {
            return await handlePluginUpdate(pluginArgs);
          }
          if (parsed.command === "plugin:configure") {
            return await handlePluginConfigure(pluginArgs);
          }
          if (parsed.command === "plugin:list-installed") {
            return await handlePluginListInstalled(pluginArgs);
          }
          if (parsed.command === "plugin:update-registry") {
            return await handlePluginUpdateRegistry(pluginArgs);
          }
          if (parsed.command === "plugin:remove-from-registry") {
            return await handlePluginRemoveFromRegistry(pluginArgs);
          }
        }
        // Harness commands
        if (parsed.command === "harness:discover" || parsed.command === "harness:list") {
          return await handleHarnessDiscover(parsed);
        }
        if (parsed.command === "harness:install") {
          return await handleHarnessInstall({
            harnessName: parsed.positional?.[0],
            workspace: parsed.workspace,
            json: parsed.json,
            dryRun: parsed.dryRun,
            verbose: parsed.verbose,
          });
        }
        if (parsed.command === "harness:install-plugin") {
          return await handleHarnessInstallPlugin({
            harnessName: parsed.positional?.[0],
            workspace: parsed.workspace,
            json: parsed.json,
            dryRun: parsed.dryRun,
            verbose: parsed.verbose,
          });
        }
        if (parsed.command === "harness:invoke") {
          return await handleHarnessInvoke(parsed);
        }
        if (parsed.command === "harness:create-run" || parsed.command === "harness:call") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          return await handleHarnessCreateRun({
            prompt: parsed.prompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:yolo") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          return await handleHarnessCreateRun({
            prompt: parsed.prompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: false,
          });
        }
        if (parsed.command === "harness:plan") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          return await handleHarnessCreateRun({
            prompt: parsed.prompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
            planOnly: true,
          });
        }
        if (parsed.command === "harness:forever") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const foreverPrompt = renderCommandTemplate("forever", {
            additionalInstructions: parsed.prompt ?? "",
          });
          return await handleHarnessCreateRun({
            prompt: foreverPrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:resume-run" || parsed.command === "harness:resume") {
          const { handleHarnessResumeRun } = await import("./commands/harnessResumeRun");
          return await handleHarnessResumeRun({
            runId: parsed.runIdOverride,
            harness: parsed.harness,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:retrospect") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const targetRunText = parsed.retrospectAll
            ? "Target: ALL completed/failed runs in .a5c/runs/"
            : (parsed.runIds && parsed.runIds.length > 1)
              ? `Target run IDs: ${parsed.runIds.join(", ")}`
              : (parsed.runIdOverride ? `Target run ID: ${parsed.runIdOverride}` : "Target: most recent run");
          const retrospectPrompt = renderCommandTemplate("retrospect", {
            targetRunText,
            additionalInstructions: parsed.prompt ?? "",
          });
          return await handleHarnessCreateRun({
            prompt: retrospectPrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:cleanup") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const keepDays = parsed.keepDays ?? 7;
          const cleanupPrompt = renderCommandTemplate("cleanup", {
            keepDays: String(keepDays),
            dryRunLine: parsed.dryRun ? "- DRY RUN: show what would be removed without deleting anything" : "",
            additionalInstructions: parsed.prompt ?? "",
          });
          return await handleHarnessCreateRun({
            prompt: cleanupPrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:assimilate") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const assimilatePrompt = renderCommandTemplate("assimilate", {
            targetToAssimilate: parsed.prompt ?? "",
          });
          return await handleHarnessCreateRun({
            prompt: assimilatePrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:doctor") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const doctorPrompt = renderCommandTemplate("doctor", {
            targetRunText: parsed.runIdOverride ? `Target run ID: ${parsed.runIdOverride}` : "Target: most recent run",
          });
          return await handleHarnessCreateRun({
            prompt: doctorPrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:contrib") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const contribPrompt = renderCommandTemplate("contrib", {
            contributionDetails: parsed.prompt ?? "",
          });
          return await handleHarnessCreateRun({
            prompt: contribPrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:anycli") {
          if (!parsed.anycliService) {
            console.error("--service is required for harness:anycli");
            console.error(USAGE);
            return 1;
          }
          if (parsed.anycliTransport === "websocket") {
            console.error(
              "Error: WebSocket transport is not yet supported.\n" +
              "Use --transport stdio (default) or --transport http-sse instead."
            );
            return 1;
          }
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const anycliPrompt = renderCommandTemplate("anycli", {
            serviceName: parsed.anycliService,
            scope: parsed.anycliScope ?? "*",
            mcpMode: parsed.anycliMcp ? "true" : "",
            authFile: parsed.anycliAuthFile ?? "",
            transport: parsed.anycliTransport ?? "stdio",
            userPrompt: parsed.prompt ?? "",
          });
          return await handleHarnessCreateRun({
            prompt: anycliPrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:help") {
          return handleHarnessHelp(parsed);
        }
        if (parsed.command === "harness:observe") {
          return await handleHarnessObserve(parsed);
        }
        if (parsed.command === "harness:user-install") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const userInstallPrompt = renderCommandTemplate("user-install", {
            additionalInstructions: parsed.prompt ?? "",
          });
          return await handleHarnessCreateRun({
            prompt: userInstallPrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "harness:project-install") {
          const { handleHarnessCreateRun } = await import("./commands/harnessCreateRun");
          const projectInstallPrompt = renderCommandTemplate("project-install", {
            additionalInstructions: parsed.prompt ?? "",
          });
          return await handleHarnessCreateRun({
            prompt: projectInstallPrompt,
            harness: parsed.harness,
            processPath: parsed.processPath,
            workspace: parsed.workspace,
            model: parsed.model,
            maxIterations: parsed.maxIterations,
            runsDir: parsed.runsDir,
            json: parsed.json,
            verbose: parsed.verbose,
            interactive: parsed.interactive,
          });
        }
        if (parsed.command === "mcp:serve") {
          return await handleMcpServe({ json: parsed.json });
        }
        if (parsed.command === "health") {
          return await handleHealthCommand({
            json: parsed.json,
            verbose: parsed.verbose,
          });
        }
        if (parsed.command === "configure") {
          const args = parsed.configureSubcommand ? [parsed.configureSubcommand] : [];
          return await handleConfigureCommand(args, {
            json: parsed.json,
            defaultsOnly: parsed.defaultsOnly,
          });
        }
        if (parsed.command === "tokens:stats") {
          return await handleTokensStats({
            runId: parsed.tokensRunId,
            all: parsed.tokensAll,
            json: parsed.json,
            runsDir: parsed.runsDir,
          });
        }
        // Compression commands
        if (parsed.command === "compression:status") {
          return handleCompressionStatus({ json: parsed.json });
        }
        if (parsed.command === "compression:toggle") {
          if (!parsed.compressionLayer) {
            console.error("compression:toggle requires <layer> and <on|off> arguments");
            console.error(USAGE);
            return 1;
          }
          if (parsed.compressionToggleValue === undefined) {
            console.error("compression:toggle requires <on|off> as the second argument");
            console.error(USAGE);
            return 1;
          }
          return await handleCompressionToggle({
            layer: parsed.compressionLayer,
            value: parsed.compressionToggleValue,
            json: parsed.json,
          });
        }
        if (parsed.command === "compression:set") {
          if (!parsed.compressionSetKey || parsed.compressionSetValue === undefined) {
            console.error("compression:set requires <layer.key> and <value> arguments");
            console.error(USAGE);
            return 1;
          }
          return await handleCompressionSet({
            key: parsed.compressionSetKey,
            value: parsed.compressionSetValue,
            json: parsed.json,
          });
        }
        if (parsed.command === "compression:reset") {
          return await handleCompressionReset({ json: parsed.json });
        }
        if (parsed.command === "compress-output") {
          return handleCompressOutput({ args: parsed.compressOutputArgs ?? [] });
        }

        // This should not be reached due to the VALID_COMMANDS check above
        return handleUnknownCommand(parsed.command, parsed.json);
      } catch (error) {
        if (parsedJson && error instanceof BabysitterRuntimeError && error.name === "UnsupportedHarnessInstall") {
          return formatHarnessInstallError(error, true);
        }
        const err = error instanceof Error ? error : new Error(String(error));
        outputError(err, { json: parsedJson, verbose: parsedVerbose });
        return 1;
      }
    },
    formatHelp(): string {
      return USAGE;
    },
  };
}

if (require.main === module) {
  createBabysitterCli()
    .run()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
