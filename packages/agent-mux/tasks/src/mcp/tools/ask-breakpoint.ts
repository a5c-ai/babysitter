import { z } from "zod";
import {
  selectBreakpointAnswer,
  supportsProvenAnswers,
  unsupportedBackendFeatureMessage,
} from "../../backend.js";
import type { BreakpointBackend, SubmitBreakpointParams } from "../../backend.js";
import { isProvenBreakpointAnswer } from "../../types.js";
import type { BreakpointWaitResult } from "../../types.js";
import { DEFAULT_TIMEOUT_MS } from "../../types.js";

// ── Tool Description ────────────────────────────────────────────────────

export const askBreakpointDescription =
  "Submit a breakpoint question and wait for a human responder's answer. " +
  "Use this when you encounter a decision, approval, or question that " +
  "requires human judgment. The tool blocks until an answer is received, " +
  "the timeout elapses, or the breakpoint is cancelled.";

// ── Tool Param Schema ───────────────────────────────────────────────────

export const askBreakpointParams = {
  question: z.string().describe("The breakpoint question text."),
  context: z.string().optional().describe(
    "Additional context: what was tried, relevant code, etc.",
  ),
  markdown: z.string().optional().describe(
    "Rich markdown context for rendering.",
  ),
  codeSnippets: z.array(z.object({
    filename: z.string(),
    code: z.string(),
    language: z.string().optional(),
  })).optional().describe("Structured code snippets with metadata."),
  fileReferences: z.array(z.string()).optional().describe(
    "File paths relevant to the breakpoint.",
  ),
  tags: z.array(z.string()).optional().describe(
    "Keywords for categorizing and routing the breakpoint.",
  ),
  domain: z.string().optional().describe(
    "Domain area (e.g., 'backend', 'security', 'devops').",
  ),
  urgency: z.enum(["low", "medium", "high"]).optional().describe(
    "Urgency level of the breakpoint.",
  ),
  interactionKind: z.enum([
    "clarification", "approval", "intervention", "notification", "handoff",
  ]).optional().describe(
    "Semantic classification of the interaction type.",
  ),
  targetResponders: z.array(z.string()).optional().describe(
    "Specific responder IDs to route this breakpoint to.",
  ),
  routingStrategy: z.enum([
    "single", "first-response-wins", "collect-all", "quorum",
  ]).default("first-response-wins").describe(
    "How to route the breakpoint to responders.",
  ),
  timeout: z.number().positive().optional().describe(
    "Timeout in milliseconds. Defaults to 30 minutes.",
  ),
  breakpointId: z.string().optional().describe(
    "Canonical breakpoint identity for cross-run matching and auto-approval rules.",
  ),
  backend: z.string().optional().describe(
    "Explicit backend to use (e.g., 'git-native'). Defaults to configured backend.",
  ),
  breakpointsDir: z.string().optional().describe(
    "Path to .breakpoints directory (git-native backend).",
  ),
  proven: z.boolean().optional().describe(
    "When true, require the answer to be cryptographically signed.",
  ),
};

// ── Params type ─────────────────────────────────────────────────────────

export interface AskBreakpointParams {
  question: string;
  context?: string;
  markdown?: string;
  codeSnippets?: Array<{ filename: string; code: string; language?: string }>;
  fileReferences?: string[];
  tags?: string[];
  domain?: string;
  urgency?: "low" | "medium" | "high";
  interactionKind?: "clarification" | "approval" | "intervention" | "notification" | "handoff";
  targetResponders?: string[];
  routingStrategy?: "single" | "first-response-wins" | "collect-all" | "quorum";
  timeout?: number;
  breakpointId?: string;
  backend?: string;
  breakpointsDir?: string;
  proven?: boolean;
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function handleAskBreakpoint(
  params: AskBreakpointParams,
  backend: BreakpointBackend,
): Promise<BreakpointWaitResult> {
  if (!params.question || params.question.length === 0) {
    throw new Error("question is required and must be non-empty");
  }

  const timeoutMs = params.timeout ?? DEFAULT_TIMEOUT_MS;

  const submitParams: SubmitBreakpointParams = {
    text: params.question,
    context: {
      description: params.context ?? "",
      codeSnippets: params.codeSnippets ?? [],
      fileReferences: params.fileReferences ?? [],
      tags: params.tags ?? [],
      markdown: params.markdown,
      domain: params.domain,
      urgency: params.urgency,
      interactionKind: params.interactionKind,
    },
    routing: {
      strategy: params.routingStrategy ?? "first-response-wins",
      targetResponders: params.targetResponders ?? [],
      timeoutMs,
      presentToUser: false,
      breakpointId: params.breakpointId,
    },
    proven: params.proven,
  };

  if (params.proven && !supportsProvenAnswers(backend.name)) {
    throw new Error(unsupportedBackendFeatureMessage(backend.name, "ask_breakpoint.proven"));
  }

  const breakpoint = await backend.submitBreakpoint(submitParams);

  const waitResult = await backend.waitForAnswer(breakpoint.id, {
    timeoutMs,
  });

  if (params.proven && waitResult.answered) {
    const answer = waitResult.answer ?? selectBreakpointAnswer(waitResult.breakpoint);
    if (!answer || !isProvenBreakpointAnswer(answer)) {
      throw new Error(`Breakpoint ${breakpoint.id} required a signed answer, but the returned answer was unsigned.`);
    }
  }

  return waitResult;
}
