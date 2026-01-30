"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Route } from "next";

interface NavItem {
  label: string;
  href: Route | string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Processes", href: "/processes" },
  { label: "Skills", href: "/skills" },
  { label: "Agents", href: "/agents" },
  { label: "Domains", href: "/domains" },
];

export interface HeaderProps {
  /** Optional custom logo component */
  logo?: React.ReactNode;
  /** Optional custom title */
  title?: string;
  /** Optional additional navigation items */
  extraNavItems?: NavItem[];
  /** Callback when search is submitted */
  onSearch?: (query: string) => void;
  /** Current active path for highlighting */
  activePath?: string;
  /** Custom class name */
  className?: string;
}

export function Header({
  logo,
  title = "Babysitter Catalog",
  extraNavItems = [],
  onSearch,
  activePath,
  className,
}: HeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const allNavItems = [...navItems, ...extraNavItems];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      // Default behavior: navigate to search page
      const searchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      router.push(searchUrl as Route);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const searchInput = document.getElementById("header-search");
      searchInput?.focus();
    }
  };

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown as unknown as EventListener);
    return () => {
      document.removeEventListener("keydown", handleKeyDown as unknown as EventListener);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-[var(--color-border-default)] bg-[var(--color-canvas-default)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-canvas-default)]/60",
        className
      )}
    >
      <div className="container mx-auto flex h-14 max-w-7xl items-center px-4">
        {/* Logo and Title */}
        <div className="mr-4 flex items-center">
          <Link href={"/" as Route} className="mr-6 flex items-center space-x-2">
            {logo || (
              <svg
                className="h-6 w-6 text-[var(--color-accent-fg)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            )}
            <span className="hidden font-bold text-[var(--color-fg-default)] sm:inline-block">
              {title}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
          {allNavItems.map((item) => (
            <Link
              key={String(item.href)}
              href={item.href as Route}
              className={cn(
                "transition-colors hover:text-[var(--color-fg-default)]",
                activePath === item.href
                  ? "text-[var(--color-fg-default)]"
                  : "text-[var(--color-fg-muted)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side - Search and Mobile Menu */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="hidden md:block">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                id="header-search"
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-40 rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] pl-9 pr-12 text-sm text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-fg)] lg:w-64"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)] px-1.5 font-mono text-[10px] font-medium text-[var(--color-fg-muted)] sm:flex">
                <span className="text-xs">Ctrl</span>K
              </kbd>
            </div>
          </form>

          {/* GitHub Link */}
          <a
            href="https://github.com/a5c-ai/babysitter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg-default)]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="sr-only">GitHub</span>
          </a>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-[var(--color-border-default)] bg-[var(--color-canvas-default)] md:hidden">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] pl-9 pr-4 text-sm text-[var(--color-fg-default)] placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-fg)]"
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-1">
              {allNavItems.map((item) => (
                <Link
                  key={String(item.href)}
                  href={item.href as Route}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    activePath === item.href
                      ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]"
                      : "text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg-default)]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
