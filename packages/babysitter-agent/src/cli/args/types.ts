import type { ParsedArgs as CoreParsedArgs } from "@a5c-ai/babysitter-sdk";

/** Supported output formats for harness invocation results. */
export type HarnessOutputFormat = "json" | "text" | "amux-events";

export interface HarnessParsedArgs extends CoreParsedArgs {
  anycliService?: string;
  anycliScope?: string;
  anycliMcp?: boolean;
  anycliAuthFile?: string;
  anycliTransport?: string;
  /** Output format for babysitter-agent invoke results. */
  outputFormat?: HarnessOutputFormat;
}
