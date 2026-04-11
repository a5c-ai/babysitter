/**
 * Pattern parsing and matching for breakpoint auto-approval rules.
 *
 * Pattern syntax:
 *   <id-glob>                          — e.g., "confirm.*"
 *   <id-glob>(<predicate> [AND ...])   — e.g., "*.review(tags contains 'design')"
 *
 * Id-glob supports * as a wildcard matching any segment(s).
 * Attribute predicates: "tags contains '<value>'" or "expert = '<value>'"
 * Multiple predicates joined with AND.
 */

import type { AttributePredicate, BreakpointPattern, PredicateOp } from "./types";

/**
 * Parse a pattern string into a structured BreakpointPattern.
 */
export function parsePattern(raw: string): BreakpointPattern {
  const trimmed = raw.trim();
  const parenOpen = trimmed.indexOf("(");

  if (parenOpen === -1) {
    return { idGlob: trimmed, predicates: [] };
  }

  const parenClose = trimmed.lastIndexOf(")");
  if (parenClose === -1 || parenClose <= parenOpen) {
    throw new Error(`Invalid pattern: unmatched parenthesis in "${raw}"`);
  }

  const idGlob = trimmed.slice(0, parenOpen).trim();
  const predicateStr = trimmed.slice(parenOpen + 1, parenClose).trim();

  if (!predicateStr) {
    return { idGlob, predicates: [] };
  }

  const predicates = parsePredicates(predicateStr);
  return { idGlob, predicates };
}

function parsePredicates(str: string): AttributePredicate[] {
  // Split on " AND " (case-insensitive)
  const parts = str.split(/\s+AND\s+/i);
  return parts.map(parseSinglePredicate);
}

function parseSinglePredicate(str: string): AttributePredicate {
  const trimmed = str.trim();

  // Match: attr contains 'value' or attr = 'value'
  const match = trimmed.match(/^(\w+)\s+(contains|=)\s+'([^']*)'$/);
  if (!match) {
    throw new Error(`Invalid predicate: "${trimmed}". Expected: attr contains 'value' or attr = 'value'`);
  }

  return {
    attr: match[1],
    op: match[2] as PredicateOp,
    value: match[3],
  };
}

/**
 * Match a breakpointId and attributes against a parsed pattern.
 */
export function matchPattern(
  pattern: BreakpointPattern,
  breakpointId: string,
  attributes: { tags?: string[]; expert?: string }
): boolean {
  if (!matchGlob(pattern.idGlob, breakpointId)) {
    return false;
  }

  for (const pred of pattern.predicates) {
    if (!matchPredicate(pred, attributes)) {
      return false;
    }
  }

  return true;
}

/**
 * Simple glob matching with * wildcards.
 * Each * matches zero or more characters (including dots).
 */
function matchGlob(glob: string, value: string): boolean {
  // Escape regex special chars except *, then replace * with .*
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regexStr = "^" + escaped.replace(/\*/g, ".*") + "$";
  return new RegExp(regexStr).test(value);
}

function matchPredicate(
  pred: AttributePredicate,
  attributes: { tags?: string[]; expert?: string }
): boolean {
  if (pred.attr === "tags" && pred.op === "contains") {
    return Array.isArray(attributes.tags) && attributes.tags.includes(pred.value);
  }
  if (pred.attr === "expert" && pred.op === "=") {
    return attributes.expert === pred.value;
  }
  // Unknown attribute — no match
  return false;
}
