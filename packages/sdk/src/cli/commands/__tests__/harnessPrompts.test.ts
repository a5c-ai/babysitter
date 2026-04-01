import { describe, expect, test } from "vitest";
import { HarnessCapability } from "../../../harness/types";
import {
  buildOrchestrationSystemPrompt,
  buildProcessDefinitionSystemPrompt,
  buildProcessDefinitionUserPrompt,
  type HarnessPromptContext,
} from "../harnessPrompts";

const context: HarnessPromptContext = {
  platform: "linux",
  arch: "x64",
  nodeVersion: "v22.0.0",
  cwd: "/repo",
  workspace: "/repo/workspace",
  selectedHarnessName: "pi",
  compressionEnabled: true,
  secureSandboxImage: "node:22-bookworm",
  piDefaultBashSandbox: "local",
  piIsolationDefault: false,
  envFlags: [
    { name: "CI", value: "true" },
    { name: "AZURE_OPENAI_API_KEY", value: "set" },
  ],
  discoveredHarnesses: [
    {
      name: "pi",
      installed: true,
      cliCommand: "pi",
      configFound: true,
      capabilities: [HarnessCapability.Programmatic, HarnessCapability.SessionBinding],
      platform: "linux",
      version: "1.2.3",
    },
    {
      name: "claude-code",
      installed: true,
      cliCommand: "claude",
      configFound: false,
      capabilities: [HarnessCapability.SessionBinding, HarnessCapability.StopHook],
      platform: "linux",
    },
  ],
};

describe("harnessPrompts", () => {
  test("phase 1 prompt includes runtime and harness guidance", async () => {
    const prompt = await buildProcessDefinitionSystemPrompt("/tmp/out.js", context);
    expect(prompt).toContain("Runtime environment:");
    expect(prompt).toContain("platform=linux");
    expect(prompt).toContain("secure_pi_sandbox_image=node:22-bookworm");
    expect(prompt).toContain("pi_default_bash_sandbox=local");
    expect(prompt).toContain("pi_default_isolated=false");
    expect(prompt).toContain("Discovered harnesses:");
    expect(prompt).toContain("pi | installed=yes");
    expect(prompt).toContain("metadata.harness");
    expect(prompt).toContain("Default `agent`, legacy `node`, and `orchestrator_task` work to the internal PI worker");
    expect(prompt).toContain("native/local PI execution");
    expect(prompt).toContain("Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction`");
    expect(prompt).toContain("bashSandbox: \"secure\"");
    expect(prompt).toContain("Interview the user");
    expect(prompt).toContain("AskUserQuestion is the only in-loop way to ask the user");
    expect(prompt).toContain("resolve the active shared process-library");
    expect(prompt).toContain("babysitter_resolve_process_library");
    expect(prompt).toContain("babysitter_search_process_library");
    expect(prompt).toContain("babysitter_read_process_library_file");
    expect(prompt).toContain("binding.dir");
    expect(prompt).toContain("defaultSpec.cloneDir");
    expect(prompt).toContain("project `.a5c/processes/`");
    expect(prompt).toContain("babysitter profile:read --user --json");
    expect(prompt).toContain("only relevant filesystem root");
    expect(prompt).toContain("You may inspect local babysitter process references");
    expect(prompt).toContain("babysitter_write_process_definition");
    expect(prompt).toContain("orchestrate the work through babysitter tasks");
    expect(prompt).toContain("Define at least one task with `defineTask(...)`");
    expect(prompt).toContain("NEVER use `node` kind");
    expect(prompt).toContain("kind: 'agent'");
    expect(prompt).toContain("Default for all tasks");
    expect(prompt).toContain("await ctx.task(");
    expect(prompt).toContain("DefinedTask created via `defineTask(...)`");
    expect(prompt).toContain("do not reference Node's global process object as `process.*`");
    expect(prompt).toContain("do not assume `ctx.workspaceDir` or `ctx.cwd` exists");
    expect(prompt).toContain("import.meta.url");
    expect(prompt).toContain("syntactically valid ESM");
    expect(prompt).toContain("raw nested template literals");
  });

  test("phase 2 prompt includes selected harness and execution guidance", () => {
    const prompt = buildOrchestrationSystemPrompt("pi", context);
    expect(prompt).toContain("Treat pi as the target harness binding");
    expect(prompt).toContain("Follow the babysit workflow directly");
    expect(prompt).toContain("AskUserQuestion is the in-loop user interaction tool");
    expect(prompt).toContain("built-in coding tools");
    expect(prompt).toContain("respect task-level harness metadata");
    expect(prompt).toContain("Shell and legacy node effects are first-class pending effects");
    expect(prompt).toContain("Shell effects run through the internal PI worker");
    expect(prompt).toContain("env.CI=true");
  });

  test("phase 1 user prompt keeps non-interactive empty-workspace runs bounded", () => {
    const prompt = buildProcessDefinitionUserPrompt("create a game", "/tmp/out.mjs", {
      interactive: false,
      workspaceAssessment: "empty",
      workspaceEntries: [],
    });

    expect(prompt).toContain("Non-interactive mode. Do not call AskUserQuestion");
    expect(prompt).toContain("Workspace assessment: empty.");
    expect(prompt).toContain("resolve the active shared process-library");
    expect(prompt).toContain("inspect only the most relevant local babysitter process references");
    expect(prompt).toContain("Do not inspect unrelated directories");
    expect(prompt).toContain("real babysitter process, not a direct one-shot script");
    expect(prompt).toContain("Put the main implementation in one or more `agent` tasks");
    expect(prompt).toContain("Do not add internal worker guardrail metadata");
    expect(prompt).toContain("The generated process must directly execute the user's requested work");
    expect(prompt).toContain("Use babysitter_write_process_definition to write the file now");
    expect(prompt).toContain("call babysitter_report_process_definition exactly once");
    expect(prompt).toContain("Keep generated asset strings syntax-safe");
    expect(prompt).toContain("raw nested template literals");
  });

  test("phase 1 user prompt reinforces AskUserQuestion for interactive discovery", () => {
    const prompt = buildProcessDefinitionUserPrompt("create a game", "/tmp/out.mjs", {
      interactive: true,
      workspaceAssessment: "empty",
      workspaceEntries: [],
    });

    expect(prompt).toContain("Interactive mode. Run the interview step first.");
    expect(prompt).toContain("Treat this as a greenfield request, but do not skip the interview");
    expect(prompt).toContain("use AskUserQuestion rather than plain-text questions");
    expect(prompt).toContain("ask the next highest-signal AskUserQuestion");
  });
});
