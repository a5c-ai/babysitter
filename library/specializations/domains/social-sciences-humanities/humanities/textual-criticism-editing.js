/**
 * @process humanities/textual-criticism-editing
 * @description Establish authoritative texts through manuscript analysis, variant comparison, emendation, and scholarly apparatus development
 * @inputs { textTradition: object, manuscripts: array, editorialPolicy: object, targetEdition: string }
 * @outputs { success: boolean, criticalText: object, apparatus: object, editorialDecisions: array, artifacts: array }
 * @recommendedSkills SK-HUM-004 (tei-text-encoding), SK-HUM-010 (citation-scholarly-apparatus), SK-HUM-005 (literary-close-reading)
 * @recommendedAgents AG-HUM-004 (literary-critic-theorist), AG-HUM-005 (digital-humanities-technologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    textTradition,
    manuscripts = [],
    editorialPolicy = {},
    targetEdition = 'critical',
    outputDir = 'textual-criticism-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Manuscript Collation
  ctx.log('info', 'Collating manuscript witnesses');
  const collation = await ctx.task(manuscriptCollationTask, {
    textTradition,
    manuscripts,
    outputDir
  });

  if (!collation.success) {
    return {
      success: false,
      error: 'Manuscript collation failed',
      details: collation,
      metadata: { processId: 'humanities/textual-criticism-editing', timestamp: startTime }
    };
  }

  artifacts.push(...collation.artifacts);

  // Task 2: Stemmatic Analysis
  ctx.log('info', 'Performing stemmatic analysis');
  const stemmaticAnalysis = await ctx.task(stemmaticAnalysisTask, {
    collation,
    manuscripts,
    outputDir
  });

  artifacts.push(...stemmaticAnalysis.artifacts);

  // Task 3: Variant Analysis and Classification
  ctx.log('info', 'Analyzing and classifying variants');
  const variantAnalysis = await ctx.task(variantAnalysisTask, {
    collation,
    stemmaticAnalysis,
    outputDir
  });

  artifacts.push(...variantAnalysis.artifacts);

  // Task 4: Editorial Decision Framework
  ctx.log('info', 'Establishing editorial decision framework');
  const editorialFramework = await ctx.task(editorialFrameworkTask, {
    editorialPolicy,
    targetEdition,
    variantAnalysis,
    outputDir
  });

  artifacts.push(...editorialFramework.artifacts);

  // Task 5: Text Constitution
  ctx.log('info', 'Constituting critical text');
  const textConstitution = await ctx.task(textConstitutionTask, {
    collation,
    variantAnalysis,
    editorialFramework,
    stemmaticAnalysis,
    outputDir
  });

  artifacts.push(...textConstitution.artifacts);

  // Task 6: Critical Apparatus Development
  ctx.log('info', 'Developing critical apparatus');
  const criticalApparatus = await ctx.task(criticalApparatusTask, {
    textConstitution,
    collation,
    variantAnalysis,
    editorialFramework,
    outputDir
  });

  artifacts.push(...criticalApparatus.artifacts);

  // Task 7: Generate Critical Edition Report
  ctx.log('info', 'Generating critical edition report');
  const editionReport = await ctx.task(criticalEditionReportTask, {
    textTradition,
    collation,
    stemmaticAnalysis,
    variantAnalysis,
    editorialFramework,
    textConstitution,
    criticalApparatus,
    outputDir
  });

  artifacts.push(...editionReport.artifacts);

  // Breakpoint: Review critical text
  await ctx.breakpoint({
    question: `Critical text established for ${textTradition.title || 'text'}. Variants documented: ${variantAnalysis.variants?.length || 0}. Review edition?`,
    title: 'Textual Criticism Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        textTitle: textTradition.title,
        manuscriptsCollated: manuscripts.length,
        variantsDocumented: variantAnalysis.variants?.length || 0,
        emendations: textConstitution.emendations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    criticalText: {
      text: textConstitution.text,
      baseManuscript: textConstitution.baseManuscript,
      emendations: textConstitution.emendations
    },
    apparatus: {
      criticus: criticalApparatus.apparatusCriticus,
      fontium: criticalApparatus.apparatusFontium
    },
    editorialDecisions: editorialFramework.decisions,
    stemma: stemmaticAnalysis.stemma,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/textual-criticism-editing',
      timestamp: startTime,
      textTitle: textTradition.title,
      outputDir
    }
  };
}

// Task 1: Manuscript Collation
export const manuscriptCollationTask = defineTask('manuscript-collation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collate manuscript witnesses',
  agent: {
    name: 'collator',
    prompt: {
      role: 'textual collation specialist',
      task: 'Systematically collate manuscript witnesses',
      context: args,
      instructions: [
        'Identify all manuscript witnesses',
        'Establish collation base text',
        'Record all variant readings',
        'Note lacunae and damage',
        'Document scribal corrections',
        'Record marginalia and glosses',
        'Create collation apparatus',
        'Organize variants by locus'
      ],
      outputFormat: 'JSON with success, witnesses, variants, lacunae, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'witnesses', 'variants', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        witnesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              siglum: { type: 'string' },
              description: { type: 'string' },
              date: { type: 'string' },
              provenance: { type: 'string' }
            }
          }
        },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              locus: { type: 'string' },
              readings: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        lacunae: { type: 'array', items: { type: 'object' } },
        corrections: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'collation', 'manuscripts', 'textual-criticism']
}));

// Task 2: Stemmatic Analysis
export const stemmaticAnalysisTask = defineTask('stemmatic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform stemmatic analysis',
  agent: {
    name: 'stemmatologist',
    prompt: {
      role: 'stemmatic analysis specialist',
      task: 'Establish manuscript relationships and stemma',
      context: args,
      instructions: [
        'Identify significant shared errors',
        'Analyze variant patterns for relationships',
        'Establish manuscript groupings',
        'Identify archetype characteristics',
        'Construct stemma codicum',
        'Identify contamination if present',
        'Assess stemma reliability',
        'Document lost intermediaries'
      ],
      outputFormat: 'JSON with stemma, families, archetype, contamination, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stemma', 'artifacts'],
      properties: {
        stemma: {
          type: 'object',
          properties: {
            structure: { type: 'object' },
            archetype: { type: 'object' },
            hyparchetypes: { type: 'array', items: { type: 'object' } }
          }
        },
        families: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              members: { type: 'array', items: { type: 'string' } },
              characteristics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sharedErrors: { type: 'array', items: { type: 'object' } },
        contamination: { type: 'object' },
        lostWitnesses: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stemma', 'manuscript-families', 'textual-criticism']
}));

// Task 3: Variant Analysis and Classification
export const variantAnalysisTask = defineTask('variant-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze and classify variants',
  agent: {
    name: 'variant-analyst',
    prompt: {
      role: 'variant analysis specialist',
      task: 'Analyze and classify textual variants',
      context: args,
      instructions: [
        'Classify variants by type (substantive/accidental)',
        'Identify scribal error patterns',
        'Distinguish authorial from scribal variants',
        'Assess variant significance',
        'Identify lectio difficilior cases',
        'Analyze parallel transmission',
        'Document editorial cruces',
        'Rank variants by importance'
      ],
      outputFormat: 'JSON with variants, classification, cruces, patterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['variants', 'classification', 'artifacts'],
      properties: {
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              locus: { type: 'string' },
              type: { type: 'string' },
              readings: { type: 'array', items: { type: 'object' } },
              significance: { type: 'string' }
            }
          }
        },
        classification: {
          type: 'object',
          properties: {
            substantive: { type: 'number' },
            accidental: { type: 'number' },
            errors: { type: 'object' }
          }
        },
        cruces: { type: 'array', items: { type: 'object' } },
        errorPatterns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'variants', 'classification', 'textual-criticism']
}));

// Task 4: Editorial Decision Framework
export const editorialFrameworkTask = defineTask('editorial-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish editorial decision framework',
  agent: {
    name: 'editorial-theorist',
    prompt: {
      role: 'editorial theory specialist',
      task: 'Establish framework for editorial decisions',
      context: args,
      instructions: [
        'Define edition type and goals',
        'Establish copy-text theory position',
        'Define emendation principles',
        'Create decision hierarchy for variants',
        'Establish treatment of accidentals',
        'Define apparatus conventions',
        'Address modernization questions',
        'Document editorial principles'
      ],
      outputFormat: 'JSON with principles, decisions, conventions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['principles', 'decisions', 'artifacts'],
      properties: {
        principles: {
          type: 'object',
          properties: {
            copyTextTheory: { type: 'string' },
            emendationPolicy: { type: 'string' },
            accidentalsPolicy: { type: 'string' }
          }
        },
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              policy: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        conventions: {
          type: 'object',
          properties: {
            apparatus: { type: 'object' },
            sigla: { type: 'object' },
            symbols: { type: 'object' }
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
  labels: ['agent', 'editorial-theory', 'principles', 'policy']
}));

// Task 5: Text Constitution
export const textConstitutionTask = defineTask('text-constitution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Constitute critical text',
  agent: {
    name: 'text-editor',
    prompt: {
      role: 'critical text editor',
      task: 'Constitute the critical text from witnesses',
      context: args,
      instructions: [
        'Select base text or establish eclectic text',
        'Apply editorial principles to variants',
        'Make and document emendations',
        'Resolve editorial cruces',
        'Apply consistent treatment of accidentals',
        'Document all editorial interventions',
        'Create clean text',
        'Verify text integrity'
      ],
      outputFormat: 'JSON with text, baseManuscript, emendations, interventions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['text', 'emendations', 'artifacts'],
      properties: {
        text: { type: 'string' },
        baseManuscript: { type: 'string' },
        emendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              locus: { type: 'string' },
              original: { type: 'string' },
              emended: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        interventions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        crucesSolved: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'text-constitution', 'editing', 'critical-text']
}));

// Task 6: Critical Apparatus Development
export const criticalApparatusTask = defineTask('critical-apparatus', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop critical apparatus',
  agent: {
    name: 'apparatus-developer',
    prompt: {
      role: 'critical apparatus specialist',
      task: 'Develop comprehensive critical apparatus',
      context: args,
      instructions: [
        'Create apparatus criticus with variants',
        'Develop apparatus fontium for sources',
        'Apply consistent notation',
        'Include rejected readings',
        'Document conjectures',
        'Include testimonium if needed',
        'Format per scholarly conventions',
        'Create apparatus introduction'
      ],
      outputFormat: 'JSON with apparatusCriticus, apparatusFontium, notation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['apparatusCriticus', 'artifacts'],
      properties: {
        apparatusCriticus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              locus: { type: 'string' },
              lemma: { type: 'string' },
              variants: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        apparatusFontium: { type: 'array', items: { type: 'object' } },
        notation: {
          type: 'object',
          properties: {
            sigla: { type: 'object' },
            symbols: { type: 'object' },
            abbreviations: { type: 'object' }
          }
        },
        conjectures: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'apparatus', 'variants', 'critical-edition']
}));

// Task 7: Critical Edition Report Generation
export const criticalEditionReportTask = defineTask('critical-edition-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate critical edition report',
  agent: {
    name: 'edition-documenter',
    prompt: {
      role: 'critical edition documentation specialist',
      task: 'Generate comprehensive critical edition documentation',
      context: args,
      instructions: [
        'Describe text and transmission history',
        'Document all witnesses',
        'Present stemmatic analysis',
        'Explain editorial principles',
        'Document significant variants',
        'Present critical text',
        'Include apparatus documentation',
        'Format as scholarly prolegomena'
      ],
      outputFormat: 'JSON with reportPath, prolegomena, witnessDescriptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        prolegomena: {
          type: 'object',
          properties: {
            textHistory: { type: 'string' },
            transmissionHistory: { type: 'string' },
            editorialPrinciples: { type: 'string' }
          }
        },
        witnessDescriptions: { type: 'array', items: { type: 'object' } },
        stemmaDescription: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'critical-edition', 'prolegomena']
}));
