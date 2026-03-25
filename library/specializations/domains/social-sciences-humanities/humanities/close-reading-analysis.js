/**
 * @process humanities/close-reading-analysis
 * @description Perform detailed textual analysis identifying patterns in language, imagery, structure, and intertextual references with systematic annotation methodology
 * @inputs { text: object, analyticalFocus: array, theoreticalLens: string }
 * @outputs { success: boolean, closeReadingAnalysis: object, annotations: array, patterns: object, artifacts: array }
 * @recommendedSkills SK-HUM-005 (literary-close-reading), SK-HUM-010 (citation-scholarly-apparatus)
 * @recommendedAgents AG-HUM-004 (literary-critic-theorist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    text,
    analyticalFocus = ['language', 'imagery', 'structure'],
    theoreticalLens = 'formalist',
    comparativeTexts = [],
    outputDir = 'close-reading-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Initial Reading and Annotation
  ctx.log('info', 'Performing initial reading and annotation');
  const initialReading = await ctx.task(initialReadingTask, {
    text,
    analyticalFocus,
    outputDir
  });

  if (!initialReading.success) {
    return {
      success: false,
      error: 'Initial reading failed',
      details: initialReading,
      metadata: { processId: 'humanities/close-reading-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...initialReading.artifacts);

  // Task 2: Language and Diction Analysis
  ctx.log('info', 'Analyzing language and diction');
  const languageAnalysis = await ctx.task(languageAnalysisTask, {
    text,
    initialReading,
    theoreticalLens,
    outputDir
  });

  artifacts.push(...languageAnalysis.artifacts);

  // Task 3: Imagery and Figurative Language Analysis
  ctx.log('info', 'Analyzing imagery and figurative language');
  const imageryAnalysis = await ctx.task(imageryAnalysisTask, {
    text,
    languageAnalysis,
    outputDir
  });

  artifacts.push(...imageryAnalysis.artifacts);

  // Task 4: Structure and Form Analysis
  ctx.log('info', 'Analyzing structure and form');
  const structureAnalysis = await ctx.task(structureAnalysisTask, {
    text,
    initialReading,
    outputDir
  });

  artifacts.push(...structureAnalysis.artifacts);

  // Task 5: Intertextual Reference Analysis
  ctx.log('info', 'Analyzing intertextual references');
  const intertextualAnalysis = await ctx.task(intertextualAnalysisTask, {
    text,
    comparativeTexts,
    imageryAnalysis,
    outputDir
  });

  artifacts.push(...intertextualAnalysis.artifacts);

  // Task 6: Pattern Synthesis and Interpretation
  ctx.log('info', 'Synthesizing patterns and interpretation');
  const patternSynthesis = await ctx.task(patternSynthesisTask, {
    languageAnalysis,
    imageryAnalysis,
    structureAnalysis,
    intertextualAnalysis,
    theoreticalLens,
    outputDir
  });

  artifacts.push(...patternSynthesis.artifacts);

  // Task 7: Generate Close Reading Report
  ctx.log('info', 'Generating close reading report');
  const closeReadingReport = await ctx.task(closeReadingReportTask, {
    text,
    initialReading,
    languageAnalysis,
    imageryAnalysis,
    structureAnalysis,
    intertextualAnalysis,
    patternSynthesis,
    theoreticalLens,
    outputDir
  });

  artifacts.push(...closeReadingReport.artifacts);

  // Breakpoint: Review close reading analysis
  await ctx.breakpoint({
    question: `Close reading complete for ${text.title || 'text'}. Patterns identified: ${patternSynthesis.patterns?.length || 0}. Review analysis?`,
    title: 'Close Reading Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        textTitle: text.title,
        theoreticalLens,
        patternsIdentified: patternSynthesis.patterns?.length || 0,
        annotationCount: initialReading.annotations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    closeReadingAnalysis: {
      text: text.title,
      theoreticalLens,
      thesis: patternSynthesis.thesis,
      keyFindings: patternSynthesis.keyFindings
    },
    annotations: initialReading.annotations,
    patterns: {
      language: languageAnalysis.patterns,
      imagery: imageryAnalysis.patterns,
      structure: structureAnalysis.patterns,
      intertextual: intertextualAnalysis.patterns
    },
    interpretation: patternSynthesis.interpretation,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/close-reading-analysis',
      timestamp: startTime,
      textTitle: text.title,
      outputDir
    }
  };
}

// Task 1: Initial Reading and Annotation
export const initialReadingTask = defineTask('initial-reading', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform initial reading and annotation',
  agent: {
    name: 'close-reader',
    prompt: {
      role: 'literary close reading specialist',
      task: 'Perform initial close reading with systematic annotation',
      context: args,
      instructions: [
        'Read text attentively multiple times',
        'Mark striking or unusual language',
        'Note recurring words and phrases',
        'Identify structural divisions',
        'Mark shifts in tone or perspective',
        'Note initial questions and observations',
        'Identify passages requiring deeper analysis',
        'Create systematic annotation schema'
      ],
      outputFormat: 'JSON with success, annotations, observations, questions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'annotations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        annotations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              passage: { type: 'string' },
              type: { type: 'string' },
              note: { type: 'string' }
            }
          }
        },
        observations: { type: 'array', items: { type: 'string' } },
        questions: { type: 'array', items: { type: 'string' } },
        keyPassages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'close-reading', 'annotation', 'literary']
}));

// Task 2: Language and Diction Analysis
export const languageAnalysisTask = defineTask('language-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze language and diction',
  agent: {
    name: 'linguist-analyst',
    prompt: {
      role: 'literary linguistics specialist',
      task: 'Analyze language, diction, and word choice patterns',
      context: args,
      instructions: [
        'Analyze word choice and vocabulary level',
        'Identify semantic fields and word clusters',
        'Examine connotation and denotation',
        'Analyze syntax and sentence structure',
        'Identify rhetorical devices',
        'Examine register and tone',
        'Note archaic or unusual usage',
        'Identify patterns in language use'
      ],
      outputFormat: 'JSON with patterns, semanticFields, rhetoric, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              significance: { type: 'string' }
            }
          }
        },
        semanticFields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              words: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rhetoric: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              device: { type: 'string' },
              instances: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        syntaxAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'language', 'diction', 'literary-analysis']
}));

// Task 3: Imagery and Figurative Language Analysis
export const imageryAnalysisTask = defineTask('imagery-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze imagery and figurative language',
  agent: {
    name: 'imagery-analyst',
    prompt: {
      role: 'figurative language specialist',
      task: 'Analyze imagery, metaphor, and figurative language',
      context: args,
      instructions: [
        'Identify and catalog all imagery',
        'Analyze metaphors and similes',
        'Examine symbolic elements',
        'Identify sensory imagery (visual, auditory, etc.)',
        'Analyze extended metaphors or conceits',
        'Examine personification and other figures',
        'Identify image patterns and clusters',
        'Analyze imagery contribution to meaning'
      ],
      outputFormat: 'JSON with patterns, metaphors, symbols, sensory, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              instances: { type: 'array', items: { type: 'string' } },
              significance: { type: 'string' }
            }
          }
        },
        metaphors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vehicle: { type: 'string' },
              tenor: { type: 'string' },
              location: { type: 'string' },
              analysis: { type: 'string' }
            }
          }
        },
        symbols: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              meaning: { type: 'string' },
              occurrences: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sensoryImagery: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'imagery', 'metaphor', 'figurative-language']
}));

// Task 4: Structure and Form Analysis
export const structureAnalysisTask = defineTask('structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze structure and form',
  agent: {
    name: 'structure-analyst',
    prompt: {
      role: 'literary structure specialist',
      task: 'Analyze formal structure and organization',
      context: args,
      instructions: [
        'Identify overall formal structure',
        'Analyze organizational principles',
        'Examine paragraph/stanza structure',
        'Identify narrative or argumentative arc',
        'Analyze beginnings and endings',
        'Examine transitions and connections',
        'Identify structural repetitions',
        'Analyze form-content relationship'
      ],
      outputFormat: 'JSON with patterns, structure, form, arc, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'structure', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              description: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        structure: {
          type: 'object',
          properties: {
            overallForm: { type: 'string' },
            divisions: { type: 'array', items: { type: 'object' } },
            organizingPrinciple: { type: 'string' }
          }
        },
        form: {
          type: 'object',
          properties: {
            genre: { type: 'string' },
            conventions: { type: 'array', items: { type: 'string' } },
            innovations: { type: 'array', items: { type: 'string' } }
          }
        },
        arc: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'structure', 'form', 'literary-analysis']
}));

// Task 5: Intertextual Reference Analysis
export const intertextualAnalysisTask = defineTask('intertextual-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze intertextual references',
  agent: {
    name: 'intertextual-analyst',
    prompt: {
      role: 'intertextuality specialist',
      task: 'Identify and analyze intertextual references and allusions',
      context: args,
      instructions: [
        'Identify explicit quotations and citations',
        'Detect allusions to other texts',
        'Identify generic intertexts',
        'Analyze biblical or mythological references',
        'Examine literary influences',
        'Analyze transformation of borrowed material',
        'Identify dialogic relationships',
        'Assess intertextual contribution to meaning'
      ],
      outputFormat: 'JSON with patterns, allusions, influences, transformations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              type: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        allusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              passage: { type: 'string' },
              sourceText: { type: 'string' },
              type: { type: 'string' },
              function: { type: 'string' }
            }
          }
        },
        influences: { type: 'array', items: { type: 'object' } },
        transformations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'intertextuality', 'allusion', 'literary-analysis']
}));

// Task 6: Pattern Synthesis and Interpretation
export const patternSynthesisTask = defineTask('pattern-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize patterns and develop interpretation',
  agent: {
    name: 'interpretation-specialist',
    prompt: {
      role: 'literary interpretation specialist',
      task: 'Synthesize analytical findings into coherent interpretation',
      context: args,
      instructions: [
        'Synthesize findings across analytical categories',
        'Identify overarching patterns',
        'Develop interpretive thesis',
        'Connect formal analysis to meaning',
        'Apply theoretical framework',
        'Consider alternative interpretations',
        'Identify unresolved tensions',
        'Formulate key findings'
      ],
      outputFormat: 'JSON with patterns, thesis, interpretation, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'thesis', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              significance: { type: 'string' }
            }
          }
        },
        thesis: { type: 'string' },
        interpretation: {
          type: 'object',
          properties: {
            main: { type: 'string' },
            supporting: { type: 'array', items: { type: 'string' } },
            alternatives: { type: 'array', items: { type: 'string' } }
          }
        },
        keyFindings: { type: 'array', items: { type: 'string' } },
        tensions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'synthesis', 'interpretation', 'literary-analysis']
}));

// Task 7: Close Reading Report Generation
export const closeReadingReportTask = defineTask('close-reading-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate close reading report',
  agent: {
    name: 'literary-writer',
    prompt: {
      role: 'literary analysis writer',
      task: 'Generate comprehensive close reading analysis report',
      context: args,
      instructions: [
        'Present text identification and context',
        'State analytical approach and focus',
        'Present language analysis findings',
        'Document imagery analysis',
        'Present structural analysis',
        'Document intertextual findings',
        'Present synthesized interpretation',
        'Format as scholarly analysis'
      ],
      outputFormat: 'JSON with reportPath, sections, keyQuotations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
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
        keyQuotations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              analysis: { type: 'string' }
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
  labels: ['agent', 'reporting', 'close-reading', 'literary-analysis']
}));
