import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { TriggerEvent } from "./types";

export type DurableTriggerState = "pending" | "running" | "succeeded" | "failed" | "dead-letter";

export interface DurableTriggerQueueOptions {
  maxAttempts?: number;
  baseBackoffMs?: number;
  now?: () => number;
}

export interface DurableTriggerRecord {
  id: string;
  trigger: TriggerEvent;
  state: DurableTriggerState;
  attempts: number;
  enqueuedAt: string;
  updatedAt: string;
  nextAttemptAt?: string;
  ackedAt?: string;
  lastError?: string;
}

interface QueueFile {
  version: 1;
  events: DurableTriggerRecord[];
}

const QUEUE_FILE = "trigger-queue.json";

export class DurableTriggerQueue {
  private readonly filePath: string;
  private readonly maxAttempts: number;
  private readonly baseBackoffMs: number;
  private readonly now: () => number;
  private events: DurableTriggerRecord[] = [];
  private writeChain = Promise.resolve();

  private constructor(daemonDir: string, options?: DurableTriggerQueueOptions) {
    this.filePath = path.join(daemonDir, QUEUE_FILE);
    this.maxAttempts = options?.maxAttempts ?? 3;
    this.baseBackoffMs = options?.baseBackoffMs ?? 1_000;
    this.now = options?.now ?? Date.now;
  }

  static async open(daemonDir: string, options?: DurableTriggerQueueOptions): Promise<DurableTriggerQueue> {
    const queue = new DurableTriggerQueue(daemonDir, options);
    await queue.load();
    return queue;
  }

  async enqueue(trigger: TriggerEvent): Promise<DurableTriggerRecord> {
    const timestamp = new Date(this.now()).toISOString();
    const record: DurableTriggerRecord = {
      id: randomUUID(),
      trigger: redactTrigger(trigger),
      state: "pending",
      attempts: 0,
      enqueuedAt: timestamp,
      updatedAt: timestamp,
    };
    this.events.push(record);
    await this.persist();
    return { ...record };
  }

  async claimDue(limit = Number.POSITIVE_INFINITY): Promise<DurableTriggerRecord[]> {
    const now = this.now;
    const timestamp = new Date(now()).toISOString();
    const claimed: DurableTriggerRecord[] = [];
    for (const event of this.events) {
      if (claimed.length >= limit) break;
      if (event.state !== "pending" && event.state !== "failed") continue;
      if (event.nextAttemptAt && Date.parse(event.nextAttemptAt) > now()) continue;
      event.state = "running";
      event.attempts += 1;
      event.updatedAt = timestamp;
      claimed.push({ ...event, trigger: cloneTrigger(event.trigger) });
    }
    if (claimed.length > 0) {
      await this.persist();
    }
    return claimed;
  }

  async ack(id: string): Promise<void> {
    const event = this.events.find((item) => item.id === id);
    if (!event) return;
    const timestamp = new Date(this.now()).toISOString();
    event.state = "succeeded";
    event.ackedAt = timestamp;
    event.updatedAt = timestamp;
    await this.persist();
  }

  async fail(id: string, error: unknown): Promise<void> {
    const event = this.events.find((item) => item.id === id);
    if (!event || event.state === "succeeded") return;
    const timestamp = new Date(this.now()).toISOString();
    event.lastError = error instanceof Error ? error.message : String(error);
    event.updatedAt = timestamp;

    if (event.attempts >= this.maxAttempts) {
      event.state = "dead-letter";
      delete event.nextAttemptAt;
    } else {
      event.state = "failed";
      const delay = this.baseBackoffMs * Math.max(1, 2 ** Math.max(0, event.attempts - 1));
      event.nextAttemptAt = new Date(this.now() + delay).toISOString();
    }
    await this.persist();
  }

  async snapshot(): Promise<DurableTriggerRecord[]> {
    return this.events.map((event) => ({ ...event, trigger: cloneTrigger(event.trigger) }));
  }

  counts(): { active: number; pending: number; deadLetter: number } {
    return {
      active: this.events.filter((event) => event.state === "running").length,
      pending: this.events.filter((event) => event.state === "pending" || event.state === "failed").length,
      deadLetter: this.events.filter((event) => event.state === "dead-letter").length,
    };
  }

  private async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw) as QueueFile;
      this.events = (parsed.events ?? []).map((event) => ({
        ...event,
        state: event.state === "running" ? "pending" : event.state,
        trigger: cloneTrigger(event.trigger),
      }));
      if (this.events.some((event) => event.state === "pending" && event.updatedAt)) {
        await this.persist();
      }
    } catch {
      this.events = [];
    }
  }

  private async persist(): Promise<void> {
    const content = JSON.stringify({ version: 1, events: this.events } satisfies QueueFile, null, 2);
    this.writeChain = this.writeChain.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tmpPath = `${this.filePath}.tmp-${process.pid}-${Date.now()}`;
      await fs.writeFile(tmpPath, content, "utf-8");
      await fs.rename(tmpPath, this.filePath);
    });
    await this.writeChain;
  }
}

function cloneTrigger(trigger: TriggerEvent): TriggerEvent {
  return JSON.parse(JSON.stringify(trigger)) as TriggerEvent;
}

const SECRET_KEY_PATTERN = /(secret|token|api[-_]?key|authorization|password|credential|private[-_]?key)/i;

function redactTrigger(trigger: TriggerEvent): TriggerEvent {
  return redactValue(cloneTrigger(trigger), "") as TriggerEvent;
}

function redactValue(value: unknown, key: string): unknown {
  if (SECRET_KEY_PATTERN.test(key)) {
    return "[REDACTED]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, ""));
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      result[childKey] = redactValue(childValue, childKey);
    }
    return result;
  }
  return value;
}
