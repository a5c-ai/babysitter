/**
 * @process specializations/qa-testing-automation/diagnostic-first-phase
 * @description Reusable defineTask snippet for the diagnostic-first phase in
 *   "the fix shipped but the bug recurs" patterns. Connects to a live
 *   production DB read-only via service-role key, dumps raw evidence
 *   (JSON + markdown summary) BEFORE any code changes.
 *
 * Use this as Phase A of any run that fits the recurring-bug pattern. Real
 * example from the cookbook project: three successive theory-driven fix
 * attempts (sentinel rows → router.refresh → set-based completeness check)
 * each passed all mock-DB unit tests and never moved the user-visible badge.
 * The fourth attempt led with a phase like this one and identified the
 * actual root cause on the first artifact (PostgREST's 1000-row response
 * cap silently truncating `.in('recipe_id', ...)` queries — a failure mode
 * pglite-based unit tests systematically cannot reproduce).
 *
 * @inputs {
 *   projectDir?: string      // defaults to process.cwd()
 *   envFile?: string         // defaults to '.env.production.local'
 *   outputDir?: string       // where to write diagnose.{mjs,json,md} artifacts
 *   queries?: Array<{ name: string, description?: string, code: string }>
 *   hypotheses?: string[]    // optional priors the LLM should evaluate
 * }
 * @outputs { artifacts, queries, topHypothesis, examples, recommendation }
 *
 * @example
 *   import { diagnosticFirstPhaseTask } from
 *     'specializations/qa-testing-automation/diagnostic-first-phase';
 *   const diagnostic = await ctx.task(diagnosticFirstPhaseTask, {
 *     envFile: '.env.production.local',
 *     outputDir: `.a5c/runs/${ctx.runId}/artifacts`,
 *     queries: [
 *       { name: 'incompleteRecipes',
 *         description: 'Recipes the badge marks pending',
 *         code: "client.from('recipe').select('id,title').is('deleted_at',null)" },
 *     ],
 *     hypotheses: [
 *       'PostgREST 1000-row cap silently truncating .in() on the join table',
 *       'Stale framework Server Component cache after the mutation',
 *     ],
 *   });
 *
 * Contract:
 *   - The diagnostic instantiates a service-role Supabase client from the
 *     project's env file and runs ONLY the queries provided in `args.queries`.
 *   - Read-only by construction: the prompt forbids UPDATE / DELETE / INSERT /
 *     UPSERT / mutating RPCs, and the generated script must be safe to run
 *     unattended (YOLO).
 *   - Dumps the raw query results to `<outputDir>/diagnose.json` and an
 *     analyst-readable Markdown summary to `<outputDir>/diagnose-summary.md`,
 *     including a top hypothesis + one-paragraph fix recommendation.
 *   - No code under src/, tests/, or supabase/ may be modified by Phase A.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export const diagnosticFirstPhaseTask = defineTask('diagnostic-first-phase', (args, taskCtx) => {
  const projectDir = args.projectDir || process.cwd();
  const envFile = args.envFile || '.env.production.local';
  const outputDir = args.outputDir || `.a5c/runs/${taskCtx.runId || 'unknown'}/artifacts`;
  const queries = Array.isArray(args.queries) ? args.queries : [];
  const hypotheses = Array.isArray(args.hypotheses) ? args.hypotheses : [];
  const queryFragment =
    queries.length > 0
      ? queries
          .map(
            (q, i) =>
              `  ${i + 1}. ${q.name || `query-${i + 1}`} — ${q.description || '(no description)'}\n     code: ${q.code || '(none)'}`,
          )
          .join('\n')
      : '  (none provided — derive the smallest read-only queries that reproduce the user-visible discrepancy)';
  const hypothesisFragment =
    hypotheses.length > 0
      ? hypotheses.map((h, i) => `  H${i + 1}. ${h}`).join('\n')
      : '  (no priors provided — form your own from the queried data)';

  return {
    kind: 'agent',
    title: 'Diagnostic-first Phase A: dump live production state, no code changes',
    execution: { model: 'claude-opus-4-6' },
    agent: {
      name: 'general-purpose',
      prompt: {
        role: 'Site-reliability engineer triaging a recurring production bug from live data — read-only',
        task: 'Instantiate a service-role Supabase client from the project env file, run the requested read-only queries, dump JSON + a markdown summary with a top hypothesis and fix recommendation. DO NOT write any production code in this phase.',
        context: args,
        instructions: [
          `PROJECT DIR: ${projectDir}.`,
          `ENV FILE: ${envFile} — must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or the equivalent for your provider).`,
          `OUTPUT DIR: ${outputDir} (mkdir -p if absent).`,
          '',
          'WHAT THIS PHASE IS FOR:',
          '  Any "the fix shipped but the bug recurs" pattern. When test suites',
          '  with mocked DBs/clients can\'t reproduce the production failure mode,',
          '  the unit-test feedback loop becomes actively misleading. Trust the',
          '  data, not the model in your head — query the live system first.',
          '',
          'STEP 1 — Write a one-shot Node script at ' + outputDir + '/diagnose.mjs that:',
          '  - Loads env from ' + envFile + ' (use `node --env-file` if supported, otherwise inline-parse).',
          '  - Imports @supabase/supabase-js and creates a service-role client (bypasses RLS).',
          '  - Runs the queries listed under QUERIES below, each labeled by its `name`.',
          '  - Aggregates the results into a single JSON object keyed by query name.',
          '',
          'QUERIES:',
          queryFragment,
          '',
          'STEP 2 — Run the script and capture stdout/stderr:',
          `  cd ${projectDir} && node ${outputDir}/diagnose.mjs > ${outputDir}/diagnose-stdout.txt 2>&1`,
          `  Save the structured result as ${outputDir}/diagnose.json.`,
          '',
          'STEP 3 — Analyse and form a HYPOTHESIS. Candidate hypotheses to evaluate (from caller):',
          hypothesisFragment,
          '  Reject any hypothesis the data contradicts. Name the one the data supports.',
          '',
          'STEP 4 — Write ' + outputDir + '/diagnose-summary.md with these sections:',
          '  - "## Counts" — totals from each query',
          '  - "## Evidence" — up to 3 representative rows per query (JSON-formatted)',
          '  - "## Top hypothesis" — one paragraph naming the most-likely cause and citing the rows that support it',
          '  - "## Recommendation" — one paragraph the Phase B implementer can act on (file paths, the specific data shape to fix, the contract the fix must restore)',
          '',
          'CONSTRAINTS — STRICT, YOLO-SAFE:',
          '  - READ-ONLY. The diagnose.mjs script MUST NOT contain any of: `.update(`, `.delete(`, `.insert(`, `.upsert(`, `.rpc(` with a mutating function, or any raw SQL matching `UPDATE|DELETE|INSERT|TRUNCATE|ALTER|DROP|CREATE`. Refuse to write the script if a requested query contains a write.',
          '  - DO NOT touch src/, tests/, supabase/, scripts/, or any framework-config file.',
          '  - DO NOT commit credentials. Service-role key stays in env.',
          '  - If the script can\'t reach the DB (network/credentials issue), report the failure clearly and exit with `topHypothesis: "diagnostic unreachable — see notes"` rather than guessing.',
          '',
          'OUTPUT (return ONLY this JSON — no markdown fences, no prose):',
          '  {',
          `    "artifacts": ["${outputDir}/diagnose.mjs", "${outputDir}/diagnose.json", "${outputDir}/diagnose-summary.md", "${outputDir}/diagnose-stdout.txt"],`,
          '    "queries": [<echo of the queries you ran, by name>],',
          '    "topHypothesis": "<one-sentence root-cause hypothesis grounded in the query results>",',
          '    "examples": [<up to 3 representative rows that motivate the hypothesis>],',
          '    "recommendation": "<one-paragraph fix recommendation for the Phase B implementer>"',
          '  }',
        ],
        outputFormat: 'JSON',
      },
      outputSchema: {
        type: 'object',
        required: ['artifacts', 'topHypothesis', 'recommendation'],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ['diagnostic-first', 'phase-a'],
  };
});
