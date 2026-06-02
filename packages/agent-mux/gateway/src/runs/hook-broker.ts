import { randomUUID } from 'node:crypto';

import type { HookDecision } from '@a5c-ai/agent-mux-comm';

import type { HookDecisionFrame, HookRequestFrame, HookResolvedFrame } from '../protocol/v1.js';
import type { ClientConn } from '../fanout/client-conn.js';

interface HookBrokerDeps {
  getSubscribers(runId: string): ClientConn[];
  send(frame: HookRequestFrame | HookResolvedFrame, recipients: readonly ClientConn[]): void;
  persist(runId: string, event: Record<string, unknown>): Promise<void>;
  notify?(frame: HookRequestFrame): Promise<void>;
}

interface PendingHookDecision {
  runId: string;
  hookKind: string;
  recipients: ClientConn[];
  settled: boolean;
  timer: NodeJS.Timeout;
  resolveDecision: (decision: HookDecision) => void;
}

export class HookBroker {
  private readonly pending = new Map<string, PendingHookDecision>();

  constructor(private readonly deps: HookBrokerDeps) {}

  async requestDecision(
    runId: string,
    hookKind: string,
    payload: Record<string, unknown>,
    timeoutMs: number,
  ): Promise<HookDecision> {
    const hookRequestId = randomUUID();
    const timestamp = Date.now();
    const deadlineTs = Date.now() + timeoutMs;
    const recipients = this.deps.getSubscribers(runId);
    await this.deps.persist(runId, {
      type: 'hook_requested',
      hookRequestId,
      hookKind,
      payload,
      deadlineTs,
      timestamp,
    });
    if (recipients.length === 0) {
      await this.deps.persist(runId, {
        type: 'gateway.notification',
        code: 'hook_zero_subscribers',
        hookKind,
        hookRequestId,
      });
      await this.deps.persist(runId, {
        type: 'hook_decision',
        hookRequestId,
        hookKind,
        decision: 'allow',
        resolvedBy: 'fallback',
      });
      return { decision: 'allow' };
    }

    return await new Promise<HookDecision>((resolve) => {
      const timer = setTimeout(() => {
        void this.finish(hookRequestId, { decision: 'allow' }, 'timeout');
      }, timeoutMs);

      this.pending.set(hookRequestId, {
        runId,
        hookKind,
        recipients,
        settled: false,
        timer,
        resolveDecision: resolve,
      });

      this.deps.send(
        {
          type: 'hook.request',
          hookRequestId,
          runId,
          hookKind,
          payload,
          deadlineTs,
        },
        recipients,
      );
      void this.deps.notify?.({
        type: 'hook.request',
        hookRequestId,
        runId,
        hookKind,
        payload,
        deadlineTs,
      });
    });
  }

  submitDecision(conn: ClientConn, frame: HookDecisionFrame): boolean {
    const pending = this.pending.get(frame.hookRequestId);
    if (!pending || pending.settled) {
      return false;
    }
    if (!pending.recipients.some((recipient) => recipient.id === conn.id)) {
      return false;
    }
    void this.finish(
      frame.hookRequestId,
      {
        decision: frame.decision,
        reason: frame.reason,
      },
      conn.id,
    );
    return true;
  }

  private async finish(
    hookRequestId: string,
    decision: HookDecision,
    resolvedBy: string,
  ): Promise<void> {
    const pending = this.pending.get(hookRequestId);
    if (!pending || pending.settled) {
      return;
    }
    pending.settled = true;
    clearTimeout(pending.timer);
    this.pending.delete(hookRequestId);

    const losingRecipients = pending.recipients.filter((recipient) => recipient.id !== resolvedBy);
    if (losingRecipients.length > 0) {
      this.deps.send(
        {
          type: 'hook.resolved',
          hookRequestId,
          resolvedBy,
          decision: decision.decision,
        },
        losingRecipients,
      );
    }

    await this.deps.persist(pending.runId, {
      type: 'hook_decision',
      hookRequestId,
      hookKind: pending.hookKind,
      decision: decision.decision,
      reason: decision.decision === 'deny' ? decision.reason : undefined,
      resolvedBy,
      timestamp: Date.now(),
    });
    pending.resolveDecision(decision);
  }
}
