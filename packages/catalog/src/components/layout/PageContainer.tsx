"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";

export interface PageContainerProps {
  /** Page content */
  children: React.ReactNode;
  /** Show sidebar */
  showSidebar?: boolean;
  /** Current active path for sidebar highlighting */
  activePath?: string;
  /** Maximum width variant */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Custom padding */
  padding?: "none" | "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
  /** Content class name */
  contentClassName?: string;
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "px-4 py-4",
  md: "px-4 py-6 md:px-6 md:py-8",
  lg: "px-4 py-8 md:px-8 md:py-12",
};

export function PageContainer({
  children,
  showSidebar = false,
  activePath,
  maxWidth = "2xl",
  padding = "md",
  className,
  contentClassName,
}: PageContainerProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);

  return (
    <div className={cn("flex min-h-[calc(100vh-3.5rem)]", className)}>
      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-emphasis)] text-white shadow-lg transition-colors hover:bg-[var(--color-accent-emphasis)]/90 lg:hidden"
            aria-label="Open navigation"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Sidebar
            activePath={activePath}
            isCollapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1",
          showSidebar && "lg:ml-0",
          paddingClasses[padding],
          contentClassName
        )}
      >
        <div className={cn("mx-auto", maxWidthClasses[maxWidth])}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default PageContainer;
