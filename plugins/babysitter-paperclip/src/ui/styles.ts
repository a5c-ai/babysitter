/**
 * Shared inline style objects for Babysitter UI components.
 */

import type { CSSProperties } from "react";

export const card: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 16,
  display: "grid",
  gap: 12,
};

export const badge = (color: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 12,
  background: color,
  color: "white",
});

export const statusColors: Record<string, string> = {
  running: "#22c55e",
  waiting: "#eab308",
  completed: "#6b7280",
  failed: "#ef4444",
};

export const mono: CSSProperties = {
  fontFamily: "monospace",
  fontSize: 12,
};

export const muted: CSSProperties = {
  color: "var(--muted-foreground)",
  fontSize: 13,
};

export const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

export const grid = (gap = 8): CSSProperties => ({
  display: "grid",
  gap,
});

export const button: CSSProperties = {
  fontSize: 12,
  padding: "4px 12px",
  borderRadius: 4,
  border: "1px solid var(--border)",
  cursor: "pointer",
  background: "transparent",
};

export const primaryButton: CSSProperties = {
  ...button,
  background: "var(--primary)",
  color: "var(--primary-foreground)",
  border: "none",
};

export const destructiveButton: CSSProperties = {
  ...button,
  background: "var(--destructive)",
  color: "var(--destructive-foreground)",
  border: "none",
};
