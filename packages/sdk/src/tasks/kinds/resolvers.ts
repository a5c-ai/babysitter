/**
 * Value resolver functions for task kind builders.
 * Extracted from index.ts for max-lines compliance.
 */

import type { JsonRecord } from "../../storage/types";
import type {
  TaskBuildContext,
  TaskIOHints,
  TaskValueFactory,
  TaskValueOrFactory,
} from "../types";

export async function resolveOptionalValue<TArgs, TValue>(
  source: TaskValueOrFactory<TArgs, TValue | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<TValue | undefined> {
  if (source === undefined || source === null) return undefined;
  const value = isFactory(source) ? await source(args, ctx) : source;
  return value === null ? undefined : value;
}

export async function resolveRequiredValue<TArgs>(
  source: TaskValueOrFactory<TArgs, string>,
  args: TArgs,
  ctx: TaskBuildContext,
  field: string
): Promise<string> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`nodeTask requires a non-empty ${field}`);
  }
  return value;
}

export async function resolveLabelList<TArgs>(
  source: TaskValueOrFactory<TArgs, string[] | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<string[] | undefined> {
  const values = await resolveOptionalValue(source, args, ctx);
  if (!Array.isArray(values)) return undefined;
  return normalizeLabels(values);
}

export async function resolveMetadata<TArgs>(
  source: TaskValueOrFactory<TArgs, JsonRecord | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<JsonRecord | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (!isJsonRecord(value)) return undefined;
  return { ...value };
}

export async function resolveIoHints<TArgs>(
  source: TaskValueOrFactory<TArgs, TaskIOHints | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<TaskIOHints | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (!value) return undefined;
  return { ...value };
}

export async function resolveStringArray<TArgs>(
  source: TaskValueOrFactory<TArgs, string[] | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<string[] | undefined> {
  const values = await resolveOptionalValue(source, args, ctx);
  if (!Array.isArray(values)) return undefined;
  return values.slice();
}

export async function resolveEnv<TArgs>(
  source: TaskValueOrFactory<TArgs, Record<string, string | undefined> | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<Record<string, string | undefined> | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (!value || typeof value !== "object") return undefined;
  return { ...value };
}

export async function resolveNumber<TArgs>(
  source: TaskValueOrFactory<TArgs, number | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<number | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

export async function resolveBoolean<TArgs>(
  source: TaskValueOrFactory<TArgs, boolean | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<boolean | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (typeof value !== "boolean") return undefined;
  return value;
}

export async function resolvePayload<TArgs>(
  source: TaskValueOrFactory<TArgs, JsonRecord | undefined> | undefined,
  args: TArgs,
  ctx: TaskBuildContext
): Promise<JsonRecord | undefined> {
  const value = await resolveOptionalValue(source, args, ctx);
  if (!isJsonRecord(value)) return undefined;
  return { ...value };
}

function isFactory<TArgs, TValue>(value: TaskValueOrFactory<TArgs, TValue>): value is TaskValueFactory<TArgs, TValue> {
  return typeof value === "function";
}

export function normalizeLabels(values?: string[]): string[] | undefined {
  if (!Array.isArray(values)) return undefined;
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const label of values) {
    if (typeof label !== "string") continue;
    const trimmed = label.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized.length ? normalized : undefined;
}

export function mergeLabels(ctx: TaskBuildContext, helperLabels?: string[], fallback?: string): string[] | undefined {
  const combined: string[] = [];
  combined.push(...(normalizeLabels(ctx.labels) ?? []));
  combined.push(...(helperLabels ?? []));
  const normalized = normalizeLabels(combined);
  const fallbackLabel = typeof fallback === "string" ? fallback.trim() : undefined;
  if ((!ctx.label || !ctx.label.trim()) && (!normalized || normalized.length === 0) && fallbackLabel) {
    return [fallbackLabel];
  }
  return normalized;
}

export function ensureMetadata(metadata?: JsonRecord): JsonRecord {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) return { ...metadata };
  return {};
}

export function pickJsonRecord(value: unknown): JsonRecord | undefined {
  if (!isJsonRecord(value)) return undefined;
  return { ...value };
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
