import type { HarnessParsedArgs } from "./types";

/**
 * Apply positional arguments based on the parsed command.
 *
 * Core positional logic (previously from SDK) is inlined here so
 * genty-cli does not import from @a5c-ai/babysitter-sdk.
 */
function applyCorePositionalArgs(parsed: HarnessParsedArgs, positionals: string[]): void {
  switch (parsed.command) {
    case "task:post":
    case "task:cancel":
    case "task:show":
      if (parsed.effectId) {
        [parsed.runDirArg] = positionals;
      } else {
        [parsed.runDirArg, parsed.effectId] = positionals;
      }
      return;
    case "task:list":
    case "run:assign-process":
    case "run:status":
    case "run:iterate":
    case "run:events":
    case "run:rebuild-state":
    case "run:repair-journal":
    case "run:recover-process-error":
      [parsed.runDirArg] = positionals;
      return;
    case "configure":
      [parsed.configureSubcommand] = positionals;
      return;
    case "tokens:stats":
      [parsed.tokensRunId] = positionals;
      return;
    case "cost:stats":
      [parsed.costRunId] = positionals;
      return;
    case "compression:toggle": {
      const [layer, onOff] = positionals;
      parsed.compressionLayer = layer;
      if (onOff !== undefined) {
        const normalized = onOff.toLowerCase();
        if (normalized !== "on" && normalized !== "off") {
          throw new Error(`compression:toggle value must be "on" or "off" (received: ${onOff})`);
        }
        parsed.compressionToggleValue = normalized === "on";
      }
      return;
    }
    case "compression:set":
      [parsed.compressionSetKey, parsed.compressionSetValue] = positionals;
      return;
    case "compress-output":
      parsed.compressOutputArgs = positionals;
      return;
    case "breakpoint:approve-rule":
      [parsed.breakpointPattern] = positionals;
      return;
    case "breakpoint:remove-rule":
      [parsed.breakpointRuleId] = positionals;
      return;
    case "breakpoint:should-auto-approve":
      [parsed.breakpointIdArg] = positionals;
      return;
  }

  if (parsed.command?.startsWith("plugin:")) {
    if (positionals.length > 0 && !parsed.pluginName) {
      [parsed.pluginName] = positionals;
    }
    return;
  }

  if (
    parsed.command === "invoke" ||
    parsed.command === "harness:install" ||
    parsed.command === "harness:install-plugin" ||
    parsed.command === "help" ||
    parsed.command === "tui"
  ) {
    parsed.positional = positionals;
    return;
  }

  if (parsed.command === "retrospect" || parsed.command === "doctor") {
    if (positionals.length > 0 && !parsed.runIdOverride) {
      [parsed.runIdOverride] = positionals;
    }
    return;
  }

  if (
    parsed.command === "cleanup" ||
    parsed.command === "assimilate" ||
    parsed.command === "contrib" ||
    parsed.command === "user-install" ||
    parsed.command === "project-install"
  ) {
    if (positionals.length > 0 && !parsed.prompt) {
      parsed.prompt = positionals.join(" ");
    }
  }
}

export function applyPositionalArgs(parsed: HarnessParsedArgs, positionals: string[]): void {
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
