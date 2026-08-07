function blocked(reason) {
  return { runId: null, reason };
}

function isCommitSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);
}

export function correlateExactHeadQa(input) {
  if (!input || typeof input !== 'object') {
    return blocked('Live-stack dispatch returned no exact-head correlation evidence');
  }

  const trustedStagingSha = input.trustedStagingSha;
  const expectedHeadSha = input.expectedHeadSha;
  if (!isCommitSha(trustedStagingSha) || !isCommitSha(expectedHeadSha)) {
    return blocked('Live-stack dispatch omitted valid immutable commit SHAs');
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
