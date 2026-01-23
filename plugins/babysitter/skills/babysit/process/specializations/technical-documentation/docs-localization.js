/**
 * @process specializations/technical-documentation/docs-localization
 * @description Documentation Localization and Translation Management - Comprehensive process for internationalizing
 * documentation and managing translation workflows with translation memory, glossaries, locale-specific content,
 * automated translation pipelines, quality assurance, and localization testing.
 * @specialization Technical Documentation
 * @category Internationalization
 * @inputs { projectName: string, docsPath: string, sourceLocale: string, targetLocales: array, translationApproach?: string, outputDir?: string }
 * @outputs { success: boolean, translationStats: object, qualityMetrics: object, localizedArtifacts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/technical-documentation/docs-localization', {
 *   projectName: 'Product Documentation',
 *   docsPath: './docs',
 *   sourceLocale: 'en-US',
 *   targetLocales: ['es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'zh-CN', 'pt-BR'],
 *   translationApproach: 'hybrid', // 'machine', 'human', 'hybrid', 'community'
 *   translationProvider: 'crowdin', // 'crowdin', 'transifex', 'weblate', 'lokalise', 'phrase'
 *   glossaryPath: './glossary.csv',
 *   translationMemoryPath: './translation-memory.tmx',
 *   outputDir: 'localized-docs',
 *   includeUIStrings: true,
 *   localeMapping: { 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant' },
 *   contextScreenshots: true,
 *   pseudoLocalization: true,
 *   acceptanceCriteria: {
 *     minTranslationQuality: 85,
 *     minTermConsistency: 90,
 *     maxMissingTranslations: 5,
 *     requireNativeReview: true
 *   }
 * });
 *
 * @references
 * - Crowdin: https://crowdin.com/
 * - Transifex: https://www.transifex.com/
 * - Weblate: https://weblate.org/
 * - i18next: https://www.i18next.com/
 * - GNU gettext: https://www.gnu.org/software/gettext/
 * - XLIFF: http://docs.oasis-open.org/xliff/xliff-core/v2.1/xliff-core-v2.1.html
 * - ICU Message Format: https://unicode-org.github.io/icu/userguide/format_parse/messages/
 * - Localization Best Practices: https://developers.google.com/international
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    docsPath,
    sourceLocale = 'en-US',
    targetLocales = [],
    translationApproach = 'hybrid', // 'machine', 'human', 'hybrid', 'community'
    translationProvider = 'crowdin', // 'crowdin', 'transifex', 'weblate', 'lokalise', 'phrase'
    glossaryPath = null,
    translationMemoryPath = null,
    outputDir = 'localized-docs',
    includeUIStrings = true,
    localeMapping = {},
    contextScreenshots = true,
    pseudoLocalization = false,
    acceptanceCriteria = {
      minTranslationQuality: 85,
      minTermConsistency: 90,
      maxMissingTranslations: 5,
      requireNativeReview: true
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let translationStats = {};
  let qualityMetrics = {};
  let localizedArtifacts = [];

  if (targetLocales.length === 0) {
    return {
      success: false,
      error: 'No target locales specified',
      metadata: {
        processId: 'specializations/technical-documentation/docs-localization',
        timestamp: startTime
      }
    };
  }

  ctx.log('info', `Starting Documentation Localization for ${projectName}`);
  ctx.log('info', `Source locale: ${sourceLocale}, Target locales: ${targetLocales.join(', ')}`);
  ctx.log('info', `Translation approach: ${translationApproach}, Provider: ${translationProvider}`);

  // ============================================================================
  // PHASE 1: CONTENT INVENTORY AND I18N READINESS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing source content and assessing i18n readiness');

  const contentInventory = await ctx.task(contentInventoryTask, {
    projectName,
    docsPath,
    sourceLocale,
    includeUIStrings,
    outputDir
  });

  artifacts.push(...contentInventory.artifacts);

  if (!contentInventory.success) {
    return {
      success: false,
      error: 'Failed to analyze source content',
      details: contentInventory,
      metadata: {
        processId: 'specializations/technical-documentation/docs-localization',
        timestamp: startTime
      }
    };
  }

  // Quality Gate: i18n readiness issues
  if (contentInventory.i18nIssues.length > 0) {
    await ctx.breakpoint({
      question: `Found ${contentInventory.i18nIssues.length} i18n readiness issues (hardcoded text, non-translatable strings, locale-specific formats). Review and fix before proceeding?`,
      title: 'I18n Readiness Assessment',
      context: {
        runId: ctx.runId,
        totalStrings: contentInventory.totalStrings,
        translatableStrings: contentInventory.translatableStrings,
        i18nIssues: contentInventory.i18nIssues,
        recommendations: contentInventory.recommendations,
        files: contentInventory.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: GLOSSARY AND TERMINOLOGY MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Building terminology glossary and translation memory');

  const glossarySetup = await ctx.task(glossarySetupTask, {
    projectName,
    docsPath,
    sourceLocale,
    targetLocales,
    glossaryPath,
    contentInventory,
    outputDir
  });

  artifacts.push(...glossarySetup.artifacts);

  // Breakpoint: Review glossary
  await ctx.breakpoint({
    question: `Glossary created with ${glossarySetup.termCount} terms. Review terminology and approve for translation?`,
    title: 'Glossary Review',
    context: {
      runId: ctx.runId,
      termCount: glossarySetup.termCount,
      glossaryPath: glossarySetup.glossaryPath,
      termsByCategory: glossarySetup.termsByCategory,
      doNotTranslateList: glossarySetup.doNotTranslateList,
      files: glossarySetup.artifacts.map(a => ({ path: a.path, format: a.format || 'csv' }))
    }
  });

  // ============================================================================
  // PHASE 3: TRANSLATION MEMORY PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Preparing translation memory from existing translations');

  const tmSetup = await ctx.task(translationMemorySetupTask, {
    projectName,
    translationMemoryPath,
    sourceLocale,
    targetLocales,
    docsPath,
    outputDir
  });

  artifacts.push(...tmSetup.artifacts);

  // ============================================================================
  // PHASE 4: TRANSLATION PLATFORM CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring translation platform and workflow');

  const platformConfig = await ctx.task(translationPlatformConfigTask, {
    projectName,
    translationProvider,
    sourceLocale,
    targetLocales,
    translationApproach,
    glossarySetup,
    tmSetup,
    localeMapping,
    outputDir
  });

  artifacts.push(...platformConfig.artifacts);

  if (!platformConfig.success) {
    return {
      success: false,
      error: 'Failed to configure translation platform',
      details: platformConfig,
      metadata: {
        processId: 'specializations/technical-documentation/docs-localization',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 5: SOURCE CONTENT EXTRACTION AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Extracting translatable content and preparing translation files');

  const contentExtraction = await ctx.task(contentExtractionTask, {
    projectName,
    docsPath,
    sourceLocale,
    contentInventory,
    translationProvider,
    includeUIStrings,
    contextScreenshots,
    outputDir
  });

  artifacts.push(...contentExtraction.artifacts);

  translationStats.sourceStrings = contentExtraction.sourceStrings;
  translationStats.sourceWords = contentExtraction.sourceWords;

  // ============================================================================
  // PHASE 6: PSEUDO-LOCALIZATION TESTING (OPTIONAL)
  // ============================================================================

  let pseudoLocResults = null;
  if (pseudoLocalization) {
    ctx.log('info', 'Phase 6: Generating pseudo-localization for testing');

    pseudoLocResults = await ctx.task(pseudoLocalizationTask, {
      projectName,
      contentExtraction,
      sourceLocale,
      outputDir
    });

    artifacts.push(...pseudoLocResults.artifacts);

    await ctx.breakpoint({
      question: 'Pseudo-localization generated. Review for layout issues, text expansion problems, and encoding issues before proceeding with actual translation?',
      title: 'Pseudo-Localization Review',
      context: {
        runId: ctx.runId,
        pseudoLocale: pseudoLocResults.pseudoLocale,
        expansionFactor: pseudoLocResults.expansionFactor,
        issuesFound: pseudoLocResults.issuesFound,
        files: pseudoLocResults.artifacts.map(a => ({ path: a.path, format: a.format || 'html' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: TRANSLATION EXECUTION (PARALLEL BY LOCALE)
  // ============================================================================

  ctx.log('info', 'Phase 7: Executing translations in parallel for all target locales');

  const translationTasks = targetLocales.map(locale =>
    () => ctx.task(translationExecutionTask, {
      projectName,
      locale,
      sourceLocale,
      translationApproach,
      translationProvider,
      platformConfig,
      contentExtraction,
      glossarySetup,
      tmSetup,
      outputDir
    })
  );

  const translationResults = await ctx.parallel.all(translationTasks);

  artifacts.push(...translationResults.flatMap(r => r.artifacts));

  const totalTranslations = translationResults.reduce((sum, r) => sum + r.translatedStrings, 0);
  ctx.log('info', `Total translations completed: ${totalTranslations}`);

  // Quality Gate: Missing translations
  const localesWithIssues = translationResults.filter(r =>
    r.missingTranslations > acceptanceCriteria.maxMissingTranslations ||
    r.translationQuality < acceptanceCriteria.minTranslationQuality
  );

  if (localesWithIssues.length > 0) {
    await ctx.breakpoint({
      question: `${localesWithIssues.length} locales have quality issues (missing translations or low quality). Review and address issues?`,
      title: 'Translation Quality Issues',
      context: {
        runId: ctx.runId,
        localesWithIssues: localesWithIssues.map(r => ({
          locale: r.locale,
          missingTranslations: r.missingTranslations,
          translationQuality: r.translationQuality,
          issues: r.issues
        })),
        acceptanceCriteria,
        files: localesWithIssues.flatMap(r => r.artifacts).map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: TRANSLATION QUALITY ASSURANCE (PARALLEL BY LOCALE)
  // ============================================================================

  ctx.log('info', 'Phase 8: Running quality assurance checks on translations');

  const qaTasks = translationResults.map(transResult =>
    () => ctx.task(translationQATask, {
      projectName,
      locale: transResult.locale,
      sourceLocale,
      translationResult: transResult,
      glossarySetup,
      contentInventory,
      acceptanceCriteria,
      outputDir
    })
  );

  const qaResults = await ctx.parallel.all(qaTasks);

  artifacts.push(...qaResults.flatMap(r => r.artifacts));

  // Quality Gate: QA failures
  const failedQA = qaResults.filter(r => !r.passed);
  if (failedQA.length > 0) {
    await ctx.breakpoint({
      question: `${failedQA.length} locales failed QA checks. Review and fix quality issues before proceeding?`,
      title: 'Translation QA Failures',
      context: {
        runId: ctx.runId,
        failedLocales: failedQA.map(r => ({
          locale: r.locale,
          issues: r.issues,
          termConsistency: r.termConsistency,
          missingVariables: r.missingVariables,
          formatErrors: r.formatErrors
        })),
        files: failedQA.flatMap(r => r.artifacts).map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: LOCALIZED CONTENT INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Integrating localized content into documentation structure');

  const integrationTasks = translationResults.map(transResult =>
    () => ctx.task(contentIntegrationTask, {
      projectName,
      locale: transResult.locale,
      sourceLocale,
      docsPath,
      translationResult: transResult,
      localeMapping,
      outputDir
    })
  );

  const integrationResults = await ctx.parallel.all(integrationTasks);

  artifacts.push(...integrationResults.flatMap(r => r.artifacts));
  localizedArtifacts.push(...integrationResults.flatMap(r => r.localizedFiles));

  // ============================================================================
  // PHASE 10: LOCALE-SPECIFIC CUSTOMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Applying locale-specific customizations and cultural adaptations');

  const customizationTasks = integrationResults.map(intResult =>
    () => ctx.task(localeCustomizationTask, {
      projectName,
      locale: intResult.locale,
      sourceLocale,
      localizedFiles: intResult.localizedFiles,
      outputDir
    })
  );

  const customizationResults = await ctx.parallel.all(customizationTasks);

  artifacts.push(...customizationResults.flatMap(r => r.artifacts));

  // ============================================================================
  // PHASE 11: LOCALIZATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Testing localized documentation for functionality and rendering');

  const testingTasks = integrationResults.map(intResult =>
    () => ctx.task(localizationTestingTask, {
      projectName,
      locale: intResult.locale,
      sourceLocale,
      localizedFiles: intResult.localizedFiles,
      outputDir
    })
  );

  const testingResults = await ctx.parallel.all(testingTasks);

  artifacts.push(...testingResults.flatMap(r => r.artifacts));

  // Quality Gate: Localization testing failures
  const testFailures = testingResults.filter(r => r.failedTests > 0);
  if (testFailures.length > 0) {
    await ctx.breakpoint({
      question: `${testFailures.length} locales have test failures (broken links, rendering issues, encoding problems). Review and fix before deployment?`,
      title: 'Localization Testing Failures',
      context: {
        runId: ctx.runId,
        testFailures: testFailures.map(r => ({
          locale: r.locale,
          failedTests: r.failedTests,
          failures: r.failures
        })),
        files: testFailures.flatMap(r => r.artifacts).map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 12: NATIVE REVIEWER FEEDBACK (IF REQUIRED)
  // ============================================================================

  let nativeReviewResults = null;
  if (acceptanceCriteria.requireNativeReview) {
    ctx.log('info', 'Phase 12: Coordinating native reviewer feedback');

    nativeReviewResults = await ctx.task(nativeReviewTask, {
      projectName,
      targetLocales,
      translationResults,
      integrationResults,
      outputDir
    });

    artifacts.push(...nativeReviewResults.artifacts);

    await ctx.breakpoint({
      question: `Native review initiated for ${targetLocales.length} locales. Review feedback and incorporate changes?`,
      title: 'Native Reviewer Feedback',
      context: {
        runId: ctx.runId,
        reviewStatus: nativeReviewResults.reviewStatus,
        feedbackSummary: nativeReviewResults.feedbackSummary,
        files: nativeReviewResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 13: LOCALE SWITCHER AND I18N INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 13: Setting up locale switcher and i18n infrastructure');

  const i18nInfrastructure = await ctx.task(i18nInfrastructureTask, {
    projectName,
    sourceLocale,
    targetLocales,
    localeMapping,
    integrationResults,
    outputDir
  });

  artifacts.push(...i18nInfrastructure.artifacts);

  // ============================================================================
  // PHASE 14: TRANSLATION METRICS AND QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 14: Calculating final translation metrics and quality scores');

  const metricsAssessment = await ctx.task(translationMetricsTask, {
    projectName,
    sourceLocale,
    targetLocales,
    contentInventory,
    translationResults,
    qaResults,
    testingResults,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...metricsAssessment.artifacts);

  translationStats = metricsAssessment.translationStats;
  qualityMetrics = metricsAssessment.qualityMetrics;

  // Quality Gate: Overall quality assessment
  const overallQuality = metricsAssessment.overallQualityScore;
  if (overallQuality < acceptanceCriteria.minTranslationQuality) {
    await ctx.breakpoint({
      question: `Overall translation quality: ${overallQuality}%. Target: ${acceptanceCriteria.minTranslationQuality}%. Below threshold. Review quality report and decide to improve or proceed?`,
      title: 'Translation Quality Assessment',
      context: {
        runId: ctx.runId,
        overallQuality,
        targetQuality: acceptanceCriteria.minTranslationQuality,
        qualityByLocale: metricsAssessment.qualityByLocale,
        recommendations: metricsAssessment.recommendations,
        files: metricsAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 15: LOCALIZATION DEPLOYMENT PACKAGE
  // ============================================================================

  ctx.log('info', 'Phase 15: Creating localization deployment package');

  const deploymentPackage = await ctx.task(localizationDeploymentTask, {
    projectName,
    sourceLocale,
    targetLocales,
    integrationResults,
    i18nInfrastructure,
    translationStats,
    qualityMetrics,
    outputDir
  });

  artifacts.push(...deploymentPackage.artifacts);

  // Final Breakpoint: Review complete localization
  await ctx.breakpoint({
    question: `Documentation localization complete for ${projectName}. ${targetLocales.length} locales, overall quality: ${overallQuality}%. Review and approve for deployment?`,
    title: 'Final Localization Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'html',
        locale: a.locale || undefined,
        label: a.label || undefined
      })),
      summary: {
        sourceLocale,
        targetLocales,
        totalStrings: translationStats.totalStrings,
        translatedStrings: translationStats.translatedStrings,
        overallQuality,
        localesCompleted: translationResults.length,
        deploymentReady: deploymentPackage.deploymentReady
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    sourceLocale,
    targetLocales,
    translationApproach,
    translationProvider,
    translationStats: {
      totalStrings: translationStats.totalStrings,
      translatedStrings: translationStats.translatedStrings,
      sourceWords: translationStats.sourceWords,
      translatedWords: translationStats.translatedWords,
      completionPercentage: translationStats.completionPercentage,
      averageTranslationTime: translationStats.averageTranslationTime
    },
    qualityMetrics: {
      overallQualityScore: qualityMetrics.overallQualityScore,
      termConsistency: qualityMetrics.termConsistency,
      translationAccuracy: qualityMetrics.translationAccuracy,
      localesCoverage: qualityMetrics.localesCoverage,
      qualityByLocale: qualityMetrics.qualityByLocale
    },
    localizedArtifacts: localizedArtifacts.map(a => ({
      locale: a.locale,
      path: a.path,
      type: a.type,
      size: a.size
    })),
    deployment: {
      deploymentReady: deploymentPackage.deploymentReady,
      deploymentInstructions: deploymentPackage.deploymentInstructions,
      localeSwitcher: i18nInfrastructure.localeSwitcherEnabled
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/docs-localization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Content Inventory and I18n Readiness
export const contentInventoryTask = defineTask('content-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze source content and assess i18n readiness',
  agent: {
    name: 'i18n-auditor',
    prompt: {
      role: 'internationalization specialist and content analyst',
      task: 'Analyze documentation content for translation readiness and identify i18n issues',
      context: args,
      instructions: [
        'Scan all documentation files in docsPath',
        'Inventory all content elements:',
        '  - Text content (headings, paragraphs, lists)',
        '  - UI strings (buttons, labels, messages)',
        '  - Code examples and comments',
        '  - Images with embedded text',
        '  - Videos and media with captions',
        'Count total strings and words to be translated',
        'Identify i18n readiness issues:',
        '  - Hardcoded text that should be externalized',
        '  - Non-translatable strings mixed with translatable content',
        '  - Locale-specific date/time/number formats',
        '  - Cultural references or idioms',
        '  - Text in images that needs localization',
        '  - Right-to-left (RTL) language considerations',
        '  - Text concatenation that breaks in translation',
        '  - String interpolation issues',
        'Check for proper character encoding (UTF-8)',
        'Identify content that should not be translated (code, commands, URLs)',
        'Generate recommendations for fixing i18n issues',
        'Save content inventory and i18n assessment report'
      ],
      outputFormat: 'JSON with success (boolean), totalStrings (number), translatableStrings (number), totalWords (number), contentTypes (array), i18nIssues (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalStrings', 'translatableStrings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalStrings: { type: 'number' },
        translatableStrings: { type: 'number' },
        totalWords: { type: 'number' },
        contentTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              count: { type: 'number' }
            }
          }
        },
        i18nIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              file: { type: 'string' },
              description: { type: 'string' },
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
  labels: ['agent', 'localization', 'content-inventory']
}));

// Task 2: Glossary Setup
export const glossarySetupTask = defineTask('glossary-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build terminology glossary and do-not-translate list',
  agent: {
    name: 'terminology-manager',
    prompt: {
      role: 'terminology management specialist',
      task: 'Create comprehensive glossary and terminology database for consistent translation',
      context: args,
      instructions: [
        'Extract key terms from source documentation:',
        '  - Product names and features',
        '  - Technical terminology',
        '  - UI elements and labels',
        '  - Error messages',
        '  - API endpoints and parameters',
        'If glossaryPath provided, import existing glossary',
        'Categorize terms:',
        '  - Translate (with approved translations)',
        '  - Do not translate (brand names, code, commands)',
        '  - Translate with caution (context-dependent)',
        'For each term, define:',
        '  - Source language term',
        '  - Definition and context',
        '  - Part of speech',
        '  - Translation guidelines',
        '  - Example usage',
        '  - Approved translations per target locale (if available)',
        'Create do-not-translate list:',
        '  - Product names and trademarks',
        '  - Code keywords and syntax',
        '  - Commands and CLI flags',
        '  - URLs and file paths',
        '  - API identifiers',
        'Export glossary in multiple formats:',
        '  - CSV (for spreadsheet tools)',
        '  - TBX (Term Base Exchange)',
        '  - JSON (for programmatic access)',
        '  - Platform-specific formats (Crowdin, Transifex)',
        'Save glossary files and term database'
      ],
      outputFormat: 'JSON with termCount (number), glossaryPath (string), termsByCategory (object), doNotTranslateList (array), approvedTranslations (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['termCount', 'glossaryPath', 'artifacts'],
      properties: {
        termCount: { type: 'number' },
        glossaryPath: { type: 'string' },
        termsByCategory: {
          type: 'object',
          properties: {
            translate: { type: 'number' },
            doNotTranslate: { type: 'number' },
            translateWithCaution: { type: 'number' }
          }
        },
        doNotTranslateList: { type: 'array', items: { type: 'string' } },
        approvedTranslations: {
          type: 'object',
          additionalProperties: { type: 'object' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'glossary']
}));

// Task 3: Translation Memory Setup
export const translationMemorySetupTask = defineTask('translation-memory-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare translation memory from existing translations',
  agent: {
    name: 'tm-specialist',
    prompt: {
      role: 'translation memory engineer',
      task: 'Build or import translation memory to leverage existing translations',
      context: args,
      instructions: [
        'If translationMemoryPath provided:',
        '  - Import existing TMX (Translation Memory eXchange) file',
        '  - Validate translation units',
        '  - Count translation pairs per language',
        'If no existing TM, create new translation memory:',
        '  - Scan for any existing translated content',
        '  - Extract aligned source-target pairs',
        '  - Build initial TM from parallel content',
        'Organize translation memory:',
        '  - Segment by source and target locale',
        '  - Add metadata (creation date, author, quality score)',
        '  - Tag by domain or subject area',
        'Calculate TM coverage:',
        '  - Percentage of new content covered by existing TM',
        '  - Match quality (exact, fuzzy, no match)',
        '  - Potential cost savings from TM leverage',
        'Export TM in standard formats:',
        '  - TMX (Translation Memory eXchange)',
        '  - XLIFF (XML Localization Interchange File Format)',
        '  - Platform-specific formats',
        'Generate TM statistics and leverage report'
      ],
      outputFormat: 'JSON with tmCreated (boolean), tmPath (string), translationUnits (number), tmCoverage (object), leverageEstimate (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tmCreated', 'translationUnits', 'artifacts'],
      properties: {
        tmCreated: { type: 'boolean' },
        tmPath: { type: 'string' },
        translationUnits: { type: 'number' },
        tmCoverage: {
          type: 'object',
          properties: {
            exactMatches: { type: 'number' },
            fuzzyMatches: { type: 'number' },
            noMatches: { type: 'number' }
          }
        },
        leverageEstimate: {
          type: 'object',
          properties: {
            potentialSavings: { type: 'number' },
            estimatedReduction: { type: 'string' }
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
  labels: ['agent', 'localization', 'translation-memory']
}));

// Task 4: Translation Platform Configuration
export const translationPlatformConfigTask = defineTask('translation-platform-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure translation management platform',
  agent: {
    name: 'platform-engineer',
    prompt: {
      role: 'localization platform engineer',
      task: 'Set up and configure translation management platform for the project',
      context: args,
      instructions: [
        'Select and configure translation provider:',
        '  - Crowdin: Create project, set languages, configure workflow',
        '  - Transifex: Setup project, define resources, set translation modes',
        '  - Weblate: Initialize project, configure VCS integration',
        '  - Lokalise: Create project, setup keys, configure download/upload',
        '  - Phrase: Setup project, import files, configure workflow',
        'Configure project settings:',
        '  - Source and target languages',
        '  - Translation workflow (machine, human, proofreading)',
        '  - Quality assurance checks',
        '  - Translation voting/approval process',
        'Upload glossary and translation memory',
        'Configure file formats and parsers:',
        '  - Markdown (.md)',
        '  - JSON for UI strings',
        '  - YAML for configuration',
        '  - HTML documentation',
        'Set up integration with VCS (GitHub, GitLab):',
        '  - Webhook for automatic sync',
        '  - Pull request creation for translations',
        '  - Branch management',
        'Configure translation approach:',
        '  - Machine: Set up MT engine (Google Translate, DeepL, AWS Translate)',
        '  - Human: Set up translator assignment and workflow',
        '  - Hybrid: Configure MT + human review',
        '  - Community: Enable community contributions',
        'Generate configuration files and API credentials',
        'Create setup documentation and access instructions'
      ],
      outputFormat: 'JSON with success (boolean), platform (string), projectId (string), projectUrl (string), workflowConfigured (boolean), integrationSetup (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'platform', 'projectId', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        platform: { type: 'string' },
        projectId: { type: 'string' },
        projectUrl: { type: 'string' },
        workflowConfigured: { type: 'boolean' },
        integrationSetup: {
          type: 'object',
          properties: {
            vcsIntegration: { type: 'boolean' },
            webhookUrl: { type: 'string' },
            automationEnabled: { type: 'boolean' }
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
  labels: ['agent', 'localization', 'platform-config']
}));

// Task 5: Content Extraction
export const contentExtractionTask = defineTask('content-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract translatable content and prepare translation files',
  agent: {
    name: 'content-extractor',
    prompt: {
      role: 'localization engineer',
      task: 'Extract all translatable content and create translation-ready files',
      context: args,
      instructions: [
        'Extract translatable content from documentation:',
        '  - Markdown files: Extract headings, paragraphs, lists, alt text',
        '  - HTML files: Parse and extract text nodes',
        '  - Code examples: Extract comments and string literals',
        '  - UI strings: Extract labels, buttons, messages',
        'Preserve document structure and metadata',
        'Generate unique identifiers for each string (segment IDs)',
        'Add context information for translators:',
        '  - File location',
        '  - Surrounding content',
        '  - String purpose (heading, paragraph, button, etc.)',
        '  - Character limits (if applicable)',
        '  - Screenshot or visual context',
        'If contextScreenshots enabled, generate screenshots:',
        '  - Render documentation pages',
        '  - Highlight UI elements being translated',
        '  - Save screenshots with segment IDs',
        'Create translation files in platform-specific format:',
        '  - XLIFF for standard localization tools',
        '  - JSON for developer-friendly editing',
        '  - Platform-specific formats (Crowdin JSON, Transifex YML)',
        'Separate translatable from non-translatable content',
        'Generate source file manifest with metadata',
        'Calculate translation workload (words, strings per file)'
      ],
      outputFormat: 'JSON with sourceStrings (number), sourceWords (number), translationFiles (array), contextScreenshots (array), fileManifest (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceStrings', 'sourceWords', 'translationFiles', 'artifacts'],
      properties: {
        sourceStrings: { type: 'number' },
        sourceWords: { type: 'number' },
        translationFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' },
              strings: { type: 'number' },
              words: { type: 'number' }
            }
          }
        },
        contextScreenshots: { type: 'array', items: { type: 'string' } },
        fileManifest: {
          type: 'object',
          properties: {
            totalFiles: { type: 'number' },
            filesByType: { type: 'object' }
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
  labels: ['agent', 'localization', 'content-extraction']
}));

// Task 6: Pseudo-Localization
export const pseudoLocalizationTask = defineTask('pseudo-localization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate pseudo-localization for testing',
  agent: {
    name: 'pseudo-loc-generator',
    prompt: {
      role: 'localization testing specialist',
      task: 'Generate pseudo-localized content to test internationalization readiness',
      context: args,
      instructions: [
        'Apply pseudo-localization transformations:',
        '  - Add special characters: "Hello" → "[Ȟëļļö]"',
        '  - Expand text by 30-50% to simulate language expansion',
        '  - Add brackets/markers to identify translated strings',
        '  - Add RTL markers for bidirectional text testing',
        '  - Include extended Unicode characters',
        'Generate pseudo-locale content (e.g., en-XA, en-XB)',
        'Build documentation with pseudo-localized content',
        'Test for common i18n issues:',
        '  - Text truncation or overflow',
        '  - Layout breaking due to text expansion',
        '  - Hard-coded strings not being translated',
        '  - Character encoding problems',
        '  - CSS issues with extended characters',
        'Render pseudo-localized documentation',
        'Generate screenshots showing layout issues',
        'Document identified issues with recommendations',
        'Calculate text expansion factor for each language'
      ],
      outputFormat: 'JSON with pseudoLocale (string), expansionFactor (number), issuesFound (array), screenshots (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pseudoLocale', 'expansionFactor', 'issuesFound', 'artifacts'],
      properties: {
        pseudoLocale: { type: 'string' },
        expansionFactor: { type: 'number' },
        issuesFound: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        screenshots: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'pseudo-localization']
}));

// Task 7: Translation Execution
export const translationExecutionTask = defineTask('translation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute translation for ${args.locale}`,
  agent: {
    name: 'translation-coordinator',
    prompt: {
      role: 'translation project manager',
      task: 'Coordinate and execute translation for target locale',
      context: args,
      instructions: [
        'Upload source content to translation platform',
        'Apply translation memory matches:',
        '  - Pre-fill exact matches (100%)',
        '  - Suggest fuzzy matches for review',
        'Execute translation based on approach:',
        '  - Machine: Run MT engine (Google Translate, DeepL, AWS Translate)',
        '  - Human: Assign to professional translators',
        '  - Hybrid: Apply MT + assign for human review',
        '  - Community: Open for community contributions',
        'Apply glossary and terminology:',
        '  - Lock do-not-translate terms',
        '  - Suggest approved translations',
        '  - Enforce terminology consistency',
        'Monitor translation progress:',
        '  - Track completion percentage',
        '  - Identify pending strings',
        '  - Flag quality issues',
        'Run automated QA during translation:',
        '  - Check for missing variables/placeholders',
        '  - Validate format consistency',
        '  - Check for glossary violations',
        'Download translated content when complete',
        'Generate translation statistics:',
        '  - Translated strings and words',
        '  - TM leverage rate',
        '  - Translation quality score',
        '  - Time spent',
        'Save translated files and translation report'
      ],
      outputFormat: 'JSON with locale (string), translatedStrings (number), translatedWords (number), missingTranslations (number), translationQuality (number), tmLeverage (number), issues (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['locale', 'translatedStrings', 'translatedWords', 'artifacts'],
      properties: {
        locale: { type: 'string' },
        translatedStrings: { type: 'number' },
        translatedWords: { type: 'number' },
        missingTranslations: { type: 'number' },
        translationQuality: { type: 'number', minimum: 0, maximum: 100 },
        tmLeverage: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              stringId: { type: 'string' },
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
  labels: ['agent', 'localization', 'translation']
}));

// Task 8: Translation QA
export const translationQATask = defineTask('translation-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run QA checks for ${args.locale}`,
  agent: {
    name: 'translation-qa-engineer',
    prompt: {
      role: 'translation quality assurance specialist',
      task: 'Run comprehensive QA checks on translated content',
      context: args,
      instructions: [
        'Run automated QA checks:',
        '  - Variable/placeholder consistency ({{name}} preserved)',
        '  - HTML tag preservation (<b>, <a> tags not broken)',
        '  - Punctuation and spacing correctness',
        '  - Number and date format validation',
        '  - Length restrictions compliance',
        '  - Special character encoding',
        'Check glossary and terminology consistency:',
        '  - Approved terms used correctly',
        '  - Do-not-translate terms preserved',
        '  - Consistent term usage across files',
        'Validate translation completeness:',
        '  - All strings translated (no missing)',
        '  - No empty translations',
        '  - No untranslated placeholders',
        'Check for common translation errors:',
        '  - Literal translations of idioms',
        '  - Cultural appropriateness',
        '  - Context mismatches',
        '  - Gender/plural agreement (for gendered languages)',
        'Run locale-specific checks:',
        '  - RTL text direction for Arabic, Hebrew',
        '  - Character set validation for CJK languages',
        '  - Honorifics for Japanese, Korean',
        'Generate QA report with:',
        '  - Pass/fail status',
        '  - List of issues by severity',
        '  - Term consistency score',
        '  - Recommendations for fixes'
      ],
      outputFormat: 'JSON with locale (string), passed (boolean), issues (array), termConsistency (number), missingVariables (array), formatErrors (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['locale', 'passed', 'issues', 'artifacts'],
      properties: {
        locale: { type: 'string' },
        passed: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['error', 'warning', 'info'] },
              type: { type: 'string' },
              stringId: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        termConsistency: { type: 'number', minimum: 0, maximum: 100 },
        missingVariables: { type: 'array', items: { type: 'string' } },
        formatErrors: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'qa']
}));

// Task 9: Content Integration
export const contentIntegrationTask = defineTask('content-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate localized content for ${args.locale}`,
  agent: {
    name: 'integration-engineer',
    prompt: {
      role: 'localization integration specialist',
      task: 'Integrate translated content back into documentation structure',
      context: args,
      instructions: [
        'Create locale-specific directory structure:',
        '  - /docs/en/ (source)',
        '  - /docs/es/ (Spanish)',
        '  - /docs/fr/ (French)',
        '  - Or use localeMapping for custom paths',
        'Merge translated content with source structure:',
        '  - Replace translatable strings',
        '  - Preserve formatting and structure',
        '  - Maintain links and references',
        '  - Keep code examples (unless localized)',
        'Apply locale-specific formatting:',
        '  - Date formats (MM/DD/YYYY vs DD/MM/YYYY)',
        '  - Number formats (1,000.00 vs 1.000,00)',
        '  - Currency symbols',
        '  - Time formats (12h vs 24h)',
        'Update internal links:',
        '  - Convert to locale-specific paths',
        '  - Preserve anchor links',
        '  - Update relative references',
        'Localize metadata and frontmatter:',
        '  - Page titles and descriptions',
        '  - SEO metadata (title, description, keywords)',
        '  - Open Graph tags',
        'Generate locale-specific assets:',
        '  - Copy or localize images',
        '  - Generate locale-specific navigation',
        '  - Create locale sitemap',
        'Build documentation for the locale',
        'Save localized files with metadata (locale, source file, version)'
      ],
      outputFormat: 'JSON with locale (string), localizedFiles (array), buildSuccess (boolean), totalPages (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['locale', 'localizedFiles', 'buildSuccess', 'artifacts'],
      properties: {
        locale: { type: 'string' },
        localizedFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              locale: { type: 'string' },
              path: { type: 'string' },
              type: { type: 'string' },
              size: { type: 'number' }
            }
          }
        },
        buildSuccess: { type: 'boolean' },
        totalPages: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'integration']
}));

// Task 10: Locale Customization
export const localeCustomizationTask = defineTask('locale-customization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Apply locale-specific customizations for ${args.locale}`,
  agent: {
    name: 'localization-specialist',
    prompt: {
      role: 'cultural localization expert',
      task: 'Apply locale-specific customizations and cultural adaptations',
      context: args,
      instructions: [
        'Apply cultural adaptations:',
        '  - Replace culturally inappropriate examples or metaphors',
        '  - Adjust tone and formality level (formal for de-DE, informal for en-US)',
        '  - Localize names in examples (John → José for es-ES)',
        '  - Adapt units of measurement (miles → kilometers)',
        'Customize visual elements:',
        '  - Swap images with locale-specific versions',
        '  - Update flags and country references',
        '  - Adjust color schemes if culturally significant',
        'Handle locale-specific requirements:',
        '  - RTL layout for Arabic (ar), Hebrew (he)',
        '  - Vertical text support for traditional Chinese',
        '  - Font selection for CJK languages',
        '  - Keyboard input methods documentation',
        'Localize contact information:',
        '  - Local support phone numbers',
        '  - Regional office addresses',
        '  - Local social media accounts',
        'Apply legal and compliance customizations:',
        '  - GDPR notices for EU locales',
        '  - Privacy policies per region',
        '  - Terms of service variations',
        'Add locale-specific content:',
        '  - Local payment methods documentation',
        '  - Regional features or restrictions',
        '  - Country-specific regulations',
        'Save customized files and customization report'
      ],
      outputFormat: 'JSON with locale (string), customizationsApplied (array), culturalAdaptations (number), localeSpecificContent (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['locale', 'customizationsApplied', 'artifacts'],
      properties: {
        locale: { type: 'string' },
        customizationsApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              filesAffected: { type: 'number' }
            }
          }
        },
        culturalAdaptations: { type: 'number' },
        localeSpecificContent: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'customization']
}));

// Task 11: Localization Testing
export const localizationTestingTask = defineTask('localization-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test localized documentation for ${args.locale}`,
  agent: {
    name: 'localization-tester',
    prompt: {
      role: 'localization testing engineer',
      task: 'Test localized documentation for functionality, rendering, and quality',
      context: args,
      instructions: [
        'Test basic functionality:',
        '  - All pages load successfully',
        '  - Navigation menus work correctly',
        '  - Search functionality with localized queries',
        '  - Internal links resolve correctly',
        '  - External links still valid',
        'Test rendering and display:',
        '  - Text displays correctly (no encoding issues)',
        '  - Font rendering for special characters',
        '  - Layout integrity with translated text',
        '  - No text overflow or truncation',
        '  - Images and media load properly',
        'Test locale-specific functionality:',
        '  - RTL layout works correctly (Arabic, Hebrew)',
        '  - Date/time formats display correctly',
        '  - Number and currency formatting',
        '  - Locale switcher works',
        'Run automated tests:',
        '  - Link checking (no broken links)',
        '  - HTML validation',
        '  - Accessibility testing (a11y)',
        '  - Mobile responsiveness',
        '  - Page load performance',
        'Test for localization-specific issues:',
        '  - No mixed languages on pages',
        '  - Consistent terminology usage',
        '  - No untranslated strings visible',
        '  - Proper fallback to source locale if needed',
        'Generate test report:',
        '  - Total tests run',
        '  - Passed/failed counts',
        '  - List of failures with details',
        '  - Screenshots of issues',
        '  - Recommendations for fixes'
      ],
      outputFormat: 'JSON with locale (string), totalTests (number), passedTests (number), failedTests (number), failures (array), screenshots (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['locale', 'totalTests', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        locale: { type: 'string' },
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              page: { type: 'string' },
              error: { type: 'string' },
              screenshot: { type: 'string' }
            }
          }
        },
        screenshots: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'testing']
}));

// Task 12: Native Review
export const nativeReviewTask = defineTask('native-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate native reviewer feedback',
  agent: {
    name: 'review-coordinator',
    prompt: {
      role: 'localization quality manager',
      task: 'Coordinate native speaker review and incorporate feedback',
      context: args,
      instructions: [
        'Identify native reviewers for each target locale:',
        '  - Native speakers with subject matter expertise',
        '  - Familiar with target audience and domain',
        '  - Located in target market (cultural context)',
        'Prepare review packages per locale:',
        '  - Translated documentation',
        '  - Context and guidelines',
        '  - Review checklist',
        '  - Feedback form/template',
        'Send review requests with:',
        '  - Review deadline',
        '  - Focus areas (accuracy, clarity, cultural appropriateness)',
        '  - How to submit feedback',
        'Track review progress:',
        '  - Reviews received per locale',
        '  - Pending reviews',
        '  - Average review time',
        'Collect and organize feedback:',
        '  - Translation accuracy issues',
        '  - Cultural appropriateness concerns',
        '  - Terminology suggestions',
        '  - Content clarity improvements',
        '  - Technical accuracy',
        'Categorize feedback by priority:',
        '  - Critical (must fix before launch)',
        '  - High (should fix)',
        '  - Medium (nice to have)',
        '  - Low (future improvement)',
        'Generate review status report:',
        '  - Reviews completed per locale',
        '  - Total feedback items',
        '  - Action items by priority',
        '  - Estimated time to address feedback'
      ],
      outputFormat: 'JSON with reviewStatus (object), feedbackSummary (object), actionItems (array), reviewsCompleted (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewStatus', 'feedbackSummary', 'artifacts'],
      properties: {
        reviewStatus: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              locale: { type: 'string' },
              reviewCompleted: { type: 'boolean' },
              reviewerName: { type: 'string' },
              feedbackItems: { type: 'number' }
            }
          }
        },
        feedbackSummary: {
          type: 'object',
          properties: {
            totalFeedbackItems: { type: 'number' },
            criticalIssues: { type: 'number' },
            highPriority: { type: 'number' },
            mediumPriority: { type: 'number' },
            lowPriority: { type: 'number' }
          }
        },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              locale: { type: 'string' },
              priority: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        reviewsCompleted: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'review']
}));

// Task 13: I18n Infrastructure
export const i18nInfrastructureTask = defineTask('i18n-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup locale switcher and i18n infrastructure',
  agent: {
    name: 'i18n-engineer',
    prompt: {
      role: 'internationalization infrastructure engineer',
      task: 'Setup locale switcher, language detection, and i18n infrastructure',
      context: args,
      instructions: [
        'Implement locale switcher UI:',
        '  - Dropdown or menu with language options',
        '  - Display language names in native script (Español, Français, 日本語)',
        '  - Show current locale indicator',
        '  - Preserve page context when switching locales',
        'Configure automatic language detection:',
        '  - Browser Accept-Language header',
        '  - User IP geolocation',
        '  - User preference cookies',
        '  - Fallback to default locale',
        'Setup locale routing:',
        '  - URL structure (/en/docs, /es/docs, /fr/docs)',
        '  - Or subdomain structure (en.docs.example.com)',
        '  - Or domain structure (docs.example.com, docs.example.es)',
        'Implement hreflang tags for SEO:',
        '  - Add alternate language links',
        '  - Specify x-default for fallback',
        '  - Ensure proper locale codes',
        'Configure locale-aware search:',
        '  - Search within current locale',
        '  - Option to search all locales',
        '  - Locale-specific search index',
        'Setup analytics tracking:',
        '  - Track locale distribution',
        '  - Popular pages per locale',
        '  - Locale switcher usage',
        'Create locale-aware sitemap:',
        '  - Separate sitemaps per locale',
        '  - Or unified sitemap with locale annotations',
        'Generate i18n configuration files and documentation'
      ],
      outputFormat: 'JSON with localeSwitcherEnabled (boolean), languageDetection (boolean), routingStrategy (string), hreflangConfigured (boolean), searchLocaleAware (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['localeSwitcherEnabled', 'languageDetection', 'artifacts'],
      properties: {
        localeSwitcherEnabled: { type: 'boolean' },
        languageDetection: { type: 'boolean' },
        routingStrategy: { type: 'string', enum: ['path', 'subdomain', 'domain'] },
        hreflangConfigured: { type: 'boolean' },
        searchLocaleAware: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'infrastructure']
}));

// Task 14: Translation Metrics
export const translationMetricsTask = defineTask('translation-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate translation metrics and quality assessment',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'localization metrics and analytics specialist',
      task: 'Calculate comprehensive translation metrics and assess overall quality',
      context: args,
      instructions: [
        'Calculate translation statistics:',
        '  - Total strings translated per locale',
        '  - Total words translated per locale',
        '  - Translation completion percentage',
        '  - Translation memory leverage rate',
        '  - Machine translation usage percentage',
        '  - Human translation usage percentage',
        'Calculate translation costs and effort:',
        '  - Total words translated (billable)',
        '  - TM savings (words not translated due to matches)',
        '  - Estimated cost per locale',
        '  - Time spent on translation',
        'Assess translation quality per locale:',
        '  - Translation accuracy score',
        '  - Terminology consistency score',
        '  - QA pass rate',
        '  - Native review feedback score',
        '  - Testing pass rate',
        'Calculate weighted overall quality score:',
        '  - Translation accuracy (35%)',
        '  - Terminology consistency (25%)',
        '  - Completeness (20%)',
        '  - Cultural appropriateness (10%)',
        '  - Technical correctness (10%)',
        'Compare against acceptance criteria:',
        '  - Quality score vs threshold',
        '  - Consistency vs threshold',
        '  - Missing translations vs limit',
        'Generate quality report by locale:',
        '  - Individual locale scores',
        '  - Best and worst performing locales',
        '  - Areas for improvement',
        'Provide recommendations:',
        '  - Locales needing improvement',
        '  - Suggested actions',
        '  - Future optimization opportunities'
      ],
      outputFormat: 'JSON with translationStats (object), qualityMetrics (object), overallQualityScore (number), qualityByLocale (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['translationStats', 'qualityMetrics', 'overallQualityScore', 'artifacts'],
      properties: {
        translationStats: {
          type: 'object',
          properties: {
            totalStrings: { type: 'number' },
            translatedStrings: { type: 'number' },
            sourceWords: { type: 'number' },
            translatedWords: { type: 'number' },
            completionPercentage: { type: 'number' },
            tmLeverageRate: { type: 'number' },
            averageTranslationTime: { type: 'string' }
          }
        },
        qualityMetrics: {
          type: 'object',
          properties: {
            overallQualityScore: { type: 'number', minimum: 0, maximum: 100 },
            termConsistency: { type: 'number', minimum: 0, maximum: 100 },
            translationAccuracy: { type: 'number', minimum: 0, maximum: 100 },
            localesCoverage: { type: 'number', minimum: 0, maximum: 100 },
            qualityByLocale: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  locale: { type: 'string' },
                  qualityScore: { type: 'number' },
                  completeness: { type: 'number' }
                }
              }
            }
          }
        },
        overallQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityByLocale: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              locale: { type: 'string' },
              qualityScore: { type: 'number' },
              translatedStrings: { type: 'number' },
              completeness: { type: 'number' }
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
  labels: ['agent', 'localization', 'metrics']
}));

// Task 15: Localization Deployment
export const localizationDeploymentTask = defineTask('localization-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create localization deployment package',
  agent: {
    name: 'deployment-manager',
    prompt: {
      role: 'localization deployment specialist',
      task: 'Prepare comprehensive deployment package for localized documentation',
      context: args,
      instructions: [
        'Organize all localized files by locale:',
        '  - Create deployment directory structure',
        '  - Organize files by locale and content type',
        '  - Include all assets (images, media, scripts)',
        'Create deployment manifest:',
        '  - List of all localized files',
        '  - File sizes and checksums',
        '  - Locale metadata',
        '  - Version information',
        'Generate deployment documentation:',
        '  - Deployment instructions step-by-step',
        '  - Server/hosting configuration',
        '  - CDN setup for multiple locales',
        '  - Environment variables',
        '  - Locale routing configuration',
        'Create validation checklist:',
        '  - Pre-deployment testing steps',
        '  - Smoke tests for each locale',
        '  - Rollback procedures',
        'Setup continuous localization:',
        '  - Automated sync with translation platform',
        '  - CI/CD integration for translation updates',
        '  - Webhook configuration for auto-deployment',
        'Document maintenance procedures:',
        '  - How to update translations',
        '  - How to add new locales',
        '  - Translation memory maintenance',
        '  - Glossary update process',
        'Create localization summary report:',
        '  - Executive summary',
        '  - Locales delivered',
        '  - Quality metrics',
        '  - Project statistics',
        '  - Next steps and recommendations',
        'Package all artifacts for delivery'
      ],
      outputFormat: 'JSON with deploymentReady (boolean), deploymentManifest (object), deploymentInstructions (string), continuousLocalization (boolean), maintenanceGuide (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentReady', 'deploymentManifest', 'artifacts'],
      properties: {
        deploymentReady: { type: 'boolean' },
        deploymentManifest: {
          type: 'object',
          properties: {
            totalFiles: { type: 'number' },
            filesByLocale: { type: 'object' },
            totalSize: { type: 'number' }
          }
        },
        deploymentInstructions: { type: 'string' },
        continuousLocalization: { type: 'boolean' },
        maintenanceGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'localization', 'deployment']
}));
