import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Action button href (alternative to onAction) */
  actionHref?: string;
  /** Secondary action label */
  secondaryActionLabel?: string;
  /** Secondary action callback */
  onSecondaryAction?: () => void;
  /** Variant */
  variant?: "default" | "compact" | "card";
  /** Custom class name */
  className?: string;
}

const defaultIcon = (
  <svg
    className="h-12 w-12"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

export function EmptyState({
  icon = defaultIcon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  const content = (
    <>
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center text-[var(--color-fg-muted)]",
          variant === "compact" ? "mb-3" : "mb-4"
        )}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-semibold text-[var(--color-fg-default)]",
          variant === "compact" ? "text-base" : "text-lg"
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            "mx-auto max-w-sm text-[var(--color-fg-muted)]",
            variant === "compact" ? "mt-1 text-sm" : "mt-2 text-base"
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div
          className={cn(
            "flex items-center justify-center gap-3",
            variant === "compact" ? "mt-4" : "mt-6"
          )}
        >
          {actionLabel && (
            actionHref ? (
              <Button asChild>
                <a href={actionHref}>{actionLabel}</a>
              </Button>
            ) : (
              <Button onClick={onAction}>{actionLabel}</Button>
            )
          )}
          {secondaryActionLabel && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </>
  );

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-lg border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] p-8 text-center",
          className
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "compact" ? "py-8" : "py-12",
        className
      )}
    >
      {content}
    </div>
  );
}

/** Pre-built empty state variants */
export const EmptyStates = {
  /** No search results */
  NoResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={
        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No results found"
      description="Try adjusting your search or filter to find what you're looking for."
      {...props}
    />
  ),

  /** No items in list */
  NoItems: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={
        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      }
      title="No items yet"
      description="Get started by creating your first item."
      {...props}
    />
  ),

  /** Error state */
  Error: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={
        <svg className="h-12 w-12 text-[var(--color-danger-fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      title="Something went wrong"
      description="We encountered an error while loading this content."
      actionLabel="Try again"
      {...props}
    />
  ),

  /** No permissions */
  NoPermission: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={
        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
      title="Access restricted"
      description="You don't have permission to view this content."
      {...props}
    />
  ),
};

export default EmptyState;
