import type { SessionFlowFileRecord } from './types.js';
import { pushUnique } from './utils.js';

export function recordFileTouch(
  files: Map<string, SessionFlowFileRecord>,
  path: string,
  kind: 'read' | 'write',
  runId: string,
  timestamp: number | null,
  toolName?: string,
): void {
  const existing = files.get(path) ?? {
    path,
    reads: 0,
    writes: 0,
    touches: 0,
    lastEventAt: null,
    runIds: [],
    tools: [],
  };
  if (kind === 'read') {
    existing.reads += 1;
  } else {
    existing.writes += 1;
  }
  existing.touches += 1;
  existing.lastEventAt = timestamp ?? existing.lastEventAt;
  if (!existing.runIds.includes(runId)) {
    existing.runIds.push(runId);
  }
  if (toolName && !existing.tools.includes(toolName)) {
    existing.tools.push(toolName);
  }
  files.set(path, existing);
}

export function mergeFileRecords(target: Map<string, SessionFlowFileRecord>, source: Iterable<SessionFlowFileRecord>): void {
  for (const file of source) {
    const existing = target.get(file.path);
    if (!existing) {
      target.set(file.path, { ...file, runIds: [...file.runIds], tools: [...file.tools] });
      continue;
    }
    existing.reads += file.reads;
    existing.writes += file.writes;
    existing.touches += file.touches;
    existing.lastEventAt = Math.max(existing.lastEventAt ?? 0, file.lastEventAt ?? 0) || null;
    pushUnique(existing.runIds, file.runIds);
    pushUnique(existing.tools, file.tools);
  }
}
