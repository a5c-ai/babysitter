import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { EffectAction } from "../../../../../types";
import { resolveEffect } from "../effects";
import { resolveAndPostEffect } from "../index";

/**
 * #949 — genty/platform resolveEffect auto-exec / auto-dispatch must be gated:
 *   - shell + node auto-EXECUTION behind BABYSITTER_EXECUTE_TASKS (default OFF)
 *   - agent + skill auto-DISPATCH behind BABYSITTER_CROSS_SUBAGENTS (default OFF)
 *
 * Default OFF => genty EMITS the effect (returns pending) instead of running it,
 * matching the plugin/host emit-only contract. genty's autonomous runtime
 * entrypoint opts these flags ON, so this gating does not regress standalone runs.
 *
 * These assertions are RED until the gating lands: today resolveEffect always
 * executes/dispatches regardless of the env flags.
 */

// Shell auto-exec seam: effects.ts shell branch calls execShellEffect (planProcess),
// node branch calls invokePromptEffect (effectsHelpers), agent/skill dispatch via
// tasks-adapter (resolveViaTasksMuxIfRoutable) and invokeAgentHarness.
const execShellEffect = vi.fn(async () => ({ stdout: "shell ran", stderr: "", exitCode: 0 }));
const invokeAgentHarness = vi.fn(async () => ({ status: "ok", value: "agent ran" }));
const invokePromptEffect = vi.fn(async () => ({ status: "ok", value: "node ran" }));
const routeTask = vi.fn();
const submitBreakpoint = vi.fn();
// resolveAndPostEffect (index.ts) seam: shell -> execSync, agent/skill ->
// createAgentCoreSession().prompt, result posted via execFileSync (task:post).
const execSync = vi.fn(() => "cli shell ran");
const execFileSync = vi.fn(() => "{}");
const sessionPrompt = vi.fn(async () => ({ output: "cli agent ran" }));
const sessionDispose = vi.fn();
const createAgentCoreSession = vi.fn(() => ({ prompt: sessionPrompt, dispose: sessionDispose }));

vi.mock("../../planProcess", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    execShellEffect: (...args: unknown[]) => execShellEffect(...(args as [])),
    buildAgentPrompt: () => "prompt",
    coerceAgentResultValue: (_def: unknown, v: unknown) => v,
  };
});

vi.mock("../effectsHelpers", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    invokeAgentHarness: (...args: unknown[]) => invokeAgentHarness(...(args as [])),
    invokePromptEffect: (...args: unknown[]) => invokePromptEffect(...(args as [])),
    isRetryableEffectError: () => false,
  };
});

vi.mock("@a5c-ai/tasks-adapter", () => ({
  routeTask: (...args: unknown[]) => routeTask(...(args as [])),
  AgentMuxResponderBackend: class {
    submitBreakpoint = (...args: unknown[]) => submitBreakpoint(...(args as []));
  },
}));

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execSync: (...args: unknown[]) => execSync(...(args as [])),
    execFileSync: (...args: unknown[]) => execFileSync(...(args as [])),
  };
});

vi.mock("../../utils", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    createAgentCoreSession: (...args: unknown[]) => createAgentCoreSession(...(args as [])),
  };
});

const ENV_KEYS = ["BABYSITTER_EXECUTE_TASKS", "BABYSITTER_CROSS_SUBAGENTS"] as const;

function shellAction(): EffectAction {
  return {
    effectId: "eff-shell",
    invocationKey: "key-shell",
    kind: "shell",
    taskDef: {
      kind: "shell",
      title: "Run a shell command",
      shell: { command: "echo", args: ["hi"] },
    },
  } as unknown as EffectAction;
}

function nodeAction(): EffectAction {
  return {
    effectId: "eff-node",
    invocationKey: "key-node",
    kind: "node",
    taskDef: { kind: "node", title: "Run a node task" },
  } as unknown as EffectAction;
}

function agentAction(): EffectAction {
  return {
    effectId: "eff-agent",
    invocationKey: "key-agent",
    kind: "agent",
    taskDef: {
      kind: "agent",
      title: "Dispatch an agent",
      agent: { responderType: "agent", adapter: "codex", prompt: { task: "review" } },
    },
  } as unknown as EffectAction;
}

function skillAction(): EffectAction {
  return {
    effectId: "eff-skill",
    invocationKey: "key-skill",
    kind: "skill",
    taskDef: {
      kind: "skill",
      title: "Dispatch a skill",
      agent: { responderType: "agent", adapter: "codex", prompt: { task: "review" } },
    },
  } as unknown as EffectAction;
}

describe("#949 genty resolveEffect env-gated execution", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    execShellEffect.mockClear();
    invokeAgentHarness.mockClear();
    invokePromptEffect.mockClear();
    execSync.mockClear();
    execFileSync.mockClear();
    sessionPrompt.mockClear();
    sessionDispose.mockClear();
    createAgentCoreSession.mockClear();
    routeTask.mockReset();
    submitBreakpoint.mockReset();
    routeTask.mockReturnValue({
      responderType: "agent",
      route: "adapters",
      responder: { id: "codex", adapter: "codex" },
    });
    submitBreakpoint.mockResolvedValue({
      answers: [{ text: "agent ran", responderId: "codex", responderName: "Codex" }],
    });
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
    vi.restoreAllMocks();
  });

  describe("shell effects (BABYSITTER_EXECUTE_TASKS)", () => {
    it("does NOT execute the shell command when the flag is unset (emits/pending)", async () => {
      delete process.env.BABYSITTER_EXECUTE_TASKS;
      const result = await resolveEffect(shellAction(), "genty", { workspace: "/repo" });

      expect(execShellEffect).not.toHaveBeenCalled();
      expect(result.status).toBe("pending");
    });

    it("executes the shell command when BABYSITTER_EXECUTE_TASKS=1", async () => {
      process.env.BABYSITTER_EXECUTE_TASKS = "1";
      const result = await resolveEffect(shellAction(), "genty", { workspace: "/repo" });

      expect(execShellEffect).toHaveBeenCalledTimes(1);
      expect(result.status).toBe("ok");
    });
  });

  describe("node effects (BABYSITTER_EXECUTE_TASKS)", () => {
    it("does NOT execute the node task when the flag is unset (emits/pending)", async () => {
      delete process.env.BABYSITTER_EXECUTE_TASKS;
      const result = await resolveEffect(nodeAction(), "genty", { workspace: "/repo" });

      expect(invokePromptEffect).not.toHaveBeenCalled();
      expect(result.status).toBe("pending");
    });

    it("executes the node task when BABYSITTER_EXECUTE_TASKS=1", async () => {
      process.env.BABYSITTER_EXECUTE_TASKS = "1";
      const result = await resolveEffect(nodeAction(), "genty", { workspace: "/repo" });

      expect(invokePromptEffect).toHaveBeenCalledTimes(1);
      expect(result.status).toBe("ok");
    });
  });

  describe("agent effects (BABYSITTER_CROSS_SUBAGENTS)", () => {
    it("does NOT dispatch the agent when the flag is unset (emits/pending)", async () => {
      delete process.env.BABYSITTER_CROSS_SUBAGENTS;
      const result = await resolveEffect(agentAction(), "genty", { workspace: "/repo" });

      // Neither the cross-harness tasks-adapter route nor the harness fallback fires.
      expect(routeTask).not.toHaveBeenCalled();
      expect(submitBreakpoint).not.toHaveBeenCalled();
      expect(invokeAgentHarness).not.toHaveBeenCalled();
      expect(result.status).toBe("pending");
    });

    it("dispatches the agent when BABYSITTER_CROSS_SUBAGENTS=1", async () => {
      process.env.BABYSITTER_CROSS_SUBAGENTS = "1";
      const result = await resolveEffect(agentAction(), "genty", { workspace: "/repo" });

      expect(routeTask).toHaveBeenCalledTimes(1);
      expect(submitBreakpoint).toHaveBeenCalledTimes(1);
      expect(result.status).toBe("ok");
    });
  });

  describe("skill effects (BABYSITTER_CROSS_SUBAGENTS)", () => {
    it("does NOT dispatch the skill when the flag is unset (emits/pending)", async () => {
      delete process.env.BABYSITTER_CROSS_SUBAGENTS;
      const result = await resolveEffect(skillAction(), "genty", { workspace: "/repo" });

      // A skill effect must be gated exactly like agent: no cross-harness route,
      // no harness fallback, no catch-all invokePromptEffect execution.
      expect(routeTask).not.toHaveBeenCalled();
      expect(submitBreakpoint).not.toHaveBeenCalled();
      expect(invokeAgentHarness).not.toHaveBeenCalled();
      expect(invokePromptEffect).not.toHaveBeenCalled();
      expect(result.status).toBe("pending");
    });

    it("dispatches the skill when BABYSITTER_CROSS_SUBAGENTS=1", async () => {
      process.env.BABYSITTER_CROSS_SUBAGENTS = "1";
      const result = await resolveEffect(skillAction(), "genty", { workspace: "/repo" });

      // With the flag ON the skill falls through to the catch-all dispatch path.
      expect(result.status).not.toBe("pending");
      expect(invokePromptEffect).toHaveBeenCalledTimes(1);
    });
  });

  // GAP 2 — resolveAndPostEffect (index.ts) is a SECOND, separately-exported
  // dispatcher used by runCliOrchestration. It must honor the same flags at its
  // own execution seam (defense-in-depth), not rely on the entrypoint env mutation.
  describe("resolveAndPostEffect env-gated execution", () => {
    // resolveAndPostEffect posts back by writing tasks/<id>/output.json under
    // runDir (real fs) before calling task:post (execFileSync). A non-writable
    // runDir (e.g. "/repo" at the FS root on CI Linux) makes that write throw —
    // swallowed by the best-effort catch — so the post is skipped and execFileSync
    // is never called. Use a real writable temp dir so the post seam is exercised
    // deterministically across platforms.
    let runDir: string;
    beforeEach(async () => {
      runDir = await mkdtemp(join(tmpdir(), "eff-gating-"));
    });
    afterEach(async () => {
      await rm(runDir, { recursive: true, force: true }).catch(() => {});
    });

    function cliShellAction() {
      return {
        effectId: "eff-cli-shell",
        invocationKey: "key-cli-shell",
        kind: "shell" as const,
        taskDef: { kind: "shell", title: "Run a shell command", shell: { command: "echo hi" } },
      };
    }
    function cliAgentAction() {
      return {
        effectId: "eff-cli-agent",
        invocationKey: "key-cli-agent",
        kind: "agent" as const,
        taskDef: { kind: "agent", title: "Dispatch an agent", agent: { prompt: "do it" } },
      };
    }
    function cliSkillAction() {
      return {
        effectId: "eff-cli-skill",
        invocationKey: "key-cli-skill",
        kind: "skill" as const,
        taskDef: { kind: "skill", title: "Dispatch a skill", agent: { prompt: "do it" } },
      };
    }

    it("does NOT execute shell when BABYSITTER_EXECUTE_TASKS is unset (no exec, no post)", async () => {
      delete process.env.BABYSITTER_EXECUTE_TASKS;
      await resolveAndPostEffect(cliShellAction(), "/runs/eff", "/repo");

      expect(execSync).not.toHaveBeenCalled();
      // Pending => effect is not posted back.
      expect(execFileSync).not.toHaveBeenCalled();
    });

    it("executes shell when BABYSITTER_EXECUTE_TASKS=1 (exec + post)", async () => {
      process.env.BABYSITTER_EXECUTE_TASKS = "1";
      await resolveAndPostEffect(cliShellAction(), runDir, "/repo");

      expect(execSync).toHaveBeenCalledTimes(1);
      // Posted back via task:post (execFileSync).
      expect(execFileSync).toHaveBeenCalledTimes(1);
    });

    it("does NOT dispatch agent when BABYSITTER_CROSS_SUBAGENTS is unset (no session, no post)", async () => {
      delete process.env.BABYSITTER_CROSS_SUBAGENTS;
      await resolveAndPostEffect(cliAgentAction(), "/runs/eff", "/repo");

      expect(routeTask).not.toHaveBeenCalled();
      expect(createAgentCoreSession).not.toHaveBeenCalled();
      expect(sessionPrompt).not.toHaveBeenCalled();
      expect(execFileSync).not.toHaveBeenCalled();
    });

    it("does NOT dispatch skill when BABYSITTER_CROSS_SUBAGENTS is unset (no session, no post)", async () => {
      delete process.env.BABYSITTER_CROSS_SUBAGENTS;
      await resolveAndPostEffect(cliSkillAction(), "/runs/eff", "/repo");

      expect(createAgentCoreSession).not.toHaveBeenCalled();
      expect(sessionPrompt).not.toHaveBeenCalled();
      expect(execFileSync).not.toHaveBeenCalled();
    });

    it("dispatches agent when BABYSITTER_CROSS_SUBAGENTS=1 (session + post)", async () => {
      process.env.BABYSITTER_CROSS_SUBAGENTS = "1";
      // Force the internal-session path (not tasks-mux) so createAgentCoreSession runs.
      routeTask.mockReturnValue({ responderType: "internal" });
      await resolveAndPostEffect(cliAgentAction(), runDir, "/repo");

      expect(createAgentCoreSession).toHaveBeenCalledTimes(1);
      expect(sessionPrompt).toHaveBeenCalledTimes(1);
      expect(execFileSync).toHaveBeenCalledTimes(1);
    });
  });
});
