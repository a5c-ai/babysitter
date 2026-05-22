const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich the Benchmarks cluster: Benchmark, TestSet, EvalRun,
// EvalResult, EvalHarness, Judge, Rubric, ContentPolicy. Targets: missing
// frontier benchmarks, missing per-model eval-result rows, missing harness
// integrations, missing safety-eval coverage, missing benchmark targets/covers
// edges.

const discoverBenchmarkGapsTask = defineTask('discover-benchmark-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory benchmarks cluster — find gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List every Benchmark, TestSet, EvalRun, EvalResult, EvalHarness, Judge, Rubric under graph/benchmarks/.',
      'Identify missing canonical benchmarks across categories:',
      '  - Knowledge / reasoning: MMLU-Pro, GPQA, MATH, AIME, ARC-Challenge, HellaSwag, BIG-Bench-Hard, MMLU-Redux, FrontierMath, ARC-AGI, ARC-AGI-2, LiveCodeBench, OpenAI MathArena.',
      '  - Coding: HumanEval, HumanEval+, MBPP, EvalPlus, BigCodeBench, SWE-bench, SWE-bench Verified, SWE-bench Multimodal, LiveCodeBench, USACO, Aider polyglot leaderboard.',
      '  - Agentic: GAIA, WebArena, OSWorld, AgentBench, ToolBench, BFCL, ScreenSpot, SWE-Lancer.',
      '  - Multimodal: MMMU, MathVista, ChartQA, VQA, DocVQA, AI2D.',
      '  - Long-context: NIAH, RULER, BABILong, LongBench, ZeroSCROLLS.',
      '  - Safety: HarmBench, JailbreakBench, StrongREJECT, AdvBench, XSTest, BeaverTails, RealToxicityPrompts.',
      '  - Truthfulness / factuality: TruthfulQA, SimpleQA, FreshQA, FActScore.',
      '  - Translation: FLORES-200, WMT shared tasks.',
      '  - Mobile / browser: Android World, ScreenAgent, OSWorld.',
      'For each Benchmark in the catalog, check covers edges (→ SkillArea) and targets edges (→ ModelVersion / AgentVersion / Capability). Identify missing.',
      'For each canonical benchmark, identify missing eval-result rows for the major models (claude opus/sonnet, gpt-5, gemini-2-5, deepseek-r1, qwen-2-5, llama-4).',
      'Identify missing harnesses: inspect-ai, helm, lm-eval-harness, openai-evals, promptfoo, deepeval, ragas, mlflow-evaluate, langsmith-eval.',
      'Return JSON: { benchmarksMissing[], benchmarksWithoutCovers[], benchmarksWithoutTargets[], evalResultsMissing[], harnessesMissing[], judgesMissing[], rubricsMissing[] }.'
    ]
  }
}));

const researchBenchmarkFactsTask = defineTask('research-benchmark-facts', (args) => ({
  kind: 'agent',
  title: 'Research benchmark facts from leaderboards and papers',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'Per missing benchmark: arxiv paper, official homepage / leaderboard URL, test-set composition (size, splits, public vs held-out), targetsKind enum (ModelVersion / AgentVersion / both), description.',
      'Per missing eval-result: the score, metric, unit, passFail, reportedAt, source (vendor model card OR independent leaderboard like papers-with-code, opencompass, llm-stats.com, livebench.ai, artificialanalysis.ai).',
      'Per missing harness: github repo, displayName, supported benchmarks, languages.',
      'Per missing judge: displayName, kind (model-as-judge with model-id, OR exact-match, OR pairwise, OR rubric-based), evidence.',
      'Per missing rubric: criteria axes, scoring scale, source.',
      'For every artifact: source URL, retrievedAt, quote, confidence.',
      'Return JSON: { evidence, newBenchmarksToAuthor, newEvalResultsToAuthor, newHarnessesToAuthor, newJudgesToAuthor, newRubricsToAuthor, coversEdgesToAdd, targetsEdgesToAdd }.'
    ]
  }
}));

const enrichBenchmarkGraphTask = defineTask('enrich-benchmark-graph', (args) => ({
  kind: 'agent',
  title: 'Apply benchmark research to graph',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author new Benchmark / TestSet / EvalRun / EvalResult / EvalHarness / Judge / Rubric records under graph/benchmarks/.',
      'Per Benchmark: wire covers SkillArea (with confidence + weight attrs), uses_test_set TestSet, targets the model/agent kinds, evaluates_policy ContentPolicy where the benchmark is safety-oriented.',
      'Per EvalRun: wire evaluates_target (ModelVersion/AgentVersion), uses_test_set, for_benchmark, uses_harness EvalHarness, judged_by Judge, scored_against_rubric Rubric, produced_result EvalResult.',
      'Per EvalResult: wire belongs_to_eval_run, scored_against Benchmark.',
      'Per Judge / Rubric: wire judges/rubric_for to EvalRuns where used.',
      'Author Claim records for non-trivial scores citing the leaderboard URL + retrievedAt.',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'Run validator after each batch.',
      'If gaps remain after editing, return remainingGaps with exact unresolved ids. If evidence is insufficient, return status=blocked and blockedEvidence with source locations to check next.',
      'Return JSON: { filesEdited, filesCreated, benchmarksAdded, evalResultsAdded, harnessesAdded, judgesAdded, rubricsAdded, edgesAdded, claimsAdded, remainingGaps[], blockedEvidence[], validatorState }.'
    ]
  }
}));

const verifyBenchmarkEnrichmentTask = defineTask('verify-benchmark-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify benchmarks-cluster enrichment',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'If this verification is not ok, return remainingGaps[] so the process can iterate, or status=blocked with blockedEvidence[] when facts cannot be resolved safely.',
      'Every Benchmark has at least one covers SkillArea AND at least one targets edge.',
      'Every EvalRun has a uses_test_set, for_benchmark, evaluates_target, AND uses_harness.',
      'Every EvalResult has a numeric score AND a reportedAt date AND a source citation.',
      'No Trust Chain entries.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;
  const initialGaps = await ctx.task(discoverBenchmarkGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchBenchmarkFactsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichBenchmarkGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyBenchmarkEnrichmentTask, {
      enrichmentResult: enrichmentResult,
      gaps: currentGaps,
      attempt,
    });

    attempts.push({
      attempt,
      gaps: currentGaps,
      evidence: evidence,
      enrichmentResult: enrichmentResult,
      verification,
    });

    if (verification.status === 'ok') break;
    if (verification.status === 'blocked') break;

    currentGaps = verification.remainingGaps || verification.gaps || enrichmentResult.remainingGaps || currentGaps;
  }

  return {
    status: verification && verification.status === 'ok' ? 'ok' : 'needs-review',
    graphRoot,
    gaps: currentGaps,
    initialGaps,
    attempts,
    enrichmentResult: enrichmentResult,
    verification,
  };
};
