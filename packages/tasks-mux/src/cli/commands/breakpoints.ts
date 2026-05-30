import { Command } from "commander";
import {
  ResponderClient,
  AnswerPoller,
} from "../../client/index.js";
import { formatBreakpoint, formatAnswer, formatTable, printError } from "../output.js";
import { createCliServerClient } from "../client-config.js";
import type { Breakpoint } from "../../types.js";

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

interface ListOpts {
  status?: string;
  responder?: string;
  limit?: string;
}

interface SearchOpts extends ListOpts {}

interface AssignOpts {
  responder: string;
}

interface CloseOpts {
  reason?: string;
}

interface ApproveOpts {
  answer?: string;
  responder: string;
  confidence?: string;
}

function breakpointRows(breakpoints: Breakpoint[]): string[][] {
  return breakpoints.map((b) => [
    b.id,
    b.status,
    b.claimedByResponderId ?? (b.routing.targetResponders.join(", ") || "(none)"),
    b.text.length > 60 ? b.text.substring(0, 57) + "..." : b.text,
    b.updatedAt,
  ]);
}

async function listBreakpointsForCli(
  client: Awaited<ReturnType<typeof createCliServerClient>>,
  opts: ListOpts,
): Promise<Breakpoint[]> {
  if (opts.responder) {
    return client.listPendingBreakpoints(opts.responder, { status: opts.status });
  }

  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  const qs = params.toString();
  return client.get<Breakpoint[]>(`/breakpoints${qs ? `?${qs}` : ""}`);
}

function filterBreakpoints(breakpoints: Breakpoint[], opts: { query?: string; status?: string; limit?: string }): Breakpoint[] {
  const query = opts.query?.toLowerCase();
  let filtered = breakpoints;
  if (opts.status) {
    filtered = filtered.filter((breakpoint) => breakpoint.status === opts.status);
  }
  if (query) {
    filtered = filtered.filter((breakpoint) => [
      breakpoint.id,
      breakpoint.text,
      breakpoint.context.description,
      breakpoint.context.domain,
      ...(breakpoint.context.tags ?? []),
      ...(breakpoint.routing.targetResponders ?? []),
    ].filter(Boolean).join(" ").toLowerCase().includes(query));
  }
  const limit = opts.limit ? parseInt(opts.limit, 10) : undefined;
  return Number.isFinite(limit) && limit !== undefined ? filtered.slice(0, limit) : filtered;
}

export function createBreakpointsCommand(): Command {
  const cmd = new Command("breakpoints").description("Manage breakpoints and answers");

  cmd
    .command("list")
    .description("List breakpoints")
    .option("--status <status>", "Filter by status")
    .option("-e, --responder <responderId>", "Filter by responder ID")
    .option("--limit <number>", "Maximum rows to return")
    .action(async (opts, command: Command) => {
      const allOpts: GlobalOpts & ListOpts = command.optsWithGlobals();
      const localOpts = opts as ListOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const breakpoints = await listBreakpointsForCli(client, localOpts);
        const filtered = filterBreakpoints(breakpoints, {
          status: localOpts.status,
          limit: localOpts.limit,
        });
        if (jsonMode) {
          console.log(JSON.stringify(filtered, null, 2));
        } else if (filtered.length === 0) {
          console.log("No breakpoints found.");
        } else {
          console.log(formatTable(breakpointRows(filtered), ["ID", "Status", "Assignee", "Breakpoint", "Updated"]));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("search")
    .description("Search breakpoints")
    .argument("<query>", "Search query")
    .option("--status <status>", "Filter by status")
    .option("-e, --responder <responderId>", "Filter by responder ID")
    .option("--limit <number>", "Maximum rows to return")
    .action(async (query: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts & SearchOpts = command.optsWithGlobals();
      const localOpts = opts as SearchOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const breakpoints = await listBreakpointsForCli(client, localOpts);
        const filtered = filterBreakpoints(breakpoints, {
          query,
          status: localOpts.status,
          limit: localOpts.limit,
        });
        if (jsonMode) {
          console.log(JSON.stringify(filtered, null, 2));
        } else if (filtered.length === 0) {
          console.log("No matching breakpoints.");
        } else {
          console.log(formatTable(breakpointRows(filtered), ["ID", "Status", "Assignee", "Breakpoint", "Updated"]));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("assign")
    .description("Assign a breakpoint to a responder")
    .argument("<breakpointId>", "Breakpoint ID")
    .requiredOption("-e, --responder <responderId>", "Responder ID")
    .action(async (breakpointId: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts & AssignOpts = command.optsWithGlobals();
      const localOpts = opts as unknown as AssignOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const breakpoint = await client.claimBreakpoint(breakpointId, localOpts.responder);
        console.log(jsonMode ? JSON.stringify(breakpoint, null, 2) : formatBreakpoint(breakpoint, false));
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("reassign")
    .description("Reassign a breakpoint to another responder")
    .argument("<breakpointId>", "Breakpoint ID")
    .requiredOption("-e, --responder <responderId>", "Responder ID")
    .action(async (breakpointId: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts & AssignOpts = command.optsWithGlobals();
      const localOpts = opts as unknown as AssignOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const breakpoint = await client.claimBreakpoint(breakpointId, localOpts.responder);
        console.log(jsonMode ? JSON.stringify(breakpoint, null, 2) : formatBreakpoint(breakpoint, false));
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("close")
    .description("Close a breakpoint")
    .argument("<breakpointId>", "Breakpoint ID")
    .option("--reason <text>", "Closure reason")
    .action(async (breakpointId: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts & CloseOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        await client.cancelBreakpoint(breakpointId);
        const result = { id: breakpointId, closed: true, reason: (opts as CloseOpts).reason };
        console.log(jsonMode ? JSON.stringify(result, null, 2) : `Closed breakpoint ${breakpointId}.`);
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("approve")
    .description("Approve a breakpoint")
    .argument("<breakpointId>", "Breakpoint ID")
    .requiredOption("-e, --responder <responderId>", "Responder ID")
    .option("-a, --answer <text>", "Approval answer text", "Approved.")
    .option("--confidence <number>", "Confidence level (0-100)", "100")
    .action(async (breakpointId: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts & ApproveOpts = command.optsWithGlobals();
      const localOpts = opts as unknown as ApproveOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });
        const responderClient = new ResponderClient(client, localOpts.responder);
        const answer = await responderClient.submitAnswer(
          breakpointId,
          localOpts.answer ?? "Approved.",
          parseInt(localOpts.confidence ?? "100", 10),
        );
        if (jsonMode) {
          console.log(JSON.stringify({ ...answer, approved: true }, null, 2));
        } else {
          console.log(formatAnswer({ ...answer, approved: true }, false));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

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
