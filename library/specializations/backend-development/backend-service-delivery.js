/**
 * @process backend-development/backend-service-delivery
 * @description Flagship end-to-end backend service delivery process: requirements+domain
 *   modeling -> contract-first API design -> parallel outside-in TDD slices -> parallel
 *   adversarial gates (security/performance/api-contract) -> integration verification ->
 *   deployment-readiness sign-off, wiring all 7 backend-development skills and kip
 *   architecture-decision memory. Scoped to a single service / bounded context so a run
 *   completes in one session.
 * @inputs {
 *   serviceName: string,           // required — the service / bounded context being delivered
 *   requirementsBrief: string,     // required — raw requirements brief to interview and model
 *   repoRoot?: string,             // repository root the agents work in (default '.')
 *   language?: string,             // implementation language hint ('rust' activates rust-async-runtime slices)
 *   maxFixAttempts?: number,       // bounded fix loop per gate/slice before escalation (default 2)
 *   maxParallelSlices?: number,    // ctx.parallel.map concurrency for implementation slices (default 3)
 *   kipEnabled?: boolean,          // recall + assert architecture decisions via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip ask/resolve structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,
 *   contract: object,              // { contractPath, endpoints, approved }
 *   slices: array,                 // [{ name, skill, filesChanged, reviewAttempts, escalated, accepted }]
 *   gateResults: object,           // { security, performance, apiContract: each { passed, attempts, escalated, issues } }
 *   integration: object,           // { passed, failures }
 *   deploymentReadiness: object,   // { ready, checklist, blockers, signedOff, signoffResponse }
 *   kipFactsAsserted: number,
 *   artifacts: array,              // [contractPath, reportPath, runbookPath]
 *   metadata: object               // { runId, boundedContext, sliceCount, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:backend, domain:software-engineering]
 *   specializations: [specialization:backend-development]
 *   skillAreas: [skill-area:backend-async-processing, skill-area:background-job-processing, skill-area:database-drivers-connectors, skill-area:email-notification-delivery, skill-area:webhook-verification]
 *   workflows: [workflow:feature-development]
 *   topics: [topic:test-driven-development]
 *   roles: [role:backend-engineer, role:architect]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Windows-safe, fallback-free kip CLI resolution. There is exactly ONE documented
// invocation path — npm-exec bin resolution is unreliable on Windows and prose-salvaged
// JSON is forbidden, so neither is ever attempted.
const KIP_CLI_NOTE = [
  'kip CLI resolution (single documented path, no fallbacks): run `node packages/kip-sdk/dist/cli/kip.js <cmd> --dir <kipDir> --json`',
  '(npm exec bin resolution is unreliable on Windows — do not use it).',
  'Pass `--model <kipModel>` explicitly on `kip ask` / `kip resolve` structured paths (weak default models under-fire on JSON-schema adjudication).',
  'If the store does not exist, run `kip init --dir <kipDir> --create` first and report the empty recall as a fresh brain, not an error.',
  'Never salvage JSON from prose output and never invent facts.',
].join(' ');

// The ONLY skills the slice planner may assign. A slice arriving with anything else is a
// planning failure — the process throws instead of defaulting (fallbacks are forbidden).
const ALLOWED_SLICE_SKILLS = [
  'backend-async-processing',
  'background-job-processing',
  'database-drivers-connectors',
  'email-notification-delivery',
  'growing-outside-in-systems',
  'rust-async-runtime',
  'webhook-verification',
];

function assertSliceSkill(skill, sliceName) {
  if (!ALLOWED_SLICE_SKILLS.includes(skill)) {
    throw new Error(
      `Slice '${sliceName}' carries unknown skill '${skill}'. ` +
      `The planner MUST assign one of: ${ALLOWED_SLICE_SKILLS.join(', ')} — no default is applied.`
    );
  }
  return skill;
}

// ---------------------------------------------------------------------------
// Phase 0 — kip recall
// ---------------------------------------------------------------------------

export const kipRecallTask = defineTask('bsd.kip-recall', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recall prior backend architecture knowledge for ${args.serviceName}`,
  agent: {
    name: 'knowledge-librarian',
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Recall prior backend architecture decisions and gate outcomes for this service/domain from kip',
      context: args,
      instructions: [
        KIP_CLI_NOTE,
        `Store: --dir ${args.kipDir}, model for structured paths: ${args.kipModel}.`,
        'Run `kip recall` / `kip query` for entities of kind `backend-architecture` with props `decision`, `gate-outcome`, and `insight`, scoped to this service/domain where possible.',
        `Service under delivery: ${args.serviceName}.`,
        'Summarize prior architectural decisions, prior gate outcomes, and standing insights so downstream agents honor them instead of re-deciding.',
        'Report the raw fact count so downstream tasks can tell an empty brain from a query mistake.',
        'A fresh store means: initialize with `--create`, then report an empty recall — never an error, never fabricated facts.',
      ],
      outputFormat: 'JSON with decisions array, gateOutcomes array, insights array, factCount number, storeInitialized boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['factCount', 'decisions'],
      properties: {
        decisions: { type: 'array' },
        gateOutcomes: { type: 'array' },
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
  labels: ['agent', 'bsd', 'backend', 'kip'],
}));

// ---------------------------------------------------------------------------
// Phase 1 — requirements + domain modeling
// ---------------------------------------------------------------------------

export const requirementsDomainModelTask = defineTask('bsd.requirements-domain-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Domain model for ${args.serviceName}`,
  agent: {
    name: 'backend-architect',
    skill: { name: 'growing-outside-in-systems' },
    prompt: {
      role: 'Domain-driven design modeler',
      task: 'Interview the requirements brief and produce a DDD domain model for ONE bounded context',
      context: args,
      instructions: [
        'Interview the brief and produce: ubiquitous language, aggregates, domain events, a hexagonal ports/adapters map, risks, and openQuestions.',
        'Model exactly ONE bounded context — if the brief implies more, pick the core one and record the rest as risks/openQuestions.',
        'Do NOT write implementation code in this phase.',
        'Honor the recalled kip decisions in priorKnowledge, or explicitly justify each divergence in the model.',
        'openQuestions are carried into the API-contract approval breakpoint — do not block here; record them instead.',
      ],
      outputFormat: 'JSON with requirements array, boundedContext string, ubiquitousLanguage array, aggregates array, domainEvents array, ports array, risks array, openQuestions array',
    },
    outputSchema: {
      type: 'object',
      required: ['boundedContext', 'aggregates', 'ports'],
      properties: {
        requirements: { type: 'array' },
        boundedContext: { type: 'string' },
        ubiquitousLanguage: { type: 'array' },
        aggregates: { type: 'array' },
        domainEvents: { type: 'array' },
        ports: { type: 'array' },
        risks: { type: 'array' },
        openQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'domain-modeling'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — contract-first API design
// ---------------------------------------------------------------------------

export const apiContractDesignTask = defineTask('bsd.api-contract-design', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise API contract for ${args.serviceName} (breakpoint feedback)`
    : `Design API contract for ${args.serviceName}`,
  agent: {
    name: 'backend-architect',
    skill: { name: 'growing-outside-in-systems' },
    prompt: {
      role: 'Contract-first API designer',
      task: `Write the API contract for '${args.serviceName}' before any implementation exists`,
      context: args,
      instructions: [
        `Write the OpenAPI (or equivalent schema) contract file under the artifacts directory (${args.artifactsDir}) and report its path.`,
        'Define endpoints, request/response schemas, the error model, and the versioning policy from the domain model ports.',
        'Honor the recalled kip decisions in priorKnowledge, or explicitly justify divergence.',
        args.feedback
          ? `Revision round: address ONLY this breakpoint feedback and emit a contractDiff summary of what changed: ${JSON.stringify(args.feedback)}`
          : 'First design round: no revision feedback to address.',
      ],
      outputFormat: 'JSON with contractPath string, endpoints array, schemas array, errorModel object, versioningPolicy string, contractDiff string',
    },
    outputSchema: {
      type: 'object',
      required: ['contractPath', 'endpoints', 'errorModel'],
      properties: {
        contractPath: { type: 'string' },
        endpoints: { type: 'array' },
        schemas: { type: 'array' },
        errorModel: { type: 'object' },
        versioningPolicy: { type: 'string' },
        contractDiff: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'api-contract'],
}));

// ---------------------------------------------------------------------------
// Phase 3 — slice planning + outside-in TDD implementation
// ---------------------------------------------------------------------------

export const slicePlanningTask = defineTask('bsd.slice-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan vertical slices for ${args.serviceName}`,
  agent: {
    name: 'backend-architect',
    skill: { name: 'growing-outside-in-systems' },
    prompt: {
      role: 'Outside-in delivery planner',
      task: 'Decompose the approved contract + domain model into vertical outside-in slices',
      context: args,
      instructions: [
        'Decompose into vertical slices, walking skeleton first: each slice cuts through the whole stack and is independently reviewable.',
        'Each slice MUST carry: name (kebab-case, unique — it is interpolated into escalation breakpointIds), story, acceptanceCriteria, dependsOn (slice names), parallelSafe (boolean).',
        `Each slice MUST carry a skill chosen from EXACTLY this list — there is no default and planning fails on anything else: ${ALLOWED_SLICE_SKILLS.join(' | ')}.`,
        'Skill routing: persistence -> database-drivers-connectors; queue/worker -> background-job-processing; async/eventing -> backend-async-processing; notifications -> email-notification-delivery; webhooks/callbacks -> webhook-verification; Rust runtime work (language=rust) -> rust-async-runtime; everything else -> growing-outside-in-systems.',
        'dependsOn must reference existing slice names only; mark parallelSafe=false for slices that touch shared scaffolding.',
      ],
      outputFormat: 'JSON with slices array [{ name, story, acceptanceCriteria, skill, dependsOn, parallelSafe }]',
    },
    outputSchema: {
      type: 'object',
      required: ['slices'],
      properties: {
        slices: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'story', 'acceptanceCriteria', 'skill'],
            properties: {
              name: { type: 'string' },
              story: { type: 'string' },
              acceptanceCriteria: { type: 'array' },
              skill: { type: 'string' },
              dependsOn: { type: 'array' },
              parallelSafe: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'planning'],
}));

export const sliceImplementationTask = defineTask('bsd.slice-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement slice: ${args.slice.name}`,
  agent: {
    name: 'backend-engineer',
    // Planner-assigned skill; throws on anything outside the allowed 7 — no defaulting.
    skill: { name: assertSliceSkill(args.slice.skill, args.slice.name) },
    prompt: {
      role: 'Backend implementer (outside-in TDD)',
      task: `Implement the vertical slice '${args.slice.name}' for ${args.serviceName}`,
      context: args,
      instructions: [
        'Work outside-in: write the failing acceptance test for the slice story FIRST, then drive inward.',
        'Use in-memory fakes behind extracted interfaces; defer real I/O adapters to the edges (hexagonal boundaries).',
        'Satisfy every acceptanceCriteria entry of the slice; stay within the approved contract.',
        'Run the tests and capture the raw command + output excerpt in testResults.',
        'IRON LAW: report concerns and architectural decisions honestly — an independent reviewer will read the actual code and re-run the tests.',
      ],
      outputFormat: 'JSON with summary string, filesChanged array, testResults { passed, failed, command, outputExcerpt }, architecturalDecisions array, concerns array',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesChanged', 'testResults'],
      properties: {
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
        testResults: {
          type: 'object',
          properties: {
            passed: { type: 'number' },
            failed: { type: 'number' },
            command: { type: 'string' },
            outputExcerpt: { type: 'string' },
          },
        },
        architecturalDecisions: { type: 'array' },
        concerns: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'tdd', 'implementer'],
}));

export const sliceReviewerTask = defineTask('bsd.slice-reviewer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review slice: ${args.slice.name} (attempt ${args.attempt})`,
  agent: {
    // Distinct agent name from the implementer ('backend-engineer') — reviewer independence.
    name: 'backend-critic',
    skill: { name: 'growing-outside-in-systems' },
    prompt: {
      role: 'Independent slice reviewer',
      task: `Adversarially review the implementation of slice '${args.slice.name}'`,
      context: args,
      instructions: [
        'IRON LAW: Do NOT trust the implementer report. Read the actual code and re-run the slice tests yourself.',
        'Your default posture is rejection: pass only when you could not substantiate a single blocking issue.',
        'Verify every acceptanceCriteria entry of the slice against the code and the test run you executed.',
        'Verify hexagonal boundaries: domain logic behind ports, I/O at the edges, in-memory fakes where the slice claims them.',
        'Every issue must be { file, problem, requiredFix }; every evidence entry must be { file, observation } grounded in code you read or output you produced.',
      ],
      outputFormat: 'JSON with passed boolean, issues array [{ file, problem, requiredFix }], evidence array [{ file, observation }] (at least one entry)',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issues', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        issues: {
          type: 'array',
          items: { type: 'object', required: ['file', 'problem', 'requiredFix'] },
        },
        evidence: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['file', 'observation'] },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'reviewer', 'quality-gate'],
}));

export const sliceFixerTask = defineTask('bsd.slice-fixer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix slice: ${args.slice.name} (round ${args.attempt})`,
  agent: {
    name: 'backend-engineer',
    skill: { name: assertSliceSkill(args.slice.skill, args.slice.name) },
    prompt: {
      role: 'Slice fixer',
      task: `Fix the reviewer-listed issues on slice '${args.slice.name}'`,
      context: args,
      instructions: [
        'Fix ONLY the issues listed by the reviewer (or the human escalation directive when provided). No unrelated refactors.',
        'Preserve the prior implementation where it was correct.',
        'Re-run the slice tests and report the raw output excerpt.',
      ],
      outputFormat: 'JSON with summary string, filesChanged array, testOutputExcerpt string',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesChanged'],
      properties: {
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
        testOutputExcerpt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'fixer'],
}));

// ---------------------------------------------------------------------------
// Phase 4 — parallel adversarial gates (security / performance / api-contract)
// ---------------------------------------------------------------------------

export const securityCriticTask = defineTask('bsd.security-critic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security gate: ${args.serviceName} (attempt ${args.attempt})`,
  agent: {
    name: 'backend-critic',
    skill: { name: 'webhook-verification' },
    prompt: {
      role: 'Adversarial security gatekeeper',
      task: `Try to FAIL the security posture of '${args.serviceName}'`,
      context: args,
      instructions: [
        'IRON LAW: read the code and the contract yourself; attempt to construct a concrete exploit path for every suspicion.',
        'Check authn/authz on every endpoint, input validation, secret handling, injection, and unsafe deserialization.',
        'On webhook/callback surfaces: HMAC signature verification, replay protection, and idempotency.',
        'Evidence must cite file:line or a reproduced probe — a suspicion without an exploit attempt is not a finding.',
        'Return passed=false with specific { file, problem, requiredFix } issues if anything is exploitable.',
      ],
      outputFormat: 'JSON with passed boolean, issues array, evidence array (at least one entry, file:line cited)',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issues', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        issues: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'quality-gate', 'security'],
}));

export const performanceCriticTask = defineTask('bsd.performance-critic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance gate: ${args.serviceName} (attempt ${args.attempt})`,
  agent: {
    name: 'backend-critic',
    skill: { name: 'backend-async-processing' },
    prompt: {
      role: 'Adversarial performance gatekeeper',
      task: `Try to FAIL the performance posture of '${args.serviceName}'`,
      context: args,
      instructions: [
        'Hunt N+1 queries, missing connection pooling, blocking calls on async paths, unbounded queues/retries, missing backpressure, and chatty contract endpoints.',
        'IRON LAW: verdicts must be backed by file:line evidence or measured output — never vibes.',
        'Return passed=false with specific { file, problem, requiredFix } issues for every substantiated finding.',
      ],
      outputFormat: 'JSON with passed boolean, issues array, evidence array (at least one entry, measured or file:line cited)',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issues', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        issues: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'quality-gate', 'performance'],
}));

export const apiContractCriticTask = defineTask('bsd.api-contract-critic', (args, taskCtx) => ({
  kind: 'agent',
  title: `API-contract gate: ${args.serviceName} (attempt ${args.attempt})`,
  agent: {
    name: 'backend-critic',
    skill: { name: 'growing-outside-in-systems' },
    prompt: {
      role: 'Adversarial contract-conformance gatekeeper',
      task: `Diff the implementation of '${args.serviceName}' against the APPROVED contract artifact`,
      context: args,
      instructions: [
        `IRON LAW: diff the implemented routes/schemas/status codes/error bodies against the approved contract at ${args.contractPath} — never against the implementer's claims.`,
        'Any undocumented endpoint or drifted schema fails the gate.',
        'Evidence entries must be concrete contract-vs-implementation diffs.',
        'Return passed=false with specific { file, problem, requiredFix } issues for every drift.',
      ],
      outputFormat: 'JSON with passed boolean, issues array, evidence array (at least one entry — contract-vs-impl diffs)',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issues', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        issues: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'quality-gate', 'api-contract'],
}));

export const gateFixerTask = defineTask('bsd.gate-fixer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix ${args.gate} gate issues (round ${args.attempt})`,
  agent: {
    // Fixer agent is distinct from the critic agent ('backend-critic').
    name: 'backend-engineer',
    skill: { name: 'growing-outside-in-systems' },
    prompt: {
      role: 'Gate-scoped fixer',
      task: `Fix ONLY the issues raised by the failed '${args.gate}' gate`,
      context: args,
      instructions: [
        `Fix ONLY the issues listed by the '${args.gate}' critic — no unrelated refactors, no scope creep into other gates.`,
        'Preserve behavior that is already passing (slice tests, other gates).',
        'List every file you changed.',
      ],
      outputFormat: 'JSON with summary string, filesChanged array',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesChanged'],
      properties: {
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'fixer', 'quality-gate'],
}));

// ---------------------------------------------------------------------------
// Phase 5 — integration verification
// ---------------------------------------------------------------------------

export const integrationVerificationTask = defineTask('bsd.integration-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration verification: ${args.serviceName} (attempt ${args.attempt})`,
  agent: {
    name: 'quality-assessor',
    skill: { name: 'database-drivers-connectors' },
    prompt: {
      role: 'Integration verifier',
      task: `Boot '${args.serviceName}' against real adapters and run the full suite`,
      context: args,
      instructions: [
        'Boot the service with real adapters where available: DB via real drivers/pooling, queue, outbound email/webhook stubs.',
        'Run the FULL test suite plus contract tests against the booted service.',
        'IRON LAW: raw command output excerpts are required as evidence — no pass without executed commands, no green-by-assertion.',
        'Report every command you ran and pass/fail with failure details.',
      ],
      outputFormat: 'JSON with passed boolean, failures array, evidence array (at least one raw output excerpt), commands array',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'failures', 'evidence'],
      properties: {
        passed: { type: 'boolean' },
        failures: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
        commands: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'integration', 'quality-gate'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — deployment readiness + kip capture + report
// ---------------------------------------------------------------------------

export const deploymentReadinessTask = defineTask('bsd.deployment-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deployment readiness: ${args.serviceName}`,
  agent: {
    name: 'backend-architect',
    skill: { name: 'background-job-processing' },
    prompt: {
      role: 'Deployment-readiness assessor',
      task: `Compile the deployment-readiness checklist for '${args.serviceName}'`,
      context: args,
      instructions: [
        'Compile the checklist: migrations plan, config/secrets inventory, health/readiness endpoints, worker/queue draining + rollback strategy, observability (logs/metrics/alerts).',
        'Write the operational runbook into the artifacts directory and report its path.',
        'Return a ready verdict with explicit blockers — an unresolved blocker means ready=false, never a softened verdict.',
      ],
      outputFormat: 'JSON with ready boolean, checklist array, blockers array, runbookPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'checklist'],
      properties: {
        ready: { type: 'boolean' },
        checklist: { type: 'array' },
        blockers: { type: 'array' },
        runbookPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'deployment'],
}));

export const kipAssertTask = defineTask('bsd.kip-assert', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assert run knowledge into kip for ${args.serviceName}`,
  agent: {
    name: 'knowledge-librarian',
    prompt: {
      role: 'Knowledge-base librarian',
      task: 'Durably record this delivery run\'s architectural decisions and gate outcomes in kip',
      context: args,
      instructions: [
        KIP_CLI_NOTE,
        `Store: --dir ${args.kipDir}, model for structured paths: ${args.kipModel}.`,
        'Assert one fact per architectural decision (kind `backend-architecture`, prop `decision`: serviceName, decision, rationale, runId).',
        'Assert one fact per gate outcome including escalations and the sign-off decision (prop `gate-outcome`: gate, attempts, passed, escalated).',
        'Assert durable run insights (prop `insight`) — only insights supported by this run\'s evidence.',
        'Report the exact number of facts asserted and their entity ids.',
      ],
      outputFormat: 'JSON with factsAsserted number, entityIds array',
    },
    outputSchema: {
      type: 'object',
      required: ['factsAsserted'],
      properties: {
        factsAsserted: { type: 'number' },
        entityIds: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'kip'],
}));

export const finalReportTask = defineTask('bsd.final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write delivery report for ${args.serviceName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical writer',
      task: `Write the delivery run report for '${args.serviceName}'`,
      context: args,
      instructions: [
        `Write the report (markdown) to ${args.reportPath}.`,
        'Sections: contract link, slices with review attempt counts and escalations, gate verdicts with evidence refs, integration result, readiness checklist, and the sign-off decision.',
        'Keep it factual — link every claim to a task result or file.',
      ],
      outputFormat: 'JSON with reportPath string, summary string',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'bsd', 'backend', 'report'],
}));

// ---------------------------------------------------------------------------
// Slice scheduling — dependency waves, parallelSafe-aware
// ---------------------------------------------------------------------------

/**
 * Validate the planner output and split slices into sequential dependency waves.
 * Throws (no fallback) on: unknown skill, duplicate names, unknown dependsOn refs,
 * or a dependency cycle.
 */
function computeSliceWaves(slices) {
  const names = new Set();
  for (const slice of slices) {
    assertSliceSkill(slice.skill, slice.name);
    if (names.has(slice.name)) {
      throw new Error(`Duplicate slice name '${slice.name}' — names must be unique (they key escalation breakpointIds).`);
    }
    names.add(slice.name);
  }
  for (const slice of slices) {
    for (const dep of slice.dependsOn || []) {
      if (!names.has(dep)) {
        throw new Error(`Slice '${slice.name}' depends on unknown slice '${dep}'.`);
      }
    }
  }
  const waves = [];
  const done = new Set();
  let remaining = slices;
  while (remaining.length) {
    const wave = remaining.filter((s) => (s.dependsOn || []).every((d) => done.has(d)));
    if (!wave.length) {
      throw new Error(`Dependency cycle among slices: ${remaining.map((s) => s.name).join(', ')}`);
    }
    waves.push(wave);
    for (const s of wave) done.add(s.name);
    remaining = remaining.filter((s) => !done.has(s.name));
  }
  return waves;
}

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    serviceName,
    requirementsBrief,
    repoRoot = '.',
    language,
    maxFixAttempts = 2,
    maxParallelSlices = 3,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  if (!serviceName || !requirementsBrief) {
    throw new Error('backend-service-delivery requires serviceName and requirementsBrief.');
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = { serviceName, requirementsBrief, repoRoot, language, kipDir, kipModel, artifactsDir };

  // Phase 0 — kip recall (gated on kipEnabled): prior architecture decisions and gate
  // outcomes feed every later task so agents honor them instead of re-deciding.
  ctx.log?.('info', 'Phase 0: kip recall of prior backend-architecture decisions');
  let priorKnowledge = { factCount: 0, decisions: [], gateOutcomes: [], insights: [] };
  if (kipEnabled) {
    priorKnowledge = await ctx.task(kipRecallTask, sharedArgs);
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — requirements + domain modeling. Deliberately no breakpoint here (sparse
  // breakpoints): openQuestions ride into the contract-approval breakpoint payload.
  ctx.log?.('info', 'Phase 1: requirements interview + domain modeling');
  const domainModel = await ctx.task(requirementsDomainModelTask, {
    ...sharedArgs, brief: requirementsBrief, priorKnowledge,
  });
  timings.domainModel = ctx.now() - startTime;

  // Phase 2 — contract-first API design + approval breakpoint. If rejected, exactly one
  // revision pass re-runs the design with the feedback and re-presents the SAME breakpointId.
  ctx.log?.('info', 'Phase 2: contract-first API design + approval');
  let contract = await ctx.task(apiContractDesignTask, { ...sharedArgs, domainModel, priorKnowledge });
  let contractApproved = false;
  let approvalFeedback = null;
  for (let round = 0; round < 2; round++) {
    if (round > 0) {
      contract = await ctx.task(apiContractDesignTask, {
        ...sharedArgs, domainModel, priorKnowledge, feedback: approvalFeedback, revision: round,
      });
    }
    const approval = await ctx.breakpoint({
      question: `Approve the API contract for '${serviceName}' (${contract.endpoints.length} endpoints)? Reply with changes for one revision round.`,
      title: 'Approve API contract',
      context: {
        runId: ctx.runId,
        files: [{ path: contract.contractPath, label: 'API contract' }],
        summary: {
          contractPath: contract.contractPath,
          endpointsSummary: contract.endpoints,
          errorModel: contract.errorModel,
          openQuestions: domainModel.openQuestions,
          contractDiff: contract.contractDiff,
        },
      },
      previousFeedback: approvalFeedback || undefined,
    }, {
      breakpointId: 'backend.api-contract-approval',
      expert: 'backend-architect',
      tags: ['backend', 'api', 'contract'],
      strategy: 'single',
    });
    breakpointsHit.push('backend.api-contract-approval');
    if (approval.approved) { contractApproved = true; break; }
    approvalFeedback = approval.response || approval.feedback || 'Changes requested';
  }
  timings.contract = ctx.now() - startTime;
  if (!contractApproved) {
    // No implementation happens on an unapproved contract — record and stop, never proceed silently.
    return {
      success: false,
      contract: { contractPath: contract.contractPath, endpoints: contract.endpoints, approved: false },
      slices: [],
      gateResults: null,
      integration: null,
      deploymentReadiness: null,
      kipFactsAsserted: 0,
      artifacts: [contract.contractPath],
      metadata: {
        processId: 'backend-development/backend-service-delivery',
        runId: ctx.runId,
        boundedContext: domainModel.boundedContext,
        sliceCount: 0,
        breakpointsHit,
        timings,
        reason: 'API contract not approved after one revision round',
      },
    };
  }

  // Phase 3 — slice planning, then outside-in TDD implementation. Waves derived from
  // dependsOn run sequentially; inside a wave only parallelSafe slices share the
  // ctx.parallel.map pool (maxConcurrency = maxParallelSlices), the rest run one-by-one.
  ctx.log?.('info', 'Phase 3: slice planning + outside-in TDD implementation');
  const planning = await ctx.task(slicePlanningTask, { ...sharedArgs, domainModel, contract, priorKnowledge });
  const waves = computeSliceWaves(planning.slices);

  const runSlice = async (slice) => {
    const sliceArgs = { ...sharedArgs, slice, domainModel, contract, priorKnowledge };
    const implementation = await ctx.task(sliceImplementationTask, sliceArgs);
    let filesChanged = implementation.filesChanged;

    let attempt = 1;
    let review = await ctx.task(sliceReviewerTask, { ...sliceArgs, implementation, attempt });
    while (!review.passed && attempt <= maxFixAttempts) {
      const fix = await ctx.task(sliceFixerTask, { ...sliceArgs, issues: review.issues, attempt });
      filesChanged = [...new Set([...filesChanged, ...fix.filesChanged])];
      attempt += 1;
      review = await ctx.task(sliceReviewerTask, { ...sliceArgs, implementation, lastFix: fix, attempt });
    }

    if (review.passed) {
      return {
        name: slice.name, skill: slice.skill, filesChanged,
        reviewAttempts: attempt, escalated: false, accepted: true, issues: [],
      };
    }

    // Reviewer still failing after the bounded fix loop — escalate with a
    // per-slice-unique breakpointId. The response routes to one of three outcomes:
    // approved + directive -> one human-directed fix pass; approved -> accept with the
    // open issues recorded; rejected -> drop the slice (recorded, never silently skipped).
    const escalationId = `backend.slice-gate-escalation.${slice.name}`;
    const escalation = await ctx.breakpoint({
      question: `Slice '${slice.name}' still fails review after ${maxFixAttempts} fix rounds. Approve with a fix directive (one human-directed fix pass), approve as-is (issues recorded), or reject to drop the slice.`,
      title: `Slice escalation: ${slice.name}`,
      context: {
        runId: ctx.runId,
        summary: { slice: slice.name, issues: review.issues, evidence: review.evidence, reviewAttempts: attempt },
      },
    }, {
      breakpointId: escalationId,
      expert: 'tech-lead',
      tags: ['backend', 'tdd', 'escalation'],
      strategy: 'single',
    });
    breakpointsHit.push(escalationId);

    if (!escalation.approved) {
      return {
        name: slice.name, skill: slice.skill, filesChanged,
        reviewAttempts: attempt, escalated: true, accepted: false,
        issues: review.issues, droppedReason: escalation.response || 'dropped at slice escalation',
      };
    }
    const directive = escalation.response || escalation.feedback;
    if (directive) {
      const directedFix = await ctx.task(sliceFixerTask, {
        ...sliceArgs, issues: review.issues, humanDirective: directive, attempt: attempt + 1,
      });
      filesChanged = [...new Set([...filesChanged, ...directedFix.filesChanged])];
      attempt += 1;
      review = await ctx.task(sliceReviewerTask, { ...sliceArgs, implementation, lastFix: directedFix, attempt });
    }
    return {
      name: slice.name, skill: slice.skill, filesChanged,
      reviewAttempts: attempt, escalated: true, accepted: true,
      issues: review.passed ? [] : review.issues,
    };
  };

  const sliceResults = [];
  for (const wave of waves) {
    const parallelSafe = wave.filter((s) => s.parallelSafe !== false);
    const serial = wave.filter((s) => s.parallelSafe === false);
    if (parallelSafe.length) {
      const waveResults = await ctx.parallel.map(parallelSafe, runSlice, { maxConcurrency: maxParallelSlices });
      sliceResults.push(...waveResults);
    }
    for (const slice of serial) {
      sliceResults.push(await runSlice(slice));
    }
  }
  timings.slices = ctx.now() - startTime;

  // Phase 4 — the three adversarial gates run in parallel; each failed gate then goes
  // through a bounded fixer/re-critic loop (sequential across gates — the fixers edit
  // the same codebase) and escalates on exhaustion via its own breakpointId.
  ctx.log?.('info', 'Phase 4: parallel adversarial gates (security, performance, api-contract)');
  const gateArgs = { ...sharedArgs, contractPath: contract.contractPath, contract, slices: sliceResults, attempt: 1 };
  const [securityVerdict, performanceVerdict, contractVerdict] = await ctx.parallel.all([
    () => ctx.task(securityCriticTask, gateArgs),
    () => ctx.task(performanceCriticTask, gateArgs),
    () => ctx.task(apiContractCriticTask, gateArgs),
  ]);

  const runGateFixLoop = async (gateName, criticTask, initialVerdict, breakpointId) => {
    let attempts = 1;
    let verdict = initialVerdict;
    while (!verdict.passed && attempts <= maxFixAttempts) {
      await ctx.task(gateFixerTask, { ...sharedArgs, gate: gateName, issues: verdict.issues, attempt: attempts });
      attempts += 1;
      verdict = await ctx.task(criticTask, { ...gateArgs, attempt: attempts });
    }
    let escalated = false;
    if (!verdict.passed) {
      const escalation = await ctx.breakpoint({
        question: `The '${gateName}' gate still fails after ${maxFixAttempts} fix rounds. Approve to accept the residual issues (recorded), or reject to keep the gate failed.`,
        title: `Gate escalation: ${gateName}`,
        context: {
          runId: ctx.runId,
          summary: { gate: gateName, attempts, issues: verdict.issues, evidence: verdict.evidence },
        },
      }, {
        breakpointId,
        expert: 'backend-architect',
        tags: ['backend', 'quality-gate', 'escalation'],
        strategy: 'single',
      });
      breakpointsHit.push(breakpointId);
      escalated = true;
      if (escalation.approved) {
        // Human accepted the residual issues — the gate outcome records both facts.
        verdict = { ...verdict, passed: true, acceptedByHuman: true };
      }
    }
    return { passed: verdict.passed, attempts, escalated, issues: verdict.issues, evidence: verdict.evidence };
  };

  const gateResults = {
    security: await runGateFixLoop('security', securityCriticTask, securityVerdict, 'backend.gate-escalation.security'),
    performance: await runGateFixLoop('performance', performanceCriticTask, performanceVerdict, 'backend.gate-escalation.performance'),
    apiContract: await runGateFixLoop('api-contract', apiContractCriticTask, contractVerdict, 'backend.gate-escalation.api-contract'),
  };
  timings.gates = ctx.now() - startTime;

  // Phase 5 — integration verification: one debug/fix pass on failure, escalation on
  // the second failure. gateFixerTask doubles as the scoped debugger (gate:'integration').
  ctx.log?.('info', 'Phase 5: integration verification');
  const integrationArgs = { ...sharedArgs, slices: sliceResults, contract, attempt: 1 };
  let integrationVerdict = await ctx.task(integrationVerificationTask, integrationArgs);
  if (!integrationVerdict.passed) {
    await ctx.task(gateFixerTask, {
      ...sharedArgs, gate: 'integration', issues: integrationVerdict.failures, attempt: 1,
    });
    integrationVerdict = await ctx.task(integrationVerificationTask, { ...integrationArgs, attempt: 2 });
    if (!integrationVerdict.passed) {
      await ctx.breakpoint({
        question: `Integration verification for '${serviceName}' failed twice (initial + one debug/fix re-run). Approve to proceed to readiness with the failures recorded, or reject to keep integration failed.`,
        title: 'Integration escalation',
        context: {
          runId: ctx.runId,
          summary: { failures: integrationVerdict.failures, evidence: integrationVerdict.evidence, commands: integrationVerdict.commands },
        },
      }, {
        breakpointId: 'backend.gate-escalation.integration',
        expert: 'tech-lead',
        tags: ['backend', 'integration', 'escalation'],
        strategy: 'single',
      });
      breakpointsHit.push('backend.gate-escalation.integration');
    }
  }
  const integration = { passed: integrationVerdict.passed, failures: integrationVerdict.failures };
  timings.integration = ctx.now() - startTime;

  // Phase 6 — deployment-readiness checklist, ship sign-off (first responder of the two
  // experts wins), kip capture, final report. The process never ends on an unanswered
  // gate: an explicit no-ship is recorded and asserted just like an approval.
  ctx.log?.('info', 'Phase 6: deployment-readiness sign-off + kip capture');
  const readiness = await ctx.task(deploymentReadinessTask, {
    ...sharedArgs, slices: sliceResults, gateResults, integration,
  });

  const signoff = await ctx.breakpoint({
    question: `Ship '${serviceName}'? Readiness: ${readiness.ready ? 'READY' : 'NOT READY'} (${(readiness.blockers || []).length} blockers). Approve to ship, reject for an explicit no-ship (recorded).`,
    title: 'Ship sign-off',
    context: {
      runId: ctx.runId,
      summary: {
        checklist: readiness.checklist,
        blockers: readiness.blockers,
        gateResults,
        integration,
      },
    },
  }, {
    breakpointId: 'backend.ship-signoff',
    expert: ['backend-architect', 'tech-lead'],
    tags: ['backend', 'deployment', 'signoff'],
    strategy: 'first-response-wins',
  });
  breakpointsHit.push('backend.ship-signoff');

  const deploymentReadiness = {
    ready: readiness.ready,
    checklist: readiness.checklist,
    blockers: readiness.blockers || [],
    signedOff: signoff.approved === true,
    signoffResponse: signoff.response || signoff.feedback || (signoff.approved ? 'approved' : 'no-ship'),
  };

  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const capture = await ctx.task(kipAssertTask, {
      ...sharedArgs,
      runId: ctx.runId,
      domainModel,
      contract,
      slices: sliceResults,
      gateResults,
      integration,
      deploymentReadiness,
    });
    kipFactsAsserted = capture.factsAsserted;
  }

  const reportPath = `${artifactsDir}/backend-service-delivery-${ctx.runId}.md`;
  const report = await ctx.task(finalReportTask, {
    ...sharedArgs, reportPath, contract, slices: sliceResults, gateResults, integration, deploymentReadiness,
  });

  const artifacts = [contract.contractPath, report.reportPath];
  if (readiness.runbookPath) artifacts.push(readiness.runbookPath);

  return {
    success:
      deploymentReadiness.signedOff &&
      integration.passed &&
      Object.values(gateResults).every((g) => g.passed),
    contract: { contractPath: contract.contractPath, endpoints: contract.endpoints, approved: true },
    slices: sliceResults,
    gateResults,
    integration,
    deploymentReadiness,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'backend-development/backend-service-delivery',
      runId: ctx.runId,
      boundedContext: domainModel.boundedContext,
      sliceCount: sliceResults.length,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
    },
  };
}
