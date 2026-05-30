/**
 * @process repo/issue-622-agent-identity-migration-tooling
 * @description Implement issue #622: Agent identity migration tooling and backward-compatible AgentDefinition dispatch.
 * @inputs { issueNumber: number, title: string, issueBody: string, comments: array, labels: string[], branch: string, dependencyIssue: number, targetFiles: object, qualityCommands: string[], maxImplementationAttempts: number }
 * @outputs { success: boolean, phases: object, runtimeCallPaths: array, changedFiles: array, qualityGate: object, review: object }
 *
 * @process methodologies/spec-kit/spec-kit-implementation
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process specializations/web-development/nextjs-fullstack-app
 * @process specializations/web-development/api-integration-testing
 * @agent api-architect specializations/web-development/agents/api-architect/AGENT.md
 * @agent react-developer specializations/web-development/agents/react-developer/AGENT.md
 * @agent code-reviewer specializations/web-development/agents/code-reviewer/AGENT.md
 *
 * This process intentionally uses agent tasks rather than shell tasks to respect
 * this repository's process-authoring override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const reuseAuditTask = defineTask(
  'issue-622.reuse-audit',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Phase 0 - Reuse audit for identity migration surfaces',
    labels: ['issue-622', 'reuse-audit', 'research'],
    agent: {
      name: 'krate-reuse-auditor',
      prompt: {
        role: 'senior Krate platform engineer',
        task: 'Perform the required Phase 0 reuse audit before implementation.',
        instructions: [
          'Do not edit files in this task.',
          'Extract keyword nouns and verbs from the issue context.',
          'Search for matching migration scripts, AgentPersona, AgentDefinition, agentDefinition, agentStack, stackRef, TriggerRule, dispatchAgent, krate_dispatch_agent, prompt composition, and CRD schema infrastructure.',
          'Honor .a5c/reuse-audit.json if present. If absent, state that no repo-local reuse-audit config exists.',
          'Render a section titled exactly: Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
          'Identify existing code to reuse instead of creating parallel infrastructure.',
          'Return JSON: { keywords: array, findings: array, noConfigFound: boolean, reusableSurfaces: array, missingSurfaces: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(args.issueContext, null, 2),
          '',
          'INITIAL CODEBASE FINDINGS:',
          JSON.stringify(args.initialFindings, null, 2),
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
  { kind: 'agent', title: 'Reuse audit', labels: ['issue-622', 'reuse-audit'] },
);

const dependencyAndScopeTask = defineTask(
  'issue-622.dependency-and-scope',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Phase 1 - Dependency and scope confirmation',
    labels: ['issue-622', 'dependency', 'scope'],
    agent: {
      name: 'krate-identity-scope-planner',
      prompt: {
        role: 'senior Krate architecture maintainer',
        task: 'Confirm the issue #620 dependency state and lock the issue #622 implementation scope.',
        instructions: [
          'Do not edit files in this task.',
          'Inspect resource-model.js, agent-resources.yaml, and docs/agent-identity/01-resource-model.md.',
          'Determine whether AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, and AgentDefinition already exist in RESOURCE_DEFINITIONS, CONFIG_KINDS, CRDs, validation rules, and Kubernetes controller kind lists.',
          'If #620 is not present on the branch, plan to implement only the missing core resource model prerequisites needed by #622 before compatibility work.',
          'Keep the scope non-breaking: legacy AgentStack workflows must continue to work indefinitely.',
          'Return JSON: { dependencyReady: boolean, missingCoreIdentityPieces: array, scopeDecision: string, prerequisiteTasks: array, blockers: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(args.issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(args.reuseAudit ?? {}, null, 2),
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
  { kind: 'agent', title: 'Dependency and scope confirmation', labels: ['issue-622', 'dependency'] },
);

const traceRuntimePathsTask = defineTask(
  'issue-622.trace-runtime-paths',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Phase 2 - Trace dispatch, trigger, UI, and MCP paths',
    labels: ['issue-622', 'runtime-call-path', 'research'],
    agent: {
      name: 'krate-runtime-path-tracer',
      prompt: {
        role: 'senior Krate controller and web engineer',
        task: 'Trace live runtime call paths for every surface affected by AgentDefinition compatibility.',
        instructions: [
          'Do not edit files in this task.',
          'Trace the live path from web POST /api/orgs/[org]/agents/dispatch and CLI/MCP krate_dispatch_agent into createKrateApiController.dispatchAgent and createAgentDispatchController.createManualDispatch.',
          'Trace AgentTriggerRule evaluation from createAgentTriggerController.processEvent and evaluateWebhookEvent into dispatch.',
          'Trace resource validation and CRD schema paths for AgentTriggerRule and AgentDispatchRun required fields.',
          'Trace stack builder and trigger rule form paths enough to preserve stack infrastructure creation while adding definition-aware dispatch/rules.',
          'Record runtimeCallPaths with file path, function/component, current field contract, required change, and tests to update.',
          'Return JSON: { runtimeCallPaths: array, targetFiles: array, fieldContract: object, implementationOrder: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(args.issueContext, null, 2),
          '',
          'DEPENDENCY AND SCOPE:',
          JSON.stringify(args.dependencyAndScope ?? {}, null, 2),
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
  { kind: 'agent', title: 'Trace runtime call paths', labels: ['issue-622', 'runtime'] },
);

const authorAcceptanceTestsTask = defineTask(
  'issue-622.author-acceptance-tests',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Phase 3 - Author compatibility and migration tests first',
    labels: ['issue-622', 'tests', 'atdd', 'phase:red'],
    agent: {
      name: 'krate-identity-test-author',
      prompt: {
        role: 'senior Node.js and Next.js test engineer',
        task: 'Author focused failing tests for issue #622 before implementation changes.',
        instructions: [
          'Follow ATDD/TDD. Add tests before production implementation changes.',
          'Use the issue context below as the acceptance spec. Do not redefine expected behavior from current implementation.',
          'Prefer focused coverage in packages/krate/core/tests/agent-dispatch-controller.test.js, packages/krate/core/tests/agent-trigger-controller.test.js, packages/krate/core/tests/agent-resources.test.js, packages/krate/cli/tests/mcp-server.test.js, packages/krate/cli/tests/cli-commands.test.js, and packages/krate/web/tests/resource-contract.test.js or api-routes.test.js as appropriate.',
          'Cover legacy agentStack dispatch still working with inline prompts and skillRefs.',
          'Cover agentDefinition dispatch resolving AgentDefinition -> AgentPersona -> AgentStack and composing prompts without losing stack runtime config.',
          'Cover AgentTriggerRule accepting agentDefinition as an alternative to agentStack while stack-only rules remain valid.',
          'Cover deprecation warning behavior for legacy stacks with inline prompt or skill identity fields.',
          'Cover migration tooling dry-run and apply behavior, including backup/reversible output and cleaning stack fields only after persona/definition writes succeed.',
          'Cover krate_dispatch_agent accepting either definitionRef/agentDefinition or stackRef/agentStack.',
          'Run the narrow tests and record which fail for the expected missing-feature reasons.',
          'Return JSON: { testFiles: array, testNames: array, redVerified: boolean, redCommands: array, expectedFailures: array, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(args.issueContext, null, 2),
          '',
          'RUNTIME CALL PATHS:',
          JSON.stringify(args.runtimeTrace ?? {}, null, 2),
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
  { kind: 'agent', title: 'Author acceptance tests', labels: ['issue-622', 'tests'] },
);

const implementCoreCompatibilityTask = defineTask(
  'issue-622.implement-core-compatibility',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Phase 4 - Implement core identity compatibility',
    labels: ['issue-622', 'implementation', 'krate-core'],
    agent: {
      name: 'krate-identity-core-implementer',
      prompt: {
        role: 'senior Krate core controller engineer',
        task: 'Implement the core resource, dispatch, trigger, and migration compatibility work for issue #622.',
        instructions: [
          'Edit the repository directly. Preserve unrelated worktree changes.',
          'Keep changes focused to the runtime call paths identified in research.',
          'If #620 core identity resources are missing, add the minimum AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, and AgentDefinition definitions needed by this issue in resource-model.js, CRDs, and Kubernetes controller kind lists.',
          'Centralize dispatch target resolution so callers can pass agentDefinition or agentStack. Prefer agentDefinition when both are supplied unless tests establish a stricter validation rule.',
          'Resolve AgentDefinition to AgentPersona and AgentStack. Resolve AgentSoul when referenced or inline persona soul when present.',
          'Compose prompts from soul, persona, definition roleContext, and legacy stack prompt fields while preserving developerPrompt and taskPrompt compatibility.',
          'Preserve stack runtime config: adapter, provider, model, MCP servers, approval mode, runtimeIdentity, memory config, workspace, budgets, and job creation behavior.',
          'Keep legacy AgentStack dispatch and stack-only trigger rules working.',
          'Log or expose a deprecation warning when dispatch resolves a legacy AgentStack containing systemPrompt, developerPrompt, taskPrompt, or skillRefs.',
          'Update AgentDispatchRun and AgentDispatchAttempt snapshots so the selected target is auditable without breaking consumers that read agentStack.',
          'Return JSON: { changedFiles: array, summary: string, compatibilityContract: object, warningsImplemented: boolean, testsRun: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(args.issueContext, null, 2),
          '',
          'DEPENDENCY AND SCOPE:',
          JSON.stringify(args.dependencyAndScope ?? {}, null, 2),
          '',
          'RUNTIME CALL PATHS:',
          JSON.stringify(args.runtimeTrace ?? {}, null, 2),
          '',
          'ACCEPTANCE TESTS:',
          JSON.stringify(args.acceptanceTests ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK FROM PRIOR ATTEMPT:',
          JSON.stringify(args.verificationFeedback ?? null, null, 2),
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
  { kind: 'agent', title: 'Implement core compatibility', labels: ['issue-622', 'implementation'] },
);

const implementSurfacesTask = defineTask(
  'issue-622.implement-surfaces',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Phase 5 - Implement web, CLI, MCP, and migration surfaces',
    labels: ['issue-622', 'implementation', 'web', 'mcp', 'migration'],
    agent: {
      name: 'krate-identity-surface-implementer',
      prompt: {
        role: 'senior Krate full-stack engineer',
        task: 'Implement the non-core surfaces for issue #622.',
        instructions: [
          'Edit the repository directly. Preserve unrelated worktree changes.',
          'Add migration tooling for AgentStack -> AgentPersona + AgentDefinition with dry-run default, explicit apply mode, backup/reversible output, and no stack cleanup until persona and definition writes succeed.',
          'Expose the migration tooling through the repo pattern that best fits existing Krate scripts or CLI commands; do not introduce a parallel framework.',
          'Update the web dispatch API to accept agentDefinition/definitionRef as well as agentStack/stackRef.',
          'Update trigger rule create/edit UI and resource contracts to support agentDefinition while preserving legacy stack selection and existing stack builder behavior.',
          'Keep the stack builder creating infrastructure-oriented AgentStack resources. Remove or de-emphasize persona-owned prompt/skill fields only if tests and docs make the behavior clear, while preserving editing of legacy fields when necessary for backward compatibility.',
          'Update krate_dispatch_agent in CLI MCP server and Atlas tool descriptor to accept definition or stack reference.',
          'Update docs or examples only where existing checked-in docs would otherwise contradict the new behavior.',
          'Return JSON: { changedFiles: array, migrationTool: object, webUpdates: array, mcpUpdates: array, docsUpdates: array, testsRun: array, remainingRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(args.issueContext, null, 2),
          '',
          'CORE IMPLEMENTATION:',
          JSON.stringify(args.coreImplementation ?? {}, null, 2),
          '',
          'ACCEPTANCE TESTS:',
          JSON.stringify(args.acceptanceTests ?? {}, null, 2),
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
  { kind: 'agent', title: 'Implement surfaces and migration tooling', labels: ['issue-622', 'implementation'] },
);

const verifyQualityGateTask = defineTask(
  'issue-622.verify-quality-gate',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Phase 6 - Verify compatibility quality gates',
    labels: ['issue-622', 'verification', 'quality-gate'],
    agent: {
      name: 'krate-identity-verifier',
      prompt: {
        role: 'senior Krate release verifier',
        task: 'Run and interpret the issue #622 quality gates.',
        instructions: [
          'Run the listed commands from the repository root.',
          'Confirm the tests added in the red phase now pass for the implemented behavior.',
          'Confirm legacy stack-only dispatch, trigger, web, and MCP behavior still passes.',
          'Confirm AgentDefinition dispatch and trigger paths pass.',
          'Confirm migration tooling dry-run and apply coverage passes and includes non-destructive failure behavior.',
          'Inspect git diff for accidental changes outside Krate core/web/CLI/MCP/docs/test/process artifacts.',
          'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: array, legacyCompatibilityVerified: boolean, definitionCompatibilityVerified: boolean, migrationSafetyVerified: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(args.issueContext, null, 2),
          '',
          'IMPLEMENTATION RESULTS:',
          JSON.stringify(args.implementationResults ?? {}, null, 2),
          '',
          'QUALITY COMMANDS:',
          JSON.stringify(args.qualityCommands ?? [], null, 2),
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['issue-622', 'verification'] },
);

const reviewTask = defineTask(
  'issue-622.review',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Phase 7 - Review issue #622 implementation against spec',
    labels: ['issue-622', 'review', 'quality-gate'],
    agent: {
      name: 'krate-identity-reviewer',
      prompt: {
        role: 'senior Krate code reviewer',
        task: 'Review the final issue #622 changes against the issue, migration docs, and produced artifacts.',
        instructions: [
          'Compare the issue context directly to the produced tests and implementation.',
          'Verify no implementation behavior was silently narrowed from the issue scope.',
          'Verify legacy AgentStack workflows remain backward compatible.',
          'Verify AgentDefinition resolution is centralized and consistently used by dispatch, trigger, web, and MCP entry points.',
          'Verify prompt and skill precedence is documented by tests and does not drop legacy stack prompts.',
          'Verify migration tooling is dry-run by default, creates backup/reversible output, and cleans stack fields only after successful writes.',
          'Verify CRD/resource validation accepts agentDefinition alongside agentStack without making both required.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, finalSummary: string, residualRisks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(args.issueContext, null, 2),
          '',
          'REUSE AUDIT:',
          JSON.stringify(args.reuseAudit ?? {}, null, 2),
          '',
          'RUNTIME CALL PATHS:',
          JSON.stringify(args.runtimeTrace ?? {}, null, 2),
          '',
          'ACCEPTANCE TESTS:',
          JSON.stringify(args.acceptanceTests ?? {}, null, 2),
          '',
          'IMPLEMENTATION RESULTS:',
          JSON.stringify(args.implementationResults ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(args.qualityGate ?? {}, null, 2),
        ],
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  }),
  { kind: 'agent', title: 'Review final implementation', labels: ['issue-622', 'review'] },
);

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 622,
    title: inputs?.title,
    body: inputs?.issueBody,
    comments: inputs?.comments ?? [],
    labels: inputs?.labels ?? [],
    dependencyIssue: inputs?.dependencyIssue ?? 620,
    branch: inputs?.branch ?? 'staging',
    referenceDocs: inputs?.referenceDocs ?? [],
  };

  const reuseAudit = await ctx.task(reuseAuditTask, {
    issueContext,
    initialFindings: inputs?.initialFindings ?? {},
  }, { key: 'issue-622.reuse-audit' });

  const dependencyAndScope = await ctx.task(dependencyAndScopeTask, {
    issueContext,
    reuseAudit,
  }, { key: 'issue-622.dependency-and-scope' });

  if (dependencyAndScope?.blockers?.length) {
    await ctx.breakpoint({
      title: 'Dependency or scope blocker',
      question: 'Issue #622 has dependency or scope blockers. Review the dependency assessment before implementation continues?',
      context: {
        runId: ctx.runId,
        dependencyAndScope,
      },
    });
  }

  const runtimeTrace = await ctx.task(traceRuntimePathsTask, {
    issueContext,
    dependencyAndScope,
  }, { key: 'issue-622.runtime-trace' });

  const acceptanceTests = await ctx.task(authorAcceptanceTestsTask, {
    issueContext,
    runtimeTrace,
  }, { key: 'issue-622.acceptance-tests' });

  let coreImplementation = null;
  let surfaceImplementation = null;
  let qualityGate = null;
  let verificationFeedback = null;
  const maxImplementationAttempts = inputs?.maxImplementationAttempts ?? 2;

  for (let attempt = 1; attempt <= maxImplementationAttempts; attempt += 1) {
    coreImplementation = await ctx.task(implementCoreCompatibilityTask, {
      issueContext,
      dependencyAndScope,
      runtimeTrace,
      acceptanceTests,
      verificationFeedback,
    }, { key: `issue-622.core-implementation.${attempt}` });

    surfaceImplementation = await ctx.task(implementSurfacesTask, {
      issueContext,
      coreImplementation,
      acceptanceTests,
    }, { key: `issue-622.surface-implementation.${attempt}` });

    qualityGate = await ctx.task(verifyQualityGateTask, {
      issueContext,
      implementationResults: { coreImplementation, surfaceImplementation },
      qualityCommands: inputs?.qualityCommands ?? [],
    }, { key: `issue-622.quality-gate.${attempt}` });

    if (
      qualityGate?.passed &&
      qualityGate?.legacyCompatibilityVerified &&
      qualityGate?.definitionCompatibilityVerified &&
      qualityGate?.migrationSafetyVerified
    ) {
      break;
    }

    verificationFeedback = qualityGate;
  }

  if (
    !qualityGate?.passed ||
    !qualityGate?.legacyCompatibilityVerified ||
    !qualityGate?.definitionCompatibilityVerified ||
    !qualityGate?.migrationSafetyVerified
  ) {
    await ctx.breakpoint({
      title: 'Quality gate failed',
      question: 'Issue #622 quality gates did not pass within the configured attempts. Review failures before any further changes?',
      context: {
        runId: ctx.runId,
        qualityGate,
        coreImplementation,
        surfaceImplementation,
      },
    });
  }

  const review = await ctx.task(reviewTask, {
    issueContext,
    reuseAudit,
    runtimeTrace,
    acceptanceTests,
    implementationResults: { coreImplementation, surfaceImplementation },
    qualityGate,
  }, { key: 'issue-622.review' });

  if (!review?.approved || review?.blockingIssues?.length) {
    await ctx.breakpoint({
      title: 'Final review needs attention',
      question: 'Final review found blocking issues. Review before completing the run?',
      context: {
        runId: ctx.runId,
        review,
      },
    });
  }

  const changedFiles = [
    ...(coreImplementation?.changedFiles ?? []),
    ...(surfaceImplementation?.changedFiles ?? []),
  ].filter((file, index, all) => file && all.indexOf(file) === index);

  return {
    success: Boolean(
      qualityGate?.passed &&
      qualityGate?.legacyCompatibilityVerified &&
      qualityGate?.definitionCompatibilityVerified &&
      qualityGate?.migrationSafetyVerified &&
      review?.approved &&
      !(review?.blockingIssues?.length),
    ),
    phases: {
      reuseAudit,
      dependencyAndScope,
      acceptanceTests,
      coreImplementation,
      surfaceImplementation,
    },
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    changedFiles,
    qualityGate,
    review,
    metadata: {
      processId: 'repo/issue-622-agent-identity-migration-tooling',
      issueNumber: issueContext.issueNumber,
      plannedProcessEntry: '.a5c/processes/issue-622-agent-identity-migration-tooling.mjs#process',
      timestamp: ctx.now(),
    },
  };
}
