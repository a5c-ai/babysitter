import * as path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { DEFAULTS } from "../../config";
import {
  readSessionFile,
  sessionFileExists,
  getSessionFilePath,
  writeSessionFile,
  getCurrentTimestamp,
} from "../../session";
import type { SessionState } from "../../session";
import { loadJournal } from "../../storage";
import { countPendingEffectsFromJournal, deriveObservedRunState } from "../../runtime/runLifecycleState";
import { toolResult, toolError } from "../util/errors";
import { resolveRunDir } from "../util/resolve-run-dir";
import { registerMcpTool } from "../util/registerTool";

export function registerSessionTools(server: McpServer): void {
  // ── session_init ────────────────────────────────────────────────────
  registerMcpTool(
    server,
    "session_init",
    {
      description: "Initialize a new session state for orchestration",
      inputSchema: {
        sessionId: z.string().describe("The session ID to initialize"),
        stateDir: z.string().describe("Directory to store session state files"),
        maxIterations: z
          .number()
          .optional()
          .describe("Maximum number of iterations (default 65000)"),
        runId: z
          .string()
          .optional()
          .describe("Optional run ID to associate immediately"),
        prompt: z
          .string()
          .optional()
          .describe("Optional prompt text for the session"),
      },
    },
    async (args) => {
      try {
        const stateDir = path.resolve(args.stateDir);
        const maxIterations = args.maxIterations ?? DEFAULTS.maxIterations;
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
          runIds: [],
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
  registerMcpTool(
    server,
    "session_associate",
    {
      description: "Associate a session with a run ID",
      inputSchema: {
        sessionId: z.string().describe("The session ID to associate"),
        stateDir: z.string().describe("Directory containing session state files"),
        runId: z.string().describe("The run ID to associate with"),
      },
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
  registerMcpTool(
    server,
    "session_resume",
    {
      description: "Resume an existing run in a new session",
      inputSchema: {
        sessionId: z.string().describe("The session ID for the new session"),
        stateDir: z.string().describe("Directory to store session state files"),
        runId: z.string().describe("The run ID to resume"),
        maxIterations: z
          .number()
          .optional()
          .describe("Maximum number of iterations (default 65000)"),
        runsDir: z.string().optional().describe("Override runs directory path"),
      },
    },
    async (args) => {
      try {
        const stateDir = path.resolve(args.stateDir);
        const runsDir = resolveRunDir(args.runsDir);
        const runDir = path.join(runsDir, args.runId);
        const maxIterations = args.maxIterations ?? DEFAULTS.maxIterations;

        // Check run state from journal
        let runState = "unknown";
        try {
          const journal = await loadJournal(runDir);
          runState = deriveObservedRunState(journal, countPendingEffectsFromJournal(journal));
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
          runIds: [],
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
  registerMcpTool(
    server,
    "session_state",
    {
      description: "Get the current state of a session",
      inputSchema: {
        sessionId: z.string().describe("The session ID to query"),
        stateDir: z.string().describe("Directory containing session state files"),
      },
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
