/**
 * @process repo/issue-590-agent-runtime-sandboxing
 * @description Implement issue #590: agent-runtime execution policy, process isolation, sandboxing, network policy, and secure executor defaults.
 * @inputs { issueNumber: number, title: string, issueBody: string, labels: string[], comments: array, relatedIssues: array, reuseAuditFindings: object, targetFiles: string[], qualityCommands: string[] }
 * @outputs { success: boolean, phases: string[], policyDesign: object, changedFiles: string[], qualityGate: object, review: object }
 *
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/test-driven-development
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/security/runtime-sandboxing
 * @process specializations/sdk-platform-development/runtime-execution
 *
 * Repo policy note: this process intentionally uses agent tasks rather than
 * shell tasks to respect docs/agent-reference/process-authoring.md for direct
 * Babysitter workflows in this repository.
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No .a5c/reuse-audit.json was present in this checkout.
 * - No .a5c/process-library/ directory was present; matching process patterns
 *   were found in .a5c/processes/issue-181-run-completed-idempotency.mjs and
 *   .a5c/processes/issue-485-sonnet-proxy-tool-translation.mjs.
 * - Existing execution surfaces are in packages/agent-runtime/src/execution/*,
 *   packages/agent-runtime/src/backgroundProcessRegistry.ts, and
 *   packages/agent-runtime/src/resources/*.
 * - Related duplicate shell/background invocation surfaces exist in
 *   packages/agent-core and packages/tula-platform; this issue should avoid
 *   source drift by keeping the canonical policy types/helpers in
 *   agent-runtime and only touching downstream packages if compile contracts
 *   require it.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const architectureAuditTask = defineTask(
  'issue-590.architecture-audit',
  async ({ issueContext, targetFiles, reuseAuditFindings }) => ({
    kind: 'agent',
    title: 'Audit existing execution and sandboxing surfaces',
    labels: ['issue-590', 'agent-runtime', 'security', 'phase:reuse-audit'],
    agent: {
      name: 'agent-runtime-security-auditor',
      prompt: {
        role: 'senior runtime security engineer',
        task: 'Audit the existing agent-runtime execution surfaces before implementation.',
        instructions: [
          'Do not edit files in this task.',
          'Read the issue context, comments, labels, and related issue notes as the source of truth.',
          'Render a section titled exactly "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" before any implementation recommendations.',
          'Use the provided reuseAuditFindings and verify whether matching policy, sandbox, environment, network, resource, Docker, SSH, Kubernetes, or background-process infrastructure already exists.',
          'Trace all affected call paths: ExecutionConfig types, ExecutionProviderImpl, LocalExecutor, DockerExecutor, SshExecutor, KubernetesExecutor, BackgroundProcessRegistry, ResourceManagerImpl, execution tests, and docs/agent-layer-gaps.md.',
          'Identify any public API compatibility constraints and downstream package references in agent-core or agent-platform.',
          'Return JSON: { reuseAuditSummary: string, affectedCallPaths: array, existingInfrastructure: array, missingInfrastructure: array, compatibilityConstraints: array, recommendedPhaseOrder: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'TARGET FILES:',
          JSON.stringify(targetFiles ?? [], null, 2),
          '',
          'REUSE AUDIT FINDINGS:',
          JSON.stringify(reuseAuditFindings ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Audit execution surfaces', labels: ['issue-590', 'security', 'research'] },
);

const policyDesignTask = defineTask(
  'issue-590.policy-design',
  async ({ issueContext, audit }) => ({
    kind: 'agent',
    title: 'Design shared execution policy contract',
    labels: ['issue-590', 'agent-runtime', 'security', 'phase:design'],
    agent: {
      name: 'execution-policy-architect',
      prompt: {
        role: 'principal TypeScript runtime architect',
        task: 'Design the shared execution policy model for issue #590 before code changes.',
        instructions: [
          'Do not edit files in this task.',
          'Design a concrete ExecutionPolicy model that can be wired through LocalExecutionConfig, DockerExecutionConfig, SshExecutionConfig, KubernetesExecutionConfig, and background process spawn options.',
          'Cover environment policy: default deny parent env, explicit allowlist/pass-through, explicit values, denylist/redaction, and opt-in legacy inherit behavior.',
          'Cover filesystem policy: cwd validation, allowed roots/mounts, read-only defaults where supported, path escape rejection, and Docker/Kubernetes mount translation.',
          'Cover network policy: none/disabled, Docker network mode, DNS values, explicit allow/block metadata, and clear fail-fast behavior where local enforcement is unsupported.',
          'Cover resource policy: CPU, memory, pids, timeout, output bytes, open-file/process count semantics, and how ResourceManager logical budgets relate to OS enforcement.',
          'Cover sandbox policy: local host-process limitations, Docker hardened defaults, Kubernetes securityContext expectations, and SSH host-key policy.',
          'Define secure defaults and explicit opt-in names for insecure legacy behavior. Existing tests that assert insecure behavior must be updated rather than preserved as defaults.',
          'Call out any decision that requires maintainer input. Keep breakpoints sparse by only flagging decisions that block implementation.',
          'Return JSON: { policyModel: object, secureDefaults: object, legacyOptIns: object, executorMapping: object, migrationNotes: array, blockingDecisions: array, testMatrix: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'ARCHITECTURE AUDIT:',
          JSON.stringify(audit ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Design policy contract', labels: ['issue-590', 'design'] },
);

const regressionTestsTask = defineTask(
  'issue-590.regression-tests',
  async ({ issueContext, audit, policyDesign, testTargets }) => ({
    kind: 'agent',
    title: 'Author sandboxing regression tests',
    labels: ['issue-590', 'agent-runtime', 'tdd', 'phase:red'],
    agent: {
      name: 'agent-runtime-security-test-author',
      prompt: {
        role: 'senior TypeScript security test engineer',
        task: 'Add focused failing regression tests for the issue #590 security invariants before implementation.',
        instructions: [
          'Follow TDD: add tests before changing production implementation.',
          'Use deterministic unit tests with mocked child_process.spawn and mocked Docker/SSH command construction; do not require a live Docker daemon, SSH host, Kubernetes cluster, or root privileges.',
          'Add or update tests under packages/agent-runtime/src/execution/__tests__ and background/resource tests as appropriate.',
          'Test secure environment defaults: parent secrets are not inherited unless an explicit legacy opt-in is set; allowed env vars and explicit env values are passed predictably.',
          'Test local policy validation: unsupported sandbox/network/resource requirements fail clearly instead of silently running unrestricted.',
          'Test Docker secure defaults: daemon/image preflight hooks are called or modeled, read-only/cap-drop/security-opt/user/resource/network/DNS args are emitted from policy, and insecure settings require explicit opt-in.',
          'Test SSH secure defaults: StrictHostKeyChecking is enabled by default with known_hosts/pinned host-key policy, and StrictHostKeyChecking=no appears only with explicit insecure opt-in.',
          'Test background process policy: env handling, cwd/root validation, output byte caps, timeout/resource hooks, and completion snapshots expose truncation where applicable.',
          'Run the narrow tests and confirm they fail for the expected missing-security reasons before implementation.',
          'Return JSON: { testFiles: string[], testNames: string[], redVerified: boolean, redCommands: array, failureMatchesIssue: boolean, outputSummary: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'ARCHITECTURE AUDIT:',
          JSON.stringify(audit ?? {}, null, 2),
          '',
          'POLICY DESIGN:',
          JSON.stringify(policyDesign ?? {}, null, 2),
          '',
          'TEST TARGETS:',
          JSON.stringify(testTargets ?? [], null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Author regression tests', labels: ['issue-590', 'tdd'] },
);

const implementPolicyTask = defineTask(
  'issue-590.implement-policy-core',
  async ({ issueContext, audit, policyDesign, regression, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Implement shared execution policy core',
    labels: ['issue-590', 'agent-runtime', 'implementation', 'phase:policy-core'],
    agent: {
      name: 'execution-policy-implementer',
      prompt: {
        role: 'senior TypeScript runtime maintainer',
        task: 'Implement the shared execution policy types, defaults, and validation helpers for issue #590.',
        instructions: [
          'Edit the repository directly.',
          'Keep implementation scoped to agent-runtime unless downstream compile contracts require minimal type adjustments.',
          'Add the shared policy model in the agent-runtime execution area, using existing TypeScript style and exports.',
          'Wire ExecutionConfig types to accept policy fields without breaking existing basic configs where safe defaults can be applied.',
          'Implement deterministic helpers for env resolution, cwd/root/path validation, network policy normalization, resource limit normalization, and legacy insecure opt-ins.',
          'Keep unsupported local host-process isolation honest: fail fast for requested guarantees the local executor cannot enforce, or require explicit unsafe/legacy policy where appropriate.',
          'Preserve unrelated worktree changes.',
          'Return JSON: { changedFiles: string[], summary: string, policyContracts: array, secureDefaultsImplemented: array, remainingExecutorWork: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'ARCHITECTURE AUDIT:',
          JSON.stringify(audit ?? {}, null, 2),
          '',
          'POLICY DESIGN:',
          JSON.stringify(policyDesign ?? {}, null, 2),
          '',
          'REGRESSION TESTS:',
          JSON.stringify(regression ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK FROM PRIOR ATTEMPT:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement policy core', labels: ['issue-590', 'implementation'] },
);

const implementExecutorsTask = defineTask(
  'issue-590.implement-executors',
  async ({ issueContext, audit, policyDesign, policyCore, verificationFeedback }) => ({
    kind: 'agent',
    title: 'Wire policy through executors and background processes',
    labels: ['issue-590', 'agent-runtime', 'implementation', 'phase:executors'],
    agent: {
      name: 'agent-runtime-executor-implementer',
      prompt: {
        role: 'senior runtime execution engineer',
        task: 'Wire the issue #590 policy core through Local, Docker, SSH, Kubernetes, provider, and background execution surfaces.',
        instructions: [
          'Edit the repository directly.',
          'LocalExecutor: stop implicit parent env inheritance, apply env/cwd/resource/output policy, and fail fast for requested namespace/chroot/seccomp/network guarantees that cannot be enforced by the current local implementation.',
          'DockerExecutor: add daemon/image preflight seams, secure docker run defaults, resource flags, read-only/cap/security/user/network/DNS policy arguments, mount validation, and explicit insecure opt-ins.',
          'SshExecutor: remove StrictHostKeyChecking=no default, add known_hosts/host-key policy, batch mode, retry/keepalive options where designed, env escaping, and explicit insecure opt-in coverage.',
          'KubernetesExecutor: map policy to manifest fields where structurally possible, including securityContext, resources, env, network-related annotations if designed, and clear unsupported-policy validation.',
          'ExecutionProviderImpl: preserve mode dispatch while forwarding the policy-bearing configs consistently.',
          'BackgroundProcessRegistry: accept policy options, apply env/cwd/resource/output retention semantics, and expose truncation/limit metadata without taking over broader lifecycle work reserved for issue #593.',
          'ResourceManagerImpl: integrate only the OS-resource policy/admission seams needed for this issue; do not expand into the full persistent queue/crash recovery scope of issue #585.',
          'Keep behavior deterministic and testable without live Docker, SSH, or Kubernetes dependencies.',
          'Return JSON: { changedFiles: string[], summary: string, executorCoverage: object, explicitUnsupportedCases: array, testsUpdated: array, risks: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'ARCHITECTURE AUDIT:',
          JSON.stringify(audit ?? {}, null, 2),
          '',
          'POLICY DESIGN:',
          JSON.stringify(policyDesign ?? {}, null, 2),
          '',
          'POLICY CORE IMPLEMENTATION:',
          JSON.stringify(policyCore ?? {}, null, 2),
          '',
          'VERIFICATION FEEDBACK FROM PRIOR ATTEMPT:',
          JSON.stringify(verificationFeedback ?? null, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Wire executors', labels: ['issue-590', 'implementation'] },
);

const docsMigrationTask = defineTask(
  'issue-590.docs-migration',
  async ({ issueContext, policyDesign, policyCore, executors }) => ({
    kind: 'agent',
    title: 'Document sandbox policy and migration behavior',
    labels: ['issue-590', 'agent-runtime', 'docs', 'phase:docs'],
    agent: {
      name: 'agent-runtime-docs-maintainer',
      prompt: {
        role: 'senior developer documentation engineer',
        task: 'Document issue #590 execution policy semantics and migration notes.',
        instructions: [
          'Edit documentation only where it directly explains agent-runtime execution policy behavior.',
          'Update docs/agent-layer-gaps.md only if the implemented work makes a specific listed gap stale or partially resolved.',
          'Document secure defaults, explicit insecure legacy opt-ins, unsupported local enforcement limitations, Docker/SSH/Kubernetes policy behavior, and testing assumptions.',
          'Do not add broad roadmap content unrelated to process isolation and sandboxing.',
          'Return JSON: { changedFiles: string[], summary: string, documentedDefaults: array, documentedLimitations: array }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'POLICY DESIGN:',
          JSON.stringify(policyDesign ?? {}, null, 2),
          '',
          'POLICY CORE:',
          JSON.stringify(policyCore ?? {}, null, 2),
          '',
          'EXECUTOR IMPLEMENTATION:',
          JSON.stringify(executors ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Document migration', labels: ['issue-590', 'docs'] },
);

const verifyQualityGateTask = defineTask(
  'issue-590.verify-quality-gate',
  async ({ issueContext, policyDesign, policyCore, executors, docs, qualityCommands }) => ({
    kind: 'agent',
    title: 'Verify sandboxing quality gates',
    labels: ['issue-590', 'agent-runtime', 'verification', 'phase:quality-gate'],
    agent: {
      name: 'agent-runtime-security-verifier',
      prompt: {
        role: 'senior runtime security verifier',
        task: 'Run and interpret the quality gates for the issue #590 implementation.',
        instructions: [
          'Run the listed commands from the repository root.',
          'Confirm the regression tests recorded a red phase before implementation and now pass.',
          'Confirm secure-default invariants: no implicit parent env, no default StrictHostKeyChecking=no, Docker hardening/resource args are present, unsupported local guarantees fail fast, background output/resource policies are covered, and insecure legacy behavior is explicit opt-in only.',
          'Inspect the final diff for accidental changes outside issue #590 scope and for unrelated worktree churn.',
          'Return JSON: { passed: boolean, commands: array, failures: array, changedFiles: string[], securityInvariants: object, redGreenVerified: boolean, notes: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'POLICY DESIGN:',
          JSON.stringify(policyDesign ?? {}, null, 2),
          '',
          'POLICY CORE:',
          JSON.stringify(policyCore ?? {}, null, 2),
          '',
          'EXECUTORS:',
          JSON.stringify(executors ?? {}, null, 2),
          '',
          'DOCS:',
          JSON.stringify(docs ?? {}, null, 2),
          '',
          'QUALITY COMMANDS:',
          JSON.stringify(qualityCommands ?? [], null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Verify quality gates', labels: ['issue-590', 'verification'] },
);

const reviewTask = defineTask(
  'issue-590.review',
  async ({ issueContext, audit, policyDesign, regression, policyCore, executors, docs, qualityGate }) => ({
    kind: 'agent',
    title: 'Review issue #590 security implementation',
    labels: ['issue-590', 'agent-runtime', 'review', 'phase:review'],
    agent: {
      name: 'agent-runtime-security-reviewer',
      prompt: {
        role: 'principal security-focused code reviewer',
        task: 'Review the final issue #590 changes against the issue and security invariants.',
        instructions: [
          'Compare the implementation directly against the issue body, triage comment, policy design, and tests.',
          'Prioritize security regressions, unsafe defaults, bypasses, misleading guarantees, missing tests, and broad unrelated changes.',
          'Verify local limitations are explicit and fail-fast rather than pretending to provide namespaces/chroot/seccomp where unsupported.',
          'Verify Docker, SSH, Kubernetes, background process, and ResourceManager changes are coherent and do not duplicate issue #585/#593 scope unnecessarily.',
          'Verify tests cover both secure defaults and explicit insecure opt-ins.',
          'Return JSON: { approved: boolean, blockingIssues: array, nonBlockingSuggestions: array, residualRisks: array, finalSummary: string }.',
          '',
          'ISSUE CONTEXT:',
          JSON.stringify(issueContext, null, 2),
          '',
          'ARCHITECTURE AUDIT:',
          JSON.stringify(audit ?? {}, null, 2),
          '',
          'POLICY DESIGN:',
          JSON.stringify(policyDesign ?? {}, null, 2),
          '',
          'REGRESSION TESTS:',
          JSON.stringify(regression ?? {}, null, 2),
          '',
          'POLICY CORE:',
          JSON.stringify(policyCore ?? {}, null, 2),
          '',
          'EXECUTORS:',
          JSON.stringify(executors ?? {}, null, 2),
          '',
          'DOCS:',
          JSON.stringify(docs ?? {}, null, 2),
          '',
          'QUALITY GATE:',
          JSON.stringify(qualityGate ?? {}, null, 2),
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review implementation', labels: ['issue-590', 'review'] },
);

export async function process(inputs, ctx) {
  const issueContext = {
    issueNumber: inputs?.issueNumber ?? 590,
    title: inputs?.title,
    labels: inputs?.labels ?? [],
    body: inputs?.issueBody,
    comments: inputs?.comments ?? [],
    relatedIssues: inputs?.relatedIssues ?? [],
  };
  const targetFiles = inputs?.targetFiles ?? [];
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm run test --workspace=@a5c-ai/agent-runtime',
    'npm run build --workspace=@a5c-ai/agent-runtime',
    'npm run verify:metadata',
  ];
  const maxVerificationAttempts = inputs?.maxVerificationAttempts ?? 2;

  const audit = await ctx.task(architectureAuditTask, {
    issueContext,
    targetFiles,
    reuseAuditFindings: inputs?.reuseAuditFindings ?? {},
  }, { key: 'issue-590.architecture-audit' });

  const policyDesign = await ctx.task(policyDesignTask, {
    issueContext,
    audit,
  }, { key: 'issue-590.policy-design' });

  if ((policyDesign?.blockingDecisions ?? []).length > 0) {
    await ctx.breakpoint({
      title: 'Execution policy decisions need maintainer input',
      question: 'The policy design found blocking security or compatibility decisions. Resolve them before implementation continues?',
      context: {
        runId: ctx.runId,
        blockingDecisions: policyDesign.blockingDecisions,
        policyDesign,
      },
    });
  }

  const regression = await ctx.task(regressionTestsTask, {
    issueContext,
    audit,
    policyDesign,
    testTargets: inputs?.testTargets ?? [],
  }, { key: 'issue-590.regression-tests' });

  let policyCore = null;
  let executors = null;
  let docs = null;
  let qualityGate = null;
  let verificationFeedback = null;

  for (let attempt = 1; attempt <= maxVerificationAttempts; attempt += 1) {
    policyCore = await ctx.task(implementPolicyTask, {
      issueContext,
      audit,
      policyDesign,
      regression,
      verificationFeedback,
    }, { key: `issue-590.policy-core.${attempt}` });

    executors = await ctx.task(implementExecutorsTask, {
      issueContext,
      audit,
      policyDesign,
      policyCore,
      verificationFeedback,
    }, { key: `issue-590.executors.${attempt}` });

    docs = await ctx.task(docsMigrationTask, {
      issueContext,
      policyDesign,
      policyCore,
      executors,
    }, { key: `issue-590.docs.${attempt}` });

    qualityGate = await ctx.task(verifyQualityGateTask, {
      issueContext,
      policyDesign,
      policyCore,
      executors,
      docs,
      qualityCommands,
    }, { key: `issue-590.quality-gate.${attempt}` });

    if (qualityGate?.passed && qualityGate?.redGreenVerified) {
      break;
    }

    verificationFeedback = qualityGate;
  }

  if (!qualityGate?.passed || !qualityGate?.redGreenVerified) {
    await ctx.breakpoint({
      title: 'Sandboxing quality gate failed',
      question: 'The issue #590 quality gate did not pass within the configured attempts. Review failures before further changes?',
      context: {
        runId: ctx.runId,
        qualityGate,
        policyCore,
        executors,
        docs,
      },
    });
  }

  const review = await ctx.task(reviewTask, {
    issueContext,
    audit,
    policyDesign,
    regression,
    policyCore,
    executors,
    docs,
    qualityGate,
  }, { key: 'issue-590.review' });

  return {
    success: Boolean(qualityGate?.passed && qualityGate?.redGreenVerified && review?.approved !== false),
    phases: [
      'reuse-and-architecture-audit',
      'policy-design',
      'regression-tests-red-phase',
      'policy-core-implementation',
      'executor-and-background-wiring',
      'docs-and-migration-notes',
      'quality-gate',
      'security-review',
    ],
    policyDesign,
    changedFiles: qualityGate?.changedFiles ?? [
      ...(policyCore?.changedFiles ?? []),
      ...(executors?.changedFiles ?? []),
      ...(docs?.changedFiles ?? []),
    ],
    qualityGate,
    review,
  };
}
