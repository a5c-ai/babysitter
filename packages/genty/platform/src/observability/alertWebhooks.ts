export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  retryCount?: number;
}

export interface AlertRule {
  condition: 'budget_exceeded' | 'run_failed' | 'stall_detected' | string;
  webhookId: string;
  template?: string;
}

export interface WebhookEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

export class WebhookDispatcher {
  private webhooks = new Map<string, WebhookConfig>();
  private alertRules: AlertRule[] = [];

  register(config: WebhookConfig): void {
    this.webhooks.set(config.id, config);
  }

  unregister(id: string): boolean {
    return this.webhooks.delete(id);
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  async dispatch(event: WebhookEvent): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    for (const [, config] of this.webhooks) {
      if (!config.events.includes(event.type) && !config.events.includes('*')) continue;
      const ok = await this.sendWithRetry(config, event);
      if (ok) sent++; else failed++;
    }
    return { sent, failed };
  }

  evaluateAlerts(runState: { status?: string; budgetExceeded?: boolean; stalled?: boolean }): WebhookEvent[] {
    const events: WebhookEvent[] = [];
    for (const rule of this.alertRules) {
      let match = false;
      if (rule.condition === 'budget_exceeded' && runState.budgetExceeded) match = true;
      if (rule.condition === 'run_failed' && runState.status === 'failed') match = true;
      if (rule.condition === 'stall_detected' && runState.stalled) match = true;
      if (match) {
        events.push({ type: `alert:${rule.condition}`, data: runState, timestamp: new Date().toISOString() });
      }
    }
    return events;
  }

  private async sendWithRetry(config: WebhookConfig, event: WebhookEvent): Promise<boolean> {
    const maxRetries = config.retryCount ?? 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(config.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...config.headers },
          body: JSON.stringify(event),
        });
        if (response.ok) return true;
      } catch {
        // retry
      }
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
      }
    }
    return false;
  }
}
