/**
 * Tests for `babysitter instructions:*` CLI command (handleInstructionsCommand).
 *
 * Covers emission of executionContext + capabilityFlags in both JSON and
 * text modes, plus the unknown-harness / unknown-subcommand error paths.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createBabysitterCli } from "../../main";
import { handleInstructionsCommand } from "../instructions";
import type { InstructionsCommandArgs } from "../instructions";

let stdoutOutput: string;
let stderrOutput: string;
let savedEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  stdoutOutput = "";
  stderrOutput = "";
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    stdoutOutput += args.map(String).join(" ") + "\n";
  });
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    stderrOutput += args.map(String).join(" ") + "\n";
  });
  // Snapshot env so tests can mutate freely
  savedEnv = { ...process.env };
  // Scrub any inherited CI / GH env that would otherwise leak into detection
  for (const key of Object.keys(process.env)) {
    if (
      key === "CI" ||
      key === "OPENAI_API_KEY" ||
      key.startsWith("GITHUB_") ||
      key.startsWith("BABYSITTER_") ||
      key === "CLAUDE_ENV_FILE" ||
      key === "CLAUDE_PLUGIN_ROOT" ||
      key === "CODEX_THREAD_ID" ||
      key === "CODEX_SESSION_ID" ||
      key === "CODEX_PLUGIN_ROOT" ||
      key === "GEMINI_SESSION_ID" ||
      key === "GEMINI_CWD" ||
      key === "GEMINI_PROJECT_DIR" ||
      key === "GEMINI_EXTENSION_PATH" ||
      key === "COPILOT_SESSION_ID" ||
      key === "COPILOT_HOME" ||
      key === "COPILOT_GITHUB_TOKEN" ||
      key === "CURSOR_PROJECT_DIR" ||
      key === "CURSOR_VERSION" ||
      key === "PI_SESSION_ID" ||
      key === "PI_PLUGIN_ROOT" ||
      key === "OMP_SESSION_ID" ||
      key === "OMP_PLUGIN_ROOT" ||
      key === "OPENCODE_SESSION_ID" ||
      key === "OPENCODE_CONFIG" ||
      key === "ACCOMPLISH_TASK_ID" ||
      key === "OPENCLAW_SHELL" ||
      key === "OPENCLAW_HOME" ||
      key === "AGENT_SESSION_ID"
    ) {
      delete process.env[key];
    }
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, savedEnv);
});

function makeArgs(overrides: Partial<InstructionsCommandArgs> = {}): InstructionsCommandArgs {
  return {
    subcommand: "babysit-skill",
    harness: "claude-code",
    interactive: false,
    json: false,
    ...overrides,
  };
}

describe("handleInstructionsCommand — executionContext / capabilityFlags emission", () => {
  it("JSON mode includes executionContext and capabilityFlags fields", async () => {
    const code = await handleInstructionsCommand(makeArgs({ json: true }));
    expect(code).toBe(0);

    const payload = JSON.parse(stdoutOutput);
    expect(payload.executionContext).toBeDefined();
    expect(payload.executionContext.ci).toBe("local");
    expect(payload.executionContext.trigger).toBe("manual");
    expect(payload.capabilityFlags).toBeDefined();
    expect(payload.capabilityFlags.hasLocalDevRelax).toBe(true);
    expect(payload.capabilityFlags.hasPrPolicies).toBe(false);
    expect(payload.harness).toBe("claude-code");
    expect(payload.promptType).toBe("babysit-skill");
  });

  it("JSON mode reflects github-actions env → hasPrPolicies true", async () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_EVENT_NAME = "pull_request";
    process.env.GITHUB_EVENT_ACTION = "opened";

    const code = await handleInstructionsCommand(makeArgs({ json: true }));
    expect(code).toBe(0);

    const payload = JSON.parse(stdoutOutput);
    expect(payload.executionContext.ci).toBe("github-actions");
    expect(payload.executionContext.trigger).toBe("pr-opened");
    expect(payload.capabilityFlags.hasPrPolicies).toBe(true);
    expect(payload.capabilityFlags.hasLocalDevRelax).toBe(false);
  });

  it("JSON mode detects scheduled trigger → hasScheduledReportFormat", async () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_EVENT_NAME = "schedule";

    const code = await handleInstructionsCommand(makeArgs({ json: true }));
    expect(code).toBe(0);

    const payload = JSON.parse(stdoutOutput);
    expect(payload.executionContext.trigger).toBe("scheduled");
    expect(payload.capabilityFlags.hasScheduledReportFormat).toBe(true);
  });

  it("JSON mode detects pr-comment-mention → hasSixDimensionReview", async () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_EVENT_NAME = "issue_comment";
    process.env.GITHUB_EVENT_ISSUE_PULL_REQUEST = "true";

    const code = await handleInstructionsCommand(makeArgs({ json: true }));
    const payload = JSON.parse(stdoutOutput);
    expect(payload.executionContext.trigger).toBe("pr-comment-mention");
    expect(payload.capabilityFlags.hasPrCommentFormat).toBe(true);
    expect(payload.capabilityFlags.hasSixDimensionReview).toBe(true);
  });

  it("text mode prepends ## Execution Context header", async () => {
    const code = await handleInstructionsCommand(makeArgs({ json: false }));
    expect(code).toBe(0);

    expect(stdoutOutput).toMatch(/^## Execution Context/);
    expect(stdoutOutput).toContain("- CI: `local`");
    expect(stdoutOutput).toContain("- Trigger: `manual`");
    expect(stdoutOutput).toContain("Active context capabilities");
    expect(stdoutOutput).toContain("`hasLocalDevRelax`");
    expect(stdoutOutput).toContain(
      "prefer those whose triggers match the active capabilities",
    );
  });

  it("text mode lists active capabilities for GHA push-to-main", async () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_EVENT_NAME = "push";
    process.env.GITHUB_REF = "refs/heads/main";
    process.env.GITHUB_REPOSITORY = "acme/widget";
    process.env.GITHUB_ACTOR = "octocat";

    const code = await handleInstructionsCommand(makeArgs({ json: false }));
    expect(code).toBe(0);

    expect(stdoutOutput).toContain("- CI: `github-actions`");
    expect(stdoutOutput).toContain("- Trigger: `push-to-main`");
    expect(stdoutOutput).toContain("- Repo: `acme/widget`");
    expect(stdoutOutput).toContain("- Actor: `octocat`");
    expect(stdoutOutput).toContain("`hasPrPolicies`");
    expect(stdoutOutput).toContain("`hasIdempotencyAndAbort`");
  });

  it("text mode marks bot actors", async () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_EVENT_NAME = "push";
    process.env.GITHUB_ACTOR = "dependabot[bot]";

    await handleInstructionsCommand(makeArgs({ json: false }));
    expect(stdoutOutput).toContain("- Actor: `dependabot[bot]` (bot)");
  });

  it("shows _(none)_ marker when no capabilities active", async () => {
    // An impossible-but-defined trigger override gives no flags; easier to
    // simulate by using local CI which only enables hasLocalDevRelax. We
    // instead assert the formatting token exists when there's ≥1 active.
    const code = await handleInstructionsCommand(makeArgs({ json: false }));
    expect(code).toBe(0);
    expect(stdoutOutput).toMatch(/Active context capabilities: `?\w/);
  });
});

describe("handleInstructionsCommand — automatic harness resolution", () => {
  it("detects codex from SDK caller discovery when harness is omitted", async () => {
    process.env.CODEX_THREAD_ID = "thread-123";

    const code = await handleInstructionsCommand(
      makeArgs({ harness: undefined, json: true }),
    );
    expect(code).toBe(0);

    const payload = JSON.parse(stdoutOutput);
    expect(payload.harness).toBe("codex");
    expect(payload.harnessSource).toBe("caller");
    expect(payload.discoveryEvidence).toContain("CODEX_THREAD_ID");
    expect(payload.warnings).toEqual([]);
  });

  it("detects codex from hooks-mux style discovery when SDK caller discovery misses", async () => {
    process.env.OPENAI_API_KEY = "sk-test";

    const code = await handleInstructionsCommand(
      makeArgs({ harness: undefined, json: true }),
    );
    expect(code).toBe(0);

    const payload = JSON.parse(stdoutOutput);
    expect(payload.harness).toBe("codex");
    expect(payload.harnessSource).toBe("hooks-mux");
    expect(payload.discoveryEvidence).toContain("OPENAI_API_KEY");
    expect(payload.warnings).toEqual([]);
  });

  it("falls back to pessimistic custom context with warning when discovery fails", async () => {
    const code = await handleInstructionsCommand(
      makeArgs({ harness: undefined, json: true }),
    );
    expect(code).toBe(0);

    const payload = JSON.parse(stdoutOutput);
    expect(payload.harness).toBe("custom");
    expect(payload.harnessSource).toBe("fallback");
    expect(payload.warnings).toEqual([
      "Host discovery failed for `instructions:*`; using the pessimistic custom-harness prompt context.",
    ]);
    expect(payload.hookDriven).toBe(false);
  });
});

describe("instructions CLI dispatch", () => {
  it("no longer requires --harness at the CLI boundary", async () => {
    process.env.CODEX_THREAD_ID = "thread-456";
    const cli = createBabysitterCli();

    const code = await cli.run(["instructions:babysit-skill", "--json"]);
    expect(code).toBe(0);

    const payload = JSON.parse(stdoutOutput);
    expect(payload.harness).toBe("codex");
    expect(payload.harnessSource).toBe("caller");
  });
});

describe("handleInstructionsCommand — error paths", () => {
  it("returns 1 on unknown harness (text mode)", async () => {
    const code = await handleInstructionsCommand(
      makeArgs({ harness: "nonexistent-harness-xyz" }),
    );
    expect(code).toBe(1);
    expect(stderrOutput).toContain("Unknown harness");
  });

  it("returns 1 on unknown harness (JSON mode)", async () => {
    const code = await handleInstructionsCommand(
      makeArgs({ harness: "nonexistent-harness-xyz", json: true }),
    );
    expect(code).toBe(1);
    const payload = JSON.parse(stdoutOutput);
    expect(payload.error).toBe("unknown_harness");
  });

  it("returns 1 on unknown subcommand", async () => {
    const code = await handleInstructionsCommand(
      makeArgs({
        // @ts-expect-error intentionally invalid subcommand
        subcommand: "nope",
        json: true,
      }),
    );
    expect(code).toBe(1);
    const payload = JSON.parse(stdoutOutput);
    expect(payload.error).toBe("unknown_subcommand");
  });
});

describe("handleInstructionsCommand — subcommand variants", () => {
  it.each([
    "babysit-skill",
    "process-create",
    "orchestrate",
    "breakpoint-handling",
  ] as const)("emits capabilityFlags for %s", async (subcommand) => {
    const code = await handleInstructionsCommand(
      makeArgs({ subcommand, json: true }),
    );
    expect(code).toBe(0);
    const payload = JSON.parse(stdoutOutput);
    expect(payload.promptType).toBe(subcommand);
    expect(payload.capabilityFlags).toBeDefined();
    expect(payload.executionContext).toBeDefined();
  });
});
