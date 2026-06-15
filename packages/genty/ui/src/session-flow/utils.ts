export function previewText(value: string, maxLength = 180): string {
  const flattened = value.replace(/\s+/g, ' ').trim();
  if (flattened.length <= maxLength) {
    return flattened;
  }
  return `${flattened.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function renderPayload(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function toTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function computeSegmentWeight(detail: string, start: number | null, end: number | null): number {
  const durationMs = start != null && end != null ? Math.max(0, end - start) : 0;
  if (durationMs > 0) {
    return Math.max(1, Math.min(10, Math.round(durationMs / 1000) + 1));
  }
  return Math.max(1, Math.min(7, Math.ceil(Math.max(16, detail.length) / 28)));
}

export function pushUnique(target: string[], values: Iterable<string>): void {
  for (const value of values) {
    if (value.length === 0 || target.includes(value)) {
      continue;
    }
    target.push(value);
  }
}

const FILE_PATH_KEYS = new Set([
  'path',
  'paths',
  'file',
  'files',
  'file_path',
  'filePath',
  'filePaths',
  'relative_path',
  'relativePath',
  'target',
  'target_path',
  'targetPath',
  'source_path',
  'sourcePath',
  'oldPath',
  'newPath',
  'output_path',
  'outputPath',
]);

const FILE_BASENAME_PATTERN = /^(dockerfile|makefile|procfile|gemfile|rakefile|justfile|readme(?:\.[^.]+)?|license(?:\.[^.]+)?|jenkinsfile|brewfile|tiltfile|vagrantfile)$/i;

function normalizePotentialPath(value: string): string | null {
  const trimmed = value.trim().replace(/^["'`]+|["'`]+$/g, '');
  if (trimmed.length === 0 || trimmed.length > 300 || /[\r\n]/.test(trimmed) || trimmed.endsWith('/') || trimmed.endsWith('\\')) {
    return null;
  }
  const normalized = trimmed.replace(/^vscode:\/\/file/, '');
  const basename = normalized.split(/[\\/]/).filter(Boolean).at(-1) ?? normalized;
  const hasExtension = /\.[A-Za-z0-9_-]{1,16}$/.test(basename);
  if (hasExtension || FILE_BASENAME_PATTERN.test(basename)) {
    return normalized;
  }
  return null;
}

export function collectPaths(value: unknown, depth = 0, results = new Set<string>()): Set<string> {
  if (depth > 5 || value == null) {
    return results;
  }
  if (typeof value === 'string') {
    const normalized = normalizePotentialPath(value);
    if (normalized) {
      results.add(normalized);
    }
    return results;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectPaths(item, depth + 1, results);
    }
    return results;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (FILE_PATH_KEYS.has(key)) {
        collectPaths(child, depth + 1, results);
        continue;
      }
      if (depth < 4) {
        collectPaths(child, depth + 1, results);
      }
    }
  }
  return results;
}

export function sortByTimestamp<T extends { timestamp?: number | null; startedAt?: number | null; path?: string }>(left: T, right: T): number {
  const leftValue = left.timestamp ?? left.startedAt ?? 0;
  const rightValue = right.timestamp ?? right.startedAt ?? 0;
  if (leftValue !== rightValue) {
    return leftValue - rightValue;
  }
  return String(left.path ?? '').localeCompare(String(right.path ?? ''));
}
