/**
 * Tree — tree-view primitive for the Babysitter TUI.
 *
 * Exports:
 *   - buildTreeLines(nodes, parentPrefix?, depth?) — pure function
 *   - Tree — React component (uses InkContext + ThemeContext)
 */

import React from "react";
import { useInk } from "../../contexts/InkContext.js";
import { useTheme } from "../../hooks/useTheme.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TreeNode {
  readonly label: string;
  readonly children?: readonly TreeNode[];
  readonly color?: string;
  readonly icon?: string;
}

export interface TreeLine {
  readonly prefix: string;
  readonly label: string;
  readonly depth: number;
  readonly color?: string;
  readonly icon?: string;
}

export interface TreeProps {
  readonly nodes: readonly TreeNode[];
}

// ---------------------------------------------------------------------------
// Branch characters
// ---------------------------------------------------------------------------

const BRANCH = "\u251c\u2500\u2500 "; // "├── "
const LAST_BRANCH = "\u2514\u2500\u2500 "; // "└── "
const CONTINUATION = "\u2502   "; // "│   "
const SPACING = "    "; // "    "

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

export function buildTreeLines(
  nodes: readonly TreeNode[],
  parentPrefix: string = "",
  depth: number = 0,
): TreeLine[] {
  const lines: TreeLine[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;

    let prefix: string;
    if (depth === 0 && nodes.length === 1 && !node.children?.length) {
      prefix = "";
    } else if (depth === 0) {
      prefix = isLast ? LAST_BRANCH : BRANCH;
    } else {
      prefix = parentPrefix + (isLast ? LAST_BRANCH : BRANCH);
    }

    const line: TreeLine = {
      prefix,
      label: node.label,
      depth,
      ...(node.color !== undefined ? { color: node.color } : {}),
      ...(node.icon !== undefined ? { icon: node.icon } : {}),
    };
    lines.push(line);

    if (node.children && node.children.length > 0) {
      const childPrefix =
        depth === 0
          ? isLast
            ? SPACING
            : CONTINUATION
          : parentPrefix + (isLast ? SPACING : CONTINUATION);

      const childLines = buildTreeLines(node.children, childPrefix, depth + 1);
      lines.push(...childLines);
    }
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Tree({ nodes }: TreeProps): React.JSX.Element {
  const { Box, Text } = useInk();
  const { colors } = useTheme();
  const lines = buildTreeLines(nodes);

  return React.createElement(
    Box as React.ComponentType<Record<string, unknown>>,
    { flexDirection: "column" },
    ...lines.map((line) =>
      React.createElement(
        Box as React.ComponentType<Record<string, unknown>>,
        { key: `${line.depth}-${line.label}`, flexDirection: "row" },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: colors.border },
          line.prefix,
        ),
        line.icon
          ? React.createElement(
              Text as React.ComponentType<Record<string, unknown>>,
              { color: line.color ?? colors.foreground },
              `${line.icon} `,
            )
          : null,
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { color: line.color ?? colors.foreground },
          line.label,
        ),
      ),
    ),
  );
}
