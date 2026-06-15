import * as fs from "node:fs";
import * as path from "node:path";
import { Type } from "@sinclair/typebox";
import type { AgenticToolOptions, CustomToolDefinition, ToolResult } from "../types";
import { DEFAULT_SEARCH_TIMEOUT, getRgPath, spawnAsync } from "../shared/process";
import { errorResult, jsonResult, ok } from "../shared/results";
import { globToRegex, resolveSafe } from "../shared/paths";

interface NotebookJson {
  cells: NotebookCell[];
  [key: string]: unknown;
}

interface NotebookCell {
  cell_type: string;
  source: string | string[];
  metadata: Record<string, unknown>;
  outputs?: unknown[];
  [key: string]: unknown;
}

const MAX_CALC_EXPRESSION_LENGTH = 256;
const MAX_CALC_ABS_RESULT = 1e100;

class CalcParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): number {
    const value = this.parseExpression();
    this.skipWhitespace();
    if (this.index !== this.source.length) {
      throw new Error(`Unexpected token '${this.source[this.index]}' at position ${this.index}.`);
    }
    return this.requireFinite(value);
  }

  private parseExpression(): number {
    let value = this.parseTerm();
    while (true) {
      this.skipWhitespace();
      if (this.consume("+")) {
        value += this.parseTerm();
      } else if (this.consume("-")) {
        value -= this.parseTerm();
      } else {
        return this.requireFinite(value);
      }
    }
  }

  private parseTerm(): number {
    let value = this.parsePower();
    while (true) {
      this.skipWhitespace();
      if (this.consume("*")) {
        if (this.consume("*")) {
          this.index -= 2;
          return this.requireFinite(value);
        }
        value *= this.parsePower();
      } else if (this.consume("/")) {
        const divisor = this.parsePower();
        if (divisor === 0) {
          throw new Error("Division by zero is not allowed.");
        }
        value /= divisor;
      } else if (this.consume("%")) {
        const divisor = this.parsePower();
        if (divisor === 0) {
          throw new Error("Modulo by zero is not allowed.");
        }
        value %= divisor;
      } else {
        return this.requireFinite(value);
      }
    }
  }

  private parsePower(): number {
    const base = this.parseUnary();
    this.skipWhitespace();
    if (!this.consume("**")) {
      return this.requireFinite(base);
    }
    const exponent = this.parsePower();
    return this.requireFinite(base ** exponent);
  }

  private parseUnary(): number {
    this.skipWhitespace();
    if (this.consume("+")) {
      return this.parseUnary();
    }
    if (this.consume("-")) {
      return this.requireFinite(-this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    this.skipWhitespace();
    if (this.consume("(")) {
      const value = this.parseExpression();
      this.skipWhitespace();
      if (!this.consume(")")) {
        throw new Error("Missing closing parenthesis.");
      }
      return value;
    }
    return this.parseNumber();
  }

  private parseNumber(): number {
    this.skipWhitespace();
    const start = this.index;
    let sawDigit = false;
    while (/[0-9]/.test(this.source[this.index] ?? "")) {
      sawDigit = true;
      this.index += 1;
    }
    if (this.source[this.index] === ".") {
      this.index += 1;
      while (/[0-9]/.test(this.source[this.index] ?? "")) {
        sawDigit = true;
        this.index += 1;
      }
    }
    if (!sawDigit) {
      throw new Error(`Expected a number at position ${start}.`);
    }
    return this.requireFinite(Number(this.source.slice(start, this.index)));
  }

  private consume(token: string): boolean {
    if (!this.source.startsWith(token, this.index)) {
      return false;
    }
    this.index += token.length;
    return true;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.source[this.index] ?? "")) {
      this.index += 1;
    }
  }

  private requireFinite(value: number): number {
    if (!Number.isFinite(value) || Math.abs(value) > MAX_CALC_ABS_RESULT) {
      throw new Error("Expression result is not finite.");
    }
    return Object.is(value, -0) ? 0 : value;
  }
}

function evaluateCalcExpression(expression: string): number {
  const source = expression.trim();
  if (!source) {
    throw new Error("Expression must not be empty.");
  }
  if (source.length > MAX_CALC_EXPRESSION_LENGTH) {
    throw new Error(`Expression must be ${MAX_CALC_EXPRESSION_LENGTH} characters or fewer.`);
  }
  if (/[^0-9+\-*/%().\s]/.test(source)) {
    throw new Error("Expression contains unsupported characters.");
  }
  return new CalcParser(source).parse();
}

function collectScopedAstEditFiles(
  targetPath: string,
  globPattern?: string,
  limit?: number,
): string[] {
  const maxFiles = limit == null ? undefined : Math.max(0, Math.floor(limit));
  if (maxFiles === 0) {
    return [];
  }

  let stat: fs.Stats | undefined;
  try {
    stat = fs.statSync(targetPath);
  } catch {
    return maxFiles === undefined ? [targetPath] : [targetPath].slice(0, maxFiles);
  }

  const scopeRoot = stat.isDirectory() ? targetPath : path.dirname(targetPath);
  const files = stat.isDirectory() ? collectFilesRecursively(targetPath) : [targetPath];
  const scopedFiles = globPattern
    ? files.filter((filePath) => globToRegex(globPattern).test(path.relative(scopeRoot, filePath).replace(/\\/g, "/")))
    : files;

  return maxFiles == null ? scopedFiles : scopedFiles.slice(0, maxFiles);
}

function collectFilesRecursively(directory: string): string[] {
  const results: string[] = [];
  const walk = (currentDir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") {
        continue;
      }
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      results.push(fullPath);
    }
  };

  walk(directory);

  return results;
}

export function createCodeTools(options: AgenticToolOptions): CustomToolDefinition[] {
  const { workspace } = options;

  return [
    {
      name: "calc",
      label: "Calculator",
      description: "Evaluate a safe arithmetic expression.",
      parameters: Type.Object({
        expression: Type.String({ description: "Arithmetic expression using numbers, parentheses, +, -, *, /, %, and **" }),
      }),
      execute: (_toolCallId, params) => {
        try {
          const result = evaluateCalcExpression(String(params.expression ?? ""));
          return ok(String(result));
        } catch (error) {
          return errorResult(error instanceof Error ? error.message : String(error));
        }
      },
    },
    {
      name: "ast_grep",
      label: "AST Search",
      description:
        "Search code using AST patterns via ast-grep (sg). Falls back to text grep if sg is unavailable.",
      parameters: Type.Object({
        pat: Type.Array(Type.String(), { description: "AST patterns to search for" }),
        lang: Type.String({ description: "Language (e.g. 'typescript', 'python')" }),
        path: Type.Optional(Type.String({ description: "Search path relative to workspace" })),
        glob: Type.Optional(Type.String({ description: "File glob filter" })),
        limit: Type.Optional(Type.Number({ description: "Max results" })),
        offset: Type.Optional(Type.Number({ description: "Skip first N results" })),
        context: Type.Optional(Type.Number({ description: "Context lines around matches" })),
      }),
      execute: async (_toolCallId, params) => {
        const patterns = params.pat as string[];
        const searchPath = params.path ? resolveSafe(workspace, String(params.path)) : workspace;
        const results: string[] = [];

        for (const pattern of patterns) {
          const astResult = await spawnAsync("sg", [
            "run",
            "--pattern",
            pattern,
            "--lang",
            String(params.lang),
            ...(params.context ? ["--context", String(params.context)] : []),
            searchPath,
          ], {
            cwd: workspace,
            timeout: DEFAULT_SEARCH_TIMEOUT,
          });

          if (astResult.exitCode === 0 && astResult.stdout.trim()) {
            results.push(astResult.stdout.trim());
            continue;
          }
          if (astResult.exitCode !== 0) {
            process.stderr.write(`[agent-core] ast-grep failed (exit ${astResult.exitCode}), falling back to ripgrep\n`);
            const grepArgs = ["--no-heading", "--line-number", "--color", "never"];
            if (params.glob) {
              grepArgs.push("--glob", String(params.glob));
            }
            grepArgs.push("--", pattern, searchPath);
            const grepResult = await spawnAsync(getRgPath(), grepArgs, {
              cwd: workspace,
              timeout: DEFAULT_SEARCH_TIMEOUT,
            });
            if (grepResult.stdout.trim()) {
              results.push(grepResult.stdout.trim());
            }
          }
        }

        let output = results.join("\n---\n");
        if (params.offset || params.limit) {
          const offset = (params.offset as number) ?? 0;
          const limit = (params.limit as number) ?? 250;
          output = output.split("\n").slice(offset, offset + limit).join("\n");
        }
        return ok(output || "(no matches)");
      },
    },
    {
      name: "ast_edit",
      label: "AST Transform",
      description: "Apply AST-based rewrite operations via ast-grep (sg --rewrite) to files selected by path, glob, and limit.",
      parameters: Type.Object({
        ops: Type.Array(
          Type.Object({
            pat: Type.String({ description: "AST pattern to match" }),
            rewrite: Type.String({ description: "Replacement pattern" }),
          }),
          { description: "Rewrite operations" },
        ),
        lang: Type.String({ description: "Language (e.g. 'typescript')" }),
        path: Type.Optional(Type.String({ description: "Target path relative to workspace" })),
        glob: Type.Optional(Type.String({ description: "File glob filter relative to the requested path" })),
        limit: Type.Optional(Type.Number({ description: "Maximum number of matched files to modify" })),
      }),
      execute: async (_toolCallId, params) => {
        const targetPath = params.path ? resolveSafe(workspace, String(params.path)) : workspace;
        const scopedFiles = collectScopedAstEditFiles(
          targetPath,
          params.glob ? String(params.glob) : undefined,
          params.limit as number | undefined,
        );
        if (scopedFiles.length === 0) {
          return ok("No files matched the requested scope.");
        }
        const results = await Promise.all(
          (params.ops as Array<{ pat: string; rewrite: string }>).map(async (operation) => {
            const operationResults = await Promise.all(
              scopedFiles.map(async (filePath) => {
                const result = await spawnAsync("sg", [
                  "run",
                  "--pattern",
                  operation.pat,
                  "--rewrite",
                  operation.rewrite,
                  "--lang",
                  String(params.lang),
                  "--update-all",
                  filePath,
                ], {
                  cwd: workspace,
                  timeout: DEFAULT_SEARCH_TIMEOUT,
                });
                return { filePath, result };
              }),
            );
            const output = operationResults
              .map(({ filePath, result }) => {
                const details = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
                return `${path.relative(workspace, filePath).replace(/\\/g, "/")}: ${result.exitCode === 0 ? "applied" : "failed"}${details ? `\n${details}` : ""}`;
              })
              .join("\n");
            return `Pattern "${operation.pat}" -> "${operation.rewrite}"\n${output}`;
          }),
        );
        return ok(results.join("\n"));
      },
    },
    {
      name: "render_mermaid",
      label: "Render Mermaid Diagram",
      description: "Render a Mermaid diagram. Tries mmdc CLI; falls back to returning source.",
      parameters: Type.Object({
        mermaid: Type.String({ description: "Mermaid diagram source" }),
        config: Type.Optional(Type.Object({
          useAscii: Type.Optional(Type.Boolean({ description: "Use ASCII art fallback" })),
        })),
      }),
      execute: async (_toolCallId, params): Promise<ToolResult> => {
        const source = String(params.mermaid);
        const inputPath = path.join(workspace, `.mermaid-tmp-${Date.now()}.mmd`);
        const outputPath = path.join(workspace, `.mermaid-tmp-${Date.now()}.svg`);
        try {
          fs.writeFileSync(inputPath, source, "utf8");
          const result = await spawnAsync("mmdc", ["-i", inputPath, "-o", outputPath], {
            cwd: workspace,
            timeout: DEFAULT_SEARCH_TIMEOUT,
          });
          if (result.exitCode === 0 && fs.existsSync(outputPath)) {
            return ok(fs.readFileSync(outputPath, "utf8"));
          }
        } catch (error) {
          process.stderr.write(`[agent-core] mmdc rendering failed: ${error instanceof Error ? error.message : String(error)}, returning source\n`);
        } finally {
          try {
            fs.unlinkSync(inputPath);
          } catch (unlinkErr) {
            process.stderr.write(`[agent-core] failed to clean up ${inputPath}: ${unlinkErr instanceof Error ? unlinkErr.message : String(unlinkErr)}\n`);
          }
          try {
            fs.unlinkSync(outputPath);
          } catch (unlinkErr) {
            process.stderr.write(`[agent-core] failed to clean up ${outputPath}: ${unlinkErr instanceof Error ? unlinkErr.message : String(unlinkErr)}\n`);
          }
        }
        return ok(`(mmdc not available — returning source)\n\n\`\`\`mermaid\n${source}\n\`\`\``);
      },
    },
    {
      name: "notebook",
      label: "Jupyter Notebook",
      description: "Read or modify Jupyter notebook cells. Actions: read, insert, replace, delete.",
      parameters: Type.Object({
        action: Type.String({ description: "Action: read | insert | replace | delete" }),
        notebook_path: Type.String({ description: "Notebook file path relative to workspace" }),
        cell_index: Type.Number({ description: "0-based cell index" }),
        content: Type.Optional(Type.String({ description: "Cell content (for insert/replace)" })),
        cell_type: Type.Optional(Type.String({ description: "Cell type: code | markdown (default: code)" })),
      }),
      execute: (_toolCallId, params) => {
        const notebookPath = resolveSafe(workspace, String(params.notebook_path));
        const notebook = JSON.parse(fs.readFileSync(notebookPath, "utf8")) as NotebookJson;
        if (!Array.isArray(notebook.cells)) {
          return errorResult("Invalid notebook format: no cells array.");
        }

        const cellIndex = params.cell_index as number;
        switch (String(params.action)) {
          case "read": {
            if (cellIndex < 0 || cellIndex >= notebook.cells.length) {
              return errorResult(`Cell index ${cellIndex} out of range (0-${notebook.cells.length - 1}).`);
            }
            const cell = notebook.cells[cellIndex];
            return jsonResult({
              cell_type: cell.cell_type,
              source: Array.isArray(cell.source) ? cell.source.join("") : String(cell.source),
              index: cellIndex,
            });
          }
          case "insert": {
            const newCell: NotebookCell = {
              cell_type: (params.cell_type as string) ?? "code",
              source: [String(params.content ?? "")],
              metadata: {},
              outputs: [],
            };
            notebook.cells.splice(cellIndex, 0, newCell);
            fs.writeFileSync(notebookPath, JSON.stringify(notebook, null, 1), "utf8");
            return ok(`Inserted ${newCell.cell_type} cell at index ${cellIndex}.`);
          }
          case "replace":
            if (cellIndex < 0 || cellIndex >= notebook.cells.length) {
              return errorResult(`Cell index ${cellIndex} out of range.`);
            }
            notebook.cells[cellIndex].source = [String(params.content ?? "")];
            if (params.cell_type) {
              notebook.cells[cellIndex].cell_type = String(params.cell_type);
            }
            fs.writeFileSync(notebookPath, JSON.stringify(notebook, null, 1), "utf8");
            return ok(`Replaced cell at index ${cellIndex}.`);
          case "delete":
            if (cellIndex < 0 || cellIndex >= notebook.cells.length) {
              return errorResult(`Cell index ${cellIndex} out of range.`);
            }
            notebook.cells.splice(cellIndex, 1);
            fs.writeFileSync(notebookPath, JSON.stringify(notebook, null, 1), "utf8");
            return ok(`Deleted cell at index ${cellIndex}.`);
          default:
            return errorResult(`Unknown notebook action: ${String(params.action)}`);
        }
      },
    },
  ];
}
