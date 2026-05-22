import { applyPositionalArgs as applyCorePositionalArgs } from "@a5c-ai/babysitter-sdk";
import type { HarnessParsedArgs } from "./types";

export function applyPositionalArgs(parsed: HarnessParsedArgs, positionals: string[]) {
  applyCorePositionalArgs(parsed, positionals);

  if (parsed.command === "anycli") {
    if (
      !parsed.anycliService &&
      positionals.length > 0 &&
      /^[a-zA-Z0-9-]+$/.test(positionals[0])
    ) {
      [parsed.anycliService] = positionals;
      positionals = positionals.slice(1);
    }
    if (positionals.length > 0 && !parsed.prompt) {
      parsed.prompt = positionals.join(" ");
    }
  }
}
