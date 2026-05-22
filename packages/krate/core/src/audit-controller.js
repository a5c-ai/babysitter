/**
 * Audit Controller — Org-scoped audit log, event streaming, smart polling with
 * exponential backoff, replay on reconnect, and metrics aggregation.
 *
 * @module audit-controller
 */

export const AUDIT_CONTROLLER_BOUNDARY = {
  role: 'audit-controller',
  scope: 'Org-scoped audit log — event recording, streaming, replay, metrics',
  owns: ['audit events', 'event streaming', 'event polling', 'audit metrics'],
  delegatesTo: [],
  mustNotOwn: ['identity management', 'resource storage', 'git operations'],
};

// ─── AuditController ─────────────────────────────────────────────────────────

/**
 * Create an in-memory audit controller.
 *
 * @returns {{
 *   log: Function,
 *   query: Function,
 *   getStream: Function,
 *   getMetrics: Function,
 * }}
 */
export function createAuditController() {
  /** @type {Array<AuditEvent>} */
  const store = [];
  let seq = 0;

  return {
    role: 'audit-controller',

    /**
     * Record an audit event.
     *
     * @param {{ org: string, actor?: string, action: string, resource?: object, timestamp?: string }} params
     * @returns {AuditEvent}
     */
    log({ org, actor = 'system', action, resource = {}, timestamp } = {}) {
      if (!org || typeof org !== 'string') {
        throw new Error('audit.log: org is required');
      }
      if (!action || typeof action !== 'string') {
        throw new Error('audit.log: action is required');
      }

      const event = {
        id: ++seq,
        org,
        actor,
        action,
        resource: Object.assign({}, resource),
        timestamp: timestamp || new Date().toISOString(),
      };

      store.push(event);
      return Object.assign({}, event);
    },

    /**
     * Query audit events with filtering and pagination.
     *
     * @param {{ org?: string, action?: string, since?: string, until?: string, limit?: number, offset?: number }} params
     * @returns {{ events: AuditEvent[], total: number }}
     */
    query({ org, action, since, until, limit, offset = 0 } = {}) {
      let filtered = store.slice();

      if (org) filtered = filtered.filter(e => e.org === org);
      if (action) filtered = filtered.filter(e => e.action === action);

      if (since) {
        const sinceMs = new Date(since).getTime();
        filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= sinceMs);
      }
      if (until) {
        const untilMs = new Date(until).getTime();
        filtered = filtered.filter(e => new Date(e.timestamp).getTime() <= untilMs);
      }

      // reverse chronological
      filtered = filtered.slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const total = filtered.length;
      filtered = filtered.slice(offset);
      if (limit != null) filtered = filtered.slice(0, limit);

      return { events: filtered.map(e => Object.assign({}, e)), total };
    },

    /**
     * Return all events after the given sequence number for a given org (event replay).
     *
     * @param {{ org?: string, afterSeq: number }} params
     * @returns {{ events: AuditEvent[], lastSeq: number }}
     */
    getStream({ org, afterSeq = 0 } = {}) {
      let filtered = store.filter(e => e.id > afterSeq);
      if (org) filtered = filtered.filter(e => e.org === org);
      // chronological order for stream replay
      filtered = filtered.slice().sort((a, b) => a.id - b.id);
      return {
        events: filtered.map(e => Object.assign({}, e)),
        lastSeq: filtered.length > 0 ? filtered[filtered.length - 1].id : afterSeq,
      };
    },

    /**
     * Aggregate audit metrics for an org.
     *
     * @param {{ org?: string }} params
     * @returns {{ byAction: object, byOrg: object, byHour: object, total: number }}
     */
    getMetrics({ org } = {}) {
      let events = store.slice();
      if (org) events = events.filter(e => e.org === org);

      const byAction = {};
      const byOrg = {};
      const byHour = {};

      for (const event of events) {
        byAction[event.action] = (byAction[event.action] || 0) + 1;
        byOrg[event.org] = (byOrg[event.org] || 0) + 1;
        // hour key: "2026-05-13T10" (drop minutes/seconds)
        const hourKey = event.timestamp.slice(0, 13);
        byHour[hourKey] = (byHour[hourKey] || 0) + 1;
      }

      return { byAction, byOrg, byHour, total: events.length };
    },
  };
}

// ─── EventPoller ─────────────────────────────────────────────────────────────

/**
 * Create a smart event poller with exponential backoff.
 *
 * When polls return no new events the backoff interval doubles (up to maxBackoff).
 * When new events arrive the backoff resets to initialBackoff.
 *
 * @param {{ controller: object, org?: string, initialBackoff?: number, maxBackoff?: number }} options
 * @returns {{ poll: Function, getBackoff: Function, reset: Function }}
 */
export function createEventPoller({ controller, org, initialBackoff = 1000, maxBackoff = 30000 } = {}) {
  let lastSeq = 0;
  let currentBackoff = initialBackoff;

  return {
    /**
     * Poll for new events.  Updates backoff state.
     * @returns {{ events: AuditEvent[], lastSeq: number }}
     */
    poll() {
      const result = controller.getStream({ org, afterSeq: lastSeq });
      if (result.events.length > 0) {
        // New events — reset backoff and advance cursor
        lastSeq = result.lastSeq;
        currentBackoff = initialBackoff;
      } else {
        // No new events — double the backoff, capped at maxBackoff
        currentBackoff = Math.min(currentBackoff * 2, maxBackoff);
      }
      return result;
    },

    /**
     * Get the current backoff interval in milliseconds.
     * @returns {number}
     */
    getBackoff() {
      return currentBackoff;
    },

    /**
     * Reset the poller cursor and backoff to their initial states.
     */
    reset() {
      lastSeq = 0;
      currentBackoff = initialBackoff;
    },
  };
}

/**
 * @typedef {{ id: number, org: string, actor: string, action: string, resource: object, timestamp: string }} AuditEvent
 */
