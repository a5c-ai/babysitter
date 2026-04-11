/**
 * Types for journal event rendering (GAP-UX-001d).
 */

export interface JournalEvent {
  type: string;
  recordedAt: string;
  data: Record<string, unknown>;
}
