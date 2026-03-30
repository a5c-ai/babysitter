/**
 * @process education/sam-model
 * @description Agile instructional design model emphasizing rapid prototyping, iterative design cycles, and continuous stakeholder feedback for e-learning development
 * @inputs { projectName: string, stakeholders: array, learningGoals: array, constraints: object, iterations: number }
 * @outputs { success: boolean, prototype: object, iterationHistory: array, finalDesign: object, artifacts: array }
 * @recommendedSkills SK-EDU-005 (e-learning-storyboarding), SK-EDU-006 (multimedia-learning-design), SK-EDU-011 (instructional-video-production)
 * @recommendedAgents AG-EDU-001 (instructional-design-lead), AG-EDU-004 (e-learning-developer), AG-EDU-010 (learning-experience-designer)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'E-Learning Project',
    stakeholders = [],
    learningGoals = [],
    constraints = {},
    iterations = 3,
    outputDir = 'sam-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const iterationHistory = [];

  ctx.log('info', `Starting SAM Model Implementation for ${projectName}`);

  // ============================================================================
  // PREPARATION PHASE
  // ============================================================================

  ctx.log('info', 'Preparation Phase: Information gathering and kickoff');
  const preparationResult = await ctx.task(preparationPhaseTask, {
    projectName,
    stakeholders,
    learningGoals,
    constraints,
    outputDir
  });

  artifacts.push(...preparationResult.artifacts);

  // ============================================================================
  // ITERATIVE DESIGN PHASE (SAM1 Cycles)
  // ============================================================================

  let currentPrototype = null;
  let currentDesign = preparationResult.initialDesign;

  for (let i = 1; i <= iterations; i++) {
    ctx.log('info', `Iteration ${i}: Design-Prototype-Review Cycle`);

    // Design Step
    const designResult = await ctx.task(iterativeDesignTask, {
      projectName,
      iterationNumber: i,
      previousDesign: currentDesign,
      stakeholderFeedback: currentPrototype?.feedback || null,
      learningGoals,
      outputDir
    });

    artifacts.push(...designResult.artifacts);

    // Prototype Step
    const prototypeResult = await ctx.task(rapidPrototypingTask, {
      projectName,
      iterationNumber: i,
      design: designResult.design,
      outputDir
    });

    artifacts.push(...prototypeResult.artifacts);
    currentPrototype = prototypeResult;

    // Review Step
    const reviewResult = await ctx.task(stakeholderReviewTask, {
      projectName,
      iterationNumber: i,
      prototype: prototypeResult.prototype,
      stakeholders,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    iterationHistory.push({
      iteration: i,
      design: designResult.design,
      prototype: prototypeResult.prototype,
      feedback: reviewResult.feedback,
      approvalStatus: reviewResult.approvalStatus
    });

    currentDesign = {
      ...designResult.design,
      refinements: reviewResult.refinements
    };

    // Check for early approval
    if (reviewResult.approvalStatus === 'approved') {
      ctx.log('info', `Design approved at iteration ${i}`);
      break;
    }
  }

  // ============================================================================
  // ITERATIVE DEVELOPMENT PHASE (SAM2 Cycles)
  // ============================================================================

  ctx.log('info', 'Development Phase: Alpha, Beta, Gold releases');

  // Alpha Development
  const alphaResult = await ctx.task(alphaDevelopmentTask, {
    projectName,
    finalDesign: currentDesign,
    iterationHistory,
    outputDir
  });

  artifacts.push(...alphaResult.artifacts);

  // Beta Development
  const betaResult = await ctx.task(betaDevelopmentTask, {
    projectName,
    alphaRelease: alphaResult.release,
    stakeholders,
    outputDir
  });

  artifacts.push(...betaResult.artifacts);

  // Gold Development
  const goldResult = await ctx.task(goldDevelopmentTask, {
    projectName,
    betaRelease: betaResult.release,
    constraints,
    outputDir
  });

  artifacts.push(...goldResult.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring SAM implementation quality');
  const qualityScore = await ctx.task(samQualityScoringTask, {
    projectName,
    preparationResult,
    iterationHistory,
    alphaResult,
    betaResult,
    goldResult,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review SAM implementation
  await ctx.breakpoint({
    question: `SAM implementation complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'SAM Model Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        projectName,
        totalIterations: iterationHistory.length,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore: overallScore,
    qualityMet,
    preparation: {
      stakeholderAlignment: preparationResult.stakeholderAlignment,
      projectScope: preparationResult.projectScope
    },
    prototype: currentPrototype?.prototype || null,
    iterationHistory,
    finalDesign: currentDesign,
    releases: {
      alpha: alphaResult.release,
      beta: betaResult.release,
      gold: goldResult.release
    },
    artifacts,
    duration,
    metadata: {
      processId: 'education/sam-model',
      timestamp: startTime,
      projectName,
      outputDir
    }
  };
}

// Task 1: Preparation Phase
export const preparationPhaseTask = defineTask('preparation-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct SAM preparation phase',
  agent: {
    name: 'sam-facilitator',
    prompt: {
      role: 'agile instructional design facilitator',
      task: 'Conduct preparation phase for SAM implementation',
      context: args,
      instructions: [
        'Gather background information on project context',
        'Identify and analyze all stakeholders',
        'Conduct savvy start meeting with key stakeholders',
        'Define project scope and boundaries',
        'Establish learning goals and success criteria',
        'Identify constraints and assumptions',
        'Create initial design concept (brain dump)',
        'Establish iteration schedule and milestones',
        'Generate preparation phase documentation'
      ],
      outputFormat: 'JSON with stakeholderAlignment, projectScope, initialDesign, constraints, schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderAlignment', 'projectScope', 'initialDesign', 'artifacts'],
      properties: {
        stakeholderAlignment: {
          type: 'object',
          properties: {
            stakeholders: { type: 'array' },
            expectations: { type: 'object' },
            communicationPlan: { type: 'object' }
          }
        },
        projectScope: {
          type: 'object',
          properties: {
            inScope: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        initialDesign: { type: 'object' },
        constraints: { type: 'object' },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sam', 'preparation', 'kickoff']
}));

// Task 2: Iterative Design
export const iterativeDesignTask = defineTask('iterative-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct iterative design cycle',
  agent: {
    name: 'iterative-designer',
    prompt: {
      role: 'agile instructional designer',
      task: 'Conduct iterative design cycle incorporating feedback',
      context: args,
      instructions: [
        'Review previous design and stakeholder feedback',
        'Identify areas for improvement',
        'Refine learning objectives and activities',
        'Update content organization and sequencing',
        'Improve interaction design patterns',
        'Enhance assessment strategies',
        'Document design decisions and rationale',
        'Prepare design for prototyping',
        'Generate design iteration document'
      ],
      outputFormat: 'JSON with design, improvements, decisions, readyForPrototype, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'improvements', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            modules: { type: 'array' },
            interactions: { type: 'array' },
            assessments: { type: 'array' },
            navigation: { type: 'object' }
          }
        },
        improvements: { type: 'array', items: { type: 'string' } },
        decisions: { type: 'array' },
        readyForPrototype: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sam', 'design', 'iteration']
}));

// Task 3: Rapid Prototyping
export const rapidPrototypingTask = defineTask('rapid-prototyping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create rapid prototype',
  agent: {
    name: 'prototype-developer',
    prompt: {
      role: 'rapid prototyping specialist',
      task: 'Create functional prototype for stakeholder review',
      context: args,
      instructions: [
        'Develop functional prototype based on current design',
        'Focus on key interactions and user flows',
        'Create sample content for critical sections',
        'Implement core navigation patterns',
        'Include placeholder for media elements',
        'Ensure prototype is interactive and testable',
        'Document prototype limitations and assumptions',
        'Prepare prototype for stakeholder demonstration',
        'Generate prototype documentation'
      ],
      outputFormat: 'JSON with prototype, features, limitations, testInstructions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prototype', 'features', 'artifacts'],
      properties: {
        prototype: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            format: { type: 'string' },
            version: { type: 'string' },
            screens: { type: 'array' }
          }
        },
        features: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        testInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sam', 'prototype', 'rapid']
}));

// Task 4: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'review-facilitator',
    prompt: {
      role: 'stakeholder review facilitator',
      task: 'Facilitate stakeholder review and gather feedback',
      context: args,
      instructions: [
        'Present prototype to stakeholders',
        'Gather structured feedback on design elements',
        'Document specific improvement requests',
        'Identify critical issues vs nice-to-haves',
        'Assess stakeholder satisfaction level',
        'Determine if design approval can be granted',
        'Prioritize refinements for next iteration',
        'Document consensus and disagreements',
        'Generate review summary and action items'
      ],
      outputFormat: 'JSON with feedback, refinements, approvalStatus, satisfactionScore, actionItems, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['feedback', 'refinements', 'approvalStatus', 'artifacts'],
      properties: {
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              category: { type: 'string' },
              comment: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        refinements: { type: 'array', items: { type: 'string' } },
        approvalStatus: { type: 'string', enum: ['approved', 'conditional', 'needs-revision'] },
        satisfactionScore: { type: 'number' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sam', 'review', 'stakeholder']
}));

// Task 5: Alpha Development
export const alphaDevelopmentTask = defineTask('alpha-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop alpha release',
  agent: {
    name: 'alpha-developer',
    prompt: {
      role: 'e-learning developer',
      task: 'Develop alpha release with core functionality',
      context: args,
      instructions: [
        'Implement core learning modules',
        'Develop primary interactions and activities',
        'Create initial media assets',
        'Implement basic navigation and tracking',
        'Set up assessment framework',
        'Conduct internal quality review',
        'Document known issues and limitations',
        'Prepare for limited testing',
        'Generate alpha release documentation'
      ],
      outputFormat: 'JSON with release, features, knownIssues, testPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['release', 'features', 'artifacts'],
      properties: {
        release: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            location: { type: 'string' },
            releaseDate: { type: 'string' },
            completionPercentage: { type: 'number' }
          }
        },
        features: { type: 'array', items: { type: 'string' } },
        knownIssues: { type: 'array', items: { type: 'string' } },
        testPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sam', 'development', 'alpha']
}));

// Task 6: Beta Development
export const betaDevelopmentTask = defineTask('beta-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop beta release',
  agent: {
    name: 'beta-developer',
    prompt: {
      role: 'e-learning developer',
      task: 'Develop beta release with full functionality',
      context: args,
      instructions: [
        'Complete all learning modules',
        'Finalize all interactions and activities',
        'Complete media production and integration',
        'Implement full tracking and reporting',
        'Complete all assessments',
        'Address alpha feedback and issues',
        'Conduct usability testing',
        'Perform accessibility review',
        'Generate beta release documentation'
      ],
      outputFormat: 'JSON with release, completedFeatures, testResults, accessibilityReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['release', 'completedFeatures', 'artifacts'],
      properties: {
        release: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            location: { type: 'string' },
            releaseDate: { type: 'string' },
            completionPercentage: { type: 'number' }
          }
        },
        completedFeatures: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'object' },
        accessibilityReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sam', 'development', 'beta']
}));

// Task 7: Gold Development
export const goldDevelopmentTask = defineTask('gold-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop gold (final) release',
  agent: {
    name: 'gold-developer',
    prompt: {
      role: 'e-learning quality specialist',
      task: 'Finalize gold release ready for deployment',
      context: args,
      instructions: [
        'Address all beta feedback and issues',
        'Perform final quality assurance',
        'Complete accessibility compliance verification',
        'Finalize all documentation',
        'Prepare deployment package',
        'Create user guides and support materials',
        'Conduct final stakeholder sign-off',
        'Prepare maintenance and support plan',
        'Generate gold release documentation'
      ],
      outputFormat: 'JSON with release, qualityReport, deploymentPackage, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['release', 'qualityReport', 'artifacts'],
      properties: {
        release: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            location: { type: 'string' },
            releaseDate: { type: 'string' },
            signOffStatus: { type: 'string' }
          }
        },
        qualityReport: {
          type: 'object',
          properties: {
            functionalityScore: { type: 'number' },
            accessibilityScore: { type: 'number' },
            usabilityScore: { type: 'number' }
          }
        },
        deploymentPackage: { type: 'object' },
        documentation: { type: 'array' },
        maintenancePlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sam', 'development', 'gold']
}));

// Task 8: SAM Quality Scoring
export const samQualityScoringTask = defineTask('sam-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score SAM implementation quality',
  agent: {
    name: 'sam-quality-auditor',
    prompt: {
      role: 'agile instructional design auditor',
      task: 'Assess overall SAM implementation quality and completeness',
      context: args,
      instructions: [
        'Evaluate preparation phase thoroughness (weight: 15%)',
        'Assess iteration effectiveness and convergence (weight: 25%)',
        'Review stakeholder engagement quality (weight: 20%)',
        'Evaluate development phase quality (weight: 25%)',
        'Assess final deliverable quality (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and process improvements',
        'Provide specific recommendations',
        'Validate alignment with SAM best practices'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, strengths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            preparation: { type: 'number' },
            iteration: { type: 'number' },
            stakeholderEngagement: { type: 'number' },
            development: { type: 'number' },
            finalDeliverable: { type: 'number' }
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
  labels: ['agent', 'sam', 'quality-scoring', 'validation']
}));
