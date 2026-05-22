import { renderCommandTemplate } from "../prompts/commandTemplates";
import type { HarnessParsedArgs } from "./args";
import { AGENT_PROGRAM } from "./program";
import { handleUnknownCommand } from "./ui";
import { handleHarnessCreateRun } from "./commands/harness/createRun";
import { handleHarnessResumeRun } from "./commands/harness/resumeRun";
import { handleJsonlInteractive } from "./commands/jsonlInteractive";
import { handleTui } from "./commands/tui";
import { invokeHarness } from "../harness/invoker";
import { detectCallerHarness, discoverHarnesses } from "../harness";
import { handleDaemonRun, handleDaemonStart, handleDaemonStatus, handleDaemonStop } from "./commands/daemon";
import { handleMcpServe } from "./commands/mcpServe";
import { handleSessionHistory } from "./commands/session/history";
import { formatResultAsAmuxEvents } from "./amuxEventsFormatter";
import { normalizeBuiltInHarnessName } from "../harness/builtInHarness";

type HarnessRunPromptKind =
  | "forever"
  | "retrospect"
  | "cleanup"
  | "assimilate"
  | "doctor"
  | "contrib"
  | "user-install"
  | "project-install";

export function formatAgentHelp(_surface: "agent" | "human"): string {
  const commandName = AGENT_PROGRAM.commandName;
  return `  ${commandName} create-run [--prompt <text>] [--harness <name>] [--process <path>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--interactive|--no-interactive|--non-interactive] [--json] [--verbose]
  ${commandName} call [...]                          (alias for create-run)
  ${commandName} yolo [...]                          (alias for create-run --non-interactive)
  ${commandName} plan [...]                          (alias for create-run, stops after PhasePlanProcess)
  ${commandName} forever [...]                       (alias for create-run, infinite loop process)
  ${commandName} resume-run [--run-id <id>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--interactive|--no-interactive] [--json] [--verbose]
  ${commandName} resume [...]                        (alias for resume-run)
  ${commandName} retrospect [--run-id <id>...] [--all] [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--json] [--verbose]
  ${commandName} cleanup [--dry-run] [--keep-days <n>] [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--json] [--verbose]
  ${commandName} assimilate [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--json] [--verbose]
  ${commandName} doctor [--run-id <id>] [--json] [--verbose]
  ${commandName} contrib [--prompt <text>] [--harness <name>] [--workspace <dir>] [--model <model>] [--max-iterations <n>] [--json] [--verbose]
  ${commandName} anycli --service <name> [--scope <scopes>] [--mcp] [--auth-file <path>] [--transport <type>] [--prompt <text>] [--workspace <dir>] [--json] [--verbose]
  ${commandName} session-history --session-id <id> --state-dir <dir> [--run-id <id>] [--json]
  ${commandName} jsonl:interactive
  ${commandName} daemon:start [--workspace <dir>] [--daemon-dir <dir>] [--config-path <path>] [--foreground] [--json]
  ${commandName} daemon:stop [--daemon-dir <dir>] [--grace-period-ms <n>] [--json]
  ${commandName} daemon:status [--daemon-dir <dir>] [--json]
  ${commandName} start-server [--transport <stdio|websocket>] [--port <n>] [--host <host>] [--json]
  ${commandName} help [<topic>]
  ${commandName} observe [--workspace <dir>] [--tui]
  ${commandName} user-install [--harness <name>] [--workspace <dir>] [--model <model>] [--json] [--verbose]
  ${commandName} project-install [--harness <name>] [--workspace <dir>] [--model <model>] [--json] [--verbose]
  ${commandName} discover [--json]
  ${commandName} list [--json]
  ${commandName} invoke <name> --prompt <text> [--workspace <dir>] [--model <model>] [--timeout <ms>] [--json]
  ${commandName} tui [--run-id <id>] [--verbosity minimal|normal|verbose] [--workspace <dir>] [--json]
  ${commandName} version

Install or update harness CLIs and plugins with the main babysitter CLI:
  babysitter harness:install <name>
  babysitter harness:install-plugin <name>`;
}

export async function executeAgentCliCommand(parsed: HarnessParsedArgs): Promise<number> {
  if (parsed.command === "version") {
    const { readCliVersion } = await import("./ui");
    console.log(await readCliVersion());
    return 0;
  }

  if (!parsed.command || parsed.helpRequested) {
    console.log(formatAgentHelp(parsed.helpSurface));
    return 0;
  }

  const runtimeResult = await executeRuntimeUtilityCommand(parsed);
  if (runtimeResult !== undefined) {
    return runtimeResult;
  }

  switch (parsed.command) {
    case "discover":
    case "list":
      return await handleHarnessDiscover(parsed);
    case "invoke":
      return await handleHarnessInvoke(parsed);
    case "create-run":
    case "call":
      return await runHarnessCreateRun(parsed);
    case "yolo":
      return await runHarnessCreateRun(parsed, { interactive: false });
    case "plan":
      return await runHarnessCreateRun(parsed, { planOnly: true });
    case "forever":
      return await runHarnessCreateRun(parsed, { prompt: renderPrompt("forever", parsed) });
    case "resume-run":
    case "resume":
      return await handleHarnessResumeRun({
        runId: parsed.runIdOverride,
        harness: parsed.harness ? normalizeBuiltInHarnessName(parsed.harness) : parsed.harness,
        workspace: parsed.workspace,
        model: parsed.model,
        maxIterations: parsed.maxIterations,
        runsDir: parsed.runsDir,
        json: parsed.json,
        verbose: parsed.verbose,
        interactive: parsed.interactive,
      });
    case "retrospect":
      return await runHarnessCreateRun(parsed, { prompt: renderPrompt("retrospect", parsed) });
    case "cleanup":
      return await runHarnessCreateRun(parsed, { prompt: renderPrompt("cleanup", parsed) });
    case "assimilate":
      return await runHarnessCreateRun(parsed, { prompt: renderPrompt("assimilate", parsed) });
    case "doctor":
      return await runHarnessCreateRun(parsed, { prompt: renderPrompt("doctor", parsed) });
    case "contrib":
      return await runHarnessCreateRun(parsed, { prompt: renderPrompt("contrib", parsed) });
    case "anycli":
      if (!parsed.anycliService) {
        console.error("--service is required for anycli");
        return 1;
      }
      if (parsed.anycliTransport === "websocket") {
        console.error("Error: WebSocket transport is not yet supported.\nUse --transport stdio (default) or --transport http-sse instead.");
        return 1;
      }
      return await runHarnessCreateRun(parsed, {
        prompt: renderCommandTemplate("anycli", {
          serviceName: parsed.anycliService,
          scope: parsed.anycliScope ?? "*",
          mcpMode: parsed.anycliMcp ? "true" : "",
          authFile: parsed.anycliAuthFile ?? "",
          transport: parsed.anycliTransport ?? "stdio",
          userPrompt: parsed.prompt ?? "",
        }),
      });
    case "session-history":
      return await handleSessionHistory({
        sessionId: parsed.sessionId ?? "",
        stateDir: parsed.stateDir ?? "",
        json: parsed.json,
        runId: parsed.runIdOverride,
      });
    case "jsonl:interactive":
      return await handleJsonlInteractive({ runsDir: parsed.runsDir });
    case "help":
      console.log(formatAgentHelp("human"));
      return 0;
    case "observe":
      if (parsed.tuiFlag) {
        return await handleTui({
          runsDir: parsed.runsDir,
          json: false,
          verbose: parsed.verbose,
          workspace: parsed.workspace,
          harness: parsed.harness ? normalizeBuiltInHarnessName(parsed.harness) : parsed.harness,
          runId: parsed.runIdOverride,
          verbosity: parsed.verbosity as "minimal" | "normal" | "verbose" | undefined,
        });
      }
      return (await import("./ui")).launchObserver(parsed.workspace);
    case "user-install":
      return await runHarnessCreateRun(parsed, { prompt: renderPrompt("user-install", parsed) });
    case "project-install":
      return await runHarnessCreateRun(parsed, { prompt: renderPrompt("project-install", parsed) });
    case "tui":
      return await handleTui({
        runsDir: parsed.runsDir,
        json: parsed.json,
        verbose: parsed.verbose,
        positional: parsed.positional,
        harness: parsed.harness ? normalizeBuiltInHarnessName(parsed.harness) : parsed.harness,
        workspace: parsed.workspace,
        prompt: parsed.prompt,
        runId: parsed.runIdOverride,
        verbosity: parsed.verbosity as "minimal" | "normal" | "verbose" | undefined,
      });
    default:
      return handleUnknownCommand(parsed.command, parsed.json);
  }
}

async function executeRuntimeUtilityCommand(parsed: HarnessParsedArgs): Promise<number | undefined> {
  switch (parsed.command) {
    case "daemon:start":
      return await handleDaemonStart({
        daemonDir: parsed.daemonDir,
        workspace: parsed.workspace,
        configPath: parsed.configPath,
        foreground: parsed.foreground,
        json: parsed.json,
      });
    case "daemon:stop":
      return await handleDaemonStop({
        daemonDir: parsed.daemonDir,
        gracePeriodMs: parsed.gracePeriodMs,
        json: parsed.json,
      });
    case "daemon:status":
      return await handleDaemonStatus({ daemonDir: parsed.daemonDir, json: parsed.json });
    case "daemon:run":
      return await handleDaemonRun({ daemonDir: parsed.daemonDir });
    case "start-server":
      return await handleMcpServe({
        json: parsed.json,
        transport: parsed.transport,
        port: parsed.port,
        host: parsed.host,
        authToken: parsed.authToken,
        wsOptions: {
          pingIntervalMs: parsed.wsPingInterval,
          maxMessagesPerSecond: parsed.wsMaxMps,
          sessionGracePeriodMs: parsed.wsGracePeriod,
        },
      });
    default:
      return undefined;
  }
}

async function handleHarnessDiscover(parsed: HarnessParsedArgs): Promise<number> {
  const results = await discoverHarnesses();
  const caller = detectCallerHarness();
  if (parsed.json) {
    console.log(JSON.stringify({ installed: results, caller }, null, 2));
    return 0;
  }
  console.log(formatAgentHelp("human"));
  return 0;
}

async function handleHarnessInvoke(parsed: HarnessParsedArgs): Promise<number> {
  const harnessName = parsed.positional?.[0];
  if (!harnessName || !parsed.prompt) {
    console.error('Usage: babysitter-agent invoke <name> --prompt "<text>"');
    return 1;
  }
  const normalizedHarnessName = normalizeBuiltInHarnessName(harnessName);
  const result = await invokeHarness(normalizedHarnessName, {
    prompt: parsed.prompt,
    workspace: parsed.workspace,
    model: parsed.model,
    timeout: parsed.timeout ? Number(parsed.timeout) : undefined,
  });

  // amux-events output format: JSONL compatible with agent-mux event stream
  if (parsed.outputFormat === "amux-events") {
    const lines = formatResultAsAmuxEvents(normalizedHarnessName, result);
    for (const line of lines) {
      console.log(line);
    }
    return result.success ? 0 : 1;
  }

  if (parsed.json || parsed.outputFormat === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.success) {
    console.log(result.output);
  } else {
    console.error(result.output);
  }
  return result.success ? 0 : 1;
}

function renderPrompt(kind: HarnessRunPromptKind, parsed: HarnessParsedArgs): string {
  switch (kind) {
    case "forever":
      return renderCommandTemplate("forever", { additionalInstructions: parsed.prompt ?? "" });
    case "retrospect": {
      const targetRunText = parsed.retrospectAll
        ? "Target: ALL completed/failed runs in the resolved runs root"
        : parsed.runIds && parsed.runIds.length > 1
          ? `Target run IDs: ${parsed.runIds.join(", ")}`
          : parsed.runIdOverride
            ? `Target run ID: ${parsed.runIdOverride}`
            : "Target: most recent run";
      return renderCommandTemplate("retrospect", { targetRunText, additionalInstructions: parsed.prompt ?? "" });
    }
    case "cleanup":
      return renderCommandTemplate("cleanup", {
        keepDays: String(parsed.keepDays ?? 7),
        dryRunLine: parsed.dryRun ? "- DRY RUN: show what would be removed without deleting anything" : "",
        additionalInstructions: parsed.prompt ?? "",
      });
    case "assimilate":
      return renderCommandTemplate("assimilate", { targetToAssimilate: parsed.prompt ?? "" });
    case "doctor":
      return renderCommandTemplate("doctor", {
        targetRunText: parsed.runIdOverride ? `Target run ID: ${parsed.runIdOverride}` : "Target: most recent run",
      });
    case "contrib":
      return renderCommandTemplate("contrib", { contributionDetails: parsed.prompt ?? "" });
    case "user-install":
      return renderCommandTemplate("user-install", { additionalInstructions: parsed.prompt ?? "" });
    case "project-install":
      return renderCommandTemplate("project-install", { additionalInstructions: parsed.prompt ?? "" });
  }
}

async function runHarnessCreateRun(
  parsed: HarnessParsedArgs,
  overrides: { interactive?: boolean; planOnly?: boolean; prompt?: string } = {},
): Promise<number> {
  return await handleHarnessCreateRun({
    invocationCommand: parsed.command,
    prompt: overrides.prompt ?? parsed.prompt,
    harness: parsed.harness ? normalizeBuiltInHarnessName(parsed.harness) : parsed.harness,
    processPath: parsed.processPath,
    workspace: parsed.workspace,
    model: parsed.model,
    maxIterations: parsed.maxIterations,
    runsDir: parsed.runsDir,
    json: parsed.json,
    verbose: parsed.verbose,
    interactive: overrides.interactive ?? parsed.interactive,
    planOnly: overrides.planOnly,
    outputMode: parsed.outputFormat === "amux-events" ? "amux-events" : undefined,
  });
}
