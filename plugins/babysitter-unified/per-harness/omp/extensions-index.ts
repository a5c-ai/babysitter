import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { execSync } from "child_process";
import * as path from "path";
import { initI18n, t } from "./i18n.js";

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
