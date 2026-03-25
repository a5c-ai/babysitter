/**
 * @process domains/science/scientific-discovery/design-thinking-sprint
 * @description Rapid innovation through empathize, define, ideate, prototype, test - Guides teams through
 * a structured design thinking sprint to solve complex problems through user-centered innovation,
 * rapid prototyping, and iterative testing.
 * @inputs { challenge: string, users: array, constraints: object, sprintDuration?: string }
 * @outputs { success: boolean, insights: object, problemStatement: object, ideas: array, prototype: object, testResults: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/design-thinking-sprint', {
 *   challenge: 'Improve patient experience in emergency departments',
 *   users: ['patients', 'nurses', 'doctors', 'family-members'],
 *   constraints: { budget: 'moderate', timeline: '1-week', regulations: 'HIPAA' }
 * });
 *
 * @references
 * - Brown, T. (2009). Change by Design
 * - Knapp, J. et al. (2016). Sprint: How to Solve Big Problems in Just Five Days
 * - IDEO Design Thinking: https://designthinking.ideo.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    challenge,
    users = [],
    constraints = {},
    sprintDuration = '5-days',
    outputDir = 'design-sprint-output',
    minimumValidationScore = 70
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Design Thinking Sprint for: ${challenge}`);

  // ============================================================================
  // PHASE 1: EMPATHIZE - User Research
  // ============================================================================

  ctx.log('info', 'Phase 1: EMPATHIZE - Understanding users');
  const empathizePhase = await ctx.task(empathizeTask, {
    challenge,
    users,
    constraints,
    outputDir
  });

  artifacts.push(...empathizePhase.artifacts);

  // ============================================================================
  // PHASE 2: EMPATHIZE - Journey Mapping
  // ============================================================================

  ctx.log('info', 'Phase 2: EMPATHIZE - Mapping user journeys');
  const journeyMapping = await ctx.task(journeyMappingTask, {
    challenge,
    users,
    userInsights: empathizePhase.insights,
    outputDir
  });

  artifacts.push(...journeyMapping.artifacts);

  // ============================================================================
  // PHASE 3: DEFINE - Problem Framing
  // ============================================================================

  ctx.log('info', 'Phase 3: DEFINE - Framing the problem');
  const definePhase = await ctx.task(defineTask, {
    challenge,
    userInsights: empathizePhase.insights,
    journeyMaps: journeyMapping.journeyMaps,
    constraints,
    outputDir
  });

  artifacts.push(...definePhase.artifacts);

  // Breakpoint: Review problem definition
  await ctx.breakpoint({
    question: `Problem statement: "${definePhase.problemStatement}". Point of View established for ${users.length} user types. Approve before ideation?`,
    title: 'Problem Definition Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        challenge,
        problemStatement: definePhase.problemStatement,
        keyInsights: empathizePhase.keyInsights?.length || 0,
        painPoints: journeyMapping.painPoints?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 4: IDEATE - Divergent Thinking
  // ============================================================================

  ctx.log('info', 'Phase 4: IDEATE - Generating ideas');
  const ideatePhase = await ctx.task(ideateTask, {
    problemStatement: definePhase.problemStatement,
    howMightWe: definePhase.howMightWeQuestions,
    userInsights: empathizePhase.insights,
    constraints,
    outputDir
  });

  artifacts.push(...ideatePhase.artifacts);

  // ============================================================================
  // PHASE 5: IDEATE - Convergent Selection
  // ============================================================================

  ctx.log('info', 'Phase 5: IDEATE - Selecting best ideas');
  const ideaSelection = await ctx.task(ideaSelectionTask, {
    ideas: ideatePhase.ideas,
    problemStatement: definePhase.problemStatement,
    constraints,
    outputDir
  });

  artifacts.push(...ideaSelection.artifacts);

  // ============================================================================
  // PHASE 6: PROTOTYPE - Concept Development
  // ============================================================================

  ctx.log('info', 'Phase 6: PROTOTYPE - Developing concepts');
  const prototypePhase = await ctx.task(prototypeTask, {
    selectedIdeas: ideaSelection.selectedIdeas,
    problemStatement: definePhase.problemStatement,
    constraints,
    outputDir
  });

  artifacts.push(...prototypePhase.artifacts);

  // ============================================================================
  // PHASE 7: PROTOTYPE - Storyboarding
  // ============================================================================

  ctx.log('info', 'Phase 7: PROTOTYPE - Creating storyboard');
  const storyboarding = await ctx.task(storyboardingTask, {
    prototype: prototypePhase.prototype,
    userJourneys: journeyMapping.journeyMaps,
    outputDir
  });

  artifacts.push(...storyboarding.artifacts);

  // ============================================================================
  // PHASE 8: TEST - Test Planning
  // ============================================================================

  ctx.log('info', 'Phase 8: TEST - Planning user tests');
  const testPlanning = await ctx.task(testPlanningTask, {
    prototype: prototypePhase.prototype,
    users,
    problemStatement: definePhase.problemStatement,
    outputDir
  });

  artifacts.push(...testPlanning.artifacts);

  // ============================================================================
  // PHASE 9: TEST - User Testing
  // ============================================================================

  ctx.log('info', 'Phase 9: TEST - Conducting user tests');
  const userTesting = await ctx.task(userTestingTask, {
    prototype: prototypePhase.prototype,
    testPlan: testPlanning.testPlan,
    users,
    outputDir
  });

  artifacts.push(...userTesting.artifacts);

  // ============================================================================
  // PHASE 10: TEST - Results Analysis
  // ============================================================================

  ctx.log('info', 'Phase 10: TEST - Analyzing test results');
  const testAnalysis = await ctx.task(testAnalysisTask, {
    testResults: userTesting.testResults,
    prototype: prototypePhase.prototype,
    problemStatement: definePhase.problemStatement,
    minimumValidationScore,
    outputDir
  });

  artifacts.push(...testAnalysis.artifacts);

  // ============================================================================
  // PHASE 11: ITERATE - Refinement Recommendations
  // ============================================================================

  ctx.log('info', 'Phase 11: ITERATE - Developing refinement plan');
  const iterationPlan = await ctx.task(iterationPlanTask, {
    testAnalysis,
    prototype: prototypePhase.prototype,
    userFeedback: userTesting.feedback,
    outputDir
  });

  artifacts.push(...iterationPlan.artifacts);

  // ============================================================================
  // PHASE 12: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 12: Scoring sprint quality');
  const qualityScore = await ctx.task(sprintQualityScoringTask, {
    empathizePhase,
    definePhase,
    ideatePhase,
    prototypePhase,
    testAnalysis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const validationMet = testAnalysis.validationScore >= minimumValidationScore;

  // Final breakpoint
  await ctx.breakpoint({
    question: `Design Sprint complete. Prototype validation score: ${testAnalysis.validationScore}/100. ${validationMet ? 'Concept validated!' : 'Iteration needed.'} Sprint quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'Design Sprint Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        challenge,
        problemStatement: definePhase.problemStatement,
        ideasGenerated: ideatePhase.ideas?.length || 0,
        validationScore: testAnalysis.validationScore,
        validationMet,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    challenge,
    insights: {
      userInsights: empathizePhase.insights,
      keyInsights: empathizePhase.keyInsights,
      painPoints: journeyMapping.painPoints,
      opportunities: journeyMapping.opportunities
    },
    problemStatement: {
      statement: definePhase.problemStatement,
      pointsOfView: definePhase.pointsOfView,
      howMightWe: definePhase.howMightWeQuestions
    },
    ideas: {
      all: ideatePhase.ideas,
      selected: ideaSelection.selectedIdeas,
      selectionCriteria: ideaSelection.criteria
    },
    prototype: {
      concept: prototypePhase.prototype,
      storyboard: storyboarding.storyboard,
      features: prototypePhase.features
    },
    testResults: {
      validationScore: testAnalysis.validationScore,
      validationMet,
      feedback: userTesting.feedback,
      insights: testAnalysis.insights,
      recommendations: testAnalysis.recommendations
    },
    iterationPlan: iterationPlan.plan,
    qualityScore: {
      overall: qualityScore.overallScore,
      empathize: qualityScore.empathizeScore,
      define: qualityScore.defineScore,
      ideate: qualityScore.ideateScore,
      prototype: qualityScore.prototypeScore,
      test: qualityScore.testScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/design-thinking-sprint',
      timestamp: startTime,
      sprintDuration,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const empathizeTask = defineTask('empathize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EMPATHIZE - Understand users',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'User researcher and empathy specialist',
      task: 'Conduct user research to deeply understand user needs, behaviors, and motivations',
      context: args,
      instructions: [
        'Identify user segments and personas',
        'Document user goals and motivations',
        'Identify user pain points and frustrations',
        'Understand user context and environment',
        'Capture user quotes and stories',
        'Identify unstated/latent needs',
        'Document emotional journey aspects',
        'Create empathy maps for each user type',
        'Identify key insights from research',
        'Synthesize findings into actionable insights'
      ],
      outputFormat: 'JSON with insights, personas, painPoints, needs, empathyMaps, keyInsights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'keyInsights', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userType: { type: 'string' },
              insight: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        personas: { type: 'array' },
        painPoints: { type: 'array', items: { type: 'string' } },
        needs: { type: 'array', items: { type: 'string' } },
        empathyMaps: { type: 'array' },
        keyInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'empathize']
}));

export const journeyMappingTask = defineTask('journey-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EMPATHIZE - Map user journeys',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Journey mapping specialist',
      task: 'Create detailed user journey maps showing touchpoints, emotions, and opportunities',
      context: args,
      instructions: [
        'Map end-to-end user journey for each user type',
        'Identify all touchpoints and interactions',
        'Document user emotions at each stage',
        'Identify pain points and friction moments',
        'Identify moments of delight',
        'Find opportunity areas for improvement',
        'Document backstage processes affecting experience',
        'Identify moments of truth',
        'Create visual journey maps',
        'Prioritize opportunity areas'
      ],
      outputFormat: 'JSON with journeyMaps, touchpoints, painPoints, opportunities, momentsOfTruth, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['journeyMaps', 'painPoints', 'opportunities', 'artifacts'],
      properties: {
        journeyMaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userType: { type: 'string' },
              stages: { type: 'array' },
              touchpoints: { type: 'array' },
              emotions: { type: 'array' }
            }
          }
        },
        touchpoints: { type: 'array' },
        painPoints: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        momentsOfTruth: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'journey-mapping']
}));

export const defineTask = defineTask('define', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DEFINE - Frame the problem',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Problem framing specialist',
      task: 'Synthesize insights into a clear problem statement and point of view',
      context: args,
      instructions: [
        'Synthesize user insights into themes',
        'Create Point of View (POV) statements for each user',
        'Format: [User] needs [need] because [insight]',
        'Craft a compelling problem statement',
        'Generate "How Might We" questions',
        'Ensure problem is human-centered',
        'Define scope boundaries',
        'Identify constraints and requirements',
        'Prioritize focus areas',
        'Create design principles/criteria'
      ],
      outputFormat: 'JSON with problemStatement, pointsOfView, howMightWeQuestions, themes, designPrinciples, scope, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'howMightWeQuestions', 'artifacts'],
      properties: {
        problemStatement: { type: 'string' },
        pointsOfView: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              user: { type: 'string' },
              need: { type: 'string' },
              insight: { type: 'string' }
            }
          }
        },
        howMightWeQuestions: { type: 'array', items: { type: 'string' } },
        themes: { type: 'array', items: { type: 'string' } },
        designPrinciples: { type: 'array', items: { type: 'string' } },
        scope: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'define']
}));

export const ideateTask = defineTask('ideate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'IDEATE - Generate ideas',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Ideation facilitator',
      task: 'Generate a wide range of creative solutions using divergent thinking',
      context: args,
      instructions: [
        'Apply brainstorming rules: defer judgment, encourage wild ideas',
        'Use "How Might We" questions as prompts',
        'Generate quantity over quality initially',
        'Build on others ideas (Yes, and...)',
        'Use creative techniques: SCAMPER, reverse brainstorming, analogies',
        'Consider solutions from other industries',
        'Think about extreme users',
        'Generate at least 20+ ideas',
        'Sketch ideas visually where helpful',
        'Categorize ideas by theme'
      ],
      outputFormat: 'JSON with ideas, ideaCategories, wildIdeas, buildOnIdeas, techniques, ideaCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ideas', 'ideaCount', 'artifacts'],
      properties: {
        ideas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              idea: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              technique: { type: 'string' }
            }
          }
        },
        ideaCategories: { type: 'object' },
        wildIdeas: { type: 'array' },
        buildOnIdeas: { type: 'array' },
        techniques: { type: 'array', items: { type: 'string' } },
        ideaCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'ideate']
}));

export const ideaSelectionTask = defineTask('idea-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'IDEATE - Select best ideas',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Idea evaluation specialist',
      task: 'Evaluate and select the most promising ideas using convergent thinking',
      context: args,
      instructions: [
        'Define selection criteria (impact, feasibility, desirability)',
        'Apply dot voting or similar technique',
        'Use impact vs effort matrix',
        'Consider "Now, Wow, How" categorization',
        'Evaluate against design principles',
        'Consider constraints',
        'Select 2-3 ideas for prototyping',
        'Document selection rationale',
        'Combine complementary ideas',
        'Identify quick wins'
      ],
      outputFormat: 'JSON with selectedIdeas, criteria, evaluationMatrix, rankings, combinedIdeas, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedIdeas', 'criteria', 'artifacts'],
      properties: {
        selectedIdeas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              idea: { type: 'string' },
              impactScore: { type: 'number' },
              feasibilityScore: { type: 'number' },
              desirabilityScore: { type: 'number' },
              overallScore: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        criteria: { type: 'array', items: { type: 'string' } },
        evaluationMatrix: { type: 'object' },
        rankings: { type: 'array' },
        combinedIdeas: { type: 'array' },
        quickWins: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'idea-selection']
}));

export const prototypeTask = defineTask('prototype', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PROTOTYPE - Develop concept',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Prototyping specialist',
      task: 'Create a prototype to test the selected concept with users',
      context: args,
      instructions: [
        'Define prototype fidelity level (low/medium/high)',
        'Identify key features to prototype',
        'Focus on testing assumptions',
        'Create "just enough" prototype for learning',
        'Document what the prototype tests',
        'Identify success criteria for testing',
        'Consider different prototype formats (sketch, mockup, roleplay)',
        'Plan for multiple variants if needed',
        'Document prototype limitations',
        'Prepare prototype description'
      ],
      outputFormat: 'JSON with prototype, fidelityLevel, features, assumptions, successCriteria, format, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prototype', 'features', 'artifacts'],
      properties: {
        prototype: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            format: { type: 'string' },
            fidelity: { type: 'string' }
          }
        },
        fidelityLevel: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        format: { type: 'string' },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'prototype']
}));

export const storyboardingTask = defineTask('storyboarding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PROTOTYPE - Create storyboard',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Storyboard creator',
      task: 'Create a storyboard showing how users interact with the prototype',
      context: args,
      instructions: [
        'Create step-by-step narrative',
        'Show user in context',
        'Illustrate key interactions',
        'Highlight emotional moments',
        'Show before and after states',
        'Include supporting elements',
        'Make it testable/discussable',
        'Keep it simple and clear',
        'Number each frame',
        'Add captions explaining actions'
      ],
      outputFormat: 'JSON with storyboard, frames, narrative, keyMoments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['storyboard', 'frames', 'artifacts'],
      properties: {
        storyboard: { type: 'object' },
        frames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frameNumber: { type: 'number' },
              description: { type: 'string' },
              action: { type: 'string' },
              emotion: { type: 'string' }
            }
          }
        },
        narrative: { type: 'string' },
        keyMoments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'storyboarding']
}));

export const testPlanningTask = defineTask('test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TEST - Plan user tests',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'User testing planner',
      task: 'Plan user testing sessions to validate the prototype',
      context: args,
      instructions: [
        'Define test objectives',
        'Identify participants to recruit',
        'Create test protocol/script',
        'Design tasks for users to complete',
        'Prepare interview questions',
        'Define what to observe and measure',
        'Plan test environment',
        'Prepare materials and prototype',
        'Plan for capturing feedback',
        'Create test schedule'
      ],
      outputFormat: 'JSON with testPlan, objectives, participants, protocol, tasks, questions, measurements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testPlan', 'objectives', 'tasks', 'artifacts'],
      properties: {
        testPlan: { type: 'object' },
        objectives: { type: 'array', items: { type: 'string' } },
        participants: { type: 'object' },
        protocol: { type: 'string' },
        tasks: { type: 'array', items: { type: 'string' } },
        questions: { type: 'array', items: { type: 'string' } },
        measurements: { type: 'array', items: { type: 'string' } },
        schedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'test-planning']
}));

export const userTestingTask = defineTask('user-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TEST - Conduct user tests',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'User testing facilitator',
      task: 'Facilitate user testing sessions and capture feedback',
      context: args,
      instructions: [
        'Welcome and set up participant',
        'Explain test purpose (not testing them)',
        'Ask user to think aloud',
        'Present prototype and tasks',
        'Observe without leading',
        'Note behaviors and reactions',
        'Ask follow-up questions',
        'Capture quotes verbatim',
        'Document issues and successes',
        'Thank and debrief participant'
      ],
      outputFormat: 'JSON with testResults, feedback, observations, quotes, issues, successes, participantCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'feedback', 'artifacts'],
      properties: {
        testResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participant: { type: 'string' },
              taskCompletions: { type: 'object' },
              observations: { type: 'array', items: { type: 'string' } },
              feedback: { type: 'string' }
            }
          }
        },
        feedback: { type: 'array', items: { type: 'string' } },
        observations: { type: 'array', items: { type: 'string' } },
        quotes: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        successes: { type: 'array', items: { type: 'string' } },
        participantCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'user-testing']
}));

export const testAnalysisTask = defineTask('test-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TEST - Analyze results',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Test analysis specialist',
      task: 'Analyze test results and determine prototype validation',
      context: args,
      instructions: [
        'Synthesize feedback across participants',
        'Identify patterns in observations',
        'Calculate task success rates',
        'Identify what worked well',
        'Identify what needs improvement',
        'Validate or invalidate assumptions',
        'Calculate validation score',
        'Generate actionable insights',
        'Prioritize issues by severity',
        'Develop recommendations'
      ],
      outputFormat: 'JSON with validationScore, insights, patterns, whatWorked, whatNeedsWork, assumptionValidation, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'insights', 'recommendations', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        insights: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        whatWorked: { type: 'array', items: { type: 'string' } },
        whatNeedsWork: { type: 'array', items: { type: 'string' } },
        assumptionValidation: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        successRates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'test-analysis']
}));

export const iterationPlanTask = defineTask('iteration-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'ITERATE - Plan refinements',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Iteration planning specialist',
      task: 'Create plan for iterating on the prototype based on test results',
      context: args,
      instructions: [
        'Prioritize issues to address',
        'Define changes for next iteration',
        'Plan additional research if needed',
        'Identify pivots if validation failed',
        'Plan next testing round',
        'Define success metrics for next iteration',
        'Create iteration timeline',
        'Assign responsibilities',
        'Plan resource needs',
        'Document learning for future'
      ],
      outputFormat: 'JSON with plan, prioritizedChanges, nextIterationGoals, pivotRecommendations, timeline, responsibilities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'prioritizedChanges', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        prioritizedChanges: { type: 'array', items: { type: 'string' } },
        nextIterationGoals: { type: 'array', items: { type: 'string' } },
        pivotRecommendations: { type: 'array' },
        timeline: { type: 'object' },
        responsibilities: { type: 'object' },
        additionalResearch: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'iteration-plan']
}));

export const sprintQualityScoringTask = defineTask('sprint-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score sprint quality',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'innovation-facilitator',
    skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'],
    prompt: {
      role: 'Design sprint quality auditor',
      task: 'Assess the quality and completeness of the design sprint',
      context: args,
      instructions: [
        'Score empathize phase quality (0-100)',
        'Score define phase quality (0-100)',
        'Score ideate phase quality (0-100)',
        'Score prototype phase quality (0-100)',
        'Score test phase quality (0-100)',
        'Calculate overall quality score',
        'Identify gaps in the process',
        'Recommend improvements',
        'Assess adherence to design thinking principles',
        'Evaluate user-centeredness'
      ],
      outputFormat: 'JSON with overallScore, empathizeScore, defineScore, ideateScore, prototypeScore, testScore, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        empathizeScore: { type: 'number', minimum: 0, maximum: 100 },
        defineScore: { type: 'number', minimum: 0, maximum: 100 },
        ideateScore: { type: 'number', minimum: 0, maximum: 100 },
        prototypeScore: { type: 'number', minimum: 0, maximum: 100 },
        testScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        userCenteredness: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-thinking', 'quality-scoring']
}));
