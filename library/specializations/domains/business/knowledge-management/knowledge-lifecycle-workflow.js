/**
 * @process specializations/domains/business/knowledge-management/knowledge-lifecycle-workflow
 * @description Flagship organizational knowledge lifecycle: kip corpus recall -> multi-method
 *   knowledge intake (the capture point-tasks as lane playbooks) -> curation into candidate
 *   knowledge assets -> parallel per-candidate dedupe (kip recall against the live corpus) +
 *   enrichment + taxonomy classification -> adversarial accuracy-and-freshness gate whose critics
 *   EXECUTE their checks (open every cited source, re-run the kip recall, diff against the live
 *   corpus) -> merge adjudication -> policy-gated taxonomy change -> policy-gated publish to the
 *   shared KB -> conditional policy-gated external exposure -> decay monitoring that reads this
 *   process's own prior kip assertions -> policy-gated retirement/supersession -> deterministic
 *   kip assert of every published and retired asset (kind `knowledge-asset`).
 * @inputs {
 *   knowledgeDomain: string (required, non-empty) — the subject domain being curated; keys the kip corpus recall,
 *   intakeSources: Array<{ name (kebab-case, unique), method (one of INTAKE_METHODS), subject, participants?, artifacts? }> (required, non-empty) — validated by validateIntakeSources, never repaired,
 *   corpusDir?: string (default 'artifacts/knowledge-base') — the live corpus root the critics diff against,
 *   outputDir?: string (default ctx.artifactsDir),
 *   externalExposureRequested?: boolean (default false),
 *   retentionPolicy?: { staleAfterDays?: number (default 365), reviewAfterDays?: number (default 180) },
 *   maxIntakeSources?: number (default 6),
 *   maxParallelLanes?: number (default 3, ctx.parallel.map concurrency),
 *   maxFixAttempts?: number (default 2, per gate),
 *   kipEnabled?: boolean (default true — kipEnabled:false THROWS; this flagship never runs blind),
 *   kipDir?: string (default '.a5c/kip'),
 *   kipModel?: string (default 'sonnet'),
 *   kipReplicaId?: string (default `klw-${ctx.runId}`)
 * }
 * @outputs {
 *   success: boolean,
 *   intake: [{ source, method, unitCount, evidenceCount }],
 *   curation: { candidateBundlePath, candidateCount, mergedCount },
 *   candidates: [{ artifactId, title, dedupe, enrichment, classification }],
 *   accuracyFreshnessGate: { passed, attempts, escalated, issues, evidence },
 *   adjudication: { publishReady: array, needsMerge: array, rejected: array, supersedes: array },
 *   taxonomyChange: { required, branch, impactedArtifactCount, approved, autoApproved, executed, response } | null,
 *   publication: { packagePath, approved, published, locations, signoffResponse },
 *   externalExposure: { requested, approved, exposed, surfaces, response } | null,
 *   decay: { scannedAssetCount, priorAssertionCount, decisions: [{ artifactId, decision, rationale, evidence }] },
 *   retentionAuditGate: { passed, attempts, escalated, issues, evidence } | null,
 *   retirement: { proposed: array, approved, executed, retired: array, response } | null,
 *   gatedActions: { publishToSharedKb, retireArtifact, externalExposure, taxonomyChange } — each
 *     { actionId, required, approved, autoApproved, response, executed }; skipped conditional gates
 *     are recorded as required:false, never omitted,
 *   kipFactsAsserted: number,
 *   autoApprovals: Array<{ breakpointId, phase, at }> (ALWAYS present, possibly empty — fail-closed surfacing),
 *   artifacts: array,
 *   metadata: { processId, runId, knowledgeDomain, candidateCount, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:knowledge-management]
 *   specializations: [specialization:knowledge-management]
 *   skillAreas: [skill-area:knowledge-management, skill-area:docs-as-code, skill-area:orchestration-loop]
 *   topics: [topic:quality-assurance, topic:developer-experience]
 *   roles: [role:knowledge-manager, role:information-architect, role:knowledge-curator]
 *   workflows: [workflow:knowledge-lifecycle]
 * @policyGatedActions [
 *   { actionId: 'knowledge-lifecycle.publish-to-shared-kb', description: 'Publish a knowledge artifact to the organization-wide knowledge base where it becomes an authoritative reference.', expert: 'knowledge-manager' },
 *   { actionId: 'knowledge-lifecycle.retire-artifact', description: 'Retire, supersede, or delete an existing knowledge artifact; loss of institutional memory is not recoverable.', expert: 'knowledge-manager' },
 *   { actionId: 'knowledge-lifecycle.external-exposure', description: 'Expose internal knowledge to an external or customer-facing surface.', expert: 'communications-lead' },
 *   { actionId: 'knowledge-lifecycle.taxonomy-change', description: 'Change the governing taxonomy/ontology, which re-classifies every artifact already filed under the affected branch.', expert: 'information-architect' }
 * ]
 *
 * Breakpoints (sparse by design): exactly the four policy-gated routed breakpoints above (three
 * of them conditional) plus the combinator-internal gate escalations
 * ('klw.accuracy-freshness.gate-escalation' / 'klw.retention-audit.gate-escalation', expert
 * 'owner', tags ['quality-gate','escalation',<gateId>]) that fire only when a gate's fix budget
 * is exhausted. Those escalations are not policy-gated actions. There is no interview breakpoint:
 * the intake sources are a required, validated input, so there is nothing ambiguous to interview
 * about; ambiguity inside a source surfaces as openGaps and rides into the publish breakpoint.
 *
 * Hard rules: breakpointId equals actionId for all four; every executor is guarded by
 * approved === true via assertApproved() and there is NO alternate execution path; harness
 * auto-approvals are recorded raw in outputs.autoApprovals and outputs.gatedActions. Style-A
 * agent tasks only (zero kind:'shell'). NO fallbacks: assertIntakeMethod / validateIntakeSources /
 * validateCandidates / assertRetentionDecision / assertKipStoreAvailable all THROW; an unavailable
 * or uninitialized kip store is a surfaced failure, never an empty-corpus silent pass; an empty
 * candidate bundle throws instead of publishing nothing; adjudication promoting a candidate past
 * an unresolved critic issue throws. kip facts are built DETERMINISTICALLY by the orchestrator —
 * agents never invent facts. Publication, external exposure, taxonomy change and retirement all
 * have NO autoApproveAfterN.
 *
 * Flagship consumer of the kip-librarian skill
 * (library/specializations/shared/skills/kip-librarian/SKILL.md), kind `knowledge-asset`.
 * kipRecall at intake AND inside the per-candidate dedupe lane; kipAssert at publish AND at
 * retire, so the next run's decay monitoring reads this run's own assertions.
 *
 * Composes BY NAME (as prompt playbooks, never imported and never executed):
 * critical-knowledge-identification.js, expert-knowledge-elicitation.js,
 * tacit-to-explicit-conversion.js, project-knowledge-capture.js,
 * lessons-learned-documentation.js, after-action-review.js, knowledge-transfer-succession.js
 * (intake methods); knowledge-base-content.js, knowledge-base-quality-assurance.js (curation +
 * enrichment); taxonomy-metadata-governance.js, enterprise-knowledge-base-architecture.js,
 * search-optimization.js (classification + placement); knowledge-lifecycle-management.js,
 * knowledge-audit-assessment.js (decay + retention); lessons-learned-integration.js,
 * continuous-improvement-integration.js (feedback loop into the next cycle). All 16 files live
 * in this directory.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  KIP_CLI_NOTE,
} from '../../../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Module constants — intake methods, composed playbooks, kip notes, validators
// ---------------------------------------------------------------------------

/**
 * The only intake methods an intake source may declare. assertIntakeMethod throws on
 * anything else — there is no default method (fallbacks forbidden).
 */
export const INTAKE_METHODS = Object.freeze([
  'critical-knowledge-identification',
  'expert-elicitation',
  'tacit-to-explicit',
  'project-capture',
  'lessons-learned',
  'after-action-review',
  'succession-transfer',
]);

/**
 * Method -> playbook file map interpolated into intake prompts ('apply the methodology of
 * <file> as this lane's playbook — emulate its structure; do NOT import or execute it').
 * Every method has an entry, so INTAKE_PLAYBOOKS[method] is never undefined once
 * assertIntakeMethod has passed — there is no null-playbook case in this process.
 */
export const INTAKE_PLAYBOOKS = Object.freeze({
  'critical-knowledge-identification':
    'library/specializations/domains/business/knowledge-management/critical-knowledge-identification.js',
  'expert-elicitation':
    'library/specializations/domains/business/knowledge-management/expert-knowledge-elicitation.js',
  'tacit-to-explicit':
    'library/specializations/domains/business/knowledge-management/tacit-to-explicit-conversion.js',
  'project-capture':
    'library/specializations/domains/business/knowledge-management/project-knowledge-capture.js',
  'lessons-learned':
    'library/specializations/domains/business/knowledge-management/lessons-learned-documentation.js',
  'after-action-review':
    'library/specializations/domains/business/knowledge-management/after-action-review.js',
  'succession-transfer':
    'library/specializations/domains/business/knowledge-management/knowledge-transfer-succession.js',
});

/** Article-shape and quality-bar playbooks named in the curation and enrichment prompts. */
export const CURATION_PLAYBOOKS = Object.freeze([
  'library/specializations/domains/business/knowledge-management/knowledge-base-content.js',
  'library/specializations/domains/business/knowledge-management/knowledge-base-quality-assurance.js',
]);

/** Facet-model, KB-architecture and findability playbooks for classification and placement. */
export const CLASSIFICATION_PLAYBOOKS = Object.freeze([
  'library/specializations/domains/business/knowledge-management/taxonomy-metadata-governance.js',
  'library/specializations/domains/business/knowledge-management/enterprise-knowledge-base-architecture.js',
  'library/specializations/domains/business/knowledge-management/search-optimization.js',
]);

/** Decay/retention and feedback-loop playbooks named in the decay-scan prompt. */
export const LIFECYCLE_PLAYBOOKS = Object.freeze([
  'library/specializations/domains/business/knowledge-management/knowledge-lifecycle-management.js',
  'library/specializations/domains/business/knowledge-management/knowledge-audit-assessment.js',
  'library/specializations/domains/business/knowledge-management/lessons-learned-integration.js',
  'library/specializations/domains/business/knowledge-management/continuous-improvement-integration.js',
]);

/**
 * The only retention verdicts the decay scan may emit. assertRetentionDecision throws on
 * anything else — there is no default verdict for an asset the scan could not classify.
 * 'supersede' and 'retire' are the two that route the knowledge-lifecycle.retire-artifact gate.
 */
export const RETENTION_DECISIONS = Object.freeze(['retain', 'refresh', 'supersede', 'retire']);

/** The single kip kind for every node and edge this process asserts. */
export const KIP_KIND = 'knowledge-asset';

/**
 * Prepended (together with the imported KIP_CLI_NOTE) to EVERY kip-touching prompt — names
 * the kip-librarian skill explicitly, as the flagship consumer must.
 */
export const KIP_LIBRARIAN_NOTE =
  'Follow the kip-librarian skill (library/specializations/shared/skills/kip-librarian/SKILL.md) exactly: every command needs --dir, --replica (reads too), --json; writes need <dir>/keyring.json; recall requires --k; resolve requires explicit --model sonnet; an assert echo of status:"pending" is BY DESIGN, never a failure. For THIS process an unreachable or uninitialized store is a hard failure to surface — never report an empty corpus as a clean dedupe.';

/**
 * The verdict shape pinned as the LAST instruction of every critic prompt. Trailing
 * placement is what eliminates verdict-schema drift.
 */
const VERDICT_SCHEMA_PIN =
  'Return ONLY this JSON shape: {"passed": boolean, "issues": [{"artifactId": string, "severity": string, "description": string, "location": string, "requiredFix": string}], "evidence": [string]} — evidence entries are file:line citations or executed-command output excerpts (fact-ids/eids for kip findings). passed:true with an empty evidence array will be rejected.';

/** Source names and artifactIds key task titles and deterministic kip eids. */
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------------------------------------------------------------------------
// Throwing helpers — every unknown or missing value is a failure, never a default
// ---------------------------------------------------------------------------

/**
 * Throws on any method outside INTAKE_METHODS — no default method exists.
 *
 * @param {string} method - The declared intake method
 * @param {string} sourceName - The source's name (for the error message)
 * @returns {string} The method, unchanged, when it is allowed
 */
export function assertIntakeMethod(method, sourceName) {
  if (!INTAKE_METHODS.includes(method)) {
    throw new Error(
      `Intake source '${sourceName}' declares unknown method ${JSON.stringify(method)}. ` +
      `Allowed methods: ${INTAKE_METHODS.join(' | ')} — no default method is applied.`
    );
  }
  return method;
}

/**
 * Throwing intake-source validator (no fallback, no repair, no truncation). Throws on:
 * a non-array or empty list, more sources than maxIntakeSources, a non-kebab-case or
 * duplicate name, an unknown method, or a missing subject.
 *
 * @param {Array<object>} sources - The declared intake sources
 * @param {number} maxIntakeSources - Upper bound on source count
 * @returns {Array<object>} The sources, unchanged, when valid
 */
export function validateIntakeSources(sources, maxIntakeSources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error(
      'validateIntakeSources: intakeSources is empty — an empty intake is a capture failure, never repaired and never defaulted.'
    );
  }
  if (sources.length > maxIntakeSources) {
    throw new Error(
      `validateIntakeSources: ${sources.length} intake sources exceed maxIntakeSources ${maxIntakeSources} — the intake is rejected, never truncated.`
    );
  }
  const seen = new Set();
  for (const source of sources) {
    if (!source || typeof source.name !== 'string' || !KEBAB_CASE.test(source.name)) {
      throw new Error(
        `validateIntakeSources: source name ${JSON.stringify(source && source.name)} is not kebab-case — source names key task titles and unit ids.`
      );
    }
    if (seen.has(source.name)) {
      throw new Error(`validateIntakeSources: duplicate source name '${source.name}' — source names must be unique.`);
    }
    seen.add(source.name);
    assertIntakeMethod(source.method, source.name);
    if (typeof source.subject !== 'string' || source.subject.length === 0) {
      throw new Error(
        `validateIntakeSources: source '${source.name}' is missing its subject — no subject is synthesized for it.`
      );
    }
  }
  return sources;
}

/**
 * Throwing candidate validator. artifactId uniqueness matters because it keys the
 * deterministic kip eid — a duplicate or malformed id would collide two facts.
 *
 * @param {Array<object>} candidates - The curator's candidate knowledge assets
 * @returns {Array<object>} The candidates, unchanged, when valid
 */
export function validateCandidates(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error(
      'validateCandidates: curation produced zero candidates — an empty curation is a capture failure, not a publishable no-op.'
    );
  }
  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || typeof candidate.artifactId !== 'string' || !KEBAB_CASE.test(candidate.artifactId)) {
      throw new Error(
        `validateCandidates: artifactId ${JSON.stringify(candidate && candidate.artifactId)} is not kebab-case — artifactIds key the deterministic kip eids.`
      );
    }
    if (seen.has(candidate.artifactId)) {
      throw new Error(`validateCandidates: duplicate artifactId '${candidate.artifactId}' — artifactIds must be unique.`);
    }
    seen.add(candidate.artifactId);
    if (typeof candidate.draftPath !== 'string' || candidate.draftPath.length === 0) {
      throw new Error(`validateCandidates: candidate '${candidate.artifactId}' has no draftPath — a candidate with no article on disk cannot be reviewed.`);
    }
    if (!Array.isArray(candidate.sourceRefs) || candidate.sourceRefs.length === 0) {
      throw new Error(
        `validateCandidates: candidate '${candidate.artifactId}' has no sourceRefs — publishable knowledge is never unsourced, and no sources are synthesized for it.`
      );
    }
  }
  return candidates;
}

/**
 * Throws on any verdict outside RETENTION_DECISIONS — an asset the scan could not classify
 * is reported in unassessed[], never given a default verdict.
 *
 * @param {string} decision - The retention verdict
 * @param {string} artifactId - The scanned asset (for the error message)
 * @returns {string} The decision, unchanged, when it is allowed
 */
export function assertRetentionDecision(decision, artifactId) {
  if (!RETENTION_DECISIONS.includes(decision)) {
    throw new Error(
      `Retention decision ${JSON.stringify(decision)} for asset '${artifactId}' is unknown. ` +
      `Allowed decisions: ${RETENTION_DECISIONS.join(' | ')} — no default verdict is applied to an asset the scan could not classify.`
    );
  }
  return decision;
}

/**
 * Fail-closed kip-store check. The dedupe and decay phases read the corpus out of kip, so an
 * unavailable store is a failure to surface, not an empty-corpus silent pass. NOTE:
 * factCount === 0 with storeInitialized === true is a legitimate fresh brain and does NOT
 * throw — only an uninitialized or unreachable store does.
 *
 * @param {object} recallResult - A kip recall/scan result carrying storeInitialized
 * @param {string} phase - The phase id (for the error message)
 * @returns {object} The recall result, unchanged, when the store is available
 */
export function assertKipStoreAvailable(recallResult, phase) {
  if (!recallResult || recallResult.storeInitialized !== true) {
    throw new Error(
      `${phase}: the kip store is unreachable or uninitialized (storeInitialized=${JSON.stringify(recallResult && recallResult.storeInitialized)}). ` +
      'The knowledge lifecycle reads its corpus out of kip, so this is a failure to surface — it is NEVER reported as an empty corpus or a clean dedupe. ' +
      'A fresh store (factCount 0 with storeInitialized true) is a legitimate fresh brain and does not reach this error.'
    );
  }
  return recallResult;
}

/**
 * Strict approval guard called at the top of every guarded-executor branch, so an executor
 * can never be reached on a non-approval. undefined/null/'true'/1 are all rejected —
 * approved must be exactly true.
 *
 * @param {object} bpResult - The routed-breakpoint result
 * @param {string} actionId - The policy-gated action id (equals the breakpointId)
 * @returns {object} The breakpoint result, unchanged, when approved === true
 */
export function assertApproved(bpResult, actionId) {
  if (!bpResult || bpResult.approved !== true) {
    throw new Error(
      `Refusing to execute '${actionId}': approval is not exactly true (got ${JSON.stringify(bpResult && bpResult.approved)}). ` +
      'There is no alternate execution path and no proceed-anyway branch for a policy-gated action.'
    );
  }
  return bpResult;
}

/**
 * Cross-check that the single placement agent has not silently suppressed the
 * knowledge-lifecycle.taxonomy-change policy gate. klw.classification produces a
 * per-candidate taxonomyChangeRequired against the PRE-change taxonomy snapshot; if any
 * publish-ready candidate's own lane declared a taxonomy change while klw.taxonomy-placement
 * reported none, the gate would never be raised. A policy gate is not the placement agent's
 * to skip, so this throws rather than publishing under an unapproved branch.
 *
 * @param {Array<object>} publishReady - Adjudicated publish-ready entries
 * @param {Map<string, object>} laneById - Per-candidate lanes keyed by artifactId
 * @param {object|null} taxonomyChange - placement.taxonomyChange as reported by the placement agent
 * @returns {Array<object>} The publish-ready entries, unchanged, when no suppression is detected
 */
function assertTaxonomyChangeNotSuppressed(publishReady, laneById, taxonomyChange) {
  if (taxonomyChange && taxonomyChange.required === true) {
    return publishReady;
  }
  for (const entry of publishReady) {
    const lane = laneById.get(entry.artifactId);
    if (!lane || !lane.classification) {
      throw new Error(
        `Taxonomy cross-check: publish-ready candidate '${entry.artifactId}' has no classification lane — its taxonomy dependency cannot be established, and an unestablished dependency is never published.`
      );
    }
    if (lane.classification.taxonomyChangeRequired === true) {
      throw new Error(
        `klw.taxonomy-placement reported taxonomyChange.required=${JSON.stringify(taxonomyChange && taxonomyChange.required)} while the klw.classification lane for '${entry.artifactId}' declared taxonomyChangeRequired:true ` +
        `(taxonomyPath '${lane.classification.taxonomyPath}'). The placement agent suppressed a taxonomy change a classification lane declared; the knowledge-lifecycle.taxonomy-change policy gate is not the placement agent's to skip.`
      );
    }
  }
  return publishReady;
}

/**
 * Requires the explicit per-artifact dependency marker on every placement entry once a
 * taxonomy change is on the table. Dependency is NEVER inferred from a path prefix: that
 * inference only holds for kind 'newBranch', and silently mis-classifies 'moveNode' and
 * 'renameFacet' entries whose planned path exists only after the change is applied.
 *
 * @param {Array<object>} placementPlan - placement.placementPlan entries
 * @returns {Array<object>} The placement plan, unchanged, when every entry carries the marker
 */
function assertPlacementDependencyMarkers(placementPlan) {
  for (const entry of placementPlan) {
    if (!entry || typeof entry.artifactId !== 'string' || entry.artifactId.length === 0) {
      throw new Error(
        `Placement plan entry ${JSON.stringify(entry)} has no artifactId — a placement entry that cannot be keyed cannot be dependency-checked against a rejected taxonomy change.`
      );
    }
    if (typeof entry.dependsOnTaxonomyChange !== 'boolean') {
      throw new Error(
        `Placement plan entry '${entry.artifactId}' has no boolean dependsOnTaxonomyChange (got ${JSON.stringify(entry.dependsOnTaxonomyChange)}). ` +
        'A taxonomy change is proposed, so every entry must state explicitly whether its path exists only after that change — dependency is never inferred from a path prefix.'
      );
    }
  }
  return placementPlan;
}

/**
 * Fail-closed cross-check run after a REJECTED taxonomy change, over the entries that
 * survived demotion. A survivor may only be published if it can be SHOWN to resolve under
 * the pre-change taxonomy: its own classification lane (which cited the pre-change taxonomy
 * snapshot with file:line) declared no taxonomy change, and the placement agent filed it at
 * exactly the path that lane cited. Anything else — a missing lane, a lane that declared a
 * change, a path the placement agent moved, or a path nested under a branch the rejected
 * change would have created — throws instead of publishing under a guessed branch.
 *
 * @param {Array<object>} placementPlan - The surviving placement entries after demotion
 * @param {Map<string, object>} laneById - Per-candidate lanes keyed by artifactId
 * @param {object} taxonomyChange - The REJECTED placement.taxonomyChange
 * @returns {Array<object>} The surviving entries, unchanged, when all resolve pre-change
 */
function assertSurvivorsResolvePreChangeTaxonomy(placementPlan, laneById, taxonomyChange) {
  for (const entry of placementPlan) {
    if (entry.dependsOnTaxonomyChange !== false) {
      throw new Error(
        `Taxonomy-change rejected: surviving placement entry '${entry.artifactId}' does not declare dependsOnTaxonomyChange:false (got ${JSON.stringify(entry.dependsOnTaxonomyChange)}) — it is not shown to resolve under the pre-change taxonomy.`
      );
    }
    const lane = laneById.get(entry.artifactId);
    if (!lane || !lane.classification) {
      throw new Error(
        `Taxonomy-change rejected: surviving placement entry '${entry.artifactId}' has no classification lane, so its path cannot be shown to resolve under the pre-change taxonomy.`
      );
    }
    if (lane.classification.taxonomyChangeRequired === true) {
      throw new Error(
        `Taxonomy-change rejected: surviving placement entry '${entry.artifactId}' was kept by the placement agent, but its own klw.classification lane declared taxonomyChangeRequired:true — it depends on the rejected change and must not be published.`
      );
    }
    if (entry.taxonomyPath !== lane.classification.taxonomyPath) {
      throw new Error(
        `Taxonomy-change rejected: surviving placement entry '${entry.artifactId}' is filed at '${entry.taxonomyPath}', which is not the branch its classification lane verified against the pre-change taxonomy snapshot ('${lane.classification.taxonomyPath}'). A re-filed path is not shown to resolve pre-change.`
      );
    }
    if (
      taxonomyChange.kind === 'newBranch' &&
      typeof entry.taxonomyPath === 'string' &&
      typeof taxonomyChange.branch === 'string' &&
      entry.taxonomyPath.startsWith(taxonomyChange.branch)
    ) {
      throw new Error(
        `Taxonomy-change rejected: surviving placement entry '${entry.artifactId}' is filed under '${entry.taxonomyPath}', which is nested in the branch '${taxonomyChange.branch}' the rejected newBranch change would have created — that branch does not exist pre-change.`
      );
    }
  }
  return placementPlan;
}

/**
 * Audit record for a policy-gated action. Skipped conditional gates are recorded with
 * required:false rather than omitted, so a reader can never mistake 'not raised' for
 * 'not applicable'. Same contract as customer-support/ticket-lifecycle.js.
 *
 * @param {string} actionId - The policy-gated action id
 * @param {boolean} required - Whether the gate was raised at all
 * @param {object|null} bpResult - The breakpoint result when raised
 * @param {boolean} executed - Whether the guarded executor actually ran
 * @returns {object} The audit record
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

/**
 * Run-scoped provenance eid. Throws on a malformed artifactId — a bad id never silently
 * becomes a fact eid.
 *
 * @param {string} runId - The run id
 * @param {string} artifactId - The candidate's kebab-case artifact id
 * @returns {string} The deterministic eid
 */
function assetEid(runId, artifactId) {
  if (typeof artifactId !== 'string' || !KEBAB_CASE.test(artifactId)) {
    throw new Error(`assetEid: artifactId ${JSON.stringify(artifactId)} is not kebab-case — a malformed id never becomes a kip eid.`);
  }
  return `knowledge-asset:${runId}:${artifactId}`;
}

/**
 * Run-independent corpus identity used for supersedes/superseded-by edges and for decay
 * monitoring across runs. Throws on a malformed artifactId.
 *
 * @param {string} artifactId - The asset's kebab-case artifact id
 * @returns {string} The deterministic eid
 */
function corpusEid(artifactId) {
  if (typeof artifactId !== 'string' || !KEBAB_CASE.test(artifactId)) {
    throw new Error(`corpusEid: artifactId ${JSON.stringify(artifactId)} is not kebab-case — a malformed id never becomes a kip eid.`);
  }
  return `corpus-asset:${artifactId}`;
}

/**
 * Deterministic taxonomy-node eid slug for classified-as edges.
 *
 * @param {string} taxonomyPath - The branch path the asset is filed under
 * @returns {string} The slugged taxonomy eid
 */
function taxonomyEid(taxonomyPath) {
  if (typeof taxonomyPath !== 'string' || taxonomyPath.length === 0) {
    throw new Error(`taxonomyEid: taxonomyPath ${JSON.stringify(taxonomyPath)} is empty — an unfiled asset never becomes a classified-as edge.`);
  }
  const slug = taxonomyPath
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug.length === 0) {
    throw new Error(`taxonomyEid: taxonomyPath ${JSON.stringify(taxonomyPath)} slugs to an empty string — refusing to mint a nameless taxonomy eid.`);
  }
  return `taxonomy:${slug}`;
}

// ---------------------------------------------------------------------------
// P0 — kip corpus recall (kip-librarian skill, kind knowledge-asset)
// ---------------------------------------------------------------------------

export const klwKipRecallCorpusTask = defineTask('klw.kip-recall-corpus', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recall knowledge corpus for domain: ${args.knowledgeDomain}`,
  agent: {
    name: 'kip-librarian',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Recall the existing knowledge corpus, prior publications, and prior retirements for this domain from kip',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        `Run \`kip init --dir ${args.kipDir} --create --replica ${args.kipReplicaId} --json\` (idempotent open); ensure ${args.kipDir}/keyring.json exists before any later write.`,
        `Run \`kip recall "${args.knowledgeDomain}" --dir ${args.kipDir} --replica ${args.kipReplicaId} --k 40 --json\` — --k is mandatory. Use a generous --k: a truncated recall silently hides existing assets and causes duplicate publication.`,
        'From each hit eid run `kip query` (with mandatory --depth/--max-fanout/--direction) to pull classification and supersedes edges.',
        `Partition into publishedAssets (corpus-asset:* nodes, kind ${args.kipKind}, status published), retiredAssets (status retired/superseded), taxonomyFacts, and insights; report the raw factCount and storeInitialized.`,
        'A fresh store means factCount 0 with storeInitialized TRUE — that is a fresh brain. But if the store cannot be initialized or reached, report storeInitialized:false with the raw CLI error: the caller treats that as a hard failure, and you must NOT report an empty corpus in its place.',
      ],
      outputFormat:
        'JSON with publishedAssets array, retiredAssets array, taxonomyFacts array, insights array, factCount number, storeInitialized boolean, cliErrors array',
    },
    outputSchema: {
      type: 'object',
      required: ['factCount', 'storeInitialized', 'publishedAssets', 'retiredAssets'],
      properties: {
        publishedAssets: { type: 'array' },
        retiredAssets: { type: 'array' },
        taxonomyFacts: { type: 'array' },
        insights: { type: 'array' },
        factCount: { type: 'number' },
        storeInitialized: { type: 'boolean' },
        cliErrors: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'kip'],
}));

// ---------------------------------------------------------------------------
// P1 — knowledge intake (one lane per validated source, ctx.parallel.map)
// ---------------------------------------------------------------------------

export const klwIntakeCaptureTask = defineTask('klw.intake-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capture knowledge — source ${args.source.name} (${args.source.method})`,
  agent: {
    name: 'knowledge-capture-analyst',
    prompt: {
      role: `Knowledge capture analyst (source: ${args.source.name})`,
      task: 'Capture knowledge units from this source using its method playbook',
      context: args,
      instructions: [
        `Apply the methodology of the playbook ${args.playbook} as this lane's discipline — emulate its elicitation/structuring steps; do NOT import or execute it.`,
        'Every knowledge unit MUST carry >=1 evidence entry: { kind (interview-note|document|transcript|artifact|observation), locator (file path with :line where applicable, or a document/system reference), excerpt (verbatim), capturedAt, retrievalMethod (the exact command/tool/interview used) }. An unevidenced unit is not a knowledge unit.',
        'Separate what the source actually asserted from your inference; mark inference explicitly as inferred:true with the reasoning.',
        'Honor priorCorpus.publishedAssets: if a unit restates an already-published asset, say so in relatesToExistingAssetIds — do NOT drop it (the dedupe lane decides, not you).',
        `unitId format: ${args.source.name}-u<N> — kebab-case, unique within the lane.`,
        'IRON LAW: an adversarial accuracy-and-freshness gate will independently OPEN every locator you cite and diff your excerpts against the live source — fabricated or drifted excerpts will be caught and the unit rejected.',
      ],
      outputFormat:
        'JSON with units array [{ unitId, statement, evidence (minItems 1), inferred boolean, relatesToExistingAssetIds array, confidence }], sourceSummary object',
    },
    outputSchema: {
      type: 'object',
      required: ['units', 'sourceSummary'],
      properties: {
        units: {
          type: 'array',
          items: {
            type: 'object',
            required: ['unitId', 'statement', 'evidence'],
            properties: {
              unitId: { type: 'string' },
              statement: { type: 'string' },
              evidence: { type: 'array', minItems: 1 },
              inferred: { type: 'boolean' },
              relatesToExistingAssetIds: { type: 'array' },
              confidence: { type: 'string' },
            },
          },
        },
        sourceSummary: { type: 'object' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'intake'],
}));

// ---------------------------------------------------------------------------
// P2 — curation into candidate knowledge assets
// ---------------------------------------------------------------------------

export const klwCurationNormalizeTask = defineTask('klw.curation-normalize', (args, taskCtx) => ({
  kind: 'agent',
  title: `Curate ${args.sourceCount} intake lanes into candidate knowledge assets`,
  agent: {
    name: 'knowledge-curator',
    prompt: {
      role: 'Knowledge curator',
      task: 'Merge intake units into candidate knowledge assets and write each draft to disk',
      context: args,
      instructions: [
        `Apply the article shape of ${CURATION_PLAYBOOKS[0]} and the quality bar of ${CURATION_PLAYBOOKS[1]} as playbooks — emulate them; do NOT import them.`,
        `Write each candidate draft to ${args.draftDir}/<artifactId>.md and report the exact path in draftPath.`,
        'artifactId is kebab-case and unique — it keys the deterministic kip eid, so a duplicate or malformed id fails the run.',
        'Merge near-duplicate units keeping the UNION of their evidence; never discard an evidence entry. Record mergedFrom (unitIds) on every candidate.',
        'Contradicting units are BOTH retained and flagged in contradictions[] — contradictions are surfaced, never resolved by deletion.',
        'Every candidate carries sourceRefs: the evidence locators that support it, copied verbatim from the intake units.',
      ],
      outputFormat:
        'JSON with candidates array [{ artifactId, title, draftPath, sourceRefs (minItems 1), mergedFrom, audience, contradictions }], candidateBundleDraftPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['candidates'],
      properties: {
        candidates: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['artifactId', 'title', 'draftPath', 'sourceRefs'],
            properties: {
              artifactId: { type: 'string' },
              title: { type: 'string' },
              draftPath: { type: 'string' },
              sourceRefs: { type: 'array', minItems: 1 },
              mergedFrom: { type: 'array' },
              audience: { type: 'string' },
              contradictions: { type: 'array' },
            },
          },
        },
        candidateBundleDraftPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'curation'],
}));

// ---------------------------------------------------------------------------
// P3 — per-candidate dedupe recall (kip), enrichment, classification
// ---------------------------------------------------------------------------

export const klwDedupeRecallTask = defineTask('klw.dedupe-recall', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dedupe candidate ${args.candidate.artifactId} against the live corpus`,
  agent: {
    name: 'kip-librarian',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Recall the live corpus for this candidate and decide new / duplicate / update-of',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        `Run \`kip recall "<candidate title + key statements>" --dir ${args.kipDir} --replica ${args.kipReplicaId} --k 20 --json\` — recall BEFORE the capture is committed, so an existing fact is detected instead of duplicated.`,
        `For every plausible hit run \`kip get <eid> --dir ${args.kipDir} --replica ${args.kipReplicaId} --json\` and read the stored props — a score alone is not a duplicate verdict.`,
        `Also grep the live corpus directory ${args.corpusDir} for title/heading collisions and cite file:line for each hit.`,
        'Verdict is exactly one of: new | duplicate-of | update-of | conflicts-with. duplicate-of/update-of/conflicts-with MUST name the existing eid AND the corpus file path.',
        'recallEvidence MUST contain the executed commands and their raw output excerpts — one entry per command. A verdict without executed evidence is inadmissible and the accuracy gate will reject it.',
        `Entity resolution, if a candidate match is ambiguous, uses \`kip resolve --model ${args.kipModel}\` and NEVER auto-merges — report candidates instead (merge approvals are routed breakpoints per the kip-librarian skill).`,
        'If the store cannot be reached or initialized, report storeInitialized:false with the raw CLI error. Do NOT report verdict:new because the recall failed — that would duplicate institutional knowledge.',
      ],
      outputFormat:
        'JSON with verdict string, matchedEid string|null, matchedCorpusPath string|null, recallEvidence array (minItems 1), resolveCandidates array, factCount number, storeInitialized boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'recallEvidence', 'storeInitialized'],
      properties: {
        verdict: { type: 'string', enum: ['new', 'duplicate-of', 'update-of', 'conflicts-with'] },
        matchedEid: { type: ['string', 'null'] },
        matchedCorpusPath: { type: ['string', 'null'] },
        recallEvidence: { type: 'array', minItems: 1 },
        resolveCandidates: { type: 'array' },
        factCount: { type: 'number' },
        storeInitialized: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'kip', 'dedupe'],
}));

export const klwEnrichmentTask = defineTask('klw.enrichment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Enrich candidate ${args.candidate.artifactId}`,
  agent: {
    name: 'knowledge-editor',
    prompt: {
      role: 'Knowledge editor',
      task: 'Enrich the candidate draft to publication quality without inventing content',
      context: args,
      instructions: [
        `Apply the quality bar of ${CURATION_PLAYBOOKS[1]} and the article shape of ${CURATION_PLAYBOOKS[0]} as playbooks.`,
        `Edit ${args.candidate.draftPath} IN PLACE: add summary, applicability/context, prerequisites, procedure, verification, related-assets, and a Sources section listing every sourceRef.`,
        'When dedupe.verdict is update-of, write the enrichment as a DIFF against the matched corpus file (quote the existing text you are changing) rather than a fresh article.',
        'You may not add a statement that is not supported by a sourceRef. If enrichment reveals a gap, record it in openGaps[] — never fill a gap with plausible-sounding text.',
        'Record freshnessSignals: { lastVerifiedAt, sourceDatedAt per sourceRef, volatilityAssessment } — the freshness critic will re-derive these from the sources themselves.',
        'citations MUST be non-empty: every substantive section names at least one sourceRef locator.',
        'IRON LAW: an adversarial accuracy-and-freshness gate will independently re-open every source you cite and re-derive your freshness signals.',
      ],
      outputFormat: 'JSON with enrichedPath string, citations array (minItems 1), openGaps array, freshnessSignals object, changes array',
    },
    outputSchema: {
      type: 'object',
      required: ['enrichedPath', 'citations', 'freshnessSignals'],
      properties: {
        enrichedPath: { type: 'string' },
        citations: { type: 'array', minItems: 1 },
        openGaps: { type: 'array' },
        freshnessSignals: { type: 'object' },
        changes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'enrichment'],
}));

export const klwClassificationTask = defineTask('klw.classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Classify candidate ${args.candidate.artifactId}`,
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'Information architect',
      task: 'Place the candidate in the governing taxonomy and assign findability metadata',
      context: args,
      instructions: [
        `Apply the facet/governance discipline of ${CLASSIFICATION_PLAYBOOKS[0]}, the KB structure of ${CLASSIFICATION_PLAYBOOKS[1]}, and the findability practices of ${CLASSIFICATION_PLAYBOOKS[2]} as playbooks — emulate them; do NOT import them.`,
        `Read the governing taxonomy snapshot at ${args.taxonomySnapshotPath} and cite the exact branch path you are filing under, with file:line.`,
        'Assign: taxonomyPath, facets, tags, audience, ownerRole, reviewCadenceDays, searchKeywords, synonyms.',
        'Set taxonomyChangeRequired:true ONLY when no existing branch fits — and then state exactly what change is needed (newBranch | renameFacet | moveNode) and which existing branch is affected. That change re-classifies every artifact already filed under it, so it is a routed human decision, not yours to make.',
        'rationaleEvidence MUST be non-empty: cite the taxonomy snapshot lines and any existing sibling assets that justify the placement.',
      ],
      outputFormat:
        'JSON with taxonomyPath string, facets object, tags array, ownerRole string, reviewCadenceDays number, searchKeywords array, taxonomyChangeRequired boolean, taxonomyChange object|null, rationaleEvidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['taxonomyPath', 'taxonomyChangeRequired', 'rationaleEvidence'],
      properties: {
        taxonomyPath: { type: 'string' },
        facets: { type: 'object' },
        tags: { type: 'array' },
        ownerRole: { type: 'string' },
        reviewCadenceDays: { type: 'number' },
        searchKeywords: { type: 'array' },
        taxonomyChangeRequired: { type: 'boolean' },
        taxonomyChange: { type: ['object', 'null'] },
        rationaleEvidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'classification'],
}));

// ---------------------------------------------------------------------------
// P4 — bundle, adversarial accuracy+freshness gate, fixer, merge adjudication
// ---------------------------------------------------------------------------

export const klwCorpusBundleTask = defineTask('klw.corpus-bundle', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble the corpus-candidate bundle for ${args.candidateCount} candidates`,
  agent: {
    name: 'knowledge-curator',
    prompt: {
      role: 'Candidate-bundle assembler',
      task: 'Write the single reviewable bundle artifact the accuracy-and-freshness gate judges',
      context: args,
      instructions: [
        `Write the bundle JSON to ${args.bundlePath} and report that exact path back.`,
        'The bundle contains, per candidate: artifactId, title, enrichedPath, sourceRefs, citations, dedupe verdict + matchedEid + recallEvidence, classification + rationaleEvidence, freshnessSignals, openGaps.',
        'Copy values verbatim from the lane results — the bundle is a projection, not a re-interpretation. Adding, softening, or omitting a lane finding is a protocol violation the gate will catch.',
        'Report candidateCount and the list of artifactIds.',
      ],
      outputFormat: 'JSON with bundlePath string, candidateCount number, artifactIds array',
    },
    outputSchema: {
      type: 'object',
      required: ['bundlePath', 'candidateCount', 'artifactIds'],
      properties: {
        bundlePath: { type: 'string' },
        candidateCount: { type: 'number' },
        artifactIds: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'bundle'],
}));

export const klwAccuracyRemediationTask = defineTask('klw.accuracy-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remediate accuracy/freshness issues (attempt ${args.attempt})`,
  agent: {
    name: 'knowledge-editor',
    prompt: {
      role: 'Knowledge remediation editor',
      task: 'Repair every critic-reported accuracy, staleness, duplication, or sensitivity issue',
      context: args,
      instructions: [
        'For each issue: re-open the cited source and correct the article to match it, replace a dead/moved locator with one you actually opened, or move the candidate to a proposedRejected list with the reason — NEVER soften a statement to dodge verification.',
        'For staleness issues: refresh the content against the current source and update freshnessSignals.lastVerifiedAt with the timestamp of the check you actually performed.',
        'For duplication issues: change the candidate to update-of the named existing asset (write it as a diff), or drop it — never publish a second copy of an existing fact.',
        'Update the article files AND the bundle file in place; report per-issue what changed.',
        'Do not touch candidates with no reported issues.',
      ],
      outputFormat: 'JSON with fixed boolean, changes array (one entry per addressed issue), proposedRejected array',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
        proposedRejected: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'fixer'],
}));

export const klwMergeAdjudicationTask = defineTask('klw.merge-adjudication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adjudicate candidates from the accuracy-and-freshness critic verdicts',
  agent: {
    name: 'knowledge-curator',
    prompt: {
      role: 'Knowledge adjudicator',
      task: 'Partition the bundle into publishReady / needsMerge / rejected using the gate\'s per-candidate critic verdicts',
      context: args,
      instructions: [
        'publishReady: every source opened clean, freshness confirmed, dedupe verdict new (or update-of with an explicit supersedes target). Copy artifactId, title, enrichedPath, classification and citations verbatim from the bundle.',
        'needsMerge: dedupe verdict update-of/conflicts-with where the merge target needs a human editorial call, or a candidate blocked by a rejected taxonomy change — each entry is { candidate, targetEid, reason }.',
        'rejected: any candidate with an unresolved critic issue — each entry is { candidate, reason }.',
        'supersedes: [{ artifactId, supersedesEid, supersedesCorpusPath }] for every update-of candidate — the orchestrator turns these into deterministic kip supersedes edges.',
        'You may NOT promote a candidate past the strictest critic verdict; the orchestrator cross-checks against the unresolved issue list and THROWS on a violation.',
      ],
      outputFormat: 'JSON with publishReady array, needsMerge array, rejected array, supersedes array',
    },
    outputSchema: {
      type: 'object',
      required: ['publishReady', 'needsMerge', 'rejected', 'supersedes'],
      properties: {
        publishReady: { type: 'array' },
        needsMerge: { type: 'array' },
        rejected: { type: 'array' },
        supersedes: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'adjudication'],
}));

// ---------------------------------------------------------------------------
// P5 — taxonomy placement + policy-gated taxonomy-change executor
// ---------------------------------------------------------------------------

export const klwTaxonomyPlacementTask = defineTask('klw.taxonomy-placement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan taxonomy placement for ${args.publishReadyCount} publish-ready assets`,
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'Taxonomy placement planner',
      task: 'Consolidate per-candidate classifications into one placement plan and state whether the taxonomy itself must change',
      context: args,
      instructions: [
        `Apply ${CLASSIFICATION_PLAYBOOKS[0]} and ${CLASSIFICATION_PLAYBOOKS[1]} as playbooks.`,
        'Emit placementPlan: [{ artifactId, taxonomyPath, facets, tags, dependsOnTaxonomyChange }] for every publish-ready asset.',
        'dependsOnTaxonomyChange is REQUIRED on every entry and is a real boolean: true when the taxonomyPath you assigned exists ONLY after the proposed taxonomy change is applied (a branch it creates, a node it moves, a facet it renames), false when the path already exists in the taxonomy snapshot exactly as you wrote it. Do NOT expect the orchestrator to infer this from the path string — for moveNode and renameFacet a dependent path shares no prefix with the affected branch, and if the change is rejected every entry you marked true is withheld from publication.',
        'An entry marked false must be filed at exactly the branch its per-candidate classification cited from the taxonomy snapshot; re-filing an independent asset onto a post-change path is a fail-closed violation the orchestrator throws on.',
        'Set taxonomyChange.required true ONLY if at least one asset needs a taxonomy mutation. Then compute impactedArtifactCount by ACTUALLY counting the artifacts already filed under the affected branch (read the taxonomy snapshot and the corpus; cite file:line) — an estimated count is not acceptable, because the human approver is deciding on that number.',
        'reclassificationPlan describes exactly what changes and what re-files, including the rollback path.',
        'impactEvidence MUST be non-empty: the executed listing/grep plus its output that produced impactedArtifactCount.',
      ],
      outputFormat:
        'JSON with placementPlan array [{ artifactId, taxonomyPath, facets, tags, dependsOnTaxonomyChange boolean (required) }], taxonomyChange object { required boolean, branch, kind, impactedArtifactCount number, reclassificationPlan, rollbackPath }, impactEvidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['placementPlan', 'taxonomyChange', 'impactEvidence'],
      properties: {
        placementPlan: {
          type: 'array',
          items: {
            type: 'object',
            required: ['artifactId', 'taxonomyPath', 'dependsOnTaxonomyChange'],
            properties: {
              artifactId: { type: 'string' },
              taxonomyPath: { type: 'string' },
              facets: { type: 'object' },
              tags: { type: 'array' },
              dependsOnTaxonomyChange: { type: 'boolean' },
            },
          },
        },
        taxonomyChange: { type: 'object' },
        impactEvidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'taxonomy'],
}));

export const klwTaxonomyChangeExecutorTask = defineTask('klw.taxonomy-change-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved taxonomy change: ${args.taxonomyChange.branch}`,
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'Taxonomy change executor',
      task: 'Execute exactly the approved taxonomy mutation and re-file the impacted artifacts',
      context: args,
      instructions: [
        'Execute exactly the reclassificationPlan described in the approval context — nothing beyond it. No opportunistic tidy-ups of neighbouring branches.',
        'Record every file changed and every artifact re-filed, with before/after taxonomy paths.',
        'IRON LAW: this task runs only under an approved===true policy gate (knowledge-lifecycle.taxonomy-change). If the input approval provenance is missing or approved is not exactly true, REFUSE and report — do not change the taxonomy.',
      ],
      outputFormat: 'JSON with executed boolean, reclassified array, filesChanged array, rollbackPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'reclassified'],
      properties: {
        executed: { type: 'boolean' },
        reclassified: { type: 'array' },
        filesChanged: { type: 'array' },
        rollbackPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'taxonomy', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P6 — publication package, policy-gated publish, conditional external exposure
// ---------------------------------------------------------------------------

export const klwPublicationPackageTask = defineTask('klw.publication-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble publication package: ${args.packageDir}`,
  agent: {
    name: 'knowledge-editor',
    prompt: {
      role: 'Publication packager',
      task: 'Assemble the reviewable publication package the knowledge manager approves',
      context: args,
      instructions: [
        `Assemble under ${args.packageDir}: the enriched article files, a classification manifest, a provenance page (runId, intake sources, gate attempts, dedupe verdicts), and a verification appendix that quotes, per asset, the EXECUTED critic evidence excerpt that verified it.`,
        'The appendix must let the approver audit any asset without access to this run.',
        'List every file path written.',
        'This is a DRAFT package only: you may not publish, send, or expose anything. Publication is a separate policy-gated executor.',
      ],
      outputFormat: 'JSON with packageDir string, files array (minItems 1), manifestPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['packageDir', 'files'],
      properties: {
        packageDir: { type: 'string' },
        files: { type: 'array', minItems: 1 },
        manifestPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'publication'],
}));

export const klwPublishExecutorTask = defineTask('klw.publish-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved publication of ${args.packageDir}`,
  agent: {
    name: 'knowledge-publisher',
    prompt: {
      role: 'Knowledge publisher',
      task: 'Execute the approved publication of the package into the shared knowledge base',
      context: args,
      instructions: [
        `Publish exactly the approved assets into ${args.corpusDir}/published/ under their approved taxonomy paths, applying any approver edits carried in the approval response — nothing beyond it.`,
        'Record the executed commands and the resulting locations/URLs per asset.',
        'IRON LAW: this task runs only under an approved===true policy gate (knowledge-lifecycle.publish-to-shared-kb). If the input approval provenance is missing or approved is not exactly true, REFUSE and report — do not publish.',
      ],
      outputFormat: 'JSON with published boolean, locations array (minItems 1), commands array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['published', 'locations', 'commands'],
      properties: {
        published: { type: 'boolean' },
        locations: { type: 'array', minItems: 1 },
        commands: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'publish', 'policy-gated'],
}));

export const klwExternalExposurePackageTask = defineTask('klw.external-exposure-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare external-exposure package for ${args.assetCount} published assets`,
  agent: {
    name: 'knowledge-editor',
    prompt: {
      role: 'External-exposure redaction editor',
      task: 'Produce the redacted, externally safe variant of the published assets and enumerate the residual risk',
      context: args,
      instructions: [
        'Strip customer identifiers, internal hostnames/paths, credentials, unreleased roadmap, named individuals, and any content whose source is marked internal-only.',
        'Produce a redaction log: [{ artifactId, redaction, reason, location }] — the approver decides on the log, not on a summary of it.',
        'residualRisks MUST be non-empty (state "none identified, with the checks performed" explicitly if that is genuinely the finding, listing the executed checks).',
        'Never assume publish approval implies exposure approval; this package is only a proposal.',
      ],
      outputFormat:
        'JSON with exposurePackageDir string, files array, surfacesProposed array, redactionLog array, residualRisks array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['exposurePackageDir', 'files', 'surfacesProposed', 'redactionLog', 'residualRisks'],
      properties: {
        exposurePackageDir: { type: 'string' },
        files: { type: 'array' },
        surfacesProposed: { type: 'array' },
        redactionLog: { type: 'array' },
        residualRisks: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'external-exposure'],
}));

export const klwExternalExposureExecutorTask = defineTask('klw.external-exposure-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved external exposure of ${args.exposurePackageDir}`,
  agent: {
    name: 'knowledge-publisher',
    prompt: {
      role: 'External exposure executor',
      task: 'Expose exactly the approved redacted assets on the approved external surface',
      context: args,
      instructions: [
        'Publish exactly the approved redacted files to exactly the surfaces named in the approval — no additional surface, no un-redacted variant.',
        'Record the executed commands and resulting public locations.',
        'IRON LAW: this task runs only under an approved===true policy gate (knowledge-lifecycle.external-exposure), which is SEPARATE from the publish gate. If the approval provenance is missing or approved is not exactly true, REFUSE and report — do not expose anything externally.',
      ],
      outputFormat: 'JSON with exposed boolean, surfaces array (minItems 1), commands array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['exposed', 'surfaces', 'commands'],
      properties: {
        exposed: { type: 'boolean' },
        surfaces: { type: 'array', minItems: 1 },
        commands: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'external-exposure', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P7 — decay scan (reads this process's own assertions), audit fixer, retire
// ---------------------------------------------------------------------------

export const klwDecayScanTask = defineTask('klw.decay-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scan the corpus for decay (stale after ${args.retentionPolicy.staleAfterDays}d)`,
  agent: {
    name: 'knowledge-lifecycle-analyst',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Knowledge lifecycle analyst',
      task: 'Read this process\'s own prior kip assertions plus the live corpus and emit a retention verdict per asset',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        `Write the full retention decision set (one entry per scanned asset, with evidence) to ${args.retentionDecisionsPath} and report that exact path back in retentionDecisionsPath. That file — not your summary — is the artifact the adversarial retention-audit gate reads before an IRREVERSIBLE retirement, so it must exist on disk and must match the decisions you report.`,
        `Recall the prior assertions this workflow wrote: \`kip recall "${args.knowledgeDomain}" --dir ${args.kipDir} --replica ${args.kipReplicaId} --k 60 --json\`, then \`kip get <eid>\` each corpus-asset:* node to read lastVerifiedAt, reviewCadenceDays, status, and supersedes edges. This is the decay loop reading its OWN prior output — priorAssertionCount is the count of corpus-asset:* nodes you actually read.`,
        `Cross-read the live corpus under ${args.corpusDir}: file mtimes, referenced systems that no longer exist, links that no longer resolve, and assets whose successor was published in THIS run.`,
        `Apply the thresholds from retentionPolicy EXACTLY as given (staleAfterDays ${args.retentionPolicy.staleAfterDays}, reviewAfterDays ${args.retentionPolicy.reviewAfterDays}) — do not invent or adjust a threshold.`,
        `Apply the discipline of ${LIFECYCLE_PLAYBOOKS[0]} and ${LIFECYCLE_PLAYBOOKS[1]} as playbooks; feed anything worth carrying forward into nextCycleInputs per ${LIFECYCLE_PLAYBOOKS[2]} and ${LIFECYCLE_PLAYBOOKS[3]}.`,
        'decision is EXACTLY one of retain | refresh | supersede | retire — there is no default verdict; an asset you could not assess is reported in unassessed[] with the reason, NOT given a verdict.',
        'supersede/retire REQUIRE: the successor eid or an explicit statement that the knowledge is obsolete with no successor, PLUS executed evidence (the kip get output and the corpus read) — a retirement proposal without executed evidence will be rejected by the retention-audit gate.',
        'If the store cannot be reached, report storeInitialized:false with the raw CLI error and propose NOTHING — a failed recall must never be reported as an empty corpus (which would look like nothing needs retiring, or worse, that everything is orphaned).',
      ],
      outputFormat:
        'JSON with retentionDecisionsPath string (the exact path you wrote the decision file to), decisions array [{ artifactId, corpusPath, decision, rationale, successorEid, evidence (minItems 1) }], scannedAssetCount number, priorAssertionCount number, unassessed array, nextCycleInputs array, storeInitialized boolean',
    },
    outputSchema: {
      type: 'object',
      required: [
        'retentionDecisionsPath',
        'decisions',
        'scannedAssetCount',
        'priorAssertionCount',
        'unassessed',
        'storeInitialized',
      ],
      properties: {
        retentionDecisionsPath: { type: 'string' },
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['artifactId', 'decision', 'rationale', 'evidence'],
            properties: {
              artifactId: { type: 'string' },
              corpusPath: { type: 'string' },
              decision: { type: 'string', enum: ['retain', 'refresh', 'supersede', 'retire'] },
              rationale: { type: 'string' },
              successorEid: { type: ['string', 'null'] },
              evidence: { type: 'array', minItems: 1 },
            },
          },
        },
        scannedAssetCount: { type: 'number' },
        priorAssertionCount: { type: 'number' },
        unassessed: { type: 'array' },
        nextCycleInputs: { type: 'array' },
        storeInitialized: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'kip', 'decay'],
}));

export const klwRetentionEvidenceFixerTask = defineTask('klw.retention-evidence-fixer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Repair retention-audit issues (attempt ${args.attempt})`,
  agent: {
    name: 'knowledge-lifecycle-analyst',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Retention evidence remediator',
      task: 'Repair every retention-audit issue by producing the missing executed evidence or downgrading the decision',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        'For each issue: re-run the kip get/recall and the corpus read and attach the raw output, or DOWNGRADE the decision toward retention (retire -> supersede -> refresh -> retain).',
        'You may NEVER upgrade a decision toward deletion to satisfy a critic. The only safe direction under uncertainty is keeping the knowledge.',
        `Update the retention decision file at ${args.retentionDecisionsPath} in place — that exact file is what the critics re-read — and report per-issue what changed.`,
      ],
      outputFormat: 'JSON with fixed boolean, changes array, downgraded array',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
        downgraded: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'fixer'],
}));

export const klwRetireExecutorTask = defineTask('klw.retire-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved retirement of ${args.proposalCount} assets`,
  agent: {
    name: 'knowledge-publisher',
    prompt: {
      role: 'Retirement executor',
      task: 'Execute exactly the approved retirement/supersession of the named assets',
      context: args,
      instructions: [
        `Default action is NON-DESTRUCTIVE: mark the asset status retired/superseded, add the successor pointer, and MOVE the file to ${args.corpusDir}/archive/ preserving its full content and history.`,
        'HARD DELETION is performed ONLY when the approval response explicitly authorizes deletion for that specific artifactId. Absent an explicit deletion authorization, archive it — loss of institutional memory is unrecoverable, so silence means keep.',
        'Leave a tombstone at the original path pointing at the archive location and the successor.',
        'Record per-asset: action taken (archived|deleted|superseded), the executed commands, and the resulting paths.',
        'IRON LAW: this task runs only under an approved===true policy gate (knowledge-lifecycle.retire-artifact). If the approval provenance is missing, approved is not exactly true, or an artifactId is not named in the approval, REFUSE for that asset and report — do not retire anything that was not explicitly approved.',
      ],
      outputFormat:
        'JSON with executed boolean, retired array [{ artifactId, action, archivePath, tombstonePath, commands }] (minItems 1), refused array',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'retired'],
      properties: {
        executed: { type: 'boolean' },
        retired: { type: 'array', minItems: 1 },
        refused: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'klw', 'knowledge-management', 'retire', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P8 — deterministic kip assert (facts built by the orchestrator, never agents)
// ---------------------------------------------------------------------------

export const klwKipAssertLifecycleTask = defineTask('klw.kip-assert-lifecycle', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assert ${args.facts.length} knowledge-asset facts into kip`,
  agent: {
    name: 'kip-librarian',
    skill: { name: 'kip-librarian' },
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Assert the orchestrator-built knowledge-lifecycle facts into kip exactly as given',
      context: args,
      instructions: [
        KIP_LIBRARIAN_NOTE,
        KIP_CLI_NOTE,
        `Assert each provided node/edge EXACTLY as given (eids are deterministic: corpus-asset:<artifactId>, knowledge-asset:<runId>:<artifactId>, gate:<runId>:<gateId>) with kind \`${args.kipKind}\`, passing --dir ${args.kipDir} --replica ${args.kipReplicaId} --json on every call — do not invent, merge, or reword facts.`,
        'status:"pending" echoes are BY DESIGN — never retry or report them as failures.',
        `Entity resolution, if any candidate match surfaces, uses \`kip resolve --model ${args.kipModel}\` and NEVER auto-merges — report candidates instead (merge approvals are routed breakpoints per the kip-librarian skill).`,
        'Report the asserted count and every failure with the raw CLI error — never swallow a failure and never report a partial assert as complete.',
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
  labels: ['agent', 'klw', 'knowledge-management', 'kip'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    knowledgeDomain,
    intakeSources,
    corpusDir = 'artifacts/knowledge-base',
    outputDir: outputDirInput,
    externalExposureRequested = false,
    retentionPolicy: retentionPolicyInput,
    maxIntakeSources = 6,
    maxParallelLanes = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    kipReplicaId: kipReplicaIdInput,
  } = inputs || {};

  if (typeof knowledgeDomain !== 'string' || knowledgeDomain.length === 0) {
    throw new Error(
      'knowledge-lifecycle-workflow requires knowledgeDomain (non-empty string) — refusing to guess which knowledge domain to curate.'
    );
  }
  if (kipEnabled !== true) {
    // Unlike lighter processes this flagship has no kip-less mode: the dedupe and decay
    // phases read the corpus out of kip, so running without it would silently duplicate
    // and silently orphan institutional knowledge.
    throw new Error(
      'knowledge-lifecycle-workflow requires kipEnabled === true — the dedupe and decay phases read the corpus out of kip, so an intentionally disabled store is a surfaced failure, never an empty-corpus silent pass.'
    );
  }

  const sources = validateIntakeSources(intakeSources, maxIntakeSources);
  const retentionPolicy = {
    staleAfterDays: retentionPolicyInput && retentionPolicyInput.staleAfterDays !== undefined
      ? retentionPolicyInput.staleAfterDays
      : 365,
    reviewAfterDays: retentionPolicyInput && retentionPolicyInput.reviewAfterDays !== undefined
      ? retentionPolicyInput.reviewAfterDays
      : 180,
  };

  const outputDir = outputDirInput ?? ctx.artifactsDir;
  const kipReplicaId = kipReplicaIdInput ?? `klw-${ctx.runId}`;
  const taxonomySnapshotPath = `${corpusDir}/taxonomy-snapshot.json`;
  const nowIso = () => new Date().toISOString();
  const startMs = ctx.now();

  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval of a
  // policy gate is surfaced here — fail-closed posture, nothing auto-approves silently.
  const autoApprovals = [];
  const artifacts = [];
  const timings = {};

  const recordGate = (breakpointId, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto =
      result &&
      (result.autoApproved === true ||
        result.autoApprove === true ||
        (result.metadata && result.metadata.autoApproved === true));
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

  // Mutable run state referenced by buildResult (terminal returns carry full state).
  let intake = [];
  let curation = { candidateBundlePath: null, candidateCount: 0, mergedCount: 0 };
  let candidates = [];
  let accuracyFreshnessGate = null;
  let adjudication = { publishReady: [], needsMerge: [], rejected: [], supersedes: [] };
  let taxonomyChange = null;
  let publication = { packagePath: null, approved: false, published: false, locations: [], signoffResponse: null };
  let externalExposure = null;
  let decay = { scannedAssetCount: 0, priorAssertionCount: 0, decisions: [] };
  let retentionAuditGate = null;
  let retirement = null;
  let kipFactsAsserted = 0;
  // Populated in P5; declared here because the kip-assert closure below is defined
  // before P5 runs (it is also invoked on the early fail-closed paths).
  let placementByArtifactId = new Map();

  // Conditional gates that are never raised are still recorded (required:false) so a
  // reader can never mistake 'not raised' for 'not applicable'.
  const gatedActions = {
    publishToSharedKb: recordGatedAction('knowledge-lifecycle.publish-to-shared-kb', false, null, false),
    retireArtifact: recordGatedAction('knowledge-lifecycle.retire-artifact', false, null, false),
    externalExposure: recordGatedAction('knowledge-lifecycle.external-exposure', false, null, false),
    taxonomyChange: recordGatedAction('knowledge-lifecycle.taxonomy-change', false, null, false),
  };

  const buildResult = (success, reason) => ({
    success,
    intake,
    curation,
    candidates,
    accuracyFreshnessGate,
    adjudication,
    taxonomyChange,
    publication,
    externalExposure,
    decay,
    retentionAuditGate,
    retirement,
    gatedActions,
    kipFactsAsserted,
    autoApprovals,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/knowledge-management/knowledge-lifecycle-workflow',
      runId: ctx.runId,
      knowledgeDomain,
      candidateCount: candidates.length,
      breakpointsHit,
      timings,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip corpus recall (BEFORE any capture)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip corpus recall for the knowledge domain');
  const priorCorpus = await ctx.task(klwKipRecallCorpusTask, {
    knowledgeDomain,
    kipDir,
    kipModel,
    kipReplicaId,
    kipKind: KIP_KIND,
  });
  // Fail-closed: an unreachable store is surfaced, never read as an empty corpus.
  assertKipStoreAvailable(priorCorpus, 'P0');
  markPhase('kip-recall');

  // -------------------------------------------------------------------------
  // P1 — knowledge intake: one independent capture lane per validated source
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P1: knowledge intake across ${sources.length} source lane(s)`);
  const laneResults = await ctx.parallel.map(
    sources,
    (source) =>
      ctx.task(klwIntakeCaptureTask, {
        source,
        // assertIntakeMethod already guaranteed this key exists — there is no
        // null-playbook case in this process.
        playbook: INTAKE_PLAYBOOKS[source.method],
        priorCorpus,
        knowledgeDomain,
      }),
    { maxConcurrency: maxParallelLanes }
  );
  intake = sources.map((source, i) => ({
    source: source.name,
    method: source.method,
    unitCount: laneResults[i].units.length,
    evidenceCount: laneResults[i].units.reduce((sum, unit) => sum + unit.evidence.length, 0),
  }));
  markPhase('intake');

  // -------------------------------------------------------------------------
  // P2 — curation into candidate knowledge assets (empty curation throws)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: curation of intake units into candidate knowledge assets');
  const draftDir = `${outputDir}/knowledge-candidates-${ctx.runId}`;
  const curationResult = await ctx.task(klwCurationNormalizeTask, {
    draftDir,
    knowledgeDomain,
    sourceCount: sources.length,
    laneResults,
    priorCorpus,
  });
  const curatedCandidates = validateCandidates(curationResult.candidates);
  curation = {
    candidateBundlePath: null,
    candidateCount: curatedCandidates.length,
    mergedCount: curatedCandidates.reduce(
      (sum, candidate) => sum + (Array.isArray(candidate.mergedFrom) ? candidate.mergedFrom.length : 0),
      0
    ),
  };
  for (const candidate of curatedCandidates) {
    artifacts.push(candidate.draftPath);
  }
  markPhase('curation');

  // -------------------------------------------------------------------------
  // P3 — per-candidate lanes: dedupe recall FIRST (both downstream tasks
  // consume its verdict), then enrichment and classification concurrently
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P3: parallel dedupe/enrichment/classification across ${curatedCandidates.length} candidate(s)`);
  const candidateLanes = await ctx.parallel.map(
    curatedCandidates,
    async (candidate) => {
      const dedupe = await ctx.task(klwDedupeRecallTask, {
        candidate,
        knowledgeDomain,
        corpusDir,
        kipDir,
        kipModel,
        kipReplicaId,
      });
      // A candidate is NEVER marked 'no duplicate found' because the recall failed.
      assertKipStoreAvailable(dedupe, `P3-dedupe:${candidate.artifactId}`);
      const [enrichment, classification] = await ctx.parallel.all([
        () => ctx.task(klwEnrichmentTask, { candidate, dedupe, priorCorpus, corpusDir }),
        () => ctx.task(klwClassificationTask, { candidate, dedupe, taxonomySnapshotPath }),
      ]);
      return { artifactId: candidate.artifactId, dedupe, enrichment, classification };
    },
    { maxConcurrency: maxParallelLanes }
  );
  candidates = curatedCandidates.map((candidate, i) => ({
    artifactId: candidate.artifactId,
    title: candidate.title,
    dedupe: candidateLanes[i].dedupe,
    enrichment: candidateLanes[i].enrichment,
    classification: candidateLanes[i].classification,
  }));
  const candidateById = new Map(curatedCandidates.map((candidate) => [candidate.artifactId, candidate]));
  const laneById = new Map(candidateLanes.map((lane) => [lane.artifactId, lane]));
  markPhase('candidate-lanes');

  // -------------------------------------------------------------------------
  // P4 — corpus-candidate bundle + adversarial accuracy/freshness gate
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: corpus-candidate bundle + klw.accuracy-freshness adversarial gate');
  const bundlePath = `${outputDir}/corpus-candidate-bundle-${ctx.runId}.json`;
  const bundle = await ctx.task(klwCorpusBundleTask, {
    bundlePath,
    candidateCount: curatedCandidates.length,
    candidates: curatedCandidates,
    candidateLanes,
  });
  artifacts.push(bundle.bundlePath);
  curation = { ...curation, candidateBundlePath: bundle.bundlePath };

  const gateContext = {
    corpusDir,
    knowledgeDomain,
    priorCorpus,
    kipDir,
    kipReplicaId,
    kipModel,
    taxonomySnapshotPath,
  };
  const accuracyGate = await adversarialGate(ctx, {
    gateId: 'klw.accuracy-freshness',
    artifact: {
      path: bundle.bundlePath,
      description: 'Corpus-candidate bundle: per-candidate article, sources, dedupe verdict, classification, freshness signals',
    },
    critics: [
      {
        name: 'source-accuracy-critic',
        role: 'Adversarial source verifier',
        focus: 'every cited source actually opened and actually supports the statement',
        instructions: [
          'IRON LAW: OPEN every sourceRef/citation locator yourself (Read the file at the cited line, fetch the cited document) — the curator\'s transcript is inadmissible; each evidence entry MUST be the executed read/fetch plus a raw excerpt, cited as path:line.',
          'A locator that does not exist, does not resolve, or does not contain support for the statement is a failing issue { artifactId, locator, problem, requiredFix }.',
          'Excerpt drift that changes meaning is a failing issue; trivial whitespace drift is a caveat.',
          'A statement with no supporting locator at all is a failing issue — publishable knowledge is never unsourced.',
          VERDICT_SCHEMA_PIN,
        ],
      },
      {
        name: 'freshness-staleness-critic',
        role: 'Freshness and staleness auditor',
        focus: 'the content is current relative to the live corpus and the live sources',
        instructions: [
          `IRON LAW: DIFF each candidate against the live corpus under ${corpusDir} yourself (executed grep/diff/read) and re-derive freshnessSignals from the sources rather than trusting the editor's self-report; evidence = the executed diff plus its output.`,
          'Flag as failing: content contradicting a newer corpus asset, references to systems/processes that no longer exist in the corpus, a lastVerifiedAt the editor could not have observed, and reviewCadenceDays that is absent or unjustified for volatile content.',
          'A candidate that merely restates content already current in the corpus is a duplication issue, not a freshness pass.',
          VERDICT_SCHEMA_PIN,
        ],
      },
      {
        name: 'duplication-recall-critic',
        role: 'Corpus duplication auditor (kip)',
        focus: 'the dedupe verdict is real — re-run the recall yourself',
        instructions: [
          KIP_LIBRARIAN_NOTE,
          KIP_CLI_NOTE,
          `IRON LAW: RE-RUN the kip recall for every candidate yourself (\`kip recall "<title>" --dir ${kipDir} --replica ${kipReplicaId} --k 20 --json\`, then \`kip get <eid>\` on each plausible hit) — the dedupe lane's verdict is inadmissible without your own executed reproduction. Evidence entries are the executed commands plus raw output excerpts, and every duplicate you find is cited by fact-id (eid).`,
          'A verdict of \'new\' that your recall contradicts is a failing issue. A verdict of \'update-of\' without a named existing eid AND a corpus path is a failing issue.',
          'If the store is unreachable, that is a FAILING protocol issue, not a pass — never report an empty corpus as a clean dedupe.',
          VERDICT_SCHEMA_PIN,
        ],
      },
      {
        name: 'sensitivity-classification-critic',
        role: 'Sensitivity and placement auditor',
        focus: 'nothing publishable leaks restricted content, and the taxonomy placement is real',
        instructions: [
          'Read each article file and flag secrets, credentials, personal data, customer identifiers, and internal-only material as failing issues with path:line.',
          `IRON LAW: verify each claimed taxonomyPath EXISTS in the taxonomy snapshot at ${taxonomySnapshotPath} by reading it yourself and citing file:line; a placement under a non-existent branch that was not declared as taxonomyChangeRequired is a failing issue.`,
          'An asset whose classification lacks ownerRole or reviewCadenceDays is a failing issue — unowned knowledge decays unnoticed.',
          VERDICT_SCHEMA_PIN,
        ],
      },
    ],
    ironLaw: [
      'Judge the bundle and the article files on disk, not any agent\'s summary of them.',
      'A PASS on any candidate without an EXECUTED-check evidence excerpt is invalid — the combinator coerces evidence-empty passes to protocol failures.',
      'Every evidence entry must be either a file:line citation you actually read or the executed command plus a raw output excerpt. Prose assurances are inadmissible.',
    ],
    maxFixAttempts,
    fixer: { task: klwAccuracyRemediationTask, args: { corpusDir, knowledgeDomain } },
    context: gateContext,
  });
  accuracyFreshnessGate = {
    passed: accuracyGate.passed,
    attempts: accuracyGate.attempts,
    escalated: accuracyGate.escalated,
    issues: accuracyGate.issues,
    evidence: accuracyGate.evidence,
  };
  if (accuracyGate.escalated) {
    breakpointsHit.push('klw.accuracy-freshness.gate-escalation');
  }
  markPhase('accuracy-freshness-gate');

  // The kip assert closure — facts are built by the ORCHESTRATOR from run state on
  // every terminal path, so agents never invent a fact and a failed gate still leaves
  // its outcome in the store for the next run.
  const runKipAssert = async () => {
    const facts = [];
    if (publication.published === true) {
      for (const entry of adjudication.publishReady) {
        const artifactId = entry.artifactId;
        const candidate = candidateById.get(artifactId);
        const lane = laneById.get(artifactId);
        if (!candidate || !lane) {
          throw new Error(
            `kip fact construction: publishReady names '${artifactId}' which has no curated candidate or lane result — refusing to assert a fact about an asset this run never produced.`
          );
        }
        const placement = placementByArtifactId.get(artifactId);
        if (!placement) {
          throw new Error(
            `kip fact construction: published asset '${artifactId}' has no placement-plan entry — refusing to assert a classified-as edge under a guessed branch.`
          );
        }
        facts.push({
          type: 'node',
          eid: corpusEid(artifactId),
          kind: KIP_KIND,
          props: {
            title: candidate.title,
            taxonomyPath: placement.taxonomyPath,
            ownerRole: lane.classification.ownerRole,
            reviewCadenceDays: lane.classification.reviewCadenceDays,
            status: 'published',
            lastVerifiedAt: nowIso(),
            sourceRefCount: candidate.sourceRefs.length,
            runId: ctx.runId,
          },
        });
        facts.push({
          type: 'node',
          eid: assetEid(ctx.runId, artifactId),
          kind: KIP_KIND,
          props: {
            title: candidate.title,
            verdict: 'published',
            dedupeVerdict: lane.dedupe.verdict,
            citationCount: lane.enrichment.citations.length,
            gateAttempts: accuracyFreshnessGate.attempts,
            runId: ctx.runId,
          },
        });
        facts.push({
          type: 'edge',
          kind: 'classified-as',
          from: corpusEid(artifactId),
          to: taxonomyEid(placement.taxonomyPath),
        });
        for (const source of sources) {
          const fromThisLane =
            Array.isArray(candidate.mergedFrom) &&
            candidate.mergedFrom.some((unitId) => typeof unitId === 'string' && unitId.startsWith(`${source.name}-u`));
          if (fromThisLane) {
            facts.push({
              type: 'edge',
              kind: 'derived-from',
              from: assetEid(ctx.runId, artifactId),
              to: `intake-source:${source.name}`,
            });
          }
        }
      }
      for (const entry of adjudication.supersedes) {
        facts.push({
          type: 'edge',
          kind: 'supersedes',
          from: corpusEid(entry.artifactId),
          to: entry.supersedesEid,
        });
      }
    }
    if (retirement && retirement.executed === true) {
      for (const retired of retirement.retired) {
        const proposal = retirement.proposed.find((p) => p.artifactId === retired.artifactId);
        if (!proposal) {
          throw new Error(
            `kip fact construction: the retire executor reported '${retired.artifactId}' which was never a proposed retirement — refusing to assert an unapproved retirement fact.`
          );
        }
        facts.push({
          type: 'node',
          eid: corpusEid(retired.artifactId),
          kind: KIP_KIND,
          props: {
            status: proposal.decision === 'supersede' ? 'superseded' : 'retired',
            action: retired.action,
            retiredAt: nowIso(),
            successorEid: proposal.successorEid ?? null,
            approvalBreakpointId: 'knowledge-lifecycle.retire-artifact',
            runId: ctx.runId,
          },
        });
        if (proposal.successorEid) {
          facts.push({
            type: 'edge',
            kind: 'superseded-by',
            from: corpusEid(retired.artifactId),
            to: proposal.successorEid,
          });
        }
      }
    }
    facts.push({
      type: 'node',
      eid: `gate:${ctx.runId}:klw.accuracy-freshness`,
      kind: KIP_KIND,
      props: {
        passed: accuracyFreshnessGate.passed,
        attempts: accuracyFreshnessGate.attempts,
        escalated: accuracyFreshnessGate.escalated,
        issueCount: accuracyFreshnessGate.issues.length,
      },
    });
    if (retentionAuditGate) {
      facts.push({
        type: 'node',
        eid: `gate:${ctx.runId}:klw.retention-audit`,
        kind: KIP_KIND,
        props: {
          passed: retentionAuditGate.passed,
          attempts: retentionAuditGate.attempts,
          escalated: retentionAuditGate.escalated,
          issueCount: retentionAuditGate.issues.length,
        },
      });
    }
    // facts is non-empty by construction (the accuracy-gate outcome node is always
    // present), so kipAssert's empty-facts precondition can never trip here.
    const asserted = await ctx.task(klwKipAssertLifecycleTask, {
      facts,
      kipDir,
      kipModel,
      kipReplicaId,
      kipKind: KIP_KIND,
    });
    kipFactsAsserted = asserted.asserted;
    return asserted;
  };

  if (accuracyFreshnessGate.passed !== true) {
    // Fail closed: no adjudication, no taxonomy change, no publish, no exposure, no
    // retirement. The gate outcome is still asserted so the next run knows this attempt
    // failed.
    await runKipAssert();
    markPhase('kip-assert');
    timings.total = ctx.now() - startMs;
    return buildResult(
      false,
      'klw.accuracy-freshness gate failed — nothing published, no taxonomy changed, no knowledge retired'
    );
  }

  const adjudicationResult = await ctx.task(klwMergeAdjudicationTask, {
    bundlePath: bundle.bundlePath,
    gateIssues: accuracyGate.issues,
    gateEvidence: accuracyGate.evidence,
    knowledgeDomain,
  });
  // Cross-check: a candidate named in an unresolved critic issue may NOT appear in
  // publishReady — the strictest critic verdict wins; promotion is forbidden.
  const unresolvedArtifactIds = new Set(
    accuracyGate.issues
      .map((issue) => issue.artifactId)
      .filter((id) => typeof id === 'string' && id.length > 0)
  );
  for (const entry of adjudicationResult.publishReady) {
    if (unresolvedArtifactIds.has(entry.artifactId)) {
      throw new Error(
        `Adjudication promoted candidate '${entry.artifactId}' to publishReady past an unresolved critic issue — the strictest critic verdict wins; promotion is forbidden.`
      );
    }
  }
  adjudication = {
    publishReady: adjudicationResult.publishReady,
    needsMerge: adjudicationResult.needsMerge,
    rejected: adjudicationResult.rejected,
    supersedes: adjudicationResult.supersedes,
  };
  markPhase('adjudication');

  if (adjudication.publishReady.length === 0) {
    // Nothing survived adjudication: there is nothing to place, nothing to publish, and
    // no publish breakpoint is raised. The gate outcome is still asserted.
    await runKipAssert();
    markPhase('kip-assert');
    timings.total = ctx.now() - startMs;
    return buildResult(false, 'no candidate survived merge adjudication — nothing was placed, published or retired');
  }

  // -------------------------------------------------------------------------
  // P5 — taxonomy placement (+ conditional policy-gated taxonomy change)
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P5: taxonomy placement for ${adjudication.publishReady.length} publish-ready asset(s)`);
  const placement = await ctx.task(klwTaxonomyPlacementTask, {
    publishReadyCount: adjudication.publishReady.length,
    publishReady: adjudication.publishReady,
    taxonomySnapshotPath,
    corpusDir,
    knowledgeDomain,
  });
  let placementPlan = placement.placementPlan;
  const tc = placement.taxonomyChange;
  // A single agent may not silently suppress the taxonomy-change policy gate: the
  // per-candidate klw.classification lanes already declared taxonomyChangeRequired against
  // the pre-change snapshot, and the orchestrator throws when placement contradicts them.
  assertTaxonomyChangeNotSuppressed(adjudication.publishReady, laneById, tc);

  if (tc && tc.required === true) {
    // Dependency is declared per artifact by the placement agent, never inferred from a
    // path prefix (that inference is only valid for kind 'newBranch').
    assertPlacementDependencyMarkers(placementPlan);
    // Deliberately NO autoApproveAfterN and NO presentAlwaysApprove. The item's rules
    // only forbid auto-approval on retire-artifact and external-exposure, but a taxonomy
    // change re-classifies EVERY artifact already filed under the affected branch, so
    // this design declines auto-approval here too — stated so the choice is legible
    // rather than accidental.
    const taxonomyApproval = await routedBreakpoint(ctx, {
      question: `Change the governing taxonomy branch '${tc.branch}' (${tc.kind})? This re-classifies ${tc.impactedArtifactCount} artifact(s) already filed under it. Rollback path: ${tc.rollbackPath}.`,
      context: {
        runId: ctx.runId,
        files: [taxonomySnapshotPath],
        summary: {
          taxonomyChange: tc,
          reclassificationPlan: tc.reclassificationPlan,
          impactEvidence: placement.impactEvidence,
          affectedCandidates: placementPlan
            .filter((entry) => entry.dependsOnTaxonomyChange === true)
            .map((entry) => entry.artifactId),
        },
      },
    }, {
      breakpointId: 'knowledge-lifecycle.taxonomy-change',
      expert: 'information-architect',
      tags: ['policy-gated', 'knowledge-management', 'taxonomy'],
      strategy: 'single',
    });
    recordGate('knowledge-lifecycle.taxonomy-change', 'P5', taxonomyApproval);

    let taxonomyExecuted = false;
    if (taxonomyApproval.approved === true) {
      // The executor runs ONLY under this guard — there is no alternate taxonomy path.
      assertApproved(taxonomyApproval, 'knowledge-lifecycle.taxonomy-change');
      const executed = await ctx.task(klwTaxonomyChangeExecutorTask, {
        taxonomyChange: tc,
        placementPlan,
        taxonomySnapshotPath,
        corpusDir,
        approval: {
          breakpointId: 'knowledge-lifecycle.taxonomy-change',
          approved: true,
          response: taxonomyApproval.response ?? null,
        },
      });
      taxonomyExecuted = executed.executed === true;
    } else {
      // Rejected: the taxonomy is untouched and every candidate that depended on the
      // change is demoted to needsMerge. Dependency comes from the explicit per-artifact
      // marker OR from the candidate's own classification lane — a lane that declared
      // taxonomyChangeRequired:true is dependent even if the placement agent said otherwise.
      // Nothing is published under a guessed branch.
      const blocked = placementPlan.filter((entry) => {
        const lane = laneById.get(entry.artifactId);
        const laneDeclaredChange = Boolean(lane && lane.classification && lane.classification.taxonomyChangeRequired === true);
        return entry.dependsOnTaxonomyChange === true || laneDeclaredChange;
      });
      const blockedIds = new Set(blocked.map((entry) => entry.artifactId));
      placementPlan = placementPlan.filter((entry) => !blockedIds.has(entry.artifactId));
      // Fail-closed cross-check: anything still standing must be SHOWN to resolve under the
      // pre-change taxonomy, or the run throws rather than publishing under a guessed branch.
      assertSurvivorsResolvePreChangeTaxonomy(placementPlan, laneById, tc);
      const survivingPublishReady = adjudication.publishReady.filter((entry) => !blockedIds.has(entry.artifactId));
      const demoted = adjudication.publishReady
        .filter((entry) => blockedIds.has(entry.artifactId))
        .map((entry) => ({ candidate: entry, targetEid: null, reason: 'taxonomy-change rejected' }));
      adjudication = {
        ...adjudication,
        publishReady: survivingPublishReady,
        needsMerge: [...adjudication.needsMerge, ...demoted],
      };
      ctx.log?.('info', `P5: taxonomy-change rejected — ${blockedIds.size} candidate(s) demoted to needsMerge, taxonomy untouched`);
    }
    taxonomyChange = {
      required: true,
      branch: tc.branch,
      impactedArtifactCount: tc.impactedArtifactCount,
      approved: taxonomyApproval.approved === true,
      autoApproved: taxonomyApproval.autoApproved === true || taxonomyApproval.autoApprove === true,
      executed: taxonomyExecuted,
      response: taxonomyApproval.response ?? null,
    };
    gatedActions.taxonomyChange = recordGatedAction(
      'knowledge-lifecycle.taxonomy-change', true, taxonomyApproval, taxonomyExecuted
    );
  } else {
    // Sparse breakpoints: no taxonomy mutation is needed, so the gate is never raised.
    taxonomyChange = null;
  }
  placementByArtifactId = new Map(placementPlan.map((entry) => [entry.artifactId, entry]));
  markPhase('taxonomy-placement');

  if (adjudication.publishReady.length === 0) {
    // Every publish-ready candidate depended on the rejected taxonomy change.
    await runKipAssert();
    markPhase('kip-assert');
    timings.total = ctx.now() - startMs;
    return buildResult(
      false,
      'taxonomy-change rejected — every publish-ready candidate was demoted to needsMerge; nothing published under a guessed branch'
    );
  }

  // -------------------------------------------------------------------------
  // P6 — publication package + policy-gated publish (+ conditional exposure)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: publication package + knowledge-lifecycle.publish-to-shared-kb policy gate');
  const packageDir = `${outputDir}/publication-${ctx.runId}`;
  const pkg = await ctx.task(klwPublicationPackageTask, {
    packageDir,
    knowledgeDomain,
    publishReady: adjudication.publishReady,
    placementPlan,
    gateEvidence: accuracyFreshnessGate.evidence,
    gateAttempts: accuracyFreshnessGate.attempts,
    intake,
    runId: ctx.runId,
  });
  for (const file of pkg.files) {
    artifacts.push(file);
  }

  const openGaps = candidateLanes
    .filter((lane) => Array.isArray(lane.enrichment.openGaps) && lane.enrichment.openGaps.length > 0)
    .map((lane) => ({ artifactId: lane.artifactId, openGaps: lane.enrichment.openGaps }));

  // NO autoApproveAfterN: publication makes an artifact an authoritative organizational
  // reference, so it must never auto-execute.
  const publishApproval = await routedBreakpoint(ctx, {
    question: `Publish ${adjudication.publishReady.length} knowledge asset(s) to the shared knowledge base for '${knowledgeDomain}'? (accuracy/freshness gate attempts: ${accuracyFreshnessGate.attempts}, ${adjudication.needsMerge.length} held for merge, ${adjudication.rejected.length} rejected)`,
    context: {
      runId: ctx.runId,
      files: [pkg.manifestPath, ...pkg.files],
      summary: {
        publishReady: adjudication.publishReady.map((entry) => ({
          artifactId: entry.artifactId,
          title: entry.title,
          taxonomyPath: placementByArtifactId.has(entry.artifactId)
            ? placementByArtifactId.get(entry.artifactId).taxonomyPath
            : null,
        })),
        accuracyFreshnessGate: {
          passed: accuracyFreshnessGate.passed,
          attempts: accuracyFreshnessGate.attempts,
          issues: accuracyFreshnessGate.issues,
          evidence: accuracyFreshnessGate.evidence,
        },
        dedupeVerdicts: candidateLanes.map((lane) => ({ artifactId: lane.artifactId, verdict: lane.dedupe.verdict })),
        supersedes: adjudication.supersedes,
        needsMerge: adjudication.needsMerge,
        rejected: adjudication.rejected,
        openGaps,
      },
    },
  }, {
    breakpointId: 'knowledge-lifecycle.publish-to-shared-kb',
    expert: 'knowledge-manager',
    tags: ['policy-gated', 'knowledge-management', 'publish'],
    strategy: 'single',
  });
  recordGate('knowledge-lifecycle.publish-to-shared-kb', 'P6', publishApproval);

  publication = {
    packagePath: pkg.packageDir,
    approved: publishApproval.approved === true,
    published: false,
    locations: [],
    signoffResponse: publishApproval.response ?? null,
  };
  if (publishApproval.approved === true) {
    // The executor runs ONLY under this guard — there is no alternate publish path.
    assertApproved(publishApproval, 'knowledge-lifecycle.publish-to-shared-kb');
    const executed = await ctx.task(klwPublishExecutorTask, {
      packageDir: pkg.packageDir,
      corpusDir,
      publishReady: adjudication.publishReady,
      placementPlan,
      approval: {
        breakpointId: 'knowledge-lifecycle.publish-to-shared-kb',
        approved: true,
        response: publishApproval.response ?? null,
      },
    });
    publication = {
      ...publication,
      published: executed.published === true,
      locations: executed.locations,
    };
  } else {
    // Rejected: the package stays on disk, nothing enters the shared KB, and the
    // external-exposure gate is never raised — exposure without publication is impossible.
    ctx.log?.('info', 'P6: publish-to-shared-kb rejected — package retained on disk, nothing published');
  }
  gatedActions.publishToSharedKb = recordGatedAction(
    'knowledge-lifecycle.publish-to-shared-kb', true, publishApproval, publication.published
  );

  if (externalExposureRequested === true && publication.published === true) {
    ctx.log?.('info', 'P6: external-exposure package + knowledge-lifecycle.external-exposure policy gate');
    const exposurePackage = await ctx.task(klwExternalExposurePackageTask, {
      assetCount: adjudication.publishReady.length,
      exposurePackageDir: `${outputDir}/external-exposure-${ctx.runId}`,
      publishReady: adjudication.publishReady,
      publishedLocations: publication.locations,
      corpusDir,
    });
    for (const file of exposurePackage.files) {
      artifacts.push(file);
    }
    // NO autoApproveAfterN: external exposure cannot be un-published from the internet.
    const exposureApproval = await routedBreakpoint(ctx, {
      question: `Expose ${adjudication.publishReady.length} published knowledge asset(s) on an external/customer-facing surface? Review the redaction log and residual risks — external exposure cannot be undone.`,
      context: {
        runId: ctx.runId,
        files: exposurePackage.files,
        summary: {
          redactionLog: exposurePackage.redactionLog,
          residualRisks: exposurePackage.residualRisks,
          surfacesProposed: exposurePackage.surfacesProposed,
          publishedLocations: publication.locations,
        },
      },
    }, {
      breakpointId: 'knowledge-lifecycle.external-exposure',
      expert: 'communications-lead',
      tags: ['policy-gated', 'knowledge-management', 'external-exposure', 'irreversible'],
      strategy: 'single',
    });
    recordGate('knowledge-lifecycle.external-exposure', 'P6', exposureApproval);

    let exposed = false;
    let surfaces = [];
    if (exposureApproval.approved === true) {
      // A publish approval NEVER implies an exposure approval — this guard is separate.
      assertApproved(exposureApproval, 'knowledge-lifecycle.external-exposure');
      const executedExposure = await ctx.task(klwExternalExposureExecutorTask, {
        exposurePackageDir: exposurePackage.exposurePackageDir,
        redactionLog: exposurePackage.redactionLog,
        approval: {
          breakpointId: 'knowledge-lifecycle.external-exposure',
          approved: true,
          response: exposureApproval.response ?? null,
        },
      });
      exposed = executedExposure.exposed === true;
      surfaces = executedExposure.surfaces;
    } else {
      ctx.log?.('info', 'P6: external-exposure rejected — the redacted package remains internal-only');
    }
    externalExposure = {
      requested: true,
      approved: exposureApproval.approved === true,
      exposed,
      surfaces,
      response: exposureApproval.response ?? null,
    };
    gatedActions.externalExposure = recordGatedAction(
      'knowledge-lifecycle.external-exposure', true, exposureApproval, exposed
    );
  } else {
    // Not requested, or publication never happened: recorded as required:false rather
    // than omitted, so 'not raised' can never be read as 'not applicable'.
    externalExposure = externalExposureRequested === true
      ? { requested: true, approved: false, exposed: false, surfaces: [], response: null }
      : null;
  }
  markPhase('publication');

  // -------------------------------------------------------------------------
  // P7 — decay monitoring + retention-audit gate + policy-gated retirement
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P7: decay scan over this process\'s own prior kip assertions');
  const retentionDecisionsPath = `${outputDir}/retention-decisions-${ctx.runId}.json`;
  const decayScan = await ctx.task(klwDecayScanTask, {
    knowledgeDomain,
    corpusDir,
    retentionPolicy,
    retentionDecisionsPath,
    priorCorpus,
    publishedThisRun: adjudication.publishReady.map((entry) => entry.artifactId),
    kipDir,
    kipModel,
    kipReplicaId,
  });
  // An unreachable store at decay time is surfaced, never read as 'nothing needs retiring'.
  assertKipStoreAvailable(decayScan, 'P7-decay-scan');
  // The retention-audit gate guards an IRREVERSIBLE deletion, so it must judge the file the
  // agent actually wrote — the AGENT-REPORTED path, mirroring bundle.bundlePath. A missing or
  // divergent path means the gate would be reviewing nothing, so it throws.
  if (typeof decayScan.retentionDecisionsPath !== 'string' || decayScan.retentionDecisionsPath.length === 0) {
    throw new Error(
      `P7-decay-scan: klw.decay-scan reported no retentionDecisionsPath (got ${JSON.stringify(decayScan.retentionDecisionsPath)}). ` +
      'The retention-audit gate guards an irreversible deletion and must judge the decision file on disk, not an unwritten path.'
    );
  }
  if (decayScan.retentionDecisionsPath !== retentionDecisionsPath) {
    throw new Error(
      `P7-decay-scan: klw.decay-scan wrote its retention decisions to '${decayScan.retentionDecisionsPath}' instead of the requested '${retentionDecisionsPath}'. ` +
      'The gate artifact, the retire breakpoint context and the evidence fixer all reference the requested path; a divergent path would leave the irreversible-deletion gate reviewing a different file.'
    );
  }
  const retentionDecisionsArtifact = decayScan.retentionDecisionsPath;
  for (const decision of decayScan.decisions) {
    assertRetentionDecision(decision.decision, decision.artifactId);
  }
  decay = {
    scannedAssetCount: decayScan.scannedAssetCount,
    priorAssertionCount: decayScan.priorAssertionCount,
    decisions: decayScan.decisions,
  };
  artifacts.push(retentionDecisionsArtifact);

  const retirementCandidates = decayScan.decisions.filter(
    (decision) => decision.decision === 'supersede' || decision.decision === 'retire'
  );
  if (retirementCandidates.length > 0) {
    const retentionGate = await adversarialGate(ctx, {
      gateId: 'klw.retention-audit',
      artifact: {
        path: retentionDecisionsArtifact,
        description: 'Retention decisions with per-asset evidence, restricted to supersede/retire proposals',
      },
      critics: [
        {
          name: 'supersession-evidence-critic',
          role: 'Adversarial retirement auditor',
          focus: 'the asset really is superseded or obsolete',
          instructions: [
            KIP_LIBRARIAN_NOTE,
            KIP_CLI_NOTE,
            `IRON LAW: for every proposal, run \`kip get <corpus-asset eid> --dir ${kipDir} --replica ${kipReplicaId} --json\` yourself and READ the claimed successor article end-to-end; evidence = the executed commands plus raw excerpts, and cite the successor by fact-id (eid) and by path:line.`,
            'A successor that does not cover everything the retiring asset covers is a failing issue — name the uncovered content explicitly.',
            'A retire proposal with no successor must prove obsolescence with executed evidence (the referenced system/process is absent from the corpus); an unproven obsolescence claim is a failing issue.',
            `Threshold-only reasoning ('older than ${retentionPolicy.staleAfterDays} days') is NEVER sufficient to retire — age is a review trigger, not a retirement proof.`,
            VERDICT_SCHEMA_PIN,
          ],
        },
        {
          name: 'institutional-memory-critic',
          role: 'Institutional-memory risk auditor',
          focus: 'what the organization loses if this is retired',
          instructions: [
            `Search the corpus under ${corpusDir} (executed grep) for inbound references to each proposed asset and cite every referrer as path:line — a referenced asset being retired without redirecting its referrers is a failing issue.`,
            'Flag uniquely-held knowledge (only source for a procedure, a decision rationale, or a post-incident lesson) as a failing issue unless the successor reproduces it verbatim; quote both sides.',
            'Recommend the least destructive action that satisfies the proposal (retain/refresh/supersede over retire) and say so in the issue\'s requiredFix.',
            VERDICT_SCHEMA_PIN,
          ],
        },
      ],
      ironLaw: [
        'Deleting institutional knowledge is unrecoverable. Your default verdict on any retirement proposal is FAIL.',
        'Judge the corpus files and the kip store on disk, not the analyst\'s summary.',
        'A PASS on any retirement proposal without an executed kip get/recall excerpt AND an executed read of the claimed successor is invalid.',
      ],
      maxFixAttempts,
      fixer: {
        task: klwRetentionEvidenceFixerTask,
        args: { corpusDir, retentionPolicy, retentionDecisionsPath: retentionDecisionsArtifact, kipDir, kipReplicaId, kipModel },
      },
      context: {
        corpusDir,
        retentionPolicy,
        retentionDecisionsPath: retentionDecisionsArtifact,
        kipDir,
        kipReplicaId,
        kipModel,
        priorCorpus,
        publishedThisRun: adjudication.publishReady.map((entry) => entry.artifactId),
      },
    });
    retentionAuditGate = {
      passed: retentionGate.passed,
      attempts: retentionGate.attempts,
      escalated: retentionGate.escalated,
      issues: retentionGate.issues,
      evidence: retentionGate.evidence,
    };
    if (retentionGate.escalated) {
      breakpointsHit.push('klw.retention-audit.gate-escalation');
    }

    if (retentionGate.passed === true) {
      const proposals = retirementCandidates.map((decision) => ({
        artifactId: decision.artifactId,
        corpusPath: decision.corpusPath ?? null,
        decision: decision.decision,
        rationale: decision.rationale,
        successorEid: decision.successorEid ?? null,
        evidence: decision.evidence,
      }));
      // NO autoApproveAfterN, explicitly forbidden: loss of institutional memory is
      // unrecoverable, so this gate never auto-approves regardless of repetition.
      const retireApproval = await routedBreakpoint(ctx, {
        question: `Retire/supersede ${proposals.length} knowledge asset(s)? This is not recoverable. Default action is ARCHIVE + tombstone; reply with an explicit per-artifact deletion authorization if you want hard deletion.`,
        context: {
          runId: ctx.runId,
          files: [retentionDecisionsArtifact, ...proposals.map((p) => p.corpusPath).filter((p) => typeof p === 'string')],
          summary: {
            proposals,
            retentionAuditGate: {
              passed: retentionAuditGate.passed,
              attempts: retentionAuditGate.attempts,
              issues: retentionAuditGate.issues,
              evidence: retentionAuditGate.evidence,
            },
            priorAssertionCount: decay.priorAssertionCount,
            unassessed: decayScan.unassessed,
          },
        },
      }, {
        breakpointId: 'knowledge-lifecycle.retire-artifact',
        expert: 'knowledge-manager',
        tags: ['policy-gated', 'knowledge-management', 'retention', 'irreversible'],
        strategy: 'single',
      });
      recordGate('knowledge-lifecycle.retire-artifact', 'P7', retireApproval);

      let retireExecuted = false;
      let retired = [];
      if (retireApproval.approved === true) {
        // The executor runs ONLY under this guard — there is no alternate retire path,
        // and hard deletion additionally requires per-artifact authorization inside the
        // approval response.
        assertApproved(retireApproval, 'knowledge-lifecycle.retire-artifact');
        const executedRetire = await ctx.task(klwRetireExecutorTask, {
          proposalCount: proposals.length,
          proposals,
          corpusDir,
          approval: {
            breakpointId: 'knowledge-lifecycle.retire-artifact',
            approved: true,
            response: retireApproval.response ?? null,
          },
        });
        retireExecuted = executedRetire.executed === true;
        retired = executedRetire.retired;
      } else {
        // Nothing is archived or deleted; the decisions stay in outputs.decay so the
        // next run can re-raise them.
        ctx.log?.('info', 'P7: retire-artifact rejected — nothing archived, nothing deleted');
      }
      retirement = {
        proposed: proposals,
        approved: retireApproval.approved === true,
        executed: retireExecuted,
        retired,
        response: retireApproval.response ?? null,
      };
      gatedActions.retireArtifact = recordGatedAction(
        'knowledge-lifecycle.retire-artifact', true, retireApproval, retireExecuted
      );
    } else {
      // Fail closed TOWARD KEEPING KNOWLEDGE: a failed retention audit can only ever
      // mean 'keep'. The retire breakpoint is never raised.
      ctx.log?.('info', 'P7: klw.retention-audit gate failed — no retirement proposed, retire breakpoint never raised');
      retirement = {
        proposed: [],
        approved: false,
        executed: false,
        retired: [],
        response: null,
      };
    }
  } else {
    // Every decision was retain/refresh: no gate, no breakpoint, nothing retired.
    retentionAuditGate = null;
    retirement = null;
  }
  markPhase('decay-retention');

  // -------------------------------------------------------------------------
  // P8 — deterministic kip assert (facts built by the orchestrator)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: deterministic kip assert of published, retired and gate-outcome facts');
  const assertResult = await runKipAssert();
  markPhase('kip-assert');
  timings.total = ctx.now() - startMs;

  const assertFailures = Array.isArray(assertResult.failed) ? assertResult.failed : [];
  if (assertFailures.length > 0) {
    return buildResult(false, `kip assert reported ${assertFailures.length} failure(s) — the lifecycle record is incomplete`);
  }
  if (publication.approved !== true) {
    return buildResult(false, 'knowledge-lifecycle.publish-to-shared-kb rejected — assets curated and verified but never published (fail-closed)');
  }
  return buildResult(publication.published === true);
}
