import type { TriggerChange } from '../types.js';

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

export function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function labelsFrom(value: unknown): string[] {
  return arr(value).map((entry) => str(asRecord(entry).name) ?? str(entry)).filter((entry): entry is string => Boolean(entry));
}

export function change(path: unknown, status?: unknown, patch?: unknown): TriggerChange | null {
  const filePath = str(path);
  if (!filePath) return null;
  return { path: filePath, status: str(status), patch: str(patch) };
}

export function collectText(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join('\n');
}
