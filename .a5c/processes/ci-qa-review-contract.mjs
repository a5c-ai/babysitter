function blocked(reason) {
  return { runId: null, reason };
}

function isCommitSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);
}

export function upstreamPullRequestRef(prNumber) {
  if (!Number.isSafeInteger(prNumber) || prNumber <= 0) {
    throw new RangeError('Pull request number must be a positive safe integer');
  }
  return `refs/pull/${prNumber}/head`;
}

export function correlateExactHeadQa(input) {
  if (!input || typeof input !== 'object') {
    return blocked('Live-stack dispatch returned no exact-head correlation evidence');
  }

  let requiredUpstreamRef;
  try {
    requiredUpstreamRef = upstreamPullRequestRef(input.prNumber);
  } catch {
    return blocked('Live-stack dispatch omitted a valid pull request number');
  }
  if (input.upstreamPrRef !== requiredUpstreamRef) {
    return blocked(`Live-stack dispatch ref mismatch; expected ${requiredUpstreamRef}`);
  }

  const resolvedUpstreamPrHeadSha = input.resolvedUpstreamPrHeadSha;
  const expectedHeadSha = input.expectedHeadSha;
  if (!isCommitSha(resolvedUpstreamPrHeadSha) || !isCommitSha(expectedHeadSha)) {
    return blocked('Live-stack dispatch omitted valid immutable PR head SHAs');
  }
  if (resolvedUpstreamPrHeadSha.toLowerCase() !== expectedHeadSha.toLowerCase()) {
    return blocked('Upstream pull request ref does not resolve to the pushed fork head SHA');
  }

  const trustedStagingSha = input.trustedStagingSha;
  if (!isCommitSha(trustedStagingSha)) {
    return blocked('Live-stack dispatch omitted a valid immutable trusted staging SHA');
  }

  const beforeRunIds = Array.isArray(input.beforeRunIds) ? input.beforeRunIds : null;
  if (!beforeRunIds || beforeRunIds.some((runId) => !Number.isSafeInteger(runId) || runId <= 0)) {
    return blocked('Live-stack dispatch omitted a valid before-run snapshot');
  }
  const priorRuns = new Set(beforeRunIds);
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  const matches = candidates.filter((candidate) => candidate
    && typeof candidate === 'object'
    && Number.isSafeInteger(candidate.databaseId)
    && candidate.databaseId > 0
    && !priorRuns.has(candidate.databaseId)
    && candidate.event === 'workflow_dispatch'
    && candidate.headBranch === 'staging'
    && candidate.headSha === trustedStagingSha);

  if (matches.length !== 1) {
    return blocked(`Exact-head run correlation found ${matches.length} new trusted-staging candidates; expected exactly one`);
  }
  return { runId: matches[0].databaseId, reason: null };
}

export function normalizeLiveQaResult(input) {
  const jobs = Array.isArray(input?.jobs) ? input.jobs : [];
  const checkouts = Array.isArray(input?.checkouts) ? input.checkouts : [];
  const conclusion = typeof input?.conclusion === 'string' ? input.conclusion : 'unknown';
  const expectedHeadSha = input?.expectedHeadSha;
  const allJobsPassed = jobs.length > 0 && jobs.every((job) => job
    && typeof job === 'object'
    && job.conclusion === 'success');
  const scenarioJobs = jobs.filter((job) => typeof job?.name === 'string' && job.name.startsWith('Live Stack ('));
  const exactHeadVerified = isCommitSha(expectedHeadSha)
    && checkouts.length > 0
    && checkouts.every((checkout) => checkout
      && typeof checkout === 'object'
      && checkout.conclusion === 'success'
      && checkout.headSha === expectedHeadSha);

  return {
    allPassed: conclusion === 'success'
      && allJobsPassed
      && scenarioJobs.length > 0
      && scenarioJobs.every((job) => job.conclusion === 'success')
      && exactHeadVerified,
    jobs,
    checkouts,
    conclusion,
    expectedHeadSha: isCommitSha(expectedHeadSha) ? expectedHeadSha : '',
    exactHeadVerified,
  };
}
