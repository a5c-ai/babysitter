import { z } from "zod";
import type { BreakpointBackend } from "../../backend.js";
import type { Breakpoint } from "../../types.js";

// ── Tool Description ────────────────────────────────────────────────────

export const pollBreakpointsDescription =
  "Poll for pending breakpoints routed to a specific responder. " +
  "Returns all breakpoints currently waiting for this responder to answer. " +
  "Use waitSeconds to long-poll if no breakpoints are immediately available.";

// ── Tool Param Schema ───────────────────────────────────────────────────

export const pollBreakpointsParams = {
  responderId: z
    .string()
    .describe("The responder ID to poll breakpoints for."),
  waitSeconds: z
    .number()
    .min(0)
    .max(120)
    .optional()
    .describe(
      "How long to wait for breakpoints to appear (0 = immediate return, default). " +
      "If > 0, polls every 2 seconds until breakpoints are found or timeout expires.",
    ),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

// ── Params type ─────────────────────────────────────────────────────────

export interface PollBreakpointsToolParams {
  responderId: string;
  waitSeconds?: number;
  backend?: string;
  breakpointsDir?: string;
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function handlePollBreakpoints(
  params: PollBreakpointsToolParams,
  backend: BreakpointBackend,
): Promise<Breakpoint[]> {
  if (!params.responderId || params.responderId.length === 0) {
    throw new Error("responderId is required and must be non-empty");
  }

  const waitSeconds = params.waitSeconds ?? 0;
  let breakpoints = await backend.listPendingBreakpoints(params.responderId);

  if (breakpoints.length === 0 && waitSeconds > 0) {
    const deadline = Date.now() + waitSeconds * 1000;
    while (breakpoints.length === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      breakpoints = await backend.listPendingBreakpoints(params.responderId);
    }
  }

  return breakpoints;
}
