import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

import { resolveResponderDirectory } from "../config.js";
import type { RepoConfigResolutionOptions } from "../config.js";
import { ResponderProfileSchema } from "../types.js";
import type { ResponderProfile, BreakpointContext } from "../types.js";

/**
 * A responder profile augmented with a relevance score.
 */
export interface ScoredResponder {
  responder: ResponderProfile;
  score: number;
  matchedDomains: string[];
  matchedTopics: string[];
  matchedKeywords: string[];
}

export interface ResponderMatcherOptions extends RepoConfigResolutionOptions {
  responders?: ResponderProfile[];
}

/**
 * Loads responder profiles from disk and matches them to breakpoints
 * based on domain, tag, and keyword overlap.
 */
export class ResponderMatcher {
  private responders: ResponderProfile[] = [];
  private loaded = false;
  private readonly options: ResponderMatcherOptions;

  constructor(options: string | ResponderMatcherOptions = {}) {
    this.options = typeof options === "string"
      ? { responderDir: options }
      : options;
    if (this.options.responders) {
      this.responders = [...this.options.responders];
      this.loaded = true;
    }
  }

  /**
   * Read all .json / .yaml files from the responder directory,
   * parse them, and validate against the ResponderProfile schema.
   * Invalid files are silently skipped (logged to stderr).
   */
  async loadResponders(): Promise<ResponderProfile[]> {
    if (this.options.responders) {
      return [...this.responders];
    }

    this.responders = [];
    const responderDir = resolveResponderDirectory(this.options);

    let entries: string[];
    try {
      entries = await readdir(responderDir);
    } catch {
      // Directory does not exist or is not readable
      this.loaded = true;
      return [];
    }

    const validExtensions = new Set([".json", ".yaml", ".yml"]);

    for (const entry of entries) {
      const ext = extname(entry).toLowerCase();
      if (!validExtensions.has(ext)) continue;

      const filePath = join(responderDir, entry);
      try {
        const raw = await readFile(filePath, "utf-8");
        let parsed: unknown;

        if (ext === ".json") {
          parsed = JSON.parse(raw);
        } else {
          // Simple YAML-subset parser: supports flat and nested objects
          // produced by common responder profile generators.
          parsed = parseSimpleYaml(raw);
        }

        const result = ResponderProfileSchema.safeParse(parsed);
        if (result.success) {
          this.responders.push(result.data);
        } else {
          console.error(`Invalid responder profile in ${filePath}: ${result.error.message}`);
        }
      } catch (err) {
        console.error(`Failed to read responder file ${filePath}:`, err);
      }
    }

    this.loaded = true;
    return [...this.responders];
  }

  /**
   * Return all loaded responders.
   */
  getResponders(): ResponderProfile[] {
    return [...this.responders];
  }

  /**
   * Score and rank responders by relevance to a breakpoint.
   *
   * Scoring algorithm:
   *  - For each domain of each responder:
   *    - +3 per domain keyword match
   *  - For each tag of each responder:
   *    - +2 per tag match
   *  - Responders with availability=false receive a 0 score
   *
   * Returns responders sorted by descending score (only those with score > 0).
   */
  matchResponders(
    breakpointText: string,
    context?: BreakpointContext,
    requiredDomains?: string[],
  ): ScoredResponder[] {
    if (!this.loaded) {
      throw new Error("Responders not loaded. Call loadResponders() first.");
    }

    // Build a set of tokens from the breakpoint and its context.
    const tokens = tokenize(breakpointText);
    if (context) {
      for (const tag of context.tags) {
        for (const t of tokenize(tag)) tokens.add(t);
      }
      for (const t of tokenize(context.description)) tokens.add(t);
    }

    const requiredSet = requiredDomains
      ? new Set(requiredDomains.map((d) => d.toLowerCase()))
      : undefined;

    const scored: ScoredResponder[] = [];

    for (const responder of this.responders) {
      // Skip unavailable responders
      if (!responder.availability) continue;

      let totalScore = 0;
      const matchedDomains = new Set<string>();
      const matchedTopics = new Set<string>();
      const matchedKeywords = new Set<string>();

      for (const domain of responder.domains) {
        const domainLower = domain.toLowerCase();

        // If required domains specified, only consider matching domains
        if (requiredSet && !requiredSet.has(domainLower)) continue;

        // Domain match: check if any token matches domain words
        for (const domainToken of tokenize(domain)) {
          if (tokens.has(domainToken)) {
            totalScore += 3;
            matchedDomains.add(domain);
          }
        }
      }

      // Tag matches
      for (const tag of responder.tags) {
        const tagTokens = tokenize(tag);
        for (const tt of tagTokens) {
          if (tokens.has(tt)) {
            totalScore += 2;
            matchedTopics.add(tag);
            break; // count each tag once
          }
        }
      }

      if (totalScore > 0) {
        scored.push({
          responder,
          score: totalScore,
          matchedDomains: [...matchedDomains],
          matchedTopics: [...matchedTopics],
          matchedKeywords: [...matchedKeywords],
        });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }
}

// -- Helpers ------------------------------------------------------------------

/**
 * Tokenize a string into a set of lowercase words (3+ chars).
 */
function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[\s\-_/,.;:!?()[\]{}'"]+/)
    .filter((w) => w.length >= 3);
  return new Set(words);
}

/**
 * Minimal YAML-like parser that handles the subset of YAML used
 * in responder profile files. Supports simple key: value pairs,
 * arrays (- item), and nested objects via indentation.
 *
 * For production use, replace with the `yaml` package.
 */
function parseSimpleYaml(text: string): unknown {
  const lines = text.split("\n");
  const root: Record<string, unknown> = {};
  let currentArray: unknown[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    // Skip comments and blank lines
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;

    // Array item
    const arrayMatch = /^\s+-\s+(.*)$/.exec(line);
    if (arrayMatch && currentArray) {
      let val: unknown = arrayMatch[1].trim();
      // Try to parse as number/boolean
      val = coerceYamlValue(val as string);
      currentArray.push(val);
      continue;
    }

    // Key: value
    const kvMatch = /^(\w[\w\s]*):\s*(.*)$/.exec(line);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const rawVal = kvMatch[2].trim();

      if (rawVal === "" || rawVal === "|" || rawVal === ">") {
        // Start of array or nested object - will be filled by subsequent lines
        currentArray = [];
        root[key] = currentArray;
      } else {
        root[key] = coerceYamlValue(rawVal);
        currentArray = null;
      }
    }
  }

  return root;
}

function coerceYamlValue(val: string): unknown {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null") return null;
  const num = Number(val);
  if (!isNaN(num) && val !== "") return num;
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  return val;
}
