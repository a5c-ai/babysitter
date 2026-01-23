/**
 * @process specializations/technical-documentation/docs-audit
 * @description Documentation Audit and Quality Assessment process with comprehensive analysis, scoring, accessibility review, and actionable recommendations
 * @specialization Technical Documentation
 * @category Quality Assurance
 * @inputs { docsPaths: array, framework: string, targetAudience: string, auditScope: array, includeAccessibility: boolean, benchmarkStandards: object }
 * @outputs { success: boolean, overallScore: number, auditReport: object, recommendations: array, artifacts: array, metadata: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    docsPaths = [],
    framework = 'diataxis', // diataxis, docs-as-code, custom
    targetAudience = 'developers',
    auditScope = ['completeness', 'accuracy', 'clarity', 'accessibility', 'consistency', 'maintainability'],
    includeAccessibility = true,
    benchmarkStandards = {
      completeness: 85,
      accuracy: 95,
      clarity: 80,
      accessibility: 90,
      consistency: 85,
      maintainability: 75
    },
    outputDir = 'docs-audit-output',
    includeCompetitorAnalysis = false,
    generateActionPlan = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Documentation Audit and Quality Assessment Process');
  ctx.log('info', `Audit Scope: ${auditScope.join(', ')}`);
  ctx.log('info', `Target Audience: ${targetAudience}`);

  // ============================================================================
  // PHASE 1: DOCUMENTATION DISCOVERY AND INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and inventorying documentation');
  const discovery = await ctx.task(documentationDiscoveryTask, {
    docsPaths,
    framework,
    targetAudience,
    outputDir
  });

  artifacts.push(...discovery.artifacts);

  if (discovery.documentCount === 0) {
    ctx.log('warn', 'No documentation found to audit');
    return {
      success: false,
      reason: 'No documentation found',
      searchedPaths: docsPaths,
      recommendations: ['Provide valid documentation paths', 'Ensure documentation exists in specified locations'],
      metadata: {
        processId: 'specializations/technical-documentation/docs-audit',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: STRUCTURAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing documentation structure and organization');
  const structuralAnalysis = await ctx.task(structuralAnalysisTask, {
    inventory: discovery.inventory,
    framework,
    targetAudience,
    outputDir
  });

  artifacts.push(...structuralAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: CONTENT QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing content quality and accuracy');
  const contentQuality = await ctx.task(contentQualityTask, {
    inventory: discovery.inventory,
    targetAudience,
    benchmarkStandards,
    outputDir
  });

  artifacts.push(...contentQuality.artifacts);

  // ============================================================================
  // PHASE 4: COMPLETENESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing documentation completeness');
  const completenessAnalysis = await ctx.task(completenessAnalysisTask, {
    inventory: discovery.inventory,
    framework,
    structuralAnalysis,
    benchmarkStandards,
    outputDir
  });

  artifacts.push(...completenessAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CLARITY AND READABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing clarity and readability');
  const clarityAssessment = await ctx.task(clarityReadabilityTask, {
    inventory: discovery.inventory,
    targetAudience,
    benchmarkStandards,
    outputDir
  });

  artifacts.push(...clarityAssessment.artifacts);

  // ============================================================================
  // PHASE 6: CONSISTENCY EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Evaluating consistency and style');
  const consistencyEvaluation = await ctx.task(consistencyEvaluationTask, {
    inventory: discovery.inventory,
    framework,
    outputDir
  });

  artifacts.push(...consistencyEvaluation.artifacts);

  // ============================================================================
  // PHASE 7: ACCESSIBILITY AUDIT (if enabled)
  // ============================================================================

  let accessibilityAudit = null;
  if (includeAccessibility && auditScope.includes('accessibility')) {
    ctx.log('info', 'Phase 7: Conducting accessibility audit');
    accessibilityAudit = await ctx.task(accessibilityAuditTask, {
      inventory: discovery.inventory,
      benchmarkStandards,
      outputDir
    });
    artifacts.push(...accessibilityAudit.artifacts);
  }

  // ============================================================================
  // PHASE 8: TECHNICAL ACCURACY VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Verifying technical accuracy');
  const accuracyVerification = await ctx.task(technicalAccuracyTask, {
    inventory: discovery.inventory,
    contentQuality,
    benchmarkStandards,
    outputDir
  });

  artifacts.push(...accuracyVerification.artifacts);

  // ============================================================================
  // PHASE 9: MAINTAINABILITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing documentation maintainability');
  const maintainabilityAssessment = await ctx.task(maintainabilityAssessmentTask, {
    inventory: discovery.inventory,
    structuralAnalysis,
    benchmarkStandards,
    outputDir
  });

  artifacts.push(...maintainabilityAssessment.artifacts);

  // ============================================================================
  // PHASE 10: USER EXPERIENCE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Evaluating user experience');
  const uxEvaluation = await ctx.task(userExperienceTask, {
    inventory: discovery.inventory,
    structuralAnalysis,
    targetAudience,
    outputDir
  });

  artifacts.push(...uxEvaluation.artifacts);

  // ============================================================================
  // PHASE 11: COMPETITIVE ANALYSIS (if enabled)
  // ============================================================================

  let competitorAnalysis = null;
  if (includeCompetitorAnalysis) {
    ctx.log('info', 'Phase 11: Conducting competitive analysis');
    competitorAnalysis = await ctx.task(competitorAnalysisTask, {
      inventory: discovery.inventory,
      targetAudience,
      outputDir
    });
    artifacts.push(...competitorAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE 12: SCORING AND AGGREGATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Calculating overall scores');
  const scoring = await ctx.task(scoringAggregationTask, {
    discovery,
    structuralAnalysis,
    contentQuality,
    completenessAnalysis,
    clarityAssessment,
    consistencyEvaluation,
    accessibilityAudit,
    accuracyVerification,
    maintainabilityAssessment,
    uxEvaluation,
    benchmarkStandards,
    auditScope,
    outputDir
  });

  artifacts.push(...scoring.artifacts);

  const overallScore = scoring.overallScore;
  const passesThreshold = overallScore >= 80;

  // Breakpoint: Review audit results
  await ctx.breakpoint({
    question: `Documentation audit complete. Overall score: ${overallScore}/100. ${passesThreshold ? 'Documentation meets quality standards!' : 'Documentation needs improvement.'} Review audit report?`,
    title: 'Documentation Audit Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        overallScore,
        passesThreshold,
        documentCount: discovery.documentCount,
        criticalIssues: scoring.criticalIssues?.length || 0,
        recommendations: scoring.recommendations?.length || 0,
        componentScores: scoring.componentScores
      }
    }
  });

  // ============================================================================
  // PHASE 13: RECOMMENDATIONS AND PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating recommendations');
  const recommendations = await ctx.task(recommendationsTask, {
    scoring,
    discovery,
    structuralAnalysis,
    contentQuality,
    completenessAnalysis,
    clarityAssessment,
    consistencyEvaluation,
    accessibilityAudit,
    accuracyVerification,
    maintainabilityAssessment,
    uxEvaluation,
    competitorAnalysis,
    benchmarkStandards,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // ============================================================================
  // PHASE 14: ACTION PLAN GENERATION (if enabled)
  // ============================================================================

  let actionPlan = null;
  if (generateActionPlan) {
    ctx.log('info', 'Phase 14: Generating improvement action plan');
    actionPlan = await ctx.task(actionPlanTask, {
      scoring,
      recommendations,
      benchmarkStandards,
      outputDir
    });
    artifacts.push(...actionPlan.artifacts);
  }

  // ============================================================================
  // PHASE 15: FINAL REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating comprehensive audit report');
  const finalReport = await ctx.task(finalReportTask, {
    discovery,
    structuralAnalysis,
    contentQuality,
    completenessAnalysis,
    clarityAssessment,
    consistencyEvaluation,
    accessibilityAudit,
    accuracyVerification,
    maintainabilityAssessment,
    uxEvaluation,
    competitorAnalysis,
    scoring,
    recommendations,
    actionPlan,
    benchmarkStandards,
    auditScope,
    framework,
    targetAudience,
    outputDir
  });

  artifacts.push(...finalReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    overallScore: scoring.overallScore,
    passesThreshold,
    auditReport: {
      executiveSummary: finalReport.executiveSummary,
      componentScores: scoring.componentScores,
      criticalIssues: scoring.criticalIssues,
      majorIssues: scoring.majorIssues,
      minorIssues: scoring.minorIssues,
      strengths: scoring.strengths,
      weaknesses: scoring.weaknesses
    },
    discovery: {
      documentCount: discovery.documentCount,
      pageCount: discovery.pageCount,
      wordCount: discovery.wordCount,
      documentTypes: discovery.documentTypes,
      coverageByType: discovery.coverageByType
    },
    structuralAnalysis: {
      navigationScore: structuralAnalysis.navigationScore,
      organizationScore: structuralAnalysis.organizationScore,
      informationArchitectureScore: structuralAnalysis.iaScore,
      issues: structuralAnalysis.issues
    },
    contentQuality: {
      accuracyScore: accuracyVerification.accuracyScore,
      clarityScore: clarityAssessment.clarityScore,
      completenessScore: completenessAnalysis.completenessScore,
      consistencyScore: consistencyEvaluation.consistencyScore,
      maintainabilityScore: maintainabilityAssessment.maintainabilityScore
    },
    accessibilityAudit: accessibilityAudit ? {
      accessibilityScore: accessibilityAudit.accessibilityScore,
      wcagLevel: accessibilityAudit.wcagLevel,
      violations: accessibilityAudit.violations,
      warnings: accessibilityAudit.warnings
    } : null,
    userExperience: {
      uxScore: uxEvaluation.uxScore,
      navigationEffectiveness: uxEvaluation.navigationEffectiveness,
      searchability: uxEvaluation.searchability,
      mobileExperience: uxEvaluation.mobileExperience
    },
    recommendations: recommendations.recommendations,
    prioritizedRecommendations: recommendations.prioritizedRecommendations,
    actionPlan: actionPlan ? {
      phases: actionPlan.phases,
      timeline: actionPlan.timeline,
      estimatedEffort: actionPlan.estimatedEffort,
      expectedImpact: actionPlan.expectedImpact
    } : null,
    competitorAnalysis: competitorAnalysis ? {
      positioningScore: competitorAnalysis.positioningScore,
      gapAnalysis: competitorAnalysis.gapAnalysis,
      bestPractices: competitorAnalysis.bestPractices
    } : null,
    benchmarking: {
      standards: benchmarkStandards,
      complianceRate: scoring.complianceRate,
      industryComparison: scoring.industryComparison
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/docs-audit',
      timestamp: startTime,
      framework,
      targetAudience,
      auditScope,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Documentation Discovery and Inventory
export const documentationDiscoveryTask = defineTask('documentation-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and inventory documentation',
  agent: {
    name: 'documentation-discovery-specialist',
    prompt: {
      role: 'documentation analyst and information architect',
      task: 'Discover, catalog, and inventory all documentation assets',
      context: args,
      instructions: [
        'Scan provided documentation paths recursively',
        'Identify all documentation files (markdown, HTML, RST, AsciiDoc, etc.)',
        'Catalog documents by type (tutorials, guides, API reference, troubleshooting, etc.)',
        'Extract metadata: title, description, last modified, author, version',
        'Calculate document statistics: page count, word count, image count',
        'Identify documentation format and tooling (Docusaurus, MkDocs, Sphinx, etc.)',
        'Map documentation structure and hierarchy',
        'Identify navigation files (sidebar, menu, TOC)',
        'Detect documentation framework (Diataxis, custom, etc.)',
        'Identify orphaned pages (not linked from anywhere)',
        'Find broken internal links',
        'Create comprehensive documentation inventory',
        'Generate discovery report and statistics'
      ],
      outputFormat: 'JSON with inventory (array), documentCount (number), pageCount (number), wordCount (number), documentTypes (object), framework (string), tooling (string), orphanedPages (array), brokenLinks (array), coverageByType (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['inventory', 'documentCount', 'pageCount', 'documentTypes', 'artifacts'],
      properties: {
        inventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' },
              wordCount: { type: 'number' },
              imageCount: { type: 'number' },
              codeBlockCount: { type: 'number' },
              lastModified: { type: 'string' },
              author: { type: 'string' },
              version: { type: 'string' }
            }
          }
        },
        documentCount: { type: 'number' },
        pageCount: { type: 'number' },
        wordCount: { type: 'number' },
        documentTypes: {
          type: 'object',
          properties: {
            tutorials: { type: 'number' },
            howToGuides: { type: 'number' },
            reference: { type: 'number' },
            explanation: { type: 'number' },
            other: { type: 'number' }
          }
        },
        framework: { type: 'string' },
        tooling: { type: 'string' },
        orphanedPages: { type: 'array', items: { type: 'string' } },
        brokenLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              link: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        coverageByType: {
          type: 'object',
          properties: {
            tutorials: { type: 'string' },
            howToGuides: { type: 'string' },
            reference: { type: 'string' },
            explanation: { type: 'string' }
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
  labels: ['agent', 'documentation', 'audit', 'discovery']
}));

// Task 2: Structural Analysis
export const structuralAnalysisTask = defineTask('structural-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze documentation structure',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'information architect and documentation strategist',
      task: 'Analyze documentation structure, organization, and information architecture',
      context: args,
      instructions: [
        'Evaluate information architecture against best practices',
        'Assess navigation structure and hierarchy (depth, breadth)',
        'Analyze content organization (logical grouping, flow)',
        'Evaluate adherence to documentation framework (Diataxis, etc.)',
        'Check navigation effectiveness (menu, sidebar, breadcrumbs)',
        'Assess discoverability (can users find what they need?)',
        'Evaluate content hierarchy and nesting levels',
        'Check for redundant or duplicate content',
        'Assess cross-referencing and internal linking strategy',
        'Evaluate table of contents structure',
        'Check for logical progression (beginner to advanced)',
        'Identify structural gaps and misalignments',
        'Score navigation effectiveness (0-100)',
        'Score organization quality (0-100)',
        'Provide structural improvement recommendations'
      ],
      outputFormat: 'JSON with navigationScore (number), organizationScore (number), iaScore (number), frameworkCompliance (number), hierarchy (object), issues (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['navigationScore', 'organizationScore', 'iaScore', 'frameworkCompliance', 'artifacts'],
      properties: {
        navigationScore: { type: 'number', minimum: 0, maximum: 100 },
        organizationScore: { type: 'number', minimum: 0, maximum: 100 },
        iaScore: { type: 'number', minimum: 0, maximum: 100 },
        frameworkCompliance: { type: 'number', minimum: 0, maximum: 100 },
        hierarchy: {
          type: 'object',
          properties: {
            maxDepth: { type: 'number' },
            avgDepth: { type: 'number' },
            balanced: { type: 'boolean' },
            recommendedMaxDepth: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              location: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
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
  labels: ['agent', 'documentation', 'audit', 'structure']
}));

// Task 3: Content Quality Assessment
export const contentQualityTask = defineTask('content-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess content quality',
  agent: {
    name: 'content-quality-analyst',
    prompt: {
      role: 'senior technical writer and content quality analyst',
      task: 'Assess overall content quality including writing, examples, and multimedia',
      context: args,
      instructions: [
        'Evaluate writing quality (grammar, spelling, punctuation)',
        'Assess technical writing style (clarity, conciseness, precision)',
        'Check voice and tone consistency',
        'Evaluate code examples quality (correctness, relevance, completeness)',
        'Assess visual content quality (images, diagrams, screenshots)',
        'Check for outdated content and broken examples',
        'Evaluate content depth and detail appropriateness',
        'Assess balance between theory and practice',
        'Check for assumptions and prerequisites stated clearly',
        'Evaluate use of headings, lists, and formatting',
        'Check for actionable content (clear next steps)',
        'Assess content freshness and version alignment',
        'Identify content that needs updating or removal',
        'Score overall content quality (0-100)',
        'Provide specific quality improvement recommendations'
      ],
      outputFormat: 'JSON with contentQualityScore (number), writingQuality (number), examplesQuality (number), visualsQuality (number), freshness (number), outdatedContent (array), issues (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['contentQualityScore', 'writingQuality', 'examplesQuality', 'artifacts'],
      properties: {
        contentQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        writingQuality: { type: 'number', minimum: 0, maximum: 100 },
        examplesQuality: { type: 'number', minimum: 0, maximum: 100 },
        visualsQuality: { type: 'number', minimum: 0, maximum: 100 },
        freshness: { type: 'number', minimum: 0, maximum: 100 },
        outdatedContent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              reason: { type: 'string' },
              lastUpdated: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              category: { type: 'string' }
            }
          }
        },
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
  labels: ['agent', 'documentation', 'audit', 'content-quality']
}));

// Task 4: Completeness Analysis
export const completenessAnalysisTask = defineTask('completeness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze documentation completeness',
  agent: {
    name: 'completeness-analyst',
    prompt: {
      role: 'documentation completeness specialist',
      task: 'Assess documentation completeness against expected coverage',
      context: args,
      instructions: [
        'Evaluate coverage of all product features',
        'Check for getting started guide and quickstart',
        'Verify installation and setup documentation',
        'Check for comprehensive API/CLI reference',
        'Verify tutorial coverage (beginner to advanced)',
        'Check for troubleshooting and FAQ sections',
        'Verify configuration and customization docs',
        'Check for security and best practices documentation',
        'Evaluate example coverage (common use cases)',
        'Check for migration and upgrade guides',
        'Verify glossary and terminology documentation',
        'Identify missing critical documentation',
        'Assess documentation gaps by user journey',
        'Score completeness against framework expectations (0-100)',
        'Provide gap analysis and recommendations'
      ],
      outputFormat: 'JSON with completenessScore (number), coverage (object), gaps (array), missingCritical (array), missingRecommended (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['completenessScore', 'coverage', 'gaps', 'artifacts'],
      properties: {
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        coverage: {
          type: 'object',
          properties: {
            gettingStarted: { type: 'boolean' },
            installation: { type: 'boolean' },
            tutorials: { type: 'boolean' },
            apiReference: { type: 'boolean' },
            howToGuides: { type: 'boolean' },
            troubleshooting: { type: 'boolean' },
            faq: { type: 'boolean' },
            bestPractices: { type: 'boolean' },
            migration: { type: 'boolean' },
            glossary: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        missingCritical: { type: 'array', items: { type: 'string' } },
        missingRecommended: { type: 'array', items: { type: 'string' } },
        coverageByUserJourney: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              journey: { type: 'string' },
              coverage: { type: 'number' },
              gaps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'audit', 'completeness']
}));

// Task 5: Clarity and Readability Assessment
export const clarityReadabilityTask = defineTask('clarity-readability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess clarity and readability',
  agent: {
    name: 'readability-specialist',
    prompt: {
      role: 'technical communication and readability specialist',
      task: 'Assess documentation clarity, readability, and appropriateness for target audience',
      context: args,
      instructions: [
        'Analyze reading level (Flesch-Kincaid, Gunning Fog, etc.)',
        'Assess clarity of explanations and instructions',
        'Evaluate sentence structure complexity',
        'Check paragraph length and structure',
        'Assess use of jargon and technical terms (appropriate?)',
        'Evaluate active vs passive voice usage',
        'Check for ambiguous or confusing language',
        'Assess use of examples to clarify concepts',
        'Evaluate appropriateness for target audience skill level',
        'Check for clear headings and scannable content',
        'Assess logical flow and transitions',
        'Evaluate use of formatting for emphasis',
        'Check for clear calls-to-action and next steps',
        'Score clarity and readability (0-100)',
        'Provide specific readability improvement recommendations'
      ],
      outputFormat: 'JSON with clarityScore (number), readabilityScore (number), readingLevel (object), audienceAppropriate (boolean), issues (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['clarityScore', 'readabilityScore', 'readingLevel', 'audienceAppropriate', 'artifacts'],
      properties: {
        clarityScore: { type: 'number', minimum: 0, maximum: 100 },
        readabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        readingLevel: {
          type: 'object',
          properties: {
            fleschKincaid: { type: 'number' },
            gunningFog: { type: 'number' },
            averageSentenceLength: { type: 'number' },
            recommendedLevel: { type: 'string' },
            actualLevel: { type: 'string' }
          }
        },
        audienceAppropriate: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              example: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
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
  labels: ['agent', 'documentation', 'audit', 'clarity']
}));

// Task 6: Consistency Evaluation
export const consistencyEvaluationTask = defineTask('consistency-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate consistency and style',
  agent: {
    name: 'consistency-analyst',
    prompt: {
      role: 'documentation style and consistency specialist',
      task: 'Evaluate documentation consistency in style, terminology, formatting, and structure',
      context: args,
      instructions: [
        'Check terminology consistency across all documents',
        'Evaluate consistent use of voice and tone',
        'Check formatting consistency (headings, lists, code blocks)',
        'Verify consistent capitalization and punctuation',
        'Check for consistent naming conventions',
        'Evaluate consistent structure across similar doc types',
        'Check for consistent code example formatting',
        'Verify consistent link formatting',
        'Check for consistent use of admonitions (notes, warnings)',
        'Evaluate consistent metadata and front matter',
        'Identify terminology conflicts or variations',
        'Check adherence to style guide (if exists)',
        'Identify inconsistent patterns',
        'Score consistency (0-100)',
        'Provide consistency improvement recommendations'
      ],
      outputFormat: 'JSON with consistencyScore (number), terminologyConsistency (number), styleConsistency (number), formattingConsistency (number), inconsistencies (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyScore', 'terminologyConsistency', 'styleConsistency', 'artifacts'],
      properties: {
        consistencyScore: { type: 'number', minimum: 0, maximum: 100 },
        terminologyConsistency: { type: 'number', minimum: 0, maximum: 100 },
        styleConsistency: { type: 'number', minimum: 0, maximum: 100 },
        formattingConsistency: { type: 'number', minimum: 0, maximum: 100 },
        inconsistencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['terminology', 'style', 'formatting', 'structure'] },
              issue: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              recommendation: { type: 'string' }
            }
          }
        },
        terminologyVariations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              variations: { type: 'array', items: { type: 'string' } },
              recommended: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'audit', 'consistency']
}));

// Task 7: Accessibility Audit
export const accessibilityAuditTask = defineTask('accessibility-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct accessibility audit',
  agent: {
    name: 'accessibility-specialist',
    prompt: {
      role: 'accessibility specialist and WCAG compliance expert',
      task: 'Audit documentation accessibility against WCAG 2.1 standards',
      context: args,
      instructions: [
        'Check for alt text on all images and diagrams',
        'Verify proper heading hierarchy (h1, h2, h3, etc.)',
        'Check color contrast ratios (WCAG AA minimum 4.5:1)',
        'Verify keyboard navigation support',
        'Check for proper ARIA labels and roles',
        'Evaluate screen reader compatibility',
        'Check for descriptive link text (avoid "click here")',
        'Verify table accessibility (headers, captions)',
        'Check for captions/transcripts on video content',
        'Evaluate form accessibility (labels, error messages)',
        'Check for semantic HTML usage',
        'Verify focus indicators visibility',
        'Check for skip navigation links',
        'Assess mobile accessibility',
        'Score accessibility compliance (0-100)',
        'Identify WCAG violations by level (A, AA, AAA)',
        'Provide accessibility remediation recommendations'
      ],
      outputFormat: 'JSON with accessibilityScore (number), wcagLevel (string), violations (array), warnings (array), passedChecks (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['accessibilityScore', 'wcagLevel', 'violations', 'warnings', 'artifacts'],
      properties: {
        accessibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        wcagLevel: { type: 'string', enum: ['None', 'A', 'AA', 'AAA'] },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              violation: { type: 'string' },
              wcagCriterion: { type: 'string' },
              level: { type: 'string', enum: ['A', 'AA', 'AAA'] },
              impact: { type: 'string', enum: ['critical', 'serious', 'moderate', 'minor'] },
              element: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        warnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              warning: { type: 'string' },
              wcagCriterion: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        passedChecks: { type: 'array', items: { type: 'string' } },
        complianceSummary: {
          type: 'object',
          properties: {
            levelA: { type: 'number' },
            levelAA: { type: 'number' },
            levelAAA: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'audit', 'accessibility']
}));

// Task 8: Technical Accuracy Verification
export const technicalAccuracyTask = defineTask('technical-accuracy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify technical accuracy',
  agent: {
    name: 'technical-accuracy-reviewer',
    prompt: {
      role: 'senior technical reviewer and subject matter expert',
      task: 'Verify technical accuracy of documentation content',
      context: args,
      instructions: [
        'Review code examples for correctness and best practices',
        'Verify API/CLI syntax and parameters accuracy',
        'Check version-specific information accuracy',
        'Verify configuration examples correctness',
        'Review technical specifications accuracy',
        'Check for deprecated features marked appropriately',
        'Verify command outputs and error messages',
        'Check technical terminology accuracy',
        'Verify system requirements and prerequisites',
        'Review architecture diagrams accuracy',
        'Check for technically misleading statements',
        'Verify links to external technical resources',
        'Identify potentially incorrect technical information',
        'Score technical accuracy (0-100)',
        'Provide correction recommendations'
      ],
      outputFormat: 'JSON with accuracyScore (number), codeAccuracy (number), apiAccuracy (number), inaccuracies (array), deprecatedNotMarked (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['accuracyScore', 'codeAccuracy', 'inaccuracies', 'artifacts'],
      properties: {
        accuracyScore: { type: 'number', minimum: 0, maximum: 100 },
        codeAccuracy: { type: 'number', minimum: 0, maximum: 100 },
        apiAccuracy: { type: 'number', minimum: 0, maximum: 100 },
        inaccuracies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              inaccuracy: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              currentContent: { type: 'string' },
              correction: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        deprecatedNotMarked: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              feature: { type: 'string' },
              deprecatedSince: { type: 'string' }
            }
          }
        },
        brokenCodeExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'string' },
              example: { type: 'string' },
              issue: { type: 'string' },
              fix: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'audit', 'accuracy']
}));

// Task 9: Maintainability Assessment
export const maintainabilityAssessmentTask = defineTask('maintainability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess documentation maintainability',
  agent: {
    name: 'maintainability-analyst',
    prompt: {
      role: 'documentation operations and maintainability specialist',
      task: 'Assess documentation maintainability and operational efficiency',
      context: args,
      instructions: [
        'Evaluate docs-as-code setup (version control, CI/CD)',
        'Check for content reuse and modularization (includes, partials)',
        'Assess automation level (build, deploy, link checking)',
        'Evaluate documentation versioning strategy',
        'Check for single source of truth (no duplication)',
        'Assess ease of contribution (templates, guidelines)',
        'Check for automated testing (link checking, spell checking)',
        'Evaluate documentation build process efficiency',
        'Check for proper metadata and taxonomy',
        'Assess documentation governance (ownership, review process)',
        'Evaluate scalability of current structure',
        'Check for documentation debt indicators',
        'Assess toolchain maturity and sustainability',
        'Score maintainability (0-100)',
        'Provide maintainability improvement recommendations'
      ],
      outputFormat: 'JSON with maintainabilityScore (number), docsAsCodeScore (number), automationLevel (number), reuseLevel (number), issues (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['maintainabilityScore', 'docsAsCodeScore', 'automationLevel', 'artifacts'],
      properties: {
        maintainabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        docsAsCodeScore: { type: 'number', minimum: 0, maximum: 100 },
        automationLevel: { type: 'number', minimum: 0, maximum: 100 },
        reuseLevel: { type: 'number', minimum: 0, maximum: 100 },
        versioningStrategy: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            strategy: { type: 'string' },
            adequate: { type: 'boolean' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        duplicationDetected: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              locations: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'audit', 'maintainability']
}));

// Task 10: User Experience Evaluation
export const userExperienceTask = defineTask('user-experience', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate user experience',
  agent: {
    name: 'ux-specialist',
    prompt: {
      role: 'documentation UX specialist and usability expert',
      task: 'Evaluate documentation user experience and usability',
      context: args,
      instructions: [
        'Assess search functionality effectiveness',
        'Evaluate navigation ease and intuitiveness',
        'Check for clear entry points for different personas',
        'Assess page load performance',
        'Evaluate mobile responsiveness and experience',
        'Check for clear feedback mechanisms (ratings, comments)',
        'Assess visual design and readability',
        'Evaluate white space and content density',
        'Check for clear calls-to-action and next steps',
        'Assess discoverability of related content',
        'Evaluate copy-paste experience for code',
        'Check for dark mode support',
        'Assess offline availability (if applicable)',
        'Evaluate print-friendly formatting',
        'Score overall UX (0-100)',
        'Provide UX improvement recommendations'
      ],
      outputFormat: 'JSON with uxScore (number), navigationEffectiveness (number), searchability (number), mobileExperience (number), performance (number), issues (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['uxScore', 'navigationEffectiveness', 'searchability', 'artifacts'],
      properties: {
        uxScore: { type: 'number', minimum: 0, maximum: 100 },
        navigationEffectiveness: { type: 'number', minimum: 0, maximum: 100 },
        searchability: { type: 'number', minimum: 0, maximum: 100 },
        mobileExperience: { type: 'number', minimum: 0, maximum: 100 },
        performance: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              area: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              userImpact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        searchAnalysis: {
          type: 'object',
          properties: {
            searchExists: { type: 'boolean' },
            searchQuality: { type: 'string' },
            filteringAvailable: { type: 'boolean' },
            recommendedImprovements: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'audit', 'ux']
}));

// Task 11: Competitor Analysis
export const competitorAnalysisTask = defineTask('competitor-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct competitive analysis',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive intelligence and documentation strategy analyst',
      task: 'Analyze competitor documentation and identify best practices and gaps',
      context: args,
      instructions: [
        'Identify key competitors in the space',
        'Analyze competitor documentation structure and organization',
        'Evaluate competitor documentation quality',
        'Identify best practices from leading competitors',
        'Compare completeness vs competitors',
        'Analyze competitor onboarding experience',
        'Compare search and navigation approaches',
        'Identify unique or innovative features in competitor docs',
        'Assess areas where current docs excel',
        'Identify gaps compared to competitors',
        'Analyze competitor use of multimedia and interactivity',
        'Compare community features (comments, forums)',
        'Score relative positioning vs competitors',
        'Provide competitive differentiation recommendations',
        'Suggest competitive advantages to pursue'
      ],
      outputFormat: 'JSON with positioningScore (number), competitors (array), bestPractices (array), gaps (array), advantages (array), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['positioningScore', 'competitors', 'bestPractices', 'gapAnalysis', 'artifacts'],
      properties: {
        positioningScore: { type: 'number', minimum: 0, maximum: 100 },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              docsUrl: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              overallScore: { type: 'number' }
            }
          }
        },
        bestPractices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              practice: { type: 'string' },
              source: { type: 'string' },
              benefit: { type: 'string' },
              adoptionRecommendation: { type: 'string' }
            }
          }
        },
        gapAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              competitorHas: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        advantages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              advantage: { type: 'string' },
              description: { type: 'string' },
              maintainRecommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'audit', 'competitive-analysis']
}));

// Task 12: Scoring and Aggregation
export const scoringAggregationTask = defineTask('scoring-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate overall scores and aggregation',
  agent: {
    name: 'scoring-analyst',
    prompt: {
      role: 'documentation quality analyst and scoring specialist',
      task: 'Aggregate all audit results and calculate weighted overall score',
      context: args,
      instructions: [
        'Aggregate scores from all audit phases',
        'Apply weights to each component based on audit scope:',
        '  - Completeness: 20%',
        '  - Accuracy: 25%',
        '  - Clarity: 20%',
        '  - Consistency: 15%',
        '  - Accessibility: 10% (if included)',
        '  - Maintainability: 10%',
        'Calculate weighted overall score (0-100)',
        'Determine pass/fail against benchmark standards',
        'Aggregate all critical issues across phases',
        'Aggregate all major issues',
        'Aggregate all minor issues',
        'Identify top 5 strengths',
        'Identify top 5 weaknesses',
        'Calculate compliance rate vs benchmarks',
        'Compare scores vs industry standards',
        'Generate score breakdown visualization data',
        'Create executive summary of findings'
      ],
      outputFormat: 'JSON with overallScore (number), componentScores (object), criticalIssues (array), majorIssues (array), minorIssues (array), strengths (array), weaknesses (array), complianceRate (number), industryComparison (object), recommendations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'criticalIssues', 'majorIssues', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            accuracy: { type: 'number' },
            clarity: { type: 'number' },
            consistency: { type: 'number' },
            accessibility: { type: 'number' },
            maintainability: { type: 'number' },
            userExperience: { type: 'number' }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              issue: { type: 'string' },
              impact: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        majorIssues: { type: 'array' },
        minorIssues: { type: 'array' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        complianceRate: { type: 'number', minimum: 0, maximum: 100 },
        industryComparison: {
          type: 'object',
          properties: {
            vsIndustryAverage: { type: 'string' },
            vsLeaders: { type: 'string' },
            percentile: { type: 'number' }
          }
        },
        scoreBreakdown: {
          type: 'object',
          properties: {
            weights: { type: 'object' },
            contributions: { type: 'object' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'audit', 'scoring']
}));

// Task 13: Recommendations Generation
export const recommendationsTask = defineTask('recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate recommendations',
  agent: {
    name: 'recommendations-strategist',
    prompt: {
      role: 'documentation strategy consultant and improvement specialist',
      task: 'Generate prioritized, actionable recommendations based on audit findings',
      context: args,
      instructions: [
        'Consolidate recommendations from all audit phases',
        'Remove duplicate recommendations',
        'Categorize recommendations by area (content, structure, accessibility, etc.)',
        'Assess impact of each recommendation (high, medium, low)',
        'Estimate effort for each recommendation (high, medium, low)',
        'Calculate priority score (impact vs effort)',
        'Create quick wins list (low effort, high impact)',
        'Create strategic improvements list (high impact)',
        'Create maintenance improvements list',
        'Provide specific, actionable guidance for each recommendation',
        'Estimate timeline for implementation',
        'Identify dependencies between recommendations',
        'Create prioritized recommendation list',
        'Generate recommendation implementation guide'
      ],
      outputFormat: 'JSON with recommendations (array), prioritizedRecommendations (array), quickWins (array), strategicImprovements (array), categories (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritizedRecommendations', 'quickWins', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              priority: { type: 'number' },
              rationale: { type: 'string' },
              actionableSteps: { type: 'array', items: { type: 'string' } },
              estimatedTime: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prioritizedRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              recommendation: { type: 'string' },
              priorityScore: { type: 'number' },
              justification: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              effort: { type: 'string' },
              impact: { type: 'string' },
              estimatedTime: { type: 'string' }
            }
          }
        },
        strategicImprovements: { type: 'array' },
        categories: {
          type: 'object',
          properties: {
            content: { type: 'number' },
            structure: { type: 'number' },
            accessibility: { type: 'number' },
            ux: { type: 'number' },
            maintainability: { type: 'number' }
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
  labels: ['agent', 'documentation', 'audit', 'recommendations']
}));

// Task 14: Action Plan Generation
export const actionPlanTask = defineTask('action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate improvement action plan',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'documentation project manager and implementation strategist',
      task: 'Create phased action plan for implementing audit recommendations',
      context: args,
      instructions: [
        'Group recommendations into logical implementation phases',
        'Phase 1: Critical fixes and quick wins (immediate)',
        'Phase 2: High-priority improvements (1-2 months)',
        'Phase 3: Strategic enhancements (3-6 months)',
        'Phase 4: Long-term investments (6+ months)',
        'Define objectives and deliverables for each phase',
        'Estimate effort and resources for each phase',
        'Identify team members and roles needed',
        'Create timeline with milestones',
        'Define success metrics for each phase',
        'Identify risks and mitigation strategies',
        'Create phase dependencies and prerequisites',
        'Estimate expected impact on overall score',
        'Generate implementation roadmap',
        'Create tracking and reporting structure'
      ],
      outputFormat: 'JSON with phases (array), timeline (object), estimatedEffort (object), expectedImpact (object), resources (array), successMetrics (array), risks (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'estimatedEffort', 'expectedImpact', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              effort: { type: 'string' },
              expectedScoreImprovement: { type: 'number' },
              prerequisites: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            startDate: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  targetDate: { type: 'string' },
                  deliverables: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        estimatedEffort: {
          type: 'object',
          properties: {
            totalHours: { type: 'number' },
            byPhase: { type: 'object' },
            byRole: { type: 'object' }
          }
        },
        expectedImpact: {
          type: 'object',
          properties: {
            currentScore: { type: 'number' },
            targetScore: { type: 'number' },
            scoreImprovementByPhase: { type: 'array' }
          }
        },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              allocation: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              baseline: { type: 'string' },
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
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
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
  labels: ['agent', 'documentation', 'audit', 'action-planning']
}));

// Task 15: Final Report Generation
export const finalReportTask = defineTask('final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive audit report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'senior technical writer and audit report specialist',
      task: 'Generate comprehensive, executive-ready documentation audit report',
      context: args,
      instructions: [
        'Create executive summary (1-2 pages):',
        '  - Overall score and pass/fail status',
        '  - Key findings and critical issues',
        '  - Top recommendations',
        '  - Expected impact of improvements',
        'Create detailed findings section:',
        '  - Discovery and inventory results',
        '  - Structural analysis findings',
        '  - Content quality assessment',
        '  - Completeness analysis',
        '  - Clarity and readability results',
        '  - Consistency evaluation',
        '  - Accessibility audit (if performed)',
        '  - Technical accuracy verification',
        '  - Maintainability assessment',
        '  - User experience evaluation',
        '  - Competitive analysis (if performed)',
        'Create scoring and benchmarking section',
        'Create recommendations section with prioritization',
        'Create action plan section (if generated)',
        'Include appendices: detailed issue lists, methodology, standards',
        'Generate visualizations: score charts, comparison graphs',
        'Format for multiple audiences (executives, technical writers, developers)',
        'Create presentation-ready summary slides'
      ],
      outputFormat: 'JSON with executiveSummary (string), detailedFindings (object), scoringSection (object), recommendationsSection (object), actionPlanSection (object), appendices (object), visualizations (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'detailedFindings', 'artifacts'],
      properties: {
        executiveSummary: { type: 'string' },
        detailedFindings: {
          type: 'object',
          properties: {
            discovery: { type: 'object' },
            structural: { type: 'object' },
            contentQuality: { type: 'object' },
            completeness: { type: 'object' },
            clarity: { type: 'object' },
            consistency: { type: 'object' },
            accessibility: { type: 'object' },
            accuracy: { type: 'object' },
            maintainability: { type: 'object' },
            userExperience: { type: 'object' },
            competitive: { type: 'object' }
          }
        },
        scoringSection: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            componentScores: { type: 'object' },
            benchmarking: { type: 'object' },
            trends: { type: 'object' }
          }
        },
        recommendationsSection: {
          type: 'object',
          properties: {
            prioritized: { type: 'array' },
            quickWins: { type: 'array' },
            strategic: { type: 'array' }
          }
        },
        actionPlanSection: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            timeline: { type: 'object' },
            resources: { type: 'array' }
          }
        },
        appendices: {
          type: 'object',
          properties: {
            methodology: { type: 'string' },
            standards: { type: 'object' },
            detailedIssues: { type: 'array' },
            references: { type: 'array' }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              data: { type: 'object' },
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
  labels: ['agent', 'documentation', 'audit', 'reporting']
}));
