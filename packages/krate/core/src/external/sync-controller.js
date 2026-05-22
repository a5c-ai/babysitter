// External Sync Controller — Slice 3.4
//
// Manages bidirectional sync between external providers and the Krate resource store.
//
// Responsibilities:
//   - Event normalization (raw provider event → canonical internal format)
//   - Resource upsert with external identity envelope (nativeId, url, etag)
//   - High-watermark tracking per binding
//   - Ownership mode arbitration (bidirectional / external-owned / krate-owned)
//   - Tombstone creation for deleted external resources

export const SYNC_CONTROLLER_BOUNDARY = {
  role: 'sync-controller',
  scope: 'Bidirectional sync — event normalization, resource upsert, watermark, ownership, tombstones',
  owns: ['event normalization', 'resource upsert', 'watermark tracking', 'ownership modes', 'tombstones'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['HMAC verification', 'webhook delivery tracking']
};

/**
 * Create a sync controller that manages bidirectional sync between external
 * providers and the Krate resource store.
 *
 * @param {{ persistFn?: (resource: object) => Promise<any> }} [opts]
 *   Optional persistFn is called (fire-and-forget) after watermark/resource changes.
 *   It receives a K8s-style CRD resource representing the changed state.
 * @returns {object}
 */
export function createSyncController({ persistFn } = {}) {
  /** @type {Map<string, string>} bindingRef → ISO timestamp watermark */
  const watermarks = new Map();

  /** @type {Map<string, object>} `${namespace}/${kind}/${localName}` → resource */
  const resources = new Map();

  /** @type {Map<string, object>} nativeId → tombstone record */
  const tombstones = new Map();

  /**
   * Fire-and-forget persistence: call persistFn without blocking the caller.
   * @param {object} resource
   */
  function persist(resource) {
    if (typeof persistFn === 'function') {
      // Intentionally not awaited — persistence is async and non-blocking
      Promise.resolve(persistFn(resource)).catch(() => {
        // Swallow errors in fire-and-forget path; caller may wire monitoring separately
      });
    }
  }

  return {
    /**
     * Normalize a raw provider event into a canonical internal format.
     *
     * @param {{ eventType: string, action?: string, nativeId: string, providerRef: string,
     *           resourceKind: string, data?: object, receivedAt?: string }} rawEvent
     * @returns {{ eventType: string, action: string, nativeId: string, providerRef: string,
     *             resourceKind: string, data: object, receivedAt: string, canonicalAt: string }}
     */
    normalizeEvent(rawEvent) {
      return {
        eventType: rawEvent.eventType,
        action: rawEvent.action || 'unknown',
        nativeId: rawEvent.nativeId,
        providerRef: rawEvent.providerRef,
        resourceKind: rawEvent.resourceKind,
        data: rawEvent.data || {},
        receivedAt: rawEvent.receivedAt || new Date().toISOString(),
        canonicalAt: new Date().toISOString()
      };
    },

    /**
     * Upsert a resource in the local store with an external identity envelope.
     *
     * If the resource already exists (matched by localName + namespace + kind), it will
     * be updated while preserving the nativeId and firstSyncedAt from the first sync.
     *
     * @param {{ kind: string, localName: string, namespace?: string, spec: object,
     *           externalEnvelope: { nativeId: string, url: string, etag: string, providerRef: string } }} params
     * @returns {object} The created/updated resource
     */
    upsertResource({ kind, localName, namespace = 'default', spec, externalEnvelope }) {
      const key = `${namespace}/${kind}/${localName}`;
      const existing = resources.get(key);
      const now = new Date().toISOString();

      const resource = {
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind,
        metadata: {
          name: localName,
          namespace,
          labels: {},
          annotations: {}
        },
        spec: { ...spec },
        status: {
          phase: 'Synced',
          external: {
            nativeId: externalEnvelope.nativeId,
            url: externalEnvelope.url,
            etag: externalEnvelope.etag,
            providerRef: externalEnvelope.providerRef,
            lastSyncedAt: now,
            firstSyncedAt: existing
              ? existing.status.external.firstSyncedAt
              : now
          }
        }
      };

      resources.set(key, resource);
      persist(resource);
      return resource;
    },

    /**
     * Advance the high-watermark timestamp for a given binding.
     * If the new timestamp is not later than the existing one, it is ignored.
     *
     * @param {string} bindingRef
     * @param {string} timestamp  ISO 8601 timestamp
     */
    updateWatermark(bindingRef, timestamp) {
      const current = watermarks.get(bindingRef);
      if (!current || timestamp > current) {
        watermarks.set(bindingRef, timestamp);
        // Persist watermark as a CRD-shaped resource
        persist({
          apiVersion: 'krate.a5c.ai/v1alpha1',
          kind: 'ExternalSyncWatermark',
          metadata: {
            name: `watermark-${bindingRef.replace(/[^a-zA-Z0-9]/g, '-')}`,
            namespace: 'default',
            labels: {},
            annotations: {}
          },
          spec: {
            bindingRef,
            watermark: timestamp
          },
          status: {
            lastUpdatedAt: new Date().toISOString()
          }
        });
      }
    },

    /**
     * Retrieve the current high-watermark for a given binding.
     *
     * @param {string} bindingRef
     * @returns {string|null}
     */
    getWatermark(bindingRef) {
      return watermarks.has(bindingRef) ? watermarks.get(bindingRef) : null;
    },

    /**
     * Apply an ownership mode policy to determine whether an operation is allowed.
     *
     * Modes:
     *   - 'bidirectional'  — both krate and external provider may write
     *   - 'external-owned' — only the external provider may write; krate is read-only
     *   - 'krate-owned'    — only krate may write; external provider is read-only
     *
     * @param {{ ownershipMode: string, operation: string, origin: string }} params
     * @returns {{ allowed: boolean, reason: string|null }}
     */
    applyOwnershipMode({ ownershipMode, operation, origin }) {
      if (ownershipMode === 'bidirectional') {
        return { allowed: true, reason: null };
      }

      if (ownershipMode === 'external-owned') {
        if (origin === 'krate' && operation === 'write') {
          return {
            allowed: false,
            reason: 'external-owned mode — krate writes are blocked; this resource is read-only from krate perspective'
          };
        }
        return { allowed: true, reason: null };
      }

      if (ownershipMode === 'krate-owned') {
        if (origin === 'external' && operation === 'write') {
          return {
            allowed: false,
            reason: 'krate-owned mode — external provider writes are blocked; krate is the authoritative source'
          };
        }
        return { allowed: true, reason: null };
      }

      // Unknown mode — deny by default
      return {
        allowed: false,
        reason: `unknown ownership mode: ${ownershipMode}`
      };
    },

    /**
     * Create a tombstone record marking that an external resource has been deleted.
     *
     * @param {{ nativeId: string, providerRef: string, resourceKind: string,
     *           localRef: string, deletedAt?: string }} params
     * @returns {{ nativeId: string, providerRef: string, resourceKind: string,
     *             localRef: string, tombstoned: true, deletedAt: string }}
     */
    createTombstone({ nativeId, providerRef, resourceKind, localRef, deletedAt }) {
      const record = {
        nativeId,
        providerRef,
        resourceKind,
        localRef,
        tombstoned: true,
        deletedAt: deletedAt || new Date().toISOString()
      };
      tombstones.set(nativeId, record);
      return record;
    },

    /**
     * Retrieve a tombstone record by nativeId, or null if not found.
     *
     * @param {string} nativeId
     * @returns {object|null}
     */
    getTombstone(nativeId) {
      return tombstones.has(nativeId) ? tombstones.get(nativeId) : null;
    }
  };
}
