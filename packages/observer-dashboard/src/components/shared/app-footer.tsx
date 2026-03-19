"use client";
import { useState, useEffect } from "react";
import { Eye, Github, ExternalLink } from "lucide-react";

export function AppFooter() {
  const [versions, setVersions] = useState({
    app: process.env.NEXT_PUBLIC_APP_VERSION || "…",
    babysitter: process.env.NEXT_PUBLIC_BABYSITTER_VERSION || "…",
  });

  useEffect(() => {
    fetch("/api/version")
      .then((r) => r.json())
      .then((data) => {
        if (data.app || data.babysitter) {
          setVersions((prev) => ({
            app: data.app || prev.app,
            babysitter: data.babysitter || prev.babysitter,
          }));
        }
      })
      .catch(() => {
        // Keep build-time fallback values
      });
  }, []);

  return (
    <footer className="border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px] px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
        <div className="flex items-center gap-3 flex-wrap">
          <Eye className="h-3.5 w-3.5 text-primary/40" />
          <span className="font-medium">
            Babysitter Observer{" "}
            <span className="rounded-full bg-primary/10 border border-primary/20 px-1.5 py-px text-[10px] font-medium text-primary tabular-nums">
              v{versions.app}
            </span>
          </span>

          <span className="text-foreground-muted/30 select-none">&middot;</span>

          <span className="text-xs font-normal text-foreground-muted">
            Babysitter{" "}
            <span className="rounded-full bg-muted/50 border border-border px-1.5 py-px text-[10px] font-normal text-foreground-muted tabular-nums">
              v{versions.babysitter}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/a5c-ai/babysitter/tree/main/packages/observer-dashboard#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground-secondary transition-colors"
          >
            <Github className="h-3 w-3" />
            Docs
          </a>
          <a
            href="https://github.com/a5c-ai/babysitter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground-secondary transition-colors"
          >
            <Github className="h-3 w-3" />
            Babysitter
          </a>
          <a
            href="https://www.a5c.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            a5c.ai
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
