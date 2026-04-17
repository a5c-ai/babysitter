import type { ParsedArgs as CoreParsedArgs } from "@a5c-ai/babysitter-sdk";

export interface HarnessParsedArgs extends CoreParsedArgs {
  anycliService?: string;
  anycliScope?: string;
  anycliMcp?: boolean;
  anycliAuthFile?: string;
  anycliTransport?: string;
}
