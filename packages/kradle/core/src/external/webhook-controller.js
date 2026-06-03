// External Webhook Controller — Slice 3.4
//
// Handles inbound webhook delivery:
//   - HMAC-SHA256 signature verification
//   - Delivery record creation and persistence (in-memory store)
//   - Deduplication by deliveryId
//   - Async event queue with subscriber support

import { createHmac, timingSafeEqual } from 'node:crypto';

export const WEBHOOK_CONTROLLER_BOUNDARY = {
  role: 'webhook-controller',
  scope: 'Inbound webhook delivery — HMAC verification, dedup, async event queue',
  owns: ['HMAC validation', 'delivery records', 'dedup index', 'event queue'],
  delegatesTo: ['sync-controller'],
  mustNotOwn: ['resource persistence', 'ownership arbitration']
};

/**
 * Create a webhook controller that handles inbound webhook delivery.
 *
 * @param {{ secret: string }} options
 * @returns {object}
 */
export function createWebhookController(options = {}) {
  const { secret } = options;

  /** @type {Map<string, object>} deliveryId → delivery record */
  const deliveries = new Map();

  /** @type {Function[]} event subscribers */
  const subscribers = [];

  return {
    /**
     * Verify an HMAC-SHA256 signature against a request body.
     *
     * @param {string} body  Raw request body string
     * @param {string|null} signature  Signature header value (e.g. "sha256=abc…")
     * @returns {{ valid: boolean, reason: string|null }}
     */
    verifyHmacSignature(body, signature) {
      if (!signature) {
        return { valid: false, reason: 'missing signature header' };
      }

      if (!signature.startsWith('sha256=')) {
        return { valid: false, reason: 'invalid signature format — must start with sha256=' };
      }

      const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

      try {
        const expectedBuf = Buffer.from(expected, 'utf8');
        const actualBuf = Buffer.from(signature, 'utf8');
        if (expectedBuf.length !== actualBuf.length) {
          return { valid: false, reason: 'signature mismatch' };
        }
        const match = timingSafeEqual(expectedBuf, actualBuf);
        if (!match) {
          return { valid: false, reason: 'signature mismatch — HMAC does not match' };
        }
        return { valid: true, reason: null };
      } catch {
        return { valid: false, reason: 'signature verification error — invalid signature bytes' };
      }
    },

    /**
     * Create a delivery record for a received webhook payload.
     *
     * @param {{ deliveryId: string, eventType: string, payload: object, rawBody: string }} params
     * @returns {{ deliveryId: string, eventType: string, timestamp: string, payload: object, rawBody: string, status: string }}
     */
    createDeliveryRecord({ deliveryId, eventType, payload, rawBody }) {
      return {
        deliveryId,
        eventType,
        timestamp: new Date().toISOString(),
        payload,
        rawBody,
        status: 'received'
      };
    },

    /**
     * Persist a delivery record into the in-memory dedup store.
     *
     * @param {{ deliveryId: string }} record
     */
    recordDelivery(record) {
      deliveries.set(record.deliveryId, record);
    },

    /**
     * Check whether a deliveryId has already been processed.
     *
     * @param {string} deliveryId
     * @returns {boolean}
     */
    isDuplicate(deliveryId) {
      return deliveries.has(deliveryId);
    },

    /**
     * Register a subscriber that will be called for each queued normalized event.
     *
     * @param {Function} handler  fn(event) → void
     */
    onEvent(handler) {
      subscribers.push(handler);
    },

    /**
     * Process a delivery: create a record, check dedup, emit to queue.
     *
     * @param {{ deliveryId: string, eventType: string, payload: object, rawBody: string }} params
     * @returns {{ queued: number, duplicate: boolean, deliveryId: string }}
     */
    processDelivery({ deliveryId, eventType, payload, rawBody }) {
      if (this.isDuplicate(deliveryId)) {
        return { queued: 0, duplicate: true, deliveryId };
      }

      const record = this.createDeliveryRecord({ deliveryId, eventType, payload, rawBody });
      this.recordDelivery(record);

      const normalizedEvent = {
        deliveryId,
        eventType,
        payload,
        receivedAt: record.timestamp
      };

      let queued = 0;
      for (const subscriber of subscribers) {
        subscriber(normalizedEvent);
        queued++;
      }

      return { queued, duplicate: false, deliveryId };
    }
  };
}
