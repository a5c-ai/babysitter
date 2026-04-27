import * as fsp from 'node:fs/promises';

import type { AgentName } from './types.js';
import type { SessionSummary, SessionListOptions } from './session-types.js';
import type { WorkspaceSessionContext } from './workspaces.js';

const FAST_LIST_BUFFER = 10;

type SessionShape = {
  agent: AgentName;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  turnCount: number;
  messages?: Array<unknown>;
  tags?: string[];
  model?: string;
  cost?: SessionSummary['cost'];
  cwd?: string;
  workspace?: WorkspaceSessionContext;
  workspaceId?: string;
  forkedFrom?: string;
};

type SessionAdapter = {
  parseSessionFile(filePath: string): Promise<SessionShape>;
};

export function canFastListByDate(
  options: SessionListOptions | undefined,
  sortField: string,
): boolean {
  return (
    sortField === 'date' &&
    options?.since == null &&
    options?.until == null &&
    options?.model == null &&
    (options?.tags == null || options.tags.length === 0)
  );
}

export async function listByRecentFiles(
  adapter: SessionAdapter,
  filePaths: string[],
  limit: number,
  sortDir: 'asc' | 'desc',
  resolveUnifiedId: (agent: AgentName, nativeSessionId: string) => string,
): Promise<SessionSummary[]> {
  const ranked = await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const stat = await fsp.stat(filePath);
        const createdMs = stat.birthtimeMs > 0 ? stat.birthtimeMs : stat.mtimeMs;
        return { filePath, createdMs };
      } catch {
        return { filePath, createdMs: 0 };
      }
    }),
  );

  ranked.sort((a, b) =>
    sortDir === 'asc' ? a.createdMs - b.createdMs : b.createdMs - a.createdMs,
  );

  const summaries: SessionSummary[] = [];
  const parseBudget = Math.max(limit + FAST_LIST_BUFFER, limit * 2);

  for (const candidate of ranked) {
    try {
      const session = await adapter.parseSessionFile(candidate.filePath);
      const { createdAt, updatedAt } = getSessionDates(session);
      summaries.push(buildSummary(session, createdAt, updatedAt, resolveUnifiedId));
      if (summaries.length >= parseBudget) break;
    } catch {
      // Skip unparseable session files
    }
  }

  summaries.sort((a, b) =>
    sortDir === 'asc'
      ? a.createdAt.getTime() - b.createdAt.getTime()
      : b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return summaries.slice(0, limit);
}

export function getSessionDates(session: {
  createdAt: string;
  updatedAt: string;
}): { createdAt: Date; updatedAt: Date } {
  return {
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
  };
}

export function buildSummary(
  session: Omit<SessionShape, 'createdAt' | 'updatedAt'>,
  createdAt: Date,
  updatedAt: Date,
  resolveUnifiedId: (agent: AgentName, nativeSessionId: string) => string,
): SessionSummary {
  return {
    agent: session.agent,
    sessionId: session.sessionId,
    unifiedId: resolveUnifiedId(session.agent, session.sessionId),
    title: session.title ?? '',
    createdAt,
    updatedAt,
    turnCount: session.turnCount,
    messageCount: session.messages?.length ?? 0,
    tags: session.tags ?? [],
    model: session.model,
    cost: session.cost,
    cwd: session.cwd,
    workspace: session.workspace,
    workspaceId: session.workspaceId,
    forkedFrom: session.forkedFrom,
  };
}
