/**
 * @process specializations/technical-documentation/terminology-management
 * @description Terminology Management and Consistency Checking - Process for managing terminology databases,
 * glossaries, controlled vocabularies, and implementing automated consistency checking across documentation
 * to ensure consistent use of technical terms, product names, and domain-specific language.
 * @specialization Technical Documentation
 * @category Style & Standards
 * @inputs { projectName: string, documentationPath: string, existingGlossary?: string, terminologyScope: string, languages?: array, outputDir?: string, autoFix?: boolean, acceptanceCriteria?: object }
 * @outputs { success: boolean, terminologyDatabase: object, glossary: object, consistencyReport: object, violations: array, qualityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/technical-documentation/terminology-management', {
 *   projectName: 'PaymentAPI',
 *   documentationPath: './docs',
 *   existingGlossary: './glossary.json',
 *   terminologyScope: 'product', // 'product', 'technical', 'domain', 'all'
 *   languages: ['en-US'],
 *   outputDir: 'terminology-output',
 *   autoFix: false,
 *   acceptanceCriteria: {
 *     minConsistencyScore: 90,
 *     maxViolations: 10,
 *     requiredTermCoverage: 95
 *   }
 * });
 *
 * @references
 * - Vale: https://vale.sh/
 * - Microsoft Writing Style Guide: https://docs.microsoft.com/en-us/style-guide/
 * - Google Developer Documentation Style Guide: https://developers.google.com/style
 * - Terminology Management Best Practices
 * - Controlled Vocabularies and Taxonomies
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    documentationPath,
    existingGlossary = null,
    terminologyScope = 'all', // 'product', 'technical', 'domain', 'all'
    languages = ['en-US'],
    outputDir = 'terminology-output',
    autoFix = false,
    styleGuide = 'custom', // 'microsoft', 'google', 'custom', 'mixed'
    includeAbbreviations = true,
    includeAcronyms = true,
    includeProductNames = true,
    caseSensitive = true,
    generateValeRules = true,
    acceptanceCriteria = {
      minConsistencyScore: 85,
      maxViolations: 20,
      requiredTermCoverage: 90,
      maxDuplicateTerms: 5
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let terminologyDatabase = {};
  let glossary = {};
  let consistencyReport = {};
  let violations = [];
  let qualityScore = 0;

  ctx.log('info', `Starting Terminology Management and Consistency Checking for ${projectName}`);
  ctx.log('info', `Documentation Path: ${documentationPath}, Scope: ${terminologyScope}`);
  ctx.log('info', `Languages: ${languages.join(', ')}, Auto-fix: ${autoFix}`);

  // ============================================================================
  // PHASE 1: DOCUMENTATION INVENTORY AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing documentation structure and content');

  const docInventory = await ctx.task(documentationInventoryTask, {
    projectName,
    documentationPath,
    languages,
    outputDir
  });

  if (!docInventory.success || docInventory.documentCount === 0) {
    return {
      success: false,
      error: 'Failed to analyze documentation or no documents found',
      details: docInventory,
      metadata: {
        processId: 'specializations/technical-documentation/terminology-management',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...docInventory.artifacts);

  ctx.log('info', `Found ${docInventory.documentCount} documents across ${docInventory.fileTypes.length} file types`);

  // ============================================================================
  // PHASE 2: TERMINOLOGY EXTRACTION AND CATALOGING
  // ============================================================================

  ctx.log('info', 'Phase 2: Extracting terminology from documentation and codebase');

  const terminologyExtraction = await ctx.task(terminologyExtractionTask, {
    projectName,
    documentationPath,
    docInventory,
    terminologyScope,
    includeAbbreviations,
    includeAcronyms,
    includeProductNames,
    styleGuide,
    outputDir
  });

  artifacts.push(...terminologyExtraction.artifacts);

  const extractedTerms = terminologyExtraction.extractedTerms;
  const termCount = terminologyExtraction.termCount;

  ctx.log('info', `Extracted ${termCount} terms from documentation`);

  // Breakpoint: Review extracted terminology
  await ctx.breakpoint({
    question: `Extracted ${termCount} terms (${terminologyExtraction.productTerms} product, ${terminologyExtraction.technicalTerms} technical). Review terminology extraction and approve to continue?`,
    title: 'Terminology Extraction Review',
    context: {
      runId: ctx.runId,
      termCount,
      productTerms: terminologyExtraction.productTerms,
      technicalTerms: terminologyExtraction.technicalTerms,
      domainTerms: terminologyExtraction.domainTerms,
      abbreviations: terminologyExtraction.abbreviationCount,
      acronyms: terminologyExtraction.acronymCount,
      topTerms: terminologyExtraction.topTermsByFrequency.slice(0, 20),
      files: terminologyExtraction.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: EXISTING GLOSSARY INTEGRATION
  // ============================================================================

  let existingTerms = [];
  if (existingGlossary) {
    ctx.log('info', 'Phase 3: Integrating existing glossary and terminology database');

    const glossaryIntegration = await ctx.task(glossaryIntegrationTask, {
      projectName,
      existingGlossary,
      extractedTerms,
      outputDir
    });

    artifacts.push(...glossaryIntegration.artifacts);
    existingTerms = glossaryIntegration.mergedTerms;

    ctx.log('info', `Integrated ${glossaryIntegration.existingTermCount} existing terms, found ${glossaryIntegration.newTermsCount} new terms`);
  } else {
    ctx.log('info', 'Phase 3: No existing glossary provided, creating new terminology database');
    existingTerms = extractedTerms;
  }

  // ============================================================================
  // PHASE 4: TERMINOLOGY NORMALIZATION AND STANDARDIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Normalizing and standardizing terminology');

  const normalization = await ctx.task(terminologyNormalizationTask, {
    projectName,
    terms: existingTerms,
    styleGuide,
    caseSensitive,
    languages,
    outputDir
  });

  artifacts.push(...normalization.artifacts);

  terminologyDatabase = normalization.terminologyDatabase;

  // Quality Gate: Duplicate terms check
  const duplicateTerms = normalization.duplicateTerms.length;
  if (duplicateTerms > acceptanceCriteria.maxDuplicateTerms) {
    await ctx.breakpoint({
      question: `Found ${duplicateTerms} duplicate or conflicting terms (limit: ${acceptanceCriteria.maxDuplicateTerms}). Review conflicts and decide resolution strategy?`,
      title: 'Duplicate Terms Quality Gate',
      context: {
        runId: ctx.runId,
        duplicateTerms: normalization.duplicateTerms,
        conflicts: normalization.conflicts,
        recommendations: normalization.resolutionRecommendations,
        files: normalization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: GLOSSARY GENERATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating glossaries for different audiences in parallel');

  // Generate multiple glossary formats simultaneously
  const glossaryTasks = [
    { audience: 'developer', includeCode: true, technicalDepth: 'high' },
    { audience: 'user', includeCode: false, technicalDepth: 'low' },
    { audience: 'all', includeCode: true, technicalDepth: 'medium' }
  ];

  const glossaryResults = await ctx.parallel.all(
    glossaryTasks.map(task =>
      ctx.task(glossaryGenerationTask, {
        projectName,
        terminologyDatabase,
        audience: task.audience,
        includeCode: task.includeCode,
        technicalDepth: task.technicalDepth,
        languages,
        outputDir
      })
    )
  );

  glossaryResults.forEach(result => {
    artifacts.push(...result.artifacts);
  });

  glossary = {
    developer: glossaryResults[0].glossaryPath,
    user: glossaryResults[1].glossaryPath,
    complete: glossaryResults[2].glossaryPath,
    termCount: terminologyDatabase.termCount
  };

  ctx.log('info', `Generated ${glossaryResults.length} audience-specific glossaries`);

  // ============================================================================
  // PHASE 6: CONSISTENCY CHECKING ACROSS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Running consistency checks across all documentation');

  const consistencyCheck = await ctx.task(consistencyCheckingTask, {
    projectName,
    documentationPath,
    docInventory,
    terminologyDatabase,
    caseSensitive,
    styleGuide,
    outputDir
  });

  artifacts.push(...consistencyCheck.artifacts);

  violations = consistencyCheck.violations;
  consistencyReport = consistencyCheck.consistencyReport;

  const consistencyScore = consistencyCheck.consistencyScore;

  ctx.log('info', `Consistency check complete: ${consistencyScore.toFixed(1)}% consistent, ${violations.length} violations found`);

  // Quality Gate: Consistency score
  if (consistencyScore < acceptanceCriteria.minConsistencyScore) {
    await ctx.breakpoint({
      question: `Consistency score: ${consistencyScore.toFixed(1)}% (target: ${acceptanceCriteria.minConsistencyScore}%). Found ${violations.length} violations. Review consistency report and decide to fix or proceed?`,
      title: 'Consistency Score Quality Gate',
      context: {
        runId: ctx.runId,
        consistencyScore,
        targetScore: acceptanceCriteria.minConsistencyScore,
        totalViolations: violations.length,
        violationsByType: consistencyCheck.violationsByType,
        violationsBySeverity: consistencyCheck.violationsBySeverity,
        topViolations: violations.slice(0, 20),
        affectedFiles: consistencyCheck.affectedFiles,
        files: consistencyCheck.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Quality Gate: Maximum violations
  if (violations.length > acceptanceCriteria.maxViolations) {
    await ctx.breakpoint({
      question: `Found ${violations.length} violations (limit: ${acceptanceCriteria.maxViolations}). Auto-fix available: ${autoFix}. Review violations and decide to fix or proceed?`,
      title: 'Violations Threshold Quality Gate',
      context: {
        runId: ctx.runId,
        totalViolations: violations.length,
        maxViolations: acceptanceCriteria.maxViolations,
        autoFixEnabled: autoFix,
        violationsByType: consistencyCheck.violationsByType,
        criticalViolations: violations.filter(v => v.severity === 'critical').length,
        files: consistencyCheck.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: AUTOMATED VIOLATION FIXING (OPTIONAL)
  // ============================================================================

  let fixResults = null;
  if (autoFix && violations.length > 0) {
    ctx.log('info', 'Phase 7: Automatically fixing consistency violations');

    fixResults = await ctx.task(autoFixViolationsTask, {
      projectName,
      documentationPath,
      violations,
      terminologyDatabase,
      caseSensitive,
      outputDir
    });

    artifacts.push(...fixResults.artifacts);

    ctx.log('info', `Fixed ${fixResults.fixedCount} of ${violations.length} violations automatically`);

    // Re-run consistency check after fixes
    if (fixResults.fixedCount > 0) {
      const postFixCheck = await ctx.task(consistencyCheckingTask, {
        projectName,
        documentationPath,
        docInventory,
        terminologyDatabase,
        caseSensitive,
        styleGuide,
        outputDir
      });

      artifacts.push(...postFixCheck.artifacts);
      violations = postFixCheck.violations;
      consistencyReport = postFixCheck.consistencyReport;

      ctx.log('info', `Post-fix consistency score: ${postFixCheck.consistencyScore.toFixed(1)}%`);
    }
  }

  // ============================================================================
  // PHASE 8: VALE RULES GENERATION (FOR CI/CD INTEGRATION)
  // ============================================================================

  let valeRules = null;
  if (generateValeRules) {
    ctx.log('info', 'Phase 8: Generating Vale linting rules for CI/CD integration');

    valeRules = await ctx.task(valeRulesGenerationTask, {
      projectName,
      terminologyDatabase,
      styleGuide,
      caseSensitive,
      outputDir
    });

    artifacts.push(...valeRules.artifacts);

    ctx.log('info', `Generated ${valeRules.rulesCount} Vale rules for automated checking`);
  }

  // ============================================================================
  // PHASE 9: TERM COVERAGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 9: Analyzing term coverage across documentation');

  const coverageAnalysis = await ctx.task(termCoverageAnalysisTask, {
    projectName,
    documentationPath,
    docInventory,
    terminologyDatabase,
    outputDir
  });

  artifacts.push(...coverageAnalysis.artifacts);

  const termCoverage = coverageAnalysis.coveragePercentage;

  // Quality Gate: Term coverage
  if (termCoverage < acceptanceCriteria.requiredTermCoverage) {
    await ctx.breakpoint({
      question: `Term coverage: ${termCoverage.toFixed(1)}% (target: ${acceptanceCriteria.requiredTermCoverage}%). ${coverageAnalysis.missingTerms.length} terms not found in documentation. Review coverage report and decide to enhance or proceed?`,
      title: 'Term Coverage Quality Gate',
      context: {
        runId: ctx.runId,
        termCoverage,
        targetCoverage: acceptanceCriteria.requiredTermCoverage,
        missingTermsCount: coverageAnalysis.missingTerms.length,
        missingTerms: coverageAnalysis.missingTerms.slice(0, 20),
        underutilizedTerms: coverageAnalysis.underutilizedTerms,
        recommendations: coverageAnalysis.recommendations,
        files: coverageAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: STYLE GUIDE COMPLIANCE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating terminology against style guide standards');

  const styleValidation = await ctx.task(styleGuideValidationTask, {
    projectName,
    terminologyDatabase,
    styleGuide,
    violations,
    outputDir
  });

  artifacts.push(...styleValidation.artifacts);

  ctx.log('info', `Style guide compliance: ${styleValidation.complianceScore.toFixed(1)}%`);

  // ============================================================================
  // PHASE 11: SYNONYM AND RELATED TERMS MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 11: Building synonym mappings and related terms network');

  const synonymMapping = await ctx.task(synonymMappingTask, {
    projectName,
    terminologyDatabase,
    documentationPath,
    docInventory,
    outputDir
  });

  artifacts.push(...synonymMapping.artifacts);

  ctx.log('info', `Identified ${synonymMapping.synonymGroupCount} synonym groups and ${synonymMapping.relatedTermsCount} related term relationships`);

  // ============================================================================
  // PHASE 12: QUALITY SCORING AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Calculating overall terminology management quality score');

  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    projectName,
    terminologyDatabase,
    consistencyReport,
    violations,
    coverageAnalysis,
    styleValidation,
    synonymMapping,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);
  qualityScore = qualityAssessment.overallScore;

  ctx.log('info', `Overall quality score: ${qualityScore}/100`);

  // ============================================================================
  // PHASE 13: REPORTING AND DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating comprehensive terminology management reports');

  const reportGeneration = await ctx.task(reportGenerationTask, {
    projectName,
    terminologyDatabase,
    glossary,
    consistencyReport,
    violations,
    coverageAnalysis,
    styleValidation,
    synonymMapping,
    qualityScore,
    fixResults,
    valeRules,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...reportGeneration.artifacts);

  // Final Breakpoint: Review complete terminology management
  await ctx.breakpoint({
    question: `Terminology management complete for ${projectName}. Quality score: ${qualityScore}/100, Consistency: ${consistencyScore.toFixed(1)}%, Coverage: ${termCoverage.toFixed(1)}%, Violations: ${violations.length}. Review final reports and approve?`,
    title: 'Final Terminology Management Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: glossary.complete,
          format: 'markdown',
          label: 'Complete Glossary'
        },
        {
          path: reportGeneration.executiveReportPath,
          format: 'markdown',
          label: 'Executive Summary'
        },
        {
          path: reportGeneration.detailedReportPath,
          format: 'markdown',
          label: 'Detailed Report'
        },
        ...artifacts.slice(0, 10).map(a => ({
          path: a.path,
          format: a.format || 'json',
          label: a.label || a.path.split('/').pop()
        }))
      ],
      summary: {
        qualityScore,
        consistencyScore,
        termCoverage,
        totalViolations: violations.length,
        criticalViolations: violations.filter(v => v.severity === 'critical').length,
        termCount: terminologyDatabase.termCount,
        glossariesGenerated: glossaryResults.length,
        valeRulesGenerated: valeRules ? valeRules.rulesCount : 0,
        autoFixEnabled: autoFix,
        fixedCount: fixResults ? fixResults.fixedCount : 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore,
    terminologyDatabase: {
      path: terminologyDatabase.path,
      termCount: terminologyDatabase.termCount,
      productTerms: terminologyDatabase.productTerms,
      technicalTerms: terminologyDatabase.technicalTerms,
      domainTerms: terminologyDatabase.domainTerms,
      abbreviations: terminologyDatabase.abbreviations,
      acronyms: terminologyDatabase.acronyms
    },
    glossary: {
      developerGlossary: glossary.developer,
      userGlossary: glossary.user,
      completeGlossary: glossary.complete,
      termCount: glossary.termCount
    },
    consistencyReport: {
      consistencyScore,
      totalViolations: violations.length,
      violationsByType: consistencyCheck.violationsByType,
      violationsBySeverity: consistencyCheck.violationsBySeverity,
      affectedFiles: consistencyCheck.affectedFiles,
      reportPath: consistencyReport.reportPath
    },
    violations: violations.map(v => ({
      type: v.type,
      severity: v.severity,
      term: v.term,
      file: v.file,
      line: v.line,
      suggestion: v.suggestion
    })),
    coverage: {
      termCoverage,
      totalTerms: terminologyDatabase.termCount,
      coveredTerms: coverageAnalysis.coveredTerms,
      missingTerms: coverageAnalysis.missingTerms.length,
      underutilizedTerms: coverageAnalysis.underutilizedTerms.length
    },
    styleCompliance: {
      complianceScore: styleValidation.complianceScore,
      styleGuide,
      violations: styleValidation.violations.length
    },
    synonyms: {
      synonymGroups: synonymMapping.synonymGroupCount,
      relatedTerms: synonymMapping.relatedTermsCount,
      mappingPath: synonymMapping.mappingPath
    },
    autoFix: autoFix ? {
      enabled: true,
      fixedCount: fixResults ? fixResults.fixedCount : 0,
      unfixedCount: fixResults ? fixResults.unfixedCount : 0,
      fixedFiles: fixResults ? fixResults.fixedFiles : []
    } : {
      enabled: false
    },
    valeIntegration: generateValeRules ? {
      enabled: true,
      rulesCount: valeRules.rulesCount,
      rulesPath: valeRules.rulesPath,
      configPath: valeRules.configPath
    } : {
      enabled: false
    },
    reports: {
      executiveReport: reportGeneration.executiveReportPath,
      detailedReport: reportGeneration.detailedReportPath,
      violationsReport: reportGeneration.violationsReportPath,
      coverageReport: reportGeneration.coverageReportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/terminology-management',
      category: 'Style & Standards',
      specialization: 'Technical Documentation',
      timestamp: startTime,
      outputDir,
      languages
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Documentation Inventory
export const documentationInventoryTask = defineTask('documentation-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create documentation inventory and analyze structure',
  agent: {
    name: 'documentation-analyzer',
    prompt: {
      role: 'technical documentation analyst',
      task: 'Scan and catalog all documentation files to understand structure and content',
      context: args,
      instructions: [
        'Scan documentation directory recursively',
        'Identify all documentation files by type: markdown, HTML, reStructuredText, AsciiDoc, etc.',
        'Count total documents and organize by type',
        'Extract metadata: file paths, sizes, last modified dates',
        'Identify documentation structure: sections, hierarchies, navigation',
        'Detect multi-language documentation if present',
        'Identify code blocks and inline code references',
        'Calculate total word count and content volume',
        'Map relationships between documents (links, references)',
        'Save complete inventory with file metadata',
        'Generate inventory statistics and summary'
      ],
      outputFormat: 'JSON with success, documentCount, fileTypes, totalWordCount, documentStructure, multiLanguage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documentCount', 'fileTypes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documentCount: { type: 'number' },
        fileTypes: { type: 'array', items: { type: 'string' } },
        totalWordCount: { type: 'number' },
        documentStructure: {
          type: 'object',
          properties: {
            sections: { type: 'array' },
            hierarchy: { type: 'object' }
          }
        },
        multiLanguage: { type: 'boolean' },
        languages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'terminology', 'inventory']
}));

// Task 2: Terminology Extraction
export const terminologyExtractionTask = defineTask('terminology-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract terminology from documentation',
  agent: {
    name: 'terminology-extractor',
    prompt: {
      role: 'computational linguist and terminology specialist',
      task: 'Extract and catalog all terminology from documentation using NLP and pattern matching',
      context: args,
      instructions: [
        'Extract terms based on terminology scope:',
        '  - Product: product names, features, components, UI elements',
        '  - Technical: APIs, functions, classes, technical concepts',
        '  - Domain: domain-specific terminology, business concepts',
        '  - All: comprehensive extraction of all term types',
        'Identify and extract:',
        '  - Single-word and multi-word terms',
        '  - Acronyms (uppercase abbreviations)',
        '  - Abbreviations (shortened forms)',
        '  - Product names and proper nouns',
        '  - Technical jargon and specialized vocabulary',
        '  - Code identifiers (if in scope)',
        'Use NLP techniques:',
        '  - Named entity recognition',
        '  - Part-of-speech tagging',
        '  - Term frequency analysis',
        '  - Collocation detection',
        'Calculate term frequency and document frequency',
        'Identify term variants (singular/plural, verb forms)',
        'Extract context and usage examples for each term',
        'Categorize terms by type and domain',
        'Flag potentially inconsistent terms',
        'Save extracted terminology with metadata'
      ],
      outputFormat: 'JSON with extractedTerms (array), termCount, productTerms, technicalTerms, domainTerms, abbreviationCount, acronymCount, topTermsByFrequency, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['extractedTerms', 'termCount', 'artifacts'],
      properties: {
        extractedTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string' },
              frequency: { type: 'number' },
              documents: { type: 'array' },
              contexts: { type: 'array' }
            }
          }
        },
        termCount: { type: 'number' },
        productTerms: { type: 'number' },
        technicalTerms: { type: 'number' },
        domainTerms: { type: 'number' },
        abbreviationCount: { type: 'number' },
        acronymCount: { type: 'number' },
        topTermsByFrequency: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'terminology', 'extraction']
}));

// Task 3: Glossary Integration
export const glossaryIntegrationTask = defineTask('glossary-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate existing glossary with extracted terms',
  agent: {
    name: 'glossary-integrator',
    prompt: {
      role: 'terminology manager',
      task: 'Merge existing glossary with newly extracted terms, resolving conflicts',
      context: args,
      instructions: [
        'Load and parse existing glossary file (JSON, CSV, YAML, markdown)',
        'Compare existing terms with extracted terms',
        'Identify:',
        '  - Terms in both (existing and extracted)',
        '  - New terms (extracted but not in glossary)',
        '  - Obsolete terms (in glossary but not extracted)',
        'For overlapping terms:',
        '  - Compare definitions and choose best',
        '  - Merge usage examples',
        '  - Preserve manual edits and annotations',
        '  - Flag definition conflicts for review',
        'Enrich existing terms with:',
        '  - Updated frequency data',
        '  - New usage contexts',
        '  - Additional synonyms or related terms',
        'Flag obsolete terms that may need deprecation',
        'Generate merged terminology list',
        'Create integration report with statistics',
        'Save merged terms with lineage tracking'
      ],
      outputFormat: 'JSON with mergedTerms (array), existingTermCount, newTermsCount, obsoleteTerms, conflicts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mergedTerms', 'existingTermCount', 'newTermsCount', 'artifacts'],
      properties: {
        mergedTerms: { type: 'array' },
        existingTermCount: { type: 'number' },
        newTermsCount: { type: 'number' },
        obsoleteTerms: { type: 'array', items: { type: 'string' } },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              existingDefinition: { type: 'string' },
              extractedDefinition: { type: 'string' }
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
  labels: ['agent', 'terminology', 'integration']
}));

// Task 4: Terminology Normalization
export const terminologyNormalizationTask = defineTask('terminology-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Normalize and standardize terminology',
  agent: {
    name: 'terminology-normalizer',
    prompt: {
      role: 'terminology standardization specialist',
      task: 'Normalize terminology according to style guide rules and identify duplicates',
      context: args,
      instructions: [
        'Apply style guide normalization rules based on selected style guide',
        'Normalize term formatting:',
        '  - Capitalization (title case, sentence case, lowercase)',
        '  - Hyphenation and compound words',
        '  - Spacing and punctuation',
        '  - Possessives and pluralization',
        'Apply language-specific rules for each language',
        'Detect duplicate terms:',
        '  - Case variations (e.g., "API" vs "api" vs "Api")',
        '  - Hyphenation variants (e.g., "e-mail" vs "email")',
        '  - Spelling variants (US vs UK English)',
        '  - Synonyms that should be unified',
        'Flag conflicts requiring manual resolution',
        'Establish preferred term for each concept',
        'Map non-preferred terms to preferred terms',
        'Document normalization decisions and rationale',
        'Create normalized terminology database with:',
        '  - Preferred term',
        '  - Definition',
        '  - Category and type',
        '  - Alternate forms',
        '  - Usage guidelines',
        '  - Examples',
        'Save normalized database and conflict report'
      ],
      outputFormat: 'JSON with terminologyDatabase, duplicateTerms, conflicts, resolutionRecommendations, normalizationRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['terminologyDatabase', 'duplicateTerms', 'artifacts'],
      properties: {
        terminologyDatabase: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            termCount: { type: 'number' },
            productTerms: { type: 'number' },
            technicalTerms: { type: 'number' },
            domainTerms: { type: 'number' },
            abbreviations: { type: 'number' },
            acronyms: { type: 'number' }
          }
        },
        duplicateTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              variants: { type: 'array' },
              recommended: { type: 'string' }
            }
          }
        },
        conflicts: { type: 'array' },
        resolutionRecommendations: { type: 'array' },
        normalizationRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'terminology', 'normalization']
}));

// Task 5: Glossary Generation
export const glossaryGenerationTask = defineTask('glossary-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate audience-specific glossary',
  agent: {
    name: 'glossary-generator',
    prompt: {
      role: 'technical writer and glossary specialist',
      task: 'Generate comprehensive glossary for specified audience with appropriate detail level',
      context: args,
      instructions: [
        'Filter terminology database for audience relevance',
        'For each audience type, adjust:',
        '  - Developer: include technical details, code examples, API references',
        '  - User: simple language, practical examples, avoid jargon',
        '  - All: comprehensive coverage with layered explanations',
        'For each term in glossary:',
        '  - Write clear, concise definition appropriate for audience',
        '  - Add pronunciation guide if term is potentially unclear',
        '  - Include usage examples and context',
        '  - Link to related terms (see also)',
        '  - Add acronym expansion if applicable',
        '  - Include code examples if relevant (developer audience)',
        '  - Show term in context with documentation references',
        'Organize glossary alphabetically with sections',
        'Add navigation aids (A-Z index, search anchor links)',
        'Include glossary metadata (last updated, term count, scope)',
        'Generate in multiple formats: markdown, HTML, JSON',
        'Add cross-references between related terms',
        'Include usage frequency indicators',
        'Save glossary files by audience type'
      ],
      outputFormat: 'JSON with glossaryPath, format, audience, termCount, sections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['glossaryPath', 'audience', 'termCount', 'artifacts'],
      properties: {
        glossaryPath: { type: 'string' },
        format: { type: 'array', items: { type: 'string' } },
        audience: { type: 'string' },
        termCount: { type: 'number' },
        sections: { type: 'array', items: { type: 'string' } },
        navigationStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'terminology', 'glossary-generation']
}));

// Task 6: Consistency Checking
export const consistencyCheckingTask = defineTask('consistency-checking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check terminology consistency across documentation',
  agent: {
    name: 'consistency-checker',
    prompt: {
      role: 'quality assurance specialist for technical documentation',
      task: 'Scan documentation for terminology inconsistencies and violations',
      context: args,
      instructions: [
        'Scan all documentation files from inventory',
        'For each document, check for terminology violations:',
        '  - Use of non-preferred terms when preferred exists',
        '  - Inconsistent capitalization of terms',
        '  - Inconsistent hyphenation or spacing',
        '  - Misspellings of defined terms',
        '  - Use of deprecated or obsolete terms',
        '  - Inconsistent abbreviation usage (e.g., mixing "API" and "A.P.I.")',
        '  - Inconsistent pluralization',
        'For each violation found, record:',
        '  - Violation type',
        '  - Severity (critical, major, minor)',
        '  - Term used',
        '  - Preferred term',
        '  - File path and line number',
        '  - Context snippet',
        '  - Suggested fix',
        'Calculate consistency metrics:',
        '  - Overall consistency score (0-100)',
        '  - Consistency by document',
        '  - Consistency by term category',
        'Categorize violations by type and severity',
        'Identify files with most violations',
        'Generate consistency report with statistics',
        'Create fixable violations list for auto-fix',
        'Save detailed consistency report and violations list'
      ],
      outputFormat: 'JSON with consistencyScore, violations (array), violationsByType, violationsBySeverity, affectedFiles, consistencyReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyScore', 'violations', 'artifacts'],
      properties: {
        consistencyScore: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              term: { type: 'string' },
              preferredTerm: { type: 'string' },
              file: { type: 'string' },
              line: { type: 'number' },
              context: { type: 'string' },
              suggestion: { type: 'string' },
              fixable: { type: 'boolean' }
            }
          }
        },
        violationsByType: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        violationsBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            major: { type: 'number' },
            minor: { type: 'number' }
          }
        },
        affectedFiles: { type: 'array', items: { type: 'string' } },
        consistencyReport: {
          type: 'object',
          properties: {
            reportPath: { type: 'string' }
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
  labels: ['agent', 'terminology', 'consistency-checking']
}));

// Task 7: Auto-fix Violations
export const autoFixViolationsTask = defineTask('auto-fix-violations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Automatically fix terminology violations',
  agent: {
    name: 'auto-fixer',
    prompt: {
      role: 'automated documentation correction specialist',
      task: 'Automatically fix fixable terminology violations in documentation',
      context: args,
      instructions: [
        'Filter violations for auto-fixable issues only',
        'For each fixable violation:',
        '  - Load file containing violation',
        '  - Locate exact term at specified line/context',
        '  - Apply suggested fix (replace with preferred term)',
        '  - Preserve surrounding formatting and context',
        '  - Handle case-sensitive replacements correctly',
        '  - Ensure fix does not break links or code blocks',
        'Apply fixes conservatively:',
        '  - Only fix when 100% confident',
        '  - Skip fixes in code blocks if uncertain',
        '  - Skip fixes in links or special syntax',
        '  - Maintain markdown/HTML structure',
        'Track all fixes made:',
        '  - File modified',
        '  - Line number',
        '  - Original term',
        '  - Replacement term',
        '  - Fix timestamp',
        'Generate fix summary report',
        'Create backup of original files before fixing',
        'Save fixed files and detailed fix log',
        'Report unfixable violations separately'
      ],
      outputFormat: 'JSON with fixedCount, unfixedCount, fixedFiles (array), unfixableViolations (array), fixLog, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fixedCount', 'unfixedCount', 'fixedFiles', 'artifacts'],
      properties: {
        fixedCount: { type: 'number' },
        unfixedCount: { type: 'number' },
        fixedFiles: { type: 'array', items: { type: 'string' } },
        unfixableViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              violation: { type: 'object' },
              reason: { type: 'string' }
            }
          }
        },
        fixLog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              original: { type: 'string' },
              fixed: { type: 'string' },
              timestamp: { type: 'string' }
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
  labels: ['agent', 'terminology', 'auto-fix']
}));

// Task 8: Vale Rules Generation
export const valeRulesGenerationTask = defineTask('vale-rules-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Vale linting rules for CI/CD',
  agent: {
    name: 'vale-rules-generator',
    prompt: {
      role: 'documentation linting specialist',
      task: 'Generate Vale style rules for automated terminology checking in CI/CD pipelines',
      context: args,
      instructions: [
        'Generate Vale rules from terminology database:',
        '  - Preferred term rules (accept patterns)',
        '  - Rejected term rules (terms to avoid)',
        '  - Capitalization rules',
        '  - Spelling rules for product names',
        '  - Consistency rules',
        'Create rule files by category:',
        '  - Terms.yml (preferred/rejected terms)',
        '  - Capitalization.yml (case rules)',
        '  - Spelling.yml (custom dictionary)',
        '  - Consistency.yml (pattern matching)',
        'For each rule:',
        '  - Define clear pattern (regex or exact match)',
        '  - Set severity level (error, warning, suggestion)',
        '  - Provide helpful error message',
        '  - Include suggested fix',
        'Generate Vale configuration file (.vale.ini):',
        '  - Configure style path',
        '  - Set minimum alert level',
        '  - Define file type associations',
        '  - Configure ignore patterns',
        'Create Vale vocabulary files:',
        '  - Accept.txt (approved terms)',
        '  - Reject.txt (terms to avoid)',
        'Generate documentation for rule usage',
        'Create CI/CD integration guide',
        'Test rules against sample documentation',
        'Save Vale configuration and rules to output directory'
      ],
      outputFormat: 'JSON with rulesCount, rulesPath, configPath, vocabularyFiles, integrationGuide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rulesCount', 'rulesPath', 'configPath', 'artifacts'],
      properties: {
        rulesCount: { type: 'number' },
        rulesPath: { type: 'string' },
        configPath: { type: 'string' },
        vocabularyFiles: {
          type: 'object',
          properties: {
            accept: { type: 'string' },
            reject: { type: 'string' }
          }
        },
        integrationGuide: { type: 'string' },
        rulesByCategory: {
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
  labels: ['agent', 'terminology', 'vale-rules']
}));

// Task 9: Term Coverage Analysis
export const termCoverageAnalysisTask = defineTask('term-coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze term coverage across documentation',
  agent: {
    name: 'coverage-analyzer',
    prompt: {
      role: 'documentation completeness analyst',
      task: 'Analyze how well defined terminology is covered in documentation',
      context: args,
      instructions: [
        'For each term in terminology database:',
        '  - Search for occurrences across all documentation',
        '  - Count frequency of use',
        '  - Identify which documents use the term',
        '  - Check if term appears in appropriate contexts',
        'Calculate coverage metrics:',
        '  - Overall coverage percentage (terms used / total terms)',
        '  - Coverage by term category',
        '  - Coverage by document',
        'Identify missing terms:',
        '  - Terms defined but never used in documentation',
        '  - Important terms with low usage (< 3 occurrences)',
        'Identify overused terms (potential for glossary reference)',
        'Identify underutilized terms:',
        '  - Terms that should appear more frequently',
        '  - Terms missing from key documents',
        'Analyze term distribution:',
        '  - Are terms evenly distributed?',
        '  - Are critical terms prominent enough?',
        'Generate recommendations:',
        '  - Where to add missing terms',
        '  - Which terms need more examples',
        '  - Potential glossary enhancements',
        'Create coverage report with visualizations',
        'Save detailed coverage analysis'
      ],
      outputFormat: 'JSON with coveragePercentage, coveredTerms, missingTerms (array), underutilizedTerms (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['coveragePercentage', 'coveredTerms', 'missingTerms', 'artifacts'],
      properties: {
        coveragePercentage: { type: 'number', minimum: 0, maximum: 100 },
        coveredTerms: { type: 'number' },
        missingTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              category: { type: 'string' },
              importance: { type: 'string' }
            }
          }
        },
        underutilizedTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              occurrences: { type: 'number' },
              expectedOccurrences: { type: 'number' }
            }
          }
        },
        termDistribution: {
          type: 'object',
          additionalProperties: { type: 'number' }
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
  labels: ['agent', 'terminology', 'coverage-analysis']
}));

// Task 10: Style Guide Validation
export const styleGuideValidationTask = defineTask('style-guide-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate terminology against style guide',
  agent: {
    name: 'style-guide-validator',
    prompt: {
      role: 'style guide compliance specialist',
      task: 'Validate terminology against industry and organizational style guide standards',
      context: args,
      instructions: [
        'Load style guide rules based on selected guide:',
        '  - Microsoft Writing Style Guide rules',
        '  - Google Developer Documentation Style Guide rules',
        '  - Custom organizational style guide',
        '  - Mixed/hybrid style guide',
        'Validate each term against style guide rules:',
        '  - Capitalization style (sentence case, title case, etc.)',
        '  - Hyphenation standards',
        '  - Abbreviation formatting',
        '  - Acronym usage (first use spell-out rules)',
        '  - Number formatting',
        '  - Date and time formats',
        '  - Product name conventions',
        'Check terminology violations:',
        '  - Terms violating style guide',
        '  - Inconsistent formatting',
        '  - Non-standard abbreviations',
        'Calculate compliance score by category',
        'Generate style guide compliance report:',
        '  - Overall compliance percentage',
        '  - Violations by rule category',
        '  - Recommended fixes',
        'Create style guide reference for team',
        'Save compliance report and violation details'
      ],
      outputFormat: 'JSON with complianceScore, violations (array), violationsByRule, compliantTerms, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'violations', 'artifacts'],
      properties: {
        complianceScore: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              rule: { type: 'string' },
              violation: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        violationsByRule: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        compliantTerms: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'terminology', 'style-validation']
}));

// Task 11: Synonym Mapping
export const synonymMappingTask = defineTask('synonym-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build synonym and related terms mappings',
  agent: {
    name: 'synonym-mapper',
    prompt: {
      role: 'computational linguist and semantic relationship analyst',
      task: 'Identify synonyms, related terms, and semantic relationships between terminology',
      context: args,
      instructions: [
        'Analyze terminology database for semantic relationships',
        'Identify synonym groups:',
        '  - Exact synonyms (same meaning, different terms)',
        '  - Near synonyms (similar but distinct meanings)',
        '  - Regional variants (US vs UK English)',
        '  - Abbreviation relationships',
        'Identify related terms:',
        '  - Broader terms (hypernyms)',
        '  - Narrower terms (hyponyms)',
        '  - Related concepts',
        '  - Antonyms',
        'Analyze co-occurrence patterns:',
        '  - Terms frequently used together',
        '  - Terms used in similar contexts',
        'Build semantic network:',
        '  - Nodes: terms',
        '  - Edges: relationships (synonym, related, broader, narrower)',
        '  - Weights: relationship strength',
        'Identify preferred terms within synonym groups',
        'Flag ambiguous terms (multiple meanings)',
        'Create synonym lookup tables:',
        '  - Map non-preferred to preferred',
        '  - Map abbreviations to full forms',
        '  - Map regional variants to standard',
        'Generate related terms suggestions for glossary',
        'Save synonym mappings and semantic network'
      ],
      outputFormat: 'JSON with synonymGroupCount, relatedTermsCount, synonymMappings, semanticNetwork, mappingPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synonymGroupCount', 'relatedTermsCount', 'mappingPath', 'artifacts'],
      properties: {
        synonymGroupCount: { type: 'number' },
        relatedTermsCount: { type: 'number' },
        synonymMappings: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              preferredTerm: { type: 'string' },
              synonyms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        semanticNetwork: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' }
          }
        },
        mappingPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'terminology', 'synonym-mapping']
}));

// Task 12: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess overall terminology management quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'documentation quality assurance specialist',
      task: 'Calculate comprehensive quality score for terminology management',
      context: args,
      instructions: [
        'Calculate weighted quality score based on:',
        '  - Consistency score (weight: 35%)',
        '  - Term coverage (weight: 25%)',
        '  - Style guide compliance (weight: 20%)',
        '  - Glossary completeness (weight: 15%)',
        '  - Violation severity (weight: 5%)',
        'Evaluate consistency:',
        '  - Overall consistency percentage',
        '  - Critical violations count',
        '  - Trend over time if historical data available',
        'Evaluate coverage:',
        '  - Percentage of terms used in documentation',
        '  - Distribution quality',
        '  - Important terms coverage',
        'Evaluate style compliance:',
        '  - Style guide adherence percentage',
        '  - Rule violation breakdown',
        'Evaluate glossary quality:',
        '  - Completeness of definitions',
        '  - Presence of examples',
        '  - Related terms linkage',
        'Compare against acceptance criteria',
        'Identify strengths and weaknesses',
        'Generate improvement recommendations',
        'Calculate trend indicators if possible',
        'Create quality scorecard',
        'Save comprehensive quality assessment report'
      ],
      outputFormat: 'JSON with overallScore (0-100), breakdown (object), strengths (array), weaknesses (array), recommendations (array), acceptanceMet (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'breakdown', 'acceptanceMet', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: {
          type: 'object',
          properties: {
            consistency: { type: 'number' },
            coverage: { type: 'number' },
            styleCompliance: { type: 'number' },
            glossaryCompleteness: { type: 'number' },
            violationSeverity: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        acceptanceMet: { type: 'boolean' },
        acceptanceCriteria: {
          type: 'object',
          properties: {
            minConsistencyScore: { type: 'object' },
            maxViolations: { type: 'object' },
            requiredTermCoverage: { type: 'object' },
            maxDuplicateTerms: { type: 'object' }
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
  labels: ['agent', 'terminology', 'quality-assessment']
}));

// Task 13: Report Generation
export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive terminology management reports',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'technical documentation reporting specialist',
      task: 'Create executive and detailed reports for terminology management outcomes',
      context: args,
      instructions: [
        'Generate Executive Summary Report:',
        '  - Project overview and objectives',
        '  - Key metrics dashboard (quality score, consistency, coverage)',
        '  - Critical issues and violations',
        '  - Recommendations for stakeholders',
        '  - Next steps and action items',
        '  - ROI and business value',
        'Generate Detailed Technical Report:',
        '  - Methodology and approach',
        '  - Terminology database statistics',
        '  - Glossary details and organization',
        '  - Consistency analysis with examples',
        '  - Coverage analysis with gaps',
        '  - Style guide compliance breakdown',
        '  - Violation details with context',
        '  - Auto-fix results if applicable',
        '  - Vale integration setup',
        '  - Synonym mappings and relationships',
        'Generate Violations Report:',
        '  - All violations organized by severity',
        '  - File-by-file violation breakdown',
        '  - Suggested fixes for each violation',
        '  - Prioritization guidance',
        'Generate Coverage Report:',
        '  - Term usage statistics',
        '  - Missing terms analysis',
        '  - Underutilized terms',
        '  - Recommendations for enhancement',
        'Format reports professionally:',
        '  - Clear headings and sections',
        '  - Data visualizations (tables, charts)',
        '  - Executive-friendly language for summary',
        '  - Technical depth for detailed report',
        'Include appendices:',
        '  - Complete terminology database',
        '  - Vale configuration',
        '  - Synonym mappings',
        'Save all reports in multiple formats (markdown, HTML, PDF)'
      ],
      outputFormat: 'JSON with executiveReportPath, detailedReportPath, violationsReportPath, coverageReportPath, formats, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveReportPath', 'detailedReportPath', 'artifacts'],
      properties: {
        executiveReportPath: { type: 'string' },
        detailedReportPath: { type: 'string' },
        violationsReportPath: { type: 'string' },
        coverageReportPath: { type: 'string' },
        formats: { type: 'array', items: { type: 'string' } },
        reportSummary: {
          type: 'object',
          properties: {
            totalPages: { type: 'number' },
            totalCharts: { type: 'number' },
            totalTables: { type: 'number' }
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
  labels: ['agent', 'terminology', 'reporting']
}));
