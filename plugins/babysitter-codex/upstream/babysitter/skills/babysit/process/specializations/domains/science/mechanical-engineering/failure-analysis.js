/**
 * @process specializations/domains/science/mechanical-engineering/failure-analysis
 * @description Failure Analysis Investigation - Systematic root cause analysis of mechanical failures
 * using fractography, metallography, chemical analysis, and stress analysis to determine failure
 * mechanism and corrective actions.
 * @inputs { projectName: string, failedComponent: string, failureDescription: string, samples: array }
 * @outputs { success: boolean, failureMechanism: string, rootCause: string, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/failure-analysis', {
 *   projectName: 'Shaft Failure Investigation',
 *   failedComponent: 'Drive Shaft',
 *   failureDescription: 'Fractured during operation after 6 months',
 *   samples: ['fractured_shaft.jpg', 'service_history.pdf'],
 *   serviceConditions: { cycles: 500000, environment: 'corrosive' }
 * });
 *
 * @references
 * - ASM Handbook Vol 11 - Failure Analysis: https://www.asminternational.org/
 * - Fractography and Failure Analysis: https://www.springer.com/
 * - Engineering Failure Analysis Journal: https://www.journals.elsevier.com/engineering-failure-analysis
 * - Failure Analysis: A Practical Guide: https://www.asminternational.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    failedComponent,
    failureDescription,
    samples = [],
    serviceConditions = {},
    materialSpecification = null,
    designDocuments = [],
    outputDir = 'failure-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Failure Analysis for ${projectName}`);
  ctx.log('info', `Component: ${failedComponent}`);

  // ============================================================================
  // PHASE 1: BACKGROUND INVESTIGATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Background Investigation');

  const backgroundResult = await ctx.task(backgroundInvestigationTask, {
    projectName,
    failedComponent,
    failureDescription,
    serviceConditions,
    designDocuments,
    outputDir
  });

  artifacts.push(...backgroundResult.artifacts);

  ctx.log('info', `Background investigation complete - Service life: ${backgroundResult.serviceLife}`);

  // ============================================================================
  // PHASE 2: VISUAL EXAMINATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Visual Examination');

  const visualResult = await ctx.task(visualExaminationTask, {
    projectName,
    failedComponent,
    samples,
    outputDir
  });

  artifacts.push(...visualResult.artifacts);

  ctx.log('info', `Visual examination complete - Preliminary failure mode: ${visualResult.preliminaryMode}`);

  // Breakpoint: Review visual findings
  await ctx.breakpoint({
    question: `Visual examination complete. Preliminary failure mode: ${visualResult.preliminaryMode}. Origin location identified: ${visualResult.originIdentified}. Review visual findings?`,
    title: 'Visual Examination Review',
    context: {
      runId: ctx.runId,
      visualFindings: visualResult.findings,
      photographs: visualResult.photographs,
      files: visualResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: FRACTOGRAPHIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Fractographic Analysis');

  const fractographyResult = await ctx.task(fractographyTask, {
    projectName,
    visualResult,
    outputDir
  });

  artifacts.push(...fractographyResult.artifacts);

  ctx.log('info', `Fractography complete - Fracture mechanism: ${fractographyResult.fractureMechanism}`);

  // ============================================================================
  // PHASE 4: METALLOGRAPHIC EXAMINATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Metallographic Examination');

  const metalloResult = await ctx.task(failureMetallographyTask, {
    projectName,
    fractographyResult,
    materialSpecification,
    outputDir
  });

  artifacts.push(...metalloResult.artifacts);

  ctx.log('info', `Metallography complete - Microstructure: ${metalloResult.microstructure}`);

  // ============================================================================
  // PHASE 5: CHEMICAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Chemical Analysis');

  const chemicalResult = await ctx.task(chemicalAnalysisTask, {
    projectName,
    materialSpecification,
    outputDir
  });

  artifacts.push(...chemicalResult.artifacts);

  ctx.log('info', `Chemical analysis complete - Composition: ${chemicalResult.compositionCompliant ? 'Compliant' : 'Non-compliant'}`);

  // ============================================================================
  // PHASE 6: MECHANICAL PROPERTY VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Mechanical Property Verification');

  const mechanicalResult = await ctx.task(mechanicalVerificationTask, {
    projectName,
    materialSpecification,
    outputDir
  });

  artifacts.push(...mechanicalResult.artifacts);

  ctx.log('info', `Mechanical properties verified - Compliance: ${mechanicalResult.compliance}`);

  // ============================================================================
  // PHASE 7: STRESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Stress Analysis');

  const stressResult = await ctx.task(failureStressAnalysisTask, {
    projectName,
    failedComponent,
    fractographyResult,
    serviceConditions,
    designDocuments,
    outputDir
  });

  artifacts.push(...stressResult.artifacts);

  ctx.log('info', `Stress analysis complete - Max stress: ${stressResult.maxStress} MPa`);

  // ============================================================================
  // PHASE 8: ROOT CAUSE DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Root Cause Determination');

  const rootCauseResult = await ctx.task(rootCauseDeterminationTask, {
    projectName,
    backgroundResult,
    visualResult,
    fractographyResult,
    metalloResult,
    chemicalResult,
    mechanicalResult,
    stressResult,
    outputDir
  });

  artifacts.push(...rootCauseResult.artifacts);

  ctx.log('info', `Root cause determined: ${rootCauseResult.rootCause}`);

  // Breakpoint: Review root cause
  await ctx.breakpoint({
    question: `Root cause analysis complete. Primary root cause: ${rootCauseResult.rootCause}. Contributing factors: ${rootCauseResult.contributingFactors.length}. Review root cause determination?`,
    title: 'Root Cause Review',
    context: {
      runId: ctx.runId,
      rootCause: rootCauseResult.rootCause,
      contributingFactors: rootCauseResult.contributingFactors,
      evidenceSummary: rootCauseResult.evidenceSummary,
      files: rootCauseResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: CORRECTIVE ACTION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Corrective Action Recommendations');

  const correctiveResult = await ctx.task(correctiveActionsTask, {
    projectName,
    rootCauseResult,
    failedComponent,
    outputDir
  });

  artifacts.push(...correctiveResult.artifacts);

  ctx.log('info', `Recommendations developed - ${correctiveResult.recommendations.length} corrective actions`);

  // ============================================================================
  // PHASE 10: GENERATE FAILURE ANALYSIS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating Failure Analysis Report');

  const reportResult = await ctx.task(generateFailureReportTask, {
    projectName,
    failedComponent,
    failureDescription,
    backgroundResult,
    visualResult,
    fractographyResult,
    metalloResult,
    chemicalResult,
    mechanicalResult,
    stressResult,
    rootCauseResult,
    correctiveResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Failure Analysis Complete for ${failedComponent}. Root cause: ${rootCauseResult.rootCause}. ${correctiveResult.recommendations.length} corrective actions. Approve report?`,
    title: 'Failure Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        component: failedComponent,
        failureMechanism: fractographyResult.fractureMechanism,
        rootCause: rootCauseResult.rootCause,
        recommendationCount: correctiveResult.recommendations.length
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Failure Analysis Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    failureMechanism: fractographyResult.fractureMechanism,
    rootCause: rootCauseResult.rootCause,
    contributingFactors: rootCauseResult.contributingFactors,
    recommendations: correctiveResult.recommendations,
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/failure-analysis',
      processSlug: 'failure-analysis',
      category: 'mechanical-engineering',
      timestamp: startTime,
      failedComponent
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const backgroundInvestigationTask = defineTask('background-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Background Investigation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Failure Analysis Engineer',
      task: 'Investigate failure background and service history',
      context: {
        projectName: args.projectName,
        failedComponent: args.failedComponent,
        failureDescription: args.failureDescription,
        serviceConditions: args.serviceConditions,
        designDocuments: args.designDocuments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Gather service history:',
        '   - Time in service',
        '   - Operating conditions',
        '   - Maintenance records',
        '2. Review design specifications',
        '3. Document material specifications',
        '4. Review manufacturing records',
        '5. Identify similar failures',
        '6. Interview operators/witnesses',
        '7. Document loading conditions',
        '8. Create failure timeline'
      ],
      outputFormat: 'JSON object with background investigation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'serviceLife', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        serviceLife: { type: 'string' },
        operatingConditions: { type: 'object' },
        maintenanceHistory: { type: 'array' },
        failureTimeline: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'investigation']
}));

export const visualExaminationTask = defineTask('visual-examination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Visual Examination - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Failure Analysis Engineer',
      task: 'Perform visual examination of failed component',
      context: {
        projectName: args.projectName,
        failedComponent: args.failedComponent,
        samples: args.samples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document overall condition',
        '2. Identify fracture location',
        '3. Look for:',
        '   - Corrosion/oxidation',
        '   - Wear patterns',
        '   - Damage marks',
        '   - Deformation',
        '4. Identify fracture origin(s)',
        '5. Note fracture surface features:',
        '   - Beach marks (fatigue)',
        '   - Chevron marks',
        '   - Ratchet marks',
        '6. Photograph all features',
        '7. Preliminary failure mode assessment'
      ],
      outputFormat: 'JSON object with visual examination'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'preliminaryMode', 'originIdentified', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        preliminaryMode: { type: 'string' },
        originIdentified: { type: 'boolean' },
        findings: { type: 'array' },
        photographs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'visual-examination']
}));

export const fractographyTask = defineTask('fractography', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fractography - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fractography Specialist',
      task: 'Perform fractographic analysis',
      context: {
        projectName: args.projectName,
        visualResult: args.visualResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Clean fracture surface (preserve features)',
        '2. Examine with stereo microscope',
        '3. Perform SEM examination:',
        '   - Secondary electron imaging',
        '   - Identify failure features',
        '4. Identify fracture mechanism:',
        '   - Fatigue striations',
        '   - Cleavage facets (brittle)',
        '   - Dimples (ductile)',
        '   - Intergranular fracture',
        '5. Locate crack initiation site',
        '6. Determine crack propagation path',
        '7. Estimate crack growth rate',
        '8. Document all features'
      ],
      outputFormat: 'JSON object with fractography results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'fractureMechanism', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        fractureMechanism: { type: 'string' },
        initiationSite: { type: 'string' },
        propagationPath: { type: 'string' },
        fractureFeatures: { type: 'array' },
        semImages: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'fractography']
}));

export const failureMetallographyTask = defineTask('failure-metallography', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metallography - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metallurgist',
      task: 'Perform metallographic examination',
      context: {
        projectName: args.projectName,
        fractographyResult: args.fractographyResult,
        materialSpecification: args.materialSpecification,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Section specimen near fracture origin',
        '2. Mount, grind, polish, and etch',
        '3. Examine microstructure:',
        '   - Compare to specification',
        '   - Identify anomalies',
        '4. Look for defects:',
        '   - Inclusions',
        '   - Porosity',
        '   - Decarburization',
        '   - Heat treatment issues',
        '5. Examine crack origin area',
        '6. Document grain size',
        '7. Measure hardness traverse',
        '8. Document findings'
      ],
      outputFormat: 'JSON object with metallography results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'microstructure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        microstructure: { type: 'string' },
        defectsFound: { type: 'array' },
        grainSize: { type: 'number' },
        hardnessProfile: { type: 'array' },
        complianceWithSpec: { type: 'boolean' },
        micrographs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'metallography']
}));

export const chemicalAnalysisTask = defineTask('chemical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Chemical Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Analyst',
      task: 'Perform chemical composition analysis',
      context: {
        projectName: args.projectName,
        materialSpecification: args.materialSpecification,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select analysis method:',
        '   - OES (spark emission)',
        '   - ICP-OES/ICP-MS',
        '   - Combustion analysis (C, S)',
        '2. Analyze bulk composition',
        '3. Compare to specification',
        '4. EDS analysis at fracture origin',
        '5. Check for contamination',
        '6. Analyze corrosion products',
        '7. Document compliance status'
      ],
      outputFormat: 'JSON object with chemical analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'composition', 'compositionCompliant', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        composition: { type: 'object' },
        compositionCompliant: { type: 'boolean' },
        deviations: { type: 'array' },
        contaminants: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'chemical-analysis']
}));

export const mechanicalVerificationTask = defineTask('mechanical-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mechanical Verification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Testing Engineer',
      task: 'Verify mechanical properties',
      context: {
        projectName: args.projectName,
        materialSpecification: args.materialSpecification,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Extract test specimens if possible',
        '2. Perform hardness testing',
        '3. Perform tensile testing if material available',
        '4. Compare to specification',
        '5. Correlate hardness to strength',
        '6. Document compliance'
      ],
      outputFormat: 'JSON object with mechanical verification'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliance', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        compliance: { type: 'string' },
        hardness: { type: 'number' },
        tensileProperties: { type: 'object' },
        deviations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'mechanical-testing']
}));

export const failureStressAnalysisTask = defineTask('failure-stress-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stress Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stress Analyst',
      task: 'Analyze stresses in failed component',
      context: {
        projectName: args.projectName,
        failedComponent: args.failedComponent,
        fractographyResult: args.fractographyResult,
        serviceConditions: args.serviceConditions,
        designDocuments: args.designDocuments,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review design stress analysis',
        '2. Calculate applied stresses:',
        '   - Static loads',
        '   - Dynamic loads',
        '   - Thermal stresses',
        '3. Include stress concentrations',
        '4. Compare stress to material strength',
        '5. Calculate safety factor',
        '6. Estimate overload if applicable',
        '7. Perform FEA if needed',
        '8. Document findings'
      ],
      outputFormat: 'JSON object with stress analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maxStress', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maxStress: { type: 'number' },
        stressConcentration: { type: 'number' },
        safetyFactor: { type: 'number' },
        overloadEstimate: { type: 'number' },
        stressDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'stress-analysis']
}));

export const rootCauseDeterminationTask = defineTask('root-cause-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Root Cause Determination - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Failure Analysis Engineer',
      task: 'Determine root cause of failure',
      context: {
        projectName: args.projectName,
        backgroundResult: args.backgroundResult,
        visualResult: args.visualResult,
        fractographyResult: args.fractographyResult,
        metalloResult: args.metalloResult,
        chemicalResult: args.chemicalResult,
        mechanicalResult: args.mechanicalResult,
        stressResult: args.stressResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Synthesize all evidence',
        '2. Apply failure analysis logic:',
        '   - Was material correct?',
        '   - Was processing correct?',
        '   - Were stresses within design?',
        '   - Was environment factor?',
        '3. Use fault tree analysis',
        '4. Use fishbone diagram',
        '5. Identify primary root cause',
        '6. Identify contributing factors',
        '7. Rank causes by significance',
        '8. Document evidence chain'
      ],
      outputFormat: 'JSON object with root cause'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rootCause', 'contributingFactors', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rootCause: { type: 'string' },
        contributingFactors: { type: 'array' },
        evidenceSummary: { type: 'object' },
        faultTree: { type: 'object' },
        confidenceLevel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'root-cause']
}));

export const correctiveActionsTask = defineTask('corrective-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Corrective Actions - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Failure Analysis Engineer',
      task: 'Develop corrective action recommendations',
      context: {
        projectName: args.projectName,
        rootCauseResult: args.rootCauseResult,
        failedComponent: args.failedComponent,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Address each root cause/contributing factor',
        '2. Develop corrective actions:',
        '   - Design changes',
        '   - Material changes',
        '   - Process changes',
        '   - Inspection improvements',
        '3. Prioritize by effectiveness and cost',
        '4. Define implementation timeline',
        '5. Identify verification method',
        '6. Consider preventive actions',
        '7. Document recommendations'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        recommendations: { type: 'array' },
        prioritizedActions: { type: 'array' },
        implementationPlan: { type: 'object' },
        verificationMethods: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'corrective-actions']
}));

export const generateFailureReportTask = defineTask('generate-failure-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Failure Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive failure analysis report',
      context: {
        projectName: args.projectName,
        failedComponent: args.failedComponent,
        failureDescription: args.failureDescription,
        backgroundResult: args.backgroundResult,
        visualResult: args.visualResult,
        fractographyResult: args.fractographyResult,
        metalloResult: args.metalloResult,
        chemicalResult: args.chemicalResult,
        mechanicalResult: args.mechanicalResult,
        stressResult: args.stressResult,
        rootCauseResult: args.rootCauseResult,
        correctiveResult: args.correctiveResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document background',
        '3. Present visual examination',
        '4. Present fractography results',
        '5. Present metallography',
        '6. Present chemical analysis',
        '7. Present stress analysis',
        '8. State root cause and evidence',
        '9. Present recommendations',
        '10. Include all photographs/images'
      ],
      outputFormat: 'JSON object with report path'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'failure-analysis', 'reporting']
}));
