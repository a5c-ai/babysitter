/**
 * @process education/summative-assessment
 * @description Designing end-of-unit or end-of-course assessments that measure student achievement against learning objectives with validity and reliability
 * @inputs { courseName: string, learningObjectives: array, standards: array, context: object, constraints: object }
 * @outputs { success: boolean, assessmentPlan: object, testBlueprint: object, items: array, validityReport: object, artifacts: array }
 * @recommendedSkills SK-EDU-003 (assessment-design-validation), SK-EDU-004 (rubric-development), SK-EDU-002 (learning-objectives-writing)
 * @recommendedAgents AG-EDU-003 (assessment-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Course',
    learningObjectives = [],
    standards = [],
    context = {},
    constraints = {},
    outputDir = 'summative-assessment-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Summative Assessment Development for ${courseName}`);

  // ============================================================================
  // TEST BLUEPRINT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing test blueprint');
  const testBlueprint = await ctx.task(testBlueprintTask, {
    courseName,
    learningObjectives,
    standards,
    context,
    outputDir
  });

  artifacts.push(...testBlueprint.artifacts);

  // ============================================================================
  // ITEM SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Creating item specifications');
  const itemSpecification = await ctx.task(itemSpecificationTask, {
    courseName,
    blueprint: testBlueprint.blueprint,
    learningObjectives,
    outputDir
  });

  artifacts.push(...itemSpecification.artifacts);

  // ============================================================================
  // ITEM DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing assessment items');
  const itemDevelopment = await ctx.task(itemDevelopmentTask, {
    courseName,
    specifications: itemSpecification.specifications,
    blueprint: testBlueprint.blueprint,
    outputDir
  });

  artifacts.push(...itemDevelopment.artifacts);

  // ============================================================================
  // RUBRIC DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing scoring rubrics');
  const rubricDevelopment = await ctx.task(rubricDevelopmentTask, {
    courseName,
    items: itemDevelopment.items,
    learningObjectives,
    outputDir
  });

  artifacts.push(...rubricDevelopment.artifacts);

  // ============================================================================
  // VALIDITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Conducting validity analysis');
  const validityAnalysis = await ctx.task(validityAnalysisTask, {
    courseName,
    blueprint: testBlueprint.blueprint,
    items: itemDevelopment.items,
    learningObjectives,
    standards,
    outputDir
  });

  artifacts.push(...validityAnalysis.artifacts);

  // ============================================================================
  // RELIABILITY PLANNING
  // ============================================================================

  ctx.log('info', 'Planning for reliability');
  const reliabilityPlanning = await ctx.task(reliabilityPlanningTask, {
    courseName,
    blueprint: testBlueprint.blueprint,
    items: itemDevelopment.items,
    context,
    outputDir
  });

  artifacts.push(...reliabilityPlanning.artifacts);

  // ============================================================================
  // ADMINISTRATION GUIDE
  // ============================================================================

  ctx.log('info', 'Creating administration guide');
  const administrationGuide = await ctx.task(administrationGuideTask, {
    courseName,
    blueprint: testBlueprint.blueprint,
    items: itemDevelopment.items,
    constraints,
    outputDir
  });

  artifacts.push(...administrationGuide.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring summative assessment quality');
  const qualityScore = await ctx.task(summativeQualityScoringTask, {
    courseName,
    testBlueprint,
    itemDevelopment,
    rubricDevelopment,
    validityAnalysis,
    reliabilityPlanning,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review summative assessment
  await ctx.breakpoint({
    question: `Summative assessment development complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Summative Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        totalItems: itemDevelopment.items?.length || 0,
        validityScore: validityAnalysis.validityScore || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    courseName,
    qualityScore: overallScore,
    qualityMet,
    assessmentPlan: {
      purpose: testBlueprint.blueprint.purpose,
      format: testBlueprint.blueprint.format,
      duration: testBlueprint.blueprint.duration
    },
    testBlueprint: testBlueprint.blueprint,
    items: itemDevelopment.items,
    rubrics: rubricDevelopment.rubrics,
    validityReport: validityAnalysis.report,
    reliabilityPlan: reliabilityPlanning.plan,
    administrationGuide: administrationGuide.guide,
    artifacts,
    duration,
    metadata: {
      processId: 'education/summative-assessment',
      timestamp: startTime,
      courseName,
      outputDir
    }
  };
}

// Task 1: Test Blueprint Development
export const testBlueprintTask = defineTask('test-blueprint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop test blueprint',
  agent: {
    name: 'blueprint-developer',
    prompt: {
      role: 'psychometrician and test developer',
      task: 'Develop comprehensive test blueprint (table of specifications)',
      context: args,
      instructions: [
        'Define assessment purpose and intended use',
        'Map content domains to be assessed',
        'Determine cognitive levels using Bloom\'s taxonomy',
        'Create content-by-cognitive level matrix',
        'Determine number of items per cell',
        'Calculate point distribution',
        'Plan item formats (MC, CR, performance)',
        'Set time allocation per section',
        'Generate test blueprint document'
      ],
      outputFormat: 'JSON with blueprint (purpose, format, matrix, pointDistribution, timeAllocation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['blueprint', 'artifacts'],
      properties: {
        blueprint: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            format: { type: 'string' },
            duration: { type: 'string' },
            matrix: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  contentDomain: { type: 'string' },
                  cognitiveLevel: { type: 'string' },
                  itemCount: { type: 'number' },
                  points: { type: 'number' }
                }
              }
            },
            pointDistribution: { type: 'object' },
            timeAllocation: { type: 'object' }
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
  labels: ['agent', 'summative-assessment', 'blueprint', 'planning']
}));

// Task 2: Item Specification
export const itemSpecificationTask = defineTask('item-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create item specifications',
  agent: {
    name: 'item-specifier',
    prompt: {
      role: 'assessment item specialist',
      task: 'Create detailed specifications for each assessment item',
      context: args,
      instructions: [
        'Create item specifications for each blueprint cell',
        'Define item format (MC, short answer, essay, performance)',
        'Specify cognitive demand',
        'Define acceptable response criteria',
        'Specify difficulty target',
        'Note accessibility considerations',
        'Document stimulus requirements',
        'Specify response format requirements',
        'Generate item specification document'
      ],
      outputFormat: 'JSON with specifications, formatDistribution, accessibilityNotes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'artifacts'],
      properties: {
        specifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              specId: { type: 'string' },
              contentDomain: { type: 'string' },
              objective: { type: 'string' },
              cognitiveLevel: { type: 'string' },
              format: { type: 'string' },
              difficultyTarget: { type: 'string' },
              stimulusRequirements: { type: 'string' },
              responseRequirements: { type: 'string' }
            }
          }
        },
        formatDistribution: { type: 'object' },
        accessibilityNotes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'summative-assessment', 'items', 'specification']
}));

// Task 3: Item Development
export const itemDevelopmentTask = defineTask('item-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop assessment items',
  agent: {
    name: 'item-developer',
    prompt: {
      role: 'assessment item writer',
      task: 'Develop assessment items following specifications',
      context: args,
      instructions: [
        'Write items following each specification',
        'Follow item writing guidelines for format',
        'Create clear, unambiguous stems',
        'Develop plausible distractors for MC items',
        'Create model responses for CR items',
        'Ensure content accuracy',
        'Apply universal design principles',
        'Review for bias and sensitivity',
        'Generate item bank document'
      ],
      outputFormat: 'JSON with items, itemBank, qualityChecks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'artifacts'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              specId: { type: 'string' },
              format: { type: 'string' },
              stem: { type: 'string' },
              options: { type: 'array' },
              correctAnswer: { type: 'string' },
              modelResponse: { type: 'string' },
              points: { type: 'number' },
              difficultyEstimate: { type: 'string' }
            }
          }
        },
        itemBank: { type: 'object' },
        qualityChecks: { type: 'array' },
        biasReview: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'summative-assessment', 'items', 'development']
}));

// Task 4: Rubric Development
export const rubricDevelopmentTask = defineTask('rubric-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop scoring rubrics',
  agent: {
    name: 'rubric-developer',
    prompt: {
      role: 'rubric development specialist',
      task: 'Develop scoring rubrics for constructed response and performance items',
      context: args,
      instructions: [
        'Create analytic rubrics for multi-dimensional items',
        'Create holistic rubrics for overall performance',
        'Define clear performance level descriptors',
        'Include anchor responses for each level',
        'Ensure rubric alignment with objectives',
        'Create scorer training materials',
        'Design rubric calibration process',
        'Document rubric application guidelines',
        'Generate rubric documentation'
      ],
      outputFormat: 'JSON with rubrics, anchorResponses, scorerTraining, calibrationProcess, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rubrics', 'artifacts'],
      properties: {
        rubrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rubricId: { type: 'string' },
              itemId: { type: 'string' },
              type: { type: 'string', enum: ['analytic', 'holistic'] },
              criteria: { type: 'array' },
              levels: { type: 'array' },
              descriptors: { type: 'object' }
            }
          }
        },
        anchorResponses: { type: 'array' },
        scorerTraining: { type: 'object' },
        calibrationProcess: { type: 'object' },
        applicationGuidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'summative-assessment', 'rubrics', 'development']
}));

// Task 5: Validity Analysis
export const validityAnalysisTask = defineTask('validity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct validity analysis',
  agent: {
    name: 'validity-analyst',
    prompt: {
      role: 'measurement validity specialist',
      task: 'Analyze and document assessment validity evidence',
      context: args,
      instructions: [
        'Analyze content validity (blueprint alignment)',
        'Document construct validity evidence',
        'Assess face validity',
        'Plan criterion validity studies',
        'Document alignment to standards',
        'Review cognitive complexity alignment',
        'Assess consequential validity considerations',
        'Create validity argument',
        'Generate validity analysis report'
      ],
      outputFormat: 'JSON with report, validityScore, contentValidity, constructValidity, alignmentEvidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'validityScore', 'artifacts'],
      properties: {
        report: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            validityArgument: { type: 'string' },
            limitations: { type: 'array' }
          }
        },
        validityScore: { type: 'number' },
        contentValidity: {
          type: 'object',
          properties: {
            blueprintAlignment: { type: 'number' },
            expertReview: { type: 'object' }
          }
        },
        constructValidity: { type: 'object' },
        alignmentEvidence: { type: 'array' },
        consequentialValidity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'summative-assessment', 'validity', 'analysis']
}));

// Task 6: Reliability Planning
export const reliabilityPlanningTask = defineTask('reliability-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan for reliability',
  agent: {
    name: 'reliability-planner',
    prompt: {
      role: 'measurement reliability specialist',
      task: 'Plan strategies to ensure assessment reliability',
      context: args,
      instructions: [
        'Plan internal consistency analysis (Cronbach\'s alpha)',
        'Design inter-rater reliability procedures',
        'Plan test-retest reliability studies if applicable',
        'Set reliability targets',
        'Design scorer training for consistency',
        'Plan double-scoring procedures',
        'Create reliability monitoring plan',
        'Document reliability enhancement strategies',
        'Generate reliability plan document'
      ],
      outputFormat: 'JSON with plan, targets, procedures, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'targets', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            methods: { type: 'array' },
            timeline: { type: 'object' }
          }
        },
        targets: {
          type: 'object',
          properties: {
            internalConsistency: { type: 'number' },
            interRater: { type: 'number' }
          }
        },
        procedures: {
          type: 'object',
          properties: {
            scorerTraining: { type: 'object' },
            doubleScoring: { type: 'object' },
            calibration: { type: 'object' }
          }
        },
        monitoring: { type: 'object' },
        enhancementStrategies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'summative-assessment', 'reliability', 'planning']
}));

// Task 7: Administration Guide
export const administrationGuideTask = defineTask('administration-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create administration guide',
  agent: {
    name: 'administration-designer',
    prompt: {
      role: 'test administration specialist',
      task: 'Create comprehensive test administration guide',
      context: args,
      instructions: [
        'Document standardized administration procedures',
        'Create proctor/administrator instructions',
        'Define allowable accommodations',
        'Create student instructions',
        'Document security protocols',
        'Plan for testing irregularities',
        'Create materials checklist',
        'Document scoring and reporting procedures',
        'Generate administration guide document'
      ],
      outputFormat: 'JSON with guide, procedures, accommodations, security, irregularities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guide', 'procedures', 'artifacts'],
      properties: {
        guide: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            proctorInstructions: { type: 'object' },
            studentInstructions: { type: 'object' },
            materialsChecklist: { type: 'array' }
          }
        },
        procedures: {
          type: 'object',
          properties: {
            beforeTesting: { type: 'array' },
            duringTesting: { type: 'array' },
            afterTesting: { type: 'array' }
          }
        },
        accommodations: { type: 'array' },
        security: { type: 'object' },
        irregularities: { type: 'object' },
        scoringReporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'summative-assessment', 'administration', 'guide']
}));

// Task 8: Quality Scoring
export const summativeQualityScoringTask = defineTask('summative-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score summative assessment quality',
  agent: {
    name: 'summative-quality-auditor',
    prompt: {
      role: 'assessment quality auditor',
      task: 'Assess summative assessment quality',
      context: args,
      instructions: [
        'Evaluate blueprint comprehensiveness (weight: 20%)',
        'Assess item quality and alignment (weight: 25%)',
        'Review rubric clarity and reliability (weight: 15%)',
        'Evaluate validity evidence (weight: 20%)',
        'Assess reliability planning (weight: 10%)',
        'Review administration guide completeness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify quality issues',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            blueprintQuality: { type: 'number' },
            itemQuality: { type: 'number' },
            rubricQuality: { type: 'number' },
            validityEvidence: { type: 'number' },
            reliabilityPlanning: { type: 'number' },
            administrationGuide: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'summative-assessment', 'quality-scoring', 'validation']
}));
