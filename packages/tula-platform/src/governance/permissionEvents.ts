/**
 * Permission event creation, aggregation, and filtering for the governance layer.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PermissionEventSource = 'harness' | 'subagent' | 'sandbox' | 'policy-engine';

export interface PermissionEvent {
  kind: string;
  operation: { kind: string; target: string; [key: string]: unknown };
  decision: { action: string; reason: string; [key: string]: unknown };
  timestamp: string;
  source: PermissionEventSource;
  mandateId?: string;
  chainId?: string;
}

export interface CreatePermissionEventOptions {
  kind: string;
  operation: { kind: string; target: string; [key: string]: unknown };
  decision: { action: string; reason: string; [key: string]: unknown };
  source: PermissionEventSource;
  timestamp?: string;
  mandateId?: string;
  chainId?: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPermissionEvent(options: CreatePermissionEventOptions): PermissionEvent {
  return {
    kind: options.kind,
    operation: options.operation,
    decision: options.decision,
    timestamp: options.timestamp ?? new Date().toISOString(),
    source: options.source,
    ...(options.mandateId !== undefined ? { mandateId: options.mandateId } : {}),
    ...(options.chainId !== undefined ? { chainId: options.chainId } : {}),
  };
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/**
 * Flatten multiple event arrays (from parent/child runs), filter by chainId,
 * and sort chronologically.
 */
export function aggregateChainEvents(
  chainId: string,
  eventArrays: PermissionEvent[][],
): PermissionEvent[] {
  const all: PermissionEvent[] = [];
  for (const arr of eventArrays) {
    for (const ev of arr) {
      if (ev.chainId === chainId) {
        all.push(ev);
      }
    }
  }
  all.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));
  return all;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export interface FilterCriteria {
  source?: PermissionEventSource;
  action?: string;
  kind?: string;
}

export function filterEvents(events: PermissionEvent[], criteria: FilterCriteria): PermissionEvent[] {
  return events.filter((ev) => {
    if (criteria.source !== undefined && ev.source !== criteria.source) return false;
    if (criteria.action !== undefined && ev.decision.action !== criteria.action) return false;
    if (criteria.kind !== undefined && ev.kind !== criteria.kind) return false;
    return true;
  });
}
