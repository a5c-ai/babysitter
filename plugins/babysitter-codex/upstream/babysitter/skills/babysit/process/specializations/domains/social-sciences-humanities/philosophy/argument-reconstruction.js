/**
 * @process philosophy/argument-reconstruction
 * @description Extract arguments from texts, identify premises and conclusions, map argument structure using Toulmin model or standard form, and assess logical validity and soundness
 * @inputs { sourceText: string, analysisModel: string, assessSoundness: boolean, outputDir: string }
 * @outputs { success: boolean, reconstructedArgument: object, structuralAnalysis: object, evaluation: object, artifacts: array }
 * @recommendedSkills SK-PHIL-002 (argument-mapping-reconstruction), SK-PHIL-001 (formal-logic-analysis), SK-PHIL-011 (fallacy-detection-analysis)
 * @recommendedAgents AG-PHIL-001 (logic-analyst-agent), AG-PHIL-006 (academic-philosophy-writer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    sourceText,
    analysisModel = 'toulmin',
    assessSoundness = true,
    outputDir = 'argument-reconstruction-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Text Analysis and Argument Identification
  ctx.log('info', 'Starting argument reconstruction: Analyzing source text');
  const textAnalysis = await ctx.task(textAnalysisTask, {
    sourceText,
    outputDir
  });

  if (!textAnalysis.success) {
    return {
      success: false,
      error: 'Text analysis failed',
      details: textAnalysis,
      metadata: { processId: 'philosophy/argument-reconstruction', timestamp: startTime }
    };
  }

  artifacts.push(...textAnalysis.artifacts);

  // Task 2: Premise and Conclusion Identification
  ctx.log('info', 'Identifying premises and conclusions');
  const componentIdentification = await ctx.task(componentIdentificationTask, {
    textAnalysis: textAnalysis.analysis,
    sourceText,
    outputDir
  });

  artifacts.push(...componentIdentification.artifacts);

  // Task 3: Argument Structure Mapping
  ctx.log('info', `Mapping argument structure using ${analysisModel} model`);
  const structureMapping = await ctx.task(structureMappingTask, {
    components: componentIdentification.components,
    analysisModel,
    outputDir
  });

  artifacts.push(...structureMapping.artifacts);

  // Task 4: Validity Assessment
  ctx.log('info', 'Assessing argument validity');
  const validityAssessment = await ctx.task(validityAssessmentTask, {
    structure: structureMapping.structure,
    components: componentIdentification.components,
    outputDir
  });

  artifacts.push(...validityAssessment.artifacts);

  // Task 5: Soundness Assessment (if requested)
  let soundnessAssessment = null;
  if (assessSoundness) {
    ctx.log('info', 'Assessing argument soundness');
    soundnessAssessment = await ctx.task(soundnessAssessmentTask, {
      components: componentIdentification.components,
      validityResult: validityAssessment.validity,
      outputDir
    });
    artifacts.push(...soundnessAssessment.artifacts);
  }

  // Breakpoint: Review reconstruction results
  await ctx.breakpoint({
    question: `Argument reconstruction complete. Found ${componentIdentification.components.premises.length} premises. Argument is ${validityAssessment.validity.isValid ? 'valid' : 'invalid'}. Review the reconstruction?`,
    title: 'Argument Reconstruction Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        analysisModel,
        premiseCount: componentIdentification.components.premises.length,
        isValid: validityAssessment.validity.isValid,
        isSound: soundnessAssessment?.soundness?.isSound
      }
    }
  });

  // Task 6: Generate Reconstruction Report
  ctx.log('info', 'Generating argument reconstruction report');
  const reconstructionReport = await ctx.task(reconstructionReportTask, {
    sourceText,
    textAnalysis,
    componentIdentification,
    structureMapping,
    validityAssessment,
    soundnessAssessment,
    analysisModel,
    outputDir
  });

  artifacts.push(...reconstructionReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    reconstructedArgument: {
      originalText: sourceText,
      components: componentIdentification.components,
      standardForm: componentIdentification.standardForm
    },
    structuralAnalysis: {
      model: analysisModel,
      structure: structureMapping.structure,
      diagram: structureMapping.diagram
    },
    evaluation: {
      validity: validityAssessment.validity,
      soundness: soundnessAssessment?.soundness,
      overallStrength: validityAssessment.validity.isValid && soundnessAssessment?.soundness?.isSound ? 'strong' : 'weak'
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/argument-reconstruction',
      timestamp: startTime,
      analysisModel,
      outputDir
    }
  };
}

// Task 1: Text Analysis
export const textAnalysisTask = defineTask('text-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze source text for argumentative content',
  agent: {
    name: 'text-analyst',
    prompt: {
      role: 'philosophical analyst',
      task: 'Analyze text to identify argumentative passages and rhetorical structure',
      context: args,
      instructions: [
        'Identify the main thesis or claim being argued',
        'Locate argumentative passages vs. exposition',
        'Note rhetorical devices and persuasive techniques',
        'Identify the argument context and purpose',
        'Detect multiple arguments if present',
        'Note any dialectical structure (objections and replies)',
        'Identify the argumentative genre (proof, refutation, explanation)',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with success, analysis (thesis, passages, context), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            mainThesis: { type: 'string' },
            argumentativePassages: { type: 'array', items: { type: 'string' } },
            context: { type: 'string' },
            genre: { type: 'string' },
            multipleArguments: { type: 'boolean' }
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
  labels: ['agent', 'philosophy', 'argument', 'text-analysis']
}));

// Task 2: Component Identification
export const componentIdentificationTask = defineTask('component-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify argument premises and conclusions',
  agent: {
    name: 'argument-analyst',
    prompt: {
      role: 'philosophical logician',
      task: 'Extract and identify all premises and conclusions from the argument',
      context: args,
      instructions: [
        'Identify all explicit premises stated in the text',
        'Identify implicit or suppressed premises',
        'Identify the main conclusion',
        'Identify any intermediate conclusions (sub-conclusions)',
        'Note premise and conclusion indicators',
        'Distinguish reasons from evidence',
        'Identify any background assumptions',
        'Present argument in standard form',
        'Save identification to output directory'
      ],
      outputFormat: 'JSON with components (premises, conclusion, assumptions), standardForm, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'standardForm', 'artifacts'],
      properties: {
        components: {
          type: 'object',
          properties: {
            premises: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  type: { type: 'string' },
                  explicit: { type: 'boolean' }
                }
              }
            },
            conclusion: { type: 'string' },
            intermediateConclusions: { type: 'array', items: { type: 'string' } },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        standardForm: { type: 'string' },
        indicators: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'argument', 'component-identification']
}));

// Task 3: Structure Mapping
export const structureMappingTask = defineTask('structure-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map argument structure using selected model',
  agent: {
    name: 'structure-mapper',
    prompt: {
      role: 'argumentation theorist',
      task: 'Map the argument structure using the specified analytical model',
      context: args,
      instructions: [
        'For Toulmin model: identify claim, grounds, warrant, backing, qualifier, rebuttal',
        'For standard form: arrange premises and conclusion with logical connectives',
        'Map dependencies between premises',
        'Identify linked vs. convergent premise structures',
        'Create argument diagram showing relationships',
        'Note any serial or divergent argument structures',
        'Identify the support relationships between components',
        'Save structure mapping to output directory'
      ],
      outputFormat: 'JSON with structure (model-specific components), diagram, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'diagram', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            claim: { type: 'string' },
            grounds: { type: 'array', items: { type: 'string' } },
            warrant: { type: 'string' },
            backing: { type: 'string' },
            qualifier: { type: 'string' },
            rebuttal: { type: 'string' },
            structureType: { type: 'string' },
            dependencies: { type: 'object' }
          }
        },
        diagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'argument', 'structure-mapping']
}));

// Task 4: Validity Assessment
export const validityAssessmentTask = defineTask('validity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess argument validity',
  agent: {
    name: 'validity-assessor',
    prompt: {
      role: 'philosophical logician',
      task: 'Assess whether the argument is logically valid',
      context: args,
      instructions: [
        'Determine if the conclusion follows necessarily from the premises',
        'Check if the argument form is valid',
        'Identify any formal logical fallacies',
        'Consider whether hidden premises would make the argument valid',
        'Assess the strength of inductive arguments (if applicable)',
        'Note any equivocation or ambiguity issues',
        'Provide counterexample if argument is invalid',
        'Save validity assessment to output directory'
      ],
      outputFormat: 'JSON with validity (isValid, fallacies, counterexample, explanation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validity', 'artifacts'],
      properties: {
        validity: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            argumentType: { type: 'string' },
            formalFallacies: { type: 'array', items: { type: 'string' } },
            counterexample: { type: 'string' },
            explanation: { type: 'string' },
            inductiveStrength: { type: 'number' }
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
  labels: ['agent', 'philosophy', 'argument', 'validity']
}));

// Task 5: Soundness Assessment
export const soundnessAssessmentTask = defineTask('soundness-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess argument soundness',
  agent: {
    name: 'soundness-assessor',
    prompt: {
      role: 'philosophical analyst',
      task: 'Assess whether the argument premises are true (soundness evaluation)',
      context: args,
      instructions: [
        'Evaluate the truth status of each premise',
        'Identify premises that are controversial or contested',
        'Note premises that require empirical verification',
        'Identify any question-begging premises',
        'Assess whether premises are well-supported',
        'Consider alternative interpretations of premises',
        'Determine overall soundness (valid + true premises)',
        'Save soundness assessment to output directory'
      ],
      outputFormat: 'JSON with soundness (isSound, premiseEvaluations, concerns), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['soundness', 'artifacts'],
      properties: {
        soundness: {
          type: 'object',
          properties: {
            isSound: { type: 'boolean' },
            premiseEvaluations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  premise: { type: 'string' },
                  truthStatus: { type: 'string' },
                  confidence: { type: 'string' },
                  concerns: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            overallConcerns: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'argument', 'soundness']
}));

// Task 6: Reconstruction Report
export const reconstructionReportTask = defineTask('reconstruction-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate argument reconstruction report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosophical analyst and technical writer',
      task: 'Generate comprehensive argument reconstruction report',
      context: args,
      instructions: [
        'Create executive summary of the argument analysis',
        'Present original text with key passages highlighted',
        'Document reconstructed argument in standard form',
        'Present structural analysis with diagram',
        'Include validity assessment with explanation',
        'Include soundness assessment if performed',
        'Discuss strengths and weaknesses of the argument',
        'Provide suggestions for strengthening the argument',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'argument', 'reporting']
}));
