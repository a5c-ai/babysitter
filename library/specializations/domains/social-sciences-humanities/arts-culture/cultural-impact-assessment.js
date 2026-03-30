/**
 * @process arts-culture/cultural-impact-assessment
 * @description Cultural impact assessment process for evaluating social, economic, and cultural effects of projects, programs, and policies on communities
 * @inputs {
 *   assessmentSubject: { type: 'project' | 'program' | 'policy' | 'development', name: string, description: string },
 *   scope: { geographic: string, temporal: string, populationAffected: string[] },
 *   stakeholders: { communities: string[], organizations: string[], government: string[] },
 *   baselineData: { culturalAssets: object, demographicData: object, economicData: object },
 *   methodology: { approach: string, dataCollectionMethods: string[] },
 *   timeline: { assessmentPeriod: string, reportingDeadline: string }
 * }
 * @outputs {
 *   scopingReport: object,
 *   baselineAssessment: object,
 *   stakeholderAnalysis: object,
 *   impactAnalysis: object,
 *   mitigationStrategies: object,
 *   monitoringFramework: object,
 *   finalAssessmentReport: object
 * }
 * @recommendedSkills SK-AC-010 (cultural-policy-analysis), SK-AC-007 (audience-analytics), SK-AC-015 (arts-advocacy-communication)
 * @recommendedAgents AG-AC-009 (cultural-policy-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Scoping and Methodology Design
  const scopingReport = await ctx.task(scopingTask, {
    assessmentSubject: inputs.assessmentSubject,
    scope: inputs.scope,
    methodology: inputs.methodology
  });

  // Phase 2: Stakeholder Analysis and Engagement
  const stakeholderAnalysis = await ctx.task(stakeholderAnalysisTask, {
    stakeholders: inputs.stakeholders,
    assessmentSubject: inputs.assessmentSubject,
    scope: inputs.scope
  });

  // Phase 3: Baseline Cultural Assessment
  const baselineAssessment = await ctx.task(baselineAssessmentTask, {
    baselineData: inputs.baselineData,
    scope: inputs.scope,
    stakeholderAnalysis: stakeholderAnalysis
  });

  // Phase 4: Social Impact Analysis
  const socialImpact = await ctx.task(socialImpactAnalysisTask, {
    assessmentSubject: inputs.assessmentSubject,
    baselineAssessment: baselineAssessment,
    stakeholders: inputs.stakeholders
  });

  // Phase 5: Economic Impact Analysis
  const economicImpact = await ctx.task(economicImpactAnalysisTask, {
    assessmentSubject: inputs.assessmentSubject,
    baselineAssessment: baselineAssessment,
    scope: inputs.scope
  });

  // Phase 6: Cultural Heritage Impact Analysis
  const heritageImpact = await ctx.task(heritageImpactAnalysisTask, {
    assessmentSubject: inputs.assessmentSubject,
    baselineAssessment: baselineAssessment,
    scope: inputs.scope
  });

  // Breakpoint: Impact Findings Review
  await ctx.breakpoint('impact-findings-review', {
    title: 'Cultural Impact Findings Review',
    description: 'Review comprehensive impact analysis findings before mitigation planning',
    context: {
      socialImpact: socialImpact,
      economicImpact: economicImpact,
      heritageImpact: heritageImpact
    }
  });

  // Phase 7: Cumulative Impact Assessment
  const cumulativeImpact = await ctx.task(cumulativeImpactTask, {
    socialImpact: socialImpact,
    economicImpact: economicImpact,
    heritageImpact: heritageImpact,
    scope: inputs.scope
  });

  // Phase 8: Mitigation and Enhancement Strategies
  const mitigationStrategies = await ctx.task(mitigationStrategiesTask, {
    cumulativeImpact: cumulativeImpact,
    stakeholderAnalysis: stakeholderAnalysis,
    assessmentSubject: inputs.assessmentSubject
  });

  // Phase 9: Monitoring and Evaluation Framework
  const monitoringFramework = await ctx.task(monitoringFrameworkTask, {
    mitigationStrategies: mitigationStrategies,
    cumulativeImpact: cumulativeImpact,
    timeline: inputs.timeline
  });

  // Phase 10: Final Assessment Report
  const finalReport = await ctx.task(finalReportTask, {
    scopingReport: scopingReport,
    baselineAssessment: baselineAssessment,
    stakeholderAnalysis: stakeholderAnalysis,
    socialImpact: socialImpact,
    economicImpact: economicImpact,
    heritageImpact: heritageImpact,
    cumulativeImpact: cumulativeImpact,
    mitigationStrategies: mitigationStrategies,
    monitoringFramework: monitoringFramework
  });

  // Final Breakpoint: Assessment Approval
  await ctx.breakpoint('assessment-approval', {
    title: 'Cultural Impact Assessment Final Approval',
    description: 'Review and approve final cultural impact assessment report',
    context: {
      finalReport: finalReport,
      recommendations: mitigationStrategies
    }
  });

  return {
    scopingReport: scopingReport,
    baselineAssessment: baselineAssessment,
    stakeholderAnalysis: stakeholderAnalysis,
    impactAnalysis: {
      social: socialImpact,
      economic: economicImpact,
      heritage: heritageImpact,
      cumulative: cumulativeImpact
    },
    mitigationStrategies: mitigationStrategies,
    monitoringFramework: monitoringFramework,
    finalAssessmentReport: finalReport
  };
}

export const scopingTask = defineTask('scoping-methodology', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scoping and Methodology Design',
  agent: {
    name: 'cultural-impact-assessor',
    prompt: {
      role: 'Cultural impact assessment specialist with expertise in assessment methodology and scoping',
      task: 'Define scope, boundaries, and methodology for cultural impact assessment',
      context: args,
      instructions: [
        'Define assessment boundaries and geographic scope',
        'Identify key impact categories to evaluate',
        'Select appropriate assessment methodologies',
        'Design data collection instruments and protocols',
        'Establish significance criteria and thresholds',
        'Define temporal scope and assessment periods',
        'Identify limitations and assumptions',
        'Create assessment work plan and timeline',
        'Establish quality assurance procedures',
        'Define reporting requirements and formats'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['scopeDefinition', 'methodology', 'impactCategories', 'workPlan'],
      properties: {
        scopeDefinition: { type: 'object' },
        methodology: { type: 'object' },
        impactCategories: { type: 'array' },
        dataCollectionProtocols: { type: 'array' },
        significanceCriteria: { type: 'object' },
        workPlan: { type: 'object' },
        limitations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['scoping', 'methodology', 'planning']
}));

export const stakeholderAnalysisTask = defineTask('stakeholder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stakeholder Analysis and Engagement',
  agent: {
    name: 'community-engagement-specialist',
    prompt: {
      role: 'Community engagement specialist with expertise in stakeholder analysis and cultural communities',
      task: 'Conduct stakeholder analysis and engagement for cultural impact assessment',
      context: args,
      instructions: [
        'Identify all affected stakeholder groups',
        'Map stakeholder interests and concerns',
        'Assess stakeholder influence and vulnerability',
        'Identify indigenous and traditional communities',
        'Document cultural practitioners and artists affected',
        'Analyze community networks and social cohesion',
        'Assess differential impacts on subgroups',
        'Design culturally appropriate engagement methods',
        'Document stakeholder input and concerns',
        'Create stakeholder communication plan'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderMap', 'vulnerableGroups', 'engagementFindings'],
      properties: {
        stakeholderMap: { type: 'array' },
        interestAnalysis: { type: 'object' },
        vulnerableGroups: { type: 'array' },
        indigenousCommunities: { type: 'array' },
        engagementFindings: { type: 'object' },
        concernsRaised: { type: 'array' },
        communicationPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['stakeholder', 'engagement', 'analysis']
}));

export const baselineAssessmentTask = defineTask('baseline-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Baseline Cultural Assessment',
  agent: {
    name: 'cultural-impact-assessor',
    prompt: {
      role: 'Cultural impact assessment specialist with expertise in cultural baseline documentation',
      task: 'Document baseline cultural conditions and assets',
      context: args,
      instructions: [
        'Document existing cultural assets and resources',
        'Map cultural practices and traditions',
        'Assess cultural participation and access',
        'Document heritage sites and sacred places',
        'Inventory cultural organizations and institutions',
        'Assess creative economy and cultural employment',
        'Document intangible cultural heritage',
        'Analyze cultural diversity and demographics',
        'Assess sense of place and community identity',
        'Establish baseline metrics and indicators'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['culturalAssets', 'culturalPractices', 'baselineMetrics'],
      properties: {
        culturalAssets: { type: 'array' },
        culturalPractices: { type: 'array' },
        heritageSites: { type: 'array' },
        culturalOrganizations: { type: 'array' },
        creativeEconomy: { type: 'object' },
        intangibleHeritage: { type: 'array' },
        communityIdentity: { type: 'object' },
        baselineMetrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['baseline', 'cultural', 'documentation']
}));

export const socialImpactAnalysisTask = defineTask('social-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Social Impact Analysis',
  agent: {
    name: 'cultural-impact-assessor',
    prompt: {
      role: 'Cultural impact assessment specialist with expertise in social impact analysis',
      task: 'Analyze social and community impacts on cultural life',
      context: args,
      instructions: [
        'Assess impacts on community cohesion and social networks',
        'Evaluate changes to cultural participation patterns',
        'Analyze impacts on cultural identity and sense of place',
        'Assess displacement and gentrification risks',
        'Evaluate impacts on vulnerable populations',
        'Analyze changes to social gathering and cultural spaces',
        'Assess impacts on intergenerational cultural transmission',
        'Evaluate effects on cultural diversity',
        'Analyze impacts on artist and creative communities',
        'Assess equity and access implications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['communityImpacts', 'identityImpacts', 'equityImpacts', 'significance'],
      properties: {
        communityImpacts: { type: 'array' },
        identityImpacts: { type: 'array' },
        displacementRisks: { type: 'array' },
        vulnerablePopulationImpacts: { type: 'array' },
        culturalSpaceImpacts: { type: 'array' },
        equityImpacts: { type: 'array' },
        significance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['social', 'impact', 'community']
}));

export const economicImpactAnalysisTask = defineTask('economic-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Economic Impact Analysis',
  agent: {
    name: 'cultural-economist',
    prompt: {
      role: 'Cultural economist with expertise in creative economy impact analysis',
      task: 'Analyze economic impacts on cultural sector and creative economy',
      context: args,
      instructions: [
        'Assess impacts on cultural employment and jobs',
        'Evaluate effects on cultural enterprises and businesses',
        'Analyze impacts on cultural tourism',
        'Assess changes to property values in cultural districts',
        'Evaluate impacts on artist affordability and studio space',
        'Analyze effects on cultural organization revenues',
        'Assess impacts on cultural supply chains',
        'Evaluate multiplier effects and indirect impacts',
        'Analyze distribution of economic benefits and costs',
        'Project long-term economic implications'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['employmentImpacts', 'businessImpacts', 'tourismImpacts', 'economicSignificance'],
      properties: {
        employmentImpacts: { type: 'object' },
        businessImpacts: { type: 'array' },
        tourismImpacts: { type: 'object' },
        propertyValueEffects: { type: 'object' },
        affordabilityImpacts: { type: 'array' },
        organizationImpacts: { type: 'array' },
        multiplierEffects: { type: 'object' },
        economicSignificance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['economic', 'impact', 'analysis']
}));

export const heritageImpactAnalysisTask = defineTask('heritage-impact-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cultural Heritage Impact Analysis',
  agent: {
    name: 'heritage-specialist',
    prompt: {
      role: 'Cultural heritage specialist with expertise in heritage impact assessment',
      task: 'Analyze impacts on tangible and intangible cultural heritage',
      context: args,
      instructions: [
        'Assess impacts on historic buildings and sites',
        'Evaluate effects on archaeological resources',
        'Analyze impacts on cultural landscapes',
        'Assess effects on sacred and ceremonial sites',
        'Evaluate impacts on traditional knowledge and practices',
        'Analyze effects on indigenous heritage',
        'Assess impacts on traditional crafts and skills',
        'Evaluate effects on oral traditions and languages',
        'Analyze impacts on traditional cultural events',
        'Assess cumulative heritage impacts'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['tangibleHeritageImpacts', 'intangibleHeritageImpacts', 'heritageSignificance'],
      properties: {
        tangibleHeritageImpacts: { type: 'array' },
        archaeologicalImpacts: { type: 'array' },
        culturalLandscapeImpacts: { type: 'array' },
        sacredSiteImpacts: { type: 'array' },
        intangibleHeritageImpacts: { type: 'array' },
        indigenousHeritageImpacts: { type: 'array' },
        heritageSignificance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['heritage', 'impact', 'assessment']
}));

export const cumulativeImpactTask = defineTask('cumulative-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cumulative Impact Assessment',
  agent: {
    name: 'cultural-impact-assessor',
    prompt: {
      role: 'Cultural impact assessment specialist with expertise in cumulative impact analysis',
      task: 'Synthesize and analyze cumulative cultural impacts',
      context: args,
      instructions: [
        'Synthesize social, economic, and heritage impacts',
        'Identify synergistic and compounding effects',
        'Assess cumulative impacts with other projects',
        'Analyze temporal distribution of impacts',
        'Evaluate geographic distribution of impacts',
        'Assess reversibility and permanence of impacts',
        'Identify critical thresholds and tipping points',
        'Analyze differential impacts across groups',
        'Assess overall significance of cumulative impacts',
        'Identify key impact pathways and drivers'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['cumulativeImpacts', 'synergisticEffects', 'overallSignificance'],
      properties: {
        cumulativeImpacts: { type: 'array' },
        synergisticEffects: { type: 'array' },
        temporalDistribution: { type: 'object' },
        geographicDistribution: { type: 'object' },
        reversibility: { type: 'object' },
        criticalThresholds: { type: 'array' },
        overallSignificance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cumulative', 'synthesis', 'assessment']
}));

export const mitigationStrategiesTask = defineTask('mitigation-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mitigation and Enhancement Strategies',
  agent: {
    name: 'cultural-impact-assessor',
    prompt: {
      role: 'Cultural impact assessment specialist with expertise in mitigation planning',
      task: 'Develop mitigation measures and enhancement strategies',
      context: args,
      instructions: [
        'Develop avoidance strategies for significant impacts',
        'Design minimization measures for unavoidable impacts',
        'Create compensation and offset strategies',
        'Develop enhancement opportunities for positive impacts',
        'Design community benefit programs',
        'Create heritage preservation measures',
        'Develop cultural programming support strategies',
        'Design affordable space preservation measures',
        'Create cultural workforce support programs',
        'Prioritize mitigation measures by effectiveness'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['avoidanceMeasures', 'minimizationMeasures', 'compensationStrategies', 'enhancements'],
      properties: {
        avoidanceMeasures: { type: 'array' },
        minimizationMeasures: { type: 'array' },
        compensationStrategies: { type: 'array' },
        enhancements: { type: 'array' },
        communityBenefits: { type: 'array' },
        heritagePreservation: { type: 'array' },
        implementationPriorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mitigation', 'enhancement', 'strategies']
}));

export const monitoringFrameworkTask = defineTask('monitoring-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitoring and Evaluation Framework',
  agent: {
    name: 'cultural-impact-assessor',
    prompt: {
      role: 'Cultural impact assessment specialist with expertise in monitoring and evaluation',
      task: 'Design monitoring and evaluation framework for cultural impacts',
      context: args,
      instructions: [
        'Define key performance indicators for cultural impacts',
        'Design data collection and monitoring protocols',
        'Establish monitoring frequency and schedule',
        'Create community-based monitoring mechanisms',
        'Design adaptive management triggers',
        'Develop reporting requirements and formats',
        'Create stakeholder feedback mechanisms',
        'Design periodic review and evaluation process',
        'Establish grievance and complaint procedures',
        'Define roles and responsibilities for monitoring'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['indicators', 'monitoringProtocols', 'adaptiveManagement', 'reportingRequirements'],
      properties: {
        indicators: { type: 'array' },
        monitoringProtocols: { type: 'array' },
        monitoringSchedule: { type: 'object' },
        communityMonitoring: { type: 'object' },
        adaptiveManagement: { type: 'object' },
        reportingRequirements: { type: 'object' },
        grievanceProcedures: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['monitoring', 'evaluation', 'framework']
}));

export const finalReportTask = defineTask('final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final Assessment Report',
  agent: {
    name: 'cultural-impact-assessor',
    prompt: {
      role: 'Cultural impact assessment specialist with expertise in assessment documentation',
      task: 'Compile final cultural impact assessment report',
      context: args,
      instructions: [
        'Write executive summary of key findings',
        'Document methodology and approach',
        'Present baseline conditions and context',
        'Detail impact analysis findings by category',
        'Present cumulative impact assessment',
        'Document stakeholder engagement process and input',
        'Present mitigation and enhancement recommendations',
        'Include monitoring and evaluation framework',
        'Compile appendices with supporting documentation',
        'Prepare non-technical summary for public'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'findings', 'recommendations', 'appendices'],
      properties: {
        executiveSummary: { type: 'string' },
        methodology: { type: 'object' },
        baselineConditions: { type: 'object' },
        findings: { type: 'object' },
        cumulativeAssessment: { type: 'object' },
        stakeholderEngagement: { type: 'object' },
        recommendations: { type: 'array' },
        monitoringPlan: { type: 'object' },
        appendices: { type: 'array' },
        publicSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['report', 'documentation', 'final']
}));
