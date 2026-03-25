/**
 * @process business-strategy/strategic-initiative-portfolio
 * @description Prioritization, resource allocation, and governance of strategic initiatives using portfolio management principles
 * @inputs { initiatives: array, strategicObjectives: array, resourceConstraints: object, organizationContext: object, outputDir: string }
 * @outputs { success: boolean, portfolio: object, prioritizedInitiatives: array, resourceAllocation: object, governance: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    initiatives = [],
    strategicObjectives = [],
    resourceConstraints = {},
    organizationContext = {},
    outputDir = 'portfolio-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Strategic Initiative Portfolio Management Process');

  // ============================================================================
  // PHASE 1: INITIATIVE INVENTORY AND CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Inventorying and classifying initiatives');
  const initiativeInventory = await ctx.task(initiativeInventoryTask, {
    initiatives,
    strategicObjectives,
    outputDir
  });

  artifacts.push(...initiativeInventory.artifacts);

  // ============================================================================
  // PHASE 2: STRATEGIC ALIGNMENT SCORING
  // ============================================================================

  ctx.log('info', 'Phase 2: Scoring strategic alignment');
  const alignmentScoring = await ctx.task(alignmentScoringTask, {
    initiatives: initiativeInventory.classifiedInitiatives,
    strategicObjectives,
    outputDir
  });

  artifacts.push(...alignmentScoring.artifacts);

  // ============================================================================
  // PHASE 3: VALUE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing initiative value');
  const valueAssessment = await ctx.task(valueAssessmentTask, {
    initiatives: alignmentScoring.scoredInitiatives,
    organizationContext,
    outputDir
  });

  artifacts.push(...valueAssessment.artifacts);

  // ============================================================================
  // PHASE 4: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing initiative risks');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    initiatives: valueAssessment.assessedInitiatives,
    organizationContext,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 5: RESOURCE REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing resource requirements');
  const resourceAnalysis = await ctx.task(resourceAnalysisTask, {
    initiatives: riskAssessment.assessedInitiatives,
    resourceConstraints,
    outputDir
  });

  artifacts.push(...resourceAnalysis.artifacts);

  // Breakpoint: Review initiative assessments
  await ctx.breakpoint({
    question: `Initiative assessments complete. ${initiativeInventory.classifiedInitiatives.length} initiatives analyzed. Review before prioritization?`,
    title: 'Initiative Portfolio Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        totalInitiatives: initiativeInventory.classifiedInitiatives.length,
        highAlignmentCount: alignmentScoring.highAlignmentCount,
        highValueCount: valueAssessment.highValueCount,
        highRiskCount: riskAssessment.highRiskCount
      }
    }
  });

  // ============================================================================
  // PHASE 6: PRIORITIZATION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Applying prioritization framework');
  const prioritization = await ctx.task(prioritizationTask, {
    initiatives: resourceAnalysis.analyzedInitiatives,
    strategicObjectives,
    outputDir
  });

  artifacts.push(...prioritization.artifacts);

  // ============================================================================
  // PHASE 7: PORTFOLIO BALANCING
  // ============================================================================

  ctx.log('info', 'Phase 7: Balancing portfolio');
  const portfolioBalancing = await ctx.task(portfolioBalancingTask, {
    prioritizedInitiatives: prioritization.prioritizedInitiatives,
    resourceConstraints,
    strategicObjectives,
    outputDir
  });

  artifacts.push(...portfolioBalancing.artifacts);

  // ============================================================================
  // PHASE 8: DEPENDENCY MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Managing initiative dependencies');
  const dependencyManagement = await ctx.task(dependencyManagementTask, {
    portfolio: portfolioBalancing.balancedPortfolio,
    outputDir
  });

  artifacts.push(...dependencyManagement.artifacts);

  // ============================================================================
  // PHASE 9: RESOURCE ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Allocating resources');
  const resourceAllocation = await ctx.task(resourceAllocationTask, {
    portfolio: dependencyManagement.sequencedPortfolio,
    resourceConstraints,
    outputDir
  });

  artifacts.push(...resourceAllocation.artifacts);

  // ============================================================================
  // PHASE 10: GOVERNANCE FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 10: Establishing governance framework');
  const governanceFramework = await ctx.task(governanceFrameworkTask, {
    portfolio: resourceAllocation.allocatedPortfolio,
    organizationContext,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 11: GENERATE PORTFOLIO DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating portfolio documentation');
  const portfolioDocumentation = await ctx.task(portfolioDocumentationTask, {
    initiativeInventory,
    alignmentScoring,
    valueAssessment,
    riskAssessment,
    resourceAnalysis,
    prioritization,
    portfolioBalancing,
    dependencyManagement,
    resourceAllocation,
    governanceFramework,
    outputDir
  });

  artifacts.push(...portfolioDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    portfolio: {
      activeInitiatives: portfolioBalancing.balancedPortfolio.active,
      pipelineInitiatives: portfolioBalancing.balancedPortfolio.pipeline,
      deferredInitiatives: portfolioBalancing.balancedPortfolio.deferred
    },
    prioritizedInitiatives: prioritization.prioritizedInitiatives,
    resourceAllocation: resourceAllocation.allocation,
    governance: governanceFramework.framework,
    portfolioMetrics: portfolioBalancing.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/strategic-initiative-portfolio',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Initiative Inventory
export const initiativeInventoryTask = defineTask('initiative-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory and classify initiatives',
  agent: {
    name: 'portfolio-analyst',
    prompt: {
      role: 'strategic initiative portfolio analyst',
      task: 'Create comprehensive inventory and classification of initiatives',
      context: args,
      instructions: [
        'Create initiative inventory with:',
        '  - Initiative name and description',
        '  - Sponsor and owner',
        '  - Current status',
        '  - Budget and timeline',
        'Classify initiatives by:',
        '  - Type: Growth, Efficiency, Compliance, Maintenance',
        '  - Horizon: H1 (core), H2 (emerging), H3 (future)',
        '  - Size: Small, Medium, Large, Transformational',
        'Link to strategic objectives',
        'Identify duplicate or overlapping initiatives',
        'Save inventory to output directory'
      ],
      outputFormat: 'JSON with classifiedInitiatives (array), classifications (object), duplicates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['classifiedInitiatives', 'artifacts'],
      properties: {
        classifiedInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              horizon: { type: 'string' },
              size: { type: 'string' },
              status: { type: 'string' },
              linkedObjectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        classifications: { type: 'object' },
        duplicates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'inventory']
}));

// Task 2: Alignment Scoring
export const alignmentScoringTask = defineTask('alignment-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score strategic alignment',
  agent: {
    name: 'alignment-analyst',
    prompt: {
      role: 'strategic alignment analyst',
      task: 'Score each initiative on strategic alignment',
      context: args,
      instructions: [
        'Score alignment for each initiative (0-100):',
        '  - Direct support of strategic objectives',
        '  - Number of objectives supported',
        '  - Criticality to objective achievement',
        '  - Alignment with mission and values',
        'Create alignment matrix:',
        '  - Initiatives vs Objectives',
        '  - Contribution strength (strong/moderate/weak)',
        'Identify high-alignment initiatives',
        'Identify orphan initiatives (no alignment)',
        'Save scoring to output directory'
      ],
      outputFormat: 'JSON with scoredInitiatives (array with alignmentScore), alignmentMatrix (object), highAlignmentCount (number), orphans (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scoredInitiatives', 'highAlignmentCount', 'artifacts'],
      properties: {
        scoredInitiatives: { type: 'array' },
        alignmentMatrix: { type: 'object' },
        highAlignmentCount: { type: 'number' },
        orphans: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'alignment']
}));

// Task 3: Value Assessment
export const valueAssessmentTask = defineTask('value-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess initiative value',
  agent: {
    name: 'value-analyst',
    prompt: {
      role: 'initiative value analyst',
      task: 'Assess the expected value of each initiative',
      context: args,
      instructions: [
        'Assess value dimensions:',
        '  - Financial value (NPV, ROI, payback)',
        '  - Strategic value (competitive advantage)',
        '  - Operational value (efficiency gains)',
        '  - Customer value (satisfaction, retention)',
        '  - Risk reduction value',
        'Calculate composite value score (0-100)',
        'Estimate value timing (when benefits realize)',
        'Assess value certainty (confidence level)',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with assessedInitiatives (array with valueScore), highValueCount (number), valueTimeline (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedInitiatives', 'highValueCount', 'artifacts'],
      properties: {
        assessedInitiatives: { type: 'array' },
        highValueCount: { type: 'number' },
        valueTimeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'value']
}));

// Task 4: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess initiative risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'initiative risk analyst',
      task: 'Assess the risks associated with each initiative',
      context: args,
      instructions: [
        'Assess risk dimensions:',
        '  - Execution risk (can we deliver?)',
        '  - Technology risk',
        '  - Resource risk',
        '  - Dependency risk',
        '  - Business risk (will benefits realize?)',
        'Calculate composite risk score (0-100)',
        'Identify critical risks',
        'Assess organizational risk appetite',
        'Recommend risk mitigation',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with assessedInitiatives (array with riskScore), highRiskCount (number), criticalRisks (array), mitigations (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedInitiatives', 'highRiskCount', 'artifacts'],
      properties: {
        assessedInitiatives: { type: 'array' },
        highRiskCount: { type: 'number' },
        criticalRisks: { type: 'array' },
        mitigations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'risk']
}));

// Task 5: Resource Analysis
export const resourceAnalysisTask = defineTask('resource-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze resource requirements',
  agent: {
    name: 'resource-analyst',
    prompt: {
      role: 'resource requirements analyst',
      task: 'Analyze resource requirements for each initiative',
      context: args,
      instructions: [
        'Analyze resource requirements:',
        '  - Financial investment (CapEx, OpEx)',
        '  - Human resources (FTEs, skills)',
        '  - Technology resources',
        '  - External resources (vendors, consultants)',
        'Compare to constraints:',
        '  - Budget availability',
        '  - Capacity availability',
        '  - Skill availability',
        'Calculate resource efficiency ratio',
        'Identify resource-constrained initiatives',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with analyzedInitiatives (array with resourceRequirements), totalRequirements (object), constraintAnalysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedInitiatives', 'artifacts'],
      properties: {
        analyzedInitiatives: { type: 'array' },
        totalRequirements: { type: 'object' },
        constraintAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'resources']
}));

// Task 6: Prioritization
export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply prioritization framework',
  agent: {
    name: 'prioritization-expert',
    prompt: {
      role: 'portfolio prioritization expert',
      task: 'Apply prioritization framework to rank initiatives',
      context: args,
      instructions: [
        'Apply prioritization criteria:',
        '  - Strategic alignment (weight: 30%)',
        '  - Value potential (weight: 30%)',
        '  - Risk-adjusted return (weight: 20%)',
        '  - Resource efficiency (weight: 10%)',
        '  - Strategic urgency (weight: 10%)',
        'Calculate weighted priority score',
        'Create priority ranking',
        'Identify must-do, should-do, could-do',
        'Apply tie-breaking rules',
        'Save prioritization to output directory'
      ],
      outputFormat: 'JSON with prioritizedInitiatives (array sorted by priority), priorityTiers (object), scoringDetails (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedInitiatives', 'artifacts'],
      properties: {
        prioritizedInitiatives: { type: 'array' },
        priorityTiers: { type: 'object' },
        scoringDetails: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'prioritization']
}));

// Task 7: Portfolio Balancing
export const portfolioBalancingTask = defineTask('portfolio-balancing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Balance portfolio',
  agent: {
    name: 'portfolio-manager',
    prompt: {
      role: 'strategic portfolio manager',
      task: 'Balance the initiative portfolio across dimensions',
      context: args,
      instructions: [
        'Balance portfolio across:',
        '  - Strategic themes (ensure coverage)',
        '  - Time horizons (H1/H2/H3 mix)',
        '  - Risk profile (high/medium/low)',
        '  - Initiative types (growth/efficiency/compliance)',
        'Apply resource constraints',
        'Create three portfolio tiers:',
        '  - Active: Funded and in progress',
        '  - Pipeline: Approved, awaiting resources',
        '  - Deferred: Parked for future consideration',
        'Calculate portfolio metrics',
        'Save balanced portfolio to output directory'
      ],
      outputFormat: 'JSON with balancedPortfolio (object with active, pipeline, deferred), metrics (object), balanceAnalysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['balancedPortfolio', 'metrics', 'artifacts'],
      properties: {
        balancedPortfolio: {
          type: 'object',
          properties: {
            active: { type: 'array' },
            pipeline: { type: 'array' },
            deferred: { type: 'array' }
          }
        },
        metrics: { type: 'object' },
        balanceAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'balancing']
}));

// Task 8: Dependency Management
export const dependencyManagementTask = defineTask('dependency-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage initiative dependencies',
  agent: {
    name: 'dependency-manager',
    prompt: {
      role: 'initiative dependency manager',
      task: 'Map and manage dependencies between initiatives',
      context: args,
      instructions: [
        'Map dependencies:',
        '  - Technical dependencies',
        '  - Resource dependencies',
        '  - Timing dependencies',
        '  - Data dependencies',
        'Create dependency graph',
        'Identify dependency chains',
        'Optimize sequencing based on dependencies',
        'Identify critical path',
        'Flag dependency risks',
        'Save dependency analysis to output directory'
      ],
      outputFormat: 'JSON with sequencedPortfolio (object), dependencyGraph (object), criticalPath (array), dependencyRisks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sequencedPortfolio', 'artifacts'],
      properties: {
        sequencedPortfolio: { type: 'object' },
        dependencyGraph: { type: 'object' },
        criticalPath: { type: 'array' },
        dependencyRisks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'dependencies']
}));

// Task 9: Resource Allocation
export const resourceAllocationTask = defineTask('resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate resources',
  agent: {
    name: 'allocation-manager',
    prompt: {
      role: 'resource allocation manager',
      task: 'Allocate resources to portfolio initiatives',
      context: args,
      instructions: [
        'Allocate resources by:',
        '  - Priority order',
        '  - Dependency sequence',
        '  - Constraint availability',
        'Create allocation plan:',
        '  - Budget allocation by initiative',
        '  - FTE allocation by initiative',
        '  - Timeline allocation',
        'Identify allocation conflicts',
        'Create resource loading chart',
        'Save allocation to output directory'
      ],
      outputFormat: 'JSON with allocatedPortfolio (object), allocation (object), conflicts (array), loadingChart (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allocatedPortfolio', 'allocation', 'artifacts'],
      properties: {
        allocatedPortfolio: { type: 'object' },
        allocation: { type: 'object' },
        conflicts: { type: 'array' },
        loadingChart: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'allocation']
}));

// Task 10: Governance Framework
export const governanceFrameworkTask = defineTask('governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish governance framework',
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'portfolio governance designer',
      task: 'Establish governance framework for portfolio management',
      context: args,
      instructions: [
        'Design governance structure:',
        '  - Portfolio steering committee',
        '  - Decision rights and escalation',
        '  - Review cadence',
        '  - Stage-gate process',
        'Define processes:',
        '  - New initiative intake',
        '  - Prioritization reviews',
        '  - Progress monitoring',
        '  - Benefit realization tracking',
        'Create reporting framework',
        'Define roles and responsibilities',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with framework (object with structure, processes, reporting, roles), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            structure: { type: 'object' },
            processes: { type: 'object' },
            reporting: { type: 'object' },
            roles: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'governance']
}));

// Task 11: Portfolio Documentation
export const portfolioDocumentationTask = defineTask('portfolio-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate portfolio documentation',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'portfolio management consultant and technical writer',
      task: 'Generate comprehensive portfolio documentation',
      context: args,
      instructions: [
        'Create executive summary',
        'Document portfolio composition',
        'Present prioritization methodology and results',
        'Include portfolio balance analysis',
        'Document resource allocation',
        'Include dependency map',
        'Present governance framework',
        'Add portfolio dashboard template',
        'Include implementation roadmap',
        'Save documentation to output directory'
      ],
      outputFormat: 'JSON with documentPath (string), executiveSummary (string), keyMetrics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyMetrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'portfolio', 'documentation']
}));
