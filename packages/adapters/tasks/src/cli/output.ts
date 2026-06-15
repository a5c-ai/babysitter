import type { Breakpoint, BreakpointAnswer, ResponderProfile } from "../types.js";

/**
 * Format a duration in milliseconds as a human-readable string.
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Format a breakpoint for display.
 */
export function formatBreakpoint(breakpoint: Breakpoint, jsonMode: boolean): string {
  if (jsonMode) {
    return JSON.stringify(breakpoint, null, 2);
  }

  const lines: string[] = [];
  lines.push(`Breakpoint: ${breakpoint.id}`);
  lines.push(`Status:     ${breakpoint.status}`);
  lines.push(`Text:       ${breakpoint.text}`);
  lines.push(`Strategy:   ${breakpoint.routing.strategy}`);
  lines.push(`Responders: ${breakpoint.routing.targetResponders.join(", ") || "(none)"}`);
  lines.push(`Created:    ${breakpoint.createdAt}`);
  lines.push(`Expires:    ${breakpoint.expiresAt}`);

  if (breakpoint.context.tags.length > 0) {
    lines.push(`Tags:       ${breakpoint.context.tags.join(", ")}`);
  }

  if (breakpoint.answers.length > 0) {
    lines.push(`Answers:    ${breakpoint.answers.length}`);
  }

  return lines.join("\n");
}

/**
 * Format an answer for display.
 */
export function formatAnswer(answer: BreakpointAnswer, jsonMode: boolean): string {
  if (jsonMode) {
    return JSON.stringify(answer, null, 2);
  }

  const lines: string[] = [];
  lines.push(`Answer:     ${answer.id}`);
  lines.push(`Breakpoint: ${answer.breakpointId}`);
  lines.push(`Responder:  ${answer.responderName} (${answer.responderId})`);
  lines.push(`Confidence: ${answer.confidence}%`);
  lines.push(`Answered:   ${answer.answeredAt}`);
  lines.push(`---`);
  lines.push(answer.text);

  if (answer.references.length > 0) {
    lines.push(`---`);
    lines.push(`References:`);
    for (const ref of answer.references) {
      lines.push(`  - ${ref}`);
    }
  }

  if (answer.followUpQuestions.length > 0) {
    lines.push(`Follow-up questions:`);
    for (const q of answer.followUpQuestions) {
      lines.push(`  - ${q}`);
    }
  }

  return lines.join("\n");
}

/**
 * Format a responder profile for display.
 */
export function formatResponder(responder: ResponderProfile, jsonMode: boolean): string {
  if (jsonMode) {
    return JSON.stringify(responder, null, 2);
  }

  const lines: string[] = [];
  lines.push(`Responder: ${responder.id}`);
  lines.push(`Name:      ${responder.name}`);
  lines.push(`Title:     ${responder.title}`);
  lines.push(`Available: ${responder.availability ? "yes" : "no"}`);
  lines.push(`Response SLA: ${formatDuration(responder.responseTimeSla)}`);

  if (responder.domains.length > 0) {
    lines.push(`Domains:   ${responder.domains.join(", ")}`);
  }

  if (responder.tags.length > 0) {
    lines.push(`Tags:      ${responder.tags.join(", ")}`);
  }

  return lines.join("\n");
}

/**
 * Format data as a simple table.
 */
export function formatTable(rows: string[][], headers: string[]): string {
  if (rows.length === 0) {
    return "(no results)";
  }

  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxDataWidth = rows.reduce((max, row) => Math.max(max, (row[i] ?? "").length), 0);
    return Math.max(h.length, maxDataWidth);
  });

  const pad = (str: string, width: number): string => str.padEnd(width);

  const lines: string[] = [];

  // Header row
  lines.push(headers.map((h, i) => pad(h, widths[i])).join("  "));

  // Separator
  lines.push(widths.map((w) => "-".repeat(w)).join("  "));

  // Data rows
  for (const row of rows) {
    lines.push(row.map((cell, i) => pad(cell ?? "", widths[i])).join("  "));
  }

  return lines.join("\n");
}

/**
 * Print output, handling JSON mode.
 */
export function printOutput(data: unknown, jsonMode: boolean): void {
  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2));
  } else if (typeof data === "string") {
    console.log(data);
  } else {
    console.log(data);
  }
}

/**
 * Print an error, handling JSON mode.
 */
export function printError(error: unknown, jsonMode: boolean): void {
  if (jsonMode) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
  } else {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
  }
}
