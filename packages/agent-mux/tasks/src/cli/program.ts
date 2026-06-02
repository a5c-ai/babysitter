import { Command } from "commander";
import { createAskCommand } from "./commands/ask.js";
import { createRespondersCommand } from "./commands/responders.js";
import { createBreakpointsCommand } from "./commands/breakpoints.js";
import { createServerCommand } from "./commands/server.js";
import { createResponderLoopCommand } from "./commands/responder-loop.js";
import { createAuthCommand } from "./commands/auth.js";
import { createTasksCommand } from "./commands/tasks.js";
import { createTemplatesCommand } from "./commands/templates.js";
import { createRulesCommand } from "./commands/rules.js";
import { DEFAULT_BMUX_SERVER_URL } from "../client/index.js";

/**
 * Create and configure the main CLI program.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name("agent-mux-tasks")
    .version("5.0.0")
    .description("CLI for Breakpoints Mux - route breakpoints to domain responders")
    .option(
      "--server-url <url>",
      `Server URL (defaults to ${DEFAULT_BMUX_SERVER_URL})`,
    )
    .option("--auth-token <token>", "Bearer token for BMUX API access")
    .option("--json", "Output in JSON format", false)
    .option(
      "--responder-dir <path>",
      "Responder profile directory, relative to the associated repo or config root when not absolute",
    )
    .option(
      "--repo-root <path>",
      "Associated repository root for resolving .a5c-based configuration",
    )
    .option(
      "--config-root <path>",
      "Associated configuration root (.a5c) for resolving repo-scoped responder config",
    );

  // Register subcommands
  program.addCommand(createAskCommand());
  program.addCommand(createRespondersCommand());
  program.addCommand(createBreakpointsCommand());
  program.addCommand(createTasksCommand());
  program.addCommand(createTemplatesCommand());
  program.addCommand(createRulesCommand());
  program.addCommand(createServerCommand());
  program.addCommand(createResponderLoopCommand());
  program.addCommand(createAuthCommand());

  return program;
}
