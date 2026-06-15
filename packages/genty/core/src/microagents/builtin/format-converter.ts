/**
 * Built-in microagent: format-converter
 *
 * Converts data between formats (JSON, YAML, TOML, CSV, XML, etc.).
 * Reads the source string from stdin, writes the converted result to stdout.
 */

import type { MicroagentManifest } from "../types";

export const formatConverterManifest: MicroagentManifest = {
  name: "format-converter",
  version: "1.0.0",
  description: "Converts data between serialization formats (JSON, YAML, TOML, CSV, XML).",
  inputSchema: {
    type: "object",
    properties: {
      source: { type: "string", description: "The source data as a string." },
      sourceFormat: {
        type: "string",
        enum: ["json", "yaml", "toml", "csv", "xml"],
        description: "Format of the source data.",
      },
      targetFormat: {
        type: "string",
        enum: ["json", "yaml", "toml", "csv", "xml"],
        description: "Desired output format.",
      },
    },
    required: ["source", "sourceFormat", "targetFormat"],
  },
  outputSchema: {
    type: "object",
    properties: {
      result: { type: "string", description: "The converted data as a string." },
      targetFormat: { type: "string", description: "The format of the result." },
    },
    required: ["result", "targetFormat"],
  },
  isolation: "subprocess",
  runtime: {
    entrypoint: "dist/microagents/scripts/format-converter.entrypoint.js",
    processes: ["dist/microagents/processes/format-converter.process.mjs"],
    timeout: 10_000,
  },
  tags: ["converter", "utility"],
  builtIn: true,
};
