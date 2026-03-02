"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchInputWithSuggestions } from "@/components/common/SearchInput";

export type EntityType = "process" | "domain" | "specialization" | "skill" | "agent";

export interface SearchBarProps {
  /** Search query value */
  value?: string;
  /** Callback when search value changes */
  onSearch?: (value: string) => void;
  /** Callback when filters change */
  onFilterChange?: (filters: SearchFilters) => void;
  /** Current filters */
  filters?: SearchFilters;
  /** Available domains for filtering */
  domains?: string[];
  /** Autocomplete suggestions */
  suggestions?: string[];
  /** Callback when suggestion is selected */
  onSuggestionSelect?: (suggestion: string) => void;
  /** Show loading state */
  isLoading?: boolean;
  /** Custom class name */
  className?: string;
}

export interface SearchFilters {
  entityType?: EntityType | "all";
  domain?: string;
}

const entityTypeOptions: Array<{ value: EntityType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "process", label: "Processes" },
  { value: "domain", label: "Domains" },
  { value: "specialization", label: "Specializations" },
  { value: "skill", label: "Skills" },
  { value: "agent", label: "Agents" },
];

export function SearchBar({
  value = "",
  onSearch,
  onFilterChange,
  filters = {},
  domains = [],
  suggestions = [],
  onSuggestionSelect,
  isLoading = false,
  className,
}: SearchBarProps) {
  const [localFilters, setLocalFilters] = React.useState<SearchFilters>(filters);

  // Sync external filters - use individual properties to avoid object comparison issues
  const externalEntityType = filters.entityType;
  const externalDomain = filters.domain;
  React.useEffect(() => {
    setLocalFilters({ entityType: externalEntityType, domain: externalDomain });
  }, [externalEntityType, externalDomain]);

  const handleFilterChange = (key: keyof SearchFilters, filterValue: string) => {
    const newFilters = {
      ...localFilters,
      [key]: filterValue === "all" || filterValue === "" ? undefined : filterValue,
    };
    setLocalFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleClearAll = () => {
    const clearedFilters: SearchFilters = {};
    setLocalFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
    onSearch?.("");
  };

  const hasActiveFilters =
    localFilters.entityType ||
    localFilters.domain ||
    value.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input Row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchInputWithSuggestions
            value={value}
            onChange={onSearch}
            onSubmit={onSearch}
            suggestions={suggestions}
            onSuggestionSelect={onSuggestionSelect}
            isLoading={isLoading}
            placeholder="Search processes, skills, agents..."
            inputSize="lg"
          />
        </div>

        {/* Entity Type Filter */}
        <div className="flex gap-2">
          <select
            value={localFilters.entityType || "all"}
            onChange={(e) => handleFilterChange("entityType", e.target.value)}
            className="h-10 min-w-[140px] rounded-sm bg-[var(--scifi-surface)] px-3 text-sm text-white focus:outline-none"
            style={{
              border: '1px solid rgba(0, 223, 223, 0.2)',
              transition: 'all 0.2s ease',
            }}
            aria-label="Filter by entity type"
          >
            {entityTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Domain Filter */}
          {domains.length > 0 && (
            <select
              value={localFilters.domain || ""}
              onChange={(e) => handleFilterChange("domain", e.target.value)}
              className="h-10 min-w-[140px] rounded-sm bg-[var(--scifi-surface)] px-3 text-sm text-white focus:outline-none"
              style={{
                border: '1px solid rgba(0, 223, 223, 0.2)',
                transition: 'all 0.2s ease',
              }}
              aria-label="Filter by domain"
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Active Filters & Clear */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[rgba(255,255,255,0.4)]">Active filters:</span>

          {value && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(0,223,223,0.1)] border border-[rgba(0,223,223,0.2)] px-2 py-0.5 text-xs text-[var(--scifi-cyan)]">
              Search: &quot;{value}&quot;
              <button
                type="button"
                onClick={() => onSearch?.("")}
                className="ml-1 rounded-full hover:bg-[rgba(0,223,223,0.2)]"
                aria-label="Clear search"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {localFilters.entityType && localFilters.entityType !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.2)] px-2 py-0.5 text-xs text-[#00FF88]">
              Type: {localFilters.entityType}
              <button
                type="button"
                onClick={() => handleFilterChange("entityType", "all")}
                className="ml-1 rounded-full hover:bg-[rgba(0,255,136,0.2)]"
                aria-label="Clear type filter"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {localFilters.domain && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] px-2 py-0.5 text-xs text-[var(--scifi-yellow)]">
              Domain: {localFilters.domain}
              <button
                type="button"
                onClick={() => handleFilterChange("domain", "")}
                className="ml-1 rounded-full hover:bg-[rgba(255,215,0,0.2)]"
                aria-label="Clear domain filter"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-[rgba(255,255,255,0.4)] hover:text-white"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
