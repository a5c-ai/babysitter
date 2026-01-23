/**
 * @process specializations/technical-documentation/docs-as-code-pipeline
 * @description Docs-as-Code CI/CD Pipeline Setup - Implement comprehensive documentation-as-code workflow with version control,
 * automated builds, testing (link checking, linting, spell checking), continuous deployment, and quality gates for modern
 * technical documentation management aligned with software development best practices.
 * @specialization Technical Documentation
 * @category Docs-as-Code
 * @inputs { projectPath: string, repositoryUrl: string, docsPath?: string, platform?: string, generator?: string, deploymentTarget?: string }
 * @outputs { success: boolean, pipelineConfig: object, qualityScore: number, deploymentUrl: string, artifacts: string[] }
 *
 * @example
 * const result = await orchestrate('specializations/technical-documentation/docs-as-code-pipeline', {
 *   projectPath: '/path/to/project',
 *   repositoryUrl: 'https://github.com/org/repo',
 *   docsPath: 'docs/',
 *   platform: 'github-actions',
 *   generator: 'docusaurus',
 *   deploymentTarget: 'github-pages',
 *   qualityGates: {
 *     brokenLinks: 0,
 *     spellErrors: 5,
 *     styleViolations: 10,
 *     accessibility: 90
 *   }
 * });
 *
 * @references
 * - Docs-as-Code: https://www.writethedocs.org/guide/docs-as-code/
 * - Documentation CI/CD: https://www.docslikecode.com/
 * - Vale Style Linter: https://vale.sh/
 * - Docusaurus: https://docusaurus.io/
 * - MkDocs: https://www.mkdocs.org/
 * - Write the Docs: https://www.writethedocs.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectPath,
    repositoryUrl,
    docsPath = 'docs/',
    platform = 'github-actions', // 'github-actions', 'gitlab-ci', 'jenkins', 'azure-devops'
    generator = 'docusaurus', // 'docusaurus', 'mkdocs', 'vuepress', 'hugo', 'jekyll', 'sphinx'
    deploymentTarget = 'github-pages', // 'github-pages', 'netlify', 'vercel', 's3', 'azure-static'
    qualityGates = {
      brokenLinks: 0,
      spellErrors: 5,
      styleViolations: 10,
      accessibility: 90,
      buildTime: 300
    },
    validation = {
      linkChecking: true,
      spellChecking: true,
      styleLinting: true,
      accessibilityAudit: true,
      codeExampleTesting: true
    },
    styleGuide = {
      enabled: true,
      preset: 'google', // 'google', 'microsoft', 'custom'
      customRules: []
    },
    versioningStrategy = 'semver', // 'semver', 'date-based', 'none'
    searchProvider = 'algolia', // 'algolia', 'lunr', 'elasticsearch', 'none'
    analytics = {
      enabled: true,
      provider: 'google-analytics'
    },
    notificationChannels = ['slack', 'email'],
    outputDir = 'docs-as-code-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let pipelineConfig = {};
  let qualityScore = 0;
  let deploymentUrl = '';

  ctx.log('info', `Starting Docs-as-Code CI/CD Pipeline Setup for ${projectPath}`);
  ctx.log('info', `Generator: ${generator}, Platform: ${platform}, Target: ${deploymentTarget}`);

  // ============================================================================
  // PHASE 1: DOCUMENTATION AUDIT AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Auditing existing documentation structure and quality');

  const documentationAudit = await ctx.task(auditDocumentationTask, {
    projectPath,
    docsPath,
    repositoryUrl,
    outputDir
  });

  if (!documentationAudit.success) {
    return {
      success: false,
      error: 'Failed to audit documentation',
      details: documentationAudit,
      metadata: {
        processId: 'specializations/technical-documentation/docs-as-code-pipeline',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...documentationAudit.artifacts);

  // Quality Gate: Documentation baseline assessment
  if (documentationAudit.maturityScore < 40) {
    await ctx.breakpoint({
      question: `Documentation maturity score: ${documentationAudit.maturityScore}/100. Low baseline detected. Review audit findings and approve to proceed with setup?`,
      title: 'Documentation Maturity Assessment',
      context: {
        runId: ctx.runId,
        maturityScore: documentationAudit.maturityScore,
        issues: documentationAudit.issues,
        recommendations: documentationAudit.recommendations,
        files: documentationAudit.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: DOCUMENTATION GENERATOR SETUP
  // ============================================================================

  ctx.log('info', `Phase 2: Setting up ${generator} documentation generator`);

  const generatorSetup = await ctx.task(setupDocGeneratorTask, {
    projectPath,
    docsPath,
    generator,
    versioningStrategy,
    searchProvider,
    analytics,
    audit: documentationAudit,
    outputDir
  });

  artifacts.push(...generatorSetup.artifacts);

  // Quality Gate: Generator configuration validation
  if (!generatorSetup.configurationValid) {
    await ctx.breakpoint({
      question: `Documentation generator configuration has ${generatorSetup.validationErrors.length} error(s). Review and fix configuration?`,
      title: 'Generator Configuration Validation',
      context: {
        runId: ctx.runId,
        generator,
        errors: generatorSetup.validationErrors,
        warnings: generatorSetup.validationWarnings,
        files: generatorSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: STYLE GUIDE AND LINTING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring style guide and documentation linting');

  const styleGuideSetup = await ctx.task(setupStyleGuideTask, {
    projectPath,
    docsPath,
    styleGuide,
    validation,
    outputDir
  });

  artifacts.push(...styleGuideSetup.artifacts);

  // Quality Gate: Style guide setup
  await ctx.breakpoint({
    question: `Style guide configured with ${styleGuideSetup.rulesCount} rules (${styleGuideSetup.preset} preset). Review style configuration and approve?`,
    title: 'Style Guide Configuration Review',
    context: {
      runId: ctx.runId,
      preset: styleGuideSetup.preset,
      rulesCount: styleGuideSetup.rulesCount,
      customRules: styleGuideSetup.customRules,
      validationTools: styleGuideSetup.tools,
      files: styleGuideSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: PARALLEL CI/CD PIPELINE STAGES SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up CI/CD pipeline stages in parallel');

  // Parallelize pipeline stage configuration
  const [
    prValidationConfig,
    buildStageConfig,
    testStageConfig,
    deploymentStageConfig
  ] = await ctx.parallel.all([
    () => ctx.task(configurePrValidationStageTask, {
      projectPath,
      docsPath,
      platform,
      validation,
      styleGuide,
      qualityGates,
      outputDir
    }),
    () => ctx.task(configureBuildStageTask, {
      projectPath,
      docsPath,
      generator,
      platform,
      qualityGates,
      outputDir
    }),
    () => ctx.task(configureTestStageTask, {
      projectPath,
      docsPath,
      generator,
      platform,
      validation,
      qualityGates,
      outputDir
    }),
    () => ctx.task(configureDeploymentStageTask, {
      projectPath,
      docsPath,
      generator,
      platform,
      deploymentTarget,
      versioningStrategy,
      outputDir
    })
  ]);

  artifacts.push(
    ...prValidationConfig.artifacts,
    ...buildStageConfig.artifacts,
    ...testStageConfig.artifacts,
    ...deploymentStageConfig.artifacts
  );

  ctx.log('info', 'All CI/CD pipeline stages configured');

  // ============================================================================
  // PHASE 5: VALIDATION AND TESTING TOOLS INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Integrating validation and testing tools');

  // Parallelize tool integration
  const [
    linkCheckerSetup,
    spellCheckerSetup,
    styleLinterSetup,
    accessibilitySetup
  ] = await ctx.parallel.all([
    () => validation.linkChecking ? ctx.task(integrateLinkCheckerTask, {
      projectPath,
      docsPath,
      generator,
      platform,
      qualityGates,
      outputDir
    }) : Promise.resolve({ success: true, artifacts: [], skipped: true }),
    () => validation.spellChecking ? ctx.task(integrateSpellCheckerTask, {
      projectPath,
      docsPath,
      platform,
      styleGuide,
      qualityGates,
      outputDir
    }) : Promise.resolve({ success: true, artifacts: [], skipped: true }),
    () => validation.styleLinting ? ctx.task(integrateStyleLinterTask, {
      projectPath,
      docsPath,
      platform,
      styleGuide,
      qualityGates,
      outputDir
    }) : Promise.resolve({ success: true, artifacts: [], skipped: true }),
    () => validation.accessibilityAudit ? ctx.task(integrateAccessibilityTask, {
      projectPath,
      docsPath,
      generator,
      platform,
      qualityGates,
      outputDir
    }) : Promise.resolve({ success: true, artifacts: [], skipped: true })
  ]);

  if (!linkCheckerSetup.skipped) artifacts.push(...linkCheckerSetup.artifacts);
  if (!spellCheckerSetup.skipped) artifacts.push(...spellCheckerSetup.artifacts);
  if (!styleLinterSetup.skipped) artifacts.push(...styleLinterSetup.artifacts);
  if (!accessibilitySetup.skipped) artifacts.push(...accessibilitySetup.artifacts);

  ctx.log('info', 'Validation and testing tools integrated');

  // ============================================================================
  // PHASE 6: VERSIONING AND RELEASE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up documentation versioning and release management');

  const versioningSetup = await ctx.task(setupVersioningTask, {
    projectPath,
    docsPath,
    generator,
    versioningStrategy,
    platform,
    outputDir
  });

  artifacts.push(...versioningSetup.artifacts);

  // ============================================================================
  // PHASE 7: SEARCH AND ANALYTICS INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating search and analytics');

  const [searchSetup, analyticsSetup] = await ctx.parallel.all([
    () => searchProvider !== 'none' ? ctx.task(integrateSearchTask, {
      projectPath,
      docsPath,
      generator,
      searchProvider,
      deploymentTarget,
      outputDir
    }) : Promise.resolve({ success: true, artifacts: [], skipped: true }),
    () => analytics.enabled ? ctx.task(integrateAnalyticsTask, {
      projectPath,
      docsPath,
      generator,
      analytics,
      deploymentTarget,
      outputDir
    }) : Promise.resolve({ success: true, artifacts: [], skipped: true })
  ]);

  if (!searchSetup.skipped) artifacts.push(...searchSetup.artifacts);
  if (!analyticsSetup.skipped) artifacts.push(...analyticsSetup.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY GATES IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing quality gates');

  const qualityGatesImpl = await ctx.task(implementQualityGatesTask, {
    projectPath,
    docsPath,
    platform,
    qualityGates,
    validation,
    pipelineStages: {
      prValidation: prValidationConfig,
      build: buildStageConfig,
      test: testStageConfig,
      deployment: deploymentStageConfig
    },
    outputDir
  });

  artifacts.push(...qualityGatesImpl.artifacts);

  // Quality Gate: Quality gates configuration
  if (qualityGatesImpl.gatesConfigured < qualityGatesImpl.totalGates) {
    await ctx.breakpoint({
      question: `${qualityGatesImpl.gatesConfigured}/${qualityGatesImpl.totalGates} quality gates configured. Review missing gates and approve?`,
      title: 'Quality Gates Configuration Review',
      context: {
        runId: ctx.runId,
        configured: qualityGatesImpl.configuredGates,
        missing: qualityGatesImpl.missingGates,
        blocking: qualityGatesImpl.blockingGates,
        files: qualityGatesImpl.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: PIPELINE ASSEMBLY AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Assembling complete CI/CD pipeline configuration');

  const pipelineAssembly = await ctx.task(assemblePipelineTask, {
    projectPath,
    docsPath,
    platform,
    generator,
    deploymentTarget,
    stages: {
      prValidation: prValidationConfig,
      build: buildStageConfig,
      test: testStageConfig,
      deployment: deploymentStageConfig
    },
    tooling: {
      linkChecker: linkCheckerSetup,
      spellChecker: spellCheckerSetup,
      styleLinter: styleLinterSetup,
      accessibility: accessibilitySetup,
      search: searchSetup,
      analytics: analyticsSetup
    },
    qualityGates: qualityGatesImpl,
    versioning: versioningSetup,
    outputDir
  });

  artifacts.push(...pipelineAssembly.artifacts);
  pipelineConfig = pipelineAssembly.pipelineConfig;

  // Quality Gate: Pipeline syntax validation
  if (!pipelineAssembly.syntaxValid) {
    await ctx.breakpoint({
      question: `Pipeline configuration has syntax errors: ${pipelineAssembly.syntaxErrors.join(', ')}. Review and fix?`,
      title: 'Pipeline Syntax Validation Failed',
      context: {
        runId: ctx.runId,
        errors: pipelineAssembly.syntaxErrors,
        warnings: pipelineAssembly.syntaxWarnings,
        files: pipelineAssembly.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: INITIAL PIPELINE TEST RUN
  // ============================================================================

  ctx.log('info', 'Phase 10: Running initial pipeline test');

  const initialTestRun = await ctx.task(runInitialPipelineTestTask, {
    projectPath,
    docsPath,
    platform,
    generator,
    pipelineConfig,
    validation,
    outputDir
  });

  artifacts.push(...initialTestRun.artifacts);

  // Quality Gate: Initial test run results
  if (!initialTestRun.success) {
    await ctx.breakpoint({
      question: `Initial pipeline test failed: ${initialTestRun.failureReason}. Review failures and retry?`,
      title: 'Initial Pipeline Test Failed',
      context: {
        runId: ctx.runId,
        failureReason: initialTestRun.failureReason,
        failedStages: initialTestRun.failedStages,
        errors: initialTestRun.errors,
        logs: initialTestRun.logs,
        files: initialTestRun.artifacts.map(a => ({ path: a.path, format: a.format || 'text', label: a.label }))
      }
    });

    // Retry after fixes
    const retryTestRun = await ctx.task(runInitialPipelineTestTask, {
      projectPath,
      docsPath,
      platform,
      generator,
      pipelineConfig,
      validation,
      outputDir,
      retry: true
    });

    if (!retryTestRun.success) {
      return {
        success: false,
        error: 'Initial pipeline test failed after retry',
        details: retryTestRun,
        artifacts,
        metadata: {
          processId: 'specializations/technical-documentation/docs-as-code-pipeline',
          timestamp: startTime
        }
      };
    }

    artifacts.push(...retryTestRun.artifacts);
  }

  // ============================================================================
  // PHASE 11: DOCUMENTATION BUILD AND QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Building documentation and validating quality');

  const documentationBuild = await ctx.task(buildDocumentationTask, {
    projectPath,
    docsPath,
    generator,
    pipelineConfig,
    outputDir
  });

  artifacts.push(...documentationBuild.artifacts);

  if (!documentationBuild.success) {
    return {
      success: false,
      error: 'Documentation build failed',
      details: documentationBuild,
      artifacts,
      metadata: {
        processId: 'specializations/technical-documentation/docs-as-code-pipeline',
        timestamp: startTime
      }
    };
  }

  // Run comprehensive quality validation
  const qualityValidation = await ctx.task(validateDocumentationQualityTask, {
    projectPath,
    docsPath,
    generator,
    buildOutput: documentationBuild.outputPath,
    validation,
    qualityGates,
    audit: documentationAudit,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);
  qualityScore = qualityValidation.overallScore;

  // Quality Gate: Documentation quality threshold
  if (qualityScore < 70) {
    await ctx.breakpoint({
      question: `Documentation quality score: ${qualityScore}/100. Below 70% threshold. Review quality issues and iterate?`,
      title: 'Documentation Quality Gate',
      context: {
        runId: ctx.runId,
        qualityScore,
        issues: qualityValidation.issues,
        brokenLinks: qualityValidation.brokenLinks,
        spellErrors: qualityValidation.spellErrors,
        styleViolations: qualityValidation.styleViolations,
        accessibilityScore: qualityValidation.accessibilityScore,
        recommendations: qualityValidation.recommendations,
        files: qualityValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'html', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 12: DEPLOYMENT CONFIGURATION AND TEST DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Configuring deployment and running test deployment');

  const deploymentConfig = await ctx.task(configureDeploymentTask, {
    projectPath,
    docsPath,
    generator,
    deploymentTarget,
    buildOutput: documentationBuild.outputPath,
    versioningStrategy,
    pipelineConfig,
    outputDir
  });

  artifacts.push(...deploymentConfig.artifacts);

  // Run test deployment to staging/preview
  const testDeployment = await ctx.task(runTestDeploymentTask, {
    projectPath,
    docsPath,
    generator,
    deploymentTarget,
    deploymentConfig: deploymentConfig.config,
    buildOutput: documentationBuild.outputPath,
    outputDir
  });

  artifacts.push(...testDeployment.artifacts);
  deploymentUrl = testDeployment.previewUrl || testDeployment.stagingUrl || '';

  // Quality Gate: Test deployment verification
  if (!testDeployment.success) {
    await ctx.breakpoint({
      question: `Test deployment failed: ${testDeployment.error}. Review deployment logs and retry?`,
      title: 'Test Deployment Failed',
      context: {
        runId: ctx.runId,
        error: testDeployment.error,
        logs: testDeployment.logs,
        files: testDeployment.artifacts.map(a => ({ path: a.path, format: a.format || 'text', label: a.label }))
      }
    });
  } else {
    await ctx.breakpoint({
      question: `Test deployment successful! Preview URL: ${deploymentUrl}. Review deployed documentation and approve production setup?`,
      title: 'Test Deployment Verification',
      context: {
        runId: ctx.runId,
        previewUrl: deploymentUrl,
        deploymentTarget,
        buildTime: testDeployment.buildTime,
        files: testDeployment.artifacts.map(a => ({ path: a.path, format: a.format || 'html', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 13: DOCUMENTATION AND TRAINING MATERIALS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating pipeline documentation and training materials');

  const documentationGeneration = await ctx.task(generatePipelineDocumentationTask, {
    projectPath,
    docsPath,
    platform,
    generator,
    deploymentTarget,
    pipelineConfig,
    qualityGates,
    validation,
    tooling: {
      linkChecker: linkCheckerSetup,
      spellChecker: spellCheckerSetup,
      styleLinter: styleLinterSetup,
      accessibility: accessibilitySetup
    },
    styleGuide,
    versioningStrategy,
    outputDir
  });

  artifacts.push(...documentationGeneration.artifacts);

  // ============================================================================
  // PHASE 14: NOTIFICATION AND MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 14: Setting up notifications and monitoring');

  const notificationSetup = await ctx.task(setupNotificationsTask, {
    projectPath,
    platform,
    notificationChannels,
    qualityGates,
    outputDir
  });

  artifacts.push(...notificationSetup.artifacts);

  // ============================================================================
  // PHASE 15: FINAL REVIEW AND SCORE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Final review and pipeline score calculation');

  const finalReview = await ctx.task(performFinalReviewTask, {
    projectPath,
    docsPath,
    platform,
    generator,
    deploymentTarget,
    audit: documentationAudit,
    pipelineConfig,
    qualityScore,
    qualityValidation,
    testDeployment,
    artifacts,
    outputDir
  });

  const pipelineScore = finalReview.pipelineScore;

  // Final breakpoint for approval
  await ctx.breakpoint({
    question: `Docs-as-Code CI/CD pipeline setup complete! Quality score: ${qualityScore}/100, Pipeline score: ${pipelineScore}/100. Review final report and approve for production?`,
    title: 'Final Pipeline Review',
    context: {
      runId: ctx.runId,
      qualityScore,
      pipelineScore,
      deploymentUrl,
      pipelineConfig: `${outputDir}/pipeline-config.${platform === 'github-actions' ? 'yml' : 'yaml'}`,
      summary: finalReview.summary,
      strengths: finalReview.strengths,
      recommendations: finalReview.recommendations,
      files: [
        { path: `${outputDir}/final-report.md`, format: 'markdown', label: 'Final Report' },
        { path: `${outputDir}/pipeline-config.${platform === 'github-actions' ? 'yml' : 'yaml'}`, format: 'yaml', label: 'Pipeline Configuration' },
        { path: `${outputDir}/quality-metrics.json`, format: 'json', label: 'Quality Metrics' },
        { path: `${outputDir}/documentation-guide.md`, format: 'markdown', label: 'Documentation Guide' }
      ]
    }
  });

  // ============================================================================
  // RETURN RESULTS
  // ============================================================================

  const duration = ctx.now() - startTime;

  return {
    success: true,
    pipelineConfig: {
      platform,
      generator,
      deploymentTarget,
      stages: {
        prValidation: prValidationConfig.stageConfig,
        build: buildStageConfig.stageConfig,
        test: testStageConfig.stageConfig,
        deployment: deploymentStageConfig.stageConfig
      },
      qualityGates: qualityGatesImpl.gates,
      validation: {
        linkChecking: !linkCheckerSetup.skipped,
        spellChecking: !spellCheckerSetup.skipped,
        styleLinting: !styleLinterSetup.skipped,
        accessibilityAudit: !accessibilitySetup.skipped
      },
      versioning: versioningSetup.config,
      search: !searchSetup.skipped ? searchSetup.config : null,
      analytics: !analyticsSetup.skipped ? analyticsSetup.config : null,
      notifications: notificationSetup.config
    },
    qualityScore,
    pipelineScore,
    deploymentUrl,
    artifacts: artifacts.map(a => a.path || a),
    metrics: {
      documentationMaturity: documentationAudit.maturityScore,
      qualityScore,
      pipelineScore,
      brokenLinks: qualityValidation.brokenLinks,
      spellErrors: qualityValidation.spellErrors,
      styleViolations: qualityValidation.styleViolations,
      accessibilityScore: qualityValidation.accessibilityScore,
      buildTime: documentationBuild.buildTime,
      deploymentTime: testDeployment.buildTime
    },
    documentation: {
      pipelineGuide: `${outputDir}/documentation-guide.md`,
      contributionGuide: `${outputDir}/contribution-guide.md`,
      styleGuide: `${outputDir}/style-guide.md`,
      troubleshooting: `${outputDir}/troubleshooting.md`
    },
    recommendations: finalReview.recommendations,
    nextSteps: finalReview.nextSteps,
    metadata: {
      processId: 'specializations/technical-documentation/docs-as-code-pipeline',
      timestamp: startTime,
      duration,
      generator,
      platform,
      deploymentTarget
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Phase 1: Audit existing documentation
 */
export const auditDocumentationTask = defineTask('audit-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit Documentation Structure and Quality',
  agent: {
    name: 'documentation-auditor',
    prompt: {
      role: 'technical documentation specialist and information architect',
      task: 'Audit existing documentation for structure, quality, completeness, and docs-as-code readiness',
      context: args,
      instructions: [
        'Analyze documentation directory structure and organization',
        'Assess current documentation format and tooling',
        'Evaluate documentation completeness and coverage',
        'Check for broken links, outdated content, and quality issues',
        'Assess docs-as-code readiness (version control, automation potential)',
        'Identify documentation gaps and missing content',
        'Evaluate information architecture and navigation',
        'Check for consistency in formatting and style',
        'Calculate documentation maturity score (0-100)',
        'Provide recommendations for improvement and prioritized action items'
      ],
      outputFormat: 'JSON with success, maturityScore, structure, format, completeness, issues, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maturityScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maturityScore: { type: 'number', minimum: 0, maximum: 100 },
        structure: { type: 'object' },
        format: { type: 'string' },
        completeness: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'documentation']
}));

/**
 * Phase 2: Setup documentation generator
 */
export const setupDocGeneratorTask = defineTask('setup-doc-generator', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup ${args.generator} Documentation Generator`,
  agent: {
    name: 'generator-setup-specialist',
    prompt: {
      role: 'documentation engineer specializing in static site generators',
      task: `Setup and configure ${args.generator} documentation generator with best practices`,
      context: args,
      instructions: [
        `Initialize ${args.generator} in the project`,
        'Create documentation site configuration file',
        'Setup navigation and sidebar structure',
        'Configure theme and styling',
        'Setup versioning strategy if specified',
        'Configure search integration',
        'Setup analytics integration',
        'Create initial landing page and documentation structure',
        'Configure build settings and optimization',
        'Validate configuration for correctness',
        'Generate setup documentation and quickstart guide'
      ],
      outputFormat: 'JSON with success, configurationValid, configPath, validationErrors, validationWarnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'configurationValid', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        configurationValid: { type: 'boolean' },
        configPath: { type: 'string' },
        validationErrors: { type: 'array', items: { type: 'string' } },
        validationWarnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'generator-setup', args.generator]
}));

/**
 * Phase 3: Setup style guide and linting
 */
export const setupStyleGuideTask = defineTask('setup-style-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup Style Guide and Documentation Linting',
  agent: {
    name: 'style-guide-specialist',
    prompt: {
      role: 'technical writing coach and style guide expert',
      task: 'Setup documentation style guide and configure automated linting tools',
      context: args,
      instructions: [
        `Configure Vale style linter with ${args.styleGuide.preset} preset`,
        'Create or customize Vale configuration (.vale.ini)',
        'Setup vocabulary and terminology files',
        'Configure custom style rules if specified',
        'Setup markdownlint configuration',
        'Configure spell checking (cSpell or similar)',
        'Create style guide documentation',
        'Document accepted terminology and preferred phrasings',
        'Configure CI integration for linting',
        'Provide examples of good and bad documentation patterns',
        'Generate contributor guidelines for documentation'
      ],
      outputFormat: 'JSON with success, preset, rulesCount, customRules, tools, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'preset', 'rulesCount', 'tools', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        preset: { type: 'string' },
        rulesCount: { type: 'number' },
        customRules: { type: 'array', items: { type: 'string' } },
        tools: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'style-guide', 'linting']
}));

/**
 * Phase 4: Configure PR validation stage
 */
export const configurePrValidationStageTask = defineTask('configure-pr-validation-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Pull Request Validation Stage',
  agent: {
    name: 'ci-pipeline-engineer',
    prompt: {
      role: 'DevOps engineer specializing in CI/CD pipelines',
      task: 'Configure automated pull request validation stage for documentation changes',
      context: args,
      instructions: [
        'Create PR validation workflow/job configuration',
        'Setup markdown linting (markdownlint)',
        'Configure style linting (Vale)',
        'Setup spell checking',
        'Configure link checking (basic, pre-build)',
        'Setup changed files detection',
        'Configure fast feedback for PR authors',
        'Add PR comment automation with lint results',
        'Setup status checks and required approvals',
        'Configure validation to run on every PR',
        'Optimize for speed (parallel checks, caching)',
        'Document PR validation requirements'
      ],
      outputFormat: 'JSON with success, stageConfig, checks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'stageConfig', 'checks', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stageConfig: { type: 'object' },
        checks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ci-pipeline', 'pr-validation']
}));

/**
 * Phase 4: Configure build stage
 */
export const configureBuildStageTask = defineTask('configure-build-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Documentation Build Stage',
  agent: {
    name: 'build-automation-engineer',
    prompt: {
      role: 'build automation engineer specializing in documentation pipelines',
      task: 'Configure automated documentation build stage with optimization',
      context: args,
      instructions: [
        `Create build workflow/job for ${args.generator}`,
        'Setup Node.js/Python environment based on generator',
        'Configure dependency caching for faster builds',
        'Setup build command and arguments',
        'Configure build artifact generation',
        'Setup build time monitoring and timeout',
        'Configure build failure notifications',
        'Setup incremental builds if supported',
        'Configure build optimization (parallelization, caching)',
        'Setup build artifact retention and storage',
        'Add build success/failure status reporting',
        'Document build process and troubleshooting'
      ],
      outputFormat: 'JSON with success, stageConfig, buildCommand, caching, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'stageConfig', 'buildCommand', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stageConfig: { type: 'object' },
        buildCommand: { type: 'string' },
        caching: { type: 'boolean' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ci-pipeline', 'build']
}));

/**
 * Phase 4: Configure test stage
 */
export const configureTestStageTask = defineTask('configure-test-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Documentation Testing Stage',
  agent: {
    name: 'test-automation-engineer',
    prompt: {
      role: 'QA automation engineer specializing in documentation testing',
      task: 'Configure comprehensive documentation testing stage',
      context: args,
      instructions: [
        'Create test workflow/job configuration',
        'Setup comprehensive link checking (markdown-link-check, linkinator)',
        'Configure spell checking with custom dictionary',
        'Setup style linting with Vale',
        'Configure accessibility testing (Pa11y, Lighthouse)',
        'Setup code example validation if applicable',
        'Configure screenshot/visual testing if needed',
        'Setup test parallelization for speed',
        'Configure test result reporting and artifacts',
        'Setup test failure threshold enforcement',
        'Add detailed test failure reporting',
        'Document testing strategy and tools'
      ],
      outputFormat: 'JSON with success, stageConfig, testTypes, parallelization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'stageConfig', 'testTypes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stageConfig: { type: 'object' },
        testTypes: { type: 'array', items: { type: 'string' } },
        parallelization: { type: 'boolean' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ci-pipeline', 'testing']
}));

/**
 * Phase 4: Configure deployment stage
 */
export const configureDeploymentStageTask = defineTask('configure-deployment-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Documentation Deployment Stage',
  agent: {
    name: 'deployment-engineer',
    prompt: {
      role: 'DevOps engineer specializing in continuous deployment',
      task: `Configure automated deployment to ${args.deploymentTarget}`,
      context: args,
      instructions: [
        `Create deployment workflow/job for ${args.deploymentTarget}`,
        'Configure deployment triggers (branch-based, tag-based)',
        'Setup staging/preview deployments for PRs',
        'Configure production deployment on main/master',
        'Setup deployment credentials and secrets',
        'Configure versioning and version switcher',
        'Setup deployment rollback capability',
        'Configure deployment notifications',
        'Setup deployment verification checks',
        'Configure CDN cache invalidation if applicable',
        'Add deployment status reporting',
        'Document deployment process and requirements'
      ],
      outputFormat: 'JSON with success, stageConfig, triggers, environments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'stageConfig', 'triggers', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stageConfig: { type: 'object' },
        triggers: { type: 'array', items: { type: 'string' } },
        environments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ci-pipeline', 'deployment']
}));

/**
 * Phase 5: Integrate link checker
 */
export const integrateLinkCheckerTask = defineTask('integrate-link-checker', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Link Checking Tool',
  agent: {
    name: 'link-checker-specialist',
    prompt: {
      role: 'documentation quality engineer',
      task: 'Integrate and configure automated link checking',
      context: args,
      instructions: [
        'Choose and configure link checking tool (markdown-link-check, linkinator, or lychee)',
        'Create link checking configuration file',
        'Configure link patterns to check (internal, external, anchors)',
        'Setup exclusions for known false positives',
        'Configure retry logic for external links',
        'Setup timeout and rate limiting',
        'Configure link check reporting',
        'Add CI integration script',
        'Setup failure threshold enforcement',
        'Configure caching for external link checks',
        'Document link checking configuration'
      ],
      outputFormat: 'JSON with success, tool, config, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tool', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        tool: { type: 'string' },
        config: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'validation', 'link-checking']
}));

/**
 * Phase 5: Integrate spell checker
 */
export const integrateSpellCheckerTask = defineTask('integrate-spell-checker', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Spell Checking Tool',
  agent: {
    name: 'spell-checker-specialist',
    prompt: {
      role: 'documentation quality engineer',
      task: 'Integrate and configure automated spell checking',
      context: args,
      instructions: [
        'Configure spell checker (cSpell or similar)',
        'Create cSpell configuration file',
        'Setup custom dictionaries (technical terms, product names, etc.)',
        'Configure language and locale settings',
        'Setup file patterns to check',
        'Configure exclusions (code blocks, URLs, etc.)',
        'Setup CI integration script',
        'Configure spell check reporting',
        'Setup failure threshold',
        'Create documentation for adding words to dictionary',
        'Document spell checking workflow'
      ],
      outputFormat: 'JSON with success, tool, dictionaries, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tool', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        tool: { type: 'string' },
        dictionaries: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'validation', 'spell-checking']
}));

/**
 * Phase 5: Integrate style linter
 */
export const integrateStyleLinterTask = defineTask('integrate-style-linter', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Style Linting Tool (Vale)',
  agent: {
    name: 'style-linter-specialist',
    prompt: {
      role: 'technical writing coach',
      task: 'Integrate and configure Vale style linter for documentation',
      context: args,
      instructions: [
        'Configure Vale linter with .vale.ini',
        'Setup style packages (Google, Microsoft, or custom)',
        'Create or customize vocabulary files',
        'Configure rule severity levels',
        'Setup file patterns to lint',
        'Configure exclusions',
        'Setup CI integration script',
        'Configure lint result reporting',
        'Setup failure threshold',
        'Create style guide documentation referencing Vale rules',
        'Document linting workflow and how to fix issues'
      ],
      outputFormat: 'JSON with success, styles, vocabularyCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'styles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        styles: { type: 'array', items: { type: 'string' } },
        vocabularyCount: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'validation', 'style-linting']
}));

/**
 * Phase 5: Integrate accessibility testing
 */
export const integrateAccessibilityTask = defineTask('integrate-accessibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Accessibility Testing',
  agent: {
    name: 'accessibility-specialist',
    prompt: {
      role: 'accessibility engineer',
      task: 'Integrate automated accessibility testing for documentation site',
      context: args,
      instructions: [
        'Configure accessibility testing tool (Pa11y, axe, or Lighthouse)',
        'Create accessibility testing configuration',
        'Setup WCAG compliance level (AA recommended)',
        'Configure pages to test',
        'Setup accessibility standard rules',
        'Configure CI integration',
        'Setup accessibility score threshold',
        'Configure detailed reporting',
        'Add remediation guidance for common issues',
        'Create accessibility testing documentation',
        'Document accessibility best practices for contributors'
      ],
      outputFormat: 'JSON with success, tool, wcagLevel, threshold, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tool', 'threshold', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        tool: { type: 'string' },
        wcagLevel: { type: 'string' },
        threshold: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'validation', 'accessibility']
}));

/**
 * Phase 6: Setup versioning
 */
export const setupVersioningTask = defineTask('setup-versioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup Documentation Versioning',
  agent: {
    name: 'versioning-specialist',
    prompt: {
      role: 'documentation engineer',
      task: 'Setup documentation versioning and version management',
      context: args,
      instructions: [
        `Configure ${args.versioningStrategy} versioning strategy`,
        'Setup version switcher UI component',
        'Configure versioned documentation storage',
        'Create version tagging workflow',
        'Setup version release process',
        'Configure version deprecation notices',
        'Setup latest/stable version aliasing',
        'Create version migration guides',
        'Configure version-specific search',
        'Document versioning process for maintainers',
        'Create user guide for navigating versions'
      ],
      outputFormat: 'JSON with success, strategy, config, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'strategy', 'config', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        strategy: { type: 'string' },
        config: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning']
}));

/**
 * Phase 7: Integrate search
 */
export const integrateSearchTask = defineTask('integrate-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate ${args.searchProvider} Search`,
  agent: {
    name: 'search-integration-specialist',
    prompt: {
      role: 'documentation platform engineer',
      task: `Integrate ${args.searchProvider} search functionality`,
      context: args,
      instructions: [
        `Setup ${args.searchProvider} search integration`,
        'Configure search indexing',
        'Setup search API keys and credentials (if applicable)',
        'Configure search UI component',
        'Setup search ranking and relevance',
        'Configure search filters and facets',
        'Setup search analytics',
        'Configure incremental index updates',
        'Test search functionality',
        'Document search configuration',
        'Create user guide for search features'
      ],
      outputFormat: 'JSON with success, provider, config, indexing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'provider', 'config', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        provider: { type: 'string' },
        config: { type: 'object' },
        indexing: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search-integration']
}));

/**
 * Phase 7: Integrate analytics
 */
export const integrateAnalyticsTask = defineTask('integrate-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Documentation Analytics',
  agent: {
    name: 'analytics-specialist',
    prompt: {
      role: 'analytics engineer',
      task: 'Integrate analytics tracking for documentation site',
      context: args,
      instructions: [
        `Setup ${args.analytics.provider} analytics`,
        'Configure tracking ID and integration',
        'Setup page view tracking',
        'Configure event tracking (search, navigation, feedback)',
        'Setup custom dimensions (version, section, etc.)',
        'Configure goal tracking',
        'Setup privacy-compliant tracking (GDPR, cookie consent)',
        'Configure analytics dashboard',
        'Document tracked metrics and events',
        'Create analytics review guide for maintainers'
      ],
      outputFormat: 'JSON with success, provider, trackingId, events, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'provider', 'config', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        provider: { type: 'string' },
        trackingId: { type: 'string' },
        config: { type: 'object' },
        events: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics']
}));

/**
 * Phase 8: Implement quality gates
 */
export const implementQualityGatesTask = defineTask('implement-quality-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Quality Gates',
  agent: {
    name: 'quality-gates-engineer',
    prompt: {
      role: 'quality assurance engineer',
      task: 'Implement comprehensive quality gates for documentation pipeline',
      context: args,
      instructions: [
        'Define quality gate criteria based on qualityGates configuration',
        'Implement broken link threshold enforcement',
        'Implement spell error threshold enforcement',
        'Implement style violation threshold enforcement',
        'Implement accessibility score threshold enforcement',
        'Implement build time threshold enforcement',
        'Configure blocking vs warning gates',
        'Setup quality gate status reporting',
        'Configure quality gate bypass mechanism (emergency only)',
        'Document quality gate requirements',
        'Create troubleshooting guide for gate failures'
      ],
      outputFormat: 'JSON with success, totalGates, gatesConfigured, configuredGates, missingGates, blockingGates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalGates', 'gatesConfigured', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalGates: { type: 'number' },
        gatesConfigured: { type: 'number' },
        configuredGates: { type: 'array', items: { type: 'string' } },
        missingGates: { type: 'array', items: { type: 'string' } },
        blockingGates: { type: 'array', items: { type: 'string' } },
        gates: { type: 'array' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-gates']
}));

/**
 * Phase 9: Assemble complete pipeline
 */
export const assemblePipelineTask = defineTask('assemble-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble Complete CI/CD Pipeline',
  agent: {
    name: 'pipeline-architect',
    prompt: {
      role: 'CI/CD architect',
      task: 'Assemble complete docs-as-code CI/CD pipeline configuration',
      context: args,
      instructions: [
        'Combine all pipeline stages into unified configuration',
        'Ensure proper stage ordering and dependencies',
        'Configure workflow triggers (push, PR, schedule)',
        'Setup environment variables and secrets',
        'Configure job dependencies and conditions',
        'Setup artifact passing between jobs',
        'Configure concurrency and parallelization',
        'Add pipeline-level notifications',
        'Validate pipeline syntax',
        'Generate complete pipeline file',
        'Create pipeline visualization/diagram',
        'Document complete pipeline workflow'
      ],
      outputFormat: 'JSON with success, pipelineConfig, syntaxValid, syntaxErrors, syntaxWarnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineConfig', 'syntaxValid', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineConfig: { type: 'object' },
        syntaxValid: { type: 'boolean' },
        syntaxErrors: { type: 'array', items: { type: 'string' } },
        syntaxWarnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pipeline-assembly']
}));

/**
 * Phase 10: Run initial pipeline test
 */
export const runInitialPipelineTestTask = defineTask('run-initial-pipeline-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Initial Pipeline Test',
  agent: {
    name: 'pipeline-tester',
    prompt: {
      role: 'DevOps engineer',
      task: 'Execute initial test run of the documentation pipeline',
      context: args,
      instructions: [
        'Trigger pipeline test run (local or CI)',
        'Monitor pipeline execution',
        'Check each stage for success/failure',
        'Collect logs and error messages',
        'Verify build artifacts are generated',
        'Check quality gate enforcement',
        'Validate validation tools are running',
        'Verify notifications are sent',
        'Assess overall pipeline health',
        'Identify any failures or issues',
        'Provide detailed failure analysis if failed',
        'Generate test run report'
      ],
      outputFormat: 'JSON with success, failureReason, failedStages, passedStages, errors, logs, buildTime, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        failureReason: { type: 'string' },
        failedStages: { type: 'array', items: { type: 'string' } },
        passedStages: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
        logs: { type: 'string' },
        buildTime: { type: 'number' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pipeline-testing']
}));

/**
 * Phase 11: Build documentation
 */
export const buildDocumentationTask = defineTask('build-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build Documentation Site',
  agent: {
    name: 'documentation-builder',
    prompt: {
      role: 'build engineer',
      task: 'Build documentation site using configured generator',
      context: args,
      instructions: [
        `Execute ${args.generator} build command`,
        'Monitor build process',
        'Capture build logs',
        'Verify build artifacts are generated',
        'Check build output directory',
        'Validate generated HTML/assets',
        'Measure build time',
        'Identify build warnings or errors',
        'Generate build report',
        'Document build output structure'
      ],
      outputFormat: 'JSON with success, outputPath, buildTime, warnings, errors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'outputPath', 'buildTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        outputPath: { type: 'string' },
        buildTime: { type: 'number' },
        warnings: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'build']
}));

/**
 * Phase 11: Validate documentation quality
 */
export const validateDocumentationQualityTask = defineTask('validate-documentation-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Documentation Quality',
  agent: {
    name: 'quality-validator',
    prompt: {
      role: 'documentation quality assurance specialist',
      task: 'Perform comprehensive quality validation of built documentation',
      context: args,
      instructions: [
        'Run link checking on built site',
        'Count broken links',
        'Run spell checking',
        'Count spelling errors',
        'Run style linting',
        'Count style violations',
        'Run accessibility audit',
        'Calculate accessibility score',
        'Validate code examples if present',
        'Check for missing images or assets',
        'Assess overall documentation quality',
        'Calculate quality score (0-100)',
        'Compare against quality gates',
        'Provide detailed issue breakdown',
        'Generate prioritized recommendations for improvement'
      ],
      outputFormat: 'JSON with success, overallScore, brokenLinks, spellErrors, styleViolations, accessibilityScore, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        brokenLinks: { type: 'number' },
        spellErrors: { type: 'number' },
        styleViolations: { type: 'number' },
        accessibilityScore: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality-validation']
}));

/**
 * Phase 12: Configure deployment
 */
export const configureDeploymentTask = defineTask('configure-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Deployment to ${args.deploymentTarget}`,
  agent: {
    name: 'deployment-configurator',
    prompt: {
      role: 'deployment engineer',
      task: `Configure deployment to ${args.deploymentTarget}`,
      context: args,
      instructions: [
        `Create deployment configuration for ${args.deploymentTarget}`,
        'Setup deployment credentials',
        'Configure deployment settings',
        'Setup custom domain if applicable',
        'Configure SSL/TLS certificates',
        'Setup CDN configuration',
        'Configure cache settings',
        'Setup deployment hooks',
        'Configure environment-specific settings',
        'Document deployment configuration',
        'Create deployment troubleshooting guide'
      ],
      outputFormat: 'JSON with success, config, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'config', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        config: { type: 'object' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment-config']
}));

/**
 * Phase 12: Run test deployment
 */
export const runTestDeploymentTask = defineTask('run-test-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Test Deployment',
  agent: {
    name: 'deployment-tester',
    prompt: {
      role: 'deployment engineer',
      task: 'Execute test deployment to staging/preview environment',
      context: args,
      instructions: [
        'Trigger deployment to staging/preview',
        'Monitor deployment progress',
        'Verify deployment success',
        'Capture deployment URL',
        'Verify site is accessible',
        'Run smoke tests on deployed site',
        'Check navigation and links',
        'Verify search functionality',
        'Check responsive design',
        'Measure deployment time',
        'Generate deployment report',
        'Document deployment process'
      ],
      outputFormat: 'JSON with success, previewUrl, stagingUrl, buildTime, error, logs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        previewUrl: { type: 'string' },
        stagingUrl: { type: 'string' },
        buildTime: { type: 'number' },
        error: { type: 'string' },
        logs: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment-testing']
}));

/**
 * Phase 13: Generate pipeline documentation
 */
export const generatePipelineDocumentationTask = defineTask('generate-pipeline-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Pipeline Documentation',
  agent: {
    name: 'documentation-generator',
    prompt: {
      role: 'technical writer',
      task: 'Generate comprehensive documentation for the docs-as-code pipeline',
      context: args,
      instructions: [
        'Create main pipeline documentation guide',
        'Document pipeline architecture and stages',
        'Create contributor guide for documentation',
        'Document style guide and linting rules',
        'Create troubleshooting guide',
        'Document quality gates and requirements',
        'Create deployment guide',
        'Document versioning workflow',
        'Create PR review checklist',
        'Document local development setup',
        'Create maintenance guide',
        'Generate quick reference cards'
      ],
      outputFormat: 'JSON with success, guides, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'guides', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        guides: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation-generation']
}));

/**
 * Phase 14: Setup notifications
 */
export const setupNotificationsTask = defineTask('setup-notifications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup Pipeline Notifications',
  agent: {
    name: 'notification-engineer',
    prompt: {
      role: 'DevOps engineer',
      task: 'Setup notifications for pipeline events',
      context: args,
      instructions: [
        'Configure notification channels (Slack, email, etc.)',
        'Setup build success notifications',
        'Setup build failure notifications',
        'Setup deployment notifications',
        'Setup quality gate failure notifications',
        'Configure notification content and formatting',
        'Setup notification filtering',
        'Configure notification routing by event type',
        'Setup escalation for critical failures',
        'Document notification configuration',
        'Create notification management guide'
      ],
      outputFormat: 'JSON with success, config, channels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'config', 'channels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        config: { type: 'object' },
        channels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'notifications']
}));

/**
 * Phase 15: Perform final review
 */
export const performFinalReviewTask = defineTask('perform-final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform Final Pipeline Review',
  agent: {
    name: 'pipeline-reviewer',
    prompt: {
      role: 'senior DevOps engineer and documentation architect',
      task: 'Conduct final comprehensive review of docs-as-code pipeline setup',
      context: args,
      instructions: [
        'Review pipeline completeness and correctness',
        'Assess pipeline quality and maturity',
        'Calculate overall pipeline score (0-100)',
        'Review documentation quality improvements',
        'Assess automation coverage',
        'Review quality gate effectiveness',
        'Evaluate deployment readiness',
        'Identify pipeline strengths',
        'Identify areas for improvement',
        'Provide actionable recommendations',
        'Suggest next steps and optimizations',
        'Generate executive summary',
        'Create final comprehensive report'
      ],
      outputFormat: 'JSON with success, pipelineScore, summary, strengths, recommendations, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineScore', 'summary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineScore: { type: 'number', minimum: 0, maximum: 100 },
        summary: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'final-review']
}));
