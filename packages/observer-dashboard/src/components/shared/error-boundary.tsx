"use client";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** When set, renders a compact inline fallback instead of the full-page error. */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Section-level: compact inline fallback that doesn't take over the page
      if (this.props.section) {
        return (
          <div className="rounded-lg border border-error/20 bg-error-muted p-4 text-center">
            <p className="text-sm font-medium text-error mb-1">
              {this.props.section} failed to load
            </p>
            <p className="text-xs text-foreground-muted mb-2">
              This section encountered an error. Other sections are unaffected.
            </p>
            <button
              onClick={this.handleRetry}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        );
      }

      // Root-level: full-page fallback
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md text-center">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-foreground-muted">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
