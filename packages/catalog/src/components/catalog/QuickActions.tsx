"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface QuickActionsProps {
  /** Entity ID to copy */
  entityId: string;
  /** Entity type for context (reserved for future use) */
  entityType?: "process" | "skill" | "agent" | "domain" | "specialization";
  /** File path for raw view */
  filePath?: string;
  /** GitHub repository URL (without file path) */
  githubBaseUrl?: string;
  /** Show copy ID action */
  showCopyId?: boolean;
  /** Show view raw file action */
  showViewRaw?: boolean;
  /** Show open in GitHub action */
  showGitHub?: boolean;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
  /** Size variant */
  size?: "sm" | "md";
  /** Custom class name */
  className?: string;
}

export function QuickActions({
  entityId,
  entityType: _entityType,
  filePath,
  githubBaseUrl = "https://github.com/a5c-ai/babysitter",
  showCopyId = true,
  showViewRaw = true,
  showGitHub = true,
  direction = "horizontal",
  size = "sm",
  className,
}: QuickActionsProps) {
  // entityType is reserved for future context-aware features
  void _entityType;
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(entityId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleViewRaw = () => {
    if (filePath) {
      // Open raw file view (could be a modal or new tab)
      window.open(`/api/raw?path=${encodeURIComponent(filePath)}`, "_blank");
    }
  };

  const handleOpenGitHub = () => {
    if (filePath && githubBaseUrl) {
      const githubUrl = `${githubBaseUrl}/blob/main/${filePath}`;
      window.open(githubUrl, "_blank");
    }
  };

  const buttonSize = size === "sm" ? "sm" : "default";

  return (
    <div
      className={cn(
        "flex gap-2",
        direction === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {/* Copy ID */}
      {showCopyId && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleCopyId}
          className="gap-1.5"
        >
          {copied ? (
            <>
              <svg className="h-4 w-4 text-[var(--color-success-fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy ID
            </>
          )}
        </Button>
      )}

      {/* View Raw File */}
      {showViewRaw && filePath && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleViewRaw}
          className="gap-1.5"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View Raw
        </Button>
      )}

      {/* Open in GitHub */}
      {showGitHub && filePath && githubBaseUrl && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleOpenGitHub}
          className="gap-1.5"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
          </svg>
          Open in GitHub
        </Button>
      )}
    </div>
  );
}

export default QuickActions;
