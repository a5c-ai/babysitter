import { randomUUID } from "node:crypto";

import {
  normalizeKanbanDispatchContextLabel,
  normalizeKanbanDispatchContextLabelRefs,
  normalizeKanbanDispatchContextLabelKey,
  normalizeKanbanDispatchContextLabels,
  type KanbanDispatchContextLabelDefinition,
} from "@a5c-ai/agent-mux-comm/kanban";

import { AppError } from "../error-handler.js";
import {
  defaultKanbanStorageDeps,
  readKanbanStorageFile,
  writeKanbanStorageFile,
  type KanbanStorageDeps,
  type KanbanStoragePayload,
} from "./kanban-storage.js";

export interface CreateDispatchContextLabelInput {
  readonly key: string;
  readonly label: string;
  readonly instruction: string;
  readonly description?: string;
  readonly order?: number;
}

export interface UpdateDispatchContextLabelInput {
  readonly key?: string;
  readonly label?: string;
  readonly instruction?: string;
  readonly description?: string;
  readonly order?: number;
}

export interface DispatchContextLabelMutationResult {
  readonly dispatchContextLabel: KanbanDispatchContextLabelDefinition;
  readonly dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[];
}

export interface DispatchContextLabelDeleteResult {
  readonly dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[];
}

interface DispatchContextLabelServiceDeps extends KanbanStorageDeps {
  readonly now: () => string;
  readonly createId: () => string;
}

const defaultDeps: DispatchContextLabelServiceDeps = {
  ...defaultKanbanStorageDeps,
  now: () => new Date().toISOString(),
  createId: () => `dispatch-context-label-${randomUUID()}`,
};

function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new AppError(`${fieldName} is required.`, "BAD_REQUEST", 400);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new AppError(`${fieldName} is required.`, "BAD_REQUEST", 400);
  }

  return normalized;
}

function normalizeDescription(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new AppError("description must be a string when provided.", "BAD_REQUEST", 400);
  }

  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeOrder(value: unknown, fallbackOrder: number): number {
  if (value === undefined) {
    return fallbackOrder;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AppError("order must be a finite number when provided.", "BAD_REQUEST", 400);
  }
  return Math.max(0, Math.floor(value));
}

function normalizeKey(value: unknown): string {
  const trimmed = requireString(value, "key");
  const normalized = normalizeKanbanDispatchContextLabelKey(trimmed);

  if (!normalized || normalized !== trimmed) {
    throw new AppError("key must be lowercase snake_case.", "BAD_REQUEST", 400);
  }

  return normalized;
}

function nextOrder(
  dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[],
): number {
  if (dispatchContextLabels.length === 0) {
    return 0;
  }
  return Math.max(...dispatchContextLabels.map((label) => label.order)) + 1;
}

export class DispatchContextLabelService {
  private readonly deps: DispatchContextLabelServiceDeps;

  constructor(overrides: Partial<DispatchContextLabelServiceDeps> = {}) {
    this.deps = { ...defaultDeps, ...overrides };
  }

  private async readStorage(): Promise<{
    storage: KanbanStoragePayload;
    dispatchContextLabels: KanbanDispatchContextLabelDefinition[];
  }> {
    const storage = (await readKanbanStorageFile(this.deps)) ?? {};
    return {
      storage,
      dispatchContextLabels: normalizeKanbanDispatchContextLabels(
        storage.dispatchContextLabels ?? [],
      ),
    };
  }

  private async writeStorage(
    storage: KanbanStoragePayload,
    dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[],
  ): Promise<readonly KanbanDispatchContextLabelDefinition[]> {
    const normalized = normalizeKanbanDispatchContextLabels(dispatchContextLabels);
    await writeKanbanStorageFile(this.deps, {
      ...storage,
      dispatchContextLabels: normalized,
    });
    return normalized;
  }

  private assertUniqueKey(
    dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[],
    key: string,
    excludeLabelId?: string,
  ): void {
    const existing = dispatchContextLabels.find(
      (label) => label.key === key && label.id !== excludeLabelId,
    );

    if (existing) {
      throw new AppError(`Dispatch Context Label key ${key} already exists.`, "CONFLICT", 409);
    }
  }

  async listDispatchContextLabels(): Promise<
    readonly KanbanDispatchContextLabelDefinition[]
  > {
    const { dispatchContextLabels } = await this.readStorage();
    return dispatchContextLabels;
  }

  async createDispatchContextLabel(
    input: CreateDispatchContextLabelInput,
  ): Promise<DispatchContextLabelMutationResult> {
    const { storage, dispatchContextLabels } = await this.readStorage();
    const now = this.deps.now();
    const key = normalizeKey(input.key);
    this.assertUniqueKey(dispatchContextLabels, key);

    const created = normalizeKanbanDispatchContextLabel({
      id: this.deps.createId(),
      key,
      label: requireString(input.label, "label"),
      instruction: requireString(input.instruction, "instruction"),
      description: normalizeDescription(input.description),
      order: normalizeOrder(input.order, nextOrder(dispatchContextLabels)),
      createdAt: now,
      updatedAt: now,
    });

    const nextLabels = await this.writeStorage(storage, [
      ...dispatchContextLabels,
      created,
    ]);

    return {
      dispatchContextLabel:
        nextLabels.find((label) => label.id === created.id) ?? created,
      dispatchContextLabels: nextLabels,
    };
  }

  async updateDispatchContextLabel(
    dispatchContextLabelId: string,
    input: UpdateDispatchContextLabelInput,
  ): Promise<DispatchContextLabelMutationResult> {
    const { storage, dispatchContextLabels } = await this.readStorage();
    const current = dispatchContextLabels.find((label) => label.id === dispatchContextLabelId);

    if (!current) {
      throw new AppError(
        `Dispatch Context Label ${dispatchContextLabelId} not found.`,
        "NOT_FOUND",
        404,
      );
    }

    const nextKey = input.key === undefined ? current.key : normalizeKey(input.key);
    this.assertUniqueKey(dispatchContextLabels, nextKey, dispatchContextLabelId);

    const nextLabel = normalizeKanbanDispatchContextLabel({
      ...current,
      key: nextKey,
      label: input.label === undefined ? current.label : requireString(input.label, "label"),
      instruction:
        input.instruction === undefined
          ? current.instruction
          : requireString(input.instruction, "instruction"),
      description:
        input.description === undefined
          ? current.description
          : normalizeDescription(input.description),
      order:
        input.order === undefined
          ? current.order
          : normalizeOrder(input.order, current.order),
      updatedAt: this.deps.now(),
    });

    const nextLabels = await this.writeStorage(
      storage,
      dispatchContextLabels.map((label) =>
        label.id === dispatchContextLabelId ? nextLabel : label,
      ),
    );

    return {
      dispatchContextLabel:
        nextLabels.find((label) => label.id === dispatchContextLabelId) ?? nextLabel,
      dispatchContextLabels: nextLabels,
    };
  }

  async deleteDispatchContextLabel(
    dispatchContextLabelId: string,
  ): Promise<DispatchContextLabelDeleteResult> {
    const { storage, dispatchContextLabels } = await this.readStorage();

    if (!dispatchContextLabels.some((label) => label.id === dispatchContextLabelId)) {
      throw new AppError(
        `Dispatch Context Label ${dispatchContextLabelId} not found.`,
        "NOT_FOUND",
        404,
      );
    }

    const nextDispatchContextLabels = dispatchContextLabels.filter(
      (label) => label.id !== dispatchContextLabelId,
    );

    await writeKanbanStorageFile(this.deps, {
      ...storage,
      issues: storage.issues?.map((issue) => ({
        ...issue,
        dispatch: issue.dispatch
          ? {
              ...issue.dispatch,
              contextLabels: normalizeKanbanDispatchContextLabelRefs(
                issue.dispatch.contextLabels ?? [],
              ).filter((ref) => ref.labelId !== dispatchContextLabelId),
            }
          : issue.dispatch,
      })),
      dispatchContextLabels: normalizeKanbanDispatchContextLabels(nextDispatchContextLabels),
    });

    return {
      dispatchContextLabels: normalizeKanbanDispatchContextLabels(nextDispatchContextLabels),
    };
  }
}
