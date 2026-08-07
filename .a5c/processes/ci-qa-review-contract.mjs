function blocked(reason) {
  return { runId: null, reason };
}

export function correlateExactHeadQa(input) {
  if (!input || typeof input !== 'object') {
    return blocked('Live-stack dispatch returned no exact-head correlation evidence');
  }

  const expectedTitle = typeof input.expectedTitle === 'string' ? input.expectedTitle : '';
  const trustedStagingSha = typeof input.trustedStagingSha === 'string' ? input.trustedStagingSha : '';
  const expectedHeadSha = typeof input.expectedHeadSha === 'string' ? input.expectedHeadSha : '';
  if (!expectedTitle || !trustedStagingSha || !expectedHeadSha) {
    return blocked('Live-stack dispatch omitted required exact-head correlation values');
  }
  if (input.checkoutResolved !== true) {
    return blocked('Exact PR head checkout could not be resolved');
  }
  if (input.actualHeadSha !== expectedHeadSha) {
    return blocked(`Checked out ${String(input.actualHeadSha ?? 'unknown')} instead of exact PR head ${expectedHeadSha}`);
  }

  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  const matches = candidates.filter((candidate) => candidate
    && typeof candidate === 'object'
    && candidate.displayTitle === expectedTitle
    && candidate.event === 'workflow_dispatch'
    && candidate.headBranch === 'staging'
    && candidate.headSha === trustedStagingSha);

  if (matches.length !== 1) {
    return blocked(`Exact-head run correlation found ${matches.length} candidates; expected exactly one`);
  }

  const runId = matches[0].databaseId;
  if (!Number.isSafeInteger(runId) || runId <= 0) {
    return blocked('Exact-head run correlation produced a null or invalid run id');
  }
  return { runId, reason: null };
}

export function normalizeLiveQaResult(input) {
  const jobs = Array.isArray(input?.jobs) ? input.jobs : [];
  const conclusion = typeof input?.conclusion === 'string' ? input.conclusion : 'unknown';
  const allJobsPassed = jobs.length > 0 && jobs.every((job) => job
    && typeof job === 'object'
    && job.conclusion === 'success');
  return {
    allPassed: input?.allPassed === true && conclusion === 'success' && allJobsPassed,
    jobs,
    conclusion,
  };
}
