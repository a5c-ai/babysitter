/**
 * @process repo/issue-627-jitsi-agent-meeting-participation
 * @description Implement issue #627: Jitsi-aware agent dispatch, job sidecar, in-meeting MCP tools, auto-join, and web UI surfaces.
 * @inputs { issueNumber: number, branchName: string, baseBranch: string, targetFiles: string[], referenceDocs: string[], dependencyIssues: number[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], qualityGates: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - library/methodologies/spec-kit-brownfield.js
 * - library/methodologies/atdd-tdd/atdd-tdd.js
 * - library/methodologies/superpowers/verification-before-completion.js
 * - library/specializations/cli-mcp-development/mcp-tool-implementation.js
 * - library/specializations/devops-sre-platform/kubernetes-setup.js
 * - library/specializations/security-compliance/secrets-management.js
 * - library/specializations/web-development/nextjs-fullstack-app.js
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - No .a5c/process-library directory exists in this checkout. Matching process guidance lives under library/methodologies and library/specializations.
 * - Existing Jitsi product specs are docs-only: packages/krate/docs/jitsi/03-crds-and-controllers.md, 06-agent-meeting-participation.md, and 07-agent-meeting-runtime.md.
 * - Existing runtime dispatch path is packages/krate/core/src/agent-dispatch-controller.js -> createManualDispatch() -> agentMuxClient.createAgentJob().
 * - Existing job manifest generation is packages/krate/core/src/agent-mux-client.js#createAgentJob(), currently one agent container plus optional workspace PVC only.
 * - Existing web dispatch route and component are packages/krate/web/app/api/orgs/[org]/agents/dispatch/route.js and packages/krate/web/app/components/agent/dispatch-button.jsx; meetingRef is not accepted or forwarded.
 * - Existing resource model lacks Jitsi* kinds and AgentStack meeting capability fields in packages/krate/core/src/resource-model.js and packages/krate/charts/crds/agent-resources.yaml.
 * - Existing tests to extend: packages/krate/core/tests/agent-dispatch-controller.test.js, agent-mux-client.test.js, agent-stack-controller.test.js, packages/krate/web/tests/api-integration.test.js, component-structure.test.js, resource-contract.test.js.
 * - Security constraint from issue triage: raw Jitsi JWT must not be persisted in CRD status, comments, UI, or logs; prefer runtime-only secret/env handling with redacted persisted meeting context.
 *
 * Repo policy note: this repository asks direct babysitter:call processes to avoid
 * shell-task subtasks unless explicitly requested. This process uses agent tasks
 * for implementation, command execution, and evidence capture.
 *
 * @skill atdd-tdd library/methodologies/atdd-tdd/atdd-tdd.js
 * @skill verification-before-completion library/methodologies/superpowers/verification-before-completion.js
 * @skill secrets-management library/specializations/security-compliance/secrets-management.js
 * @skill mcp-tool-implementation library/specializations/cli-mcp-development/mcp-tool-implementation.js
 * @agent process-architect library/specializations/meta/agents/process-architect/AGENT.md
 * @agent test-strategy-architect library/specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent kubernetes-expert library/specializations/devops-sre-platform/agents/kubernetes-expert/AGENT.md
 * @agent mcp-protocol-expert library/specializations/cli-mcp-development/agents/mcp-protocol-expert/AGENT.md
 * @agent nextjs-developer library/specializations/web-development/agents/nextjs-developer/AGENT.md
 * @agent security-review-agent library/specializations/sdk-platform-development/agents/security-review-agent/AGENT.md
 * @agent code-reviewer library/specializations/web-development/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_FIX_ATTEMPTS = 2;

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 627;
  const branchName = inputs?.branchName ?? 'agent/issue-627-jitsi-agent-meeting-participation';
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const dependencyIssues = inputs?.dependencyIssues ?? [624, 620];

  const issueContext = await ctx.task(readIssueAndDependencyContextTask, {
    issueNumber,
    dependencyIssues,
  }, {
    key: 'issue-627.read-issue-and-dependencies',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueContext,
  }, {
    key: 'issue-627.reuse-audit',
  });

  const processLibraryResearch = await ctx.task(researchProcessLibraryTask, {
    inputs,
    issueContext,
    reuseAudit,
  }, {
    key: 'issue-627.process-library-research',
  });

  const architecture = await ctx.task(designIntegrationContractTask, {
    inputs,
    issueContext,
    reuseAudit,
    processLibraryResearch,
  }, {
    key: 'issue-627.integration-contract',
  });

  if (architecture?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #627 Jitsi Contract Decision',
      question: architecture.question || 'The Jitsi/provider or identity dependency contract is ambiguous. Choose whether to proceed against stable stubs or pause for dependency completion.',
      options: [
        'Proceed using stable interfaces and guarded fallbacks',
        'Pause until dependency issue contracts are available',
      ],
      expert: 'owner',
      tags: ['approval-gate', 'issue-627', 'jitsi', 'dependencies'],
      context: {
        runId: ctx.runId,
        issueNumber,
        dependencyIssues,
        architecture,
      },
    });
  }

  const acceptanceTests = await ctx.task(authorAcceptanceTestsTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
  }, {
    key: 'issue-627.acceptance-tests',
  });

  const schemaAndControllers = await ctx.task(implementSchemaAndControllerContractsTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
    acceptanceTests,
  }, {
    key: 'issue-627.schema-and-controller-contracts',
  });

  const dispatchRuntime = await ctx.task(implementDispatchRuntimeTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
    acceptanceTests,
    schemaAndControllers,
  }, {
    key: 'issue-627.dispatch-runtime',
  });

  const sidecarAndMcp = await ctx.task(implementSidecarAndMcpTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
    acceptanceTests,
    schemaAndControllers,
    dispatchRuntime,
  }, {
    key: 'issue-627.sidecar-and-mcp',
  });

  const webAndAutoDispatch = await ctx.task(implementWebAndAutoDispatchTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
    acceptanceTests,
    schemaAndControllers,
    dispatchRuntime,
    sidecarAndMcp,
  }, {
    key: 'issue-627.web-and-auto-dispatch',
  });

  let verification = null;
  let securityGate = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS; attempt += 1) {
    securityGate = await ctx.task(runSecurityQualityGateTask, {
      inputs,
      issueContext,
      architecture,
      acceptanceTests,
      schemaAndControllers,
      dispatchRuntime,
      sidecarAndMcp,
      webAndAutoDispatch,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-627.security-quality-gate.${attempt}`,
    });

    verification = await ctx.task(runRegressionVerificationTask, {
      inputs,
      issueContext,
      architecture,
      acceptanceTests,
      securityGate,
      attempt,
    }, {
      key: `issue-627.regression-verification.${attempt}`,
    });

    review = await ctx.task(reviewImplementationTask, {
      inputs,
      issueContext,
      architecture,
      acceptanceTests,
      securityGate,
      verification,
      attempt,
    }, {
      key: `issue-627.implementation-review.${attempt}`,
    });

    attempts.push({ attempt, securityGate, verification, review });

    if (securityGate?.passed === true && verification?.passed === true && review?.approved === true) {
      break;
    }

    if (attempt < MAX_FIX_ATTEMPTS) {
      await ctx.task(remediateQualityGateFailuresTask, {
        inputs,
        issueContext,
        architecture,
        acceptanceTests,
        securityGate,
        verification,
        review,
        attempt,
      }, {
        key: `issue-627.remediate-quality-gates.${attempt}`,
      });
    }
  }

  const finalGate = await ctx.task(finalAcceptanceGateTask, {
    inputs,
    issueContext,
    reuseAudit,
    architecture,
    acceptanceTests,
    schemaAndControllers,
    dispatchRuntime,
    sidecarAndMcp,
    webAndAutoDispatch,
    securityGate,
    verification,
    review,
    attempts,
  }, {
    key: 'issue-627.final-acceptance',
  });

  if (finalGate?.passed !== true) {
    await ctx.breakpoint({
      title: 'Issue #627 Final Quality Gate Blocked',
      question: 'The implementation did not satisfy the final acceptance gate. Stop and report the recorded failures, or approve one targeted follow-up attempt?',
      options: [
        'Stop and report blocked quality gate',
        'Approve one targeted follow-up attempt',
      ],
      expert: 'owner',
      tags: ['quality-gate', 'issue-627', 'jitsi'],
      context: {
        runId: ctx.runId,
        issueNumber,
        attempts,
        finalGate,
      },
    });

    return {
      success: false,
      phases: [
        'issue-context',
        'reuse-audit',
        'process-library-research',
        'integration-contract',
        'acceptance-tests',
        'schema-and-controller-contracts',
        'dispatch-runtime',
        'sidecar-and-mcp',
        'web-and-auto-dispatch',
        'security-quality-gate',
        'regression-verification',
        'implementation-review',
        'final-acceptance',
      ],
      changedFiles: finalGate?.changedFiles ?? [],
      qualityGates: { securityGate, verification, finalGate },
      review,
      attempts,
    };
  }

  const delivery = await ctx.task(deliverIssue627Task, {
    issueNumber,
    branchName,
    baseBranch,
    finalGate,
    securityGate,
    verification,
    review,
  }, {
    key: 'issue-627.delivery',
  });

  return {
    success: true,
    phases: [
      'issue-context',
      'reuse-audit',
      'process-library-research',
      'integration-contract',
      'acceptance-tests',
      'schema-and-controller-contracts',
      'dispatch-runtime',
      'sidecar-and-mcp',
      'web-and-auto-dispatch',
      'security-quality-gate',
      'regression-verification',
      'implementation-review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? [],
    qualityGates: { securityGate, verification, finalGate },
    review,
    attempts,
    delivery,
  };
}

export const readIssueAndDependencyContextTask = defineTask('issue-627.read-issue-and-dependencies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #627 and dependency contracts',
  labels: ['issue-627', 'github', 'context', 'dependencies'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'senior Krate feature planner',
      task: 'Read the authoritative GitHub context for issue #627 and its dependency issues.',
      instructions: [
        `Run gh issue view ${args.issueNumber} --json title,body,labels,comments.`,
        `Also try gh pr view ${args.issueNumber} --json files,title,body,comments and record whether #${args.issueNumber} is not a PR.`,
        `Read dependency issues ${JSON.stringify(args.dependencyIssues)} with gh issue view for title, body, labels, comments, and current state.`,
        'Extract scope, acceptance criteria, dependencies, risks, non-goals, and any explicit implementation order.',
        'Preserve the triage comment guidance, especially dependency order and JWT secret exposure concerns.',
        'Return JSON: { title, labels, rawIssue, comments, isPullRequest, dependencies, acceptanceCriteria, risks, nonGoals, recommendedOrder, unresolvedQuestions }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-627.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 0 reuse audit for Jitsi meeting participation',
  labels: ['issue-627', 'reuse-audit', 'research'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'brownfield codebase researcher',
      task: 'Perform the required babysitter:plan reuse audit before proposing infrastructure or new surfaces.',
      instructions: [
        'Extract keyword nouns and verbs from issue #627: jitsi, meetingRef, meetingContext, AgentStack, AgentDispatchRun, sidecar, MCP tools, JWT, socket, autoJoin, dispatch form, participant list.',
        'Search for matching migrations, API routes, env vars, SDK dependencies, controllers, CRDs, imports, tests, and UI components.',
        'Check whether .a5c/reuse-audit.json exists and follow it if present.',
        'Render a section named exactly "Reuse-audit findings (REVIEW BEFORE PROCEEDING)" in your output.',
        'Use ripgrep/file reads. Do not edit files in this task.',
        'Return JSON: { keywords, matchingFiles, existingInfrastructure, missingInfrastructure, reusablePatterns, risks, findingsMarkdown }.',
      ],
      context: {
        issueContext: args.issueContext,
        seedTargetFiles: args.inputs?.targetFiles,
        referenceDocs: args.inputs?.referenceDocs,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const researchProcessLibraryTask = defineTask('issue-627.process-library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research matching process-library methodology',
  labels: ['issue-627', 'process-library', 'research'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'Babysitter methodology researcher',
      task: 'Find the process and specialization patterns that should guide this implementation.',
      instructions: [
        'Look for .a5c/process-library first. If it does not exist, record that and use library/methodologies and library/specializations as the available process library.',
        'Read docs/agent-reference/process-authoring.md and apply the repo-specific override: no kind: shell subtasks for direct user-request processes.',
        'Prioritize spec-kit brownfield, ATDD/TDD, verification-before-completion, MCP tool implementation, Kubernetes job/sidecar patterns, secrets management, and Next.js API/UI patterns.',
        'Return JSON: { processLibraryStatus, references, applicablePatterns, taskShape, breakpointPolicy, qualityGatePattern, antiPatterns }.',
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

export const designIntegrationContractTask = defineTask('issue-627.integration-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Jitsi dispatch integration contract',
  labels: ['issue-627', 'architecture', 'jitsi', 'contract'],
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'senior Krate API and controller architect',
      task: 'Design the concrete implementation contract for Jitsi-aware agent meeting participation.',
      instructions: [
        'Read the reference docs and current source files before deciding file ownership.',
        'Resolve the #624/#620 dependency boundary: use existing Jitsi CRD/controller and identity fields if present; otherwise add guarded stable interfaces without duplicating future dependency work.',
        'Define AgentStack or AgentDefinition meeting capability fields based on current branch reality and dependency issue status.',
        'Define AgentDispatchRun meetingRef and persisted meetingContext fields, explicitly separating non-secret persisted fields from runtime-only JWT material.',
        'Define how dispatch validates a meeting is active, generates or requests a participant JWT, and passes secret material to job creation without leaking it to status/UI/logs.',
        'Define agent-mux createAgentJob inputs for sidecar image, env vars, shared emptyDir socket volume, and main-container socket env.',
        'Define the eight in-meeting MCP tools and role/capability enforcement matrix.',
        'Define auto-dispatch from Jitsi meeting start templates with agentConfig.autoJoin.',
        'Define web UI/API behavior: meeting field only for Jitsi-capable stacks, run detail meeting link, participant list agent run links.',
        'Set needsMaintainerDecision true only if dependency contracts make a safe implementation impossible without owner choice.',
        'Return JSON: { contract, dependencyStrategy, changedFiles, dataModel, secretHandling, mcpToolMatrix, uiContract, testPlan, risks, needsMaintainerDecision, question }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        processLibraryResearch: args.processLibraryResearch,
        targetFiles: args.inputs?.targetFiles,
        referenceDocs: args.inputs?.referenceDocs,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const authorAcceptanceTestsTask = defineTask('issue-627.acceptance-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing acceptance and regression tests',
  labels: ['issue-627', 'tests', 'atdd', 'tdd'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'senior Krate test engineer',
      task: 'Add focused failing tests that define issue #627 behavior before implementation.',
      instructions: [
        'Edit tests only in this task. Preserve unrelated local changes.',
        'Add or extend core tests for AgentStack Jitsi validation, manual dispatch with meetingRef, inactive/non-capable meeting rejection, redacted meeting context, and no-meeting backward compatibility.',
        'Add or extend agent-mux tests for sidecar container, JITSI_* env vars, AGENT_SOCKET_PATH, main-container socket env, shared emptyDir volume, workspace volume coexistence, and no sidecar when meetingContext is absent.',
        'Add or extend MCP tests for all eight tools and negative role/capability cases.',
        'Add or extend web tests for dispatch API meetingRef forwarding, DispatchButton meeting field visibility for capable stacks, run detail meeting link, and participant run links.',
        'Add a security regression test or static assertion proving raw JWT is not persisted in AgentDispatchRun status, comments, UI output, or serialized run payloads.',
        'Run focused tests where practical and record RED evidence. Tests should fail on current code for the new behavior.',
        'Return JSON: { changedFiles, redEvidence, testCases, expectedFailures, coverageMap, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architecture: args.architecture,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSchemaAndControllerContractsTask = defineTask('issue-627.schema-and-controller-contracts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement CRD/resource schema and controller contracts',
  labels: ['issue-627', 'krate-core', 'crd', 'schema'],
  agent: {
    name: 'backend-developer',
    prompt: {
      role: 'senior Krate core engineer',
      task: 'Implement the schema and controller contract layer for Jitsi-capable agent stacks and meetings.',
      instructions: [
        'Implement only the source changes needed for this phase and keep scope aligned to the architecture contract.',
        'Update resource-model definitions and kind sets for Jitsi resources only if missing from dependency work on the branch.',
        'Update chart CRDs for AgentStack meeting fields and any Jitsi resources that are missing but required by this issue.',
        'Extend AgentStack validation/reconciliation for jitsiCapability, jitsiMeetingProviderRef, role, capability modes, and valid Jitsi MCP tool names.',
        'Keep default behavior unchanged for stacks without jitsiCapability.',
        'Do not persist raw JWT values in status fields or UI-facing run data.',
        'Run relevant tests or record why they are deferred to the aggregate verification task.',
        'Return JSON: { changedFiles, implementedContracts, dependencyFallbacks, testsRun, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architecture: args.architecture,
        acceptanceTests: args.acceptanceTests,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementDispatchRuntimeTask = defineTask('issue-627.dispatch-runtime', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement meeting-aware dispatch runtime',
  labels: ['issue-627', 'krate-core', 'dispatch', 'runtime'],
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'senior Krate dispatch controller engineer',
      task: 'Implement meetingRef handling in the agent dispatch runtime.',
      instructions: [
        'Extend createManualDispatch and API/SDK dispatch surfaces to accept meetingRef while preserving existing callers.',
        'Validate meetingRef only when supplied: stack must be Jitsi-capable, provider must resolve, meeting must be active, and role/capability config must be valid.',
        'Create AgentDispatchRun fields for meetingRef and redacted/non-secret meetingContext.',
        'Generate/request participant JWT using the Jitsi meeting controller contract, but keep raw JWT runtime-only. If Kubernetes Secret projection is needed, model it explicitly and test it.',
        'Pass meeting runtime context to agentMuxClient.createAgentJob with enough data for JITSI_ROOM_URL, JITSI_ROOM_ID, JITSI_PARTICIPANT_NAME, JITSI_AUDIO_MODE, JITSI_CHAT_MODE, AGENT_SOCKET_PATH, and JITSI_JWT secret reference/value handling.',
        'Ensure permission review, approval-gated dispatch, memory snapshots, workspace provisioning, lifecycle events, and no-meeting dispatch behavior continue to work.',
        'Return JSON: { changedFiles, dispatchBehavior, secretHandling, testsRun, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        architecture: args.architecture,
        acceptanceTests: args.acceptanceTests,
        schemaAndControllers: args.schemaAndControllers,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementSidecarAndMcpTask = defineTask('issue-627.sidecar-and-mcp', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement sidecar job manifest and in-meeting MCP tools',
  labels: ['issue-627', 'agent-mux', 'mcp', 'kubernetes'],
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'senior Agent Mux and MCP runtime engineer',
      task: 'Implement the Kubernetes sidecar manifest changes and the Jitsi in-meeting MCP tool surface.',
      instructions: [
        'Update createAgentJob to add a jitsi-agent-sidecar only when meeting runtime context is present.',
        'Add the required JITSI_* env vars, AGENT_SOCKET_PATH, main agent socket env, shared emptyDir socket volume, and sidecar resource requests/limits.',
        'Preserve existing workspace PVC volume/mount behavior and existing transport env vars.',
        'Implement the eight MCP tools: send_chat_message, get_meeting_transcript, get_participant_list, raise_hand, share_screen, invite_to_meeting, start_recording, react.',
        'Gate each tool by role/capability from jitsiConfig/meetingContext; add negative behavior for observer/read-only/no-screenshare modes.',
        'Use existing MCP server/tool patterns where present. Avoid inventing a parallel transport if the repo already has a local MCP surface.',
        'Return JSON: { changedFiles, sidecarManifestContract, mcpTools, permissionMatrix, testsRun, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        architecture: args.architecture,
        acceptanceTests: args.acceptanceTests,
        dispatchRuntime: args.dispatchRuntime,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementWebAndAutoDispatchTask = defineTask('issue-627.web-and-auto-dispatch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement web UI and auto-dispatch surfaces',
  labels: ['issue-627', 'krate-web', 'auto-dispatch', 'ui'],
  agent: {
    name: 'nextjs-developer',
    prompt: {
      role: 'senior Krate web console engineer',
      task: 'Wire Jitsi-capable dispatch and meeting participant UI surfaces.',
      instructions: [
        'Update the web dispatch API route to accept and forward meetingRef while preserving existing stackRef/agentStack behavior.',
        'Update DispatchButton or surrounding page data flow to show a Meeting field only for Jitsi-capable stacks and submit meetingRef.',
        'Update run detail to show a meeting link when meetingRef is present without exposing raw JWT or other secret values.',
        'Update meeting participant list UI or data projection to show linked agent dispatch run references when available.',
        'Implement auto-dispatch from meeting start templates with agentConfig.autoJoin by reusing the dispatch controller rather than duplicating run creation.',
        'Keep UI styling consistent with existing Krate operational UI; do not add marketing-style layouts.',
        'Return JSON: { changedFiles, apiBehavior, uiBehavior, autoDispatchBehavior, testsRun, risks }.',
      ],
      context: {
        issueContext: args.issueContext,
        architecture: args.architecture,
        acceptanceTests: args.acceptanceTests,
        sidecarAndMcp: args.sidecarAndMcp,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const runSecurityQualityGateTask = defineTask('issue-627.security-quality-gate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Security quality gate for meeting credentials and tool permissions',
  labels: ['issue-627', 'security', 'jwt', 'quality-gate'],
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'security reviewer for Krate meeting dispatch',
      task: 'Verify the implementation does not leak meeting credentials and enforces meeting tool permissions.',
      instructions: [
        'Inspect all changed source, tests, and generated manifests.',
        'Prove raw Jitsi JWT values are not persisted in AgentDispatchRun status/spec fields intended for UI, comments, logs, snapshots, or web responses. If spec.meetingContext has a credential field, it must be a secret reference or demonstrably redacted.',
        'Verify sidecar receives the JWT through the selected runtime-only mechanism and no logs print it.',
        'Verify role/capability enforcement for all eight MCP tools, including observer, participant, moderator, chat read-only, audio listen-only, and screenshare none/share modes.',
        'Verify inactive meeting, unknown meeting, non-capable stack, and provider mismatch cases fail closed.',
        'Return JSON: { passed, findings, credentialFlow, permissionMatrixEvidence, changedFilesReviewed, requiredFixes }.',
      ],
      context: {
        issueContext: args.issueContext,
        architecture: args.architecture,
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

export const runRegressionVerificationTask = defineTask('issue-627.regression-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run full regression verification for issue #627',
  labels: ['issue-627', 'verification', 'tests', 'quality-gate'],
  agent: {
    name: 'test-strategy-architect',
    prompt: {
      role: 'verification engineer',
      task: 'Run focused and broad verification commands, capture evidence, and decide whether the implementation satisfies issue #627.',
      instructions: [
        'Run the focused test files touched by the implementation.',
        'Run the configured verification commands from inputs, adding narrower commands if needed for useful failure isolation.',
        'At minimum cover core tests, web tests, resource metadata verification, SDK build/test if exports changed, and git diff whitespace validation.',
        'Record exact commands, exit codes, and high-signal output summaries.',
        'If a command cannot run, mark it as blocked with the exact reason and assess residual risk.',
        'Return JSON: { passed, commands, failures, blocked, coverage, residualRisk, requiredFixes }.',
      ],
      context: {
        issueContext: args.issueContext,
        architecture: args.architecture,
        acceptanceTests: args.acceptanceTests,
        securityGate: args.securityGate,
        verificationCommands: args.inputs?.verificationCommands,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewImplementationTask = defineTask('issue-627.implementation-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Independent implementation review',
  labels: ['issue-627', 'code-review', 'quality-gate'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'independent senior reviewer',
      task: 'Review the issue #627 implementation for correctness, maintainability, test adequacy, and regressions.',
      instructions: [
        'Use a code-review stance: findings first, ordered by severity, with file and line references.',
        'Check for behavioral regressions in no-meeting dispatch, permission review, approval-gated dispatch, workspace mounts, and existing web dispatch flows.',
        'Check that Jitsi-specific additions are isolated behind meetingRef/jitsiCapability and do not force Jitsi dependencies into non-Jitsi workflows.',
        'Check test coverage against every acceptance criterion and against the security gate.',
        'Set approved true only if no blocking or high-severity findings remain.',
        'Return JSON: { approved, findings, testGaps, residualRisk, requiredFixes }.',
      ],
      context: {
        issueContext: args.issueContext,
        architecture: args.architecture,
        securityGate: args.securityGate,
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

export const remediateQualityGateFailuresTask = defineTask('issue-627.remediate-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediate quality gate failures',
  labels: ['issue-627', 'remediation', 'quality-gate'],
  agent: {
    name: 'backend-developer',
    prompt: {
      role: 'senior Krate engineer',
      task: 'Make targeted fixes for the recorded security, verification, and review failures.',
      instructions: [
        'Edit only files needed to fix recorded failures. Preserve unrelated local changes.',
        'Prioritize security gate failures, failing acceptance tests, and blocking code review findings.',
        'Do not broaden scope beyond issue #627.',
        'Run focused tests for each fix and record evidence.',
        'Return JSON: { changedFiles, fixes, testsRun, remainingRisk }.',
      ],
      context: {
        issueContext: args.issueContext,
        architecture: args.architecture,
        securityGate: args.securityGate,
        verification: args.verification,
        review: args.review,
        attempt: args.attempt,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceGateTask = defineTask('issue-627.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #627',
  labels: ['issue-627', 'final-gate', 'acceptance'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'release readiness reviewer',
      task: 'Decide whether issue #627 is complete and ready for delivery.',
      instructions: [
        'Map implementation evidence to every issue acceptance area: AgentStack fields, meeting-aware dispatch, sidecar env/volume, MCP tools, auto-dispatch, web UI, and tests.',
        'Confirm no raw JWT or secret meeting credential is exposed through persisted status, comments, UI, logs, or PR text.',
        'Confirm no-meeting dispatch behavior remains compatible.',
        'Confirm dependency issues #624/#620 were respected or guarded by compatibility fallbacks.',
        'List changed files and summarize verification evidence.',
        'Set passed true only when securityGate.passed, verification.passed, and review.approved are all true.',
        'Return JSON: { passed, changedFiles, acceptanceMap, verificationSummary, securitySummary, dependencySummary, releaseNotes, blockers }.',
      ],
      context: {
        issueContext: args.issueContext,
        reuseAudit: args.reuseAudit,
        architecture: args.architecture,
        acceptanceTests: args.acceptanceTests,
        securityGate: args.securityGate,
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

export const deliverIssue627Task = defineTask('issue-627.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deliver issue #627 implementation PR',
  labels: ['issue-627', 'delivery', 'github'],
  agent: {
    name: 'process-architect',
    prompt: {
      role: 'GitHub delivery coordinator',
      task: 'Prepare the completed issue #627 implementation for review.',
      instructions: [
        `Ensure work is on branch ${args.branchName} based on ${args.baseBranch}.`,
        'Stage and commit only files relevant to issue #627.',
        'Push the branch and create a pull request linking #627.',
        'The PR body must summarize implementation phases, tests, security credential handling, dependency handling for #624/#620, and residual risks.',
        'Post a comment on issue #627 with the implementation summary and PR link.',
        'Return JSON: { committed, commitSha, pushed, prUrl, issueCommentUrl, summary }.',
      ],
      context: {
        issueNumber: args.issueNumber,
        finalGate: args.finalGate,
        securityGate: args.securityGate,
        verification: args.verification,
        review: args.review,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));
