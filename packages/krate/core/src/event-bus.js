/**
 * Module-level event bus for SSE real-event streaming.
 * Provides a pub/sub mechanism for resource change events.
 * Events are also persisted to a ring buffer for survival across restarts.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EVENT_LOG_DIR = process.env.KRATE_EVENT_LOG_DIR || join(process.env.HOME || '/tmp', '.krate', 'events');
const MAX_EVENTS = 1000;

function ensureLogDir() {
  try { if (!existsSync(EVENT_LOG_DIR)) mkdirSync(EVENT_LOG_DIR, { recursive: true }); } catch {}
}

function persistEvent(event) {
  try {
    ensureLogDir();
    const logFile = join(EVENT_LOG_DIR, 'events.jsonl');
    appendFileSync(logFile, JSON.stringify(event) + '\n');
    // Truncate if over max
    try {
      const content = readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n');
      if (lines.length > MAX_EVENTS) {
        writeFileSync(logFile, lines.slice(-MAX_EVENTS).join('\n') + '\n');
      }
    } catch {}
  } catch {}
}

/**
 * Load persisted events from the ring buffer file.
 * @param {number} [limit=100] - max events to return
 * @returns {object[]} array of event objects (newest last)
 */
export function loadPersistedEvents(limit = 100) {
  try {
    const logFile = join(EVENT_LOG_DIR, 'events.jsonl');
    if (!existsSync(logFile)) return [];
    const content = readFileSync(logFile, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.slice(-limit).map((line) => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}

/**
 * Creates a new event bus with subscribe, unsubscribe, and emit methods.
 * Events are persisted to a JSONL ring buffer file.
 * @returns {{ subscribe: Function, unsubscribe: Function, emit: Function, emitResourceChange: Function }}
 */
export function createEventBus() {
  const listeners = new Set();

  return {
    subscribe(fn) {
      listeners.add(fn);
    },

    unsubscribe(fn) {
      listeners.delete(fn);
    },

    emit(event) {
      for (const fn of listeners) {
        fn(event);
      }
      persistEvent(event);
    },

    emitResourceChange(kind, name, operation) {
      this.emit({
        type: 'resource-change',
        kind,
        name,
        operation,
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Module-level singleton event bus shared across the HTTP server and API controller.
 */
export const globalEventBus = createEventBus();
