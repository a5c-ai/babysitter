import { createResource, clone } from './resource-model.js';

// ── Cron validation helpers ───────────────────────────────────────────────────

/**
 * Validate a 5-field cron expression (minute hour dom month dow).
 * Each field must be a non-empty string composed only of digits, '*', '/', '-', and ','.
 * @param {string} expr
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCronExpression(expr) {
  if (typeof expr !== 'string' || expr.trim() === '') {
    return { valid: false, error: 'Cron expression must be a non-empty string' };
  }
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    return { valid: false, error: `Cron expression must have exactly 5 fields (got ${fields.length})` };
  }
  // Each field: digits, *, /, -, , only
  const fieldPattern = /^(\*|(\d+|\*)(\/\d+)?)(-(\d+|\*)(\/\d+)?)?(,(\*|(\d+|\*)(\/\d+)?)(-(\d+|\*)(\/\d+)?)?)*$/;
  // Simpler but robust: allow only [0-9*/,-] characters and at least one valid character
  const validChars = /^[0-9*/,\-]+$/;
  for (let i = 0; i < fields.length; i++) {
    if (!validChars.test(fields[i])) {
      return { valid: false, error: `Invalid character in cron field ${i + 1}: "${fields[i]}"` };
    }
  }
  return { valid: true };
}

/**
 * Calculate the next run date/time after `fromDate` for a valid cron expression.
 * Uses a lightweight iterative approach (no external deps) — minute-level precision.
 * Returns null if the expression is invalid.
 * @param {string} cronExpr
 * @param {Date} [fromDate]
 * @returns {Date|null}
 */
export function calculateNextRun(cronExpr, fromDate) {
  const validation = validateCronExpression(cronExpr);
  if (!validation.valid) return null;

  const fields = cronExpr.trim().split(/\s+/);
  const [minuteF, hourF, domF, monthF, dowF] = fields;

  function matchesField(value, fieldStr, min, max) {
    if (fieldStr === '*') return true;
    const parts = fieldStr.split(',');
    return parts.some(part => {
      if (part.includes('/')) {
        const [range, step] = part.split('/');
        const stepNum = parseInt(step, 10);
        const start = range === '*' ? min : parseInt(range.split('-')[0], 10);
        const end = range === '*' ? max : (range.includes('-') ? parseInt(range.split('-')[1], 10) : max);
        if (isNaN(stepNum)) return false;
        for (let v = start; v <= end; v += stepNum) {
          if (v === value) return true;
        }
        return false;
      }
      if (part.includes('-')) {
        const [lo, hi] = part.split('-').map(Number);
        return value >= lo && value <= hi;
      }
      return parseInt(part, 10) === value;
    });
  }

  // Start from the next minute after fromDate
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setSeconds(0, 0);
  base.setMinutes(base.getMinutes() + 1);

  // Iterate up to 366 days * 24 * 60 = ~527,040 minutes
  const MAX_ITER = 527040;
  const candidate = new Date(base);
  for (let i = 0; i < MAX_ITER; i++) {
    const min = candidate.getUTCMinutes();
    const hour = candidate.getUTCHours();
    const dom = candidate.getUTCDate();
    const month = candidate.getUTCMonth() + 1; // 1-12
    const dow = candidate.getUTCDay();          // 0-6

    if (
      matchesField(month, monthF, 1, 12) &&
      matchesField(dom, domF, 1, 31) &&
      matchesField(dow, dowF, 0, 6) &&
      matchesField(hour, hourF, 0, 23) &&
      matchesField(min, minuteF, 0, 59)
    ) {
      return new Date(candidate);
    }
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return null; // No match found within a year
}

// ── Webhook trigger validation ────────────────────────────────────────────────

/**
 * Validate a webhook trigger configuration.
 * @param {{ url: string, secretRef?: string }} config
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateWebhookTrigger(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'Webhook trigger config must be an object' };
  }
  if (!config.url || typeof config.url !== 'string' || config.url.trim() === '') {
    return { valid: false, error: 'Webhook trigger config must include a non-empty url' };
  }
  // Only http/https urls are allowed
  try {
    const parsed = new URL(config.url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: `Webhook url scheme must be http or https (got "${parsed.protocol.replace(':', '')}")` };
    }
  } catch {
    return { valid: false, error: `Webhook url is not a valid URL: "${config.url}"` };
  }
  return { valid: true };
}

// ── Comment trigger validation ────────────────────────────────────────────────

/**
 * Validate a comment-based trigger configuration.
 * @param {{ pattern: string, repos?: string[] }} config
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCommentTrigger(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'Comment trigger config must be an object' };
  }
  if (!('pattern' in config) || typeof config.pattern !== 'string' || config.pattern.trim() === '') {
    return { valid: false, error: 'Comment trigger config must include a non-empty pattern string' };
  }
  return { valid: true };
}

// ── Label trigger validation ──────────────────────────────────────────────────

const VALID_LABEL_ACTIONS = ['labeled', 'unlabeled'];

/**
 * Validate a label-based trigger configuration.
 * @param {{ labels: string[], action?: string }} config
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateLabelTrigger(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'Label trigger config must be an object' };
  }
  if (!Array.isArray(config.labels) || config.labels.length === 0) {
    return { valid: false, error: 'Label trigger config must include a non-empty labels array' };
  }
  if (config.action !== undefined && !VALID_LABEL_ACTIONS.includes(config.action)) {
    return { valid: false, error: `Label trigger action must be one of: ${VALID_LABEL_ACTIONS.join(', ')} (got "${config.action}")` };
  }
  return { valid: true };
}

// ── Source type detection ─────────────────────────────────────────────────────

/**
 * Determine the source type for a trigger rule based on its spec.
 * @param {{ spec?: object }} rule
 * @returns {'cron'|'webhook'|'comment'|'label'|'event'|'unknown'}
 */
export function getTriggerSourceType(rule) {
  const spec = rule?.spec || {};
  if (spec.cronExpression !== undefined) return 'cron';
  if (spec.webhookTrigger !== undefined) return 'webhook';
  if (spec.commentTrigger !== undefined) return 'comment';
  if (spec.labelTrigger !== undefined) return 'label';
  if (spec.sources !== undefined) return 'event';
  return 'unknown';
}

// ── Trigger rule validation ───────────────────────────────────────────────────

/**
 * Validate an AgentTriggerRule resource, including source-specific sub-configs.
 * @param {object} rule
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTriggerRule(rule) {
  const errors = [];
  const spec = rule?.spec || {};
  const sourceType = getTriggerSourceType(rule);

  if (sourceType === 'cron') {
    const cronResult = validateCronExpression(spec.cronExpression);
    if (!cronResult.valid) errors.push(`cronExpression: ${cronResult.error}`);
  } else if (sourceType === 'webhook') {
    const webhookResult = validateWebhookTrigger(spec.webhookTrigger);
    if (!webhookResult.valid) errors.push(`webhookTrigger: ${webhookResult.error}`);
  } else if (sourceType === 'comment') {
    const commentResult = validateCommentTrigger(spec.commentTrigger);
    if (!commentResult.valid) errors.push(`commentTrigger: ${commentResult.error}`);
  } else if (sourceType === 'label') {
    const labelResult = validateLabelTrigger(spec.labelTrigger);
    if (!labelResult.valid) errors.push(`labelTrigger: ${labelResult.error}`);
  } else if (sourceType === 'event') {
    if (!Array.isArray(spec.sources) || spec.sources.length === 0) {
      errors.push('sources: must be a non-empty array');
    }
  } else {
    errors.push('spec must include at least one of: cronExpression, webhookTrigger, commentTrigger, labelTrigger, or sources');
  }

  return { valid: errors.length === 0, errors };
}

export const AGENT_TRIGGER_CONTROLLER_BOUNDARY = {
  role: 'agent-trigger-controller',
  scope: 'Event normalization, rule matching, deduplication, and dispatch creation',
  owns: ['event normalization', 'rule matching', 'trigger execution records', 'dispatch initiation'],
  delegatesTo: ['agent-dispatch-controller', 'resource-model'],
  mustNotOwn: ['event sourcing', 'webhook delivery', 'secret values']
};

export function createAgentTriggerController(options = {}) {
  const dispatchController = options.dispatchController;

  return {
    role: 'agent-trigger-controller',

    matchRule(rule, event) {
      // 1. Check event type is in rule.spec.sources
      const sources = rule.spec?.sources || [];
      if (!sources.includes(event.type)) return { matches: false, reason: `Event type '${event.type}' not in rule sources [${sources.join(', ')}]` };
      // 2. Check repository scope (if rule has spec.repository, must match)
      if (rule.spec?.repository && rule.spec.repository !== event.repository) return { matches: false, reason: `Repository '${event.repository}' does not match rule scope '${rule.spec.repository}'` };
      // 3. Check actor filter (if rule has spec.allowedActors)
      if (rule.spec?.allowedActors?.length > 0 && !rule.spec.allowedActors.includes(event.actor)) return { matches: false, reason: `Actor '${event.actor}' not in allowed actors` };
      return { matches: true, reason: 'All conditions met' };
    },

    evaluateEvent({ event, resources }) {
      const rules = resources.AgentTriggerRule || [];
      const executions = resources.AgentTriggerExecution || [];
      const eventUid = `${event.type}:${event.source?.kind}:${event.source?.name}`;

      return rules.map(rule => {
        const match = this.matchRule(rule, event);
        const isDuplicate = executions.some(ex =>
          ex.spec?.triggerRule === rule.metadata?.name &&
          ex.spec?.sourceEvent === eventUid &&
          ex.status?.phase !== 'Failed'
        );
        return { rule, matches: match.matches, reason: match.reason, isDuplicate };
      });
    },

    createTriggerExecution({ rule, event, decision, reason, namespace = 'default', organizationRef = 'default' }) {
      const eventUid = `${event.type}:${event.source?.kind}:${event.source?.name}`;
      const name = `trigger-exec-${rule.metadata?.name}-${Date.now()}`;
      const execution = createResource('AgentTriggerExecution', { name, namespace }, {
        organizationRef,
        triggerRule: rule.metadata?.name,
        sourceEvent: eventUid,
        decision,
      });
      execution.status = { phase: decision, reason, evaluatedAt: new Date().toISOString() };
      return execution;
    },

    /**
     * Evaluate a normalized inbound webhook event against a set of AgentTriggerRule resources.
     *
     * A rule matches when ALL of:
     *   1. rule.spec.enabled !== false
     *   2. rule.spec.webhookTrigger.events includes event.eventType (or is absent/['*'])
     *   3. rule.spec.webhookTrigger.repository (if set) equals event.repository
     *   4. rule.spec.webhookTrigger.action (if set) equals event.action
     *
     * Duplicate rule names are deduplicated (first occurrence wins).
     *
     * @param {{ eventType: string, repository?: string, ref?: string, action?: string, provider?: string }} event
     * @param {object[]} [rules]  Array of AgentTriggerRule resources
     * @returns {{ matchingRules: object[], dispatchIntents: object[] }}
     */
    evaluateWebhookEvent(event, rules) {
      if (!rules || rules.length === 0) {
        return { matchingRules: [], dispatchIntents: [] };
      }

      const seen = new Set();
      const matchingRules = [];
      const dispatchIntents = [];

      for (const rule of rules) {
        const ruleName = rule.metadata?.name;

        // Deduplication
        if (seen.has(ruleName)) continue;
        seen.add(ruleName);

        // 1. Enabled check
        if (rule.spec?.enabled === false) continue;

        const wh = rule.spec?.webhookTrigger;
        // Rule must have a webhookTrigger spec to be considered
        if (!wh) continue;

        // 2. Event type match
        const events = wh.events;
        if (events && !(events.includes('*') || events.includes(event.eventType))) continue;

        // 3. Repository filter
        if (wh.repository && wh.repository !== event.repository) continue;

        // 4. Action filter
        if (wh.action && wh.action !== event.action) continue;

        matchingRules.push(rule);
        dispatchIntents.push({
          rule,
          event,
          agentStack: rule.spec.agentStack,
          taskKind: rule.spec.taskKind || 'diagnostic',
        });
      }

      return { matchingRules, dispatchIntents };
    },

    async processEvent({ event, resources, namespace = 'default', organizationRef = 'default' }) {
      const evaluations = this.evaluateEvent({ event, resources });
      const executions = [];
      let dispatched = 0;
      let skipped = 0;

      for (const { rule, matches, reason, isDuplicate } of evaluations) {
        if (!matches) {
          executions.push(this.createTriggerExecution({ rule, event, decision: 'Skipped', reason, namespace, organizationRef }));
          skipped++;
          continue;
        }
        if (isDuplicate) {
          executions.push(this.createTriggerExecution({ rule, event, decision: 'Deduplicated', reason: 'Already dispatched for this event', namespace, organizationRef }));
          skipped++;
          continue;
        }

        const execution = this.createTriggerExecution({ rule, event, decision: 'Dispatching', reason, namespace, organizationRef });

        if (dispatchController) {
          const result = await dispatchController.createManualDispatch({
            repository: event.repository,
            ref: event.ref,
            sourceRefs: [event.source],
            agentStack: rule.spec?.agentStack,
            taskKind: rule.spec?.taskKind || 'diagnostic',
            actor: event.actor,
            namespace,
            organizationRef,
            resources,
          });
          if (result.error) {
            execution.status.phase = 'Failed';
            execution.status.reason = result.message;
          } else {
            execution.status.phase = 'Dispatched';
            execution.status.dispatchRunRef = result.run?.metadata?.name;
          }
        } else {
          execution.status.phase = 'Dispatched';
          execution.status.reason = 'No dispatch controller configured (dry-run)';
        }

        executions.push(execution);
        dispatched++;
      }

      return { processed: evaluations.length, dispatched, skipped, executions };
    },
  };
}
