import * as fs from "node:fs";
import * as path from "node:path";
import { Type } from "@sinclair/typebox";
import type { AgenticToolOptions, CustomToolDefinition, ToolResult } from "../types";
import { DEFAULT_SEARCH_TIMEOUT, MAX_READ_LINES, getRgPath, spawnAsync } from "../shared/process";
import { errorResult, ok } from "../shared/results";
import { globToRegex, resolveSafe, walkDir } from "../shared/paths";

export function createFileSystemTools(options: AgenticToolOptions): CustomToolDefinition[] {
  const { workspace } = options;

  return [
    {
      name: "read",
      label: "Read File",
      description:
        "Read a file from the workspace. Returns numbered lines. Supports offset and limit for partial reads.",
      parameters: Type.Object({
        path: Type.String({ description: "File path relative to workspace" }),
        offset: Type.Optional(Type.Number({ description: "1-based line to start reading from" })),
        limit: Type.Optional(Type.Number({ description: "Max number of lines to return" })),
      }),
      execute: (_toolCallId, params): ToolResult => {
        const filePath = resolveSafe(workspace, String(params.path));
        const lines = fs.readFileSync(filePath, "utf8").split("\n");
        const start = Math.max(0, ((params.offset as number) ?? 1) - 1);
        const count = Math.min((params.limit as number) ?? MAX_READ_LINES, MAX_READ_LINES);
        return ok(lines.slice(start, start + count).map((line, index) => `${start + index + 1}\t${line}`).join("\n"));
      },
    },
    {
      name: "write",
      label: "Write File",
      description: "Write content to a file in the workspace. Creates parent directories if needed.",
      parameters: Type.Object({
        path: Type.String({ description: "File path relative to workspace" }),
        content: Type.String({ description: "File content to write" }),
      }),
      execute: (_toolCallId, params): ToolResult => {
        const filePath = resolveSafe(workspace, String(params.path));
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, String(params.content), "utf8");
        return ok(`File written: ${filePath}`);
      },
    },
    {
      name: "edit",
      label: "Edit File",
      description:
        "Replace a string in a file. Reads the file, replaces old_string with new_string, and writes it back.",
      parameters: Type.Object({
        path: Type.String({ description: "File path relative to workspace" }),
        old_string: Type.String({ description: "Exact string to find" }),
        new_string: Type.String({ description: "Replacement string" }),
        replace_all: Type.Optional(Type.Boolean({ description: "Replace all occurrences (default: false)" })),
      }),
      execute: (_toolCallId, params): ToolResult => {
        const filePath = resolveSafe(workspace, String(params.path));
        const content = fs.readFileSync(filePath, "utf8");
        const oldString = String(params.old_string);
        const newString = String(params.new_string);

        if (!content.includes(oldString)) {
          return errorResult(`old_string not found in ${params.path as string}. Ensure it matches exactly.`);
        }

        const updated = params.replace_all
          ? content.split(oldString).join(newString)
          : content.replace(oldString, newString);
        fs.writeFileSync(filePath, updated, "utf8");
        return ok(`File edited: ${filePath}`);
      },
    },
    {
      name: "grep",
      label: "Search Files",
      description: "Search file contents using ripgrep. Returns matching lines with context.",
      parameters: Type.Object({
        pattern: Type.String({ description: "Regex pattern to search for" }),
        path: Type.Optional(Type.String({ description: "Directory or file to search (default: workspace)" })),
        glob: Type.Optional(Type.String({ description: "Glob filter (e.g. '*.ts')" })),
        type: Type.Optional(Type.String({ description: "File type filter (e.g. 'ts', 'py')" })),
        i: Type.Optional(Type.Boolean({ description: "Case-insensitive search" })),
        context: Type.Optional(Type.Number({ description: "Context lines around matches" })),
        limit: Type.Optional(Type.Number({ description: "Max results" })),
        offset: Type.Optional(Type.Number({ description: "Skip first N results" })),
        multiline: Type.Optional(Type.Boolean({ description: "Enable multiline mode" })),
        output_mode: Type.Optional(Type.Union([
          Type.Literal("content"),
          Type.Literal("files_with_matches"),
          Type.Literal("count"),
        ], { description: "Output mode: content, files_with_matches, or count" })),
        before_context: Type.Optional(Type.Number({ description: "Lines before each match (rg -B)" })),
        after_context: Type.Optional(Type.Number({ description: "Lines after each match (rg -A)" })),
        line_numbers: Type.Optional(Type.Boolean({ description: "Show line numbers in content mode (default true)" })),
        head_limit: Type.Optional(Type.Number({ description: "Max output lines (default 250)" })),
      }),
      execute: async (_toolCallId, params) => {
        const searchPath = params.path ? resolveSafe(workspace, String(params.path)) : workspace;
        const mode = (params.output_mode as string) ?? "files_with_matches";
        const args: string[] = ["--color", "never"];

        if (mode === "files_with_matches") {
          args.push("-l");
        } else if (mode === "count") {
          args.push("-c");
        } else {
          args.push("--no-heading", params.line_numbers === false ? "--no-line-number" : "--line-number");
          if (params.before_context != null) {
            args.push("-B", String(params.before_context));
          }
          if (params.after_context != null) {
            args.push("-A", String(params.after_context));
          }
        }

        if (params.i) {
          args.push("-i");
        }
        if (params.multiline) {
          args.push("-U", "--multiline-dotall");
        }
        const hasSplitContext = params.before_context != null || params.after_context != null;
        if (mode === "content" && params.context != null && !hasSplitContext) {
          args.push("-C", String(params.context));
        }
        if (params.glob) {
          args.push("--glob", String(params.glob));
        }
        if (params.type) {
          args.push("--type", String(params.type));
        }
        args.push("--", String(params.pattern), searchPath);

        const result = await spawnAsync(getRgPath(), args, { cwd: workspace, timeout: DEFAULT_SEARCH_TIMEOUT });
        let output = result.stdout;
        const rawHeadLimit = params.head_limit as number | undefined;
        const headLimit = rawHeadLimit === 0 ? Infinity : (rawHeadLimit ?? 250);
        const headLimited = output.split("\n").slice(0, headLimit);

        if (params.offset || params.limit) {
          const offset = (params.offset as number) ?? 0;
          const limit = (params.limit as number) ?? 250;
          output = headLimited.slice(offset, offset + limit).join("\n");
        } else {
          output = headLimited.join("\n");
        }

        if (!output.trim() && result.exitCode !== 0 && result.stderr) {
          return errorResult(result.stderr.trim());
        }
        return ok(output || "(no matches)");
      },
    },
    {
      name: "find",
      label: "Find Files",
      description: "Discover files matching a glob pattern in the workspace.",
      parameters: Type.Object({
        pattern: Type.String({ description: "Glob pattern (e.g. '**/*.ts')" }),
        hidden: Type.Optional(Type.Boolean({ description: "Include hidden files/dirs" })),
        limit: Type.Optional(Type.Number({ description: "Max results (default: 500)" })),
      }),
      execute: (_toolCallId, params): ToolResult => {
        const maxResults = Math.min((params.limit as number) ?? 500, 5000);
        const allFiles: string[] = [];
        walkDir(workspace, Boolean(params.hidden), maxResults * 5, allFiles);

        const regex = globToRegex(String(params.pattern));
        const matches: string[] = [];
        for (const filePath of allFiles) {
          if (matches.length >= maxResults) {
            break;
          }
          const relativePath = path.relative(workspace, filePath).replace(/\\/g, "/");
          if (regex.test(relativePath)) {
            matches.push(relativePath);
          }
        }
        return ok(matches.join("\n") || "(no matches)");
      },
    },
  ];
}
