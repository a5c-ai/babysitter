import { Type } from "@sinclair/typebox";
import { buildShellInvocation } from "@a5c-ai/agent-runtime";
import type { AgenticToolOptions, CustomToolDefinition, ToolExecutionContext, ToolUpdateEvent } from "../types";
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
      metadata: {
        category: "shell",
        tags: ["local", "process"],
        requiresApproval: "on-risk",
        cost: { unit: "free" },
      },
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
      execute: async (toolCallId, params, onUpdate, toolContext) => {
        const context = resolveToolExecutionContext(options, toolContext);
        const updates = createUpdateEmitter(toolCallId, onUpdate);
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
          timeout: (params.timeout as number) ?? context.limits?.timeoutMs ?? DEFAULT_BASH_TIMEOUT,
          signal: context.signal,
          maxOutputBytes: context.limits?.maxOutputBytes,
          onStdout: updates.stdout,
          onStderr: updates.stderr,
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
      metadata: {
        category: "code",
        tags: ["python", "process"],
        requiresApproval: "on-risk",
        cost: { unit: "free" },
      },
      parameters: Type.Object({
        cells: Type.Array(
          Type.Object({ code: Type.String({ description: "Python code to execute" }) }),
          { description: "Code cells to run" },
        ),
        timeout: Type.Optional(Type.Number({ description: "Timeout in ms (default: 120000)" })),
        cwd: Type.Optional(Type.String({ description: "Working directory (relative to workspace)" })),
      }),
      execute: async (toolCallId, params, onUpdate, toolContext) => {
        const context = resolveToolExecutionContext(options, toolContext);
        const updates = createUpdateEmitter(toolCallId, onUpdate);
        const cwd = params.cwd ? resolveSafe(workspace, String(params.cwd)) : workspace;
        const result = await spawnAsync(
          process.platform === "win32" ? "python" : "python3",
          ["-c", (params.cells as Array<{ code: string }>).map((cell) => cell.code).join("\n")],
          {
            cwd,
            timeout: (params.timeout as number) ?? context.limits?.timeoutMs ?? DEFAULT_BASH_TIMEOUT,
            signal: context.signal,
            maxOutputBytes: context.limits?.maxOutputBytes,
            onStdout: updates.stdout,
            onStderr: updates.stderr,
          },
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
      metadata: {
        category: "ssh",
        tags: ["remote", "shell"],
        requiresApproval: "on-risk",
        cost: { unit: "metered", meter: "seconds" },
      },
      parameters: Type.Object({
        host: Type.String({ description: "SSH host (user@host)" }),
        command: Type.String({ description: "Command to execute remotely" }),
        cwd: Type.Optional(Type.String({ description: "Remote working directory" })),
        timeout: Type.Optional(Type.Number({ description: "Timeout in ms (default: 120000)" })),
        hostKeyPolicy: Type.Optional(Type.Union([
          Type.Literal("strict"),
          Type.Literal("accept-new"),
          Type.Literal("insecure"),
        ], { description: "SSH host-key policy. Use insecure only when explicitly approved." })),
      }),
      execute: async (toolCallId, params, onUpdate, toolContext) => {
        const context = resolveToolExecutionContext(options, toolContext);
        const updates = createUpdateEmitter(toolCallId, onUpdate);
        const remoteCommand = params.cwd
          ? `cd ${String(params.cwd)} && ${String(params.command)}`
          : String(params.command);
        const hostKeyPolicy = params.hostKeyPolicy === "insecure" || params.hostKeyPolicy === "accept-new"
          ? String(params.hostKeyPolicy)
          : "strict";
        const hostKeyOption = hostKeyPolicy === "insecure"
          ? "StrictHostKeyChecking=no"
          : hostKeyPolicy === "accept-new"
            ? "StrictHostKeyChecking=accept-new"
            : "StrictHostKeyChecking=yes";
        const result = await spawnAsync(
          "ssh",
          ["-o", hostKeyOption, "-o", "BatchMode=yes", String(params.host), remoteCommand],
          {
            cwd: workspace,
            timeout: (params.timeout as number) ?? context.limits?.timeoutMs ?? DEFAULT_BASH_TIMEOUT,
            signal: context.signal,
            maxOutputBytes: context.limits?.maxOutputBytes,
            onStdout: updates.stdout,
            onStderr: updates.stderr,
          },
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
      metadata: {
        category: "web",
        tags: ["http", "read-only"],
        requiresApproval: "never",
        cost: { unit: "metered", meter: "requests" },
        rateLimit: { scope: "host", limit: 30, windowMs: 60_000 },
        cache: { read: true },
      },
      parameters: Type.Object({
        url: Type.String({ description: "URL to fetch" }),
        timeout: Type.Optional(Type.Number({ description: "Timeout in ms (default: 30000)" })),
        raw: Type.Optional(Type.Boolean({ description: "Return raw response without truncation" })),
      }),
      execute: async (_toolCallId, params, _onUpdate, toolContext) => {
        const context = resolveToolExecutionContext(options, toolContext);
        const cacheKey = `agent-core:fetch:${String(params.url)}:${params.raw === true ? "raw" : "truncated"}`;
        const cached = await context.cache?.get(cacheKey, context.signal) as {
          status: number;
          statusText: string;
          body: string;
        } | undefined;
        if (cached) {
          return jsonResult({
            ...cached,
            cache: { mode: "read-only", hit: true, key: cacheKey },
          });
        }

        const controller = new AbortController();
        const abortFromParent = () => controller.abort(context.signal?.reason);
        if (context.signal?.aborted) {
          abortFromParent();
        } else {
          context.signal?.addEventListener("abort", abortFromParent, { once: true });
        }
        const timer = setTimeout(
          () => controller.abort(),
          (params.timeout as number) ?? context.limits?.timeoutMs ?? DEFAULT_SEARCH_TIMEOUT,
        );
        try {
          const response = await globalThis.fetch(String(params.url), { signal: controller.signal });
          const text = await response.text();
          const maxLength = params.raw ? Infinity : 50_000;
          return jsonResult({
            status: response.status,
            statusText: response.statusText,
            body: text.length > maxLength ? `${text.slice(0, maxLength)}\n... (truncated)` : text,
            cache: { mode: context.cache ? "read-only" : "off", hit: false, key: context.cache ? cacheKey : undefined },
          });
        } finally {
          context.signal?.removeEventListener("abort", abortFromParent);
          clearTimeout(timer);
        }
      },
    },
  ];
}

function resolveToolExecutionContext(
  options: AgenticToolOptions,
  toolContext: unknown,
): ToolExecutionContext {
  const context = isToolExecutionContext(toolContext) ? toolContext : {};
  return {
    signal: context.signal ?? options.signal,
    limits: {
      timeoutMs: context.limits?.timeoutMs ?? options.limits?.defaultTimeoutMs,
      maxOutputBytes: context.limits?.maxOutputBytes ?? options.limits?.defaultMaxOutputBytes,
    },
    cache: context.cache ?? options.cache,
  };
}

function isToolExecutionContext(value: unknown): value is ToolExecutionContext {
  return Boolean(value && typeof value === "object");
}

function createUpdateEmitter(
  callId: string,
  onUpdate: unknown,
): {
  stdout: (chunk: string) => void;
  stderr: (chunk: string) => void;
} {
  let sequence = 0;
  const emit = typeof onUpdate === "function"
    ? (event: ToolUpdateEvent) => {
      void Promise.resolve((onUpdate as (event: ToolUpdateEvent) => unknown)(event));
    }
    : undefined;
  return {
    stdout: (chunk) => emit?.({ type: "tool.stdout", callId, chunk, sequence: ++sequence }),
    stderr: (chunk) => emit?.({ type: "tool.stderr", callId, chunk, sequence: ++sequence }),
  };
}
