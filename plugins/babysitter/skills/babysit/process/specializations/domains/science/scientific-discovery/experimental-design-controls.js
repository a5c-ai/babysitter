/**
 * @process domains/science/scientific-discovery/experimental-design-controls
 * @description Create rigorous experimental protocols with controls, randomization, and blinding -
 * Designs experiments that minimize bias and maximize internal validity through proper control groups,
 * randomization procedures, and blinding protocols.
 * @inputs { hypothesis: object, variables: object, population: object, constraints?: object, blinding?: string }
 * @outputs { success: boolean, protocol: object, randomization: object, blinding: object, controls: object, powerAnalysis: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/experimental-design-controls', {
 *   hypothesis: { statement: 'Drug X reduces blood pressure more than placebo' },
 *   variables: { independent: 'drug_vs_placebo', dependent: 'blood_pressure_mmHg' },
 *   population: { target: 'adults with hypertension', size: 200 },
 *   blinding: 'double-blind'
 * });
 *
 * @references
 * - Fisher, R.A. (1935). The Design of Experiments
 * - Shadish, W.R. et al. (2002). Experimental and Quasi-Experimental Designs
 * - Schulz, K.F. et al. (2010). CONSORT 2010 Statement
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    hypothesis,
    variables,
    population,
    constraints = {},
    blinding = 'double-blind',
    outputDir = 'experimental-design-output',
    minimumQualityScore = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Experimental Design with Controls for: ${hypothesis.statement || 'Study'}`);

  // ============================================================================
  // PHASE 1: DESIGN TYPE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting optimal experimental design type');
  const designSelection = await ctx.task(designTypeSelectionTask, {
    hypothesis,
    variables,
    population,
    constraints,
    outputDir
  });

  artifacts.push(...designSelection.artifacts);

  // ============================================================================
  // PHASE 2: CONTROL GROUP DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing control groups and conditions');
  const controlDesign = await ctx.task(controlGroupDesignTask, {
    hypothesis,
    variables,
    designSelection,
    population,
    outputDir
  });

  artifacts.push(...controlDesign.artifacts);

  // ============================================================================
  // PHASE 3: RANDOMIZATION PROTOCOL
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing randomization protocol');
  const randomizationProtocol = await ctx.task(randomizationProtocolTask, {
    designSelection,
    controlDesign,
    population,
    constraints,
    outputDir
  });

  artifacts.push(...randomizationProtocol.artifacts);

  // Breakpoint: Review randomization approach
  await ctx.breakpoint({
    question: `Randomization protocol: ${randomizationProtocol.method}. Allocation ratio: ${randomizationProtocol.allocationRatio}. Review and approve?`,
    title: 'Randomization Protocol Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        designType: designSelection.designType,
        randomizationMethod: randomizationProtocol.method,
        allocationRatio: randomizationProtocol.allocationRatio,
        stratificationFactors: randomizationProtocol.stratificationFactors?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 4: BLINDING PROTOCOL
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing blinding protocol');
  const blindingProtocol = await ctx.task(blindingProtocolTask, {
    hypothesis,
    variables,
    designSelection,
    blinding,
    constraints,
    outputDir
  });

  artifacts.push(...blindingProtocol.artifacts);

  // ============================================================================
  // PHASE 5: POWER ANALYSIS AND SAMPLE SIZE
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting power analysis');
  const powerAnalysis = await ctx.task(powerAnalysisTask, {
    hypothesis,
    variables,
    designSelection,
    population,
    constraints,
    outputDir
  });

  artifacts.push(...powerAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: PROTOCOL DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Documenting experimental protocol');
  const protocolDocumentation = await ctx.task(protocolDocumentationTask, {
    hypothesis,
    variables,
    designSelection,
    controlDesign,
    randomizationProtocol,
    blindingProtocol,
    powerAnalysis,
    population,
    outputDir
  });

  artifacts.push(...protocolDocumentation.artifacts);

  // ============================================================================
  // PHASE 7: VALIDITY THREAT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing threats to validity');
  const validityAssessment = await ctx.task(validityThreatAssessmentTask, {
    designSelection,
    controlDesign,
    randomizationProtocol,
    blindingProtocol,
    outputDir
  });

  artifacts.push(...validityAssessment.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Scoring experimental design quality');
  const qualityScore = await ctx.task(designQualityScoringTask, {
    designSelection,
    controlDesign,
    randomizationProtocol,
    blindingProtocol,
    powerAnalysis,
    validityAssessment,
    minimumQualityScore,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= minimumQualityScore;

  // Final breakpoint
  await ctx.breakpoint({
    question: `Experimental design complete. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Design meets standards!' : 'Design may need refinement.'} Approve protocol?`,
    title: 'Experimental Design Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        designType: designSelection.designType,
        sampleSize: powerAnalysis.requiredSampleSize,
        power: powerAnalysis.achievablePower,
        qualityScore: qualityScore.overallScore,
        qualityMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    protocol: {
      designType: designSelection.designType,
      methodology: designSelection.methodology,
      procedures: protocolDocumentation.procedures,
      timeline: protocolDocumentation.timeline,
      dataCollection: protocolDocumentation.dataCollection
    },
    randomization: {
      method: randomizationProtocol.method,
      allocationRatio: randomizationProtocol.allocationRatio,
      stratificationFactors: randomizationProtocol.stratificationFactors,
      blockSize: randomizationProtocol.blockSize,
      implementationDetails: randomizationProtocol.implementationDetails
    },
    blinding: {
      type: blindingProtocol.blindingType,
      whoIsBlinded: blindingProtocol.whoIsBlinded,
      unbindingCriteria: blindingProtocol.unbindingCriteria,
      blindingAssessment: blindingProtocol.blindingAssessment
    },
    controls: {
      controlGroups: controlDesign.controlGroups,
      controlConditions: controlDesign.controlConditions,
      matchingCriteria: controlDesign.matchingCriteria,
      placeboDesign: controlDesign.placeboDesign
    },
    powerAnalysis: {
      requiredSampleSize: powerAnalysis.requiredSampleSize,
      achievablePower: powerAnalysis.achievablePower,
      effectSize: powerAnalysis.effectSize,
      alpha: powerAnalysis.alpha,
      dropoutAllowance: powerAnalysis.dropoutAllowance
    },
    validityAssessment: {
      internalThreats: validityAssessment.internalThreats,
      externalThreats: validityAssessment.externalThreats,
      mitigationStrategies: validityAssessment.mitigationStrategies,
      overallValidity: validityAssessment.overallValidity
    },
    qualityScore: {
      overall: qualityScore.overallScore,
      qualityMet,
      componentScores: qualityScore.componentScores,
      recommendations: qualityScore.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/experimental-design-controls',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const designTypeSelectionTask = defineTask('design-type-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select optimal experimental design type',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-design-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Experimental design methodologist',
      task: 'Select the most appropriate experimental design type based on hypothesis, variables, and constraints',
      context: args,
      instructions: [
        'Evaluate suitability of true experimental designs (RCT)',
        'Consider quasi-experimental alternatives if randomization limited',
        'Assess between-subjects vs within-subjects designs',
        'Evaluate factorial designs for multiple IVs',
        'Consider crossover designs for appropriate contexts',
        'Assess matched-pairs designs',
        'Justify design selection with scientific rationale',
        'Document design assumptions and requirements',
        'Identify design limitations',
        'Recommend design modifications if needed'
      ],
      outputFormat: 'JSON with designType, methodology, rationale, assumptions, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['designType', 'methodology', 'rationale', 'artifacts'],
      properties: {
        designType: { type: 'string' },
        methodology: { type: 'string' },
        rationale: { type: 'string' },
        assumptions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        alternativeDesigns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'design-selection']
}));

export const controlGroupDesignTask = defineTask('control-group-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design control groups and conditions',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-design-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Clinical trial designer specializing in control conditions',
      task: 'Design appropriate control groups and control conditions to isolate treatment effects',
      context: args,
      instructions: [
        'Determine number and types of control groups needed',
        'Design placebo control if applicable',
        'Design active control comparator if needed',
        'Design waitlist control if ethical considerations require',
        'Specify matching criteria for control subjects',
        'Define what constitutes treatment as usual',
        'Ensure controls isolate specific intervention effects',
        'Address ethical considerations of control assignment',
        'Document control group procedures',
        'Plan for attention and expectancy controls'
      ],
      outputFormat: 'JSON with controlGroups, controlConditions, matchingCriteria, placeboDesign, ethicalConsiderations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['controlGroups', 'controlConditions', 'artifacts'],
      properties: {
        controlGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              expectedN: { type: 'number' }
            }
          }
        },
        controlConditions: { type: 'array', items: { type: 'string' } },
        matchingCriteria: { type: 'array', items: { type: 'string' } },
        placeboDesign: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            type: { type: 'string' },
            appearance: { type: 'string' }
          }
        },
        ethicalConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'control-groups']
}));

export const randomizationProtocolTask = defineTask('randomization-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop randomization protocol',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-design-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Randomization specialist and biostatistician',
      task: 'Design rigorous randomization protocol to ensure unbiased group allocation',
      context: args,
      instructions: [
        'Select randomization method (simple, blocked, stratified, adaptive)',
        'Determine allocation ratio and justify',
        'Identify stratification factors if using stratified randomization',
        'Determine block sizes for blocked randomization',
        'Design randomization sequence generation method',
        'Plan allocation concealment procedures',
        'Document randomization implementation steps',
        'Plan randomization verification checks',
        'Address special populations or subgroups',
        'Create randomization audit trail procedures'
      ],
      outputFormat: 'JSON with method, allocationRatio, stratificationFactors, blockSize, implementationDetails, concealmentProcedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'allocationRatio', 'implementationDetails', 'artifacts'],
      properties: {
        method: { type: 'string' },
        allocationRatio: { type: 'string' },
        stratificationFactors: { type: 'array', items: { type: 'string' } },
        blockSize: { type: 'string' },
        sequenceGeneration: { type: 'string' },
        implementationDetails: { type: 'string' },
        concealmentProcedures: { type: 'string' },
        verificationChecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'randomization']
}));

export const blindingProtocolTask = defineTask('blinding-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design blinding protocol',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-design-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Clinical trial methodologist specializing in masking procedures',
      task: 'Design comprehensive blinding protocol to prevent bias in assessment',
      context: args,
      instructions: [
        'Determine appropriate blinding level (single, double, triple)',
        'Specify who will be blinded (participants, researchers, assessors, analysts)',
        'Design blinding procedures for each group',
        'Plan matching of treatment and control appearances',
        'Define procedures to maintain blinding throughout study',
        'Specify unblinding criteria for safety',
        'Plan blinding assessment at study end',
        'Address challenges to maintaining blinding',
        'Document emergency unblinding procedures',
        'Plan for sham procedures if needed'
      ],
      outputFormat: 'JSON with blindingType, whoIsBlinded, procedures, unbindingCriteria, blindingAssessment, challenges, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['blindingType', 'whoIsBlinded', 'procedures', 'artifacts'],
      properties: {
        blindingType: { type: 'string' },
        whoIsBlinded: { type: 'array', items: { type: 'string' } },
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              target: { type: 'string' },
              method: { type: 'string' }
            }
          }
        },
        unbindingCriteria: { type: 'array', items: { type: 'string' } },
        emergencyUnblinding: { type: 'string' },
        blindingAssessment: { type: 'string' },
        challenges: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'blinding']
}));

export const powerAnalysisTask = defineTask('power-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct power analysis',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-design-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Biostatistician specializing in sample size calculation',
      task: 'Conduct power analysis to determine required sample size',
      context: args,
      instructions: [
        'Determine expected effect size from prior research or pilot data',
        'Set significance level (alpha) and justify',
        'Set desired statistical power (typically 0.80 or 0.90)',
        'Calculate required sample size per group',
        'Account for expected dropout/attrition rate',
        'Calculate total sample size needed',
        'Conduct sensitivity analysis for different effect sizes',
        'Document power analysis assumptions',
        'Provide sample size justification narrative',
        'Consider practical feasibility of sample size'
      ],
      outputFormat: 'JSON with requiredSampleSize, achievablePower, effectSize, alpha, dropoutAllowance, sensitivityAnalysis, justification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredSampleSize', 'achievablePower', 'effectSize', 'alpha', 'artifacts'],
      properties: {
        requiredSampleSize: {
          type: 'object',
          properties: {
            perGroup: { type: 'number' },
            total: { type: 'number' }
          }
        },
        achievablePower: { type: 'number' },
        effectSize: {
          type: 'object',
          properties: {
            expected: { type: 'number' },
            type: { type: 'string' },
            source: { type: 'string' }
          }
        },
        alpha: { type: 'number' },
        dropoutAllowance: { type: 'number' },
        sensitivityAnalysis: { type: 'object' },
        justification: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'power-analysis']
}));

export const protocolDocumentationTask = defineTask('protocol-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document experimental protocol',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-design-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Research protocol writer',
      task: 'Create comprehensive experimental protocol documentation',
      context: args,
      instructions: [
        'Document study objectives and hypotheses',
        'Detail inclusion/exclusion criteria',
        'Document step-by-step procedures',
        'Create data collection forms and schedules',
        'Document intervention/treatment procedures',
        'Create timeline with milestones',
        'Document safety monitoring procedures',
        'Create standard operating procedures (SOPs)',
        'Document quality control measures',
        'Prepare protocol for ethics review'
      ],
      outputFormat: 'JSON with procedures, timeline, dataCollection, interventionProtocol, safetyMonitoring, qualityControl, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'timeline', 'dataCollection', 'artifacts'],
      properties: {
        procedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            phases: { type: 'array' }
          }
        },
        dataCollection: {
          type: 'object',
          properties: {
            instruments: { type: 'array', items: { type: 'string' } },
            schedule: { type: 'array' },
            storage: { type: 'string' }
          }
        },
        interventionProtocol: { type: 'string' },
        safetyMonitoring: { type: 'object' },
        qualityControl: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experimental-design', 'protocol-documentation']
}));

export const validityThreatAssessmentTask = defineTask('validity-threat-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess threats to validity',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-design-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Research methodology reviewer',
      task: 'Systematically identify and assess threats to internal and external validity',
      context: args,
      instructions: [
        'Identify threats to internal validity (history, maturation, selection, etc.)',
        'Identify threats to external validity (generalizability)',
        'Identify threats to construct validity',
        'Identify threats to statistical conclusion validity',
        'Assess severity of each threat',
        'Develop mitigation strategies for each threat',
        'Document residual threats that cannot be fully mitigated',
        'Assess overall validity of the design',
        'Recommend design improvements',
        'Document limitations section content'
      ],
      outputFormat: 'JSON with internalThreats, externalThreats, constructThreats, statisticalThreats, mitigationStrategies, overallValidity, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['internalThreats', 'externalThreats', 'mitigationStrategies', 'overallValidity', 'artifacts'],
      properties: {
        internalThreats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              threat: { type: 'string' },
              severity: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        externalThreats: { type: 'array' },
        constructThreats: { type: 'array' },
        statisticalThreats: { type: 'array' },
        mitigationStrategies: { type: 'array', items: { type: 'string' } },
        residualThreats: { type: 'array', items: { type: 'string' } },
        overallValidity: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            assessment: { type: 'string' }
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
  labels: ['agent', 'experimental-design', 'validity-assessment']
}));

export const designQualityScoringTask = defineTask('design-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score experimental design quality',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'experimental-design-methodologist',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Research design auditor and methodological reviewer',
      task: 'Score the overall quality of the experimental design against best practices',
      context: args,
      instructions: [
        'Score design type appropriateness (0-100)',
        'Score randomization rigor (0-100)',
        'Score blinding adequacy (0-100)',
        'Score control group design (0-100)',
        'Score power analysis adequacy (0-100)',
        'Score validity threat mitigation (0-100)',
        'Calculate weighted overall score',
        'Compare to CONSORT/SPIRIT guidelines if applicable',
        'Identify critical gaps in design',
        'Provide actionable recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, standardsCompliance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            designType: { type: 'number' },
            randomization: { type: 'number' },
            blinding: { type: 'number' },
            controlGroups: { type: 'number' },
            powerAnalysis: { type: 'number' },
            validityMitigation: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        standardsCompliance: {
          type: 'object',
          properties: {
            consort: { type: 'boolean' },
            spirit: { type: 'boolean' }
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
  labels: ['agent', 'experimental-design', 'quality-scoring']
}));
