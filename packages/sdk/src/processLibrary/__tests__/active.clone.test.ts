import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const execFileMock = vi.fn();

vi.mock("node:child_process", () => ({
  execFile: execFileMock,
}));

describe("cloneProcessLibrary", () => {
  beforeEach(() => {
    vi.resetModules();
    execFileMock.mockReset();
  });

  it("removes a partial clone directory when git clone fails", async () => {
    const tmpRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-library-clone-failure-"),
    );
    const cloneDir = path.join(tmpRoot, "clone");

    try {
      execFileMock.mockImplementation(
        (
          _command: string,
          args: string[],
          _options: Record<string, unknown>,
          callback: (
            error: NodeJS.ErrnoException | null,
            stdout: string,
            stderr: string,
          ) => void,
        ) => {
          const targetDir = String(args[args.length - 1]);
          void fs
            .mkdir(targetDir, { recursive: true })
            .then(() => {
              const error = Object.assign(new Error("clone failed"), {
                code: 128,
              });
              callback(error, "", "fatal: clone failed");
            });
        },
      );

      const { cloneProcessLibrary } = await import("../active");

      await expect(
        cloneProcessLibrary({
          repo: "https://example.com/process-library.git",
          dir: cloneDir,
        }),
      ).rejects.toThrow(/clone failed/);

      await expect(fs.access(cloneDir)).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  });
});
