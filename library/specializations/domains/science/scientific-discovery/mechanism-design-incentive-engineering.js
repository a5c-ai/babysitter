/**
 * @process specializations/domains/science/scientific-discovery/mechanism-design-incentive-engineering
 * @description Mechanism Design and Incentive Engineering - Design rules, institutions, and incentive
 * structures so that self-interested behavior by rational agents achieves desired collective outcomes
 * in scientific research, collaboration, peer review, and resource allocation contexts.
 * @inputs { objectives: string[], agents: object[], constraints?: object, context?: string, existingMechanisms?: object[] }
 * @outputs { success: boolean, mechanisms: object[], incentiveStructures: object[], analysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/mechanism-design-incentive-engineering', {
 *   objectives: ['Accurate peer review', 'Timely reviews', 'Constructive feedback'],
 *   agents: [{ type: 'reviewer', incentives: ['reputation', 'reciprocity'] }, { type: 'author', incentives: ['publication', 'quality feedback'] }],
 *   constraints: { budget: 'limited', voluntaryParticipation: true },
 *   context: 'Peer review incentive system design'
 * });
 *
 * @references
 * - Mechanism Design Theory: https://www.nobelprize.org/prizes/economic-sciences/2007/summary/
 * - Incentive-Compatible Mechanisms: https://plato.stanford.edu/entries/game-theory/#MechDesi
 * - Auction Theory: https://www.nobelprize.org/prizes/economic-sciences/2020/summary/
 * - Implementation Theory: https://www.sciencedirect.com/topics/economics-econometrics-and-finance/implementation-theory
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    objectives,
    agents,
    constraints = {},
    context = '',
    existingMechanisms = []
  } = inputs;

  // Phase 1: Objective Formalization
  const objectiveFormalization = await ctx.task(objectiveFormalizationTask, {
    objectives,
    agents,
    context
  });

  // Quality Gate: Objectives must be formalizable
  if (!objectiveFormalization.formalizedObjectives || objectiveFormalization.formalizedObjectives.length === 0) {
    return {
      success: false,
      error: 'Could not formalize objectives for mechanism design',
      phase: 'objective-formalization',
      mechanisms: null
    };
  }

  // Phase 2: Agent Type Analysis
  const agentAnalysis = await ctx.task(agentTypeAnalysisTask, {
    agents,
    objectives: objectiveFormalization.formalizedObjectives,
    constraints,
    context
  });

  // Phase 3: Private Information Structure
  const informationStructure = await ctx.task(privateInformationAnalysisTask, {
    agents: agentAnalysis.agentTypes,
    objectives: objectiveFormalization.formalizedObjectives,
    context
  });

  // Phase 4: Social Choice Function Design
  const socialChoiceFunction = await ctx.task(socialChoiceFunctionTask, {
    objectives: objectiveFormalization.formalizedObjectives,
    agentTypes: agentAnalysis.agentTypes,
    informationStructure,
    constraints
  });

  // Breakpoint: Review mechanism design parameters
  await ctx.breakpoint({
    question: `Review mechanism design for "${context}". Social choice function defined for ${agentAnalysis.agentTypes.length} agent types. Proceed?`,
    title: 'Mechanism Design Parameters Review',
    context: {
      runId: ctx.runId,
      context,
      objectives: objectiveFormalization.formalizedObjectives,
      agentTypes: agentAnalysis.agentTypes.map(a => a.type),
      files: [{
        path: 'artifacts/mechanism-parameters.json',
        format: 'json',
        content: { objectiveFormalization, agentAnalysis, informationStructure, socialChoiceFunction }
      }]
    }
  });

  // Phase 5: Incentive Compatibility Analysis
  const incentiveCompatibility = await ctx.task(incentiveCompatibilityTask, {
    socialChoiceFunction,
    agentTypes: agentAnalysis.agentTypes,
    informationStructure,
    constraints
  });

  // Phase 6: Mechanism Synthesis
  const mechanismSynthesis = await ctx.task(mechanismSynthesisTask, {
    socialChoiceFunction,
    incentiveCompatibility,
    agentTypes: agentAnalysis.agentTypes,
    constraints,
    existingMechanisms
  });

  // Phase 7: Transfer and Payment Design
  const transferDesign = await ctx.task(transferDesignTask, {
    mechanisms: mechanismSynthesis.mechanisms,
    agentTypes: agentAnalysis.agentTypes,
    constraints,
    context
  });

  // Phase 8: Implementation and Verification
  const implementationAnalysis = await ctx.task(implementationVerificationTask, {
    mechanisms: mechanismSynthesis.mechanisms,
    transferDesign,
    socialChoiceFunction,
    constraints
  });

  // Phase 9: Robustness and Edge Case Analysis
  const robustnessAnalysis = await ctx.task(robustnessAnalysisTask, {
    mechanisms: mechanismSynthesis.mechanisms,
    agentTypes: agentAnalysis.agentTypes,
    implementationAnalysis,
    constraints
  });

  // Phase 10: Final Mechanism Recommendation
  const finalRecommendation = await ctx.task(mechanismRecommendationTask, {
    objectives: objectiveFormalization.formalizedObjectives,
    mechanisms: mechanismSynthesis.mechanisms,
    transferDesign,
    implementationAnalysis,
    robustnessAnalysis,
    constraints,
    context
  });

  // Final Breakpoint: Mechanism Design Approval
  await ctx.breakpoint({
    question: `Mechanism design complete for "${context}". ${mechanismSynthesis.mechanisms.length} mechanisms designed. Review and approve?`,
    title: 'Mechanism Design Approval',
    context: {
      runId: ctx.runId,
      context,
      mechanismCount: mechanismSynthesis.mechanisms.length,
      recommendedMechanism: finalRecommendation.recommended,
      files: [
        { path: 'artifacts/mechanism-design-report.json', format: 'json', content: finalRecommendation },
        { path: 'artifacts/mechanism-design-report.md', format: 'markdown', content: finalRecommendation.markdown }
      ]
    }
  });

  return {
    success: true,
    context,
    mechanisms: mechanismSynthesis.mechanisms,
    incentiveStructures: transferDesign.incentiveStructures,
    analysis: {
      objectives: objectiveFormalization.formalizedObjectives,
      agentTypes: agentAnalysis.agentTypes,
      informationStructure: informationStructure,
      socialChoiceFunction: socialChoiceFunction,
      incentiveCompatibility: incentiveCompatibility,
      implementation: implementationAnalysis,
      robustness: robustnessAnalysis
    },
    recommendations: finalRecommendation.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/mechanism-design-incentive-engineering',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const objectiveFormalizationTask = defineTask('objective-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Objective Formalization',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Mechanism Design Theorist specializing in social choice',
      task: 'Formalize objectives as implementable social choice functions',
      context: {
        objectives: args.objectives,
        agents: args.agents,
        context: args.context
      },
      instructions: [
        '1. Translate each objective into precise, measurable criteria',
        '2. Identify the outcome space (what allocations/decisions are possible)',
        '3. Define the type space (possible private information of agents)',
        '4. Specify desirable properties (efficiency, fairness, strategy-proofness)',
        '5. Identify constraints on mechanisms (budget balance, individual rationality)',
        '6. Determine if objectives are compatible or conflicting',
        '7. Prioritize objectives when tradeoffs are necessary',
        '8. Identify welfare criteria (utilitarian, egalitarian, maximin)',
        '9. Formalize participation constraints',
        '10. Document impossibility results that may apply'
      ],
      outputFormat: 'JSON object with formalized objectives'
    },
    outputSchema: {
      type: 'object',
      required: ['formalizedObjectives', 'outcomeSpace'],
      properties: {
        formalizedObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              objective: { type: 'string' },
              formalDefinition: { type: 'string' },
              measurability: { type: 'string', enum: ['quantitative', 'ordinal', 'qualitative'] },
              priority: { type: 'number' }
            }
          }
        },
        outcomeSpace: { type: 'object' },
        desirableProperties: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        tradeoffs: { type: 'array', items: { type: 'object' } },
        impossibilityResults: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'objective-formalization', 'social-choice']
}));

export const agentTypeAnalysisTask = defineTask('agent-type-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Agent Type Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Behavioral Mechanism Design Expert',
      task: 'Analyze agent types, preferences, and strategic behavior',
      context: {
        agents: args.agents,
        objectives: args.objectives,
        constraints: args.constraints,
        context: args.context
      },
      instructions: [
        '1. Identify distinct agent types and their characteristics',
        '2. Model preferences and utility functions for each type',
        '3. Identify private information held by each agent type',
        '4. Analyze strategic capabilities and sophistication',
        '5. Identify outside options and participation constraints',
        '6. Model risk attitudes and time preferences',
        '7. Identify potential for collusion between agents',
        '8. Analyze information revelation incentives',
        '9. Identify behavioral biases that may affect responses',
        '10. Map strategic interactions between agent types'
      ],
      outputFormat: 'JSON object with agent type analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['agentTypes'],
      properties: {
        agentTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } },
              preferences: { type: 'object' },
              privateInformation: { type: 'array', items: { type: 'string' } },
              strategicSophistication: { type: 'string', enum: ['high', 'medium', 'low'] },
              outsideOptions: { type: 'array', items: { type: 'string' } },
              riskAttitude: { type: 'string', enum: ['risk-averse', 'risk-neutral', 'risk-seeking'] }
            }
          }
        },
        collusionPotential: { type: 'object' },
        behavioralBiases: { type: 'array', items: { type: 'object' } },
        strategicInteractions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'agent-analysis', 'type-theory']
}));

export const privateInformationAnalysisTask = defineTask('private-information-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Private Information Structure Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Information Economics Expert',
      task: 'Analyze private information structure and revelation constraints',
      context: {
        agents: args.agents,
        objectives: args.objectives,
        context: args.context
      },
      instructions: [
        '1. Identify what private information each agent possesses',
        '2. Determine verifiability of private information',
        '3. Analyze costs and benefits of information revelation',
        '4. Identify signaling opportunities and constraints',
        '5. Analyze screening possibilities',
        '6. Determine information correlation between agents',
        '7. Identify moral hazard vs adverse selection components',
        '8. Analyze information dynamics over time',
        '9. Identify commitment problems related to information',
        '10. Map information asymmetries and their implications'
      ],
      outputFormat: 'JSON object with private information analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['informationStructure'],
      properties: {
        informationStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              agentType: { type: 'string' },
              privateInfo: { type: 'array', items: { type: 'string' } },
              verifiability: { type: 'string', enum: ['verifiable', 'partially-verifiable', 'unverifiable'] },
              revelationIncentives: { type: 'string' }
            }
          }
        },
        adverseSelection: { type: 'object' },
        moralHazard: { type: 'object' },
        informationCorrelation: { type: 'object' },
        signalingOptions: { type: 'array', items: { type: 'object' } },
        screeningOptions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'information-economics', 'asymmetric-information']
}));

export const socialChoiceFunctionTask = defineTask('social-choice-function', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Social Choice Function Design',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Social Choice Theorist',
      task: 'Design social choice function mapping reported types to outcomes',
      context: {
        objectives: args.objectives,
        agentTypes: args.agentTypes,
        informationStructure: args.informationStructure,
        constraints: args.constraints
      },
      instructions: [
        '1. Define the social choice function formally',
        '2. Verify the function achieves stated objectives',
        '3. Check for efficiency (Pareto optimality)',
        '4. Analyze fairness properties',
        '5. Verify individual rationality constraints',
        '6. Check budget balance constraints',
        '7. Analyze implementability in dominant strategies',
        '8. Check Bayesian implementability if needed',
        '9. Identify special cases and boundary conditions',
        '10. Document tradeoffs in social choice function design'
      ],
      outputFormat: 'JSON object with social choice function specification'
    },
    outputSchema: {
      type: 'object',
      required: ['scf', 'properties'],
      properties: {
        scf: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            codomain: { type: 'string' },
            mapping: { type: 'string' },
            formalDefinition: { type: 'string' }
          }
        },
        properties: {
          type: 'object',
          properties: {
            efficient: { type: 'boolean' },
            fair: { type: 'boolean' },
            individuallyRational: { type: 'boolean' },
            budgetBalanced: { type: 'boolean' },
            strategyProof: { type: 'boolean' }
          }
        },
        tradeoffs: { type: 'array', items: { type: 'object' } },
        specialCases: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'social-choice', 'function-design']
}));

export const incentiveCompatibilityTask = defineTask('incentive-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Incentive Compatibility Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Incentive Compatibility Expert',
      task: 'Analyze and ensure incentive compatibility of mechanisms',
      context: {
        socialChoiceFunction: args.socialChoiceFunction,
        agentTypes: args.agentTypes,
        informationStructure: args.informationStructure,
        constraints: args.constraints
      },
      instructions: [
        '1. Check dominant strategy incentive compatibility (DSIC)',
        '2. Analyze Bayesian incentive compatibility (BIC)',
        '3. Identify potential manipulation strategies',
        '4. Verify revelation principle applicability',
        '5. Analyze coalition incentive compatibility',
        '6. Check ex-post incentive compatibility',
        '7. Identify necessary transfers for incentive compatibility',
        '8. Analyze robustness to bounded rationality',
        '9. Identify incentive compatibility constraints that bind',
        '10. Document limitations and second-best solutions'
      ],
      outputFormat: 'JSON object with incentive compatibility analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            dsic: { type: 'boolean' },
            bic: { type: 'boolean' },
            coalitionProof: { type: 'boolean' },
            exPostIC: { type: 'boolean' }
          }
        },
        manipulationStrategies: { type: 'array', items: { type: 'object' } },
        requiredTransfers: { type: 'object' },
        bindingConstraints: { type: 'array', items: { type: 'string' } },
        secondBestSolutions: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'incentive-compatibility', 'game-theory']
}));

export const mechanismSynthesisTask = defineTask('mechanism-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Mechanism Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Mechanism Design Synthesist',
      task: 'Synthesize complete mechanisms implementing social choice function',
      context: {
        socialChoiceFunction: args.socialChoiceFunction,
        incentiveCompatibility: args.incentiveCompatibility,
        agentTypes: args.agentTypes,
        constraints: args.constraints,
        existingMechanisms: args.existingMechanisms
      },
      instructions: [
        '1. Design message/action space for each agent',
        '2. Define outcome function mapping messages to outcomes',
        '3. Specify timing and sequencing of mechanism',
        '4. Design information revelation rules',
        '5. Incorporate transfer/payment rules',
        '6. Build in verification and monitoring',
        '7. Design appeal/dispute mechanisms',
        '8. Consider multiple mechanism alternatives',
        '9. Compare with existing mechanisms if applicable',
        '10. Document mechanism specification completely'
      ],
      outputFormat: 'JSON object with synthesized mechanisms'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanisms'],
      properties: {
        mechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              messageSpace: { type: 'object' },
              outcomeFunction: { type: 'string' },
              timing: { type: 'object' },
              transferRules: { type: 'object' },
              verificationRules: { type: 'object' },
              properties: { type: 'object' }
            }
          }
        },
        comparisonWithExisting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'synthesis', 'implementation']
}));

export const transferDesignTask = defineTask('transfer-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Transfer and Payment Design',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Transfer Payment Design Expert',
      task: 'Design transfer payments and incentive structures',
      context: {
        mechanisms: args.mechanisms,
        agentTypes: args.agentTypes,
        constraints: args.constraints,
        context: args.context
      },
      instructions: [
        '1. Design monetary transfers if applicable',
        '2. Design non-monetary incentives (reputation, priority)',
        '3. Ensure budget balance or identify subsidies needed',
        '4. Calculate expected transfers for each agent type',
        '5. Design payment timing and conditionality',
        '6. Incorporate risk-sharing through transfers',
        '7. Design penalties for non-compliance',
        '8. Ensure transfers achieve incentive compatibility',
        '9. Minimize deadweight loss from transfers',
        '10. Document complete incentive structure'
      ],
      outputFormat: 'JSON object with transfer and incentive design'
    },
    outputSchema: {
      type: 'object',
      required: ['incentiveStructures'],
      properties: {
        incentiveStructures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanismId: { type: 'string' },
              monetaryTransfers: { type: 'object' },
              nonMonetaryIncentives: { type: 'array', items: { type: 'object' } },
              penalties: { type: 'array', items: { type: 'object' } },
              budgetImpact: { type: 'object' },
              expectedTransfers: { type: 'object' }
            }
          }
        },
        budgetBalance: { type: 'object' },
        deadweightLoss: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'transfers', 'incentives']
}));

export const implementationVerificationTask = defineTask('implementation-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Implementation and Verification',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Implementation Theory Expert',
      task: 'Verify mechanism implementation and practical requirements',
      context: {
        mechanisms: args.mechanisms,
        transferDesign: args.transferDesign,
        socialChoiceFunction: args.socialChoiceFunction,
        constraints: args.constraints
      },
      instructions: [
        '1. Verify mechanism implements social choice function',
        '2. Check Nash implementation requirements',
        '3. Verify subgame perfect implementation if dynamic',
        '4. Analyze computational complexity of mechanism',
        '5. Identify practical implementation requirements',
        '6. Design monitoring and enforcement procedures',
        '7. Analyze information requirements for operation',
        '8. Identify potential implementation failures',
        '9. Design graceful degradation under failures',
        '10. Create implementation checklist'
      ],
      outputFormat: 'JSON object with implementation verification'
    },
    outputSchema: {
      type: 'object',
      required: ['verification'],
      properties: {
        verification: {
          type: 'object',
          properties: {
            implements: { type: 'boolean' },
            nashImplementation: { type: 'boolean' },
            subgamePerfect: { type: 'boolean' },
            computationalComplexity: { type: 'string' }
          }
        },
        practicalRequirements: { type: 'array', items: { type: 'string' } },
        monitoringProcedures: { type: 'array', items: { type: 'object' } },
        potentialFailures: { type: 'array', items: { type: 'object' } },
        implementationChecklist: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'implementation', 'verification']
}));

export const robustnessAnalysisTask = defineTask('robustness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Robustness and Edge Case Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Robust Mechanism Design Expert',
      task: 'Analyze mechanism robustness to various perturbations',
      context: {
        mechanisms: args.mechanisms,
        agentTypes: args.agentTypes,
        implementationAnalysis: args.implementationAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Test robustness to agent type misspecification',
        '2. Analyze behavior under belief perturbations',
        '3. Test robustness to collusion attempts',
        '4. Analyze edge cases and boundary behavior',
        '5. Test with boundedly rational agents',
        '6. Analyze sensitivity to parameter choices',
        '7. Test robustness to timing variations',
        '8. Identify mechanisms\' worst-case performance',
        '9. Analyze robustness to external shocks',
        '10. Recommend robust mechanism selection'
      ],
      outputFormat: 'JSON object with robustness analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['robustnessResults'],
      properties: {
        robustnessResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanismId: { type: 'string' },
              typeRobustness: { type: 'string', enum: ['robust', 'moderate', 'fragile'] },
              beliefRobustness: { type: 'string', enum: ['robust', 'moderate', 'fragile'] },
              collusionResistance: { type: 'string', enum: ['resistant', 'partially-resistant', 'vulnerable'] },
              boundedRationalityPerformance: { type: 'string' },
              worstCasePerformance: { type: 'object' }
            }
          }
        },
        edgeCases: { type: 'array', items: { type: 'object' } },
        sensitivityAnalysis: { type: 'object' },
        recommendedMechanism: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'robustness', 'analysis']
}));

export const mechanismRecommendationTask = defineTask('mechanism-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Final Mechanism Recommendation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'mechanism-designer',
    skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Mechanism Design Advisor',
      task: 'Synthesize analysis and provide final mechanism recommendations',
      context: {
        objectives: args.objectives,
        mechanisms: args.mechanisms,
        transferDesign: args.transferDesign,
        implementationAnalysis: args.implementationAnalysis,
        robustnessAnalysis: args.robustnessAnalysis,
        constraints: args.constraints,
        context: args.context
      },
      instructions: [
        '1. Compare mechanisms across all criteria',
        '2. Select recommended mechanism with justification',
        '3. Provide implementation roadmap',
        '4. Identify key success factors',
        '5. Highlight risks and mitigation strategies',
        '6. Provide parameter recommendations',
        '7. Suggest monitoring and adjustment procedures',
        '8. Identify research or testing needs',
        '9. Provide contingency mechanisms',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with recommendations and report'
    },
    outputSchema: {
      type: 'object',
      required: ['recommended', 'recommendations', 'markdown'],
      properties: {
        recommended: {
          type: 'object',
          properties: {
            mechanismId: { type: 'string' },
            justification: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              implementation: { type: 'string' }
            }
          }
        },
        implementationRoadmap: { type: 'array', items: { type: 'object' } },
        keySuccessFactors: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'object' } },
        contingencyMechanisms: { type: 'array', items: { type: 'object' } },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanism-design', 'recommendations', 'synthesis']
}));
