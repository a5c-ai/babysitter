import { Command } from "commander";
import {
  ResponderClient,
} from "../../client/index.js";
import type { Breakpoint } from "../../types.js";
import { formatTable, printError } from "../output.js";
import { createCliServerClient } from "../client-config.js";

interface GlobalOpts {
  serverUrl?: string;
  authToken?: string;
  json?: boolean;
  responderDir?: string;
}

interface ResponderLoopOpts {
  responder: string;
  interval?: string;
  once?: boolean;
}

export function createResponderLoopCommand(): Command {
  const cmd = new Command("responder-loop")
    .description("Start a polling loop to check for new breakpoints")
    .requiredOption("-e, --responder <responderId>", "Responder ID")
    .option("-i, --interval <seconds>", "Polling interval in seconds", "30")
    .option("--once", "Check once and exit (for agent integration)", false)
    .action(async (opts, command: Command) => {
      const allOpts: GlobalOpts & ResponderLoopOpts = command.optsWithGlobals();
      const localOpts = opts as ResponderLoopOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const responderClient = new ResponderClient(client, localOpts.responder);
        const intervalMs = parseInt(localOpts.interval ?? "30", 10) * 1000;

        if (localOpts.once) {
          // Single check mode
          const breakpoints = await responderClient.fetchPendingBreakpoints();
          displayBreakpoints(breakpoints, jsonMode);
          return;
        }

        // Continuous polling mode
        if (!jsonMode) {
          console.log(
            `Starting responder loop for ${localOpts.responder} (interval: ${localOpts.interval ?? "30"}s)`,
          );
          console.log("Press Ctrl+C to stop.\n");
        }

        const stop = responderClient.startPollingLoop(
          (breakpoints: Breakpoint[]) => {
            displayBreakpoints(breakpoints, jsonMode);
          },
          intervalMs,
        );

        // Handle graceful shutdown
        const shutdown = (): void => {
          stop();
          if (!jsonMode) {
            console.log("\nResponder loop stopped.");
          }
          process.exit(0);
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);

        // Keep the process alive
        await new Promise<void>(() => {
          // This promise never resolves; the process is kept alive
          // until SIGTERM/SIGINT is received.
        });
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}

function displayBreakpoints(breakpoints: Breakpoint[], jsonMode: boolean): void {
  if (jsonMode) {
    console.log(JSON.stringify(breakpoints, null, 2));
    return;
  }

  if (breakpoints.length === 0) {
    console.log("No pending breakpoints.");
    return;
  }

  console.log(`Found ${breakpoints.length} pending breakpoint(s):\n`);

  const rows = breakpoints.map((b) => [
    b.id,
    b.status,
    b.text.length > 60 ? b.text.substring(0, 57) + "..." : b.text,
    b.routing.strategy,
    b.createdAt,
  ]);

  console.log(formatTable(rows, ["ID", "Status", "Breakpoint", "Strategy", "Created"]));
  console.log("");
}
