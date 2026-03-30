/**
 * @process scientific-discovery/uniformitarianism
 * @description Use present-day geological processes to interpret the geological past, applying the principle that processes operating today also operated in the past
 * @inputs { presentProcess: object, geologicalRecord: object, timePeriod: string, outputDir: string }
 * @outputs { success: boolean, interpretation: object, processAnalysis: object, reconstructedConditions: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    presentProcess = {},
    geologicalRecord = {},
    timePeriod = '',
    outputDir = 'uniformitarianism-output',
    targetConfidence = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Uniformitarianism Process');

  // ============================================================================
  // PHASE 1: PRESENT PROCESS CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Characterizing present-day process');
  const presentCharacterization = await ctx.task(presentProcessCharacterizationTask, {
    presentProcess,
    outputDir
  });

  artifacts.push(...presentCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: GEOLOGICAL RECORD ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing geological record');
  const recordAnalysis = await ctx.task(geologicalRecordAnalysisTask, {
    geologicalRecord,
    timePeriod,
    outputDir
  });

  artifacts.push(...recordAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: PROCESS-RECORD MATCHING
  // ============================================================================

  ctx.log('info', 'Phase 3: Matching present processes to geological record');
  const processMatching = await ctx.task(processRecordMatchingTask, {
    presentCharacterization,
    recordAnalysis,
    outputDir
  });

  artifacts.push(...processMatching.artifacts);

  // ============================================================================
  // PHASE 4: RATE AND INTENSITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing rates and intensities');
  const rateAssessment = await ctx.task(rateIntensityAssessmentTask, {
    presentProcess: presentCharacterization.process,
    geologicalRecord: recordAnalysis.features,
    matches: processMatching.matches,
    timePeriod,
    outputDir
  });

  artifacts.push(...rateAssessment.artifacts);

  // ============================================================================
  // PHASE 5: BOUNDARY CONDITIONS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing boundary conditions');
  const boundaryAnalysis = await ctx.task(boundaryConditionsTask, {
    presentProcess: presentCharacterization.process,
    timePeriod,
    geologicalRecord: recordAnalysis.features,
    outputDir
  });

  artifacts.push(...boundaryAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: PALEOENVIRONMENT RECONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Reconstructing paleoenvironment');
  const paleoenvironment = await ctx.task(paleoenvironmentReconstructionTask, {
    processMatching,
    rateAssessment,
    boundaryAnalysis,
    timePeriod,
    outputDir
  });

  artifacts.push(...paleoenvironment.artifacts);

  // ============================================================================
  // PHASE 7: LIMITATIONS AND CAVEATS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing limitations and caveats');
  const limitationsAssessment = await ctx.task(limitationsCaveatsTask, {
    interpretation: paleoenvironment.reconstruction,
    processMatching,
    boundaryAnalysis,
    outputDir
  });

  artifacts.push(...limitationsAssessment.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND INTERPRETATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing interpretation');
  const synthesis = await ctx.task(uniformitarianSynthesisTask, {
    presentCharacterization,
    recordAnalysis,
    processMatching,
    rateAssessment,
    boundaryAnalysis,
    paleoenvironment,
    limitationsAssessment,
    targetConfidence,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const confidenceMet = synthesis.confidenceScore >= targetConfidence;

  // Breakpoint: Review interpretation
  await ctx.breakpoint({
    question: `Uniformitarian interpretation complete. Confidence: ${synthesis.confidenceScore}/${targetConfidence}. ${confidenceMet ? 'Confidence target met!' : 'Additional evidence may be needed.'} Review interpretation?`,
    title: 'Uniformitarianism Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        presentProcess: presentCharacterization.process.name,
        timePeriod,
        matchConfidence: processMatching.overallConfidence,
        rateComparison: rateAssessment.comparison,
        confidenceScore: synthesis.confidenceScore,
        confidenceMet,
        limitations: limitationsAssessment.majorLimitations.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    interpretation: synthesis.interpretation,
    processAnalysis: {
      present: presentCharacterization.process,
      past: processMatching.inferredPastProcess
    },
    reconstructedConditions: paleoenvironment.reconstruction,
    rateComparison: rateAssessment.comparison,
    limitations: limitationsAssessment.limitations,
    confidenceScore: synthesis.confidenceScore,
    confidenceMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/uniformitarianism',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Present Process Characterization
export const presentProcessCharacterizationTask = defineTask('present-process-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize present-day process',
  agent: {
    name: 'process-geologist',
    prompt: {
      role: 'geologist specializing in modern sedimentary and geomorphic processes',
      task: 'Thoroughly characterize a present-day geological process',
      context: args,
      instructions: [
        'Identify and name the geological process',
        'Describe the mechanism in detail:',
        '  - Physical and chemical principles',
        '  - Energy sources and drivers',
        '  - Material inputs and outputs',
        'Quantify process parameters:',
        '  - Rates (erosion, deposition, etc.)',
        '  - Spatial scales',
        '  - Temporal patterns',
        'Document environmental conditions required:',
        '  - Climate',
        '  - Topography',
        '  - Rock/sediment types',
        '  - Biological influences',
        'Describe diagnostic features produced',
        'Note variability and extreme events',
        'Save characterization to output directory'
      ],
      outputFormat: 'JSON with process (name, mechanism, rates, conditions, diagnosticFeatures), variability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['process', 'artifacts'],
      properties: {
        process: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            mechanism: { type: 'string' },
            energySource: { type: 'string' },
            rates: { type: 'object' },
            spatialScale: { type: 'string' },
            temporalPattern: { type: 'string' },
            requiredConditions: { type: 'object' },
            diagnosticFeatures: { type: 'array', items: { type: 'string' } }
          }
        },
        variability: {
          type: 'object',
          properties: {
            normal: { type: 'object' },
            extreme: { type: 'object' }
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
  labels: ['agent', 'uniformitarianism', 'process-characterization']
}));

// Task 2: Geological Record Analysis
export const geologicalRecordAnalysisTask = defineTask('geological-record-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze geological record',
  agent: {
    name: 'stratigrapher',
    prompt: {
      role: 'stratigrapher and sedimentologist',
      task: 'Analyze features preserved in the geological record',
      context: args,
      instructions: [
        'Document observed geological features:',
        '  - Rock types and compositions',
        '  - Sedimentary structures',
        '  - Textures and fabrics',
        '  - Fossils and trace fossils',
        '  - Geochemical signatures',
        'Establish stratigraphic context:',
        '  - Position in sequence',
        '  - Lateral relationships',
        '  - Age constraints',
        'Identify primary vs. secondary features',
        'Note preservation quality and biases',
        'Document spatial extent and geometry',
        'Identify features requiring explanation',
        'Save record analysis to output directory'
      ],
      outputFormat: 'JSON with features (observations, stratigraphy, preservation), featuresRequiringExplanation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'featuresRequiringExplanation', 'artifacts'],
      properties: {
        features: {
          type: 'object',
          properties: {
            lithology: { type: 'object' },
            sedimentaryStructures: { type: 'array', items: { type: 'string' } },
            textures: { type: 'object' },
            fossils: { type: 'array', items: { type: 'string' } },
            geochemistry: { type: 'object' }
          }
        },
        stratigraphy: {
          type: 'object',
          properties: {
            age: { type: 'string' },
            position: { type: 'string' },
            thickness: { type: 'string' },
            lateralExtent: { type: 'string' }
          }
        },
        preservation: {
          type: 'object',
          properties: {
            quality: { type: 'string' },
            biases: { type: 'array', items: { type: 'string' } }
          }
        },
        featuresRequiringExplanation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uniformitarianism', 'record-analysis']
}));

// Task 3: Process-Record Matching
export const processRecordMatchingTask = defineTask('process-record-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Match present processes to geological record',
  agent: {
    name: 'actualistic-interpreter',
    prompt: {
      role: 'geologist applying actualistic principles',
      task: 'Match observed geological features to known present-day processes',
      context: args,
      instructions: [
        'For each feature in the geological record:',
        '  - Identify present-day processes that produce similar features',
        '  - Assess quality of match',
        '  - Consider alternative processes',
        'Apply actualistic reasoning:',
        '  - "If this process produces this feature today..."',
        '  - "...then this feature in the past was likely produced by this process"',
        'Document multiple working hypotheses where appropriate',
        'Rank interpretations by likelihood',
        'Identify features with no modern analogue',
        'Calculate overall match confidence',
        'Save matching analysis to output directory'
      ],
      outputFormat: 'JSON with matches (array), inferredPastProcess, overallConfidence, noModernAnalogue, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matches', 'inferredPastProcess', 'overallConfidence', 'artifacts'],
      properties: {
        matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              matchedProcess: { type: 'string' },
              matchQuality: { type: 'string', enum: ['excellent', 'good', 'moderate', 'poor'] },
              alternatives: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' }
            }
          }
        },
        inferredPastProcess: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            characteristics: { type: 'object' }
          }
        },
        overallConfidence: { type: 'number' },
        noModernAnalogue: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uniformitarianism', 'process-matching']
}));

// Task 4: Rate and Intensity Assessment
export const rateIntensityAssessmentTask = defineTask('rate-intensity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess rates and intensities',
  agent: {
    name: 'quantitative-geologist',
    prompt: {
      role: 'quantitative geologist specializing in process rates',
      task: 'Compare rates and intensities between present and past processes',
      context: args,
      instructions: [
        'Estimate past process rates from geological record:',
        '  - Sediment accumulation rates',
        '  - Erosion rates',
        '  - Event frequencies',
        'Compare to present-day rates:',
        '  - Are past rates within modern range?',
        '  - Do they represent normal or extreme conditions?',
        'Consider gradualism vs. catastrophism:',
        '  - Could feature form at modern rates over geological time?',
        '  - Is evidence for rapid/catastrophic events?',
        'Assess whether same process, different intensity',
        'Calculate time required at different rates',
        'Document rate uncertainties',
        'Save rate assessment to output directory'
      ],
      outputFormat: 'JSON with comparison (presentRates, inferredPastRates, ratio), gradualistAssessment, catastrophicEvidence, timeEstimates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'gradualistAssessment', 'artifacts'],
      properties: {
        comparison: {
          type: 'object',
          properties: {
            presentRates: { type: 'object' },
            inferredPastRates: { type: 'object' },
            ratio: { type: 'number' },
            withinModernRange: { type: 'boolean' }
          }
        },
        gradualistAssessment: {
          type: 'object',
          properties: {
            feasible: { type: 'boolean' },
            timeRequired: { type: 'string' },
            reasoning: { type: 'string' }
          }
        },
        catastrophicEvidence: {
          type: 'object',
          properties: {
            present: { type: 'boolean' },
            indicators: { type: 'array', items: { type: 'string' } }
          }
        },
        timeEstimates: { type: 'object' },
        uncertainties: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uniformitarianism', 'rate-assessment']
}));

// Task 5: Boundary Conditions Analysis
export const boundaryConditionsTask = defineTask('boundary-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze boundary conditions',
  agent: {
    name: 'paleoclimatologist',
    prompt: {
      role: 'paleoclimatologist and paleogeographer',
      task: 'Assess whether past boundary conditions allowed the inferred process',
      context: args,
      instructions: [
        'Reconstruct boundary conditions for the time period:',
        '  - Paleoclimate (temperature, precipitation, seasonality)',
        '  - Paleogeography (continental positions, ocean circulation)',
        '  - Atmospheric composition (CO2, O2)',
        '  - Sea level',
        '  - Biological factors',
        'Compare to conditions required by present process:',
        '  - Were required conditions present?',
        '  - What was different?',
        '  - How might differences affect process?',
        'Identify constraints on interpretation',
        'Consider how boundary changes affected process operation',
        'Save boundary analysis to output directory'
      ],
      outputFormat: 'JSON with pastConditions, requiredConditions, comparison, constraints, implications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pastConditions', 'requiredConditions', 'comparison', 'artifacts'],
      properties: {
        pastConditions: {
          type: 'object',
          properties: {
            climate: { type: 'object' },
            geography: { type: 'object' },
            atmosphere: { type: 'object' },
            seaLevel: { type: 'string' },
            biosphere: { type: 'object' }
          }
        },
        requiredConditions: {
          type: 'object',
          properties: {
            essential: { type: 'array', items: { type: 'string' } },
            optimal: { type: 'array', items: { type: 'string' } }
          }
        },
        comparison: {
          type: 'object',
          properties: {
            compatible: { type: 'boolean' },
            differences: { type: 'array', items: { type: 'string' } },
            implications: { type: 'array', items: { type: 'string' } }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uniformitarianism', 'boundary-conditions']
}));

// Task 6: Paleoenvironment Reconstruction
export const paleoenvironmentReconstructionTask = defineTask('paleoenvironment-reconstruction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconstruct paleoenvironment',
  agent: {
    name: 'paleoenvironment-reconstructor',
    prompt: {
      role: 'paleoenvironmentalist',
      task: 'Reconstruct the past environment based on uniformitarian interpretation',
      context: args,
      instructions: [
        'Integrate all evidence to reconstruct paleoenvironment:',
        '  - Depositional environment',
        '  - Climate conditions',
        '  - Geographic setting',
        '  - Ecological conditions',
        'Apply uniformitarian inference:',
        '  - "This process today occurs in environment X..."',
        '  - "...therefore similar ancient deposits indicate environment X"',
        'Create detailed environmental reconstruction',
        'Identify aspects with high vs. low confidence',
        'Generate paleogeographic/paleoenvironmental model',
        'Identify testable predictions from reconstruction',
        'Save reconstruction to output directory'
      ],
      outputFormat: 'JSON with reconstruction (environment, climate, geography, ecology), confidenceByAspect, model, predictions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reconstruction', 'confidenceByAspect', 'artifacts'],
      properties: {
        reconstruction: {
          type: 'object',
          properties: {
            depositionalEnvironment: { type: 'string' },
            climate: { type: 'object' },
            geography: { type: 'object' },
            ecology: { type: 'object' },
            waterDepth: { type: 'string' },
            energyLevel: { type: 'string' }
          }
        },
        confidenceByAspect: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        model: { type: 'string' },
        predictions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uniformitarianism', 'reconstruction']
}));

// Task 7: Limitations and Caveats
export const limitationsCaveatsTask = defineTask('limitations-caveats', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess limitations and caveats',
  agent: {
    name: 'critical-analyst',
    prompt: {
      role: 'geologist specializing in methodology and epistemology',
      task: 'Identify limitations and caveats of uniformitarian interpretation',
      context: args,
      instructions: [
        'Identify limitations of uniformitarianism:',
        '  - No-analogue situations (conditions with no modern equivalent)',
        '  - Scale effects (small modern examples extrapolated to large ancient)',
        '  - Preservation bias (what is lost vs. preserved)',
        '  - Multiple interpretations (equifinality)',
        'Assess specific caveats for this interpretation:',
        '  - Boundary condition differences',
        '  - Rate/intensity differences',
        '  - Process modifications over time',
        'Identify features not explained by interpretation',
        'Note competing hypotheses',
        'Recommend how to address limitations',
        'Save limitations assessment to output directory'
      ],
      outputFormat: 'JSON with limitations, majorLimitations, minorLimitations, unexplainedFeatures, competingHypotheses, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['limitations', 'majorLimitations', 'artifacts'],
      properties: {
        limitations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['major', 'moderate', 'minor'] },
              mitigation: { type: 'string' }
            }
          }
        },
        majorLimitations: { type: 'array', items: { type: 'string' } },
        minorLimitations: { type: 'array', items: { type: 'string' } },
        unexplainedFeatures: { type: 'array', items: { type: 'string' } },
        competingHypotheses: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uniformitarianism', 'limitations']
}));

// Task 8: Uniformitarian Synthesis
export const uniformitarianSynthesisTask = defineTask('uniformitarian-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize interpretation',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior geologist',
      task: 'Synthesize uniformitarian interpretation with full assessment',
      context: args,
      instructions: [
        'Integrate all analyses into coherent interpretation',
        'State the uniformitarian inference clearly:',
        '  - "The present is the key to the past"',
        '  - What process operated',
        '  - Under what conditions',
        '  - At what rates',
        'Assess confidence (0-100) based on:',
        '  - Quality of process-feature matches',
        '  - Rate compatibility',
        '  - Boundary condition compatibility',
        '  - Absence of major limitations',
        'Summarize paleoenvironmental reconstruction',
        'List key predictions and how to test them',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with interpretation, confidenceScore, paleoenvironment, predictions, testingApproaches, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretation', 'confidenceScore', 'artifacts'],
      properties: {
        interpretation: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            process: { type: 'string' },
            conditions: { type: 'object' },
            rates: { type: 'object' },
            keyEvidence: { type: 'array', items: { type: 'string' } }
          }
        },
        confidenceScore: { type: 'number', minimum: 0, maximum: 100 },
        paleoenvironment: { type: 'object' },
        predictions: { type: 'array', items: { type: 'object' } },
        testingApproaches: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'uniformitarianism', 'synthesis']
}));
