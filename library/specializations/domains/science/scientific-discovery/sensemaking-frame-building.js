/**
 * @process specializations/domains/science/scientific-discovery/sensemaking-frame-building
 * @description Sensemaking and Frame Building - Systematically determine "what kind of situation is this?"
 * by constructing interpretive frames, identifying relevant schemas, and building coherent mental models
 * that enable understanding and action in novel, ambiguous, or complex scientific discovery situations.
 * @inputs { situation: object, cues: object[], context?: object, goals?: string[], priorFrames?: object[] }
 * @outputs { success: boolean, frames: object[], selectedFrame: object, sensemaking: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/sensemaking-frame-building', {
 *   situation: { description: 'Unexpected experimental results contradicting established theory', domain: 'particle physics' },
 *   cues: [{ cue: 'Consistent replication across labs', salience: 'high' }, { cue: 'No known systematic errors', salience: 'high' }],
 *   goals: ['Determine if results are valid', 'Decide on next experimental steps']
 * });
 *
 * @references
 * - Sensemaking: https://www.sciencedirect.com/topics/social-sciences/sensemaking
 * - Framing Theory: https://plato.stanford.edu/entries/frame-theory/
 * - Mental Models: https://plato.stanford.edu/entries/mental-representation/
 * - Weick's Sensemaking: https://www.jstor.org/stable/2393553
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    situation,
    cues,
    context = {},
    goals = [],
    priorFrames = []
  } = inputs;

  // Phase 1: Situation Description and Cue Extraction
  const situationAnalysis = await ctx.task(situationAnalysisTask, {
    situation,
    cues,
    context
  });

  // Quality Gate: Must have sufficient cues
  if (!situationAnalysis.extractedCues || situationAnalysis.extractedCues.length === 0) {
    return {
      success: false,
      error: 'Insufficient cues for sensemaking',
      phase: 'situation-analysis',
      frames: null
    };
  }

  // Phase 2: Frame Retrieval and Activation
  const frameRetrieval = await ctx.task(frameRetrievalTask, {
    situationAnalysis,
    priorFrames,
    context
  });

  // Phase 3: Frame Fit Assessment
  const frameFitAssessment = await ctx.task(frameFitAssessmentTask, {
    frames: frameRetrieval.activatedFrames,
    cues: situationAnalysis.extractedCues,
    situation
  });

  // Phase 4: Anomaly and Gap Identification
  const anomalyIdentification = await ctx.task(anomalyIdentificationTask, {
    frames: frameFitAssessment.assessedFrames,
    cues: situationAnalysis.extractedCues,
    situation
  });

  // Breakpoint: Review initial sensemaking
  await ctx.breakpoint({
    question: `Review initial sensemaking for situation. ${frameRetrieval.activatedFrames?.length || 0} frames retrieved, ${anomalyIdentification.anomalies?.length || 0} anomalies detected. Continue?`,
    title: 'Sensemaking Progress Review',
    context: {
      runId: ctx.runId,
      situationDescription: situation.description,
      frameCount: frameRetrieval.activatedFrames?.length || 0,
      anomalyCount: anomalyIdentification.anomalies?.length || 0,
      files: [{
        path: 'artifacts/initial-sensemaking.json',
        format: 'json',
        content: { situationAnalysis, frameRetrieval, frameFitAssessment, anomalyIdentification }
      }]
    }
  });

  // Phase 5: Frame Construction and Modification
  const frameConstruction = await ctx.task(frameConstructionTask, {
    existingFrames: frameFitAssessment.assessedFrames,
    anomalies: anomalyIdentification.anomalies,
    cues: situationAnalysis.extractedCues,
    situation,
    goals
  });

  // Phase 6: Plausibility Assessment
  const plausibilityAssessment = await ctx.task(plausibilityAssessmentTask, {
    frames: frameConstruction.frames,
    cues: situationAnalysis.extractedCues,
    situation,
    context
  });

  // Phase 7: Action Implications Analysis
  const actionImplications = await ctx.task(actionImplicationsTask, {
    frames: plausibilityAssessment.assessedFrames,
    goals,
    situation
  });

  // Phase 8: Frame Selection and Commitment
  const frameSelection = await ctx.task(frameSelectionTask, {
    frames: plausibilityAssessment.assessedFrames,
    actionImplications,
    goals,
    situation
  });

  // Phase 9: Sensemaking Validation
  const sensemakingValidation = await ctx.task(sensemakingValidationTask, {
    selectedFrame: frameSelection.selectedFrame,
    cues: situationAnalysis.extractedCues,
    situation,
    anomalies: anomalyIdentification.anomalies
  });

  // Phase 10: Sensemaking Synthesis
  const sensemakingSynthesis = await ctx.task(sensemakingSynthesisTask, {
    situation,
    situationAnalysis,
    frames: plausibilityAssessment.assessedFrames,
    selectedFrame: frameSelection.selectedFrame,
    actionImplications,
    validation: sensemakingValidation,
    goals,
    context
  });

  // Final Breakpoint: Sensemaking Approval
  await ctx.breakpoint({
    question: `Sensemaking complete. Selected frame: "${frameSelection.selectedFrame?.name}". Confidence: ${frameSelection.confidence}. Approve frame?`,
    title: 'Sensemaking Approval',
    context: {
      runId: ctx.runId,
      situationDescription: situation.description,
      selectedFrame: frameSelection.selectedFrame?.name,
      confidence: frameSelection.confidence,
      files: [
        { path: 'artifacts/sensemaking-report.json', format: 'json', content: sensemakingSynthesis },
        { path: 'artifacts/sensemaking-report.md', format: 'markdown', content: sensemakingSynthesis.markdown }
      ]
    }
  });

  return {
    success: true,
    situation,
    frames: plausibilityAssessment.assessedFrames,
    selectedFrame: frameSelection.selectedFrame,
    sensemaking: {
      cues: situationAnalysis.extractedCues,
      anomalies: anomalyIdentification.anomalies,
      plausibility: plausibilityAssessment,
      actionImplications: actionImplications.implications,
      validation: sensemakingValidation
    },
    recommendations: sensemakingSynthesis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/sensemaking-frame-building',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const situationAnalysisTask = defineTask('situation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Situation Description and Cue Extraction',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Sensemaking Analyst specializing in situation assessment',
      task: 'Analyze situation and extract relevant cues',
      context: {
        situation: args.situation,
        cues: args.cues,
        context: args.context
      },
      instructions: [
        '1. Characterize the situation type and domain',
        '2. Extract all salient cues from the situation',
        '3. Identify implicit cues not explicitly stated',
        '4. Assess reliability and confidence in each cue',
        '5. Identify what is known vs unknown',
        '6. Characterize novelty and ambiguity level',
        '7. Identify time pressure and decision urgency',
        '8. Note what makes this situation puzzling',
        '9. Identify stakeholders and their perspectives',
        '10. Document situation complexity factors'
      ],
      outputFormat: 'JSON object with situation analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['extractedCues', 'situationCharacterization'],
      properties: {
        situationCharacterization: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            domain: { type: 'string' },
            novelty: { type: 'string', enum: ['routine', 'familiar', 'novel', 'unprecedented'] },
            ambiguity: { type: 'string', enum: ['high', 'medium', 'low'] },
            urgency: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
          }
        },
        extractedCues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cue: { type: 'string' },
              salience: { type: 'string', enum: ['high', 'medium', 'low'] },
              reliability: { type: 'string', enum: ['certain', 'probable', 'uncertain'] },
              source: { type: 'string' }
            }
          }
        },
        implicitCues: { type: 'array', items: { type: 'object' } },
        unknowns: { type: 'array', items: { type: 'string' } },
        puzzlingElements: { type: 'array', items: { type: 'string' } },
        complexityFactors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'situation-analysis', 'cue-extraction']
}));

export const frameRetrievalTask = defineTask('frame-retrieval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Frame Retrieval and Activation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Frame Retrieval Expert',
      task: 'Retrieve and activate potentially relevant frames',
      context: {
        situationAnalysis: args.situationAnalysis,
        priorFrames: args.priorFrames,
        context: args.context
      },
      instructions: [
        '1. Identify frames that might apply to this situation type',
        '2. Retrieve frames from domain knowledge',
        '3. Activate frames based on cue matches',
        '4. Include frames from prior experience',
        '5. Identify analogous situations and their frames',
        '6. Include both common and rare frames',
        '7. Identify competing/alternative frames',
        '8. Note default frames and their assumptions',
        '9. Identify specialized expert frames',
        '10. Document activated frame set'
      ],
      outputFormat: 'JSON object with activated frames'
    },
    outputSchema: {
      type: 'object',
      required: ['activatedFrames'],
      properties: {
        activatedFrames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              source: { type: 'string', enum: ['domain', 'experience', 'analogy', 'expert', 'default'] },
              triggeringCues: { type: 'array', items: { type: 'string' } },
              assumptions: { type: 'array', items: { type: 'string' } },
              expectations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        frameConflicts: { type: 'array', items: { type: 'object' } },
        defaultFrame: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'frame-retrieval', 'activation']
}));

export const frameFitAssessmentTask = defineTask('frame-fit-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Frame Fit Assessment',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Frame Fit Assessor',
      task: 'Assess how well each frame fits the situation',
      context: {
        frames: args.frames,
        cues: args.cues,
        situation: args.situation
      },
      instructions: [
        '1. Check each frame against available cues',
        '2. Identify cues explained by each frame',
        '3. Identify cues unexplained by each frame',
        '4. Identify cues that contradict each frame',
        '5. Assess overall fit score for each frame',
        '6. Check frame assumptions against situation',
        '7. Check frame expectations against observations',
        '8. Identify what each frame would predict',
        '9. Note frames that are partially fitting',
        '10. Rank frames by fit quality'
      ],
      outputFormat: 'JSON object with frame fit assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedFrames'],
      properties: {
        assessedFrames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frameId: { type: 'string' },
              explainedCues: { type: 'array', items: { type: 'string' } },
              unexplainedCues: { type: 'array', items: { type: 'string' } },
              contradictoryCues: { type: 'array', items: { type: 'string' } },
              fitScore: { type: 'number', minimum: 0, maximum: 100 },
              assumptionsFit: { type: 'boolean' },
              predictions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        frameRanking: { type: 'array', items: { type: 'string' } },
        partiallyFitting: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'frame-fit', 'assessment']
}));

export const anomalyIdentificationTask = defineTask('anomaly-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Anomaly and Gap Identification',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Anomaly Detection Expert',
      task: 'Identify anomalies and gaps in frame coverage',
      context: {
        frames: args.frames,
        cues: args.cues,
        situation: args.situation
      },
      instructions: [
        '1. Identify cues that no frame explains well',
        '2. Identify expectations violated across all frames',
        '3. Detect surprising elements that challenge frames',
        '4. Identify information gaps critical for sensemaking',
        '5. Note where frames disagree about interpretation',
        '6. Identify potentially misleading cues',
        '7. Detect weak signals that may be important',
        '8. Identify what would change frame selection',
        '9. Note persistent puzzles requiring explanation',
        '10. Document anomalies requiring attention'
      ],
      outputFormat: 'JSON object with anomalies and gaps'
    },
    outputSchema: {
      type: 'object',
      required: ['anomalies'],
      properties: {
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              anomaly: { type: 'string' },
              type: { type: 'string', enum: ['unexplained', 'violated-expectation', 'surprise', 'contradiction', 'weak-signal'] },
              significance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              affectedFrames: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        informationGaps: { type: 'array', items: { type: 'object' } },
        frameDisagreements: { type: 'array', items: { type: 'object' } },
        misleadingCues: { type: 'array', items: { type: 'string' } },
        persistentPuzzles: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'anomaly-detection', 'gaps']
}));

export const frameConstructionTask = defineTask('frame-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Frame Construction and Modification',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Frame Construction Expert',
      task: 'Construct new frames or modify existing ones to fit better',
      context: {
        existingFrames: args.existingFrames,
        anomalies: args.anomalies,
        cues: args.cues,
        situation: args.situation,
        goals: args.goals
      },
      instructions: [
        '1. Modify existing frames to accommodate anomalies',
        '2. Construct new frames that explain unexplained cues',
        '3. Combine elements from multiple frames',
        '4. Develop frames at different levels of abstraction',
        '5. Create conditional frames for uncertain situations',
        '6. Develop frames that support action toward goals',
        '7. Build minimal frames that explain core features',
        '8. Develop elaborated frames with rich structure',
        '9. Ensure constructed frames are coherent',
        '10. Document frame construction rationale'
      ],
      outputFormat: 'JSON object with constructed frames'
    },
    outputSchema: {
      type: 'object',
      required: ['frames'],
      properties: {
        frames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string', enum: ['modified', 'new', 'combined', 'conditional'] },
              description: { type: 'string' },
              coreElements: { type: 'array', items: { type: 'string' } },
              addressedAnomalies: { type: 'array', items: { type: 'string' } },
              assumptions: { type: 'array', items: { type: 'string' } },
              expectations: { type: 'array', items: { type: 'string' } },
              actionImplications: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        constructionRationale: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'frame-construction', 'modification']
}));

export const plausibilityAssessmentTask = defineTask('plausibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Plausibility Assessment',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Plausibility Assessor',
      task: 'Assess plausibility of each frame',
      context: {
        frames: args.frames,
        cues: args.cues,
        situation: args.situation,
        context: args.context
      },
      instructions: [
        '1. Assess coherence of each frame',
        '2. Check consistency with background knowledge',
        '3. Assess how well frame accounts for cues',
        '4. Evaluate frame assumptions for plausibility',
        '5. Check frame for internal contradictions',
        '6. Assess frame parsimony',
        '7. Evaluate frame predictive power',
        '8. Check frame against expert knowledge',
        '9. Assign plausibility scores',
        '10. Identify most and least plausible frames'
      ],
      outputFormat: 'JSON object with plausibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['assessedFrames'],
      properties: {
        assessedFrames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frameId: { type: 'string' },
              coherence: { type: 'string', enum: ['coherent', 'mostly-coherent', 'problematic'] },
              backgroundConsistency: { type: 'boolean' },
              cueAccountability: { type: 'number', minimum: 0, maximum: 100 },
              assumptionPlausibility: { type: 'string', enum: ['plausible', 'questionable', 'implausible'] },
              parsimony: { type: 'string', enum: ['parsimonious', 'moderate', 'complex'] },
              predictivePower: { type: 'string', enum: ['high', 'medium', 'low'] },
              plausibilityScore: { type: 'number', minimum: 0, maximum: 100 }
            }
          }
        },
        mostPlausible: { type: 'array', items: { type: 'string' } },
        leastPlausible: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'plausibility', 'assessment']
}));

export const actionImplicationsTask = defineTask('action-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Action Implications Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Action Implications Analyst',
      task: 'Analyze action implications of each frame',
      context: {
        frames: args.frames,
        goals: args.goals,
        situation: args.situation
      },
      instructions: [
        '1. Identify actions each frame suggests',
        '2. Assess how frames align with goals',
        '3. Identify risks of acting on each frame',
        '4. Assess urgency of action under each frame',
        '5. Identify information to seek under each frame',
        '6. Assess reversibility of actions implied',
        '7. Identify what success looks like under each frame',
        '8. Assess consequences of wrong frame choice',
        '9. Identify robust actions across frames',
        '10. Document action implications'
      ],
      outputFormat: 'JSON object with action implications'
    },
    outputSchema: {
      type: 'object',
      required: ['implications'],
      properties: {
        implications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frameId: { type: 'string' },
              suggestedActions: { type: 'array', items: { type: 'string' } },
              goalAlignment: { type: 'string', enum: ['aligned', 'partially-aligned', 'misaligned'] },
              risks: { type: 'array', items: { type: 'string' } },
              urgency: { type: 'string', enum: ['immediate', 'soon', 'can-wait'] },
              informationNeeds: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        robustActions: { type: 'array', items: { type: 'string' } },
        wrongFrameConsequences: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'action-implications', 'decision']
}));

export const frameSelectionTask = defineTask('frame-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Frame Selection and Commitment',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Frame Selection Expert',
      task: 'Select best frame and determine commitment level',
      context: {
        frames: args.frames,
        actionImplications: args.actionImplications,
        goals: args.goals,
        situation: args.situation
      },
      instructions: [
        '1. Compare frames on fit, plausibility, and action value',
        '2. Select primary frame with justification',
        '3. Identify backup frames if primary fails',
        '4. Determine appropriate commitment level',
        '5. Identify conditions that would change selection',
        '6. Assess confidence in selection',
        '7. Plan for frame updating with new information',
        '8. Identify tests to validate frame choice',
        '9. Document selection rationale',
        '10. Articulate frame in actionable terms'
      ],
      outputFormat: 'JSON object with frame selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedFrame', 'confidence'],
      properties: {
        selectedFrame: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            coreInterpretation: { type: 'string' },
            actionGuidance: { type: 'array', items: { type: 'string' } }
          }
        },
        backupFrames: { type: 'array', items: { type: 'object' } },
        commitmentLevel: { type: 'string', enum: ['high', 'moderate', 'tentative', 'exploratory'] },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        changeConditions: { type: 'array', items: { type: 'string' } },
        validationTests: { type: 'array', items: { type: 'string' } },
        selectionRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'frame-selection', 'commitment']
}));

export const sensemakingValidationTask = defineTask('sensemaking-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Sensemaking Validation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Sensemaking Validator',
      task: 'Validate the sensemaking process and outcome',
      context: {
        selectedFrame: args.selectedFrame,
        cues: args.cues,
        situation: args.situation,
        anomalies: args.anomalies
      },
      instructions: [
        '1. Verify selected frame accounts for key cues',
        '2. Check that anomalies are addressed',
        '3. Validate assumptions are reasonable',
        '4. Check for premature closure',
        '5. Verify biases have been considered',
        '6. Check that alternatives were fairly evaluated',
        '7. Validate action implications are appropriate',
        '8. Assess overall sensemaking quality',
        '9. Identify remaining uncertainties',
        '10. Document validation findings'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResult'],
      properties: {
        validationResult: {
          type: 'object',
          properties: {
            cuesCovered: { type: 'boolean' },
            anomaliesAddressed: { type: 'boolean' },
            assumptionsReasonable: { type: 'boolean' },
            noPremareClosure: { type: 'boolean' },
            biasesConsidered: { type: 'boolean' },
            alternativesFairlyEvaluated: { type: 'boolean' },
            actionsAppropriate: { type: 'boolean' },
            overallQuality: { type: 'string', enum: ['high', 'adequate', 'questionable'] }
          }
        },
        remainingUncertainties: { type: 'array', items: { type: 'string' } },
        validationConcerns: { type: 'array', items: { type: 'string' } },
        recommendedImprovements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'validation', 'quality-check']
}));

export const sensemakingSynthesisTask = defineTask('sensemaking-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Sensemaking Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'sensemaking-analyst',
    skills: ['hypothesis-generator', 'analogy-mapper'],
    prompt: {
      role: 'Sensemaking Synthesist',
      task: 'Synthesize sensemaking into actionable understanding',
      context: {
        situation: args.situation,
        situationAnalysis: args.situationAnalysis,
        frames: args.frames,
        selectedFrame: args.selectedFrame,
        actionImplications: args.actionImplications,
        validation: args.validation,
        goals: args.goals,
        context: args.context
      },
      instructions: [
        '1. Synthesize situation understanding',
        '2. Articulate what the situation IS',
        '3. Clarify what it means for goals',
        '4. Provide clear action guidance',
        '5. Highlight key uncertainties to monitor',
        '6. Provide decision recommendations',
        '7. Identify what to watch for',
        '8. Summarize sensemaking journey',
        '9. Provide confidence-calibrated conclusions',
        '10. Generate comprehensive markdown report'
      ],
      outputFormat: 'JSON object with sensemaking synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['understanding', 'recommendations', 'markdown'],
      properties: {
        understanding: {
          type: 'object',
          properties: {
            situationIs: { type: 'string' },
            implicationsForGoals: { type: 'string' },
            keyInsights: { type: 'array', items: { type: 'string' } }
          }
        },
        actionGuidance: { type: 'array', items: { type: 'object' } },
        monitoringPriorities: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] }
            }
          }
        },
        watchList: { type: 'array', items: { type: 'string' } },
        sensemakingJourney: { type: 'string' },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sensemaking', 'synthesis', 'understanding']
}));
