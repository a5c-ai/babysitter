import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import * as path from "node:path";
import { commitEffectCancellation, commitEffectResult } from "../../runtime/commitEffectResult";
import { readTaskDefinition } from "../../storage/tasks";
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

function validateSha256(value: string | undefined, flag: string): boolean {
  if (value === undefined) return true;
  if (/^[a-f0-9]{64}$/.test(value)) return true;
  console.error(`[task:post] ${flag} must be exactly 64 lowercase hexadecimal characters`);
  return false;
}

async function readChecksumBoundFile(
  runDir: string,
  filename: string,
  expectedSha256: string,
  flag: "--value-sha256" | "--error-sha256",
): Promise<Buffer> {
  if (filename === "-") {
    throw new Error(`[task:post] ${flag} requires a file path, not stdin`);
  }
  const bytes = await fs.readFile(resolveMaybeRunRelative(runDir, filename)!);
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  if (actualSha256 !== expectedSha256) {
    throw new Error(`[task:post] ${flag} checksum mismatch`);
  }
  return bytes;
}


function parseErrorBytes(bytes: Buffer, requireJson: boolean): unknown {
  const trimmed = bytes.toString("utf8").trim();
  if (!trimmed.length) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch (error) {
    if (requireJson) throw error;
    const message = trimmed.replace(/^Error:\s*/, "");
    return { name: "Error", message };
  }
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

/**
 * Read the `--error` file for `task:post --status error`.
 *
 * #936: callers (notably genty's in-process DefaultOrchestrationProvider) may
 * write a bare, NON-JSON error string (e.g. `Error: Effect failed`) into this
 * file. JSON.parsing it unguarded produced the cryptic
 *   `Unexpected token 'E', "Error: Effect failed" is not valid JSON`
 * SyntaxError categorized as an internal "please report as a bug" failure, and
 * — because the post then exited non-zero — spun the orchestration loop to its
 * 80-minute timeout. Here we tolerate a plain-text error: if the file is not
 * valid JSON, wrap it as a structured `{ name, message }` error payload so the
 * failure surfaces the real message and the run can fail promptly. Valid JSON
 * (a structured error) still round-trips unchanged.
 */
async function readErrorFile(runDir: string, filename?: string): Promise<unknown> {
  if (!filename) return undefined;
  const raw = filename === "-"
    ? await readStdinUtf8()
    : await fs.readFile(resolveMaybeRunRelative(runDir, filename)!, "utf8");
  return parseErrorBytes(Buffer.from(raw), false);
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
  if (!validateSha256(parsed.valueSha256, "--value-sha256")) return 1;
  if (!validateSha256(parsed.errorSha256, "--error-sha256")) return 1;
  if (parsed.valueSha256 && !parsed.valuePath) {
    console.error("[task:post] --value-sha256 requires --value <file>");
    return 1;
  }
  if (parsed.errorSha256 && !parsed.errorPath) {
    console.error("[task:post] --error-sha256 requires --error <file>");
    return 1;
  }
  if (parsed.taskStatus === "ok" && (parsed.errorPath || parsed.errorSha256)) {
    console.error("[task:post] --error and --error-sha256 require --status error");
    return 1;
  }
  if (parsed.taskStatus === "error" && (parsed.valuePath || parsed.valueInline || parsed.valueSha256)) {
    console.error("[task:post] --value, --value-inline, and --value-sha256 require --status ok");
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
  let errorPayload: unknown;
  if (parsed.taskStatus === "error") {
    if (parsed.errorPath && parsed.errorSha256) {
      const bytes = await readChecksumBoundFile(
        runDir,
        parsed.errorPath,
        parsed.errorSha256,
        "--error-sha256",
      );
      errorPayload = parseErrorBytes(bytes, true);
    } else {
      errorPayload = await readErrorFile(runDir, parsed.errorPath);
    }
    errorPayload ??= { name: "Error", message: "Task reported failure" };
  }
  let value: unknown;
  if (parsed.taskStatus === "ok") {
    if (parsed.valueInline) {
      value = readInlineJson(parsed.valueInline);
    } else if (parsed.valuePath && parsed.valueSha256) {
      const bytes = await readChecksumBoundFile(
        runDir,
        parsed.valuePath,
        parsed.valueSha256,
        "--value-sha256",
      );
      const trimmed = bytes.toString("utf8").trim();
      value = trimmed.length ? (JSON.parse(trimmed) as unknown) : undefined;
    } else {
      value = await readJsonFile(runDir, parsed.valuePath);
    }
  }
  const committedStatus = parsed.taskStatus;

  const plan = {
    runDir: toRunRelativePosix(runDir, runDir) ?? runDir,
    effectId: parsed.effectId,
    status: committedStatus,
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
            value,
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
    console.log(JSON.stringify({ status: committedStatus, committed, stdoutRef, stderrRef, resultRef }));
  } else {
    const parts = [`[task:post] status=${committedStatus}`];
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
