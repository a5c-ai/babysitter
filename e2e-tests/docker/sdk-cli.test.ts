import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  dockerExec,
  dockerExecSafe,
  startContainer,
  stopContainer,
} from "./helpers";
import path from "path";

/**
 * Extract the last JSON object from multi-line CLI output.
 * Handles pretty-printed JSON (with `null, 2` formatting) by
 * finding the last `{...}` block across multiple lines.
 */
function parseLastJsonObject(output: string): unknown {
  const trimmed = output.trim();
  const lastBrace = trimmed.lastIndexOf("}");
  if (lastBrace === -1) throw new SyntaxError("No JSON object found in output");
  // Walk backward to find matching opening brace
  let depth = 0;
  for (let i = lastBrace; i >= 0; i--) {
    if (trimmed[i] === "}") depth++;
    if (trimmed[i] === "{") depth--;
    if (depth === 0) {
      return JSON.parse(trimmed.slice(i, lastBrace + 1));
    }
  }
  throw new SyntaxError("Unmatched braces in output");
}

const ROOT = path.resolve(__dirname, "../..");

beforeAll(() => {
  buildImage(ROOT);
  startContainer();
}, 300_000);

afterAll(() => {
  stopContainer();
});

describe("Babysitter SDK CLI", () => {
  test("babysitter health --json returns valid JSON", () => {
    const out = dockerExec("babysitter health --json").trim();
    const json = JSON.parse(out);
    expect(json).toBeDefined();
  });

  test("session:init and session:state roundtrip", () => {
    const stateDir = "/tmp/sdk-test-state";

    const out = dockerExec(
      [
        `mkdir -p ${stateDir}`,
        `babysitter session:init --session-id sdk-rt --state-dir ${stateDir} --prompt "roundtrip test" --json`,
        `babysitter session:state --session-id sdk-rt --state-dir ${stateDir} --json`,
        `rm -rf ${stateDir}`,
      ].join(" && "),
    ).trim();

    // session:state outputs pretty-printed JSON
    const stateJson = parseLastJsonObject(out) as Record<string, unknown>;
    expect(stateJson.found).toBe(true);
    expect((stateJson.state as Record<string, unknown>).active).toBe(true);
    expect(stateJson.prompt).toBe("roundtrip test");
  });

  test("session:update increments iteration", () => {
    const stateDir = "/tmp/sdk-test-iter";

    const out = dockerExec(
      [
        `mkdir -p ${stateDir}`,
        `babysitter session:init --session-id iter-t --state-dir ${stateDir} --prompt "test" --json`,
        `babysitter session:update --session-id iter-t --state-dir ${stateDir} --iteration 5 --json`,
        `babysitter session:state --session-id iter-t --state-dir ${stateDir} --json`,
        `rm -rf ${stateDir}`,
      ].join(" && "),
    ).trim();

    const stateJson = parseLastJsonObject(out) as Record<string, unknown>;
    expect((stateJson.state as Record<string, unknown>).iteration).toBe(5);
  });

  test("session:update --delete removes session", () => {
    const stateDir = "/tmp/sdk-test-del";

    const out = dockerExec(
      [
        `mkdir -p ${stateDir}`,
        `babysitter session:init --session-id del-t --state-dir ${stateDir} --prompt "test" --json`,
        `babysitter session:update --session-id del-t --state-dir ${stateDir} --delete --json`,
        `babysitter session:state --session-id del-t --state-dir ${stateDir} --json`,
        `rm -rf ${stateDir}`,
      ].join(" && "),
    ).trim();

    const stateJson = parseLastJsonObject(out) as Record<string, unknown>;
    expect(stateJson.found).toBe(false);
  });
});

describe("Babysitter Profile CLI", () => {
  const userProfileDir = "/tmp/profile-test-user";
  const projectProfileDir = "/tmp/profile-test-project";

  const minimalUserProfile = JSON.stringify({
    name: "Test User",
    specialties: [{ domain: "testing" }],
    expertiseLevels: { testing: { level: "expert" } },
    goals: [{ id: "g1", description: "Ship tests", category: "project" }],
    preferences: { verbosity: "concise" },
    toolPreferences: { editor: "vim", shell: "bash" },
    breakpointTolerance: { global: "low" },
    communicationStyle: { tone: "professional" },
    experience: { totalYearsProfessional: 10 },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 1,
  });

  const minimalProjectProfile = JSON.stringify({
    projectName: "test-project",
    description: "A test project for e2e",
    goals: [{ id: "g1", description: "Pass e2e tests" }],
    techStack: { languages: [{ name: "TypeScript" }] },
    architecture: { pattern: "monorepo" },
    workflows: [{ name: "ci" }],
    conventions: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: 1,
  });

  // ---- profile:read (no profile exists) ----

  test("profile:read --user returns error when no profile exists", () => {
    const { stdout, exitCode } = dockerExecSafe(
      `babysitter profile:read --user --dir ${userProfileDir} --json`,
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("no_profile");
  });

  test("profile:read --project returns error when no profile exists", () => {
    const { stdout, exitCode } = dockerExecSafe(
      `babysitter profile:read --project --dir ${projectProfileDir} --json`,
    );
    expect(exitCode).toBe(1);
    const json = JSON.parse(stdout.trim());
    expect(json.error).toBe("no_profile");
  });

  test("profile:read without --user or --project returns error", () => {
    const { exitCode } = dockerExecSafe("babysitter profile:read --json");
    expect(exitCode).toBe(1);
  });

  // ---- profile:write + profile:read roundtrip ----

  test("profile:write --user then profile:read --user roundtrip", () => {
    const out = dockerExec(
      [
        `mkdir -p ${userProfileDir}`,
        `echo '${minimalUserProfile}' > /tmp/user-profile-input.json`,
        `babysitter profile:write --user --input /tmp/user-profile-input.json --dir ${userProfileDir} --json`,
        `babysitter profile:read --user --dir ${userProfileDir} --json`,
        `rm -rf ${userProfileDir} /tmp/user-profile-input.json`,
      ].join(" && "),
    ).trim();

    const profile = parseLastJsonObject(out) as Record<string, unknown>;
    expect(profile.name).toBe("Test User");
    expect(profile.version).toBe(1);
    expect(Array.isArray(profile.specialties)).toBe(true);
  });

  test("profile:write --project then profile:read --project roundtrip", () => {
    const out = dockerExec(
      [
        `mkdir -p ${projectProfileDir}`,
        `echo '${minimalProjectProfile}' > /tmp/project-profile-input.json`,
        `babysitter profile:write --project --input /tmp/project-profile-input.json --dir ${projectProfileDir} --json`,
        `babysitter profile:read --project --dir ${projectProfileDir} --json`,
        `rm -rf ${projectProfileDir} /tmp/project-profile-input.json`,
      ].join(" && "),
    ).trim();

    const profile = parseLastJsonObject(out) as Record<string, unknown>;
    expect(profile.projectName).toBe("test-project");
    expect(profile.version).toBe(1);
  });

  test("profile:write without --input returns error", () => {
    const { exitCode } = dockerExecSafe(
      `babysitter profile:write --user --dir ${userProfileDir} --json`,
    );
    expect(exitCode).toBe(1);
  });

  // ---- profile:merge ----

  test("profile:merge --user merges partial updates and increments version", () => {
    const mergeUpdate = JSON.stringify({
      name: "Updated User",
      specialties: [{ domain: "devops" }],
    });

    const out = dockerExec(
      [
        `mkdir -p ${userProfileDir}`,
        `echo '${minimalUserProfile}' > /tmp/up-base.json`,
        `babysitter profile:write --user --input /tmp/up-base.json --dir ${userProfileDir} --json`,
        `echo '${mergeUpdate}' > /tmp/up-merge.json`,
        `babysitter profile:merge --user --input /tmp/up-merge.json --dir ${userProfileDir} --json`,
        `babysitter profile:read --user --dir ${userProfileDir} --json`,
        `rm -rf ${userProfileDir} /tmp/up-base.json /tmp/up-merge.json`,
      ].join(" && "),
    ).trim();

    const profile = parseLastJsonObject(out) as Record<string, unknown>;
    expect(profile.name).toBe("Updated User");
    expect(profile.version).toBe(2);
    // Should have both original "testing" and new "devops" specialties
    const specialties = profile.specialties as Array<Record<string, unknown>>;
    const domains = specialties.map((s) => s.domain);
    expect(domains).toContain("testing");
    expect(domains).toContain("devops");
  });

  test("profile:merge --project merges and increments version", () => {
    const mergeUpdate = JSON.stringify({
      description: "Updated description",
      goals: [{ id: "g2", description: "New goal" }],
    });

    const out = dockerExec(
      [
        `mkdir -p ${projectProfileDir}`,
        `echo '${minimalProjectProfile}' > /tmp/pp-base.json`,
        `babysitter profile:write --project --input /tmp/pp-base.json --dir ${projectProfileDir} --json`,
        `echo '${mergeUpdate}' > /tmp/pp-merge.json`,
        `babysitter profile:merge --project --input /tmp/pp-merge.json --dir ${projectProfileDir} --json`,
        `babysitter profile:read --project --dir ${projectProfileDir} --json`,
        `rm -rf ${projectProfileDir} /tmp/pp-base.json /tmp/pp-merge.json`,
      ].join(" && "),
    ).trim();

    const profile = parseLastJsonObject(out) as Record<string, unknown>;
    expect(profile.description).toBe("Updated description");
    expect(profile.version).toBe(2);
    const goals = profile.goals as Array<Record<string, unknown>>;
    expect(goals.length).toBe(2);
  });

  test("profile:merge without existing profile returns error", () => {
    // Write the temp file, then run merge (which should fail), capture its exit code
    // Redirect stderr to stdout so we can verify the error message
    const { stdout, exitCode } = dockerExecSafe(
      [
        `echo '{"name":"x"}' > /tmp/merge-fail.json`,
        `babysitter profile:merge --user --input /tmp/merge-fail.json --dir /tmp/nonexistent-profile --json 2>&1; MERGE_EXIT=$?`,
        `rm -f /tmp/merge-fail.json`,
        `exit $MERGE_EXIT`,
      ].join("\n"),
    );
    expect(exitCode).toBe(1);
    expect(stdout).toContain("No existing user profile");
  });

  // ---- profile:render ----

  test("profile:render --user outputs markdown", () => {
    const out = dockerExec(
      [
        `mkdir -p ${userProfileDir}`,
        `echo '${minimalUserProfile}' > /tmp/ur-input.json`,
        `babysitter profile:write --user --input /tmp/ur-input.json --dir ${userProfileDir} --json`,
        `babysitter profile:render --user --dir ${userProfileDir}`,
        `rm -rf ${userProfileDir} /tmp/ur-input.json`,
      ].join(" && "),
    ).trim();

    // The render output should contain the user's name and markdown formatting
    expect(out).toContain("Test User");
    expect(out).toContain("#");
  });

  test("profile:render --project outputs markdown", () => {
    const out = dockerExec(
      [
        `mkdir -p ${projectProfileDir}`,
        `echo '${minimalProjectProfile}' > /tmp/pr-input.json`,
        `babysitter profile:write --project --input /tmp/pr-input.json --dir ${projectProfileDir} --json`,
        `babysitter profile:render --project --dir ${projectProfileDir}`,
        `rm -rf ${projectProfileDir} /tmp/pr-input.json`,
      ].join(" && "),
    ).trim();

    expect(out).toContain("test-project");
    expect(out).toContain("#");
  });

  test("profile:render --user --json wraps markdown in JSON", () => {
    const out = dockerExec(
      [
        `mkdir -p ${userProfileDir}`,
        `echo '${minimalUserProfile}' > /tmp/urj-input.json`,
        `babysitter profile:write --user --input /tmp/urj-input.json --dir ${userProfileDir} --json`,
        `babysitter profile:render --user --dir ${userProfileDir} --json`,
        `rm -rf ${userProfileDir} /tmp/urj-input.json`,
      ].join(" && "),
    ).trim();

    const result = parseLastJsonObject(out) as Record<string, unknown>;
    expect(result.type).toBe("user");
    expect(typeof result.markdown).toBe("string");
    expect(result.markdown as string).toContain("Test User");
  });

  // ---- full lifecycle: write → merge → merge → read (idempotency) ----

  test("full user profile lifecycle: write → merge → merge → read", () => {
    const merge1 = JSON.stringify({ name: "User v2", specialties: [{ domain: "ml" }] });
    const merge2 = JSON.stringify({ specialties: [{ domain: "security" }], goals: [{ id: "g2", description: "Learn security", category: "learning" }] });

    const out = dockerExec(
      [
        `mkdir -p ${userProfileDir}`,
        `echo '${minimalUserProfile}' > /tmp/lc-base.json`,
        `babysitter profile:write --user --input /tmp/lc-base.json --dir ${userProfileDir} --json`,
        `echo '${merge1}' > /tmp/lc-m1.json`,
        `babysitter profile:merge --user --input /tmp/lc-m1.json --dir ${userProfileDir} --json`,
        `echo '${merge2}' > /tmp/lc-m2.json`,
        `babysitter profile:merge --user --input /tmp/lc-m2.json --dir ${userProfileDir} --json`,
        `babysitter profile:read --user --dir ${userProfileDir} --json`,
        `rm -rf ${userProfileDir} /tmp/lc-base.json /tmp/lc-m1.json /tmp/lc-m2.json`,
      ].join(" && "),
    ).trim();

    const profile = parseLastJsonObject(out) as Record<string, unknown>;
    expect(profile.name).toBe("User v2");
    expect(profile.version).toBe(3);
    const specialties = profile.specialties as Array<Record<string, unknown>>;
    const domains = specialties.map((s) => s.domain);
    expect(domains).toContain("testing");
    expect(domains).toContain("ml");
    expect(domains).toContain("security");
    const goals = profile.goals as Array<Record<string, unknown>>;
    expect(goals.length).toBe(2);
  });

  test("full project profile lifecycle: write → merge → render → read", () => {
    const merge = JSON.stringify({
      techStack: { languages: [{ name: "Python" }], frameworks: [{ name: "FastAPI" }] },
      painPoints: [{ id: "pp1", description: "Slow CI", severity: "high" }],
    });

    const out = dockerExec(
      [
        `mkdir -p ${projectProfileDir}`,
        `echo '${minimalProjectProfile}' > /tmp/plc-base.json`,
        `babysitter profile:write --project --input /tmp/plc-base.json --dir ${projectProfileDir} --json`,
        `echo '${merge}' > /tmp/plc-merge.json`,
        `babysitter profile:merge --project --input /tmp/plc-merge.json --dir ${projectProfileDir} --json`,
        `babysitter profile:read --project --dir ${projectProfileDir} --json`,
        `rm -rf ${projectProfileDir} /tmp/plc-base.json /tmp/plc-merge.json`,
      ].join(" && "),
    ).trim();

    const profile = parseLastJsonObject(out) as Record<string, unknown>;
    expect(profile.version).toBe(2);
    const ts = profile.techStack as Record<string, unknown>;
    const langs = ts.languages as Array<Record<string, unknown>>;
    const langNames = langs.map((l) => l.name);
    expect(langNames).toContain("TypeScript");
    expect(langNames).toContain("Python");
    const painPoints = profile.painPoints as Array<Record<string, unknown>>;
    expect(painPoints.length).toBe(1);
    expect(painPoints[0].description).toBe("Slow CI");
  });
});
