import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import * as fsSync from "fs";

import {
  getProjectProfileDir,
  readProjectProfile,
  writeProjectProfile,
  mergeProjectProfile,
  createDefaultProjectProfile,
  renderProjectProfileMarkdown,
} from "../projectProfile";
import type { ProjectProfile } from "../types";
import {
  PROJECT_PROFILE_FILENAME,
  PROJECT_PROFILE_MD_FILENAME,
} from "../types";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-profile-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

// ─── Helper ──────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<ProjectProfile> = {}): ProjectProfile {
  return {
    projectName: "test-project",
    description: "A test project",
    goals: [],
    techStack: {},
    architecture: {},
    workflows: [],
    tools: {},
    conventions: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 1,
    ...overrides,
  };
}

// ─── getProjectProfileDir ────────────────────────────────────────────

describe("getProjectProfileDir", () => {
  it("returns {root}/.a5c for a given project root", () => {
    const dir = getProjectProfileDir(tmpRoot);
    expect(dir).toBe(path.join(tmpRoot, ".a5c"));
  });

  it("defaults to cwd when no argument is given", () => {
    const dir = getProjectProfileDir();
    expect(dir).toBe(path.join(process.cwd(), ".a5c"));
  });
});

// ─── readProjectProfile ─────────────────────────────────────────────

describe("readProjectProfile", () => {
  it("returns null when no profile file exists", () => {
    const result = readProjectProfile(tmpRoot);
    expect(result).toBeNull();
  });

  it("returns null when the file contains invalid JSON", async () => {
    const dir = path.join(tmpRoot, ".a5c");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, PROJECT_PROFILE_FILENAME), "not-json{{{", "utf8");

    const result = readProjectProfile(tmpRoot);
    expect(result).toBeNull();
  });

  it("reads a previously written profile", () => {
    const profile = makeProfile({ projectName: "roundtrip-test" });
    writeProjectProfile(profile, tmpRoot);

    const result = readProjectProfile(tmpRoot);
    expect(result).not.toBeNull();
    expect(result!.projectName).toBe("roundtrip-test");
  });
});

// ─── writeProjectProfile ────────────────────────────────────────────

describe("writeProjectProfile", () => {
  it("creates the .a5c directory recursively", () => {
    const nested = path.join(tmpRoot, "deep", "nested");
    const profile = makeProfile();

    // The nested parent does not exist yet
    writeProjectProfile(profile, nested);

    const dir = path.join(nested, ".a5c");
    expect(fsSync.existsSync(dir)).toBe(true);
  });

  it("writes both JSON and markdown files", () => {
    const profile = makeProfile({ projectName: "dual-write" });
    writeProjectProfile(profile, tmpRoot);

    const dir = path.join(tmpRoot, ".a5c");
    expect(fsSync.existsSync(path.join(dir, PROJECT_PROFILE_FILENAME))).toBe(true);
    expect(fsSync.existsSync(path.join(dir, PROJECT_PROFILE_MD_FILENAME))).toBe(true);
  });

  it("round-trips JSON faithfully", () => {
    const profile = makeProfile({
      projectName: "round-trip",
      goals: [{ id: "g1", description: "Ship v1", category: "delivery" }],
      techStack: {
        languages: [{ name: "TypeScript", version: "5.4" }],
      },
      version: 42,
    });

    writeProjectProfile(profile, tmpRoot);
    const read = readProjectProfile(tmpRoot);

    expect(read).toEqual(profile);
  });

  it("produces valid markdown that includes the project name", () => {
    const profile = makeProfile({ projectName: "md-check" });
    writeProjectProfile(profile, tmpRoot);

    const mdPath = path.join(tmpRoot, ".a5c", PROJECT_PROFILE_MD_FILENAME);
    const md = fsSync.readFileSync(mdPath, "utf8");
    expect(md).toContain("# Project Profile: md-check");
  });
});

// ─── mergeProjectProfile ────────────────────────────────────────────

describe("mergeProjectProfile", () => {
  it("overwrites scalar fields (projectName, description)", () => {
    const existing = makeProfile({ projectName: "old", description: "old desc" });
    const merged = mergeProjectProfile(existing, {
      projectName: "new",
      description: "new desc",
    });

    expect(merged.projectName).toBe("new");
    expect(merged.description).toBe("new desc");
  });

  it("increments version by 1", () => {
    const existing = makeProfile({ version: 5 });
    const merged = mergeProjectProfile(existing, {});

    expect(merged.version).toBe(6);
  });

  it("updates updatedAt to a recent timestamp", () => {
    const existing = makeProfile({ updatedAt: "2020-01-01T00:00:00.000Z" });
    const before = new Date().toISOString();
    const merged = mergeProjectProfile(existing, {});
    const after = new Date().toISOString();

    expect(merged.updatedAt >= before).toBe(true);
    expect(merged.updatedAt <= after).toBe(true);
  });

  it("preserves fields not present in updates", () => {
    const existing = makeProfile({
      projectName: "keep-me",
      description: "keep-desc",
      goals: [{ id: "g1", description: "Goal 1", category: "delivery" }],
    });

    const merged = mergeProjectProfile(existing, { description: "changed" });

    expect(merged.projectName).toBe("keep-me");
    expect(merged.goals).toEqual(existing.goals);
  });

  // ── Array deduplication by key ──────────────────────────────────

  it("deduplicates goals by id", () => {
    const existing = makeProfile({
      goals: [
        { id: "g1", description: "Old goal", category: "delivery" },
        { id: "g2", description: "Kept goal", category: "quality" },
      ],
    });
    const merged = mergeProjectProfile(existing, {
      goals: [
        { id: "g1", description: "Updated goal", category: "delivery" },
        { id: "g3", description: "New goal", category: "perf" },
      ],
    });

    expect(merged.goals).toHaveLength(3);
    const g1 = merged.goals.find((g) => g.id === "g1");
    expect(g1!.description).toBe("Updated goal");
    expect(merged.goals.find((g) => g.id === "g2")).toBeDefined();
    expect(merged.goals.find((g) => g.id === "g3")).toBeDefined();
  });

  it("deduplicates team members by name", () => {
    const existing = makeProfile({
      team: [
        { name: "Alice", role: "dev" },
        { name: "Bob", role: "qa" },
      ],
    });
    const merged = mergeProjectProfile(existing, {
      team: [
        { name: "Alice", role: "lead" },
        { name: "Carol", role: "design" },
      ],
    });

    expect(merged.team).toHaveLength(3);
    const alice = merged.team!.find((m) => m.name === "Alice");
    expect(alice!.role).toBe("lead");
    expect(merged.team!.find((m) => m.name === "Carol")).toBeDefined();
  });

  it("deduplicates workflows by name", () => {
    const existing = makeProfile({
      workflows: [
        { name: "deploy", description: "old deploy" },
        { name: "review", description: "code review" },
      ],
    });
    const merged = mergeProjectProfile(existing, {
      workflows: [
        { name: "deploy", description: "new deploy", steps: ["step1"] },
        { name: "build", description: "build flow" },
      ],
    });

    expect(merged.workflows).toHaveLength(3);
    const deploy = merged.workflows.find((w) => w.name === "deploy");
    expect(deploy!.description).toBe("new deploy");
    expect(deploy!.steps).toEqual(["step1"]);
  });

  // ── Deep merge: techStack ────────────────────────────────────────

  it("deep merges techStack languages", () => {
    const existing = makeProfile({
      techStack: {
        languages: [
          { name: "TypeScript", version: "5.3" },
          { name: "Python", version: "3.11" },
        ],
        buildTools: ["webpack"],
      },
    });
    const merged = mergeProjectProfile(existing, {
      techStack: {
        languages: [
          { name: "TypeScript", version: "5.5" },
          { name: "Rust", version: "1.77" },
        ],
      },
    });

    expect(merged.techStack.languages).toHaveLength(3);
    const ts = merged.techStack.languages!.find((l) => l.name === "TypeScript");
    expect(ts!.version).toBe("5.5");
    expect(merged.techStack.languages!.find((l) => l.name === "Python")).toBeDefined();
    expect(merged.techStack.languages!.find((l) => l.name === "Rust")).toBeDefined();
    // Existing buildTools should be preserved when not in updates
    expect(merged.techStack.buildTools).toEqual(["webpack"]);
  });

  it("deep merges techStack frameworks", () => {
    const existing = makeProfile({
      techStack: {
        frameworks: [{ name: "React", version: "18" }],
      },
    });
    const merged = mergeProjectProfile(existing, {
      techStack: {
        frameworks: [
          { name: "React", version: "19" },
          { name: "Next.js", version: "16" },
        ],
      },
    });

    expect(merged.techStack.frameworks).toHaveLength(2);
    const react = merged.techStack.frameworks!.find((f) => f.name === "React");
    expect(react!.version).toBe("19");
  });

  it("deep merges techStack databases", () => {
    const existing = makeProfile({
      techStack: {
        databases: [{ name: "PostgreSQL", type: "relational" }],
      },
    });
    const merged = mergeProjectProfile(existing, {
      techStack: {
        databases: [{ name: "Redis", type: "key-value" }],
      },
    });

    expect(merged.techStack.databases).toHaveLength(2);
  });

  it("deduplicates techStack buildTools as primitives", () => {
    const existing = makeProfile({
      techStack: { buildTools: ["webpack", "esbuild"] },
    });
    const merged = mergeProjectProfile(existing, {
      techStack: { buildTools: ["esbuild", "vite"] },
    });

    expect(merged.techStack.buildTools).toEqual(["webpack", "esbuild", "vite"]);
  });

  it("deduplicates techStack packageManagers as primitives", () => {
    const existing = makeProfile({
      techStack: { packageManagers: ["npm", "yarn"] },
    });
    const merged = mergeProjectProfile(existing, {
      techStack: { packageManagers: ["yarn", "pnpm"] },
    });

    expect(merged.techStack.packageManagers).toEqual(["npm", "yarn", "pnpm"]);
  });

  // ── Primitive array deduplication ─────────────────────────────────

  it("deduplicates installedSkills as primitive array", () => {
    const existing = makeProfile({
      installedSkills: ["skill-a", "skill-b"],
    });
    const merged = mergeProjectProfile(existing, {
      installedSkills: ["skill-b", "skill-c"],
    });

    expect(merged.installedSkills).toEqual(["skill-a", "skill-b", "skill-c"]);
  });

  it("deduplicates installedAgents as primitive array", () => {
    const existing = makeProfile({
      installedAgents: ["agent-x"],
    });
    const merged = mergeProjectProfile(existing, {
      installedAgents: ["agent-x", "agent-y"],
    });

    expect(merged.installedAgents).toEqual(["agent-x", "agent-y"]);
  });

  it("deduplicates installedProcesses as primitive array", () => {
    const existing = makeProfile({
      installedProcesses: ["proc-1"],
    });
    const merged = mergeProjectProfile(existing, {
      installedProcesses: ["proc-1", "proc-2"],
    });

    expect(merged.installedProcesses).toEqual(["proc-1", "proc-2"]);
  });

  it("deduplicates claudeMdInstructions as primitive array", () => {
    const existing = makeProfile({
      claudeMdInstructions: ["rule-a", "rule-b"],
    });
    const merged = mergeProjectProfile(existing, {
      claudeMdInstructions: ["rule-b", "rule-c"],
    });

    expect(merged.claudeMdInstructions).toEqual(["rule-a", "rule-b", "rule-c"]);
  });

  // ── Additional merge behaviors ────────────────────────────────────

  it("merges processes by id", () => {
    const existing = makeProfile({
      processes: [{ id: "p1", name: "Build", type: "build" }],
    });
    const merged = mergeProjectProfile(existing, {
      processes: [
        { id: "p1", name: "Build v2", type: "build" },
        { id: "p2", name: "Deploy", type: "deploy" },
      ],
    });

    expect(merged.processes).toHaveLength(2);
    const p1 = merged.processes!.find((p) => p.id === "p1");
    expect(p1!.name).toBe("Build v2");
  });

  it("merges services by name", () => {
    const existing = makeProfile({
      services: [{ name: "API", type: "rest" }],
    });
    const merged = mergeProjectProfile(existing, {
      services: [
        { name: "API", type: "graphql" },
        { name: "Queue", type: "amqp" },
      ],
    });

    expect(merged.services).toHaveLength(2);
    const api = merged.services!.find((s) => s.name === "API");
    expect(api!.type).toBe("graphql");
  });

  it("merges externalIntegrations by service", () => {
    const existing = makeProfile({
      externalIntegrations: [
        { service: "jira", category: "pm", enabled: true },
      ],
    });
    const merged = mergeProjectProfile(existing, {
      externalIntegrations: [
        { service: "jira", category: "pm", enabled: false },
        { service: "slack", category: "chat", enabled: true },
      ],
    });

    expect(merged.externalIntegrations).toHaveLength(2);
    const jira = merged.externalIntegrations!.find((e) => e.service === "jira");
    expect(jira!.enabled).toBe(false);
  });

  it("merges painPoints by id", () => {
    const existing = makeProfile({
      painPoints: [
        { id: "pp1", description: "Slow CI", severity: "high" },
      ],
    });
    const merged = mergeProjectProfile(existing, {
      painPoints: [
        { id: "pp1", description: "Slow CI (fixed)", severity: "low" },
        { id: "pp2", description: "Flaky tests", severity: "medium" },
      ],
    });

    expect(merged.painPoints).toHaveLength(2);
    expect(merged.painPoints!.find((p) => p.id === "pp1")!.severity).toBe("low");
  });

  it("merges bottlenecks by id", () => {
    const existing = makeProfile({
      bottlenecks: [
        { id: "bn1", description: "DB query", impact: "slow" },
      ],
    });
    const merged = mergeProjectProfile(existing, {
      bottlenecks: [
        { id: "bn1", description: "DB query (optimized)", impact: "fast" },
      ],
    });

    expect(merged.bottlenecks).toHaveLength(1);
    expect(merged.bottlenecks![0].impact).toBe("fast");
  });

  it("merges repositories by name", () => {
    const existing = makeProfile({
      repositories: [
        { name: "main-repo", url: "https://github.com/org/main", isPrimary: true },
      ],
    });
    const merged = mergeProjectProfile(existing, {
      repositories: [
        { name: "main-repo", url: "https://github.com/org/main-v2" },
        { name: "docs-repo", url: "https://github.com/org/docs" },
      ],
    });

    expect(merged.repositories).toHaveLength(2);
    const main = merged.repositories!.find((r) => r.name === "main-repo");
    expect(main!.url).toBe("https://github.com/org/main-v2");
  });

  it("shallow merges conventions.naming", () => {
    const existing = makeProfile({
      conventions: {
        naming: { files: "kebab-case", variables: "camelCase" },
      },
    });
    const merged = mergeProjectProfile(existing, {
      conventions: {
        naming: { files: "snake_case", components: "PascalCase" },
      },
    });

    expect(merged.conventions.naming).toEqual({
      files: "snake_case",
      variables: "camelCase",
      components: "PascalCase",
    });
  });

  it("shallow merges conventions.git", () => {
    const existing = makeProfile({
      conventions: {
        git: { branchPrefix: "feat/", commitFormat: "conventional" },
      },
    });
    const merged = mergeProjectProfile(existing, {
      conventions: {
        git: { commitFormat: "angular" },
      },
    });

    expect(merged.conventions.git).toEqual({
      branchPrefix: "feat/",
      commitFormat: "angular",
    });
  });

  it("deduplicates conventions.importOrder", () => {
    const existing = makeProfile({
      conventions: { importOrder: ["builtin", "external"] },
    });
    const merged = mergeProjectProfile(existing, {
      conventions: { importOrder: ["external", "internal"] },
    });

    expect(merged.conventions.importOrder).toEqual(["builtin", "external", "internal"]);
  });

  it("deduplicates conventions.additionalRules", () => {
    const existing = makeProfile({
      conventions: { additionalRules: ["no-any", "prefer-const"] },
    });
    const merged = mergeProjectProfile(existing, {
      conventions: { additionalRules: ["prefer-const", "strict-mode"] },
    });

    expect(merged.conventions.additionalRules).toEqual([
      "no-any",
      "prefer-const",
      "strict-mode",
    ]);
  });

  it("merges cicd provider and configPaths", () => {
    const existing = makeProfile({
      cicd: {
        provider: "github-actions",
        configPaths: [".github/workflows/ci.yml"],
      },
    });
    const merged = mergeProjectProfile(existing, {
      cicd: {
        configPaths: [".github/workflows/ci.yml", ".github/workflows/deploy.yml"],
      },
    });

    expect(merged.cicd!.provider).toBe("github-actions");
    expect(merged.cicd!.configPaths).toEqual([
      ".github/workflows/ci.yml",
      ".github/workflows/deploy.yml",
    ]);
  });

  it("merges cicd pipelines by name", () => {
    const existing = makeProfile({
      cicd: {
        pipelines: [{ name: "CI", trigger: "push" }],
      },
    });
    const merged = mergeProjectProfile(existing, {
      cicd: {
        pipelines: [
          { name: "CI", trigger: "pr", stages: ["lint", "test"] },
          { name: "Deploy", trigger: "tag" },
        ],
      },
    });

    expect(merged.cicd!.pipelines).toHaveLength(2);
    const ci = merged.cicd!.pipelines!.find((p) => p.name === "CI");
    expect(ci!.trigger).toBe("pr");
    expect(ci!.stages).toEqual(["lint", "test"]);
  });

  it("merges tools.linting by name", () => {
    const existing = makeProfile({
      tools: {
        linting: [{ name: "eslint", configPath: ".eslintrc.js" }],
      },
    });
    const merged = mergeProjectProfile(existing, {
      tools: {
        linting: [
          { name: "eslint", configPath: ".eslintrc.cjs" },
          { name: "stylelint", configPath: ".stylelintrc" },
        ],
      },
    });

    expect(merged.tools!.linting).toHaveLength(2);
    const eslint = merged.tools!.linting!.find((t) => t.name === "eslint");
    expect(eslint!.configPath).toBe(".eslintrc.cjs");
  });

  it("does not mutate the existing profile", () => {
    const existing = makeProfile({
      projectName: "immutable",
      goals: [{ id: "g1", description: "Goal 1", category: "test" }],
    });
    const originalGoals = [...existing.goals];

    mergeProjectProfile(existing, {
      goals: [{ id: "g2", description: "Goal 2", category: "test" }],
    });

    expect(existing.projectName).toBe("immutable");
    expect(existing.goals).toEqual(originalGoals);
    expect(existing.version).toBe(1);
  });
});

// ─── createDefaultProjectProfile ─────────────────────────────────────

describe("createDefaultProjectProfile", () => {
  it("returns a profile with the given project name", () => {
    const profile = createDefaultProjectProfile("my-app");
    expect(profile.projectName).toBe("my-app");
  });

  it("has an empty description", () => {
    const profile = createDefaultProjectProfile("my-app");
    expect(profile.description).toBe("");
  });

  it("starts at version 1", () => {
    const profile = createDefaultProjectProfile("my-app");
    expect(profile.version).toBe(1);
  });

  it("sets createdAt and updatedAt to the same timestamp", () => {
    const profile = createDefaultProjectProfile("my-app");
    expect(profile.createdAt).toBe(profile.updatedAt);
  });

  it("has valid ISO 8601 timestamps", () => {
    const before = new Date().toISOString();
    const profile = createDefaultProjectProfile("my-app");
    const after = new Date().toISOString();

    expect(profile.createdAt >= before).toBe(true);
    expect(profile.createdAt <= after).toBe(true);
  });

  it("has empty arrays and objects as defaults", () => {
    const profile = createDefaultProjectProfile("my-app");
    expect(profile.goals).toEqual([]);
    expect(profile.techStack).toEqual({});
    expect(profile.architecture).toEqual({});
    expect(profile.workflows).toEqual([]);
    expect(profile.tools).toEqual({});
    expect(profile.conventions).toEqual({});
  });
});

// ─── renderProjectProfileMarkdown ────────────────────────────────────

describe("renderProjectProfileMarkdown", () => {
  it("includes the project name as a heading", () => {
    const profile = makeProfile({ projectName: "My Awesome App" });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("# Project Profile: My Awesome App");
  });

  it("includes the description", () => {
    const profile = makeProfile({ description: "A full-stack web app" });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("A full-stack web app");
  });

  it("includes version and updatedAt in metadata line", () => {
    const profile = makeProfile({
      updatedAt: "2026-02-20T12:00:00.000Z",
      version: 7,
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("Version: 7");
    expect(md).toContain("2026-02-20T12:00:00.000Z");
  });

  it("renders goals section when goals exist", () => {
    const profile = makeProfile({
      goals: [
        { id: "g1", description: "Ship v1", category: "delivery", priority: "high" },
      ],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Goals");
    expect(md).toContain("Ship v1");
    expect(md).toContain("[high]");
  });

  it("omits goals section when empty", () => {
    const profile = makeProfile({ goals: [] });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).not.toContain("## Goals");
  });

  it("renders tech stack section with languages", () => {
    const profile = makeProfile({
      techStack: {
        languages: [{ name: "TypeScript", version: "5.4", role: "primary" }],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Tech Stack");
    expect(md).toContain("### Languages");
    expect(md).toContain("TypeScript");
    expect(md).toContain("v5.4");
    expect(md).toContain("(primary)");
  });

  it("renders tech stack frameworks", () => {
    const profile = makeProfile({
      techStack: {
        frameworks: [{ name: "Next.js", version: "16", category: "web" }],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("### Frameworks");
    expect(md).toContain("Next.js");
    expect(md).toContain("[web]");
  });

  it("renders tech stack databases", () => {
    const profile = makeProfile({
      techStack: {
        databases: [{ name: "PostgreSQL", type: "relational", version: "16" }],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("### Databases");
    expect(md).toContain("PostgreSQL");
    expect(md).toContain("(relational)");
  });

  it("renders tech stack infrastructure", () => {
    const profile = makeProfile({
      techStack: {
        infrastructure: [{ name: "Docker", category: "container" }],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("### Infrastructure");
    expect(md).toContain("Docker");
    expect(md).toContain("[container]");
  });

  it("renders build tools and package managers", () => {
    const profile = makeProfile({
      techStack: {
        buildTools: ["webpack", "esbuild"],
        packageManagers: ["npm", "pnpm"],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("**Build tools:** webpack, esbuild");
    expect(md).toContain("**Package managers:** npm, pnpm");
  });

  it("renders architecture section", () => {
    const profile = makeProfile({
      architecture: {
        pattern: "monorepo",
        dataFlow: "event-driven",
        modules: [
          { name: "sdk", path: "packages/sdk", description: "Core SDK" },
        ],
        entryPoints: ["src/index.ts"],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Architecture");
    expect(md).toContain("**Pattern:** monorepo");
    expect(md).toContain("**Data flow:** event-driven");
    expect(md).toContain("### Modules");
    expect(md).toContain("sdk");
    expect(md).toContain("`packages/sdk`");
    expect(md).toContain("**Entry points:**");
    expect(md).toContain("`src/index.ts`");
  });

  it("renders team section", () => {
    const profile = makeProfile({
      team: [
        { name: "Alice", role: "lead", responsibilities: ["architecture", "reviews"] },
      ],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Team");
    expect(md).toContain("**Alice**");
    expect(md).toContain("(lead)");
    expect(md).toContain("architecture, reviews");
  });

  it("renders workflows section", () => {
    const profile = makeProfile({
      workflows: [
        {
          name: "Deploy",
          description: "Deploy to production",
          triggers: ["push to main"],
          steps: ["lint", "test", "build", "deploy"],
        },
      ],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Workflows");
    expect(md).toContain("### Deploy");
    expect(md).toContain("Deploy to production");
    expect(md).toContain("push to main");
    expect(md).toContain("1. lint");
    expect(md).toContain("4. deploy");
  });

  it("renders processes section", () => {
    const profile = makeProfile({
      processes: [
        { id: "proc-1", name: "Build Pipeline", type: "build", description: "Compiles everything" },
      ],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Processes");
    expect(md).toContain("**Build Pipeline**");
    expect(md).toContain("`proc-1`");
    expect(md).toContain("build");
  });

  it("renders tools section", () => {
    const profile = makeProfile({
      tools: {
        linting: [{ name: "eslint", configPath: ".eslintrc.cjs" }],
        testing: [{ name: "vitest", configPath: "vitest.config.ts", command: "npx vitest" }],
        formatting: [{ name: "prettier", configPath: ".prettierrc" }],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Tools");
    expect(md).toContain("### Linting");
    expect(md).toContain("eslint");
    expect(md).toContain("### Testing");
    expect(md).toContain("vitest");
    expect(md).toContain("`npx vitest`");
    expect(md).toContain("### Formatting");
    expect(md).toContain("prettier");
  });

  it("renders services section", () => {
    const profile = makeProfile({
      services: [
        { name: "Auth API", type: "api", url: "https://auth.example.com" },
      ],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Services");
    expect(md).toContain("**Auth API**");
    expect(md).toContain("(api)");
    expect(md).toContain("https://auth.example.com");
  });

  it("renders CI/CD section", () => {
    const profile = makeProfile({
      cicd: {
        provider: "github-actions",
        configPaths: [".github/workflows/ci.yml"],
        pipelines: [
          { name: "CI", trigger: "push", stages: ["lint", "test", "build"] },
        ],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## CI/CD");
    expect(md).toContain("**Provider:** github-actions");
    expect(md).toContain("`.github/workflows/ci.yml`");
    expect(md).toContain("### Pipelines");
    expect(md).toContain("**CI**");
    expect(md).toContain("lint -> test -> build");
  });

  it("renders pain points section", () => {
    const profile = makeProfile({
      painPoints: [
        {
          id: "pp1",
          description: "Slow CI builds",
          severity: "high",
          category: "dx",
          suggestedRemediation: "Use caching",
        },
      ],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Pain Points");
    expect(md).toContain("**high**");
    expect(md).toContain("[dx]");
    expect(md).toContain("Slow CI builds");
    expect(md).toContain("Remediation: Use caching");
  });

  it("renders bottlenecks section", () => {
    const profile = makeProfile({
      bottlenecks: [
        {
          id: "bn1",
          description: "Database queries",
          impact: "slows page load",
          location: "user-service",
          frequency: "every request",
        },
      ],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Bottlenecks");
    expect(md).toContain("Database queries");
    expect(md).toContain("at user-service");
    expect(md).toContain("(every request)");
    expect(md).toContain("Impact: slows page load");
  });

  it("renders conventions section", () => {
    const profile = makeProfile({
      conventions: {
        naming: { files: "kebab-case", variables: "camelCase" },
        git: { branchPrefix: "feat/", commitFormat: "conventional" },
        importOrder: ["builtin", "external", "internal"],
        errorHandling: "typed errors",
        testingConventions: "colocated __tests__",
        additionalRules: ["no-any", "prefer-const"],
      },
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Conventions");
    expect(md).toContain("### Naming");
    expect(md).toContain("**files:** kebab-case");
    expect(md).toContain("### Git");
    expect(md).toContain("**branchPrefix:** feat/");
    expect(md).toContain("**Import order:** builtin > external > internal");
    expect(md).toContain("**Error handling:** typed errors");
    expect(md).toContain("**Testing:** colocated __tests__");
    expect(md).toContain("### Additional Rules");
    expect(md).toContain("- no-any");
    expect(md).toContain("- prefer-const");
  });

  it("renders repositories section", () => {
    const profile = makeProfile({
      repositories: [
        {
          name: "main",
          url: "https://github.com/org/repo",
          path: "/home/user/repo",
          isPrimary: true,
        },
      ],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Repositories");
    expect(md).toContain("**main**");
    expect(md).toContain("(primary)");
    expect(md).toContain("https://github.com/org/repo");
    expect(md).toContain("`/home/user/repo`");
  });

  it("renders CLAUDE.md instructions section", () => {
    const profile = makeProfile({
      claudeMdInstructions: ["Always use strict mode", "Prefer functional patterns"],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## CLAUDE.md Instructions");
    expect(md).toContain("- Always use strict mode");
    expect(md).toContain("- Prefer functional patterns");
  });

  it("renders installed extensions section", () => {
    const profile = makeProfile({
      installedSkills: ["babysit", "code-review"],
      installedAgents: ["code-reviewer"],
      installedProcesses: ["tdd-process"],
    });
    const md = renderProjectProfileMarkdown(profile);
    expect(md).toContain("## Installed Extensions");
    expect(md).toContain("Skills: babysit, code-review");
    expect(md).toContain("Agents: code-reviewer");
    expect(md).toContain("Processes: tdd-process");
  });

  it("omits optional sections when data is missing", () => {
    const profile = makeProfile();
    const md = renderProjectProfileMarkdown(profile);

    // The minimal profile should only have the heading and metadata
    expect(md).toContain("# Project Profile: test-project");
    expect(md).not.toContain("## Goals");
    expect(md).not.toContain("## Tech Stack");
    expect(md).not.toContain("## Architecture");
    expect(md).not.toContain("## Team");
    expect(md).not.toContain("## Workflows");
    expect(md).not.toContain("## Processes");
    expect(md).not.toContain("## Tools");
    expect(md).not.toContain("## Services");
    expect(md).not.toContain("## CI/CD");
    expect(md).not.toContain("## Pain Points");
    expect(md).not.toContain("## Bottlenecks");
    expect(md).not.toContain("## Conventions");
    expect(md).not.toContain("## Repositories");
    expect(md).not.toContain("## CLAUDE.md Instructions");
    expect(md).not.toContain("## Installed Extensions");
  });
});
