/**
 * EffectsPanel — renders the effects tree and pending effect summaries.
 *
 * Consumes EffectsContext for effect data and uses pure helpers from helpers.ts:
 * - buildEffectTree: converts EffectSummary[] to TreeNode[]
 * - getEffectIcon: icon per effect kind
 * - getEffectStatusColor: color per effect status
 * - groupPendingEffects: groups pending effects by kind
 * - summarizePendingGroups: produces display-ready summaries
 *
 * Uses the Tree primitive for tree rendering.
 */

import React from "react";
import { useInk } from "../contexts/InkContext.js";
import { useTheme } from "../hooks/useTheme.js";
import { useEffects } from "../contexts/EffectsContext.js";
import { Tree } from "./primitives/Tree.js";
import {
  buildEffectTree,
  getEffectIcon,
  getEffectStatusColor,
  groupPendingEffects,
  summarizePendingGroups,
} from "../helpers.js";
import type { EffectSummary } from "../types.js";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EffectsPanelProps {
  /** Override effects instead of reading from context. */
  readonly effects?: readonly EffectSummary[];
  /** Whether to show the pending summary section. Defaults to true. */
  readonly showPendingSummary?: boolean;
  /** Maximum tree items to display before truncating. */
  readonly maxTreeItems?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EffectsPanel({
  effects: propEffects,
  showPendingSummary = true,
  maxTreeItems = 20,
}: EffectsPanelProps = {}): React.JSX.Element {
  const { Box, Text } = useInk();
  const { colors } = useTheme();
  const ctx = useEffects();

  const effects = (propEffects ?? ctx.effects) as EffectSummary[];

  // Build tree nodes from effects
  const allTreeNodes = buildEffectTree(effects);
  const truncated = allTreeNodes.length > maxTreeItems;
  const treeNodes = truncated
    ? allTreeNodes.slice(0, maxTreeItems)
    : allTreeNodes;

  // Build pending summaries
  const groups = groupPendingEffects(effects);
  const pendingSummaries = summarizePendingGroups(groups);

  // Phase indicator from context
  const phase = ctx.status.phase;
  const phaseColor =
    phase === "complete"
      ? colors.success
      : phase === "failed"
        ? colors.error
        : phase === "executing"
          ? colors.warning
          : colors.muted;

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column", paddingX: 1 },
    // Header: phase badge + effect count
    React.createElement(
      Box as React.ComponentType<Record<string, unknown>>,
      { flexDirection: "row", gap: 1 },
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { bold: true },
        "Effects",
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: phaseColor },
        `[${phase}]`,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { color: colors.muted },
        `${ctx.status.resolvedEffects}/${ctx.status.totalEffects} resolved`,
      ),
    ),
    // Tree
    effects.length > 0
      ? React.createElement(Tree, { nodes: treeNodes })
      : React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted },
          "No effects",
        ),
    // Truncation notice
    truncated
      ? React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.muted, dimColor: true },
          `... and ${allTreeNodes.length - maxTreeItems} more`,
        )
      : null,
    // Pending summaries
    showPendingSummary && pendingSummaries.length > 0
      ? React.createElement(
          Box as React.ComponentType<Record<string, unknown>>,
          { flexDirection: "column", marginTop: 1 },
          React.createElement(
            Text as React.ComponentType<Record<string, unknown>>,
            { bold: true, color: colors.warning },
            "Pending:",
          ),
          ...pendingSummaries.map((summary) =>
            React.createElement(
              Box as React.ComponentType<Record<string, unknown>>,
              { key: summary.kind, flexDirection: "row", gap: 1 },
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { color: colors[getEffectStatusColor("pending") as keyof typeof colors] ?? colors.warning },
                getEffectIcon(summary.kind),
              ),
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                {},
                `${summary.kind} (${summary.count})`,
              ),
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { color: colors.muted },
                summary.titles.slice(0, 3).join(", ") +
                  (summary.titles.length > 3
                    ? ` +${summary.titles.length - 3} more`
                    : ""),
              ),
            ),
          ),
        )
      : null,
  );
}
