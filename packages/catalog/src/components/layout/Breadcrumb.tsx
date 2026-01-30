import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Route } from "next";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom separator */
  separator?: React.ReactNode;
  /** Show home icon */
  showHomeIcon?: boolean;
  /** Custom class name */
  className?: string;
}

const defaultSeparator = (
  <svg
    className="h-4 w-4 text-[var(--color-fg-muted)]"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const homeIcon = (
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
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

export function Breadcrumb({
  items,
  separator = defaultSeparator,
  showHomeIcon = true,
  className,
}: BreadcrumbProps) {
  // Prepend home item
  const allItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...items,
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center space-x-1 text-sm",
        className
      )}
    >
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === allItems.length - 1;

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {!isFirst && (
                <span className="mx-1" aria-hidden="true">
                  {separator}
                </span>
              )}

              {/* Link or Text */}
              {item.href && !isLast ? (
                <Link
                  href={item.href as Route}
                  className={cn(
                    "flex items-center gap-1 text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent-fg)]",
                    isFirst && showHomeIcon && "gap-1"
                  )}
                >
                  {isFirst && showHomeIcon ? (
                    <>
                      {homeIcon}
                      <span className="sr-only">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast
                      ? "font-medium text-[var(--color-fg-default)]"
                      : "text-[var(--color-fg-muted)]"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {isFirst && showHomeIcon && !item.href ? (
                    <>
                      {homeIcon}
                      <span className="sr-only">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
