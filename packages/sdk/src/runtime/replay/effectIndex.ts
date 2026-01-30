import { loadJournal } from "../../storage/journal";
import { JournalEvent } from "../../storage/types";
import { RunFailedError } from "../exceptions";
import { EffectRecord, EffectStatus, SerializedEffectError } from "../types";
import { serializeUnknownError } from "../errorUtils";

export interface BuildEffectIndexOptions {
  runDir: string;
  events?: JournalEvent[];
}

type SupportedEventType = "RUN_CREATED" | "RUN_COMPLETED" | "RUN_FAILED" | "EFFECT_REQUESTED" | "EFFECT_RESOLVED";

interface EffectRequestedPayload {
  effectId: string;
  invocationKey: string;
  invocationHash?: string;
  stepId: string;
  taskId: string;
  kind?: string;
  label?: string;
  labels?: string[];
  taskDefRef?: string;
  inputsRef?: string;
}

interface EffectResolvedPayload {
  effectId: string;
  status: "ok" | "error";
  resultRef?: string;
  error?: SerializedEffectError;
  stdoutRef?: string;
  stderrRef?: string;
}

export class EffectIndex {
  private readonly byInvocation = new Map<string, EffectRecord>();
  private readonly byEffectId = new Map<string, EffectRecord>();
  private journalHead?: { seq: number; ulid: string };
  private initialized = false;

  private constructor(private readonly runDir: string) {}

  static async build(options: BuildEffectIndexOptions): Promise<EffectIndex> {
    const events = options.events ?? (await loadJournalSafe(options.runDir));
    const index = new EffectIndex(options.runDir);
    index.applyEvents(events);
    index.initialized = true;
    return index;
  }

  private applyEvents(events: JournalEvent[]) {
    events.forEach((event, idx) => {
      const expectedSeq = idx + 1;
      this.applyEvent(event, expectedSeq);
    });
  }

  applyEvent(event: JournalEvent, expectedSeq?: number) {
    this.validateSequence(event, expectedSeq);
    const type = event.type as SupportedEventType;
    switch (type) {
      case "RUN_CREATED":
      case "RUN_COMPLETED":
      case "RUN_FAILED":
        return;
      case "EFFECT_REQUESTED":
        this.handleEffectRequested(event);
        return;
      case "EFFECT_RESOLVED":
        this.handleEffectResolved(event);
        return;
      default:
        throw new RunFailedError(`Unknown journal event type '${event.type}'`, {
          path: event.path,
          seq: event.seq,
        });
    }
  }

  getByInvocation(invocationKey: string): EffectRecord | undefined {
    return this.byInvocation.get(invocationKey);
  }

  getByEffectId(effectId: string): EffectRecord | undefined {
    return this.byEffectId.get(effectId);
  }

  listEffects(): EffectRecord[] {
    return Array.from(this.byEffectId.values());
  }

  listPendingEffects(): EffectRecord[] {
    return this.listEffects().filter((record) => record.status === "requested");
  }

  getJournalHead() {
    return this.journalHead;
  }

  private validateSequence(event: JournalEvent, expectedSeq?: number) {
    if (!Number.isFinite(event.seq) || event.seq <= 0) {
      throw new RunFailedError(`Invalid journal sequence number in ${event.filename}`, {
        path: event.path,
      });
    }
    if (typeof event.ulid !== "string" || !event.ulid) {
      throw new RunFailedError(`Invalid ULID on journal event ${event.filename}`, {
        path: event.path,
      });
    }
    if (!this.journalHead) {
      if (event.seq !== (expectedSeq ?? 1)) {
        throw new RunFailedError(`Journal seq mismatch at ${event.filename} (expected 1, got ${event.seq})`, {
          path: event.path,
        });
      }
      this.journalHead = { seq: event.seq, ulid: event.ulid };
      return;
    }
    const nextSeq = this.journalHead.seq + 1;
    const shouldMatch = expectedSeq ?? nextSeq;
    if (event.seq !== shouldMatch) {
      throw new RunFailedError(
        `Journal sequence gap detected at ${event.filename} (expected ${shouldMatch}, got ${event.seq})`,
        { path: event.path }
      );
    }
    if (event.seq <= this.journalHead.seq) {
      throw new RunFailedError(
        `Journal sequence regression at ${event.filename} (prev ${this.journalHead.seq}, got ${event.seq})`,
        { path: event.path }
      );
    }
    if (event.ulid <= this.journalHead.ulid) {
      throw new RunFailedError(
        `Journal ULID order regression at ${event.filename} (${event.ulid} <= ${this.journalHead.ulid})`,
        { path: event.path }
      );
    }
    this.journalHead = { seq: event.seq, ulid: event.ulid };
  }

  private handleEffectRequested(event: JournalEvent) {
    const payload = this.expectObject<EffectRequestedPayload>(event, "EFFECT_REQUESTED");
    const effectId = this.expectString(payload.effectId, "effectId", event);
    const invocationKey = this.expectString(payload.invocationKey, "invocationKey", event);
    const stepId = this.expectString(payload.stepId, "stepId", event);
    const taskId = this.expectString(payload.taskId, "taskId", event);
    const taskDefRef = this.expectString(payload.taskDefRef, "taskDefRef", event);
    const inputsRef = this.expectOptionalString(payload.inputsRef, "inputsRef", event);
    const labels = this.normalizeLabelArray(payload.labels, event);
    if (this.byEffectId.has(effectId)) {
      throw new RunFailedError(`Duplicate effectId detected: ${effectId}`, { path: event.path });
    }
    if (this.byInvocation.has(invocationKey)) {
      throw new RunFailedError(`Duplicate invocation key detected: ${invocationKey}`, {
        path: event.path,
      });
    }
    const record: EffectRecord = {
      effectId,
      invocationKey,
      invocationHash: payload.invocationHash,
      stepId,
      taskId,
      status: "requested",
      kind: payload.kind,
      label: payload.label,
      labels,
      taskDefRef,
      inputsRef,
      requestedAt: event.recordedAt,
    };
    this.byInvocation.set(record.invocationKey, record);
    this.byEffectId.set(record.effectId, record);
  }

  private handleEffectResolved(event: JournalEvent) {
    const payload = this.expectObject<EffectResolvedPayload>(event, "EFFECT_RESOLVED");
    const effectId = this.expectString(payload.effectId, "effectId", event);
    if (!payload.status) {
      throw new RunFailedError("Malformed EFFECT_RESOLVED event missing status", { path: event.path });
    }
    if (payload.status !== "ok" && payload.status !== "error") {
      throw new RunFailedError(`Unknown EFFECT_RESOLVED status '${String(payload.status)}'`, { path: event.path });
    }
    if (payload.resultRef && typeof payload.resultRef !== "string") {
      throw new RunFailedError("Malformed EFFECT_RESOLVED event resultRef", { path: event.path });
    }
    if (payload.stdoutRef && typeof payload.stdoutRef !== "string") {
      throw new RunFailedError("Malformed EFFECT_RESOLVED stdoutRef", { path: event.path });
    }
    if (payload.stderrRef && typeof payload.stderrRef !== "string") {
      throw new RunFailedError("Malformed EFFECT_RESOLVED stderrRef", { path: event.path });
    }
    const record = this.byEffectId.get(effectId);
    if (!record) {
      throw new RunFailedError(`EFFECT_RESOLVED references unknown effectId ${effectId}`, {
        path: event.path,
      });
    }
    if (record.status !== "requested") {
      throw new RunFailedError(`Effect ${effectId} already resolved`, { path: event.path });
    }
    const status: EffectStatus = payload.status === "ok" ? "resolved_ok" : "resolved_error";
    record.status = status;
    record.resultRef = payload.resultRef;
    record.error = payload.error;
    record.stdoutRef = payload.stdoutRef;
    record.stderrRef = payload.stderrRef;
    record.resolvedAt = event.recordedAt;
  }

  private expectObject<T>(event: JournalEvent, type: string): T {
    if (!event?.data || typeof event.data !== "object") {
      throw new RunFailedError(`Malformed ${type} event payload`, { path: event.path });
    }
    return event.data as T;
  }

  private expectString(value: unknown, field: string, event: JournalEvent): string {
    if (typeof value !== "string" || value.length === 0) {
      throw new RunFailedError(`Malformed journal event missing ${field}`, {
        path: event.path,
      });
    }
    return value;
  }

  private expectOptionalString(value: unknown, field: string, event: JournalEvent): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || value.length === 0) {
      throw new RunFailedError(`Malformed journal event ${field}`, {
        path: event.path,
      });
    }
    return value;
  }

  private normalizeLabelArray(value: unknown, event: JournalEvent): string[] | undefined {
    if (value === undefined) return undefined;
    if (!Array.isArray(value)) {
      throw new RunFailedError("Malformed EFFECT_REQUESTED labels payload", { path: event.path });
    }
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const entry of value) {
      if (typeof entry !== "string") {
        throw new RunFailedError("Malformed EFFECT_REQUESTED labels entry", { path: event.path });
      }
      const trimmed = entry.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      labels.push(trimmed);
    }
    return labels.length ? labels : undefined;
  }
}

async function loadJournalSafe(runDir: string): Promise<JournalEvent[]> {
  try {
    return await loadJournal(runDir);
  } catch (error) {
    throw normalizeJournalError(error, runDir);
  }
}

function normalizeJournalError(error: unknown, runDir: string): RunFailedError {
  if (error instanceof RunFailedError) return error;
  const err = error as NodeJS.ErrnoException & { cause?: unknown };
  if (err?.code === "JOURNAL_PARSE_FAILED") {
    return new RunFailedError("Failed to parse journal event", {
      path: err.path,
      runDir,
      error: err.message,
    });
  }
  const serialized = serializeUnknownError(err);
  return new RunFailedError("Failed to load journal for replay", {
    runDir,
    error: serialized,
  });
}

export async function buildEffectIndex(options: BuildEffectIndexOptions): Promise<EffectIndex> {
  return EffectIndex.build(options);
}
