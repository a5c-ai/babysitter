import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readSessionFile } from "../parse";
import {
  acquireSessionReservation,
  releaseSessionReservation,
} from "../reservation";

const roots: string[] = [];

describe("session reservation", () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
  });

  async function stateFile(): Promise<string> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "session-reservation-"));
    roots.push(root);
    return path.join(root, "session.md");
  }

  it("serializes contenders and permits a successor after release", async () => {
    const file = await stateFile();
    const first = await acquireSessionReservation(file);
    await expect(acquireSessionReservation(file, { timeoutMs: 20 })).rejects.toThrow(/busy/);

    await releaseSessionReservation(first);
    const second = await acquireSessionReservation(file);
    expect(second.token).not.toBe(first.token);
    await releaseSessionReservation(second);
  });

  it("ignores a claim held by a dead process", async () => {
    const file = await stateFile();
    const lockPath = `${file}.create.lock`;
    await fs.mkdir(lockPath);
    await fs.writeFile(path.join(lockPath, "dead-owner.json"), JSON.stringify({
      pid: 999_999,
      token: "dead-owner",
      acquiredAt: Date.now(),
    }));

    const recovered = await acquireSessionReservation(file, { timeoutMs: 100 });
    expect(recovered.token).toBeTruthy();
    await releaseSessionReservation(recovered);
  });

  it("release removes only the caller's immutable claim", async () => {
    const file = await stateFile();
    const first = await acquireSessionReservation(file);
    const unrelatedClaim = path.join(first.lockPath, "new-owner.json");
    await fs.writeFile(unrelatedClaim, JSON.stringify({
      pid: process.pid,
      token: "new-owner",
      acquiredAt: Date.now() + 1,
    }));

    await releaseSessionReservation(first);

    await expect(fs.access(first.claimPath)).rejects.toThrow();
    await expect(fs.access(unrelatedClaim)).resolves.toBeUndefined();
  });

  it("allows only one concurrent contender to own the session", async () => {
    const file = await stateFile();
    for (let iteration = 0; iteration < 25; iteration += 1) {
      const attempts = await Promise.allSettled([
        acquireSessionReservation(file, { timeoutMs: 100 }),
        acquireSessionReservation(file, { timeoutMs: 100 }),
      ]);

      expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
      const winner = attempts.find((attempt): attempt is PromiseFulfilledResult<Awaited<ReturnType<typeof acquireSessionReservation>>> => attempt.status === "fulfilled");
      if (!winner) throw new Error("missing reservation winner");
      await releaseSessionReservation(winner.value);
    }
  });

  it("ignores old malformed claim JSON", async () => {
    const file = await stateFile();
    const lockPath = `${file}.create.lock`;
    const malformedClaim = path.join(lockPath, "malformed.json");
    await fs.mkdir(lockPath);
    await fs.writeFile(malformedClaim, "{}");
    const old = new Date(Date.now() - 120_000);
    await fs.utimes(malformedClaim, old, old);

    const recovered = await acquireSessionReservation(file, { timeoutMs: 100, staleMs: 1 });

    expect(recovered.token).toBeTruthy();
    await releaseSessionReservation(recovered);
  });

  it("blocks on a fresh partially published claim until it becomes stale", async () => {
    const file = await stateFile();
    const lockPath = `${file}.create.lock`;
    const partialClaim = path.join(lockPath, "partial.json");
    await fs.mkdir(lockPath);
    await fs.writeFile(partialClaim, "");

    await expect(acquireSessionReservation(file, { timeoutMs: 20, staleMs: 60_000 })).rejects.toThrow(/busy/);

    const old = new Date(Date.now() - 120_000);
    await fs.utimes(partialClaim, old, old);
    const recovered = await acquireSessionReservation(file, { timeoutMs: 100, staleMs: 1 });
    await releaseSessionReservation(recovered);
  });

  it("rejects malformed active state instead of defaulting it to inactive", async () => {
    const file = await stateFile();
    await fs.writeFile(file, [
      "---",
      "active: definitely",
      "iteration: 1",
      "max_iterations: 10",
      "run_id: run-a",
      "run_ids: run-a",
      "started_at: 2026-08-21T00:00:00.000Z",
      "last_iteration_at: 2026-08-21T00:00:00.000Z",
      "iteration_times:",
      "---",
      "",
    ].join("\n"));

    await expect(readSessionFile(file)).rejects.toThrow(/invalid active/i);
  });
});
