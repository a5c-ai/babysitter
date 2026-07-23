import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { execSync } from "child_process";
import * as path from "path";
import { initI18n, t } from "./i18n.js";
import { OmpDeterministicDriver } from "./driver.js";

const PLUGIN_ROOT = path.resolve(__dirname, "..");

const COMMANDS = [
  "assimilate",
  "call",
  "cleanup",
  "contrib",
  "doctor",
  "forever",
  "help",
  "observe",
  "plan",
  "plugins",
  "project-install",
  "resume",
  "retrospect",
  "user-install",
  "yolo",
] as const;

function toSkillPrompt(name: string, args: string): string {
  return `/skill:${name}${args ? ` ${args}` : ""}`;
}

/**
 * Run a proxied hook script and return parsed JSON result.
 * Returns empty object on failure (hooks are best-effort).
 */
function runProxiedHook(
  scriptName: string,
  inputData?: Record<string, unknown>
): Record<string, unknown> {
  const scriptPath = path.join(PLUGIN_ROOT, "hooks", scriptName);
  try {
    const result = execSync(`node "${scriptPath}"`, {
      input: inputData ? JSON.stringify(inputData) : undefined,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
      env: {
        ...process.env,
        OMP_PLUGIN_ROOT: PLUGIN_ROOT,
      },
    });
    return JSON.parse(result.toString("utf8").trim());
  } catch {
    // Hooks are best-effort -- never break the extension
    return {};
  }
}

export default function activate(pi: ExtensionAPI): void {
  initI18n(pi);
  const driver = new OmpDeterministicDriver({
    cwd: process.cwd(),
    runCli: async (args, timeoutMs) => {
      const result = await pi.exec("babysitter", args, {
        cwd: process.cwd(),
        timeout: timeoutMs ?? 120_000,
      });
      return {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        killed: result.killed,
      };
    },
  });

  pi.registerTool({
    name: "babysitter_agent_complete",
    label: "Complete owned Babysitter agent effect",
    description: "Durably deliver the final value for the one Babysitter agent effect identified by a BABYSITTER_OMP_BRIDGE descriptor. Call only when the assignment explicitly provides that descriptor.",
    parameters: pi.zod.object({
      runDir: pi.zod.string(),
      effectId: pi.zod.string(),
      invocationKey: pi.zod.string(),
      ownerName: pi.zod.string(),
      dispatchToken: pi.zod.string(),
      model: pi.zod.string().optional(),
      value: pi.zod.unknown(),
    }),
    approval: "exec",
    async execute(_toolCallId, params) {
      try {
        const completion = await driver.completeAgentOwnerValue(params);
        return {
          content: [{ type: "text", text: JSON.stringify(completion, null, 2) }],
          details: completion,
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
          details: { handled: true },
          isError: true,
        };
      }
    },
  });

  pi.registerTool({
    name: "babysitter_drive",
    label: "Babysitter deterministic driver",
    description: "Deterministically execute and checkpoint Babysitter shell effects, post completed results, and iterate until an agent or human decision is required.",
    parameters: pi.zod.object({
      i: pi.zod.string().describe("Concise intent"),
      runDir: pi.zod.string().describe("Absolute Babysitter run directory"),
    }),
    approval: "exec",
    async execute(_toolCallId, params) {
      try {
        const result = await driver.drive(params.runDir);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: result,
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
          details: { state: "operator_attention" },
          isError: true,
        };
      }
    },
  });

  pi.on("tool_call", async (event) => {
    if (event.toolName !== "task") return;
    const decision = await driver.claimAgentToolCall(event.input, event.toolCallId);
    if (decision.block) return { block: true, reason: decision.reason };
  });

  pi.on("tool_result", async (event) => {
    if (event.toolName !== "task") return;
    try {
      const completion = await driver.completeAgentToolCall({
        toolCallId: event.toolCallId,
        input: event.input,
        details: event.details,
        isError: event.isError,
      });
      if (!completion.handled) return;
      const message = completion.continuation
        ? `Babysitter deterministic continuation:\n${JSON.stringify(completion.continuation, null, 2)}`
        : completion.reason;
      if (!message) return;
      return {
        content: [...event.content, { type: "text", text: message }],
      };
    } catch (error) {
      return {
        content: [
          ...event.content,
          { type: "text", text: `Babysitter driver stopped: ${error instanceof Error ? error.message : String(error)}` },
        ],
        isError: true,
      };
    }
  });


  // ---------------------------------------------------------------------------
  // Trigger session-start hook on activation
  // ---------------------------------------------------------------------------
  runProxiedHook("babysitter-proxied-session-start.js", {
    event: "session_start",
    cwd: process.cwd(),
  });

  // ---------------------------------------------------------------------------
  // Register slash commands (unchanged from legacy)
  // ---------------------------------------------------------------------------
  const forwardBabysit = async (args: unknown) => {
    pi.sendUserMessage(toSkillPrompt("babysit", String(args ?? "").trim()));
  };

  pi.registerCommand("babysit", {
    description: "Load the Babysitter orchestration skill",
    handler: forwardBabysit,
  });

  pi.registerCommand("babysitter", {
    description: "Alias for /babysit",
    handler: forwardBabysit,
  });

  for (const name of COMMANDS) {
    const forward = async (args: unknown) => {
      pi.sendUserMessage(toSkillPrompt(name, String(args ?? "").trim()));
    };

    pi.registerCommand(name, {
      description: name === "doctor"
        ? t("command.doctor.description", "Open the Babysitter doctor skill")
        : `Open the Babysitter ${name} skill`,
      handler: forward,
    });

    pi.registerCommand(`babysitter:${name}`, {
      description: name === "doctor"
        ? t("command.doctor.aliasDescription", "Alias for /doctor")
        : `Alias for /${name}`,
      handler: forward,
    });
  }
}
