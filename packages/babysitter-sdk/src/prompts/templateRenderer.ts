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

function replaceSection(
  input: string,
  openToken: string,
  closeToken: string,
  includeContent: boolean,
): string {
  let output = "";
  let cursor = 0;
  while (cursor < input.length) {
    const openIndex = input.indexOf(openToken, cursor);
    if (openIndex < 0) {
      output += input.slice(cursor);
      break;
    }
    output += input.slice(cursor, openIndex);
    const contentStart = openIndex + openToken.length;
    const closeIndex = input.indexOf(closeToken, contentStart);
    if (closeIndex < 0) {
      output += input.slice(openIndex);
      break;
    }
    if (includeContent) output += input.slice(contentStart, closeIndex);
    cursor = closeIndex + closeToken.length;
  }
  return output;
}

function replaceCapSections(
  input: string,
  prefix: "#" | "^",
  includeCap: (capability: string) => boolean,
): string {
  const openPrefix = `{{${prefix}cap.`;
  let output = "";
  let cursor = 0;
  while (cursor < input.length) {
    const openIndex = input.indexOf(openPrefix, cursor);
    if (openIndex < 0) {
      output += input.slice(cursor);
      break;
    }
    const nameStart = openIndex + openPrefix.length;
    const openEnd = input.indexOf("}}", nameStart);
    if (openEnd < 0) {
      output += input.slice(openIndex);
      break;
    }
    const capability = input.slice(nameStart, openEnd);
    const closeToken = `{{/cap.${capability}}}`;
    const contentStart = openEnd + 2;
    const closeIndex = input.indexOf(closeToken, contentStart);
    if (closeIndex < 0) {
      output += input.slice(openIndex);
      break;
    }
    output += input.slice(cursor, openIndex);
    if (includeCap(capability)) output += input.slice(contentStart, closeIndex);
    cursor = closeIndex + closeToken.length;
  }
  return output;
}

function isPlaceholderKey(key: string): boolean {
  if (!key) return false;
  for (const char of key) {
    const code = char.charCodeAt(0);
    const isDigit = code >= 48 && code <= 57;
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!isDigit && !isUpper && !isLower && char !== "_") return false;
  }
  return true;
}

function replacePlaceholders(
  input: string,
  ctx: PromptContext,
  extras?: Record<string, string>,
): string {
  let output = "";
  let cursor = 0;
  while (cursor < input.length) {
    const openIndex = input.indexOf("{{", cursor);
    if (openIndex < 0) {
      output += input.slice(cursor);
      break;
    }
    const closeIndex = input.indexOf("}}", openIndex + 2);
    if (closeIndex < 0) {
      output += input.slice(cursor);
      break;
    }
    const key = input.slice(openIndex + 2, closeIndex);
    output += input.slice(cursor, openIndex);
    if (isPlaceholderKey(key)) {
      const val = getCtxStringValue(ctx, key, extras);
      output += val !== undefined && val !== null ? String(val) : "";
    } else {
      output += input.slice(openIndex, closeIndex + 2);
    }
    cursor = closeIndex + 2;
  }
  return output;
}

function collapseBlankLines(input: string): string {
  let result = input;
  const tripleBlank = "\n\n\n";
  while (result.includes(tripleBlank)) {
    result = result.split(tripleBlank).join("\n\n");
  }
  return result;
}

export function renderTemplateString(
  raw: string,
  ctx: PromptContext,
  extras?: Record<string, string>,
): string {
  let result = raw;

  // Handle interactive.unknown sections (must come before interactive sections)
  result = replaceSection(
    result,
    "{{#interactive.unknown}}",
    "{{/interactive.unknown}}",
    ctx.interactive === undefined,
  );

  // Handle capability sections
  result = replaceCapSections(result, "#", (cap) => ctx.capabilities.includes(cap));
  result = replaceCapSections(result, "^", (cap) => !ctx.capabilities.includes(cap));

  // Handle extras section blocks (truthy = non-empty string, falsy = empty/missing)
  // Process before built-in keys so part files can pass custom section flags
  if (extras) {
    for (const key of Object.keys(extras)) {
      const truthy = extras[key] !== undefined && extras[key] !== "";
      result = replaceSection(result, `{{#${key}}}`, `{{/${key}}}`, truthy);
      result = replaceSection(result, `{{^${key}}}`, `{{/${key}}}`, !truthy);
    }
  }

  // Handle boolean sections (#key for truthy, ^key for falsy)
  // Special handling for 'interactive' which is tri-state
  result = replaceSection(result, "{{#interactive}}", "{{/interactive}}", ctx.interactive !== false);
  result = replaceSection(result, "{{^interactive}}", "{{/interactive}}", ctx.interactive !== true);

  // Handle other boolean sections
  const boolKeys = ["hookDriven", "hasIntentFidelityChecks", "hasNonNegotiables"] as const;
  for (const key of boolKeys) {
    const val = ctx[key];
    result = replaceSection(result, `{{#${key}}}`, `{{/${key}}}`, Boolean(val));
    result = replaceSection(result, `{{^${key}}}`, `{{/${key}}}`, !val);
  }

  // Handle optional string sections (truthy = non-empty string, falsy = undefined/null/empty)
  const optionalStringKeys = ["processLibraryRoot", "processLibraryReferenceRoot"] as const;
  for (const key of optionalStringKeys) {
    const val = ctx[key];
    const truthy = val !== undefined && val !== null && val !== "";
    result = replaceSection(result, `{{#${key}}}`, `{{/${key}}}`, truthy);
    result = replaceSection(result, `{{^${key}}}`, `{{/${key}}}`, !truthy);
  }

  // Replace simple {{key}} placeholders (checks extras first, then known ctx keys)
  result = replacePlaceholders(result, ctx, extras);

  // Clean up multiple consecutive blank lines
  result = collapseBlankLines(result);

  return result.trim();
}

/** Resolves a template path relative to the templates/ directory */
export function resolveTemplatePath(templateName: string): string {
  return path.join(__dirname, "templates", templateName);
}
