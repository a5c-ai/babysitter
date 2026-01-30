"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center gap-1 rounded-md text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-neutral-muted)] text-[var(--color-fg-default)] hover:bg-[var(--color-neutral-subtle)]",
        domain:
          "bg-[var(--color-accent-subtle)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-muted)]",
        category:
          "bg-[var(--color-success-subtle)] text-[var(--color-success-fg)] hover:bg-[var(--color-success-muted)]",
        expertise:
          "bg-[var(--color-attention-subtle)] text-[var(--color-attention-fg)] hover:bg-[var(--color-attention-muted)]",
        danger:
          "bg-[var(--color-danger-subtle)] text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-muted)]",
        outline:
          "border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)] hover:text-[var(--color-fg-default)]",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-1 text-xs",
        lg: "px-2.5 py-1.5 text-sm",
      },
      clickable: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      clickable: false,
    },
  }
);

export interface TagProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onClick">,
    VariantProps<typeof tagVariants> {
  /** Icon to display before the label */
  icon?: React.ReactNode;
  /** Show remove button */
  removable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Callback when tag is clicked */
  onClick?: () => void;
  /** Render as a link */
  href?: string;
}

export function Tag({
  className,
  variant,
  size,
  clickable,
  icon,
  removable = false,
  onRemove,
  onClick,
  href,
  children,
  ...props
}: TagProps) {
  const isClickable = clickable || onClick || href;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const content = (
    <>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-0.5 rounded-sm hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-fg)]"
          aria-label="Remove"
        >
          <svg
            className="h-3 w-3"
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
        </button>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cn(tagVariants({ variant, size, clickable: true }), className)}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  return (
    <span
      className={cn(
        tagVariants({ variant, size, clickable: !!isClickable }),
        className
      )}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {content}
    </span>
  );
}

/** Tag group for displaying multiple tags */
export interface TagGroupProps {
  /** Tags to display */
  tags: Array<{
    label: string;
    variant?: TagProps["variant"];
    href?: string;
    onRemove?: () => void;
  }>;
  /** Size for all tags */
  size?: TagProps["size"];
  /** Maximum tags to show */
  maxTags?: number;
  /** Custom class name */
  className?: string;
}

export function TagGroup({
  tags,
  size = "md",
  maxTags,
  className,
}: TagGroupProps) {
  const visibleTags = maxTags ? tags.slice(0, maxTags) : tags;
  const hiddenCount = maxTags ? tags.length - maxTags : 0;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleTags.map((tag, index) => (
        <Tag
          key={index}
          variant={tag.variant}
          size={size}
          href={tag.href}
          removable={!!tag.onRemove}
          onRemove={tag.onRemove}
          clickable={!!tag.href}
        >
          {tag.label}
        </Tag>
      ))}
      {hiddenCount > 0 && (
        <Tag variant="outline" size={size}>
          +{hiddenCount} more
        </Tag>
      )}
    </div>
  );
}

export { tagVariants };
export default Tag;
