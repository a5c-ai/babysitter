/**
 * @process specializations/technical-documentation/docs-versioning
 * @description Documentation Versioning and Release Coordination - Automated process for managing documentation
 * versions aligned with product releases, including version switcher implementation, semantic versioning,
 * deprecation notices, migration guides, changelog generation, and multi-version hosting setup.
 * @specialization Technical Documentation
 * @category Version Management
 * @inputs { productName: string, currentVersion: string, docsPath: string, platform?: string, versioningStrategy?: string, hostingPlatform?: string, previousVersions?: array, includeDeprecations?: boolean, generateMigrationGuides?: boolean }
 * @outputs { success: boolean, versionsCreated: array, versionSwitcherConfig: object, migrationGuides: array, changelogGenerated: boolean, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/technical-documentation/docs-versioning', {
 *   productName: 'MyAPI',
 *   currentVersion: '2.1.0',
 *   docsPath: './docs',
 *   platform: 'docusaurus', // 'docusaurus', 'mkdocs', 'vuepress', 'custom'
 *   versioningStrategy: 'semantic', // 'semantic', 'date-based', 'major-only'
 *   hostingPlatform: 'github-pages', // 'github-pages', 'netlify', 'vercel', 'readthedocs'
 *   previousVersions: ['2.0.0', '1.9.0', '1.8.0'],
 *   includeDeprecations: true,
 *   generateMigrationGuides: true,
 *   retentionPolicy: { keepMajorVersions: 'all', keepMinorVersions: 2, archiveAfterYears: 2 },
 *   releaseNotes: { source: 'git', format: 'markdown' }
 * });
 *
 * @references
 * - Semantic Versioning: https://semver.org/
 * - Docusaurus Versioning: https://docusaurus.io/docs/versioning
 * - MkDocs Material Versioning: https://squidfunk.github.io/mkdocs-material/setup/setting-up-versioning/
 * - VuePress Versioning: https://vuepress.vuejs.org/guide/deploy.html#versioning
 * - Documentation Version Management: https://documentation.divio.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName,
    currentVersion,
    docsPath,
    platform = 'docusaurus', // 'docusaurus', 'mkdocs', 'vuepress', 'custom'
    versioningStrategy = 'semantic', // 'semantic', 'date-based', 'major-only'
    hostingPlatform = 'github-pages',
    previousVersions = [],
    includeDeprecations = true,
    generateMigrationGuides = true,
    retentionPolicy = {
      keepMajorVersions: 'all', // 'all' or number
      keepMinorVersions: 2, // Keep last N minor versions per major
      archiveAfterYears: 2
    },
    releaseNotes = {
      source: 'git', // 'git', 'changelog', 'manual'
      format: 'markdown'
    },
    versionSwitcher = {
      enabled: true,
      showLatest: true,
      showStable: true,
      customLabels: {}
    },
    outputDir = 'versioned-docs-output',
    acceptanceCriteria = {
      minVersionsCovered: 3,
      requireMigrationGuides: true,
      requireChangelog: true,
      allLinksValid: true
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let versionsCreated = [];
  let versionSwitcherConfig = null;
  let migrationGuides = [];
  let changelogGenerated = false;

  ctx.log('info', `Starting Documentation Versioning for ${productName} v${currentVersion}`);
  ctx.log('info', `Platform: ${platform}, Strategy: ${versioningStrategy}`);
  ctx.log('info', `Previous versions: ${previousVersions.join(', ')}`);

  // ============================================================================
  // PHASE 1: VERSION ANALYSIS AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing version structure and validating inputs');

  const versionAnalysis = await ctx.task(versionAnalysisTask, {
    productName,
    currentVersion,
    previousVersions,
    versioningStrategy,
    docsPath,
    retentionPolicy
  });

  if (!versionAnalysis.valid) {
    return {
      success: false,
      error: 'Version analysis failed',
      details: versionAnalysis.errors,
      metadata: {
        processId: 'specializations/technical-documentation/docs-versioning',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...versionAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Version analysis complete. Detected ${versionAnalysis.totalVersions} versions to manage. Current: ${currentVersion}. Proceed with versioning setup?`,
    title: 'Phase 1: Version Analysis',
    context: {
      runId: ctx.runId,
      phase: 'version-analysis',
      currentVersion,
      previousVersions: versionAnalysis.previousVersions,
      versionScheme: versionAnalysis.versionScheme,
      retentionSuggestions: versionAnalysis.retentionSuggestions,
      files: versionAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 2: DOCUMENTATION SNAPSHOT FOR CURRENT VERSION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating documentation snapshot for current version');

  const docsSnapshot = await ctx.task(docsSnapshotTask, {
    productName,
    currentVersion,
    docsPath,
    platform,
    outputDir
  });

  if (!docsSnapshot.success) {
    return {
      success: false,
      error: 'Failed to create documentation snapshot',
      details: docsSnapshot,
      metadata: {
        processId: 'specializations/technical-documentation/docs-versioning',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...docsSnapshot.artifacts);
  versionsCreated.push({
    version: currentVersion,
    snapshotPath: docsSnapshot.snapshotPath,
    filesCount: docsSnapshot.filesCount
  });

  // ============================================================================
  // PHASE 3: CHANGELOG GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating changelog and release notes');

  const changelogResult = await ctx.task(changelogGenerationTask, {
    productName,
    currentVersion,
    previousVersions,
    releaseNotes,
    docsPath,
    outputDir
  });

  artifacts.push(...changelogResult.artifacts);
  changelogGenerated = changelogResult.generated;

  await ctx.breakpoint({
    question: `Changelog generated with ${changelogResult.entriesCount} entries. Review changelog?`,
    title: 'Phase 3: Changelog Generation',
    context: {
      runId: ctx.runId,
      phase: 'changelog-generation',
      version: currentVersion,
      entriesCount: changelogResult.entriesCount,
      categories: changelogResult.categories,
      files: changelogResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 4: DEPRECATION NOTICES (PARALLEL WITH MIGRATION GUIDES)
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating deprecation notices and migration guides in parallel');

  const [deprecationResult, migrationResult] = await Promise.all([
    includeDeprecations ? ctx.task(deprecationNoticesTask, {
      productName,
      currentVersion,
      previousVersions,
      docsPath,
      changelogResult,
      outputDir
    }) : Promise.resolve({ deprecations: [], artifacts: [] }),

    generateMigrationGuides ? ctx.task(migrationGuidesTask, {
      productName,
      currentVersion,
      previousVersions,
      versionAnalysis,
      changelogResult,
      outputDir
    }) : Promise.resolve({ guides: [], artifacts: [] })
  ]);

  artifacts.push(...deprecationResult.artifacts);
  artifacts.push(...migrationResult.artifacts);
  migrationGuides = migrationResult.guides || [];

  // Quality Gate: Migration guides required
  if (acceptanceCriteria.requireMigrationGuides && migrationGuides.length === 0 && previousVersions.length > 0) {
    await ctx.breakpoint({
      question: `No migration guides generated, but acceptance criteria requires them. Review and decide to generate or skip?`,
      title: 'Migration Guides Quality Gate',
      context: {
        runId: ctx.runId,
        currentVersion,
        previousVersions,
        requiresMigrationGuides: acceptanceCriteria.requireMigrationGuides,
        recommendation: 'Generate migration guides for major version changes'
      }
    });
  }

  // ============================================================================
  // PHASE 5: VERSION STRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up version structure for documentation platform');

  const versionStructure = await ctx.task(versionStructureTask, {
    productName,
    currentVersion,
    previousVersions: versionAnalysis.previousVersions,
    platform,
    docsPath,
    docsSnapshot,
    retentionPolicy,
    outputDir
  });

  if (!versionStructure.success) {
    return {
      success: false,
      error: 'Failed to set up version structure',
      details: versionStructure,
      metadata: {
        processId: 'specializations/technical-documentation/docs-versioning',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...versionStructure.artifacts);

  await ctx.breakpoint({
    question: `Version structure created for ${versionStructure.versionsConfigured} versions. Review structure?`,
    title: 'Phase 5: Version Structure',
    context: {
      runId: ctx.runId,
      phase: 'version-structure',
      platform,
      versionsConfigured: versionStructure.versionsConfigured,
      structure: versionStructure.structure,
      files: versionStructure.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 6: VERSION SWITCHER IMPLEMENTATION
  // ============================================================================

  if (versionSwitcher.enabled) {
    ctx.log('info', 'Phase 6: Implementing version switcher UI');

    const versionSwitcherResult = await ctx.task(versionSwitcherTask, {
      productName,
      currentVersion,
      versions: versionAnalysis.previousVersions,
      platform,
      hostingPlatform,
      versionSwitcher,
      versionStructure,
      outputDir
    });

    artifacts.push(...versionSwitcherResult.artifacts);
    versionSwitcherConfig = versionSwitcherResult.config;

    await ctx.breakpoint({
      question: `Version switcher configured with ${versionSwitcherResult.versionsInSwitcher} versions. Preview switcher UI?`,
      title: 'Phase 6: Version Switcher',
      context: {
        runId: ctx.runId,
        phase: 'version-switcher',
        versionsInSwitcher: versionSwitcherResult.versionsInSwitcher,
        latestVersion: versionSwitcherResult.latestVersion,
        stableVersion: versionSwitcherResult.stableVersion,
        files: versionSwitcherResult.artifacts.map(a => ({ path: a.path, format: a.format || 'html' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: VERSION-SPECIFIC NAVIGATION AND LINKS
  // ============================================================================

  ctx.log('info', 'Phase 7: Updating navigation and cross-version links');

  const navigationUpdate = await ctx.task(navigationUpdateTask, {
    productName,
    currentVersion,
    versions: versionAnalysis.previousVersions,
    platform,
    versionStructure,
    docsSnapshot,
    outputDir
  });

  artifacts.push(...navigationUpdate.artifacts);

  // ============================================================================
  // PHASE 8: VERSION BANNERS AND WARNINGS
  // ============================================================================

  ctx.log('info', 'Phase 8: Adding version banners and deprecation warnings');

  const versionBanners = await ctx.task(versionBannersTask, {
    productName,
    currentVersion,
    versions: versionAnalysis.previousVersions,
    platform,
    deprecations: deprecationResult.deprecations || [],
    versionStructure,
    outputDir
  });

  artifacts.push(...versionBanners.artifacts);

  // ============================================================================
  // PHASE 9: LINK VALIDATION ACROSS VERSIONS (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 9: Validating links across all versions in parallel');

  const versionValidationTasks = versionAnalysis.previousVersions.map(version =>
    () => ctx.task(versionLinkValidationTask, {
      productName,
      version: version.version,
      versionPath: version.path,
      platform,
      outputDir
    })
  );

  const validationResults = await ctx.parallel.all(versionValidationTasks);
  artifacts.push(...validationResults.flatMap(r => r.artifacts));

  const totalBrokenLinks = validationResults.reduce((sum, r) => sum + r.brokenLinksCount, 0);

  // Quality Gate: Link validation
  if (acceptanceCriteria.allLinksValid && totalBrokenLinks > 0) {
    await ctx.breakpoint({
      question: `Found ${totalBrokenLinks} broken links across versions. Acceptance criteria requires all links valid. Review and fix?`,
      title: 'Link Validation Quality Gate',
      context: {
        runId: ctx.runId,
        totalBrokenLinks,
        brokenLinksByVersion: validationResults.map(r => ({
          version: r.version,
          brokenLinks: r.brokenLinksCount,
          brokenLinksList: r.brokenLinks
        })),
        recommendation: 'Fix broken links before deployment',
        files: validationResults.flatMap(r => r.artifacts).map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: VERSION RETENTION AND ARCHIVAL
  // ============================================================================

  ctx.log('info', 'Phase 10: Applying version retention policy and archival');

  const retentionResult = await ctx.task(versionRetentionTask, {
    productName,
    versions: versionAnalysis.previousVersions,
    retentionPolicy,
    platform,
    outputDir
  });

  artifacts.push(...retentionResult.artifacts);

  if (retentionResult.versionsArchived.length > 0) {
    await ctx.breakpoint({
      question: `${retentionResult.versionsArchived.length} version(s) marked for archival: ${retentionResult.versionsArchived.join(', ')}. Approve archival?`,
      title: 'Phase 10: Version Archival',
      context: {
        runId: ctx.runId,
        phase: 'version-retention',
        versionsArchived: retentionResult.versionsArchived,
        versionsRetained: retentionResult.versionsRetained,
        archivalReason: retentionResult.archivalReasons,
        files: retentionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: HOSTING CONFIGURATION FOR MULTI-VERSION DOCS
  // ============================================================================

  ctx.log('info', 'Phase 11: Configuring hosting for multi-version documentation');

  const hostingConfig = await ctx.task(hostingConfigurationTask, {
    productName,
    currentVersion,
    versions: versionAnalysis.previousVersions,
    hostingPlatform,
    platform,
    versionStructure,
    versionSwitcherConfig,
    outputDir
  });

  artifacts.push(...hostingConfig.artifacts);

  await ctx.breakpoint({
    question: `Hosting configuration complete for ${hostingPlatform}. Ready to deploy ${hostingConfig.versionsConfigured} versions?`,
    title: 'Phase 11: Hosting Configuration',
    context: {
      runId: ctx.runId,
      phase: 'hosting-configuration',
      hostingPlatform,
      versionsConfigured: hostingConfig.versionsConfigured,
      baseUrl: hostingConfig.baseUrl,
      deploymentInstructions: hostingConfig.deploymentInstructions,
      files: hostingConfig.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 12: VERSION INDEX AND METADATA
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating version index and metadata');

  const versionIndex = await ctx.task(versionIndexTask, {
    productName,
    currentVersion,
    versions: versionAnalysis.previousVersions,
    changelog: changelogResult,
    migrationGuides,
    deprecations: deprecationResult.deprecations || [],
    versionStructure,
    outputDir
  });

  artifacts.push(...versionIndex.artifacts);

  // ============================================================================
  // PHASE 13: DEPLOYMENT AUTOMATION SCRIPTS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating deployment automation scripts');

  const deploymentScripts = await ctx.task(deploymentAutomationTask, {
    productName,
    currentVersion,
    platform,
    hostingPlatform,
    hostingConfig,
    versionStructure,
    outputDir
  });

  artifacts.push(...deploymentScripts.artifacts);

  // ============================================================================
  // PHASE 14: VERSION RELEASE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Validating version release readiness');

  const releaseValidation = await ctx.task(releaseValidationTask, {
    productName,
    currentVersion,
    versionsCreated,
    changelogGenerated,
    migrationGuides,
    versionSwitcherConfig,
    validationResults,
    acceptanceCriteria,
    artifacts,
    outputDir
  });

  artifacts.push(...releaseValidation.artifacts);

  const readyForRelease = releaseValidation.passed;

  // Quality Gate: Release validation
  if (!readyForRelease) {
    await ctx.breakpoint({
      question: `Release validation failed: ${releaseValidation.failureReasons.join(', ')}. Review issues and retry?`,
      title: 'Release Validation Quality Gate',
      context: {
        runId: ctx.runId,
        passed: false,
        failureReasons: releaseValidation.failureReasons,
        checkResults: releaseValidation.checks,
        recommendations: releaseValidation.recommendations,
        files: releaseValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 15: FINAL RELEASE PACKAGE
  // ============================================================================

  ctx.log('info', 'Phase 15: Creating final release package');

  const releasePackage = await ctx.task(releasePackageTask, {
    productName,
    currentVersion,
    versionsCreated,
    changelogGenerated,
    migrationGuides,
    versionSwitcherConfig,
    hostingConfig,
    deploymentScripts,
    releaseValidation,
    artifacts,
    outputDir
  });

  artifacts.push(...releasePackage.artifacts);

  // Final Breakpoint: Approve release
  await ctx.breakpoint({
    question: `Documentation versioning complete for ${productName} v${currentVersion}. ${versionsCreated.length} version(s) configured, changelog generated, ${migrationGuides.length} migration guide(s) created. Release validation: ${readyForRelease ? 'PASSED' : 'FAILED'}. Approve for deployment?`,
    title: 'Final Release Package Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'html',
        version: a.version || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        currentVersion,
        versionsManaged: versionsCreated.length,
        changelogGenerated,
        migrationGuidesCount: migrationGuides.length,
        releaseValidation: readyForRelease ? 'PASSED' : 'FAILED',
        hostingPlatform,
        deploymentReady: hostingConfig.deploymentReady
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    currentVersion,
    versioningStrategy,
    versionsCreated: versionsCreated.map(v => ({
      version: v.version,
      path: v.snapshotPath,
      filesCount: v.filesCount
    })),
    versionSwitcherConfig: versionSwitcherConfig || null,
    changelogGenerated,
    changelogPath: changelogResult.changelogPath,
    migrationGuides: migrationGuides.map(g => ({
      title: g.title,
      fromVersion: g.fromVersion,
      toVersion: g.toVersion,
      path: g.path
    })),
    deprecations: deprecationResult.deprecations || [],
    versionStructure: {
      platform,
      versionsConfigured: versionStructure.versionsConfigured,
      structurePath: versionStructure.outputPath
    },
    linkValidation: {
      totalVersionsValidated: validationResults.length,
      totalBrokenLinks,
      passed: totalBrokenLinks === 0
    },
    versionsArchived: retentionResult.versionsArchived,
    versionsRetained: retentionResult.versionsRetained,
    hosting: {
      platform: hostingPlatform,
      baseUrl: hostingConfig.baseUrl,
      deploymentReady: hostingConfig.deploymentReady,
      deploymentScripts: deploymentScripts.scripts
    },
    releaseValidation: {
      passed: readyForRelease,
      checks: releaseValidation.checks,
      failureReasons: releaseValidation.failureReasons || []
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/docs-versioning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Version Analysis
export const versionAnalysisTask = defineTask('version-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze version structure and validate inputs',
  agent: {
    name: 'version-analyst',
    prompt: {
      role: 'documentation versioning specialist',
      task: 'Analyze version numbers, strategy, and create version management plan',
      context: args,
      instructions: [
        'Validate current version format (semantic, date-based, etc.)',
        'Validate all previous versions follow same format',
        'Parse version numbers and determine version scheme',
        'Identify major, minor, and patch version components',
        'Sort versions in chronological order',
        'Check for version gaps or inconsistencies',
        'Analyze version history for patterns (frequency, increment strategy)',
        'Evaluate retention policy against version history',
        'Identify which versions should be kept vs archived',
        'Calculate version lifecycle (age, usage patterns if available)',
        'Validate documentation path exists and is accessible',
        'Generate version tree showing relationships',
        'Provide retention recommendations based on policy',
        'Flag any version validation issues or warnings',
        'Save version analysis report to output directory'
      ],
      outputFormat: 'JSON with valid (boolean), totalVersions (number), versionScheme (string), previousVersions (array with version, age, shouldRetain), retentionSuggestions (object), errors (array), warnings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'totalVersions', 'versionScheme', 'previousVersions', 'artifacts'],
      properties: {
        valid: { type: 'boolean' },
        totalVersions: { type: 'number' },
        versionScheme: { type: 'string', enum: ['semantic', 'date-based', 'major-only', 'custom'] },
        previousVersions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              major: { type: 'number' },
              minor: { type: 'number' },
              patch: { type: 'number' },
              releaseDate: { type: 'string' },
              shouldRetain: { type: 'boolean' },
              archivalReason: { type: 'string' }
            }
          }
        },
        retentionSuggestions: {
          type: 'object',
          properties: {
            versionsToKeep: { type: 'array', items: { type: 'string' } },
            versionsToArchive: { type: 'array', items: { type: 'string' } },
            reasoning: { type: 'string' }
          }
        },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'analysis']
}));

// Task 2: Documentation Snapshot
export const docsSnapshotTask = defineTask('docs-snapshot', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create documentation snapshot for current version',
  agent: {
    name: 'snapshot-creator',
    prompt: {
      role: 'documentation versioning engineer',
      task: 'Create immutable snapshot of current documentation for version archival',
      context: args,
      instructions: [
        'Scan documentation directory and inventory all files',
        'Identify documentation files (markdown, HTML, assets, configs)',
        'Create version-specific directory structure',
        'Copy all documentation files to versioned snapshot directory',
        'Preserve directory structure and file organization',
        'Update internal links to be version-specific',
        'Copy assets (images, CSS, JavaScript) to versioned assets folder',
        'Create version metadata file with:',
        '  - Version number and release date',
        '  - File count and total size',
        '  - Checksum/hash for integrity',
        '  - Original source path',
        'Validate snapshot completeness (no missing files)',
        'Test that snapshot is self-contained and browsable',
        'Generate snapshot manifest listing all files',
        'Save snapshot with version label to output directory'
      ],
      outputFormat: 'JSON with success (boolean), snapshotPath (string), filesCount (number), totalSize (number), checksum (string), manifest (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'snapshotPath', 'filesCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        snapshotPath: { type: 'string' },
        filesCount: { type: 'number' },
        totalSize: { type: 'number' },
        checksum: { type: 'string' },
        manifest: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              size: { type: 'number' }
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
  labels: ['agent', 'versioning', 'snapshot']
}));

// Task 3: Changelog Generation
export const changelogGenerationTask = defineTask('changelog-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate changelog and release notes',
  agent: {
    name: 'changelog-generator',
    prompt: {
      role: 'technical writer and release manager',
      task: 'Generate comprehensive changelog following Keep a Changelog format',
      context: args,
      instructions: [
        'Determine changelog source (git commits, existing changelog, manual input)',
        'If source is git:',
        '  - Extract commits since previous version',
        '  - Parse conventional commits (feat:, fix:, docs:, etc.)',
        '  - Group commits by type and scope',
        'Categorize changes into:',
        '  - Added (new features)',
        '  - Changed (changes to existing functionality)',
        '  - Deprecated (soon-to-be removed features)',
        '  - Removed (removed features)',
        '  - Fixed (bug fixes)',
        '  - Security (security fixes)',
        'For each change:',
        '  - Write clear, user-facing description',
        '  - Link to pull request or issue if available',
        '  - Highlight breaking changes prominently',
        '  - Include migration notes if applicable',
        'Follow Keep a Changelog format:',
        '  - Version heading with release date',
        '  - Categorized bullet list of changes',
        '  - Links to compare view',
        'Update existing CHANGELOG.md or create new one',
        'Add version to top of changelog (newest first)',
        'Generate release notes summary for announcements',
        'Save changelog to output directory'
      ],
      outputFormat: 'JSON with generated (boolean), changelogPath (string), entriesCount (number), categories (object), breakingChanges (array), releaseNotes (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['generated', 'changelogPath', 'entriesCount', 'artifacts'],
      properties: {
        generated: { type: 'boolean' },
        changelogPath: { type: 'string' },
        entriesCount: { type: 'number' },
        categories: {
          type: 'object',
          properties: {
            added: { type: 'number' },
            changed: { type: 'number' },
            deprecated: { type: 'number' },
            removed: { type: 'number' },
            fixed: { type: 'number' },
            security: { type: 'number' }
          }
        },
        breakingChanges: { type: 'array', items: { type: 'string' } },
        releaseNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'changelog']
}));

// Task 4: Deprecation Notices
export const deprecationNoticesTask = defineTask('deprecation-notices', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate deprecation notices and warnings',
  agent: {
    name: 'deprecation-specialist',
    prompt: {
      role: 'API deprecation specialist and technical writer',
      task: 'Identify deprecated features and create clear deprecation notices',
      context: args,
      instructions: [
        'Analyze changelog for deprecated or removed features',
        'Identify features marked as deprecated in previous versions',
        'For each deprecated feature:',
        '  - Create clear deprecation notice with:',
        '    * What is deprecated',
        '    * Why it is deprecated',
        '    * When it will be removed (version/date)',
        '    * What to use instead (alternative/replacement)',
        '    * Migration steps',
        '  - Severity level (warning, critical)',
        '  - Timeline for removal',
        'Create deprecation notice formats:',
        '  - Inline notices for documentation pages',
        '  - Banner warnings for deprecated version pages',
        '  - Deprecation reference page listing all deprecations',
        'Include code examples showing before/after',
        'Link to migration guides for complex deprecations',
        'Generate deprecation timeline showing removal schedule',
        'Create deprecation metadata for tooling integration',
        'Save deprecation notices to output directory'
      ],
      outputFormat: 'JSON with deprecations (array with feature, severity, removeIn, replacement, notice), deprecationPage (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deprecations', 'artifacts'],
      properties: {
        deprecations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              severity: { type: 'string', enum: ['warning', 'critical'] },
              deprecatedIn: { type: 'string' },
              removeIn: { type: 'string' },
              replacement: { type: 'string' },
              migrationPath: { type: 'string' },
              notice: { type: 'string' }
            }
          }
        },
        deprecationPage: { type: 'string' },
        deprecationTimeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'deprecations']
}));

// Task 5: Migration Guides
export const migrationGuidesTask = defineTask('migration-guides', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create version migration guides',
  agent: {
    name: 'migration-guide-writer',
    prompt: {
      role: 'technical writer specializing in migration documentation',
      task: 'Create comprehensive step-by-step migration guides between versions',
      context: args,
      instructions: [
        'Identify version pairs requiring migration guides (major versions, significant changes)',
        'Analyze changes between versions from changelog',
        'For each migration guide:',
        '  - Clear title: "Migrating from v{old} to v{new}"',
        '  - Overview of changes and migration scope',
        '  - Prerequisites and requirements',
        '  - Estimated migration time and effort',
        '  - Step-by-step migration instructions:',
        '    * Numbered steps in logical order',
        '    * Code examples for each step',
        '    * Before/after comparisons',
        '    * Testing and verification steps',
        '  - Breaking changes with migration path',
        '  - Common issues and troubleshooting',
        '  - Rollback procedure if needed',
        '  - Links to relevant documentation',
        'Create migration checklist users can follow',
        'Include automated migration scripts if possible',
        'Add difficulty rating (easy, moderate, complex)',
        'Cross-link related migration guides',
        'Save migration guides to output directory'
      ],
      outputFormat: 'JSON with guides (array with title, fromVersion, toVersion, path, difficulty), totalGuides (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guides', 'totalGuides', 'artifacts'],
      properties: {
        guides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              fromVersion: { type: 'string' },
              toVersion: { type: 'string' },
              path: { type: 'string' },
              difficulty: { type: 'string', enum: ['easy', 'moderate', 'complex'] },
              estimatedTime: { type: 'string' }
            }
          }
        },
        totalGuides: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'migration']
}));

// Task 6: Version Structure Setup
export const versionStructureTask = defineTask('version-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up version structure for documentation platform',
  agent: {
    name: 'version-structure-engineer',
    prompt: {
      role: 'documentation platform engineer',
      task: 'Create version-specific directory structure and configuration for documentation platform',
      context: args,
      instructions: [
        'Set up version structure based on platform:',
        '  - Docusaurus: Create versioned_docs/, versioned_sidebars/, versions.json',
        '  - MkDocs: Create version-specific directories, mike configuration',
        '  - VuePress: Create version directories with configs',
        '  - Custom: Design multi-version directory structure',
        'For each version:',
        '  - Create version-specific directory',
        '  - Copy/link snapshot files to version directory',
        '  - Update configuration for version',
        '  - Set up version-specific navigation',
        'Create versions manifest file listing all versions',
        'Configure version routing (URL structure):',
        '  - /docs/latest/ -> current version',
        '  - /docs/v2.1.0/ -> specific version',
        '  - /docs/ -> default (latest or stable)',
        'Set up symbolic links for "latest" and "stable"',
        'Configure version-specific base URLs and paths',
        'Create .htaccess or routing rules for version redirection',
        'Apply retention policy (hide archived versions from main navigation)',
        'Validate structure integrity and completeness',
        'Save version structure configuration to output directory'
      ],
      outputFormat: 'JSON with success (boolean), versionsConfigured (number), structure (object), outputPath (string), platformConfig (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'versionsConfigured', 'structure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        versionsConfigured: { type: 'number' },
        structure: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            versionDirectories: { type: 'array', items: { type: 'string' } },
            latestVersion: { type: 'string' },
            stableVersion: { type: 'string' },
            defaultVersion: { type: 'string' }
          }
        },
        outputPath: { type: 'string' },
        platformConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'structure']
}));

// Task 7: Version Switcher
export const versionSwitcherTask = defineTask('version-switcher', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement version switcher UI component',
  agent: {
    name: 'version-switcher-developer',
    prompt: {
      role: 'frontend developer specializing in documentation UIs',
      task: 'Create version switcher dropdown component for documentation site',
      context: args,
      instructions: [
        'Design version switcher UI component based on platform:',
        '  - Docusaurus: Configure docsVersionDropdown in navbar',
        '  - MkDocs Material: Set up version selector in mkdocs.yml',
        '  - VuePress: Create custom version dropdown component',
        '  - Custom: Build HTML/CSS/JS version switcher',
        'Version switcher should include:',
        '  - Dropdown menu with all active versions',
        '  - Current version highlighted',
        '  - Special labels: "Latest", "Stable", "Beta", "Archived"',
        '  - Optional custom labels from configuration',
        '  - Grouped versions (by major version or category)',
        'Implement version switching functionality:',
        '  - Preserve current page path when switching versions',
        '  - Fallback to home if page does not exist in target version',
        '  - Show warning if switching to archived version',
        'Style version switcher to match site theme',
        'Make responsive for mobile devices',
        'Add keyboard navigation support (accessibility)',
        'Include tooltip showing version release date',
        'Configure version switcher position (navbar, sidebar, footer)',
        'Test version switching across all pages',
        'Generate version switcher configuration file',
        'Save version switcher component code and config to output directory'
      ],
      outputFormat: 'JSON with config (object), versionsInSwitcher (number), latestVersion (string), stableVersion (string), componentPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'versionsInSwitcher', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            position: { type: 'string' },
            versions: { type: 'array' },
            labels: { type: 'object' },
            defaultVersion: { type: 'string' }
          }
        },
        versionsInSwitcher: { type: 'number' },
        latestVersion: { type: 'string' },
        stableVersion: { type: 'string' },
        componentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'ui']
}));

// Task 8: Navigation Update
export const navigationUpdateTask = defineTask('navigation-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update navigation and cross-version links',
  agent: {
    name: 'navigation-engineer',
    prompt: {
      role: 'documentation information architect',
      task: 'Update navigation menus and links to support multi-version documentation',
      context: args,
      instructions: [
        'Update main navigation menu for version awareness:',
        '  - Add version-specific navigation items',
        '  - Update links to include version prefix',
        '  - Configure navigation based on active version',
        'For each version\'s documentation:',
        '  - Update internal links to be version-scoped',
        '  - Convert absolute paths to version-relative paths',
        '  - Add version parameter to cross-references',
        '  - Update API reference links',
        'Add cross-version navigation elements:',
        '  - "View this page in other versions" links',
        '  - "Latest version of this page" banner for old versions',
        '  - Version comparison links where applicable',
        'Update sidebar/TOC for each version:',
        '  - Version-specific table of contents',
        '  - Hide removed sections in older versions',
        '  - Add "New in version X" badges',
        'Configure breadcrumbs to show version',
        'Update footer links (changelog, migration guides)',
        'Validate all navigation links are version-correct',
        'Test navigation flow across versions',
        'Save updated navigation configs to output directory'
      ],
      outputFormat: 'JSON with success (boolean), versionsUpdated (number), linksUpdated (number), navigationConfigs (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'versionsUpdated', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        versionsUpdated: { type: 'number' },
        linksUpdated: { type: 'number' },
        navigationConfigs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'navigation']
}));

// Task 9: Version Banners
export const versionBannersTask = defineTask('version-banners', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Add version banners and warnings',
  agent: {
    name: 'banner-designer',
    prompt: {
      role: 'UX designer and frontend developer',
      task: 'Create informative version banners and deprecation warnings for documentation pages',
      context: args,
      instructions: [
        'Design banner types:',
        '  - Old version warning: "You are viewing docs for v1.0. Latest is v2.0."',
        '  - Deprecated version: "This version is deprecated and no longer maintained."',
        '  - Pre-release version: "This is beta documentation. Features may change."',
        '  - Latest version badge: "You are viewing the latest version"',
        'For each version category:',
        '  - Create appropriate banner HTML/CSS',
        '  - Choose color scheme (info blue, warning yellow, danger red)',
        '  - Add clear call-to-action link (upgrade, view latest)',
        '  - Make dismissible where appropriate',
        '  - Position banner prominently (top of page)',
        'Add inline deprecation warnings:',
        '  - Highlighted boxes for deprecated features',
        '  - Link to migration guide',
        '  - Show replacement/alternative',
        'Create "New in version X" badges:',
        '  - Inline badges next to new features',
        '  - Filterable by version',
        'Implement banner logic:',
        '  - Show appropriate banner based on version',
        '  - Hide banner on latest stable version',
        '  - Persist user dismissal (localStorage)',
        'Make banners accessible (ARIA labels, keyboard navigation)',
        'Test banner appearance on mobile and desktop',
        'Generate banner configuration and styles',
        'Save banner components to output directory'
      ],
      outputFormat: 'JSON with bannersCreated (number), bannerTypes (array), inlineWarnings (number), componentPaths (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bannersCreated', 'bannerTypes', 'artifacts'],
      properties: {
        bannersCreated: { type: 'number' },
        bannerTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string' },
              message: { type: 'string' },
              versions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        inlineWarnings: { type: 'number' },
        componentPaths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'ui']
}));

// Task 10: Version Link Validation
export const versionLinkValidationTask = defineTask('version-link-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate links in version',
  agent: {
    name: 'link-validator',
    prompt: {
      role: 'quality assurance engineer',
      task: 'Validate all internal and external links in documentation version',
      context: args,
      instructions: [
        'Scan all documentation files in version',
        'Extract all links (internal and external):',
        '  - Internal links to other documentation pages',
        '  - Links to API reference',
        '  - Links to code examples',
        '  - External links to resources',
        '  - Anchor links within pages',
        'Validate each link:',
        '  - Internal links: verify target file/page exists in this version',
        '  - Anchor links: verify anchor ID exists on target page',
        '  - External links: check HTTP status (200 OK)',
        '  - Version-specific links: ensure correct version path',
        'Categorize link issues:',
        '  - Broken links (404, file not found)',
        '  - Missing anchors (anchor not found on page)',
        '  - Wrong version (links to wrong version path)',
        '  - External link errors (timeout, 404, etc.)',
        'Generate link validation report for this version:',
        '  - Total links checked',
        '  - Broken links with source and target',
        '  - Recommendations for fixes',
        'Save validation report to output directory'
      ],
      outputFormat: 'JSON with version (string), totalLinks (number), brokenLinksCount (number), brokenLinks (array), validationReport (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['version', 'totalLinks', 'brokenLinksCount', 'artifacts'],
      properties: {
        version: { type: 'string' },
        totalLinks: { type: 'number' },
        brokenLinksCount: { type: 'number' },
        brokenLinks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              error: { type: 'string' }
            }
          }
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
  labels: ['agent', 'versioning', 'validation']
}));

// Task 11: Version Retention
export const versionRetentionTask = defineTask('version-retention', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply version retention policy and archival',
  agent: {
    name: 'retention-manager',
    prompt: {
      role: 'documentation lifecycle manager',
      task: 'Apply retention policy to determine which versions to keep active vs archive',
      context: args,
      instructions: [
        'Review retention policy rules:',
        '  - Keep all/N major versions',
        '  - Keep last N minor versions per major',
        '  - Archive versions older than N years',
        'For each version, evaluate:',
        '  - Version significance (major/minor/patch)',
        '  - Version age (time since release)',
        '  - Version adoption (if metrics available)',
        '  - Security status (maintained vs EOL)',
        'Apply retention rules:',
        '  - Mark versions for retention (keep active)',
        '  - Mark versions for archival (hide from main nav, add archive notice)',
        '  - Never archive current version or latest stable',
        'For archived versions:',
        '  - Add "Archived Version" banner',
        '  - Remove from main version switcher',
        '  - Move to "Archived Versions" section',
        '  - Keep accessible but demoted',
        '  - Update robots.txt to noindex archived versions',
        'Document archival decisions with reasoning',
        'Create archival summary:',
        '  - Versions archived and why',
        '  - Versions retained and why',
        '  - Retention policy applied',
        'Save retention decisions and updated version list to output directory'
      ],
      outputFormat: 'JSON with versionsRetained (array), versionsArchived (array), archivalReasons (object), retentionSummary (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['versionsRetained', 'versionsArchived', 'artifacts'],
      properties: {
        versionsRetained: { type: 'array', items: { type: 'string' } },
        versionsArchived: { type: 'array', items: { type: 'string' } },
        archivalReasons: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        retentionSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'retention']
}));

// Task 12: Hosting Configuration
export const hostingConfigurationTask = defineTask('hosting-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure hosting for multi-version documentation',
  agent: {
    name: 'hosting-engineer',
    prompt: {
      role: 'DevOps engineer and documentation hosting specialist',
      task: 'Configure hosting platform to serve multi-version documentation',
      context: args,
      instructions: [
        'Configure hosting based on platform:',
        '  - GitHub Pages: Create gh-pages branch structure, CNAME, .nojekyll',
        '  - Netlify: Generate netlify.toml with redirects and headers',
        '  - Vercel: Create vercel.json with routes and redirects',
        '  - Read the Docs: Generate .readthedocs.yaml with versions config',
        'Set up URL routing for versions:',
        '  - / or /docs/ -> default version (latest or stable)',
        '  - /latest/ or /docs/latest/ -> current version',
        '  - /v{version}/ or /docs/v{version}/ -> specific version',
        '  - /stable/ -> latest stable release',
        'Configure redirects:',
        '  - Redirect old URLs to new version structure',
        '  - Redirect deprecated versions to latest',
        '  - Preserve query parameters and anchors',
        'Set up custom domain if specified',
        'Configure HTTPS/SSL certificates',
        'Set caching headers:',
        '  - Long cache for versioned content (immutable)',
        '  - Short cache for latest/stable (frequently updated)',
        'Create robots.txt:',
        '  - Allow indexing of latest/stable',
        '  - Noindex archived versions',
        'Generate sitemap.xml for each version',
        'Configure CDN and edge caching if available',
        'Create deployment instructions with step-by-step guide',
        'Generate deployment automation scripts (CI/CD)',
        'Test routing and redirects',
        'Save hosting configuration files to output directory'
      ],
      outputFormat: 'JSON with deploymentReady (boolean), versionsConfigured (number), baseUrl (string), configFiles (array), deploymentInstructions (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentReady', 'versionsConfigured', 'artifacts'],
      properties: {
        deploymentReady: { type: 'boolean' },
        versionsConfigured: { type: 'number' },
        baseUrl: { type: 'string' },
        configFiles: { type: 'array', items: { type: 'string' } },
        deploymentInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'hosting']
}));

// Task 13: Version Index
export const versionIndexTask = defineTask('version-index', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create version index and metadata',
  agent: {
    name: 'index-creator',
    prompt: {
      role: 'documentation metadata specialist',
      task: 'Create comprehensive version index with metadata and relationships',
      context: args,
      instructions: [
        'Create version index page listing all versions:',
        '  - Version number with release date',
        '  - Status label (Latest, Stable, Deprecated, Archived)',
        '  - Brief description of major changes',
        '  - Links to version docs, changelog, migration guide',
        '  - Download links if applicable',
        'Group versions by category:',
        '  - Current versions (latest, stable)',
        '  - Previous versions (maintained)',
        '  - Archived versions (EOL)',
        'Create version metadata file (JSON):',
        '  - Version number, release date, status',
        '  - Changelog link, migration guides',
        '  - API compatibility information',
        '  - Deprecations list',
        '  - Support end date if applicable',
        'Build version relationship graph:',
        '  - Version lineage and progression',
        '  - Breaking changes between versions',
        '  - Compatible version ranges',
        'Create version comparison page:',
        '  - Side-by-side feature comparison',
        '  - What changed between versions',
        '  - Upgrade paths',
        'Generate version timeline visualization',
        'Create version API (JSON endpoints) if needed:',
        '  - /versions.json -> list of all versions',
        '  - /versions/{version}.json -> version metadata',
        'Save version index and metadata to output directory'
      ],
      outputFormat: 'JSON with indexCreated (boolean), indexPath (string), totalVersions (number), versionMetadata (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indexCreated', 'indexPath', 'totalVersions', 'artifacts'],
      properties: {
        indexCreated: { type: 'boolean' },
        indexPath: { type: 'string' },
        totalVersions: { type: 'number' },
        versionMetadata: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              releaseDate: { type: 'string' },
              status: { type: 'string' },
              changelogUrl: { type: 'string' },
              migrationGuides: { type: 'array' }
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
  labels: ['agent', 'versioning', 'metadata']
}));

// Task 14: Deployment Automation
export const deploymentAutomationTask = defineTask('deployment-automation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate deployment automation scripts',
  agent: {
    name: 'automation-engineer',
    prompt: {
      role: 'DevOps automation engineer',
      task: 'Create automated deployment scripts and CI/CD workflows for versioned documentation',
      context: args,
      instructions: [
        'Create deployment scripts based on hosting platform:',
        '  - GitHub Pages: GitHub Actions workflow',
        '  - Netlify: netlify-deploy.sh or netlify.toml',
        '  - Vercel: vercel.json and deploy commands',
        '  - Read the Docs: readthedocs config',
        'GitHub Actions workflow should:',
        '  - Trigger on version tags or release events',
        '  - Build documentation for new version',
        '  - Create version snapshot',
        '  - Update version list and switcher',
        '  - Deploy to hosting platform',
        '  - Run link validation',
        '  - Send deployment notifications',
        'Create version release automation:',
        '  - Script to create new version snapshot',
        '  - Update versions.json',
        '  - Generate changelog entry',
        '  - Run migration guide generator',
        '  - Deploy updated docs',
        'Add rollback capability:',
        '  - Script to revert to previous version',
        '  - Backup before deployment',
        'Create pre-deployment checks:',
        '  - Link validation',
        '  - Build verification',
        '  - Version number validation',
        'Document manual deployment steps as fallback',
        'Add environment variables and secrets configuration',
        'Generate deployment checklist',
        'Save automation scripts to output directory'
      ],
      outputFormat: 'JSON with scripts (array with name, path, platform), workflowsCreated (number), cicdPlatform (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'workflowsCreated', 'artifacts'],
      properties: {
        scripts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              platform: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        workflowsCreated: { type: 'number' },
        cicdPlatform: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'automation']
}));

// Task 15: Release Validation
export const releaseValidationTask = defineTask('release-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate version release readiness',
  agent: {
    name: 'release-validator',
    prompt: {
      role: 'documentation quality assurance lead',
      task: 'Validate that versioned documentation meets all release criteria',
      context: args,
      instructions: [
        'Validate version structure:',
        '  - All required versions present and accessible',
        '  - Version directories properly structured',
        '  - Version configuration files valid',
        'Validate content:',
        '  - Current version snapshot created successfully',
        '  - Changelog generated and complete',
        '  - Migration guides present if required',
        '  - Deprecation notices added where needed',
        'Validate navigation and links:',
        '  - Version switcher functional',
        '  - Navigation updated for all versions',
        '  - All internal links valid (from validation results)',
        '  - Cross-version links working',
        'Validate UI components:',
        '  - Version banners display correctly',
        '  - Version switcher accessible and functional',
        '  - Responsive design on mobile',
        'Validate hosting configuration:',
        '  - Hosting config files present and valid',
        '  - URL routing configured correctly',
        '  - Redirects working',
        'Check acceptance criteria:',
        '  - Minimum versions covered',
        '  - Migration guides required and present',
        '  - Changelog required and present',
        '  - Links valid if required',
        'Run comprehensive validation tests',
        'Generate validation report with pass/fail for each check',
        'List any blocking issues preventing release',
        'Provide recommendations for issues found',
        'Save validation report to output directory'
      ],
      outputFormat: 'JSON with passed (boolean), checks (object with pass/fail for each check), failureReasons (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'checks', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        checks: {
          type: 'object',
          properties: {
            versionStructure: { type: 'boolean' },
            changelogGenerated: { type: 'boolean' },
            migrationGuides: { type: 'boolean' },
            linksValid: { type: 'boolean' },
            versionSwitcher: { type: 'boolean' },
            banners: { type: 'boolean' },
            hostingConfig: { type: 'boolean' },
            acceptanceCriteria: { type: 'boolean' }
          }
        },
        failureReasons: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'versioning', 'validation']
}));

// Task 16: Release Package
export const releasePackageTask = defineTask('release-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create final release package',
  agent: {
    name: 'release-packager',
    prompt: {
      role: 'documentation release manager',
      task: 'Create comprehensive release package with all deliverables and documentation',
      context: args,
      instructions: [
        'Create release summary document:',
        '  - Product name and version',
        '  - Release date and version type (major/minor/patch)',
        '  - Summary of changes from changelog',
        '  - Breaking changes highlighted',
        '  - Migration guide links',
        '  - Deprecations and removals',
        'Compile release deliverables:',
        '  - Version snapshot and location',
        '  - Changelog file',
        '  - Migration guides',
        '  - Version structure configuration',
        '  - Hosting configuration',
        '  - Deployment scripts',
        '  - Validation reports',
        'Create release checklist:',
        '  - Pre-release tasks completed',
        '  - Documentation updated',
        '  - Testing completed',
        '  - Deployment ready',
        'Generate release announcement draft:',
        '  - User-facing summary of changes',
        '  - Key features and improvements',
        '  - Upgrade instructions',
        '  - Links to documentation',
        'Create deployment guide:',
        '  - Step-by-step deployment instructions',
        '  - Rollback procedure',
        '  - Post-deployment verification',
        '  - Troubleshooting tips',
        'Package all artifacts in organized structure',
        'Create README for release package',
        'Generate release metrics:',
        '  - Versions managed',
        '  - Pages created',
        '  - Links validated',
        '  - Deployment readiness status',
        'Save release package to output directory'
      ],
      outputFormat: 'JSON with packageCreated (boolean), releaseSummary (string), deliverables (array), deploymentGuide (string), releaseAnnouncement (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packageCreated', 'releaseSummary', 'deliverables', 'artifacts'],
      properties: {
        packageCreated: { type: 'boolean' },
        releaseSummary: { type: 'string' },
        deliverables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        deploymentGuide: { type: 'string' },
        releaseAnnouncement: { type: 'string' },
        releaseMetrics: {
          type: 'object',
          properties: {
            versionsManaged: { type: 'number' },
            pagesCreated: { type: 'number' },
            linksValidated: { type: 'number' },
            deploymentReady: { type: 'boolean' }
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
  labels: ['agent', 'versioning', 'release']
}));
