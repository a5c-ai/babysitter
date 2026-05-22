/**
 * Module-level event bus for SSE real-event streaming.
 * Provides a pub/sub mechanism for resource change events.
 */

/**
 * Creates a new event bus with subscribe, unsubscribe, and emit methods.
 * @returns {{ subscribe: Function, unsubscribe: Function, emit: Function, emitResourceChange: Function }}
 */
export function createEventBus() {
  const listeners = new Set();

  return {
    /**
     * Subscribe a listener function to receive emitted events.
     * @param {Function} fn - listener receiving the event object
     */
    subscribe(fn) {
      listeners.add(fn);
    },

    /**
     * Remove a previously subscribed listener.
     * @param {Function} fn - the listener to remove
     */
    unsubscribe(fn) {
      listeners.delete(fn);
    },

    /**
     * Emit an event to all current subscribers.
     * @param {object} event - the event payload to broadcast
     */
    emit(event) {
      for (const fn of listeners) {
        fn(event);
      }
    },

    /**
     * Emit a resource-change event with kind, name, operation, and timestamp.
     * @param {string} kind - resource kind (e.g. 'Repository')
     * @param {string} name - resource name
     * @param {string} operation - operation performed (e.g. 'apply', 'delete')
     */
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
