/**
 * @process product-management/feature-definition-prd
 * @description Complete Feature Definition and PRD Creation process with problem statement analysis, user story generation, acceptance criteria definition, technical specifications, design requirements, success metrics tracking, and stakeholder alignment
 * @inputs { featureName: string, problemStatement: string, targetUsers: array, businessGoals: array, outputDir: string, priorityLevel: string, timeline: object, stakeholders: array }
 * @outputs { success: boolean, prdDocument: string, userStories: array, acceptanceCriteria: array, technicalSpecs: object, successMetrics: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    featureName = '',
    problemStatement = '',
    targetUsers = [],
    businessGoals = [],
    outputDir = 'prd-output',
    priorityLevel = 'medium', // 'critical', 'high', 'medium', 'low'
    timeline = {},
    stakeholders = [],
    competitiveContext = {},
    constraints = [],
    assumptions = [],
    requireApproval = true,
    includeDesignMocks = true,
    includeTechnicalSpecs = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Feature Definition and PRD Creation for: ${featureName}`);
  ctx.log('info', `Priority: ${priorityLevel}, Stakeholders: ${stakeholders.length}`);

  // ============================================================================
  // PHASE 1: PROBLEM STATEMENT VALIDATION AND REFINEMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating and refining problem statement');

  const problemAnalysis = await ctx.task(problemStatementAnalysisTask, {
    featureName,
    problemStatement,
    targetUsers,
    businessGoals,
    competitiveContext,
    outputDir
  });

  artifacts.push(...problemAnalysis.artifacts);

  if (!problemAnalysis.isViable) {
    ctx.log('warn', 'Problem statement validation failed - feature may not be viable');
    return {
      success: false,
      reason: 'Problem statement not viable',
      isViable: false,
      concerns: problemAnalysis.concerns,
      recommendation: problemAnalysis.recommendation,
      artifacts,
      metadata: {
        processId: 'product-management/feature-definition-prd',
        timestamp: startTime,
        duration: ctx.now() - startTime
      }
    };
  }

  const refinedProblem = problemAnalysis.refinedProblemStatement;
  ctx.log('info', `Problem validated. Impact score: ${problemAnalysis.impactScore}/100`);

  // ============================================================================
  // PHASE 2: USER RESEARCH AND PERSONA ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting user research and persona analysis');

  const userResearch = await ctx.task(userResearchAnalysisTask, {
    featureName,
    problemStatement: refinedProblem,
    targetUsers,
    problemAnalysis,
    outputDir
  });

  artifacts.push(...userResearch.artifacts);

  // ============================================================================
  // PHASE 3: USER STORY GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating comprehensive user stories');

  const userStoriesGeneration = await ctx.task(userStoryGenerationTask, {
    featureName,
    problemStatement: refinedProblem,
    personas: userResearch.personas,
    userNeeds: userResearch.userNeeds,
    userJourneys: userResearch.userJourneys,
    outputDir
  });

  artifacts.push(...userStoriesGeneration.artifacts);

  const userStories = userStoriesGeneration.userStories;
  ctx.log('info', `Generated ${userStories.length} user stories`);

  // ============================================================================
  // PHASE 4: ACCEPTANCE CRITERIA DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining acceptance criteria for user stories');

  const acceptanceCriteriaDefinition = await ctx.task(acceptanceCriteriaDefinitionTask, {
    featureName,
    userStories,
    problemStatement: refinedProblem,
    constraints,
    outputDir
  });

  artifacts.push(...acceptanceCriteriaDefinition.artifacts);

  const acceptanceCriteria = acceptanceCriteriaDefinition.acceptanceCriteria;
  ctx.log('info', `Defined acceptance criteria for ${acceptanceCriteria.length} stories`);

  // Breakpoint: Review user stories and acceptance criteria
  await ctx.breakpoint({
    question: `Generated ${userStories.length} user stories with acceptance criteria. Review before proceeding to technical specifications?`,
    title: 'User Stories Review',
    context: {
      runId: ctx.runId,
      featureName,
      userStoriesCount: userStories.length,
      epicsCount: userStoriesGeneration.epics.length,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        problemStatement: refinedProblem,
        impactScore: problemAnalysis.impactScore,
        personasCount: userResearch.personas.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: TECHNICAL SPECIFICATIONS (IF ENABLED)
  // ============================================================================

  let technicalSpecs = null;
  if (includeTechnicalSpecs) {
    ctx.log('info', 'Phase 5: Creating technical specifications');

    technicalSpecs = await ctx.task(technicalSpecificationsTask, {
      featureName,
      problemStatement: refinedProblem,
      userStories,
      acceptanceCriteria,
      constraints,
      assumptions,
      outputDir
    });

    artifacts.push(...technicalSpecs.artifacts);
  }

  // ============================================================================
  // PHASE 6: DESIGN REQUIREMENTS AND MOCKS (IF ENABLED)
  // ============================================================================

  let designRequirements = null;
  if (includeDesignMocks) {
    ctx.log('info', 'Phase 6: Defining design requirements and mockup specifications');

    designRequirements = await ctx.task(designRequirementsTask, {
      featureName,
      problemStatement: refinedProblem,
      userStories,
      personas: userResearch.personas,
      userJourneys: userResearch.userJourneys,
      outputDir
    });

    artifacts.push(...designRequirements.artifacts);
  }

  // ============================================================================
  // PHASE 7: SUCCESS METRICS AND KPI DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining success metrics and KPIs');

  const successMetricsDefinition = await ctx.task(successMetricsDefinitionTask, {
    featureName,
    problemStatement: refinedProblem,
    businessGoals,
    userStories,
    problemAnalysis,
    outputDir
  });

  artifacts.push(...successMetricsDefinition.artifacts);

  const successMetrics = successMetricsDefinition.metrics;
  ctx.log('info', `Defined ${successMetrics.length} success metrics with baselines and targets`);

  // ============================================================================
  // PHASE 8: COMPETITIVE ANALYSIS AND MARKET RESEARCH
  // ============================================================================

  ctx.log('info', 'Phase 8: Conducting competitive analysis');

  const competitiveAnalysis = await ctx.task(competitiveAnalysisTask, {
    featureName,
    problemStatement: refinedProblem,
    competitiveContext,
    targetUsers,
    outputDir
  });

  artifacts.push(...competitiveAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: RISK ASSESSMENT AND MITIGATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing risks and defining mitigation strategies');

  const riskAssessment = await ctx.task(riskAssessmentTask, {
    featureName,
    problemStatement: refinedProblem,
    userStories,
    technicalSpecs,
    constraints,
    assumptions,
    timeline,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // ============================================================================
  // PHASE 10: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating implementation roadmap and phasing');

  const roadmap = await ctx.task(implementationRoadmapTask, {
    featureName,
    userStories,
    acceptanceCriteria,
    technicalSpecs,
    timeline,
    priorityLevel,
    riskAssessment,
    outputDir
  });

  artifacts.push(...roadmap.artifacts);

  // ============================================================================
  // PHASE 11: PRD DOCUMENT ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 11: Assembling comprehensive PRD document');

  const prdAssembly = await ctx.task(prdDocumentAssemblyTask, {
    featureName,
    problemStatement: refinedProblem,
    problemAnalysis,
    userResearch,
    userStories,
    acceptanceCriteria,
    technicalSpecs,
    designRequirements,
    successMetrics: successMetricsDefinition,
    competitiveAnalysis,
    riskAssessment,
    roadmap,
    stakeholders,
    priorityLevel,
    timeline,
    constraints,
    assumptions,
    outputDir
  });

  artifacts.push(...prdAssembly.artifacts);

  // ============================================================================
  // PHASE 12: PRD QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Validating PRD quality and completeness');

  const qualityValidation = await ctx.task(prdQualityValidationTask, {
    featureName,
    prdDocument: prdAssembly.prdDocument,
    userStories,
    acceptanceCriteria,
    successMetrics,
    technicalSpecs,
    designRequirements,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 80;

  // Breakpoint: Review PRD quality
  await ctx.breakpoint({
    question: `PRD quality score: ${qualityScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Quality may need improvement.'} Review PRD?`,
    title: 'PRD Quality Review',
    context: {
      runId: ctx.runId,
      featureName,
      qualityScore,
      qualityMet,
      componentScores: qualityValidation.componentScores,
      gaps: qualityValidation.gaps,
      recommendations: qualityValidation.recommendations,
      files: [{
        path: prdAssembly.prdPath,
        format: 'markdown',
        label: 'Product Requirements Document'
      }, {
        path: qualityValidation.reportPath,
        format: 'markdown',
        label: 'Quality Report'
      }]
    }
  });

  // ============================================================================
  // PHASE 13: STAKEHOLDER REVIEW AND APPROVAL (IF ENABLED)
  // ============================================================================

  let stakeholderReview = null;
  let finalPrd = prdAssembly;

  if (requireApproval) {
    ctx.log('info', 'Phase 13: Conducting stakeholder review and approval');

    stakeholderReview = await ctx.task(stakeholderReviewTask, {
      featureName,
      prdDocument: prdAssembly.prdDocument,
      prdPath: prdAssembly.prdPath,
      stakeholders,
      qualityValidation,
      outputDir
    });

    artifacts.push(...stakeholderReview.artifacts);

    // Breakpoint: Approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${stakeholderReview.approved ? 'PRD approved!' : 'Revisions needed.'} Proceed?`,
      title: 'PRD Approval Gate',
      context: {
        runId: ctx.runId,
        featureName,
        approved: stakeholderReview.approved,
        reviewersCount: stakeholderReview.reviewers.length,
        feedbackItems: stakeholderReview.feedback.length,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          label: a.label || undefined
        }))
      }
    });

    // If revisions needed, incorporate feedback
    if (stakeholderReview.revisionsNeeded) {
      ctx.log('info', 'Incorporating stakeholder feedback');

      const revision = await ctx.task(prdRevisionTask, {
        featureName,
        prdDocument: prdAssembly.prdDocument,
        prdPath: prdAssembly.prdPath,
        feedback: stakeholderReview.feedback,
        outputDir
      });

      finalPrd = revision;
      artifacts.push(...revision.artifacts);
    }
  }

  // ============================================================================
  // PHASE 14: PRD PUBLISHING AND DISTRIBUTION
  // ============================================================================

  ctx.log('info', 'Phase 14: Publishing PRD and distributing to stakeholders');

  const publishing = await ctx.task(prdPublishingTask, {
    featureName,
    prdDocument: finalPrd.prdDocument,
    prdPath: finalPrd.prdPath,
    stakeholders,
    artifacts,
    outputDir
  });

  artifacts.push(...publishing.artifacts);

  // ============================================================================
  // PHASE 15: SUPPORTING ARTIFACTS GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating supporting artifacts and documentation');

  const supportingArtifacts = await ctx.task(supportingArtifactsTask, {
    featureName,
    problemStatement: refinedProblem,
    userStories,
    successMetrics,
    roadmap,
    outputDir
  });

  artifacts.push(...supportingArtifacts.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    featureName,
    prdDocument: publishing.publishedPath,
    problemStatement: refinedProblem,
    impactScore: problemAnalysis.impactScore,
    userStories: {
      total: userStories.length,
      byPriority: {
        mustHave: userStories.filter(s => s.priority === 'must-have').length,
        shouldHave: userStories.filter(s => s.priority === 'should-have').length,
        couldHave: userStories.filter(s => s.priority === 'could-have').length
      },
      epics: userStoriesGeneration.epics
    },
    acceptanceCriteria: {
      total: acceptanceCriteria.length,
      totalCriteria: acceptanceCriteria.reduce((sum, ac) => sum + ac.criteria.length, 0),
      testable: acceptanceCriteria.filter(ac => ac.testable).length
    },
    technicalSpecs: technicalSpecs ? {
      components: technicalSpecs.components.length,
      integrations: technicalSpecs.integrations.length,
      dataModels: technicalSpecs.dataModels.length,
      apis: technicalSpecs.apis.length
    } : null,
    designRequirements: designRequirements ? {
      screens: designRequirements.screens.length,
      components: designRequirements.components.length,
      interactions: designRequirements.interactions.length
    } : null,
    successMetrics: {
      total: successMetrics.length,
      categories: successMetricsDefinition.categories,
      hasBaselines: successMetrics.filter(m => m.baseline).length,
      hasTargets: successMetrics.filter(m => m.target).length
    },
    competitiveAnalysis: {
      competitorsAnalyzed: competitiveAnalysis.competitors.length,
      competitiveAdvantages: competitiveAnalysis.advantages.length,
      gaps: competitiveAnalysis.gaps.length
    },
    riskAssessment: {
      totalRisks: riskAssessment.risks.length,
      highSeverity: riskAssessment.risks.filter(r => r.severity === 'high').length,
      mitigationPlans: riskAssessment.mitigationPlans.length
    },
    roadmap: {
      phases: roadmap.phases.length,
      totalStoryPoints: roadmap.totalStoryPoints,
      estimatedDuration: roadmap.estimatedDuration,
      milestones: roadmap.milestones.length
    },
    quality: {
      overallScore: qualityScore,
      componentScores: qualityValidation.componentScores,
      completeness: qualityValidation.completeness,
      meetsStandards: qualityMet
    },
    approval: stakeholderReview ? {
      approved: stakeholderReview.approved,
      reviewers: stakeholderReview.reviewers.length,
      feedbackItems: stakeholderReview.feedback.length
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/feature-definition-prd',
      timestamp: startTime,
      outputDir,
      priorityLevel,
      approvalRequired: requireApproval,
      approved: stakeholderReview ? stakeholderReview.approved : true
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Problem Statement Analysis
export const problemStatementAnalysisTask = defineTask('problem-statement-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and validate problem statement',
  agent: {
    name: 'product-strategist',
    prompt: {
      role: 'senior product manager and strategic analyst',
      task: 'Validate problem statement, assess feature viability, and refine problem definition',
      context: args,
      instructions: [
        'Evaluate problem statement clarity and specificity',
        'Validate that problem statement answers:',
        '  - WHO has the problem? (target users)',
        '  - WHAT is the problem? (specific pain points)',
        '  - WHY does it matter? (impact and importance)',
        '  - WHEN does it occur? (context and triggers)',
        '  - WHERE does it occur? (touchpoints, platforms)',
        'Assess problem-solution fit:',
        '  - Is the problem real and validated?',
        '  - Is the problem significant enough to solve?',
        '  - Does the proposed feature address the core problem?',
        '  - Are there existing workarounds?',
        'Evaluate business value and alignment:',
        '  - Alignment with business goals',
        '  - Market opportunity size',
        '  - Revenue potential or cost savings',
        '  - Strategic importance',
        'Assess user impact and reach:',
        '  - Number of users affected',
        '  - Frequency of occurrence',
        '  - Severity of pain point',
        '  - User segment priority',
        'Analyze competitive context:',
        '  - How do competitors solve this?',
        '  - What is our differentiation opportunity?',
        '  - Market gaps and opportunities',
        'Calculate impact score (0-100) based on:',
        '  - Business value (30%)',
        '  - User impact (30%)',
        '  - Strategic alignment (20%)',
        '  - Market opportunity (20%)',
        'Determine viability (isViable: true/false)',
        'If not viable, explain concerns and provide recommendations',
        'If viable, refine problem statement for clarity',
        'Identify key assumptions that need validation',
        'Save problem analysis document to output directory'
      ],
      outputFormat: 'JSON with isViable (boolean), refinedProblemStatement (string), impactScore (number 0-100), businessValue (object), userImpact (object), concerns (array), recommendation (string), keyAssumptions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isViable', 'impactScore', 'artifacts'],
      properties: {
        isViable: { type: 'boolean' },
        refinedProblemStatement: { type: 'string' },
        impactScore: { type: 'number', minimum: 0, maximum: 100 },
        businessValue: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            revenueOpportunity: { type: 'string' },
            costSavings: { type: 'string' },
            strategicAlignment: { type: 'string' },
            marketOpportunity: { type: 'string' }
          }
        },
        userImpact: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            usersAffected: { type: 'string' },
            frequency: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
          }
        },
        concerns: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'string' },
        keyAssumptions: { type: 'array', items: { type: 'string' } },
        competitiveInsights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prd', 'problem-analysis', 'product-management']
}));

// Task 2: User Research Analysis
export const userResearchAnalysisTask = defineTask('user-research-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct user research and persona analysis',
  agent: {
    name: 'user-research-specialist',
    prompt: {
      role: 'user researcher and UX strategist',
      task: 'Conduct user research, create personas, map user journeys, and identify user needs',
      context: args,
      instructions: [
        'Analyze target users and create detailed personas:',
        '  - Demographics and psychographics',
        '  - Goals and motivations',
        '  - Pain points and frustrations',
        '  - Current behaviors and workflows',
        '  - Technology proficiency',
        '  - Context of use',
        'Create 2-4 primary personas representing key user segments',
        'For each persona, document:',
        '  - Name and role',
        '  - Background and context',
        '  - Goals related to this feature',
        '  - Pain points this feature addresses',
        '  - Quote capturing their perspective',
        'Identify user needs using Jobs-to-be-Done framework:',
        '  - Functional jobs (tasks users want to accomplish)',
        '  - Emotional jobs (feelings users want to experience)',
        '  - Social jobs (how users want to be perceived)',
        'Map current-state user journey:',
        '  - Steps users take to solve problem today',
        '  - Pain points at each step',
        '  - Opportunities for improvement',
        'Map future-state user journey with proposed feature:',
        '  - How feature changes the journey',
        '  - Improved touchpoints',
        '  - Expected emotional response',
        'Identify user research gaps and validation needs',
        'Recommend user research methods (interviews, surveys, usability testing)',
        'Save personas, user journeys, and research findings to output directory'
      ],
      outputFormat: 'JSON with personas (array), userNeeds (array), userJourneys (object with currentState and futureState), researchGaps (array), researchRecommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'userNeeds', 'userJourneys', 'artifacts'],
      properties: {
        personas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              background: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              behaviors: { type: 'array', items: { type: 'string' } },
              quote: { type: 'string' },
              techProficiency: { type: 'string' }
            }
          }
        },
        userNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              type: { type: 'string', enum: ['functional', 'emotional', 'social'] },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              personas: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        userJourneys: {
          type: 'object',
          properties: {
            currentState: {
              type: 'object',
              properties: {
                steps: { type: 'array', items: { type: 'object' } },
                painPoints: { type: 'array', items: { type: 'string' } },
                opportunities: { type: 'array', items: { type: 'string' } }
              }
            },
            futureState: {
              type: 'object',
              properties: {
                steps: { type: 'array', items: { type: 'object' } },
                improvements: { type: 'array', items: { type: 'string' } },
                expectedOutcomes: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        researchGaps: { type: 'array', items: { type: 'string' } },
        researchRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              objective: { type: 'string' },
              participants: { type: 'string' },
              timeline: { type: 'string' }
            }
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
  labels: ['agent', 'prd', 'user-research', 'product-management']
}));

// Task 3: User Story Generation
export const userStoryGenerationTask = defineTask('user-story-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive user stories',
  agent: {
    name: 'product-analyst',
    prompt: {
      role: 'product manager and agile practitioner',
      task: 'Generate comprehensive user stories organized into epics with clear value propositions',
      context: args,
      instructions: [
        'Create user stories using format: "As a [persona], I want to [action] so that [benefit]"',
        'Organize user stories into logical epics (themes/feature areas)',
        'For each user story, define:',
        '  - Story title',
        '  - Complete user story statement',
        '  - Persona (which user type)',
        '  - Epic/theme',
        '  - Priority (must-have, should-have, could-have, wont-have using MoSCoW)',
        '  - Story points estimate (1, 2, 3, 5, 8, 13)',
        '  - Dependencies (other stories this depends on)',
        '  - Value proposition (why this matters)',
        'Ensure stories follow INVEST criteria:',
        '  - Independent (minimally dependent on other stories)',
        '  - Negotiable (details can be discussed)',
        '  - Valuable (delivers value to users)',
        '  - Estimable (can be estimated)',
        '  - Small (can be completed in a sprint)',
        '  - Testable (clear acceptance criteria possible)',
        'Create comprehensive coverage:',
        '  - Happy path scenarios',
        '  - Edge cases and error handling',
        '  - Performance requirements',
        '  - Accessibility requirements',
        '  - Security requirements',
        '  - Analytics and monitoring',
        'Include technical enabler stories if needed:',
        '  - Infrastructure setup',
        '  - Technical debt reduction',
        '  - Performance optimization',
        'Group stories by MVP (Minimum Viable Product) vs. post-MVP',
        'Aim for 15-30 user stories covering complete feature scope',
        'Save user stories and epic mapping to output directory'
      ],
      outputFormat: 'JSON with userStories (array), epics (array), mvpStories (array), postMvpStories (array), totalStoryPoints (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['userStories', 'epics', 'mvpStories', 'artifacts'],
      properties: {
        userStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              story: { type: 'string' },
              persona: { type: 'string' },
              epic: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'could-have', 'wont-have'] },
              storyPoints: { type: 'number' },
              dependencies: { type: 'array', items: { type: 'string' } },
              valueProposition: { type: 'string' },
              investCriteria: {
                type: 'object',
                properties: {
                  independent: { type: 'boolean' },
                  negotiable: { type: 'boolean' },
                  valuable: { type: 'boolean' },
                  estimable: { type: 'boolean' },
                  small: { type: 'boolean' },
                  testable: { type: 'boolean' }
                }
              }
            }
          }
        },
        epics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              storyCount: { type: 'number' },
              totalStoryPoints: { type: 'number' }
            }
          }
        },
        mvpStories: { type: 'array', items: { type: 'string' } },
        postMvpStories: { type: 'array', items: { type: 'string' } },
        totalStoryPoints: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prd', 'user-stories', 'product-management']
}));

// Task 4: Acceptance Criteria Definition
export const acceptanceCriteriaDefinitionTask = defineTask('acceptance-criteria-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define acceptance criteria for user stories',
  agent: {
    name: 'qa-product-analyst',
    prompt: {
      role: 'product manager with QA expertise',
      task: 'Define clear, testable acceptance criteria for each user story using Given-When-Then format',
      context: args,
      instructions: [
        'For each user story, define acceptance criteria using Given-When-Then (Gherkin) format:',
        '  - Given [context/precondition]',
        '  - When [action/event]',
        '  - Then [expected outcome]',
        'Include multiple scenarios per story:',
        '  - Happy path (expected successful flow)',
        '  - Alternative paths (valid variations)',
        '  - Edge cases (boundary conditions)',
        '  - Error cases (failure scenarios)',
        'Ensure criteria are SMART:',
        '  - Specific (clear and unambiguous)',
        '  - Measurable (can verify completion)',
        '  - Achievable (realistic and feasible)',
        '  - Relevant (related to story value)',
        '  - Testable (can write tests)',
        'Include non-functional acceptance criteria:',
        '  - Performance (response time, throughput)',
        '  - Accessibility (WCAG compliance level)',
        '  - Security (authentication, authorization)',
        '  - Usability (ease of use, error prevention)',
        '  - Compatibility (browsers, devices, screen sizes)',
        'Define Definition of Done (DoD) checklist:',
        '  - Code complete and reviewed',
        '  - Unit tests written and passing',
        '  - Integration tests passing',
        '  - Documentation updated',
        '  - Accessibility tested',
        '  - Performance benchmarks met',
        '  - Security review completed',
        '  - Deployed to staging environment',
        'Mark criteria as testable (manual or automated)',
        'Identify test data requirements',
        'Save acceptance criteria document to output directory'
      ],
      outputFormat: 'JSON with acceptanceCriteria (array with storyId, criteria array), definitionOfDone (array), testDataRequirements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['acceptanceCriteria', 'definitionOfDone', 'artifacts'],
      properties: {
        acceptanceCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              storyTitle: { type: 'string' },
              criteria: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenario: { type: 'string' },
                    given: { type: 'string' },
                    when: { type: 'string' },
                    then: { type: 'string' },
                    type: { type: 'string', enum: ['happy-path', 'alternative', 'edge-case', 'error-case'] },
                    testable: { type: 'boolean' },
                    automatable: { type: 'boolean' }
                  }
                }
              },
              nonFunctionalCriteria: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    aspect: { type: 'string' },
                    requirement: { type: 'string' },
                    metric: { type: 'string' }
                  }
                }
              },
              testable: { type: 'boolean' }
            }
          }
        },
        definitionOfDone: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              required: { type: 'boolean' },
              category: { type: 'string' }
            }
          }
        },
        testDataRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              dataType: { type: 'string' },
              description: { type: 'string' },
              sampleData: { type: 'string' }
            }
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
  labels: ['agent', 'prd', 'acceptance-criteria', 'product-management']
}));

// Task 5: Technical Specifications
export const technicalSpecificationsTask = defineTask('technical-specifications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create technical specifications and architecture design',
  agent: {
    name: 'technical-architect',
    prompt: {
      role: 'technical architect and engineering lead',
      task: 'Define technical specifications, architecture, and implementation details',
      context: args,
      instructions: [
        'Define system architecture and components:',
        '  - Frontend components and screens',
        '  - Backend services and APIs',
        '  - Database schema and data models',
        '  - Third-party integrations',
        '  - Infrastructure requirements',
        'For each component, document:',
        '  - Component name and purpose',
        '  - Responsibilities and behavior',
        '  - Dependencies',
        '  - Technology stack',
        '  - Interfaces and contracts',
        'Define API specifications:',
        '  - Endpoints (method, path, parameters)',
        '  - Request/response schemas',
        '  - Authentication and authorization',
        '  - Error handling',
        '  - Rate limiting',
        'Define data models:',
        '  - Entities and relationships',
        '  - Fields and data types',
        '  - Validation rules',
        '  - Indexes and constraints',
        '  - Migration strategy',
        'Define integration points:',
        '  - External services and APIs',
        '  - Authentication mechanisms',
        '  - Data synchronization',
        '  - Error handling and retries',
        'Document technical constraints:',
        '  - Technology stack restrictions',
        '  - Platform limitations',
        '  - Performance requirements',
        '  - Security requirements',
        '  - Compliance requirements',
        'Identify technical risks and mitigation:',
        '  - Scalability concerns',
        '  - Performance bottlenecks',
        '  - Security vulnerabilities',
        '  - Integration challenges',
        'Define development milestones and dependencies',
        'Create technical architecture diagrams (describe in text)',
        'Save technical specifications document to output directory'
      ],
      outputFormat: 'JSON with components (array), apis (array), dataModels (array), integrations (array), infrastructure (object), technicalRisks (array), architectureDiagrams (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'apis', 'dataModels', 'artifacts'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['frontend', 'backend', 'database', 'infrastructure'] },
              purpose: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              technology: { type: 'string' }
            }
          }
        },
        apis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              purpose: { type: 'string' },
              requestSchema: { type: 'object' },
              responseSchema: { type: 'object' },
              authentication: { type: 'string' }
            }
          }
        },
        dataModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              entity: { type: 'string' },
              description: { type: 'string' },
              fields: { type: 'array', items: { type: 'object' } },
              relationships: { type: 'array', items: { type: 'object' } },
              indexes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        integrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              purpose: { type: 'string' },
              authentication: { type: 'string' },
              endpoints: { type: 'array', items: { type: 'string' } },
              errorHandling: { type: 'string' }
            }
          }
        },
        infrastructure: {
          type: 'object',
          properties: {
            hosting: { type: 'string' },
            scaling: { type: 'string' },
            monitoring: { type: 'string' },
            logging: { type: 'string' },
            backup: { type: 'string' }
          }
        },
        technicalRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigation: { type: 'string' }
            }
          }
        },
        architectureDiagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' }
            }
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
  labels: ['agent', 'prd', 'technical-specs', 'product-management']
}));

// Task 6: Design Requirements
export const designRequirementsTask = defineTask('design-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define design requirements and mockup specifications',
  agent: {
    name: 'ux-design-lead',
    prompt: {
      role: 'UX designer and product designer',
      task: 'Define design requirements, screen specifications, and mockup guidelines',
      context: args,
      instructions: [
        'Define design requirements for each user story',
        'List all screens/views needed:',
        '  - Screen name and purpose',
        '  - User flow and navigation',
        '  - Content requirements',
        '  - Interactive elements',
        '  - States (empty, loading, error, success)',
        'Define UI components needed:',
        '  - Component name and type',
        '  - Visual design specs',
        '  - Interaction behavior',
        '  - Responsive behavior',
        '  - Accessibility requirements',
        'Define interaction patterns:',
        '  - User actions and triggers',
        '  - System responses',
        '  - Feedback mechanisms',
        '  - Animations and transitions',
        '  - Error handling and validation',
        'Define information architecture:',
        '  - Content hierarchy',
        '  - Navigation structure',
        '  - Labeling and terminology',
        '  - Search and filtering',
        'Specify visual design requirements:',
        '  - Design system components to use',
        '  - Typography specifications',
        '  - Color palette usage',
        '  - Iconography',
        '  - Spacing and layout',
        'Define responsive design requirements:',
        '  - Breakpoints (mobile, tablet, desktop)',
        '  - Layout adaptations',
        '  - Priority content for smaller screens',
        '  - Touch targets and mobile interactions',
        'Define accessibility requirements:',
        '  - WCAG compliance level (A, AA, AAA)',
        '  - Screen reader support',
        '  - Keyboard navigation',
        '  - Color contrast ratios',
        '  - Focus indicators',
        'Create mockup specifications:',
        '  - Required fidelity (low, medium, high)',
        '  - Key screens to mock up',
        '  - Interaction flows to demonstrate',
        '  - Design review checkpoints',
        'Define design validation and testing:',
        '  - Usability testing plan',
        '  - Design QA checklist',
        '  - Accessibility testing',
        'Save design requirements document to output directory'
      ],
      outputFormat: 'JSON with screens (array), components (array), interactions (array), visualDesign (object), responsiveSpecs (object), accessibilitySpecs (object), mockupSpecs (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['screens', 'components', 'interactions', 'artifacts'],
      properties: {
        screens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              userStories: { type: 'array', items: { type: 'string' } },
              content: { type: 'array', items: { type: 'string' } },
              navigation: { type: 'string' },
              states: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              behavior: { type: 'string' },
              states: { type: 'array', items: { type: 'string' } },
              accessibility: { type: 'string' }
            }
          }
        },
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              trigger: { type: 'string' },
              response: { type: 'string' },
              feedback: { type: 'string' }
            }
          }
        },
        visualDesign: {
          type: 'object',
          properties: {
            designSystem: { type: 'string' },
            typography: { type: 'object' },
            colorPalette: { type: 'object' },
            iconography: { type: 'string' },
            spacing: { type: 'object' }
          }
        },
        responsiveSpecs: {
          type: 'object',
          properties: {
            breakpoints: { type: 'array', items: { type: 'object' } },
            adaptations: { type: 'array', items: { type: 'string' } },
            priorityContent: { type: 'array', items: { type: 'string' } }
          }
        },
        accessibilitySpecs: {
          type: 'object',
          properties: {
            wcagLevel: { type: 'string', enum: ['A', 'AA', 'AAA'] },
            screenReaderSupport: { type: 'boolean' },
            keyboardNavigation: { type: 'boolean' },
            colorContrast: { type: 'string' },
            requirements: { type: 'array', items: { type: 'string' } }
          }
        },
        mockupSpecs: {
          type: 'object',
          properties: {
            fidelity: { type: 'string', enum: ['low', 'medium', 'high'] },
            keyScreens: { type: 'array', items: { type: 'string' } },
            flows: { type: 'array', items: { type: 'string' } },
            reviewCheckpoints: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'prd', 'design-requirements', 'product-management']
}));

// Task 7: Success Metrics Definition
export const successMetricsDefinitionTask = defineTask('success-metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success metrics and KPIs',
  agent: {
    name: 'product-analyst',
    prompt: {
      role: 'product manager and data analyst',
      task: 'Define comprehensive success metrics, KPIs, and measurement strategy',
      context: args,
      instructions: [
        'Define success metrics using AARRR (Pirate Metrics) framework:',
        '  - Acquisition: How users discover the feature',
        '  - Activation: First successful use experience',
        '  - Retention: Users returning to use feature',
        '  - Revenue: Business value generated',
        '  - Referral: Users recommending feature',
        'For each metric, define:',
        '  - Metric name',
        '  - Description and calculation method',
        '  - Category (acquisition, activation, engagement, retention, revenue, satisfaction)',
        '  - Baseline (current state before feature)',
        '  - Target (goal after feature launch)',
        '  - Tracking method (analytics tool, query)',
        '  - Frequency (daily, weekly, monthly)',
        '  - Owner (who monitors this metric)',
        'Include both leading and lagging indicators:',
        '  - Leading: Predict future success (e.g., early adoption rate)',
        '  - Lagging: Measure outcomes (e.g., revenue impact)',
        'Define business metrics:',
        '  - Revenue impact',
        '  - Cost savings',
        '  - Conversion rate improvements',
        '  - Customer lifetime value',
        '  - Market share',
        'Define user engagement metrics:',
        '  - Feature adoption rate',
        '  - Daily/Weekly/Monthly active users',
        '  - Session duration',
        '  - Feature usage frequency',
        '  - Task completion rate',
        'Define quality metrics:',
        '  - Error rates',
        '  - Performance (load time, response time)',
        '  - Availability/uptime',
        '  - Customer satisfaction (NPS, CSAT)',
        '  - Support ticket volume',
        'Define OKRs (Objectives and Key Results):',
        '  - Objective: Qualitative ambitious goal',
        '  - Key Results: Quantitative measurable outcomes',
        '  - Timeline and milestones',
        'Create measurement plan:',
        '  - Data collection requirements',
        '  - Analytics instrumentation',
        '  - Dashboard requirements',
        '  - Reporting cadence',
        'Define success criteria and launch thresholds',
        'Identify risks to achieving targets',
        'Save metrics definition document to output directory'
      ],
      outputFormat: 'JSON with metrics (array), okrs (array), categories (object), measurementPlan (object), successCriteria (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'okrs', 'categories', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['acquisition', 'activation', 'engagement', 'retention', 'revenue', 'satisfaction', 'quality'] },
              baseline: { type: 'string' },
              target: { type: 'string' },
              calculation: { type: 'string' },
              trackingMethod: { type: 'string' },
              frequency: { type: 'string' },
              owner: { type: 'string' },
              type: { type: 'string', enum: ['leading', 'lagging'] }
            }
          }
        },
        okrs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              keyResults: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    result: { type: 'string' },
                    baseline: { type: 'string' },
                    target: { type: 'string' },
                    metrics: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              timeline: { type: 'string' }
            }
          }
        },
        categories: {
          type: 'object',
          properties: {
            acquisition: { type: 'number' },
            activation: { type: 'number' },
            engagement: { type: 'number' },
            retention: { type: 'number' },
            revenue: { type: 'number' },
            satisfaction: { type: 'number' },
            quality: { type: 'number' }
          }
        },
        measurementPlan: {
          type: 'object',
          properties: {
            dataCollection: { type: 'array', items: { type: 'string' } },
            instrumentation: { type: 'array', items: { type: 'string' } },
            dashboards: { type: 'array', items: { type: 'string' } },
            reportingCadence: { type: 'string' }
          }
        },
        successCriteria: {
          type: 'object',
          properties: {
            launchThresholds: { type: 'array', items: { type: 'string' } },
            successDefinition: { type: 'string' },
            rollbackTriggers: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'prd', 'success-metrics', 'product-management']
}));

// Task 8: Competitive Analysis
export const competitiveAnalysisTask = defineTask('competitive-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct competitive analysis and market research',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'competitive intelligence analyst and market researcher',
      task: 'Analyze competitors, identify market opportunities, and define differentiation strategy',
      context: args,
      instructions: [
        'Identify direct and indirect competitors offering similar solutions',
        'For each major competitor, analyze:',
        '  - Product/feature overview',
        '  - Key capabilities and strengths',
        '  - Weaknesses and gaps',
        '  - User experience quality',
        '  - Pricing model',
        '  - Target market and positioning',
        '  - Market share and adoption',
        'Conduct feature comparison matrix:',
        '  - List key features across competitors',
        '  - Rate each competitor on each feature',
        '  - Identify feature gaps and opportunities',
        'Analyze competitive advantages:',
        '  - What do we do better?',
        '  - What unique value do we offer?',
        '  - What is our differentiation?',
        'Identify competitive gaps and risks:',
        '  - Where do competitors excel?',
        '  - What features are we missing?',
        '  - What threats exist?',
        'Analyze market trends and opportunities:',
        '  - Industry trends',
        '  - User expectations evolving',
        '  - Technology trends',
        '  - Regulatory changes',
        'Define differentiation strategy:',
        '  - How this feature differentiates us',
        '  - Unique selling propositions',
        '  - Competitive positioning',
        'Identify lessons learned from competitors:',
        '  - Best practices to adopt',
        '  - Mistakes to avoid',
        '  - Innovation opportunities',
        'Save competitive analysis document to output directory'
      ],
      outputFormat: 'JSON with competitors (array), featureMatrix (object), advantages (array), gaps (array), marketTrends (array), differentiation (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'advantages', 'gaps', 'differentiation', 'artifacts'],
      properties: {
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['direct', 'indirect'] },
              overview: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              pricing: { type: 'string' },
              marketShare: { type: 'string' }
            }
          }
        },
        featureMatrix: {
          type: 'object',
          properties: {
            features: { type: 'array', items: { type: 'string' } },
            comparison: { type: 'object' }
          }
        },
        advantages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              advantage: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              competitor: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
              recommendation: { type: 'string' }
            }
          }
        },
        marketTrends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trend: { type: 'string' },
              impact: { type: 'string' },
              opportunity: { type: 'string' }
            }
          }
        },
        differentiation: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            uniqueSellingPropositions: { type: 'array', items: { type: 'string' } },
            positioning: { type: 'string' },
            messagingPoints: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'prd', 'competitive-analysis', 'product-management']
}));

// Task 9: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess risks and define mitigation strategies',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'product risk manager and project manager',
      task: 'Identify and assess risks, define mitigation strategies, and create contingency plans',
      context: args,
      instructions: [
        'Identify risks across categories:',
        '  - Technical risks (complexity, scalability, dependencies)',
        '  - User adoption risks (change management, usability)',
        '  - Business risks (market timing, competition, resources)',
        '  - Timeline risks (estimates, dependencies, scope creep)',
        '  - Quality risks (bugs, performance, security)',
        '  - Organizational risks (stakeholder alignment, team capacity)',
        'For each risk, assess:',
        '  - Risk description',
        '  - Category',
        '  - Likelihood (low, medium, high)',
        '  - Impact (low, medium, high)',
        '  - Risk score (likelihood × impact)',
        '  - Consequences if risk materializes',
        '  - Early warning indicators',
        'Define mitigation strategies for each risk:',
        '  - Preventive actions (reduce likelihood)',
        '  - Contingency plans (reduce impact)',
        '  - Owner and timeline',
        '  - Resources required',
        'Create risk matrix visualization (high-level)',
        'Prioritize risks by score',
        'Define risk monitoring and review cadence',
        'Create contingency budget and timeline buffers',
        'Define go/no-go criteria and decision points',
        'Identify assumptions that if invalidated become risks',
        'Save risk assessment document to output directory'
      ],
      outputFormat: 'JSON with risks (array), mitigationPlans (array), riskMatrix (object), contingencyPlan (object), goNoGoCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'mitigationPlans', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'adoption', 'business', 'timeline', 'quality', 'organizational'] },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
              consequences: { type: 'string' },
              earlyWarnings: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mitigationPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              preventiveActions: { type: 'array', items: { type: 'string' } },
              contingencyPlan: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        riskMatrix: {
          type: 'object',
          properties: {
            highRisks: { type: 'number' },
            mediumRisks: { type: 'number' },
            lowRisks: { type: 'number' },
            description: { type: 'string' }
          }
        },
        contingencyPlan: {
          type: 'object',
          properties: {
            budgetBuffer: { type: 'string' },
            timelineBuffer: { type: 'string' },
            rollbackPlan: { type: 'string' },
            communicationPlan: { type: 'string' }
          }
        },
        goNoGoCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              threshold: { type: 'string' },
              decisionPoint: { type: 'string' }
            }
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
  labels: ['agent', 'prd', 'risk-assessment', 'product-management']
}));

// Task 10: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap and phasing strategy',
  agent: {
    name: 'delivery-manager',
    prompt: {
      role: 'delivery manager and agile coach',
      task: 'Create phased implementation roadmap with milestones, dependencies, and resource planning',
      context: args,
      instructions: [
        'Define implementation phases:',
        '  - Phase 0: Discovery and planning',
        '  - Phase 1: MVP (minimum viable product)',
        '  - Phase 2: Enhanced features',
        '  - Phase 3: Polish and optimization',
        '  - Phase 4: Scale and expansion',
        'For each phase, define:',
        '  - Phase name and objective',
        '  - User stories included',
        '  - Acceptance criteria',
        '  - Story points',
        '  - Duration estimate',
        '  - Dependencies (internal and external)',
        '  - Key deliverables',
        '  - Success criteria',
        '  - Go/no-go decision point',
        'Create sprint plan (assuming 2-week sprints):',
        '  - Sprint goals',
        '  - User stories per sprint',
        '  - Story points per sprint',
        '  - Key activities',
        '  - Dependencies and blockers',
        'Define key milestones:',
        '  - Milestone name and date',
        '  - Deliverables',
        '  - Stakeholders to notify',
        '  - Success criteria',
        'Map dependencies between stories and phases:',
        '  - Identify critical path',
        '  - Identify parallel workstreams',
        '  - Highlight blockers and risks',
        'Create resource plan:',
        '  - Team composition needed',
        '  - Skills required per phase',
        '  - External dependencies',
        '  - Budget allocation',
        'Define release strategy:',
        '  - Beta release plan',
        '  - Phased rollout vs. big bang',
        '  - User segments for phased rollout',
        '  - Feature flags strategy',
        '  - Rollback procedures',
        'Calculate total timeline and effort',
        'Create Gantt chart representation (text-based)',
        'Save roadmap document to output directory'
      ],
      outputFormat: 'JSON with phases (array), sprints (array), milestones (array), dependencies (array), resourcePlan (object), releaseStrategy (object), totalStoryPoints (number), estimatedDuration (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'milestones', 'totalStoryPoints', 'estimatedDuration', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              name: { type: 'string' },
              objective: { type: 'string' },
              userStories: { type: 'array', items: { type: 'string' } },
              storyPoints: { type: 'number' },
              duration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sprints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              goal: { type: 'string' },
              userStories: { type: 'array', items: { type: 'string' } },
              storyPoints: { type: 'number' },
              startDate: { type: 'string' },
              endDate: { type: 'string' }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              date: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              criteria: { type: 'array', items: { type: 'string' } },
              stakeholders: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        resourcePlan: {
          type: 'object',
          properties: {
            teamComposition: { type: 'array', items: { type: 'object' } },
            skillsRequired: { type: 'array', items: { type: 'string' } },
            externalDependencies: { type: 'array', items: { type: 'string' } },
            budgetAllocation: { type: 'string' }
          }
        },
        releaseStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['phased-rollout', 'big-bang', 'beta-first'] },
            betaPlan: { type: 'string' },
            rolloutPhases: { type: 'array', items: { type: 'object' } },
            featureFlags: { type: 'boolean' },
            rollbackProcedure: { type: 'string' }
          }
        },
        totalStoryPoints: { type: 'number' },
        estimatedDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prd', 'roadmap', 'product-management']
}));

// Task 11: PRD Document Assembly
export const prdDocumentAssemblyTask = defineTask('prd-document-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble comprehensive PRD document',
  agent: {
    name: 'product-writer',
    prompt: {
      role: 'product manager and technical writer',
      task: 'Assemble all components into comprehensive, well-structured PRD document',
      context: args,
      instructions: [
        'Create comprehensive PRD document with following structure:',
        '',
        '# Product Requirements Document: {Feature Name}',
        '',
        '## Document Information',
        '- Version',
        '- Date',
        '- Authors and contributors',
        '- Status (Draft, In Review, Approved)',
        '- Approval signatures',
        '',
        '## 1. Executive Summary',
        '- Brief overview (2-3 paragraphs)',
        '- Problem being solved',
        '- Proposed solution',
        '- Expected outcomes and success metrics',
        '- Priority level and rationale',
        '',
        '## 2. Problem Statement',
        '- Refined problem statement',
        '- Who has this problem (target users)',
        '- Why this matters (business value and user impact)',
        '- Current state and pain points',
        '- Impact score and analysis summary',
        '',
        '## 3. Goals and Objectives',
        '- Business goals',
        '- User goals',
        '- Success criteria',
        '- OKRs (Objectives and Key Results)',
        '',
        '## 4. User Research',
        '- Target user personas',
        '- User needs analysis',
        '- User journey maps (current and future state)',
        '- Key insights from research',
        '',
        '## 5. User Stories and Requirements',
        '- Organized by epic/theme',
        '- Prioritized using MoSCoW',
        '- Story points and estimates',
        '- MVP vs. post-MVP delineation',
        '',
        '## 6. Acceptance Criteria',
        '- Given-When-Then scenarios for each story',
        '- Non-functional requirements',
        '- Definition of Done',
        '',
        '## 7. Technical Specifications (if included)',
        '- System architecture overview',
        '- Components and APIs',
        '- Data models',
        '- Integrations',
        '- Technical constraints',
        '',
        '## 8. Design Requirements (if included)',
        '- Screen specifications',
        '- UI components',
        '- Interaction patterns',
        '- Visual design requirements',
        '- Responsive and accessibility specs',
        '- Mockup specifications',
        '',
        '## 9. Success Metrics and Measurement',
        '- Key metrics and KPIs',
        '- Baselines and targets',
        '- Measurement plan',
        '- Analytics instrumentation',
        '',
        '## 10. Competitive Analysis',
        '- Competitor overview',
        '- Feature comparison',
        '- Competitive advantages',
        '- Differentiation strategy',
        '',
        '## 11. Risks and Mitigation',
        '- Risk assessment',
        '- Mitigation strategies',
        '- Contingency plans',
        '- Go/no-go criteria',
        '',
        '## 12. Implementation Roadmap',
        '- Phased approach',
        '- Milestones and timeline',
        '- Dependencies',
        '- Resource requirements',
        '- Release strategy',
        '',
        '## 13. Stakeholders and Approvals',
        '- Stakeholder list',
        '- Roles and responsibilities',
        '- Review and approval process',
        '',
        '## 14. Assumptions and Constraints',
        '- Key assumptions',
        '- Known constraints',
        '- Dependencies on other teams/systems',
        '',
        '## 15. Open Questions and Future Considerations',
        '- Unresolved questions',
        '- Future enhancements',
        '- Out of scope items',
        '',
        '## Appendices',
        '- References and links',
        '- Research data',
        '- Supporting documents',
        '',
        'Use clear, professional language',
        'Include tables, lists, and formatting for readability',
        'Ensure consistent terminology throughout',
        'Add table of contents with links',
        'Include version history',
        'Save complete PRD document to output directory'
      ],
      outputFormat: 'JSON with prdDocument (string - full markdown content), prdPath (string), metadata (object), wordCount (number), sectionCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prdDocument', 'prdPath', 'metadata', 'wordCount', 'artifacts'],
      properties: {
        prdDocument: { type: 'string' },
        prdPath: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            version: { type: 'string' },
            status: { type: 'string', enum: ['Draft', 'In Review', 'Approved', 'Published'] },
            date: { type: 'string' },
            authors: { type: 'array', items: { type: 'string' } },
            approvers: { type: 'array', items: { type: 'string' } }
          }
        },
        wordCount: { type: 'number' },
        sectionCount: { type: 'number' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prd', 'document-assembly', 'product-management']
}));

// Task 12: PRD Quality Validation
export const prdQualityValidationTask = defineTask('prd-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate PRD quality and completeness',
  agent: {
    name: 'prd-quality-auditor',
    prompt: {
      role: 'senior product manager and quality auditor',
      task: 'Assess PRD quality, completeness, clarity, and adherence to best practices',
      context: args,
      instructions: [
        'Evaluate Completeness (weight: 30%):',
        '  - All required sections present?',
        '  - Problem statement clearly defined?',
        '  - User stories comprehensive?',
        '  - Acceptance criteria defined?',
        '  - Success metrics identified?',
        '  - Technical specs included (if required)?',
        '  - Design requirements included (if required)?',
        '  - Risks assessed?',
        '  - Roadmap defined?',
        '  - Score: 0-100',
        '',
        'Evaluate Clarity and Communication (weight: 25%):',
        '  - Clear, unambiguous language?',
        '  - Appropriate for target audience?',
        '  - Jargon explained?',
        '  - Consistent terminology?',
        '  - Well-organized structure?',
        '  - Good use of formatting?',
        '  - Score: 0-100',
        '',
        'Evaluate Requirements Quality (weight: 25%):',
        '  - User stories follow best practices?',
        '  - Acceptance criteria testable?',
        '  - Requirements prioritized?',
        '  - MVP clearly defined?',
        '  - Dependencies identified?',
        '  - Realistic and achievable?',
        '  - Score: 0-100',
        '',
        'Evaluate Strategic Alignment (weight: 10%):',
        '  - Aligns with business goals?',
        '  - Clear value proposition?',
        '  - Problem-solution fit validated?',
        '  - Success metrics meaningful?',
        '  - Competitive positioning clear?',
        '  - Score: 0-100',
        '',
        'Evaluate Actionability (weight: 10%):',
        '  - Can engineering team implement from this?',
        '  - Can design team create designs from this?',
        '  - Can QA team create test plans from this?',
        '  - Timeline and resources clear?',
        '  - Score: 0-100',
        '',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific recommendations for improvement',
        'Assess readiness for stakeholder review',
        'Check compliance with PRD best practices',
        'Generate quality report',
        'Save quality validation report to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), strengths (array), reviewReadiness (string), reportPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'completeness', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number', minimum: 0, maximum: 100 },
            clarity: { type: 'number', minimum: 0, maximum: 100 },
            requirementsQuality: { type: 'number', minimum: 0, maximum: 100 },
            strategicAlignment: { type: 'number', minimum: 0, maximum: 100 },
            actionability: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            hasProblemStatement: { type: 'boolean' },
            hasUserStories: { type: 'boolean' },
            hasAcceptanceCriteria: { type: 'boolean' },
            hasSuccessMetrics: { type: 'boolean' },
            hasTechnicalSpecs: { type: 'boolean' },
            hasDesignRequirements: { type: 'boolean' },
            hasRiskAssessment: { type: 'boolean' },
            hasRoadmap: { type: 'boolean' },
            hasCompetitiveAnalysis: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        reviewReadiness: { type: 'string', enum: ['ready', 'minor-improvements', 'major-revisions'] },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prd', 'quality-validation', 'product-management']
}));

// Task 13: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review and approval',
  agent: {
    name: 'stakeholder-facilitator',
    prompt: {
      role: 'product manager and stakeholder facilitator',
      task: 'Facilitate PRD review with stakeholders, gather feedback, and determine approval',
      context: args,
      instructions: [
        'Simulate review meeting with stakeholders',
        'For each stakeholder group, evaluate:',
        '  - Engineering: Technical feasibility, effort estimates, risks',
        '  - Design: UX implications, design requirements, accessibility',
        '  - QA: Testability, quality criteria, edge cases',
        '  - Business: Value proposition, ROI, strategic fit',
        '  - Legal/Compliance: Regulatory requirements, privacy, security',
        '  - Customer Success: Support implications, documentation needs',
        'Gather feedback from each reviewer:',
        '  - Reviewer name and role',
        '  - Specific comments and concerns',
        '  - Questions needing clarification',
        '  - Suggested changes',
        '  - Severity (minor, major, blocker)',
        '  - Section of PRD affected',
        'Identify areas of consensus and disagreement',
        'Document concerns and objections',
        'Determine if revisions are needed',
        'Recommend approval, conditional approval, or rejection',
        'If conditional approval, list specific revision items',
        'Document approval conditions',
        'Create action items for follow-up',
        'Save review meeting minutes to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), reviewers (array), feedback (array), revisionsNeeded (boolean), revisionItems (array), concerns (array), consensus (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'reviewers', 'feedback', 'revisionsNeeded', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        reviewers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              vote: { type: 'string', enum: ['approve', 'approve-with-changes', 'reject'] },
              signOffDate: { type: 'string' }
            }
          }
        },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewer: { type: 'string' },
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'major', 'blocker'] },
              section: { type: 'string' },
              suggestedChange: { type: 'string' }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        revisionItems: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        consensus: { type: 'array', items: { type: 'string' } },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
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
  labels: ['agent', 'prd', 'stakeholder-review', 'product-management']
}));

// Task 14: PRD Revision
export const prdRevisionTask = defineTask('prd-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Incorporate stakeholder feedback into PRD',
  agent: {
    name: 'product-writer',
    prompt: {
      role: 'product manager and technical writer',
      task: 'Revise PRD based on stakeholder feedback',
      context: args,
      instructions: [
        'Review all feedback items by severity',
        'Address all blocker issues (mandatory)',
        'Address all major issues (high priority)',
        'Incorporate minor suggestions where appropriate',
        'Update affected sections:',
        '  - Problem statement clarifications',
        '  - User stories refinements',
        '  - Acceptance criteria additions',
        '  - Technical specifications updates',
        '  - Design requirements clarifications',
        '  - Success metrics adjustments',
        '  - Risk mitigation additions',
        '  - Roadmap timeline adjustments',
        'Add clarifications and missing details',
        'Improve language and clarity',
        'Document revision history:',
        '  - Version number increment',
        '  - Date of revision',
        '  - What changed',
        '  - Why it changed',
        '  - Which feedback item it addresses',
        'Update document metadata (version, date, status)',
        'Save revised PRD document to output directory'
      ],
      outputFormat: 'JSON with prdDocument (string - revised markdown), prdPath (string), changesApplied (array), feedbackAddressed (array), versionHistory (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prdDocument', 'prdPath', 'changesApplied', 'feedbackAddressed', 'artifacts'],
      properties: {
        prdDocument: { type: 'string' },
        prdPath: { type: 'string' },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              change: { type: 'string' },
              reason: { type: 'string' },
              feedbackId: { type: 'string' }
            }
          }
        },
        feedbackAddressed: { type: 'array', items: { type: 'string' } },
        versionHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              date: { type: 'string' },
              changes: { type: 'string' },
              author: { type: 'string' }
            }
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
  labels: ['agent', 'prd', 'revision', 'product-management']
}));

// Task 15: PRD Publishing
export const prdPublishingTask = defineTask('prd-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Publish PRD and distribute to stakeholders',
  agent: {
    name: 'prd-publisher',
    prompt: {
      role: 'product operations manager',
      task: 'Publish PRD, distribute to stakeholders, and create supporting artifacts',
      context: args,
      instructions: [
        'Update PRD status to "Approved" or "Published"',
        'Add final approval signatures and dates',
        'Determine publication locations:',
        '  - Product management repository',
        '  - Confluence/wiki',
        '  - Shared drive',
        '  - Project management tool (Jira epic)',
        'Save PRD to all designated locations',
        'Generate shareable links',
        'Create stakeholder notification:',
        '  - Email distribution list',
        '  - Slack/Teams channels',
        '  - Project kickoff meeting invite',
        'Document notification plan and execution',
        'Create PRD index entry if catalog exists',
        'Generate PDF version for archival',
        'Create Jira/Azure DevOps epic with link to PRD',
        'Prepare kickoff meeting materials',
        'Save publication metadata to output directory'
      ],
      outputFormat: 'JSON with publishedPath (string), status (string), publishDate (string), distributionList (array), links (object), notificationsSent (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedPath', 'status', 'publishDate', 'artifacts'],
      properties: {
        publishedPath: { type: 'string' },
        status: { type: 'string', enum: ['Approved', 'Published'] },
        publishDate: { type: 'string' },
        distributionList: { type: 'array', items: { type: 'string' } },
        links: {
          type: 'object',
          properties: {
            wiki: { type: 'string' },
            repository: { type: 'string' },
            projectTool: { type: 'string' },
            pdf: { type: 'string' }
          }
        },
        notificationsSent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } },
              date: { type: 'string' }
            }
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
  labels: ['agent', 'prd', 'publishing', 'product-management']
}));

// Task 16: Supporting Artifacts
export const supportingArtifactsTask = defineTask('supporting-artifacts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate supporting artifacts and documentation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'product operations specialist',
      task: 'Generate supporting artifacts including one-pagers, presentations, and tracking templates',
      context: args,
      instructions: [
        'Generate executive one-pager:',
        '  - Single-page summary',
        '  - Problem, solution, impact',
        '  - Key metrics',
        '  - Timeline',
        '  - For executive stakeholders',
        'Generate feature presentation deck:',
        '  - Slide outline',
        '  - Problem statement',
        '  - Proposed solution',
        '  - User stories overview',
        '  - Success metrics',
        '  - Timeline and milestones',
        '  - For team kickoff',
        'Generate user story backlog (CSV/spreadsheet format):',
        '  - All user stories',
        '  - Priority, story points, epic',
        '  - Ready for import to Jira/Azure DevOps',
        'Generate success metrics tracking template:',
        '  - Dashboard structure',
        '  - Metrics definitions',
        '  - Baseline and target values',
        '  - Tracking frequency',
        'Generate FAQ document:',
        '  - Common questions about feature',
        '  - Answers and clarifications',
        '  - For internal teams',
        'Generate glossary of terms:',
        '  - Technical terms',
        '  - Domain-specific terminology',
        '  - Acronyms',
        'Save all supporting artifacts to output directory'
      ],
      outputFormat: 'JSON with onePager (string), presentationOutline (object), backlogCsv (string), metricsTemplate (object), faq (object), glossary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['onePager', 'presentationOutline', 'artifacts'],
      properties: {
        onePager: { type: 'string' },
        presentationOutline: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            slides: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  number: { type: 'number' },
                  title: { type: 'string' },
                  content: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        backlogCsv: { type: 'string' },
        metricsTemplate: {
          type: 'object',
          properties: {
            dashboardName: { type: 'string' },
            sections: { type: 'array', items: { type: 'object' } }
          }
        },
        faq: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' },
                  category: { type: 'string' }
                }
              }
            }
          }
        },
        glossary: {
          type: 'object',
          properties: {
            terms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  term: { type: 'string' },
                  definition: { type: 'string' },
                  acronym: { type: 'boolean' }
                }
              }
            }
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
  labels: ['agent', 'prd', 'supporting-artifacts', 'product-management']
}));
