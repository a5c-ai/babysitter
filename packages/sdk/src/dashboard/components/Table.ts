/**
 * Table — simple terminal table with headers and rows.
 */
import { colors, colorize } from "../colors";

export interface TableOptions {
  padding?: number;
}

export function renderTable(
  headers: string[],
  rows: string[][],
  options: TableOptions = {},
): string {
  const { padding = 2 } = options;

  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] ?? "").length), 0);
    return Math.max(h.length, maxRow);
  });

  const pad = " ".repeat(padding);

  // Header line
  const headerLine = headers
    .map((h, i) => colorize(h.padEnd(colWidths[i]), colors.bold))
    .join(pad);

  // Separator
  const separator = colWidths.map((w) => "\u2500".repeat(w)).join(pad);

  // Data rows
  const dataLines = rows.map((row) =>
    row.map((cell, i) => (cell ?? "").padEnd(colWidths[i] ?? 0)).join(pad),
  );

  return [headerLine, separator, ...dataLines].join("\n");
}
