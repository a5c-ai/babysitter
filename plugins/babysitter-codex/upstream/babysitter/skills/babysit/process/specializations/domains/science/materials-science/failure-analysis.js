/**
 * @process domains/science/materials-science/failure-analysis
 * @description Root Cause Failure Analysis - Conduct systematic failure analysis including visual examination,
 * fractography, metallography, chemical analysis, and root cause determination.
 * @inputs { caseId: string, component: string, failureType?: string, serviceConditions?: object }
 * @outputs { success: boolean, rootCause: string, contributingFactors: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/failure-analysis', {
 *   caseId: 'FA-2024-001',
 *   component: 'turbine-blade',
 *   failureType: 'fatigue',
 *   serviceConditions: { temperature: 650, hours: 15000 }
 * });
 *
 * @references
 * - ASM Handbook Vol. 11: Failure Analysis and Prevention
 * - ASTM E2332: Standard Practice for Investigation and Analysis of Physical Component Failures
 * - ISO 5817: Welding - Fusion-welded joints in steel - Quality levels for imperfections
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    caseId,
    component,
    failureType = 'unknown',
    serviceConditions = {},
    materialSpec = null,
    preserveEvidence = true,
    outputDir = 'failure-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Failure Analysis for case: ${caseId}`);
  ctx.log('info', `Component: ${component}, Suspected failure type: ${failureType}`);

  // Phase 1: Evidence Collection and Documentation
  ctx.log('info', 'Phase 1: Collecting and documenting evidence');
  const evidenceCollection = await ctx.task(evidenceCollectionTask, {
    caseId,
    component,
    preserveEvidence,
    outputDir
  });

  artifacts.push(...evidenceCollection.artifacts);

  // Phase 2: Visual Examination
  ctx.log('info', 'Phase 2: Conducting visual examination');
  const visualExamination = await ctx.task(visualExaminationTask, {
    caseId,
    component,
    evidenceCollection,
    outputDir
  });

  artifacts.push(...visualExamination.artifacts);

  // Phase 3: Non-Destructive Examination
  ctx.log('info', 'Phase 3: Performing non-destructive examination');
  const ndeExamination = await ctx.task(ndeExaminationTask, {
    caseId,
    component,
    visualExamination,
    outputDir
  });

  artifacts.push(...ndeExamination.artifacts);

  await ctx.breakpoint({
    question: `Initial examination complete for ${caseId}. Preliminary failure type: ${visualExamination.preliminaryFailureType}. Proceed with destructive analysis?`,
    title: 'Initial Examination Review',
    context: {
      runId: ctx.runId,
      summary: {
        preliminaryFailureType: visualExamination.preliminaryFailureType,
        crackOrigins: visualExamination.crackOrigins,
        ndeFindings: ndeExamination.findings
      },
      files: visualExamination.artifacts.map(a => ({ path: a.path, format: a.format || 'image' }))
    }
  });

  // Phase 4: Fractographic Examination
  ctx.log('info', 'Phase 4: Conducting fractographic examination');
  const fractography = await ctx.task(faFractographyTask, {
    caseId,
    component,
    visualExamination,
    outputDir
  });

  artifacts.push(...fractography.artifacts);

  // Phase 5: Metallographic Examination
  ctx.log('info', 'Phase 5: Conducting metallographic examination');
  const metallography = await ctx.task(metallographyTask, {
    caseId,
    component,
    fractography,
    materialSpec,
    outputDir
  });

  artifacts.push(...metallography.artifacts);

  // Phase 6: Chemical Analysis
  ctx.log('info', 'Phase 6: Performing chemical analysis');
  const chemicalAnalysis = await ctx.task(faChemicalAnalysisTask, {
    caseId,
    component,
    materialSpec,
    outputDir
  });

  artifacts.push(...chemicalAnalysis.artifacts);

  // Phase 7: Mechanical Property Verification
  ctx.log('info', 'Phase 7: Verifying mechanical properties');
  const mechanicalVerification = await ctx.task(mechanicalVerificationTask, {
    caseId,
    component,
    materialSpec,
    outputDir
  });

  artifacts.push(...mechanicalVerification.artifacts);

  // Phase 8: Service History Review
  ctx.log('info', 'Phase 8: Reviewing service history');
  const serviceHistoryReview = await ctx.task(serviceHistoryReviewTask, {
    caseId,
    component,
    serviceConditions,
    outputDir
  });

  artifacts.push(...serviceHistoryReview.artifacts);

  // Phase 9: Root Cause Determination
  ctx.log('info', 'Phase 9: Determining root cause');
  const rootCauseDetermination = await ctx.task(rootCauseDeterminationTask, {
    caseId,
    visualExamination,
    fractography,
    metallography,
    chemicalAnalysis,
    mechanicalVerification,
    serviceHistoryReview,
    outputDir
  });

  artifacts.push(...rootCauseDetermination.artifacts);

  await ctx.breakpoint({
    question: `Root cause analysis complete for ${caseId}. Root cause: ${rootCauseDetermination.rootCause}. Confidence: ${rootCauseDetermination.confidence}. Review findings?`,
    title: 'Root Cause Determination Review',
    context: {
      runId: ctx.runId,
      summary: {
        rootCause: rootCauseDetermination.rootCause,
        failureMechanism: rootCauseDetermination.failureMechanism,
        contributingFactors: rootCauseDetermination.contributingFactors,
        confidence: rootCauseDetermination.confidence
      },
      files: rootCauseDetermination.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 10: Recommendations Development
  ctx.log('info', 'Phase 10: Developing recommendations');
  const recommendations = await ctx.task(faRecommendationsTask, {
    caseId,
    rootCauseDetermination,
    serviceConditions,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // Phase 11: Report Generation
  ctx.log('info', 'Phase 11: Generating failure analysis report');
  const report = await ctx.task(failureAnalysisReportTask, {
    caseId,
    component,
    evidenceCollection,
    visualExamination,
    ndeExamination,
    fractography,
    metallography,
    chemicalAnalysis,
    mechanicalVerification,
    serviceHistoryReview,
    rootCauseDetermination,
    recommendations,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    caseId,
    component,
    rootCause: rootCauseDetermination.rootCause,
    failureMechanism: rootCauseDetermination.failureMechanism,
    failureMode: rootCauseDetermination.failureMode,
    contributingFactors: rootCauseDetermination.contributingFactors,
    materialCompliance: {
      chemistry: chemicalAnalysis.meetsSpec,
      microstructure: metallography.meetsSpec,
      mechanicalProperties: mechanicalVerification.meetsSpec
    },
    timeline: {
      initiationMechanism: fractography.initiationMechanism,
      propagationMode: fractography.propagationMode,
      estimatedLifeConsumed: rootCauseDetermination.estimatedLifeConsumed
    },
    recommendations: recommendations.actionItems,
    preventionMeasures: recommendations.preventionMeasures,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/failure-analysis',
      timestamp: startTime,
      serviceConditions,
      outputDir
    }
  };
}

// Task 1: Evidence Collection
export const evidenceCollectionTask = defineTask('fa-evidence-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evidence Collection - ${args.caseId}`,
  agent: {
    name: 'failure-analyst',
    prompt: {
      role: 'Failure Analysis Evidence Specialist',
      task: 'Collect and preserve failure evidence',
      context: args,
      instructions: [
        '1. Photograph failed component as-received',
        '2. Document chain of custody',
        '3. Preserve fracture surfaces',
        '4. Collect all fragments',
        '5. Document adjacent damage',
        '6. Preserve corrosion products',
        '7. Collect deposits/debris',
        '8. Bag and tag evidence',
        '9. Record receiving condition',
        '10. Create evidence inventory'
      ],
      outputFormat: 'JSON with evidence collection results'
    },
    outputSchema: {
      type: 'object',
      required: ['evidencePreserved', 'inventory', 'artifacts'],
      properties: {
        evidencePreserved: { type: 'boolean' },
        inventory: { type: 'array', items: { type: 'object' } },
        photographs: { type: 'array', items: { type: 'string' } },
        chainOfCustody: { type: 'string' },
        receivingCondition: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'evidence', 'materials-science']
}));

// Task 2: Visual Examination
export const visualExaminationTask = defineTask('fa-visual-examination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Visual Examination - ${args.caseId}`,
  agent: {
    name: 'visual-examiner',
    prompt: {
      role: 'Visual Examination Specialist',
      task: 'Conduct detailed visual examination of failed component',
      context: args,
      instructions: [
        '1. Document overall component condition',
        '2. Identify primary fracture surface',
        '3. Locate crack origin(s)',
        '4. Document secondary cracking',
        '5. Identify surface damage (wear, corrosion)',
        '6. Note deformation patterns',
        '7. Identify foreign material',
        '8. Photograph all features',
        '9. Measure critical dimensions',
        '10. Form preliminary failure hypothesis'
      ],
      outputFormat: 'JSON with visual examination results'
    },
    outputSchema: {
      type: 'object',
      required: ['preliminaryFailureType', 'crackOrigins', 'artifacts'],
      properties: {
        preliminaryFailureType: { type: 'string' },
        crackOrigins: { type: 'array', items: { type: 'object' } },
        secondaryCracks: { type: 'array', items: { type: 'string' } },
        surfaceCondition: { type: 'string' },
        deformation: { type: 'string' },
        corrosion: { type: 'string' },
        photographs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'visual-exam', 'materials-science']
}));

// Task 3: NDE Examination
export const ndeExaminationTask = defineTask('fa-nde-examination', (args, taskCtx) => ({
  kind: 'agent',
  title: `NDE Examination - ${args.caseId}`,
  agent: {
    name: 'nde-specialist',
    prompt: {
      role: 'Non-Destructive Examination Specialist',
      task: 'Perform NDE on failed component',
      context: args,
      instructions: [
        '1. Select appropriate NDE methods',
        '2. Perform dye penetrant testing',
        '3. Perform magnetic particle testing',
        '4. Conduct ultrasonic inspection',
        '5. Perform radiographic inspection if needed',
        '6. Document all indications',
        '7. Map crack extent',
        '8. Identify internal defects',
        '9. Correlate with visual findings',
        '10. Document NDE results'
      ],
      outputFormat: 'JSON with NDE examination results'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'findings', 'artifacts'],
      properties: {
        methods: { type: 'array', items: { type: 'string' } },
        findings: { type: 'array', items: { type: 'object' } },
        crackExtent: { type: 'object' },
        internalDefects: { type: 'array', items: { type: 'object' } },
        ndeImages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'nde', 'materials-science']
}));

// Task 4: Fractographic Examination
export const faFractographyTask = defineTask('fa-fractography', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fractography - ${args.caseId}`,
  agent: {
    name: 'fractographer',
    prompt: {
      role: 'Fractography Specialist',
      task: 'Conduct fractographic examination of fracture surfaces',
      context: args,
      instructions: [
        '1. Clean fracture surface carefully',
        '2. Examine at macro scale (stereo microscope)',
        '3. Identify origin area',
        '4. Examine at micro scale (SEM)',
        '5. Identify fatigue striations if present',
        '6. Identify beach marks',
        '7. Characterize final fracture region',
        '8. Document dimples, cleavage, intergranular features',
        '9. Identify corrosion or environmental effects',
        '10. Correlate with failure mechanism'
      ],
      outputFormat: 'JSON with fractographic examination results'
    },
    outputSchema: {
      type: 'object',
      required: ['initiationMechanism', 'propagationMode', 'artifacts'],
      properties: {
        initiationMechanism: { type: 'string' },
        initiationFeatures: { type: 'array', items: { type: 'string' } },
        propagationMode: { type: 'string' },
        striationsPresent: { type: 'boolean' },
        beachMarksPresent: { type: 'boolean' },
        finalFractureMode: { type: 'string' },
        environmentalFeatures: { type: 'array', items: { type: 'string' } },
        semImages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'fractography', 'materials-science']
}));

// Task 5: Metallographic Examination
export const metallographyTask = defineTask('fa-metallography', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metallography - ${args.caseId}`,
  agent: {
    name: 'metallographer',
    prompt: {
      role: 'Metallography Specialist',
      task: 'Conduct metallographic examination',
      context: args,
      instructions: [
        '1. Section sample strategically',
        '2. Mount and polish specimens',
        '3. Etch to reveal microstructure',
        '4. Examine near-origin region',
        '5. Examine bulk microstructure',
        '6. Check for material defects',
        '7. Identify anomalies (inclusions, voids)',
        '8. Measure grain size',
        '9. Compare with specification',
        '10. Document microstructural findings'
      ],
      outputFormat: 'JSON with metallographic examination results'
    },
    outputSchema: {
      type: 'object',
      required: ['microstructure', 'anomalies', 'meetsSpec', 'artifacts'],
      properties: {
        microstructure: { type: 'string' },
        grainSize: { type: 'number' },
        phases: { type: 'array', items: { type: 'string' } },
        anomalies: { type: 'array', items: { type: 'string' } },
        inclusionRating: { type: 'string' },
        decarburization: { type: 'string' },
        intergranularAttack: { type: 'boolean' },
        meetsSpec: { type: 'boolean' },
        micrographs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'metallography', 'materials-science']
}));

// Task 6: Chemical Analysis
export const faChemicalAnalysisTask = defineTask('fa-chemical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Chemical Analysis - ${args.caseId}`,
  agent: {
    name: 'chemical-analyst',
    prompt: {
      role: 'Chemical Analysis Specialist',
      task: 'Perform chemical analysis of failed component',
      context: args,
      instructions: [
        '1. Perform bulk chemical analysis (OES, ICP)',
        '2. Check critical alloying elements',
        '3. Check for tramp elements',
        '4. Analyze deposits/corrosion products',
        '5. Perform localized analysis (EDS, WDS)',
        '6. Check for surface contamination',
        '7. Compare with material specification',
        '8. Identify chemical anomalies',
        '9. Assess material authenticity',
        '10. Document chemical analysis results'
      ],
      outputFormat: 'JSON with chemical analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['composition', 'meetsSpec', 'artifacts'],
      properties: {
        composition: { type: 'object' },
        specificationLimits: { type: 'object' },
        meetsSpec: { type: 'boolean' },
        outOfSpecElements: { type: 'array', items: { type: 'string' } },
        depositAnalysis: { type: 'object' },
        contamination: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'chemical-analysis', 'materials-science']
}));

// Task 7: Mechanical Verification
export const mechanicalVerificationTask = defineTask('fa-mechanical-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mechanical Verification - ${args.caseId}`,
  agent: {
    name: 'mechanical-tester',
    prompt: {
      role: 'Mechanical Property Verification Specialist',
      task: 'Verify mechanical properties of failed material',
      context: args,
      instructions: [
        '1. Perform hardness testing',
        '2. Perform tensile testing if material available',
        '3. Conduct impact testing if applicable',
        '4. Compare with specification',
        '5. Check for property degradation',
        '6. Assess heat treatment condition',
        '7. Check for embrittlement',
        '8. Correlate with microstructure',
        '9. Document property measurements',
        '10. Assess material suitability'
      ],
      outputFormat: 'JSON with mechanical verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['hardness', 'meetsSpec', 'artifacts'],
      properties: {
        hardness: { type: 'number' },
        tensileStrength: { type: 'number' },
        yieldStrength: { type: 'number' },
        elongation: { type: 'number' },
        impactEnergy: { type: 'number' },
        meetsSpec: { type: 'boolean' },
        degradation: { type: 'string' },
        embrittlement: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'mechanical', 'materials-science']
}));

// Task 8: Service History Review
export const serviceHistoryReviewTask = defineTask('fa-service-history', (args, taskCtx) => ({
  kind: 'agent',
  title: `Service History Review - ${args.caseId}`,
  agent: {
    name: 'service-analyst',
    prompt: {
      role: 'Service History Analyst',
      task: 'Review component service history and operating conditions',
      context: args,
      instructions: [
        '1. Gather manufacturing records',
        '2. Review maintenance history',
        '3. Document operating conditions',
        '4. Identify unusual events',
        '5. Review similar failure history',
        '6. Check design vs. actual loads',
        '7. Assess environmental exposure',
        '8. Review inspection records',
        '9. Calculate service life',
        '10. Identify service anomalies'
      ],
      outputFormat: 'JSON with service history review results'
    },
    outputSchema: {
      type: 'object',
      required: ['serviceLife', 'operatingConditions', 'artifacts'],
      properties: {
        serviceLife: { type: 'number' },
        operatingConditions: { type: 'object' },
        designConditions: { type: 'object' },
        maintenanceHistory: { type: 'array', items: { type: 'object' } },
        unusualEvents: { type: 'array', items: { type: 'string' } },
        priorFailures: { type: 'array', items: { type: 'object' } },
        environmentalExposure: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'service-history', 'materials-science']
}));

// Task 9: Root Cause Determination
export const rootCauseDeterminationTask = defineTask('fa-root-cause', (args, taskCtx) => ({
  kind: 'agent',
  title: `Root Cause Determination - ${args.caseId}`,
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Root Cause Analysis Specialist',
      task: 'Determine root cause of failure',
      context: args,
      instructions: [
        '1. Synthesize all evidence',
        '2. Apply failure analysis logic tree',
        '3. Identify failure mechanism',
        '4. Determine failure mode',
        '5. Identify root cause',
        '6. Identify contributing factors',
        '7. Apply 5-whys analysis',
        '8. Assess confidence level',
        '9. Consider alternative hypotheses',
        '10. Document root cause determination'
      ],
      outputFormat: 'JSON with root cause determination results'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'failureMechanism', 'failureMode', 'confidence', 'artifacts'],
      properties: {
        rootCause: { type: 'string' },
        failureMechanism: { type: 'string' },
        failureMode: { type: 'string' },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        alternativeHypotheses: { type: 'array', items: { type: 'string' } },
        estimatedLifeConsumed: { type: 'number' },
        fiveWhysAnalysis: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'root-cause', 'materials-science']
}));

// Task 10: Recommendations
export const faRecommendationsTask = defineTask('fa-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recommendations - ${args.caseId}`,
  agent: {
    name: 'recommendations-analyst',
    prompt: {
      role: 'Failure Prevention Recommendations Specialist',
      task: 'Develop recommendations to prevent recurrence',
      context: args,
      instructions: [
        '1. Address root cause directly',
        '2. Address contributing factors',
        '3. Recommend design changes',
        '4. Recommend material changes',
        '5. Recommend process changes',
        '6. Recommend maintenance changes',
        '7. Recommend inspection improvements',
        '8. Prioritize recommendations',
        '9. Estimate implementation effort',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['actionItems', 'preventionMeasures', 'artifacts'],
      properties: {
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              action: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        preventionMeasures: { type: 'array', items: { type: 'string' } },
        designRecommendations: { type: 'array', items: { type: 'string' } },
        materialRecommendations: { type: 'array', items: { type: 'string' } },
        processRecommendations: { type: 'array', items: { type: 'string' } },
        inspectionRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'recommendations', 'materials-science']
}));

// Task 11: Report Generation
export const failureAnalysisReportTask = defineTask('fa-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Failure Analysis Report - ${args.caseId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Failure Analysis Technical Writer',
      task: 'Generate comprehensive failure analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document background and scope',
        '3. Present visual examination findings',
        '4. Present fractographic analysis',
        '5. Present metallographic analysis',
        '6. Present chemical analysis',
        '7. Present mechanical testing',
        '8. Document service history',
        '9. Present root cause determination',
        '10. Present recommendations'
      ],
      outputFormat: 'JSON with report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        figures: { type: 'array', items: { type: 'string' } },
        tables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'failure-analysis', 'report', 'documentation', 'materials-science']
}));
