import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBabysitterCli } from "../main";

let root: string;
let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "cli-run-create-convergent-"));
  logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(async () => {
  logSpy.mockRestore();
  await fs.rm(root, { recursive: true, force: true });
});

describe("run:create-convergent CLI", () => {
  it("Given canonical source files, When run:create-convergent is retried, Then JSON output is exact and the run is reused", async () => {
    const runsDir = path.join(root, "runs");
    const inputsPath = path.join(root, "inputs.json");
    const processPath = path.join(root, "hermes-wave.mjs");
    await fs.writeFile(inputsPath, JSON.stringify({ objective: "recover" }, null, 2) + "\n");
    await fs.writeFile(processPath, "export async function process() { return 'ok'; }\n");
    const args = [
      "run:create-convergent",
      "--runs-dir", runsDir,
      "--run-id", "hermes-wave-7107-r2",
      "--request", "hermes-wave",
      "--process-id", "hermes-wave",
      "--entry", `${processPath}#process`,
      "--inputs", inputsPath,
      "--canonical-input-sha256", await sha256File(inputsPath),
      "--process-snapshot-sha256", await sha256File(processPath),
      "--replacement-session-id", "ses_fresh_replacement",
      "--json",
    ];
    const cli = createBabysitterCli();

    const firstExitCode = await cli.run(args);
    const first = readLastJson();
    const secondExitCode = await cli.run(args);
    const second = readLastJson();

    expect(firstExitCode).toBe(0);
    expect(secondExitCode).toBe(0);
    expect(first).toEqual(second);
    expect(Object.keys(first).sort()).toEqual([
      "completionMarkerPath",
      "completionMarkerSelfHash",
      "hookResultSha256",
      "hookStatus",
      "runCreatedEventSha256",
      "runCreatedEventUlid",
      "runId",
      "runJsonSha256",
    ]);
  });
});

async function sha256File(filePath: string): Promise<string> {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

function readLastJson(): Record<string, unknown> {
  return JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
}
