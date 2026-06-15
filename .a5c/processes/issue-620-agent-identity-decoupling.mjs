/**
 * @process repo/issue-620-agent-identity-decoupling
 * @description Implement issue #620: decouple durable agent identity/persona from AgentStack infrastructure in Kradle.
 * @inputs { issueNumber: number, branchName: string, baseBranch: string, targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], reuseAudit: object, implementation: object, verification: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - packages/kradle/docs/agent-identity/01-resource-model.md
 * - packages/kradle/docs/agent-identity/02-migration.md
 * - library/methodologies/rpikit/rpikit-implement.js
 * - library/methodologies/rpikit/rpikit-review.js
 * - library/methodologies/superpowers/test-driven-development.js
 * - library/methodologies/superpowers/verification-before-completion.js
 * - library/specializations/software-architecture/migration-strategy.js
 * - library/specializations/ai-agents-conversational/prompt-engineering-workflow.js
 * - library/specializations/ai-agents-conversational/system-prompt-guardrails.js
 * - library/specializations/qa-testing-automation/quality-gates.js
 *
 * Repo policy note: this repository asks direct babysitter:call processes to avoid
 * kind: 'shell' subtasks unless the user explicitly asks for a shell-oriented
 * workflow. This process uses agent tasks for research, implementation,
 * verification, review, and delivery, with concrete commands supplied as inputs.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function phaseNames(includeDelivery = false) {
  return [
    'reuse-audit',
    'issue-and-codebase-research',
    'process-library-research',
    'implementation-strategy',
    'contract-tests',
    'implementation-loop',
    'verification',
    'review',
    'final-acceptance',
    ...(includeDelivery ? ['delivery'] : []),
  ];
}

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 620;
  const branchName = inputs?.branchName ?? 'agent/issue-620-agent-identity';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueNumber,
  }, {
    key: 'issue-620.reuse-audit',
  });

  const issueContext = await ctx.task(readIssueAndCodebaseTask, {
    inputs,
    issueNumber,
    reuseAudit,
  }, {
    key: 'issue-620.issue-and-codebase',
  });

  const libraryResearch = await ctx.task(researchProcessLibraryTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-620.process-library-research',
  });

  const strategy = await ctx.task(designImplementationStrategyTask, {
    inputs,
    issueContext,
    libraryResearch,
    reuseAudit,
  }, {
    key: 'issue-620.strategy',
  });

  if (strategy?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #620 Identity Model Decision',
      question: strategy.question || 'A maintainer decision is required before implementing the agent identity model. How should the run proceed?',
      options: [
        'Proceed with the recommended compatibility-preserving design',
        'Pause for maintainer guidance',
      ],
      expert: 'owner',
      tags: ['issue-620', 'agent-identity', 'architecture-decision'],
      context: {
        runId: ctx.runId,
        issueNumber,
        strategy,
      },
    });
  }

  const contractTests = await ctx.task(authorContractTestsTask, {
    inputs,
    issueContext,
    libraryResearch,
    strategy,
  }, {
    key: 'issue-620.contract-tests',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementIdentityDecouplingTask, {
      inputs,
      issueContext,
      libraryResearch,
      strategy,
      contractTests,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-620.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyIdentityDecouplingTask, {
      inputs,
      issueContext,
      strategy,
      contractTests,
      implementation,
      attempt,
    }, {
      key: `issue-620.verification.${attempt}`,
    });

    review = await ctx.task(reviewIdentityDecouplingTask, {
      inputs,
      issueContext,
      libraryResearch,
      strategy,
      contractTests,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-620.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    libraryResearch,
    strategy,
    contractTests,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-620.final-acceptance',
  });

  if (finalGate?.passed !== true) {
    await ctx.breakpoint({
      title: 'Issue #620 Quality Gate Blocked',
      question: 'The implementation did not satisfy the final acceptance gate. Approve another manual attempt with the recorded failures, or stop for maintainer review?',
      options: [
        'Stop and report blocked quality gate',
        'Approve one manual follow-up attempt',
      ],
      expert: 'owner',
      tags: ['issue-620', 'agent-identity', 'quality-gate'],
      context: {
        runId: ctx.runId,
        issueNumber,
        finalGate,
        attempts,
      },
    });

    return {
      success: false,
      phases: phaseNames(false),
      reuseAudit,
      issueContext,
      libraryResearch,
      strategy,
      contractTests,
      implementation,
      verification,
      review,
      attempts,
      finalGate,
    };
  }

  const delivery = await ctx.task(deliverIssue620Task, {
    issueNumber,
    branchName,
    baseBranch,
    finalGate,
    implementation,
    verification,
    review,
  }, {
    key: 'issue-620.delivery',
  });

  return {
    success: true,
    phases: phaseNames(true),
    reuseAudit,
    issueContext,
    libraryResearch,
    strategy,
    contractTests,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
    delivery,
  };
}

export const reuseAuditTask = defineTask('issue-620.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 - Reuse audit for agent identity decoupling',
  labels: ['issue-620', 'reuse-audit', 'kradle', 'agent-identity'],
  agent: {
    name: 'codebase-researcher',
    prompt: {
      role: 'senior repository researcher',
      task: 'Run the required Phase 0 reuse audit before implementation planning.',
      instructions: [
        'Do not edit files.',
        'Start your output with exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'Extract keyword nouns and verbs from issue #620 and the supplied inputs: AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, AgentDefinition, AgentStack, prompt composition, dispatch, trigger, MCP, SDK exports, CRD, migration, persona, stack, identity.',
        'Honor .a5c/reuse-audit.json if it exists. If it does not exist, say so and use the target files and keywords in inputs.',
        'Scan for matching migrations, API routes, CRDs, controllers, SDK exports, MCP tools, tests, docs, environment variables, and imports.',
        'Specifically inspect packages/kradle/docs/agent-identity, packages/kradle/core/src, packages/kradle/core/tests, packages/kradle/charts/crds, packages/kradle/cli/src, packages/kradle/cli/tests, packages/kradle/sdk/src, packages/kradle/sdk/tests, and packages/kradle/web where references appear.',
        'Record that .a5c/process-library was requested by the planning prompt; if it is absent, fall back to the checked-in library/ process library and continue.',
        'Return JSON: { heading, keywords, existingInfrastructure, matchingFiles, noMatchingInfrastructureNotes, conflictsOrDuplicates, reusablePatterns, requiredFollowUpResearch }.',
        'INPUTS JSON:',
        JSON.stringify(args.inputs ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readIssueAndCodebaseTask = defineTask('issue-620.read-issue-and-codebase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #620 and trace Kradle identity surfaces',
  labels: ['issue-620', 'kradle', 'context', 'codebase-research'],
  agent: {
    name: 'kradle-architecture-researcher',
    prompt: {
      role: 'senior Kradle core architect',
      task: 'Read the authoritative issue context and trace the current AgentStack-centered implementation.',
      instructions: [
        'Do not edit files.',
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments and preserve the title, labels, body, and comments.`,
        `Also run gh pr view ${args.issueNumber} --json files,title,body,comments and record whether GitHub reports that it is not a PR.`,
        'Read packages/kradle/docs/agent-identity/01-resource-model.md and packages/kradle/docs/agent-identity/02-migration.md as the design source of truth.',
        'Trace current code paths for resource definitions, validation, CRD YAML, stack reconciliation, manual dispatch, trigger dispatch, permission review, context bundle assembly, MCP server tools, API dispatch route, and SDK exports.',
        'Use the reuse audit findings as prework and call out existing infrastructure that must be reused instead of recreated.',
        'Identify current hard requirements and compatibility constraints: AgentStack remains accepted, inline stack prompts remain functional as deprecated fallback, AgentDefinition resolves to AgentStack before permission/runtime review, and TriggerRule/DispatchRun can target either agentDefinition or agentStack.',
        'Return JSON: { issue, isPullRequest, sourceOfTruthDocs, currentCallPaths, currentFiles, existingTests, compatibilityConstraints, targetChangeSurfaces, nonGoals, risks }.',
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
        'INPUTS JSON:',
        JSON.stringify(args.inputs ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-620.research-process-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research process-library methods for identity decoupling',
  labels: ['issue-620', 'process-library', 'methodology-research'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process-library researcher',
      task: 'Select the implementation and verification methodologies for issue #620.',
      instructions: [
        'Do not edit files.',
        'First check whether .a5c/process-library exists. If absent, record that and research the checked-in library/ process library instead.',
        'Prioritize brownfield architecture migration, TDD, verification-before-completion, code review, prompt composition/guardrails, agent identity/persona design, SDK/API contract updates, and quality gates.',
        'Read docs/agent-reference/process-authoring.md and apply the repo-specific rule that direct babysitter:call processes should avoid kind: shell subtasks unless explicitly requested.',
        'Recommended local references to inspect when present: library/methodologies/rpikit/rpikit-implement.js, library/methodologies/rpikit/rpikit-review.js, library/methodologies/superpowers/test-driven-development.js, library/methodologies/superpowers/verification-before-completion.js, library/specializations/software-architecture/migration-strategy.js, library/specializations/ai-agents-conversational/prompt-engineering-workflow.js, library/specializations/ai-agents-conversational/system-prompt-guardrails.js, library/specializations/qa-testing-automation/quality-gates.js.',
        'Return JSON: { processLibraryRoot, missingRequestedLibraryPath, references, applicablePatterns, repoPolicyConstraints, recommendedProcessShape, qualityGatePattern, breakpointPolicy }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designImplementationStrategyTask = defineTask('issue-620.design-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design staged implementation strategy',
  labels: ['issue-620', 'architecture', 'strategy', 'agent-identity'],
  agent: {
    name: 'software-architect',
    prompt: {
      role: 'senior Kradle architecture maintainer',
      task: 'Design a compatibility-preserving implementation strategy for agent identity decoupling.',
      instructions: [
        'Do not edit files.',
        'Use a flat phase-list strategy because the issue is a defined feature/architecture change, not an unknown bug.',
        'Design the work in small, testable slices:',
        '1. Add AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, and AgentDefinition to the resource model and Helm CRDs.',
        '2. Add an agent-persona controller/resolver and a prompt composition module that layers soul, persona, definition, and legacy stack prompts deterministically.',
        '3. Update dispatch resolution so createManualDispatch accepts agentDefinition or agentStack, stores compatible run fields, composes prompts only through the new module, and resolves AgentDefinition to AgentStack before permission review, memory, workspace, context bundle, and job creation.',
        '4. Update trigger and webhook intent paths to carry agentDefinition when present while preserving agentStack legacy paths.',
        '5. Keep AgentStack infrastructure-focused without breaking existing inline prompt and skill behavior in this implementation pass.',
        '6. Add SDK exports and MCP tools kradle_list_agents, kradle_get_agent_profile, and kradle_create_agent.',
        '7. Add contract, controller, compatibility, and MCP/SDK tests.',
        'Identify any maintainer decision that is genuinely required. Otherwise set needsMaintainerDecision false.',
        'Return JSON: { recommendedDesign, phasePlan, targetFiles, resourceSchemaPlan, controllerPlan, dispatchPlan, triggerPlan, mcpSdkPlan, testPlan, migrationNotes, rejectedAlternatives, risks, needsMaintainerDecision, question }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'PROCESS LIBRARY RESEARCH JSON:',
        JSON.stringify(args.libraryResearch ?? {}, null, 2),
        'REUSE AUDIT JSON:',
        JSON.stringify(args.reuseAudit ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorContractTestsTask = defineTask('issue-620.author-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing contract tests first',
  labels: ['issue-620', 'tdd', 'tests', 'quality-gate'],
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'senior JavaScript test engineer',
      task: 'Add focused failing tests for issue #620 before implementation.',
      instructions: [
        'Edit the repository directly.',
        'Preserve unrelated local changes.',
        'Add tests before production code changes wherever practical.',
        'Cover resource model set membership, requiredSpec, counts, createResource, validateResource, and resourceSchemaForKind for AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, and AgentDefinition.',
        'Cover chart CRD presence and schema shape for the five new resource kinds in packages/kradle/charts/crds/agent-resources.yaml.',
        'Cover prompt composition deterministic layering: AgentSoul content, AgentPersona personality and role fields, AgentDefinition roleContext, and legacy AgentStack system/developer/task prompt fallback.',
        'Cover persona resolver behavior for inline and referenced soul/appearance/voice refs, missing references, and namespace/org scoping where local patterns exist.',
        'Cover dispatch compatibility: legacy agentStack dispatch still works, AgentDefinition dispatch resolves to the referenced AgentStack, permission review still receives the stack name, run specs preserve both new and legacy target fields as designed, and job prompt uses composed output.',
        'Cover trigger compatibility: AgentTriggerRule can target agentDefinition or legacy agentStack; webhook dispatch intents include the correct target.',
        'Cover SDK exports and MCP tools for listing agents, getting a resolved profile, and creating the persona/soul/definition bundle.',
        'Return JSON: { changedFiles, testsAdded, expectedFailuresBeforeImplementation, coverageMap, notes }.',
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementIdentityDecouplingTask = defineTask('issue-620.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement agent identity decoupling',
  labels: ['issue-620', 'implementation', 'kradle', 'agent-identity'],
  agent: {
    name: 'kradle-core-implementer',
    prompt: {
      role: 'senior Kradle core and SDK engineer',
      task: 'Implement issue #620 against the staged strategy and failing contract tests.',
      instructions: [
        'Edit the repository directly.',
        'Preserve unrelated local changes and do not stage or revert them.',
        `This is implementation attempt ${args.attempt}.`,
        'Keep the change scoped to Kradle core, Helm CRDs, CLI MCP, SDK exports, and focused tests unless the strategy proves another file is required.',
        'Do not implement the web console work from follow-up issue #621 or migration tooling from follow-up issue #622, except for compatibility surfaces required by core dispatch/API paths.',
        'Add the five identity resources to CONFIG_KINDS and RESOURCE_DEFINITIONS with requiredSpec and field type validation updates where needed.',
        'Update resource count assertions and minimal specs in tests instead of weakening the tests.',
        'Add the five CRDs to packages/kradle/charts/crds/agent-resources.yaml and preserve existing AgentStack, AgentTriggerRule, and AgentDispatchRun compatibility.',
        'Create agent-persona-controller.js for profile validation/resolution of persona, soul, appearance, voice, and definition refs.',
        'Create a prompt composition module with deterministic, unit-tested composition for soul -> persona -> definition -> stack fallback. Keep legacy AgentStack inline prompts functional and mark them deprecated through warnings or metadata only where local patterns support it.',
        'Update agent-dispatch-controller.js to accept agentDefinition or agentStack. Resolve AgentDefinition to AgentStack before permission review, memory, workspace, context bundle assembly, and job creation. Preserve permission checks and runtime identity behavior.',
        'Update agent-trigger-controller.js so trigger and webhook paths pass agentDefinition when present and agentStack otherwise.',
        'Update CLI MCP tools with kradle_list_agents, kradle_get_agent_profile, and kradle_create_agent, using existing controller/list/apply patterns.',
        'Export new controllers and helpers from core and SDK barrels.',
        'Update docs comments or README snippets only when needed to keep test expectations and public tool descriptions accurate.',
        'Return JSON: { changedFiles, summary, compatibilityBehavior, promptCompositionBehavior, testsUpdated, risks, commitMessage }.',
        'CONTRACT TESTS JSON:',
        JSON.stringify(args.contractTests ?? {}, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
        'PREVIOUS VERIFICATION JSON:',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        'PREVIOUS REVIEW JSON:',
        JSON.stringify(args.previousReview ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyIdentityDecouplingTask = defineTask('issue-620.verify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify issue #620 quality gates',
  labels: ['issue-620', 'verification', 'quality-gate'],
  agent: {
    name: 'cicd-test-integration',
    prompt: {
      role: 'senior CI verification engineer',
      task: 'Run and interpret the issue #620 verification gates.',
      instructions: [
        'Run the concrete commands supplied in inputs.verificationCommands plus any narrower focused checks needed by the changed files.',
        'At minimum, run focused Kradle core tests covering agent resources, persona/prompt composition, dispatch, stack, and trigger behavior; focused CLI MCP tests; focused SDK export tests; git diff --check; npm run build:kradle; npm run test:kradle; npm run build:sdk; npm run verify:metadata.',
        'Verify no source file outside the intended target surface was changed unless justified by the strategy.',
        'Verify legacy AgentStack dispatch still passes and new AgentDefinition dispatch passes.',
        'Verify permission review still gates the resolved stack service account, roles, secrets, and config grants.',
        'Verify prompt composition ordering is deterministic and no test only checks for substring presence when ordering matters.',
        'Return JSON: { passed, commandsRun: [{ command, exitCode, evidence }], focusedCoverage, failures, residualRisk, changedFiles }.',
        'INPUT VERIFICATION COMMANDS:',
        JSON.stringify(args.inputs?.verificationCommands ?? [], null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewIdentityDecouplingTask = defineTask('issue-620.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review agent identity implementation against issue #620',
  labels: ['issue-620', 'review', 'spec-compliance'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior Kradle code reviewer',
      task: 'Review the issue #620 implementation for correctness, compatibility, and scope control.',
      instructions: [
        'Inspect the final git diff and relevant changed files.',
        'Compare the implementation directly to the GitHub issue, comments, and agent-identity docs.',
        'Reject the change if AgentStack legacy dispatch breaks, if AgentDefinition bypasses permission review, if CRD YAML and resource-model definitions diverge, if prompt composition is duplicated instead of centralized, or if tests are weakened.',
        'Check that AgentStack is kept infrastructure-focused without removing backwards-compatible inline prompt handling in this pass.',
        'Check SDK exports and MCP tools use existing public API patterns and include focused tests.',
        'Check that source changes avoid follow-up scope for web console and migration tooling unless required for compatibility.',
        'Return JSON: { approved, issues, requiredChanges, summary, residualRisks }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-620.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #620',
  labels: ['issue-620', 'acceptance', 'quality-gate'],
  agent: {
    name: 'spec-reviewer',
    prompt: {
      role: 'release-minded Kradle maintainer',
      task: 'Decide whether the issue #620 implementation is ready for PR delivery.',
      instructions: [
        'Read the final git diff, issue context, test output evidence, review notes, and process-library constraints.',
        'Acceptance requires all five CRDs in resource-model and chart YAML, persona resolution, centralized prompt composition, AgentDefinition dispatch and trigger compatibility, legacy AgentStack dispatch compatibility, SDK exports, MCP tools, and focused tests.',
        'Acceptance also requires the broad commands in inputs.verificationCommands to pass or have a precise environment-only reason for any skipped command.',
        'Verify changed files are limited to targetFiles plus tests/docs needed for public contract updates.',
        'Return JSON: { passed, changedFiles, acceptance: string[], blockers: string[], residualRisk: string[], prSummary: string, issueComment: string }.',
        'ISSUE CONTEXT JSON:',
        JSON.stringify(args.issueContext ?? {}, null, 2),
        'LIBRARY RESEARCH JSON:',
        JSON.stringify(args.libraryResearch ?? {}, null, 2),
        'STRATEGY JSON:',
        JSON.stringify(args.strategy ?? {}, null, 2),
        'CONTRACT TESTS JSON:',
        JSON.stringify(args.contractTests ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'REVIEW JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
        'ATTEMPTS JSON:',
        JSON.stringify(args.attempts ?? [], null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverIssue620Task = defineTask('issue-620.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, create PR, and comment on issue #620',
  labels: ['issue-620', 'delivery', 'github'],
  agent: {
    name: 'delivery-agent',
    prompt: {
      role: 'repository delivery agent',
      task: 'Deliver the completed issue #620 implementation through GitHub.',
      instructions: [
        'Inspect git status and stage only files related to issue #620.',
        'Do not stage unrelated local changes, secrets, generated logs, or run artifacts.',
        `Commit on branch ${args.branchName} using the implementation commit message from finalGate or implementation.`,
        `Push ${args.branchName} to origin.`,
        `Create a PR against ${args.baseBranch} with a title that links to issue #${args.issueNumber} and a body summarizing phases, tests, quality gates, and residual risk.`,
        `Post a comment on issue #${args.issueNumber} with the implementation summary, verification evidence, residual risk, and PR link.`,
        'Return JSON: { committed, commitSha, prUrl, issueCommentUrl, stagedFiles, summary }.',
        'FINAL GATE JSON:',
        JSON.stringify(args.finalGate ?? {}, null, 2),
        'IMPLEMENTATION JSON:',
        JSON.stringify(args.implementation ?? {}, null, 2),
        'VERIFICATION JSON:',
        JSON.stringify(args.verification ?? {}, null, 2),
        'REVIEW JSON:',
        JSON.stringify(args.review ?? {}, null, 2),
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
