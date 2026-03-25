/**
 * @process methodologies/consensus-and-voting-mechanisms
 * @description Multi-Agent Consensus - Execute task with multiple agents and reach consensus through voting
 * @inputs { task: string, agentCount: number, votingStrategy: string, consensusThreshold: number }
 * @outputs { success: boolean, consensus: object, votes: array, finalDecision: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Consensus and Voting Mechanisms Process
 *
 * Methodology: Multiple agents independently solve task → Each votes on proposals → Consensus emerges
 *
 * This process implements democratic decision-making where:
 * 1. Multiple agents independently work on the same task
 * 2. Each agent proposes a solution
 * 3. All agents review and vote on all proposals
 * 4. Consensus is reached through voting mechanisms (majority, supermajority, ranked choice, etc.)
 * 5. If no consensus, iterate with refinements
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task for agents to solve
 * @param {number} inputs.agentCount - Number of agents to participate (default: 3)
 * @param {string} inputs.votingStrategy - Voting method: 'majority', 'supermajority', 'unanimous', 'ranked-choice'
 * @param {number} inputs.consensusThreshold - Required agreement percentage (default: 66.7)
 * @param {number} inputs.maxRounds - Maximum consensus rounds (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with consensus decision
 */
export async function process(inputs, ctx) {
  const {
    task,
    agentCount = 3,
    votingStrategy = 'majority',
    consensusThreshold = 66.7,
    maxRounds = 3
  } = inputs;

  let round = 0;
  let consensusReached = false;
  const rounds = [];

  while (!consensusReached && round < maxRounds) {
    round++;

    // Phase 1: Independent proposal generation
    const proposals = [];
    for (let i = 0; i < agentCount; i++) {
      const proposal = await ctx.task(agentProposeTask, {
        task,
        agentId: i + 1,
        agentCount,
        round,
        previousRounds: rounds
      });
      proposals.push({
        agentId: i + 1,
        proposal
      });
    }

    // Phase 2: Voting - each agent votes on all proposals
    const votes = [];
    for (let voterId = 1; voterId <= agentCount; voterId++) {
      const vote = await ctx.task(agentVoteTask, {
        task,
        voterId,
        proposals,
        round,
        votingStrategy,
        previousRounds: rounds
      });
      votes.push(vote);
    }

    // Phase 3: Tally votes and check for consensus
    const tallyResult = await ctx.task(tallyVotesTask, {
      task,
      proposals,
      votes,
      votingStrategy,
      consensusThreshold,
      round
    });

    rounds.push({
      round,
      proposals,
      votes,
      tally: tallyResult,
      timestamp: ctx.now()
    });

    consensusReached = tallyResult.consensusReached;

    // Optional: Breakpoint for human review
    if (!consensusReached && round < maxRounds && inputs.reviewEachRound) {
      await ctx.breakpoint({
        question: `Round ${round}: No consensus (${tallyResult.consensusPercentage.toFixed(1)}% < ${consensusThreshold}%). Continue to round ${round + 1}?`,
        title: `Consensus Round ${round}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/round-${round}-proposals.json`, format: 'json' },
            { path: `artifacts/round-${round}-votes.json`, format: 'json' },
            { path: `artifacts/round-${round}-tally.md`, format: 'markdown' }
          ]
        }
      });
    }
  }

  // Final result
  const finalRound = rounds[rounds.length - 1];
  const success = consensusReached;

  return {
    success,
    task,
    agentCount,
    votingStrategy,
    consensusThreshold,
    totalRounds: round,
    consensusReached,
    finalDecision: finalRound.tally.winningProposal,
    consensusPercentage: finalRound.tally.consensusPercentage,
    rounds,
    summary: {
      totalRounds: round,
      consensusAchieved: consensusReached,
      votingStrategy,
      finalConsensusLevel: finalRound.tally.consensusPercentage,
      winningProposalAgent: finalRound.tally.winningProposal?.agentId,
      votingHistory: rounds.map(r => ({
        round: r.round,
        consensusPercentage: r.tally.consensusPercentage,
        topProposal: r.tally.winningProposal?.agentId
      }))
    },
    metadata: {
      processId: 'methodologies/consensus-and-voting-mechanisms',
      timestamp: ctx.now()
    }
  };
}

/**
 * Agent proposal generation task
 */
export const agentProposeTask = defineTask('agent-propose', (args, taskCtx) => ({
  kind: 'agent',
  title: `Agent ${args.agentId} - Generate proposal (Round ${args.round})`,
  description: 'Independently develop solution proposal',

  agent: {
    name: `consensus-proposer-${args.agentId}`,
    prompt: {
      role: `independent problem solver (Agent ${args.agentId} of ${args.agentCount})`,
      task: 'Develop your best solution to the task',
      context: {
        task: args.task,
        agentId: args.agentId,
        round: args.round,
        previousRounds: args.previousRounds
      },
      instructions: [
        'Analyze the task independently',
        'Develop your best solution approach',
        'If this is not round 1, review previous round feedback',
        'Consider alternative perspectives and approaches',
        'Be creative but practical',
        'Justify your approach with clear reasoning',
        'Provide implementation details',
        'Identify potential risks and mitigation strategies'
      ],
      outputFormat: 'JSON with approach, implementation, justification, risks, and confidence level'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'implementation', 'justification', 'confidence'],
      properties: {
        approach: { type: 'string' },
        implementation: { type: 'string' },
        justification: { type: 'string' },
        risks: { type: 'array', items: { type: 'string' } },
        mitigations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 100 }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'consensus', 'proposal', `agent-${args.agentId}`, `round-${args.round}`]
}));

/**
 * Agent voting task
 */
export const agentVoteTask = defineTask('agent-vote', (args, taskCtx) => ({
  kind: 'agent',
  title: `Agent ${args.voterId} - Cast votes (Round ${args.round})`,
  description: 'Evaluate all proposals and vote',

  agent: {
    name: `consensus-voter-${args.voterId}`,
    prompt: {
      role: `objective evaluator (Voter ${args.voterId})`,
      task: 'Review all proposals and cast your votes',
      context: {
        task: args.task,
        voterId: args.voterId,
        proposals: args.proposals,
        round: args.round,
        votingStrategy: args.votingStrategy
      },
      instructions: [
        'Review each proposal objectively',
        'Evaluate based on: correctness, feasibility, completeness, quality, risk management',
        'Do not favor your own proposal - be objective',
        'If voting strategy is "ranked-choice", rank all proposals from best to worst',
        'If voting strategy is "majority", "supermajority", or "unanimous", vote for the best proposal',
        'Provide reasoning for your vote(s)',
        'Consider trade-offs between different approaches',
        'Focus on which solution best solves the task'
      ],
      outputFormat: args.votingStrategy === 'ranked-choice'
        ? 'JSON with rankings array (ordered by preference) and reasoning'
        : 'JSON with selectedProposalId and reasoning'
    },
    outputSchema: args.votingStrategy === 'ranked-choice'
      ? {
          type: 'object',
          required: ['rankings', 'reasoning'],
          properties: {
            rankings: {
              type: 'array',
              items: { type: 'number' },
              description: 'Ordered array of proposal agent IDs from best to worst'
            },
            reasoning: { type: 'string' }
          }
        }
      : {
          type: 'object',
          required: ['selectedProposalId', 'reasoning'],
          properties: {
            selectedProposalId: { type: 'number' },
            reasoning: { type: 'string' }
          }
        }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'consensus', 'voting', `voter-${args.voterId}`, `round-${args.round}`]
}));

/**
 * Vote tallying task (can be node or agent)
 */
export const tallyVotesTask = defineTask('tally-votes', (args, taskCtx) => ({
  kind: 'node',
  title: `Tally votes - Round ${args.round}`,
  description: 'Count votes and determine consensus',

  script: async () => {
    const { proposals, votes, votingStrategy, consensusThreshold } = args;

    let winningProposal = null;
    let consensusPercentage = 0;
    let consensusReached = false;

    if (votingStrategy === 'ranked-choice') {
      // Implement instant runoff voting
      const rankings = votes.map(v => v.rankings);
      // Simplified: Use Borda count method
      const scores = {};
      proposals.forEach(p => {
        scores[p.agentId] = 0;
      });

      rankings.forEach(ranking => {
        ranking.forEach((agentId, index) => {
          scores[agentId] += proposals.length - index;
        });
      });

      const maxScore = Math.max(...Object.values(scores));
      const winnerId = parseInt(Object.keys(scores).find(id => scores[id] === maxScore));
      winningProposal = proposals.find(p => p.agentId === winnerId);
      consensusPercentage = (maxScore / (proposals.length * proposals.length)) * 100;

    } else {
      // Majority, supermajority, or unanimous
      const voteCounts = {};
      proposals.forEach(p => {
        voteCounts[p.agentId] = 0;
      });

      votes.forEach(vote => {
        voteCounts[vote.selectedProposalId]++;
      });

      const maxVotes = Math.max(...Object.values(voteCounts));
      const winnerId = parseInt(Object.keys(voteCounts).find(id => voteCounts[id] === maxVotes));
      winningProposal = proposals.find(p => p.agentId === winnerId);
      consensusPercentage = (maxVotes / votes.length) * 100;
    }

    consensusReached = consensusPercentage >= consensusThreshold;

    return {
      winningProposal,
      consensusPercentage,
      consensusReached,
      votingStrategy,
      consensusThreshold,
      voteBreakdown: votes.reduce((acc, vote) => {
        const id = vote.selectedProposalId || 'ranked';
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {})
    };
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['node', 'consensus', 'tally', `round-${args.round}`]
}));
