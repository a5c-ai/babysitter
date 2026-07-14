import { describe, it, expect, vi, beforeEach } from "vitest";

// Create hoisted mock functions
const { mockAccess, mockWriteFile, mockMkdir, mockReaddir, mockReadFile, mockFindRunDir, mockGetVersionInfo } = vi.hoisted(() => ({
  mockAccess: vi.fn(),
  mockWriteFile: vi.fn(),
  mockMkdir: vi.fn(),
  mockReaddir: vi.fn(),
  mockReadFile: vi.fn(),
  mockFindRunDir: vi.fn(),
  mockGetVersionInfo: vi.fn(),
}));

// Mock path-resolver
vi.mock("@/lib/path-resolver", () => ({
  findRunDir: mockFindRunDir,
}));

// Mock version-info so tests never shell out to `babysitter --version`
vi.mock("@/lib/version-info", () => ({
  getVersionInfo: mockGetVersionInfo,
}));

// Mock fs with a complete replacement that includes default export
vi.mock("fs", () => {
  return {
    default: {
      promises: {
        access: mockAccess,
        writeFile: mockWriteFile,
        mkdir: mockMkdir,
        readdir: mockReaddir,
        readFile: mockReadFile,
      },
    },
    promises: {
      access: mockAccess,
      writeFile: mockWriteFile,
      mkdir: mockMkdir,
      readdir: mockReaddir,
      readFile: mockReadFile,
    },
  };
});

import { approveBreakpoint } from "../approve-breakpoint";

const defaultSource = { path: "/projects", depth: 2, label: "test" };

describe("approveBreakpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: journal dir has some existing entries
    mockMkdir.mockResolvedValue(undefined);
    mockReaddir.mockResolvedValue(["000001.01ABC.json", "000002.01DEF.json"]);
    // Default: no prior result.json on disk (fresh record) — the double-answer
    // guard reads it to detect an existing observer answer.
    mockReadFile.mockRejectedValue(new Error("ENOENT"));
    // Default: CLI version detection succeeds
    mockGetVersionInfo.mockReturnValue({ app: "0.12.3", babysitter: "6.0.2" });
  });

  // -------------------------------------------------------------------------
  // Input validation
  // -------------------------------------------------------------------------

  it("returns error when runId is empty", async () => {
    const result = await approveBreakpoint("", "eff-001", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing or invalid runId");
  });

  it("returns error when effectId is empty", async () => {
    const result = await approveBreakpoint("run-001", "", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing or invalid effectId");
  });

  it("returns error when answer is empty", async () => {
    const result = await approveBreakpoint("run-001", "eff-001", "");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Answer cannot be empty");
  });

  it("returns error when answer is only whitespace", async () => {
    const result = await approveBreakpoint("run-001", "eff-001", "   ");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Answer cannot be empty");
  });

  it("returns error when runId contains path traversal characters", async () => {
    const result = await approveBreakpoint("../etc", "eff-001", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid characters");
  });

  it("returns error when effectId contains path traversal characters", async () => {
    const result = await approveBreakpoint("run-001", "../../etc", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid characters");
  });

  // -------------------------------------------------------------------------
  // Run/task resolution
  // -------------------------------------------------------------------------

  it("returns error when run is not found", async () => {
    mockFindRunDir.mockResolvedValue(null);

    const result = await approveBreakpoint("run-999", "eff-001", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Run not found");
  });

  it("returns error when task directory does not exist", async () => {
    mockFindRunDir.mockResolvedValue({
      runDir: "/projects/app/.a5c/runs/run-001",
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockRejectedValueOnce(new Error("ENOENT"));

    const result = await approveBreakpoint("run-001", "eff-001", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Task directory not found");
  });

  // -------------------------------------------------------------------------
  // Success path
  // -------------------------------------------------------------------------

  it("writes result.json and journal entry on success", async () => {
    const runDir = "/projects/app/.a5c/runs/run-001";
    mockFindRunDir.mockResolvedValue({
      runDir,
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const result = await approveBreakpoint("run-001", "eff-001", "Deploy approved");
    expect(result.success).toBe(true);

    // Should write 2 files: result.json + journal entry
    expect(mockWriteFile).toHaveBeenCalledTimes(2);

    // First write: result.json
    const [resultPath, resultContent] = mockWriteFile.mock.calls[0];
    expect(resultPath).toContain("eff-001");
    expect(resultPath).toContain("result.json");

    const parsed = JSON.parse(resultContent as string);
    expect(parsed.status).toBe("ok");
    // D1: the runtime reads `approved` to tell an approval from a rejection.
    expect(parsed.value.approved).toBe(true);
    expect(parsed.value.answer).toBe("Deploy approved");
    expect(parsed.value.approvedBy).toBe("observer-dashboard");
    expect(parsed.value.approvedAt).toBeDefined();
    expect(parsed.startedAt).toBeDefined();
    expect(parsed.finishedAt).toBeDefined();

    // Second write: journal entry
    const [journalPath, journalContent] = mockWriteFile.mock.calls[1];
    expect(journalPath).toContain("journal");
    expect(journalPath).toMatch(/000003\./); // next seq after 000001, 000002

    const journalParsed = JSON.parse(journalContent as string);
    expect(journalParsed.type).toBe("EFFECT_RESOLVED");
    expect(journalParsed.data.effectId).toBe("eff-001");
    expect(journalParsed.data.status).toBe("ok");
    expect(journalParsed.data.resultRef).toBe("tasks/eff-001/result.json");
    // SDK-native entries carry the installed SDK/CLI version at the top level.
    expect(journalParsed.sdkVersion).toBe("6.0.2");
    expect(journalParsed.checksum).toBeDefined();
    expect(typeof journalParsed.checksum).toBe("string");
    expect(journalParsed.checksum.length).toBe(64); // SHA-256 hex

    // Key order matches SDK-written entries: type, recordedAt, data, sdkVersion, checksum.
    expect(Object.keys(journalParsed)).toEqual([
      "type",
      "recordedAt",
      "data",
      "sdkVersion",
      "checksum",
    ]);
  });

  it("omits sdkVersion when CLI version detection fails", async () => {
    mockGetVersionInfo.mockReturnValue({ app: "0.12.3", babysitter: "N/A" });
    mockFindRunDir.mockResolvedValue({
      runDir: "/projects/app/.a5c/runs/run-001",
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const result = await approveBreakpoint("run-001", "eff-001", "yes");
    expect(result.success).toBe(true);

    const [, journalContent] = mockWriteFile.mock.calls[1];
    const journalParsed = JSON.parse(journalContent as string);
    // Never forge a version we didn't detect.
    expect("sdkVersion" in journalParsed).toBe(false);
    expect(journalParsed.type).toBe("EFFECT_RESOLVED");
  });

  it("journal checksum is valid SHA-256 of payload without checksum", async () => {
    const runDir = "/projects/app/.a5c/runs/run-001";
    mockFindRunDir.mockResolvedValue({
      runDir,
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    await approveBreakpoint("run-001", "eff-001", "yes");

    const [, journalContent] = mockWriteFile.mock.calls[1];
    const journalParsed = JSON.parse(journalContent as string);

    // Recompute checksum: SHA-256 of JSON.stringify(payloadWithoutChecksum, null, 2) + "\n"
    const { checksum: _checksum, ...payloadWithoutChecksum } = journalParsed;
    const crypto = await import("crypto");
    const expected = crypto.default
      .createHash("sha256")
      .update(JSON.stringify(payloadWithoutChecksum, null, 2) + "\n")
      .digest("hex");
    expect(journalParsed.checksum).toBe(expected);
  });

  it("uses seq 1 when journal dir is empty", async () => {
    const runDir = "/projects/app/.a5c/runs/run-001";
    mockFindRunDir.mockResolvedValue({
      runDir,
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockReaddir.mockResolvedValue([]); // empty journal

    await approveBreakpoint("run-001", "eff-001", "yes");

    const [journalPath] = mockWriteFile.mock.calls[1];
    expect(journalPath).toMatch(/000001\./);
  });

  it("trims whitespace from the answer", async () => {
    const runDir = "/projects/app/.a5c/runs/run-001";
    mockFindRunDir.mockResolvedValue({
      runDir,
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const result = await approveBreakpoint("run-001", "eff-001", "  yes  ");
    expect(result.success).toBe(true);

    const [, content] = mockWriteFile.mock.calls[0];
    const parsed = JSON.parse(content as string);
    expect(parsed.value.answer).toBe("yes");
  });

  // -------------------------------------------------------------------------
  // Write failure
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // UX-R3 §14.5 — double-answer guard (AC-62) + write-path unchanged (AC-63)
  // -------------------------------------------------------------------------

  it("AC-62: overwriting an answer THIS observer already recorded rewrites result.json but does NOT append a second journal entry", async () => {
    const runDir = "/projects/app/.a5c/runs/run-001";
    mockFindRunDir.mockResolvedValue({
      runDir,
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    // A prior observer record is on disk.
    mockReadFile.mockResolvedValue(
      JSON.stringify({
        status: "ok",
        value: { approved: true, answer: "first", approvedBy: "observer-dashboard" },
      })
    );

    const result = await approveBreakpoint("run-001", "eff-001", "second");
    expect(result.success).toBe(true);

    // Exactly ONE write: result.json only (no second EFFECT_RESOLVED journal entry).
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const [resultPath, content] = mockWriteFile.mock.calls[0];
    expect(resultPath).toContain("result.json");
    const parsed = JSON.parse(content as string);
    expect(parsed.value.answer).toBe("second"); // overwrote, not stacked
  });

  it("AC-62: a prior result.json NOT written by the observer is treated as a fresh record (still appends one journal entry)", async () => {
    const runDir = "/projects/app/.a5c/runs/run-001";
    mockFindRunDir.mockResolvedValue({
      runDir,
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(
      JSON.stringify({ status: "ok", value: { approved: true, approvedBy: "sdk" } })
    );

    const result = await approveBreakpoint("run-001", "eff-001", "yes");
    expect(result.success).toBe(true);
    // Fresh record semantics: result.json + one journal entry (2 writes).
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
  });

  it("returns error when file write fails", async () => {
    const runDir = "/projects/app/.a5c/runs/run-001";
    mockFindRunDir.mockResolvedValue({
      runDir,
      source: defaultSource,
      projectName: "app",
      projectPath: "/projects/app",
    });
    mockAccess.mockResolvedValue(undefined);
    mockWriteFile.mockRejectedValue(new Error("EACCES: permission denied"));

    const result = await approveBreakpoint("run-001", "eff-001", "yes");
    expect(result.success).toBe(false);
    expect(result.error).toContain("EACCES");
  });
});
