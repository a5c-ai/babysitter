import type { JsonRecord } from "@a5c-ai/babysitter-sdk";

export type { JournalEvent, JsonRecord } from "@a5c-ai/babysitter-sdk";

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
