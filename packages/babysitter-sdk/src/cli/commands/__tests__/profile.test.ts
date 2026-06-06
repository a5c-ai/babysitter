/**
 * Tests for profile:* CLI commands (handleProfileRead, handleProfileWrite,
 * handleProfileMerge, handleProfileRender, handleProfileCommand).
 *
 * Covers:
 *   - handleProfileRead returns 1 when neither --user nor --project specified
 *   - handleProfileRead --user --json returns profile JSON when profile exists
 *   - handleProfileRead --user --json returns error JSON when no profile
 *   - handleProfileRead --project --json returns project profile JSON
 *   - handleProfileWrite --user --input <file> --json writes user profile
 *   - handleProfileWrite returns 1 when no --input provided
 *   - handleProfileMerge --user --input <file> --json merges into existing profile
 *   - handleProfileMerge returns 1 when no existing profile to merge into
 *   - handleProfileRender --user returns markdown
 *   - handleProfileRender --project returns project markdown
 *   - handleProfileCommand routes to correct handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

import type { UserProfile } from "../../../profiles/types";
import type { ProjectProfile } from "../../../profiles/types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("../../../profiles/userProfile", () => ({
  readUserProfile: vi.fn(),
  writeUserProfile: vi.fn(),
  mergeUserProfile: vi.fn(),
  createDefaultUserProfile: vi.fn(),
  renderUserProfileMarkdown: vi.fn(),
  getUserProfileDir: vi.fn(() => "/mock/.a5c"),
}));

vi.mock("../../../profiles/projectProfile", () => ({
  readProjectProfile: vi.fn(),
  writeProjectProfile: vi.fn(),
  mergeProjectProfile: vi.fn(),
  createDefaultProjectProfile: vi.fn(),
  renderProjectProfileMarkdown: vi.fn(),
  getProjectProfileDir: vi.fn(() => "/mock/project/.a5c"),
}));

import {
  handleProfileRead,
  handleProfileWrite,
  handleProfileMerge,
  handleProfileRender,
  handleProfileCommand,
} from "../profile";
import type { ProfileCommandArgs } from "../profile";

import {
  readUserProfile,
  writeUserProfile,
  mergeUserProfile,
  renderUserProfileMarkdown,
  getUserProfileDir,
} from "../../../profiles/userProfile";

import {
  readProjectProfile,
  writeProjectProfile,
  mergeProjectProfile,
  renderProjectProfileMarkdown,
  getProjectProfileDir,
} from "../../../profiles/projectProfile";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER_PROFILE: UserProfile = {
  name: "Test User",
  specialties: [{ domain: "backend" }],
  expertiseLevels: { typescript: { level: "advanced", confidence: 0.9 } },
  goals: [{ id: "g1", description: "Ship v2", category: "delivery" }],
  preferences: {
    verbosity: "normal",
    autonomyLevel: "semi-autonomous",
    riskTolerance: "moderate",
  },
  toolPreferences: { editor: "vscode" },
  breakpointTolerance: {
    global: "moderate",
    skipBreakpointsForKnownPatterns: false,
    alwaysBreakOn: [],
  },
  communicationStyle: {
    tone: "professional",
    useEmojis: false,
    explanationDepth: "standard",
    preferredResponseFormat: "markdown",
  },
  experience: { currentRole: "Engineer" },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
  version: 3,
};

const MOCK_PROJECT_PROFILE: ProjectProfile = {
  projectName: "test-project",
  description: "A test project",
  goals: [{ id: "pg1", description: "Launch", category: "delivery" }],
  techStack: { languages: [{ name: "TypeScript", version: "5.x", role: "primary" }] },
  architecture: { pattern: "monorepo" },
  workflows: [{ name: "deploy", steps: ["build", "test", "deploy"] }],
  tools: {},
  conventions: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-20T00:00:00.000Z",
  version: 5,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseArgs(overrides: Partial<ProfileCommandArgs> = {}): ProfileCommandArgs {
  return {
    subcommand: "read",
    user: false,
    project: false,
    json: false,
    ...overrides,
  };
}

async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "profile-test-"));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let consoleSpy: { log: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

beforeEach(() => {
  vi.clearAllMocks();
  consoleSpy = {
    log: vi.spyOn(console, "log").mockImplementation(() => {}),
    error: vi.spyOn(console, "error").mockImplementation(() => {}),
  };
});

afterEach(() => {
  consoleSpy.log.mockRestore();
  consoleSpy.error.mockRestore();
});

// =========================================================================
// 1. handleProfileRead
// =========================================================================

describe("handleProfileRead", () => {
  it("returns 1 when neither --user nor --project specified", async () => {
    const code = await handleProfileRead(baseArgs());
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile:read] Specify --user or --project",
    );
  });

  it("returns profile JSON when user profile exists (--user --json)", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);

    const code = await handleProfileRead(baseArgs({ user: true, json: true }));
    expect(code).toBe(0);
    expect(readUserProfile).toHaveBeenCalledWith(undefined);

    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output) as UserProfile;
    expect(parsed.name).toBe("Test User");
    expect(parsed.version).toBe(3);
  });

  it("returns error JSON when no user profile exists (--user --json)", async () => {
    vi.mocked(readUserProfile).mockReturnValue(null);
    vi.mocked(getUserProfileDir).mockReturnValue("/mock/.a5c");

    const code = await handleProfileRead(baseArgs({ user: true, json: true }));
    expect(code).toBe(1);

    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output) as { error: string; profileDir: string };
    expect(parsed.error).toBe("no_profile");
    expect(parsed.profileDir).toBe("/mock/.a5c");
  });

  it("returns error message to stderr when no user profile exists (--user, no --json)", async () => {
    vi.mocked(readUserProfile).mockReturnValue(null);
    vi.mocked(getUserProfileDir).mockReturnValue("/mock/.a5c");

    const code = await handleProfileRead(baseArgs({ user: true }));
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalled();
    const msg = consoleSpy.error.mock.calls[0]?.[0] as string;
    expect(msg).toContain("No user profile found");
    expect(msg).toContain("/mock/.a5c");
  });

  it("renders markdown when user profile exists (--user, no --json)", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);
    vi.mocked(renderUserProfileMarkdown).mockReturnValue("# User Profile: Test User");

    const code = await handleProfileRead(baseArgs({ user: true }));
    expect(code).toBe(0);
    expect(renderUserProfileMarkdown).toHaveBeenCalledWith(MOCK_USER_PROFILE);
    expect(consoleSpy.log).toHaveBeenCalledWith("# User Profile: Test User");
  });

  it("returns project profile JSON (--project --json)", async () => {
    vi.mocked(readProjectProfile).mockReturnValue(MOCK_PROJECT_PROFILE);

    const code = await handleProfileRead(baseArgs({ project: true, json: true }));
    expect(code).toBe(0);
    expect(readProjectProfile).toHaveBeenCalledWith(undefined);

    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output) as ProjectProfile;
    expect(parsed.projectName).toBe("test-project");
    expect(parsed.version).toBe(5);
  });

  it("returns error JSON when no project profile exists (--project --json)", async () => {
    vi.mocked(readProjectProfile).mockReturnValue(null);
    vi.mocked(getProjectProfileDir).mockReturnValue("/mock/project/.a5c");

    const code = await handleProfileRead(baseArgs({ project: true, json: true }));
    expect(code).toBe(1);

    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output) as { error: string; profileDir: string };
    expect(parsed.error).toBe("no_profile");
    expect(parsed.profileDir).toBe("/mock/project/.a5c");
  });

  it("passes --dir to readUserProfile when provided", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);

    const code = await handleProfileRead(baseArgs({ user: true, json: true, dir: "/custom/dir" }));
    expect(code).toBe(0);
    expect(readUserProfile).toHaveBeenCalledWith("/custom/dir");
  });

  it("passes --dir to readProjectProfile when provided", async () => {
    vi.mocked(readProjectProfile).mockReturnValue(MOCK_PROJECT_PROFILE);

    const code = await handleProfileRead(
      baseArgs({ project: true, json: true, dir: "/custom/project" }),
    );
    expect(code).toBe(0);
    expect(readProjectProfile).toHaveBeenCalledWith("/custom/project");
  });
});

// =========================================================================
// 2. handleProfileWrite
// =========================================================================

describe("handleProfileWrite", () => {
  it("returns 1 when neither --user nor --project specified", async () => {
    const code = await handleProfileWrite(baseArgs({ subcommand: "write", inputPath: "/tmp/in.json" }));
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile:write] Specify --user or --project",
    );
  });

  it("returns 1 when no --input provided", async () => {
    const code = await handleProfileWrite(baseArgs({ subcommand: "write", user: true }));
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile:write] --input <file> is required",
    );
  });

  it("writes user profile from input file (--user --input <file> --json)", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "profile-in.json");
    await fs.writeFile(inputFile, JSON.stringify(MOCK_USER_PROFILE), "utf8");

    vi.mocked(getUserProfileDir).mockReturnValue("/mock/.a5c");

    try {
      const code = await handleProfileWrite(
        baseArgs({ subcommand: "write", user: true, json: true, inputPath: inputFile }),
      );
      expect(code).toBe(0);
      expect(writeUserProfile).toHaveBeenCalledTimes(1);

      // Verify the first argument is the parsed profile data
      const writtenProfile = vi.mocked(writeUserProfile).mock.calls[0]?.[0] as UserProfile;
      expect(writtenProfile.name).toBe("Test User");

      // Verify JSON output
      const output = consoleSpy.log.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output) as { status: string; profileDir: string; type: string };
      expect(parsed.status).toBe("ok");
      expect(parsed.type).toBe("user");
      expect(parsed.profileDir).toBe("/mock/.a5c");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("writes project profile from input file (--project --input <file> --json)", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "project-in.json");
    await fs.writeFile(inputFile, JSON.stringify(MOCK_PROJECT_PROFILE), "utf8");

    vi.mocked(getProjectProfileDir).mockReturnValue("/mock/project/.a5c");

    try {
      const code = await handleProfileWrite(
        baseArgs({ subcommand: "write", project: true, json: true, inputPath: inputFile }),
      );
      expect(code).toBe(0);
      expect(writeProjectProfile).toHaveBeenCalledTimes(1);

      const writtenProfile = vi.mocked(writeProjectProfile).mock.calls[0]?.[0] as ProjectProfile;
      expect(writtenProfile.projectName).toBe("test-project");

      const output = consoleSpy.log.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output) as { status: string; profileDir: string; type: string };
      expect(parsed.status).toBe("ok");
      expect(parsed.type).toBe("project");
      expect(parsed.profileDir).toBe("/mock/project/.a5c");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("writes user profile with non-json output", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "profile-in.json");
    await fs.writeFile(inputFile, JSON.stringify(MOCK_USER_PROFILE), "utf8");

    vi.mocked(getUserProfileDir).mockReturnValue("/mock/.a5c");

    try {
      const code = await handleProfileWrite(
        baseArgs({ subcommand: "write", user: true, json: false, inputPath: inputFile }),
      );
      expect(code).toBe(0);
      const output = consoleSpy.log.mock.calls[0]?.[0] as string;
      expect(output).toContain("[profile:write] User profile written to");
      expect(output).toContain("/mock/.a5c");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("returns 1 when input file does not exist", async () => {
    const code = await handleProfileWrite(
      baseArgs({ subcommand: "write", user: true, inputPath: "/nonexistent/file.json" }),
    );
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalled();
    const msg = consoleSpy.error.mock.calls[0]?.[0] as string;
    expect(msg).toContain("[profile:write] Failed to read input file");
  });

  it("returns 1 when input file has invalid JSON", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "bad.json");
    await fs.writeFile(inputFile, "not valid json {{{", "utf8");

    try {
      const code = await handleProfileWrite(
        baseArgs({ subcommand: "write", user: true, inputPath: inputFile }),
      );
      expect(code).toBe(1);
      expect(consoleSpy.error).toHaveBeenCalled();
      const msg = consoleSpy.error.mock.calls[0]?.[0] as string;
      expect(msg).toContain("[profile:write] Failed to read input file");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("passes --dir to writeUserProfile", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "profile-in.json");
    await fs.writeFile(inputFile, JSON.stringify(MOCK_USER_PROFILE), "utf8");

    try {
      const code = await handleProfileWrite(
        baseArgs({
          subcommand: "write",
          user: true,
          json: true,
          inputPath: inputFile,
          dir: "/custom/dir",
        }),
      );
      expect(code).toBe(0);
      expect(writeUserProfile).toHaveBeenCalledWith(expect.anything(), "/custom/dir");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });
});

// =========================================================================
// 3. handleProfileMerge
// =========================================================================

describe("handleProfileMerge", () => {
  it("returns 1 when neither --user nor --project specified", async () => {
    const code = await handleProfileMerge(
      baseArgs({ subcommand: "merge", inputPath: "/tmp/in.json" }),
    );
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile:merge] Specify --user or --project",
    );
  });

  it("returns 1 when no --input provided", async () => {
    const code = await handleProfileMerge(baseArgs({ subcommand: "merge", user: true }));
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile:merge] --input <file> is required",
    );
  });

  it("returns 1 when no existing user profile to merge into", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "updates.json");
    await fs.writeFile(inputFile, JSON.stringify({ name: "Updated" }), "utf8");

    vi.mocked(readUserProfile).mockReturnValue(null);
    vi.mocked(getUserProfileDir).mockReturnValue("/mock/.a5c");

    try {
      const code = await handleProfileMerge(
        baseArgs({ subcommand: "merge", user: true, inputPath: inputFile }),
      );
      expect(code).toBe(1);
      expect(consoleSpy.error).toHaveBeenCalled();
      const msg = consoleSpy.error.mock.calls[0]?.[0] as string;
      expect(msg).toContain("No existing user profile to merge into");
      expect(msg).toContain("/mock/.a5c");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("returns 1 when no existing project profile to merge into", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "updates.json");
    await fs.writeFile(inputFile, JSON.stringify({ projectName: "Updated" }), "utf8");

    vi.mocked(readProjectProfile).mockReturnValue(null);
    vi.mocked(getProjectProfileDir).mockReturnValue("/mock/project/.a5c");

    try {
      const code = await handleProfileMerge(
        baseArgs({ subcommand: "merge", project: true, inputPath: inputFile }),
      );
      expect(code).toBe(1);
      expect(consoleSpy.error).toHaveBeenCalled();
      const msg = consoleSpy.error.mock.calls[0]?.[0] as string;
      expect(msg).toContain("No existing project profile to merge into");
      expect(msg).toContain("/mock/project/.a5c");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("merges updates into existing user profile (--user --input <file> --json)", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "updates.json");
    const updates = { name: "Updated User" };
    await fs.writeFile(inputFile, JSON.stringify(updates), "utf8");

    const mergedProfile: UserProfile = {
      ...MOCK_USER_PROFILE,
      name: "Updated User",
      version: 4,
      updatedAt: "2026-02-01T00:00:00.000Z",
    };

    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);
    vi.mocked(mergeUserProfile).mockReturnValue(mergedProfile);

    try {
      const code = await handleProfileMerge(
        baseArgs({ subcommand: "merge", user: true, json: true, inputPath: inputFile }),
      );
      expect(code).toBe(0);

      // Verify merge was called with existing + updates
      expect(mergeUserProfile).toHaveBeenCalledWith(MOCK_USER_PROFILE, updates);

      // Verify merged result was written
      expect(writeUserProfile).toHaveBeenCalledWith(mergedProfile, undefined);

      // Verify JSON output
      const output = consoleSpy.log.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output) as { status: string; type: string; version: number };
      expect(parsed.status).toBe("ok");
      expect(parsed.type).toBe("user");
      expect(parsed.version).toBe(4);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("merges updates into existing project profile (--project --input <file> --json)", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "updates.json");
    const updates = { projectName: "Updated Project" };
    await fs.writeFile(inputFile, JSON.stringify(updates), "utf8");

    const mergedProfile: ProjectProfile = {
      ...MOCK_PROJECT_PROFILE,
      projectName: "Updated Project",
      version: 6,
      updatedAt: "2026-02-01T00:00:00.000Z",
    };

    vi.mocked(readProjectProfile).mockReturnValue(MOCK_PROJECT_PROFILE);
    vi.mocked(mergeProjectProfile).mockReturnValue(mergedProfile);

    try {
      const code = await handleProfileMerge(
        baseArgs({ subcommand: "merge", project: true, json: true, inputPath: inputFile }),
      );
      expect(code).toBe(0);

      expect(mergeProjectProfile).toHaveBeenCalledWith(MOCK_PROJECT_PROFILE, updates);
      expect(writeProjectProfile).toHaveBeenCalledWith(mergedProfile, undefined);

      const output = consoleSpy.log.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(output) as { status: string; type: string; version: number };
      expect(parsed.status).toBe("ok");
      expect(parsed.type).toBe("project");
      expect(parsed.version).toBe(6);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("prints non-json output for user merge", async () => {
    const tmpDir = await makeTmpDir();
    const inputFile = path.join(tmpDir, "updates.json");
    await fs.writeFile(inputFile, JSON.stringify({ name: "Updated" }), "utf8");

    const mergedProfile = { ...MOCK_USER_PROFILE, version: 4 };
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);
    vi.mocked(mergeUserProfile).mockReturnValue(mergedProfile);

    try {
      const code = await handleProfileMerge(
        baseArgs({ subcommand: "merge", user: true, json: false, inputPath: inputFile }),
      );
      expect(code).toBe(0);
      const output = consoleSpy.log.mock.calls[0]?.[0] as string;
      expect(output).toContain("[profile:merge] User profile merged");
      expect(output).toContain("version 4");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it("returns 1 when input file cannot be read", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);

    const code = await handleProfileMerge(
      baseArgs({ subcommand: "merge", user: true, inputPath: "/nonexistent/updates.json" }),
    );
    expect(code).toBe(1);
    const msg = consoleSpy.error.mock.calls[0]?.[0] as string;
    expect(msg).toContain("[profile:merge] Failed to read input file");
  });
});

// =========================================================================
// 4. handleProfileRender
// =========================================================================

describe("handleProfileRender", () => {
  it("returns 1 when neither --user nor --project specified", async () => {
    const code = await handleProfileRender(baseArgs({ subcommand: "render" }));
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile:render] Specify --user or --project",
    );
  });

  it("renders user profile markdown (--user)", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);
    vi.mocked(renderUserProfileMarkdown).mockReturnValue("# User Profile: Test User\n\nContent here");

    const code = await handleProfileRender(baseArgs({ subcommand: "render", user: true }));
    expect(code).toBe(0);
    expect(renderUserProfileMarkdown).toHaveBeenCalledWith(MOCK_USER_PROFILE);
    expect(consoleSpy.log).toHaveBeenCalledWith("# User Profile: Test User\n\nContent here");
  });

  it("renders user profile markdown as JSON (--user --json)", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);
    vi.mocked(renderUserProfileMarkdown).mockReturnValue("# User Profile: Test User");

    const code = await handleProfileRender(baseArgs({ subcommand: "render", user: true, json: true }));
    expect(code).toBe(0);

    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output) as { markdown: string; type: string };
    expect(parsed.markdown).toBe("# User Profile: Test User");
    expect(parsed.type).toBe("user");
  });

  it("returns 1 when user profile does not exist (--user)", async () => {
    vi.mocked(readUserProfile).mockReturnValue(null);
    vi.mocked(getUserProfileDir).mockReturnValue("/mock/.a5c");

    const code = await handleProfileRender(baseArgs({ subcommand: "render", user: true }));
    expect(code).toBe(1);
    const msg = consoleSpy.error.mock.calls[0]?.[0] as string;
    expect(msg).toContain("No user profile found");
    expect(msg).toContain("/mock/.a5c");
  });

  it("renders project profile markdown (--project)", async () => {
    vi.mocked(readProjectProfile).mockReturnValue(MOCK_PROJECT_PROFILE);
    vi.mocked(renderProjectProfileMarkdown).mockReturnValue("# Project Profile: test-project");

    const code = await handleProfileRender(baseArgs({ subcommand: "render", project: true }));
    expect(code).toBe(0);
    expect(renderProjectProfileMarkdown).toHaveBeenCalledWith(MOCK_PROJECT_PROFILE);
    expect(consoleSpy.log).toHaveBeenCalledWith("# Project Profile: test-project");
  });

  it("renders project profile markdown as JSON (--project --json)", async () => {
    vi.mocked(readProjectProfile).mockReturnValue(MOCK_PROJECT_PROFILE);
    vi.mocked(renderProjectProfileMarkdown).mockReturnValue("# Project Profile: test-project");

    const code = await handleProfileRender(
      baseArgs({ subcommand: "render", project: true, json: true }),
    );
    expect(code).toBe(0);

    const output = consoleSpy.log.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(output) as { markdown: string; type: string };
    expect(parsed.markdown).toBe("# Project Profile: test-project");
    expect(parsed.type).toBe("project");
  });

  it("returns 1 when project profile does not exist (--project)", async () => {
    vi.mocked(readProjectProfile).mockReturnValue(null);
    vi.mocked(getProjectProfileDir).mockReturnValue("/mock/project/.a5c");

    const code = await handleProfileRender(baseArgs({ subcommand: "render", project: true }));
    expect(code).toBe(1);
    const msg = consoleSpy.error.mock.calls[0]?.[0] as string;
    expect(msg).toContain("No project profile found");
    expect(msg).toContain("/mock/project/.a5c");
  });

  it("passes --dir to readUserProfile when rendering", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);
    vi.mocked(renderUserProfileMarkdown).mockReturnValue("markdown");

    const code = await handleProfileRender(
      baseArgs({ subcommand: "render", user: true, dir: "/custom/dir" }),
    );
    expect(code).toBe(0);
    expect(readUserProfile).toHaveBeenCalledWith("/custom/dir");
  });
});

// =========================================================================
// 5. handleProfileCommand (router)
// =========================================================================

describe("handleProfileCommand", () => {
  it("routes 'read' to handleProfileRead", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);

    const args = baseArgs({ subcommand: "read", user: true, json: true });
    const code = await handleProfileCommand("read", args);
    expect(code).toBe(0);
    expect(readUserProfile).toHaveBeenCalled();
  });

  it("routes 'write' to handleProfileWrite", async () => {
    // No input path => returns 1
    const args = baseArgs({ subcommand: "write", user: true });
    const code = await handleProfileCommand("write", args);
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile:write] --input <file> is required",
    );
  });

  it("routes 'merge' to handleProfileMerge", async () => {
    // No input path => returns 1
    const args = baseArgs({ subcommand: "merge", user: true });
    const code = await handleProfileCommand("merge", args);
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile:merge] --input <file> is required",
    );
  });

  it("routes 'render' to handleProfileRender", async () => {
    vi.mocked(readUserProfile).mockReturnValue(MOCK_USER_PROFILE);
    vi.mocked(renderUserProfileMarkdown).mockReturnValue("# User Profile");

    const args = baseArgs({ subcommand: "render", user: true });
    const code = await handleProfileCommand("render", args);
    expect(code).toBe(0);
    expect(renderUserProfileMarkdown).toHaveBeenCalledWith(MOCK_USER_PROFILE);
  });

  it("returns 1 for unknown subcommand", async () => {
    const args = baseArgs();
    const code = await handleProfileCommand("unknown-cmd", args);
    expect(code).toBe(1);
    expect(consoleSpy.error).toHaveBeenCalledWith(
      "[profile] Unknown subcommand: unknown-cmd. Use read, write, merge, or render.",
    );
  });
});
