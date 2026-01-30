"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface TreeNode {
  id: string;
  name: string;
  type: "domain" | "specialization" | "skill" | "agent" | "process";
  href?: string;
  count?: number;
  children?: TreeNode[];
}

export interface TreeViewProps {
  /** Tree data */
  data: TreeNode[];
  /** Callback when a node is selected */
  onSelect?: (node: TreeNode) => void;
  /** Initially expanded nodes (by id) */
  defaultExpanded?: string[];
  /** Expand all nodes by default */
  expandAll?: boolean;
  /** Show count badges */
  showCounts?: boolean;
  /** Maximum depth to display */
  maxDepth?: number;
  /** Custom class name */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

const typeIcons: Record<TreeNode["type"], React.ReactNode> = {
  domain: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  specialization: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  skill: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  agent: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  process: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

const typeColors: Record<TreeNode["type"], string> = {
  domain: "text-[var(--color-done-fg)]",
  specialization: "text-[var(--color-sponsors-fg)]",
  skill: "text-[var(--color-success-fg)]",
  agent: "text-[var(--color-attention-fg)]",
  process: "text-[var(--color-accent-fg)]",
};

export function TreeView({
  data,
  onSelect,
  defaultExpanded = [],
  expandAll = false,
  showCounts = true,
  maxDepth = 10,
  className,
  compact = false,
}: TreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(() => {
    if (expandAll) {
      const allIds = new Set<string>();
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach((node) => {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        });
      };
      collectIds(data);
      return allIds;
    }
    return new Set(defaultExpanded);
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAllNodes = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        allIds.add(node.id);
        if (node.children) collectIds(node.children);
      });
    };
    collectIds(data);
    setExpanded(allIds);
  };

  const collapseAllNodes = () => {
    setExpanded(new Set());
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Controls */}
      <div className="flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={expandAllNodes}
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
        >
          Expand all
        </button>
        <span className="text-[var(--color-fg-muted)]">|</span>
        <button
          type="button"
          onClick={collapseAllNodes}
          className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
        >
          Collapse all
        </button>
      </div>

      {/* Tree */}
      <div className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] p-2">
        {data.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            depth={0}
            maxDepth={maxDepth}
            expanded={expanded}
            onToggle={toggleExpand}
            onSelect={onSelect}
            showCounts={showCounts}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNodeComponentProps {
  node: TreeNode;
  depth: number;
  maxDepth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect?: (node: TreeNode) => void;
  showCounts: boolean;
  compact: boolean;
}

function TreeNodeComponent({
  node,
  depth,
  maxDepth,
  expanded,
  onToggle,
  onSelect,
  showCounts,
  compact,
}: TreeNodeComponentProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const canExpand = hasChildren && depth < maxDepth;

  const handleClick = (e: React.MouseEvent) => {
    if (canExpand) {
      e.preventDefault();
      onToggle(node.id);
    }
    onSelect?.(node);
  };

  const content = (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 transition-colors",
        compact ? "py-1" : "py-1.5",
        "hover:bg-[var(--color-canvas-subtle)]"
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      {/* Expand/collapse button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (canExpand) onToggle(node.id);
        }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded",
          canExpand ? "hover:bg-[var(--color-neutral-muted)]" : ""
        )}
        disabled={!canExpand}
        aria-label={isExpanded ? "Collapse" : "Expand"}
      >
        {canExpand && (
          <svg
            className={cn(
              "h-3 w-3 text-[var(--color-fg-muted)] transition-transform",
              isExpanded && "rotate-90"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* Icon */}
      <span className={cn("shrink-0", typeColors[node.type])}>
        {typeIcons[node.type]}
      </span>

      {/* Name */}
      <span className="flex-1 truncate text-sm text-[var(--color-fg-default)] group-hover:text-[var(--color-accent-fg)]">
        {node.name}
      </span>

      {/* Count badge */}
      {showCounts && node.count !== undefined && node.count > 0 && (
        <Badge variant="secondary" className="text-xs shrink-0">
          {node.count}
        </Badge>
      )}
    </div>
  );

  return (
    <div>
      {node.href ? (
        <Link href={node.href as Route} onClick={handleClick} className="block">
          {content}
        </Link>
      ) : (
        <div onClick={handleClick} className="cursor-pointer">
          {content}
        </div>
      )}

      {/* Children */}
      {canExpand && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              showCounts={showCounts}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TreeView;
