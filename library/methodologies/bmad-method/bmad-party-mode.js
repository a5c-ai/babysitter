/**
 * @process methodologies/bmad-method/bmad-party-mode
 * @description BMAD Party Mode - Multi-agent collaborative sessions for complex decisions
 * @inputs { projectName: string, topic: string, participants?: array, sessionType?: string }
 * @outputs { success: boolean, consensus: object, decisions: array, actionItems: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * BMAD Party Mode - Multi-Agent Collaboration
 *
 * Adapted from the BMAD Method (https://github.com/bmad-code-org/BMAD-METHOD)
 * Party Mode enables multiple BMAD agent personas to collaborate on
 * complex decisions, reviews, or brainstorming sessions. Each agent
 * brings their specialized perspective to the discussion.
 *
 * Session Types:
 * - brainstorm: Creative ideation with all agents contributing
 * - review: Multi-perspective review of an artifact
 * - decision: Structured decision-making with diverse viewpoints
 * - retrospective: Cross-functional retrospective analysis
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.topic - Topic or artifact for collaborative session
 * @param {Array<string>} inputs.participants - Agent personas to include (default: all)
 * @param {string} inputs.sessionType - 'brainstorm', 'review', 'decision', 'retrospective' (default: 'brainstorm')
 * @param {Object} inputs.artifact - Artifact to review (for review/decision sessions)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Collaborative session results with consensus and action items
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    topic,
    participants = ['analyst', 'pm', 'architect', 'developer', 'scrum-master', 'qa', 'ux-designer'],
    sessionType = 'brainstorm',
    artifact = null
  } = inputs;

  // Gather individual perspectives in parallel
  const perspectives = await ctx.parallel.map(participants, async (participant) => {
    return ctx.task(gatherPerspectiveTask, {
      projectName,
      topic,
      participant,
      sessionType,
      artifact
    });
  });

  await ctx.breakpoint({
    question: `${participants.length} agents have provided their perspectives on "${topic}" for "${projectName}". Session type: ${sessionType}. Review individual perspectives before synthesis?`,
    title: 'BMAD Party Mode - Perspectives Gathered',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bmad/party-mode/perspectives.md', format: 'markdown', label: 'All Perspectives' }
      ]
    }
  });

  // Synthesize into consensus by BMad Master
  const consensusResult = await ctx.task(synthesizeConsensusTask, {
    projectName,
    topic,
    sessionType,
    perspectives,
    participants
  });

  // Generate action items
  const actionItemsResult = await ctx.task(generateActionItemsTask, {
    projectName,
    topic,
    consensus: consensusResult,
    participants
  });

  await ctx.breakpoint({
    question: `Party Mode session complete for "${topic}". Consensus: ${consensusResult.consensusLevel || 'reached'}. ${consensusResult.decisions?.length || 0} decisions made. ${actionItemsResult.actionItems?.length || 0} action items generated. Accept results?`,
    title: 'BMAD Party Mode - Session Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bmad/party-mode/consensus.md', format: 'markdown', label: 'Consensus' },
        { path: 'artifacts/bmad/party-mode/action-items.md', format: 'markdown', label: 'Action Items' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    topic,
    sessionType,
    participants,
    perspectives,
    consensus: consensusResult,
    decisions: consensusResult.decisions || [],
    actionItems: actionItemsResult.actionItems || [],
    artifacts: {
      perspectives: 'artifacts/bmad/party-mode/perspectives.md',
      consensus: 'artifacts/bmad/party-mode/consensus.md',
      actionItems: 'artifacts/bmad/party-mode/action-items.md'
    },
    metadata: {
      processId: 'methodologies/bmad-method/bmad-party-mode',
      timestamp: ctx.now(),
      framework: 'BMAD Method - Party Mode',
      source: 'https://github.com/bmad-code-org/BMAD-METHOD'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const AGENT_ROLES = {
  'analyst': { name: 'bmad-analyst-mary', persona: 'Mary (Analyst) - Strategic business analysis, market research, requirements' },
  'pm': { name: 'bmad-pm-john', persona: 'John (PM) - Product requirements, user value, stakeholder alignment' },
  'architect': { name: 'bmad-architect-winston', persona: 'Winston (Architect) - System design, technical decisions, scalability' },
  'developer': { name: 'bmad-dev-amelia', persona: 'Amelia (Developer) - Implementation feasibility, TDD, code quality' },
  'scrum-master': { name: 'bmad-sm-bob', persona: 'Bob (SM) - Agile process, story readiness, sprint planning' },
  'qa': { name: 'bmad-qa-quinn', persona: 'Quinn (QA) - Test coverage, quality gates, risk-based testing' },
  'ux-designer': { name: 'bmad-ux-sally', persona: 'Sally (UX) - User experience, accessibility, interaction design' },
  'tech-writer': { name: 'bmad-writer-paige', persona: 'Paige (Tech Writer) - Documentation clarity, knowledge structure' },
  'solo-dev': { name: 'bmad-solodev-barry', persona: 'Barry (Solo Dev) - Rapid full-stack, lean process, pragmatic shipping' }
};

export const gatherPerspectiveTask = defineTask('bmad-gather-perspective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Perspective: ${args.participant} on ${args.topic}`,
  description: `Gather ${args.participant} agent perspective for party mode session`,

  agent: {
    name: (AGENT_ROLES[args.participant] || AGENT_ROLES['analyst']).name,
    prompt: {
      role: (AGENT_ROLES[args.participant] || AGENT_ROLES['analyst']).persona,
      task: `Provide your specialized perspective on: ${args.topic}`,
      context: {
        projectName: args.projectName,
        topic: args.topic,
        sessionType: args.sessionType,
        artifact: args.artifact
      },
      instructions: [
        `You are participating in a ${args.sessionType} session about: ${args.topic}`,
        'Provide your unique perspective based on your domain expertise',
        'Identify risks and opportunities from your point of view',
        'Suggest specific recommendations within your domain',
        'Flag any concerns or blockers you see',
        'Be constructive and specific in your feedback',
        'Prioritize your top 3 insights'
      ],
      outputFormat: 'JSON with perspective insights, recommendations, and concerns'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'recommendations', 'concerns'],
      properties: {
        participant: { type: 'string' },
        insights: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        concerns: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        topPriority: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: []
  },

  labels: ['agent', 'bmad', 'party-mode', 'perspective', args.participant]
}));

export const synthesizeConsensusTask = defineTask('bmad-synthesize-consensus', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synthesize Consensus: ${args.topic}`,
  description: 'BMad Master synthesizes multi-agent perspectives into consensus',

  agent: {
    name: 'bmad-master',
    prompt: {
      role: 'BMad Master - Orchestrator synthesizing diverse agent perspectives into actionable consensus',
      task: 'Synthesize all agent perspectives into consensus decisions',
      context: args,
      instructions: [
        'Review all agent perspectives and identify common themes',
        'Identify areas of agreement and disagreement',
        'Resolve conflicts using evidence and domain expertise weight',
        'Formulate clear decisions with rationale',
        'Document dissenting views and their merits',
        'Assess consensus level (strong, moderate, weak)',
        'Prioritize decisions by impact',
        'Identify remaining open questions'
      ],
      outputFormat: 'JSON with consensus decisions, rationale, and dissenting views'
    },
    outputSchema: {
      type: 'object',
      required: ['consensusLevel', 'decisions', 'themes'],
      properties: {
        consensusLevel: { type: 'string' },
        decisions: { type: 'array', items: { type: 'object' } },
        themes: { type: 'array', items: { type: 'string' } },
        agreements: { type: 'array', items: { type: 'string' } },
        disagreements: { type: 'array', items: { type: 'object' } },
        openQuestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/party-mode/perspectives.md', format: 'markdown' },
      { path: 'artifacts/bmad/party-mode/consensus.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'party-mode', 'consensus', 'bmad-master']
}));

export const generateActionItemsTask = defineTask('bmad-generate-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Action Items: ${args.topic}`,
  description: 'BMad Master generates actionable items from consensus',

  agent: {
    name: 'bmad-master',
    prompt: {
      role: 'BMad Master - Converting consensus into assigned, trackable action items',
      task: 'Generate action items from party mode consensus',
      context: args,
      instructions: [
        'Create specific, actionable items from each decision',
        'Assign items to appropriate agent roles',
        'Set priority levels for each action',
        'Define completion criteria',
        'Identify dependencies between actions',
        'Estimate effort for each action'
      ],
      outputFormat: 'JSON with prioritized action items assigned to agents'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              action: { type: 'string' },
              assignedTo: { type: 'string' },
              priority: { type: 'string' },
              completionCriteria: { type: 'string' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        totalItems: { type: 'number' },
        criticalPath: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/party-mode/action-items.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'party-mode', 'action-items', 'bmad-master']
}));
