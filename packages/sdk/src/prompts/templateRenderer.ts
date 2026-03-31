import * as fs from "fs";
import * as path from "path";
import type { PromptContext } from "./types";

/**
 * Simple Mustache-like template renderer for .md prompt templates.
 * Supports:
 *   {{key}} — replaced with ctx[key] or extras[key] value (toString)
 *   {{#key}}...{{/key}} — included if ctx[key] is truthy
 *   {{^key}}...{{/key}} — included if ctx[key] is falsy
 *   {{#cap.NAME}}...{{/cap.NAME}} — included if ctx.capabilities includes 'NAME'
 *   {{^cap.NAME}}...{{/cap.NAME}} — included if ctx.capabilities does NOT include 'NAME'
 *   {{#interactive}}...{{/interactive}} — included if ctx.interactive !== false
 *   {{^interactive}}...{{/interactive}} — included if ctx.interactive !== true
 *   {{#interactive.unknown}}...{{/interactive.unknown}} — included if ctx.interactive === undefined
 */
export function renderTemplate(
  templatePath: string,
  ctx: PromptContext,
  extras?: Record<string, string>,
): string {
  const raw = fs.readFileSync(templatePath, "utf-8");
  return renderTemplateString(raw, ctx, extras);
}

/** Type-safe accessor for known PromptContext string fields */
const KNOWN_STRING_KEYS: ReadonlyArray<keyof PromptContext> = [
  "harness", "harnessLabel", "platform", "pluginRootVar", "loopControlTerm",
  "sessionBindingFlags", "interactiveToolName", "sessionEnvVars", "resumeFlags",
  "sdkVersionExpr", "cliSetupSnippet", "iterateFlags",
  "processLibraryRoot", "processLibraryReferenceRoot",
];

function getCtxStringValue(
  ctx: PromptContext,
  key: string,
  extras?: Record<string, string>,
): string | undefined {
  // Check extras first (augmented context values from part files)
  if (extras && key in extras) {
    return extras[key];
  }
  // Check known PromptContext keys
  for (const k of KNOWN_STRING_KEYS) {
    if (k === key) {
      const val = ctx[k];
      return typeof val === "string" ? val : undefined;
    }
  }
  return undefined;
}

export function renderTemplateString(
  raw: string,
  ctx: PromptContext,
  extras?: Record<string, string>,
): string {
  let result = raw;

  // Handle interactive.unknown sections (must come before interactive sections)
  result = result.replace(
    /\{\{#interactive\.unknown\}\}([\s\S]*?)\{\{\/interactive\.unknown\}\}/g,
    (_m: string, content: string) => (ctx.interactive === undefined ? content : ""),
  );

  // Handle capability sections
  result = result.replace(
    /\{\{#cap\.([^}]+)\}\}([\s\S]*?)\{\{\/cap\.\1\}\}/g,
    (_m: string, cap: string, content: string) => (ctx.capabilities.includes(cap) ? content : ""),
  );
  result = result.replace(
    /\{\{\^cap\.([^}]+)\}\}([\s\S]*?)\{\{\/cap\.\1\}\}/g,
    (_m: string, cap: string, content: string) => (!ctx.capabilities.includes(cap) ? content : ""),
  );

  // Handle extras section blocks (truthy = non-empty string, falsy = empty/missing)
  // Process before built-in keys so part files can pass custom section flags
  if (extras) {
    for (const key of Object.keys(extras)) {
      const posRe = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, "g");
      const negRe = new RegExp(`\\{\\{\\^${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, "g");
      const truthy = extras[key] !== undefined && extras[key] !== "";
      result = result.replace(posRe, (_m: string, content: string) => (truthy ? content : ""));
      result = result.replace(negRe, (_m: string, content: string) => (!truthy ? content : ""));
    }
  }

  // Handle boolean sections (#key for truthy, ^key for falsy)
  // Special handling for 'interactive' which is tri-state
  result = result.replace(
    /\{\{#interactive\}\}([\s\S]*?)\{\{\/interactive\}\}/g,
    (_m: string, content: string) => (ctx.interactive !== false ? content : ""),
  );
  result = result.replace(
    /\{\{\^interactive\}\}([\s\S]*?)\{\{\/interactive\}\}/g,
    (_m: string, content: string) => (ctx.interactive !== true ? content : ""),
  );

  // Handle other boolean sections
  const boolKeys = ["hookDriven", "hasIntentFidelityChecks", "hasNonNegotiables"] as const;
  for (const key of boolKeys) {
    const posRe = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, "g");
    const negRe = new RegExp(`\\{\\{\\^${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, "g");
    const val = ctx[key];
    result = result.replace(posRe, (_m: string, content: string) => (val ? content : ""));
    result = result.replace(negRe, (_m: string, content: string) => (!val ? content : ""));
  }

  // Handle optional string sections (truthy = non-empty string, falsy = undefined/null/empty)
  const optionalStringKeys = ["processLibraryRoot", "processLibraryReferenceRoot"] as const;
  for (const key of optionalStringKeys) {
    const posRe = new RegExp(`\\{\\{#${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, "g");
    const negRe = new RegExp(`\\{\\{\\^${key}\\}\\}([\\s\\S]*?)\\{\\{\\/${key}\\}\\}`, "g");
    const val = ctx[key];
    const truthy = val !== undefined && val !== null && val !== "";
    result = result.replace(posRe, (_m: string, content: string) => (truthy ? content : ""));
    result = result.replace(negRe, (_m: string, content: string) => (!truthy ? content : ""));
  }

  // Replace simple {{key}} placeholders (checks extras first, then known ctx keys)
  result = result.replace(/\{\{(\w+)\}\}/g, (_m: string, key: string) => {
    const val = getCtxStringValue(ctx, key, extras);
    return val !== undefined && val !== null ? String(val) : "";
  });

  // Clean up multiple consecutive blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

/** Resolves a template path relative to the templates/ directory */
export function resolveTemplatePath(templateName: string): string {
  return path.join(__dirname, "templates", templateName);
}
