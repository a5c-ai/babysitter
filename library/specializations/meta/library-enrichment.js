/**
 * @process meta/library-enrichment
 * @description Reusable batch enrichment of the process library: survey backlogs and
 *   library coverage in parallel, recall prior enrichment knowledge from kip, synthesize
 *   a candidate slate, get owner approval, author the approved items in parallel
 *   (design -> generate -> adversarial proof-driven quality gate), integrate them into
 *   backlogs and indexes, capture durable insights back into kip, and finish with an
 *   owner sign-off. Re-run it any time to enrich the library further — each run builds
 *   on the facts the previous runs asserted into kip.
 * @inputs {
 *   batchSize?: number,            // how many items to author this run (default 3)
 *   itemTypes?: string[],          // subset of ['process','skill','agent','specialization'] (default all)
 *   targetDomains?: string[],      // restrict gap analysis to these domains ([] = all, auto gap analysis)
 *   libraryRoot?: string,          // library root relative to repo (default 'library')
 *   planFile?: string,             // seed plan (default 'library/specializations/meta/library-enrichment-plan.md')
 *   kipEnabled?: boolean,          // use kip for recall + knowledge capture (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string,             // model for kip ask/resolve structured paths (default 'sonnet')
 *   maxFixAttempts?: number        // adversarial-gate fix loop bound per item (default 2)
 * }
 * @outputs {
 *   success: boolean,
 *   slate: array,                  // approved candidate items
 *   authored: array,               // items that passed the adversarial gate ({ name, type, files, gateAttempts })
 *   rejected: array,               // items that exhausted the gate and were dropped/deferred by the owner
 *   integration: object,           // backlog/README updates performed
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object
 * }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:software-architecture]
 *   skillAreas: [skill-area:orchestration-loop, skill-area:agentic-loops]
 *   workflows: [workflow:feature-development]
 *   roles: [role:architect, role:platform-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const KIP_CLI_NOTE = [
  'kip CLI resolution: use `kip` if on PATH, otherwise `npm exec --yes --package @a5c-ai/kip-sdk -- kip`.',
  'Always pass `--dir <kipDir>` and `--json`. If the store does not exist yet, run `kip init --dir <kipDir>` first.',
  'For `kip ask` / `kip resolve` style structured paths pass `--model <kipModel>` explicitly (weak default models under-fire on JSON-schema adjudication).',
].join(' ');

// ---------------------------------------------------------------------------
// Phase 1 — parallel survey
// ---------------------------------------------------------------------------

export const backlogScanTask = defineTask('backlog-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scan library backlogs for open enrichment items',
  agent: {
    name: 'specialization-curator',
    prompt: {
      role: 'Process library curator',
      task: 'Extract open (unchecked) work items from the library backlogs and the seed plan',
      context: args,
      instructions: [
        `Read ${args.libraryRoot}/specializations/meta/processes-backlog.md, ${args.libraryRoot}/methodologies/backlog.md, ${args.libraryRoot}/specializations/backlog.md, and the seed plan at ${args.planFile}.`,
        'Collect every unchecked `- [ ]` item and every seed-plan candidate. Preserve the item name, target directory, one-line description, and any Reference links.',
        args.targetDomains && args.targetDomains.length
          ? `Only keep items relevant to these domains: ${args.targetDomains.join(', ')}.`
          : 'Keep items from all domains.',
        `Only keep items whose type is one of: ${args.itemTypes.join(', ')}.`,
        'Do not invent items in this task — report only what the backlogs and plan actually contain.',
      ],
      outputFormat: 'JSON with openItems array [{ name, type, domain, targetDir, description, references }] and sourceFiles array',
    },
    outputSchema: {
      type: 'object',
      required: ['openItems', 'sourceFiles'],
      properties: {
        openItems: { type: 'array' },
        sourceFiles: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'survey'],
}));

export const libraryCensusTask = defineTask('library-census', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Census library coverage and quality gaps',
  agent: {
    name: 'specialization-curator',
    prompt: {
      role: 'Process library analyst',
      task: 'Map existing library coverage and identify genuine gaps',
      context: args,
      instructions: [
        `Enumerate ${args.libraryRoot}/specializations/* and ${args.libraryRoot}/methodologies/* (directory listing plus README skims, not full reads).`,
        'Identify: (a) domains with thin or missing process coverage, (b) existing processes that predate the current quality bar (no breakpoint routing options, no adversarial gates, no parallelization, no kip usage) and are worth retrofitting, (c) missing skills/agents referenced by existing processes.',
        args.targetDomains && args.targetDomains.length
          ? `Restrict the census to: ${args.targetDomains.join(', ')}.`
          : 'Cover the whole library.',
        'Cite evidence for each gap: the directory or file you inspected and what was absent.',
      ],
      outputFormat: 'JSON with coverage array, gaps array [{ domain, kind, description, evidence }], retrofitCandidates array',
    },
    outputSchema: {
      type: 'object',
      required: ['gaps'],
      properties: {
        coverage: { type: 'array' },
        gaps: { type: 'array' },
        retrofitCandidates: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'survey'],
}));

export const kipRecallTask = defineTask('kip-recall', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recall prior enrichment knowledge from kip',
  agent: {
    name: 'specialization-curator',
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Query the kip store for facts asserted by previous library-enrichment runs',
      context: args,
      instructions: [
        KIP_CLI_NOTE,
        `Store: --dir ${args.kipDir}. If it does not exist, initialize it and report an empty recall (this is a fresh brain, not an error).`,
        'Run `kip recall` / `kip query` for entities tagged with the enrichment namespace (kind `library-enrichment`, props `slate`, `authored-item`, `insight`, `rejected-item`).',
        'Summarize: what was authored before, what was rejected and why, and standing insights (e.g. recurring gate failures, domains already saturated).',
        'Report the raw fact count so downstream tasks can tell an empty brain from a query mistake.',
      ],
      outputFormat: 'JSON with priorAuthored array, priorRejected array, insights array, factCount number, storeInitialized boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['factCount', 'insights'],
      properties: {
        priorAuthored: { type: 'array' },
        priorRejected: { type: 'array' },
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
  labels: ['agent', 'meta', 'enrichment', 'kip'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — slate synthesis + owner approval
// ---------------------------------------------------------------------------

export const slateSynthesisTask = defineTask('slate-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize the candidate slate for this run',
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Process library architect',
      task: 'Rank survey findings into a concrete authoring slate for this run',
      context: args,
      instructions: [
        `Merge the backlog items, census gaps, and kip recall into a ranked candidate list of ${args.batchSize * 2} items; propose the top ${args.batchSize} as the slate.`,
        'Never propose an item kip recall shows was already authored; deprioritize items resembling previously rejected ones unless the rejection reason no longer applies.',
        'Each slate item must specify: name (kebab-case), type (process|skill|agent|specialization), domain, targetDir under the library root, a 3-6 sentence scope, and which existing library file to use as the closest style reference.',
        'Prefer a mix of new-domain and existing-domain items when the gaps support it. Retrofit batches are valid slates.',
        'For every item, state how it will satisfy the quality bar: breakpoint routing (breakpointId/expert/tags/strategy), adversarial proof-driven gates, parallelization, and kip integration where the item touches knowledge or data.',
      ],
      outputFormat: 'JSON with slate array [{ name, type, domain, targetDir, scope, styleReference, qualityNotes }] and alternates array (same shape)',
    },
    outputSchema: {
      type: 'object',
      required: ['slate'],
      properties: {
        slate: { type: 'array' },
        alternates: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'planning'],
}));

// ---------------------------------------------------------------------------
// Phase 3 — per-item authoring (runs inside ctx.parallel.map)
// ---------------------------------------------------------------------------

export const itemDesignTask = defineTask('item-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design ${args.item.type}: ${args.item.name}`,
  agent: {
    name: args.item.type === 'skill' ? 'skill-designer'
      : args.item.type === 'agent' ? 'agent-designer'
      : 'process-architect',
    prompt: {
      role: 'Library artifact designer',
      task: `Produce a concrete design for the ${args.item.type} '${args.item.name}'`,
      context: args,
      instructions: [
        `Read the style reference (${args.item.styleReference}) and the closest neighbors in ${args.item.targetDir} before designing.`,
        'For processes: lay out phases, tasks (kind agent — no shell subtasks), data flow between tasks, which steps run in parallel via ctx.parallel, every breakpoint (with breakpointId, expert, tags, strategy, and whether autoApproveAfterN applies), every quality gate (reviewer independence, IRON-LAW proof requirements, evidence schema, bounded fix loop, escalation breakpoint), and kip touchpoints (recall at start, assert at end) if the item handles knowledge or data.',
        'For skills/agents: define the SKILL.md/AGENT.md frontmatter, triggering description, and body outline, matching the existing meta/skills and meta/agents formats.',
        'The design must be complete enough that a generator can produce the file(s) without inventing structure.',
      ],
      outputFormat: 'JSON with design object { files: [{ path, purpose }], phases?, tasks?, breakpoints?, qualityGates?, kipTouchpoints?, outline? }',
    },
    outputSchema: {
      type: 'object',
      required: ['design'],
      properties: { design: { type: 'object' } },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'design'],
}));

export const itemGenerationTask = defineTask('item-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate ${args.item.type}: ${args.item.name}`,
  agent: {
    name: 'process-architect',
    skill: {
      name: args.item.type === 'skill' ? 'skill-generator'
        : args.item.type === 'agent' ? 'agent-generator'
        : 'process-generator',
    },
    prompt: {
      role: 'Library artifact author',
      task: `Write the actual file(s) for '${args.item.name}' from the approved design`,
      context: args,
      instructions: [
        'Write every file listed in the design to its exact path. ESM only.',
        'Process files MUST carry the JSDoc header (@process, @description, @inputs, @outputs, @graph with at least one domain: node), import { defineTask } from \'@a5c-ai/babysitter-sdk\', export async function process(inputs, ctx), Style-A defineTask exports with io paths tasks/<taskCtx.effectId>/input.json|result.json and labels arrays, and a structured return ending in metadata.',
        'Implement exactly the breakpoints, parallel sections, quality gates, and kip touchpoints the design specifies — do not silently drop any.',
        'Run a syntax check on generated .js files (node --check) and fix what it reports before returning.',
        'If a fix round: address ONLY the listed issues; do not refactor unrelated content.',
        args.feedback ? `Fix round ${args.attempt}: outstanding issues to address: ${JSON.stringify(args.feedback)}` : 'First generation round.',
      ],
      outputFormat: 'JSON with files array [{ path, action }], syntaxChecked boolean, notes string',
    },
    outputSchema: {
      type: 'object',
      required: ['files', 'syntaxChecked'],
      properties: {
        files: { type: 'array' },
        syntaxChecked: { type: 'boolean' },
        notes: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'generation'],
}));

export const adversarialReviewTask = defineTask('adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial gate: ${args.item.name} (attempt ${args.attempt})`,
  agent: {
    name: 'quality-assessor',
    skill: { name: 'process-validator' },
    prompt: {
      role: 'Adversarial quality gatekeeper',
      task: `Try to FAIL the generated ${args.item.type} '${args.item.name}' against the library quality bar`,
      context: args,
      instructions: [
        'IRON LAW: Do NOT trust the generator report. Open and read every generated file yourself.',
        'Your default posture is rejection: pass only when you could not substantiate a single blocking issue.',
        'Check, with file:line evidence for every verdict:',
        '1. Conventions — JSDoc header complete (@process/@description/@inputs/@outputs/@graph with a domain: node), ESM, defineTask import, process(inputs, ctx) export, structured return with metadata, io paths and labels on every task.',
        '2. Breakpoints — sparse, and every one uses routing options (breakpointId dotted namespace, expert, tags, strategy); escalation breakpoints have per-item-unique breakpointIds.',
        '3. Quality gates — reviewers independent of implementers, IRON-LAW instructions present, gate schemas require evidence (not just passed:true), fix loops bounded with escalation.',
        '4. Parallelization — independent tasks actually go through ctx.parallel; no gratuitous sequential chains.',
        '5. kip — if the item touches knowledge/memory/data, it recalls at start and asserts at end with the documented CLI resolution; if it does not touch knowledge, it must NOT drag kip in.',
        '6. No kind:shell tasks, no silent fallbacks, syntax check passes (run node --check yourself).',
        'Return passed=false with a specific, actionable issues list if ANYTHING is missing. Each issue: { file, location, problem, requiredFix }. Each evidence entry: { file, location, observation }.',
      ],
      outputFormat: 'JSON with passed boolean, issues array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issues', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        issues: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'quality-gate', 'adversarial'],
}));

// ---------------------------------------------------------------------------
// Phase 5-7 — integration, kip capture, report
// ---------------------------------------------------------------------------

export const integrationTask = defineTask('library-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate authored items into backlogs and indexes',
  agent: {
    name: 'technical-writer',
    skill: { name: 'process-integrator' },
    prompt: {
      role: 'Library integrator',
      task: 'Register the authored items in the library backlogs, READMEs, and indexes',
      context: args,
      instructions: [
        'For each authored item: mark its backlog entry `[x]` if it came from a backlog, or append a new checked entry in the matching backlog section (`- [x] name.js - description`).',
        'Update the README.md of each touched specialization/methodology directory to list the new item; create the README if the item opened a new domain directory.',
        'Do not modify anything unrelated to the authored items. List every file you touched.',
      ],
      outputFormat: 'JSON with updatedFiles array [{ path, change }], newDomains array',
    },
    outputSchema: {
      type: 'object',
      required: ['updatedFiles'],
      properties: {
        updatedFiles: { type: 'array' },
        newDomains: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'integration'],
}));

export const kipCaptureTask = defineTask('kip-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assert run knowledge into kip',
  agent: {
    name: 'specialization-curator',
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Durably record what this enrichment run did so future runs recall it',
      context: args,
      instructions: [
        KIP_CLI_NOTE,
        `Store: --dir ${args.kipDir}.`,
        'Assert one fact per authored item (kind `library-enrichment`, prop `authored-item`: name, type, domain, files, gateAttempts, runId).',
        'Assert one fact per rejected/deferred item (prop `rejected-item`: name, reason).',
        'Assert run-level insights worth remembering (prop `insight`: recurring gate failures, saturated domains, style lessons) — only insights supported by this run\'s evidence.',
        'Report the exact number of facts asserted and their entity ids.',
      ],
      outputFormat: 'JSON with factsAsserted number, entityIds array',
    },
    outputSchema: {
      type: 'object',
      required: ['factsAsserted'],
      properties: {
        factsAsserted: { type: 'number' },
        entityIds: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'kip'],
}));

export const finalReportTask = defineTask('enrichment-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write the enrichment run report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical writer',
      task: 'Write a concise run report for the owner sign-off',
      context: args,
      instructions: [
        `Write the report to ${args.reportPath} (markdown).`,
        'Sections: slate approved, items authored (with file lists and gate attempt counts), items rejected/deferred (with the gate evidence that killed them), integration changes, kip facts asserted, and recommended slate for the NEXT run.',
        'Keep it factual — link every claim to a file or task result.',
      ],
      outputFormat: 'JSON with reportPath string, summary string',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'meta', 'enrichment', 'report'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    batchSize = 3,
    itemTypes = ['process', 'skill', 'agent', 'specialization'],
    targetDomains = [],
    libraryRoot = 'library',
    planFile = 'library/specializations/meta/library-enrichment-plan.md',
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    maxFixAttempts = 2,
  } = inputs || {};

  const startTime = ctx.now();
  const artifacts = [];
  const surveyArgs = { batchSize, itemTypes, targetDomains, libraryRoot, planFile, kipDir, kipModel };

  // Phase 1 — parallel survey (backlogs + census + kip recall have no dependencies on each other).
  ctx.log?.('info', 'Phase 1: parallel survey (backlogs, census, kip recall)');
  const surveyThunks = [
    () => ctx.task(backlogScanTask, surveyArgs),
    () => ctx.task(libraryCensusTask, surveyArgs),
  ];
  if (kipEnabled) {
    surveyThunks.push(() => ctx.task(kipRecallTask, surveyArgs));
  }
  const [backlog, census, recall] = await ctx.parallel.all(surveyThunks);
  const priorKnowledge = kipEnabled ? recall : { factCount: 0, insights: [], priorAuthored: [], priorRejected: [] };

  // Phase 2 — slate synthesis + owner approval (bounded feedback loop).
  ctx.log?.('info', 'Phase 2: slate synthesis and owner approval');
  let synthesis = await ctx.task(slateSynthesisTask, { ...surveyArgs, backlog, census, priorKnowledge });
  let slateApproved = false;
  let lastFeedback = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback) {
      synthesis = await ctx.task(slateSynthesisTask, {
        ...surveyArgs, backlog, census, priorKnowledge,
        feedback: lastFeedback, attempt: attempt + 1,
      });
    }
    const approval = await ctx.breakpoint({
      question: `Approve this enrichment slate of ${synthesis.slate.length} items? Reply with changes to re-rank (alternates are available).`,
      title: 'Enrichment Slate Approval',
      context: { runId: ctx.runId, summary: { slate: synthesis.slate, alternates: synthesis.alternates } },
      previousFeedback: lastFeedback || undefined,
    }, {
      breakpointId: 'meta.library-enrichment.slate',
      expert: 'owner',
      tags: ['enrichment', 'slate-approval'],
      strategy: 'single',
      presentAlwaysApprove: true,
    });
    if (approval.approved) { slateApproved = true; break; }
    lastFeedback = approval.response || approval.feedback || 'Changes requested';
  }
  if (!slateApproved) {
    return {
      success: false,
      slate: synthesis.slate,
      authored: [],
      rejected: [],
      integration: null,
      kipFactsAsserted: 0,
      artifacts,
      metadata: { processId: 'meta/library-enrichment', timestamp: startTime, reason: 'slate not approved after 3 attempts' },
    };
  }
  const slate = synthesis.slate;

  // Phases 3-4 — per-item authoring pipeline, all items in parallel, no barrier
  // between design/generate/gate: each item flows through its own chain.
  ctx.log?.('info', `Phase 3-4: authoring ${slate.length} items in parallel (design -> generate -> adversarial gate)`);
  const itemResults = await ctx.parallel.map(slate, async (item) => {
    const itemArgs = { ...surveyArgs, item, priorKnowledge };
    const designed = await ctx.task(itemDesignTask, itemArgs);
    let generation = await ctx.task(itemGenerationTask, { ...itemArgs, design: designed.design });

    let gate = null;
    let attempt = 1;
    for (;;) {
      gate = await ctx.task(adversarialReviewTask, { ...itemArgs, design: designed.design, generation, attempt });
      if (gate.passed) {
        return { item, status: 'authored', files: generation.files, gateAttempts: attempt, evidence: gate.evidence };
      }
      if (attempt > maxFixAttempts) break;
      attempt += 1;
      generation = await ctx.task(itemGenerationTask, {
        ...itemArgs, design: designed.design, feedback: gate.issues, attempt,
      });
    }

    // Gate exhausted — escalate to the owner with the adversarial evidence.
    // Per-item breakpointId keeps invocation keys deterministic under parallel replay.
    const escalation = await ctx.breakpoint({
      question: `'${item.name}' failed the adversarial gate ${attempt} times. Approve keeping it as-is (accepting the open issues), or reject to drop it from this run?`,
      title: `Quality-Gate Escalation: ${item.name}`,
      context: { runId: ctx.runId, summary: { item, issues: gate.issues, evidence: gate.evidence } },
    }, {
      breakpointId: `meta.library-enrichment.gate-escalation.${item.name}`,
      expert: 'owner',
      tags: ['enrichment', 'quality-gate', 'escalation'],
      strategy: 'single',
      presentAlwaysApprove: false,
    });
    if (escalation.approved) {
      return { item, status: 'authored', files: generation.files, gateAttempts: attempt, evidence: gate.evidence, ownerOverride: true };
    }
    return { item, status: 'rejected', reason: 'adversarial gate exhausted', issues: gate.issues };
  });

  const authored = itemResults.filter((r) => r.status === 'authored');
  const rejected = itemResults.filter((r) => r.status === 'rejected');

  // Phase 5 — integration (needs the full authored set: genuine barrier).
  let integration = null;
  if (authored.length) {
    ctx.log?.('info', `Phase 5: integrating ${authored.length} authored items`);
    integration = await ctx.task(integrationTask, { ...surveyArgs, authored });
    artifacts.push(...integration.updatedFiles.map((f) => f.path));
  }

  // Phase 6 — kip knowledge capture and Phase 7 report run in parallel; the
  // report reads run results, not kip, so they are independent.
  ctx.log?.('info', 'Phase 6-7: kip capture and run report');
  const reportPath = `artifacts/enrichment-report-${ctx.runId}.md`;
  const captureThunks = [
    () => ctx.task(finalReportTask, { ...surveyArgs, slate, authored, rejected, integration, reportPath }),
  ];
  if (kipEnabled) {
    captureThunks.push(() => ctx.task(kipCaptureTask, { ...surveyArgs, slate, authored, rejected, runId: ctx.runId }));
  }
  const [report, capture] = await ctx.parallel.all(captureThunks);
  artifacts.push(report.reportPath);

  // Final owner sign-off.
  await ctx.breakpoint({
    question: `Enrichment run complete: ${authored.length} authored, ${rejected.length} rejected. ${report.summary}`,
    title: 'Enrichment Run Sign-Off',
    context: {
      runId: ctx.runId,
      files: [{ path: report.reportPath, format: 'markdown', label: 'Run report' }],
      summary: { authored: authored.map((a) => a.item.name), rejected: rejected.map((r) => r.item.name) },
    },
  }, {
    breakpointId: 'meta.library-enrichment.signoff',
    expert: 'owner',
    tags: ['enrichment', 'sign-off'],
    strategy: 'single',
    autoApproveAfterN: 3,
    presentAlwaysApprove: true,
  });

  return {
    success: true,
    slate,
    authored,
    rejected,
    integration,
    kipFactsAsserted: kipEnabled && capture ? capture.factsAsserted : 0,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'meta/library-enrichment', timestamp: startTime },
  };
}
