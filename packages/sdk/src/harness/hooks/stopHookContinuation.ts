/**
 * Shared stop-hook continuation building and run-state resolution.
 *
 * Moved from claudeCode/stopHookState.ts — this logic is generic across
 * all harness adapters that implement a blocking stop-hook lifecycle.
 */

import * as path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { loadJournal } from "../../storage/journal";
import { readTaskDefinition } from "../../storage/tasks";
import { readRunMetadata } from "../../storage/runFiles";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";
import { deriveObservedRunState } from "../../runtime/runLifecycleState";
import { resolveCompletionProof } from "../../cli/completionProof";
import { discoverSkillsInternal } from "../../cli/commands/skill";
import {
  extractPromiseTag,
  parseTranscriptLastAssistantMessage,
} from "../../session/transcript";
import { loadCompressionConfig } from "../../compression/config-loader";
import { densityFilterText, estimateTokens } from "../../compression/density-filter";
import { getOrCompressFile } from "../../compression/library-cache";
import { getActiveProcessLibraryPath } from "../../processLibrary/active";
import { collapseDoubledA5cRuns } from "../../cli/resolveInputPath";
import { getReadableRunsDirs, resolveExistingRunDir } from "../../config";
import type { HookLogger } from "./utils";
import { countPendingByKind, isOnlyBreakpoints, safeStr } from "./utils";

// ---------------------------------------------------------------------------
// Assistant state parsing
// ---------------------------------------------------------------------------

export interface ParsedAssistantState {
  lastText: string | null;
  hasPromise: boolean;
  promiseValue: string | null;
}

export function parseAssistantStopState(
  hookInput: Record<string, unknown>,
  log: HookLogger,
): ParsedAssistantState {
  const transcriptPath = safeStr(hookInput, "transcript_path");
  let lastText: string | null = null;
  let hasPromise = false;
  let promiseValue: string | null = null;

  if (transcriptPath) {
    const resolvedTranscript = path.resolve(transcriptPath);
    if (existsSync(resolvedTranscript)) {
      try {
        const content = readFileSync(resolvedTranscript, "utf-8");
        const parsed = parseTranscriptLastAssistantMessage(content);
        lastText = parsed.text;
        if (parsed.found && parsed.text) {
          promiseValue = extractPromiseTag(parsed.text);
          hasPromise = promiseValue !== null;
        }
      } catch {
        log.warn(`Transcript parse error: ${resolvedTranscript}`);
      }
    } else {
      log.warn(`Transcript not found: ${resolvedTranscript}`);
    }
  }

  if (!lastText) {
    const hookLastMsg = safeStr(hookInput, "last_assistant_message");
    if (hookLastMsg) {
      lastText = hookLastMsg;
      promiseValue = extractPromiseTag(hookLastMsg);
      hasPromise = promiseValue !== null;
      log.info("Using last_assistant_message from hook input (transcript had no text)");
    }
  }

  return { lastText, hasPromise, promiseValue };
}

// ---------------------------------------------------------------------------
// Run-state resolution (detailed, with candidate fallback paths)
// ---------------------------------------------------------------------------

export interface StopHookRunStateDetails {
  runState: string;
  completionProof: string;
  pendingKinds: string;
  onlyBreakpointsPending: boolean;
  currentPendingEffectId?: string;
  entrypointImportPath?: string;
  runDir: string;
  lookupError?: string;
}

function resolveCandidateRunDir(
  runId: string,
  runsDir: string,
  preferredRunDir: string | undefined,
  log: HookLogger,
): { runDir: string; lookupError?: string } {
  const candidates: string[] = [];
  if (preferredRunDir?.trim()) {
    candidates.push(path.resolve(preferredRunDir));
  }

  if (path.isAbsolute(runId)) {
    candidates.push(runId);
  } else {
    candidates.push(resolveExistingRunDir(runId, { override: runsDir }));
    for (const readableRoot of getReadableRunsDirs({ override: runsDir })) {
      candidates.push(path.join(readableRoot, runId));
    }
  }

  const uniqueCandidates = candidates.filter((candidate, index) =>
    candidates.findIndex((other) => path.resolve(other) === path.resolve(candidate)) === index,
  );

  for (const candidate of uniqueCandidates) {
    if (existsSync(path.join(candidate, "run.json"))) {
      if (preferredRunDir && path.resolve(candidate) === path.resolve(preferredRunDir)) {
        log.info(`Resolved run via stored session path: ${candidate}`);
      } else if (candidate !== uniqueCandidates[0]) {
        log.info(`Run not found at ${uniqueCandidates[0]}, using fallback: ${candidate}`);
      }
      return { runDir: candidate };
    }
  }

  const primary = uniqueCandidates[0];
  return {
    runDir: primary,
    lookupError: `Run ${runId} not found at ${primary}`,
  };
}

export async function resolveStopHookRunState(
  args: {
    runId: string;
    runsDir: string;
    preferredRunDir?: string;
    log: HookLogger;
  },
): Promise<StopHookRunStateDetails> {
  const { runId, runsDir, preferredRunDir, log } = args;
  const resolvedRun = resolveCandidateRunDir(runId, runsDir, preferredRunDir, log);
  const runDir = resolvedRun.runDir;

  if (resolvedRun.lookupError) {
    return {
      runState: "",
      completionProof: "",
      pendingKinds: "",
      onlyBreakpointsPending: false,
      runDir,
      lookupError: resolvedRun.lookupError,
    };
  }

  let runState = "";
  let completionProof = "";
  let pendingKinds = "";
  let onlyBreakpointsPending = false;
  let currentPendingEffectId: string | undefined;
  let entrypointImportPath: string | undefined;

  try {
    const metadata = await readRunMetadata(runDir);
    entrypointImportPath = metadata?.entrypoint?.importPath;
    const journal = await loadJournal(runDir);
    const index = await buildEffectIndex({ runDir, events: journal });
    const pendingRecords = index.listPendingEffects();
    runState = deriveObservedRunState(journal, pendingRecords.length);
    const pendingByKind = countPendingByKind(pendingRecords);
    const kindKeys = Object.keys(pendingByKind);
    if (kindKeys.length > 0) {
      pendingKinds = kindKeys.join(", ");
    }
    onlyBreakpointsPending = pendingRecords.length > 0 && (
      isOnlyBreakpoints(pendingByKind) ||
      await onlyExternallyRoutedEffectsPending(runDir, pendingRecords)
    );
    currentPendingEffectId = (
      await hostDelegablePendingRecords(runDir, pendingRecords)
    )
      .sort((left, right) =>
        (left.requestedAt ?? "").localeCompare(right.requestedAt ?? "")
        || left.effectId.localeCompare(right.effectId),
      )[0]?.effectId;

    if (runState === "completed") {
      completionProof = resolveCompletionProof(metadata);
    }
  } catch {
    runState = "";
  }

  return {
    runState,
    completionProof,
    pendingKinds,
    onlyBreakpointsPending,
    currentPendingEffectId,
    entrypointImportPath,
    runDir,
    lookupError: runState ? undefined : `Unable to inspect run ${runId} at ${runDir}`,
  };
}

async function onlyExternallyRoutedEffectsPending(
  runDir: string,
  pendingRecords: Array<{ effectId: string; kind?: string }>,
): Promise<boolean> {
  const classified = await Promise.all(pendingRecords.map((record) => isHostDelegableEffect(runDir, record)));
  return classified.length > 0 && classified.every((delegable) => !delegable);
}

async function hostDelegablePendingRecords<T extends { effectId: string; kind?: string }>(
  runDir: string,
  pendingRecords: T[],
): Promise<T[]> {
  const pairs = await Promise.all(pendingRecords.map(async (record) => ({
    record,
    delegable: await isHostDelegableEffect(runDir, record),
  })));
  return pairs.filter((pair) => pair.delegable).map((pair) => pair.record);
}

async function isHostDelegableEffect(
  runDir: string,
  record: { effectId: string; kind?: string },
): Promise<boolean> {
  if (record.kind && record.kind !== "agent" && record.kind !== "breakpoint") {
    return true;
  }
  try {
    const taskDef = await readTaskDefinition(runDir, record.effectId);
    if (!taskDef) return record.kind !== "breakpoint";
    const mux = await import("@a5c-ai/tasks-mux");
    if (typeof mux.routeTask !== "function" || typeof mux.isHostDelegableRoute !== "function") {
      return record.kind !== "breakpoint";
    }
    return mux.isHostDelegableRoute(mux.routeTask(taskDef as unknown as Parameters<typeof mux.routeTask>[0]));
  } catch {
    return record.kind !== "breakpoint";
  }
}

// ---------------------------------------------------------------------------
// Continuation building (rich prompt for stop-hook block decisions)
// ---------------------------------------------------------------------------

export async function buildStopHookContinuation(
  args: {
    nextIteration: number;
    maxIterations: number;
    runState: string;
    pendingKinds: string;
    completionProof: string;
    prompt: string;
    resolvedPluginRoot: string;
    runId?: string;
    runsDir: string;
    entrypointImportPath?: string;
  },
): Promise<{ reason: string; systemMessage: string }> {
  const {
    nextIteration,
    maxIterations,
    runState,
    pendingKinds,
    completionProof,
    prompt,
    resolvedPluginRoot,
    runId,
    runsDir,
    entrypointImportPath,
  } = args;

  let iterationContext: string;
  if (completionProof) {
    iterationContext = `Babysitter iteration ${nextIteration} | Run completed! To finish: call 'run:status --json' on your run, extract 'completionProof' from the output, then output it in <promise>SECRET</promise> tags. Do not mention or reveal the secret otherwise.`;
  } else if (runState === "waiting" && pendingKinds) {
    iterationContext = `Babysitter iteration ${nextIteration} | Waiting on: ${pendingKinds}. Check if pending effects are resolved, then call run:iterate.`;
  } else if (runState === "halted") {
    iterationContext = `Babysitter iteration ${nextIteration} | Run halted. Inspect run:status --json for the halt reason and payload, then fix the process or inputs before continuing.`;
  } else if (runState === "failed") {
    iterationContext = `Babysitter iteration ${nextIteration} | Run failed. Fix the run, journal or process (inspect the sdk.md if needed) and proceed.`;
  } else {
    iterationContext = `Babysitter iteration ${nextIteration} | Continue orchestration (run:iterate).`;
  }

  let compressionCfg: ReturnType<typeof loadCompressionConfig> | null = null;
  try {
    compressionCfg = loadCompressionConfig(process.cwd());
  } catch {
    // Best-effort
  }

  let librarySection = "";
  if (resolvedPluginRoot) {
    try {
      const libraryPath = await getActiveProcessLibraryPath();
      const discoverResult = await discoverSkillsInternal({
        pluginRoot: resolvedPluginRoot,
        libraryPath: libraryPath || undefined,
        runId: runId || undefined,
        runsDir: collapseDoubledA5cRuns(runsDir),
        processPath: entrypointImportPath,
      });

      const excludedSkills = new Set(["babysit", "babysitter"]);
      const relevantSkills = (discoverResult.skills || []).filter(
        (s) => !excludedSkills.has(s.name.toLowerCase()),
      );
      const relevantAgents = discoverResult.agents || [];

      const items: string[] = [];
      for (const s of relevantSkills) {
        if (items.length >= 10) break;
        items.push(`skill:${s.name}${s.file ? ` [${s.file}]` : ""}`);
      }
      for (const a of relevantAgents) {
        if (items.length >= 10) break;
        items.push(`agent:${a.name}${a.file ? ` [${a.file}]` : ""}`);
      }
      if (items.length > 0) {
        iterationContext = `${iterationContext} | Discovered: ${items.join(", ")}`;
      }

      const cacheLayer = compressionCfg?.layers.processLibraryCache;
      if (compressionCfg?.enabled && cacheLayer?.enabled) {
        const cacheDir = path.join(process.cwd(), ".a5c", "cache", "compression");
        const sections: string[] = [];
        const libraryItems = [
          ...relevantSkills.slice(0, 4).map((s) => ({ kind: "Skill" as const, name: s.name, file: s.file })),
          ...relevantAgents.slice(0, 2).map((a) => ({ kind: "Agent" as const, name: a.name, file: a.file })),
        ];
        for (const item of libraryItems) {
          if (!item.file) continue;
          const content = getOrCompressFile(item.file, cacheLayer.targetReduction, cacheLayer.ttlHours, cacheDir);
          if (content) {
            sections.push(`### ${item.kind}: ${item.name}\n${content}`);
          }
        }
        if (sections.length > 0) {
          librarySection = "\n\n---\n## Available Skills & Agents\n" + sections.join("\n\n---\n");
        }
      }
    } catch {
      // Non-fatal
    }
  }

  let effectivePrompt = prompt;
  if (compressionCfg?.enabled && compressionCfg.layers.sdkContextHook.enabled) {
    const sdkLayer = compressionCfg.layers.sdkContextHook;
    if (estimateTokens(prompt) > sdkLayer.minCompressionTokens) {
      effectivePrompt = densityFilterText(prompt, sdkLayer.targetReduction);
    }
  }

  let systemMessage: string;
  if (completionProof) {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration}/${maxIterations} | Run completed! Extract promise tag to finish.`;
  } else if (runState === "waiting" && pendingKinds) {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration}/${maxIterations} | Waiting on: ${pendingKinds}`;
  } else if (runState === "failed") {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration}/${maxIterations} | Failed — check run state`;
  } else {
    systemMessage = `\u{1F504} Babysitter iteration ${nextIteration}/${maxIterations} [${runState}]`;
  }

  return {
    reason: `${iterationContext}\n\n${effectivePrompt}${librarySection}`,
    systemMessage,
  };
}
