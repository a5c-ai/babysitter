// Breakpoint-related types

export interface BreakpointFile {
  path: string;
  format: string;
  language?: string;
}

/**
 * Where the breakpoint question text was found on disk (UX-R2 §13.1).
 * Precedence: input.json > taskDef.inputs > task.json .breakpoint (SDK 6.0.2
 * ctx.breakpoint shape) > task.json metadata.payload.
 * "fallback" means NO question exists in any source — the question field then
 * carries the honest last-resort copy (AC-32), never a bare "Approval required".
 */
export type BreakpointQuestionSource =
  | "input"
  | "taskDefInputs"
  | "taskDefBreakpoint"
  | "metadataPayload"
  | "fallback";

export interface BreakpointPayload {
  question: string;
  /** Present on parser-resolved payloads (UX-R2 §13.1 AC-32). */
  questionSource?: BreakpointQuestionSource;
  title: string;
  options?: string[];
  context?: {
    files?: BreakpointFile[];
  };
}

