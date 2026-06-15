/**
 * Built-in microagent: code-analyzer
 *
 * Analyzes source files for patterns, anti-patterns, complexity,
 * and other quality signals. Returns structured findings.
 */

import type { MicroagentManifest } from "../types";

export const codeAnalyzerManifest: MicroagentManifest = {
  name: "code-analyzer",
  version: "1.0.0",
  description: "Analyzes code for patterns, anti-patterns, and quality signals.",
  inputSchema: {
    type: "object",
    properties: {
      paths: {
        type: "array",
        items: { type: "string" },
        description: "File or directory paths to analyze.",
      },
      analysis: {
        type: "string",
        description: "The type of analysis to perform (e.g. 'complexity', 'dead-code', 'security').",
      },
    },
    required: ["paths", "analysis"],
  },
  outputSchema: {
    type: "object",
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            file: { type: "string" },
            line: { type: "number" },
            severity: { type: "string", enum: ["info", "warning", "error", "critical"] },
            message: { type: "string" },
          },
          required: ["file", "line", "severity", "message"],
        },
        description: "Structured findings from the analysis.",
      },
    },
    required: ["findings"],
  },
  isolation: "subprocess",
  runtime: {
    entrypoint: "dist/microagents/scripts/code-analyzer.entrypoint.js",
    skills: ["code-review"],
    processes: ["dist/microagents/processes/code-analyzer.process.mjs"],
    timeout: 60_000,
  },
  tags: ["analysis", "quality"],
  builtIn: true,
};
