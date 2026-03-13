/**
 * @process specializations/domains/science/scientific-discovery/hermeneutic-interpretive-reasoning
 * @description Hermeneutic Interpretive Reasoning - Systematically infer meaning, intent, and significance
 * from texts, artifacts, data, and human expressions using the hermeneutic circle, contextual analysis,
 * and interpretive frameworks for understanding scientific literature, historical sources, and cultural artifacts.
 * @inputs { artifact: object, context: object, interpretiveGoals: string[], background?: object }
 * @outputs { success: boolean, interpretations: object[], meanings: object[], understanding: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/hermeneutic-interpretive-reasoning', {
 *   artifact: { type: 'scientific-paper', content: 'Abstract and key claims', source: 'Journal of Physics', year: 1905 },
 *   context: { historicalPeriod: 'Early 20th century physics', scientificParadigm: 'Classical mechanics crisis' },
 *   interpretiveGoals: ['Understand theoretical innovation', 'Assess historical significance']
 * });
 *
 * @references
 * - Hermeneutics: https://plato.stanford.edu/entries/hermeneutics/
 * - Gadamer on Understanding: https://plato.stanford.edu/entries/gadamer/
 * - Ricoeur on Interpretation: https://plato.stanford.edu/entries/ricoeur/
 * - Philosophy of Science Interpretation: https://plato.stanford.edu/entries/scientific-knowledge-social/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    artifact,
    context,
    interpretiveGoals,
    background = {}
  } = inputs;

  // Phase 1: Pre-Understanding Articulation
  const preUnderstanding = await ctx.task(preUnderstandingTask, {
    artifact,
    context,
    interpretiveGoals,
    background
  });

  // Phase 2: Artifact Structural Analysis
  const structuralAnalysis = await ctx.task(structuralAnalysisTask, {
    artifact,
    preUnderstanding
  });

  // Quality Gate: Must have analyzable structure
  if (!structuralAnalysis.elements || structuralAnalysis.elements.length === 0) {
    return {
      success: false,
      error: 'Artifact lacks analyzable structural elements',
      phase: 'structural-analysis',
      interpretations: null
    };
  }

  // Phase 3: Contextual Horizon Mapping
  const horizonMapping = await ctx.task(contextualHorizonTask, {
    artifact,
    context,
    preUnderstanding,
    structuralAnalysis
  });

  // Phase 4: Part-Whole Dialectic (Hermeneutic Circle)
  const partWholeAnalysis = await ctx.task(partWholeDialecticTask, {
    artifact,
    structuralAnalysis,
    horizonMapping
  });

  // Breakpoint: Review initial interpretation
  await ctx.breakpoint({
    question: `Review initial hermeneutic analysis of "${artifact.type}". Hermeneutic circle iterations: ${partWholeAnalysis.iterations}. Continue with deeper interpretation?`,
    title: 'Hermeneutic Analysis Review',
    context: {
      runId: ctx.runId,
      artifactType: artifact.type,
      structuralElements: structuralAnalysis.elements?.length || 0,
      iterations: partWholeAnalysis.iterations,
      files: [{
        path: 'artifacts/hermeneutic-analysis.json',
        format: 'json',
        content: { preUnderstanding, structuralAnalysis, horizonMapping, partWholeAnalysis }
      }]
    }
  });

  // Phase 5: Authorial Intent Analysis
  const authorialIntent = await ctx.task(authorialIntentTask, {
    artifact,
    context,
    structuralAnalysis,
    horizonMapping
  });

  // Phase 6: Historical-Cultural Situatedness
  const historicalSituatedness = await ctx.task(historicalSituatednessTask, {
    artifact,
    context,
    horizonMapping,
    authorialIntent
  });

  // Phase 7: Fusion of Horizons
  const fusionOfHorizons = await ctx.task(fusionOfHorizonsTask, {
    artifact,
    preUnderstanding,
    horizonMapping,
    partWholeAnalysis,
    historicalSituatedness,
    interpretiveGoals
  });

  // Phase 8: Multiple Interpretation Generation
  const multipleInterpretations = await ctx.task(multipleInterpretationsTask, {
    artifact,
    fusionOfHorizons,
    authorialIntent,
    interpretiveGoals
  });

  // Phase 9: Interpretation Validation
  const interpretationValidation = await ctx.task(interpretationValidationTask, {
    artifact,
    interpretations: multipleInterpretations.interpretations,
    structuralAnalysis,
    horizonMapping
  });

  // Phase 10: Understanding Synthesis
  const understandingSynthesis = await ctx.task(understandingSynthesisTask, {
    artifact,
    preUnderstanding,
    partWholeAnalysis,
    fusionOfHorizons,
    interpretations: multipleInterpretations.interpretations,
    validation: interpretationValidation,
    interpretiveGoals,
    context
  });

  // Final Breakpoint: Interpretation Approval
  await ctx.breakpoint({
    question: `Hermeneutic interpretation complete for "${artifact.type}". ${multipleInterpretations.interpretations?.length || 0} interpretations developed. Approve understanding?`,
    title: 'Hermeneutic Interpretation Approval',
    context: {
      runId: ctx.runId,
      artifactType: artifact.type,
      interpretationCount: multipleInterpretations.interpretations?.length || 0,
      primaryInterpretation: understandingSynthesis.primaryInterpretation,
      files: [
        { path: 'artifacts/hermeneutic-report.json', format: 'json', content: understandingSynthesis },
        { path: 'artifacts/hermeneutic-report.md', format: 'markdown', content: understandingSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    artifact: artifact,
    interpretations: multipleInterpretations.interpretations,
    meanings: understandingSynthesis.meanings,
    understanding: {
      primary: understandingSynthesis.primaryInterpretation,
      horizonFusion: fusionOfHorizons.fusedUnderstanding,
      historicalContext: historicalSituatedness.situatedness,
      authorialIntent: authorialIntent.intent
    },
    hermeneuticProcess: {
      preUnderstanding: preUnderstanding.articulation,
      circleIterations: partWholeAnalysis.iterations,
      revisedUnderstanding: partWholeAnalysis.revisedUnderstanding
    },
    validation: interpretationValidation,
    recommendations: understandingSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/hermeneutic-interpretive-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const preUnderstandingTask = defineTask('pre-understanding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Pre-Understanding Articulation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Hermeneutic Philosopher specializing in pre-understanding',
      task: 'Articulate the pre-understanding brought to interpretation',
      context: {
        artifact: args.artifact,
        context: args.context,
        interpretiveGoals: args.interpretiveGoals,
        background: args.background
      },
      instructions: [
        '1. Articulate assumptions and expectations about the artifact',
        '2. Identify relevant background knowledge being brought',
        '3. Recognize potential prejudices (in Gadamerian sense)',
        '4. Identify interpretive tradition being used',
        '5. Articulate the "fore-structure" of understanding',
        '6. Identify questions being brought to the artifact',
        '7. Recognize perspective and standpoint of interpreter',
        '8. Identify concepts and categories being applied',
        '9. Articulate initial hypotheses about meaning',
        '10. Acknowledge limits of current understanding'
      ],
      outputFormat: 'JSON object with pre-understanding articulation'
    },
    outputSchema: {
      type: 'object',
      required: ['articulation'],
      properties: {
        articulation: {
          type: 'object',
          properties: {
            assumptions: { type: 'array', items: { type: 'string' } },
            expectations: { type: 'array', items: { type: 'string' } },
            backgroundKnowledge: { type: 'array', items: { type: 'string' } },
            prejudices: { type: 'array', items: { type: 'object' } },
            interpretiveTradition: { type: 'string' },
            questions: { type: 'array', items: { type: 'string' } }
          }
        },
        foreStructure: { type: 'object' },
        initialHypotheses: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'pre-understanding', 'interpretation']
}));

export const structuralAnalysisTask = defineTask('structural-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Artifact Structural Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Structural Analyst specializing in artifact decomposition',
      task: 'Analyze the structure and components of the artifact',
      context: {
        artifact: args.artifact,
        preUnderstanding: args.preUnderstanding
      },
      instructions: [
        '1. Identify constituent parts and elements of artifact',
        '2. Analyze relationships between parts',
        '3. Identify genre and form conventions',
        '4. Analyze syntactic and semantic structures',
        '5. Identify key terms and concepts',
        '6. Map argumentative or narrative structure',
        '7. Identify patterns and repetitions',
        '8. Note anomalies and unusual features',
        '9. Identify explicit and implicit claims',
        '10. Document structural organization'
      ],
      outputFormat: 'JSON object with structural analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['elements'],
      properties: {
        elements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              content: { type: 'string' },
              function: { type: 'string' }
            }
          }
        },
        relationships: { type: 'array', items: { type: 'object' } },
        genreConventions: { type: 'array', items: { type: 'string' } },
        keyTerms: { type: 'array', items: { type: 'object' } },
        structure: { type: 'object' },
        patterns: { type: 'array', items: { type: 'object' } },
        anomalies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'structural-analysis', 'decomposition']
}));

export const contextualHorizonTask = defineTask('contextual-horizon', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Contextual Horizon Mapping',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Contextual Analyst specializing in horizon identification',
      task: 'Map the contextual horizons relevant to interpretation',
      context: {
        artifact: args.artifact,
        context: args.context,
        preUnderstanding: args.preUnderstanding,
        structuralAnalysis: args.structuralAnalysis
      },
      instructions: [
        '1. Identify the historical horizon of the artifact',
        '2. Map the cultural context of creation',
        '3. Identify intellectual and disciplinary context',
        '4. Map intertextual relationships',
        '5. Identify the intended audience horizon',
        '6. Map the interpreter\'s contemporary horizon',
        '7. Identify tensions between horizons',
        '8. Map relevant traditions of interpretation',
        '9. Identify "effective history" (Wirkungsgeschichte)',
        '10. Document contextual factors affecting meaning'
      ],
      outputFormat: 'JSON object with contextual horizon mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['horizons'],
      properties: {
        horizons: {
          type: 'object',
          properties: {
            historical: { type: 'object' },
            cultural: { type: 'object' },
            intellectual: { type: 'object' },
            intended: { type: 'object' },
            contemporary: { type: 'object' }
          }
        },
        intertextualRelations: { type: 'array', items: { type: 'object' } },
        horizonTensions: { type: 'array', items: { type: 'object' } },
        effectiveHistory: { type: 'array', items: { type: 'object' } },
        interpretiveTraditions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'horizon-mapping', 'context']
}));

export const partWholeDialecticTask = defineTask('part-whole-dialectic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Part-Whole Dialectic (Hermeneutic Circle)',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Hermeneutic Circle Analyst',
      task: 'Engage the hermeneutic circle between parts and whole',
      context: {
        artifact: args.artifact,
        structuralAnalysis: args.structuralAnalysis,
        horizonMapping: args.horizonMapping
      },
      instructions: [
        '1. Interpret individual parts in light of initial whole-understanding',
        '2. Revise understanding of whole based on part interpretations',
        '3. Iterate between part and whole interpretations',
        '4. Identify where parts challenge whole-understanding',
        '5. Identify where whole illuminates puzzling parts',
        '6. Track how understanding evolves through iterations',
        '7. Identify stable interpretations across iterations',
        '8. Note persistent tensions between parts and whole',
        '9. Document the dialectical movement of understanding',
        '10. Articulate revised understanding after circle engagement'
      ],
      outputFormat: 'JSON object with hermeneutic circle analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['iterations', 'revisedUnderstanding'],
      properties: {
        iterations: { type: 'number' },
        partInterpretations: { type: 'array', items: { type: 'object' } },
        wholeInterpretations: { type: 'array', items: { type: 'object' } },
        understandingEvolution: { type: 'array', items: { type: 'object' } },
        stableInterpretations: { type: 'array', items: { type: 'string' } },
        persistentTensions: { type: 'array', items: { type: 'object' } },
        dialecticalMovement: { type: 'object' },
        revisedUnderstanding: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'hermeneutic-circle', 'dialectic']
}));

export const authorialIntentTask = defineTask('authorial-intent', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Authorial Intent Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Intentionalist Interpreter',
      task: 'Analyze and infer authorial intent',
      context: {
        artifact: args.artifact,
        context: args.context,
        structuralAnalysis: args.structuralAnalysis,
        horizonMapping: args.horizonMapping
      },
      instructions: [
        '1. Identify explicit statements of purpose or intent',
        '2. Infer implicit intentions from choices made',
        '3. Analyze rhetorical strategies as evidence of intent',
        '4. Consider author\'s known purposes and concerns',
        '5. Distinguish illocutionary from perlocutionary intent',
        '6. Consider multiple layers of possible intent',
        '7. Assess whether intent is recoverable',
        '8. Consider the "intentional fallacy" critique',
        '9. Distinguish intended from unintended meanings',
        '10. Assess role of intent in interpretation'
      ],
      outputFormat: 'JSON object with authorial intent analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['intent'],
      properties: {
        intent: {
          type: 'object',
          properties: {
            explicit: { type: 'array', items: { type: 'string' } },
            inferred: { type: 'array', items: { type: 'object' } },
            illocutionary: { type: 'array', items: { type: 'string' } },
            perlocutionary: { type: 'array', items: { type: 'string' } }
          }
        },
        recoverability: { type: 'string', enum: ['clear', 'partial', 'uncertain', 'inaccessible'] },
        unintendedMeanings: { type: 'array', items: { type: 'object' } },
        intentRelevance: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'authorial-intent', 'interpretation']
}));

export const historicalSituatednessTask = defineTask('historical-situatedness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Historical-Cultural Situatedness',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Historical Context Expert',
      task: 'Analyze how historical-cultural context shapes meaning',
      context: {
        artifact: args.artifact,
        context: args.context,
        horizonMapping: args.horizonMapping,
        authorialIntent: args.authorialIntent
      },
      instructions: [
        '1. Identify how historical circumstances shaped the artifact',
        '2. Analyze cultural assumptions embedded in artifact',
        '3. Identify period-specific meanings of terms',
        '4. Analyze what was taken for granted in original context',
        '5. Identify what the artifact was responding to',
        '6. Analyze how original audience would have understood it',
        '7. Identify meanings lost or transformed over time',
        '8. Analyze how traditions of interpretation have shaped reception',
        '9. Identify anachronistic readings to avoid',
        '10. Document the situatedness of meaning'
      ],
      outputFormat: 'JSON object with historical situatedness analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['situatedness'],
      properties: {
        situatedness: {
          type: 'object',
          properties: {
            historicalCircumstances: { type: 'array', items: { type: 'object' } },
            culturalAssumptions: { type: 'array', items: { type: 'string' } },
            periodMeanings: { type: 'array', items: { type: 'object' } },
            originalResponse: { type: 'string' },
            originalReception: { type: 'string' }
          }
        },
        transformedMeanings: { type: 'array', items: { type: 'object' } },
        interpretiveHistory: { type: 'array', items: { type: 'object' } },
        anachronismWarnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'historical-context', 'situatedness']
}));

export const fusionOfHorizonsTask = defineTask('fusion-of-horizons', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Fusion of Horizons',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Gadamerian Interpreter specializing in horizon fusion',
      task: 'Achieve fusion of horizons between interpreter and artifact',
      context: {
        artifact: args.artifact,
        preUnderstanding: args.preUnderstanding,
        horizonMapping: args.horizonMapping,
        partWholeAnalysis: args.partWholeAnalysis,
        historicalSituatedness: args.historicalSituatedness,
        interpretiveGoals: args.interpretiveGoals
      },
      instructions: [
        '1. Identify points of contact between horizons',
        '2. Recognize productive prejudices enabling understanding',
        '3. Identify prejudices that block understanding',
        '4. Find where artifact speaks to contemporary concerns',
        '5. Identify what artifact can teach that is new',
        '6. Allow artifact to challenge interpreter\'s assumptions',
        '7. Develop understanding that neither horizon had alone',
        '8. Articulate the fused understanding achieved',
        '9. Identify expanded horizon resulting from encounter',
        '10. Document the dialogical achievement'
      ],
      outputFormat: 'JSON object with fusion of horizons'
    },
    outputSchema: {
      type: 'object',
      required: ['fusedUnderstanding'],
      properties: {
        contactPoints: { type: 'array', items: { type: 'object' } },
        productivePrejudices: { type: 'array', items: { type: 'string' } },
        blockingPrejudices: { type: 'array', items: { type: 'string' } },
        contemporaryRelevance: { type: 'array', items: { type: 'object' } },
        newInsights: { type: 'array', items: { type: 'string' } },
        challengedAssumptions: { type: 'array', items: { type: 'string' } },
        fusedUnderstanding: { type: 'string' },
        expandedHorizon: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'fusion-of-horizons', 'gadamer']
}));

export const multipleInterpretationsTask = defineTask('multiple-interpretations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Multiple Interpretation Generation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Interpretive Pluralist',
      task: 'Generate multiple valid interpretations of the artifact',
      context: {
        artifact: args.artifact,
        fusionOfHorizons: args.fusionOfHorizons,
        authorialIntent: args.authorialIntent,
        interpretiveGoals: args.interpretiveGoals
      },
      instructions: [
        '1. Develop interpretation focused on authorial intent',
        '2. Develop interpretation focused on text itself',
        '3. Develop interpretation focused on reader response',
        '4. Develop interpretation from different theoretical frameworks',
        '5. Identify what each interpretation illuminates',
        '6. Identify what each interpretation obscures',
        '7. Assess relative strengths of interpretations',
        '8. Identify complementary vs competing interpretations',
        '9. Determine which interpretations best serve goals',
        '10. Document the interpretation space'
      ],
      outputFormat: 'JSON object with multiple interpretations'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretations'],
      properties: {
        interpretations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              approach: { type: 'string' },
              interpretation: { type: 'string' },
              illuminates: { type: 'array', items: { type: 'string' } },
              obscures: { type: 'array', items: { type: 'string' } },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              framework: { type: 'string' }
            }
          }
        },
        complementary: { type: 'array', items: { type: 'array' } },
        competing: { type: 'array', items: { type: 'array' } },
        bestForGoals: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'multiple-interpretations', 'pluralism']
}));

export const interpretationValidationTask = defineTask('interpretation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Interpretation Validation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Interpretation Validator',
      task: 'Validate interpretations against evidence and criteria',
      context: {
        artifact: args.artifact,
        interpretations: args.interpretations,
        structuralAnalysis: args.structuralAnalysis,
        horizonMapping: args.horizonMapping
      },
      instructions: [
        '1. Check each interpretation against textual evidence',
        '2. Assess internal coherence of interpretations',
        '3. Check consistency with contextual information',
        '4. Assess explanatory power of each interpretation',
        '5. Check for over-interpretation or eisegesis',
        '6. Assess falsifiability of interpretive claims',
        '7. Check alignment with genre expectations',
        '8. Assess intersubjective validity',
        '9. Identify strongest and weakest interpretations',
        '10. Document validation results'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults'],
      properties: {
        validationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interpretationId: { type: 'string' },
              textualEvidence: { type: 'string', enum: ['strong', 'adequate', 'weak'] },
              internalCoherence: { type: 'string', enum: ['coherent', 'mostly-coherent', 'problematic'] },
              contextualFit: { type: 'string', enum: ['fits', 'partially-fits', 'conflicts'] },
              explanatoryPower: { type: 'string', enum: ['high', 'medium', 'low'] },
              overinterpretation: { type: 'boolean' },
              overallValidity: { type: 'string', enum: ['valid', 'plausible', 'questionable', 'invalid'] }
            }
          }
        },
        strongestInterpretations: { type: 'array', items: { type: 'string' } },
        weakestInterpretations: { type: 'array', items: { type: 'string' } },
        validationNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'validation', 'evidence']
}));

export const understandingSynthesisTask = defineTask('understanding-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Understanding Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'interpretive-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Hermeneutic Synthesist',
      task: 'Synthesize interpretive work into comprehensive understanding',
      context: {
        artifact: args.artifact,
        preUnderstanding: args.preUnderstanding,
        partWholeAnalysis: args.partWholeAnalysis,
        fusionOfHorizons: args.fusionOfHorizons,
        interpretations: args.interpretations,
        validation: args.validation,
        interpretiveGoals: args.interpretiveGoals,
        context: args.context
      },
      instructions: [
        '1. Synthesize validated interpretations into coherent understanding',
        '2. Articulate primary interpretation with justification',
        '3. Document key meanings discovered',
        '4. Summarize how understanding evolved through process',
        '5. Identify what remains uncertain or debatable',
        '6. Articulate significance of understanding achieved',
        '7. Address interpretive goals with findings',
        '8. Identify implications for further inquiry',
        '9. Provide recommendations for application',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with understanding synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryInterpretation', 'meanings', 'recommendations', 'markdown'],
      properties: {
        primaryInterpretation: { type: 'string' },
        meanings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meaning: { type: 'string' },
              significance: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        understandingEvolution: { type: 'object' },
        uncertainties: { type: 'array', items: { type: 'string' } },
        goalAddressed: { type: 'array', items: { type: 'object' } },
        implications: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hermeneutics', 'synthesis', 'understanding']
}));
