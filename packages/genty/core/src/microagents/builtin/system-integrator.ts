/**
 * Built-in microagent: system-integrator
 *
 * Integrates with external systems by dispatching operations
 * (HTTP calls, SDK invocations, etc.) and returning structured responses.
 */

import type { MicroagentManifest } from "../types";

export const systemIntegratorManifest: MicroagentManifest = {
  name: "system-integrator",
  version: "1.0.0",
  description: "Integrates with external systems by dispatching parameterized operations.",
  inputSchema: {
    type: "object",
    properties: {
      system: { type: "string", description: "Target system identifier (e.g. 'github', 'jira', 'slack')." },
      operation: { type: "string", description: "Operation to perform (e.g. 'list-issues', 'send-message')." },
      params: {
        type: "object",
        description: "Arbitrary parameters for the operation.",
      },
    },
    required: ["system", "operation", "params"],
  },
  outputSchema: {
    type: "object",
    properties: {
      response: { type: "object", description: "The operation response payload." },
      statusCode: { type: "number", description: "Status code (0 = success, non-zero = error)." },
    },
    required: ["response", "statusCode"],
  },
  isolation: "subprocess",
  runtime: {
    entrypoint: "dist/microagents/scripts/system-integrator.entrypoint.js",
    processes: ["dist/microagents/processes/system-integrator.process.mjs"],
    timeout: 30_000,
  },
  tags: ["integration", "api"],
  builtIn: true,
};
