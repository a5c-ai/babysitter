import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

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

export default function activate(pi: ExtensionAPI): void {
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
      description: `Open the Babysitter ${name} skill`,
      handler: forward,
    });

    pi.registerCommand(`babysitter:${name}`, {
      description: `Alias for /${name}`,
      handler: forward,
    });
  }
}
