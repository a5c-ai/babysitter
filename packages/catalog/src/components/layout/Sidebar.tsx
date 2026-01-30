"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Route } from "next";

interface SidebarSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: SidebarItem[];
  defaultExpanded?: boolean;
}

interface SidebarItem {
  label: string;
  href: string;
  count?: number;
  icon?: React.ReactNode;
}

const defaultSections: SidebarSection[] = [
  {
    id: "processes",
    title: "Processes",
    defaultExpanded: true,
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    items: [
      { label: "All Processes", href: "/processes" },
      { label: "Templates", href: "/processes/templates" },
      { label: "Recent", href: "/processes/recent" },
    ],
  },
  {
    id: "skills",
    title: "Skills",
    defaultExpanded: true,
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    items: [
      { label: "All Skills", href: "/skills" },
      { label: "By Category", href: "/skills/categories" },
      { label: "Popular", href: "/skills/popular" },
    ],
  },
  {
    id: "agents",
    title: "Agents",
    defaultExpanded: true,
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    items: [
      { label: "All Agents", href: "/agents" },
      { label: "By Role", href: "/agents/roles" },
      { label: "Active", href: "/agents/active" },
    ],
  },
  {
    id: "domains",
    title: "Domains",
    defaultExpanded: false,
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    items: [
      { label: "All Domains", href: "/domains" },
      { label: "Science", href: "/domains/science" },
      { label: "Engineering", href: "/domains/engineering" },
      { label: "Business", href: "/domains/business" },
    ],
  },
  {
    id: "specializations",
    title: "Specializations",
    defaultExpanded: false,
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    items: [
      { label: "All Specializations", href: "/specializations" },
      { label: "Mathematics", href: "/specializations/mathematics" },
      { label: "Computer Science", href: "/specializations/computer-science" },
    ],
  },
];

export interface SidebarProps {
  /** Custom sections to display */
  sections?: SidebarSection[];
  /** Current active path for highlighting */
  activePath?: string;
  /** Custom class name */
  className?: string;
  /** Whether sidebar is collapsed (mobile) */
  isCollapsed?: boolean;
  /** Callback when sidebar collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({
  sections = defaultSections,
  activePath,
  className,
  isCollapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(sections.filter((s) => s.defaultExpanded).map((s) => s.id))
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onCollapsedChange?.(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 transform border-r border-[var(--color-border-default)] bg-[var(--color-canvas-default)] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isCollapsed ? "-translate-x-full" : "translate-x-0",
          className
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto py-4">
          {/* Mobile Close Button */}
          <div className="mb-2 flex items-center justify-between px-4 lg:hidden">
            <span className="text-sm font-semibold text-[var(--color-fg-default)]">
              Navigation
            </span>
            <button
              onClick={() => onCollapsedChange?.(true)}
              className="rounded-md p-1 text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg-default)]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sections */}
          <nav className="flex-1 space-y-1 px-2">
            {sections.map((section) => (
              <div key={section.id} className="py-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm font-semibold text-[var(--color-fg-default)] hover:bg-[var(--color-canvas-subtle)]"
                >
                  <div className="flex items-center gap-2">
                    {section.icon && (
                      <span className="text-[var(--color-fg-muted)]">
                        {section.icon}
                      </span>
                    )}
                    <span>{section.title}</span>
                  </div>
                  <svg
                    className={cn(
                      "h-4 w-4 text-[var(--color-fg-muted)] transition-transform",
                      expandedSections.has(section.id) && "rotate-90"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Section Items */}
                {expandedSections.has(section.id) && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-[var(--color-border-muted)] pl-2">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href as Route}
                        onClick={() => onCollapsedChange?.(true)}
                        className={cn(
                          "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                          activePath === item.href
                            ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]"
                            : "text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg-default)]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {item.count !== undefined && (
                          <span className="rounded-full bg-[var(--color-neutral-muted)] px-2 py-0.5 text-xs text-[var(--color-fg-muted)]">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto border-t border-[var(--color-border-muted)] px-4 pt-4">
            <p className="text-xs text-[var(--color-fg-muted)]">
              Process Library v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
