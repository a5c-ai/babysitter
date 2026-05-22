/**
 * @process claude-server-mode-transport
 * @description Implement and validate a real Claude server-mode / channels transport in agent-mux with explicit research, integration, verification, and adversarial review.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const researchTask = defineTask('research-claude-server-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research Claude server-mode and channels transport requirements',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior integration architect',
      task: 'Research the current Claude transport gap in agent-mux and define the exact implementation contract for a real server-mode / channels transport.',
      context: {
        workspaceRoot: args.workspaceRoot,
        scope: args.scope,
        docsToCheck: args.researchInputs?.docsToCheck ?? [],
        repoAreas: args.researchInputs?.repoAreas ?? [],
      },
      instructions: [
        'Read the current adapter, core, gateway, and webui code related to Claude transports and session semantics.',
        'Check the referenced Claude docs and distinguish clearly between remote-control server mode, channels, Claude CLI interactive mode, and claude-agent-sdk.',
        'Produce an implementation contract that is honest about capabilities and surfaces.',
        'List the required code changes, tests, docs changes, and proof strategy.',
        'Return strict JSON only with keys: { findings: string[], implementationPlan: string[], codeTargets: string[], verificationCommands: string[], risks: string[], acceptanceCriteria: string[] }.'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'implementationPlan', 'codeTargets', 'verificationCommands', 'acceptanceCriteria']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const implementTask = defineTask('implement-claude-server-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude server-mode / channels transport',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript full-stack engineer',
      task: 'Implement the Claude server-mode / channels transport changes in agent-mux.',
      context: {
        workspaceRoot: args.workspaceRoot,
        scope: args.scope,
        research: args.research,
        feedback: args.feedback ?? null,
        attempt: args.attempt ?? 1
      },
      instructions: [
        'Actually edit the repo and implement the researched transport changes.',
        'Keep capability semantics honest. Do not claim unsupported interactive or structured behaviors.',
        'Update adapters, core, gateway semantics, docs, and focused tests where required by the implementation.',
        'If the docs show that a direct app-server equivalent does not exist, model the supported surface explicitly instead of faking parity.',
        'If this is a refinement pass, address all review feedback before anything else.',
        'Run targeted verification needed to support your changes when practical.',
        'Return strict JSON only with keys: { summary: string, filesModified: string[], testsTouched: string[], commandsRun: string[], residualRisks: string[] }.'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesModified']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const verifyTask = defineTask('verify-claude-server-mode', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run focused verification for Claude server-mode transport',
  shell: {
    command: [
      `cd "${args.workspaceRoot}"`,
      'npx tsc -b packages/agent-mux/adapters packages/agent-mux/core packages/agent-mux/gateway packages/agent-mux/ui packages/agent-mux/webui --pretty false',
      'npm exec vitest run packages/agent-mux/adapters/tests/claude-agent-sdk-adapter.test.ts packages/agent-mux/gateway/tests/e2e.test.ts --reporter=dot'
    ].join(' ; '),
    expectedExitCode: 0,
    timeout: 1800000
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const reviewTask = defineTask('review-claude-server-mode', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adversarial review of Claude server-mode transport changes',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Adversarial code reviewer',
      task: 'Review the Claude server-mode / channels transport implementation for correctness, honesty of capability claims, and end-to-end fit.',
      context: {
        workspaceRoot: args.workspaceRoot,
        scope: args.scope,
        research: args.research,
        targetScore: args.targetScore
      },
      instructions: [
        'Read the modified code and relevant tests.',
        'Check for false capability claims, semantic mismatches, missing integration points, and missing tests.',
        'Be strict about the difference between real transport support and inferred support.',
        'Score the result from 0-100.',
        'Return strict JSON only with keys: { score: number, passesTarget: boolean, findings: string[], feedback: string, followups: string[] }.'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passesTarget', 'findings', 'feedback']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const browserProofTask = defineTask('browser-proof-if-applicable', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess and capture real proof strategy for the new Claude transport',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Verification engineer',
      task: 'Assess whether a real browser or transport proof was added for the new Claude transport and record the honest proof status.',
      context: {
        workspaceRoot: args.workspaceRoot,
        scope: args.scope,
        implementationSummary: args.implementationSummary,
        reviewFindings: args.reviewFindings
      },
      instructions: [
        'Inspect the code and tests added in this run.',
        'State exactly what proof exists and what proof is still missing.',
        'Do not overclaim live transport validation if only static or unit-level validation exists.',
        'Return strict JSON only with keys: { proofStatus: string, confirmedProofs: string[], missingProofs: string[] }.'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['proofStatus', 'confirmedProofs', 'missingProofs']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

export async function process(inputs = {}, ctx) {
  const workspaceRoot = inputs.workspaceRoot ?? 'C:/work/agent-mux';
  const scope = inputs.scope ?? 'Implement real Claude server-mode / channels transport support in agent-mux.';
  const targetScore = Number(inputs.targetScore ?? 95);
  const maxRefinementPasses = Number(inputs.maxRefinementPasses ?? 3);

  const research = await ctx.task(researchTask, {
    workspaceRoot,
    scope,
    researchInputs: inputs.researchInputs ?? {}
  });

  const architectureApproval = await ctx.breakpoint({
    question: 'Approve this orchestration scope for the Claude server-mode / channels transport run?',
    title: 'Process Scope Confirmation',
    context: {
      researchFindings: research.findings,
      implementationPlan: research.implementationPlan,
      acceptanceCriteria: research.acceptanceCriteria
    }
  });

  if (!architectureApproval.approved) {
    return {
      status: 'stopped',
      reason: architectureApproval.response || architectureApproval.feedback || 'Process scope was not approved.'
    };
  }

  let implementation = null;
  let verification = null;
  let review = null;
  let attempt = 1;
  let feedback = null;

  while (attempt <= maxRefinementPasses) {
    implementation = await ctx.task(implementTask, {
      workspaceRoot,
      scope,
      research,
      attempt,
      feedback
    });

    verification = await ctx.task(verifyTask, {
      workspaceRoot
    });

    review = await ctx.task(reviewTask, {
      workspaceRoot,
      scope,
      research,
      targetScore
    });

    if (review.passesTarget && Number(review.score) >= targetScore) {
      break;
    }

    feedback = review.feedback;
    attempt += 1;
  }

  const proof = await ctx.task(browserProofTask, {
    workspaceRoot,
    scope,
    implementationSummary: implementation?.summary ?? '',
    reviewFindings: review?.findings ?? []
  });

  await ctx.breakpoint({
    question: `Review result score ${review?.score ?? 'unknown'}. Approve the Claude transport implementation result?`,
    title: 'Final Review Gate',
    context: {
      implementation,
      verification,
      review,
      proof
    }
  });

  return {
    status: review?.passesTarget ? 'completed' : 'needs-followup',
    score: review?.score ?? null,
    implementation,
    verification,
    review,
    proof
  };
}
