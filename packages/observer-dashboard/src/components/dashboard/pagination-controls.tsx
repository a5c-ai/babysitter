'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className
}: PaginationControlsProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = currentPage * itemsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  if (totalItems === 0) {
    return null;
  }

  // Build visible page numbers: show first, last, current, and neighbors
  const pageNumbers: (number | 'ellipsis')[] = [];
  if (totalPages <= 5) {
    for (let i = 0; i < totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(0);
    if (currentPage > 2) pageNumbers.push('ellipsis');
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
      pageNumbers.push(i);
    }
    if (currentPage < totalPages - 3) pageNumbers.push('ellipsis');
    pageNumbers.push(totalPages - 1);
  }

  return (
    <div className={cn('flex items-center justify-between border-t border-border pt-3', className)}>
      <span className="text-xs text-foreground-muted tabular-nums">
        {startItem}–{endItem} of {totalItems}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-md text-xs transition-all',
            canGoPrev
              ? 'text-foreground hover:bg-primary-muted hover:text-primary hover:shadow-neon-glow-primary-xs cursor-pointer'
              : 'text-foreground-muted cursor-not-allowed opacity-40'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageNumbers.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="inline-flex h-11 w-5 items-center justify-center text-xs text-foreground-muted">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'inline-flex h-11 min-w-[44px] items-center justify-center rounded-md px-1.5 text-xs font-medium tabular-nums transition-all',
                p === currentPage
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground-secondary cursor-pointer'
              )}
            >
              {p + 1}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-md text-xs transition-all',
            canGoNext
              ? 'text-foreground hover:bg-primary-muted hover:text-primary hover:shadow-neon-glow-primary-xs cursor-pointer'
              : 'text-foreground-muted cursor-not-allowed opacity-40'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
