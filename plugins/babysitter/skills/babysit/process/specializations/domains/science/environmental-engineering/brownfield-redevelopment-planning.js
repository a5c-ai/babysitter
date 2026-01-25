/**
 * @process environmental-engineering/brownfield-redevelopment-planning
 * @description Brownfield Redevelopment Planning - Integrated approach to assessing, remediating, and redeveloping
 * contaminated properties for beneficial reuse.
 * @inputs { siteName: string, siteAddress: string, currentConditions: object, proposedReuse: string }
 * @outputs { success: boolean, redevelopmentPlan: object, remediationStrategy: object, financingOptions: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/brownfield-redevelopment-planning', {
 *   siteName: 'Former Steel Mill',
 *   siteAddress: '500 Industrial Boulevard',
 *   currentConditions: { contamination: ['metals', 'PAHs'], size: 50 },
 *   proposedReuse: 'mixed-use-development'
 * });
 *
 * @references
 * - EPA Brownfields Program
 * - State Voluntary Cleanup Programs
 * - ASTM Brownfield Redevelopment Standards
 * - Urban Land Institute Brownfield Guides
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    siteName,
    siteAddress,
    currentConditions = {},
    proposedReuse = 'commercial',
    stakeholders = [],
    constraints = {},
    outputDir = 'brownfield-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Brownfield Redevelopment Planning: ${siteName}`);
  ctx.log('info', `Proposed Reuse: ${proposedReuse}`);

  // ============================================================================
  // PHASE 1: SITE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Site Assessment and Characterization');

  const siteAssessment = await ctx.task(brownfieldAssessmentTask, {
    siteName,
    siteAddress,
    currentConditions,
    outputDir
  });

  artifacts.push(...siteAssessment.artifacts);

  // ============================================================================
  // PHASE 2: REUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Reuse Analysis');

  const reuseAnalysis = await ctx.task(reuseAnalysisTask, {
    siteName,
    siteAssessment,
    proposedReuse,
    constraints,
    outputDir
  });

  artifacts.push(...reuseAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: REGULATORY PATHWAY
  // ============================================================================

  ctx.log('info', 'Phase 3: Regulatory Pathway Analysis');

  const regulatoryPathway = await ctx.task(regulatoryPathwayTask, {
    siteName,
    siteAssessment,
    proposedReuse,
    outputDir
  });

  artifacts.push(...regulatoryPathway.artifacts);

  // Breakpoint: Regulatory Review
  await ctx.breakpoint({
    question: `Regulatory pathway identified for ${siteName}: ${regulatoryPathway.recommendedProgram}. Review regulatory requirements?`,
    title: 'Regulatory Pathway Review',
    context: {
      runId: ctx.runId,
      recommendedProgram: regulatoryPathway.recommendedProgram,
      requirements: regulatoryPathway.requirements,
      liabilityProtection: regulatoryPathway.liabilityProtection,
      files: regulatoryPathway.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: REMEDIATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 4: Remediation Strategy Development');

  const remediationStrategy = await ctx.task(brownfieldRemediationTask, {
    siteName,
    siteAssessment,
    proposedReuse,
    regulatoryPathway,
    outputDir
  });

  artifacts.push(...remediationStrategy.artifacts);

  // ============================================================================
  // PHASE 5: FINANCING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Financing Options Analysis');

  const financingAnalysis = await ctx.task(financingAnalysisTask, {
    siteName,
    siteAssessment,
    remediationStrategy,
    proposedReuse,
    outputDir
  });

  artifacts.push(...financingAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: STAKEHOLDER ENGAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Stakeholder Engagement Planning');

  const stakeholderPlan = await ctx.task(stakeholderEngagementTask, {
    siteName,
    stakeholders,
    proposedReuse,
    remediationStrategy,
    outputDir
  });

  artifacts.push(...stakeholderPlan.artifacts);

  // ============================================================================
  // PHASE 7: REDEVELOPMENT PLAN
  // ============================================================================

  ctx.log('info', 'Phase 7: Redevelopment Plan Integration');

  const redevelopmentPlan = await ctx.task(redevelopmentPlanTask, {
    siteName,
    siteAssessment,
    reuseAnalysis,
    regulatoryPathway,
    remediationStrategy,
    financingAnalysis,
    stakeholderPlan,
    outputDir
  });

  artifacts.push(...redevelopmentPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    siteName,
    redevelopmentPlan: {
      proposedReuse,
      phases: redevelopmentPlan.phases,
      timeline: redevelopmentPlan.timeline,
      keyMilestones: redevelopmentPlan.keyMilestones
    },
    remediationStrategy: {
      approach: remediationStrategy.approach,
      institutionalControls: remediationStrategy.institutionalControls,
      engineeringControls: remediationStrategy.engineeringControls,
      cost: remediationStrategy.costEstimate
    },
    financingOptions: {
      grants: financingAnalysis.grantOpportunities,
      taxIncentives: financingAnalysis.taxIncentives,
      loans: financingAnalysis.loanPrograms,
      totalFunding: financingAnalysis.totalPotentialFunding
    },
    regulatoryPath: regulatoryPathway.recommendedProgram,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/brownfield-redevelopment-planning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const brownfieldAssessmentTask = defineTask('brownfield-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Site Assessment and Characterization',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Brownfield Assessment Specialist',
      task: 'Assess brownfield site conditions',
      context: args,
      instructions: [
        '1. Review existing environmental data',
        '2. Characterize contamination extent',
        '3. Identify all impacted media',
        '4. Assess structural conditions',
        '5. Evaluate infrastructure status',
        '6. Identify asbestos and lead paint',
        '7. Assess utility availability',
        '8. Document site constraints',
        '9. Estimate cleanup costs',
        '10. Prepare site assessment summary'
      ],
      outputFormat: 'JSON with site conditions, contamination summary, constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['siteConditions', 'contaminationSummary', 'constraints', 'artifacts'],
      properties: {
        siteConditions: { type: 'object' },
        contaminationSummary: { type: 'object' },
        impactedMedia: { type: 'array' },
        structuralConditions: { type: 'object' },
        utilities: { type: 'object' },
        constraints: { type: 'array' },
        cleanupCostEstimate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'brownfield', 'assessment']
}));

export const reuseAnalysisTask = defineTask('reuse-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reuse Analysis',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Brownfield Reuse Planner',
      task: 'Analyze site reuse options',
      context: args,
      instructions: [
        '1. Evaluate proposed reuse compatibility',
        '2. Assess market demand',
        '3. Evaluate zoning requirements',
        '4. Assess community needs',
        '5. Identify reuse constraints',
        '6. Evaluate exposure scenarios for reuse',
        '7. Assess infrastructure needs',
        '8. Identify alternative reuse options',
        '9. Perform highest and best use analysis',
        '10. Document reuse analysis'
      ],
      outputFormat: 'JSON with reuse options, compatibility, market analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['reuseOptions', 'compatibility', 'marketAnalysis', 'artifacts'],
      properties: {
        reuseOptions: { type: 'array' },
        proposedReuseCompatibility: { type: 'object' },
        compatibility: { type: 'object' },
        marketAnalysis: { type: 'object' },
        zoningRequirements: { type: 'object' },
        infrastructureNeeds: { type: 'array' },
        highestBestUse: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'brownfield', 'reuse']
}));

export const regulatoryPathwayTask = defineTask('regulatory-pathway', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regulatory Pathway Analysis',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Brownfield Regulatory Specialist',
      task: 'Identify optimal regulatory pathway',
      context: args,
      instructions: [
        '1. Identify applicable cleanup programs',
        '2. Evaluate Voluntary Cleanup Program (VCP)',
        '3. Evaluate Brownfields program participation',
        '4. Assess liability protections available',
        '5. Determine cleanup standards',
        '6. Identify institutional control requirements',
        '7. Assess deed notice requirements',
        '8. Evaluate No Further Action (NFA) criteria',
        '9. Identify permitting requirements',
        '10. Document regulatory pathway'
      ],
      outputFormat: 'JSON with recommended program, requirements, liability protection'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedProgram', 'requirements', 'liabilityProtection', 'artifacts'],
      properties: {
        recommendedProgram: { type: 'string' },
        alternativePrograms: { type: 'array' },
        requirements: { type: 'object' },
        cleanupStandards: { type: 'object' },
        liabilityProtection: { type: 'object' },
        institutionalControls: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'brownfield', 'regulatory']
}));

export const brownfieldRemediationTask = defineTask('brownfield-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediation Strategy Development',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Brownfield Remediation Engineer',
      task: 'Develop remediation strategy for redevelopment',
      context: args,
      instructions: [
        '1. Develop risk-based cleanup approach',
        '2. Design institutional controls',
        '3. Design engineering controls',
        '4. Evaluate capping options',
        '5. Assess soil management requirements',
        '6. Plan for construction worker protection',
        '7. Integrate remediation with construction',
        '8. Develop environmental covenant',
        '9. Estimate remediation costs',
        '10. Document remediation strategy'
      ],
      outputFormat: 'JSON with approach, controls, cost estimate'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'institutionalControls', 'engineeringControls', 'costEstimate', 'artifacts'],
      properties: {
        approach: { type: 'object' },
        riskBasedCleanup: { type: 'object' },
        institutionalControls: { type: 'array' },
        engineeringControls: { type: 'array' },
        cappingDesign: { type: 'object' },
        soilManagement: { type: 'object' },
        environmentalCovenant: { type: 'object' },
        costEstimate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'brownfield', 'remediation']
}));

export const financingAnalysisTask = defineTask('financing-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Financing Options Analysis',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Brownfield Finance Specialist',
      task: 'Identify financing options for brownfield redevelopment',
      context: args,
      instructions: [
        '1. Identify EPA Brownfield grants',
        '2. Identify state brownfield incentives',
        '3. Evaluate tax increment financing (TIF)',
        '4. Assess historic tax credits',
        '5. Identify environmental insurance options',
        '6. Evaluate New Markets Tax Credits',
        '7. Identify SBA loan programs',
        '8. Assess private financing options',
        '9. Develop funding strategy',
        '10. Document financing analysis'
      ],
      outputFormat: 'JSON with grant opportunities, tax incentives, total potential funding'
    },
    outputSchema: {
      type: 'object',
      required: ['grantOpportunities', 'taxIncentives', 'loanPrograms', 'totalPotentialFunding', 'artifacts'],
      properties: {
        grantOpportunities: { type: 'array' },
        taxIncentives: { type: 'array' },
        loanPrograms: { type: 'array' },
        insuranceOptions: { type: 'array' },
        fundingStrategy: { type: 'object' },
        totalPotentialFunding: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'brownfield', 'financing']
}));

export const stakeholderEngagementTask = defineTask('stakeholder-engagement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stakeholder Engagement Planning',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Community Engagement Specialist',
      task: 'Develop stakeholder engagement plan',
      context: args,
      instructions: [
        '1. Identify key stakeholders',
        '2. Assess community concerns',
        '3. Develop engagement strategy',
        '4. Plan public meetings',
        '5. Develop communication materials',
        '6. Plan for environmental justice considerations',
        '7. Address community benefit agreements',
        '8. Develop workforce development plan',
        '9. Plan ongoing communication',
        '10. Document engagement plan'
      ],
      outputFormat: 'JSON with stakeholder plan, engagement strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderPlan', 'engagementStrategy', 'artifacts'],
      properties: {
        stakeholderPlan: { type: 'object' },
        keyStakeholders: { type: 'array' },
        communityConcerns: { type: 'array' },
        engagementStrategy: { type: 'object' },
        publicMeetings: { type: 'array' },
        communicationMaterials: { type: 'array' },
        environmentalJustice: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'brownfield', 'stakeholder']
}));

export const redevelopmentPlanTask = defineTask('redevelopment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Redevelopment Plan Integration',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Brownfield Redevelopment Planner',
      task: 'Integrate all elements into redevelopment plan',
      context: args,
      instructions: [
        '1. Integrate assessment findings',
        '2. Integrate regulatory pathway',
        '3. Integrate remediation strategy',
        '4. Integrate financing plan',
        '5. Develop phased implementation',
        '6. Create project timeline',
        '7. Identify key milestones',
        '8. Develop risk management plan',
        '9. Create monitoring and reporting plan',
        '10. Generate comprehensive redevelopment plan'
      ],
      outputFormat: 'JSON with phases, timeline, key milestones'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'keyMilestones', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        timeline: { type: 'object' },
        keyMilestones: { type: 'array' },
        riskManagement: { type: 'object' },
        monitoringPlan: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'brownfield', 'planning']
}));
