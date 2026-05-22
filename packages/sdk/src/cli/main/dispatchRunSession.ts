import type { ParsedArgs } from "./types";
import { handleBreakpointCommand } from "../commands/breakpointRules";
import type { BreakpointCommandArgs } from "../commands/breakpointRules";
import { handleHookLog } from "../commands/hooks/log";
import { handleHookRun } from "../commands/hooks/run";
import { handleInstructionsCommand } from "../commands/instructions";
import type { InstructionsCommandArgs } from "../commands/instructions";
import { handleLog } from "../commands/log";
import { handleSessionAssociate } from "../commands/session/associate";
import { handleSessionCheckIteration } from "../commands/session/checkIteration";
import { handleSessionCleanup } from "../commands/session/cleanup";
import { handleSessionInit } from "../commands/session/init";
import { handleSessionIterationMessage } from "../commands/session/iterationMessage";
import { handleSessionLastMessage } from "../commands/session/lastMessage";
import { handleSessionResume } from "../commands/session/resume";
import { handleSessionState } from "../commands/session/state";
import { handleSessionUpdate } from "../commands/session/update";
import { handleSessionWhoami } from "../commands/session/whoami";
import { handleProcessLibraryCommand } from "../commands/processLibrary";
import type { ProcessLibraryCommandArgs } from "../commands/processLibrary";
import { handleProfileCommand } from "../commands/profile";
import type { ProfileCommandArgs } from "../commands/profile";
import {
  handlePluginAddMarketplace,
  handlePluginConfigure,
  handlePluginInstall,
  handlePluginListInstalled,
  handlePluginListPlugins,
  handlePluginRemoveFromRegistry,
  handlePluginUninstall,
  handlePluginUpdate,
  handlePluginUpdateMarketplace,
  handlePluginUpdateRegistry,
} from "../commands/plugin";
import type { PluginCommandArgs } from "../commands/plugin";
import { handleSkillDiscover, handleSkillFetchRemote } from "../commands/skill";
import {
  handleRunCreate,
  handleRunEvents,
  handleRunIterate,
  handleRunAssignProcess,
  handleRunRebuildState,
  handleRunRepairJournal,
  handleRunStatus,
} from "./runCommands";
import {
  handleTaskCancel,
  handleTaskList,
  handleTaskPost,
  handleTaskShow,
} from "./taskCommands";

export async function executeRunSessionCommand(parsed: ParsedArgs): Promise<number | undefined> {
  const runTaskResult = await executeRunTaskCommand(parsed);
  if (runTaskResult !== undefined) {
    return runTaskResult;
  }
  return await executeSupportCommand(parsed);
}

async function executeRunTaskCommand(parsed: ParsedArgs): Promise<number | undefined> {
  switch (parsed.command) {
    case "run:create":
      return await handleRunCreate(parsed);
    case "run:assign-process":
      return await handleRunAssignProcess(parsed);
    case "run:rebuild-state":
      return await handleRunRebuildState(parsed);
    case "run:repair-journal":
      return await handleRunRepairJournal(parsed);
    case "run:status":
      return await handleRunStatus(parsed);
    case "run:iterate":
      return await handleRunIterate(parsed);
    case "run:events":
      return await handleRunEvents(parsed);
    case "task:post":
      return await handleTaskPost(parsed);
    case "task:cancel":
      return await handleTaskCancel(parsed);
    case "task:list":
      return await handleTaskList(parsed);
    case "task:show":
      return await handleTaskShow(parsed);
    default:
      return undefined;
  }
}

async function executeSupportCommand(parsed: ParsedArgs): Promise<number | undefined> {
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
  if (parsed.command === "hook:log") {
    return await handleHookLog({ hookType: parsed.hookType ?? "", logFile: parsed.logFile ?? "", json: parsed.json });
  }
  if (parsed.command === "hook:run") {
    const { detectCallerHarness } = await import("../../harness/discovery");
    return await handleHookRun({
      hookType: parsed.hookType ?? "",
      harness: parsed.harness ?? detectCallerHarness()?.name ?? "claude-code",
      pluginRoot: parsed.pluginRoot,
      stateDir: parsed.stateDir,
      runsDir: parsed.runsDir,
      json: parsed.json,
      verbose: parsed.verbose,
    });
  }
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
    return await handleSkillFetchRemote({ sourceType: parsed.sourceType, url: parsed.url, json: parsed.json });
  }
  if (parsed.command === "session:whoami") {
    return handleSessionWhoami({ harness: parsed.harness, json: parsed.json });
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
      runId: parsed.runIdOverride,
      stateDir: parsed.stateDir,
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
      const message = "--transcript-path is required for session:last-message";
      if (parsed.json) {
        console.error(JSON.stringify({ error: "MISSING_TRANSCRIPT_PATH", message }));
      } else {
        console.error(message);
      }
      return 1;
    }
    return handleSessionLastMessage({
      transcriptPath: parsed.transcriptPath,
      json: parsed.json,
    });
  }
  if (parsed.command === "session:iteration-message") {
    return await handleSessionIterationMessage({
      runId: parsed.runIdOverride,
      iteration: parsed.iteration,
      runsDir: parsed.runsDir,
      pluginRoot: parsed.pluginRoot,
      json: parsed.json,
    });
  }
  if (parsed.command === "session:cleanup") {
    return await handleSessionCleanup({
      harness: parsed.harness,
      dryRun: parsed.dryRun,
      runsDir: parsed.runsDir,
      stateDir: parsed.stateDir,
      json: parsed.json,
    });
  }
  if (parsed.command?.startsWith("process-library:")) {
    const args: ProcessLibraryCommandArgs = {
      subcommand: parsed.command.split(":")[1] as ProcessLibraryCommandArgs["subcommand"],
      repo: parsed.processLibraryRepo,
      dir: parsed.processLibraryDir,
      ref: parsed.processLibraryRef,
      runId: parsed.runIdOverride,
      sessionId: parsed.sessionId,
      stateDir: parsed.stateDir,
      json: parsed.json,
    };
    return await handleProcessLibraryCommand(args);
  }
  if (parsed.command?.startsWith("instructions:")) {
    const args: InstructionsCommandArgs = {
      subcommand: parsed.command.split(":")[1] as InstructionsCommandArgs["subcommand"],
      harness: parsed.harness,
      interactive: parsed.interactive,
      json: parsed.json,
      showStrata: parsed.showStrata,
    };
    return await handleInstructionsCommand(args);
  }
  if (parsed.command?.startsWith("breakpoint:")) {
    const args: BreakpointCommandArgs = {
      subcommand: parsed.command.split(":")[1],
      pattern: parsed.breakpointPattern,
      ruleId: parsed.breakpointRuleId,
      breakpointId: parsed.breakpointIdArg,
      action: parsed.breakpointAction,
      source: parsed.breakpointSource ?? parsed.logSource,
      note: parsed.breakpointNote,
      tags: parsed.breakpointTags,
      expert: parsed.breakpointExpert,
      runsDir: parsed.runsDir,
      limit: parsed.limit,
      json: parsed.json,
    };
    return await handleBreakpointCommand(args);
  }
  if (parsed.command?.startsWith("profile:")) {
    const args: ProfileCommandArgs = {
      subcommand: parsed.command.split(":")[1] as ProfileCommandArgs["subcommand"],
      user: parsed.profileUser ?? false,
      project: parsed.profileProject ?? false,
      inputPath: parsed.profileInputPath,
      dir: parsed.profileDir,
      json: parsed.json,
    };
    return await handleProfileCommand(parsed.command.split(":")[1], args);
  }
  if (parsed.command?.startsWith("plugin:")) {
    const args: PluginCommandArgs = {
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
    switch (parsed.command) {
      case "plugin:add-marketplace":
        return await handlePluginAddMarketplace(args);
      case "plugin:update-marketplace":
        return await handlePluginUpdateMarketplace(args);
      case "plugin:list-plugins":
        return await handlePluginListPlugins(args);
      case "plugin:install":
        return await handlePluginInstall(args);
      case "plugin:uninstall":
        return await handlePluginUninstall(args);
      case "plugin:update":
        return await handlePluginUpdate(args);
      case "plugin:configure":
        return await handlePluginConfigure(args);
      case "plugin:list-installed":
        return await handlePluginListInstalled(args);
      case "plugin:update-registry":
        return await handlePluginUpdateRegistry(args);
      case "plugin:remove-from-registry":
        return await handlePluginRemoveFromRegistry(args);
    }
  }
  return undefined;
}
