/**
 * @process methodologies/production-contract
 * @description Production Contract - declare the ONE user-visible assertion a run must move, prove it with an executed verification path, and back-fill the @productionContract tag into the target process header. Operationalizes the convention documented in ./README.md.
 * @inputs { changeDescription: string, targetProcessPath?: string, productionContract?: string, verificationCommand?: string, kipDir?: string, kipModel?: string }
 * @outputs { success: boolean, contract: object, diagnostic: object, verificationPath: object, verificationRun: object, annotation: object, policyGatedActions: array, qualityGate: object, knowledge: object }
 * @agent general-purpose
 * @productionContract A reviewer who has never read the source can name the single user-visible assertion this run had to move, and can re-run the cited verification command to see that it moved.
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:qa-testing-automation]
 *   skillAreas: [skill-area:e2e-testing, skill-area:acceptance-testing]
 *   workflows: [workflow:feature-development]
 *   topics: [topic:test-driven-development]
 *   roles: [role:qa-engineer, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { routedBreakpoint, adversarialGate, kipRecall, kipAssert } from '../../specializations/common-utilities/routed-gate-combinators.js';

/**
 * Production Contract Process
 *
 * The methodology this file operationalizes is documented in ./README.md. It
 * was extracted from a real incident: three successive fixes each passed every
 * test gate and never moved the user-visible symptom, because each scoped test
 * asserted on a server-action return value, a mock's state, or an API success
 * count instead of rendered state.
 *
 * The discipline, in order:
 *
 * 1. Draft the contract - ONE sentence, user-visible, verifiable from outside
 *    the codebase (README rules 1-3).
 * 2. Diagnostic first - what does the production/real data actually say?
 *    (the adjacent methodology at
 *    ../../specializations/qa-testing-automation/diagnostic-first-phase.js).
 * 3. Design the verification path - seed steps, exact command, expected
 *    observation, and whether an outsider could reproduce it.
 * 4. Contract acceptance ceremony - the one policy-gated action in this file.
 * 5. Execute the verification and capture the RAW output verbatim.
 * 6. Adversarial verification gate - a green suite is not evidence.
 * 7. Annotate the target process header with the @productionContract tag.
 *    SKIPPED, explicitly and visibly, when no targetProcessPath is supplied.
 * 8. Report and persist the durable facts.
 *
 * No fallbacks anywhere: a missing targetProcessPath is reported as skipped
 * rather than guessed at, a verification path that cannot be reproduced by an
 * outsider is reported as such rather than downgraded to "run the test suite",
 * and contractHolds is never derived from an exit code alone.
 */

/**
 * Policy-gated production-contract ceremonies. Exactly one: accepting the
 * contract binds the run - after this point every later phase is judged
 * against that sentence, so it is the last moment the terms can change.
 *
 * @type {Array<{actionId: string, expert: string, description: string}>}
 */
export const policyGatedActions = [
  {
    actionId: 'methodology-retrofit.production-contract.contract-acceptance',
    expert: 'engineering-manager',
    description: 'Accept the production contract terms binding the delivered artifact (new production-contract/production-contract.js).',
  },
];

/**
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.changeDescription - What the run is supposed to change, in the author's own words
 * @param {string} [inputs.targetProcessPath] - Process file whose header should carry the tag; omitted means annotation is skipped
 * @param {string} [inputs.productionContract] - A pre-drafted contract sentence to critique and normalize rather than replace
 * @param {string} [inputs.verificationCommand] - A pre-chosen verification command to design around
 * @param {string} [inputs.kipDir] - kip store directory
 * @param {string} [inputs.kipModel] - Model for structured kip paths
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Contract, diagnostic, verification path and run, annotation, gate verdict and knowledge
 */
export async function process(inputs, ctx) {
  const {
    changeDescription,
    targetProcessPath = null,
    productionContract = null,
    verificationCommand = null,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet'
  } = inputs;

  if (!changeDescription || changeDescription.trim().length === 0) {
    throw new Error('changeDescription is required: the contract is drafted from what the run is supposed to change');
  }

  // Phase 0: recall what prior runs learned about writing honest contracts.
  const priorPractice = await kipRecall(ctx, {
    kipDir,
    topic: 'production contract practice',
    kipModel,
    kind: 'methodology-practice'
  });

  // Ceremony decision provenance — one entry per raise of a declared actionId.
  const ceremonyDecisions = [];

  // ============================================================================
  // PHASE 1: DRAFT THE CONTRACT
  // ============================================================================

  const contract = await ctx.task(draftProductionContractTask, {
    changeDescription,
    existingContract: productionContract,
    targetProcessPath,
    priorPractice: priorPractice.insights
  });

  // ============================================================================
  // PHASE 2: DIAGNOSTIC FIRST
  // ============================================================================

  const diagnostic = await ctx.task(diagnosticFirstTask, {
    changeDescription,
    contract: contract.contract,
    targetProcessPath
  });

  // ============================================================================
  // PHASE 3: DESIGN THE VERIFICATION PATH
  // ============================================================================

  const verificationPath = await ctx.task(designVerificationPathTask, {
    contract: contract.contract,
    userVisibleSubject: contract.userVisibleSubject,
    observableAssertion: contract.observableAssertion,
    diagnostic,
    suppliedCommand: verificationCommand
  });

  // ============================================================================
  // PHASE 4: CONTRACT ACCEPTANCE CEREMONY
  // ============================================================================

  const acceptanceDecision = await routedBreakpoint(ctx, {
    question: `Accept this production contract as the binding assertion for the run? Contract: "${contract.contract}". Verification: \`${verificationPath.verificationCommand}\`, expected observation: ${verificationPath.expectedObservation}. Reproducible by an outsider: ${verificationPath.reproducibleByOutsider}. Confirmed cause from the diagnostic: ${diagnostic.confirmedCause}.`,
    title: 'Production Contract Acceptance',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/production-contract/contract.md', format: 'markdown', label: 'Draft Contract' },
        { path: 'artifacts/production-contract/diagnostic.md', format: 'markdown', label: 'Diagnostic Findings' },
        { path: 'artifacts/production-contract/verification-path.md', format: 'markdown', label: 'Verification Path' }
      ]
    },
    contract,
    verificationPath,
    diagnostic
  }, {
    breakpointId: 'methodology-retrofit.production-contract.contract-acceptance',
    expert: 'engineering-manager',
    tags: ['policy-gated', 'methodology', 'production-contract'],
    strategy: 'single'
  });

  ceremonyDecisions.push({
    actionId: 'methodology-retrofit.production-contract.contract-acceptance',
    expert: 'engineering-manager',
    description: policyGatedActions[0].description,
    approved: acceptanceDecision.approved === true,
    autoApproved: acceptanceDecision.autoApproved === true,
    decidedAt: ctx.now()
  });

  // ============================================================================
  // PHASE 5: EXECUTE THE VERIFICATION
  // ============================================================================

  const verificationRun = await ctx.task(executeVerificationTask, {
    contract: contract.contract,
    verificationCommand: verificationPath.verificationCommand,
    seedSteps: verificationPath.seedSteps,
    expectedObservation: verificationPath.expectedObservation
  });

  // ============================================================================
  // PHASE 6: ADVERSARIAL VERIFICATION GATE
  // ============================================================================

  const contractGate = await adversarialGate(ctx, {
    gateId: 'methodologies.production-contract.contract-verification',
    artifact: {
      path: 'artifacts/production-contract/verification-run.md',
      description: 'Raw captured output of the executed verification path, alongside the declared contract sentence'
    },
    critics: [
      {
        name: 'contract-shape-critic',
        role: 'Convention auditor for the @productionContract tag',
        focus: 'the contract is one sentence, user-visible, and verifiable from outside the codebase'
      },
      {
        name: 'verification-evidence-critic',
        role: 'Evidence auditor for the executed verification',
        focus: 'the captured output actually asserts the user-visible state named in the contract'
      }
    ],
    ironLaw: [
      'Quote the exact lines of artifacts/production-contract/verification-run.md that prove the contract sentence holds. No quote, no pass.',
      'A green test suite is NOT evidence. If the captured output asserts on a server-action return value, a mock state, an API success count, or any internal signal instead of the rendered/user-visible state, that is a high-severity issue — this is the exact failure mode the methodology exists to prevent (see README lines 20-59).',
      'Check the contract against library/methodologies/production-contract/README.md rules 1-5 and cite the rule number for every violation.',
      'If targetProcessPath was supplied, open it and cite the file:line where the @productionContract tag now appears; a claimed annotation you cannot see in the file is a high-severity issue.',
      'A verification path that cannot be re-run by a reviewer who has never read the source is an issue (README rule 3).'
    ],
    maxFixAttempts: 2,
    fixer: {},
    context: {
      contract: contract.contract,
      targetProcessPath,
      assertedOn: verificationRun.assertedOn,
      reproducibleByOutsider: verificationPath.reproducibleByOutsider
    }
  });

  // ============================================================================
  // PHASE 7: ANNOTATE THE TARGET PROCESS HEADER
  // ============================================================================

  // No fallback: with no targetProcessPath there is no file to annotate, and
  // guessing one would silently tag the wrong process.
  const annotation = targetProcessPath === null
    ? { skipped: true, reason: 'no targetProcessPath supplied' }
    : await ctx.task(annotateProcessHeaderTask, {
      targetProcessPath,
      contract: contract.contract,
      verificationCommand: verificationPath.verificationCommand
    });

  // ============================================================================
  // PHASE 8: REPORT + ASSERT
  // ============================================================================

  const report = await ctx.task(contractReportTask, {
    changeDescription,
    contract,
    diagnostic,
    verificationPath,
    verificationRun,
    annotation,
    qualityGate: {
      passed: contractGate.passed,
      issues: contractGate.issues,
      attempts: contractGate.attempts,
      escalated: contractGate.escalated
    }
  });

  const knowledge = await kipAssert(ctx, {
    kipDir,
    kipModel,
    kind: 'methodology-practice',
    facts: [
      {
        subject: 'methodology:production-contract',
        predicate: 'ceremony-gated',
        object: 'methodology-retrofit.production-contract.contract-acceptance',
        props: { raises: ceremonyDecisions.length }
      },
      {
        subject: 'methodology:production-contract',
        predicate: 'quality-gate-verdict',
        object: String(contractGate.passed),
        props: {
          gateId: 'methodologies.production-contract.contract-verification',
          attempts: contractGate.attempts,
          escalated: contractGate.escalated
        }
      },
      {
        subject: 'methodology:production-contract',
        predicate: 'contract-declared',
        object: String(contract.contract),
        props: {
          targetProcessPath,
          annotated: annotation.skipped !== true,
          userVisibleSubject: contract.userVisibleSubject
        }
      },
      {
        subject: 'methodology:production-contract',
        predicate: 'verification-path',
        object: String(verificationPath.verificationCommand),
        props: {
          reproducibleByOutsider: verificationPath.reproducibleByOutsider,
          contractHolds: verificationRun.contractHolds,
          assertedOn: verificationRun.assertedOn
        }
      }
    ]
  });

  return {
    success: contractGate.passed === true && verificationRun.contractHolds === true,
    changeDescription,
    contract,
    diagnostic,
    verificationPath,
    verificationRun,
    annotation,
    report,
    artifacts: {
      contract: 'artifacts/production-contract/contract.md',
      diagnostic: 'artifacts/production-contract/diagnostic.md',
      verificationPath: 'artifacts/production-contract/verification-path.md',
      verificationRun: 'artifacts/production-contract/verification-run.md',
      report: 'artifacts/production-contract/contract-report.md'
    },
    metadata: {
      processId: 'methodologies/production-contract',
      methodology: 'Production Contract',
      convention: 'library/methodologies/production-contract/README.md',
      adjacentMethodology: 'library/specializations/qa-testing-automation/diagnostic-first-phase.js',
      timestamp: ctx.now()
    },
    policyGatedActions: ceremonyDecisions,
    qualityGate: contractGate,
    knowledge: {
      recalledFactCount: priorPractice.factCount,
      storeInitialized: priorPractice.storeInitialized,
      asserted: knowledge.asserted
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Phase 1: turn the change description into ONE user-visible contract sentence.
 * A supplied contract is critiqued and normalized, never silently replaced.
 */
export const draftProductionContractTask = defineTask('draft-production-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft production contract: ${args.changeDescription}`,
  description: 'Draft the ONE user-visible assertion the run must move',
  agent: {
    name: 'production-contract-author',
    prompt: {
      role: 'Engineering manager writing the binding user-visible assertion for a run',
      task: 'Draft ONE production contract sentence for this change, obeying the convention in library/methodologies/production-contract/README.md',
      context: {
        changeDescription: args.changeDescription,
        existingContract: args.existingContract,
        targetProcessPath: args.targetProcessPath,
        priorPractice: args.priorPractice
      },
      instructions: [
        'Read library/methodologies/production-contract/README.md first — rules 1-5 and the worked examples are the specification.',
        'Rule 1: user-visible language only. "The bulk-backfill server action returns success:true" is wrong; "the (N) badge clears after reload" is right.',
        'Rule 2: exactly ONE sentence. If you need a paragraph, say so explicitly and recommend splitting the run — do not compress a paragraph into a run-on sentence.',
        'Rule 3: verifiable from outside the codebase. A reviewer who has never read the source must be able to tell whether the run succeeded.',
        'If existingContract is supplied, critique and normalize it against the rules rather than replacing it — record the original and what you changed.',
        'Record every draft you rejected and the rule number it violated in rejectedDrafts; the rejections are the evidence that the rules were applied.',
        'Name userVisibleSubject (who or what observes) and observableAssertion (what they observe) separately so the next phase can design a verification around them.',
        'Write the accepted contract, the rule checks and the rejected drafts to artifacts/production-contract/contract.md.'
      ],
      outputFormat: 'JSON with contract string, userVisibleSubject string, observableAssertion string, ruleChecks array [{rule, satisfied, note}], rejectedDrafts array [{draft, violatedRule, why}]'
    },
    outputSchema: {
      type: 'object',
      required: ['contract', 'userVisibleSubject', 'observableAssertion', 'ruleChecks', 'rejectedDrafts'],
      properties: {
        contract: { type: 'string' },
        userVisibleSubject: { type: 'string' },
        observableAssertion: { type: 'string' },
        ruleChecks: { type: 'array' },
        rejectedDrafts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production-contract', 'contract-draft']
}));

/**
 * Phase 2: the adjacent methodology. What does the real data actually say,
 * before anyone proposes a verification path?
 */
export const diagnosticFirstTask = defineTask('production-contract-diagnostic-first', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnostic first: what does the real data say?',
  description: 'Establish the observed symptom and its data evidence before designing verification',
  agent: {
    name: 'diagnostic-first-analyst',
    prompt: {
      role: 'Diagnostician working from production/real data rather than from the codebase narrative',
      task: 'Establish what the real system actually does today, before any verification path is designed',
      context: {
        changeDescription: args.changeDescription,
        contract: args.contract,
        targetProcessPath: args.targetProcessPath
      },
      instructions: [
        'Read library/specializations/qa-testing-automation/diagnostic-first-phase.js — this phase is that methodology applied to the contract.',
        'Name the observed symptom in the same user-visible terms the contract uses, not in terms of the suspected code path.',
        'Collect dataEvidence: concrete observations from real or production-shaped data, each with where it came from. A claim with no observation behind it does not belong here.',
        'List ruledOutCauses with the specific observation that ruled each one out. "Probably not the cache" without an observation is not a ruled-out cause.',
        'State the confirmedCause only if an observation supports it; otherwise say so plainly and report what would confirm it. Do not guess a cause to fill the field.',
        'Remember the incident this methodology came from: the real cause was a server-side framework default (a silent 1000-row response cap) that no mock could reproduce. Prefer observations against the real system over reasoning about the code.',
        'Write your findings to artifacts/production-contract/diagnostic.md.'
      ],
      outputFormat: 'JSON with observedSymptom string, dataEvidence array [{observation, source}], ruledOutCauses array [{cause, ruledOutBy}], confirmedCause string'
    },
    outputSchema: {
      type: 'object',
      required: ['observedSymptom', 'dataEvidence', 'ruledOutCauses', 'confirmedCause'],
      properties: {
        observedSymptom: { type: 'string' },
        dataEvidence: { type: 'array' },
        ruledOutCauses: { type: 'array' },
        confirmedCause: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production-contract', 'diagnostic']
}));

/**
 * Phase 3: a concrete, externally reproducible verification path.
 */
export const designVerificationPathTask = defineTask('design-verification-path', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design the verification path for the contract',
  description: 'Seed steps, the exact command, and the expected user-visible observation',
  agent: {
    name: 'verification-path-designer',
    prompt: {
      role: 'QA engineer designing a verification a stranger could re-run',
      task: 'Design the concrete verification path that proves the contract sentence holds',
      context: {
        contract: args.contract,
        userVisibleSubject: args.userVisibleSubject,
        observableAssertion: args.observableAssertion,
        diagnostic: args.diagnostic,
        suppliedCommand: args.suppliedCommand
      },
      instructions: [
        'Design seedSteps that put the system into the exact state the contract talks about, using the failure pattern the diagnostic confirmed.',
        'Give ONE exact verificationCommand a reviewer can paste and run. If suppliedCommand is provided, design around it and say whether it is sufficient.',
        'State the expectedObservation in user-visible terms — what the reviewer will SEE, not what the process will return.',
        'Set reproducibleByOutsider to false and explain why if the path needs credentials, an internal environment, or knowledge only the author has. Do NOT substitute "run the test suite" to make the field true — that substitution is the failure this methodology exists to prevent.',
        'The verification must assert on rendered/user-visible state. A path whose assertion reads a server-action return value, a mock state, or an API success count does not verify the contract.',
        'Write the path to artifacts/production-contract/verification-path.md.'
      ],
      outputFormat: 'JSON with verificationCommand string, seedSteps array of strings, expectedObservation string, reproducibleByOutsider boolean'
    },
    outputSchema: {
      type: 'object',
      required: ['verificationCommand', 'seedSteps', 'expectedObservation', 'reproducibleByOutsider'],
      properties: {
        verificationCommand: { type: 'string' },
        seedSteps: { type: 'array' },
        expectedObservation: { type: 'string' },
        reproducibleByOutsider: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production-contract', 'verification-design']
}));

/**
 * Phase 5: run the designed verification and capture the RAW output verbatim.
 */
export const executeVerificationTask = defineTask('execute-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute verification: ${args.verificationCommand}`,
  description: 'Run the designed verification and capture untruncated output',
  agent: {
    name: 'verification-runner',
    prompt: {
      role: 'Engineer running the accepted verification and reporting exactly what happened',
      task: 'Perform the seed steps, run the verification command, and capture the raw output verbatim',
      context: {
        contract: args.contract,
        verificationCommand: args.verificationCommand,
        seedSteps: args.seedSteps,
        expectedObservation: args.expectedObservation
      },
      instructions: [
        'Perform the seed steps in order, then run the verification command exactly as written.',
        'Capture the output VERBATIM and untruncated into rawOutput and into artifacts/production-contract/verification-run.md. Do not summarize, reformat or elide it — the next phase quotes from it.',
        'Report exitStatus as the observed status of the run, and describe any deviation from the designed path.',
        'assertedOn must name the specific thing the output asserts on — the rendered element, the reloaded page state, the user-visible value. If the output only shows a suite passing, say so: assertedOn is "test suite result", not the contract.',
        'Set contractHolds ONLY if the captured output shows the expected user-visible observation. Never derive it from the exit code alone — a zero exit with no user-visible assertion does not hold the contract.',
        'If the verification could not be run, say so and set contractHolds false with the reason. Do not substitute a different command.'
      ],
      outputFormat: 'JSON with rawOutput string, exitStatus string, contractHolds boolean, assertedOn string'
    },
    outputSchema: {
      type: 'object',
      required: ['rawOutput', 'exitStatus', 'contractHolds', 'assertedOn'],
      properties: {
        rawOutput: { type: 'string' },
        exitStatus: { type: 'string' },
        contractHolds: { type: 'boolean' },
        assertedOn: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production-contract', 'verification-run']
}));

/**
 * Phase 7: back-fill the @productionContract tag into the target header.
 */
export const annotateProcessHeaderTask = defineTask('annotate-process-header', (args, taskCtx) => ({
  kind: 'agent',
  title: `Annotate @productionContract in ${args.targetProcessPath}`,
  description: 'Insert or refresh the @productionContract tag in the target process JSDoc header',
  agent: {
    name: 'header-annotator',
    prompt: {
      role: 'Maintainer back-filling a JSDoc convention',
      task: `Insert or refresh the @productionContract tag in the top-level JSDoc of ${args.targetProcessPath}`,
      context: {
        targetProcessPath: args.targetProcessPath,
        contract: args.contract,
        verificationCommand: args.verificationCommand
      },
      instructions: [
        'Place the tag in the file top-level JSDoc alongside @agent / @inputs / @outputs, exactly as the "Where the tag goes" section of library/methodologies/production-contract/README.md specifies.',
        'If a @productionContract tag already exists, refresh it in place and report the previous text — do not append a second tag.',
        'Change NOTHING else in the file: no reformatting, no reordering of existing tags, no prose edits.',
        'Report the file:line where the tag now appears so a reviewer can verify it without re-reading the diff.'
      ],
      outputFormat: 'JSON with annotated boolean, location string (file:line), previousTag string or null, skipped boolean'
    },
    outputSchema: {
      type: 'object',
      required: ['annotated', 'location'],
      properties: {
        annotated: { type: 'boolean' },
        location: { type: 'string' },
        previousTag: { type: ['string', 'null'] },
        skipped: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production-contract', 'annotation']
}));

/**
 * Phase 8: the report a reviewer reads instead of the run.
 */
export const contractReportTask = defineTask('production-contract-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write the production contract report',
  description: 'Assemble contract, diagnostic, verification and annotation into one reviewable report',
  agent: {
    name: 'contract-reporter',
    prompt: {
      role: 'Technical writer producing the reviewable record of a contract-driven run',
      task: 'Write artifacts/production-contract/contract-report.md',
      context: {
        changeDescription: args.changeDescription,
        contract: args.contract,
        diagnostic: args.diagnostic,
        verificationPath: args.verificationPath,
        verificationRun: args.verificationRun,
        annotation: args.annotation,
        qualityGate: args.qualityGate
      },
      instructions: [
        'Lead with the contract sentence. It is the headline, not an appendix.',
        'Then: the confirmed cause from the diagnostic, the verification command, and the quoted lines of raw output that show the expected observation.',
        'State plainly whether the contract held. README rule 5: a run that passes every test gate but does not move the contract is a failed run — report it as failed rather than softening it.',
        'If annotation was skipped, say so and why. A skipped annotation is a reportable outcome, not an omission to hide.',
        'List the gate issues verbatim; do not editorialize them away.'
      ],
      outputFormat: 'JSON with reportPath string, contractHeld boolean, openIssues array of strings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'contractHeld', 'openIssues'],
      properties: {
        reportPath: { type: 'string' },
        contractHeld: { type: 'boolean' },
        openIssues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production-contract', 'report']
}));
