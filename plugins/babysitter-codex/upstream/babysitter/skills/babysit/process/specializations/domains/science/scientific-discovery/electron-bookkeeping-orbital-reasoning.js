/**
 * @process scientific-discovery/electron-bookkeeping-orbital-reasoning
 * @description Electron Bookkeeping and Orbital Reasoning process (Chemistry) - Track electrons, charges, oxidation states, and orbital interactions to understand reactivity
 * @inputs { molecule: object, reactionType: string, reagents: array, outputDir: string }
 * @outputs { success: boolean, electronCount: object, orbitalAnalysis: object, mechanisticInsight: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    molecule = {},
    reactionType = '',
    reagents = [],
    outputDir = 'electron-bookkeeping-output',
    includeQuantumEffects = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Electron Bookkeeping and Orbital Reasoning Process');

  // ============================================================================
  // PHASE 1: ELECTRON COUNT AND FORMAL CHARGES
  // ============================================================================

  ctx.log('info', 'Phase 1: Counting electrons and determining formal charges');
  const electronCounting = await ctx.task(electronCountingTask, {
    molecule,
    outputDir
  });

  artifacts.push(...electronCounting.artifacts);

  // ============================================================================
  // PHASE 2: OXIDATION STATE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing oxidation states');
  const oxidationAnalysis = await ctx.task(oxidationStateTask, {
    molecule,
    electronCount: electronCounting.electronCount,
    outputDir
  });

  artifacts.push(...oxidationAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: ORBITAL CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Determining orbital configurations');
  const orbitalConfiguration = await ctx.task(orbitalConfigurationTask, {
    molecule,
    oxidationStates: oxidationAnalysis.oxidationStates,
    includeQuantumEffects,
    outputDir
  });

  artifacts.push(...orbitalConfiguration.artifacts);

  // ============================================================================
  // PHASE 4: FRONTIER ORBITAL ANALYSIS (HOMO-LUMO)
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing frontier orbitals (HOMO/LUMO)');
  const frontierOrbitalAnalysis = await ctx.task(frontierOrbitalTask, {
    molecule,
    orbitalConfiguration: orbitalConfiguration.configuration,
    outputDir
  });

  artifacts.push(...frontierOrbitalAnalysis.artifacts);

  // Breakpoint: Review orbital analysis
  await ctx.breakpoint({
    question: `Orbital analysis complete. HOMO-LUMO gap: ${frontierOrbitalAnalysis.homoLumoGap}. Review before mechanism analysis?`,
    title: 'Orbital Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalElectrons: electronCounting.totalElectrons,
        homoLumoGap: frontierOrbitalAnalysis.homoLumoGap
      }
    }
  });

  // ============================================================================
  // PHASE 5: ELECTRON FLOW MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Mapping electron flow in reaction');
  const electronFlowMapping = await ctx.task(electronFlowTask, {
    molecule,
    reagents,
    reactionType,
    frontierOrbitals: frontierOrbitalAnalysis.frontierOrbitals,
    outputDir
  });

  artifacts.push(...electronFlowMapping.artifacts);

  // ============================================================================
  // PHASE 6: ORBITAL SYMMETRY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing orbital symmetry for reaction');
  const orbitalSymmetryAnalysis = await ctx.task(orbitalSymmetryTask, {
    molecule,
    reagents,
    reactionType,
    frontierOrbitals: frontierOrbitalAnalysis.frontierOrbitals,
    outputDir
  });

  artifacts.push(...orbitalSymmetryAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: REDOX BALANCE CHECK
  // ============================================================================

  ctx.log('info', 'Phase 7: Checking redox balance');
  const redoxBalanceCheck = await ctx.task(redoxBalanceTask, {
    molecule,
    reagents,
    oxidationStates: oxidationAnalysis.oxidationStates,
    electronFlow: electronFlowMapping.electronFlow,
    outputDir
  });

  artifacts.push(...redoxBalanceCheck.artifacts);

  // ============================================================================
  // PHASE 8: MECHANISTIC INSIGHT SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing mechanistic insights');
  const mechanisticInsight = await ctx.task(mechanisticInsightTask, {
    electronFlow: electronFlowMapping.electronFlow,
    orbitalSymmetry: orbitalSymmetryAnalysis.symmetryAnalysis,
    frontierOrbitals: frontierOrbitalAnalysis.frontierOrbitals,
    redoxBalance: redoxBalanceCheck.balance,
    reactionType,
    outputDir
  });

  artifacts.push(...mechanisticInsight.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Electron bookkeeping complete. Reaction mechanism: ${mechanisticInsight.mechanismType}. Orbital symmetry: ${orbitalSymmetryAnalysis.symmetryAllowed ? 'allowed' : 'forbidden'}. Review findings?`,
    title: 'Electron Bookkeeping Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        mechanismType: mechanisticInsight.mechanismType,
        symmetryAllowed: orbitalSymmetryAnalysis.symmetryAllowed,
        redoxBalanced: redoxBalanceCheck.balanced
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    molecule,
    electronCount: {
      total: electronCounting.totalElectrons,
      valence: electronCounting.valenceElectrons,
      formalCharges: electronCounting.formalCharges
    },
    oxidationStates: oxidationAnalysis.oxidationStates,
    orbitalAnalysis: {
      configuration: orbitalConfiguration.configuration,
      frontierOrbitals: frontierOrbitalAnalysis.frontierOrbitals,
      homoLumoGap: frontierOrbitalAnalysis.homoLumoGap
    },
    electronFlow: electronFlowMapping.electronFlow,
    orbitalSymmetry: {
      analysis: orbitalSymmetryAnalysis.symmetryAnalysis,
      allowed: orbitalSymmetryAnalysis.symmetryAllowed
    },
    redoxBalance: redoxBalanceCheck.balance,
    mechanisticInsight: mechanisticInsight.insights,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/electron-bookkeeping-orbital-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Electron Counting
export const electronCountingTask = defineTask('electron-counting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Count electrons and determine formal charges',
  agent: {
    name: 'electron-counter',
    prompt: {
      role: 'chemist counting electrons',
      task: 'Count all electrons and determine formal charges in the molecule',
      context: args,
      instructions: [
        'Count total electrons in the molecule',
        'Count valence electrons for each atom',
        'Determine formal charge on each atom',
        'Verify charge balance',
        'Identify lone pairs',
        'Count bonding electrons',
        'Note electron-deficient centers',
        'Note electron-rich centers',
        'Check octet rule satisfaction',
        'Save electron count to output directory'
      ],
      outputFormat: 'JSON with totalElectrons, valenceElectrons, formalCharges, lonePairs, bondingElectrons, octetStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalElectrons', 'valenceElectrons', 'formalCharges', 'artifacts'],
      properties: {
        totalElectrons: { type: 'number' },
        valenceElectrons: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        formalCharges: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        lonePairs: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        bondingElectrons: { type: 'number' },
        electronDeficientCenters: { type: 'array', items: { type: 'string' } },
        electronRichCenters: { type: 'array', items: { type: 'string' } },
        octetStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'electron-bookkeeping', 'chemistry', 'counting']
}));

// Task 2: Oxidation State Analysis
export const oxidationStateTask = defineTask('oxidation-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze oxidation states',
  agent: {
    name: 'oxidation-analyst',
    prompt: {
      role: 'inorganic chemist analyzing oxidation states',
      task: 'Determine oxidation states of all atoms in the molecule',
      context: args,
      instructions: [
        'Assign oxidation states to all atoms',
        'Use standard rules (O = -2, H = +1, etc.)',
        'Handle special cases (peroxides, metal complexes)',
        'Verify sum of oxidation states equals overall charge',
        'Identify atoms capable of redox',
        'Note unusual oxidation states',
        'Compare to typical oxidation states for each element',
        'Identify likely oxidation/reduction sites',
        'Save oxidation state analysis to output directory'
      ],
      outputFormat: 'JSON with oxidationStates, unusualStates, redoxCapableSites, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['oxidationStates', 'artifacts'],
      properties: {
        oxidationStates: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        unusualStates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              atom: { type: 'string' },
              state: { type: 'number' },
              reason: { type: 'string' }
            }
          }
        },
        redoxCapableSites: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              atom: { type: 'string' },
              currentState: { type: 'number' },
              accessibleStates: { type: 'array', items: { type: 'number' } }
            }
          }
        },
        verificationSum: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'electron-bookkeeping', 'chemistry', 'oxidation']
}));

// Task 3: Orbital Configuration
export const orbitalConfigurationTask = defineTask('orbital-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine orbital configurations',
  agent: {
    name: 'orbital-specialist',
    prompt: {
      role: 'quantum chemist determining orbital configurations',
      task: 'Determine the orbital configuration for atoms and molecules',
      context: args,
      instructions: [
        'Determine ground state electron configuration for each atom',
        'Build molecular orbitals from atomic orbitals',
        'Apply aufbau principle, Hund\'s rule, Pauli exclusion',
        'Identify sigma and pi bonding/antibonding orbitals',
        'Note orbital hybridization (sp, sp2, sp3, etc.)',
        'Identify d-orbital involvement for transition metals',
        'Note any unpaired electrons (radicals)',
        'Calculate bond order from MO theory',
        'Save orbital configuration to output directory'
      ],
      outputFormat: 'JSON with configuration (atomic, molecular, hybridization), bondOrders, unpairedElectrons, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            atomicConfigurations: { type: 'object' },
            molecularOrbitals: { type: 'array', items: { type: 'string' } },
            hybridization: { type: 'object' },
            sigmaOrbitals: { type: 'array', items: { type: 'string' } },
            piOrbitals: { type: 'array', items: { type: 'string' } }
          }
        },
        bondOrders: { type: 'object' },
        unpairedElectrons: { type: 'number' },
        magneticProperties: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'electron-bookkeeping', 'chemistry', 'orbitals']
}));

// Task 4: Frontier Orbital Analysis
export const frontierOrbitalTask = defineTask('frontier-orbital', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze frontier orbitals (HOMO/LUMO)',
  agent: {
    name: 'frontier-orbital-analyst',
    prompt: {
      role: 'physical organic chemist analyzing frontier orbitals',
      task: 'Analyze HOMO and LUMO for reactivity prediction',
      context: args,
      instructions: [
        'Identify the HOMO (Highest Occupied Molecular Orbital)',
        'Identify the LUMO (Lowest Unoccupied Molecular Orbital)',
        'Determine HOMO-LUMO gap',
        'Map orbital coefficients (where HOMO/LUMO are located)',
        'Identify nucleophilic sites (high HOMO coefficient)',
        'Identify electrophilic sites (high LUMO coefficient)',
        'Assess hardness/softness from HOMO-LUMO gap',
        'Note orbital symmetry of HOMO and LUMO',
        'Predict reactivity from frontier orbital theory',
        'Save frontier orbital analysis to output directory'
      ],
      outputFormat: 'JSON with frontierOrbitals (homo, lumo, gap, coefficients), nucleophilicSites, electrophilicSites, hardness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['frontierOrbitals', 'homoLumoGap', 'artifacts'],
      properties: {
        frontierOrbitals: {
          type: 'object',
          properties: {
            homo: {
              type: 'object',
              properties: {
                energy: { type: 'string' },
                symmetry: { type: 'string' },
                coefficients: { type: 'object' }
              }
            },
            lumo: {
              type: 'object',
              properties: {
                energy: { type: 'string' },
                symmetry: { type: 'string' },
                coefficients: { type: 'object' }
              }
            }
          }
        },
        homoLumoGap: { type: 'string' },
        nucleophilicSites: { type: 'array', items: { type: 'string' } },
        electrophilicSites: { type: 'array', items: { type: 'string' } },
        hardness: { type: 'string' },
        softness: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'electron-bookkeeping', 'chemistry', 'frontier-orbitals']
}));

// Task 5: Electron Flow Mapping
export const electronFlowTask = defineTask('electron-flow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map electron flow in reaction',
  agent: {
    name: 'electron-flow-mapper',
    prompt: {
      role: 'mechanistic chemist mapping electron flow',
      task: 'Map the flow of electrons during the reaction',
      context: args,
      instructions: [
        'Identify electron source (nucleophile/HOMO)',
        'Identify electron sink (electrophile/LUMO)',
        'Draw curved arrows showing electron movement',
        'Track electron pairs through mechanism steps',
        'Identify bonds being made and broken',
        'Count electrons involved in each step',
        'Verify electron conservation',
        'Note heterolytic vs homolytic bond cleavage',
        'Identify any single electron transfers (SET)',
        'Save electron flow map to output directory'
      ],
      outputFormat: 'JSON with electronFlow (source, sink, arrows, bondsChanged), electronConservation, mechanism, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['electronFlow', 'artifacts'],
      properties: {
        electronFlow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              source: { type: 'string' },
              sink: { type: 'string' },
              electronsTransferred: { type: 'number' },
              arrowNotation: { type: 'string' },
              bondsMade: { type: 'array', items: { type: 'string' } },
              bondsBroken: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        electronConservation: { type: 'boolean' },
        heterolyticCleavage: { type: 'array', items: { type: 'string' } },
        homolyticCleavage: { type: 'array', items: { type: 'string' } },
        setSteps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'electron-bookkeeping', 'chemistry', 'electron-flow']
}));

// Task 6: Orbital Symmetry Analysis
export const orbitalSymmetryTask = defineTask('orbital-symmetry', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze orbital symmetry for reaction',
  agent: {
    name: 'orbital-symmetry-analyst',
    prompt: {
      role: 'physical organic chemist analyzing orbital symmetry',
      task: 'Apply Woodward-Hoffmann rules to assess orbital symmetry',
      context: args,
      instructions: [
        'Classify reaction type (pericyclic, etc.)',
        'Identify orbitals involved in the reaction',
        'Determine symmetry of interacting orbitals',
        'Apply Woodward-Hoffmann rules',
        'Determine if reaction is symmetry-allowed or forbidden',
        'Consider thermal vs photochemical conditions',
        'Analyze orbital correlation diagrams',
        'Check conservation of orbital symmetry',
        'Predict stereochemical outcome from symmetry',
        'Save orbital symmetry analysis to output directory'
      ],
      outputFormat: 'JSON with symmetryAnalysis, symmetryAllowed, correlationDiagram, stereochemicalPrediction, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['symmetryAnalysis', 'symmetryAllowed', 'artifacts'],
      properties: {
        symmetryAnalysis: {
          type: 'object',
          properties: {
            reactionClass: { type: 'string' },
            interactingOrbitals: { type: 'array', items: { type: 'string' } },
            symmetryElements: { type: 'array', items: { type: 'string' } },
            woodwardHoffmannRule: { type: 'string' }
          }
        },
        symmetryAllowed: { type: 'boolean' },
        thermalOrPhotochemical: { type: 'string' },
        correlationDiagram: { type: 'string' },
        stereochemicalPrediction: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'electron-bookkeeping', 'chemistry', 'orbital-symmetry']
}));

// Task 7: Redox Balance Check
export const redoxBalanceTask = defineTask('redox-balance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check redox balance',
  agent: {
    name: 'redox-balance-checker',
    prompt: {
      role: 'analytical chemist checking redox balance',
      task: 'Verify that electrons are balanced in the redox reaction',
      context: args,
      instructions: [
        'Identify oxidation half-reaction',
        'Identify reduction half-reaction',
        'Count electrons lost in oxidation',
        'Count electrons gained in reduction',
        'Verify electrons lost = electrons gained',
        'Balance charges with H+ or OH- as needed',
        'Balance atoms (O with H2O, H with H+)',
        'Verify mass balance',
        'Calculate overall cell potential if applicable',
        'Save redox balance to output directory'
      ],
      outputFormat: 'JSON with balance (oxidation, reduction, electronsBalanced, massBalanced), halfReactions, cellPotential, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['balance', 'balanced', 'artifacts'],
      properties: {
        balance: {
          type: 'object',
          properties: {
            oxidationHalfReaction: { type: 'string' },
            reductionHalfReaction: { type: 'string' },
            electronsInOxidation: { type: 'number' },
            electronsInReduction: { type: 'number' }
          }
        },
        balanced: { type: 'boolean' },
        massBalanced: { type: 'boolean' },
        chargeBalanced: { type: 'boolean' },
        cellPotential: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'electron-bookkeeping', 'chemistry', 'redox-balance']
}));

// Task 8: Mechanistic Insight Synthesis
export const mechanisticInsightTask = defineTask('mechanistic-insight', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize mechanistic insights',
  agent: {
    name: 'mechanism-synthesizer',
    prompt: {
      role: 'senior organic chemist synthesizing mechanistic understanding',
      task: 'Synthesize insights from electron bookkeeping into mechanistic understanding',
      context: args,
      instructions: [
        'Classify mechanism type (SN1, SN2, E1, E2, radical, pericyclic, etc.)',
        'Identify rate-determining step from orbital analysis',
        'Predict stereochemistry from orbital symmetry',
        'Identify factors controlling selectivity',
        'Note electronic effects on rate',
        'Predict product distribution',
        'Identify potential side reactions',
        'Summarize key mechanistic insights',
        'Suggest conditions to favor desired pathway',
        'Save mechanistic insights to output directory'
      ],
      outputFormat: 'JSON with mechanismType, rateStep, stereochemistry, selectivityFactors, insights, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanismType', 'insights', 'artifacts'],
      properties: {
        mechanismType: { type: 'string' },
        rateDeterminingStep: { type: 'string' },
        stereochemistry: { type: 'string' },
        selectivityFactors: { type: 'array', items: { type: 'string' } },
        electronicEffects: { type: 'array', items: { type: 'string' } },
        productDistribution: { type: 'object' },
        sideReactions: { type: 'array', items: { type: 'string' } },
        insights: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'electron-bookkeeping', 'chemistry', 'mechanism']
}));
