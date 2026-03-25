/**
 * @process methodologies/cog-second-brain/cog-reflection-synthesis
 * @description COG Second Brain - Reflection and synthesis: weekly check-in, knowledge consolidation, monthly synthesis
 * @inputs { vaultPath: string, mode: string, userName: string, rolePack?: string, targetQuality?: number }
 * @outputs { success: boolean, reflection: object, frameworks: array, qualityScore: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * COG Reflection & Synthesis Process
 *
 * Adapted from COG Second Brain (https://github.com/huytieu/COG-second-brain)
 * Handles reflection and knowledge synthesis modes:
 * 1. Weekly Check-in - Cross-domain pattern analysis
 * 2. Knowledge Consolidation - Build frameworks from scattered notes
 * 3. Monthly Synthesis - Full knowledge base evolution cycle
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.vaultPath - Path to COG vault
 * @param {string} inputs.mode - Mode: 'weekly-checkin', 'knowledge-consolidation', 'monthly-synthesis'
 * @param {string} inputs.userName - User display name
 * @param {string} inputs.rolePack - User role pack (default: 'engineer')
 * @param {number} inputs.targetQuality - Minimum quality score (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Reflection and synthesis results
 */
export async function process(inputs, ctx) {
  const {
    vaultPath,
    mode,
    userName,
    rolePack = 'engineer',
    targetQuality = 80
  } = inputs;

  const results = {
    mode,
    reflection: {},
    frameworks: [],
    qualityScore: 0
  };

  ctx.log('Starting reflection/synthesis cycle', { mode, userName });

  // ============================================================================
  // WEEKLY CHECK-IN MODE
  // ============================================================================

  if (mode === 'weekly-checkin') {
    ctx.log('Running weekly check-in');

    // Step 1: Gather week's data from all vault sections
    const weekData = await ctx.task(gatherWeekDataTask, {
      vaultPath,
      sections: ['01-daily', '02-personal', '03-professional', '04-projects']
    });

    // Step 2: Run cross-domain pattern analysis
    const [personalPatterns, professionalPatterns, projectPatterns] = await ctx.parallel.all([
      ctx.task(analyzePersonalPatternsTask, {
        data: weekData.personal,
        vaultPath,
        targetQuality
      }),
      ctx.task(analyzeProfessionalPatternsTask, {
        data: weekData.professional,
        vaultPath,
        targetQuality
      }),
      ctx.task(analyzeProjectPatternsTask, {
        data: weekData.projects,
        vaultPath,
        targetQuality
      })
    ]);

    // Step 3: Cross-domain synthesis
    const crossDomainAnalysis = await ctx.task(crossDomainSynthesisTask, {
      personalPatterns,
      professionalPatterns,
      projectPatterns,
      vaultPath,
      userName,
      rolePack,
      targetQuality
    });

    results.reflection = {
      personalPatterns,
      professionalPatterns,
      projectPatterns,
      crossDomain: crossDomainAnalysis,
      patternCount: crossDomainAnalysis.patternCount || 0
    };
    results.qualityScore = crossDomainAnalysis.qualityScore || 0;

    // Quality-gated convergence
    let iteration = 0;
    while (results.qualityScore < targetQuality && iteration < 3) {
      ctx.log('Weekly check-in quality below threshold, refining', {
        current: results.qualityScore,
        target: targetQuality
      });

      const refined = await ctx.task(refineReflectionTask, {
        vaultPath,
        previousReflection: results.reflection,
        targetQuality,
        mode: 'weekly-checkin',
        iteration: iteration + 1
      });

      results.reflection = refined;
      results.qualityScore = refined.qualityScore || 0;
      iteration++;
    }

    // Write weekly check-in to vault
    await ctx.task(writeReflectionToVaultTask, {
      vaultPath,
      reflection: results.reflection,
      reflectionType: 'weekly-checkin'
    });

    // Human review gate
    await ctx.breakpoint({
      title: 'Review Weekly Check-in',
      description: `Weekly check-in complete. ${results.reflection.patternCount || 0} cross-domain patterns identified.`,
      context: { reflection: results.reflection, qualityScore: results.qualityScore }
    });

    ctx.log('Weekly check-in complete', {
      patternCount: results.reflection.patternCount,
      qualityScore: results.qualityScore
    });
  }

  // ============================================================================
  // KNOWLEDGE CONSOLIDATION MODE
  // ============================================================================

  if (mode === 'knowledge-consolidation') {
    ctx.log('Running knowledge consolidation');

    // Step 1: Identify scattered notes needing consolidation
    const scatteredNotes = await ctx.task(identifyScatteredNotesTask, {
      vaultPath,
      sections: ['01-daily', '02-personal', '03-professional', '04-projects']
    });

    // Step 2: Cluster related notes into themes
    const clusters = await ctx.task(clusterNotesTask, {
      notes: scatteredNotes.notes,
      vaultPath,
      targetQuality
    });

    // Step 3: Build frameworks from each cluster in parallel
    const frameworkTasks = clusters.themes.map((theme) =>
      ctx.task(buildFrameworkTask, {
        theme,
        vaultPath,
        existingFrameworks: scatteredNotes.existingFrameworks,
        targetQuality
      })
    );

    const frameworks = await ctx.parallel.all(frameworkTasks);

    results.frameworks = frameworks;
    results.qualityScore = frameworks.reduce(
      (avg, f) => avg + (f.qualityScore || 0),
      0
    ) / Math.max(frameworks.length, 1);

    // Quality-gated convergence for each framework below threshold
    for (let i = 0; i < frameworks.length; i++) {
      let fw = frameworks[i];
      let fwIteration = 0;

      while ((fw.qualityScore || 0) < targetQuality && fwIteration < 3) {
        ctx.log('Framework quality below threshold, refining', {
          framework: fw.name,
          current: fw.qualityScore,
          target: targetQuality
        });

        fw = await ctx.task(refineFrameworkTask, {
          vaultPath,
          previousFramework: fw,
          targetQuality,
          iteration: fwIteration + 1
        });

        results.frameworks[i] = fw;
        fwIteration++;
      }
    }

    // Write consolidated frameworks to 05-knowledge/
    await ctx.task(writeFrameworksToVaultTask, {
      vaultPath,
      frameworks: results.frameworks
    });

    // Human review gate
    await ctx.breakpoint({
      title: 'Review Knowledge Consolidation',
      description: `${results.frameworks.length} frameworks built from scattered notes. Review before finalizing.`,
      context: { frameworks: results.frameworks }
    });

    ctx.log('Knowledge consolidation complete', {
      frameworkCount: results.frameworks.length,
      averageQuality: results.qualityScore
    });
  }

  // ============================================================================
  // MONTHLY SYNTHESIS MODE
  // ============================================================================

  if (mode === 'monthly-synthesis') {
    ctx.log('Running monthly synthesis');

    // Step 1: Gather month's weekly reflections
    const monthData = await ctx.task(gatherMonthDataTask, {
      vaultPath
    });

    // Step 2: Identify evolution patterns across weeks
    const evolution = await ctx.task(analyzeMonthlyEvolutionTask, {
      monthData,
      vaultPath,
      userName,
      rolePack,
      targetQuality
    });

    // Step 3: Run knowledge consolidation on month's accumulated notes
    const consolidation = await ctx.task(monthlyConsolidationTask, {
      vaultPath,
      evolution,
      targetQuality
    });

    // Step 4: Update personal and professional strategy
    const [personalStrategy, professionalStrategy] = await ctx.parallel.all([
      ctx.task(updatePersonalStrategyTask, {
        vaultPath,
        evolution,
        consolidation,
        targetQuality
      }),
      ctx.task(updateProfessionalStrategyTask, {
        vaultPath,
        evolution,
        consolidation,
        rolePack,
        targetQuality
      })
    ]);

    results.reflection = {
      evolution,
      consolidation,
      personalStrategy,
      professionalStrategy
    };
    results.frameworks = consolidation.frameworks || [];
    results.qualityScore = consolidation.qualityScore || 0;

    // Quality-gated convergence
    let iteration = 0;
    while (results.qualityScore < targetQuality && iteration < 3) {
      ctx.log('Monthly synthesis quality below threshold, refining', {
        current: results.qualityScore,
        target: targetQuality
      });

      const refined = await ctx.task(refineReflectionTask, {
        vaultPath,
        previousReflection: results.reflection,
        targetQuality,
        mode: 'monthly-synthesis',
        iteration: iteration + 1
      });

      results.reflection = refined;
      results.qualityScore = refined.qualityScore || 0;
      iteration++;
    }

    // Write monthly synthesis to vault
    await ctx.task(writeReflectionToVaultTask, {
      vaultPath,
      reflection: results.reflection,
      reflectionType: 'monthly-synthesis'
    });

    // Human review gate
    await ctx.breakpoint({
      title: 'Review Monthly Synthesis',
      description: 'Monthly synthesis complete. Review evolution patterns and strategy updates.',
      context: { evolution, strategies: { personalStrategy, professionalStrategy } }
    });

    ctx.log('Monthly synthesis complete', {
      frameworkCount: results.frameworks.length,
      qualityScore: results.qualityScore
    });
  }

  results.success = true;
  return results;
}

// =============================================================================
// TASK DEFINITIONS
// =============================================================================

const gatherWeekDataTask = defineTask('cog-gather-week-data', {
  kind: 'agent',
  title: 'Gather Weekly Vault Data',
  labels: ['cog', 'reflection', 'data'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Gather all vault entries from the past week',
    'Organize by section: daily, personal, professional, projects',
    'Include metadata and cross-references for each entry',
    'Index entries by date and topic for pattern analysis'
  ]
});

const analyzePersonalPatternsTask = defineTask('cog-analyze-personal-patterns', {
  kind: 'agent',
  title: 'Analyze Personal Domain Patterns',
  labels: ['cog', 'reflection', 'personal', 'patterns'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Analyze personal domain entries for recurring themes',
    'Identify energy, mood, and productivity patterns',
    'Detect personal growth trajectories',
    'Maintain strict domain separation - do not mix with professional'
  ]
});

const analyzeProfessionalPatternsTask = defineTask('cog-analyze-professional-patterns', {
  kind: 'agent',
  title: 'Analyze Professional Domain Patterns',
  labels: ['cog', 'reflection', 'professional', 'patterns'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Analyze professional domain entries for career and skill patterns',
    'Identify professional growth areas and skill gaps',
    'Detect industry trend alignment',
    'Map to role pack expectations'
  ]
});

const analyzeProjectPatternsTask = defineTask('cog-analyze-project-patterns', {
  kind: 'agent',
  title: 'Analyze Project Domain Patterns',
  labels: ['cog', 'reflection', 'project', 'patterns'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Analyze project entries for progress and blocking patterns',
    'Identify cross-project dependencies and synergies',
    'Detect velocity trends and estimation accuracy',
    'Flag projects needing attention'
  ]
});

const crossDomainSynthesisTask = defineTask('cog-cross-domain-synthesis', {
  kind: 'agent',
  title: 'Cross-Domain Pattern Synthesis',
  labels: ['cog', 'reflection', 'cross-domain', 'synthesis'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        personalPatterns: { type: 'object' },
        professionalPatterns: { type: 'object' },
        projectPatterns: { type: 'object' },
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Synthesize patterns across personal, professional, and project domains',
    'Identify connections that span domains',
    'Generate actionable insights with confidence levels',
    'Produce weekly summary with cross-domain pattern map',
    'Score synthesis quality against target threshold'
  ]
});

const refineReflectionTask = defineTask('cog-refine-reflection', {
  kind: 'agent',
  title: 'Refine Reflection Quality',
  labels: ['cog', 'reflection', 'refinement'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        previousReflection: { type: 'object' },
        targetQuality: { type: 'number' },
        mode: { type: 'string' },
        iteration: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Review previous reflection and identify quality gaps',
    'Deepen cross-domain connections',
    'Strengthen actionability of insights',
    'Improve confidence calibration',
    'Re-score and return improved reflection'
  ]
});

const writeReflectionToVaultTask = defineTask('cog-write-reflection', {
  kind: 'agent',
  title: 'Write Reflection to Vault',
  labels: ['cog', 'reflection', 'vault', 'write'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        reflection: { type: 'object' },
        reflectionType: { type: 'string' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Write reflection to 01-daily/ in standardized markdown format',
    'Include frontmatter with date, type, quality score, and pattern count',
    'Add cross-references to related vault entries',
    'For monthly synthesis, also update 05-knowledge/ frameworks',
    'Commit to Git with descriptive message'
  ]
});

const identifyScatteredNotesTask = defineTask('cog-identify-scattered-notes', {
  kind: 'agent',
  title: 'Identify Scattered Notes for Consolidation',
  labels: ['cog', 'consolidation', 'discovery'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Scan vault sections for notes not yet consolidated into frameworks',
    'Identify notes with related topics or themes',
    'List existing frameworks in 05-knowledge/ for reference',
    'Return candidate notes grouped by potential theme'
  ]
});

const clusterNotesTask = defineTask('cog-cluster-notes', {
  kind: 'agent',
  title: 'Cluster Related Notes into Themes',
  labels: ['cog', 'consolidation', 'clustering'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        notes: { type: 'array' },
        vaultPath: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Cluster related notes into coherent themes',
    'Each theme should have enough material to form a framework',
    'Identify gaps where additional capture would strengthen clusters',
    'Return themed clusters with confidence scores'
  ]
});

const buildFrameworkTask = defineTask('cog-build-framework', {
  kind: 'agent',
  title: 'Build Knowledge Framework from Notes',
  labels: ['cog', 'consolidation', 'framework'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        theme: { type: 'object' },
        vaultPath: { type: 'string' },
        existingFrameworks: { type: 'array' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/framework-builder'
  },
  instructions: [
    'Build a structured knowledge framework from themed note cluster',
    'Framework should include: concept map, key principles, examples, applications',
    'Cross-reference with existing frameworks in 05-knowledge/',
    'Preserve source attribution from original notes',
    'Score framework quality against target threshold'
  ]
});

const refineFrameworkTask = defineTask('cog-refine-framework', {
  kind: 'agent',
  title: 'Refine Knowledge Framework Quality',
  labels: ['cog', 'consolidation', 'framework', 'refinement'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        previousFramework: { type: 'object' },
        targetQuality: { type: 'number' },
        iteration: { type: 'number' }
      }
    },
    outputPath: 'agents/framework-builder'
  },
  instructions: [
    'Review previous framework and identify quality gaps',
    'Strengthen structure and cross-references',
    'Improve actionability and practical applications',
    'Enhance source attribution',
    'Re-score and return improved framework'
  ]
});

const writeFrameworksToVaultTask = defineTask('cog-write-frameworks', {
  kind: 'agent',
  title: 'Write Frameworks to Knowledge Base',
  labels: ['cog', 'consolidation', 'vault', 'write'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        frameworks: { type: 'array' }
      }
    },
    outputPath: 'agents/vault-architect'
  },
  instructions: [
    'Write consolidated frameworks to 05-knowledge/',
    'Create or update framework markdown files',
    'Include frontmatter with date, quality score, source count',
    'Maintain cross-references between frameworks',
    'Commit to Git with descriptive message'
  ]
});

const gatherMonthDataTask = defineTask('cog-gather-month-data', {
  kind: 'agent',
  title: 'Gather Monthly Vault Data',
  labels: ['cog', 'synthesis', 'monthly', 'data'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' }
      }
    },
    outputPath: 'agents/knowledge-curator'
  },
  instructions: [
    'Gather all weekly reflections and check-ins from the past month',
    'Collect accumulated daily briefs and team syncs',
    'Index all captured knowledge by week and domain',
    'Prepare unified monthly dataset for evolution analysis'
  ]
});

const analyzeMonthlyEvolutionTask = defineTask('cog-analyze-monthly-evolution', {
  kind: 'agent',
  title: 'Analyze Monthly Evolution Patterns',
  labels: ['cog', 'synthesis', 'monthly', 'evolution'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        monthData: { type: 'object' },
        vaultPath: { type: 'string' },
        userName: { type: 'string' },
        rolePack: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Analyze how themes evolved over the month across weekly reflections',
    'Identify growth areas and stagnation points',
    'Map knowledge evolution trajectory',
    'Generate monthly evolution narrative with evidence'
  ]
});

const monthlyConsolidationTask = defineTask('cog-monthly-consolidation', {
  kind: 'agent',
  title: 'Monthly Knowledge Consolidation',
  labels: ['cog', 'synthesis', 'monthly', 'consolidation'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        evolution: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/framework-builder'
  },
  instructions: [
    'Consolidate month of scattered notes into permanent frameworks',
    'Update existing frameworks with new insights',
    'Create new frameworks for emergent themes',
    'Score consolidation quality against target threshold'
  ]
});

const updatePersonalStrategyTask = defineTask('cog-update-personal-strategy', {
  kind: 'agent',
  title: 'Update Personal Strategy',
  labels: ['cog', 'synthesis', 'monthly', 'personal', 'strategy'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        evolution: { type: 'object' },
        consolidation: { type: 'object' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Update personal strategy based on monthly evolution',
    'Adjust personal goals and priorities',
    'Update 02-personal/ strategy document',
    'Maintain strict separation from professional strategy'
  ]
});

const updateProfessionalStrategyTask = defineTask('cog-update-professional-strategy', {
  kind: 'agent',
  title: 'Update Professional Strategy',
  labels: ['cog', 'synthesis', 'monthly', 'professional', 'strategy'],
  io: {
    inputSchema: {
      type: 'object',
      properties: {
        vaultPath: { type: 'string' },
        evolution: { type: 'object' },
        consolidation: { type: 'object' },
        rolePack: { type: 'string' },
        targetQuality: { type: 'number' }
      }
    },
    outputPath: 'agents/reflection-coach'
  },
  instructions: [
    'Update professional strategy based on monthly evolution',
    'Align with role pack expectations and growth areas',
    'Update 03-professional/ strategy document',
    'Include skill development priorities and career trajectory'
  ]
});
