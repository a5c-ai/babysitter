/**
 * @process arts-culture/board-governance
 * @description Best practices for managing trustee relations, board meetings, committee structures, fiduciary responsibilities, and organizational oversight
 * @inputs { organizationName: string, boardSize: number, meetingType: string, currentStructure: object }
 * @outputs { success: boolean, governanceFramework: object, meetingMaterials: object, fiduciaryGuidelines: object, artifacts: array }
 * @recommendedSkills SK-AC-013 (stakeholder-facilitation), SK-AC-009 (donor-relationship-management)
 * @recommendedAgents AG-AC-002 (arts-administrator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    boardSize = 15,
    meetingType = 'regular',
    currentStructure = {},
    fiscalYear = new Date().getFullYear(),
    outputDir = 'board-governance-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Governance Structure Assessment
  ctx.log('info', 'Assessing current governance structure');
  const governanceAssessment = await ctx.task(governanceAssessmentTask, {
    organizationName,
    boardSize,
    currentStructure,
    outputDir
  });

  if (!governanceAssessment.success) {
    return {
      success: false,
      error: 'Governance assessment failed',
      details: governanceAssessment,
      metadata: { processId: 'arts-culture/board-governance', timestamp: startTime }
    };
  }

  artifacts.push(...governanceAssessment.artifacts);

  // Task 2: Committee Structure Development
  ctx.log('info', 'Developing committee structure');
  const committeeStructure = await ctx.task(committeeStructureTask, {
    organizationName,
    boardSize,
    governanceAssessment: governanceAssessment.findings,
    outputDir
  });

  artifacts.push(...committeeStructure.artifacts);

  // Task 3: Fiduciary Responsibilities Framework
  ctx.log('info', 'Defining fiduciary responsibilities framework');
  const fiduciaryFramework = await ctx.task(fiduciaryFrameworkTask, {
    organizationName,
    boardSize,
    currentStructure,
    outputDir
  });

  artifacts.push(...fiduciaryFramework.artifacts);

  // Task 4: Board Meeting Planning
  ctx.log('info', 'Planning board meeting structure and materials');
  const meetingPlanning = await ctx.task(meetingPlanningTask, {
    organizationName,
    meetingType,
    committeeStructure: committeeStructure.committees,
    fiscalYear,
    outputDir
  });

  artifacts.push(...meetingPlanning.artifacts);

  // Task 5: Trustee Engagement Strategy
  ctx.log('info', 'Developing trustee engagement strategy');
  const trusteeEngagement = await ctx.task(trusteeEngagementTask, {
    organizationName,
    boardSize,
    currentStructure,
    outputDir
  });

  artifacts.push(...trusteeEngagement.artifacts);

  // Task 6: Board Performance Evaluation
  ctx.log('info', 'Creating board performance evaluation framework');
  const performanceEvaluation = await ctx.task(boardPerformanceTask, {
    organizationName,
    committeeStructure: committeeStructure.committees,
    fiduciaryFramework: fiduciaryFramework.responsibilities,
    outputDir
  });

  artifacts.push(...performanceEvaluation.artifacts);

  // Breakpoint: Review governance framework
  await ctx.breakpoint({
    question: `Board governance framework for ${organizationName} complete. ${committeeStructure.committees.length} committees defined. Review and approve governance structure?`,
    title: 'Board Governance Framework Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        organizationName,
        boardSize,
        committeeCount: committeeStructure.committees.length,
        fiduciaryDuties: fiduciaryFramework.responsibilities.length
      }
    }
  });

  // Task 7: Governance Documentation Package
  ctx.log('info', 'Generating governance documentation package');
  const governanceDocs = await ctx.task(governanceDocumentationTask, {
    organizationName,
    governanceAssessment,
    committeeStructure,
    fiduciaryFramework,
    meetingPlanning,
    trusteeEngagement,
    performanceEvaluation,
    outputDir
  });

  artifacts.push(...governanceDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    governanceFramework: {
      structure: governanceAssessment.findings,
      committees: committeeStructure.committees,
      policies: governanceAssessment.policies
    },
    meetingMaterials: {
      agenda: meetingPlanning.agenda,
      calendar: meetingPlanning.calendar,
      templates: meetingPlanning.templates
    },
    fiduciaryGuidelines: {
      responsibilities: fiduciaryFramework.responsibilities,
      dutyOfCare: fiduciaryFramework.dutyOfCare,
      dutyOfLoyalty: fiduciaryFramework.dutyOfLoyalty,
      dutyOfObedience: fiduciaryFramework.dutyOfObedience
    },
    trusteeEngagement: trusteeEngagement.strategy,
    performanceFramework: performanceEvaluation.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/board-governance',
      timestamp: startTime,
      organizationName
    }
  };
}

// Task 1: Governance Structure Assessment
export const governanceAssessmentTask = defineTask('governance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess governance structure',
  agent: {
    name: 'governance-consultant',
    prompt: {
      role: 'nonprofit governance consultant',
      task: 'Assess current board governance structure and identify improvements',
      context: args,
      instructions: [
        'Review current bylaws and governance documents',
        'Assess board composition and diversity',
        'Evaluate governance policies and procedures',
        'Compare to AAM and BoardSource best practices',
        'Identify governance gaps and risks',
        'Review conflict of interest policies',
        'Assess board-staff relationships',
        'Document recommendations for improvement'
      ],
      outputFormat: 'JSON with success, findings, policies, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'object',
          properties: {
            composition: { type: 'object' },
            diversity: { type: 'object' },
            policies: { type: 'array' },
            gaps: { type: 'array' }
          }
        },
        policies: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'governance', 'assessment', 'nonprofit']
}));

// Task 2: Committee Structure
export const committeeStructureTask = defineTask('committee-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop committee structure',
  agent: {
    name: 'committee-specialist',
    prompt: {
      role: 'board committee specialist',
      task: 'Design effective committee structure for cultural organization',
      context: args,
      instructions: [
        'Define standing committees (Executive, Finance, Governance, etc.)',
        'Create committee charters and responsibilities',
        'Establish committee composition requirements',
        'Define committee meeting frequency and reporting',
        'Design ad hoc committee guidelines',
        'Create committee assignment process',
        'Establish committee chair responsibilities',
        'Develop committee-board reporting structure'
      ],
      outputFormat: 'JSON with committees, charters, guidelines, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['committees', 'artifacts'],
      properties: {
        committees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              composition: { type: 'object' },
              meetingFrequency: { type: 'string' },
              responsibilities: { type: 'array' }
            }
          }
        },
        charters: { type: 'array' },
        guidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'governance', 'committees', 'structure']
}));

// Task 3: Fiduciary Framework
export const fiduciaryFrameworkTask = defineTask('fiduciary-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define fiduciary framework',
  agent: {
    name: 'fiduciary-specialist',
    prompt: {
      role: 'nonprofit fiduciary specialist',
      task: 'Define comprehensive fiduciary responsibilities framework',
      context: args,
      instructions: [
        'Define duty of care requirements and expectations',
        'Outline duty of loyalty obligations',
        'Explain duty of obedience responsibilities',
        'Create conflict of interest policies',
        'Develop financial oversight guidelines',
        'Establish risk management responsibilities',
        'Create whistleblower protection policies',
        'Document legal compliance requirements'
      ],
      outputFormat: 'JSON with responsibilities, duties, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['responsibilities', 'artifacts'],
      properties: {
        responsibilities: { type: 'array' },
        dutyOfCare: {
          type: 'object',
          properties: {
            definition: { type: 'string' },
            expectations: { type: 'array' },
            documentation: { type: 'array' }
          }
        },
        dutyOfLoyalty: { type: 'object' },
        dutyOfObedience: { type: 'object' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'governance', 'fiduciary', 'compliance']
}));

// Task 4: Meeting Planning
export const meetingPlanningTask = defineTask('meeting-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan board meetings',
  agent: {
    name: 'board-meeting-planner',
    prompt: {
      role: 'board meeting coordinator',
      task: 'Plan board meeting structure, calendar, and materials',
      context: args,
      instructions: [
        'Create annual board meeting calendar',
        'Design standard meeting agenda template',
        'Establish consent agenda procedures',
        'Create board packet guidelines and timeline',
        'Develop meeting minutes template and process',
        'Plan executive session procedures',
        'Design virtual/hybrid meeting protocols',
        'Create pre-meeting preparation guidelines'
      ],
      outputFormat: 'JSON with calendar, agenda, templates, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['calendar', 'agenda', 'artifacts'],
      properties: {
        calendar: {
          type: 'object',
          properties: {
            meetings: { type: 'array' },
            retreats: { type: 'array' },
            committeeSchedule: { type: 'object' }
          }
        },
        agenda: { type: 'object' },
        templates: { type: 'array' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'governance', 'meetings', 'planning']
}));

// Task 5: Trustee Engagement
export const trusteeEngagementTask = defineTask('trustee-engagement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop trustee engagement strategy',
  agent: {
    name: 'trustee-relations-specialist',
    prompt: {
      role: 'board development specialist',
      task: 'Develop comprehensive trustee engagement and cultivation strategy',
      context: args,
      instructions: [
        'Create new trustee orientation program',
        'Design ongoing trustee education plan',
        'Develop trustee giving expectations and guidelines',
        'Create board recruitment and nomination process',
        'Design trustee recognition program',
        'Establish term limits and rotation policies',
        'Create emeritus trustee program',
        'Develop trustee communications strategy'
      ],
      outputFormat: 'JSON with strategy, orientation, education, recognition, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            engagement: { type: 'array' },
            cultivation: { type: 'array' },
            stewardship: { type: 'array' }
          }
        },
        orientation: { type: 'object' },
        education: { type: 'array' },
        recognition: { type: 'object' },
        recruitment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'governance', 'trustee-engagement', 'cultivation']
}));

// Task 6: Board Performance Evaluation
export const boardPerformanceTask = defineTask('board-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create board performance framework',
  agent: {
    name: 'board-evaluation-specialist',
    prompt: {
      role: 'board performance consultant',
      task: 'Develop board and trustee performance evaluation framework',
      context: args,
      instructions: [
        'Design board self-assessment instrument',
        'Create individual trustee evaluation process',
        'Develop committee effectiveness measures',
        'Establish board chair evaluation process',
        'Create CEO/executive director evaluation framework',
        'Design peer feedback mechanisms',
        'Establish evaluation timeline and process',
        'Create action planning from evaluation results'
      ],
      outputFormat: 'JSON with framework, instruments, processes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            boardAssessment: { type: 'object' },
            trusteeEvaluation: { type: 'object' },
            committeeReview: { type: 'object' }
          }
        },
        instruments: { type: 'array' },
        processes: { type: 'object' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'governance', 'performance', 'evaluation']
}));

// Task 7: Governance Documentation
export const governanceDocumentationTask = defineTask('governance-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate governance documentation',
  agent: {
    name: 'governance-documentation-specialist',
    prompt: {
      role: 'governance documentation specialist',
      task: 'Compile comprehensive board governance documentation package',
      context: args,
      instructions: [
        'Create governance manual table of contents',
        'Compile bylaws and policies',
        'Document committee charters',
        'Include fiduciary guidelines',
        'Create trustee handbook',
        'Document meeting procedures',
        'Include evaluation instruments',
        'Create governance calendar and checklists'
      ],
      outputFormat: 'JSON with documentationPackage, manual, handbook, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPackage', 'artifacts'],
      properties: {
        documentationPackage: {
          type: 'object',
          properties: {
            manual: { type: 'string' },
            bylaws: { type: 'string' },
            policies: { type: 'array' },
            charters: { type: 'array' }
          }
        },
        handbook: { type: 'string' },
        checklists: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'governance', 'documentation', 'handbook']
}));
