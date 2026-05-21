import { Command } from "commander";
import {
  ResponderClient,
  AnswerPoller,
} from "../../client/index.js";
import { formatBreakpoint, formatAnswer, formatTable, printError } from "../output.js";
import { createCliServerClient } from "../client-config.js";

interface GlobalOpts {
  serverUrl?: string;
  authToken?: string;
  json?: boolean;
  responderDir?: string;
}

interface PendingOpts {
  responder: string;
}

interface AnswerOpts {
  answer: string;
  responder: string;
  confidence?: string;
}

interface PollOpts {
  timeout?: string;
  interval?: string;
}

export function createBreakpointsCommand(): Command {
  const cmd = new Command("breakpoints").description("Manage breakpoints and answers");

  cmd
    .command("pending")
    .description("List pending breakpoints for a responder")
    .requiredOption("-e, --responder <responderId>", "Responder ID")
    .action(async (opts, command: Command) => {
      const allOpts: GlobalOpts & PendingOpts = command.optsWithGlobals();
      const localOpts = opts as PendingOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const responderClient = new ResponderClient(client, localOpts.responder);
        const breakpoints = await responderClient.fetchPendingBreakpoints();

        if (jsonMode) {
          console.log(JSON.stringify(breakpoints, null, 2));
        } else if (breakpoints.length === 0) {
          console.log("No pending breakpoints.");
        } else {
          const rows = breakpoints.map((b) => [
            b.id,
            b.status,
            b.text.length > 60 ? b.text.substring(0, 57) + "..." : b.text,
            b.createdAt,
          ]);
          console.log(formatTable(rows, ["ID", "Status", "Breakpoint", "Created"]));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("answer")
    .description("Submit an answer to a breakpoint")
    .argument("<breakpointId>", "Breakpoint ID")
    .requiredOption("-a, --answer <text>", "Answer text")
    .requiredOption("-e, --responder <responderId>", "Responder ID")
    .option("--confidence <number>", "Confidence level (0-100)", "80")
    .action(async (breakpointId: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts & AnswerOpts = command.optsWithGlobals();
      const localOpts = opts as unknown as AnswerOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const responderClient = new ResponderClient(client, localOpts.responder);
        const confidence = parseInt(localOpts.confidence ?? "80", 10);

        const answer = await responderClient.submitAnswer(
          breakpointId,
          localOpts.answer,
          confidence,
        );

        if (jsonMode) {
          console.log(JSON.stringify(answer, null, 2));
        } else {
          console.log(formatAnswer(answer, false));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("status")
    .description("Check breakpoint status")
    .argument("<breakpointId>", "Breakpoint ID")
    .action(async (breakpointId: string, _opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const breakpoint = await client.getBreakpoint(breakpointId);

        if (jsonMode) {
          console.log(JSON.stringify(breakpoint, null, 2));
        } else {
          console.log(formatBreakpoint(breakpoint, false));

          if (breakpoint.answers.length > 0) {
            console.log("\nAnswers:");
            for (const answer of breakpoint.answers) {
              console.log("");
              console.log(formatAnswer(answer, false));
            }
          }
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("poll")
    .description("Poll for an answer to a breakpoint")
    .argument("<breakpointId>", "Breakpoint ID")
    .option("-t, --timeout <seconds>", "Timeout in seconds", "300")
    .option("-i, --interval <seconds>", "Polling interval in seconds", "5")
    .action(async (breakpointId: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts & PollOpts = command.optsWithGlobals();
      const localOpts = opts as unknown as PollOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const poller = new AnswerPoller(client);

        const timeoutMs = parseInt(localOpts.timeout ?? "300", 10) * 1000;
        const pollIntervalMs = parseInt(localOpts.interval ?? "5", 10) * 1000;

        if (!jsonMode) {
          console.log(`Polling for answer to ${breakpointId}...`);
        }

        const result = await poller.waitForAnswer(breakpointId, {
          timeoutMs,
          pollIntervalMs,
          useSSE: true,
        });

        if (jsonMode) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatBreakpoint(result.breakpoint, false));
          if (result.answer) {
            console.log("");
            console.log(formatAnswer(result.answer, false));
          } else {
            console.log("\nNo answer received within timeout.");
          }
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}
