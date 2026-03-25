/**
 * @process methodologies/cog-second-brain/cog-orchestrator
 * @description COG Second Brain - Main orchestrator: vault setup, onboarding, daily/weekly/monthly evolution cycles
 * @inputs { userName: string, rolePack?: string, vaultPath?: string, integrations?: object, cycleMode?: string, targetQuality?: number }
 * @outputs { success: boolean, vault: object, profile: object, cycles: object, knowledgeBase: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * COG Second Brain - Main Orchestrator
 *
 * Adapted from COG Second Brain (https://github.com/huytieu/COG-second-brain)
 * A self-evolving second brain system combining AI agents with markdown files
 * and version control. COG = Cognition + Obsidian + Git.
 *
 * Evolution Cycle:
 * 1. Vault Setup - Initialize directory structure and Git tracking
 * 2. Onboarding - Personalize workflow via role pack selection
 * 3. Daily Cycle - Capture, intelligence gathering, team sync
 * 4. Weekly Cycle - Reflection and pattern analysis
 * 5. Monthly Cycle - Knowledge consolidation and framework synthesis
 *
 * Role Packs: Product Manager, Engineering Lead, Engineer, Designer,
 *             Founder, Marketer, Custom
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.userName - User's display name
 * @param {string} inputs.rolePack - Role pack: 'product-manager', 'engineering-lead', 'engineer', 'designer', 'founder', 'marketer', 'custom' (default: 'engineer')
 * @param {string} inputs.vaultPath - Path to vault directory (default: './cog-vault')
 * @param {Object} inputs.integrations - External integrations config { github?: object, linear?: object, slack?: object, posthog?: object }
 * @param {string} inputs.cycleMode - Cycle to execute: 'setup', 'daily', 'weekly', 'monthly', 'full' (default: 'full')
 * @param {number} inputs.targetQuality - Minimum quality score for outputs (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Complete orchestration results
 */
export async function process(inputs, ctx) {
  const {
    userName,
    rolePack = 'engineer',
    vaultPath = './cog-vault',
    integrations = {},
    cycleMode = 'full',
    targetQuality = 80
  } = inputs;

  const results = {
    userName,
    rolePack,
    vaultPath,
    cycleMode,
    phases: {}
  };

  ctx.log('Starting COG Second Brain orchestration', { userName, rolePack, cycleMode });

  // ============================================================================
  // PHASE 1: VAULT SETUP (Agent: vault-architect)
  // ============================================================================

  if (cycleMode === 'setup' || cycleMode === 'full') {
    ctx.log('Phase 1: Vault setup');

    const vaultSetup = await ctx.task(initializeVaultTask, {
      vaultPath,
      userName,
      rolePack
    });

    results.phases.setup = vaultSetup;

    // Human review gate for vault structure
    await ctx.breakpoint({
      title: 'Review Vault Structure',
      description: `Vault initialized at ${vaultPath} with COG directory structure. Review the layout before proceeding.`,
      context: { vaultSetup }
    });

    ctx.log('Vault setup complete', { directories: vaultSetup.directories });
  }

  // ============================================================================
  // PHASE 2: ONBOARDING (Agent: role-advisor)
  // ============================================================================

  if (cycleMode === 'setup' || cycleMode === 'full') {
    ctx.log('Phase 2: Onboarding');

    const onboarding = await ctx.task(onboardingTask, {
      userName,
      rolePack,
      vaultPath,
      integrations
    });

    results.phases.onboarding = onboarding;
    results.profile = onboarding.profile;

    // Breakpoint: confirm role pack personalization
    await ctx.breakpoint({
      title: 'Confirm Onboarding Profile',
      description: `Role pack "${rolePack}" configured for ${userName}. Review personalization settings.`,
      context: { profile: onboarding.profile }
    });

    ctx.log('Onboarding complete', { rolePack, interests: onboarding.profile.interests });
  }

  // ============================================================================
  // PHASE 3: DAILY CYCLE (Agents: knowledge-curator, intelligence-analyst, team-synthesizer)
  // ============================================================================

  if (cycleMode === 'daily' || cycleMode === 'full') {
    ctx.log('Phase 3: Daily cycle');

    // Run daily capture, intelligence, and team sync in parallel
    const [captureResult, intelligenceResult, teamResult] = await ctx.parallel.all([
      ctx.task(dailyCaptureTask, {
        vaultPath,
        userName,
        rolePack,
        targetQuality
      }),
      ctx.task(dailyIntelligenceTask, {
        vaultPath,
        userName,
        rolePack,
        integrations,
        targetQuality
      }),
      ctx.task(dailyTeamSyncTask, {
        vaultPath,
        integrations,
        targetQuality
      })
    ]);

    results.phases.daily = {
      capture: captureResult,
      intelligence: intelligenceResult,
      teamSync: teamResult
    };

    ctx.log('Daily cycle complete', {
      capturedItems: captureResult.itemCount,
      newsItems: intelligenceResult.briefCount,
      teamUpdates: teamResult.updateCount
    });
  }

  // ============================================================================
  // PHASE 4: WEEKLY CYCLE (Agents: reflection-coach, intelligence-analyst)
  // ============================================================================

  if (cycleMode === 'weekly' || cycleMode === 'full') {
    ctx.log('Phase 4: Weekly cycle');

    const weeklyReflection = await ctx.task(weeklyReflectionTask, {
      vaultPath,
      userName,
      rolePack,
      targetQuality
    });

    // Quality-gated convergence loop for weekly analysis
    let weeklyQuality = weeklyReflection.qualityScore || 0;
    let weeklyResult = weeklyReflection;
    let iterations = 0;
    const maxIterations = 3;

    while (weeklyQuality < targetQuality && iterations < maxIterations) {
      ctx.log('Weekly reflection quality below threshold, refining', {
        current: weeklyQuality,
        target: targetQuality,
        iteration: iterations + 1
      });

      weeklyResult = await ctx.task(refineWeeklyReflectionTask, {
        vaultPath,
        previousResult: weeklyResult,
        targetQuality,
        iteration: iterations + 1
      });

      weeklyQuality = weeklyResult.qualityScore || 0;
      iterations++;
    }

    // Comprehensive deep-dive analysis (8-12 min)
    const deepDive = await ctx.task(comprehensiveAnalysisTask, {
      vaultPath,
      userName,
      rolePack,
      weeklyReflection: weeklyResult,
      targetQuality
    });

    results.phases.weekly = {
      reflection: weeklyResult,
      deepDive,
      refinementIterations: iterations
    };

    // Human review gate for weekly insights
    await ctx.breakpoint({
      title: 'Review Weekly Insights',
      description: 'Weekly reflection and deep-dive analysis complete. Review patterns and strategic recommendations.',
      context: { reflection: weeklyResult, deepDive }
    });

    ctx.log('Weekly cycle complete', {
      patterns: weeklyResult.patternCount,
      qualityScore: weeklyQuality
    });
  }

  // ============================================================================
  // PHASE 5: MONTHLY CYCLE (Agents: framework-builder, knowledge-curator)
  // ============================================================================

  if (cycleMode === 'monthly' || cycleMode === 'full') {
    ctx.log('Phase 5: Monthly cycle');

    const synthesis = await ctx.task(monthlySynthesisTask, {
      vaultPath,
      userName,
      rolePack,
      targetQuality
    });

    // Quality-gated convergence for knowledge consolidation
    let synthesisQuality = synthesis.qualityScore || 0;
    let synthesisResult = synthesis;
    let synthIterations = 0;

    while (synthesisQuality < targetQuality && synthIterations < 3) {
      ctx.log('Monthly synthesis quality below threshold, refining', {
        current: synthesisQuality,
        target: targetQuality
      });

      synthesisResult = await ctx.task(refineSynthesisTask, {
        vaultPath,
        previousResult: synthesisResult,
        targetQuality,
        iteration: synthIterations + 1
      });

      synthesisQuality = synthesisResult.qualityScore || 0;
      synthIterations++;
    }

    results.phases.monthly = {
      synthesis: synthesisResult,
      refinementIterations: synthIterations
    };

    results.knowledgeBase = synthesisResult.frameworks;

    // Human review gate for consolidated knowledge
    await ctx.breakpoint({
      title: 'Review Monthly Knowledge Consolidation',
      description: 'Monthly synthesis complete. Review consolidated frameworks and knowledge base updates.',
      context: { synthesis: synthesisResult }
    });

    ctx.log('Monthly cycle complete', {
      frameworks: synthesisResult.frameworkCount,
      qualityScore: synthesisQuality
    });
  }

  // ============================================================================
  // PHASE 6: VAULT MAINTENANCE (Agent: vault-architect)
  // ============================================================================

  if (cycleMode === 'full') {
    ctx.log('Phase 6: Vault maintenance');

    const maintenance = await ctx.task(vaultMaintenanceTask, {
      vaultPath,
      targetQuality
    });

    results.phases.maintenance = maintenance;

    ctx.log('Vault maintenance complete', {
      crossRefsUpdated: maintenance.crossRefsUpdated,
      selfHealingActions: maintenance.selfHealingActions
    });
  }

  results.success = true;
  ctx.log('COG Second Brain orchestration complete', { cycleMode, phases: Object.keys(results.phases) });

  return results;
}

// =============================================================================
// TASK DEFINITIONS
// =============================================================================

const initializeVaultTask = defineTask('cog-initialize-vault', {
  kind: 'agent',
  title: 'Initialize COG Vault Structure',
  labels: ['cog', 'vault', 'setup'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Create the COG vault directory structure:',
    '  00-inbox/ (profiles, interests, integrations)',
    '  01-daily/ (briefs & check-ins)',
    '  02-personal/ (private braindumps)',
    '  03-professional/ (professional notes & strategy)',
    '  04-projects/ (per-project tracking)',
    '  05-knowledge/ (consolidated frameworks)',
    'Initialize Git repository for version control',
    'Create initial profile from role pack',
    'Set up .gitignore for privacy-sensitive files',
    'Ensure pure markdown format - no vendor lock-in'
  ]
});

const onboardingTask = defineTask('cog-onboarding', {
  kind: 'agent',
  title: 'COG Onboarding - Personalize Workflow',
  labels: ['cog', 'onboarding', 'personalization'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        vaultPath: { type: 'string' },
        integrations: { type: 'object' }
      }
    },
    outputPath: 'agents/role-advisor'
  },
  instructions: [
    'Configure role pack personalization for the user',
    'Available role packs: Product Manager, Engineering Lead, Engineer, Designer, Founder, Marketer, Custom',
    'Set up 00-inbox/profile.md with user preferences and interests',
    'Configure integration connections (GitHub, Linear, Slack, PostHog)',
    'Establish domain-specific news sources for daily intelligence',
    'Create personalized workflow templates based on role',
    'Output profile object with interests, domains, sources, and workflow config'
  ]
});

const dailyCaptureTask = defineTask('cog-daily-capture', {
  kind: 'agent',
  title: 'Daily Thought Capture & Classification',
  labels: ['cog', 'daily', 'capture', 'braindump'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Process raw braindump thoughts with automatic classification',
    'Classify content by domain: personal, professional, project-specific',
    'Route classified items to appropriate vault directories',
    'Extract URLs and key references for later processing',
    'Maintain strict domain separation (02-personal vs 03-professional)',
    'Tag entries with metadata: date, domain, confidence, source'
  ]
});

const dailyIntelligenceTask = defineTask('cog-daily-intelligence', {
  kind: 'agent',
  title: 'Daily News Intelligence Brief',
  labels: ['cog', 'daily', 'intelligence', 'news'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        integrations: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Generate personalized daily intelligence brief',
    'Enforce 7-day freshness requirement on all sources',
    'Apply verification-first methodology: all claims must have sources',
    'Target 95%+ source accuracy',
    'Include confidence levels for each intelligence item',
    'Filter and rank by relevance to user role and interests',
    'Write brief to 01-daily/ with standardized format',
    'Cross-reference with existing knowledge in 05-knowledge/'
  ]
});

const dailyTeamSyncTask = defineTask('cog-daily-team-sync', {
  kind: 'agent',
  title: 'Daily Team Sync - Cross-Platform Integration',
  labels: ['cog', 'daily', 'team', 'sync'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        integrations: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/team-synthesizer'
  },
  instructions: [
    'Cross-reference GitHub, Linear, Slack, and PostHog activity',
    'Enable bidirectional sync between platforms',
    'Identify cross-platform patterns and blockers',
    'Generate team activity digest in 01-daily/',
    'Flag items requiring attention based on priority and staleness',
    'Maintain team context graph in 04-projects/'
  ]
});

const weeklyReflectionTask = defineTask('cog-weekly-reflection', {
  kind: 'agent',
  title: 'Weekly Check-in & Pattern Analysis',
  labels: ['cog', 'weekly', 'reflection', 'patterns'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Perform cross-domain pattern analysis over the past week',
    'Analyze daily briefs, braindumps, and team syncs for recurring themes',
    'Identify connections between personal and professional domains',
    'Generate actionable insights with confidence levels',
    'Score quality of weekly reflection (aim for targetQuality threshold)',
    'Write reflection to 01-daily/ with cross-references'
  ]
});

const refineWeeklyReflectionTask = defineTask('cog-refine-weekly', {
  kind: 'agent',
  title: 'Refine Weekly Reflection Quality',
  labels: ['cog', 'weekly', 'refinement', 'quality'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        previousResult: { type: 'object' },
        targetQuality: { type: 'number' },
        iteration: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Review previous weekly reflection and identify quality gaps',
    'Deepen pattern analysis with additional cross-references',
    'Strengthen source attribution and confidence levels',
    'Improve actionability of insights',
    'Re-score quality and return updated result'
  ]
});

const comprehensiveAnalysisTask = defineTask('cog-comprehensive-analysis', {
  kind: 'agent',
  title: 'Comprehensive 7-Day Deep-Dive Analysis',
  labels: ['cog', 'weekly', 'deep-dive', 'strategic'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        weeklyReflection: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Perform deep 7-day analysis for strategic planning (~8-12 min)',
    'Synthesize all daily briefs, team syncs, and captured knowledge',
    'Build strategic recommendations based on accumulated patterns',
    'Cross-reference with 05-knowledge/ frameworks',
    'Generate role-specific strategic insights',
    'Include confidence levels and source attribution for all claims'
  ]
});

const monthlySynthesisTask = defineTask('cog-monthly-synthesis', {
  kind: 'agent',
  title: 'Monthly Knowledge Synthesis & Framework Building',
  labels: ['cog', 'monthly', 'synthesis', 'frameworks'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/framework-builder'
  },
  instructions: [
    'Consolidate scattered notes into structured frameworks',
    'Transform weekly reflections into permanent knowledge',
    'Build and update frameworks in 05-knowledge/',
    'Identify knowledge gaps and suggest exploration areas',
    'Score consolidation quality against target threshold',
    'Preserve all source attribution through consolidation'
  ]
});

const refineSynthesisTask = defineTask('cog-refine-synthesis', {
  kind: 'agent',
  title: 'Refine Monthly Synthesis Quality',
  labels: ['cog', 'monthly', 'refinement', 'quality'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        previousResult: { type: 'object' },
        targetQuality: { type: 'number' },
        iteration: { type: 'number' }
      }
    },
    outputPath: 'agents/framework-builder'
  },
  instructions: [
    'Review previous synthesis and identify quality gaps',
    'Deepen framework connections and cross-references',
    'Strengthen knowledge consolidation completeness',
    'Improve framework actionability and clarity',
    'Re-score quality and return updated result'
  ]
});

const vaultMaintenanceTask = defineTask('cog-vault-maintenance', {
  kind: 'agent',
  title: 'Vault Maintenance & Self-Healing',
  labels: ['cog', 'maintenance', 'self-healing'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Run self-healing: detect and fix broken cross-references',
    'Auto-update cross-references after renames or restructuring',
    'Verify vault directory structure integrity',
    'Commit all changes to Git with descriptive messages',
    'Report maintenance actions taken',
    'Ensure content-safe updates (framework separates from personal data)'
  ]
});
