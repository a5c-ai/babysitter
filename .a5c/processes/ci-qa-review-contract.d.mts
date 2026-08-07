export interface ExactHeadCandidate {
  databaseId?: number | null;
  displayTitle?: string;
  event?: string;
  headBranch?: string;
  headSha?: string;
}

export interface ExactHeadEvidence {
  expectedTitle?: string;
  trustedStagingSha?: string;
  expectedHeadSha?: string;
  checkoutResolved?: boolean;
  actualHeadSha?: string | null;
  candidates?: ExactHeadCandidate[];
}

export interface ExactHeadCorrelation {
  runId: number | null;
  reason: string | null;
}

export interface LiveQaJob {
  name?: string;
  conclusion?: string;
}

export interface LiveQaResult {
  allPassed?: boolean;
  jobs?: LiveQaJob[];
  conclusion?: string;
}

export function correlateExactHeadQa(input: ExactHeadEvidence): ExactHeadCorrelation;
export function normalizeLiveQaResult(input: LiveQaResult): Required<LiveQaResult>;
