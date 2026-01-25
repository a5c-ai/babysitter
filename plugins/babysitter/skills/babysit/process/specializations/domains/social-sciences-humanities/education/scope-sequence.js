/**
 * @process education/scope-sequence
 * @description Systematic development of curriculum breadth (scope) and order (sequence) ensuring comprehensive coverage and logical progression of content
 * @inputs { courseName: string, standards: array, gradeLevel: string, duration: string, constraints: object }
 * @outputs { success: boolean, scope: object, sequence: object, pacingGuide: object, artifacts: array }
 * @recommendedSkills SK-EDU-008 (standards-alignment-mapping), SK-EDU-002 (learning-objectives-writing)
 * @recommendedAgents AG-EDU-002 (curriculum-development-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Course',
    standards = [],
    gradeLevel = '',
    duration = 'year',
    constraints = {},
    outputDir = 'scope-sequence-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Scope and Sequence Planning for ${courseName}`);

  // ============================================================================
  // SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Defining curriculum scope');
  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    courseName,
    standards,
    gradeLevel,
    constraints,
    outputDir
  });

  artifacts.push(...scopeDefinition.artifacts);

  // ============================================================================
  // CONTENT PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Prioritizing content');
  const contentPrioritization = await ctx.task(contentPrioritizationTask, {
    courseName,
    scope: scopeDefinition.scope,
    standards,
    constraints,
    outputDir
  });

  artifacts.push(...contentPrioritization.artifacts);

  // ============================================================================
  // SEQUENCE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing content sequence');
  const sequenceDevelopment = await ctx.task(sequenceDevelopmentTask, {
    courseName,
    scope: scopeDefinition.scope,
    prioritization: contentPrioritization.prioritization,
    duration,
    outputDir
  });

  artifacts.push(...sequenceDevelopment.artifacts);

  // ============================================================================
  // PACING GUIDE CREATION
  // ============================================================================

  ctx.log('info', 'Creating pacing guide');
  const pacingGuide = await ctx.task(pacingGuideTask, {
    courseName,
    sequence: sequenceDevelopment.sequence,
    duration,
    constraints,
    outputDir
  });

  artifacts.push(...pacingGuide.artifacts);

  // ============================================================================
  // ASSESSMENT INTEGRATION
  // ============================================================================

  ctx.log('info', 'Integrating assessments into scope and sequence');
  const assessmentIntegration = await ctx.task(assessmentIntegrationTask, {
    courseName,
    scope: scopeDefinition.scope,
    sequence: sequenceDevelopment.sequence,
    pacingGuide: pacingGuide.guide,
    outputDir
  });

  artifacts.push(...assessmentIntegration.artifacts);

  // ============================================================================
  // RESOURCE ALIGNMENT
  // ============================================================================

  ctx.log('info', 'Aligning resources to scope and sequence');
  const resourceAlignment = await ctx.task(resourceAlignmentTask, {
    courseName,
    scope: scopeDefinition.scope,
    sequence: sequenceDevelopment.sequence,
    constraints,
    outputDir
  });

  artifacts.push(...resourceAlignment.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring scope and sequence quality');
  const qualityScore = await ctx.task(scopeSequenceQualityScoringTask, {
    courseName,
    scopeDefinition,
    contentPrioritization,
    sequenceDevelopment,
    pacingGuide,
    assessmentIntegration,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review scope and sequence
  await ctx.breakpoint({
    question: `Scope and sequence complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Scope and Sequence Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        courseName,
        gradeLevel,
        totalUnits: sequenceDevelopment.sequence?.units?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration_ms = endTime - startTime;

  return {
    success: true,
    courseName,
    gradeLevel,
    qualityScore: overallScore,
    qualityMet,
    scope: {
      topics: scopeDefinition.scope.topics,
      skills: scopeDefinition.scope.skills,
      standards: scopeDefinition.scope.standardsCoverage
    },
    sequence: {
      units: sequenceDevelopment.sequence.units,
      rationale: sequenceDevelopment.sequence.rationale,
      dependencies: sequenceDevelopment.sequence.dependencies
    },
    pacingGuide: pacingGuide.guide,
    assessmentPlan: assessmentIntegration.plan,
    resourceMap: resourceAlignment.map,
    artifacts,
    duration: duration_ms,
    metadata: {
      processId: 'education/scope-sequence',
      timestamp: startTime,
      courseName,
      gradeLevel,
      outputDir
    }
  };
}

// Task 1: Scope Definition
export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define curriculum scope',
  agent: {
    name: 'scope-analyst',
    prompt: {
      role: 'curriculum scope specialist',
      task: 'Define the breadth and depth of curriculum content',
      context: args,
      instructions: [
        'Identify all content topics to be covered',
        'Define skills to be developed',
        'Map scope to standards coverage',
        'Determine depth of coverage for each topic',
        'Identify essential vs supplementary content',
        'Document prerequisite knowledge assumed',
        'Note connections to other courses/grades',
        'Define scope boundaries (what is not included)',
        'Generate scope definition document'
      ],
      outputFormat: 'JSON with scope (topics, skills, standardsCoverage), depth, boundaries, prerequisites, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'artifacts'],
      properties: {
        scope: {
          type: 'object',
          properties: {
            topics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  subtopics: { type: 'array', items: { type: 'string' } },
                  depth: { type: 'string' }
                }
              }
            },
            skills: { type: 'array', items: { type: 'string' } },
            standardsCoverage: { type: 'array' }
          }
        },
        depth: { type: 'object' },
        boundaries: { type: 'array', items: { type: 'string' } },
        prerequisites: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scope-sequence', 'scope', 'definition']
}));

// Task 2: Content Prioritization
export const contentPrioritizationTask = defineTask('content-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize curriculum content',
  agent: {
    name: 'content-prioritizer',
    prompt: {
      role: 'curriculum prioritization specialist',
      task: 'Prioritize content based on importance and constraints',
      context: args,
      instructions: [
        'Categorize content as essential, important, or enrichment',
        'Apply prioritization criteria (standards, assessments, future learning)',
        'Consider time constraints in prioritization',
        'Identify content that cannot be cut',
        'Determine flexible content for time adjustments',
        'Balance breadth vs depth considerations',
        'Document prioritization rationale',
        'Create priority matrix',
        'Generate prioritization document'
      ],
      outputFormat: 'JSON with prioritization, categories, rationale, flexibility, priorityMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritization', 'categories', 'artifacts'],
      properties: {
        prioritization: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              priority: { type: 'string', enum: ['essential', 'important', 'enrichment'] },
              rationale: { type: 'string' }
            }
          }
        },
        categories: {
          type: 'object',
          properties: {
            essential: { type: 'array' },
            important: { type: 'array' },
            enrichment: { type: 'array' }
          }
        },
        rationale: { type: 'string' },
        flexibility: { type: 'array' },
        priorityMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scope-sequence', 'prioritization', 'content']
}));

// Task 3: Sequence Development
export const sequenceDevelopmentTask = defineTask('sequence-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop content sequence',
  agent: {
    name: 'sequence-developer',
    prompt: {
      role: 'curriculum sequencing specialist',
      task: 'Develop logical sequence for content delivery',
      context: args,
      instructions: [
        'Organize content into instructional units',
        'Determine optimal unit sequence',
        'Apply sequencing principles (simple to complex, concrete to abstract)',
        'Map content dependencies and prerequisites',
        'Consider spiral curriculum opportunities',
        'Plan for concept reinforcement and review',
        'Account for natural breaks (semesters, quarters)',
        'Document sequencing rationale',
        'Generate sequence document'
      ],
      outputFormat: 'JSON with sequence (units, rationale, dependencies), spiralOpportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sequence', 'artifacts'],
      properties: {
        sequence: {
          type: 'object',
          properties: {
            units: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  unitNumber: { type: 'number' },
                  title: { type: 'string' },
                  topics: { type: 'array', items: { type: 'string' } },
                  duration: { type: 'string' },
                  prerequisites: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            rationale: { type: 'string' },
            dependencies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  unit: { type: 'string' },
                  dependsOn: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        spiralOpportunities: { type: 'array' },
        reviewPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scope-sequence', 'sequence', 'development']
}));

// Task 4: Pacing Guide
export const pacingGuideTask = defineTask('pacing-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create pacing guide',
  agent: {
    name: 'pacing-specialist',
    prompt: {
      role: 'curriculum pacing specialist',
      task: 'Create detailed pacing guide for curriculum delivery',
      context: args,
      instructions: [
        'Allocate time for each unit and topic',
        'Account for assessment time',
        'Plan for review and reteaching time',
        'Consider school calendar constraints',
        'Build in buffer time for unexpected needs',
        'Plan pacing checkpoints',
        'Create week-by-week breakdown',
        'Document pacing adjustment strategies',
        'Generate pacing guide document'
      ],
      outputFormat: 'JSON with guide (weeklyPlan, timeAllocations, checkpoints), bufferTime, adjustmentStrategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guide', 'artifacts'],
      properties: {
        guide: {
          type: 'object',
          properties: {
            weeklyPlan: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  week: { type: 'number' },
                  unit: { type: 'string' },
                  topics: { type: 'array', items: { type: 'string' } },
                  activities: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            timeAllocations: { type: 'object' },
            checkpoints: { type: 'array' }
          }
        },
        bufferTime: { type: 'string' },
        adjustmentStrategies: { type: 'array', items: { type: 'string' } },
        calendarConsiderations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scope-sequence', 'pacing', 'guide']
}));

// Task 5: Assessment Integration
export const assessmentIntegrationTask = defineTask('assessment-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate assessments into scope and sequence',
  agent: {
    name: 'assessment-integrator',
    prompt: {
      role: 'assessment integration specialist',
      task: 'Integrate assessments throughout the scope and sequence',
      context: args,
      instructions: [
        'Plan formative assessments within each unit',
        'Schedule summative assessments',
        'Integrate benchmark assessments',
        'Align assessments with standards coverage',
        'Plan assessment preparation time',
        'Schedule assessment feedback time',
        'Create assessment calendar',
        'Document assessment-instruction alignment',
        'Generate assessment integration document'
      ],
      outputFormat: 'JSON with plan, calendar, formativeAssessments, summativeAssessments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'calendar', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            assessmentTypes: { type: 'array' },
            frequency: { type: 'object' },
            alignment: { type: 'array' }
          }
        },
        calendar: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              week: { type: 'number' },
              assessments: { type: 'array' }
            }
          }
        },
        formativeAssessments: { type: 'array' },
        summativeAssessments: { type: 'array' },
        benchmarkAssessments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scope-sequence', 'assessment', 'integration']
}));

// Task 6: Resource Alignment
export const resourceAlignmentTask = defineTask('resource-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align resources to scope and sequence',
  agent: {
    name: 'resource-aligner',
    prompt: {
      role: 'instructional resource specialist',
      task: 'Align instructional resources to scope and sequence',
      context: args,
      instructions: [
        'Map existing resources to units and topics',
        'Identify resource gaps',
        'Recommend supplementary resources',
        'Note technology requirements by unit',
        'Plan resource procurement timeline',
        'Document resource sharing opportunities',
        'Create resource guide for teachers',
        'Note budget considerations',
        'Generate resource alignment document'
      ],
      outputFormat: 'JSON with map, gaps, recommendations, technologyNeeds, procurementPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'gaps', 'artifacts'],
      properties: {
        map: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unit: { type: 'string' },
              resources: { type: 'array' },
              technology: { type: 'array' }
            }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array' },
        technologyNeeds: { type: 'array' },
        procurementPlan: { type: 'object' },
        teacherGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scope-sequence', 'resources', 'alignment']
}));

// Task 7: Quality Scoring
export const scopeSequenceQualityScoringTask = defineTask('scope-sequence-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score scope and sequence quality',
  agent: {
    name: 'scope-sequence-auditor',
    prompt: {
      role: 'curriculum quality auditor',
      task: 'Assess scope and sequence quality and completeness',
      context: args,
      instructions: [
        'Evaluate scope comprehensiveness (weight: 25%)',
        'Assess prioritization appropriateness (weight: 15%)',
        'Review sequence logic and coherence (weight: 25%)',
        'Evaluate pacing feasibility (weight: 20%)',
        'Assess assessment integration (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify quality issues',
        'Provide improvement recommendations',
        'Validate against curriculum best practices'
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
            scopeComprehensiveness: { type: 'number' },
            prioritization: { type: 'number' },
            sequenceCoherence: { type: 'number' },
            pacingFeasibility: { type: 'number' },
            assessmentIntegration: { type: 'number' }
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
  labels: ['agent', 'scope-sequence', 'quality-scoring', 'validation']
}));
