"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems?: number;
  /** Items per page */
  itemsPerPage?: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  /** Available items per page options */
  itemsPerPageOptions?: number[];
  /** Show items per page selector */
  showItemsPerPage?: boolean;
  /** Show total count */
  showTotalCount?: boolean;
  /** Number of page buttons to show */
  siblingCount?: number;
  /** Custom class name */
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  showItemsPerPage = true,
  showTotalCount = true,
  siblingCount = 1,
  className,
}: PaginationProps) {
  // Generate page numbers to display
  const generatePageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      const leftSibling = Math.max(currentPage - siblingCount, 2);
      const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);

      // Add left ellipsis if needed
      if (leftSibling > 2) {
        pages.push("ellipsis");
      } else if (leftSibling === 2) {
        pages.push(2);
      }

      // Add pages around current page
      for (let i = leftSibling; i <= rightSibling; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      // Add right ellipsis if needed
      if (rightSibling < totalPages - 1) {
        pages.push("ellipsis");
      } else if (rightSibling === totalPages - 1) {
        pages.push(totalPages - 1);
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  // Calculate displayed range
  const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-4 sm:flex-row",
        className
      )}
    >
      {/* Left side - Total count and items per page */}
      <div className="flex items-center gap-4 text-sm text-[var(--color-fg-muted)]">
        {showTotalCount && totalItems !== undefined && (
          <span>
            Showing{" "}
            <span className="font-medium text-[var(--color-fg-default)]">
              {startItem}-{endItem}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[var(--color-fg-default)]">
              {totalItems}
            </span>{" "}
            items
          </span>
        )}

        {showItemsPerPage && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="sr-only">
              Items per page
            </label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="h-8 rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] px-2 text-sm text-[var(--color-fg-default)] focus:border-[var(--color-accent-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-fg)]"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side - Page navigation */}
      <nav
        className="flex items-center gap-1"
        role="navigation"
        aria-label="Pagination"
      >
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className="h-8 w-8 p-0"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-8 w-8 items-center justify-center text-[var(--color-fg-muted)]"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-8 w-8 p-0",
                  isActive && "pointer-events-none"
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className="h-8 w-8 p-0"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </nav>
    </div>
  );
}

/** Simple pagination with just prev/next */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: Pick<
  PaginationProps,
  "currentPage" | "totalPages" | "onPageChange" | "className"
>) {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <svg
          className="mr-1 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Previous
      </Button>

      <span className="text-sm text-[var(--color-fg-muted)]">
        Page{" "}
        <span className="font-medium text-[var(--color-fg-default)]">
          {currentPage}
        </span>{" "}
        of{" "}
        <span className="font-medium text-[var(--color-fg-default)]">
          {totalPages}
        </span>
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
        <svg
          className="ml-1 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Button>
    </div>
  );
}

export default Pagination;
