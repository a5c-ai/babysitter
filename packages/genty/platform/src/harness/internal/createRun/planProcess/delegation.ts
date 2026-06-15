import * as path from "node:path";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createCodingToolDefinitions, type CustomToolDefinition } from "@a5c-ai/genty-core";
import { invokeHarness } from "../../../invoker";
import {
  PARENT_PROMPT_TIMEOUT_MS,
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
  customTools?: CustomToolDefinition[];
  /**
   * When the delegated task declares a JSON output schema, enforce it on the
   * built-in agent-core worker via the provider's structured-output mode
   * (`response_format: json_schema`). This guarantees the worker returns
   * schema-conforming JSON instead of free-form prose/markdown, so the caller's
   * result coercion cannot fail in a retry loop. Only honored for the built-in
   * agent-core harness; external CLI harnesses ignore it.
   */
  outputSchema?: AgentCoreSessionOptions["outputSchema"];
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
    const effectiveToolsMode = args.toolsMode ?? "coding";
    // genty-core's session does NOT auto-build a tool surface from `toolsMode`;
    // it only exposes the tools passed via `customTools`. Without this, the
    // delegated worker is TOOLLESS — it cannot read/write files and instead
    // returns a description (e.g. a `cmd` string) of work it never performed,
    // so the file is never created. Build the focused coding/readonly file +
    // bash tools so the worker can actually act. Caller-supplied customTools
    // (e.g. the planning-phase babysitter tools) are appended.
    const workerTools = effectiveToolsMode === "default"
      ? args.customTools
      : [
          ...createCodingToolDefinitions(
            { workspace, interactive: false },
            effectiveToolsMode === "readonly" ? "readonly" : "coding",
          ),
          ...(args.customTools ?? []),
        ];
    const session = createAgentCoreSession({
      workspace,
      model: args.model,
      timeout: args.timeout,
      toolsMode: effectiveToolsMode,
      ...(workerTools?.length ? { customTools: workerTools } : {}),
      ephemeral: true,
      ...(args.outputSchema
        ? {
            outputFormat: "json_schema" as const,
            outputSchema: args.outputSchema,
            // Non-strict: process-authored schemas often omit the
            // `additionalProperties:false` / fully-required shape that
            // provider strict mode demands. We only need a conforming JSON
            // object, which non-strict json_schema still guarantees.
            outputSchemaStrict: false,
          }
        : {}),
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
        timeout: args.timeout ?? PARENT_PROMPT_TIMEOUT_MS,
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
