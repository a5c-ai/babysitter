import { describe, expect, test } from "vitest";
import { HarnessCapability } from "../../../harness/types";
import {
  buildOrchestrationSystemPrompt,
  buildProcessDefinitionSystemPrompt,
  buildProcessDefinitionUserPrompt,
  type SessionCreatePromptContext,
} from "../sessionCreatePrompts";

const context: SessionCreatePromptContext = {
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

describe("sessionCreatePrompts", () => {
  test("phase 1 prompt includes runtime and harness guidance", () => {
    const prompt = buildProcessDefinitionSystemPrompt("/tmp/out.js", context);
    expect(prompt).toContain("Runtime environment:");
    expect(prompt).toContain("platform=linux");
    expect(prompt).toContain("secure_pi_sandbox_image=node:22-bookworm");
    expect(prompt).toContain("pi_default_bash_sandbox=local");
    expect(prompt).toContain("pi_default_isolated=false");
    expect(prompt).toContain("Discovered harnesses:");
    expect(prompt).toContain("pi | installed=yes");
    expect(prompt).toContain("metadata.harness");
    expect(prompt).toContain("Default every task to the internal PI worker");
    expect(prompt).toContain("native/local PI execution");
    expect(prompt).toContain("Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction`");
    expect(prompt).toContain("bashSandbox: \"secure\"");
    expect(prompt).toContain("follow a real interview phase");
    expect(prompt).toContain("search the local babysitter process library");
    expect(prompt).toContain("project `.a5c/processes/`");
    expect(prompt).toContain("babysitter profile:read --user --json");
    expect(prompt).toContain("only relevant filesystem root");
    expect(prompt).toContain("You may inspect local babysitter process references");
    expect(prompt).toContain("babysitter_write_process_definition");
    expect(prompt).toContain("orchestrate the work through babysitter tasks");
    expect(prompt).toContain("Define at least one task with `defineTask(...)`");
    expect(prompt).toContain("every returned TaskDef must include a top-level `kind` field");
    expect(prompt).toContain('kind: "agent"');
    expect(prompt).toContain('kind: "shell"');
    expect(prompt).toContain("At least one defined task must be an `agent` task");
    expect(prompt).toContain('await ctx.task(definedTask, args)');
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
    expect(prompt).toContain("built-in coding tools");
    expect(prompt).toContain("respect task-level harness metadata");
    expect(prompt).toContain("babysitter_run_shell_effect");
    expect(prompt).toContain("babysitter_dispatch_effect_harness");
    expect(prompt).toContain("Shell effects execute on internal PI worker sessions");
    expect(prompt).toContain("opt-in PI worker sessions");
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
});
