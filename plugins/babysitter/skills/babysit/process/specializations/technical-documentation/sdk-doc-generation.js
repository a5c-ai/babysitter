/**
 * @process specializations/technical-documentation/sdk-doc-generation
 * @description SDK and Client Library Documentation Generation - Automated generation of comprehensive SDK
 * documentation from code comments (JSDoc, Javadoc, docstrings), including API reference, code examples,
 * quickstart guides, integration tutorials, and multi-language SDK support following documentation best practices.
 * @inputs { projectName: string, sdkPath: string, language: string, targetLanguages?: array, includeExamples?: boolean, outputFormats?: array, hosting?: string }
 * @outputs { success: boolean, documentationStats: object, coverageMetrics: object, generatedArtifacts: array, qualityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/technical-documentation/sdk-doc-generation', {
 *   projectName: 'PaymentAPI SDK',
 *   sdkPath: './src/payment-sdk',
 *   language: 'javascript',
 *   targetLanguages: ['javascript', 'python', 'ruby', 'go', 'java'],
 *   includeExamples: true,
 *   outputFormats: ['html', 'markdown', 'json'],
 *   hosting: 'github-pages',
 *   docTooling: 'auto', // 'jsdoc', 'typedoc', 'javadoc', 'sphinx', 'rustdoc', 'godoc', 'auto'
 *   apiReference: { baseUrl: 'https://api.example.com/v1', spec: './openapi.yaml' },
 *   branding: { logo: './logo.png', primaryColor: '#0066cc' }
 * });
 *
 * @references
 * - JSDoc: https://jsdoc.app/
 * - TypeDoc: https://typedoc.org/
 * - Javadoc: https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html
 * - Sphinx: https://www.sphinx-doc.org/
 * - Doxygen: https://www.doxygen.nl/
 * - rustdoc: https://doc.rust-lang.org/rustdoc/
 * - Godoc: https://go.dev/blog/godoc
 * - Docusaurus: https://docusaurus.io/
 * - Documentation Best Practices: https://documentation.divio.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sdkPath,
    language, // 'javascript', 'typescript', 'python', 'java', 'ruby', 'go', 'rust', 'csharp', 'php'
    targetLanguages = [], // Additional language SDKs to document
    includeExamples = true,
    outputFormats = ['html', 'markdown'], // 'html', 'markdown', 'json', 'pdf'
    hosting = 'github-pages', // 'github-pages', 'netlify', 'vercel', 'readthedocs', 's3'
    docTooling = 'auto', // Auto-detect or specify: 'jsdoc', 'typedoc', 'javadoc', 'sphinx', etc.
    apiReference = null, // { baseUrl: string, spec: string } - Link to API spec
    branding = {}, // { logo: string, primaryColor: string, companyName: string }
    outputDir = 'sdk-docs-output',
    versionNumber = '1.0.0',
    includeSearchIndex = true,
    generateChangelog = true,
    acceptanceCriteria = {
      minCoverage: 80, // Percentage of public API documented
      minQualityScore: 75, // Documentation quality score
      examplesPerClass: 1, // Minimum examples per class/module
      brokenLinksAllowed: 0
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let documentationStats = {};
  let coverageMetrics = {};
  let generatedArtifacts = [];
  let qualityScore = 0;

  ctx.log('info', `Starting SDK Documentation Generation for ${projectName}`);
  ctx.log('info', `SDK Path: ${sdkPath}, Language: ${language}`);
  ctx.log('info', `Output Formats: ${outputFormats.join(', ')}, Hosting: ${hosting}`);

  // ============================================================================
  // PHASE 1: SDK CODE ANALYSIS AND INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing SDK codebase and creating inventory');

  const sdkAnalysis = await ctx.task(sdkCodeAnalysisTask, {
    projectName,
    sdkPath,
    language,
    targetLanguages,
    versionNumber,
    outputDir
  });

  if (!sdkAnalysis.success || sdkAnalysis.publicApiCount === 0) {
    return {
      success: false,
      error: 'Failed to analyze SDK codebase or no public API found',
      details: sdkAnalysis,
      metadata: {
        processId: 'specializations/technical-documentation/sdk-doc-generation',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...sdkAnalysis.artifacts);

  // Quality Gate: Minimum API surface
  if (sdkAnalysis.publicApiCount < 5) {
    await ctx.breakpoint({
      question: `Only ${sdkAnalysis.publicApiCount} public API elements found. This may indicate incomplete SDK or analysis issues. Review inventory and approve to continue?`,
      title: 'SDK Inventory Review',
      context: {
        runId: ctx.runId,
        publicApiCount: sdkAnalysis.publicApiCount,
        modules: sdkAnalysis.modules,
        classes: sdkAnalysis.classes,
        functions: sdkAnalysis.functions,
        recommendation: 'Verify SDK path and public API exports',
        files: sdkAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: DOCUMENTATION TOOLING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up documentation generation tooling');

  const toolingSetup = await ctx.task(docToolingSetupTask, {
    projectName,
    language,
    docTooling,
    outputFormats,
    hosting,
    branding,
    includeSearchIndex,
    sdkAnalysis,
    outputDir
  });

  artifacts.push(...toolingSetup.artifacts);

  if (!toolingSetup.success) {
    return {
      success: false,
      error: 'Failed to set up documentation tooling',
      details: toolingSetup,
      metadata: {
        processId: 'specializations/technical-documentation/sdk-doc-generation',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 3: INLINE DOCUMENTATION AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 3: Auditing inline documentation coverage and quality');

  const docAudit = await ctx.task(inlineDocAuditTask, {
    projectName,
    sdkPath,
    language,
    sdkAnalysis,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...docAudit.artifacts);

  coverageMetrics = docAudit.coverageMetrics;

  // Quality Gate: Documentation coverage
  const currentCoverage = docAudit.coverageMetrics.overallCoverage;
  if (currentCoverage < acceptanceCriteria.minCoverage) {
    await ctx.breakpoint({
      question: `Documentation coverage: ${currentCoverage.toFixed(1)}%. Target: ${acceptanceCriteria.minCoverage}%. Below threshold. Review gaps and decide to enhance docs or continue?`,
      title: 'Documentation Coverage Quality Gate',
      context: {
        runId: ctx.runId,
        currentCoverage,
        targetCoverage: acceptanceCriteria.minCoverage,
        undocumentedClasses: docAudit.undocumentedElements.classes,
        undocumentedMethods: docAudit.undocumentedElements.methods,
        undocumentedFunctions: docAudit.undocumentedElements.functions,
        coverageByModule: docAudit.coverageByModule,
        recommendation: 'Consider enhancing inline documentation before generation',
        files: docAudit.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: MISSING DOCUMENTATION ENHANCEMENT
  // ============================================================================

  let enhancementResults = null;
  if (currentCoverage < acceptanceCriteria.minCoverage) {
    ctx.log('info', 'Phase 4: Enhancing missing inline documentation');

    enhancementResults = await ctx.task(docEnhancementTask, {
      projectName,
      sdkPath,
      language,
      undocumentedElements: docAudit.undocumentedElements,
      sdkAnalysis,
      outputDir
    });

    artifacts.push(...enhancementResults.artifacts);

    // Re-audit after enhancement
    const postEnhancementAudit = await ctx.task(inlineDocAuditTask, {
      projectName,
      sdkPath,
      language,
      sdkAnalysis,
      acceptanceCriteria,
      outputDir
    });

    artifacts.push(...postEnhancementAudit.artifacts);
    coverageMetrics = postEnhancementAudit.coverageMetrics;
  }

  // ============================================================================
  // PHASE 5: CODE EXAMPLES GENERATION (PARALLEL)
  // ============================================================================

  if (includeExamples) {
    ctx.log('info', 'Phase 5: Generating code examples in parallel');

    // Generate examples for different SDK areas in parallel
    const exampleCategories = [
      { category: 'quickstart', priority: 'high' },
      { category: 'authentication', priority: 'high' },
      { category: 'common-operations', priority: 'high' },
      { category: 'advanced-features', priority: 'medium' },
      { category: 'error-handling', priority: 'medium' },
      { category: 'configuration', priority: 'medium' }
    ];

    const exampleTasks = exampleCategories.map(({ category, priority }) =>
      () => ctx.task(codeExampleGenerationTask, {
        projectName,
        category,
        priority,
        language,
        targetLanguages,
        sdkAnalysis,
        apiReference,
        outputDir
      })
    );

    const exampleResults = await ctx.parallel.all(exampleTasks);

    artifacts.push(...exampleResults.flatMap(r => r.artifacts));

    const totalExamples = exampleResults.reduce((sum, r) => sum + r.examplesGenerated, 0);
    ctx.log('info', `Total code examples generated: ${totalExamples}`);

    // Quality Gate: Minimum examples per class
    const examplesPerClass = totalExamples / sdkAnalysis.classes.length;
    if (examplesPerClass < acceptanceCriteria.examplesPerClass) {
      await ctx.breakpoint({
        question: `Generated ${examplesPerClass.toFixed(1)} examples per class. Target: ${acceptanceCriteria.examplesPerClass}. Below threshold. Review examples and decide to generate more or continue?`,
        title: 'Code Examples Quality Gate',
        context: {
          runId: ctx.runId,
          totalExamples,
          examplesPerClass,
          targetExamplesPerClass: acceptanceCriteria.examplesPerClass,
          classCount: sdkAnalysis.classes.length,
          examplesByCategory: exampleResults.map(r => ({ category: r.category, count: r.examplesGenerated })),
          files: exampleResults.flatMap(r => r.artifacts).map(a => ({ path: a.path, format: a.format || 'markdown' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: API REFERENCE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating API reference documentation');

  const apiRefGeneration = await ctx.task(apiReferenceGenerationTask, {
    projectName,
    sdkPath,
    language,
    toolingSetup,
    outputFormats,
    versionNumber,
    sdkAnalysis,
    outputDir
  });

  artifacts.push(...apiRefGeneration.artifacts);
  generatedArtifacts.push(...apiRefGeneration.generatedFiles);

  if (!apiRefGeneration.success) {
    return {
      success: false,
      error: 'Failed to generate API reference documentation',
      details: apiRefGeneration,
      metadata: {
        processId: 'specializations/technical-documentation/sdk-doc-generation',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 7: INTEGRATION GUIDES AND TUTORIALS
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating integration guides and tutorials');

  const guidesCreation = await ctx.task(integrationGuidesTask, {
    projectName,
    language,
    targetLanguages,
    sdkAnalysis,
    apiReference,
    toolingSetup,
    outputDir
  });

  artifacts.push(...guidesCreation.artifacts);
  generatedArtifacts.push(...guidesCreation.generatedFiles);

  // ============================================================================
  // PHASE 8: QUICKSTART AND GETTING STARTED GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating quickstart and getting started guide');

  const quickstartCreation = await ctx.task(quickstartGuideTask, {
    projectName,
    language,
    sdkAnalysis,
    apiReference,
    installation: sdkAnalysis.packageInfo,
    outputDir
  });

  artifacts.push(...quickstartCreation.artifacts);
  generatedArtifacts.push(...quickstartCreation.generatedFiles);

  // ============================================================================
  // PHASE 9: CHANGELOG GENERATION
  // ============================================================================

  let changelogResult = null;
  if (generateChangelog) {
    ctx.log('info', 'Phase 9: Generating changelog and migration guides');

    changelogResult = await ctx.task(changelogGenerationTask, {
      projectName,
      sdkPath,
      versionNumber,
      language,
      outputDir
    });

    artifacts.push(...changelogResult.artifacts);
    generatedArtifacts.push(...changelogResult.generatedFiles);
  }

  // ============================================================================
  // PHASE 10: CROSS-REFERENCES AND LINKS VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Building cross-references and validating links');

  const linksValidation = await ctx.task(crossReferenceValidationTask, {
    projectName,
    generatedArtifacts,
    apiReference,
    outputDir
  });

  artifacts.push(...linksValidation.artifacts);

  // Quality Gate: Broken links
  if (linksValidation.brokenLinks.length > acceptanceCriteria.brokenLinksAllowed) {
    await ctx.breakpoint({
      question: `Found ${linksValidation.brokenLinks.length} broken links. Target: ${acceptanceCriteria.brokenLinksAllowed}. Review and fix broken links?`,
      title: 'Link Validation Quality Gate',
      context: {
        runId: ctx.runId,
        brokenLinksCount: linksValidation.brokenLinks.length,
        targetBrokenLinks: acceptanceCriteria.brokenLinksAllowed,
        brokenLinks: linksValidation.brokenLinks,
        warningLinks: linksValidation.warningLinks,
        recommendation: 'Fix broken internal and external links',
        files: linksValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: SEARCH INDEX GENERATION
  // ============================================================================

  let searchIndexResult = null;
  if (includeSearchIndex) {
    ctx.log('info', 'Phase 11: Generating search index for documentation');

    searchIndexResult = await ctx.task(searchIndexGenerationTask, {
      projectName,
      generatedArtifacts,
      outputDir
    });

    artifacts.push(...searchIndexResult.artifacts);
  }

  // ============================================================================
  // PHASE 12: MULTI-FORMAT OUTPUT GENERATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating documentation in multiple formats in parallel');

  const formatTasks = outputFormats.map(format =>
    () => ctx.task(formatGenerationTask, {
      projectName,
      format,
      generatedArtifacts,
      toolingSetup,
      branding,
      outputDir
    })
  );

  const formatResults = await ctx.parallel.all(formatTasks);

  artifacts.push(...formatResults.flatMap(r => r.artifacts));
  generatedArtifacts.push(...formatResults.flatMap(r => r.outputFiles));

  // ============================================================================
  // PHASE 13: DOCUMENTATION QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 13: Assessing documentation quality and completeness');

  const qualityAssessment = await ctx.task(docQualityAssessmentTask, {
    projectName,
    coverageMetrics,
    generatedArtifacts,
    sdkAnalysis,
    linksValidation,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);
  qualityScore = qualityAssessment.overallScore;
  documentationStats = qualityAssessment.stats;

  // Quality Gate: Documentation quality score
  if (qualityScore < acceptanceCriteria.minQualityScore) {
    await ctx.breakpoint({
      question: `Documentation quality score: ${qualityScore}/100. Target: ${acceptanceCriteria.minQualityScore}. Below threshold. Review quality report and decide to improve or proceed?`,
      title: 'Documentation Quality Gate',
      context: {
        runId: ctx.runId,
        qualityScore,
        targetQualityScore: acceptanceCriteria.minQualityScore,
        qualityBreakdown: qualityAssessment.breakdown,
        improvementSuggestions: qualityAssessment.suggestions,
        strengths: qualityAssessment.strengths,
        weaknesses: qualityAssessment.weaknesses,
        files: qualityAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: HOSTING PREPARATION AND DEPLOYMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 14: Preparing documentation for hosting and deployment');

  const hostingPrep = await ctx.task(hostingPreparationTask, {
    projectName,
    hosting,
    generatedArtifacts,
    outputFormats,
    versionNumber,
    searchIndexResult,
    outputDir
  });

  artifacts.push(...hostingPrep.artifacts);

  // ============================================================================
  // PHASE 15: FINAL REVIEW PACKAGE
  // ============================================================================

  ctx.log('info', 'Phase 15: Creating final review package');

  const reviewPackage = await ctx.task(finalReviewPackageTask, {
    projectName,
    documentationStats,
    coverageMetrics,
    qualityScore,
    generatedArtifacts,
    hostingPrep,
    outputDir
  });

  artifacts.push(...reviewPackage.artifacts);

  // Final Breakpoint: Review complete documentation
  await ctx.breakpoint({
    question: `SDK documentation generation complete for ${projectName}. Quality score: ${qualityScore}/100, Coverage: ${coverageMetrics.overallCoverage.toFixed(1)}%. Review final documentation package and approve for deployment?`,
    title: 'Final Documentation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'html',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        coverage: coverageMetrics.overallCoverage,
        totalPages: documentationStats.totalPages,
        totalExamples: documentationStats.totalExamples,
        outputFormats: outputFormats,
        hosting,
        deploymentReady: hostingPrep.deploymentReady
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    language,
    versionNumber,
    qualityScore,
    documentationStats: {
      totalPages: documentationStats.totalPages,
      totalExamples: documentationStats.totalExamples,
      totalArtifacts: generatedArtifacts.length,
      outputFormats: outputFormats.length,
      brokenLinks: linksValidation.brokenLinks.length
    },
    coverageMetrics: {
      overallCoverage: coverageMetrics.overallCoverage,
      classDocumentation: coverageMetrics.classDocumentation,
      methodDocumentation: coverageMetrics.methodDocumentation,
      functionDocumentation: coverageMetrics.functionDocumentation,
      examplesPerClass: documentationStats.totalExamples / sdkAnalysis.classes.length
    },
    generatedArtifacts: generatedArtifacts.map(a => ({
      path: a.path,
      type: a.type,
      format: a.format,
      size: a.size
    })),
    hosting: {
      platform: hosting,
      deploymentReady: hostingPrep.deploymentReady,
      deploymentInstructions: hostingPrep.deploymentInstructions
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/sdk-doc-generation',
      timestamp: startTime,
      outputDir,
      tooling: toolingSetup.selectedTool
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: SDK Code Analysis
export const sdkCodeAnalysisTask = defineTask('sdk-code-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze SDK codebase and create API inventory',
  agent: {
    name: 'sdk-analyzer',
    prompt: {
      role: 'senior software engineer and SDK architect',
      task: 'Analyze SDK codebase, identify public API surface, and create comprehensive inventory',
      context: args,
      instructions: [
        'Scan SDK directory structure and identify entry points',
        'Identify all public classes, interfaces, functions, and methods',
        'Extract package/module structure and dependencies',
        'Identify language-specific features (TypeScript types, Python decorators, Java annotations)',
        'Catalog public API elements with:',
        '  - Name and qualified name',
        '  - Type (class, function, method, property, constant)',
        '  - Visibility (public, protected, internal)',
        '  - Parameters and return types',
        '  - Existing documentation comments',
        'Analyze package.json/pom.xml/setup.py for package metadata',
        'Identify SDK version, dependencies, and installation requirements',
        'Create module hierarchy and relationships',
        'Save API inventory with full details to output directory',
        'Generate statistics: total classes, methods, functions, modules'
      ],
      outputFormat: 'JSON with success (boolean), publicApiCount (number), modules (array), classes (array), functions (array), methods (array), packageInfo (object), statistics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'publicApiCount', 'modules', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        publicApiCount: { type: 'number' },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              exports: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        classes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              qualifiedName: { type: 'string' },
              module: { type: 'string' },
              methods: { type: 'array' },
              properties: { type: 'array' },
              hasDocumentation: { type: 'boolean' }
            }
          }
        },
        functions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              module: { type: 'string' },
              parameters: { type: 'array' },
              returnType: { type: 'string' },
              hasDocumentation: { type: 'boolean' }
            }
          }
        },
        methods: { type: 'array' },
        packageInfo: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            repository: { type: 'string' },
            dependencies: { type: 'object' }
          }
        },
        statistics: {
          type: 'object',
          properties: {
            totalModules: { type: 'number' },
            totalClasses: { type: 'number' },
            totalMethods: { type: 'number' },
            totalFunctions: { type: 'number' }
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
  labels: ['agent', 'sdk', 'code-analysis']
}));

// Task 2: Documentation Tooling Setup
export const docToolingSetupTask = defineTask('doc-tooling-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up documentation generation tooling',
  agent: {
    name: 'doc-tooling-engineer',
    prompt: {
      role: 'documentation tooling specialist',
      task: 'Select and configure appropriate documentation generation tool based on language and requirements',
      context: args,
      instructions: [
        'Determine optimal documentation tool based on language:',
        '  - JavaScript/TypeScript: JSDoc, TypeDoc, or documentation.js',
        '  - Python: Sphinx with autodoc, MkDocs with mkdocstrings',
        '  - Java: Javadoc',
        '  - Ruby: YARD or RDoc',
        '  - Go: godoc or pkgsite',
        '  - Rust: rustdoc',
        '  - C#: DocFX or Sandcastle',
        '  - PHP: phpDocumentor',
        'If docTooling="auto", auto-select best tool for language',
        'Generate configuration file (jsdoc.json, sphinx conf.py, etc.)',
        'Configure output formats (HTML, Markdown, JSON)',
        'Set up custom theme/branding (logo, colors, company name)',
        'Configure search index generation if enabled',
        'Set up navigation structure and table of contents',
        'Configure syntax highlighting and code blocks',
        'Save tool configuration to output directory',
        'Document tool selection rationale and setup instructions'
      ],
      outputFormat: 'JSON with success (boolean), selectedTool (string), configFile (string), theme (object), features (array), setupInstructions (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'selectedTool', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        selectedTool: { type: 'string' },
        configFile: { type: 'string' },
        theme: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            customized: { type: 'boolean' },
            branding: { type: 'object' }
          }
        },
        features: { type: 'array', items: { type: 'string' } },
        setupInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'tooling-setup']
}));

// Task 3: Inline Documentation Audit
export const inlineDocAuditTask = defineTask('inline-doc-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit inline documentation coverage and quality',
  agent: {
    name: 'doc-auditor',
    prompt: {
      role: 'technical documentation auditor',
      task: 'Assess inline documentation coverage, completeness, and quality across SDK codebase',
      context: args,
      instructions: [
        'Scan all public API elements from SDK analysis',
        'Check for presence of documentation comments (JSDoc, docstrings, Javadoc, etc.)',
        'Evaluate documentation completeness for each element:',
        '  - Description present and meaningful?',
        '  - Parameters documented with types and descriptions?',
        '  - Return value documented?',
        '  - Exceptions/errors documented?',
        '  - Examples included?',
        'Calculate coverage metrics:',
        '  - Overall coverage percentage',
        '  - Coverage by module/package',
        '  - Coverage by element type (class, method, function)',
        'Identify undocumented elements by category',
        'Assess documentation quality (clarity, completeness, examples)',
        'Flag poorly documented elements (incomplete, unclear, outdated)',
        'Generate coverage report with gaps and recommendations',
        'Save audit results to output directory'
      ],
      outputFormat: 'JSON with coverageMetrics (object), undocumentedElements (object), poorlyDocumentedElements (array), coverageByModule (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['coverageMetrics', 'undocumentedElements', 'artifacts'],
      properties: {
        coverageMetrics: {
          type: 'object',
          properties: {
            overallCoverage: { type: 'number' },
            classDocumentation: { type: 'number' },
            methodDocumentation: { type: 'number' },
            functionDocumentation: { type: 'number' },
            parameterDocumentation: { type: 'number' }
          }
        },
        undocumentedElements: {
          type: 'object',
          properties: {
            classes: { type: 'array', items: { type: 'string' } },
            methods: { type: 'array', items: { type: 'string' } },
            functions: { type: 'array', items: { type: 'string' } }
          }
        },
        poorlyDocumentedElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        coverageByModule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              module: { type: 'string' },
              coverage: { type: 'number' }
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
  labels: ['agent', 'sdk', 'documentation-audit']
}));

// Task 4: Documentation Enhancement
export const docEnhancementTask = defineTask('doc-enhancement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enhance missing and incomplete documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'technical writer and SDK documentation specialist',
      task: 'Generate and enhance inline documentation for undocumented or poorly documented API elements',
      context: args,
      instructions: [
        'For each undocumented element from audit:',
        '  - Analyze code to understand functionality and behavior',
        '  - Generate clear, concise description',
        '  - Document all parameters with types and descriptions',
        '  - Document return values and types',
        '  - Document exceptions and error conditions',
        '  - Add usage notes and important considerations',
        'Follow language-specific documentation conventions:',
        '  - JavaScript/TypeScript: JSDoc format with @param, @returns, @throws, @example',
        '  - Python: Google-style or NumPy-style docstrings',
        '  - Java: Javadoc with @param, @return, @throws',
        '  - Ruby: YARD syntax',
        'Maintain consistent documentation style across codebase',
        'Generate documentation comments ready to insert into code',
        'Prioritize public API and frequently used methods',
        'Save enhanced documentation organized by module/class',
        'Document what was enhanced and coverage improvement'
      ],
      outputFormat: 'JSON with enhancedElements (array), coverageImprovement (number), enhancedDocumentation (object), suggestions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['enhancedElements', 'coverageImprovement', 'artifacts'],
      properties: {
        enhancedElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              type: { type: 'string' },
              documentation: { type: 'string' },
              file: { type: 'string' }
            }
          }
        },
        coverageImprovement: { type: 'number' },
        enhancedDocumentation: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        suggestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'documentation-enhancement']
}));

// Task 5: Code Example Generation
export const codeExampleGenerationTask = defineTask('code-example-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate code examples for SDK usage',
  agent: {
    name: 'example-developer',
    prompt: {
      role: 'developer evangelist and SDK example creator',
      task: 'Create comprehensive, working code examples demonstrating SDK usage',
      context: args,
      instructions: [
        'Generate code examples for assigned category:',
        '  - Quickstart: Basic SDK initialization and first API call',
        '  - Authentication: All supported auth methods with examples',
        '  - Common Operations: Most frequently used SDK operations',
        '  - Advanced Features: Complex use cases and advanced functionality',
        '  - Error Handling: Proper error handling and retry logic',
        '  - Configuration: SDK configuration options and customization',
        'For each example:',
        '  - Write complete, runnable code',
        '  - Include imports and setup',
        '  - Add inline comments explaining key steps',
        '  - Show expected output or result',
        '  - Include error handling',
        '  - Follow language best practices and idioms',
        'If targetLanguages specified, create equivalent examples in each language',
        'Create examples at multiple complexity levels (beginner, intermediate, advanced)',
        'Link examples to relevant API reference documentation',
        'Test examples for correctness (syntax at minimum)',
        'Save examples organized by category and language',
        'Generate example index with titles and descriptions'
      ],
      outputFormat: 'JSON with category (string), examplesGenerated (number), examples (array), languagesCovered (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'examplesGenerated', 'examples', 'artifacts'],
      properties: {
        category: { type: 'string' },
        examplesGenerated: { type: 'number' },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              language: { type: 'string' },
              code: { type: 'string' },
              complexity: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
              filePath: { type: 'string' }
            }
          }
        },
        languagesCovered: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'code-examples']
}));

// Task 6: API Reference Generation
export const apiReferenceGenerationTask = defineTask('api-reference-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate API reference documentation',
  agent: {
    name: 'api-doc-generator',
    prompt: {
      role: 'API documentation generator',
      task: 'Generate comprehensive API reference documentation from code and comments',
      context: args,
      instructions: [
        'Execute documentation generation tool configured in tooling setup',
        'Generate API reference for all public classes, methods, functions',
        'Include:',
        '  - Class/interface descriptions and hierarchies',
        '  - Method signatures with parameter types',
        '  - Return types and values',
        '  - Property documentation',
        '  - Constant and enum documentation',
        '  - Type definitions and interfaces',
        'Generate in requested output formats (HTML, Markdown, JSON)',
        'Create navigation structure and index pages',
        'Include inheritance and relationship diagrams where applicable',
        'Generate module/package overview pages',
        'Link related classes and methods',
        'Include source code links if available',
        'Apply custom branding and theme',
        'Organize output by module/namespace hierarchy',
        'Generate table of contents and navigation',
        'Save generated files with metadata (format, size, checksum)'
      ],
      outputFormat: 'JSON with success (boolean), generatedFiles (array with path, type, format, size), totalPages (number), formats (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'generatedFiles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        generatedFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' },
              size: { type: 'number' }
            }
          }
        },
        totalPages: { type: 'number' },
        formats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'api-reference']
}));

// Task 7: Integration Guides
export const integrationGuidesTask = defineTask('integration-guides', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create integration guides and tutorials',
  agent: {
    name: 'tutorial-writer',
    prompt: {
      role: 'developer educator and tutorial creator',
      task: 'Create comprehensive integration guides and step-by-step tutorials',
      context: args,
      instructions: [
        'Create integration guides covering:',
        '  - Installation and setup (all package managers)',
        '  - Configuration and initialization',
        '  - Authentication and credentials setup',
        '  - Core concepts and SDK architecture',
        '  - Common integration patterns',
        '  - Framework-specific integration (React, Django, Rails, etc.)',
        '  - Testing with the SDK',
        '  - Production deployment considerations',
        'For each guide:',
        '  - Clear introduction and objectives',
        '  - Prerequisites and requirements',
        '  - Step-by-step instructions with code',
        '  - Expected outcomes and verification steps',
        '  - Common issues and troubleshooting',
        '  - Next steps and related resources',
        'Create task-oriented guides (Diataxis framework)',
        'Include diagrams for complex flows',
        'Link to relevant API reference sections',
        'Create guides for each target language if applicable',
        'Use consistent structure and formatting',
        'Save guides as separate markdown files',
        'Generate guides index page'
      ],
      outputFormat: 'JSON with guidesCreated (number), guides (array), topics (array), generatedFiles (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidesCreated', 'guides', 'artifacts'],
      properties: {
        guidesCreated: { type: 'number' },
        guides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              topic: { type: 'string' },
              language: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        topics: { type: 'array', items: { type: 'string' } },
        generatedFiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'integration-guides']
}));

// Task 8: Quickstart Guide
export const quickstartGuideTask = defineTask('quickstart-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create quickstart and getting started guide',
  agent: {
    name: 'quickstart-writer',
    prompt: {
      role: 'developer onboarding specialist',
      task: 'Create compelling quickstart guide to get developers up and running quickly',
      context: args,
      instructions: [
        'Create quickstart guide with:',
        '  - Brief introduction to SDK and what it does',
        '  - Installation instructions (copy-paste ready)',
        '  - Minimal working example (5-10 lines of code)',
        '  - Expected output and verification',
        '  - Next steps and where to go from here',
        'Installation section:',
        '  - Include all major package managers (npm, pip, maven, gem, etc.)',
        '  - Version requirements and compatibility',
        '  - Alternative installation methods',
        'First example should be:',
        '  - Simple and achievable in under 5 minutes',
        '  - Demonstrating core SDK value',
        '  - Requiring minimal setup',
        '  - With clear success criteria',
        'Link to detailed guides for deeper topics',
        'Include troubleshooting section for common issues',
        'Add prerequisites and system requirements',
        'Use encouraging, friendly tone',
        'Test quickstart guide for completeness',
        'Save as prominent README or Getting Started page'
      ],
      outputFormat: 'JSON with quickstartCreated (boolean), filePath (string), estimatedTime (string), generatedFiles (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['quickstartCreated', 'filePath', 'artifacts'],
      properties: {
        quickstartCreated: { type: 'boolean' },
        filePath: { type: 'string' },
        estimatedTime: { type: 'string' },
        generatedFiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'quickstart']
}));

// Task 9: Changelog Generation
export const changelogGenerationTask = defineTask('changelog-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate changelog and migration guides',
  agent: {
    name: 'changelog-maintainer',
    prompt: {
      role: 'SDK maintainer and release manager',
      task: 'Generate changelog and migration guides from version history',
      context: args,
      instructions: [
        'Analyze git history or version control for SDK changes',
        'Extract changes by version:',
        '  - Features (new functionality)',
        '  - Improvements (enhancements to existing features)',
        '  - Bug fixes',
        '  - Breaking changes',
        '  - Deprecations',
        '  - Security fixes',
        'Format changelog following Keep a Changelog format',
        'Group changes by semantic version (major.minor.patch)',
        'For each version:',
        '  - Version number and release date',
        '  - Categorized list of changes',
        '  - Links to pull requests or commits',
        '  - Contributors acknowledgment',
        'Create migration guides for major versions:',
        '  - Breaking changes explained',
        '  - Before/after code examples',
        '  - Step-by-step migration instructions',
        '  - Deprecated API replacements',
        'Link changelog entries to relevant documentation',
        'Save CHANGELOG.md and migration guides'
      ],
      outputFormat: 'JSON with changelogCreated (boolean), versions (array), migrationGuidesCreated (number), generatedFiles (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['changelogCreated', 'versions', 'artifacts'],
      properties: {
        changelogCreated: { type: 'boolean' },
        versions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              releaseDate: { type: 'string' },
              changes: { type: 'object' }
            }
          }
        },
        migrationGuidesCreated: { type: 'number' },
        generatedFiles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'changelog']
}));

// Task 10: Cross-Reference Validation
export const crossReferenceValidationTask = defineTask('cross-reference-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build cross-references and validate links',
  agent: {
    name: 'link-validator',
    prompt: {
      role: 'documentation quality engineer',
      task: 'Build cross-reference index and validate all internal and external links',
      context: args,
      instructions: [
        'Scan all generated documentation files',
        'Extract all links (internal and external):',
        '  - Internal links to other doc pages',
        '  - Links to API reference sections',
        '  - Links to code examples',
        '  - External links to dependencies, tools, resources',
        'Validate each link:',
        '  - Internal links: verify target file/anchor exists',
        '  - External links: check HTTP status (200 OK)',
        '  - Relative links: ensure correct path resolution',
        'Build cross-reference index:',
        '  - Which pages link to each API element',
        '  - Related content suggestions',
        '  - Bi-directional reference map',
        'Categorize link issues:',
        '  - Broken links (404, file not found)',
        '  - Warning links (redirects, slow responses)',
        '  - Deprecated links',
        'Generate link validation report:',
        '  - Total links checked',
        '  - Broken links with location and target',
        '  - Recommendations for fixes',
        'Add "Related" sections to pages based on cross-references',
        'Save validation report and cross-reference index'
      ],
      outputFormat: 'JSON with totalLinks (number), brokenLinks (array), warningLinks (array), crossReferences (object), validationReport (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalLinks', 'brokenLinks', 'artifacts'],
      properties: {
        totalLinks: { type: 'number' },
        brokenLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              link: { type: 'string' },
              source: { type: 'string' },
              error: { type: 'string' }
            }
          }
        },
        warningLinks: { type: 'array' },
        crossReferences: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        validationReport: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'link-validation']
}));

// Task 11: Search Index Generation
export const searchIndexGenerationTask = defineTask('search-index-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate search index for documentation',
  agent: {
    name: 'search-indexer',
    prompt: {
      role: 'search engine specialist',
      task: 'Generate comprehensive search index for documentation site',
      context: args,
      instructions: [
        'Scan all generated documentation content',
        'Extract searchable content:',
        '  - Page titles and headings',
        '  - Body text and descriptions',
        '  - Code examples and syntax',
        '  - API names and signatures',
        '  - Keywords and tags',
        'Build search index with:',
        '  - Content tokenization and stemming',
        '  - Relevance scoring weights (title > heading > body)',
        '  - Synonym mapping (class = interface, method = function)',
        '  - Type-ahead suggestions',
        'Support for client-side search engines:',
        '  - Lunr.js for static sites',
        '  - Algolia DocSearch integration',
        '  - Custom search implementation',
        'Generate search index file (JSON format)',
        'Create search configuration for documentation tool',
        'Test search functionality with common queries',
        'Optimize index size while maintaining search quality',
        'Save search index and configuration'
      ],
      outputFormat: 'JSON with indexCreated (boolean), indexSize (number), searchableDocuments (number), searchEngine (string), indexPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indexCreated', 'indexSize', 'searchableDocuments', 'artifacts'],
      properties: {
        indexCreated: { type: 'boolean' },
        indexSize: { type: 'number' },
        searchableDocuments: { type: 'number' },
        searchEngine: { type: 'string' },
        indexPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'search-index']
}));

// Task 12: Format Generation
export const formatGenerationTask = defineTask('format-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate documentation in specific format',
  agent: {
    name: 'format-converter',
    prompt: {
      role: 'documentation format specialist',
      task: 'Convert and generate documentation in specified output format',
      context: args,
      instructions: [
        'Generate documentation in assigned format:',
        '  - HTML: Full website with navigation, styling, responsive design',
        '  - Markdown: Clean markdown files for GitHub/GitLab',
        '  - JSON: Structured data for programmatic access',
        '  - PDF: Printable documentation with table of contents',
        'For HTML format:',
        '  - Apply custom theme and branding',
        '  - Responsive design (mobile-friendly)',
        '  - Syntax highlighting for code blocks',
        '  - Interactive navigation and search',
        '  - Dark/light mode toggle if supported',
        'For Markdown format:',
        '  - GitHub-flavored markdown',
        '  - Relative links for repository navigation',
        '  - Proper heading hierarchy',
        '  - Code fence with language tags',
        'For JSON format:',
        '  - Structured schema for API reference',
        '  - Machine-readable format',
        '  - Complete metadata',
        'Optimize assets (images, CSS, JS) for web delivery',
        'Generate sitemap for HTML documentation',
        'Save output files organized by format',
        'Document format-specific features and limitations'
      ],
      outputFormat: 'JSON with format (string), outputFiles (array with path, size), features (array), optimized (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['format', 'outputFiles', 'artifacts'],
      properties: {
        format: { type: 'string' },
        outputFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              size: { type: 'number' },
              type: { type: 'string' }
            }
          }
        },
        features: { type: 'array', items: { type: 'string' } },
        optimized: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'format-generation']
}));

// Task 13: Documentation Quality Assessment
export const docQualityAssessmentTask = defineTask('doc-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess documentation quality and completeness',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'documentation quality assurance specialist',
      task: 'Comprehensively assess documentation quality, completeness, and usability',
      context: args,
      instructions: [
        'Evaluate documentation completeness (weight: 30%):',
        '  - API coverage (all public APIs documented?)',
        '  - Code examples coverage',
        '  - Integration guides present?',
        '  - Quickstart guide present?',
        '  - Changelog present?',
        'Evaluate documentation quality (weight: 25%):',
        '  - Clarity and readability',
        '  - Technical accuracy',
        '  - Consistent terminology',
        '  - Proper grammar and spelling',
        'Evaluate code examples quality (weight: 20%):',
        '  - Examples are runnable',
        '  - Cover common use cases',
        '  - Include error handling',
        '  - Follow best practices',
        'Evaluate navigation and structure (weight: 15%):',
        '  - Logical organization',
        '  - Easy to find information',
        '  - Effective search functionality',
        '  - Clear navigation menus',
        'Evaluate technical aspects (weight: 10%):',
        '  - No broken links',
        '  - Proper formatting',
        '  - Images and diagrams present',
        '  - Mobile-responsive (for HTML)',
        'Calculate weighted overall quality score (0-100)',
        'Identify strengths and weaknesses',
        'Provide specific improvement suggestions',
        'Compare against acceptance criteria',
        'Generate comprehensive quality report'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), breakdown (object), stats (object), strengths (array), weaknesses (array), suggestions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'breakdown', 'stats', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            quality: { type: 'number' },
            examples: { type: 'number' },
            navigation: { type: 'number' },
            technical: { type: 'number' }
          }
        },
        stats: {
          type: 'object',
          properties: {
            totalPages: { type: 'number' },
            totalExamples: { type: 'number' },
            totalWords: { type: 'number' },
            averageReadability: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'quality-assessment']
}));

// Task 14: Hosting Preparation
export const hostingPreparationTask = defineTask('hosting-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare documentation for hosting and deployment',
  agent: {
    name: 'deployment-engineer',
    prompt: {
      role: 'DevOps engineer and documentation hosting specialist',
      task: 'Prepare documentation site for hosting and create deployment configuration',
      context: args,
      instructions: [
        'Prepare for specified hosting platform:',
        '  - GitHub Pages: Create gh-pages branch config, CNAME, .nojekyll',
        '  - Netlify: Generate netlify.toml, redirects, headers',
        '  - Vercel: Create vercel.json configuration',
        '  - Read the Docs: Generate .readthedocs.yaml',
        '  - S3/CloudFront: Create deployment script, bucket policy',
        'Optimize for hosting:',
        '  - Minify CSS and JavaScript',
        '  - Compress images',
        '  - Generate static assets',
        '  - Create robots.txt and sitemap.xml',
        'Configure custom domain if specified',
        'Set up redirects for old URLs',
        'Configure caching headers',
        'Enable HTTPS/SSL',
        'Create deployment instructions:',
        '  - Prerequisites and requirements',
        '  - Step-by-step deployment guide',
        '  - Environment variables and secrets',
        '  - CI/CD integration (GitHub Actions, etc.)',
        'Create deployment automation scripts',
        'Generate versioning strategy (latest, stable, version-specific)',
        'Save deployment configuration and scripts'
      ],
      outputFormat: 'JSON with deploymentReady (boolean), platform (string), configFiles (array), deploymentInstructions (string), automationScripts (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentReady', 'platform', 'artifacts'],
      properties: {
        deploymentReady: { type: 'boolean' },
        platform: { type: 'string' },
        configFiles: { type: 'array', items: { type: 'string' } },
        deploymentInstructions: { type: 'string' },
        automationScripts: { type: 'array', items: { type: 'string' } },
        customDomain: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'hosting-preparation']
}));

// Task 15: Final Review Package
export const finalReviewPackageTask = defineTask('final-review-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create final review package',
  agent: {
    name: 'documentation-manager',
    prompt: {
      role: 'documentation project manager',
      task: 'Create comprehensive review package summarizing all documentation deliverables',
      context: args,
      instructions: [
        'Create executive summary:',
        '  - Project overview and objectives',
        '  - Documentation scope and coverage',
        '  - Quality metrics and scores',
        '  - Key deliverables and artifacts',
        'Compile documentation inventory:',
        '  - All generated files organized by type',
        '  - File sizes and formats',
        '  - Access URLs or paths',
        'Create quality scorecard:',
        '  - Coverage metrics with pass/fail status',
        '  - Quality score with breakdown',
        '  - Link validation results',
        '  - Examples coverage',
        '  - Acceptance criteria assessment',
        'Document next steps:',
        '  - Deployment instructions',
        '  - Maintenance recommendations',
        '  - Future improvements',
        '  - Contact information for support',
        'Generate review checklist for stakeholders',
        'Create presentation-ready summary slide/document',
        'Package all artifacts in organized structure',
        'Generate README for review package',
        'Save review package to output directory'
      ],
      outputFormat: 'JSON with packageCreated (boolean), executiveSummary (string), inventory (array), scorecard (object), nextSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packageCreated', 'executiveSummary', 'artifacts'],
      properties: {
        packageCreated: { type: 'boolean' },
        executiveSummary: { type: 'string' },
        inventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              files: { type: 'array' }
            }
          }
        },
        scorecard: {
          type: 'object',
          properties: {
            overallQuality: { type: 'number' },
            coverage: { type: 'number' },
            examplesCoverage: { type: 'number' },
            brokenLinks: { type: 'number' },
            acceptanceMet: { type: 'boolean' }
          }
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sdk', 'review-package']
}));
