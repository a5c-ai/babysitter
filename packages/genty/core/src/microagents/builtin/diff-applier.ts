/**
 * Built-in microagent: diff-applier
 *
 * Applies structured diffs (patches) to files. Reads the patch
 * descriptions from stdin and reports per-file success/failure.
 */

import type { MicroagentManifest } from "../types";

export const diffApplierManifest: MicroagentManifest = {
  name: "diff-applier",
  version: "1.0.0",
  description: "Applies structured diffs (patches) to files and reports results.",
  inputSchema: {
    type: "object",
    properties: {
      patches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            file: { type: "string", description: "Path to the file to patch." },
            hunks: {
              type: "array",
              items: { type: "string" },
              description: "Unified diff hunks to apply.",
            },
          },
          required: ["file", "hunks"],
        },
        description: "The patches to apply.",
      },
    },
    required: ["patches"],
  },
  outputSchema: {
    type: "object",
    properties: {
      applied: { type: "number", description: "Number of successfully applied patches." },
      failed: { type: "number", description: "Number of patches that failed to apply." },
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            file: { type: "string" },
            success: { type: "boolean" },
          },
          required: ["file", "success"],
        },
        description: "Per-file application results.",
      },
    },
    required: ["applied", "failed", "results"],
  },
  isolation: "subprocess",
  runtime: {
    entrypoint: "dist/microagents/scripts/diff-applier.entrypoint.js",
    processes: ["dist/microagents/processes/diff-applier.process.mjs"],
    timeout: 15_000,
  },
  tags: ["diff", "utility"],
  builtIn: true,
};
