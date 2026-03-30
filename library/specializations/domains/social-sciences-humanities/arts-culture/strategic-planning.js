/**
 * @process arts-culture/strategic-planning
 * @description Framework for developing organizational vision, mission, goals, and implementation strategies for cultural institutions using balanced scorecard and cultural vitality approaches
 * @inputs { organizationName: string, organizationType: string, currentState: object, planningHorizon: string }
 * @outputs { success: boolean, strategicPlan: object, implementation: object, metrics: array, artifacts: array }
 * @recommendedSkills SK-AC-002 (grant-proposal-writing), SK-AC-009 (donor-relationship-management), SK-AC-013 (stakeholder-facilitation), SK-AC-010 (cultural-policy-analysis)
 * @recommendedAgents AG-AC-002 (arts-administrator-agent), AG-AC-009 (cultural-policy-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    organizationType = 'museum',
    currentState = {},
    planningHorizon = '5-year',
    stakeholders = [],
    outputDir = 'strategic-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Environmental Scan and Assessment
  ctx.log('info', 'Conducting environmental scan and organizational assessment');
  const environmentalScan = await ctx.task(environmentalScanTask, {
    organizationName,
    organizationType,
    currentState,
    outputDir
  });

  if (!environmentalScan.success) {
    return {
      success: false,
      error: 'Environmental scan failed',
      details: environmentalScan,
      metadata: { processId: 'arts-culture/strategic-planning', timestamp: startTime }
    };
  }

  artifacts.push(...environmentalScan.artifacts);

  // Task 2: Stakeholder Analysis and Engagement
  ctx.log('info', 'Analyzing stakeholders and planning engagement');
  const stakeholderAnalysis = await ctx.task(stakeholderAnalysisTask, {
    organizationName,
    stakeholders,
    environmentalScan: environmentalScan.findings,
    outputDir
  });

  artifacts.push(...stakeholderAnalysis.artifacts);

  // Task 3: Vision and Mission Development
  ctx.log('info', 'Developing vision and mission statements');
  const visionMission = await ctx.task(visionMissionTask, {
    organizationName,
    organizationType,
    currentState,
    stakeholderInput: stakeholderAnalysis.insights,
    environmentalScan: environmentalScan.findings,
    outputDir
  });

  artifacts.push(...visionMission.artifacts);

  // Task 4: Strategic Goals and Objectives
  ctx.log('info', 'Defining strategic goals and objectives');
  const strategicGoals = await ctx.task(strategicGoalsTask, {
    visionMission: visionMission.statements,
    planningHorizon,
    environmentalScan: environmentalScan.findings,
    outputDir
  });

  artifacts.push(...strategicGoals.artifacts);

  // Task 5: Cultural Vitality Framework
  ctx.log('info', 'Applying cultural vitality framework');
  const culturalVitality = await ctx.task(culturalVitalityTask, {
    organizationName,
    organizationType,
    strategicGoals: strategicGoals.goals,
    outputDir
  });

  artifacts.push(...culturalVitality.artifacts);

  // Task 6: Balanced Scorecard Development
  ctx.log('info', 'Developing balanced scorecard metrics');
  const balancedScorecard = await ctx.task(balancedScorecardTask, {
    strategicGoals: strategicGoals.goals,
    culturalVitality: culturalVitality.framework,
    planningHorizon,
    outputDir
  });

  artifacts.push(...balancedScorecard.artifacts);

  // Breakpoint: Review strategic framework
  await ctx.breakpoint({
    question: `Strategic framework for ${organizationName} complete. ${strategicGoals.goals.length} strategic goals defined. Review and approve strategic direction?`,
    title: 'Strategic Planning Framework Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        organizationName,
        planningHorizon,
        vision: visionMission.statements.vision,
        goalCount: strategicGoals.goals.length,
        scorecardPerspectives: balancedScorecard.perspectives.length
      }
    }
  });

  // Task 7: Implementation Roadmap
  ctx.log('info', 'Creating implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    strategicGoals: strategicGoals.goals,
    balancedScorecard,
    planningHorizon,
    currentState,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // Task 8: Resource Allocation Plan
  ctx.log('info', 'Developing resource allocation plan');
  const resourcePlan = await ctx.task(resourceAllocationTask, {
    implementationRoadmap: implementationRoadmap.roadmap,
    strategicGoals: strategicGoals.goals,
    outputDir
  });

  artifacts.push(...resourcePlan.artifacts);

  // Task 9: Generate Strategic Plan Document
  ctx.log('info', 'Generating comprehensive strategic plan document');
  const strategicPlanDoc = await ctx.task(strategicPlanDocumentTask, {
    organizationName,
    planningHorizon,
    environmentalScan,
    visionMission,
    strategicGoals,
    culturalVitality,
    balancedScorecard,
    implementationRoadmap,
    resourcePlan,
    outputDir
  });

  artifacts.push(...strategicPlanDoc.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    strategicPlan: {
      vision: visionMission.statements.vision,
      mission: visionMission.statements.mission,
      values: visionMission.statements.values,
      goals: strategicGoals.goals,
      planningHorizon
    },
    implementation: {
      roadmap: implementationRoadmap.roadmap,
      resourcePlan: resourcePlan.allocation,
      milestones: implementationRoadmap.milestones
    },
    metrics: balancedScorecard.metrics,
    culturalVitality: culturalVitality.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/strategic-planning',
      timestamp: startTime,
      organizationName
    }
  };
}

// Task 1: Environmental Scan
export const environmentalScanTask = defineTask('environmental-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct environmental scan',
  agent: {
    name: 'strategic-analyst',
    prompt: {
      role: 'arts strategic planning consultant',
      task: 'Conduct comprehensive environmental scan for cultural organization',
      context: args,
      instructions: [
        'Analyze internal strengths and weaknesses',
        'Identify external opportunities and threats',
        'Review industry trends and best practices',
        'Assess competitive landscape and peer institutions',
        'Analyze demographic and community trends',
        'Evaluate funding landscape and economic factors',
        'Review technology trends affecting cultural sector',
        'Document findings in SWOT framework'
      ],
      outputFormat: 'JSON with success, findings, swotAnalysis, trends, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            opportunities: { type: 'array', items: { type: 'string' } },
            threats: { type: 'array', items: { type: 'string' } }
          }
        },
        swotAnalysis: { type: 'object' },
        trends: { type: 'array' },
        peerAnalysis: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'environmental-scan', 'swot']
}));

// Task 2: Stakeholder Analysis
export const stakeholderAnalysisTask = defineTask('stakeholder-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze stakeholders',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'stakeholder engagement specialist',
      task: 'Analyze key stakeholders and plan engagement strategy',
      context: args,
      instructions: [
        'Identify all key stakeholder groups',
        'Map stakeholder interests and influence',
        'Analyze stakeholder expectations and concerns',
        'Plan engagement methods for each group',
        'Design stakeholder input gathering process',
        'Create communication plan for planning process',
        'Identify potential champions and resistors',
        'Document stakeholder insights and priorities'
      ],
      outputFormat: 'JSON with stakeholderMap, insights, engagementPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderMap', 'insights', 'artifacts'],
      properties: {
        stakeholderMap: { type: 'array' },
        insights: { type: 'array' },
        engagementPlan: { type: 'object' },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'stakeholder-analysis', 'engagement']
}));

// Task 3: Vision and Mission Development
export const visionMissionTask = defineTask('vision-mission', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop vision and mission',
  agent: {
    name: 'vision-facilitator',
    prompt: {
      role: 'organizational vision consultant',
      task: 'Develop inspiring vision, mission, and values statements',
      context: args,
      instructions: [
        'Review current vision, mission, values if existing',
        'Synthesize stakeholder input and aspirations',
        'Craft compelling vision statement for future state',
        'Develop clear mission statement of purpose',
        'Articulate core organizational values',
        'Ensure alignment with cultural sector standards',
        'Create statement rationale and interpretation',
        'Test statements for clarity and inspiration'
      ],
      outputFormat: 'JSON with statements, rationale, alternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['statements', 'artifacts'],
      properties: {
        statements: {
          type: 'object',
          properties: {
            vision: { type: 'string' },
            mission: { type: 'string' },
            values: { type: 'array', items: { type: 'string' } }
          }
        },
        rationale: { type: 'object' },
        alternativeStatements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'vision-mission', 'values']
}));

// Task 4: Strategic Goals and Objectives
export const strategicGoalsTask = defineTask('strategic-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define strategic goals',
  agent: {
    name: 'goals-strategist',
    prompt: {
      role: 'strategic planning facilitator',
      task: 'Define strategic goals, objectives, and success measures',
      context: args,
      instructions: [
        'Derive strategic goals from vision and mission',
        'Ensure goals address SWOT findings',
        'Create SMART objectives for each goal',
        'Define key performance indicators',
        'Establish baseline and target measures',
        'Prioritize goals by impact and feasibility',
        'Map goal interdependencies',
        'Align goals with cultural sector best practices'
      ],
      outputFormat: 'JSON with goals, objectives, kpis, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['goals', 'artifacts'],
      properties: {
        goals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              goal: { type: 'string' },
              objectives: { type: 'array' },
              kpis: { type: 'array' },
              priority: { type: 'string' }
            }
          }
        },
        priorities: { type: 'array' },
        dependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'goals', 'objectives']
}));

// Task 5: Cultural Vitality Framework
export const culturalVitalityTask = defineTask('cultural-vitality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply cultural vitality framework',
  agent: {
    name: 'cultural-vitality-specialist',
    prompt: {
      role: 'cultural sector specialist',
      task: 'Apply cultural vitality framework to strategic planning',
      context: args,
      instructions: [
        'Define cultural vitality dimensions for organization',
        'Assess artistic vibrancy and programming quality',
        'Evaluate community engagement and participation',
        'Analyze cultural ecosystem contributions',
        'Measure cultural diversity and inclusion',
        'Assess organizational sustainability and resilience',
        'Identify cultural impact indicators',
        'Align vitality measures with strategic goals'
      ],
      outputFormat: 'JSON with framework, dimensions, indicators, assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            dimensions: { type: 'array' },
            indicators: { type: 'array' },
            assessmentCriteria: { type: 'object' }
          }
        },
        currentAssessment: { type: 'object' },
        targetState: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'cultural-vitality', 'framework']
}));

// Task 6: Balanced Scorecard Development
export const balancedScorecardTask = defineTask('balanced-scorecard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop balanced scorecard',
  agent: {
    name: 'performance-measurement-specialist',
    prompt: {
      role: 'balanced scorecard consultant',
      task: 'Develop balanced scorecard for cultural organization',
      context: args,
      instructions: [
        'Adapt balanced scorecard for cultural sector',
        'Define financial sustainability perspective',
        'Create audience/stakeholder perspective metrics',
        'Develop internal process perspective measures',
        'Design learning and growth perspective',
        'Link metrics to strategic goals',
        'Establish targets and thresholds',
        'Create scorecard dashboard design'
      ],
      outputFormat: 'JSON with perspectives, metrics, targets, dashboard, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['perspectives', 'metrics', 'artifacts'],
      properties: {
        perspectives: { type: 'array' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              perspective: { type: 'string' },
              metric: { type: 'string' },
              baseline: { type: 'number' },
              target: { type: 'number' },
              frequency: { type: 'string' }
            }
          }
        },
        targets: { type: 'object' },
        dashboardDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'balanced-scorecard', 'metrics']
}));

// Task 7: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'strategic implementation specialist',
      task: 'Develop detailed implementation roadmap',
      context: args,
      instructions: [
        'Create phased implementation timeline',
        'Identify key initiatives and projects',
        'Define milestones and deliverables',
        'Map dependencies and critical path',
        'Assign accountability for initiatives',
        'Identify quick wins and long-term projects',
        'Plan change management approach',
        'Create monitoring and review schedule'
      ],
      outputFormat: 'JSON with roadmap, milestones, initiatives, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'milestones', 'artifacts'],
      properties: {
        roadmap: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            timeline: { type: 'object' },
            criticalPath: { type: 'array' }
          }
        },
        milestones: { type: 'array' },
        initiatives: { type: 'array' },
        changeManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'implementation', 'roadmap']
}));

// Task 8: Resource Allocation
export const resourceAllocationTask = defineTask('resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan resource allocation',
  agent: {
    name: 'resource-planner',
    prompt: {
      role: 'organizational resource planner',
      task: 'Develop resource allocation plan for strategic implementation',
      context: args,
      instructions: [
        'Assess current resource availability',
        'Estimate resource requirements by initiative',
        'Plan financial resource allocation',
        'Identify staffing and capability needs',
        'Plan technology and infrastructure needs',
        'Identify resource gaps and solutions',
        'Create budget alignment recommendations',
        'Develop resource mobilization strategy'
      ],
      outputFormat: 'JSON with allocation, requirements, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allocation', 'artifacts'],
      properties: {
        allocation: {
          type: 'object',
          properties: {
            financial: { type: 'object' },
            staffing: { type: 'object' },
            technology: { type: 'object' }
          }
        },
        requirements: { type: 'array' },
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
  labels: ['agent', 'strategic-planning', 'resource-allocation', 'budgeting']
}));

// Task 9: Strategic Plan Document
export const strategicPlanDocumentTask = defineTask('strategic-plan-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate strategic plan document',
  agent: {
    name: 'strategic-plan-writer',
    prompt: {
      role: 'strategic planning writer',
      task: 'Compile comprehensive strategic plan document',
      context: args,
      instructions: [
        'Create executive summary',
        'Document organizational context and assessment',
        'Present vision, mission, and values',
        'Detail strategic goals and objectives',
        'Include balanced scorecard framework',
        'Present implementation roadmap',
        'Document resource requirements',
        'Create board-ready presentation version'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, sections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array' },
        presentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'strategic-planning', 'documentation', 'reporting']
}));
