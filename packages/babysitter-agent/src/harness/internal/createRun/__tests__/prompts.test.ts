import { describe, expect, test } from "vitest";
import { HarnessCapability } from "../../../types";
import {
  buildOrchestrationSystemPrompt,
  buildOrchestrationTurnPrompt,
  buildProcessDefinitionSystemPrompt,
  buildProcessDefinitionUserPrompt,
  type HarnessPromptContext,
} from "../prompts";

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
  test("PhasePlanProcess prompt includes runtime and harness guidance", async () => {
    const prompt = await buildProcessDefinitionSystemPrompt("/tmp/out.js", context);
    expect(prompt).toContain("Runtime environment:");
    expect(prompt).toContain("platform=linux");
    expect(prompt).toContain("secure_pi_sandbox_image=node:22-bookworm");
    expect(prompt).toContain("pi_default_bash_sandbox=local");
    expect(prompt).toContain("pi_default_isolated=false");
    expect(prompt).toContain("Discovered harnesses:");
    expect(prompt).toContain("pi | installed=yes");
    expect(prompt).toContain("metadata.harness");
    expect(prompt).toContain("Default `agent`, legacy `node`, and `orchestrator_task` work to the internal agent-core worker");
    expect(prompt).toContain("native/local execution");
    expect(prompt).toContain("Do not set `task.metadata.bashSandbox`, `task.metadata.isolated`, or `task.metadata.enableCompaction`");
    expect(prompt).toContain("bashSandbox: \"secure\"");
    expect(prompt).toContain("internal harness routing/guardrail hints");
    expect(prompt).toContain("Do not treat `execution.permissions` as a cross-harness security boundary");
    expect(prompt).toContain("Plugin targets may ignore it entirely");
    expect(prompt).toContain("Interview the user");
    expect(prompt).toContain("AskUserQuestion is the only in-loop way to ask the user");
    expect(prompt).toContain("resolve the active shared process-library");
    expect(prompt).not.toContain("babysitter_resolve_process_library");
    expect(prompt).not.toContain("babysitter_read_process_library_file");
    expect(prompt).toContain("binding.dir");
    expect(prompt).toContain("defaultSpec.cloneDir");
    expect(prompt).toContain("project `.a5c/processes/`");
    expect(prompt).toContain("babysitter profile:read --user --json");
    expect(prompt).toContain("only relevant filesystem root");
    expect(prompt).toContain("You may inspect local babysitter process references");
    expect(prompt).toContain("Do not rely on a babysitter-specific write tool");
    expect(prompt).toContain("orchestrate the work through babysitter tasks");
    expect(prompt).toContain("Define at least one task with `defineTask(...)`");
    expect(prompt).toContain("NEVER use `node` kind");
    expect(prompt).toContain("kind: 'agent'");
    expect(prompt).toContain("Default for reasoning tasks");
    expect(prompt).toContain("await ctx.task(");
    expect(prompt).toContain("DefinedTask created via `defineTask(...)`");
    expect(prompt).toContain("use `inputs.json` for task inputs");
    expect(prompt).toContain("do not reference Node's global process object as `process.*`");
    expect(prompt).toContain("do not assume `ctx.workspaceDir` or `ctx.cwd` exists");
    expect(prompt).toContain("import.meta.url");
    expect(prompt).toContain("syntactically valid ESM");
    expect(prompt).toContain("raw nested template literals");
  });

  test("PhaseOrchestration prompt includes selected harness and execution guidance", () => {
    const prompt = buildOrchestrationSystemPrompt("pi", context);
    expect(prompt).toContain("Treat pi as the target harness binding");
    expect(prompt).toContain("Follow the babysit workflow directly");
    expect(prompt).toContain("AskUserQuestion, task, and skill are common tools in this phase");
    expect(prompt).toContain("built-in coding tools");
    expect(prompt).toContain("Never drive the orchestration loop through raw `babysitter` CLI commands inside `bash`");
    expect(prompt).toContain("Never import or call babysitter SDK/runtime helpers");
    expect(prompt).toContain("Do not implement the user's requested workspace deliverable directly before the bound run yields pending effects");
    expect(prompt).toContain("Do not create, copy, rename, delete, or hand-edit sibling run directories/files inside `.a5c/runs/`");
    expect(prompt).toContain("respect task-level harness metadata");
    expect(prompt).toContain("Shell and legacy node effects are first-class pending effects");
    expect(prompt).toContain("For delegated or fresh-context work, prefer `task`");
    expect(prompt).toContain("Shell effects run through the internal agent-core worker");
    expect(prompt).toContain("env.CI=true");
  });

  test("PhasePlanProcess user prompt keeps non-interactive empty-workspace runs bounded", () => {
    const prompt = buildProcessDefinitionUserPrompt("create a game", "/tmp/processes", {
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
    expect(prompt).toContain("Write the process with the normal file tools now");
    expect(prompt).toContain("call babysitter_report_process_definition exactly once");
    expect(prompt).toContain("Keep generated asset strings syntax-safe");
    expect(prompt).toContain("raw nested template literals");
  });

  test("PhasePlanProcess user prompt reinforces AskUserQuestion for interactive discovery", () => {
    const prompt = buildProcessDefinitionUserPrompt("create a game", "/tmp/processes", {
      interactive: true,
      workspaceAssessment: "empty",
      workspaceEntries: [],
    });

    expect(prompt).toContain("Interactive mode. Run the interview step first.");
    expect(prompt).toContain("Treat this as a greenfield request, but do not skip the interview");
    expect(prompt).toContain("use AskUserQuestion rather than plain-text questions");
    expect(prompt).toContain("ask the next highest-signal AskUserQuestion");
  });

  test("PhasePlanProcess user prompt can forbid shell subtasks for babysitter call flows", () => {
    const prompt = buildProcessDefinitionUserPrompt("implement the feature", "/tmp/processes", {
      interactive: false,
      workspaceAssessment: "empty",
      workspaceEntries: [],
      preferAgentOnlyTasks: true,
    });

    expect(prompt).toContain("Do not generate `shell` tasks for this run shape");
    expect(prompt).toContain("`agent` or `skill` tasks");
    expect(prompt).toContain("Do not add `breakpoint` tasks for this run shape");
  });

  test("PhaseOrchestration prompt can bias call flows away from shell effects", () => {
    const prompt = buildOrchestrationSystemPrompt("pi", context, false, true);

    expect(prompt).toContain("Treat `shell` effects as exceptional compatibility cases");
    expect(prompt).toContain("`agent`, `skill`, and delegated-task resolution paths");
    expect(prompt).toContain("should not emit breakpoint effects");
  });

  test("PhaseOrchestration turn prompt forces a follow-up iterate after pending effects are posted", () => {
    const prompt = buildOrchestrationTurnPrompt({
      processPath: "/tmp/process.js",
      userPrompt: "create a game",
      maxIterations: 5,
      currentIteration: 1,
      runId: "run-1",
      runDir: "/tmp/runs/run-1",
      lastStatus: "waiting",
      pendingEffects: [
        {
          effectId: "eff-1",
          kind: "agent",
          title: "Implement the game",
          harness: "pi",
        },
      ],
    });

    expect(prompt).toContain("Call babysitter_run_iterate exactly once after the last post");
    expect(prompt).toContain("Do not use `task:list`, plain narration, or a completion claim as a substitute");
    expect(prompt).toContain("Do not create ad-hoc copies like `TESTCOPY`");
  });

  test("PhaseOrchestration turn prompt forbids direct implementation before the first iterate on a created run", () => {
    const prompt = buildOrchestrationTurnPrompt({
      processPath: "/tmp/process.js",
      userPrompt: "create a game",
      maxIterations: 5,
      currentIteration: 0,
      runId: "run-1",
      runDir: "/tmp/runs/run-1",
      lastStatus: "created",
    });

    expect(prompt).toContain("Call babysitter_run_iterate exactly once in this turn");
    expect(prompt).toContain("do not implement the workspace deliverable directly before that iterate call returns");
  });
});
