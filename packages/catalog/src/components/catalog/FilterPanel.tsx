"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type EntityType = "process" | "domain" | "specialization" | "skill" | "agent";

export interface FilterPanelProps {
  /** Current filter values */
  filters: FilterValues;
  /** Callback when filters change */
  onFilterChange: (filters: FilterValues) => void;
  /** Available domains */
  domains?: string[];
  /** Available categories */
  categories?: string[];
  /** Available expertise options (for agents) */
  expertiseOptions?: string[];
  /** Show entity type filters */
  showEntityTypes?: boolean;
  /** Show domain filter */
  showDomain?: boolean;
  /** Show category filter */
  showCategory?: boolean;
  /** Show expertise filter */
  showExpertise?: boolean;
  /** Collapsible panel */
  collapsible?: boolean;
  /** Initially collapsed */
  defaultCollapsed?: boolean;
  /** Custom class name */
  className?: string;
}

export interface FilterValues {
  entityTypes?: EntityType[];
  domain?: string;
  category?: string;
  expertise?: string[];
}

const entityTypeOptions: Array<{ value: EntityType; label: string; icon: React.ReactNode }> = [
  {
    value: "process",
    label: "Processes",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    value: "domain",
    label: "Domains",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    value: "specialization",
    label: "Specializations",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    value: "skill",
    label: "Skills",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    value: "agent",
    label: "Agents",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export function FilterPanel({
  filters,
  onFilterChange,
  domains = [],
  categories = [],
  expertiseOptions = [],
  showEntityTypes = true,
  showDomain = true,
  showCategory = true,
  showExpertise = true,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const handleEntityTypeToggle = (type: EntityType) => {
    const currentTypes = filters.entityTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    onFilterChange({
      ...filters,
      entityTypes: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleDomainChange = (domain: string) => {
    onFilterChange({
      ...filters,
      domain: domain || undefined,
    });
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({
      ...filters,
      category: category || undefined,
    });
  };

  const handleExpertiseToggle = (exp: string) => {
    const currentExpertise = filters.expertise || [];
    const newExpertise = currentExpertise.includes(exp)
      ? currentExpertise.filter((e) => e !== exp)
      : [...currentExpertise, exp];

    onFilterChange({
      ...filters,
      expertise: newExpertise.length > 0 ? newExpertise : undefined,
    });
  };

  const handleClearAll = () => {
    onFilterChange({});
  };

  const hasActiveFilters =
    (filters.entityTypes && filters.entityTypes.length > 0) ||
    filters.domain ||
    filters.category ||
    (filters.expertise && filters.expertise.length > 0);

  const activeFilterCount =
    (filters.entityTypes?.length || 0) +
    (filters.domain ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.expertise?.length || 0);

  const panelContent = (
    <div className="space-y-6">
      {/* Entity Type Filters */}
      {showEntityTypes && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-white">Entity Type</h4>
          <div className="space-y-2">
            {entityTypeOptions.map((option) => {
              const isChecked = filters.entityTypes?.includes(option.value) || false;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 transition-colors",
                    isChecked
                      ? "bg-[rgba(0,223,223,0.1)] text-[var(--scifi-cyan)]"
                      : "text-[rgba(255,255,255,0.5)] hover:bg-[var(--scifi-surface)]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleEntityTypeToggle(option.value)}
                    className="h-4 w-4 rounded border-[rgba(0,223,223,0.3)] bg-[var(--scifi-surface)] text-[var(--scifi-cyan)] focus:ring-[var(--scifi-cyan)]"
                  />
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Domain Filter */}
      {showDomain && domains.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-white">Domain</h4>
          <select
            value={filters.domain || ""}
            onChange={(e) => handleDomainChange(e.target.value)}
            className="w-full rounded-sm bg-[var(--scifi-surface)] px-3 py-2 text-sm text-white focus:outline-none"
            style={{
              border: '1px solid rgba(0, 223, 223, 0.2)',
            }}
          >
            <option value="">All Domains</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Filter */}
      {showCategory && categories.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-white">Category</h4>
          <select
            value={filters.category || ""}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-sm bg-[var(--scifi-surface)] px-3 py-2 text-sm text-white focus:outline-none"
            style={{
              border: '1px solid rgba(0, 223, 223, 0.2)',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Expertise Multi-Select */}
      {showExpertise && expertiseOptions.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-white">Expertise</h4>
          <div className="flex flex-wrap gap-1.5">
            {expertiseOptions.map((exp) => {
              const isSelected = filters.expertise?.includes(exp) || false;
              return (
                <Badge
                  key={exp}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-[rgba(0,223,223,0.15)] border-[rgba(0,223,223,0.4)]"
                  )}
                  onClick={() => handleExpertiseToggle(exp)}
                >
                  {exp}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(255, 0, 224, 0.1)' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={!hasActiveFilters}
          className="flex-1"
        >
          Clear All
        </Button>
      </div>
    </div>
  );

  if (collapsible) {
    return (
      <div
        className={cn("rounded-sm", className)}
        style={{
          background: 'var(--scifi-card)',
          border: '1px solid rgba(255, 0, 224, 0.15)',
        }}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[var(--scifi-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium text-white">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="accent" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <svg
            className={cn(
              "h-5 w-5 text-[rgba(255,255,255,0.4)] transition-transform",
              isCollapsed ? "" : "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!isCollapsed && (
          <div className="p-4" style={{ borderTop: '1px solid rgba(255, 0, 224, 0.1)' }}>
            {panelContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-sm p-4", className)}
      style={{
        background: 'var(--scifi-card)',
        border: '1px solid rgba(255, 0, 224, 0.15)',
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-[var(--scifi-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <h3 className="font-medium text-white">Filters</h3>
        {activeFilterCount > 0 && (
          <Badge variant="accent" className="ml-1">
            {activeFilterCount}
          </Badge>
        )}
      </div>
      {panelContent}
    </div>
  );
}

export default FilterPanel;
