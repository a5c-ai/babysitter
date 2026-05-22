import * as path from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v3";
import { runHealthCheck } from "../../cli/commands/health";
import { configureShow } from "../../cli/commands/configure";
import { discoverSkillsInternal } from "../../cli/commands/skill";
import { getActiveProcessLibraryPath } from "../../processLibrary/active";
import { toolResult, toolError } from "../util/errors";

export function registerDiscoveryTools(server: McpServer): void {
  // ── skill_discover ──────────────────────────────────────────────────
  server.tool(
    "skill_discover",
    "Discover available skills, agents, and process definitions",
    {
      pluginRoot: z
        .string()
        .optional()
        .describe("Plugin root directory to scan for skills (resolved from env vars if omitted)"),
      runId: z
        .string()
        .optional()
        .describe("Run ID for domain-scoped discovery"),
      runsDir: z.string().optional().describe("Override runs directory path"),
      includeRemote: z
        .boolean()
        .optional()
        .describe("Include remote skill sources"),
      processPath: z
        .string()
        .optional()
        .describe("Process file path for specialization scoping"),
    },
    async (args) => {
      try {
        const pluginRoot = args.pluginRoot ? path.resolve(args.pluginRoot) : undefined;
        const libraryPath = await getActiveProcessLibraryPath();

        const result = await discoverSkillsInternal({
          pluginRoot,
          libraryPath: libraryPath || undefined,
          runId: args.runId,
          runsDir: args.runsDir,
          includeRemote: args.includeRemote,
          processPath: args.processPath,
          includeProcesses: true,
        });

        return toolResult({
          skills: result.skills,
          agents: result.agents,
          processes: result.processes,
          summary: result.summary,
          cached: result.cached,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── health ──────────────────────────────────────────────────────────
  server.tool(
    "health",
    "Check the health and configuration status of the babysitter installation",
    {},
    async () => {
      try {
        const result = await runHealthCheck({ json: true });

        return toolResult({
          status: result.status,
          summary: result.summary,
          checks: result.checks,
          nextSteps: result.nextSteps,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // ── configure_show ──────────────────────────────────────────────────
  server.tool(
    "configure_show",
    "Show current babysitter configuration and environment",
    {},
    () => {
      try {
        const result = configureShow({});

        return toolResult({
          values: result.values,
          timestamp: result.timestamp,
        });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
