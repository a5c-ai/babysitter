import { describe, it, expect, vi, beforeEach } from "vitest";

// Create hoisted mock functions
const { mockAccess, mockWriteFile, mockMkdir, mockReaddir, mockFindRunDir } = vi.hoisted(() => ({
  mockAccess: vi.fn(),
  mockWriteFile: vi.fn(),
  mockMkdir: vi.fn(),
  mockReaddir: vi.fn(),
  mockFindRunDir: vi.fn(),
}));

// Mock path-resolver
vi.mock("@/lib/path-resolver", () => ({
  findRunDir: mockFindRunDir,
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
      },
    },
    promises: {
      access: mockAccess,
      writeFile: mockWriteFile,
      mkdir: mockMkdir,
      readdir: mockReaddir,
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
    expect(journalParsed.checksum).toBeDefined();
    expect(typeof journalParsed.checksum).toBe("string");
    expect(journalParsed.checksum.length).toBe(64); // SHA-256 hex
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
