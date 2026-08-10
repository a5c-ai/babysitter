/**
 * @process methodologies/composition-legacy-modernization
 * @description Backlog Example 4: legacy banking monolith -> microservices, composing Event
 *   Storming discovery -> DDD bounded contexts -> FDD per-context feature builds (ctx.parallel)
 *   -> sequential inline Strangler Fig cutover slices with executed parity gates -> RUP
 *   phase-gate governance.
 * @inputs { systemName: string, legacyDescription: string, domainExperts?: string[], zeroDowntimeRequired?: boolean, maxParallelContexts?: number, maxFixAttempts?: number, kipDir?: string, kipModel?: string }
 * @outputs { success: boolean, systemName: string, boundedContexts: array, sliceHistory: array, halted: object|null, report: object }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:legacy-modernization]
 *   workflows: [workflow:brownfield-migration, workflow:release-management]
 *   topics: [topic:strangler-fig, topic:domain-driven-design]
 *   roles: [role:tech-lead, role:architect]
 * @policyGatedActions
 *   - actionId: cutover-slice-approval
 *     description: Approve routing production traffic from legacy to a new service slice
 *     expert: modernization-lead
 *     breakpointIdPattern: cutover-slice-approval.<sliceId> (per-slice-unique)
 *   - actionId: legacy-decommission
 *     description: Retire a legacy component after parity verification
 *     expert: modernization-lead
 *     breakpointIdPattern: legacy-decommission.<sliceId> (per-slice-unique)
 *   - actionId: phase-gate-signoff
 *     description: RUP phase-boundary go/no-go sign-off
 *     expert: program-sponsor
 *     breakpointIdPattern: phase-gate-signoff.<inception|elaboration|construction|transition>
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../specializations/common-utilities/routed-gate-combinators.js';

// Ingredient: Event Storming — big-picture discovery over the legacy system.
import {
  bigPictureStormingTask,
  processModelingTask,
  contextMappingTask,
} from '../event-storming/event-storming.js';

// Ingredient: DDD — strategic design of bounded contexts and the context map.
import {
  identifySubdomainsTask,
  defineBoundedContextsTask,
  createContextMapTask,
  buildUbiquitousLanguageTask,
  identifyDomainEventsTask,
} from '../domain-driven-design/domain-driven-design.js';

// Ingredient: FDD — per-context feature decomposition and delivery cadence.
import {
  developOverallModelTask,
  buildFeaturesListTask,
  planByFeatureTask,
  designByFeatureTask,
  buildByFeatureTask,
} from '../feature-driven-development/feature-driven-development.js';

// Ingredient: RUP — phase-gate governance (Inception/Elaboration/Construction/Transition).
import {
  createVisionDocumentTask,
  createBusinessCaseTask,
  assessRisksTask,
  defineArchitectureTask,
  refineProjectPlanTask,
} from '../rup/rup.js';

// NOTE: the Strangler Fig cutover pattern is modeled INLINE in this module via the
// clm.cutover.* / clm.parity.* / clm.decommission.* tasks below. There is NO
// ../strangler-fig/ ingredient directory — never reference one.

const CONTEXT_MAP_ARTIFACT_PATH = 'artifacts/composition-legacy-modernization/context-map-and-acl-plan.md';

/**
 * Composition: Legacy Modernization process.
 *
 * Phases:
 *   P0 kip recall (composition-pattern facts, prior handoff lessons)
 *   P1 RUP Inception + Event Storming big-picture discovery -> phase-gate-signoff.inception
 *   P2 DDD bounded contexts + context map + ACL plan -> adversarial context-map gate -> phase-gate-signoff.elaboration
 *   P3 FDD feature decomposition per context -> cutover slice plan (risk-ascending sliceSpecs)
 *   P4 Parallel bounded-context feature builds (chunked by maxParallelContexts) -> phase-gate-signoff.construction
 *   P5 STRICTLY SEQUENTIAL Strangler Fig cutover slices (parity gate BEFORE cutover approval;
 *      guarded cutover/decommission executors; rejection = explicit halt, never a skip)
 *   P6 RUP Transition close-out -> phase-gate-signoff.transition -> kip assert
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.systemName - Legacy system name (e.g. 'core-banking')
 * @param {string} inputs.legacyDescription - Monolith overview, tech stack, constraints
 * @param {string[]} [inputs.domainExperts=[]] - Domain experts participating in discovery
 * @param {boolean} [inputs.zeroDowntimeRequired=true] - Whether cutovers must be zero-downtime
 * @param {number} [inputs.maxParallelContexts=3] - Parallel context-build chunk size
 * @param {number} [inputs.maxFixAttempts=2] - Adversarial-gate fix budget
 * @param {string} [inputs.kipDir='.a5c/kip'] - kip store directory
 * @param {string} [inputs.kipModel='sonnet'] - Model for structured kip paths
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with slice history and halt record (if any)
 */
export async function process(inputs, ctx) {
  const {
    systemName,
    legacyDescription,
    domainExperts = [],
    zeroDowntimeRequired = true,
    maxParallelContexts = 3,
    maxFixAttempts = 2,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs;

  // No fallbacks: the two identity inputs are required.
  if (!systemName || typeof systemName !== 'string') {
    throw new Error(`composition-legacy-modernization: systemName is required (got ${JSON.stringify(systemName)})`);
  }
  if (!legacyDescription || typeof legacyDescription !== 'string') {
    throw new Error(`composition-legacy-modernization: legacyDescription is required (got ${JSON.stringify(legacyDescription)})`);
  }

  // ==========================================================================
  // P0: KIP RECALL — thread prior composition lessons into every later task
  // ==========================================================================

  const recall = await kipRecall(ctx, {
    kipDir,
    topic: 'legacy modernization composition — ingredient interfaces, handoff patterns, strangler cutover lessons',
    kipModel,
    kind: 'methodology-composition',
  });
  const recalledInsights = recall.insights ?? [];

  // ==========================================================================
  // P1: RUP INCEPTION + EVENT STORMING BIG-PICTURE DISCOVERY
  // ==========================================================================

  const vision = await ctx.task(createVisionDocumentTask, {
    projectName: systemName,
    projectDescription: legacyDescription,
    businessContext: `Brownfield modernization of the ${systemName} legacy monolith to microservices`,
    recalledInsights,
  });

  const businessCase = await ctx.task(createBusinessCaseTask, {
    projectName: systemName,
    vision,
    projectDescription: legacyDescription,
    recalledInsights,
  });

  const risks = await ctx.task(assessRisksTask, {
    projectName: systemName,
    phase: 'inception',
    vision,
    businessCase,
    context: {
      legacyDescription,
      zeroDowntimeRequired,
    },
    recalledInsights,
  });

  const bigPicture = await ctx.task(bigPictureStormingTask, {
    projectName: systemName,
    domainDescription: legacyDescription,
    participants: domainExperts,
    existingModel: null,
    recalledInsights,
  });

  const processModels = await ctx.task(processModelingTask, {
    projectName: systemName,
    bigPicture,
    domainDescription: legacyDescription,
    recalledInsights,
  });

  const stormHandoff = await ctx.task(stormToContextsHandoffTask, {
    systemName,
    bigPicture,
    processModels,
    legacyDescription,
    recalledInsights,
  });

  const inceptionGate = await routedBreakpoint(ctx, {
    question: `RUP Inception go/no-go for the ${systemName} modernization: vision, business case, risk assessment, and big-picture storming are complete (${stormHandoff.candidateSubdomains.length} candidate subdomains, ${stormHandoff.hotspots.length} hotspots). Approve to enter Elaboration?`,
    vision,
    businessCase,
    risks,
    stormingSummary: {
      candidateSubdomains: stormHandoff.candidateSubdomains,
      hotspots: stormHandoff.hotspots,
      pivotalEvents: stormHandoff.pivotalEvents,
    },
  }, {
    breakpointId: 'phase-gate-signoff.inception',
    expert: 'program-sponsor',
    tags: ['clm', 'policy-gated', 'phase-gate-signoff'],
    strategy: 'single',
  });

  if (inceptionGate.approved !== true) {
    return haltResult(systemName, {
      stage: 'phase-gate-signoff.inception',
      breakpointId: 'phase-gate-signoff.inception',
      reason: 'Inception sign-off rejected by program-sponsor — modernization does not proceed.',
    });
  }

  // ==========================================================================
  // P2: DDD BOUNDED-CONTEXT DEFINITION + CONTEXT MAP (RUP ELABORATION)
  // ==========================================================================

  const subdomains = await ctx.task(identifySubdomainsTask, {
    projectName: systemName,
    input: stormHandoff,
    domainDescription: legacyDescription,
    recalledInsights,
  });

  const boundedContextsResult = await ctx.task(defineBoundedContextsTask, {
    projectName: systemName,
    subdomains,
    stormHandoff,
    recalledInsights,
  });
  const boundedContexts = boundedContextsResult.contexts;
  if (!Array.isArray(boundedContexts) || boundedContexts.length === 0) {
    throw new Error('composition-legacy-modernization: defineBoundedContextsTask returned no contexts — cannot modernize without bounded contexts');
  }

  const contextMap = await ctx.task(createContextMapTask, {
    projectName: systemName,
    contexts: boundedContexts,
    recalledInsights,
  });

  const eventStormContextMap = await ctx.task(contextMappingTask, {
    projectName: systemName,
    contexts: boundedContexts,
    bigPicture,
    recalledInsights,
  });

  const ubiquitousLanguage = await ctx.task(buildUbiquitousLanguageTask, {
    projectName: systemName,
    contexts: boundedContexts,
    recalledInsights,
  });

  const domainEvents = await ctx.task(identifyDomainEventsTask, {
    projectName: systemName,
    contexts: boundedContexts,
    bigPicture,
    recalledInsights,
  });

  const aclPlan = await ctx.task(legacyAclPlanTask, {
    systemName,
    contexts: boundedContexts,
    contextMap,
    eventStormContextMap,
    legacyDescription,
    artifactPath: CONTEXT_MAP_ARTIFACT_PATH,
    recalledInsights,
  });

  const architecture = await ctx.task(defineArchitectureTask, {
    projectName: systemName,
    phase: 'elaboration',
    contexts: boundedContexts,
    contextMap,
    aclPlan,
    architectureStyle: 'microservices with event-driven communication',
    recalledInsights,
  });

  const projectPlan = await ctx.task(refineProjectPlanTask, {
    projectName: systemName,
    architecture,
    risks,
    contexts: boundedContexts,
    recalledInsights,
  });

  const contextMapGate = await adversarialGate(ctx, {
    gateId: 'clm.context-map-review',
    artifact: {
      path: CONTEXT_MAP_ARTIFACT_PATH,
      description: `Context map + anti-corruption-layer plan for the ${systemName} modernization`,
    },
    critics: [
      {
        name: 'boundary-critic',
        role: 'Bounded-context boundary reviewer',
        focus: 'contexts are cohesive, no entity split across contexts without a mapped relationship',
      },
      {
        name: 'legacy-coverage-critic',
        role: 'Legacy coverage reviewer',
        focus: 'every legacy capability from the storming timeline is owned by exactly one context; ACL planned per legacy integration point',
      },
    ],
    ironLaw: [
      'Cite storming events and context-map entries by name for every claim.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      systemName,
      stormHandoff,
      contexts: boundedContexts,
      contextMap,
      aclPlans: aclPlan.aclPlans,
    },
  });

  if (contextMapGate.passed !== true) {
    return haltResult(systemName, {
      stage: 'clm.context-map-review',
      reason: 'Context-map adversarial gate failed and the escalation was rejected — boundaries are not sound enough to build on.',
      gate: {
        gateId: 'clm.context-map-review',
        attempts: contextMapGate.attempts,
        escalated: contextMapGate.escalated,
        issues: contextMapGate.issues,
      },
    });
  }

  const elaborationGate = await routedBreakpoint(ctx, {
    question: `RUP Elaboration go/no-go for ${systemName}: ${boundedContexts.length} bounded contexts defined, context map adversarially reviewed (passed in ${contextMapGate.attempts} attempt(s)), ACL planned per legacy touchpoint, architecture baselined. Approve to enter Construction?`,
    contexts: boundedContexts,
    contextMap,
    aclPlans: aclPlan.aclPlans,
    architecture,
    projectPlan,
    contextMapGate: {
      passed: contextMapGate.passed,
      attempts: contextMapGate.attempts,
      escalated: contextMapGate.escalated,
    },
  }, {
    breakpointId: 'phase-gate-signoff.elaboration',
    expert: 'program-sponsor',
    tags: ['clm', 'policy-gated', 'phase-gate-signoff'],
    strategy: 'single',
  });

  if (elaborationGate.approved !== true) {
    return haltResult(systemName, {
      stage: 'phase-gate-signoff.elaboration',
      breakpointId: 'phase-gate-signoff.elaboration',
      reason: 'Elaboration sign-off rejected by program-sponsor — construction does not start.',
    });
  }

  // ==========================================================================
  // P3: FDD FEATURE DECOMPOSITION PER CONTEXT (sequential — cheap planning)
  // ==========================================================================

  const contextPlans = [];
  for (const context of boundedContexts) {
    const overallModel = await ctx.task(developOverallModelTask, {
      projectName: systemName,
      context,
      ubiquitousLanguage,
      domainEvents,
      recalledInsights,
    });

    const featuresList = await ctx.task(buildFeaturesListTask, {
      projectName: systemName,
      context,
      overallModel,
      recalledInsights,
    });

    const featurePlan = await ctx.task(planByFeatureTask, {
      projectName: systemName,
      context,
      featuresList,
      recalledInsights,
    });

    contextPlans.push({ context, overallModel, featuresList, featurePlan });
  }

  const sliceHandoff = await ctx.task(featuresToSlicesHandoffTask, {
    systemName,
    contextPlans: contextPlans.map((p) => ({
      contextName: p.context.name,
      featuresList: p.featuresList,
      featurePlan: p.featurePlan,
    })),
    aclPlans: aclPlan.aclPlans,
    zeroDowntimeRequired,
    recalledInsights,
  });

  const sliceSpecs = sliceHandoff.sliceSpecs;
  // No fallbacks: a slice plan without executable checks is invalid, never defaulted.
  if (!Array.isArray(sliceSpecs) || sliceSpecs.length === 0) {
    throw new Error('composition-legacy-modernization: featuresToSlicesHandoffTask produced no sliceSpecs — cannot run a strangler cutover without slices');
  }
  const seenSliceIds = new Set();
  for (const slice of sliceSpecs) {
    if (!slice.id || typeof slice.id !== 'string') {
      throw new Error(`composition-legacy-modernization: slice without an id in sliceSpecs (got ${JSON.stringify(slice.id)})`);
    }
    if (seenSliceIds.has(slice.id)) {
      throw new Error(`composition-legacy-modernization: duplicate slice id "${slice.id}" — per-slice breakpointIds require unique slice ids`);
    }
    seenSliceIds.add(slice.id);
    if (!Array.isArray(slice.comparisonChecks) || slice.comparisonChecks.length === 0) {
      throw new Error(`composition-legacy-modernization: slice "${slice.id}" has no executable comparisonChecks — invalid slice, halting (no fallback)`);
    }
  }

  // ==========================================================================
  // P4: PARALLEL BOUNDED-CONTEXT FEATURE BUILDS (RUP CONSTRUCTION START)
  // ==========================================================================
  // Contexts are independent by construction (the P2 gate enforced single
  // ownership of every legacy capability), so branches share no state.
  // SPECULATIVE-SCHEDULING NOTE for orchestrators: do not co-schedule P5
  // slices against unresolved P4 branches — compose slice inputs only from
  // settled build results.

  const contextBuilds = [];
  for (let i = 0; i < contextPlans.length; i += maxParallelContexts) {
    const chunk = contextPlans.slice(i, i + maxParallelContexts);
    const chunkResults = await ctx.parallel.all(
      chunk.map((plan) => () => runContextBuild(ctx, plan, { systemName, recalledInsights }))
    );
    contextBuilds.push(...chunkResults);
  }

  const failedBuilds = contextBuilds.filter((b) => b.verification.passed !== true);
  if (failedBuilds.length > 0) {
    return haltResult(systemName, {
      stage: 'clm.build.context-verification',
      reason: `Context verification failed for ${failedBuilds.length} context(s) — cutover slices are not attempted on unverified builds.`,
      failedContexts: failedBuilds.map((b) => ({
        contextName: b.contextName,
        failures: b.verification.failures,
      })),
    });
  }

  const constructionGate = await routedBreakpoint(ctx, {
    question: `RUP Construction go/no-go for ${systemName}: all ${contextBuilds.length} bounded-context builds verified (executed test + ACL contract evidence attached). Approve to start sequential Strangler Fig cutover slices?`,
    contextVerification: contextBuilds.map((b) => ({
      contextName: b.contextName,
      passed: b.verification.passed,
      evidence: b.verification.evidence,
    })),
    slicePlan: sliceSpecs.map((s) => ({ id: s.id, contextName: s.contextName, order: s.order })),
  }, {
    breakpointId: 'phase-gate-signoff.construction',
    expert: 'program-sponsor',
    tags: ['clm', 'policy-gated', 'phase-gate-signoff'],
    strategy: 'single',
  });

  if (constructionGate.approved !== true) {
    return haltResult(systemName, {
      stage: 'phase-gate-signoff.construction',
      breakpointId: 'phase-gate-signoff.construction',
      reason: 'Construction sign-off rejected by program-sponsor — no cutover slice is attempted.',
    });
  }

  // ==========================================================================
  // P5: SEQUENTIAL STRANGLER FIG CUTOVER SLICES
  // ==========================================================================
  // STRICTLY SEQUENTIAL — a plain for...of with awaits. Do NOT restructure
  // into ctx.parallel: each slice's safety depends on the settled outcome of
  // the previous one, and speculative co-scheduling of gate attempts with
  // downstream tasks composes stale inputs.

  const sliceHistory = [];
  let halted = null;

  for (const slice of sliceSpecs) {
    // (1) Strangler facade routing seam — legacy path untouched.
    const routing = await ctx.task(prepareRoutingTask, {
      systemName,
      slice,
      zeroDowntimeRequired,
      recalledInsights,
    });

    // (2) EXECUTED old-vs-new parity comparison.
    const parity = await ctx.task(executeParityComparisonTask, {
      systemName,
      slice,
      routing,
      recalledInsights,
    });

    // (3) Adversarial parity gate — MUST pass (or be owner-approved on
    // escalation) BEFORE the cutover approval breakpoint is raised.
    const parityGate = await adversarialGate(ctx, {
      gateId: `clm.parity.${slice.id}`,
      artifact: {
        path: parity.parityReportPath,
        description: `Executed old-vs-new parity report for slice ${slice.id}`,
      },
      critics: [
        {
          name: 'parity-critic',
          role: 'Parity re-execution reviewer',
          focus: 'RE-EXECUTES a sample of comparison checks itself and verifies the report diffs are real, complete, and reproducible — executed old-vs-new evidence mandatory',
        },
        {
          name: 'risk-critic',
          role: 'Cutover risk reviewer',
          focus: 'divergence severity, rollback readiness, banking invariants (balances, idempotency, audit trail) covered by executed checks',
        },
      ],
      ironLaw: [
        'Every claim must be backed by an EXECUTED check output — file:line citations of the report plus re-run outputs.',
        'A parity report whose checks were not actually executed is an automatic FAIL.',
      ],
      maxFixAttempts,
      fixer: {},
      context: { systemName, slice, parityReportPath: parity.parityReportPath },
    });

    if (parityGate.passed !== true) {
      halted = {
        sliceId: slice.id,
        stage: 'parity-gate',
        gateId: `clm.parity.${slice.id}`,
        reason: `Parity gate for slice "${slice.id}" failed after ${parityGate.attempts} attempt(s) and escalation was rejected — the slice HALTS, no cutover approval is raised.`,
        issues: parityGate.issues,
        escalated: parityGate.escalated,
      };
      sliceHistory.push({ sliceId: slice.id, status: 'halted', halt: halted, routing, parity });
      break;
    }

    // (4) Policy-gated cutover approval — per-slice-unique breakpointId.
    const cutoverApproval = await routedBreakpoint(ctx, {
      question: `Approve routing production traffic from legacy to the new "${slice.id}" slice of ${systemName}? Parity gate passed in ${parityGate.attempts} attempt(s); rollback plan attached.`,
      slice,
      parityReport: {
        path: parity.parityReportPath,
        passed: parity.passed,
        checksExecuted: parity.checksExecuted,
        divergences: parity.divergences,
      },
      gateEvidence: parityGate.evidence,
      rollbackPlan: routing.rollbackPlan,
    }, {
      breakpointId: `cutover-slice-approval.${slice.id}`,
      expert: 'modernization-lead',
      tags: ['clm', 'policy-gated', 'cutover-slice-approval'],
      strategy: 'single',
    });

    if (cutoverApproval.approved !== true) {
      // Explicit halt — the guarded executor is NEVER invoked, the loop stops.
      // No silent skip, no fallback path.
      halted = {
        sliceId: slice.id,
        stage: 'cutover-slice-approval',
        breakpointId: `cutover-slice-approval.${slice.id}`,
        reason: `Cutover approval for slice "${slice.id}" was rejected — clm.cutover.execute was NOT invoked and the slice loop halted.`,
      };
      sliceHistory.push({ sliceId: slice.id, status: 'halted', halt: halted, routing, parity });
      break;
    }

    // (5) GUARDED cutover executor — runs only under approved === true, and
    // records the approval provenance in its output.
    const cutover = await ctx.task(executeCutoverTask, {
      systemName,
      slice,
      routing,
      approvalProvenance: {
        breakpointId: `cutover-slice-approval.${slice.id}`,
        approved: true,
        autoApproved: cutoverApproval.autoApproved === true,
      },
      recalledInsights,
    });

    // (6) Post-cutover verification against live routing.
    const postVerification = await ctx.task(postCutoverVerificationTask, {
      systemName,
      slice,
      cutover,
      recalledInsights,
    });

    if (postVerification.passed !== true) {
      halted = {
        sliceId: slice.id,
        stage: 'post-verification',
        reason: `Post-cutover verification for slice "${slice.id}" failed — the slice loop halts and the rollback plan is surfaced (the process does not auto-rollback).`,
        rollbackPlan: routing.rollbackPlan,
        checks: postVerification.checks,
      };
      sliceHistory.push({ sliceId: slice.id, status: 'halted', halt: halted, routing, parity, cutover, postVerification });
      break;
    }

    // (7) Policy-gated decommission approval — decommission NEVER auto-executes.
    const decommissionApproval = await routedBreakpoint(ctx, {
      question: `Retire the legacy code path for slice "${slice.id}" of ${systemName}? Cutover verified live; parity history attached. This is irreversible.`,
      slice,
      postVerification,
      parityHistory: {
        parityReportPath: parity.parityReportPath,
        gateAttempts: parityGate.attempts,
        gateEvidence: parityGate.evidence,
      },
    }, {
      breakpointId: `legacy-decommission.${slice.id}`,
      expert: 'modernization-lead',
      tags: ['clm', 'policy-gated', 'legacy-decommission'],
      strategy: 'single',
    });

    if (decommissionApproval.approved !== true) {
      halted = {
        sliceId: slice.id,
        stage: 'legacy-decommission',
        breakpointId: `legacy-decommission.${slice.id}`,
        reason: `Decommission approval for slice "${slice.id}" was rejected — clm.decommission.execute was NOT invoked (an unapproved decommission is a halt, not a skip).`,
      };
      sliceHistory.push({ sliceId: slice.id, status: 'halted', halt: halted, routing, parity, cutover, postVerification });
      break;
    }

    // (8) GUARDED decommission executor — approved === true only.
    const decommission = await ctx.task(executeDecommissionTask, {
      systemName,
      slice,
      approvalProvenance: {
        breakpointId: `legacy-decommission.${slice.id}`,
        approved: true,
        autoApproved: decommissionApproval.autoApproved === true,
      },
      recalledInsights,
    });

    sliceHistory.push({
      sliceId: slice.id,
      status: 'completed',
      routing,
      parity,
      parityGate: {
        passed: parityGate.passed,
        attempts: parityGate.attempts,
        escalated: parityGate.escalated,
      },
      cutover,
      postVerification,
      decommission,
    });
  }

  // ==========================================================================
  // P6: RUP TRANSITION CLOSE-OUT + KIP ASSERT
  // ==========================================================================

  const slicesCompleted = sliceHistory.filter((s) => s.status === 'completed').map((s) => s.sliceId);
  const slicesHalted = sliceHistory.filter((s) => s.status === 'halted').map((s) => s.sliceId);

  const report = await ctx.task(modernizationReportTask, {
    systemName,
    sliceHistory,
    slicesCompleted,
    slicesHalted,
    halted,
    contextBuilds: contextBuilds.map((b) => ({ contextName: b.contextName, passed: b.verification.passed })),
    recalledInsights,
  });

  const transitionGate = await routedBreakpoint(ctx, {
    question: halted === null
      ? `RUP Transition sign-off for ${systemName}: all ${slicesCompleted.length} cutover slices completed and decommissioned. Approve final go-live/close?`
      : `RUP Transition sign-off for ${systemName}: ${slicesCompleted.length} slice(s) completed, run halted at "${halted.stage}" on slice "${halted.sliceId ?? 'n/a'}". Acknowledge the partial-modernization close-out?`,
    reportPath: report.reportPath,
    slicesCompleted,
    slicesHalted,
    halted,
  }, {
    breakpointId: 'phase-gate-signoff.transition',
    expert: 'program-sponsor',
    tags: ['clm', 'policy-gated', 'phase-gate-signoff'],
    strategy: 'single',
  });

  const facts = [
    {
      subject: `process:composition-legacy-modernization:${systemName}`,
      predicate: 'handoff-storm-to-contexts',
      object: `distilled ${stormHandoff.candidateSubdomains.length} candidate subdomains into ${boundedContexts.length} bounded contexts`,
    },
    {
      subject: `process:composition-legacy-modernization:${systemName}`,
      predicate: 'handoff-features-to-slices',
      object: `derived ${sliceSpecs.length} risk-ascending cutover slices from ${contextPlans.length} FDD context plans`,
    },
    {
      subject: `process:composition-legacy-modernization:${systemName}`,
      predicate: 'context-map-gate-attempts',
      object: String(contextMapGate.attempts),
    },
    {
      subject: `process:composition-legacy-modernization:${systemName}`,
      predicate: 'slice-outcomes',
      object: `${slicesCompleted.length} completed, ${slicesHalted.length} halted${halted ? ` (halt stage: ${halted.stage})` : ''}`,
    },
  ];
  for (const entry of sliceHistory) {
    if (entry.status === 'completed') {
      facts.push({
        subject: `slice:${systemName}:${entry.sliceId}`,
        predicate: 'parity-gate-caught-divergence',
        object: entry.parity.divergences.length > 0
          ? `parity checks surfaced ${entry.parity.divergences.length} divergence(s) before cutover`
          : 'parity checks found no divergence',
      });
    }
  }

  const assertion = await kipAssert(ctx, {
    kipDir,
    kipModel,
    kind: 'methodology-composition',
    facts,
  });

  return {
    success: halted === null,
    systemName,
    boundedContexts,
    contextMap,
    aclPlans: aclPlan.aclPlans,
    sliceSpecs,
    sliceHistory,
    slicesCompleted,
    slicesHalted,
    halted,
    report,
    transitionApproved: transitionGate.approved === true,
    kip: { recalled: recall.factCount, asserted: assertion.asserted },
    metadata: {
      processId: 'methodologies/composition-legacy-modernization',
      ingredients: ['event-storming', 'domain-driven-design', 'feature-driven-development', 'rup', 'strangler-fig (inline)'],
    },
  };
}

/**
 * Explicit halt result — a rejected gate or failed verification stops the
 * process with a record, never a silent skip or fallback path.
 */
function haltResult(systemName, halted) {
  return {
    success: false,
    systemName,
    halted,
    sliceHistory: [],
    slicesCompleted: [],
    slicesHalted: [],
    metadata: {
      processId: 'methodologies/composition-legacy-modernization',
      haltedAt: halted.stage,
    },
  };
}

/**
 * Per-context build branch (P4): FDD design-by-feature -> build-by-feature for
 * every planned feature, then executed context verification. Contexts are
 * independent (P2 gate enforced ownership), so branches share no state.
 */
async function runContextBuild(ctx, plan, { systemName, recalledInsights }) {
  const contextName = plan.context.name;
  const featureSets = plan.featuresList.featureSets ?? [];
  const features = featureSets.flatMap((set) => set.features ?? []);

  const featureResults = [];
  for (const feature of features) {
    const design = await ctx.task(designByFeatureTask, {
      projectName: systemName,
      context: plan.context,
      feature,
      overallModel: plan.overallModel,
      recalledInsights,
    });
    const build = await ctx.task(buildByFeatureTask, {
      projectName: systemName,
      context: plan.context,
      feature,
      design,
      recalledInsights,
    });
    featureResults.push({ featureId: feature.id, design, build });
  }

  const verification = await ctx.task(contextVerificationTask, {
    systemName,
    contextName,
    featureResults: featureResults.map((f) => f.featureId),
    recalledInsights,
  });

  return { contextName, featureResults, verification };
}

// ============================================================================
// TASK DEFINITIONS — Style-A factories, agent-only (no shell subtasks), every
// outputSchema carries mandatory evidence (array of strings, minItems 1).
// ============================================================================

const EVIDENCE_SCHEMA = { type: 'array', items: { type: 'string' }, minItems: 1 };

export const stormToContextsHandoffTask = defineTask('clm.handoff.storm-to-contexts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Storm-to-contexts handoff: ${args.systemName}`,
  agent: {
    name: 'domain-synthesis-analyst',
    prompt: {
      role: 'Domain synthesis analyst',
      task: `Distill the big-picture event storming output for ${args.systemName} into DDD-ready candidate subdomains`,
      context: args,
      instructions: [
        'Distill the big-picture storming output (events timeline, hotspots, pivotal events) into DDD-ready candidate subdomains.',
        'Every candidate subdomain must cite the storming events that justify it — those citations are your evidence.',
        'Carry hotspots and pivotal events forward verbatim so strategic design can prioritize them.',
        'Do not invent subdomains that no storming event supports.',
      ],
      outputFormat: 'JSON with candidateSubdomains array [{name, description, justifyingEvents[]}], hotspots array, pivotalEvents array, evidence array of strings (storming-event citations)',
    },
    outputSchema: {
      type: 'object',
      required: ['candidateSubdomains', 'hotspots', 'pivotalEvents', 'evidence'],
      properties: {
        candidateSubdomains: { type: 'array' },
        hotspots: { type: 'array' },
        pivotalEvents: { type: 'array' },
        evidence: EVIDENCE_SCHEMA,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clm', 'handoff', 'discovery'],
}));

export const legacyAclPlanTask = defineTask('clm.design.legacy-acl-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Legacy ACL plan: ${args.systemName}`,
  agent: {
    name: 'integration-architect',
    prompt: {
      role: 'Integration architect',
      task: `Plan an anti-corruption layer per bounded context of ${args.systemName} against the legacy monolith`,
      context: args,
      instructions: [
        'For every bounded context, plan an anti-corruption layer against the legacy monolith: legacy touchpoints, translation model, risk notes.',
        'Cite context-map relationships and legacy touchpoints by name — those citations are your evidence.',
        `Write the combined context-map + ACL plan artifact to ${args.artifactPath} (this exact path — the adversarial gate reviews it).`,
        'A context with legacy touchpoints but no ACL plan is a defect, not an option.',
      ],
      outputFormat: 'JSON with aclPlans array [{contextName, legacyTouchpoints[], translationModel, riskNotes}] and evidence array of strings',
    },
    outputSchema: {
      type: 'object',
      required: ['aclPlans', 'evidence'],
      properties: {
        aclPlans: { type: 'array' },
        evidence: EVIDENCE_SCHEMA,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clm', 'design', 'acl'],
}));

export const featuresToSlicesHandoffTask = defineTask('clm.handoff.features-to-slices', (args, taskCtx) => ({
  kind: 'agent',
  title: `Features-to-slices handoff: ${args.systemName}`,
  agent: {
    name: 'migration-planner',
    prompt: {
      role: 'Migration planner',
      task: `Derive risk-ascending sequential Strangler Fig cutover slices for ${args.systemName} from the FDD feature plans`,
      context: args,
      instructions: [
        'Derive an ordered, risk-ascending list of cutover slices from the FDD feature plans — each slice is one bounded context or a coherent capability group.',
        'Every slice must define: id (kebab-case, unique), contextName, capabilities, legacyTouchpoints, routingSeam, comparisonChecks, rollbackTrigger, order.',
        'Every comparisonCheck must be an EXECUTABLE check spec: input corpus, invariants, tolerance. A slice without executable checks is invalid — do not emit it.',
        'Order slices lowest-risk first so early cutovers derisk later ones.',
        'Cite the feature plans and ACL entries each slice derives from — those citations are your evidence.',
      ],
      outputFormat: 'JSON with sliceSpecs array [{id, contextName, capabilities[], legacyTouchpoints[], routingSeam, comparisonChecks[] (each {name, inputCorpus, invariants[], tolerance}), rollbackTrigger, order}] and evidence array of strings',
    },
    outputSchema: {
      type: 'object',
      required: ['sliceSpecs', 'evidence'],
      properties: {
        sliceSpecs: { type: 'array' },
        evidence: EVIDENCE_SCHEMA,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clm', 'handoff', 'slice-planning'],
}));

export const contextVerificationTask = defineTask('clm.build.context-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Context verification: ${args.contextName}`,
  agent: {
    name: 'verification-engineer',
    prompt: {
      role: 'Verification engineer',
      task: `Execute the ${args.contextName} context's test suite and ACL contract checks`,
      context: args,
      instructions: [
        'EXECUTE the context\'s tests and ACL contract checks — actually run them.',
        'Evidence must be executed command outputs, not readings or predictions.',
        'Report passed=false with the concrete failures if anything fails — never soften.',
      ],
      outputFormat: 'JSON with passed boolean, failures array, evidence array of strings (executed command outputs)',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'failures', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        failures: { type: 'array' },
        evidence: EVIDENCE_SCHEMA,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clm', 'build', 'verification'],
}));

export const prepareRoutingTask = defineTask('clm.cutover.prepare-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare routing seam: ${args.slice.id}`,
  agent: {
    name: 'strangler-facade-engineer',
    prompt: {
      role: 'Strangler facade engineer',
      task: `Implement the strangler facade routing seam for slice ${args.slice.id} of ${args.systemName}`,
      context: args,
      instructions: [
        'Implement (or concretely describe) the routing seam for this slice: shadow-traffic capable, with the legacy path fully intact and untouched.',
        'Produce an explicit rollback plan — flipping back must be a documented, executable step.',
        'Evidence must show the seam exists (executed checks, file citations), not that it is planned.',
      ],
      outputFormat: 'JSON with routingArtifact (path or description), shadowCapable boolean, rollbackPlan object, evidence array of strings',
    },
    outputSchema: {
      type: 'object',
      required: ['routingArtifact', 'shadowCapable', 'rollbackPlan', 'evidence'],
      properties: {
        routingArtifact: {},
        shadowCapable: { type: 'boolean' },
        rollbackPlan: {},
        evidence: EVIDENCE_SCHEMA,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clm', 'cutover', 'routing'],
}));

export const executeParityComparisonTask = defineTask('clm.parity.execute-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute parity comparison: ${args.slice.id}`,
  agent: {
    name: 'parity-verification-engineer',
    prompt: {
      role: 'Parity verification engineer',
      task: `EXECUTE every comparisonCheck of slice ${args.slice.id} through both the legacy and new paths`,
      context: args,
      instructions: [
        'EXECUTE every comparisonCheck in the slice spec through BOTH the legacy and new paths — replayed representative requests/transactions.',
        'Record raw outputs and diffs (responses, side-effects, ledger/balance invariants) in the parity report artifact and return its path.',
        'passed=false on ANY unexplained divergence.',
        'Never simulate or infer results — executed outputs only (no fallbacks).',
      ],
      outputFormat: 'JSON with parityReportPath string, checksExecuted array (one entry per executed check), divergences array, passed boolean, evidence array of strings (raw executed outputs/diffs)',
    },
    outputSchema: {
      type: 'object',
      required: ['parityReportPath', 'checksExecuted', 'divergences', 'passed', 'evidence'],
      properties: {
        parityReportPath: { type: 'string' },
        checksExecuted: { type: 'array', minItems: 1 },
        divergences: { type: 'array' },
        passed: { type: 'boolean' },
        evidence: EVIDENCE_SCHEMA,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clm', 'parity'],
}));

export const executeCutoverTask = defineTask('clm.cutover.execute', (args, taskCtx) => {
  // GUARD: this executor is only ever invoked when the per-slice
  // cutover-slice-approval breakpoint resolved approved === true. The build
  // itself re-asserts that invariant — an unapproved build is a bug upstream.
  if (!args.approvalProvenance || args.approvalProvenance.approved !== true) {
    throw new Error(`clm.cutover.execute invoked without approved===true provenance for slice ${args.slice?.id} — refusing to build (guarded executor)`);
  }
  return {
    kind: 'agent',
    title: `Execute cutover: ${args.slice.id}`,
    agent: {
      name: 'cutover-operator',
      prompt: {
        role: 'Cutover operator',
        task: `Flip production routing from legacy to the new "${args.slice.id}" slice per the approved plan`,
        context: args,
        instructions: [
          'Flip routing to the new service exactly per the approved routing plan.',
          'Verify the flip took effect with an executed check — evidence is the executed output.',
          'Record the approval provenance from the context (breakpointId, approved, autoApproved) verbatim in approvalProvenance.',
        ],
        outputFormat: 'JSON with routingFlipped boolean, approvalProvenance object {breakpointId, approved, autoApproved}, evidence array of strings',
      },
      outputSchema: {
        type: 'object',
        required: ['routingFlipped', 'approvalProvenance', 'evidence'],
        properties: {
          routingFlipped: { type: 'boolean' },
          approvalProvenance: { type: 'object' },
          evidence: EVIDENCE_SCHEMA,
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ['agent', 'clm', 'cutover', 'policy-gated'],
  };
});

export const postCutoverVerificationTask = defineTask('clm.cutover.post-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-cutover verification: ${args.slice.id}`,
  agent: {
    name: 'post-cutover-verifier',
    prompt: {
      role: 'Post-cutover verifier',
      task: `Execute smoke and invariant re-checks against the live new path for slice ${args.slice.id}`,
      context: args,
      instructions: [
        'Execute smoke checks and invariant re-checks (balances, idempotency, audit trail) against the LIVE new routing.',
        'On any failure output passed=false — the process halts the slice loop and surfaces the rollback plan; it does not auto-rollback.',
        'Evidence must be executed check outputs.',
      ],
      outputFormat: 'JSON with passed boolean, checks array, evidence array of strings',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'checks', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        checks: { type: 'array' },
        evidence: EVIDENCE_SCHEMA,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clm', 'cutover', 'verification'],
}));

export const executeDecommissionTask = defineTask('clm.decommission.execute', (args, taskCtx) => {
  // GUARD: decommission NEVER runs without a recorded legacy-decommission
  // approval — an unapproved decommission is a halt upstream, never a skip.
  if (!args.approvalProvenance || args.approvalProvenance.approved !== true) {
    throw new Error(`clm.decommission.execute invoked without approved===true provenance for slice ${args.slice?.id} — refusing to build (guarded executor)`);
  }
  return {
    kind: 'agent',
    title: `Execute decommission: ${args.slice.id}`,
    agent: {
      name: 'decommission-engineer',
      prompt: {
        role: 'Decommission engineer',
        task: `Retire the legacy code paths and tables for slice ${args.slice.id}`,
        context: args,
        instructions: [
          'Retire the slice\'s legacy code paths and tables per the approved plan.',
          'Run the regression suite AFTER removal — executed evidence required.',
          'Record the approval provenance from the context verbatim in approvalProvenance.',
        ],
        outputFormat: 'JSON with retiredComponents array, approvalProvenance object, regressionPassed boolean, evidence array of strings (executed removal + regression outputs)',
      },
      outputSchema: {
        type: 'object',
        required: ['retiredComponents', 'approvalProvenance', 'regressionPassed', 'evidence'],
        properties: {
          retiredComponents: { type: 'array' },
          approvalProvenance: { type: 'object' },
          regressionPassed: { type: 'boolean' },
          evidence: EVIDENCE_SCHEMA,
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ['agent', 'clm', 'decommission', 'policy-gated'],
  };
});

export const modernizationReportTask = defineTask('clm.finish.modernization-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Modernization report: ${args.systemName}`,
  agent: {
    name: 'program-reporter',
    prompt: {
      role: 'Program reporter',
      task: `Aggregate the full modernization history for ${args.systemName} into a final report`,
      context: args,
      instructions: [
        'Aggregate the full slice/parity/decommission history into a final modernization report, citing artifacts by path.',
        'Include every halt record verbatim — a halted slice is a first-class outcome, not an omission.',
        'Return the written report path in reportPath.',
      ],
      outputFormat: 'JSON with reportPath string, slicesCompleted array, slicesHalted array, evidence array of strings (artifact-path citations)',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'slicesCompleted', 'slicesHalted', 'evidence'],
      properties: {
        reportPath: { type: 'string' },
        slicesCompleted: { type: 'array' },
        slicesHalted: { type: 'array' },
        evidence: EVIDENCE_SCHEMA,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'clm', 'finish', 'report'],
}));
