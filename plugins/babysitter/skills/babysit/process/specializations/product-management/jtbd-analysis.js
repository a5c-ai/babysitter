/**
 * @process product-management/jtbd-analysis
 * @description Jobs-to-be-Done (JTBD) Analysis - Structured process for understanding customer jobs,
 * identifying functional/emotional/social needs, mapping progress, analyzing competing solutions, and
 * applying outcome-driven innovation to create products that customers truly need
 * @inputs { productName: string, targetCustomers?: array, problemSpace?: string, existingResearch?: array, innovationGoals?: array }
 * @outputs { success: boolean, customerJobs: object, progressMap: object, competitiveAnalysis: object, innovationOpportunities: array, strategicRecommendations: object }
 *
 * @example
 * const result = await orchestrate('product-management/jtbd-analysis', {
 *   productName: 'Cloud Storage Platform',
 *   targetCustomers: ['Small business owners', 'Remote teams', 'Freelancers'],
 *   problemSpace: 'File storage and collaboration',
 *   existingResearch: ['User interviews', 'Survey data', 'Usage analytics'],
 *   innovationGoals: ['Increase retention', 'Reduce churn', 'Expand market']
 * });
 *
 * @references
 * - Jobs to be Done Theory by Clayton Christensen: https://hbr.org/2016/09/know-your-customers-jobs-to-be-done
 * - Outcome-Driven Innovation by Tony Ulwick: https://jobs-to-be-done.com/outcome-driven-innovation-odi-is-jobs-to-be-done-theory-in-practice-2944c6ebc40e
 * - Competing Against Luck: https://www.christenseninstitute.org/jobs-to-be-done/
 * - JTBD Framework Guide: https://jtbd.info/2-what-is-jobs-to-be-done-jtbd-796b82081cca
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName,
    targetCustomers = [],
    problemSpace = '',
    existingResearch = [],
    innovationGoals = [],
    includeCompetitiveAnalysis = true,
    includeProgressMapping = true,
    minimumJobCount = 3,
    outputDir = 'jtbd-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting JTBD Analysis for ${productName}`);

  // ============================================================================
  // PHASE 1: CUSTOMER CONTEXT RESEARCH
  // ============================================================================

  ctx.log('info', 'Phase 1: Researching customer context and situations');
  const customerContext = await ctx.task(customerContextResearchTask, {
    productName,
    targetCustomers,
    problemSpace,
    existingResearch,
    outputDir
  });

  artifacts.push(...customerContext.artifacts);

  // Quality Gate: Validate sufficient customer understanding
  if (!customerContext.hasAdequateContext) {
    return {
      success: false,
      error: 'Insufficient customer context for JTBD analysis',
      phase: 'customer-context-research',
      missingContext: customerContext.missingContext,
      recommendation: 'Conduct additional customer research before proceeding'
    };
  }

  // ============================================================================
  // PHASE 2: JOB IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying core jobs customers are trying to accomplish');
  const jobIdentification = await ctx.task(jobIdentificationTask, {
    productName,
    customerContext,
    targetCustomers,
    problemSpace,
    outputDir
  });

  artifacts.push(...jobIdentification.artifacts);

  // Quality Gate: Must identify minimum number of jobs
  if (jobIdentification.coreJobs.length < minimumJobCount) {
    return {
      success: false,
      error: `Insufficient jobs identified. Found: ${jobIdentification.coreJobs.length}, minimum: ${minimumJobCount}`,
      phase: 'job-identification',
      recommendation: 'Broaden problem space or conduct additional customer discovery'
    };
  }

  // Breakpoint: Review identified jobs
  await ctx.breakpoint({
    question: `Job identification complete for ${productName}. ${jobIdentification.coreJobs.length} core jobs identified across ${jobIdentification.customerSegments.length} segments. Review jobs before proceeding to job mapping?`,
    title: 'Job Identification Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        coreJobsCount: jobIdentification.coreJobs.length,
        customerSegments: jobIdentification.customerSegments.length,
        problemSpace
      }
    }
  });

  // ============================================================================
  // PHASE 3: FUNCTIONAL JOBS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing functional jobs and tasks');
  const functionalJobsAnalysis = await ctx.task(functionalJobsAnalysisTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    customerContext,
    outputDir
  });

  artifacts.push(...functionalJobsAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: EMOTIONAL JOBS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing emotional jobs and personal needs');
  const emotionalJobsAnalysis = await ctx.task(emotionalJobsAnalysisTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    functionalJobs: functionalJobsAnalysis.functionalJobs,
    customerContext,
    outputDir
  });

  artifacts.push(...emotionalJobsAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: SOCIAL JOBS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing social jobs and how customers want to be perceived');
  const socialJobsAnalysis = await ctx.task(socialJobsAnalysisTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    functionalJobs: functionalJobsAnalysis.functionalJobs,
    emotionalJobs: emotionalJobsAnalysis.emotionalJobs,
    customerContext,
    outputDir
  });

  artifacts.push(...socialJobsAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: JOB STORY CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating detailed job stories with context and motivations');
  const jobStoryCreation = await ctx.task(jobStoryCreationTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    functionalJobs: functionalJobsAnalysis.functionalJobs,
    emotionalJobs: emotionalJobsAnalysis.emotionalJobs,
    socialJobs: socialJobsAnalysis.socialJobs,
    customerContext,
    outputDir
  });

  artifacts.push(...jobStoryCreation.artifacts);

  // Breakpoint: Review job stories
  await ctx.breakpoint({
    question: `Job stories created: ${jobStoryCreation.jobStories.length} stories covering functional, emotional, and social dimensions. Review stories before progress mapping?`,
    title: 'Job Stories Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        totalJobStories: jobStoryCreation.jobStories.length,
        functionalStories: jobStoryCreation.functionalStoriesCount,
        emotionalStories: jobStoryCreation.emotionalStoriesCount,
        socialStories: jobStoryCreation.socialStoriesCount
      }
    }
  });

  // ============================================================================
  // PHASE 7: PROGRESS MAPPING
  // ============================================================================

  let progressMapping = null;
  if (includeProgressMapping) {
    ctx.log('info', 'Phase 7: Mapping customer progress and job execution stages');
    progressMapping = await ctx.task(progressMappingTask, {
      productName,
      coreJobs: jobIdentification.coreJobs,
      jobStories: jobStoryCreation.jobStories,
      customerContext,
      outputDir
    });

    artifacts.push(...progressMapping.artifacts);
  }

  // ============================================================================
  // PHASE 8: DESIRED OUTCOMES IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Identifying desired outcomes and success metrics for each job');
  const outcomesIdentification = await ctx.task(outcomesIdentificationTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    functionalJobs: functionalJobsAnalysis.functionalJobs,
    emotionalJobs: emotionalJobsAnalysis.emotionalJobs,
    socialJobs: socialJobsAnalysis.socialJobs,
    progressMapping,
    outputDir
  });

  artifacts.push(...outcomesIdentification.artifacts);

  // ============================================================================
  // PHASE 9: OUTCOME IMPORTANCE AND SATISFACTION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing importance and current satisfaction for outcomes');
  const outcomesAssessment = await ctx.task(outcomesAssessmentTask, {
    productName,
    desiredOutcomes: outcomesIdentification.desiredOutcomes,
    coreJobs: jobIdentification.coreJobs,
    customerContext,
    outputDir
  });

  artifacts.push(...outcomesAssessment.artifacts);

  // ============================================================================
  // PHASE 10: COMPETING SOLUTIONS ANALYSIS
  // ============================================================================

  let competitiveAnalysis = null;
  if (includeCompetitiveAnalysis) {
    ctx.log('info', 'Phase 10: Analyzing competing solutions customers currently use');
    competitiveAnalysis = await ctx.task(competingSolutionsAnalysisTask, {
      productName,
      coreJobs: jobIdentification.coreJobs,
      desiredOutcomes: outcomesIdentification.desiredOutcomes,
      customerContext,
      progressMapping,
      outputDir
    });

    artifacts.push(...competitiveAnalysis.artifacts);
  }

  // Breakpoint: Review competing solutions
  if (competitiveAnalysis) {
    await ctx.breakpoint({
      question: `Competing solutions analyzed: ${competitiveAnalysis.competingSolutions.length} alternatives identified. ${competitiveAnalysis.underservedJobs.length} underserved jobs found. Review before innovation opportunities?`,
      title: 'Competitive Analysis Review',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          productName,
          competingSolutions: competitiveAnalysis.competingSolutions.length,
          underservedJobs: competitiveAnalysis.underservedJobs.length,
          switchingBarriers: competitiveAnalysis.switchingBarriers.length
        }
      }
    });
  }

  // ============================================================================
  // PHASE 11: UNMET NEEDS IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Identifying unmet needs and opportunity gaps');
  const unmetNeedsAnalysis = await ctx.task(unmetNeedsIdentificationTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    desiredOutcomes: outcomesIdentification.desiredOutcomes,
    outcomesAssessment,
    competitiveAnalysis,
    outputDir
  });

  artifacts.push(...unmetNeedsAnalysis.artifacts);

  // ============================================================================
  // PHASE 12: OUTCOME-DRIVEN INNOVATION OPPORTUNITIES
  // ============================================================================

  ctx.log('info', 'Phase 12: Identifying outcome-driven innovation opportunities');
  const innovationOpportunities = await ctx.task(innovationOpportunitiesTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    outcomesAssessment,
    unmetNeedsAnalysis,
    competitiveAnalysis,
    innovationGoals,
    outputDir
  });

  artifacts.push(...innovationOpportunities.artifacts);

  // ============================================================================
  // PHASE 13: OPPORTUNITY SCORING AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Scoring and prioritizing innovation opportunities');
  const opportunityPrioritization = await ctx.task(opportunityPrioritizationTask, {
    productName,
    innovationOpportunities: innovationOpportunities.opportunities,
    outcomesAssessment,
    unmetNeedsAnalysis,
    innovationGoals,
    outputDir
  });

  artifacts.push(...opportunityPrioritization.artifacts);

  // Breakpoint: Review innovation opportunities
  await ctx.breakpoint({
    question: `Innovation opportunities prioritized: ${opportunityPrioritization.highPriorityOpportunities.length} high-priority opportunities identified. Opportunity score: ${opportunityPrioritization.averageOpportunityScore.toFixed(1)}/100. Review opportunities?`,
    title: 'Innovation Opportunities Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        totalOpportunities: innovationOpportunities.opportunities.length,
        highPriorityOpportunities: opportunityPrioritization.highPriorityOpportunities.length,
        averageOpportunityScore: opportunityPrioritization.averageOpportunityScore,
        innovationCategories: opportunityPrioritization.opportunitiesByCategory
      }
    }
  });

  // ============================================================================
  // PHASE 14: STRATEGIC RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 14: Creating strategic recommendations and product direction');
  const strategicRecommendations = await ctx.task(strategicRecommendationsTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    opportunityPrioritization,
    innovationOpportunities: innovationOpportunities.opportunities,
    competitiveAnalysis,
    unmetNeedsAnalysis,
    innovationGoals,
    outputDir
  });

  artifacts.push(...strategicRecommendations.artifacts);

  // ============================================================================
  // PHASE 15: JTBD CANVAS AND VISUALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Creating JTBD canvas and visualizations');
  const jtbdVisualization = await ctx.task(jtbdVisualizationTask, {
    productName,
    coreJobs: jobIdentification.coreJobs,
    functionalJobs: functionalJobsAnalysis.functionalJobs,
    emotionalJobs: emotionalJobsAnalysis.emotionalJobs,
    socialJobs: socialJobsAnalysis.socialJobs,
    progressMapping,
    desiredOutcomes: outcomesIdentification.desiredOutcomes,
    innovationOpportunities: innovationOpportunities.opportunities,
    competitiveAnalysis,
    outputDir
  });

  artifacts.push(...jtbdVisualization.artifacts);

  // ============================================================================
  // PHASE 16: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Validating JTBD analysis quality and completeness');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    productName,
    jobIdentification,
    functionalJobsAnalysis,
    emotionalJobsAnalysis,
    socialJobsAnalysis,
    outcomesIdentification,
    outcomesAssessment,
    innovationOpportunities,
    competitiveAnalysis,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const analysisScore = qualityValidation.overallScore;
  const qualityMet = analysisScore >= 80;

  // Final Breakpoint: Review complete JTBD analysis
  await ctx.breakpoint({
    question: `JTBD Analysis complete for ${productName}. Quality score: ${analysisScore}/100. ${qualityMet ? 'Analysis meets quality standards!' : 'Analysis may need refinement.'} ${opportunityPrioritization.highPriorityOpportunities.length} high-priority innovation opportunities identified. Approve and proceed?`,
    title: 'Final JTBD Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        analysisScore,
        qualityMet,
        coreJobs: jobIdentification.coreJobs.length,
        totalOutcomes: outcomesIdentification.desiredOutcomes.length,
        innovationOpportunities: innovationOpportunities.opportunities.length,
        highPriorityOpportunities: opportunityPrioritization.highPriorityOpportunities.length,
        strategicRecommendations: strategicRecommendations.recommendations.length,
        duration: ctx.now() - startTime
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    analysisScore,
    qualityMet,
    customerJobs: {
      coreJobs: jobIdentification.coreJobs,
      functionalJobs: functionalJobsAnalysis.functionalJobs,
      emotionalJobs: emotionalJobsAnalysis.emotionalJobs,
      socialJobs: socialJobsAnalysis.socialJobs,
      jobStories: jobStoryCreation.jobStories,
      totalJobs: jobIdentification.coreJobs.length
    },
    outcomes: {
      desiredOutcomes: outcomesIdentification.desiredOutcomes,
      assessedOutcomes: outcomesAssessment.assessedOutcomes,
      underservedOutcomes: outcomesAssessment.underservedOutcomes,
      overservedOutcomes: outcomesAssessment.overservedOutcomes,
      opportunityScores: outcomesAssessment.opportunityScores
    },
    progressMap: progressMapping ? {
      stages: progressMapping.progressStages,
      painPoints: progressMapping.painPoints,
      moments: progressMapping.criticalMoments,
      transitions: progressMapping.stageTransitions
    } : null,
    competitiveAnalysis: competitiveAnalysis ? {
      competingSolutions: competitiveAnalysis.competingSolutions,
      underservedJobs: competitiveAnalysis.underservedJobs,
      overservedJobs: competitiveAnalysis.overservedJobs,
      switchingBarriers: competitiveAnalysis.switchingBarriers,
      marketGaps: competitiveAnalysis.marketGaps
    } : null,
    unmetNeeds: {
      criticalNeeds: unmetNeedsAnalysis.criticalUnmetNeeds,
      opportunityGaps: unmetNeedsAnalysis.opportunityGaps,
      underservedSegments: unmetNeedsAnalysis.underservedSegments
    },
    innovationOpportunities: {
      opportunities: innovationOpportunities.opportunities,
      highPriority: opportunityPrioritization.highPriorityOpportunities,
      mediumPriority: opportunityPrioritization.mediumPriorityOpportunities,
      lowPriority: opportunityPrioritization.lowPriorityOpportunities,
      opportunitiesByCategory: opportunityPrioritization.opportunitiesByCategory,
      averageOpportunityScore: opportunityPrioritization.averageOpportunityScore
    },
    strategicRecommendations: {
      recommendations: strategicRecommendations.recommendations,
      productDirection: strategicRecommendations.productDirection,
      priorityActions: strategicRecommendations.priorityActions,
      roadmapGuidance: strategicRecommendations.roadmapGuidance,
      valueProposition: strategicRecommendations.valueProposition
    },
    visualization: {
      jtbdCanvas: jtbdVisualization.jtbdCanvas,
      opportunityLandscape: jtbdVisualization.opportunityLandscape,
      competitivePositioning: jtbdVisualization.competitivePositioning,
      formats: jtbdVisualization.visualizationFormats
    },
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/jtbd-analysis',
      timestamp: startTime,
      productName,
      problemSpace,
      targetCustomers: targetCustomers.length,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Customer Context Research
export const customerContextResearchTask = defineTask('customer-context-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research customer context and situations',
  agent: {
    name: 'customer-researcher',
    prompt: {
      role: 'customer research specialist and ethnographer with expertise in contextual inquiry',
      task: 'Research and document customer context, situations, and circumstances surrounding product use',
      context: args,
      instructions: [
        'Review existing research: user interviews, surveys, analytics, feedback',
        'Identify target customer segments and their characteristics',
        'Document situations and contexts where customers need solutions',
        'Understand customer pain points, frustrations, and struggles',
        'Identify triggering events that prompt customers to seek solutions',
        'Map current behaviors and workarounds customers use',
        'Document constraints: time, money, resources, skills, environment',
        'Identify decision-making criteria and trade-offs',
        'Understand success criteria from customer perspective',
        'Assess research quality and identify knowledge gaps',
        'Determine if sufficient context exists for JTBD analysis',
        'Generate comprehensive customer context report'
      ],
      outputFormat: 'JSON with hasAdequateContext (boolean), customerSegments (array), situations (array), painPoints (array), triggeringEvents (array), constraints (array), missingContext (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasAdequateContext', 'customerSegments', 'situations', 'artifacts'],
      properties: {
        hasAdequateContext: { type: 'boolean' },
        customerSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              size: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        situations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              situation: { type: 'string' },
              context: { type: 'string' },
              frequency: { type: 'string' },
              customerSegments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        painPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              frequency: { type: 'string' },
              affectedSegments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        triggeringEvents: { type: 'array', items: { type: 'string' } },
        currentBehaviors: { type: 'array', items: { type: 'string' } },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              type: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        researchQuality: {
          type: 'object',
          properties: {
            qualitativeDataQuality: { type: 'string' },
            quantitativeDataQuality: { type: 'string' },
            recency: { type: 'string' },
            coverage: { type: 'string' }
          }
        },
        missingContext: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'jtbd-analysis', 'customer-research']
}));

// Task 2: Job Identification
export const jobIdentificationTask = defineTask('job-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify core jobs customers are trying to accomplish',
  agent: {
    name: 'jobs-analyst',
    prompt: {
      role: 'JTBD expert specializing in job identification and customer needs analysis',
      task: 'Identify the core jobs customers are trying to get done in the problem space',
      context: args,
      instructions: [
        'Frame jobs from customer perspective (not product features)',
        'Use job statement format: [verb] + [object of verb] + [contextual clarifier]',
        'Example: "Get dinner on the table quickly on busy weeknights"',
        'Jobs should be solution-agnostic (not tied to specific products)',
        'Identify 3-10 core jobs that are stable over time',
        'Focus on what customers are fundamentally trying to accomplish',
        'Distinguish between main job and related jobs',
        'Identify job performer (who is doing the job)',
        'Document when and where jobs are performed',
        'Capture why the job matters (underlying motivation)',
        'Validate jobs against customer research and data',
        'Categorize jobs by customer segment',
        'Assess job importance and frequency',
        'Generate comprehensive job catalog'
      ],
      outputFormat: 'JSON with coreJobs (array), mainJob (object), relatedJobs (array), customerSegments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['coreJobs', 'mainJob', 'artifacts'],
      properties: {
        coreJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string' },
              jobStatement: { type: 'string' },
              verb: { type: 'string' },
              object: { type: 'string' },
              context: { type: 'string' },
              jobPerformer: { type: 'string' },
              whenPerformed: { type: 'string' },
              wherePerformed: { type: 'string' },
              whyItMatters: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'rare'] },
              customerSegments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mainJob: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            jobStatement: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        relatedJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string' },
              relationshipToMain: { type: 'string' }
            }
          }
        },
        customerSegments: { type: 'array', items: { type: 'string' } },
        jobsBySegment: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'jtbd-analysis', 'job-identification']
}));

// Task 3: Functional Jobs Analysis
export const functionalJobsAnalysisTask = defineTask('functional-jobs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze functional jobs and practical tasks',
  agent: {
    name: 'functional-analyst',
    prompt: {
      role: 'JTBD analyst specializing in functional job decomposition',
      task: 'Analyze functional aspects of jobs - the practical, objective tasks customers need to accomplish',
      context: args,
      instructions: [
        'For each core job, identify functional sub-jobs and tasks',
        'Functional jobs are practical, objective, measurable tasks',
        'Focus on concrete actions and tangible outcomes',
        'Break down each job into step-by-step functional tasks',
        'Identify inputs, outputs, and transformations',
        'Document tools, resources, and capabilities needed',
        'Measure functional performance: speed, accuracy, efficiency, completeness',
        'Identify functional pain points and obstacles',
        'Map dependencies between functional tasks',
        'Assess complexity and effort required',
        'Document current solutions for functional jobs',
        'Generate functional job map with task breakdown'
      ],
      outputFormat: 'JSON with functionalJobs (array), functionalTasks (array), functionalMetrics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalJobs', 'artifacts'],
      properties: {
        functionalJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string' },
              parentJob: { type: 'string' },
              functionalTask: { type: 'string' },
              description: { type: 'string' },
              inputs: { type: 'array', items: { type: 'string' } },
              outputs: { type: 'array', items: { type: 'string' } },
              toolsNeeded: { type: 'array', items: { type: 'string' } },
              performanceMetrics: {
                type: 'object',
                properties: {
                  speed: { type: 'string' },
                  accuracy: { type: 'string' },
                  efficiency: { type: 'string' }
                }
              },
              complexity: { type: 'string', enum: ['simple', 'moderate', 'complex', 'very-complex'] },
              painPoints: { type: 'array', items: { type: 'string' } },
              currentSolutions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        functionalTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              taskName: { type: 'string' },
              parentFunctionalJob: { type: 'string' },
              sequenceOrder: { type: 'number' }
            }
          }
        },
        functionalMetrics: {
          type: 'object',
          properties: {
            totalFunctionalJobs: { type: 'number' },
            averageComplexity: { type: 'string' },
            criticalTasks: { type: 'number' }
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
  labels: ['agent', 'jtbd-analysis', 'functional-jobs']
}));

// Task 4: Emotional Jobs Analysis
export const emotionalJobsAnalysisTask = defineTask('emotional-jobs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze emotional jobs and personal needs',
  agent: {
    name: 'emotional-analyst',
    prompt: {
      role: 'behavioral psychologist and JTBD specialist in emotional needs',
      task: 'Analyze emotional aspects of jobs - how customers want to feel when getting the job done',
      context: args,
      instructions: [
        'For each core job, identify emotional needs and desires',
        'Emotional jobs are personal, subjective feelings customers seek',
        'Focus on emotions: feel confident, feel secure, reduce anxiety, feel accomplished',
        'Identify positive emotions customers want (feel empowered, feel in control)',
        'Identify negative emotions customers want to avoid (avoid embarrassment, avoid stress)',
        'Understand emotional triggers and motivations',
        'Document emotional pain points and frustrations',
        'Assess emotional intensity and importance',
        'Link emotional jobs to functional jobs',
        'Identify moments of high emotional impact',
        'Explore self-perception and identity',
        'Generate emotional job map with feeling statements'
      ],
      outputFormat: 'JSON with emotionalJobs (array), emotionalNeeds (array), emotionalTriggers (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['emotionalJobs', 'artifacts'],
      properties: {
        emotionalJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string' },
              parentJob: { type: 'string' },
              emotionalNeed: { type: 'string' },
              desiredFeeling: { type: 'string' },
              avoidedFeeling: { type: 'string' },
              emotionType: { type: 'string', enum: ['positive-seek', 'negative-avoid'] },
              intensity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              linkedFunctionalJob: { type: 'string' },
              emotionalTriggers: { type: 'array', items: { type: 'string' } },
              emotionalPainPoints: { type: 'array', items: { type: 'string' } },
              contextualFactors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        emotionalNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              category: { type: 'string' },
              frequency: { type: 'number' }
            }
          }
        },
        emotionalTriggers: { type: 'array', items: { type: 'string' } },
        highImpactMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moment: { type: 'string' },
              emotionalIntensity: { type: 'string' },
              impact: { type: 'string' }
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
  labels: ['agent', 'jtbd-analysis', 'emotional-jobs']
}));

// Task 5: Social Jobs Analysis
export const socialJobsAnalysisTask = defineTask('social-jobs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze social jobs and perception needs',
  agent: {
    name: 'social-analyst',
    prompt: {
      role: 'sociologist and JTBD expert in social dynamics and perception',
      task: 'Analyze social aspects of jobs - how customers want to be perceived by others',
      context: args,
      instructions: [
        'For each core job, identify social needs and perception goals',
        'Social jobs are about how customers want others to see them',
        'Focus on perception: be seen as competent, professional, innovative, responsible',
        'Identify reference groups: whose opinions matter (peers, boss, family, colleagues)',
        'Document desired social image and reputation',
        'Understand social pressures and expectations',
        'Identify social risks and fears (looking incompetent, unprofessional)',
        'Assess influence of social context on decisions',
        'Link social jobs to functional and emotional jobs',
        'Identify moments of high social visibility',
        'Explore status, belonging, and identity concerns',
        'Generate social job map with perception statements'
      ],
      outputFormat: 'JSON with socialJobs (array), referenceGroups (array), socialRisks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['socialJobs', 'artifacts'],
      properties: {
        socialJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string' },
              parentJob: { type: 'string' },
              socialNeed: { type: 'string' },
              desiredPerception: { type: 'string' },
              avoidedPerception: { type: 'string' },
              referenceGroup: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              linkedFunctionalJob: { type: 'string' },
              linkedEmotionalJob: { type: 'string' },
              socialPressures: { type: 'array', items: { type: 'string' } },
              socialRisks: { type: 'array', items: { type: 'string' } },
              statusConcerns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        referenceGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              influence: { type: 'string', enum: ['high', 'medium', 'low'] },
              context: { type: 'string' }
            }
          }
        },
        socialRisks: { type: 'array', items: { type: 'string' } },
        highVisibilityMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moment: { type: 'string' },
              visibility: { type: 'string' },
              stakeholders: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'jtbd-analysis', 'social-jobs']
}));

// Task 6: Job Story Creation
export const jobStoryCreationTask = defineTask('job-story-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create detailed job stories',
  agent: {
    name: 'story-writer',
    prompt: {
      role: 'JTBD storyteller and product narrative specialist',
      task: 'Create detailed job stories that capture context, motivation, and desired outcome',
      context: args,
      instructions: [
        'Use job story format: "When [situation], I want to [motivation], so I can [expected outcome]"',
        'For each core job, create 2-5 job stories covering different scenarios',
        'Incorporate functional, emotional, and social dimensions',
        'Include specific context and triggering situations',
        'Capture underlying motivations (not just tasks)',
        'Describe desired outcomes and success criteria',
        'Make stories concrete and specific (avoid generic statements)',
        'Include relevant constraints and considerations',
        'Document variations for different customer segments',
        'Link stories to functional, emotional, and social jobs',
        'Validate stories against customer research',
        'Generate comprehensive job story catalog'
      ],
      outputFormat: 'JSON with jobStories (array), functionalStoriesCount (number), emotionalStoriesCount (number), socialStoriesCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['jobStories', 'artifacts'],
      properties: {
        jobStories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              storyId: { type: 'string' },
              parentJob: { type: 'string' },
              situation: { type: 'string' },
              motivation: { type: 'string' },
              expectedOutcome: { type: 'string' },
              fullStory: { type: 'string' },
              functionalDimension: { type: 'string' },
              emotionalDimension: { type: 'string' },
              socialDimension: { type: 'string' },
              customerSegment: { type: 'string' },
              frequency: { type: 'string' },
              constraints: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        functionalStoriesCount: { type: 'number' },
        emotionalStoriesCount: { type: 'number' },
        socialStoriesCount: { type: 'number' },
        storiesBySegment: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'jtbd-analysis', 'job-stories']
}));

// Task 7: Progress Mapping
export const progressMappingTask = defineTask('progress-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map customer progress through job execution',
  agent: {
    name: 'progress-mapper',
    prompt: {
      role: 'customer journey analyst and JTBD progress mapping specialist',
      task: 'Map the stages of progress customers go through when getting a job done',
      context: args,
      instructions: [
        'Identify job execution stages from start to finish',
        'Use progress stages: First thought, Passive looking, Active looking, Deciding, First use, Ongoing use',
        'Document what happens at each stage',
        'Identify pain points and obstacles at each stage',
        'Map forces at play: push forces (problems), pull forces (attraction), anxiety forces (concerns), habit forces (inertia)',
        'Identify critical moments and decision points',
        'Document transitions between stages',
        'Understand what triggers movement from one stage to next',
        'Identify where customers get stuck',
        'Map competitor entry points at each stage',
        'Assess importance of each stage',
        'Generate comprehensive progress map'
      ],
      outputFormat: 'JSON with progressStages (array), painPoints (array), forces (object), criticalMoments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['progressStages', 'criticalMoments', 'artifacts'],
      properties: {
        progressStages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stageId: { type: 'string' },
              stageName: { type: 'string' },
              description: { type: 'string' },
              customerActions: { type: 'array', items: { type: 'string' } },
              customerThoughts: { type: 'array', items: { type: 'string' } },
              customerEmotions: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              obstacles: { type: 'array', items: { type: 'string' } },
              sequenceOrder: { type: 'number' }
            }
          }
        },
        painPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              painPoint: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        forces: {
          type: 'object',
          properties: {
            pushForces: { type: 'array', items: { type: 'string' } },
            pullForces: { type: 'array', items: { type: 'string' } },
            anxietyForces: { type: 'array', items: { type: 'string' } },
            habitForces: { type: 'array', items: { type: 'string' } }
          }
        },
        criticalMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moment: { type: 'string' },
              stage: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium'] },
              decision: { type: 'string' }
            }
          }
        },
        stageTransitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromStage: { type: 'string' },
              toStage: { type: 'string' },
              trigger: { type: 'string' },
              barriers: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'jtbd-analysis', 'progress-mapping']
}));

// Task 8: Outcomes Identification
export const outcomesIdentificationTask = defineTask('outcomes-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify desired outcomes for each job',
  agent: {
    name: 'outcomes-specialist',
    prompt: {
      role: 'outcome-driven innovation expert and JTBD analyst',
      task: 'Identify measurable desired outcomes customers use to judge job success',
      context: args,
      instructions: [
        'For each functional job, identify desired outcomes',
        'Use outcome format: [direction of improvement] + [metric] + [object of control] + [contextual clarifier]',
        'Example: "Minimize the time it takes to find the right information when under deadline pressure"',
        'Outcomes should be measurable and solution-agnostic',
        'Focus on speed (minimize time), stability (minimize variability), quality (maximize accuracy)',
        'Identify outcomes across job dimensions: preparation, execution, monitoring, modification, conclusion',
        'Generate 10-30 outcomes per job (comprehensive outcome set)',
        'Make outcomes specific and granular',
        'Avoid solutions - focus on metrics customers care about',
        'Include both desired outcomes (maximize) and unwanted outcomes (minimize)',
        'Link outcomes to functional, emotional, and social jobs',
        'Generate complete outcome inventory'
      ],
      outputFormat: 'JSON with desiredOutcomes (array), outcomesByJob (object), outcomesByDimension (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['desiredOutcomes', 'artifacts'],
      properties: {
        desiredOutcomes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcomeId: { type: 'string' },
              parentJob: { type: 'string' },
              outcomeStatement: { type: 'string' },
              direction: { type: 'string', enum: ['minimize', 'maximize', 'optimize'] },
              metric: { type: 'string' },
              objectOfControl: { type: 'string' },
              contextualClarifier: { type: 'string' },
              jobDimension: { type: 'string', enum: ['preparation', 'execution', 'monitoring', 'modification', 'conclusion'] },
              outcomeType: { type: 'string', enum: ['speed', 'stability', 'quality', 'cost', 'risk'] },
              linkedFunctionalJob: { type: 'string' },
              linkedEmotionalJob: { type: 'string' },
              linkedSocialJob: { type: 'string' }
            }
          }
        },
        outcomesByJob: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        outcomesByDimension: {
          type: 'object',
          properties: {
            preparation: { type: 'number' },
            execution: { type: 'number' },
            monitoring: { type: 'number' },
            modification: { type: 'number' },
            conclusion: { type: 'number' }
          }
        },
        totalOutcomes: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'jtbd-analysis', 'outcomes']
}));

// Task 9: Outcomes Assessment
export const outcomesAssessmentTask = defineTask('outcomes-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess outcome importance and satisfaction',
  agent: {
    name: 'assessment-analyst',
    prompt: {
      role: 'quantitative researcher and outcome assessment specialist',
      task: 'Assess importance and current satisfaction for each desired outcome to identify opportunity',
      context: args,
      instructions: [
        'For each desired outcome, assess two dimensions:',
        '  1. Importance: How important is this outcome to customers? (0-10 scale)',
        '  2. Satisfaction: How satisfied are customers with current solutions? (0-10 scale)',
        'Calculate Opportunity Score: Importance + (Importance - Satisfaction)',
        'Outcomes with high importance + low satisfaction = high opportunity',
        'Categorize outcomes:',
        '  - Underserved (high importance, low satisfaction) - innovation opportunity',
        '  - Appropriately served (high importance, high satisfaction) - competitive',
        '  - Overserved (low importance, high satisfaction) - overbuilt',
        '  - Unimportant (low importance, low satisfaction) - ignore',
        'Use Opportunity Algorithm: Opportunity = Importance + Max(Importance - Satisfaction, 0)',
        'Opportunity score > 15 = high opportunity, 12-15 = medium, < 12 = low',
        'Generate opportunity landscape report',
        'Prioritize outcomes for innovation focus'
      ],
      outputFormat: 'JSON with assessedOutcomes (array), underservedOutcomes (array), overservedOutcomes (array), opportunityScores (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedOutcomes', 'underservedOutcomes', 'opportunityScores', 'artifacts'],
      properties: {
        assessedOutcomes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcomeId: { type: 'string' },
              outcomeStatement: { type: 'string' },
              importance: { type: 'number', minimum: 0, maximum: 10 },
              satisfaction: { type: 'number', minimum: 0, maximum: 10 },
              opportunityScore: { type: 'number' },
              category: { type: 'string', enum: ['underserved', 'appropriately-served', 'overserved', 'unimportant'] },
              priorityLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        underservedOutcomes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcomeId: { type: 'string' },
              outcomeStatement: { type: 'string' },
              opportunityScore: { type: 'number' },
              gap: { type: 'number' }
            }
          }
        },
        appropriatelyServedOutcomes: { type: 'array' },
        overservedOutcomes: { type: 'array' },
        opportunityScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcomeId: { type: 'string' },
              score: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        opportunityDistribution: {
          type: 'object',
          properties: {
            highOpportunity: { type: 'number' },
            mediumOpportunity: { type: 'number' },
            lowOpportunity: { type: 'number' }
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
  labels: ['agent', 'jtbd-analysis', 'outcome-assessment']
}));

// Task 10: Competing Solutions Analysis
export const competingSolutionsAnalysisTask = defineTask('competing-solutions-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competing solutions customers use',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive intelligence analyst and JTBD specialist',
      task: 'Analyze all solutions customers currently use or consider for getting jobs done',
      context: args,
      instructions: [
        'Identify all competing solutions: direct competitors, indirect competitors, DIY approaches, workarounds, doing nothing',
        'Competition is for the job, not just similar products',
        'For each competing solution, document:',
        '  - Solution name and type',
        '  - Jobs it helps with',
        '  - Outcomes it satisfies well',
        '  - Outcomes it satisfies poorly (gaps)',
        '  - Adoption rate and market share',
        '  - Strengths and weaknesses from JTBD perspective',
        'Identify underserved jobs (no good solution exists)',
        'Identify overserved jobs (solutions are overkill)',
        'Assess switching costs and barriers',
        'Understand why customers hire each solution',
        'Map solution landscape by job and outcome performance',
        'Identify white space opportunities'
      ],
      outputFormat: 'JSON with competingSolutions (array), underservedJobs (array), overservedJobs (array), switchingBarriers (array), marketGaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competingSolutions', 'underservedJobs', 'artifacts'],
      properties: {
        competingSolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              solutionId: { type: 'string' },
              solutionName: { type: 'string' },
              solutionType: { type: 'string', enum: ['direct-competitor', 'indirect-competitor', 'diy', 'workaround', 'do-nothing'] },
              jobsAddressed: { type: 'array', items: { type: 'string' } },
              outcomesServedWell: { type: 'array', items: { type: 'string' } },
              outcomesServedPoorly: { type: 'array', items: { type: 'string' } },
              adoptionRate: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              whyCustomersHire: { type: 'string' },
              whyCustomersFire: { type: 'string' }
            }
          }
        },
        underservedJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'string' },
              jobStatement: { type: 'string' },
              gapDescription: { type: 'string' },
              opportunityLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        overservedJobs: { type: 'array' },
        switchingBarriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              barrier: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        marketGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              affectedJobs: { type: 'array', items: { type: 'string' } },
              opportunity: { type: 'string' }
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
  labels: ['agent', 'jtbd-analysis', 'competitive-analysis']
}));

// Task 11: Unmet Needs Identification
export const unmetNeedsIdentificationTask = defineTask('unmet-needs-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify unmet needs and opportunity gaps',
  agent: {
    name: 'opportunity-identifier',
    prompt: {
      role: 'innovation strategist and unmet needs specialist',
      task: 'Synthesize outcomes, competitive analysis, and customer insights to identify unmet needs',
      context: args,
      instructions: [
        'Combine outcome assessment with competitive analysis',
        'Identify critical unmet needs: high-importance outcomes poorly satisfied by existing solutions',
        'Find opportunity gaps: jobs where no solution adequately performs',
        'Discover underserved customer segments',
        'Identify moments where customers struggle most',
        'Map unmet needs to:',
        '  - Functional gaps (tasks not completed well)',
        '  - Emotional gaps (feelings not addressed)',
        '  - Social gaps (perception needs not met)',
        'Assess size and impact of each unmet need',
        'Prioritize unmet needs by:',
        '  - Opportunity score magnitude',
        '  - Number of customers affected',
        '  - Strategic alignment',
        '  - Feasibility to address',
        'Generate comprehensive unmet needs report'
      ],
      outputFormat: 'JSON with criticalUnmetNeeds (array), opportunityGaps (array), underservedSegments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalUnmetNeeds', 'opportunityGaps', 'artifacts'],
      properties: {
        criticalUnmetNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              needId: { type: 'string' },
              needDescription: { type: 'string' },
              relatedJob: { type: 'string' },
              relatedOutcomes: { type: 'array', items: { type: 'string' } },
              needType: { type: 'string', enum: ['functional', 'emotional', 'social'] },
              opportunityScore: { type: 'number' },
              customersAffected: { type: 'string' },
              currentGap: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        opportunityGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapId: { type: 'string' },
              gapDescription: { type: 'string' },
              affectedJobs: { type: 'array', items: { type: 'string' } },
              marketSize: { type: 'string' },
              competitiveVacuum: { type: 'boolean' }
            }
          }
        },
        underservedSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              unmetNeeds: { type: 'array', items: { type: 'string' } },
              opportunityValue: { type: 'string' }
            }
          }
        },
        functionalGaps: { type: 'number' },
        emotionalGaps: { type: 'number' },
        socialGaps: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'jtbd-analysis', 'unmet-needs']
}));

// Task 12: Innovation Opportunities
export const innovationOpportunitiesTask = defineTask('innovation-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify outcome-driven innovation opportunities',
  agent: {
    name: 'innovation-strategist',
    prompt: {
      role: 'outcome-driven innovation expert and product strategist',
      task: 'Transform unmet needs and high-opportunity outcomes into specific innovation opportunities',
      context: args,
      instructions: [
        'For each high-opportunity outcome, generate innovation ideas',
        'Focus innovations on outcomes, not solutions (stay solution-agnostic initially)',
        'Opportunity areas:',
        '  - New products/features addressing underserved outcomes',
        '  - Improvements to address poorly-satisfied outcomes',
        '  - Removal of overserved features (simplification)',
        '  - Alternative approaches to satisfy emotional/social jobs',
        '  - Market repositioning based on job focus',
        'For each opportunity define:',
        '  - Target outcome(s) and job(s)',
        '  - Customer segment',
        '  - Innovation approach (new, improve, simplify, reframe)',
        '  - Expected outcome improvement',
        '  - Strategic fit',
        'Categorize opportunities by type: breakthrough, adjacent, incremental',
        'Generate comprehensive innovation opportunity portfolio'
      ],
      outputFormat: 'JSON with opportunities (array), opportunitiesByType (object), opportunitiesByJob (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunityId: { type: 'string' },
              opportunityName: { type: 'string' },
              description: { type: 'string' },
              targetOutcomes: { type: 'array', items: { type: 'string' } },
              targetJobs: { type: 'array', items: { type: 'string' } },
              customerSegment: { type: 'string' },
              innovationApproach: { type: 'string', enum: ['new', 'improve', 'simplify', 'reframe'] },
              opportunityType: { type: 'string', enum: ['breakthrough', 'adjacent', 'incremental'] },
              expectedImprovement: { type: 'string' },
              strategicFit: { type: 'string', enum: ['high', 'medium', 'low'] },
              competitiveAdvantage: { type: 'string' },
              outcomeOpportunityScores: { type: 'array', items: { type: 'number' } }
            }
          }
        },
        opportunitiesByType: {
          type: 'object',
          properties: {
            breakthrough: { type: 'number' },
            adjacent: { type: 'number' },
            incremental: { type: 'number' }
          }
        },
        opportunitiesByJob: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        opportunitiesByApproach: {
          type: 'object',
          properties: {
            new: { type: 'number' },
            improve: { type: 'number' },
            simplify: { type: 'number' },
            reframe: { type: 'number' }
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
  labels: ['agent', 'jtbd-analysis', 'innovation-opportunities']
}));

// Task 13: Opportunity Prioritization
export const opportunityPrioritizationTask = defineTask('opportunity-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score and prioritize innovation opportunities',
  agent: {
    name: 'opportunity-prioritizer',
    prompt: {
      role: 'portfolio manager and innovation prioritization specialist',
      task: 'Score and prioritize innovation opportunities based on opportunity scores, strategic fit, and feasibility',
      context: args,
      instructions: [
        'For each innovation opportunity, calculate priority score using:',
        '  - Average opportunity score of target outcomes (40% weight)',
        '  - Strategic fit with innovation goals (30% weight)',
        '  - Estimated feasibility (20% weight)',
        '  - Competitive advantage potential (10% weight)',
        'Score each dimension 0-10, calculate weighted average',
        'Categorize opportunities:',
        '  - High priority (score > 7.5): pursue immediately',
        '  - Medium priority (score 5-7.5): consider for roadmap',
        '  - Low priority (score < 5): defer or eliminate',
        'Balance portfolio across types: breakthrough, adjacent, incremental',
        'Consider resource constraints and capacity',
        'Identify quick wins vs strategic bets',
        'Create prioritized innovation portfolio',
        'Generate opportunity prioritization report'
      ],
      outputFormat: 'JSON with highPriorityOpportunities (array), mediumPriorityOpportunities (array), lowPriorityOpportunities (array), averageOpportunityScore (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['highPriorityOpportunities', 'averageOpportunityScore', 'artifacts'],
      properties: {
        highPriorityOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunityId: { type: 'string' },
              opportunityName: { type: 'string' },
              priorityScore: { type: 'number' },
              outcomeOpportunity: { type: 'number' },
              strategicFit: { type: 'number' },
              feasibility: { type: 'number' },
              competitiveAdvantage: { type: 'number' }
            }
          }
        },
        mediumPriorityOpportunities: { type: 'array' },
        lowPriorityOpportunities: { type: 'array' },
        averageOpportunityScore: { type: 'number' },
        opportunitiesByCategory: {
          type: 'object',
          properties: {
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        portfolioBalance: {
          type: 'object',
          properties: {
            breakthrough: { type: 'number' },
            adjacent: { type: 'number' },
            incremental: { type: 'number' }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunityId: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        strategicBets: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'jtbd-analysis', 'prioritization']
}));

// Task 14: Strategic Recommendations
export const strategicRecommendationsTask = defineTask('strategic-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create strategic recommendations and product direction',
  agent: {
    name: 'strategy-advisor',
    prompt: {
      role: 'chief product officer and strategic advisor',
      task: 'Synthesize JTBD analysis into strategic recommendations and product direction',
      context: args,
      instructions: [
        'Create strategic product recommendations based on JTBD insights',
        'Recommend product positioning: which jobs to focus on, which customers to serve',
        'Define value proposition based on outcome improvements',
        'Recommend feature priorities aligned with underserved outcomes',
        'Suggest go-to-market approach based on job insights',
        'Recommend messaging focused on jobs and outcomes (not features)',
        'Identify strategic partnerships or acquisitions to address gaps',
        'Propose innovation portfolio mix',
        'Create roadmap guidance: near-term vs long-term priorities',
        'Define success metrics based on outcome satisfaction',
        'Identify risks and mitigation strategies',
        'Generate executive summary with key recommendations',
        'Create strategic action plan'
      ],
      outputFormat: 'JSON with recommendations (array), productDirection (object), priorityActions (array), roadmapGuidance (object), valueProposition (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'productDirection', 'valueProposition', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              timeframe: { type: 'string' },
              expectedImpact: { type: 'string' }
            }
          }
        },
        productDirection: {
          type: 'object',
          properties: {
            focusJobs: { type: 'array', items: { type: 'string' } },
            targetSegments: { type: 'array', items: { type: 'string' } },
            positioning: { type: 'string' },
            differentiation: { type: 'string' },
            competitiveStrategy: { type: 'string' }
          }
        },
        priorityActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roadmapGuidance: {
          type: 'object',
          properties: {
            nearTerm: { type: 'array', items: { type: 'string' } },
            midTerm: { type: 'array', items: { type: 'string' } },
            longTerm: { type: 'array', items: { type: 'string' } },
            milestones: { type: 'array', items: { type: 'string' } }
          }
        },
        valueProposition: { type: 'string' },
        messaging: {
          type: 'object',
          properties: {
            jobFocusedMessage: { type: 'string' },
            outcomeFocusedMessage: { type: 'string' },
            keyBenefits: { type: 'array', items: { type: 'string' } }
          }
        },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' }
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
  labels: ['agent', 'jtbd-analysis', 'strategy']
}));

// Task 15: JTBD Visualization
export const jtbdVisualizationTask = defineTask('jtbd-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create JTBD canvas and visualizations',
  agent: {
    name: 'visualization-designer',
    prompt: {
      role: 'information designer and JTBD visualization specialist',
      task: 'Create comprehensive visualizations of JTBD analysis including canvas, opportunity landscape, and maps',
      context: args,
      instructions: [
        'Create JTBD Canvas with all key elements:',
        '  - Core jobs (center)',
        '  - Functional, emotional, social jobs (dimensions)',
        '  - Desired outcomes (outer ring)',
        '  - Competing solutions (comparison)',
        '  - Opportunity areas (highlights)',
        'Create Opportunity Landscape visualization:',
        '  - 2x2 matrix: Importance vs Satisfaction',
        '  - Plot all outcomes',
        '  - Highlight underserved quadrant',
        '  - Size bubbles by customer impact',
        'Create Competitive Positioning map:',
        '  - Map solutions by jobs addressed',
        '  - Show outcome satisfaction levels',
        '  - Identify white space',
        'Create Progress Map visualization',
        'Generate multiple formats: markdown, mermaid diagrams, CSV exports',
        'Create presentation-ready visualizations'
      ],
      outputFormat: 'JSON with jtbdCanvas (string), opportunityLandscape (string), competitivePositioning (string), visualizationFormats (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['jtbdCanvas', 'opportunityLandscape', 'artifacts'],
      properties: {
        jtbdCanvas: { type: 'string' },
        opportunityLandscape: { type: 'string' },
        competitivePositioning: { type: 'string' },
        progressMap: { type: 'string' },
        jobMap: { type: 'string' },
        visualizationFormats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              filePath: { type: 'string' },
              description: { type: 'string' }
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
  labels: ['agent', 'jtbd-analysis', 'visualization']
}));

// Task 16: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate JTBD analysis quality',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'JTBD methodology expert and quality assurance specialist',
      task: 'Validate quality and completeness of JTBD analysis against best practices',
      context: args,
      instructions: [
        'Evaluate Job Identification Quality (weight: 15%):',
        '  - Jobs are solution-agnostic',
        '  - Jobs use proper format',
        '  - Jobs are stable over time',
        '  - Appropriate number of jobs identified',
        'Evaluate Functional/Emotional/Social Coverage (weight: 20%):',
        '  - All three dimensions addressed',
        '  - Balance across dimensions',
        '  - Depth of analysis in each',
        'Evaluate Outcomes Quality (weight: 20%):',
        '  - Sufficient outcomes per job',
        '  - Outcomes are measurable',
        '  - Proper outcome format used',
        'Evaluate Assessment Rigor (weight: 15%):',
        '  - Importance and satisfaction assessed',
        '  - Opportunity scores calculated correctly',
        '  - Data-backed assessments',
        'Evaluate Competitive Analysis (weight: 15%):',
        '  - Comprehensive solution identification',
        '  - Gaps and opportunities identified',
        '  - Insights actionable',
        'Evaluate Innovation Opportunities (weight: 15%):',
        '  - Tied to underserved outcomes',
        '  - Prioritized appropriately',
        '  - Actionable and specific',
        'Calculate weighted overall quality score (0-100)',
        'Identify methodology adherence gaps'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores (object), gaps (array), strengths (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            jobIdentificationQuality: { type: 'number' },
            dimensionalCoverage: { type: 'number' },
            outcomesQuality: { type: 'number' },
            assessmentRigor: { type: 'number' },
            competitiveAnalysis: { type: 'number' },
            innovationOpportunities: { type: 'number' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        methodologyAdherence: {
          type: 'object',
          properties: {
            solutionAgnostic: { type: 'boolean' },
            properJobFormat: { type: 'boolean' },
            outcomeDrivenApproach: { type: 'boolean' },
            comprehensiveAnalysis: { type: 'boolean' }
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
  labels: ['agent', 'jtbd-analysis', 'quality-validation']
}));
