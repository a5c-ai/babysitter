/**
 * @process philosophy/modal-logic-application
 * @description Apply modal logic frameworks to analyze necessity, possibility, and contingency claims in metaphysical and theological arguments
 * @inputs { argumentText: string, modalSystem: string, domainContext: string, outputDir: string }
 * @outputs { success: boolean, modalAnalysis: object, possibleWorldsSemantics: object, validityResult: object, artifacts: array }
 * @recommendedSkills SK-PHIL-001 (formal-logic-analysis), SK-PHIL-005 (conceptual-analysis)
 * @recommendedAgents AG-PHIL-001 (logic-analyst-agent), AG-PHIL-004 (metaphysics-epistemology-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    argumentText,
    modalSystem = 'S5',
    domainContext = 'metaphysical',
    outputDir = 'modal-logic-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Modal Claim Identification
  ctx.log('info', 'Starting modal logic analysis: Identifying modal claims');
  const modalIdentification = await ctx.task(modalIdentificationTask, {
    argumentText,
    domainContext,
    outputDir
  });

  if (!modalIdentification.success) {
    return {
      success: false,
      error: 'Modal claim identification failed',
      details: modalIdentification,
      metadata: { processId: 'philosophy/modal-logic-application', timestamp: startTime }
    };
  }

  artifacts.push(...modalIdentification.artifacts);

  // Task 2: Modal Formalization
  ctx.log('info', 'Formalizing modal claims');
  const modalFormalization = await ctx.task(modalFormalizationTask, {
    modalClaims: modalIdentification.claims,
    modalSystem,
    outputDir
  });

  artifacts.push(...modalFormalization.artifacts);

  // Task 3: Possible Worlds Analysis
  ctx.log('info', 'Analyzing possible worlds semantics');
  const possibleWorldsAnalysis = await ctx.task(possibleWorldsAnalysisTask, {
    formalizedClaims: modalFormalization.formalized,
    modalSystem,
    outputDir
  });

  artifacts.push(...possibleWorldsAnalysis.artifacts);

  // Task 4: Modal Validity Evaluation
  ctx.log('info', 'Evaluating modal validity');
  const validityEvaluation = await ctx.task(modalValidityTask, {
    formalizedArgument: modalFormalization.formalized,
    modalSystem,
    possibleWorldsModel: possibleWorldsAnalysis.model,
    outputDir
  });

  artifacts.push(...validityEvaluation.artifacts);

  // Task 5: Modal Fallacy Check
  ctx.log('info', 'Checking for modal fallacies');
  const modalFallacyCheck = await ctx.task(modalFallacyCheckTask, {
    argument: modalFormalization.formalized,
    modalSystem,
    outputDir
  });

  artifacts.push(...modalFallacyCheck.artifacts);

  // Breakpoint: Review modal analysis
  await ctx.breakpoint({
    question: `Modal logic analysis complete using ${modalSystem} system. Argument is ${validityEvaluation.validity.isValid ? 'modally valid' : 'modally invalid'}. Review the analysis?`,
    title: 'Modal Logic Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        modalSystem,
        domainContext,
        isValid: validityEvaluation.validity.isValid,
        modalOperators: modalIdentification.claims.operators,
        fallaciesFound: modalFallacyCheck.fallacies.length
      }
    }
  });

  // Task 6: Generate Modal Analysis Report
  ctx.log('info', 'Generating modal logic analysis report');
  const analysisReport = await ctx.task(modalReportTask, {
    argumentText,
    modalIdentification,
    modalFormalization,
    possibleWorldsAnalysis,
    validityEvaluation,
    modalFallacyCheck,
    modalSystem,
    domainContext,
    outputDir
  });

  artifacts.push(...analysisReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    modalAnalysis: {
      originalArgument: argumentText,
      modalClaims: modalIdentification.claims,
      formalizedForm: modalFormalization.formalized,
      operators: modalIdentification.claims.operators
    },
    possibleWorldsSemantics: {
      model: possibleWorldsAnalysis.model,
      accessibilityRelation: possibleWorldsAnalysis.accessibility,
      worldDescriptions: possibleWorldsAnalysis.worlds
    },
    validityResult: {
      isValid: validityEvaluation.validity.isValid,
      modalSystem,
      proof: validityEvaluation.validity.proof,
      countermodel: validityEvaluation.validity.countermodel
    },
    modalFallacies: modalFallacyCheck.fallacies,
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/modal-logic-application',
      timestamp: startTime,
      modalSystem,
      domainContext,
      outputDir
    }
  };
}

// Task 1: Modal Identification
export const modalIdentificationTask = defineTask('modal-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify modal claims in argument',
  agent: {
    name: 'modal-analyst',
    prompt: {
      role: 'modal logician',
      task: 'Identify and extract modal claims from the argument text',
      context: args,
      instructions: [
        'Identify necessity claims (must, necessarily, cannot be otherwise)',
        'Identify possibility claims (might, possibly, could)',
        'Identify contingency claims (happens to be, actually)',
        'Identify impossibility claims (cannot, impossible)',
        'Note de re vs. de dicto distinctions',
        'Identify scope of modal operators',
        'Note any epistemic vs. alethic modal claims',
        'For theological context: identify divine necessity claims',
        'Save modal claim analysis to output directory'
      ],
      outputFormat: 'JSON with success, claims (necessity, possibility, operators), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'claims', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        claims: {
          type: 'object',
          properties: {
            necessityClaims: { type: 'array', items: { type: 'string' } },
            possibilityClaims: { type: 'array', items: { type: 'string' } },
            contingencyClaims: { type: 'array', items: { type: 'string' } },
            operators: { type: 'array', items: { type: 'string' } },
            deReClaims: { type: 'array', items: { type: 'string' } },
            deDictoClaims: { type: 'array', items: { type: 'string' } },
            modalType: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'modal-logic', 'identification']
}));

// Task 2: Modal Formalization
export const modalFormalizationTask = defineTask('modal-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize modal claims in symbolic notation',
  agent: {
    name: 'modal-formalizer',
    prompt: {
      role: 'modal logician',
      task: 'Translate modal claims into formal modal logic notation',
      context: args,
      instructions: [
        'Use box (necessity) and diamond (possibility) operators',
        'Formalize propositions with modal operators',
        'Respect scope distinctions carefully',
        'Apply appropriate quantifier-modal interactions',
        'Create symbol legend for all propositions',
        'Ensure formalization matches specified modal system',
        'Document any interpretive choices made',
        'Save formalization to output directory'
      ],
      outputFormat: 'JSON with formalized (premises, conclusion, fullForm), symbolLegend, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formalized', 'symbolLegend', 'artifacts'],
      properties: {
        formalized: {
          type: 'object',
          properties: {
            premises: { type: 'array', items: { type: 'string' } },
            conclusion: { type: 'string' },
            fullForm: { type: 'string' }
          }
        },
        symbolLegend: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        interpretiveNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'modal-logic', 'formalization']
}));

// Task 3: Possible Worlds Analysis
export const possibleWorldsAnalysisTask = defineTask('possible-worlds-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze using possible worlds semantics',
  agent: {
    name: 'possible-worlds-analyst',
    prompt: {
      role: 'modal semanticist',
      task: 'Apply possible worlds semantics to evaluate modal claims',
      context: args,
      instructions: [
        'Define the set of possible worlds relevant to the argument',
        'Specify the accessibility relation for the modal system',
        'Evaluate truth at each relevant world',
        'Check necessity claims across all accessible worlds',
        'Check possibility claims for existence in some world',
        'Model any rigid designators or essential properties',
        'For S5: verify universal accessibility',
        'Create possible worlds diagram',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with model (worlds, accessibility), worldDescriptions, evaluations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'worlds', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            worldSet: { type: 'array', items: { type: 'string' } },
            actualWorld: { type: 'string' },
            accessibilityType: { type: 'string' }
          }
        },
        accessibility: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        worlds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              truthValues: { type: 'object' }
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
  labels: ['agent', 'philosophy', 'modal-logic', 'possible-worlds']
}));

// Task 4: Modal Validity Evaluation
export const modalValidityTask = defineTask('modal-validity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate modal validity of argument',
  agent: {
    name: 'modal-validity-evaluator',
    prompt: {
      role: 'modal logician',
      task: 'Evaluate whether the argument is valid in the specified modal system',
      context: args,
      instructions: [
        'Apply semantic evaluation using possible worlds model',
        'Check if conclusion true in all worlds where premises true',
        'Verify argument respects modal system axioms',
        'For S5: check characteristic axioms (T, 4, 5)',
        'Construct proof if valid',
        'Construct countermodel if invalid',
        'Note if validity depends on modal system choice',
        'Save validity evaluation to output directory'
      ],
      outputFormat: 'JSON with validity (isValid, proof, countermodel, systemDependence), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validity', 'artifacts'],
      properties: {
        validity: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            modalSystem: { type: 'string' },
            proof: {
              type: 'object',
              properties: {
                steps: { type: 'array' },
                complete: { type: 'boolean' }
              }
            },
            countermodel: {
              type: 'object',
              properties: {
                worlds: { type: 'array' },
                assignment: { type: 'object' },
                explanation: { type: 'string' }
              }
            },
            systemDependence: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'modal-logic', 'validity']
}));

// Task 5: Modal Fallacy Check
export const modalFallacyCheckTask = defineTask('modal-fallacy-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check for modal fallacies',
  agent: {
    name: 'modal-fallacy-detector',
    prompt: {
      role: 'modal logician',
      task: 'Identify any modal fallacies in the argument',
      context: args,
      instructions: [
        'Check for modal scope fallacies',
        'Check for necessitation fallacy (inferring necessity from truth)',
        'Check for modal shift (illicit change of modal operator)',
        'Check for de re/de dicto confusion',
        'Check for quantifier-modal scope errors',
        'Check for accessibility relation violations',
        'Note any S5 specific fallacies if applicable',
        'Save fallacy analysis to output directory'
      ],
      outputFormat: 'JSON with fallacies (name, type, explanation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fallacies', 'artifacts'],
      properties: {
        fallacies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              location: { type: 'string' },
              explanation: { type: 'string' },
              correction: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'modal-logic', 'fallacy']
}));

// Task 6: Modal Analysis Report
export const modalReportTask = defineTask('modal-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate modal logic analysis report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'modal logician and technical writer',
      task: 'Generate comprehensive modal logic analysis report',
      context: args,
      instructions: [
        'Create executive summary of modal analysis',
        'Present original argument with modal claims highlighted',
        'Document formalization with symbol legend',
        'Present possible worlds model with diagram',
        'Include validity proof or countermodel',
        'Document any modal fallacies found',
        'Discuss philosophical implications',
        'Note modal system assumptions and alternatives',
        'Format as professional Markdown report',
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
  labels: ['agent', 'philosophy', 'modal-logic', 'reporting']
}));
