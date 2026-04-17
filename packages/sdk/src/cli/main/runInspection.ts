import type { EffectRecord } from "../../runtime/types";
import { resolveCompletionProof } from "../completionProof";
import { runIterate } from "../commands/runIterate";
import { renderEffectTree, renderEventMessage, type EffectNode } from "../render";
import { resolveRunDir } from "./args";
import {
  buildEffectIndexSafe,
  countPendingByKind,
  deriveRunState,
  findLastLifecycleEvent,
  formatEventLine,
  formatIterationMetadata,
  formatLastEventSummary,
  loadJournalSafe,
  mergeMetadataSources,
  readRunMetadataSafe,
  readStateCacheSafe,
  serializeJournalEvent,
} from "./runState";
import { logVerbose } from "./runSupport";
import type { ParsedArgs } from "./types";
import { USAGE } from "./usage";

export async function handleRunStatus(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:status", parsed, { runDir, json: parsed.json });

  const metadata = await readRunMetadataSafe(runDir, "run:status");
  const journal = await loadJournalSafe(runDir, "run:status");
  const index = journal ? await buildEffectIndexSafe(runDir, "run:status", journal) : null;
  if (!metadata || !journal || !index) {
    return 1;
  }

  const pendingRecords = index.listPendingEffects();
  const pendingByKind = countPendingByKind(pendingRecords);
  const pendingTotal = pendingRecords.length;
  const formattedMetadata = formatIterationMetadata(
    mergeMetadataSources({ pendingEffectsByKind: pendingByKind }, { snapshot: await readStateCacheSafe(runDir, "run:status"), pendingByKind })
  );
  const state = deriveRunState(findLastLifecycleEvent(journal)?.type, pendingTotal);
  const lastEvent = journal.at(-1);
  const pendingEffectsSummary = {
    totalPending: pendingTotal,
    countsByKind: pendingByKind,
    autoRunnableCount: pendingRecords.filter((record) => record.kind === "node").length,
  };
  const needsMoreIterations = state === "waiting" && pendingEffectsSummary.autoRunnableCount > 0;

  if (parsed.json) {
    console.log(
      JSON.stringify({
        state,
        lastEvent: lastEvent ? serializeJournalEvent(lastEvent, runDir) : null,
        pendingByKind,
        pendingEffectsSummary,
        needsMoreIterations,
        metadata: formattedMetadata.jsonMetadata ?? null,
        completionProof: state === "completed" ? resolveCompletionProof(metadata) : null,
      })
    );
    return 0;
  }
  if (parsed.tree) {
    const effectNodes: EffectNode[] = index.listEffects().map((record: EffectRecord) => ({
      effectId: record.effectId,
      kind: record.kind ?? "unknown",
      status: record.status === "resolved_ok" || record.status === "resolved_error" ? "completed" : record.status === "requested" ? "pending" : "running",
      title: record.taskId ?? record.effectId,
      progress: record.progressPercent !== undefined ? { percent: record.progressPercent, label: record.progressLabel } : undefined,
      costUsd: record.costUsd,
    }));
    console.log(`[run:status] state=${state}`);
    console.log(renderEffectTree(effectNodes));
    return 0;
  }

  const suffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
  const completionProof = state === "completed" ? resolveCompletionProof(metadata) : undefined;
  const secretSuffix = completionProof ? ` completionProof=${completionProof}` : "";
  console.log(`[run:status] state=${state} last=${formatLastEventSummary(lastEvent)}${suffix}${secretSuffix}`);
  return 0;
}

export async function handleRunIterate(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:iterate", parsed, { runDir, iteration: parsed.iteration, json: parsed.json, verbose: parsed.verbose });
  try {
    const result = await runIterate({ runDir, iteration: parsed.iteration, verbose: parsed.verbose, json: parsed.json });
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

export async function handleRunEvents(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("run:events", parsed, { runDir, json: parsed.json, limit: parsed.limit, reverse: parsed.reverseOrder, filterType: parsed.filterType });
  if (!(await readRunMetadataSafe(runDir, "run:events"))) return 1;

  const journal = await loadJournalSafe(runDir, "run:events");
  if (!journal) return 1;
  const filterType = parsed.filterType ? parsed.filterType.toUpperCase() : undefined;
  const filtered = filterType ? journal.filter((event) => event.type.toUpperCase() === filterType) : journal;
  const ordered = parsed.reverseOrder ? filtered.slice().reverse() : filtered.slice();
  const limited = parsed.limit !== undefined ? ordered.slice(0, parsed.limit) : ordered;
  const formattedMetadata = formatIterationMetadata(
    mergeMetadataSources(undefined, { snapshot: await readStateCacheSafe(runDir, "run:events") })
  );

  if (parsed.json) {
    console.log(JSON.stringify({ events: limited.map((event) => serializeJournalEvent(event, runDir)), metadata: formattedMetadata.jsonMetadata ?? null }));
    return 0;
  }

  const headerParts = [`total=${journal.length}`, `matching=${filtered.length}`, `showing=${limited.length}`];
  if (filterType) headerParts.push(`filter=${filterType}`);
  if (parsed.limit) headerParts.push(`limit=${parsed.limit}`);
  if (parsed.reverseOrder) headerParts.push("order=desc");
  const metadataSuffix = formattedMetadata.textParts.length ? ` ${formattedMetadata.textParts.join(" ")}` : "";
  console.log(`[run:events] ${headerParts.join(" ")}${metadataSuffix}`);
  for (const event of limited) {
    if (parsed.rich) {
      console.log(renderEventMessage({ type: event.type, recordedAt: event.recordedAt, data: (event.data ?? {}) as Record<string, unknown> }));
    } else {
      console.log(`- ${formatEventLine(event)}`);
    }
  }
  return 0;
}
