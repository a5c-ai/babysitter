/**
 * @process accessibility/wcag-audit-remediation
 * @description Flagship end-to-end WCAG audit & remediation lifecycle: scope definition ->
 *   kip recall of known issues -> parallel per-surface automated axe scan + manual expert
 *   audit -> prioritized findings register -> policy-gated remediation-plan sign-off ->
 *   remediation implementation -> adversarial WCAG conformance re-audit gate that RE-RUNS
 *   axe/manual checks on the remediated surfaces (executed evidence) -> regression-guard
 *   capture -> policy-gated public conformance/VPAT statement publish -> kip assert of
 *   findings and remediation outcomes. All human approvals are routedBreakpoints; kip
 *   recall at scope and assert at close.
 * @inputs {
 *   target: object,                // required — { name, surfaces: [{ id, kind:'page'|'component', url?, path?, description? }] (required, non-empty), assistiveTech?: string[] }
 *   wcagLevel?: string,            // target conformance level A|AA|AAA (default 'AA')
 *   repoRoot?: string,             // repository root the agents work in (default '.')
 *   artifactsDir?: string,         // ctx.artifactsDir is used; input override optional
 *   maxFixAttempts?: number,       // bounded fixer loop for the conformance re-audit gate (default 2)
 *   kipEnabled?: boolean,          // recall + assert accessibility findings via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,              // conformanceGate.passed && gatedActions.remediationPlanSignoff.approved && (statement not required OR gatedActions.conformanceStatementPublish.approved === gatedActions.conformanceStatementPublish.executed) && regressionGuard.captured
 *   scope: object,                 // { surfaces[], wcagLevel, assistiveTech[], auditPlan }
 *   priorKnowledge: object,        // kipRecall result { factCount, facts[], insights[], storeInitialized }
 *   audits: array,                 // per-surface { surfaceId, axeScan{ executed, violations[], evidence[] }, manualAudit{ findings[], evidence[] } }
 *   findingsRegister: object,      // { findings[] each {id, surfaceId, wcagCriterion, level, severity, impact, description, evidenceRef}, prioritized[], counts }
 *   remediationPlan: object,       // { items[], priorityOrder[], quickWins[], effortEstimate, deadlines }
 *   remediation: object,           // { implementedFixes[], remainingFindings[], artifacts[] }
 *   conformanceGate: object,       // { passed, issues[], evidence[], attempts, escalated } (evidence includes EXECUTED axe re-scan per remediated surface)
 *   regressionGuard: object,       // { captured, tests[], ciWired, artifacts[] }
 *   conformanceStatement: object,  // { statementPath, level, published }
 *   gatedActions: object,          // { remediationPlanSignoff, conformanceStatementPublish } each { actionId, required, approved, autoApproved, response, executed }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, targetName, breakpointsHit, timings }
 * }
 * @references
 *   WCAG: https://www.w3.org/WAI/standards-guidelines/wcag/
 *   ARIA Authoring Practices Guide (APG): https://www.w3.org/WAI/ARIA/apg/
 * @graph
 *   domains: [domain:accessibility, domain:web-development]
 *   specializations: [specialization:accessibility]
 *   skillAreas: [skill-area:web-accessibility, skill-area:accessibility-testing, skill-area:orchestration-loop]
 *   workflows: [workflow:feature-development, workflow:quality-assurance]
 *   topics: [topic:accessibility, topic:quality-assurance, topic:compliance]
 *   roles: [role:accessibility-lead, role:engineering-lead, role:qa-engineer, role:frontend-engineer]
 * @policyGatedActions
 *   remediation-plan-signoff (expert engineering-lead — approve the remediation plan and its
 *   priority/deadline commitments before any fix work; breakpointId===actionId; tags
 *   ['policy-gated','accessibility']),
 *   conformance-statement-publish (expert accessibility-lead — approve publishing the public
 *   WCAG conformance/VPAT statement; only raised when the conformance re-audit gate passed).
 *   Fail-closed: each executor task runs ONLY on approved===true; every outcome incl.
 *   non-interactive auto-approvals recorded in outputs.gatedActions via recordGatedAction.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  gateFixerTask,
} from '../common-utilities/routed-gate-combinators.js';

/**
 * Fail-closed audit record for one policy-gated action.
 * approved is strictly bpResult.approved === true; autoApproved is read from the
 * BreakpointResult's raw auto-approval marker fields (recorded raw — never inferred
 * from interactivity); response is bpResult.response ?? bpResult.feedback ?? null.
 * Skipped / not-required actions are recorded as
 * { required:false, approved:false, autoApproved:false, response:null, executed:false }
 * — never omitted.
 */
function recordGatedAction(actionId, required, bpResult, executed) {
  if (!required) {
    return { actionId, required: false, approved: false, autoApproved: false, response: null, executed: false };
  }
  return {
    actionId,
    required: true,
    approved: bpResult.approved === true,
    autoApproved: bpResult.autoApproved === true || bpResult.autoApprove === true,
    response: bpResult.response ?? bpResult.feedback ?? null,
    executed: executed === true,
  };
}

// ---------------------------------------------------------------------------
// Phase 1 — Audit scope definition
// ---------------------------------------------------------------------------

export const scopeDefinitionTask = defineTask('acc.scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define accessibility audit scope for ${args.target.name}`,
  agent: {
    name: 'accessibility-scoping-agent',
    prompt: {
      role: 'Accessibility audit scoper',
      task: `Build the WCAG audit plan for '${args.target.name}' at level ${args.wcagLevel}`,
      context: args,
      instructions: [
        'Enumerate every surface (pages/components) from target.surfaces — do not add or drop surfaces.',
        `Resolve the WCAG ${args.wcagLevel} success-criteria set the audit will be measured against (criteriaSet).`,
        'Define the assistive-technology matrix (screen readers, keyboard-only, zoom/contrast) to exercise; honor target.assistiveTech when provided.',
        'For each surface state the audit approach (automated axe scan + which manual checks apply).',
        'Thread priorKnowledge (known WCAG issues recalled from kip) into the plan so known issues are re-checked first.',
      ],
      outputFormat: 'JSON with surfaces array, wcagLevel, criteriaSet array, assistiveTech array, auditPlan object',
    },
    outputSchema: {
      type: 'object',
      required: ['surfaces', 'wcagLevel', 'auditPlan'],
      properties: {
        surfaces: { type: 'array', minItems: 1 },
        wcagLevel: { type: 'string' },
        criteriaSet: { type: 'array' },
        assistiveTech: { type: 'array' },
        auditPlan: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'scope'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — Parallel per-surface audit: automated axe scan + manual expert audit
// ---------------------------------------------------------------------------

export const axeScanTask = defineTask('acc.axe-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `axe scan surface ${args.surface.id} (${args.target.name})`,
  agent: {
    name: 'axe-scan-runner',
    prompt: {
      role: 'Automated axe scan runner',
      task: `Run an executed axe accessibility scan against surface '${args.surface.id}'`,
      context: args,
      instructions: [
        'EXECUTE an axe scan (axe-core / axe CLI / playwright-axe) against the surface and capture the RAW output as evidence.',
        'If the surface genuinely cannot be scanned here, record executed:false with notRunReason describing the exact environment needed — never fabricate a clean pass (no fallbacks).',
        `Map each violation to its WCAG success criteria for level ${args.wcagLevel} (wcagRefs) with impacted nodes.`,
        'evidence[] must contain raw axe output excerpts, not a summary claim.',
      ],
      outputFormat: 'JSON with surfaceId, executed boolean, tool, violations array [{id, impact, wcagRefs[], nodes[]}], evidence array of raw output excerpts, notRunReason (when executed:false)',
    },
    outputSchema: {
      type: 'object',
      required: ['surfaceId', 'executed', 'violations', 'evidence'],
      properties: {
        surfaceId: { type: 'string' },
        executed: { type: 'boolean' },
        tool: { type: 'string' },
        violations: { type: 'array' },
        evidence: { type: 'array' },
        notRunReason: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'axe', 'scan'],
}));

export const manualAuditTask = defineTask('acc.manual-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Manual WCAG audit surface ${args.surface.id} (${args.target.name})`,
  agent: {
    name: 'wcag-manual-auditor',
    prompt: {
      role: 'Manual WCAG expert auditor',
      task: `Manually audit surface '${args.surface.id}' against the WCAG ${args.wcagLevel} criteria set`,
      context: args,
      instructions: [
        'Audit the surface against the criteriaSet: keyboard operability, focus management, assistive-tech/screen-reader semantics, color contrast, forms/labels, headings/landmarks, images/alt, motion.',
        'Cite concrete evidence (DOM node, screenshot ref, observed AT behavior) per finding — uncited findings are invalid.',
        'Map each finding to a specific WCAG success criterion and level.',
        'Complement (do not duplicate) the automated axe scan: focus on what tooling cannot detect.',
      ],
      outputFormat: 'JSON with surfaceId, findings array [{wcagCriterion, level, severity, description, location, evidence}], evidence array, coverage',
    },
    outputSchema: {
      type: 'object',
      required: ['surfaceId', 'findings', 'evidence'],
      properties: {
        surfaceId: { type: 'string' },
        findings: { type: 'array' },
        evidence: { type: 'array' },
        coverage: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'manual', 'audit'],
}));

// ---------------------------------------------------------------------------
// Phase 3 — Prioritized findings register
// ---------------------------------------------------------------------------

export const findingsRegisterTask = defineTask('acc.findings-register', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consolidate findings register for ${args.target.name}`,
  agent: {
    name: 'accessibility-findings-registrar',
    prompt: {
      role: 'Findings registrar & prioritizer',
      task: `Consolidate axe + manual findings across all surfaces of '${args.target.name}' into a prioritized register`,
      context: args,
      instructions: [
        'Consolidate axe + manual findings across all surfaces, dedupe overlapping reports, and assign each finding a stable id.',
        'Map every finding to a WCAG success criterion + level and assign severity/impact.',
        'Produce a prioritized order (severity + impact first, quick wins surfaced).',
        'Every finding MUST carry an evidenceRef pointing at an executed axe scan or manual audit note — a finding without an evidenceRef is invalid.',
      ],
      outputFormat: 'JSON with findings array [{id, surfaceId, wcagCriterion, level, severity, impact, description, evidenceRef}], prioritized array, counts object',
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'prioritized', 'counts'],
      properties: {
        findings: { type: 'array' },
        prioritized: { type: 'array' },
        counts: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'findings'],
}));

// ---------------------------------------------------------------------------
// Phase 4 — Remediation plan (subject of the engineering-lead sign-off gate)
// ---------------------------------------------------------------------------

export const remediationPlanTask = defineTask('acc.remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft remediation plan for ${args.target.name}`,
  agent: {
    name: 'accessibility-remediation-planner',
    prompt: {
      role: 'Remediation planner',
      task: `Write the accessibility remediation plan for '${args.target.name}' from the prioritized findings register`,
      context: args,
      instructions: [
        `Write the remediation plan (markdown) to ${args.artifactsDir}/remediation-plan-${args.target.name}.md — it is the artifact the engineering-lead signs off.`,
        'Prioritize by severity + impact, surface quick wins, estimate effort per item, and propose deadlines.',
        'This plan and its deadline commitments are the subject of the remediation-plan-signoff policy gate — be honest about effort and scope.',
        'Map every plan item back to a finding id in the register.',
      ],
      outputFormat: 'JSON with planPath, items array, priorityOrder array, quickWins array, effortEstimate, deadlines',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'items', 'priorityOrder'],
      properties: {
        planPath: { type: 'string' },
        items: { type: 'array' },
        priorityOrder: { type: 'array' },
        quickWins: { type: 'array' },
        effortEstimate: { type: 'object' },
        deadlines: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'remediation', 'plan'],
}));

// ---------------------------------------------------------------------------
// Phase 5 — Remediation implementation (runs only on approved plan)
// ---------------------------------------------------------------------------

export const remediationImplementationTask = defineTask('acc.remediation-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement accessibility fixes for ${args.target.name}`,
  agent: {
    name: 'accessibility-remediation-engineer',
    prompt: {
      role: 'Accessibility remediation engineer',
      task: `Implement the APPROVED accessibility fixes for '${args.target.name}'`,
      context: args,
      instructions: [
        'Implement fixes per the APPROVED prioritized register only (contrast, alt text, focus styles, ARIA, keyboard nav, form labels, heading structure, landmarks, skip links, reduced motion).',
        'Report what changed per finding (findingId, change, files[]); do not claim a fix without a concrete code change.',
        'List any findings deliberately deferred in remainingFindings with an explicit reason — never silently drop a finding.',
        'Runs only after the remediation-plan-signoff breakpoint approved; honor approver edits to scope/priority carried in the approval response.',
      ],
      outputFormat: 'JSON with implementedFixes array [{findingId, change, files[]}], remainingFindings array, artifacts array',
    },
    outputSchema: {
      type: 'object',
      required: ['implementedFixes', 'remainingFindings', 'artifacts'],
      properties: {
        implementedFixes: { type: 'array' },
        remainingFindings: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'remediation', 'implementation'],
}));

// ---------------------------------------------------------------------------
// Phase 7 — Regression-guard capture (jest-axe / playwright-axe + CI)
// ---------------------------------------------------------------------------

export const regressionGuardTask = defineTask('acc.regression-guard-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture accessibility regression guards for ${args.target.name}`,
  agent: {
    name: 'accessibility-regression-guard',
    prompt: {
      role: 'Accessibility regression-guard author',
      task: `Write regression tests covering the fixed findings for '${args.target.name}' and wire them into CI`,
      context: args,
      instructions: [
        'Write jest-axe / playwright-axe regression tests covering every fixed finding so remediated criteria cannot silently regress.',
        'Wire the tests into CI (report ciWired and where they run).',
        'Map each test back to the findingId it guards (findingId, testPath, tool).',
        'Report captured:false honestly if a guard genuinely cannot be authored for a finding — never claim coverage that does not exist.',
      ],
      outputFormat: 'JSON with captured boolean, tests array [{findingId, testPath, tool}], ciWired boolean, artifacts array',
    },
    outputSchema: {
      type: 'object',
      required: ['captured', 'tests', 'ciWired', 'artifacts'],
      properties: {
        captured: { type: 'boolean' },
        tests: { type: 'array' },
        ciWired: { type: 'boolean' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'regression', 'testing'],
}));

// ---------------------------------------------------------------------------
// Phase 8 — Conformance/VPAT statement draft + policy-gated publish
// ---------------------------------------------------------------------------

export const conformanceStatementDraftTask = defineTask('acc.conformance-statement-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft WCAG conformance statement for ${args.target.name}`,
  agent: {
    name: 'conformance-statement-author',
    prompt: {
      role: 'WCAG conformance/VPAT statement author',
      task: `Draft the public WCAG conformance / VPAT statement for '${args.target.name}'`,
      context: args,
      instructions: [
        `Write the conformance / VPAT statement (markdown) to ${args.artifactsDir}/conformance-statement-${args.target.name}.md.`,
        'Claim ONLY the conformance the PASSED re-audit gate evidence substantiates — every claim must trace to executed re-scan evidence in the gate result.',
        'List known limitations and remaining findings honestly as caveats.',
        'This draft is the subject of the conformance-statement-publish policy gate — do not overstate the conformance level.',
      ],
      outputFormat: 'JSON with statementPath, level, claims array, caveats array',
    },
    outputSchema: {
      type: 'object',
      required: ['statementPath', 'level'],
      properties: {
        statementPath: { type: 'string' },
        level: { type: 'string' },
        claims: { type: 'array' },
        caveats: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'conformance', 'statement'],
}));

export const publishConformanceStatementTask = defineTask('acc.publish-conformance-statement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish approved conformance statement for ${args.target.name}`,
  agent: {
    name: 'conformance-statement-publisher',
    prompt: {
      role: 'Conformance statement publisher',
      task: `Publish the HUMAN-APPROVED conformance statement for '${args.target.name}'`,
      context: args,
      instructions: [
        'Move/copy the HUMAN-APPROVED conformance statement to the published path (applying approver edits verbatim); report publishedPath.',
        'Runs ONLY after the conformance-statement-publish breakpoint approved — never restate or re-decide the approval.',
      ],
      outputFormat: 'JSON with published boolean, publishedPath',
    },
    outputSchema: {
      type: 'object',
      required: ['published', 'publishedPath'],
      properties: {
        published: { type: 'boolean' },
        publishedPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'acc', 'accessibility', 'policy-gated', 'conformance'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    target,
    wcagLevel = 'AA',
    repoRoot = '.',
    artifactsDir: artifactsDirInput,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // No fallbacks: a target with an empty/absent surfaces[] is not workable — throw
  // before any work rather than invent a default surface.
  if (!target || !target.name) {
    throw new Error('accessibility/wcag-audit-remediation requires target with at least { name, surfaces }.');
  }
  if (!Array.isArray(target.surfaces) || target.surfaces.length === 0) {
    throw new Error(
      `accessibility/wcag-audit-remediation requires target.surfaces to be a non-empty array (got ${JSON.stringify(target.surfaces)}) — no default surface is applied.`
    );
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifactsDir = artifactsDirInput ?? ctx.artifactsDir;
  const assistiveTech = Array.isArray(target.assistiveTech) ? target.assistiveTech : [];
  const sharedArgs = { target, wcagLevel, repoRoot, kipDir, kipModel, artifactsDir };

  // Fail-closed audit surface — every policy-gated action lands here, including
  // skipped / not-required gates and non-interactive auto-approvals. Never omitted.
  const gatedActions = {
    remediationPlanSignoff: recordGatedAction('remediation-plan-signoff', false, null, false),
    conformanceStatementPublish: recordGatedAction('conformance-statement-publish', false, null, false),
  };

  // Phase 0 — kip recall of known accessibility issues (gated on kipEnabled).
  // Empty store = fresh brain, reported storeInitialized, never an error.
  ctx.log?.('info', 'Phase 0: kip recall of known accessibility issues');
  const surfaceIds = target.surfaces.map((s) => s.id).join(', ');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'accessibility',
      topic: `known WCAG issues for ${target.name}: surfaces ${surfaceIds}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — audit scope definition (no breakpoint; sparse).
  ctx.log?.('info', 'Phase 1: audit scope definition');
  const scope = await ctx.task(scopeDefinitionTask, { ...sharedArgs, assistiveTech, priorKnowledge });
  timings.scope = ctx.now() - startTime;

  // Phase 2 — parallel per-surface audit: for each surface fan out TWO tasks
  // concurrently (executed axe scan + manual expert audit) over the flattened
  // surface x {scan,audit} list. No fallbacks: an unscannable surface records
  // executed:false with a reason, never a fabricated pass.
  ctx.log?.('info', 'Phase 2: parallel per-surface WCAG audit (ctx.parallel.all)');
  const auditArgs = { ...sharedArgs, scope, criteriaSet: scope.criteriaSet, assistiveTech, priorKnowledge };
  const surfaceTaskList = [];
  for (const surface of target.surfaces) {
    surfaceTaskList.push(() => ctx.task(axeScanTask, { ...auditArgs, surface }));
    surfaceTaskList.push(() => ctx.task(manualAuditTask, { ...auditArgs, surface }));
  }
  const surfaceResults = await ctx.parallel.all(surfaceTaskList);
  const audits = target.surfaces.map((surface, i) => ({
    surfaceId: surface.id,
    axeScan: surfaceResults[i * 2],
    manualAudit: surfaceResults[i * 2 + 1],
  }));
  timings.audit = ctx.now() - startTime;

  // Phase 3 — prioritized findings register.
  ctx.log?.('info', 'Phase 3: prioritized findings register');
  const findingsRegister = await ctx.task(findingsRegisterTask, { ...sharedArgs, scope, audits, priorKnowledge });
  timings.findingsRegister = ctx.now() - startTime;

  // Phase 4 — remediation plan + policy-gated engineering-lead sign-off. The
  // implementation executor runs ONLY on approved===true; a rejection ends the
  // run with success:false BEFORE any fix work.
  ctx.log?.('info', 'Phase 4: remediation plan + policy-gated sign-off');
  const remediationPlan = await ctx.task(remediationPlanTask, { ...sharedArgs, findingsRegister, scope });
  const signoffApproval = await routedBreakpoint(ctx, {
    question: `Approve the remediation plan for '${target.name}' and its priority/deadline commitments? Fixes run only on approval; rejection ends the run before any fix work.`,
    title: 'Remediation plan sign-off',
    context: {
      runId: ctx.runId,
      files: [{ path: remediationPlan.planPath, label: 'Remediation plan' }],
      summary: {
        counts: findingsRegister.counts,
        priorityOrder: remediationPlan.priorityOrder,
        quickWins: remediationPlan.quickWins,
        deadlines: remediationPlan.deadlines,
      },
    },
  }, {
    breakpointId: 'remediation-plan-signoff',
    expert: 'engineering-lead',
    tags: ['policy-gated', 'accessibility'],
    strategy: 'single',
  });
  breakpointsHit.push('remediation-plan-signoff');
  gatedActions.remediationPlanSignoff = recordGatedAction('remediation-plan-signoff', true, signoffApproval, false);
  timings.signoff = ctx.now() - startTime;

  if (signoffApproval.approved !== true) {
    // Fail closed: a rejected sign-off means NO fix work — implementation, the
    // conformance gate, and every statement phase never run.
    return {
      success: false,
      scope,
      priorKnowledge,
      audits,
      findingsRegister,
      remediationPlan,
      remediation: null,
      conformanceGate: null,
      regressionGuard: null,
      conformanceStatement: null,
      gatedActions,
      kipFactsAsserted: 0,
      artifacts: [remediationPlan.planPath],
      metadata: {
        processId: 'accessibility/wcag-audit-remediation',
        runId: ctx.runId,
        targetName: target.name,
        breakpointsHit,
        timings,
        reason: 'Remediation-plan sign-off rejected — no fix work runs on a rejected plan',
      },
    };
  }

  // Phase 5 — remediation implementation (guarded by the approved plan).
  ctx.log?.('info', 'Phase 5: remediation implementation');
  const remediation = await ctx.task(remediationImplementationTask, {
    ...sharedArgs,
    findingsRegister,
    remediationPlan,
    approvalResponse: signoffApproval.response ?? signoffApproval.feedback ?? null,
  });
  timings.remediation = ctx.now() - startTime;

  // Phase 6 — adversarial WCAG conformance re-audit gate. Critics are independent
  // from the implementer and MUST RE-RUN axe on each remediated surface and
  // re-perform the manual checks, citing the EXECUTED re-scan output as evidence.
  // IRON LAW: evidence must include at least one executed axe re-scan per remediated
  // surface; passed:true with empty evidence is a protocol failure (combinator-enforced).
  ctx.log?.('info', 'Phase 6: adversarial WCAG conformance re-audit gate');
  const conformanceGate = await adversarialGate(ctx, {
    gateId: 'accessibility.conformance-reaudit',
    artifact: {
      path: remediationPlan.planPath,
      description: `Remediated surfaces for ${target.name} + remediation report`,
    },
    critics: [
      {
        name: 'wcag-conformance-critic',
        role: 'Adversarial WCAG conformance reviewer',
        focus: 'every register finding is actually fixed at its WCAG criterion on the remediated surface',
        instructions: [
          'IRON LAW: do NOT trust the remediation report. RE-RUN axe on each remediated surface yourself and cite the raw re-scan output as evidence; a review that only reads the diff is invalid.',
          'Confirm each prioritized finding is resolved at its success criterion and no new violation was introduced.',
          'Any finding without an executed re-scan proving resolution is an issue, not a pass.',
        ],
      },
      {
        name: 'assistive-tech-critic',
        role: 'Adversarial assistive-technology reviewer',
        focus: 'keyboard, focus order, and screen-reader semantics on the remediated surfaces',
        instructions: [
          'Re-perform the manual keyboard/AT checks on each remediated surface and cite the observed behavior as evidence.',
          'Verify ARIA/semantics/labels changes did not break name/role/value or focus management.',
        ],
      },
    ],
    ironLaw: [
      'Evidence must include at least one EXECUTED axe re-scan per remediated surface — file-read/diff citations alone do not satisfy this gate.',
      'passed:true with an empty evidence array is a protocol failure (combinator-enforced).',
    ],
    maxFixAttempts,
    fixer: { task: gateFixerTask }, // built-in fixer, referenced explicitly — it edits the remediation
    context: { target, wcagLevel, findingsRegister, remediation, audits },
  });
  if (conformanceGate.escalated) {
    // The escalation breakpoint is raised internally by the combinator.
    breakpointsHit.push('accessibility.conformance-reaudit.gate-escalation');
  }
  timings.conformanceGate = ctx.now() - startTime;

  if (!conformanceGate.passed) {
    // Fail closed: a failed gate (incl. rejected escalation) ends the run BEFORE
    // any regression guard, statement draft, or publish. No publish on an unproven
    // surface. Assert nothing — the outcome is not durable knowledge yet.
    return {
      success: false,
      scope,
      priorKnowledge,
      audits,
      findingsRegister,
      remediationPlan,
      remediation,
      conformanceGate,
      regressionGuard: null,
      conformanceStatement: null,
      gatedActions,
      kipFactsAsserted: 0,
      artifacts: [remediationPlan.planPath, ...(remediation.artifacts ?? [])],
      metadata: {
        processId: 'accessibility/wcag-audit-remediation',
        runId: ctx.runId,
        targetName: target.name,
        breakpointsHit,
        timings,
        reason: 'Conformance re-audit gate failed (incl. escalation) — no statement drafted or published on an unproven surface',
      },
    };
  }

  // Phase 7 — regression-guard capture so fixed findings cannot silently regress.
  ctx.log?.('info', 'Phase 7: regression-guard capture');
  const regressionGuard = await ctx.task(regressionGuardTask, {
    ...sharedArgs,
    findingsRegister,
    remediation,
    conformanceGate,
  });
  timings.regressionGuard = ctx.now() - startTime;

  // Phase 8 — conformance/VPAT statement draft + policy-gated publish. The gate
  // passed, so a statement is required: draft it, raise the accessibility-lead
  // publish breakpoint, and run the publisher ONLY on approved===true.
  ctx.log?.('info', 'Phase 8: conformance statement draft + policy-gated publish');
  const statementRequired = conformanceGate.passed === true;
  const statementDraft = await ctx.task(conformanceStatementDraftTask, {
    ...sharedArgs,
    findingsRegister,
    conformanceGate,
    regressionGuard,
  });
  const publishApproval = await routedBreakpoint(ctx, {
    question: `Publish the public WCAG conformance/VPAT statement for '${target.name}' at level ${statementDraft.level}? Edits in your response supersede the draft verbatim. Rejection leaves the draft unpublished.`,
    title: 'Publish conformance statement',
    context: {
      runId: ctx.runId,
      files: [{ path: statementDraft.statementPath, label: 'Conformance statement draft' }],
      summary: {
        level: statementDraft.level,
        claims: statementDraft.claims,
        caveats: statementDraft.caveats,
        conformanceGate: { passed: conformanceGate.passed, attempts: conformanceGate.attempts, escalated: conformanceGate.escalated },
      },
    },
  }, {
    breakpointId: 'conformance-statement-publish',
    expert: 'accessibility-lead',
    tags: ['policy-gated', 'accessibility'],
    strategy: 'single',
  });
  breakpointsHit.push('conformance-statement-publish');
  let publishExecution = null;
  if (publishApproval.approved === true) {
    publishExecution = await ctx.task(publishConformanceStatementTask, {
      ...sharedArgs,
      statementDraft,
      approvalResponse: publishApproval.response ?? publishApproval.feedback ?? null,
    });
  }
  gatedActions.conformanceStatementPublish = recordGatedAction(
    'conformance-statement-publish', true, publishApproval, publishExecution ? publishExecution.published === true : false
  );
  const conformanceStatement = {
    statementPath: statementDraft.statementPath,
    level: statementDraft.level,
    published: publishExecution ? publishExecution.published === true : false,
  };
  timings.statement = ctx.now() - startTime;

  // Phase 9 — kip assert of findings + remediation outcomes at close. Assert
  // failures are reported by the librarian task, never swallowed.
  ctx.log?.('info', 'Phase 9: kip assert of findings + remediation outcomes');
  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const perSurfaceFacts = audits.map((a) => ({
      subject: `surface:${a.surfaceId}`,
      predicate: 'conformance-outcome',
      object: 'accessibility.conformance-reaudit',
      props: {
        passed: conformanceGate.passed === true,
        wcagLevel,
        remainingFindings: (remediation.remainingFindings ?? []).length,
      },
    }));
    const capture = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'accessibility',
      facts: [
        ...perSurfaceFacts,
        {
          subject: `target:${target.name}`,
          predicate: 'audited-against',
          object: wcagLevel,
          props: {
            surfaceCount: target.surfaces.length,
            findingsTotal: (findingsRegister.findings ?? []).length,
            prioritizedTop: (findingsRegister.prioritized ?? []).slice(0, 5),
          },
        },
        {
          subject: `target:${target.name}`,
          predicate: 'remediation-outcome',
          object: remediationPlan.planPath,
          props: {
            implementedCount: (remediation.implementedFixes ?? []).length,
            remainingCount: (remediation.remainingFindings ?? []).length,
            signedOff: gatedActions.remediationPlanSignoff.approved === true,
          },
        },
        {
          subject: `target:${target.name}`,
          predicate: 'gate-outcome',
          object: 'accessibility.conformance-reaudit',
          props: {
            passed: conformanceGate.passed === true,
            attempts: conformanceGate.attempts,
            escalated: conformanceGate.escalated === true,
          },
        },
        {
          subject: `target:${target.name}`,
          predicate: 'conformance-statement-decision',
          object: conformanceStatement.statementPath,
          props: { published: conformanceStatement.published, level: conformanceStatement.level },
        },
      ],
    });
    kipFactsAsserted = capture.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  const artifacts = [remediationPlan.planPath];
  artifacts.push(...(remediation.artifacts ?? []));
  artifacts.push(...(regressionGuard.artifacts ?? []));
  artifacts.push(statementDraft.statementPath);
  if (publishExecution?.publishedPath) artifacts.push(publishExecution.publishedPath);

  return {
    success:
      conformanceGate.passed === true &&
      gatedActions.remediationPlanSignoff.approved === true &&
      (!statementRequired ||
        gatedActions.conformanceStatementPublish.approved === gatedActions.conformanceStatementPublish.executed) &&
      regressionGuard.captured === true,
    scope,
    priorKnowledge,
    audits,
    findingsRegister,
    remediationPlan,
    remediation,
    conformanceGate,
    regressionGuard,
    conformanceStatement,
    gatedActions,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'accessibility/wcag-audit-remediation',
      runId: ctx.runId,
      targetName: target.name,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
    },
  };
}
