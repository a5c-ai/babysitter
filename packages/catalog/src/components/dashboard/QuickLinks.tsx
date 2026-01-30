"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface QuickLinkItem {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  count?: number;
  color?: string;
}

export interface QuickLinksProps {
  links: QuickLinkItem[];
  className?: string;
  columns?: 2 | 3 | 4;
}

const COLUMN_CLASSES = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function QuickLinkCard({ link }: { link: QuickLinkItem }) {
  return (
    <Link href={link.href as Route} className="group">
      <Card className="h-full transition-all duration-200 hover:border-primary/50 hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-lg p-2",
                  link.color || "bg-primary/10 text-primary"
                )}
              >
                {link.icon}
              </div>
              <CardTitle className="text-lg transition-colors group-hover:text-primary">
                {link.title}
              </CardTitle>
            </div>
            {link.count !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {link.count.toLocaleString()}
              </Badge>
            )}
          </div>
          <CardDescription className="mt-2">{link.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

// Default quick links configuration
export const DEFAULT_QUICK_LINKS: QuickLinkItem[] = [
  {
    title: "Browse Processes",
    description: "View all process definitions with filtering and search",
    href: "/processes",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    title: "Explore Domains",
    description: "Browse the hierarchical domain structure",
    href: "/domains",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    title: "Skills Catalog",
    description: "Find reusable skills organized by category",
    href: "/skills",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    title: "Agents Directory",
    description: "Discover specialized agents by expertise",
    href: "/agents",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
];

export function QuickLinks({
  links = DEFAULT_QUICK_LINKS,
  className,
  columns = 4,
}: QuickLinksProps) {
  return (
    <div className={cn("grid gap-4", COLUMN_CLASSES[columns], className)}>
      {links.map((link, index) => (
        <QuickLinkCard key={index} link={link} />
      ))}
    </div>
  );
}

export default QuickLinks;
