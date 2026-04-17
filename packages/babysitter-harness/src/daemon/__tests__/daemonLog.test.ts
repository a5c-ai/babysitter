import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { appendDaemonLog, readDaemonLog } from "../daemonLog";

describe("daemonLog", () => {
  let logDir: string;

  beforeEach(async () => {
    logDir = await fs.mkdtemp(path.join(os.tmpdir(), "daemon-log-test-"));
  });

  afterEach(async () => {
    await fs.rm(logDir, { recursive: true, force: true }).catch(() => {});
  });

  it("appends a log entry as JSONL", async () => {
    await appendDaemonLog(logDir, {
      timestamp: "2026-01-15T10:30:00Z",
      event: "DAEMON_STARTED",
      data: { pid: 1234 },
    });

    const raw = await fs.readFile(path.join(logDir, "daemon.jsonl"), "utf-8");
    const parsed = JSON.parse(raw.trim());
    expect(parsed.event).toBe("DAEMON_STARTED");
    expect(parsed.data.pid).toBe(1234);
  });

  it("appends multiple entries on separate lines", async () => {
    await appendDaemonLog(logDir, {
      timestamp: "2026-01-15T10:30:00Z",
      event: "DAEMON_STARTED",
    });
    await appendDaemonLog(logDir, {
      timestamp: "2026-01-15T10:31:00Z",
      event: "TRIGGER_ACTIVATED",
      data: { processId: "p1" },
    });

    const raw = await fs.readFile(path.join(logDir, "daemon.jsonl"), "utf-8");
    const lines = raw.trim().split("\n");
    expect(lines).toHaveLength(2);
  });

  it("readDaemonLog returns all entries", async () => {
    await appendDaemonLog(logDir, {
      timestamp: "t1",
      event: "E1",
    });
    await appendDaemonLog(logDir, {
      timestamp: "t2",
      event: "E2",
      data: { key: "value" },
    });

    const entries = await readDaemonLog(logDir);
    expect(entries).toHaveLength(2);
    expect(entries[0].event).toBe("E1");
    expect(entries[1].event).toBe("E2");
    expect(entries[1].data).toEqual({ key: "value" });
  });

  it("readDaemonLog returns empty array when no log file exists", async () => {
    const entries = await readDaemonLog(logDir);
    expect(entries).toEqual([]);
  });

  it("creates logDir if it does not exist", async () => {
    const nestedDir = path.join(logDir, "nested", "deep");
    await appendDaemonLog(nestedDir, {
      timestamp: "t1",
      event: "TEST",
    });

    const entries = await readDaemonLog(nestedDir);
    expect(entries).toHaveLength(1);
  });
});
