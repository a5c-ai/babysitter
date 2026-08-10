/**
 * @process specializations/common-utilities/routed-gate-combinators
 * @description Routed-gate combinators — reusable quality-bar helpers: routed breakpoints
 *   (breakpointId/expert/tags/strategy always populated), adversarial IRON-LAW critic gates
 *   reducing to {passed, issues[], evidence[]} with mandatory evidence, and kip recall/assert
 *   checkpoints with Windows-safe CLI invocation
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:orchestration-loop, skill-area:agentic-loops]
 *   topics: [topic:developer-experience]
 *   roles: [role:platform-engineer, role:tech-lead]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ---------------------------------------------------------------------------
// KIP_CLI_NOTE — embedded verbatim into every kip-touching agent prompt
// ---------------------------------------------------------------------------

/**
 * Windows-safe kip CLI invocation guidance. Single joined string so it can be
 * dropped straight into an agent instructions array.
 *
 * @type {string}
 */
export const KIP_CLI_NOTE = [
  'kip CLI resolution: use `kip` if on PATH; otherwise invoke Windows-safe as `node packages/kip-sdk/dist/cli/kip.js` (npm exec bin resolution is unreliable on Windows).',
  'Always pass `--dir <kipDir>` and `--json`.',
  'If the store does not exist yet, run `kip init --dir <kipDir> --create` first and treat an empty recall as a fresh brain, not an error.',
  'For `kip ask` / `kip resolve` structured paths always pass `--model <kipModel>` explicitly (weak default models under-fire on JSON-schema adjudication).',
].join(' ');

// ---------------------------------------------------------------------------
// Built-in IRON-LAW block prepended to every adversarial critic prompt
// ---------------------------------------------------------------------------

const IRON_LAW_BLOCK = [
  'IRON LAW: you are an adversarial critic. Your default verdict is FAIL.',
  'A PASS verdict is invalid without concrete evidence: cite exact file paths, line references, or executed checks proving each claim.',
  'Report every issue — do not soften findings, do not pass on promises of future fixes.',
  'Output verdict as JSON matching the schema; passed:true with an empty evidence array will be rejected by the orchestrator.',
];

// ---------------------------------------------------------------------------
// routedBreakpoint — ctx.breakpoint with routing metadata made non-optional
// ---------------------------------------------------------------------------

/**
 * Thin wrapper over ctx.breakpoint that makes routing metadata non-optional.
 * Every breakpoint raised through this helper carries breakpointId, expert,
 * tags, and strategy — the routing fields the census showed almost no process
 * passes by hand. No fallbacks: missing identity fields throw synchronously.
 *
 * Usage:
 *   const result = await routedBreakpoint(ctx, { question: 'Approve?' }, {
 *     breakpointId: 'my-process.phase.decision',
 *     expert: 'owner',
 *     tags: ['my-process', 'decision'],
 *   });
 *
 * @param {object} ctx - The process context
 * @param {object} payload - Breakpoint payload (question, artifacts, context)
 * @param {object} routing - Routing metadata
 * @param {string} routing.breakpointId - REQUIRED dotted-namespace kebab-case id
 * @param {string|string[]} routing.expert - REQUIRED expert route (e.g. 'owner')
 * @param {string[]} routing.tags - REQUIRED non-empty tags array
 * @param {string} [routing.strategy='single'] - Breakpoint strategy
 * @param {string} [routing.label] - Display label (defaults to breakpointId)
 * @param {number} [routing.autoApproveAfterN] - Optional auto-approve threshold
 * @param {boolean} [routing.presentAlwaysApprove] - Optional always-approve affordance
 * @returns {Promise<object>} The BreakpointResult, unchanged
 */
export async function routedBreakpoint(ctx, payload, routing) {
  const {
    breakpointId,
    expert,
    tags,
    strategy = 'single',
    label = routing && routing.breakpointId,
    autoApproveAfterN,
    presentAlwaysApprove,
  } = routing ?? {};

  // No fallbacks: identity fields are the entire point of this wrapper.
  if (!breakpointId) {
    throw new Error(`routedBreakpoint: breakpointId is required (got ${JSON.stringify(breakpointId)})`);
  }
  if (!expert || (Array.isArray(expert) && expert.length === 0)) {
    throw new Error(`routedBreakpoint: expert is required (got ${JSON.stringify(expert)})`);
  }
  if (!Array.isArray(tags) || tags.length === 0) {
    throw new Error(`routedBreakpoint: tags is required (got ${JSON.stringify(tags)})`);
  }

  return ctx.breakpoint(payload, {
    label,
    breakpointId,
    expert,
    tags,
    strategy,
    ...(autoApproveAfterN !== undefined && { autoApproveAfterN }),
    ...(presentAlwaysApprove !== undefined && { presentAlwaysApprove }),
  });
}

// ---------------------------------------------------------------------------
// Adversarial gate tasks — generic critic and default fixer (Style-A)
// ---------------------------------------------------------------------------

export const adversarialCriticTask = defineTask('adversarial-critic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial critic: ${args.critic.name} (attempt ${args.attempt})`,
  agent: {
    name: args.critic.name,
    prompt: {
      role: args.critic.role,
      task: `Adversarially review ${args.artifact.path}: ${args.critic.focus}`,
      context: {
        artifact: args.artifact,
        gateId: args.gateId,
        attempt: args.attempt,
        ...args.context,
      },
      instructions: [
        ...IRON_LAW_BLOCK,
        ...args.ironLaw,
        ...(args.critic.instructions ?? []),
      ],
      outputFormat: 'JSON with passed boolean, issues array [{severity, description, location?}], evidence array of strings (file:line citations or executed-check outputs)',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issues', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        issues: { type: 'array' },
        evidence: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'quality-gate', 'critic', args.gateId],
}));

export const gateFixerTask = defineTask('gate-fixer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix gate issues: ${args.gateId} (attempt ${args.attempt})`,
  agent: {
    name: 'gate-fixer',
    prompt: {
      role: 'Remediation engineer',
      task: `Fix every critic-reported issue in ${args.artifact.path}`,
      context: {
        artifact: args.artifact,
        issues: args.issues,
        gateId: args.gateId,
        attempt: args.attempt,
        ...args.context,
      },
      instructions: [
        `Address every listed issue in the context against ${args.artifact.path}.`,
        'Do not dismiss findings — if an issue is genuinely wrong, explain why with evidence instead of ignoring it.',
        'Report what changed per issue so the next critic round can verify the fixes.',
      ],
      outputFormat: 'JSON with fixed boolean and changes array (one entry per addressed issue)',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'quality-gate', 'fixer', args.gateId],
}));

// ---------------------------------------------------------------------------
// adversarialGate — parallel IRON-LAW critics + bounded fix loop + escalation
// ---------------------------------------------------------------------------

/**
 * Adversarial quality gate: fan out independent critics over an artifact,
 * reduce their verdicts under a mandatory-evidence rule, run a bounded fixer
 * loop between rounds, and escalate to a routed owner breakpoint when the
 * fix budget is exhausted. Evidence is mandatory for a pass — passed:true
 * with an empty evidence array is coerced to a protocol failure.
 *
 * Usage:
 *   const gate = await adversarialGate(ctx, {
 *     gateId: 'my-process.artifact-review',
 *     artifact: { path: artifactPath, description: 'Generated report' },
 *     critics: [
 *       { name: 'accuracy-critic', role: 'Accuracy reviewer', focus: 'claims match sources' },
 *       { name: 'style-critic', role: 'Style reviewer', focus: 'tone and structure' },
 *     ],
 *     ironLaw: ['Verify every claim against the source files with file:line citations.'],
 *     maxFixAttempts: 2,
 *     fixer: {},
 *   });
 *
 * @param {object} ctx - The process context
 * @param {object} options - Gate options
 * @param {{path: string, description: string}} options.artifact - Artifact under review
 * @param {Array<{name: string, role: string, focus: string, instructions?: string[]}>} options.critics - REQUIRED non-empty critic specs
 * @param {string[]} [options.ironLaw=[]] - Gate-specific rules appended verbatim to every critic prompt (after the built-in IRON-LAW block)
 * @param {number} [options.maxFixAttempts=2] - Fixer runs allowed between critic rounds
 * @param {{task?: Function, args?: object}} [options.fixer] - Fixer spec; task omitted -> built-in gateFixerTask; fixer omitted entirely -> no fix loop
 * @param {string} options.gateId - REQUIRED gate id, used for breakpointId namespacing and task labels
 * @param {object} [options.context={}] - Extra context threaded into critic/fixer prompts
 * @returns {Promise<{passed: boolean, issues: Array<{critic: string, severity: string, description: string}>, evidence: Array<{critic: string, evidence: string[]}>, attempts: number, escalated: boolean}>}
 */
export async function adversarialGate(ctx, {
  artifact,
  critics,
  ironLaw = [],
  maxFixAttempts = 2,
  fixer,
  gateId,
  context = {},
}) {
  // No fallbacks: identity and reviewers are caller responsibilities.
  if (!gateId) {
    throw new Error(`adversarialGate: gateId is required (got ${JSON.stringify(gateId)})`);
  }
  if (!artifact || !artifact.path) {
    throw new Error(`adversarialGate: artifact with a path is required (got ${JSON.stringify(artifact)})`);
  }
  if (!Array.isArray(critics) || critics.length === 0) {
    throw new Error(`adversarialGate: critics is required and must be non-empty (got ${JSON.stringify(critics)})`);
  }

  let issues = [];
  let evidence = [];
  let attempt = 0;

  for (attempt = 1; attempt <= maxFixAttempts + 1; attempt++) {
    // (1) Fan out critics concurrently — independent instances, none sees
    // another's verdict, and the drafting agent never reviews its own work.
    const verdicts = await ctx.parallel.all(
      critics.map((c) => () =>
        ctx.task(adversarialCriticTask, {
          critic: c,
          artifact,
          ironLaw,
          context,
          gateId,
          attempt,
        })
      )
    );

    // (2) Reduce under the mandatory-evidence rule: a critic verdict counts
    // as passed ONLY with passed === true AND non-empty evidence; an
    // evidence-empty pass is coerced to a protocol failure, never accepted.
    issues = [];
    evidence = [];
    let allPassed = true;
    for (let i = 0; i < critics.length; i++) {
      const critic = critics[i];
      const verdict = verdicts[i];
      const hasEvidence = Array.isArray(verdict.evidence) && verdict.evidence.length > 0;
      const criticPassed = verdict.passed === true && hasEvidence;

      if (verdict.passed === true && !hasEvidence) {
        issues.push({
          critic: critic.name,
          severity: 'protocol',
          description: 'PASS verdict rejected: no evidence supplied',
        });
      }
      for (const issue of verdict.issues ?? []) {
        issues.push({ critic: critic.name, ...issue });
      }
      evidence.push({ critic: critic.name, evidence: verdict.evidence ?? [] });

      if (!criticPassed) {
        allPassed = false;
      }
    }

    // (3) Every critic passed with evidence — the gate is clean.
    if (allPassed) {
      return { passed: true, issues, evidence, attempts: attempt, escalated: false };
    }

    // (4) Failed with fix budget remaining and a fixer provided — remediate
    // and loop for another critic round. fixer.task omitted -> built-in.
    if (attempt <= maxFixAttempts && fixer) {
      await ctx.task(fixer.task ?? gateFixerTask, {
        artifact,
        issues,
        context,
        gateId,
        attempt,
        ...fixer.args,
      });
      continue;
    }

    // No fixer (or budget spent) — stop looping and escalate below.
    break;
  }

  // (5) Exhausted — escalate to the owner via a routed breakpoint. The gate
  // result reflects the owner's call and is flagged escalated:true.
  const escalation = await routedBreakpoint(ctx, {
    question: `Adversarial gate ${gateId} failed after ${attempt} attempts. Accept as-is, or reject?`,
    issues,
    evidence,
  }, {
    breakpointId: `${gateId}.gate-escalation`,
    expert: 'owner',
    tags: ['quality-gate', 'escalation', gateId],
    strategy: 'single',
  });

  return {
    passed: escalation.approved === true,
    issues,
    evidence,
    attempts: attempt,
    escalated: true,
  };
}

// ---------------------------------------------------------------------------
// kip checkpoint tasks — recall-at-start / assert-at-end (Style-A)
// ---------------------------------------------------------------------------

export const kipRecallTask = defineTask('kip-recall-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recall kip facts: ${args.topic}`,
  agent: {
    name: 'kip-librarian',
    prompt: {
      role: 'Knowledge-base librarian',
      task: `Recall prior facts about "${args.topic}" from the kip store`,
      context: args,
      instructions: [
        KIP_CLI_NOTE,
        `Query the store at --dir ${args.kipDir} for facts about "${args.topic}" (kind ${args.kind}), passing --model ${args.kipModel} on structured paths.`,
        `If the store is absent, initialize it with kip init --dir ${args.kipDir} --create and report an empty recall with storeInitialized:true — a fresh brain is not an error.`,
        'Always report the raw factCount so downstream phases can tell an empty brain from a query mistake.',
        'Summarize any recalled facts into actionable insights for the calling process.',
      ],
      outputFormat: 'JSON with facts array, insights array, factCount number, storeInitialized boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['factCount', 'insights', 'storeInitialized'],
      properties: {
        facts: { type: 'array' },
        insights: { type: 'array' },
        factCount: { type: 'number' },
        storeInitialized: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'kip', 'recall'],
}));

export const kipAssertTask = defineTask('kip-assert-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assert ${args.facts.length} kip facts (${args.kind})`,
  agent: {
    name: 'kip-librarian',
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Assert the provided facts into the kip store',
      context: args,
      instructions: [
        KIP_CLI_NOTE,
        `Assert each fact in the context (subject, predicate, object, optional props) into the store at --dir ${args.kipDir} with kind ${args.kind}, using --json and passing --model ${args.kipModel} on structured paths.`,
        'Report per-fact success and the totals. If any assertion fails, include it in the failed array with the CLI error — never swallow failures.',
      ],
      outputFormat: 'JSON with asserted number and failed array [{ fact, error }]',
    },
    outputSchema: {
      type: 'object',
      required: ['asserted'],
      properties: {
        asserted: { type: 'number' },
        failed: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'kip', 'assert'],
}));

// ---------------------------------------------------------------------------
// kipRecall / kipAssert — checkpoint helpers wrapping the tasks above
// ---------------------------------------------------------------------------

/**
 * Recall-at-start checkpoint. Queries the kip store for facts about a topic
 * so the calling process can thread prior insights into its work. An empty
 * or missing store is initialized and reported as factCount 0, never an error.
 *
 * Usage:
 *   const recall = await kipRecall(ctx, { kipDir: '.a5c/kip', topic: 'my topic', kipModel: 'sonnet' });
 *
 * @param {object} ctx - The process context
 * @param {object} options - Recall options
 * @param {string} [options.kipDir='.a5c/kip'] - kip store directory
 * @param {string} options.topic - REQUIRED recall topic
 * @param {string} [options.kipModel='sonnet'] - Model for structured kip paths
 * @param {string} [options.kind='library-enrichment'] - Fact kind to query
 * @returns {Promise<{facts: array, insights: array, factCount: number, storeInitialized: boolean}>}
 */
export async function kipRecall(ctx, { kipDir = '.a5c/kip', topic, kipModel = 'sonnet', kind = 'library-enrichment' } = {}) {
  if (!topic) {
    throw new Error(`kipRecall: topic is required (got ${JSON.stringify(topic)})`);
  }
  return ctx.task(kipRecallTask, { kipDir, topic, kipModel, kind });
}

/**
 * Assert-at-end checkpoint. Writes durable facts back into the kip store so
 * future runs recall them. Asserting nothing is a caller bug, so an empty
 * facts array throws instead of silently no-opping.
 *
 * Usage:
 *   const result = await kipAssert(ctx, {
 *     kipDir: '.a5c/kip',
 *     facts: [{ subject: 'process:my-process', predicate: 'exercised', object: 'combinator:adversarialGate' }],
 *   });
 *
 * @param {object} ctx - The process context
 * @param {object} options - Assert options
 * @param {string} [options.kipDir='.a5c/kip'] - kip store directory
 * @param {Array<{subject: string, predicate: string, object: string, props?: object}>} options.facts - REQUIRED non-empty facts
 * @param {string} [options.kipModel='sonnet'] - Model for structured kip paths
 * @param {string} [options.kind='library-enrichment'] - Fact kind to assert under
 * @returns {Promise<{asserted: number, failed: array}>}
 */
export async function kipAssert(ctx, { kipDir = '.a5c/kip', facts, kipModel = 'sonnet', kind = 'library-enrichment' } = {}) {
  if (!Array.isArray(facts) || facts.length === 0) {
    throw new Error(`kipAssert: facts is required and must be non-empty (got ${JSON.stringify(facts)}) — asserting nothing is a caller bug`);
  }
  return ctx.task(kipAssertTask, { kipDir, facts, kipModel, kind });
}
