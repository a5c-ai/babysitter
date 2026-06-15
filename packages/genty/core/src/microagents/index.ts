/**
 * Microagents subsystem — barrel exports.
 *
 * Microagents are isolated, single-purpose agents with structured I/O
 * that run as subprocesses. They are never invoked directly by humans.
 */

// Types
export type {
  JSONSchema,
  IsolationMode,
  MicroagentManifest,
  MicroagentInvocation,
  MicroagentResult,
  ValidationResult,
} from "./types";

// Registry
export { MicroagentRegistry } from "./registry";
export type { MicroagentRegistryFilter } from "./registry";

// Validator
export { validateInput, validateOutput, validateAgainstSchema } from "./validator";

// Runner
export { MicroagentRunner } from "./runner";

// Built-in manifests
export {
  builtInManifests,
  formatConverterManifest,
  systemIntegratorManifest,
  codeAnalyzerManifest,
  schemaGeneratorManifest,
  diffApplierManifest,
} from "./builtin";
