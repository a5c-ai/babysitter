/**
 * @process education/item-writing
 * @description Systematic development of assessment items across formats (multiple choice, constructed response) following psychometric best practices
 * @inputs { assessmentPurpose: string, contentDomain: string, cognitiveLevel: string, itemFormat: string, specifications: object }
 * @outputs { success: boolean, items: array, itemBank: object, qualityReport: object, artifacts: array }
 * @recommendedSkills SK-EDU-003 (assessment-design-validation), SK-EDU-002 (learning-objectives-writing)
 * @recommendedAgents AG-EDU-003 (assessment-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    assessmentPurpose = '',
    contentDomain = '',
    cognitiveLevel = '',
    itemFormat = 'multiple-choice',
    specifications = {},
    outputDir = 'item-writing-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Item Writing for ${contentDomain} - ${itemFormat}`);

  // ============================================================================
  // ITEM SPECIFICATION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing detailed item specifications');
  const itemSpecs = await ctx.task(itemSpecificationDevelopmentTask, {
    assessmentPurpose,
    contentDomain,
    cognitiveLevel,
    itemFormat,
    specifications,
    outputDir
  });

  artifacts.push(...itemSpecs.artifacts);

  // ============================================================================
  // STEM WRITING
  // ============================================================================

  ctx.log('info', 'Writing item stems');
  const stemWriting = await ctx.task(stemWritingTask, {
    specifications: itemSpecs.specs,
    itemFormat,
    contentDomain,
    outputDir
  });

  artifacts.push(...stemWriting.artifacts);

  // ============================================================================
  // RESPONSE OPTIONS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Developing response options');
  const responseOptions = await ctx.task(responseOptionsDevelopmentTask, {
    stems: stemWriting.stems,
    itemFormat,
    specifications: itemSpecs.specs,
    outputDir
  });

  artifacts.push(...responseOptions.artifacts);

  // ============================================================================
  // ITEM ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Assembling complete items');
  const itemAssembly = await ctx.task(itemAssemblyTask, {
    stems: stemWriting.stems,
    responses: responseOptions.responses,
    itemFormat,
    outputDir
  });

  artifacts.push(...itemAssembly.artifacts);

  // ============================================================================
  // ITEM REVIEW
  // ============================================================================

  ctx.log('info', 'Reviewing items for quality');
  const itemReview = await ctx.task(itemReviewTask, {
    items: itemAssembly.items,
    specifications: itemSpecs.specs,
    outputDir
  });

  artifacts.push(...itemReview.artifacts);

  // ============================================================================
  // BIAS AND SENSITIVITY REVIEW
  // ============================================================================

  ctx.log('info', 'Conducting bias and sensitivity review');
  const biasReview = await ctx.task(biasSensitivityReviewTask, {
    items: itemAssembly.items,
    outputDir
  });

  artifacts.push(...biasReview.artifacts);

  // ============================================================================
  // ITEM BANK ORGANIZATION
  // ============================================================================

  ctx.log('info', 'Organizing item bank');
  const itemBank = await ctx.task(itemBankOrganizationTask, {
    items: itemReview.reviewedItems,
    biasReview: biasReview.report,
    contentDomain,
    outputDir
  });

  artifacts.push(...itemBank.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring item writing quality');
  const qualityScore = await ctx.task(itemWritingQualityScoringTask, {
    itemSpecs,
    stemWriting,
    responseOptions,
    itemReview,
    biasReview,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review items
  await ctx.breakpoint({
    question: `Item writing complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Item Writing Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        contentDomain,
        itemFormat,
        totalItems: itemAssembly.items?.length || 0,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contentDomain,
    itemFormat,
    qualityScore: overallScore,
    qualityMet,
    items: itemReview.reviewedItems,
    itemBank: itemBank.bank,
    qualityReport: {
      itemReview: itemReview.report,
      biasReview: biasReview.report
    },
    artifacts,
    duration,
    metadata: {
      processId: 'education/item-writing',
      timestamp: startTime,
      contentDomain,
      itemFormat,
      outputDir
    }
  };
}

// Task 1: Item Specification Development
export const itemSpecificationDevelopmentTask = defineTask('item-specification-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop detailed item specifications',
  agent: {
    name: 'item-specifier',
    prompt: {
      role: 'psychometrician and item developer',
      task: 'Develop detailed specifications for assessment items',
      context: args,
      instructions: [
        'Define item content boundaries',
        'Specify cognitive level using Bloom\'s taxonomy',
        'Determine item format requirements',
        'Define difficulty target',
        'Specify stimulus requirements',
        'Document response format specifications',
        'Define scoring criteria',
        'Note accessibility requirements',
        'Generate item specification document'
      ],
      outputFormat: 'JSON with specs, contentBoundaries, cognitiveTargets, formatRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['specs', 'artifacts'],
      properties: {
        specs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              specId: { type: 'string' },
              contentDescription: { type: 'string' },
              cognitiveLevel: { type: 'string' },
              format: { type: 'string' },
              difficultyTarget: { type: 'string' },
              stimulusType: { type: 'string' },
              responseFormat: { type: 'string' }
            }
          }
        },
        contentBoundaries: { type: 'object' },
        cognitiveTargets: { type: 'object' },
        formatRequirements: { type: 'object' },
        accessibilityRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'item-writing', 'specification', 'development']
}));

// Task 2: Stem Writing
export const stemWritingTask = defineTask('stem-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write item stems',
  agent: {
    name: 'stem-writer',
    prompt: {
      role: 'assessment item writer',
      task: 'Write clear, focused item stems',
      context: args,
      instructions: [
        'Write stems that present a single problem or question',
        'Use clear, concise language',
        'Avoid ambiguity and double negatives',
        'Include all necessary information in the stem',
        'Avoid irrelevant information (window dressing)',
        'Use appropriate reading level',
        'Format stems consistently',
        'Include stimulus materials where needed',
        'Generate stem document'
      ],
      outputFormat: 'JSON with stems, stimulusMaterials, readabilityCheck, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stems', 'artifacts'],
      properties: {
        stems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stemId: { type: 'string' },
              specId: { type: 'string' },
              stemText: { type: 'string' },
              stimulus: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        stimulusMaterials: { type: 'array' },
        readabilityCheck: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'item-writing', 'stems', 'writing']
}));

// Task 3: Response Options Development
export const responseOptionsDevelopmentTask = defineTask('response-options-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop response options',
  agent: {
    name: 'response-developer',
    prompt: {
      role: 'assessment response option specialist',
      task: 'Develop response options appropriate for item format',
      context: args,
      instructions: [
        'For MC: develop plausible distractors based on common errors',
        'For MC: ensure one clearly correct answer',
        'For MC: make options parallel in structure and length',
        'For CR: develop model responses',
        'For CR: define acceptable response variations',
        'Avoid grammatical cues to correct answer',
        'Randomize correct answer position',
        'Avoid "all of the above" and "none of the above"',
        'Generate response options document'
      ],
      outputFormat: 'JSON with responses, distractorRationale, modelResponses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['responses', 'artifacts'],
      properties: {
        responses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stemId: { type: 'string' },
              options: { type: 'array' },
              correctAnswer: { type: 'string' },
              modelResponse: { type: 'string' },
              scoringGuide: { type: 'object' }
            }
          }
        },
        distractorRationale: { type: 'array' },
        modelResponses: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'item-writing', 'responses', 'development']
}));

// Task 4: Item Assembly
export const itemAssemblyTask = defineTask('item-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble complete items',
  agent: {
    name: 'item-assembler',
    prompt: {
      role: 'assessment item assembler',
      task: 'Assemble stems and responses into complete items',
      context: args,
      instructions: [
        'Combine stems with response options',
        'Add item metadata (ID, domain, level)',
        'Format items consistently',
        'Add scoring information',
        'Include administration instructions',
        'Add accessibility tags',
        'Create both print and digital versions',
        'Generate item preview for review',
        'Generate assembled items document'
      ],
      outputFormat: 'JSON with items, metadata, formatting, versions, artifacts'
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
              stem: { type: 'string' },
              stimulus: { type: 'string' },
              options: { type: 'array' },
              correctAnswer: { type: 'string' },
              points: { type: 'number' },
              metadata: { type: 'object' }
            }
          }
        },
        metadata: { type: 'object' },
        formatting: { type: 'object' },
        versions: {
          type: 'object',
          properties: {
            print: { type: 'string' },
            digital: { type: 'string' }
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
  labels: ['agent', 'item-writing', 'assembly', 'formatting']
}));

// Task 5: Item Review
export const itemReviewTask = defineTask('item-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review items for quality',
  agent: {
    name: 'item-reviewer',
    prompt: {
      role: 'item review specialist',
      task: 'Review items against quality criteria',
      context: args,
      instructions: [
        'Check alignment with specifications',
        'Verify content accuracy',
        'Review cognitive level appropriateness',
        'Check for item writing flaws',
        'Verify scoring key accuracy',
        'Review distractor plausibility',
        'Check for cluing between items',
        'Document review findings',
        'Generate item review report'
      ],
      outputFormat: 'JSON with reviewedItems, report, issues, revisionNeeded, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewedItems', 'report', 'artifacts'],
      properties: {
        reviewedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              reviewStatus: { type: 'string' },
              qualityScore: { type: 'number' },
              issues: { type: 'array' },
              revisions: { type: 'array' }
            }
          }
        },
        report: {
          type: 'object',
          properties: {
            totalItems: { type: 'number' },
            passed: { type: 'number' },
            revisionNeeded: { type: 'number' },
            rejected: { type: 'number' }
          }
        },
        issues: { type: 'array' },
        revisionNeeded: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'item-writing', 'review', 'quality']
}));

// Task 6: Bias and Sensitivity Review
export const biasSensitivityReviewTask = defineTask('bias-sensitivity-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct bias and sensitivity review',
  agent: {
    name: 'bias-reviewer',
    prompt: {
      role: 'assessment fairness specialist',
      task: 'Review items for bias and sensitivity issues',
      context: args,
      instructions: [
        'Check for cultural bias',
        'Review for gender bias',
        'Check for socioeconomic bias',
        'Review for regional/geographic bias',
        'Check for disability-related bias',
        'Review for sensitive content',
        'Ensure diverse representation',
        'Document bias concerns',
        'Generate bias review report'
      ],
      outputFormat: 'JSON with report, flaggedItems, concerns, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'artifacts'],
      properties: {
        report: {
          type: 'object',
          properties: {
            totalReviewed: { type: 'number' },
            flagged: { type: 'number' },
            cleared: { type: 'number' }
          }
        },
        flaggedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              biasType: { type: 'string' },
              concern: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        concerns: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'item-writing', 'bias', 'sensitivity']
}));

// Task 7: Item Bank Organization
export const itemBankOrganizationTask = defineTask('item-bank-organization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Organize item bank',
  agent: {
    name: 'item-bank-organizer',
    prompt: {
      role: 'item bank manager',
      task: 'Organize items into searchable item bank',
      context: args,
      instructions: [
        'Create item classification system',
        'Tag items by content, cognitive level, format',
        'Assign difficulty estimates',
        'Track item usage history',
        'Create item search functionality specs',
        'Document item relationships',
        'Plan item rotation schedule',
        'Create item statistics tracking',
        'Generate item bank documentation'
      ],
      outputFormat: 'JSON with bank, classification, tagging, searchSpecs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bank', 'artifacts'],
      properties: {
        bank: {
          type: 'object',
          properties: {
            items: { type: 'array' },
            classification: { type: 'object' },
            statistics: { type: 'object' }
          }
        },
        classification: { type: 'object' },
        tagging: { type: 'object' },
        searchSpecs: { type: 'object' },
        rotationSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'item-writing', 'item-bank', 'organization']
}));

// Task 8: Quality Scoring
export const itemWritingQualityScoringTask = defineTask('item-writing-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score item writing quality',
  agent: {
    name: 'item-quality-auditor',
    prompt: {
      role: 'item writing quality auditor',
      task: 'Assess item writing process quality',
      context: args,
      instructions: [
        'Evaluate specification completeness (weight: 20%)',
        'Assess stem quality (weight: 25%)',
        'Review response option quality (weight: 25%)',
        'Evaluate item review thoroughness (weight: 15%)',
        'Assess bias review completeness (weight: 15%)',
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
            specificationQuality: { type: 'number' },
            stemQuality: { type: 'number' },
            responseQuality: { type: 'number' },
            reviewThoroughness: { type: 'number' },
            biasReview: { type: 'number' }
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
  labels: ['agent', 'item-writing', 'quality-scoring', 'validation']
}));
