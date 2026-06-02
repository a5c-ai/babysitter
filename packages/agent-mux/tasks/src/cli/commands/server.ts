import { Command } from "commander";
import { printError } from "../output.js";

interface GlobalOpts {
  serverUrl?: string;
  json?: boolean;
  responderDir?: string;
  repoRoot?: string;
  configRoot?: string;
}

export function createServerCommand(): Command {
  const cmd = new Command("server").description("Server management commands");

  cmd
    .command("start")
    .description("Start the tasks-mux MCP server (stdio)")
    .action(async (_opts, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        if (allOpts.responderDir) {
          process.env.BMUX_RESPONDER_DIR = allOpts.responderDir;
        }
        if (allOpts.repoRoot) {
          process.env.BMUX_REPO_ROOT = allOpts.repoRoot;
        }
        if (allOpts.configRoot) {
          process.env.BMUX_CONFIG_ROOT = allOpts.configRoot;
        }

        // Dynamically import the MCP server to avoid heavy dependency at load time
        const { startBreakpointMcpServer } = await import("../../mcp/index.js");

        if (!jsonMode) {
          console.error("Starting tasks-mux MCP server on stdio...");
        }

        await startBreakpointMcpServer();
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}
