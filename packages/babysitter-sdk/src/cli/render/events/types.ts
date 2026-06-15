export interface JournalEvent {
  type: string;
  recordedAt: string;
  data: Record<string, unknown>;
}
