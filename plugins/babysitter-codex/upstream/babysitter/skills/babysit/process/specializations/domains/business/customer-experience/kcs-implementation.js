/**
 * @process customer-experience/kcs-implementation
 * @description Process for capturing knowledge in the workflow, structuring for reuse, and continuous improvement following KCS methodology
 * @inputs { currentState: object, teamStructure: object, tooling: object, supportTickets: array }
 * @outputs { success: boolean, kcsFramework: object, implementationPlan: object, metrics: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    currentState = {},
    teamStructure = {},
    tooling = {},
    supportTickets = [],
    outputDir = 'kcs-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge-Centered Service (KCS) Implementation');

  // ============================================================================
  // PHASE 1: CURRENT STATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current knowledge management state');
  const stateAssessment = await ctx.task(stateAssessmentTask, {
    currentState,
    teamStructure,
    tooling,
    outputDir
  });

  artifacts.push(...stateAssessment.artifacts);

  // ============================================================================
  // PHASE 2: KCS FRAMEWORK DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing KCS framework');
  const frameworkDesign = await ctx.task(frameworkDesignTask, {
    stateAssessment,
    teamStructure,
    outputDir
  });

  artifacts.push(...frameworkDesign.artifacts);

  // ============================================================================
  // PHASE 3: SOLVE LOOP DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing KCS Solve Loop');
  const solveLoopDesign = await ctx.task(solveLoopDesignTask, {
    frameworkDesign,
    tooling,
    outputDir
  });

  artifacts.push(...solveLoopDesign.artifacts);

  // ============================================================================
  // PHASE 4: EVOLVE LOOP DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing KCS Evolve Loop');
  const evolveLoopDesign = await ctx.task(evolveLoopDesignTask, {
    frameworkDesign,
    solveLoopDesign,
    outputDir
  });

  artifacts.push(...evolveLoopDesign.artifacts);

  // ============================================================================
  // PHASE 5: CONTENT STANDARD DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining content standards');
  const contentStandards = await ctx.task(contentStandardsTask, {
    frameworkDesign,
    currentState,
    outputDir
  });

  artifacts.push(...contentStandards.artifacts);

  // ============================================================================
  // PHASE 6: ROLE AND LICENSE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining KCS roles and licenses');
  const roleDefinition = await ctx.task(roleDefinitionTask, {
    frameworkDesign,
    teamStructure,
    outputDir
  });

  artifacts.push(...roleDefinition.artifacts);

  // ============================================================================
  // PHASE 7: TRAINING PROGRAM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing KCS training program');
  const trainingProgram = await ctx.task(trainingProgramTask, {
    frameworkDesign,
    roleDefinition,
    teamStructure,
    outputDir
  });

  artifacts.push(...trainingProgram.artifacts);

  // ============================================================================
  // PHASE 8: METRICS AND MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining KCS metrics and measurement');
  const metricsDesign = await ctx.task(metricsDesignTask, {
    frameworkDesign,
    solveLoopDesign,
    evolveLoopDesign,
    outputDir
  });

  artifacts.push(...metricsDesign.artifacts);

  // ============================================================================
  // PHASE 9: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    stateAssessment,
    frameworkDesign,
    roleDefinition,
    trainingProgram,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  const qualityScore = stateAssessment.readinessScore + 20; // Adjusted for planning
  const qualityMet = qualityScore >= 85;

  await ctx.breakpoint({
    question: `KCS implementation plan complete. Readiness score: ${stateAssessment.readinessScore}/100. Framework designed with ${roleDefinition.licenses?.length || 0} license levels. Training modules: ${trainingProgram.modules?.length || 0}. Review and execute?`,
    title: 'KCS Implementation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        readinessScore: stateAssessment.readinessScore,
        licenseLevels: roleDefinition.licenses?.length || 0,
        trainingModules: trainingProgram.modules?.length || 0,
        metricsCount: metricsDesign.metrics?.length || 0,
        implementationPhases: implementationRoadmap.phases?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    readinessScore: stateAssessment.readinessScore,
    kcsFramework: {
      solveLoop: solveLoopDesign.process,
      evolveLoop: evolveLoopDesign.process,
      contentStandards: contentStandards.standards
    },
    roles: {
      licenses: roleDefinition.licenses,
      responsibilities: roleDefinition.responsibilities
    },
    trainingProgram: trainingProgram.program,
    metrics: metricsDesign.metrics,
    implementationPlan: {
      phases: implementationRoadmap.phases,
      timeline: implementationRoadmap.timeline,
      milestones: implementationRoadmap.milestones
    },
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/kcs-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const stateAssessmentTask = defineTask('state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current knowledge management state',
  agent: {
    name: 'kcs-assessor',
    prompt: {
      role: 'KCS implementation specialist',
      task: 'Assess current state of knowledge management practices',
      context: args,
      instructions: [
        'Evaluate current knowledge capture processes',
        'Assess existing knowledge base quality',
        'Review current search and reuse patterns',
        'Evaluate team knowledge sharing culture',
        'Assess tooling capabilities for KCS',
        'Identify gaps from KCS best practices',
        'Calculate readiness score',
        'Identify quick wins and challenges',
        'Generate state assessment report'
      ],
      outputFormat: 'JSON with readinessScore, currentPractices, gaps, toolingAssessment, quickWins, challenges, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'gaps', 'artifacts'],
      properties: {
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        currentPractices: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        toolingAssessment: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'string' } },
        challenges: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'assessment']
}));

export const frameworkDesignTask = defineTask('framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design KCS framework',
  agent: {
    name: 'kcs-architect',
    prompt: {
      role: 'KCS methodology expert',
      task: 'Design comprehensive KCS framework for the organization',
      context: args,
      instructions: [
        'Define KCS adoption wave structure',
        'Design article lifecycle model',
        'Define confidence states',
        'Design article structure template',
        'Define reuse workflow',
        'Design improvement workflow',
        'Define governance model',
        'Create KCS principles documentation',
        'Generate framework design'
      ],
      outputFormat: 'JSON with framework, waves, lifecycle, confidenceStates, governance, principles, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'waves', 'lifecycle', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        waves: { type: 'array', items: { type: 'object' } },
        lifecycle: { type: 'object' },
        confidenceStates: { type: 'array', items: { type: 'object' } },
        governance: { type: 'object' },
        principles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'framework']
}));

export const solveLoopDesignTask = defineTask('solve-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design KCS Solve Loop',
  agent: {
    name: 'solve-loop-designer',
    prompt: {
      role: 'KCS Solve Loop specialist',
      task: 'Design the KCS Solve Loop process',
      context: args,
      instructions: [
        'Design Capture step (capture in context)',
        'Design Structure step (article template)',
        'Design Reuse step (search early, search often)',
        'Design Improve step (flag, fix, add)',
        'Define integration with case handling',
        'Design search-as-you-type workflow',
        'Define article linking process',
        'Create Solve Loop training materials',
        'Generate Solve Loop documentation'
      ],
      outputFormat: 'JSON with process, capture, structure, reuse, improve, integration, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'artifacts'],
      properties: {
        process: { type: 'object' },
        capture: { type: 'object' },
        structure: { type: 'object' },
        reuse: { type: 'object' },
        improve: { type: 'object' },
        integration: { type: 'object' },
        training: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'solve-loop']
}));

export const evolveLoopDesignTask = defineTask('evolve-loop-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design KCS Evolve Loop',
  agent: {
    name: 'evolve-loop-designer',
    prompt: {
      role: 'KCS Evolve Loop specialist',
      task: 'Design the KCS Evolve Loop process',
      context: args,
      instructions: [
        'Design content health monitoring',
        'Design article review process',
        'Design archival and retirement process',
        'Define improvement triggers',
        'Design knowledge domain analysis',
        'Create content quality standards',
        'Design continuous improvement cycle',
        'Define escalation paths',
        'Generate Evolve Loop documentation'
      ],
      outputFormat: 'JSON with process, healthMonitoring, review, archival, qualityStandards, improvement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'artifacts'],
      properties: {
        process: { type: 'object' },
        healthMonitoring: { type: 'object' },
        review: { type: 'object' },
        archival: { type: 'object' },
        qualityStandards: { type: 'object' },
        improvement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'evolve-loop']
}));

export const contentStandardsTask = defineTask('content-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content standards',
  agent: {
    name: 'content-standards-specialist',
    prompt: {
      role: 'KCS content standards specialist',
      task: 'Define KCS article content standards and templates',
      context: args,
      instructions: [
        'Define article structure template',
        'Create issue, environment, resolution format',
        'Define metadata requirements',
        'Create keyword guidelines',
        'Define audience targeting',
        'Create readability standards',
        'Define article quality criteria',
        'Create example articles',
        'Generate content standards documentation'
      ],
      outputFormat: 'JSON with standards, template, metadata, keywords, quality, examples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'template', 'artifacts'],
      properties: {
        standards: { type: 'object' },
        template: { type: 'object' },
        metadata: { type: 'object' },
        keywords: { type: 'object' },
        quality: { type: 'object' },
        examples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'content-standards']
}));

export const roleDefinitionTask = defineTask('role-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define KCS roles and licenses',
  agent: {
    name: 'role-specialist',
    prompt: {
      role: 'KCS roles and licensing specialist',
      task: 'Define KCS license levels and role responsibilities',
      context: args,
      instructions: [
        'Define KCS Candidate requirements',
        'Define KCS Contributor requirements',
        'Define KCS Publisher requirements',
        'Define Knowledge Domain Expert role',
        'Define KCS Coach role',
        'Create license progression path',
        'Define assessment criteria per level',
        'Define ongoing requirements',
        'Generate role definition documentation'
      ],
      outputFormat: 'JSON with licenses, responsibilities, progressionPath, assessmentCriteria, ongoing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['licenses', 'responsibilities', 'artifacts'],
      properties: {
        licenses: { type: 'array', items: { type: 'object' } },
        responsibilities: { type: 'object' },
        progressionPath: { type: 'array', items: { type: 'object' } },
        assessmentCriteria: { type: 'object' },
        ongoing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'roles']
}));

export const trainingProgramTask = defineTask('training-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design KCS training program',
  agent: {
    name: 'training-designer',
    prompt: {
      role: 'KCS training specialist',
      task: 'Design comprehensive KCS training program',
      context: args,
      instructions: [
        'Design KCS fundamentals training',
        'Create Solve Loop workshop',
        'Design article writing training',
        'Create search effectiveness training',
        'Design coaching skills training',
        'Create license assessment modules',
        'Design refresher training',
        'Plan training delivery schedule',
        'Generate training program documentation'
      ],
      outputFormat: 'JSON with program, modules, workshops, assessments, schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'modules', 'artifacts'],
      properties: {
        program: { type: 'object' },
        modules: { type: 'array', items: { type: 'object' } },
        workshops: { type: 'array', items: { type: 'object' } },
        assessments: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'training']
}));

export const metricsDesignTask = defineTask('metrics-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define KCS metrics and measurement',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'KCS metrics specialist',
      task: 'Define KCS performance metrics and measurement approach',
      context: args,
      instructions: [
        'Define article creation metrics',
        'Define article reuse metrics',
        'Define article quality metrics',
        'Define self-service success metrics',
        'Define participation metrics',
        'Define business impact metrics',
        'Create metrics dashboard design',
        'Define targets and thresholds',
        'Generate metrics documentation'
      ],
      outputFormat: 'JSON with metrics, creation, reuse, quality, selfService, participation, dashboard, targets, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'dashboard', 'targets', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        creation: { type: 'object' },
        reuse: { type: 'object' },
        quality: { type: 'object' },
        selfService: { type: 'object' },
        participation: { type: 'object' },
        dashboard: { type: 'object' },
        targets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'metrics']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'KCS implementation project manager',
      task: 'Create comprehensive KCS implementation roadmap',
      context: args,
      instructions: [
        'Define Wave 1 (Planning and Design)',
        'Define Wave 2 (Adoption)',
        'Define Wave 3 (Proficiency)',
        'Define Wave 4 (Leadership)',
        'Create detailed timeline',
        'Define milestones and checkpoints',
        'Identify risks and mitigations',
        'Define success criteria per wave',
        'Generate implementation roadmap'
      ],
      outputFormat: 'JSON with phases, timeline, milestones, risks, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'milestones', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'kcs', 'implementation']
}));
