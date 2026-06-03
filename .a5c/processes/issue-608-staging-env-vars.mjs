/**
 * @process repo/issue-608-staging-env-vars
 * @description Plan and execute issue #608: configure staging env vars for assistant, Gitea, and Agent Mux without exposing secrets.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, stagingHost: string, chartPath: string, deployLiveStaging: boolean, requiredEnv: string[], verificationCommands: string[], smokeChecks: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], runtimeCallPaths: string[], verification: object, stagingVerification: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - methodologies/spec-kit-brownfield.js
 * - methodologies/rpikit/rpikit-plan.js
 * - methodologies/superpowers/verification-before-completion.js
 * - specializations/devops-sre-platform/agents/platform-engineer/AGENT.md
 * - specializations/devops-sre-platform/agents/kubernetes-expert/AGENT.md
 * - specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * - specializations/security-compliance/agents/secure-code-reviewer-agent/AGENT.md
 *
 * Repo policy note: direct babysitter processes in this repo should avoid
 * shell-task subtasks unless explicitly requested. This process therefore uses
 * agent tasks for command execution, implementation, and evidence capture.
 *
 * @skill verification-before-completion methodologies/superpowers/skills/verification-before-completion/SKILL.md
 * @agent process-architect specializations/meta/agents/process-architect/AGENT.md
 * @agent platform-engineer specializations/devops-sre-platform/agents/platform-engineer/AGENT.md
 * @agent kubernetes-expert specializations/devops-sre-platform/agents/kubernetes-expert/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent secure-code-reviewer-agent specializations/security-compliance/agents/secure-code-reviewer-agent/AGENT.md
 * @agent code-reviewer methodologies/superpowers/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 2;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 608;
  const stagingHost = inputs?.stagingHost ?? 'kradle-staging.a5c.ai';
  const deployLiveStaging = inputs?.deployLiveStaging === true;

  const issueContext = await ctx.task(readIssueContextTask, { issueNumber }, {
    key: 'issue-608.read-issue-context',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, { inputs, issueContext }, {
    key: 'issue-608.reuse-audit',
  });

  const processLibraryResearch = await ctx.task(researchProcessLibraryTask, { inputs, issueContext, reuseAudit }, {
    key: 'issue-608.process-library-research',
  });

  const runtimeTrace = await ctx.task(traceStagingEnvRuntimeTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
  }, {
    key: 'issue-608.runtime-trace',
  });

  const implementationPlan = await ctx.task(designStagingEnvPlanTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
    runtimeTrace,
  }, {
    key: 'issue-608.design-plan',
  });

  const testPlan = await ctx.task(planVerificationTask, {
    inputs,
    issueContext,
    runtimeTrace,
    implementationPlan,
  }, {
    key: 'issue-608.plan-verification',
  });

  let implementation = null;
  let verification = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt += 1) {
    implementation = await ctx.task(implementStagingEnvWiringTask, {
      inputs,
      issueContext,
      runtimeTrace,
      implementationPlan,
      testPlan,
      attempt,
      previousVerification: verification,
      previousReview: review,
    }, {
      key: `issue-608.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyDryRunTask, {
      inputs,
      issueContext,
      implementationPlan,
      testPlan,
      implementation,
      attempt,
    }, {
      key: `issue-608.dry-run-verification.${attempt}`,
    });

    review = await ctx.task(reviewSecretAndConfigSafetyTask, {
      inputs,
      issueContext,
      implementationPlan,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-608.secret-config-review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const dryRunGate = await ctx.task(finalDryRunGateTask, {
    inputs,
    issueContext,
    implementationPlan,
    implementation,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-608.final-dry-run-gate',
  });

  if (dryRunGate?.passed !== true) {
    return {
      success: false,
      phases: phaseList({ includeStaging: false, includeDelivery: false }),
      changedFiles: implementation?.changedFiles ?? [],
      runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
      issueContext,
      reuseAudit,
      processLibraryResearch,
      runtimeTrace,
      implementationPlan,
      testPlan,
      implementation,
      verification,
      review,
      attempts,
      dryRunGate,
    };
  }

  let stagingDeployment = { skipped: true, reason: 'deployLiveStaging input is false' };
  let stagingVerification = { skipped: true, reason: 'deployLiveStaging input is false' };

  if (deployLiveStaging) {
    await ctx.breakpoint({
      title: 'Approve Live Staging Configuration',
      question: `Dry-run gates passed. Approve configuring secrets/values and deploying to ${stagingHost}?`,
      options: [
        'Approve staging deployment',
        'Stop after dry-run artifacts',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-608', 'staging', 'secrets'],
      context: {
        runId: ctx.runId,
        issueNumber,
        dryRunGate,
        requiredEnv: inputs?.requiredEnv,
      },
    });

    stagingDeployment = await ctx.task(configureAndDeployStagingTask, {
      inputs,
      issueContext,
      implementationPlan,
      implementation,
      dryRunGate,
    }, {
      key: 'issue-608.configure-deploy-staging',
    });

    stagingVerification = await ctx.task(verifyStagingSmokeTask, {
      inputs,
      issueContext,
      implementationPlan,
      stagingDeployment,
    }, {
      key: 'issue-608.verify-staging-smoke',
    });
  }

  const delivery = await ctx.task(deliverIssue608Task, {
    inputs,
    issueContext,
    dryRunGate,
    stagingDeployment,
    stagingVerification,
  }, {
    key: 'issue-608.delivery',
  });

  const success = dryRunGate?.passed === true && (stagingVerification?.skipped === true || stagingVerification?.passed === true);

  return {
    success,
    phases: phaseList({ includeStaging: deployLiveStaging, includeDelivery: true }),
    changedFiles: dryRunGate?.changedFiles ?? implementation?.changedFiles ?? [],
    runtimeCallPaths: runtimeTrace?.runtimeCallPaths ?? [],
    issueContext,
    reuseAudit,
    processLibraryResearch,
    runtimeTrace,
    implementationPlan,
    testPlan,
    implementation,
    verification,
    review,
    attempts,
    dryRunGate,
    stagingDeployment,
    stagingVerification,
    delivery,
  };
}

function phaseList({ includeStaging, includeDelivery }) {
  return [
    'issue-context',
    'reuse-audit',
    'process-library-research',
    'runtime-trace',
    'implementation-plan',
    'test-plan',
    'implementation-loop',
    'dry-run-verification',
    'secret-and-config-review',
    'final-dry-run-gate',
    ...(includeStaging ? ['staging-deployment-approval', 'configure-and-deploy-staging', 'staging-smoke-verification'] : []),
    ...(includeDelivery ? ['delivery'] : []),
  ];
}

export const readIssueContextTask = defineTask('issue-608.read-issue-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #608 and GitHub context',
  labels: ['issue-608', 'github', 'context'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'senior Kradle infrastructure maintainer',
      task: 'Read the authoritative GitHub context for issue #608.',
      instructions: [
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments.`,
        `Also run gh pr view ${args.issueNumber} --json files,title,body,comments and record if it is not a PR.`,
        'Preserve the issue title, body, labels, comments, action items, acceptance criteria, risks, and related references exactly enough for later phases to compare against.',
        'Return JSON: { title, labels, rawIssue, comments, isPullRequest, acceptanceCriteria, requiredEnv, affectedWorkflows, risks, nonGoals, references }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-608.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for staging env var infrastructure',
  labels: ['issue-608', 'reuse-audit', 'env-vars'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'Kradle platform engineer',
      task: 'Run the repo-specific Phase 0 reuse audit before proposing new env var infrastructure.',
      instructions: [
        'Extract keyword nouns and verbs from issue #608: staging, env vars, ANTHROPIC_API_KEY, KRADLE_ASSISTANT_API_KEY, KRADLE_GITEA_HTTP_URL, KRADLE_GITEA_TOKEN, AGENT_MUX_URL, AGENT_GATEWAY_URL, Helm, chart, values, deployments, secrets.',
        'Search for matching chart values, deployment env blocks, Kubernetes secrets, API routes, SDK dependencies, docs, tests, and imports.',
        'Read at minimum packages/kradle/docs/gaps/staging-status.md, packages/kradle/docs/gaps/infrastructure-deps.md, packages/kradle/charts/values.yaml, packages/kradle/charts/templates/deployments.yaml, packages/kradle/charts/templates/gitea.yaml, packages/kradle/core/src/gitea-service.js, packages/kradle/core/src/assistant-runtime.js, packages/kradle/core/src/agent-mux-client.js, and packages/kradle/web/app/api/orgs/[org]/snapshot/route.js.',
        'Render a "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" section in the output.',
        'Do not read or print secret values. Record only secret names, key names, and whether references exist.',
        'Return JSON: { findingsMarkdown, matchingInfrastructure, missingInfrastructure, envVarMatrix, reusableTests, noNewInfrastructureNeeded, filesRead }.',
      ],
      context: {
        issueContext: args.issueContext,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-608.research-process-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research process-library methodology matches',
  labels: ['issue-608', 'process-library', 'methodology'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter process architect',
      task: 'Research active process-library references that should shape this staging configuration workflow.',
      instructions: [
        'Use the active process-library root from babysitter process-library:active --json.',
        'Search for brownfield, RPIKit planning, verification-before-completion, DevOps/SRE, Kubernetes, security/secret review, GitHub PR policy, and issue linking patterns.',
        'Prefer a flat phase list because the failure mode is known and the work is staging/chart wiring, not open-ended investigation.',
        'Respect the repo override: no kind:shell subtasks in the generated direct-request process unless explicitly asked.',
        'Return JSON: { selectedReferences, rejectedReferences, processShape, breakpointPolicy, qualityGatePolicy, rationale }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const traceStagingEnvRuntimeTask = defineTask('issue-608.trace-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trace staging env vars from Helm values to runtime behavior',
  labels: ['issue-608', 'runtime-trace', 'kradle', 'helm'],
  agent: {
    name: 'kubernetes-expert',
    prompt: {
      role: 'Kubernetes and Helm runtime tracer',
      task: 'Trace how each required env var reaches the running Kradle staging workflows.',
      instructions: [
        'Trace assistant flow from web deployment env to packages/kradle/core/src/assistant-runtime.js and the chat/playground routes that surface missing API key errors.',
        'Trace Gitea flow from Helm values/deployments/gitea service to KRADLE_GITEA_HTTP_URL, KRADLE_GITEA_TOKEN, createGiteaService(), repo tree/blob routes, webhook worker, and snapshot health.',
        'Trace Agent Mux flow from AGENT_MUX_URL or AGENT_GATEWAY_URL to snapshot health and dispatch execution paths. Include createAgentMuxClient and createAgentDispatchController call sites.',
        'Identify whether the chart currently supports secretKeyRef wiring for ANTHROPIC_API_KEY/KRADLE_ASSISTANT_API_KEY, KRADLE_GITEA_TOKEN, and Agent Mux URL values.',
        'Identify the minimal files on the live execution path. Do not propose unrelated UI or fallback changes.',
        'Return JSON: { runtimeCallPaths, currentChartSupport, missingChartSupport, affectedFiles, deploymentComponents, requiredSecretRefs, endpointHealthChecks, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        processLibraryResearch: args.processLibraryResearch,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designStagingEnvPlanTask = defineTask('issue-608.design-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design staging env var implementation plan',
  labels: ['issue-608', 'implementation-plan', 'staging'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'Kradle staging implementation lead',
      task: 'Design the implementation plan for issue #608.',
      instructions: [
        'Use the issue context and runtime trace as the source of truth.',
        'Plan the smallest complete fix that unblocks all three workflows: assistant, Gitea, and Agent Mux.',
        'Prefer chart values and secretKeyRef wiring over ad hoc manual pod edits so staging is reproducible. If the chart already supports a needed value, use it instead of adding another value.',
        'Do not hardcode secret values in source, manifests, command output, test fixtures, PR body, or issue comments. Test only secret reference names and key names.',
        'Keep degraded UI/error states intact. Do not add mocks, hidden fallbacks, or success masking.',
        'Include a live-staging deployment step only after dry-run/render/test gates pass and after the explicit staging breakpoint.',
        'Return JSON: { summary, phases, tasks, plannedFiles, nonGoals, rolloutPlan, rollbackPlan, stagingSecretPlan, openQuestions, acceptanceCriteria, qualityGates }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        processLibraryResearch: args.processLibraryResearch,
        runtimeTrace: args.runtimeTrace,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const planVerificationTask = defineTask('issue-608.plan-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan tests, render checks, and staging smoke checks',
  labels: ['issue-608', 'verification-plan', 'quality-gates'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'test strategy architect for Kubernetes chart and staging workflows',
      task: 'Create a verification plan before implementation.',
      instructions: [
        'Specify test-first assertions for chart value/schema additions, deployment env entries, secretKeyRef usage, and default behavior.',
        'Include chart rendering checks for configured and default modes. Ensure defaults do not require secret values and configured mode renders the expected env names.',
        'Include existing package and focused tests such as packages/kradle/core/tests/deployment.test.js and packages/kradle/core/scripts/validate-package.mjs where applicable.',
        'Include a secret exposure scan of source diff, rendered manifests, logs, PR body, and issue comment.',
        'Include staging smoke checks for health dashboard/snapshot, assistant real model call, Gitea-backed code browser/clone data, and Agent Mux dispatch producing job/session/transcript evidence.',
        'Return JSON: { preImplementationTests, dryRunCommands, secretExposureChecks, stagingSmokeChecks, passCriteria, failureTriage }.',
      ],
      context: {
        issueContext: args.issueContext,
        runtimeTrace: args.runtimeTrace,
        implementationPlan: args.implementationPlan,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementStagingEnvWiringTask = defineTask('issue-608.implement-wiring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement reproducible staging env var wiring',
  labels: ['issue-608', 'implementation', 'helm', 'secrets'],
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'Kradle platform engineer',
      task: 'Implement the planned chart/configuration changes for issue #608.',
      instructions: [
        'Before editing, re-read the planned files and current diff. Preserve unrelated local changes.',
        'Add or reuse Helm values for assistant API key secret references, Gitea HTTP URL/token references, and Agent Mux gateway URL in the deployment components that actually need them.',
        'Use Kubernetes secretKeyRef or existing secret values where appropriate. Do not commit plaintext secret values.',
        'Update focused tests/docs only where needed to keep chart values, deployment rendering, and staging runbooks aligned.',
        'Do not change product behavior to hide missing-service states, add mocks, or make health checks fake green.',
        'Record every changed file and why it is on the runtime path.',
        'Return JSON: { changedFiles, implementationSummary, diffSummary, secretHandling, assumptions, followUpNeeded }.',
      ],
      context: {
        issueContext: args.issueContext,
        runtimeTrace: args.runtimeTrace,
        implementationPlan: args.implementationPlan,
        testPlan: args.testPlan,
        attempt: args.attempt,
        previousVerification: args.previousVerification,
        previousReview: args.previousReview,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyDryRunTask = defineTask('issue-608.verify-dry-run', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify chart render, tests, and no-secret dry run',
  labels: ['issue-608', 'verification', 'dry-run'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'verification engineer',
      task: 'Run and interpret the dry-run quality gates for issue #608.',
      instructions: [
        'Run the focused commands from the verification plan and inputs. Capture exact command names, exit statuses, and high-signal output summaries.',
        'At minimum, verify chart render/default behavior, configured render behavior, packages/kradle/core deployment/package checks where applicable, and git diff hygiene.',
        'Check rendered manifests for env var names and secretKeyRef references without printing secret values.',
        'Fail if any required workflow is only partially configured, if a secret value appears in source/rendered output/logs, or if health/degraded behavior is masked.',
        'Return JSON: { passed, commands, renderedChecks, requiredEnvCoverage, secretExposureFindings, failures, changedFiles }.',
      ],
      context: {
        issueContext: args.issueContext,
        implementationPlan: args.implementationPlan,
        testPlan: args.testPlan,
        implementation: args.implementation,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewSecretAndConfigSafetyTask = defineTask('issue-608.review-secret-config-safety', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review secret handling and configuration safety',
  labels: ['issue-608', 'review', 'security', 'secrets'],
  agent: {
    name: 'secure-code-reviewer-agent',
    prompt: {
      role: 'security-focused code reviewer',
      task: 'Review the implementation for secret safety, staging correctness, and behavioral regressions.',
      instructions: [
        'Lead with findings ordered by severity and cite file paths/line numbers.',
        'Specifically inspect for plaintext secrets, optional secret refs that silently mask misconfiguration, wrong namespaces/service DNS, missing token wiring, over-broad RBAC, and hidden fallback behavior.',
        'Verify all three issue workflows are addressed: assistant API key, Gitea HTTP URL/token, and Agent Mux URL/gateway.',
        'Return JSON: { approved, findings, blockingFindings, nonBlockingFindings, riskAssessment, requiredFixes }.',
      ],
      context: {
        issueContext: args.issueContext,
        implementationPlan: args.implementationPlan,
        implementation: args.implementation,
        verification: args.verification,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalDryRunGateTask = defineTask('issue-608.final-dry-run-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final dry-run acceptance gate',
  labels: ['issue-608', 'quality-gate', 'acceptance'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'final acceptance reviewer',
      task: 'Decide whether the dry-run implementation is ready for staging approval.',
      instructions: [
        'Compare the issue context directly against the implementation, verification, and security review outputs.',
        'Pass only if all required env vars are covered, tests/render checks passed, secrets are never exposed, and no mocks/fallback masking were added.',
        'If failed, give concrete remediation tasks for the next implementation attempt.',
        'Return JSON: { passed, changedFiles, acceptanceChecklist, failures, remediation }.',
      ],
      context: {
        issueContext: args.issueContext,
        implementationPlan: args.implementationPlan,
        implementation: args.implementation,
        verification: args.verification,
        review: args.review,
        attempts: args.attempts,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const configureAndDeployStagingTask = defineTask('issue-608.configure-deploy-staging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure secrets/values and deploy staging',
  labels: ['issue-608', 'staging', 'deployment', 'secrets'],
  agent: {
    name: 'kubernetes-expert',
    prompt: {
      role: 'staging Kubernetes release engineer',
      task: 'Configure staging secrets/values and deploy the verified chart changes.',
      instructions: [
        'Use only approved secret-management mechanisms for ANTHROPIC_API_KEY or KRADLE_ASSISTANT_API_KEY, KRADLE_GITEA_TOKEN, and any required non-secret endpoint values.',
        'Do not echo or log secret values. Verify presence by key names, Kubernetes object metadata, and redacted command output only.',
        'Confirm or create the staging Gitea endpoint and Agent Mux gateway endpoint before rolling out the web/API/controller workloads.',
        'Apply the chart/values change to staging using the repository-standard deployment path. Capture rollout status and redacted evidence.',
        'Return JSON: { deployed, release, namespace, redactedSecretRefs, valuesApplied, rolloutStatus, rollbackCommand, failures }.',
      ],
      context: {
        issueContext: args.issueContext,
        implementationPlan: args.implementationPlan,
        implementation: args.implementation,
        dryRunGate: args.dryRunGate,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyStagingSmokeTask = defineTask('issue-608.verify-staging-smoke', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify staging health and product smoke checks',
  labels: ['issue-608', 'staging', 'smoke-test'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'staging smoke-test engineer',
      task: 'Verify issue #608 acceptance criteria against live staging.',
      instructions: [
        'Check the staging health dashboard or org snapshot API: Kubernetes, Gitea, and Agent Mux must be healthy, not merely configured.',
        'Verify assistant chat/playground can make a real model call and cost/token usage can be observed without exposing the API key.',
        'Verify repository code browser/clone URLs use real Gitea data rather than placeholders/templates.',
        'Verify dispatch creates a real Agent Mux-backed execution path with job/session/transcript evidence.',
        'Record exact redacted evidence and URLs. Do not include secrets.',
        'Return JSON: { passed, checks, failures, redactedEvidence, residualRisks }.',
      ],
      context: {
        issueContext: args.issueContext,
        implementationPlan: args.implementationPlan,
        stagingDeployment: args.stagingDeployment,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverIssue608Task = defineTask('issue-608.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deliver PR and issue update for issue #608',
  labels: ['issue-608', 'github', 'delivery'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'GitHub delivery coordinator',
      task: 'Prepare final delivery for issue #608.',
      instructions: [
        'Ensure the branch is based on staging and only relevant files are committed.',
        'Open a PR that links to #608 and summarizes phases, implementation tasks, dry-run gates, staging approval/deployment status, and smoke results.',
        'Post an issue comment on #608 with the same summary and PR link.',
        'Do not include secret values in the PR body, commit message, logs, or issue comment.',
        'Return JSON: { branch, commit, pullRequestUrl, issueCommentUrl, summary, warnings }.',
      ],
      context: {
        inputs: args.inputs,
        issueContext: args.issueContext,
        dryRunGate: args.dryRunGate,
        stagingDeployment: args.stagingDeployment,
        stagingVerification: args.stagingVerification,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
