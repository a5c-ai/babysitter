import type { OpenClawPluginAPI } from "openclaw";
import { sessionStartHandler } from "./hooks/session-start.js";
import { sessionEndHandler } from "./hooks/session-end.js";
import { beforePromptBuildHandler } from "./hooks/before-prompt-build.js";
import { agentEndHandler } from "./hooks/agent-end.js";

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

export default function activate(api: OpenClawPluginAPI): void {
  // Register programmatic hooks via the OpenClaw Plugin SDK api.on() method.
  // These delegate to babysitter hook:run — no logic lives here.
  api.on("session_start", sessionStartHandler);
  api.on("session_end", sessionEndHandler);
  api.on("before_prompt_build", beforePromptBuildHandler);
  api.on("agent_end", agentEndHandler);

  // Register slash commands that forward to babysitter skills
  const forwardBabysit = async (args: unknown) => {
    api.sendUserMessage(toSkillPrompt("babysit", String(args ?? "").trim()));
  };

  api.registerCommand("babysit", {
    description: "Load the Babysitter orchestration skill",
    handler: forwardBabysit,
  });

  api.registerCommand("babysitter", {
    description: "Alias for /babysit",
    handler: forwardBabysit,
  });

  for (const name of COMMANDS) {
    const forward = async (args: unknown) => {
      api.sendUserMessage(toSkillPrompt(name, String(args ?? "").trim()));
    };

    api.registerCommand(name, {
      description: `Open the Babysitter ${name} skill`,
      handler: forward,
    });

    api.registerCommand(`babysitter:${name}`, {
      description: `Alias for /${name}`,
      handler: forward,
    });
  }
}
