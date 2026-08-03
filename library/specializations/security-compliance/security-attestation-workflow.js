/**
 * @process specializations/security-compliance/security-attestation-workflow
 * @description Security certification and attestation end-to-end workflow (SOC 2 / ISO 27001
 *   shape). Scope + system-boundary definition -> framework control mapping -> scope-integrity
 *   adversarial gate -> parallel per-control evidence collection (ctx.parallel.map) fanned out
 *   alongside parallel scan-family evidence (ctx.parallel.all over sast/dast/sca/container/iac)
 *   -> bounded gap-remediation loop that always returns to the gate -> adversarial
 *   evidence-sufficiency gate whose critics INDEPENDENTLY RE-COLLECT a sampled subset of
 *   control evidence by executing the check themselves -> policy-gated control exceptions and
 *   residual-risk acceptances -> attestation package draft -> policy-gated management sign-off
 *   -> policy-gated external evidence release / report issuance -> continuous-monitoring
 *   handoff -> kip assert of the attestation register.
 * @inputs {
 *   organization: string,             // REQUIRED — the entity being attested
 *   framework: string,                // REQUIRED — 'soc2-type1'|'soc2-type2'|'iso27001'|'soc2-and-iso27001'
 *   auditPeriod: {                    // REQUIRED ISO dates — Type II / ISO surveillance windows are period-bound
 *     start: string,
 *     end: string
 *   },
 *   scopeProposal: {                  // REQUIRED with a non-empty systems array
 *     systems: string[],
 *     services?: string[],
 *     locations?: string[],
 *     exclusions?: Array<{ ref: string, rationale: string }>
 *   },
 *   controlFamilies?: string[],       // subset of CONTROL_FAMILIES; omitted means ALL families (never a silently narrowed default)
 *   scanFamilies?: string[],          // subset of SCAN_FAMILIES; omitted means all five
 *   externalAuditor?: { firm: string, contact: string },  // REQUIRED (throws) when issueExternalReport is true
 *   issueExternalReport?: boolean,    // default false — true arms the external-evidence-release gate and the report-issuance executor
 *   maxFixAttempts?: number,          // critic-gate fixer budget (default 2)
 *   maxRemediationRounds?: number,    // bounded gap-remediation loop rounds (default 2)
 *   kipEnabled?: boolean,             // recall + assert attestation memory via kip (default true)
 *   kipDir?: string,                  // kip store directory (default '.a5c/kip')
 *   kipModel?: string,                // model for kip structured paths (default 'sonnet')
 *   artifactsDir?: string             // where scope/evidence/package artifacts land (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,                 // true only when: scope-integrity gate passed, evidence-sufficiency gate passed,
 *                                     // zero controls left 'failed' without an approved exception or accepted residual risk,
 *                                     // management sign-off approved, and (when issueExternalReport) the report was issued
 *                                     // through the approved gate
 *   attestationId: string,            // kebab-case, minted from organization + framework + auditPeriod.end
 *   framework: string,
 *   scope: { systems, services, locations, exclusions: Array<{ ref, rationale, approved }>, scopeIntegrityPassed: boolean },
 *   controls: Array<{ controlId, family, framework, criterionRef, status, evidenceStrength, evidenceRefs: string[], gapId? }>,
 *   controlSummary: { total, satisfied, partial, failed, notApplicable },
 *   gaps: Array<{ gapId, controlId, severity, description, remediationRounds, resolved }>,
 *   scanEvidence: Array<{ scanFamily, tool, command, findingCounts: { critical, high, medium, low }, artifactPath }>,
 *   gates: {
 *     scopeIntegrity: { passed, attempts, escalated, issues },
 *     evidenceSufficiency: { passed, attempts, escalated, issues }
 *   },
 *   exceptions: Array<{ controlId, severity, expiresAt, approved, autoApproved }>,
 *   residualRisks: Array<{ riskId, controlId, description, accepted, acceptedBy }>,
 *   attestation: { packagePath, signedOff, signedBy, signedAt } | null,
 *   externalReport: { issued, recipient, packagePath, issuedAt, releaseManifest } | null,
 *   continuousMonitoring: { planPath, controlsUnderContinuousTest: number, cadence, nextCycleStartsAt } | null,
 *   autoApprovals: Array<{ breakpointId, phase, at }>,  // ALWAYS present (possibly empty) — fail-closed provenance
 *   kipFactsAsserted: number,
 *   artifacts: string[],
 *   metadata: { processId, runId, ledger, breakpointsHit, composedProcesses: string[], reason? }
 * }
 * @graph
 *   domains: [domain:security]
 *   specializations: [specialization:security-compliance]
 *   workflows: [workflow:compliance-audit]
 *   roles: [role:ciso, role:compliance-officer, role:security-engineer]
 *   skillAreas: [skill-area:compliance-automation]
 * @policyGatedActions security-attestation.management-signoff,
 *   security-attestation.residual-risk-acceptance, security-attestation.control-exception,
 *   security-attestation.external-evidence-release, security-attestation.scope-reduction
 * @composes-by-name specializations/security-compliance/soc2-compliance,
 *   specializations/security-compliance/iso27001-implementation,
 *   specializations/security-compliance/security-policies,
 *   specializations/security-compliance/data-classification,
 *   specializations/security-compliance/iam-access-control,
 *   specializations/security-compliance/secrets-management,
 *   specializations/security-compliance/encryption-standards,
 *   specializations/security-compliance/security-logging-monitoring,
 *   specializations/security-compliance/vulnerability-management,
 *   specializations/security-compliance/sast-pipeline,
 *   specializations/security-compliance/dast-process,
 *   specializations/security-compliance/sca-dependency-management,
 *   specializations/security-compliance/container-security,
 *   specializations/security-compliance/iac-security-review,
 *   specializations/security-compliance/codebase-security-audit,
 *   specializations/security-compliance/penetration-testing,
 *   specializations/security-compliance/stride-threat-modeling,
 *   specializations/security-compliance/third-party-risk,
 *   specializations/security-compliance/business-continuity,
 *   specializations/security-compliance/disaster-recovery-testing,
 *   specializations/security-compliance/security-training,
 *   specializations/security-compliance/incident-response
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every evidence-carrying
 * outputSchema declares evidence { type:'array', minItems:1 }; NO fallbacks — unknown
 * framework/family/status/evidence-strength/policy-action throws, an UNCOLLECTABLE evidence
 * item marks its control 'failed' and is NEVER an assumed-satisfied default, a control whose
 * only evidence is a policy document can never reach 'satisfied', the executors for sign-off,
 * exception, residual-risk and external release run ONLY on approved===true with no alternate
 * path, and the run ledger is accumulated in the ORCHESTRATOR (never inside agents) so the
 * gate critics diff against ground truth the agents cannot rewrite.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Frozen domain model — control families, composition table, frameworks,
// scan families, evidence strengths, control statuses, policy routing
// ---------------------------------------------------------------------------

/** Ordered control families this workflow can attest. */
export const CONTROL_FAMILIES = Object.freeze([
  'governance-policy',
  'data-protection',
  'access-control',
  'cryptography',
  'logging-monitoring',
  'vulnerability-management',
  'application-security',
  'infrastructure-security',
  'third-party-risk',
  'resilience',
  'people-security',
  'incident-response',
]);

/**
 * The BY-NAME composition table. Every value is a library process path — this workflow
 * anchors those point processes and never inlines a re-implementation of their logic.
 */
export const FAMILY_COMPOSITION = Object.freeze({
  'governance-policy': Object.freeze([
    'specializations/security-compliance/security-policies',
    'specializations/security-compliance/soc2-compliance',
    'specializations/security-compliance/iso27001-implementation',
  ]),
  'data-protection': Object.freeze([
    'specializations/security-compliance/data-classification',
  ]),
  'access-control': Object.freeze([
    'specializations/security-compliance/iam-access-control',
    'specializations/security-compliance/secrets-management',
  ]),
  cryptography: Object.freeze([
    'specializations/security-compliance/encryption-standards',
  ]),
  'logging-monitoring': Object.freeze([
    'specializations/security-compliance/security-logging-monitoring',
  ]),
  'vulnerability-management': Object.freeze([
    'specializations/security-compliance/vulnerability-management',
    'specializations/security-compliance/penetration-testing',
  ]),
  'application-security': Object.freeze([
    'specializations/security-compliance/sast-pipeline',
    'specializations/security-compliance/dast-process',
    'specializations/security-compliance/sca-dependency-management',
    'specializations/security-compliance/codebase-security-audit',
    'specializations/security-compliance/stride-threat-modeling',
  ]),
  'infrastructure-security': Object.freeze([
    'specializations/security-compliance/container-security',
    'specializations/security-compliance/iac-security-review',
  ]),
  'third-party-risk': Object.freeze([
    'specializations/security-compliance/third-party-risk',
  ]),
  resilience: Object.freeze([
    'specializations/security-compliance/business-continuity',
    'specializations/security-compliance/disaster-recovery-testing',
  ]),
  'people-security': Object.freeze([
    'specializations/security-compliance/security-training',
  ]),
  'incident-response': Object.freeze([
    'specializations/security-compliance/incident-response',
  ]),
});

/** Attestation frameworks. periodBound frameworks require operating evidence across the window. */
export const FRAMEWORKS = Object.freeze({
  'soc2-type1': Object.freeze({
    label: 'SOC 2 Type I',
    criteriaSource: 'AICPA Trust Services Criteria (2017, rev. 2022)',
    periodBound: false,
  }),
  'soc2-type2': Object.freeze({
    label: 'SOC 2 Type II',
    criteriaSource: 'AICPA Trust Services Criteria (2017, rev. 2022)',
    periodBound: true,
  }),
  iso27001: Object.freeze({
    label: 'ISO/IEC 27001:2022',
    criteriaSource: 'ISO/IEC 27001:2022 Annex A + Statement of Applicability',
    periodBound: true,
  }),
  'soc2-and-iso27001': Object.freeze({
    label: 'SOC 2 Type II + ISO/IEC 27001:2022',
    criteriaSource: 'AICPA TSC + ISO/IEC 27001:2022 Annex A',
    periodBound: true,
  }),
});

/** The ctx.parallel.all scan fan-out set. Each family composes its point process BY NAME. */
export const SCAN_FAMILIES = Object.freeze({
  sast: Object.freeze({
    composedProcess: 'specializations/security-compliance/sast-pipeline',
    expectedArtifact: 'sast-findings.json',
  }),
  dast: Object.freeze({
    composedProcess: 'specializations/security-compliance/dast-process',
    expectedArtifact: 'dast-findings.json',
  }),
  sca: Object.freeze({
    composedProcess: 'specializations/security-compliance/sca-dependency-management',
    expectedArtifact: 'sca-sbom-and-findings.json',
  }),
  container: Object.freeze({
    composedProcess: 'specializations/security-compliance/container-security',
    expectedArtifact: 'container-scan-findings.json',
  }),
  iac: Object.freeze({
    composedProcess: 'specializations/security-compliance/iac-security-review',
    expectedArtifact: 'iac-scan-findings.json',
  }),
});

/**
 * Evidence strengths, ordered strongest to weakest. THE LOAD-BEARING RULE lives here:
 * only 'executed-check' and 'artifact-inspection' are SUFFICIENT strengths.
 * 'policy-document' and 'attestation-claim' are insufficient ALONE — a perfectly written
 * policy proves the control was designed, never that it operates.
 */
export const EVIDENCE_STRENGTHS = Object.freeze([
  'executed-check',
  'artifact-inspection',
  'policy-document',
  'attestation-claim',
]);

/** The only strengths that can carry a control to 'satisfied'. */
export const SUFFICIENT_EVIDENCE_STRENGTHS = Object.freeze(['executed-check', 'artifact-inspection']);

/**
 * Control statuses. There is deliberately no 'assumed' / 'unknown' status: an
 * uncollectable evidence item yields 'failed'.
 */
export const CONTROL_STATUSES = Object.freeze(['satisfied', 'partial', 'failed', 'not-applicable']);

/** Risk / gap severities. */
export const SEVERITIES = Object.freeze(['low', 'medium', 'high', 'critical']);

/**
 * The policy-gate routing table. breakpointId === actionId everywhere. There is no default
 * expert: policyExpert() throws on an unknown action.
 */
export const POLICY_GATED_ACTIONS = Object.freeze({
  'security-attestation.management-signoff': Object.freeze({
    expert: 'ciso',
    description: 'Sign the management representation/attestation asserting control effectiveness to an external party.',
    autoApprovable: false,
  }),
  'security-attestation.residual-risk-acceptance': Object.freeze({
    expert: 'ciso',
    description: 'Formally accept a residual risk rather than remediate it.',
    autoApprovable: false,
  }),
  'security-attestation.control-exception': Object.freeze({
    expert: 'compliance-manager',
    description: 'Grant a time-boxed exception to a mandated control.',
    autoApprovable: true,
  }),
  'security-attestation.external-evidence-release': Object.freeze({
    expert: 'compliance-manager',
    description: 'Release collected evidence, including system and configuration detail, to an external auditor.',
    autoApprovable: false,
  }),
  'security-attestation.scope-reduction': Object.freeze({
    expert: 'ciso',
    description: 'Remove a system or boundary from the audit scope, which silently narrows what the attestation covers.',
    autoApprovable: false,
  }),
});

/**
 * Applied ONLY to control-exception breakpoints whose gap severity === 'low'. Any other
 * severity omits autoApproveAfterN entirely via a conditional spread.
 */
export const EXCEPTION_AUTO_APPROVE_AFTER_N = 3;

// ---------------------------------------------------------------------------
// Throwing assertions and lookups — no fallbacks anywhere
// ---------------------------------------------------------------------------

/**
 * Framework assertion. THROWS on anything outside FRAMEWORKS.
 *
 * @param {string} value - Candidate framework id
 * @param {string} source - Where the value came from (for the error message)
 * @returns {string} The validated value
 */
export function assertFramework(value, source) {
  if (!Object.prototype.hasOwnProperty.call(FRAMEWORKS, value)) {
    throw new Error(
      `Unknown attestation framework '${value}' from ${source} — expected one of ` +
      `${Object.keys(FRAMEWORKS).join('|')}. No fallback framework is applied.`
    );
  }
  return value;
}

/**
 * Control-family assertion. THROWS on anything outside CONTROL_FAMILIES.
 *
 * @param {string} value - Candidate control family
 * @param {string} source - Where the value came from
 * @returns {string} The validated value
 */
export function assertControlFamily(value, source) {
  if (!CONTROL_FAMILIES.includes(value)) {
    throw new Error(
      `Unknown control family '${value}' from ${source} — expected one of ` +
      `${CONTROL_FAMILIES.join('|')}. No fallback family is applied.`
    );
  }
  return value;
}

/**
 * Scan-family assertion. THROWS on anything outside SCAN_FAMILIES.
 *
 * @param {string} value - Candidate scan family
 * @param {string} source - Where the value came from
 * @returns {string} The validated value
 */
export function assertScanFamily(value, source) {
  if (!Object.prototype.hasOwnProperty.call(SCAN_FAMILIES, value)) {
    throw new Error(
      `Unknown scan family '${value}' from ${source} — expected one of ` +
      `${Object.keys(SCAN_FAMILIES).join('|')}. No fallback scan family is applied.`
    );
  }
  return value;
}

/**
 * Control-status assertion. THROWS on anything outside CONTROL_STATUSES, and rejects
 * 'unknown'/'assumed' explicitly — an uncollectable control is failed, never assumed.
 *
 * @param {string} value - Candidate control status
 * @param {string} source - Where the value came from
 * @returns {string} The validated value
 */
export function assertControlStatus(value, source) {
  if (value === 'unknown' || value === 'assumed') {
    throw new Error(
      `Rejected control status '${value}' from ${source} — an uncollectable control is failed, ` +
      `never assumed. Expected one of ${CONTROL_STATUSES.join('|')}.`
    );
  }
  if (!CONTROL_STATUSES.includes(value)) {
    throw new Error(
      `Unknown control status '${value}' from ${source} — expected one of ` +
      `${CONTROL_STATUSES.join('|')}. No fallback status is applied.`
    );
  }
  return value;
}

/**
 * Evidence-strength assertion. THROWS on anything outside EVIDENCE_STRENGTHS.
 *
 * @param {string} value - Candidate evidence strength
 * @param {string} source - Where the value came from
 * @returns {string} The validated value
 */
export function assertEvidenceStrength(value, source) {
  if (!EVIDENCE_STRENGTHS.includes(value)) {
    throw new Error(
      `Unknown evidence strength '${value}' from ${source} — expected one of ` +
      `${EVIDENCE_STRENGTHS.join('|')}. No fallback strength is applied.`
    );
  }
  return value;
}

/**
 * Policy-gate expert lookup. THROWS on an unknown actionId — there is deliberately no
 * default expert (exact analog of dsar-lifecycle deadlineExpert()).
 *
 * @param {string} actionId - One of the five policy-gated action ids
 * @returns {string} The expert route for the gate
 */
export function policyExpert(actionId) {
  const row = POLICY_GATED_ACTIONS[actionId];
  if (!row) {
    throw new Error(
      `POLICY_GATED_ACTIONS: unknown policy-gated action '${actionId}'. ` +
      `Known actions: ${Object.keys(POLICY_GATED_ACTIONS).join(', ')} — no default expert exists.`
    );
  }
  return row.expert;
}

/**
 * THE LOAD-BEARING RULE of this process. Returns true ONLY when at least one evidence item
 * was actually collected AND carries a sufficient strength. A set of policy-document /
 * attestation-claim items alone returns false, however good the policy is.
 *
 * @param {Array<{ref: string, strength: string, collected: boolean}>} evidenceItems - Collected items
 * @returns {boolean} Whether the evidence can carry a control to 'satisfied'
 */
export function evidenceIsSufficient(evidenceItems) {
  if (!Array.isArray(evidenceItems) || evidenceItems.length === 0) {
    throw new Error(
      'evidenceIsSufficient: a control with zero evidence items is a caller bug — it must be ' +
      'marked failed upstream. No fallback sufficiency is assumed.'
    );
  }
  for (const item of evidenceItems) {
    assertEvidenceStrength(item.strength, `evidenceIsSufficient(item ${item.ref})`);
  }
  return evidenceItems.some(
    (item) => item.collected === true && SUFFICIENT_EVIDENCE_STRENGTHS.includes(item.strength)
  );
}

/**
 * ORCHESTRATOR-SIDE ground truth. The agent's word never upgrades a control.
 *
 * - 'not-applicable' passes through only when the control carries a documented naReason.
 * - Any evidence item with collected === false makes the control 'failed', whatever was claimed.
 * - A claimed 'satisfied' with insufficient evidence is DOWNGRADED to 'partial'.
 *
 * @param {string} claimedStatus - The status the collecting agent claimed
 * @param {Array<{ref: string, strength: string, collected: boolean}>} evidenceItems - Its evidence items
 * @param {string} source - Where the claim came from (for error messages)
 * @param {string|null} naReason - The documented not-applicable reason carried by the control
 * @returns {string} The resolved, orchestrator-owned status
 */
export function resolveControlStatus(claimedStatus, evidenceItems, source, naReason) {
  assertControlStatus(claimedStatus, source);

  if (claimedStatus === 'not-applicable') {
    if (!naReason) {
      throw new Error(
        `resolveControlStatus: '${source}' claimed not-applicable with no documented naReason — ` +
        'an undocumented N/A is a silent scope reduction. No fallback reason is applied.'
      );
    }
    return 'not-applicable';
  }

  if (!Array.isArray(evidenceItems) || evidenceItems.length === 0) {
    throw new Error(
      `resolveControlStatus: '${source}' returned zero evidence items — a control with no ` +
      'evidence cannot be resolved. No fallback status is applied.'
    );
  }

  if (evidenceItems.some((item) => item.collected === false)) {
    return 'failed';
  }

  if (claimedStatus === 'satisfied' && !evidenceIsSufficient(evidenceItems)) {
    return 'partial';
  }

  return claimedStatus;
}

/**
 * Deterministic kebab-case attestation id. THROWS on any missing part — no timestamp fallback.
 *
 * @param {string} organization - The attested entity
 * @param {string} framework - The framework id
 * @param {string} periodEnd - ISO date ending the audit period
 * @returns {string} The minted attestation id
 */
export function mintAttestationId(organization, framework, periodEnd) {
  const kebab = (value) =>
    String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const parts = [
    { name: 'organization', value: organization },
    { name: 'framework', value: framework },
    { name: 'periodEnd', value: periodEnd },
  ];
  for (const part of parts) {
    if (!part.value || kebab(part.value).length === 0) {
      throw new Error(
        `mintAttestationId: '${part.name}' is required and must be non-empty (got ` +
        `${JSON.stringify(part.value)}) — no timestamp fallback id is minted.`
      );
    }
  }
  return parts.map((part) => kebab(part.value)).join('-');
}

// ---------------------------------------------------------------------------
// P1 — scope definition
// ---------------------------------------------------------------------------

export const scopeDefinitionTask = defineTask('sa.scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define attestation boundary for ${args.organization} (${args.framework})`,
  agent: {
    name: 'attestation-scope-architect',
    prompt: {
      role: 'Attestation scope architect',
      task: 'Turn the proposed scope into a defensible system boundary for the attestation',
      context: args,
      instructions: [
        'Enumerate inScopeSystems concretely: for each, systemId, description, dataCategories, owner, and why it is in scope for the framework criteria.',
        'Map the trust boundaries and the data flows crossing them — an attestation boundary that does not name its edges is not a boundary.',
        'Every proposed exclusion MUST carry: ref, rationale, materiality (low|medium|high|critical) and what an auditor would lose by not seeing it. An exclusion you cannot justify in those terms is not an exclusion — leave the system in scope.',
        'Cross-reference priorKnowledge: a system that was in scope last period and is proposed for exclusion now must say what changed.',
        'Never invent systems that are not in the proposal or the prior-period facts; gaps become scopeNotes, not invented inventory.',
        'Evidence entries must cite the concrete proposal fields, inventory sources, or prior-period kip facts behind each boundary decision — at least one entry.',
      ],
      outputFormat: 'JSON with attestationId string, inScopeSystems array (minItems 1) of { systemId, description, dataCategories, owner, inScopeReason }, trustBoundaries array, dataFlows array, proposedExclusions array of { ref, rationale, materiality, auditorImpact }, scopeNotes array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['attestationId', 'inScopeSystems', 'trustBoundaries', 'dataFlows', 'proposedExclusions', 'scopeNotes', 'evidence'],
      properties: {
        attestationId: { type: 'string' },
        inScopeSystems: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['systemId', 'description', 'dataCategories', 'owner', 'inScopeReason'],
          },
        },
        trustBoundaries: { type: 'array' },
        dataFlows: { type: 'array' },
        proposedExclusions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['ref', 'rationale', 'materiality', 'auditorImpact'],
          },
        },
        scopeNotes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'scope'],
}));

// ---------------------------------------------------------------------------
// P2 — framework control mapping + per-family gap assessment
// ---------------------------------------------------------------------------

export const frameworkMappingTask = defineTask('sa.framework-control-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Map ${args.framework} criteria to controls for ${args.attestationId}`,
  agent: {
    name: 'control-framework-mapper',
    prompt: {
      role: 'Control framework mapper',
      task: 'Map the framework criteria onto a concrete, owned control catalog for the defined scope',
      context: args,
      instructions: [
        'Emit one entry per control: controlId, family (one of the selected control families), criterionRef (the actual TSC ref like CC6.1 or Annex A ref like A.8.24 — never a paraphrase), requirement, ownerRole, testProcedure, composedProcess.',
        'composedProcess MUST be one of the library process paths supplied in context for that family (the FAMILY_COMPOSITION table) — this workflow composes the point processes BY NAME and never re-implements their logic inline.',
        'Every selected control family must yield at least one control; a family you believe is not applicable must still emit a control with a documented naReason rather than silently vanishing.',
        'Reflect priorKnowledge: a control that failed or carried an exception last period is flagged priorFinding:true so evidence collection starts under suspicion.',
        'Do not invent criteria references — if you cannot cite the exact clause, that is a mapping gap, not a guess.',
        'Evidence entries must cite the criteria source text and the scope facts each mapping rests on — at least one entry.',
      ],
      outputFormat: 'JSON with controls array (minItems 1) of { controlId, family, criterionRef, requirement, ownerRole, testProcedure, composedProcess, priorFinding, naReason? }, unmappedCriteria array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['controls', 'unmappedCriteria', 'evidence'],
      properties: {
        controls: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['controlId', 'family', 'criterionRef', 'requirement', 'ownerRole', 'testProcedure', 'composedProcess'],
          },
        },
        unmappedCriteria: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'control-mapping'],
}));

export const gapAssessmentTask = defineTask('sa.gap-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess control gaps for family ${args.family} (${args.attestationId})`,
  agent: {
    name: 'control-gap-assessor',
    prompt: {
      role: 'Control gap assessor',
      task: 'Compare the designed controls in this family against what is actually implemented',
      context: args,
      instructions: [
        'For each control in this family, judge design adequacy AND implementation state separately — a well-designed control that nobody operates is a gap, not a pass.',
        'Every gap carries: gapId, controlId, severity (low|medium|high|critical), description, suggestedRemediation, and the observation that grounds it.',
        'OPEN THE ARTIFACTS: read the referenced config, policy, or pipeline definition named by the composed process for this family. A gap assessment written from the control description alone is worthless.',
        'Do not pre-judge evidence sufficiency here — that is the gate\'s job. Report what you observed.',
        'Evidence entries must cite file:line or executed command output for each observation — at least one entry.',
      ],
      outputFormat: 'JSON with family string, gaps array of { gapId, controlId, severity, description, suggestedRemediation, observation }, controlsAssessed number, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['family', 'gaps', 'controlsAssessed', 'evidence'],
      properties: {
        family: { type: 'string' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            required: ['gapId', 'controlId', 'severity', 'description', 'suggestedRemediation', 'observation'],
          },
        },
        controlsAssessed: { type: 'number' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'gap-assessment'],
}));

// ---------------------------------------------------------------------------
// P3 — scope artifact (gate-1 artifact producer)
// ---------------------------------------------------------------------------

export const scopeArtifactTask = defineTask('sa.scope-artifact', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compile scope-and-mapping artifact for ${args.attestationId}`,
  agent: {
    name: 'scope-artifact-compiler',
    prompt: {
      role: 'Scope artifact compiler',
      task: `Compile the scope + control-mapping artifact at ${args.scopePath} for adversarial review`,
      context: args,
      instructions: [
        `Write the artifact to ${args.scopePath} and report that exact path back.`,
        'Sections in order: attested boundary (systems, trust boundaries, data flows), criteria-to-control mapping table, exclusions with their APPROVAL STATE (approved / rejected-and-kept-in-scope), and the per-family gap summary.',
        'Every exclusion row must show the ciso decision from the scope-reduction gate — an exclusion with no recorded decision is a defect, report it as such rather than omitting the row.',
        'Evidence entries must cite the scope-definition and mapping results the artifact was built from — at least one entry.',
      ],
      outputFormat: 'JSON with scopePath string, systemsInScope number, exclusionsApproved number, exclusionsRejected number, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['scopePath', 'systemsInScope', 'exclusionsApproved', 'exclusionsRejected', 'evidence'],
      properties: {
        scopePath: { type: 'string' },
        systemsInScope: { type: 'number' },
        exclusionsApproved: { type: 'number' },
        exclusionsRejected: { type: 'number' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'scope-artifact'],
}));

// ---------------------------------------------------------------------------
// P4 / P5 — control evidence collection (fan-out unit) and scan-family evidence
// ---------------------------------------------------------------------------

export const controlEvidenceCollectionTask = defineTask('sa.control-evidence-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: args.recollection
    ? `Re-collect evidence for ${args.control.controlId} (round ${args.round})`
    : `Collect evidence for ${args.control.controlId} (${args.control.criterionRef})`,
  agent: {
    name: 'control-evidence-collector',
    prompt: {
      role: 'Control evidence collector',
      task: `Collect operating evidence for control ${args.control.controlId} by EXECUTING its test procedure`,
      context: args,
      instructions: [
        'EXECUTE the control\'s testProcedure. Run the command, query the system, open the configuration file. Do not summarize what the control is supposed to do.',
        'Every evidenceItem carries: ref, strength (executed-check|artifact-inspection|policy-document|attestation-claim), collected (boolean), source, and collectedAt.',
        'STRENGTH IS NOT A COURTESY: a policy document or a written assertion is "policy-document"/"attestation-claim". Only a command you ran or an artifact you opened and read is "executed-check"/"artifact-inspection". Mislabelling strength is the single worst thing you can do in this process.',
        'If an evidence item CANNOT be collected (no access, system down, procedure undefined), report it with collected:false and the reason. Do NOT substitute a policy document for it, do not mark the control satisfied, do not assume the control operates. The orchestrator marks that control FAILED.',
        'Claim status satisfied only when at least one collected executed-check or artifact-inspection covers the requirement; otherwise claim partial or failed. The orchestrator re-resolves your status against your own evidence items and will downgrade an unsupported "satisfied".',
        'For period-bound frameworks, evidence must fall inside auditPeriod — an out-of-period artifact is reported with inPeriod:false, never silently counted.',
        args.recollection
          ? `Re-collection round ${args.round}: address ONLY the remediation applied in this round and re-run the same test procedure so the before/after is comparable.`
          : 'First collection round: execute the test procedure as written; there is no prior remediation to address.',
        'Evidence entries must be the raw executed outputs or file:line citations — at least one entry.',
      ],
      outputFormat: 'JSON with controlId string, status string (satisfied|partial|failed|not-applicable), evidenceItems array (minItems 1) of { ref, strength, collected, source, collectedAt, inPeriod }, uncollectable array of { ref, reason }, naReason string|null, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['controlId', 'status', 'evidenceItems', 'uncollectable', 'evidence'],
      properties: {
        controlId: { type: 'string' },
        status: { type: 'string', enum: ['satisfied', 'partial', 'failed', 'not-applicable'] },
        evidenceItems: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['ref', 'strength', 'collected', 'source', 'collectedAt'],
          },
        },
        uncollectable: {
          type: 'array',
          items: { type: 'object', required: ['ref', 'reason'] },
        },
        naReason: { type: ['string', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'evidence'],
}));

export const scanFamilyEvidenceTask = defineTask('sa.scan-family-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Collect ${args.scanFamily} scan evidence for ${args.attestationId}`,
  agent: {
    name: 'security-scan-evidence-collector',
    prompt: {
      role: 'Security scan evidence collector',
      task: `Run the ${args.scanFamily} scan family over the in-scope systems and capture reproducible findings`,
      context: args,
      instructions: [
        `Compose the named library process for this scan family (${args.spec.composedProcess}) rather than reinventing its pipeline — this workflow anchors those processes, it does not replace them.`,
        'Report the EXACT command you ran (tool, version, arguments) so the gate critic can re-run it verbatim. A finding set nobody can reproduce is not evidence.',
        'findingCounts must break down by severity: critical, high, medium, low.',
        `Write the findings artifact to ${args.artifactPath} and report that exact path back.`,
        'If the scan cannot run (tool missing, target unreachable), report ran:false with the reason — do NOT report a zero-finding clean result. A scan that did not run is not a clean scan.',
        'Evidence entries must be the raw scanner output (or its head plus the artifact path) — at least one entry.',
      ],
      outputFormat: 'JSON with scanFamily string, ran boolean, tool string, command string, findingCounts object { critical, high, medium, low }, artifactPath string, notRunReason string|null, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['scanFamily', 'ran', 'tool', 'command', 'findingCounts', 'artifactPath', 'evidence'],
      properties: {
        scanFamily: { type: 'string', enum: ['sast', 'dast', 'sca', 'container', 'iac'] },
        ran: { type: 'boolean' },
        tool: { type: 'string' },
        command: { type: 'string' },
        findingCounts: {
          type: 'object',
          required: ['critical', 'high', 'medium', 'low'],
        },
        artifactPath: { type: 'string' },
        notRunReason: { type: ['string', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'scan'],
}));

export const gapRemediationTask = defineTask('sa.gap-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remediate ${args.gap.gapId} on ${args.gap.controlId} (round ${args.round})`,
  agent: {
    name: 'control-gap-remediator',
    prompt: {
      role: 'Control gap remediator',
      task: 'Close the reported control gap so the control can produce collectable operating evidence',
      context: args,
      instructions: [
        'Fix the control itself — the configuration, the pipeline stage, the access rule, the retention setting. Writing a policy document that describes the control is NOT remediation and will be caught by the evidence-sufficiency gate.',
        'State exactly what changed and where (file:line, resource id, pipeline stage) so the re-collection round can execute the same test procedure against it.',
        'If a gap genuinely cannot be remediated in this cycle, say so with remediated:false and a reason — that routes it to the exception / residual-risk gates, which is an honest outcome. A false remediated:true is not.',
        'Do not touch controls outside this gap.',
        'Evidence entries must cite the concrete change made — at least one entry.',
      ],
      outputFormat: 'JSON with gapId string, controlId string, remediated boolean, changes array of { location, change }, blockedReason string|null, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['gapId', 'controlId', 'remediated', 'changes', 'evidence'],
      properties: {
        gapId: { type: 'string' },
        controlId: { type: 'string' },
        remediated: { type: 'boolean' },
        changes: {
          type: 'array',
          items: { type: 'object', required: ['location', 'change'] },
        },
        blockedReason: { type: ['string', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'remediation'],
}));

// ---------------------------------------------------------------------------
// P6 — evidence index (gate-2 artifact producer)
// ---------------------------------------------------------------------------

export const evidenceIndexTask = defineTask('sa.evidence-index', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compile evidence index for ${args.attestationId}`,
  agent: {
    name: 'evidence-index-compiler',
    prompt: {
      role: 'Evidence index compiler',
      task: `Compile the reviewable evidence index at ${args.indexPath}`,
      context: args,
      instructions: [
        `Write the index to ${args.indexPath} and report that exact path back — this file is the artifact the evidence-sufficiency critics review and re-verify.`,
        'One row per control: controlId, family, criterionRef, RESOLVED status (from the orchestrator, in context — not the collector\'s claim), each evidenceItem with its strength and collected flag, and the exact command or file path a reviewer must run/open to reproduce it.',
        'Include the scan-family table with the verbatim commands so a critic can re-run any scan.',
        'Flag every control whose evidence is policy-document/attestation-claim only in a dedicated "insufficient-strength" section — do not bury it.',
        'Do not editorialize the statuses; the orchestrator\'s resolved status is ground truth.',
        'Evidence entries must cite the collection results the index rows were built from — at least one entry.',
      ],
      outputFormat: 'JSON with indexPath string, rowCount number, insufficientStrengthControls array of controlId strings, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['indexPath', 'rowCount', 'insufficientStrengthControls', 'evidence'],
      properties: {
        indexPath: { type: 'string' },
        rowCount: { type: 'number' },
        insufficientStrengthControls: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'evidence-index'],
}));

// ---------------------------------------------------------------------------
// P7 — residual-risk assessment
// ---------------------------------------------------------------------------

export const residualRiskAssessmentTask = defineTask('sa.residual-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess residual risk for ${args.control.controlId} (${args.control.family})`,
  agent: {
    name: 'residual-risk-assessor',
    prompt: {
      role: 'Residual risk assessor',
      task: 'Assess the residual risk of an unresolved control and recommend a disposition',
      context: args,
      instructions: [
        'Recommend exactly one disposition: exception | accept-residual-risk | block.',
        '"exception" means the control will be implemented but needs a time-box; you MUST propose a concrete expiresAt date and the interim compensating controls.',
        '"accept-residual-risk" means the organization will live with it; you MUST state the impact honestly and name a review date.',
        '"block" means the attestation should not proceed on this control — recommend it when the gap materially undermines the criterion. Recommending block is a legitimate answer, not a failure.',
        'Severity is your judgement of the risk, not of the effort to fix it. Do not deflate severity to unlock the low-severity auto-approve path — the orchestrator only auto-approves low-severity exceptions and the gate critics see your reasoning.',
        'Compensating controls must be ones that actually exist and were evidenced, cited by controlId — an aspirational compensating control is not a control.',
        'Evidence entries must cite the failed evidence items and the compensating controls\' own evidence — at least one entry.',
      ],
      outputFormat: 'JSON with riskId string, controlId string, severity string (low|medium|high|critical), description string, impact string, compensatingControls array, recommendedDisposition string (exception|accept-residual-risk|block), proposedExpiresAt string|null, proposedReviewDate string|null, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['riskId', 'controlId', 'severity', 'description', 'impact', 'compensatingControls', 'recommendedDisposition', 'evidence'],
      properties: {
        riskId: { type: 'string' },
        controlId: { type: 'string' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        description: { type: 'string' },
        impact: { type: 'string' },
        compensatingControls: { type: 'array' },
        recommendedDisposition: { type: 'string', enum: ['exception', 'accept-residual-risk', 'block'] },
        proposedExpiresAt: { type: ['string', 'null'] },
        proposedReviewDate: { type: ['string', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'residual-risk'],
}));

// ---------------------------------------------------------------------------
// P8 — attestation package draft + post-approval sign-off recorder
// ---------------------------------------------------------------------------

export const attestationPackageTask = defineTask('sa.attestation-package', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise attestation package for ${args.attestationId} (gate feedback)`
    : `Draft attestation package for ${args.attestationId}`,
  agent: {
    name: 'attestation-package-author',
    prompt: {
      role: 'Attestation package author',
      task: `Draft the management representation and attestation package at ${args.packagePath} — DRAFT ONLY`,
      context: args,
      instructions: [
        `Write the package to ${args.packagePath} and report that exact path back.`,
        'Sections in order: scope statement (boundary + approved exclusions), management representation letter (unsigned), control matrix (controlId, criterionRef, resolved status, evidence strength, evidence refs), exception register (with expiry dates), residual-risk register (with acceptor and review date), open qualifications, and the two gate verdicts.',
        'DRAFT ONLY: you must NOT sign anything, must NOT fill in a signature block, and must NOT transmit the package anywhere. Signature comes from the management-signoff gate; transmission from the external-evidence-release gate.',
        'Qualifications are not optional: every control not resolved to satisfied appears in the open-qualifications section even when it has an approved exception. An attestation that hides its qualifications is a misrepresentation.',
        'Use the orchestrator\'s resolved statuses from context verbatim — do not recompute or round up.',
        'Evidence entries must cite the evidence index rows and gate verdicts each section rests on — at least one entry.',
      ],
      outputFormat: 'JSON with packagePath string, sectionsIncluded array, qualificationsCount number, representationLetterUnsigned boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'sectionsIncluded', 'qualificationsCount', 'representationLetterUnsigned', 'evidence'],
      properties: {
        packagePath: { type: 'string' },
        sectionsIncluded: { type: 'array' },
        qualificationsCount: { type: 'number' },
        representationLetterUnsigned: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'package', 'draft'],
}));

export const attestationSignoffRecordTask = defineTask('sa.attestation-signoff-record', (args, taskCtx) => ({
  kind: 'agent',
  title: `Record approved attestation sign-off for ${args.attestationId}`,
  agent: {
    name: 'attestation-signoff-recorder',
    prompt: {
      role: 'Attestation sign-off recorder',
      task: 'Record the approved management sign-off against the exact package that was approved',
      context: args,
      instructions: [
        'This task only ever runs AFTER the security-attestation.management-signoff gate approved the exact package in context — record it VERBATIM.',
        'Write the signature block into the package: signedBy (the accountable officer from the gate result), signedAt (ISO), the scope hash and control-summary hash from context so a later diff proves nothing changed after signature.',
        'Do NOT alter any other section of the package. Recording a signature is not an opportunity to soften a qualification.',
        'Report the signature block back exactly as written.',
        'Evidence entries must be the written signature block and the package path — at least one entry.',
      ],
      outputFormat: 'JSON with signedBy string, signedAt string, packagePath string, scopeHash string, controlSummaryHash string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['signedBy', 'signedAt', 'packagePath', 'evidence'],
      properties: {
        signedBy: { type: 'string' },
        signedAt: { type: 'string' },
        packagePath: { type: 'string' },
        scopeHash: { type: 'string' },
        controlSummaryHash: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'signoff', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P9 — external evidence release manifest + post-approval issuance
// ---------------------------------------------------------------------------

export const evidenceReleaseManifestTask = defineTask('sa.evidence-release-manifest', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build external evidence release manifest for ${args.attestationId}`,
  agent: {
    name: 'evidence-release-curator',
    prompt: {
      role: 'Evidence release curator',
      task: `Build the release manifest for ${args.externalAuditor.firm} — a MANIFEST, not a release`,
      context: args,
      instructions: [
        'One row per artifact proposed for release: path, contentSummary, sensitivity (public|internal|confidential|restricted), and the redactions you applied.',
        'Redact before proposing: secrets, credentials, tokens, customer personal data, and raw production configuration that exceeds what the criterion requires. Report each redaction explicitly.',
        'An artifact you cannot safely redact is proposed with releasable:false and a reason — never released with a note asking the auditor to ignore part of it.',
        'You must NOT transmit anything: release happens only after the security-attestation.external-evidence-release gate approves this exact manifest.',
        `Write the manifest to ${args.manifestPath} and report that exact path back.`,
        'Evidence entries must cite the artifacts inspected and the redactions applied — at least one entry.',
      ],
      outputFormat: 'JSON with manifest array (minItems 1) of { path, contentSummary, sensitivity, redactions, releasable }, unreleasable array, manifestPath string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['manifest', 'unreleasable', 'manifestPath', 'evidence'],
      properties: {
        manifest: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['path', 'contentSummary', 'sensitivity', 'redactions', 'releasable'],
          },
        },
        unreleasable: { type: 'array' },
        manifestPath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'evidence-release', 'draft'],
}));

export const externalReportIssuanceTask = defineTask('sa.external-report-issuance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Issue approved attestation report to ${args.externalAuditor.firm}`,
  agent: {
    name: 'external-report-issuer',
    prompt: {
      role: 'External report issuer',
      task: 'Issue the gate-approved attestation package and evidence manifest to the named external auditor',
      context: args,
      instructions: [
        'This task only ever runs AFTER the security-attestation.external-evidence-release gate approved the exact manifest in context — issue exactly those items, VERBATIM, and nothing else.',
        'Do not add artifacts, do not substitute a newer version of a file, do not include anything marked releasable:false.',
        'Use a secure transmission channel and report the concrete transmissionRef (transfer id, secure-link id, or delivery receipt) and issuedAt.',
        'A transmission failure is reported with issued:false and the error — never retried silently, never papered over.',
        'Evidence entries must be the raw transmission confirmation — at least one entry.',
      ],
      outputFormat: 'JSON with issued boolean, recipient string, itemsIssued number, transmissionRef string, issuedAt string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['issued', 'recipient', 'itemsIssued', 'transmissionRef', 'issuedAt', 'evidence'],
      properties: {
        issued: { type: 'boolean' },
        recipient: { type: 'string' },
        itemsIssued: { type: 'number' },
        transmissionRef: { type: 'string' },
        issuedAt: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'report-issuance', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P10 — continuous-monitoring handoff
// ---------------------------------------------------------------------------

export const continuousMonitoringHandoffTask = defineTask('sa.continuous-monitoring-handoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan continuous monitoring handoff for ${args.attestationId}`,
  agent: {
    name: 'continuous-monitoring-planner',
    prompt: {
      role: 'Continuous monitoring planner',
      task: `Write the continuous-control-monitoring plan at ${args.planPath}`,
      context: args,
      instructions: [
        `Write the plan to ${args.planPath} and report that exact path back.`,
        'For each control family, name the recurring engine BY NAME from the composition table in context (security-logging-monitoring, vulnerability-management, sast-pipeline, dast-process, sca-dependency-management, container-security, iac-security-review, third-party-risk, disaster-recovery-testing, security-training, incident-response) and the test cadence (continuous | daily | weekly | monthly | quarterly | annual).',
        'Every approved exception\'s expiresAt becomes a scheduled re-test entry — an exception with no scheduled re-test is how a time-box becomes permanent.',
        'Every accepted residual risk gets a review date entry. An accepted risk that is never revisited is next period\'s finding.',
        'State nextCycleStartsAt for the next attestation period and what carries forward (open gaps, prior findings).',
        'Evidence entries must cite the control and exception registers the schedule was derived from — at least one entry.',
      ],
      outputFormat: 'JSON with planPath string, monitoredControls array (minItems 1) of { controlId, family, engineProcess, cadence }, exceptionRetests array, residualRiskReviews array, cadenceSummary object, nextCycleStartsAt string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'monitoredControls', 'exceptionRetests', 'residualRiskReviews', 'nextCycleStartsAt', 'evidence'],
      properties: {
        planPath: { type: 'string' },
        monitoredControls: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['controlId', 'family', 'engineProcess', 'cadence'],
          },
        },
        exceptionRetests: { type: 'array' },
        residualRiskReviews: { type: 'array' },
        cadenceSummary: { type: 'object' },
        nextCycleStartsAt: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'security', 'attestation', 'continuous-monitoring'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    organization,
    framework,
    auditPeriod,
    scopeProposal,
    controlFamilies = null,
    scanFamilies = null,
    externalAuditor = null,
    issueExternalReport = false,
    maxFixAttempts = 2,
    maxRemediationRounds = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  // -------------------------------------------------------------------------
  // Input validation — every failure throws; there is no fallback anywhere
  // -------------------------------------------------------------------------
  if (!organization) {
    throw new Error(
      'security-attestation-workflow requires organization — refusing to attest an unnamed entity. No fallback organization exists.'
    );
  }
  assertFramework(framework, 'inputs.framework');

  if (!auditPeriod || !auditPeriod.start || !auditPeriod.end) {
    throw new Error(
      'security-attestation-workflow requires auditPeriod { start, end } ISO dates — a period-bound attestation cannot start from a guess.'
    );
  }
  const periodStartMs = Date.parse(auditPeriod.start);
  const periodEndMs = Date.parse(auditPeriod.end);
  if (!Number.isFinite(periodStartMs) || !Number.isFinite(periodEndMs)) {
    throw new Error(
      `security-attestation-workflow: auditPeriod start '${auditPeriod.start}' / end '${auditPeriod.end}' ` +
      'must be parseable ISO dates — a period-bound attestation cannot start from a guess.'
    );
  }
  if (periodEndMs <= periodStartMs) {
    throw new Error(
      `security-attestation-workflow: auditPeriod.end (${auditPeriod.end}) must be after auditPeriod.start ` +
      `(${auditPeriod.start}) — a period-bound attestation cannot start from a guess.`
    );
  }

  if (!scopeProposal || !Array.isArray(scopeProposal.systems) || scopeProposal.systems.length === 0) {
    throw new Error(
      'security-attestation-workflow requires scopeProposal.systems with at least one system — refusing to attest an empty boundary; no fallback scope exists.'
    );
  }

  // Omitted controlFamilies means ALL families — documented as 'all', never a silently
  // narrowed default. A supplied subset runs through assertControlFamily.
  const selectedFamilies = controlFamilies === null
    ? CONTROL_FAMILIES.slice()
    : controlFamilies.map((family) => assertControlFamily(family, 'inputs.controlFamilies'));
  if (selectedFamilies.length === 0) {
    throw new Error(
      'security-attestation-workflow: inputs.controlFamilies was supplied but empty — omit it to attest all families; an empty family set is not a scope.'
    );
  }

  const selectedScanFamilies = scanFamilies === null
    ? Object.keys(SCAN_FAMILIES)
    : scanFamilies.map((scanFamily) => assertScanFamily(scanFamily, 'inputs.scanFamilies'));
  if (selectedScanFamilies.length === 0) {
    throw new Error(
      'security-attestation-workflow: inputs.scanFamilies was supplied but empty — omit it to run all five scan families.'
    );
  }

  if (issueExternalReport === true && (!externalAuditor || !externalAuditor.firm || !externalAuditor.contact)) {
    throw new Error(
      'security-attestation-workflow: issueExternalReport is true but externalAuditor { firm, contact } is missing — refusing to arm an external release with no named recipient.'
    );
  }

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const nowIso = () => new Date().toISOString();
  const frameworkSpec = FRAMEWORKS[framework];
  const attestationId = mintAttestationId(organization, framework, auditPeriod.end);

  // The run ledger is accumulated HERE, in the orchestrator — agents never write it. Both
  // gates receive it as ground truth the agents cannot rewrite.
  const ledger = [];
  const recordEvent = (stream, event, detail) => {
    ledger.push({ at: nowIso(), stream, event, detail });
  };
  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): fail-closed provenance for any harness-level
  // auto-approval of a policy gate.
  const autoApprovals = [];
  const recordGate = (breakpointId, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto =
      result && (result.autoApproved === true || (result.metadata && result.metadata.autoApproved === true));
    if (auto) {
      autoApprovals.push({ breakpointId, phase, at: nowIso() });
    }
    return result;
  };

  const composedProcesses = [];
  for (const family of selectedFamilies) {
    for (const processPath of FAMILY_COMPOSITION[family]) {
      if (!composedProcesses.includes(processPath)) {
        composedProcesses.push(processPath);
      }
    }
  }

  // Mutable run state referenced by buildResult — terminal returns carry full state.
  let scope = {
    systems: scopeProposal.systems,
    services: scopeProposal.services ?? [],
    locations: scopeProposal.locations ?? [],
    exclusions: [],
    scopeIntegrityPassed: false,
  };
  let controls = [];
  let controlSummary = { total: 0, satisfied: 0, partial: 0, failed: 0, notApplicable: 0 };
  let gaps = [];
  let scanEvidence = [];
  const gates = {
    scopeIntegrity: { passed: false, attempts: 0, escalated: false, issues: [] },
    evidenceSufficiency: { passed: false, attempts: 0, escalated: false, issues: [] },
  };
  const exceptions = [];
  const residualRisks = [];
  let attestation = null;
  let externalReport = null;
  let continuousMonitoring = null;
  let kipFactsAsserted = 0;
  const artifacts = [];

  const buildResult = (success, reason) => ({
    success,
    attestationId,
    framework,
    scope,
    controls,
    controlSummary,
    gaps,
    scanEvidence,
    gates,
    exceptions,
    residualRisks,
    attestation,
    externalReport,
    continuousMonitoring,
    autoApprovals,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'specializations/security-compliance/security-attestation-workflow',
      runId: ctx.runId,
      ledger,
      breakpointsHit,
      composedProcesses,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall (kind 'security-attestation')
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior-period findings and accepted risks');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      topic: `prior attestation findings, accepted residual risks and exceptions for ${organization} [${framework}]`,
      kipModel,
      kind: 'security-attestation',
    });
    recordEvent('attestation', 'kip-recall', `factCount=${priorKnowledge.factCount} storeInitialized=${priorKnowledge.storeInitialized}`);
  }

  // -------------------------------------------------------------------------
  // P1 — scope + system-boundary definition (policy-gated scope reduction)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: scope + system-boundary definition');
  const scopeResult = await ctx.task(scopeDefinitionTask, {
    attestationId,
    organization,
    framework,
    frameworkSpec,
    auditPeriod,
    scopeProposal,
    priorKnowledge,
  });
  if (!Array.isArray(scopeResult.inScopeSystems) || scopeResult.inScopeSystems.length === 0) {
    throw new Error(
      'sa.scope-definition returned zero in-scope systems — refusing to attest an empty boundary; no fallback scope exists.'
    );
  }

  let inScopeSystems = scopeResult.inScopeSystems.slice();
  const recordedExclusions = [];
  let anyExclusionApproved = false;
  for (const proposed of scopeResult.proposedExclusions) {
    const reductionGate = await routedBreakpoint(ctx, {
      question: `Approve removing ${proposed.ref} from the ${frameworkSpec.label} attestation scope for ${organization}? Materiality: ${proposed.materiality}. Auditor impact: ${proposed.auditorImpact}. Rationale: ${proposed.rationale}. ${inScopeSystems.length} systems remain in scope if approved.`,
      systemRef: proposed.ref,
      materiality: proposed.materiality,
      auditorImpact: proposed.auditorImpact,
      rationale: proposed.rationale,
      remainingInScopeSystems: inScopeSystems.length,
      attestationId,
    }, {
      breakpointId: 'security-attestation.scope-reduction',
      expert: policyExpert('security-attestation.scope-reduction'),
      tags: ['policy-gated', 'security', 'attestation', 'scope-reduction'],
      strategy: 'single',
      // Deliberately NO autoApproveAfterN and NO presentAlwaysApprove — silently narrowing
      // what the attestation covers is the highest-leverage way to fake a clean attestation.
    });
    recordGate('security-attestation.scope-reduction', 'P1', reductionGate);

    if (reductionGate.approved === true) {
      recordedExclusions.push({ ref: proposed.ref, rationale: proposed.rationale, approved: true });
      inScopeSystems = inScopeSystems.filter((system) => system.systemId !== proposed.ref);
      anyExclusionApproved = true;
      recordEvent('scope', 'exclusion-approved', `${proposed.ref} (materiality ${proposed.materiality}) removed from scope`);
    } else {
      // Fail closed: a rejected reduction never silently narrows coverage — the system
      // stays in scope, and is added back if the definition task had already dropped it.
      recordedExclusions.push({ ref: proposed.ref, rationale: proposed.rationale, approved: false });
      if (!inScopeSystems.some((system) => system.systemId === proposed.ref)) {
        inScopeSystems.push({
          systemId: proposed.ref,
          description: proposed.auditorImpact,
          dataCategories: [],
          owner: null,
          inScopeReason: 'scope-reduction gate rejected — system kept in scope',
          reinstated: true,
        });
      }
      recordEvent('scope', 'exclusion-rejected', `${proposed.ref} stays IN SCOPE (rejected reduction)`);
    }
  }

  scope = {
    systems: inScopeSystems,
    services: scopeProposal.services ?? [],
    locations: scopeProposal.locations ?? [],
    exclusions: recordedExclusions,
    scopeIntegrityPassed: false,
  };
  recordEvent('scope', 'boundary-defined', `systems=${inScopeSystems.length} exclusionsApproved=${recordedExclusions.filter((e) => e.approved === true).length} exclusionsRejected=${recordedExclusions.filter((e) => e.approved !== true).length}`);

  // -------------------------------------------------------------------------
  // P2 — framework control mapping + parallel per-family gap assessment
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: framework control mapping + gap assessment');
  const mapping = await ctx.task(frameworkMappingTask, {
    attestationId,
    organization,
    framework,
    frameworkSpec,
    auditPeriod,
    scope,
    selectedFamilies,
    familyComposition: FAMILY_COMPOSITION,
    priorKnowledge,
  });
  if (!Array.isArray(mapping.controls) || mapping.controls.length === 0) {
    throw new Error(
      'sa.framework-control-mapping returned zero controls — an attestation with no mapped controls is not an attestation. No fallback control catalog exists.'
    );
  }
  for (const control of mapping.controls) {
    assertControlFamily(control.family, `sa.framework-control-mapping(${control.controlId})`);
    if (!selectedFamilies.includes(control.family)) {
      throw new Error(
        `sa.framework-control-mapping returned control '${control.controlId}' in family '${control.family}', ` +
        `which is not in the selected family set (${selectedFamilies.join('|')}). No fallback family assignment is applied.`
      );
    }
  }

  const controlsByFamily = {};
  for (const family of selectedFamilies) {
    controlsByFamily[family] = mapping.controls.filter((control) => control.family === family);
  }

  const gapResults = await ctx.parallel.map(selectedFamilies, async (family) =>
    ctx.task(gapAssessmentTask, {
      attestationId,
      family,
      framework,
      controls: controlsByFamily[family],
      composedProcesses: FAMILY_COMPOSITION[family],
      priorKnowledge,
    })
  );
  gaps = [];
  for (const gapResult of gapResults) {
    for (const gap of gapResult.gaps) {
      gaps.push({
        gapId: gap.gapId,
        controlId: gap.controlId,
        severity: gap.severity,
        description: gap.description,
        suggestedRemediation: gap.suggestedRemediation,
        remediationRounds: 0,
        resolved: false,
      });
    }
    recordEvent('mapping', 'family-assessed', `${gapResult.family}: controls=${controlsByFamily[gapResult.family].length} gaps=${gapResult.gaps.length}`);
  }

  // -------------------------------------------------------------------------
  // P3 — scope-integrity adversarial gate (GATE 1, before any evidence work)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: scope-integrity adversarial gate');
  const scopeArtifact = await ctx.task(scopeArtifactTask, {
    attestationId,
    organization,
    framework,
    frameworkSpec,
    scope,
    exclusions: recordedExclusions,
    controls: mapping.controls,
    unmappedCriteria: mapping.unmappedCriteria,
    gaps,
    scopePath: `${artifactsRoot}/attestation-scope-${attestationId}.md`,
  });
  artifacts.push(scopeArtifact.scopePath);

  const scopeGateCritics = [
    {
      name: 'boundary-completeness-critic',
      role: 'Audit boundary auditor',
      focus: 'EXECUTE the boundary diff: enumerate the actual systems/services/repos/cloud accounts from the live inventory and diff them against inScopeSystems. Any production system handling in-scope data that is neither in scope nor an APPROVED exclusion is a FAIL. Cite the inventory command output and each systemId verdict.',
    },
    {
      name: 'exclusion-materiality-critic',
      role: 'Scope-reduction adversary',
      focus: 'For every exclusion (approved or rejected), OPEN the excluded system\'s configuration or data-flow definition and prove whether it actually touches in-scope data or criteria. An exclusion justified only by a written rationale, with no artifact inspected, is a FAIL. Cite file:line or command output per exclusion.',
    },
    {
      name: 'criteria-coverage-critic',
      role: 'Framework coverage auditor',
      focus: 'Diff the mapped criterionRefs against the framework\'s full criteria list. Any criterion with no mapped control and no documented naReason is a FAIL. Cite the criteria source and each unmapped ref.',
    },
  ];
  const scopeGateIronLaw = [
    'Executed evidence only: run the inventory query, open the config, diff the criteria list. A read-only skim of the artifact is not evidence.',
    'Scope narrowing is the failure mode this gate exists to catch: when in doubt about whether something belongs in scope, FAIL and say so.',
    'Cite file:line or executed-command output for every claim; passed:true with empty evidence is rejected by the combinator.',
    'PIN THE OUTPUT SHAPE AT THE END OF THE PROMPT: return exactly {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]} and nothing else.',
  ];

  // The gate is re-run once when a scope reduction was approved in P1, so the second run
  // sees the approved exclusions in context.
  const scopeGateRuns = anyExclusionApproved ? 2 : 1;
  let scopeGateResult = null;
  for (let run = 1; run <= scopeGateRuns; run++) {
    scopeGateResult = await adversarialGate(ctx, {
      gateId: 'sa.scope-integrity',
      artifact: { path: scopeArtifact.scopePath, description: 'Attestation scope, boundary and criteria-to-control mapping' },
      critics: scopeGateCritics,
      ironLaw: scopeGateIronLaw,
      maxFixAttempts,
      fixer: {},
      context: {
        run,
        attestationId,
        organization,
        framework,
        frameworkSpec,
        auditPeriod,
        scope,
        approvedExclusions: recordedExclusions.filter((exclusion) => exclusion.approved === true),
        rejectedExclusions: recordedExclusions.filter((exclusion) => exclusion.approved !== true),
        controls: mapping.controls,
        unmappedCriteria: mapping.unmappedCriteria,
        priorKnowledge,
        ledger,
      },
    });
    recordEvent('gate', 'scope-integrity', `run=${run} passed=${scopeGateResult.passed} attempts=${scopeGateResult.attempts} escalated=${scopeGateResult.escalated}`);
    if (scopeGateResult.escalated) {
      breakpointsHit.push('sa.scope-integrity.gate-escalation');
    }
  }
  gates.scopeIntegrity = {
    passed: scopeGateResult.passed,
    attempts: scopeGateResult.attempts,
    escalated: scopeGateResult.escalated,
    issues: scopeGateResult.issues,
  };
  scope = { ...scope, scopeIntegrityPassed: scopeGateResult.passed === true };

  if (scopeGateResult.passed !== true) {
    // Attesting a boundary nobody trusts is worse than not attesting: no evidence is
    // collected, no package is drafted, no sign-off gate is ever raised.
    recordEvent('gate', 'scope-integrity-blocked', 'no evidence collected, no attestation drafted');
    return buildResult(false, 'scope-integrity gate failed — no evidence collected, no attestation drafted');
  }

  // -------------------------------------------------------------------------
  // P4 — parallel control-evidence collection + parallel scan-family evidence
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P4: parallel evidence collection over ${mapping.controls.length} controls and ${selectedScanFamilies.length} scan families`);
  const priorFindings = mapping.controls
    .filter((control) => control.priorFinding === true)
    .map((control) => control.controlId);

  const collectEvidenceFor = async (control, recollection, round) =>
    ctx.task(controlEvidenceCollectionTask, {
      attestationId,
      control,
      framework,
      frameworkSpec,
      auditPeriod,
      composedProcess: control.composedProcess,
      priorFindings,
      artifactsRoot,
      recollection,
      round,
    });

  const [controlResults, scanResults] = await ctx.parallel.all([
    () => ctx.parallel.map(mapping.controls, async (control) => collectEvidenceFor(control, false, 0)),
    () => ctx.parallel.all(
      selectedScanFamilies.map((scanFamily) => () =>
        ctx.task(scanFamilyEvidenceTask, {
          attestationId,
          scanFamily,
          spec: SCAN_FAMILIES[scanFamily],
          scope,
          artifactsRoot,
          artifactPath: `${artifactsRoot}/scan-${scanFamily}-${attestationId}.json`,
        })
      )
    ),
  ]);

  scanEvidence = scanResults.map((scan) => ({
    scanFamily: assertScanFamily(scan.scanFamily, 'sa.scan-family-evidence'),
    tool: scan.tool,
    command: scan.command,
    findingCounts: scan.findingCounts,
    artifactPath: scan.artifactPath,
    ran: scan.ran === true,
  }));
  for (const scan of scanEvidence) {
    artifacts.push(scan.artifactPath);
    recordEvent('scan', 'scan-family-collected', `${scan.scanFamily}: ran=${scan.ran} command=${scan.command}`);
  }

  // Orchestrator normalization: the agent's claim is never ground truth. Every control's
  // status is re-resolved from its own evidence items, and every downgrade or
  // uncollectable-coercion is written to the ledger with its controlId.
  const controlState = new Map();
  const applyCollection = (control, result, round) => {
    const claimed = result.status;
    const resolved = resolveControlStatus(
      claimed,
      result.evidenceItems,
      `sa.control-evidence-collection(${control.controlId})`,
      result.naReason ?? null
    );
    if (resolved !== claimed) {
      recordEvent(
        'evidence',
        'status-resolved',
        `${control.controlId}: claimed=${claimed} resolved=${resolved} (round ${round}) — the agent's word never upgrades a control`
      );
    }
    if (Array.isArray(result.uncollectable) && result.uncollectable.length > 0) {
      recordEvent(
        'evidence',
        'uncollectable-items',
        `${control.controlId}: ${result.uncollectable.length} item(s) uncollectable -> control FAILED, never assumed satisfied`
      );
    }
    const strongest = EVIDENCE_STRENGTHS.find((strength) =>
      result.evidenceItems.some((item) => item.collected === true && item.strength === strength)
    );
    controlState.set(control.controlId, {
      controlId: control.controlId,
      family: control.family,
      framework,
      criterionRef: control.criterionRef,
      status: resolved,
      evidenceStrength: strongest ?? null,
      evidenceRefs: result.evidenceItems.map((item) => item.ref),
      evidenceItems: result.evidenceItems,
      naReason: result.naReason ?? null,
      control,
    });
  };

  for (let index = 0; index < mapping.controls.length; index++) {
    applyCollection(mapping.controls[index], controlResults[index], 0);
  }

  const summarize = () => {
    const rows = Array.from(controlState.values());
    return {
      total: rows.length,
      satisfied: rows.filter((row) => row.status === 'satisfied').length,
      partial: rows.filter((row) => row.status === 'partial').length,
      failed: rows.filter((row) => row.status === 'failed').length,
      notApplicable: rows.filter((row) => row.status === 'not-applicable').length,
    };
  };
  const publishControls = () => {
    controls = Array.from(controlState.values()).map((row) => ({
      controlId: row.controlId,
      family: row.family,
      framework: row.framework,
      criterionRef: row.criterionRef,
      status: row.status,
      evidenceStrength: row.evidenceStrength,
      evidenceRefs: row.evidenceRefs,
      ...(gaps.find((gap) => gap.controlId === row.controlId)
        ? { gapId: gaps.find((gap) => gap.controlId === row.controlId).gapId }
        : {}),
    }));
    controlSummary = summarize();
  };
  publishControls();
  recordEvent('evidence', 'initial-collection', `total=${controlSummary.total} satisfied=${controlSummary.satisfied} partial=${controlSummary.partial} failed=${controlSummary.failed} notApplicable=${controlSummary.notApplicable}`);

  // -------------------------------------------------------------------------
  // P5 — bounded gap-remediation loop (ALWAYS falls through to the P6 gate)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: bounded gap-remediation loop');
  const unresolvedControls = () =>
    Array.from(controlState.values()).filter((row) => row.status === 'failed' || row.status === 'partial');

  for (let round = 1; round <= maxRemediationRounds; round++) {
    const openRows = unresolvedControls();
    if (openRows.length === 0) {
      recordEvent('remediation', 'converged', `no failed/partial controls remain before round ${round}`);
      break;
    }
    const openControlIds = new Set(openRows.map((row) => row.controlId));
    const openGaps = gaps.filter((gap) => gap.resolved !== true && openControlIds.has(gap.controlId));
    if (openGaps.length === 0) {
      recordEvent('remediation', 'no-open-gaps', `round ${round}: ${openRows.length} control(s) unresolved with no open gap to remediate — carried to disposition`);
      break;
    }

    const remediations = await ctx.parallel.map(openGaps, async (gap) =>
      ctx.task(gapRemediationTask, {
        attestationId,
        gap,
        control: controlState.get(gap.controlId).control,
        round,
        priorAttempts: gap.remediationRounds,
      })
    );

    const remediatedControlIds = new Set();
    for (let index = 0; index < openGaps.length; index++) {
      const gap = openGaps[index];
      const remediation = remediations[index];
      gap.remediationRounds = round;
      gap.resolved = remediation.remediated === true;
      recordEvent('remediation', 'gap-remediated', `${gap.gapId} (${gap.controlId}) round=${round} remediated=${gap.resolved}`);
      if (remediation.remediated === true) {
        remediatedControlIds.add(gap.controlId);
      }
    }

    if (remediatedControlIds.size === 0) {
      recordEvent('remediation', 'round-blocked', `round ${round}: no gap was remediated — carrying unresolved controls to disposition`);
      continue;
    }

    const remediatedControls = Array.from(remediatedControlIds).map((controlId) => controlState.get(controlId).control);
    const recollected = await ctx.parallel.map(remediatedControls, async (control) =>
      collectEvidenceFor(control, true, round)
    );
    for (let index = 0; index < remediatedControls.length; index++) {
      applyCollection(remediatedControls[index], recollected[index], round);
    }
    publishControls();
    recordEvent('remediation', 'round-recollected', `round=${round} controls=${remediatedControls.length} satisfied=${controlSummary.satisfied} partial=${controlSummary.partial} failed=${controlSummary.failed}`);
  }
  publishControls();

  // -------------------------------------------------------------------------
  // P6 — evidence-sufficiency adversarial gate (GATE 2 — load-bearing).
  // Control flow always reaches here from P5: there is no bypass edge to P8.
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: evidence-sufficiency adversarial gate');
  const evidenceIndex = await ctx.task(evidenceIndexTask, {
    attestationId,
    framework,
    frameworkSpec,
    auditPeriod,
    resolvedControls: Array.from(controlState.values()).map((row) => ({
      controlId: row.controlId,
      family: row.family,
      criterionRef: row.criterionRef,
      status: row.status,
      evidenceStrength: row.evidenceStrength,
      evidenceItems: row.evidenceItems,
      testProcedure: row.control.testProcedure,
      composedProcess: row.control.composedProcess,
    })),
    scanEvidence,
    ledger,
    indexPath: `${artifactsRoot}/evidence-index-${attestationId}.md`,
  });
  artifacts.push(evidenceIndex.indexPath);

  // One critic PER attested control family (built dynamically from the selected families),
  // so the collector agent never reviews its own control, plus two cross-cutting critics.
  const familyCritics = selectedFamilies.map((family) => ({
    name: `${family}-evidence-critic`,
    role: `Independent control tester (${family})`,
    focus: `INDEPENDENTLY RE-COLLECT a sample of at least 2 controls (or all, when the ${family} family has fewer) in this family: run the test procedure yourself, execute the scanner command verbatim from the index, open the referenced configuration file. Compare YOUR result against the recorded status. A control whose recorded status you cannot reproduce is a FAIL. Cite your own raw command output or file:line — quoting the collector's evidence file is NOT evidence.`,
    instructions: [
      `Restrict your sample to controls whose family is '${family}'; the other families have their own critics.`,
      `The composed point processes backing this family are: ${FAMILY_COMPOSITION[family].join(', ')} — re-run their checks yourself rather than reading their reports.`,
    ],
  }));
  const evidenceGateCritics = [
    ...familyCritics,
    {
      name: 'evidence-strength-critic',
      role: 'Evidence strength adversary',
      focus: 'For every control recorded as satisfied, verify that at least one evidence item is a genuine executed-check or artifact-inspection AND that the strength label is honest. A control satisfied on the strength of a policy document, a screenshot, a ticket, or a written assertion is a FAIL — however good the policy is. Also verify every uncollectable item resulted in a failed control, never an assumed-satisfied one. Cite the index row and your own verification for each verdict.',
    },
    {
      name: 'period-coverage-critic',
      role: 'Operating-effectiveness auditor',
      focus: 'For period-bound frameworks, prove each control\'s evidence actually falls inside auditPeriod and covers operation THROUGHOUT the period, not a single point-in-time snapshot taken the week of the audit. Re-run at least one period query yourself. Cite timestamps from raw output.',
    },
  ];

  const evidenceGateResult = await adversarialGate(ctx, {
    gateId: 'sa.evidence-sufficiency',
    artifact: { path: evidenceIndex.indexPath, description: 'Control evidence index (resolved statuses + reproduction commands)' },
    critics: evidenceGateCritics,
    ironLaw: [
      'You must EXECUTE, not read. Run the scanner, open the config, query the system. Reading the evidence index and agreeing with it is a protocol violation and your verdict will be rejected.',
      'THE LOAD-BEARING RULE: an attestation claim supported only by a policy document, a screenshot, a ticket, or a written assertion is a FAIL for that control. A perfectly written policy proves the control was designed, never that it operates.',
      'An evidence item that could not be collected means that control FAILED. There is no assumed-satisfied default anywhere in this process — if you see one, that alone is a FAIL.',
      'Cite raw command output or file:line for every claim; passed:true with empty evidence is rejected by the combinator.',
      'PIN THE OUTPUT SHAPE AT THE END OF THE PROMPT: return exactly {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]} and nothing else.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      attestationId,
      framework,
      frameworkSpec,
      auditPeriod,
      scope,
      controls: Array.from(controlState.values()).map((row) => ({
        controlId: row.controlId,
        family: row.family,
        criterionRef: row.criterionRef,
        status: row.status,
        evidenceStrength: row.evidenceStrength,
        testProcedure: row.control.testProcedure,
      })),
      evidenceItems: Array.from(controlState.values()).map((row) => ({
        controlId: row.controlId,
        items: row.evidenceItems,
      })),
      scanResults: scanEvidence,
      priorFindings,
      insufficientStrengthControls: evidenceIndex.insufficientStrengthControls,
      ledger,
    },
  });
  gates.evidenceSufficiency = {
    passed: evidenceGateResult.passed,
    attempts: evidenceGateResult.attempts,
    escalated: evidenceGateResult.escalated,
    issues: evidenceGateResult.issues,
  };
  if (evidenceGateResult.escalated) {
    breakpointsHit.push('sa.evidence-sufficiency.gate-escalation');
  }
  recordEvent('gate', 'evidence-sufficiency', `passed=${evidenceGateResult.passed} attempts=${evidenceGateResult.attempts} escalated=${evidenceGateResult.escalated}`);

  if (evidenceGateResult.passed !== true) {
    // No sign-off gate is ever raised on evidence the critics could not reproduce.
    recordEvent('gate', 'evidence-sufficiency-blocked', 'management sign-off gate never raised, package not drafted for signature');
    return buildResult(false, 'evidence-sufficiency gate failed — attestation not drafted for signature');
  }

  // -------------------------------------------------------------------------
  // P7 — policy-gated disposition of unresolved controls
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P7: policy-gated disposition of unresolved controls');
  for (const row of unresolvedControls()) {
    const assessment = await ctx.task(residualRiskAssessmentTask, {
      attestationId,
      control: row.control,
      status: row.status,
      evidenceItems: row.evidenceItems,
      gaps: gaps.filter((gap) => gap.controlId === row.controlId),
      resolvedControls: Array.from(controlState.values()).map((other) => ({
        controlId: other.controlId,
        family: other.family,
        status: other.status,
        evidenceStrength: other.evidenceStrength,
      })),
      priorKnowledge,
    });

    if (assessment.recommendedDisposition === 'exception') {
      const exceptionGate = await routedBreakpoint(ctx, {
        question: `Grant a time-boxed exception to control ${row.controlId} (${row.control.criterionRef})? Severity: ${assessment.severity}. Proposed expiry: ${assessment.proposedExpiresAt}. Impact: ${assessment.impact}.`,
        controlId: row.controlId,
        criterionRef: row.control.criterionRef,
        severity: assessment.severity,
        proposedExpiresAt: assessment.proposedExpiresAt,
        compensatingControls: assessment.compensatingControls,
        failedEvidenceItems: row.evidenceItems.filter((item) => item.collected !== true),
        attestationId,
      }, {
        breakpointId: 'security-attestation.control-exception',
        expert: policyExpert('security-attestation.control-exception'),
        tags: ['policy-gated', 'security', 'attestation', 'control-exception', assessment.severity],
        strategy: 'single',
        // Low-severity control exceptions are the ONLY auto-approvable policy gate in this
        // process; medium/high/critical omit the field entirely.
        ...(assessment.severity === 'low' && { autoApproveAfterN: EXCEPTION_AUTO_APPROVE_AFTER_N }),
      });
      recordGate('security-attestation.control-exception', 'P7', exceptionGate);

      if (exceptionGate.approved === true) {
        // The time-box on the exception register is the APPROVER's number, never the agent's
        // proposal: the gate response must carry it back explicitly.
        if (!exceptionGate.expiresAt) {
          throw new Error(
            `security-attestation.control-exception approved for '${row.controlId}' with no expiresAt — ` +
            'an open-ended exception is not an exception. No fallback expiry is applied ' +
            "(the agent's proposedExpiresAt is NOT substituted for the approver's)."
          );
        }
        const expiresAt = exceptionGate.expiresAt;
        exceptions.push({
          controlId: row.controlId,
          severity: assessment.severity,
          expiresAt,
          approved: true,
          autoApproved: exceptionGate.autoApproved === true,
        });
        recordEvent('disposition', 'exception-granted', `${row.controlId} expires ${expiresAt} (severity ${assessment.severity})`);
      } else {
        recordEvent('disposition', 'exception-rejected', `${row.controlId} stays unresolved — open qualification, success cannot be true`);
      }
    } else if (assessment.recommendedDisposition === 'accept-residual-risk') {
      const acceptanceGate = await routedBreakpoint(ctx, {
        question: `Formally accept the residual risk on control ${row.controlId} (${row.control.criterionRef}) rather than remediate it? Severity: ${assessment.severity}. Impact: ${assessment.impact}. Proposed review date: ${assessment.proposedReviewDate}.`,
        riskId: assessment.riskId,
        controlId: row.controlId,
        severity: assessment.severity,
        description: assessment.description,
        impact: assessment.impact,
        compensatingControls: assessment.compensatingControls,
        proposedReviewDate: assessment.proposedReviewDate,
        failedEvidenceItems: row.evidenceItems.filter((item) => item.collected !== true),
        attestationId,
      }, {
        breakpointId: 'security-attestation.residual-risk-acceptance',
        expert: policyExpert('security-attestation.residual-risk-acceptance'),
        tags: ['policy-gated', 'security', 'attestation', 'residual-risk', assessment.severity],
        strategy: 'single',
        // Deliberately NO auto-approve — accepting risk on the organization's behalf is a
        // named-officer act, not a timeout.
      });
      recordGate('security-attestation.residual-risk-acceptance', 'P7', acceptanceGate);

      if (acceptanceGate.approved === true) {
        if (!acceptanceGate.approvedBy) {
          throw new Error(
            `security-attestation.residual-risk-acceptance approved for '${row.controlId}' with no approvedBy — ` +
            'accepting risk on the organization\'s behalf requires a named accountable officer. ' +
            'No fallback acceptor is applied.'
          );
        }
        residualRisks.push({
          riskId: assessment.riskId,
          controlId: row.controlId,
          description: assessment.description,
          accepted: true,
          acceptedBy: acceptanceGate.approvedBy,
          reviewDate: assessment.proposedReviewDate,
        });
        recordEvent('disposition', 'residual-risk-accepted', `${assessment.riskId} on ${row.controlId} (review ${assessment.proposedReviewDate})`);
      } else {
        recordEvent('disposition', 'residual-risk-rejected', `${row.controlId} stays unresolved — open qualification, success cannot be true`);
      }
    } else {
      // 'block' — no gate is raised; the control rides into the package as an open
      // qualification and success can never be true.
      recordEvent('disposition', 'blocked', `${row.controlId}: assessor recommended block — carried as an open qualification`);
    }
  }

  // -------------------------------------------------------------------------
  // P8 — attestation package draft + policy-gated management sign-off
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: attestation package draft + management sign-off gate');
  const unresolvedAtSignoff = unresolvedControls().map((row) => ({
    controlId: row.controlId,
    family: row.family,
    criterionRef: row.criterionRef,
    status: row.status,
  }));

  const packageDraft = await ctx.task(attestationPackageTask, {
    attestationId,
    organization,
    framework,
    frameworkSpec,
    auditPeriod,
    scope,
    controls,
    controlSummary,
    unresolvedControls: unresolvedAtSignoff,
    exceptions,
    residualRisks,
    gates,
    evidenceIndexPath: evidenceIndex.indexPath,
    packagePath: `${artifactsRoot}/attestation-package-${attestationId}.md`,
  });
  artifacts.push(packageDraft.packagePath);
  recordEvent('package', 'drafted', `${packageDraft.packagePath} qualifications=${packageDraft.qualificationsCount}`);

  const signoffGate = await routedBreakpoint(ctx, {
    question: `Sign the ${frameworkSpec.label} management representation for ${organization} (period ${auditPeriod.start} to ${auditPeriod.end})? ${controlSummary.satisfied}/${controlSummary.total} controls satisfied, ${unresolvedAtSignoff.length} open qualification(s), ${exceptions.length} exception(s), ${residualRisks.length} accepted residual risk(s). This is a representation to a third party.`,
    packagePath: packageDraft.packagePath,
    controlSummary,
    unresolvedControls: unresolvedAtSignoff,
    exceptions,
    residualRisks,
    gates,
    gateEvidence: {
      scopeIntegrity: scopeGateResult.evidence,
      evidenceSufficiency: evidenceGateResult.evidence,
    },
    attestationId,
  }, {
    breakpointId: 'security-attestation.management-signoff',
    expert: policyExpert('security-attestation.management-signoff'),
    tags: ['policy-gated', 'security', 'attestation', 'management-signoff'],
    strategy: 'single',
    // Deliberately NO autoApproveAfterN and NO presentAlwaysApprove: an attestation is a
    // representation to a third party. recordGate surfaces any harness override.
  });
  recordGate('security-attestation.management-signoff', 'P8', signoffGate);

  if (signoffGate.approved !== true) {
    // Fail closed: the sign-off recorder is NEVER invoked on an unapproved package, and P9
    // is never entered — nothing is signed, nothing is released.
    attestation = { packagePath: packageDraft.packagePath, signedOff: false, signedBy: null, signedAt: null };
    recordEvent('signoff', 'refused', 'management sign-off refused — nothing signed, nothing released');
    return buildResult(false, 'management sign-off refused — nothing signed, nothing released');
  }

  // Post-approval ONLY: guarded by a strict approved === true check with no alternate site.
  if (!signoffGate.approvedBy) {
    throw new Error(
      'security-attestation.management-signoff approved with no approvedBy — ' +
      'an attestation signature is a representation to a third party and requires a named ' +
      'accountable officer. No fallback signer is applied.'
    );
  }
  const signoffRecord = await ctx.task(attestationSignoffRecordTask, {
    attestationId,
    organization,
    framework,
    packagePath: packageDraft.packagePath,
    approvedBy: signoffGate.approvedBy,
    scopeSummary: { systems: scope.systems.length, exclusions: scope.exclusions.length },
    controlSummary,
  });
  attestation = {
    packagePath: signoffRecord.packagePath,
    signedOff: true,
    signedBy: signoffRecord.signedBy,
    signedAt: signoffRecord.signedAt,
  };
  recordEvent('signoff', 'recorded', `${attestation.signedBy} at ${attestation.signedAt} on ${attestation.packagePath}`);

  // -------------------------------------------------------------------------
  // P9 — policy-gated external evidence release + report issuance (conditional)
  // -------------------------------------------------------------------------
  if (issueExternalReport === true) {
    ctx.log?.('info', 'P9: external evidence release gate + report issuance');
    const releaseManifest = await ctx.task(evidenceReleaseManifestTask, {
      attestationId,
      organization,
      framework,
      externalAuditor,
      packagePath: attestation.packagePath,
      evidenceIndexPath: evidenceIndex.indexPath,
      scanEvidence,
      artifacts,
      manifestPath: `${artifactsRoot}/evidence-release-manifest-${attestationId}.json`,
    });
    artifacts.push(releaseManifest.manifestPath);
    recordEvent('release', 'manifest-built', `${releaseManifest.manifestPath} items=${releaseManifest.manifest.length} unreleasable=${releaseManifest.unreleasable.length}`);

    const releaseGate = await routedBreakpoint(ctx, {
      question: `Release ${releaseManifest.manifest.length} evidence artifact(s) for ${organization} to ${externalAuditor.firm} (${externalAuditor.contact})? System and configuration detail leaving the organization is irreversible.`,
      recipient: externalAuditor,
      manifest: releaseManifest.manifest,
      unreleasable: releaseManifest.unreleasable,
      manifestPath: releaseManifest.manifestPath,
      packagePath: attestation.packagePath,
      attestationId,
    }, {
      breakpointId: 'security-attestation.external-evidence-release',
      expert: policyExpert('security-attestation.external-evidence-release'),
      tags: ['policy-gated', 'security', 'attestation', 'evidence-release'],
      strategy: 'single',
      // Deliberately NO auto-approve — system and configuration detail leaving the
      // organization is irreversible.
    });
    recordGate('security-attestation.external-evidence-release', 'P9', releaseGate);

    if (releaseGate.approved === true) {
      // Post-approval ONLY: guarded by a strict approved === true check with no alternate site.
      const issuance = await ctx.task(externalReportIssuanceTask, {
        attestationId,
        organization,
        framework,
        externalAuditor,
        packagePath: attestation.packagePath,
        manifest: releaseManifest.manifest.filter((item) => item.releasable === true),
        manifestPath: releaseManifest.manifestPath,
      });
      externalReport = {
        issued: issuance.issued === true,
        recipient: issuance.recipient,
        packagePath: attestation.packagePath,
        issuedAt: issuance.issuedAt,
        releaseManifest: releaseManifest.manifest,
      };
      recordEvent('release', 'issued', `issued=${externalReport.issued} recipient=${externalReport.recipient} ref=${issuance.transmissionRef}`);
    } else {
      // A refused release is not a failed attestation, but success reflects it.
      externalReport = {
        issued: false,
        recipient: externalAuditor.firm,
        packagePath: attestation.packagePath,
        issuedAt: null,
        releaseManifest: releaseManifest.manifest,
      };
      recordEvent('release', 'refused', 'external-evidence-release gate rejected — nothing transmitted');
    }
  }

  // -------------------------------------------------------------------------
  // P10 — continuous-monitoring handoff
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P10: continuous-monitoring handoff');
  const monitoringPlan = await ctx.task(continuousMonitoringHandoffTask, {
    attestationId,
    organization,
    framework,
    auditPeriod,
    controls,
    familyComposition: FAMILY_COMPOSITION,
    scanFamilies: SCAN_FAMILIES,
    exceptions,
    residualRisks,
    gaps: gaps.filter((gap) => gap.resolved !== true),
    planPath: `${artifactsRoot}/continuous-monitoring-plan-${attestationId}.md`,
  });
  artifacts.push(monitoringPlan.planPath);
  continuousMonitoring = {
    planPath: monitoringPlan.planPath,
    controlsUnderContinuousTest: monitoringPlan.monitoredControls.length,
    cadence: monitoringPlan.cadenceSummary,
    nextCycleStartsAt: monitoringPlan.nextCycleStartsAt,
  };
  recordEvent('monitoring', 'handoff-planned', `${monitoringPlan.planPath} controls=${continuousMonitoring.controlsUnderContinuousTest} nextCycle=${continuousMonitoring.nextCycleStartsAt}`);

  // -------------------------------------------------------------------------
  // P11 — kip assert + closure
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P11: kip assert + closure');

  // An UNRESOLVED control (status 'failed' OR 'partial' — exactly what unresolvedControls()
  // considers open everywhere else in this process) is only dispositioned when it carries an
  // APPROVED exception or an ACCEPTED residual risk. Nothing else clears it: a rejected
  // exception gate, a rejected residual-risk gate and a 'block' disposition all leave the
  // control open, and success can never be true while one is open.
  const dispositionedControlIds = new Set([
    ...exceptions.filter((exception) => exception.approved === true).map((exception) => exception.controlId),
    ...residualRisks.filter((risk) => risk.accepted === true).map((risk) => risk.controlId),
  ]);
  const undispositionedControls = unresolvedControls()
    .filter((row) => !dispositionedControlIds.has(row.controlId))
    .map((row) => row.controlId);
  const undispositionedFailures = unresolvedControls()
    .filter((row) => row.status === 'failed' && !dispositionedControlIds.has(row.controlId))
    .map((row) => row.controlId);

  if (kipEnabled) {
    // facts is non-empty by construction on every path reaching P11: controls carries
    // minItems 1 from the P2 mapping validation.
    const facts = [];
    for (const control of controls) {
      facts.push({
        subject: `control:${control.controlId}`,
        predicate: 'attested-status',
        object: control.status,
        props: {
          family: control.family,
          criterionRef: control.criterionRef,
          evidenceStrength: control.evidenceStrength,
          periodEnd: auditPeriod.end,
        },
      });
    }
    for (const gap of gaps.filter((entry) => entry.resolved !== true)) {
      facts.push({
        subject: `control:${gap.controlId}`,
        predicate: 'gap-carried-forward',
        object: gap.description,
        props: { severity: gap.severity, rounds: gap.remediationRounds },
      });
    }
    for (const exception of exceptions.filter((entry) => entry.approved === true)) {
      facts.push({
        subject: `control:${exception.controlId}`,
        predicate: 'exception-granted',
        object: exception.expiresAt,
        props: { severity: exception.severity, autoApproved: exception.autoApproved === true },
      });
    }
    for (const risk of residualRisks.filter((entry) => entry.accepted === true)) {
      facts.push({
        subject: `risk:${risk.riskId}`,
        predicate: 'residual-risk-accepted',
        object: risk.description,
        props: { controlId: risk.controlId, acceptedBy: risk.acceptedBy, reviewDate: risk.reviewDate },
      });
    }
    facts.push({
      subject: `attestation:${attestationId}`,
      predicate: 'outcome',
      object: attestation.signedOff === true ? 'signed' : 'unsigned',
      props: {
        framework,
        periodEnd: auditPeriod.end,
        controlsFailed: controlSummary.failed,
        externalReportIssued: externalReport !== null && externalReport.issued === true,
      },
    });
    const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'security-attestation', facts });
    kipFactsAsserted = asserted.asserted;
    recordEvent('attestation', 'kip-assert', `${kipFactsAsserted} facts`);
  }

  const success =
    gates.scopeIntegrity.passed === true &&
    gates.evidenceSufficiency.passed === true &&
    attestation.signedOff === true &&
    undispositionedControls.length === 0 &&
    (issueExternalReport === true ? externalReport !== null && externalReport.issued === true : true);

  recordEvent('attestation', 'closed', `success=${success} undispositionedControls=${undispositionedControls.length} (failed=${undispositionedFailures.length})`);

  return success
    ? buildResult(true)
    : buildResult(
        false,
        `attestation closed with qualifications: undispositioned unresolved controls = ${undispositionedControls.length > 0 ? undispositionedControls.join(', ') : 'none'}` +
        ` (of which failed = ${undispositionedFailures.length > 0 ? undispositionedFailures.join(', ') : 'none'});` +
        ` externalReportIssued = ${externalReport !== null && externalReport.issued === true}`
      );
}
