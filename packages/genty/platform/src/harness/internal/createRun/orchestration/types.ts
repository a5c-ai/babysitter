import * as readline from "node:readline";
import type {
  CompressionConfig,
  HarnessDiscoveryResult,
  HarnessPromptContext as SessionCreatePromptContext,
  OrchestrationState,
  OutputMode,
} from "../utils";
import type { SessionBindResult } from "../../../types";

export type RunOrchestrationPhaseArgs = {
  invocationCommand?: string;
  processPath: string;
  prompt?: string;
  workspace?: string;
  model?: string;
  runsDir: string;
  maxIterations: number;
  json: boolean;
  verbose: boolean;
  interactive: boolean;
  rl: readline.Interface | null;
  selectedHarnessName: string;
  discovered: HarnessDiscoveryResult[];
  compressionConfig: CompressionConfig | null;
  promptContext: SessionCreatePromptContext;
  existingRunId?: string;
  existingRunDir?: string;
  existingSessionBound?: SessionBindResult;
  planningConversationSummary?: string;
  outputMode?: OutputMode;
};

export type OrchestrationWriteVerbose = (message: string) => void;

export type OrchestrationWriteVerboseData = (
  label: string,
  value: unknown,
  maxChars?: number,
) => void;

export type OrchestrationLoggers = {
  writeVerbose: OrchestrationWriteVerbose;
  writeVerboseData: OrchestrationWriteVerboseData;
};

export type OrchestrationProgressSnapshot = {
  runId?: string;
  runDir?: string;
  sessionBound: boolean;
  iteration: number;
  pendingActionIds: string;
  pendingResultIds: string;
  lastStatus?: OrchestrationState["lastIterationResult"] extends
    | { status: infer T }
    | undefined
    ? T
    : never;
  hasAskUserQuestionResponse: boolean;
  finished: boolean;
  processFileFingerprint?: string;
};
