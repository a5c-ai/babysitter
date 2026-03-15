/**
 * @process methodologies/cog-second-brain/cog-intelligence-cycle
 * @description COG Second Brain - Intelligence cycle: daily brief, team brief, comprehensive analysis
 * @inputs { vaultPath: string, mode: string, userName: string, rolePack?: string, integrations?: object, targetQuality?: number }
 * @outputs { success: boolean, brief: object, sources: array, qualityScore: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * COG Intelligence Cycle Process
 *
 * Adapted from COG Second Brain (https://github.com/huytieu/COG-second-brain)
 * Handles three intelligence modes:
 * 1. Daily Brief - Personalized verified news with 7-day freshness
 * 2. Team Brief - Cross-reference GitHub+Linear+Slack+PostHog
 * 3. Comprehensive Analysis - Deep 7-day strategic analysis (~8-12 min)
 *
 * Quality Patterns:
 * - 7-day freshness requirement on all sources
 * - Verification-first with sourced intelligence
 * - 95%+ source accuracy target
 * - Confidence levels on all claims
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.vaultPath - Path to COG vault
 * @param {string} inputs.mode - Intelligence mode: 'daily-brief', 'team-brief', 'comprehensive'
 * @param {string} inputs.userName - User display name
 * @param {string} inputs.rolePack - User role pack (default: 'engineer')
 * @param {Object} inputs.integrations - External integrations config
 * @param {number} inputs.targetQuality - Minimum quality score (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Intelligence results
 */
export async function process(inputs, ctx) {
  const {
    vaultPath,
    mode,
    userName,
    rolePack = 'engineer',
    integrations = {},
    targetQuality = 80
  } = inputs;

  const results = {
    mode,
    brief: {},
    sources: [],
    qualityScore: 0
  };

  ctx.log('Starting intelligence cycle', { mode, userName, rolePack });

  // ============================================================================
  // DAILY BRIEF MODE
  // ============================================================================

  if (mode === 'daily-brief') {
    ctx.log('Generating daily intelligence brief');

    // Step 1: Gather sources based on role and interests
    const sourceGathering = await ctx.task(gatherSourcesTask, {
      vaultPath,
      rolePack,
      userName,
      freshnessWindowDays: 7
    });

    // Step 2: Verify and filter sources
    const verification = await ctx.task(verifySourcesTask, {
      sources: sourceGathering.sources,
      accuracyTarget: 0.95
    });

    results.sources = verification.verifiedSources;

    // Step 3: Generate personalized brief
    const brief = await ctx.task(generateDailyBriefTask, {
      vaultPath,
      userName,
      rolePack,
      verifiedSources: verification.verifiedSources,
      targetQuality
    });

    results.brief = brief;
    results.qualityScore = brief.qualityScore || 0;

    // Quality-gated convergence
    let iteration = 0;
    while (results.qualityScore < targetQuality && iteration < 3) {
      ctx.log('Daily brief quality below threshold, refining', {
        current: results.qualityScore,
        target: targetQuality,
        iteration: iteration + 1
      });

      const refined = await ctx.task(refineBriefTask, {
        vaultPath,
        previousBrief: results.brief,
        targetQuality,
        mode: 'daily-brief',
        iteration: iteration + 1
      });

      results.brief = refined;
      results.qualityScore = refined.qualityScore || 0;
      iteration++;
    }

    // Write brief to vault
    await ctx.task(writeBriefToVaultTask, {
      vaultPath,
      brief: results.brief,
      briefType: 'daily',
      sources: results.sources
    });

    ctx.log('Daily brief complete', {
      newsItems: results.brief.itemCount,
      qualityScore: results.qualityScore
    });
  }

  // ============================================================================
  // TEAM BRIEF MODE
  // ============================================================================

  if (mode === 'team-brief') {
    ctx.log('Generating team intelligence brief');

    // Gather data from all integrations in parallel
    const integrationTasks = [];

    if (integrations.github) {
      integrationTasks.push(
        ctx.task(gatherGitHubDataTask, {
          config: integrations.github,
          vaultPath
        })
      );
    }

    if (integrations.linear) {
      integrationTasks.push(
        ctx.task(gatherLinearDataTask, {
          config: integrations.linear,
          vaultPath
        })
      );
    }

    if (integrations.slack) {
      integrationTasks.push(
        ctx.task(gatherSlackDataTask, {
          config: integrations.slack,
          vaultPath
        })
      );
    }

    if (integrations.posthog) {
      integrationTasks.push(
        ctx.task(gatherPostHogDataTask, {
          config: integrations.posthog,
          vaultPath
        })
      );
    }

    const integrationResults = integrationTasks.length > 0
      ? await ctx.parallel.all(integrationTasks)
      : [];

    // Cross-reference all platform data
    const crossReference = await ctx.task(crossReferencePlatformsTask, {
      integrationData: integrationResults,
      vaultPath,
      targetQuality
    });

    // Generate team brief with bidirectional sync
    const teamBrief = await ctx.task(generateTeamBriefTask, {
      vaultPath,
      crossReference,
      integrations,
      targetQuality
    });

    results.brief = teamBrief;
    results.qualityScore = teamBrief.qualityScore || 0;

    // Write team brief to vault
    await ctx.task(writeBriefToVaultTask, {
      vaultPath,
      brief: results.brief,
      briefType: 'team',
      sources: crossReference.sources || []
    });

    ctx.log('Team brief complete', {
      platformsCrossReferenced: integrationResults.length,
      qualityScore: results.qualityScore
    });
  }

  // ============================================================================
  // COMPREHENSIVE ANALYSIS MODE
  // ============================================================================

  if (mode === 'comprehensive') {
    ctx.log('Starting comprehensive 7-day analysis');

    // Step 1: Gather all vault data from past 7 days
    const vaultData = await ctx.task(gatherWeeklyVaultDataTask, {
      vaultPath,
      windowDays: 7
    });

    // Step 2: Run parallel analysis streams
    const [trendAnalysis, riskAnalysis, opportunityAnalysis] = await ctx.parallel.all([
      ctx.task(analyzeTrendsTask, {
        vaultData,
        rolePack,
        vaultPath,
        targetQuality
      }),
      ctx.task(analyzeRisksTask, {
        vaultData,
        rolePack,
        vaultPath,
        targetQuality
      }),
      ctx.task(analyzeOpportunitiesTask, {
        vaultData,
        rolePack,
        vaultPath,
        targetQuality
      })
    ]);

    // Step 3: Synthesize strategic recommendations
    const synthesis = await ctx.task(synthesizeStrategicRecommendationsTask, {
      vaultPath,
      userName,
      rolePack,
      trends: trendAnalysis,
      risks: riskAnalysis,
      opportunities: opportunityAnalysis,
      targetQuality
    });

    results.brief = {
      trends: trendAnalysis,
      risks: riskAnalysis,
      opportunities: opportunityAnalysis,
      recommendations: synthesis,
      qualityScore: synthesis.qualityScore || 0
    };
    results.qualityScore = synthesis.qualityScore || 0;

    // Quality-gated convergence
    let iteration = 0;
    while (results.qualityScore < targetQuality && iteration < 3) {
      ctx.log('Comprehensive analysis quality below threshold, refining', {
        current: results.qualityScore,
        target: targetQuality
      });

      const refined = await ctx.task(refineBriefTask, {
        vaultPath,
        previousBrief: results.brief,
        targetQuality,
        mode: 'comprehensive',
        iteration: iteration + 1
      });

      results.brief = refined;
      results.qualityScore = refined.qualityScore || 0;
      iteration++;
    }

    // Human review gate for strategic analysis
    await ctx.breakpoint({
      title: 'Review Comprehensive Analysis',
      description: 'Deep 7-day analysis complete. Review strategic recommendations before committing to vault.',
      context: { recommendations: synthesis, qualityScore: results.qualityScore }
    });

    // Write to vault
    await ctx.task(writeBriefToVaultTask, {
      vaultPath,
      brief: results.brief,
      briefType: 'comprehensive',
      sources: results.sources
    });

    ctx.log('Comprehensive analysis complete', {
      trendCount: trendAnalysis.trendCount,
      riskCount: riskAnalysis.riskCount,
      opportunityCount: opportunityAnalysis.opportunityCount,
      qualityScore: results.qualityScore
    });
  }

  results.success = true;
  return results;
}

// =============================================================================
// TASK DEFINITIONS
// =============================================================================

const gatherSourcesTask = defineTask('cog-gather-sources', {
  kind: 'agent',
  title: 'Gather Intelligence Sources',
  labels: ['cog', 'intelligence', 'sources'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        rolePack: { type: 'string' },
        userName: { type: 'string' },
        freshnessWindowDays: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Gather news and intelligence sources based on user role and interests',
    'Enforce strict 7-day freshness window',
    'Prioritize sources relevant to user role pack',
    'Include diverse source types: news, research, industry reports',
    'Return raw sources with metadata for verification'
  ]
});

const verifySourcesTask = defineTask('cog-verify-sources', {
  kind: 'agent',
  title: 'Verify Source Accuracy',
  labels: ['cog', 'intelligence', 'verification'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        sources: { type: 'array' },
        accuracyTarget: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Apply verification-first methodology to all sources',
    'Cross-reference claims across multiple sources',
    'Assign confidence levels: high, medium, low',
    'Target 95%+ source accuracy',
    'Filter out unverifiable or outdated sources',
    'Flag potential misinformation or bias'
  ]
});

const generateDailyBriefTask = defineTask('cog-generate-daily-brief', {
  kind: 'agent',
  title: 'Generate Personalized Daily Brief',
  labels: ['cog', 'intelligence', 'daily', 'brief'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        verifiedSources: { type: 'array' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Generate personalized daily intelligence brief from verified sources',
    'Structure by relevance to user role and interests',
    'Include confidence levels for each item',
    'Add source attribution for every claim',
    'Cross-reference with existing vault knowledge',
    'Score brief quality against target threshold'
  ]
});

const refineBriefTask = defineTask('cog-refine-brief', {
  kind: 'agent',
  title: 'Refine Intelligence Brief Quality',
  labels: ['cog', 'intelligence', 'refinement'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        previousBrief: { type: 'object' },
        targetQuality: { type: 'number' },
        mode: { type: 'string' },
        iteration: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Review previous brief and identify quality gaps',
    'Strengthen source verification and confidence levels',
    'Improve personalization relevance',
    'Enhance cross-references to vault knowledge',
    'Re-score quality and return improved brief'
  ]
});

const writeBriefToVaultTask = defineTask('cog-write-brief-to-vault', {
  kind: 'agent',
  title: 'Write Brief to Vault',
  labels: ['cog', 'intelligence', 'vault', 'write'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        brief: { type: 'object' },
        briefType: { type: 'string' },
        sources: { type: 'array' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Write intelligence brief to 01-daily/ in standardized markdown format',
    'Include frontmatter with date, type, quality score, and source count',
    'Add source attribution section with all verified references',
    'Create cross-references to related vault entries',
    'Commit to Git with descriptive message'
  ]
});

const gatherGitHubDataTask = defineTask('cog-gather-github', {
  kind: 'agent',
  title: 'Gather GitHub Activity Data',
  labels: ['cog', 'intelligence', 'team', 'github'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/team-synthesizer'
  },
  instructions: [
    'Gather recent GitHub activity: PRs, issues, commits, reviews',
    'Extract key metrics: velocity, review turnaround, open issues',
    'Identify blockers and stale items',
    'Return structured activity data for cross-referencing'
  ]
});

const gatherLinearDataTask = defineTask('cog-gather-linear', {
  kind: 'agent',
  title: 'Gather Linear Activity Data',
  labels: ['cog', 'intelligence', 'team', 'linear'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/team-synthesizer'
  },
  instructions: [
    'Gather recent Linear activity: issues, cycles, projects',
    'Extract sprint progress and backlog health',
    'Identify priority shifts and blocked items',
    'Return structured data for cross-referencing'
  ]
});

const gatherSlackDataTask = defineTask('cog-gather-slack', {
  kind: 'agent',
  title: 'Gather Slack Activity Data',
  labels: ['cog', 'intelligence', 'team', 'slack'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/team-synthesizer'
  },
  instructions: [
    'Gather recent Slack activity: key discussions, decisions, threads',
    'Identify important conversations and unresolved questions',
    'Extract informal decisions and commitments',
    'Return structured data for cross-referencing'
  ]
});

const gatherPostHogDataTask = defineTask('cog-gather-posthog', {
  kind: 'agent',
  title: 'Gather PostHog Analytics Data',
  labels: ['cog', 'intelligence', 'team', 'posthog'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object' },
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/team-synthesizer'
  },
  instructions: [
    'Gather recent PostHog analytics: key metrics, feature flags, experiments',
    'Identify significant user behavior changes',
    'Extract funnel performance and retention data',
    'Return structured data for cross-referencing'
  ]
});

const crossReferencePlatformsTask = defineTask('cog-cross-reference-platforms', {
  kind: 'agent',
  title: 'Cross-Reference Platform Data',
  labels: ['cog', 'intelligence', 'team', 'cross-reference'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        integrationData: { type: 'array' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/team-synthesizer'
  },
  instructions: [
    'Cross-reference data from GitHub, Linear, Slack, and PostHog',
    'Identify patterns spanning multiple platforms',
    'Detect misalignment between tools (e.g., Slack decisions not in Linear)',
    'Build unified team activity view',
    'Flag items requiring immediate attention'
  ]
});

const generateTeamBriefTask = defineTask('cog-generate-team-brief', {
  kind: 'agent',
  title: 'Generate Team Intelligence Brief',
  labels: ['cog', 'intelligence', 'team', 'brief'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        crossReference: { type: 'object' },
        integrations: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/team-synthesizer'
  },
  instructions: [
    'Generate team intelligence brief from cross-referenced data',
    'Support bidirectional sync between platforms',
    'Highlight blockers, wins, and areas needing attention',
    'Include actionable recommendations for team leads',
    'Score brief quality against target threshold'
  ]
});

const gatherWeeklyVaultDataTask = defineTask('cog-gather-weekly-vault-data', {
  kind: 'agent',
  title: 'Gather Weekly Vault Data',
  labels: ['cog', 'intelligence', 'weekly', 'data'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        windowDays: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Gather all vault data from the past 7 days',
    'Include daily briefs, braindumps, team syncs, meeting notes',
    'Index by date, domain, and topic',
    'Prepare unified dataset for comprehensive analysis'
  ]
});

const analyzeTrendsTask = defineTask('cog-analyze-trends', {
  kind: 'agent',
  title: 'Analyze Weekly Trends',
  labels: ['cog', 'intelligence', 'comprehensive', 'trends'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultData: { type: 'object' },
        rolePack: { type: 'string' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Identify trending topics and themes over 7 days',
    'Analyze momentum: accelerating, stable, or declining',
    'Map trends to user role and interests',
    'Include confidence levels and source attribution'
  ]
});

const analyzeRisksTask = defineTask('cog-analyze-risks', {
  kind: 'agent',
  title: 'Analyze Weekly Risks',
  labels: ['cog', 'intelligence', 'comprehensive', 'risks'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultData: { type: 'object' },
        rolePack: { type: 'string' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Identify risks and potential issues from weekly data',
    'Classify by severity: critical, high, medium, low',
    'Assess probability and potential impact',
    'Suggest mitigation strategies',
    'Include source attribution for risk evidence'
  ]
});

const analyzeOpportunitiesTask = defineTask('cog-analyze-opportunities', {
  kind: 'agent',
  title: 'Analyze Weekly Opportunities',
  labels: ['cog', 'intelligence', 'comprehensive', 'opportunities'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultData: { type: 'object' },
        rolePack: { type: 'string' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Identify opportunities from weekly data patterns',
    'Classify by type: strategic, tactical, quick-win',
    'Assess effort vs impact for each opportunity',
    'Map to user role capabilities',
    'Include confidence levels and supporting evidence'
  ]
});

const synthesizeStrategicRecommendationsTask = defineTask('cog-synthesize-strategic', {
  kind: 'agent',
  title: 'Synthesize Strategic Recommendations',
  labels: ['cog', 'intelligence', 'comprehensive', 'strategic'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        trends: { type: 'object' },
        risks: { type: 'object' },
        opportunities: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/intelligence-analyst'
  },
  instructions: [
    'Synthesize trends, risks, and opportunities into strategic recommendations',
    'Prioritize by impact and alignment with user role',
    'Provide actionable next steps for each recommendation',
    'Include timeline estimates and resource requirements',
    'Score overall analysis quality against target',
    'Cross-reference with 05-knowledge/ frameworks'
  ]
});
