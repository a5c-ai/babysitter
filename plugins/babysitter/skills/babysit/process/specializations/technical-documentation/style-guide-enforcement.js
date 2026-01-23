/**
 * @process specializations/technical-documentation/style-guide-enforcement
 * @description Style Guide Creation and Enforcement process with style guide development, automated enforcement rules, quality checks, and continuous improvement workflow
 * @specialization Technical Documentation
 * @category Style & Standards
 * @inputs { organization: string, existingStyleGuide: string, documentationTypes: array, targetAudience: string, outputDir: string, enforcementLevel: string, automationTools: array }
 * @outputs { success: boolean, styleGuidePath: string, enforcementRules: array, qualityScore: number, artifacts: array, metadata: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization = '',
    existingStyleGuide = '',
    documentationTypes = ['api', 'user-guides', 'technical-specs', 'tutorials'],
    targetAudience = 'developers',
    outputDir = 'style-guide-output',
    enforcementLevel = 'moderate', // strict, moderate, advisory
    automationTools = ['vale', 'markdownlint', 'write-good'],
    includeExamples = true,
    requireApproval = true,
    framework = 'microsoft' // microsoft, google, custom
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Style Guide Creation and Enforcement Process');

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and defining scope');
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    organization,
    existingStyleGuide,
    documentationTypes,
    targetAudience,
    framework,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  if (!requirementsAnalysis.hasAdequateContext) {
    ctx.log('warn', 'Insufficient context to create comprehensive style guide');
    return {
      success: false,
      reason: 'Insufficient context',
      missingInformation: requirementsAnalysis.missingInformation,
      recommendations: requirementsAnalysis.recommendations,
      metadata: {
        processId: 'specializations/technical-documentation/style-guide-enforcement',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: STYLE GUIDE FRAMEWORK SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting and customizing style guide framework');
  const frameworkSelection = await ctx.task(frameworkSelectionTask, {
    framework,
    organization,
    documentationTypes,
    targetAudience,
    existingStyleGuide,
    industryStandards: requirementsAnalysis.industryStandards || [],
    outputDir
  });

  artifacts.push(...frameworkSelection.artifacts);

  // ============================================================================
  // PHASE 3: CORE STYLE GUIDE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing core style guide content');
  const [grammarRules, voiceTone, terminology] = await Promise.all([
    ctx.task(grammarRulesTask, {
      framework: frameworkSelection.selectedFramework,
      documentationTypes,
      targetAudience,
      outputDir
    }),
    ctx.task(voiceToneTask, {
      organization,
      targetAudience,
      brandGuidelines: requirementsAnalysis.brandGuidelines || {},
      outputDir
    }),
    ctx.task(terminologyTask, {
      organization,
      documentationTypes,
      industryTerms: requirementsAnalysis.industryTerms || [],
      outputDir
    })
  ]);

  artifacts.push(...grammarRules.artifacts);
  artifacts.push(...voiceTone.artifacts);
  artifacts.push(...terminology.artifacts);

  // ============================================================================
  // PHASE 4: FORMATTING AND STRUCTURE STANDARDS
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining formatting and structure standards');
  const [formattingStandards, structureGuidelines] = await Promise.all([
    ctx.task(formattingStandardsTask, {
      documentationTypes,
      framework: frameworkSelection.selectedFramework,
      includeMarkdown: true,
      includeCodeBlocks: true,
      outputDir
    }),
    ctx.task(structureGuidelinesTask, {
      documentationTypes,
      bestPractices: frameworkSelection.bestPractices || [],
      outputDir
    })
  ]);

  artifacts.push(...formattingStandards.artifacts);
  artifacts.push(...structureGuidelines.artifacts);

  // ============================================================================
  // PHASE 5: EXAMPLES AND TEMPLATES
  // ============================================================================

  let examplesTemplates = null;
  if (includeExamples) {
    ctx.log('info', 'Phase 5: Creating examples and templates');
    examplesTemplates = await ctx.task(examplesTemplatesTask, {
      documentationTypes,
      grammarRules: grammarRules.rules,
      voiceTone: voiceTone.guidelines,
      formattingStandards: formattingStandards.standards,
      structureGuidelines: structureGuidelines.guidelines,
      outputDir
    });

    artifacts.push(...examplesTemplates.artifacts);
  }

  // Breakpoint: Review style guide draft
  await ctx.breakpoint({
    question: `Style guide drafted with ${grammarRules.ruleCount} grammar rules, ${terminology.termCount} terminology entries, and ${examplesTemplates ? examplesTemplates.exampleCount : 0} examples. Review draft?`,
    title: 'Style Guide Draft Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organization,
        framework: frameworkSelection.selectedFramework,
        grammarRules: grammarRules.ruleCount,
        terminologyTerms: terminology.termCount,
        examplesCreated: examplesTemplates ? examplesTemplates.exampleCount : 0,
        documentationTypes
      }
    }
  });

  // ============================================================================
  // PHASE 6: ASSEMBLE COMPLETE STYLE GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 6: Assembling complete style guide document');
  const styleGuideAssembly = await ctx.task(styleGuideAssemblyTask, {
    organization,
    framework: frameworkSelection.selectedFramework,
    grammarRules,
    voiceTone,
    terminology,
    formattingStandards,
    structureGuidelines,
    examplesTemplates,
    includeExamples,
    outputDir
  });

  artifacts.push(...styleGuideAssembly.artifacts);

  // ============================================================================
  // PHASE 7: AUTOMATED ENFORCEMENT RULES
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating automated enforcement rules');
  const enforcementRules = await ctx.task(enforcementRulesTask, {
    styleGuide: styleGuideAssembly.styleGuideDocument,
    grammarRules: grammarRules.rules,
    terminology: terminology.terms,
    formattingStandards: formattingStandards.standards,
    automationTools,
    enforcementLevel,
    outputDir
  });

  artifacts.push(...enforcementRules.artifacts);

  // ============================================================================
  // PHASE 8: LINTER CONFIGURATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating linter and checker configurations');
  const linterConfigs = await ctx.task(linterConfigurationTask, {
    automationTools,
    enforcementRules: enforcementRules.rules,
    enforcementLevel,
    styleGuide: styleGuideAssembly.styleGuideDocument,
    outputDir
  });

  artifacts.push(...linterConfigs.artifacts);

  // ============================================================================
  // PHASE 9: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating CI/CD integration workflow');
  const cicdIntegration = await ctx.task(cicdIntegrationTask, {
    automationTools,
    linterConfigs: linterConfigs.configs,
    enforcementLevel,
    documentationPaths: requirementsAnalysis.documentationPaths || [],
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 10: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating style guide quality');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    styleGuide: styleGuideAssembly.styleGuideDocument,
    grammarRules: grammarRules.ruleCount,
    terminologyTerms: terminology.termCount,
    enforcementRules: enforcementRules.ruleCount,
    examplesIncluded: includeExamples,
    framework: frameworkSelection.selectedFramework,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityMet = qualityValidation.overallScore >= 85;

  // Breakpoint: Review quality validation
  await ctx.breakpoint({
    question: `Style guide quality score: ${qualityValidation.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Quality may need improvement.'} Review validation results?`,
    title: 'Quality Validation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore: qualityValidation.overallScore,
        qualityMet,
        completeness: qualityValidation.completeness,
        consistency: qualityValidation.consistency,
        usability: qualityValidation.usability,
        enforcementAutomation: qualityValidation.enforcementAutomation
      }
    }
  });

  // ============================================================================
  // PHASE 11: PEER REVIEW AND APPROVAL
  // ============================================================================

  let reviewedStyleGuide = styleGuideAssembly;
  let reviewResult = null;

  if (requireApproval) {
    ctx.log('info', 'Phase 11: Conducting peer review and approval');
    reviewResult = await ctx.task(peerReviewTask, {
      organization,
      styleGuide: styleGuideAssembly.styleGuideDocument,
      grammarRules,
      terminology,
      enforcementRules: enforcementRules.rules,
      qualityScore: qualityValidation,
      stakeholders: requirementsAnalysis.stakeholders || [],
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Approval gate
    await ctx.breakpoint({
      question: `Style guide review complete. ${reviewResult.approved ? 'Approved by reviewers!' : 'Requires revisions.'} Proceed with publication?`,
      title: 'Style Guide Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          reviewersCount: reviewResult.reviewers.length,
          feedbackItems: reviewResult.feedback.length,
          revisionsNeeded: reviewResult.revisionsNeeded,
          criticalIssues: reviewResult.criticalIssues || 0
        }
      }
    });

    // If revisions needed, incorporate feedback
    if (reviewResult.revisionsNeeded && reviewResult.approved) {
      ctx.log('info', 'Incorporating review feedback');
      const revision = await ctx.task(revisionTask, {
        styleGuide: styleGuideAssembly.styleGuideDocument,
        feedback: reviewResult.feedback,
        enforcementRules: enforcementRules.rules,
        outputDir
      });
      reviewedStyleGuide = revision;
      artifacts.push(...revision.artifacts);
    }
  }

  // ============================================================================
  // PHASE 12: PUBLICATION AND ROLLOUT
  // ============================================================================

  ctx.log('info', 'Phase 12: Publishing style guide and rollout plan');
  const publication = await ctx.task(publicationTask, {
    organization,
    styleGuide: reviewedStyleGuide.styleGuideDocument || reviewedStyleGuide,
    enforcementRules: enforcementRules.rules,
    linterConfigs: linterConfigs.configs,
    cicdWorkflow: cicdIntegration.workflow,
    artifacts,
    outputDir
  });

  artifacts.push(...publication.artifacts);

  // ============================================================================
  // PHASE 13: TRAINING AND ADOPTION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating training and adoption plan');
  const trainingPlan = await ctx.task(trainingPlanTask, {
    organization,
    styleGuide: reviewedStyleGuide.styleGuideDocument || reviewedStyleGuide,
    automationTools,
    targetAudience,
    rolloutPhases: publication.rolloutPhases || [],
    outputDir
  });

  artifacts.push(...trainingPlan.artifacts);

  // ============================================================================
  // PHASE 14: CONTINUOUS IMPROVEMENT FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 14: Establishing continuous improvement framework');
  const continuousImprovement = await ctx.task(continuousImprovementTask, {
    styleGuide: reviewedStyleGuide.styleGuideDocument || reviewedStyleGuide,
    feedbackMechanisms: publication.feedbackMechanisms || [],
    metrics: publication.metrics || [],
    outputDir
  });

  artifacts.push(...continuousImprovement.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organization,
    styleGuidePath: publication.publishedPath,
    enforcementRules: enforcementRules.rules,
    qualityScore: qualityValidation.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    statistics: {
      grammarRules: grammarRules.ruleCount,
      terminologyTerms: terminology.termCount,
      examplesCreated: examplesTemplates ? examplesTemplates.exampleCount : 0,
      enforcementRules: enforcementRules.ruleCount,
      automationTools: automationTools.length,
      linterConfigs: linterConfigs.configCount
    },
    automation: {
      tools: automationTools,
      enforcementLevel,
      cicdIntegration: cicdIntegration.integrated,
      workflowPath: cicdIntegration.workflowPath
    },
    rollout: {
      phases: publication.rolloutPhases || [],
      trainingMaterials: trainingPlan.materials,
      adoptionMetrics: trainingPlan.adoptionMetrics
    },
    continuousImprovement: {
      feedbackMechanisms: continuousImprovement.mechanisms,
      reviewCycle: continuousImprovement.reviewCycle,
      metricsTracking: continuousImprovement.metricsTracking
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/style-guide-enforcement',
      timestamp: startTime,
      outputDir,
      framework: frameworkSelection.selectedFramework,
      enforcementLevel,
      targetAudience
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Requirements Analysis
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze requirements and define scope',
  agent: {
    name: 'documentation-strategist',
    prompt: {
      role: 'senior documentation strategist and style guide expert',
      task: 'Analyze organizational requirements for style guide creation',
      context: args,
      instructions: [
        'Review organization context and existing style guide if provided',
        'Analyze documentation types requiring style guidance',
        'Identify target audience(s) and their needs',
        'Assess existing documentation quality and consistency issues',
        'Research industry standards relevant to organization (technical, regulatory)',
        'Identify brand guidelines and corporate voice requirements',
        'Determine stakeholders who should review/approve',
        'Map documentation repositories and paths',
        'Extract industry-specific terminology that needs standardization',
        'Assess adequacy of context for creating comprehensive style guide',
        'List missing information needed',
        'Provide recommendations for scope and approach',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with hasAdequateContext (boolean), scopeDefinition (object), documentationTypes (array), industryStandards (array), brandGuidelines (object), stakeholders (array), documentationPaths (array), industryTerms (array), missingInformation (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hasAdequateContext', 'scopeDefinition', 'artifacts'],
      properties: {
        hasAdequateContext: { type: 'boolean' },
        scopeDefinition: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            secondary: { type: 'array', items: { type: 'string' } },
            outOfScope: { type: 'array', items: { type: 'string' } }
          }
        },
        documentationTypes: { type: 'array', items: { type: 'string' } },
        industryStandards: { type: 'array', items: { type: 'string' } },
        brandGuidelines: {
          type: 'object',
          properties: {
            voice: { type: 'string' },
            tone: { type: 'string' },
            values: { type: 'array', items: { type: 'string' } }
          }
        },
        stakeholders: { type: 'array', items: { type: 'string' } },
        documentationPaths: { type: 'array', items: { type: 'string' } },
        industryTerms: { type: 'array', items: { type: 'string' } },
        consistencyIssues: { type: 'array', items: { type: 'string' } },
        missingInformation: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'requirements-analysis']
}));

// Task 2: Framework Selection
export const frameworkSelectionTask = defineTask('framework-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select and customize style guide framework',
  agent: {
    name: 'style-guide-architect',
    prompt: {
      role: 'style guide architect and documentation standards expert',
      task: 'Select appropriate style guide framework and customize for organization',
      context: args,
      instructions: [
        'Evaluate requested framework (Microsoft, Google Developer, custom)',
        'If Microsoft: Base on Microsoft Writing Style Guide principles',
        '  - Conversational, warm, and relaxed tone',
        '  - Bias-free communication',
        '  - Global audience considerations',
        '  - Accessibility focus',
        'If Google: Base on Google Developer Documentation Style Guide',
        '  - Clear, concise, consistent',
        '  - Present tense and active voice',
        '  - Second person ("you")',
        '  - Scannable content',
        'If custom: Research and compile best practices from multiple sources',
        'Customize framework for organization-specific needs',
        'Adapt for target audience and documentation types',
        'Incorporate existing style guide elements if provided',
        'Define core principles and philosophy',
        'Compile best practices and writing guidelines',
        'Document framework selection rationale',
        'Save framework selection and customization to output directory'
      ],
      outputFormat: 'JSON with selectedFramework (string), frameworkPrinciples (array), customizations (array), rationale (string), bestPractices (array), writingGuidelines (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedFramework', 'frameworkPrinciples', 'artifacts'],
      properties: {
        selectedFramework: { type: 'string', enum: ['microsoft', 'google', 'custom'] },
        frameworkPrinciples: { type: 'array', items: { type: 'string' } },
        customizations: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
        bestPractices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              practice: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        writingGuidelines: {
          type: 'object',
          properties: {
            tense: { type: 'string' },
            voice: { type: 'string' },
            person: { type: 'string' },
            tone: { type: 'string' }
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
  labels: ['agent', 'style-guide', 'framework-selection']
}));

// Task 3: Grammar Rules
export const grammarRulesTask = defineTask('grammar-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define grammar and mechanics rules',
  agent: {
    name: 'grammar-specialist',
    prompt: {
      role: 'technical editor and grammar specialist',
      task: 'Define comprehensive grammar and mechanics rules',
      context: args,
      instructions: [
        'Define rules for:',
        '  - Capitalization (headings, product names, acronyms)',
        '  - Punctuation (serial comma, quotation marks, em dashes)',
        '  - Numbers (when to spell out vs use numerals)',
        '  - Abbreviations and acronyms (when to define)',
        '  - Lists (bulleted vs numbered, punctuation)',
        '  - Links and cross-references',
        '  - Code and UI element formatting',
        '  - Date and time formats',
        '  - Units of measurement',
        'Define sentence structure preferences:',
        '  - Active vs passive voice',
        '  - Sentence length guidelines',
        '  - Paragraph length guidelines',
        '  - Present tense preference',
        'Define word choice guidelines:',
        '  - Simple vs complex words',
        '  - Jargon and technical terms',
        '  - Inclusive language',
        '  - Words to avoid',
        'Create rules that are clear, actionable, and enforceable',
        'Provide examples for each rule',
        'Save grammar rules to output directory'
      ],
      outputFormat: 'JSON with rules (array of objects with category, rule, explanation, examples, priority), ruleCount (number), categories (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'ruleCount', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              rule: { type: 'string' },
              explanation: { type: 'string' },
              examples: {
                type: 'object',
                properties: {
                  correct: { type: 'array', items: { type: 'string' } },
                  incorrect: { type: 'array', items: { type: 'string' } }
                }
              },
              priority: { type: 'string', enum: ['required', 'recommended', 'optional'] },
              enforceable: { type: 'boolean' }
            }
          }
        },
        ruleCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'grammar-rules']
}));

// Task 4: Voice and Tone
export const voiceToneTask = defineTask('voice-tone', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define voice and tone guidelines',
  agent: {
    name: 'content-strategist',
    prompt: {
      role: 'content strategist and brand voice expert',
      task: 'Define organizational voice and tone for documentation',
      context: args,
      instructions: [
        'Define organizational voice (consistent personality):',
        '  - Professional, conversational, authoritative, friendly, etc.',
        '  - Core voice characteristics (3-5 traits)',
        '  - What voice is and is NOT',
        'Define tone variations by context:',
        '  - Getting started / tutorials: encouraging, supportive',
        '  - Technical reference: precise, neutral',
        '  - Error messages: helpful, empathetic, solution-oriented',
        '  - Release notes: informative, clear',
        '  - Troubleshooting: calm, helpful, step-by-step',
        'Incorporate brand guidelines if provided',
        'Define perspective (first person, second person, third person)',
        'Address formality level (casual, professional, formal)',
        'Provide examples of voice and tone for each documentation type',
        'Create "voice and tone chart" showing variations',
        'Save voice and tone guidelines to output directory'
      ],
      outputFormat: 'JSON with voice (object), toneVariations (array), perspective (string), formalityLevel (string), guidelines (object), voiceChart (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['voice', 'toneVariations', 'guidelines', 'artifacts'],
      properties: {
        voice: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            characteristics: { type: 'array', items: { type: 'string' } },
            isNot: { type: 'array', items: { type: 'string' } }
          }
        },
        toneVariations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              context: { type: 'string' },
              tone: { type: 'string' },
              description: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        perspective: { type: 'string' },
        formalityLevel: { type: 'string' },
        guidelines: {
          type: 'object',
          properties: {
            dos: { type: 'array', items: { type: 'string' } },
            donts: { type: 'array', items: { type: 'string' } }
          }
        },
        voiceChart: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'voice-tone']
}));

// Task 5: Terminology
export const terminologyTask = defineTask('terminology', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create terminology and word choice guide',
  agent: {
    name: 'terminology-specialist',
    prompt: {
      role: 'terminology specialist and technical lexicographer',
      task: 'Create comprehensive terminology and word choice guide',
      context: args,
      instructions: [
        'Compile organization-specific terminology:',
        '  - Product names and capitalization',
        '  - Feature names',
        '  - Technical terms and definitions',
        '  - Industry terms with preferred usage',
        'Create "preferred terms" list:',
        '  - Term, definition, usage notes, examples',
        '  - Alternatives to avoid (and why)',
        '  - Capitalization rules',
        'Create "words to avoid" list with better alternatives:',
        '  - Jargon without definitions',
        '  - Biased or non-inclusive terms',
        '  - Ambiguous terms',
        '  - Unnecessarily complex words',
        'Define acronym and abbreviation standards:',
        '  - When to spell out vs use abbreviation',
        '  - How to introduce acronyms',
        '  - Common acronyms that don\'t need definition',
        'Create terminology consistency rules',
        'Include pronunciation guides for complex terms',
        'Save terminology guide to output directory as searchable reference'
      ],
      outputFormat: 'JSON with terms (array), preferredTerms (array), wordsToAvoid (array), acronyms (array), termCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['terms', 'preferredTerms', 'wordsToAvoid', 'termCount', 'artifacts'],
      properties: {
        terms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              definition: { type: 'string' },
              usage: { type: 'string' },
              capitalization: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              alternatives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        preferredTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              preferred: { type: 'string' },
              avoid: { type: 'array', items: { type: 'string' } },
              reason: { type: 'string' }
            }
          }
        },
        wordsToAvoid: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              word: { type: 'string' },
              reason: { type: 'string' },
              alternative: { type: 'string' }
            }
          }
        },
        acronyms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              acronym: { type: 'string' },
              fullForm: { type: 'string' },
              needsDefinition: { type: 'boolean' }
            }
          }
        },
        termCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'terminology']
}));

// Task 6: Formatting Standards
export const formattingStandardsTask = defineTask('formatting-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define formatting and layout standards',
  agent: {
    name: 'formatting-specialist',
    prompt: {
      role: 'documentation formatter and technical editor',
      task: 'Define comprehensive formatting and layout standards',
      context: args,
      instructions: [
        'Define heading standards:',
        '  - Heading hierarchy (H1-H6 usage)',
        '  - Capitalization style (sentence case, title case)',
        '  - Heading content guidelines',
        '  - When to use headings vs bold text',
        'Define text formatting:',
        '  - Bold (when to use)',
        '  - Italic (when to use)',
        '  - Code formatting (inline code, code blocks)',
        '  - UI element formatting (buttons, menus, fields)',
        '  - File and directory paths',
        '  - Command line formatting',
        'Define Markdown standards:',
        '  - Line length limits',
        '  - Whitespace and blank lines',
        '  - Link formatting (inline vs reference)',
        '  - Image formatting and alt text',
        '  - Table formatting',
        '  - Admonitions/callouts (notes, warnings, tips)',
        'Define code block standards:',
        '  - Language identifiers',
        '  - Line length in code blocks',
        '  - Syntax highlighting',
        '  - Comments in code examples',
        'Define list formatting:',
        '  - Bulleted vs numbered lists',
        '  - Nested list formatting',
        '  - Punctuation in lists',
        'Save formatting standards to output directory'
      ],
      outputFormat: 'JSON with standards (array of objects), headingGuidelines (object), textFormatting (object), markdownRules (array), codeBlockRules (array), listRules (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'headingGuidelines', 'artifacts'],
      properties: {
        standards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              rule: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        headingGuidelines: {
          type: 'object',
          properties: {
            hierarchy: { type: 'string' },
            capitalization: { type: 'string' },
            guidelines: { type: 'array', items: { type: 'string' } }
          }
        },
        textFormatting: {
          type: 'object',
          properties: {
            bold: { type: 'string' },
            italic: { type: 'string' },
            code: { type: 'string' },
            uiElements: { type: 'string' }
          }
        },
        markdownRules: { type: 'array', items: { type: 'string' } },
        codeBlockRules: { type: 'array', items: { type: 'string' } },
        listRules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'formatting']
}));

// Task 7: Structure Guidelines
export const structureGuidelinesTask = defineTask('structure-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content structure guidelines',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'information architect and documentation strategist',
      task: 'Define content structure and organization guidelines',
      context: args,
      instructions: [
        'Define structure templates for each documentation type:',
        '  - API documentation structure',
        '  - Tutorial structure',
        '  - How-to guide structure',
        '  - Reference documentation structure',
        '  - Conceptual/explanation structure',
        'Define page structure elements:',
        '  - Required sections',
        '  - Optional sections',
        '  - Section ordering',
        '  - Introduction/overview guidelines',
        '  - Prerequisites section',
        '  - Next steps section',
        'Define content organization principles:',
        '  - Progressive disclosure',
        '  - Scannable content',
        '  - Information hierarchy',
        '  - Use of summaries and abstracts',
        'Define cross-referencing guidelines:',
        '  - When to link to other docs',
        '  - Link text best practices',
        '  - Avoiding broken links',
        'Define navigation and discoverability:',
        '  - Table of contents',
        '  - Breadcrumbs',
        '  - Related links',
        'Save structure guidelines to output directory'
      ],
      outputFormat: 'JSON with guidelines (array), templates (array), organizationPrinciples (array), crossReferencingRules (array), navigationGuidelines (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'templates', 'artifacts'],
      properties: {
        guidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              documentationType: { type: 'string' },
              requiredSections: { type: 'array', items: { type: 'string' } },
              optionalSections: { type: 'array', items: { type: 'string' } },
              sectionOrder: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              structure: { type: 'string' }
            }
          }
        },
        organizationPrinciples: { type: 'array', items: { type: 'string' } },
        crossReferencingRules: { type: 'array', items: { type: 'string' } },
        navigationGuidelines: {
          type: 'object',
          properties: {
            toc: { type: 'string' },
            breadcrumbs: { type: 'string' },
            relatedLinks: { type: 'string' }
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
  labels: ['agent', 'style-guide', 'structure']
}));

// Task 8: Examples and Templates
export const examplesTemplatesTask = defineTask('examples-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create examples and documentation templates',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'senior technical writer and template creator',
      task: 'Create practical examples and reusable documentation templates',
      context: args,
      instructions: [
        'Create before/after examples for style rules:',
        '  - Grammar rules (show incorrect and correct)',
        '  - Voice and tone (show variations)',
        '  - Formatting (show proper formatting)',
        '  - Terminology (show preferred usage)',
        'Create complete example documents:',
        '  - API documentation example',
        '  - Tutorial example',
        '  - How-to guide example',
        '  - Reference page example',
        '  - Each showing all style rules in action',
        'Create reusable templates:',
        '  - Document templates for each doc type',
        '  - Section templates',
        '  - Boilerplate text (disclaimers, notices)',
        'Annotate examples with style rule references',
        'Show common mistakes and corrections',
        'Include real-world scenarios',
        'Save examples and templates to output directory'
      ],
      outputFormat: 'JSON with examples (array), templates (array), beforeAfterExamples (array), commonMistakes (array), exampleCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['examples', 'templates', 'exampleCount', 'artifacts'],
      properties: {
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              documentationType: { type: 'string' },
              content: { type: 'string' },
              annotations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              template: { type: 'string' },
              instructions: { type: 'string' }
            }
          }
        },
        beforeAfterExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              before: { type: 'string' },
              after: { type: 'string' },
              explanation: { type: 'string' }
            }
          }
        },
        commonMistakes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mistake: { type: 'string' },
              correction: { type: 'string' },
              ruleReference: { type: 'string' }
            }
          }
        },
        exampleCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'examples', 'templates']
}));

// Task 9: Style Guide Assembly
export const styleGuideAssemblyTask = defineTask('style-guide-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble complete style guide document',
  agent: {
    name: 'documentation-assembler',
    prompt: {
      role: 'documentation engineer and technical editor',
      task: 'Assemble all components into comprehensive style guide',
      context: args,
      instructions: [
        'Create style guide structure:',
        '  1. Introduction and Purpose',
        '  2. How to Use This Guide',
        '  3. Core Principles (from framework)',
        '  4. Voice and Tone',
        '  5. Grammar and Mechanics',
        '  6. Terminology and Word Choice',
        '  7. Formatting and Layout',
        '  8. Content Structure',
        '  9. Examples and Templates (if included)',
        '  10. Quick Reference / Cheat Sheet',
        '  11. Resources and Further Reading',
        'Write compelling introduction explaining why style guide matters',
        'Create "How to Use" section for different audiences (writers, reviewers, tool users)',
        'Integrate all component sections with clear navigation',
        'Create quick reference section with most important rules',
        'Add table of contents with deep linking',
        'Include search index or make searchable',
        'Add versioning information',
        'Format consistently and professionally',
        'Save complete style guide to output directory'
      ],
      outputFormat: 'JSON with styleGuideDocument (string - full markdown), sections (array), wordCount (number), pageCount (number), quickReference (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['styleGuideDocument', 'sections', 'artifacts'],
      properties: {
        styleGuideDocument: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              anchor: { type: 'string' },
              level: { type: 'number' }
            }
          }
        },
        wordCount: { type: 'number' },
        pageCount: { type: 'number' },
        estimatedReadTime: { type: 'string' },
        quickReference: { type: 'string' },
        version: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'assembly']
}));

// Task 10: Enforcement Rules
export const enforcementRulesTask = defineTask('enforcement-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create automated enforcement rules',
  agent: {
    name: 'automation-engineer',
    prompt: {
      role: 'documentation automation engineer and linting expert',
      task: 'Create automated enforcement rules from style guide',
      context: args,
      instructions: [
        'Extract enforceable rules from style guide',
        'Map rules to automation capabilities:',
        '  - Grammar and spelling checks',
        '  - Terminology consistency',
        '  - Formatting validation',
        '  - Structure validation',
        '  - Link checking',
        '  - Word choice restrictions',
        'Create rule definitions for automation tools:',
        '  - Vale vocabulary files',
        '  - Vale style rules',
        '  - Markdownlint rules',
        '  - Custom regex patterns',
        '  - Write-good rules',
        'Define severity levels based on enforcementLevel:',
        '  - Strict: errors block CI/CD',
        '  - Moderate: warnings but don\'t block',
        '  - Advisory: informational only',
        'Categorize rules by priority (required, recommended, optional)',
        'Create machine-readable rule format',
        'Document what can and cannot be automated',
        'Save enforcement rules to output directory'
      ],
      outputFormat: 'JSON with rules (array), automatable (array), manual (array), ruleCount (number), toolMapping (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rules', 'automatable', 'manual', 'ruleCount', 'artifacts'],
      properties: {
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              rule: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warning', 'info'] },
              automatable: { type: 'boolean' },
              tools: { type: 'array', items: { type: 'string' } },
              pattern: { type: 'string' },
              message: { type: 'string' }
            }
          }
        },
        automatable: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              tool: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        manual: { type: 'array', items: { type: 'string' } },
        ruleCount: { type: 'number' },
        toolMapping: {
          type: 'object',
          properties: {
            vale: { type: 'number' },
            markdownlint: { type: 'number' },
            writeGood: { type: 'number' },
            custom: { type: 'number' }
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
  labels: ['agent', 'style-guide', 'enforcement-rules']
}));

// Task 11: Linter Configuration
export const linterConfigurationTask = defineTask('linter-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate linter and checker configurations',
  agent: {
    name: 'linter-configuration-specialist',
    prompt: {
      role: 'linting and validation tool configuration expert',
      task: 'Generate configuration files for documentation linters and checkers',
      context: args,
      instructions: [
        'For Vale (prose linter):',
        '  - Create .vale.ini configuration',
        '  - Create custom Vale style package with rules',
        '  - Create vocabulary files (accept.txt, reject.txt)',
        '  - Configure severity levels',
        '  - Set up spelling dictionary exceptions',
        'For markdownlint:',
        '  - Create .markdownlint.json configuration',
        '  - Configure enabled/disabled rules',
        '  - Set rule parameters',
        '  - Configure heading styles',
        '  - Set line length limits',
        'For write-good:',
        '  - Create .write-good.json configuration',
        '  - Configure passive voice checking',
        '  - Configure weasel word detection',
        '  - Set severity thresholds',
        'For custom tools:',
        '  - Create configuration files',
        '  - Document usage instructions',
        'Ensure all configs align with enforcement level',
        'Include README explaining each configuration',
        'Save all linter configs to output directory'
      ],
      outputFormat: 'JSON with configs (array), valeConfig (object), markdownlintConfig (object), writeGoodConfig (object), configCount (number), usageInstructions (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configs', 'configCount', 'artifacts'],
      properties: {
        configs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              filename: { type: 'string' },
              config: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        valeConfig: {
          type: 'object',
          properties: {
            iniFile: { type: 'string' },
            stylePackage: { type: 'string' },
            vocabularyFiles: { type: 'array', items: { type: 'string' } }
          }
        },
        markdownlintConfig: { type: 'object' },
        writeGoodConfig: { type: 'object' },
        configCount: { type: 'number' },
        usageInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'linter-configuration']
}));

// Task 12: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create CI/CD integration workflow',
  agent: {
    name: 'devops-engineer',
    prompt: {
      role: 'DevOps engineer and CI/CD specialist',
      task: 'Create CI/CD workflow for automated style enforcement',
      context: args,
      instructions: [
        'Create GitHub Actions workflow (or equivalent):',
        '  - Trigger on PR changes to documentation',
        '  - Install linting tools (Vale, markdownlint, etc.)',
        '  - Run linters on changed documentation files',
        '  - Generate lint report',
        '  - Post results as PR comments',
        '  - Set status check (pass/fail based on enforcement level)',
        'Configure for enforcement level:',
        '  - Strict: fail build on any error',
        '  - Moderate: fail on errors, warn on warnings',
        '  - Advisory: informational only, never fail',
        'Create pre-commit hooks for local enforcement:',
        '  - Run quick checks before commit',
        '  - Auto-fix issues where possible',
        '  - Provide feedback to developer',
        'Document CI/CD setup instructions',
        'Include badge/status indicators for README',
        'Save CI/CD workflow files to output directory'
      ],
      outputFormat: 'JSON with workflow (string), workflowPath (string), preCommitHook (string), setupInstructions (string), integrated (boolean), badges (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'workflowPath', 'integrated', 'artifacts'],
      properties: {
        workflow: { type: 'string' },
        workflowPath: { type: 'string' },
        preCommitHook: { type: 'string' },
        setupInstructions: { type: 'string' },
        integrated: { type: 'boolean' },
        badges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              markdown: { type: 'string' }
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
  labels: ['agent', 'style-guide', 'cicd-integration']
}));

// Task 13: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate style guide quality',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'documentation quality auditor and style guide expert',
      task: 'Assess style guide quality, completeness, and usability',
      context: args,
      instructions: [
        'Evaluate Completeness (weight: 30%):',
        '  - All essential sections present',
        '  - Grammar rules comprehensive',
        '  - Terminology guide complete',
        '  - Voice and tone defined',
        '  - Formatting standards clear',
        '  - Structure guidelines provided',
        'Evaluate Clarity and Usability (weight: 25%):',
        '  - Rules clearly stated',
        '  - Examples provided',
        '  - Easy to navigate',
        '  - Searchable/findable',
        '  - Quick reference available',
        'Evaluate Consistency (weight: 20%):',
        '  - Internal consistency',
        '  - Aligns with stated framework',
        '  - No contradictions',
        'Evaluate Enforceability (weight: 15%):',
        '  - Rules are specific and measurable',
        '  - Automation coverage',
        '  - Clear severity levels',
        'Evaluate Practicality (weight: 10%):',
        '  - Rules are realistic',
        '  - Examples are relevant',
        '  - Templates are useful',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide improvement recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (number), clarity (number), consistency (number), usability (number), enforcementAutomation (number), gaps (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            clarity: { type: 'number' },
            consistency: { type: 'number' },
            usability: { type: 'number' },
            enforceability: { type: 'number' },
            practicality: { type: 'number' }
          }
        },
        completeness: { type: 'number' },
        clarity: { type: 'number' },
        consistency: { type: 'number' },
        usability: { type: 'number' },
        enforcementAutomation: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'quality-validation']
}));

// Task 14: Peer Review
export const peerReviewTask = defineTask('peer-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct peer review and approval',
  agent: {
    name: 'review-team',
    prompt: {
      role: 'documentation review team including writers, editors, and stakeholders',
      task: 'Conduct comprehensive review of style guide',
      context: args,
      instructions: [
        'Simulate review from multiple perspectives:',
        '  - Technical writer perspective (usability, practicality)',
        '  - Editor perspective (consistency, correctness)',
        '  - Developer/user perspective (clarity, examples)',
        '  - Management perspective (business alignment)',
        'Review each section of style guide',
        'Validate rules are clear and actionable',
        'Check examples are helpful and accurate',
        'Assess whether enforcement rules are appropriate',
        'Verify terminology is correct and complete',
        'Check for cultural sensitivity and inclusivity',
        'Gather feedback from reviewers',
        'Categorize feedback by severity (critical, major, minor)',
        'Identify required revisions vs suggestions',
        'Determine approval or rejection',
        'Document review outcome'
      ],
      outputFormat: 'JSON with approved (boolean), reviewers (array), feedback (array), revisionsNeeded (boolean), criticalIssues (number), majorIssues (number), minorIssues (number), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'reviewers', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        reviewers: { type: 'array', items: { type: 'string' } },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewer: { type: 'string' },
              section: { type: 'string' },
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor', 'suggestion'] },
              actionRequired: { type: 'boolean' }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        criticalIssues: { type: 'number' },
        majorIssues: { type: 'number' },
        minorIssues: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'peer-review']
}));

// Task 15: Revision
export const revisionTask = defineTask('revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Incorporate review feedback',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer and style guide editor',
      task: 'Revise style guide based on review feedback',
      context: args,
      instructions: [
        'Review all feedback items by severity',
        'Address all critical issues',
        'Address all major issues',
        'Incorporate minor suggestions where appropriate',
        'Update affected sections and rules',
        'Fix inconsistencies and errors',
        'Improve clarity where needed',
        'Add missing information',
        'Update enforcement rules if needed',
        'Maintain document structure and format',
        'Document what changed and why',
        'Save revised style guide to output directory'
      ],
      outputFormat: 'JSON with styleGuideDocument (string), changesApplied (array), issuesAddressed (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['styleGuideDocument', 'changesApplied', 'artifacts'],
      properties: {
        styleGuideDocument: { type: 'string' },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              change: { type: 'string' },
              reason: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        issuesAddressed: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'revision']
}));

// Task 16: Publication
export const publicationTask = defineTask('publication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Publish style guide and rollout plan',
  agent: {
    name: 'publication-manager',
    prompt: {
      role: 'documentation publication manager',
      task: 'Publish style guide and create rollout plan',
      context: args,
      instructions: [
        'Organize all style guide artifacts:',
        '  - Main style guide document',
        '  - Quick reference/cheat sheet',
        '  - Examples and templates',
        '  - Linter configurations',
        '  - CI/CD workflow',
        '  - Training materials',
        'Create style guide package for distribution',
        'Choose publication format(s):',
        '  - Web documentation site',
        '  - PDF download',
        '  - Wiki/Confluence',
        '  - Internal documentation portal',
        'Create README with:',
        '  - Style guide overview',
        '  - How to use',
        '  - How to contribute',
        '  - Enforcement setup',
        'Define rollout phases:',
        '  - Phase 1: Pilot with small team',
        '  - Phase 2: Gradual rollout to teams',
        '  - Phase 3: Full organization adoption',
        'Create communication plan for announcement',
        'Set up feedback mechanisms (issues, forms, email)',
        'Define success metrics and tracking',
        'Save publication package to output directory'
      ],
      outputFormat: 'JSON with publishedPath (string), publicationFormats (array), rolloutPhases (array), communicationPlan (object), feedbackMechanisms (array), metrics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedPath', 'publicationFormats', 'artifacts'],
      properties: {
        publishedPath: { type: 'string' },
        publicationFormats: { type: 'array', items: { type: 'string' } },
        rolloutPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              description: { type: 'string' },
              duration: { type: 'string' },
              teams: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        communicationPlan: {
          type: 'object',
          properties: {
            announcement: { type: 'string' },
            channels: { type: 'array', items: { type: 'string' } },
            stakeholders: { type: 'array', items: { type: 'string' } }
          }
        },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              description: { type: 'string' },
              target: { type: 'string' }
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
  labels: ['agent', 'style-guide', 'publication']
}));

// Task 17: Training Plan
export const trainingPlanTask = defineTask('training-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create training and adoption plan',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'documentation training specialist and change management expert',
      task: 'Create comprehensive training and adoption plan',
      context: args,
      instructions: [
        'Create training materials:',
        '  - Style guide overview presentation',
        '  - Hands-on workshop materials',
        '  - Quick start guide for writers',
        '  - Video walkthroughs (scripted)',
        '  - FAQ document',
        'Design training sessions:',
        '  - Introduction session (30 min)',
        '  - Deep dive workshops (2 hours)',
        '  - Tool setup workshop (1 hour)',
        '  - Office hours schedule',
        'Create adoption resources:',
        '  - Before/after examples',
        '  - Common mistakes and fixes',
        '  - Cheat sheet/quick reference',
        '  - Editor integration guides',
        'Define adoption metrics:',
        '  - Documentation lint pass rate',
        '  - Style guide consultation rate',
        '  - Training completion rate',
        '  - Time to fix style issues',
        'Create change management plan:',
        '  - Communication timeline',
        '  - Champions/advocates program',
        '  - Support resources',
        '  - Feedback loops',
        'Save training plan to output directory'
      ],
      outputFormat: 'JSON with materials (array), trainingSessions (array), adoptionResources (array), adoptionMetrics (array), changeManagement (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'trainingSessions', 'adoptionMetrics', 'artifacts'],
      properties: {
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        trainingSessions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              duration: { type: 'string' },
              audience: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              agenda: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        adoptionResources: { type: 'array', items: { type: 'string' } },
        adoptionMetrics: {
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
        changeManagement: {
          type: 'object',
          properties: {
            timeline: { type: 'string' },
            champions: { type: 'array', items: { type: 'string' } },
            support: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'style-guide', 'training']
}));

// Task 18: Continuous Improvement
export const continuousImprovementTask = defineTask('continuous-improvement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish continuous improvement framework',
  agent: {
    name: 'style-guide-maintainer',
    prompt: {
      role: 'style guide maintainer and continuous improvement specialist',
      task: 'Create framework for ongoing style guide maintenance and improvement',
      context: args,
      instructions: [
        'Define feedback collection mechanisms:',
        '  - GitHub issues for style guide repository',
        '  - Feedback form for quick submissions',
        '  - Regular survey to writers',
        '  - Style guide office hours',
        'Create review and update schedule:',
        '  - Quarterly review of feedback',
        '  - Annual major revision',
        '  - Ad-hoc updates for critical issues',
        '  - Versioning strategy',
        'Define governance model:',
        '  - Style guide owner/maintainer',
        '  - Review committee',
        '  - Approval process for changes',
        '  - Communication of updates',
        'Set up metrics tracking:',
        '  - Documentation quality metrics',
        '  - Lint pass rates over time',
        '  - Style guide usage analytics',
        '  - Common violation patterns',
        'Create improvement workflow:',
        '  - How to propose changes',
        '  - How changes are evaluated',
        '  - How changes are communicated',
        '  - How training is updated',
        'Document continuous improvement process',
        'Save framework to output directory'
      ],
      outputFormat: 'JSON with mechanisms (array), reviewCycle (object), governance (object), metricsTracking (array), improvementWorkflow (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms', 'reviewCycle', 'governance', 'artifacts'],
      properties: {
        mechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              description: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        reviewCycle: {
          type: 'object',
          properties: {
            quarterly: { type: 'string' },
            annual: { type: 'string' },
            adHoc: { type: 'string' },
            versioning: { type: 'string' }
          }
        },
        governance: {
          type: 'object',
          properties: {
            owner: { type: 'string' },
            committee: { type: 'array', items: { type: 'string' } },
            approvalProcess: { type: 'string' },
            communicationProcess: { type: 'string' }
          }
        },
        metricsTracking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              dataSource: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        improvementWorkflow: {
          type: 'object',
          properties: {
            proposalProcess: { type: 'string' },
            evaluationCriteria: { type: 'array', items: { type: 'string' } },
            implementationSteps: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'style-guide', 'continuous-improvement']
}));
