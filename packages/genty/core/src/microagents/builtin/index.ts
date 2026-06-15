/**
 * Built-in microagent manifests.
 *
 * These ship with genty core and are registered automatically
 * when a MicroagentRegistry is seeded with built-ins.
 */

import type { MicroagentManifest } from "../types";
import { formatConverterManifest } from "./format-converter";
import { systemIntegratorManifest } from "./system-integrator";
import { codeAnalyzerManifest } from "./code-analyzer";
import { schemaGeneratorManifest } from "./schema-generator";
import { diffApplierManifest } from "./diff-applier";

export {
  formatConverterManifest,
  systemIntegratorManifest,
  codeAnalyzerManifest,
  schemaGeneratorManifest,
  diffApplierManifest,
};

/** All built-in microagent manifests. */
export const builtInManifests: readonly MicroagentManifest[] = [
  formatConverterManifest,
  systemIntegratorManifest,
  codeAnalyzerManifest,
  schemaGeneratorManifest,
  diffApplierManifest,
];
