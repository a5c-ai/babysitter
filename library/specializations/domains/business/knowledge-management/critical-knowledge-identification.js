/**
 * @process domains/business/knowledge-management/critical-knowledge-identification
 * @description Identify at-risk knowledge domains, assess knowledge criticality, map knowledge dependencies, and prioritize capture efforts based on strategic importance and vulnerability
 * @specialization Knowledge Management
 * @category Knowledge Capture and Documentation
 * @inputs { organizationalContext: object, strategicObjectives: array, workforceData: object, existingKnowledgeAssets: array, outputDir: string }
 * @outputs { success: boolean, criticalKnowledgeMap: object, riskAssessment: object, prioritizedCapture: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationalContext = {},
    strategicObjectives = [],
    workforceData = {},
    existingKnowledgeAssets = [],
    assessmentScope = {
      departments: [],
      processes: [],
      roles: []
    },
    riskFactors = {
      retirementWindow: 5,
      turnoverThreshold: 15,
      singlePointsOfFailure: true
    },
    outputDir = 'critical-knowledge-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Critical Knowledge Identification and Risk Assessment Process');

  // ============================================================================
  // PHASE 1: ORGANIZATIONAL KNOWLEDGE LANDSCAPE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing organizational knowledge landscape');
  const landscapeAnalysis = await ctx.task(landscapeAnalysisTask, {
    organizationalContext,
    strategicObjectives,
    assessmentScope,
    existingKnowledgeAssets,
    outputDir
  });

  artifacts.push(...landscapeAnalysis.artifacts);

  // Breakpoint: Review landscape analysis
  await ctx.breakpoint({
    question: `Identified ${landscapeAnalysis.knowledgeDomains.length} knowledge domains across the organization. Review landscape analysis?`,
    title: 'Knowledge Landscape Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        knowledgeDomains: landscapeAnalysis.knowledgeDomains.length,
        keyProcesses: landscapeAnalysis.keyProcesses.length,
        criticalRoles: landscapeAnalysis.criticalRoles.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: KNOWLEDGE CRITICALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing knowledge criticality');
  const criticalityAssessment = await ctx.task(criticalityAssessmentTask, {
    knowledgeDomains: landscapeAnalysis.knowledgeDomains,
    strategicObjectives,
    keyProcesses: landscapeAnalysis.keyProcesses,
    outputDir
  });

  artifacts.push(...criticalityAssessment.artifacts);

  // ============================================================================
  // PHASE 3: KNOWLEDGE HOLDER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing knowledge holders and distribution');
  const holderAnalysis = await ctx.task(knowledgeHolderAnalysisTask, {
    knowledgeDomains: landscapeAnalysis.knowledgeDomains,
    criticalKnowledge: criticalityAssessment.criticalKnowledge,
    workforceData,
    criticalRoles: landscapeAnalysis.criticalRoles,
    outputDir
  });

  artifacts.push(...holderAnalysis.artifacts);

  // Breakpoint: Review knowledge holder analysis
  await ctx.breakpoint({
    question: `Identified ${holderAnalysis.singlePointsOfFailure.length} single points of failure. Review knowledge holder analysis?`,
    title: 'Knowledge Holder Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        singlePointsOfFailure: holderAnalysis.singlePointsOfFailure.length,
        keyKnowledgeHolders: holderAnalysis.keyHolders.length,
        knowledgeConcentration: holderAnalysis.concentrationScore
      }
    }
  });

  // ============================================================================
  // PHASE 4: KNOWLEDGE LOSS RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing knowledge loss risks');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    criticalKnowledge: criticalityAssessment.criticalKnowledge,
    holderAnalysis,
    workforceData,
    riskFactors,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 5: KNOWLEDGE DEPENDENCY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Mapping knowledge dependencies');
  const dependencyMapping = await ctx.task(dependencyMappingTask, {
    criticalKnowledge: criticalityAssessment.criticalKnowledge,
    knowledgeDomains: landscapeAnalysis.knowledgeDomains,
    keyProcesses: landscapeAnalysis.keyProcesses,
    outputDir
  });

  artifacts.push(...dependencyMapping.artifacts);

  // ============================================================================
  // PHASE 6: CAPTURE PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Prioritizing knowledge capture efforts');
  const capturePrioritization = await ctx.task(capturePrioritizationTask, {
    criticalKnowledge: criticalityAssessment.criticalKnowledge,
    riskAssessment: riskAssessment.riskProfile,
    dependencyMapping: dependencyMapping.dependencies,
    strategicObjectives,
    outputDir
  });

  artifacts.push(...capturePrioritization.artifacts);

  // Breakpoint: Review capture prioritization
  await ctx.breakpoint({
    question: `Prioritized ${capturePrioritization.prioritizedCapture.length} knowledge areas for capture. Review prioritization?`,
    title: 'Capture Prioritization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        criticalPriority: capturePrioritization.prioritizedCapture.filter(p => p.priority === 'critical').length,
        highPriority: capturePrioritization.prioritizedCapture.filter(p => p.priority === 'high').length,
        mediumPriority: capturePrioritization.prioritizedCapture.filter(p => p.priority === 'medium').length
      }
    }
  });

  // ============================================================================
  // PHASE 7: CAPTURE STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing knowledge capture strategies');
  const captureStrategy = await ctx.task(captureStrategyTask, {
    prioritizedCapture: capturePrioritization.prioritizedCapture,
    holderAnalysis,
    organizationalContext,
    outputDir
  });

  artifacts.push(...captureStrategy.artifacts);

  // ============================================================================
  // PHASE 8: RESOURCE AND TIMELINE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 8: Planning resources and timeline');
  const resourcePlanning = await ctx.task(resourcePlanningTask, {
    prioritizedCapture: capturePrioritization.prioritizedCapture,
    captureStrategies: captureStrategy.strategies,
    riskAssessment: riskAssessment.riskProfile,
    organizationalContext,
    outputDir
  });

  artifacts.push(...resourcePlanning.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing overall assessment quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    landscapeAnalysis,
    criticalityAssessment,
    holderAnalysis,
    riskAssessment,
    capturePrioritization,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      criticalKnowledge: criticalityAssessment.criticalKnowledge,
      riskAssessment: riskAssessment.riskProfile,
      prioritizedCapture: capturePrioritization.prioritizedCapture,
      captureStrategy: captureStrategy.strategies,
      resourcePlan: resourcePlanning.plan,
      qualityScore: qualityAssessment.overallScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize assessment?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          qualityScore: qualityAssessment.overallScore,
          stakeholdersReviewed: reviewResult.stakeholders.length,
          criticalKnowledgeAreas: criticalityAssessment.criticalKnowledge.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    criticalKnowledgeMap: {
      domains: landscapeAnalysis.knowledgeDomains,
      criticalKnowledge: criticalityAssessment.criticalKnowledge,
      dependencies: dependencyMapping.dependencies
    },
    riskAssessment: {
      riskProfile: riskAssessment.riskProfile,
      singlePointsOfFailure: holderAnalysis.singlePointsOfFailure,
      atRiskKnowledge: riskAssessment.atRiskKnowledge,
      overallRiskScore: riskAssessment.overallRiskScore
    },
    prioritizedCapture: capturePrioritization.prioritizedCapture,
    captureStrategy: captureStrategy.strategies,
    resourcePlan: resourcePlanning.plan,
    statistics: {
      knowledgeDomainsAnalyzed: landscapeAnalysis.knowledgeDomains.length,
      criticalKnowledgeIdentified: criticalityAssessment.criticalKnowledge.length,
      singlePointsOfFailure: holderAnalysis.singlePointsOfFailure.length,
      highRiskAreas: riskAssessment.atRiskKnowledge.filter(k => k.riskLevel === 'high').length
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/critical-knowledge-identification',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Landscape Analysis
export const landscapeAnalysisTask = defineTask('landscape-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze organizational knowledge landscape',
  agent: {
    name: 'knowledge-analyst',
    prompt: {
      role: 'knowledge management analyst mapping organizational knowledge',
      task: 'Analyze and map the organizational knowledge landscape',
      context: args,
      instructions: [
        'Map the organizational knowledge landscape:',
        '  - Core business knowledge domains',
        '  - Supporting knowledge areas',
        '  - Specialized expertise areas',
        'Identify key business processes and their knowledge requirements',
        'Map critical roles and their knowledge dependencies',
        'Inventory existing knowledge assets and documentation',
        'Identify knowledge flow patterns across the organization',
        'Map formal and informal knowledge networks',
        'Identify knowledge creation and consumption patterns',
        'Document knowledge gaps in existing assets',
        'Save landscape analysis to output directory'
      ],
      outputFormat: 'JSON with knowledgeDomains (array), keyProcesses (array), criticalRoles (array), knowledgeFlows (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['knowledgeDomains', 'keyProcesses', 'criticalRoles', 'artifacts'],
      properties: {
        knowledgeDomains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              subDomains: { type: 'array', items: { type: 'string' } },
              relatedProcesses: { type: 'array', items: { type: 'string' } },
              existingDocumentation: { type: 'string', enum: ['extensive', 'moderate', 'minimal', 'none'] }
            }
          }
        },
        keyProcesses: { type: 'array' },
        criticalRoles: { type: 'array' },
        knowledgeFlows: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'landscape', 'analysis']
}));

// Task 2: Criticality Assessment
export const criticalityAssessmentTask = defineTask('criticality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess knowledge criticality',
  agent: {
    name: 'criticality-assessor',
    prompt: {
      role: 'knowledge criticality assessment specialist',
      task: 'Assess the criticality of identified knowledge domains',
      context: args,
      instructions: [
        'Assess criticality of each knowledge domain:',
        'Criticality criteria:',
        '  - Strategic importance (alignment with objectives)',
        '  - Operational impact (business continuity)',
        '  - Competitive advantage (uniqueness)',
        '  - Regulatory/compliance requirements',
        '  - Customer impact',
        '  - Revenue/cost impact',
        'Rate each domain on criticality scale',
        'Identify critical knowledge within each domain',
        'Document criticality rationale',
        'Rank knowledge by overall criticality',
        'Save criticality assessment to output directory'
      ],
      outputFormat: 'JSON with criticalKnowledge (array), criticalityMatrix (object), rankings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalKnowledge', 'artifacts'],
      properties: {
        criticalKnowledge: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              domain: { type: 'string' },
              knowledgeArea: { type: 'string' },
              criticalityScore: { type: 'number', minimum: 0, maximum: 100 },
              strategicImportance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              operationalImpact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              rationale: { type: 'string' }
            }
          }
        },
        criticalityMatrix: { type: 'object' },
        rankings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'criticality', 'assessment']
}));

// Task 3: Knowledge Holder Analysis
export const knowledgeHolderAnalysisTask = defineTask('knowledge-holder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze knowledge holders and distribution',
  agent: {
    name: 'workforce-analyst',
    prompt: {
      role: 'workforce knowledge analyst',
      task: 'Analyze knowledge holders and knowledge distribution',
      context: args,
      instructions: [
        'Identify key knowledge holders for critical knowledge:',
        '  - Subject matter experts',
        '  - Long-tenured employees',
        '  - Specialized skill holders',
        'Analyze knowledge distribution:',
        '  - Knowledge concentration (few vs many holders)',
        '  - Geographic distribution',
        '  - Organizational distribution',
        'Identify single points of failure:',
        '  - Sole experts in critical areas',
        '  - Undocumented tribal knowledge',
        '  - Critical knowledge held by at-risk employees',
        'Map knowledge holder networks',
        'Assess knowledge sharing patterns',
        'Calculate knowledge concentration scores',
        'Save holder analysis to output directory'
      ],
      outputFormat: 'JSON with keyHolders (array), singlePointsOfFailure (array), concentrationScore (number), distributionAnalysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyHolders', 'singlePointsOfFailure', 'concentrationScore', 'artifacts'],
      properties: {
        keyHolders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              knowledgeAreas: { type: 'array', items: { type: 'string' } },
              tenure: { type: 'number' },
              retirementRisk: { type: 'string', enum: ['immediate', 'near-term', 'medium-term', 'low'] }
            }
          }
        },
        singlePointsOfFailure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              knowledgeArea: { type: 'string' },
              holder: { type: 'string' },
              criticality: { type: 'string' },
              riskLevel: { type: 'string' }
            }
          }
        },
        concentrationScore: { type: 'number', minimum: 0, maximum: 100 },
        distributionAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'holder-analysis', 'workforce']
}));

// Task 4: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess knowledge loss risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'knowledge risk analyst',
      task: 'Assess risks of knowledge loss across critical areas',
      context: args,
      instructions: [
        'Assess knowledge loss risks:',
        'Risk factors to analyze:',
        '  - Retirement and aging workforce',
        '  - Turnover and attrition',
        '  - Organizational changes',
        '  - Technology changes',
        '  - Market/industry changes',
        'Calculate risk scores for each critical knowledge area',
        'Identify at-risk knowledge requiring immediate attention',
        'Assess impact of potential knowledge loss',
        'Estimate time horizons for risk realization',
        'Create risk heat map',
        'Calculate overall organizational knowledge risk score',
        'Save risk assessment to output directory'
      ],
      outputFormat: 'JSON with riskProfile (object), atRiskKnowledge (array), overallRiskScore (number), riskHeatMap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskProfile', 'atRiskKnowledge', 'overallRiskScore', 'artifacts'],
      properties: {
        riskProfile: { type: 'object' },
        atRiskKnowledge: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              knowledgeArea: { type: 'string' },
              riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              riskFactors: { type: 'array', items: { type: 'string' } },
              timeHorizon: { type: 'string' },
              impactScore: { type: 'number' }
            }
          }
        },
        overallRiskScore: { type: 'number', minimum: 0, maximum: 100 },
        riskHeatMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'risk', 'assessment']
}));

// Task 5: Dependency Mapping
export const dependencyMappingTask = defineTask('dependency-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map knowledge dependencies',
  agent: {
    name: 'dependency-mapper',
    prompt: {
      role: 'knowledge dependency analyst',
      task: 'Map dependencies between knowledge domains and processes',
      context: args,
      instructions: [
        'Map knowledge dependencies:',
        '  - Knowledge-to-knowledge dependencies',
        '  - Knowledge-to-process dependencies',
        '  - Knowledge-to-role dependencies',
        'Identify upstream and downstream dependencies',
        'Map prerequisite knowledge relationships',
        'Identify knowledge bottlenecks',
        'Analyze dependency chains and cascading impacts',
        'Create dependency visualizations',
        'Identify critical dependency paths',
        'Save dependency mapping to output directory'
      ],
      outputFormat: 'JSON with dependencies (array), dependencyGraph (object), criticalPaths (array), bottlenecks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'artifacts'],
      properties: {
        dependencies: { type: 'array' },
        dependencyGraph: { type: 'object' },
        criticalPaths: { type: 'array' },
        bottlenecks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'dependency', 'mapping']
}));

// Task 6: Capture Prioritization
export const capturePrioritizationTask = defineTask('capture-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize knowledge capture efforts',
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'knowledge capture prioritization specialist',
      task: 'Prioritize critical knowledge for capture based on risk and value',
      context: args,
      instructions: [
        'Develop prioritization framework combining:',
        '  - Knowledge criticality scores',
        '  - Knowledge loss risk scores',
        '  - Strategic alignment',
        '  - Capture complexity/effort',
        '  - Time urgency',
        'Calculate composite priority scores',
        'Rank knowledge areas for capture',
        'Group into priority tiers (critical, high, medium, low)',
        'Consider dependencies in sequencing',
        'Create prioritized capture backlog',
        'Save prioritization to output directory'
      ],
      outputFormat: 'JSON with prioritizedCapture (array), prioritizationFramework (object), captureBacklog (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedCapture', 'artifacts'],
      properties: {
        prioritizedCapture: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              knowledgeArea: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              priorityScore: { type: 'number' },
              criticalityScore: { type: 'number' },
              riskScore: { type: 'number' },
              urgency: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        prioritizationFramework: { type: 'object' },
        captureBacklog: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'prioritization', 'capture']
}));

// Task 7: Capture Strategy
export const captureStrategyTask = defineTask('capture-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop knowledge capture strategies',
  agent: {
    name: 'strategy-developer',
    prompt: {
      role: 'knowledge capture strategy specialist',
      task: 'Develop appropriate capture strategies for prioritized knowledge',
      context: args,
      instructions: [
        'Develop capture strategies for each prioritized area:',
        'Strategy options:',
        '  - Expert interviews and elicitation',
        '  - Observation and shadowing',
        '  - Documentation review and enhancement',
        '  - Mentoring and knowledge transfer',
        '  - Process documentation',
        '  - Video/audio capture',
        '  - Collaborative authoring',
        'Match strategies to knowledge types and holders',
        'Consider organizational constraints',
        'Define success criteria for each strategy',
        'Identify required resources and tools',
        'Save capture strategies to output directory'
      ],
      outputFormat: 'JSON with strategies (array), resourceRequirements (object), successCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              knowledgeArea: { type: 'string' },
              captureMethod: { type: 'string' },
              approach: { type: 'string' },
              keyHolders: { type: 'array', items: { type: 'string' } },
              estimatedEffort: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        resourceRequirements: { type: 'object' },
        successCriteria: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'strategy', 'capture']
}));

// Task 8: Resource Planning
export const resourcePlanningTask = defineTask('resource-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan resources and timeline',
  agent: {
    name: 'project-planner',
    prompt: {
      role: 'knowledge capture project planner',
      task: 'Plan resources, timeline, and budget for knowledge capture',
      context: args,
      instructions: [
        'Develop resource and timeline plan:',
        '  - Personnel requirements',
        '  - Tools and technology needs',
        '  - Budget estimates',
        '  - Timeline with milestones',
        'Consider risk-based urgency in scheduling',
        'Plan for expert availability constraints',
        'Define phased approach if needed',
        'Identify dependencies and critical path',
        'Create resource allocation plan',
        'Develop contingency plans',
        'Save resource plan to output directory'
      ],
      outputFormat: 'JSON with plan (object), timeline (object), budget (object), resourceAllocation (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        budget: { type: 'object' },
        resourceAllocation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'resource', 'planning']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess overall assessment quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'assessment quality reviewer',
      task: 'Evaluate the quality of the critical knowledge assessment',
      context: args,
      instructions: [
        'Assess quality of the assessment:',
        '  - Completeness of coverage',
        '  - Validity of criticality ratings',
        '  - Accuracy of risk assessments',
        '  - Appropriateness of prioritization',
        '  - Feasibility of strategies',
        'Calculate overall quality score',
        'Identify gaps and weaknesses',
        'Provide improvement recommendations',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), qualityDimensions (object), gaps (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityDimensions: { type: 'object' },
        gaps: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval of assessment',
      context: args,
      instructions: [
        'Present assessment results to stakeholders',
        'Review critical knowledge identification',
        'Present risk assessment findings',
        'Review capture prioritization and strategy',
        'Present resource and timeline plan',
        'Gather stakeholder feedback',
        'Address concerns and questions',
        'Obtain approval or identify required changes',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
