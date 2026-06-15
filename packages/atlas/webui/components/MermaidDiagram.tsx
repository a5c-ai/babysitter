"use client";

import * as React from "react";
import type mermaidType from "mermaid";
import { CopyableText } from "@/components/CopyableText";

const MERMAID_CONFIG = {
  startOnLoad: false,
  securityLevel: "strict",
  fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
} as const;

function resolveMermaidTheme(theme: string) {
  return theme === "void" ? "dark" : "neutral";
}

export function MermaidDiagram({
  definition,
  variant = "default",
}: {
  definition: string;
  variant?: "default" | "docs";
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [theme, setTheme] = React.useState("vellum");
  const [svg, setSvg] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const diagramId = React.useId().replace(/:/g, "-");

  React.useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setTheme(root.dataset.theme || "vellum");

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        setError(null);
        const mermaidModule = (await import("mermaid/dist/mermaid.esm.min.mjs")) as { default: typeof mermaidType };
        const mermaid = mermaidModule.default;
        mermaid.initialize({
          ...MERMAID_CONFIG,
          theme: resolveMermaidTheme(theme),
        });
        const { svg: renderedSvg, bindFunctions } = await mermaid.render(
          `atlas-mermaid-${diagramId}-${theme}`,
          definition,
        );
        if (cancelled) return;
        setSvg(renderedSvg);
        requestAnimationFrame(() => {
          const element = containerRef.current;
          if (element) {
            bindFunctions?.(element);
          }
        });
      } catch (cause) {
        if (cancelled) return;
        const message = cause instanceof Error ? cause.message : "Unable to render Mermaid diagram.";
        setSvg("");
        setError(message);
      }
    };

    void renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [definition, diagramId, theme]);

  return (
    <figure
      className={`atlas-mermaid atlas-mermaid--${variant}`}
      data-theme={theme}
    >
      <div
        ref={containerRef}
        className="atlas-mermaid__canvas"
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      {error ? (
        <figcaption className="atlas-mermaid__error">
          <strong>Mermaid render failed.</strong>
          <span>{error}</span>
          <CopyableText
            text={definition}
            copyLabel="Copy Mermaid source"
            languageLabel="Mermaid source"
            preClassName="atlas-mermaid__source"
          />
        </figcaption>
      ) : null}
    </figure>
  );
}
