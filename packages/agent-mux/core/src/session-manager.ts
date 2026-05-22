/**
 * SessionManager interface and implementation for @a5c-ai/agent-mux.
 *
 * Provides read-only access to agent session data stored in each agent's
 * native format. Delegates parsing and listing to agent adapters.
 *
 * @see 07-session-manager.md
 */

import * as path from 'node:path';
import { createComponentLogger } from '@a5c-ai/agent-mux-observability';

import type { AgentName } from './types.js';
import type { AdapterRegistry } from './adapter-registry.js';
import { AgentMuxError } from './errors.js';
import {
  buildSummary,
  canFastListByDate,
  getSessionDates,
  listByRecentFiles,
} from './session-manager-helpers.js';

// Re-export all session types from the dedicated module
export type {
  SessionToolCall,
  SessionMessage,
  SessionSummary,
  FullSession,
  Session,
  SessionListOptions,
  SessionQuery,
  CostAggregationOptions,
  CostSummary,
  CostBreakdown,
  SessionDiff,
  DiffOperation,
} from './session-types.js';

import type {
  SessionSummary,
  FullSession,
  SessionListOptions,
  SessionQuery,
  CostAggregationOptions,
  CostSummary,
  CostBreakdown,
  SessionDiff,
  DiffOperation,
  SessionMessage,
} from './session-types.js';

// ---------------------------------------------------------------------------
// SessionManager Interface
// ---------------------------------------------------------------------------

/** Read-only access to agent session data. */
export interface SessionManager {
  /** List sessions for a specific agent. */
  list(agent: AgentName, options?: SessionListOptions): Promise<SessionSummary[]>;

  /** Retrieve full session content. */
  get(agent: AgentName, sessionId: string): Promise<FullSession>;

  /** Full-text search across sessions. */
  search(query: SessionQuery): Promise<SessionSummary[]>;

  /** Aggregate cost data across sessions. */
  totalCost(options?: CostAggregationOptions): Promise<CostSummary>;

  /** Export a session in a specified format. */
  export(agent: AgentName, sessionId: string, format: 'json' | 'jsonl' | 'markdown'): Promise<string>;

  /** Compute structural diff between two sessions. */
  diff(
    a: { agent: AgentName; sessionId: string },
    b: { agent: AgentName; sessionId: string },
  ): Promise<SessionDiff>;

  /** Map a native session ID to a unified cross-agent ID. */
  resolveUnifiedId(agent: AgentName, nativeSessionId: string): string;

  /** Parse a unified session ID back into agent and native ID. */
  resolveNativeId(unifiedId: string): { agent: AgentName; nativeSessionId: string } | null;
}

// ---------------------------------------------------------------------------
// SessionManagerImpl
// ---------------------------------------------------------------------------

/**
 * Implementation of SessionManager.
 *
 * Delegates session file I/O to the adapter registry. Provides
 * filtering, sorting, search, cost aggregation, export, diff, and
 * unified ID resolution.
 */
export class SessionManagerImpl implements SessionManager {
  private readonly _adapters: AdapterRegistry;
  private readonly logger = createComponentLogger('sessions');

  constructor(adapters: AdapterRegistry) {
    this._adapters = adapters;
  }

  // -- Helper: ensure adapter exists -------------------------------------------

  private _getAdapter(agent: AgentName) {
    const adapter = this._adapters.get(agent);
    if (!adapter) {
      throw new AgentMuxError('AGENT_NOT_FOUND', `Unknown agent: "${agent}"`);
    }
    return adapter;
  }

  // -- list() ------------------------------------------------------------------

  async list(agent: AgentName, options?: SessionListOptions): Promise<SessionSummary[]> {
    this.logger.debug({ agent, limit: options?.limit }, 'Listing sessions');
    const adapter = this._getAdapter(agent);
    const filePaths = await adapter.listSessionFiles();
    const limit = options?.limit ?? 100;
    const sortField = options?.sort ?? 'date';
    const sortDir = options?.sortDirection ?? 'desc';

    if (canFastListByDate(options, sortField)) {
      return listByRecentFiles(
        adapter,
        filePaths,
        limit,
        sortDir,
        this.resolveUnifiedId.bind(this),
      );
    }

    const summaries: SessionSummary[] = [];
    for (const fp of filePaths) {
      try {
        const session = await adapter.parseSessionFile(fp);
        const { createdAt, updatedAt } = getSessionDates(session);

        // Apply date filters
        if (options?.since && createdAt < options.since) continue;
        if (options?.until && createdAt > options.until) continue;

        summaries.push(buildSummary(session, createdAt, updatedAt, this.resolveUnifiedId.bind(this)));
      } catch {
        // Skip unparseable session files
      }
    }

    // Sort
    const multiplier = sortDir === 'asc' ? 1 : -1;

    summaries.sort((a, b) => {
      if (sortField === 'date') {
        return multiplier * (a.createdAt.getTime() - b.createdAt.getTime());
      }
      if (sortField === 'turns') {
        return multiplier * (a.turnCount - b.turnCount);
      }
      if (sortField === 'cost') {
        const aCost = a.cost?.totalUsd ?? 0;
        const bCost = b.cost?.totalUsd ?? 0;
        return multiplier * (aCost - bCost);
      }
      return 0;
    });

    return summaries.slice(0, limit);
  }

  // -- get() -------------------------------------------------------------------

  async get(agent: AgentName, sessionId: string): Promise<FullSession> {
    this.logger.debug({ agent, sessionId }, 'Getting session');
    const adapter = this._getAdapter(agent);
    const filePaths = await adapter.listSessionFiles();

    for (const fp of filePaths) {
      try {
        const session = await adapter.parseSessionFile(fp);
        if (session.sessionId === sessionId) {
          return {
            agent: session.agent,
            sessionId: session.sessionId,
            unifiedId: this.resolveUnifiedId(session.agent, session.sessionId),
            title: session.title ?? '',
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            turnCount: session.turnCount,
            model: session.model,
            cost: session.cost,
            tags: session.tags ?? [],
            cwd: session.cwd,
            workspace: session.workspace,
            workspaceId: session.workspaceId,
            forkedFrom: session.forkedFrom,
            messages: session.messages ?? [],
            raw: session.raw,
          };
        }
      } catch {
        // Skip unparseable files
      }
    }

    throw new AgentMuxError(
      'SESSION_NOT_FOUND',
      `Session "${sessionId}" not found for agent "${agent}"`,
    );
  }

  // -- search() ----------------------------------------------------------------

  async search(query: SessionQuery): Promise<SessionSummary[]> {
    const agents = query.agent
      ? [query.agent]
      : this._adapters.list().map((a) => a.agent);

    const allSummaries: SessionSummary[] = [];
    const limit = query.limit ?? 50;

    for (const agent of agents) {
      try {
        const sessions = await this.list(agent, {
          since: query.since,
          until: query.until,
          model: query.model,
          tags: query.tags,
          limit,
        });

        for (const s of sessions) {
          // Simple text matching on title and sessionId
          const text = query.text.toLowerCase();
          const matchesTitle = s.title.toLowerCase().includes(text);
          const matchesId = s.sessionId.toLowerCase().includes(text);

          if (matchesTitle || matchesId) {
            allSummaries.push({
              ...s,
              relevanceScore: matchesTitle ? 1.0 : 0.5,
            });
          }
        }
      } catch {
        // Skip agents that fail
      }
    }

    // Sort by relevance (descending) then by date (descending)
    if (query.sort === 'date') {
      allSummaries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (query.sort === 'cost') {
      allSummaries.sort((a, b) => (b.cost?.totalUsd ?? 0) - (a.cost?.totalUsd ?? 0));
    } else {
      // Default: relevance
      allSummaries.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
    }

    return allSummaries.slice(0, limit);
  }

  // -- totalCost() -------------------------------------------------------------

  async totalCost(options?: CostAggregationOptions): Promise<CostSummary> {
    const agents = options?.agent
      ? [options.agent]
      : this._adapters.list().map((a) => a.agent);

    const summary: CostSummary = {
      totalUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
      thinkingTokens: 0,
      cachedTokens: 0,
      sessionCount: 0,
      runCount: 0,
    };

    const breakdowns: Record<string, CostBreakdown> = {};

    for (const agent of agents) {
      try {
        const sessions = await this.list(agent, {
          since: options?.since,
          until: options?.until,
          model: options?.model,
          tags: options?.tags,
        });

        for (const s of sessions) {
          const cost = s.cost;
          if (cost) {
            summary.totalUsd += cost.totalUsd;
            summary.inputTokens += cost.inputTokens;
            summary.outputTokens += cost.outputTokens;
            summary.thinkingTokens += cost.thinkingTokens ?? 0;
            summary.cachedTokens += cost.cachedTokens ?? 0;
          }
          summary.sessionCount++;

          // Build breakdowns if requested
          if (options?.groupBy) {
            let key: string;
            switch (options.groupBy) {
              case 'agent':
                key = agent;
                break;
              case 'model':
                key = s.model ?? 'unknown';
                break;
              case 'day':
                key = s.createdAt.toISOString().slice(0, 10);
                break;
              case 'tag':
                key = s.tags.length > 0 ? s.tags[0]! : 'untagged';
                break;
              default:
                key = 'unknown';
            }

            if (!breakdowns[key]) {
              breakdowns[key] = {
                key,
                totalUsd: 0,
                inputTokens: 0,
                outputTokens: 0,
                thinkingTokens: 0,
                cachedTokens: 0,
                sessionCount: 0,
              };
            }

            const bd = breakdowns[key]!;
            if (cost) {
              bd.totalUsd += cost.totalUsd;
              bd.inputTokens += cost.inputTokens;
              bd.outputTokens += cost.outputTokens;
              bd.thinkingTokens += cost.thinkingTokens ?? 0;
              bd.cachedTokens += cost.cachedTokens ?? 0;
            }
            bd.sessionCount++;
          }
        }
      } catch {
        // Skip agents that fail
      }
    }

    if (options?.groupBy) {
      summary.breakdowns = breakdowns;
    }

    return summary;
  }

  // -- export() ----------------------------------------------------------------

  async export(
    agent: AgentName,
    sessionId: string,
    format: 'json' | 'jsonl' | 'markdown',
  ): Promise<string> {
    const session = await this.get(agent, sessionId);

    switch (format) {
      case 'json':
        return JSON.stringify(session, null, 2);

      case 'jsonl':
        return session.messages
          .map((m) => JSON.stringify(m))
          .join('\n');

      case 'markdown': {
        const lines: string[] = [];
        lines.push(`# Session: ${session.title || session.sessionId}`);
        lines.push(`**Agent:** ${session.agent}`);
        lines.push(`**Created:** ${session.createdAt.toISOString()}`);
        lines.push(`**Turns:** ${session.turnCount}`);
        if (session.model) lines.push(`**Model:** ${session.model}`);
        lines.push('');
        for (const msg of session.messages) {
          lines.push(`## ${msg.role}`);
          lines.push(msg.content);
          lines.push('');
        }
        return lines.join('\n');
      }

      default:
        throw new AgentMuxError('VALIDATION_ERROR', `Unknown export format: "${format as string}"`);
    }
  }

  // -- diff() ------------------------------------------------------------------

  async diff(
    a: { agent: AgentName; sessionId: string },
    b: { agent: AgentName; sessionId: string },
  ): Promise<SessionDiff> {
    const sessionA = await this.get(a.agent, a.sessionId);
    const sessionB = await this.get(b.agent, b.sessionId);

    const operations: DiffOperation[] = [];
    const maxLen = Math.max(sessionA.messages.length, sessionB.messages.length);

    let added = 0;
    let removed = 0;
    let modified = 0;
    let unchanged = 0;

    for (let i = 0; i < maxLen; i++) {
      const msgA: SessionMessage | undefined = sessionA.messages[i];
      const msgB: SessionMessage | undefined = sessionB.messages[i];

      if (msgA && msgB) {
        if (msgA.role === msgB.role && msgA.content === msgB.content) {
          operations.push({ type: 'unchanged', indexA: i, indexB: i, messageA: msgA, messageB: msgB });
          unchanged++;
        } else {
          operations.push({ type: 'modified', indexA: i, indexB: i, messageA: msgA, messageB: msgB });
          modified++;
        }
      } else if (msgA && !msgB) {
        operations.push({ type: 'removed', indexA: i, messageA: msgA });
        removed++;
      } else if (!msgA && msgB) {
        operations.push({ type: 'added', indexB: i, messageB: msgB });
        added++;
      }
    }

    return {
      a: {
        agent: a.agent,
        sessionId: a.sessionId,
        unifiedId: this.resolveUnifiedId(a.agent, a.sessionId),
      },
      b: {
        agent: b.agent,
        sessionId: b.sessionId,
        unifiedId: this.resolveUnifiedId(b.agent, b.sessionId),
      },
      operations,
      summary: { added, removed, modified, unchanged },
    };
  }

  // -- resolveUnifiedId() ------------------------------------------------------

  resolveUnifiedId(agent: AgentName, nativeSessionId: string): string {
    return `${agent}:${nativeSessionId}`;
  }

  // -- resolveNativeId() -------------------------------------------------------

  resolveNativeId(unifiedId: string): { agent: AgentName; nativeSessionId: string } | null {
    const colonIndex = unifiedId.indexOf(':');
    if (colonIndex === -1) return null;

    const agent = unifiedId.slice(0, colonIndex);
    const nativeSessionId = unifiedId.slice(colonIndex + 1);

    if (!agent || !nativeSessionId) return null;

    // Check if the agent is known in the registry
    const adapter = this._adapters.get(agent);
    if (!adapter) return null;

    return { agent, nativeSessionId };
  }
}
