import { randomUUID } from "node:crypto";

import {
  normalizeKanbanTaskTag,
  normalizeKanbanTaskTagKey,
  normalizeKanbanTaskTags,
  type KanbanTaskTag,
} from "@a5c-ai/agent-mux-comm/kanban";

import { AppError } from "../error-handler.js";
import {
  defaultKanbanStorageDeps,
  readKanbanStorageFile,
  writeKanbanStorageFile,
  type KanbanStorageDeps,
  type KanbanStoragePayload,
} from "./kanban-storage.js";

export interface CreateTaskTagInput {
  readonly key: string;
  readonly label: string;
  readonly content: string;
  readonly description?: string;
  readonly order?: number;
}

export interface UpdateTaskTagInput {
  readonly key?: string;
  readonly label?: string;
  readonly content?: string;
  readonly description?: string;
  readonly order?: number;
}

export interface TaskTagMutationResult {
  readonly taskTag: KanbanTaskTag;
  readonly taskTags: readonly KanbanTaskTag[];
}

export interface TaskTagDeleteResult {
  readonly taskTags: readonly KanbanTaskTag[];
}

interface TaskTagServiceDeps extends KanbanStorageDeps {
  readonly now: () => string;
  readonly createId: () => string;
}

const defaultDeps: TaskTagServiceDeps = {
  ...defaultKanbanStorageDeps,
  now: () => new Date().toISOString(),
  createId: () => `task-tag-${randomUUID()}`,
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
  const normalized = normalizeKanbanTaskTagKey(trimmed);

  if (!normalized || normalized !== trimmed) {
    throw new AppError("key must be lowercase snake_case.", "BAD_REQUEST", 400);
  }

  return normalized;
}

function nextOrder(taskTags: readonly KanbanTaskTag[]): number {
  if (taskTags.length === 0) {
    return 0;
  }
  return Math.max(...taskTags.map((taskTag) => taskTag.order)) + 1;
}

export class TaskTagService {
  private readonly deps: TaskTagServiceDeps;

  constructor(overrides: Partial<TaskTagServiceDeps> = {}) {
    this.deps = { ...defaultDeps, ...overrides };
  }

  private async readStorage(): Promise<{
    storage: KanbanStoragePayload;
    taskTags: KanbanTaskTag[];
  }> {
    const storage = (await readKanbanStorageFile(this.deps)) ?? {};
    return {
      storage,
      taskTags: normalizeKanbanTaskTags(storage.taskTags ?? []),
    };
  }

  private async writeStorage(
    storage: KanbanStoragePayload,
    taskTags: readonly KanbanTaskTag[],
  ): Promise<readonly KanbanTaskTag[]> {
    const normalizedTaskTags = normalizeKanbanTaskTags(taskTags);
    await writeKanbanStorageFile(this.deps, {
      ...storage,
      taskTags: normalizedTaskTags,
    });
    return normalizedTaskTags;
  }

  private assertUniqueKey(
    taskTags: readonly KanbanTaskTag[],
    key: string,
    excludeTaskTagId?: string,
  ): void {
    const existing = taskTags.find(
      (taskTag) => taskTag.key === key && taskTag.id !== excludeTaskTagId,
    );

    if (existing) {
      throw new AppError(`Task Tag key ${key} already exists.`, "CONFLICT", 409);
    }
  }

  async listTaskTags(): Promise<readonly KanbanTaskTag[]> {
    const { taskTags } = await this.readStorage();
    return taskTags;
  }

  async createTaskTag(input: CreateTaskTagInput): Promise<TaskTagMutationResult> {
    const { storage, taskTags } = await this.readStorage();
    const now = this.deps.now();
    const key = normalizeKey(input.key);
    this.assertUniqueKey(taskTags, key);

    const createdTaskTag = normalizeKanbanTaskTag({
      id: this.deps.createId(),
      key,
      label: requireString(input.label, "label"),
      content: requireString(input.content, "content"),
      description: normalizeDescription(input.description),
      order: normalizeOrder(input.order, nextOrder(taskTags)),
      createdAt: now,
      updatedAt: now,
    });

    const nextTaskTags = await this.writeStorage(storage, [...taskTags, createdTaskTag]);
    return {
      taskTag:
        nextTaskTags.find((taskTag) => taskTag.id === createdTaskTag.id) ?? createdTaskTag,
      taskTags: nextTaskTags,
    };
  }

  async updateTaskTag(taskTagId: string, input: UpdateTaskTagInput): Promise<TaskTagMutationResult> {
    const { storage, taskTags } = await this.readStorage();
    const currentTaskTag = taskTags.find((taskTag) => taskTag.id === taskTagId);

    if (!currentTaskTag) {
      throw new AppError(`Task Tag ${taskTagId} not found.`, "NOT_FOUND", 404);
    }

    const nextKey = input.key === undefined ? currentTaskTag.key : normalizeKey(input.key);
    this.assertUniqueKey(taskTags, nextKey, taskTagId);

    const nextTaskTag = normalizeKanbanTaskTag({
      ...currentTaskTag,
      key: nextKey,
      label:
        input.label === undefined
          ? currentTaskTag.label
          : requireString(input.label, "label"),
      content:
        input.content === undefined
          ? currentTaskTag.content
          : requireString(input.content, "content"),
      description:
        input.description === undefined
          ? currentTaskTag.description
          : normalizeDescription(input.description),
      order:
        input.order === undefined
          ? currentTaskTag.order
          : normalizeOrder(input.order, currentTaskTag.order),
      updatedAt: this.deps.now(),
    });

    const nextTaskTags = await this.writeStorage(
      storage,
      taskTags.map((taskTag) => (taskTag.id === taskTagId ? nextTaskTag : taskTag)),
    );

    return {
      taskTag: nextTaskTags.find((taskTag) => taskTag.id === taskTagId) ?? nextTaskTag,
      taskTags: nextTaskTags,
    };
  }

  async deleteTaskTag(taskTagId: string): Promise<TaskTagDeleteResult> {
    const { storage, taskTags } = await this.readStorage();

    if (!taskTags.some((taskTag) => taskTag.id === taskTagId)) {
      throw new AppError(`Task Tag ${taskTagId} not found.`, "NOT_FOUND", 404);
    }

    return {
      taskTags: await this.writeStorage(
        storage,
        taskTags.filter((taskTag) => taskTag.id !== taskTagId),
      ),
    };
  }
}
