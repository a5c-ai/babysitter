import { z } from "zod";
import type { BreakpointBackend } from "../../backend.js";
import type { ResponderProfile } from "../../types.js";

// ── Tool Description ────────────────────────────────────────────────────

export const listRespondersDescription =
  "List available responders and their areas of expertise. " +
  "Use this tool to discover which responders are available before routing breakpoints. " +
  "You can filter by domain or specific expertise areas.";

// ── Tool Param Schema ───────────────────────────────────────────────────

export const listRespondersParams = {
  domain: z
    .string()
    .optional()
    .describe("Filter responders by domain (e.g. 'typescript', 'security'). Case-insensitive."),
  tags: z
    .array(z.string())
    .optional()
    .describe("Filter responders by expertise tags or keywords."),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

// ── Params type ─────────────────────────────────────────────────────────

export interface ListRespondersToolParams {
  domain?: string;
  tags?: string[];
  backend?: string;
  breakpointsDir?: string;
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function handleListResponders(
  params: ListRespondersToolParams,
  backend: BreakpointBackend,
): Promise<ResponderProfile[]> {
  if (!backend.listResponders) {
    return [];
  }

  let responders = await backend.listResponders();

  // Apply domain filter
  if (params.domain) {
    const domainLower = params.domain.toLowerCase();
    responders = responders.filter((r: ResponderProfile) =>
      r.domains.some((d) => d.toLowerCase().includes(domainLower)),
    );
  }

  // Apply tags filter
  if (params.tags && params.tags.length > 0) {
    const keywords = new Set(params.tags.map((k) => k.toLowerCase()));
    responders = responders.filter((r: ResponderProfile) =>
      r.tags.some((t) => keywords.has(t.toLowerCase())) ||
      r.domains.some((d) => keywords.has(d.toLowerCase())),
    );
  }

  return responders;
}
