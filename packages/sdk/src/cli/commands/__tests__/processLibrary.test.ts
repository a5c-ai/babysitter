import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../processLibrary/active", () => ({
  cloneProcessLibrary: vi.fn(),
  updateProcessLibrary: vi.fn(),
  bindActiveProcessLibrary: vi.fn(),
  ensureActiveProcessLibrary: vi.fn(),
  getDefaultProcessLibrarySpec: vi.fn(),
}));

import {
  handleProcessLibraryActive,
  handleProcessLibraryClone,
  handleProcessLibraryUpdate,
  handleProcessLibraryUse,
} from "../processLibrary";

import {
  bindActiveProcessLibrary,
  cloneProcessLibrary,
  ensureActiveProcessLibrary,
  getDefaultProcessLibrarySpec,
  updateProcessLibrary,
} from "../../../processLibrary/active";

describe("process-library CLI handlers", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDefaultProcessLibrarySpec).mockReturnValue({
      stateDir: "/home/test/.a5c",
      repo: "https://github.com/a5c-ai/babysitter.git",
      cloneDir: "/home/test/.a5c/process-library/babysitter-repo",
      processRoot: "/home/test/.a5c/process-library/babysitter-repo/library",
      referenceRoot: "/home/test/.a5c/process-library/babysitter-repo/library/reference",
    });
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("handleProcessLibraryClone", () => {
    it("uses default repo and dir when omitted", async () => {
      vi.mocked(cloneProcessLibrary).mockResolvedValue({
        dir: "/home/test/.a5c/process-library/babysitter-repo",
        repo: "https://github.com/a5c-ai/babysitter.git",
        revision: "abc123",
      });

      const code = await handleProcessLibraryClone({
        subcommand: "clone",
        json: true,
      });

      expect(code).toBe(0);
      expect(cloneProcessLibrary).toHaveBeenCalledWith({
        repo: "https://github.com/a5c-ai/babysitter.git",
        dir: "/home/test/.a5c/process-library/babysitter-repo",
        ref: undefined,
      });
    });

    it("calls cloneProcessLibrary", async () => {
      vi.mocked(cloneProcessLibrary).mockResolvedValue({
        dir: "/tmp/lib",
        repo: "https://example.com/lib.git",
        revision: "abc123",
      });

      const code = await handleProcessLibraryClone({
        subcommand: "clone",
        repo: "https://example.com/lib.git",
        dir: "/tmp/lib",
        json: true,
      });

      expect(code).toBe(0);
      expect(cloneProcessLibrary).toHaveBeenCalledWith({
        repo: "https://example.com/lib.git",
        dir: "/tmp/lib",
        ref: undefined,
      });
      expect(JSON.parse(logSpy.mock.calls[0][0])).toMatchObject({
        success: true,
        dir: "/tmp/lib",
        repo: "https://example.com/lib.git",
      });
    });
  });

  describe("handleProcessLibraryUpdate", () => {
    it("uses default clone dir when omitted", async () => {
      vi.mocked(updateProcessLibrary).mockResolvedValue({
        dir: "/home/test/.a5c/process-library/babysitter-repo",
        revision: "def456",
      });

      const code = await handleProcessLibraryUpdate({
        subcommand: "update",
        json: true,
      });

      expect(code).toBe(0);
      expect(updateProcessLibrary).toHaveBeenCalledWith({
        dir: "/home/test/.a5c/process-library/babysitter-repo",
        ref: undefined,
      });
    });

    it("calls updateProcessLibrary", async () => {
      vi.mocked(updateProcessLibrary).mockResolvedValue({
        dir: "/tmp/lib",
        revision: "def456",
      });

      const code = await handleProcessLibraryUpdate({
        subcommand: "update",
        dir: "/tmp/lib",
        ref: "main",
        json: true,
      });

      expect(code).toBe(0);
      expect(updateProcessLibrary).toHaveBeenCalledWith({
        dir: "/tmp/lib",
        ref: "main",
      });
    });
  });

  describe("handleProcessLibraryUse", () => {
    it("bootstraps and binds the default process library when --dir is omitted", async () => {
      vi.mocked(ensureActiveProcessLibrary).mockResolvedValue({
        stateFile: "/home/test/.a5c/active/process-library.json",
        bindingScope: "default",
        binding: {
          dir: "/home/test/.a5c/process-library/babysitter-repo/library",
          revision: "abc123",
          boundAt: "2026-03-21T00:00:00.000Z",
        },
        bootstrapped: true,
        defaultSpec: {
          stateDir: "/home/test/.a5c",
          repo: "https://github.com/a5c-ai/babysitter.git",
          cloneDir: "/home/test/.a5c/process-library/babysitter-repo",
          processRoot: "/home/test/.a5c/process-library/babysitter-repo/library",
          referenceRoot: "/home/test/.a5c/process-library/babysitter-repo/library/reference",
        },
      });

      const code = await handleProcessLibraryUse({
        subcommand: "use",
        json: true,
      });

      expect(code).toBe(0);
      expect(ensureActiveProcessLibrary).toHaveBeenCalledWith({
        stateDir: undefined,
        runId: undefined,
        sessionId: undefined,
        ref: undefined,
      });
    });

    it("binds the active process library", async () => {
      vi.mocked(bindActiveProcessLibrary).mockResolvedValue({
        stateFile: "/repo/.a5c/active/process-library.json",
        bindingScope: "run",
        bindingKey: "run-123",
        binding: {
          dir: "/tmp/lib",
          revision: "abc123",
          boundAt: "2026-03-21T00:00:00.000Z",
        },
      });

      const code = await handleProcessLibraryUse({
        subcommand: "use",
        dir: "/tmp/lib",
        runId: "run-123",
        sessionId: "session-456",
        stateDir: ".a5c",
        json: true,
      });

      expect(code).toBe(0);
      expect(bindActiveProcessLibrary).toHaveBeenCalledWith({
        dir: "/tmp/lib",
        stateDir: ".a5c",
        runId: "run-123",
        sessionId: "session-456",
        ref: undefined,
      });
    });
  });

  describe("handleProcessLibraryActive", () => {
    it("returns the bootstrapped binding", async () => {
      vi.mocked(ensureActiveProcessLibrary).mockResolvedValue({
        stateFile: "/home/test/.a5c/active/process-library.json",
        bindingScope: "default",
        binding: {
          dir: "/home/test/.a5c/process-library/babysitter-repo/library",
          revision: "abc123",
          boundAt: "2026-03-21T00:00:00.000Z",
        },
        bootstrapped: true,
        defaultSpec: {
          stateDir: "/home/test/.a5c",
          repo: "https://github.com/a5c-ai/babysitter.git",
          cloneDir: "/home/test/.a5c/process-library/babysitter-repo",
          processRoot: "/home/test/.a5c/process-library/babysitter-repo/library",
          referenceRoot: "/home/test/.a5c/process-library/babysitter-repo/library/reference",
        },
      });

      const code = await handleProcessLibraryActive({
        subcommand: "active",
        json: true,
      });

      expect(code).toBe(0);
      expect(JSON.parse(logSpy.mock.calls[0][0])).toMatchObject({
        bindingScope: "default",
        binding: {
          dir: "/home/test/.a5c/process-library/babysitter-repo/library",
        },
        bootstrapped: true,
      });
    });

    it("passes run and session selectors through", async () => {
      vi.mocked(ensureActiveProcessLibrary).mockResolvedValue({
        stateFile: "/repo/.a5c/active/process-library.json",
        bindingScope: "session",
        bindingKey: "session-456",
        binding: {
          dir: "/tmp/lib",
          revision: "abc123",
          boundAt: "2026-03-21T00:00:00.000Z",
        },
        bootstrapped: false,
        defaultSpec: {
          stateDir: "/repo/.a5c",
          repo: "https://github.com/a5c-ai/babysitter.git",
          cloneDir: "/repo/.a5c/process-library/babysitter-repo",
          processRoot: "/repo/.a5c/process-library/babysitter-repo/library",
          referenceRoot: "/repo/.a5c/process-library/babysitter-repo/library/reference",
        },
      });

      const code = await handleProcessLibraryActive({
        subcommand: "active",
        runId: "run-123",
        sessionId: "session-456",
        stateDir: ".a5c",
        json: true,
      });

      expect(code).toBe(0);
      expect(ensureActiveProcessLibrary).toHaveBeenCalledWith({
        runId: "run-123",
        sessionId: "session-456",
        stateDir: ".a5c",
      });
    });
  });
});
