/**
 * @process arts-culture/education-program-development
 * @description Methodology for designing and delivering educational programs for schools, families, and adult learners including curriculum development, teacher training, and program evaluation
 * @inputs { programName: string, targetAudience: string, programType: string, subjectMatter: object, institutionInfo: object }
 * @outputs { success: boolean, curriculum: object, deliveryPlan: object, evaluationFramework: object, artifacts: array }
 * @recommendedSkills SK-AC-008 (interpretive-writing), SK-AC-012 (accessibility-compliance), SK-AC-014 (digital-engagement-strategy)
 * @recommendedAgents AG-AC-007 (education-outreach-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    programName,
    targetAudience = 'K-12',
    programType = 'gallery-based',
    subjectMatter = {},
    institutionInfo = {},
    learningStandards = [],
    outputDir = 'education-program-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Needs Assessment
  ctx.log('info', 'Conducting educational needs assessment');
  const needsAssessment = await ctx.task(needsAssessmentTask, {
    programName,
    targetAudience,
    subjectMatter,
    institutionInfo,
    outputDir
  });

  if (!needsAssessment.success) {
    return {
      success: false,
      error: 'Needs assessment failed',
      details: needsAssessment,
      metadata: { processId: 'arts-culture/education-program-development', timestamp: startTime }
    };
  }

  artifacts.push(...needsAssessment.artifacts);

  // Task 2: Learning Objectives Development
  ctx.log('info', 'Developing learning objectives');
  const learningObjectives = await ctx.task(learningObjectivesTask, {
    programName,
    targetAudience,
    needsAssessment: needsAssessment.findings,
    learningStandards,
    outputDir
  });

  artifacts.push(...learningObjectives.artifacts);

  // Task 3: Curriculum Design
  ctx.log('info', 'Designing curriculum and content');
  const curriculumDesign = await ctx.task(curriculumDesignTask, {
    programName,
    targetAudience,
    programType,
    learningObjectives: learningObjectives.objectives,
    subjectMatter,
    outputDir
  });

  artifacts.push(...curriculumDesign.artifacts);

  // Task 4: Instructional Strategies
  ctx.log('info', 'Developing instructional strategies');
  const instructionalStrategies = await ctx.task(instructionalStrategiesTask, {
    programName,
    targetAudience,
    programType,
    curriculumDesign: curriculumDesign.curriculum,
    outputDir
  });

  artifacts.push(...instructionalStrategies.artifacts);

  // Task 5: Materials Development
  ctx.log('info', 'Developing educational materials');
  const materialsDevelopment = await ctx.task(materialsDevelopmentTask, {
    programName,
    targetAudience,
    curriculumDesign: curriculumDesign.curriculum,
    instructionalStrategies: instructionalStrategies.strategies,
    outputDir
  });

  artifacts.push(...materialsDevelopment.artifacts);

  // Task 6: Teacher and Docent Training
  ctx.log('info', 'Developing training program for educators');
  const educatorTraining = await ctx.task(educatorTrainingTask, {
    programName,
    curriculumDesign: curriculumDesign.curriculum,
    instructionalStrategies: instructionalStrategies.strategies,
    outputDir
  });

  artifacts.push(...educatorTraining.artifacts);

  // Breakpoint: Review education program
  await ctx.breakpoint({
    question: `Education program "${programName}" design complete. Target: ${targetAudience}. ${learningObjectives.objectives.length} learning objectives. Review and approve?`,
    title: 'Education Program Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        programName,
        targetAudience,
        programType,
        objectivesCount: learningObjectives.objectives.length,
        lessonsCount: curriculumDesign.curriculum.lessons?.length || 0
      }
    }
  });

  // Task 7: Delivery Plan
  ctx.log('info', 'Creating program delivery plan');
  const deliveryPlan = await ctx.task(deliveryPlanTask, {
    programName,
    programType,
    curriculumDesign: curriculumDesign.curriculum,
    institutionInfo,
    outputDir
  });

  artifacts.push(...deliveryPlan.artifacts);

  // Task 8: Evaluation Framework
  ctx.log('info', 'Developing evaluation framework');
  const evaluationFramework = await ctx.task(evaluationFrameworkTask, {
    programName,
    learningObjectives: learningObjectives.objectives,
    targetAudience,
    outputDir
  });

  artifacts.push(...evaluationFramework.artifacts);

  // Task 9: Program Documentation
  ctx.log('info', 'Generating program documentation');
  const programDocumentation = await ctx.task(programDocumentationTask, {
    programName,
    needsAssessment,
    learningObjectives,
    curriculumDesign,
    instructionalStrategies,
    materialsDevelopment,
    educatorTraining,
    deliveryPlan,
    evaluationFramework,
    outputDir
  });

  artifacts.push(...programDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    curriculum: {
      objectives: learningObjectives.objectives,
      design: curriculumDesign.curriculum,
      strategies: instructionalStrategies.strategies,
      materials: materialsDevelopment.materials
    },
    deliveryPlan: {
      plan: deliveryPlan.plan,
      schedule: deliveryPlan.schedule,
      logistics: deliveryPlan.logistics
    },
    training: educatorTraining.program,
    evaluationFramework: {
      methods: evaluationFramework.methods,
      instruments: evaluationFramework.instruments,
      timeline: evaluationFramework.timeline
    },
    documentation: programDocumentation,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/education-program-development',
      timestamp: startTime,
      programName
    }
  };
}

// Task 1: Needs Assessment
export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct needs assessment',
  agent: {
    name: 'education-researcher',
    prompt: {
      role: 'museum education researcher',
      task: 'Conduct educational needs assessment for program development',
      context: args,
      instructions: [
        'Research target audience characteristics and needs',
        'Analyze curriculum alignment opportunities',
        'Assess institution resources and capabilities',
        'Review existing programs and gaps',
        'Identify stakeholder requirements',
        'Research best practices in field',
        'Assess accessibility requirements',
        'Document findings and recommendations'
      ],
      outputFormat: 'JSON with success, findings, audienceAnalysis, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'object',
          properties: {
            audience: { type: 'object' },
            resources: { type: 'object' },
            gaps: { type: 'array' },
            opportunities: { type: 'array' }
          }
        },
        audienceAnalysis: { type: 'object' },
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
  labels: ['agent', 'education', 'needs-assessment', 'research']
}));

// Task 2: Learning Objectives
export const learningObjectivesTask = defineTask('learning-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop learning objectives',
  agent: {
    name: 'curriculum-specialist',
    prompt: {
      role: 'curriculum development specialist',
      task: 'Develop learning objectives aligned with standards',
      context: args,
      instructions: [
        'Define program goals and outcomes',
        'Create measurable learning objectives (Blooms taxonomy)',
        'Align objectives with state/national standards',
        'Address cognitive, affective, and psychomotor domains',
        'Create differentiated objectives by level',
        'Ensure developmentally appropriate objectives',
        'Connect objectives to assessment strategies',
        'Document objective-standard alignment'
      ],
      outputFormat: 'JSON with objectives, alignment, domains, differentiation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'artifacts'],
      properties: {
        objectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              domain: { type: 'string' },
              level: { type: 'string' },
              standards: { type: 'array' }
            }
          }
        },
        alignment: { type: 'object' },
        domains: { type: 'object' },
        differentiation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'learning-objectives', 'curriculum']
}));

// Task 3: Curriculum Design
export const curriculumDesignTask = defineTask('curriculum-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design curriculum',
  agent: {
    name: 'curriculum-designer',
    prompt: {
      role: 'museum curriculum designer',
      task: 'Design comprehensive curriculum for educational program',
      context: args,
      instructions: [
        'Create curriculum scope and sequence',
        'Design lesson plans and activities',
        'Integrate object-based learning',
        'Plan inquiry-based experiences',
        'Include Visual Thinking Strategies (VTS)',
        'Design hands-on activities',
        'Plan pre- and post-visit activities',
        'Create curriculum guide documentation'
      ],
      outputFormat: 'JSON with curriculum, lessons, activities, scope, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['curriculum', 'artifacts'],
      properties: {
        curriculum: {
          type: 'object',
          properties: {
            scope: { type: 'object' },
            sequence: { type: 'array' },
            lessons: { type: 'array' }
          }
        },
        lessons: { type: 'array' },
        activities: { type: 'array' },
        scope: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'curriculum', 'design']
}));

// Task 4: Instructional Strategies
export const instructionalStrategiesTask = defineTask('instructional-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop instructional strategies',
  agent: {
    name: 'instructional-designer',
    prompt: {
      role: 'instructional designer',
      task: 'Develop instructional strategies for museum education',
      context: args,
      instructions: [
        'Design inquiry-based learning approaches',
        'Plan dialogic teaching methods',
        'Incorporate constructivist pedagogy',
        'Design differentiated instruction',
        'Plan Universal Design for Learning (UDL)',
        'Include collaborative learning strategies',
        'Design reflection and synthesis activities',
        'Plan formative assessment integration'
      ],
      outputFormat: 'JSON with strategies, methods, differentiation, udl, artifacts'
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
              name: { type: 'string' },
              description: { type: 'string' },
              application: { type: 'string' }
            }
          }
        },
        methods: { type: 'array' },
        differentiation: { type: 'object' },
        udl: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'instructional', 'strategies']
}));

// Task 5: Materials Development
export const materialsDevelopmentTask = defineTask('materials-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop educational materials',
  agent: {
    name: 'materials-developer',
    prompt: {
      role: 'educational materials developer',
      task: 'Develop educational materials and resources',
      context: args,
      instructions: [
        'Create teacher guides and lesson plans',
        'Develop student worksheets and activities',
        'Design visual aids and presentations',
        'Create hands-on activity kits',
        'Develop digital resources',
        'Create family guides and materials',
        'Design assessment instruments',
        'Create accessibility-compliant materials'
      ],
      outputFormat: 'JSON with materials, teacherGuides, studentMaterials, digital, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'artifacts'],
      properties: {
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              audience: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        teacherGuides: { type: 'array' },
        studentMaterials: { type: 'array' },
        digital: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'materials', 'development']
}));

// Task 6: Educator Training
export const educatorTrainingTask = defineTask('educator-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop educator training',
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'educator training specialist',
      task: 'Develop training program for educators and docents',
      context: args,
      instructions: [
        'Design docent/educator training curriculum',
        'Create training modules and sessions',
        'Develop practice teaching opportunities',
        'Plan ongoing professional development',
        'Create teacher training workshops',
        'Design certification or credentialing',
        'Create training assessment tools',
        'Document training requirements'
      ],
      outputFormat: 'JSON with program, modules, workshops, certification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'artifacts'],
      properties: {
        program: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            modules: { type: 'array' },
            duration: { type: 'string' }
          }
        },
        modules: { type: 'array' },
        workshops: { type: 'array' },
        certification: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'training', 'professional-development']
}));

// Task 7: Delivery Plan
export const deliveryPlanTask = defineTask('delivery-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create delivery plan',
  agent: {
    name: 'program-coordinator',
    prompt: {
      role: 'education program coordinator',
      task: 'Create program delivery and implementation plan',
      context: args,
      instructions: [
        'Create program schedule and calendar',
        'Plan staffing and volunteer needs',
        'Develop registration and booking system',
        'Plan space and logistics requirements',
        'Create materials distribution plan',
        'Plan technology and AV needs',
        'Develop accessibility accommodations',
        'Create operational procedures'
      ],
      outputFormat: 'JSON with plan, schedule, logistics, staffing, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            phases: { type: 'array' },
            requirements: { type: 'object' }
          }
        },
        schedule: { type: 'object' },
        logistics: { type: 'object' },
        staffing: { type: 'object' },
        procedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'delivery', 'implementation']
}));

// Task 8: Evaluation Framework
export const evaluationFrameworkTask = defineTask('evaluation-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop evaluation framework',
  agent: {
    name: 'evaluation-specialist',
    prompt: {
      role: 'program evaluation specialist',
      task: 'Develop comprehensive program evaluation framework',
      context: args,
      instructions: [
        'Design formative evaluation methods',
        'Create summative evaluation plan',
        'Develop assessment instruments',
        'Plan participant feedback collection',
        'Design teacher/educator feedback',
        'Create learning outcome measures',
        'Plan program impact evaluation',
        'Establish evaluation timeline'
      ],
      outputFormat: 'JSON with methods, instruments, timeline, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'instruments', 'artifacts'],
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        instruments: { type: 'array' },
        timeline: { type: 'object' },
        metrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'evaluation', 'assessment']
}));

// Task 9: Program Documentation
export const programDocumentationTask = defineTask('program-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate program documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'education documentation specialist',
      task: 'Generate comprehensive program documentation package',
      context: args,
      instructions: [
        'Compile program overview document',
        'Create curriculum guide',
        'Compile educator resources',
        'Document delivery procedures',
        'Create evaluation instruments',
        'Generate marketing materials',
        'Create grant reporting template',
        'Document program standards alignment'
      ],
      outputFormat: 'JSON with documentation, curriculum, resources, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            curriculum: { type: 'string' },
            resources: { type: 'array' }
          }
        },
        curriculum: { type: 'string' },
        resources: { type: 'array' },
        procedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'education', 'documentation', 'program']
}));
