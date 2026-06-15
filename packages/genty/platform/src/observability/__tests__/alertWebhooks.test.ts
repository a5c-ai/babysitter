import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookDispatcher } from '../alertWebhooks';

describe('WebhookDispatcher', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('dispatches events to matching webhooks', async () => {
    const dispatcher = new WebhookDispatcher();
    dispatcher.register({ id: 'w1', url: 'https://example.com/hook', events: ['run_completed'] });
    const result = await dispatcher.dispatch({ type: 'run_completed', data: {}, timestamp: new Date().toISOString() });
    expect(result.sent).toBe(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('skips non-matching events', async () => {
    const dispatcher = new WebhookDispatcher();
    dispatcher.register({ id: 'w1', url: 'https://example.com/hook', events: ['run_completed'] });
    const result = await dispatcher.dispatch({ type: 'run_started', data: {}, timestamp: new Date().toISOString() });
    expect(result.sent).toBe(0);
  });

  it('supports wildcard events', async () => {
    const dispatcher = new WebhookDispatcher();
    dispatcher.register({ id: 'w1', url: 'https://example.com/hook', events: ['*'] });
    const result = await dispatcher.dispatch({ type: 'anything', data: {}, timestamp: new Date().toISOString() });
    expect(result.sent).toBe(1);
  });

  it('evaluates alert rules', () => {
    const dispatcher = new WebhookDispatcher();
    dispatcher.addAlertRule({ condition: 'budget_exceeded', webhookId: 'w1' });
    dispatcher.addAlertRule({ condition: 'run_failed', webhookId: 'w1' });
    const events = dispatcher.evaluateAlerts({ budgetExceeded: true, status: 'running' });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('alert:budget_exceeded');
  });

  it('retries on failure', async () => {
    let attempts = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      attempts++;
      if (attempts < 3) throw new Error('network');
      return { ok: true };
    });
    const dispatcher = new WebhookDispatcher();
    dispatcher.register({ id: 'w1', url: 'https://example.com/hook', events: ['test'], retryCount: 3 });
    const result = await dispatcher.dispatch({ type: 'test', data: {}, timestamp: new Date().toISOString() });
    expect(result.sent).toBe(1);
    expect(attempts).toBe(3);
  });
});
