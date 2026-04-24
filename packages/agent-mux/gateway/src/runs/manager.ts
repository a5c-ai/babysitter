import * as path from 'node:path';

import type { AgentEvent, FullSession, RunHandle, RunResult, RuntimeHooks, Session, SessionSummary } from '@a5c-ai/agent-mux-core';

import type { GatewayConfig } from '../config.js';
import { createGatewayRunClient } from '../builtin-adapters.js';
import type { ClientConn } from '../fanout/client-conn.js';
import { RunSubscriber } from '../fanout/subscriber.js';
import type { GatewayLogger } from '../logging.js';
import { createHookWebhookPayload, emitHookWebhook } from '../notifications/webhook-out.js';
import type { HookDecisionFrame } from '../protocol/v1.js';
import { EventLog, type LoggedRunEvent } from './event-log.js';
import { HookBroker } from './hook-broker.js';
import { buildWorkspaceRuntimeSurface } from './session-runtime.js';
import type { RunEntry, RunOwner, RunStartInput, RunStatus, SessionEntry } from './types.js';

interface ActiveRun {
  entry: RunEntry;
  handle: RunHandle;
  recentEvents: LoggedRunEvent[];
}

interface DetectableSessionClient {
  sessions?: {
    list(agent: string, options?: { limit?: number }): Promise<SessionSummary[]>;
    get(agent: string, sessionId: string): Promise<FullSession>;
  };
  adapters?: {
    list(): Array<{ agent: string }>;
    installed?(): Promise<Array<{ agent: string; installed: boolean; meetsMinVersion: boolean }>>;
    get?(agent: string): {
      listSessionFiles?(cwd?: string): Promise<string[]>;
      parseSessionFile?(filePath: string): Promise<Session>;
    } | undefined;
  };
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

function cloneEntry(entry: RunEntry): RunEntry {
  return {
    ...entry,
    owner: { ...entry.owner },
    error: entry.error ? { ...entry.error } : null,
  };
}

function classifyStatus(result: RunResult): RunStatus {
  switch (result.exitReason) {
    case 'completed':
      return 'completed';
    case 'aborted':
    case 'interrupted':
    case 'killed':
      return 'aborted';
    default:
      return 'failed';
  }
}

function cloneSession(entry: SessionEntry): SessionEntry {
  return { ...entry };
}

export class RunManager {
  private static readonly NATIVE_SESSIONS_CACHE_TTL_MS = 15_000;
  private static readonly NATIVE_SESSION_CONTENT_CACHE_TTL_MS = 30_000;

  private readonly client;
  private readonly eventLog;
  private readonly activeRuns = new Map<string, ActiveRun>();
  private readonly observations = new Set<Promise<void>>();
  private readonly subscribers = new Map<string, Map<string, RunSubscriber>>();
  private readonly sessionSubscribers = new Map<string, Map<string, ClientConn>>();
  private readonly hookBroker;
  private nativeSessionsCache: CacheEntry<SessionEntry[]> | null = null;
  private nativeSessionsPromise: Promise<SessionEntry[]> | null = null;
  private readonly nativeSessionContentCache = new Map<string, CacheEntry<FullSession>>();
  private readonly nativeSessionContentPromises = new Map<string, Promise<FullSession | null>>();

  constructor(
    private readonly config: GatewayConfig,
    private readonly logger: GatewayLogger,
  ) {
    this.client = config.client ?? createGatewayRunClient();
    this.eventLog = new EventLog(config.eventLogDir, config.maxEventsPerRun);
    this.hookBroker = new HookBroker({
      getSubscribers: (runId) =>
        Array.from(this.subscribers.get(runId)?.values() ?? []).map((subscriber) => subscriber.conn),
      send: (frame, recipients) => {
        for (const recipient of recipients) {
          recipient.send(frame);
        }
      },
      persist: async (runId, event) => {
        await this.recordGatewayEvent(runId, event);
      },
      notify: async (frame) => {
        if (!this.config.notificationWebhook) {
          return;
        }
        const payload = createHookWebhookPayload(frame.runId, frame.hookRequestId, frame.hookKind, frame.payload);
        await emitHookWebhook(this.config.notificationWebhook, payload);
      },
    });
  }

  async start(input: RunStartInput, owner: RunOwner): Promise<RunEntry> {
    if (this.activeRuns.size >= this.config.maxConcurrentRuns) {
      throw new Error(`maxConcurrentRuns limit reached (${this.config.maxConcurrentRuns})`);
    }

    let handle!: RunHandle;
    const hooks: RuntimeHooks = {
      preToolUse: async (payload) =>
        this.hookBroker.requestDecision(
          handle.runId,
          'preToolUse',
          payload as Record<string, unknown>,
          this.config.hookDecisionTimeoutMs,
        ),
      userPromptSubmit: async (payload) =>
        this.hookBroker.requestDecision(
          handle.runId,
          'userPromptSubmit',
          payload as Record<string, unknown>,
          this.config.hookDecisionTimeoutMs,
        ),
    };

    handle = this.client.run({
      ...input,
      runId: input.runId,
      hooks,
      collectEvents: false,
      gracePeriodMs: this.config.shutdownGraceMs,
    });

    const now = Date.now();
    const entry: RunEntry = {
      runId: handle.runId,
      agent: input.agent,
      model: input.model,
      sessionId: input.sessionId,
      status: 'running',
      createdAt: now,
      startedAt: now,
      endedAt: null,
      owner,
      error: null,
    };
    this.eventLog.index.upsertRun(entry);
    const active: ActiveRun = {
      entry,
      handle,
      recentEvents: [],
    };
    this.activeRuns.set(handle.runId, active);
    if (input.sessionId) {
      await this.attachSessionSubscribersToRun(input.sessionId, handle.runId);
    }
    await this.recordGatewayEvent(handle.runId, {
      type: 'user_message',
      text: Array.isArray(input.prompt) ? input.prompt.join('\n') : input.prompt,
    });
    const observation = this.observeRun(active).finally(() => {
      this.observations.delete(observation);
    });
    this.observations.add(observation);
    this.logger.info('Gateway run started', {
      runId: handle.runId,
      agent: input.agent,
    });
    return cloneEntry(entry);
  }

  async stop(runId: string): Promise<boolean> {
    const active = this.activeRuns.get(runId);
    if (!active) {
      return false;
    }
    await active.handle.abort();
    return true;
  }

  async sendInput(runId: string, input: string): Promise<boolean> {
    const active = this.activeRuns.get(runId);
    if (!active) {
      return false;
    }
    await active.handle.send(input);
    return true;
  }

  async sendSessionInput(
    sessionId: string,
    input: string,
    owner: RunOwner,
    overrides: Partial<Pick<RunStartInput, 'agent' | 'model'>> = {},
  ): Promise<RunEntry | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }
    if (session.activeRunId) {
      const adapter = (this.client as {
        adapters?: {
          get(agent: string): {
            capabilities?: {
              structuredSessionTransport?: 'none' | 'restart-per-turn' | 'persistent';
            };
          } | undefined;
        };
      }).adapters?.get(session.agent);
      const transport = adapter?.capabilities?.structuredSessionTransport ?? 'none';
      if (transport !== 'persistent') {
        return this.get(session.activeRunId);
      }
      await this.recordGatewayEvent(session.activeRunId, {
        type: 'user_message',
        text: input,
        sessionId,
      });
      const sent = await this.sendInput(session.activeRunId, input);
      if (!sent) {
        return null;
      }
      return this.get(session.activeRunId);
    }

    return await this.start(
      {
        agent: overrides.agent ?? session.agent,
        model: overrides.model,
        prompt: input,
        sessionId,
      },
      owner,
    );
  }

  get(runId: string): RunEntry | null {
    const active = this.activeRuns.get(runId);
    if (active) {
      return cloneEntry(active.entry);
    }
    const indexed = this.eventLog.index.getRun(runId);
    return indexed ? cloneEntry(indexed) : null;
  }

  list(): RunEntry[] {
    const seen = new Set<string>();
    const runs: RunEntry[] = [];
    for (const active of this.activeRuns.values()) {
      seen.add(active.entry.runId);
      runs.push(cloneEntry(active.entry));
    }
    for (const indexed of this.eventLog.index.listRuns()) {
      if (seen.has(indexed.runId)) continue;
      runs.push(cloneEntry(indexed));
    }
    runs.sort((left, right) => right.startedAt - left.startedAt);
    return runs;
  }

  async getSession(sessionId: string): Promise<SessionEntry | null> {
    return (await this.listSessions()).find((entry) => entry.sessionId === sessionId) ?? null;
  }

  async getSessionContent(sessionId: string): Promise<FullSession | null> {
    const cached = this.nativeSessionContentCache.get(sessionId);
    if (cached && cached.expiresAt > Date.now()) {
      const session = await this.getSession(sessionId);
      return {
        ...cached.value,
        runtime: session?.runtime,
      };
    }
    const inFlight = this.nativeSessionContentPromises.get(sessionId);
    if (inFlight) {
      return await inFlight;
    }

    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }
    const load = this.loadSessionContent(session.agent, sessionId)
      .then((result) => {
        if (result) {
          this.nativeSessionContentCache.set(sessionId, {
            value: result,
            expiresAt: Date.now() + RunManager.NATIVE_SESSION_CONTENT_CACHE_TTL_MS,
          });
        }
        return result;
      })
      .finally(() => {
        this.nativeSessionContentPromises.delete(sessionId);
      });
    this.nativeSessionContentPromises.set(sessionId, load);
    const result = await load;
    if (!result) {
      return null;
    }
    const latest = await this.getSession(sessionId);
    return {
      ...result,
      runtime: latest?.runtime,
    };
  }

  async listSessions(): Promise<SessionEntry[]> {
    const grouped = new Map<string, RunEntry[]>();
    for (const run of this.list()) {
      if (!run.sessionId) {
        continue;
      }
      const bucket = grouped.get(run.sessionId) ?? [];
      bucket.push(run);
      grouped.set(run.sessionId, bucket);
    }

    const sessions = new Map<string, SessionEntry>();
    for (const [sessionId, runs] of grouped.entries()) {
      runs.sort((left, right) => right.startedAt - left.startedAt);
      const latest = runs[0]!;
      const active = runs.find((run) => run.status === 'running') ?? null;
      sessions.set(sessionId, {
        sessionId,
        agent: latest.agent,
        status: active ? 'active' : 'inactive',
        activeRunId: active?.runId ?? null,
        latestRunId: latest.runId,
        createdAt: runs.reduce((min, run) => Math.min(min, run.createdAt), latest.createdAt),
        updatedAt: active?.startedAt ?? latest.endedAt ?? latest.startedAt,
        latestRunStartedAt: latest.startedAt,
        latestRunEndedAt: latest.endedAt,
        latestExitReason: latest.exitReason,
        model: latest.model,
        source: 'gateway',
      });
    }

    for (const native of await this.listNativeSessions()) {
      const existing = sessions.get(native.sessionId);
      if (!existing) {
        sessions.set(native.sessionId, native);
        continue;
      }

      sessions.set(native.sessionId, {
        ...existing,
        createdAt: Math.min(existing.createdAt, native.createdAt),
        updatedAt: Math.max(existing.updatedAt, native.updatedAt),
        title: existing.title ?? native.title,
        turnCount: existing.turnCount ?? native.turnCount,
        messageCount: existing.messageCount ?? native.messageCount,
        model: existing.model ?? native.model,
        cost: existing.cost ?? native.cost,
        cwd: existing.cwd ?? native.cwd,
        source: 'merged',
      });
    }

    const enriched = await Promise.all(
      Array.from(sessions.values()).map(async (session) => {
        const runs = grouped.get(session.sessionId) ?? [];
        session.runtime = await this.buildRuntimeSurface(session, runs);
        return session;
      }),
    );

    return enriched
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map(cloneSession);
  }

  async subscribe(conn: ClientConn, runId: string, sinceSeq: number = 0): Promise<void> {
    const state = this.eventLog.getSeqState(runId);
    if (state.tailSeq > 0 && sinceSeq < state.headSeq - 1) {
      conn.send({
        type: 'error',
        code: 'seq_gone',
        message: 'Requested sequence is no longer available',
        runId,
        tailSeq: state.tailSeq,
      });
      return;
    }

    let subscriberMap = this.subscribers.get(runId);
    if (!subscriberMap) {
      subscriberMap = new Map();
      this.subscribers.set(runId, subscriberMap);
    }
    const existing = subscriberMap.get(conn.id);
    if (existing) {
      subscriberMap.delete(conn.id);
    }

    const subscriber = new RunSubscriber(conn, runId, state.tailSeq);
    subscriberMap.set(conn.id, subscriber);
    conn.subscriptions.add(runId);

    const replay = await this.readReplay(runId, sinceSeq, state.tailSeq);
    subscriber.replay(replay);
    subscriber.finishCatchUp();
  }

  async subscribeSession(conn: ClientConn, sessionId: string): Promise<void> {
    let subscriberMap = this.sessionSubscribers.get(sessionId);
    if (!subscriberMap) {
      subscriberMap = new Map();
      this.sessionSubscribers.set(sessionId, subscriberMap);
    }
    subscriberMap.set(conn.id, conn);
    conn.sessionSubscriptions.add(sessionId);

    const session = await this.getSession(sessionId);
    if (session?.activeRunId) {
      await this.attachSessionSubscribersToRun(sessionId, session.activeRunId);
    }
  }

  unsubscribeSession(conn: ClientConn, sessionId: string): void {
    conn.sessionSubscriptions.delete(sessionId);
    const subscriberMap = this.sessionSubscribers.get(sessionId);
    if (!subscriberMap) {
      return;
    }
    subscriberMap.delete(conn.id);
    if (subscriberMap.size === 0) {
      this.sessionSubscribers.delete(sessionId);
    }
  }

  unsubscribe(conn: ClientConn, runId: string): void {
    conn.subscriptions.delete(runId);
    const subscriberMap = this.subscribers.get(runId);
    if (!subscriberMap) return;
    subscriberMap.delete(conn.id);
    if (subscriberMap.size === 0) {
      this.subscribers.delete(runId);
    }
  }

  removeConnection(conn: ClientConn): void {
    for (const runId of Array.from(conn.subscriptions)) {
      this.unsubscribe(conn, runId);
    }
    for (const sessionId of Array.from(conn.sessionSubscriptions)) {
      this.unsubscribeSession(conn, sessionId);
    }
  }

  submitHookDecision(conn: ClientConn, frame: HookDecisionFrame): boolean {
    return this.hookBroker.submitDecision(conn, frame);
  }

  async shutdown(): Promise<void> {
    const pending = Array.from(this.activeRuns.values());
    for (const active of pending) {
      await active.handle.abort();
    }

    await Promise.race([
      Promise.allSettled(pending.map((active) => active.handle.result())),
      new Promise<void>((resolve) => {
        setTimeout(resolve, this.config.shutdownGraceMs);
      }),
    ]);
    await Promise.allSettled(Array.from(this.observations));
    await this.eventLog.close();
  }

  private async observeRun(active: ActiveRun): Promise<void> {
    const { handle } = active;
    try {
      for await (const event of handle) {
        if (event.type === 'session_start' && 'sessionId' in event && typeof event.sessionId === 'string') {
          active.entry.sessionId = event.sessionId;
          this.eventLog.index.upsertRun(active.entry);
          await this.attachSessionSubscribersToRun(event.sessionId, handle.runId);
        }
        await this.recordAgentEvent(handle.runId, event);
      }
    } finally {
      const result = await handle.result();
      active.entry.status = classifyStatus(result);
      active.entry.endedAt = Date.now();
      active.entry.exitReason = result.exitReason;
      active.entry.error = result.error
        ? {
            code: result.error.code,
            message: result.error.message,
          }
        : null;
      this.eventLog.index.upsertRun(active.entry);
      await this.recordGatewayEvent(handle.runId, {
        type: 'run.finalized',
        exitReason: result.exitReason,
        exitCode: result.exitCode,
        signal: result.signal,
        error: result.error,
      });
      this.activeRuns.delete(handle.runId);
      this.logger.info('Gateway run finished', {
        runId: handle.runId,
        exitReason: result.exitReason,
      });
    }
  }

  private async recordAgentEvent(runId: string, event: AgentEvent): Promise<void> {
    await this.recordLoggedEvents(runId, 'agent', event as unknown as Record<string, unknown>);
  }

  private async recordGatewayEvent(runId: string, event: Record<string, unknown>): Promise<void> {
    await this.recordLoggedEvents(runId, 'gateway', event);
  }

  private async recordLoggedEvents(
    runId: string,
    source: string,
    event: Record<string, unknown>,
  ): Promise<void> {
    const loggedEvents = await this.eventLog.append(runId, source, event);
    for (const logged of loggedEvents) {
      const active = this.activeRuns.get(runId);
      if (active) {
        active.recentEvents.push(logged);
        if (active.recentEvents.length > this.config.replayBufferSize) {
          active.recentEvents.splice(0, active.recentEvents.length - this.config.replayBufferSize);
        }
      }

      const subscriberMap = this.subscribers.get(runId);
      if (!subscriberMap) continue;
      for (const subscriber of subscriberMap.values()) {
        subscriber.sendLive(logged);
      }
    }
  }

  private async readReplay(runId: string, sinceSeq: number, tailSeq: number): Promise<LoggedRunEvent[]> {
    const active = this.activeRuns.get(runId);
    const recent = active?.recentEvents;
    if (recent && recent.length > 0) {
      const firstSeq = recent[0]!.seq;
      const lastSeq = recent[recent.length - 1]!.seq;
      if (sinceSeq >= firstSeq - 1 && tailSeq <= lastSeq) {
        return recent.filter((event) => event.seq > sinceSeq && event.seq <= tailSeq);
      }
    }

    const replay = await this.eventLog.readSince(runId, sinceSeq, tailSeq);
    return replay.events;
  }

  private async attachSessionSubscribersToRun(sessionId: string, runId: string): Promise<void> {
    const subscribers = this.sessionSubscribers.get(sessionId);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    await Promise.all(
      Array.from(subscribers.values()).map(async (conn) => {
        if (conn.subscriptions.has(runId)) {
          return;
        }
        await this.subscribe(conn, runId, 0);
      }),
    );
  }

  private async listNativeSessions(): Promise<SessionEntry[]> {
    const cached = this.nativeSessionsCache;
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value.map(cloneSession);
    }
    if (this.nativeSessionsPromise) {
      return (await this.nativeSessionsPromise).map(cloneSession);
    }

    const load = this.loadNativeSessions()
      .then((sessions) => {
        this.nativeSessionsCache = {
          value: sessions.map(cloneSession),
          expiresAt: Date.now() + RunManager.NATIVE_SESSIONS_CACHE_TTL_MS,
        };
        return sessions;
      })
      .finally(() => {
        this.nativeSessionsPromise = null;
      });
    this.nativeSessionsPromise = load;
    return (await load).map(cloneSession);
  }

  private async loadNativeSessions(): Promise<SessionEntry[]> {
    const client = this.client as DetectableSessionClient;
    if (!client.sessions || !client.adapters) {
      return [];
    }

    let agents = client.adapters.list().map((entry) => entry.agent);
    if (typeof client.adapters.installed === 'function') {
      try {
        const installed = await client.adapters.installed();
        const runnableAgents = installed
          .filter((entry) => entry.installed && entry.meetsMinVersion)
          .map((entry) => entry.agent);
        if (runnableAgents.length > 0) {
          agents = runnableAgents;
        }
      } catch {
        // Fall back to registered adapters when installation discovery fails.
      }
    }

    const discovered = await Promise.all(
      agents.map(async (agent) => {
        try {
          return await client.sessions!.list(agent, { limit: 100 });
        } catch {
          return [];
        }
      }),
    );

    return discovered.flatMap((sessions) =>
      sessions.map((session) => ({
        sessionId: session.sessionId,
        agent: session.agent,
        status: 'inactive' as const,
        activeRunId: null,
        latestRunId: null,
        createdAt: session.createdAt.getTime(),
        updatedAt: session.updatedAt.getTime(),
        latestRunStartedAt: null,
        latestRunEndedAt: null,
        title: session.title,
        turnCount: session.turnCount,
        messageCount: session.messageCount,
        model: session.model,
        cost: session.cost,
        cwd: session.cwd,
        source: 'native' as const,
      })),
    );
  }

  private async loadSessionContent(agent: string, sessionId: string): Promise<FullSession | null> {
    const client = this.client as DetectableSessionClient;
    const direct = await this.tryLoadSessionContentDirect(agent, sessionId);
    if (direct) {
      return direct;
    }
    if (!client.sessions?.get) {
      return null;
    }
    try {
      return await client.sessions.get(agent, sessionId);
    } catch {
      return null;
    }
  }

  private async tryLoadSessionContentDirect(agent: string, sessionId: string): Promise<FullSession | null> {
    const client = this.client as DetectableSessionClient;
    const adapter = client.adapters?.get?.(agent);
    if (!adapter?.listSessionFiles || !adapter.parseSessionFile) {
      return null;
    }

    let filePaths: string[];
    try {
      filePaths = await adapter.listSessionFiles();
    } catch {
      return null;
    }

    const candidate = filePaths.find((filePath) => path.basename(filePath, path.extname(filePath)) === sessionId);
    if (!candidate) {
      return null;
    }

    try {
      const parsed = await adapter.parseSessionFile(candidate);
      return {
        agent: parsed.agent,
        sessionId: parsed.sessionId,
        unifiedId: `${parsed.agent}:${parsed.sessionId}`,
        title: parsed.title ?? '',
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
        turnCount: parsed.turnCount,
        model: parsed.model,
        cost: parsed.cost,
        tags: parsed.tags ?? [],
        cwd: parsed.cwd,
        forkedFrom: parsed.forkedFrom,
        runtime: undefined,
        messages: parsed.messages ?? [],
        raw: parsed.raw,
      };
    } catch {
      return null;
    }
  }

  private async buildRuntimeSurface(session: SessionEntry, runs: RunEntry[]) {
    if ((!session.cwd || session.cwd.length === 0) && runs.length === 0) {
      return undefined;
    }

    const eventsByRunId = new Map<string, LoggedRunEvent[]>();
    for (const run of runs) {
      eventsByRunId.set(run.runId, await this.readRecentEvents(run.runId));
    }

    return buildWorkspaceRuntimeSurface({
      cwd: session.cwd,
      runs,
      eventsByRunId,
    });
  }

  private async readRecentEvents(runId: string, limit = 120): Promise<LoggedRunEvent[]> {
    const state = this.eventLog.getSeqState(runId);
    if (state.tailSeq <= 0) {
      return [];
    }
    const sinceSeq = Math.max(0, state.tailSeq - limit);
    const replay = await this.eventLog.readSince(runId, sinceSeq, state.tailSeq);
    return replay.events;
  }
}
