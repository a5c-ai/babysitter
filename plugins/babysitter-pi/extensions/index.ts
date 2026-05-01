import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { initI18n, t } from "./i18n.js";

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
  initI18n(pi);
  const forwardBabysit = async (args: unknown) => {
    pi.sendUserMessage(toSkillPrompt("babysit", String(args ?? "").trim()));
  };

  pi.registerCommand("babysit", {
    description: t("cmd.babysit.description", "Load the Babysitter orchestration skill"),
    handler: forwardBabysit,
  });

  pi.registerCommand("babysitter", {
    description: t("cmd.babysitter.description", "Alias for /babysit"),
    handler: forwardBabysit,
  });

  for (const name of COMMANDS) {
    const forward = async (args: unknown) => {
      pi.sendUserMessage(toSkillPrompt(name, String(args ?? "").trim()));
    };

    pi.registerCommand(name, {
      description: t("cmd.skill.description", `Open the Babysitter ${name} skill`, { name }),
      handler: forward,
    });

    pi.registerCommand(`babysitter:${name}`, {
      description: t("cmd.skill.alias", `Alias for /${name}`, { name }),
      handler: forward,
    });
  }
}
