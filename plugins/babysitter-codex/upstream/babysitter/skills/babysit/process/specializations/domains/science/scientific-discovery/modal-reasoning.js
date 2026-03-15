/**
 * @process specializations/domains/science/scientific-discovery/modal-reasoning
 * @description Modal Reasoning - Reason systematically with necessity, possibility, epistemic operators,
 * and dynamic modalities to explore what must be, what could be, what is known, and what changes across
 * possible worlds in scientific discovery, hypothesis evaluation, and theoretical analysis.
 * @inputs { proposition: string, domain: string, modalContext?: object, constraints?: object }
 * @outputs { success: boolean, modalAnalysis: object, possibleWorlds: object[], necessityAssessment: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/modal-reasoning', {
 *   proposition: 'Dark matter exists as weakly interacting massive particles',
 *   domain: 'Cosmology',
 *   modalContext: { type: 'epistemic', knownConstraints: ['Galaxy rotation curves', 'Gravitational lensing'] }
 * });
 *
 * @references
 * - Modal Logic: https://plato.stanford.edu/entries/logic-modal/
 * - Possible Worlds: https://plato.stanford.edu/entries/possible-worlds/
 * - Epistemic Logic: https://plato.stanford.edu/entries/logic-epistemic/
 * - Counterfactual Conditionals: https://plato.stanford.edu/entries/counterfactuals/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    proposition,
    domain,
    modalContext = {},
    constraints = {}
  } = inputs;

  // Phase 1: Proposition Analysis
  const propositionAnalysis = await ctx.task(propositionAnalysisTask, {
    proposition,
    domain,
    modalContext
  });

  // Quality Gate: Proposition must be analyzable
  if (!propositionAnalysis.parsedProposition) {
    return {
      success: false,
      error: 'Proposition cannot be parsed for modal analysis',
      phase: 'proposition-analysis',
      modalAnalysis: null
    };
  }

  // Phase 2: Modal Operator Identification
  const modalOperators = await ctx.task(modalOperatorTask, {
    proposition: propositionAnalysis,
    modalContext
  });

  // Phase 3: Possible Worlds Framework Construction
  const possibleWorlds = await ctx.task(possibleWorldsTask, {
    proposition: propositionAnalysis,
    modalOperators,
    domain,
    constraints
  });

  // Phase 4: Necessity Analysis
  const necessityAnalysis = await ctx.task(necessityAnalysisTask, {
    proposition: propositionAnalysis,
    possibleWorlds,
    modalContext
  });

  // Breakpoint: Review modal framework
  await ctx.breakpoint({
    question: `Review modal framework for "${proposition}". ${possibleWorlds.worlds?.length || 0} possible worlds constructed. Continue analysis?`,
    title: 'Modal Framework Review',
    context: {
      runId: ctx.runId,
      proposition,
      worldCount: possibleWorlds.worlds?.length || 0,
      necessaryInAll: necessityAnalysis.necessaryInAll,
      files: [{
        path: 'artifacts/modal-framework.json',
        format: 'json',
        content: { propositionAnalysis, modalOperators, possibleWorlds, necessityAnalysis }
      }]
    }
  });

  // Phase 5: Possibility Analysis
  const possibilityAnalysis = await ctx.task(possibilityAnalysisTask, {
    proposition: propositionAnalysis,
    possibleWorlds,
    necessityAnalysis
  });

  // Phase 6: Epistemic Modal Analysis
  const epistemicAnalysis = await ctx.task(epistemicModalTask, {
    proposition: propositionAnalysis,
    possibleWorlds,
    modalContext,
    domain
  });

  // Phase 7: Dynamic Modal Analysis
  const dynamicAnalysis = await ctx.task(dynamicModalTask, {
    proposition: propositionAnalysis,
    possibleWorlds,
    modalContext
  });

  // Phase 8: Counterfactual Analysis
  const counterfactualAnalysis = await ctx.task(counterfactualModalTask, {
    proposition: propositionAnalysis,
    possibleWorlds,
    necessityAnalysis
  });

  // Phase 9: Modal Inference Generation
  const modalInferences = await ctx.task(modalInferenceTask, {
    proposition: propositionAnalysis,
    necessityAnalysis,
    possibilityAnalysis,
    epistemicAnalysis,
    dynamicAnalysis,
    counterfactualAnalysis
  });

  // Phase 10: Modal Analysis Synthesis
  const modalSynthesis = await ctx.task(modalSynthesisTask, {
    proposition: propositionAnalysis,
    possibleWorlds,
    necessityAnalysis,
    possibilityAnalysis,
    epistemicAnalysis,
    dynamicAnalysis,
    counterfactualAnalysis,
    modalInferences,
    domain,
    modalContext
  });

  // Final Breakpoint: Modal Analysis Approval
  await ctx.breakpoint({
    question: `Modal analysis complete for "${proposition}". Approve findings?`,
    title: 'Modal Analysis Approval',
    context: {
      runId: ctx.runId,
      proposition,
      modalStatus: modalSynthesis.modalStatus,
      files: [
        { path: 'artifacts/modal-analysis-report.json', format: 'json', content: modalSynthesis },
        { path: 'artifacts/modal-analysis-report.md', format: 'markdown', content: modalSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    proposition,
    modalAnalysis: {
      operators: modalOperators.operators,
      necessity: necessityAnalysis,
      possibility: possibilityAnalysis,
      epistemic: epistemicAnalysis,
      dynamic: dynamicAnalysis,
      counterfactual: counterfactualAnalysis
    },
    possibleWorlds: possibleWorlds.worlds,
    necessityAssessment: necessityAnalysis,
    inferences: modalInferences.inferences,
    recommendations: modalSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/modal-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const propositionAnalysisTask = defineTask('proposition-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Proposition Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Modal Logic Expert',
      task: 'Analyze proposition for modal reasoning',
      context: {
        proposition: args.proposition,
        domain: args.domain,
        modalContext: args.modalContext
      },
      instructions: [
        '1. Parse the proposition into logical components',
        '2. Identify explicit modal terms (must, might, possibly, necessarily)',
        '3. Identify implicit modal claims',
        '4. Determine the logical structure of the proposition',
        '5. Identify predicates, subjects, and quantifiers',
        '6. Determine the type of modal claim being made',
        '7. Identify scope of modal operators',
        '8. Clarify ambiguities in modal expression',
        '9. Identify truth conditions for the proposition',
        '10. Document proposition in formal modal notation'
      ],
      outputFormat: 'JSON object with parsed proposition'
    },
    outputSchema: {
      type: 'object',
      required: ['parsedProposition', 'modalTerms'],
      properties: {
        parsedProposition: {
          type: 'object',
          properties: {
            original: { type: 'string' },
            formalRepresentation: { type: 'string' },
            logicalStructure: { type: 'object' },
            predicates: { type: 'array', items: { type: 'string' } },
            subjects: { type: 'array', items: { type: 'string' } }
          }
        },
        modalTerms: { type: 'array', items: { type: 'object' } },
        implicitModality: { type: 'array', items: { type: 'string' } },
        modalType: { type: 'string', enum: ['alethic', 'epistemic', 'deontic', 'temporal', 'dynamic'] },
        truthConditions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'proposition-analysis', 'logic']
}));

export const modalOperatorTask = defineTask('modal-operator', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Modal Operator Identification',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Modal Operator Analyst',
      task: 'Identify and analyze modal operators',
      context: {
        proposition: args.proposition,
        modalContext: args.modalContext
      },
      instructions: [
        '1. Identify alethic operators (necessary, possible)',
        '2. Identify epistemic operators (knows, believes, uncertain)',
        '3. Identify deontic operators (ought, permitted, forbidden)',
        '4. Identify temporal operators (always, sometimes, will)',
        '5. Identify dynamic operators (after action, before)',
        '6. Determine operator scope and nesting',
        '7. Identify operator interactions',
        '8. Determine accessibility relations for each operator type',
        '9. Identify which interpretation is most relevant',
        '10. Document operator framework'
      ],
      outputFormat: 'JSON object with modal operators'
    },
    outputSchema: {
      type: 'object',
      required: ['operators'],
      properties: {
        operators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operator: { type: 'string' },
              type: { type: 'string', enum: ['alethic', 'epistemic', 'deontic', 'temporal', 'dynamic'] },
              symbol: { type: 'string' },
              scope: { type: 'string' },
              accessibilityRelation: { type: 'string' }
            }
          }
        },
        operatorInteractions: { type: 'array', items: { type: 'object' } },
        primaryModality: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'operators', 'logic']
}));

export const possibleWorldsTask = defineTask('possible-worlds', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Possible Worlds Framework',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Possible Worlds Theorist',
      task: 'Construct possible worlds framework for modal analysis',
      context: {
        proposition: args.proposition,
        modalOperators: args.modalOperators,
        domain: args.domain,
        constraints: args.constraints
      },
      instructions: [
        '1. Define the actual world relevant to the proposition',
        '2. Construct alternative possible worlds',
        '3. Define accessibility relations between worlds',
        '4. Identify which worlds are nomologically possible',
        '5. Identify which worlds are logically possible',
        '6. Identify which worlds are epistemically possible',
        '7. Determine truth value of proposition in each world',
        '8. Identify closest possible worlds for counterfactuals',
        '9. Document world constraints and parameters',
        '10. Create world comparison framework'
      ],
      outputFormat: 'JSON object with possible worlds'
    },
    outputSchema: {
      type: 'object',
      required: ['worlds', 'accessibilityRelations'],
      properties: {
        worlds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['actual', 'nomologically-possible', 'logically-possible', 'epistemically-possible'] },
              propositionTruth: { type: 'boolean' },
              keyDifferences: { type: 'array', items: { type: 'string' } },
              distanceFromActual: { type: 'number' }
            }
          }
        },
        accessibilityRelations: { type: 'object' },
        worldParameters: { type: 'object' },
        actualWorld: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'possible-worlds', 'semantics']
}));

export const necessityAnalysisTask = defineTask('necessity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Necessity Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Necessity Analysis Expert',
      task: 'Analyze necessity of the proposition',
      context: {
        proposition: args.proposition,
        possibleWorlds: args.possibleWorlds,
        modalContext: args.modalContext
      },
      instructions: [
        '1. Determine if proposition is logically necessary',
        '2. Determine if proposition is nomologically necessary',
        '3. Determine if proposition is metaphysically necessary',
        '4. Identify types of necessity that apply',
        '5. Analyze conditions for necessity',
        '6. Identify what would make it contingent',
        '7. Distinguish de dicto from de re necessity',
        '8. Analyze necessity relative to different accessibility relations',
        '9. Assess confidence in necessity claims',
        '10. Document necessity findings'
      ],
      outputFormat: 'JSON object with necessity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['necessaryInAll'],
      properties: {
        necessaryInAll: { type: 'boolean' },
        necessityTypes: {
          type: 'object',
          properties: {
            logical: { type: 'boolean' },
            nomological: { type: 'boolean' },
            metaphysical: { type: 'boolean' },
            epistemic: { type: 'boolean' }
          }
        },
        conditionsForNecessity: { type: 'array', items: { type: 'string' } },
        contingencyConditions: { type: 'array', items: { type: 'string' } },
        deDictoVsDeRe: { type: 'object' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'necessity', 'analysis']
}));

export const possibilityAnalysisTask = defineTask('possibility-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Possibility Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Possibility Analysis Expert',
      task: 'Analyze possibility of the proposition',
      context: {
        proposition: args.proposition,
        possibleWorlds: args.possibleWorlds,
        necessityAnalysis: args.necessityAnalysis
      },
      instructions: [
        '1. Determine if proposition is logically possible',
        '2. Determine if proposition is nomologically possible',
        '3. Determine if proposition is epistemically possible',
        '4. Identify worlds where proposition is true',
        '5. Assess how possible (near vs remote possibility)',
        '6. Identify obstacles to possibility',
        '7. Distinguish genuine from merely apparent possibility',
        '8. Analyze conditional possibilities',
        '9. Assess possibility confidence',
        '10. Document possibility findings'
      ],
      outputFormat: 'JSON object with possibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['possibleInSome'],
      properties: {
        possibleInSome: { type: 'boolean' },
        possibilityTypes: {
          type: 'object',
          properties: {
            logical: { type: 'boolean' },
            nomological: { type: 'boolean' },
            epistemic: { type: 'boolean' },
            practical: { type: 'boolean' }
          }
        },
        worldsWhereTrue: { type: 'array', items: { type: 'string' } },
        possibilityDegree: { type: 'string', enum: ['near', 'moderate', 'remote'] },
        obstacles: { type: 'array', items: { type: 'string' } },
        conditionalPossibilities: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'possibility', 'analysis']
}));

export const epistemicModalTask = defineTask('epistemic-modal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Epistemic Modal Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Epistemic Logic Expert',
      task: 'Analyze epistemic modality of the proposition',
      context: {
        proposition: args.proposition,
        possibleWorlds: args.possibleWorlds,
        modalContext: args.modalContext,
        domain: args.domain
      },
      instructions: [
        '1. Determine what is known about the proposition',
        '2. Determine what is believed about the proposition',
        '3. Identify epistemic possibilities given current knowledge',
        '4. Analyze knowledge vs mere true belief',
        '5. Identify what evidence would establish knowledge',
        '6. Analyze common knowledge aspects',
        '7. Identify epistemic uncertainties',
        '8. Analyze changes in epistemic status with new information',
        '9. Assess reliability of epistemic sources',
        '10. Document epistemic modal status'
      ],
      outputFormat: 'JSON object with epistemic modal analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['epistemicStatus'],
      properties: {
        epistemicStatus: {
          type: 'object',
          properties: {
            known: { type: 'boolean' },
            believed: { type: 'boolean' },
            epistemicallyPossible: { type: 'boolean' },
            commonKnowledge: { type: 'boolean' }
          }
        },
        evidenceNeeded: { type: 'array', items: { type: 'string' } },
        uncertainties: { type: 'array', items: { type: 'string' } },
        informationUpdates: { type: 'array', items: { type: 'object' } },
        sourceReliability: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'epistemic-logic', 'knowledge']
}));

export const dynamicModalTask = defineTask('dynamic-modal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Dynamic Modal Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Dynamic Logic Expert',
      task: 'Analyze dynamic modality and state changes',
      context: {
        proposition: args.proposition,
        possibleWorlds: args.possibleWorlds,
        modalContext: args.modalContext
      },
      instructions: [
        '1. Identify actions that could make proposition true',
        '2. Identify actions that could make proposition false',
        '3. Analyze state transitions relevant to proposition',
        '4. Determine what must happen for proposition to become true',
        '5. Analyze ability modalities (can, cannot)',
        '6. Identify preconditions for relevant actions',
        '7. Analyze effects of potential interventions',
        '8. Determine if proposition is achievable',
        '9. Analyze path dependencies',
        '10. Document dynamic modal findings'
      ],
      outputFormat: 'JSON object with dynamic modal analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dynamicStatus'],
      properties: {
        dynamicStatus: {
          type: 'object',
          properties: {
            achievable: { type: 'boolean' },
            preventable: { type: 'boolean' },
            currentState: { type: 'string' }
          }
        },
        makeTrueActions: { type: 'array', items: { type: 'object' } },
        makeFalseActions: { type: 'array', items: { type: 'object' } },
        stateTransitions: { type: 'array', items: { type: 'object' } },
        preconditions: { type: 'array', items: { type: 'string' } },
        pathDependencies: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'dynamic-logic', 'actions']
}));

export const counterfactualModalTask = defineTask('counterfactual-modal', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Counterfactual Analysis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Counterfactual Reasoning Expert',
      task: 'Analyze counterfactuals related to the proposition',
      context: {
        proposition: args.proposition,
        possibleWorlds: args.possibleWorlds,
        necessityAnalysis: args.necessityAnalysis
      },
      instructions: [
        '1. Identify key counterfactual conditionals',
        '2. Find closest worlds where antecedent is true',
        '3. Evaluate consequent in closest worlds',
        '4. Assess counterfactual dependencies',
        '5. Distinguish backtracking from non-backtracking counterfactuals',
        '6. Analyze causation through counterfactuals',
        '7. Assess robustness of counterfactual claims',
        '8. Identify counterfactuals that test the proposition',
        '9. Analyze what proposition depends on',
        '10. Document counterfactual findings'
      ],
      outputFormat: 'JSON object with counterfactual analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['counterfactuals'],
      properties: {
        counterfactuals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              antecedent: { type: 'string' },
              consequent: { type: 'string' },
              evaluation: { type: 'boolean' },
              closestWorld: { type: 'string' },
              robustness: { type: 'string', enum: ['robust', 'moderate', 'fragile'] }
            }
          }
        },
        dependencies: { type: 'array', items: { type: 'object' } },
        causalAnalysis: { type: 'object' },
        testingCounterfactuals: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'counterfactuals', 'causation']
}));

export const modalInferenceTask = defineTask('modal-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Modal Inference Generation',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Modal Inference Generator',
      task: 'Generate inferences from modal analysis',
      context: {
        proposition: args.proposition,
        necessityAnalysis: args.necessityAnalysis,
        possibilityAnalysis: args.possibilityAnalysis,
        epistemicAnalysis: args.epistemicAnalysis,
        dynamicAnalysis: args.dynamicAnalysis,
        counterfactualAnalysis: args.counterfactualAnalysis
      },
      instructions: [
        '1. Draw inferences from necessity analysis',
        '2. Draw inferences from possibility analysis',
        '3. Combine modal analyses for deeper insights',
        '4. Identify implications for related propositions',
        '5. Generate predictions from modal analysis',
        '6. Identify what follows from modal status',
        '7. Identify what is ruled out by modal analysis',
        '8. Generate actionable inferences',
        '9. Assess confidence in each inference',
        '10. Document key modal inferences'
      ],
      outputFormat: 'JSON object with modal inferences'
    },
    outputSchema: {
      type: 'object',
      required: ['inferences'],
      properties: {
        inferences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inference: { type: 'string' },
              source: { type: 'string' },
              type: { type: 'string', enum: ['necessary-consequence', 'possible-implication', 'epistemic', 'practical'] },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              significance: { type: 'string', enum: ['critical', 'important', 'informative'] }
            }
          }
        },
        ruledOut: { type: 'array', items: { type: 'string' } },
        predictions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'inference', 'conclusions']
}));

export const modalSynthesisTask = defineTask('modal-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Modal Analysis Synthesis',
  skill: { name: 'formal-logic-reasoner' },
  agent: {
    name: 'modal-logic-analyst',
    skills: ['formal-logic-reasoner', 'hypothesis-generator'],
    prompt: {
      role: 'Modal Analysis Synthesist',
      task: 'Synthesize modal analysis into comprehensive conclusions',
      context: {
        proposition: args.proposition,
        possibleWorlds: args.possibleWorlds,
        necessityAnalysis: args.necessityAnalysis,
        possibilityAnalysis: args.possibilityAnalysis,
        epistemicAnalysis: args.epistemicAnalysis,
        dynamicAnalysis: args.dynamicAnalysis,
        counterfactualAnalysis: args.counterfactualAnalysis,
        modalInferences: args.modalInferences,
        domain: args.domain,
        modalContext: args.modalContext
      },
      instructions: [
        '1. Synthesize all modal analyses',
        '2. Determine overall modal status of proposition',
        '3. Summarize key findings',
        '4. Identify implications for domain',
        '5. Provide recommendations based on modal status',
        '6. Identify further questions raised',
        '7. Assess limitations of analysis',
        '8. Provide confidence-calibrated conclusions',
        '9. Suggest practical applications',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with modal synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['modalStatus', 'recommendations', 'markdown'],
      properties: {
        modalStatus: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            necessity: { type: 'string' },
            possibility: { type: 'string' },
            epistemic: { type: 'string' },
            dynamic: { type: 'string' }
          }
        },
        keyFindings: { type: 'array', items: { type: 'string' } },
        domainImplications: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              basis: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        furtherQuestions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['modal-reasoning', 'synthesis', 'conclusions']
}));
