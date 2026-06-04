/**
 * Type definitions for plan process phase.
 * Extracted from phase.ts for max-lines compliance.
 */

import type * as readline from "node:readline";
import type {
  CompressionConfig,
  HarnessPromptContext as SessionCreatePromptContext,
  OutputMode,
} from "../utils";

export interface RunPlanProcessPhaseArgs {
  invocationCommand?: string;
  prompt: string;
  outputDir: string;
  workspace?: string;
  model?: string;
  runsDir: string;
  maxIterations: number;
  createRunOnReport?: boolean;
  interactive: boolean;
  rl: readline.Interface | null;
  json: boolean;
  verbose: boolean;
  compressionConfig: CompressionConfig | null;
  promptContext: SessionCreatePromptContext;
  selectedHarnessName: string;
  outputMode?: OutputMode;
}
