/**
 * Module-level event bus for SSE real-event streaming.
 * Preserves the historical synchronous API while allowing a shared durable
 * transport underneath it.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EVENT_LOG_DIR = process.env.KRATE_EVENT_LOG_DIR || join(process.env.HOME || '/tmp', '.krate', 'events');
const MAX_EVENTS = 1000;
const DEFAULT_EVENT_SUBJECT = 'krate.events';
const DEFAULT_NATS_STREAM = 'KRATE_EVENTS';

function ensureLogDir() {
  try {
    if (!existsSync(EVENT_LOG_DIR)) mkdirSync(EVENT_LOG_DIR, { recursive: true });
  } catch (err) {
    console.warn('[event-bus] failed to create event log directory:', err.message);
  }
}

function eventLogFile() {
  ensureLogDir();
  return join(EVENT_LOG_DIR, 'events.jsonl');
}

function persistEvent(event) {
  try {
    const logFile = eventLogFile();
    appendFileSync(logFile, JSON.stringify(event) + '\n');
    try {
      const content = readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      if (lines.length > MAX_EVENTS) writeFileSync(logFile, lines.slice(-MAX_EVENTS).join('\n') + '\n');
    } catch (err) {
      console.warn('[event-bus] failed to truncate event log:', err.message);
    }
  } catch (err) {
    console.warn('[event-bus] failed to persist event:', err.message);
  }
}

export function loadPersistedEvents(limit = 100) {
  try {
    const logFile = join(EVENT_LOG_DIR, 'events.jsonl');
    if (!existsSync(logFile)) return [];
    const content = readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.slice(-limit).map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function createEventId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeEvent(event) {
  const id = event?.id || createEventId();
  const timestamp = event?.timestamp || new Date().toISOString();

  return {
    id,
    timestamp,
    ...(event || {}),
  };
}

function annotateEvent(event, normalized) {
  if (!event || typeof event !== 'object') return normalized;
  if (!Object.prototype.hasOwnProperty.call(event, 'id')) {
    Object.defineProperty(event, 'id', { value: normalized.id, enumerable: false, configurable: true });
  }
  if (!Object.prototype.hasOwnProperty.call(event, 'timestamp')) {
    Object.defineProperty(event, 'timestamp', { value: normalized.timestamp, enumerable: false, configurable: true });
  }
  return event;
}

function safeDeliver(listener, event) {
  try {
    listener(event);
  } catch (err) {
    console.warn('[event-bus] subscriber failed:', err?.message || err);
  }
}

function decodeBrokerEvent(data) {
  try {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data || []);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function createNatsJetStreamBrokerClient(options = {}) {
  const servers = options.url || process.env.KRATE_EVENT_NATS_URL || process.env.NATS_URL;
  const subject = options.subject || process.env.KRATE_EVENT_NATS_SUBJECT || DEFAULT_EVENT_SUBJECT;
  const stream = options.stream || process.env.KRATE_EVENT_NATS_STREAM || DEFAULT_NATS_STREAM;
  let connectionPromise;
  let jetstreamPromise;
  let managerPromise;
  let state = { transport: 'nats-jetstream', status: 'connecting', durable: true, subject, stream };

  async function connection() {
    if (!connectionPromise) {
      connectionPromise = import('@nats-io/transport-node')
        .then(({ connect }) => connect({ servers }))
        .catch((err) => {
          state = { ...state, status: 'error', reason: err?.message || String(err) };
          throw err;
        });
    }
    return connectionPromise;
  }

  async function manager() {
    if (!managerPromise) {
      managerPromise = Promise.all([connection(), import('@nats-io/jetstream')]).then(async ([nc, { jetstreamManager }]) => {
        const jsm = await jetstreamManager(nc);
        try {
          await jsm.streams.info(stream);
        } catch {
          await jsm.streams.add({ name: stream, subjects: [subject], max_msgs: MAX_EVENTS });
        }
        state = { ...state, status: 'ok', reason: undefined };
        return jsm;
      });
    }
    return managerPromise;
  }

  async function jetstreamClient() {
    if (!jetstreamPromise) {
      jetstreamPromise = Promise.all([connection(), manager(), import('@nats-io/jetstream')]).then(([nc, _jsm, { jetstream }]) => jetstream(nc));
    }
    return jetstreamPromise;
  }

  void manager().catch(() => {});

  return {
    async publish(eventSubject, event) {
      const js = await jetstreamClient();
      const payload = new TextEncoder().encode(JSON.stringify(event));
      return js.publish(eventSubject || subject, payload, { msgID: event.id }).catch((err) => {
        state = { ...state, status: 'error', reason: err?.message || String(err) };
        throw err;
      });
    },

    subscribe(eventSubject, listener) {
      let subscription;
      let active = true;
      connection().then((nc) => {
        if (!active) return;
        subscription = nc.subscribe(eventSubject || subject);
        (async () => {
          for await (const message of subscription) {
            const event = decodeBrokerEvent(message.data);
            if (event) listener(event);
          }
        })().catch((err) => console.warn('[event-bus] NATS subscription failed:', err?.message || err));
      }).catch((err) => console.warn('[event-bus] NATS connection failed:', err?.message || err));
      return () => {
        active = false;
        try { subscription?.unsubscribe(); } catch {}
      };
    },

    async replaySince(eventSubject, cursor, limit = 100) {
      const jsm = await manager();
      const info = await jsm.streams.info(stream);
      const firstSeq = Math.max(info.state.first_seq || 1, (info.state.last_seq || 0) - MAX_EVENTS + 1);
      const lastSeq = info.state.last_seq || 0;
      const events = [];
      for (let seq = firstSeq; seq <= lastSeq && events.length < MAX_EVENTS; seq += 1) {
        try {
          const message = await jsm.streams.getMessage(stream, { seq });
          if (message?.subject !== (eventSubject || subject)) continue;
          const event = decodeBrokerEvent(message.data);
          if (event) events.push(event);
        } catch {}
      }
      if (!cursor) return events.slice(-limit);
      const index = events.findIndex((event) => event.id === cursor);
      return index < 0 ? [] : events.slice(index + 1, index + 1 + limit);
    },

    status() {
      return state;
    },
  };
}

export function createMemoryEventTransport(options = {}) {
  const listeners = new Set();
  const events = Array.isArray(options.initialEvents) ? [...options.initialEvents] : loadPersistedEvents(MAX_EVENTS);

  return {
    name: 'memory',
    available: true,
    required: false,

    publish(event) {
      const normalized = normalizeEvent(event);
      const delivered = annotateEvent(event, normalized);
      events.push(normalized);
      if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
      persistEvent(normalized);
      for (const listener of [...listeners]) safeDeliver(listener, delivered);
      return normalized;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    replaySince(cursor, limit = 100) {
      if (!cursor) return events.slice(-limit);
      const index = events.findIndex((event) => event.id === cursor);
      if (index < 0) return [];
      return events.slice(index + 1, index + 1 + limit);
    },

    status() {
      return { transport: 'memory', status: 'ok', durable: false };
    },
  };
}

export function createNatsJetStreamEventTransport(options = {}) {
  const listeners = new Set();
  const subject = options.subject || process.env.KRATE_EVENT_NATS_SUBJECT || DEFAULT_EVENT_SUBJECT;
  const natsUrl = options.url || process.env.KRATE_EVENT_NATS_URL || process.env.NATS_URL || '';
  const required = options.required ?? process.env.KRATE_EVENT_REQUIRE_BROKER === 'true';
  const brokerClient = options.brokerClient || (natsUrl ? createNatsJetStreamBrokerClient({ url: natsUrl, subject }) : null);
  let unavailableReason = natsUrl || brokerClient ? null : 'missing-nats-url';

  function publishToBroker(event) {
    const brokerStatus = brokerClient?.status?.();
    if (required && brokerStatus && brokerStatus.status !== 'ok') {
      throw new Error(brokerStatus.reason || `broker-${brokerStatus.status}`);
    }
    if (brokerClient?.publish) return brokerClient.publish(subject, event);
    unavailableReason = unavailableReason || 'nats-client-not-initialized';
    if (required) throw new Error(unavailableReason);
    return null;
  }

  return {
    name: 'nats-jetstream',
    get available() {
      return Boolean(brokerClient?.publish || natsUrl);
    },
    required,

    publish(event) {
      const normalized = normalizeEvent(event);
      const delivered = annotateEvent(event, normalized);
      persistEvent(normalized);
      const published = publishToBroker(normalized);
      if (published?.catch) published.catch((err) => { unavailableReason = err?.message || String(err); });
      for (const listener of [...listeners]) safeDeliver(listener, delivered);
      return normalized;
    },

    subscribe(listener) {
      listeners.add(listener);
      const unsubscribe = brokerClient?.subscribe?.(subject, (event) => safeDeliver(listener, normalizeEvent(event)));
      return () => {
        listeners.delete(listener);
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    },

    replaySince(cursor, limit = 100) {
      if (brokerClient?.replaySince) return brokerClient.replaySince(subject, cursor, limit);
      const persisted = loadPersistedEvents(MAX_EVENTS);
      if (!cursor) return persisted.slice(-limit);
      const index = persisted.findIndex((event) => event.id === cursor);
      return index < 0 ? [] : persisted.slice(index + 1, index + 1 + limit);
    },

    status() {
      if (unavailableReason && required) return { transport: 'nats-jetstream', status: 'error', reason: unavailableReason, durable: true };
      if (brokerClient?.status) return brokerClient.status();
      return { transport: 'nats-jetstream', status: unavailableReason ? 'degraded' : 'ok', reason: unavailableReason, durable: true, subject };
    },
  };
}

export function createConfiguredEventTransport(env = process.env) {
  const wantsNats = env.KRATE_EVENT_TRANSPORT === 'nats' || env.KRATE_EVENT_TRANSPORT === 'nats-jetstream' || env.KRATE_EVENT_NATS_URL || env.NATS_URL;
  return wantsNats
    ? createNatsJetStreamEventTransport({ url: env.KRATE_EVENT_NATS_URL || env.NATS_URL, required: env.KRATE_EVENT_REQUIRE_BROKER === 'true' })
    : createMemoryEventTransport();
}

export function createEventBus(options = {}) {
  const transport = options.transport || createConfiguredEventTransport(options.env || process.env);
  const listenerUnsubscribes = new Map();

  return {
    subscribe(fn) {
      const unsubscribe = transport.subscribe(fn);
      listenerUnsubscribes.set(fn, unsubscribe);
      return unsubscribe;
    },

    unsubscribe(fn) {
      const unsubscribe = listenerUnsubscribes.get(fn);
      if (unsubscribe) unsubscribe();
      listenerUnsubscribes.delete(fn);
    },

    emit(event) {
      return transport.publish(event);
    },

    emitResourceChange(kind, name, operation) {
      return this.emit({
        type: 'resource-change',
        kind,
        name,
        operation,
        timestamp: new Date().toISOString(),
      });
    },

    replaySince(cursor, limit) {
      return transport.replaySince(cursor, limit);
    },

    status() {
      return transport.status();
    },
  };
}

export const globalEventBus = createEventBus();
