/**
 * @process education/action-mapping
 * @description Performance-focused training design that starts with business goals, identifies required behaviors, designs practice activities, and determines minimum necessary information
 * @inputs { businessGoal: string, stakeholders: array, performanceGaps: array, constraints: object, context: object }
 * @outputs { success: boolean, goalAnalysis: object, behaviorMap: object, activities: array, informationMap: object, artifacts: array }
 * @recommendedSkills SK-EDU-001 (learning-needs-analysis), SK-EDU-014 (learning-transfer-design), SK-EDU-002 (learning-objectives-writing)
 * @recommendedAgents AG-EDU-001 (instructional-design-lead), AG-EDU-007 (learning-evaluation-analyst)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    businessGoal = '',
    stakeholders = [],
    performanceGaps = [],
    constraints = {},
    context = {},
    outputDir = 'action-mapping-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Action Mapping for business goal: ${businessGoal}`);

  // ============================================================================
  // STEP 1: IDENTIFY THE BUSINESS GOAL
  // ============================================================================

  ctx.log('info', 'Step 1: Analyzing and clarifying business goal');
  const goalAnalysis = await ctx.task(businessGoalAnalysisTask, {
    businessGoal,
    stakeholders,
    context,
    outputDir
  });

  artifacts.push(...goalAnalysis.artifacts);

  // ============================================================================
  // STEP 2: IDENTIFY WHAT PEOPLE NEED TO DO
  // ============================================================================

  ctx.log('info', 'Step 2: Identifying required behaviors and actions');
  const behaviorIdentification = await ctx.task(behaviorIdentificationTask, {
    businessGoal: goalAnalysis.clarifiedGoal,
    performanceGaps,
    context,
    outputDir
  });

  artifacts.push(...behaviorIdentification.artifacts);

  // ============================================================================
  // STEP 3: DESIGN PRACTICE ACTIVITIES
  // ============================================================================

  ctx.log('info', 'Step 3: Designing practice activities');
  const practiceActivities = await ctx.task(practiceActivitiesDesignTask, {
    behaviors: behaviorIdentification.behaviors,
    context,
    constraints,
    outputDir
  });

  artifacts.push(...practiceActivities.artifacts);

  // ============================================================================
  // STEP 4: IDENTIFY MINIMUM INFORMATION
  // ============================================================================

  ctx.log('info', 'Step 4: Identifying minimum necessary information');
  const informationMapping = await ctx.task(informationMappingTask, {
    behaviors: behaviorIdentification.behaviors,
    activities: practiceActivities.activities,
    outputDir
  });

  artifacts.push(...informationMapping.artifacts);

  // ============================================================================
  // CREATE ACTION MAP VISUALIZATION
  // ============================================================================

  ctx.log('info', 'Creating action map visualization');
  const actionMapVisualization = await ctx.task(actionMapVisualizationTask, {
    businessGoal: goalAnalysis.clarifiedGoal,
    behaviors: behaviorIdentification.behaviors,
    activities: practiceActivities.activities,
    information: informationMapping.information,
    outputDir
  });

  artifacts.push(...actionMapVisualization.artifacts);

  // ============================================================================
  // NON-TRAINING SOLUTIONS
  // ============================================================================

  ctx.log('info', 'Identifying non-training solutions');
  const nonTrainingSolutions = await ctx.task(nonTrainingSolutionsTask, {
    performanceGaps,
    behaviors: behaviorIdentification.behaviors,
    context,
    outputDir
  });

  artifacts.push(...nonTrainingSolutions.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring action mapping quality');
  const qualityScore = await ctx.task(actionMappingQualityScoringTask, {
    goalAnalysis,
    behaviorIdentification,
    practiceActivities,
    informationMapping,
    nonTrainingSolutions,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review action mapping
  await ctx.breakpoint({
    question: `Action mapping complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Action Mapping Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        businessGoal,
        totalBehaviors: behaviorIdentification.behaviors?.length || 0,
        totalActivities: practiceActivities.activities?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    businessGoal,
    qualityScore: overallScore,
    qualityMet,
    goalAnalysis: {
      clarifiedGoal: goalAnalysis.clarifiedGoal,
      measurableOutcome: goalAnalysis.measurableOutcome,
      stakeholderAlignment: goalAnalysis.stakeholderAlignment
    },
    behaviorMap: {
      behaviors: behaviorIdentification.behaviors,
      prioritization: behaviorIdentification.prioritization,
      performanceContext: behaviorIdentification.performanceContext
    },
    activities: practiceActivities.activities,
    informationMap: {
      information: informationMapping.information,
      deliveryMethod: informationMapping.deliveryMethod
    },
    nonTrainingSolutions: nonTrainingSolutions.solutions,
    actionMapVisualization: actionMapVisualization.map,
    artifacts,
    duration,
    metadata: {
      processId: 'education/action-mapping',
      timestamp: startTime,
      businessGoal,
      outputDir
    }
  };
}

// Task 1: Business Goal Analysis
export const businessGoalAnalysisTask = defineTask('business-goal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and clarify business goal',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'performance consultant and business analyst',
      task: 'Analyze and clarify business goal for action mapping',
      context: args,
      instructions: [
        'Challenge vague goals and request specific measurable outcomes',
        'Identify the real business problem behind the training request',
        'Determine how success will be measured',
        'Identify key stakeholders and their expectations',
        'Establish baseline performance metrics',
        'Define target performance metrics',
        'Document assumptions and constraints',
        'Clarify timeline and urgency',
        'Generate business goal analysis document'
      ],
      outputFormat: 'JSON with clarifiedGoal, measurableOutcome, metrics, stakeholderAlignment, assumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clarifiedGoal', 'measurableOutcome', 'artifacts'],
      properties: {
        clarifiedGoal: { type: 'string' },
        measurableOutcome: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            metric: { type: 'string' },
            baseline: { type: 'string' },
            target: { type: 'string' },
            timeline: { type: 'string' }
          }
        },
        metrics: { type: 'array', items: { type: 'string' } },
        stakeholderAlignment: {
          type: 'object',
          properties: {
            aligned: { type: 'boolean' },
            concerns: { type: 'array', items: { type: 'string' } },
            agreements: { type: 'array', items: { type: 'string' } }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'action-mapping', 'business-goal', 'analysis']
}));

// Task 2: Behavior Identification
export const behaviorIdentificationTask = defineTask('behavior-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify required behaviors and actions',
  agent: {
    name: 'behavior-analyst',
    prompt: {
      role: 'performance improvement specialist',
      task: 'Identify specific behaviors people need to perform to achieve business goal',
      context: args,
      instructions: [
        'Identify all behaviors that would achieve the business goal',
        'Focus on observable, measurable actions (not knowledge)',
        'Use action verbs that describe what people DO, not what they know',
        'Prioritize behaviors by impact on goal achievement',
        'Identify high-frequency vs low-frequency behaviors',
        'Identify high-stakes vs low-stakes behaviors',
        'Document the context in which behaviors occur',
        'Identify barriers to performing behaviors correctly',
        'Generate behavior map document'
      ],
      outputFormat: 'JSON with behaviors, prioritization, performanceContext, barriers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['behaviors', 'prioritization', 'artifacts'],
      properties: {
        behaviors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              actionVerb: { type: 'string' },
              frequency: { type: 'string', enum: ['high', 'medium', 'low'] },
              stakes: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              currentPerformance: { type: 'string' }
            }
          }
        },
        prioritization: {
          type: 'object',
          properties: {
            highPriority: { type: 'array', items: { type: 'string' } },
            mediumPriority: { type: 'array', items: { type: 'string' } },
            lowPriority: { type: 'array', items: { type: 'string' } }
          }
        },
        performanceContext: {
          type: 'object',
          properties: {
            environment: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            resources: { type: 'array', items: { type: 'string' } }
          }
        },
        barriers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'action-mapping', 'behaviors', 'performance']
}));

// Task 3: Practice Activities Design
export const practiceActivitiesDesignTask = defineTask('practice-activities-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design practice activities',
  agent: {
    name: 'activity-designer',
    prompt: {
      role: 'instructional activity designer',
      task: 'Design realistic practice activities for each priority behavior',
      context: args,
      instructions: [
        'Design activities that let learners practice the actual behavior',
        'Create realistic scenarios reflecting the job context',
        'Make activities challenging and decision-based',
        'Include consequences for choices made',
        'Avoid information dumps - focus on doing, not telling',
        'Design branching scenarios for complex decisions',
        'Include feedback that helps learners improve',
        'Consider gamification elements where appropriate',
        'Generate practice activities documentation'
      ],
      outputFormat: 'JSON with activities, scenarios, feedbackDesign, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              targetBehavior: { type: 'string' },
              activityType: { type: 'string' },
              scenario: { type: 'string' },
              decisionPoints: { type: 'array', items: { type: 'string' } },
              consequences: { type: 'object' },
              feedback: { type: 'object' },
              difficulty: { type: 'string' }
            }
          }
        },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              context: { type: 'string' },
              challenge: { type: 'string' },
              branches: { type: 'array' }
            }
          }
        },
        feedbackDesign: {
          type: 'object',
          properties: {
            intrinsic: { type: 'array' },
            instructional: { type: 'array' }
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
  labels: ['agent', 'action-mapping', 'activities', 'practice']
}));

// Task 4: Information Mapping
export const informationMappingTask = defineTask('information-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify minimum necessary information',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'learning content strategist',
      task: 'Identify minimum information needed to perform behaviors',
      context: args,
      instructions: [
        'For each behavior, identify ONLY information needed to perform it',
        'Challenge every piece of information: Is it really needed?',
        'Distinguish between need-to-know and nice-to-know',
        'Consider what can be provided as job aids instead of training',
        'Identify information that should be available at point of need',
        'Determine best delivery method for each piece of information',
        'Minimize information delivery in training',
        'Design reference materials for complex information',
        'Generate information map document'
      ],
      outputFormat: 'JSON with information, deliveryMethod, jobAids, referenceMatrials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['information', 'deliveryMethod', 'artifacts'],
      properties: {
        information: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              informationId: { type: 'string' },
              content: { type: 'string' },
              relatedBehavior: { type: 'string' },
              necessity: { type: 'string', enum: ['essential', 'helpful', 'nice-to-know'] },
              deliveryRecommendation: { type: 'string' }
            }
          }
        },
        deliveryMethod: {
          type: 'object',
          properties: {
            inTraining: { type: 'array', items: { type: 'string' } },
            jobAids: { type: 'array', items: { type: 'string' } },
            reference: { type: 'array', items: { type: 'string' } }
          }
        },
        jobAids: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aidType: { type: 'string' },
              content: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        referenceMaterials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'action-mapping', 'information', 'minimum-content']
}));

// Task 5: Action Map Visualization
export const actionMapVisualizationTask = defineTask('action-map-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create action map visualization',
  agent: {
    name: 'visualization-designer',
    prompt: {
      role: 'visual learning designer',
      task: 'Create comprehensive action map visualization',
      context: args,
      instructions: [
        'Create visual representation with business goal at center',
        'Show behaviors branching from the goal',
        'Connect activities to their target behaviors',
        'Show information linked to relevant activities',
        'Use visual hierarchy to show priority',
        'Include legend and reading instructions',
        'Make map interactive or easy to navigate',
        'Generate action map in appropriate format',
        'Create documentation for map usage'
      ],
      outputFormat: 'JSON with map, structure, legend, usageInstructions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'artifacts'],
      properties: {
        map: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            location: { type: 'string' },
            structure: {
              type: 'object',
              properties: {
                centralGoal: { type: 'string' },
                behaviorBranches: { type: 'array' },
                activityNodes: { type: 'array' },
                informationLinks: { type: 'array' }
              }
            }
          }
        },
        legend: { type: 'object' },
        usageInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'action-mapping', 'visualization', 'map']
}));

// Task 6: Non-Training Solutions
export const nonTrainingSolutionsTask = defineTask('non-training-solutions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify non-training solutions',
  agent: {
    name: 'performance-consultant',
    prompt: {
      role: 'performance improvement consultant',
      task: 'Identify non-training solutions for performance gaps',
      context: args,
      instructions: [
        'Analyze each performance gap for root cause',
        'Identify gaps caused by motivation (not training issue)',
        'Identify gaps caused by environment (tools, resources)',
        'Identify gaps caused by incentives/consequences',
        'Recommend job aids and performance support',
        'Suggest process improvements',
        'Recommend feedback and coaching systems',
        'Identify quick wins that do not require training',
        'Generate non-training solutions document'
      ],
      outputFormat: 'JSON with solutions, rootCauseAnalysis, recommendations, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['solutions', 'artifacts'],
      properties: {
        solutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              rootCause: { type: 'string' },
              solutionType: { type: 'string' },
              recommendation: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        rootCauseAnalysis: {
          type: 'object',
          properties: {
            skillGaps: { type: 'array' },
            motivationGaps: { type: 'array' },
            environmentGaps: { type: 'array' },
            incentiveGaps: { type: 'array' }
          }
        },
        recommendations: { type: 'array' },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'action-mapping', 'non-training', 'performance-support']
}));

// Task 7: Action Mapping Quality Scoring
export const actionMappingQualityScoringTask = defineTask('action-mapping-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score action mapping quality',
  agent: {
    name: 'action-mapping-auditor',
    prompt: {
      role: 'action mapping quality auditor',
      task: 'Assess overall action mapping quality and completeness',
      context: args,
      instructions: [
        'Evaluate business goal clarity and measurability (weight: 20%)',
        'Assess behavior identification completeness (weight: 25%)',
        'Review practice activity quality and realism (weight: 25%)',
        'Evaluate information minimization (weight: 15%)',
        'Assess non-training solutions identification (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Check for action-focused design (not information-focused)',
        'Identify gaps and improvement areas',
        'Validate against action mapping best practices'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            businessGoal: { type: 'number' },
            behaviors: { type: 'number' },
            activities: { type: 'number' },
            information: { type: 'number' },
            nonTraining: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
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
  labels: ['agent', 'action-mapping', 'quality-scoring', 'validation']
}));
