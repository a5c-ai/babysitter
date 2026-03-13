/**
 * @process ux-ui-design/ux-writing
 * @description UX Writing and Microcopy Guidelines process covering voice & tone definition, content strategy, microcopy patterns, error messages, empty states, onboarding copy, button labels, content audit, and comprehensive guidelines documentation
 * @inputs { projectName: string, brandGuidelines: object, targetAudience: array, productType: string, existingCopy: array, contentGoals: array, toneAttributes: array, outputDir: string }
 * @outputs { success: boolean, voiceAndTone: object, microcopyCatalog: object, writingGuidelines: string, contentAuditReport: string, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    brandGuidelines = {},
    targetAudience = [],
    productType = 'web-app', // web-app, mobile-app, website, saas-platform, e-commerce
    existingCopy = [],
    contentGoals = [],
    toneAttributes = ['friendly', 'helpful', 'professional'],
    userPersonas = [],
    competitorExamples = [],
    outputDir = 'ux-writing-output',
    includeContentAudit = true,
    generateExamples = true,
    targetQualityScore = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting UX Writing and Microcopy Guidelines for ${projectName}`);

  // ============================================================================
  // PHASE 1: BRAND AND AUDIENCE RESEARCH
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing brand, audience, and content landscape');
  const brandAudienceAnalysis = await ctx.task(brandAudienceAnalysisTask, {
    projectName,
    brandGuidelines,
    targetAudience,
    userPersonas,
    competitorExamples,
    productType,
    outputDir
  });

  artifacts.push(...brandAudienceAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CONTENT STRATEGY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining content strategy and goals');
  const contentStrategy = await ctx.task(contentStrategyDefinitionTask, {
    projectName,
    brandAudienceAnalysis,
    contentGoals,
    productType,
    targetAudience,
    outputDir
  });

  artifacts.push(...contentStrategy.artifacts);

  // ============================================================================
  // PHASE 3: VOICE AND TONE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining brand voice and tone guidelines');
  const voiceAndTone = await ctx.task(voiceAndToneDefinitionTask, {
    projectName,
    brandGuidelines,
    brandAudienceAnalysis,
    toneAttributes,
    contentStrategy,
    productType,
    outputDir
  });

  artifacts.push(...voiceAndTone.artifacts);

  // Breakpoint: Review voice and tone before microcopy creation
  await ctx.breakpoint({
    question: `Voice and tone defined: ${voiceAndTone.voiceAttributes.join(', ')}. ${voiceAndTone.toneModulations} tone modulations created. Review before creating microcopy patterns?`,
    title: 'Voice and Tone Review',
    context: {
      runId: ctx.runId,
      files: [
        ...brandAudienceAnalysis.artifacts,
        ...contentStrategy.artifacts,
        ...voiceAndTone.artifacts
      ].map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || 'Voice & Tone'
      })),
      summary: {
        projectName,
        voiceAttributes: voiceAndTone.voiceAttributes,
        toneModulations: voiceAndTone.toneModulations,
        examplesProvided: voiceAndTone.examplesCount,
        dosAndDonts: voiceAndTone.dosAndDontsCount
      }
    }
  });

  // ============================================================================
  // PHASE 4: MICROCOPY PATTERNS DEVELOPMENT (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating microcopy patterns for common UI elements');

  const [errorMessages, emptyStates, buttonLabels] = await ctx.parallel.all([
    ctx.task(errorMessagePatternsTask, {
      projectName,
      voiceAndTone,
      contentStrategy,
      productType,
      generateExamples,
      outputDir
    }),
    ctx.task(emptyStatePatternsTask, {
      projectName,
      voiceAndTone,
      contentStrategy,
      productType,
      generateExamples,
      outputDir
    }),
    ctx.task(buttonLabelPatternsTask, {
      projectName,
      voiceAndTone,
      contentStrategy,
      productType,
      generateExamples,
      outputDir
    })
  ]);

  artifacts.push(...errorMessages.artifacts);
  artifacts.push(...emptyStates.artifacts);
  artifacts.push(...buttonLabels.artifacts);

  // ============================================================================
  // PHASE 5: ONBOARDING AND INSTRUCTIONAL COPY
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating onboarding and instructional copy patterns');
  const onboardingCopy = await ctx.task(onboardingCopyPatternsTask, {
    projectName,
    voiceAndTone,
    contentStrategy,
    productType,
    generateExamples,
    outputDir
  });

  artifacts.push(...onboardingCopy.artifacts);

  // ============================================================================
  // PHASE 6: FORM AND INPUT FIELD MICROCOPY
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating form and input field microcopy patterns');
  const formMicrocopy = await ctx.task(formMicrocopyPatternsTask, {
    projectName,
    voiceAndTone,
    contentStrategy,
    productType,
    generateExamples,
    outputDir
  });

  artifacts.push(...formMicrocopy.artifacts);

  // ============================================================================
  // PHASE 7: CONFIRMATION AND SUCCESS MESSAGES
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating confirmation and success message patterns');
  const confirmationMessages = await ctx.task(confirmationMessagePatternsTask, {
    projectName,
    voiceAndTone,
    contentStrategy,
    productType,
    generateExamples,
    outputDir
  });

  artifacts.push(...confirmationMessages.artifacts);

  // Breakpoint: Review microcopy patterns
  await ctx.breakpoint({
    question: `Microcopy patterns complete: ${errorMessages.patternCount} error patterns, ${emptyStates.patternCount} empty states, ${buttonLabels.patternCount} button labels, ${onboardingCopy.patternCount} onboarding patterns, ${formMicrocopy.patternCount} form patterns, ${confirmationMessages.patternCount} confirmation patterns. Review patterns?`,
    title: 'Microcopy Patterns Review',
    context: {
      runId: ctx.runId,
      files: [
        ...errorMessages.artifacts,
        ...emptyStates.artifacts,
        ...buttonLabels.artifacts,
        ...onboardingCopy.artifacts,
        ...formMicrocopy.artifacts,
        ...confirmationMessages.artifacts
      ].map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language,
        label: a.label || 'Microcopy Pattern'
      })),
      summary: {
        projectName,
        totalPatterns: errorMessages.patternCount + emptyStates.patternCount +
                      buttonLabels.patternCount + onboardingCopy.patternCount +
                      formMicrocopy.patternCount + confirmationMessages.patternCount,
        errorPatterns: errorMessages.patternCount,
        emptyStatePatterns: emptyStates.patternCount,
        buttonLabelPatterns: buttonLabels.patternCount,
        onboardingPatterns: onboardingCopy.patternCount,
        formPatterns: formMicrocopy.patternCount,
        confirmationPatterns: confirmationMessages.patternCount,
        examplesGenerated: generateExamples
      }
    }
  });

  // ============================================================================
  // PHASE 8: MICROCOPY CATALOG CONSOLIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Consolidating comprehensive microcopy catalog');
  const microcopyCatalog = await ctx.task(microcopyCatalogTask, {
    projectName,
    voiceAndTone,
    errorMessages,
    emptyStates,
    buttonLabels,
    onboardingCopy,
    formMicrocopy,
    confirmationMessages,
    outputDir
  });

  artifacts.push(...microcopyCatalog.artifacts);

  // ============================================================================
  // PHASE 9: CONTENT AUDIT (if requested)
  // ============================================================================

  let contentAudit = null;
  if (includeContentAudit && existingCopy.length > 0) {
    ctx.log('info', 'Phase 9: Auditing existing copy against new guidelines');
    contentAudit = await ctx.task(contentAuditTask, {
      projectName,
      existingCopy,
      voiceAndTone,
      microcopyCatalog,
      contentStrategy,
      outputDir
    });

    artifacts.push(...contentAudit.artifacts);
  }

  // ============================================================================
  // PHASE 10: WRITING PROCESS AND BEST PRACTICES
  // ============================================================================

  ctx.log('info', 'Phase 10: Documenting writing process and best practices');
  const writingBestPractices = await ctx.task(writingBestPracticesTask, {
    projectName,
    voiceAndTone,
    microcopyCatalog,
    productType,
    outputDir
  });

  artifacts.push(...writingBestPractices.artifacts);

  // ============================================================================
  // PHASE 11: ACCESSIBILITY AND INCLUSIVE LANGUAGE GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating accessibility and inclusive language guidelines');
  const accessibilityGuidelines = await ctx.task(accessibilityLanguageGuidelinesTask, {
    projectName,
    voiceAndTone,
    targetAudience,
    productType,
    outputDir
  });

  artifacts.push(...accessibilityGuidelines.artifacts);

  // ============================================================================
  // PHASE 12: LOCALIZATION AND INTERNATIONALIZATION CONSIDERATIONS
  // ============================================================================

  ctx.log('info', 'Phase 12: Documenting localization and internationalization guidelines');
  const localizationGuidelines = await ctx.task(localizationGuidelinesTask, {
    projectName,
    voiceAndTone,
    microcopyCatalog,
    productType,
    outputDir
  });

  artifacts.push(...localizationGuidelines.artifacts);

  // ============================================================================
  // PHASE 13: COMPREHENSIVE WRITING GUIDELINES DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating comprehensive UX writing guidelines document');
  const writingGuidelines = await ctx.task(writingGuidelinesDocumentTask, {
    projectName,
    brandAudienceAnalysis,
    contentStrategy,
    voiceAndTone,
    microcopyCatalog,
    writingBestPractices,
    accessibilityGuidelines,
    localizationGuidelines,
    contentAudit,
    outputDir
  });

  artifacts.push(...writingGuidelines.artifacts);

  // ============================================================================
  // PHASE 14: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Assessing guidelines quality and completeness');
  const qualityAssessment = await ctx.task(guidelinesQualityAssessmentTask, {
    projectName,
    voiceAndTone,
    microcopyCatalog,
    writingGuidelines,
    contentAudit,
    targetQualityScore,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityScore = qualityAssessment.overallScore;
  const qualityMet = qualityScore >= targetQualityScore;

  // Final Breakpoint: Review complete UX writing guidelines
  await ctx.breakpoint({
    question: `UX Writing Guidelines complete! Quality score: ${qualityScore}/100. ${qualityMet ? 'Guidelines meet quality standards!' : 'Guidelines may benefit from refinement.'} Review and approve final deliverables?`,
    title: 'UX Writing Guidelines Final Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        qualityMet,
        projectName,
        productType,
        totalArtifacts: artifacts.length,
        deliverables: {
          voiceAttributes: voiceAndTone.voiceAttributes.length,
          toneModulations: voiceAndTone.toneModulations,
          totalMicrocopyPatterns: microcopyCatalog.totalPatterns,
          contentAuditIssues: contentAudit ? contentAudit.issuesFound : 0,
          bestPracticesCount: writingBestPractices.bestPracticesCount,
          accessibilityGuidelinesCount: accessibilityGuidelines.guidelinesCount,
          examplesProvided: microcopyCatalog.examplesCount
        },
        qualityMetrics: {
          completenessScore: qualityAssessment.completenessScore,
          usabilityScore: qualityAssessment.usabilityScore,
          consistencyScore: qualityAssessment.consistencyScore,
          implementabilityScore: qualityAssessment.implementabilityScore
        }
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    productType,
    qualityScore,
    qualityMet,
    voiceAndTone: {
      voiceAttributes: voiceAndTone.voiceAttributes,
      toneModulations: voiceAndTone.toneModulations,
      documentPath: voiceAndTone.documentPath,
      examplesCount: voiceAndTone.examplesCount
    },
    contentStrategy: {
      goals: contentStrategy.strategyGoals,
      principles: contentStrategy.contentPrinciples,
      documentPath: contentStrategy.documentPath
    },
    microcopyCatalog: {
      totalPatterns: microcopyCatalog.totalPatterns,
      patternsByCategory: microcopyCatalog.patternsByCategory,
      catalogPath: microcopyCatalog.catalogPath,
      examplesCount: microcopyCatalog.examplesCount
    },
    writingGuidelines: writingGuidelines.masterDocumentPath,
    contentAuditReport: contentAudit ? contentAudit.reportPath : null,
    contentAuditResults: contentAudit ? {
      itemsAudited: contentAudit.itemsAudited,
      issuesFound: contentAudit.issuesFound,
      complianceScore: contentAudit.complianceScore,
      recommendationsCount: contentAudit.recommendations.length
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'ux-ui-design/ux-writing',
      timestamp: startTime,
      projectName,
      productType,
      outputDir,
      includeContentAudit,
      generateExamples
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Brand and Audience Analysis
export const brandAudienceAnalysisTask = defineTask('brand-audience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze brand, audience, and content landscape',
  agent: {
    name: 'brand-content-analyst',
    prompt: {
      role: 'content strategist and brand voice specialist',
      task: 'Analyze brand guidelines, target audience characteristics, user personas, and competitive landscape to establish foundation for UX writing guidelines',
      context: args,
      instructions: [
        'Review brand guidelines for existing voice, tone, and messaging principles',
        'Extract brand personality traits and values',
        'Analyze target audience demographics, psychographics, and behaviors',
        'Review user personas for language preferences, literacy levels, tech proficiency',
        'Identify audience pain points, motivations, and communication preferences',
        'Analyze competitor UX copy examples for tone, style, patterns',
        'Identify best practices and anti-patterns in competitive examples',
        'Document audience vocabulary: preferred terms, jargon level, formality',
        'Assess cultural considerations and diversity of audience',
        'Identify content literacy level (reading grade, technical expertise)',
        'Document key insights about brand-audience alignment',
        'Create brand and audience analysis report'
      ],
      outputFormat: 'JSON with brandPersonality (array), audienceCharacteristics (object), vocabularyPreferences (object), competitiveInsights (array), keyInsights (array), recommendedReadingLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['brandPersonality', 'audienceCharacteristics', 'keyInsights', 'artifacts'],
      properties: {
        brandPersonality: { type: 'array', items: { type: 'string' } },
        audienceCharacteristics: {
          type: 'object',
          properties: {
            demographics: { type: 'object' },
            psychographics: { type: 'array', items: { type: 'string' } },
            techProficiency: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
            literacyLevel: { type: 'string' }
          }
        },
        vocabularyPreferences: {
          type: 'object',
          properties: {
            preferredTerms: { type: 'array', items: { type: 'string' } },
            avoidTerms: { type: 'array', items: { type: 'string' } },
            jargonAcceptability: { type: 'string', enum: ['avoid', 'minimal', 'moderate', 'technical-ok'] },
            formalityLevel: { type: 'string', enum: ['very-casual', 'casual', 'professional', 'formal'] }
          }
        },
        competitiveInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              toneObservation: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyInsights: { type: 'array', items: { type: 'string' } },
        recommendedReadingLevel: { type: 'string' },
        culturalConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'brand-analysis']
}));

// Task 2: Content Strategy Definition
export const contentStrategyDefinitionTask = defineTask('content-strategy-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content strategy and goals',
  agent: {
    name: 'content-strategist',
    prompt: {
      role: 'senior content strategist',
      task: 'Define comprehensive content strategy including content goals, principles, governance model, and success metrics for UX writing',
      context: args,
      instructions: [
        'Align content strategy with business goals and user needs',
        'Define content goals: what content should accomplish (inform, guide, persuade, delight, support)',
        'Establish content principles (e.g., clear, concise, conversational, accurate, helpful)',
        'Define content hierarchy: what information is most important',
        'Establish content governance model: who writes, reviews, approves, maintains copy',
        'Define content lifecycle: creation, review, approval, publication, updates',
        'Plan content scalability: templates, patterns, reusable components',
        'Define success metrics: readability scores, user comprehension, task completion',
        'Establish quality criteria for UX copy',
        'Document content strategy with clear recommendations',
        'Create content strategy document'
      ],
      outputFormat: 'JSON with strategyGoals (array), contentPrinciples (array), governanceModel (object), successMetrics (array), qualityCriteria (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategyGoals', 'contentPrinciples', 'qualityCriteria', 'documentPath', 'artifacts'],
      properties: {
        strategyGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        contentPrinciples: { type: 'array', items: { type: 'string' } },
        governanceModel: {
          type: 'object',
          properties: {
            contentOwners: { type: 'array', items: { type: 'string' } },
            reviewProcess: { type: 'string' },
            approvalWorkflow: { type: 'string' }
          }
        },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        qualityCriteria: { type: 'array', items: { type: 'string' } },
        contentHierarchy: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'content-strategy']
}));

// Task 3: Voice and Tone Definition
export const voiceAndToneDefinitionTask = defineTask('voice-tone-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define brand voice and tone guidelines',
  agent: {
    name: 'voice-tone-designer',
    prompt: {
      role: 'brand voice specialist and UX writer',
      task: 'Define comprehensive voice and tone guidelines with clear voice attributes, tone modulations for different contexts, examples, and dos/don\'ts',
      context: args,
      instructions: [
        'Distinguish between voice (consistent personality) and tone (adaptive emotion)',
        'Define brand voice attributes (typically 3-5): e.g., friendly, professional, witty, empathetic, confident',
        'For each voice attribute, provide:',
        '  - Clear definition and what it means for copy',
        '  - Examples demonstrating the attribute',
        '  - Counter-examples (what to avoid)',
        'Define tone modulations for different contexts:',
        '  - Success states: celebratory, encouraging, positive',
        '  - Error states: apologetic, helpful, solution-focused (never blaming)',
        '  - Onboarding: welcoming, patient, encouraging',
        '  - Empty states: motivating, suggestive, helpful',
        '  - Critical actions: clear, direct, cautious',
        '  - Transactional: efficient, clear, reassuring',
        'Create voice and tone chart showing attribute spectrum',
        'Provide extensive before/after examples',
        'Include comprehensive dos and don\'ts list',
        'Address how voice/tone varies by channel (app, email, SMS, notifications)',
        'Generate voice and tone guidelines document'
      ],
      outputFormat: 'JSON with voiceAttributes (array), toneModulations (number), voiceChart (string), examplesCount (number), dosAndDontsCount (number), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['voiceAttributes', 'toneModulations', 'documentPath', 'artifacts'],
      properties: {
        voiceAttributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              attribute: { type: 'string' },
              definition: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              counterExamples: { type: 'array', items: { type: 'string' } },
              writingTechniques: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        toneModulations: { type: 'number' },
        toneByContext: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              context: { type: 'string' },
              toneAdjustment: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        voiceChart: { type: 'string' },
        examplesCount: { type: 'number' },
        dosAndDonts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              do: { type: 'array', items: { type: 'string' } },
              dont: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dosAndDontsCount: { type: 'number' },
        channelVariations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              adaptations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'voice-tone']
}));

// Task 4: Error Message Patterns
export const errorMessagePatternsTask = defineTask('error-message-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create error message patterns',
  agent: {
    name: 'error-message-specialist',
    prompt: {
      role: 'UX writer specializing in error messages and system feedback',
      task: 'Create comprehensive error message patterns covering validation errors, system errors, permission errors, with clear structure: what happened, why, how to fix',
      context: args,
      instructions: [
        'Create error message structure formula: [Acknowledge issue] + [Explain why] + [Provide solution]',
        'Error message principles:',
        '  - Be human, not robotic (avoid error codes as primary message)',
        '  - Never blame the user (use "we" not "you" for system errors)',
        '  - Be specific, not vague ("Email is already registered" not "Invalid input")',
        '  - Provide actionable next steps',
        '  - Use plain language, no jargon',
        '  - Keep tone helpful and solution-focused, never frustrated',
        'Create patterns for common error types:',
        '  - Form validation errors (required fields, format errors, length limits)',
        '  - Authentication errors (wrong password, locked account, expired session)',
        '  - Permission errors (access denied, insufficient privileges)',
        '  - System errors (500 errors, timeouts, connection failures)',
        '  - Not found errors (404, deleted items)',
        '  - Conflict errors (duplicate entries, concurrent edits)',
        '  - Rate limiting errors',
        'Include inline validation, error summary, and error page patterns',
        'Provide before/after examples for each pattern',
        'Document error message checklist',
        'Generate error message pattern library'
      ],
      outputFormat: 'JSON with patternCount, errorCategories (array), messageStructure (string), examples (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternCount', 'errorCategories', 'examples', 'documentPath', 'artifacts'],
      properties: {
        patternCount: { type: 'number' },
        errorCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              patterns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    errorType: { type: 'string' },
                    template: { type: 'string' },
                    goodExample: { type: 'string' },
                    badExample: { type: 'string' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        messageStructure: { type: 'string' },
        examples: { type: 'array' },
        errorMessagePrinciples: { type: 'array', items: { type: 'string' } },
        checklist: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'error-messages']
}));

// Task 5: Empty State Patterns
export const emptyStatePatternsTask = defineTask('empty-state-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create empty state patterns',
  agent: {
    name: 'empty-state-specialist',
    prompt: {
      role: 'UX writer specializing in empty states and motivational copy',
      task: 'Create empty state patterns for various scenarios: first-time use, no results, no data yet, deleted content, with motivating, actionable copy',
      context: args,
      instructions: [
        'Empty state copy structure: [Acknowledge state] + [Explain context] + [Motivate action]',
        'Empty state principles:',
        '  - Be encouraging, not discouraging (opportunity, not absence)',
        '  - Provide clear next steps with visible CTA',
        '  - Use illustrations or icons to reduce negative impact',
        '  - Match tone to user emotion (first-time: excited, no-results: helpful)',
        '  - Keep copy concise but friendly',
        'Create patterns for empty state types:',
        '  - First-time use: welcoming, encouraging, shows value ("Start your first project")',
        '  - No search results: helpful, suggests alternatives ("Try different keywords")',
        '  - No data yet: motivational, explains benefit ("Add items to see insights")',
        '  - Cleared/completed: celebratory ("You\'re all caught up!")',
        '  - Permissions issue: explanatory ("Ask your admin for access")',
        '  - Temporary state: reassuring ("Content is being processed")',
        '  - Error state: apologetic, helpful ("Something went wrong. Try again")',
        'Include headline, body, and CTA copy for each pattern',
        'Provide contextual examples for different product areas',
        'Generate empty state pattern library'
      ],
      outputFormat: 'JSON with patternCount, emptyStateTypes (array), copyStructure (string), examples (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternCount', 'emptyStateTypes', 'examples', 'documentPath', 'artifacts'],
      properties: {
        patternCount: { type: 'number' },
        emptyStateTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              scenarios: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenario: { type: 'string' },
                    headline: { type: 'string' },
                    body: { type: 'string' },
                    ctaText: { type: 'string' },
                    tone: { type: 'string' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        copyStructure: { type: 'string' },
        examples: { type: 'array' },
        emptyStatePrinciples: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'empty-states']
}));

// Task 6: Button Label Patterns
export const buttonLabelPatternsTask = defineTask('button-label-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create button and CTA label patterns',
  agent: {
    name: 'button-label-specialist',
    prompt: {
      role: 'UX writer specializing in CTAs and action-oriented microcopy',
      task: 'Create comprehensive button label patterns for primary, secondary, and destructive actions with clear, action-oriented, specific labels',
      context: args,
      instructions: [
        'Button label principles:',
        '  - Use action verbs (imperative mood): "Save changes" not "Changes are saved"',
        '  - Be specific about outcome: "Send message" not "Submit"',
        '  - Front-load important words: "Delete account" not "Account deletion"',
        '  - Keep concise (1-3 words ideal, max 5 words)',
        '  - Use sentence case, not title case',
        '  - Avoid generic labels: "OK", "Submit", "Click here"',
        '  - Match button importance to label strength (primary vs secondary)',
        'Create patterns for action types:',
        '  - Primary actions: positive, encouraging ("Get started", "Create account")',
        '  - Secondary actions: neutral, supportive ("Cancel", "Go back", "Learn more")',
        '  - Destructive actions: clear, cautious ("Delete forever", "Remove access")',
        '  - Confirmation actions: explicit outcome ("Yes, delete project")',
        '  - Loading states: reassuring ("Saving...", "Processing...")',
        '  - Success states: celebratory ("Done!", "Message sent")',
        'Provide context-specific examples:',
        '  - Forms (Save, Cancel, Next, Previous)',
        '  - Onboarding (Skip, Get started, Continue)',
        '  - E-commerce (Add to cart, Buy now, Checkout)',
        '  - Social actions (Follow, Like, Share, Comment)',
        'Include progressive disclosure patterns ("Show more", "Expand all")',
        'Document button label checklist and anti-patterns',
        'Generate button label pattern library'
      ],
      outputFormat: 'JSON with patternCount, actionTypes (array), labelPrinciples (array), examples (array), antiPatterns (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternCount', 'actionTypes', 'examples', 'documentPath', 'artifacts'],
      properties: {
        patternCount: { type: 'number' },
        actionTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              buttonStyle: { type: 'string', enum: ['primary', 'secondary', 'destructive', 'ghost', 'link'] },
              patterns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    context: { type: 'string' },
                    recommendedLabel: { type: 'string' },
                    alternatives: { type: 'array', items: { type: 'string' } },
                    avoidLabels: { type: 'array', items: { type: 'string' } },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        labelPrinciples: { type: 'array', items: { type: 'string' } },
        examples: { type: 'array' },
        antiPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              badLabel: { type: 'string' },
              problem: { type: 'string' },
              betterLabel: { type: 'string' }
            }
          }
        },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'button-labels']
}));

// Task 7: Onboarding Copy Patterns
export const onboardingCopyPatternsTask = defineTask('onboarding-copy-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create onboarding and instructional copy patterns',
  agent: {
    name: 'onboarding-copy-specialist',
    prompt: {
      role: 'UX writer specializing in onboarding and educational content',
      task: 'Create onboarding copy patterns including welcome messages, tooltips, coach marks, progressive disclosure, and instructional microcopy that educate without overwhelming',
      context: args,
      instructions: [
        'Onboarding copy principles:',
        '  - Show value before asking for effort',
        '  - Progressive disclosure: show what\'s needed when it\'s needed',
        '  - Focus on benefits, not features ("Save time" vs "Keyboard shortcuts available")',
        '  - Keep steps small and achievable',
        '  - Celebrate progress and completion',
        '  - Allow users to skip or defer (respect their time)',
        '  - Use "you" to make it personal',
        'Create patterns for onboarding elements:',
        '  - Welcome screens: set expectations, show value proposition',
        '  - Setup wizards: clear steps, progress indicators, helpful tips',
        '  - Tooltips: context-sensitive, concise (1-2 sentences), closable',
        '  - Coach marks: highlight key features, explain benefit, non-intrusive',
        '  - Empty state CTAs: guide first action, explain benefit',
        '  - Progress indicators: encourage continuation ("2 of 5 complete")',
        '  - Completion messages: celebrate, suggest next steps',
        'Create instructional microcopy patterns:',
        '  - Help text: when to show, how to phrase',
        '  - Placeholder text: examples vs instructions',
        '  - Inline hints: character limits, format requirements',
        '  - Contextual help: modal content, documentation links',
        'Address micro-learning: feature discovery over time',
        'Include permission request copy (camera, location, notifications)',
        'Generate onboarding copy pattern library'
      ],
      outputFormat: 'JSON with patternCount, onboardingElements (array), instructionalPatterns (array), examples (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternCount', 'onboardingElements', 'examples', 'documentPath', 'artifacts'],
      properties: {
        patternCount: { type: 'number' },
        onboardingElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              purpose: { type: 'string' },
              patterns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenario: { type: 'string' },
                    copyExample: { type: 'string' },
                    bestPractices: { type: 'array', items: { type: 'string' } },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        instructionalPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              whenToUse: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              guidelines: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        examples: { type: 'array' },
        onboardingPrinciples: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'onboarding']
}));

// Task 8: Form and Input Microcopy
export const formMicrocopyPatternsTask = defineTask('form-microcopy-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create form and input field microcopy patterns',
  agent: {
    name: 'form-copy-specialist',
    prompt: {
      role: 'UX writer specializing in forms and data entry',
      task: 'Create comprehensive form microcopy patterns including labels, placeholders, help text, validation messages, and instructions that guide users through data entry',
      context: args,
      instructions: [
        'Form microcopy principles:',
        '  - Labels: clear, concise nouns ("Email address" not "Email")',
        '  - Placeholders: show format examples, not instructions (use help text for instructions)',
        '  - Help text: explain why info is needed, how it will be used',
        '  - Required vs optional: mark optional fields, assume required is default',
        '  - Inline validation: immediate feedback, specific guidance',
        '  - Character/word limits: show before limit is reached',
        '  - Format requirements: explain upfront, not after error',
        'Create patterns for form elements:',
        '  - Text inputs: labels, placeholders, help text, format examples',
        '  - Email inputs: format guidance, common error prevention',
        '  - Password inputs: requirements, strength feedback, show/hide toggle',
        '  - Phone inputs: format examples for international support',
        '  - Date inputs: format guidance, relative vs absolute dates',
        '  - Dropdowns: default options, search hints',
        '  - Checkboxes and radio buttons: clear option labels, legal copy',
        '  - File uploads: accepted formats, size limits, upload progress',
        '  - Multi-step forms: progress indication, save progress, navigation',
        'Create validation message patterns:',
        '  - Real-time validation timing (when to show)',
        '  - Inline validation messages',
        '  - Error summary patterns',
        '  - Success confirmation patterns',
        'Include GDPR and privacy-related copy patterns',
        'Generate form microcopy pattern library'
      ],
      outputFormat: 'JSON with patternCount, formElements (array), validationPatterns (array), examples (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternCount', 'formElements', 'examples', 'documentPath', 'artifacts'],
      properties: {
        patternCount: { type: 'number' },
        formElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              elementType: { type: 'string' },
              copyComponents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    component: { type: 'string' },
                    guidelines: { type: 'array', items: { type: 'string' } },
                    examples: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        },
        validationPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              validationType: { type: 'string' },
              timing: { type: 'string' },
              messageTemplate: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        examples: { type: 'array' },
        formMicrocopyPrinciples: { type: 'array', items: { type: 'string' } },
        privacyPatterns: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'form-microcopy']
}));

// Task 9: Confirmation and Success Messages
export const confirmationMessagePatternsTask = defineTask('confirmation-message-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create confirmation and success message patterns',
  agent: {
    name: 'confirmation-message-specialist',
    prompt: {
      role: 'UX writer specializing in system feedback and confirmations',
      task: 'Create patterns for confirmation dialogs, success messages, toast notifications, and system feedback that clearly communicate outcomes and next steps',
      context: args,
      instructions: [
        'Confirmation dialog principles:',
        '  - Be specific about action and consequence',
        '  - Ask explicit question ("Delete 23 files?" not "Are you sure?")',
        '  - Explain impact, especially for destructive actions',
        '  - Use clear, explicit button labels ("Yes, delete" not "OK")',
        '  - Provide escape route for accidental clicks',
        '  - Match severity to action (destructive = more cautious tone)',
        'Success message principles:',
        '  - Confirm what just happened with specific details',
        '  - Celebrate meaningful achievements (not routine actions)',
        '  - Suggest relevant next steps',
        '  - Include undo option when applicable',
        '  - Use appropriate tone (enthusiastic for big wins, neutral for routine)',
        'Create patterns for confirmation types:',
        '  - Destructive confirmations: delete, remove, deactivate',
        '  - Commitment confirmations: publish, send, pay',
        '  - Navigation confirmations: leave without saving, discard changes',
        '  - Bulk action confirmations: select all, batch operations',
        'Create patterns for success feedback:',
        '  - Toast notifications: brief, auto-dismiss, action-specific',
        '  - Success pages: celebrate, summarize, guide next steps',
        '  - Inline success: checkmarks, green highlights, confirmation text',
        '  - Email confirmations: recap action, provide details, next steps',
        'Create patterns for loading and progress:',
        '  - Loading states: manage expectations, show progress',
        '  - Long operations: explain what\'s happening, time estimates',
        '  - Background processing: keep user updated without blocking',
        'Generate confirmation and success message pattern library'
      ],
      outputFormat: 'JSON with patternCount, confirmationTypes (array), successPatterns (array), examples (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternCount', 'confirmationTypes', 'successPatterns', 'documentPath', 'artifacts'],
      properties: {
        patternCount: { type: 'number' },
        confirmationTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              patterns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    scenario: { type: 'string' },
                    headline: { type: 'string' },
                    body: { type: 'string' },
                    primaryButton: { type: 'string' },
                    secondaryButton: { type: 'string' },
                    notes: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        successPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              whenToUse: { type: 'string' },
              patterns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    action: { type: 'string' },
                    messageExample: { type: 'string' },
                    tone: { type: 'string' },
                    includesNextSteps: { type: 'boolean' }
                  }
                }
              }
            }
          }
        },
        examples: { type: 'array' },
        loadingPatterns: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'confirmation-messages']
}));

// Task 10: Microcopy Catalog Consolidation
export const microcopyCatalogTask = defineTask('microcopy-catalog', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consolidate comprehensive microcopy catalog',
  agent: {
    name: 'microcopy-cataloger',
    prompt: {
      role: 'content designer and information architect',
      task: 'Consolidate all microcopy patterns into comprehensive, searchable catalog organized by UI pattern and use case with cross-references and examples',
      context: args,
      instructions: [
        'Organize microcopy patterns into comprehensive catalog structure:',
        '  - Error messages section with all patterns',
        '  - Empty states section',
        '  - Button labels section',
        '  - Onboarding section',
        '  - Form microcopy section',
        '  - Confirmation and success messages section',
        'Create catalog organization:',
        '  - Organized by UI component/pattern',
        '  - Searchable by keyword and scenario',
        '  - Tagged by tone, context, action type',
        '  - Cross-referenced between related patterns',
        'For each pattern entry include:',
        '  - Pattern name and description',
        '  - When to use / when not to use',
        '  - Copy template or formula',
        '  - Multiple real examples',
        '  - Dos and don\'ts',
        '  - Tone guidance',
        '  - Related patterns (cross-references)',
        '  - Implementation notes',
        'Create pattern index and quick reference guide',
        'Include pattern decision tree or flowchart',
        'Add search functionality guidance',
        'Generate comprehensive microcopy catalog document',
        'Create separate quick reference sheet for designers/developers'
      ],
      outputFormat: 'JSON with totalPatterns, patternsByCategory (object), catalogPath, examplesCount, quickReferencePath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalPatterns', 'patternsByCategory', 'catalogPath', 'artifacts'],
      properties: {
        totalPatterns: { type: 'number' },
        patternsByCategory: {
          type: 'object',
          properties: {
            errorMessages: { type: 'number' },
            emptyStates: { type: 'number' },
            buttonLabels: { type: 'number' },
            onboarding: { type: 'number' },
            formMicrocopy: { type: 'number' },
            confirmations: { type: 'number' },
            other: { type: 'number' }
          }
        },
        catalogPath: { type: 'string' },
        examplesCount: { type: 'number' },
        organizationStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              subcategories: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickReferencePath: { type: 'string' },
        patternIndexPath: { type: 'string' },
        searchGuidance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'microcopy-catalog']
}));

// Task 11: Content Audit
export const contentAuditTask = defineTask('content-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit existing copy against new guidelines',
  agent: {
    name: 'content-auditor',
    prompt: {
      role: 'content strategist and UX writer',
      task: 'Audit existing copy against new voice, tone, and microcopy guidelines to identify inconsistencies, issues, and opportunities for improvement',
      context: args,
      instructions: [
        'Review all existing copy items provided',
        'Evaluate each item against guidelines:',
        '  - Voice alignment: does it match defined voice attributes?',
        '  - Tone appropriateness: right tone for context?',
        '  - Pattern compliance: follows microcopy patterns?',
        '  - Clarity: understandable and unambiguous?',
        '  - Conciseness: no unnecessary words?',
        '  - Actionability: clear next steps where needed?',
        '  - Accessibility: plain language, reading level appropriate?',
        '  - Inclusivity: avoids problematic language?',
        'Flag issues by severity:',
        '  - Critical: confusing, incorrect, or offensive content',
        '  - High: significantly off-brand or unclear',
        '  - Medium: minor voice/tone inconsistencies',
        '  - Low: opportunities for improvement',
        'Categorize issues by type: voice, tone, clarity, pattern, accessibility, etc.',
        'For each issue, provide:',
        '  - Current copy',
        '  - Problem description',
        '  - Recommended replacement',
        '  - Rationale referencing guidelines',
        'Calculate compliance score by category',
        'Prioritize updates using impact vs effort matrix',
        'Provide summary statistics and recommendations',
        'Generate comprehensive content audit report'
      ],
      outputFormat: 'JSON with itemsAudited, issuesFound, complianceScore (0-100), issuesBySeverity (object), issuesByType (object), recommendations (array), reportPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['itemsAudited', 'issuesFound', 'complianceScore', 'recommendations', 'reportPath', 'artifacts'],
      properties: {
        itemsAudited: { type: 'number' },
        issuesFound: { type: 'number' },
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        issuesBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        issuesByType: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        detailedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              currentCopy: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              recommendedCopy: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        complianceByCategory: {
          type: 'object',
          properties: {
            voiceAlignment: { type: 'number' },
            toneAppropriate: { type: 'number' },
            patternCompliance: { type: 'number' },
            clarity: { type: 'number' },
            accessibility: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'content-audit']
}));

// Task 12: Writing Process and Best Practices
export const writingBestPracticesTask = defineTask('writing-best-practices', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document writing process and best practices',
  agent: {
    name: 'writing-process-specialist',
    prompt: {
      role: 'senior UX writer and content operations expert',
      task: 'Document UX writing process, workflow, best practices, review criteria, and quality checklist for consistent content creation',
      context: args,
      instructions: [
        'Document UX writing workflow:',
        '  - Kickoff: requirements gathering, user research review, context understanding',
        '  - Drafting: ideation, multiple options, voice/tone application',
        '  - Review: peer review, stakeholder review, legal/compliance review',
        '  - Testing: usability testing, A/B testing microcopy variations',
        '  - Implementation: handoff to design/dev, QA review',
        '  - Iteration: analytics review, user feedback integration',
        'Document writing best practices:',
        '  - Front-loading: put important info first',
        '  - Scanning: use formatting, bullets, bold for scannability',
        '  - Active voice: "We sent your message" not "Your message was sent"',
        '  - Present tense: "Saving..." not "Will save..."',
        '  - Positive framing: what users can do, not what they can\'t',
        '  - Contractions: use naturally (don\'t, you\'ll, we\'re) for friendly tone',
        '  - Second person: use "you" and "your" to personalize',
        '  - Plain language: avoid jargon, explain technical terms',
        '  - Consistency: use same terms for same concepts',
        '  - Brevity: every word should earn its place',
        'Create copy review checklist covering:',
        '  - Voice and tone alignment',
        '  - Clarity and comprehension',
        '  - Grammar and mechanics',
        '  - Accessibility and inclusive language',
        '  - Pattern compliance',
        '  - Localization readiness',
        'Include guidance on copy testing methods',
        'Document tools and resources for UX writers',
        'Generate writing best practices document'
      ],
      outputFormat: 'JSON with bestPracticesCount, workflow (object), reviewChecklist (array), testingMethods (array), toolsRecommended (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bestPracticesCount', 'workflow', 'reviewChecklist', 'documentPath', 'artifacts'],
      properties: {
        bestPracticesCount: { type: 'number' },
        workflow: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } },
                  deliverables: { type: 'array', items: { type: 'string' } },
                  stakeholders: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        bestPractices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              description: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' }
            }
          }
        },
        reviewChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              checkpoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        testingMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              whenToUse: { type: 'string' },
              howTo: { type: 'string' }
            }
          }
        },
        toolsRecommended: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'best-practices']
}));

// Task 13: Accessibility and Inclusive Language Guidelines
export const accessibilityLanguageGuidelinesTask = defineTask('accessibility-inclusive-language', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create accessibility and inclusive language guidelines',
  agent: {
    name: 'accessibility-language-specialist',
    prompt: {
      role: 'accessibility expert and inclusive language consultant',
      task: 'Create comprehensive guidelines for accessible, inclusive language covering plain language, reading level, screen reader optimization, and inclusive terminology',
      context: args,
      instructions: [
        'Plain language guidelines:',
        '  - Target reading level: 8th grade or lower for general audiences',
        '  - Short sentences: average 15-20 words',
        '  - Short paragraphs: 3-5 sentences',
        '  - Common words: choose familiar over sophisticated',
        '  - Concrete language: specific over abstract',
        '  - Active voice: subject performs action',
        '  - Bulleted lists: for multiple items or steps',
        'Screen reader optimization:',
        '  - Meaningful link text: "Download the report" not "Click here"',
        '  - Descriptive headings: convey content hierarchy',
        '  - Alt text principles: describe content and function',
        '  - ARIA labels: when to use, how to write',
        '  - Avoid directional language: "above", "below", "right" (screen reader users can\'t see)',
        '  - Emoji and emoticons: used sparingly with text alternatives',
        'Inclusive language guidelines:',
        '  - Gender-neutral language: "they/them", "folks", "people" instead of gendered terms',
        '  - Person-first language: consider context and preferences',
        '  - Avoid ableist language: remove "crazy", "insane", "lame", etc.',
        '  - Cultural sensitivity: avoid idioms that don\'t translate',
        '  - Avoid assumptions about technical ability, age, income, location',
        '  - Respectful terminology for identity (race, ethnicity, religion, orientation)',
        'International considerations:',
        '  - Avoid culturally-specific references',
        '  - Date/time formats vary by locale',
        '  - Currency and measurements',
        '  - Icons and colors have different meanings',
        'Create terminology replacement guide (problematic → inclusive)',
        'Document when to use person-first vs identity-first language',
        'Generate accessibility and inclusive language guidelines document'
      ],
      outputFormat: 'JSON with guidelinesCount, plainLanguagePrinciples (array), screenReaderGuidelines (array), inclusiveTerminology (object), terminologyReplacements (array), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelinesCount', 'plainLanguagePrinciples', 'inclusiveTerminology', 'documentPath', 'artifacts'],
      properties: {
        guidelinesCount: { type: 'number' },
        plainLanguagePrinciples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              explanation: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        targetReadingLevel: { type: 'string' },
        screenReaderGuidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              guideline: { type: 'string' },
              rationale: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        inclusiveTerminology: {
          type: 'object',
          properties: {
            genderNeutral: { type: 'array', items: { type: 'string' } },
            personFirst: { type: 'array', items: { type: 'string' } },
            culturalSensitivity: { type: 'array', items: { type: 'string' } }
          }
        },
        terminologyReplacements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              avoid: { type: 'string' },
              use: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        internationalConsiderations: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'accessibility', 'inclusive-language']
}));

// Task 14: Localization and Internationalization Guidelines
export const localizationGuidelinesTask = defineTask('localization-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document localization and internationalization guidelines',
  agent: {
    name: 'localization-specialist',
    prompt: {
      role: 'localization expert and international content strategist',
      task: 'Create guidelines for localization-ready copy including string management, translation considerations, cultural adaptation, and internationalization best practices',
      context: args,
      instructions: [
        'Localization-ready writing principles:',
        '  - Write complete sentences: avoid fragments that are hard to translate',
        '  - Avoid concatenation: don\'t build sentences from separate strings',
        '  - No string reuse: same English string may need different translations in different contexts',
        '  - Allow space expansion: translated text can be 30-50% longer',
        '  - Avoid wordplay, idioms, metaphors: they rarely translate',
        '  - No embedded formatting: keep formatting separate from translatable strings',
        '  - Avoid cultural references: holidays, sports, pop culture',
        'String management guidelines:',
        '  - Unique string IDs for each piece of copy',
        '  - Context notes for translators (where used, tone, constraints)',
        '  - Character limits documented',
        '  - Screenshots provided for UI strings',
        '  - Glossary of product-specific terms',
        'Translation considerations:',
        '  - Variables and placeholders: use clear, descriptive names',
        '  - Pluralization: not just singular/plural, some languages have more forms',
        '  - Gender agreement: some languages require gendered articles/adjectives',
        '  - Right-to-left (RTL) languages: text direction changes',
        '  - Date/time formats: vary by locale',
        '  - Number formats: decimal separators, digit grouping',
        '  - Currency: symbol position, decimal places',
        'Cultural adaptation:',
        '  - Images and icons may need localization',
        '  - Color meanings vary by culture',
        '  - Formality levels differ by language/culture',
        '  - Names and address formats vary',
        'Testing guidelines:',
        '  - Pseudo-localization for expansion testing',
        '  - In-context review by native speakers',
        '  - Functional testing in target locales',
        'Generate localization and internationalization guidelines document'
      ],
      outputFormat: 'JSON with localizationPrinciples (array), stringManagementGuidelines (array), translationConsiderations (object), culturalAdaptations (array), testingApproach (string), documentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['localizationPrinciples', 'stringManagementGuidelines', 'documentPath', 'artifacts'],
      properties: {
        localizationPrinciples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              explanation: { type: 'string' },
              goodExample: { type: 'string' },
              badExample: { type: 'string' }
            }
          }
        },
        stringManagementGuidelines: { type: 'array', items: { type: 'string' } },
        translationConsiderations: {
          type: 'object',
          properties: {
            variablesAndPlaceholders: { type: 'array', items: { type: 'string' } },
            pluralization: { type: 'array', items: { type: 'string' } },
            genderAgreement: { type: 'array', items: { type: 'string' } },
            rtlSupport: { type: 'array', items: { type: 'string' } }
          }
        },
        formatConsiderations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              considerations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        culturalAdaptations: { type: 'array', items: { type: 'string' } },
        testingApproach: { type: 'string' },
        commonPitfalls: { type: 'array', items: { type: 'string' } },
        documentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'localization', 'internationalization']
}));

// Task 15: Comprehensive Writing Guidelines Document
export const writingGuidelinesDocumentTask = defineTask('writing-guidelines-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive UX writing guidelines document',
  agent: {
    name: 'guidelines-documentation-specialist',
    prompt: {
      role: 'technical writer and content strategist',
      task: 'Create comprehensive, well-organized UX writing guidelines master document consolidating all sections with clear navigation, examples, and actionable guidance',
      context: args,
      instructions: [
        'Create master UX writing guidelines document with sections:',
        '1. Executive Summary:',
        '   - Purpose of guidelines',
        '   - Who should use them',
        '   - How to use them',
        '   - Key principles overview',
        '2. Brand and Audience:',
        '   - Brand personality and values',
        '   - Target audience characteristics',
        '   - Content strategy goals',
        '3. Voice and Tone:',
        '   - Voice definition and attributes',
        '   - Tone modulations by context',
        '   - Voice and tone chart',
        '   - Examples and counter-examples',
        '4. Microcopy Patterns Catalog:',
        '   - Error messages',
        '   - Empty states',
        '   - Button labels',
        '   - Onboarding copy',
        '   - Form microcopy',
        '   - Confirmations and success messages',
        '   - Each with templates, examples, guidelines',
        '5. Writing Best Practices:',
        '   - Writing process and workflow',
        '   - Style and mechanics',
        '   - Review checklist',
        '   - Testing methods',
        '6. Accessibility and Inclusive Language:',
        '   - Plain language guidelines',
        '   - Screen reader optimization',
        '   - Inclusive terminology',
        '   - Terminology replacements',
        '7. Localization and Internationalization:',
        '   - Localization-ready writing',
        '   - String management',
        '   - Translation considerations',
        '   - Cultural adaptations',
        '8. Content Audit Results (if applicable):',
        '   - Audit findings summary',
        '   - Priority updates needed',
        '   - Implementation plan',
        '9. Appendices:',
        '   - Quick reference guide',
        '   - Glossary of terms',
        '   - Resources and tools',
        '   - FAQs',
        'Include comprehensive table of contents with page/section links',
        'Add search-friendly headings and clear hierarchy',
        'Use consistent formatting throughout',
        'Include practical examples on every page',
        'Make document actionable for designers, writers, developers',
        'Format as professional, scannable Markdown document',
        'Generate master guidelines document'
      ],
      outputFormat: 'JSON with masterDocumentPath, executiveSummary, sectionsCompleted (array), totalPages, examplesIncluded, quickReferencePath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['masterDocumentPath', 'executiveSummary', 'sectionsCompleted', 'artifacts'],
      properties: {
        masterDocumentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sectionsCompleted: { type: 'array', items: { type: 'string' } },
        totalPages: { type: 'number' },
        examplesIncluded: { type: 'number' },
        tableOfContents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              subsections: { type: 'array', items: { type: 'string' } },
              pageNumber: { type: 'number' }
            }
          }
        },
        quickReferencePath: { type: 'string' },
        glossaryPath: { type: 'string' },
        keyTakeaways: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'documentation']
}));

// Task 16: Guidelines Quality Assessment
export const guidelinesQualityAssessmentTask = defineTask('guidelines-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess guidelines quality and completeness',
  agent: {
    name: 'guidelines-quality-assessor',
    prompt: {
      role: 'principal UX writer and content quality auditor',
      task: 'Assess comprehensive quality of UX writing guidelines against best practices, validate completeness, usability, consistency, and implementability',
      context: args,
      instructions: [
        'Assess Voice and Tone quality (weight: 20%):',
        '  - Clear, distinctive voice definition?',
        '  - Appropriate tone modulations for contexts?',
        '  - Sufficient examples and counter-examples?',
        '  - Aligned with brand and audience?',
        'Assess Microcopy Catalog completeness (weight: 25%):',
        '  - All essential UI patterns covered?',
        '  - Clear templates and formulas provided?',
        '  - Sufficient real-world examples?',
        '  - Organized and searchable?',
        'Assess Best Practices quality (weight: 15%):',
        '  - Clear writing process defined?',
        '  - Comprehensive checklist provided?',
        '  - Testing methods documented?',
        '  - Actionable and practical?',
        'Assess Accessibility and Inclusivity (weight: 15%):',
        '  - Plain language guidelines clear?',
        '  - Screen reader considerations covered?',
        '  - Inclusive language guidance comprehensive?',
        '  - Terminology replacements provided?',
        'Assess Localization readiness (weight: 10%):',
        '  - Localization principles clear?',
        '  - String management guidance provided?',
        '  - Translation considerations documented?',
        'Assess Overall Usability (weight: 15%):',
        '  - Well-organized and navigable?',
        '  - Examples help understanding?',
        '  - Quick reference provided?',
        '  - Implementable by target audience?',
        'Calculate weighted overall score (0-100)',
        'Identify strengths and gaps',
        'Provide specific improvement recommendations',
        'Validate readiness for team adoption'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores (object), completenessScore, usabilityScore, consistencyScore, implementabilityScore, strengths (array), gaps (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'completenessScore', 'usabilityScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            voiceAndTone: { type: 'number' },
            microcopyCatalog: { type: 'number' },
            bestPractices: { type: 'number' },
            accessibility: { type: 'number' },
            localization: { type: 'number' },
            usability: { type: 'number' }
          }
        },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        usabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        consistencyScore: { type: 'number', minimum: 0, maximum: 100 },
        implementabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        coverageAnalysis: {
          type: 'object',
          properties: {
            uiPatternsCount: { type: 'number' },
            examplesCount: { type: 'number' },
            missingPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' }
            }
          }
        },
        readinessForAdoption: { type: 'string', enum: ['ready', 'minor-gaps', 'needs-work'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ux-writing', 'quality-assessment']
}));
