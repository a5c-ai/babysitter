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
    expect(prompt).toContain("native/local PI execution");
    expect(prompt).toContain("bashSandbox: \"secure\"");
    expect(prompt).toContain("only relevant filesystem root");
    expect(prompt).toContain("Do not read files outside the workspace");
    expect(prompt).toContain("babysitter_write_process_definition");
    expect(prompt).toContain("every returned TaskDef must include a top-level `kind` field");
    expect(prompt).toContain('kind: "agent"');
    expect(prompt).toContain('kind: "shell"');
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
    expect(prompt).toContain("respect task-level harness metadata");
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
    expect(prompt).toContain("Do not inspect unrelated directories");
    expect(prompt).toContain("The generated process must directly execute the user's requested work");
    expect(prompt).toContain("Use babysitter_write_process_definition to write the file now");
    expect(prompt).toContain("call babysitter_report_process_definition exactly once");
    expect(prompt).toContain("Keep generated asset strings syntax-safe");
    expect(prompt).toContain("raw nested template literals");
  });
});
