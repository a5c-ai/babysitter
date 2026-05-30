import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { appendDaemonLog, readDaemonLog } from "../daemonLog";

async function makeLogDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-runtime-daemon-log-"));
}

describe("daemon JSONL logging policy", () => {
  it("preserves old timestamp/event/data entries while accepting additive structured fields", async () => {
    const logDir = await makeLogDir();

    await appendDaemonLog(logDir, {
      timestamp: "2026-01-01T00:00:00.000Z",
      event: "DAEMON_STARTED",
      data: { pid: 123 },
    });
    await appendDaemonLog(logDir, {
      timestamp: "2026-01-01T00:00:01.000Z",
      event: "TRIGGER_ACTIVATED",
      level: "info",
      schemaVersion: "2026.05.daemon-log-v1",
      correlationId: "corr-1",
      data: { processId: "process-a" },
    });

    const entries = await readDaemonLog(logDir);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      timestamp: "2026-01-01T00:00:00.000Z",
      event: "DAEMON_STARTED",
      data: { pid: 123 },
    });
    expect(entries[1]).toMatchObject({
      timestamp: "2026-01-01T00:00:01.000Z",
      event: "TRIGGER_ACTIVATED",
      level: "info",
      schemaVersion: "2026.05.daemon-log-v1",
      correlationId: "corr-1",
    });
  });

  it("filters entries below the configured minimum level", async () => {
    const logDir = await makeLogDir();

    await appendDaemonLog(logDir, {
      timestamp: "2026-01-01T00:00:00.000Z",
      event: "DEBUG_EVENT",
      level: "debug",
    }, { minLevel: "warn" });
    await appendDaemonLog(logDir, {
      timestamp: "2026-01-01T00:00:01.000Z",
      event: "WARN_EVENT",
      level: "warn",
    }, { minLevel: "warn" });

    const entries = await readDaemonLog(logDir);

    expect(entries.map((entry) => entry.event)).toEqual(["WARN_EVENT"]);
  });

  it("rotates daemon.jsonl before appending beyond maxBytes", async () => {
    const logDir = await makeLogDir();

    await appendDaemonLog(logDir, {
      timestamp: "2026-01-01T00:00:00.000Z",
      event: "FIRST_EVENT",
      data: { message: "x".repeat(120) },
    }, { maxBytes: 80, maxFiles: 2 });
    await appendDaemonLog(logDir, {
      timestamp: "2026-01-01T00:00:01.000Z",
      event: "SECOND_EVENT",
      data: { message: "second" },
    }, { maxBytes: 80, maxFiles: 2 });

    const current = await readFile(join(logDir, "daemon.jsonl"), "utf-8");
    const rotated = await readFile(join(logDir, "daemon.jsonl.1"), "utf-8");

    expect(current).toContain("SECOND_EVENT");
    expect(rotated).toContain("FIRST_EVENT");
  });

  it("supports deterministic sampling without weakening schema compatibility", async () => {
    const logDir = await makeLogDir();

    await appendDaemonLog(logDir, {
      timestamp: "2026-01-01T00:00:00.000Z",
      event: "SAMPLED_OUT",
      level: "info",
    }, { sampleRate: 0 });
    await appendDaemonLog(logDir, {
      timestamp: "2026-01-01T00:00:01.000Z",
      event: "SAMPLED_IN",
      level: "info",
    }, { sampleRate: 1 });

    const entries = await readDaemonLog(logDir);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ event: "SAMPLED_IN", sampled: true });
  });
});
