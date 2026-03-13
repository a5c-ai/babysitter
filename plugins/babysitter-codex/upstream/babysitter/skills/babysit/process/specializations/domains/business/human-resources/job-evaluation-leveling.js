/**
 * @process job-evaluation-leveling
 * @description Systematic process for evaluating job roles, establishing job levels, and creating
 * a consistent job architecture framework that supports fair compensation, career pathing, and
 * organizational design.
 * @inputs {
 *   organizationContext: { industry, size, structure, currentJobFramework },
 *   evaluationScope: { departments, roles, jobFamilies },
 *   methodology: { evaluationMethod, compensableFactors, weightings },
 *   stakeholders: { hrTeam, compensation, businessLeaders },
 *   constraints: { timeline, budget, complianceRequirements }
 * }
 * @outputs {
 *   jobArchitecture: { jobFamilies, levels, grades },
 *   evaluationResults: { roleEvaluations, pointScores, levelAssignments },
 *   documentation: { jobDescriptions, levelGuides, careerPaths },
 *   implementationPlan: { communication, changeManagement, timeline }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'technology', size: 'mid-market', structure: 'matrix' },
 *   evaluationScope: { departments: ['all'], roles: 250 },
 *   methodology: { evaluationMethod: 'point-factor', compensableFactors: ['skills', 'responsibility', 'effort', 'conditions'] }
 * });
 * @references
 * - Hay Group Job Evaluation Method
 * - Mercer IPE (International Position Evaluation)
 * - Willis Towers Watson Global Grading System
 * - SHRM Job Analysis and Evaluation Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, evaluationScope, methodology, stakeholders, constraints } = inputs;

  // Phase 1: Current State Assessment
  const currentStateAssessment = await ctx.task('assess-current-job-structure', {
    organizationContext,
    evaluationScope,
    assessmentAreas: [
      'existing job architecture and levels',
      'current job descriptions and specifications',
      'compensation structure alignment',
      'career path definitions',
      'pain points and inconsistencies',
      'compliance with pay equity regulations'
    ]
  });

  // Phase 2: Methodology Selection and Design
  const methodologyDesign = await ctx.task('design-evaluation-methodology', {
    currentState: currentStateAssessment,
    methodology,
    designElements: [
      'evaluation method selection (point-factor, ranking, classification)',
      'compensable factors definition',
      'factor weightings and point scales',
      'level criteria and boundaries',
      'validation approach'
    ]
  });

  // Phase 3: Stakeholder Alignment
  await ctx.breakpoint('methodology-approval', {
    title: 'Job Evaluation Methodology Approval',
    description: 'Review and approve the proposed job evaluation methodology',
    artifacts: {
      currentStateAssessment,
      methodologyDesign
    },
    questions: [
      'Does the methodology align with organizational values?',
      'Are the compensable factors appropriate for the industry?',
      'Is the weighting scheme fair and defensible?'
    ]
  });

  // Phase 4: Job Family Framework Development
  const jobFamilyFramework = await ctx.task('develop-job-family-framework', {
    methodologyDesign,
    evaluationScope,
    frameworkElements: [
      'job family definitions and groupings',
      'sub-family structures',
      'functional vs cross-functional families',
      'management vs individual contributor tracks',
      'naming conventions and taxonomy'
    ]
  });

  // Phase 5: Level Architecture Design
  const levelArchitecture = await ctx.task('design-level-architecture', {
    jobFamilyFramework,
    methodology,
    architectureElements: [
      'number of levels per track',
      'level definitions and differentiators',
      'progression criteria between levels',
      'title mapping and standardization',
      'grade structure alignment'
    ]
  });

  // Phase 6: Job Description Development
  const jobDescriptions = await ctx.task('develop-job-descriptions', {
    jobFamilyFramework,
    levelArchitecture,
    evaluationScope,
    descriptionElements: [
      'standardized job description template',
      'role summaries and purposes',
      'key responsibilities and accountabilities',
      'required qualifications and competencies',
      'success metrics and KPIs'
    ]
  });

  // Phase 7: Job Evaluation Execution
  const evaluationResults = await ctx.task('execute-job-evaluations', {
    jobDescriptions,
    methodologyDesign,
    evaluationProcess: [
      'job analysis data collection',
      'factor-by-factor evaluation',
      'point calculation and scoring',
      'internal equity comparisons',
      'evaluation calibration sessions'
    ]
  });

  // Phase 8: Level Assignment and Validation
  const levelAssignments = await ctx.task('assign-and-validate-levels', {
    evaluationResults,
    levelArchitecture,
    validationProcess: [
      'initial level assignments',
      'cross-functional calibration',
      'market data comparison',
      'pay equity analysis',
      'anomaly identification and resolution'
    ]
  });

  // Phase 9: Quality Assurance Review
  await ctx.breakpoint('evaluation-results-review', {
    title: 'Job Evaluation Results Review',
    description: 'Review job evaluations and level assignments for accuracy and equity',
    artifacts: {
      evaluationResults,
      levelAssignments,
      jobFamilyFramework,
      levelArchitecture
    },
    questions: [
      'Are evaluation results internally consistent?',
      'Do level assignments support pay equity?',
      'Are there any unexpected outcomes requiring investigation?'
    ]
  });

  // Phase 10: Career Path Mapping
  const careerPaths = await ctx.task('map-career-paths', {
    levelArchitecture,
    levelAssignments,
    jobFamilyFramework,
    pathElements: [
      'vertical progression paths',
      'lateral movement opportunities',
      'cross-functional transitions',
      'skill bridge requirements',
      'development milestones'
    ]
  });

  // Phase 11: Implementation Planning
  const implementationPlan = await ctx.task('develop-implementation-plan', {
    levelAssignments,
    careerPaths,
    stakeholders,
    planElements: [
      'communication strategy and timeline',
      'change management approach',
      'manager training and enablement',
      'employee communication and Q&A',
      'system updates and documentation',
      'dispute resolution process'
    ]
  });

  // Phase 12: Documentation and Handoff
  const documentation = await ctx.task('create-documentation-package', {
    jobFamilyFramework,
    levelArchitecture,
    levelAssignments,
    careerPaths,
    implementationPlan,
    documentationElements: [
      'job architecture reference guide',
      'level definitions handbook',
      'job description library',
      'career path visualizations',
      'manager toolkit and FAQs',
      'governance and maintenance procedures'
    ]
  });

  return {
    jobArchitecture: {
      families: jobFamilyFramework,
      levels: levelArchitecture,
      assignments: levelAssignments
    },
    evaluationResults,
    careerPaths,
    documentation,
    implementationPlan,
    metrics: {
      rolesEvaluated: evaluationScope.roles,
      jobFamiliesCreated: jobFamilyFramework.familyCount,
      levelsEstablished: levelArchitecture.levelCount
    }
  };
}

export const assessCurrentJobStructure = defineTask('assess-current-job-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Current Job Structure',
  agent: {
    name: 'hr-analyst',
    prompt: {
      role: 'Job Architecture Analyst',
      task: 'Analyze current job structure, identify gaps and inconsistencies',
      context: args,
      instructions: [
        'Review existing job architecture and documentation',
        'Identify inconsistencies in job levels and titles',
        'Assess alignment with compensation structure',
        'Document pain points and improvement opportunities',
        'Evaluate compliance with pay equity requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        currentArchitecture: { type: 'object' },
        gaps: { type: 'array' },
        inconsistencies: { type: 'array' },
        complianceStatus: { type: 'object' },
        recommendations: { type: 'array' }
      },
      required: ['currentArchitecture', 'gaps', 'recommendations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const designEvaluationMethodology = defineTask('design-evaluation-methodology', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Evaluation Methodology',
  agent: {
    name: 'compensation-specialist',
    prompt: {
      role: 'Job Evaluation Methodology Expert',
      task: 'Design comprehensive job evaluation methodology',
      context: args,
      instructions: [
        'Select appropriate evaluation method for organization',
        'Define compensable factors with clear definitions',
        'Establish factor weightings based on organizational priorities',
        'Create point scales and scoring guidelines',
        'Design validation and calibration processes'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        evaluationMethod: { type: 'string' },
        compensableFactors: { type: 'array' },
        factorWeightings: { type: 'object' },
        pointScales: { type: 'object' },
        validationApproach: { type: 'object' }
      },
      required: ['evaluationMethod', 'compensableFactors', 'factorWeightings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developJobFamilyFramework = defineTask('develop-job-family-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Job Family Framework',
  agent: {
    name: 'hr-architect',
    prompt: {
      role: 'Job Architecture Designer',
      task: 'Create comprehensive job family framework',
      context: args,
      instructions: [
        'Define job families based on functional groupings',
        'Create sub-family structures where appropriate',
        'Establish management vs individual contributor tracks',
        'Develop naming conventions and taxonomy',
        'Ensure framework supports career mobility'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        jobFamilies: { type: 'array' },
        subFamilies: { type: 'object' },
        tracks: { type: 'array' },
        taxonomy: { type: 'object' },
        familyCount: { type: 'number' }
      },
      required: ['jobFamilies', 'tracks', 'familyCount']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const designLevelArchitecture = defineTask('design-level-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Level Architecture',
  agent: {
    name: 'compensation-specialist',
    prompt: {
      role: 'Level Architecture Designer',
      task: 'Design comprehensive level architecture',
      context: args,
      instructions: [
        'Determine appropriate number of levels per track',
        'Define clear level differentiators',
        'Establish progression criteria between levels',
        'Create title mapping and standardization rules',
        'Align grade structure with levels'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        levels: { type: 'array' },
        levelDefinitions: { type: 'object' },
        progressionCriteria: { type: 'object' },
        titleMapping: { type: 'object' },
        gradeAlignment: { type: 'object' },
        levelCount: { type: 'number' }
      },
      required: ['levels', 'levelDefinitions', 'levelCount']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developJobDescriptions = defineTask('develop-job-descriptions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Job Descriptions',
  agent: {
    name: 'hr-specialist',
    prompt: {
      role: 'Job Description Developer',
      task: 'Create standardized job descriptions',
      context: args,
      instructions: [
        'Design standardized job description template',
        'Write clear role summaries and purposes',
        'Define key responsibilities and accountabilities',
        'Specify required qualifications and competencies',
        'Establish success metrics and KPIs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        template: { type: 'object' },
        descriptions: { type: 'array' },
        competencyMappings: { type: 'object' },
        metricsFramework: { type: 'object' }
      },
      required: ['template', 'descriptions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const executeJobEvaluations = defineTask('execute-job-evaluations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute Job Evaluations',
  agent: {
    name: 'compensation-analyst',
    prompt: {
      role: 'Job Evaluation Specialist',
      task: 'Execute systematic job evaluations',
      context: args,
      instructions: [
        'Collect job analysis data for each role',
        'Apply factor-by-factor evaluation methodology',
        'Calculate point scores consistently',
        'Compare internal equity across roles',
        'Conduct calibration to ensure consistency'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        evaluations: { type: 'array' },
        pointScores: { type: 'object' },
        calibrationNotes: { type: 'array' },
        equityAnalysis: { type: 'object' }
      },
      required: ['evaluations', 'pointScores']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assignAndValidateLevels = defineTask('assign-and-validate-levels', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign and Validate Levels',
  agent: {
    name: 'compensation-specialist',
    prompt: {
      role: 'Level Assignment Validator',
      task: 'Assign job levels and validate for equity',
      context: args,
      instructions: [
        'Assign initial levels based on evaluation scores',
        'Conduct cross-functional calibration',
        'Compare with market data benchmarks',
        'Perform pay equity analysis',
        'Identify and resolve anomalies'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        assignments: { type: 'array' },
        calibrationResults: { type: 'object' },
        marketComparison: { type: 'object' },
        equityAnalysis: { type: 'object' },
        anomalies: { type: 'array' }
      },
      required: ['assignments', 'equityAnalysis']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const mapCareerPaths = defineTask('map-career-paths', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map Career Paths',
  agent: {
    name: 'talent-development-specialist',
    prompt: {
      role: 'Career Path Designer',
      task: 'Design comprehensive career paths',
      context: args,
      instructions: [
        'Map vertical progression paths within families',
        'Identify lateral movement opportunities',
        'Define cross-functional transition paths',
        'Document skill bridge requirements',
        'Establish development milestones'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        verticalPaths: { type: 'array' },
        lateralMoves: { type: 'array' },
        crossFunctionalPaths: { type: 'array' },
        skillBridges: { type: 'object' },
        developmentMilestones: { type: 'object' }
      },
      required: ['verticalPaths', 'lateralMoves']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developImplementationPlan = defineTask('develop-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Implementation Plan',
  agent: {
    name: 'change-management-specialist',
    prompt: {
      role: 'Implementation Planner',
      task: 'Create comprehensive implementation plan',
      context: args,
      instructions: [
        'Develop communication strategy and timeline',
        'Design change management approach',
        'Create manager training and enablement plan',
        'Plan employee communication and Q&A sessions',
        'Define dispute resolution process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        communicationPlan: { type: 'object' },
        changeManagement: { type: 'object' },
        trainingPlan: { type: 'object' },
        timeline: { type: 'array' },
        disputeProcess: { type: 'object' }
      },
      required: ['communicationPlan', 'timeline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const createDocumentationPackage = defineTask('create-documentation-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Documentation Package',
  agent: {
    name: 'hr-documentation-specialist',
    prompt: {
      role: 'Documentation Developer',
      task: 'Create comprehensive documentation package',
      context: args,
      instructions: [
        'Compile job architecture reference guide',
        'Create level definitions handbook',
        'Organize job description library',
        'Develop career path visualizations',
        'Build manager toolkit and FAQs',
        'Document governance and maintenance procedures'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        referenceGuide: { type: 'object' },
        levelHandbook: { type: 'object' },
        jobDescriptionLibrary: { type: 'array' },
        careerPathVisuals: { type: 'array' },
        managerToolkit: { type: 'object' },
        governanceProcedures: { type: 'object' }
      },
      required: ['referenceGuide', 'levelHandbook', 'governanceProcedures']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
