/**
 * @process humanities/comparative-literature-analysis
 * @description Analyze texts across linguistic and cultural boundaries examining influence, translation, adaptation, and transnational literary movements
 * @inputs { primaryText: object, comparativeTexts: array, comparativeFramework: string, culturalContexts: object }
 * @outputs { success: boolean, comparativeAnalysis: object, influenceMapping: object, transnationalConnections: array, artifacts: array }
 * @recommendedSkills SK-HUM-005 (literary-close-reading), SK-HUM-013 (critical-theory-application), SK-HUM-010 (citation-scholarly-apparatus)
 * @recommendedAgents AG-HUM-004 (literary-critic-theorist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    primaryText,
    comparativeTexts = [],
    comparativeFramework = 'influence-study',
    culturalContexts = {},
    translationIssues = {},
    outputDir = 'comparative-lit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Contextual Framework Establishment
  ctx.log('info', 'Establishing contextual framework');
  const contextualFramework = await ctx.task(contextualFrameworkTask, {
    primaryText,
    comparativeTexts,
    culturalContexts,
    outputDir
  });

  if (!contextualFramework.success) {
    return {
      success: false,
      error: 'Contextual framework establishment failed',
      details: contextualFramework,
      metadata: { processId: 'humanities/comparative-literature-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...contextualFramework.artifacts);

  // Task 2: Influence and Reception Analysis
  ctx.log('info', 'Analyzing influence and reception');
  const influenceAnalysis = await ctx.task(influenceAnalysisTask, {
    primaryText,
    comparativeTexts,
    contextualFramework,
    outputDir
  });

  artifacts.push(...influenceAnalysis.artifacts);

  // Task 3: Translation and Adaptation Analysis
  ctx.log('info', 'Analyzing translation and adaptation');
  const translationAnalysis = await ctx.task(translationAnalysisTask, {
    primaryText,
    comparativeTexts,
    translationIssues,
    outputDir
  });

  artifacts.push(...translationAnalysis.artifacts);

  // Task 4: Thematic Comparison
  ctx.log('info', 'Conducting thematic comparison');
  const thematicComparison = await ctx.task(thematicComparisonTask, {
    primaryText,
    comparativeTexts,
    comparativeFramework,
    outputDir
  });

  artifacts.push(...thematicComparison.artifacts);

  // Task 5: Formal and Stylistic Comparison
  ctx.log('info', 'Conducting formal and stylistic comparison');
  const formalComparison = await ctx.task(formalComparisonTask, {
    primaryText,
    comparativeTexts,
    translationAnalysis,
    outputDir
  });

  artifacts.push(...formalComparison.artifacts);

  // Task 6: Transnational Movement Analysis
  ctx.log('info', 'Analyzing transnational movements');
  const transnationalAnalysis = await ctx.task(transnationalAnalysisTask, {
    primaryText,
    comparativeTexts,
    influenceAnalysis,
    culturalContexts,
    outputDir
  });

  artifacts.push(...transnationalAnalysis.artifacts);

  // Task 7: Generate Comparative Analysis Report
  ctx.log('info', 'Generating comparative analysis report');
  const comparativeReport = await ctx.task(comparativeReportTask, {
    primaryText,
    comparativeTexts,
    contextualFramework,
    influenceAnalysis,
    translationAnalysis,
    thematicComparison,
    formalComparison,
    transnationalAnalysis,
    outputDir
  });

  artifacts.push(...comparativeReport.artifacts);

  // Breakpoint: Review comparative analysis
  await ctx.breakpoint({
    question: `Comparative analysis complete for ${primaryText.title || 'primary text'}. Texts compared: ${comparativeTexts.length}. Review analysis?`,
    title: 'Comparative Literature Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        primaryTextTitle: primaryText.title,
        textsCompared: comparativeTexts.length,
        comparativeFramework,
        influenceConnections: influenceAnalysis.connections?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    comparativeAnalysis: {
      framework: comparativeFramework,
      thematic: thematicComparison.analysis,
      formal: formalComparison.analysis
    },
    influenceMapping: {
      connections: influenceAnalysis.connections,
      receptionHistory: influenceAnalysis.receptionHistory
    },
    transnationalConnections: transnationalAnalysis.movements,
    translationAnalysis: translationAnalysis.analysis,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/comparative-literature-analysis',
      timestamp: startTime,
      primaryTextTitle: primaryText.title,
      outputDir
    }
  };
}

// Task 1: Contextual Framework Establishment
export const contextualFrameworkTask = defineTask('contextual-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish contextual framework',
  agent: {
    name: 'comparatist',
    prompt: {
      role: 'comparative literature specialist',
      task: 'Establish contextual framework for comparison',
      context: args,
      instructions: [
        'Situate texts in historical contexts',
        'Map cultural and literary traditions',
        'Identify relevant literary movements',
        'Establish periodization frameworks',
        'Map linguistic and national contexts',
        'Identify shared cultural formations',
        'Establish terms of comparison',
        'Document contextual differences'
      ],
      outputFormat: 'JSON with success, contexts, traditions, frameworks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'contexts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        contexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              historical: { type: 'string' },
              cultural: { type: 'string' },
              literary: { type: 'string' }
            }
          }
        },
        traditions: { type: 'array', items: { type: 'object' } },
        frameworks: { type: 'object' },
        termsOfComparison: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'context', 'comparative', 'framework']
}));

// Task 2: Influence and Reception Analysis
export const influenceAnalysisTask = defineTask('influence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze influence and reception',
  agent: {
    name: 'influence-analyst',
    prompt: {
      role: 'literary influence specialist',
      task: 'Analyze influence relationships and reception history',
      context: args,
      instructions: [
        'Trace direct influence relationships',
        'Document textual borrowings and allusions',
        'Map reception history of texts',
        'Identify mediating figures and translations',
        'Analyze anxiety of influence patterns',
        'Document critical reception',
        'Map influence networks',
        'Assess influence directionality'
      ],
      outputFormat: 'JSON with connections, receptionHistory, networks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['connections', 'artifacts'],
      properties: {
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              type: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        receptionHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              period: { type: 'string' },
              reception: { type: 'string' }
            }
          }
        },
        networks: { type: 'object' },
        mediators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influence', 'reception', 'comparative']
}));

// Task 3: Translation and Adaptation Analysis
export const translationAnalysisTask = defineTask('translation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze translation and adaptation',
  agent: {
    name: 'translation-analyst',
    prompt: {
      role: 'translation studies specialist',
      task: 'Analyze translation and adaptation across languages',
      context: args,
      instructions: [
        'Compare original with translations',
        'Analyze translation strategies',
        'Identify cultural adaptations',
        'Document untranslatable elements',
        'Analyze gain and loss in translation',
        'Examine translator visibility',
        'Document translation history',
        'Assess fidelity and creativity'
      ],
      outputFormat: 'JSON with analysis, strategies, adaptations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            translations: { type: 'array', items: { type: 'object' } },
            strategies: { type: 'array', items: { type: 'string' } },
            challenges: { type: 'array', items: { type: 'string' } }
          }
        },
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              translator: { type: 'string' },
              approach: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        adaptations: { type: 'array', items: { type: 'object' } },
        untranslatables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'translation', 'adaptation', 'comparative']
}));

// Task 4: Thematic Comparison
export const thematicComparisonTask = defineTask('thematic-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct thematic comparison',
  agent: {
    name: 'thematic-analyst',
    prompt: {
      role: 'comparative thematic analyst',
      task: 'Compare texts thematically across cultures',
      context: args,
      instructions: [
        'Identify shared themes across texts',
        'Analyze theme variations by culture',
        'Compare treatment of universal themes',
        'Identify culturally specific themes',
        'Analyze thematic evolution',
        'Map theme clusters',
        'Identify archetypal patterns',
        'Analyze ideological dimensions'
      ],
      outputFormat: 'JSON with analysis, themes, variations, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'themes', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            sharedThemes: { type: 'array', items: { type: 'string' } },
            uniqueThemes: { type: 'array', items: { type: 'object' } },
            variations: { type: 'array', items: { type: 'object' } }
          }
        },
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              texts: { type: 'array', items: { type: 'string' } },
              treatment: { type: 'string' }
            }
          }
        },
        patterns: { type: 'array', items: { type: 'object' } },
        archetypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'thematic', 'comparison', 'cross-cultural']
}));

// Task 5: Formal and Stylistic Comparison
export const formalComparisonTask = defineTask('formal-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct formal and stylistic comparison',
  agent: {
    name: 'formal-analyst',
    prompt: {
      role: 'comparative formal analyst',
      task: 'Compare formal and stylistic elements across texts',
      context: args,
      instructions: [
        'Compare narrative structures',
        'Analyze generic conventions across traditions',
        'Compare prosodic and poetic forms',
        'Analyze rhetorical strategies',
        'Compare narrative voice and perspective',
        'Analyze stylistic registers',
        'Identify formal borrowings',
        'Assess innovation and convention'
      ],
      outputFormat: 'JSON with analysis, structures, styles, innovations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            narrativeStructures: { type: 'array', items: { type: 'object' } },
            genres: { type: 'array', items: { type: 'object' } },
            styles: { type: 'array', items: { type: 'object' } }
          }
        },
        structures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              structure: { type: 'string' },
              comparison: { type: 'string' }
            }
          }
        },
        formalBorrowings: { type: 'array', items: { type: 'object' } },
        innovations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'formal', 'stylistic', 'comparison']
}));

// Task 6: Transnational Movement Analysis
export const transnationalAnalysisTask = defineTask('transnational-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze transnational literary movements',
  agent: {
    name: 'transnational-analyst',
    prompt: {
      role: 'transnational literature specialist',
      task: 'Analyze transnational literary movements and connections',
      context: args,
      instructions: [
        'Identify transnational literary movements',
        'Map cross-border literary networks',
        'Analyze cosmopolitan literary formations',
        'Document literary manifestos and programs',
        'Trace circulation of literary ideas',
        'Analyze institutional connections',
        'Document magazine and publication networks',
        'Assess national vs transnational dynamics'
      ],
      outputFormat: 'JSON with movements, networks, circulations, institutions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['movements', 'artifacts'],
      properties: {
        movements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              period: { type: 'string' },
              countries: { type: 'array', items: { type: 'string' } },
              characteristics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        networks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              nodes: { type: 'array', items: { type: 'string' } },
              connections: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        circulations: { type: 'array', items: { type: 'object' } },
        institutions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'transnational', 'movements', 'networks']
}));

// Task 7: Comparative Analysis Report Generation
export const comparativeReportTask = defineTask('comparative-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comparative analysis report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'comparative literature writer',
      task: 'Generate comprehensive comparative literature analysis report',
      context: args,
      instructions: [
        'Present texts and contextual framework',
        'Document influence and reception analysis',
        'Present translation analysis',
        'Document thematic comparison',
        'Present formal comparison',
        'Document transnational connections',
        'Synthesize comparative findings',
        'Format as scholarly essay'
      ],
      outputFormat: 'JSON with reportPath, thesis, sections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        thesis: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        conclusions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reporting', 'comparative-literature', 'analysis']
}));
