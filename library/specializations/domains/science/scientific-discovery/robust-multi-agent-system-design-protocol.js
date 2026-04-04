/**
 * @process domains/science/scientific-discovery/robust-multi-agent-system-design-protocol
 * @description Robust Multi-Agent System Design Protocol: Abstract -> Constraint sculpt -> Inverted-goal -> Adversarial co-design
 * @inputs {
 *   systemRequirements: string,
 *   agentTypes: array,
 *   domain: string
 * }
 * @outputs {
 *   success: boolean,
 *   robustDesign: object,
 *   adversarialValidation: object,
 *   insights: array
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemRequirements,
    agentTypes = [],
    domain = 'general science',
    robustnessTarget = 85
  } = inputs;

  const startTime = ctx.now();
  const designHistory = [];

  // STAGE 1: ABSTRACT - Abstract system requirements to essential structure
  ctx.log('info', 'Stage 1: Abstracting system requirements');
  const abstraction = await ctx.task(abstractRequirementsTask, {
    systemRequirements,
    agentTypes,
    domain
  });

  designHistory.push({
    stage: 'abstraction',
    result: abstraction,
    timestamp: ctx.now()
  });

  // STAGE 2: CONSTRAINT SCULPT - Start with ideal constraints and relax
  ctx.log('info', 'Stage 2: Constraint sculpting');
  const idealDesign = await ctx.task(defineIdealDesignTask, {
    abstraction,
    agentTypes,
    domain
  });

  const sculptedDesign = await ctx.task(sculptDesignConstraintsTask, {
    idealDesign,
    abstraction,
    domain
  });

  designHistory.push({
    stage: 'constraint-sculpting',
    idealDesign,
    sculptedDesign,
    timestamp: ctx.now()
  });

  await ctx.breakpoint({
    question: 'Abstraction and constraint sculpting complete. Review before inverted goal analysis?',
    title: 'Robust MAS Design - Stage 2 Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/abstraction.json', format: 'json' },
        { path: 'artifacts/sculpted-design.json', format: 'json' }
      ]
    }
  });

  // STAGE 3: INVERTED-GOAL - Analyze what makes the system fail
  ctx.log('info', 'Stage 3: Inverted goal analysis');
  const invertedGoalAnalysis = await ctx.task(analyzeInvertedGoalsTask, {
    sculptedDesign,
    systemRequirements,
    domain
  });

  const failureModeDesign = await ctx.task(designAgainstFailureModesTask, {
    sculptedDesign,
    invertedGoalAnalysis,
    domain
  });

  designHistory.push({
    stage: 'inverted-goal',
    invertedGoalAnalysis,
    failureModeDesign,
    timestamp: ctx.now()
  });

  // STAGE 4: ADVERSARIAL CO-DESIGN - Builder vs Breaker refinement
  ctx.log('info', 'Stage 4: Adversarial co-design');
  let currentDesign = failureModeDesign.improvedDesign;
  let robustnessScore = 0;
  const adversarialRounds = [];

  for (let round = 1; round <= 3; round++) {
    // Breaker attacks the design
    const attacks = await ctx.task(breakerAttackDesignTask, {
      design: currentDesign,
      round,
      previousAttacks: adversarialRounds,
      domain
    });

    // Builder defends and improves
    const defense = await ctx.task(builderDefendDesignTask, {
      design: currentDesign,
      attacks,
      round,
      domain
    });

    currentDesign = defense.improvedDesign;
    robustnessScore = defense.robustnessScore;

    adversarialRounds.push({
      round,
      attacks,
      defense,
      robustnessScore,
      timestamp: ctx.now()
    });

    if (robustnessScore >= robustnessTarget) {
      ctx.log('info', `Robustness target met at round ${round}`);
      break;
    }
  }

  designHistory.push({
    stage: 'adversarial-codesign',
    adversarialRounds,
    timestamp: ctx.now()
  });

  // STAGE 5: FINALIZE - Finalize robust design
  ctx.log('info', 'Stage 5: Finalizing robust design');
  const finalDesign = await ctx.task(finalizeRobustDesignTask, {
    currentDesign,
    designHistory,
    robustnessScore,
    domain
  });

  // STAGE 6: VALIDATE - Comprehensive validation
  ctx.log('info', 'Stage 6: Validating robust design');
  const validation = await ctx.task(validateRobustDesignTask, {
    finalDesign,
    systemRequirements,
    adversarialRounds,
    domain
  });

  // STAGE 7: SYNTHESIZE - Create comprehensive documentation
  ctx.log('info', 'Stage 7: Synthesizing design documentation');
  const synthesis = await ctx.task(synthesizeRobustDesignTask, {
    systemRequirements,
    abstraction,
    sculptedDesign,
    invertedGoalAnalysis,
    adversarialRounds,
    finalDesign,
    validation,
    domain
  });

  return {
    success: validation.isRobust && robustnessScore >= robustnessTarget,
    processId: 'domains/science/scientific-discovery/robust-multi-agent-system-design-protocol',
    systemRequirements,
    domain,
    abstraction,
    sculptedDesign,
    invertedGoalAnalysis,
    robustDesign: finalDesign,
    adversarialValidation: {
      rounds: adversarialRounds,
      finalRobustness: robustnessScore
    },
    validation,
    designHistory,
    insights: synthesis.insights,
    synthesis,
    metadata: {
      adversarialRounds: adversarialRounds.length,
      finalRobustness: robustnessScore,
      robustnessTarget,
      constraintsRelaxed: sculptedDesign.relaxedConstraints?.length || 0,
      attacksDefended: adversarialRounds.reduce((sum, r) => sum + (r.defense.attacksDefended?.length || 0), 0),
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const abstractRequirementsTask = defineTask('abstract-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Abstract System Requirements',
  agent: {
    name: 'requirements-abstractor',
    prompt: {
      role: 'systems architect',
      task: 'Abstract system requirements to essential structure',
      context: args,
      instructions: [
        'Identify core functional requirements',
        'Extract essential system properties',
        'Abstract away implementation details',
        'Identify agent roles and responsibilities',
        'Define interaction patterns',
        'Identify system invariants',
        'Create abstract system model'
      ],
      outputFormat: 'JSON with abstract model, roles, interactions, invariants'
    },
    outputSchema: {
      type: 'object',
      required: ['abstractModel', 'roles', 'interactions'],
      properties: {
        abstractModel: { type: 'object' },
        coreRequirements: { type: 'array', items: { type: 'string' } },
        roles: { type: 'array', items: { type: 'object' } },
        interactions: { type: 'array', items: { type: 'object' } },
        invariants: { type: 'array', items: { type: 'string' } },
        essentialProperties: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'abstraction']
}));

export const defineIdealDesignTask = defineTask('define-ideal-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Ideal Design',
  agent: {
    name: 'ideal-designer',
    prompt: {
      role: 'systems designer',
      task: 'Define the ideal over-constrained multi-agent system design',
      context: args,
      instructions: [
        'Design system with all desired constraints',
        'Include all safety properties',
        'Add all performance requirements',
        'Include all reliability constraints',
        'Design for maximum robustness',
        'Document all constraints',
        'Create ideal specification'
      ],
      outputFormat: 'JSON with ideal design, all constraints, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['idealDesign', 'constraints'],
      properties: {
        idealDesign: { type: 'object' },
        constraints: { type: 'array', items: { type: 'object' } },
        safetyProperties: { type: 'array', items: { type: 'string' } },
        performanceRequirements: { type: 'array', items: { type: 'object' } },
        reliabilityConstraints: { type: 'array', items: { type: 'string' } },
        specification: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'ideal-design']
}));

export const sculptDesignConstraintsTask = defineTask('sculpt-design-constraints', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sculpt Design Constraints',
  agent: {
    name: 'constraint-sculptor',
    prompt: {
      role: 'constraint engineer',
      task: 'Sculpt design constraints toward feasibility',
      context: args,
      instructions: [
        'Identify infeasible constraints',
        'Gradually relax constraints',
        'Maintain essential safety properties',
        'Find minimal feasible constraint set',
        'Document constraint relaxation rationale',
        'Track what is preserved vs sacrificed',
        'Create feasible design'
      ],
      outputFormat: 'JSON with sculpted design, relaxed constraints, preserved properties'
    },
    outputSchema: {
      type: 'object',
      required: ['sculptedDesign', 'relaxedConstraints'],
      properties: {
        sculptedDesign: { type: 'object' },
        relaxedConstraints: { type: 'array', items: { type: 'object' } },
        preservedConstraints: { type: 'array', items: { type: 'string' } },
        minimalConstraintSet: { type: 'array', items: { type: 'string' } },
        relaxationRationale: { type: 'array', items: { type: 'object' } },
        sacrificedProperties: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'constraint-sculpting']
}));

export const analyzeInvertedGoalsTask = defineTask('analyze-inverted-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Inverted Goals',
  agent: {
    name: 'inverted-goal-analyst',
    prompt: {
      role: 'adversarial analyst',
      task: 'Analyze how to make the system fail (inverted goals)',
      context: args,
      instructions: [
        'Define the opposite of system goals',
        'Identify ways to maximize system failure',
        'Find attack vectors and vulnerabilities',
        'Identify emergent failure modes',
        'Map the failure space',
        'Identify critical failure points',
        'Document anti-patterns'
      ],
      outputFormat: 'JSON with failure modes, attack vectors, anti-patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['invertedGoals', 'failureModes', 'attackVectors'],
      properties: {
        invertedGoals: { type: 'array', items: { type: 'string' } },
        failureModes: { type: 'array', items: { type: 'object' } },
        attackVectors: { type: 'array', items: { type: 'object' } },
        vulnerabilities: { type: 'array', items: { type: 'object' } },
        criticalPoints: { type: 'array', items: { type: 'string' } },
        antiPatterns: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'inverted-goal']
}));

export const designAgainstFailureModesTask = defineTask('design-against-failure-modes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Against Failure Modes',
  agent: {
    name: 'failure-mode-designer',
    prompt: {
      role: 'reliability engineer',
      task: 'Improve design to defend against identified failure modes',
      context: args,
      instructions: [
        'Address each identified failure mode',
        'Add redundancy where needed',
        'Implement fail-safes',
        'Add monitoring and detection',
        'Design recovery mechanisms',
        'Improve fault tolerance',
        'Document defensive measures'
      ],
      outputFormat: 'JSON with improved design, defensive measures, remaining risks'
    },
    outputSchema: {
      type: 'object',
      required: ['improvedDesign', 'defensiveMeasures'],
      properties: {
        improvedDesign: { type: 'object' },
        defensiveMeasures: { type: 'array', items: { type: 'object' } },
        redundancyAdded: { type: 'array', items: { type: 'string' } },
        failSafes: { type: 'array', items: { type: 'object' } },
        monitoringMechanisms: { type: 'array', items: { type: 'object' } },
        recoveryMechanisms: { type: 'array', items: { type: 'object' } },
        remainingRisks: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'failure-mode-defense']
}));

export const breakerAttackDesignTask = defineTask('breaker-attack-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Breaker: Attack Design (Round ${args.round})`,
  agent: {
    name: 'design-breaker',
    prompt: {
      role: 'adversarial tester (Breaker)',
      task: 'Find ways to break the multi-agent system design',
      context: args,
      instructions: [
        'Generate attack scenarios',
        'Find edge cases that break the design',
        'Identify emergent vulnerabilities',
        'Test Byzantine failure scenarios',
        'Challenge safety assumptions',
        'Find coordination failures',
        'Document all successful attacks'
      ],
      outputFormat: 'JSON with attacks, successful exploits, severity'
    },
    outputSchema: {
      type: 'object',
      required: ['attacks'],
      properties: {
        attacks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              exploitedWeakness: { type: 'string' }
            }
          }
        },
        successfulExploits: { type: 'array', items: { type: 'object' } },
        byzantineScenarios: { type: 'array', items: { type: 'object' } },
        coordinationFailures: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'breaker']
}));

export const builderDefendDesignTask = defineTask('builder-defend-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Builder: Defend Design (Round ${args.round})`,
  agent: {
    name: 'design-builder',
    prompt: {
      role: 'systems designer (Builder)',
      task: 'Defend and improve the design against attacks',
      context: args,
      instructions: [
        'Analyze each attack',
        'Develop defenses for valid attacks',
        'Dismiss attacks that are out of scope',
        'Improve design to resist attacks',
        'Add safeguards where needed',
        'Assess new robustness level',
        'Document all improvements'
      ],
      outputFormat: 'JSON with improved design, defenses, robustness score'
    },
    outputSchema: {
      type: 'object',
      required: ['improvedDesign', 'robustnessScore'],
      properties: {
        improvedDesign: { type: 'object' },
        attacksDefended: { type: 'array', items: { type: 'object' } },
        attacksDismissed: { type: 'array', items: { type: 'object' } },
        defensesAdded: { type: 'array', items: { type: 'object' } },
        safeguards: { type: 'array', items: { type: 'object' } },
        robustnessScore: { type: 'number', minimum: 0, maximum: 100 },
        improvements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'builder']
}));

export const finalizeRobustDesignTask = defineTask('finalize-robust-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize Robust Design',
  agent: {
    name: 'design-finalizer',
    prompt: {
      role: 'senior systems architect',
      task: 'Finalize the robust multi-agent system design',
      context: args,
      instructions: [
        'Consolidate all design improvements',
        'Create final design specification',
        'Document all safety measures',
        'Create deployment guidelines',
        'Document monitoring requirements',
        'Create operational procedures',
        'Produce final design document'
      ],
      outputFormat: 'JSON with final design, specifications, guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['finalDesign', 'specification'],
      properties: {
        finalDesign: { type: 'object' },
        specification: { type: 'object' },
        safetyMeasures: { type: 'array', items: { type: 'object' } },
        deploymentGuidelines: { type: 'array', items: { type: 'string' } },
        monitoringRequirements: { type: 'array', items: { type: 'object' } },
        operationalProcedures: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'finalization']
}));

export const validateRobustDesignTask = defineTask('validate-robust-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Robust Design',
  agent: {
    name: 'design-validator',
    prompt: {
      role: 'validation engineer',
      task: 'Comprehensively validate the robust design',
      context: args,
      instructions: [
        'Verify all requirements are met',
        'Check safety properties',
        'Validate against adversarial scenarios',
        'Verify fault tolerance',
        'Check scalability properties',
        'Assess overall robustness',
        'Document validation results'
      ],
      outputFormat: 'JSON with validation results, robustness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['isRobust', 'validationResults'],
      properties: {
        isRobust: { type: 'boolean' },
        validationResults: { type: 'array', items: { type: 'object' } },
        requirementsCovered: { type: 'array', items: { type: 'string' } },
        safetyVerification: { type: 'object' },
        faultToleranceVerification: { type: 'object' },
        scalabilityAssessment: { type: 'object' },
        overallRobustness: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'validation']
}));

export const synthesizeRobustDesignTask = defineTask('synthesize-robust-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Robust Design Documentation',
  agent: {
    name: 'design-synthesizer',
    prompt: {
      role: 'technical writer and architect',
      task: 'Synthesize comprehensive documentation of the robust design',
      context: args,
      instructions: [
        'Summarize the design journey',
        'Document key design decisions',
        'Highlight robustness measures',
        'Document lessons learned',
        'Provide implementation guidance',
        'Note remaining risks and mitigations',
        'Create comprehensive synthesis'
      ],
      outputFormat: 'JSON with synthesis, insights, guidance'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesis', 'insights'],
      properties: {
        synthesis: { type: 'string' },
        designJourney: { type: 'object' },
        keyDecisions: { type: 'array', items: { type: 'object' } },
        robustnessMeasures: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        implementationGuidance: { type: 'array', items: { type: 'string' } },
        remainingRisks: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'robust-mas-design', 'synthesis']
}));
