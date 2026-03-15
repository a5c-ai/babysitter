/**
 * @process methodologies/adversarial-spec-debates
 * @description Adversarial Specification Debates - Two or more agents debate specifications and approaches
 * @inputs { task: string, debateRounds: number, participantRoles: array }
 * @outputs { success: boolean, finalSpec: object, debateHistory: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Adversarial Specification Debates Process
 *
 * Methodology: Agent proposes spec → Opponent challenges → Back-and-forth debate → Judge evaluates → Iterate
 *
 * This process implements adversarial collaboration where:
 * 1. A proposer agent creates an initial specification
 * 2. One or more opponent agents challenge assumptions, find flaws, propose alternatives
 * 3. Proposer defends or adapts the specification
 * 4. Multiple rounds of debate refine the spec
 * 5. A judge agent evaluates arguments and determines the strongest specification
 * 6. Process continues until a robust, well-defended spec emerges
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task requiring specification
 * @param {number} inputs.debateRounds - Number of debate rounds (default: 3)
 * @param {Array<string>} inputs.participantRoles - Roles for debate participants
 * @param {boolean} inputs.requireJudgeApproval - Require judge to approve final spec (default: true)
 * @param {number} inputs.convergenceThreshold - Similarity threshold for convergence (default: 85)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with final specification
 */
export async function process(inputs, ctx) {
  const {
    task,
    debateRounds = 3,
    participantRoles = ['proposer', 'security-critic', 'performance-critic'],
    requireJudgeApproval = true,
    convergenceThreshold = 85
  } = inputs;

  let round = 0;
  let specApproved = false;
  const debateHistory = [];
  let currentSpec = null;

  // Initial specification proposal
  const initialSpec = await ctx.task(agentProposeSpecTask, {
    task,
    round: 0,
    role: participantRoles[0] || 'proposer',
    previousSpec: null,
    previousDebates: []
  });

  currentSpec = initialSpec;
  debateHistory.push({
    round: 0,
    phase: 'initial-proposal',
    role: participantRoles[0],
    spec: initialSpec,
    timestamp: ctx.now()
  });

  // Debate rounds
  while (!specApproved && round < debateRounds) {
    round++;

    // Phase 1: Opponents challenge the specification
    const challenges = [];
    for (let i = 1; i < participantRoles.length; i++) {
      const role = participantRoles[i];
      const challenge = await ctx.task(agentChallengeTask, {
        task,
        round,
        role,
        currentSpec,
        previousChallenges: challenges,
        debateHistory
      });
      challenges.push({
        role,
        challenge
      });
    }

    debateHistory.push({
      round,
      phase: 'challenges',
      challenges,
      timestamp: ctx.now()
    });

    // Phase 2: Proposer responds and refines specification
    const refinedSpec = await ctx.task(agentRefineSpecTask, {
      task,
      round,
      role: participantRoles[0],
      currentSpec,
      challenges,
      debateHistory
    });

    currentSpec = refinedSpec;
    debateHistory.push({
      round,
      phase: 'refinement',
      role: participantRoles[0],
      spec: refinedSpec,
      timestamp: ctx.now()
    });

    // Phase 3: Judge evaluates the debate and refined spec
    const judgement = await ctx.task(agentJudgeTask, {
      task,
      round,
      currentSpec,
      challenges,
      refinedSpec,
      convergenceThreshold,
      debateHistory
    });

    debateHistory.push({
      round,
      phase: 'judgement',
      judgement,
      timestamp: ctx.now()
    });

    // Check for approval or convergence
    specApproved = requireJudgeApproval
      ? judgement.approved
      : judgement.convergenceScore >= convergenceThreshold;

    if (!specApproved && round < debateRounds && inputs.reviewEachRound) {
      await ctx.breakpoint({
        question: `Round ${round}: Spec ${judgement.approved ? 'approved' : 'needs refinement'}. Convergence: ${judgement.convergenceScore}%. Continue debate?`,
        title: `Adversarial Debate - Round ${round}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/round-${round}-spec.md`, format: 'markdown' },
            { path: `artifacts/round-${round}-challenges.json`, format: 'json' },
            { path: `artifacts/round-${round}-judgement.md`, format: 'markdown' }
          ]
        }
      });
    }
  }

  // Final result
  const finalJudgement = debateHistory
    .filter(h => h.phase === 'judgement')
    .pop();

  return {
    success: specApproved,
    task,
    totalRounds: round,
    specApproved,
    finalSpec: currentSpec,
    finalJudgement,
    debateHistory,
    summary: {
      totalRounds: round,
      specApproved,
      participantRoles,
      convergenceScore: finalJudgement?.judgement?.convergenceScore || 0,
      majorIssuesResolved: finalJudgement?.judgement?.majorIssuesResolved || [],
      remainingConcerns: finalJudgement?.judgement?.remainingConcerns || []
    },
    metadata: {
      processId: 'methodologies/adversarial-spec-debates',
      timestamp: ctx.now()
    }
  };
}

/**
 * Initial specification proposal task
 */
export const agentProposeSpecTask = defineTask('agent-propose-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `${args.role} - Propose specification (Round ${args.round})`,
  description: 'Create initial specification for the task',

  agent: {
    name: `spec-proposer-${args.role}`,
    prompt: {
      role: args.role || 'specification proposer',
      task: 'Develop a comprehensive specification for the task',
      context: {
        task: args.task,
        round: args.round,
        previousSpec: args.previousSpec,
        previousDebates: args.previousDebates
      },
      instructions: [
        'Analyze the task requirements thoroughly',
        'Create a detailed, well-structured specification',
        'Include: objectives, requirements, architecture, implementation approach, constraints',
        'Consider security, performance, scalability, and maintainability',
        'Anticipate potential challenges and edge cases',
        'Be specific and actionable',
        'Justify key decisions'
      ],
      outputFormat: 'JSON with objectives, requirements, architecture, implementation, constraints, and justification'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'requirements', 'architecture', 'implementation'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        requirements: {
          type: 'object',
          properties: {
            functional: { type: 'array', items: { type: 'string' } },
            nonFunctional: { type: 'array', items: { type: 'string' } }
          }
        },
        architecture: { type: 'string' },
        implementation: { type: 'string' },
        constraints: { type: 'array', items: { type: 'string' } },
        justification: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'adversarial-debate', 'proposal', `round-${args.round}`]
}));

/**
 * Challenge task - opponent finds flaws
 */
export const agentChallengeTask = defineTask('agent-challenge', (args, taskCtx) => ({
  kind: 'agent',
  title: `${args.role} - Challenge specification (Round ${args.round})`,
  description: 'Find flaws, risks, and weaknesses in the specification',

  agent: {
    name: `spec-challenger-${args.role}`,
    prompt: {
      role: args.role,
      task: 'Challenge the specification from your perspective',
      context: {
        task: args.task,
        round: args.round,
        currentSpec: args.currentSpec,
        previousChallenges: args.previousChallenges,
        debateHistory: args.debateHistory
      },
      instructions: [
        `Review the specification critically from the perspective of a ${args.role}`,
        'Identify flaws, gaps, and weaknesses',
        'Challenge assumptions and decisions',
        'Propose alternative approaches where applicable',
        'Focus on your area of expertise (security, performance, etc.)',
        'Be constructive but rigorous',
        'Provide specific examples and scenarios',
        'Suggest concrete improvements'
      ],
      outputFormat: 'JSON with flaws, risks, alternatives, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['flaws', 'risks', 'recommendations'],
      properties: {
        flaws: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              impact: { type: 'string' }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string' }
            }
          }
        },
        alternatives: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'adversarial-debate', 'challenge', `role-${args.role}`, `round-${args.round}`]
}));

/**
 * Refinement task - proposer responds to challenges
 */
export const agentRefineSpecTask = defineTask('agent-refine-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `${args.role} - Refine specification (Round ${args.round})`,
  description: 'Address challenges and improve specification',

  agent: {
    name: `spec-refiner-${args.role}`,
    prompt: {
      role: args.role,
      task: 'Refine the specification based on challenges received',
      context: {
        task: args.task,
        round: args.round,
        currentSpec: args.currentSpec,
        challenges: args.challenges,
        debateHistory: args.debateHistory
      },
      instructions: [
        'Review all challenges carefully',
        'Address valid concerns and flaws',
        'Defend decisions where challenges are not applicable',
        'Incorporate improvements and alternatives where appropriate',
        'Maintain specification coherence and consistency',
        'Update requirements, architecture, or implementation as needed',
        'Document changes and rationale',
        'Strengthen weak areas identified by critics'
      ],
      outputFormat: 'JSON with updated spec and responses to each challenge'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'requirements', 'architecture', 'implementation', 'changeLog'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        requirements: {
          type: 'object',
          properties: {
            functional: { type: 'array', items: { type: 'string' } },
            nonFunctional: { type: 'array', items: { type: 'string' } }
          }
        },
        architecture: { type: 'string' },
        implementation: { type: 'string' },
        constraints: { type: 'array', items: { type: 'string' } },
        changeLog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              challengeAddressed: { type: 'string' },
              response: { type: 'string' },
              action: { type: 'string', enum: ['accepted', 'modified', 'rejected'] },
              justification: { type: 'string' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'adversarial-debate', 'refinement', `round-${args.round}`]
}));

/**
 * Judge task - evaluate debate and spec quality
 */
export const agentJudgeTask = defineTask('agent-judge', (args, taskCtx) => ({
  kind: 'agent',
  title: `Judge - Evaluate Round ${args.round}`,
  description: 'Assess debate quality and spec convergence',

  agent: {
    name: 'spec-judge',
    prompt: {
      role: 'impartial judge and technical expert',
      task: 'Evaluate the debate and determine if specification is ready',
      context: {
        task: args.task,
        round: args.round,
        currentSpec: args.currentSpec,
        challenges: args.challenges,
        refinedSpec: args.refinedSpec,
        convergenceThreshold: args.convergenceThreshold,
        debateHistory: args.debateHistory
      },
      instructions: [
        'Review the entire debate round objectively',
        'Evaluate how well challenges were addressed',
        'Assess specification completeness and quality',
        'Determine if major issues have been resolved',
        'Check for consistency and coherence',
        'Compare refined spec with original - measure convergence',
        'Identify any remaining concerns or gaps',
        'Decide if specification is ready for approval',
        'Provide constructive feedback for next round if not approved'
      ],
      outputFormat: 'JSON with approved status, convergence score, assessment, and feedback'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'convergenceScore', 'assessment'],
      properties: {
        approved: { type: 'boolean' },
        convergenceScore: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'string' },
        majorIssuesResolved: { type: 'array', items: { type: 'string' } },
        remainingConcerns: { type: 'array', items: { type: 'string' } },
        feedbackForNextRound: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'adversarial-debate', 'judge', `round-${args.round}`]
}));
