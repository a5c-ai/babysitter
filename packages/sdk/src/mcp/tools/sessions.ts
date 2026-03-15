import * as path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  getCurrentTimestamp,
} from "../../session";
import type { SessionState } from "../../session";
import { loadJournal } from "../../storage";
import { toolResult, toolError } from "../util/errors";
import { resolveRunDir } from "../util/resolve-run-dir";

export function registerSessionTools(server: McpServer): void {
  // ── session_init ────────────────────────────────────────────────────
  server.tool(
    "session_init",
    "Initialize a new session state for orchestration",
    {
      sessionId: z.string().describe("The session ID to initialize"),
      stateDir: z.string().describe("Directory to store session state files"),
      maxIterations: z
        .number()
        .optional()
        .describe("Maximum number of iterations (default 256)"),
      runId: z
        .string()
        .optional()
        .describe("Optional run ID to associate immediately"),
      prompt: z
        .string()
        .optional()
        .describe("Optional prompt text for the session"),
    },
    async (args) => {
      try {
        const stateDir = path.resolve(args.stateDir);
        const maxIterations = args.maxIterations ?? 256;
        const runId = args.runId ?? "";
        const prompt = args.prompt ?? "";

        const filePath = getSessionFilePath(stateDir, args.sessionId);

        // Check for existing session
        if (await sessionFileExists(filePath)) {
          try {
            const existing = await readSessionFile(filePath);
            if (existing.state.runId) {
              return toolError(
                `Session already associated with run: ${existing.state.runId}`
              );
            }
            return toolError(
              "A babysitter run is already active for this session"
            );
          } catch {
            return toolError(
              "Session state file exists but could not be read"
            );
          }
        }

        const now = getCurrentTimestamp();
        const state: SessionState = {
          active: true,
          iteration: 1,
          maxIterations,
          runId,
          startedAt: now,
          lastIterationAt: now,
          iterationTimes: [],
        };

        await writeSessionFile(filePath, state, prompt);

        return toolResult({
          stateFile: filePath,
          iteration: state.iteration,
          maxIterations: state.maxIterations,
          runId: state.runId,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── session_associate ───────────────────────────────────────────────
  server.tool(
    "session_associate",
    "Associate a session with a run ID",
    {
      sessionId: z.string().describe("The session ID to associate"),
      stateDir: z.string().describe("Directory containing session state files"),
      runId: z.string().describe("The run ID to associate with"),
    },
    async (args) => {
      try {
        const stateDir = path.resolve(args.stateDir);
        const filePath = getSessionFilePath(stateDir, args.sessionId);

        let existing;
        try {
          existing = await readSessionFile(filePath);
        } catch {
          return toolError(
            `No active session found. Expected state file: ${filePath}`
          );
        }

        if (existing.state.runId) {
          return toolError(
            `Session already associated with run: ${existing.state.runId}`
          );
        }

        const updatedState: SessionState = {
          ...existing.state,
          runId: args.runId,
        };

        await writeSessionFile(filePath, updatedState, existing.prompt);

        return toolResult({
          stateFile: filePath,
          runId: args.runId,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── session_resume ──────────────────────────────────────────────────
  server.tool(
    "session_resume",
    "Resume an existing run in a new session",
    {
      sessionId: z.string().describe("The session ID for the new session"),
      stateDir: z.string().describe("Directory to store session state files"),
      runId: z.string().describe("The run ID to resume"),
      maxIterations: z
        .number()
        .optional()
        .describe("Maximum number of iterations (default 256)"),
      runsDir: z.string().optional().describe("Override runs directory path"),
    },
    async (args) => {
      try {
        const stateDir = path.resolve(args.stateDir);
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);
        const maxIterations = args.maxIterations ?? 256;

        // Check run state from journal
        let runState = "unknown";
        try {
          const journal = await loadJournal(runDir);
          const hasCompleted = journal.some((e) => e.type === "RUN_COMPLETED");
          const hasFailed = journal.some((e) => e.type === "RUN_FAILED");
          if (hasCompleted) runState = "completed";
          else if (hasFailed) runState = "failed";
          else runState = "waiting";
        } catch {
          return toolError(`Run not found: ${args.runId}`);
        }

        if (runState === "completed") {
          return toolError(
            `Run is already completed. Cannot resume a completed run.`
          );
        }

        const filePath = getSessionFilePath(stateDir, args.sessionId);
        const prompt = `Resume Babysitter run: ${args.runId}\nCurrent state: ${runState}\nContinue orchestration using run:iterate, task:post, etc.`;

        const now = getCurrentTimestamp();
        const state: SessionState = {
          active: true,
          iteration: 1,
          maxIterations,
          runId: args.runId,
          startedAt: now,
          lastIterationAt: now,
          iterationTimes: [],
        };

        await writeSessionFile(filePath, state, prompt);

        return toolResult({
          stateFile: filePath,
          runId: args.runId,
          runState,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── session_state ───────────────────────────────────────────────────
  server.tool(
    "session_state",
    "Get the current state of a session",
    {
      sessionId: z.string().describe("The session ID to query"),
      stateDir: z.string().describe("Directory containing session state files"),
    },
    async (args) => {
      try {
        const stateDir = path.resolve(args.stateDir);
        const filePath = getSessionFilePath(stateDir, args.sessionId);

        if (!(await sessionFileExists(filePath))) {
          return toolResult({
            found: false,
            stateFile: filePath,
          });
        }

        const file = await readSessionFile(filePath);

        return toolResult({
          found: true,
          state: file.state,
          prompt: file.prompt,
          stateFile: filePath,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
