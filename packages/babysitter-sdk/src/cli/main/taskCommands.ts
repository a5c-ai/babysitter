import { promises as fs } from "node:fs";
import * as path from "node:path";
import { commitEffectCancellation, commitEffectResult } from "../../runtime/commitEffectResult";
import { readTaskDefinition } from "../../storage/tasks";
import type { JsonRecord } from "../../storage/types";
import type { ParsedArgs } from "./types";
import { USAGE } from "./usage";
import { collapseDoubledA5cRuns, resolveRunDir } from "./args";
import {
  allowSecretLogs,
  defaultResultRef,
  isJsonRecord,
  logVerbose,
  normalizeArtifactRef,
  readStdinUtf8,
  toRunRelativePosix,
} from "./runSupport";
import {
  buildEffectIndexSafe,
  loadTaskResultPreview,
  toTaskListEntry,
} from "./runState";

function readStringField(value: JsonRecord | undefined, key: string): string | undefined {
  const candidate = value?.[key];
  return typeof candidate === "string" ? candidate : undefined;
}

function readNumericField(value: JsonRecord | undefined, key: string): number | undefined {
  const candidate = value?.[key];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : undefined;
}

function coerceShellFailureResult(errorPayload: unknown, stdout?: string, stderr?: string) {
  const payloadData = isJsonRecord(errorPayload)
    ? isJsonRecord(errorPayload.data)
      ? errorPayload.data
      : errorPayload
    : undefined;
  const exitCode = readNumericField(payloadData, "exitCode") ?? 1;
  return {
    success: false,
    exitCode,
    stdout: stdout ?? readStringField(payloadData, "stdout") ?? "",
    stderr: stderr ?? readStringField(payloadData, "stderr") ?? "",
    error:
      readStringField(payloadData, "error") ??
      readStringField(payloadData, "message") ??
      `Shell command exited with code ${exitCode}`,
  };
}

function resolveMaybeRunRelative(runDir: string, candidate?: string) {
  if (!candidate) return undefined;
  if (candidate === "-") return candidate;
  if (path.isAbsolute(candidate) || /^[A-Za-z]:[\\/]/.test(candidate)) {
    return candidate;
  }
  if (/^\.a5c[/\\]/.test(candidate)) {
    return candidate;
  }
  return collapseDoubledA5cRuns(path.join(runDir, candidate));
}

async function readJsonFile(runDir: string, filename?: string): Promise<unknown> {
  if (!filename) return undefined;
  if (filename === "-") {
    const raw = await readStdinUtf8();
    const trimmed = raw.trim();
    return trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
  }
  const raw = await fs.readFile(resolveMaybeRunRelative(runDir, filename)!, "utf8");
  const trimmed = raw.trim();
  return trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
}

function readInlineJson(raw?: string): unknown {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
}

async function readTextFile(runDir: string, filename?: string): Promise<string | undefined> {
  if (!filename) return undefined;
  if (filename === "-") {
    return await readStdinUtf8();
  }
  return await fs.readFile(resolveMaybeRunRelative(runDir, filename)!, "utf8");
}

export async function handleTaskPost(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  if (!parsed.taskStatus) {
    console.error("[task:post] missing required --status <ok|error>");
    return 1;
  }
  if (parsed.stdoutRef && parsed.stdoutFile) {
    console.error("[task:post] cannot combine --stdout-ref with --stdout-file");
    return 1;
  }
  if (parsed.stderrRef && parsed.stderrFile) {
    console.error("[task:post] cannot combine --stderr-ref with --stderr-file");
    return 1;
  }
  if (parsed.valuePath && parsed.valueInline) {
    console.error("[task:post] cannot combine --value with --value-inline");
    return 1;
  }
  if (parsed.taskStatus === "error" && parsed.valueInline) {
    console.error("[task:post] --value-inline is only supported with --status ok");
    return 1;
  }
  if (parsed.taskStatus === "ok" && !parsed.valuePath && !parsed.valueInline) {
    console.error("[task:post] ok results require --value or --value-inline");
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
  const record = index?.getByEffectId(parsed.effectId);
  if (!index || !record) {
    console.error(`[task:post] effect ${parsed.effectId} not found at ${runDir}`);
    return 1;
  }
  if (record.status !== "requested") {
    console.error(`[task:post] effect ${parsed.effectId} is not requested (status=${record.status ?? "unknown"})`);
    return 1;
  }

  const nowIso = new Date().toISOString();
  const metadataRaw = await readJsonFile(runDir, parsed.metadataPath);
  const metadata = isJsonRecord(metadataRaw) ? metadataRaw : undefined;
  const stdout = parsed.stdoutFile ? await readTextFile(runDir, parsed.stdoutFile) : undefined;
  const stderr = parsed.stderrFile ? await readTextFile(runDir, parsed.stderrFile) : undefined;
  const errorPayload =
    parsed.taskStatus === "error"
      ? (await readJsonFile(runDir, parsed.errorPath)) ?? { name: "Error", message: "Task reported failure" }
      : undefined;
  const value =
    parsed.taskStatus === "ok"
      ? parsed.valueInline
        ? readInlineJson(parsed.valueInline)
        : await readJsonFile(runDir, parsed.valuePath)
      : undefined;
  const normalizedShellFailure = parsed.taskStatus === "error" && record.kind === "shell";
  const committedStatus = normalizedShellFailure ? "ok" : parsed.taskStatus;

  const plan = {
    runDir: toRunRelativePosix(runDir, runDir) ?? runDir,
    effectId: parsed.effectId,
    status: committedStatus,
    normalizedShellFailure,
    valueProvided: Boolean(parsed.valuePath || parsed.valueInline),
    errorProvided: Boolean(parsed.errorPath),
    stdoutRef: parsed.stdoutRef ?? null,
    stderrRef: parsed.stderrRef ?? null,
    stdoutFile: parsed.stdoutFile ?? null,
    stderrFile: parsed.stderrFile ?? null,
  };
  if (parsed.dryRun) {
    if (parsed.json) {
      console.log(JSON.stringify({ status: "skipped", dryRun: true, plan }, null, 2));
    } else {
      console.log("[task:post] status=skipped");
      console.error(`[task:post] dry-run plan ${JSON.stringify(plan)}`);
    }
    return 0;
  }

  const committed = await commitEffectResult({
    runDir,
    effectId: parsed.effectId,
    invocationKey: parsed.invocationKey ?? record.invocationKey,
    result:
      committedStatus === "ok"
        ? {
            status: "ok",
            value: normalizedShellFailure ? coerceShellFailureResult(errorPayload, stdout, stderr) : value,
            stdout,
            stderr,
            stdoutRef: parsed.stdoutRef,
            stderrRef: parsed.stderrRef,
            startedAt: parsed.startedAt ?? nowIso,
            finishedAt: parsed.finishedAt ?? nowIso,
            metadata,
          }
        : {
            status: "error",
            error: errorPayload,
            stdout,
            stderr,
            stdoutRef: parsed.stdoutRef,
            stderrRef: parsed.stderrRef,
            startedAt: parsed.startedAt ?? nowIso,
            finishedAt: parsed.finishedAt ?? nowIso,
            metadata,
          },
  });

  const stdoutRef = normalizeArtifactRef(runDir, committed.stdoutRef) ?? null;
  const stderrRef = normalizeArtifactRef(runDir, committed.stderrRef) ?? null;
  const resultRef = normalizeArtifactRef(runDir, committed.resultRef) ?? null;
  if (parsed.json) {
    console.log(JSON.stringify({ status: committedStatus, normalizedShellFailure, committed, stdoutRef, stderrRef, resultRef }));
  } else {
    const parts = [`[task:post] status=${committedStatus}`];
    if (normalizedShellFailure) parts.push("normalizedShellFailure=true");
    if (stdoutRef) parts.push(`stdoutRef=${stdoutRef}`);
    if (stderrRef) parts.push(`stderrRef=${stderrRef}`);
    if (resultRef) parts.push(`resultRef=${resultRef}`);
    console.log(parts.join(" "));
  }
  return committedStatus === "ok" ? 0 : 1;
}

export async function handleTaskCancel(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  const index = await buildEffectIndexSafe(runDir, "task:cancel");
  const record = index?.getByEffectId(parsed.effectId);
  if (!index || !record) {
    console.error(`[task:cancel] effect ${parsed.effectId} not found at ${runDir}`);
    return 1;
  }
  if (record.status !== "requested") {
    console.error(`[task:cancel] effect ${parsed.effectId} is already ${record.status}`);
    return 1;
  }

  const result = await commitEffectCancellation({
    runDir,
    effectId: parsed.effectId,
    reason: parsed.cancelReason,
  });
  if (parsed.json) {
    console.log(JSON.stringify({ effectId: parsed.effectId, status: "cancelled", resultRef: result.resultRef }));
  } else {
    console.log(`[task:cancel] effectId=${parsed.effectId} status=cancelled resultRef=${result.resultRef}`);
  }
  return 0;
}

export async function handleTaskList(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  logVerbose("task:list", parsed, { runDir, json: parsed.json, pending: parsed.pendingOnly, kind: parsed.kindFilter });

  const index = await buildEffectIndexSafe(runDir, "task:list");
  if (!index) return 1;

  const rawRecords = parsed.pendingOnly ? index.listPendingEffects() : index.listEffects();
  const records = rawRecords
    .filter((record) => (parsed.kindFilter ? record.kind?.toLowerCase() === parsed.kindFilter.toLowerCase() : true))
    .sort((a, b) => a.effectId.localeCompare(b.effectId));
  const entries = records.map((record) => toTaskListEntry(record, runDir));
  if (parsed.json) {
    console.log(JSON.stringify({ tasks: entries }, null, 2));
    return 0;
  }

  console.log(`[task:list] ${parsed.pendingOnly ? "pending" : "total"}=${entries.length}`);
  for (const entry of entries) {
    const record = records.find((candidate) => candidate.effectId === entry.effectId);
    const progressStr =
      record?.progressPercent !== undefined
        ? ` [${Math.round(record.progressPercent)}%${record.currentStep ? ` ${record.currentStep}` : ""}]`
        : "";
    const costStr = record?.costUsd !== undefined ? ` $${record.costUsd.toFixed(4)}` : "";
    const label = entry.label ? ` ${entry.label}` : "";
    console.log(`- ${entry.effectId} [${entry.kind ?? "unknown"} ${entry.status}]${label}${progressStr}${costStr} (taskId=${entry.taskId ?? "n/a"})`);
  }
  return 0;
}

export async function handleTaskShow(parsed: ParsedArgs): Promise<number> {
  if (!parsed.runDirArg || !parsed.effectId) {
    console.error(USAGE);
    return 1;
  }
  const runDir = resolveRunDir(parsed.runsDir, parsed.runDirArg);
  const secretLogsAllowed = allowSecretLogs(parsed);
  logVerbose("task:show", parsed, { runDir, effectId: parsed.effectId, json: parsed.json, secretLogsAllowed });

  const index = await buildEffectIndexSafe(runDir, "task:show");
  const record = index?.getByEffectId(parsed.effectId);
  if (!index || !record) {
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
    console.log(JSON.stringify({ effect: entry, task: secretLogsAllowed ? taskDef : null, result: secretLogsAllowed ? inlineResult : null, largeResult: largeResultRef }));
    return 0;
  }

  console.log(`[task:show] ${entry.effectId} [${entry.kind ?? "unknown"} ${entry.status}] ${entry.label ?? "(no label)"} (taskId=${entry.taskId})`);
  console.log(`  stepId=${entry.stepId} requestedAt=${entry.requestedAt ?? "n/a"} resolvedAt=${entry.resolvedAt ?? "n/a"}`);
  console.log(`  taskDefRef=${entry.taskDefRef ?? "n/a"}`);
  console.log(`  inputsRef=${entry.inputsRef ?? "n/a"}`);
  console.log(`  resultRef=${entry.resultRef ?? "n/a"}`);
  console.log(`  stdoutRef=${entry.stdoutRef ?? "n/a"}`);
  console.log(`  stderrRef=${entry.stderrRef ?? "n/a"}`);
  if (!secretLogsAllowed) {
    console.log("  payloads: redacted (set BABYSITTER_ALLOW_SECRET_LOGS=true and rerun with --json --verbose to view task/result blobs)");
    console.log(!inlineResult && !preview.large ? "  result: (not yet written)" : "");
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
