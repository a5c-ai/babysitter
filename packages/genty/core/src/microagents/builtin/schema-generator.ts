/**
 * Built-in microagent: schema-generator
 *
 * Generates schemas (JSON Schema, TypeBox, Zod, etc.) from example
 * data and a natural-language description of the desired shape.
 */

import type { MicroagentManifest } from "../types";

export const schemaGeneratorManifest: MicroagentManifest = {
  name: "schema-generator",
  version: "1.0.0",
  description: "Generates schemas from example data and a description of the desired shape.",
  inputSchema: {
    type: "object",
    properties: {
      examples: {
        type: "array",
        description: "Example data instances the schema should describe.",
      },
      description: {
        type: "string",
        description: "Natural-language description of the desired schema.",
      },
      format: {
        type: "string",
        enum: ["json-schema", "typebox", "zod", "yup"],
        description: "Output format for the generated schema.",
      },
    },
    required: ["examples", "description", "format"],
  },
  outputSchema: {
    type: "object",
    properties: {
      schema: { type: "object", description: "The generated schema object or string." },
      format: { type: "string", description: "The format of the generated schema." },
    },
    required: ["schema", "format"],
  },
  isolation: "subprocess",
  runtime: {
    entrypoint: "dist/microagents/scripts/schema-generator.entrypoint.js",
    processes: ["dist/microagents/processes/schema-generator.process.mjs"],
    timeout: 15_000,
  },
  tags: ["schema", "utility"],
  builtIn: true,
};
