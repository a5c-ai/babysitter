import crypto from 'node:crypto';

const TOKEN_REGEX = /[\p{L}\p{N}]+|[^\s]/gu;
const TOKEN_NORMALIZE_REGEX = /[^\p{L}\p{N}]/gu;
const DEDUPE_NORMALIZE_REGEX = /[^\p{L}\p{N}\s]/gu;
const BOILERPLATE_REGEX = /copyright|all rights reserved|disclaimer|confidential/i;
const MAX_SEGMENT_TOKENS = 120;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'in', 'is', 'it',
  'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'we', 'with', 'you', 'your', 'our',
]);

export const DEFAULT_SYSTEM_PROMPT = [
  'You are an assistant that answers questions using the provided context.',
  'Cite the most relevant facts and keep the answer concise.',
].join(' ');

export const DEFAULT_OPTIONS = {
  cacheWindowTokens: 600,
  minCompressionTokens: 80,
  maxCompressionSentences: 10,
  targetReduction: 0.45,
};

export function tokenize(text) {
  if (!text) {
    return [];
  }

  const matches = text.match(TOKEN_REGEX);
  return matches ?? [];
}

export function estimateTokens(text) {
  return tokenize(text).length;
}

function normalizeForDeduping(sentence) {
  return sentence
    .toLowerCase()
    .replace(DEDUPE_NORMALIZE_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/g)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function chunkTokens(tokens, chunkSize) {
  const chunks = [];
  for (let index = 0; index < tokens.length; index += chunkSize) {
    chunks.push(tokens.slice(index, index + chunkSize));
  }
  return chunks;
}

function splitOversizedSentence(sentence, maxTokens = MAX_SEGMENT_TOKENS) {
  const rawTokens = tokenize(sentence);
  if (rawTokens.length <= maxTokens) {
    return [sentence];
  }

  const commaSplit = sentence
    .split(/(?<=[,;:])\s+|\s+-\s+/g)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (commaSplit.length > 1) {
    const segments = [];
    for (const segment of commaSplit) {
      if (estimateTokens(segment) <= maxTokens) {
        segments.push(segment);
      } else {
        for (const chunk of chunkTokens(tokenize(segment), maxTokens)) {
          segments.push(chunk.join(' '));
        }
      }
    }
    return segments;
  }

  return chunkTokens(rawTokens, maxTokens).map((chunk) => chunk.join(' '));
}

function normalizeToken(token) {
  return token.replace(TOKEN_NORMALIZE_REGEX, '').trim();
}

function tokenizeNormalized(text) {
  return tokenize((text ?? '').toLowerCase())
    .map(normalizeToken)
    .filter(Boolean);
}

function normalizedTermsFromRawTokens(rawTokens) {
  return rawTokens
    .map((token) => normalizeToken(token.toLowerCase()))
    .filter(Boolean);
}

function queryTerms(query) {
  const terms = tokenizeNormalized(query)
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));

  return new Set(terms);
}

function preprocessContext(context) {
  const normalizedContext = context ?? '';
  const originalTokens = estimateTokens(normalizedContext);
  const dedupeSet = new Set();
  const candidates = [];

  for (const sentence of splitIntoSentences(normalizedContext)) {
    for (const segment of splitOversizedSentence(sentence)) {
      const normalized = normalizeForDeduping(segment);
      if (!normalized || dedupeSet.has(normalized)) {
        continue;
      }

      dedupeSet.add(normalized);

      const rawTokens = tokenize(segment);
      const normalizedTerms = normalizedTermsFromRawTokens(rawTokens);
      const lowered = segment.toLowerCase();

      candidates.push({
        sentence: segment,
        index: candidates.length,
        tokenCount: rawTokens.length,
        uniqueTerms: new Set(normalizedTerms),
        isBoilerplate: BOILERPLATE_REGEX.test(lowered),
      });
    }
  }

  return {
    originalTokens,
    dedupedSentenceCount: candidates.length,
    candidates,
  };
}

function scoreSentenceCandidate(candidate, terms) {
  if (candidate.tokenCount === 0) {
    return {
      score: 0,
      overlapCount: 0,
      overlapTerms: [],
    };
  }

  const overlapTerms = [];
  let overlap = 0;

  for (const term of terms) {
    if (candidate.uniqueTerms.has(term)) {
      overlap += 1;
      overlapTerms.push(term);
    }
  }

  const overlapScore = overlap * 2;
  const densityScore = terms.size > 0 ? overlap / terms.size : 0;
  const lengthScore = Math.min(candidate.tokenCount, 40) / 40;
  const boilerplatePenalty = candidate.isBoilerplate ? 0.5 : 0;

  return {
    score: overlapScore + densityScore + lengthScore - boilerplatePenalty,
    overlapCount: overlap,
    overlapTerms,
  };
}

function compressContextFromAnalysis({
  contextAnalysis,
  contextText,
  query,
  minCompressionTokens = DEFAULT_OPTIONS.minCompressionTokens,
  maxCompressionSentences = DEFAULT_OPTIONS.maxCompressionSentences,
  targetReduction = DEFAULT_OPTIONS.targetReduction,
}) {
  const { originalTokens, dedupedSentenceCount, candidates } = contextAnalysis;
  const targetTokens = Math.max(1, Math.max(minCompressionTokens, Math.floor(originalTokens * (1 - targetReduction))));

  const terms = queryTerms(query);
  const scoredSentences = candidates.map((candidate) => ({
    sentence: candidate.sentence,
    index: candidate.index,
    ...scoreSentenceCandidate(candidate, terms),
    tokens: candidate.tokenCount,
  }));

  const selected = [];
  const selectedIndices = new Set();
  const coveredTerms = new Set();
  let selectedTokens = 0;

  while (selected.length < maxCompressionSentences) {
    let bestCandidate = null;
    let bestAdjustedScore = Number.NEGATIVE_INFINITY;

    for (const candidate of scoredSentences) {
      if (selectedIndices.has(candidate.index)) {
        continue;
      }

      const underBudget = selectedTokens + candidate.tokens <= targetTokens;
      const forceTopCandidate = selected.length === 0;
      const forceRelevantSecond = selected.length === 1 && candidate.overlapCount > 0;

      if (!underBudget && !forceTopCandidate && !forceRelevantSecond) {
        continue;
      }

      let uncoveredOverlapCount = 0;
      for (const term of candidate.overlapTerms) {
        if (!coveredTerms.has(term)) {
          uncoveredOverlapCount += 1;
        }
      }

      // Encourage query-term diversity while preserving base relevance ranking.
      const adjustedScore = candidate.score + uncoveredOverlapCount * 1.2;

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestCandidate = candidate;
        continue;
      }

      if (adjustedScore === bestAdjustedScore && bestCandidate) {
        if (candidate.overlapCount > bestCandidate.overlapCount) {
          bestCandidate = candidate;
          continue;
        }
        if (candidate.overlapCount === bestCandidate.overlapCount && candidate.tokens < bestCandidate.tokens) {
          bestCandidate = candidate;
          continue;
        }
        if (
          candidate.overlapCount === bestCandidate.overlapCount
          && candidate.tokens === bestCandidate.tokens
          && candidate.index < bestCandidate.index
        ) {
          bestCandidate = candidate;
        }
      }
    }

    if (!bestCandidate) {
      break;
    }

    selected.push(bestCandidate);
    selectedIndices.add(bestCandidate.index);
    selectedTokens += bestCandidate.tokens;

    for (const term of bestCandidate.overlapTerms) {
      coveredTerms.add(term);
    }
  }

  const selectedTermCounts = new Map();
  for (const candidate of selected) {
    for (const term of candidate.overlapTerms) {
      selectedTermCounts.set(term, (selectedTermCounts.get(term) ?? 0) + 1);
    }
  }

  const missingTerms = [...terms].filter((term) => !selectedTermCounts.has(term));

  for (const missingTerm of missingTerms) {
    const candidateOptions = scoredSentences
      .filter((candidate) => !selectedIndices.has(candidate.index) && candidate.overlapTerms.includes(missingTerm))
      .sort((left, right) => {
        if (right.score === left.score) {
          return left.tokens - right.tokens;
        }
        return right.score - left.score;
      });

    let repaired = false;

    for (const candidate of candidateOptions) {
      let bestSwapIndex = -1;
      let bestSwapNetGain = Number.NEGATIVE_INFINITY;
      let bestSwapScore = Number.POSITIVE_INFINITY;

      for (let index = 0; index < selected.length; index += 1) {
        const existing = selected[index];
        const swappedTokens = selectedTokens - existing.tokens + candidate.tokens;
        if (swappedTokens > targetTokens) {
          continue;
        }

        let gainCount = 0;
        for (const term of candidate.overlapTerms) {
          if (!selectedTermCounts.has(term)) {
            gainCount += 1;
          }
        }

        let lossCount = 0;
        for (const term of existing.overlapTerms) {
          const count = selectedTermCounts.get(term) ?? 0;
          const preservedByCandidate = candidate.overlapTerms.includes(term);
          if (count === 1 && !preservedByCandidate) {
            lossCount += 1;
          }
        }

        const netGain = gainCount - lossCount;
        if (netGain <= 0) {
          continue;
        }

        if (netGain > bestSwapNetGain) {
          bestSwapNetGain = netGain;
          bestSwapIndex = index;
          bestSwapScore = existing.score;
          continue;
        }

        if (netGain === bestSwapNetGain && existing.score < bestSwapScore) {
          bestSwapIndex = index;
          bestSwapScore = existing.score;
        }
      }

      if (bestSwapIndex === -1) {
        continue;
      }

      const removed = selected[bestSwapIndex];
      selected[bestSwapIndex] = candidate;
      selectedTokens = selectedTokens - removed.tokens + candidate.tokens;
      selectedIndices.delete(removed.index);
      selectedIndices.add(candidate.index);

      for (const term of removed.overlapTerms) {
        const nextCount = (selectedTermCounts.get(term) ?? 0) - 1;
        if (nextCount <= 0) {
          selectedTermCounts.delete(term);
        } else {
          selectedTermCounts.set(term, nextCount);
        }
      }

      for (const term of candidate.overlapTerms) {
        selectedTermCounts.set(term, (selectedTermCounts.get(term) ?? 0) + 1);
      }

      repaired = true;
      break;
    }

    if (!repaired) {
      continue;
    }
  }

  selected.sort((a, b) => a.index - b.index);

  let compressedText = selected.map((item) => item.sentence).join(' ');

  if (!compressedText) {
    compressedText = tokenize(contextText).slice(0, targetTokens).join(' ');
  } else {
    const compressedRawTokens = tokenize(compressedText);
    if (compressedRawTokens.length > targetTokens) {
      compressedText = compressedRawTokens.slice(0, targetTokens).join(' ');
    }
  }

  const compressedTokens = estimateTokens(compressedText);

  return {
    compressedText,
    compressedTokens,
    originalTokens,
    reductionRatio: originalTokens === 0 ? 0 : (originalTokens - compressedTokens) / originalTokens,
    selectedSentenceCount: selected.length,
    dedupedSentenceCount,
  };
}

export function compressContext({
  context,
  query,
  minCompressionTokens = DEFAULT_OPTIONS.minCompressionTokens,
  maxCompressionSentences = DEFAULT_OPTIONS.maxCompressionSentences,
  targetReduction = DEFAULT_OPTIONS.targetReduction,
}) {
  const contextText = context ?? '';
  const contextAnalysis = preprocessContext(contextText);

  return compressContextFromAnalysis({
    contextAnalysis,
    contextText,
    query,
    minCompressionTokens,
    maxCompressionSentences,
    targetReduction,
  });
}

export function buildPrompt({ systemPrompt = DEFAULT_SYSTEM_PROMPT, context, query }) {
  return [
    `System: ${systemPrompt}`,
    '',
    'Context:',
    context,
    '',
    `User: ${query}`,
  ].join('\n');
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function simulateTokenCache({ prompt, cacheStore, cacheWindowTokens = DEFAULT_OPTIONS.cacheWindowTokens }) {
  const tokens = tokenize(prompt);
  const cacheableTokenCount = Math.min(tokens.length, cacheWindowTokens);
  const prefix = tokens.slice(0, cacheableTokenCount).join('\u241f');
  const cacheKey = hash(prefix);

  const hit = cacheStore.has(cacheKey);
  if (!hit) {
    cacheStore.set(cacheKey, true);
  }

  return {
    cacheKey,
    hit,
    cachedTokens: hit ? cacheableTokenCount : 0,
    promptTokens: tokens.length,
  };
}

export function runBenchmark({
  requests,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  options = {},
}) {
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const compressionCache = new Map();
  const contextAnalysisCache = new Map();
  const contextHashCache = new Map();
  const rawPromptCache = new Map();
  const compressedPromptCache = new Map();

  const perRequest = [];

  for (const request of requests) {
    const rawPrompt = buildPrompt({ systemPrompt, context: request.context, query: request.query });
    const rawCache = simulateTokenCache({
      prompt: rawPrompt,
      cacheStore: rawPromptCache,
      cacheWindowTokens: mergedOptions.cacheWindowTokens,
    });
    const rawInputTokens = rawCache.promptTokens;

    let contextHash = contextHashCache.get(request.context);
    if (!contextHash) {
      contextHash = hash(request.context);
      contextHashCache.set(request.context, contextHash);
    }

    const compressionCacheKey = hash([
      contextHash,
      request.query,
      mergedOptions.targetReduction,
      mergedOptions.minCompressionTokens,
      mergedOptions.maxCompressionSentences,
    ].join('\n---\n'));

    const compressionStart = performance.now();
    let compressionCacheHit = false;
    let compressionOutput = compressionCache.get(compressionCacheKey);

    if (!compressionOutput) {
      let contextAnalysis = contextAnalysisCache.get(request.context);
      if (!contextAnalysis) {
        contextAnalysis = preprocessContext(request.context);
        contextAnalysisCache.set(request.context, contextAnalysis);
      }

      compressionOutput = compressContextFromAnalysis({
        contextAnalysis,
        contextText: request.context,
        query: request.query,
        targetReduction: mergedOptions.targetReduction,
        minCompressionTokens: mergedOptions.minCompressionTokens,
        maxCompressionSentences: mergedOptions.maxCompressionSentences,
      });
      compressionCache.set(compressionCacheKey, compressionOutput);
    } else {
      compressionCacheHit = true;
    }

    const compressionMs = performance.now() - compressionStart;

    const compressedPrompt = buildPrompt({
      systemPrompt,
      context: compressionOutput.compressedText,
      query: request.query,
    });

    const compressedCache = simulateTokenCache({
      prompt: compressedPrompt,
      cacheStore: compressedPromptCache,
      cacheWindowTokens: mergedOptions.cacheWindowTokens,
    });
    const compressedInputTokens = compressedCache.promptTokens;

    perRequest.push({
      id: request.id,
      rawInputTokens,
      rawCachedTokens: rawCache.cachedTokens,
      rawCacheHit: rawCache.hit,
      rawBillableTokens: rawInputTokens - rawCache.cachedTokens,
      compressedInputTokens,
      compressedCachedTokens: compressedCache.cachedTokens,
      compressedCacheHit: compressedCache.hit,
      compressedBillableTokens: compressedInputTokens - compressedCache.cachedTokens,
      compressionCacheHit,
      compressionMs,
      contextReductionRatio: compressionOutput.reductionRatio,
      selectedSentenceCount: compressionOutput.selectedSentenceCount,
      dedupedSentenceCount: compressionOutput.dedupedSentenceCount,
    });
  }

  const totals = perRequest.reduce(
    (accumulator, row) => {
      accumulator.rawInputTokens += row.rawInputTokens;
      accumulator.rawCachedTokens += row.rawCachedTokens;
      accumulator.rawBillableTokens += row.rawBillableTokens;
      accumulator.compressedInputTokens += row.compressedInputTokens;
      accumulator.compressedCachedTokens += row.compressedCachedTokens;
      accumulator.compressedBillableTokens += row.compressedBillableTokens;
      accumulator.compressionMs += row.compressionMs;
      accumulator.rawCacheHits += row.rawCacheHit ? 1 : 0;
      accumulator.compressedCacheHits += row.compressedCacheHit ? 1 : 0;
      accumulator.compressionCacheHits += row.compressionCacheHit ? 1 : 0;
      return accumulator;
    },
    {
      rawInputTokens: 0,
      rawCachedTokens: 0,
      rawBillableTokens: 0,
      compressedInputTokens: 0,
      compressedCachedTokens: 0,
      compressedBillableTokens: 0,
      compressionMs: 0,
      rawCacheHits: 0,
      compressedCacheHits: 0,
      compressionCacheHits: 0,
    },
  );

  const requestCount = perRequest.length;

  const summary = {
    requestCount,
    averageCompressionMs: requestCount === 0 ? 0 : totals.compressionMs / requestCount,
    rawInputTokens: totals.rawInputTokens,
    compressedInputTokens: totals.compressedInputTokens,
    inputTokenReductionRatio: totals.rawInputTokens === 0 ? 0 : (totals.rawInputTokens - totals.compressedInputTokens) / totals.rawInputTokens,
    rawCachedTokens: totals.rawCachedTokens,
    compressedCachedTokens: totals.compressedCachedTokens,
    rawBillableTokens: totals.rawBillableTokens,
    compressedBillableTokens: totals.compressedBillableTokens,
    billableTokenReductionRatio:
      totals.rawBillableTokens === 0
        ? 0
        : (totals.rawBillableTokens - totals.compressedBillableTokens) / totals.rawBillableTokens,
    rawCacheHitRate: requestCount === 0 ? 0 : totals.rawCacheHits / requestCount,
    compressedCacheHitRate: requestCount === 0 ? 0 : totals.compressedCacheHits / requestCount,
    compressionCacheHitRate: requestCount === 0 ? 0 : totals.compressionCacheHits / requestCount,
  };

  return {
    options: mergedOptions,
    perRequest,
    summary,
  };
}

export function createDefaultWorkload() {
  const sharedContext = [
    'Q4 go-to-market planning memo for NovaDesk Enterprise rollout. The enterprise plan includes SSO, SCIM, audit logs, and custom retention policies.',
    'Pricing bands are: Starter at 49 dollars per seat, Growth at 89 dollars per seat, and Enterprise negotiated annually. Annual contracts include a 15 percent discount.',
    'Security controls include SOC 2 Type II, SAML 2.0 with Okta and Entra ID, and configurable DLP policies for export restrictions.',
    'Onboarding sequence: pilot with 50 users, security review, then staged rollout by department over 6 weeks. Customer success target is 85 percent weekly active usage by week 8.',
    'Known risks: legal review delays in EMEA, migration friction for teams with legacy wiki exports, and support ticket spikes in the first 10 days.',
    'Integration priorities: Slack, Jira, Salesforce, and Snowflake. Snowflake connector is currently beta and has a known 2-minute sync lag.',
    'Support SLA for Enterprise is 99.9 percent uptime, P1 response in 15 minutes, and dedicated technical account manager.',
    'For launch readiness, all sales engineers must complete the enterprise objection-handling certification before May 15.',
    'This document is confidential and intended for internal planning only.',
  ].join(' ');

  return [
    {
      id: 'req-001',
      context: sharedContext,
      query: 'What are the enterprise security controls and onboarding milestones?',
    },
    {
      id: 'req-002',
      context: sharedContext,
      query: 'Summarize pricing and support SLA for enterprise buyers.',
    },
    {
      id: 'req-003',
      context: sharedContext,
      query: 'What launch risks could impact adoption in EMEA?',
    },
    {
      id: 'req-004',
      context: `${sharedContext} Additional note: procurement wants explicit timeline dates for legal and security sign-off.` ,
      query: 'List timeline-sensitive blockers for rollout approval.',
    },
    {
      id: 'req-005',
      context: sharedContext,
      query: 'Summarize pricing and support SLA for enterprise buyers.',
    },
    {
      id: 'req-006',
      context: sharedContext,
      query: 'What are the enterprise security controls and onboarding milestones?',
    },
  ];
}

export function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}
