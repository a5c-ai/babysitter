/**
 * @process business-strategy/mckinsey-7s-alignment
 * @description Organizational alignment analysis using McKinsey 7S Framework for strategy implementation
 * @inputs { organizationName: string, strategyContext: object, organizationalData: object, targetState: object }
 * @outputs { success: boolean, sevenSAssessment: object, alignmentGaps: array, remediationPlans: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    strategyContext = {},
    organizationalData = {},
    targetState = {},
    outputDir = '7s-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting McKinsey 7S Alignment Analysis for ${organizationName}`);

  // ============================================================================
  // PHASE 1: STRATEGY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing Strategy alignment');
  const strategyAssessment = await ctx.task(strategyElementTask, {
    organizationName,
    strategyContext,
    organizationalData,
    outputDir
  });

  artifacts.push(...strategyAssessment.artifacts);

  // ============================================================================
  // PHASE 2: STRUCTURE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing Structure alignment');
  const structureAssessment = await ctx.task(structureElementTask, {
    organizationName,
    strategyContext,
    organizationalData,
    outputDir
  });

  artifacts.push(...structureAssessment.artifacts);

  // ============================================================================
  // PHASE 3: SYSTEMS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing Systems alignment');
  const systemsAssessment = await ctx.task(systemsElementTask, {
    organizationName,
    strategyContext,
    organizationalData,
    outputDir
  });

  artifacts.push(...systemsAssessment.artifacts);

  // ============================================================================
  // PHASE 4: SHARED VALUES ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing Shared Values alignment');
  const sharedValuesAssessment = await ctx.task(sharedValuesElementTask, {
    organizationName,
    strategyContext,
    organizationalData,
    outputDir
  });

  artifacts.push(...sharedValuesAssessment.artifacts);

  // ============================================================================
  // PHASE 5: SKILLS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing Skills alignment');
  const skillsAssessment = await ctx.task(skillsElementTask, {
    organizationName,
    strategyContext,
    organizationalData,
    outputDir
  });

  artifacts.push(...skillsAssessment.artifacts);

  // ============================================================================
  // PHASE 6: STYLE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing Style (Leadership) alignment');
  const styleAssessment = await ctx.task(styleElementTask, {
    organizationName,
    strategyContext,
    organizationalData,
    outputDir
  });

  artifacts.push(...styleAssessment.artifacts);

  // ============================================================================
  // PHASE 7: STAFF ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing Staff alignment');
  const staffAssessment = await ctx.task(staffElementTask, {
    organizationName,
    strategyContext,
    organizationalData,
    outputDir
  });

  artifacts.push(...staffAssessment.artifacts);

  // ============================================================================
  // PHASE 8: ALIGNMENT GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing alignment gaps across all 7S');
  const alignmentGapAnalysis = await ctx.task(alignmentGapAnalysisTask, {
    organizationName,
    strategyAssessment,
    structureAssessment,
    systemsAssessment,
    sharedValuesAssessment,
    skillsAssessment,
    styleAssessment,
    staffAssessment,
    targetState,
    outputDir
  });

  artifacts.push(...alignmentGapAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: REMEDIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing remediation plans for alignment gaps');
  const remediationPlanning = await ctx.task(remediationPlanningTask, {
    organizationName,
    alignmentGapAnalysis,
    targetState,
    outputDir
  });

  artifacts.push(...remediationPlanning.artifacts);

  // ============================================================================
  // PHASE 10: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive 7S Alignment report');
  const sevenSReport = await ctx.task(sevenSReportTask, {
    organizationName,
    strategyAssessment,
    structureAssessment,
    systemsAssessment,
    sharedValuesAssessment,
    skillsAssessment,
    styleAssessment,
    staffAssessment,
    alignmentGapAnalysis,
    remediationPlanning,
    outputDir
  });

  artifacts.push(...sevenSReport.artifacts);

  // Breakpoint: Review 7S alignment analysis
  await ctx.breakpoint({
    question: `McKinsey 7S alignment analysis complete for ${organizationName}. Overall alignment score: ${alignmentGapAnalysis.overallAlignment}/100. Review findings?`,
    title: 'McKinsey 7S Alignment Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organizationName,
        elementScores: {
          strategy: strategyAssessment.alignmentScore,
          structure: structureAssessment.alignmentScore,
          systems: systemsAssessment.alignmentScore,
          sharedValues: sharedValuesAssessment.alignmentScore,
          skills: skillsAssessment.alignmentScore,
          style: styleAssessment.alignmentScore,
          staff: staffAssessment.alignmentScore
        },
        overallAlignment: alignmentGapAnalysis.overallAlignment,
        criticalGaps: alignmentGapAnalysis.criticalGaps?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    sevenSAssessment: {
      strategy: strategyAssessment.assessment,
      structure: structureAssessment.assessment,
      systems: systemsAssessment.assessment,
      sharedValues: sharedValuesAssessment.assessment,
      skills: skillsAssessment.assessment,
      style: styleAssessment.assessment,
      staff: staffAssessment.assessment
    },
    alignmentGaps: alignmentGapAnalysis.gaps,
    overallAlignment: alignmentGapAnalysis.overallAlignment,
    remediationPlans: remediationPlanning.plans,
    reportPath: sevenSReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/mckinsey-7s-alignment',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Strategy Element Assessment
export const strategyElementTask = defineTask('strategy-element', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Strategy element alignment',
  agent: {
    name: 'strategy-assessor',
    prompt: {
      role: '7S strategy analyst',
      task: 'Assess the Strategy element of the McKinsey 7S framework',
      context: args,
      instructions: [
        'Evaluate clarity of strategic direction and objectives',
        'Assess strategy communication across organization',
        'Evaluate strategic plan robustness and coherence',
        'Assess alignment of strategy with external environment',
        'Evaluate strategic resource allocation',
        'Assess strategy execution capability',
        'Score strategy alignment (0-100)',
        'Identify strategy-related gaps',
        'Generate strategy element assessment report'
      ],
      outputFormat: 'JSON with assessment, alignmentScore, currentState, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'alignmentScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        currentState: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'strategy']
}));

// Task 2: Structure Element Assessment
export const structureElementTask = defineTask('structure-element', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Structure element alignment',
  agent: {
    name: 'structure-assessor',
    prompt: {
      role: '7S structure analyst',
      task: 'Assess the Structure element of the McKinsey 7S framework',
      context: args,
      instructions: [
        'Evaluate organizational design and hierarchy',
        'Assess reporting relationships and spans of control',
        'Evaluate coordination mechanisms',
        'Assess decision-making authority distribution',
        'Evaluate structural alignment with strategy',
        'Assess agility and adaptability of structure',
        'Score structure alignment (0-100)',
        'Identify structure-related gaps',
        'Generate structure element assessment report'
      ],
      outputFormat: 'JSON with assessment, alignmentScore, currentState, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'alignmentScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        currentState: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'structure']
}));

// Task 3: Systems Element Assessment
export const systemsElementTask = defineTask('systems-element', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Systems element alignment',
  agent: {
    name: 'systems-assessor',
    prompt: {
      role: '7S systems analyst',
      task: 'Assess the Systems element of the McKinsey 7S framework',
      context: args,
      instructions: [
        'Evaluate core business processes and workflows',
        'Assess information and communication systems',
        'Evaluate performance management systems',
        'Assess reward and incentive systems',
        'Evaluate planning and budgeting systems',
        'Assess quality management systems',
        'Score systems alignment (0-100)',
        'Identify systems-related gaps',
        'Generate systems element assessment report'
      ],
      outputFormat: 'JSON with assessment, alignmentScore, currentState, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'alignmentScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        currentState: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'systems']
}));

// Task 4: Shared Values Element Assessment
export const sharedValuesElementTask = defineTask('shared-values-element', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Shared Values element alignment',
  agent: {
    name: 'values-assessor',
    prompt: {
      role: '7S culture and values analyst',
      task: 'Assess the Shared Values element of the McKinsey 7S framework',
      context: args,
      instructions: [
        'Evaluate core values and beliefs of the organization',
        'Assess organizational culture characteristics',
        'Evaluate values alignment with strategy',
        'Assess values consistency across organization',
        'Evaluate how values influence behavior',
        'Assess cultural adaptability and change readiness',
        'Score shared values alignment (0-100)',
        'Identify values-related gaps',
        'Generate shared values element assessment report'
      ],
      outputFormat: 'JSON with assessment, alignmentScore, currentState, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'alignmentScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        currentState: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'shared-values']
}));

// Task 5: Skills Element Assessment
export const skillsElementTask = defineTask('skills-element', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Skills element alignment',
  agent: {
    name: 'skills-assessor',
    prompt: {
      role: '7S skills and capabilities analyst',
      task: 'Assess the Skills element of the McKinsey 7S framework',
      context: args,
      instructions: [
        'Evaluate distinctive organizational capabilities',
        'Assess core competencies and their development',
        'Evaluate technical and functional skills',
        'Assess management and leadership capabilities',
        'Evaluate skills gaps relative to strategy needs',
        'Assess learning and development effectiveness',
        'Score skills alignment (0-100)',
        'Identify skills-related gaps',
        'Generate skills element assessment report'
      ],
      outputFormat: 'JSON with assessment, alignmentScore, currentState, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'alignmentScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        currentState: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'skills']
}));

// Task 6: Style Element Assessment
export const styleElementTask = defineTask('style-element', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Style (Leadership) element alignment',
  agent: {
    name: 'style-assessor',
    prompt: {
      role: '7S leadership style analyst',
      task: 'Assess the Style element of the McKinsey 7S framework',
      context: args,
      instructions: [
        'Evaluate leadership style characteristics',
        'Assess management approach and practices',
        'Evaluate decision-making patterns',
        'Assess leadership alignment with strategy requirements',
        'Evaluate communication style and effectiveness',
        'Assess change leadership capability',
        'Score style alignment (0-100)',
        'Identify style-related gaps',
        'Generate style element assessment report'
      ],
      outputFormat: 'JSON with assessment, alignmentScore, currentState, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'alignmentScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        currentState: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'style']
}));

// Task 7: Staff Element Assessment
export const staffElementTask = defineTask('staff-element', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Staff element alignment',
  agent: {
    name: 'staff-assessor',
    prompt: {
      role: '7S human resources analyst',
      task: 'Assess the Staff element of the McKinsey 7S framework',
      context: args,
      instructions: [
        'Evaluate talent acquisition and quality',
        'Assess workforce composition and diversity',
        'Evaluate talent development and succession planning',
        'Assess employee engagement and retention',
        'Evaluate staffing levels relative to needs',
        'Assess performance management effectiveness',
        'Score staff alignment (0-100)',
        'Identify staff-related gaps',
        'Generate staff element assessment report'
      ],
      outputFormat: 'JSON with assessment, alignmentScore, currentState, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'alignmentScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        alignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        currentState: { type: 'string' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'staff']
}));

// Task 8: Alignment Gap Analysis
export const alignmentGapAnalysisTask = defineTask('alignment-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze alignment gaps across all 7S elements',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: '7S integration and alignment specialist',
      task: 'Analyze alignment gaps across all 7S elements',
      context: args,
      instructions: [
        'Consolidate gaps from all seven elements',
        'Analyze inter-element alignment (how elements support each other)',
        'Identify critical misalignments impacting strategy execution',
        'Assess hard elements (Strategy, Structure, Systems) alignment',
        'Assess soft elements (Shared Values, Skills, Style, Staff) alignment',
        'Calculate overall organizational alignment score',
        'Prioritize gaps by impact on strategy execution',
        'Generate alignment gap analysis report'
      ],
      outputFormat: 'JSON with gaps, criticalGaps, interElementAlignment, overallAlignment, hardElementsScore, softElementsScore, prioritizedGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'overallAlignment', 'artifacts'],
      properties: {
        gaps: { type: 'array', items: { type: 'object' } },
        criticalGaps: { type: 'array', items: { type: 'object' } },
        interElementAlignment: { type: 'object' },
        overallAlignment: { type: 'number', minimum: 0, maximum: 100 },
        hardElementsScore: { type: 'number' },
        softElementsScore: { type: 'number' },
        prioritizedGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'gap-analysis']
}));

// Task 9: Remediation Planning
export const remediationPlanningTask = defineTask('remediation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop remediation plans for alignment gaps',
  agent: {
    name: 'remediation-planner',
    prompt: {
      role: 'organizational transformation specialist',
      task: 'Develop remediation plans to close alignment gaps',
      context: args,
      instructions: [
        'Develop improvement plans for hard elements (Strategy, Structure, Systems)',
        'Develop development plans for soft elements (Shared Values, Skills, Style, Staff)',
        'Prioritize remediation actions by impact and feasibility',
        'Define quick wins vs. long-term initiatives',
        'Identify change management requirements',
        'Estimate resources and timelines',
        'Define success metrics for each remediation',
        'Generate comprehensive remediation plan'
      ],
      outputFormat: 'JSON with plans (by element), hardElementsPlans, softElementsPlans, quickWins, longTermInitiatives, changeManagement, resourceRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plans', 'artifacts'],
      properties: {
        plans: { type: 'object' },
        hardElementsPlans: { type: 'array', items: { type: 'object' } },
        softElementsPlans: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        longTermInitiatives: { type: 'array', items: { type: 'object' } },
        changeManagement: { type: 'object' },
        resourceRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'remediation']
}));

// Task 10: 7S Report Generation
export const sevenSReportTask = defineTask('7s-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive 7S Alignment report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'organizational strategy report author',
      task: 'Generate comprehensive McKinsey 7S Alignment report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present 7S framework overview and methodology',
        'Document each element assessment in detail',
        'Include 7S alignment visualization/diagram',
        'Present gap analysis findings',
        'Document remediation plans',
        'Include implementation roadmap',
        'Add quick wins and long-term initiatives',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '7s', 'reporting']
}));
