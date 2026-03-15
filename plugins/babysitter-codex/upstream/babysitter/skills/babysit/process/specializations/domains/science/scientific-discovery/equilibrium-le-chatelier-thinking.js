/**
 * @process scientific-discovery/equilibrium-le-chatelier-thinking
 * @description Equilibrium and Le Chatelier Thinking process (Chemistry) - Analyze how systems at equilibrium respond to disturbances
 * @inputs { system: object, equilibriumState: object, proposedChange: object, outputDir: string }
 * @outputs { success: boolean, equilibriumAnalysis: object, responseToChange: object, newEquilibrium: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system = {},
    equilibriumState = {},
    proposedChange = {},
    outputDir = 'equilibrium-output',
    quantitativeAnalysis = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Equilibrium and Le Chatelier Thinking Process');

  // ============================================================================
  // PHASE 1: EQUILIBRIUM CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing the equilibrium system');
  const equilibriumCharacterization = await ctx.task(equilibriumCharacterizationTask, {
    system,
    equilibriumState,
    outputDir
  });

  artifacts.push(...equilibriumCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: EQUILIBRIUM CONSTANT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing equilibrium constant and thermodynamics');
  const equilibriumConstantAnalysis = await ctx.task(equilibriumConstantTask, {
    system,
    equilibriumState,
    outputDir
  });

  artifacts.push(...equilibriumConstantAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: CHANGE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying the nature of proposed change');
  const changeIdentification = await ctx.task(changeIdentificationTask, {
    proposedChange,
    system,
    equilibriumState,
    outputDir
  });

  artifacts.push(...changeIdentification.artifacts);

  // ============================================================================
  // PHASE 4: LE CHATELIER PREDICTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Applying Le Chatelier\'s principle');
  const leChaterlierPrediction = await ctx.task(leChaterlierTask, {
    change: changeIdentification.change,
    equilibriumState,
    system,
    outputDir
  });

  artifacts.push(...leChaterlierPrediction.artifacts);

  // Breakpoint: Review Le Chatelier prediction
  await ctx.breakpoint({
    question: `Le Chatelier prediction: equilibrium will shift ${leChaterlierPrediction.shiftDirection}. Proceed with quantitative analysis?`,
    title: 'Le Chatelier Prediction Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        changeType: changeIdentification.change.type,
        shiftDirection: leChaterlierPrediction.shiftDirection
      }
    }
  });

  // ============================================================================
  // PHASE 5: QUANTITATIVE SHIFT CALCULATION
  // ============================================================================

  let quantitativeShift = null;
  if (quantitativeAnalysis) {
    ctx.log('info', 'Phase 5: Calculating quantitative equilibrium shift');
    quantitativeShift = await ctx.task(quantitativeShiftTask, {
      equilibriumState,
      change: changeIdentification.change,
      K: equilibriumConstantAnalysis.K,
      shiftDirection: leChaterlierPrediction.shiftDirection,
      outputDir
    });
    artifacts.push(...quantitativeShift.artifacts);
  }

  // ============================================================================
  // PHASE 6: NEW EQUILIBRIUM STATE
  // ============================================================================

  ctx.log('info', 'Phase 6: Determining new equilibrium state');
  const newEquilibrium = await ctx.task(newEquilibriumTask, {
    originalEquilibrium: equilibriumState,
    change: changeIdentification.change,
    shift: quantitativeShift?.shift || leChaterlierPrediction.qualitativeShift,
    K: equilibriumConstantAnalysis.K,
    outputDir
  });

  artifacts.push(...newEquilibrium.artifacts);

  // ============================================================================
  // PHASE 7: BUFFER AND RESISTANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing buffering and resistance to change');
  const bufferAnalysis = await ctx.task(bufferAnalysisTask, {
    equilibriumState,
    newEquilibrium: newEquilibrium.state,
    change: changeIdentification.change,
    outputDir
  });

  artifacts.push(...bufferAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: PRACTICAL IMPLICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Deriving practical implications');
  const practicalImplications = await ctx.task(practicalImplicationsTask, {
    originalEquilibrium: equilibriumState,
    newEquilibrium: newEquilibrium.state,
    change: changeIdentification.change,
    shiftDirection: leChaterlierPrediction.shiftDirection,
    system,
    outputDir
  });

  artifacts.push(...practicalImplications.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Equilibrium analysis complete. New equilibrium position determined. ${practicalImplications.implications.length} practical implications identified. Review findings?`,
    title: 'Equilibrium Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        shiftDirection: leChaterlierPrediction.shiftDirection,
        percentShift: quantitativeShift?.percentShift,
        implicationCount: practicalImplications.implications.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    system,
    equilibriumAnalysis: {
      originalState: equilibriumState,
      K: equilibriumConstantAnalysis.K,
      thermodynamics: equilibriumConstantAnalysis.thermodynamics
    },
    change: changeIdentification.change,
    responseToChange: {
      shiftDirection: leChaterlierPrediction.shiftDirection,
      rationale: leChaterlierPrediction.rationale,
      quantitativeShift: quantitativeShift?.shift
    },
    newEquilibrium: newEquilibrium.state,
    bufferCapacity: bufferAnalysis.bufferCapacity,
    practicalImplications: practicalImplications.implications,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/equilibrium-le-chatelier-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Equilibrium Characterization
export const equilibriumCharacterizationTask = defineTask('equilibrium-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize the equilibrium system',
  agent: {
    name: 'equilibrium-chemist',
    prompt: {
      role: 'physical chemist characterizing equilibrium systems',
      task: 'Characterize the equilibrium system thoroughly',
      context: args,
      instructions: [
        'Write the balanced equilibrium equation',
        'Identify all species at equilibrium',
        'Note phases of all species (gas, liquid, solid, aqueous)',
        'Identify forward and reverse reactions',
        'Note if equilibrium is homogeneous or heterogeneous',
        'Identify dynamic nature of equilibrium',
        'Document current concentrations/pressures',
        'Identify any constraints (closed/open system)',
        'Note temperature and pressure conditions',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with equilibriumEquation, species, phases, homogeneousOrHeterogeneous, conditions, constraints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['equilibriumEquation', 'species', 'artifacts'],
      properties: {
        equilibriumEquation: { type: 'string' },
        species: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formula: { type: 'string' },
              phase: { type: 'string' },
              coefficient: { type: 'number' },
              side: { type: 'string' }
            }
          }
        },
        phases: { type: 'array', items: { type: 'string' } },
        homogeneousOrHeterogeneous: { type: 'string' },
        conditions: { type: 'object' },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'equilibrium', 'chemistry', 'characterization']
}));

// Task 2: Equilibrium Constant Analysis
export const equilibriumConstantTask = defineTask('equilibrium-constant', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze equilibrium constant and thermodynamics',
  agent: {
    name: 'thermodynamics-specialist',
    prompt: {
      role: 'chemical thermodynamicist',
      task: 'Analyze the equilibrium constant and thermodynamic properties',
      context: args,
      instructions: [
        'Write expression for equilibrium constant K',
        'Calculate K from current concentrations/pressures',
        'Note Kc vs Kp if gas phase',
        'Calculate reaction quotient Q for comparison',
        'Relate K to standard Gibbs energy: ΔG° = -RT ln K',
        'Determine temperature dependence via van\'t Hoff equation',
        'Assess whether equilibrium favors products or reactants',
        'Note orders of magnitude of K',
        'Save equilibrium constant analysis to output directory'
      ],
      outputFormat: 'JSON with K (value, expression, type), Q, thermodynamics (deltaG, deltaH, deltaS), temperatureDependence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['K', 'thermodynamics', 'artifacts'],
      properties: {
        K: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            expression: { type: 'string' },
            type: { type: 'string' },
            units: { type: 'string' }
          }
        },
        Q: { type: 'number' },
        thermodynamics: {
          type: 'object',
          properties: {
            deltaG: { type: 'number' },
            deltaH: { type: 'number' },
            deltaS: { type: 'number' },
            units: { type: 'string' }
          }
        },
        temperatureDependence: {
          type: 'object',
          properties: {
            vanHoffEquation: { type: 'string' },
            KvsT: { type: 'string' }
          }
        },
        favoredSide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'equilibrium', 'chemistry', 'thermodynamics']
}));

// Task 3: Change Identification
export const changeIdentificationTask = defineTask('change-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify the nature of proposed change',
  agent: {
    name: 'change-analyst',
    prompt: {
      role: 'chemist analyzing system perturbations',
      task: 'Identify and classify the proposed change to the equilibrium',
      context: args,
      instructions: [
        'Classify the type of change:',
        '  - Concentration change (adding/removing species)',
        '  - Pressure change (for gas systems)',
        '  - Volume change',
        '  - Temperature change',
        '  - Addition of catalyst',
        '  - Addition of inert gas',
        'Quantify the magnitude of change',
        'Determine which species are directly affected',
        'Note if change affects K or just Q',
        'Temperature changes K; other changes only shift position',
        'Save change identification to output directory'
      ],
      outputFormat: 'JSON with change (type, magnitude, affectedSpecies, affectsK), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['change', 'artifacts'],
      properties: {
        change: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            magnitude: { type: 'string' },
            direction: { type: 'string' },
            affectedSpecies: { type: 'array', items: { type: 'string' } },
            affectsK: { type: 'boolean' },
            affectsQ: { type: 'boolean' }
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
  labels: ['agent', 'scientific-discovery', 'equilibrium', 'chemistry', 'change-identification']
}));

// Task 4: Le Chatelier Prediction
export const leChaterlierTask = defineTask('le-chatelier', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Le Chatelier\'s principle',
  agent: {
    name: 'le-chatelier-analyst',
    prompt: {
      role: 'physical chemist applying Le Chatelier\'s principle',
      task: 'Predict how the equilibrium will respond to the change',
      context: args,
      instructions: [
        'Le Chatelier: system shifts to partially counteract the change',
        'For concentration increase: shift away from that species',
        'For concentration decrease: shift toward that species',
        'For pressure increase: shift toward fewer moles of gas',
        'For temperature increase: shift in endothermic direction',
        'For temperature decrease: shift in exothermic direction',
        'Catalyst: no shift, just faster attainment of equilibrium',
        'Inert gas at constant volume: no shift',
        'Explain the rationale for predicted shift',
        'Note limitations of qualitative prediction',
        'Save Le Chatelier prediction to output directory'
      ],
      outputFormat: 'JSON with shiftDirection, rationale, qualitativeShift, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['shiftDirection', 'rationale', 'artifacts'],
      properties: {
        shiftDirection: { type: 'string' },
        rationale: { type: 'string' },
        qualitativeShift: {
          type: 'object',
          properties: {
            productsIncrease: { type: 'boolean' },
            reactantsIncrease: { type: 'boolean' },
            estimatedMagnitude: { type: 'string' }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'equilibrium', 'chemistry', 'le-chatelier']
}));

// Task 5: Quantitative Shift Calculation
export const quantitativeShiftTask = defineTask('quantitative-shift', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate quantitative equilibrium shift',
  agent: {
    name: 'equilibrium-calculator',
    prompt: {
      role: 'computational chemist calculating equilibrium shifts',
      task: 'Calculate the quantitative shift in equilibrium position',
      context: args,
      instructions: [
        'Set up ICE table (Initial, Change, Equilibrium)',
        'Apply equilibrium constant expression',
        'Solve for extent of reaction at new equilibrium',
        'Calculate new concentrations/pressures',
        'Calculate percent shift from original position',
        'For temperature change, calculate new K first',
        'Verify Q = K at new equilibrium',
        'Note any approximations made',
        'Calculate change in Gibbs energy',
        'Save quantitative shift to output directory'
      ],
      outputFormat: 'JSON with shift (extent, percentShift), iceTable, newConcentrations, verification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['shift', 'artifacts'],
      properties: {
        shift: {
          type: 'object',
          properties: {
            extent: { type: 'number' },
            percentShift: { type: 'number' },
            direction: { type: 'string' }
          }
        },
        iceTable: { type: 'object' },
        newConcentrations: { type: 'object' },
        verification: {
          type: 'object',
          properties: {
            Qfinal: { type: 'number' },
            K: { type: 'number' },
            isEquilibrium: { type: 'boolean' }
          }
        },
        approximations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'equilibrium', 'chemistry', 'quantitative']
}));

// Task 6: New Equilibrium State
export const newEquilibriumTask = defineTask('new-equilibrium', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine new equilibrium state',
  agent: {
    name: 'new-equilibrium-specialist',
    prompt: {
      role: 'physical chemist determining new equilibrium',
      task: 'Determine the complete new equilibrium state after the change',
      context: args,
      instructions: [
        'Compile all new equilibrium concentrations/pressures',
        'Calculate new Q (should equal K if temperature unchanged)',
        'Compare new state to original state',
        'Document what increased and what decreased',
        'Note if K changed (for temperature changes)',
        'Calculate position ratio (products/reactants)',
        'Document overall direction of change',
        'Note any species at limiting values',
        'Save new equilibrium state to output directory'
      ],
      outputFormat: 'JSON with state (concentrations, K, Q, positionRatio), comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['state', 'artifacts'],
      properties: {
        state: {
          type: 'object',
          properties: {
            concentrations: { type: 'object' },
            partialPressures: { type: 'object' },
            K: { type: 'number' },
            Q: { type: 'number' },
            positionRatio: { type: 'number' }
          }
        },
        comparison: {
          type: 'object',
          properties: {
            increased: { type: 'array', items: { type: 'string' } },
            decreased: { type: 'array', items: { type: 'string' } },
            unchanged: { type: 'array', items: { type: 'string' } }
          }
        },
        limitingSpecies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'equilibrium', 'chemistry', 'new-state']
}));

// Task 7: Buffer and Resistance Analysis
export const bufferAnalysisTask = defineTask('buffer-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze buffering and resistance to change',
  agent: {
    name: 'buffer-analyst',
    prompt: {
      role: 'chemist analyzing system resilience',
      task: 'Analyze the system\'s resistance to the perturbation',
      context: args,
      instructions: [
        'Calculate buffer capacity of the system',
        'For acid-base: assess buffer ratio [A-]/[HA]',
        'Note how much the system resisted change',
        'Calculate damping factor',
        'Identify optimal buffering conditions',
        'Assess sensitivity to further perturbations',
        'Note buffer range limitations',
        'Compare actual change to theoretical maximum',
        'Document system resilience',
        'Save buffer analysis to output directory'
      ],
      outputFormat: 'JSON with bufferCapacity, dampingFactor, resilience, optimalConditions, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bufferCapacity', 'artifacts'],
      properties: {
        bufferCapacity: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            units: { type: 'string' },
            interpretation: { type: 'string' }
          }
        },
        dampingFactor: { type: 'number' },
        resilience: { type: 'string' },
        optimalConditions: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        sensitivityToFurtherChange: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'equilibrium', 'chemistry', 'buffer']
}));

// Task 8: Practical Implications
export const practicalImplicationsTask = defineTask('practical-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive practical implications',
  agent: {
    name: 'applications-specialist',
    prompt: {
      role: 'applied chemist deriving practical insights',
      task: 'Derive practical implications from the equilibrium analysis',
      context: args,
      instructions: [
        'How can this knowledge be used practically?',
        'Implications for yield optimization',
        'Implications for reaction conditions',
        'Industrial process optimization suggestions',
        'Safety considerations from equilibrium shift',
        'Economic implications of different conditions',
        'Environmental considerations',
        'Suggestions for driving reaction to completion',
        'Strategies to maintain desired equilibrium position',
        'Save practical implications to output directory'
      ],
      outputFormat: 'JSON with implications (array with category, implication, recommendation), optimizationStrategies, safetyConsiderations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'artifacts'],
      properties: {
        implications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              implication: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        optimizationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              expectedImprovement: { type: 'string' },
              tradeoffs: { type: 'string' }
            }
          }
        },
        safetyConsiderations: { type: 'array', items: { type: 'string' } },
        economicFactors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'equilibrium', 'chemistry', 'applications']
}));
