/**
 * @process scientific-discovery/frame-of-reference-reasoning
 * @description Frame of Reference Reasoning process (Physics) - Choose coordinate systems and reference frames that simplify equations and reveal physical insight
 * @inputs { physicalProblem: string, currentFormulation: object, availableFrames: array, outputDir: string }
 * @outputs { success: boolean, optimalFrame: object, simplifiedEquations: array, transformations: array, insights: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    physicalProblem = '',
    currentFormulation = {},
    availableFrames = [],
    outputDir = 'frame-of-reference-output',
    considerRelativity = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Frame of Reference Reasoning Process');

  // ============================================================================
  // PHASE 1: PROBLEM ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing the physical problem');
  const problemAnalysis = await ctx.task(problemAnalysisTask, {
    physicalProblem,
    currentFormulation,
    outputDir
  });

  artifacts.push(...problemAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: FRAME ENUMERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Enumerating candidate reference frames');
  const frameEnumeration = await ctx.task(frameEnumerationTask, {
    problemCharacteristics: problemAnalysis.characteristics,
    availableFrames,
    considerRelativity,
    outputDir
  });

  artifacts.push(...frameEnumeration.artifacts);

  // ============================================================================
  // PHASE 3: FRAME TRANSFORMATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing transformations between frames');
  const transformationAnalysis = await ctx.task(transformationAnalysisTask, {
    candidateFrames: frameEnumeration.candidateFrames,
    currentFormulation,
    considerRelativity,
    outputDir
  });

  artifacts.push(...transformationAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: SIMPLIFICATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing simplification in each frame');
  const simplificationAssessment = await ctx.task(simplificationAssessmentTask, {
    candidateFrames: frameEnumeration.candidateFrames,
    transformations: transformationAnalysis.transformations,
    currentFormulation,
    outputDir
  });

  artifacts.push(...simplificationAssessment.artifacts);

  // Breakpoint: Review frame options
  await ctx.breakpoint({
    question: `Analyzed ${frameEnumeration.candidateFrames.length} reference frames. Optimal frame: "${simplificationAssessment.optimalFrame.name}" with simplification score ${simplificationAssessment.optimalFrame.simplificationScore}. Review before equation derivation?`,
    title: 'Frame of Reference Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        physicalProblem,
        framesAnalyzed: frameEnumeration.candidateFrames.length,
        optimalFrame: simplificationAssessment.optimalFrame.name
      }
    }
  });

  // ============================================================================
  // PHASE 5: EQUATION DERIVATION IN OPTIMAL FRAME
  // ============================================================================

  ctx.log('info', 'Phase 5: Deriving equations in optimal frame');
  const equationDerivation = await ctx.task(equationDerivationTask, {
    optimalFrame: simplificationAssessment.optimalFrame,
    currentFormulation,
    transformations: transformationAnalysis.transformations,
    outputDir
  });

  artifacts.push(...equationDerivation.artifacts);

  // ============================================================================
  // PHASE 6: INVARIANT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying frame-invariant quantities');
  const invariantIdentification = await ctx.task(invariantIdentificationTask, {
    candidateFrames: frameEnumeration.candidateFrames,
    simplifiedEquations: equationDerivation.simplifiedEquations,
    outputDir
  });

  artifacts.push(...invariantIdentification.artifacts);

  // ============================================================================
  // PHASE 7: PHYSICAL INSIGHT EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Extracting physical insights from frame choice');
  const insightExtraction = await ctx.task(insightExtractionTask, {
    optimalFrame: simplificationAssessment.optimalFrame,
    simplifiedEquations: equationDerivation.simplifiedEquations,
    invariants: invariantIdentification.invariants,
    physicalProblem,
    outputDir
  });

  artifacts.push(...insightExtraction.artifacts);

  // Final breakpoint
  await ctx.breakpoint({
    question: `Frame analysis complete. Equations simplified in ${simplificationAssessment.optimalFrame.name} frame. ${insightExtraction.insights.length} physical insights extracted. Review findings?`,
    title: 'Frame of Reference Analysis Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        optimalFrame: simplificationAssessment.optimalFrame.name,
        simplificationAchieved: equationDerivation.simplificationLevel,
        invariantsFound: invariantIdentification.invariants.length,
        insightCount: insightExtraction.insights.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    physicalProblem,
    optimalFrame: simplificationAssessment.optimalFrame,
    simplifiedEquations: equationDerivation.simplifiedEquations,
    transformations: transformationAnalysis.transformations,
    invariants: invariantIdentification.invariants,
    insights: insightExtraction.insights,
    frameComparison: simplificationAssessment.frameComparison,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/frame-of-reference-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Problem Analysis
export const problemAnalysisTask = defineTask('problem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze the physical problem',
  agent: {
    name: 'physics-problem-analyst',
    prompt: {
      role: 'theoretical physicist analyzing physical problems',
      task: 'Analyze the physical problem to identify features relevant to frame choice',
      context: args,
      instructions: [
        'Identify the key physical entities (particles, fields, bodies)',
        'Identify symmetries of the problem',
        'Identify special points (center of mass, equilibrium positions)',
        'Identify special directions (axes of rotation, directions of motion)',
        'Note velocities and their magnitudes (relativistic?)',
        'Identify conserved quantities',
        'Note periodic or oscillatory behavior',
        'Identify constraints and their nature',
        'Document the current formulation\'s complexity',
        'Save problem analysis to output directory'
      ],
      outputFormat: 'JSON with characteristics (entities, symmetries, specialPoints, specialDirections, velocities, conserved), currentComplexity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'artifacts'],
      properties: {
        characteristics: {
          type: 'object',
          properties: {
            entities: { type: 'array', items: { type: 'string' } },
            symmetries: { type: 'array', items: { type: 'string' } },
            specialPoints: { type: 'array', items: { type: 'string' } },
            specialDirections: { type: 'array', items: { type: 'string' } },
            velocities: { type: 'object' },
            conservedQuantities: { type: 'array', items: { type: 'string' } },
            periodicBehavior: { type: 'array', items: { type: 'string' } },
            constraints: { type: 'array', items: { type: 'string' } }
          }
        },
        currentComplexity: { type: 'object' },
        relativistic: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'frame-of-reference', 'physics', 'problem-analysis']
}));

// Task 2: Frame Enumeration
export const frameEnumerationTask = defineTask('frame-enumeration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enumerate candidate reference frames',
  agent: {
    name: 'frame-enumerator',
    prompt: {
      role: 'physicist identifying reference frame options',
      task: 'Enumerate all potentially useful reference frames for the problem',
      context: args,
      instructions: [
        'List standard inertial frames (lab frame, rest frame)',
        'Consider center-of-mass frame',
        'Consider co-moving frames',
        'Consider rotating frames',
        'Consider accelerating frames',
        'Consider frames aligned with symmetry axes',
        'For relativistic problems, consider different Lorentz frames',
        'Consider generalized coordinates (non-Cartesian)',
        'Note whether frame is inertial or non-inertial',
        'Document motivation for each candidate frame',
        'Save candidate frames to output directory'
      ],
      outputFormat: 'JSON with candidateFrames (array with name, type, inertial, motivation, coordinates), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['candidateFrames', 'artifacts'],
      properties: {
        candidateFrames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              inertial: { type: 'boolean' },
              coordinates: { type: 'string' },
              motivation: { type: 'string' },
              origin: { type: 'string' },
              orientation: { type: 'string' }
            }
          }
        },
        standardFrames: { type: 'array' },
        specialFrames: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'frame-of-reference', 'physics', 'frame-enumeration']
}));

// Task 3: Transformation Analysis
export const transformationAnalysisTask = defineTask('transformation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze transformations between frames',
  agent: {
    name: 'transformation-analyst',
    prompt: {
      role: 'physicist analyzing coordinate transformations',
      task: 'Derive and analyze transformations between candidate frames',
      context: args,
      instructions: [
        'Derive transformation equations between frames',
        'For non-relativistic: Galilean transformations',
        'For relativistic: Lorentz transformations',
        'For rotating frames: derive centrifugal and Coriolis terms',
        'Calculate Jacobians of transformations',
        'Identify how physical quantities transform',
        'Note which quantities are invariant',
        'Calculate metric tensor in each frame if relevant',
        'Document fictitious forces in non-inertial frames',
        'Save transformations to output directory'
      ],
      outputFormat: 'JSON with transformations (array with fromFrame, toFrame, equations, jacobian, fictitiousForces), invariants, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['transformations', 'artifacts'],
      properties: {
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fromFrame: { type: 'string' },
              toFrame: { type: 'string' },
              transformationType: { type: 'string' },
              coordinateTransform: { type: 'object' },
              velocityTransform: { type: 'string' },
              jacobian: { type: 'string' },
              metricTensor: { type: 'string' },
              fictitiousForces: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        invariantQuantities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'frame-of-reference', 'physics', 'transformations']
}));

// Task 4: Simplification Assessment
export const simplificationAssessmentTask = defineTask('simplification-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess simplification in each frame',
  agent: {
    name: 'simplification-assessor',
    prompt: {
      role: 'physicist assessing equation simplification',
      task: 'Assess how much the equations simplify in each candidate frame',
      context: args,
      instructions: [
        'For each frame, assess complexity of equations of motion',
        'Count number of terms in equations',
        'Assess coupling between equations',
        'Identify frames where variables separate',
        'Identify frames where symmetries are manifest',
        'Note frames where certain quantities vanish',
        'Calculate simplification score for each frame',
        'Rank frames by simplification achieved',
        'Identify the optimal frame',
        'Note trade-offs between frames',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with frameComparison (array with frame, termCount, coupling, separability, score), optimalFrame, tradeoffs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['frameComparison', 'optimalFrame', 'artifacts'],
      properties: {
        frameComparison: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frameId: { type: 'string' },
              frameName: { type: 'string' },
              termCount: { type: 'number' },
              couplingLevel: { type: 'string' },
              separability: { type: 'string' },
              manifestSymmetries: { type: 'array', items: { type: 'string' } },
              vanishingQuantities: { type: 'array', items: { type: 'string' } },
              simplificationScore: { type: 'number' }
            }
          }
        },
        optimalFrame: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            simplificationScore: { type: 'number' },
            rationale: { type: 'string' }
          }
        },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'frame-of-reference', 'physics', 'simplification']
}));

// Task 5: Equation Derivation
export const equationDerivationTask = defineTask('equation-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive equations in optimal frame',
  agent: {
    name: 'equation-deriver',
    prompt: {
      role: 'theoretical physicist deriving equations of motion',
      task: 'Derive the simplified equations of motion in the optimal reference frame',
      context: args,
      instructions: [
        'Apply transformation to express problem in optimal frame',
        'Derive equations of motion in the new frame',
        'Simplify using frame-specific simplifications',
        'Express conservation laws in the new frame',
        'Derive first integrals if possible',
        'Compare complexity to original formulation',
        'Document any approximations used',
        'Express boundary conditions in new frame',
        'Check dimensional consistency',
        'Save simplified equations to output directory'
      ],
      outputFormat: 'JSON with simplifiedEquations (array with equation, type, complexity), firstIntegrals, simplificationLevel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['simplifiedEquations', 'simplificationLevel', 'artifacts'],
      properties: {
        simplifiedEquations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              equation: { type: 'string' },
              type: { type: 'string' },
              variables: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'number' }
            }
          }
        },
        firstIntegrals: { type: 'array', items: { type: 'string' } },
        simplificationLevel: { type: 'string' },
        comparisonWithOriginal: { type: 'object' },
        boundaryConditionsTransformed: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'frame-of-reference', 'physics', 'equations']
}));

// Task 6: Invariant Identification
export const invariantIdentificationTask = defineTask('invariant-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify frame-invariant quantities',
  agent: {
    name: 'invariant-identifier',
    prompt: {
      role: 'physicist identifying physical invariants',
      task: 'Identify quantities that are invariant under frame transformations',
      context: args,
      instructions: [
        'Identify scalar quantities invariant under frame change',
        'For relativistic: identify Lorentz scalars',
        'Identify proper time and proper length',
        'Identify invariant mass (rest mass)',
        'Identify action as invariant',
        'Check which combinations of variables are invariant',
        'Note invariance under specific transformation types',
        'Document physical significance of invariants',
        'Relate invariants to conserved quantities',
        'Save invariants to output directory'
      ],
      outputFormat: 'JSON with invariants (array with name, expression, significance, transformationType), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['invariants', 'artifacts'],
      properties: {
        invariants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              expression: { type: 'string' },
              physicalSignificance: { type: 'string' },
              invariantUnder: { type: 'array', items: { type: 'string' } },
              relatedConservation: { type: 'string' }
            }
          }
        },
        lorentzScalars: { type: 'array' },
        galileanInvariants: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'frame-of-reference', 'physics', 'invariants']
}));

// Task 7: Insight Extraction
export const insightExtractionTask = defineTask('insight-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract physical insights from frame choice',
  agent: {
    name: 'insight-extractor',
    prompt: {
      role: 'senior physicist extracting physical understanding',
      task: 'Extract physical insights gained from the reference frame analysis',
      context: args,
      instructions: [
        'What does the optimal frame reveal about the physics?',
        'What simplifications are fundamentally physical vs mathematical convenience?',
        'What symmetries are made manifest?',
        'What is the essential structure of the problem?',
        'What quantities are truly fundamental (frame-independent)?',
        'What fictitious effects disappear in the right frame?',
        'What connections between phenomena become apparent?',
        'What intuition is gained from the frame choice?',
        'Note surprising or non-obvious insights',
        'Save insights to output directory'
      ],
      outputFormat: 'JSON with insights (array with insight, basis, significance), fundamentalStructure, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              basis: { type: 'string' },
              significance: { type: 'string' },
              novelty: { type: 'string' }
            }
          }
        },
        fundamentalStructure: { type: 'string' },
        manifestSymmetries: { type: 'array', items: { type: 'string' } },
        physicalVsMathematical: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'frame-of-reference', 'physics', 'insights']
}));
