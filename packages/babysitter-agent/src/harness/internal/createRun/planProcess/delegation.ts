import * as path from "node:path";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { invokeHarness } from "../../../invoker";
import {
  PI_PARENT_PROMPT_TIMEOUT_MS,
  createAgentCoreSession,
  promptPiWithRetry,
  type AgentCoreSessionOptions,
} from "../utils";
import {
  isBuiltInHarnessName,
  normalizeBuiltInHarnessName,
} from "../../../builtInHarness";

function resolveSkillFileCandidates(workspace: string, skillRef: string): string[] {
  const trimmed = skillRef.trim();
  if (!trimmed) {
    return [];
  }

  const candidates = new Set<string>();
  const add = (candidate: string): void => {
    if (!candidate) {
      return;
    }
    candidates.add(path.resolve(workspace, candidate));
  };

  if (path.isAbsolute(trimmed)) {
    candidates.add(path.resolve(trimmed));
  } else {
    add(trimmed);
  }

  if (/SKILL\.md$/i.test(trimmed)) {
    add(trimmed);
  } else {
    add(path.join(trimmed, "SKILL.md"));
    add(path.join(".a5c", "skills", trimmed, "SKILL.md"));
    const parts = trimmed.split(":").filter(Boolean);
    if (parts.length >= 2) {
      const [pluginName, ...skillParts] = parts;
      add(path.join("plugins", pluginName, "skills", ...skillParts, "SKILL.md"));
    }
  }

  return Array.from(candidates);
}

function loadSkillInstructions(workspace: string, skillRefs: string[] | undefined): string[] {
  if (!skillRefs?.length) {
    return [];
  }

  const instructions: string[] = [];
  for (const skillRef of skillRefs) {
    const candidates = resolveSkillFileCandidates(workspace, skillRef);
    for (const candidate of candidates) {
      if (!existsSync(candidate)) {
        continue;
      }
      try {
        instructions.push(readFileSync(candidate, "utf8"));
        break;
      } catch {
        // Ignore unreadable skill files and continue searching.
      }
    }
  }
  return instructions;
}

export async function runDelegatedHarnessTask(args: {
  task: string;
  workspace?: string;
  model?: string;
  harness?: string;
  timeout?: number;
  toolsMode?: AgentCoreSessionOptions["toolsMode"];
  thinkingLevel?: AgentCoreSessionOptions["thinkingLevel"] | "none";
  bashSandbox?: AgentCoreSessionOptions["bashSandbox"];
  skills?: string[];
  customTools?: unknown[];
}): Promise<{
  success: boolean;
  output: string;
  harness: string;
}> {
  const workspace = path.resolve(args.workspace ?? process.cwd());
  const skillInstructions = loadSkillInstructions(workspace, args.skills);
  const prompt = skillInstructions.length > 0
    ? [
        "Follow the loaded skill instructions below while performing the task.",
        "",
        ...skillInstructions,
        "",
        "--- Task ---",
        args.task,
      ].join("\n")
    : args.task;

  const harnessName = normalizeBuiltInHarnessName(args.harness?.trim() || "agent-core");
  if (isBuiltInHarnessName(harnessName)) {
    const session = createAgentCoreSession({
      workspace,
      model: args.model,
      timeout: args.timeout,
      toolsMode: args.toolsMode ?? "coding",
      customTools: args.customTools,
      ephemeral: true,
      ...(args.bashSandbox ? { bashSandbox: args.bashSandbox } : {}),
      ...(args.thinkingLevel && args.thinkingLevel !== "none"
        ? { thinkingLevel: args.thinkingLevel }
        : {}),
      ...(skillInstructions.length > 0 ? { appendSystemPrompt: [skillInstructions.join("\n\n---\n\n")] } : {}),
    });
    try {
      await session.initialize();
      const result = await promptPiWithRetry({
        session,
        message: prompt,
        timeout: args.timeout ?? PI_PARENT_PROMPT_TIMEOUT_MS,
        label: "delegated-task",
      });
      return {
        success: result.success,
        output: result.output,
        harness: harnessName,
      };
    } finally {
      session.dispose();
    }
  }

  const result = await invokeHarness(harnessName, {
    prompt,
    workspace,
    model: args.model,
    timeout: args.timeout,
  });
  return {
    success: result.success,
    output: result.output,
    harness: harnessName,
  };
}

export function execShellEffect(
  command: string,
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        cwd,
        timeout: 300_000,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        let exitCode = 0;
        if (error) {
          const execError = error as NodeJS.ErrnoException & { status?: number };
          exitCode = typeof execError.status === "number" ? execError.status : 1;
        }
        resolve({
          stdout: String(stdout),
          stderr: String(stderr),
          exitCode,
        });
      },
    );
  });
}
