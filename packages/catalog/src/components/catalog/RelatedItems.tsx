"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type RelatedItemType = "process" | "skill" | "agent" | "domain" | "specialization";

export interface RelatedItem {
  id: number | string;
  name: string;
  description: string;
  subtitle?: string;
  href: string;
  type: RelatedItemType;
}

export interface RelatedItemsProps {
  /** Title for the section */
  title: string;
  /** Items to display */
  items: RelatedItem[];
  /** Maximum items to show */
  maxItems?: number;
  /** Show "View all" link */
  viewAllHref?: string;
  /** Custom class name */
  className?: string;
}

const typeIcons: Record<RelatedItemType, React.ReactNode> = {
  process: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
};

const typeColors: Record<RelatedItemType, string> = {
  process: "bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]",
  skill: "bg-[var(--color-success-subtle)] text-[var(--color-success-fg)]",
  agent: "bg-[var(--color-attention-subtle)] text-[var(--color-attention-fg)]",
  domain: "bg-[var(--color-done-subtle)] text-[var(--color-done-fg)]",
  specialization: "bg-[var(--color-sponsors-subtle)] text-[var(--color-sponsors-fg)]",
};

export function RelatedItems({
  title,
  items,
  maxItems = 5,
  viewAllHref,
  className,
}: RelatedItemsProps) {
  const displayedItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {(hasMore || viewAllHref) && (
          <Link
            href={(viewAllHref || "#") as Route}
            className="text-sm text-[var(--color-accent-fg)] hover:underline"
          >
            View all ({items.length})
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayedItems.map((item) => (
            <RelatedItemCard key={item.id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RelatedItemCard({ item }: { item: RelatedItem }) {
  return (
    <Link
      href={item.href as Route}
      className="group flex items-start gap-3 rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] p-3 transition-colors hover:border-[var(--color-accent-fg)] hover:bg-[var(--color-canvas-subtle)]"
    >
      {/* Type icon */}
      <div className={cn("rounded-md p-1.5 shrink-0", typeColors[item.type])}>
        {typeIcons[item.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-fg-default)] truncate group-hover:text-[var(--color-accent-fg)]">
            {item.name}
          </span>
          <Badge variant="outline" className="text-xs shrink-0">
            {item.type}
          </Badge>
        </div>
        {item.subtitle && (
          <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">{item.subtitle}</p>
        )}
        <p className="text-sm text-[var(--color-fg-muted)] line-clamp-1 mt-1">
          {item.description}
        </p>
      </div>

      {/* Arrow */}
      <svg
        className="h-4 w-4 shrink-0 text-[var(--color-fg-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-accent-fg)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default RelatedItems;
