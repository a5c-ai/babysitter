/**
 * @process methodologies/bmad-method/bmad-analysis
 * @description BMAD Analysis Phase - Deep research and product brief creation with Mary (Analyst)
 * @inputs { projectName: string, projectDescription: string, researchDepth?: string, domainContext?: string }
 * @outputs { success: boolean, research: object, productBrief: object, recommendations: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * BMAD Analysis Phase - Deep Research and Product Brief
 *
 * Adapted from the BMAD Method (https://github.com/bmad-code-org/BMAD-METHOD)
 * Standalone analysis phase driven by Mary (Analyst) persona.
 * Conducts market, domain, and technical research before creating
 * a comprehensive product brief.
 *
 * Research types:
 * - Market Research: competitors, market size, trends, opportunities
 * - Domain Research: problem space, user pain points, stakeholders
 * - Technical Research: feasibility, technology options, constraints
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.projectDescription - High-level project description
 * @param {string} inputs.researchDepth - 'shallow', 'standard', 'deep' (default: 'standard')
 * @param {string} inputs.domainContext - Domain-specific context (optional)
 * @param {Array<string>} inputs.researchFocus - Specific research areas to focus on (optional)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Research findings and product brief
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    projectDescription,
    researchDepth = 'standard',
    domainContext = null,
    researchFocus = ['market', 'domain', 'technical']
  } = inputs;

  // Market research
  const marketResearch = researchFocus.includes('market')
    ? await ctx.task(marketResearchTask, { projectName, projectDescription, researchDepth, domainContext })
    : null;

  // Domain research
  const domainResearch = researchFocus.includes('domain')
    ? await ctx.task(domainDeepDiveTask, { projectName, projectDescription, researchDepth, domainContext })
    : null;

  // Technical feasibility research
  const technicalResearch = researchFocus.includes('technical')
    ? await ctx.task(technicalFeasibilityTask, { projectName, projectDescription, researchDepth, domainContext })
    : null;

  await ctx.breakpoint({
    question: `Research phase complete for "${projectName}". Mary (Analyst) conducted ${researchFocus.length} research streams at ${researchDepth} depth. Review findings before product brief creation?`,
    title: 'BMAD Analysis - Research Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bmad/analysis/market-research.md', format: 'markdown', label: 'Market Research' },
        { path: 'artifacts/bmad/analysis/domain-research.md', format: 'markdown', label: 'Domain Research' },
        { path: 'artifacts/bmad/analysis/technical-research.md', format: 'markdown', label: 'Technical Research' }
      ]
    }
  });

  // Synthesize into product brief
  const productBrief = await ctx.task(synthesizeProductBriefTask, {
    projectName,
    projectDescription,
    marketResearch,
    domainResearch,
    technicalResearch,
    researchDepth
  });

  await ctx.breakpoint({
    question: `Product Brief created for "${projectName}". Problem: "${productBrief.problemStatement?.substring(0, 100) || 'defined'}...". ${productBrief.featureThemes?.length || 0} feature themes identified. Approve analysis phase output?`,
    title: 'BMAD Analysis - Product Brief Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/bmad/analysis/product-brief.md', format: 'markdown', label: 'Product Brief' }
      ]
    }
  });

  return {
    success: true,
    projectName,
    researchDepth,
    research: { market: marketResearch, domain: domainResearch, technical: technicalResearch },
    productBrief,
    recommendations: productBrief.nextSteps || [],
    artifacts: {
      marketResearch: 'artifacts/bmad/analysis/market-research.md',
      domainResearch: 'artifacts/bmad/analysis/domain-research.md',
      technicalResearch: 'artifacts/bmad/analysis/technical-research.md',
      productBrief: 'artifacts/bmad/analysis/product-brief.md'
    },
    metadata: {
      processId: 'methodologies/bmad-method/bmad-analysis',
      timestamp: ctx.now(),
      framework: 'BMAD Method - Analysis Phase',
      agent: 'Mary (Analyst)',
      source: 'https://github.com/bmad-code-org/BMAD-METHOD'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const marketResearchTask = defineTask('bmad-market-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Research: ${args.projectName}`,
  description: 'Mary (Analyst) conducts market research with competitive analysis',

  agent: {
    name: 'bmad-analyst-mary',
    prompt: {
      role: 'Mary - Strategic Business Analyst applying competitive intelligence frameworks like Porter\'s Five Forces and SWOT analysis',
      task: 'Conduct comprehensive market research for the project',
      context: args,
      instructions: [
        'Identify direct and indirect competitors',
        'Analyze market size and growth trajectory',
        'Map industry trends and emerging opportunities',
        'Apply SWOT analysis for competitive positioning',
        'Identify market gaps and unmet needs',
        'Assess barriers to entry',
        'Define target market segments',
        'Evaluate pricing models in the space',
        `Scale depth to ${args.researchDepth} level`
      ],
      outputFormat: 'JSON with market analysis organized by competitors, trends, and opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'marketSize', 'trends'],
      properties: {
        competitors: { type: 'array', items: { type: 'object' } },
        marketSize: { type: 'string' },
        trends: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        swotAnalysis: { type: 'object' },
        targetSegments: { type: 'array', items: { type: 'object' } },
        barriers: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/analysis/market-research.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'analysis', 'market-research', 'mary']
}));

export const domainDeepDiveTask = defineTask('bmad-domain-deep-dive', (args, taskCtx) => ({
  kind: 'agent',
  title: `Domain Research: ${args.projectName}`,
  description: 'Mary (Analyst) performs deep domain research and stakeholder analysis',

  agent: {
    name: 'bmad-analyst-mary',
    prompt: {
      role: 'Mary - Business Analyst uncovering root causes and ensuring all stakeholder perspectives are captured',
      task: 'Conduct deep domain research to understand problem space and user needs',
      context: args,
      instructions: [
        'Map the complete problem space and root causes',
        'Identify all stakeholder groups and their needs',
        'Create user personas with pain points and goals',
        'Analyze existing solutions and their shortcomings',
        'Document domain-specific terminology and concepts',
        'Identify regulatory or compliance requirements',
        'Map user workflows and touchpoints',
        'Document assumptions requiring validation',
        `Scale depth to ${args.researchDepth} level`
      ],
      outputFormat: 'JSON with domain analysis, stakeholders, personas, and assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['problemSpace', 'stakeholders', 'personas'],
      properties: {
        problemSpace: { type: 'string' },
        rootCauses: { type: 'array', items: { type: 'string' } },
        stakeholders: { type: 'array', items: { type: 'object' } },
        personas: { type: 'array', items: { type: 'object' } },
        existingSolutions: { type: 'array', items: { type: 'object' } },
        domainTerminology: { type: 'object' },
        complianceRequirements: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/analysis/domain-research.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'analysis', 'domain-research', 'mary']
}));

export const technicalFeasibilityTask = defineTask('bmad-technical-feasibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Technical Research: ${args.projectName}`,
  description: 'Mary (Analyst) evaluates technical feasibility and technology options',

  agent: {
    name: 'bmad-analyst-mary',
    prompt: {
      role: 'Mary - Business Analyst evaluating technical feasibility with systematic methodology',
      task: 'Evaluate technical feasibility, technology options, and constraints',
      context: args,
      instructions: [
        'Assess technical feasibility of proposed solution',
        'Evaluate technology stack options with pros/cons',
        'Identify technical constraints and limitations',
        'Assess integration requirements with existing systems',
        'Evaluate build vs buy decisions',
        'Estimate technical complexity and effort ranges',
        'Identify technical risks with mitigation strategies',
        'Recommend technology approach with justification',
        `Scale depth to ${args.researchDepth} level`
      ],
      outputFormat: 'JSON with feasibility assessment, technology evaluation, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['feasibilityRating', 'technologyOptions', 'recommendations'],
      properties: {
        feasibilityRating: { type: 'string' },
        technologyOptions: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'array', items: { type: 'string' } },
        integrationRequirements: { type: 'array', items: { type: 'object' } },
        buildVsBuy: { type: 'object' },
        complexityEstimate: { type: 'string' },
        technicalRisks: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/analysis/technical-research.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'analysis', 'technical-research', 'mary']
}));

export const synthesizeProductBriefTask = defineTask('bmad-synthesize-brief', (args, taskCtx) => ({
  kind: 'agent',
  title: `Synthesize Product Brief: ${args.projectName}`,
  description: 'Mary (Analyst) synthesizes all research into a comprehensive product brief',

  agent: {
    name: 'bmad-analyst-mary',
    prompt: {
      role: 'Mary - Strategic Business Analyst synthesizing research into actionable product specifications',
      task: 'Synthesize all research findings into a comprehensive product brief',
      context: args,
      instructions: [
        'Synthesize market, domain, and technical research findings',
        'Define clear problem statement based on research evidence',
        'Identify target users with validated personas',
        'Articulate evidence-based value proposition',
        'Define measurable success metrics and KPIs',
        'Set scope boundaries informed by feasibility assessment',
        'List validated assumptions and remaining unknowns',
        'Outline feature themes grounded in user needs',
        'Provide strategic recommendations for next phases',
        'Highlight key risks requiring early attention'
      ],
      outputFormat: 'JSON with structured product brief synthesized from all research'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'targetUsers', 'valueProposition', 'successMetrics'],
      properties: {
        problemStatement: { type: 'string' },
        targetUsers: { type: 'array', items: { type: 'object' } },
        valueProposition: { type: 'string' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        scope: { type: 'object' },
        featureThemes: { type: 'array', items: { type: 'string' } },
        competitivePositioning: { type: 'string' },
        risks: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    outputArtifacts: [
      { path: 'artifacts/bmad/analysis/product-brief.md', format: 'markdown' }
    ]
  },

  labels: ['agent', 'bmad', 'analysis', 'product-brief', 'synthesis', 'mary']
}));
