import type { JsonRecord } from "../types";

export type { JournalEvent, JsonRecord } from "../types";

export interface SnapshotStateOptions {
  runDir: string;
  state: JsonRecord;
  journalHead?: {
    seq: number;
    ulid: string;
  };
}

export interface StoreTaskArtifactsOptions {
  runDir: string;
  effectId: string;
  task?: JsonRecord;
  result?: JsonRecord;
  artifacts?: Array<{ name: string; data: Buffer | string }>;
}
