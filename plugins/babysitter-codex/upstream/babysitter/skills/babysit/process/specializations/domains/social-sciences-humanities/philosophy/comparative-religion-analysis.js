/**
 * @process philosophy/comparative-religion-analysis
 * @description Conduct systematic comparison of religious traditions, beliefs, practices, and institutions using phenomenological and analytical methods
 * @inputs { religions: array, comparisonFocus: string, methodology: string, outputDir: string }
 * @outputs { success: boolean, comparativeAnalysis: object, similarities: array, differences: array, insights: object, artifacts: array }
 * @recommendedSkills SK-PHIL-009 (comparative-religion-analysis), SK-PHIL-004 (hermeneutical-interpretation), SK-PHIL-013 (scholarly-literature-synthesis)
 * @recommendedAgents AG-PHIL-008 (comparative-religion-scholar-agent), AG-PHIL-003 (hermeneutics-specialist-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    religions,
    comparisonFocus = 'comprehensive',
    methodology = 'phenomenological',
    outputDir = 'comparative-religion-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Religions Profiling
  ctx.log('info', 'Starting comparative religion analysis: Profiling religions');
  const religionProfiles = [];
  for (const religion of religions) {
    const profile = await ctx.task(religionProfilingTask, {
      religion,
      comparisonFocus,
      outputDir
    });
    religionProfiles.push(profile);
    artifacts.push(...profile.artifacts);
  }

  // Task 2: Phenomenological Analysis
  ctx.log('info', 'Conducting phenomenological analysis');
  const phenomenologicalAnalysis = await ctx.task(phenomenologicalAnalysisTask, {
    religionProfiles,
    comparisonFocus,
    outputDir
  });

  artifacts.push(...phenomenologicalAnalysis.artifacts);

  // Task 3: Structural Comparison
  ctx.log('info', 'Performing structural comparison');
  const structuralComparison = await ctx.task(structuralComparisonTask, {
    religionProfiles,
    phenomenologicalFindings: phenomenologicalAnalysis.findings,
    outputDir
  });

  artifacts.push(...structuralComparison.artifacts);

  // Task 4: Beliefs and Doctrines Comparison
  ctx.log('info', 'Comparing beliefs and doctrines');
  const beliefsComparison = await ctx.task(beliefsComparisonTask, {
    religionProfiles,
    outputDir
  });

  artifacts.push(...beliefsComparison.artifacts);

  // Task 5: Practices and Rituals Comparison
  ctx.log('info', 'Comparing practices and rituals');
  const practicesComparison = await ctx.task(practicesComparisonTask, {
    religionProfiles,
    outputDir
  });

  artifacts.push(...practicesComparison.artifacts);

  // Task 6: Synthesis and Insights
  ctx.log('info', 'Synthesizing comparative insights');
  const synthesis = await ctx.task(synthesisInsightsTask, {
    religionProfiles,
    phenomenologicalAnalysis,
    structuralComparison,
    beliefsComparison,
    practicesComparison,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  // Breakpoint: Review comparative analysis
  await ctx.breakpoint({
    question: `Comparative religion analysis complete. Compared ${religions.length} traditions. Review the analysis?`,
    title: 'Comparative Religion Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        religionsCompared: religions,
        methodology,
        similaritiesFound: synthesis.similarities.length,
        differencesFound: synthesis.differences.length
      }
    }
  });

  // Task 7: Generate Comparative Report
  ctx.log('info', 'Generating comparative religion report');
  const comparativeReport = await ctx.task(comparativeReportTask, {
    religions,
    religionProfiles,
    phenomenologicalAnalysis,
    structuralComparison,
    beliefsComparison,
    practicesComparison,
    synthesis,
    outputDir
  });

  artifacts.push(...comparativeReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    comparativeAnalysis: {
      religionsCompared: religions,
      methodology,
      profiles: religionProfiles.map(p => p.profile),
      phenomenologicalFindings: phenomenologicalAnalysis.findings
    },
    similarities: synthesis.similarities,
    differences: synthesis.differences,
    insights: {
      structuralInsights: structuralComparison.insights,
      doctrinalInsights: beliefsComparison.insights,
      practicalInsights: practicesComparison.insights,
      overarchingInsights: synthesis.overarchingInsights
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/comparative-religion-analysis',
      timestamp: startTime,
      methodology,
      outputDir
    }
  };
}

// Task definitions
export const religionProfilingTask = defineTask('religion-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Profile religious tradition',
  agent: {
    name: 'religion-scholar',
    prompt: {
      role: 'comparative religion scholar',
      task: 'Create a comprehensive profile of the religious tradition',
      context: args,
      instructions: [
        'Identify core beliefs and doctrines',
        'Document sacred texts and authorities',
        'Describe key practices and rituals',
        'Note institutional structures',
        'Identify sacred times and places',
        'Document ethical teachings',
        'Note historical development',
        'Save religion profile to output directory'
      ],
      outputFormat: 'JSON with profile (beliefs, texts, practices, institutions, ethics, history), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'artifacts'],
      properties: {
        profile: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            coreBeliefs: { type: 'array', items: { type: 'string' } },
            sacredTexts: { type: 'array', items: { type: 'string' } },
            keyPractices: { type: 'array', items: { type: 'string' } },
            institutions: { type: 'array', items: { type: 'string' } },
            ethics: { type: 'array', items: { type: 'string' } },
            history: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'comparative-religion', 'profiling']
}));

export const phenomenologicalAnalysisTask = defineTask('phenomenological-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct phenomenological analysis',
  agent: {
    name: 'phenomenologist',
    prompt: {
      role: 'phenomenologist of religion',
      task: 'Apply phenomenological method to understand religious phenomena',
      context: args,
      instructions: [
        'Bracket presuppositions (epoche)',
        'Identify essential structures of religious experience',
        'Analyze the sacred and profane distinction',
        'Examine religious symbolism across traditions',
        'Identify universal religious phenomena',
        'Note tradition-specific phenomena',
        'Describe religious consciousness structures',
        'Save phenomenological analysis to output directory'
      ],
      outputFormat: 'JSON with findings (structures, symbols, universals, specifics), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: {
          type: 'object',
          properties: {
            essentialStructures: { type: 'array', items: { type: 'string' } },
            sacredProfane: { type: 'object' },
            symbolism: { type: 'array', items: { type: 'object' } },
            universals: { type: 'array', items: { type: 'string' } },
            specifics: { type: 'array', items: { type: 'object' } }
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
  labels: ['agent', 'philosophy', 'comparative-religion', 'phenomenological']
}));

export const structuralComparisonTask = defineTask('structural-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform structural comparison',
  agent: {
    name: 'structural-analyst',
    prompt: {
      role: 'comparative religion scholar',
      task: 'Compare the structural elements of the religious traditions',
      context: args,
      instructions: [
        'Compare organizational structures',
        'Compare authority structures',
        'Compare community organization',
        'Compare clergy/laity distinctions',
        'Compare institutional development',
        'Note structural similarities',
        'Note structural differences',
        'Save structural comparison to output directory'
      ],
      outputFormat: 'JSON with comparison (organizational, authority, community), insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'insights', 'artifacts'],
      properties: {
        comparison: {
          type: 'object',
          properties: {
            organizational: { type: 'object' },
            authority: { type: 'object' },
            community: { type: 'object' },
            clergyLaity: { type: 'object' }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'comparative-religion', 'structural']
}));

export const beliefsComparisonTask = defineTask('beliefs-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare beliefs and doctrines',
  agent: {
    name: 'doctrine-comparator',
    prompt: {
      role: 'comparative theologian',
      task: 'Compare core beliefs and doctrines across traditions',
      context: args,
      instructions: [
        'Compare concepts of ultimate reality/deity',
        'Compare creation/cosmology beliefs',
        'Compare anthropology/human nature',
        'Compare soteriology/salvation',
        'Compare eschatology/afterlife',
        'Compare ethical principles',
        'Identify doctrinal convergences',
        'Save beliefs comparison to output directory'
      ],
      outputFormat: 'JSON with comparison (deity, cosmology, anthropology, soteriology, eschatology), insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'insights', 'artifacts'],
      properties: {
        comparison: {
          type: 'object',
          properties: {
            deity: { type: 'object' },
            cosmology: { type: 'object' },
            anthropology: { type: 'object' },
            soteriology: { type: 'object' },
            eschatology: { type: 'object' },
            ethics: { type: 'object' }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'comparative-religion', 'beliefs']
}));

export const practicesComparisonTask = defineTask('practices-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare practices and rituals',
  agent: {
    name: 'ritual-comparator',
    prompt: {
      role: 'comparative religion scholar',
      task: 'Compare religious practices and rituals across traditions',
      context: args,
      instructions: [
        'Compare worship practices',
        'Compare prayer/meditation practices',
        'Compare life cycle rituals',
        'Compare calendar/festival observances',
        'Compare pilgrimage practices',
        'Compare dietary/ascetic practices',
        'Identify functional equivalents',
        'Save practices comparison to output directory'
      ],
      outputFormat: 'JSON with comparison (worship, prayer, lifecycle, festivals, pilgrimage), insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'insights', 'artifacts'],
      properties: {
        comparison: {
          type: 'object',
          properties: {
            worship: { type: 'object' },
            prayer: { type: 'object' },
            lifecycle: { type: 'object' },
            festivals: { type: 'object' },
            pilgrimage: { type: 'object' },
            dietary: { type: 'object' }
          }
        },
        functionalEquivalents: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'comparative-religion', 'practices']
}));

export const synthesisInsightsTask = defineTask('synthesis-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize comparative insights',
  agent: {
    name: 'synthesis-expert',
    prompt: {
      role: 'comparative religion scholar',
      task: 'Synthesize insights from all comparative analyses',
      context: args,
      instructions: [
        'Compile all similarities found',
        'Compile all differences found',
        'Identify overarching patterns',
        'Note unique features of each tradition',
        'Consider implications for religious understanding',
        'Avoid reductionism while noting commonalities',
        'Develop nuanced comparative insights',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with similarities, differences, overarchingInsights, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['similarities', 'differences', 'overarchingInsights', 'artifacts'],
      properties: {
        similarities: { type: 'array', items: { type: 'string' } },
        differences: { type: 'array', items: { type: 'string' } },
        overarchingInsights: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        uniqueFeatures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'comparative-religion', 'synthesis']
}));

export const comparativeReportTask = defineTask('comparative-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comparative religion report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'comparative religion scholar and technical writer',
      task: 'Generate comprehensive comparative religion report',
      context: args,
      instructions: [
        'Create executive summary of findings',
        'Present religion profiles',
        'Document phenomenological analysis',
        'Present structural comparison',
        'Include beliefs comparison',
        'Present practices comparison',
        'Include synthesis and insights',
        'Note methodological considerations',
        'Format as professional academic report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'comparative-religion', 'reporting']
}));
