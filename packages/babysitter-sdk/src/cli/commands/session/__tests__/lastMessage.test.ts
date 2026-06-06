import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleSessionLastMessage } from "../lastMessage";

describe("handleSessionLastMessage", () => {
  let tempDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-session-last-msg-"));
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns transcript not found when the file is missing", () => {
    const exitCode = handleSessionLastMessage({
      transcriptPath: path.join(tempDir, "missing.jsonl"),
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.error).toBe("TRANSCRIPT_NOT_FOUND");
  });

  it("extracts the last assistant message and promise tag", async () => {
    const transcriptPath = path.join(tempDir, "transcript.jsonl");
    await fs.writeFile(
      transcriptPath,
      [
        JSON.stringify({ role: "user", message: { content: [{ type: "text", text: "hello" }] } }),
        JSON.stringify({
          type: "assistant",
          message: {
            role: "assistant",
            content: [{ type: "text", text: "Done <promise>PROOF123</promise>" }],
          },
        }),
      ].join("\n"),
      "utf8",
    );

    const exitCode = handleSessionLastMessage({
      transcriptPath,
      json: true,
    });

    expect(exitCode).toBe(0);
    const output = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0] ?? "{}"));
    expect(output.found).toBe(true);
    expect(output.hasPromise).toBe(true);
    expect(output.promiseValue).toBe("PROOF123");
  });
});
