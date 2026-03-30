/**
 * @process specializations/domains/science/scientific-discovery/dialectical-reasoning
 * @description Dialectical Reasoning - Advance understanding through structured opposition, thesis-antithesis
 * synthesis, Socratic questioning, and systematic exploration of contradictions to develop more robust
 * theories, resolve tensions, and achieve deeper comprehension in scientific inquiry.
 * @inputs { thesis: string, domain: string, context?: string, antitheses?: string[], constraints?: object }
 * @outputs { success: boolean, synthesis: object, dialecticalProgress: object[], resolutions: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/dialectical-reasoning', {
 *   thesis: 'Consciousness emerges from computational processes',
 *   domain: 'Philosophy of Mind',
 *   antitheses: ['Chinese Room argument', 'Hard problem of consciousness'],
 *   context: 'Exploring theories of consciousness in cognitive science'
 * });
 *
 * @references
 * - Hegelian Dialectics: https://plato.stanford.edu/entries/hegel-dialectics/
 * - Socratic Method: https://plato.stanford.edu/entries/socrates/
 * - Critical Thinking: https://plato.stanford.edu/entries/critical-thinking/
 * - Argumentation Theory: https://plato.stanford.edu/entries/argument/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    thesis,
    domain,
    context = '',
    antitheses = [],
    constraints = {}
  } = inputs;

  // Phase 1: Thesis Analysis and Clarification
  const thesisAnalysis = await ctx.task(thesisAnalysisTask, {
    thesis,
    domain,
    context
  });

  // Quality Gate: Thesis must be articulable
  if (!thesisAnalysis.clarifiedThesis) {
    return {
      success: false,
      error: 'Could not clarify thesis for dialectical analysis',
      phase: 'thesis-analysis',
      synthesis: null
    };
  }

  // Phase 2: Antithesis Generation
  const antithesisGeneration = await ctx.task(antithesisGenerationTask, {
    thesis: thesisAnalysis.clarifiedThesis,
    providedAntitheses: antitheses,
    domain,
    context
  });

  // Phase 3: Contradiction Mapping
  const contradictionMapping = await ctx.task(contradictionMappingTask, {
    thesis: thesisAnalysis,
    antitheses: antithesisGeneration.antitheses,
    domain
  });

  // Phase 4: Socratic Examination
  const socraticExamination = await ctx.task(socraticExaminationTask, {
    thesis: thesisAnalysis,
    antitheses: antithesisGeneration.antitheses,
    contradictions: contradictionMapping.contradictions,
    domain
  });

  // Breakpoint: Review dialectical tensions
  await ctx.breakpoint({
    question: `Review dialectical tensions for thesis: "${thesis}". ${contradictionMapping.contradictions.length} contradictions identified. Proceed with synthesis?`,
    title: 'Dialectical Analysis Review',
    context: {
      runId: ctx.runId,
      thesis,
      antithesesCount: antithesisGeneration.antitheses.length,
      contradictionsCount: contradictionMapping.contradictions.length,
      files: [{
        path: 'artifacts/dialectical-tensions.json',
        format: 'json',
        content: { thesisAnalysis, antithesisGeneration, contradictionMapping, socraticExamination }
      }]
    }
  });

  // Phase 5: Mediation and Sublation Analysis
  const mediationAnalysis = await ctx.task(mediationSublationTask, {
    thesis: thesisAnalysis,
    antitheses: antithesisGeneration.antitheses,
    contradictions: contradictionMapping.contradictions,
    socraticFindings: socraticExamination.findings
  });

  // Phase 6: Synthesis Construction
  const synthesisConstruction = await ctx.task(synthesisConstructionTask, {
    thesis: thesisAnalysis,
    antitheses: antithesisGeneration.antitheses,
    mediations: mediationAnalysis.mediations,
    domain
  });

  // Phase 7: Synthesis Validation
  const synthesisValidation = await ctx.task(synthesisValidationTask, {
    originalThesis: thesisAnalysis,
    antitheses: antithesisGeneration.antitheses,
    synthesis: synthesisConstruction.synthesis,
    contradictions: contradictionMapping.contradictions
  });

  // Phase 8: Higher-Order Contradictions
  const higherOrderAnalysis = await ctx.task(higherOrderContradictionsTask, {
    synthesis: synthesisConstruction.synthesis,
    domain,
    context
  });

  // Phase 9: Dialectical Progress Assessment
  const progressAssessment = await ctx.task(dialecticalProgressTask, {
    originalThesis: thesisAnalysis,
    antitheses: antithesisGeneration.antitheses,
    synthesis: synthesisConstruction.synthesis,
    higherOrder: higherOrderAnalysis,
    domain
  });

  // Phase 10: Resolution and Recommendations
  const resolutionSynthesis = await ctx.task(resolutionSynthesisTask, {
    thesis: thesisAnalysis,
    antitheses: antithesisGeneration.antitheses,
    synthesis: synthesisConstruction.synthesis,
    validation: synthesisValidation,
    progress: progressAssessment,
    higherOrder: higherOrderAnalysis,
    domain,
    context
  });

  // Final Breakpoint: Dialectical Analysis Approval
  await ctx.breakpoint({
    question: `Dialectical reasoning complete. Synthesis achieved: "${synthesisConstruction.synthesis?.statement}". Approve analysis?`,
    title: 'Dialectical Analysis Approval',
    context: {
      runId: ctx.runId,
      thesis,
      synthesisStatement: synthesisConstruction.synthesis?.statement,
      progressScore: progressAssessment.progressScore,
      files: [
        { path: 'artifacts/dialectical-report.json', format: 'json', content: resolutionSynthesis },
        { path: 'artifacts/dialectical-report.md', format: 'markdown', content: resolutionSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    thesis: thesisAnalysis.clarifiedThesis,
    synthesis: synthesisConstruction.synthesis,
    dialecticalProgress: progressAssessment.progressSteps,
    resolutions: resolutionSynthesis.resolutions,
    analysis: {
      antitheses: antithesisGeneration.antitheses,
      contradictions: contradictionMapping.contradictions,
      mediations: mediationAnalysis.mediations,
      higherOrderTensions: higherOrderAnalysis.tensions
    },
    recommendations: resolutionSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/dialectical-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const thesisAnalysisTask = defineTask('thesis-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Thesis Analysis and Clarification',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Dialectical Philosopher specializing in thesis clarification',
      task: 'Analyze and clarify the thesis for dialectical examination',
      context: {
        thesis: args.thesis,
        domain: args.domain,
        context: args.context
      },
      instructions: [
        '1. Articulate the thesis in its clearest, most defensible form',
        '2. Identify the core claims and commitments of the thesis',
        '3. Distinguish explicit claims from implicit presuppositions',
        '4. Identify the historical/intellectual context of the thesis',
        '5. Clarify key terms and concepts used in the thesis',
        '6. Identify the scope and limits of the thesis',
        '7. Determine what evidence or arguments support the thesis',
        '8. Identify potential weaknesses or vulnerabilities',
        '9. Clarify what the thesis denies or excludes',
        '10. State the thesis in multiple formulations for clarity'
      ],
      outputFormat: 'JSON object with clarified thesis analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['clarifiedThesis', 'coreClaims'],
      properties: {
        clarifiedThesis: { type: 'string' },
        coreClaims: { type: 'array', items: { type: 'string' } },
        presuppositions: { type: 'array', items: { type: 'string' } },
        keyTerms: { type: 'array', items: { type: 'object' } },
        scope: { type: 'object' },
        supportingArguments: { type: 'array', items: { type: 'string' } },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        denials: { type: 'array', items: { type: 'string' } },
        alternativeFormulations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'thesis-analysis', 'clarification']
}));

export const antithesisGenerationTask = defineTask('antithesis-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Antithesis Generation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Critical Philosopher specializing in opposition generation',
      task: 'Generate and develop antitheses to the thesis',
      context: {
        thesis: args.thesis,
        providedAntitheses: args.providedAntitheses,
        domain: args.domain,
        context: args.context
      },
      instructions: [
        '1. Develop provided antitheses into full counterpositions',
        '2. Generate additional antitheses not yet considered',
        '3. Identify the strongest possible opposition to the thesis',
        '4. Develop internal critiques (contradictions within thesis)',
        '5. Develop external critiques (contradictions with other knowledge)',
        '6. Identify practical/empirical objections',
        '7. Identify theoretical/conceptual objections',
        '8. Steelman each antithesis to its strongest form',
        '9. Identify the core tension each antithesis creates',
        '10. Rank antitheses by dialectical significance'
      ],
      outputFormat: 'JSON object with developed antitheses'
    },
    outputSchema: {
      type: 'object',
      required: ['antitheses'],
      properties: {
        antitheses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              statement: { type: 'string' },
              type: { type: 'string', enum: ['internal', 'external', 'practical', 'theoretical'] },
              steelmanVersion: { type: 'string' },
              coreTension: { type: 'string' },
              significance: { type: 'string', enum: ['fundamental', 'significant', 'moderate', 'minor'] },
              supportingArguments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        strongestOpposition: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'antithesis', 'opposition']
}));

export const contradictionMappingTask = defineTask('contradiction-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Contradiction Mapping',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Dialectical Analyst specializing in contradiction identification',
      task: 'Map and analyze contradictions between thesis and antitheses',
      context: {
        thesis: args.thesis,
        antitheses: args.antitheses,
        domain: args.domain
      },
      instructions: [
        '1. Identify formal logical contradictions',
        '2. Identify dialectical contradictions (tensions that drive development)',
        '3. Distinguish real contradictions from apparent contradictions',
        '4. Identify contradictions at different levels (empirical, conceptual, methodological)',
        '5. Map relationships between contradictions',
        '6. Identify which contradictions are resolvable and which are fundamental',
        '7. Assess severity and implications of each contradiction',
        '8. Identify hidden compatibilities behind apparent contradictions',
        '9. Determine what must give way to resolve each contradiction',
        '10. Prioritize contradictions for resolution'
      ],
      outputFormat: 'JSON object with contradiction analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['contradictions'],
      properties: {
        contradictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              thesis: { type: 'string' },
              antithesis: { type: 'string' },
              type: { type: 'string', enum: ['formal', 'dialectical', 'apparent'] },
              level: { type: 'string', enum: ['empirical', 'conceptual', 'methodological', 'fundamental'] },
              resolvable: { type: 'boolean' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              implications: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        contradictionNetwork: { type: 'object' },
        hiddenCompatibilities: { type: 'array', items: { type: 'object' } },
        prioritizedResolution: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'contradiction', 'mapping']
}));

export const socraticExaminationTask = defineTask('socratic-examination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Socratic Examination',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Socratic Philosopher specializing in elenctic inquiry',
      task: 'Conduct Socratic examination of thesis and antitheses',
      context: {
        thesis: args.thesis,
        antitheses: args.antitheses,
        contradictions: args.contradictions,
        domain: args.domain
      },
      instructions: [
        '1. Generate probing questions that test the thesis',
        '2. Identify unexamined assumptions in thesis and antitheses',
        '3. Trace implications of each position to their conclusions',
        '4. Identify where definitions break down or become unclear',
        '5. Find edge cases that challenge both thesis and antitheses',
        '6. Identify what both sides take for granted',
        '7. Question the question - is the framing itself problematic?',
        '8. Identify deeper questions behind the surface debate',
        '9. Generate aporia (productive puzzlement) that drives inquiry',
        '10. Document key findings from Socratic examination'
      ],
      outputFormat: 'JSON object with Socratic examination findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'probingQuestions'],
      properties: {
        probingQuestions: { type: 'array', items: { type: 'object' } },
        unexaminedAssumptions: { type: 'array', items: { type: 'object' } },
        implications: { type: 'array', items: { type: 'object' } },
        definitionalBreakdowns: { type: 'array', items: { type: 'object' } },
        edgeCases: { type: 'array', items: { type: 'object' } },
        sharedAssumptions: { type: 'array', items: { type: 'string' } },
        framingProblems: { type: 'array', items: { type: 'string' } },
        deeperQuestions: { type: 'array', items: { type: 'string' } },
        aporia: { type: 'array', items: { type: 'object' } },
        findings: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'socratic-method', 'examination']
}));

export const mediationSublationTask = defineTask('mediation-sublation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Mediation and Sublation Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Hegelian Dialectician specializing in Aufhebung',
      task: 'Identify mediations and possibilities for sublation',
      context: {
        thesis: args.thesis,
        antitheses: args.antitheses,
        contradictions: args.contradictions,
        socraticFindings: args.socraticFindings
      },
      instructions: [
        '1. Identify mediating terms that connect thesis and antithesis',
        '2. Find what is preserved (aufgehoben) from thesis in higher unity',
        '3. Find what is preserved from antithesis in higher unity',
        '4. Identify what must be negated/transcended from both sides',
        '5. Identify the movement or process that generates resolution',
        '6. Find the higher standpoint from which both appear as moments',
        '7. Identify conceptual resources for synthesis',
        '8. Analyze partial syntheses already implicit in the debate',
        '9. Identify conditions under which thesis and antithesis are each valid',
        '10. Develop candidates for sublating synthesis'
      ],
      outputFormat: 'JSON object with mediation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['mediations'],
      properties: {
        mediations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              mediatingTerm: { type: 'string' },
              connectsThesis: { type: 'string' },
              connectsAntithesis: { type: 'string' },
              preservedFromThesis: { type: 'array', items: { type: 'string' } },
              preservedFromAntithesis: { type: 'array', items: { type: 'string' } },
              negated: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        higherStandpoint: { type: 'string' },
        validityConditions: { type: 'object' },
        synthesisCandidates: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'mediation', 'sublation']
}));

export const synthesisConstructionTask = defineTask('synthesis-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Synthesis Construction',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Dialectical Synthesist',
      task: 'Construct synthesis from thesis, antithesis, and mediations',
      context: {
        thesis: args.thesis,
        antitheses: args.antitheses,
        mediations: args.mediations,
        domain: args.domain
      },
      instructions: [
        '1. Formulate synthesis that preserves valid elements of thesis',
        '2. Incorporate valid elements from antitheses',
        '3. Resolve or transcend identified contradictions',
        '4. Ensure synthesis is not mere compromise but genuine advance',
        '5. Articulate what new understanding synthesis provides',
        '6. Identify limits and scope of synthesis',
        '7. Develop multiple candidate syntheses if appropriate',
        '8. Assess degree of resolution achieved',
        '9. Identify remaining tensions in synthesis',
        '10. State synthesis in clear, defensible form'
      ],
      outputFormat: 'JSON object with constructed synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis'],
      properties: {
        synthesis: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            preservedFromThesis: { type: 'array', items: { type: 'string' } },
            preservedFromAntitheses: { type: 'array', items: { type: 'string' } },
            newUnderstanding: { type: 'string' },
            resolvedContradictions: { type: 'array', items: { type: 'string' } },
            remainingTensions: { type: 'array', items: { type: 'string' } },
            scope: { type: 'string' }
          }
        },
        alternativeSyntheses: { type: 'array', items: { type: 'object' } },
        resolutionDegree: { type: 'string', enum: ['full', 'substantial', 'partial', 'minimal'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'synthesis', 'construction']
}));

export const synthesisValidationTask = defineTask('synthesis-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Synthesis Validation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Critical Evaluator of dialectical synthesis',
      task: 'Validate the synthesis against original tensions',
      context: {
        originalThesis: args.originalThesis,
        antitheses: args.antitheses,
        synthesis: args.synthesis,
        contradictions: args.contradictions
      },
      instructions: [
        '1. Verify synthesis genuinely resolves identified contradictions',
        '2. Check synthesis is not disguised thesis or antithesis',
        '3. Verify synthesis preserves what was valuable in each side',
        '4. Check synthesis does not introduce new unresolved contradictions',
        '5. Assess whether synthesis represents genuine cognitive advance',
        '6. Verify synthesis is internally coherent',
        '7. Check synthesis is compatible with broader knowledge',
        '8. Assess dialectical adequacy of synthesis',
        '9. Identify any forced or artificial elements in synthesis',
        '10. Provide overall validation assessment'
      ],
      outputFormat: 'JSON object with synthesis validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validation'],
      properties: {
        validation: {
          type: 'object',
          properties: {
            resolvesContradictions: { type: 'boolean' },
            notDisguisedPosition: { type: 'boolean' },
            preservesValue: { type: 'boolean' },
            internalCoherence: { type: 'boolean' },
            externalCompatibility: { type: 'boolean' },
            genuineAdvance: { type: 'boolean' },
            overallValidity: { type: 'string', enum: ['valid', 'partially-valid', 'questionable', 'invalid'] }
          }
        },
        concerns: { type: 'array', items: { type: 'object' } },
        artificialElements: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'validation', 'evaluation']
}));

export const higherOrderContradictionsTask = defineTask('higher-order-contradictions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Higher-Order Contradictions',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Dialectical Philosopher examining meta-level tensions',
      task: 'Identify higher-order contradictions with synthesis',
      context: {
        synthesis: args.synthesis,
        domain: args.domain,
        context: args.context
      },
      instructions: [
        '1. Identify new antitheses that could oppose the synthesis',
        '2. Find tensions between synthesis and established knowledge',
        '3. Identify methodological tensions in the dialectical process',
        '4. Find where synthesis creates new problems',
        '5. Identify unstable elements in synthesis likely to generate opposition',
        '6. Analyze potential for further dialectical development',
        '7. Identify the next thesis-antithesis cycle implicit in synthesis',
        '8. Find meta-level questions raised by the dialectical process',
        '9. Assess whether synthesis is resting point or transitional',
        '10. Map trajectory of potential further development'
      ],
      outputFormat: 'JSON object with higher-order analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['tensions'],
      properties: {
        tensions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tension: { type: 'string' },
              source: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'significant', 'moderate', 'minor'] },
              implicationsForSynthesis: { type: 'string' }
            }
          }
        },
        newAntitheses: { type: 'array', items: { type: 'object' } },
        newProblems: { type: 'array', items: { type: 'string' } },
        furtherDevelopment: { type: 'object' },
        synthesisStability: { type: 'string', enum: ['stable', 'transitional', 'unstable'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'higher-order', 'meta-analysis']
}));

export const dialecticalProgressTask = defineTask('dialectical-progress', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Dialectical Progress Assessment',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Dialectical Progress Evaluator',
      task: 'Assess the progress made through dialectical reasoning',
      context: {
        originalThesis: args.originalThesis,
        antitheses: args.antitheses,
        synthesis: args.synthesis,
        higherOrder: args.higherOrder,
        domain: args.domain
      },
      instructions: [
        '1. Document the progression from thesis through synthesis',
        '2. Assess what was learned through the dialectical process',
        '3. Evaluate depth and significance of understanding gained',
        '4. Identify conceptual clarifications achieved',
        '5. Assess resolution of original problematic',
        '6. Evaluate quality of dialectical reasoning employed',
        '7. Identify insights not available from thesis or antithesis alone',
        '8. Assess practical implications of dialectical progress',
        '9. Calculate overall progress score',
        '10. Identify directions for further inquiry'
      ],
      outputFormat: 'JSON object with progress assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['progressSteps', 'progressScore'],
      properties: {
        progressSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              description: { type: 'string' },
              advancement: { type: 'string' }
            }
          }
        },
        learnings: { type: 'array', items: { type: 'string' } },
        clarifications: { type: 'array', items: { type: 'string' } },
        novelInsights: { type: 'array', items: { type: 'string' } },
        resolutionQuality: { type: 'string', enum: ['excellent', 'good', 'adequate', 'partial', 'minimal'] },
        progressScore: { type: 'number', minimum: 0, maximum: 100 },
        furtherInquiry: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'progress', 'assessment']
}));

export const resolutionSynthesisTask = defineTask('resolution-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Resolution and Recommendations',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'dialectical-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Dialectical Resolution Expert',
      task: 'Synthesize all analyses and provide final resolutions',
      context: {
        thesis: args.thesis,
        antitheses: args.antitheses,
        synthesis: args.synthesis,
        validation: args.validation,
        progress: args.progress,
        higherOrder: args.higherOrder,
        domain: args.domain,
        context: args.context
      },
      instructions: [
        '1. Summarize the dialectical journey and its outcomes',
        '2. State final resolutions clearly',
        '3. Identify what remains unresolved and why',
        '4. Provide recommendations for further inquiry',
        '5. Highlight practical implications of findings',
        '6. Identify methodological lessons learned',
        '7. Suggest how synthesis can be applied or tested',
        '8. Note limitations of the dialectical analysis',
        '9. Provide guidance for related inquiries',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with resolutions and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['resolutions', 'recommendations', 'markdown'],
      properties: {
        resolutions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resolution: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              scope: { type: 'string' }
            }
          }
        },
        unresolvedIssues: { type: 'array', items: { type: 'object' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              type: { type: 'string', enum: ['inquiry', 'application', 'methodology'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        practicalImplications: { type: 'array', items: { type: 'string' } },
        methodologicalLessons: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['dialectical-reasoning', 'resolution', 'synthesis']
}));
