import { Type } from "@sinclair/typebox";
import type { CustomToolDefinition } from "../types";
import { DEFAULT_SEARCH_TIMEOUT } from "../shared/process";
import { errorResult, errorResultFor, jsonResult } from "../shared/results";
import { extractTextFromHtml, filterByRelevance } from "./content";
import { parseSearchResults } from "./searchHelpers";

export function createWebTools(): CustomToolDefinition[] {
  return [
    {
      name: "web_search",
      label: "Web Search",
      description:
        "Search the web using a query string. Returns search result snippets. Supports domain whitelisting/blacklisting.",
      parameters: Type.Object({
        query: Type.String({ description: "Search query" }),
        max_results: Type.Optional(Type.Number({ description: "Maximum results to return (default 10)" })),
        domains: Type.Optional(Type.Array(Type.String(), { description: "Domain whitelist" })),
        exclude_domains: Type.Optional(Type.Array(Type.String(), { description: "Domain blacklist" })),
      }),
      execute: async (_toolCallId, params) => {
        const query = String(params.query ?? "");
        if (!query.trim()) {
          return errorResult("Search query is required.");
        }

        const maxResults = typeof params.max_results === "number" ? params.max_results : 10;
        const domains = Array.isArray(params.domains)
          ? params.domains.filter((domain): domain is string => typeof domain === "string")
          : undefined;
        const excludeDomains = Array.isArray(params.exclude_domains)
          ? params.exclude_domains.filter((domain): domain is string => typeof domain === "string")
          : undefined;

        let searchQuery = query;
        if (domains && domains.length > 0) {
          searchQuery += ` ${domains.map((domain) => `site:${domain}`).join(" OR ")}`;
        }
        if (excludeDomains && excludeDomains.length > 0) {
          searchQuery += ` ${excludeDomains.map((domain) => `-site:${domain}`).join(" ")}`;
        }

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), DEFAULT_SEARCH_TIMEOUT);
          try {
            const response = await globalThis.fetch(
              `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`,
              {
                signal: controller.signal,
                headers: { "User-Agent": "babysitter-sdk/web-search" },
              },
            );
            const results = parseSearchResults(await response.text(), maxResults);
            return jsonResult({ query, resultCount: results.length, results });
          } finally {
            clearTimeout(timer);
          }
        } catch (error) {
          return errorResultFor(error, "Web search failed");
        }
      },
    },
    {
      name: "fetch_process",
      label: "Fetch and Process Content",
      description:
        "Fetch a URL and process the content to extract relevant information, reducing token usage.",
      parameters: Type.Object({
        url: Type.String({ description: "URL to fetch and process" }),
        prompt: Type.Optional(Type.String({ description: "Focus prompt for extraction" })),
        max_length: Type.Optional(Type.Number({ description: "Maximum output length in characters (default 10000)" })),
        format: Type.Optional(Type.Union([
          Type.Literal("text"),
          Type.Literal("markdown"),
          Type.Literal("summary"),
        ], { description: "Output format. Default: text" })),
      }),
      execute: async (_toolCallId, params) => {
        const url = String(params.url ?? "");
        if (!url.trim()) {
          return errorResult("URL is required.");
        }

        const maxLength = typeof params.max_length === "number" ? params.max_length : 10_000;
        const format = typeof params.format === "string" ? params.format : "text";
        const prompt = typeof params.prompt === "string" ? params.prompt : undefined;

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), DEFAULT_SEARCH_TIMEOUT);
          try {
            const response = await globalThis.fetch(url, {
              signal: controller.signal,
              headers: { "User-Agent": "babysitter-sdk/fetch-process" },
            });
            const contentType = response.headers.get("content-type") ?? "";
            const rawText = await response.text();
            let processed = contentType.includes("text/html")
              ? extractTextFromHtml(rawText, format)
              : rawText;
            if (prompt) {
              processed = filterByRelevance(processed, prompt);
            }
            if (processed.length > maxLength) {
              processed = `${processed.slice(0, maxLength)}\n... (truncated)`;
            }
            return jsonResult({
              url,
              contentType,
              format,
              length: processed.length,
              content: processed,
            });
          } finally {
            clearTimeout(timer);
          }
        } catch (error) {
          return errorResultFor(error, "Fetch processing failed");
        }
      },
    },
  ];
}
