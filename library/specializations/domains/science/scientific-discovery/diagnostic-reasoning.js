/**
 * @process specializations/domains/science/scientific-discovery/diagnostic-reasoning
 * @description Diagnostic Reasoning Process - Infer hidden causes from observable symptoms
 * using fault models, Bayesian diagnosis, and abductive reasoning for root cause analysis.
 * @inputs { domain: string, symptoms: object[], systemModel?: object, faultLibrary?: object[], priorProbabilities?: object }
 * @outputs { success: boolean, diagnosis: object, differentialDiagnosis: object[], rootCause: object, recommendations: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/diagnostic-reasoning', {
 *   domain: 'Industrial Systems',
 *   symptoms: [{ name: 'increased_temperature', value: 85, unit: 'C' }, { name: 'vibration', severity: 'high' }],
 *   systemModel: { components: ['motor', 'bearing', 'pump'], connections: [...] },
 *   faultLibrary: [{ name: 'bearing_failure', symptoms: ['vibration', 'temperature'] }]
 * });
 *
 * @references
 * - Reiter (1987). A Theory of Diagnosis from First Principles
 * - de Kleer & Williams (1987). Diagnosing Multiple Faults
 * - Peng & Reggia (1990). Abductive Inference Models for Diagnostic Problem-Solving
 * - Lucas (2001). Bayesian Diagnosis in Medicine
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    symptoms,
    systemModel = null,
    faultLibrary = [],
    priorProbabilities = {}
  } = inputs;

  // Phase 1: Symptom Analysis
  const symptomAnalysis = await ctx.task(symptomAnalysisTask, {
    domain,
    symptoms,
    systemModel
  });

  // Phase 2: Fault Model Construction
  const faultModel = await ctx.task(faultModelConstructionTask, {
    domain,
    symptomAnalysis,
    systemModel,
    faultLibrary
  });

  // Phase 3: Candidate Generation
  const candidateGeneration = await ctx.task(candidateGenerationTask, {
    symptomAnalysis,
    faultModel,
    priorProbabilities
  });

  // Quality Gate: Must have diagnostic candidates
  if (!candidateGeneration.candidates || candidateGeneration.candidates.length === 0) {
    return {
      success: false,
      error: 'No diagnostic candidates identified',
      phase: 'candidate-generation',
      diagnosis: null
    };
  }

  // Phase 4: Consistency-Based Diagnosis
  const consistencyDiagnosis = await ctx.task(consistencyBasedDiagnosisTask, {
    candidates: candidateGeneration.candidates,
    symptomAnalysis,
    faultModel,
    systemModel
  });

  // Phase 5: Abductive Diagnosis
  const abductiveDiagnosis = await ctx.task(abductiveDiagnosisTask, {
    candidates: candidateGeneration.candidates,
    symptomAnalysis,
    faultModel
  });

  // Phase 6: Bayesian Diagnosis
  const bayesianDiagnosis = await ctx.task(bayesianDiagnosisTask, {
    candidates: candidateGeneration.candidates,
    symptomAnalysis,
    faultModel,
    priorProbabilities
  });

  // Phase 7: Diagnosis Integration
  const integratedDiagnosis = await ctx.task(diagnosisIntegrationTask, {
    consistencyDiagnosis,
    abductiveDiagnosis,
    bayesianDiagnosis,
    candidates: candidateGeneration.candidates
  });

  // Phase 8: Root Cause Analysis
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    integratedDiagnosis,
    faultModel,
    systemModel,
    symptomAnalysis
  });

  // Phase 9: Discriminating Tests
  const discriminatingTests = await ctx.task(discriminatingTestsTask, {
    integratedDiagnosis,
    faultModel,
    domain
  });

  // Breakpoint: Review differential diagnosis
  await ctx.breakpoint({
    question: `Diagnostic analysis complete. Top diagnosis: ${integratedDiagnosis.primaryDiagnosis.name} (${integratedDiagnosis.primaryDiagnosis.confidence}% confidence). Review differential diagnosis?`,
    title: 'Diagnostic Review',
    context: {
      runId: ctx.runId,
      domain,
      symptoms: symptoms.map(s => s.name),
      differentialDiagnosis: integratedDiagnosis.differentialDiagnosis.slice(0, 5)
    }
  });

  // Phase 10: Treatment/Intervention Recommendations
  const recommendations = await ctx.task(recommendationsTask, {
    integratedDiagnosis,
    rootCauseAnalysis,
    domain,
    systemModel
  });

  // Phase 11: Validation
  const validation = await ctx.task(diagnosticValidationTask, {
    integratedDiagnosis,
    symptomAnalysis,
    recommendations,
    domain
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Diagnostic process complete. Root cause: ${rootCauseAnalysis.rootCause}. Confidence: ${validation.overallConfidence}. Accept diagnosis and recommendations?`,
    title: 'Final Diagnostic Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/diagnosis.json', format: 'json', content: integratedDiagnosis },
        { path: 'artifacts/recommendations.json', format: 'json', content: recommendations }
      ]
    }
  });

  return {
    success: true,
    domain,
    symptoms: symptomAnalysis.processedSymptoms,
    diagnosis: {
      primary: integratedDiagnosis.primaryDiagnosis,
      confidence: integratedDiagnosis.primaryDiagnosis.confidence,
      methodology: integratedDiagnosis.methodology
    },
    differentialDiagnosis: integratedDiagnosis.differentialDiagnosis,
    rootCause: {
      cause: rootCauseAnalysis.rootCause,
      causalChain: rootCauseAnalysis.causalChain,
      confidence: rootCauseAnalysis.confidence
    },
    discriminatingTests: discriminatingTests.recommendedTests,
    recommendations: recommendations.actions,
    validation: validation,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/diagnostic-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const symptomAnalysisTask = defineTask('symptom-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Symptom Analysis - ${args.domain}`,
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in diagnostic symptom analysis and medical/technical semiotics',
      task: 'Analyze and characterize the observed symptoms',
      context: {
        domain: args.domain,
        symptoms: args.symptoms,
        systemModel: args.systemModel
      },
      instructions: [
        '1. Process and normalize all symptom descriptions',
        '2. Categorize symptoms by type (primary, secondary, incidental)',
        '3. Assess symptom severity and urgency',
        '4. Identify symptom clusters and patterns',
        '5. Determine temporal relationships between symptoms',
        '6. Identify pathognomonic (definitive) symptoms if any',
        '7. Distinguish symptoms from signs (observed vs reported)',
        '8. Assess reliability of symptom reports',
        '9. Identify missing information that would aid diagnosis',
        '10. Create symptom profile summary'
      ],
      outputFormat: 'JSON object with symptom analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['processedSymptoms', 'symptomClusters'],
      properties: {
        processedSymptoms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'any' },
              category: { type: 'string', enum: ['primary', 'secondary', 'incidental'] },
              severity: { type: 'string', enum: ['critical', 'severe', 'moderate', 'mild'] },
              reliability: { type: 'number' },
              temporalInfo: { type: 'string' }
            }
          }
        },
        symptomClusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              clusterName: { type: 'string' },
              symptoms: { type: 'array', items: { type: 'string' } },
              suggestiveFaults: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        pathognomonicSymptoms: {
          type: 'array',
          items: { type: 'string' }
        },
        temporalPattern: { type: 'string' },
        missingInformation: {
          type: 'array',
          items: { type: 'string' }
        },
        urgencyLevel: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low']
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'symptoms', 'analysis']
}));

export const faultModelConstructionTask = defineTask('fault-model-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fault Model Construction',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in fault modeling and failure mode analysis',
      task: 'Construct or extend fault model for diagnostic reasoning',
      context: {
        domain: args.domain,
        symptomAnalysis: args.symptomAnalysis,
        systemModel: args.systemModel,
        faultLibrary: args.faultLibrary
      },
      instructions: [
        '1. Identify all potential faults relevant to observed symptoms',
        '2. Build symptom-fault association matrix',
        '3. Characterize fault-symptom relationships (causal, correlational)',
        '4. Model fault interactions (single vs multiple faults)',
        '5. Define fault severities and progressions',
        '6. Model system dependencies and fault propagation',
        '7. Incorporate prior fault frequencies',
        '8. Define fault preconditions and contexts',
        '9. Model temporal aspects of faults',
        '10. Document model assumptions and limitations'
      ],
      outputFormat: 'JSON object with fault model'
    },
    outputSchema: {
      type: 'object',
      required: ['faults', 'symptomFaultMatrix'],
      properties: {
        faults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'moderate', 'minor'] },
              frequency: { type: 'string', enum: ['common', 'occasional', 'rare'] },
              symptoms: { type: 'array', items: { type: 'string' } },
              preconditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        symptomFaultMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symptom: { type: 'string' },
              fault: { type: 'string' },
              probability: { type: 'number' },
              relationship: { type: 'string', enum: ['causal', 'correlational', 'diagnostic'] }
            }
          }
        },
        faultInteractions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              faults: { type: 'array', items: { type: 'string' } },
              interactionType: { type: 'string' },
              effect: { type: 'string' }
            }
          }
        },
        faultPropagation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceFault: { type: 'string' },
              derivedFault: { type: 'string' },
              probability: { type: 'number' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'fault-model', 'fmea']
}));

export const candidateGenerationTask = defineTask('candidate-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnostic Candidate Generation',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in diagnostic hypothesis generation',
      task: 'Generate candidate diagnoses that could explain observed symptoms',
      context: {
        symptomAnalysis: args.symptomAnalysis,
        faultModel: args.faultModel,
        priorProbabilities: args.priorProbabilities
      },
      instructions: [
        '1. Generate single-fault candidates that explain symptoms',
        '2. Generate minimal multiple-fault candidates if needed',
        '3. Apply parsimony (prefer simpler explanations)',
        '4. Consider fault likelihoods based on priors',
        '5. Filter candidates by coverage (symptoms explained)',
        '6. Consider specificity (symptoms not explained)',
        '7. Rank candidates by initial plausibility',
        '8. Consider both common and rare diagnoses',
        '9. Include "zebra" diagnoses for completeness',
        '10. Document reasoning for each candidate'
      ],
      outputFormat: 'JSON object with diagnostic candidates'
    },
    outputSchema: {
      type: 'object',
      required: ['candidates'],
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              faults: { type: 'array', items: { type: 'string' } },
              symptomsExplained: { type: 'array', items: { type: 'string' } },
              symptomsUnexplained: { type: 'array', items: { type: 'string' } },
              coverage: { type: 'number' },
              priorProbability: { type: 'number' },
              parsimonyScore: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        singleFaultCandidates: { type: 'number' },
        multipleFaultCandidates: { type: 'number' },
        generationMethod: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'candidates', 'hypothesis-generation']
}));

export const consistencyBasedDiagnosisTask = defineTask('consistency-based-diagnosis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consistency-Based Diagnosis',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in consistency-based diagnosis and model-based reasoning',
      task: 'Perform consistency-based diagnostic reasoning (Reiter approach)',
      context: {
        candidates: args.candidates,
        symptomAnalysis: args.symptomAnalysis,
        faultModel: args.faultModel,
        systemModel: args.systemModel
      },
      instructions: [
        '1. For each candidate, check consistency with system model',
        '2. Verify predicted symptoms match observed symptoms',
        '3. Verify no contradictions between fault and observations',
        '4. Compute minimal diagnoses (no proper subset is a diagnosis)',
        '5. Identify kernel diagnoses',
        '6. Check consistency with temporal constraints',
        '7. Eliminate inconsistent candidates',
        '8. Rank remaining by consistency strength',
        '9. Identify diagnoses with conflicts',
        '10. Document consistency analysis results'
      ],
      outputFormat: 'JSON object with consistency-based diagnosis'
    },
    outputSchema: {
      type: 'object',
      required: ['consistentDiagnoses', 'minimalDiagnoses'],
      properties: {
        consistentDiagnoses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              candidate: { type: 'string' },
              isConsistent: { type: 'boolean' },
              consistencyScore: { type: 'number' },
              conflicts: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        minimalDiagnoses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              diagnosis: { type: 'string' },
              faults: { type: 'array', items: { type: 'string' } },
              isMinimal: { type: 'boolean' }
            }
          }
        },
        eliminatedCandidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              candidate: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        kernelDiagnoses: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'consistency', 'model-based']
}));

export const abductiveDiagnosisTask = defineTask('abductive-diagnosis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Abductive Diagnosis',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in abductive reasoning and inference to best explanation',
      task: 'Perform abductive diagnostic reasoning (Peng-Reggia approach)',
      context: {
        candidates: args.candidates,
        symptomAnalysis: args.symptomAnalysis,
        faultModel: args.faultModel
      },
      instructions: [
        '1. Apply set covering approach to find explanatory diagnoses',
        '2. Evaluate explanatory coverage for each candidate',
        '3. Assess parsimony (prefer fewer faults)',
        '4. Consider causal depth of explanations',
        '5. Evaluate unification power (explaining diverse symptoms)',
        '6. Consider coherence with background knowledge',
        '7. Compute plausibility scores',
        '8. Rank by inference to best explanation criteria',
        '9. Identify most parsimonious explanation',
        '10. Document abductive reasoning chain'
      ],
      outputFormat: 'JSON object with abductive diagnosis'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedDiagnoses', 'bestExplanation'],
      properties: {
        rankedDiagnoses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              candidate: { type: 'string' },
              coverageScore: { type: 'number' },
              parsimonyScore: { type: 'number' },
              coherenceScore: { type: 'number' },
              overallScore: { type: 'number' }
            }
          }
        },
        bestExplanation: {
          type: 'object',
          properties: {
            diagnosis: { type: 'string' },
            explanation: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } }
          }
        },
        setCoveringAnalysis: {
          type: 'object',
          properties: {
            minimalCovers: { type: 'array', items: { type: 'object' } },
            preferredCover: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'abduction', 'set-covering']
}));

export const bayesianDiagnosisTask = defineTask('bayesian-diagnosis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Bayesian Diagnosis',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in Bayesian diagnostic reasoning and probabilistic inference',
      task: 'Perform Bayesian diagnostic reasoning',
      context: {
        candidates: args.candidates,
        symptomAnalysis: args.symptomAnalysis,
        faultModel: args.faultModel,
        priorProbabilities: args.priorProbabilities
      },
      instructions: [
        '1. Specify prior probabilities for each fault',
        '2. Compute likelihood P(symptoms|fault) for each candidate',
        '3. Apply Bayes theorem to compute posteriors',
        '4. Handle multiple symptoms using naive Bayes or proper network',
        '5. Consider conditional dependencies between symptoms',
        '6. Update probabilities sequentially with each symptom',
        '7. Compute posterior odds ratios',
        '8. Assess sensitivity to prior assumptions',
        '9. Identify most probable diagnosis',
        '10. Compute confidence intervals on probabilities'
      ],
      outputFormat: 'JSON object with Bayesian diagnosis'
    },
    outputSchema: {
      type: 'object',
      required: ['posteriorProbabilities', 'mostProbable'],
      properties: {
        posteriorProbabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              candidate: { type: 'string' },
              priorProbability: { type: 'number' },
              likelihood: { type: 'number' },
              posteriorProbability: { type: 'number' },
              oddsRatio: { type: 'number' }
            }
          }
        },
        mostProbable: {
          type: 'object',
          properties: {
            diagnosis: { type: 'string' },
            probability: { type: 'number' },
            confidenceInterval: { type: 'object' }
          }
        },
        likelihoodRatios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symptom: { type: 'string' },
              positiveLR: { type: 'number' },
              negativeLR: { type: 'number' }
            }
          }
        },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            sensitiveParameters: { type: 'array', items: { type: 'string' } },
            robustness: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'bayesian', 'probabilistic']
}));

export const diagnosisIntegrationTask = defineTask('diagnosis-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnosis Integration',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in diagnostic reasoning integration and decision making',
      task: 'Integrate results from multiple diagnostic methods',
      context: {
        consistencyDiagnosis: args.consistencyDiagnosis,
        abductiveDiagnosis: args.abductiveDiagnosis,
        bayesianDiagnosis: args.bayesianDiagnosis,
        candidates: args.candidates
      },
      instructions: [
        '1. Compare rankings from different methods',
        '2. Identify consensus diagnoses (agreed by all methods)',
        '3. Resolve conflicts between methods',
        '4. Weight methods by reliability for domain',
        '5. Compute integrated confidence scores',
        '6. Create differential diagnosis list',
        '7. Identify primary diagnosis',
        '8. Assess diagnostic certainty',
        '9. Flag diagnoses needing further investigation',
        '10. Document integration methodology and rationale'
      ],
      outputFormat: 'JSON object with integrated diagnosis'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryDiagnosis', 'differentialDiagnosis'],
      properties: {
        primaryDiagnosis: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            faults: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number' },
            supportingMethods: { type: 'array', items: { type: 'string' } }
          }
        },
        differentialDiagnosis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              faults: { type: 'array', items: { type: 'string' } },
              confidence: { type: 'number' },
              rank: { type: 'number' }
            }
          }
        },
        methodAgreement: {
          type: 'object',
          properties: {
            agreementLevel: { type: 'string', enum: ['high', 'moderate', 'low'] },
            conflicts: { type: 'array', items: { type: 'string' } }
          }
        },
        methodology: { type: 'string' },
        uncertaintyFlags: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'integration', 'decision']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Root Cause Analysis',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in root cause analysis and causal reasoning',
      task: 'Identify the root cause underlying the diagnosed faults',
      context: {
        integratedDiagnosis: args.integratedDiagnosis,
        faultModel: args.faultModel,
        systemModel: args.systemModel,
        symptomAnalysis: args.symptomAnalysis
      },
      instructions: [
        '1. Distinguish proximate cause from root cause',
        '2. Trace causal chain backwards from diagnosed faults',
        '3. Apply 5 Whys methodology',
        '4. Identify contributing factors',
        '5. Distinguish necessary from sufficient causes',
        '6. Identify systemic vs specific causes',
        '7. Consider multiple independent root causes',
        '8. Assess preventability of root cause',
        '9. Document causal chain with evidence',
        '10. Determine actionable root cause level'
      ],
      outputFormat: 'JSON object with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'causalChain'],
      properties: {
        rootCause: { type: 'string' },
        causalChain: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              cause: { type: 'string' },
              effect: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        contributingFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              contribution: { type: 'string', enum: ['necessary', 'sufficient', 'contributing'] }
            }
          }
        },
        fiveWhysAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              why: { type: 'number' },
              question: { type: 'string' },
              answer: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number' },
        preventability: {
          type: 'string',
          enum: ['preventable', 'partially-preventable', 'not-preventable']
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'root-cause', 'causal-analysis']
}));

export const discriminatingTestsTask = defineTask('discriminating-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discriminating Test Recommendation',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in diagnostic testing and information theory',
      task: 'Recommend tests to discriminate between competing diagnoses',
      context: {
        integratedDiagnosis: args.integratedDiagnosis,
        faultModel: args.faultModel,
        domain: args.domain
      },
      instructions: [
        '1. Identify remaining diagnostic uncertainty',
        '2. Find tests that discriminate between top candidates',
        '3. Calculate expected information gain for each test',
        '4. Consider test costs and risks',
        '5. Consider test availability and turnaround time',
        '6. Prioritize tests by value of information',
        '7. Identify confirmatory tests for primary diagnosis',
        '8. Identify rule-out tests for alternatives',
        '9. Consider test sequences (optimal ordering)',
        '10. Recommend efficient test strategy'
      ],
      outputFormat: 'JSON object with test recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedTests'],
      properties: {
        recommendedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              purpose: { type: 'string', enum: ['confirm', 'rule-out', 'discriminate'] },
              discriminates: { type: 'array', items: { type: 'string' } },
              expectedInformationGain: { type: 'number' },
              cost: { type: 'string' },
              risk: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        testSequence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              test: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        testStrategy: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'testing', 'information-gain']
}));

export const recommendationsTask = defineTask('recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Treatment/Intervention Recommendations',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in treatment planning and intervention design',
      task: 'Generate recommendations based on diagnosis and root cause',
      context: {
        integratedDiagnosis: args.integratedDiagnosis,
        rootCauseAnalysis: args.rootCauseAnalysis,
        domain: args.domain,
        systemModel: args.systemModel
      },
      instructions: [
        '1. Generate treatment/fix recommendations for primary diagnosis',
        '2. Address root cause not just symptoms',
        '3. Prioritize interventions by effectiveness',
        '4. Consider intervention risks and side effects',
        '5. Develop contingency plans for alternative diagnoses',
        '6. Include preventive measures for recurrence',
        '7. Consider resource and time constraints',
        '8. Specify monitoring requirements',
        '9. Define success criteria for interventions',
        '10. Create action plan with timeline'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['actions'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] },
              targetsFault: { type: 'string' },
              expectedOutcome: { type: 'string' },
              risks: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array', items: { type: 'string' } },
              timeline: { type: 'string' }
            }
          }
        },
        contingencyPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ifDiagnosis: { type: 'string' },
              thenAction: { type: 'string' }
            }
          }
        },
        preventiveMeasures: {
          type: 'array',
          items: { type: 'string' }
        },
        monitoringPlan: {
          type: 'object',
          properties: {
            metrics: { type: 'array', items: { type: 'string' } },
            frequency: { type: 'string' },
            successCriteria: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'recommendations', 'treatment']
}));

export const diagnosticValidationTask = defineTask('diagnostic-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnostic Validation',
  agent: {
    name: 'root-cause-analyst',
    skills: ['causal-inference-engine', 'bayesian-inference-engine', 'hypothesis-generator'],
    prompt: {
      role: 'Expert in diagnostic validation and quality assurance',
      task: 'Validate the diagnostic reasoning and conclusions',
      context: {
        integratedDiagnosis: args.integratedDiagnosis,
        symptomAnalysis: args.symptomAnalysis,
        recommendations: args.recommendations,
        domain: args.domain
      },
      instructions: [
        '1. Verify diagnosis explains all key symptoms',
        '2. Check for premature closure (missed diagnoses)',
        '3. Assess for anchoring bias',
        '4. Verify logical consistency of reasoning',
        '5. Check recommendations align with diagnosis',
        '6. Assess overall confidence level',
        '7. Identify remaining uncertainties',
        '8. Document validation findings',
        '9. Flag any red flags or concerns',
        '10. Provide quality score for diagnostic process'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallConfidence', 'validationScore'],
      properties: {
        validationScore: { type: 'number' },
        overallConfidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low', 'very-low']
        },
        symptomsCovered: { type: 'number' },
        symptomsUnexplained: {
          type: 'array',
          items: { type: 'string' }
        },
        biasChecks: {
          type: 'object',
          properties: {
            prematureClosureRisk: { type: 'boolean' },
            anchoringBiasRisk: { type: 'boolean' },
            confirmationBiasRisk: { type: 'boolean' }
          }
        },
        redFlags: {
          type: 'array',
          items: { type: 'string' }
        },
        uncertainties: {
          type: 'array',
          items: { type: 'string' }
        },
        qualityNotes: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['diagnostic-reasoning', 'validation', 'quality']
}));
