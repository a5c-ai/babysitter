"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { resilientFetch } from "@/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FileText, Code, FileJson, Loader2 } from "lucide-react";
import type { BreakpointFile } from "@/types";

interface FilePreviewProps {
  files: BreakpointFile[];
  runId: string;
  effectId: string;
}

const formatIcon: Record<string, React.ReactNode> = {
  markdown: <FileText className="h-3.5 w-3.5 text-info" />,
  json: <FileJson className="h-3.5 w-3.5 text-warning" />,
  code: <Code className="h-3.5 w-3.5 text-success" />,
};

function getIcon(format: string) {
  return formatIcon[format] || <FileText className="h-3.5 w-3.5 text-foreground-muted" />;
}

function formatBadgeVariant(format: string): "info" | "warning" | "success" | "pending" {
  switch (format) {
    case "markdown":
      return "info";
    case "json":
      return "warning";
    case "code":
      return "success";
    default:
      return "pending";
  }
}

/** Try to pretty-print JSON content */
function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

/** Render content based on format — night-black background with subtle border */
function FileContent({ content, format }: { content: string; format: string }) {
  const rendered = useMemo(() => {
    if (format === "json") {
      return formatJson(content);
    }
    return content;
  }, [content, format]);

  if (format === "markdown") {
    return (
      <div
        className={cn(
          "rounded-md bg-background border border-border/50 p-4",
          "text-sm text-foreground-secondary leading-relaxed",
          "overflow-x-auto max-h-80 overflow-y-auto",
          "prose-sm prose-invert",
          "[&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:text-foreground",
          "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h2]:text-foreground",
          "[&_h3]:text-xs [&_h3]:font-medium [&_h3]:mb-1 [&_h3]:text-foreground",
          "[&_code]:bg-background-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono",
          "[&_pre]:bg-background-secondary [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs [&_pre]:font-mono [&_pre]:overflow-x-auto",
          "[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
          "[&_li]:mb-0.5",
          "[&_strong]:font-semibold [&_strong]:text-foreground",
          "[&_a]:text-primary [&_a]:underline"
        )}
      >
        <pre className="whitespace-pre-wrap break-words font-sans">{content}</pre>
      </div>
    );
  }

  // Code and JSON: monospace with line numbers — night-black background
  const lines = rendered.split("\n");
  const gutterWidth = String(lines.length).length;

  return (
    <div
      className={cn(
        "rounded-md bg-background border border-border/50",
        "text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto"
      )}
    >
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-background-secondary/50">
              <td
                className="select-none text-right pr-3 pl-2 text-foreground-muted/40 border-r border-border/30 align-top font-mono"
                style={{ width: `${gutterWidth + 2}ch` }}
              >
                {i + 1}
              </td>
              <td className="pl-3 pr-3 text-foreground-secondary whitespace-pre-wrap break-words">
                {line || "\u00A0"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FilePreview({ files, runId, effectId }: FilePreviewProps) {
  const [loadedContent, setLoadedContent] = useState<Record<string, string>>({});
  const [loadingFiles, setLoadingFiles] = useState<Record<string, boolean>>({});
  const abortRefs = useRef<Record<string, AbortController>>({});

  // Abort all in-flight file requests on unmount
  useEffect(() => {
    const refs = abortRefs.current;
    return () => {
      for (const controller of Object.values(refs)) {
        controller.abort();
      }
    };
  }, []);

  async function loadFileContent(filePath: string) {
    if (loadedContent[filePath] || loadingFiles[filePath]) return;
    setLoadingFiles((prev) => ({ ...prev, [filePath]: true }));

    // Abort any previous in-flight request for this file
    abortRefs.current[filePath]?.abort();
    abortRefs.current[filePath] = new AbortController();

    const result = await resilientFetch<{ content?: string }>(
      `/api/runs/${runId}/tasks/${effectId}?file=${encodeURIComponent(filePath)}`,
      { signal: abortRefs.current[filePath].signal }
    );

    if (!result.ok) {
      if (result.error.isAborted) return;
      setLoadedContent((prev) => ({
        ...prev,
        [filePath]: "// Failed to load file content",
      }));
    } else {
      setLoadedContent((prev) => ({
        ...prev,
        [filePath]: result.data.content || "// No content available",
      }));
    }
    setLoadingFiles((prev) => ({ ...prev, [filePath]: false }));
  }

  if (!files.length) return null;

  return (
    <div data-testid="file-preview" className="space-y-1">
      <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 pl-2 border-l-2 border-primary">
        Attached Files
      </h4>
      <Accordion
        type="single"
        collapsible
        onValueChange={(value: string | string[]) => {
          const v = typeof value === "string" ? value : value[0];
          if (v) {
            const file = files.find((f) => f.path === v);
            if (file) loadFileContent(file.path);
          }
        }}
      >
        {files.map((file) => (
          <AccordionItem key={file.path} value={file.path} className="border-border/50">
            <AccordionTrigger className="py-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {getIcon(file.format)}
                <span className="font-mono text-foreground-secondary truncate">
                  {file.path}
                </span>
                <Badge variant={formatBadgeVariant(file.format)} className="text-xs leading-tight px-1.5 py-0">
                  {file.format}
                </Badge>
                {file.language && (
                  <Badge variant="pending" className="text-xs leading-tight px-1.5 py-0">
                    {file.language}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-1">
              {loadingFiles[file.path] ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
                </div>
              ) : loadedContent[file.path] ? (
                <FileContent content={loadedContent[file.path]} format={file.format} />
              ) : (
                <div className="py-4 text-xs text-foreground-muted text-center">
                  Expand to load content
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
