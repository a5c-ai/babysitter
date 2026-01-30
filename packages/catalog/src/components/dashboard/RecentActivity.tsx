"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type EntityType = "agent" | "skill" | "process" | "domain" | "specialization";

export interface ActivityItem {
  type: EntityType;
  id: number;
  name: string;
  updatedAt: string;
  action?: "created" | "updated" | "deleted";
}

export interface RecentActivityProps {
  items: ActivityItem[];
  className?: string;
  maxItems?: number;
  showHeader?: boolean;
  title?: string;
  description?: string;
}

const TYPE_ICONS: Record<EntityType, React.ReactNode> = {
  agent: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  skill: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  process: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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

const TYPE_COLORS: Record<EntityType, string> = {
  agent: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  skill: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  process: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  domain: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  specialization: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

function getHref(item: ActivityItem): string {
  switch (item.type) {
    case "agent":
      return `/agents/${encodeURIComponent(item.name)}`;
    case "skill":
      return `/skills/${encodeURIComponent(item.name)}`;
    case "process":
      return `/processes/${item.id}`;
    case "domain":
      return `/domains/${encodeURIComponent(item.name)}`;
    case "specialization":
      return `/specializations/${encodeURIComponent(item.name)}`;
    default:
      return "#";
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <Link
      href={getHref(item) as Route}
      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          TYPE_COLORS[item.type]
        )}>
          {TYPE_ICONS[item.type]}
        </div>
        <div>
          <p className="text-sm font-medium leading-none">{item.name}</p>
          <p className="mt-1 text-xs text-muted-foreground capitalize">
            {item.action || "updated"} {item.type}
          </p>
        </div>
      </div>
      <time className="text-xs text-muted-foreground">
        {formatRelativeTime(item.updatedAt)}
      </time>
    </Link>
  );
}

export function RecentActivity({
  items,
  className,
  maxItems = 10,
  showHeader = true,
  title = "Recent Activity",
  description = "Latest additions and modifications",
}: RecentActivityProps) {
  const displayItems = items.slice(0, maxItems);

  return (
    <Card className={cn("w-full", className)}>
      {showHeader && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn(!showHeader && "pt-6")}>
        {displayItems.length > 0 ? (
          <div className="space-y-1">
            {displayItems.map((item, index) => (
              <ActivityRow key={`${item.type}-${item.id}-${index}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
