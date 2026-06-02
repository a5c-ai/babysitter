import { Type } from "@sinclair/typebox";
import { buildShellInvocation } from "@a5c-ai/tula-runtime";
import type { AgenticToolOptions, CustomToolDefinition } from "../types";
import { DEFAULT_BASH_TIMEOUT, DEFAULT_SEARCH_TIMEOUT, spawnAsync } from "../shared/process";
import { jsonResult } from "../shared/results";
import { resolveSafe } from "../shared/paths";
import { getBackgroundRegistry } from "../background/state";

export function createExecutionTools(options: AgenticToolOptions): CustomToolDefinition[] {
  const { workspace } = options;

  return [
    {
      name: "bash",
      label: "Shell Execute",
      description:
        "Execute a shell command in the workspace. Returns stdout, stderr, and exit code.",
      parameters: Type.Object({
        command: Type.String({ description: "Shell command to execute" }),
        env: Type.Optional(Type.Record(Type.String(), Type.String(), {
          description: "Extra environment variables",
        })),
        timeout: Type.Optional(Type.Number({ description: "Timeout in ms (default: 120000)" })),
        cwd: Type.Optional(Type.String({ description: "Working directory (relative to workspace)" })),
        run_in_background: Type.Optional(Type.Boolean({
          description: "Run the command in the background and return immediately.",
        })),
        description: Type.Optional(Type.String({
          description: "Human-readable description for the background task.",
        })),
      }),
      execute: async (_toolCallId, params) => {
        const cwd = params.cwd ? resolveSafe(workspace, String(params.cwd)) : workspace;

        if (params.run_in_background === true) {
          const record = getBackgroundRegistry(options).spawn({
            command: String(params.command),
            cwd,
            env: (params.env as Record<string, string>) ?? undefined,
            description: params.description ? String(params.description) : undefined,
            onComplete: options.onBackgroundComplete
              ? (event) => options.onBackgroundComplete!(event)
              : undefined,
          });
          return jsonResult({
            backgroundTaskId: record.backgroundTaskId,
            status: record.status,
            pid: record.pid,
            command: record.command,
            description: record.description,
          });
        }

        const shellInvocation = buildShellInvocation(String(params.command));
        const result = await spawnAsync(shellInvocation.command, shellInvocation.args, {
          cwd,
          env: (params.env as Record<string, string>) ?? undefined,
          timeout: (params.timeout as number) ?? DEFAULT_BASH_TIMEOUT,
        });
        return jsonResult({
          output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
          exitCode: result.exitCode,
        });
      },
    },
    {
      name: "python",
      label: "Python Execute",
      description: "Execute Python code cells sequentially.",
      parameters: Type.Object({
        cells: Type.Array(
          Type.Object({ code: Type.String({ description: "Python code to execute" }) }),
          { description: "Code cells to run" },
        ),
        timeout: Type.Optional(Type.Number({ description: "Timeout in ms (default: 120000)" })),
        cwd: Type.Optional(Type.String({ description: "Working directory (relative to workspace)" })),
      }),
      execute: async (_toolCallId, params) => {
        const cwd = params.cwd ? resolveSafe(workspace, String(params.cwd)) : workspace;
        const result = await spawnAsync(
          process.platform === "win32" ? "python" : "python3",
          ["-c", (params.cells as Array<{ code: string }>).map((cell) => cell.code).join("\n")],
          { cwd, timeout: (params.timeout as number) ?? DEFAULT_BASH_TIMEOUT },
        );
        return jsonResult({
          output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
          exitCode: result.exitCode,
        });
      },
    },
    {
      name: "ssh",
      label: "SSH Execute",
      description: "Execute a command on a remote host via SSH.",
      parameters: Type.Object({
        host: Type.String({ description: "SSH host (user@host)" }),
        command: Type.String({ description: "Command to execute remotely" }),
        cwd: Type.Optional(Type.String({ description: "Remote working directory" })),
        timeout: Type.Optional(Type.Number({ description: "Timeout in ms (default: 120000)" })),
      }),
      execute: async (_toolCallId, params) => {
        const remoteCommand = params.cwd
          ? `cd ${String(params.cwd)} && ${String(params.command)}`
          : String(params.command);
        const result = await spawnAsync(
          "ssh",
          ["-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes", String(params.host), remoteCommand],
          { cwd: workspace, timeout: (params.timeout as number) ?? DEFAULT_BASH_TIMEOUT },
        );
        return jsonResult({
          output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
          exitCode: result.exitCode,
        });
      },
    },
    {
      name: "fetch",
      label: "HTTP Fetch",
      description: "Make an HTTP request and return the response body.",
      parameters: Type.Object({
        url: Type.String({ description: "URL to fetch" }),
        timeout: Type.Optional(Type.Number({ description: "Timeout in ms (default: 30000)" })),
        raw: Type.Optional(Type.Boolean({ description: "Return raw response without truncation" })),
      }),
      execute: async (_toolCallId, params) => {
        const controller = new AbortController();
        const timer = setTimeout(
          () => controller.abort(),
          (params.timeout as number) ?? DEFAULT_SEARCH_TIMEOUT,
        );
        try {
          const response = await globalThis.fetch(String(params.url), { signal: controller.signal });
          const text = await response.text();
          const maxLength = params.raw ? Infinity : 50_000;
          return jsonResult({
            status: response.status,
            statusText: response.statusText,
            body: text.length > maxLength ? `${text.slice(0, maxLength)}\n... (truncated)` : text,
          });
        } finally {
          clearTimeout(timer);
        }
      },
    },
  ];
}
