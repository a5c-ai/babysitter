/**
 * @module library/processes/shared/db-agent-explore
 * @description Generic "point an analyst agent at a local SQLite DB and ask a
 *   research question" process. Generalized from the query-composition +
 *   narration phases of
 *   `specializations/domains/business/travel/travel-plan-compose.js`.
 *
 *   The analyst reads SCHEMA.md (no guessing), composes SQL via a Python 3
 *   stdlib `sqlite3` script, executes it (read-only, `mode=ro` URI),
 *   iterates until the findings answer the question, and writes a
 *   human-readable report with verbatim SQL as audit evidence.
 *
 *   Hard constraints:
 *   - All tasks are `kind:'agent'`. No shell tasks. No MCP.
 *   - DB is opened read-only so the analyst cannot mutate the dataset.
 *   - Every finding carries the verbatim SQL that produced it.
 *
 * @inputs {
 *   dbPath: string,            // absolute path to a SQLite DB (typically from local-db-build)
 *   schemaDocPath: string,     // absolute path to SCHEMA.md
 *   workDir: string,           // absolute path where query scripts + report land
 *   question: string,          // the analysis question in natural language
 *   hypotheses?: string[],     // optional hypotheses to test
 *   maxQueryRounds?: number,   // default 4 -- how many compose/execute/refine loops
 *   outputFormat?: 'markdown'|'json'|'both',  // default 'markdown'
 *   persona?: string           // optional analyst persona, default "Data Analyst"
 * }
 *
 * @outputs {
 *   success: boolean,
 *   reportPath: string,        // absolute path to findings.md
 *   findings: Array<{
 *     claim: string,
 *     evidenceRows: number,
 *     sqlAudit: string,
 *     confidence: 'high'|'medium'|'low',
 *     caveats?: string[]
 *   }>,
 *   queryLog: Array<{ round: number; scriptPath: string; rowCount: number; elapsedMs: number }>,
 *   artifacts: Array<{ path: string; format?: string; label?: string }>,
 *   duration: number,
 *   metadata: object
 * }
 *
 * Usage:
 *
 * ```js
 * import { process as exploreDb } from '@a5c-ai/babysitter-library/processes/shared/db-agent-explore.js';
 * const report = await exploreDb({
 *   dbPath: '/abs/work/dataset.sqlite',
 *   schemaDocPath: '/abs/work/SCHEMA.md',
 *   workDir: '/abs/work/exploration',
 *   question: 'Which carriers dominate morning departures from TLV in summer?',
 * }, ctx);
 * ```
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    dbPath,
    schemaDocPath,
    workDir,
    question,
    hypotheses = [],
    maxQueryRounds = 4,
    outputFormat = 'markdown',
    persona = 'Data Analyst',
  } = inputs;

  const startedAt = ctx.now();
  const artifacts = [];
  ctx.log('info', `DB exploration: question="${question.slice(0, 80)}" rounds<=${maxQueryRounds}`);

  const planning = await ctx.task(questionPlanningTask, {
    question, hypotheses, schemaDocPath, workDir, persona,
  });
  artifacts.push(...(planning.artifacts || []));

  const queryLog = [];
  const allFindings = [];
  let round = 1;
  let refinementNotes = null;

  while (round <= maxQueryRounds) {
    const exploration = await ctx.task(sqlExplorationTask, {
      round,
      question,
      plan: planning.plan,
      refinementNotes,
      dbPath,
      schemaDocPath,
      workDir,
      persona,
    });
    artifacts.push(...(exploration.artifacts || []));
    queryLog.push(...(exploration.queryLog || []));
    allFindings.push(...(exploration.findings || []));

    if (exploration.sufficient || round === maxQueryRounds) break;
    refinementNotes = exploration.refinementNotes;
    round += 1;
  }

  const synthesis = await ctx.task(findingsSynthesisTask, {
    question, hypotheses, findings: allFindings, queryLog, plan: planning.plan, workDir, persona,
  });
  artifacts.push(...(synthesis.artifacts || []));

  const report = await ctx.task(reportExportTask, {
    question, hypotheses, findings: synthesis.findings, queryLog, outputFormat, workDir, persona,
  });
  artifacts.push(...(report.artifacts || []));

  return {
    success: true,
    reportPath: report.reportPath,
    findings: synthesis.findings,
    queryLog,
    artifacts,
    duration: ctx.now() - startedAt,
    metadata: {
      processId: 'shared/db-agent-explore',
      timestamp: startedAt,
      rounds: round,
      question,
    },
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const questionPlanningTask = defineTask('question-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose the research question into SQL-shaped sub-questions',
  agent: {
    name: 'db-analyst-planner',
    prompt: {
      role: args.persona || 'Data Analyst',
      task: 'Decompose the question (and any hypotheses) into sub-questions that can each be answered by a single SQL query.',
      context: args,
      instructions: [
        'Read schemaDocPath first. Never invent table or column names.',
        'Produce 3-8 sub-questions, each mapped to one or more candidate tables/views and an estimated aggregation shape (per-group count, ranked top-N, time bucketed, etc.).',
        'For each hypothesis, explicitly list the sub-question that would falsify it.',
        'Return plan = { subQuestions:[{id, text, tables, aggregationShape, falsifiesHypothesis?}] }.',
      ],
      outputFormat: 'JSON: { plan, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: { plan: { type: 'object' }, artifacts: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'exploration', 'planning'],
}));

export const sqlExplorationTask = defineTask('sql-exploration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author and execute Python + sqlite3 queries for one round',
  agent: {
    name: 'sql-query-composer',
    prompt: {
      role: args.persona || 'Data Analyst',
      task: 'For each unresolved sub-question, author a Python stdlib sqlite3 script and execute it.',
      context: args,
      instructions: [
        `This is round ${args.round}.`,
        'Under workDir/round-<n>/, write q_<subQuestionId>.py using ONLY Python stdlib (`sqlite3`, `json`, `argparse`, `pathlib`).',
        'Open the DB read-only: sqlite3.connect(f"file:{dbPath}?mode=ro", uri=True, timeout=5). Set row_factory=sqlite3.Row.',
        'Persist each query result as JSON under workDir/round-<n>/<subQuestionId>.json with at most 500 rows.',
        'Execute scripts via your harness python tool. Do NOT use the sqlite3 CLI.',
        'For each sub-question produce a finding: { claim, evidenceRows, sqlAudit (verbatim SQL string), confidence, caveats? }.',
        'Determine sufficient=true if every sub-question in the plan is answered with non-empty evidence and the findings collectively address the top-level question.',
        'If sufficient=false, emit refinementNotes: what to query next round (additional sub-questions, tighter filters, or joins previously missed).',
      ],
      outputFormat: 'JSON: { findings, queryLog:[{round, scriptPath, rowCount, elapsedMs}], sufficient, refinementNotes?, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'queryLog', 'sufficient', 'artifacts'],
      properties: {
        findings: { type: 'array' },
        queryLog: { type: 'array' },
        sufficient: { type: 'boolean' },
        refinementNotes: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'exploration', 'sql'],
}));

export const findingsSynthesisTask = defineTask('findings-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Merge and de-dup findings across rounds',
  agent: {
    name: 'db-analyst-planner',
    prompt: {
      role: args.persona || 'Data Analyst',
      task: 'Merge per-round findings into a coherent answer set.',
      context: args,
      instructions: [
        'Do NOT touch the database in this phase.',
        'Deduplicate findings that make the same claim from different sub-questions -- keep the one with the strongest evidenceRows and attach the others as corroboration in caveats.',
        'Rank findings by relevance to the top-level question, then by confidence.',
        'Explicitly note any hypothesis that was falsified or left unresolved.',
      ],
      outputFormat: 'JSON: { findings, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: { findings: { type: 'array' }, artifacts: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'exploration', 'synthesis'],
}));

export const reportExportTask = defineTask('report-export', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Export findings as a human-readable report',
  agent: {
    name: 'db-analyst-narrator',
    prompt: {
      role: args.persona || 'Data Analyst',
      task: 'Write workDir/findings.md (and/or findings.json per outputFormat).',
      context: args,
      instructions: [
        'Report sections: (1) Question, (2) Hypotheses + resolution, (3) Findings -- for each: claim, confidence, evidenceRows, and a collapsible "SQL evidence" block with the verbatim sqlAudit, (4) Caveats + data limitations, (5) Query log appendix.',
        'Be concrete. Quote numbers. Do not hedge with language that the SQL does not support.',
        'Return absolute reportPath.',
      ],
      outputFormat: 'JSON: { reportPath, artifacts }',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: { reportPath: { type: 'string' }, artifacts: { type: 'array' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'exploration', 'report'],
}));
