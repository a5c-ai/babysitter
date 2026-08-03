/**
 * @process social-sciences/empirical-study-lifecycle-workflow
 * @description End-to-end empirical social-science study lifecycle: research question and
 *   construct definition -> ctx-driven design-family selection (experimental |
 *   quasi-experimental | mixed-methods) -> parallel instrument development and validation ->
 *   adversarial design-integrity gate -> pre-registration authoring and policy-gated registry
 *   submission (the LOCK) -> ethics/IRB review with a bounded revise-and-resubmit loop that
 *   FAILS at the cap -> policy-gated participant recruitment -> parallel data-collection waves
 *   -> parallel analysis execution against the registered specifications -> pre-registration
 *   adherence check with a policy-gated amendment breakpoint -> adversarial
 *   methodological-integrity gate whose critics RE-RUN the analysis checks and EXECUTE a
 *   registered-plan-vs-analysis-run diff -> program evaluation and policy-impact assessment ->
 *   participant-data disclosure control -> policy brief and manuscript -> policy-gated
 *   publication -> deterministic kip capture (kind `empirical-study`).
 * @inputs {
 *   researchQuestion: string (required — no default question is invented),
 *   population: string (required — the target human population under study),
 *   designFamilyHint?: 'experimental'|'quasi-experimental'|'mixed-methods' (advisory only; the selection task must justify its choice),
 *   populations?: string[] (default [] — >1 entry activates the cross-cultural measurement-adaptation lane),
 *   registry?: string (default 'OSF'),
 *   outputDir?: string (default ctx.artifactsDir),
 *   maxCollectionWaves?: number (default 4),
 *   maxParallelWaves?: number (default 2, ctx.parallel.map concurrency),
 *   maxAnalysisSpecs?: number (default 6),
 *   maxParallelAnalyses?: number (default 3, ctx.parallel.map concurrency),
 *   maxIrbRounds?: number (default 3 — HARD cap; exhaustion fails the run),
 *   irbReadinessAutoApproveAfterN?: number (default 1 — internal readiness check ONLY),
 *   maxFixAttempts?: number (default 2, per adversarial gate),
 *   kipEnabled?: boolean (default true),
 *   kipDir?: string (default '.a5c/kip'),
 *   kipModel?: string (default 'sonnet'),
 *   kipReplicaId?: string (default `esl-${ctx.runId}`)
 * }
 * @outputs {
 *   success: boolean,
 *   recall: { factCount, insights, priorStudies, priorInstruments, storeInitialized },
 *   framing: { constructs, hypotheses, subQuestions, scopeBoundaries, openAmbiguities },
 *   literature: { synthesisPath, priorEffectSizes, gaps },
 *   design: { family, rationale, playbook, identificationStrategy, powerAnalysis, threatsToValidity, designSpecPath },
 *   instruments: { items: [{ instrumentId, kind, path, reliability, validityEvidence }], adaptationsApplied },
 *   designGate: { passed, attempts, escalated, issues, evidence },
 *   preregistration: { path, registeredSpecIds, locked, submitted, registryId, approval },
 *   irb: { protocolPath, rounds: [{ round, readiness, determination, revisionPath }], approved, determination, roundsUsed, exhausted, approval },
 *   recruitment: { approved, started, consentedCount, approval },
 *   collection: { waves: [{ waveName, mode, playbook, recordCount, integrityFlags }], totalRecords, datasetPath },
 *   analysis: { specs: [{ specId, method, playbook, registered, resultPath, evidence }], executedCount },
 *   adherence: { conforming: [], deviations: [], amendmentRaised, amendmentApproved, amendmentApproval, exploratoryReclassified: [] },
 *   integrityGate: { passed, attempts, escalated, issues, evidence },
 *   evaluation: { programEvaluationPath, policyImpactPath },
 *   disclosure: { cleared, reidentificationRisk, suppressedFields, disclosurePath },
 *   dissemination: { policyBriefPath, manuscriptPath, packageDir, approved, published, locations },
 *   approvals: { 'empirical-study.pre-registration-submission', 'empirical-study.irb-submission', 'empirical-study.participant-recruitment-start', 'empirical-study.analysis-plan-amendment', 'empirical-study.policy-brief-publication' } — each { approved, breakpointId, expert, response } or null when never raised,
 *   autoApprovals: Array<{ breakpointId, phase, at }> (ALWAYS present, possibly empty — fail-closed surfacing),
 *   kipFactsAsserted: number,
 *   artifacts: string[],
 *   metadata: { processId, runId, designFamily, waveCount, specCount, irbRoundsUsed, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:social-sciences]
 *   specializations: [specialization:social-sciences]
 *   skillAreas: [skill-area:statistical-analysis, skill-area:data-analysis, skill-area:user-research, skill-area:knowledge-management]
 *   topics: [topic:quality-assurance, topic:research-ethics]
 *   roles: [role:principal-investigator, role:research-engineer, role:data-analyst]
 *   workflows: [workflow:research, workflow:experiment-design, workflow:peer-review-cycle]
 * @policyGatedActions [
 *   { actionId: 'empirical-study.pre-registration-submission', description: 'Submit the pre-registration to a public registry; the timestamped analysis plan becomes permanently public and any later change is a visible amendment.', expert: 'principal-investigator' },
 *   { actionId: 'empirical-study.irb-submission', description: 'Submit the protocol to the ethics/IRB board on behalf of the institution.', expert: 'principal-investigator' },
 *   { actionId: 'empirical-study.participant-recruitment-start', description: 'Begin recruiting and consenting human participants; contact with participants cannot be undone.', expert: 'irb-liaison' },
 *   { actionId: 'empirical-study.analysis-plan-amendment', description: 'Amend the pre-registered analysis plan after data are visible; the strongest researcher-degrees-of-freedom risk in the workflow.', expert: 'principal-investigator' },
 *   { actionId: 'empirical-study.policy-brief-publication', description: 'Publish the policy brief or manuscript externally under institutional attribution.', expert: 'department-chair' }
 * ] — breakpointId equals actionId exactly, every executor is guarded by approved===true,
 *   none is ever auto-approved, and autoApproved provenance is recorded in autoApprovals.
 *
 * Breakpoints (sparse by design): the five policy-gated routed breakpoints above
 * (analysis-plan-amendment is CONDITIONAL on detected deviations; the other four are
 * unconditional lifecycle gates), plus one internal, non-policy IRB readiness check per round
 * ('empirical-study.irb-readiness-check.round-<N>', expert 'research-ethics-coordinator',
 * autoApproveAfterN applies HERE and only here), plus the combinator-internal gate escalations
 * ('esl.design-integrity.gate-escalation' / 'esl.methodological-integrity.gate-escalation',
 * expert 'owner', tags ['quality-gate','escalation',<gateId>]) that fire only when a gate's fix
 * budget is exhausted. There is deliberately NO exhaustion-escalation breakpoint on the IRB loop.
 *
 * Hard rules — NO FALLBACKS: a missing researchQuestion or population throws;
 * assertDesignFamily / assertCollectionMode / assertAnalysisMethod throw on unknown values
 * (there is no default family, mode, or method); validateWaves and validateAnalysisSpecs throw
 * rather than truncate or repair; assertIrbApproved throws before any recruitment or collection
 * task is constructed; an IRB loop that reaches maxIrbRounds without approval returns
 * success:false immediately with the full determination record and raises NO proceed-anyway
 * escalation (human-subjects protection admits no override — this is the deliberate divergence
 * from contract-lifecycle-workflow.js, which does offer a general-counsel exhaustion
 * escalation); an analysis spec absent from the locked pre-registration may NEVER be reported as
 * confirmatory; zero surviving confirmatory specs fails the run; disclosure control that reports
 * cleared!==true fails the run before the publication gate is raised; and every executor task
 * (pre-registration submit, IRB submit, recruitment start, publication) runs ONLY under
 * approved===true with no alternate path. kip facts are built DETERMINISTICALLY by the
 * orchestrator — agents never invent them.
 *
 * @composes BY NAME (playbook strings in prompts — never imported): survey-research-design.js,
 * experimental-design.js, quasi-experimental-design.js, mixed-methods-research-design.js,
 * scale-development-validation.js, cross-cultural-measurement-adaptation.js,
 * research-pre-registration.js, survey-administration.js, in-depth-interview-protocol.js,
 * focus-group-facilitation.js, ethnographic-fieldwork.js, qualitative-coding-analysis.js,
 * statistical-analysis-pipeline.js, propensity-score-analysis.js, multilevel-modeling.js,
 * program-evaluation.js, policy-impact-assessment.js, policy-brief-development.js,
 * academic-manuscript-preparation.js, literature-review-synthesis.js (20 point tasks — the 19
 * required plus literature-review-synthesis.js for the P1 literature lane).
 *
 * Boundary with the sibling flagship: library/specializations/research/research-publication-workflow.js
 * (rpw) is a SECONDARY-SOURCE pipeline whose adversarial gate RE-FETCHES every citation before a
 * cited report is published. This process (esl) is a PRIMARY-DATA human-subjects pipeline: its
 * artifacts are a study design, validated instruments, a locked pre-registration, an IRB
 * determination, participant data, and executed analyses; its gates RE-RUN analysis checks and
 * diff the registered plan against the analysis actually executed. esl does NOT re-implement
 * claim/citation re-fetch verification — its literature phase composes
 * literature-review-synthesis.js by name and defers external-claim verification to rpw. A study
 * that ends in an external cited manuscript may hand esl's manuscript artifact to rpw for
 * citation verification — a separate run, never a hidden sub-call.
 *
 * This is the FIRST end-to-end flagship in the social-sciences-humanities tier: it establishes
 * the tier's contract (routed-gate-combinators reuse, kip kind per domain, policy-gated
 * executors, fail-closed terminals).
 *
 * Consumer of the kip-librarian skill
 * (library/specializations/shared/skills/kip-librarian/SKILL.md), kind `empirical-study`.
 *
 * @example
 * const result = await orchestrate('social-sciences/empirical-study-lifecycle-workflow', {
 *   researchQuestion: 'Does a 12-week peer-mentoring program reduce first-year university attrition?',
 *   population: 'first-year undergraduates at a public research university',
 *   designFamilyHint: 'quasi-experimental',
 *   populations: ['en-US', 'es-MX'],
 *   registry: 'OSF',
 *   maxIrbRounds: 3
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  KIP_CLI_NOTE,
} from '../../../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Module constants — families, playbooks, kip notes, validators
// ---------------------------------------------------------------------------

/** Directory every composed point task lives in. Composition is BY NAME only. */
const SS_DIR = 'library/specializations/domains/social-sciences-humanities/social-sciences';

/**
 * The only design families the selection task may choose. assertDesignFamily throws on
 * anything else — there is no default family.
 */
export const ALLOWED_DESIGN_FAMILIES = Object.freeze([
  'experimental',
  'quasi-experimental',
  'mixed-methods',
]);

/**
 * Family -> design playbook, interpolated into the design-specification prompt. Every family
 * has an entry: DESIGN_PLAYBOOKS[family] is never undefined because assertDesignFamily already
 * threw on anything outside ALLOWED_DESIGN_FAMILIES.
 */
export const DESIGN_PLAYBOOKS = Object.freeze({
  'experimental': `${SS_DIR}/experimental-design.js`,
  'quasi-experimental': `${SS_DIR}/quasi-experimental-design.js`,
  'mixed-methods': `${SS_DIR}/mixed-methods-research-design.js`,
});

/**
 * Additional playbook appended to the design-specification prompt whenever a survey wave is
 * planned — an ADDITIVE discipline, not a family alternative.
 */
export const SURVEY_DESIGN_PLAYBOOK = `${SS_DIR}/survey-research-design.js`;

/** The only data-collection wave modes. assertCollectionMode throws on anything else. */
export const ALLOWED_COLLECTION_MODES = Object.freeze([
  'survey',
  'in-depth-interview',
  'focus-group',
  'ethnographic-fieldwork',
]);

/**
 * Wave mode -> fieldwork playbook. Every allowed mode has an entry; there is no
 * null-playbook case in this map.
 */
export const COLLECTION_PLAYBOOKS = Object.freeze({
  'survey': `${SS_DIR}/survey-administration.js`,
  'in-depth-interview': `${SS_DIR}/in-depth-interview-protocol.js`,
  'focus-group': `${SS_DIR}/focus-group-facilitation.js`,
  'ethnographic-fieldwork': `${SS_DIR}/ethnographic-fieldwork.js`,
});

/** The only analysis methods a registered specification may name. */
export const ALLOWED_ANALYSIS_METHODS = Object.freeze([
  'statistical-pipeline',
  'propensity-score',
  'multilevel',
  'qualitative-coding',
]);

/** Analysis method -> analysis playbook, interpolated per spec in the ctx.parallel.map fan-out. */
export const ANALYSIS_PLAYBOOKS = Object.freeze({
  'statistical-pipeline': `${SS_DIR}/statistical-analysis-pipeline.js`,
  'propensity-score': `${SS_DIR}/propensity-score-analysis.js`,
  'multilevel': `${SS_DIR}/multilevel-modeling.js`,
  'qualitative-coding': `${SS_DIR}/qualitative-coding-analysis.js`,
});

/** Playbook for the pre-registration authoring task. */
export const PREREGISTRATION_PLAYBOOK = `${SS_DIR}/research-pre-registration.js`;

/** Playbooks for the two instrument lanes fanned out with ctx.parallel.all. */
export const INSTRUMENT_PLAYBOOKS = Object.freeze({
  'scale-development': `${SS_DIR}/scale-development-validation.js`,
  'cross-cultural-adaptation': `${SS_DIR}/cross-cultural-measurement-adaptation.js`,
});

/** Playbooks for the literature, evaluation, and dissemination phases. */
export const DISSEMINATION_PLAYBOOKS = Object.freeze({
  'program-evaluation': `${SS_DIR}/program-evaluation.js`,
  'policy-impact': `${SS_DIR}/policy-impact-assessment.js`,
  'policy-brief': `${SS_DIR}/policy-brief-development.js`,
  'manuscript': `${SS_DIR}/academic-manuscript-preparation.js`,
  'literature-synthesis': `${SS_DIR}/literature-review-synthesis.js`,
});

/**
 * Prepended (with KIP_CLI_NOTE) to every kip-touching task prompt — names the kip-librarian
 * skill explicitly, copied verbatim from the sibling flagship so the two stay in lockstep.
 */
export const KIP_LIBRARIAN_NOTE =
  'Follow the kip-librarian skill (library/specializations/shared/skills/kip-librarian/SKILL.md) exactly: every command needs --dir, --replica (reads too), --json; writes need <dir>/keyring.json; recall requires --k; resolve requires explicit --model sonnet; an assert echo of status:"pending" is BY DESIGN, never a failure; 0 recall hits on a fresh store is a fresh brain, not an error.';

/**
 * Pinned verdict shape appended verbatim as the LAST instruction of EVERY critic in BOTH gates
 * so no critic drifts into an ad-hoc verdict schema.
 */
const GATE_PROMPT_TAIL =
  'Return EXACTLY this JSON shape and nothing else: {"passed": boolean, "issues": [{"severity": string, "description": string}], "evidence": [string]}. `evidence` MUST be non-empty even when passed is true — an evidence-empty PASS is rejected as a protocol failure.';

/** Wave names and specIds key task titles and kip eids; both must be kebab-case. */
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// Throwing validators — no fallbacks, no repair, no truncation
// ---------------------------------------------------------------------------

/**
 * Throws on any family outside ALLOWED_DESIGN_FAMILIES — no default family exists.
 *
 * @param {string} family - The family the selection task chose
 * @returns {string} The family, unchanged, when it is allowed
 */
export function assertDesignFamily(family) {
  if (!ALLOWED_DESIGN_FAMILIES.includes(family)) {
    throw new Error(
      `Design selection returned unknown family ${JSON.stringify(family)}. ` +
      `Allowed families: ${ALLOWED_DESIGN_FAMILIES.join(', ')} — no default family is applied.`
    );
  }
  return family;
}

/**
 * Throws on any wave mode outside ALLOWED_COLLECTION_MODES.
 *
 * @param {string} mode - The wave's collection mode
 * @param {string} waveName - The wave's name (for the error message)
 * @returns {string} The mode, unchanged, when it is allowed
 */
export function assertCollectionMode(mode, waveName) {
  if (!ALLOWED_COLLECTION_MODES.includes(mode)) {
    throw new Error(
      `Collection wave '${waveName}' uses unknown mode ${JSON.stringify(mode)}. ` +
      `Allowed modes: ${ALLOWED_COLLECTION_MODES.join(', ')} — no default mode is applied.`
    );
  }
  return mode;
}

/**
 * Throws on any analysis method outside ALLOWED_ANALYSIS_METHODS.
 *
 * @param {string} method - The specification's analysis method
 * @param {string} specId - The specification id (for the error message)
 * @returns {string} The method, unchanged, when it is allowed
 */
export function assertAnalysisMethod(method, specId) {
  if (!ALLOWED_ANALYSIS_METHODS.includes(method)) {
    throw new Error(
      `Analysis specification '${specId}' uses unknown method ${JSON.stringify(method)}. ` +
      `Allowed methods: ${ALLOWED_ANALYSIS_METHODS.join(', ')} — no default method is applied.`
    );
  }
  return method;
}

/**
 * Throwing wave-plan validator (no repair, no truncation).
 *
 * @param {Array<object>} waves - The design specification's planned collection waves
 * @param {number} maxCollectionWaves - Upper bound on wave count
 * @returns {Array<object>} The waves, unchanged, when valid
 */
export function validateWaves(waves, maxCollectionWaves) {
  if (!Array.isArray(waves) || waves.length === 0) {
    throw new Error(
      'validateWaves: the design specification planned zero collection waves — a study with zero collection waves is a planning failure, never repaired.'
    );
  }
  if (waves.length > maxCollectionWaves) {
    throw new Error(
      `validateWaves: plan has ${waves.length} waves but maxCollectionWaves is ${maxCollectionWaves} — the plan is rejected, never truncated.`
    );
  }
  const seen = new Set();
  for (const wave of waves) {
    if (!wave || typeof wave.name !== 'string' || !KEBAB_CASE.test(wave.name)) {
      throw new Error(
        `validateWaves: wave name ${JSON.stringify(wave && wave.name)} is not kebab-case — wave names key task titles and kip eids.`
      );
    }
    if (seen.has(wave.name)) {
      throw new Error(`validateWaves: duplicate wave name '${wave.name}' — wave names must be unique.`);
    }
    seen.add(wave.name);
    assertCollectionMode(wave.mode, wave.name);
    if (typeof wave.targetN !== 'number' || !(wave.targetN > 0)) {
      throw new Error(
        `validateWaves: wave '${wave.name}' is missing a positive targetN (got ${JSON.stringify(wave.targetN)}) — no target is synthesized for it.`
      );
    }
    if (typeof wave.samplingFrame !== 'string' || wave.samplingFrame.length === 0) {
      throw new Error(
        `validateWaves: wave '${wave.name}' is missing its samplingFrame — no sampling frame is synthesized for it.`
      );
    }
  }
  return waves;
}

/**
 * Throwing analysis-specification validator. A confirmatory specification absent from the
 * locked pre-registration is a pre-registration violation, never silently downgraded here.
 *
 * @param {Array<object>} specs - The analysis specifications about to be executed
 * @param {number} maxAnalysisSpecs - Upper bound on specification count
 * @param {string[]} registeredSpecIds - The locked pre-registration's registered spec ids
 * @returns {Array<object>} The specs, unchanged, when valid
 */
export function validateAnalysisSpecs(specs, maxAnalysisSpecs, registeredSpecIds) {
  if (!Array.isArray(specs) || specs.length === 0) {
    throw new Error(
      'validateAnalysisSpecs: zero analysis specifications — a locked pre-registration with nothing to estimate is a planning failure, never repaired.'
    );
  }
  if (specs.length > maxAnalysisSpecs) {
    throw new Error(
      `validateAnalysisSpecs: ${specs.length} specifications exceed maxAnalysisSpecs ${maxAnalysisSpecs} — the plan is rejected, never truncated.`
    );
  }
  if (!Array.isArray(registeredSpecIds)) {
    throw new Error(
      `validateAnalysisSpecs: registeredSpecIds must be an array from the locked pre-registration (got ${JSON.stringify(registeredSpecIds)}).`
    );
  }
  const seen = new Set();
  for (const spec of specs) {
    if (!spec || typeof spec.specId !== 'string' || !KEBAB_CASE.test(spec.specId)) {
      throw new Error(
        `validateAnalysisSpecs: specId ${JSON.stringify(spec && spec.specId)} is not kebab-case — specIds key task titles and kip eids.`
      );
    }
    if (seen.has(spec.specId)) {
      throw new Error(`validateAnalysisSpecs: duplicate specId '${spec.specId}' — spec ids must be unique.`);
    }
    seen.add(spec.specId);
    assertAnalysisMethod(spec.method, spec.specId);
    if (spec.confirmatory === true && !registeredSpecIds.includes(spec.specId)) {
      throw new Error(
        `validateAnalysisSpecs: specification '${spec.specId}' claims confirmatory status but is absent from the locked pre-registration ` +
        `(${registeredSpecIds.join(', ')}). A confirmatory analysis absent from the locked pre-registration is a pre-registration violation, ` +
        'never silently downgraded to exploratory here — the adherence phase is the only place a reclassification may be recorded, and only under an approved amendment.'
      );
    }
  }
  return specs;
}

/**
 * Throws unless the IRB determination is an approval. Called immediately before the
 * recruitment breakpoint AND again before the collection fan-out (defence in depth).
 *
 * @param {object} irb - The IRB run state
 * @returns {object} The irb record, unchanged, when approved
 */
export function assertIrbApproved(irb) {
  if (!irb || irb.approved !== true) {
    throw new Error(
      `assertIrbApproved: IRB determination is ${JSON.stringify(irb && irb.determination)} (approved=${JSON.stringify(irb && irb.approved)}). ` +
      'Participant recruitment and data collection are unreachable without an approved IRB determination — there is no degraded proceed-anyway path.'
    );
  }
  return irb;
}

/**
 * Throws unless the pre-registration is locked with a registry id. Called before the IRB
 * phase and again before the analysis fan-out — after the lock, registeredSpecIds is the sole
 * authority for what counts as confirmatory.
 *
 * @param {object} preregistration - The pre-registration run state
 * @returns {object} The preregistration record, unchanged, when locked
 */
export function assertPreregistrationLocked(preregistration) {
  if (!preregistration || preregistration.locked !== true) {
    throw new Error(
      `assertPreregistrationLocked: the pre-registration is not locked (locked=${JSON.stringify(preregistration && preregistration.locked)}) — ` +
      'no phase past the lock may run against an unlocked analysis plan.'
    );
  }
  if (typeof preregistration.registryId !== 'string' || preregistration.registryId.length === 0) {
    throw new Error(
      `assertPreregistrationLocked: the pre-registration has no registryId (got ${JSON.stringify(preregistration.registryId)}) — ` +
      'a lock without a public registry id is not a lock.'
    );
  }
  return preregistration;
}

// ---------------------------------------------------------------------------
// P0 — kip recall (kip-librarian skill, kind empirical-study)
// ---------------------------------------------------------------------------

export const eslKipRecallTask = defineTask('esl.kip-recall', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recall prior empirical-study memory for: ${args.researchQuestion}`,
  agent: {
    name: 'kip-librarian',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Recall prior studies, validated instruments, and IRB precedents for this question and population from kip',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        `Run \`kip init --dir ${args.kipDir} --create --replica ${args.kipReplicaId} --json\` (idempotent open); ensure ${args.kipDir}/keyring.json exists before any later write.`,
        `Run \`kip recall "${args.researchQuestion} ${args.population}" --dir ${args.kipDir} --replica ${args.kipReplicaId} --k 12 --json\` — --k is mandatory.`,
        'Also run `kip query` (with mandatory --depth/--max-fanout/--direction) from any hit eids to pull linked instrument and effect-size facts.',
        'Partition results into priorStudies (kind empirical-study, study:* eids), priorInstruments (instrument:* eids), priorDeterminations (irb:* eids), and insights; report the raw factCount.',
        'A fresh store means factCount 0 with storeInitialized true — a fresh brain, never an error.',
      ],
      outputFormat: 'JSON with priorStudies array, priorInstruments array, priorDeterminations array, insights array, factCount number, storeInitialized boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['factCount', 'storeInitialized'],
      properties: {
        priorStudies: { type: 'array' },
        priorInstruments: { type: 'array' },
        priorDeterminations: { type: 'array' },
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
  labels: ['agent', 'esl', 'social-sciences', 'kip'],
}));

// ---------------------------------------------------------------------------
// P1 — question/construct definition + parallel literature lane
// ---------------------------------------------------------------------------

export const eslQuestionConstructTask = defineTask('esl.question-construct-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define constructs and hypotheses for: ${args.researchQuestion}`,
  agent: {
    name: 'quantitative-research-methodologist',
    prompt: {
      role: 'Research question and construct definer',
      task: 'Decompose the research question into constructs, operational definitions, and directional hypotheses',
      context: args,
      instructions: [
        "Emit constructs [{ constructId (kebab-case), label, conceptualDefinition, operationalDefinition, level ('individual'|'group'|'institution'), expectedMeasurement }].",
        "Emit hypotheses [{ hypothesisId (kebab-case), statement, direction ('positive'|'negative'|'null'|'non-directional'), constructsInvolved, falsifiableBecause }] — a hypothesis that cannot be falsified is not a hypothesis and must be reported in openAmbiguities instead.",
        'Emit subQuestions, scopeBoundaries { inScope, outOfScope }, and openAmbiguities (these ride into the pre-registration-submission gate context and are shown to the PI).',
        'Honor recall.insights and recall.priorStudies — cite prior constructs and operationalizations rather than reinventing them; note explicitly where you diverge and why.',
        'Do NOT choose a design and do NOT gather data in this phase.',
      ],
      outputFormat: 'JSON with constructs array, hypotheses array, subQuestions array, scopeBoundaries object, openAmbiguities array',
    },
    outputSchema: {
      type: 'object',
      required: ['constructs', 'hypotheses', 'scopeBoundaries'],
      properties: {
        constructs: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['constructId', 'conceptualDefinition', 'operationalDefinition'],
          },
        },
        hypotheses: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['hypothesisId', 'statement', 'direction'],
          },
        },
        subQuestions: { type: 'array' },
        scopeBoundaries: { type: 'object' },
        openAmbiguities: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'framing'],
}));

export const eslLiteratureSynthesisTask = defineTask('esl.literature-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synthesize prior literature and effect sizes for: ${args.researchQuestion}`,
  agent: {
    name: 'policy-research-analyst',
    skill: { name: 'systematic-review' },
    prompt: {
      role: 'Literature synthesist',
      task: 'Synthesize prior evidence and extract prior effect sizes to inform the power analysis',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this lane's playbook — emulate its search/screen/extract/synthesize discipline; do NOT import or execute it.`,
        `Write the synthesis to ${args.synthesisPath} and report that exact path back.`,
        'Extract priorEffectSizes [{ source, construct, estimate, ci, n, designFamily }] — these are the ONLY admissible inputs to the P2 power analysis; a power analysis run on an invented effect size is a design-integrity gate failure.',
        'Report gaps (what the prior literature cannot answer) and contradictions (surface both sides; never resolve by deletion).',
        'Every extracted estimate carries a citation with a verbatim excerpt. This process does NOT re-fetch citations — external claim verification belongs to library/specializations/research/research-publication-workflow.js; flag any estimate you could not verify at source as unverifiedAtSource.',
        'Report the executed searches in evidence.',
      ],
      outputFormat: 'JSON with synthesisPath string, priorEffectSizes array, gaps array, contradictions array, unverifiedAtSource array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['synthesisPath', 'priorEffectSizes', 'evidence'],
      properties: {
        synthesisPath: { type: 'string' },
        priorEffectSizes: { type: 'array' },
        gaps: { type: 'array' },
        contradictions: { type: 'array' },
        unverifiedAtSource: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'literature'],
}));

// ---------------------------------------------------------------------------
// P2 — design-family selection (genuine branch) + design specification
// ---------------------------------------------------------------------------

export const eslDesignSelectionTask = defineTask('esl.design-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select design family for: ${args.researchQuestion}`,
  agent: {
    name: 'causal-inference-analyst',
    skill: { name: 'causal-inference-methods' },
    prompt: {
      role: 'Study design selector',
      task: 'Choose exactly one design family and justify it against every alternative',
      context: args,
      instructions: [
        `family MUST be exactly one of: ${args.allowedDesignFamilies.join(', ')} — there is no default family and selection FAILS on anything else.`,
        "Routing discipline: random assignment feasible and ethical -> experimental; assignment determined by a policy/threshold/natural process outside the researcher's control -> quasi-experimental; a causal question that requires qualitative mechanism evidence to interpret the quantitative estimate -> mixed-methods.",
        'designFamilyHint in context is ADVISORY ONLY — if you select against it, say so explicitly in rationale.',
        'ruledOut MUST contain one entry per family you did not choose, each with the concrete reason (feasibility, ethics, identification, or interpretability) — an unjustified selection is a design-integrity gate failure.',
        'State the assignment mechanism and the counterfactual explicitly. If no credible counterfactual exists for any family, say so in blockers rather than selecting a family anyway.',
        `List plannedCollectionModes — the collection modes you expect this design to require, each exactly one of: ${args.allowedCollectionModes.join(', ')}. This is not a commitment (the specification task owns the final wave plan); the orchestrator uses it only to decide whether the survey-research-design playbook is additionally supplied to that task.`,
      ],
      outputFormat: 'JSON with family string, rationale string, ruledOut array [{ family, reason }], assignmentMechanism string, counterfactual string, blockers array, plannedCollectionModes array',
    },
    outputSchema: {
      type: 'object',
      required: ['family', 'rationale', 'ruledOut'],
      properties: {
        family: { type: 'string', enum: [...ALLOWED_DESIGN_FAMILIES] },
        rationale: { type: 'string' },
        ruledOut: { type: 'array', minItems: 2 },
        assignmentMechanism: { type: 'string' },
        counterfactual: { type: 'string' },
        blockers: { type: 'array' },
        plannedCollectionModes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'design'],
}));

export const eslDesignSpecificationTask = defineTask('esl.design-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Specify ${args.family} design and collection waves`,
  agent: {
    name: 'quantitative-research-methodologist',
    skill: { name: 'quantitative-methods' },
    prompt: {
      role: 'Study design specifier',
      task: 'Write the full design specification, power analysis, and collection-wave plan',
      context: args,
      instructions: [
        `Apply the methodology of ${args.designPlaybook} as this design's playbook — emulate its structure and rigor; do NOT import or execute it.`,
        // The survey playbook is ADDITIVE and only supplied when a survey wave is expected.
        // Its absence is a documented absence, never a default.
        ...(args.surveyPlaybook
          ? [`A survey wave is planned: ALSO apply the instrument/sampling discipline of ${args.surveyPlaybook}.`]
          : ['No survey wave is expected for this design, so no survey-research-design playbook is supplied — a documented absence, not a default. If your wave plan does introduce a survey wave, say so explicitly in the specification.']),
        `Write the specification to ${args.designSpecPath} and report that exact path back.`,
        'EXECUTE the power analysis (report the command and its raw output in evidence) using ONLY priorEffectSizes from the literature lane; state alpha, target power, the assumed effect size and its source, and the resulting required N per arm/cluster.',
        `Emit waves [{ name (kebab-case, unique — keys task titles and kip eids), mode, targetN, samplingFrame, instrumentIds, sequencePosition, rationale }]; mode MUST be exactly one of: ${args.allowedCollectionModes.join(', ')}; at most ${args.maxCollectionWaves} waves.`,
        'Waves run CONCURRENTLY: a wave whose sequencePosition depends on another wave\'s result must be planned as a later wave in a separate plan, never as a peer in this one.',
        "Emit identificationStrategy (how the causal estimate is identified and what would break it) and threatsToValidity [{ threat, type ('internal'|'external'|'construct'|'statistical-conclusion'), mitigation }].",
        'IRON LAW: an adversarial design-integrity gate will RE-RUN your power computation and check your identification strategy against the assignment mechanism — an unexecuted or unsourced power claim will be caught and rejected.',
      ],
      outputFormat: 'JSON with designSpecPath string, identificationStrategy string, powerAnalysis object { alpha, targetPower, assumedEffectSize, effectSizeSource, requiredN, command }, threatsToValidity array, waves array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['designSpecPath', 'identificationStrategy', 'powerAnalysis', 'waves', 'evidence'],
      properties: {
        designSpecPath: { type: 'string' },
        identificationStrategy: { type: 'string' },
        powerAnalysis: {
          type: 'object',
          required: ['alpha', 'targetPower', 'assumedEffectSize', 'requiredN'],
        },
        threatsToValidity: { type: 'array' },
        waves: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'mode', 'targetN', 'samplingFrame'],
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'design'],
}));

// ---------------------------------------------------------------------------
// P3 — instrument development and validation (parallel lanes)
// ---------------------------------------------------------------------------

export const eslScaleDevelopmentTask = defineTask('esl.scale-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop and validate instruments for ${args.constructCount} construct(s)`,
  agent: {
    name: 'measurement-psychometrics-expert',
    skill: { name: 'psychometric-assessment' },
    prompt: {
      role: 'Scale developer',
      task: 'Develop or select a measurement instrument for every construct',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this lane's playbook — emulate its item-generation/content-validity/pilot discipline; do NOT import or execute it.`,
        'For each construct, either ADOPT a validated existing instrument (cite it, and prefer one from recall.priorInstruments) or DEVELOP items — never leave a construct unmeasured; an unmeasured construct is a design-integrity gate failure, not a tolerated gap.',
        "Emit instruments [{ instrumentId (kebab-case), constructId, kind ('adopted'|'developed'), path, itemCount, responseFormat, contentValidityEvidence, sourceCitation }].",
        `Write each instrument to ${args.instrumentDir} and report every path written.`,
        'Report the executed content-validity procedure in evidence.',
      ],
      outputFormat: 'JSON with instruments array, unmeasuredConstructs array (must be empty), evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['instruments', 'evidence'],
      properties: {
        instruments: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['instrumentId', 'constructId', 'kind', 'path'],
          },
        },
        unmeasuredConstructs: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'instruments'],
}));

export const eslCrossCulturalAdaptationTask = defineTask('esl.cross-cultural-adaptation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adapt instruments across ${args.populations.length} populations`,
  agent: {
    name: 'measurement-psychometrics-expert',
    skill: { name: 'psychometric-assessment' },
    prompt: {
      role: 'Cross-cultural measurement adapter',
      task: 'Adapt every instrument for each target population and plan the invariance tests',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this lane's playbook — emulate its translation/back-translation/cognitive-interview/invariance discipline; do NOT import or execute it.`,
        'For each instrument x population: record the translation and back-translation procedure, the cognitive-interview findings, and any item flagged as non-equivalent.',
        'Emit the planned invariance test sequence (configural -> metric -> scalar) with the exact model specification to be run — the methodological-validity critic RE-RUNS these.',
        'An item that cannot be made equivalent is REPORTED as non-equivalent with its consequence for cross-population comparison; it is never silently retained as if equivalent.',
        'Report the executed procedures in evidence.',
      ],
      outputFormat: 'JSON with adaptations array [{ instrumentId, population, procedure, nonEquivalentItems }], invariancePlan object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['adaptations', 'invariancePlan', 'evidence'],
      properties: {
        adaptations: { type: 'array' },
        invariancePlan: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'instruments', 'cross-cultural'],
}));

export const eslPilotPsychometricsTask = defineTask('esl.pilot-psychometrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run pilot psychometrics for ${args.designFamily} instruments`,
  agent: {
    name: 'measurement-psychometrics-expert',
    skill: { name: 'psychometric-assessment' },
    prompt: {
      role: 'Pilot psychometrician',
      task: 'Execute reliability and factor-structure checks on pilot data',
      context: args,
      instructions: [
        'EXECUTE the reliability computation (Cronbach alpha and McDonald omega) and the factor-structure check (EFA/CFA as appropriate) — a reported coefficient without an executed command in evidence is inadmissible and the design-integrity gate will reject it.',
        'Report per-instrument { instrumentId, alpha, omega, factorStructure, problematicItems, recommendation }.',
        'If no pilot data are available, report pilotDataAvailable:false with the reason and an empty results array — an HONEST absence. Do NOT synthesize, simulate, or assume psychometric values; the gate treats a fabricated coefficient as a failure and treats an honest absence as a caveat the PI sees at the pre-registration gate.',
        'Recommend item drops/retentions explicitly; the pre-registration will lock whatever you recommend.',
      ],
      outputFormat: 'JSON with pilotDataAvailable boolean, results array, recommendations array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['pilotDataAvailable', 'results', 'evidence'],
      properties: {
        pilotDataAvailable: { type: 'boolean' },
        results: { type: 'array' },
        recommendations: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'instruments', 'psychometrics'],
}));

// ---------------------------------------------------------------------------
// G1 — design-integrity gate fixer (passed via fixer.task)
// ---------------------------------------------------------------------------

export const eslDesignIntegrityFixerTask = defineTask('esl.design-integrity-fixer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix design-integrity issues (attempt ${args.attempt})`,
  agent: {
    name: 'quantitative-research-methodologist',
    prompt: {
      role: 'Design remediation methodologist',
      task: 'Fix ONLY the critic-reported design and instrument issues',
      context: args,
      instructions: [
        'For each issue: repair the design specification or instrument in place (re-run the power analysis, tighten the identification strategy, replace a failing item) — or move the affected element to a proposed-removal list with the reason.',
        'NEVER weaken a hypothesis, lower the target power, or broaden a construct definition to make an issue disappear.',
        'Do not touch elements with no reported issues. No scope creep.',
        'Report per-issue what changed and the executed re-check.',
      ],
      outputFormat: 'JSON with fixed boolean, changes array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'fixer'],
}));

// ---------------------------------------------------------------------------
// P4 — pre-registration authoring + guarded registry-submission executor
// ---------------------------------------------------------------------------

export const eslPreregistrationAuthoringTask = defineTask('esl.preregistration-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Author pre-registration for ${args.registry}`,
  agent: {
    name: 'quantitative-research-methodologist',
    skill: { name: 'academic-writing-publication' },
    prompt: {
      role: 'Pre-registration author',
      task: 'Author the complete, lockable pre-registration document',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this phase's playbook — emulate its study-information/hypotheses/design-plan/sampling-plan/analysis-plan sections; do NOT import or execute it.`,
        `Write the document to ${args.preregistrationPath} for registry ${args.registry} and report that exact path back.`,
        `Emit registeredSpecIds: the kebab-case specId of EVERY confirmatory analysis you register, each with { specId, constructId, method, model, dependentVariable, predictors, inferenceCriterion, covariates, missingDataHandling }. method MUST be exactly one of: ${args.allowedAnalysisMethods.join(', ')}.`,
        'Register the exclusion rules, the stopping rule, and the multiple-comparison correction BEFORE any data exist.',
        'Explicitly list any analysis you intend as EXPLORATORY, separately from the confirmatory set — emit exploratorySpecs as an array even when it is empty; the orchestrator refuses an undeclared exploratory set.',
        'IRON LAW: after submission this plan is LOCKED. A conformance critic will later EXECUTE a diff between this document and the analysis actually run, citing file:line. Anything you leave vague here becomes a deviation later — be specific.',
      ],
      outputFormat: 'JSON with preregistrationPath string, registeredSpecIds array, confirmatorySpecs array, exploratorySpecs array, exclusionRules array, stoppingRule string, correctionMethod string',
    },
    outputSchema: {
      type: 'object',
      required: ['preregistrationPath', 'registeredSpecIds', 'confirmatorySpecs'],
      properties: {
        preregistrationPath: { type: 'string' },
        registeredSpecIds: { type: 'array', minItems: 1 },
        confirmatorySpecs: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['specId', 'method'],
          },
        },
        exploratorySpecs: { type: 'array' },
        exclusionRules: { type: 'array' },
        stoppingRule: { type: 'string' },
        correctionMethod: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'preregistration'],
}));

/**
 * Pre-registration submission executor — invoked ONLY when the
 * empirical-study.pre-registration-submission breakpoint returned approved === true.
 * There is no alternate execution path.
 */
export const eslPreregSubmitExecutorTask = defineTask('esl.prereg-submit-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved pre-registration submission to ${args.registry}`,
  agent: {
    name: 'quantitative-research-methodologist',
    prompt: {
      role: 'Pre-registration submission executor',
      task: 'Execute the approved submission of the pre-registration to the public registry',
      context: args,
      instructions: [
        'Execute exactly the submission described in the approval context and nothing beyond it; record the executed commands and the returned registryId/URL and timestamp.',
        'IRON LAW: this task runs only under an approved===true policy gate (empirical-study.pre-registration-submission). If the input\'s approval provenance is missing or approved is not exactly true, REFUSE and report — do not submit.',
        'The registration is public and permanent: report the exact document version submitted (hash or byte length) so any later amendment is diffable.',
      ],
      outputFormat: 'JSON with submitted boolean, registryId string, registryUrl string, submittedAt string, documentHash string, commands array',
    },
    outputSchema: {
      type: 'object',
      required: ['submitted', 'registryId'],
      properties: {
        submitted: { type: 'boolean' },
        registryId: { type: 'string' },
        registryUrl: { type: 'string' },
        submittedAt: { type: 'string' },
        documentHash: { type: 'string' },
        commands: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'preregistration', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P5 — ethics/IRB protocol, per-round readiness, guarded submission,
// determination ingest, and revision
// ---------------------------------------------------------------------------

export const eslIrbProtocolAuthoringTask = defineTask('esl.irb-protocol-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Author IRB protocol for: ${args.researchQuestion}`,
  agent: {
    name: 'research-ethics-coordinator',
    skill: { name: 'research-ethics-irb' },
    prompt: {
      role: 'IRB protocol author',
      task: 'Author the ethics protocol, consent materials, and risk/benefit analysis',
      context: args,
      instructions: [
        `Write the protocol to ${args.protocolPath} and the consent materials to ${args.consentDir}; report every path written.`,
        'Cover: purpose, procedures per collection wave, participant population and vulnerability status, recruitment script, informed-consent language (per population/language), risk/benefit analysis, data-security and retention plan, de-identification plan, incidental-findings plan, compensation, and withdrawal procedure.',
        'The consent language MUST state exactly what may later be published — the disclosure-control phase is checked against this text.',
        'Cite the locked pre-registration and design specification; the protocol must match them (a protocol describing a different design than the registered one is an immediate board revision).',
        'Flag any element you could not determine as an openEthicsQuestion — never invent an institutional policy, an approval number, or a board\'s standing determination.',
      ],
      outputFormat: 'JSON with protocolPath string, consentPaths array, vulnerablePopulations array, riskLevel string, openEthicsQuestions array',
    },
    outputSchema: {
      type: 'object',
      required: ['protocolPath', 'consentPaths', 'riskLevel'],
      properties: {
        protocolPath: { type: 'string' },
        consentPaths: { type: 'array', minItems: 1 },
        vulnerablePopulations: { type: 'array' },
        riskLevel: { type: 'string' },
        openEthicsQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'irb'],
}));

export const eslIrbReadinessCheckTask = defineTask('esl.irb-readiness-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `IRB submission-readiness check (round ${args.round})`,
  agent: {
    name: 'research-ethics-coordinator',
    skill: { name: 'research-ethics-irb' },
    prompt: {
      role: 'IRB readiness checker',
      task: 'Check the protocol package for completeness before it goes to the board',
      context: args,
      instructions: [
        'This is an INTERNAL completeness check, not an approval of the research and not a submission. Check that every required element exists, that the consent forms match the protocol procedures, that the protocol matches the locked pre-registration, and that every prior-round board comment has a corresponding change.',
        'EXECUTE the checks against the files on disk and cite file:line for each finding; a checklist assembled from memory is inadmissible.',
        'Emit ready boolean plus missingElements[] and unaddressedBoardComments[]. ready:true requires BOTH arrays empty.',
        'Do not soften or omit a finding to reach ready:true.',
      ],
      outputFormat: 'JSON with ready boolean, missingElements array, unaddressedBoardComments array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'missingElements', 'evidence'],
      properties: {
        ready: { type: 'boolean' },
        missingElements: { type: 'array' },
        unaddressedBoardComments: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'irb', 'readiness'],
}));

/**
 * IRB submission executor — invoked ONLY when BOTH the once-raised
 * empirical-study.irb-submission policy gate AND this round's readiness check returned
 * approved === true. There is no alternate execution path.
 */
export const eslIrbSubmitExecutorTask = defineTask('esl.irb-submit-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved IRB submission (round ${args.round})`,
  agent: {
    name: 'research-ethics-coordinator',
    prompt: {
      role: 'IRB submission executor',
      task: 'Execute the approved submission of the protocol package to the ethics board',
      context: args,
      instructions: [
        'Execute exactly the submission described in the approval context (submission portal entry, package assembly, cover letter naming the round and the changes since the prior round) — nothing beyond it.',
        'IRON LAW: this task runs only when BOTH (a) the empirical-study.irb-submission policy gate returned approved===true and (b) this round\'s readiness check was approved. If either provenance is missing from the input, REFUSE and report — do not submit.',
        'Record the executed commands, the submission id, and the exact package contents.',
      ],
      outputFormat: 'JSON with submitted boolean, submissionId string, submittedAt string, packageFiles array, commands array',
    },
    outputSchema: {
      type: 'object',
      required: ['submitted', 'submissionId'],
      properties: {
        submitted: { type: 'boolean' },
        submissionId: { type: 'string' },
        submittedAt: { type: 'string' },
        packageFiles: { type: 'array' },
        commands: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'irb', 'policy-gated'],
}));

export const eslIrbDeterminationIngestTask = defineTask('esl.irb-determination-ingest', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ingest IRB determination (round ${args.round})`,
  agent: {
    name: 'research-ethics-coordinator',
    skill: { name: 'research-ethics-irb' },
    prompt: {
      role: 'IRB determination recorder',
      task: 'Record the board\'s determination for this round verbatim',
      context: args,
      instructions: [
        'determination MUST be exactly one of: approved, minor-revisions, major-revisions, deferred, disapproved.',
        'Copy every board comment VERBATIM into boardComments [{ commentId, text, section, severity }] — never paraphrase a board comment; the next round\'s readiness check diffs against these.',
        'If no determination artifact exists yet, report determinationAvailable:false with pendingSince — an honest pending state. Do NOT assume, predict, or synthesize a determination; a fabricated approval is the single most dangerous failure in this workflow.',
        'Report the determination letter path and the approval/expiry dates when approved.',
      ],
      outputFormat: 'JSON with determinationAvailable boolean, determination string, boardComments array, determinationLetterPath string, approvalNumber string, expiresAt string',
    },
    outputSchema: {
      type: 'object',
      required: ['determinationAvailable'],
      properties: {
        determinationAvailable: { type: 'boolean' },
        determination: {
          type: 'string',
          enum: ['approved', 'minor-revisions', 'major-revisions', 'deferred', 'disapproved'],
        },
        boardComments: { type: 'array' },
        determinationLetterPath: { type: 'string' },
        approvalNumber: { type: 'string' },
        expiresAt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'irb', 'determination'],
}));

export const eslIrbRevisionTask = defineTask('esl.irb-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Revise IRB protocol for round ${args.nextRound} (${args.boardComments.length} board comment(s))`,
  agent: {
    name: 'research-ethics-coordinator',
    skill: { name: 'research-ethics-irb' },
    prompt: {
      role: 'IRB protocol reviser',
      task: 'Address every board comment and produce the revised protocol package',
      context: args,
      instructions: [
        'Address EVERY board comment; emit a response matrix [{ commentId, response, changedFile, changedLines }] — a comment with no corresponding file change is an unaddressed comment and the next readiness check will catch it.',
        `Write the revised protocol to ${args.revisionPath} and report that exact path back.`,
        'If a board comment would require changing the LOCKED pre-registration, do NOT change it: report it in preregistrationConflicts so the orchestrator raises the analysis-plan-amendment gate as a separate, visible decision.',
        'Never widen scope or add procedures the board did not ask for.',
      ],
      outputFormat: 'JSON with revisionPath string, responseMatrix array, preregistrationConflicts array',
    },
    outputSchema: {
      type: 'object',
      required: ['revisionPath', 'responseMatrix'],
      properties: {
        revisionPath: { type: 'string' },
        responseMatrix: { type: 'array', minItems: 1 },
        preregistrationConflicts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'irb', 'revision'],
}));

// ---------------------------------------------------------------------------
// P6 — guarded recruitment executor, collection waves, dataset consolidation
// ---------------------------------------------------------------------------

/**
 * Recruitment executor — invoked ONLY when the
 * empirical-study.participant-recruitment-start breakpoint returned approved === true AND
 * the IRB determination is an approval. There is no alternate execution path.
 */
export const eslRecruitmentExecutorTask = defineTask('esl.recruitment-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved participant recruitment (${args.waveCount} wave(s))`,
  agent: {
    name: 'survey-research-director',
    prompt: {
      role: 'Recruitment executor',
      task: 'Execute the approved recruitment and informed-consent procedure',
      context: args,
      instructions: [
        'Execute exactly the recruitment described in the approved IRB protocol and the approval context — the approved recruitment script verbatim, the approved sampling frame, the approved compensation. Nothing beyond it.',
        'IRON LAW: this task runs only under an approved===true policy gate (empirical-study.participant-recruitment-start) AND an approved IRB determination present in the input. If either provenance is missing, REFUSE and report — do not contact any participant. Participant contact cannot be undone.',
        'Record consentedCount, declinedCount, the consent-artifact location, and every executed step.',
        'Report any deviation from the approved script as a reportable protocol deviation — never as a silent adjustment.',
      ],
      outputFormat: 'JSON with started boolean, consentedCount number, declinedCount number, consentArtifactPath string, protocolDeviations array, commands array',
    },
    outputSchema: {
      type: 'object',
      required: ['started', 'consentedCount'],
      properties: {
        started: { type: 'boolean' },
        consentedCount: { type: 'number' },
        declinedCount: { type: 'number' },
        consentArtifactPath: { type: 'string' },
        protocolDeviations: { type: 'array' },
        commands: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'recruitment', 'policy-gated'],
}));

export const eslDataCollectionWaveTask = defineTask('esl.data-collection-wave', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collect data — wave ${args.wave.name} (${args.wave.mode})`,
  agent: {
    name: 'survey-research-director',
    prompt: {
      role: `Field data collector (wave: ${args.wave.name}, mode: ${args.wave.mode})`,
      task: 'Execute this collection wave under the approved protocol',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this wave's playbook — emulate its fielding, quality-control, and documentation discipline; do NOT import or execute it.`,
        'IRON LAW: collect ONLY what the approved IRB protocol authorizes for this wave, using ONLY the instruments listed in wave.instrumentIds. Collecting an unapproved variable is a reportable deviation, not a bonus.',
        `Write the wave dataset to ${args.waveDatasetPath} and report that exact path back.`,
        'Report recordCount, responseRate, attrition, and integrityFlags [{ flag, affectedRecords, action }] — straightlining, speeding, duplicate respondents, interviewer effects, saturation status for qualitative modes.',
        'De-identify at the point of capture per the protocol\'s de-identification plan; the linking key never enters the analysis dataset.',
        'Report the executed fielding steps in evidence.',
      ],
      outputFormat: 'JSON with waveDatasetPath string, recordCount number, responseRate number, attrition number, integrityFlags array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['waveDatasetPath', 'recordCount', 'evidence'],
      properties: {
        waveDatasetPath: { type: 'string' },
        recordCount: { type: 'number' },
        responseRate: { type: 'number' },
        attrition: { type: 'number' },
        integrityFlags: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'collection'],
}));

export const eslDataIntegrityConsolidationTask = defineTask('esl.data-integrity-consolidation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consolidate ${args.waveCount} collection wave(s) into the analysis dataset`,
  agent: {
    name: 'computational-social-scientist',
    prompt: {
      role: 'Data integrity curator',
      task: 'Merge wave datasets into one analysis dataset and document every exclusion',
      context: args,
      instructions: [
        `Write the merged dataset to ${args.datasetPath} and the codebook to ${args.codebookPath}; report both exact paths back.`,
        'Apply ONLY the exclusion rules registered in the locked pre-registration; every excluded record is listed with the registered rule that excluded it. An exclusion not traceable to a registered rule is a pre-registration deviation and MUST be reported in unregisteredExclusions — never applied silently.',
        'Report totalRecords, perWaveCounts, missingDataPattern, and the executed merge/validation commands in evidence.',
        'Never impute, never drop, and never winsorize here — the analysis specs own all of that, and only as registered.',
      ],
      outputFormat: 'JSON with datasetPath string, codebookPath string, totalRecords number, perWaveCounts array, exclusions array, unregisteredExclusions array, missingDataPattern object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['datasetPath', 'totalRecords', 'evidence'],
      properties: {
        datasetPath: { type: 'string' },
        codebookPath: { type: 'string' },
        totalRecords: { type: 'number' },
        perWaveCounts: { type: 'array' },
        exclusions: { type: 'array' },
        unregisteredExclusions: { type: 'array' },
        missingDataPattern: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'dataset'],
}));

// ---------------------------------------------------------------------------
// P7 — analysis execution + pre-registration adherence check
// ---------------------------------------------------------------------------

export const eslAnalysisExecutionTask = defineTask('esl.analysis-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run analysis spec ${args.spec.specId} (${args.spec.method})`,
  agent: {
    name: 'causal-inference-analyst',
    skill: { name: 'quantitative-methods' },
    prompt: {
      role: `Analysis executor (spec: ${args.spec.specId})`,
      task: 'Execute exactly this registered analysis specification',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this specification's playbook — emulate its pipeline discipline; do NOT import or execute it.`,
        `Run EXACTLY the registered specification: model ${args.spec.model}, DV ${args.spec.dependentVariable}, predictors and covariates as registered, missing-data handling as registered, inference criterion as registered.`,
        'IRON LAW: you may NOT change the model, add or drop a covariate, transform a variable, or switch estimator — not even to improve fit. If the registered specification cannot be estimated as written, report estimable:false with the exact failure and STOP; the orchestrator routes that to the analysis-plan-amendment gate. Silently substituting a workable model is the exact researcher-degrees-of-freedom failure this workflow exists to prevent.',
        `Write results to ${args.resultPath} and the analysis script to ${args.scriptPath}; report both exact paths back.`,
        'evidence MUST contain the executed command(s) and a raw output excerpt — a reported coefficient without executed output is inadmissible and the integrity gate will reject it.',
        'Report confirmatory (copied from the spec, never self-assigned), estimate, ci, testStatistic, pValue, n, and diagnostics.',
      ],
      outputFormat: 'JSON with specId string, estimable boolean, resultPath string, scriptPath string, estimate object, diagnostics object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['specId', 'estimable', 'evidence'],
      properties: {
        specId: { type: 'string' },
        estimable: { type: 'boolean' },
        resultPath: { type: 'string' },
        scriptPath: { type: 'string' },
        estimate: { type: 'object' },
        diagnostics: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'analysis'],
}));

export const eslPreregistrationAdherenceCheckTask = defineTask('esl.preregistration-adherence-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Check analysis adherence against locked pre-registration ${args.registryId}`,
  agent: {
    name: 'quantitative-research-methodologist',
    prompt: {
      role: 'Pre-registration adherence checker',
      task: 'Execute a diff between the locked registered plan and the analysis actually run',
      context: args,
      instructions: [
        `EXECUTE the comparison against files on disk: the registered plan at ${args.preregistrationPath} and every analysis script/result produced this run. Cite file:line for BOTH sides of every finding.`,
        "For each registered specId report conforming or deviating; for each deviation emit { specId, dimension ('model'|'variables'|'sample'|'exclusions'|'inference'|'correction'|'unregistered-analysis'), registered (file:line + text), actual (file:line + text), severity }.",
        'An analysis that was RUN but never registered is a deviation of dimension \'unregistered-analysis\'; a registered analysis that was NOT run is a deviation too (omission is a deviation).',
        'Report the executed diff commands in evidence. A finding asserted without an executed comparison is inadmissible.',
        'Do NOT judge whether a deviation is acceptable — that is the principal investigator\'s decision at the amendment gate. Report faithfully.',
      ],
      outputFormat: 'JSON with conforming array, deviations array, unregisteredAnalyses array, omittedRegistered array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['conforming', 'deviations', 'evidence'],
      properties: {
        conforming: { type: 'array' },
        deviations: { type: 'array' },
        unregisteredAnalyses: { type: 'array' },
        omittedRegistered: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'adherence'],
}));

// ---------------------------------------------------------------------------
// G2 — methodological-integrity gate fixer (passed via fixer.task)
// ---------------------------------------------------------------------------

export const eslMethodologicalIntegrityFixerTask = defineTask('esl.methodological-integrity-fixer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix methodological-integrity issues (attempt ${args.attempt})`,
  agent: {
    name: 'causal-inference-analyst',
    prompt: {
      role: 'Methodological remediation analyst',
      task: 'Fix ONLY the critic-reported integrity issues',
      context: args,
      instructions: [
        'Permitted fixes: re-run a registered analysis correctly, correct a mis-transcribed coefficient, restore a registered covariate that was dropped, correct a mislabelled confirmatory/exploratory status, add the registered multiple-comparison correction.',
        'FORBIDDEN: changing a registered specification to match what was run, relabelling a deviation as conforming, dropping an inconvenient result, or weakening a conclusion to dodge a critic. Any change to the registered plan itself must be routed to the analysis-plan-amendment breakpoint by the orchestrator — you may not make it here.',
        'Report per-issue what changed, with the executed re-run command and output in evidence.',
      ],
      outputFormat: 'JSON with fixed boolean, changes array, refusedFixes array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
        refusedFixes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'fixer'],
}));

// ---------------------------------------------------------------------------
// P8 — program evaluation + policy impact assessment
// ---------------------------------------------------------------------------

export const eslProgramEvaluationTask = defineTask('esl.program-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate program outcomes for: ${args.researchQuestion}`,
  agent: {
    name: 'program-evaluation-specialist',
    skill: { name: 'program-evaluation' },
    prompt: {
      role: 'Program evaluator',
      task: 'Translate verified results into a program evaluation',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this phase's playbook — emulate its logic-model/outcome/implementation-fidelity discipline; do NOT import or execute it.`,
        `Write the evaluation to ${args.evaluationPath} and report that exact path back.`,
        'You may cite ONLY results that survived the methodological-integrity gate. Exploratory results MUST be labelled exploratory in every sentence that uses them.',
        'State the effect magnitude in the units decision-makers use, with the confidence interval, and state explicitly what the design cannot establish (from threatsToValidity).',
      ],
      outputFormat: 'JSON with evaluationPath string, outcomes array, implementationFidelity object, limitations array',
    },
    outputSchema: {
      type: 'object',
      required: ['evaluationPath', 'outcomes'],
      properties: {
        evaluationPath: { type: 'string' },
        outcomes: { type: 'array' },
        implementationFidelity: { type: 'object' },
        limitations: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'evaluation'],
}));

export const eslPolicyImpactAssessmentTask = defineTask('esl.policy-impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess policy impact for: ${args.researchQuestion}`,
  agent: {
    name: 'policy-research-analyst',
    prompt: {
      role: 'Policy impact assessor',
      task: 'Assess the policy implications of the verified results',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this phase's playbook — emulate its impact-pathway/distributional/cost discipline; do NOT import or execute it.`,
        `Write the assessment to ${args.impactPath} and report that exact path back.`,
        'Assess distributional effects across the studied populations; where measurement invariance was NOT established, say so and refuse the cross-population comparison rather than making it with a caveat.',
        'Extrapolation beyond the studied population is stated as an explicit assumption with its own uncertainty, never as a finding.',
      ],
      outputFormat: 'JSON with impactPath string, impactPathways array, distributionalEffects array, assumptions array',
    },
    outputSchema: {
      type: 'object',
      required: ['impactPath', 'impactPathways'],
      properties: {
        impactPath: { type: 'string' },
        impactPathways: { type: 'array' },
        distributionalEffects: { type: 'array' },
        assumptions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'policy'],
}));

// ---------------------------------------------------------------------------
// P9 — participant-data disclosure control (hard precondition, no override)
// ---------------------------------------------------------------------------

export const eslDisclosureControlTask = defineTask('esl.disclosure-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Disclosure control over ${args.candidateArtifacts.length} participant-derived artifact(s)`,
  agent: {
    name: 'research-ethics-coordinator',
    skill: { name: 'research-ethics-irb' },
    prompt: {
      role: 'Participant-data disclosure controller',
      task: 'Clear every participant-derived artifact for release, or block the release',
      context: args,
      instructions: [
        'EXECUTE the scans over the candidate artifacts on disk: direct-identifier scan, quasi-identifier inventory, small-cell/k-anonymity check on every reported table, and (for qualitative material) a quote-level re-identification review of every verbatim quote.',
        `Check every planned disclosure against the consent language recorded in the IRB protocol at ${args.protocolPath}, citing file:line — anything not covered by consent is BLOCKED, never released with a caveat.`,
        "Emit cleared boolean, reidentificationRisk ('low'|'medium'|'high'), suppressedFields[], suppressedCells[], blockedArtifacts[{ path, reason }], and the disclosure certificate path.",
        "cleared:true requires blockedArtifacts empty AND reidentificationRisk not 'high'. There is no partial clearance and no 'release with a warning' path.",
        'Report the executed scan commands in evidence.',
      ],
      outputFormat: 'JSON with cleared boolean, reidentificationRisk string, suppressedFields array, suppressedCells array, blockedArtifacts array, disclosurePath string, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['cleared', 'reidentificationRisk', 'disclosurePath', 'evidence'],
      properties: {
        cleared: { type: 'boolean' },
        reidentificationRisk: { type: 'string' },
        suppressedFields: { type: 'array' },
        suppressedCells: { type: 'array' },
        blockedArtifacts: { type: 'array' },
        disclosurePath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'participant-data', 'disclosure'],
}));

// ---------------------------------------------------------------------------
// P10 — policy brief, manuscript, package, guarded publication executor
// ---------------------------------------------------------------------------

export const eslPolicyBriefTask = defineTask('esl.policy-brief-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write policy brief: ${args.researchQuestion}`,
  agent: {
    name: 'policy-research-analyst',
    skill: { name: 'policy-communication' },
    prompt: {
      role: 'Policy brief author',
      task: 'Write the decision-maker-facing policy brief',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this phase's playbook — emulate its audience/structure/recommendation discipline; do NOT import or execute it.`,
        `Write the brief to ${args.briefPath} and report that exact path back.`,
        'Cite ONLY cleared, integrity-gate-passed results; every number in the brief must trace to a result artifact path.',
        'Every confirmatory claim states its interval; every exploratory claim is labelled exploratory in the same sentence; every amended analysis carries a visible amendment note.',
        'Include a limitations box drawn from threatsToValidity and the suppressed cells from disclosure control.',
      ],
      outputFormat: 'JSON with briefPath string, citedResultPaths array, recommendations array, limitationsBox array',
    },
    outputSchema: {
      type: 'object',
      required: ['briefPath', 'citedResultPaths'],
      properties: {
        briefPath: { type: 'string' },
        citedResultPaths: { type: 'array' },
        recommendations: { type: 'array' },
        limitationsBox: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'dissemination'],
}));

export const eslManuscriptTask = defineTask('esl.manuscript-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare manuscript: ${args.researchQuestion}`,
  agent: {
    name: 'quantitative-research-methodologist',
    skill: { name: 'academic-writing-publication' },
    prompt: {
      role: 'Manuscript preparer',
      task: 'Prepare the academic manuscript',
      context: args,
      instructions: [
        `Apply the methodology of ${args.playbook} as this phase's playbook — emulate its IMRaD/reporting-standard discipline; do NOT import or execute it.`,
        `Write the manuscript to ${args.manuscriptPath} and report that exact path back.`,
        `Cite the pre-registration (${args.registryId}) in the Methods section and include a Deviations-from-pre-registration subsection reproducing every entry from the adherence check — including deviations the PI approved as amendments and any reclassified-to-exploratory analyses. Omitting a deviation is the failure mode this workflow exists to prevent.`,
        'Report results for EVERY registered confirmatory specification, including null results — selective reporting is a conformance-critic failure.',
        'Include the IRB approval number and the consent procedure in the Methods section.',
      ],
      outputFormat: 'JSON with manuscriptPath string, deviationsSectionPresent boolean, reportedSpecIds array, nullResultsReported number',
    },
    outputSchema: {
      type: 'object',
      required: ['manuscriptPath', 'deviationsSectionPresent', 'reportedSpecIds'],
      properties: {
        manuscriptPath: { type: 'string' },
        deviationsSectionPresent: { type: 'boolean' },
        reportedSpecIds: { type: 'array' },
        nullResultsReported: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'dissemination'],
}));

export const eslPublicationPackageTask = defineTask('esl.publication-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble publication package: ${args.packageDir}`,
  agent: {
    name: 'quantitative-research-methodologist',
    prompt: {
      role: 'Publication packager',
      task: 'Assemble the auditable publication package',
      context: args,
      instructions: [
        `Assemble under ${args.packageDir}: the policy brief, the manuscript, the locked pre-registration document plus registryId, the adherence diff, the integrity-gate evidence appendix (per-critic executed evidence), the IRB determination record and approval number, the disclosure-control certificate, and a provenance page (runId, design family, IRB rounds used, gate attempts, every approval and its expert).`,
        'The appendix must let a reader audit any reported result and any deviation without access to this run.',
        'Include ONLY disclosure-cleared artifacts; a blocked artifact must not appear in the package.',
        'Report every file path written.',
      ],
      outputFormat: 'JSON with packageDir string, files array',
    },
    outputSchema: {
      type: 'object',
      required: ['packageDir', 'files'],
      properties: {
        packageDir: { type: 'string' },
        files: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'dissemination'],
}));

/**
 * Publication executor — invoked ONLY when the empirical-study.policy-brief-publication
 * breakpoint returned approved === true AND disclosure control cleared the release.
 * There is no alternate execution path.
 */
export const eslPublicationExecutorTask = defineTask('esl.publication-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved publication of ${args.packageDir}`,
  agent: {
    name: 'policy-research-analyst',
    prompt: {
      role: 'Publication executor',
      task: 'Execute the approved external publication of the brief and manuscript',
      context: args,
      instructions: [
        'Execute exactly the distribution described in the approval context under institutional attribution — nothing beyond it.',
        'IRON LAW: this task runs only under an approved===true policy gate (empirical-study.policy-brief-publication) AND a disclosure-control certificate with cleared===true present in the input. If either provenance is missing, REFUSE and report — do not publish.',
        'Record the executed commands and the resulting locations/URLs.',
      ],
      outputFormat: 'JSON with published boolean, locations array, commands array',
    },
    outputSchema: {
      type: 'object',
      required: ['published', 'locations'],
      properties: {
        published: { type: 'boolean' },
        locations: { type: 'array' },
        commands: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'esl', 'social-sciences', 'publish', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P11 — kip assert (kip-librarian skill, kind empirical-study)
// ---------------------------------------------------------------------------

export const eslKipAssertTask = defineTask('esl.kip-assert', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assert ${args.facts.length} empirical-study facts into kip`,
  agent: {
    name: 'kip-librarian',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Assert the orchestrator-built empirical-study facts into kip exactly as given',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        `Assert each provided node/edge EXACTLY as given (eids are deterministic: study:<runId>, construct:<runId>:<constructId>, instrument:<instrumentId>, spec:<runId>:<specId>, irb:<runId>, gate:<runId>:<gateId>) with kind \`empirical-study\`, passing --dir ${args.kipDir} --replica ${args.kipReplicaId} --json on every call — do not invent, merge, or reword facts.`,
        'status:"pending" echoes are BY DESIGN — never retry or report them as failures.',
        `Entity resolution, if any candidate match surfaces, uses \`kip resolve --model ${args.kipModel}\` and NEVER auto-merges — report candidates instead (merge approvals are routed breakpoints per the kip-librarian skill).`,
        'Report the asserted count and every failure with the raw CLI error — never swallow failures.',
      ],
      outputFormat: 'JSON with asserted number, failed array [{ fact, error }]',
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
  labels: ['agent', 'esl', 'social-sciences', 'kip'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    population,
    designFamilyHint = null,
    populations = [],
    registry = 'OSF',
    outputDir: outputDirInput,
    maxCollectionWaves = 4,
    maxParallelWaves = 2,
    maxAnalysisSpecs = 6,
    maxParallelAnalyses = 3,
    maxIrbRounds = 3,
    irbReadinessAutoApproveAfterN = 1,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    kipReplicaId: kipReplicaIdInput,
  } = inputs || {};

  if (typeof researchQuestion !== 'string' || researchQuestion.length === 0) {
    throw new Error(
      'empirical-study-lifecycle-workflow requires researchQuestion (non-empty string) — refusing to guess a research topic.'
    );
  }
  if (typeof population !== 'string' || population.length === 0) {
    throw new Error(
      'empirical-study-lifecycle-workflow requires population (non-empty string) — refusing to guess a study population; ' +
      'the population determines the IRB risk profile and the sampling frame.'
    );
  }

  const outputDir = outputDirInput ?? ctx.artifactsDir;
  const kipReplicaId = kipReplicaIdInput ?? `esl-${ctx.runId}`;
  const nowIso = () => new Date().toISOString();
  const startMs = ctx.now();

  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval is surfaced
  // here — fail-closed posture, nothing auto-approves silently.
  const autoApprovals = [];
  const artifacts = [];
  const timings = {};

  // All five policy-gated actions are ALWAYS present as keys; null means never raised.
  const approvals = {
    'empirical-study.pre-registration-submission': null,
    'empirical-study.irb-submission': null,
    'empirical-study.participant-recruitment-start': null,
    'empirical-study.analysis-plan-amendment': null,
    'empirical-study.policy-brief-publication': null,
  };

  const recordGate = (breakpointId, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto =
      result && (result.autoApproved === true || (result.metadata && result.metadata.autoApproved === true));
    if (auto) {
      autoApprovals.push({ breakpointId, phase, at: nowIso() });
    }
    return result;
  };

  let phaseStartMs = startMs;
  const markPhase = (name) => {
    const now = ctx.now();
    timings[name] = now - phaseStartMs;
    phaseStartMs = now;
  };

  // Mutable run state referenced by buildResult (every terminal return carries full state).
  let recall = {
    factCount: 0,
    insights: [],
    priorStudies: [],
    priorInstruments: [],
    priorDeterminations: [],
    storeInitialized: false,
  };
  let framing = null;
  let literature = null;
  let design = null;
  let instruments = { items: [], adaptationsApplied: [] };
  let designGate = null;
  let preregistration = {
    path: null,
    registeredSpecIds: [],
    locked: false,
    submitted: false,
    registryId: null,
    approval: null,
  };
  let irb = {
    protocolPath: null,
    rounds: [],
    approved: false,
    determination: null,
    roundsUsed: 0,
    exhausted: false,
    approval: null,
  };
  let recruitment = { approved: false, started: false, consentedCount: 0, approval: null };
  let collection = { waves: [], totalRecords: 0, datasetPath: null };
  let analysis = { specs: [], executedCount: 0 };
  let adherence = {
    conforming: [],
    deviations: [],
    amendmentRaised: false,
    amendmentApproved: false,
    amendmentApproval: null,
    exploratoryReclassified: [],
  };
  let integrityGate = null;
  let evaluation = { programEvaluationPath: null, policyImpactPath: null };
  let disclosure = { cleared: false, reidentificationRisk: null, suppressedFields: [], disclosurePath: null };
  let dissemination = {
    policyBriefPath: null,
    manuscriptPath: null,
    packageDir: null,
    approved: false,
    published: false,
    locations: [],
  };
  let kipFactsAsserted = 0;
  let designFamily = null;
  let waveCount = 0;
  let specCount = 0;
  let irbRoundsUsed = 0;

  const buildResult = (success, reason) => ({
    success,
    recall,
    framing,
    literature,
    design,
    instruments,
    designGate,
    preregistration,
    irb,
    recruitment,
    collection,
    analysis,
    adherence,
    integrityGate,
    evaluation,
    disclosure,
    dissemination,
    approvals,
    autoApprovals,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'social-sciences/empirical-study-lifecycle-workflow',
      runId: ctx.runId,
      designFamily,
      waveCount,
      specCount,
      irbRoundsUsed,
      breakpointsHit,
      timings,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall (prior studies, instruments, IRB precedents)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior empirical-study memory');
  if (kipEnabled) {
    recall = await ctx.task(eslKipRecallTask, {
      researchQuestion,
      population,
      kipDir,
      kipModel,
      kipReplicaId,
    });
  }
  // kipEnabled:false leaves the explicit opted-out literal above — never a defaulted value.
  markPhase('kip-recall');

  // -------------------------------------------------------------------------
  // P1 — construct definition + literature synthesis (independent lanes)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: construct definition + literature synthesis (parallel)');
  const synthesisPath = `${outputDir}/literature-synthesis-${ctx.runId}.md`;
  const [framingResult, literatureResult] = await ctx.parallel.all([
    () => ctx.task(eslQuestionConstructTask, {
      researchQuestion,
      population,
      recall,
    }),
    () => ctx.task(eslLiteratureSynthesisTask, {
      researchQuestion,
      population,
      synthesisPath,
      playbook: DISSEMINATION_PLAYBOOKS['literature-synthesis'],
      recall,
    }),
  ]);
  framing = framingResult;
  literature = {
    synthesisPath: literatureResult.synthesisPath,
    priorEffectSizes: literatureResult.priorEffectSizes,
    gaps: literatureResult.gaps ?? [],
  };
  artifacts.push(literatureResult.synthesisPath);
  markPhase('framing');

  // -------------------------------------------------------------------------
  // P2 — design-family selection (a genuine ctx-driven branch, not a fallback
  // chain: exactly one family playbook is selected up front by the selection
  // task's justified verdict) + design specification
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: design-family selection + design specification');
  const selection = await ctx.task(eslDesignSelectionTask, {
    researchQuestion,
    population,
    designFamilyHint,
    framing,
    literature,
    allowedDesignFamilies: ALLOWED_DESIGN_FAMILIES,
    allowedCollectionModes: ALLOWED_COLLECTION_MODES,
  });
  designFamily = assertDesignFamily(selection.family);
  const designPlaybook = DESIGN_PLAYBOOKS[designFamily];

  // The survey playbook is ADDITIVE and supplied only when a survey wave is expected;
  // its absence is a documented absence, not a default.
  const surveyPlanned =
    Array.isArray(selection.plannedCollectionModes) && selection.plannedCollectionModes.includes('survey');

  const designSpecPath = `${outputDir}/design-specification-${ctx.runId}.md`;
  const spec = await ctx.task(eslDesignSpecificationTask, {
    researchQuestion,
    population,
    family: designFamily,
    designPlaybook,
    ...(surveyPlanned ? { surveyPlaybook: SURVEY_DESIGN_PLAYBOOK } : {}),
    designSpecPath,
    framing,
    literature,
    selection,
    allowedCollectionModes: ALLOWED_COLLECTION_MODES,
    maxCollectionWaves,
  });
  validateWaves(spec.waves, maxCollectionWaves);
  waveCount = spec.waves.length;
  design = {
    family: designFamily,
    rationale: selection.rationale,
    playbook: designPlaybook,
    identificationStrategy: spec.identificationStrategy,
    powerAnalysis: spec.powerAnalysis,
    threatsToValidity: spec.threatsToValidity ?? [],
    designSpecPath: spec.designSpecPath,
  };
  artifacts.push(spec.designSpecPath);
  markPhase('design');

  // -------------------------------------------------------------------------
  // P3 — instrument development and validation (parallel lanes)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: instrument lanes (parallel)');
  const instrumentDir = `${outputDir}/instruments-${ctx.runId}`;
  const crossCulturalLaneRan = populations.length > 1;
  const crossCulturalAbsenceReason = crossCulturalLaneRan
    ? null
    : `cross-cultural adaptation lane did not run: populations has ${populations.length} entry/entries — measurement invariance across populations is undefined with a single population (a documented absence, not a skipped fallback).`;

  const lanes = [
    {
      laneName: 'scale-development',
      thunk: () => ctx.task(eslScaleDevelopmentTask, {
        playbook: INSTRUMENT_PLAYBOOKS['scale-development'],
        instrumentDir,
        constructCount: framing.constructs.length,
        constructs: framing.constructs,
        recall,
      }),
    },
    {
      laneName: 'pilot-psychometrics',
      thunk: () => ctx.task(eslPilotPsychometricsTask, {
        designFamily,
        instrumentDir,
        constructs: framing.constructs,
        designSpecPath: spec.designSpecPath,
      }),
    },
  ];
  if (crossCulturalLaneRan) {
    lanes.push({
      laneName: 'cross-cultural-adaptation',
      thunk: () => ctx.task(eslCrossCulturalAdaptationTask, {
        playbook: INSTRUMENT_PLAYBOOKS['cross-cultural-adaptation'],
        populations,
        instrumentDir,
        constructs: framing.constructs,
      }),
    });
  }
  const laneResults = await ctx.parallel.all(lanes.map((lane) => lane.thunk));
  // Index by laneName — the lane array is built conditionally, so a fixed arity is never assumed.
  const byLane = {};
  lanes.forEach((lane, i) => {
    byLane[lane.laneName] = laneResults[i];
  });
  const scaleLane = byLane['scale-development'];
  const pilotLane = byLane['pilot-psychometrics'];
  const adaptationLane = crossCulturalLaneRan ? byLane['cross-cultural-adaptation'] : null;

  const pilotByInstrument = {};
  for (const entry of pilotLane.results) {
    pilotByInstrument[entry.instrumentId] = entry;
  }
  instruments = {
    items: scaleLane.instruments.map((instrument) => ({
      instrumentId: instrument.instrumentId,
      constructId: instrument.constructId,
      kind: instrument.kind,
      path: instrument.path,
      reliability: pilotByInstrument[instrument.instrumentId] ?? null,
      validityEvidence: instrument.contentValidityEvidence ?? null,
    })),
    adaptationsApplied: adaptationLane ? adaptationLane.adaptations : [],
  };
  for (const instrument of scaleLane.instruments) {
    artifacts.push(instrument.path);
  }
  markPhase('instruments');

  // -------------------------------------------------------------------------
  // G1 — adversarial design-integrity gate (BEFORE the pre-registration lock)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'G1: adversarial design-integrity gate');
  const designIntegrityGate = await adversarialGate(ctx, {
    gateId: 'esl.design-integrity',
    artifact: {
      path: spec.designSpecPath,
      description: 'Study design specification, power analysis, and instrument set',
    },
    critics: [
      {
        name: 'construct-operationalization-critic',
        role: 'Construct validity reviewer',
        focus: 'every construct is measured by an instrument that actually measures it',
        instructions: [
          'IRON LAW: read the design specification and every instrument file from disk yourself; the drafting agents\' summaries are inadmissible. Evidence = the executed reads plus file:line citations.',
          'For each construct, diff the operational definition against the instrument items: an instrument measuring a neighbouring construct, a construct with no instrument, or an instrument with no construct is a failing issue { constructId, instrumentId, problem, requiredFix }.',
          'Check that every hypothesis names constructs that are actually measured — an untestable hypothesis is a failing issue.',
          GATE_PROMPT_TAIL,
        ],
      },
      {
        name: 'instrument-psychometrics-critic',
        role: 'Adversarial psychometrician',
        focus: 'reported reliability and factor structure are real and adequate',
        instructions: [
          'IRON LAW: RE-RUN the reliability and factor-structure computations yourself against the pilot data referenced in the specification; evidence MUST be your executed command plus a raw output excerpt per instrument. A coefficient you did not reproduce is not a coefficient.',
          'A reported coefficient you cannot reproduce, or that differs materially from the reported value, is a failing issue.',
          "pilotDataAvailable:false is a CAVEAT, not a silent pass: record it as an issue of severity 'caveat' naming the instruments with no psychometric evidence, so the PI sees it at the pre-registration gate.",
          'Also RE-RUN the power computation: check the assumed effect size against the literature lane\'s priorEffectSizes, and flag an assumed effect size with no cited source as a failing issue.',
          GATE_PROMPT_TAIL,
        ],
      },
    ],
    ironLaw: [
      'A PASS on any element without executed evidence is invalid — the combinator coerces evidence-empty passes to protocol failures.',
      'Judge the specification and instrument files on disk, not any agent\'s summary of them.',
      'This gate stands between a design and a public, permanent pre-registration: a design defect that passes here is locked in.',
    ],
    maxFixAttempts,
    fixer: {
      task: eslDesignIntegrityFixerTask,
      args: { constructs: framing.constructs, designFamily },
    },
    context: {
      designFamily,
      framing: { constructs: framing.constructs, hypotheses: framing.hypotheses },
      instruments: { scaleLane, pilotLane, adaptationLane },
      literature: { priorEffectSizes: literature.priorEffectSizes },
      crossCulturalLaneRan,
      crossCulturalAbsenceReason,
    },
  });
  designGate = {
    passed: designIntegrityGate.passed,
    attempts: designIntegrityGate.attempts,
    escalated: designIntegrityGate.escalated,
    issues: designIntegrityGate.issues,
    evidence: designIntegrityGate.evidence,
  };
  if (designIntegrityGate.escalated) {
    breakpointsHit.push('esl.design-integrity.gate-escalation');
  }
  if (designGate.passed !== true) {
    // Fail closed: nothing downstream runs.
    return buildResult(
      false,
      'esl.design-integrity gate failed — the design/instruments were never pre-registered and no participant was ever contacted'
    );
  }
  markPhase('design-integrity-gate');

  // -------------------------------------------------------------------------
  // P4 — pre-registration authoring + POLICY-GATED registry submission (LOCK)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: pre-registration authoring + submission policy gate');
  const preregistrationPath = `${outputDir}/pre-registration-${ctx.runId}.md`;
  const prereg = await ctx.task(eslPreregistrationAuthoringTask, {
    researchQuestion,
    population,
    registry,
    preregistrationPath,
    playbook: PREREGISTRATION_PLAYBOOK,
    framing,
    design,
    instruments,
    pilot: pilotLane,
    allowedAnalysisMethods: ALLOWED_ANALYSIS_METHODS,
  });
  preregistration = {
    path: prereg.preregistrationPath,
    registeredSpecIds: prereg.registeredSpecIds,
    locked: false,
    submitted: false,
    registryId: null,
    approval: null,
  };
  artifacts.push(prereg.preregistrationPath);

  const preregSignoff = await routedBreakpoint(ctx, {
    question: `Submit the pre-registration for '${researchQuestion}' to ${registry}? The timestamped analysis plan becomes permanently public and every later change is a visible amendment. (${design.family} design, ${prereg.registeredSpecIds.length} confirmatory specification(s), ${(framing.openAmbiguities ?? []).length} open ambiguity/ies, design-integrity gate attempts: ${designGate.attempts})`,
    context: {
      runId: ctx.runId,
      files: [prereg.preregistrationPath, design.designSpecPath, ...instruments.items.map((item) => item.path)],
      summary: {
        hypotheses: framing.hypotheses,
        openAmbiguities: framing.openAmbiguities ?? [],
        registeredSpecIds: prereg.registeredSpecIds,
        powerAnalysis: design.powerAnalysis,
        pilotDataAvailable: {
          available: pilotLane.pilotDataAvailable,
          reason: pilotLane.pilotDataAvailable === true ? null : 'no pilot data were available — reported as an honest absence by esl.pilot-psychometrics',
        },
        designGate,
      },
    },
  }, {
    breakpointId: 'empirical-study.pre-registration-submission',
    expert: 'principal-investigator',
    tags: ['policy-gated', 'social-sciences', 'pre-registration'],
    strategy: 'single',
  });
  recordGate('empirical-study.pre-registration-submission', 'P4', preregSignoff);
  approvals['empirical-study.pre-registration-submission'] = {
    approved: preregSignoff.approved === true,
    breakpointId: 'empirical-study.pre-registration-submission',
    expert: 'principal-investigator',
    response: preregSignoff.response ?? null,
  };
  preregistration = { ...preregistration, approval: approvals['empirical-study.pre-registration-submission'] };

  if (preregSignoff.approved !== true) {
    return buildResult(
      false,
      'pre-registration submission declined — the study is not locked and no participant was contacted'
    );
  }

  // The executor runs ONLY under this guard — there is no alternate submission path.
  const preregSubmission = await ctx.task(eslPreregSubmitExecutorTask, {
    registry,
    preregistrationPath: prereg.preregistrationPath,
    registeredSpecIds: prereg.registeredSpecIds,
    approval: {
      breakpointId: 'empirical-study.pre-registration-submission',
      approved: true,
      response: preregSignoff.response ?? null,
    },
  });
  preregistration = {
    ...preregistration,
    submitted: preregSubmission.submitted === true,
    registryId: preregSubmission.registryId,
    registryUrl: preregSubmission.registryUrl ?? null,
    locked: preregSubmission.submitted === true,
  };
  assertPreregistrationLocked(preregistration);
  markPhase('pre-registration');

  // -------------------------------------------------------------------------
  // P5 — ethics/IRB review with a BOUNDED revise-and-resubmit loop
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: IRB protocol authoring + bounded revise-and-resubmit loop');
  const consentDir = `${outputDir}/consent-${ctx.runId}`;
  const protocol = await ctx.task(eslIrbProtocolAuthoringTask, {
    researchQuestion,
    population,
    populations,
    protocolPath: `${outputDir}/irb-protocol-${ctx.runId}.md`,
    consentDir,
    design,
    preregistration,
    waves: spec.waves,
    instruments,
  });
  irb = { ...irb, protocolPath: protocol.protocolPath };
  artifacts.push(protocol.protocolPath);
  for (const consentPath of protocol.consentPaths) {
    artifacts.push(consentPath);
  }

  // The POLICY gate is raised EXACTLY ONCE (breakpointId must equal actionId, so it cannot be
  // per-round). It authorizes this protocol plus its bounded revisions; a submission after the
  // cap is a NEW authorization in a NEW run.
  const irbSignoff = await routedBreakpoint(ctx, {
    question: `Submit the ethics protocol for '${researchQuestion}' to the IRB on behalf of the institution? Risk level ${protocol.riskLevel}; vulnerable populations: ${(protocol.vulnerablePopulations ?? []).join(', ') || 'none identified'}; up to ${maxIrbRounds} revise-and-resubmit round(s) are authorized by this approval, after which the run FAILS.`,
    context: {
      runId: ctx.runId,
      files: [protocol.protocolPath, ...protocol.consentPaths, preregistration.path],
      summary: {
        riskLevel: protocol.riskLevel,
        vulnerablePopulations: protocol.vulnerablePopulations ?? [],
        openEthicsQuestions: protocol.openEthicsQuestions ?? [],
        registryId: preregistration.registryId,
        maxIrbRounds,
      },
    },
  }, {
    breakpointId: 'empirical-study.irb-submission',
    expert: 'principal-investigator',
    tags: ['policy-gated', 'social-sciences', 'ethics'],
    strategy: 'single',
  });
  recordGate('empirical-study.irb-submission', 'P5', irbSignoff);
  approvals['empirical-study.irb-submission'] = {
    approved: irbSignoff.approved === true,
    breakpointId: 'empirical-study.irb-submission',
    expert: 'principal-investigator',
    response: irbSignoff.response ?? null,
  };
  irb = { ...irb, approval: approvals['empirical-study.irb-submission'] };

  if (irbSignoff.approved !== true) {
    return buildResult(
      false,
      'IRB submission declined — the protocol was never submitted and no participant was contacted'
    );
  }

  let currentProtocolPath = protocol.protocolPath;
  let priorBoardComments = [];
  let priorDeterminationLetterPath = null;

  for (let round = 1; round <= maxIrbRounds; round++) {
    irbRoundsUsed = round;
    irb = { ...irb, roundsUsed: round };

    const readiness = await ctx.task(eslIrbReadinessCheckTask, {
      round,
      protocolPath: currentProtocolPath,
      consentPaths: protocol.consentPaths,
      preregistrationPath: preregistration.path,
      priorBoardComments,
      priorDeterminationLetterPath,
    });

    // The ONLY breakpoint in this process carrying autoApproveAfterN. It authorizes an
    // INTERNAL completeness judgement, never an external act — the external submission is
    // authorized by the once-raised empirical-study.irb-submission policy gate above.
    const readinessBreakpointId = `empirical-study.irb-readiness-check.round-${round}`;
    const readinessGate = await routedBreakpoint(ctx, {
      question: `Round ${round}: protocol package readiness — ${readiness.missingElements.length} missing element(s), ${(readiness.unaddressedBoardComments ?? []).length} unaddressed board comment(s). Approve to submit this round's package to the board?`,
      context: {
        runId: ctx.runId,
        round,
        files: [currentProtocolPath, ...(priorDeterminationLetterPath ? [priorDeterminationLetterPath] : [])],
        summary: { readiness },
      },
    }, {
      breakpointId: readinessBreakpointId,
      expert: 'research-ethics-coordinator',
      tags: ['social-sciences', 'ethics', 'readiness'],
      strategy: 'single',
      autoApproveAfterN: irbReadinessAutoApproveAfterN,
    });
    recordGate(readinessBreakpointId, 'P5', readinessGate);

    if (readinessGate.approved !== true) {
      // A rejected readiness check consumes a round — the cap still applies.
      irb.rounds.push({ round, readiness, submitted: false, determination: null, revisionPath: null });
      continue;
    }

    // Guarded by BOTH the once-raised policy approval AND this round's readiness approval.
    const submission = await ctx.task(eslIrbSubmitExecutorTask, {
      round,
      protocolPath: currentProtocolPath,
      consentPaths: protocol.consentPaths,
      priorBoardComments,
      approval: {
        breakpointId: 'empirical-study.irb-submission',
        approved: true,
        response: irbSignoff.response ?? null,
      },
      readinessApproval: {
        breakpointId: readinessBreakpointId,
        approved: true,
        response: readinessGate.response ?? null,
      },
    });

    const determinationRecord = await ctx.task(eslIrbDeterminationIngestTask, {
      round,
      submissionId: submission.submissionId,
      protocolPath: currentProtocolPath,
    });

    if (determinationRecord.determinationAvailable !== true) {
      // An honest pending state is not an approval. The round is recorded and consumed.
      irb.rounds.push({
        round,
        readiness,
        submitted: submission.submitted === true,
        determination: null,
        revisionPath: null,
      });
      continue;
    }

    const boardComments = determinationRecord.boardComments ?? [];
    let revisionPath = null;

    switch (determinationRecord.determination) {
      case 'approved':
        irb = {
          ...irb,
          approved: true,
          determination: 'approved',
          approvalNumber: determinationRecord.approvalNumber,
          expiresAt: determinationRecord.expiresAt ?? null,
          determinationLetterPath: determinationRecord.determinationLetterPath ?? null,
        };
        break;
      case 'disapproved':
        // Terminal: resubmitting a disapproved protocol is a NEW study, never a loop iteration.
        irb = { ...irb, approved: false, determination: 'disapproved' };
        break;
      case 'minor-revisions':
      case 'major-revisions':
      case 'deferred': {
        irb = { ...irb, determination: determinationRecord.determination };
        const revision = await ctx.task(eslIrbRevisionTask, {
          nextRound: round + 1,
          boardComments,
          revisionPath: `${outputDir}/irb-protocol-${ctx.runId}-r${round + 1}.md`,
          protocolPath: currentProtocolPath,
          preregistrationPath: preregistration.path,
        });
        revisionPath = revision.revisionPath;
        currentProtocolPath = revision.revisionPath;
        artifacts.push(revision.revisionPath);
        break;
      }
      default:
        throw new Error(
          `esl.irb-determination-ingest returned unknown determination ${JSON.stringify(determinationRecord.determination)} ` +
          '— allowed: approved, minor-revisions, major-revisions, deferred, disapproved. No default determination is applied.'
        );
    }

    priorBoardComments = boardComments;
    priorDeterminationLetterPath = determinationRecord.determinationLetterPath ?? null;
    irb.rounds.push({
      round,
      readiness,
      submitted: submission.submitted === true,
      determination: determinationRecord.determination,
      revisionPath,
    });

    if (determinationRecord.determination === 'approved' || determinationRecord.determination === 'disapproved') {
      break;
    }
  }

  if (irb.approved !== true) {
    // DELIBERATE DIVERGENCE from the style reference: contract-lifecycle-workflow.js offers a
    // general-counsel 'proceed with open terms' escalation when its bounded negotiation loop
    // exhausts. There is NO human-subjects analogue — proceeding without an approved protocol
    // is not a business risk decision, it is research misconduct. So the exhaustion path is a
    // terminal fail-closed return with the full round record and NO escalation breakpoint.
    irb = { ...irb, exhausted: true };
    return buildResult(
      false,
      `IRB approval not obtained after ${maxIrbRounds} round(s) — hard cap reached; no participant was contacted and no escalation path exists`
    );
  }
  markPhase('irb');

  // -------------------------------------------------------------------------
  // P6 — POLICY-GATED participant recruitment + parallel collection waves
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: recruitment policy gate + parallel data-collection waves');
  assertIrbApproved(irb);
  assertPreregistrationLocked(preregistration);

  const totalTargetN = spec.waves.reduce((sum, wave) => sum + wave.targetN, 0);
  const recruitmentSignoff = await routedBreakpoint(ctx, {
    question: `Begin recruiting and consenting participants for '${researchQuestion}'? IRB ${irb.approvalNumber} approved ${irb.determination} after ${irb.roundsUsed} round(s); ${spec.waves.length} collection wave(s) targeting ${totalTargetN} participant(s). Contact with participants CANNOT be undone.`,
    context: {
      runId: ctx.runId,
      files: [
        ...(irb.determinationLetterPath ? [irb.determinationLetterPath] : []),
        currentProtocolPath,
        ...protocol.consentPaths,
      ],
      summary: {
        irb: {
          approved: irb.approved,
          determination: irb.determination,
          approvalNumber: irb.approvalNumber,
          expiresAt: irb.expiresAt ?? null,
          roundsUsed: irb.roundsUsed,
        },
        waves: spec.waves.map((wave) => ({
          name: wave.name,
          mode: wave.mode,
          targetN: wave.targetN,
          samplingFrame: wave.samplingFrame,
        })),
        recruitmentScriptPath: currentProtocolPath,
      },
    },
  }, {
    breakpointId: 'empirical-study.participant-recruitment-start',
    expert: 'irb-liaison',
    tags: ['policy-gated', 'social-sciences', 'human-subjects'],
    strategy: 'single',
  });
  recordGate('empirical-study.participant-recruitment-start', 'P6', recruitmentSignoff);
  approvals['empirical-study.participant-recruitment-start'] = {
    approved: recruitmentSignoff.approved === true,
    breakpointId: 'empirical-study.participant-recruitment-start',
    expert: 'irb-liaison',
    response: recruitmentSignoff.response ?? null,
  };
  recruitment = { ...recruitment, approved: recruitmentSignoff.approved === true, approval: approvals['empirical-study.participant-recruitment-start'] };

  if (recruitmentSignoff.approved !== true) {
    return buildResult(false, 'participant recruitment declined — no participant was contacted');
  }

  // Defence in depth: the guard sits between the approval and the irreversible act, not only
  // at phase entry.
  assertIrbApproved(irb);

  const recruited = await ctx.task(eslRecruitmentExecutorTask, {
    waveCount: spec.waves.length,
    waves: spec.waves,
    protocolPath: currentProtocolPath,
    consentPaths: protocol.consentPaths,
    irb: { approved: true, determination: irb.determination, approvalNumber: irb.approvalNumber },
    approval: {
      breakpointId: 'empirical-study.participant-recruitment-start',
      approved: true,
      response: recruitmentSignoff.response ?? null,
    },
  });
  recruitment = {
    ...recruitment,
    started: recruited.started === true,
    consentedCount: recruited.consentedCount,
  };

  assertIrbApproved(irb);
  const waveDir = `${outputDir}/waves-${ctx.runId}`;
  const waveResults = await ctx.parallel.map(
    spec.waves,
    (wave) => ctx.task(eslDataCollectionWaveTask, {
      wave,
      playbook: COLLECTION_PLAYBOOKS[assertCollectionMode(wave.mode, wave.name)],
      waveDatasetPath: `${waveDir}/${wave.name}.json`,
      protocolPath: currentProtocolPath,
      irb: { approved: true, approvalNumber: irb.approvalNumber },
      instruments,
    }),
    { maxConcurrency: maxParallelWaves }
  );
  collection = {
    ...collection,
    waves: spec.waves.map((wave, i) => ({
      waveName: wave.name,
      mode: wave.mode,
      playbook: COLLECTION_PLAYBOOKS[wave.mode],
      recordCount: waveResults[i].recordCount,
      integrityFlags: waveResults[i].integrityFlags ?? [],
    })),
  };
  for (const waveResult of waveResults) {
    artifacts.push(waveResult.waveDatasetPath);
  }

  const datasetPath = `${outputDir}/analysis-dataset-${ctx.runId}.json`;
  const consolidated = await ctx.task(eslDataIntegrityConsolidationTask, {
    waveCount: spec.waves.length,
    waveResults,
    datasetPath,
    codebookPath: `${outputDir}/codebook-${ctx.runId}.md`,
    preregistrationPath: preregistration.path,
    exclusionRules: prereg.exclusionRules ?? [],
  });
  collection = {
    ...collection,
    totalRecords: consolidated.totalRecords,
    datasetPath: consolidated.datasetPath,
  };
  artifacts.push(consolidated.datasetPath);
  if (consolidated.codebookPath) {
    artifacts.push(consolidated.codebookPath);
  }
  if (consolidated.totalRecords === 0) {
    throw new Error(
      'Data consolidation produced zero records — a study with zero collected records cannot be analysed; the run fails rather than analysing an empty dataset.'
    );
  }
  markPhase('collection');

  // -------------------------------------------------------------------------
  // P7 — analysis execution + adherence check + CONDITIONAL amendment gate
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P7: analysis execution (parallel) + pre-registration adherence check');
  assertPreregistrationLocked(preregistration);

  if (!Array.isArray(prereg.exploratorySpecs)) {
    throw new Error(
      `esl.preregistration-authoring must declare exploratorySpecs as an array (got ${JSON.stringify(prereg.exploratorySpecs)}) — ` +
      'an undeclared exploratory set is not defaulted to empty; the authoring task owns that declaration.'
    );
  }
  const analysisSpecs = [
    ...prereg.confirmatorySpecs.map((confirmatorySpec) => ({ ...confirmatorySpec, confirmatory: true })),
    ...prereg.exploratorySpecs.map((exploratorySpec) => ({ ...exploratorySpec, confirmatory: false })),
  ];
  validateAnalysisSpecs(analysisSpecs, maxAnalysisSpecs, preregistration.registeredSpecIds);
  specCount = analysisSpecs.length;

  const analysisDir = `${outputDir}/analysis-${ctx.runId}`;
  const analysisResults = await ctx.parallel.map(
    analysisSpecs,
    (analysisSpec) => ctx.task(eslAnalysisExecutionTask, {
      spec: analysisSpec,
      playbook: ANALYSIS_PLAYBOOKS[assertAnalysisMethod(analysisSpec.method, analysisSpec.specId)],
      datasetPath: collection.datasetPath,
      codebookPath: consolidated.codebookPath,
      resultPath: `${analysisDir}/${analysisSpec.specId}-result.json`,
      scriptPath: `${analysisDir}/${analysisSpec.specId}-analysis.txt`,
      preregistrationPath: preregistration.path,
    }),
    { maxConcurrency: maxParallelAnalyses }
  );
  analysis = {
    specs: analysisSpecs.map((analysisSpec, i) => ({
      specId: analysisSpec.specId,
      method: analysisSpec.method,
      playbook: ANALYSIS_PLAYBOOKS[analysisSpec.method],
      registered: preregistration.registeredSpecIds.includes(analysisSpec.specId),
      confirmatory: analysisSpec.confirmatory === true,
      estimable: analysisResults[i].estimable === true,
      resultPath: analysisResults[i].resultPath ?? null,
      scriptPath: analysisResults[i].scriptPath ?? null,
      evidence: analysisResults[i].evidence,
    })),
    executedCount: analysisResults.filter((result) => result.estimable === true).length,
  };
  for (const result of analysisResults) {
    if (result.resultPath) {
      artifacts.push(result.resultPath);
    }
    if (result.scriptPath) {
      artifacts.push(result.scriptPath);
    }
  }

  const adherenceCheck = await ctx.task(eslPreregistrationAdherenceCheckTask, {
    registryId: preregistration.registryId,
    preregistrationPath: preregistration.path,
    registeredSpecIds: preregistration.registeredSpecIds,
    analysisSpecs,
    analysisResults,
    analysisDir,
  });
  adherence = {
    ...adherence,
    conforming: adherenceCheck.conforming,
    deviations: adherenceCheck.deviations,
    evidence: adherenceCheck.evidence,
  };

  let confirmatorySpecIds = analysisSpecs
    .filter((analysisSpec) => analysisSpec.confirmatory === true)
    .map((analysisSpec) => analysisSpec.specId);

  if (adherenceCheck.deviations.length > 0) {
    // CONDITIONAL: the only breakpoint whose existence depends on run data. Never auto-approved;
    // the full executed diff is always in context.
    const deviationSummary = adherenceCheck.deviations
      .map((deviation) => `${deviation.specId}:${deviation.dimension}`)
      .join(', ');
    const amendmentSignoff = await routedBreakpoint(ctx, {
      question: `Amend the locked pre-registration (${preregistration.registryId})? ${adherenceCheck.deviations.length} deviation(s) detected AFTER data were visible: ${deviationSummary}. Approving records a public amendment; rejecting reclassifies every deviating analysis as EXPLORATORY and removes it from the confirmatory set.`,
      context: {
        runId: ctx.runId,
        files: [
          preregistration.path,
          ...analysis.specs.map((entry) => entry.resultPath).filter((path) => typeof path === 'string'),
          ...analysis.specs.map((entry) => entry.scriptPath).filter((path) => typeof path === 'string'),
        ],
        summary: {
          deviations: adherenceCheck.deviations,
          conformingCount: adherenceCheck.conforming.length,
          adherenceEvidence: adherenceCheck.evidence,
        },
      },
    }, {
      breakpointId: 'empirical-study.analysis-plan-amendment',
      expert: 'principal-investigator',
      tags: ['policy-gated', 'social-sciences', 'pre-registration', 'amendment'],
      strategy: 'single',
    });
    recordGate('empirical-study.analysis-plan-amendment', 'P7', amendmentSignoff);
    approvals['empirical-study.analysis-plan-amendment'] = {
      approved: amendmentSignoff.approved === true,
      breakpointId: 'empirical-study.analysis-plan-amendment',
      expert: 'principal-investigator',
      response: amendmentSignoff.response ?? null,
    };
    adherence = {
      ...adherence,
      amendmentRaised: true,
      amendmentApproved: amendmentSignoff.approved === true,
      amendmentApproval: approvals['empirical-study.analysis-plan-amendment'],
    };

    if (amendmentSignoff.approved !== true) {
      // Documented downgrade of an already-executed analysis — never a path that lets an
      // unregistered analysis pass as confirmatory.
      const deviatingSpecIds = new Set(
        adherenceCheck.deviations
          .map((deviation) => deviation.specId)
          .filter((specId) => typeof specId === 'string' && specId.length > 0)
      );
      adherence = {
        ...adherence,
        exploratoryReclassified: confirmatorySpecIds.filter((specId) => deviatingSpecIds.has(specId)),
      };
      confirmatorySpecIds = confirmatorySpecIds.filter((specId) => !deviatingSpecIds.has(specId));
    }
  }

  if (confirmatorySpecIds.length === 0) {
    throw new Error(
      'No confirmatory analysis survived the pre-registration adherence check — the run fails rather than publishing exploratory results as confirmatory.'
    );
  }
  markPhase('analysis');

  // -------------------------------------------------------------------------
  // G2 — adversarial methodological-integrity gate
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'G2: adversarial methodological-integrity gate');
  const methodologicalGate = await adversarialGate(ctx, {
    gateId: 'esl.methodological-integrity',
    artifact: {
      path: analysisDir,
      description: 'Executed analysis results, analysis scripts, and the pre-registration adherence diff',
    },
    critics: [
      {
        name: 'methodological-validity-critic',
        role: 'Adversarial methodologist',
        focus: 'identification strategy, statistical power, and measurement invariance actually hold',
        instructions: [
          'IRON LAW: RE-RUN the checks yourself against the dataset and scripts on disk — the analysts\' reported diagnostics are inadmissible. Evidence MUST be your executed commands plus raw output excerpts, with file:line citations into the scripts.',
          'IDENTIFICATION: verify the estimated model actually identifies the claimed causal quantity given the assignment mechanism in the design specification (parallel trends, overlap/common support for propensity-score specs, exclusion restrictions, clustering of standard errors at the assignment level). RE-RUN the balance/overlap/assumption diagnostics; a claimed causal estimate whose identifying assumption fails your re-run is a failing issue.',
          'POWER: recompute achieved power from the realized N and the observed variance. A confirmatory null reported without an achieved-power statement, or an effect claimed from a specification your recomputation shows is underpowered to detect, is a failing issue.',
          'MEASUREMENT INVARIANCE: where results are compared across populations, RE-RUN the configural/metric/scalar invariance sequence from the adaptation lane\'s invariancePlan. A cross-population comparison made without established scalar invariance is a failing issue. If the cross-cultural lane did not run (single population), record that as evidence and do NOT invent an invariance verdict.',
          "Issues: { specId, dimension ('identification'|'power'|'invariance'), problem, executedCheck, requiredFix }.",
          GATE_PROMPT_TAIL,
        ],
      },
      {
        name: 'preregistration-conformance-critic',
        role: 'Adversarial pre-registration conformance auditor',
        focus: 'the analysis actually run matches the plan actually registered',
        instructions: [
          'IRON LAW: EXECUTE the diff yourself between the registered plan file and every analysis script and result file on disk. You may NOT rely on the adherence-check task\'s output — you are auditing it too. Evidence MUST be your executed diff/grep commands plus raw output excerpts.',
          'Cite file:line on BOTH sides of every finding: the registered text (preregistration file:line) and the actual code or result (script/result file:line).',
          'Failing issues: an unregistered analysis reported as confirmatory; a registered confirmatory analysis silently omitted from the reported set; a model, covariate set, DV, exclusion rule, missing-data handling, or inference criterion that differs from the registered text; a multiple-comparison correction registered but not applied; a deviation recorded by the adherence check but missing from the amendment record; an approved amendment not reflected in the results labelling.',
          "Also verify the adherence check itself: any deviation you find that the adherence check did not report is a failing issue against the adherence artifact, of dimension 'missed-deviation'.",
          'Issues: { specId, dimension, registeredAt (file:line), actualAt (file:line), problem, requiredFix }.',
          GATE_PROMPT_TAIL,
        ],
      },
    ],
    ironLaw: [
      'A PASS on any specification without an executed re-run or executed diff excerpt is invalid — the combinator coerces evidence-empty passes to protocol failures.',
      'Judge the scripts, results, dataset, and pre-registration files on disk; every self-report in this run is inadmissible, including the adherence check\'s.',
      'Selective reporting is a failure mode, not a stylistic choice: a null result registered as confirmatory and absent from the reported set is a failing issue.',
    ],
    maxFixAttempts,
    fixer: {
      task: eslMethodologicalIntegrityFixerTask,
      args: {
        preregistrationPath: preregistration.path,
        registeredSpecIds: preregistration.registeredSpecIds,
      },
    },
    context: {
      analysisSpecs: analysis.specs,
      datasetPath: collection.datasetPath,
      preregistrationPath: preregistration.path,
      registryId: preregistration.registryId,
      registeredSpecIds: preregistration.registeredSpecIds,
      designSpec: {
        identificationStrategy: design.identificationStrategy,
        powerAnalysis: design.powerAnalysis,
        threatsToValidity: design.threatsToValidity,
      },
      invariancePlan: adaptationLane ? adaptationLane.invariancePlan : null,
      invariancePlanAbsenceReason: crossCulturalAbsenceReason,
      adherence,
    },
  });
  integrityGate = {
    passed: methodologicalGate.passed,
    attempts: methodologicalGate.attempts,
    escalated: methodologicalGate.escalated,
    issues: methodologicalGate.issues,
    evidence: methodologicalGate.evidence,
  };
  if (methodologicalGate.escalated) {
    breakpointsHit.push('esl.methodological-integrity.gate-escalation');
  }
  if (integrityGate.passed !== true) {
    return buildResult(
      false,
      'esl.methodological-integrity gate failed — results were never evaluated, disclosed, or published'
    );
  }
  markPhase('methodological-integrity-gate');

  // -------------------------------------------------------------------------
  // P8 — program evaluation + policy impact assessment (parallel)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: program evaluation + policy impact assessment (parallel)');
  const evaluationPath = `${outputDir}/program-evaluation-${ctx.runId}.md`;
  const impactPath = `${outputDir}/policy-impact-${ctx.runId}.md`;
  const [programEvaluation, policyImpact] = await ctx.parallel.all([
    () => ctx.task(eslProgramEvaluationTask, {
      researchQuestion,
      population,
      evaluationPath,
      playbook: DISSEMINATION_PLAYBOOKS['program-evaluation'],
      analysis,
      adherence,
      confirmatorySpecIds,
      integrityGate,
      threatsToValidity: design.threatsToValidity,
    }),
    () => ctx.task(eslPolicyImpactAssessmentTask, {
      researchQuestion,
      population,
      populations,
      impactPath,
      playbook: DISSEMINATION_PLAYBOOKS['policy-impact'],
      analysis,
      adherence,
      confirmatorySpecIds,
      integrityGate,
      invariancePlan: adaptationLane ? adaptationLane.invariancePlan : null,
      invariancePlanAbsenceReason: crossCulturalAbsenceReason,
    }),
  ]);
  evaluation = {
    programEvaluationPath: programEvaluation.evaluationPath,
    policyImpactPath: policyImpact.impactPath,
  };
  artifacts.push(programEvaluation.evaluationPath);
  artifacts.push(policyImpact.impactPath);
  markPhase('evaluation');

  // -------------------------------------------------------------------------
  // P9 — participant-data disclosure control (hard precondition)
  //
  // The orchestration brief's 'participant-data-release' concern is enforced
  // structurally rather than as a sixth actionId (breakpointId MUST equal actionId and the
  // item's authoritative list has exactly five): (a) the irb-liaison-gated recruitment/consent
  // boundary in P6, (b) this throwing disclosure-control precondition, and (c) the disclosure
  // summary embedded in the department-chair publication gate context in P10.
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P9: participant-data disclosure control');
  const candidateArtifacts = [
    collection.datasetPath,
    ...(consolidated.codebookPath ? [consolidated.codebookPath] : []),
    evaluation.programEvaluationPath,
    evaluation.policyImpactPath,
    ...analysis.specs.map((entry) => entry.resultPath).filter((path) => typeof path === 'string'),
  ];
  const disclosureResult = await ctx.task(eslDisclosureControlTask, {
    candidateArtifacts,
    protocolPath: currentProtocolPath,
    consentPaths: protocol.consentPaths,
    disclosurePath: `${outputDir}/disclosure-certificate-${ctx.runId}.md`,
    population,
    populations,
  });
  disclosure = {
    cleared: disclosureResult.cleared === true,
    reidentificationRisk: disclosureResult.reidentificationRisk,
    suppressedFields: disclosureResult.suppressedFields ?? [],
    suppressedCells: disclosureResult.suppressedCells ?? [],
    blockedArtifacts: disclosureResult.blockedArtifacts ?? [],
    disclosurePath: disclosureResult.disclosurePath,
  };
  artifacts.push(disclosureResult.disclosurePath);
  if (disclosure.cleared !== true) {
    // No override breakpoint exists: a 'release anyway' affordance would be exactly the
    // degraded proceed-anyway path this workflow forbids. The publication gate is NEVER raised.
    return buildResult(
      false,
      'participant-data disclosure control not cleared — no brief, manuscript, or package leaves the institution'
    );
  }
  markPhase('disclosure');

  // -------------------------------------------------------------------------
  // P10 — brief + manuscript (parallel), package, POLICY-GATED publication
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P10: policy brief + manuscript (parallel), package, publication policy gate');
  const briefPath = `${outputDir}/policy-brief-${ctx.runId}.md`;
  const manuscriptPath = `${outputDir}/manuscript-${ctx.runId}.md`;
  const [brief, manuscript] = await ctx.parallel.all([
    () => ctx.task(eslPolicyBriefTask, {
      researchQuestion,
      population,
      briefPath,
      playbook: DISSEMINATION_PLAYBOOKS['policy-brief'],
      analysis,
      adherence,
      confirmatorySpecIds,
      disclosure,
      evaluation,
      threatsToValidity: design.threatsToValidity,
    }),
    () => ctx.task(eslManuscriptTask, {
      researchQuestion,
      population,
      manuscriptPath,
      playbook: DISSEMINATION_PLAYBOOKS['manuscript'],
      registryId: preregistration.registryId,
      preregistrationPath: preregistration.path,
      analysis,
      adherence,
      confirmatorySpecIds,
      irb: { approvalNumber: irb.approvalNumber, determination: irb.determination },
      disclosure,
    }),
  ]);
  dissemination = {
    ...dissemination,
    policyBriefPath: brief.briefPath,
    manuscriptPath: manuscript.manuscriptPath,
  };
  artifacts.push(brief.briefPath);
  artifacts.push(manuscript.manuscriptPath);

  const packageDir = `${outputDir}/publication-${ctx.runId}`;
  const pkg = await ctx.task(eslPublicationPackageTask, {
    packageDir,
    briefPath: brief.briefPath,
    manuscriptPath: manuscript.manuscriptPath,
    preregistrationPath: preregistration.path,
    registryId: preregistration.registryId,
    adherence,
    integrityGate,
    irb,
    disclosure,
    approvals,
    runId: ctx.runId,
    designFamily,
  });
  dissemination = { ...dissemination, packageDir: pkg.packageDir };
  for (const file of pkg.files) {
    artifacts.push(file);
  }

  const confirmatoryCount = confirmatorySpecIds.length;
  const publicationSignoff = await routedBreakpoint(ctx, {
    question: `Publish the policy brief and manuscript for '${researchQuestion}' externally under institutional attribution? ${confirmatoryCount} confirmatory result(s), ${adherence.exploratoryReclassified.length} reclassified-exploratory, ${adherence.deviations.length} recorded deviation(s), re-identification risk ${disclosure.reidentificationRisk}, integrity-gate attempts ${integrityGate.attempts}.`,
    context: {
      runId: ctx.runId,
      files: [brief.briefPath, manuscript.manuscriptPath, ...pkg.files],
      summary: {
        // The participant-data release summary the chair signs against.
        disclosure: {
          cleared: disclosure.cleared,
          reidentificationRisk: disclosure.reidentificationRisk,
          suppressedFields: disclosure.suppressedFields,
          suppressedCells: disclosure.suppressedCells,
        },
        adherence: {
          deviations: adherence.deviations,
          amendmentRaised: adherence.amendmentRaised,
          amendmentApproved: adherence.amendmentApproved,
          exploratoryReclassified: adherence.exploratoryReclassified,
        },
        integrityGate,
        irb: {
          approvalNumber: irb.approvalNumber,
          determination: irb.determination,
          expiresAt: irb.expiresAt ?? null,
        },
        preregistration: {
          registryId: preregistration.registryId,
          registryUrl: preregistration.registryUrl ?? null,
        },
      },
    },
  }, {
    breakpointId: 'empirical-study.policy-brief-publication',
    expert: 'department-chair',
    tags: ['policy-gated', 'social-sciences', 'publication'],
    strategy: 'single',
  });
  recordGate('empirical-study.policy-brief-publication', 'P10', publicationSignoff);
  approvals['empirical-study.policy-brief-publication'] = {
    approved: publicationSignoff.approved === true,
    breakpointId: 'empirical-study.policy-brief-publication',
    expert: 'department-chair',
    response: publicationSignoff.response ?? null,
  };
  dissemination = { ...dissemination, approved: publicationSignoff.approved === true };

  if (publicationSignoff.approved === true) {
    // The executor runs ONLY under this guard — there is no alternate publish path.
    const published = await ctx.task(eslPublicationExecutorTask, {
      packageDir: pkg.packageDir,
      briefPath: brief.briefPath,
      manuscriptPath: manuscript.manuscriptPath,
      disclosureCertificate: { cleared: true, path: disclosure.disclosurePath },
      approval: {
        breakpointId: 'empirical-study.policy-brief-publication',
        approved: true,
        response: publicationSignoff.response ?? null,
      },
    });
    dissemination = {
      ...dissemination,
      published: published.published === true,
      locations: published.locations,
    };
  } else {
    // Rejected: the package remains on disk, nothing distributes, the response is recorded —
    // the run ends success:false after the kip assert below.
    ctx.log?.('info', 'P10: policy-brief-publication rejected — package retained on disk, nothing distributed');
  }
  markPhase('dissemination');

  // -------------------------------------------------------------------------
  // P11 — deterministic kip assert (facts built by the orchestrator, never
  // agents). Runs even when the publication gate was rejected.
  // -------------------------------------------------------------------------
  if (kipEnabled) {
    ctx.log?.('info', 'P11: kip assert of study, construct, instrument, spec, IRB, and gate facts');
    const facts = [];
    facts.push({
      type: 'node',
      eid: `study:${ctx.runId}`,
      kind: 'empirical-study',
      props: {
        researchQuestion,
        population,
        designFamily,
        registryId: preregistration.registryId,
        irbApprovalNumber: irb.approvalNumber,
        irbRoundsUsed: irb.roundsUsed,
        confirmatorySpecCount: confirmatorySpecIds.length,
        deviationCount: adherence.deviations.length,
        amendmentApproved: adherence.amendmentApproved,
        published: dissemination.published,
        runId: ctx.runId,
      },
    });
    for (const construct of framing.constructs) {
      facts.push({
        type: 'node',
        eid: `construct:${ctx.runId}:${construct.constructId}`,
        kind: 'empirical-study',
        props: {
          label: construct.label,
          conceptualDefinition: construct.conceptualDefinition,
          operationalDefinition: construct.operationalDefinition,
          runId: ctx.runId,
        },
      });
    }
    for (const instrument of instruments.items) {
      // instrument eids are NOT run-scoped: instruments are reusable across studies, which is
      // the point of recalling priorInstruments.
      facts.push({
        type: 'node',
        eid: `instrument:${instrument.instrumentId}`,
        kind: 'empirical-study',
        props: {
          kind: instrument.kind,
          alpha: instrument.reliability ? instrument.reliability.alpha : null,
          omega: instrument.reliability ? instrument.reliability.omega : null,
          invarianceEstablished: crossCulturalLaneRan,
          lastValidatedAt: nowIso(),
          runId: ctx.runId,
        },
      });
      facts.push({
        type: 'edge',
        kind: 'measures',
        from: `instrument:${instrument.instrumentId}`,
        to: `construct:${ctx.runId}:${instrument.constructId}`,
      });
    }
    for (let i = 0; i < analysisSpecs.length; i++) {
      const analysisSpec = analysisSpecs[i];
      const result = analysisResults[i];
      const deviationDimensions = adherenceCheck.deviations
        .filter((deviation) => deviation.specId === analysisSpec.specId)
        .map((deviation) => deviation.dimension);
      facts.push({
        type: 'node',
        eid: `spec:${ctx.runId}:${analysisSpec.specId}`,
        kind: 'empirical-study',
        props: {
          method: analysisSpec.method,
          confirmatory: confirmatorySpecIds.includes(analysisSpec.specId),
          conformed: deviationDimensions.length === 0,
          deviationDimensions,
          estimate: result.estimate ?? null,
          ci: result.estimate ? result.estimate.ci ?? null : null,
          n: result.estimate ? result.estimate.n ?? null : null,
          runId: ctx.runId,
        },
      });
      facts.push({
        type: 'edge',
        kind: 'registered-in',
        from: `spec:${ctx.runId}:${analysisSpec.specId}`,
        to: `study:${ctx.runId}`,
      });
      // A spec names the construct it tests when the registered plan declared one; a spec
      // without a declared constructId gets no `tests` edge rather than an invented one.
      if (typeof analysisSpec.constructId === 'string' && analysisSpec.constructId.length > 0) {
        facts.push({
          type: 'edge',
          kind: 'tests',
          from: `spec:${ctx.runId}:${analysisSpec.specId}`,
          to: `construct:${ctx.runId}:${analysisSpec.constructId}`,
        });
      }
    }
    facts.push({
      type: 'node',
      eid: `irb:${ctx.runId}`,
      kind: 'empirical-study',
      props: {
        determination: irb.determination,
        roundsUsed: irb.roundsUsed,
        riskLevel: protocol.riskLevel,
        vulnerablePopulations: protocol.vulnerablePopulations ?? [],
        approvalNumber: irb.approvalNumber,
      },
    });
    facts.push({
      type: 'edge',
      kind: 'approved-by',
      from: `study:${ctx.runId}`,
      to: `irb:${ctx.runId}`,
    });
    facts.push({
      type: 'node',
      eid: `gate:${ctx.runId}:esl.design-integrity`,
      kind: 'empirical-study',
      props: { passed: designGate.passed, attempts: designGate.attempts, escalated: designGate.escalated },
    });
    facts.push({
      type: 'node',
      eid: `gate:${ctx.runId}:esl.methodological-integrity`,
      kind: 'empirical-study',
      props: { passed: integrityGate.passed, attempts: integrityGate.attempts, escalated: integrityGate.escalated },
    });

    const asserted = await ctx.task(eslKipAssertTask, {
      facts,
      kipDir,
      kipModel,
      kipReplicaId,
    });
    kipFactsAsserted = asserted.asserted;
  }
  markPhase('kip-assert');
  timings.total = ctx.now() - startMs;

  if (dissemination.approved !== true) {
    return buildResult(
      false,
      'policy-brief-publication gate rejected — study completed and packaged but never distributed (fail-closed)'
    );
  }
  return buildResult(dissemination.published === true);
}
