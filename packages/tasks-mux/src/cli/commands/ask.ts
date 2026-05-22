import { Command } from "commander";
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import {
  AnswerPoller,
} from "../../client/index.js";
import type { BreakpointStrategy, BreakpointContext, BreakpointRouting } from "../../types.js";
import { DEFAULT_POLL_INTERVAL_MS } from "../../types.js";
import { formatBreakpoint, formatAnswer, printError } from "../output.js";
import { createCliServerClient } from "../client-config.js";

interface GlobalOpts {
  serverUrl?: string;
  authToken?: string;
  json?: boolean;
  responderDir?: string;
}

interface AskOpts {
  question: string;
  context?: string;
  contextFile?: string;
  markdown?: string;
  markdownFile?: string;
  code?: string[];
  fileRef?: string[];
  tag?: string[];
  link?: string[];
  responders?: string;
  project?: string;
  repo?: string;
  strategy?: string;
  timeout?: string;
  wait?: boolean;
  openBrowser?: boolean;
  answererId?: string;
  answererName?: string;
}

function collectValues(value: string, previous: string[] = []): string[] {
  previous.push(value);
  return previous;
}

function parseContextFile(filePath: string): Partial<BreakpointContext> {
  const raw = readFileSync(filePath, "utf-8");
  if (filePath.toLowerCase().endsWith(".json")) {
    return JSON.parse(raw) as Partial<BreakpointContext>;
  }
  return { description: raw };
}

function parseLinks(values: string[] = []): ContextLinkInput[] {
  return values.map((value) => {
    const [label, url] = value.includes("=") ? value.split(/=(.*)/s, 2) : [value, value];
    return {
      label: label.trim(),
      url: url.trim(),
      kind: "reference" as const,
    };
  });
}

function buildBreakpointContext(opts: AskOpts): BreakpointContext {
  const fileContext = opts.contextFile ? parseContextFile(opts.contextFile) : {};
  const markdownFromFile = opts.markdownFile ? readFileSync(opts.markdownFile, "utf-8") : undefined;
  const parsedLinks = parseLinks(opts.link);

  return {
    description: opts.context ?? fileContext.description ?? "",
    codeSnippets: opts.code ?? fileContext.codeSnippets ?? [],
    fileReferences: opts.fileRef ?? fileContext.fileReferences ?? [],
    tags: opts.tag ?? fileContext.tags ?? [],
    title: fileContext.title,
    summary: fileContext.summary,
    markdown: opts.markdown ?? markdownFromFile ?? fileContext.markdown,
    links: (parsedLinks.length > 0 ? parsedLinks : fileContext.links) as BreakpointContext["links"],
    sections: fileContext.sections,
    artifacts: fileContext.artifacts,
    metadata: fileContext.metadata,
  };
}

function openBrowser(url: string): void {
  if (process.env.VITEST || process.env.CI || process.env.NODE_ENV === "test" || process.env.BMUX_NO_BROWSER) return;
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

export function createAskCommand(): Command {
  const cmd = new Command("ask")
    .description("Submit a breakpoint to responders")
    .requiredOption("-q, --question <text>", "Breakpoint text")
    .option("-c, --context <text>", "Additional context for the breakpoint", "")
    .option("--context-file <path>", "Load structured context from a JSON or text file")
    .option("--markdown <text>", "Markdown body to render in the browser session")
    .option("--markdown-file <path>", "Load markdown body from a file")
    .option("--code <snippet>", "Add a code snippet to the context", collectValues, [])
    .option("--file-ref <path>", "Add a file reference to the context", collectValues, [])
    .option("--tag <tag>", "Add a tag to the context", collectValues, [])
    .option("--link <label=url>", "Add a rich reference link to the context", collectValues, [])
    .option("-e, --responders <ids>", "Comma-separated list of responder IDs")
    .requiredOption("-p, --project <id>", "Associate the breakpoint with a project ID")
    .requiredOption("-r, --repo <id>", "Associate the breakpoint with a repository ID")
    .option(
      "-s, --strategy <strategy>",
      "Routing strategy (single, first-response-wins, collect-all, quorum)",
      "first-response-wins",
    )
    .option("-t, --timeout <seconds>", "Timeout in seconds", "300")
    .option("-w, --wait", "Wait for an answer before returning", false)
    .option("--open-browser", "Open a browser session for answering", false)
    .option("--answerer-id <id>", "Identity to attach to browser-session answers")
    .option("--answerer-name <name>", "Display name for browser-session answers")
    .action(async (opts, command: Command) => {
      const allOpts: GlobalOpts & AskOpts = command.optsWithGlobals();
      const localOpts = opts as AskOpts;
      const jsonMode = allOpts.json === true;

      try {
        const client = await createCliServerClient({
          serverUrl: allOpts.serverUrl,
          authToken: allOpts.authToken,
        });

        const timeoutMs = parseInt(localOpts.timeout ?? "300", 10) * 1000;
        const responderIds = localOpts.responders
          ? localOpts.responders.split(",").map((e: string) => e.trim())
          : [];
        const projectId = localOpts.project?.trim();
        const repoId = localOpts.repo?.trim();
        if (!projectId || !repoId) {
          throw new Error("Both --project and --repo are required.");
        }

        const context = buildBreakpointContext(localOpts);

        const routing: BreakpointRouting = {
          strategy: (localOpts.strategy ?? "first-response-wins") as BreakpointStrategy,
          targetResponders: responderIds,
          timeoutMs,
          presentToUser: false,
        };

        const breakpoint = await client.submitBreakpoint({
          text: localOpts.question,
          context,
          routing,
          projectId,
          repoId,
        });

        let browserSession;
        if (localOpts.wait || localOpts.openBrowser) {
          browserSession = await client.createBrowserSession(breakpoint.id, {
            mode: "same-user",
            responderId: localOpts.answererId,
            responderName: localOpts.answererName,
          });

          try {
            openBrowser(browserSession.url);
          } catch {
            // Opening the browser is best-effort. The URL is still surfaced below.
          }
        }

        if (localOpts.wait) {
          const poller = new AnswerPoller(client);
          const result = await poller.waitForAnswer(breakpoint.id, {
            timeoutMs,
            pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
            useSSE: true,
          });

          if (jsonMode) {
            console.log(JSON.stringify({ ...result, browserSession }, null, 2));
          } else {
            console.log(formatBreakpoint(result.breakpoint, false));
            if (browserSession) {
              console.log(`\nBrowser session: ${browserSession.url}`);
            }
            if (result.answer) {
              console.log("");
              console.log(formatAnswer(result.answer, false));
            } else {
              console.log("\nNo answer received within timeout.");
            }
          }
        } else {
          if (jsonMode) {
            console.log(JSON.stringify({ breakpoint, browserSession }, null, 2));
          } else {
            console.log(formatBreakpoint(breakpoint, false));
            if (browserSession) {
              console.log(`\nBrowser session: ${browserSession.url}`);
            }
            console.log(`\nUse "tasks-mux breakpoints poll ${breakpoint.id}" to wait for answers.`);
          }
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}
interface ContextLinkInput {
  label: string;
  url: string;
  kind?: "reference" | "repo" | "artifact" | "external";
}
