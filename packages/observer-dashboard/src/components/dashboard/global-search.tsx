"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/shared/status-badge";
import { friendlyProcessName, formatShortId } from "@/lib/utils";
import type { Run } from "@/types";

interface SearchResult {
  runs: Run[];
  totalCount: number;
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Run[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setHasSearched(false);
      setSelectedIndex(-1);
      return;
    }

    let cancelled = false;

    async function fetchResults() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search: debouncedQuery,
          limit: "10",
        });
        const res = await fetch(`/api/runs?${params}`);
        if (!res.ok) throw new Error("Search failed");
        const data: SearchResult = await res.json();
        if (!cancelled) {
          setResults(data.runs ?? []);
          setHasSearched(true);
          setSelectedIndex(-1);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setHasSearched(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Navigate to a run
  const navigateToRun = useCallback(
    (runId: string) => {
      setIsOpen(false);
      setQuery("");
      setResults([]);
      setHasSearched(false);
      router.push(`/runs/${runId}`);
    },
    [router]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            navigateToRun(results[selectedIndex].runId);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, selectedIndex, navigateToRun]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-search-item]");
      items[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Cmd+K / Ctrl+K and "/" global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      // "/" key to focus search (skip if already in an input)
      if (
        e.key === "/" &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = isOpen && (query.trim().length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto mb-6">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search runs by ID, process name, or task title..."
          className={cn(
            "w-full rounded-lg border border-border bg-card/80 backdrop-blur-sm",
            "pl-10 pr-20 py-2.5 text-sm text-foreground",
            "placeholder:text-foreground-muted/60",
            "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30",
            "focus:shadow-neon-glow-primary-focus transition-all"
          )}
          data-testid="global-search-input"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-foreground-secondary transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background-secondary px-1.5 py-0.5 text-xs font-medium text-foreground-muted">
            <span className="text-xs">{typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent) ? "\u2318" : "Ctrl"}</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Dropdown results */}
      {showDropdown && (
        <div
          className={cn(
            "absolute z-50 top-full left-0 right-0 mt-1.5",
            "rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-xl",
            "overflow-hidden"
          )}
          data-testid="global-search-dropdown"
        >
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-foreground-muted">
              <div className="h-3 w-3 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
              Searching...
            </div>
          )}

          {!isLoading && hasSearched && results.length === 0 && (
            <div className="px-4 py-6 text-center">
              <Search className="h-5 w-5 text-foreground-muted/30 mx-auto mb-2" />
              <p className="text-xs text-foreground-muted">
                No runs found for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <ul ref={listRef} className="max-h-80 overflow-y-auto py-1" role="listbox">
              {results.map((run, index) => (
                <li
                  key={run.runId}
                  data-search-item
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => navigateToRun(run.runId)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                    index === selectedIndex
                      ? "bg-primary/10"
                      : "hover:bg-background-secondary/60"
                  )}
                >
                  {/* Status dot */}
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      run.status === "completed"
                        ? "bg-success"
                        : run.status === "failed"
                        ? "bg-error"
                        : run.status === "waiting" || run.status === "pending"
                        ? "bg-warning"
                        : "bg-foreground-muted"
                    )}
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {friendlyProcessName(run.processId)}
                      </span>
                      <StatusBadge
                        status={run.status}
                        waitingKind={run.waitingKind}
                        isStale={run.isStale}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {run.projectName && (
                        <span className="text-xs text-foreground-muted">
                          {run.projectName}
                        </span>
                      )}
                      <span className="font-mono text-xs text-info">
                        {formatShortId(run.runId, 8)}
                      </span>
                    </div>
                  </div>
                  {/* Navigate arrow */}
                  <ArrowRight
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-colors",
                      index === selectedIndex
                        ? "text-primary"
                        : "text-foreground-muted/40"
                    )}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
