import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import {
  getUserProfileDir,
  readUserProfile,
  writeUserProfile,
  mergeUserProfile,
  createDefaultUserProfile,
  renderUserProfileMarkdown,
} from "../userProfile";
import type { UserProfile } from "../types";
import {
  USER_PROFILE_FILENAME,
  USER_PROFILE_MD_FILENAME,
} from "../types";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "babysitter-profile-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/**
 * Builds a minimal valid UserProfile for testing purposes.
 * Callers can override any field via the `overrides` parameter.
 */
function buildProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: "Test User",
    specialties: [],
    expertiseLevels: {},
    goals: [],
    preferences: {
      verbosity: "normal",
      autonomyLevel: "semi-autonomous",
      riskTolerance: "moderate",
    },
    toolPreferences: {},
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
    experience: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 1,
    ...overrides,
  };
}

// ─── getUserProfileDir ────────────────────────────────────────────────

describe("getUserProfileDir", () => {
  it("returns ~/.a5c", () => {
    const result = getUserProfileDir();
    expect(result).toBe(path.join(os.homedir(), ".a5c"));
  });
});

// ─── readUserProfile ──────────────────────────────────────────────────

describe("readUserProfile", () => {
  it("returns null when no file exists", () => {
    const result = readUserProfile(tmpDir);
    expect(result).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    fs.writeFileSync(
      path.join(tmpDir, USER_PROFILE_FILENAME),
      "{ not valid json !!!",
      "utf8",
    );
    const result = readUserProfile(tmpDir);
    expect(result).toBeNull();
  });

  it("returns null when directory does not exist", () => {
    const noSuchDir = path.join(tmpDir, "nonexistent", "deeply", "nested");
    const result = readUserProfile(noSuchDir);
    expect(result).toBeNull();
  });
});

// ─── writeUserProfile + readUserProfile round-trip ────────────────────

describe("writeUserProfile / readUserProfile round-trip", () => {
  it("persists and retrieves a profile", () => {
    const profile = buildProfile({ name: "Round Trip" });
    writeUserProfile(profile, tmpDir);
    const loaded = readUserProfile(tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("Round Trip");
    expect(loaded!.version).toBe(1);
    expect(loaded!.preferences.verbosity).toBe("normal");
  });

  it("round-trips a profile with all optional fields populated", () => {
    const profile = buildProfile({
      name: "Full Profile",
      specialties: [
        { domain: "backend", subdomains: ["api", "databases"], yearsActive: 8 },
      ],
      expertiseLevels: {
        typescript: { level: "expert", confidence: 0.95 },
      },
      goals: [
        { id: "g1", description: "Ship v2", category: "delivery", priority: "high", status: "active" },
      ],
      socialProfiles: [
        { platform: "github", url: "https://github.com/test", username: "test" },
      ],
      externalIntegrations: [
        { service: "jira", category: "project-management", enabled: true },
      ],
      installedPlugins: ["plugin-a", "plugin-b"],
      installedSkills: ["skill-x"],
      installedAgents: ["agent-z"],
      experience: {
        totalYearsProfessional: 10,
        currentRole: "Staff Engineer",
        currentOrganization: "Acme",
        industries: ["fintech", "saas"],
        previousRoles: [{ title: "Senior Engineer", organization: "BigCo", duration: "3 years" }],
        education: [{ institution: "MIT", degree: "BS", field: "CS", year: 2016 }],
        certifications: ["AWS Solutions Architect"],
      },
    });

    writeUserProfile(profile, tmpDir);
    const loaded = readUserProfile(tmpDir);

    expect(loaded).not.toBeNull();
    expect(loaded!.specialties).toHaveLength(1);
    expect(loaded!.specialties[0].domain).toBe("backend");
    expect(loaded!.expertiseLevels["typescript"].level).toBe("expert");
    expect(loaded!.goals[0].id).toBe("g1");
    expect(loaded!.socialProfiles).toHaveLength(1);
    expect(loaded!.installedPlugins).toEqual(["plugin-a", "plugin-b"]);
    expect(loaded!.experience.currentRole).toBe("Staff Engineer");
    expect(loaded!.experience.education).toHaveLength(1);
  });
});

// ─── writeUserProfile directory & markdown creation ───────────────────

describe("writeUserProfile", () => {
  it("creates the directory recursively if it does not exist", () => {
    const nested = path.join(tmpDir, "deep", "nested", "dir");
    const profile = buildProfile({ name: "Nested" });
    writeUserProfile(profile, nested);

    expect(fs.existsSync(nested)).toBe(true);
    const loaded = readUserProfile(nested);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("Nested");
  });

  it("creates a companion markdown file alongside the JSON file", () => {
    const profile = buildProfile({ name: "Markdown User" });
    writeUserProfile(profile, tmpDir);

    const mdPath = path.join(tmpDir, USER_PROFILE_MD_FILENAME);
    expect(fs.existsSync(mdPath)).toBe(true);

    const mdContent = fs.readFileSync(mdPath, "utf8");
    expect(mdContent).toContain("Markdown User");
  });

  it("overwrites existing profile on subsequent write", () => {
    const profile1 = buildProfile({ name: "First" });
    writeUserProfile(profile1, tmpDir);

    const profile2 = buildProfile({ name: "Second", version: 2 });
    writeUserProfile(profile2, tmpDir);

    const loaded = readUserProfile(tmpDir);
    expect(loaded!.name).toBe("Second");
    expect(loaded!.version).toBe(2);
  });
});

// ─── mergeUserProfile ─────────────────────────────────────────────────

describe("mergeUserProfile", () => {
  it("overwrites scalar fields (name)", () => {
    const existing = buildProfile({ name: "Original" });
    const merged = mergeUserProfile(existing, { name: "Updated" });
    expect(merged.name).toBe("Updated");
  });

  it("deduplicates specialties by domain key", () => {
    const existing = buildProfile({
      specialties: [
        { domain: "backend", subdomains: ["api"], yearsActive: 5 },
        { domain: "frontend", yearsActive: 3 },
      ],
    });
    const merged = mergeUserProfile(existing, {
      specialties: [
        { domain: "backend", subdomains: ["api", "grpc"], yearsActive: 7 },
        { domain: "devops", yearsActive: 2 },
      ],
    });

    expect(merged.specialties).toHaveLength(3);

    const backendSpec = merged.specialties.find((s) => s.domain === "backend");
    expect(backendSpec).toBeDefined();
    // Update item takes precedence (spread merge)
    expect(backendSpec!.yearsActive).toBe(7);
    expect(backendSpec!.subdomains).toEqual(["api", "grpc"]);

    expect(merged.specialties.find((s) => s.domain === "frontend")).toBeDefined();
    expect(merged.specialties.find((s) => s.domain === "devops")).toBeDefined();
  });

  it("deduplicates goals by id key", () => {
    const existing = buildProfile({
      goals: [
        { id: "g1", description: "Learn Rust", category: "learning", priority: "high" },
        { id: "g2", description: "Ship v2", category: "delivery" },
      ],
    });
    const merged = mergeUserProfile(existing, {
      goals: [
        { id: "g1", description: "Learn Rust deeply", category: "learning", status: "active" },
        { id: "g3", description: "Write docs", category: "docs" },
      ],
    });

    expect(merged.goals).toHaveLength(3);

    const g1 = merged.goals.find((g) => g.id === "g1");
    expect(g1).toBeDefined();
    expect(g1!.description).toBe("Learn Rust deeply");
    expect(g1!.status).toBe("active");
    // Preserved from existing via spread merge
    expect(g1!.priority).toBe("high");

    expect(merged.goals.find((g) => g.id === "g2")).toBeDefined();
    expect(merged.goals.find((g) => g.id === "g3")).toBeDefined();
  });

  it("increments version and updates updatedAt", () => {
    const existing = buildProfile({
      version: 5,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const beforeMerge = Date.now();
    const merged = mergeUserProfile(existing, { name: "Bump" });

    expect(merged.version).toBe(6);
    const mergedTime = new Date(merged.updatedAt).getTime();
    expect(mergedTime).toBeGreaterThanOrEqual(beforeMerge);
    expect(mergedTime).toBeLessThanOrEqual(Date.now());
  });

  it("preserves fields not present in updates", () => {
    const existing = buildProfile({
      name: "Keeper",
      specialties: [{ domain: "ml", yearsActive: 4 }],
      goals: [{ id: "g1", description: "Stay", category: "retention" }],
      preferences: { verbosity: "verbose", autonomyLevel: "autonomous", riskTolerance: "aggressive" },
    });
    const merged = mergeUserProfile(existing, { name: "Changed Only Name" });

    expect(merged.name).toBe("Changed Only Name");
    // Untouched fields remain
    expect(merged.specialties).toHaveLength(1);
    expect(merged.specialties[0].domain).toBe("ml");
    expect(merged.goals).toHaveLength(1);
    expect(merged.goals[0].id).toBe("g1");
    expect(merged.preferences.verbosity).toBe("verbose");
    expect(merged.preferences.autonomyLevel).toBe("autonomous");
  });

  it("deep merges expertiseLevels", () => {
    const existing = buildProfile({
      expertiseLevels: {
        typescript: { level: "intermediate", confidence: 0.7 },
        python: { level: "advanced", confidence: 0.85 },
      },
    });
    const merged = mergeUserProfile(existing, {
      expertiseLevels: {
        typescript: { level: "expert", confidence: 0.95 },
        go: { level: "beginner" },
      },
    });

    // Existing key updated via spread
    expect(merged.expertiseLevels["typescript"].level).toBe("expert");
    expect(merged.expertiseLevels["typescript"].confidence).toBe(0.95);

    // Existing key not in updates preserved
    expect(merged.expertiseLevels["python"].level).toBe("advanced");
    expect(merged.expertiseLevels["python"].confidence).toBe(0.85);

    // New key added
    expect(merged.expertiseLevels["go"].level).toBe("beginner");
  });

  it("deduplicates primitive arrays (installedPlugins)", () => {
    const existing = buildProfile({
      installedPlugins: ["plugin-a", "plugin-b"],
    });
    const merged = mergeUserProfile(existing, {
      installedPlugins: ["plugin-b", "plugin-c"],
    });

    expect(merged.installedPlugins).toEqual(["plugin-a", "plugin-b", "plugin-c"]);
  });

  it("deduplicates installedSkills", () => {
    const existing = buildProfile({
      installedSkills: ["skill-x"],
    });
    const merged = mergeUserProfile(existing, {
      installedSkills: ["skill-x", "skill-y"],
    });

    expect(merged.installedSkills).toEqual(["skill-x", "skill-y"]);
  });

  it("deduplicates installedAgents", () => {
    const existing = buildProfile({
      installedAgents: ["agent-1"],
    });
    const merged = mergeUserProfile(existing, {
      installedAgents: ["agent-1", "agent-2"],
    });

    expect(merged.installedAgents).toEqual(["agent-1", "agent-2"]);
  });

  it("does not mutate the original profile", () => {
    const existing = buildProfile({ name: "Immutable", version: 3 });
    const merged = mergeUserProfile(existing, { name: "Mutated?" });

    expect(existing.name).toBe("Immutable");
    expect(existing.version).toBe(3);
    expect(merged.name).toBe("Mutated?");
    expect(merged.version).toBe(4);
  });

  it("merges preferences with shallow spread", () => {
    const existing = buildProfile({
      preferences: {
        verbosity: "concise",
        autonomyLevel: "supervised",
        riskTolerance: "conservative",
        learningStyle: "hands-on",
      },
    });
    const merged = mergeUserProfile(existing, {
      preferences: {
        verbosity: "verbose",
        riskTolerance: "aggressive",
      },
    });

    expect(merged.preferences.verbosity).toBe("verbose");
    expect(merged.preferences.riskTolerance).toBe("aggressive");
    // Preserved from existing
    expect(merged.preferences.autonomyLevel).toBe("supervised");
    expect(merged.preferences.learningStyle).toBe("hands-on");
  });

  it("merges breakpointTolerance with perCategory and alwaysBreakOn dedup", () => {
    const existing = buildProfile({
      breakpointTolerance: {
        global: "moderate",
        perCategory: { security: "maximum" },
        alwaysBreakOn: ["delete-data"],
      },
    });
    const merged = mergeUserProfile(existing, {
      breakpointTolerance: {
        global: "low",
        perCategory: { deployment: "high" },
        alwaysBreakOn: ["delete-data", "force-push"],
      },
    });

    expect(merged.breakpointTolerance.global).toBe("low");
    // Both categories present
    expect(merged.breakpointTolerance.perCategory).toEqual({
      security: "maximum",
      deployment: "high",
    });
    // Deduplicated
    expect(merged.breakpointTolerance.alwaysBreakOn).toEqual([
      "delete-data",
      "force-push",
    ]);
  });

  it("merges communicationStyle with shallow spread", () => {
    const existing = buildProfile({
      communicationStyle: {
        tone: "professional",
        useEmojis: false,
        explanationDepth: "standard",
        preferredResponseFormat: "markdown",
      },
    });
    const merged = mergeUserProfile(existing, {
      communicationStyle: {
        tone: "casual",
        language: "en",
      },
    });

    expect(merged.communicationStyle.tone).toBe("casual");
    expect(merged.communicationStyle.language).toBe("en");
    // Preserved
    expect(merged.communicationStyle.useEmojis).toBe(false);
    expect(merged.communicationStyle.explanationDepth).toBe("standard");
  });

  it("merges toolPreferences with language and packageManager dedup", () => {
    const existing = buildProfile({
      toolPreferences: {
        editor: "vscode",
        languages: ["typescript", "python"],
        packageManagers: ["npm"],
      },
    });
    const merged = mergeUserProfile(existing, {
      toolPreferences: {
        editor: "neovim",
        languages: ["python", "go"],
        packageManagers: ["npm", "pnpm"],
      },
    });

    expect(merged.toolPreferences.editor).toBe("neovim");
    expect(merged.toolPreferences.languages).toEqual(["typescript", "python", "go"]);
    expect(merged.toolPreferences.packageManagers).toEqual(["npm", "pnpm"]);
  });

  it("merges socialProfiles by platform key", () => {
    const existing = buildProfile({
      socialProfiles: [
        { platform: "github", url: "https://github.com/old", username: "old" },
      ],
    });
    const merged = mergeUserProfile(existing, {
      socialProfiles: [
        { platform: "github", url: "https://github.com/new", username: "new" },
        { platform: "linkedin", url: "https://linkedin.com/in/test" },
      ],
    });

    expect(merged.socialProfiles).toHaveLength(2);
    const gh = merged.socialProfiles!.find((s) => s.platform === "github");
    expect(gh!.url).toBe("https://github.com/new");
    expect(gh!.username).toBe("new");
    expect(merged.socialProfiles!.find((s) => s.platform === "linkedin")).toBeDefined();
  });

  it("merges externalIntegrations by service key", () => {
    const existing = buildProfile({
      externalIntegrations: [
        { service: "jira", category: "pm", enabled: true },
      ],
    });
    const merged = mergeUserProfile(existing, {
      externalIntegrations: [
        { service: "jira", category: "pm", enabled: false },
        { service: "slack", category: "communication", enabled: true },
      ],
    });

    expect(merged.externalIntegrations).toHaveLength(2);
    const jira = merged.externalIntegrations!.find((i) => i.service === "jira");
    expect(jira!.enabled).toBe(false);
    expect(merged.externalIntegrations!.find((i) => i.service === "slack")).toBeDefined();
  });

  it("merges experience with industries dedup and previousRoles by title", () => {
    const existing = buildProfile({
      experience: {
        totalYearsProfessional: 8,
        currentRole: "Engineer",
        industries: ["fintech", "saas"],
        previousRoles: [
          { title: "Junior Dev", organization: "StartupCo", duration: "2 years" },
        ],
        certifications: ["AWS SA"],
      },
    });
    const merged = mergeUserProfile(existing, {
      experience: {
        totalYearsProfessional: 10,
        industries: ["saas", "healthcare"],
        previousRoles: [
          { title: "Junior Dev", organization: "StartupCo", duration: "2.5 years" },
          { title: "Senior Dev", organization: "BigCo" },
        ],
        certifications: ["AWS SA", "GCP Pro"],
      },
    });

    expect(merged.experience.totalYearsProfessional).toBe(10);
    expect(merged.experience.currentRole).toBe("Engineer");
    expect(merged.experience.industries).toEqual(["fintech", "saas", "healthcare"]);
    expect(merged.experience.previousRoles).toHaveLength(2);
    const juniorRole = merged.experience.previousRoles!.find(
      (r) => r.title === "Junior Dev",
    );
    expect(juniorRole!.duration).toBe("2.5 years");
    expect(merged.experience.certifications).toEqual(["AWS SA", "GCP Pro"]);
  });
});

// ─── createDefaultUserProfile ─────────────────────────────────────────

describe("createDefaultUserProfile", () => {
  it("returns a profile with the given name", () => {
    const profile = createDefaultUserProfile("Alice");
    expect(profile.name).toBe("Alice");
  });

  it("returns correct default values", () => {
    const profile = createDefaultUserProfile("Bob");

    expect(profile.specialties).toEqual([]);
    expect(profile.expertiseLevels).toEqual({});
    expect(profile.goals).toEqual([]);
    expect(profile.preferences.verbosity).toBe("normal");
    expect(profile.preferences.autonomyLevel).toBe("semi-autonomous");
    expect(profile.preferences.riskTolerance).toBe("moderate");
    expect(profile.toolPreferences).toEqual({});
    expect(profile.breakpointTolerance.global).toBe("moderate");
    expect(profile.breakpointTolerance.skipBreakpointsForKnownPatterns).toBe(false);
    expect(profile.breakpointTolerance.alwaysBreakOn).toEqual([]);
    expect(profile.communicationStyle.tone).toBe("professional");
    expect(profile.communicationStyle.useEmojis).toBe(false);
    expect(profile.communicationStyle.explanationDepth).toBe("standard");
    expect(profile.communicationStyle.preferredResponseFormat).toBe("markdown");
    expect(profile.experience).toEqual({});
    expect(profile.version).toBe(1);
  });

  it("sets createdAt and updatedAt to the same ISO timestamp", () => {
    const before = Date.now();
    const profile = createDefaultUserProfile("Charlie");
    const after = Date.now();

    expect(profile.createdAt).toBe(profile.updatedAt);

    const ts = new Date(profile.createdAt).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("does not include optional fields by default", () => {
    const profile = createDefaultUserProfile("DefaultUser");
    expect(profile.socialProfiles).toBeUndefined();
    expect(profile.externalIntegrations).toBeUndefined();
    expect(profile.installedPlugins).toBeUndefined();
    expect(profile.installedSkills).toBeUndefined();
    expect(profile.installedAgents).toBeUndefined();
  });
});

// ─── renderUserProfileMarkdown ────────────────────────────────────────

describe("renderUserProfileMarkdown", () => {
  it("includes the user name in the heading", () => {
    const profile = buildProfile({ name: "Markdown Test" });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("# User Profile: Markdown Test");
  });

  it("includes the version and updatedAt in the header", () => {
    const profile = buildProfile({
      version: 42,
      updatedAt: "2026-02-15T12:00:00.000Z",
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("Version: 42");
    expect(md).toContain("2026-02-15T12:00:00.000Z");
  });

  it("renders Specialties section when specialties are present", () => {
    const profile = buildProfile({
      specialties: [
        { domain: "backend", subdomains: ["api", "grpc"], yearsActive: 8 },
        { domain: "frontend" },
      ],
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Specialties");
    expect(md).toContain("**backend**");
    expect(md).toContain("(api, grpc)");
    expect(md).toContain("8 years");
    expect(md).toContain("**frontend**");
  });

  it("omits Specialties section when empty", () => {
    const profile = buildProfile({ specialties: [] });
    const md = renderUserProfileMarkdown(profile);
    expect(md).not.toContain("## Specialties");
  });

  it("renders Expertise Levels table", () => {
    const profile = buildProfile({
      expertiseLevels: {
        typescript: { level: "expert", confidence: 0.95 },
        python: { level: "advanced" },
      },
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Expertise Levels");
    expect(md).toContain("| typescript | expert | 95% |");
    expect(md).toContain("| python | advanced | - |");
  });

  it("renders Goals section", () => {
    const profile = buildProfile({
      goals: [
        { id: "g1", description: "Learn Rust", category: "learning", priority: "high", status: "active" },
      ],
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Goals");
    expect(md).toContain("**learning**");
    expect(md).toContain("[high]");
    expect(md).toContain("Learn Rust");
    expect(md).toContain("(active)");
  });

  it("renders Preferences section", () => {
    const profile = buildProfile({
      preferences: {
        verbosity: "verbose",
        autonomyLevel: "autonomous",
        riskTolerance: "aggressive",
        learningStyle: "hands-on",
        workingHours: { start: "09:00", end: "17:00", timezone: "America/New_York" },
      },
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Preferences");
    expect(md).toContain("Verbosity: verbose");
    expect(md).toContain("Autonomy: autonomous");
    expect(md).toContain("Risk tolerance: aggressive");
    expect(md).toContain("Learning style: hands-on");
    expect(md).toContain("Working hours: 09:00-17:00 America/New_York");
  });

  it("renders Tool Preferences section", () => {
    const profile = buildProfile({
      toolPreferences: {
        editor: "vscode",
        languages: ["typescript", "go"],
      },
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Tool Preferences");
    expect(md).toContain("editor: vscode");
    expect(md).toContain("languages: typescript, go");
  });

  it("renders Breakpoint Tolerance section", () => {
    const profile = buildProfile({
      breakpointTolerance: {
        global: "high",
        skipBreakpointsForKnownPatterns: true,
        alwaysBreakOn: ["delete-data", "force-push"],
        perCategory: { security: "maximum" },
      },
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Breakpoint Tolerance");
    expect(md).toContain("Global: **high**");
    expect(md).toContain("Skip known patterns: yes");
    expect(md).toContain("Always break on: delete-data, force-push");
    expect(md).toContain("security: maximum");
  });

  it("renders Communication Style section", () => {
    const profile = buildProfile({
      communicationStyle: {
        tone: "casual",
        language: "en",
        useEmojis: true,
        explanationDepth: "detailed",
        preferredResponseFormat: "plain",
      },
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Communication Style");
    expect(md).toContain("Tone: casual");
    expect(md).toContain("Language: en");
    expect(md).toContain("Emojis: yes");
    expect(md).toContain("Explanation depth: detailed");
    expect(md).toContain("Response format: plain");
  });

  it("renders Experience section when populated", () => {
    const profile = buildProfile({
      experience: {
        totalYearsProfessional: 12,
        currentRole: "Staff Engineer",
        currentOrganization: "Acme Corp",
        industries: ["fintech", "saas"],
        previousRoles: [
          { title: "Senior Engineer", organization: "BigCo", duration: "3 years" },
        ],
        education: [
          { institution: "MIT", degree: "BS", field: "CS", year: 2014 },
        ],
        certifications: ["AWS SA", "GCP Pro"],
      },
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Experience");
    expect(md).toContain("Total years: 12");
    expect(md).toContain("Current role: Staff Engineer");
    expect(md).toContain("Organization: Acme Corp");
    expect(md).toContain("Industries: fintech, saas");
    expect(md).toContain("Senior Engineer at BigCo (3 years)");
    expect(md).toContain("BS in CS from MIT (2014)");
    expect(md).toContain("Certifications: AWS SA, GCP Pro");
  });

  it("omits Experience section when empty", () => {
    const profile = buildProfile({ experience: {} });
    const md = renderUserProfileMarkdown(profile);
    expect(md).not.toContain("## Experience");
  });

  it("renders Social Profiles section", () => {
    const profile = buildProfile({
      socialProfiles: [
        { platform: "github", url: "https://github.com/alice", username: "alice" },
        { platform: "linkedin", url: "https://linkedin.com/in/alice" },
      ],
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Social Profiles");
    expect(md).toContain("[github](https://github.com/alice) (@alice)");
    expect(md).toContain("[linkedin](https://linkedin.com/in/alice)");
  });

  it("renders Installed Extensions section", () => {
    const profile = buildProfile({
      installedPlugins: ["plugin-a", "plugin-b"],
      installedSkills: ["skill-x"],
      installedAgents: ["agent-z"],
    });
    const md = renderUserProfileMarkdown(profile);
    expect(md).toContain("## Installed Extensions");
    expect(md).toContain("Plugins: plugin-a, plugin-b");
    expect(md).toContain("Skills: skill-x");
    expect(md).toContain("Agents: agent-z");
  });

  it("omits Installed Extensions section when no extensions are installed", () => {
    const profile = buildProfile();
    const md = renderUserProfileMarkdown(profile);
    expect(md).not.toContain("## Installed Extensions");
  });

  it("produces valid markdown for a fully populated profile", () => {
    const profile = buildProfile({
      name: "Full User",
      specialties: [{ domain: "ml", yearsActive: 5 }],
      expertiseLevels: { tensorflow: { level: "advanced", confidence: 0.9 } },
      goals: [{ id: "g1", description: "Publish paper", category: "research" }],
      socialProfiles: [{ platform: "github", url: "https://github.com/full" }],
      installedPlugins: ["p1"],
      experience: { currentRole: "Researcher", totalYearsProfessional: 7 },
    });
    const md = renderUserProfileMarkdown(profile);

    // Ensure all expected sections appear
    const expectedSections = [
      "# User Profile: Full User",
      "## Specialties",
      "## Expertise Levels",
      "## Goals",
      "## Preferences",
      "## Breakpoint Tolerance",
      "## Communication Style",
      "## Experience",
      "## Social Profiles",
      "## Installed Extensions",
    ];
    for (const section of expectedSections) {
      expect(md).toContain(section);
    }
  });
});
