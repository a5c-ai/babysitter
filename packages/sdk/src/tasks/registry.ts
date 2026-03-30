import { JsonRecord } from "../storage/types";

export type TaskStatus = "pending" | "resolved_ok" | "resolved_error";

export interface RegisteredTaskDefinition {
  id: string;
  kind?: string;
  labels: string[];
  description?: string;
  source?: string;
}

export interface RegistryEffectRecord {
  effectId: string;
  taskId: string;
  invocationKey: string;
  kind: string;
  label?: string;
  labels?: string[];
  status: TaskStatus;
  taskDefRef: string;
  inputsRef?: string;
  resultRef?: string;
  stdoutRef?: string;
  stderrRef?: string;
  metadata?: JsonRecord;
  stepId?: string;
  requestedAt?: string;
  resolvedAt?: string;
}

export interface PendingFilter {
  kind?: string | string[];
  labels?: string | string[];
}

export class DuplicateTaskIdError extends Error {
  constructor(taskId: string) {
    super(`Task id "${taskId}" is already registered`);
    this.name = "DuplicateTaskIdError";
  }
}

export class TaskRegistry {
  private definitions = new Map<string, RegisteredTaskDefinition>();
  private effects = new Map<string, RegistryEffectRecord>();

  registerDefinition(record: RegisteredTaskDefinition): RegisteredTaskDefinition {
    if (this.definitions.has(record.id)) {
      throw new DuplicateTaskIdError(record.id);
    }
    const normalized: RegisteredTaskDefinition = {
      id: record.id,
      kind: record.kind,
      labels: normalizeLabels(record.labels),
      description: record.description,
      source: record.source,
    };
    this.definitions.set(record.id, normalized);
    return normalized;
  }

  recordDefinitionMetadata(taskId: string, metadata: Partial<Omit<RegisteredTaskDefinition, "id">>): void {
    const current = this.definitions.get(taskId);
    if (!current) {
      this.definitions.set(taskId, {
        id: taskId,
        labels: normalizeLabels(metadata.labels ?? []),
        kind: metadata.kind,
        description: metadata.description,
        source: metadata.source,
      });
      return;
    }
    this.definitions.set(taskId, {
      ...current,
      ...metadata,
      labels: normalizeLabels(metadata.labels ?? current.labels),
    });
  }

  recordEffect(record: RegistryEffectRecord): RegistryEffectRecord {
    const normalizedLabels = normalizeLabels(record.labels ?? []);
    const normalized = {
      ...record,
      label: normalizeLabelValue(record.label),
      labels: normalizedLabels.length ? normalizedLabels : undefined,
      kind: record.kind,
      status: record.status,
      inputsRef: record.inputsRef,
    };
    this.effects.set(record.effectId, normalized);
    return normalized;
  }

  resolveEffect(effectId: string, update: Partial<RegistryEffectRecord>): RegistryEffectRecord | undefined {
    const current = this.effects.get(effectId);
    if (!current) return undefined;
    const next: RegistryEffectRecord = {
      ...current,
      ...update,
    };
    if (update.status) {
      next.status = update.status;
    }
    this.effects.set(effectId, next);
    return next;
  }

  get(effectId: string): RegistryEffectRecord | undefined {
    return this.effects.get(effectId);
  }

  listPending(filter?: PendingFilter): RegistryEffectRecord[] {
    const pending = Array.from(this.effects.values()).filter((record) => record.status === "pending");
    return pending
      .filter((record) => this.matchesKind(record, filter?.kind) && this.matchesLabel(record, filter?.labels))
      .sort((a, b) => a.effectId.localeCompare(b.effectId));
  }

  listDefinitions(): RegisteredTaskDefinition[] {
    return Array.from(this.definitions.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  hasTask(taskId: string): boolean {
    return this.definitions.has(taskId);
  }

  clear(): void {
    this.definitions.clear();
    this.effects.clear();
  }

  private matchesKind(record: RegistryEffectRecord, kinds?: string | string[]): boolean {
    if (!kinds) return true;
    const asArray = Array.isArray(kinds) ? kinds : [kinds];
    if (!asArray.length) return true;
    return asArray.some((kind) => kind === record.kind);
  }

  private matchesLabel(record: RegistryEffectRecord, labels?: string | string[]): boolean {
    if (!labels) return true;
    const values = Array.isArray(labels) ? labels : [labels];
    if (!values.length) return true;
    const metadataLabels = this.extractMetadataLabels(record.metadata);
    const definitionLabels = this.definitions.get(record.taskId)?.labels ?? [];
    const labelSet = new Set<string>(
      [record.label, ...(record.labels ?? []), ...metadataLabels, ...definitionLabels].filter(
        (label): label is string => typeof label === "string" && Boolean(label)
      )
    );
    return values.some((value) => labelSet.has(value));
  }

  private extractMetadataLabels(metadata?: JsonRecord): string[] {
    if (!metadata) return [];
    const labels = metadata.labels;
    return Array.isArray(labels)
      ? labels.filter((label): label is string => typeof label === "string" && Boolean(label))
      : [];
  }
}

const GLOBAL_TASK_REGISTRY_KEY = Symbol.for("@a5c-ai/babysitter-sdk/taskRegistry");
const registryHost = globalThis as typeof globalThis & { [GLOBAL_TASK_REGISTRY_KEY]?: TaskRegistry };

export const globalTaskRegistry = registryHost[GLOBAL_TASK_REGISTRY_KEY] ?? (
  registryHost[GLOBAL_TASK_REGISTRY_KEY] = new TaskRegistry()
);

export function resetGlobalTaskRegistry(): void {
  globalTaskRegistry.clear();
}

function normalizeLabels(labels: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const label of labels) {
    if (typeof label !== "string") continue;
    const trimmed = label.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function normalizeLabelValue(label?: string): string | undefined {
  if (typeof label !== "string") return undefined;
  const trimmed = label.trim();
  return trimmed.length ? trimmed : undefined;
}
