export interface ExactHeadCandidate {
  databaseId?: number | null;
  event?: string;
  headBranch?: string;
  headSha?: string;
}

export interface ExactHeadEvidence {
  prNumber?: number;
  upstreamPrRef?: string;
  resolvedUpstreamPrHeadSha?: string;
  trustedStagingSha?: string;
  expectedHeadSha?: string;
  beforeRunIds?: number[];
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

export interface LiveQaCheckout {
  jobName?: string;
  conclusion?: string;
  headSha?: string | null;
}

export interface LiveQaResult {
  jobs?: LiveQaJob[];
  checkouts?: LiveQaCheckout[];
  conclusion?: string;
  expectedHeadSha?: string;
}

export interface NormalizedLiveQaResult {
  allPassed: boolean;
  jobs: LiveQaJob[];
  checkouts: LiveQaCheckout[];
  conclusion: string;
  expectedHeadSha: string;
  exactHeadVerified: boolean;
}

export function upstreamPullRequestRef(prNumber: number): string;
export function correlateExactHeadQa(input: ExactHeadEvidence): ExactHeadCorrelation;
export function normalizeLiveQaResult(input: LiveQaResult): NormalizedLiveQaResult;
