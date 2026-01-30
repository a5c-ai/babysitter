/**
 * Error Boundary Component for the Process Library Catalog
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Custom error handler */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Whether to show a retry button */
  showRetry?: boolean;
  /** Custom retry handler */
  onRetry?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// =============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// =============================================================================

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom retry handler if provided
    this.props.onRetry?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          showRetry={this.props.showRetry ?? true}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// ERROR FALLBACK COMPONENT
// =============================================================================

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onReset?: () => void;
  showRetry?: boolean;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  errorInfo,
  onReset,
  showRetry = true,
  title = "Something went wrong",
  description = "An error occurred while rendering this page.",
}: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {error.message}
              </p>
            </div>
          )}

          {/* Stack trace in development */}
          {isDev && errorInfo?.componentStack && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View component stack
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-2 text-xs">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {showRetry && onReset && (
              <Button onClick={onReset} variant="default">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try again
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
            >
              Go back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// PAGE ERROR BOUNDARY
// =============================================================================

export interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

/**
 * Specialized error boundary for page-level errors
 */
export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      showRetry
      onError={(error, errorInfo) => {
        // Could send to error tracking service here
        console.error(`Error in page ${pageName || "unknown"}:`, error, errorInfo);
      }}
      fallback={
        <div className="container py-10">
          <ErrorFallback
            error={null}
            title={`Error loading ${pageName || "page"}`}
            description="We encountered an error while loading this page. Please try again or navigate to a different section."
            showRetry
          />
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// =============================================================================
// SUSPENSE ERROR BOUNDARY
// =============================================================================

export interface SuspenseErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  errorFallback?: React.ReactNode;
}

/**
 * Combined Suspense and Error Boundary for async components
 */
export function SuspenseErrorBoundary({
  children,
  fallback,
  errorFallback,
}: SuspenseErrorBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={fallback}>{children}</React.Suspense>
    </ErrorBoundary>
  );
}

// =============================================================================
// ASYNC ERROR BOUNDARY (for async operations)
// =============================================================================

export interface AsyncBoundaryProps {
  children: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}

/**
 * Boundary for handling async data loading states
 */
export function AsyncBoundary({ children, loading, error }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={error}>
      <React.Suspense fallback={loading || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-2">
        <svg
          className="h-8 w-8 animate-spin text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

export default ErrorBoundary;
