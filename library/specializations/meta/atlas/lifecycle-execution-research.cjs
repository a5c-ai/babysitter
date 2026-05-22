const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich Layers 7-9 (Workspace / Execution / Sandbox) plus the
// runtime lifecycle records (Run, RunAttempt, Invocation, Session,
// ChildSession, Effect, PhaseMachine, Phase, PhaseTransition, LifecycleState,
// StateMachine, HumanCheckpoint, ResumeToken, AsyncJob, AutomationRule,
// Reconciliation, OperationalTrigger, DispatchPreflight, FailureClass,
// RecoveryStrategy, FilesystemSafetyInvariant, SecretHandlingPolicy).

const discoverLifecycleGapsTask = defineTask('discover-lifecycle-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory lifecycle/execution records — find gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List every Workspace, Execution, Sandbox under graph/lifecycle/.',
      'List every Run, RunAttempt, Invocation, Session, ChildSession, Effect, PhaseMachine, Phase, PhaseTransition, LifecycleState, StateMachine, HumanCheckpoint, ResumeToken, AsyncJob, AutomationRule, Reconciliation, OperationalTrigger, DispatchPreflight, FailureClass, RecoveryStrategy, FilesystemSafetyInvariant, SecretHandlingPolicy.',
      'Identify gaps:',
      '  - Workspace: do we have examples for each materialization mode (worktree, symlink, clone, copy, virtual)? Each storage backend (local-fs, nfs, s3-mounted, container-volume, tmpfs, ide-managed)?',
      '  - Execution: each kind (local, docker, ssh, kubernetes, cloud, direct)? each isolation level (none, namespace, container, vm, wasm-sandbox)? each sandboxImpl (agentsh, docker, firecracker, gvisor, kata, wasm-time, qemu, none)?',
      '  - Sandbox: each filesystemPolicy + networkPolicy combo represented? each policyEvaluationPoint?',
      '  - PhaseMachine: are the canonical process phase machines (default-process, deep-research-process, fix-bug-process, ship-feature-process) modeled?',
      '  - LifecycleState: for each top-level state-machine (run, session, invocation, effect, workspace), are all states + transitions modeled?',
      '  - HumanCheckpoint: review/approval/edit/escalation kinds × hard/soft/advisory blocking — coverage gaps?',
      '  - AsyncJob: provider-side batch APIs (anthropic-message-batches, openai-batch, gemini-batch, replicate-prediction, vertex-batch). Verify currency.',
      '  - AutomationRule: canonical rules (auto-approve-readonly, never-auto-approve-destroy, github-issue-opened, nightly-triage, weekly-summary). Industry-standard rules?',
      '  - FailureClass + RecoveryStrategy: orchestrator-level failure modes + recovery patterns.',
      '  - FilesystemSafetyInvariant + SecretHandlingPolicy: standard agentic safety invariants.',
      'Return JSON: { workspacesMissing, executionsMissing, sandboxesMissing, phaseMachinesMissing, lifecycleStatesMissing, transitionsMissing, humanCheckpointsMissing, asyncJobsMissing, automationRulesMissing, failureClassesMissing, recoveryStrategiesMissing, fsInvariantsMissing, secretPoliciesMissing }.'
    ]
  }
}));

const researchLifecycleFactsTask = defineTask('research-lifecycle-facts', (args) => ({
  kind: 'agent',
  title: 'Research lifecycle/execution facts',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'Workspace materialization patterns: git-worktree docs, github codespaces dev-container.json, devcontainer.json spec, IDE workspace formats (vscode workspaces, jetbrains projects).',
      'Execution sandbox impls: firecracker.io, gvisor.dev, github.com/google/nsjail, github.com/openai/codex (sandboxing approach), Docker security-opt patterns, Kubernetes PodSecurityStandards, OpenAI Code Interpreter sandbox writeups.',
      'Sandbox policy: NIST cybersecurity-framework controls, OWASP secure-coding practices.',
      'PhaseMachine / Phase / LifecycleState: BPMN-style workflow patterns, Temporal workflow patterns, sre.google incident response phases.',
      'HumanCheckpoint patterns: human-in-the-loop ML literature, RLHF feedback loops, anthropic auto-claude-policy patterns.',
      'AsyncJob: per-provider batch API docs.',
      'AutomationRule: github-actions cookbook, dependabot config, renovate config, jira automation rule library.',
      'FailureClass / RecoveryStrategy: SRE workbook, postmortem.org, fault-tolerance patterns (circuit breaker, bulkhead, retry-with-backoff, hedging).',
      'FilesystemSafetyInvariant / SecretHandlingPolicy: OWASP secrets-management cheat sheet, github.com/codeQL secret-detection rules, the Twelve-Factor App.',
      'Per finding: source URL, retrievedAt, quote, confidence.',
      'Return JSON: { evidence, newWorkspacesToAuthor, newExecutionsToAuthor, newSandboxesToAuthor, newPhaseMachinesToAuthor, newLifecycleStatesToAuthor, newTransitionsToAuthor, newHumanCheckpointsToAuthor, newAsyncJobsToAuthor, newAutomationRulesToAuthor, newFailureClassesToAuthor, newRecoveryStrategiesToAuthor, newFsInvariantsToAuthor, newSecretPoliciesToAuthor }.'
    ]
  }
}));

const enrichLifecycleGraphTask = defineTask('enrich-lifecycle-graph', (args) => ({
  kind: 'agent',
  title: 'Apply lifecycle research to graph',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author new records under graph/lifecycle/ (workspaces, executions, sandboxes, phases, phase-machines, sessions, runs, run-attempts, invocations, child-sessions, effects, checkpoints, etc.) and graph/extensions/ (automation-rules, failure-classes, recovery-strategies, fs-safety-invariants, secret-handling-policies, async-jobs).',
      'Wire realizes: layer:7-workspace / 8-execution / 9-sandbox on the corresponding kind.',
      'Wire belongs_to_phase_machine on each Phase, has_transition + transition_of on PhaseTransitions.',
      'Wire belongs_to_machine + transitions_to + has_state on LifecycleState↔StateMachine chains.',
      'Wire uses_async_job from Run.',
      'Wire issues_resume_token from Run.',
      'Wire has_preflight + performs_reconciliation from Run.',
      'Wire fires_operational_trigger from APIEndpoint to OperationalTrigger.',
      'Wire defines_automation_rule from AgentProduct to AutomationRule.',
      'Wire handles_failure from RecoveryStrategy to FailureClass.',
      'Wire enforces_invariant from AgentRuntimeImpl to FilesystemSafetyInvariant.',
      'Wire applies_secret_policy from WorkflowDefinition to SecretHandlingPolicy.',
      'Wire uses_checkpoint from Skill/Subagent/WorkflowDefinition to HumanCheckpoint where the current schema allows it.',
      'Wire notifies_via from HumanCheckpoint to Channel.',
      'Wire escalates_to from HumanCheckpoint to Role.',
      'Author Claim records for evidenced attributes. No Trust Chain.',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'Validate after each batch.',
      'If gaps remain after editing, return remainingGaps with exact unresolved ids. If evidence is insufficient, return status=blocked and blockedEvidence with source locations to check next.',
      'Return JSON: { filesEdited, filesCreated, recordsAddedByKind, edgesAdded, claimsAdded, remainingGaps[], blockedEvidence[], carryOverTasks[], carryOverTaskIds[], validatorState }.'
    ]
  }
}));

const verifyLifecycleEnrichmentTask = defineTask('verify-lifecycle-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify lifecycle-layer enrichment',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'If this verification is not ok, return remainingGaps[] so the process can iterate, or status=blocked with blockedEvidence[] when facts cannot be resolved safely.',
      'Every new Phase has belongs_to_phase_machine.',
      'Every new LifecycleState has belongs_to_machine.',
      'Every new HumanCheckpoint that is hard-blocking has at least one notifies_via Channel.',
      'Every new RecoveryStrategy has at least one handles_failure FailureClass.',
      'Every new Workspace/Execution/Sandbox has realizes layer:7|8|9-*.',
      'No Trust Chain entries.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;
  const initialGaps = await ctx.task(discoverLifecycleGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchLifecycleFactsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichLifecycleGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyLifecycleEnrichmentTask, {
      enrichmentResult: enrichmentResult,
      gaps: currentGaps,
      attempt,
    });

    attempts.push({
      attempt,
      gaps: currentGaps,
      evidence: evidence,
      enrichmentResult: enrichmentResult,
      verification,
    });

    if (verification.status === 'ok') break;
    if (verification.status === 'blocked') break;

    currentGaps = verification.remainingGaps || verification.gaps || enrichmentResult.remainingGaps || currentGaps;
  }

  return {
    status: verification && verification.status === 'ok' ? 'ok' : 'needs-review',
    graphRoot,
    gaps: currentGaps,
    initialGaps,
    attempts,
    enrichmentResult: enrichmentResult,
    verification,
  };
};
