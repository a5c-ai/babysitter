/**
 * @process methodologies/cog-second-brain/cog-vault-management
 * @description COG Second Brain - Vault management: update COG, self-healing, cross-reference maintenance
 * @inputs { vaultPath: string, mode: string, updateSource?: string, targetQuality?: number }
 * @outputs { success: boolean, actions: array, healthReport: object, updatesApplied: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * COG Vault Management Process
 *
 * Adapted from COG Second Brain (https://github.com/huytieu/COG-second-brain)
 * Handles vault maintenance operations:
 * 1. Update COG - Framework updates preserving user content
 * 2. Self-Healing - Detect and fix broken cross-references
 * 3. Cross-Reference Maintenance - Keep links consistent after renames/restructuring
 * 4. Health Check - Comprehensive vault health assessment
 *
 * Key Principle: Content-safe updates - framework changes never overwrite personal data.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.vaultPath - Path to COG vault
 * @param {string} inputs.mode - Mode: 'update-cog', 'self-heal', 'cross-ref-maintenance', 'health-check'
 * @param {string} inputs.updateSource - Source for COG updates (for update-cog mode)
 * @param {number} inputs.targetQuality - Minimum quality score (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Management results
 */
export async function process(inputs, ctx) {
  const {
    vaultPath,
    mode,
    updateSource = null,
    targetQuality = 80
  } = inputs;

  const results = {
    mode,
    actions: [],
    healthReport: {},
    updatesApplied: []
  };

  ctx.log('Starting vault management', { mode, vaultPath });

  // ============================================================================
  // UPDATE COG MODE
  // ============================================================================

  if (mode === 'update-cog') {
    ctx.log('Running COG framework update');

    // Step 1: Detect current framework version and available updates
    const versionCheck = await ctx.task(checkFrameworkVersionTask, {
      vaultPath,
      updateSource
    });

    if (!versionCheck.updateAvailable) {
      ctx.log('No updates available', { currentVersion: versionCheck.currentVersion });
      results.actions.push({ type: 'check', result: 'up-to-date' });
      results.success = true;
      return results;
    }

    // Step 2: Identify user content that must be preserved
    const userContent = await ctx.task(identifyUserContentTask, {
      vaultPath
    });

    // Step 3: Apply framework updates (content-safe)
    const updatePlan = await ctx.task(planFrameworkUpdateTask, {
      vaultPath,
      currentVersion: versionCheck.currentVersion,
      targetVersion: versionCheck.latestVersion,
      userContentPaths: userContent.paths,
      updateSource
    });

    // Human review gate before applying updates
    await ctx.breakpoint({
      title: 'Review COG Framework Update Plan',
      description: `Update from v${versionCheck.currentVersion} to v${versionCheck.latestVersion}. ${updatePlan.changes.length} changes planned. User content will be preserved.`,
      context: { updatePlan, protectedPaths: userContent.paths }
    });

    // Apply updates
    const applied = await ctx.task(applyFrameworkUpdateTask, {
      vaultPath,
      updatePlan,
      userContentPaths: userContent.paths
    });

    results.updatesApplied = applied.changes;
    results.actions.push({
      type: 'update-cog',
      from: versionCheck.currentVersion,
      to: versionCheck.latestVersion,
      changesApplied: applied.changes.length
    });

    // Step 4: Verify update integrity
    const integrityCheck = await ctx.task(verifyVaultIntegrityTask, {
      vaultPath,
      expectedStructure: applied.expectedStructure,
      targetQuality
    });

    results.healthReport.postUpdate = integrityCheck;

    // Run self-healing if integrity issues found
    if (integrityCheck.issues && integrityCheck.issues.length > 0) {
      ctx.log('Post-update integrity issues found, running self-healing');

      const healed = await ctx.task(selfHealTask, {
        vaultPath,
        issues: integrityCheck.issues,
        targetQuality
      });

      results.actions.push({
        type: 'self-heal-post-update',
        issuesFixed: healed.fixedCount
      });
    }

    // Git commit the update
    await ctx.task(commitVaultChangesTask, {
      vaultPath,
      message: `COG framework update: v${versionCheck.currentVersion} -> v${versionCheck.latestVersion}`
    });

    ctx.log('COG update complete', {
      changesApplied: applied.changes.length
    });
  }

  // ============================================================================
  // SELF-HEAL MODE
  // ============================================================================

  if (mode === 'self-heal') {
    ctx.log('Running self-healing');

    // Step 1: Scan for broken cross-references and structural issues
    const scan = await ctx.task(scanVaultIssuesTask, {
      vaultPath
    });

    if (scan.issues.length === 0) {
      ctx.log('No issues found');
      results.actions.push({ type: 'scan', result: 'healthy' });
      results.success = true;
      return results;
    }

    ctx.log('Issues found', { count: scan.issues.length });

    // Step 2: Auto-fix broken cross-references
    const healed = await ctx.task(selfHealTask, {
      vaultPath,
      issues: scan.issues,
      targetQuality
    });

    results.actions.push({
      type: 'self-heal',
      issuesFound: scan.issues.length,
      issuesFixed: healed.fixedCount,
      remainingIssues: healed.remainingIssues
    });

    // Step 3: Verify fixes
    const verification = await ctx.task(verifyVaultIntegrityTask, {
      vaultPath,
      expectedStructure: null,
      targetQuality
    });

    results.healthReport = verification;

    // Git commit fixes
    if (healed.fixedCount > 0) {
      await ctx.task(commitVaultChangesTask, {
        vaultPath,
        message: `COG self-healing: fixed ${healed.fixedCount} issues`
      });
    }

    ctx.log('Self-healing complete', {
      fixed: healed.fixedCount,
      remaining: healed.remainingIssues?.length || 0
    });
  }

  // ============================================================================
  // CROSS-REFERENCE MAINTENANCE MODE
  // ============================================================================

  if (mode === 'cross-ref-maintenance') {
    ctx.log('Running cross-reference maintenance');

    // Step 1: Build cross-reference index
    const crossRefIndex = await ctx.task(buildCrossRefIndexTask, {
      vaultPath
    });

    // Step 2: Detect stale, broken, or missing cross-references in parallel
    const [staleRefs, brokenRefs, missingRefs] = await ctx.parallel.all([
      ctx.task(detectStaleCrossRefsTask, {
        vaultPath,
        index: crossRefIndex
      }),
      ctx.task(detectBrokenCrossRefsTask, {
        vaultPath,
        index: crossRefIndex
      }),
      ctx.task(detectMissingCrossRefsTask, {
        vaultPath,
        index: crossRefIndex
      })
    ]);

    // Step 3: Fix all cross-reference issues
    const fixes = await ctx.task(fixCrossReferencesTask, {
      vaultPath,
      staleRefs: staleRefs.refs,
      brokenRefs: brokenRefs.refs,
      missingRefs: missingRefs.refs
    });

    results.actions.push({
      type: 'cross-ref-maintenance',
      staleFixed: fixes.staleFixed,
      brokenFixed: fixes.brokenFixed,
      missingAdded: fixes.missingAdded,
      totalActions: fixes.totalActions
    });

    // Git commit if changes made
    if (fixes.totalActions > 0) {
      await ctx.task(commitVaultChangesTask, {
        vaultPath,
        message: `COG cross-ref maintenance: ${fixes.totalActions} references updated`
      });
    }

    ctx.log('Cross-reference maintenance complete', {
      totalActions: fixes.totalActions
    });
  }

  // ============================================================================
  // HEALTH CHECK MODE
  // ============================================================================

  if (mode === 'health-check') {
    ctx.log('Running vault health check');

    // Run all health checks in parallel
    const [structureCheck, crossRefCheck, gitCheck, contentCheck] = await ctx.parallel.all([
      ctx.task(checkVaultStructureTask, {
        vaultPath
      }),
      ctx.task(checkCrossRefHealthTask, {
        vaultPath
      }),
      ctx.task(checkGitHealthTask, {
        vaultPath
      }),
      ctx.task(checkContentHealthTask, {
        vaultPath,
        targetQuality
      })
    ]);

    results.healthReport = {
      structure: structureCheck,
      crossReferences: crossRefCheck,
      git: gitCheck,
      content: contentCheck,
      overallScore: Math.round(
        (structureCheck.score + crossRefCheck.score + gitCheck.score + contentCheck.score) / 4
      )
    };

    results.actions.push({
      type: 'health-check',
      overallScore: results.healthReport.overallScore,
      recommendations: [
        ...(structureCheck.recommendations || []),
        ...(crossRefCheck.recommendations || []),
        ...(gitCheck.recommendations || []),
        ...(contentCheck.recommendations || [])
      ]
    });

    ctx.log('Health check complete', {
      overallScore: results.healthReport.overallScore
    });
  }

  results.success = true;
  return results;
}

// =============================================================================
// TASK DEFINITIONS
// =============================================================================

const checkFrameworkVersionTask = defineTask('cog-check-framework-version', {
  kind: 'agent',
  title: 'Check COG Framework Version',
  labels: ['cog', 'vault', 'update', 'version'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        updateSource: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Check current COG framework version in vault',
    'Query update source for latest available version',
    'Compare versions and determine if update is available',
    'Return version info and changelog summary'
  ]
});

const identifyUserContentTask = defineTask('cog-identify-user-content', {
  kind: 'agent',
  title: 'Identify User Content to Preserve',
  labels: ['cog', 'vault', 'update', 'content-safety'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Scan vault for all user-created content',
    'Identify framework files vs user content files',
    'Build list of paths that must be preserved during update',
    'Include: 02-personal/, user entries in 01-daily/, 03-professional/, 04-projects/'
  ]
});

const planFrameworkUpdateTask = defineTask('cog-plan-framework-update', {
  kind: 'agent',
  title: 'Plan Framework Update',
  labels: ['cog', 'vault', 'update', 'planning'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        currentVersion: { type: 'string' },
        targetVersion: { type: 'string' },
        userContentPaths: { type: 'array' },
        updateSource: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Plan framework update ensuring content safety',
    'Diff current vs target framework files',
    'Ensure no user content paths are modified',
    'Generate change list with descriptions',
    'Include rollback strategy'
  ]
});

const applyFrameworkUpdateTask = defineTask('cog-apply-framework-update', {
  kind: 'agent',
  title: 'Apply Framework Update',
  labels: ['cog', 'vault', 'update', 'apply'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        updatePlan: { type: 'object' },
        userContentPaths: { type: 'array' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Apply planned framework changes to vault',
    'NEVER modify files in user content paths',
    'Update framework templates, configs, and structure files',
    'Verify each change preserves user content integrity',
    'Return list of applied changes and expected structure'
  ]
});

const verifyVaultIntegrityTask = defineTask('cog-verify-vault-integrity', {
  kind: 'agent',
  title: 'Verify Vault Integrity',
  labels: ['cog', 'vault', 'integrity'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        expectedStructure: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Verify vault directory structure matches expected layout',
    'Check all cross-references resolve correctly',
    'Verify Git repository is in clean state',
    'Report any integrity issues found'
  ]
});

const scanVaultIssuesTask = defineTask('cog-scan-vault-issues', {
  kind: 'agent',
  title: 'Scan Vault for Issues',
  labels: ['cog', 'vault', 'self-healing', 'scan'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Scan entire vault for structural and content issues',
    'Detect: broken cross-references, missing files, orphaned entries',
    'Check for: duplicate entries, inconsistent metadata, stale dates',
    'Return categorized issue list with severity levels'
  ]
});

const selfHealTask = defineTask('cog-self-heal', {
  kind: 'agent',
  title: 'Self-Heal Vault Issues',
  labels: ['cog', 'vault', 'self-healing', 'fix'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        issues: { type: 'array' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Auto-fix detected vault issues',
    'Update broken cross-references after renames or restructuring',
    'Repair missing directory structure',
    'Fix inconsistent metadata',
    'Report fixed vs remaining issues'
  ]
});

const buildCrossRefIndexTask = defineTask('cog-build-cross-ref-index', {
  kind: 'agent',
  title: 'Build Cross-Reference Index',
  labels: ['cog', 'vault', 'cross-reference', 'index'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Scan all vault markdown files for cross-references',
    'Build bidirectional reference index',
    'Include: internal links, tags, metadata references',
    'Return structured index for analysis'
  ]
});

const detectStaleCrossRefsTask = defineTask('cog-detect-stale-cross-refs', {
  kind: 'agent',
  title: 'Detect Stale Cross-References',
  labels: ['cog', 'vault', 'cross-reference', 'stale'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        index: { type: 'object' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Identify cross-references pointing to outdated content',
    'Check reference targets for freshness',
    'Flag stale references needing update'
  ]
});

const detectBrokenCrossRefsTask = defineTask('cog-detect-broken-cross-refs', {
  kind: 'agent',
  title: 'Detect Broken Cross-References',
  labels: ['cog', 'vault', 'cross-reference', 'broken'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        index: { type: 'object' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Identify cross-references pointing to non-existent files',
    'Detect references broken by renames or deletions',
    'Flag broken references with suggested fixes'
  ]
});

const detectMissingCrossRefsTask = defineTask('cog-detect-missing-cross-refs', {
  kind: 'agent',
  title: 'Detect Missing Cross-References',
  labels: ['cog', 'vault', 'cross-reference', 'missing'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        index: { type: 'object' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Identify related content that should be cross-referenced but is not',
    'Use topic similarity and metadata overlap to find missing links',
    'Suggest cross-references that would strengthen the knowledge graph'
  ]
});

const fixCrossReferencesTask = defineTask('cog-fix-cross-references', {
  kind: 'agent',
  title: 'Fix Cross-References',
  labels: ['cog', 'vault', 'cross-reference', 'fix'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        staleRefs: { type: 'array' },
        brokenRefs: { type: 'array' },
        missingRefs: { type: 'array' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Fix all identified cross-reference issues',
    'Update stale references to current content',
    'Repair broken references or convert to tombstones',
    'Add suggested missing cross-references',
    'Return summary of all actions taken'
  ]
});

const commitVaultChangesTask = defineTask('cog-commit-vault-changes', {
  kind: 'agent',
  title: 'Commit Vault Changes to Git',
  labels: ['cog', 'vault', 'git', 'commit'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        message: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Stage all vault changes',
    'Commit with the provided descriptive message',
    'Ensure no sensitive files are committed',
    'Return commit hash and summary'
  ]
});

const checkVaultStructureTask = defineTask('cog-check-vault-structure', {
  kind: 'agent',
  title: 'Check Vault Structure Health',
  labels: ['cog', 'vault', 'health', 'structure'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Verify all required COG directories exist: 00-inbox through 05-knowledge',
    'Check for unexpected files or directories',
    'Verify directory permissions and accessibility',
    'Score structure health (0-100) and provide recommendations'
  ]
});

const checkCrossRefHealthTask = defineTask('cog-check-cross-ref-health', {
  kind: 'agent',
  title: 'Check Cross-Reference Health',
  labels: ['cog', 'vault', 'health', 'cross-reference'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Assess overall cross-reference health',
    'Count total, valid, broken, and stale references',
    'Calculate reference density (refs per file)',
    'Score health (0-100) and provide recommendations'
  ]
});

const checkGitHealthTask = defineTask('cog-check-git-health', {
  kind: 'agent',
  title: 'Check Git Repository Health',
  labels: ['cog', 'vault', 'health', 'git'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Check Git repository status: clean, uncommitted changes, untracked files',
    'Verify .gitignore is properly configured',
    'Check commit history health: frequency, message quality',
    'Score health (0-100) and provide recommendations'
  ]
});

const checkContentHealthTask = defineTask('cog-check-content-health', {
  kind: 'agent',
  title: 'Check Content Health',
  labels: ['cog', 'vault', 'health', 'content'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Assess content quality across vault sections',
    'Check metadata completeness and consistency',
    'Verify domain separation is maintained',
    'Identify content gaps and stale entries',
    'Score health (0-100) and provide recommendations'
  ]
});
