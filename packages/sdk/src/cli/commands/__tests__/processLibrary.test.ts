import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../processLibrary/active", () => ({
  cloneProcessLibrary: vi.fn(),
  updateProcessLibrary: vi.fn(),
  bindActiveProcessLibrary: vi.fn(),
  resolveActiveProcessLibrary: vi.fn(),
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
  resolveActiveProcessLibrary,
  updateProcessLibrary,
} from "../../../processLibrary/active";

describe("process-library CLI handlers", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("handleProcessLibraryClone", () => {
    it("requires --repo", async () => {
      const code = await handleProcessLibraryClone({
        subcommand: "clone",
        dir: "/tmp/lib",
        json: false,
      });

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--repo is required")
      );
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
    it("requires --dir", async () => {
      const code = await handleProcessLibraryUpdate({
        subcommand: "update",
        json: false,
      });

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--dir is required")
      );
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
    it("requires --dir", async () => {
      const code = await handleProcessLibraryUse({
        subcommand: "use",
        json: false,
      });

      expect(code).toBe(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("--dir is required")
      );
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
    it("returns no binding cleanly", async () => {
      vi.mocked(resolveActiveProcessLibrary).mockResolvedValue({
        stateFile: "/repo/.a5c/active/process-library.json",
        bindingScope: null,
        binding: null,
      });

      const code = await handleProcessLibraryActive({
        subcommand: "active",
        json: true,
      });

      expect(code).toBe(0);
      expect(JSON.parse(logSpy.mock.calls[0][0])).toMatchObject({
        bindingScope: null,
        binding: null,
      });
    });

    it("passes run and session selectors through", async () => {
      vi.mocked(resolveActiveProcessLibrary).mockResolvedValue({
        stateFile: "/repo/.a5c/active/process-library.json",
        bindingScope: "session",
        bindingKey: "session-456",
        binding: {
          dir: "/tmp/lib",
          revision: "abc123",
          boundAt: "2026-03-21T00:00:00.000Z",
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
      expect(resolveActiveProcessLibrary).toHaveBeenCalledWith({
        runId: "run-123",
        sessionId: "session-456",
        stateDir: ".a5c",
      });
    });
  });
});
