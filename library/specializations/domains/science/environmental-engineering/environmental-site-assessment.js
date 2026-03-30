/**
 * @process environmental-engineering/environmental-site-assessment
 * @description Environmental Site Assessment - Phased approach to site investigation including Phase I historical review,
 * Phase II sampling, and Phase III delineation for contaminated site evaluation.
 * @inputs { siteName: string, siteAddress: string, assessmentPhase: string, siteHistory: object }
 * @outputs { success: boolean, assessmentFindings: object, recs: array, nextSteps: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/environmental-site-assessment', {
 *   siteName: 'Former Industrial Property',
 *   siteAddress: '123 Main Street, Industrial City',
 *   assessmentPhase: 'Phase II',
 *   siteHistory: { formerUse: 'manufacturing', yearBuilt: 1950 }
 * });
 *
 * @references
 * - ASTM E1527 - Phase I Environmental Site Assessment
 * - ASTM E1903 - Phase II Environmental Site Assessment
 * - EPA All Appropriate Inquiries Rule
 * - State Environmental Assessment Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    siteName,
    siteAddress,
    assessmentPhase = 'Phase I',
    siteHistory = {},
    propertyType = 'commercial',
    transactionType = 'acquisition',
    outputDir = 'esa-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Environmental Site Assessment: ${siteName}`);
  ctx.log('info', `Phase: ${assessmentPhase}, Address: ${siteAddress}`);

  // ============================================================================
  // PHASE I: RECORDS REVIEW (if Phase I or II)
  // ============================================================================

  let recordsReview = null;
  if (assessmentPhase === 'Phase I' || assessmentPhase === 'Phase II') {
    ctx.log('info', 'Phase I: Records Review');

    recordsReview = await ctx.task(recordsReviewTask, {
      siteName,
      siteAddress,
      siteHistory,
      outputDir
    });

    artifacts.push(...recordsReview.artifacts);
  }

  // ============================================================================
  // PHASE I: SITE RECONNAISSANCE
  // ============================================================================

  let siteRecon = null;
  if (assessmentPhase === 'Phase I' || assessmentPhase === 'Phase II') {
    ctx.log('info', 'Phase I: Site Reconnaissance');

    siteRecon = await ctx.task(siteReconnaissanceTask, {
      siteName,
      siteAddress,
      recordsReview,
      outputDir
    });

    artifacts.push(...siteRecon.artifacts);
  }

  // ============================================================================
  // PHASE I: INTERVIEWS
  // ============================================================================

  let interviews = null;
  if (assessmentPhase === 'Phase I' || assessmentPhase === 'Phase II') {
    ctx.log('info', 'Phase I: Interviews');

    interviews = await ctx.task(interviewsTask, {
      siteName,
      siteHistory,
      recordsReview,
      outputDir
    });

    artifacts.push(...interviews.artifacts);
  }

  // ============================================================================
  // PHASE I: REC EVALUATION
  // ============================================================================

  let recEvaluation = null;
  if (assessmentPhase === 'Phase I' || assessmentPhase === 'Phase II') {
    ctx.log('info', 'Phase I: REC Evaluation');

    recEvaluation = await ctx.task(recEvaluationTask, {
      siteName,
      recordsReview,
      siteRecon,
      interviews,
      outputDir
    });

    artifacts.push(...recEvaluation.artifacts);

    // Breakpoint: Phase I Review
    await ctx.breakpoint({
      question: `Phase I ESA complete for ${siteName}. RECs identified: ${recEvaluation.recs.length}. Review findings before proceeding?`,
      title: 'Phase I ESA Review',
      context: {
        runId: ctx.runId,
        recs: recEvaluation.recs,
        hrecs: recEvaluation.hrecs,
        crecs: recEvaluation.crecs,
        files: recEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE II: SAMPLING PLAN (if Phase II or III)
  // ============================================================================

  let samplingPlan = null;
  if (assessmentPhase === 'Phase II' || assessmentPhase === 'Phase III') {
    ctx.log('info', 'Phase II: Sampling Plan Development');

    samplingPlan = await ctx.task(samplingPlanTask, {
      siteName,
      recEvaluation,
      siteHistory,
      outputDir
    });

    artifacts.push(...samplingPlan.artifacts);
  }

  // ============================================================================
  // PHASE II: FIELD INVESTIGATION
  // ============================================================================

  let fieldInvestigation = null;
  if (assessmentPhase === 'Phase II' || assessmentPhase === 'Phase III') {
    ctx.log('info', 'Phase II: Field Investigation');

    fieldInvestigation = await ctx.task(fieldInvestigationTask, {
      siteName,
      samplingPlan,
      outputDir
    });

    artifacts.push(...fieldInvestigation.artifacts);
  }

  // ============================================================================
  // PHASE II: LABORATORY ANALYSIS
  // ============================================================================

  let labAnalysis = null;
  if (assessmentPhase === 'Phase II' || assessmentPhase === 'Phase III') {
    ctx.log('info', 'Phase II: Laboratory Analysis');

    labAnalysis = await ctx.task(labAnalysisTask, {
      siteName,
      fieldInvestigation,
      samplingPlan,
      outputDir
    });

    artifacts.push(...labAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE II: DATA EVALUATION
  // ============================================================================

  let dataEvaluation = null;
  if (assessmentPhase === 'Phase II' || assessmentPhase === 'Phase III') {
    ctx.log('info', 'Phase II: Data Evaluation');

    dataEvaluation = await ctx.task(dataEvaluationTask, {
      siteName,
      labAnalysis,
      fieldInvestigation,
      outputDir
    });

    artifacts.push(...dataEvaluation.artifacts);

    // Breakpoint: Phase II Review
    await ctx.breakpoint({
      question: `Phase II ESA complete for ${siteName}. Contamination detected: ${dataEvaluation.contaminationDetected}. Review findings?`,
      title: 'Phase II ESA Review',
      context: {
        runId: ctx.runId,
        contaminationDetected: dataEvaluation.contaminationDetected,
        exceedances: dataEvaluation.exceedances,
        affectedMedia: dataEvaluation.affectedMedia,
        files: dataEvaluation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE III: DELINEATION (if Phase III)
  // ============================================================================

  let delineation = null;
  if (assessmentPhase === 'Phase III') {
    ctx.log('info', 'Phase III: Contamination Delineation');

    delineation = await ctx.task(delineationTask, {
      siteName,
      dataEvaluation,
      outputDir
    });

    artifacts.push(...delineation.artifacts);
  }

  // ============================================================================
  // ASSESSMENT REPORT
  // ============================================================================

  ctx.log('info', 'Generating Assessment Report');

  const assessmentReport = await ctx.task(assessmentReportTask, {
    siteName,
    siteAddress,
    assessmentPhase,
    recordsReview,
    siteRecon,
    interviews,
    recEvaluation,
    samplingPlan,
    fieldInvestigation,
    labAnalysis,
    dataEvaluation,
    delineation,
    transactionType,
    outputDir
  });

  artifacts.push(...assessmentReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    siteName,
    assessmentFindings: {
      phase: assessmentPhase,
      recs: recEvaluation?.recs || [],
      contaminationDetected: dataEvaluation?.contaminationDetected || false,
      exceedances: dataEvaluation?.exceedances || [],
      affectedMedia: dataEvaluation?.affectedMedia || [],
      delineationComplete: delineation?.delineationComplete || false
    },
    recs: recEvaluation?.recs || [],
    nextSteps: assessmentReport.nextSteps,
    reportPath: assessmentReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/environmental-site-assessment',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const recordsReviewTask = defineTask('records-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Historical Records Review',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Environmental Site Assessment Specialist',
      task: 'Conduct Phase I historical records review',
      context: args,
      instructions: [
        '1. Search environmental database records (EDR, NETR)',
        '2. Review historical aerial photographs',
        '3. Review Sanborn fire insurance maps',
        '4. Review city directories',
        '5. Search regulatory agency files',
        '6. Review property deed records',
        '7. Review historical topographic maps',
        '8. Search UST/AST registrations',
        '9. Review RCRA generator status',
        '10. Document records review findings'
      ],
      outputFormat: 'JSON with findings, database hits, historical uses'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'databaseHits', 'historicalUses', 'artifacts'],
      properties: {
        findings: { type: 'array' },
        databaseHits: { type: 'array' },
        historicalUses: { type: 'array' },
        regulatoryRecords: { type: 'array' },
        adjacentSiteConcerns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'records-review']
}));

export const siteReconnaissanceTask = defineTask('site-reconnaissance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Site Reconnaissance',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'ESA Field Investigator',
      task: 'Conduct site reconnaissance visit',
      context: args,
      instructions: [
        '1. Document current site conditions',
        '2. Identify potential environmental concerns',
        '3. Observe chemical storage areas',
        '4. Identify USTs/ASTs',
        '5. Document floor drains and sumps',
        '6. Observe staining and discoloration',
        '7. Note odors or stressed vegetation',
        '8. Document PCB-containing equipment',
        '9. Photograph key observations',
        '10. Document reconnaissance findings'
      ],
      outputFormat: 'JSON with observations, concerns, photolog'
    },
    outputSchema: {
      type: 'object',
      required: ['observations', 'concerns', 'photoLog', 'artifacts'],
      properties: {
        observations: { type: 'array' },
        concerns: { type: 'array' },
        chemicalStorage: { type: 'array' },
        wasteManagement: { type: 'object' },
        physicalConditions: { type: 'object' },
        photoLog: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'reconnaissance']
}));

export const interviewsTask = defineTask('interviews', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interviews',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'ESA Interview Specialist',
      task: 'Conduct interviews with knowledgeable parties',
      context: args,
      instructions: [
        '1. Interview current property owner',
        '2. Interview current site manager/occupant',
        '3. Interview past owners/operators if available',
        '4. Contact local fire department',
        '5. Contact health department',
        '6. Contact building department',
        '7. Document chemical use history',
        '8. Document spill history',
        '9. Document waste disposal practices',
        '10. Compile interview summaries'
      ],
      outputFormat: 'JSON with interview summaries, key information'
    },
    outputSchema: {
      type: 'object',
      required: ['interviewSummaries', 'keyInformation', 'dataGaps', 'artifacts'],
      properties: {
        interviewSummaries: { type: 'array' },
        keyInformation: { type: 'array' },
        chemicalUseHistory: { type: 'array' },
        spillHistory: { type: 'array' },
        dataGaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'interviews']
}));

export const recEvaluationTask = defineTask('rec-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'REC Evaluation',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'ESA Risk Evaluator',
      task: 'Evaluate recognized environmental conditions',
      context: args,
      instructions: [
        '1. Evaluate all potential environmental conditions',
        '2. Classify RECs (Recognized Environmental Conditions)',
        '3. Classify HRECs (Historical RECs)',
        '4. Classify CRECs (Controlled RECs)',
        '5. Classify de minimis conditions',
        '6. Assess migration pathways',
        '7. Evaluate receptor exposure',
        '8. Prioritize concerns',
        '9. Document findings per ASTM E1527',
        '10. Prepare REC summary'
      ],
      outputFormat: 'JSON with RECs, HRECs, CRECs, priorities'
    },
    outputSchema: {
      type: 'object',
      required: ['recs', 'hrecs', 'crecs', 'deMinimis', 'artifacts'],
      properties: {
        recs: { type: 'array' },
        hrecs: { type: 'array' },
        crecs: { type: 'array' },
        deMinimis: { type: 'array' },
        migrationPathways: { type: 'object' },
        receptorExposure: { type: 'object' },
        prioritizedConcerns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'rec-evaluation']
}));

export const samplingPlanTask = defineTask('sampling-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sampling Plan Development',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Phase II Sampling Specialist',
      task: 'Develop Phase II sampling and analysis plan',
      context: args,
      instructions: [
        '1. Define data quality objectives',
        '2. Identify target analytes',
        '3. Select sampling locations',
        '4. Determine sample depths',
        '5. Select sampling methods',
        '6. Specify analytical methods',
        '7. Develop QA/QC plan',
        '8. Prepare health and safety plan',
        '9. Obtain permits/approvals',
        '10. Document sampling plan'
      ],
      outputFormat: 'JSON with sampling locations, analytes, methods'
    },
    outputSchema: {
      type: 'object',
      required: ['samplingLocations', 'targetAnalytes', 'methods', 'artifacts'],
      properties: {
        samplingLocations: { type: 'array' },
        targetAnalytes: { type: 'array' },
        methods: { type: 'object' },
        dataQualityObjectives: { type: 'object' },
        qaqcPlan: { type: 'object' },
        healthSafetyPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'sampling-plan']
}));

export const fieldInvestigationTask = defineTask('field-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Field Investigation',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Phase II Field Investigator',
      task: 'Conduct Phase II field investigation',
      context: args,
      instructions: [
        '1. Mobilize drilling/sampling equipment',
        '2. Install soil borings',
        '3. Collect soil samples',
        '4. Install monitoring wells if required',
        '5. Collect groundwater samples',
        '6. Conduct field screening (PID/FID)',
        '7. Document boring logs',
        '8. Document well construction',
        '9. Implement QA/QC procedures',
        '10. Document field activities'
      ],
      outputFormat: 'JSON with field data, boring logs, sample inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['fieldData', 'boringLogs', 'sampleInventory', 'artifacts'],
      properties: {
        fieldData: { type: 'object' },
        boringLogs: { type: 'array' },
        wellConstructionDetails: { type: 'array' },
        sampleInventory: { type: 'array' },
        fieldScreeningResults: { type: 'object' },
        qaqcSamples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'field-investigation']
}));

export const labAnalysisTask = defineTask('lab-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Laboratory Analysis',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Environmental Laboratory Coordinator',
      task: 'Coordinate laboratory analysis and data validation',
      context: args,
      instructions: [
        '1. Submit samples to certified laboratory',
        '2. Track sample custody',
        '3. Review preliminary data',
        '4. Validate laboratory data',
        '5. Review QA/QC results',
        '6. Flag data qualifiers',
        '7. Compile final analytical results',
        '8. Organize data by matrix and location',
        '9. Calculate summary statistics',
        '10. Document laboratory results'
      ],
      outputFormat: 'JSON with results, data validation, statistics'
    },
    outputSchema: {
      type: 'object',
      required: ['analyticalResults', 'dataValidation', 'summaryStatistics', 'artifacts'],
      properties: {
        analyticalResults: { type: 'object' },
        dataValidation: { type: 'object' },
        dataQualifiers: { type: 'array' },
        summaryStatistics: { type: 'object' },
        qaqcResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'laboratory']
}));

export const dataEvaluationTask = defineTask('data-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Evaluation',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Environmental Data Analyst',
      task: 'Evaluate investigation data against screening criteria',
      context: args,
      instructions: [
        '1. Compare results to screening levels',
        '2. Identify exceedances',
        '3. Evaluate contamination extent',
        '4. Assess affected media',
        '5. Evaluate migration potential',
        '6. Develop conceptual site model',
        '7. Identify data gaps',
        '8. Assess uncertainty',
        '9. Prepare data summary tables',
        '10. Document data evaluation'
      ],
      outputFormat: 'JSON with contamination status, exceedances, CSM'
    },
    outputSchema: {
      type: 'object',
      required: ['contaminationDetected', 'exceedances', 'affectedMedia', 'artifacts'],
      properties: {
        contaminationDetected: { type: 'boolean' },
        exceedances: { type: 'array' },
        affectedMedia: { type: 'array' },
        contaminationExtent: { type: 'object' },
        conceptualSiteModel: { type: 'object' },
        dataGaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'data-evaluation']
}));

export const delineationTask = defineTask('delineation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Contamination Delineation',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'Site Delineation Specialist',
      task: 'Delineate extent of contamination',
      context: args,
      instructions: [
        '1. Plan additional sampling locations',
        '2. Conduct step-out sampling',
        '3. Delineate horizontal extent',
        '4. Delineate vertical extent',
        '5. Define contamination plume',
        '6. Estimate contaminant mass',
        '7. Prepare iso-concentration maps',
        '8. Finalize conceptual site model',
        '9. Assess remediation implications',
        '10. Document delineation results'
      ],
      outputFormat: 'JSON with delineation results, plume maps, mass estimates'
    },
    outputSchema: {
      type: 'object',
      required: ['delineationComplete', 'horizontalExtent', 'verticalExtent', 'artifacts'],
      properties: {
        delineationComplete: { type: 'boolean' },
        horizontalExtent: { type: 'object' },
        verticalExtent: { type: 'object' },
        contaminantMass: { type: 'object' },
        plumeDimensions: { type: 'object' },
        conceptualSiteModel: { type: 'object' },
        remediationImplications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'delineation']
}));

export const assessmentReportTask = defineTask('assessment-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assessment Report',
  agent: {
    name: 'remediation-specialist',
    prompt: {
      role: 'ESA Report Writer',
      task: 'Prepare comprehensive ESA report',
      context: args,
      instructions: [
        '1. Compile executive summary',
        '2. Document methodology',
        '3. Present site description',
        '4. Summarize records review',
        '5. Summarize site reconnaissance',
        '6. Present investigation results',
        '7. Document findings and conclusions',
        '8. Provide recommendations',
        '9. Include supporting documentation',
        '10. Finalize report per ASTM standards'
      ],
      outputFormat: 'JSON with report path, next steps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'nextSteps', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        conclusions: { type: 'array' },
        nextSteps: { type: 'array' },
        recommendations: { type: 'array' },
        limitations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'esa', 'reporting']
}));
