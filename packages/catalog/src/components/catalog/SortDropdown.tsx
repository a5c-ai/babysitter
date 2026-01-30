"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SortOption = {
  value: string;
  label: string;
  direction?: "asc" | "desc";
};

export interface SortDropdownProps {
  /** Current sort value */
  value?: string;
  /** Current sort direction */
  direction?: "asc" | "desc";
  /** Callback when sort changes */
  onChange?: (value: string, direction: "asc" | "desc") => void;
  /** Available sort options */
  options?: SortOption[];
  /** Custom class name */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Show direction toggle */
  showDirectionToggle?: boolean;
}

const defaultOptions: SortOption[] = [
  { value: "name", label: "Name (A-Z)", direction: "asc" },
  { value: "name", label: "Name (Z-A)", direction: "desc" },
  { value: "updatedAt", label: "Recently Modified", direction: "desc" },
  { value: "createdAt", label: "Newest First", direction: "desc" },
  { value: "createdAt", label: "Oldest First", direction: "asc" },
  { value: "relevance", label: "Most Relevant", direction: "desc" },
];

export function SortDropdown({
  value = "name",
  direction = "asc",
  onChange,
  options = defaultOptions,
  className,
  size = "md",
  showDirectionToggle = false,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Create combined value for dropdown
  const combinedValue = `${value}-${direction}`;

  // Find current option
  const currentOption = options.find(
    (opt) => opt.value === value && opt.direction === direction
  ) || options[0];

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: SortOption) => {
    onChange?.(option.value, option.direction || "asc");
    setIsOpen(false);
  };

  const toggleDirection = () => {
    onChange?.(value, direction === "asc" ? "desc" : "asc");
  };

  const sizeClasses = {
    sm: "h-8 text-xs px-2",
    md: "h-9 text-sm px-3",
  };

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      <div className="flex items-center gap-1">
        {/* Main dropdown button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[var(--color-fg-default)] transition-colors hover:bg-[var(--color-canvas-subtle)] focus:border-[var(--color-accent-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-fg)]",
            sizeClasses[size]
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <svg className="h-4 w-4 text-[var(--color-fg-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <span>{currentOption?.label || "Sort by"}</span>
          <svg
            className={cn(
              "h-4 w-4 text-[var(--color-fg-muted)] transition-transform",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Direction toggle */}
        {showDirectionToggle && (
          <button
            type="button"
            onClick={toggleDirection}
            className={cn(
              "flex items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg-default)] focus:border-[var(--color-accent-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-fg)]",
              size === "sm" ? "h-8 w-8" : "h-9 w-9"
            )}
            aria-label={`Sort ${direction === "asc" ? "ascending" : "descending"}`}
          >
            {direction === "asc" ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] py-1 shadow-lg"
          role="listbox"
        >
          {options.map((option, index) => {
            const optionValue = `${option.value}-${option.direction}`;
            const isSelected = optionValue === combinedValue;

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)]"
                    : "text-[var(--color-fg-default)] hover:bg-[var(--color-canvas-subtle)]"
                )}
                role="option"
                aria-selected={isSelected}
              >
                {/* Check mark for selected */}
                <span className="w-4">
                  {isSelected && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SortDropdown;
