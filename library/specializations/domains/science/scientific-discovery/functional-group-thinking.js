/**
 * @process scientific-discovery/functional-group-thinking
 * @description Functional Group Thinking process (Chemistry) - Reason in terms of reactive motifs and functional groups to predict chemical behavior
 * @inputs { molecule: object, reactionContext: object, targetTransformation: string, outputDir: string }
 * @outputs { success: boolean, functionalGroups: array, reactivities: array, predictedBehavior: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    molecule = {},
    reactionContext = {},
    targetTransformation = '',
    outputDir = 'functional-group-output',
    considerStereochemistry = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Functional Group Thinking Process');

  // ============================================================================
  // PHASE 1: FUNCTIONAL GROUP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying functional groups in the molecule');
  const groupIdentification = await ctx.task(groupIdentificationTask, {
    molecule,
    outputDir
  });

  artifacts.push(...groupIdentification.artifacts);

  // ============================================================================
  // PHASE 2: ELECTRONIC CHARACTER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing electronic character of functional groups');
  const electronicAnalysis = await ctx.task(electronicCharacterTask, {
    functionalGroups: groupIdentification.functionalGroups,
    molecule,
    outputDir
  });

  artifacts.push(...electronicAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: REACTIVITY PREDICTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Predicting reactivity patterns');
  const reactivityPrediction = await ctx.task(reactivityPredictionTask, {
    functionalGroups: groupIdentification.functionalGroups,
    electronicCharacter: electronicAnalysis.electronicCharacter,
    reactionContext,
    outputDir
  });

  artifacts.push(...reactivityPrediction.artifacts);

  // Breakpoint: Review functional groups and reactivity
  await ctx.breakpoint({
    question: `Identified ${groupIdentification.functionalGroups.length} functional groups. ${reactivityPrediction.reactivitySites.length} reactive sites characterized. Review before transformation analysis?`,
    title: 'Functional Group Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        functionalGroupCount: groupIdentification.functionalGroups.length,
        reactiveSiteCount: reactivityPrediction.reactivitySites.length
      }
    }
  });

  // ============================================================================
  // PHASE 4: GROUP INTERACTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing interactions between functional groups');
  const groupInteractionAnalysis = await ctx.task(groupInteractionTask, {
    functionalGroups: groupIdentification.functionalGroups,
    molecule,
    outputDir
  });

  artifacts.push(...groupInteractionAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: TRANSFORMATION PATHWAY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing possible transformation pathways');
  const transformationAnalysis = await ctx.task(transformationPathwayTask, {
    functionalGroups: groupIdentification.functionalGroups,
    reactivitySites: reactivityPrediction.reactivitySites,
    targetTransformation,
    reactionContext,
    outputDir
  });

  artifacts.push(...transformationAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: SELECTIVITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing chemo-, regio-, and stereoselectivity');
  const selectivityAnalysis = await ctx.task(selectivityAnalysisTask, {
    functionalGroups: groupIdentification.functionalGroups,
    reactivitySites: reactivityPrediction.reactivitySites,
    transformationPathways: transformationAnalysis.pathways,
    considerStereochemistry,
    outputDir
  });

  artifacts.push(...selectivityAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: PROTECTION/DEPROTECTION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating protection strategies if needed');
  const protectionStrategy = await ctx.task(protectionStrategyTask, {
    functionalGroups: groupIdentification.functionalGroups,
    selectivityIssues: selectivityAnalysis.selectivityIssues,
    targetTransformation,
    outputDir
  });

  artifacts.push(...protectionStrategy.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Functional group analysis complete. ${transformationAnalysis.pathways.length} pathways identified. Primary selectivity: ${selectivityAnalysis.primarySelectivity}. Review findings?`,
    title: 'Functional Group Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        pathwayCount: transformationAnalysis.pathways.length,
        primarySelectivity: selectivityAnalysis.primarySelectivity,
        protectionNeeded: protectionStrategy.protectionNeeded
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    molecule,
    functionalGroups: groupIdentification.functionalGroups,
    electronicCharacter: electronicAnalysis.electronicCharacter,
    reactivities: reactivityPrediction.reactivitySites,
    groupInteractions: groupInteractionAnalysis.interactions,
    transformationPathways: transformationAnalysis.pathways,
    selectivity: {
      chemoselectivity: selectivityAnalysis.chemoselectivity,
      regioselectivity: selectivityAnalysis.regioselectivity,
      stereoselectivity: selectivityAnalysis.stereoselectivity
    },
    protectionStrategy: protectionStrategy.strategy,
    predictedBehavior: {
      primaryReactivity: reactivityPrediction.primaryReactivity,
      expectedProducts: transformationAnalysis.expectedProducts
    },
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/functional-group-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Functional Group Identification
export const groupIdentificationTask = defineTask('group-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify functional groups in the molecule',
  agent: {
    name: 'organic-chemist',
    prompt: {
      role: 'organic chemist identifying functional groups',
      task: 'Identify all functional groups present in the molecule',
      context: args,
      instructions: [
        'Identify all major functional groups (alcohols, aldehydes, ketones, acids, amines, etc.)',
        'Note positions and connectivity of each group',
        'Identify protecting groups if present',
        'Note heterocyclic rings and their character',
        'Identify aromatic systems and substituents',
        'Note alkyl chains and branching',
        'Identify stereogenic centers',
        'Note leaving groups',
        'Identify nucleophilic and electrophilic sites',
        'Save functional group identification to output directory'
      ],
      outputFormat: 'JSON with functionalGroups (array with name, type, position, connectivity, stereochemistry), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalGroups', 'artifacts'],
      properties: {
        functionalGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              smarts: { type: 'string' },
              position: { type: 'string' },
              connectivity: { type: 'array', items: { type: 'string' } },
              stereochemistry: { type: 'string' }
            }
          }
        },
        stereogenicCenters: { type: 'array' },
        aromaticSystems: { type: 'array' },
        heterocycles: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'functional-groups', 'chemistry', 'identification']
}));

// Task 2: Electronic Character Analysis
export const electronicCharacterTask = defineTask('electronic-character', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze electronic character of functional groups',
  agent: {
    name: 'electronic-analyst',
    prompt: {
      role: 'physical organic chemist analyzing electronic effects',
      task: 'Analyze the electronic character and effects of each functional group',
      context: args,
      instructions: [
        'Classify groups as electron-donating (EDG) or electron-withdrawing (EWG)',
        'Assess inductive effects (+I or -I)',
        'Assess mesomeric/resonance effects (+M or -M)',
        'Identify HOMO and LUMO characteristics',
        'Assess nucleophilicity/electrophilicity at each site',
        'Note hyperconjugation effects',
        'Assess acidity/basicity of relevant groups',
        'Consider field effects',
        'Map electron density distribution',
        'Save electronic analysis to output directory'
      ],
      outputFormat: 'JSON with electronicCharacter (array with group, electronEffect, inductive, mesomeric, nucleophilicity), acidBasicity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['electronicCharacter', 'artifacts'],
      properties: {
        electronicCharacter: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              groupId: { type: 'string' },
              electronEffect: { type: 'string' },
              inductiveEffect: { type: 'string' },
              mesomericEffect: { type: 'string' },
              nucleophilicity: { type: 'string' },
              electrophilicity: { type: 'string' }
            }
          }
        },
        acidBasicity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              groupId: { type: 'string' },
              pKa: { type: 'string' },
              pKb: { type: 'string' }
            }
          }
        },
        homoLumo: { type: 'object' },
        electronDensityMap: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'functional-groups', 'chemistry', 'electronics']
}));

// Task 3: Reactivity Prediction
export const reactivityPredictionTask = defineTask('reactivity-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Predict reactivity patterns',
  agent: {
    name: 'reactivity-predictor',
    prompt: {
      role: 'organic chemist predicting reactivity',
      task: 'Predict reactivity patterns for each functional group',
      context: args,
      instructions: [
        'For each functional group, list characteristic reactions',
        'Identify nucleophilic sites and their reactivity',
        'Identify electrophilic sites and their reactivity',
        'Rank reactivity of different sites',
        'Predict behavior toward common reagents',
        'Note conditions affecting reactivity (pH, solvent, temperature)',
        'Identify possible side reactions',
        'Consider kinetic vs thermodynamic control',
        'Note catalysis effects',
        'Save reactivity predictions to output directory'
      ],
      outputFormat: 'JSON with reactivitySites (array with site, type, reactions, rank, conditions), primaryReactivity, sideReactions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reactivitySites', 'primaryReactivity', 'artifacts'],
      properties: {
        reactivitySites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              siteId: { type: 'string' },
              groupId: { type: 'string' },
              siteType: { type: 'string' },
              characteristicReactions: { type: 'array', items: { type: 'string' } },
              reactivityRank: { type: 'number' },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        primaryReactivity: { type: 'string' },
        sideReactions: { type: 'array', items: { type: 'string' } },
        kineticVsThermodynamic: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'functional-groups', 'chemistry', 'reactivity']
}));

// Task 4: Group Interaction Analysis
export const groupInteractionTask = defineTask('group-interaction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze interactions between functional groups',
  agent: {
    name: 'interaction-analyst',
    prompt: {
      role: 'organic chemist analyzing group interactions',
      task: 'Analyze how functional groups interact and influence each other',
      context: args,
      instructions: [
        'Identify through-bond electronic interactions',
        'Identify through-space interactions',
        'Assess neighboring group participation potential',
        'Identify hydrogen bonding possibilities',
        'Assess steric interactions between groups',
        'Note chelation possibilities',
        'Identify potential intramolecular reactions',
        'Assess conformational effects on reactivity',
        'Consider proximity effects',
        'Save group interaction analysis to output directory'
      ],
      outputFormat: 'JSON with interactions (array with groups, type, effect, magnitude), neighboringGroupEffects, stericInteractions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interactions', 'artifacts'],
      properties: {
        interactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group1: { type: 'string' },
              group2: { type: 'string' },
              interactionType: { type: 'string' },
              effect: { type: 'string' },
              magnitude: { type: 'string' }
            }
          }
        },
        neighboringGroupEffects: { type: 'array' },
        stericInteractions: { type: 'array' },
        hBondingPossibilities: { type: 'array' },
        chelationPossibilities: { type: 'array' },
        conformationalEffects: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'functional-groups', 'chemistry', 'interactions']
}));

// Task 5: Transformation Pathway Analysis
export const transformationPathwayTask = defineTask('transformation-pathway', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze possible transformation pathways',
  agent: {
    name: 'transformation-analyst',
    prompt: {
      role: 'synthetic chemist analyzing transformations',
      task: 'Analyze possible pathways for the target transformation',
      context: args,
      instructions: [
        'Identify functional groups involved in target transformation',
        'Map out mechanistic pathways',
        'Identify required reagents and conditions',
        'Assess feasibility of each pathway',
        'Consider one-pot vs stepwise approaches',
        'Identify potential competing pathways',
        'Estimate relative rates of pathways',
        'Predict expected products (major and minor)',
        'Note byproducts expected',
        'Save transformation analysis to output directory'
      ],
      outputFormat: 'JSON with pathways (array with mechanism, reagents, conditions, feasibility), expectedProducts, byproducts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pathways', 'expectedProducts', 'artifacts'],
      properties: {
        pathways: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              mechanism: { type: 'string' },
              reagents: { type: 'array', items: { type: 'string' } },
              conditions: { type: 'object' },
              feasibility: { type: 'string' },
              relativeRate: { type: 'string' }
            }
          }
        },
        expectedProducts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product: { type: 'string' },
              yield: { type: 'string' },
              isMajor: { type: 'boolean' }
            }
          }
        },
        byproducts: { type: 'array', items: { type: 'string' } },
        competingPathways: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'functional-groups', 'chemistry', 'transformations']
}));

// Task 6: Selectivity Analysis
export const selectivityAnalysisTask = defineTask('selectivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze chemo-, regio-, and stereoselectivity',
  agent: {
    name: 'selectivity-analyst',
    prompt: {
      role: 'organic chemist analyzing selectivity',
      task: 'Analyze selectivity of the transformation',
      context: args,
      instructions: [
        'Analyze chemoselectivity (which functional group reacts)',
        'Analyze regioselectivity (which position in a group)',
        'Analyze stereoselectivity (which stereoisomer forms)',
        'Identify selectivity-determining factors',
        'Predict selectivity ratios',
        'Note conditions that affect selectivity',
        'Identify strategies to improve selectivity',
        'Consider use of chiral catalysts/auxiliaries for stereoselectivity',
        'Note any selectivity issues or concerns',
        'Save selectivity analysis to output directory'
      ],
      outputFormat: 'JSON with chemoselectivity, regioselectivity, stereoselectivity, selectivityIssues, improvementStrategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['chemoselectivity', 'regioselectivity', 'artifacts'],
      properties: {
        chemoselectivity: {
          type: 'object',
          properties: {
            preferredGroup: { type: 'string' },
            selectivityRatio: { type: 'string' },
            determiningFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        regioselectivity: {
          type: 'object',
          properties: {
            preferredPosition: { type: 'string' },
            selectivityRatio: { type: 'string' },
            determiningFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        stereoselectivity: {
          type: 'object',
          properties: {
            preferredStereoisomer: { type: 'string' },
            enantiomericExcess: { type: 'string' },
            diastereomericRatio: { type: 'string' },
            determiningFactors: { type: 'array', items: { type: 'string' } }
          }
        },
        primarySelectivity: { type: 'string' },
        selectivityIssues: { type: 'array', items: { type: 'string' } },
        improvementStrategies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'functional-groups', 'chemistry', 'selectivity']
}));

// Task 7: Protection Strategy
export const protectionStrategyTask = defineTask('protection-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate protection strategies',
  agent: {
    name: 'protection-strategist',
    prompt: {
      role: 'synthetic chemist planning protection strategies',
      task: 'Evaluate need for and design of protecting group strategies',
      context: args,
      instructions: [
        'Identify functional groups needing protection',
        'Select appropriate protecting groups',
        'Consider orthogonality of protecting groups',
        'Plan protection sequence',
        'Plan deprotection sequence',
        'Assess stability of protecting groups under reaction conditions',
        'Note any incompatibilities',
        'Calculate extra steps required',
        'Consider atom economy',
        'Save protection strategy to output directory'
      ],
      outputFormat: 'JSON with protectionNeeded, strategy (protectingGroups, sequence, deprotectionSequence), orthogonality, additionalSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protectionNeeded', 'artifacts'],
      properties: {
        protectionNeeded: { type: 'boolean' },
        strategy: {
          type: 'object',
          properties: {
            groupsToProtect: { type: 'array', items: { type: 'string' } },
            protectingGroups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  functionalGroup: { type: 'string' },
                  protectingGroup: { type: 'string' },
                  protectionConditions: { type: 'string' },
                  deprotectionConditions: { type: 'string' }
                }
              }
            },
            protectionSequence: { type: 'array', items: { type: 'string' } },
            deprotectionSequence: { type: 'array', items: { type: 'string' } }
          }
        },
        orthogonality: { type: 'object' },
        additionalSteps: { type: 'number' },
        incompatibilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'functional-groups', 'chemistry', 'protection']
}));
