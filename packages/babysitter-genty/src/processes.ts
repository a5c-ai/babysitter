/**
 * BabysitterProcessProvider — implements the ProcessDefinitionProvider interface
 * for validating and loading babysitter process definitions.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type {
  ProcessDefinitionProvider,
  ProcessValidationResult,
} from "@a5c-ai/genty-platform/orchestration";

export class BabysitterProcessProvider implements ProcessDefinitionProvider {
  async validateProcess(processPath: string): Promise<ProcessValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file exists
    const absolutePath = path.resolve(processPath);
    try {
      await fs.access(absolutePath);
    } catch {
      errors.push(`Process file does not exist: ${absolutePath}`);
      return { valid: false, errors, warnings };
    }

    // Check extension
    const ext = path.extname(absolutePath);
    if (![".ts", ".js", ".mts", ".mjs"].includes(ext)) {
      errors.push(`Unsupported file extension "${ext}". Expected .ts, .js, .mts, or .mjs`);
    }

    // Try to read and check for defineProcess/defineTask export
    try {
      const content = await fs.readFile(absolutePath, "utf8");
      if (!content.includes("defineProcess") && !content.includes("defineTask")) {
        warnings.push("File does not appear to use defineProcess or defineTask from babysitter-sdk");
      }
      if (!content.includes("export")) {
        errors.push("File does not have any exports");
      }
    } catch (err) {
      errors.push(`Cannot read process file: ${(err as Error).message}`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async loadProcess(processPath: string): Promise<{ entrypoint: string; exportName: string }> {
    const absolutePath = path.resolve(processPath);

    // Determine the export name by checking the file content
    const content = await fs.readFile(absolutePath, "utf8");

    // Look for named exports: export const processName = defineProcess(...)
    const namedExportMatch = content.match(/export\s+(?:const|function)\s+(\w+)\s*=/);
    // Look for default export
    const hasDefaultExport = content.includes("export default");

    let exportName = "default";
    if (namedExportMatch && !hasDefaultExport) {
      exportName = namedExportMatch[1];
    }

    return {
      entrypoint: absolutePath,
      exportName,
    };
  }
}
